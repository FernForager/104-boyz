// The replay self-check, on the phone (BUILD_PLAN S3, 6.6, 14.1 T0;
// GAME_DESIGN E.11, E.12). It replays the frozen golden trips and the
// engine's vectors in this phone's JavaScript engine and compares each
// group's hash with the ones Node got from the same build, so every build
// is checked on a real iPhone's engine, with no Mac.
//
// It runs on both channels: it is machinery, and its words are the debug
// menu's dev words. main.js starts it about a second after the first paint,
// and opening the debug menu starts it if it hasn't run. It fetches
// selfcheck.json (the build writes it beside the page), imports
// engine/selfcheck.js only then, runs it (pure and synchronous), and times
// it here (the engine never reads a clock). The result is kept in memory and
// read synchronously, so a bug report built inside a tap carries it:
//   {ran: false}                                   before it runs
//   {ran: true, match, ms, groups: {sha: true, ...}, failed: [{group, got, want}]}
//   {ran: true, match: null, error}                when it couldn't run
// got and want are each hash's first 12 hex.

import { describeError } from './errors.js';

const CORPUS = new URL('../../selfcheck.json', import.meta.url);
/** The groups, in the order the report lists them (engine/selfcheck.js GROUPS). */
export const CHECK_GROUPS = Object.freeze(['sha', 'rng', 'math', 'expr', 'log', 'trips', 'screens']);
const HEX = /^[0-9a-f]{64}$/;
/** An error message in the result is cut to this (the report's own budget does the rest). */
const ERROR_CUT = 300;

/**
 * @typedef {{ran: false} | {ran: true, match: boolean, ms: number, groups: Record<string, boolean>, failed: {group: string, got: string, want: string}[]} | {ran: true, match: null, error: string}} CheckResult
 */

/** @type {CheckResult} */
let result = { ran: false };
/** @type {Promise<CheckResult> | null} */
let running = null;
/** @type {Set<(r: CheckResult) => void>} */
const listeners = new Set();

/** The last result, read synchronously (the bug report). */
export function checkResult() {
  return result;
}

/**
 * Call f with the result whenever a run finishes. Returns a function that
 * stops listening.
 * @param {(r: CheckResult) => void} f
 */
export function onCheck(f) {
  listeners.add(f);
  return () => listeners.delete(f);
}

/**
 * Pure: compare a run's groups with the build's expected ones.
 * @param {Record<string, string>} got runSelfCheck(corpus).groups
 * @param {Record<string, string>} want corpus.expect
 * @param {number} ms how long it took
 * @returns {CheckResult}
 */
export function compareGroups(got, want, ms) {
  /** @type {Record<string, boolean>} */
  const groups = {};
  const failed = [];
  for (const g of CHECK_GROUPS) {
    const a = got && typeof got[g] === 'string' ? got[g] : '';
    const b = want && typeof want[g] === 'string' ? want[g] : '';
    const ok = HEX.test(a) && a === b;
    groups[g] = ok;
    if (!ok) failed.push({ group: g, got: a.slice(0, 12), want: b.slice(0, 12) });
  }
  return { ran: true, match: failed.length === 0, ms: Math.round(ms), groups, failed };
}

/**
 * Run the self-check once (later calls get the same run). Never rejects:
 * a failure to fetch or run is the result's error.
 * @param {{fetchFn?: (url: URL) => Promise<Response>, url?: URL, engine?: () => Promise<{runSelfCheck: (corpus: any) => {groups: Record<string, string>}}>, now?: () => number}} [o]
 * @returns {Promise<CheckResult>}
 */
export function runCheck({ fetchFn = (u) => fetch(u), url = CORPUS, engine = () => import('../engine/selfcheck.js'), now = () => performance.now() } = {}) {
  if (running) return running;
  running = (async () => {
    try {
      const res = await fetchFn(url);
      if (!res.ok) throw new Error(`selfcheck: selfcheck.json ${res.status}`);
      const corpus = await res.json();
      const { runSelfCheck } = await engine();
      const started = now();
      const { groups } = runSelfCheck(corpus);
      result = compareGroups(groups, corpus.expect, now() - started);
    } catch (err) {
      result = { ran: true, match: null, error: describeError(err).message.slice(0, ERROR_CUT) };
    }
    for (const f of listeners) {
      try {
        f(result);
      } catch (err) {
        console.warn('selfcheck: a listener failed', err);
      }
    }
    return result;
  })();
  return running;
}

/** Forget the result (tests). */
export function resetCheck() {
  result = { ran: false };
  running = null;
  listeners.clear();
}
