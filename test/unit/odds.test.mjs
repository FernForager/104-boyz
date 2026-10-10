// The odds (BUILD_PLAN S6; GAME_DESIGN 8.1, 8.5, 8.7, 8.8, 9.5): how a
// rolled choice is priced and rolled, in whole numbers and exact fractions.
// The fatal share's goldens are the doc's own worked examples, each
// rounded up, toward danger; the bands' are 8.8's and Appendix D's screen
// 8; the draws are exact over u32s.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pOf, bandsOf, diamondOf, fatalOf, shownOf, landOf, drawsOf, idiv, cdiv, frac, MAX_WEIGHT } from '../../web/js/engine/odds.js';
import { lintEngine } from '../../tools/lint.mjs';
import { ROOT } from '../../tools/pics.mjs';

/** content/rules/odds.json's constants, as the build ships them (rules.odds). */
const ODDS_JSON = JSON.parse(readFileSync(join(ROOT, 'content', 'rules', 'odds.json'), 'utf8'));
const C = {
  format: 1,
  clamp: ODDS_JSON.clamp,
  shaky_cap: ODDS_JSON.shaky_cap,
  great_below: ODDS_JSON.great_below,
  routine_at: ODDS_JSON.routine_at,
  skill_per_level: ODDS_JSON.skill_per_level,
  bases: Object.fromEntries(Object.entries(ODDS_JSON.bases).map(([k, v]) => [k, { base: v.base }])),
};
/** An env with skill levels. */
const env = (skills = {}) => ({ v: (/** @type {string} */ p) => skills[p.slice('skill.'.length)] });
const TWO32 = 4294967296;

test("odds.json: 8.5 and 8.8's constants, and S6's two bases (B.6's crest, B.3's staircase)", () => {
  assert.deepEqual(C.clamp, [5, 97]);
  assert.deepEqual([C.shaky_cap, C.great_below, C.routine_at, C.skill_per_level], [25, 30, 95, 2]);
  assert.deepEqual(C.bases, { exposed_crest_storm: { base: 40 }, stone_staircase_dry: { base: 88 } });
});

test('p (8.5): the base plus its labeled modifiers, a skill at its level, clamped 5 to 97; each row labeled from voice.odds', () => {
  const labels = { bases: { exposed_crest_storm: 'trail.why.crest_storm', stone_staircase_dry: 'trail.why.staircase' }, skills: { footing: 'trail.why.skill_footing' } };
  // Stay high: base 40, no modifier.
  assert.deepEqual(pOf(C, { base: 'exposed_crest_storm', mods: [], clean: 'a', shaky: 'b', fail: [] }, env(), labels), { rows: [{ label: { id: 'trail.why.crest_storm' }, value: 40, kind: 'base', id: 'exposed_crest_storm' }], p: 40, sum: 40 });
  // Through the basin: 88, footing skill level 1, +2 (8.5): 90.
  const basin = pOf(C, { base: 'stone_staircase_dry', mods: [{ skill: 'footing' }], clean: 'a', shaky: 'b', fail: [] }, env({ footing: 1 }), labels);
  assert.equal(basin.p, 90);
  assert.deepEqual(basin.rows[1], { label: { id: 'trail.why.skill_footing', vars: { level: 1 } }, value: 2, kind: 'skill', id: 'footing' });
  // Clamped at both ends, by a skill of 5 (+10) and by its absence.
  const high = { ...C, bases: { x: { base: 95 } } };
  assert.deepEqual([pOf(high, { base: 'x', mods: [{ skill: 'footing' }], clean: 'a', shaky: 'b', fail: [] }, env({ footing: 5 })).p, pOf(high, { base: 'x', mods: [{ skill: 'footing' }], clean: 'a', shaky: 'b', fail: [] }, env({ footing: 5 })).sum], [97, 105]);
  assert.equal(pOf({ ...C, bases: { x: { base: 1 } } }, { base: 'x', mods: [], clean: 'a', shaky: 'b', fail: [] }, env()).p, 5);
  // Without labels (tools) the rows are unlabeled; a base the odds lack, or a level that isn't whole, is refused.
  assert.equal(pOf(C, { base: 'exposed_crest_storm', mods: [], clean: 'a', shaky: 'b', fail: [] }, env()).rows[0].label, null);
  assert.throws(() => pOf(C, { base: 'nope', mods: [], clean: 'a', shaky: 'b', fail: [] }, env()), { name: 'EngineError', code: 'state' });
  assert.throws(() => pOf(C, { base: 'stone_staircase_dry', mods: [{ skill: 'footing' }], clean: 'a', shaky: 'b', fail: [] }, env({ footing: 1.5 })), { name: 'EngineError', code: 'state' });
});

