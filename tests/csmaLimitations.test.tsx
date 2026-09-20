import '@testing-library/jest-dom/vitest';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import CsmaLimitations from '../src/components/CsmaLimitations';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }));
const tick = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });
const timeline = () =>
  screen.getByRole('slider', {
    name: 'Animation timeline',
  }) as HTMLInputElement;

describe('animated CSMA/CD disadvantages', () => {
  it('moves packets when playing and freezes both time and the SVG when paused', () => {
    const { container } = render(<CsmaLimitations />);
    click('Play animation');
    tick(1500);
    const elapsed = timeline().value;
    const picture = container.querySelector(
      '.csma-motion-stage svg',
    )!.innerHTML;
    expect(Number(elapsed)).toBeGreaterThan(0);
    click('Pause animation');
    tick(10000);
    expect(timeline().value).toBe(elapsed);
    expect(container.querySelector('.csma-motion-stage svg')!.innerHTML).toBe(
      picture,
    );
    click('Step forward');
    expect(Number(timeline().value)).toBeGreaterThan(Number(elapsed));
    click('Jump to retry limit');
    expect(screen.getByText('FRAME ABANDONED')).toBeTruthy();
    expect(
      screen.getByText('16 failed attempts. These frames are abandoned.'),
    ).toBeTruthy();
    expect(container.textContent).not.toMatch(/[\u3400-\u9fff]/);
  });
  it('can compare repeated jams with successful retry recovery', () => {
    render(<CsmaLimitations />);
    click('Repeated jams');
    for (let i = 0; i < 3; i++) click('Step forward');
    expect(screen.getAllByText('JAM SIGNAL').length).toBeGreaterThan(0);
    expect(screen.getByText('0 / 2')).toBeTruthy();
    click('Compare: different waits');
    fireEvent.change(timeline(), { target: { value: timeline().max } });
    expect(screen.getByText('2 / 2')).toBeTruthy();
  });
  it('does not change access order or restart playback when urgency changes', () => {
    render(<CsmaLimitations />);
    click('No priority');
    click('Pause animation');
    click('Step forward');
    const position = timeline().value;
    fireEvent.change(screen.getByLabelText('Urgent device'), {
      target: { value: 'B' },
    });
    expect(timeline().value).toBe(position);
    expect(screen.getByText(/Device B goes first/)).toBeTruthy();
    expect(screen.getByText(/shorter wait, not its urgent label/)).toBeTruthy();
  });
  it('animates load from zero and resets time and queues when settings change', () => {
    render(<CsmaLimitations />);
    click('More traffic');
    click('Busy network');
    expect(timeline().value).toBe('0');
    tick(5000);
    expect(Number(timeline().value)).toBeGreaterThan(0);
    click('Show end of run');
    expect(screen.getByText('600 / 600')).toBeTruthy();
    const counters = screen.getByText(
      'Frames awaiting delivery',
    ).parentElement!;
    expect(
      Number(counters.querySelector('strong')!.textContent),
    ).toBeGreaterThan(100);
    click('Quiet network');
    expect(timeline().value).toBe('0');
    expect(
      screen
        .getByText('Frames awaiting delivery')
        .parentElement!.querySelector('strong')!.textContent,
    ).toBe('0');
  });
  it('cancels the previous replay when switching experiments', () => {
    render(<CsmaLimitations />);
    click('Play animation');
    tick(3000);
    click('No priority');
    click('Pause animation');
    tick(10000);
    expect(timeline().value).toBe('0');
  });
});
