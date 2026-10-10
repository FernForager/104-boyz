// The trip state and the moves every trip phase shares (BUILD_PLAN 2.3;
// GAME_DESIGN E.1, E.6, 8.14).
//
// PURE. The trip state (v1) is everything a trip's outcome depends on, and
// all of it is hashed (save.js tripHash):
//   {v, mode, rule, seed, plan, profile, phase, set, stop, n, clock,
//    flags, attempts, end}
// and, only just after a rolled choice (S6), rolled: {stop, c, band}, the
// stop and choice rolled and the band it landed in (the compass's), which
// the next move clears; a trip that never rolled hashes as before. It
// never holds the hiker's name. Every function returns a new state and
// never mutates its input.

import { EngineError } from './error.js';
import { profileSnapshot, standardProfile } from './standard.js';

/** A trip seed: 8 characters of Crockford base32, 40 bits (E.8). */
export const SEED8_RE = /^[0-9A-HJKMNP-TV-Z]{8}$/;
/** A content id: a plan, a stop set, a stop, a choice, a flag. */
export const CID_RE = /^[a-z][a-z0-9_]*$/;
/** The modes, in the log's order (append-only). */
export const MODES = Object.freeze(['open', 'daily', 'fkt']);
/** The rules a trip rolls under (8.14: the gentle mode rolls its own dice), in the log's order. */
export const RULES = Object.freeze(['oldschool', 'gentle']);

/**
 * The state with its trip replaced.
 * @param {any} state
 * @param {any} trip
 */
export const withTrip = (state, trip) => ({ ...state, trip });

/**
 * Open a trip: the plan's start, the hiker's profile snapshot (the
 * standard profile in a timed mode), stop 1. The UI drew the seed (E.8,
 * Lead call 8); the engine draws nothing.
 * @param {any} state
 * @param {string} planId
 * @param {string} seed
 * @param {import('./content.js').Content} content
 */
export function startTrip(state, planId, seed, content) {
  const plan = content.plan(planId);
  if (!plan) throw new EngineError('invalid', 'trip: no such plan');
  if (!SEED8_RE.test(seed)) throw new EngineError('invalid', 'trip: a seed is 8 characters of Crockford base32');
  const set = content.set(plan.start.set);
  if (!set) throw new EngineError('state', 'trip: the plan starts at a set the rules lack');
  if (!MODES.includes(plan.mode)) throw new EngineError('state', 'trip: no such mode');
  const profile = plan.mode === 'open' ? profileSnapshot(state.hiker, content) : standardProfile(content);
  const trip = {
    v: 1,
    mode: plan.mode,
    rule: 'oldschool',
    seed,
    plan: planId,
    profile,
    phase: set.phase,
    set: plan.start.set,
    stop: set.first,
    n: 1,
    clock: { day: plan.start.day, s: plan.start.s },
    flags: {},
    attempts: {},
    end: null,
  };
  return withTrip(state, trip);
}

/**
 * A trip without its last roll (S6: trip.rolled lasts until the next move).
 * @param {any} t
 */
const unrolled = (t) => {
  if (!Object.prototype.hasOwnProperty.call(t, 'rolled')) return t;
  const { rolled, ...rest } = t;
  return rest;
};

/**
 * The next stop in the set: n goes up by one, and the last roll is cleared.
 * @param {any} state
 * @param {import('./content.js').Content} content
 * @param {string} stop
 */
export function moveTo(state, content, stop) {
  const t = state.trip;
  if (!content.stop(t.set, stop)) throw new EngineError('state', 'trip: no such stop in the set');
  return withTrip(state, { ...unrolled(t), stop, n: t.n + 1 });
}

/**
 * The set's end: the plan's `after`. S3's plans end there ("end"): the
 * trip is over, and the hiker has one more trip. A death (S6's stand-in
 * for S24a's sequence, GAME_DESIGN 9.5) ends it too, and the hiker with
 * it: the state keeps no hiker, so the guest book asks for a new one.
 * @param {any} state
 * @param {import('./content.js').Content} content
 * @param {{died?: boolean}} [o]
 */
export function endOfSet(state, content, { died = false } = {}) {
  const t = state.trip;
  const plan = content.plan(t.plan);
  if (!plan) throw new EngineError('state', 'trip: no such plan');
  if (plan.after !== 'end') throw new EngineError('unbuilt', 'trip: only "end" follows a set in S3');
  const hiker = died ? null : state.hiker ? { ...state.hiker, trips: state.hiker.trips + 1 } : state.hiker;
  return { ...state, hiker, trip: { ...unrolled(t), end: t.plan } };
}

/**
 * What an expression may read of a trip (schemas/vars.json).
 * @param {any} trip
 * @returns {import('./expr.js').Env}
 */
export function exprEnv(trip) {
  const own = (/** @type {any} */ o, /** @type {string} */ k) => Object.prototype.hasOwnProperty.call(o, k);
  return {
    v(path) {
      if (path === 'trip.day') return trip.clock.day;
      if (path === 'trip.n') return trip.n;
      if (path === 'clock.s') return trip.clock.s;
      if (path.startsWith('skill.')) {
        const k = path.slice(6);
        if (own(trip.profile.skills, k)) return trip.profile.skills[k];
      }
      throw new EngineError('expr', 'trip: an expression reads a variable the trip lacks');
    },
    flag: (id) => own(trip.flags, id) && trip.flags[id] === true,
    seen: (id) => own(trip.profile.seen, id),
  };
}
