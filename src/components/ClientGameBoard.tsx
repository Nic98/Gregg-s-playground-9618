/* oxlint-disable jsx-a11y/prefer-tag-over-role -- An inline SVG needs an image role for its dynamic accessible description. */
import { maze, packets, pointKey, type GameState } from '../clientGame';

export function ClientGameBoard({
  game,
  label,
  offline = false,
}: {
  game: GameState;
  label: string;
  offline?: boolean;
}) {
  return (
    <div className="client-game-screen">
      <svg
        viewBox="0 0 440 280"
        role="img"
        aria-label={`${label}: player at column ${game.player.x}, row ${game.player.y}; ${game.collected.length} of 3 packets${game.won ? '; level complete' : ''}`}
      >
        <title>{label} — Packet Run</title>
        <rect width="440" height="280" fill="#101921" />
        {maze.flatMap((row, y) =>
          row
            .split('')
            .map((cell, x) =>
              cell === '#' ? (
                <rect
                  key={`${x}-${y}`}
                  x={x * 40 + 3}
                  y={y * 40 + 3}
                  width="34"
                  height="34"
                  rx="5"
                  fill="#283b4b"
                  stroke="#354e60"
                />
              ) : (
                <circle
                  key={`${x}-${y}`}
                  cx={x * 40 + 20}
                  cy={y * 40 + 20}
                  r="1.4"
                  fill="#3b5260"
                />
              ),
            ),
        )}
        <rect
          x="366"
          y="46"
          width="28"
          height="28"
          rx="5"
          fill={game.collected.length === 3 ? '#b9f24c' : '#425745'}
        />
        <text
          x="380"
          y="63"
          textAnchor="middle"
          fontSize="12"
          fontWeight="800"
          fill={game.collected.length === 3 ? '#101921' : '#e8f5d7'}
        >
          EXIT
        </text>
        {packets
          .filter((packet) => !game.collected.includes(pointKey(packet)))
          .map((packet) => (
            <path
              key={pointKey(packet)}
              d={`M ${packet.x * 40 + 20} ${packet.y * 40 + 9} l 11 11 l -11 11 l -11 -11 Z`}
              fill="#ffb651"
              stroke="#ffe3a7"
              strokeWidth="2"
            />
          ))}
        <g
          data-testid={`${label.toLowerCase()}-player`}
          transform={`translate(${game.player.x * 40 + 20} ${game.player.y * 40 + 20})`}
        >
          <circle r="14" fill="var(--game-player, #86ddf0)" opacity=".15" />
          <circle
            r="10"
            fill="var(--game-player, #86ddf0)"
            stroke="#ffffff"
            strokeWidth="2"
          />
        </g>
      </svg>
      {offline && (
        <div className="client-offline">
          <strong>Stream disconnected</strong>
          <span>Last received frame · local game still works</span>
        </div>
      )}
      {game.won && !offline && (
        <output className="client-win">All packets delivered ✓</output>
      )}
    </div>
  );
}
