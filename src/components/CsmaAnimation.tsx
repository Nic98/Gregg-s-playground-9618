import { useEffect, useState, type ReactNode } from 'react';
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SceneBeat } from '../demos/csmaStories';
import './csma-animation.css';

export function useAnimation(duration: number, autoPlay = false) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(
    () =>
      autoPlay &&
      !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );
  const [speed, setSpeed] = useState(1);
  const active = playing && elapsed < duration;
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(
      () => setElapsed((time) => Math.min(duration, time + 33 * speed)),
      33,
    );
    return () => window.clearInterval(timer);
  }, [active, duration, speed]);
  return {
    elapsed,
    active,
    speed,
    setSpeed,
    toggle: () => {
      if (elapsed >= duration) setElapsed(0);
      setPlaying(!active);
    },
    seek: (time: number) => {
      setPlaying(false);
      setElapsed(Math.min(duration, Math.max(0, time)));
    },
    replay: () => {
      setElapsed(0);
      setPlaying(true);
    },
  };
}
export type AnimationClock = ReturnType<typeof useAnimation>;
export function AnimationControls({
  clock,
  duration,
  next,
  children,
}: {
  clock: AnimationClock;
  duration: number;
  next: number;
  children?: ReactNode;
}) {
  return (
    <div className="csma-animation-controls">
      <div className="csma-animation-buttons">
        <Button variant="accent" onClick={clock.toggle}>
          {clock.active ? <Pause size={17} /> : <Play size={17} />}
          {clock.active ? 'Pause animation' : 'Play animation'}
        </Button>
        <Button
          variant="outline"
          onClick={() => clock.seek(next)}
          disabled={clock.elapsed >= duration}
        >
          <SkipForward size={16} /> Step forward
        </Button>
        <Button variant="outline" onClick={clock.replay}>
          <RotateCcw size={16} /> Replay
        </Button>
        <label>
          Animation speed
          <select
            value={clock.speed}
            onChange={(event) => clock.setSpeed(Number(event.target.value))}
          >
            <option value={0.5}>Slow · 0.5×</option>
            <option value={1}>Normal · 1×</option>
            <option value={2}>Fast · 2×</option>
          </select>
        </label>
        {children}
      </div>
      <label className="csma-animation-scrub">
        Replay timeline
        <input
          type="range"
          aria-label="Animation timeline"
          min={0}
          max={duration}
          step={1}
          value={clock.elapsed}
          onChange={(event) => clock.seek(Number(event.target.value))}
        />
      </label>
    </div>
  );
}

