import { describe, expect, it } from 'vitest';
import { simulateLoad } from '../src/demos/csmaLoad';

describe('CSMA/CD load experiment', () => {
  it('does not invent collisions or traffic for idle devices', () => {
    const result = simulateLoad(24, 0);
    expect(result.generated).toBe(0);
    expect(result.collisions).toBe(0);
    expect(result.averageDelay).toBeNull();
    expect(result.timeline.every((tick) => tick === 'idle')).toBe(true);
  });
  it('serialises one sender’s frames without collisions', () => {
    const result = simulateLoad(1, 100, 7, 60);
    expect(result.generated).toBe(60);
    expect(result.delivered).toBe(10);
    expect(result.pending).toBe(50);
    expect(result.collisions).toBe(0);
    expect(result.timeline.every((tick) => tick === 'data')).toBe(true);
  });
  it('accounts for every frame and emits a jam after each collision', () => {
    for (const [count, rate, ticks] of [
      [2, 2, 600],
      [20, 12, 600],
      [24, 100, 4000],
    ]) {
      const result = simulateLoad(count, rate, 7, ticks);
      expect(result.generated).toBe(
        result.delivered + result.pending + result.dropped,
      );
      expect(result.timeline).toHaveLength(ticks);
      result.timeline.forEach((event, index) => {
        if (event === 'collision' && index + 1 < ticks)
          expect(result.timeline[index + 1]).toBe('jam');
        if (event === 'jam')
          expect(result.timeline[index - 1]).toBe('collision');
      });
      expect(result.devices.every((device) => device.attempts < 16)).toBe(true);
      expect(
        result.devices.reduce((sum, device) => sum + device.delivered, 0),
      ).toBe(result.delivered);
    }
    expect(simulateLoad(24, 100, 7, 4000).dropped).toBeGreaterThan(0);
  });
  it('makes heavy contention visible without fabricating an inverse throughput formula', () => {
    const quiet = simulateLoad(2, 2);
    const busy = simulateLoad(20, 12);
    expect(busy.collisions).toBeGreaterThan(quiet.collisions);
    expect(busy.pending).toBeGreaterThan(quiet.pending);
    expect(busy.averageDelay!).toBeGreaterThan(quiet.averageDelay!);
    expect(busy.delivered / busy.generated).toBeLessThan(
      quiet.delivered / quiet.generated,
    );
    expect(simulateLoad(20, 12)).toEqual(busy);
  });
});
