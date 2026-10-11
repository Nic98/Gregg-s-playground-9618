import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  arrayCapacity,
  boundaryStructure,
  emptyStructure,
  exampleStructure,
  operateStructure,
  structureIndices,
  structureIsEmpty,
  structureIsFull,
  structureLessons,
  structureValues,
  type StructureAction,
  type StructureKind,
  type StructureState,
} from '../demos/arrayStructures';
import './array-structures.css';

function ArrayDiagram({ state }: { state: StructureState }) {
  const occupied = structureIndices(state);
  const stack = state.kind === 'stack';
  const indices = Array.from({ length: arrayCapacity }, (_, i) =>
    stack ? arrayCapacity - i : i + 1,
  );
  const last = state.last;
  return (
    <figure
      className={`adt-diagram ${stack ? 'adt-stack' : 'adt-queue'}`}
      aria-label={`${structureLessons[state.kind].title} array, indices 1 to 5`}
    >
      <figcaption>
        ARRAY INDEX <span>1-based · capacity 5</span>
      </figcaption>
      {!stack && (
        <div className="adt-pointer-lanes" aria-hidden="true">
          {state.front <= arrayCapacity && (
            <span
              className="adt-pointer adt-front"
              style={{ left: `${(state.front - 1) * 20}%` }}
            >
              front ↓
            </span>
          )}
          {state.rear > 0 && (
            <span
              className="adt-pointer adt-rear"
              style={{ left: `${(state.rear - 1) * 20}%` }}
            >
              rear ↓
            </span>
          )}
        </div>
      )}
      <div className="adt-cells">
        {indices.map((index) => {
          const live = occupied.includes(index);
          const touched = last?.ok && last.index === index;
          return (
            <div
              key={index}
              className={`adt-cell ${live ? 'is-live' : 'is-unused'} ${touched ? 'is-touched' : ''}`}
              aria-label={`Index ${index}: ${live ? state.cells[index] : 'unused'}`}
            >
              <span className="adt-index">[{index}]</span>
              <div
                className="adt-value"
                key={`${index}-${touched ? state.sequence : 'idle'}`}
                data-motion={touched ? last.action : undefined}
              >
                <strong>{live ? state.cells[index] : '—'}</strong>
                <small>
                  {live
                    ? 'in use'
                    : state.cells[index] !== null
                      ? 'released'
                      : 'unused'}
                </small>
              </div>
              {stack && index === state.top && (
                <span className="adt-top">← top</span>
              )}
            </div>
          );
        })}
      </div>
      {state.kind === 'circular' && (
        <div className={`adt-wrap ${last?.wrapped ? 'is-wrapping' : ''}`}>
          <svg
            viewBox="0 0 500 56"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M450 2V25Q450 40 430 40H70Q50 40 50 25V2M44 10L50 2L56 10" />
          </svg>
          <span>5 → 1 · wrap around</span>
        </div>
      )}
      <div className="adt-sentinel">
        {stack
          ? state.top === 0
            ? 'top = 0 · empty stack (no array access)'
            : 'Stack bottom: index 1'
          : state.rear === 0
            ? 'rear = 0 · no insertion yet (no array access)'
            : state.front > arrayCapacity
              ? 'front = 6 · past the end (no array access)'
              : structureIsEmpty(state)
                ? 'Empty queue · front marks the next read position'
                : 'front: next item out · rear: last insertion position'}
      </div>
      <div className="adt-order">
        <span>{stack ? 'POP ORDER' : 'DEQUEUE ORDER'}</span>
        <strong>{structureValues(state).join(' → ') || 'Empty'}</strong>
      </div>
    </figure>
  );
}

