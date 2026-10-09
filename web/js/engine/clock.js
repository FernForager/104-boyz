// The integer-second clock's shape (BUILD_PLAN 6.6, 14.1 T0; GAME_DESIGN
// E.12 #2, Lead call 19).
//
// PURE. A trip's clock is {day, s}: the trip day (1 on the first) and whole
// seconds since that day's midnight. Everything that moves it adds whole
// seconds at defined points, so the same actions give the same clock
// everywhere; Open shows minutes. S8 builds the real clock (the 15-minute
// tick, pace, daylight) on this shape.

import { EngineError } from './error.js';

/** Seconds in a day. */
export const DAY = 86400;

/**
 * @typedef {{day: number, s: number}} Clock
 */

/**
 * The clock after s more whole seconds; whole days roll into `day`.
 * @param {Clock} clock
 * @param {number} s a non-negative safe integer
 * @returns {Clock}
 */
export function addSeconds(clock, s) {
  if (!Number.isSafeInteger(s) || s < 0) throw new EngineError('invalid', 'clock: seconds are a whole, non-negative number');
  if (!clock || !Number.isSafeInteger(clock.day) || clock.day < 1 || !Number.isSafeInteger(clock.s) || clock.s < 0 || clock.s >= DAY) throw new EngineError('state', 'clock: not a clock');
  const total = clock.s + s;
  return { day: clock.day + Math.floor(total / DAY), s: total % DAY };
}

/**
 * Seconds since the trip's first midnight.
 * @param {Clock} clock
 */
export function elapsed(clock) {
  return (clock.day - 1) * DAY + clock.s;
}
