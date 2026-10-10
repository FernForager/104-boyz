// The compass roll's picture (GAME_DESIGN 8.8, 11.1, 11.9; BUILD_PLAN S6,
// the spec's lead call 4). Pure: no DOM, so Node draws and tests it.
//
// compassPic({bands, fatal, angle, sx, sy}) -> palette slots, 160 x 168:
// a rose that fills the picture. A snow face; a dial ring painted
// clockwise from north with the roll's bands in points (moss clean, pink
// shaky, brick fail: 11.1's colors), and a thin ink sliver at the far end
// of the brick for the fatal share; a 1-pixel ink rule between bands and
// round the ring, so color is never the only thing that tells them apart
// (11.9); slate rose points; and the needle, ink with a snow outline,
// pointing at `angle`. A night roll's two bands (Lead call 6: made it and
// fail, moss and brick) draw the same way, with no pink.
//
// The rose is drawn as an ellipse in picture pixels, so it is round on
// the phone at each pixel shape (sx device pixels wide by sy tall: AGI's
// wide 7:4 and 8:5, 6:4, and the SE's 2:1). It is always shown through the
// day table, so the bands keep their colors at any hour (lead call 4), and
// it uses none of the lily's bonfire gold (P07, P12).
//
// restOf(bands, fatal, landed, u) is where the needle comes to rest:
// somewhere inside the band it landed in, never at the roll (8.8), from a
// cosmetic draw u in [0, 1) (the art stream: ui/compass.js keys it).

/** The picture: the trail picture's size (ui/frame.js PIC). */
export const COMPASS_W = 160;
export const COMPASS_H = 168;
/** The palette slots the compass uses (11.1): ink, night navy, slate, snow, alpenglow pink, brick, moss. */
export const SLOT = Object.freeze({ ink: 0, navy: 1, slate: 2, snow: 4, pink: 6, brick: 9, moss: 13 });
/** The rose's radii, as shares of its radius: the face, the dial ring's inner and outer edges. */
export const FACE_R = 0.6;
export const RING_OUT = 0.94;
/** The needle's reach and tail, as shares of the radius. */
const NEEDLE_R = 0.86;
const TAIL_R = 0.22;
const NEEDLE_HALF = 0.08;
/** The least the fatal sliver shows, in turns, so a share like 0.1% still shows as a sliver. */
export const MIN_SLIVER = 0.006;
/** How far inside its band the needle may rest, as a share of the band (each side). */
const REST_INSET = 0.18;

/**
 * @typedef {{clean: number, shaky: number, fail: number}} Bands the roll's bands, in points (adding to 100)
 * @typedef {{num: number, den: number} | null} Fatal the fatal share in percent, a fraction, or null
 */

/**
 * The dial's arcs, in turns from north, clockwise: each band's [from, to),
 * the fatal sliver at the far end of the fail band.
 * @param {Bands} bands
 * @param {Fatal} fatal
 * @returns {{clean: [number, number], shaky: [number, number], fail: [number, number], fatal: [number, number] | null}}
 */
export function arcsOf(bands, fatal) {
  const a = bands.clean / 100;
  const b = (bands.clean + bands.shaky) / 100;
  /** @type {[number, number] | null} */
  let sliver = null;
  if (fatal && fatal.num > 0) {
    const share = Math.min(bands.fail / 100, Math.max(MIN_SLIVER, fatal.num / fatal.den / 100));
    sliver = [1 - share, 1];
  }
  return { clean: [0, a], shaky: [a, b], fail: [b, sliver ? sliver[0] : 1], fatal: sliver };
}

/**
 * The turn (0 to 1, clockwise from north) the needle rests at: inside the
 * band it landed in, away from its edges.
 * @param {Bands} bands
 * @param {Fatal} fatal
 * @param {string} landed 'great' or 'clean', 'shaky', 'fail' or 'fatal'
 * @param {number} u in [0, 1)
 */
export function restOf(bands, fatal, landed, u) {
  const arcs = arcsOf(bands, fatal);
  const key = landed === 'great' ? 'clean' : landed;
  const arc = /** @type {[number, number] | null} */ (/** @type {any} */ (arcs)[key] || null);
  if (!arc || !(arc[1] > arc[0])) throw new Error(`compass: no ${landed} band to rest in`);
  const w = arc[1] - arc[0];
  // The sliver is narrow: rest at its middle third.
  const inset = key === 'fatal' ? w / 3 : w * REST_INSET;
  return arc[0] + inset + u * (w - 2 * inset);
}

/**
 * The band a turn falls in.
 * @param {ReturnType<typeof arcsOf>} arcs
 * @param {number} turn 0 to 1
 * @returns {number} a palette slot
 */
function bandSlot(arcs, turn) {
  if (arcs.fatal && turn >= arcs.fatal[0]) return SLOT.ink;
  if (turn < arcs.clean[1]) return SLOT.moss;
  if (turn < arcs.shaky[1]) return SLOT.pink;
  return SLOT.brick;
}

/**
 * A pixel's center relative to the rose's, in device pixels, its radius as
 * a share of the rose's, and its turn from north, clockwise.
 * @param {number} sx
 * @param {number} sy
 */