test('the bands (8.8): shaky = min(ceil((100 - p) / 2), 25), made = p + shaky; the sample and Appendix D screen 8', () => {
  const b = (/** @type {number} */ p) => {
    const x = bandsOf(p, C);
    return [x.clean, x.shaky, x.fail, x.made];
  };
  assert.deepEqual(b(40), [40, 25, 35, 65], 'Stay high: 40 + 25 = 65, B.6\'s 35% goes badly');
  assert.deepEqual(b(90), [90, 5, 5, 95], 'Through the basin');
  assert.deepEqual(b(47), [47, 25, 28, 72], 'D 8: the ladder, 47 clean, 72%, 28 fall');
  assert.deepEqual(b(52), [52, 24, 24, 76], 'D 8: back to Elk Lake, 52 clean, shaky 24, 76%');
  assert.deepEqual(b(97), [97, 2, 1, 99], 'made it runs to 99');
  assert.deepEqual(b(5), [5, 25, 70, 30], 'and from 30: the fail share is never more than 70');
  assert.deepEqual(b(81), [81, 10, 9, 91], '8.11: 81 clean shows 91%');
  for (let p = 5; p <= 97; p++) {
    const x = bandsOf(p, C);
    assert.equal(x.clean + x.shaky + x.fail, 100);
    assert.ok(x.made >= 30 && x.made <= 99 && x.fail <= 70);
  }
});

test("the bands' hooks for later sessions: Great (p - 30), a card's own shaky, Lead call 6's two-band curve rolls", () => {
  // Great (8.8): roll < p - 30 when the card has it.
  assert.equal(bandsOf(90, C, { great: true }).great, 60);
  assert.equal(bandsOf(20, C, { great: true }).great, 0);
  assert.equal(bandsOf(90, C).great, 0, 'only when the card has it');
  // A card's own shaky, never past the rest.
  assert.deepEqual([bandsOf(60, C, { shaky: 10 }).shaky, bandsOf(95, C, { shaky: 10 }).shaky], [10, 5]);
  // A curve roll (the night roll, 7.9): no shaky band, no clamp; made = 100 - the fail share rounded up.
  const night = bandsOf(0, C, { curve: { num: 90, den: 1 } });
  assert.deepEqual([night.clean, night.shaky, night.fail, night.made, night.curve], [10, 0, 90, 10, true], '8.8: a margin of -72, 90% shivering, shows ♦ 10%');
  assert.deepEqual([bandsOf(0, C, { curve: { num: 81, den: 2 } }).fail, bandsOf(0, C, { curve: { num: 81, den: 2 } }).made], [41, 59], '8.1: 40.5% shivering shows 41');
  assert.equal(bandsOf(0, C, { curve: { num: 42, den: 1 } }).made, 58, 'A.3: 42% fails');
  assert.throws(() => bandsOf(0, C, { curve: { num: 101, den: 1 } }), { code: 'state' });
  assert.throws(() => bandsOf(40.5, C), { code: 'state' }, 'p is whole points');
});

test('the diamond is computed, never authored (8.1): any fail entry at rung 3 or more', () => {
  assert.equal(diamondOf([{ to: 'a', w: 100, rung: 3 }]), true);
  assert.equal(diamondOf([{ to: 'a', w: 80, rung: 1 }, { to: 'b', w: 20, rung: 2 }]), false, 'a slip and a turned ankle stay a plain %');
  assert.equal(diamondOf([{ to: 'a', w: 70, rung: 1 }, { to: 'b', w: 15, rung: 2 }, { to: 'c', w: 15, rung: 4 }]), true, 'swept, a rescue (4b)');
});

