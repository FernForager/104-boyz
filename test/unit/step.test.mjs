// step() and the phase skeleton (BUILD_PLAN 2.3, S3; GAME_DESIGN E.2, E.6,
// 8.14, 12.4): the sixteen phases, the guest book, home's stub, the
// trailhead's stops, choices and rolls, waits, and the log; never mutating
// a state (every step below runs on a deep-frozen session).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { newSession, dispatch, screenOf, phaseOf } from '../../web/js/engine/step.js';
import { PHASES, ORDER } from '../../web/js/engine/phases/index.js';
import { nameLength } from '../../web/js/engine/phases/guestbook.js';
import { nextStep, NEXT_S7, NEXT_WHEN } from '../../web/js/engine/phases/home.js';
import { rollOf, attemptsKey } from '../../web/js/engine/phases/trailhead.js';
import { addSeconds } from '../../web/js/engine/clock.js';
import { loadContent } from '../../web/js/engine/content.js';
import { draw } from '../../web/js/engine/rng.js';
import { deepFreeze, canon } from '../../web/js/engine/canon.js';
import { compileContent } from '../../tools/content.mjs';
import { ROOT } from '../../tools/pics.mjs';
import { fxContent, play, signed, started, opened } from './enginefix.mjs';
import * as api from '../../web/js/engine/api.js';

/** The repo's live content (the sample plan), with the trail screen in scope. */
function liveContent() {
  const { rules, voice, problems } = compileContent({ screens: ['trail'], checkText: false });
  assert.deepEqual(problems, []);
  return loadContent({ rules, voice, rulesHash: 'abcdef012345' });
}

const refused = { name: 'EngineError', code: 'refused' };
const invalid = { name: 'EngineError', code: 'invalid' };

test('the sixteen phase files exist, each with id, built, lands, level and accepts (BUILD_PLAN 2.3)', () => {
  const ids = ['lockbox', 'guestbook', 'home', 'plan', 'permit', 'town', 'flatlay', 'drive', 'trailhead', 'day', 'camp', 'night', 'finish', 'report', 'soak', 'death'];
  assert.deepEqual(ORDER.map((p) => p.id), ids);
  const files = readdirSync(join(ROOT, 'web', 'js', 'engine', 'phases')).sort();
  assert.deepEqual(files, [...ids.map((id) => `${id}.js`), 'index.js'].sort());
  for (const p of ORDER) {
    assert.equal(typeof p.built, 'boolean', p.id);
    assert.match(p.lands, /^S\d+[ab]?$/, p.id);
    assert.ok(['hiker', 'trip'].includes(p.level), p.id);
    assert.ok(Array.isArray(p.accepts), p.id);
    for (const f of ['enter', 'step', 'screen']) assert.equal(typeof p[f], 'function', `${p.id}.${f}`);
    assert.ok(Object.isFrozen(p), `${p.id} is frozen`);
  }
  assert.deepEqual(ORDER.filter((p) => p.built).map((p) => p.id), ['lockbox', 'guestbook', 'home', 'trailhead'], 'S3 builds these, S7 the lockbox; the rest land later');
  assert.deepEqual(Object.fromEntries(ORDER.filter((p) => !p.built).map((p) => [p.id, p.lands])), { plan: 'S10', permit: 'S10', town: 'S11', flatlay: 'S12a', drive: 'S15a', day: 'S15a', camp: 'S15a', night: 'S15a', finish: 'S15a', report: 'S15a', soak: 'S25', death: 'S24a' });
});

test('an unbuilt phase throws EngineError("unbuilt") on enter, step and screen, and through dispatch', () => {
  const content = fxContent();
  for (const p of ORDER.filter((x) => !x.built)) {
    for (const f of ['enter', 'step', 'screen']) assert.throws(() => p[f]({}, {}, content), { name: 'EngineError', code: 'unbuilt' }, `${p.id}.${f}`);
  }
  const s = started(content);
  const inDay = deepFreeze({ ...s, state: { ...s.state, trip: { ...s.state.trip, phase: 'day' } } });
  assert.throws(() => dispatch(inDay, { t: 'next' }, content), { code: 'unbuilt' });
  assert.throws(() => screenOf(inDay.state, content), { code: 'unbuilt' });
});

