// The replay self-check's runner (BUILD_PLAN S3, 6.6, 14.1 T0; GAME_DESIGN
// E.11, E.12).
//
// PURE, synchronous, no timing (the UI times it). The build writes a corpus
// (selfcheck.json: the frozen engine fixture, the golden trips' inputs, and
// vectors for SHA-256, the streams, the math and the expressions) together
// with the group hashes Node gets running this same file over it. The phone
// runs it too and compares, group by group, so every build is checked on a
// real iPhone's JavaScript engine, with no Mac.
//
// runSelfCheck(corpus) -> {groups: {sha, rng, math, expr, log, trips, screens}}
// Each group is the SHA-256 hex of the canonical JSON of:
//   sha      every vector's digest
//   rng      every vector's u32s, int(7)s and floats (three generators on the same key)
//   math     every result's IEEE bits as 16 hex digits (or an error code)
//   expr     every [syntax tree, result] (or an error code)
//   log      every golden log packed (hex), and 1 when unpack(pack(x)) is x
//   trips    every golden's [name, final hash, identity], or [name, error code]
//   screens  every golden's [name, SHA-256 of its screens' canonical JSON]
//
// A golden trip input: {name, log, profile, base, first?, resume?}
//   log, profile, base  as replay() takes them (base null for a log from the start)
//   first: {name, id}   play it from a fresh device: sign, start, then the log
//   resume: k           save after k actions (toSaves, JSON, fromSaves), then the rest

import { EngineError, isEngineError } from './error.js';
import { canon } from './canon.js';
import { sha256Hex, asciiBytes, toHex } from './hash.js';
import { draw } from './rng.js';
import { exp, ln, pow, sin, cos } from './math.js';
import { parse, compile } from './expr.js';
import { loadContent } from './content.js';
import { newSession, dispatch, screenOf, fromLogAction } from './step.js';
import { pack, unpack } from './log.js';
import { replay, identity, asLog, tripHash } from './replay.js';
import { toSaves, fromSaves } from './save.js';

/** The groups, in the order the debug menu and the report list them. */
export const GROUPS = Object.freeze(['sha', 'rng', 'math', 'expr', 'log', 'trips', 'screens']);

/** @param {unknown} v */
const digest = (v) => sha256Hex(canon(v));

/**
 * A double's bits as 16 hex digits.
 * @param {number} x
 */
export function bitsHex(x) {
  const dv = new DataView(new ArrayBuffer(8));
  dv.setFloat64(0, x);
  return toHex(new Uint8Array(dv.buffer));
}

/**
 * An error's code, for a group's record (a non-engine error is a bug, and
 * propagates).
 * @param {unknown} e
 */
function codeOf(e) {
  if (isEngineError(e)) return `!${e.code}`;
  throw e;
}

/**
 * Run one golden trip: its final hash, identity, packed log, screens hash
 * and error, as goldens record them.
 * @param {any} trip
 * @param {import('./content.js').Content} content
 * @returns {{hash: string, identity: string | null, packed: string, screens: string, error: {at: number, code: string} | null}}
 */
export function runTrip(trip, content) {
  const log = asLog(trip.log);
  const input = { log, profile: trip.profile, base: trip.base || null };
  const packed = toHex(pack(log));
  if (trip.first) {
    // From a fresh device: sign, start, then the log's actions.
    let session = newSession(content);
    const screens = [screenOf(session.state, content)];
    let error = null;
    const acts = [{ t: 'sign', name: trip.first.name, id: trip.first.id }, { t: 'start', plan: log.plan, seed: log.seed }, ...log.actions.map(fromLogAction)];
    for (let i = 0; i < acts.length; i++) {
      try {
        const r = dispatch(session, acts[i], content);
        session = r.session;
        screens.push(r.screen);
      } catch (e) {
        if (!isEngineError(e)) throw e;
        error = { at: i, code: e.code };
        break;
      }
    }
    const hiker = session.state.hiker;
    return {
      hash: tripHash(session.state.trip),
      identity: error ? null : identity({ log: session.log, profile: session.state.trip.profile, base: null }, content),
      packed: session.log ? toHex(pack(session.log)) : packed,
      screens: digest({ screens, hiker: hiker ? { trips: hiker.trips, latest: hiker.latest } : null }),
      error,
    };
  }
  if (Number.isSafeInteger(trip.resume)) {
    // Save after k actions, through JSON, and go on from the saves.
    const k = trip.resume;
    const head = replay({ ...input, log: { ...log, actions: log.actions.slice(0, k) } }, content);
    const saves = JSON.parse(JSON.stringify(toSaves(head.session)));
    let session = fromSaves(saves, content);
    const screens = [...head.screens];
    let error = head.error;
    for (let i = k; i < log.actions.length && !error; i++) {
      try {
        const r = dispatch(session, fromLogAction(log.actions[i]), content);
        session = r.session;
        screens.push(r.screen);
      } catch (e) {
        if (!isEngineError(e)) throw e;
        error = { at: i, code: e.code };
      }
    }
    // The identity and the packed log are the resumed session's own, so a
    // load that lost or changed the log can't match the uninterrupted trip.
    const carried = { log: session.log, profile: session.state.trip.profile, base: session.base || null };
    return { hash: tripHash(session.state.trip), identity: error ? null : identity(carried, content), packed: session.log ? toHex(pack(session.log)) : '', screens: digest(screens), error };
  }
  const r = replay(input, content);
  return { hash: r.hash, identity: identity(input, content), packed, screens: digest(r.screens), error: r.error };
}