function geometry(sx, sy) {
  const W = COMPASS_W;
  const H = COMPASS_H;
  // The radius in device pixels, two picture pixels inside the picture.
  const R = Math.min((W - 4) * sx, (H - 4) * sy) / 2;
  return {
    R,
    at(/** @type {number} */ x, /** @type {number} */ y) {
      const X = (x + 0.5) * sx - (W * sx) / 2;
      const Y = (y + 0.5) * sy - (H * sy) / 2;
      const r = Math.sqrt(X * X + Y * Y) / R;
      let turn = Math.atan2(X, -Y) / (2 * Math.PI);
      if (turn < 0) turn += 1;
      return { X, Y, r, turn };
    },
  };
}

/**
 * The compass's pixels.
 * @param {{bands: Bands, fatal?: Fatal, angle: number, sx: number, sy: number}} o
 *   angle: the needle, in turns clockwise from north; sx, sy: the pixel shape
 * @returns {Uint8Array} palette slots, COMPASS_W x COMPASS_H
 */
export function compassPic({ bands, fatal = null, angle, sx, sy }) {
  return withNeedle(compassBase({ bands, fatal, sx, sy }), angle, sx, sy);
}

/**
 * The compass without its needle: what a spin draws the needle over, frame
 * after frame.
 * @param {{bands: Bands, fatal?: Fatal, sx: number, sy: number}} o
 * @returns {Uint8Array}
 */
export function compassBase({ bands, fatal = null, sx, sy }) {
  const W = COMPASS_W;
  const H = COMPASS_H;
  const px = new Uint8Array(W * H).fill(SLOT.navy);
  const arcs = arcsOf(bands, fatal);
  const { at } = geometry(sx, sy);
  // Pass 1: what each pixel is: 0 outside, 1 the face, 2 the ring (with its band's slot).
  const kind = new Uint8Array(W * H);
  const band = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const { r, turn } = at(x, y);
      const i = y * W + x;
      if (r < FACE_R) {
        kind[i] = 1;
        px[i] = SLOT.snow;
      } else if (r < RING_OUT) {
        kind[i] = 2;
        band[i] = bandSlot(arcs, turn);
        px[i] = band[i];
      }
    }
  }
  // Pass 2: the rules: a 1-pixel ink line wherever the ring meets the face,
  // the field, or another band.
  const kindAt = (/** @type {number} */ x, /** @type {number} */ y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : kind[y * W + x]);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (kind[i] !== 2) continue;
      const edge = kindAt(x - 1, y) !== 2 || kindAt(x + 1, y) !== 2 || kindAt(x, y - 1) !== 2 || kindAt(x, y + 1) !== 2;
      const seam = (x + 1 < W && kind[i + 1] === 2 && band[i + 1] !== band[i]) || (y + 1 < H && kind[i + W] === 2 && band[i + W] !== band[i]);
      if (edge || seam) px[i] = SLOT.ink;
    }
  }
  // The rose points: four long ones at the cardinals, four short at the
  // intercardinals, tapering from the hub, slate on the snow face.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (kind[i] !== 1) continue;
      const { r, turn } = at(x, y);
      for (let k = 0; k < 8; k++) {
        const len = k % 2 === 0 ? 0.56 : 0.34;
        if (r >= len) continue;
        let d = Math.abs(turn - k / 8);
        if (d > 0.5) d = 1 - d;
        const half = (k % 2 === 0 ? 0.075 : 0.05) * (1 - r / len);
        if (d * 2 * Math.PI * r < half) px[i] = SLOT.slate;
      }
    }
  }
  return px;
}

/**
 * The needle over a copy of the base: a long thin diamond from its tail to
 * its tip, ink, with a one-pixel snow outline so it stands off the brick
 * and the ink sliver, and a slate pin at the hub.
 * @param {Uint8Array} base compassBase()
 * @param {number} angle in turns clockwise from north
 * @param {number} sx
 * @param {number} sy
 * @param {Uint8Array} [out] where to draw (reused frame to frame)
 */
export function withNeedle(base, angle, sx, sy, out) {
  const W = COMPASS_W;
  const H = COMPASS_H;
  const px = out || new Uint8Array(W * H);
  px.set(base);
  const { R, at } = geometry(sx, sy);
  const ux = Math.sin(angle * 2 * Math.PI);
  const uy = -Math.cos(angle * 2 * Math.PI);
  const inside = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const { X, Y } = at(x, y);
      const along = (X * ux + Y * uy) / R;
      const across = Math.abs(X * uy - Y * ux) / R;
      const half = along >= 0 ? NEEDLE_HALF * (1 - along / NEEDLE_R) : NEEDLE_HALF * (1 + along / TAIL_R);
      if (along > -TAIL_R && along < NEEDLE_R && across < half) inside[y * W + x] = 1;
    }
  }
  const inAt = (/** @type {number} */ x, /** @type {number} */ y) => x >= 0 && y >= 0 && x < W && y < H && inside[y * W + x] === 1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (inside[i]) px[i] = SLOT.ink;
      else if (inAt(x - 1, y) || inAt(x + 1, y) || inAt(x, y - 1) || inAt(x, y + 1)) px[i] = SLOT.snow;
    }
  }
  // The hub: a slate pin on the needle.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (at(x, y).r < 0.035) px[y * W + x] = SLOT.slate;
    }
  }
  return px;
}