test('phaseOf: the lockbox first (S7), then the guest book, home, the trip, and home again when it ends', () => {
  // Rewritten in S7: a device that hasn't opened the lockbox is at the lockbox, unless a trip is under way (lead call 53).
  const open = { v: 2, quiz: { seed: 'K7QM2Q9F', dealt: ['a', 'b', 'c'], answers: [0, 1, 2], done: true } };
  const shut = { v: 2, quiz: null };
  const asking = { v: 2, quiz: { seed: 'K7QM2Q9F', dealt: ['a', 'b', 'c'], answers: [0], done: false } };
  assert.equal(phaseOf({ device: open, hiker: null, trip: null }), 'guestbook');
  assert.equal(phaseOf({ device: open, hiker: {}, trip: null }), 'home');
  assert.equal(phaseOf({ device: open, hiker: {}, trip: { phase: 'trailhead', end: null } }), 'trailhead');
  assert.equal(phaseOf({ device: open, hiker: {}, trip: { phase: 'trailhead', end: 'sample' } }), 'home');
  // The lockbox: a fresh device, a mid-quiz one, a v1 device with a hiker (the creator's phone), and a record with none.
  for (const device of [shut, asking, { v: 1 }, null, undefined]) {
    assert.equal(phaseOf({ device, hiker: null, trip: null }), 'lockbox', JSON.stringify(device));
    assert.equal(phaseOf({ device, hiker: {}, trip: null }), 'lockbox', `${JSON.stringify(device)}: with a hiker, at the next return home`);
    assert.equal(phaseOf({ device, hiker: {}, trip: { phase: 'trailhead', end: 'sample' } }), 'lockbox', 'a trip that ended comes home past the lockbox only once it is open');
    assert.equal(phaseOf({ device, hiker: {}, trip: { phase: 'trailhead', end: null } }), 'trailhead', 'a trip under way plays on: the lockbox waits for home');
  }
  assert.deepEqual(newSession().state, { v: 1, device: { v: 2, quiz: null }, hiker: null, trip: null });
  assert.deepEqual([newSession().log, newSession().base], [null, null]);
});

test("the guest book: its screen, and signing creates the hiker with the Open start's profile (12.4)", () => {
  const content = liveContent();
  const s0 = opened(content);
  assert.deepEqual(screenOf(s0.state, content), { phase: 'guestbook', box: [], choices: [{ act: { t: 'sign' }, label: null, enabled: true }], input: { kind: 'name', max: 12 } });
  const { session, screen } = play(s0, [{ t: 'sign', name: 'Robin', id: 'hK7QM2Q9F' }], content);
  assert.deepEqual(session.state.hiker, { v: 1, id: 'hK7QM2Q9F', name: 'Robin', profile: JSON.parse(canon(content.profile.open_start)), trips: 0, latest: null });
  assert.equal(session.log, null, 'signing logs nothing: it is no trip action');
  // S7: home is the cabin, its next step a tap (no auto): a hiker with no finished trip plans the first.
  assert.deepEqual(screen, { phase: 'home', box: [], choices: [], next: { id: 'plan_first', act: { t: 'start', plan: 'sample' } } });
});

