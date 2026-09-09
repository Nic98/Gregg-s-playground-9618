import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Circle,
  Code2,
  Download,
  Layers3,
  ListOrdered,
  Maximize2,
  Minus,
  MousePointer2,
  MoveRight,
  Plus,
  RectangleHorizontal,
  RotateCcw,
  Scan,
  Shapes,
  SlidersHorizontal,
  Trash2,
  Undo2,
  VectorSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { vectorDemoPath } from '../data/syllabus';
import {
  bounds,
  cloneDrawing,
  examples,
  exportSVG,
  initialDrawing,
  MAX_OBJECTS,
  moved,
  newShape,
  numericFields,
  parseSource,
  propertyLabels,
  shapeNames,
  toSource,
  type DrawingObject,
  type ShapeType,
} from '../model';

type Tool = 'select' | ShapeType;
type Concept = 'object' | 'list' | 'property';
const icons = {
  rect: RectangleHorizontal,
  circle: Circle,
  ellipse: Scan,
  line: Minus,
};
const concepts = [
  {
    id: 'object' as const,
    icon: Shapes,
    name: 'Drawing object',
    subtitle: '图形对象',
    description: 'One shape described mathematically.',
    prompt: '点击圆形：它是一个独立对象，可以单独选择、移动和修改。',
  },
  {
    id: 'property' as const,
    icon: SlidersHorizontal,
    name: 'Property',
    subtitle: '属性',
    description: 'A value that describes an object.',
    prompt: '试着修改右侧的 radius 或 fill：对象的大小或颜色随属性改变。',
  },
  {
    id: 'list' as const,
    icon: ListOrdered,
    name: 'Drawing list',
    subtitle: '绘图列表',
    description: 'Objects and their properties, in order.',
    prompt:
      '用 Draw next 逐个重绘；将圆形向后移，观察重叠处。后绘制的对象可能盖住先绘制的对象。',
  },
];
const starterSnippets: Record<ShapeType, string> = {
  rect: '<rect id="box"\n  x="100" y="80"\n  width="220" height="140"\n  fill="#b8a1ef"\n  stroke="#29233c" stroke-width="3" />',
  circle:
    '<circle id="dot"\n  cx="300" cy="210" r="70"\n  fill="#ffb651"\n  stroke="#29233c" stroke-width="3" />',
  ellipse:
    '<ellipse id="oval"\n  cx="300" cy="210" rx="130" ry="60"\n  fill="none"\n  stroke="#4568d5" stroke-width="4" />',
  line: '<line id="edge"\n  x1="120" y1="100" x2="420" y2="280"\n  stroke="#29233c" stroke-width="5" />',
};

function Shape({ object }: { object: DrawingObject }) {
  const {
    fill,
    stroke,
    'stroke-width': strokeWidth,
    ...geometry
  } = object.props;
  const common = {
    ...geometry,
    fill: String(fill ?? 'none'),
    stroke: String(stroke),
    strokeWidth,
  };
  if (object.type === 'circle') return <circle {...common} />;
  if (object.type === 'ellipse') return <ellipse {...common} />;
  if (object.type === 'line') return <line {...common} />;
  return <rect {...common} />;
}

