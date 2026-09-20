import {
  advanceCsma,
  backoffMaximum,
  changeWaits,
  createCsma,
  eventText,
  frameSlots,
  stationStatus,
  transmittingStations,
  type CsmaState,
} from './csma';

export type ScenePhase =
  | 'listen'
  | 'send'
  | 'collision'
  | 'jam'
  | 'wait'
  | 'done'
  | 'failed';
export interface SceneDevice {
  id: string;
  queued: number;
  wait: number;
  status: string;
}
export interface SceneBeat {
  phase: ScenePhase;
  duration: number;
  caption: string;
  devices: SceneDevice[];
  senders: number[];
  delivered: number;
  collisions: number;
  maximum: number;
  countdown?: boolean;
  slotSpan?: number;
  tick?: number;
}
export interface TimedBeat extends SceneBeat {
  start: number;
  end: number;
}
export function timeStory(beats: SceneBeat[]): TimedBeat[] {
  let start = 0;
  return beats.map((beat) => {
    const timed = { ...beat, start, end: start + beat.duration };
    start = timed.end;
    return timed;
  });
}
export function storyPosition(story: TimedBeat[], elapsed: number) {
  const index = story.findIndex((beat) => elapsed < beat.end);
  const beat = story[index < 0 ? story.length - 1 : index];
  return {
    beat,
    progress: Math.min(1, Math.max(0, (elapsed - beat.start) / beat.duration)),
  };
}
const forcedDraws = [
  1, 3, 2, 12, 6, 37, 18, 91, 33, 613, 74, 421, 98, 743, 302,
];
export function contentionStory(recoverAfter: number | null = null) {
  let state: CsmaState = createCsma();
  const beats: SceneBeat[] = [];
  while (beats.length < 140) {
    if (state.phase === 'retry-defer') {
      state = advanceCsma(state, 0.5, 0.5);
      continue;
    }
    if (state.phase === 'wait') {
      const draw = forcedDraws[state.collisions - 1];
      const sample = (draw + 0.1) / (backoffMaximum(state.collisions) + 1);
      state =
        recoverAfter !== null && state.collisions >= recoverAfter
          ? changeWaits(state, 0, 0.99, 'different')
          : changeWaits(state, sample, sample, 'equal');
    }
    const terminal = state.phase === 'success' || state.phase === 'failed';
    const phase: ScenePhase =
      state.phase === 'collision'
        ? 'collision'
        : state.phase === 'stop'
          ? 'jam'
          : state.phase === 'failed'
            ? 'failed'
            : state.phase === 'success'
              ? 'done'
              : state.phase === 'wait'
                ? 'wait'
                : transmittingStations(state).length
                  ? 'send'
                  : 'listen';
    const wait = state.backoff ? Math.min(state.backoff.a, state.backoff.b) : 0;
    const caption =
      phase === 'collision'
        ? 'CRASH! Neither frame can be used.'
        : phase === 'jam'
          ? 'JAM: stop sending. The receiver gets no useful data.'
          : phase === 'wait'
            ? `Wait again. The random range is now 0–${backoffMaximum(state.collisions)} slots.`
            : phase === 'failed'
              ? '16 failed attempts. These frames are abandoned.'
              : phase === 'done'
                ? 'Different waits let both frames get through.'
                : state.phase === 'retry-defer'
                  ? 'The wait ended, but the channel is busy. Keep waiting.'
                  : eventText(state).title;
    beats.push({
      phase,
      caption,
      duration:
        phase === 'wait'
          ? 1300 + Math.min(wait, 12) * 350
          : phase === 'send'
            ? 1800
            : 1300,
      devices: (['A', 'B'] as const).map((id) => ({
        id,
        queued:
          state.delivered.includes(id) || state.phase === 'failed' ? 0 : 1,
        wait:
          phase === 'wait' && state.backoff
            ? id === 'A'
              ? state.backoff.a
              : state.backoff.b
            : 0,
        status: stationStatus(state, id),
      })),
      senders: transmittingStations(state).map((id) => (id === 'A' ? 0 : 1)),
      delivered: state.delivered.length,
      collisions: state.collisions,
      maximum: backoffMaximum(state.collisions),
      countdown: phase === 'wait',
      slotSpan: phase === 'wait' ? wait : 0,
    });
    if (terminal) break;
    state = advanceCsma(state, 0.5, 0.5);
  }
  return timeStory(beats);
}

// Replay the countdowns on one shared time axis. A ready device defers until
// the current frame finishes; changing an urgency label never changes access.
export function priorityStory(a: number, b: number) {
  const waits = [a, b];
  const first = a < b ? 0 : 1;
  const second = 1 - first;
  const firstStart = Math.min(a, b);
  const secondStart = Math.max(waits[second], firstStart + frameSlots);
  const beats: SceneBeat[] = [];
  const make = (
    phase: ScenePhase,
    duration: number,
    caption: string,
    delivered: number,
    senders: number[],
    time: number,
  ): SceneBeat => ({
    phase,
    duration,
    caption,
    delivered,
    senders,
    collisions: 3,
    maximum: 7,
    slotSpan: phase === 'send' || phase === 'wait' ? duration / 650 : 0,
    devices: ['A', 'B'].map((id, index) => ({
      id,
      queued: delivered === 2 || (delivered === 1 && index === first) ? 0 : 1,
      wait: Math.max(0, waits[index] - time),
      status: waits[index] > time ? 'Back-off' : 'Listen before sending',
    })),
  });
  if (firstStart > 0)
    beats.push({
      ...make(
        'wait',
        firstStart * 650,
        'The countdown decides who can try first.',
        0,
        [],
        0,
      ),
      countdown: true,
    });
  if (a === b) {
    beats.push(
      make(
        'send',
        1800,
        'Same wait. Both devices start together.',
        0,
        [0, 1],
        a,
      ),
    );
    beats.push(
      make(
        'collision',
        1300,
        'Equal waits collide. Urgent does not break the tie.',
        0,
        [],
        a,
      ),
    );
    beats.push(
      make(
        'jam',
        1300,
        'Both abort and send jam. Neither frame arrives.',
        0,
        [],
        a,
      ),
    );
  } else {
    beats.push(
      make(
        'send',
        frameSlots * 650,
        `Device ${first ? 'B' : 'A'} got the shorter wait and sends first.`,
        0,
        [first],
        firstStart,
      ),
    );
    if (secondStart > firstStart + frameSlots)
      beats.push({
        ...make(
          'wait',
          (secondStart - firstStart - frameSlots) * 650,
          'One frame arrived. The other device is still waiting.',
          1,
          [],
          firstStart + frameSlots,
        ),
        countdown: true,
      });
    beats.push(
      make(
        'send',
        frameSlots * 650,
        'The second device sends only when its wait has ended AND the channel is idle.',
        1,
        [second],
        secondStart,
      ),
    );
    beats.push(
      make(
        'done',
        1300,
        'Access follows the random waits, not the urgency label.',
        2,
        [],
        secondStart + frameSlots,
      ),
    );
  }
  return timeStory(beats);
}