test("home's next step (S7, BUILD_PLAN 11.2): a pure function of the save, from the cabin's next table; Plan your first trip, then Plan a trip; none mid-trip; null act where the build has no plan; no later row reachable", () => {
  // The repo's table, compiled as the home section (with the home screen), and the rows the engine knows.
  const { rules, voice, problems } = compileContent({ screens: ['home', 'trail'], checkText: false });
  assert.deepEqual(problems, []);
  const content = loadContent({ rules, voice, rulesHash: 'abcdef012345' });
  const table = content.home();
  assert.ok(table && table.format === 1);
  assert.deepEqual(table.next.map((r) => r.id), ['plan_first', 'plan', 'plan_drafted', 'desk', 'town', 'packed', 'just_home'], "the plan's whole list");
  assert.deepEqual(table.next.filter((r) => r.when).map((r) => ({ id: r.id, when: r.when, act: r.act })), NEXT_S7.map((r) => ({ ...r })), "the live rows are S7's two (the engine's fallback for a build without them)");
  for (const r of table.next.filter((x) => !x.when)) assert.equal(r.act, undefined, `${r.id}: a later session's row, no rule, no act`);
  assert.ok(!JSON.stringify(table).includes('"doc"'), 'no words in the rules');
  assert.deepEqual(Object.keys(NEXT_WHEN).sort(), ['no_finished_trip', 'no_trip_under_way']);
  // State by state.
  const hiker = { v: 1, id: 'h00000001', name: 'Robin', profile: {}, trips: 0, latest: null };
  assert.equal(nextStep({ v: 1, hiker: null, trip: null }, content), null, 'no hiker: the guest book, no next step');
  assert.deepEqual(nextStep({ v: 1, hiker, trip: null }, content), { id: 'plan_first', act: { t: 'start', plan: 'sample' } });
  assert.equal(nextStep({ v: 1, hiker, trip: { phase: 'trailhead', end: null } }, content), null, 'a trip under way: the trail, not home');
  assert.deepEqual(nextStep({ v: 1, hiker: { ...hiker, trips: 1 }, trip: { phase: 'trailhead', end: 'sample' } }, content), { id: 'plan', act: { t: 'start', plan: 'sample' } }, 'after a trip');
  assert.deepEqual(nextStep({ v: 1, hiker: { ...hiker, trips: 0 }, trip: { phase: 'trailhead', end: 'sample' } }, content).id, 'plan_first', 'a trip closed unfinished (a death keeps no hiker; a closed save leaves trips at 0)');
  // Every state the save can be in reaches only S7's rows.
  const reached = new Set();
  for (const h of [null, hiker, { ...hiker, trips: 3 }]) for (const tr of [null, { phase: 'trailhead', end: null }, { phase: 'trailhead', end: 'sample' }]) {
    const n = nextStep({ v: 1, hiker: h, trip: tr }, content);
    if (n) reached.add(n.id);
  }
  assert.deepEqual([...reached].sort(), ['plan', 'plan_first']);
  // A build with no plan (main, after the cabin's promotion): the button, with no act.
  const bare = loadContent({ rules: { ...JSON.parse(JSON.stringify(rules)), plans: {}, stops: {} }, voice: { format: 1, stops: {} }, rulesHash: 'abcdef012345' });
  assert.deepEqual(nextStep({ v: 1, hiker, trip: null }, bare), { id: 'plan_first', act: null });
  // The fixture has no home section: S7's two rows.
  const fx = fxContent();
  assert.equal(fx.home(), null);
  assert.equal(nextStep({ v: 1, hiker, trip: null }, fx).id, 'plan_first');
  // A home section of the wrong shape is refused at load.
  assert.throws(() => loadContent({ rules: { ...JSON.parse(JSON.stringify(rules)), home: { format: 2 } }, voice, rulesHash: 'abcdef012345' }), { name: 'EngineError', code: 'format' });
  // section(): the shipped sections by name, nothing else.
  assert.ok(content.section('sun') && content.section('climate'));
  assert.equal(content.section('profile'), null, 'not a section');
  assert.equal(fx.section('sun'), null);
});

test('the guest book checks the name by code points, with no Unicode tables: empty, 13, a control or a lone surrogate is refused', () => {
  const content = fxContent();
  const sign = (name, id = 'h00000001') => dispatch(deepFreeze(opened(content)), { t: 'sign', name, id }, content);
  const emoji12 = '🥾'.repeat(12);
  assert.equal(emoji12.length, 24);
  assert.equal(nameLength(emoji12), 12);
  assert.equal(sign(emoji12).session.state.hiker.name, emoji12, '12 emoji are 12 code points');
  assert.doesNotThrow(() => sign('Ana Lucía'));
  assert.doesNotThrow(() => sign('é'), 'a combining mark is a code point like any other');
  assert.doesNotThrow(() => sign('{HIKER}'));
  for (const name of ['', 'abcdefghijklm', 'Rob\nin', 'Rob\u0000', 'Rob\u007f', 'Rob\u0085', '\ud83e', 'a\udd7e', '🥾'.repeat(13)]) assert.throws(() => sign(name), invalid, JSON.stringify(name));
  for (const id of ['h0000000', 'H00000001', 'h0000000I', 'hk7qm2q9f', 'x00000001']) assert.throws(() => sign('Robin', id), invalid, id);
  assert.throws(() => dispatch(opened(content), { t: 'sign', name: 'Robin', id: 'h00000001', extra: 1 }, content), invalid, 'no other fields');
  assert.throws(() => dispatch(newSession(content), { t: 'sign', name: 'Robin', id: 'h00000001' }, content), refused, 'a fresh device signs only past the lockbox (S7)');
  assert.throws(() => dispatch(signed(content), { t: 'sign', name: 'Again', id: 'h00000002' }, content), refused, 'one hiker; home takes no sign');
});

