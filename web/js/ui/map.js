// The pencil map of the loop (BUILD_PLAN 2.5, S4; GAME_DESIGN 4.3), v0: a
// check view on preview, at #map. It draws the High Divide loop from the
// park graph, every camp in place, and lists each camp's miles both ways
// round as the engine computes them on the phone, so the 4.3 tables can be
// checked against the data by eye.
//
// main.js imports this module only on a build whose <html data-screens>
// lists the map (opensMap, which lives in ui/debug.js so the gate can be
// asked without loading this file); main's page never does. It opens as a
// full-screen sheet over whatever shows, and never touches the game under
// it: no dispatch, no save.
//
//   The picture: data/map.json (the display data the build makes from the
//     research's map_xy, tenths of a mile east and south of the loop's
//     corner) drawn in pencil through the picture VM, 160 columns wide, its
//     rows scaled by the pixel the display picks for this phone (sy / sx:
//     4x2 on the SE, 6x4 on the 13 mini, 7x4 on the 17), so a mile is a mile
//     both ways on screen; a resize that changes the pixel redraws it.
//     Paper cream ground; maintained trail in ink, solid; primitive
//     in ink, dotted; way trail in slate, dashed; map-only links in slate,
//     sparse dots; the map's lakes as glacier-blue blobs; each camp a 3x3
//     brick mark with an ink edge, the desk camps hollow; the trailhead a
//     3x3 ink square; group and stock sites a single slate pixel; the peak
//     a small ink caret. No gold (P07). mapOps() builds the ops, pure.
//   The badges: the trailhead 0 and the 24 camps 1-24 in counterclockwise
//     order (by the counterclockwise mile, then id), HTML over the canvas,
//     placed by layoutMap() (pure) where they cover no mark and no other
//     badge, and positioned by the display's own transform.
//   The legend: an <ol> of the 25, each its number, the place's name (a
//     place.* line from the gazetteer, not ours) and its miles, ↺ then ↻,
//     from distAlong (the camp table's mile), formatted (mi10 / 10).toFixed(1):
//     locale-free; the fmt.* tokens come later and this is a check view.
//     The legend is the accessible form: the canvas and the badges are
//     aria-hidden.
//   Close: ×, which clears the hash with history.replaceState, or Back,
//     which changes it (main.js then calls hideMap).

import { loadContent, buildGraph, distAlong } from '../engine/api.js';
import { renderPic, composite } from '../gfx/picvm.js';
import { makePalette, resolve, toRGBA } from '../gfx/palette.js';
import { createDisplay, pickPixelShape, PIXEL_ASPECT } from '../gfx/display.js';
import { t, tx } from '../text.js';
import { opensMap } from './debug.js';

export { opensMap };

/** The build's data, next to the page (U01: relative to this module). */
const DATA = new URL('../../data/', import.meta.url);
/** The picture's width in picture pixels, as every picture (GAME_DESIGN 11.2). */
export const MAP_WIDTH = 160;
/** Picture pixels kept clear at every edge, for the marks and their badges. */
export const MAP_MARGIN = 8;
/** The palette slots the map may use: ink, slate, glacier blue, paper cream, brick. */
export const MAP_SLOTS = Object.freeze([0, 2, 3, 5, 9]);
/** A badge's box in CSS px (game.css .map-badge): two digits. */
export const BADGE_CSS = Object.freeze([16, 13]);
/** How far a mark reaches from its center, in picture pixels: camps are 5x5, the trailhead 3x3. */
const MARK_R = Object.freeze({ trailhead: 1, camp: 2, desk: 2 });
/** The marks the legend lists, by kind. */
const LISTED = new Set(['trailhead', 'camp', 'desk']);
const SHEET_ID = 'map-sheet';

const INK = 0;
const SLATE = 2;
const GLACIER = 3;
const PAPER = 5;
const BRICK = 9;

/** How each trail class is drawn: [slot, on, period] (a pixel is drawn when its step along the line mod period < on). */
const STROKES = Object.freeze({
  maintained: [INK, 1, 1],
  primitive: [INK, 1, 2],
  way_trail: [SLATE, 3, 5],
  off_trail: [SLATE, 1, 4],
});
/** Map-only links, whatever their class: slate, sparse dots. */
const MAP_ONLY = Object.freeze([SLATE, 1, 4]);
/** The order the strokes go down: faint first, so the main trail sits on top. */
const STROKE_ORDER = Object.freeze(['map_only', 'off_trail', 'way_trail', 'primitive', 'maintained']);

