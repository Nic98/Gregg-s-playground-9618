import { describe, expect, it } from 'vitest';
import {
  bounds,
  examples,
  exportSVG,
  initialDrawing,
  moved,
  newShape,
  parseSource,
  toSource,
} from '../src/model';

describe('vector descriptions', () => {
  it('preserves every object and property when classroom examples round-trip through SVG', () => {
    for (const e of examples)
      expect(parseSource(toSource(e.objects))).toEqual(e.objects);
  });
  it('keeps drawing order in the exported SVG and excludes editor guides', () => {
    const reversed = [...initialDrawing].reverse();
    const doc = new DOMParser().parseFromString(
      exportSVG(reversed),
      'image/svg+xml',
    );
    expect([...doc.documentElement.children].map((n) => n.id)).toEqual(
      reversed.map((o) => o.id),
    );
    expect(doc.querySelector('pattern')).toBeNull();
    expect(doc.documentElement.getAttribute('viewBox')).toBe('0 0 600 420');
  });
  it.each([
    '<script>alert(1)</script>',
    '<circle cx="20" cy="20" r="10" onclick="alert(1)"/>',
    '<image href="https://example.com/image.png"/>',
    '<!DOCTYPE svg><circle/>',
    '<rect x="0" y="0" width="-1" height="10"/>',
    '<circle cx="Infinity" cy="0" r="5"/>',
    '<circle cx="10" cy="10" r="5" fill="url(https://example.com)"/>',
    '<circle id="same" cx="1" cy="1" r="1"/><circle id="same" cx="1" cy="1" r="1"/>',
    '<circle cx="1" cy="1" r="1"><title>nested</title></circle>',
  ])('rejects unsupported or invalid input: %s', (source) => {
    expect(() => parseSource(source)).toThrow();
  });
  it('supports empty drawings, transparent fills and short hex colours', () => {
    expect(parseSource('')).toEqual([]);
    expect(
      parseSource('<circle cx="0" cy="0" r="0" fill="none" stroke="#abc"/>')[0]
        .props,
    ).toMatchObject({ fill: 'none', stroke: '#abc', r: 0 });
  });
  it('normalises backwards drags for rectangles and ellipses', () => {
    const rect = newShape('rect', 'a', { x: 100, y: 120 }, { x: 40, y: 60 });
    const ellipse = newShape(
      'ellipse',
      'b',
      { x: 100, y: 120 },
      { x: 40, y: 60 },
    );
    expect(bounds(rect)).toEqual({ x: 40, y: 60, width: 60, height: 60 });
    expect(bounds(ellipse)).toEqual(bounds(rect));
  });
  it('calculates a circle radius from its centre and preserves line endpoints when moved', () => {
    expect(
      newShape('circle', 'c', { x: 100, y: 100 }, { x: 130, y: 140 }).props.r,
    ).toBe(50);
    const line = newShape('line', 'l', { x: 20, y: 30 }, { x: 80, y: 90 });
    expect(moved(line, 10, -5).props).toMatchObject({
      x1: 30,
      y1: 25,
      x2: 90,
      y2: 85,
    });
    expect(line.props.x1).toBe(20);
  });
});