/**
 * Run the self-check over a corpus.
 * @param {any} corpus selfcheck.json
 * @returns {{groups: Record<string, string>}}
 */
export function runSelfCheck(corpus) {
  const vectors = (corpus && corpus.vectors) || {};
  /** @type {Record<string, string>} */
  const groups = {};

  // sha: digests of ASCII strings.
  groups.sha = digest((vectors.sha || []).map((/** @type {string} */ s) => sha256Hex(asciiBytes(s))));

  // rng: three generators per vector, on the same key.
  groups.rng = digest(
    (vectors.rng || []).map((/** @type {any} */ v) => {
      const n = v.n;
      const a = draw(v.seed, v.stream, ...v.key);
      const b = draw(v.seed, v.stream, ...v.key);
      const c = draw(v.seed, v.stream, ...v.key);
      const out = { u32: /** @type {number[]} */ ([]), int7: /** @type {number[]} */ ([]), float: /** @type {number[]} */ ([]) };
      for (let i = 0; i < n; i++) {
        out.u32.push(a.u32());
        out.int7.push(b.int(7));
        out.float.push(c.float());
      }
      return out;
    }),
  );

  // math: the bits of every result.
  const m = vectors.math || {};
  /** @type {Record<string, string[]>} */
  const bits = {};
  /** @type {[string, (x: any) => number][]} */
  const fns = [
    ['exp', (x) => exp(x)],
    ['ln', (x) => ln(x)],
    ['pow', (xy) => pow(xy[0], xy[1])],
    ['sin', (x) => sin(x)],
    ['cos', (x) => cos(x)],
  ];
  for (const [name, f] of fns) {
    bits[name] = (m[name] || []).map((/** @type {any} */ x) => {
      try {
        return bitsHex(f(x));
      } catch (e) {
        return codeOf(e);
      }
    });
  }
  groups.math = digest(bits);

  // expr: each source parsed, compiled and run.
  groups.expr = digest(
    (vectors.expr || []).map((/** @type {any} */ [src, env]) => {
      try {
        const ast = parse(src);
        const e = env || {};
        const flags = new Set(e.flags || []);
        const seen = new Set(e.seen || []);
        const vars = e.vars || {};
        const value = compile(ast)({
          v: (p) => {
            if (!Object.prototype.hasOwnProperty.call(vars, p)) throw new EngineError('expr', 'selfcheck: a vector reads a var it does not give');
            return vars[p];
          },
          flag: (id) => flags.has(id),
          seen: (id) => seen.has(id),
        });
        return [ast, value];
      } catch (err) {
        return codeOf(err);
      }
    }),
  );

  // The golden trips, on the fixture.
  const trips = (corpus && corpus.trips) || [];
  const fx = corpus && corpus.fixture;
  const content = fx ? loadContent({ rules: fx.rules, voice: fx.voice, rulesHash: fx.rulesHash }) : null;
  groups.log = digest(
    trips.map((/** @type {any} */ t) => {
      try {
        const log = asLog(t.log);
        const bytes = pack(log);
        return [toHex(bytes), canon(unpack(bytes)) === canon(log) ? 1 : 0];
      } catch (e) {
        return codeOf(e);
      }
    }),
  );
  /** @type {any[]} */
  const ran = [];
  /** @type {any[]} */
  const shown = [];
  for (const t of trips) {
    try {
      if (!content) throw new EngineError('format', 'selfcheck: the corpus has no fixture');
      const r = runTrip(t, content);
      ran.push(r.error ? [t.name, r.hash, r.error.code, r.error.at] : [t.name, r.hash, r.identity]);
      shown.push([t.name, r.screens]);
    } catch (e) {
      ran.push([t.name, codeOf(e)]);
      shown.push([t.name, null]);
    }
  }
  groups.trips = digest(ran);
  groups.screens = digest(shown);
  return { groups };
}