test('start refuses a bad seed or plan, and opens the trip and its log', () => {
  const content = fxContent();
  const home = deepFreeze(signed(content));
  for (const a of [
    { t: 'start', plan: 'nope', seed: 'K7QM2Q9F' },
    { t: 'start', plan: 'fx_plan', seed: 'k7qm2q9f' },
    { t: 'start', plan: 'fx_plan', seed: 'K7QM2Q9' },
    { t: 'start', plan: 'fx_plan', seed: 'K7QM2Q9FX' },
    { t: 'start', plan: 'fx_plan', seed: 'K7QM2QUF' },
    { t: 'start', plan: 'fx_plan' },
  ]) {
    assert.throws(() => dispatch(home, a, content), invalid, JSON.stringify(a));
  }
  const { session, screen } = dispatch(home, { t: 'start', plan: 'fx_plan', seed: 'K7QM2Q9F' }, content);
  const t = session.state.trip;
  assert.deepEqual(Object.keys(t).sort(), ['attempts', 'clock', 'end', 'flags', 'mode', 'n', 'phase', 'plan', 'profile', 'rule', 'seed', 'set', 'stop', 'v']);
  assert.deepEqual({ ...t, profile: undefined }, { v: 1, mode: 'open', rule: 'oldschool', seed: 'K7QM2Q9F', plan: 'fx_plan', profile: undefined, phase: 'trailhead', set: 'fx', stop: 'a', n: 1, clock: { day: 1, s: 28800 }, flags: {}, attempts: {}, end: null });
  assert.deepEqual(t.profile, JSON.parse(canon(content.profile.open_start)), "the hiker's profile snapshot");
  assert.ok(!JSON.stringify(t).includes('Robin'), 'the name is never in the trip');
  assert.deepEqual(session.log, { format: 1, rules: '000000000001', mode: 'open', rule: 'oldschool', seed: 'K7QM2Q9F', plan: 'fx_plan', profile: session.log.profile, base: '', actions: [] });
  assert.match(session.log.profile, /^[0-9a-f]{12}$/);
  assert.deepEqual(session.state.hiker.latest, { seed: 'K7QM2Q9F', stop: 1 });
  assert.deepEqual(screen, { phase: 'trailhead', stop: { set: 'fx', id: 'a', n: 1 }, box: [{ id: 'fx.a' }], choices: [{ act: { t: 'next' }, label: null, enabled: true }] });
});

test("a walk through the sample's stops (Deer Lake, the rim, from S5, and S6's fork, its sure way back) ends the sample trip and comes home, where a fresh trip starts (BUILD_PLAN S3, S6)", () => {
  // Re-pinned in S6: the rim walks on to the fork; Back to the car (sure) is its outcome, whose Walk on ends the set.
  const content = liveContent();
  const { session, screens } = play(opened(content), [{ t: 'sign', name: 'Robin', id: 'h00000001' }, { t: 'start', plan: 'sample', seed: 'K7QM2Q9F' }, { t: 'next' }, { t: 'next' }, { t: 'choose', c: 'car' }, { t: 'next' }], content);
  assert.deepEqual(
    screens.map((s) => [s.phase, s.stop && s.stop.id, s.box.map((r) => r.id)]),
    [
      ['home', undefined, []],
      ['trailhead', 'deer_lake', ['trail.deer_lake_rim.deer_lake']],
      ['trailhead', 'rim', ['trail.deer_lake_rim.rim']],
      ['trailhead', 'fork', ['trail.deer_lake_rim.fork']],
      ['trailhead', 'car_out', ['trail.deer_lake_rim.fork.car.out']],
      ['home', undefined, []],
    ],
  );
  assert.equal(session.state.trip.end, 'sample');
  assert.equal(session.state.trip.n, 4, 'the set ending moves to no new stop');
  assert.equal(phaseOf(session.state), 'home');
  assert.equal(session.state.hiker.trips, 1);
  assert.deepEqual(session.state.hiker.latest, { seed: 'K7QM2Q9F', stop: 4 });
  assert.deepEqual(session.log.actions, [['next'], ['next'], ['choose', 'car'], ['next']]);
  assert.throws(() => dispatch(session, { t: 'next' }, content), refused, 'the trip is over');
  const again = dispatch(session, { t: 'start', plan: 'sample', seed: 'ABCDEFGH' }, content).session;
  assert.equal(again.state.trip.stop, 'deer_lake');
  assert.deepEqual(again.log.actions, [], 'a fresh log');
  assert.equal(again.state.hiker.trips, 1);
});

