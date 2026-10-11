#!/usr/bin/env node
// A trip as text, and a bug report replayed on the build it came from
// (BUILD_PLAN 2.7, 6.6, S3; GAME_DESIGN E.11, F.4).
//
//   node tools/play.mjs [--seed K7QM2Q9F] [--bot first|random] [--channel preview] [--no-build] [--json]
//       A trip on the channel's build (rebuilt first, unless --no-build) as a
//       transcript: each screen's words (the build's text/en.json, through
//       web/js/text.js), the action taken, and the final hash.
//   node tools/play.mjs --replay <report.json | -> [--keep] [--freeze <name>] [--json]
//       Replays a pasted bug report on the build it came from:
//       1. Read it: the first ```json fence (a pasted issue or chat), else the
//          whole text. A report before version 2, a boot report, or one with
//          no trip has nothing to replay (exit 2).
//       2. Its commit: report.commit, or the short SHA in report.build (a
//          hand-trimmed report); dev replays on the working tree, with a warning.
//       3. Rebuild that commit: here when it is HEAD and the tree is clean;
//          here too, with a warning, when it is HEAD, the tree has
//          uncommitted changes and this tree rebuilds the report's rules (a
//          local build of uncommitted work stamps HEAD, since the stamp
//          can't see the changes); else in a worktree (git worktree add
//          --detach, after a shallow fetch when the commit isn't here), with CHANNEL=<its channel>
//          node tools/build.mjs (the build has no dependencies). The rebuilt
//          version.json's rules must be the report's, or the build isn't
//          reproducible (exit 3).
//       4. Replay with that commit's own engine and its own play.mjs
//          (--replay-here, spawned in the worktree), never today's.
//       5. Print the transcript, then "replay: match <hash12>" (exit 0) or
//          "replay: MISMATCH want <hash12> got <hash12>" (exit 1), with the
//          error code if the fold stopped. Then the report's errors: the
//          action that threw (state.pending, never in the log) tried once
//          more after the fold, and whether it throws here too; or a warning
//          when the report carries errors the log replays without. The
//          worktree goes unless --keep.
//       6. --freeze <name> (a match only) writes test/golden/replays/<name>.json
//          in this tree: {name, commit, build, rules, channel, state: {trip:
//          {log, profile, base, hash}}}, nothing else (no device facts,
//          errors, note or time; the name was never in the report, call 3,
//          and the scrub still checks).
//   node tools/play.mjs --check-frozen
//       Replays every frozen replay on its own commit (a session tool, not in
//       CI: each needs a rebuild).
//   node tools/play.mjs --replay-here <report.json> --dist dist/<channel> [--json]
//       Step 4, inside the report's own commit: loads data/rules.json,
//       data/voice.json, text/en.json and the rules hash (tools/rules.mjs),
//       and runs replay({log, profile, base}).
//
// Exit codes: 0 a match, 1 a mismatch or an error, 2 nothing to replay or a
// bad report, 3 a rebuild that doesn't reproduce the report's rules.

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './pics.mjs';
import { rulesHash } from './rules.mjs';
import { loadContent } from '../web/js/engine/content.js';
import { newSession, dispatch, screenOf, fromLogAction } from '../web/js/engine/step.js';
import { lockboxActs } from '../web/js/engine/selfcheck.js';
import { replay, asLog, tripHash } from '../web/js/engine/replay.js';
import { isEngineError } from '../web/js/engine/error.js';
import { setBundle, t } from '../web/js/text.js';
import { BOTS, botGen } from '../sims/bots.mjs';

/** The channels a report can come from. */
const CHANNELS = ['main', 'preview'];
/** The words the UI puts on a choice whose label is null (BUILD_PLAN S3, D17). */
export const UI_LABELS = Object.freeze({ next: 'trail.walk_on', sign: 'first.guestbook.sign' });
/** Where frozen replays live. */
export const FROZEN_DIR = 'test/golden/replays';
/** The keys a frozen replay keeps, and its trip's. */
export const FROZEN_KEYS = Object.freeze(['name', 'commit', 'build', 'rules', 'channel', 'state']);
export const FROZEN_TRIP_KEYS = Object.freeze(['log', 'profile', 'base', 'hash']);
/** How the report writes the hiker's name (call 3). */
const HIKER_TOKEN = '{HIKER}';
/** A sample trip's cap. */
const MAX_ACTIONS = 200;

