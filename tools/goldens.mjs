#!/usr/bin/env node
// The engine goldens and the self-check corpus (BUILD_PLAN 2.7, 6.6, S3;
// GAME_DESIGN E.11, E.12, F.4).
//
// The fixture: a tiny frozen build for engine goldens (F.4: any change is a
// regression), compiled from test/fixtures/engine/src/ (one stop set, one
// plan, and the profile and standard rules as they were at freezing time)
// by tools/content.mjs into test/fixtures/engine/build.json. Its rules hash
// is the literal 000000000001, so the golden logs don't churn with every
// engine edit; its line ids are fx.*, never defined and never rendered.
//
// The seeds, found by a deterministic search (try 00000000, 00000001, ... in
// Crockford base32 order, and take the first whose first roll of `go`
// matches): S_PASS has u < 0.5; S_MID has 0.5 <= u < 0.75, so it fails at
// p 0.5 and passes at 0.75 after a rest, with the same u (the roll's key
// holds no stop count).
//
// The golden trips (test/golden/trips/<name>.json): {name, about, fixture,
// log, profile, base, first?, resume?, expect: {hash, identity, packed,
// screens, error}}, each replayed by the engine's own runner
// (web/js/engine/selfcheck.js runTrip). And test/golden/selfcheck.json:
// the seeds and Node's group hashes over the corpus, frozen.
//
// The corpus (selfcheck.json in every build, BUILD_PLAN S3): the fixture,
// the golden trips' inputs, and vectors for SHA-256, the streams, the math
// and the expressions, with `expect`, what Node gets running the engine's
// self-check over it. The phone runs the same file and compares, group by
// group (the debug menu's line, and every bug report).
//
//   node tools/goldens.mjs --check        the fixture byte for byte, the seeds, every golden, the groups
//   node tools/goldens.mjs --find-seeds   print S_PASS and S_MID
//   node tools/goldens.mjs --update       write build.json, the goldens and selfcheck.json (review the diff)
//
// A later engine change that moves a golden is reviewed and logged in
// BUILD_LOG's Notes; --update rewrites them only when asked.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './pics.mjs';
import { compileSources, readSchemas } from './content.mjs';
import { loadContent } from '../web/js/engine/content.js';
import { newSession, dispatch, hash12 } from '../web/js/engine/step.js';
import { canon } from '../web/js/engine/canon.js';
import { rollOf } from '../web/js/engine/phases/trailhead.js';
import { runTrip, runSelfCheck, lockboxActs } from '../web/js/engine/selfcheck.js';
import { replay } from '../web/js/engine/replay.js';

/** Where the fixture lives, from the repo's root. */
export const FIXTURE_DIR = 'test/fixtures/engine';
/** The fixture's rules hash: a literal (call 5), never computed. */
export const FX_RULES_HASH = '000000000001';
/** The golden trips and the frozen group hashes. */
export const GOLDEN_DIR = 'test/golden';
/** The fixture's sources: [file, content folder, name] (the folder picks the schema, as under content/). */
export const FIXTURE_SOURCES = Object.freeze([
  ['profile.json', 'rules', 'profile'],
  ['standard.json', 'rules', 'standard'],
  ['plans.json', 'trips', 'fx_plan'],
  ['stops.json', 'stops', 'fx'],
]);
/** The fixture's plan and screen. */
export const FX_PLAN = 'fx_plan';
const FX_SCREEN = 'fx';
/** The golden hiker: the name as a report writes it (call 3), and a fixed id. */
export const FX_HIKER = Object.freeze({ name: '{HIKER}', id: 'h00000001' });
/** How far the seed search may look before it gives up. */
const SEED_LIMIT = 100000;
/** The corpus format. */
export const CORPUS_V = 1;

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * The i-th seed in base32 order: 8 Crockford characters (00000000, 00000001, ...).
 * @param {number} i 0 to 2^40 - 1
 */
export function seedAt(i) {
  let s = '';
  let n = i;
  for (let k = 0; k < 8; k++) {
    s = CROCKFORD[n % 32] + s;
    n = Math.floor(n / 32);
  }
  return s;
}

/**
 * The fixture's sources, as tools/content.mjs takes them.
 * @param {string} [root]
 */
export function fixtureSources(root = ROOT) {
  return FIXTURE_SOURCES.map(([f, folder, name]) => ({ file: `${FIXTURE_DIR}/src/${f}`, folder, name, src: readFileSync(join(root, FIXTURE_DIR, 'src', f), 'utf8') }));
}

