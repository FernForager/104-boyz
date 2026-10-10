// An outcome (GAME_DESIGN 12.13; BUILD_PLAN S6): under the box, the
// severity's ornament and the pencil rows, above Walk on (or a death box's
// one button, Next).
//
//   The ornament: a small snow tile with a pixel glyph, each with its
//   spoken name: a moss fern for good, a bark twig for a mishap, a brick
//   diamond in a brick border for serious or trip-ending. The gold star is
//   the Bonfire Lily's alone (P07), so no ornament here is gold.
//   The pencil rows (12.13's "pencil strip"; in code `pencil`, since S5's
//   profile is ui/strip.js): each a pencil glyph and a line, as a list:
//   where you got to and when (Heart Lake at 4:26 pm), and the time a band
//   cost (Time +20 min). S8 and S12 add the meters and the items.

import { t, tx } from '../text.js';
import { clock, minutes } from '../fmt.js';
import { pixelGlyph, DIAMOND_RECTS } from './choices.js';

/** The fern, on an 8x8 grid: a stem and its fronds. */
export const FERN_RECTS = Object.freeze([
  [3, 0, 1, 8],
  [1, 1, 2, 1],
  [4, 1, 2, 1],
  [0, 3, 3, 1],
  [4, 3, 3, 1],
  [1, 5, 2, 1],
  [4, 5, 2, 1],
]);
/** The twig, on an 8x8 grid: a bent stick with a side shoot. */
export const TWIG_RECTS = Object.freeze([
  [0, 6, 2, 1],
  [2, 5, 2, 1],
  [4, 4, 2, 1],
  [6, 3, 2, 1],
  [3, 2, 1, 3],
  [2, 1, 1, 1],
]);
/** The pencil (the doc's ✎), on an 8x8 grid: a diagonal shaft and its point. */
export const PENCIL_RECTS = Object.freeze([
  [6, 0, 2, 1],
  [5, 1, 3, 1],
  [4, 2, 3, 1],
  [3, 3, 3, 1],
  [2, 4, 3, 1],
  [1, 5, 3, 1],
  [1, 6, 2, 1],
  [0, 7, 1, 1],
]);
/** Each severity's ornament: its glyph, its grid and its spoken name. */
export const ORNAMENTS = Object.freeze({
  good: { glyph: FERN_RECTS, w: 8, h: 8, name: 'trail.outcome.good' },
  mishap: { glyph: TWIG_RECTS, w: 8, h: 8, name: 'trail.outcome.mishap' },
  serious: { glyph: DIAMOND_RECTS, w: 7, h: 7, name: 'trail.outcome.serious' },
  death: { glyph: DIAMOND_RECTS, w: 7, h: 7, name: 'trail.outcome.serious' },
});

/**
 * @typedef {{arrive?: import('./stop.js').Ref, at_s?: number, add_s?: number}} PencilRow
 */

/**
 * The outcome's notes: div.outcome-notes > span.ornament + ul.pencil.
 * @param {Document} doc
 * @param {{outcome: string, pencil?: PencilRow[]}} screen
 * @returns {HTMLElement}
 */
export function renderOutcome(doc, screen) {
  const notes = doc.createElement('div');
  notes.className = 'outcome-notes';
  notes.setAttribute('data-sev', screen.outcome);
  const o = /** @type {Record<string, {glyph: readonly (readonly number[])[], w: number, h: number, name: string}>} */ (ORNAMENTS)[screen.outcome];
  if (o) {
    const orn = doc.createElement('span');
    orn.classList.add('box', 'ornament');
    orn.setAttribute('role', 'img');
    orn.setAttribute('aria-label', t(o.name)); // t-ids: trail.outcome.good, trail.outcome.mishap, trail.outcome.serious
    orn.setAttribute('data-t-aria', o.name); // the line inspector finds a spoken name by it
    orn.appendChild(pixelGlyph(doc, o.w, o.h, o.glyph, 'ornament-glyph'));
    notes.appendChild(orn);
  }
  const list = doc.createElement('ul');
  list.className = 'pencil';
  for (const r of screen.pencil || []) {
    const li = doc.createElement('li');
    li.className = 'pencil-row';
    li.appendChild(pixelGlyph(doc, 8, 8, PENCIL_RECTS, 'pencil-glyph'));
    const words = doc.createElement('span');
    if (r.arrive && typeof r.at_s === 'number') tx(words, 'trail.pencil.arrive', { place: r.arrive, time: clock(r.at_s) });
    else if (typeof r.add_s === 'number') tx(words, 'trail.pencil.time', { delta: minutes(r.add_s) });
    li.appendChild(words);
    list.appendChild(li);
  }
  if (list.children.length) notes.appendChild(list);
  return notes;
}