const byCode = (/** @type {string} */ a, /** @type {string} */ b) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * @typedef {{xy: number[], kind: string, label: string | null}} MapNode
 * @typedef {{a: string, b: string, class: string, map_only: boolean}} MapSeg
 * @typedef {{format: number, bounds: number[], nodes: Record<string, MapNode>, segs: Record<string, MapSeg>}} MapData data/map.json
 * @typedef {{id: string, n: number, kind: string, label: string, x: number, y: number, ccw: number | null, cw: number | null, badge: number[]}} Mark
 */

/**
 * Pure: the picture's frame for a map: its height, and where a map
 * position (tenths of a mile) lands in picture pixels. Columns per tenth
 * fill the width inside the margins; rows per tenth are that over the
 * pixel's aspect, sy / sx of the shape the display shows it at (PIXEL_ASPECT,
 * the doc's wide pixel, when none is given), so a mile is a mile both ways
 * on screen.
 * @param {MapData} map
 * @param {{width?: number, margin?: number, aspect?: number}} [o]
 */
export function mapFrame(map, { width = MAP_WIDTH, margin = MAP_MARGIN, aspect = PIXEL_ASPECT } = {}) {
  const [x0, y0, x1, y1] = map.bounds;
  const kx = (width - 1 - 2 * margin) / Math.max(1, x1 - x0);
  const ky = kx / aspect;
  const height = Math.round((y1 - y0) * ky) + 1 + 2 * margin;
  const at = (/** @type {number[]} */ xy) => [margin + Math.round((xy[0] - x0) * kx), margin + Math.round((xy[1] - y0) * ky)];
  return { width, height, at };
}

/**
 * The pixels of a line from a to b, from its upper (then left) end, as the
 * picture VM's Bresenham walks it, so a dashed line's steps match its pixels.
 * @param {number} ax
 * @param {number} ay
 * @param {number} bx
 * @param {number} by
 * @returns {number[][]}
 */
