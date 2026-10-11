// The engine goldens (BUILD_PLAN 2.7, 6.6, S3; GAME_DESIGN E.12, F.4): the
// frozen fixture recompiles byte for byte, the seeds are the ones the
// search finds, every golden trip replays to its frozen hash, identity,
// packed log, screens and error (twice: the same seed and log give the same
// final-state hash), the shapes agree where they should, nothing changes
// with the clock, Math.random and the approximate Math functions banned,
// and Node's self-check groups are the frozen ones.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { compileFixture, checkGoldens, findSeeds, firstRoll, fixtureContent, readGoldens, readFrozen, tripInput, selfcheckCorpus, selfcheckVectors, seedAt, endStop, goldenInputs, FIXTURE_DIR, FX_RULES_HASH, FX_HIKER } from '../../tools/goldens.mjs';
import { runSmoke } from '../../tools/sim.mjs';
import { ROOT } from '../../tools/pics.mjs';
import { runTrip, runSelfCheck, GROUPS } from '../../web/js/engine/selfcheck.js';
import { newSession, dispatch, fromLogAction } from '../../web/js/engine/step.js';
import { canon } from '../../web/js/engine/canon.js';
import { withBans } from './enginefix.mjs';
import { BANNED_MATH } from './bans.mjs';
import { MATH_BANNED } from '../../tools/lint.mjs';

const goldens = Object.fromEntries(readGoldens().map((g) => [g.name, g]));
const NAMES = ['fx_fail', 'fx_first_launch', 'fx_noops', 'fx_pass', 'fx_rebase', 'fx_refused', 'fx_rest', 'fx_resume', 'fx_wait'];

test("the fixture's source recompiles to build.json byte for byte, with the literal rules hash (call 5)", () => {
  const fx = compileFixture();
  assert.deepEqual(fx.problems, []);
  assert.equal(fx.text, readFileSync(join(ROOT, FIXTURE_DIR, 'build.json'), 'utf8'));
  const built = JSON.parse(fx.text);
  assert.equal(built.rulesHash, FX_RULES_HASH);
  assert.deepEqual(Object.keys(built.rules.plans), ['fx_plan']);
  assert.deepEqual(Object.keys(built.rules.stops), ['fx']);
  assert.ok(!JSON.stringify(built.rules).includes('fx.'), 'no line id in the outcome data');
  assert.deepEqual(built.voice.stops.fx.b, { box: [['fx.b1', 'fx.b2']], labels: { go: 'fx.go', rest: 'fx.rest' } });
});

test('the seeds are the first in base32 order whose first roll of go fits: S_PASS u < 0.5, S_MID 0.5 <= u < 0.75', () => {
  assert.equal(seedAt(0), '00000000');
  assert.equal(seedAt(31), '0000000Z');
  assert.equal(seedAt(32), '00000010');
  const content = fixtureContent();
  const { S_PASS, S_MID } = findSeeds(content);
  assert.deepEqual({ S_PASS, S_MID }, readFrozen().seeds, 'the frozen seeds');
  assert.ok(firstRoll(content, S_PASS) < 0.5);
  const u = firstRoll(content, S_MID);
  assert.ok(u >= 0.5 && u < 0.75, String(u));
  assert.equal(goldens.fx_pass.log.seed, S_PASS);
  assert.equal(goldens.fx_fail.log.seed, S_MID);
});

test('the golden trips are the nine the plan names, made from the frozen seeds', () => {
  assert.deepEqual(Object.keys(goldens).sort(), NAMES);
  const made = goldenInputs(readFrozen().seeds, fixtureContent());
  for (const g of made) {
    const { expect, ...frozen } = goldens[g.name];
    assert.equal(canon(g), canon(frozen), `${g.name}: the inputs the seeds make today`);
  }
  for (const g of Object.values(goldens)) {
    assert.equal(g.fixture, 'engine');
    assert.equal(g.log.rules, FX_RULES_HASH);
    assert.deepEqual(Object.keys(g.expect), ['hash', 'identity', 'packed', 'screens', 'error']);
  }
});

test('each golden replays to its frozen values, twice (the same seed and log give the same final-state hash)', () => {
  for (const g of Object.values(goldens)) {
    const a = runTrip(tripInput(g), fixtureContent());
    const b = runTrip(tripInput(g), fixtureContent());
    assert.deepEqual(a, g.expect, g.name);
    assert.deepEqual(b, a, `${g.name}, again`);
  }
});

