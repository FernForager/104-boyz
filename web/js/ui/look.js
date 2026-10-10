// Look (GAME_DESIGN 12.1, 12.2, 2.3; BUILD_PLAN S6, the spec's lead call
// 5): tap the picture, and a small Sierra box answers in the second person,
// as King's Quest's LOOK did.
//
//   The hotspots come from the data: a base's, a scene's and each stamp's
//   own Z ops, composed with the place (gfx/compose.js hotspotsOf), so
//   every composed place gets Looks with no per-place work (decision 69).
//   A kind is looked or silent (content/art/hotspots.json, shipped as
//   art.hotspots, {kind: looked}); only a looked kind gets a button.
//   The words are by kind: look.<kind>, or look.<kind>.<place> where the
//   place has its own; the button's spoken name is look.name.<kind>. A tap
//   that hits no hotspot (a silent kind's, or none) shows the picture's
//   composed alt text as the Look (gfx/alt.js), so no place needs a line.
//   The hit areas (12.1: at least 44 pt) are real transparent buttons over
//   the canvas, placed from the display's pixel shape: each grows about its
//   center to 44 x 44 pt, clamped to the picture, and slides off any
//   larger hotspot's center it would cover, so every hotspot's own center
//   opens its own Look; smaller ones stack over larger ones (Lunch Lake
//   over the basin). The same button is the tap target and VoiceOver's
//   control, in a group named Look.
//   The Look box: a smaller Sierra box over the picture's lower half (snow,
//   a double brick border, Pixelify), with the ▾ continuation when it runs
//   long (ui/textbox.js). It costs no game time and is UI only (no action,
//   so no log, state or hash moves: S9 makes a first Look score, and an
//   engine action, then). A tap anywhere dismisses it (a page at a time
//   while pages remain), and so does Escape; it opens with ui.open's soft
//   wooden tick (13.2), takes focus, and gives it back to its hotspot. It
//   pops up, except under Reduce Motion (frame.css).

import { t, tx, wordsOf } from '../text.js';
import { continueBox } from './textbox.js';

/** 12.1: a picture hotspot's hit area is at least this, in points. */
export const LOOK_MIN_PT = 44;
/** The picture (11.2). */
const PIC_W = 160;
const PIC_H = 168;
/** The group's spoken name. */
export const GROUP_LINE = 'trail.look.group';
/** The Look open on each figure: its close. @type {WeakMap<HTMLElement, () => void>} */
const opened = new WeakMap();

/** A kind's Look line, a place's own, and the button's spoken name (tools/looks.mjs checks the same shapes). */
export const lookLine = (/** @type {string} */ kind) => `look.${kind}`;
export const placeLookLine = (/** @type {string} */ kind, /** @type {string} */ place) => `look.${kind}.${place}`;
export const nameLine = (/** @type {string} */ kind) => `look.name.${kind}`;

/**
 * @typedef {{id: string, x: number, y: number, w: number, h: number}} Hotspot a Z op's box, in picture pixels
 * @typedef {{id: string, x: number, y: number, w: number, h: number, spot: Hotspot}} HitArea a button's box, in CSS px from the canvas's top left
 */

/**
 * The looked hotspots of a picture (the shipped kinds marked looked), in
 * their picture's order.
 * @param {readonly Hotspot[]} hotspots
 * @param {Record<string, boolean> | null | undefined} looked art.hotspots
 * @returns {Hotspot[]}
 */
export function lookedSpots(hotspots, looked) {
  return hotspots.filter((h) => Boolean(looked && looked[h.id] === true));
}

/**
 * Pure: the hit areas of a picture's looked hotspots on a display, in CSS
 * px from the canvas's top left, bottom to top: larger hotspots first, so
 * a smaller one (Lunch Lake) stacks over a larger one (the basin) it sits
 * in. Each grows about its center to at least min x min points, clamped to
 * the picture; where it would cover the center of a hotspot under it (a
 * larger one) that its own box doesn't, it slides off that center, still
 * covering its own box; so every hotspot's own center opens its own Look.
 * @param {readonly Hotspot[]} spots looked ones
 * @param {{sx: number, sy: number, dpr: number, ox?: number, min?: number, width?: number, height?: number}} shape
 *   sx, sy: device pixels a picture pixel; ox: the picture's left inset in
 *   the canvas (device px); width, height: the picture's
 * @returns {HitArea[]}
 */
