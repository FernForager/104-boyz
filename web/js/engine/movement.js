// Movement: a Regular hiker's base time on one segment (BUILD_PLAN 2.3, S4;
// GAME_DESIGN 7.4).
//
// PURE, and integer-only. 7.4's formula without the multipliers S8 adds
// (load, dark, energy, injury, weather, snow, pace, breaks, today's legs):
//
//   moving h = miles x class / flat mph + gain / climb ft per h
//            + steep descent / steep ft per h
//   steep descent = max(0, loss - 400 ft x miles)
//
// with the numbers from content/rules/movement.json: flat mph in tenths
// (flat_mph10: 24 is 2.4 mph), the class factor in thousandths
// (class_milli: 1250 is x1.25), distance in tenths of a mile (mi10). Every
// term is put over one common denominator and the seconds are rounded once
// per directed segment, half up, so Node and Safari agree to the second.

import { EngineError } from './error.js';

/**
 * @typedef {object} Movement content/rules/movement.json
 * @property {{flat_mph10: number, climb_ft_h: number}} regular
 * @property {{ft_per_mi: number, ft_h: number}} steep
 * @property {Record<string, number>} class_milli
 * @property {number} breaks_milli
 */

/**
 * @typedef {object} SegNumbers a segment as written, a to b
 * @property {number} mi10
 * @property {number} gain
 * @property {number} loss
 * @property {string} class
 */

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

/** @param {number} a @param {number} b */
const lcm = (a, b) => (a / gcd(a, b)) * b;

/** @param {unknown} v */
const posInt = (v) => typeof v === 'number' && Number.isSafeInteger(v) && v > 0;
/** @param {unknown} v */
const natInt = (v) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;

/**
 * The steep part of a descent (ft): the loss beyond movement.steep.ft_per_mi
 * per mile (7.4: 400 ft a mile).
 * @param {Movement} movement
 * @param {number} mi10
 * @param {number} loss
 */
export function steepOf(movement, mi10, loss) {
  // ft_per_mi x miles = ft_per_mi x mi10 / 10; kept exact by scaling by 10.
  const over = loss * 10 - movement.steep.ft_per_mi * mi10;
  return over > 0 ? Math.floor(over / 10) : 0;
}

/**
 * A Regular hiker's moving seconds on one directed segment, without breaks
 * (7.4): one rounding, half up.
 * @param {Movement} movement
 * @param {SegNumbers} seg
 * @param {1 | -1} [dir] 1 walks it as written (a to b), -1 the other way (gain and loss swap)
 * @returns {number} whole seconds
 */
export function baseSeconds(movement, seg, dir = 1) {
  const cm = movement.class_milli[seg.class];
  if (!posInt(cm)) throw new EngineError('format', `movement: no class factor for "${seg.class}"`);
  if (!natInt(seg.mi10) || !natInt(seg.gain) || !natInt(seg.loss)) throw new EngineError('format', 'movement: a segment is whole tenths of a mile and whole feet');
  const flat = movement.regular.flat_mph10;
  const climb = movement.regular.climb_ft_h;
  const steepH = movement.steep.ft_h;
  if (!posInt(flat) || !posInt(climb) || !posInt(steepH) || !posInt(movement.steep.ft_per_mi)) throw new EngineError('format', 'movement: the rates are whole positive numbers');
  const gain = dir === 1 ? seg.gain : seg.loss;
  const loss = dir === 1 ? seg.loss : seg.gain;
  // The steep feet are loss*10 - ft_per_mi*mi10 over 10 (kept as a numerator).
  const steep10 = Math.max(0, loss * 10 - movement.steep.ft_per_mi * seg.mi10);
  // Hours = mi10*cm/(1000*flat) + gain/climb + steep10/(10*steepH).
  const dDist = 1000 * flat;
  const dSteep = 10 * steepH;
  const den = lcm(lcm(dDist, climb), dSteep);
  const num = 3600 * (seg.mi10 * cm * (den / dDist) + gain * (den / climb) + steep10 * (den / dSteep));
  if (!Number.isSafeInteger(2 * num + den)) throw new EngineError('format', 'movement: a segment too long to time exactly');
  return Math.floor((2 * num + den) / (2 * den));
}

/**
 * Seconds with breaks (7.4's x1.12): base x breaks_milli / 1000, half up.
 * @param {Movement} movement
 * @param {number} s base seconds
 */
export function withBreaks(movement, s) {
  return Math.floor((2 * s * movement.breaks_milli + 1000) / 2000);
}
