// The card expression language (BUILD_PLAN 6.6 expr; GAME_DESIGN 8.3;
// engine.md 4.3): parsing, types against schemas/vars.json, the function
// whitelist, closures that agree with a plain tree-walk, and no loops, no
// assignment, no randomness.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, check, compile, format, depthOf, FUNCS, MAX_LENGTH, MAX_DEPTH } from '../../web/js/engine/expr.js';
import { draw } from '../../web/js/engine/rng.js';
import { ROOT } from '../../tools/pics.mjs';

const VARS = JSON.parse(readFileSync(join(ROOT, 'schemas', 'vars.json'), 'utf8'));

/** An env over plain values. */
const envOf = ({ vars = {}, flags = [], seen = [] } = {}) => ({
  v: (p) => {
    if (!(p in vars)) throw new Error(`no ${p}`);
    return vars[p];
  },
  flag: (id) => flags.includes(id),
  seen: (id) => seen.includes(id),
});
const run = (src, env = {}) => compile(parse(src))(envOf(env));

test('precedence and associativity follow the grammar', () => {
  assert.deepEqual(parse('1 + 2 * 3'), ['bin', '+', ['num', 1], ['bin', '*', ['num', 2], ['num', 3]]]);
  assert.deepEqual(parse('1 - 2 - 3'), ['bin', '-', ['bin', '-', ['num', 1], ['num', 2]], ['num', 3]], 'left-associative');
  assert.deepEqual(parse('8 / 4 / 2'), ['bin', '/', ['bin', '/', ['num', 8], ['num', 4]], ['num', 2]]);
  assert.deepEqual(parse('-2 * 3'), ['bin', '*', ['neg', ['num', 2]], ['num', 3]], 'unary minus binds tightest');
  assert.deepEqual(parse('!true && false || true'), ['or', ['and', ['not', ['bool', true]], ['bool', false]], ['bool', true]]);
  assert.deepEqual(parse('true || false && false'), ['or', ['bool', true], ['and', ['bool', false], ['bool', false]]]);
  assert.throws(() => parse('1 < 2 == true'), { code: 'expr' }, 'comparisons do not chain, even mixed');
  assert.deepEqual(parse('(1 < 2) == true'), ['bin', '==', ['bin', '<', ['num', 1], ['num', 2]], ['bool', true]]);
  assert.deepEqual(parse("a ? 1 : b ? 2 : 3".replace(/a|b/g, (m) => `flag('${m}')`)), [
    'cond',
    ['call', 'flag', [['id', 'a']]],
    ['num', 1],
    ['cond', ['call', 'flag', [['id', 'b']]], ['num', 2], ['num', 3]],
  ]);
  assert.deepEqual(parse("trip.day in [1, 2]"), ['in', ['var', 'trip.day'], [['num', 1], ['num', 2]]]);
  assert.deepEqual(parse("0.5 + (flag('rested') ? 0.25 : 0)"), ['bin', '+', ['num', 0.5], ['cond', ['call', 'flag', [['id', 'rested']]], ['num', 0.25], ['num', 0]]]);
  assert.equal(run('1 - 2 - 3'), -4);
  assert.equal(run('2 + 3 * 4 % 5'), 4);
  assert.equal(run('-(2 + 3) * 2'), -10);
  assert.equal(run('!(1 < 2) || 3 >= 3'), true);
});

test('parse errors carry a column, and anything outside the grammar fails', () => {
  const col = (src) => {
    try {
      parse(src);
    } catch (e) {
      assert.equal(e.name, 'EngineError');
      assert.equal(e.code, 'expr');
      return e.detail.col;
    }
    return assert.fail(`${src} parsed`);
  };
  assert.equal(col('x = 1'), 3);
  assert.equal(col('1 +'), 4);
  assert.equal(col('a < b < c'), 7, 'comparisons do not chain');
  assert.equal(col('(1 + 2'), 7);
  assert.equal(col("'Hi'"), 2, 'a string is an id');
  assert.equal(col('1e5'), 2, 'no exponents');
  assert.equal(col('1.'), 2);
  assert.equal(col('a.b()'), 4, 'only a whitelisted function, by its bare name');
  assert.equal(col('max(1, 2).x'), 10, 'nothing follows a call');
  for (const src of ['x = 1', 'x += 1', 'x++', 'a; b', '{}', '`x`', '() => 1', 'while (true) {}', 'for (;;)', 'Math.random()', 'a & b', 'a | b', 'true.x', '"x"', '']) {
    assert.throws(() => parse(src), { name: 'EngineError', code: 'expr' }, src);
  }
});

