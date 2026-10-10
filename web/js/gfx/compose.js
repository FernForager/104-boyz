// The scene composer v0 (BUILD_PLAN 4.4, 4.5, S5; GAME_DESIGN 11.7).
//
// A place's picture is assembled from data: a biome base (or a hand-drawn
// scene), its skylines, seeded props, fixed stamps, sprites at the base's
// anchors and the hour's stars, into ONE op list for the picture VM, so the
// draw-in replays a composed place exactly as it replays a drawn one. The
// recipes are content/art/recipes.json, shipped in art/art.json as
// `recipes` on a channel with the trail screen.
//
// PURE: no DOM, no clock, no randomness but the engine's art stream, seeded
// by the place's id (ART_SEED): the same place, hour and sprites give the
// same ops on every phone and in Node, and Elk Lake never looks like Lunch
// Lake. It imports only picvm.js (the layers) and engine/rng.js (draw).
//
// The layering rules (why the picture VM needs no change). Each layer has
// its own buffer, and a later fill floods only same-valued pixels, so a
// base's fill drawn after a stamp on its layer would let the stamp show
// through. So:
//   1. A base draws the sky, mid and near layers, each once and in that
//      order, and never the far layer: the far layer is the skylines'.
//   2. Within a layer the base's own ops come first; stamps follow, back to
//      front (a stamp lands its opaque pixels over what is there).
//   3. A skyline is a closed far-layer stamp anchored at its left end on
//      the horizon line (the base's far_y plus the place's horizon) that
//      reaches at least 8 rows below the base's highest mid-layer row, so a
//      horizon shift of up to 6 never opens a gap.
//   4. Clouds go on the far layer behind the skylines, never on the sky
//      layer, so a star never lands on a cloud.
//   5. Sprites go last on the near layer.
//   6. Anchors are 1x1 hotspots named at_<anchor> (Z at_trail_spot 36,150,1,1)
//      in bases and scenes: compose() returns them as anchors and drops them
//      from the ops and the hotspots, so Look never sees them.
// Then the hour's overlay: at blue hour and at night, stars (the cycling
// light 22, one pixel each, never two touching) on the sky layer above the
// at_star_floor row, emitted last, so the far, mid and near layers hide
// any that fall behind them. Last, a flipped place mirrors the whole list.

import { LAYERS, MAX_STAMP_DEPTH } from './picvm.js';
import { draw, ART_SEED } from '../engine/rng.js';

/** The hours a place can show (GAME_DESIGN 11.4): each a palette table. */
export const HOURS = Object.freeze(['day', 'dusk', 'blue', 'night']);
/** A composed picture's size: AGI's 160x168 (11.2). */
export const WIDTH = 160;
export const HEIGHT = 168;
/** The stars' pseudo-color: the star cycle, a light (11.5). */
export const STAR = 22;
/** Stars by hour, [fewest, most] (none by day or at dusk). */
export const STAR_COUNTS = Object.freeze({ blue: Object.freeze([6, 9]), night: Object.freeze([36, 44]) });
/** A seeded horizon shift is an integer in [-HORIZON, HORIZON]. */
export const HORIZON = 6;
/** How many places a prop or a star may try before it gives up. */
export const PROP_TRIES = 8;
export const STAR_TRIES = 64;
/** The sprites the trail frame composes every place with: the hiker, idle, at the trail spot (ui/frame.js). */
export const TRAIL_SPRITES = Object.freeze([Object.freeze(['hiker', 'idle', 'trail_spot'])]);
/** An anchor hotspot's prefix. */
export const ANCHOR = 'at_';
/** The anchors every base and every scene declares (4.1.3, 4.2.3). */
export const REQUIRED_ANCHORS = Object.freeze({
  bases: Object.freeze(['trail_spot', 'far_bank', 'campsite', 'sky', 'star_floor']),
  scenes: Object.freeze(['trail_spot', 'star_floor']),
});

