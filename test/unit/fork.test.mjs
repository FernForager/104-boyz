// The sample fork at the rim, through the engine (BUILD_PLAN S6; GAME_DESIGN
// 8.1, 8.5, 8.8, 8.14, 9.5, B.6, 12.11 to 12.13; the spec's B.1 and B.3):
// the router's times to the second, the screen's odds and Why sheets, the
// roll's key and its three draws, the bands over 20,000 fixed seeds (pinned
// exactly, and held within 3 sigma of 8.8's expectations, with no
// randomness in CI: E.9), a death that ends the hiker, the saves, replay,
// the Why goldens, and the content checks the fork needs (S9's fair-death
// lint replaces them).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { newSession, dispatch, screenOf, phaseOf } from '../../web/js/engine/step.js';
import { loadContent } from '../../web/js/engine/content.js';
import { toSaves, fromSaves, tripHash } from '../../web/js/engine/save.js';
import { replay } from '../../web/js/engine/replay.js';
import { rollOf, rollsOf, attemptsKey, priceOf } from '../../web/js/engine/phases/trailhead.js';
import { hash128 } from '../../web/js/engine/rng.js';
import { compileContent, compileSources, readSchemas, fairDeath } from '../../tools/content.mjs';
import { ROOT } from '../../tools/pics.mjs';
import { rulesSources, source } from './enginefix.mjs';

/** The repo's content for the trail (the park and the odds ship with it). */
function liveContent() {
  const { rules, voice, problems } = compileContent({ screens: ['trail'], checkText: false });
  assert.deepEqual(problems, []);
  return loadContent({ rules, voice, rulesHash: 'abcdef012345' });
}
const content = liveContent();

/** At the fork: Robin signs, the sample starts with a seed, Walk on twice. */
function atFork(seed = 'K7QM2Q9F') {
  let s = newSession(content);
  s = dispatch(s, { t: 'sign', name: 'Robin', id: 'h00000001' }, content).session;
  s = dispatch(s, { t: 'start', plan: 'sample', seed }, content).session;
  s = dispatch(s, { t: 'next' }, content).session;
  return dispatch(s, { t: 'next' }, content);
}

/** The Crockford base32 of the first 40 bits of hash128(label): the smoke run's seeds, for the fork's own label. */
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function seedOf(label) {
  const [a, b] = hash128(label);
  let v = a * 256 + (b >>> 24);
  let s = '';
  for (let k = 0; k < 8; k++) {
    s = CROCKFORD[v % 32] + s;
    v = Math.floor(v / 32);
  }
  return s;
}

/** Whole seconds as h:mm:ss. */
const hms = (/** @type {number} */ s) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

test("the router's times (B.1's table, to the second): 11:05 at Deer Lake, the rim at 13:49:03, and each outcome's arrival", () => {
  let s = newSession(content);
  s = dispatch(s, { t: 'sign', name: 'Robin', id: 'h00000001' }, content).session;
  s = dispatch(s, { t: 'start', plan: 'sample', seed: 'K7QM2Q9F' }, content).session;
  assert.equal(hms(s.state.trip.clock.s), '11:05:00', "B.6's 10:45 and its 20-minute lunch");
  s = dispatch(s, { t: 'next' }, content).session;
  assert.equal(s.state.trip.stop, 'rim');
  assert.equal(s.state.trip.clock.s, 39900 + 9843, 'Deer Lake to the rim: 3.2 mi, +1,440 / -90, 9,843 s with breaks');
  assert.equal(hms(s.state.trip.clock.s), '13:49:03');
  s = dispatch(s, { t: 'next' }, content).session;
  assert.deepEqual([s.state.trip.stop, hms(s.state.trip.clock.s)], ['fork', '13:49:03'], 'the rim walks on to the fork in no time');
  // Each outcome's walk on entering it, and its extra time: found by seed, so every one is reached.
  const want = {
    high_clean: '16:26:28', // 9,445 s: Heart Lake by the crest, 4:26 pm
    high_shaky: '16:46:28', // and 20 minutes in the krummholz
    high_struck: '14:38:59', // 2,996 s: the crest's highest point
    high_fatal: '14:38:59',
    basin_clean: '14:30:51', // 2,508 s: down the staircase to Lunch Lake, 2:31 pm
    basin_shaky: '14:40:51',
    basin_slip: '14:45:51',
    basin_sprain: '15:00:51',
    car_out: '17:41:35', // 13,952 s: back to the car, 5:42 pm
  };
  /** @type {Record<string, string>} */
  const got = {};
  for (let k = 0; k < 5000 && Object.keys(got).length < Object.keys(want).length; k++) {
    const fork = atFork(seedOf(`times|${k}`)).session;
    for (const c of ['high', 'basin', 'car']) {
      const t = dispatch(fork, { t: 'choose', c }, content).session.state.trip;
      got[t.stop] = hms(t.clock.s);
    }
  }
  assert.deepEqual(got, want);
});

