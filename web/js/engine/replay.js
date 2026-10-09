// Replay and identity (BUILD_PLAN 6.6, 14.1 T0; GAME_DESIGN E.1, E.11, E.12).
//
// PURE. A trip is a pure function of (rules, seed, plan, profile snapshot,
// actions), so its log replays to the same final state everywhere: in a
// golden test, in tools/play.mjs --replay from a bug report, and in the
// phone's self-check. replay() folds the log from the trip's start, or from
// its base snapshot after a rebase, and returns the final trip hash and
// every screen shown; a refused action ends the fold with {at, code}.
// identity() is the hash of the packed log with its no-op actions removed
// (an action is a no-op when the trip's canonical JSON is the same before
// and after it), so identical runs share an identity however many no-ops
// they carry.

import { EngineError, isEngineError } from './error.js';
import { canon } from './canon.js';
import { sha256Hex } from './hash.js';
import { dispatch, screenOf, fromLogAction, hash12 } from './step.js';
import { pack, unpack, fromBase64url, checkLog } from './log.js';

/** The hiker a replay stands in: never hashed, never named. */
export const PLACEHOLDER_ID = 'h00000000';

/**
 * A log in any of its forms (JSON, packed bytes, base64url) as JSON.
 * @param {any} log
 * @returns {import('./log.js').Log}
 */
export function asLog(log) {
  if (typeof log === 'string') return unpack(fromBase64url(log));
  if (log instanceof Uint8Array) return unpack(log);
  return checkLog(log);
}

/**
 * The SHA-256 hex of a trip's canonical JSON.
 * @param {any} trip
 * @returns {string}
 */
export function tripHash(trip) {
  return sha256Hex(canon(trip));
}

/**
 * The session a log starts from: the trip's start (dispatching start for a
 * placeholder hiker with the profile), or its base snapshot.
 * @param {{log: any, profile: any, base?: any}} input
 * @param {import('./content.js').Content} content
 */
export function startOf({ log, profile, base = null }, content) {
  const json = asLog(log);
  if (json.rules !== content.rulesHash) throw new EngineError('rules', 'replay: the log was made under other rules', { want: json.rules, have: content.rulesHash });
  if (!profile || typeof profile !== 'object' || hash12(profile) !== json.profile) throw new EngineError('format', 'replay: the profile is not the one the log names');
  const hiker = { v: 1, id: PLACEHOLDER_ID, name: '', profile, trips: 0, latest: null };
  const header = { ...json, actions: [] };
  /** @type {import('./step.js').Session} */
  let session;
  if (json.base === '') {
    if (base) throw new EngineError('format', 'replay: a base snapshot for a log that names none');
    session = dispatch({ state: { v: 1, device: { v: 1 }, hiker, trip: null }, log: null, base: null }, { t: 'start', plan: json.plan, seed: json.seed }, content).session;
    if (canon(session.log) !== canon(header)) throw new EngineError('format', 'replay: the trip starts other than the log says');
  } else {
    if (!base || typeof base !== 'object' || hash12(base) !== json.base) throw new EngineError('format', 'replay: the base snapshot is not the one the log names');
    if (base.seed !== json.seed || base.plan !== json.plan || base.mode !== json.mode || base.rule !== json.rule || hash12(base.profile) !== json.profile) {
      throw new EngineError('format', 'replay: the base snapshot is another trip');
    }
    session = { state: { v: 1, device: { v: 1 }, hiker, trip: base }, log: header, base };
  }
  return { json, session };
}

/**
 * @typedef {object} Replayed
 * @property {any} state the final state
 * @property {string} hash the final trip's hash (64 hex)
 * @property {any[]} screens every screen shown, the first one included
 * @property {{at: number, code: string} | null} error where the fold stopped
 * @property {import('./step.js').Session} session the final session
 * @property {boolean[]} noops per accepted action: the trip didn't change
 */

/**
 * Fold a log from its start (or its base).
 * @param {{log: any, profile: any, base?: any}} input
 * @param {import('./content.js').Content} content
 * @returns {Replayed}
 */
export function replay(input, content) {
  const { json, session: start } = startOf(input, content);
  let session = start;
  const screens = [screenOf(session.state, content)];
  /** @type {boolean[]} */
  const noops = [];
  /** @type {{at: number, code: string} | null} */
  let error = null;
  let before = canon(session.state.trip);
  for (let i = 0; i < json.actions.length; i++) {
    try {
      const r = dispatch(session, fromLogAction(json.actions[i]), content);
      session = r.session;
      screens.push(r.screen);
      const after = canon(session.state.trip);
      noops.push(after === before);
      before = after;
    } catch (e) {
      if (!isEngineError(e)) throw e;
      error = { at: i, code: e.code };
      break;
    }
  }
  return { state: session.state, hash: tripHash(session.state.trip), screens, error, session, noops };
}

/**
 * A log's identity: the SHA-256 hex of its packed form with the no-op
 * actions removed and the string table rebuilt. A log a refusal stops
 * counts the actions before it.
 * @param {{log: any, profile: any, base?: any}} input
 * @param {import('./content.js').Content} content
 * @returns {string}
 */
export function identity(input, content) {
  const r = replay(input, content);
  const json = asLog(input.log);
  const kept = r.noops.map((noop, i) => (noop ? null : json.actions[i])).filter((a) => a !== null);
  return sha256Hex(pack({ ...json, actions: /** @type {any[]} */ (kept) }));
}
