// The sixteen colors, time-of-day remaps and palette cycles
// (BUILD_PLAN 4.1, 4.7; GAME_DESIGN 11.1, 11.4, 11.5).
//
// PURE: no DOM, no clock, no randomness. The screen never shows a 17th
// color: a remap sends each slot to one of the same sixteen, and a cycling
// pseudo-color (16-29) resolves each frame to one of them.
//
// content/art/palette.json carries the same tables as data; a unit test
// keeps the two identical.

/**
 * Option B of design/art/style_mockup.py, lifted by decision 68, in slot
 * order: each color's OKLab lightness L becomes L + 0.18 x (1 - L)^2, its
 * hue and chroma kept, so the darks lift most and snow and paper cream
 * barely move (GAME_DESIGN 11.1 keeps option B's first hexes).
 */
export const PALETTE = Object.freeze([
  '#343945', // 0 ink
  '#394862', // 1 night navy
  '#4d698a', // 2 slate
  '#93b7cd', // 3 glacier blue
  '#f2efe6', // 4 snow
  '#e9dab6', // 5 paper cream
  '#e49d8d', // 6 alpenglow pink
  '#ebb53d', // 7 bonfire gold (the lily only)
  '#ce6937', // 8 rust
  '#9b4a39', // 9 brick
  '#6d4f3d', // 10 bark
  '#345148', // 11 spruce
  '#3f6c55', // 12 forest
  '#749353', // 13 moss
  '#aabb8d', // 14 sage
  '#4a8a85', // 15 teal
]);

export const NAMES = Object.freeze([
  'ink', 'night navy', 'slate', 'glacier blue', 'snow', 'paper cream', 'alpenglow pink', 'bonfire gold', // t-ok: palette names (developer text)
  'rust', 'brick', 'bark', 'spruce', 'forest', 'moss', 'sage', 'teal',
]);

/**
 * Time-of-day remaps: slot -> slot, applied at the final blit (11.4).
 * Day is the identity. Dusk follows the doc's key slots (slate to night
 * navy, glacier blue to slate, snow to alpenglow pink, forest to spruce)
 * and darkens the rest by about one step; spruce goes to ink, so a
 * conifer keeps its two sides (ink in shade, spruce in the light) and
 * stands darker than the meadow, which goes to teal (S6: in decision 68's
 * lighter sixteen, forest sits 1.06 from the lake's slate; teal is 1.42),
 * its sunlit patches to moss. Blue hour keeps dusk's lit sky below and
 * cools everything else: slate to ink (S6 moved this key slot from night
 * navy), so the upper sky sits a step under dusk's, glacier blue to slate
 * as at dusk, so its sky stays lighter than night's (and than S5's blue
 * hour, decision 68), snow to glacier blue, and no warm color is left: the
 * pinks to night navy, bark to ink, the trail (paper cream) slate; its
 * slate lake reads against a teal meadow, as at dusk (a forest meadow sits
 * at 1.06); forest to spruce as at dusk. Night keeps its key slots (slate to
 * ink, glacier blue to night navy, snow to slate, forest to spruce) and
 * sinks the rest to slate or darker, so the stars (a light) are the
 * brightest pixels: spruce to ink and forest to spruce, so the trees (ink
 * and spruce) stand darker than the meadow (forest) and keep their lit
 * side against the night sky (navy), where a navy side would vanish and
 * leave half a tree; teal to slate, so the haze at a ridge's foot stays
 * apart from the ink ridge above it and the treeline in front; and the
 * hiker's jacket brick on a bark pack, so the two stay apart. At night
 * the trail (paper cream) is teal, the one pale thing left on the ground,
 * so it reads on the forest meadow (slate would sit at 1.06).
 * A ridge stays apart from its sky by the horizon's light it stands in
 * (snow by day: pink, glacier blue and slate after), which the pictures
 * draw. Gold only ever maps to itself (lint P12). test/unit/palette.test.mjs
 * holds the tables to their checks over every drawable place: night is
 * night and not grey, no hour is darker than S5's anywhere, and the lake,
 * the trail and the trees read at every hour.
 */
