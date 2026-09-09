import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import VectorStudioPage from '../src/pages/VectorStudioPage';
import { MemoryRouter } from 'react-router-dom';
function App() {
  return (
    <MemoryRouter>
      <VectorStudioPage />
    </MemoryRouter>
  );
}
afterEach(cleanup);

describe('classroom learning interactions', () => {
  it('links property editing to the actual drawing and source list, and can undo it', () => {
    const { container } = render(<App />);
    fireEvent.change(screen.getByLabelText('Radius'), {
      target: { value: '100' },
    });
    expect(
      container.querySelector('[data-object="sun"] circle')?.getAttribute('r'),
    ).toBe('100');
    expect(
      (
        screen.getByLabelText(
          'Editable SVG drawing list',
        ) as HTMLTextAreaElement
      ).value,
    ).toContain('r="100"');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(
      container.querySelector('[data-object="sun"] circle')?.getAttribute('r'),
    ).toBe('78');
  });
  it('replays the drawing list in order, then uses list reordering to change rendering order', () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Rewind' }));
    expect(container.querySelectorAll('[data-object]')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Draw next' }));
    expect(
      container.querySelector('[data-object]')?.getAttribute('data-object'),
    ).toBe('card');
    fireEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(
      [...container.querySelectorAll('[data-object]')].map((n) =>
        n.getAttribute('data-object'),
      ),
    ).toEqual(['sun', 'card', 'orbit', 'line']);
  });
  it('keeps the existing image after invalid syntax and applies valid syntax atomically', () => {
    const { container } = render(<App />);
    const editor = screen.getByLabelText('Editable SVG drawing list');
    fireEvent.change(editor, {
      target: { value: '<script>alert(1)</script>' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply drawing' }));
    expect(screen.getByRole('alert').textContent).toContain('not supported');
    expect(container.querySelectorAll('[data-object]')).toHaveLength(4);
    fireEvent.change(editor, {
      target: {
        value: '<circle id="test" cx="40" cy="50" r="20" fill="#abc"/>',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply drawing' }));
    expect(container.querySelectorAll('[data-object]')).toHaveLength(1);
    expect(
      container
        .querySelector('[data-object="test"] circle')
        ?.getAttribute('fill'),
    ).toBe('#abc');
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('creates a keyboard-accessible blank drawing and adds a new object from the syntax example', () => {
    const { container } = render(<App />);
    fireEvent.change(screen.getByLabelText('Load example'), {
      target: { value: 'blank' },
    });
    expect(container.querySelectorAll('[data-object]')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Add a circle' }));
    expect(container.querySelectorAll('[data-object]')).toHaveLength(1);
    const canvas = screen.getByRole('application');
    const before = Number(
      container.querySelector('[data-object] circle')?.getAttribute('cx'),
    );
    fireEvent.keyDown(canvas, { key: 'ArrowRight', shiftKey: true });
    expect(
      Number(
        container.querySelector('[data-object] circle')?.getAttribute('cx'),
      ),
    ).toBe(before + 10);
  });
});
