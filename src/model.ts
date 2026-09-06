export type ShapeType = 'rect' | 'circle' | 'ellipse' | 'line';
export type Properties = Record<string, string | number>;
export interface DrawingObject {
  id: string;
  type: ShapeType;
  props: Properties;
}
export const MAX_OBJECTS = 40;
export const numericFields: Record<ShapeType, string[]> = {
  rect: ['x', 'y', 'width', 'height'],
  circle: ['cx', 'cy', 'r'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  line: ['x1', 'y1', 'x2', 'y2'],
};
export const propertyLabels: Record<string, string> = {
  x: 'Left · x',
  y: 'Top · y',
  width: 'Width',
  height: 'Height',
  cx: 'Centre x',
  cy: 'Centre y',
  r: 'Radius',
  rx: 'Radius x',
  ry: 'Radius y',
  x1: 'Start x',
  y1: 'Start y',
  x2: 'End x',
  y2: 'End y',
  'stroke-width': 'Stroke width',
};
export const shapeNames: Record<ShapeType, string> = {
  rect: 'Rectangle',
  circle: 'Circle',
  ellipse: 'Ellipse',
  line: 'Line',
};
export const initialDrawing: DrawingObject[] = [
  {
    id: 'card',
    type: 'rect',
    props: {
      x: 140,
      y: 110,
      width: 280,
      height: 190,
      fill: '#b8a1ef',
      stroke: '#29233c',
      'stroke-width': 3,
    },
  },
  {
    id: 'sun',
    type: 'circle',
    props: {
      cx: 395,
      cy: 175,
      r: 78,
      fill: '#ffb651',
      stroke: '#29233c',
      'stroke-width': 3,
    },
  },
  {
    id: 'orbit',
    type: 'ellipse',
    props: {
      cx: 280,
      cy: 298,
      rx: 165,
      ry: 34,
      fill: 'none',
      stroke: '#4568d5',
      'stroke-width': 7,
    },
  },
  {
    id: 'line',
    type: 'line',
    props: {
      x1: 195,
      y1: 240,
      x2: 382,
      y2: 130,
      stroke: '#29233c',
      'stroke-width': 5,
    },
  },
];
export const examples = [
  {
    id: 'overlap',
    name: '01 · Shape study',
    question:
      'Which object is drawn last? Move the circle later in the list and watch the overlap.',
    objects: initialDrawing,
  },
  {
    id: 'robot',
    name: '02 · A robot portrait',
    question:
      'Every detail is an object. Change an eye’s radius without changing the face.',
    objects: [
      {
        id: 'antenna',
        type: 'line',
        props: {
          x1: 300,
          y1: 90,
          x2: 300,
          y2: 40,
          stroke: '#29233c',
          'stroke-width': 6,
        },
      },
      {
        id: 'signal',
        type: 'circle',
        props: {
          cx: 300,
          cy: 40,
          r: 13,
          fill: '#ffb651',
          stroke: '#29233c',
          'stroke-width': 3,
        },
      },
      {
        id: 'face',
        type: 'rect',
        props: {
          x: 175,
          y: 90,
          width: 250,
          height: 215,
          fill: '#b8a1ef',
          stroke: '#29233c',
          'stroke-width': 4,
        },
      },
      {
        id: 'eye-left',
        type: 'circle',
        props: {
          cx: 245,
          cy: 168,
          r: 25,
          fill: '#ffffff',
          stroke: '#29233c',
          'stroke-width': 4,
        },
      },
      {
        id: 'eye-right',
        type: 'circle',
        props: {
          cx: 355,
          cy: 168,
          r: 25,
          fill: '#ffffff',
          stroke: '#29233c',
          'stroke-width': 4,
        },
      },
      {
        id: 'mouth',
        type: 'line',
        props: {
          x1: 245,
          y1: 250,
          x2: 355,
          y2: 250,
          stroke: '#29233c',
          'stroke-width': 8,
        },
      },
    ] as DrawingObject[],
  },
  {
    id: 'target',
    name: '03 · Concentric circles',
    question:
      'The circles share a centre. What happens when you reverse their drawing order?',
    objects: [
      {
        id: 'outer',
        type: 'circle',
        props: {
          cx: 300,
          cy: 210,
          r: 150,
          fill: '#4568d5',
          stroke: '#29233c',
          'stroke-width': 3,
        },
      },
      {
        id: 'middle',
        type: 'circle',
        props: {
          cx: 300,
          cy: 210,
          r: 100,
          fill: '#ffffff',
          stroke: '#29233c',
          'stroke-width': 3,
        },
      },
      {
        id: 'inner',
        type: 'circle',
        props: {
          cx: 300,
          cy: 210,
          r: 50,
          fill: '#ffb651',
          stroke: '#29233c',
          'stroke-width': 3,
        },
      },
    ] as DrawingObject[],
  },
];
export function cloneDrawing(objects: DrawingObject[]) {
  return objects.map((o) => ({ ...o, props: { ...o.props } }));
}
export function toSource(objects: DrawingObject[]): string {
  return objects
    .map(
      (o) =>
        `<${o.type} id="${o.id}"\n  ${Object.entries(o.props)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ')} />`,
    )
    .join('\n\n');
}
export function parseSource(source: string): DrawingObject[] {
  if (source.length > 30000)
    throw new Error('Keep your drawing under 30,000 characters.');
  if (/<!|<\?/.test(source))
    throw new Error('Use shape elements only: rect, circle, ellipse and line.');
  const doc = new DOMParser().parseFromString(
    `<svg>${source}</svg>`,
    'application/xml',
  );
  if (doc.querySelector('parsererror'))
    throw new Error(
      'Check your brackets and quotation marks. Each object ends with />.',
    );
  const nodes = [...doc.documentElement.children];
  if (nodes.length > MAX_OBJECTS)
    throw new Error(
      `This classroom drawing supports up to ${MAX_OBJECTS} objects.`,
    );
  if (
    [...doc.documentElement.childNodes].some(
      (n) => n.nodeType === 3 && n.textContent?.trim(),
    )
  )
    throw new Error(
      'Put only SVG shapes in the drawing list; remove text outside the elements.',
    );
  const ids = new Set<string>();
  return nodes.map((node, i) => {
    const type = node.tagName as ShapeType;
    if (!Object.hasOwn(numericFields, type))
      throw new Error(
        `Object ${i + 1}: <${type}> is not supported. Try rect, circle, ellipse or line.`,
      );
    if (node.childNodes.length)
      throw new Error(
        `Object ${i + 1}: use a self-closing shape with no nested content.`,
      );
    const allowed = [
      ...numericFields[type],
      'id',
      'stroke',
      'stroke-width',
      ...(type !== 'line' ? ['fill'] : []),
    ];
    for (const a of node.attributes)
      if (!allowed.includes(a.name))
        throw new Error(
          `Object ${i + 1}: “${a.name}” is not supported for ${type}.`,
        );
    const id = node.getAttribute('id') ?? `${type}-${i + 1}`;
    if (!/^[A-Za-z][\w-]{0,29}$/.test(id) || ids.has(id))
      throw new Error(
        `Object ${i + 1}: use a unique id, starting with a letter (up to 30 letters, digits, _ or -).`,
      );
    ids.add(id);
    const props: Properties = {};
    for (const field of [...numericFields[type], 'stroke-width']) {
      const raw =
        node.getAttribute(field) ?? (field === 'stroke-width' ? '2' : null);
      const v = raw === null || !raw.trim() ? NaN : Number(raw);
      const min = ['width', 'height', 'r', 'rx', 'ry', 'stroke-width'].includes(
        field,
      )
        ? 0
        : -2000;
      const max = field === 'stroke-width' ? 40 : 2000;
      if (!Number.isFinite(v) || v < min || v > max)
        throw new Error(
          `Object ${i + 1}: ${field} must be a number from ${min} to ${max}.`,
        );
      props[field] = v;
    }
    for (const field of type === 'line' ? ['stroke'] : ['fill', 'stroke']) {
      const raw =
        node.getAttribute(field) ?? (field === 'fill' ? '#b8a1ef' : '#29233c');
      if (!/^(#[0-9a-f]{6}|#[0-9a-f]{3}|none)$/i.test(raw))
        throw new Error(
          `Object ${i + 1}: ${field} must be a hex colour such as #ffb651, or none.`,
        );
      props[field] = raw;
    }
    return { id, type, props };
  });
}
export function bounds(o: DrawingObject) {
  const p = o.props as Record<string, number>;
  if (o.type === 'rect')
    return { x: p.x, y: p.y, width: p.width, height: p.height };
  if (o.type === 'circle')
    return { x: p.cx - p.r, y: p.cy - p.r, width: 2 * p.r, height: 2 * p.r };
  if (o.type === 'ellipse')
    return {
      x: p.cx - p.rx,
      y: p.cy - p.ry,
      width: 2 * p.rx,
      height: 2 * p.ry,
    };
  return {
    x: Math.min(p.x1, p.x2),
    y: Math.min(p.y1, p.y2),
    width: Math.abs(p.x2 - p.x1),
    height: Math.abs(p.y2 - p.y1),
  };
}
export function moved(o: DrawingObject, dx: number, dy: number): DrawingObject {
  const props = { ...o.props };
  for (const key of o.type === 'rect'
    ? ['x']
    : o.type === 'line'
      ? ['x1', 'x2']
      : ['cx'])
    props[key] = Math.round(
      Math.max(-2000, Math.min(2000, Number(props[key]) + dx)),
    );
  for (const key of o.type === 'rect'
    ? ['y']
    : o.type === 'line'
      ? ['y1', 'y2']
      : ['cy'])
    props[key] = Math.round(
      Math.max(-2000, Math.min(2000, Number(props[key]) + dy)),
    );
  return { ...o, props };
}
export function newShape(
  type: ShapeType,
  id: string,
  start: { x: number; y: number },
  end: { x: number; y: number },
): DrawingObject {
  const x = Math.min(start.x, end.x),
    y = Math.min(start.y, end.y);
  const width = Math.max(2, Math.abs(end.x - start.x)),
    height = Math.max(2, Math.abs(end.y - start.y));
  const geometry: Properties =
    type === 'rect'
      ? { x, y, width, height }
      : type === 'circle'
        ? {
            cx: start.x,
            cy: start.y,
            r: Math.max(
              2,
              Math.round(Math.hypot(end.x - start.x, end.y - start.y)),
            ),
          }
        : type === 'ellipse'
          ? {
              cx: x + width / 2,
              cy: y + height / 2,
              rx: width / 2,
              ry: height / 2,
            }
          : { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
  const props: Properties = {
    ...geometry,
    stroke: '#29233c',
    'stroke-width': 3,
  };
  if (type !== 'line')
    props.fill =
      type === 'circle'
        ? '#ffb651'
        : type === 'ellipse'
          ? '#9dd7ba'
          : '#b8a1ef';
  return { id, type, props };
}
export function exportSVG(objects: DrawingObject[]) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="600" height="420">\n${toSource(objects)}\n</svg>\n`;
}