test("the fork's screen: Stay high a diamond, 65% with 35% hit and 0.7% fatal; Through the basin 95%; Back to the car sure; and each Why sheet's data", () => {
  const { screen } = atFork();
  assert.deepEqual([screen.stop.id, screen.box.map((r) => r.id)], ['fork', ['trail.deer_lake_rim.fork']]);
  const [high, basin, car] = screen.choices;
  assert.deepEqual(high.odds, { kind: 'diamond', made: 65, fail: 35, fatal: { tenths: 7 }, failWord: { id: 'trail.deer_lake_rim.fork.high.fail' } });
  assert.deepEqual(basin.odds, { kind: 'pct', made: 95, fail: 5, fatal: null, failWord: null }, 'a slip and a turned ankle: a plain %');
  assert.deepEqual([car.tag, car.odds, car.why], ['sure', undefined, undefined]);
  // The Why sheets (12.11): every number from the shared tables and the router.
  assert.deepEqual(high.why.rows, [{ label: { id: 'trail.why.crest_storm' }, value: 40 }]);
  assert.deepEqual([high.why.p, high.why.bands, high.why.made], [40, { clean: 40, shaky: 25, fail: 35 }, 65]);
  assert.deepEqual(high.why.fatalCalc, { fail: 35, band: { num: 1, den: 1 }, death: 20, exact: { num: 7, den: 10 }, shown: { tenths: 7 } }, '35 x 100% x 2% = 0.70%, shown 0.7%');
  assert.deepEqual(high.why.route, { place: { id: 'place.heart_lake' }, eta_s: 59188, mi10: 34, exposedUntil_s: 58234 }, 'Heart Lake about 4:26 pm, 3.4 mi; on the open crest until about 4:11 pm');
  assert.deepEqual(basin.why.rows, [
    { label: { id: 'trail.why.staircase' }, value: 88 },
    { label: { id: 'trail.why.skill_footing', vars: { level: 1 } }, value: 2 },
  ]);
  assert.deepEqual([basin.why.p, basin.why.made, basin.why.fatalCalc], [90, 95, null]);
  assert.deepEqual(basin.why.route, { place: { id: 'place.lunch_lake' }, eta_s: 52251, mi10: 9 }, 'Lunch Lake about 2:31 pm, 0.9 mi');
  assert.deepEqual(basin.why.badly, { id: 'trail.deer_lake_rim.fork.basin.badly' });
  // Never the raw draws (8.8, 8.14): the screen says nothing of u or r.
  assert.doesNotMatch(JSON.stringify(screen), /"u[123]?"|"r"|draws/);
});

test('the Why goldens (test/golden/why/fork.json; 12.11: S9 regenerates sheets as goldens): both sheets, exactly', () => {
  const { screen } = atFork();
  const sheets = Object.fromEntries(screen.choices.filter((c) => c.why).map((c) => [c.act.c, { label: c.label, odds: c.odds, why: c.why }]));
  const file = join(ROOT, 'test', 'golden', 'why', 'fork.json');
  if (process.env.UPDATE_GOLDENS === '1') writeFileSync(file, `${JSON.stringify({ $comment: "The sample fork's two Why sheets, as the engine's screen carries them (BUILD_PLAN S6; GAME_DESIGN 12.11): regenerate with UPDATE_GOLDENS=1 node --test test/unit/fork.test.mjs, and review the diff.", sheets }, null, 1)}\n`);
  const golden = JSON.parse(readFileSync(file, 'utf8'));
  assert.deepEqual(golden.sheets, sheets);
});

