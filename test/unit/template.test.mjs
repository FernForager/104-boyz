// Lines by id, never words (BUILD_PLAN 2.3, 10.3; GAME_DESIGN 18.5, E.12
// #6; engine.md 5.1, 5.2): Refs, variant picks from the text stream, the
// pool fallback, and the same {variable} rule as T13.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ref, pick, fallback, varsOf, ID_RE } from '../../web/js/engine/template.js';
import { stopLines, choiceLabel } from '../../web/js/engine/voice.js';
import { ID_RE as TEXT_ID_RE, readText } from '../../tools/text.mjs';
import { varsOf as lintVarsOf } from '../../tools/textlint.mjs';
import { fxContent, started, play } from './enginefix.mjs';

test("ref() checks the id (tools/text.mjs's rule) and the vars", () => {
  assert.equal(String(ID_RE), String(TEXT_ID_RE), 'the same id rule as the text system');
  assert.deepEqual(ref('trail.walk_on'), { id: 'trail.walk_on' });
  assert.deepEqual(ref('trail.x', { n: 3, place: 'sol_duc', inner: { id: 'place.sol_duc' } }), { id: 'trail.x', vars: { n: 3, place: 'sol_duc', inner: { id: 'place.sol_duc' } } });
  assert.ok(Object.is(ref('a.b', { n: -0 }).vars.n, 0));
  const bad = (f) => assert.throws(f, { name: 'EngineError', code: 'invalid' });
  bad(() => ref('walk_on'));
  bad(() => ref('Trail.walk'));
  bad(() => ref('trail.walk on'));
  bad(() => ref('a.b', { N: 1 }));
  bad(() => ref('a.b', { n: 1.5 }));
  bad(() => ref('a.b', { n: 2 ** 53 }));
  bad(() => ref('a.b', { s: 'Two words' }));
  bad(() => ref('a.b', { s: 'café' }));
  bad(() => ref('a.b', { r: { id: 'c.d', vars: { r: { id: 'e.f' } } } }), 'a nested Ref is one level');
  bad(() => ref('a.b', { r: { id: 'nope' } }));
  bad(() => ref('a.b', /** @type {any} */ ([])));
});

test('pick(): the same seed and key give the same variant; other keys spread over all of them (E.8 text stream)', () => {
  const v = ['fx.b1', 'fx.b2', 'fx.b3'];
  assert.equal(pick('K7QM2Q9F', ['fx', 'b', 0, 1], v), pick('K7QM2Q9F', ['fx', 'b', 0, 1], v));
  const seen = new Set();
  for (let day = 1; day <= 40; day++) seen.add(pick('K7QM2Q9F', ['fx', 'b', 0, day], v));
  assert.deepEqual([...seen].sort(), v, 'every variant comes up');
  assert.equal(pick('K7QM2Q9F', ['x'], ['only.one']), 'only.one', 'one variant needs no draw');
  assert.throws(() => pick('K7QM2Q9F', ['x'], []), { code: 'invalid' });
});

test('fallback() drops qualifiers from the right (engine.md 5.2)', () => {
  const tried = [];
  const has = (pool) => (id) => {
    tried.push(id);
    return pool.includes(id);
  };
  assert.equal(fallback('sky.dusk.clear.subalpine', has(['sky.dusk', 'sky'])), 'sky.dusk');
  assert.deepEqual(tried, ['sky.dusk.clear.subalpine', 'sky.dusk.clear', 'sky.dusk']);
  assert.equal(fallback('sky.dusk.clear.subalpine', has(['sky'])), 'sky');
  assert.equal(fallback('sky.dusk.clear.subalpine', has(['sky.dusk.clear.subalpine'])), 'sky.dusk.clear.subalpine');
  assert.equal(fallback('sky.dusk', has([])), null);
});

test("varsOf() agrees with T13's varsOf on every line in content/text/en, and on plurals and stray braces", () => {
  const text = readText();
  assert.ok(text.lines.size > 0);
  for (const [id, line] of text.lines) assert.deepEqual(varsOf(line.text), lintVarsOf(line), id);
  for (const t of ['{a}{b} {a}', 'x {Not} {ok_1} {{n}} {', { one: '{n} day', other: '{n} days at {place}' }, '{BOY_1} {build}']) {
    assert.deepEqual(varsOf(t), lintVarsOf({ text: t }), JSON.stringify(t));
  }
  assert.deepEqual(varsOf('{place}, {n}'), ['n', 'place']);
  assert.deepEqual(varsOf({ one: 'one', other: 'many' }), ['n'], 'a plural needs n');
});

test("stopLines(): a stop's box as Refs, variants picked by the set, the stop, the slot and the trip day", () => {
  const content = fxContent();
  let s = started(content);
  assert.deepEqual(stopLines(content, s.state.trip), [{ id: 'fx.a' }]);
  s = play(s, [{ t: 'next' }], content).session;
  const [line] = stopLines(content, s.state.trip);
  assert.ok(['fx.b1', 'fx.b2'].includes(line.id));
  assert.deepEqual(stopLines(content, s.state.trip), [line], 'the same trip, the same line');
  const picks = new Set();
  for (const seed of ['00000000', '00000001', '00000002', '00000003', '00000004', '00000005', '00000006', '00000007']) {
    picks.add(stopLines(content, { ...s.state.trip, seed })[0].id);
  }
  assert.deepEqual([...picks].sort(), ['fx.b1', 'fx.b2'], 'seeds spread over the variants');
  assert.deepEqual(choiceLabel(content, s.state.trip, 'go'), { id: 'fx.go' });
  assert.throws(() => choiceLabel(content, s.state.trip, 'nope'), { code: 'state' });
});