test('no loops, no assignment, no randomness: each fails to parse or to check (6.6)', () => {
  const fails = (src) => {
    let ok = false;
    try {
      ok = check(parse(src), VARS).errors.length === 0;
    } catch (e) {
      assert.equal(e.code, 'expr');
    }
    assert.ok(!ok, `${src} must fail`);
  };
  for (const src of ['x = 1', 'while', 'rand()', 'random()', 'Math.random()', 'a.b()', 'for(1)', 'loop', 'eval(1)', 'seed', 'null']) fails(src);
  assert.ok(!Object.keys(FUNCS).some((f) => /rand|roll|eval|loop/.test(f)), 'the whitelist has no randomness');
});

test('the type checker: every error and warning it gives', () => {
  const errs = (src, want) => check(parse(src), VARS, want).errors;
  const ok = (src, want) => assert.deepEqual(errs(src, want), [], src);
  ok("0.5 + (flag('rested') ? 0.25 : 0)", 'number');
  ok("!flag('rested')", 'bool');
  ok('clamp(skill.footing * 0.1, 0, 1)', 'number');
  ok("trip.day in [1, 2, 3] && seen('x')", 'bool');
  ok("lerp(0, 1, 0.5) + step(1, trip.n) + round(1.5) + floor(1.5) + ceil(1.5) + abs(-1) + min(1, 2, 3) + max(1, 2)", 'number');
  assert.match(errs('trip.dy')[0], /unknown variable trip\.dy/);
  assert.match(errs('rand()')[0], /unknown function rand\(\)/);
  assert.match(errs('abs(1, 2)')[0], /abs\(\) takes 1 argument, not 2/);
  assert.match(errs('min(1)')[0], /two or more/);
  assert.match(errs("flag(1)")[0], /argument 1 is number, not an id/);
  assert.match(errs('true + 1')[0], /"\+" takes numbers, not bool/);
  assert.match(errs('!1')[0], /"!" takes a bool, not number/);
  assert.match(errs('-true')[0], /"-" takes a number, not bool/);
  assert.match(errs('1 && true')[0], /"&&" takes bools, not number/);
  assert.match(errs("1 == 'a'")[0], /"==" compares number with id/);
  assert.match(errs('1 ? 1 : 2')[0], /needs a bool before it/);
  assert.match(errs("true ? 1 : false")[0], /both sides need one type/);
  assert.match(errs("trip.day in ['a']")[0], /looks for number in a list holding id/);
  assert.match(errs('trip.day in [trip.n]')[0], /a list of literals/);
  assert.match(errs('1 / 0')[0], /by zero/);
  assert.match(errs('1 % -0')[0], /by zero/);
  assert.match(errs('1 < 2', 'number')[0], /wants a number, and this is a bool/);
  assert.match(errs('1', 'bool')[0], /wants a bool/);
  const w = check(parse('1 / clock.s'), VARS);
  assert.deepEqual(w.errors, []);
  assert.match(w.warnings[0], /by clock\.s, whose range includes 0/);
  assert.deepEqual(check(parse('1 / trip.day'), VARS).warnings, [], "trip.day's range starts at 1");
  assert.equal(check(parse('1 / 0'), VARS).type, null, 'no type with an error');
});

test('the limits: 500 characters and an AST 32 deep', () => {
  const long = `max(${'1, '.repeat(164)}1)`;
  assert.equal(long.length, 498);
  assert.doesNotThrow(() => parse(`${long}  `), '500 characters');
  assert.throws(() => parse(`${long}   `), { code: 'expr' }, '501 characters');
  assert.equal(MAX_LENGTH, 500);
  const deep = (n) => `${'-'.repeat(n - 1)}1`;
  assert.equal(depthOf(parse(deep(MAX_DEPTH))), MAX_DEPTH);
  assert.throws(() => parse(deep(MAX_DEPTH + 1)), { code: 'expr' });
  assert.ok(check(['not', ['not', ['bool', true]]], VARS).type === 'bool');
});