/**
 * Compile the fixture's sources (no text check: fx.* lines are never
 * defined) for its one screen, and the build.json text they make.
 * @param {string} [root]
 */
export function compileFixture(root = ROOT) {
  const { rules, voice, problems } = compileSources({ sources: fixtureSources(root), schemas: readSchemas(root), screens: [FX_SCREEN], defined: null });
  const body = { $comment: 'The engine fixture, compiled from src/ by tools/goldens.mjs (BUILD_PLAN 2.7, S3; GAME_DESIGN F.4). Frozen: node tools/goldens.mjs --check requires these bytes; --update rewrites them.', rulesHash: FX_RULES_HASH, rules, voice };
  return { rules, voice, problems, text: `${JSON.stringify(body, null, 1)}\n` };
}

/**
 * The frozen fixture (build.json), parsed fresh: {rules, voice, rulesHash}.
 * @param {string} [root]
 */
export function readFixture(root = ROOT) {
  const { rules, voice, rulesHash } = JSON.parse(readFileSync(join(root, FIXTURE_DIR, 'build.json'), 'utf8'));
  return { rules, voice, rulesHash };
}

/**
 * The frozen fixture, loaded (a fresh copy each call: loading freezes it).
 * @param {string} [root]
 */
export function fixtureContent(root = ROOT) {
  return loadContent(readFixture(root));
}

/**
 * A signed hiker's session with a trip started on the fixture's plan.
 * @param {any} content
 * @param {string} seed
 */
function startedOn(content, seed) {
  let opened = newSession(content);
  for (const a of lockboxActs(seed, content)) opened = dispatch(opened, a, content).session;
  const signed = dispatch(opened, { t: 'sign', ...FX_HIKER }, content).session;
  return dispatch(signed, { t: 'start', plan: FX_PLAN, seed }, content).session;
}

/**
 * Play actions from a session; returns the last session.
 * @param {any} session
 * @param {any[]} actions
 * @param {any} content
 */
function playOn(session, actions, content) {
  let s = session;
  for (const a of actions) s = dispatch(s, a, content).session;
  return s;
}

/**
 * The u of go's first roll for a seed: the trip walked on to b, and the
 * engine's own rollOf (so the search never re-derives the key).
 * @param {any} content
 * @param {string} seed
 */
export function firstRoll(content, seed) {
  const s = playOn(startedOn(content, seed), [{ t: 'next' }], content);
  return rollOf(s.state.trip, 'go');
}

/**
 * The deterministic seed search: the first seed in base32 order for each.
 * @param {any} content the fixture
 * @returns {{S_PASS: string, S_MID: string, tried: number}}
 */
export function findSeeds(content) {
  /** @type {Record<string, string>} */
  const found = {};
  let i = 0;
  for (; i < SEED_LIMIT && !(found.S_PASS && found.S_MID); i++) {
    const seed = seedAt(i);
    const u = firstRoll(content, seed);
    if (!found.S_PASS && u < 0.5) found.S_PASS = seed;
    if (!found.S_MID && u >= 0.5 && u < 0.75) found.S_MID = seed;
  }
  if (!found.S_PASS || !found.S_MID) throw new Error(`goldens: no seed found in ${SEED_LIMIT} tries`);
  return { S_PASS: found.S_PASS, S_MID: found.S_MID, tried: i };
}

const NEXT = { t: 'next' };
const GO = { t: 'choose', c: 'go' };
const REST = { t: 'choose', c: 'rest' };
/** @param {number} s */
const WAIT = (s) => ({ t: 'wait', s });

/**
 * The golden trips' inputs, from the seeds, made by playing the fixture.
 * Each: {name, about, fixture, log, profile, base, first?, resume?}.
 * @param {{S_PASS: string, S_MID: string}} seeds
 * @param {any} content the fixture
 */
