import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Monitor,
  Network,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Shuffle,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  advanceCsma,
  backoffMaximum,
  changeWaits,
  channelStatus,
  createCsma,
  csmaSteps,
  equalWaits,
  eventText,
  stageIndex,
  stationStatus,
  transmittingStations,
  type CsmaScenario,
  type CsmaState,
  type WaitChoice,
} from '../demos/csma';
import '../csma-cd.css';

function EthernetChannel({
  state,
  playing,
}: {
  state: CsmaState;
  playing: boolean;
}) {
  const senders = transmittingStations(state);
  const collision = state.phase === 'collision';
  const jam = state.phase === 'stop';
  const listening = state.phase === 'listen' || state.phase === 'retry-sense';
  return (
    <figure
      className={`csma-network ${collision || jam ? 'has-collision' : ''}`}
      aria-label="Shared Ethernet collision domain"
      data-playing={playing}
    >
      <div className="csma-channel-heading">
        <span>
          <Network size={17} />
          ONE SHARED CHANNEL
        </span>
        <strong
          className={`csma-channel-status status-${channelStatus(state).toLowerCase().replace(' ', '-')}`}
        >
          {channelStatus(state)}
        </strong>
      </div>
      <svg viewBox="0 0 800 370" aria-hidden="true">
        <path
          d="M180 124V214M620 124V214M400 214V302"
          className="csma-drop-line"
        />
        <path d="M60 214H740" className="csma-bus-outline" />
        <path d="M60 214H740" className="csma-bus" />
        <path d="M60 200V228M740 200V228" stroke="#758a9c" strokeWidth="4" />
        {(['A', 'B'] as const).map((station, index) => (
          <g key={station} transform={`translate(${index ? 520 : 80} 18)`}>
            <rect
              width="200"
              height="106"
              rx="12"
              className={`csma-station station-${station.toLowerCase()}`}
            />
            <Monitor
              x={16}
              y={16}
              width={29}
              height={29}
              stroke={index ? '#ffbd73' : '#80def1'}
              strokeWidth={1.8}
            />
            <text x="57" y="34" className="csma-node-name">
              Workstation {station}
            </text>
            <text
              x="100"
              y="75"
              textAnchor="middle"
              className="csma-node-status"
            >
              {stationStatus(state, station)}
            </text>
            {listening && !(station === 'B' && state.scenario === 'single') && (
              <circle cx="183" cy="20" r="5" className="csma-listening-dot" />
            )}
          </g>
        ))}
        {senders.map((station) => (
          <g
            key={station}
            className={`csma-data-signal signal-${station.toLowerCase()} ${senders.length === 2 ? 'competing' : 'solo'}`}
          >
            <path
              d={
                station === 'A'
                  ? `M180 214H${senders.length === 2 ? 395 : 720}`
                  : `M620 214H${senders.length === 2 ? 405 : 80}`
              }
              stroke={station === 'A' ? '#80def1' : '#ffbd73'}
              strokeWidth="8"
              strokeDasharray="16 10"
            />
            <rect
              x={station === 'A' ? 226 : 486}
              y="180"
              width="88"
              height="27"
              rx="5"
              fill={station === 'A' ? '#80def1' : '#ffbd73'}
            />
            <text
              x={station === 'A' ? 270 : 530}
              y="199"
              textAnchor="middle"
              className="csma-frame-label"
            >
              Frame {station}
            </text>
          </g>
        ))}
        {state.busy && (
          <g>
            <path
              d="M80 214H720"
              stroke="#a5b1c0"
              strokeWidth="8"
              strokeDasharray="14 8"
            />
            <rect
              x="340"
              y="179"
              width="120"
              height="29"
              rx="6"
              fill="#a5b1c0"
            />
            <text
              x="400"
              y="199"
              textAnchor="middle"
              className="csma-frame-label"
            >
              Other traffic
            </text>
          </g>
        )}
        {(collision || jam) && (
          <g>
            <path
              d="M70 214H730"
              className={jam ? 'csma-jam-wave' : 'csma-collision-wave'}
            />
            <rect
              x="310"
              y="157"
              width="180"
              height="39"
              rx="9"
              fill="#a63f3a"
            />
            <text
              x="400"
              y="182"
              textAnchor="middle"
              className="csma-alert-label"
            >
              {jam ? 'JAM SIGNAL' : 'COLLISION'}
            </text>
            {collision && (
              <Zap
                x={376}
                y={194}
                width={48}
                height={48}
                fill="#ffe099"
                stroke="#ff644f"
                strokeWidth={2}
              />
            )}
          </g>
        )}
        <text x="400" y="264" textAnchor="middle" className="csma-medium-label">
          Shared half-duplex Ethernet
        </text>
        <g transform="translate(280 302)">
          <rect
            width="240"
            height="52"
            rx="10"
            fill="#243640"
            stroke={state.delivered.length ? '#b9f24c' : '#516674'}
          />
          <text x="120" y="21" textAnchor="middle" className="csma-node-name">
            Receiver C
          </text>
          <text x="120" y="41" textAnchor="middle" className="csma-node-status">
            {state.delivered.length
              ? `Delivered: ${state.delivered.map((station) => `Frame ${station}`).join(' + ')}`
              : collision || jam
                ? 'Damaged frames discarded'
                : 'No valid frame received yet'}
          </text>
        </g>
      </svg>
      <figcaption>
        <span>
          <i className="legend-a" />
          Frame A
        </span>
        <span>
          <i className="legend-b" />
          Frame B
        </span>
        <span>
          <i className="legend-jam" />
          Collision / jam
        </span>
        <span className="sr-only">
          A: {stationStatus(state, 'A')}. B: {stationStatus(state, 'B')}.{' '}
          {state.delivered.length} valid frames delivered.
        </span>
      </figcaption>
    </figure>
  );
}

