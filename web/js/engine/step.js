// step(): the engine's one entry point (BUILD_PLAN 2.3, 14.2; GAME_DESIGN
// E.2, E.12).
//
// PURE. dispatch(session, action, content) checks the action against the
// phase and its screen, steps the state through the phase module, keeps the
// complete action log (every accepted trip action, no-ops included, E.12),
// and returns the new session and its screen. It never mutates its input
// and never returns a half state: a refusal throws EngineError.
//
//   Session = {state, log, base}
//   state   = {v: 1, device, hiker, trip}; the phase is derived (phaseOf)
//   log     = the trip's action log in its JSON form (log.js), or null
//   base    = the trip snapshot the log starts from after a rebase, or null
//
// The actions (codes 1 to 3 are the log's kinds, append-only):
//   {t: 'deal', seed}         hiker, at the lockbox (S7): its three questions
//   {t: 'answer', a}          hiker, at the lockbox: an answer, 0 to 2
//   {t: 'open'}               hiker, at the lockbox: Take the key
//   {t: 'sign', name, id}     hiker, in the guest book
//   {t: 'start', plan, seed}  hiker, at home: opens the trip and its log
//   {t: 'next'}               trip, 1: Walk on
//   {t: 'choose', c}          trip, 2: a choice on the screen
//   {t: 'wait', s}            trip, 3: whole seconds, 0 to 86,400 (wait 0 is the canonical no-op)

import { EngineError } from './error.js';
import { canon } from './canon.js';
import { sha256Hex } from './hash.js';
import { PHASES } from './phases/index.js';
import { HIKER_ID_RE, nameLength } from './phases/guestbook.js';
import { lockboxOpen } from './phases/lockbox.js';
import { SEED8_RE, CID_RE } from './trip.js';

/** The longest wait one action may hold. */
export const MAX_WAIT = 86400;

/**
 * @typedef {{state: any, log: any, base: any}} Session
 */

/** The device record's format (save.js; migrate.js brings a v1 forward). */
export const DEVICE_V = 2;

/**
 * The phase a state is in: the trip's, while one is under way; else the
 * lockbox while the device hasn't opened it (S7, lead call 53: once on
 * every phone, a fresh one first, one with a hiker at its next return
 * home); else home for a hiker, else the guest book.
 * @param {any} state
 * @returns {string}
 */
export function phaseOf(state) {
  if (state.trip && !state.trip.end) return state.trip.phase;
  if (!lockboxOpen(state.device)) return 'lockbox';
  return state.hiker ? 'home' : 'guestbook';
}

/**
 * The phase module for a state. Throws EngineError('unbuilt') for one a
 * later session builds.
 * @param {any} state
 */
function moduleOf(state) {
  const id = phaseOf(state);
  const mod = Object.prototype.hasOwnProperty.call(PHASES, id) ? PHASES[id] : null;
  if (!mod) throw new EngineError('state', 'step: no such phase');
  if (!mod.built) throw new EngineError('unbuilt', 'step: a phase a later session builds', { phase: id, lands: mod.lands });
  return mod;
}

/**
 * A fresh device: the lockbox shut, no hiker, no trip, no log. (The
 * content is the API's shape.)
 * @param {import('./content.js').Content} [_content]
 * @returns {Session}
 */
export function newSession(_content) {
  return { state: { v: 1, device: { v: DEVICE_V, quiz: null }, hiker: null, trip: null }, log: null, base: null };
}

/**
 * The screen for a state (at launch, on resume, and after every action).
 * @param {any} state
 * @param {import('./content.js').Content} content
 * @returns {import('./phase.js').Screen}
 */
export function screenOf(state, content) {
  return moduleOf(state).screen(state, content);
}

/**
 * @param {Record<string, unknown>} a
 * @param {string[]} keys
 */
const exactKeys = (a, keys) => {
  const ks = Object.keys(a);
  return ks.length === keys.length + 1 && keys.every((k) => Object.prototype.hasOwnProperty.call(a, k));
};

/**
 * An action's arguments, checked: a malformed one throws
 * EngineError('invalid'). Returns a plain copy.
 * @param {any} a
 * @param {import('./content.js').Content} content
 */