export function goldenInputs({ S_PASS, S_MID }, content) {
  /** @param {string} seed @param {any[]} actions */
  const logOf = (seed, actions) => playOn(startedOn(content, seed), actions, content);
  const pass = logOf(S_PASS, [NEXT, GO, NEXT]);
  const profile = pass.state.trip.profile;
  const head = logOf(S_PASS, [NEXT, GO]);
  const plain = (/** @type {any} */ v) => JSON.parse(JSON.stringify(v));
  /** @type {(name: string, about: string, log: any, extra?: Record<string, unknown>) => any} */
  const golden = (name, about, log, extra = {}) => ({ name, about, fixture: 'engine', log: plain(log), profile: plain(profile), base: null, ...extra });
  return [
    golden('fx_pass', `S_PASS (${S_PASS}): Walk on, go (u < 0.5 passes), Walk on. Ends at c; the reference hash.`, pass.log),
    golden('fx_fail', `S_MID (${S_MID}): Walk on, go (0.5 <= u < 0.75 fails at p 0.5), Walk on. Ends at d.`, logOf(S_MID, [NEXT, GO, NEXT]).log),
    golden('fx_rest', `S_MID (${S_MID}): Walk on, rest, go, Walk on. Ends at c: the same roll (no stop count in its key), a better p (0.75).`, logOf(S_MID, [NEXT, REST, GO, NEXT]).log),
    golden('fx_noops', 'fx_pass with wait 0 before each action: the same hash and identity, other packed bytes.', logOf(S_PASS, [WAIT(0), NEXT, WAIT(0), GO, WAIT(0), NEXT]).log),
    golden('fx_wait', 'fx_pass with wait 600 after the first Walk on: another hash (the clock) and identity.', logOf(S_PASS, [NEXT, WAIT(600), GO, NEXT]).log),
    golden('fx_refused', 'fx_pass, then go again at an ended trip: refused at action 3; the fold stops there.', { ...pass.log, actions: [...pass.log.actions, ['choose', 'go']] }),
    golden('fx_rebase', "A log rebased on the state after fx_pass's first two actions (call 4), then Walk on: fx_pass's hash.", { ...pass.log, base: hash12(head.state.trip), actions: [['next']] }, { base: plain(head.state.trip) }),
    golden('fx_first_launch', "From a fresh device: the lockbox (the fixture deals no quiz: Take the key), sign as {HIKER}, start, then fx_pass's actions: fx_pass's hash; the hiker has 1 trip, latest stop 3.", pass.log, { first: { ...FX_HIKER } }),
    golden('fx_resume', "fx_pass, saved after two actions (toSaves, JSON, fromSaves), then the rest: fx_pass's hash.", pass.log, { resume: 2 }),
  ];
}

/**
 * A golden's input for the runner: {name, log, profile, base, first?, resume?}.
 * @param {any} g
 */
export function tripInput(g) {
  /** @type {Record<string, unknown>} */
  const t = { name: g.name, log: g.log, profile: g.profile, base: g.base };
  if (g.first) t.first = g.first;
  if (g.resume !== undefined) t.resume = g.resume;
  return t;
}

/**
 * Every golden trip file, by name.
 * @param {string} [root]
 */
export function readGoldens(root = ROOT) {
  const dir = join(root, GOLDEN_DIR, 'trips');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith('.json'))
    .sort()
    .map((n) => JSON.parse(readFileSync(join(dir, n), 'utf8')));
}

/**
 * The frozen record: {seeds, groups}.
 * @param {string} [root]
 */
export function readFrozen(root = ROOT) {
  return JSON.parse(readFileSync(join(root, GOLDEN_DIR, 'selfcheck.json'), 'utf8'));
}

// ---- The vectors ------------------------------------------------------------

/**
 * A deterministic stream of 32-bit words for a label: SHA-256 in counter
 * mode (node:crypto, not the engine's rng, so a change in rng.js can't move
 * the vectors that test it).
 * @param {string} label
 */
export function wordStream(label) {
  let block = 0;
  /** @type {number[]} */
  let words = [];
  const next = () => {
    if (!words.length) {
      const d = createHash('sha256').update(`oph-selfcheck|${label}|${block++}`).digest();
      words = [];
      for (let k = 0; k < 32; k += 4) words.push(d.readUInt32BE(k));
    }
    return /** @type {number} */ (words.shift());
  };
  const unit = () => next() / 2 ** 32;
  return { next, unit, range: (/** @type {number} */ a, /** @type {number} */ b) => a + (b - a) * unit(), int: (/** @type {number} */ n) => next() % n };
}

/** The 200 seeded ASCII strings, lengths 0 to 199 (every padding case of a 64-byte block). */
function shaStrings() {
  const w = wordStream('sha');
  const out = [];
  for (let i = 0; i < 200; i++) {
    const n = w.int(200);
    let s = '';
    for (let k = 0; k < n; k++) s += String.fromCharCode(0x20 + w.int(95));
    out.push(s);
  }
  return out;
}

