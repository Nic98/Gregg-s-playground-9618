import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function open(path: string) {
  vi.stubGlobal('scrollTo', vi.fn());
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
describe('queue and stack teaching pages', () => {
  it.each(['Linear Queue', 'Circular Queue', 'Stack'])(
    'launches %s from section 10.4 with 1-based labels',
    (title) => {
      open('/chapters/10');
      const section = screen.getByRole('region', {
        name: 'Introduction to Abstract Data Types (ADT)',
      });
      fireEvent.click(
        within(section).getByRole('link', { name: `Open ${title}` }),
      );
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        title,
      );
      for (let i = 1; i <= 5; i++)
        expect(screen.getByText(`[${i}]`)).toBeInTheDocument();
      expect(screen.queryByText('[0]')).toBeNull();
      expect(screen.getByRole('link', { name: /Chapter 10/ })).toHaveAttribute(
        'href',
        '/chapters/10#section-10-4',
      );
    },
  );
  it('shows stranded linear space and an explicit reset to front 1/rear 0', () => {
    open('/chapters/10/linear-queue');
    fireEvent.click(
      screen.getByRole('button', { name: /Show stranded space/ }),
    );
    expect(screen.getByTestId('count')).toHaveTextContent('3 / 5');
    expect(screen.getByTestId('full')).toHaveTextContent('TRUE');
    fireEvent.click(screen.getByRole('button', { name: 'Enqueue' }));
    expect(screen.getByRole('status')).toHaveTextContent('Overflow');
    fireEvent.click(screen.getByRole('button', { name: /Reset empty/ }));
    expect(screen.getByTestId('front')).toHaveTextContent('1');
    expect(screen.getByTestId('rear')).toHaveTextContent('0');
    expect(screen.getByTestId('empty')).toHaveTextContent('TRUE');
    fireEvent.click(screen.getByRole('button', { name: 'Dequeue' }));
    expect(screen.getByRole('status')).toHaveTextContent('Underflow');
  });
  it('returns the last stack item and resets state when changing demos', () => {
    open('/chapters/10/stack');
    fireEvent.change(screen.getByLabelText('New item'), {
      target: { value: 'Z' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Push' }));
    expect(screen.getByTestId('top')).toHaveTextContent('4');
    fireEvent.click(screen.getByRole('button', { name: 'Pop' }));
    expect(screen.getByRole('status')).toHaveTextContent('Returned: Z');
    fireEvent.click(screen.getByRole('link', { name: 'Circular Queue' }));
    expect(screen.getByTestId('front')).toHaveTextContent('1');
    expect(screen.getByTestId('rear')).toHaveTextContent('3');
    fireEvent.click(screen.getByRole('button', { name: /Show wrap-around/ }));
    expect(screen.getByTestId('front')).toHaveTextContent('3');
    expect(screen.getByTestId('rear')).toHaveTextContent('1');
    expect(screen.getByText('C → D → E → F')).toBeInTheDocument();
  });
});