/** @typedef {{id: string, x: number, y: number, w: number, h: number}} Hotspot */
/**
 * @typedef {object} Composed
 * @property {any[][]} ops compiled picture ops for renderPic (160x168)
 * @property {number} width
 * @property {number} height
 * @property {Hotspot[]} hotspots Look targets (no anchors): the
 *   picture's own, and its stamps' (hotspotsOf)
 * @property {Record<string, number[]>} anchors anchor name -> [x, y]
 * @property {string} key "<place>@<hour>"
 * @property {string} place
 * @property {boolean} flip
 * @property {number} horizon
 * @property {number} stars how many were placed
 * @property {string} from the scene or base the place was drawn from
 */

/**
 * @param {any} o
 * @param {string} k
 */
const own = (o, k) => o !== null && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);

/**
 * A drawn base by id, following stand-ins (a few deep at most).
 * @param {any} recipes
 * @param {any} art
 * @param {string} id
 * @returns {{id: string, base: any, ops: any[][]} | null}
 */
function drawnBase(recipes, art, id) {
  let at = id;
  for (let depth = 0; depth < 4; depth++) {
    const b = own(recipes.bases, at) ? recipes.bases[at] : null;
    if (!b) return null;
    if (b.drawn) {
      const pic = art.pics && own(art.pics, b.pic) ? art.pics[b.pic] : null;
      return pic ? { id: at, base: b, ops: pic.ops } : null;
    }
    if (typeof b.stand_in !== 'string') return null;
    at = b.stand_in;
  }
  return null;
}

/**
 * What a place is drawn from: its scene, when drawn; else its base (or a
 * stand-in) when drawn; else null.
 * @param {string} pic a place id (a key of recipes.places)
 * @param {any} art art.json (with recipes)
 * @returns {{place: string, recipe: any, scene: string | null, base: {id: string, base: any, ops: any[][]} | null, ops: any[][]} | null}
 */
export function resolvePlace(pic, art) {
  const recipes = art && art.recipes;
  if (!recipes || !own(recipes.places, pic)) return null;
  const recipe = recipes.places[pic];
  if (typeof recipe.scene === 'string' && art.pics && own(art.pics, recipe.scene)) {
    return { place: pic, recipe, scene: recipe.scene, base: null, ops: art.pics[recipe.scene].ops };
  }
  const baseId = typeof recipe.scene === 'string' ? recipe.stand_in : recipe.base;
  if (typeof baseId !== 'string') return null;
  const base = drawnBase(recipes, art, baseId);
  return base ? { place: pic, recipe, scene: null, base, ops: base.ops } : null;
}

/**
 * Can the composer draw this place now? False when neither its scene nor
 * its base (nor a stand-in) is drawn, or there are no recipes.
 * @param {string} pic
 * @param {any} art
 */
export function drawable(pic, art) {
  return resolvePlace(pic, art) !== null;
}

/**
 * A base's ops by layer, in LAYERS order (ops before any @ draw on the sky).
 * @param {any[][]} ops
 * @returns {any[][][]}
 */
export function splitLayers(ops) {
  /** @type {any[][][]} */
  const out = LAYERS.map(() => []);
  let at = 0;
  for (const op of ops) {
    if (op[0] === '@') at = LAYERS.indexOf(op[1]);
    else out[at].push(op);
  }
  return out;
}

/**
 * A slot's props: n stamps, seeded by the place and the slot, sorted back
 * to front, as T ops.
 * @param {string} place
 * @param {any} slot
 * @param {any} override the place's change to the slot, if any
 * @returns {any[][]}
 */
export function propOps(place, slot, override) {
  const count = override && Array.isArray(override.count) ? override.count : slot.count;
  const stamps = override && Array.isArray(override.stamps) ? override.stamps : slot.stamps;
  const lo = count[0];
  const hi = Math.max(count[0], count[1]);
  const n = hi > lo ? lo + draw(ART_SEED, 'art', place, slot.id, 'n').int(hi - lo + 1) : lo;
  const [bx, by, bw, bh] = slot.box;
  const spacing = slot.spacing || 0;
  /** @type {{x: number, y: number, s: string, i: number}[]} */
  const placed = [];
  for (let i = 0; i < n; i++) {
    const g = draw(ART_SEED, 'art', place, slot.id, i);
    for (let t = 0; t < PROP_TRIES; t++) {
      const x = bx + g.int(Math.max(1, bw));
      const y = by + g.int(Math.max(1, bh));
      const s = stamps[g.int(stamps.length)];
      if (placed.some((p) => Math.abs(p.x - x) < spacing)) continue;
      placed.push({ x, y, s, i });
      break;
    }
  }
  placed.sort((a, b) => a.y - b.y || a.i - b.i);
  return placed.map((p) => ['T', p.s, p.x, p.y, 0]);
}

