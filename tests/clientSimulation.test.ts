import { describe, expect, it } from 'vitest';
import { exampleRoute, initialGame, movePlayer } from '../src/clientGame';
import {
  ClientSimulation,
  defaultSettings,
  maxPendingMoves,
} from '../src/clientSimulation';

describe('shared Packet Run rules', () => {
  it('blocks walls, collects each packet once and requires all packets before exiting', () => {
    expect(movePlayer(initialGame(), 'up')).toEqual(initialGame());
    let game = movePlayer(movePlayer(initialGame(), 'right'), 'right');
    game = movePlayer(movePlayer(game, 'left'), 'right');
    expect(game.collected).toHaveLength(1);
    const atExitEarly = exampleRoute
      .slice(0, 12)
      .reduce(movePlayer, initialGame());
    expect(atExitEarly.player).toEqual({ x: 9, y: 1 });
    expect(atExitEarly.won).toBe(false);
    const complete = exampleRoute.reduce(movePlayer, initialGame());
    expect(complete.collected).toHaveLength(3);
    expect(complete.won).toBe(true);
    expect(movePlayer(complete, 'down')).toEqual(complete);
  });
});

describe('cloud and local processing', () => {
  it('processes locally before a delayed cloud input reaches the server, and displays the cloud frame only after its return', () => {
    const sim = new ClientSimulation({ ...defaultSettings, rtt: 600 });
    sim.send('right', 0);
    sim.advance(32);
    expect(sim.snapshot().local.game.player.x).toBe(2);
    expect(sim.snapshot().cloud.processed.player.x).toBe(1);
    sim.advance(324);
    expect(sim.snapshot().cloud.processed.player.x).toBe(2);
    expect(sim.snapshot().cloud.game.player.x).toBe(1);
    sim.advance(635);
    expect(sim.snapshot().cloud.game.player.x).toBe(1);
    sim.advance(636);
    expect(sim.snapshot().cloud.game.player.x).toBe(2);
    expect(sim.snapshot().cloud.latency).toBe(636);
    expect(sim.snapshot().local.latency).toBe(32);
  });

  it('makes weak client hardware affect local computation and cloud decoding while keeping server processing fixed', () => {
    const fast = new ClientSimulation();
    const slow = new ClientSimulation({
      ...defaultSettings,
      hardware: 'basic',
    });
    fast.send('right', 0);
    slow.send('right', 0);
    fast.advance(64);
    slow.advance(64);
    expect(fast.snapshot().cloud.processed).toEqual(
      slow.snapshot().cloud.processed,
    );
    expect(fast.snapshot().local.game.player.x).toBe(2);
    expect(slow.snapshot().local.game.player.x).toBe(1);
    fast.advance(240);
    slow.advance(240);
    expect(fast.snapshot().cloud.latency).toBe(116);
    expect(slow.snapshot().cloud.latency).toBe(128);
    expect(slow.snapshot().local.latency).toBe(240);
  });

  it('queues rapid moves in order and finishes the identical game on both sides', () => {
    const sim = new ClientSimulation({
      ...defaultSettings,
      hardware: 'basic',
      rtt: 600,
    });
    exampleRoute.forEach((direction, index) =>
      sim.send(direction, index * 140),
    );
    sim.advance(3400);
    expect(sim.snapshot().cloud.game.won).toBe(true);
    expect(sim.snapshot().local.game.won).toBe(false);
    sim.advance(5000);
    expect(sim.snapshot().local.game).toEqual(sim.snapshot().cloud.game);
    expect(sim.snapshot().local.game.won).toBe(true);
    expect(sim.snapshot().local.pending).toBe(0);
  });

  it('freezes the cloud frame on disconnection, continues the local game, and reconnects without replaying lost inputs', () => {
    const config = { ...defaultSettings, rtt: 400 };
    const sim = new ClientSimulation(config);
    sim.send('right', 0);
    sim.configure({ ...config, connected: false }, 230);
    expect(sim.snapshot().cloud.processed.player.x).toBe(2);
    expect(sim.snapshot().cloud.game.player.x).toBe(1);
    sim.send('right', 250);
    sim.advance(300);
    expect(sim.snapshot().local.game.player.x).toBe(3);
    expect(sim.snapshot().cloud.game.player.x).toBe(1);
    sim.configure(config, 300);
    sim.advance(512);
    expect(sim.snapshot().cloud.game.player.x).toBe(2);
    expect(sim.snapshot().cloud.pending).toBe(0);
    expect(sim.snapshot().cloud.dropped).toBe(2);
  });

  it('does not let a latency change reorder already submitted moves', () => {
    const sim = new ClientSimulation({ ...defaultSettings, rtt: 800 });
    sim.send('right', 0);
    sim.configure({ ...defaultSettings, rtt: 0 }, 10);
    sim.send('down', 10);
    sim.advance(1000);
    // Right reaches column 2, where down is blocked. Reordering would move down at column 1.
    expect(sim.snapshot().cloud.game.player).toEqual({ x: 2, y: 1 });
    expect(sim.snapshot().cloud.pending).toBe(0);
  });

  it('cancels pending work on reset and bounds the number of queued moves', () => {
    const sim = new ClientSimulation({ ...defaultSettings, hardware: 'basic' });
    for (let i = 0; i < 40; i++) sim.send(i % 2 ? 'left' : 'right', 0);
    expect(sim.snapshot().cloud.pending).toBe(maxPendingMoves);
    expect(sim.snapshot().local.pending).toBe(maxPendingMoves);
    expect(sim.snapshot().local.dropped).toBe(40 - maxPendingMoves);
    sim.reset(1);
    sim.advance(10000);
    expect(sim.snapshot().cloud.game).toEqual(initialGame());
    expect(sim.snapshot().local.game).toEqual(initialGame());
    expect(sim.snapshot().cloud.pending).toBe(0);
  });
});
