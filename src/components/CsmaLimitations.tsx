import { useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Monitor,
  RotateCcw,
  Shuffle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  advanceCsma,
  attemptLimit,
  backoffMaximum,
  changeWaits,
  channelStatus,
  chooseBackoff,
  createCsma,
  eventText,
  stationStatus,
} from '../demos/csma';
import { simulateLoad } from '../demos/csmaLoad';
import './csma-limitations.css';

const topics = [
  ['Long waits', 'Repeated collisions make delivery time unpredictable.'],
  ['Repeated jams', 'A busy channel may deliver very little useful data.'],
  ['No priority', 'An urgent device still has to compete for access.'],
  ['More traffic', 'More active devices share the same channel capacity.'],
] as const;

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="csma-limit-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- An overflow region needs focus so keyboard users can scroll its results. */
function ScrollableResults({ children }: { children: ReactNode }) {
  return (
    <section
      className="csma-range-history"
      aria-label="Scrollable results"
      tabIndex={0}
    >
      {children}
    </section>
  );
}
/* oxlint-enable jsx-a11y/no-noninteractive-tabindex */

function LongWaits() {
  const [draws, setDraws] = useState([1]);
  const [failed, setFailed] = useState(false);
  const collisions = failed ? attemptLimit : draws.length;
  const total = draws.reduce((sum, wait) => sum + wait, 0);
  const maximum = backoffMaximum(collisions);
  function repeat() {
    if (draws.length === attemptLimit - 1) {
      setFailed(true);
      return;
    }
    const wait = Math.floor(
      Math.random() * (backoffMaximum(draws.length + 1) + 1),
    );
    setDraws([...draws, wait]);
  }
  return (
    <div className="csma-limit-experiment">
      <div className="csma-limit-copy">
        <h3>1. Waiting can be long and unpredictable</h3>
        <p>
          Force the same frame to collide again. Watch the possible waiting
          range grow, while the individual random draws can be short or long.
        </p>
      </div>
      <div className="csma-limit-metrics" aria-live="polite">
        <Metric label="Failed attempts" value={`${collisions} / 16`} />
        <Metric
          label={failed ? 'Frame status' : 'Possible next wait'}
          value={failed ? 'Abandoned' : `0–${maximum} slots`}
        />
        <Metric label="Total back-off chosen" value={`${total} slots`} />
      </div>
      <ScrollableResults>
        <table>
          <caption>One frame’s back-off history</caption>
          <thead>
            <tr>
              <th scope="col">Collision</th>
              <th scope="col">Possible wait</th>
              <th scope="col">Drawn wait</th>
              <th scope="col">Range and draw</th>
            </tr>
          </thead>
          <tbody>
            {draws.map((wait, index) => (
              <tr key={index}>
                <th scope="row">{index + 1}</th>
                <td>0–{backoffMaximum(index + 1)}</td>
                <td>
                  {wait} {wait === 1 ? 'slot' : 'slots'}
                </td>
                <td
                  aria-label={`Range 0 to ${backoffMaximum(index + 1)} slots; drawn wait ${wait} slots`}
                >
                  <div
                    className="csma-range-track"
                    aria-hidden="true"
                    style={{
                      width: `${(100 * backoffMaximum(index + 1)) / maximum}%`,
                    }}
                  >
                    <i
                      style={{
                        left: `${(100 * wait) / backoffMaximum(index + 1)}%`,
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollableResults>
      <p className="csma-limit-note">
        Bars use the same scale: the pale bar is the possible range, and the dot
        is the chosen wait. Total back-off excludes transmission, jam and
        busy-channel delays.
      </p>
      <div className="csma-limit-actions">
        <Button variant="accent" onClick={repeat} disabled={failed}>
          Force another collision <ArrowRight size={16} />
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setDraws([1]);
            setFailed(false);
          }}
        >
          <RotateCcw size={16} /> Reset waits
        </Button>
      </div>
      <output className="csma-limit-takeaway">
        {failed
          ? 'Retry limit reached: the frame is abandoned after 16 failed attempts. It is not retried forever by Ethernet.'
          : 'There is no guaranteed delivery time. Further collisions widen the random range up to 0–1023 slots; a new draw is not necessarily longer.'}
      </output>
      <p className="csma-limit-note">
        This deliberately forces repeated collisions to show the disadvantage.
        Real devices choose independently. The range stops growing after
        collision 10; attempt 16 ends in failure rather than another back-off.
      </p>
    </div>
  );
}

function RepeatedJams() {
  const [state, setState] = useState(() => createCsma());
  const terminal = state.phase === 'success' || state.phase === 'failed';
  const jamCount = state.collisions - (state.phase === 'collision' ? 1 : 0);
  const text = eventText(state);
  return (
    <div className="csma-limit-experiment">
      <div className="csma-limit-copy">
        <h3>2. Repeated collisions waste channel time</h3>
        <p>
          In this deliberately unlucky example, both devices keep drawing equal
          waits. Follow the channel, then separate their retries to let useful
          data through.
        </p>
      </div>
      <div
        className={`csma-jam-scene ${state.phase === 'stop' || state.phase === 'collision' ? 'jam-active' : ''}`}
      >
        <div className="csma-jam-devices">
          {(['A', 'B'] as const).map((id) => (
            <div key={id}>
              <Monitor size={27} />
              <strong>Device {id}</strong>
              <span>{stationStatus(state, id)}</span>
            </div>
          ))}
        </div>
        <div className="csma-jam-channel" aria-live="polite">
          <span />
          {channelStatus(state)}
          <span />
        </div>
        <p>
          {state.phase === 'stop'
            ? 'JAM IS A WARNING SIGNAL — NOT A VALID DATA FRAME'
            : state.phase === 'collision'
              ? 'OVERLAPPING FRAMES ARE DAMAGED'
              : state.phase === 'success'
                ? 'VALID DATA FINALLY REACHES THE RECEIVER'
                : 'BOTH DEVICES SHARE THIS ONE CHANNEL'}
        </p>
      </div>
      <div className="csma-limit-metrics">
        <Metric label="Collisions" value={state.collisions} />
        <Metric label="Jam episodes" value={jamCount} />
        <Metric
          label="Valid frames delivered"
          value={`${state.delivered.length} / 2`}
        />
      </div>
      <div className="csma-limit-actions">
        <Button
          variant="accent"
          disabled={terminal}
          onClick={() => setState(advanceCsma(state, 0.6, 0.6))}
        >
          Next channel event <ArrowRight size={16} />
        </Button>
        <Button
          variant="outline"
          disabled={state.phase !== 'wait'}
          onClick={() => setState(changeWaits(state, 0, 0.99, 'different'))}
        >
          Separate the retries
        </Button>
        <Button variant="outline" onClick={() => setState(createCsma())}>
          <RotateCcw size={16} /> Reset jams
        </Button>
      </div>
      <output className="csma-limit-takeaway">
        <strong>{text.title}.</strong> {text.body}
      </output>
      <p className="csma-limit-note">
        “Separate the retries” is available during back-off. Each jam is brief:
        many collisions cause repeated jam signals, not one permanent signal.
        Collisions, jams and waits can consume time with no successful delivery.
        Random back-off aims to break this cycle.
      </p>
    </div>
  );
}

function NoPriority() {
  const [urgent, setUrgent] = useState<'A' | 'B'>('A');
  const [waits, setWaits] = useState(() => chooseBackoff(3, 0.5, 0));
  const equal = waits.a === waits.b;
  const first = waits.a < waits.b ? 'A' : 'B';
  return (
    <div className="csma-limit-experiment">
      <div className="csma-limit-copy">
        <h3>3. Important devices cannot jump the queue</h3>
        <p>
          Both devices have collided three times and choose from the same 0–7
          slot range. Give one frame an urgent label. Does the access rule
          change?
        </p>
      </div>
      <label className="csma-urgent-control" htmlFor="csma-urgent">
        Device carrying urgent data
        <select
          id="csma-urgent"
          value={urgent}
          onChange={(event) => setUrgent(event.target.value as 'A' | 'B')}
        >
          <option value="A">Device A</option>
          <option value="B">Device B</option>
        </select>
      </label>
      <div className="csma-priority-devices">
        {(['A', 'B'] as const).map((id) => (
          <article key={id} className={urgent === id ? 'is-urgent' : ''}>
            <div>
              <Monitor size={28} />
              <strong>Device {id}</strong>
              <span>{urgent === id ? 'URGENT' : 'ROUTINE'}</span>
            </div>
            <p>
              {urgent === id
                ? 'Time-sensitive alert'
                : 'Background file transfer'}
            </p>
            <strong className="csma-priority-wait">
              {id === 'A' ? waits.a : waits.b}
              <small> random back-off slots</small>
            </strong>
            <div className="csma-priority-track" aria-hidden="true">
              <span
                style={{
                  width: `${(100 * (id === 'A' ? waits.a : waits.b)) / 7}%`,
                }}
              />
            </div>
          </article>
        ))}
      </div>
      <div className="csma-limit-actions">
        <Button
          variant="outline"
          onClick={() =>
            setWaits(chooseBackoff(3, Math.random(), Math.random()))
          }
        >
          <Shuffle size={16} /> Draw new waits
        </Button>
      </div>
      <output className="csma-limit-takeaway">
        {equal
          ? 'Equal waits: both devices may retry together and collide again. The urgent label does not break the tie.'
          : `Device ${first} retries first (${first === urgent ? 'urgent' : 'routine'}). The shorter random wait wins, not the importance of the data. The other device must wait if the channel is still busy.`}
      </output>
      <p className="csma-limit-note">
        Changing the urgency label keeps the same random draws so you can
        compare fairly. Basic CSMA/CD has no built-in priority mechanism or
        guaranteed access deadline.
      </p>
    </div>
  );
}

function MoreTraffic() {
  const [deviceCount, setDeviceCount] = useState(2);
  const [rate, setRate] = useState(2);
  const [seed, setSeed] = useState(7);
  const result = useMemo(
    () => simulateLoad(deviceCount, rate, seed),
    [deviceCount, rate, seed],
  );
  const baseline = useMemo(() => simulateLoad(2, 2, seed), [seed]);
  const deliveryShare = (delivered: number, generated: number) =>
    generated ? `${Math.round((100 * delivered) / generated)}%` : '—';
  return (
    <div className="csma-limit-experiment">
      <div className="csma-limit-copy">
        <h3>4. More devices + more traffic = more contention</h3>
        <p>
          Compare the same 600 model ticks. Increase the number of active
          devices or how often each generates a frame. All frames share one
          channel.
        </p>
      </div>
      <div className="csma-load-controls">
        <label htmlFor="csma-load-devices">
          Active devices <strong>{deviceCount}</strong>
          <input
            id="csma-load-devices"
            type="range"
            min="2"
            max="24"
            value={deviceCount}
            onChange={(event) => setDeviceCount(Number(event.target.value))}
          />
        </label>
        <label htmlFor="csma-load-rate">
          Traffic per device <strong>{rate} frames / 100 ticks</strong>
          <input
            id="csma-load-rate"
            type="range"
            min="1"
            max="12"
            value={rate}
            onChange={(event) => setRate(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="csma-limit-actions">
        <Button
          variant="outline"
          onClick={() => {
            setDeviceCount(2);
            setRate(2);
          }}
        >
          Quiet network
        </Button>
        <Button
          variant="accent"
          onClick={() => {
            setDeviceCount(20);
            setRate(12);
          }}
        >
          Busy network
        </Button>
        <Button variant="outline" onClick={() => setSeed(seed + 1)}>
          <Shuffle size={16} /> Run another sample
        </Button>
      </div>
      <div
        className="csma-load-devices"
        aria-label="Device queues after 600 model ticks"
      >
        {result.devices.map((device) => (
          <div
            key={device.id}
            className={device.queue.length ? 'has-queue' : ''}
          >
            <Monitor size={18} />
            <strong>D{device.id + 1}</strong>
            <span>{device.queue.length} waiting</span>
            <small>{device.delivered} sent</small>
          </div>
        ))}
      </div>
      <div className="csma-load-timeline">
        <p>
          <strong>What occupied the channel?</strong> Last 120 model ticks, read
          left to right.
        </p>
        <figure className="csma-load-ticks">
          <figcaption className="sr-only">
            Channel timeline: data transmissions, collisions, jam signals and
            idle or back-off time
          </figcaption>
          {result.timeline.slice(-120).map((tick, index) => (
            <span
              key={index}
              className={`load-tick-${tick}`}
              title={`Tick ${result.ticks - 119 + index}: ${tick}`}
            />
          ))}
        </figure>
        <div className="csma-load-legend">
          {[
            ['data', 'Data transmission'],
            ['collision', 'Collision'],
            ['jam', 'Jam signal'],
            ['idle', 'Idle / back-off'],
          ].map(([kind, name]) => (
            <span key={kind}>
              <i className={`load-tick-${kind}`} />
              {name}
            </span>
          ))}
        </div>
      </div>
      <ScrollableResults>
        <table>
          <caption>
            Results after 600 model ticks · no real-world speed units
          </caption>
          <thead>
            <tr>
              <th scope="col">Measure</th>
              <th scope="col">Quiet baseline · 2 devices</th>
              <th scope="col">Your network · {deviceCount} devices</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Frames generated</th>
              <td>{baseline.generated}</td>
              <td>{result.generated}</td>
            </tr>
            <tr>
              <th scope="row">Frames delivered</th>
              <td>{baseline.delivered}</td>
              <td>{result.delivered}</td>
            </tr>
            <tr>
              <th scope="row">Delivered / generated</th>
              <td>{deliveryShare(baseline.delivered, baseline.generated)}</td>
              <td>{deliveryShare(result.delivered, result.generated)}</td>
            </tr>
            <tr>
              <th scope="row">Collision episodes</th>
              <td>{baseline.collisions}</td>
              <td>{result.collisions}</td>
            </tr>
            <tr>
              <th scope="row">Average delivery delay</th>
              <td>{baseline.averageDelay?.toFixed(1) ?? '—'} ticks</td>
              <td>{result.averageDelay?.toFixed(1) ?? '—'} ticks</td>
            </tr>
            <tr>
              <th scope="row">Frames still waiting</th>
              <td>{baseline.pending}</td>
              <td>{result.pending}</td>
            </tr>
            <tr>
              <th scope="row">Dropped at retry limit</th>
              <td>{baseline.dropped}</td>
              <td>{result.dropped}</td>
            </tr>
          </tbody>
        </table>
      </ScrollableResults>
      <output className="csma-limit-takeaway">
        {deviceCount === 2 && rate === 2
          ? 'Start with a quiet network, then choose “Busy network”. Compare the collisions, waiting queues, delivery delay and fraction of frames delivered.'
          : `${result.delivered} of ${result.generated} frames arrived within the observation window; ${result.pending} are still waiting and ${result.dropped} were dropped. More demand does not create more channel capacity.`}
      </output>
      <p className="csma-limit-note">
        Average delay includes delivered frames only; frames still waiting may
        take much longer. Throughput can rise at first, then saturate or fall as
        load increases. Delivery share and delay describe different aspects of
        performance. Adding idle devices alone does not create collisions.
      </p>
      <details className="csma-detail">
        <summary>How this classroom model works</summary>
        <p>
          Each device independently generates frames at the selected average
          rate. Queued devices sense the channel; starts in the same model tick
          collide. Colliding frames are aborted, followed by a jam and
          independent binary exponential back-off. A retry still checks for an
          idle channel. Frames are abandoned after 16 failed attempts.
        </p>
        <p>
          A frame occupies six model ticks; a collision and a jam each occupy
          one. The timeline groups propagation into ticks and omits the
          inter-frame gap. These compressed durations and unbounded teaching
          queues are illustrative, not Ethernet timings, measured throughput or
          a prediction for a real network. Changing a control restarts the
          fixed-length sample; random samples vary. The baseline always uses two
          devices at two frames per 100 ticks.
        </p>
      </details>
    </div>
  );
}

export default function CsmaLimitations() {
  const [topic, setTopic] = useState(0);
  return (
    <section
      className="csma-limitations"
      id="csma-limitations"
      aria-labelledby="csma-limitations-title"
    >
      <header>
        <div>
          <p className="csma-overline">EXPLORE THE DISADVANTAGES</p>
          <h2 id="csma-limitations-title">
            When sharing becomes a bottleneck.
          </h2>
          <p>
            Four experiments about delay, wasted time, priority and heavy
            traffic.
          </p>
        </div>
        <AlertTriangle size={30} aria-hidden="true" />
      </header>
      <fieldset className="csma-limit-topics">
        <legend className="sr-only">Disadvantage experiments</legend>
        {topics.map(([title, description], index) => (
          <button
            key={title}
            aria-pressed={topic === index}
            aria-controls="csma-limit-panel"
            onClick={() => setTopic(index)}
          >
            <span>0{index + 1}</span>
            <strong>{title}</strong>
            <small>{description}</small>
          </button>
        ))}
      </fieldset>
      <div id="csma-limit-panel" key={topic}>
        {topic === 0 ? (
          <LongWaits />
        ) : topic === 1 ? (
          <RepeatedJams />
        ) : topic === 2 ? (
          <NoPriority />
        ) : (
          <MoreTraffic />
        )}
      </div>
      <p className="csma-limit-scope">
        Applies to one shared half-duplex Ethernet collision domain. Switched
        full-duplex Ethernet does not use CSMA/CD.
      </p>
    </section>
  );
}