export default function ArrayStructurePage({ kind }: { kind: StructureKind }) {
  const lesson = structureLessons[kind];
  const [state, setState] = useState(() => exampleStructure(kind));
  const [input, setInput] = useState('D');
  const [nextLetter, setNextLetter] = useState(3);
  const empty = structureIsEmpty(state),
    full = structureIsFull(state);
  useEffect(() => {
    document.title = `${lesson.title} · Gregg’s AS Playground`;
  }, [lesson.title]);
  function operate(action: StructureAction) {
    const result = operateStructure(state, action, input);
    setState(result);
    if (action === 'insert' && result.last?.ok) {
      const next = (nextLetter + 1) % 26;
      setNextLetter(next);
      setInput(String.fromCharCode(65 + next));
    }
  }
  function reset(boundary = false) {
    setState(boundary ? boundaryStructure(kind) : emptyStructure(kind));
    const next = boundary ? (kind === 'circular' ? 6 : 5) : 0;
    setNextLetter(next);
    setInput(String.fromCharCode(65 + next));
  }
  const last = state.last;
  return (
    <div className="adt-page">
      <nav className="adt-nav" aria-label="Demo navigation">
        <Link to="/chapters/10#section-10-4">
          <ArrowLeft size={17} /> Chapter 10 · 10.4 Abstract data types
        </Link>
        <span>GREGG’S AS PLAYGROUND</span>
      </nav>
      <main className="adt-main">
        <header className="adt-heading">
          <p className="course-kicker">{lesson.rule}</p>
          <h1>{lesson.title}</h1>
          <p>{lesson.intro}</p>
        </header>
        <nav className="adt-switcher" aria-label="Choose a data structure">
          {(Object.keys(structureLessons) as StructureKind[]).map((type) => (
            <Link
              key={type}
              to={structureLessons[type].path}
              aria-current={kind === type ? 'page' : undefined}
            >
              {structureLessons[type].title}
            </Link>
          ))}
        </nav>
        <div className="adt-workspace">
          <section className="adt-board" aria-label="Array and pointers">
            <div className="adt-metrics">
              {kind === 'stack' ? (
                <div>
                  <span>top</span>
                  <strong data-testid="top">{state.top}</strong>
                </div>
              ) : (
                <>
                  <div>
                    <span>front</span>
                    <strong data-testid="front">{state.front}</strong>
                  </div>
                  <div>
                    <span>rear</span>
                    <strong data-testid="rear">{state.rear}</strong>
                  </div>
                </>
              )}
              <div>
                <span>{kind === 'circular' ? 'count' : 'items in use'}</span>
                <strong data-testid="count">
                  {state.count}
                  <small> / 5</small>
                </strong>
              </div>
            </div>
            <ArrayDiagram state={state} />
          </section>
          <section className="adt-console" aria-labelledby="adt-controls-title">
            <h2 id="adt-controls-title">Try an operation</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                operate('insert');
              }}
            >
              <label htmlFor="adt-new-item">New item</label>
              <div className="adt-input-row">
                <input
                  id="adt-new-item"
                  value={input}
                  maxLength={8}
                  onChange={(event) => setInput(event.target.value)}
                  autoComplete="off"
                />
                <Button type="submit" variant="accent">
                  {lesson.insert}
                  <ArrowRight size={16} />
                </Button>
              </div>
            </form>
            <div className="adt-actions">
              <Button variant="default" onClick={() => operate('remove')}>
                {lesson.remove}
                <ArrowLeft size={16} />
              </Button>
              <Button variant="outline" onClick={() => reset()}>
                <RotateCcw size={16} /> Reset empty
              </Button>
            </div>
            <output
              className={`adt-result ${last?.ok === false ? 'is-error' : ''}`}
              aria-live="polite"
              aria-atomic="true"
            >
              {last?.ok && last.action === 'remove' && (
                <strong className="adt-returned" key={state.sequence}>
                  Returned: {last.value}
                </strong>
              )}
              <span>
                {last?.message ||
                  (empty
                    ? 'Empty initial state. Add an item to begin.'
                    : `Next item out: ${structureValues(state)[0]}. Try ${lesson.remove}.`)}
              </span>
            </output>
            <div className="adt-checks">
              <div>
                <span>EMPTY</span>
                <strong data-testid="empty">{empty ? 'TRUE' : 'FALSE'}</strong>
                <code>{lesson.emptyRule}</code>
              </div>
              <div>
                <span>
                  {kind === 'linear' ? 'FULL / NO INSERTION SPACE' : 'FULL'}
                </span>
                <strong data-testid="full">{full ? 'TRUE' : 'FALSE'}</strong>
                <code>{lesson.fullRule}</code>
              </div>
            </div>
            <Button variant="outline" onClick={() => reset(true)}>
              {lesson.boundary}
              <ArrowRight size={16} />
            </Button>
          </section>
        </div>
        <section className="adt-explanation" aria-label="Pointer convention">
          <h2>Follow these pointer definitions</h2>
          {kind === 'stack' ? (
            <p>
              <strong>top points to the current top item.</strong> Increase top
              before writing during Push; read the current top before decreasing
              it during Pop. Empty uses top = 0. Index 0 is a sentinel, not an
              array slot.
            </p>
          ) : (
            <p>
              <strong>
                front points to the next item to dequeue; rear records the last
                insertion position.
              </strong>{' '}
              Advance rear before writing during Enqueue. Read at front before
              advancing it during Dequeue. Before the first insertion, rear = 0
              is a sentinel, not an array slot.
            </p>
          )}
          {kind === 'linear' ? (
            <p className="adt-key-point">
              <strong>Released slots are stranded.</strong> This version does
              not shift items, wrap pointers or automatically reset an empty
              queue. When rear = 5, Enqueue is blocked even if there are fewer
              than five items. After removing every item, EMPTY and FULL can
              both be TRUE: there are no items and no further insertion
              positions. Reset empty starts a fresh run.
            </p>
          ) : kind === 'circular' ? (
            <p className="adt-key-point">
              <strong>Wrap without leaving 1…5.</strong> The next position is
              (position MOD 5) + 1. The count increases after insertion and
              decreases after removal; all five slots can be used. In this
              convention, pointer equality alone does not identify empty or
              full.
            </p>
          ) : (
            <p className="adt-key-point">
              <strong>Both operations use the top.</strong> With A, B, C
              inserted in that order, Pop returns C, then B, then A. After a
              Pop, the released top slot can be reused by the next Push.
            </p>
          )}
          <p className="adt-memory-note">
            Released cells are shown as “—”. Old values need not be erased in
            memory; the pointers and item count determine which cells belong to
            the structure.
          </p>
        </section>
        <section
          className="adt-algorithms"
          aria-labelledby="adt-algorithms-title"
        >
          <header>
            <h2 id="adt-algorithms-title">The same operations in pseudocode</h2>
            <p>
              Array bounds: <code>ARRAY[1:5] OF STRING</code>. Other pointer
              conventions require different conditions.
            </p>
          </header>
          <details>
            <summary>Empty initial state</summary>
            <pre>
              <code>{lesson.init}</code>
            </pre>
          </details>
          <div className="adt-code-grid">
            <div className={last?.action === 'insert' ? 'is-active' : ''}>
              <h3>{lesson.insert}</h3>
              <pre>
                <code>{lesson.insertCode}</code>
              </pre>
            </div>
            <div className={last?.action === 'remove' ? 'is-active' : ''}>
              <h3>{lesson.remove}</h3>
              <pre>
                <code>{lesson.removeCode}</code>
              </pre>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
