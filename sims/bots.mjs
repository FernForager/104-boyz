// The harness's bots (BUILD_PLAN 7.1, S3; GAME_DESIGN F.2).
//
// A bot sees only the screen, what the player sees, never the state:
// bot(screen, gen) -> action. If a sensible bot can't play well from the
// screen, the screen is missing something, and that is a UI bug (7.1).
// The driver (tools/sim.mjs) fills what the UI fills: the guest book's name
// and the home screen's auto start with its seed.
//
// S3's bots:
//   first   the first enabled choice (on a stop with Walk on, that is it)
//   random  any enabled choice, evenly; 1 time in 10 a wait instead, of 0
//           (the canonical no-op) or 1 to 3,600 seconds
// Cautious, Steady, Bold, Reckless, Joy-seeker and Oracle arrive in S15b,
// with the plan library (sims/matrix.m1a.json) and the 7.3 targets report.
//
// A bot's randomness is its own: sfc32 over a cyrb128 key (the engine's
// rng.js primitives, not its streams, which belong to the game), so a bot
// never draws from a trip's dice, and a run is the same every time.

import { hash128, sfc32, DISCARD } from '../web/js/engine/rng.js';

const TWO32 = 4294967296;
/** The longest wait the random bot takes, in seconds. */
export const MAX_BOT_WAIT = 3600;

/**
 * @typedef {object} BotGen
 * @property {() => number} u32
 * @property {() => number} float in [0, 1)
 * @property {(n: number) => number} int an integer in [0, n), unbiased
 */

/**
 * A bot's generator, from a label ("bot|17").
 * @param {string} label ASCII
 * @returns {BotGen}
 */
export function botGen(label) {
  const next = sfc32(...hash128(label));
  for (let i = 0; i < DISCARD; i++) next();
  return {
    u32: next,
    float: () => next() / TWO32,
    int(n) {
      if (!Number.isSafeInteger(n) || n < 1 || n > TWO32) throw new Error(`bots: int(${n})`);
      const limit = TWO32 - (TWO32 % n);
      for (;;) {
        const u = next();
        if (u < limit) return u % n;
      }
    },
  };
}

/**
 * The actions a screen offers: its enabled choices' actions, copied.
 * @param {any} screen
 * @returns {Record<string, unknown>[]}
 */
export function offered(screen) {
  return (screen.choices || []).filter((/** @type {any} */ c) => c.enabled).map((/** @type {any} */ c) => ({ ...c.act }));
}

/**
 * first: the first enabled choice, or null when there is none.
 * @param {any} screen
 * @param {BotGen} _gen
 */
export function first(screen, _gen) {
  const acts = offered(screen);
  return acts.length ? acts[0] : null;
}

/**
 * random: any enabled choice, evenly; a wait 1 time in 10. Null when the
 * screen offers nothing (a dead end: the driver records it).
 * @param {any} screen
 * @param {BotGen} gen
 */
export function random(screen, gen) {
  const acts = offered(screen);
  if (!acts.length) return null;
  if (screen.stop && gen.int(10) === 0) return { t: 'wait', s: gen.int(2) ? 0 : 1 + gen.int(MAX_BOT_WAIT) };
  return acts[gen.int(acts.length)];
}

/** The bots by name. */
export const BOTS = Object.freeze({ first, random });
