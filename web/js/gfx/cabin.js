// The cabin at Lake Quinault, composed (BUILD_PLAN S7; GAME_DESIGN 2.2,
// 11.4, 11.11).
//
// Home is one hand-drawn 160x320 plate (content/art/pics/home/, decision
// 70), August, shown at the lake's own hour and the date's sky. This module
// turns the plate, its stamps and the cabin's data (content/home/cabin.json,
// shipped in art/art.json as `cabin`) into ONE op list for the picture VM,
// so the draw-in replays the composed cabin exactly as it replays a drawn
// picture. The order (each layer has its own buffer, so a later layer's
// pixels hide an earlier one's wherever both draw):
//
//   1. @ sky: the sky's stamp at the origin (clear, cloudy or rain); at blue
//      hour and at night under a clear sky with no fog, the stars (the star
//      cycle, 22, one pixel each, never two touching, never in the name's
//      quiet sky, cabin.json quiet.name: S7b, Lead call 69; seeded by the
//      cabin) and the Big Dipper's seven, fixed; then the moon's stamp at
//      its phase, at at_moon.
//   2. The plate's far ops; then the weather's far stamps (cloud on the
//      peak; the high fog).
//   3. The plate's mid ops; the weather's mid stamp (the low fog) at its
//      anchor's place among them (at_fog_low, which the plate sets after
//      the forest wall and before the maples and the shed, so the fog lies
//      behind those and the trunks stay crisp). A far or mid weather stamp
//      whose anchor isn't on its layer comes after the layer's ops.
//   4. The plate's near ops; then the lights (the windows, the stove, the
//      spill, the gable, the door, the lanterns, the shed's light), the
//      embers, the smoke, the states (first launch; the mailbox's flag) and
//      the weather's near stamps (the rain, the puddles, the chains).
//   5. The plate's anchors (Z at_<name> ops) come back as anchors and are
//      dropped from the ops and the hotspots, as compose.js does.
//
// The lights burn at dusk, blue hour and night (the morning's blue hour
// too, never at dawn); the stovepipe smokes when they do, and all day under
// rain or fog; the embers glow at the evening's blue hour and at night
// (lead call 55). The lights are lamp (24), spill (28) and fire (20): they
// resolve after the hour's table, so they stay warm at night. The picture
// resolves with the hour's table, the cabin's own (cabin.json tables and
// remaps: the shared tables with the cabin's changes; dawn borrows dusk's),
// through cabinPalette: the smoke and the fog draw in two vapour slots the
// cabin never shows as themselves (night navy and alpenglow pink), which
// those tables send where smoke and fog belong at each hour.
//
// PURE: no DOM, no clock, no randomness but the engine's art stream seeded
// by the cabin (ART_SEED): the same hour, sky, moon and state give the same
// ops on every phone and in Node. The clock and the sky's draw are the UI's
// (platform/now.js).

import { LAYERS } from './picvm.js';
import { splitLayers, hotspotsOf, ANCHOR } from './compose.js';
import { draw, ART_SEED } from '../engine/rng.js';

/** The plate's size (doc 11.2: a tall plate). */
export const WIDTH = 160;
export const HEIGHT = 320;
/** The hours the cabin shows (11.4, 2.2): dawn borrows dusk's table. */
export const CABIN_HOURS = Object.freeze(['night', 'blue', 'dawn', 'day', 'dusk']);
/** The skies (BUILD_PLAN 11.2): the date's climatology picks one; fog lies over a dry morning. */
export const SKIES = Object.freeze(['clear', 'cloudy', 'rain']);
/**
 * The states the plate composes on top (2.2, 11.11), in their order: first
 * launch's (the key lockbox lit by its lantern and the guest book open), the
 * guest book alone (after a death: the lockbox never comes back once
 * opened, decision 45), the mailbox's flag.
 */
export const STATES = Object.freeze(['first', 'guestbook', 'flag_up']);
/** The stars' pseudo-color: the star cycle, a light (11.5). */
export const STAR = 22;
/** How many places a star may try before it gives up. */
export const STAR_TRIES = 64;
/** The moon's phases drawn: eighths 1 to 7 (0, the new moon, isn't). */
export const MOON_PHASES = 7;
/** No star within this many pixels of the moon's anchor, so none sits on its disc. */
export const MOON_CLEAR = 6;
/** No star within this many pixels of the Big Dipper's box, so its seven read as the Dipper alone. */
export const DIPPER_CLEAR = 2;

