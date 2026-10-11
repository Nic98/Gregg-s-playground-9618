export const arrayCapacity = 5;
export type StructureKind = 'linear' | 'circular' | 'stack';
export type StructureAction = 'insert' | 'remove';
export interface StructureEvent {
  action: StructureAction;
  ok: boolean;
  message: string;
  value?: string;
  index?: number;
  wrapped?: boolean;
}
export interface StructureState {
  kind: StructureKind;
  // Index 0 is deliberately unused. All reads and writes use 1..5.
  cells: (string | null)[];
  front: number;
  rear: number;
  top: number;
  count: number;
  sequence: number;
  last: StructureEvent | null;
}
export function emptyStructure(kind: StructureKind): StructureState {
  return {
    kind,
    cells: Array(arrayCapacity + 1).fill(null),
    front: 1,
    rear: 0,
    top: 0,
    count: 0,
    sequence: 0,
    last: null,
  };
}
export function structureIsEmpty(s: StructureState) {
  if (s.kind === 'stack') return s.top === 0;
  if (s.kind === 'linear') return s.front > s.rear;
  return s.count === 0;
}
export function structureIsFull(s: StructureState) {
  if (s.kind === 'stack') return s.top === arrayCapacity;
  if (s.kind === 'linear') return s.rear === arrayCapacity;
  return s.count === arrayCapacity;
}
export function structureIndices(s: StructureState): number[] {
  if (s.kind === 'stack')
    return Array.from({ length: s.count }, (_, i) => s.top - i);
  return Array.from({ length: s.count }, (_, i) =>
    s.kind === 'circular'
      ? ((s.front - 1 + i) % arrayCapacity) + 1
      : s.front + i,
  );
}
export function structureValues(s: StructureState) {
  return structureIndices(s).map((i) => s.cells[i]!);
}
export function operateStructure(
  s: StructureState,
  action: StructureAction,
  input = '',
): StructureState {
  const fail = (message: string): StructureState => ({
    ...s,
    sequence: s.sequence + 1,
    last: { action, ok: false, message },
  });
  if (action === 'insert' && structureIsFull(s)) {
    return fail(
      s.kind === 'linear'
        ? 'Overflow: rear is at 5. This linear queue cannot reuse earlier slots; reset to start again.'
        : 'Overflow: all five slots are occupied. Remove an item before inserting.',
    );
  }
  if (action === 'remove' && structureIsEmpty(s))
    return fail(
      'Underflow: there is no item to remove. The pointers stay unchanged.',
    );
  const value = input.trim();
  if (action === 'insert' && (!value || value.length > 8))
    return fail('Enter a value of 1–8 characters.');
  const next: StructureState = {
    ...s,
    cells: [...s.cells],
    sequence: s.sequence + 1,
  };
  let index: number;
  let wrapped = false;
  let message: string;
  if (action === 'insert') {
    if (s.kind === 'stack') {
      next.top++;
      index = next.top;
      message = `Push ${value}: top ${s.top} → ${next.top}, then write Stack[${index}].`;
    } else {
      next.rear =
        s.kind === 'circular' ? (s.rear % arrayCapacity) + 1 : s.rear + 1;
      index = next.rear;
      wrapped = s.rear === arrayCapacity;
      message = `Enqueue ${value}: rear ${s.rear} → ${next.rear}${wrapped ? ' (wrap)' : ''}, then write Queue[${index}].`;
    }
    next.cells[index] = value;
    next.count++;
    next.last = { action, ok: true, index, value, wrapped, message };
  } else {
    index = s.kind === 'stack' ? s.top : s.front;
    const removed = s.cells[index]!;
    if (s.kind === 'stack') {
      next.top--;
      message = `Pop returns ${removed} from Stack[${index}], then top ${s.top} → ${next.top}.`;
    } else {
      next.front =
        s.kind === 'circular' ? (s.front % arrayCapacity) + 1 : s.front + 1;
      wrapped = s.front === arrayCapacity && s.kind === 'circular';
      message = `Dequeue returns ${removed} from Queue[${index}], then front ${s.front} → ${next.front}${wrapped ? ' (wrap)' : ''}.`;
    }
    next.count--;
    // Old array contents may remain in memory; membership is determined by pointers/count.
    next.last = { action, ok: true, index, value: removed, wrapped, message };
  }
  return next;
}
export function exampleStructure(kind: StructureKind): StructureState {
  let s = emptyStructure(kind);
  for (const value of ['A', 'B', 'C']) s = operateStructure(s, 'insert', value);
  return { ...s, sequence: 0, last: null };
}
export function boundaryStructure(kind: StructureKind): StructureState {
  let s = exampleStructure(kind);
  for (const value of ['D', 'E']) s = operateStructure(s, 'insert', value);
  if (kind !== 'stack') {
    s = operateStructure(s, 'remove');
    s = operateStructure(s, 'remove');
  }
  if (kind === 'circular') s = operateStructure(s, 'insert', 'F');
  return { ...s, sequence: 0, last: null };
}
export const structureLessons = {
  linear: {
    title: 'Linear Queue',
    path: '/chapters/10/linear-queue',
    insert: 'Enqueue',
    remove: 'Dequeue',
    rule: 'FIRST IN, FIRST OUT',
    intro:
      'Enqueue at the rear; dequeue at the front. The pointers move forwards and never wrap.',
    emptyRule: 'front > rear',
    fullRule: 'rear = 5',
    init: 'front ← 1\nrear ← 0',
    boundary: 'Show stranded space',
    insertCode:
      'IF rear = 5 THEN\n    OUTPUT "Queue full"\nELSE\n    rear ← rear + 1\n    Queue[rear] ← newItem\nENDIF',
    removeCode:
      'IF front > rear THEN\n    OUTPUT "Queue empty"\nELSE\n    item ← Queue[front]\n    front ← front + 1\n    RETURN item\nENDIF',
  },
  circular: {
    title: 'Circular Queue',
    path: '/chapters/10/circular-queue',
    insert: 'Enqueue',
    remove: 'Dequeue',
    rule: 'FIRST IN, FIRST OUT',
    intro:
      'Reuse released slots by wrapping from index 5 to index 1. A count distinguishes empty from full.',
    emptyRule: 'count = 0',
    fullRule: 'count = 5',
    init: 'front ← 1\nrear ← 0\ncount ← 0',
    boundary: 'Show wrap-around',
    insertCode:
      'IF count = 5 THEN\n    OUTPUT "Queue full"\nELSE\n    rear ← (rear MOD 5) + 1\n    Queue[rear] ← newItem\n    count ← count + 1\nENDIF',
    removeCode:
      'IF count = 0 THEN\n    OUTPUT "Queue empty"\nELSE\n    item ← Queue[front]\n    front ← (front MOD 5) + 1\n    count ← count - 1\n    RETURN item\nENDIF',
  },
  stack: {
    title: 'Stack',
    path: '/chapters/10/stack',
    insert: 'Push',
    remove: 'Pop',
    rule: 'LAST IN, FIRST OUT',
    intro:
      'Push and pop at the same end: the top. The item added most recently is the first to leave.',
    emptyRule: 'top = 0',
    fullRule: 'top = 5',
    init: 'top ← 0',
    boundary: 'Show full stack',
    insertCode:
      'IF top = 5 THEN\n    OUTPUT "Stack full"\nELSE\n    top ← top + 1\n    Stack[top] ← newItem\nENDIF',
    removeCode:
      'IF top = 0 THEN\n    OUTPUT "Stack empty"\nELSE\n    item ← Stack[top]\n    top ← top - 1\n    RETURN item\nENDIF',
  },
} as const;