/**
 * Mirror a whole op list left to right: every absolute x becomes
 * (WIDTH - 1) - x, a stamp toggles its flip, a hotspot keeps its box.
 * @param {any[][]} ops
 * @returns {any[][]}
 */
export function mirror(ops) {
  return ops.map((op) => {
    switch (op[0]) {
      case 'L':
      case 'F':
      case 'S': {
        const p = op[1].slice();
        for (let k = 0; k < p.length; k += 2) p[k] = WIDTH - 1 - p[k];
        return [op[0], p];
      }
      case 'T':
        return ['T', op[1], WIDTH - 1 - op[2], op[3], op[4] ? 0 : 1];
      case 'Z':
        return ['Z', op[1], WIDTH - op[2] - op[4], op[3], op[4], op[5]];
      default:
        return op;
    }
  });
}

/**
 * The hour's stars: [x, y] points above the floor, none touching another.
 * @param {string} place
 * @param {string} hour
 * @param {number} floor the first row stars may not use
 * @returns {number[][]}
 */
export function starPoints(place, hour, floor) {
  const range = own(STAR_COUNTS, hour) ? /** @type {Record<string, readonly number[]>} */ (STAR_COUNTS)[hour] : null;
  if (!range || floor <= 0) return [];
  const n = range[0] + draw(ART_SEED, 'art', place, 'stars', hour, 'n').int(range[1] - range[0] + 1);
  /** @type {number[][]} */
  const pts = [];
  for (let i = 0; i < n; i++) {
    const g = draw(ART_SEED, 'art', place, 'stars', i);
    for (let t = 0; t < STAR_TRIES; t++) {
      const x = g.int(WIDTH);
      const y = g.int(floor);
      if (pts.some(([px, py]) => Math.abs(px - x) <= 1 && Math.abs(py - y) <= 1)) continue;
      pts.push([x, y]);
      break;
    }
  }
  return pts;
}

/**
 * Every Look hotspot an op list holds, in op order: its own Z ops, and the
 * Z ops inside the stamps it places (S6: a stamp carries its own hotspot,
 * in its own coordinates, as the privy, the skylines and the hiker do),
 * offset to where the stamp stands and mirrored with it, nested stamps
 * too, as the picture VM records them (picvm.js renderPic's hotspots).
 * Anchors (at_*) are no hotspots.
 * @param {any[][]} ops
 * @param {Record<string, any[][]>} stamps
 * @returns {Hotspot[]}
 */
export function hotspotsOf(ops, stamps) {
  /** @type {Hotspot[]} */
  const out = [];
  /**
   * @param {any[][]} list
   * @param {number} ox
   * @param {number} oy
   * @param {number} fx 1, or -1 when mirrored
   * @param {number} depth
   */
  const walk = (list, ox, oy, fx, depth) => {
    for (const op of list) {
      if (op[0] === 'Z') {
        const [, id, x, y, w, h] = op;
        if (String(id).startsWith(ANCHOR)) continue;
        out.push({ id, x: fx < 0 ? ox - x - (w - 1) : ox + x, y: oy + y, w, h });
      } else if (op[0] === 'T' && depth < MAX_STAMP_DEPTH && own(stamps, op[1])) {
        walk(stamps[op[1]], ox + fx * op[2], oy + op[3], fx * (op[4] ? -1 : 1), depth + 1);
      }
    }
  };
  walk(ops, 0, 0, 1, 0);
  return out;
}

