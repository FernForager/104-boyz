// Saves: a snapshot plus the complete action log plus the profile snapshot
// (BUILD_PLAN 2.3, 6.6 save; GAME_DESIGN E.1, E.6, E.11, 8.14).
//
// PURE. Three records, each stored by platform/storage.js under its
// channel's own key (oph.<channel>.device, .hiker, .trip; lint S01):
//   device  {v: 2, quiz}                 S7: the lockbox's quiz, null while the
//           box is shut, then {seed, dealt, answers, done} (phases/lockbox.js);
//           a v1 record migrates with the box shut (migrate.js). The settings
//           and the register join later
//   hiker   {v: 1, id, name, profile, trips, latest: {seed, stop} | null}
//   trip    {v: 1, rules, log, profile, base, snapshot, hash}
//           log: the packed log as base64url; base: null, or the snapshot a
//           rebased log starts from; hash: tripHash(snapshot)
// Loads use the snapshot (E.6). If its hash is wrong and the rules are the
// current ones, the log rebuilds it; if that fails too, the load throws
// EngineError('format') and the error sheet shows: nothing is ever
// silently deleted. A trip saved under other rules keeps its snapshot, and
// its log restarts from there (a rebase), so every bug report replays on
// the rules it names. Two trips can't go on at all, and the load throws
// EngineError('format') with detail {trip: why}, so the UI can close the
// trip (kept, never deleted) instead of looping on the error sheet: one
// older than the hiker record's mark for it ('stale': E.6, nothing quietly
// undoes a choice), and an open one whose plan, set or stop this build's
// content no longer has ('missing').
//
// The name never leaves the hiker record: reportState writes it as
// {HIKER} with its length, so a pasted report names nobody.

import { EngineError, isEngineError } from './error.js';
import { canon } from './canon.js';
import { phaseOf, hash12, DEVICE_V } from './step.js';
import { pack, unpack, toBase64url, fromBase64url } from './log.js';
import { replay, tripHash } from './replay.js';
import { migrate } from './migrate.js';
import { nameLength } from './phases/guestbook.js';
import { progress } from './phases/lockbox.js';

export { tripHash };

/** How many of the last actions a bug report spells out for a human (E.11). */
export const REPORT_LAST = 20;
/** The name, as a report writes it. */
export const HIKER_TOKEN = '{HIKER}';

/**
 * A plain copy of a JSON-able record (the hiker's name may be any text, so
 * not through canonical JSON).
 * @param {any} v
 */
const copy = (v) => (v === null || v === undefined ? null : JSON.parse(JSON.stringify(v)));

/** A device record with the lockbox shut: a fresh phone's. */
const freshDevice = () => ({ v: DEVICE_V, quiz: null });

/**
 * True when a snapshot is the trip its log's header names.
 * @param {any} snapshot
 * @param {import('./log.js').Log} log
 */
function sameTrip(snapshot, log) {
  try {
    return snapshot.seed === log.seed && snapshot.plan === log.plan && snapshot.mode === log.mode && snapshot.rule === log.rule && hash12(snapshot.profile) === log.profile;
  } catch {
    return false;
  }
}

/**
 * Why an open trip can't go on under this content, or null when it can:
 * 'plan', 'set' or 'stop', the first of its places the content lacks. An
 * ended trip needs none of them (it opens home).
 * @param {any} trip
 * @param {import('./content.js').Content} content
 * @returns {string | null}
 */
export function misfit(trip, content) {
  if (!trip || trip.end) return null;
  if (!content.plan(trip.plan)) return 'plan';
  if (trip.set === undefined || trip.set === null) return null;
  if (!content.set(trip.set)) return 'set';
  if (!content.stop(trip.set, trip.stop)) return 'stop';
  return null;
}

/**
 * The three records to store; trip is null with no trip.
 * @param {import('./step.js').Session} session
 * @returns {{device: any, hiker: any, trip: any}}
 */
export function toSaves(session) {
  const { state, log, base } = session;
  let trip = null;
  if (state.trip) {
    if (!log) throw new EngineError('state', 'save: a trip with no log');
    trip = {
      v: 1,
      rules: log.rules,
      log: toBase64url(pack(log)),
      profile: copy(state.trip.profile),
      base: base ? copy(base) : null,
      snapshot: copy(state.trip),
      hash: tripHash(state.trip),
    };
  }
  return { device: copy(state.device) || freshDevice(), hiker: copy(state.hiker), trip };
}

/**
 * A session from the stored records (any may be null): migrated, the
 * snapshot verified (and rebuilt from the log when it can be), the log
 * rebased when the rules changed, and the hiker's latest stop reconciled
 * up to the trip's (a write cut off between the trip and the hiker). A trip
 * older than the hiker's mark for it, or one this content can't place,
 * throws EngineError('format') with detail {trip: 'stale' | 'missing'}.
 * @param {{device?: any, hiker?: any, trip?: any}} saves
 * @param {import('./content.js').Content} content
 * @returns {import('./step.js').Session}
 */
