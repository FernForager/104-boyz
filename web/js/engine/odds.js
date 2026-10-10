// The odds: how a rolled choice is priced and rolled (BUILD_PLAN S6;
// GAME_DESIGN 8.1, 8.5, 8.7, 8.8, 8.14, 9.1, 9.5).
//
// PURE, and integer-only: every number here is a whole number or an exact
// fraction of two, so Node and Safari price and roll a choice the same.
//
//   pOf(constants, odds, env, labels)  p, the clean chance: the base plus
//       its labeled modifiers, clamped (8.5); and the rows the Why sheet
//       shows, each {label, value}
//   bandsOf(p, constants, o)  the bands (8.8): clean p, shaky
//       min(ceil((100 - p) / 2), cap), fail the rest; made = clean + shaky.
//       Hooks for later sessions, each tested: Great (p - great_below),
//       Lead call 6's two-band curve rolls (no shaky band, no clamp, made =
//       100 - the curve's fail share rounded up) and a card's own shaky
//   diamondOf(fail)  a fail table that can reach rung 3 (9.1): computed,
//       never authored (8.1)
//   fatalOf(failPct, entries)  the fatal share, exact (the fail share x
//       the fatal entries' share of the fails x their death roll), and as
//       a tag shows it: rounded up, toward danger, to one decimal under 10%
//       and to a whole number from 10%, <0.1% under that, never 0 (8.1)
//   landOf(bands, odds, us, rule)  where three draws from the roll stream
//       land (8.14): the band from the first (r = floor(u1 x 100 / 2^32),
//       exact), the fail entry from the second (by weight, in table order),
//       the death from the third (floor(u3 x 1000 / 2^32) < permille), in
//       Old School only: under the gentle rule the death's gentle stop is
//       taken instead. So the fatal share is exactly the product of three
//       independent draws, the Why sheet's arithmetic.

import { EngineError } from './error.js';
import { ref } from './template.js';

/** 2^32: a u32 over it is in [0, 1), exactly. */
const TWO32 = 4294967296;
/** The most a fail table's weights may total, so u2 x W stays an exact integer (2^21). */
export const MAX_WEIGHT = 2097152;
/** The bands a roll can land in (the compass's, and trip.rolled's). */
export const BANDS = Object.freeze(['great', 'clean', 'shaky', 'fail', 'fatal']);

/**
 * a / b, rounded down, for whole numbers a >= 0 and b > 0: exact, with no
 * floating-point division to trust.
 * @param {number} a
 * @param {number} b
 */
export function idiv(a, b) {
  return (a - (a % b)) / b;
}

/**
 * a / b, rounded up, for whole numbers a >= 0 and b > 0.
 * @param {number} a
 * @param {number} b
 */
export function cdiv(a, b) {
  return idiv(a + b - 1, b);
}