test('refusals: an action not on the screen, or not the phase\'s, is "refused"; malformed arguments are "invalid"', () => {
  const content = fxContent();
  const a = deepFreeze(started(content));
  assert.throws(() => dispatch(a, { t: 'choose', c: 'go' }, content), refused, 'stop a has no choices');
  assert.throws(() => dispatch(a, { t: 'start', plan: 'fx_plan', seed: 'K7QM2Q9F' }, content), refused, 'no start mid-trip');
  assert.throws(() => dispatch(a, { t: 'jump' }, content), refused);
  assert.throws(() => dispatch(a, null, content), refused);
  assert.throws(() => dispatch(a, ['next'], content), refused);
  assert.throws(() => dispatch(a, { t: 'next', x: 1 }, content), invalid);
  assert.throws(() => dispatch(a, { t: 'wait', s: -1 }, content), invalid);
  assert.throws(() => dispatch(a, { t: 'wait', s: 86401 }, content), invalid);
  assert.throws(() => dispatch(a, { t: 'wait', s: 1.5 }, content), invalid);
  assert.throws(() => dispatch(a, { t: 'wait', s: '60' }, content), invalid);
  const b = deepFreeze(dispatch(a, { t: 'next' }, content).session);
  assert.throws(() => dispatch(b, { t: 'next' }, content), refused, 'stop b has choices, not Walk on');
  assert.throws(() => dispatch(b, { t: 'choose', c: 'fly' }, content), refused);
  assert.throws(() => dispatch(b, { t: 'choose', c: 'Go' }, content), invalid);
  assert.throws(() => dispatch(opened(content), { t: 'next' }, content), refused, 'the guest book takes only sign');
  assert.throws(() => dispatch(newSession(content), { t: 'next' }, content), refused, 'the lockbox takes only deal, answer and open (S7)');
});

test("choices: show_if hides, effects apply in order, then moves, and the roll is u < p on E.8's roll stream (8.14)", () => {
  const content = fxContent();
  const b = play(started(content), [{ t: 'next' }], content);
  assert.deepEqual(b.screen.choices, [
    { act: { t: 'choose', c: 'go' }, label: { id: 'fx.go' }, enabled: true },
    { act: { t: 'choose', c: 'rest' }, label: { id: 'fx.rest' }, enabled: true },
  ]);
  const rested = play(b.session, [{ t: 'choose', c: 'rest' }], content);
  const t = rested.session.state.trip;
  assert.deepEqual([t.stop, t.n, t.flags, t.clock], ['b', 3, { rested: true }, { day: 1, s: 29400 }]);
  assert.deepEqual(rested.screen.choices.map((c) => c.act.c), ['go'], 'rest hides once rested');
  assert.throws(() => dispatch(rested.session, { t: 'choose', c: 'rest' }, content), refused, 'a hidden choice is not on the screen');
  // The roll: the same key the engine uses, from the state the player saw.
  const u = (seed, k = 0, day = 1) => draw(seed, 'roll', 'oldschool', 'fx', 'b', 'go', day, k).float();
  for (const seed of ['00000000', '00000001', '00000002', '00000003', '00000004', '00000005']) {
    const s = play(started(content, seed), [{ t: 'next' }, { t: 'choose', c: 'go' }], content).session;
    assert.equal(s.state.trip.stop, u(seed) < 0.5 ? 'c' : 'd', seed);
    assert.deepEqual(s.state.trip.attempts, { 'fx.b.go.1': 1 });
    const r = play(started(content, seed), [{ t: 'next' }, { t: 'choose', c: 'rest' }, { t: 'choose', c: 'go' }], content).session;
    assert.equal(r.state.trip.stop, u(seed) < 0.75 ? 'c' : 'd', `${seed} after a rest: the same u, a better p`);
  }
});

