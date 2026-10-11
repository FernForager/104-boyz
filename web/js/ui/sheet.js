// The Why sheet (GAME_DESIGN 12.11, 8.5, 8.8; BUILD_PLAN S6): the bottom
// sheet behind a rolled choice's (i), or a long press on the choice (12.1's
// accelerator). Every number in it is the engine's (trailhead.js's why:
// the rows from the shared tables, the bands, the fatal arithmetic, the
// router's arrival), worded here by line and format; no word is in code.
//
//   Why these odds
//   Stay high
//   Open crest, thunderstorm .......... 40
//   ----------------------------------------
//   Clean ............................. 40
//   You make it ...................... 65%
//   [moss | pink | brick, the fatal sliver in ink]
//   clean 40 · shaky 25 · fail 35
//   If it goes badly: lightning hits close, ...
//   Fatal: 35 x 100% x 2% = 0.70%, shown 0.7%
//   Heart Lake about 4:26 pm, 3.4 mi
//   On the open crest until about 4:11 pm
//   [ Close ]
//
// It is a dialog (aria-modal), named by its title, which takes focus;
// Close, Escape or a tap on the scrim closes it, and focus goes back to
// what opened it. It slides up, except under Reduce Motion (frame.css),
// and is never a scroll at 375 pt (lint T02e, track C). The leader dots are
// CSS; the bar is a pixel SVG with 1-pixel ink rules between its bands, so
// color is never the only thing that tells them apart (11.9), and the
// words under it say the same.

import { tx, bindNumbers } from '../text.js';
import { pct, partPct, permillePct, exactPct, share, clock, miles, rowValue } from '../fmt.js';
import { pixelGlyph } from './glyph.js';

const TITLE_ID = 'why-title';
/** The bar's units: its width in points of the roll, and its height. */
export const BAR_W = 100;
export const BAR_H = 6;

/**
 * @typedef {import('./stop.js').Ref} Ref
 * @typedef {object} Why a choice's Why sheet data (engine trailhead.js)
 * @property {{label: Ref | null, value: number}[]} rows
 * @property {number} p
 * @property {{clean: number, shaky: number, fail: number}} bands
 * @property {number} made
 * @property {Ref | null} badly
 * @property {{fail: number, band: {num: number, den: number}, death: number | null, exact: {num: number, den: number}, shown: {tenths: number} | {under: true} | null} | null} fatalCalc
 * @property {{place: Ref, eta_s: number, mi10: number, exposedUntil_s?: number} | null} route
 */

/**
 * The bar's pieces, in points along it: the bands and the ink rules
 * between them, and the fatal sliver at the far end of the fail band.
 * Pure, so Node checks it.
 * @param {Why['bands']} bands
 * @param {Why['fatalCalc']} fatal
 * @returns {{cls: string, x: number, w: number}[]}
 */
export function barPieces(bands, fatal) {
  /** @type {{cls: string, x: number, w: number}[]} */
  const out = [];
  let x = 0;
  for (const [cls, w] of /** @type {[string, number][]} */ ([
    ['bar-clean', bands.clean],
    ['bar-shaky', bands.shaky],
    ['bar-fail', bands.fail],
  ])) {
    if (w <= 0) continue;
    if (x > 0) out.push({ cls: 'bar-rule', x: x - 0.5, w: 1 });
    out.push({ cls, x, w });
    x += w;
  }
  if (fatal && fatal.exact.num > 0) {
    // The sliver: the fatal share of the whole, at least a rule's width, never more than the fail band.
    const w = Math.min(bands.fail, Math.max(1, fatal.exact.num / fatal.exact.den));
    out.push({ cls: 'bar-fatal', x: BAR_W - w, w });
  }
  return out;
}

/**
 * The bar, as a pixel SVG (aria-hidden: the legend says it in words).
 * @param {Document} doc
 * @param {Why['bands']} bands
 * @param {Why['fatalCalc']} fatal
 */
function bar(doc, bands, fatal) {
  const pieces = barPieces(bands, fatal);
  const svg = pixelGlyph(doc, BAR_W, BAR_H, [], 'why-bar');
  svg.setAttribute('preserveAspectRatio', 'none');
  const make = (/** @type {string} */ tag) => (typeof doc.createElementNS === 'function' ? doc.createElementNS('http://www.w3.org/2000/svg', tag) : doc.createElement(tag));
  for (const p of pieces) {
    const r = make('rect');
    r.setAttribute('class', p.cls);
    r.setAttribute('x', String(p.x));
    r.setAttribute('y', '0');
    r.setAttribute('width', String(p.w));
    r.setAttribute('height', String(BAR_H));
    svg.appendChild(r);
  }
  return svg;
}

/**
 * One leader-dotted row: its words, the dots (CSS), its value.
 * @param {Document} doc
 * @param {(el: HTMLElement) => void} words fills the row's words
 * @param {(el: HTMLElement) => void} value fills its value
 */
function row(doc, words, value) {
  const p = doc.createElement('p');
  p.className = 'why-row';
  const k = doc.createElement('span');
  k.className = 'why-k';
  words(k);
  const dots = doc.createElement('span');
  dots.className = 'why-dots';
  dots.setAttribute('aria-hidden', 'true');
  const v = doc.createElement('span');
  v.className = 'why-v';
  value(v);
  p.appendChild(k);
  p.appendChild(dots);
  p.appendChild(v);
  return p;
}