test("the fatal share (8.1, 9.5): fail x the fatal band's share x the death roll, exact, shown rounded up: the doc's goldens", () => {
  /** @param {number} fail @param {{w: number, death?: number}[]} entries */
  const share = (fail, entries) => fatalOf(fail, entries.map((e, k) => ({ to: `s${k}`, w: e.w, rung: 3, ...(e.death ? { death: { permille: e.death, to: 'dead', cause: 'x', gentle: 'alive' } } : {}) })));
  const shown = (/** @type {any} */ f) => (f.shown.under ? '<0.1' : f.shown.tenths >= 100 ? String(f.shown.tenths / 10) : (f.shown.tenths / 10).toFixed(1));
  const cases = [
    // [what, fail, entries, exact num/den in percent, shown]
    ['8.8, the ladder: 21 x 2% x 50%', 21, [{ w: 98 }, { w: 2, death: 500 }], [21, 100], '0.3'],
    ['8.11, the waist-deep ford: 63 x 15% x 20%', 63, [{ w: 85 }, { w: 15, death: 200 }], [189, 100], '1.9'],
    ['C.2, the headland: 61 x 25%', 61, [{ w: 1, death: 250 }], [61, 4], '16'],
    ['4.2, the crevasse: 45 x 5% x 30%', 45, [{ w: 95 }, { w: 5, death: 300 }], [27, 40], '0.7'],
    ['A.3, the bagless night: 42 x 15%', 42, [{ w: 1, death: 150 }], [63, 10], '6.3'],
    ['this sample: 35 x 100% x 2%', 35, [{ w: 100, death: 20 }], [7, 10], '0.7'],
    ['an edge: exactly 0.1% shows 0.1%', 10, [{ w: 1, death: 10 }], [1, 10], '0.1'],
  ];
  for (const [what, fail, entries, [num, den], want] of cases) {
    const f = /** @type {any} */ (share(/** @type {number} */ (fail), /** @type {any} */ (entries)));
    assert.deepEqual(f.exact, frac(num, den), `${what}: exact`);
    assert.equal(shown(f), want, `${what}: shown`);
  }
  // 8.1's own: 6.08% shows 6.1; 9.99% shows 10 (a whole number from 10%); 0.17% shows 0.2 (B.6's look-ahead product); 0.05% shows <0.1.
  assert.deepEqual(shownOf(frac(608, 100)), { tenths: 61 });
  assert.deepEqual(shownOf(frac(999, 100)), { tenths: 100 });
  assert.deepEqual(shownOf(frac(17, 100)), { tenths: 2 });
  assert.deepEqual(shownOf(frac(5, 100)), { under: true });
  assert.deepEqual(shownOf(frac(1525, 100)), { tenths: 160 }, '15.25% shows 16');
  assert.equal(shownOf(frac(0, 1)), null, 'nothing to show: never a 0');
  // The fatal band's share and the death roll, as the Why sheet shows them: 35 x 100% x 2% = 0.70%.
  const sample = /** @type {any} */ (share(35, [{ w: 100, death: 20 }]));
  assert.deepEqual([sample.band, sample.death], [{ num: 1, den: 1 }, 20]);
  assert.equal(fatalOf(35, [{ to: 'a', w: 100, rung: 3 }]), null, 'a diamond that cannot kill has no fatal share');
  assert.throws(() => fatalOf(35, [{ to: 'a', w: MAX_WEIGHT + 1, rung: 3 }]), { code: 'state' }, 'a fail table weighs at most 2^21');
});