/** A failure with its exit code. */
export class PlayError extends Error {
  /**
   * @param {number} code
   * @param {string} msg
   */
  constructor(code, msg) {
    super(msg);
    this.code = code;
  }
}

/**
 * A pasted report: the first ```json fence, else the whole text, parsed.
 * The closing fence is a line of its own: the menu writes the report as
 * JSON.stringify(r, null, 1), which puts no newline inside a string, so a
 * note or an error holding ``` can't end the fence early. A fence closed
 * on the JSON's last line (as a chat may reflow it) still reads.
 * @param {string} text
 */
export function readReport(text) {
  const s = String(text);
  const m = /^[ \t]*```json[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*```[ \t]*\r?$/m.exec(s) || /```json[ \t]*\r?\n([\s\S]*?)\r?\n?```/.exec(s);
  const body = m ? m[1] : s;
  try {
    return JSON.parse(body);
  } catch (e) {
    throw new PlayError(2, `play: the report isn't JSON (${/** @type {Error} */ (e).message})`);
  }
}

/**
 * Why a report can't be replayed, or null when it can.
 * @param {any} report
 */
export function notReplayable(report) {
  if (!report || typeof report !== 'object') return 'not a report';
  if (report.boot === true) return 'a boot report (the game never started)';
  if (!Number.isSafeInteger(report.report) || report.report < 2) return `report ${report.report} carries no trip (reports carry one from version 2)`;
  if (!report.state || !report.state.trip) return 'no trip in the report';
  const trip = report.state.trip;
  if (typeof trip.log !== 'string' || !trip.profile) return "the trip has no log or profile (a report cut short: the log and profile are never cut)";
  return null;
}

/**
 * The commit a report came from: its full SHA; else the short SHA in its
 * build id (YYYYMMDD-abc1234), resolved by revParse; or dev.
 * @param {any} report
 * @param {(short: string) => string | null} revParse a full SHA, or null when git doesn't know it
 * @returns {{sha: string | null, how: 'full' | 'short' | 'dev'}}
 */
export function resolveCommit(report, revParse) {
  if (typeof report.commit === 'string' && /^[0-9a-f]{40}$/.test(report.commit)) return { sha: report.commit, how: 'full' };
  const build = typeof report.build === 'string' ? report.build : '';
  const m = /^\d{8}-([0-9a-f]{7,40})$/.exec(build);
  if (m) {
    const sha = revParse(m[1]);
    if (!sha) throw new PlayError(2, `play: no commit ${m[1]} here (git rev-parse); fetch it, or paste the whole report`);
    return { sha, how: 'short' };
  }
  if (build === 'dev' || report.commit === 'dev' || (!build && !report.commit)) return { sha: null, how: 'dev' };
  throw new PlayError(2, `play: the report names no commit (build "${build}")`);
}

/**
 * A built channel's content and words: data/rules.json and voice.json, the
 * rules hash over its engine and rules.json, and text/en.json.
 * @param {string} dist dist/<channel>
 */
export function loadDist(dist) {
  const read = (/** @type {string} */ f) => JSON.parse(readFileSync(join(dist, ...f.split('/')), 'utf8'));
  const version = read('version.json');
  const content = loadContent({ rules: read('data/rules.json'), voice: read('data/voice.json'), rulesHash: rulesHash(dist) });
  const words = existsSync(join(dist, 'text', 'en.json')) ? read('text/en.json') : {};
  return { version, content, words };
}

/**
 * A line's words through web/js/text.js, or ⟦id⟧ when the build lacks it.
 * @param {{id: string, vars?: Record<string, unknown>}} ref
 * @param {Record<string, unknown>} words
 */