/** The streams' vectors: E.8's eleven, the frozen keys, and a 26-character seed. */
function rngVectors() {
  const n = 64;
  return [
    { seed: 'K7QM2Q9F', stream: 'weather', key: [1], n },
    { seed: 'K7QM2Q9F', stream: 'roll', key: ['open', 'sign', 'ask', 'go', 1, 0], n },
    { seed: '00000000', stream: 'text', key: ['lot', 0, 1], n },
    { seed: 'K7QM2Q9F', stream: 'env', key: [3, 'sol_duc'], n },
    { seed: 'K7QM2Q9F', stream: 'permit', key: ['2026-08-14', 'heart_lake'], n },
    { seed: 'K7QM2Q9F', stream: 'director', key: ['seven_lakes', 2, 3], n },
    { seed: 'K7QM2Q9F', stream: 'roll', key: ['oldschool', 'fx', 'b', 'go', 1, 0], n },
    { seed: 'K7QM2Q9F', stream: 'roll', key: ['gentle', 'fx', 'b', 'go', 1, 0], n },
    { seed: 'K7QM2Q9F', stream: 'effect', key: ['oldschool', 'fx', 'b', 'pass', 0, 1], n },
    { seed: 'K7QM2Q9F', stream: 'mini', key: ['can', 'deer_lake', 2, 0], n },
    { seed: '00000000', stream: 'art', key: ['cover_high_divide_dusk'], n },
    { seed: 'K7QM2Q9F', stream: 'dust', key: ['k7qm2q9f', 25599], n },
    { seed: 'K7QM2Q9F', stream: 'lookahead', key: [0], n },
    { seed: 'ZZZZZZZZZZZZZZZZZZZZZZZZZZ', stream: 'weather', key: [60], n },
    { seed: '0123456789ABCDEFGHJKMNPQRS', stream: 'text', key: ['a.b:c-d_e', 9007199254740991], n },
  ];
}

/** The math inputs: edges, then seeded points (512 a function), made with exact operations only. */
function mathVectors() {
  const N = 512;
  const fill = (/** @type {number[]} */ edges, /** @type {() => number} */ more) => {
    const out = edges.slice();
    while (out.length < N) out.push(more());
    return out;
  };
  const LN2 = 0.6931471805599453;
  const e = wordStream('exp');
  const exp = fill(
    [0, 1, -1, 0.5, -0.5, 1e-10, -1e-10, 1e-300, 700, -700, 699.9, -699.9, LN2 / 2, -LN2 / 2, 0.34657359027997264, 10 * LN2, -10 * LN2, 709, -745, 800, 1e6],
    () => (e.int(2) ? e.range(-50, 50) : e.range(-700, 700)),
  );
  const l = wordStream('ln');
  const ln = fill(
    [1, 2, 0.5, 2.718281828459045, Math.SQRT2, Math.SQRT1_2, 1 + 2 ** -52, 1 - 2 ** -53, 1e-300, 1e300, 5e-324, 1.7976931348623157e308, 3, 10, 0, -1],
    () => (1 + l.unit()) * 2 ** (l.int(2001) - 1000),
  );
  const p = wordStream('pow');
  /** @type {[number, number][]} */
  const powEdges = [[2, 0], [2, 1], [2, 3], [2, 0.5], [0, 2], [0, 0], [0, -1], [-2, 3], [-2, 4], [-1.5, -3], [-2, 0.5], [10, -2], [1.0000001, 1e6], [3, 64], [3, 65], [0.5, 0.5], [7, -64]];
  /** @type {[number, number][]} */
  const pow = powEdges.slice();
  // Exact operations only, so every Node makes the same inputs: x = m * 2^k
  // with m in [1, 2), and |y| <= 50 / (|k| + 1), so |y ln x| stays under 50.
  while (pow.length < N) {
    const k = p.int(33) - 16;
    const x = (1 + p.unit()) * 2 ** k;
    const y = p.range(-50, 50) / (Math.abs(k) + 1);
    pow.push(p.int(8) === 0 ? [-x, Math.round(p.range(-20, 20))] : [x, y]);
  }
  const s = wordStream('sin');
  const trig = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, Math.PI, -Math.PI, 3 * Math.PI / 2, 2 * Math.PI, 1e-300, 1e5, -1e5, 99999.99, 1e5 + 1, -2e5];
  const sin = fill(trig, () => (s.int(2) ? s.range(-10, 10) : s.range(-1e5, 1e5)));
  const c = wordStream('cos');
  const cos = fill(trig, () => (c.int(2) ? c.range(-10, 10) : c.range(-1e5, 1e5)));
  return { exp, ln, pow, sin, cos };
}