test("the roll's key (8.14): the same seed, choice, day and attempts give the same band; the first of its three draws is rollOf's u", () => {
  const fork = atFork('K7QM2Q9F').session;
  const a = dispatch(fork, { t: 'choose', c: 'high' }, content).session;
  const b = dispatch(fork, { t: 'choose', c: 'high' }, content).session;
  assert.deepEqual(a.state.trip.rolled, b.state.trip.rolled);
  assert.deepEqual(a.state.trip.rolled, { stop: 'fork', c: 'high', band: 'fail' }, 'K7QM2Q9F: lightning hits close');
  assert.equal(a.state.trip.stop, 'high_struck');
  const [u1] = rollsOf(fork.state.trip, 'high');
  assert.equal(rollOf(fork.state.trip, 'high'), u1 / 4294967296, 'one key: rollOf is the first draw');
  // The attempts key moves the roll: a genuine second attempt rolls fresh.
  const key = attemptsKey(fork.state.trip, 'high');
  assert.equal(key, 'deer_lake_rim.fork.high.1');
  assert.equal(a.state.trip.attempts[key], 1);
  const again = { ...fork.state.trip, attempts: { ...fork.state.trip.attempts, [key]: 1 } };
  assert.notDeepEqual(rollsOf(again, 'high'), rollsOf(fork.state.trip, 'high'));
  // A choice's key is its own: the basin rolls apart from the crest.
  assert.notDeepEqual(rollsOf(fork.state.trip, 'basin'), rollsOf(fork.state.trip, 'high'));
  // The roll lasts until the next move, and only a roll sets it.
  assert.equal(Object.prototype.hasOwnProperty.call(fork.state.trip, 'rolled'), false);
  const on = dispatch(a, { t: 'next' }, content).session;
  assert.equal(Object.prototype.hasOwnProperty.call(on.state.trip, 'rolled'), false, 'the set ends, and the roll with it');
  assert.equal(Object.prototype.hasOwnProperty.call(dispatch(fork, { t: 'choose', c: 'car' }, content).session.state.trip, 'rolled'), false, 'a sure choice rolls nothing');
});

test('an outcome screen: its severity, its pencil rows, and the roll it landed by (the compass\'s bands and band, never the draws)', () => {
  const fork = atFork('K7QM2Q9F').session;
  const r = dispatch(fork, { t: 'choose', c: 'high' }, content);
  assert.deepEqual([r.screen.outcome, r.screen.pencil], ['serious', [{ arrive: { id: 'place.high_divide' }, at_s: 52739 }]]);
  assert.deepEqual(r.screen.roll, { c: 'high', kind: 'diamond', bands: { clean: 40, shaky: 25, fail: 35 }, fatal: { num: 7, den: 10 }, landed: 'fail' });
  assert.deepEqual(r.screen.choices, [{ act: { t: 'next' }, label: null, enabled: true }], 'one way on: Walk on');
  const basin = dispatch(fork, { t: 'choose', c: 'basin' }, content).screen;
  assert.deepEqual([basin.outcome, basin.pencil], ['mishap', [{ arrive: { id: 'place.lunch_lake' }, at_s: 52851 }, { add_s: 600 }]], 'shaky on the stairs: Lunch Lake 10 minutes later');
  assert.deepEqual([basin.roll.kind, basin.roll.landed, basin.roll.fatal], ['pct', 'shaky', null]);
  const car = dispatch(fork, { t: 'choose', c: 'car' }, content).screen;
  assert.deepEqual([car.outcome, car.pencil, car.roll], ['good', [{ arrive: { id: 'place.sol_duc_trailhead' }, at_s: 63695 }], undefined]);
});

test('the bands over fixed seeds 1 to 20,000 (E.9: no randomness in CI): pinned exactly, and each within 3 sigma of 8.8\'s 40 / 25 / 35 and 9.5\'s 0.7% fatal', () => {
  // Each seed from hash128('fork|' + i), as the smoke run makes its own: the same 20,000 trips every run.
  let s = newSession(content);
  s = dispatch(s, { t: 'sign', name: 'Robin', id: 'h00000001' }, content).session;
  /** @type {Record<string, number>} */
  const counts = { clean: 0, shaky: 0, fail: 0, fatal: 0 };
  const N = 20000;
  for (let i = 1; i <= N; i++) {
    let t = dispatch(s, { t: 'start', plan: 'sample', seed: seedOf(`fork|${i}`) }, content).session;
    t = dispatch(t, { t: 'next' }, content).session;
    t = dispatch(t, { t: 'next' }, content).session;
    t = dispatch(t, { t: 'choose', c: 'high' }, content).session;
    counts[t.state.trip.rolled.band]++;
  }
  // The golden: the dice are deterministic, so the counts are too.
  assert.deepEqual(counts, { clean: 8022, shaky: 4947, fail: 6914, fatal: 117 });
  // And a wrong formula can't hide behind the golden: each band within 3 sigma of its expectation.
  const near = (/** @type {number} */ n, /** @type {number} */ p, /** @type {string} */ what) => {
    const sigma = Math.sqrt(N * p * (1 - p));
    assert.ok(Math.abs(n - N * p) <= 3 * sigma, `${what}: ${n} of ${N}, expected ${N * p} +- ${(3 * sigma).toFixed(1)}`);
  };
  near(counts.clean, 0.4, 'clean 40%');
  near(counts.shaky, 0.25, 'shaky 25%');
  near(counts.fail + counts.fatal, 0.35, 'fail 35%, the deaths among it');
  near(counts.fatal, 0.007, 'fatal 0.7% (35 x 100% x 2%)');
});