function checked(a, content) {
  const bad = () => new EngineError('invalid', 'step: malformed action arguments');
  switch (a.t) {
    case 'deal':
      if (!exactKeys(a, ['seed']) || typeof a.seed !== 'string' || !SEED8_RE.test(a.seed)) throw bad();
      return { t: 'deal', seed: a.seed };
    case 'answer':
      // The phase checks it against the question's answers (lockbox.js).
      if (!exactKeys(a, ['a']) || !Number.isSafeInteger(a.a) || a.a < 0) throw bad();
      return { t: 'answer', a: a.a };
    case 'open':
      if (!exactKeys(a, [])) throw bad();
      return { t: 'open' };
    case 'sign': {
      if (!exactKeys(a, ['name', 'id']) || typeof a.name !== 'string' || typeof a.id !== 'string' || !HIKER_ID_RE.test(a.id)) throw bad();
      const n = nameLength(a.name);
      if (n < 1 || n > content.profile.name_max) throw bad();
      return { t: 'sign', name: a.name, id: a.id };
    }
    case 'start':
      if (!exactKeys(a, ['plan', 'seed']) || typeof a.plan !== 'string' || !CID_RE.test(a.plan) || !content.plan(a.plan) || typeof a.seed !== 'string' || !SEED8_RE.test(a.seed)) throw bad();
      return { t: 'start', plan: a.plan, seed: a.seed };
    case 'next':
      if (!exactKeys(a, [])) throw bad();
      return { t: 'next' };
    case 'choose':
      if (!exactKeys(a, ['c']) || typeof a.c !== 'string' || !CID_RE.test(a.c)) throw bad();
      return { t: 'choose', c: a.c };
    case 'wait':
      if (!exactKeys(a, ['s']) || !Number.isSafeInteger(a.s) || a.s < 0 || a.s > MAX_WAIT) throw bad();
      return { t: 'wait', s: a.s === 0 ? 0 : a.s };
    default:
      throw new EngineError('refused', 'step: no such action');
  }
}

/**
 * A trip action in the log's JSON form: ['next'], ['choose', c], ['wait', s].
 * @param {{t: string, c?: string, s?: number}} a
 * @returns {(string | number)[]}
 */
export function toLogAction(a) {
  if (a.t === 'next') return ['next'];
  if (a.t === 'choose') return ['choose', /** @type {string} */ (a.c)];
  if (a.t === 'wait') return ['wait', /** @type {number} */ (a.s)];
  throw new EngineError('state', 'step: not a trip action');
}

/**
 * A logged action back as an action object.
 * @param {any[]} e
 * @returns {Record<string, unknown>}
 */
export function fromLogAction(e) {
  if (!Array.isArray(e)) throw new EngineError('format', 'step: a logged action is a list');
  if (e[0] === 'next' && e.length === 1) return { t: 'next' };
  if (e[0] === 'choose' && e.length === 2) return { t: 'choose', c: e[1] };
  if (e[0] === 'wait' && e.length === 2) return { t: 'wait', s: e[1] };
  throw new EngineError('format', 'step: not a logged action');
}

/**
 * The first 12 hex of the SHA-256 of a value's canonical JSON.
 * @param {unknown} v
 */
export const hash12 = (v) => sha256Hex(canon(v)).slice(0, 12);

/**
 * A new log for a trip that just started (log.js's JSON form).
 * @param {any} trip
 * @param {import('./content.js').Content} content
 */
export function newLog(trip, content) {
  return { format: 1, rules: content.rulesHash, mode: trip.mode, rule: trip.rule, seed: trip.seed, plan: trip.plan, profile: hash12(trip.profile), base: '', actions: [] };
}

/**
 * Step the state by one action. Pure: returns {session, screen}, or throws
 * EngineError (refused: not on the screen; invalid: malformed arguments;
 * unbuilt: a later session's phase; expr, state).
 * @param {Session} session
 * @param {any} action
 * @param {import('./content.js').Content} content
 * @returns {{session: Session, screen: import('./phase.js').Screen}}
 */
export function dispatch(session, action, content) {
  const { state } = session;
  const mod = moduleOf(state);
  if (!action || typeof action !== 'object' || Array.isArray(action) || typeof action.t !== 'string' || !mod.accepts.includes(action.t)) {
    throw new EngineError('refused', 'step: the phase does not take that action');
  }
  const act = checked(action, content);
  let next = mod.step(state, act, content);
  // Entering a new phase (a trip starting, a trip ending, a hiker signing).
  if (phaseOf(next) !== phaseOf(state)) next = moduleOf(next).enter(next, content);
  let { log, base } = session;
  if (act.t === 'start') {
    log = newLog(next.trip, content);
    base = null;
  } else if (mod.level === 'trip') {
    if (!log) throw new EngineError('state', 'step: a trip with no log');
    log = { ...log, actions: [...log.actions, toLogAction(act)] };
  }
  if ((act.t === 'start' || mod.level === 'trip') && next.hiker) {
    // E.6: the hiker record holds each trip's latest stop number.
    next = { ...next, hiker: { ...next.hiker, latest: { seed: next.trip.seed, stop: next.trip.n } } };
  }
  return { session: { state: next, log, base }, screen: screenOf(next, content) };
}
