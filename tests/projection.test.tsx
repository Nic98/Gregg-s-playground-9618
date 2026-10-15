import React from 'react';
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import {
  ProjectionProvider,
  ProjectionToolbar,
  projectionStorageKey,
  readProjectionPreferences,
} from '../src/components/ProjectionSettings';
import {
  PlaybackVisibility,
  useAnimation,
} from '../src/components/CsmaAnimation';
import SubnettingPage from '../src/pages/SubnettingPage';

const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }));
function Clock() {
  const clock = useAnimation(10000);
  return (
    <>
      <output data-testid="time">{clock.elapsed}</output>
      <output data-testid="speed">{clock.speed}</output>
      <button onClick={clock.toggle}>
        {clock.active ? 'Pause clock' : 'Start clock'}
      </button>
      <button onClick={() => clock.setSpeed(2)}>Double speed</button>
    </>
  );
}
function Display({ children }: { children?: React.ReactNode }) {
  return (
    <ProjectionProvider>
      <ProjectionToolbar />
      {children}
    </ProjectionProvider>
  );
}
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
describe('projector display preferences', () => {
  it('saves both themes and restores the standard view without discarding preferences', () => {
    const view = render(<Display />);
    click('Display settings');
    click('Light contrast');
    expect(document.documentElement).toHaveAttribute(
      'data-projection',
      'light',
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /Classroom layout/ }));
    expect(document.documentElement).toHaveAttribute('data-classroom', 'false');
    view.unmount();
    render(<Display />);
    expect(document.documentElement).toHaveAttribute(
      'data-projection',
      'light',
    );
    expect(document.documentElement).toHaveAttribute('data-classroom', 'false');
    click('Display settings');
    click('Dark contrast');
    click('Standard');
    expect(document.documentElement).not.toHaveAttribute('data-projection');
    expect(document.documentElement).not.toHaveAttribute('data-low-load');
    expect(
      JSON.parse(localStorage.getItem(projectionStorageKey)!),
    ).toMatchObject({ theme: 'off', classroom: false });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(
      screen.getByRole('button', { name: 'Display settings' }),
    ).toHaveFocus();
  });
  it('validates stored values and works with unavailable browser storage', () => {
    localStorage.setItem(projectionStorageKey, '{broken');
    expect(readProjectionPreferences().theme).toBe('off');
    localStorage.setItem(
      projectionStorageKey,
      JSON.stringify({ theme: 'unknown', classroom: 'false', lowLoad: 0 }),
    );
    expect(readProjectionPreferences()).toEqual({
      theme: 'off',
      classroom: true,
      lowLoad: true,
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<Display />);
    click('Display settings');
    click('Dark contrast');
    expect(document.documentElement).toHaveAttribute('data-projection', 'dark');
  });
  it('keeps elapsed time, pause state and chosen speed when changing theme or redraw frequency', () => {
    vi.useFakeTimers();
    render(
      <Display>
        <Clock />
      </Display>,
    );
    click('Display settings');
    click('Dark contrast');
    click('Start clock');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('time')).toHaveTextContent('500');
    fireEvent.click(
      screen.getByRole('checkbox', { name: /Low-load animations/ }),
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(Number(screen.getByTestId('time').textContent)).toBeCloseTo(995, 0);
    click('Pause clock');
    click('Light contrast');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('time')).toHaveTextContent('995');
    click('Double speed');
    click('Standard');
    expect(screen.getByTestId('speed')).toHaveTextContent('2');
    expect(screen.getByTestId('time')).toHaveTextContent('995');
  });
  it('suspends a hidden experiment and resumes from the same position', () => {
    vi.useFakeTimers();
    const view = render(
      <Display>
        <PlaybackVisibility value={true}>
          <Clock />
        </PlaybackVisibility>
      </Display>,
    );
    click('Start clock');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const time = screen.getByTestId('time').textContent;
    view.rerender(
      <Display>
        <PlaybackVisibility value={false}>
          <Clock />
        </PlaybackVisibility>
      </Display>,
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('time').textContent).toBe(time);
    view.rerender(
      <Display>
        <PlaybackVisibility value={true}>
          <Clock />
        </PlaybackVisibility>
      </Display>,
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(Number(screen.getByTestId('time').textContent)).toBeGreaterThan(
      Number(time),
    );
  });
  it('synchronises the embedded lab on load and setting changes without reloading its content', () => {
    render(
      <MemoryRouter>
        <Display>
          <SubnettingPage />
        </Display>
      </MemoryRouter>,
    );
    const iframe = screen.getByTitle(
      'AS 9618 Subnetting Lab',
    ) as HTMLIFrameElement;
    const doc = iframe.contentDocument!;
    const html = doc.createElement('html');
    html.append(doc.createElement('head'), doc.createElement('body'));
    doc.replaceChildren(html);
    fireEvent.load(iframe);
    const input = doc.createElement('input');
    input.value = '192.168.3.9';
    doc.body.append(input);
    click('Display settings');
    click('Dark contrast');
    expect(doc.documentElement).toHaveAttribute('data-projection', 'dark');
    fireEvent.load(iframe);
    expect(doc.querySelectorAll('#projection-styles')).toHaveLength(1);
    expect(
      doc.querySelector<HTMLLinkElement>('#projection-styles')!.href,
    ).toMatch(/\/projection.css$/);
    click('Light contrast');
    expect(doc.documentElement).toHaveAttribute('data-projection', 'light');
    click('Standard');
    expect(doc.documentElement).not.toHaveAttribute('data-projection');
    expect(input.value).toBe('192.168.3.9');
  });
});
