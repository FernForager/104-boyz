#!/usr/bin/env node
// The harness (BUILD_PLAN 6.5, 7.1, S3; GAME_DESIGN E.9, F.2). S3 builds its
// skeleton and the smoke run that gates every deploy:
//
//   node tools/sim.mjs --smoke 1000 [--workers k]   (npm run sim:smoke, in npm run ci)
//   node tools/sim.mjs --matrix                     (S15b: the plan library and the 7.3 targets)
//
// The smoke run plays N trips through the real engine, headless: every
// content file under content/, compiled in memory for every screen it names
// (so content still waiting for its screen in the scope file is tested
// too), on 9 trips in 10, and the frozen engine fixture on the 10th. Trip
// i's seed is the Crockford base32 of the first 40 bits of
// hash128('smoke|' + i): no Math.random in a tool that gates CI, and no
// statistics either, so CI never fails at random (E.9). Each trip, from a
// fresh device: sign (a name from a list of edge cases), start (the plans in
// turn, with the seed, as the home screen's auto start does), then the
// random bot (sims/bots.mjs: it sees only the screen) until the trip ends
// or 200 actions. Every 50th trip also tries an action that isn't on the
// screen, which must be refused.
//
// The checks, each failure naming the trip, its seed and the check:
//   crash        an exception other than the expected refusal
//   dead end     a screen of an unfinished trip with no enabled choice, no Walk on and no auto
//   stuck        no end within 200 actions
//   determinism  replay of the log gives the final hash, twice
//   packing      pack, unpack, pack is byte for byte, and base64url round-trips
//   resume       a save at a random action (toSaves, JSON, fromSaves) goes on to the same final hash,
//                and the log the resumed session carries replays to it
//   template     on the live content, every line a screen names is a line in content/text
//                (a line on a screen the scope doesn't have yet may wait for its words, as T11
//                lets it; the summary counts those); the fixture's fx.* ids are never rendered
//   refusal      the planted off-screen action wasn't refused
//
// --workers k (default min(4, cpus)) splits the trips over worker_threads;
// the summary is the same for any k. It prints one line and writes
// out/sim/smoke.json; exit 1 on any failure.

import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { availableParallelism } from 'node:os';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './pics.mjs';
import { compileContent, readSources } from './content.mjs';
import { sourceRulesHash } from './rules.mjs';
import { readText } from './text.mjs';
import { fixtureContent } from './goldens.mjs';
import { canon } from '../web/js/engine/canon.js';
import { hash128 } from '../web/js/engine/rng.js';
import { isEngineError } from '../web/js/engine/error.js';
import { loadContent } from '../web/js/engine/content.js';
import { newSession, dispatch, fromLogAction } from '../web/js/engine/step.js';
import { replay, tripHash } from '../web/js/engine/replay.js';
import { toSaves, fromSaves } from '../web/js/engine/save.js';
import { pack, unpack, toBase64url, fromBase64url } from '../web/js/engine/log.js';
import { varsOf } from '../web/js/engine/template.js';
import { botGen, random } from '../sims/bots.mjs';

/** Actions a trip may take before it counts as stuck. */
export const MAX_ACTIONS = 200;
/** One trip in this many plays the engine fixture. */
export const FIXTURE_EVERY = 10;
/** One trip in this many plants an action that isn't on the screen. */
export const PROBE_EVERY = 50;
/** The guest book's names: 1 and 12 code points, emoji, combining marks, the report's token, spaces. */
export const NAMES = Object.freeze(['A', 'Abcdefghijkl', '\u{1F97E}\u{1F332}⛰️', 'Zoë', '{HIKER}', '\u{1F332}'.repeat(12), 'Mary Ann', 'Rémi-Éloïse']);
/** The off-screen action the probe tries. */
const PROBE = Object.freeze({ t: 'choose', c: 'zz_not_on_screen' });

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Trip i's seed: the Crockford base32 of the first 40 bits of hash128('smoke|' + i).
 * @param {number} i
 */
export function smokeSeed(i) {
  const [a, b] = hash128(`smoke|${i}`);
  let v = a * 256 + (b >>> 24);
  let s = '';
  for (let k = 0; k < 8; k++) {
    s = CROCKFORD[v % 32] + s;
    v = Math.floor(v / 32);
  }
  return s;
}

/**
 * The live content: every file under content/, compiled for every screen
 * any of them names; and the lines content/text defines, with the screens
 * the scope has, for the template check.
 * @param {string} [root]
 */
