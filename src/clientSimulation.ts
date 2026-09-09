import {
  initialGame,
  movePlayer,
  type Direction,
  type GameState,
} from './clientGame';

export type ClientMode = 'cloud' | 'local';
export type Hardware = 'gaming' | 'basic';
export type Phase =
  | 'ready'
  | 'upload'
  | 'server'
  | 'download'
  | 'decode'
  | 'compute'
  | 'display'
  | 'offline';
export interface LabSettings {
  rtt: number;
  hardware: Hardware;
  connected: boolean;
}
export const defaultSettings: LabSettings = {
  rtt: 80,
  hardware: 'gaming',
  connected: true,
};
export const hardwareProfiles = {
  gaming: { name: 'Gaming PC', localMs: 32, decodeMs: 12 },
  basic: { name: 'Basic laptop', localMs: 240, decodeMs: 24 },
} as const;
export const serverMs = 24;
export const maxPendingMoves = 24;
export interface ClientView {
  game: GameState;
  processed: GameState;
  pending: number;
  latency: number | null;
  phase: Phase;
  frames: number;
  dropped: number;
}
interface ScheduledEvent {
  at: number;
  order: number;
  mode: ClientMode;
  apply: () => void;
}
const newView = (): ClientView => ({
  game: initialGame(),
  processed: initialGame(),
  pending: 0,
  latency: null,
  phase: 'ready',
  frames: 0,
  dropped: 0,
});

// A deterministic teaching model. All clocks are supplied by the caller; no real network is used.
export class ClientSimulation {
  private settings: LabSettings;
  private cloud = newView();
  private local = newView();
  private events: ScheduledEvent[] = [];
  private order = 0;
  private serverReadyAt = 0;
  private cloudInputAt = 0;
  private cloudFrameAt = 0;
  private localReadyAt = 0;
  private version = 0;

  constructor(settings: LabSettings = defaultSettings) {
    this.settings = { ...settings };
    if (!settings.connected) this.cloud.phase = 'offline';
  }

  snapshot() {
    return {
      cloud: { ...this.cloud },
      local: { ...this.local },
      settings: { ...this.settings },
      version: this.version,
    };
  }

  private schedule(mode: ClientMode, at: number, apply: () => void) {
    this.events.push({ mode, at, order: this.order++, apply });
  }

  advance(now: number) {
    this.events.sort((a, b) => a.at - b.at || a.order - b.order);
    while (this.events.length && this.events[0].at <= now) {
      this.events.shift()!.apply();
      this.version++;
    }
  }

  reset(now: number) {
    this.events = [];
    this.cloud = newView();
    this.local = newView();
    if (!this.settings.connected) this.cloud.phase = 'offline';
    this.serverReadyAt =
      this.cloudInputAt =
      this.cloudFrameAt =
      this.localReadyAt =
        now;
    this.version++;
  }

  configure(settings: LabSettings, now: number) {
    this.advance(now);
    const wasConnected = this.settings.connected;
    this.settings = {
      ...settings,
      rtt: Math.max(0, Math.min(800, settings.rtt)),
    };
    if (wasConnected && !settings.connected) {
      // Keep the last server state and displayed frame, but discard in-flight transport work.
      this.events = this.events.filter((event) => event.mode !== 'cloud');
      this.cloud.dropped += this.cloud.pending;
      this.cloud.pending = 0;
      this.cloud.phase = 'offline';
      this.serverReadyAt = this.cloudInputAt = this.cloudFrameAt = now;
    } else if (!wasConnected && settings.connected) {
      // Resume the existing remote session. Inputs lost while offline are never replayed.
      const decodeAt = now + this.settings.rtt / 2;
      const displayAt = decodeAt + hardwareProfiles[settings.hardware].decodeMs;
      const saved = this.cloud.processed;
      this.cloud.pending = 1;
      this.cloud.phase = 'download';
      this.cloudFrameAt = displayAt;
      this.schedule('cloud', decodeAt, () => {
        this.cloud.phase = 'decode';
      });
      this.schedule('cloud', displayAt, () => {
        this.cloud.game = saved;
        this.cloud.pending--;
        this.cloud.frames++;
        this.cloud.phase = this.cloud.pending ? 'upload' : 'display';
      });
    }
    this.version++;
  }

  send(direction: Direction, now: number) {
    this.advance(now);
    const profile = hardwareProfiles[this.settings.hardware];
    if (!this.local.game.won) {
      if (this.local.pending >= maxPendingMoves) this.local.dropped++;
      else {
        const displayAt = Math.max(now, this.localReadyAt) + profile.localMs;
        this.localReadyAt = displayAt;
        this.local.pending++;
        this.local.phase = 'compute';
        this.schedule('local', displayAt, () => {
          this.local.processed = movePlayer(this.local.processed, direction);
          this.local.game = this.local.processed;
          this.local.pending--;
          this.local.frames++;
          this.local.latency = Math.round(displayAt - now);
          this.local.phase = this.local.pending ? 'compute' : 'display';
        });
      }
    }
    if (!this.cloud.game.won) {
      if (!this.settings.connected || this.cloud.pending >= maxPendingMoves)
        this.cloud.dropped++;
      else {
        const uploadAt = Math.max(
          now + this.settings.rtt / 2,
          this.cloudInputAt,
        );
        const renderedAt = Math.max(uploadAt, this.serverReadyAt) + serverMs;
        const decodeAt = Math.max(
          renderedAt + this.settings.rtt / 2,
          this.cloudFrameAt,
        );
        const displayAt = decodeAt + profile.decodeMs;
        this.cloudInputAt = uploadAt;
        this.serverReadyAt = renderedAt;
        this.cloudFrameAt = displayAt;
        this.cloud.pending++;
        this.cloud.phase = 'upload';
        let frame: GameState;
        this.schedule('cloud', uploadAt, () => {
          this.cloud.phase = 'server';
        });
        this.schedule('cloud', renderedAt, () => {
          this.cloud.processed = movePlayer(this.cloud.processed, direction);
          frame = this.cloud.processed;
          this.cloud.phase = 'download';
        });
        this.schedule('cloud', decodeAt, () => {
          this.cloud.phase = 'decode';
        });
        this.schedule('cloud', displayAt, () => {
          this.cloud.game = frame;
          this.cloud.pending--;
          this.cloud.frames++;
          this.cloud.latency = Math.round(displayAt - now);
          this.cloud.phase = this.cloud.pending ? 'upload' : 'display';
        });
      }
    }
    this.version++;
  }
}