/** @typedef {{id: string, x: number, y: number, w: number, h: number}} Hotspot */
/** @typedef {{stamp: string, at?: string, fx?: boolean, layer?: string}} Overlay */
/**
 * @typedef {object} CabinScene what to compose
 * @property {any} art art.json: pics and stamps
 * @property {any} cabin content/home/cabin.json (art.json's cabin)
 * @property {string} [hour] 'night' | 'blue' | 'dawn' | 'day' | 'dusk'
 * @property {boolean} [evening] at blue hour: the evening's (true) or the morning's
 * @property {string} [sky] 'clear' | 'cloudy' | 'rain'
 * @property {boolean} [fog] morning fog over a dry sky
 * @property {number} [moon] the moon's phase in eighths when it's up, 0 when it isn't drawn
 * @property {string | readonly string[]} [state] 'first', 'flag_up', or both
 */
/**
 * @typedef {object} ComposedCabin
 * @property {any[][]} ops compiled picture ops for renderPic (160x320)
 * @property {number} width
 * @property {number} height
 * @property {Hotspot[]} hotspots the places' art boxes (the plate's Z ops)
 * @property {Record<string, number[]>} anchors anchor name -> [x, y]
 * @property {string} key "cabin@<hour>[.am].<sky>[.fog][.moon<n>][.<state>...]"
 * @property {string} table the palette table it resolves with
 * @property {boolean} lit the lights are on
 * @property {boolean} embers the fire bowl glows
 * @property {boolean} smoke the stovepipe smokes
 * @property {number} stars how many twinkling stars were placed (the Dipper aside)
 * @property {number} moon the phase drawn, 0 for none
 */

/**
 * @param {any} o
 * @param {string} k
 */
const own = (o, k) => o !== null && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);

/**
 * What burns and shows at an hour under a sky (lead call 55; BUILD_PLAN
 * 11.2): the lights at dusk, blue hour and night; the embers at the
 * evening's blue hour and at night; the smoke with the lights, and all day
 * under rain or fog; the stars at blue hour and night under a clear sky
 * with no fog.
 * @param {{hour?: string, evening?: boolean, sky?: string, fog?: boolean}} o
 */
export function cabinLights({ hour = 'day', evening = true, sky = 'clear', fog = false }) {
  const lit = hour === 'dusk' || hour === 'blue' || hour === 'night';
  const embers = hour === 'night' || (hour === 'blue' && evening);
  const smoke = lit || sky === 'rain' || fog;
  const stars = (hour === 'blue' || hour === 'night') && sky === 'clear' && !fog;
  return { lit, embers, smoke, stars };
}

/**
 * The boxes no star, rain or moon may enter (cabin.json quiet: S7b, Lead
 * call 69), each [x, y, w, h] in picture pixels: the name's quiet sky, the
 * band the cabin's name sits in, a character cell and a half either side
 * of its line at every phone (ui/cabin.js nameBox; lint P17 holds it), so
 * no star reads as its punctuation.
 * @param {any} cabin cabin.json (art.json's cabin)
 * @returns {number[][]}
 */
export function quietBoxes(cabin) {
  const q = cabin && own(cabin, 'quiet') ? cabin.quiet : null;
  return q && Array.isArray(q.name) ? [q.name] : [];
}

/**
 * Is (x, y) inside any of the boxes ([x, y, w, h])?
 * @param {readonly number[][]} boxes
 * @param {number} x
 * @param {number} y
 */
export const inBoxes = (boxes, x, y) => boxes.some(([bx, by, bw, bh]) => x >= bx && x < bx + bw && y >= by && y < by + bh);

/**
 * The hour's stars: [x, y] points above the floor, thinning toward it, none
 * touching another, none inside the box round the fixed ones (the
 * Dipper's, DIPPER_CLEAR pixels out), on the moon's disc or in a quiet box
 * (the name's sky): the count is the whole sky's, and a star that falls in
 * a quiet box is left out, so the sky under it keeps its own density.
 * Seeded by the cabin, so they never move between visits.
 * @param {string} hour 'blue' | 'night'
 * @param {any} stars cabin.json's stars
 * @param {number} floor the first row stars may not use
 * @param {number[] | null} moonAt the moon's anchor, kept clear
 * @param {readonly number[][]} [quiet] the quiet boxes (quietBoxes)
 * @returns {number[][]}
 */
