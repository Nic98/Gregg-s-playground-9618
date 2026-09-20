import { describe, expect, it } from 'vitest';
import {
  advanceCsma,
  backoffMaximum,
  changeWaits,
  channelStatus,
  createCsma,
  stageIndex,
  stationStatus,
  transmittingStations,
  type CsmaState,
} from '../src/demos/csma';
const next = (state: CsmaState, a = 0, b = 0.99) => advanceCsma(state, a, b);
function firstWait() {
  let state = createCsma();
  for (let i = 0; i < 4; i++) state = next(state);
  return state;
}

describe('CSMA/CD protocol events', () => {
  it('does not transmit on a busy channel', () => {
    const busy = createCsma('busy');
    expect(next(busy)).toBe(busy);
    expect(transmittingStations(busy)).toEqual([]);
    expect(stationStatus(busy, 'A')).toBe('Listening: channel busy');
    expect(next({ ...busy, busy: false }).phase).toBe('transmit');
  });

  it('delivers a single sender’s frame without collision handling', () => {
    const sent = next(next(createCsma('single')));
    expect(sent.phase).toBe('success');
    expect(sent.delivered).toEqual(['A']);
    expect(sent.collisions).toBe(0);
    expect(sent.history).toEqual([]);
    expect(stageIndex(sent)).toBe(1);
  });

  it('aborts frames, jams, backs off, re-senses and defers a retry while the channel is occupied', () => {
    let state = next(next(createCsma()));
    expect(state.phase).toBe('collision');
    expect(state.delivered).toEqual([]);
    state = next(state);
    expect(channelStatus(state)).toBe('JAM SIGNAL');
    expect(transmittingStations(state)).toEqual([]);
    state = next(state);
    expect(state.backoff).toEqual({ collision: 1, maximum: 1, a: 0, b: 1 });
    state = next(state);
    expect(state.phase).toBe('retry-sense');
    expect(transmittingStations(state)).toEqual([]);
    expect(stationStatus(state, 'A')).toBe('Listen again: channel idle');
    state = next(state);
    expect(transmittingStations(state)).toEqual(['A']);
    state = next(state);
    expect(state.phase).toBe('retry-defer');
    expect(stationStatus(state, 'B')).toBe('Wait ended; channel busy');
    expect(transmittingStations(state)).toEqual(['A']);
    state = next(state);
    expect(state.delivered).toEqual(['A']);
    expect(transmittingStations(state)).toEqual(['B']);
    state = next(state);
    expect(state.phase).toBe('success');
    expect(state.delivered).toEqual(['A', 'B']);
    expect(state.collisions).toBe(1);
  });

  it('allows B to win the back-off instead of always favouring A', () => {
    let state = changeWaits(firstWait(), 0.99, 0, 'random');
    state = next(next(state));
    expect(transmittingStations(state)).toEqual(['B']);
    state = next(next(next(state)));
    expect(state.phase).toBe('success');
    expect(state.delivered).toEqual(['B', 'A']);
  });

  it('repeats collision handling for equal waits and widens the next random range', () => {
    let state = changeWaits(firstWait(), 0, 0.99, 'equal');
    state = next(next(next(state)));
    expect(state.phase).toBe('collision');
    expect(state.collisions).toBe(2);
    expect(state.delivered).toEqual([]);
    state = next(next(state));
    expect(state.backoff).toEqual({ collision: 2, maximum: 3, a: 0, b: 3 });
    expect(state.history).toHaveLength(2);
    state = next(next(next(state)));
    // B's longer wait ends after A's three-slot frame, so there is no busy-channel deferral.
    expect(state.phase).toBe('retry-second');
    expect(state.delivered).toEqual(['A']);
  });

  it('uses an expanding but capped range and abandons a frame after 16 collisions', () => {
    expect([1, 2, 3, 10, 11].map(backoffMaximum)).toEqual([
      1, 3, 7, 1023, 1023,
    ]);
    let state = createCsma();
    for (let i = 0; i < 150 && state.phase !== 'failed'; i++)
      state = next(state, 0, 0);
    expect(state.phase).toBe('failed');
    expect(state.collisions).toBe(16);
    expect(state.history).toHaveLength(15);
    expect(state.delivered).toEqual([]);
    expect(next(state)).toBe(state);
  });
});