export function liveContext(root = ROOT) {
  /** @type {Map<string, string>} */
  const setScreens = new Map();
  const screens = new Set();
  for (const s of readSources(root)) {
    if (s.folder === 'rules') continue;
    const data = JSON.parse(s.src);
    if (typeof data.screen === 'string') screens.add(data.screen);
    if (s.folder === 'stops') setScreens.set(data.id, data.screen);
  }
  const { rules, voice, problems } = compileContent({ root, screens: [...screens].sort(), checkText: false });
  const errors = problems.filter((p) => p.level !== 'warn');
  if (errors.length) throw new Error(`sim: the content doesn't compile:\n  ${errors.map((p) => `${p.file}:${p.line}: ${p.code} ${p.msg}`).join('\n  ')}`);
  const content = loadContent({ rules, voice, rulesHash: sourceRulesHash({ root, rulesJson: `${canon(rules)}\n` }) });
  const text = readText(root, { strict: false });
  /** @type {Map<string, string[]>} */
  const lines = new Map();
  for (const [id, l] of text.lines) lines.set(id, varsOf(l.text));
  return { kind: 'live', content, lines, setScreens, scopeScreens: new Set(text.scope.screens) };
}

/** The fixture's context: its lines are never rendered, so it has no template check. */
export function fixtureContext() {
  return { kind: 'fixture', content: fixtureContent(), lines: null, setScreens: new Map(), scopeScreens: new Set() };
}

/**
 * The template check over one screen: every Ref (the box, and choice
 * labels) is a defined line with the vars its words use. Returns
 * {bad: [msg], waiting: [id]}.
 * @param {any} screen
 * @param {ReturnType<typeof liveContext>} ctx
 */
export function checkTemplates(screen, ctx) {
  /** @type {string[]} */
  const bad = [];
  /** @type {string[]} */
  const waiting = [];
  if (!ctx.lines) return { bad, waiting };
  const refs = [...(screen.box || []), ...(screen.choices || []).map((/** @type {any} */ c) => c.label).filter(Boolean)];
  const setScreen = screen.stop ? ctx.setScreens.get(screen.stop.set) : null;
  for (const r of refs) {
    const want = ctx.lines.get(r.id);
    if (!want) {
      if (setScreen && !ctx.scopeScreens.has(setScreen)) waiting.push(r.id);
      else bad.push(`${r.id} is not a line in content/text`);
      continue;
    }
    const given = Object.keys(r.vars || {});
    const missing = want.filter((v) => !given.includes(v));
    if (missing.length) bad.push(`${r.id} needs {${missing.join('}, {')}}`);
  }
  return { bad, waiting };
}

/**
 * Does a screen offer a way on: an enabled choice (Walk on is one) or an auto action?
 * @param {any} screen
 */
const offersMove = (screen) => Boolean(screen.auto) || (screen.choices || []).some((/** @type {any} */ c) => c.enabled);

/**
 * @typedef {object} TripResult
 * @property {number} i
 * @property {string} seed
 * @property {'live' | 'fixture'} kind
 * @property {number} actions every action dispatched (sign and start included)
 * @property {boolean} ended
 * @property {string[]} waiting line ids waiting for their screen's words
 * @property {boolean} probed
 * @property {{check: string, msg: string}[]} failures
 */

/**
 * Play smoke trip i and check it.
 * @param {number} i
 * @param {{live: any, fixture: any}} contexts
 * @returns {TripResult}
 */
