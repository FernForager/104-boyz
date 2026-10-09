// The smoke run (BUILD_PLAN 6.5, 7.1, S3; GAME_DESIGN E.9): trips through
// the real engine, headless, checked for crashes, dead ends, stuck states,
// determinism, packing, resume and templates; the same summary however the
// trips are split over workers; and a planted dead end and a planted
// nondeterminism are both caught.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runSmoke, smokeSeed, smokeTrip, liveContext, fixtureContext, summarize, summaryLine, checkTemplates, NAMES } from '../../tools/sim.mjs';
import { botGen, first, random, offered } from '../../sims/bots.mjs';
import { compileSources, readSchemas } from '../../tools/content.mjs';
import { loadContent } from '../../web/js/engine/content.js';
import { nameLength } from '../../web/js/engine/phases/guestbook.js';
import { ROOT } from '../../tools/pics.mjs';
import { rulesSources, source } from './enginefix.mjs';

test('50 smoke trips pass: no crash, dead end or stuck state; deterministic, packed, resumable', async () => {
  const s = await runSmoke({ n: 50 });
  assert.deepEqual(s.failures, []);
  assert.equal(s.trips, 50);
  assert.equal(s.fixture, 5, 'one trip in ten plays the fixture');
  assert.equal(s.live, 45);
  assert.equal(s.ended, 50, 'every trip ends');
  assert.equal(s.probes, 1, 'trip 0 tries an off-screen action, and it is refused');
  assert.ok(s.actions > 50 * 3);
  assert.match(summaryLine(s, 10), /^sim: smoke 50 trips \(live 45, fixture 5\): 0 crashes, 0 dead ends, 0 stuck, deterministic; \d+ actions, 0\.20 ms a trip/);
});

test('1 and 2 workers give the same summary (the trips split by index)', async () => {
  const one = await runSmoke({ n: 40, workers: 1 });
  const two = await runSmoke({ n: 40, workers: 2 });
  assert.deepEqual(two, one);
});

test("the seeds come from hash128('smoke|' + i), 8 Crockford characters; the names are 1 to 12 code points", () => {
  assert.equal(smokeSeed(0), smokeSeed(0));
  assert.notEqual(smokeSeed(0), smokeSeed(1));
  for (let i = 0; i < 100; i++) assert.match(smokeSeed(i), /^[0-9A-HJKMNP-TV-Z]{8}$/);
  const lens = NAMES.map(nameLength);
  assert.ok(lens.every((n) => n >= 1 && n <= 12), JSON.stringify(lens));
  assert.ok(lens.includes(1) && lens.includes(12));
  assert.ok(NAMES.includes('{HIKER}'));
});

test('the bots see only the screen: first takes the first enabled choice; random waits now and then, from its own generator', () => {
  const screen = { phase: 'trailhead', stop: { set: 'fx', id: 'b', n: 2 }, box: [], choices: [{ act: { t: 'choose', c: 'go' }, label: { id: 'fx.go' }, enabled: true }, { act: { t: 'choose', c: 'rest' }, label: { id: 'fx.rest' }, enabled: true }] };
  assert.deepEqual(first(screen, botGen('x')), { t: 'choose', c: 'go' });
  assert.deepEqual(offered({ choices: [{ act: { t: 'next' }, enabled: false }] }), []);
  assert.equal(first({ choices: [] }, botGen('x')), null);
  const gen = botGen('bot|test');
  const seen = new Set();
  let waits = 0;
  for (let k = 0; k < 1000; k++) {
    const a = random(screen, gen);
    if (a.t === 'wait') {
      waits++;
      assert.ok(Number.isSafeInteger(a.s) && a.s >= 0 && a.s <= 3600);
    } else seen.add(a.c);
  }
  assert.deepEqual([...seen].sort(), ['go', 'rest']);
  assert.ok(waits > 60 && waits < 140, `about 1 in 10 waits (${waits})`);
  const a = botGen('same');
  const b = botGen('same');
  assert.equal(a.u32(), b.u32(), 'a bot is the same every run');
});

/** A context from planted sets on their own screen, with the repo's rules. */
function planted(set, contentPatch = (c) => c) {
  const plan = { id: 'p', screen: 'zz', mode: 'open', start: { set: set.id, day: 1, s: 0 }, after: 'end' };
  const { rules, voice, problems } = compileSources({ sources: [...rulesSources(), source('trips', 'p', plan), source('stops', set.id, set)], schemas: readSchemas(ROOT), screens: ['zz'], defined: null });
  assert.deepEqual(problems, []);
  return { kind: 'live', content: contentPatch(loadContent({ rules, voice, rulesHash: '0000000000aa' })), lines: null, setScreens: new Map(), scopeScreens: new Set() };
}