test('the shapes agree: noops, a rebase, a fresh device and a resume end as fx_pass does; a wait, a fail and a rest do not', () => {
  const content = fixtureContent();
  const pass = goldens.fx_pass.expect;
  for (const n of ['fx_noops', 'fx_rebase', 'fx_first_launch', 'fx_resume', 'fx_refused']) assert.equal(goldens[n].expect.hash, pass.hash, n);
  assert.equal(goldens.fx_noops.expect.identity, pass.identity, 'no-ops leave the identity alone');
  assert.notEqual(goldens.fx_noops.expect.packed, pass.packed, 'but the complete log keeps them');
  assert.equal(goldens.fx_first_launch.expect.identity, pass.identity);
  assert.equal(goldens.fx_resume.expect.identity, pass.identity);
  assert.notEqual(goldens.fx_wait.expect.hash, pass.hash, 'the clock is in the hash');
  assert.notEqual(goldens.fx_wait.expect.identity, pass.identity, 'a wait of 600 is not a no-op');
  assert.deepEqual(goldens.fx_refused.expect.error, { at: 3, code: 'refused' });
  assert.equal(endStop(goldens.fx_pass, content), 'c');
  assert.equal(endStop(goldens.fx_fail, fixtureContent()), 'd', 'S_MID fails at p 0.5');
  assert.equal(endStop(goldens.fx_rest, fixtureContent()), 'c', 'the same u passes at p 0.75 after a rest');
  assert.equal(endStop(goldens.fx_wait, fixtureContent()), 'c');
  assert.equal(goldens.fx_resume.resume, 2);
  assert.deepEqual(goldens.fx_first_launch.first, FX_HIKER);
});

test('a fresh device opening the lockbox (S7) and signing as {HIKER} ends with a hiker of 1 trip, latest stop 3, and no name anywhere in the trip', () => {
  const content = fixtureContent();
  const g = goldens.fx_first_launch;
  let s = newSession(content);
  assert.throws(() => dispatch(s, { t: 'sign', ...g.first }, content), { code: 'refused' }, 'the lockbox comes first');
  s = dispatch(s, { t: 'open' }, content).session;
  assert.equal(s.state.device.quiz.done, true, 'the fixture deals no quiz: Take the key at once');
  s = dispatch(s, { t: 'sign', ...g.first }, content).session;
  s = dispatch(s, { t: 'start', plan: g.log.plan, seed: g.log.seed }, content).session;
  for (const a of g.log.actions) s = dispatch(s, fromLogAction(a), content).session;
  assert.equal(s.state.hiker.trips, 1);
  assert.deepEqual(s.state.hiker.latest, { seed: g.log.seed, stop: 3 });
  assert.ok(!canon(s.state.trip).includes('HIKER') && !canon(s.log).includes('HIKER'));
});

test('the ban test: with Math.random, Date, performance.now and every approximate Math function throwing, every golden, the self-check and 100 smoke trips still pass (D11)', async () => {
  const corpus = selfcheckCorpus();
  const contents = Object.values(goldens).map(() => fixtureContent());
  const [plain, smoke] = await Promise.all([Promise.resolve(runSelfCheck(JSON.parse(JSON.stringify(corpus))).groups), runSmoke({ n: 100 })]);
  assert.deepEqual(smoke.failures, []);
  const banned = withBans(() => ({
    trips: Object.values(goldens).map((g, k) => runTrip(tripInput(g), contents[k])),
    groups: runSelfCheck(JSON.parse(JSON.stringify(corpus))).groups,
  }));
  assert.deepEqual(banned.trips, Object.values(goldens).map((g) => g.expect));
  assert.deepEqual(banned.groups, plain);
  // The smoke trips themselves, banned (in this thread).
  const { liveContext, fixtureContext, runTrips, summarize } = await import('../../tools/sim.mjs');
  const contexts = { live: liveContext(), fixture: fixtureContext() };
  const bannedSmoke = withBans(() => summarize(runTrips([...Array(100).keys()], contexts)));
  assert.deepEqual(bannedSmoke, smoke);
  assert.equal(Math.random.name, 'random', 'the originals are back');
});

test('the ban test, with the bans in place before any engine module loads: every golden and the self-check still pass (D11)', () => {
  const corpus = selfcheckCorpus();
  const r = spawnSync(process.execPath, [join(ROOT, 'test', 'unit', 'banfirst.mjs')], { input: JSON.stringify(corpus), encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout);
  assert.equal(out.banned, true, 'the bans were in force');
  assert.deepEqual(out.trips, corpus.trips.map((t) => goldens[t.name].expect));
  assert.deepEqual(out.groups, corpus.expect);
});

test("the bans cover E02's list of Math functions", () => {
  assert.deepEqual([...BANNED_MATH], [...MATH_BANNED]);
});

test("Node's self-check groups over the corpus are the frozen ones (test/golden/selfcheck.json)", () => {
  const corpus = selfcheckCorpus();
  assert.deepEqual(Object.keys(corpus.expect), [...GROUPS]);
  assert.deepEqual(corpus.expect, readFrozen().groups);
  assert.deepEqual(corpus.trips.map((t) => t.name), NAMES);
  assert.ok(corpus.trips.every((t) => !('expect' in t) && !('about' in t)), "the corpus carries the goldens' inputs, not their answers");
  const v = selfcheckVectors();
  assert.equal(v.sha.length, 203);
  assert.ok(v.sha.every((s) => /^[\x20-\x7e]*$/.test(s)), 'ASCII only');
  for (const f of ['exp', 'ln', 'pow', 'sin', 'cos']) assert.equal(v.math[f].length, 512, f);
  assert.ok(v.expr.length >= 50);
  assert.deepEqual(selfcheckVectors(), v, 'the vectors are the same every time');
});

test('tools/goldens.mjs --check holds on the repo', () => {
  assert.deepEqual(checkGoldens(), []);
});
