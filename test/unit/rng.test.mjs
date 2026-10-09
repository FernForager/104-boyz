// The seeded generator and its streams (BUILD_PLAN 6.6 rng; GAME_DESIGN
// E.8, 8.14): frozen vectors, independent streams, unbiased ints, and no
// Math.random (or any clock or approximate Math) while the engine runs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hash128, sfc32, draw, keyOf, STREAMS, DISCARD } from '../../web/js/engine/rng.js';
import { exp, ln, pow, sin, cos } from '../../web/js/engine/math.js';
import { newSession } from '../../web/js/engine/step.js';
import { replay, identity } from '../../web/js/engine/replay.js';
import { fxContent, play, withBans } from './enginefix.mjs';

const hex = (words) => words.map((w) => w.toString(16).padStart(8, '0')).join(' ');
const after12 = (key) => {
  const next = sfc32(...hash128(key));
  for (let i = 0; i < DISCARD; i++) next();
  return Array.from({ length: 6 }, next);
};

test('cyrb128 and sfc32 match the frozen vectors (a C implementation and a JS one agree; BUILD_PLAN S3 D1)', () => {
  const vectors = [
    ['K7QM2Q9F|weather|1', '47acdb0d 0abe34b6 1a4789f9 6a04cd47', [1802105178, 2002165890, 2985955968, 2887462840, 806044684, 1422306643]],
    ['K7QM2Q9F|roll|open|sign|ask|go|1|0', '46e96b51 a7e6da1e 9570dbd8 bd82a658', [367680790, 834485984, 245576797, 3532201080, 4150993154, 127079717]],
    ['00000000|text|lot|0|1', 'f283c334 3d76cfcd 0df71a7a 5e6c81d7', [2672373591, 921244267, 3590580282, 2298495726, 217717556, 4234772823]],
    ['', '027ae52e cfc79621 5593990d 4b41437c', [780688151, 1369530603, 4170761935, 2420727049, 3315390910, 31621017]],
  ];
  for (const [key, words, outs] of vectors) {
    assert.equal(hex(hash128(key)), words, `hash128(${JSON.stringify(key)})`);
    assert.deepEqual(after12(key), outs, `the first six after ${DISCARD} discards for ${JSON.stringify(key)}`);
  }
  const raw = sfc32(0, 0, 0, 1);
  assert.deepEqual(Array.from({ length: 6 }, raw), [1, 2, 12, 18874399, 56669315, 2581679515], 'raw sfc32(0, 0, 0, 1), no discards');
});

test('draw() builds its key as seed|stream|parts, so it agrees with the raw vectors', () => {
  assert.equal(keyOf('K7QM2Q9F', 'weather', [1]), 'K7QM2Q9F|weather|1');
  const g = draw('K7QM2Q9F', 'weather', 1);
  assert.deepEqual(Array.from({ length: 6 }, () => g.u32()), [1802105178, 2002165890, 2985955968, 2887462840, 806044684, 1422306643]);
  const r = draw('K7QM2Q9F', 'roll', 'open', 'sign', 'ask', 'go', 1, 0);
  assert.equal(r.u32(), 367680790);
  assert.equal(draw('00000000', 'text', 'lot', 0, 1).u32(), 2672373591);
});

test("E.8's eleven streams are frozen, and an unknown stream throws", () => {
  assert.deepEqual([...STREAMS], ['weather', 'env', 'permit', 'director', 'roll', 'effect', 'text', 'mini', 'art', 'dust', 'lookahead']);
  assert.ok(Object.isFrozen(STREAMS));
  assert.throws(() => draw('K7QM2Q9F', 'store', 1), { name: 'EngineError', code: 'invalid' });
  for (const s of STREAMS) assert.equal(typeof draw('K7QM2Q9F', s, 'x').u32(), 'number', `${s} draws`);
});

test('streams are independent: another stream, key part or order is another sequence; the same key the same (8.14)', () => {
  const seq = (...a) => {
    const g = draw(...a);
    return Array.from({ length: 8 }, () => g.u32());
  };
  const base = seq('K7QM2Q9F', 'roll', 'oldschool', 'fx', 'b', 'go', 1, 0);
  assert.deepEqual(seq('K7QM2Q9F', 'roll', 'oldschool', 'fx', 'b', 'go', 1, 0), base, 'the same key, the same draws');
  const others = [
    seq('K7QM2Q9F', 'effect', 'oldschool', 'fx', 'b', 'go', 1, 0),
    seq('K7QM2Q9F', 'roll', 'gentle', 'fx', 'b', 'go', 1, 0),
    seq('K7QM2Q9F', 'roll', 'oldschool', 'fx', 'b', 'go', 2, 0),
    seq('K7QM2Q9F', 'roll', 'oldschool', 'fx', 'b', 'go', 1, 1),
    seq('K7QM2Q9F', 'roll', 'oldschool', 'b', 'fx', 'go', 1, 0),
    seq('K7QM2Q9G', 'roll', 'oldschool', 'fx', 'b', 'go', 1, 0),
    seq('K7QM2Q9F', 'mini', 'can', 'fx', 1, 0),
  ];
  for (const o of others) assert.notDeepEqual(o, base);
  assert.equal(new Set(others.map((o) => o.join(','))).size, others.length);
});