test('runtime: division by zero throws, && and || short-circuit, -0 comes out as 0', () => {
  assert.throws(() => run('1 / trip.n', { vars: { 'trip.n': 0 } }), { name: 'EngineError', code: 'expr' });
  assert.throws(() => run('5 % trip.n', { vars: { 'trip.n': 0 } }), { code: 'expr' });
  assert.equal(run("flag('x') && 1 / trip.n > 0", { vars: { 'trip.n': 0 } }), false, '&& stops at false');
  assert.equal(run("!flag('x') || 1 / trip.n > 0", { vars: { 'trip.n': 0 } }), true, '|| stops at true');
  for (const src of ['-0', '0 * -1', 'round(-0.4)', 'min(0, -0)', '-(1 - 1)', 'ceil(-0.5)', '0 / -1', 'clamp(-0, -0, 0)']) assert.ok(Object.is(run(src), 0), `${src} is 0, not -0`);
  assert.equal(run('lerp(10, 20, 0.25)'), 12.5);
  assert.equal(run('step(2, 1) + step(2, 2)'), 1);
  assert.equal(run("seen('bear') && skill.river == 2", { vars: { 'skill.river': 2 }, seen: ['bear'] }), true);
});

test('the syntax tree round-trips through JSON and through format()', () => {
  for (const src of ["0.5 + (flag('rested') ? 0.25 : 0)", "!flag('rested')", '-(1 - 2) * 3', 'trip.day in [1, -2] || !(clock.s >= 30600)', 'a(1)'.replace('a', 'max') + ' - 1 - (2 - 3)', "flag('a') ? flag('b') ? 1 : 2 : 3", '(1 < 2) == true']) {
    const ast = parse(src);
    assert.deepEqual(JSON.parse(JSON.stringify(ast)), ast);
    assert.deepEqual(parse(format(ast)), ast, `${src} -> ${format(ast)}`);
  }
});

// ---- Random well-typed expressions against a reference tree-walk ----------

const NUM_VARS = Object.keys(VARS.vars);
const FLAGS = ['a', 'b', 'rested'];

/** A random well-typed syntax tree of a type, from a seeded generator. */
function gen(g, type, depth) {
  const leaf = depth <= 1 || g.int(3) === 0;
  if (type === 'number') {
    if (leaf) return g.int(2) ? ['num', [0, 1, 2, 0.5, 0.25, 3, 10][g.int(7)]] : ['var', NUM_VARS[g.int(NUM_VARS.length)]];
    const k = g.int(7);
    if (k === 0) return ['neg', gen(g, 'number', depth - 1)];
    if (k === 1) return ['cond', gen(g, 'bool', depth - 1), gen(g, 'number', depth - 1), gen(g, 'number', depth - 1)];
    if (k === 2) {
      const f = ['min', 'max', 'abs', 'clamp', 'round', 'floor', 'ceil', 'lerp', 'step'][g.int(9)];
      const n = FUNCS[f].args === 'many' ? 2 + g.int(2) : FUNCS[f].args.length;
      return ['call', f, Array.from({ length: n }, () => gen(g, 'number', depth - 1))];
    }
    const op = ['+', '-', '*', '/', '%'][g.int(5)];
    let b = gen(g, 'number', depth - 1);
    // A literal zero divisor is a check error; a variable one throws at run time (tested).
    if ((op === '/' || op === '%') && ((b[0] === 'num' && b[1] === 0) || (b[0] === 'neg' && b[1][0] === 'num' && b[1][1] === 0))) b = ['num', 3];
    return ['bin', op, gen(g, 'number', depth - 1), b];
  }
  if (leaf) return g.int(2) ? ['bool', g.int(2) === 1] : ['call', 'flag', [['id', FLAGS[g.int(3)]]]];
  const k = g.int(6);
  if (k === 0) return ['not', gen(g, 'bool', depth - 1)];
  if (k === 1) return [g.int(2) ? 'and' : 'or', gen(g, 'bool', depth - 1), gen(g, 'bool', depth - 1)];
  if (k === 2) return ['in', gen(g, 'number', depth - 1), [['num', 1], ['neg', ['num', 2]], ['num', 0.5]]];
  if (k === 3) return ['cond', gen(g, 'bool', depth - 1), gen(g, 'bool', depth - 1), gen(g, 'bool', depth - 1)];
  return ['bin', ['<', '<=', '>', '>=', '==', '!='][g.int(6)], gen(g, 'number', depth - 1), gen(g, 'number', depth - 1)];
}