export function cabinStarPoints(hour, stars, floor, moonAt, quiet = []) {
  const range = own(stars.count, hour) ? stars.count[hour] : null;
  if (!range || floor <= 0) return [];
  const n = range[0] + draw(ART_SEED, 'art', 'cabin', 'stars', hour, 'n').int(range[1] - range[0] + 1);
  /** @type {number[][]} */
  const fixed = stars.dipper || [];
  /** @type {number[][]} */
  const pts = [];
  const near = (/** @type {number[][]} */ list, /** @type {number} */ x, /** @type {number} */ y) => list.some(([px, py]) => Math.abs(px - x) <= 1 && Math.abs(py - y) <= 1);
  const box = fixed.length
    ? [Math.min(...fixed.map((p) => p[0])) - DIPPER_CLEAR, Math.min(...fixed.map((p) => p[1])) - DIPPER_CLEAR, Math.max(...fixed.map((p) => p[0])) + DIPPER_CLEAR, Math.max(...fixed.map((p) => p[1])) + DIPPER_CLEAR]
    : null;
  const inBox = (/** @type {number} */ x, /** @type {number} */ y) => box !== null && x >= box[0] && x <= box[2] && y >= box[1] && y <= box[3];
  for (let i = 0; i < n; i++) {
    const g = draw(ART_SEED, 'art', 'cabin', 'stars', i);
    for (let t = 0; t < STAR_TRIES; t++) {
      const x = g.int(WIDTH);
      // The nearer of two rows: more stars high in the sky, fewer toward the glow.
      const y = Math.min(g.int(floor), g.int(floor));
      if (near(pts, x, y) || inBox(x, y)) continue;
      if (moonAt && Math.abs(moonAt[0] - x) <= MOON_CLEAR && Math.abs(moonAt[1] - y) <= MOON_CLEAR) continue;
      pts.push([x, y]);
      break;
    }
  }
  // A star in a quiet box is left out, not drawn again elsewhere: the sky
  // under the name keeps the density it had (redrawn, it doubled: the art
  // critic's S7b pass).
  return quiet.length ? pts.filter(([x, y]) => !inBoxes(quiet, x, y)) : pts;
}

/**
 * The palette the cabin resolves with: the shared one with the cabin's own
 * tables added under their names (cabin.json remaps), so the composed
 * cabin's table (cabin_day, cabin_dusk, ...) resolves, and a picture
 * resolved without them fails loudly (an unknown remap) rather than in the
 * wrong colors.
 * @template {{remaps: Readonly<Record<string, readonly number[]>>}} P
 * @param {P} pal makePalette()
 * @param {any} cabin cabin.json (art.json's cabin)
 * @returns {P}
 */
export function cabinPalette(pal, cabin) {
  /** @type {Record<string, readonly number[]>} */
  const remaps = { ...pal.remaps };
  for (const [name, map] of Object.entries(cabin.remaps || {})) {
    if (!Array.isArray(map)) continue;
    if (own(pal.remaps, name)) throw new Error(`cabin: its table "${name}" would hide a shared one`);
    remaps[name] = map;
  }
  return { ...pal, remaps };
}

/**
 * The anchors a plate declares (Z at_<name> ops), name -> [x, y].
 * @param {any[][]} ops
 * @returns {Record<string, number[]>}
 */
export function plateAnchors(ops) {
  /** @type {Record<string, number[]>} */
  const at = {};
  for (const op of ops) if (op[0] === 'Z' && String(op[1]).startsWith(ANCHOR)) at[String(op[1]).slice(ANCHOR.length)] = [op[2], op[3]];
  return at;
}

/**
 * An overlay's T op: its stamp at its anchor (or the origin).
 * @param {Overlay} o
 * @param {Record<string, number[]>} at
 * @returns {any[]}
 */
function place(o, at) {
  if (o.at !== undefined && !own(at, o.at)) throw new Error(`cabin: the plate has no anchor at_${o.at} for ${o.stamp}`);
  const [x, y] = o.at === undefined ? [0, 0] : at[o.at];
  return ['T', o.stamp, x, y, o.fx ? 1 : 0];
}

/**
 * The scene's states, in STATES order.
 * @param {string | readonly string[] | undefined} state
 * @returns {string[]}
 */
function statesOf(state) {
  const list = state === undefined || state === null ? [] : typeof state === 'string' ? [state] : [...state];
  for (const s of list) if (!STATES.includes(s)) throw new Error(`cabin: no state "${s}"`);
  return STATES.filter((s) => list.includes(s));
}

/**
 * Compose the cabin.
 * @param {CabinScene} scene
 * @returns {ComposedCabin}
 */
