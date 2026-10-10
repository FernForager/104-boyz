// The pencil strip (GAME_DESIGN 12.2; BUILD_PLAN 2.5, S5): today's
// elevation profile under the caption, with a tick at each camp and
// landmark on the way, the part behind you in sage, a rust square where you
// are, and the mile beside it in its format (mi 3.7: fmt.mile_marker,
// web/js/fmt.js). S8 adds the split row under it.
//
// The data is the engine's (buildGraph and route, as ui/map.js reads them):
// the day's route through its points, each node's mile from the start in
// tenths and its elevation, joined by straight lines (the research has no
// profile inside a segment: it is a pencil sketch). stripProfile and
// stripPixels are pure, so Node tests them; renderStrip draws them through
// the picture display, at the picture's own pixel shape, so the strip's
// pixels are the picture's.

import { buildGraph, route } from '../engine/api.js';
import { createDisplay } from '../gfx/display.js';
import { toRGBA } from '../gfx/palette.js';
import { tx } from '../text.js';
import { mileMarker } from '../fmt.js';

/** The strip's picture: as wide as the picture, 12 rows (BUILD_PLAN S5). */
export const STRIP_WIDTH = 160;
export const STRIP_HEIGHT = 12;
/** The profile's columns (x 0..119); x 120..159 stays clear for the mile label. */
export const PLOT_WIDTH = 120;
/** The profile's rows: the line within rows 1..9, the area under it down to row 11. */
const TOP_ROW = 1;
const LINE_ROWS = 9;
const BOTTOM_ROW = STRIP_HEIGHT - 1;
/** The node types that get a tick. */
export const TICK_TYPES = Object.freeze(['camp', 'landmark', 'summit', 'lake']);
/** The palette slots the strip may use: ink, night navy, paper cream, rust, sage. */
export const STRIP_SLOTS = Object.freeze([0, 1, 5, 8, 14]);
const INK = 0;
const NAVY = 1;
const PAPER = 5;
const RUST = 8;
const SAGE = 14;

/**
 * @typedef {{id: string, mi10: number, elev: number, type: string}} ProfilePoint
 * @typedef {{points: ProfilePoint[], total: number, you: number | null, ticks: number[], low: number, high: number}} Profile
 */

/**
 * Pure: the day's profile. Walks the route through the day's points: each
 * node with its mile from the start (tenths) and its elevation; ticks at the
 * camps and landmarks after the start; you at the node's first mile on the
 * route (null when the route doesn't pass it).
 * @param {any} park rules.park
 * @param {string[]} day the day's points, in order (a stop's view.day)
 * @param {string} node where you are (a stop's view.node)
 * @returns {Profile}
 */
export function stripProfile(park, day, node) {
  const r = route(buildGraph(park), day);
  /** @type {ProfilePoint[]} */
  const points = [];
  let mi10 = 0;
  const add = (/** @type {string} */ id) => {
    const n = park.nodes[id];
    points.push({ id, mi10, elev: n.elev_ft, type: n.type });
  };
  add(r.legs[0].nodes[0]);
  for (const leg of r.legs) {
    leg.edges.forEach((e, i) => {
      mi10 += park.segs[e.id].mi10;
      add(leg.nodes[i + 1]);
    });
  }
  const elevs = points.map((p) => p.elev);
  const at = points.find((p) => p.id === node);
  return {
    points,
    total: mi10,
    you: at ? at.mi10 : null,
    ticks: points.filter((p, i) => i > 0 && TICK_TYPES.includes(p.type)).map((p) => p.mi10),
    low: Math.min(...elevs),
    high: Math.max(...elevs),
  };
}

/**
 * Pure: the elevation at a mile, along the straight lines between nodes.
 * @param {ProfilePoint[]} points
 * @param {number} mi10
 */
export function elevAt(points, mi10) {
  if (mi10 <= points[0].mi10) return points[0].elev;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (mi10 <= b.mi10) return b.mi10 === a.mi10 ? b.elev : a.elev + ((b.elev - a.elev) * (mi10 - a.mi10)) / (b.mi10 - a.mi10);
  }
  return points[points.length - 1].elev;
}