export function smokeTrip(i, contexts) {
  const ctx = i % FIXTURE_EVERY === FIXTURE_EVERY - 1 ? contexts.fixture : contexts.live;
  const { content } = ctx;
  const seed = smokeSeed(i);
  const gen = botGen(`bot|${i}`);
  /** @type {TripResult} */
  const result = { i, seed, kind: ctx.kind, actions: 0, ended: false, waiting: [], probed: false, failures: [] };
  const fail = (/** @type {string} */ check, /** @type {string} */ msg) => result.failures.push({ check, msg });
  const waiting = new Set();
  const look = (/** @type {any} */ screen) => {
    const t = checkTemplates(screen, ctx);
    for (const m of t.bad) fail('template', m);
    for (const id of t.waiting) waiting.add(id);
  };
  let session = newSession(content);
  /** @type {any} */
  let screen;
  const act = (/** @type {any} */ action) => {
    const r = dispatch(session, action, content);
    session = r.session;
    screen = r.screen;
    result.actions++;
    look(screen);
  };
  try {
    screen = (() => {
      const s = dispatch(session, { t: 'sign', name: NAMES[i % NAMES.length], id: `h${seed}` }, content);
      session = s.session;
      result.actions++;
      return s.screen;
    })();
    if (!screen.auto) {
      fail('dead end', 'home offers no start');
      return result;
    }
    const plans = content.plans();
    act({ t: 'start', plan: plans[i % plans.length], seed });
    const probeAt = i % PROBE_EVERY === 0 ? 0 : -1;
    const saveAfter = gen.int(6);
    /** @type {any} */
    let saves = null;
    let savedAt = 0;
    for (let n = 0; ; n++) {
      if (session.state.trip.end) {
        result.ended = true;
        break;
      }
      if (n === saveAfter) {
        saves = JSON.parse(JSON.stringify(toSaves(session)));
        savedAt = session.log.actions.length;
      }
      if (n >= MAX_ACTIONS) {
        fail('stuck', `no end after ${MAX_ACTIONS} actions (at ${session.state.trip.set}.${session.state.trip.stop})`);
        break;
      }
      if (!offersMove(screen)) {
        fail('dead end', `${session.state.trip.set}.${session.state.trip.stop} offers nothing`);
        break;
      }
      if (n === probeAt) {
        result.probed = true;
        try {
          dispatch(session, PROBE, content);
          fail('refusal', `an off-screen action was taken at ${session.state.trip.stop}`);
        } catch (e) {
          if (!isEngineError(e) || e.code !== 'refused') throw e;
        }
      }
      const action = random(screen, gen);
      if (!action) {
        fail('dead end', `the bot found nothing to do at ${session.state.trip.stop}`);
        break;
      }
      act(action);
    }
    if (!saves) {
      saves = JSON.parse(JSON.stringify(toSaves(session)));
      savedAt = session.log.actions.length;
    }
    const trip = session.state.trip;
    const hash = tripHash(trip);
    const input = { log: session.log, profile: trip.profile, base: null };
    // Determinism: the log replays to the final hash, twice.
    for (let k = 0; k < 2; k++) {
      const r = replay(input, content);
      if (r.error) fail('determinism', `replay ${k + 1} stopped at action ${r.error.at}: ${r.error.code}`);
      else if (r.hash !== hash) fail('determinism', `replay ${k + 1} gives ${r.hash.slice(0, 12)}, the trip ${hash.slice(0, 12)}`);
    }
    // Packing: the canonical bytes, and base64url.
    const bytes = pack(session.log);
    const again = pack(unpack(bytes));
    if (!sameBytes(bytes, again)) fail('packing', 'pack(unpack(pack(log))) differs');
    if (!sameBytes(fromBase64url(toBase64url(bytes)), bytes)) fail('packing', 'base64url does not round-trip');
    // Resume: from the saves, the rest of the log, to the same hash.
    let resumed = fromSaves(saves, content);
    for (const a of session.log.actions.slice(savedAt)) resumed = dispatch(resumed, fromLogAction(a), content).session;
    if (tripHash(resumed.state.trip) !== hash) fail('resume', `saved after ${savedAt} actions, the trip ends at ${tripHash(resumed.state.trip).slice(0, 12)}, not ${hash.slice(0, 12)}`);
    // ...and the log the resumed session carries (what its next save and
    // bug report hold) replays to that hash too.
    else {
      const r = replay({ log: resumed.log, profile: resumed.state.trip.profile, base: resumed.base || null }, content);
      if (r.error) fail('resume', `saved after ${savedAt} actions, the resumed log stops at action ${r.error.at}: ${r.error.code}`);
      else if (r.hash !== hash) fail('resume', `saved after ${savedAt} actions, the resumed log replays to ${r.hash.slice(0, 12)}, not ${hash.slice(0, 12)}`);
    }
  } catch (e) {
    fail('crash', e && /** @type {any} */ (e).stack ? String(/** @type {any} */ (e).stack).split('\n').slice(0, 3).join(' | ') : String(e));
  }
  result.waiting = [...waiting].sort();
  return result;
}

/**
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 */
function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) return false;
  return true;
}

/**
 * Run trips [from, to) in this thread.
 * @param {number[]} indices
 * @param {{live: any, fixture: any}} contexts
 */
export function runTrips(indices, contexts) {
  return indices.map((i) => smokeTrip(i, contexts));
}

/**
 * The summary of a run (the same for any split of the trips).
 * @param {TripResult[]} results
 */
export function summarize(results) {
  const sorted = [...results].sort((a, b) => a.i - b.i);
  const failures = sorted.flatMap((r) => r.failures.map((f) => ({ i: r.i, seed: r.seed, kind: r.kind, ...f })));
  const count = (/** @type {string} */ check) => sorted.filter((r) => r.failures.some((f) => f.check === check)).length;
  const waiting = [...new Set(sorted.flatMap((r) => r.waiting))].sort();
  return {
    trips: sorted.length,
    live: sorted.filter((r) => r.kind === 'live').length,
    fixture: sorted.filter((r) => r.kind === 'fixture').length,
    ended: sorted.filter((r) => r.ended).length,
    actions: sorted.reduce((n, r) => n + r.actions, 0),
    probes: sorted.filter((r) => r.probed).length,
    crashes: count('crash'),
    deadEnds: count('dead end'),
    stuck: count('stuck'),
    nondeterministic: count('determinism'),
    packing: count('packing'),
    resume: count('resume'),
    templates: count('template'),
    refusals: count('refusal'),
    waiting,
    failures,
  };
}

