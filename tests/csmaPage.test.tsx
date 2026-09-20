import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CsmaCdPage from '../src/pages/CsmaCdPage';

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
function openDemo() {
  return render(
    <MemoryRouter>
      <CsmaCdPage />
    </MemoryRouter>,
  );
}
function advance(times = 1) {
  for (let i = 0; i < times; i++)
    fireEvent.click(screen.getByRole('button', { name: 'Next event' }));
}

describe('English CSMA/CD classroom demo', () => {
  it('shows the six requested steps and completes recovery with different waits', () => {
    const { container } = openDemo();
    const steps = within(
      screen.getByRole('list', { name: 'Six steps of CSMA/CD' }),
    );
    expect(steps.getAllByRole('listitem')).toHaveLength(6);
    for (const title of [
      'Listen',
      'Transmit',
      'Detect collision',
      'Stop',
      'Wait',
      'Retransmit',
    ])
      expect(steps.getByText(title)).toBeTruthy();
    expect(container.textContent).not.toMatch(/[\u3400-\u9fff]/);
    advance(3);
    expect(
      screen.getByRole('heading', {
        name: 'Stop the frames. Send a jam signal.',
      }),
    ).toBeTruthy();
    advance();
    expect(
      screen.getByRole('heading', { name: 'Choose independent random waits' }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Use different waits' }),
    );
    advance(5);
    expect(
      screen.getByRole('heading', { name: 'Both frames delivered' }),
    ).toBeTruthy();
    expect(screen.getByText('2 / 2')).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Next event' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(container.textContent).not.toMatch(/[\u3400-\u9fff]/);
  });

  it('lets a teacher force a repeat collision and inspect the expanded back-off range', () => {
    openDemo();
    advance(4);
    fireEvent.click(screen.getByRole('button', { name: 'Force equal waits' }));
    advance(3);
    expect(
      screen.getByRole('heading', { name: 'Detect the collision' }),
    ).toBeTruthy();
    expect(screen.getByText('2 collisions')).toBeTruthy();
    advance(2);
    expect(screen.getAllByText('0–3 slots').length).toBeGreaterThan(0);
    expect(
      within(
        screen.getByRole('table', { name: 'Back-off choices in this run' }),
      ).getAllByRole('row'),
    ).toHaveLength(3);
  });

  it('blocks transmission while busy and supports the no-collision comparison', () => {
    openDemo();
    fireEvent.change(screen.getByLabelText('Scenario'), {
      target: { value: 'busy' },
    });
    expect(
      (screen.getByRole('button', { name: 'Next event' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole('button', { name: 'Play' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    fireEvent.click(
      screen.getByRole('button', { name: 'Make the channel idle' }),
    );
    advance();
    expect(
      screen.getByRole('heading', { name: 'Transmit on an idle channel' }),
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Scenario'), {
      target: { value: 'single' },
    });
    advance(2);
    expect(
      screen.getByRole('heading', {
        name: 'Frame delivered without a collision',
      }),
    ).toBeTruthy();
    expect(screen.getAllByText('Not needed this time')).toHaveLength(4);
  });

  it('pauses autoplay and cancels a queued advance when restarting', () => {
    openDemo();
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(
      screen.getByRole('heading', { name: 'Transmit on an idle channel' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(
      screen.getByRole('heading', { name: 'Transmit on an idle channel' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }));
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(
      screen.getByRole('heading', { name: 'Listen: the channel is idle' }),
    ).toBeTruthy();
    expect(screen.getByText('0 collisions')).toBeTruthy();
  });
});