/** The reference: a plain recursive evaluation (or 'expr' for a division by zero). */
function evaluate(n, env) {
  const z = (v) => (v === 0 ? 0 : v);
  switch (n[0]) {
    case 'num':
    case 'bool':
    case 'id':
      return n[1];
    case 'var':
      return env.vars[n[1]];
    case 'neg':
      return z(-evaluate(n[1], env));
    case 'not':
      return !evaluate(n[1], env);
    case 'and':
      return evaluate(n[1], env) ? Boolean(evaluate(n[2], env)) : false;
    case 'or':
      return evaluate(n[1], env) ? true : Boolean(evaluate(n[2], env));
    case 'cond':
      return evaluate(n[1], env) ? evaluate(n[2], env) : evaluate(n[3], env);
    case 'in': {
      const v = evaluate(n[1], env);
      return n[2].some((i) => evaluate(i, env) === v);
    }
    case 'call': {
      const a = n[2].map((x) => evaluate(x, env));
      const f = {
        flag: () => env.flags.includes(a[0]),
        seen: () => false,
        min: () => Math.min(...a),
        max: () => Math.max(...a),
        abs: () => Math.abs(a[0]),
        clamp: () => Math.min(Math.max(a[0], a[1]), a[2]),
        round: () => Math.round(a[0]),
        floor: () => Math.floor(a[0]),
        ceil: () => Math.ceil(a[0]),
        lerp: () => a[0] + (a[1] - a[0]) * a[2],
        step: () => (a[1] < a[0] ? 0 : 1),
      }[n[1]];
      const v = f();
      return typeof v === 'number' ? z(v) : v;
    }
    case 'bin': {
      const a = evaluate(n[2], env);
      const b = evaluate(n[3], env);
      switch (n[1]) {
        case '+':
          return z(a + b);
        case '-':
          return z(a - b);
        case '*':
          return z(a * b);
        case '/':
          if (b === 0) throw Object.assign(new Error('div'), { code: 'expr' });
          return z(a / b);
        case '%':
          if (b === 0) throw Object.assign(new Error('div'), { code: 'expr' });
          return z(a % b);
        case '<':
          return a < b;
        case '<=':
          return a <= b;
        case '>':
          return a > b;
        case '>=':
          return a >= b;
        case '==':
          return a === b;
        default:
          return a !== b;
      }
    }
    default:
      throw new Error(`no ${n[0]}`);
  }
}

test('compile agrees with a reference tree-walk on 500 seeded random well-typed expressions', () => {
  let thrown = 0;
  for (let i = 0; i < 500; i++) {
    const g = draw('K7QM2Q9F', 'lookahead', 'expr', i);
    const type = g.int(2) ? 'number' : 'bool';
    const ast = gen(g, type, 2 + g.int(5));
    const c = check(ast, VARS, type);
    assert.deepEqual(c.errors, [], `${format(ast)} is well typed`);
    assert.deepEqual(parse(format(ast)), ast, `${format(ast)} round-trips`);
    const vars = Object.fromEntries(NUM_VARS.map((v, k) => [v, (i + k) % 4]));
    const env = { vars, flags: FLAGS.filter((_, k) => (i >> k) & 1) };
    let want;
    let got;
    try {
      want = evaluate(ast, env);
    } catch (e) {
      want = `!${e.code}`;
    }
    try {
      got = compile(ast)(envOf(env));
    } catch (e) {
      got = `!${e.code}`;
    }
    if (want === '!expr') thrown++;
    assert.ok(Object.is(got, want) || (Number.isNaN(got) && Number.isNaN(want)), `${format(ast)}: ${got} vs ${want}`);
  }
  assert.ok(thrown > 0 && thrown < 250, `some, not most, divide by zero (${thrown})`);
});