function say(ref, words) {
  return Object.prototype.hasOwnProperty.call(words, ref.id) ? t(ref.id, ref.vars) : `⟦${ref.id}⟧`;
}

/**
 * A screen in words: its box, line by line, and its choices.
 * @param {any} screen
 * @param {Record<string, unknown>} words
 */
export function screenWords(screen, words) {
  const lines = (screen.box || []).map((/** @type {any} */ r) => say(r, words));
  const choices = (screen.choices || []).map((/** @type {any} */ c) => {
    const ref = c.label || (UI_LABELS[/** @type {'next' | 'sign'} */ (c.act.t)] ? { id: UI_LABELS[/** @type {'next' | 'sign'} */ (c.act.t)] } : null);
    return `${ref ? say(ref, words) : c.act.t}${c.enabled ? '' : ' (not now)'}`;
  });
  // Home's next step (S7): its line, and the act a tap on it dispatches.
  const next = screen.next ? `${say({ id: `home.next.${screen.next.id}` }, words)}${screen.next.act ? ` (${spell(screen.next.act)})` : ' (not now)'}` : null;
  return { phase: screen.phase, stop: screen.stop ? `${screen.stop.set}.${screen.stop.id}` : null, n: screen.stop ? screen.stop.n : null, lines, choices, next, input: screen.input ? screen.input.kind : null };
}

/**
 * An action spelled out: "next", "choose go", "wait 600", "sign", "start sample K7QM2Q9F".
 * @param {any} a an action object, or a logged action
 */
export function spell(a) {
  if (Array.isArray(a)) return a.join(' ');
  if (a.t === 'choose') return `choose ${a.c}`;
  if (a.t === 'wait') return `wait ${a.s}`;
  if (a.t === 'start') return `start ${a.plan}${a.seed ? ` ${a.seed}` : ''}`;
  if (a.t === 'deal') return `deal${a.seed ? ` ${a.seed}` : ''}`;
  if (a.t === 'answer') return `answer ${a.a}`;
  return a.t;
}

/**
 * The transcript as text.
 * @param {{action: string | null, screen: ReturnType<typeof screenWords>}[]} steps
 */
export function transcriptText(steps) {
  const out = [];
  for (const { action, screen } of steps) {
    if (action) out.push(`> ${action}`);
    out.push(`[${screen.phase}${screen.stop ? ` ${screen.stop}, stop ${screen.n}` : ''}]`);
    for (const l of screen.lines) out.push(`  ${l.replace(/\n/g, '\n  ')}`);
    for (const c of screen.choices) out.push(`  * ${c}`);
    if (screen.input) out.push(`  (a ${screen.input} field)`);
    if (screen.next) out.push(`  > ${screen.next}`);
  }
  return out.join('\n');
}

/**
 * Step 4: replay a report's trip on a built channel, here.
 * @param {any} report
 * @param {string} dist
 */
export function replayHere(report, dist) {
  const why = notReplayable(report);
  if (why) throw new PlayError(2, `play: nothing to replay: ${why}`);
  const { version, content, words } = loadDist(dist);
  setBundle(/** @type {any} */ (words), {}, version.channel);
  const trip = report.state.trip;
  const want = typeof trip.hash === 'string' ? trip.hash : null;
  /** @type {{action: string | null, screen: ReturnType<typeof screenWords>}[]} */
  const steps = [];
  let got = null;
  /** @type {{at: number | null, code: string} | null} */
  let error = null;
  /** @type {any} */
  let session = null;
  try {
    const log = asLog(trip.log);
    const r = replay({ log: trip.log, profile: trip.profile, base: trip.base || null }, content);
    r.screens.forEach((s, k) => steps.push({ action: k ? spell(log.actions[k - 1]) : null, screen: screenWords(s, words) }));
    got = r.hash;
    error = r.error;
    if (!error) session = r.session;
  } catch (e) {
    if (!isEngineError(e)) throw e;
    error = { at: null, code: /** @type {any} */ (e).code };
  }
  return { match: Boolean(want && got && want === got && !error), want, got, error, build: version.build, rules: content.rulesHash, channel: version.channel, steps, pending: tryPending(report.state.pending, session, content) };
}

