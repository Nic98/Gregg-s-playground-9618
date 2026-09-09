export type Direction = 'up' | 'down' | 'left' | 'right';
export type Point = { x: number; y: number };
export interface GameState {
  player: Point;
  collected: string[];
  moves: number;
  won: boolean;
}
export const maze = [
  '###########',
  '#S..#....E#',
  '#.#.#.###.#',
  '#.#...#...#',
  '#.###.#.#.#',
  '#.....#...#',
  '###########',
];
export const packets: Point[] = [
  { x: 3, y: 1 },
  { x: 5, y: 3 },
  { x: 9, y: 5 },
];
export const pointKey = (point: Point) => `${point.x},${point.y}`;
export const initialGame = (): GameState => ({
  player: { x: 1, y: 1 },
  collected: [],
  moves: 0,
  won: false,
});
export const exampleRoute: Direction[] = [
  'right',
  'right',
  'down',
  'down',
  'right',
  'right',
  'up',
  'up',
  'right',
  'right',
  'right',
  'right',
  'down',
  'down',
  'down',
  'down',
  'up',
  'up',
  'up',
  'up',
];
export function movePlayer(state: GameState, direction: Direction): GameState {
  if (state.won) return state;
  const delta: Record<Direction, Point> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const player = {
    x: state.player.x + delta[direction].x,
    y: state.player.y + delta[direction].y,
  };
  const cell = maze[player.y]?.[player.x];
  if (!cell || cell === '#') return state;
  const key = pointKey(player);
  const collected =
    packets.some((packet) => pointKey(packet) === key) &&
    !state.collected.includes(key)
      ? [...state.collected, key]
      : state.collected;
  return {
    player,
    collected,
    moves: state.moves + 1,
    won: cell === 'E' && collected.length === packets.length,
  };
}
