// The sixteen colors, time-of-day remaps and palette cycles
// (BUILD_PLAN 4.1, 4.7; GAME_DESIGN 11.1, 11.4, 11.5).
//
// PURE: no DOM, no clock, no randomness. The screen never shows a 17th
// color: a remap sends each slot to one of the same sixteen, and a cycling
// pseudo-color (16-25) resolves each frame to one of them.
//
// content/art/palette.json carries the same tables as data; a unit test
// keeps the two identical.

/** Option B of design/art/style_mockup.py, in slot order. */
export const PALETTE = Object.freeze([
  '#1b1f2a', // 0 ink
  '#24324a', // 1 night navy
  '#3f5a7a', // 2 slate
  '#8fb3c9', // 3 glacier blue
  '#f2efe6', // 4 snow
  '#e8d9b5', // 5 paper cream
  '#e09a8a', // 6 alpenglow pink
  '#e8b33a', // 7 bonfire gold (the lily only)
  '#c4602d', // 8 rust
  '#8a3b2a', // 9 brick
  '#5a3d2b', // 10 bark
  '#1f3b33', // 11 spruce
  '#2f5b45', // 12 forest
  '#6b8a4a', // 13 moss
  '#a7b88a', // 14 sage
  '#3f7f7a', // 15 teal
]);

export const NAMES = Object.freeze([
  'ink', 'night navy', 'slate', 'glacier blue', 'snow', 'paper cream', 'alpenglow pink', 'bonfire gold',
  'rust', 'brick', 'bark', 'spruce', 'forest', 'moss', 'sage', 'teal',
]);

/**
 * Time-of-day remaps: slot -> slot, applied at the final blit (11.4).
 * Day is the identity. Dusk follows the doc's key slots (slate to night
 * navy, glacier blue to slate, snow to alpenglow pink, forest to spruce)
 * and darkens the rest by about one step. Blue hour and night arrive with
 * the camp pages (S5).
 */
export const REMAPS = Object.freeze({
  day: Object.freeze([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
  dusk: Object.freeze([0, 1, 1, 2, 6, 6, 9, 7, 9, 10, 10, 11, 11, 12, 13, 2]),
});

/**
 * Cycles (11.5). slots: palette slots in order; light: resolved after the
 * remap, so it stays bright at night; hold: frames per step at 8 fps;
 * phase: how a pixel's position offsets its step ("scatter" hashes the
 * position, so each star keeps its own time; "wave" runs bands across).
 */
export const CYCLES = Object.freeze({
  16: Object.freeze({ name: 'lake', slots: [3, 2, 3, 4], light: false, hold: 2, phase: 'wave' }),
  17: Object.freeze({ name: 'falls', slots: [4, 3, 2, 3], light: false, hold: 1, phase: 'fall' }),
  18: Object.freeze({ name: 'river', slots: [15, 3, 15, 14], light: false, hold: 2, phase: 'wave' }),
  19: Object.freeze({ name: 'glow', slots: [7, 6, 8], light: true, hold: 2, phase: 'ring' }),
  20: Object.freeze({ name: 'fire', slots: [8, 6, 5], light: true, hold: 1, phase: 'scatter' }),
  21: Object.freeze({ name: 'surf', slots: [4, 3, 2, 15], light: false, hold: 2, phase: 'wave' }),
  22: Object.freeze({ name: 'stars', slots: [5, 4, 5, 3], light: true, hold: 3, phase: 'scatter' }),
  23: Object.freeze({ name: 'rain glint', slots: [2, 3], light: false, hold: 2, phase: 'scatter' }),
  24: Object.freeze({ name: 'lamp', slots: [5], light: true, hold: 1, phase: 'none' }),
  25: Object.freeze({ name: 'dust', slots: [5, 10, 2], light: true, hold: 2, phase: 'none' }),
});

/** Cycling runs at 8 frames a second (11.5). */
export const CYCLE_FPS = 8;

/** '#rrggbb' -> [r, g, b] */
export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function scatter(x, y) {
  let h = Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

function phaseOf(kind, x, y) {
  switch (kind) {
    case 'scatter':
      return scatter(x, y) & 0xff;
    case 'wave':
      return (x >> 2) + y;
    case 'fall':
      return 1000 - y;
    case 'ring':
      return (x + y) >> 1;
    default:
      return 0;
  }
}

/**
 * A palette ready to resolve pictures, from palette.json (or the built-in
 * tables when called with no argument).
 */
export function makePalette(json) {
  const colors = json ? json.colors.map((c) => c.hex) : PALETTE;
  const remaps = json ? json.remaps : REMAPS;
  const cycles = {};
  const src = json ? json.cycles : CYCLES;
  for (const k of Object.keys(src)) cycles[Number(k)] = src[k];
  const rgb = colors.map(hexToRgb);
  return { colors, remaps, cycles, rgb };
}

/**
 * Resolve a picture's indices (0-25, or 255 for nothing) to the sixteen.
 *
 * @param {Uint8Array} src indices from picvm.composite
 * @param {number} width
 * @param {object} pal makePalette()
 * @param {object} [o]
 * @param {string} [o.remap] 'day' | 'dusk'
 * @param {number} [o.frame] cycle frame (8 per second)
 * @param {number} [o.background] slot shown where nothing was drawn
 * @param {Uint8Array} [out]
 * @returns {Uint8Array} slots 0-15
 */
export function resolve(src, width, pal, o = {}, out) {
  const map = pal.remaps[o.remap || 'day'];
  if (!map) throw new Error(`unknown remap "${o.remap}"`);
  const frame = o.frame | 0;
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

/** True when any pixel cycles, so the page needs to animate at all. */
export function hasCycles(src) {
  for (let p = 0; p < src.length; p++) if (src[p] >= 16 && src[p] !== 255) return true;
  return false;
}

/** Slots 0-15 -> RGBA bytes. */
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
