import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Cloud,
  Gamepad2,
  Monitor,
  Play,
  RotateCcw,
  Square,
  VectorSquare,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientGameBoard } from '../components/ClientGameBoard';
import { exampleRoute, type Direction } from '../clientGame';
import {
  ClientSimulation,
  defaultSettings,
  hardwareProfiles,
  serverMs,
  type ClientMode,
  type ClientView,
  type LabSettings,
  type Phase,
} from '../clientSimulation';
import '../client-lab.css';

const keys: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};
const phases: Record<Phase, string> = {
  ready: 'Ready for a move',
  upload: 'Sending input to server',
  server: 'Server computing + rendering',
  download: 'Video frame travelling back',
  decode: 'Client decoding video',
  compute: 'Client computing + rendering',
  display: 'Updated image displayed',
  offline: 'Stream disconnected',
};
const presets: { title: string; settings: LabSettings }[] = [
  { title: 'Good connection', settings: defaultSettings },
  { title: 'High latency', settings: { ...defaultSettings, rtt: 600 } },
  {
    title: 'Basic laptop',
    settings: { ...defaultSettings, hardware: 'basic' },
  },
];

function Pipeline({ mode, phase }: { mode: ClientMode; phase: Phase }) {
  const steps: { title: string; detail: string; phase: Phase }[] =
    mode === 'cloud'
      ? [
          { title: 'Client', detail: 'Capture input', phase: 'ready' },
          {
            title: 'Network ↑',
            detail: 'Input command',
            phase: 'upload',
          },
          {
            title: 'Server',
            detail: 'Logic + render + encode',
            phase: 'server',
          },
          {
            title: 'Network ↓',
            detail: 'Video frame',
            phase: 'download',
          },
          {
            title: 'Client',
            detail: 'Decode + display',
            phase: 'decode',
          },
        ]
      : [
          { title: 'Client', detail: 'Capture input', phase: 'ready' },
          {
            title: 'Client',
            detail: 'Logic + render',
            phase: 'compute',
          },
          { title: 'Client', detail: 'Display image', phase: 'display' },
        ];
  return (
    <ol
      className="client-pipeline"
      aria-label={`${mode === 'cloud' ? 'Cloud' : 'Local'} processing path`}
    >
      {steps.map((step, index) => (
        <li
          key={`${step.phase}-${index}`}
          className={
            phase === step.phase ||
            (phase === 'display' && index === steps.length - 1)
              ? 'active'
              : ''
          }
        >
          <strong>{step.title}</strong>
          <span>{step.detail}</span>
        </li>
      ))}
    </ol>
  );
}

function GamePanel({
  mode,
  view,
  settings,
}: {
  mode: ClientMode;
  view: ClientView;
  settings: LabSettings;
}) {
  const cloud = mode === 'cloud';
  return (
    <section
      className={`client-game-card ${mode}`}
      aria-label={cloud ? 'Cloud gaming' : 'Local gaming'}
    >
      <header>
        <div className="client-mode-icon">
          {cloud ? <Cloud /> : <Monitor />}
        </div>
        <div>
          <p>{cloud ? 'THIN CLIENT' : 'THICK CLIENT'}</p>
          <h2>{cloud ? 'Cloud gaming' : 'Local gaming'}</h2>
        </div>
        <span className="client-mode-badge">
          {cloud ? 'Streamed' : 'Installed'}
        </span>
      </header>
      <ClientGameBoard
        game={view.game}
        label={cloud ? 'Cloud' : 'Local'}
        offline={cloud && !settings.connected}
      />
      <div className="client-game-score">
        <span>
          Packets <strong>{view.game.collected.length} / 3</strong>
        </span>
        <span>
          Moves <strong>{view.game.moves}</strong>
        </span>
        <span className="client-response">
          Last response{' '}
          <strong data-testid={`${mode}-latency`}>
            {view.latency === null ? '—' : `${view.latency} ms`}
          </strong>
        </span>
      </div>
      <div className="client-activity">
        <span
          className={`client-phase ${view.phase === 'offline' ? 'is-offline' : ''}`}
        >
          <i />
          {phases[view.phase]}
        </span>
        <span>{view.pending} pending</span>
      </div>
      <Pipeline mode={mode} phase={view.phase} />
      <p className="client-card-caption">
        {cloud ? (
          <>
            Game state lives on the <strong>server</strong>. Your device
            receives video and decodes it.
          </>
        ) : (
          <>
            Game state lives on <strong>your device</strong>. This installed
            single-player game can keep running offline.
          </>
        )}
      </p>
      <div className="client-machine-state">
        <span>
          {cloud ? 'Server' : 'Local game'} position{' '}
          <strong data-testid={`${mode}-processed-position`}>
            {view.processed.player.x}, {view.processed.player.y}
          </strong>
        </span>
        <span>
          Displayed{' '}
          <strong>
            {view.game.player.x}, {view.game.player.y}
          </strong>
        </span>
        {view.dropped > 0 && (
          <span>
            {view.dropped} input{view.dropped === 1 ? '' : 's'} / transfer
            {view.dropped === 1 ? '' : 's'} dropped
          </span>
        )}
      </div>
    </section>
  );
}