/** 4812 -> "4,812" (no locale: the same everywhere). */
const thousands = (/** @type {number} */ n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * The one line the run prints.
 * @param {ReturnType<typeof summarize>} s
 * @param {number} ms the run's wall time
 */
export function summaryLine(s, ms) {
  const plural = (/** @type {number} */ n, /** @type {string} */ one, /** @type {string} */ many) => `${n} ${n === 1 ? one : many}`;
  const extra = [
    s.packing && plural(s.packing, 'packing failure', 'packing failures'),
    s.resume && plural(s.resume, 'resume failure', 'resume failures'),
    s.templates && plural(s.templates, 'template failure', 'template failures'),
    s.refusals && plural(s.refusals, 'missed refusal', 'missed refusals'),
  ].filter(Boolean);
  const waiting = s.waiting.length ? `; ${plural(s.waiting.length, 'line', 'lines')} waiting for ${s.waiting.length === 1 ? 'its' : 'their'} screen's words` : '';
  return `sim: smoke ${s.trips} trips (live ${s.live}, fixture ${s.fixture}): ${plural(s.crashes, 'crash', 'crashes')}, ${plural(s.deadEnds, 'dead end', 'dead ends')}, ${s.stuck} stuck, ${s.nondeterministic ? `${s.nondeterministic} nondeterministic` : 'deterministic'}${extra.length ? `, ${extra.join(', ')}` : ''}; ${thousands(s.actions)} actions, ${(ms / Math.max(1, s.trips)).toFixed(2)} ms a trip${waiting}`;
}

/**
 * The smoke run: n trips over k workers (1: this thread).
 * @param {{n: number, workers?: number, root?: string, contexts?: {live: any, fixture: any}}} o
 *   contexts: in-thread content to run on instead of the repo's (tests: planted faults)
 * @returns {Promise<ReturnType<typeof summarize>>}
 */
export async function runSmoke({ n, workers = 1, root = ROOT, contexts }) {
  const indices = [...Array(n).keys()];
  if (workers <= 1 || contexts) return summarize(runTrips(indices, contexts || { live: liveContext(root), fixture: fixtureContext() }));
  const k = Math.min(workers, n || 1);
  const parts = [...Array(k)].map((_, w) => indices.filter((i) => i % k === w));
  const results = await Promise.all(
    parts.map(
      (part) =>
        new Promise((done, failed) => {
          const w = new Worker(new URL(import.meta.url), { workerData: { smoke: part, root } });
          w.once('message', done);
          w.once('error', failed);
          w.once('exit', (code) => code && failed(new Error(`sim: a worker exited with ${code}`)));
        }),
    ),
  );
  return summarize(/** @type {TripResult[][]} */ (results).flat());
}

if (!isMainThread && workerData && Array.isArray(workerData.smoke)) {
  const contexts = { live: liveContext(workerData.root), fixture: fixtureContext() };
  /** @type {any} */ (parentPort).postMessage(runTrips(workerData.smoke, contexts));
}

const isMain = isMainThread && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (/** @type {string} */ name) => {
    const k = args.indexOf(name);
    return k >= 0 ? args[k + 1] : undefined;
  };
  if (args.includes('--matrix')) {
    console.log('sim: the matrix (the plan library, the seven bots and the 7.3 targets report) arrives in S15b; S3 has --smoke');
    process.exit(0);
  }
  const n = Number(opt('--smoke'));
  if (!Number.isSafeInteger(n) || n < 1) {
    console.error('usage: node tools/sim.mjs --smoke N [--workers k] | --matrix');
    process.exit(2);
  }
  const workers = opt('--workers') !== undefined ? Number(opt('--workers')) : Math.min(4, availableParallelism());
  const t0 = performance.now();
  runSmoke({ n, workers })
    .then((s) => {
      const ms = performance.now() - t0;
      const dir = join(ROOT, 'out', 'sim');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'smoke.json'), `${JSON.stringify({ ...s, workers, ms: Math.round(ms) }, null, 1)}\n`);
      for (const f of s.failures.slice(0, 20)) console.log(`sim: trip ${f.i} (${f.kind}, seed ${f.seed}): ${f.check}: ${f.msg}`);
      if (s.failures.length > 20) console.log(`sim: ... and ${s.failures.length - 20} more (out/sim/smoke.json)`);
      if (s.waiting.length) console.log(`sim: waiting for their screen's words: ${s.waiting.join(', ')}`);
      console.log(summaryLine(s, ms));
      process.exit(s.failures.length ? 1 : 0);
    })
    .catch((e) => {
      console.error(e && e.stack ? e.stack : String(e));
      process.exit(1);
    });
}