/**
 * Compose a place at an hour.
 * @param {string} pic the place (a key of recipes.places)
 * @param {any} art art.json: pics, stamps and recipes
 * @param {{hour?: string, sprites?: readonly (readonly string[])[]}} [o]
 *   sprites: [kind, pose, anchor, face?] each, drawn as the stamp
 *   <kind>_<pose> with its feet at the anchor, facing right (or left, when
 *   the call or the place says so)
 * @returns {Composed}
 */
export function compose(pic, art, o = {}) {
  const hour = o.hour || 'day';
  if (!HOURS.includes(hour)) throw new Error(`compose: no hour "${hour}"`);
  const r = resolvePlace(pic, art);
  if (!r) throw new Error(`compose: no picture for "${pic}" yet`);
  const recipes = art.recipes;
  const recipe = r.recipe;
  /** @type {any[][]} */
  const ops = [];
  let flip = false;
  let horizon = 0;
  if (r.scene) {
    // A hand-drawn scene, as drawn (never mirrored).
    ops.push(...r.ops);
  } else {
    const base = /** @type {{id: string, base: any, ops: any[][]}} */ (r.base).base;
    flip = typeof recipe.flip === 'boolean' ? recipe.flip : draw(ART_SEED, 'art', pic, 'flip').int(2) === 1;
    horizon = Number.isInteger(recipe.horizon) ? recipe.horizon : draw(ART_SEED, 'art', pic, 'horizon').int(2 * HORIZON + 1) - HORIZON;
    const layers = splitLayers(r.ops);
    const props = Array.isArray(base.props) ? base.props : [];
    const fixed = Array.isArray(recipe.stamps) ? recipe.stamps : [];
    const overrides = recipe.props || {};
    LAYERS.forEach((layer, k) => {
      ops.push(['@', layer]);
      ops.push(...layers[k]);
      if (layer === 'far') {
        for (const id of recipe.far || []) {
          const sky = own(recipes.skylines, id) ? recipes.skylines[id] : null;
          if (sky) ops.push(['T', sky.stamp, 0, base.far_y + horizon, 0]);
        }
      }
      for (const slot of props) if (slot.layer === layer) ops.push(...propOps(pic, slot, own(overrides, slot.id) ? overrides[slot.id] : null));
      for (const s of fixed) if (s.layer === layer) ops.push(['T', s.id, s.at[0], s.at[1], s.fx ? 1 : 0]);
    });
  }
  // The anchors, in the unmirrored picture, and the ops without them.
  /** @type {Record<string, number[]>} */
  const at = {};
  const body = ops.filter((op) => {
    if (op[0] !== 'Z' || !String(op[1]).startsWith(ANCHOR)) return true;
    at[String(op[1]).slice(ANCHOR.length)] = [op[2], op[3]];
    return false;
  });
  // Sprites last on the near layer.
  const left = recipe.face === 'left';
  const sprites = o.sprites || [];
  if (sprites.length) body.push(['@', 'near']);
  for (const s of sprites) {
    const spot = own(at, s[2]) ? at[s[2]] : null;
    if (!spot) continue;
    const faceLeft = s[3] ? s[3] === 'left' : left;
    body.push(['T', `${s[0]}_${s[1]}`, spot[0], spot[1], faceLeft ? 1 : 0]);
  }
  const out = flip ? mirror(body) : body;
  /** @type {Record<string, number[]>} */
  const anchors = {};
  for (const [name, [x, y]] of Object.entries(at)) anchors[name] = [flip ? WIDTH - 1 - x : x, y];
  // The hour's stars, last, on the sky layer.
  const floor = own(anchors, 'star_floor') ? anchors.star_floor[1] : 0;
  const stars = starPoints(pic, hour, floor);
  if (stars.length) {
    out.push(['@', 'sky'], ['C', STAR]);
    for (const [x, y] of stars) out.push(['L', [x, y]]);
  }
  const hotspots = hotspotsOf(out, art.stamps || {});
  return { ops: out, width: WIDTH, height: HEIGHT, hotspots, anchors, key: `${pic}@${hour}`, place: pic, flip, horizon, stars: stars.length, from: r.scene || /** @type {{id: string}} */ (r.base).id };
}
