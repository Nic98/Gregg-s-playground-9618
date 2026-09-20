export type CsmaScenario = 'collision' | 'busy' | 'single';
export type Workstation = 'A' | 'B';
export type CsmaPhase =
  | 'listen'
  | 'transmit'
  | 'collision'
  | 'stop'
  | 'wait'
  | 'retry-sense'
  | 'retry-transmit'
  | 'retry-defer'
  | 'retry-second'
  | 'success'
  | 'failed';
export type WaitChoice = 'random' | 'equal' | 'different';
export interface Backoff {
  a: number;
  b: number;
  collision: number;
  maximum: number;
}
export interface CsmaState {
  scenario: CsmaScenario;
  phase: CsmaPhase;
  busy: boolean;
  collisions: number;
  backoff: Backoff | null;
  history: Backoff[];
  delivered: Workstation[];
}
export const csmaSteps = [
  {
    title: 'Listen',
    hint: 'Sense the channel',
    sentence: 'Workstations listen to the communication channel.',
  },
  {
    title: 'Transmit',
    hint: 'Only when idle',
    sentence:
      'They transmit data only when no other data is being transmitted: the line must be idle.',
  },
  {
    title: 'Detect collision',
    hint: 'Monitor while sending',
    sentence:
      'Workstations continue to monitor the channel and detect a collision if transmissions overlap.',
  },
  {
    title: 'Stop',
    hint: 'Abort and send jam',
    sentence:
      'If a collision is detected, data transmission is aborted and a jam signal is sent.',
  },
  {
    title: 'Wait',
    hint: 'Random back-off',
    sentence:
      'Each workstation chooses a random wait time. Further collisions increase the range of possible wait times.',
  },
  {
    title: 'Retransmit',
    hint: 'Listen again, then retry',
    sentence:
      'After waiting, each workstation listens again and retransmits when the channel is idle.',
  },
] as const;
export const frameSlots = 3;
export const attemptLimit = 16;
export function backoffMaximum(collisions: number) {
  return 2 ** Math.min(Math.max(collisions, 0), 10) - 1;
}
export function createCsma(scenario: CsmaScenario = 'collision'): CsmaState {
  return {
    scenario,
    phase: 'listen',
    busy: scenario === 'busy',
    collisions: 0,
    backoff: null,
    history: [],
    delivered: [],
  };
}
export function chooseBackoff(
  collisions: number,
  randomA: number,
  randomB: number,
  choice: WaitChoice = 'random',
): Backoff {
  const maximum = backoffMaximum(collisions);
  const pick = (sample: number) =>
    Math.min(maximum, Math.max(0, Math.floor(sample * (maximum + 1))));
  const a = pick(randomA);
  const b =
    choice === 'equal'
      ? a
      : choice === 'different'
        ? (a + 1) % (maximum + 1)
        : pick(randomB);
  return { a, b, collision: collisions, maximum };
}
export function changeWaits(
  state: CsmaState,
  randomA: number,
  randomB: number,
  choice: WaitChoice,
): CsmaState {
  if (state.phase !== 'wait') return state;
  const backoff = chooseBackoff(state.collisions, randomA, randomB, choice);
  return {
    ...state,
    backoff,
    history: [...state.history.slice(0, -1), backoff],
  };
}
export function firstSender(state: CsmaState): Workstation {
  return state.backoff && state.backoff.b < state.backoff.a ? 'B' : 'A';
}
export function secondSender(state: CsmaState): Workstation {
  return firstSender(state) === 'A' ? 'B' : 'A';
}
export function equalWaits(state: CsmaState) {
  return state.backoff !== null && state.backoff.a === state.backoff.b;
}
export function stageIndex(state: CsmaState) {
  const stages: Record<CsmaPhase, number> = {
    listen: 0,
    transmit: 1,
    collision: 2,
    stop: 3,
    wait: 4,
    'retry-sense': 5,
    'retry-transmit': 5,
    'retry-defer': 5,
    'retry-second': 5,
    success: state.collisions ? 5 : 1,
    failed: 3,
  };
  return stages[state.phase];
}
export function advanceCsma(
  state: CsmaState,
  randomA: number,
  randomB: number,
): CsmaState {
  switch (state.phase) {
    case 'listen':
      return state.busy ? state : { ...state, phase: 'transmit' };
    case 'transmit':
      return state.scenario === 'single'
        ? { ...state, phase: 'success', delivered: ['A'] }
        : { ...state, phase: 'collision', collisions: state.collisions + 1 };
    case 'collision':
      return { ...state, phase: 'stop' };
    case 'stop': {
      if (state.collisions >= attemptLimit)
        return { ...state, phase: 'failed' };
      const backoff = chooseBackoff(state.collisions, randomA, randomB);
      return {
        ...state,
        phase: 'wait',
        backoff,
        history: [...state.history, backoff],
      };
    }
    case 'wait':
      return { ...state, phase: 'retry-sense' };
    case 'retry-sense':
      return { ...state, phase: 'retry-transmit' };
    case 'retry-transmit': {
      if (equalWaits(state))
        return {
          ...state,
          phase: 'collision',
          collisions: state.collisions + 1,
          backoff: null,
        };
      const gap = Math.abs(state.backoff!.a - state.backoff!.b);
      return gap < frameSlots
        ? { ...state, phase: 'retry-defer' }
        : { ...state, phase: 'retry-second', delivered: [firstSender(state)] };
    }
    case 'retry-defer':
      return {
        ...state,
        phase: 'retry-second',
        delivered: [firstSender(state)],
      };
    case 'retry-second':
      return {
        ...state,
        phase: 'success',
        delivered: [firstSender(state), secondSender(state)],
      };
    default:
      return state;
  }
}
export function channelStatus(state: CsmaState) {
  if (state.busy) return 'BUSY';
  if (state.phase === 'collision') return 'COLLISION';
  if (state.phase === 'stop') return 'JAM SIGNAL';
  if (
    ['transmit', 'retry-transmit', 'retry-defer', 'retry-second'].includes(
      state.phase,
    )
  )
    return 'TRANSMITTING';
  return 'IDLE';
}
export function transmittingStations(state: CsmaState): Workstation[] {
  if (state.phase === 'transmit')
    return state.scenario === 'single' ? ['A'] : ['A', 'B'];
  if (state.phase === 'retry-transmit')
    return equalWaits(state) ? ['A', 'B'] : [firstSender(state)];
  if (state.phase === 'retry-defer') return [firstSender(state)];
  if (state.phase === 'retry-second') return [secondSender(state)];
  return [];
}
export function stationStatus(state: CsmaState, station: Workstation) {
  if (station === 'B' && state.scenario === 'single') return 'No frame queued';
  if (state.delivered.includes(station)) return 'Frame delivered';
  if (state.busy) return 'Listening: channel busy';
  if (state.phase === 'listen') return 'Listening: channel idle';
  if (state.phase === 'collision') return 'Collision detected';
  if (state.phase === 'stop') return 'Abort frame + send jam';
  if (state.phase === 'failed') return 'Retry limit reached';
  if (state.phase === 'wait')
    return `Random wait: ${station === 'A' ? state.backoff!.a : state.backoff!.b} slots`;
  if (transmittingStations(state).includes(station))
    return 'Transmitting frame';
  if (state.phase === 'retry-defer') return 'Wait ended; channel busy';
  if (
    state.phase === 'retry-sense' &&
    (equalWaits(state) || firstSender(state) === station)
  )
    return 'Listen again: channel idle';
  return 'Waiting to retry';
}
export function eventText(state: CsmaState): {
  title: string;
  body: string;
  rule: string;
} {
  const first = firstSender(state),
    second = secondSender(state);
  switch (state.phase) {
    case 'listen':
      return state.busy
        ? {
            title: 'Listen: the channel is busy',
            body: 'Another frame is already on the shared channel. A and B hear it and must wait. Neither starts transmitting.',
            rule: 'Carrier sense: listen before sending.',
          }
        : {
            title: 'Listen: the channel is idle',
            body:
              state.scenario === 'single'
                ? 'A has a frame ready. It listens and finds no data being transmitted.'
                : 'A and B each have a frame ready. Both listen and currently hear an idle channel.',
            rule: 'All workstations share the same communication channel.',
          };
    case 'transmit':
      return {
        title: 'Transmit on an idle channel',
        body:
          state.scenario === 'single'
            ? 'A starts sending its frame. B has nothing to send, so there is no competing transmission.'
            : 'A and B start almost together. Signals take time to travel, so neither has heard the other yet.',
        rule: 'Listen first, then transmit only if the line is idle.',
      };
    case 'collision':
      return {
        title: 'Detect the collision',
        body: `The signals overlap. A and B detect the collision while transmitting. This is collision ${state.collisions}; neither damaged frame has been delivered.`,
        rule: 'Collision detection continues during transmission.',
      };
    case 'stop':
      return {
        title: 'Stop the frames. Send a jam signal.',
        body: 'Both workstations abort their data frames and send a short jam signal so the other workstations recognise the collision. The damaged frames are discarded.',
        rule: 'The jam signal announces a collision; it is not a new data frame.',
      };
    case 'wait':
      return {
        title: 'Choose independent random waits',
        body: `After collision ${state.collisions}, each workstation chooses an integer from 0 to ${state.backoff!.maximum} and waits that many slot times. A chose ${state.backoff!.a}; B chose ${state.backoff!.b}.`,
        rule: 'More collisions widen the range. A particular random draw can still be shorter, or equal to another workstation’s draw.',
      };
    case 'retry-sense':
      return {
        title: 'Wait expires: listen again',
        body: equalWaits(state)
          ? `Both selected ${state.backoff!.a} slots. Their waits expire together, and both sense an idle channel again.`
          : `${first} has the shorter wait. Its timer expires first, and it checks that the channel is idle before retrying. ${second} is still waiting.`,
        rule: 'Finishing a random wait does not give permission to transmit on a busy channel.',
      };
    case 'retry-transmit':
      return equalWaits(state)
        ? {
            title: 'Both retry together',
            body: 'The equal random waits have put A and B back in contention at the same time. Their transmissions will collide again.',
            rule: 'Random back-off reduces the chance of another collision; it does not eliminate it.',
          }
        : {
            title: `${first} retransmits first`,
            body: `${first} found the channel idle and is now retransmitting its frame. ${second} has not started transmitting.`,
            rule: 'Retry only after waiting and listening again.',
          };
    case 'retry-defer':
      return {
        title: `${second} listens and defers`,
        body: `${second}’s wait has now expired, but ${first} is still transmitting. ${second} senses the busy channel and defers until it becomes idle.`,
        rule: 'A completed back-off timer does not override carrier sense.',
      };
    case 'retry-second':
      return {
        title: `${second} retransmits on the idle channel`,
        body: `${first}’s frame has been delivered. ${second}’s wait has expired, and after sensing an idle channel, it now sends its frame.`,
        rule: 'Frames can be delivered one at a time on the shared channel.',
      };
    case 'success':
      return state.scenario === 'single'
        ? {
            title: 'Frame delivered without a collision',
            body: 'A’s frame was transmitted successfully. No jam signal, random back-off or retransmission was needed.',
            rule: 'The collision-handling steps are used only when a collision occurs.',
          }
        : {
            title: 'Both frames delivered',
            body: 'A and B have both delivered their frames. Random back-off separated their retries, and carrier sense kept the later sender from interrupting the first.',
            rule: 'Listen → transmit → detect collision → stop → wait → retransmit.',
          };
    case 'failed':
      return {
        title: 'Retry limit reached',
        body: 'After 16 unsuccessful transmission attempts, these Ethernet frames are dropped and a failure is reported. Restart to try a new demonstration.',
        rule: 'Ethernet does not retry a damaged frame indefinitely.',
      };
  }
}