export function hitAreas(spots, { sx, sy, dpr, ox = 0, min = LOOK_MIN_PT, width = PIC_W, height = PIC_H }) {
  const cx = sx / dpr;
  const cy = sy / dpr;
  const x0 = ox / dpr;
  const picW = width * cx;
  const picH = height * cy;
  const order = spots.map((s, i) => ({ s, i })).sort((a, b) => b.s.w * b.s.h - a.s.w * a.s.h || a.i - b.i);
  const box = (/** @type {Hotspot} */ s) => ({ l: x0 + s.x * cx, t: s.y * cy, r: x0 + (s.x + s.w) * cx, b: (s.y + s.h) * cy });
  const center = (/** @type {Hotspot} */ s) => ({ x: x0 + (s.x + s.w / 2) * cx, y: (s.y + s.h / 2) * cy });
  /** @type {HitArea[]} */
  const out = [];
  order.forEach(({ s }, k) => {
    const own = box(s);
    const W = Math.min(picW, Math.max(own.r - own.l, min));
    const H = Math.min(picH, Math.max(own.b - own.t, min));
    const c = center(s);
    // Where the box may stand: over its own box, inside the picture.
    const span = (/** @type {number} */ lo0, /** @type {number} */ hi0, /** @type {number} */ size, /** @type {number} */ from, /** @type {number} */ to) => [Math.max(from, hi0 - size), Math.min(to - size, lo0)];
    const [lMin, lMax] = span(own.l, own.r, W, x0, x0 + picW);
    const [tMin, tMax] = span(own.t, own.b, H, 0, picH);
    const clamp = (/** @type {number} */ v, /** @type {number} */ lo, /** @type {number} */ hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));
    const l0 = clamp(c.x - W / 2, lMin, lMax);
    const t0 = clamp(c.y - H / 2, tMin, tMax);
    // The centers of the hotspots under it, outside its own box.
    const avoid = order
      .slice(0, k)
      .map((o) => center(o.s))
      .filter((p) => !(p.x >= own.l && p.x < own.r && p.y >= own.t && p.y < own.b));
    const hits = (/** @type {number} */ l, /** @type {number} */ t) => avoid.some((p) => p.x >= l && p.x < l + W && p.y >= t && p.y < t + H);
    let best = { l: l0, t: t0 };
    if (hits(l0, t0)) {
      const nudge = 0.5 / dpr; // half a device pixel past the center
      const ls = [l0, ...avoid.flatMap((p) => [p.x + nudge, p.x - W])].map((v) => clamp(v, lMin, lMax));
      const ts = [t0, ...avoid.flatMap((p) => [p.y + nudge, p.y - H])].map((v) => clamp(v, tMin, tMax));
      let cost = Infinity;
      for (const l of ls) {
        for (const t of ts) {
          const d = Math.abs(l - l0) + Math.abs(t - t0);
          if (d < cost && !hits(l, t)) {
            cost = d;
            best = { l, t };
          }
        }
      }
    }
    out.push({ id: s.id, x: best.l, y: best.t, w: W, h: H, spot: s });
  });
  return out;
}

/**
 * Pure: the hit area a tap at (x, y) (CSS px from the canvas's top left)
 * lands on: the topmost that holds it, or null (the picture's alt Look).
 * @param {readonly HitArea[]} areas hitAreas()'s, bottom to top
 * @param {number} x
 * @param {number} y
 * @returns {HitArea | null}
 */
export function lookAt(areas, x, y) {
  for (let k = areas.length - 1; k >= 0; k--) {
    const a = areas[k];
    if (x >= a.x && x < a.x + a.w && y >= a.y && y < a.y + a.h) return a;
  }
  return null;
}

/**
 * The Look for a kind at a place: the place's own line when the words have
 * one, else the kind's.
 * @param {string} kind
 * @param {string | null} place
 * @param {(id: string) => boolean} [has]
 * @returns {{id: string}[]}
 */
export function lookLines(kind, place, has = (id) => wordsOf(id) !== undefined) {
  if (place && has(placeLookLine(kind, place))) return [{ id: placeLookLine(kind, place) }];
  return [{ id: lookLine(kind) }];
}

/**
 * The Look buttons over a picture: div.looks (a group named Look) holding
 * one transparent button.look per looked hotspot, bottom to top (larger
 * first), each named look.name.<kind>. place(shape) puts them over the
 * canvas once the display has its pixel shape; until then (and in Node)
 * they have no box. onLook(kind, button) runs on a tap.
 * @param {Document} doc
 * @param {readonly Hotspot[]} hotspots the picture's (compose's)
 * @param {Record<string, boolean> | null | undefined} looked art.hotspots
 * @param {(kind: string, button: HTMLButtonElement) => void} onLook
 */