function BackoffPanel({
  state,
  onChoice,
}: {
  state: CsmaState;
  onChoice: (choice: WaitChoice) => void;
}) {
  const maximum = backoffMaximum(state.collisions);
  return (
    <section className="csma-backoff" aria-labelledby="backoff-heading">
      <div className="csma-backoff-title">
        <div>
          <p className="csma-overline">RANDOM BACK-OFF</p>
          <h2 id="backoff-heading">
            Different waits. Fewer repeat collisions.
          </h2>
        </div>
        <div className="csma-window">
          <span>
            Possible waits after {state.collisions} collision
            {state.collisions === 1 ? '' : 's'}
          </span>
          <strong>
            {state.collisions ? `0–${maximum} slots` : 'Not needed yet'}
          </strong>
        </div>
      </div>
      <div className="csma-backoff-body">
        <div className="csma-wait-cards">
          {(['A', 'B'] as const).map((station) => {
            const slots = state.backoff
              ? station === 'A'
                ? state.backoff.a
                : state.backoff.b
              : null;
            return (
              <div
                className={`csma-wait-card wait-${station.toLowerCase()}`}
                key={station}
              >
                <span>Workstation {station}</span>
                <strong data-testid={`backoff-${station.toLowerCase()}`}>
                  {slots === null ? '—' : slots}
                  <small>
                    {slots === null
                      ? 'No draw yet'
                      : slots === 1
                        ? 'slot time'
                        : 'slot times'}
                  </small>
                </strong>
                <div className="csma-wait-track">
                  <span
                    style={{
                      width:
                        slots === null
                          ? '0%'
                          : `${maximum ? (slots / maximum) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="csma-wait-explanation">
          <p>
            {state.backoff
              ? equalWaits(state)
                ? 'The waits are equal. Both may retry together and collide again.'
                : 'The waits differ. The earlier sender retries first; the other must still check the channel.'
              : 'After a collision, each workstation independently draws a random number of slot times.'}
          </p>
          <div className="csma-wait-actions">
            <Button
              size="sm"
              variant="outline"
              disabled={state.phase !== 'wait'}
              onClick={() => onChoice('random')}
            >
              <Shuffle size={15} />
              Draw again
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={state.phase !== 'wait'}
              onClick={() => onChoice('equal')}
            >
              Force equal waits
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={state.phase !== 'wait'}
              onClick={() => onChoice('different')}
            >
              Use different waits
            </Button>
          </div>
          <small>
            Available at step 5. Equal / different waits are teaching controls;
            real workstations choose independently.
          </small>
        </div>
      </div>
      {state.history.length > 0 && (
        <div className="csma-history">
          <table>
            <caption>Back-off choices in this run</caption>
            <thead>
              <tr>
                <th scope="col">Collision</th>
                <th scope="col">Possible waits</th>
                <th scope="col">A picked</th>
                <th scope="col">B picked</th>
                <th scope="col">Comparison</th>
              </tr>
            </thead>
            <tbody>
              {state.history.map((row) => (
                <tr key={row.collision}>
                  <th scope="row">{row.collision}</th>
                  <td>0–{row.maximum} slots</td>
                  <td>{row.a}</td>
                  <td>{row.b}</td>
                  <td>{row.a === row.b ? 'Equal waits' : 'Different waits'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <details className="csma-detail">
        <summary>Why does the waiting range grow?</summary>
        <p>
          Ethernet uses binary exponential back-off. After collision number n,
          choose r from 0 to 2<sup>min(n, 10)</sup> − 1, then wait r × slot
          time. The first ranges are 0–1, 0–3 and 0–7 slots. The larger range
          reduces the chance of choosing the same wait again. It does not
          guarantee that every new random wait is longer.
        </p>
        <p>
          A slot time is 512 bit times for the classic shared Ethernet model
          shown here. The range is capped after 10 collisions, and the frame is
          abandoned after 16 failed transmission attempts.
        </p>
      </details>
    </section>
  );
}

export default function CsmaCdPage() {
  const [state, setState] = useState<CsmaState>(() => createCsma());
  const [playing, setPlaying] = useState(false);
  const [intervalMs, setIntervalMs] = useState(1800);
  const terminal = state.phase === 'success' || state.phase === 'failed';
  const blocked = state.phase === 'listen' && state.busy;
  const step = stageIndex(state);
  const text = eventText(state);
  useEffect(() => {
    document.title = 'CSMA/CD · Gregg’s AS Playground';
  }, []);
  useEffect(() => {
    if (!playing || terminal || blocked) return;
    const timer = window.setTimeout(() => {
      const a = Math.random(),
        b = Math.random();
      setState((current) => advanceCsma(current, a, b));
    }, intervalMs);
    return () => window.clearTimeout(timer);
  }, [playing, terminal, blocked, intervalMs, state]);
  const advance = () => {
    setPlaying(false);
    const a = Math.random(),
      b = Math.random();
    setState((current) => advanceCsma(current, a, b));
  };
  const restart = (scenario = state.scenario) => {
    setPlaying(false);
    setState(createCsma(scenario));
  };
  const change = (choice: WaitChoice) => {
    setPlaying(false);
    const a = Math.random(),
      b = Math.random();
    setState((current) => changeWaits(current, a, b, choice));
  };
  const isPlaying = playing && !terminal && !blocked;

  return (
    <div className="csma-lab">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Gregg’s AS Playground home">
          <span className="brand-icon">
            <Network size={25} />
          </span>
          <span>
            <strong>Gregg’s</strong>
            <small>AS CS PLAYGROUND</small>
          </span>
        </Link>
        <Link className="csma-chapter-link" to="/chapters/2#section-2-1">
          <ArrowLeft size={16} />
          2.1 Networks
        </Link>
      </header>
      <main className="csma-main">
        <header className="csma-intro">
          <div>
            <p className="csma-overline">COMMUNICATION · SHARED ETHERNET</p>
            <h1>CSMA/CD, in six steps.</h1>
            <p>Carrier Sense Multiple Access with Collision Detection</p>
          </div>
          <span className="csma-simulation-label">
            <Radio size={16} />
            Interactive classroom model
          </span>
        </header>
        <ol className="csma-steps" aria-label="Six steps of CSMA/CD">
          {csmaSteps.map((item, index) => (
            <li
              key={item.title}
              aria-current={index === step ? 'step' : undefined}
              className={`${index === step ? 'current' : ''} ${state.scenario === 'single' && terminal && index > 1 ? 'not-needed' : ''}`}
            >
              <span className="csma-step-number">{index + 1}</span>
              <div>
                <strong>{item.title}</strong>
                <small>
                  {state.scenario === 'single' && terminal && index > 1
                    ? 'Not needed this time'
                    : item.hint}
                </small>
              </div>
            </li>
          ))}
        </ol>
        <div className="csma-controls">
          <div className="csma-scenario">
            <label htmlFor="csma-scenario">Scenario</label>
            <select
              id="csma-scenario"
              value={state.scenario}
              onChange={(event) => restart(event.target.value as CsmaScenario)}
            >
              <option value="collision">
                Two senders: collision and recovery
              </option>
              <option value="busy">Busy channel: listen and wait</option>
              <option value="single">One sender: no collision</option>
            </select>
          </div>
          <div className="csma-play-controls">
            <Button
              variant="accent"
              onClick={() => setPlaying(!isPlaying)}
              disabled={terminal || blocked}
            >
              {isPlaying ? <Pause size={17} /> : <Play size={17} />}{' '}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              variant="outline"
              onClick={advance}
              disabled={terminal || blocked}
            >
              Next event
              <ArrowRight size={16} />
            </Button>
            <Button variant="outline" onClick={() => restart()}>
              <RotateCcw size={16} />
              Restart
            </Button>
          </div>
          <div className="csma-speed">
            <label htmlFor="csma-speed">Playback</label>
            <select
              id="csma-speed"
              value={intervalMs}
              onChange={(event) => setIntervalMs(Number(event.target.value))}
            >
              <option value={3000}>Slow</option>
              <option value={1800}>Normal</option>
              <option value={900}>Fast</option>
            </select>
          </div>
        </div>
        <div className="csma-workspace">
          <EthernetChannel state={state} playing={isPlaying} />
          <section
            className={`csma-event ${state.phase === 'failed' ? 'is-failed' : terminal ? 'is-complete' : ''}`}
            aria-labelledby="csma-event-title"
          >
            <div className="csma-event-meta">
              <span>STEP {step + 1} / 6</span>
              <span>
                {state.collisions} collision{state.collisions === 1 ? '' : 's'}
              </span>
            </div>
            <div
              className="csma-event-copy"
              aria-live="polite"
              aria-atomic="true"
            >
              <h2 id="csma-event-title">{text.title}</h2>
              <p>{text.body}</p>
            </div>
            <div className="csma-rule">
              <span>
                {terminal && state.phase === 'success' ? (
                  <Check size={19} />
                ) : (
                  <Radio size={19} />
                )}
              </span>
              <p>{text.rule}</p>
            </div>
            {blocked && (
              <Button
                variant="accent"
                onClick={() =>
                  setState((current) => ({ ...current, busy: false }))
                }
              >
                Make the channel idle
                <ArrowRight size={17} />
              </Button>
            )}
            {state.phase === 'wait' && (
              <p className="csma-event-tip">
                Try “Force equal waits” below, then advance to see another
                collision.
              </p>
            )}
            <div className="csma-delivery">
              <span>Valid frames delivered</span>
              <strong>
                {state.delivered.length} / {state.scenario === 'single' ? 1 : 2}
              </strong>
            </div>
          </section>
        </div>
        <p className="csma-timing-note">
          Time is compressed. Each advance shows a protocol event, not one real
          time slot. Changing the scenario restarts the run.
        </p>
        <BackoffPanel state={state} onChoice={change} />
        <section className="csma-answer" aria-labelledby="csma-answer-title">
          <div>
            <p className="csma-overline">EXPLAIN THE PROCESS</p>
            <h2 id="csma-answer-title">Your six-step answer</h2>
            <p>
              Use the actions in order, and explain what triggers the
              collision-handling steps.
            </p>
          </div>
          <ol>
            {csmaSteps.map((item) => (
              <li key={item.title}>
                <strong>{item.title}.</strong> {item.sentence}
              </li>
            ))}
          </ol>
        </section>
        <footer className="csma-footnotes">
          <p>
            <strong>Why can listening still lead to a collision?</strong>{' '}
            Signals take time to propagate. Two workstations may both sense an
            idle channel and start before either receives the other’s signal.
          </p>
          <p>
            <strong>Scope:</strong> CSMA/CD applies to shared, half-duplex
            Ethernet. Modern switched full-duplex Ethernet does not use
            collision detection; Wi-Fi uses collision avoidance. This model
            compresses propagation, jam and inter-frame timing for teaching.
          </p>
        </footer>
      </main>
    </div>
  );
}