test('a planted dead end is caught: a stop whose only choice is hidden', () => {
  const set = {
    id: 'zz',
    screen: 'zz',
    phase: 'trailhead',
    first: 'a',
    stops: [
      { id: 'a', box: '@zz.a', next: 'b' },
      { id: 'b', box: '@zz.b', choices: [{ id: 'go', label: '@zz.go', show_if: "flag('never')", then: 'a' }] },
    ],
  };
  const r = smokeTrip(1, { live: planted(set), fixture: fixtureContext() });
  assert.deepEqual(r.failures.map((f) => f.check), ['dead end']);
  assert.match(r.failures[0].msg, /zz\.b offers nothing/);
  const s = summarize([r]);
  assert.equal(s.deadEnds, 1);
  assert.match(summaryLine(s, 1), /1 dead end,/);
});

test('a planted nondeterminism is caught: a roll whose p changes on every call', () => {
  const set = {
    id: 'zz',
    screen: 'zz',
    phase: 'trailhead',
    first: 'a',
    stops: [
      { id: 'a', box: '@zz.a', choices: [{ id: 'go', label: '@zz.go', roll: { p: '0.5', pass: 'b', fail: 'c' } }] },
      { id: 'b', box: '@zz.b', next: null },
      { id: 'c', box: '@zz.c', next: null },
    ],
  };
  // Every number an expression gives alternates 1, 0, 1, ...: the live run
  // and its replay roll the same u against different p.
  let calls = 0;
  const flaky = (c) => ({ ...c, expr: (ast) => { const f = c.expr(ast); return (env) => { const v = f(env); return typeof v === 'number' ? calls++ % 2 : v; }; } });
  const results = [1, 2, 3, 4].map((i) => smokeTrip(i, { live: planted(set, flaky), fixture: fixtureContext() }));
  const s = summarize(results);
  assert.ok(s.nondeterministic >= 1, JSON.stringify(s.failures));
  assert.ok(s.failures.some((f) => f.check === 'determinism'));
  assert.match(summaryLine(s, 1), /\d+ nondeterministic/);
  // The honest content, the same trips: deterministic.
  const honest = summarize([1, 2, 3, 4].map((i) => smokeTrip(i, { live: planted(set), fixture: fixtureContext() })));
  assert.deepEqual(honest.failures, []);
});

test('the template check: a line the content names must be defined, with its vars, unless its screen is still waiting', () => {
  const ctx = { lines: new Map([['trail.walk_on', []], ['trail.x', ['n']]]), setScreens: new Map([['s', 'trail'], ['w', 'later']]), scopeScreens: new Set(['trail']) };
  const stop = (set, box) => ({ stop: { set, id: 'a', n: 1 }, box, choices: [] });
  assert.deepEqual(checkTemplates(stop('s', [{ id: 'trail.walk_on' }]), ctx), { bad: [], waiting: [] });
  assert.deepEqual(checkTemplates(stop('s', [{ id: 'trail.gone' }]), ctx).bad, ['trail.gone is not a line in content/text']);
  assert.deepEqual(checkTemplates(stop('s', [{ id: 'trail.x' }]), ctx).bad, ['trail.x needs {n}']);
  assert.deepEqual(checkTemplates(stop('s', [{ id: 'trail.x', vars: { n: 2 } }]), ctx).bad, []);
  assert.deepEqual(checkTemplates(stop('w', [{ id: 'later.y' }]), ctx), { bad: [], waiting: ['later.y'] }, "a set on a screen the scope doesn't have yet waits for its words");
  assert.deepEqual(checkTemplates(stop('s', [{ id: 'fx.a' }]), { ...ctx, lines: null }), { bad: [], waiting: [] }, "the fixture's lines are never rendered");
});

test('the live content is everything under content/, compiled for every screen it names', () => {
  const live = liveContext();
  assert.ok(live.content.plans().includes('sample'), 'the sample, though the scope may not have its screen yet');
  assert.match(live.content.rulesHash, /^[0-9a-f]{12}$/);
  assert.equal(fixtureContext().content.rulesHash, '000000000001');
});