export default function ClientLabPage() {
  const [simulation] = useState(() => new ClientSimulation());
  const [view, setView] = useState(() => simulation.snapshot());
  const [running, setRunning] = useState(false);
  const route = useRef<{ index: number; nextAt: number } | null>(null);
  const lastKeyAt = useRef(-Infinity);
  const settings = view.settings;
  const refresh = () => setView(simulation.snapshot());
  const stopExample = () => {
    route.current = null;
    setRunning(false);
  };
  const move = (direction: Direction) => {
    stopExample();
    simulation.send(direction, performance.now());
    refresh();
  };

  useEffect(() => {
    document.title = 'Thin & Thick Client Lab · Gregg’s AS Playground';
    const timer = window.setInterval(() => {
      const now = performance.now();
      const replay = route.current;
      if (replay) {
        while (replay.index < exampleRoute.length && replay.nextAt <= now) {
          simulation.send(exampleRoute[replay.index++], replay.nextAt);
          replay.nextAt += 140;
        }
        if (replay.index === exampleRoute.length) {
          route.current = null;
          setRunning(false);
        }
      }
      simulation.advance(now);
      const next = simulation.snapshot();
      setView((current) => (current.version === next.version ? current : next));
    }, 16);
    const onKey = (event: KeyboardEvent) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        (event.target instanceof Element &&
          event.target.closest(
            'input,select,textarea,[contenteditable="true"]',
          ))
      )
        return;
      const direction = keys[event.key] ?? keys[event.key.toLowerCase()];
      if (!direction) return;
      event.preventDefault();
      const now = performance.now();
      if (event.repeat && now - lastKeyAt.current < 100) return;
      lastKeyAt.current = now;
      route.current = null;
      setRunning(false);
      simulation.send(direction, now);
      setView(simulation.snapshot());
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('keydown', onKey);
      route.current = null;
    };
  }, [simulation]);

  const configure = (next: LabSettings) => {
    simulation.configure(next, performance.now());
    refresh();
  };
  const reset = () => {
    stopExample();
    simulation.reset(performance.now());
    refresh();
  };
  const runExample = () => {
    if (running) {
      stopExample();
      return;
    }
    const now = performance.now();
    simulation.reset(now);
    route.current = { index: 0, nextAt: now };
    setRunning(true);
    refresh();
  };
  const preset = (next: LabSettings) => {
    stopExample();
    const now = performance.now();
    simulation.configure(next, now);
    simulation.reset(now);
    refresh();
  };
  const profile = hardwareProfiles[settings.hardware];

  return (
    <div className="client-lab">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Gregg’s AS Playground home">
          <span className="brand-icon">
            <VectorSquare size={25} />
          </span>
          <span>
            <strong>Gregg’s</strong>
            <small>AS CS PLAYGROUND</small>
          </span>
        </Link>
        <Link className="client-chapter-link" to="/chapters/2#section-2-1">
          ← 2.1 Networks
        </Link>
      </header>
      <main className="client-main">
        <div className="client-heading">
          <div>
            <p className="eyebrow">2.1 NETWORKS · THIN & THICK CLIENTS</p>
            <h1>Same game. Different computing.</h1>
            <p>
              Collect 3 packets, then reach EXIT. Both screens receive the same
              moves.
            </p>
          </div>
          <span className="client-simulation-label">Classroom simulation</span>
        </div>
        <section
          className="client-experiments"
          aria-label="Experiment settings"
        >
          <div className="client-network-control">
            <div className="client-setting-label">
              <label htmlFor="client-rtt">Round-trip network delay</label>
              <output htmlFor="client-rtt" aria-label="Network delay value">
                {settings.rtt} ms
              </output>
            </div>
            <input
              id="client-rtt"
              type="range"
              min="0"
              max="800"
              step="20"
              value={settings.rtt}
              onChange={(event) =>
                configure({ ...settings, rtt: Number(event.target.value) })
              }
            />
            <span>
              Applies to cloud gaming; does not slow local processing.
            </span>
          </div>
          <div className="client-hardware-control">
            <label htmlFor="client-hardware">
              Client hardware · both screens
            </label>
            <select
              id="client-hardware"
              value={settings.hardware}
              onChange={(event) =>
                configure({
                  ...settings,
                  hardware: event.target.value as LabSettings['hardware'],
                })
              }
            >
              <option value="gaming">Gaming PC</option>
              <option value="basic">Basic laptop</option>
            </select>
            <span>Cloud server performance stays fixed.</span>
          </div>
          <div className="client-network-switch">
            <Button
              variant={settings.connected ? 'outline' : 'accent'}
              onClick={() =>
                configure({ ...settings, connected: !settings.connected })
              }
            >
              {settings.connected ? <WifiOff size={17} /> : <Wifi size={17} />}{' '}
              {settings.connected ? 'Disconnect network' : 'Reconnect network'}
            </Button>
            <output className="client-connection-status">
              {settings.connected
                ? 'Network connected'
                : 'Offline · only local play continues'}
            </output>
          </div>
        </section>
        <div className="client-toolbar">
          <div className="client-instruction">
            <Gamepad2 size={22} />
            <span>
              <strong>Packet Run</strong>
              <small>Arrow keys / WASD, or tap a direction</small>
            </span>
          </div>
          <div className="client-dpad" aria-label="Move both players">
            {(
              [
                ['up', ArrowUp],
                ['left', ArrowLeft],
                ['down', ArrowDown],
                ['right', ArrowRight],
              ] as const
            ).map(([direction, Icon]) => (
              <Button
                key={direction}
                variant="outline"
                size="icon"
                onClick={() => move(direction)}
                aria-label={`Move ${direction}`}
              >
                <Icon size={18} />
              </Button>
            ))}
          </div>
          <Button variant="accent" onClick={runExample}>
            {running ? <Square size={16} /> : <Play size={16} />}{' '}
            {running ? 'Stop example' : 'Run example route'}
          </Button>
          <Button variant="outline" onClick={reset}>
            <RotateCcw size={16} />
            Reset both
          </Button>
        </div>
        <div className="client-games">
          <GamePanel mode="cloud" view={view.cloud} settings={settings} />
          <GamePanel mode="local" view={view.local} settings={settings} />
        </div>
        <div className="client-run-note">
          <span>
            Example route resets both games. Stopping it cancels future moves;
            pending work finishes.
          </span>
          <span>
            Last response = simulated input-to-display time, including queued
            work.
          </span>
        </div>
        <section className="client-lesson" aria-labelledby="experiment-heading">
          <div>
            <p className="eyebrow">CHANGE ONE THING. WATCH BOTH SIDES.</p>
            <h2 id="experiment-heading">Three classroom experiments</h2>
            <div className="client-presets">
              {presets.map((item) => (
                <Button
                  key={item.title}
                  variant="outline"
                  onClick={() => preset(item.settings)}
                >
                  {item.title}
                </Button>
              ))}
            </div>
            <p className="client-preset-note">
              Presets reset both games. Then run the example route.
            </p>
            <ol className="client-prompts">
              <li>
                <strong>Increase network delay.</strong> Why does the cloud
                screen trail the local screen?
              </li>
              <li>
                <strong>Choose Basic laptop.</strong> Which client now spends
                longer computing each move?
              </li>
              <li>
                <strong>Disconnect mid-game.</strong> Why can the installed
                single-player game continue?
              </li>
            </ol>
          </div>
          <div className="client-response-breakdown">
            <h3>Where the delay comes from</h3>
            <div>
              <span>Cloud · next move, no queue</span>
              <strong>
                {settings.connected
                  ? `${settings.rtt + serverMs + profile.decodeMs} ms`
                  : 'No connection'}
              </strong>
              <p>
                {settings.rtt} ms network + {serverMs} ms server +{' '}
                {profile.decodeMs} ms client decoding
              </p>
            </div>
            <div>
              <span>Local · next move, no queue</span>
              <strong>{profile.localMs} ms</strong>
              <p>
                Game logic and rendering on the {profile.name.toLowerCase()}.
              </p>
            </div>
            <p>
              Changing a setting affects new moves; work already in flight keeps
              its timing.
            </p>
          </div>
        </section>
        <section
          className="client-concepts"
          aria-labelledby="client-concept-heading"
        >
          <h2 id="client-concept-heading">
            The key question: where is the processing?
          </h2>
          <div className="client-table-wrap">
            <table>
              <caption>
                Task allocation in these two versions of Packet Run
              </caption>
              <thead>
                <tr>
                  <th scope="col">Task</th>
                  <th scope="col">Thin client · cloud game</th>
                  <th scope="col">Thick client · installed game</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Capture keyboard input</th>
                  <td>Client</td>
                  <td>Client</td>
                </tr>
                <tr>
                  <th scope="row">Game logic, collisions and score</th>
                  <td>Server</td>
                  <td>Client</td>
                </tr>
                <tr>
                  <th scope="row">Render the game scene</th>
                  <td>Server</td>
                  <td>Client</td>
                </tr>
                <tr>
                  <th scope="row">Decode the streamed video</th>
                  <td>Client</td>
                  <td>No video stream to decode</td>
                </tr>
                <tr>
                  <th scope="row">Store running game state</th>
                  <td>Server</td>
                  <td>Client</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            A thin client still does some processing. A thick client can also
            use a network, for multiplayer or cloud saves. Offline play here is
            a property of this installed single-player game, not every
            thick-client application. The same computer can act as either kind
            of client.
          </p>
        </section>
        <p className="client-model-note">
          Classroom model: both architectures are simulated in this browser; no
          real cloud gaming service is contacted. The timings illustrate
          dependencies, not device benchmarks. Cloud gaming also needs enough
          bandwidth; bandwidth, video quality, jitter and packet loss are
          outside this simulation. Disconnecting discards in-flight cloud work;
          reconnecting resumes the saved server position without replaying
          offline inputs.
        </p>
      </main>
    </div>
  );
}