test('the same choice on the same day rolls the same; a genuine second attempt or another day rolls fresh (8.14)', () => {
  const content = fxContent({
    sets: [
      {
        id: 'fx',
        screen: 'fx',
        phase: 'trailhead',
        first: 'b',
        stops: [
          { id: 'b', box: '@fx.b', choices: [{ id: 'go', label: '@fx.go', roll: { p: '0.5', pass: 'c', fail: 'b' } }] },
          { id: 'c', box: '@fx.c', next: null },
        ],
      },
    ],
  });
  const key = (seed, k, day = 1) => draw(seed, 'roll', 'oldschool', 'fx', 'b', 'go', day, k).float();
  const seeds = Array.from({ length: 32 }, (_, i) => `0000000${'0123456789ABCDEFGHJKMNPQRSTVWXYZ'[i]}`);
  const seed = seeds.find((x) => key(x, 0) >= 0.5);
  assert.ok(seed, 'a seed whose first attempt fails');
  const one = play(started(content, seed), [{ t: 'choose', c: 'go' }], content).session;
  assert.deepEqual([one.state.trip.stop, one.state.trip.attempts], ['b', { 'fx.b.go.1': 1 }]);
  const same = play(started(content, seed), [{ t: 'choose', c: 'go' }], content).session;
  assert.equal(canon(same.state.trip), canon(one.state.trip), 'the same choice on the same day: the same fall');
  const two = play(one, [{ t: 'choose', c: 'go' }], content).session;
  assert.notEqual(key(seed, 1), key(seed, 0), 'a genuine second attempt has its own roll');
  assert.deepEqual([two.state.trip.stop, two.state.trip.attempts], [key(seed, 1) < 0.5 ? 'c' : 'b', { 'fx.b.go.1': 2 }]);
  const nextDay = play(started(content, seed), [{ t: 'wait', s: 86400 }, { t: 'choose', c: 'go' }], content).session.state.trip;
  assert.deepEqual(nextDay.attempts, { 'fx.b.go.2': 1 }, 'another day, another key');
  assert.equal(nextDay.stop, key(seed, 0, 2) < 0.5 ? 'c' : 'b');
});

test('wait adds whole seconds and rolls whole days; wait 0 changes nothing but is logged (T0)', () => {
  assert.deepEqual(addSeconds({ day: 1, s: 30600 }, 600), { day: 1, s: 31200 });
  assert.deepEqual(addSeconds({ day: 1, s: 86000 }, 400), { day: 2, s: 0 });
  assert.deepEqual(addSeconds({ day: 1, s: 0 }, 3 * 86400 + 5), { day: 4, s: 5 });
  assert.throws(() => addSeconds({ day: 1, s: 0 }, 0.5), { code: 'invalid' });
  assert.throws(() => addSeconds({ day: 1, s: 0 }, -1), { code: 'invalid' });
  assert.throws(() => addSeconds({ day: 0, s: 0 }, 1), { code: 'state' });
  const content = fxContent();
  const s = started(content);
  const w0 = play(s, [{ t: 'wait', s: 0 }], content).session;
  assert.equal(canon(w0.state.trip), canon(s.state.trip), 'wait 0 is a no-op');
  assert.deepEqual(w0.log.actions, [['wait', 0]], 'and the complete log keeps it');
  const w = play(s, [{ t: 'wait', s: 86400 }, { t: 'wait', s: 61 }], content).session;
  assert.deepEqual(w.state.trip.clock, { day: 2, s: 28861 });
  assert.deepEqual(w.log.actions, [['wait', 86400], ['wait', 61]]);
});