test('a fatal ends the trip and the hiker (S6\'s stand-in for S24a): Next, the guest book, and a new hiker starts fresh', () => {
  // D000000Z: on the crest the storm comes to see the view (found by the dev route's seed list).
  const fork = atFork('D000000Z').session;
  const r = dispatch(fork, { t: 'choose', c: 'high' }, content);
  assert.deepEqual([r.session.state.trip.stop, r.screen.outcome, r.session.state.trip.rolled.band], ['high_fatal', 'death', 'fatal']);
  assert.ok(r.session.state.hiker, 'the save at the confirming tap holds the death stop, the hiker still there to see it (8.14)');
  // Closing the app now changes nothing: the saves reopen on the death box.
  const saved = JSON.parse(JSON.stringify(toSaves(r.session)));
  const reopened = fromSaves(saved, content);
  assert.equal(screenOf(reopened.state, content).outcome, 'death');
  // Its one button (Walk on's action; the UI words it Next) ends the set and the hiker.
  const next = dispatch(r.session, { t: 'next' }, content);
  assert.deepEqual([next.session.state.hiker, next.session.state.trip.end, phaseOf(next.session.state), next.screen.phase], [null, 'sample', 'guestbook', 'guestbook']);
  assert.deepEqual(next.session.log.actions, [['next'], ['next'], ['choose', 'high'], ['next']], 'logged, so a replay ends the same way');
  const rep = replay({ log: next.session.log, profile: next.session.state.trip.profile }, content);
  assert.equal(rep.hash, tripHash(next.session.state.trip));
  // The saves after: no hiker, the trip ended; reopening shows the guest book.
  const after = toSaves(next.session);
  assert.equal(after.hiker, null);
  assert.equal(phaseOf(fromSaves(JSON.parse(JSON.stringify(after)), content).state), 'guestbook');
  // A new hiker signs and starts fresh at Deer Lake, with no trips behind them.
  const signed = dispatch(next.session, { t: 'sign', name: 'Sam', id: 'h00000002' }, content);
  assert.deepEqual(signed.screen.auto, { t: 'start', plan: 'sample' });
  const fresh = dispatch(signed.session, { t: 'start', plan: 'sample', seed: 'ABCDEFGH' }, content).session;
  assert.deepEqual([fresh.state.trip.stop, fresh.state.trip.n, fresh.state.hiker.id, fresh.state.hiker.trips, fresh.log.actions], ['deer_lake', 1, 'h00000002', 0, []]);
});

test('the saves: one written at the confirming tap holds the outcome and the roll; reopened, the same outcome, and its log replays to its hash', () => {
  const fork = atFork('D0000001').session;
  const r = dispatch(fork, { t: 'choose', c: 'high' }, content);
  assert.equal(r.session.state.trip.stop, 'high_clean');
  const saves = JSON.parse(JSON.stringify(toSaves(r.session)));
  assert.deepEqual(saves.trip.snapshot.rolled, { stop: 'fork', c: 'high', band: 'clean' });
  const back = fromSaves(saves, content);
  assert.deepEqual(back.state, r.session.state);
  assert.deepEqual(screenOf(back.state, content), r.screen, 'the same outcome, with its roll');
  const rep = replay({ log: back.log, profile: back.state.trip.profile }, content);
  assert.deepEqual([rep.error, rep.hash], [null, tripHash(r.session.state.trip)]);
  // A trip that never rolled hashes as before: the field is only there after a roll.
  assert.ok(!('rolled' in fork.state.trip));
});

