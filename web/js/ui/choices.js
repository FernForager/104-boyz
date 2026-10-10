// The choices (GAME_DESIGN 12.1, 12.2; BUILD_PLAN 2.5): full-width boxes,
// 52 pt tall, 8 pt apart, in the thumb zone, built by S3's renderStop
// (ui/stop.js). This module adds what the frame needs around them: the cue
// a tap plays, and the (i) square.
//
//   The cue: every choice tap plays ui.tick first, inside the click (the
//     sound unlock rule, 2.8); Walk on plays ui.next instead, two dry
//     clicks, until A2's walk-on montage (13.2). The game plays it after its
//     double-tap guard, so a dropped tap is silent.
//   The (i) square: a choice that carries `info` (S6's odds; in S5 the
//     #frame check view and the tests) becomes a div.choice-row holding the
//     choice and a button.choice-info, its own 44x44-pt square at the right
//     edge, so a slightly-off tap on the odds never commits the choice
//     (separate elements, separate handlers). Its name is trail.choice.why;
//     it shows a pixel i (an SVG, no letter). In S5 a tap on it only plays
//     ui.open: the Why sheet is S6's.

import { t } from '../text.js';
import { choiceLine } from './stop.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
/** The pixel i on the chrome font's 8x14 grid: [x, y, w, h]. */
const I_RECTS = Object.freeze([
  [2, 2, 2, 2],
  [1, 5, 3, 1],
  [2, 6, 2, 4],
  [1, 10, 4, 1],
]);

/**
 * The cue a choice's tap plays (C's ui/sound.js cue ids, BUILD_PLAN S5).
 * @param {Record<string, unknown>} act
 */
export function cueFor(act) {
  return act && act.t === 'next' ? 'ui.next' : 'ui.tick';
}

/**
 * A pixel glyph as an inline SVG: whole grid squares, crisp, in the text's
 * color, hidden from VoiceOver (its button carries the name).
 * @param {Document} doc
 * @param {number} w grid width
 * @param {number} h grid height
 * @param {readonly (readonly number[])[]} rects [x, y, w, h] on the grid
 * @param {string} cls
 */
export function pixelGlyph(doc, w, h, rects, cls) {
  const make = (/** @type {string} */ tag) => (typeof doc.createElementNS === 'function' ? doc.createElementNS(SVG_NS, tag) : doc.createElement(tag));
  const svg = make('svg');
  svg.setAttribute('class', cls);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const [x, y, rw, rh] of rects) {
    const r = make('rect');
    r.setAttribute('x', String(x));
    r.setAttribute('y', String(y));
    r.setAttribute('width', String(rw));
    r.setAttribute('height', String(rh));
    svg.appendChild(r);
  }
  return svg;
}

/**
 * After renderStop: give each drawn choice that carries `info` its (i)
 * square. The list keeps its order; a choice with info moves into a
 * div.choice-row with its square. Returns the squares.
 * @param {HTMLElement} list div.game-choices
 * @param {{choices: (import('./stop.js').Choice & {info?: unknown})[]}} screen
 * @param {HTMLButtonElement[]} buttons renderStop's, one per drawn choice
 * @param {(choice: unknown) => void} onInfo the square's tap (never the choice's)
 * @returns {HTMLButtonElement[]}
 */
export function addInfo(list, screen, buttons, onInfo) {
  const doc = list.ownerDocument;
  const drawn = screen.choices.filter((c) => choiceLine(c));
  if (!drawn.some((c) => c.info)) return [];
  /** @type {HTMLButtonElement[]} */
  const squares = [];
  const kids = Array.from(list.children);
  while (list.firstChild) list.removeChild(list.firstChild);
  kids.forEach((kid) => {
    const i = buttons.indexOf(/** @type {HTMLButtonElement} */ (kid));
    const c = i >= 0 ? drawn[i] : null;
    if (!c || !c.info) {
      list.appendChild(kid);
      return;
    }
    const row = doc.createElement('div');
    row.className = 'choice-row';
    const sq = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
    sq.classList.add('box', 'choice-info');
    sq.setAttribute('type', 'button');
    sq.setAttribute('aria-label', t('trail.choice.why'));
    sq.setAttribute('data-t-aria', 'trail.choice.why'); // the line inspector finds a spoken name by it
    sq.appendChild(pixelGlyph(doc, 8, 14, I_RECTS, 'info-glyph'));
    sq.addEventListener('click', (event) => {
      if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
      onInfo(c.info);
    });
    row.appendChild(kid);
    row.appendChild(sq);
    list.appendChild(row);
    squares.push(sq);
  });
  return squares;
}
