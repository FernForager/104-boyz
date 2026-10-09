// The complete action log in its canonical form (BUILD_PLAN 6.6 clock and
// log, 14.1 T0; GAME_DESIGN E.12): varint packing byte for byte, strict
// decoding, base64url, round trips, identity without no-ops, and replay.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pack, unpack, toBase64url, fromBase64url, writeVarint, zigzag, unzigzag, KINDS } from '../../web/js/engine/log.js';
import { replay, identity, startOf } from '../../web/js/engine/replay.js';
import { hash12 } from '../../web/js/engine/step.js';
import { canon } from '../../web/js/engine/canon.js';
import { draw } from '../../web/js/engine/rng.js';
import { fxContent, play, started } from './enginefix.mjs';

const hex = (b) => [...b].map((x) => x.toString(16).padStart(2, '0')).join(' ');
const varint = (v) => {
  const out = [];
  writeVarint(out, v);
  return hex(out);
};
const LOG = { format: 1, rules: '3f9a1c2b7d4e', mode: 'open', rule: 'oldschool', seed: 'K7QM2Q9F', plan: 'sample', profile: '9c41d07a2b13', base: '', actions: [['next'], ['choose', 'go'], ['wait', 600]] };

test('varint, zigzag and base64url match the vectors (BUILD_PLAN S3 D7)', () => {
  assert.equal(varint(0), '00');
  assert.equal(varint(1), '01');
  assert.equal(varint(127), '7f');
  assert.equal(varint(128), '80 01');
  assert.equal(varint(300), 'ac 02');
  assert.equal(varint(16384), '80 80 01');
  assert.equal(varint(2 ** 32 - 1), 'ff ff ff ff 0f');
  assert.equal(varint(2 ** 53 - 1), 'ff ff ff ff ff ff ff 0f', 'by arithmetic, past 32 bits');
  assert.throws(() => varint(-1), { code: 'invalid' });
  assert.throws(() => varint(2 ** 53), { code: 'invalid' });
  assert.deepEqual([0, -1, 1, -2, 2].map(zigzag), [0, 1, 2, 3, 4]);
  assert.deepEqual([0, 1, 2, 3, 4].map(unzigzag), [0, -1, 1, -2, 2]);
  assert.equal(unzigzag(zigzag(-(2 ** 52))), -(2 ** 52));
  assert.equal(toBase64url(Uint8Array.from([0x4f, 0x50, 0x01])), 'T1AB');
  assert.equal(toBase64url(Uint8Array.from([0xfb, 0xff])), '-_8', 'the url alphabet, no padding');
  assert.deepEqual([...fromBase64url('T1AB')], [0x4f, 0x50, 0x01]);
  for (let n = 0; n < 40; n++) {
    const b = Uint8Array.from({ length: n }, (_, i) => (i * 97 + n * 31) % 256);
    assert.equal(toBase64url(b), Buffer.from(b).toString('base64url'), `length ${n} matches RFC 4648 section 5`);
    assert.deepEqual(fromBase64url(toBase64url(b)), b);
  }
});

test("the packed form, field by field, for the spec's example log", () => {
  const bytes = pack(LOG);
  const str = (s) => [s.length.toString(16).padStart(2, '0'), ...[...s].map((c) => c.charCodeAt(0).toString(16))].join(' ');
  const want = ['4f 50', '01', str('3f9a1c2b7d4e'), '00', '00', str('K7QM2Q9F'), str('sample'), str('9c41d07a2b13'), '00', '01', str('go'), '03', `${hex([KINDS.next])}`, '02 00', '03 d8 04'].join(' ');
  assert.equal(hex(bytes), want);
  assert.deepEqual(unpack(bytes), LOG);
  assert.deepEqual(KINDS, { next: 1, choose: 2, wait: 3 });
});