/**
 * Open a choice's Why sheet. Returns {el, close}.
 * @param {Document} doc
 * @param {{label: Ref | null, why: Why, opener?: HTMLElement | null, onClose?: () => void}} o
 */
export function openWhy(doc, { label, why, opener = null, onClose }) {
  closeWhy(doc);
  const scrim = doc.createElement('div');
  scrim.classList.add('scrim', 'why-scrim');
  const sheet = doc.createElement('div');
  sheet.classList.add('sheet', 'box', 'why');
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-labelledby', TITLE_ID);
  const title = doc.createElement('h2');
  title.className = 'why-title';
  title.id = TITLE_ID;
  title.setAttribute('tabindex', '-1');
  tx(title, 'trail.why.title');
  sheet.appendChild(title);
  if (label) {
    const name = doc.createElement('p');
    name.className = 'why-choice';
    tx(name, label.id, label.vars); // t-ids: @content
    sheet.appendChild(name);
  }
  // The base and each modifier: the shared tables' rows (8.5).
  why.rows.forEach((r, i) => {
    sheet.appendChild(
      row(
        doc,
        (el) => {
          if (r.label) tx(el, r.label.id, r.label.vars); // t-ids: @content
        },
        (el) => {
          el.textContent = rowValue(r.value, i > 0); // a number, shown as data
        },
      ),
    );
  });
  const rule = doc.createElement('hr');
  rule.className = 'why-rule';
  sheet.appendChild(rule);
  sheet.appendChild(
    row(
      doc,
      (el) => tx(el, 'trail.why.clean'),
      (el) => {
        el.textContent = rowValue(why.p, false); // a number, shown as data
      },
    ),
  );
  const made = pct(why.made);
  sheet.appendChild(
    row(
      doc,
      (el) => tx(el, 'trail.why.made'),
      (el) => tx(el, made.id, made.vars), // t-ids: fmt.pct
    ),
  );
  sheet.appendChild(bar(doc, why.bands, why.fatalCalc));
  const legend = doc.createElement('p');
  legend.className = 'why-legend';
  tx(legend, 'trail.why.bands', { clean: why.bands.clean, shaky: why.bands.shaky, fail: why.bands.fail });
  // Each band's word keeps its number on its row (T02e measures it so).
  for (const n of Array.from(legend.childNodes)) if (n.nodeType === 3) /** @type {Text} */ (n).data = bindNumbers(/** @type {Text} */ (n).data);
  sheet.appendChild(legend);
  if (why.badly) {
    const badly = doc.createElement('p');
    badly.className = 'why-badly';
    tx(badly, why.badly.id, why.badly.vars); // t-ids: @content
    sheet.appendChild(badly);
  }
  const f = why.fatalCalc;
  if (f && f.death !== null && f.shown) {
    const fatal = doc.createElement('p');
    fatal.className = 'why-fatal';
    tx(fatal, 'trail.why.fatal', { fail: f.fail, band: partPct(f.band), death: permillePct(f.death), exact: exactPct(f.exact), fatal: share(f.shown) });
    sheet.appendChild(fatal);
  }
  if (why.route) {
    const r = why.route;
    const way = doc.createElement('p');
    way.className = 'why-route';
    tx(way, 'trail.why.route', { place: r.place, time: clock(r.eta_s), dist: miles(r.mi10) });
    sheet.appendChild(way);
    if (typeof r.exposedUntil_s === 'number') {
      const crest = doc.createElement('p');
      crest.className = 'why-route';
      tx(crest, 'trail.why.exposed', { time: clock(r.exposedUntil_s) });
      sheet.appendChild(crest);
    }
  }
  const close = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
  close.classList.add('box', 'choice', 'why-close');
  close.setAttribute('type', 'button');
  const closeLabel = doc.createElement('span');
  closeLabel.className = 'choice-label';
  tx(closeLabel, 'trail.why.close');
  close.appendChild(closeLabel);
  sheet.appendChild(close);
  scrim.appendChild(sheet);
  doc.body.appendChild(scrim);

  let open = true;
  const shut = () => {
    if (!open) return;
    open = false;
    if (current && current.close === shut) current = null;
    doc.removeEventListener('keydown', onKey, true);
    if (scrim.parentNode) scrim.parentNode.removeChild(scrim);
    if (opener && typeof opener.focus === 'function') opener.focus();
    if (onClose) onClose();
  };
  /** @param {KeyboardEvent} event */
  function onKey(event) {
    if (event.key === 'Escape') shut(); // t-ok: a key's name, never shown
  }
  close.addEventListener('click', shut);
  scrim.addEventListener('click', (/** @type {Event} */ event) => {
    if (event.target === scrim) shut();
  });
  doc.addEventListener('keydown', onKey, true);
  current = { doc, close: shut };
  if (typeof title.focus === 'function') title.focus({ preventScroll: true });
  return { el: sheet, close: shut };
}

/** @type {{doc: Document, close: () => void} | null} the sheet open now */
let current = null;

/**
 * Close the Why sheet, if one is open (a new screen, or the frame let go).
 * @param {Document} doc
 */
export function closeWhy(doc) {
  if (current && current.doc === doc) {
    const c = current;
    current = null;
    c.close();
  }
}
