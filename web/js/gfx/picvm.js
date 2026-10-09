// Picture VM v0 (BUILD_PLAN 4.2, GAME_DESIGN 11.3).
//
// A picture is a small text program of AGI-style drawing commands. This
// module parses that text into compact op arrays and runs the ops into one
// index buffer per layer (sky, far, mid, near), then composites them.
//
// PURE: no DOM, no clock, no randomness. The phone and Node run this same
// file, so a picture is a pure function of its text (and its stamps).
//
// The format, one command per letter, arguments until the next command:
//
//   C n            pen color: 0-15, or a cycling pseudo-color 16-25 (11.5).
//                  Also sets the fill paint to solid n.
//   L x,y ...      absolute polyline (Bresenham); one point plots a pixel
//   R x,y dx,dy .. relative polyline: the first point absolute, then steps
//   F x,y ...      flood fill (4-connected) from each seed, bounded to the
//                  current layer: it fills the region of pixels that share
//                  the seed's value, with the current fill paint
//   D a            fill paint: solid a
//   D a b pattern  fill paint: a two-color dither; b where the pattern holds
//                  (checker, checker25, checker12, hlines, vlines, diag, brick)
//   B shape size   brush: circle, square or splat; size 0-7 (0 = one pixel)
//   S x,y ...      stamp the brush at each point, in the pen color
//   T id x,y [fx]  place a stamp (another .pic) with its anchor at x,y,
//                  optionally flipped left-right; stamps nest 4 deep at most
//   Z id x,y,w,h   a Look hotspot (recorded only; it draws nothing)
//   @ layer        switch layer: sky, far, mid or near
//   # ...          a comment, to the end of the line
//
// Dither patterns and the splat brush are evaluated in picture coordinates,
// so neighboring fills line up, and a flipped stamp keeps the scene's grain.
// A stamp's coordinates are relative to its anchor (a tree's anchor is the
// foot of its trunk). It draws into its own scratch buffer, so its fills
// can't leak into what is already on the layer; then its opaque pixels land
// on the layer. A stamp keeps its own pen, paint and brush.

export const LAYERS = Object.freeze(['sky', 'far', 'mid', 'near']);
export const TRANSPARENT = 255;
export const MAX_STAMP_DEPTH = 4;
export const MAX_COLOR = 25;
export const BRUSH_SHAPES = Object.freeze(['circle', 'square', 'splat']);
export const MAX_BRUSH = 7;

/** @typedef {(x: number, y: number) => boolean} Pattern a dither rule */
/** @typedef {{buf: Uint8Array, w: number, h: number, x0: number, y0: number, ox: number, oy: number, fx: number, depth: number}} Target a buffer being drawn: the layer, or a stamp's scratch */
/** @typedef {{a: number, b: number, pat: string | null}} Paint the fill paint: solid a, or a dither of a and b */
/** @typedef {{x0: number, y0: number, x1: number, y1: number}} Box */
/** @typedef {{id: string, x: number, y: number, w: number, h: number}} Hotspot */
/** @typedef {{op: number, layer: number, count: number, top: boolean, area: number, edge: boolean, x: number, y: number}} FillNote */
/** @typedef {{fills: FillNote[], oob: {op: number, x: number, y: number}[], unknownStamps: {op: number, id: string}[], tooDeep: {op: number, id: string}[], maxDepth: number, colors: Set<number>}} Diag */
/** @typedef {{kind: string[], layer: number[], start: number[], end: number[], writes: number[], colors: number[]}} DrawLog the draw-in's log: each op's run of writes */
/** @typedef {{width: number, height: number, layers: Uint8Array[], hotspots: Hotspot[], diag: Diag, record: DrawLog | null}} Rendered */

/**
 * Dither rules: true means color b, false means color a (doc 11.4).
 * @type {Readonly<Record<string, Pattern>>}
 */
export const PATTERNS = Object.freeze({
  checker: (x, y) => ((x + y) & 1) === 0,
  checker25: (x, y) => (x & 1) === 0 && (y & 1) === 0,
  checker12: (x, y) => (x & 3) === 0 && (y & 1) === 0,
  hlines: (x, y) => (y & 1) === 0,
  vlines: (x, y) => (x & 1) === 0,
  diag: (x, y) => ((x + y) & 3) === 0,
  // Courses three rows tall under a mortar row; the joints shift by two
  // pixels on every other course.
  brick: (x, y) => (y & 3) === 0 || (x & 3) === (((y >> 2) & 1) << 1),
});