test('the draws (8.14): the band from u1, the fail entry from u2, the death from u3, each floor(u x n / 2^32), exact', () => {
  // The least u32 whose share is at least x: floor(u x n / 2^32) turns over exactly there.
  const u = (/** @type {number} */ x) => Math.ceil(x * TWO32);
  assert.deepEqual(drawsOf([0, 0, 0], 100), { r: 0, w: 0, d: 0 });
  assert.deepEqual(drawsOf([TWO32 - 1, TWO32 - 1, TWO32 - 1], 100), { r: 99, w: 99, d: 999 });
  assert.deepEqual(drawsOf([u(0.4), u(0.5), u(0.02)], 100), { r: 40, w: 50, d: 20 });
  assert.deepEqual(drawsOf([u(0.4) - 1, u(0.5) - 1, u(0.02) - 1], 100), { r: 39, w: 49, d: 19 }, 'the edges, a u32 below');
  assert.throws(() => drawsOf([TWO32, 0, 0], 100), { code: 'state' });
  assert.throws(() => drawsOf([0.5, 0, 0], 100), { code: 'state' });
});

test('where a roll lands: clean under p, shaky under made, else the fail table by weight, and its death roll in Old School; the gentle rule takes the gentle stop', () => {
  const odds = { base: 'x', mods: [], clean: 'c', shaky: 's', fail: [{ to: 'struck', w: 100, rung: 3, death: { permille: 20, to: 'fatal', cause: 'lightning', gentle: 'struck' } }] };
  const bands = bandsOf(40, C);
  const at = (/** @type {number} */ r, /** @type {number} */ w, /** @type {number} */ d, rule = 'oldschool') => {
    const l = landOf(bands, odds, [Math.ceil((r * TWO32) / 100), Math.ceil((w * TWO32) / 100), Math.ceil((d * TWO32) / 1000)], rule);
    return [l.band, l.to];
  };
  assert.deepEqual(at(0, 0, 999), ['clean', 'c']);
  assert.deepEqual(at(39, 0, 999), ['clean', 'c']);
  assert.deepEqual(at(40, 0, 999), ['shaky', 's']);
  assert.deepEqual(at(64, 0, 999), ['shaky', 's']);
  assert.deepEqual(at(65, 0, 20), ['fail', 'struck'], 'd 20 is not under the permille');
  assert.deepEqual(at(65, 0, 19), ['fatal', 'fatal'], 'd 19 is');
  assert.deepEqual(at(99, 50, 0), ['fatal', 'fatal']);
  assert.deepEqual(at(99, 50, 0, 'gentle'), ['fail', 'struck'], "the gentle mode's would-be death is its gentle stop");
  // By weight, in table order: 80 a slip, 20 a sprain.
  const basin = { base: 'x', mods: [], clean: 'c', shaky: 's', fail: [{ to: 'slip', w: 80, rung: 1 }, { to: 'sprain', w: 20, rung: 2 }] };
  const b90 = bandsOf(90, C);
  const fail = (/** @type {number} */ w) => landOf(b90, basin, [TWO32 - 1, Math.ceil((w * TWO32) / 100), 0], 'oldschool');
  assert.deepEqual([fail(0).to, fail(79).to, fail(80).to, fail(99).to], ['slip', 'slip', 'sprain', 'sprain']);
  assert.deepEqual([fail(79).entry, fail(80).entry], [0, 1]);
  // Great, when a card has it and a stop for it.
  assert.deepEqual(landOf(bandsOf(90, C, { great: true }), { ...basin, great: 'g' }, [0, 0, 0], 'oldschool').band, 'great');
});

test('integer helpers: idiv and cdiv round down and up exactly; frac reduces', () => {
  assert.deepEqual([idiv(7, 2), cdiv(7, 2), idiv(8, 2), cdiv(8, 2), cdiv(0, 3)], [3, 4, 4, 4, 0]);
  assert.deepEqual(frac(70, 100), { num: 7, den: 10 });
  assert.throws(() => frac(1, 0), { code: 'state' });
  assert.throws(() => frac(0.5, 1), { code: 'state' });
});

test('odds.js is the engine: deterministic and integer-only (E02: no Math.random, Date, performance, approximate Math)', () => {
  const src = readFileSync(join(ROOT, 'web', 'js', 'engine', 'odds.js'), 'utf8');
  assert.deepEqual(lintEngine('web/js/engine/odds.js', src), []);
});