export function fromSaves({ device = null, hiker = null, trip = null }, content) {
  const dev = migrate('device', device) || freshDevice();
  let hk = migrate('hiker', hiker);
  const rec = migrate('trip', trip);
  if (!rec) return { state: { v: 1, device: dev, hiker: hk, trip: null }, log: null, base: null };
  if (typeof rec.log !== 'string' || typeof rec.hash !== 'string' || !rec.snapshot || typeof rec.snapshot !== 'object' || !rec.profile) {
    throw new EngineError('format', 'save: a trip record missing its parts');
  }
  let log = unpack(fromBase64url(rec.log));
  let base = rec.base || null;
  if (rec.rules !== log.rules) throw new EngineError('format', "save: the record's rules are not its log's");
  const current = log.rules === content.rulesHash;
  let snapshot = rec.snapshot;
  let ok = false;
  try {
    ok = tripHash(snapshot) === rec.hash;
  } catch (e) {
    if (!isEngineError(e)) throw e;
  }
  if (!ok) {
    if (!current) throw new EngineError('format', 'save: a damaged snapshot under other rules');
    let r = null;
    try {
      r = replay({ log, profile: rec.profile, base }, content);
    } catch {
      r = null; // a log that can't replay can't repair anything
    }
    if (!r || r.error || r.hash !== rec.hash) throw new EngineError('format', 'save: the snapshot and its log both fail to verify');
    snapshot = r.state.trip;
  }
  if (!sameTrip(snapshot, log)) throw new EngineError('format', 'save: the snapshot is another trip than its log');
  if (hk && hk.latest && hk.latest.seed === snapshot.seed && hk.latest.stop > snapshot.n) {
    // E.6: the hiker record holds each trip's latest stop; a trip save older
    // than that is refused, never resumed at an earlier stop.
    throw new EngineError('format', "save: the trip is older than the hiker's mark for it", { trip: 'stale', stop: snapshot.n, mark: hk.latest.stop });
  }
  const lacks = misfit(snapshot, content);
  if (lacks) throw new EngineError('format', "save: the trip's place is not in this build's content", { trip: 'missing', lacks });
  if (!current) {
    // Call 4: a rules change rebases the log on the snapshot.
    base = snapshot;
    log = { ...log, rules: content.rulesHash, base: hash12(snapshot), actions: [] };
  }
  if (hk) {
    const at = hk.latest;
    if (!at || at.seed !== snapshot.seed || at.stop < snapshot.n) hk = { ...hk, latest: { seed: snapshot.seed, stop: snapshot.n } };
  }
  return { state: { v: 1, device: dev, hiker: hk, trip: snapshot }, log, base };
}

/**
 * A logged action spelled out: "next", "choose go", "wait 600".
 * @param {(string | number)[]} a
 */
export const spell = (a) => a.join(' ');

/**
 * The bug report's `state` field (E.11): the phase, the device (its format
 * and the lockbox's progress: the questions dealt, how many answered and
 * right, done; S7), the hiker without a
 * name ({HIKER} and its length in code points), and the trip: seed, plan,
 * stop number, the packed log, the profile and base snapshots, the hash,
 * the last 20 actions spelled out, and the snapshot (which a long report
 * drops first: a replay rebuilds it). Never throws: a part that can't be
 * made is null.
 * @param {import('./step.js').Session} session
 * @param {import('./content.js').Content} [content] the build's: the quiz, to count the right answers
 */
export function reportState(session, content) {
  const { state, log, base } = session;
  const safe = (/** @type {() => any} */ f) => {
    try {
      return f();
    } catch {
      return null;
    }
  };
  const h = state.hiker;
  const t = state.trip;
  const d = state.device;
  const quiz = safe(() => (content && typeof content.quiz === 'function' ? content.quiz() : null));
  return {
    phase: safe(() => phaseOf(state)),
    device: d
      ? {
          v: d.v,
          quiz: d.quiz
            ? safe(() => {
                const p = progress(d.quiz, quiz);
                return { dealt: d.quiz.dealt.slice(), answered: p.answered, right: p.right, done: d.quiz.done === true };
              })
            : null,
        }
      : null,
    hiker: h ? { id: h.id, name: HIKER_TOKEN, chars: safe(() => nameLength(String(h.name))), trips: h.trips } : null,
    trip: t
      ? {
          seed: t.seed,
          plan: t.plan,
          stop: t.n,
          log: safe(() => toBase64url(pack(log))),
          profile: safe(() => JSON.parse(canon(t.profile))),
          base: base ? safe(() => JSON.parse(canon(base))) : null,
          hash: safe(() => tripHash(t)),
          last: log && Array.isArray(log.actions) ? log.actions.slice(-REPORT_LAST).map(spell) : [],
          snapshot: safe(() => JSON.parse(canon(t))),
        }
      : null,
  };
}