test("an outcome saved with its roll, reopened under a later build whose fork renamed the rolled choice: the outcome, without the roll (only the tap's own draw plays the compass), never an error at every launch", () => {
  const fork = atFork().session;
  const r = dispatch(fork, { t: 'choose', c: 'high' }, content);
  assert.equal(r.session.state.trip.stop, 'high_struck');
  const saves = JSON.parse(JSON.stringify(toSaves(r.session)));
  const built = compiledFork((s) => (s.stops.find((/** @type {any} */ x) => x.id === 'fork').choices[0].id = 'crest'));
  assert.deepEqual(built.problems, []);
  const later = loadContent({ rules: built.rules, voice: built.voice, rulesHash: 'fedcba543210' });
  const back = fromSaves(saves, later);
  assert.deepEqual(back.state.trip.rolled, { stop: 'fork', c: 'high', band: 'fail' }, 'the trip opens where it stood');
  const screen = screenOf(back.state, later);
  assert.equal(screen.stop.id, 'high_struck');
  assert.equal(screen.roll, undefined, 'no roll to show');
  assert.equal(screen.outcome, 'serious');
  // And Walk on ends the set as before.
  assert.equal(dispatch(back, { t: 'next' }, later).session.state.hiker.trips, 1);
});

test('a rolled choice is priced from the trip as it stands: a skill of 3 makes the staircase 94 clean, 97%', () => {
  const fork = atFork().session;
  const t = { ...fork.state.trip, profile: { ...fork.state.trip.profile, skills: { ...fork.state.trip.profile.skills, footing: 3 } } };
  const stop = content.stop(t.set, 'fork');
  const basin = stop.choices.find((/** @type {any} */ c) => c.id === 'basin');
  const pr = priceOf(t, basin, content);
  assert.deepEqual([pr.p, pr.bands.made, pr.diamond, pr.fatal], [94, 97, false, null]);
});

// ---- The content checks (a test in S6; S9's fair-death lint replaces them) ----

/** The repo's stop set, compiled on its own with the repo's rules and a change: compileSources' result. */
function compiledFork(change) {
  const set = JSON.parse(readFileSync(join(ROOT, 'content', 'stops', 'deer_lake_rim.json'), 'utf8'));
  const odds = JSON.parse(readFileSync(join(ROOT, 'content', 'rules', 'odds.json'), 'utf8'));
  const movement = readFileSync(join(ROOT, 'content', 'rules', 'movement.json'), 'utf8');
  change(set);
  const plan = { id: 'sample', screen: 'trail', mode: 'open', start: { set: 'deer_lake_rim', day: 1, s: 39900 }, after: 'end' };
  const sources = [...rulesSources(), source('rules', 'odds', odds), source('trips', 'sample', plan), source('stops', 'deer_lake_rim', set)];
  sources.push({ file: 'content/rules/movement.json', folder: 'rules', name: 'movement', src: movement });
  return compileSources({ sources, schemas: readSchemas(ROOT), screens: ['trail'], defined: null });
}

/** The problems compiledFork finds, as "code msg". */
function compileFork(change) {
  return compiledFork(change).problems.map((p) => `${p.code} ${p.msg}`);
}