test('strict decoding: anything not canonical throws EngineError("format")', () => {
  const good = [...pack(LOG)];
  const bad = (bytes, why) => assert.throws(() => unpack(Uint8Array.from(bytes)), { name: 'EngineError', code: 'format' }, why);
  bad([0x4f, 0x51, ...good.slice(2)], 'a bad magic');
  bad([...good.slice(0, 2), 2, ...good.slice(3)], 'an unknown format');
  bad([...good, 0], 'trailing bytes');
  bad(good.slice(0, -1), 'cut short');
  // mode and rule sit after "OP", the format and the 13-byte rules string.
  const at = 2 + 1 + 13;
  bad([...good.slice(0, at), 3, ...good.slice(at + 1)], 'an unknown mode');
  bad([...good.slice(0, at + 1), 2, ...good.slice(at + 2)], 'an unknown rule');
  bad([...good.slice(0, at), 0x80, 0x00, ...good.slice(at + 1)], 'a non-minimal varint');
  // The tail: T=1, "go", N=3, then next, choose 0, wait 600 (11 bytes).
  const head = good.slice(0, good.length - 11);
  assert.deepEqual(good.slice(head.length), [0x01, 0x02, 0x67, 0x6f, 0x03, 0x01, 0x02, 0x00, 0x03, 0xd8, 0x04]);
  const go = [0x02, 0x67, 0x6f];
  const up = [0x02, 0x75, 0x70];
  assert.doesNotThrow(() => unpack(Uint8Array.from([...head, 0x01, ...go, 0x03, 0x01, 0x02, 0x00, 0x03, 0xd8, 0x04])), 'the parts put back');
  bad([...head, 0x01, ...go, 0x02, 0x02, 0x00, 0x09], 'an unknown kind');
  bad([...head, 0x01, ...go, 0x01, 0x02, 0x01], 'a table index out of range');
  bad([...head, 0x01, ...go, 0x02, 0x02, 0x00, 0x03, 0x81, 0xa3, 0x05], 'a wait over 86,400');
  bad([...head, 0x02, ...go, ...up, 0x02, 0x02, 0x01, 0x02, 0x00], 'a table out of the order of first use');
  bad([...head, 0x02, ...go, ...up, 0x01, 0x02, 0x00], 'a table entry never used');
  bad([...head, 0x02, ...go, ...go, 0x02, 0x02, 0x00, 0x02, 0x01], 'a repeated table entry');
  bad([...head, 0x00, 0x01, 0x03, 0x80, 0x00], 'a non-minimal varint in an action');
  assert.deepEqual(unpack(Uint8Array.from([...head, 0x02, ...go, ...up, 0x02, 0x02, 0x00, 0x02, 0x01])).actions, [['choose', 'go'], ['choose', 'up']]);
  const empty = [...pack(LOG)];
  empty[3] = 0;
  bad(empty, 'an empty string');
  const nonAscii = [...pack(LOG)];
  nonAscii[4] = 0xe9;
  bad(nonAscii, 'a byte outside 0x21..0x7E');
  assert.deepEqual([...fromBase64url('T1A')], [0x4f, 0x50]);
  assert.throws(() => fromBase64url('T1B'), { code: 'format' }, 'stray bits');
  assert.throws(() => fromBase64url('TR'), { code: 'format' }, 'stray bits');
  assert.throws(() => fromBase64url('T1A='), { code: 'format' }, 'padding');
  assert.throws(() => fromBase64url('T1A+'), { code: 'format' }, 'not the url alphabet');
  assert.throws(() => fromBase64url('T'), { code: 'format' });
});

test('pack refuses a log that is not one this format can say', () => {
  const bad = (log) => assert.throws(() => pack(log), { name: 'EngineError', code: 'format' });
  bad({ ...LOG, rules: 'dev' });
  bad({ ...LOG, mode: 'storybook' });
  bad({ ...LOG, rule: 'easy' });
  bad({ ...LOG, seed: 'k7qm2q9f' });
  bad({ ...LOG, plan: 'Sample' });
  bad({ ...LOG, base: 'x' });
  bad({ ...LOG, actions: [['wait', 86401]] });
  bad({ ...LOG, actions: [['wait', -1]] });
  bad({ ...LOG, actions: [['choose']] });
  bad({ ...LOG, actions: [['jump']] });
  bad({ ...LOG, extra: 1 });
});

/** A random log in JSON form, from a seeded generator. */
function randomLog(i) {
  const g = draw('K7QM2Q9F', 'lookahead', 'log', i);
  const hex12 = () => Array.from({ length: 12 }, () => '0123456789abcdef'[g.int(16)]).join('');
  const b32 = (n) => Array.from({ length: n }, () => '0123456789ABCDEFGHJKMNPQRSTVWXYZ'[g.int(32)]).join('');
  const ids = ['go', 'rest', 'wade', 'camp_here', 'x1', 'look'];
  const actions = Array.from({ length: g.int(40) }, () => {
    const k = g.int(3);
    if (k === 0) return ['next'];
    if (k === 1) return ['choose', ids[g.int(ids.length)]];
    return ['wait', g.int(2) ? g.int(86401) : g.int(4)];
  });
  return { format: 1, rules: hex12(), mode: ['open', 'daily', 'fkt'][g.int(3)], rule: ['oldschool', 'gentle'][g.int(2)], seed: b32(8 + g.int(19)), plan: ['sample', 'fx_plan', 'high_divide'][g.int(3)], profile: hex12(), base: g.int(2) ? '' : hex12(), actions };
}