/** The expression vectors: [source, env], each env {flags?, seen?, vars?}. */
function exprVectors() {
  const v = (/** @type {Record<string, number>} */ vars) => ({ vars });
  return [
    ["0.5 + (flag('rested') ? 0.25 : 0)", { flags: ['rested'] }],
    ["0.5 + (flag('rested') ? 0.25 : 0)", {}],
    ["!flag('rested')", {}],
    ["!flag('rested')", { flags: ['rested'] }],
    ['1 + 2 * 3', {}],
    ['(1 + 2) * 3', {}],
    ['10 - 4 - 3', {}],
    ['2 * 3 % 4', {}],
    ['7 % 3', {}],
    ['-7 % 3', {}],
    ['1 / 3', {}],
    ['2 / 3 * 3', {}],
    ['0.1 + 0.2', {}],
    ['-0 * 1', {}],
    ['- -1', {}],
    ['1 < 2 && 2 < 3', {}],
    ['1 > 2 || 3 >= 3', {}],
    ['1 == 1 && 1 != 2', {}],
    ['true ? 1 : 2', {}],
    ['false ? 1 : true ? 2 : 3', {}],
    ["'a' == 'a'", {}],
    ["'a' in ['b', 'a']", {}],
    ['3 in [1, 2]', {}],
    ['min(3, 1, 2)', {}],
    ['max(3, 1, 2)', {}],
    ['abs(-2.5)', {}],
    ['clamp(5, 0, 1)', {}],
    ['clamp(-5, 0, 1)', {}],
    ['round(2.5)', {}],
    ['round(-2.5)', {}],
    ['floor(-0.5)', {}],
    ['ceil(-0.5)', {}],
    ['lerp(0, 10, 0.25)', {}],
    ['step(0.5, 0.4)', {}],
    ['step(0.5, 0.6)', {}],
    ['trip.day * 2', v({ 'trip.day': 3 })],
    ['trip.n + clock.s / 3600', v({ 'trip.n': 4, 'clock.s': 30600 })],
    ['skill.river >= 2 ? 0.9 : 0.6', v({ 'skill.river': 1 })],
    ['skill.footing * 0.1 + skill.navigation * 0.05', v({ 'skill.footing': 3, 'skill.navigation': 5 })],
    ["seen('marmot') && !flag('fed')", { seen: ['marmot'] }],
    ["seen('marmot') || flag('fed')", {}],
    ['clamp(0.4 + skill.snow * 0.1, 0.05, 0.95)', v({ 'skill.snow': 5 })],
    ['1 / trip.n', v({ 'trip.n': 0 })],
    ['5 % trip.n', v({ 'trip.n': 0 })],
    ['1 / 0', {}],
    ['x = 1', {}],
    ['rand()', {}],
    ['Math.random()', {}],
    ['while', {}],
    ['a.b()', {}],
    ['((((((((((((((((((((((((((((((((((1))))))))))))))))))))))))))))))))))', {}],
  ];
}

/** Every vector the self-check runs (BUILD_PLAN S3, D11). */
export function selfcheckVectors() {
  return { sha: ['', 'abc', 'a'.repeat(1000), ...shaStrings()], rng: rngVectors(), math: mathVectors(), expr: exprVectors() };
}

/**
 * The self-check corpus: the frozen fixture, the golden trips' inputs and
 * the vectors, with `expect`, Node's group hashes over them.
 * @param {string} [root] where the fixture and the goldens are
 */
export function selfcheckCorpus(root = ROOT) {
  const corpus = { v: CORPUS_V, fixture: readFixture(root), trips: readGoldens(root).map(tripInput), vectors: selfcheckVectors() };
  // runSelfCheck loads (and freezes) the fixture; run it on a copy.
  const { groups } = runSelfCheck(JSON.parse(JSON.stringify(corpus)));
  return { ...corpus, expect: groups };
}

// ---- Check and update -----------------------------------------------------------

/**
 * Everything --check checks. Returns the problems (empty when all hold).
 * @param {string} [root]
 */