export const REMAPS = Object.freeze({
  day: Object.freeze([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
  dusk: Object.freeze([0, 1, 1, 2, 6, 6, 9, 7, 9, 10, 10, 0, 11, 15, 13, 2]),
  blue: Object.freeze([0, 1, 0, 2, 3, 2, 1, 7, 9, 10, 0, 0, 11, 15, 15, 2]),
  night: Object.freeze([0, 0, 0, 1, 2, 15, 1, 7, 9, 10, 0, 0, 11, 12, 12, 2]),
});

/**
 * Cycles (11.5). slots: palette slots in order; light: resolved after the
 * remap, so it stays bright at night; hold: frames per step at 8 fps;
 * phase: how a pixel's position offsets its step ("scatter" hashes the
 * position, so each star keeps its own time; "wave" runs bands across;
 * "rise" climbs a row a step, as "fall" drops one); screens, where given:
 * the screens that use it, so a channel ships it only with one of them
 * (tools/build.mjs compileArt). 26 (steam) and 27 (alpen) are reserved for
 * S25 and S17, so no picture may use them yet (lint P01).
 */
export const CYCLES = Object.freeze({
  16: Object.freeze({ name: 'lake', slots: [3, 2, 3, 4], light: false, hold: 2, phase: 'wave' }),
  17: Object.freeze({ name: 'falls', slots: [4, 3, 2, 3], light: false, hold: 1, phase: 'fall' }),
  18: Object.freeze({ name: 'river', slots: [15, 3, 15, 14], light: false, hold: 2, phase: 'wave' }),
  19: Object.freeze({ name: 'glow', slots: [7, 6, 8], light: true, hold: 2, phase: 'ring' }),
  20: Object.freeze({ name: 'fire', slots: [8, 6, 5], light: true, hold: 1, phase: 'scatter' }),
  21: Object.freeze({ name: 'surf', slots: [4, 3, 2, 15], light: false, hold: 2, phase: 'wave' }),
  22: Object.freeze({ name: 'stars', slots: [5, 4, 5, 3], light: true, hold: 3, phase: 'scatter' }),
  23: Object.freeze({ name: 'rain glint', slots: [2, 3], light: false, hold: 2, phase: 'scatter' }), // t-ok: palette names (developer text)
  24: Object.freeze({ name: 'lamp', slots: [5], light: true, hold: 1, phase: 'none' }),
  25: Object.freeze({ name: 'dust', slots: [5, 10, 2], light: true, hold: 2, phase: 'none' }),
  // S7, the cabin (lead call 56): warm light spilling from the windows, the
  // lanterns and the embers, a light fixed on brick so it stays warm at
  // night; and the stovepipe's smoke, remapped with the hour, rising.
  28: Object.freeze({ name: 'spill', slots: [9], light: true, hold: 1, phase: 'none', screens: Object.freeze(['home', 'lockbox', 'guestbook']) }),
  29: Object.freeze({ name: 'smoke', slots: [4, 3, 4, 2], light: false, hold: 2, phase: 'rise', screens: Object.freeze(['home', 'lockbox', 'guestbook']) }),
});

/** @typedef {{name: string, slots: readonly number[], light: boolean, hold: number, phase: string, screens?: readonly string[]}} Cycle */
/** @typedef {{colors: readonly string[], remaps: Readonly<Record<string, readonly number[]>>, cycles: Record<number, Cycle>, rgb: number[][]}} Palette a palette ready to resolve pictures (makePalette) */

/** Cycling runs at 8 frames a second (11.5). */
export const CYCLE_FPS = 8;

/**
 * '#rrggbb' -> [r, g, b]
 * @param {string} hex
 */
export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * @param {number} x
 * @param {number} y
 */
function scatter(x, y) {
  let h = Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * @param {string} kind
 * @param {number} x
 * @param {number} y
 */
function phaseOf(kind, x, y) {
  switch (kind) {
    case 'scatter':
      return scatter(x, y) & 0xff;
    case 'wave':
      return (x >> 2) + y;
    case 'fall':
      return 1000 - y;
    case 'rise':
      return y;
    case 'ring':
      return (x + y) >> 1;
    default:
      return 0;
  }
}

/**
 * A palette ready to resolve pictures, from palette.json (or the built-in
 * tables when called with no argument).
 * @param {{colors: {hex: string}[], remaps: Record<string, number[]>, cycles: Record<string, Cycle>}} [json]
 * @returns {Palette}
 */
export function makePalette(json) {
  const colors = json ? json.colors.map((c) => c.hex) : PALETTE;
  const remaps = json ? json.remaps : REMAPS;
  /** @type {Record<number, Cycle>} */
  const cycles = {};
  /** @type {Record<string, Cycle>} */
  const src = json ? json.cycles : CYCLES;
  for (const k of Object.keys(src)) cycles[Number(k)] = src[k];
  const rgb = colors.map(hexToRgb);
  return { colors, remaps, cycles, rgb };
}

/**
 * Resolve a picture's indices (0-29, or 255 for nothing) to the sixteen.
 *
 * @param {Uint8Array} src indices from picvm.composite
 * @param {number} width
 * @param {Palette} pal makePalette()
 * @param {object} [o]
 * @param {string} [o.remap] 'day' | 'dusk' | 'blue' | 'night'
 * @param {number} [o.frame] cycle frame (8 per second)
 * @param {number} [o.background] slot shown where nothing was drawn
 * @param {Uint8Array} [out]
 * @returns {Uint8Array} slots 0-15
 */
export function resolve(src, width, pal, o = {}, out) {
  const map = pal.remaps[o.remap || 'day'];
  if (!map) throw new Error(`unknown remap "${o.remap}"`);
  const frame = (o.frame || 0) | 0;
  const bg = o.background === undefined ? 0 : o.background;
  const dst = out || new Uint8Array(src.length);
  for (let p = 0; p < src.length; p++) {
    const v = src[p];
    if (v < 16) dst[p] = map[v];
    else if (v === 255) dst[p] = map[bg];
    else {
      const cy = pal.cycles[v];
      if (!cy) {
        dst[p] = map[bg];
        continue;
      }
      const x = p % width;
      const y = (p - x) / width;
      const step = Math.floor(frame / (cy.hold || 1)) + phaseOf(cy.phase, x, y);
      const slot = cy.slots[step % cy.slots.length];
      dst[p] = cy.light ? slot : map[slot];
    }
  }
  return dst;
}

/**
 * True when any pixel cycles, so the page needs to animate at all.
 * @param {ArrayLike<number>} src
 */
export function hasCycles(src) {
  for (let p = 0; p < src.length; p++) if (src[p] >= 16 && src[p] !== 255) return true;
  return false;
}

/**
 * Slots 0-15 -> RGBA bytes.
 * @param {ArrayLike<number>} slots
 * @param {{rgb: number[][]}} pal
 * @param {Uint8ClampedArray} [out]
 */
export function toRGBA(slots, pal, out) {
  const dst = out || new Uint8ClampedArray(slots.length * 4);
  const rgb = pal.rgb;
  for (let p = 0, q = 0; p < slots.length; p++, q += 4) {
    const c = rgb[slots[p]];
    dst[q] = c[0];
    dst[q + 1] = c[1];
    dst[q + 2] = c[2];
    dst[q + 3] = 255;
  }
  return dst;
}