/**
 * Pure: the strip's pixels, palette slots, STRIP_WIDTH x STRIP_HEIGHT. The
 * line paper cream (sage up to where you are), night navy under it, a
 * sage tick 1 wide and 2 tall on the bottom rows at each tick, a 2x2 rust
 * square on the line where you are; ink elsewhere, and x 120 on clear.
 * @param {Profile} p
 * @returns {Uint8Array}
 */
export function stripPixels(p) {
  const W = STRIP_WIDTH;
  const px = new Uint8Array(W * STRIP_HEIGHT).fill(INK);
  const set = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ c) => {
    if (x >= 0 && x < PLOT_WIDTH && y >= 0 && y < STRIP_HEIGHT) px[y * W + x] = c;
  };
  const span = Math.max(1, p.total);
  const range = p.high - p.low;
  const rowOf = (/** @type {number} */ elev) => TOP_ROW + (range > 0 ? Math.round(((p.high - elev) * (LINE_ROWS - TOP_ROW)) / range) : LINE_ROWS - TOP_ROW);
  const xOf = (/** @type {number} */ mi10) => Math.round((mi10 * (PLOT_WIDTH - 1)) / span);
  const youX = p.you === null ? -1 : xOf(p.you);
  /** @type {number[]} */
  const rows = [];
  for (let x = 0; x < PLOT_WIDTH; x++) rows.push(rowOf(elevAt(p.points, (x * span) / (PLOT_WIDTH - 1))));
  for (let x = 0; x < PLOT_WIDTH; x++) {
    const y = rows[x];
    for (let yy = y + 1; yy <= BOTTOM_ROW; yy++) set(x, yy, NAVY);
    // The line, joined to the last column's row so a climb never breaks.
    const prev = x > 0 ? rows[x - 1] : y;
    const c = youX >= 0 && x <= youX ? SAGE : PAPER;
    for (let yy = Math.min(prev, y); yy <= Math.max(prev, y); yy++) if (yy === y || x > 0) set(x, yy, c);
  }
  for (const t of p.ticks) {
    const x = xOf(t);
    set(x, BOTTOM_ROW - 1, SAGE);
    set(x, BOTTOM_ROW, SAGE);
  }
  if (youX >= 0) {
    const x0 = Math.min(youX, PLOT_WIDTH - 2);
    const y0 = Math.max(0, rows[youX] - 1);
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) set(x0 + dx, y0 + dy, RUST);
  }
  return px;
}

/**
 * Draw the strip into its element: div.frame-strip > canvas.strip +
 * span.strip-mile. The canvas takes the picture's pixel shape (shape, from
 * the picture's display); without a canvas context (Node's tests) only the
 * label is written. Returns {relayout, release}.
 * @param {HTMLElement} el div.frame-strip
 * @param {{park: any, view: {node: string, day: string[]}, palette: import('../gfx/palette.js').Palette | null}} o
 */
export function renderStrip(el, { park, view, palette }) {
  const doc = el.ownerDocument;
  const canvas = /** @type {HTMLCanvasElement} */ (doc.createElement('canvas'));
  canvas.className = 'strip';
  canvas.setAttribute('aria-hidden', 'true');
  const label = doc.createElement('span');
  label.className = 'strip-mile';
  el.appendChild(canvas);
  el.appendChild(label);
  const profile = stripProfile(park, view.day, view.node);
  if (profile.you !== null) {
    const mi = mileMarker(profile.you);
    tx(label, mi.id, mi.vars); // t-ids: fmt.mile_marker
  }
  /** @type {ReturnType<typeof createDisplay> | null} */
  let display = null;
  if (palette && typeof canvas.getContext === 'function') {
    display = createDisplay(canvas, STRIP_WIDTH, STRIP_HEIGHT);
  }
  return {
    profile,
    /**
     * Size the strip at the picture's pixel shape.
     * @param {{sx: number, sy: number, short: boolean}} shape
     * @param {number} screenHeight
     */
    relayout(shape, screenHeight) {
      if (!display || !palette) return;
      const dpr = window.devicePixelRatio || 1;
      // The width that gives exactly the picture's sx (pickPixelShape's 2-pt margin).
      display.layout({ cssWidth: (STRIP_WIDTH * shape.sx) / dpr + 2, screenHeight });
      display.present(toRGBA(stripPixels(profile), palette));
    },
    release() {
      if (display) display.release();
    },
  };
}