/**
 * The action the report says threw (state.pending: it never reached the
 * log), tried once more on the replayed session: {action, tried, threw},
 * or null with none. Only a trip action or a start can be tried; threw is
 * null when it runs clean here (so its error wasn't the engine's).
 * @param {unknown} p
 * @param {any} session the replayed session, or null when the fold failed
 * @param {any} content
 */
export function tryPending(p, session, content) {
  if (!Array.isArray(p) || !p.length) return null;
  const action = spell(p);
  const kind = p[0];
  if (!session || !['next', 'choose', 'wait', 'start'].includes(kind)) return { action, tried: false, threw: null };
  try {
    dispatch(session, kind === 'start' ? { t: 'start', plan: p[1], seed: p[2] } : fromLogAction(p), content);
    return { action, tried: true, threw: null };
  } catch (e) {
    const err = /** @type {any} */ (e);
    return { action, tried: true, threw: isEngineError(err) ? `EngineError ${err.code}` : `${err && err.name}: ${err && err.message}` };
  }
}

/**
 * What a replay says about the report's errors, beyond its verdict: the
 * pending action's outcome here, or a warning that the report carries
 * errors the log alone doesn't reproduce.
 * @param {any} report
 * @param {any} r replayHere's result
 * @returns {string[]}
 */
export function errorNotes(report, r) {
  const n = Array.isArray(report.errors) ? report.errors.length : 0;
  const p = r.pending;
  if (p && p.tried && p.threw) return [`replay: the action that threw, "${p.action}", throws here too: ${p.threw}`];
  if (p && p.tried) return [`play: warning: the action that threw, "${p.action}", runs clean here: its error wasn't the engine's (see the report's errors)`];
  if (p) return [`play: warning: the action that threw, "${p.action}", can't be tried on a replay`];
  if (n) return [`play: warning: the report carries ${n} error${n === 1 ? '' : 's'}, which the log replays without (see the report's errors)`];
  return [];
}

/** @param {string | null} h */
const h12 = (h) => (h ? h.slice(0, 12) : '-');

/**
 * The verdict line.
 * @param {{match: boolean, want: string | null, got: string | null, error: {at: number | null, code: string} | null}} r
 */
export function verdict(r) {
  const err = r.error ? ` (stopped${r.error.at === null ? '' : ` at action ${r.error.at}`}: ${r.error.code})` : '';
  return r.match ? `replay: match ${h12(r.got)}` : `replay: MISMATCH want ${h12(r.want)} got ${h12(r.got)}${err}`;
}

/**
 * The frozen replay for a matched report: only the allowed keys. The
 * scrub: the report must not hold a hiker's name anywhere it keeps (call 3
 * means it never should), and the note, the device facts, the errors and
 * the time are dropped.
 * @param {any} report
 * @param {string} name
 */
export function frozenReplay(report, name) {
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(name)) throw new PlayError(2, `play: "${name}" is not a frozen replay's name (a-z, 0-9, _ and -)`);
  const trip = report.state.trip;
  const frozen = {
    name,
    commit: typeof report.commit === 'string' ? report.commit : null,
    build: typeof report.build === 'string' ? report.build : null,
    rules: typeof report.rules === 'string' ? report.rules : null,
    channel: report.channel,
    state: { trip: { log: trip.log, profile: trip.profile, base: trip.base || null, hash: trip.hash } },
  };
  const hiker = report.state.hiker;
  const named = hiker && typeof hiker.name === 'string' && hiker.name !== HIKER_TOKEN ? hiker.name : null;
  if (named && named.length >= 2 && JSON.stringify(frozen).includes(named)) throw new PlayError(2, "play: the report holds the hiker's name; it can't be frozen (call 3)");
  return frozen;
}

