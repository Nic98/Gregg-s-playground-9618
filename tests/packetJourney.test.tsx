import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';
import { journey } from '../src/pages/PacketJourneyPage';
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
function open() {
  vi.stubGlobal('scrollTo', vi.fn());
  render(
    <MemoryRouter initialEntries={['/chapters/2/packet-frame-journey']}>
      <App />
    </MemoryRouter>,
  );
}
function jump(value: number) {
  fireEvent.change(screen.getByRole('slider'), {
    target: { value: String(value) },
  });
}
describe('Packet and frame journey', () => {
  it('keeps switch forwarding unchanged and replaces the frame on routing', () => {
    open();
    jump(5);
    expect(screen.getByText('Dst MAC 02:00:00:00:01:01')).toBeTruthy();
    expect(screen.getByText('TTL 64')).toBeTruthy();
    jump(6);
    expect(screen.queryByText('Ethernet header')).toBeNull();
    jump(8);
    expect(screen.getByText('Dst MAC 02:00:00:00:02:20')).toBeTruthy();
    expect(screen.getByText('Src MAC 02:00:00:00:02:01')).toBeTruthy();
    expect(screen.getByText('192.168.1.10 → 192.0.2.20')).toBeTruthy();
    expect(screen.getByText('TTL 63')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Ethernet header/ }));
    expect(screen.getByText(/EtherType 0x0800 表示/)).toBeTruthy();
  });
  it('uses the final host MAC for same-subnet delivery without a router or TTL reduction', () => {
    open();
    jump(8);
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'local' },
    });
    expect(screen.getByRole('slider').getAttribute('max')).toBe(
      String(journey(false).length - 1),
    );
    expect(
      screen.getByRole('heading', { name: 'Create application data' }),
    ).toBeTruthy();
    jump(3);
    expect(screen.getByText('Dst MAC 02:00:00:00:02:20')).toBeTruthy();
    expect(screen.getByText('192.168.1.10 → 192.168.1.20')).toBeTruthy();
    expect(screen.queryByText('Router')).toBeNull();
    expect(journey(false).every((s) => s.ttl === 64)).toBe(true);
  });
  it('plays, pauses, resets and completes decapsulation', () => {
    vi.useFakeTimers();
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    jump(journey(true).length - 1);
    expect(screen.getByText('Application data')).toBeTruthy();
    expect(screen.queryByText('IPv4 header')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Next' }).hasAttribute('disabled'),
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Reset journey' }));
    expect(
      screen.getByRole('heading', { name: 'Create application data' }),
    ).toBeTruthy();
  });
});
