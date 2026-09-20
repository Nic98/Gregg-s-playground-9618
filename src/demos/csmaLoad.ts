import { attemptLimit, backoffMaximum } from './csma';

export type ChannelTick = 'idle' | 'data' | 'collision' | 'jam';
export interface LoadDevice {
  id: number;
  queue: number[];
  attempts: number;
  readyAt: number;
  delivered: number;
  dropped: number;
}
export interface LoadSnapshot {
  phase: ChannelTick;
  senders: number[];
  progress: number;
  queues: number[];
  waits: number[];
  delivered: number;
  generated: number;
  pending: number;
  dropped: number;
  collisions: number;
  averageDelay: number | null;
}
export interface LoadResult {
  snapshots: LoadSnapshot[];
  devices: LoadDevice[];
  timeline: ChannelTick[];
  generated: number;
  delivered: number;
  dropped: number;
  pending: number;
  collisions: number;
  averageDelay: number | null;
  ticks: number;
}

// A reproducible, compressed contention model, not Ethernet timing or a benchmark.
// A tick groups simultaneous starts into one propagation window. Frames occupy
// six ticks; collision and jam each occupy one. Back-off time elapses even while
// busy, but every retry must sense an idle channel before starting.
export function simulateLoad(
  deviceCount: number,
  framesPer100Ticks: number,
  seed = 7,
  ticks = 600,
): LoadResult {
  let randomState = seed >>> 0;
  const random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 4294967296;
  };
  const devices: LoadDevice[] = Array.from(
    { length: deviceCount },
    (_, id) => ({
      id,
      queue: [],
      attempts: 0,
      readyAt: 0,
      delivered: 0,
      dropped: 0,
    }),
  );
  const timeline: ChannelTick[] = [];
  let generated = 0;
  let collisions = 0;
  let delivered = 0;
  let dropped = 0;
  let totalDelay = 0;
  let sender: LoadDevice | null = null;
  let dataTicksLeft = 0;
  let jamPending = false;
  let colliders: number[] = [];
  const snapshots: LoadSnapshot[] = [];
  const record = (
    phase: ChannelTick,
    time: number,
    senders: number[] = [],
    progress = 0,
  ) =>
    snapshots.push({
      phase,
      senders,
      progress,
      queues: devices.map((device) => device.queue.length),
      waits: devices.map((device) =>
        device.queue.length ? Math.max(0, device.readyAt - time - 1) : 0,
      ),
      delivered,
      generated,
      dropped,
      collisions,
      pending: devices.reduce((sum, device) => sum + device.queue.length, 0),
      averageDelay: delivered ? totalDelay / delivered : null,
    });

  for (let time = 0; time < ticks; time++) {
    for (const device of devices) {
      if (random() < framesPer100Ticks / 100) {
        device.queue.push(time);
        generated++;
      }
    }
    if (jamPending) {
      timeline.push('jam');
      record('jam', time, colliders);
      jamPending = false;
      continue;
    }
    if (!sender) {
      const ready = devices.filter(
        (device) => device.queue.length && device.readyAt <= time,
      );
      if (ready.length > 1) {
        collisions++;
        colliders = ready.map((device) => device.id);
        timeline.push('collision');
        jamPending = true;
        for (const device of ready) {
          device.attempts++;
          if (device.attempts === attemptLimit) {
            device.queue.shift();
            device.attempts = 0;
            device.dropped++;
            dropped++;
            device.readyAt = time + 2;
          } else {
            const wait = Math.floor(
              random() * (backoffMaximum(device.attempts) + 1),
            );
            device.readyAt = time + 2 + wait;
          }
        }
        record('collision', time, colliders);
        continue;
      }
      if (!ready.length) {
        timeline.push('idle');
        record('idle', time);
        continue;
      }
      sender = ready[0];
      dataTicksLeft = 6;
    }
    const sendingId = sender.id;
    timeline.push('data');
    dataTicksLeft--;
    const progress = (6 - dataTicksLeft) / 6;
    if (dataTicksLeft === 0) {
      const arrivedAt = sender.queue.shift()!;
      totalDelay += time + 1 - arrivedAt;
      sender.delivered++;
      sender.attempts = 0;
      sender.readyAt = time + 1;
      delivered++;
      sender = null;
    }
    record('data', time, [sendingId], progress);
  }
  return {
    snapshots,
    devices,
    timeline,
    generated,
    delivered,
    dropped,
    collisions,
    ticks,
    pending: devices.reduce((total, device) => total + device.queue.length, 0),
    averageDelay: delivered ? totalDelay / delivered : null,
  };
}