/**
 * Freeze a replay in a tree.
 * @param {any} report
 * @param {string} name
 * @param {string} [root]
 */
export function writeFrozen(report, name, root = ROOT) {
  const frozen = frozenReplay(report, name);
  const dir = join(root, ...FROZEN_DIR.split('/'));
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${name}.json`);
  writeFileSync(file, `${JSON.stringify(frozen, null, 1)}\n`);
  return file;
}

/**
 * git in a tree, its output trimmed; throws on failure.
 * @param {string} cwd
 * @param {string[]} args
 */
const git = (cwd, args) => execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
/** @param {string} cwd @param {string[]} args */
const tryGit = (cwd, args) => {
  try {
    return git(cwd, args);
  } catch {
    return null;
  }
};

/**
 * Build one channel in a tree, as the deploy does.
 * @param {string} cwd
 * @param {string} channel
 */
function buildIn(cwd, channel) {
  const r = spawnSync(process.execPath, ['tools/build.mjs', '--channel', channel], { cwd, env: { ...process.env, CHANNEL: channel }, encoding: 'utf8' });
  if (r.status !== 0) throw new PlayError(1, `play: the build failed in ${cwd}:\n${(r.stderr || r.stdout || '').trim()}`);
  return join(cwd, 'dist', channel);
}

/**
 * The rules hash a build stamped (its version.json).
 * @param {string} dist
 * @returns {string | undefined}
 */
const rulesOf = (dist) => JSON.parse(readFileSync(join(dist, 'version.json'), 'utf8')).rules;

/**
 * --replay: a report replayed on its own commit's build and engine.
 * @param {{reportPath: string, root?: string, keep?: boolean, freeze?: string | null, log?: (s: string) => void}} o
 * @returns {{code: number, result: any, where: string, lines: string[]}}
 */
export function replayReport({ reportPath, root = ROOT, keep = false, freeze = null, log = () => {} }) {
  const text = readFileSync(reportPath, 'utf8');
  const report = readReport(text);
  const why = notReplayable(report);
  if (why) throw new PlayError(2, `play: nothing to replay: ${why}`);
  const { sha, how } = resolveCommit(report, (short) => tryGit(root, ['rev-parse', '--verify', '--quiet', `${short}^{commit}`]));
  const channel = report.channel;
  if (!CHANNELS.includes(channel)) throw new PlayError(2, `play: the report's channel is "${channel}", not main or preview`);
  const head = tryGit(root, ['rev-parse', 'HEAD']);
  const clean = tryGit(root, ['status', '--porcelain']) === '';
  /** @type {string[]} */
  const lines = [];
  let cwd = root;
  let wt = null;
  /** @type {string | null} */
  let built = null;
  let here = how === 'dev' || (sha === head && clean);
  if (how === 'dev') lines.push('play: warning: the report is from a dev build; replaying on the working tree');
  else if (here) lines.push(`play: ${String(sha).slice(0, 7)} is HEAD and the tree is clean; building here`);
  else if (sha === head && typeof report.rules === 'string') {
    // A local build of uncommitted work stamps HEAD (the stamp can't see the
    // changes): when this tree rebuilds the report's rules, it is that build.
    const dist = buildIn(root, channel);
    if (rulesOf(dist) === report.rules) {
      built = dist;
      here = true;
      lines.push(`play: warning: ${sha.slice(0, 7)} is HEAD with uncommitted changes, and this tree rebuilds the report's rules ${report.rules}; replaying on the working tree`);
    }
  }
  if (!here) {
    const s = /** @type {string} */ (sha);
    if (tryGit(root, ['cat-file', '-e', `${s}^{commit}`]) === null) {
      log(`play: fetching ${s.slice(0, 7)}`);
      if (tryGit(root, ['fetch', '--depth=1', 'origin', s]) === null) throw new PlayError(1, `play: commit ${s.slice(0, 7)} isn't here and couldn't be fetched`);
    }
    wt = join(tmpdir(), `oph-replay-${s.slice(0, 7)}`);
    tryGit(root, ['worktree', 'remove', '--force', wt]);
    rmSync(wt, { recursive: true, force: true });
    tryGit(root, ['worktree', 'prune']);
    git(root, ['worktree', 'add', '--detach', wt, s]);
    cwd = wt;
    lines.push(`play: ${s.slice(0, 7)} rebuilt in ${wt}`);
  }
  try {
    const dist = built || buildIn(cwd, channel);
    const rules = rulesOf(dist);
    if (typeof report.rules === 'string' && rules !== report.rules) {
      throw new PlayError(3, `play: the commit rebuilds rules ${rules}, the report says ${report.rules}: the build isn't reproducible`);
    }
    // Step 4: the commit's own play.mjs and engine.
    const r = spawnSync(process.execPath, ['tools/play.mjs', '--replay-here', resolve(reportPath), '--dist', join('dist', channel), '--json'], { cwd, encoding: 'utf8' });
    if (!r.stdout || !r.stdout.trim().startsWith('{')) throw new PlayError(1, `play: the commit's replay failed:\n${(r.stderr || r.stdout || '').trim()}`);
    const result = JSON.parse(r.stdout);
    let code = result.match ? 0 : 1;
    if (freeze) {
      if (result.match) lines.push(`play: frozen as ${writeFrozen(report, freeze, root)}`);
      else {
        lines.push('play: not frozen: only a replay that matches is frozen');
        code = 1;
      }
    }
    return { code, result, where: cwd, lines };
  } finally {
    if (wt && !keep) {
      if (tryGit(root, ['worktree', 'remove', '--force', wt]) === null) {
        rmSync(wt, { recursive: true, force: true });
        tryGit(root, ['worktree', 'prune']);
      }
    }
  }
}