/** @param {number} a @param {number} b */
function gcd(a, b) {
  let x = a;
  let y = b;
  while (y) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

/**
 * A fraction in lowest terms.
 * @param {number} num
 * @param {number} den
 * @returns {{num: number, den: number}}
 */
export function frac(num, den) {
  if (!Number.isSafeInteger(num) || !Number.isSafeInteger(den) || num < 0 || den < 1) throw new EngineError('state', 'odds: a share is a whole number over a positive whole number');
  const g = gcd(num, den) || 1;
  return { num: num / g, den: den / g };
}

/**
 * @typedef {object} OddsConstants rules.odds (content/rules/odds.json)
 * @property {[number, number]} clamp
 * @property {number} shaky_cap
 * @property {number} great_below
 * @property {number} routine_at
 * @property {number} skill_per_level
 * @property {Record<string, {base: number}>} bases
 * @typedef {{base: string, mods: {skill: string}[], clean: string, shaky: string, fail: FailEntry[]}} Odds a choice's odds
 * @typedef {{to: string, w: number, rung: number, death?: {permille: number, to: string, cause: string, gentle: string}}} FailEntry
 * @typedef {{label: import('./template.js').Ref | null, value: number, kind: 'base' | 'skill', id: string}} Row
 * @typedef {{bases: Record<string, string>, skills: Record<string, string>}} OddsLabels voice.odds
 * @typedef {{great: number, clean: number, shaky: number, fail: number, made: number, curve: boolean}} Bands
 * @typedef {{tenths: number} | {under: true}} Shown a share as a tag shows it: tenths of a percent, or under 0.1%
 */

/** @param {unknown} v */
const whole = (v) => typeof v === 'number' && Number.isSafeInteger(v);

/**
 * p, the clean chance (8.5): the base plus each labeled modifier, clamped.
 * A skill adds its level (env.v('skill.<id>')) times skill_per_level.
 * @param {OddsConstants} constants
 * @param {Odds} odds
 * @param {{v: (path: string) => unknown}} env what an expression may read (trip.js exprEnv)
 * @param {OddsLabels | null} [labels] voice.odds: each row's line (null: rows unlabeled, for tools)
 * @returns {{rows: Row[], p: number, sum: number}}
 */
export function pOf(constants, odds, env, labels = null) {
  if (!constants || !Object.prototype.hasOwnProperty.call(constants.bases, odds.base)) throw new EngineError('state', 'odds: a choice names a base the odds lack');
  const base = constants.bases[odds.base].base;
  /** @type {Row[]} */
  const rows = [{ label: labels && labels.bases[odds.base] ? ref(labels.bases[odds.base]) : null, value: base, kind: 'base', id: odds.base }];
  let sum = base;
  for (const m of odds.mods) {
    const raw = env.v(`skill.${m.skill}`);
    if (!whole(raw)) throw new EngineError('state', 'odds: a skill level is a whole number');
    const level = /** @type {number} */ (raw);
    const value = level * constants.skill_per_level;
    rows.push({ label: labels && labels.skills[m.skill] ? ref(labels.skills[m.skill], { level }) : null, value, kind: 'skill', id: m.skill });
    sum += value;
  }
  const [lo, hi] = constants.clamp;
  return { rows, p: Math.min(hi, Math.max(lo, sum)), sum };
}

/**
 * The bands of a roll (8.8), in whole points that add to 100.
 * @param {number} p the clean chance (or, with curve, unused)
 * @param {OddsConstants} constants
 * @param {{great?: boolean, shaky?: number, curve?: {num: number, den: number}}} [o]
 *   great: the card has a Great band (p - great_below of the clean);
 *   shaky: a card's own shaky band; curve: a physics-curve roll (Lead call
 *   6: the night roll), its fail share in percent as a fraction: no shaky
 *   band, no clamp, made = 100 - the fail share rounded up
 * @returns {Bands}
 */
export function bandsOf(p, constants, o = {}) {
  if (o.curve) {
    const { num, den } = frac(o.curve.num, o.curve.den);
    if (num > 100 * den) throw new EngineError('state', 'odds: a curve fails more than always');
    const fail = cdiv(num, den);
    return { great: 0, clean: 100 - fail, shaky: 0, fail, made: 100 - fail, curve: true };
  }
  if (!whole(p) || p < 0 || p > 100) throw new EngineError('state', 'odds: p is a whole number of points, 0 to 100');
  const own = o.shaky;
  const shaky = whole(own) ? Math.min(/** @type {number} */ (own), 100 - p) : Math.min(cdiv(100 - p, 2), constants.shaky_cap);
  const great = o.great ? Math.max(0, p - constants.great_below) : 0;
  return { great, clean: p, shaky, fail: 100 - p - shaky, made: p + shaky, curve: false };
}

/**
 * Can a fail table reach Serious or worse (9.1's rung 3)? Then the choice is
 * a diamond (8.1).
 * @param {FailEntry[]} fail
 */
export function diamondOf(fail) {
  return fail.some((f) => f.rung >= 3);
}

/**
 * A share in percent, as a tag shows it (8.1): rounded up, toward danger,
 * to one decimal below 10% and to a whole number from 10%; under 0.1% as
 * under; null for none at all (0 is never shown).
 * @param {{num: number, den: number}} share percent, as a fraction
 * @returns {Shown | null}
 */
export function shownOf(share) {
  const { num, den } = share;
  if (num === 0) return null;
  if (num * 10 < den) return { under: true };
  const tenths = cdiv(num * 10, den);
  if (tenths < 100) return { tenths };
  return { tenths: cdiv(num, den) * 10 };
}

/**
 * The fatal share (8.1, 9.5): the fail share x the fatal entries' share of
 * the fails x their death roll, exactly, in percent; and as shown. Null
 * when no entry can kill.
 * @param {number} failPct the fail band, in points
 * @param {FailEntry[]} entries the fail table
 * @returns {{exact: {num: number, den: number}, shown: Shown | null, band: {num: number, den: number}, death: number | null} | null}
 *   band: the fatal entries' share of the fails; death: their death roll in
 *   permille, when they share one (else null)
 */
export function fatalOf(failPct, entries) {
  const W = entries.reduce((n, f) => n + f.w, 0);
  if (!(W > 0) || W > MAX_WEIGHT) throw new EngineError('state', 'odds: a fail table weighs 1 to 2^21');
  const deadly = entries.filter((f) => f.death);
  if (!deadly.length) return null;
  let num = 0;
  let wd = 0;
  for (const f of deadly) {
    num += f.w * /** @type {{permille: number}} */ (f.death).permille;
    wd += f.w;
  }
  const permilles = [...new Set(deadly.map((f) => /** @type {{permille: number}} */ (f.death).permille))];
  const exact = frac(failPct * num, W * 1000);
  return { exact, shown: shownOf(exact), band: frac(wd, W), death: permilles.length === 1 ? permilles[0] : null };
}

/**
 * The three draws a roll uses, as whole numbers: the band (0..99), the
 * fail entry's weight (0..W-1), the death roll (0..999).
 * @param {[number, number, number]} us three u32s from the roll stream, in order
 * @param {number} W the fail table's total weight
 */
export function drawsOf(us, W) {
  const [u1, u2, u3] = us;
  for (const u of us) if (!whole(u) || u < 0 || u >= TWO32) throw new EngineError('state', 'odds: a draw is a u32');
  // Each product is under 2^53 and the divisor a power of two: exact.
  return { r: Math.floor((u1 * 100) / TWO32), w: Math.floor((u2 * W) / TWO32), d: Math.floor((u3 * 1000) / TWO32) };
}

/**
 * Where a roll lands (8.8, 8.14): its band and the stop it goes to.
 * @param {Bands} bands
 * @param {Odds & {great?: string}} odds
 * @param {[number, number, number]} us three u32s from the roll stream, in order
 * @param {string} rule 'oldschool' or 'gentle' (trip.js RULES)
 * @returns {{band: string, to: string, entry: number | null, draws: {r: number, w: number, d: number}}}
 *   entry: the fail table's entry, by index (null on a made-it band)
 */
export function landOf(bands, odds, us, rule) {
  const W = odds.fail.reduce((n, f) => n + f.w, 0);
  if (!(W > 0) || W > MAX_WEIGHT) throw new EngineError('state', 'odds: a fail table weighs 1 to 2^21');
  const draws = drawsOf(us, W);
  const { r } = draws;
  if (bands.great && r < bands.great && odds.great) return { band: 'great', to: odds.great, entry: null, draws };
  if (r < bands.clean) return { band: 'clean', to: odds.clean, entry: null, draws };
  if (r < bands.clean + bands.shaky) return { band: 'shaky', to: odds.shaky, entry: null, draws };
  let w = draws.w;
  let k = 0;
  for (; k < odds.fail.length; k++) {
    if (w < odds.fail[k].w) break;
    w -= odds.fail[k].w;
  }
  const f = odds.fail[k];
  if (f.death && draws.d < f.death.permille) {
    if (rule === 'gentle') return { band: 'fail', to: f.death.gentle, entry: k, draws };
    return { band: 'fatal', to: f.death.to, entry: k, draws };
  }
  return { band: 'fail', to: f.to, entry: k, draws };
}