test('after every trip action the hiker holds its latest stop number (E.6); the log holds every trip action in order', () => {
  const content = fxContent();
  const { session } = play(started(content, '00000000'), [{ t: 'next' }, { t: 'wait', s: 5 }, { t: 'choose', c: 'rest' }, { t: 'choose', c: 'go' }], content);
  assert.deepEqual(session.state.hiker.latest, { seed: '00000000', stop: 4 });
  assert.deepEqual(session.log.actions, [['next'], ['wait', 5], ['choose', 'rest'], ['choose', 'go']]);
});

test('step never mutates its input: every golden-shaped walk above runs deep-frozen, and here the content is frozen too', () => {
  const content = fxContent();
  assert.ok(Object.isFrozen(content.data.rules));
  const s = deepFreeze(started(content));
  const before = JSON.stringify(s);
  dispatch(s, { t: 'next' }, content);
  dispatch(s, { t: 'wait', s: 10 }, content);
  assert.equal(JSON.stringify(s), before);
});

test("rollOf is the engine's own roll: E.8's order, the set as the node and the stop as the card", () => {
  const content = fxContent();
  const b = play(started(content, '0000000A'), [{ t: 'next' }], content).session.state.trip;
  assert.equal(attemptsKey(b, 'go'), 'fx.b.go.1');
  assert.equal(rollOf(b, 'go'), draw('0000000A', 'roll', 'oldschool', 'fx', 'b', 'go', 1, 0).float());
  const after = play(started(content, '0000000A'), [{ t: 'next' }, { t: 'choose', c: 'go' }], content).session.state.trip;
  assert.equal(after.stop, rollOf(b, 'go') < 0.5 ? 'c' : 'd');
  assert.equal(rollOf({ ...b, attempts: { 'fx.b.go.1': 1 } }, 'go'), draw('0000000A', 'roll', 'oldschool', 'fx', 'b', 'go', 1, 1).float());
});

test('the engine API exports the S3 contract, versioned (BUILD_PLAN 14.2)', () => {
  assert.equal(api.API, 1);
  // S4 adds the router and the base pace (buildGraph, route, distAlong, baseSeconds, withBreaks); no S3 signature changed, so API stays 1.
  assert.deepEqual(Object.keys(api).sort(), ['API', 'EngineError', 'baseSeconds', 'buildGraph', 'dispatch', 'distAlong', 'fromBase64url', 'fromSaves', 'identity', 'isEngineError', 'loadContent', 'newSession', 'pack', 'phaseOf', 'replay', 'reportState', 'route', 'screenOf', 'toBase64url', 'toSaves', 'tripHash', 'unpack', 'withBreaks']);
  for (const [k, v] of Object.entries(api)) if (k !== 'API') assert.equal(typeof v, 'function', k);
  const e = new api.EngineError('refused', 'x');
  assert.ok(api.isEngineError(e) && e.code === 'refused' && e instanceof Error);
  assert.equal(new api.EngineError('nonsense').code, 'state', 'an unknown code is a broken invariant');
});

test("S7's lockbox actions, checked: deal {seed} (8 Crockford base32), answer {a} (a whole number from 0), open {}, and no other fields", () => {
  const content = fxContent();
  const s = deepFreeze(newSession(content));
  for (const a of [{ t: 'deal' }, { t: 'deal', seed: 'k7qm2q9f' }, { t: 'deal', seed: 'K7QM2Q9F', x: 1 }, { t: 'answer' }, { t: 'answer', a: -1 }, { t: 'answer', a: 0.5 }, { t: 'answer', a: '0' }, { t: 'open', a: 0 }]) {
    assert.throws(() => dispatch(s, a, content), invalid, JSON.stringify(a));
  }
  // The fixture deals no quiz: its shut box takes only open, and the screen says so.
  assert.deepEqual(screenOf(s.state, content).choices.map((c) => c.act), [{ t: 'open' }]);
  assert.throws(() => dispatch(s, { t: 'deal', seed: 'K7QM2Q9F' }, content), refused);
  assert.equal(phaseOf(dispatch(s, { t: 'open' }, content).session.state), 'guestbook');
  assert.deepEqual(opened(content).state.device, { v: 2, quiz: { seed: null, dealt: [], answers: [], done: true } });
});