/**
 * A trip on a built channel, by a bot: the lockbox (S7: deal with the
 * seed, answer 0 each time, Take the key), sign as {HIKER}, the home
 * screen's next step (S7: its act) with the seed, then the bot until the
 * trip ends.
 * @param {{dist: string, seed?: string, bot?: string}} o
 */
export function playTrip({ dist, seed = 'K7QM2Q9F', bot = 'first' }) {
  if (!/^[0-9A-HJKMNP-TV-Z]{8}$/.test(seed)) throw new PlayError(2, `play: "${seed}" is not a seed (8 Crockford base32 characters)`);
  const pick = Object.prototype.hasOwnProperty.call(BOTS, bot) ? BOTS[/** @type {'first' | 'random'} */ (bot)] : null;
  if (!pick) throw new PlayError(2, `play: no bot "${bot}" (first or random)`);
  const { version, content, words } = loadDist(dist);
  setBundle(/** @type {any} */ (words), {}, version.channel);
  const gen = botGen(`play|${seed}`);
  let session = newSession(content);
  let screen = screenOf(session.state, content);
  const steps = [{ action: /** @type {string | null} */ (null), screen: screenWords(screen, words) }];
  const go = (/** @type {any} */ a) => {
    const r = dispatch(session, a, content);
    session = r.session;
    screen = r.screen;
    steps.push({ action: spell(a), screen: screenWords(screen, words) });
  };
  for (const a of lockboxActs(seed, content)) go(a);
  go({ t: 'sign', name: HIKER_TOKEN, id: `h${seed}` });
  if (!(screen.next && screen.next.act)) throw new PlayError(2, `play: the ${version.channel} build has no plan to play (its scope has no trail screen yet)`);
  go({ ...screen.next.act, seed });
  for (let n = 0; n < MAX_ACTIONS && !session.state.trip.end; n++) {
    const a = pick(screen, gen);
    if (!a) break;
    go(a);
  }
  const trip = session.state.trip;
  return { build: version.build, channel: version.channel, rules: content.rulesHash, seed, bot, ended: Boolean(trip.end), hash: tripHash(trip), steps, log: session.log };
}

