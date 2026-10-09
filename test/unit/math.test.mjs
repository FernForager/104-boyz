// Deterministic math (BUILD_PLAN 6.6 math; GAME_DESIGN E.12 #3): exp, ln,
// pow, sin and cos from exact IEEE operations only, against the platform's
// Math on fixed grids, with their exact cases and their domains.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { exp, ln, pow, sin, cos, twoPow, PI, EXP_MAX, TRIG_MAX } from '../../web/js/engine/math.js';
import { ROOT } from '../../tools/pics.mjs';

const N = 10000;
const rel = (a, b) => (b === 0 ? Math.abs(a) : Math.abs(a - b) / Math.abs(b));
const worst = (xs, f, g) => {
  let w = 0;
  let at = null;
  for (const x of xs) {
    const e = rel(f(x), g(x));
    if (e > w) {
      w = e;
      at = x;
    }
  }
  return { w, at };
};
const grid = (lo, hi, n = N) => Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n);

test('exp matches Math.exp to 1e-14 on a 10,000-point grid over [-700, 700]', () => {
  const { w, at } = worst(grid(-699.9, 699.9), exp, Math.exp);
  assert.ok(w <= 1e-14, `worst ${w} at ${at}`);
  const small = worst(grid(-1, 1), exp, Math.exp);
  assert.ok(small.w <= 1e-14, `worst ${small.w} at ${small.at}`);
});

test('ln matches Math.log to 1e-14 from 1e-300 to 1e300, and near 1', () => {
  const xs = grid(-300, 300).map((e) => 1.2345 * 10 ** e);
  const { w, at } = worst(xs, ln, Math.log);
  assert.ok(w <= 1e-14, `worst ${w} at ${at}`);
  const near = worst(grid(0.5, 2), ln, Math.log);
  assert.ok(near.w <= 1e-14, `worst ${near.w} at ${near.at}`);
  assert.equal(ln(Number.MIN_VALUE), Math.log(Number.MIN_VALUE), 'a subnormal reduces exactly');
  assert.equal(ln(Number.MAX_VALUE), Math.log(Number.MAX_VALUE));
});

test('pow matches Math.pow to 1e-12 where |y ln x| <= 50', () => {
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const x = 0.01 + (i % 100) * 1.37 + i / 1000;
    const y = -5 + (10 * ((i * 7919) % N)) / N;
    if (Math.abs(y * Math.log(x)) <= 50) pts.push([x, y]);
  }
  assert.ok(pts.length > 5000);
  const { w, at } = worst(pts, ([x, y]) => pow(x, y), ([x, y]) => Math.pow(x, y));
  assert.ok(w <= 1e-12, `worst ${w} at ${at}`);
  assert.equal(pow(2, 3), 8, 'small integer powers are exact');
  assert.equal(pow(-2, 3), -8, 'a negative base takes its sign from an odd power');
  assert.equal(pow(-2, 2), 4);
  assert.equal(pow(10, -2), 0.01);
  assert.ok(rel(pow(-1.5, 71), Math.pow(-1.5, 71)) < 1e-12, 'a large odd power of a negative base');
});

test('sin and cos match Math to 1e-14 on a 10,000-point grid over [-1e5, 1e5], and on [-10, 10]', () => {
  for (const [f, g, name] of [
    [sin, Math.sin, 'sin'],
    [cos, Math.cos, 'cos'],
  ]) {
    const wide = worst(grid(-99999.9, 99999.9), f, g);
    assert.ok(wide.w <= 1e-14, `${name}: worst ${wide.w} at ${wide.at}`);
    const near = worst(grid(-10, 10, N - 1), f, g);
    assert.ok(near.w <= 1e-14, `${name}: worst ${near.w} at ${near.at}`);
  }
});

test('the exact cases: exp(0), ln(1), sin(0), cos(0), pow(x, 0), pow(x, 1), and no -0', () => {
  assert.equal(exp(0), 1);
  assert.equal(exp(-0), 1);
  assert.equal(ln(1), 0);
  assert.ok(Object.is(sin(0), 0));
  assert.ok(Object.is(sin(-0), 0), 'sin(-0) is 0, not -0');
  assert.equal(cos(0), 1);
  for (const x of [0.1, 2.5, 7, 1e10, -3]) {
    assert.equal(pow(x, 0), 1);
    assert.equal(pow(x, 1), x);
  }
  assert.ok(Object.is(pow(-0, 1), 0));
  assert.equal(pow(0, 2.5), 0);
  assert.equal(PI, Math.PI);
  assert.equal(twoPow(10), 1024);
  assert.equal(twoPow(-1074), Number.MIN_VALUE);
  assert.equal(twoPow(1023), 2 ** 1023);
});

test('out of its domain, each throws EngineError("expr"), never NaN or an infinity', () => {
  const bad = (f) => assert.throws(f, { name: 'EngineError', code: 'expr' });
  bad(() => exp(EXP_MAX + 1));
  bad(() => exp(NaN));
  bad(() => exp(Infinity));
  bad(() => ln(0));
  bad(() => ln(-1));
  bad(() => ln(Infinity));
  bad(() => ln(NaN));
  bad(() => pow(0, -1));
  bad(() => pow(-2, 0.5));
  bad(() => pow(10, 400));
  bad(() => pow(NaN, 2));
  bad(() => sin(TRIG_MAX * 2));
  bad(() => cos(NaN));
  bad(() => exp(/** @type {any} */ ('1')));
});

test('math.js uses only exact operations and literal coefficients: no Math.exp, log, pow or trig, no ** (6.6)', () => {
  const src = readFileSync(join(ROOT, 'web', 'js', 'engine', 'math.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  assert.ok(!/\bMath\.(exp|expm1|log\w*|pow|sin|cos|tan|a?sinh?|a?cosh?|a?tanh?|atan2|cbrt|hypot|random)\b/.test(src));
  assert.ok(!src.includes('**'));
  const used = new Set([...src.matchAll(/\bMath\.(\w+)/g)].map((m) => m[1]));
  assert.deepEqual([...used].sort(), ['floor', 'round']);
});