function pointOnRoute(
  x: number,
  y: number,
  destination: number,
  progress: number,
) {
  if (progress < 0.25) return [x, y + (245 - y) * progress * 4];
  return [x + ((destination - x) * (progress - 0.25)) / 0.75, 245];
}
export function NetworkAnimation({
  beat,
  progress,
  urgent,
  packetProgress,
  delivered = beat.delivered,
}: {
  beat: SceneBeat;
  progress: number;
  urgent?: string;
  packetProgress?: number;
  delivered?: number;
}) {
  const small = beat.devices.length <= 2;
  const cols = Math.min(beat.devices.length, 12);
  const position = (index: number) =>
    small
      ? [index ? 600 : 180, 95]
      : [
          55 + ((index % 12) * 740) / Math.max(1, cols - 1),
          index < 12 ? 85 : 392,
        ];
  const crashing = beat.phase === 'collision';
  const jam = beat.phase === 'jam';
  const competing = beat.senders.length > 1;
  const remaining = (wait: number) =>
    Math.max(0, wait - Math.floor(progress * (beat.slotSpan ?? 0)));
  return (
    <figure className={`csma-motion-stage motion-${beat.phase}`}>
      <div className="csma-motion-heading">
        <span>ONE SHARED CHANNEL</span>
        <strong>
          {beat.phase === 'send'
            ? competing
              ? 'TWO SENDERS'
              : 'TRANSMITTING'
            : beat.phase === 'jam'
              ? 'JAM SIGNAL'
              : beat.phase === 'collision'
                ? 'COLLISION'
                : beat.phase === 'failed'
                  ? 'RETRY LIMIT'
                  : beat.phase === 'done'
                    ? 'REPLAY COMPLETE'
                    : beat.phase === 'wait'
                      ? 'BACK-OFF'
                      : 'LISTENING'}
        </strong>
      </div>
      <svg viewBox={`0 0 1000 ${small ? 420 : 490}`} aria-hidden="true">
        <defs>
          <filter id="csma-packet-glow">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        <path
          d="M30 245H875"
          stroke="#294453"
          strokeWidth="15"
          strokeLinecap="round"
        />
        <path
          d="M30 245H875"
          stroke={jam || crashing ? '#ff8f74' : '#6d94a4'}
          strokeWidth="4"
          strokeDasharray={jam ? '18 9' : undefined}
          strokeDashoffset={-progress * 180}
        />
        {beat.devices.map((device, index) => {
          const [x, y] = position(index);
          const sender = beat.phase === 'send' && beat.senders.includes(index);
          const queued = Math.max(0, device.queued - (sender ? 1 : 0));
          const colour =
            urgent === device.id
              ? '#ffb46b'
              : index % 2
                ? '#c4a3ff'
                : '#83deec';
          const count = remaining(device.wait);
          return (
            <g key={device.id}>
              <path
                d={`M${x} ${y}V245`}
                stroke={sender ? colour : '#416171'}
                strokeWidth={sender ? 4 : 2}
              />
              <rect
                x={x - (small ? 79 : 24)}
                y={y - (small ? 33 : 18)}
                width={small ? 158 : 48}
                height={small ? 66 : 36}
                rx={small ? 12 : 6}
                fill="#1c3443"
                stroke={colour}
                strokeWidth={2}
              />
              <text
                x={x}
                y={y + (small ? 9 : 5)}
                textAnchor="middle"
                fill={colour}
                fontSize={small ? 27 : 16}
                fontWeight="700"
              >
                {small ? `Device ${device.id}` : device.id}
              </text>
              {urgent === device.id && (
                <text
                  x={x}
                  y={y - 48}
                  textAnchor="middle"
                  fill="#ffb46b"
                  fontSize="23"
                  fontWeight="800"
                >
                  URGENT
                </text>
              )}
              {!urgent && small && (
                <text
                  x={x}
                  y={y - 50}
                  textAnchor="middle"
                  fill="#b8ccdb"
                  fontSize="19"
                >
                  {sender
                    ? 'Frame in transit'
                    : device.queued
                      ? 'Frame still waiting'
                      : 'No frame queued'}
                </text>
              )}
              {urgent && urgent !== device.id && (
                <text
                  x={x}
                  y={y - 48}
                  textAnchor="middle"
                  fill="#c4a3ff"
                  fontSize="23"
                >
                  ROUTINE
                </text>
              )}
              {Array.from(
                { length: Math.min(queued, small ? 1 : 6) },
                (_, block) => (
                  <rect
                    key={block}
                    x={x - (small ? 39 : 17)}
                    y={
                      y +
                      (small
                        ? 46
                        : index < 12
                          ? -34 - block * 8
                          : 28 + block * 8)
                    }
                    width={small ? 78 : 34}
                    height={small ? 25 : 6}
                    rx={3}
                    fill={colour}
                    opacity={0.95 - block * 0.09}
                  />
                ),
              )}
              {!small && (
                <text
                  x={x}
                  y={y + (index < 12 ? 39 : -28)}
                  textAnchor="middle"
                  fill="#f6d796"
                  fontSize="15"
                >
                  {queued}
                </text>
              )}
              {small && (
                <g>
                  <circle
                    cx={x}
                    cy="337"
                    r="35"
                    fill="#152631"
                    stroke="#354b59"
                    strokeWidth="6"
                  />
                  <circle
                    cx={x}
                    cy="337"
                    r="35"
                    fill="none"
                    stroke={colour}
                    strokeWidth="6"
                    strokeDasharray={`${device.wait ? (220 * count) / device.wait : 0} 220`}
                    transform={`rotate(-90 ${x} 337)`}
                  />
                  <text
                    x={x}
                    y="346"
                    fill={colour}
                    fontSize="27"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {count}
                  </text>
                  <text
                    x={x}
                    y="396"
                    fill="#b9ccd9"
                    fontSize="20"
                    textAnchor="middle"
                  >
                    {crashing
                      ? 'collision detected'
                      : jam
                        ? 'abort + jam'
                        : beat.phase === 'failed'
                          ? 'frame abandoned'
                          : count
                            ? 'back-off slots left'
                            : sender
                              ? 'sending'
                              : beat.phase === 'send' && device.queued
                                ? 'channel busy — wait'
                                : device.queued
                                  ? 'listen before sending'
                                  : 'finished'}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {beat.phase === 'send' &&
          beat.senders.map((index) => {
            const [x, y] = position(index);
            const [px, py] = pointOnRoute(
              x,
              y + (small ? 33 : y > 245 ? -18 : 18),
              competing ? 430 : 891,
              packetProgress ?? progress,
            );
            const colour =
              urgent === beat.devices[index].id
                ? '#ffb46b'
                : index % 2
                  ? '#c4a3ff'
                  : '#83deec';
            return (
              <g key={index}>
                <rect
                  x={px - 29}
                  y={py - 19}
                  width="58"
                  height="38"
                  rx="8"
                  fill={colour}
                  opacity="0.3"
                  filter="url(#csma-packet-glow)"
                />
                <rect
                  x={px - 26}
                  y={py - 16}
                  width="52"
                  height="32"
                  rx="6"
                  fill={colour}
                />
                <text
                  x={px}
                  y={py + 7}
                  textAnchor="middle"
                  fill="#152531"
                  fontSize="20"
                  fontWeight="800"
                >
                  {beat.devices[index].id}
                </text>
              </g>
            );
          })}
        {crashing && (
          <g>
            <circle
              cx="430"
              cy="245"
              r={25 + progress * 67}
              fill="#fb756a"
              opacity={0.3 * (1 - progress)}
            />
            <path
              d="M430 193L420 229L385 216L407 247L381 271L418 263L430 299L440 263L478 276L454 247L479 222L443 230Z"
              fill="#ffaf80"
              stroke="#ff5e58"
              strokeWidth="4"
            />
            <text
              x="430"
              y="174"
              fill="#ffc7b6"
              fontSize="30"
              fontWeight="800"
              textAnchor="middle"
            >
              COLLISION!
            </text>
          </g>
        )}
        {jam && (
          <g>
            {[0, 1, 2].map((index) => (
              <circle
                key={index}
                cx="430"
                cy="245"
                r={20 + ((progress + index / 3) % 1) * 410}
                fill="none"
                stroke="#ff9278"
                strokeWidth="5"
                opacity={1 - ((progress + index / 3) % 1)}
              />
            ))}
            <rect
              x="320"
              y="183"
              width="220"
              height="42"
              rx="8"
              fill="#ab453b"
            />
            <text
              x="430"
              y="213"
              textAnchor="middle"
              fill="white"
              fontSize="25"
              fontWeight="800"
            >
              JAM SIGNAL
            </text>
          </g>
        )}
        {beat.phase === 'failed' && (
          <text
            x="430"
            y="210"
            fill="#ffb29c"
            fontSize="31"
            textAnchor="middle"
            fontWeight="800"
          >
            FRAME ABANDONED
          </text>
        )}
        <rect
          x="870"
          y="192"
          width="120"
          height="106"
          rx="13"
          fill={delivered ? '#294835' : '#25343d'}
          stroke={delivered ? '#b9ef83' : '#6d8593'}
          strokeWidth="3"
        />
        <text x="930" y="222" fill="#dceadf" fontSize="18" textAnchor="middle">
          RECEIVER
        </text>
        <text
          x="930"
          y="264"
          fill={delivered ? '#c2f58e' : '#dceadf'}
          fontSize="38"
          fontWeight="800"
          textAnchor="middle"
        >
          {delivered}
        </text>
        <text x="930" y="324" fill="#b9ccd9" fontSize="16" textAnchor="middle">
          frames arrived
        </text>
      </svg>
      <figcaption>
        {beat.caption}
        {!small && (
          <small>Stacks show waiting frames · numbers show queue lengths</small>
        )}
      </figcaption>
    </figure>
  );
}
