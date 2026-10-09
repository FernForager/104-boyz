// SHA-256 and canonical JSON (BUILD_PLAN 6.6; GAME_DESIGN E.12): the pure
// hash agrees with FIPS 180-4's vectors and node:crypto, and canonical JSON
// is one string per value.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sha256, sha256Hex, asciiBytes, toHex } from '../../web/js/engine/hash.js';
import { canon, plain, deepFreeze, byCode } from '../../web/js/engine/canon.js';
import { draw } from '../../web/js/engine/rng.js';

test("SHA-256 matches FIPS 180-4's vectors", () => {
  assert.equal(sha256Hex(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal(sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'), '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  assert.equal(sha256Hex('a'.repeat(1000)), createHash('sha256').update('a'.repeat(1000)).digest('hex'));
});

test('SHA-256 agrees with node:crypto on 200 seeded byte strings, lengths 0 to 300 (every padding case)', () => {
  for (let i = 0; i < 200; i++) {
    const g = draw('K7QM2Q9F', 'env', 'sha', i);
    const n = g.int(301);
    const bytes = new Uint8Array(n);
    for (let k = 0; k < n; k++) bytes[k] = g.int(256);
    assert.equal(toHex(sha256(bytes)), createHash('sha256').update(bytes).digest('hex'), `length ${n}`);
  }
  for (const n of [55, 56, 63, 64, 65, 119, 120]) {
    const b = new Uint8Array(n).fill(0x61);
    assert.equal(sha256Hex(b), createHash('sha256').update(b).digest('hex'), `the padding boundary at ${n}`);
  }
});

test('the hash takes ASCII strings only (everything hashed is ASCII)', () => {
  assert.throws(() => sha256Hex('é'), { name: 'EngineError', code: 'invalid' });
  assert.throws(() => sha256(/** @type {any} */ ([1, 2])), { name: 'EngineError', code: 'invalid' });
  assert.deepEqual([...asciiBytes('OP')], [0x4f, 0x50]);
});

test('canonical JSON: keys by code unit, no whitespace, -0 as 0, arrays in order', () => {
  assert.equal(canon({ b: 1, a: [3, 2, { z: true, Z: null }] }), '{"a":[3,2,{"Z":null,"z":true}],"b":1}');
  assert.equal(canon({ B: 1, a: 2, _: 3, 1: 4 }), '{"1":4,"B":1,"_":3,"a":2}');
  assert.equal(canon(-0), '0');
  assert.equal(canon([-0, 0.5, 1e21, 'x"y']), '[0,0.5,1e+21,"x\\"y"]');
  assert.equal(canon(Object.create(null)), '{}');
  assert.deepEqual(plain({ b: [1, { d: -0 }], a: 'x' }), { a: 'x', b: [1, { d: 0 }] });
  assert.ok(Object.is(plain({ x: -0 }).x, 0));
  assert.deepEqual(['b', 'B', 'a', '_'].sort(byCode), ['B', '_', 'a', 'b']);
});

test('canonical JSON refuses what JSON cannot say one way', () => {
  const bad = (v) => assert.throws(() => canon(v), { name: 'EngineError', code: 'invalid' });
  bad(undefined);
  bad(NaN);
  bad(Infinity);
  bad(() => 1);
  bad(new Map());
  bad(new Date(0));
  bad({ x: undefined });
  bad('é');
  bad({ é: 1 });
  bad(1n);
});

test('deepFreeze freezes every level', () => {
  const v = deepFreeze({ a: { b: [1, { c: 2 }] } });
  assert.ok(Object.isFrozen(v.a.b[1]));
  assert.throws(() => {
    'use strict';
    v.a.b[1].c = 3;
  }, TypeError);
});