export default function VectorStudioPage() {
  const [objects, setObjects] = useState(() => cloneDrawing(initialDrawing));
  const [selected, setSelected] = useState<string | null>('sun');
  const [draft, setDraft] = useState(() => toSource(initialDrawing));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(
    'Select a shape to connect the object, its properties and the drawing list.',
  );
  const [concept, setConcept] = useState<Concept>('object');
  const [tool, setTool] = useState<Tool>('select');
  const [zoom, setZoom] = useState(1);
  const [grid, setGrid] = useState(true);
  const [visibleCount, setVisibleCount] = useState(initialDrawing.length);
  const [example, setExample] = useState('overlap');
  const [snippet, setSnippet] = useState<ShapeType>('circle');
  const [history, setHistory] = useState<DrawingObject[][]>([]);
  const [full, setFull] = useState(false);
  const stage = useRef<SVGSVGElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const serial = useRef(1);
  const drag = useRef<{
    before: DrawingObject[];
    start: { x: number; y: number };
    object: DrawingObject;
    create: boolean;
    pointer: number;
  } | null>(null);
  const current = objects.find((o) => o.id === selected);
  const index = objects.findIndex((o) => o.id === selected);
  const dirty = draft !== toSource(objects);
  const selectedBounds =
    current && index < visibleCount ? bounds(current) : null;

  useEffect(() => {
    document.title = 'Vector Drawing Studio · Gregg’s AS Playground';
    const changed = () => setFull(document.fullscreenElement === shell.current);
    document.addEventListener('fullscreenchange', changed);
    return () => document.removeEventListener('fullscreenchange', changed);
  }, []);

  function sync(next: DrawingObject[]) {
    setObjects(next);
    setDraft(toSource(next));
    setError('');
  }
  function commit(next: DrawingObject[], message?: string) {
    if (toSource(next) !== toSource(objects))
      setHistory((h) => [...h.slice(-29), cloneDrawing(objects)]);
    sync(next);
    setVisibleCount(next.length);
    if (message) setNotice(message);
  }
  function select(id: string) {
    setSelected(id);
    const found = objects.find((o) => o.id === id);
    if (found)
      setNotice(
        `${id}: ${shapeNames[found.type]}. The canvas, list and properties refer to the same object.`,
      );
  }
  function changeProperty(name: string, value: string | number) {
    if (!current || dirty) return;
    commit(
      objects.map((o) =>
        o.id === selected ? { ...o, props: { ...o.props, [name]: value } } : o,
      ),
      `${current.id}: ${name} = ${value}.`,
    );
  }
  function reorder(direction: number) {
    if (
      !current ||
      index + direction < 0 ||
      index + direction >= objects.length
    )
      return;
    const next = [...objects];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    commit(
      next,
      `${current.id} is now drawn ${direction > 0 ? 'later, in front of earlier objects' : 'earlier, behind later objects'}.`,
    );
  }
  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    sync(cloneDrawing(previous));
    setVisibleCount(previous.length);
    setHistory((h) => h.slice(0, -1));
    setSelected(
      previous.some((o) => o.id === selected)
        ? selected
        : (previous.at(-1)?.id ?? null),
    );
    setNotice('Previous drawing restored.');
  }
  function nextId(type: ShapeType) {
    let id: string;
    do {
      id = `${type}-${serial.current++}`;
    } while (objects.some((o) => o.id === id));
    return id;
  }
  function addShape(type: ShapeType) {
    if (objects.length >= MAX_OBJECTS) return;
    const o = newShape(
      type,
      nextId(type),
      { x: 240, y: 150 },
      { x: 350, y: 250 },
    );
    commit(
      [...objects, o],
      `${shapeNames[type]} added to the end of the drawing list.`,
    );
    setSelected(o.id);
    setTool('select');
  }
  function point(e: ReactPointerEvent<SVGSVGElement>) {
    const matrix = stage.current?.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(
      matrix.inverse(),
    );
    return {
      x: Math.round(Math.max(0, Math.min(600, p.x))),
      y: Math.round(Math.max(0, Math.min(420, p.y))),
    };
  }
  function pointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    if (dirty || e.button !== 0 || drag.current) return;
    const start = point(e);
    const id = (e.target as Element)
      .closest('[data-object]')
      ?.getAttribute('data-object');
    const found = objects.find((o) => o.id === id);
    if (tool === 'select' && !found) {
      setSelected(null);
      return;
    }
    if (tool !== 'select' && objects.length >= MAX_OBJECTS) {
      setNotice(
        'The classroom limit is 40 objects. Delete one before adding another.',
      );
      return;
    }
    const object =
      tool === 'select' ? found! : newShape(tool, nextId(tool), start, start);
    drag.current = {
      before: cloneDrawing(objects),
      start,
      object,
      create: tool !== 'select',
      pointer: e.pointerId,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    setSelected(object.id);
    if (tool !== 'select') {
      sync([...objects, object]);
      setVisibleCount(objects.length + 1);
    }
    e.preventDefault();
  }
  function pointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    const p = point(e);
    const object = d.create
      ? newShape(d.object.type, d.object.id, d.start, p)
      : moved(d.object, p.x - d.start.x, p.y - d.start.y);
    sync(
      d.create
        ? [...d.before, object]
        : d.before.map((o) => (o.id === object.id ? object : o)),
    );
  }
  function pointerEnd(e: ReactPointerEvent<SVGSVGElement>, cancel = false) {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    if (cancel) {
      sync(d.before);
      setVisibleCount(d.before.length);
      setSelected(
        d.before.some((o) => o.id === d.object.id) ? d.object.id : null,
      );
    } else {
      if (toSource(d.before) !== toSource(objects))
        setHistory((h) => [...h.slice(-29), d.before]);
      setNotice(
        `${d.object.id} ${d.create ? 'added' : 'moved'}. Its numeric properties describe the updated shape.`,
      );
    }
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    setTool('select');
  }
  function applySource() {
    try {
      const result = parseSource(draft);
      commit(result, `Drawing list applied: ${result.length} objects.`);
      setSelected(
        result.some((o) => o.id === selected)
          ? selected
          : (result.at(-1)?.id ?? null),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Please check the drawing syntax.',
      );
    }
  }
  function loadExample(value: string) {
    setExample(value);
    const next =
      value === 'blank'
        ? []
        : cloneDrawing(examples.find((e) => e.id === value)!.objects);
    commit(
      next,
      value === 'blank'
        ? 'Blank drawing. Choose a tool and drag, or add an object with the + buttons.'
        : 'Example loaded. Select an object to inspect its properties.',
    );
    setSelected(next[1]?.id ?? next[0]?.id ?? null);
    setZoom(1);
    setTool('select');
  }
  async function toggleFull() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await shell.current?.requestFullscreen();
    } catch {
      setNotice(
        'Fullscreen is unavailable here. All drawing tools remain available.',
      );
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([exportSVG(objects)], { type: 'image/svg+xml' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-vector-drawing.svg';
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(
      'SVG saved. The file contains drawing objects and their properties.',
    );
  }

  return (
    <div className="app-shell" ref={shell}>
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Gregg’s AS Playground">
          <span className="brand-icon">
            <VectorSquare size={25} />
          </span>
          <span>
            <strong>Gregg’s</strong>
            <small>AS CS PLAYGROUND</small>
          </span>
        </Link>
        <div className="course-path">
          <span>9618</span>
          <span className="path-divider">/</span>
          <Link to="/chapters/1#section-1-2">1.2 Multimedia</Link>
          <span className="path-divider">/</span>
          <strong>Vector graphics</strong>
        </div>
        <Button variant="outline" onClick={toggleFull}>
          <Maximize2 size={16} />
          <span>{full ? 'Exit fullscreen' : 'Fullscreen'}</span>
        </Button>
      </header>

      <main id="top">
        <Link className="lab-return" to="/chapters/1#section-1-2">
          ← Chapter 1 · Information representation
        </Link>
        <div className="studio-heading">
          <div>
            <p className="eyebrow">
              <span className="live-dot" /> THE REPRESENTATION LAB
            </p>
            <h1>
              Vector Drawing Studio<span>.</span>
            </h1>
            <p className="intro">
              A picture made of instructions. Select a shape. Change a value.
              See what moves.
            </p>
          </div>
          <a
            className="code-jump"
            href={`#${vectorDemoPath}#code-lab`}
            onClick={(event) => {
              event.preventDefault();
              document
                .getElementById('code-lab')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Code2 size={20} /> Try the syntax <ArrowDown size={16} />
          </a>
        </div>

        <section
          className="concept-strip"
          aria-label="Three vector graphic concepts"
        >
          {concepts.map((item, i) => (
            <button
              className={`concept-card ${concept === item.id ? 'active' : ''}`}
              key={item.id}
              aria-pressed={concept === item.id}
              onClick={() => setConcept(item.id)}
            >
              <span className="concept-index">0{i + 1}</span>
              <div>
                <div className="concept-title">
                  <item.icon size={18} />
                  <strong>{item.name}</strong>
                  <span lang="zh">{item.subtitle}</span>
                </div>
                <p>{item.description}</p>
              </div>
            </button>
          ))}
        </section>
        <div className="concept-prompt">
          <span>TRY THIS</span>
          <p lang="zh">{concepts.find((c) => c.id === concept)!.prompt}</p>
        </div>

        <section
          className="workbench"
          aria-label="Interactive vector drawing workspace"
        >
          <div className="workbench-toolbar">
            <fieldset className="tools" aria-label="Drawing tools">
              <Button
                variant={tool === 'select' ? 'default' : 'ghost'}
                disabled={dirty}
                onClick={() => setTool('select')}
                aria-pressed={tool === 'select'}
              >
                <MousePointer2 />
                Select
              </Button>
              {(Object.keys(icons) as ShapeType[]).map((t) => {
                const Icon = icons[t];
                return (
                  <Button
                    key={t}
                    variant={tool === t ? 'default' : 'ghost'}
                    disabled={dirty || objects.length >= MAX_OBJECTS}
                    onClick={() => {
                      setTool(t);
                      setVisibleCount(objects.length);
                    }}
                    aria-pressed={tool === t}
                  >
                    <Icon />
                    {shapeNames[t]}
                  </Button>
                );
              })}
            </fieldset>
            <label className="example-picker">
              <span className="sr-only">Load example</span>
              <select
                value={example}
                disabled={dirty}
                onChange={(e) => loadExample(e.target.value)}
              >
                {examples.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
                <option value="blank">04 · Blank canvas</option>
              </select>
            </label>
          </div>

          <div className="editor-grid">
            <aside
              className={`list-panel ${concept === 'list' ? 'spotlight' : ''}`}
              aria-labelledby="list-title"
            >
              <div className="panel-heading">
                <h2 id="list-title">
                  <ListOrdered size={18} />
                  Drawing list
                </h2>
                <span className="count-tag">{objects.length}</span>
              </div>
              <p className="panel-caption">First drawn → last drawn</p>
              <ol className="object-list">
                {objects.map((o, i) => {
                  const Icon = icons[o.type];
                  return (
                    <li key={o.id}>
                      <button
                        className={`object-row ${selected === o.id ? 'selected' : ''} ${i >= visibleCount ? 'not-drawn' : ''}`}
                        aria-pressed={selected === o.id}
                        onClick={() => select(o.id)}
                      >
                        <span className="object-number">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span
                          className="shape-swatch"
                          style={{
                            color: String(
                              o.props.fill === 'none' || !o.props.fill
                                ? o.props.stroke
                                : o.props.fill,
                            ),
                          }}
                        >
                          <Icon size={22} />
                        </span>
                        <span className="object-name">
                          <strong>{o.id}</strong>
                          <small>
                            {shapeNames[o.type]}
                            {i >= visibleCount ? ' · waiting' : ''}
                          </small>
                        </span>
                        {selected === o.id && <span className="selected-dot" />}
                      </button>
                    </li>
                  );
                })}
              </ol>
              {!objects.length && (
                <p className="empty-list">
                  Your next shape will become object 01.
                </p>
              )}
              <div className="order-controls">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={dirty || index <= 0}
                  onClick={() => reorder(-1)}
                >
                  <ArrowUp />
                  Earlier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={dirty || index < 0 || index >= objects.length - 1}
                  onClick={() => reorder(1)}
                >
                  <ArrowDown />
                  Later
                </Button>
              </div>
              <p className="list-explainer">
                Later objects are drawn over earlier ones. Empty fill areas stay
                transparent.
              </p>
              <div className="trace-controls">
                <p className="eyebrow">REBUILD THE IMAGE</p>
                <div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={dirty || !objects.length}
                    onClick={() => {
                      setVisibleCount(0);
                      setNotice(
                        'Canvas cleared for replay. The drawing list is unchanged.',
                      );
                    }}
                  >
                    <RotateCcw />
                    Rewind
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    disabled={dirty || visibleCount >= objects.length}
                    onClick={() => {
                      setVisibleCount((c) => c + 1);
                      setSelected(objects[visibleCount].id);
                      setNotice(
                        `Draw object ${visibleCount + 1}: ${objects[visibleCount].id}.`,
                      );
                    }}
                  >
                    Draw next
                    <MoveRight />
                  </Button>
                </div>
                <span>
                  {visibleCount} of {objects.length} objects drawn
                </span>
              </div>
            </aside>

            <div
              className={`canvas-panel ${concept === 'object' ? 'spotlight' : ''}`}
            >
              <div className="canvas-topline">
                <span>
                  <span className="live-dot" />
                  {tool === 'select'
                    ? 'LIVE CANVAS'
                    : `DRAW A ${shapeNames[tool].toUpperCase()}`}
                </span>
                <span>600 × 420 units</span>
              </div>
              <div className="svg-frame">
                {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- This SVG is a labelled keyboard-editable drawing application with equivalent native selection buttons. */}
                <svg
                  ref={stage}
                  className={`drawing-canvas tool-${tool}`}
                  viewBox={`${300 - 300 / zoom} ${210 - 210 / zoom} ${600 / zoom} ${420 / zoom}`}
                  role="application"
                  aria-label="Vector drawing canvas. Choose a shape in the drawing list, edit properties, or use arrow keys here to move the selected shape."
                  // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- This application surface supports arrow-key object movement.
                  tabIndex={0}
                  onPointerDown={pointerDown}
                  onPointerMove={pointerMove}
                  onPointerUp={(e) => pointerEnd(e)}
                  onPointerCancel={(e) => pointerEnd(e, true)}
                  onKeyDown={(e) => {
                    if (
                      dirty ||
                      !current ||
                      ![
                        'ArrowLeft',
                        'ArrowRight',
                        'ArrowUp',
                        'ArrowDown',
                      ].includes(e.key)
                    )
                      return;
                    e.preventDefault();
                    const step = e.shiftKey ? 10 : 1;
                    commit(
                      objects.map((o) =>
                        o.id === selected
                          ? moved(
                              o,
                              e.key === 'ArrowLeft'
                                ? -step
                                : e.key === 'ArrowRight'
                                  ? step
                                  : 0,
                              e.key === 'ArrowUp'
                                ? -step
                                : e.key === 'ArrowDown'
                                  ? step
                                  : 0,
                            )
                          : o,
                      ),
                      `${current.id} moved ${step} coordinate units.`,
                    );
                  }}
                >
                  <title>
                    Vector drawing made from {objects.length} separate objects
                  </title>
                  <defs>
                    <pattern
                      id="coordinate-grid"
                      width="20"
                      height="20"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="0" cy="0" r="0.8" fill="#c5c9d2" />
                    </pattern>
                  </defs>
                  <rect
                    x="0"
                    y="0"
                    width="600"
                    height="420"
                    fill={grid ? 'url(#coordinate-grid)' : '#fff'}
                  />
                  {objects.slice(0, visibleCount).map((o) => (
                    <g
                      key={o.id}
                      data-object={o.id}
                      className="drawn-object"
                      style={{
                        pointerEvents: tool === 'select' ? 'all' : 'none',
                      }}
                    >
                      <Shape object={o} />
                    </g>
                  ))}
                  {selectedBounds && (
                    <g className="selection" pointerEvents="none">
                      <rect
                        x={selectedBounds.x - 6 / zoom}
                        y={selectedBounds.y - 6 / zoom}
                        width={selectedBounds.width + 12 / zoom}
                        height={selectedBounds.height + 12 / zoom}
                        fill="none"
                        stroke="#4a58cc"
                        strokeWidth={1.4 / zoom}
                        strokeDasharray={`${4 / zoom} ${3 / zoom}`}
                      />
                      {[0, 1].flatMap((x) =>
                        [0, 1].map((y) => (
                          <rect
                            key={`${x}-${y}`}
                            x={
                              selectedBounds.x +
                              x * selectedBounds.width -
                              3 / zoom
                            }
                            y={
                              selectedBounds.y +
                              y * selectedBounds.height -
                              3 / zoom
                            }
                            width={6 / zoom}
                            height={6 / zoom}
                            fill="white"
                            stroke="#4a58cc"
                            strokeWidth={1.4 / zoom}
                          />
                        )),
                      )}
                    </g>
                  )}
                </svg>
                {objects.length === 0 && (
                  <div className="empty-canvas">
                    <VectorSquare size={40} />
                    <strong>Your drawing starts here.</strong>
                    <span>Choose a tool and drag on the canvas.</span>
                  </div>
                )}
              </div>
              <div className="canvas-bottom">
                <label>
                  <input
                    type="checkbox"
                    checked={grid}
                    onChange={(e) => setGrid(e.target.checked)}
                  />
                  Coordinate grid
                </label>
                <div className="zoom-controls">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Zoom out"
                    disabled={zoom === 1}
                    onClick={() => setZoom((z) => z / 2)}
                  >
                    <Minus />
                  </Button>
                  <output>{zoom * 100}%</output>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Zoom in"
                    disabled={zoom === 4}
                    onClick={() => setZoom((z) => z * 2)}
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
              <p className="canvas-hint">
                {zoom > 1
                  ? 'Magnified centre view. The same geometry is redrawn at this scale.'
                  : tool === 'circle'
                    ? 'Drag from the centre to the edge to set the radius.'
                    : tool !== 'select'
                      ? 'Drag on the canvas to create a shape.'
                      : 'Drag to move · Arrow keys: 1 unit · Shift + arrows: 10 units'}
              </p>
            </div>

            <aside
              className={`properties-panel ${concept === 'property' ? 'spotlight' : ''}`}
              aria-labelledby="properties-title"
            >
              <div className="panel-heading">
                <h2 id="properties-title">
                  <SlidersHorizontal size={18} />
                  Properties
                </h2>
              </div>
              {current ? (
                <>
                  <div className="selection-name">
                    <span className="eyebrow">SELECTED OBJECT</span>
                    <strong>
                      {current.id}
                      <span>&lt;{current.type}&gt;</span>
                    </strong>
                  </div>
                  <fieldset disabled={dirty}>
                    <legend className="sr-only">
                      Properties of {current.id}
                    </legend>
                    <div className="property-grid">
                      {[...numericFields[current.type], 'stroke-width'].map(
                        (key) => (
                          <label key={`${current.id}-${key}`}>
                            <span>{propertyLabels[key]}</span>
                            <input
                              type="number"
                              value={current.props[key]}
                              min={
                                [
                                  'width',
                                  'height',
                                  'r',
                                  'rx',
                                  'ry',
                                  'stroke-width',
                                ].includes(key)
                                  ? 0
                                  : -2000
                              }
                              max={key === 'stroke-width' ? 40 : 2000}
                              step="1"
                              onChange={(e) => {
                                if (
                                  e.target.value !== '' &&
                                  e.target.validity.valid
                                )
                                  changeProperty(key, Number(e.target.value));
                              }}
                            />
                          </label>
                        ),
                      )}
                    </div>
                    {(current.type === 'line'
                      ? ['stroke']
                      : ['fill', 'stroke']
                    ).map((key) => (
                      <div className="colour-property" key={key}>
                        <span>
                          {key === 'fill' ? 'Fill colour' : 'Stroke colour'}
                        </span>
                        <div>
                          <input
                            type="color"
                            aria-label={
                              key === 'fill' ? 'Fill colour' : 'Stroke colour'
                            }
                            value={
                              current.props[key] === 'none'
                                ? '#ffffff'
                                : expandHex(String(current.props[key]))
                            }
                            disabled={current.props[key] === 'none'}
                            onChange={(e) =>
                              changeProperty(key, e.target.value)
                            }
                          />
                          <code>{current.props[key]}</code>
                          <label className="none-check">
                            <input
                              type="checkbox"
                              checked={current.props[key] === 'none'}
                              onChange={(e) =>
                                changeProperty(
                                  key,
                                  e.target.checked
                                    ? 'none'
                                    : key === 'fill'
                                      ? '#b8a1ef'
                                      : '#29233c',
                                )
                              }
                            />
                            None
                          </label>
                        </div>
                      </div>
                    ))}
                  </fieldset>
                  <p className="property-note">
                    {current.type === 'rect'
                      ? 'x and y locate the top-left corner.'
                      : current.type === 'line'
                        ? 'Two endpoints describe the line.'
                        : 'cx and cy locate the centre.'}{' '}
                    Coordinates start at the top-left. x increases right; y
                    increases down.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={dirty}
                    onClick={() => {
                      commit(
                        objects.filter((o) => o.id !== selected),
                        'Object removed from the drawing list.',
                      );
                      setSelected(null);
                    }}
                  >
                    <Trash2 />
                    Delete object
                  </Button>
                </>
              ) : (
                <div className="empty-properties">
                  <MousePointer2 size={26} />
                  <p>Select an object on the canvas or in the drawing list.</p>
                </div>
              )}
            </aside>
          </div>
          <div className="workbench-footer">
            <div className="status-message" aria-live="polite">
              {dirty ? (
                <>
                  <Code2 size={16} />
                  Unapplied SVG edits. Apply or discard them below to continue
                  drawing.
                </>
              ) : (
                <>
                  <Check size={16} />
                  {notice}
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={dirty || !history.length}
              onClick={undo}
            >
              <Undo2 />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={dirty}
              onClick={download}
            >
              <Download />
              Save SVG
            </Button>
          </div>
        </section>

        <section
          id="code-lab"
          className="code-lab"
          aria-labelledby="code-title"
        >
          <div className="code-intro">
            <p className="eyebrow">MAKE YOUR OWN</p>
            <h2 id="code-title">The drawing is the list.</h2>
            <p>
              Use the tools above, or write the objects below. Apply your list
              to redraw the image.
            </p>
            <p className="syllabus-note" lang="zh">
              SVG
              是这里使用的真实矢量图格式。考试重点是对象、属性与绘图列表；这套语法用于帮助理解，并非大纲指定的必背语法。
            </p>
          </div>
          <div className="code-workspace">
            <div className="source-panel">
              <div className="source-heading">
                <span>
                  <Code2 size={18} />
                  Your drawing list <small>SVG elements</small>
                </span>
                <span className={`source-state ${dirty ? 'pending' : ''}`}>
                  {dirty ? 'Edited · not applied' : 'In sync with canvas'}
                </span>
              </div>
              <label className="sr-only" htmlFor="svg-source">
                Editable SVG drawing list
              </label>
              <textarea
                id="svg-source"
                spellCheck={false}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setError('');
                }}
                aria-describedby="source-help"
                aria-invalid={!!error}
              />
              <div className="source-actions">
                <p id="source-help">
                  One element = one drawing object.
                  <br />
                  Attributes store its properties.
                </p>
                <Button
                  variant="ghost"
                  disabled={!dirty && !error}
                  onClick={() => {
                    setDraft(toSource(objects));
                    setError('');
                  }}
                >
                  Discard edits
                </Button>
                <Button variant="accent" onClick={applySource}>
                  Apply drawing
                  <MoveRight />
                </Button>
              </div>
              {error && (
                <p className="source-error" role="alert">
                  {error} The current drawing has been kept.
                </p>
              )}
            </div>
            <aside className="syntax-panel">
              <h3>Four shapes. A useful vocabulary.</h3>
              <fieldset className="syntax-tabs" aria-label="Syntax examples">
                {(Object.keys(icons) as ShapeType[]).map((t) => (
                  <button
                    key={t}
                    aria-pressed={snippet === t}
                    onClick={() => setSnippet(t)}
                  >
                    {t}
                  </button>
                ))}
              </fieldset>
              <pre>
                <code>{starterSnippets[snippet]}</code>
              </pre>
              <p>
                {snippet === 'circle'
                  ? 'cx, cy = centre · r = radius'
                  : snippet === 'rect'
                    ? 'x, y = top-left · width, height = size'
                    : snippet === 'ellipse'
                      ? 'cx, cy = centre · rx, ry = radii'
                      : 'x1, y1 = start · x2, y2 = end'}
              </p>
              <p>
                <code>fill</code> colours the inside; <code>stroke</code>{' '}
                colours the outline; <code>stroke-width</code> sets its
                thickness. Use <code>none</code> for transparency.
              </p>
              <Button
                variant="outline"
                disabled={dirty || objects.length >= MAX_OBJECTS}
                onClick={() => addShape(snippet)}
              >
                <Plus />
                Add a {shapeNames[snippet].toLowerCase()}
              </Button>
              <p className="syntax-footnote">
                The editor accepts these four SVG elements, hex colours and
                numeric properties. A full SVG document also has an enclosing
                &lt;svg&gt; element.
              </p>
            </aside>
          </div>
        </section>
        <section className="lesson-close">
          <div>
            <Layers3 size={25} />
            <h2>
              Change the description.
              <br />
              Change the drawing.
            </h2>
          </div>
          <p lang="zh">
            矢量图保存的是对象及其属性，而不是逐个像素的颜色。显示时，软件根据这些描述绘制图像；放大时可以重新计算轮廓，保持清晰。复杂矢量图不一定比位图文件更小。
          </p>
          <div className="small-challenge">
            <span>ONE MORE EXPERIMENT</span>
            <p>
              {examples.find((e) => e.id === example)?.question ??
                'Build a picture with three different objects. Explain the properties used to describe each one.'}
            </p>
          </div>
        </section>
        <footer className="site-footer">
          <span>Gregg’s AS CS Playground</span>
          <span>Cambridge AS Computer Science 9618 · 1.2 Multimedia</span>
        </footer>
      </main>
    </div>
  );
}

function expandHex(hex: string) {
  return hex.length === 4
    ? `#${hex
        .slice(1)
        .split('')
        .map((c) => c + c)
        .join('')}`
    : hex;
}