export function renderLooks(doc, hotspots, looked, onLook) {
  const spots = lookedSpots(hotspots, looked);
  const layer = doc.createElement('div');
  layer.className = 'looks';
  layer.setAttribute('role', 'group');
  layer.setAttribute('aria-label', t('trail.look.group'));
  layer.setAttribute('data-t-aria', GROUP_LINE); // the line inspector finds a spoken name by it
  // Bottom to top, as hitAreas stacks them: a 1x1 shape keeps their order.
  const order = hitAreas(spots, { sx: 1, sy: 1, dpr: 1, min: 0 });
  /** @type {HTMLButtonElement[]} */
  const buttons = order.map((a) => {
    const b = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
    b.className = 'look';
    b.setAttribute('type', 'button');
    b.setAttribute('data-kind', a.id);
    const name = nameLine(a.id);
    b.setAttribute('aria-label', t(name)); // t-ids: @art
    b.setAttribute('data-t-aria', name); // the line inspector finds a spoken name by it
    b.addEventListener('click', (event) => {
      if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
      onLook(a.id, b);
    });
    layer.appendChild(b);
    return b;
  });
  return {
    layer,
    buttons,
    /**
     * Put the buttons over the canvas for a display's pixel shape.
     * @param {{sx: number, sy: number, dpr: number, ox?: number}} shape
     * @returns {HitArea[]}
     */
    place(shape) {
      const areas = hitAreas(spots, shape);
      areas.forEach((a, k) => {
        const s = buttons[k].style;
        s.setProperty('left', `${a.x}px`);
        s.setProperty('top', `${a.y}px`);
        s.setProperty('width', `${a.w}px`);
        s.setProperty('height', `${a.h}px`);
      });
      return areas;
    },
  };
}

/**
 * Open a Look: the small Sierra box over the picture's lower half, with
 * its lines (a paragraph each; with flow, one paragraph, the alt text's
 * way). A tap anywhere (or Escape) dismisses it, a page at a time while
 * pages remain; the tap is the box's, never what lies under it. Focus goes
 * to it and back to the opener (or what had it). Returns {el, close,
 * pager, tap}.
 * @param {HTMLElement} figure the picture's figure
 * @param {readonly {id: string, vars?: Record<string, unknown>}[]} lines
 * @param {{opener?: HTMLElement | null, sound?: {play: (cue: string) => void} | null, onClose?: () => void, flow?: boolean}} [o]
 */
export function openLook(figure, lines, { opener = null, sound = null, onClose, flow = false } = {}) {
  const doc = figure.ownerDocument;
  closeLook(figure);
  const back = opener || /** @type {HTMLElement | null} */ (doc.activeElement || null);
  const box = doc.createElement('div');
  box.classList.add('box', 'look-box');
  box.setAttribute('tabindex', '-1');
  if (flow) {
    // A picture's alt text: its parts' sentences run on in one paragraph, as VoiceOver reads them.
    const p = doc.createElement('p');
    lines.forEach((ref, k) => {
      if (k) p.appendChild(doc.createTextNode(' '));
      const span = doc.createElement('span');
      tx(span, ref.id, ref.vars); // t-ids: @art
      p.appendChild(span);
    });
    box.appendChild(p);
  } else {
    for (const ref of lines) {
      const p = doc.createElement('p');
      tx(p, ref.id, ref.vars); // t-ids: @art
      box.appendChild(p);
    }
  }
  figure.appendChild(box);
  const pager = continueBox(box);
  if (sound) sound.play('ui.open');
  let open = true;
  const close = () => {
    if (!open) return;
    open = false;
    if (opened.get(figure) === close) opened.delete(figure);
    doc.removeEventListener('click', onAny, true);
    doc.removeEventListener('keydown', onKey, true);
    if (box.parentNode) box.parentNode.removeChild(box);
    if (back && typeof back.focus === 'function') back.focus({ preventScroll: true });
    if (onClose) onClose();
  };
  /** @param {Event} event */
  const onAny = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    }
    if (pager.waiting()) pager.next();
    else close();
  };
  /** @param {KeyboardEvent} event */
  const onKey = (event) => {
    if (event.key !== 'Escape') return; // t-ok: a key's name, never shown
    event.preventDefault();
    close();
  };
  // Capture: the dismissing tap never reaches what lies under the box.
  doc.addEventListener('click', onAny, true);
  doc.addEventListener('keydown', onKey, true);
  if (typeof box.focus === 'function') box.focus({ preventScroll: true });
  // Once laid out, measure its pages (where the page can: not in Node).
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => open && pager.relayout());
  opened.set(figure, close);
  return { el: box, close, pager, tap: onAny };
}

/**
 * Close the open Look on a figure, if any.
 * @param {HTMLElement} figure
 */
export function closeLook(figure) {
  const close = opened.get(figure);
  opened.delete(figure);
  if (close) close();
}
