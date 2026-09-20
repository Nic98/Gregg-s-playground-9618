import { useMemo, useState } from 'react';
import { AlertTriangle, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { chooseBackoff } from '../demos/csma';
import { simulateLoad } from '../demos/csmaLoad';
import {
  contentionStory,
  priorityStory,
  storyPosition,
  timeStory,
  type SceneBeat,
} from '../demos/csmaStories';
import {
  AnimationControls,
  NetworkAnimation,
  useAnimation,
} from './CsmaAnimation';
import './csma-limitations.css';

const topics = [
  ['Long waits', 'Watch the same frames wait, retry and collide again.'],
  ['Repeated jams', 'Watch warning signals fill the channel without delivery.'],
  ['No priority', 'Watch a routine frame arrive before an urgent one.'],
  ['More traffic', 'Watch queues grow as more devices compete.'],
] as const;
function Counters({ values }: { values: [string, string | number][] }) {
  return (
    <div className="csma-motion-counters">
      {values.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}
function ContentionReplay({
  mode,
  recover,
  autoPlay,
}: {
  mode: number;
  recover: boolean;
  autoPlay: boolean;
}) {
  const story = useMemo(() => contentionStory(recover ? 1 : null), [recover]);
  const duration = story[story.length - 1].end;
  const clock = useAnimation(duration, autoPlay);
  const { beat, progress } = storyPosition(story, clock.elapsed);
  return (
    <>
      <AnimationControls clock={clock} duration={duration} next={beat.end}>
        {!recover && (
          <Button
            variant="outline"
            onClick={() => clock.seek(story[story.length - 1].start)}
          >
            Jump to retry limit
          </Button>
        )}
      </AnimationControls>
      <NetworkAnimation beat={beat} progress={progress} />
      <Counters
        values={[
          ['Collision count', beat.collisions],
          [
            mode === 0 ? 'Possible back-off' : 'Channel is carrying',
            mode === 0
              ? `0–${beat.maximum} slots`
              : beat.phase === 'jam'
                ? 'Jam, not data'
                : beat.phase === 'send'
                  ? 'Frames'
                  : beat.phase === 'done'
                    ? 'Delivery complete'
                    : 'No valid delivery yet',
          ],
          ['Frames arrived', `${beat.delivered} / 2`],
        ]}
      />
      <p className="csma-motion-lesson">
        {mode === 0
          ? 'The circles count down. Another collision can mean another, much longer wait.'
          : 'Red waves are jam signals. Watch the receiver: it stays at zero while collisions repeat.'}
      </p>
      <details className="csma-detail">
        <summary>Explanation and timing</summary>
        <p>
          This replay deliberately gives both devices equal draws so repeated
          collisions are easy to see. The example draws include 1, 3, 2 and 12
          slots: the range grows, but each draw need not be longer. Countdown
          durations are compressed for teaching, not real Ethernet timings.
        </p>
        <p>
          The random range is capped at 0–1023 slots after collision 10. After
          16 failed attempts the frames are abandoned. Each jam is brief;
          repeated collisions create repeated jams, not one permanent jam
          signal.
        </p>
      </details>
    </>
  );
}
function ContentionExperiment({
  mode,
  autoPlay,
}: {
  mode: number;
  autoPlay: boolean;
}) {
  const [recover, setRecover] = useState(false);
  const [run, setRun] = useState(0);
  return (
    <div className="csma-limit-experiment">
      <div className="csma-limit-copy">
        <h3>
          {mode === 0
            ? '1. The packet keeps waiting.'
            : '2. Busy wire. Empty receiver.'}
        </h3>
        <p>
          {mode === 0
            ? 'Press Play. Watch the packets collide, the countdowns grow and the receiver keep waiting.'
            : 'Press Play. Follow the collision → jam → wait loop, then compare it with a successful retry.'}
        </p>
      </div>
      <div className="csma-motion-presets">
        <Button
          variant={recover ? 'outline' : 'accent'}
          onClick={() => {
            setRecover(false);
            setRun(run + 1);
          }}
        >
          Repeat collisions
        </Button>
        <Button
          variant={recover ? 'accent' : 'outline'}
          onClick={() => {
            setRecover(true);
            setRun(run + 1);
          }}
        >
          Compare: different waits
        </Button>
        <span>Changing the example starts a fresh replay.</span>
      </div>
      <ContentionReplay
        key={`${recover}-${run}`}
        mode={mode}
        recover={recover}
        autoPlay={autoPlay || run > 0}
      />
    </div>
  );
}
function PriorityReplay({
  a,
  b,
  urgent,
  autoPlay,
}: {
  a: number;
  b: number;
  urgent: string;
  autoPlay: boolean;
}) {
  const story = useMemo(() => priorityStory(a, b), [a, b]);
  const duration = story[story.length - 1].end;
  const clock = useAnimation(duration, autoPlay);
  const { beat, progress } = storyPosition(story, clock.elapsed);
  return (
    <>
      <AnimationControls clock={clock} duration={duration} next={beat.end} />
      <NetworkAnimation beat={beat} progress={progress} urgent={urgent} />
      <Counters
        values={[
          ['Device A drew', `${a} slots`],
          ['Device B drew', `${b} slots`],
          ['Frames arrived', `${beat.delivered} / 2`],
        ]}
      />
      <p className="csma-motion-lesson">
        {a === b
          ? 'Equal waits cause another collision. An urgent label cannot break the tie.'
          : `Device ${a < b ? 'A' : 'B'} goes first. ${urgent === (a < b ? 'A' : 'B') ? 'It won because of its shorter wait, not its urgent label.' : 'The routine frame beats the urgent frame.'}`}
      </p>
    </>
  );
}
function NoPriority({ autoPlay }: { autoPlay: boolean }) {
  const [urgent, setUrgent] = useState('A');
  const [waits, setWaits] = useState(() => chooseBackoff(3, 0.5, 0));
  const [run, setRun] = useState(0);
  return (
    <div className="csma-limit-experiment">
      <div className="csma-limit-copy">
        <h3>3. Urgent does not get a fast lane.</h3>
        <p>
          The orange packet is urgent. Watch which frame reaches the receiver
          first, then swap the urgent label.
        </p>
      </div>
      <div className="csma-motion-presets">
        <label className="csma-urgent-control" htmlFor="csma-urgent">
          Urgent device
          <select
            id="csma-urgent"
            value={urgent}
            onChange={(event) => setUrgent(event.target.value)}
          >
            <option value="A">Device A</option>
            <option value="B">Device B</option>
          </select>
        </label>
        <Button
          variant="outline"
          onClick={() => {
            setWaits(chooseBackoff(3, Math.random(), Math.random()));
            setRun(run + 1);
          }}
        >
          <Shuffle size={16} /> New random waits
        </Button>
      </div>
      <PriorityReplay
        key={run}
        a={waits.a}
        b={waits.b}
        urgent={urgent}
        autoPlay={autoPlay || run > 0}
      />
      <details className="csma-detail">
        <summary>Why changing the label changes nothing</summary>
        <p>
          Changing urgency keeps the same waits and replay position. Basic
          CSMA/CD does not read the urgent label and has no built-in priority
          mechanism. A device whose wait has expired must still defer while
          another frame occupies the channel. These frames use a 0–7 slot range
          after three previous collisions; playback timings are illustrative.
        </p>
      </details>
    </div>
  );
}
function TrafficReplay({
  count,
  rate,
  seed,
  autoPlay,
}: {
  count: number;
  rate: number;
  seed: number;
  autoPlay: boolean;
}) {
  const result = useMemo(
    () => simulateLoad(count, rate, seed),
    [count, rate, seed],
  );
  const baseline = useMemo(() => simulateLoad(2, 2, seed), [seed]);
  const story = useMemo(
    () =>
      timeStory([
        ...result.snapshots.map(
          (snapshot, index): SceneBeat => ({
            tick: index + 1,
            phase:
              snapshot.phase === 'data'
                ? 'send'
                : snapshot.phase === 'idle'
                  ? 'listen'
                  : snapshot.phase,
            duration:
              snapshot.phase === 'collision' || snapshot.phase === 'jam'
                ? 450
                : snapshot.phase === 'data'
                  ? 120
                  : 80,
            caption:
              snapshot.phase === 'collision'
                ? 'Several devices start together. Their frames collide.'
                : snapshot.phase === 'jam'
                  ? 'Jam tells the senders to stop. No useful frame arrives.'
                  : snapshot.phase === 'data'
                    ? `Device D${snapshot.senders[0] + 1} is sending. Everyone else must wait.`
                    : 'The channel is idle. Queued devices still need to finish their back-off.',
            devices: snapshot.queues.map((queued, id) => ({
              id: `D${id + 1}`,
              queued:
                queued +
                (snapshot.phase === 'data' &&
                snapshot.progress === 1 &&
                snapshot.senders.includes(id)
                  ? 1
                  : 0),
              wait: snapshot.waits[id],
              status: 'Queued',
            })),
            senders: snapshot.senders,
            delivered: index ? result.snapshots[index - 1].delivered : 0,
            collisions: snapshot.collisions,
            maximum: 0,
          }),
        ),
        {
          phase: 'done',
          duration: 1200,
          caption:
            'Replay finished. The waiting packets have not disappeared: they are still in the queues.',
          devices: result.devices.map((device) => ({
            id: `D${device.id + 1}`,
            queued: device.queue.length,
            wait: 0,
            status: 'Queued',
          })),
          senders: [],
          delivered: result.delivered,
          collisions: result.collisions,
          maximum: 0,
          tick: 601,
        },
      ]),
    [result],
  );
  const duration = story[story.length - 1].end;
  const clock = useAnimation(duration, autoPlay);
  const { beat, progress } = storyPosition(story, clock.elapsed);
  const completedTicks = Math.min(600, (beat.tick ?? 1) - 1);
  const current = result.snapshots[completedTicks - 1];
  const quiet = baseline.snapshots[completedTicks - 1];
  const frame = result.snapshots[completedTicks];
  const last = result.snapshots[completedTicks - 1];
  const previousProgress =
    last?.phase === 'data' &&
    last.progress < 1 &&
    last.senders[0] === frame?.senders[0]
      ? last.progress
      : 0;
  const sendProgress =
    frame?.phase === 'data'
      ? previousProgress + (frame.progress - previousProgress) * progress
      : progress / 0.6;
  const visualBeat =
    beat.phase === 'collision' && progress < 0.6
      ? { ...beat, phase: 'send' as const }
      : beat;
  const visualProgress =
    beat.phase === 'collision' && progress >= 0.6
      ? (progress - 0.6) / 0.4
      : progress;
  const percent = (delivered = 0, generated = 0) =>
    generated ? Math.round((100 * delivered) / generated) : 0;
  return (
    <>
      <AnimationControls clock={clock} duration={duration} next={beat.end}>
        <Button
          variant="outline"
          onClick={() => clock.seek(story[story.length - 1].start)}
        >
          Show end of run
        </Button>
      </AnimationControls>
      <NetworkAnimation
        beat={visualBeat}
        progress={visualProgress}
        packetProgress={Math.min(1, sendProgress)}
      />
      <Counters
        values={[
          ['Model ticks', `${completedTicks} / 600`],
          ['Collisions', current?.collisions ?? 0],
          ['Frames awaiting delivery', current?.pending ?? 0],
        ]}
      />
      <div className="csma-motion-comparison">
        {[
          { name: 'Quiet baseline', data: quiet },
          { name: 'Your network', data: current },
        ].map(({ name, data }) => {
          const share = percent(data?.delivered, data?.generated);
          return (
            <div key={name}>
              <h4>{name}</h4>
              <p>
                <strong>{data?.delivered ?? 0}</strong> / {data?.generated ?? 0}{' '}
                frames arrived <b>{share}%</b>
              </p>
              <div className="csma-motion-meter">
                <span style={{ width: `${share}%` }} />
              </div>
              <small>
                {data?.averageDelay?.toFixed(1) ?? '—'} ticks average delivery
                delay
              </small>
            </div>
          );
        })}
      </div>
      <p className="csma-motion-lesson">
        Watch the stacks beside each device. More active devices and more
        traffic mean more competition, longer queues and longer delays.
      </p>
      <details className="csma-detail">
        <summary>Read the numbers and model limits</summary>
        <p>
          Both networks are compared after the same {completedTicks} model
          ticks. Your network has generated {current?.generated ?? 0} frames,
          delivered {current?.delivered ?? 0}, dropped {current?.dropped ?? 0}{' '}
          at the retry limit, and still has {current?.pending ?? 0} waiting.
          Each small block is a queued frame; stacks show up to six blocks, with
          the full count beside them.
        </p>
        <p>
          Collision and jam events are slowed down so you can see them. Playback
          time is not network time. Arrivals, carrier sense, binary exponential
          back-off and the 16-attempt limit are simulated. Frames take six model
          ticks; collisions and jams each take one. Propagation and inter-frame
          timing are simplified. The quiet baseline always has two devices
          generating two frames per 100 ticks.
        </p>
        <p>
          Average delay includes delivered frames only. Throughput may rise
          initially before saturating or falling; adding idle devices alone does
          not cause collisions. This is a classroom model, not a real-network
          benchmark.
        </p>
      </details>
    </>
  );
}
function MoreTraffic({ autoPlay }: { autoPlay: boolean }) {
  const [config, setConfig] = useState({ count: 2, rate: 2, seed: 7 });
  const [changed, setChanged] = useState(false);
  function update(next: Partial<typeof config>) {
    setConfig({ ...config, ...next });
    setChanged(true);
  }
  return (
    <div className="csma-limit-experiment">
      <div className="csma-limit-copy">
        <h3>4. More devices. A growing queue.</h3>
        <p>
          Start the quiet network, then choose Busy network. Watch packets pile
          up while all devices compete for the same wire.
        </p>
      </div>
      <div className="csma-load-controls">
        <label htmlFor="csma-load-devices">
          Active devices <strong>{config.count}</strong>
          <input
            id="csma-load-devices"
            type="range"
            min="2"
            max="24"
            value={config.count}
            onChange={(event) => update({ count: Number(event.target.value) })}
          />
        </label>
        <label htmlFor="csma-load-rate">
          Traffic per device <strong>{config.rate} frames / 100 ticks</strong>
          <input
            id="csma-load-rate"
            type="range"
            min="1"
            max="12"
            value={config.rate}
            onChange={(event) => update({ rate: Number(event.target.value) })}
          />
        </label>
      </div>
      <div className="csma-motion-presets">
        <Button
          variant="outline"
          onClick={() => update({ count: 2, rate: 2, seed: config.seed + 1 })}
        >
          Quiet network
        </Button>
        <Button
          variant="accent"
          onClick={() => update({ count: 20, rate: 12, seed: config.seed + 1 })}
        >
          Busy network
        </Button>
        <span>Changing a setting starts a fresh animated run.</span>
      </div>
      <TrafficReplay
        key={`${config.count}-${config.rate}-${config.seed}`}
        {...config}
        autoPlay={autoPlay || changed}
      />
    </div>
  );
}
export default function CsmaLimitations() {
  const [topic, setTopic] = useState(0);
  const [chosen, setChosen] = useState(false);
  return (
    <section
      className="csma-limitations"
      id="csma-limitations"
      aria-labelledby="csma-limitations-title"
    >
      <header>
        <div>
          <p className="csma-overline">WATCH THE DISADVANTAGES HAPPEN</p>
          <h2 id="csma-limitations-title">
            When sharing becomes a bottleneck.
          </h2>
          <p>
            Follow the packets. Watch the countdowns. See what reaches the
            receiver.
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
            onClick={() => {
              setTopic(index);
              setChosen(true);
            }}
          >
            <span>0{index + 1}</span>
            <strong>{title}</strong>
            <small>{description}</small>
          </button>
        ))}
      </fieldset>
      <div id="csma-limit-panel" key={topic}>
        {topic < 2 ? (
          <ContentionExperiment mode={topic} autoPlay={chosen} />
        ) : topic === 2 ? (
          <NoPriority autoPlay={chosen} />
        ) : (
          <MoreTraffic autoPlay={chosen} />
        )}
      </div>
      <p className="csma-limit-scope">
        Shared half-duplex Ethernet only. Playback is slowed and compressed for
        teaching. Pause or step through any moment; switching experiments starts
        a fresh replay.
      </p>
    </section>
  );
}