export function checkGoldens(root = ROOT) {
  /** @type {string[]} */
  const problems = [];
  const fx = compileFixture(root);
  for (const p of fx.problems) problems.push(`${p.file}:${p.line}: ${p.code} ${p.msg}`);
  const frozenText = existsSync(join(root, FIXTURE_DIR, 'build.json')) ? readFileSync(join(root, FIXTURE_DIR, 'build.json'), 'utf8') : '';
  if (fx.text !== frozenText) problems.push(`${FIXTURE_DIR}/build.json: the fixture's source no longer compiles to these bytes`);
  if (problems.length) return problems;
  const frozen = readFrozen(root);
  const seeds = findSeeds(fixtureContent(root));
  if (seeds.S_PASS !== frozen.seeds.S_PASS || seeds.S_MID !== frozen.seeds.S_MID) problems.push(`seeds: the search finds S_PASS ${seeds.S_PASS} and S_MID ${seeds.S_MID}; frozen ${frozen.seeds.S_PASS} and ${frozen.seeds.S_MID}`);
  const goldens = readGoldens(root);
  if (!goldens.length) problems.push(`${GOLDEN_DIR}/trips: no golden trips`);
  for (const g of goldens) {
    const got = runTrip(tripInput(g), fixtureContent(root));
    if (canon(got) !== canon(g.expect)) problems.push(`${GOLDEN_DIR}/trips/${g.name}.json: replays to ${JSON.stringify(got)}, frozen ${JSON.stringify(g.expect)}`);
  }
  const { expect } = selfcheckCorpus(root);
  for (const [k, want] of Object.entries(frozen.groups)) if (expect[k] !== want) problems.push(`${GOLDEN_DIR}/selfcheck.json: group ${k} is ${expect[k].slice(0, 12)}, frozen ${String(want).slice(0, 12)}`);
  if (Object.keys(expect).join() !== Object.keys(frozen.groups).join()) problems.push(`${GOLDEN_DIR}/selfcheck.json: the groups are ${Object.keys(expect).join(', ')}`);
  return problems;
}

/**
 * Freeze everything anew: build.json, the seeds, the golden trips and the
 * group hashes. Review the diff before it lands.
 * @param {string} [root]
 */
export function updateGoldens(root = ROOT) {
  const fx = compileFixture(root);
  if (fx.problems.length) throw new Error(fx.problems.map((p) => `${p.file}:${p.line}: ${p.code} ${p.msg}`).join('\n'));
  writeFileSync(join(root, FIXTURE_DIR, 'build.json'), fx.text);
  const seeds = findSeeds(fixtureContent(root));
  const dir = join(root, GOLDEN_DIR, 'trips');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const g of goldenInputs(seeds, fixtureContent(root))) {
    const expect = runTrip(tripInput(g), fixtureContent(root));
    writeFileSync(join(dir, `${g.name}.json`), `${JSON.stringify({ ...g, expect }, null, 1)}\n`);
  }
  const { expect } = selfcheckCorpus(root);
  const frozen = {
    $comment: "The self-check's frozen numbers (BUILD_PLAN S3, D11): the seeds tools/goldens.mjs --find-seeds finds, and Node's group hashes over the corpus. golden.test.mjs requires Node to get these; the phone compares itself with the build's own selfcheck.json.",
    seeds: { S_PASS: seeds.S_PASS, S_MID: seeds.S_MID },
    groups: expect,
  };
  writeFileSync(join(root, GOLDEN_DIR, 'selfcheck.json'), `${JSON.stringify(frozen, null, 1)}\n`);
  return { seeds, groups: expect };
}

/**
 * Where a trip input ends: its final stop (for the golden test and a reader).
 * @param {any} g
 * @param {any} content
 */
export function endStop(g, content) {
  return replay({ log: g.log, profile: g.profile, base: g.base }, content).state.trip.stop;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const arg = process.argv[2];
  try {
    if (arg === '--find-seeds') {
      const s = findSeeds(fixtureContent());
      console.log(`goldens: S_PASS ${s.S_PASS}, S_MID ${s.S_MID} (${s.tried} seeds tried)`);
    } else if (arg === '--update') {
      const r = updateGoldens();
      console.log(`goldens: wrote ${FIXTURE_DIR}/build.json, ${readGoldens().length} golden trips and ${GOLDEN_DIR}/selfcheck.json (S_PASS ${r.seeds.S_PASS}, S_MID ${r.seeds.S_MID}); review the diff`);
    } else if (arg === '--check' || arg === undefined) {
      const problems = checkGoldens();
      for (const p of problems) console.log(p);
      console.log(problems.length ? `goldens: ${problems.length} problem${problems.length === 1 ? '' : 's'}` : `goldens: the fixture, the seeds, ${readGoldens().length} golden trips and the self-check groups all hold`);
      process.exit(problems.length ? 1 : 0);
    } else {
      console.error('usage: node tools/goldens.mjs [--check | --find-seeds | --update]');
      process.exit(2);
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