test("in the repo's tree, with the park: every walk and route is one the router makes, and one it can't is R01", (t) => {
  const root = mkdtempSync(join(tmpdir(), 'oph-fork-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const d of ['content', 'schemas']) cpSync(join(ROOT, d), join(root, d), { recursive: true });
  assert.deepEqual(compileContent({ root, screens: ['trail'], checkText: false }).problems, []);
  const file = join(root, 'content', 'stops', 'deer_lake_rim.json');
  const set = JSON.parse(readFileSync(file, 'utf8'));
  // Lake #8 is a scope node with no way to it from the rim but the map's.
  set.stops.find((/** @type {any} */ x) => x.id === 'fork').choices[1].route.to = 'lake_8';
  writeFileSync(file, JSON.stringify(set, null, 1));
  const msgs = compileContent({ root, screens: ['trail'], checkText: false }).problems.map((p) => `${p.code} ${p.msg}`);
  assert.equal(msgs.length, 1);
  assert.match(msgs[0], /^R01 stop "fork": the router can't walk seven_lakes_basin > lake_8: /);
});

test('the fair-death rules (9.5): a needed danger named first on every way there, a sure way beside, a diamond, a death stop, a gentle one that never kills', () => {
  const set = JSON.parse(readFileSync(join(ROOT, 'content', 'stops', 'deer_lake_rim.json'), 'utf8'));
  assert.deepEqual(fairDeath(set), [], 'the sample fork is fair');
  const planted = (/** @type {(s: any) => void} */ f) => {
    const s = JSON.parse(JSON.stringify(set));
    f(s);
    return fairDeath(s).map((p) => p.msg);
  };
  const fork = (/** @type {any} */ s) => s.stops.find((/** @type {any} */ x) => x.id === 'fork');
  const high = (/** @type {any} */ s) => fork(s).choices[0];
  assert.match(planted((s) => delete s.stops[0].foreshadow).join('\n'), /needs "thunder" named first/, 'no warning at Deer Lake');
  assert.match(
    planted((s) => {
      // A second way to the fork that passes no warning.
      s.first = 'rim';
    }).join('\n'),
    /needs "thunder" named first/,
  );
  assert.match(planted((s) => delete high(s).needs).join('\n'), /can kill, so it needs the danger it names foreshadowed/);
  assert.match(planted((s) => (fork(s).choices = fork(s).choices.slice(0, 2))).join('\n'), /no choice beside it is sure/);
  assert.match(planted((s) => (high(s).odds.fail[0].rung = 2)).join('\n'), /only a diamond can kill/);
  assert.match(planted((s) => (high(s).odds.fail[0].death.to = 'high_struck')).join('\n'), /is not a death stop/);
  assert.match(planted((s) => (high(s).odds.fail[0].death.gentle = 'high_fatal')).join('\n'), /the gentle mode never kills/);
  // A death stop is reached only by a death: never a fail's own to (no fatal share on the button), a sure then, a clean or a next.
  assert.match(planted((s) => (high(s).odds.fail = [{ to: 'high_fatal', w: 100, rung: 3 }])).join('\n'), /choice "high"'s odds\.fail\[0\]\.to goes to death stop "high_fatal"/);
  assert.match(planted((s) => (fork(s).choices[2].then = 'high_fatal')).join('\n'), /choice "car"'s then goes to death stop "high_fatal"/);
  assert.match(planted((s) => (fork(s).choices[1].odds.clean = 'high_fatal')).join('\n'), /choice "basin"'s odds\.clean goes to death stop "high_fatal"/);
  assert.match(planted((s) => (s.stops.find((/** @type {any} */ x) => x.id === 'rim').next = 'high_fatal')).join('\n'), /stop "rim": next goes to death stop "high_fatal"/);
  // A sure choice never rolls, and the sure way beside a deadly one is another choice.
  const sureHigh = planted((s) => (high(s).tag = 'sure')).join('\n');
  assert.match(sureHigh, /choice "high" is tagged sure and rolls/);
  assert.match(
    planted((s) => {
      high(s).tag = 'sure';
      fork(s).choices = fork(s).choices.slice(0, 2);
    }).join('\n'),
    /choice "high" can kill, and no choice beside it is sure/,
    'the deadly choice is not its own way out',
  );
});

test('the fork compiles clean, and its checks (R01) catch a base or a skill the odds lack, an unroutable walk, and an outcome that stands elsewhere', () => {
  assert.deepEqual(compileFork(() => {}), []);
  const fork = (/** @type {any} */ s) => s.stops.find((/** @type {any} */ x) => x.id === 'fork');
  assert.match(compileFork((s) => (fork(s).choices[0].odds.base = 'thin_ice')).join('\n'), /R01 .*"thin_ice" is not a base in content\/rules\/odds\.json/);
  assert.match(compileFork((s) => (fork(s).choices[1].odds.mods = [{ skill: 'river' }])).join('\n'), /R01 .*the skill "river" has no row/);
  assert.match(compileFork((s) => (fork(s).choices[1].odds.clean = 'nowhere')).join('\n'), /R01 .*odds\.clean "nowhere" is not a stop/);
  assert.match(compileFork((s) => (s.stops.find((/** @type {any} */ x) => x.id === 'basin_clean').view.node = 'heart_lake')).join('\n'), /R01 outcome stop "basin_clean": its view stands at "heart_lake", but its walk ends at "lunch_lake"/);
  assert.match(compileFork((s) => (s.stops[1].add_s = 60)).join('\n'), /R01 stop "rim": add_s is an outcome's time/);
  assert.match(compileFork((s) => (s.stops.find((/** @type {any} */ x) => x.id === 'car_out').next = 'rim')).join('\n'), /R01 outcome stop "car_out" ends the set/);
});
