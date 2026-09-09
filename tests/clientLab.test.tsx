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
import ClientLabPage from '../src/pages/ClientLabPage';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
function openLab() {
  render(
    <MemoryRouter>
      <ClientLabPage />
    </MemoryRouter>,
  );
}
function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}
function player(mode: string) {
  return screen.getByTestId(`${mode}-player`).getAttribute('transform');
}

describe('thin and thick client classroom controls', () => {
  it('uses the delay slider to make the cloud screen trail a shared button input', () => {
    openLab();
    fireEvent.change(
      screen.getByRole('slider', { name: /Round-trip network delay/ }),
      {
        target: { value: '600' },
      },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Move right' }));
    advance(48);
    expect(player('local')).toBe('translate(100 60)');
    expect(player('cloud')).toBe('translate(60 60)');
    advance(620);
    expect(player('cloud')).toBe('translate(100 60)');
    expect(screen.getByTestId('cloud-latency').textContent).toBe('636 ms');
  });

  it('disconnects the cloud stream while keyboard controls keep the local game playable', () => {
    openLab();
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect network' }));
    fireEvent.keyDown(window, { key: 'd' });
    advance(200);
    expect(player('local')).toBe('translate(100 60)');
    expect(player('cloud')).toBe('translate(60 60)');
    expect(
      screen.getByText('Stream disconnected', { selector: 'strong' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reconnect network' }));
    advance(200);
    expect(screen.queryByText('Stream disconnected')).toBeNull();
    expect(player('cloud')).toBe('translate(60 60)');
  });

  it('completes the sample route on both sides and resets them without late moves', () => {
    openLab();
    fireEvent.change(screen.getByLabelText(/Client hardware/), {
      target: { value: 'basic' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run example route' }));
    advance(5200);
    expect(screen.getAllByText('All packets delivered ✓')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Reset both' }));
    advance(1000);
    expect(player('local')).toBe('translate(60 60)');
    expect(player('cloud')).toBe('translate(60 60)');
    expect(screen.queryAllByText('All packets delivered ✓')).toHaveLength(0);
  });

  it('stops automatic input on reset and leaves arrow keys available to form controls', () => {
    openLab();
    fireEvent.click(screen.getByRole('button', { name: 'Run example route' }));
    advance(150);
    fireEvent.click(screen.getByRole('button', { name: 'Reset both' }));
    fireEvent.keyDown(
      screen.getByRole('slider', { name: /Round-trip network delay/ }),
      {
        key: 'ArrowRight',
      },
    );
    advance(5000);
    expect(player('local')).toBe('translate(60 60)');
    expect(player('cloud')).toBe('translate(60 60)');
    expect(
      within(screen.getByRole('region', { name: 'Local gaming' })).getByText(
        'Ready for a move',
      ),
    ).toBeTruthy();
  });
});