const COMMANDS = new Set(['C', 'L', 'R', 'F', 'D', 'B', 'S', 'T', 'Z', '@']);
const POINT_RE = /^(-?\d+),(-?\d+)$/;
const RECT_RE = /^(-?\d+),(-?\d+),(\d+),(\d+)$/;
const INT_RE = /^\d+$/;
const ID_RE = /^[a-z][a-z0-9_]*$/;

/**
 * Parse .pic text.
 * @param {string} text
 * @returns {{ops: any[][], lines: number[], errors: {line: number, msg: string}[]}}
 */
export function parsePic(text) {
  /** @type {{t: string, line: number}[]} */
  const toks = [];
  const rows = String(text).split(/\r?\n/);
  for (let i = 0; i < rows.length; i++) {
    const hash = rows[i].indexOf('#');
    const body = hash >= 0 ? rows[i].slice(0, hash) : rows[i];
    for (const t of body.split(/\s+/)) if (t) toks.push({ t, line: i + 1 });
  }
  const isCmd = (/** @type {string} */ t) => t === '@' || /^[A-Z]$/.test(t);
  /** @type {any[][]} */
  const ops = [];
  /** @type {number[]} */
  const lines = [];
  /** @type {{line: number, msg: string}[]} */
  const errors = [];
  let i = 0;
  while (i < toks.length) {
    const { t: cmd, line } = toks[i++];
    /** @type {string[]} */
    const args = [];
    while (i < toks.length && !isCmd(toks[i].t)) args.push(toks[i++].t);
    const err = (/** @type {string} */ msg) => errors.push({ line, msg: `${cmd}: ${msg}` });
    if (!isCmd(cmd)) {
      errors.push({ line, msg: `expected a command, found "${cmd}"` });
      continue;
    }
    if (!COMMANDS.has(cmd)) {
      errors.push({ line, msg: `unknown command "${cmd}"` }); // t-ok: .pic diagnostics (developer text)
      continue;
    }
    const points = () => {
      /** @type {number[]} */
      const out = [];
      for (const a of args) {
        const m = POINT_RE.exec(a);
        if (!m) {
          err(`"${a}" is not a point (x,y)`); // t-ok: .pic diagnostics (developer text)
          return null;
        }
        out.push(Number(m[1]), Number(m[2]));
      }
      if (out.length === 0) {
        err('needs at least one point'); // t-ok: .pic diagnostics (developer text)
        return null;
      }
      return out;
    };
    const color = (/** @type {string} */ a) => {
      if (!INT_RE.test(a) || Number(a) > MAX_COLOR) {
        err(`"${a}" is not a color 0-${MAX_COLOR}`); // t-ok: .pic diagnostics (developer text)
        return null;
      }
      return Number(a);
    };
    let op = null;
    switch (cmd) {
      case 'C': {
        if (args.length !== 1) err('takes one color'); // t-ok: .pic diagnostics (developer text)
        else {
          const c = color(args[0]);
          if (c !== null) op = ['C', c];
        }
        break;
      }
      case 'L':
      case 'F':
      case 'S': {
        const p = points();
        if (p) op = [cmd, p];
        break;
      }
      case 'R': {
        const p = points();
        if (p) {
          // Compile relative steps to absolute points.
          for (let k = 2; k < p.length; k += 2) {
            p[k] += p[k - 2];
            p[k + 1] += p[k - 1];
          }
          op = ['L', p];
        }
        break;
      }
      case 'D': {
        if (args.length === 1) {
          const a = color(args[0]);
          if (a !== null) op = ['D', a];
        } else if (args.length === 3) {
          const a = color(args[0]);
          const b = color(args[1]);
          if (!Object.prototype.hasOwnProperty.call(PATTERNS, args[2])) {
            err(`unknown dither pattern "${args[2]}"`); // t-ok: .pic diagnostics (developer text)
          } else if (a !== null && b !== null) op = ['D', a, b, args[2]];
        } else err('takes "a" or "a b pattern"'); // t-ok: .pic diagnostics (developer text)
        break;
      }
      case 'B': {
        if (args.length !== 2) err('takes a shape and a size'); // t-ok: .pic diagnostics (developer text)
        else if (!BRUSH_SHAPES.includes(args[0])) err(`unknown brush shape "${args[0]}"`); // t-ok: .pic diagnostics (developer text)
        else if (!INT_RE.test(args[1]) || Number(args[1]) > MAX_BRUSH) err(`size must be 0-${MAX_BRUSH}`); // t-ok: .pic diagnostics (developer text)
        else op = ['B', args[0], Number(args[1])];
        break;
      }
      case 'T': {
        if (args.length < 2 || args.length > 3) err('takes an id, a point and an optional fx'); // t-ok: .pic diagnostics (developer text)
        else if (!ID_RE.test(args[0])) err(`"${args[0]}" is not a stamp id`); // t-ok: .pic diagnostics (developer text)
        else if (args.length === 3 && args[2] !== 'fx') err(`unknown stamp option "${args[2]}"`); // t-ok: .pic diagnostics (developer text)
        else {
          const m = POINT_RE.exec(args[1]);
          if (!m) err(`"${args[1]}" is not a point (x,y)`); // t-ok: .pic diagnostics (developer text)
          else op = ['T', args[0], Number(m[1]), Number(m[2]), args.length === 3 ? 1 : 0];
        }
        break;
      }
      case 'Z': {
        const m = args.length === 2 ? RECT_RE.exec(args[1]) : null;
        if (!m || !ID_RE.test(args[0])) err('takes an id and x,y,w,h'); // t-ok: .pic diagnostics (developer text)
        else op = ['Z', args[0], Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
        break;
      }
      case '@': {
        if (args.length !== 1 || !LAYERS.includes(args[0])) err(`layer must be one of ${LAYERS.join(', ')}`); // t-ok: .pic diagnostics (developer text)
        else op = ['@', args[0]];
        break;
      }
    }
    if (op) {
      ops.push(op);
      lines.push(line);
    }
  }
  return { ops, lines, errors };
}

/**
 * Parse and throw on any error. Returns the compiled op arrays (JSON-safe).
 * @param {string} text
 * @param {string} [name]
 */
export function compilePic(text, name = 'picture') {
  const { ops, errors } = parsePic(text);
  if (errors.length) {
    const msg = errors.map((e) => `${name}:${e.line}: ${e.msg}`).join('\n');
    throw new Error(msg);
  }
  return ops;
}

/**
 * A small integer hash for the splat brush. Deterministic everywhere.
 * @param {number} x
 * @param {number} y
 * @param {number} [s]
 */
export function hash2(x, y, s = 0) {
  let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(s | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * @param {string} shape
 * @param {number} size
 * @param {number} dx
 * @param {number} dy
 */
function brushHas(shape, size, dx, dy) {
  if (shape === 'square') return true;
  return dx * dx + dy * dy <= size * size + (size >> 1);
}

/**
 * The bounding box of a stamp's ops in its own coordinates, nested stamps
 * included. Returns null for a stamp that draws nothing.
 * @param {string} id
 * @param {Record<string, any[][]>} stamps
 * @param {Map<string, Box | null>} cache
 * @param {Set<string>} seen
 * @returns {Box | null}
 */
function stampBBox(id, stamps, cache, seen) {
  const cached = cache.get(id);
  if (cached !== undefined) return cached;
  const ops = stamps[id];
  if (!ops || seen.has(id)) return null;
  seen.add(id);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (/** @type {number} */ ax, /** @type {number} */ ay, bx = ax, by = ay) => {
    if (ax < x0) x0 = ax;
    if (ay < y0) y0 = ay;
    if (bx > x1) x1 = bx;
    if (by > y1) y1 = by;
  };
  let size = 0;
  for (const op of ops) {
    switch (op[0]) {
      case 'L':
      case 'F':
        for (let k = 0; k < op[1].length; k += 2) add(op[1][k], op[1][k + 1]);
        break;
      case 'B':
        size = op[2];
        break;
      case 'S':
        for (let k = 0; k < op[1].length; k += 2) add(op[1][k] - size, op[1][k + 1] - size, op[1][k] + size, op[1][k + 1] + size);
        break;
      case 'T': {
        const child = stampBBox(op[1], stamps, cache, seen);
        if (child) {
          if (op[4]) add(op[2] - child.x1, op[3] + child.y0, op[2] - child.x0, op[3] + child.y1);
          else add(op[2] + child.x0, op[3] + child.y0, op[2] + child.x1, op[3] + child.y1);
        }
        break;
      }
      case 'Z':
        add(op[2], op[3], op[2] + op[4] - 1, op[3] + op[5] - 1);
        break;
    }
  }
  seen.delete(id);
  const box = x0 === Infinity ? null : { x0, y0, x1, y1 };
  cache.set(id, box);
  return box;
}

/**
 * Run a compiled picture.
 *
 * @param {any[][]} ops compiled ops (compilePic)
 * @param {object} opts
 * @param {number} opts.width
 * @param {number} opts.height
 * @param {Record<string, any[][]>} [opts.stamps] stamp id -> compiled ops
 * @param {boolean} [opts.record] also log every pixel write, op by op, for the draw-in
 * @returns {Rendered}
 */
export function renderPic(ops, opts) {
  const W = opts.width | 0;
  const H = opts.height | 0;
  const N = W * H;
  const stamps = opts.stamps || {};
  const layers = LAYERS.map(() => new Uint8Array(N).fill(TRANSPARENT));
  /** @type {Map<string, Box | null>} */
  const bboxCache = new Map();
  /** @type {Hotspot[]} */
  const hotspots = [];
  /** @type {Diag} */
  const diag = {
    fills: [], // {op, layer, count, top, area, edge, x, y}
    oob: [], // {op, x, y}
    unknownStamps: [], // {op, id}
    tooDeep: [], // {op, id}
    maxDepth: 0,
    colors: new Set(),
  };
  // Draw-in log: each entry is one op's run of writes into writes/colors.
  /** @type {DrawLog | null} */
  const rec = opts.record
    ? { kind: [], layer: [], start: [], end: [], writes: [], colors: [] }
    : null;

  // Scratch for fills, grown as needed. Generation counters avoid clearing.
  let seenGen = new Uint32Array(N);
  let queue = new Int32Array(N);
  let gen = 0;

  let layerIndex = 0;
  let lastFillEdge = false;
  let topOp = 0; // index of the top-level op being run (for diagnostics)

  /** @type {Target} */
  const top = { buf: layers[0], w: W, h: H, x0: 0, y0: 0, ox: 0, oy: 0, fx: 1, depth: 0 };

  /** @param {string} kind */
  function logStart(kind) {
    if (!rec) return;
    rec.kind.push(kind);
    rec.layer.push(layerIndex);
    rec.start.push(rec.writes.length);
    rec.end.push(rec.writes.length);
  }
  function logEnd() {
    if (!rec) return;
    rec.end[rec.end.length - 1] = rec.writes.length;
  }

  /**
   * @param {Target} t
   * @param {number} lx
   * @param {number} ly
   * @param {number} c
   */
  function plot(t, lx, ly, c) {
    const bx = lx - t.x0;
    const by = ly - t.y0;
    if (bx < 0 || by < 0 || bx >= t.w || by >= t.h) return;
    t.buf[by * t.w + bx] = c;
    if (rec) {
      const dx = t.ox + t.fx * lx;
      const dy = t.oy + ly;
      if (dx >= 0 && dy >= 0 && dx < W && dy < H) {
        rec.writes.push(dy * W + dx);
        rec.colors.push(c);
      }
    }
  }

  // Bresenham, always run from the upper (then left) end, so a segment
  // covers the same pixels whichever way it is written, and two shapes that
  // share an edge meet without a seam. skipFirst skips the written start
  // point (a polyline's joint, already plotted).
  /**
   * @param {Target} t
   * @param {number} ax
   * @param {number} ay
   * @param {number} bx
   * @param {number} by
   * @param {number} c
   * @param {boolean} skipFirst
   */
  function line(t, ax, ay, bx, by, c, skipFirst) {
    const skipX = skipFirst ? ax : NaN;
    const skipY = skipFirst ? ay : NaN;
    if (by < ay || (by === ay && bx < ax)) {
      const tx = ax;
      const ty = ay;
      ax = bx;
      ay = by;
      bx = tx;
      by = ty;
    }
    const dx = Math.abs(bx - ax);
    const dy = -Math.abs(by - ay);
    const sx = ax < bx ? 1 : -1;
    const sy = ay < by ? 1 : -1;
    let err = dx + dy;
    let x = ax;
    let y = ay;
    for (;;) {
      if (!(x === skipX && y === skipY)) plot(t, x, y, c);
      if (x === bx && y === by) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  /**
   * @param {Target} t
   * @param {number} lx
   * @param {number} ly
   * @param {Paint} paint
   */
  function fill(t, lx, ly, paint) {
    const bx = lx - t.x0;
    const by = ly - t.y0;
    if (bx < 0 || by < 0 || bx >= t.w || by >= t.h) return 0;
    const n = t.w * t.h;
    if (seenGen.length < n) {
      seenGen = new Uint32Array(n);
      queue = new Int32Array(n);
      gen = 0;
    }
    gen++;
    if (gen === 0xffffffff) {
      seenGen.fill(0);
      gen = 1;
    }
    const buf = t.buf;
    const seed = by * t.w + bx;
    const seedVal = buf[seed];
    const pat = paint.pat ? PATTERNS[paint.pat] : null;
    if (!pat && paint.a === seedVal) return 0;
    let head = 0;
    let tail = 0;
    queue[tail++] = seed;
    seenGen[seed] = gen;
    let count = 0;
    let edge = false;
    while (head < tail) {
      const p = queue[head++];
      const px = p % t.w;
      const py = (p - px) / t.w;
      if (px === 0 || py === 0 || px === t.w - 1 || py === t.h - 1) edge = true;
      const lpx = px + t.x0;
      const lpy = py + t.y0;
      let c = paint.a;
      if (pat && pat(t.ox + t.fx * lpx, t.oy + lpy)) c = paint.b;
      plot(t, lpx, lpy, c);
      count++;
      if (px > 0 && seenGen[p - 1] !== gen && buf[p - 1] === seedVal) {
        seenGen[p - 1] = gen;
        queue[tail++] = p - 1;
      }
      if (px < t.w - 1 && seenGen[p + 1] !== gen && buf[p + 1] === seedVal) {
        seenGen[p + 1] = gen;
        queue[tail++] = p + 1;
      }
      if (py > 0 && seenGen[p - t.w] !== gen && buf[p - t.w] === seedVal) {
        seenGen[p - t.w] = gen;
        queue[tail++] = p - t.w;
      }
      if (py < t.h - 1 && seenGen[p + t.w] !== gen && buf[p + t.w] === seedVal) {
        seenGen[p + t.w] = gen;
        queue[tail++] = p + t.w;
      }
    }
    lastFillEdge = edge;
    return count;
  }

  /**
   * @param {Target} t
   * @param {number} cx
   * @param {number} cy
   * @param {string} shape
   * @param {number} size
   * @param {number} c
   */
  function brush(t, cx, cy, shape, size, c) {
    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size; dx <= size; dx++) {
        if (!brushHas(shape, size, dx, dy)) continue;
        const lx = cx + dx;
        const ly = cy + dy;
        if (shape === 'splat') {
          const h = hash2(t.ox + t.fx * lx, t.oy + ly, hash2(t.ox + t.fx * cx, t.oy + cy, 7));
          if ((h & 7) >= 3 && !(dx === 0 && dy === 0)) continue;
        }
        plot(t, lx, ly, c);
      }
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  function inCanvas(x, y) {
    return x >= 0 && y >= 0 && x < W && y < H;
  }

  /**
   * @param {Target} t
   * @param {any[][]} list
   */
  function run(t, list) {
    let pen = 0;
    /** @type {Paint} */
    let paint = { a: 0, b: 0, pat: null };
    let shape = 'circle';
    let size = 0;
    const isTop = t.depth === 0;
    for (let k = 0; k < list.length; k++) {
      const op = list[k];
      if (isTop) topOp = k;
      switch (op[0]) {
        case 'C':
          pen = op[1];
          paint = { a: pen, b: pen, pat: null };
          diag.colors.add(pen);
          break;
        case 'D':
          paint = op.length === 2 ? { a: op[1], b: op[1], pat: null } : { a: op[1], b: op[2], pat: op[3] };
          diag.colors.add(op[1]);
          if (op.length > 2) diag.colors.add(op[2]);
          break;
        case 'L': {
          const p = op[1];
          logStart('line');
          if (p.length === 2) plot(t, p[0], p[1], pen);
          for (let j = 2; j < p.length; j += 2) line(t, p[j - 2], p[j - 1], p[j], p[j + 1], pen, j > 2);
          logEnd();
          if (isTop) for (let j = 0; j < p.length; j += 2) if (!inCanvas(p[j], p[j + 1])) diag.oob.push({ op: k, x: p[j], y: p[j + 1] });
          break;
        }
        case 'F': {
          const p = op[1];
          for (let j = 0; j < p.length; j += 2) {
            logStart('fill');
            lastFillEdge = false;
            const count = fill(t, p[j], p[j + 1], paint);
            logEnd();
            // A stamp's outline sets its box, so a closed shape's fill never
            // reaches the box's edge: one that does has leaked.
            diag.fills.push({ op: isTop ? k : topOp, layer: layerIndex, count, top: isTop, area: t.w * t.h, edge: lastFillEdge, x: p[j], y: p[j + 1] });
            if (isTop && !inCanvas(p[j], p[j + 1])) diag.oob.push({ op: k, x: p[j], y: p[j + 1] });
          }
          break;
        }
        case 'B':
          shape = op[1];
          size = op[2];
          break;
        case 'S': {
          const p = op[1];
          logStart('brush');
          for (let j = 0; j < p.length; j += 2) brush(t, p[j], p[j + 1], shape, size, pen);
          logEnd();
          if (isTop) for (let j = 0; j < p.length; j += 2) if (!inCanvas(p[j], p[j + 1])) diag.oob.push({ op: k, x: p[j], y: p[j + 1] });
          break;
        }
        case 'T': {
          if (isTop && !inCanvas(op[2], op[3])) diag.oob.push({ op: k, x: op[2], y: op[3] });
          stamp(t, op[1], op[2], op[3], op[4], isTop ? k : topOp);
          break;
        }
        case 'Z': {
          const [, id, x, y, w, h] = op;
          let gx = t.ox + t.fx * x;
          if (t.fx < 0) gx -= w - 1;
          hotspots.push({ id, x: gx, y: t.oy + y, w, h });
          break;
        }
        case '@':
          if (isTop) {
            layerIndex = LAYERS.indexOf(op[1]);
            t.buf = layers[layerIndex];
          }
          break;
      }
    }
  }

  /**
   * @param {Target} t
   * @param {string} id
   * @param {number} ax
   * @param {number} ay
   * @param {number} flip
   * @param {number} opIndex
   */
  function stamp(t, id, ax, ay, flip, opIndex) {
    const sops = stamps[id];
    if (!sops) {
      diag.unknownStamps.push({ op: opIndex, id });
      return;
    }
    const depth = t.depth + 1;
    if (depth > MAX_STAMP_DEPTH) {
      diag.tooDeep.push({ op: opIndex, id });
      return;
    }
    if (depth > diag.maxDepth) diag.maxDepth = depth;
    const box = stampBBox(id, stamps, bboxCache, new Set());
    if (!box) return;
    const f = flip ? -1 : 1;
    const w = box.x1 - box.x0 + 1;
    const h = box.y1 - box.y0 + 1;
    /** @type {Target} */
    const child = {
      buf: new Uint8Array(w * h).fill(TRANSPARENT),
      w,
      h,
      x0: box.x0,
      y0: box.y0,
      ox: t.ox + t.fx * ax,
      oy: t.oy + ay,
      fx: t.fx * f,
      depth,
    };
    run(child, sops);
    // Composite the stamp's opaque pixels into the parent buffer. (The
    // draw-in log already holds each write, mapped to the picture.)
    const cb = child.buf;
    for (let cy = 0; cy < child.h; cy++) {
      for (let cx = 0; cx < child.w; cx++) {
        const v = cb[cy * child.w + cx];
        if (v === TRANSPARENT) continue;
        const px = ax + f * (cx + child.x0) - t.x0;
        const py = ay + cy + child.y0 - t.y0;
        if (px < 0 || py < 0 || px >= t.w || py >= t.h) continue;
        t.buf[py * t.w + px] = v;
      }
    }
  }

  run(top, ops);
  return { width: W, height: H, layers, hotspots, diag, record: rec };
}

/**
 * Composite the layers, near over mid over far over sky.
 * @param {{width: number, height: number, layers: Uint8Array[]}} result
 * @param {Uint8Array} [out]
 * @returns {Uint8Array} indices 0-25, TRANSPARENT where nothing was drawn
 */
export function composite(result, out) {
  const N = result.width * result.height;
  const o = out || new Uint8Array(N);
  const L = result.layers;
  for (let p = 0; p < N; p++) {
    let v = TRANSPARENT;
    for (let k = L.length - 1; k >= 0; k--) {
      if (L[k][p] !== TRANSPARENT) {
        v = L[k][p];
        break;
      }
    }
    o[p] = v;
  }
  return o;
}

/**
 * FNV-1a over a byte buffer, as 8 hex digits. For determinism checks.
 * @param {ArrayLike<number>} bytes
 */
export function hashBytes(bytes) {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