test('int(3) over 30,000 seeded draws is within 1% of uniform; float is in [0, 1); pick follows the weights', () => {
  const counts = [0, 0, 0];
  for (let i = 0; i < 30000; i++) counts[draw('K7QM2Q9F', 'director', 'uniform', i).int(3)]++;
  for (const c of counts) assert.ok(Math.abs(c - 10000) <= 300, `${counts} within 1% of 10,000 each`);
  let lo = 1;
  let hi = 0;
  for (let i = 0; i < 5000; i++) {
    const f = draw('K7QM2Q9F', 'env', 'float', i).float();
    lo = Math.min(lo, f);
    hi = Math.max(hi, f);
    assert.ok(f >= 0 && f < 1);
  }
  assert.ok(lo < 0.01 && hi > 0.99, 'floats cover the range');
  const picks = [0, 0, 0];
  for (let i = 0; i < 6000; i++) picks[draw('K7QM2Q9F', 'director', 'pick', i).pick([1, 0, 2])]++;
  assert.equal(picks[1], 0, 'a zero weight is never picked');
  assert.ok(Math.abs(picks[2] / picks[0] - 2) < 0.15, `${picks}: about 2 to 1`);
  const g = draw('K7QM2Q9F', 'env', 'edge');
  assert.equal(g.int(1), 0);
  assert.ok(g.int(2 ** 32) < 2 ** 32);
});

test('bad keys, seeds and arguments throw EngineError("invalid")', () => {
  const bad = (f) => assert.throws(f, { name: 'EngineError', code: 'invalid' });
  bad(() => draw('k7qm2q9f', 'roll', 'x'));
  bad(() => draw('K7QM2Q9', 'roll', 'x'));
  bad(() => draw('K7QM2Q9I', 'roll', 'x'));
  bad(() => draw('K7QM2Q9F', 'roll', 'a|b'));
  bad(() => draw('K7QM2Q9F', 'roll', 'Go'));
  bad(() => draw('K7QM2Q9F', 'roll', 'café'));
  bad(() => draw('K7QM2Q9F', 'roll', -1));
  bad(() => draw('K7QM2Q9F', 'roll', 1.5));
  bad(() => draw('K7QM2Q9F', 'roll', 2 ** 53));
  bad(() => draw('K7QM2Q9F', 'roll', null));
  bad(() => hash128('é'));
  const g = draw('K7QM2Q9F', 'roll', 'x');
  bad(() => g.int(0));
  bad(() => g.int(2 ** 32 + 1));
  bad(() => g.pick([]));
  bad(() => g.pick([0, 0]));
  bad(() => g.pick([1.5]));
});

test('Math.random, Date, performance.now and the approximate Math functions throw while the engine runs, and it still runs (D11)', () => {
  const content = fxContent();
  const result = withBans(() => {
    assert.throws(() => Math.random(), /the engine called Math\.random/, 'the ban is in force');
    const draws = draw('K7QM2Q9F', 'roll', 'x').float();
    const m = [exp(1), ln(2), pow(2, 0.5), sin(1), cos(1)];
    const { session } = play(newSession(content), [
      { t: 'sign', name: 'Robin', id: 'h00000001' },
      { t: 'start', plan: 'fx_plan', seed: 'K7QM2Q9F' },
      { t: 'next' },
      { t: 'wait', s: 60 },
      { t: 'choose', c: 'go' },
      { t: 'next' },
    ], content);
    const r = replay({ log: session.log, profile: session.state.trip.profile, base: null }, content);
    return { draws, m, end: session.state.trip.end, hash: r.hash, id: identity({ log: session.log, profile: session.state.trip.profile }, content) };
  });
  assert.equal(typeof Math.random(), 'number', 'the originals are back');
  assert.equal(typeof Date.now(), 'number');
  assert.equal(result.end, 'fx_plan');
  assert.match(result.hash, /^[0-9a-f]{64}$/);
  assert.match(result.id, /^[0-9a-f]{64}$/);
});
