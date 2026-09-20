import '@testing-library/jest-dom/vitest';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import CsmaLimitations from '../src/components/CsmaLimitations';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const choose = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }));

describe('CSMA/CD disadvantage experiments', () => {
  it('caps back-off and stops the frame after 16 failed attempts', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { container } = render(<CsmaLimitations />);
    for (let i = 1; i < 10; i++) choose('Force another collision');
    expect(screen.getByText('0–1023 slots')).toBeTruthy();
    choose('Force another collision');
    expect(screen.getByText('0–1023 slots')).toBeTruthy();
    for (let i = 11; i < 16; i++) choose('Force another collision');
    expect(screen.getByText('Abandoned')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /Force another collision/ }),
    ).toBeDisabled();
    expect(screen.getByRole('status').textContent).toContain(
      'not retried forever',
    );
    choose('Reset waits');
    expect(screen.getByText('1 / 16')).toBeTruthy();
    expect(container.textContent).not.toMatch(/[\u3400-\u9fff]/);
  });
  it('shows jam episodes without delivery and allows recovery through different waits', () => {
    render(<CsmaLimitations />);
    choose('Repeated jams');
    for (let i = 0; i < 3; i++) choose('Next channel event');
    expect(screen.getByText('JAM SIGNAL')).toBeTruthy();
    expect(screen.getByText('0 / 2')).toBeTruthy();
    choose('Next channel event');
    choose('Separate the retries');
    for (let i = 0; i < 5; i++) choose('Next channel event');
    expect(screen.getByText('2 / 2')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /Next channel event/ }),
    ).toBeDisabled();
  });
  it('keeps access order unchanged when only urgency changes and explains ties', () => {
    render(<CsmaLimitations />);
    choose('No priority');
    expect(screen.getByRole('status').textContent).toContain(
      'Device B retries first (routine)',
    );
    fireEvent.change(screen.getByLabelText('Device carrying urgent data'), {
      target: { value: 'B' },
    });
    expect(screen.getByRole('status').textContent).toContain(
      'Device B retries first (urgent)',
    );
    vi.spyOn(Math, 'random').mockReturnValue(0);
    choose('Draw new waits');
    expect(screen.getByRole('status').textContent).toContain('Equal waits');
  });
  it('updates network results and clears heavy queues when selecting the quiet preset', () => {
    render(<CsmaLimitations />);
    choose('More traffic');
    choose('Busy network');
    const table = screen.getByRole('table');
    const row = within(table).getByRole('row', {
      name: /Frames still waiting/,
    });
    const cells = within(row).getAllByRole('cell');
    expect(Number(cells[1].textContent)).toBeGreaterThan(
      Number(cells[0].textContent),
    );
    choose('Quiet network');
    const quietCells = within(
      screen.getByRole('row', { name: /Frames still waiting/ }),
    ).getAllByRole('cell');
    expect(quietCells[1].textContent).toBe(quietCells[0].textContent);
  });
});