test('round trips on 1,000 seeded random logs: unpack(pack(j)) is j, pack(unpack(b)) is b, base64url both ways', () => {
  for (let i = 0; i < 1000; i++) {
    const j = randomLog(i);
    const b = pack(j);
    assert.deepEqual(unpack(b), j);
    assert.deepEqual(pack(unpack(b)), b);
    const s = toBase64url(b);
    assert.match(s, /^[A-Za-z0-9_-]*$/);
    assert.deepEqual(fromBase64url(s), b);
  }
});

test('replay folds a log to its final hash and its screens; the same log twice gives the same hash', () => {
  const content = fxContent();
  const { session, screens } = play(started(content, '00000000'), [{ t: 'next' }, { t: 'choose', c: 'rest' }, { t: 'choose', c: 'go' }, { t: 'next' }], content);
  const input = { log: session.log, profile: session.state.trip.profile, base: null };
  const a = replay(input, content);
  const b = replay({ ...input, log: toBase64url(pack(session.log)) }, content);
  assert.equal(a.hash, b.hash, 'the JSON form and the packed form replay alike');
  assert.equal(canon(a.state.trip), canon(session.state.trip));
  assert.equal(a.error, null);
  assert.equal(a.screens.length, 5, 'the first screen and one per action');
  assert.equal(canon(a.screens.slice(1)), canon(screens));
  assert.equal(replay(input, content).hash, a.hash);
  assert.deepEqual(a.noops, [false, false, false, false]);
});

test('replay refuses other rules and a wrong profile, and stops at a refused action with {at, code}', () => {
  const content = fxContent();
  const s = play(started(content), [{ t: 'next' }], content).session;
  const profile = s.state.trip.profile;
  assert.throws(() => replay({ log: { ...s.log, rules: '000000000002' }, profile }, content), { name: 'EngineError', code: 'rules' });
  assert.throws(() => replay({ log: s.log, profile: { ...profile, body_lb: 200 } }, content), { name: 'EngineError', code: 'format' });
  assert.throws(() => replay({ log: s.log, profile, base: s.state.trip }, content), { code: 'format' }, 'a base the log does not name');
  const r = replay({ log: { ...s.log, actions: [['next'], ['next'], ['choose', 'go']] }, profile }, content);
  assert.deepEqual(r.error, { at: 1, code: 'refused' }, 'stop b takes no Walk on');
  assert.equal(r.screens.length, 2);
});

test('identity strips no-ops: wait 0 anywhere leaves it alone; a real wait moves it (E.12)', () => {
  const content = fxContent();
  const run = (actions) => {
    const s = play(started(content, '00000000'), actions, content).session;
    return { s, id: identity({ log: s.log, profile: s.state.trip.profile }, content), hash: replay({ log: s.log, profile: s.state.trip.profile }, content).hash };
  };
  const plainRun = run([{ t: 'next' }, { t: 'choose', c: 'go' }, { t: 'next' }]);
  const noops = run([{ t: 'wait', s: 0 }, { t: 'next' }, { t: 'wait', s: 0 }, { t: 'choose', c: 'go' }, { t: 'wait', s: 0 }, { t: 'next' }]);
  const waited = run([{ t: 'next' }, { t: 'wait', s: 600 }, { t: 'choose', c: 'go' }, { t: 'next' }]);
  assert.equal(noops.id, plainRun.id);
  assert.equal(noops.hash, plainRun.hash);
  assert.notDeepEqual(pack(noops.s.log), pack(plainRun.s.log), 'the complete log keeps its no-ops');
  assert.notEqual(waited.id, plainRun.id);
  assert.notEqual(waited.hash, plainRun.hash);
  assert.match(plainRun.id, /^[0-9a-f]{64}$/);
});

test('a log from a base snapshot replays from it: the base must be the one the log names', () => {
  const content = fxContent();
  const s = play(started(content, '00000000'), [{ t: 'next' }, { t: 'choose', c: 'go' }], content).session;
  const full = play(s, [{ t: 'next' }], content).session;
  const base = s.state.trip;
  const log = { ...s.log, base: hash12(base), actions: [['next']] };
  const r = replay({ log, profile: base.profile, base }, content);
  assert.equal(canon(r.state.trip), canon(full.state.trip));
  assert.throws(() => replay({ log, profile: base.profile, base: { ...base, n: 9 } }, content), { code: 'format' });
  assert.throws(() => replay({ log, profile: base.profile }, content), { code: 'format' }, 'the base is missing');
  const { session } = startOf({ log, profile: base.profile, base }, content);
  assert.equal(session.base, base);
});
