// The compass roll (GAME_DESIGN 8.8, 13.2, 11.10; BUILD_PLAN S6, the
// spec's lead call 4): after a diamond's Yes, a compass rose fills the
// picture, its dial painted with the roll's bands (gfx/compass.js), and the
// needle spins about 1.2 seconds, easing out, with a dry wooden tick at
// each 12 degrees of travel so the ticks slow with it (ui.compass), and
// comes to rest somewhere inside the band the roll landed in, never at the
// roll itself, so a replayed day's dice can't be read off it (8.8). Its
// rest is a cosmetic draw from the art stream (restDraw), keyed as the
// roll is, never the roll stream. At rest: two ticks falling (ui.land),
// and a polite live region says where the needle stopped; then about 600
// ms, or a tap, brings the outcome. A tap during the spin skips to rest.
// Under Reduce Motion there is no spin: the needle is at rest at once,
// with its one ui.land tick.
//
// The save at the confirming tap already holds the outcome (8.14), so this
// is display only: closing the app mid-spin changes nothing, and a
// restored save shows the outcome directly (the game passes fresh only on
// the tap's own draw). Ordinary % choices go straight to the outcome.

import { draw } from '../engine/rng.js';
import { compassBase, withNeedle, restOf, COMPASS_W, COMPASS_H } from '../gfx/compass.js';
import { toRGBA } from '../gfx/palette.js';
import { tx } from '../text.js';

/** The spin (ms), its whole turns before the rest, the hold at rest (ms). */
export const SPIN_MS = 1200;
export const SPIN_TURNS = 2;
export const REST_MS = 600;
/** A tick at every 12 degrees of the needle's travel, at most one a frame and one per TICK_GAP_MS. */
export const TICK_TURN = 12 / 360;
export const TICK_GAP_MS = 30;
/** The band each landing is spoken as (trail.band.*). */
const BAND_LINES = Object.freeze({ great: 'trail.band.clean', clean: 'trail.band.clean', shaky: 'trail.band.shaky', fail: 'trail.band.fail', fatal: 'trail.band.fatal' });

/**
 * The needle's rest draw, u in [0, 1): the art stream, keyed as the roll is
 * (the set, the stop and choice rolled, the trip day, the attempts before
 * the roll), so the same roll rests in the same place, and a fresh roll
 * somewhere new. Cosmetic: never the roll stream.
 * @param {any} trip a trip just after its roll (trip.rolled)
 */
export function restDraw(trip) {
  const r = trip.rolled;
  const key = `${trip.set}.${r.stop}.${r.c}.${trip.clock.day}`;
  const after = Object.prototype.hasOwnProperty.call(trip.attempts, key) ? trip.attempts[key] : 1;
  return draw(trip.seed, 'art', 'compass', trip.set, r.stop, r.c, trip.clock.day, Math.max(0, after - 1)).float();
}

/** Ease-out, cubic: fast, then slowing to rest. @param {number} p 0 to 1 */
export const easeOut = (p) => 1 - (1 - p) * (1 - p) * (1 - p);

/**
 * @typedef {object} CompassRoll the screen's roll (engine trailhead.js)
 * @property {{clean: number, shaky: number, fail: number}} bands
 * @property {{num: number, den: number} | null} fatal
 * @property {string} landed
 */

/**
 * Play the compass on a picture display.
 * @param {object} o
 * @param {{present: (rgba: Uint8ClampedArray) => void, shape: {sx: number, sy: number}}} o.display the picture's display (gfx/display.js)
 * @param {import('../gfx/palette.js').Palette} o.palette
 * @param {CompassRoll} o.roll
 * @param {number} o.u the rest draw (restDraw)
 * @param {boolean} o.reduced Reduce Motion: no spin
 * @param {{play: (cue: string) => void}} o.sound
 * @param {HTMLElement | null} [o.live] the polite live region
 * @param {() => number} [o.now]
 * @param {(f: () => void) => unknown} [o.frame] the next animation frame
 * @param {(f: () => void, ms: number) => unknown} [o.later]
 * @param {(handle: unknown) => void} [o.cancelLater]
 * @param {() => void} o.done the outcome's turn
 * @returns {{tap: () => void, stop: () => void, state: () => string, rest: number}}
 */
export function playCompass({ display, palette, roll, u, reduced, sound, live = null, now = () => performance.now(), frame = (f) => requestAnimationFrame(f), later = (f, ms) => setTimeout(f, ms), cancelLater = (h) => clearTimeout(/** @type {any} */ (h)), done }) {
  const { sx, sy } = display.shape;
  const base = compassBase({ bands: roll.bands, fatal: roll.fatal, sx, sy });
  const px = new Uint8Array(COMPASS_W * COMPASS_H);
  const rgba = new Uint8ClampedArray(COMPASS_W * COMPASS_H * 4);
  const day = palette.remaps.day;
  const rest = restOf(roll.bands, roll.fatal, roll.landed, u);
  const travel = SPIN_TURNS + rest;
  /** 'spin', 'rest' or 'done' */
  let state = 'spin';
  /** @type {unknown} */
  let hold = null;
  let ticks = 0;
  let lastTick = -Infinity;
  // Always the day table, so the bands keep their colors at any hour (lead call 4).
  const show = (/** @type {number} */ turn) => {
    withNeedle(base, turn - Math.floor(turn), sx, sy, px);
    for (let i = 0; i < px.length; i++) px[i] = day[px[i]];
    display.present(toRGBA(px, palette, rgba));
  };
  const finish = () => {
    if (state === 'done') return;
    if (hold !== null) cancelLater(hold);
    hold = null;
    state = 'done';
    done();
  };
  const settle = () => {
    if (state !== 'spin') return;
    state = 'rest';
    show(rest);
    sound.play('ui.land');
    if (live) tx(live, 'trail.compass.landed', { band: { id: /** @type {Record<string, string>} */ (BAND_LINES)[roll.landed] || BAND_LINES.fail } }); // t-ids: trail.band.clean, trail.band.shaky, trail.band.fail, trail.band.fatal
    hold = later(finish, REST_MS);
  };
  if (reduced) settle();
  else {
    const t0 = now();
    show(0);
    const step = () => {
      if (state !== 'spin') return;
      const p = Math.min(1, (now() - t0) / SPIN_MS);
      const turn = travel * easeOut(p);
      const k = Math.floor(turn / TICK_TURN);
      const t = now();
      if (k > ticks && t - lastTick >= TICK_GAP_MS) {
        ticks = k;
        lastTick = t;
        sound.play('ui.compass');
      }
      if (p >= 1) settle();
      else {
        show(turn);
        frame(step);
      }
    };
    frame(step);
  }
  return {
    /** A tap: during the spin, to rest; at rest, on to the outcome. */
    tap() {
      if (state === 'spin') settle();
      else if (state === 'rest') finish();
    },
    /** Stop without the outcome (the frame let go). */
    stop() {
      if (hold !== null) cancelLater(hold);
      hold = null;
      state = 'done';
    },
    state: () => state,
    rest,
  };
}