function linePixels(ax, ay, bx, by) {
  if (by < ay || (by === ay && bx < ax)) [ax, ay, bx, by] = [bx, by, ax, ay];
  const dx = Math.abs(bx - ax);
  const dy = -Math.abs(by - ay);
  const sx = ax < bx ? 1 : -1;
  const sy = ay < by ? 1 : -1;
  let err = dx + dy;
  let x = ax;
  let y = ay;
  const out = [];
  for (;;) {
    out.push([x, y]);
    if (x === bx && y === by) return out;
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
 * Pure: the map's picture as picture-VM ops, built from data/map.json.
 * @param {MapData} map
 * @param {{width?: number, aspect?: number}} [o] aspect: as mapFrame's
 * @returns {{width: number, height: number, ops: any[][]}}
 */
export function mapOps(map, { width = MAP_WIDTH, aspect = PIXEL_ASPECT } = {}) {
  const { height, at } = mapFrame(map, { width, aspect });
  const xy = (/** @type {string} */ id) => at(map.nodes[id].xy);
  /** @type {any[][]} */
  const ops = [['C', PAPER], ['F', [0, 0]]];
  // The trails, faint first, each as single pixels where its stroke draws.
  // A class the map has no stroke for is drawn as maintained trail.
  const strokeOf = (/** @type {MapSeg} */ s) => (s.map_only ? 'map_only' : Object.prototype.hasOwnProperty.call(STROKES, s.class) ? s.class : 'maintained');
  const segIds = Object.keys(map.segs)
    .filter((id) => map.nodes[map.segs[id].a] && map.nodes[map.segs[id].b])
    .sort(byCode);
  for (const kind of STROKE_ORDER) {
    const ids = segIds.filter((id) => strokeOf(map.segs[id]) === kind);
    if (!ids.length) continue;
    const [slot, on, period] = kind === 'map_only' ? MAP_ONLY : STROKES[/** @type {keyof typeof STROKES} */ (kind)];
    if (period === 1) {
      ops.push(['C', slot]);
      for (const id of ids) ops.push(['L', [...xy(map.segs[id].a), ...xy(map.segs[id].b)]]);
      continue;
    }
    /** @type {number[]} */
    const pts = [];
    for (const id of ids) {
      const [a, b] = [xy(map.segs[id].a), xy(map.segs[id].b)];
      linePixels(a[0], a[1], b[0], b[1]).forEach((p, i) => {
        if (i % period < on) pts.push(p[0], p[1]);
      });
    }
    ops.push(['C', slot], ['B', 'square', 0], ['S', pts]);
  }
  const nodeIds = Object.keys(map.nodes).sort(byCode);
  const of = (/** @type {string} */ kind) => nodeIds.filter((id) => map.nodes[id].kind === kind).flatMap(xy);
  const mark = (/** @type {number} */ slot, /** @type {string} */ shape, /** @type {number} */ size, /** @type {number[]} */ pts) => {
    if (pts.length) ops.push(['C', slot], ['B', shape, size], ['S', pts]);
  };
  // The map's lakes, then the small marks, then the camps and the trailhead on top.
  mark(GLACIER, 'circle', 2, of('lake'));
  mark(SLATE, 'square', 0, of('group'));
  for (const id of nodeIds.filter((n) => map.nodes[n].kind === 'peak')) {
    const [x, y] = xy(id);
    ops.push(['C', INK], ['L', [x - 1, y + 1, x, y, x + 1, y + 1]]);
  }
  mark(INK, 'square', 2, of('camp'));
  mark(BRICK, 'square', 1, of('camp'));
  mark(BRICK, 'square', 2, of('desk'));
  mark(PAPER, 'square', 1, of('desk'));
  mark(INK, 'square', 1, of('trailhead'));
  return { width, height, ops };
}

/**
 * The area two boxes [x, y, w, h] share.
 * @param {number[]} p
 * @param {number[]} q
 */
function overlap(p, q) {
  const w = Math.min(p[0] + p[2], q[0] + q[2]) - Math.max(p[0], q[0]);
  const h = Math.min(p[1] + p[3], q[1] + q[3]) - Math.max(p[1], q[1]);
  return w > 0 && h > 0 ? w * h : 0;
}

/**
 * Pure: the marks the map numbers, with their miles and their badges. The
 * trailhead is 0; the camps (desk camps among them) are 1 to 24 by their
 * counterclockwise mile (then id). Miles are distAlong's, in tenths (the 4.3
 * camp table: distance along the loop, the other way's first segment
 * banned), on the park the build ships (rules.park). Each badge, a box of
 * badge[0] x badge[1] picture pixels, goes to the first of eight places
 * around its mark that stays inside the picture and covers no mark and no
 * badge already placed; failing that, the one that covers least.
 * @param {MapData} map
 * @param {any} rules data/rules.json (its park)
 * @param {{width?: number, badge?: number[], aspect?: number}} [o] aspect: as mapFrame's
 * @returns {{width: number, height: number, loop: string, marks: Mark[]}}
 */
export function layoutMap(map, rules, { width = MAP_WIDTH, badge = [7, 10], aspect = PIXEL_ASPECT } = {}) {
  const park = rules.park;
  const loop = Object.keys(park.loops).sort(byCode)[0];
  const g = buildGraph(park);
  const ccw = distAlong(g, loop, 'ccw');
  const cw = distAlong(g, loop, 'cw');
  const { height, at } = mapFrame(map, { width, aspect });
  const mile = (/** @type {Readonly<Record<string, number>>} */ d, /** @type {string} */ id) => (Object.prototype.hasOwnProperty.call(d, id) ? d[id] : null);
  const listed = Object.keys(map.nodes)
    .filter((id) => LISTED.has(map.nodes[id].kind) && map.nodes[id].label)
    .sort((a, b) => {
      const ka = map.nodes[a].kind === 'trailhead' ? -1 : (mile(ccw, a) ?? Infinity);
      const kb = map.nodes[b].kind === 'trailhead' ? -1 : (mile(ccw, b) ?? Infinity);
      return ka - kb || byCode(a, b);
    });
  /** @type {Mark[]} */
  const marks = listed.map((id, n) => {
    const node = map.nodes[id];
    const [x, y] = at(node.xy);
    return { id, n, kind: node.kind, label: /** @type {string} */ (node.label), x, y, ccw: mile(ccw, id), cw: mile(cw, id), badge: [0, 0] };
  });
  const [w, h] = badge;
  const boxes = marks.map((m) => {
    const r = MARK_R[/** @type {keyof typeof MARK_R} */ (m.kind)];
    return [m.x - r, m.y - r, 2 * r + 1, 2 * r + 1];
  });
  /** @type {number[][]} */
  const placed = [];
  for (const m of marks) {
    const r = MARK_R[/** @type {keyof typeof MARK_R} */ (m.kind)];
    const mid = m.y - (h >> 1);
    const above = m.y - r - 1 - h;
    const below = m.y + r + 2;
    const spots = [
      [m.x + r + 2, mid],
      [m.x - r - 1 - w, mid],
      [m.x + 1, above],
      [m.x + 1, below],
      [m.x - w, above],
      [m.x - w, below],
      [m.x - (w >> 1), above],
      [m.x - (w >> 1), below],
    ];
    let best = null;
    let bestCost = Infinity;
    for (const [bx, by] of spots) {
      if (bx < 0 || by < 0 || bx + w > width || by + h > height) continue;
      const box = [bx, by, w, h];
      const cost = [...boxes, ...placed].reduce((s, q) => s + overlap(box, q), 0);
      if (cost < bestCost) {
        best = box;
        bestCost = cost;
        if (cost === 0) break;
      }
    }
    if (!best) best = [Math.min(Math.max(0, m.x + r + 2), width - w), Math.min(Math.max(0, mid), height - h), w, h];
    placed.push(best);
    m.badge = [best[0], best[1]];
  }
  return { width, height, loop, marks };
}

/**
 * Pure: a mark's miles as the legend shows them, ↺ then ↻, in miles to a
 * tenth, locale-free.
 * @param {{ccw: number | null, cw: number | null}} m
 */
export function milesText(m) {
  const mi = (/** @type {number | null} */ v) => (v === null ? '-' : (v / 10).toFixed(1));
  return `↺ ${mi(m.ccw)} · ↻ ${mi(m.cw)}`;
}

/** The map while it shows: its sheet, and what undoes its listeners and frees its canvas. */
/** @type {{sheet: HTMLElement, stop: () => void} | null} */
let shown = null;

/**
 * An element with classes and attributes.
 * @param {Document} doc
 * @param {string} tag
 * @param {string[]} [classes]
 * @param {Record<string, string>} [attrs]
 */
function el(doc, tag, classes = [], attrs = {}) {
  const e = doc.createElement(tag);
  if (classes.length) e.classList.add(...classes);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

/**
 * Fetch the build's map, rules and voice data, and load the content (the
 * rules hash is the one the build stamped on <html data-rules>).
 * @param {Document} doc
 */
async function loadMapData(doc) {
  const get = async (/** @type {string} */ f) => {
    const res = await fetch(new URL(f, DATA));
    if (!res.ok) throw new Error(`map: data/${f} ${res.status}`);
    return res.json();
  };
  const [map, rules, voice] = await Promise.all([get('map.json'), get('rules.json'), get('voice.json')]);
  const content = loadContent({ rules, voice, rulesHash: String(doc.documentElement.getAttribute('data-rules') || '') });
  if (!content.park()) throw new Error('map: this build ships no park');
  return { map: /** @type {MapData} */ (map), rules: content.data.rules };
}

/**
 * Close the map: the sheet goes, and the hash is cleared without a new
 * history entry. Back does the same through main.js (hideMap).
 * @param {Document} doc
 */
function closeMap(doc) {
  const win = doc.defaultView;
  if (win && win.location.hash) win.history.replaceState(null, '', win.location.pathname + win.location.search);
  hideMap(doc);
}

/**
 * Open the map (once; a second call while it shows does nothing). Resolves
 * when it is drawn.
 * @param {Document} doc
 * @param {{words?: Promise<unknown>}} [o] loadText(), so the names are there
 */
export async function showMap(doc, { words = Promise.resolve() } = {}) {
  if (shown) return;
  const win = /** @type {Window} */ (doc.defaultView);
  const sheet = el(doc, 'div', ['map-sheet'], { id: SHEET_ID, role: 'dialog', 'aria-modal': 'true' });
  const head = el(doc, 'div', ['map-head']);
  const close = el(doc, 'button', ['map-close'], { type: 'button' });
  close.textContent = '×';
  head.appendChild(close);
  const figure = el(doc, 'div', ['map-figure']);
  const canvas = /** @type {HTMLCanvasElement} */ (el(doc, 'canvas', ['picture', 'map-picture'], { 'aria-hidden': 'true' }));
  const badges = el(doc, 'div', ['map-badges'], { 'aria-hidden': 'true' });
  figure.appendChild(canvas);
  figure.appendChild(badges);
  const legend = el(doc, 'ol', ['map-legend'], { role: 'list' });
  sheet.appendChild(head);
  sheet.appendChild(figure);
  sheet.appendChild(legend);
  // The sheet shows at once, with its close button; the picture once it's drawn.
  figure.hidden = true;
  doc.body.appendChild(sheet);
  const onKey = (/** @type {KeyboardEvent} */ event) => {
    if (event.key === 'Escape') closeMap(doc); // t-ok: a key's name, never shown
  };
  // The page under the sheet can't take focus or taps while the map shows
  // (the game's box takes focus at every new screen).
  const app = doc.getElementById('app');
  if (app) app.inert = true;
  /** @type {(() => void)[]} */
  const undo = [() => doc.removeEventListener('keydown', onKey), () => app && (app.inert = false)];
  shown = { sheet, stop: () => undo.forEach((f) => f()) };
  close.addEventListener('click', () => closeMap(doc));
  doc.addEventListener('keydown', onKey);
  close.focus({ preventScroll: true });

  const [{ map, rules }] = await Promise.all([loadMapData(doc), words]);
  if (!shown || shown.sheet !== sheet) return; // closed while it loaded
  sheet.setAttribute('aria-label', t('dev.map'));
  close.setAttribute('aria-label', t('dev.close'));
  const pal = makePalette();
  // The picture is drawn for the pixel the display will show it at, so its
  // rows follow that pixel's aspect; a resize that changes the pixel draws
  // it again, on the same canvas.
  /** @type {{aspect: number, pic: {width: number, height: number}, rgba: ArrayLike<number>, display: ReturnType<typeof createDisplay>} | null} */
  let drawn = null;
  const draw = (/** @type {{sx: number, sy: number}} */ shape) => {
    const aspect = shape.sy / shape.sx;
    if (drawn && drawn.aspect === aspect) return drawn;
    if (drawn) drawn.display.release();
    const pic = mapOps(map, { aspect });
    const indices = composite(renderPic(pic.ops, { width: pic.width, height: pic.height }));
    const rgba = toRGBA(resolve(indices, pic.width, pal, { remap: 'day', background: PAPER }), pal);
    drawn = { aspect, pic, rgba, display: createDisplay(canvas, pic.width, pic.height) };
    return drawn;
  };
  undo.push(() => drawn && drawn.display.release());

  /** @type {HTMLElement[]} */
  const chips = [];
  const fit = () => {
    const cs = win.getComputedStyle(sheet);
    const cssWidth = sheet.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    const room = { cssWidth, screenHeight: Math.max(win.screen.width, win.screen.height) };
    const dpr = win.devicePixelRatio || 1;
    // The display picks its pixel from the width and the screen alone (the
    // map passes no height cap), so the shape asked for first is its own.
    const { aspect, pic, rgba, display } = draw(pickPixelShape({ dpr, picWidth: MAP_WIDTH, ...room }));
    const shape = display.layout(room);
    display.present(rgba);
    const ox = (canvas.width - pic.width * shape.sx) >> 1;
    const badge = [Math.ceil((BADGE_CSS[0] * dpr) / shape.sx), Math.ceil((BADGE_CSS[1] * dpr) / shape.sy)];
    const layout = layoutMap(map, rules, { width: pic.width, badge, aspect });
    layout.marks.forEach((m, i) => {
      let chip = chips[i];
      if (!chip) {
        chip = el(doc, 'span', ['map-badge'], { 'data-kind': m.kind });
        chip.textContent = String(m.n);
        badges.appendChild(chip);
        chips.push(chip);
      }
      chip.style.left = `${(ox + m.badge[0] * shape.sx) / dpr}px`;
      chip.style.top = `${(m.badge[1] * shape.sy) / dpr}px`;
    });
    display.snap();
    return layout;
  };
  figure.hidden = false;
  const layout = fit();
  for (const m of layout.marks) {
    const row = el(doc, 'li', ['map-row'], { 'data-kind': m.kind });
    const n = el(doc, 'span', ['map-n']);
    n.textContent = String(m.n);
    const key = el(doc, 'span', ['map-key'], { 'aria-hidden': 'true' });
    const name = el(doc, 'span', ['map-name']);
    tx(name, m.label); // t-ids: @places
    const miles = el(doc, 'span', ['map-mi']);
    miles.textContent = milesText(m);
    for (const kid of [n, key, name, miles]) row.appendChild(kid);
    legend.appendChild(row);
  }
  win.addEventListener('resize', fit);
  win.addEventListener('orientationchange', fit);
  undo.push(() => {
    win.removeEventListener('resize', fit);
    win.removeEventListener('orientationchange', fit);
  });
}

/**
 * Take the map away, if it shows.
 * @param {Document} doc
 */
export function hideMap(doc) {
  if (!shown) return;
  const { sheet, stop } = shown;
  shown = null;
  stop();
  sheet.remove();
  const stamp = doc.getElementById('build-stamp');
  if (stamp && typeof stamp.focus === 'function') stamp.focus({ preventScroll: true });
}
