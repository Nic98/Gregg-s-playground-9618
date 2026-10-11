import { describe, expect, it } from 'vitest';
import {
  boundaryStructure,
  emptyStructure,
  operateStructure,
  structureIndices,
  structureIsEmpty,
  structureIsFull,
  structureValues,
  type StructureKind,
} from '../src/demos/arrayStructures';

describe('1-based queue and stack models', () => {
  it.each(['linear', 'circular', 'stack'] as StructureKind[])(
    '%s protects empty and full boundaries without accessing index 0',
    (kind) => {
      let state = emptyStructure(kind);
      const blocked = operateStructure(state, 'remove');
      expect(blocked.last?.ok).toBe(false);
      expect([blocked.front, blocked.rear, blocked.top, blocked.count]).toEqual(
        [1, 0, 0, 0],
      );
      for (const item of ['A', 'B', 'C', 'D', 'E'])
        state = operateStructure(state, 'insert', item);
      expect(structureIsFull(state)).toBe(true);
      expect(state.cells[0]).toBe(null);
    expect(structureIndices(state).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
      const overflow = operateStructure(state, 'insert', 'F');
      expect(overflow.last?.ok).toBe(false);
      expect(overflow.cells).toEqual(state.cells);
      expect(overflow.count).toBe(5);
    },
  );
  it('linear queue strands released space and never wraps or auto-resets', () => {
    let state = boundaryStructure('linear');
    expect(structureValues(state)).toEqual(['C', 'D', 'E']);
    expect([state.front, state.rear, state.count]).toEqual([3, 5, 3]);
    expect(structureIsFull(state)).toBe(true);
    expect(operateStructure(state, 'insert', 'F').last?.ok).toBe(false);
    for (const value of ['C', 'D', 'E']) {
      state = operateStructure(state, 'remove');
      expect(state.last?.value).toBe(value);
    }
    expect([state.front, state.rear, state.count]).toEqual([6, 5, 0]);
    expect(structureIsEmpty(state)).toBe(true);
    expect(structureIsFull(state)).toBe(true);
    expect(operateStructure(state, 'remove').last?.ok).toBe(false);
    expect(operateStructure(state, 'insert', 'F').last?.ok).toBe(false);
  });
  it('circular queue preserves FIFO across both pointer wraps and many reuse cycles', () => {
    let state = boundaryStructure('circular');
    expect([state.front, state.rear, state.count]).toEqual([3, 1, 4]);
    expect(structureValues(state)).toEqual(['C', 'D', 'E', 'F']);
    state = operateStructure(state, 'insert', 'G');
    expect(structureIsFull(state)).toBe(true);
    for (const value of ['C', 'D', 'E', 'F', 'G']) {
      state = operateStructure(state, 'remove');
      expect(state.last?.value).toBe(value);
    }
    expect(structureIsEmpty(state)).toBe(true);
    for (let n = 0; n < 40; n++) {
      state = operateStructure(state, 'insert', String(n));
      state = operateStructure(state, 'remove');
      expect(state.last?.value).toBe(String(n));
      expect(state.front).toBeGreaterThanOrEqual(1);
      expect(state.front).toBeLessThanOrEqual(5);
      expect(state.rear).toBeGreaterThanOrEqual(1);
      expect(state.rear).toBeLessThanOrEqual(5);
      expect(state.cells[0]).toBe(null);
    }
  });
  it('stack pops in LIFO order and reuses its released top slot', () => {
    let state = boundaryStructure('stack');
    state = operateStructure(state, 'remove');
    expect(state.last?.value).toBe('E');
    state = operateStructure(state, 'insert', 'F');
    expect(state.cells[5]).toBe('F');
    for (const value of ['F', 'D', 'C', 'B', 'A']) {
      state = operateStructure(state, 'remove');
      expect(state.last?.value).toBe(value);
    }
    expect(state.top).toBe(0);
    expect(structureIsEmpty(state)).toBe(true);
  });
  it('rejects blank/oversized insertions without moving pointers', () => {
    for (const kind of ['linear', 'circular', 'stack'] as StructureKind[]) {
      for (const value of ['', '   ', '123456789']) {
        const state = operateStructure(emptyStructure(kind), 'insert', value);
        expect(state.last?.ok).toBe(false);
        expect(state.count).toBe(0);
        expect([state.front, state.rear, state.top]).toEqual([1, 0, 0]);
      }
    }
  });
});