export function composeCabin({ art, cabin, hour = 'day', evening = true, sky = 'clear', fog = false, moon = 0, state }) {
  if (!CABIN_HOURS.includes(hour)) throw new Error(`cabin: no hour "${hour}"`);
  if (!SKIES.includes(sky)) throw new Error(`cabin: no sky "${sky}"`);
  if (!Number.isInteger(moon) || moon < 0 || moon > MOON_PHASES) throw new Error(`cabin: no moon phase "${moon}"`);
  const plate = art && art.pics && own(art.pics, cabin.plate) ? art.pics[cabin.plate] : null;
  if (!plate) throw new Error(`cabin: no plate "${cabin.plate}"`);
  const states = statesOf(state);
  const morning = hour === 'dawn' || (hour === 'blue' && !evening);
  const on = cabinLights({ hour, evening: !morning, sky, fog });
  const at = plateAnchors(plate.ops);
  const isAnchor = (/** @type {any[]} */ op) => op[0] === 'Z' && String(op[1]).startsWith(ANCHOR);
  const layers = splitLayers(plate.ops);
  const weather = [...(cabin.weather[sky] || []), ...(fog ? cabin.weather.fog : [])];
  /** @type {any[][]} */
  const ops = [];
  // 1. The sky, its stars and the moon.
  ops.push(['@', 'sky'], ['T', cabin.skies[sky], 0, 0, 0]);
  let stars = 0;
  let drawnMoon = 0;
  if (on.stars) {
    const moonAt = moon > 0 && own(at, cabin.moon.at) ? at[cabin.moon.at] : null;
    const pts = cabinStarPoints(hour, cabin.stars, own(at, cabin.stars.floor) ? at[cabin.stars.floor][1] : 0, moonAt, quietBoxes(cabin));
    stars = pts.length;
    ops.push(['C', STAR]);
    for (const [x, y] of [...pts, ...cabin.stars.dipper]) ops.push(['L', [x, y]]);
    if (moon > 0) {
      ops.push(place({ stamp: `${cabin.moon.stamp}${moon}`, at: cabin.moon.at }, at));
      drawnMoon = moon;
    }
  }
  // 2-4. The plate's far, mid and near ops, each followed by its overlays.
  LAYERS.forEach((layer, k) => {
    if (layer === 'sky') {
      if (layers[k].some((/** @type {any[]} */ op) => !isAnchor(op))) throw new Error('cabin: the plate draws no sky (the sky is a stamp)');
      return;
    }
    ops.push(['@', layer]);
    // A far or mid weather stamp goes where its anchor sits among the
    // layer's ops, else after them.
    const mine = layer === 'near' ? [] : weather.filter((w) => w.layer === layer);
    const here = new Set(layers[k].filter(isAnchor).map((op) => String(op[1]).slice(ANCHOR.length)));
    for (const op of layers[k]) {
      if (!isAnchor(op)) ops.push(op);
      else for (const w of mine) if (w.at === String(op[1]).slice(ANCHOR.length)) ops.push(place(w, at));
    }
    for (const w of mine) if (w.at === undefined || !here.has(w.at)) ops.push(place(w, at));
    if (layer !== 'near') return;
    if (on.lit) for (const o of cabin.lights) ops.push(place(o, at));
    if (on.embers) for (const o of cabin.embers) ops.push(place(o, at));
    if (on.smoke) for (const o of cabin.smoke) ops.push(place(o, at));
    for (const s of states) for (const o of own(cabin.states, s) ? cabin.states[s] : []) ops.push(place(o, at));
    for (const w of weather) if (w.layer === 'near') ops.push(place(w, at));
  });
  const key = `cabin@${hour}${hour === 'blue' && morning ? '.am' : ''}.${sky}${fog ? '.fog' : ''}${drawnMoon ? `.moon${drawnMoon}` : ''}${states.map((s) => `.${s}`).join('')}`;
  return {
    ops,
    width: WIDTH,
    height: HEIGHT,
    hotspots: hotspotsOf(ops, art.stamps || {}),
    anchors: at,
    key,
    table: cabin.tables[hour],
    lit: on.lit,
    embers: on.embers,
    smoke: on.smoke,
    stars,
    moon: drawnMoon,
  };
}

/**
 * The ids of the cabin's alt parts, in order (GAME_DESIGN 11.9; gfx/alt.js
 * for a trail place): the scene; the sky's (or the fog's); the lights when
 * they're on; the moon when it's drawn; the hour's (none by day; at blue
 * hour and at night, the starry line under a clear sky, the clouded one
 * otherwise). Each is a whole sentence, so the join never makes grammar.
 * @param {{hour?: string, sky?: string, fog?: boolean, moonShown?: boolean}} o
 * @returns {string[]}
 */
export function cabinAlt({ hour = 'day', sky = 'clear', fog = false, moonShown = false }) {
  if (!CABIN_HOURS.includes(hour)) throw new Error(`cabin: no hour "${hour}"`);
  if (!SKIES.includes(sky)) throw new Error(`cabin: no sky "${sky}"`);
  const out = ['alt.scene.cabin'];
  if (fog) out.push('alt.sky.fog');
  else if (sky !== 'clear') out.push(`alt.sky.${sky}`);
  if (cabinLights({ hour, sky, fog }).lit) out.push('alt.cabin.lit');
  if (moonShown) out.push('alt.cabin.moon');
  const clear = sky === 'clear' && !fog;
  if (hour === 'dawn' || hour === 'dusk') out.push(`alt.hour.${hour}`);
  else if (hour === 'blue' || hour === 'night') out.push(`alt.hour.${hour}${clear ? '' : '_clouded'}`);
  return out;
}
