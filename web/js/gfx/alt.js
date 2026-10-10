// A picture's alt text, composed from its parts by id (GAME_DESIGN 11.9,
// 18.3; BUILD_PLAN 2.4, S6). VoiceOver reads a picture through one element
// with role="img" (ui/frame.js); its words are the lines of the parts the
// composer drew it from, in this order:
//
//   1. the scene's line, alt.scene.<scene>, or the base's, alt.base.<base>
//      (the base the composer draws: a stand-in's for a place whose own
//      base or scene isn't drawn yet)
//   2. each skyline it stands, alt.skyline.<skyline>
//   3. each sprite at its anchor, alt.sprite.<kind> (the hiker)
//   4. the hour's, alt.hour.<hour> (day adds none)
//
// Each part is a whole sentence, so joining them never makes grammar, and
// every drawable place, 28 today and 500 or more later (decision 69), has
// alt text with no line of its own: a new base, scene, skyline or sprite
// brings one line, and every place drawn from it is described. Lint P15
// fails a drawable place whose parts lack their lines. The same words are
// the picture's Look when a tap hits no hotspot (ui/look.js).
//
// PURE: no DOM, no clock, no randomness; Node checks it.

import { resolvePlace, TRAIL_SPRITES, ANCHOR, HOURS } from './compose.js';

/** The area of the lines. */
export const ALT = 'alt';

/**
 * @param {any} o
 * @param {string} k
 */
const own = (o, k) => o !== null && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);

/**
 * The ids of a place's alt parts at an hour, in order.
 * @param {string} pic a place (a key of recipes.places)
 * @param {any} art art.json: pics and recipes
 * @param {{hour?: string, sprites?: readonly (readonly string[])[]}} [o]
 *   sprites: as compose() takes them ([kind, pose, anchor, face?] each);
 *   one at an anchor the picture lacks isn't drawn, so isn't described
 * @returns {string[]} empty when the composer can't draw the place
 */
export function altParts(pic, art, { hour = 'day', sprites = TRAIL_SPRITES } = {}) {
  if (!HOURS.includes(hour)) throw new Error(`alt: no hour "${hour}"`);
  const r = resolvePlace(pic, art);
  if (!r) return [];
  /** @type {string[]} */
  const out = [];
  if (r.scene) out.push(`${ALT}.scene.${r.scene}`);
  else {
    out.push(`${ALT}.base.${/** @type {{id: string}} */ (r.base).id}`);
    const skylines = art.recipes.skylines || {};
    for (const id of r.recipe.far || []) if (own(skylines, id)) out.push(`${ALT}.skyline.${id}`);
  }
  const anchors = new Set(r.ops.filter((op) => op[0] === 'Z' && String(op[1]).startsWith(ANCHOR)).map((op) => String(op[1]).slice(ANCHOR.length)));
  for (const s of sprites) {
    const id = `${ALT}.sprite.${s[0]}`;
    if (anchors.has(s[2]) && !out.includes(id)) out.push(id);
  }
  if (hour !== 'day') out.push(`${ALT}.hour.${hour}`);
  return out;
}

/**
 * A place's alt text at an hour, as line refs ({id}), in order.
 * @param {string} pic
 * @param {any} art
 * @param {{hour?: string, sprites?: readonly (readonly string[])[]}} [o]
 * @returns {{id: string}[]}
 */
export function altFor(pic, art, o = {}) {
  return altParts(pic, art, o).map((id) => ({ id }));
}