/**
 * --check-frozen: every frozen replay, on its own commit.
 * @param {{root?: string, log?: (s: string) => void}} [o]
 */
export function checkFrozen({ root = ROOT, log = (s) => console.log(s) } = {}) {
  const dir = join(root, ...FROZEN_DIR.split('/'));
  const files = existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith('.json')).sort() : [];
  let bad = 0;
  const tmp = mkdtempSync(join(tmpdir(), 'oph-frozen-'));
  try {
    for (const f of files) {
      const frozen = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      const path = join(tmp, f);
      writeFileSync(path, JSON.stringify({ report: 2, ...frozen }));
      try {
        const r = replayReport({ reportPath: path, root });
        if (r.code) bad++;
        log(`${f}: ${verdict(r.result)}`);
      } catch (e) {
        bad++;
        log(`${f}: ${/** @type {Error} */ (e).message}`);
      }
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  log(files.length ? `play: ${files.length - bad} of ${files.length} frozen replays match` : 'play: no frozen replays yet');
  return bad;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (/** @type {string} */ name, /** @type {string | undefined} */ dflt) => {
    const k = args.indexOf(name);
    return k >= 0 ? args[k + 1] : dflt;
  };
  const json = args.includes('--json');
  /** @param {unknown} v */
  const out = (v) => console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 1));
  /** @type {string | null} */
  let tmp = null;
  let code = 0;
  try {
    if (args.includes('--replay-here')) {
      const report = readReport(readFileSync(/** @type {string} */ (opt('--replay-here')), 'utf8'));
      const r = replayHere(report, resolve(/** @type {string} */ (opt('--dist'))));
      out(json ? r : [transcriptText(r.steps), verdict(r), ...errorNotes(report, r)].join('\n'));
      code = r.match ? 0 : 1;
    } else if (args.includes('--replay')) {
      let path = opt('--replay');
      if (!path) throw new PlayError(2, 'usage: node tools/play.mjs --replay <report.json | -> [--keep] [--freeze <name>] [--json]');
      if (path === '-') {
        tmp = mkdtempSync(join(tmpdir(), 'oph-report-'));
        path = join(tmp, 'report.json');
        writeFileSync(path, readFileSync(0, 'utf8'));
      }
      const r = replayReport({ reportPath: path, keep: args.includes('--keep'), freeze: opt('--freeze', undefined) || null, log: (m) => console.error(m) });
      const notes = errorNotes(readReport(readFileSync(path, 'utf8')), r.result);
      if (json) out({ ...r.result, notes: [...r.lines, ...notes] });
      else {
        for (const l of r.lines) console.error(l);
        out(`play: ${r.result.channel} build ${r.result.build}, rules ${r.result.rules}`);
        out(transcriptText(r.result.steps));
        out(verdict(r.result));
        for (const l of notes) out(l);
      }
      code = r.code;
    } else if (args.includes('--check-frozen')) {
      code = checkFrozen() ? 1 : 0;
    } else {
      const channel = /** @type {string} */ (opt('--channel', 'preview'));
      if (!CHANNELS.includes(channel)) throw new PlayError(2, `play: no channel "${channel}" (main or preview)`);
      const dist = args.includes('--no-build') ? join(ROOT, 'dist', channel) : buildIn(ROOT, channel);
      const r = playTrip({ dist, seed: opt('--seed', 'K7QM2Q9F'), bot: opt('--bot', 'first') });
      if (json) out(r);
      else {
        out(`play: ${r.channel} build ${r.build}, rules ${r.rules}, seed ${r.seed}, bot ${r.bot}`);
        out(transcriptText(r.steps));
        out(`play: ${r.ended ? 'the trip ended' : 'the trip did not end'}; final hash ${r.hash.slice(0, 12)}`);
      }
    }
  } catch (e) {
    console.error(/** @type {Error} */ (e).message);
    code = e instanceof PlayError ? e.code : 1;
  } finally {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
  }
  process.exitCode = code;
}
