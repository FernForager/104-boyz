// Saves: snapshot plus the complete log plus the profile snapshot (BUILD_PLAN
// 6.6 save; GAME_DESIGN E.1, E.6, E.11, 8.14): round trips, replay matching
// the snapshot, repair and refusal, the rebase, migrations, the reconcile,
// the report's state with no name in it, and the channel's own keys.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toSaves, fromSaves, reportState, tripHash, misfit, REPORT_LAST, HIKER_TOKEN } from '../../web/js/engine/save.js';
import { migrate, VERSIONS } from '../../web/js/engine/migrate.js';
import { replay } from '../../web/js/engine/replay.js';
import { dispatch, newSession, hash12 } from '../../web/js/engine/step.js';
import { unpack, fromBase64url, toBase64url, pack } from '../../web/js/engine/log.js';
import { loadContent } from '../../web/js/engine/content.js';
import { canon } from '../../web/js/engine/canon.js';
import { setChannel, keyName } from '../../web/js/platform/storage.js';
import { compileFx, fxContent, play, started, FX_SET, FX_PLAN } from './enginefix.mjs';

const json = (v) => JSON.parse(JSON.stringify(v));
const walk = (content, seed = '00000000') => play(started(content, seed), [{ t: 'next' }, { t: 'wait', s: 30 }, { t: 'choose', c: 'rest' }], content).session;

test('the three records, plain JSON: device, hiker, and the trip as snapshot, packed log, profile, base and hash', () => {
  const content = fxContent();
  const s = walk(content);
  const saves = toSaves(s);
  assert.deepEqual(Object.keys(saves), ['device', 'hiker', 'trip']);
  assert.deepEqual(saves.device, { v: 1 });
  assert.deepEqual(saves.hiker, { v: 1, id: 'h00000001', name: 'Robin', profile: s.state.hiker.profile, trips: 0, latest: { seed: '00000000', stop: 3 } });
  assert.deepEqual(Object.keys(saves.trip), ['v', 'rules', 'log', 'profile', 'base', 'snapshot', 'hash']);
  assert.equal(saves.trip.rules, '000000000001');
  assert.deepEqual(unpack(fromBase64url(saves.trip.log)), s.log);
  assert.equal(saves.trip.hash, tripHash(s.state.trip));
  assert.equal(saves.trip.base, null);
  assert.ok(!JSON.stringify(saves.trip).includes('Robin'), 'the name is in the hiker record only');
  assert.deepEqual(toSaves(newSession(content)), { device: { v: 1 }, hiker: null, trip: null });
});

test('a save round-trips through JSON.stringify and parse, and play goes on from it to the same end', () => {
  const content = fxContent();
  const s = walk(content);
  const back = fromSaves(json(toSaves(s)), content);
  assert.equal(canon(back.state.trip), canon(s.state.trip));
  assert.deepEqual(back.log, s.log);
  assert.deepEqual(back.state.hiker, s.state.hiker);
  assert.equal(back.base, null);
  const a = play(s, [{ t: 'choose', c: 'go' }, { t: 'next' }], content).session;
  const b = play(back, [{ t: 'choose', c: 'go' }, { t: 'next' }], content).session;
  assert.equal(tripHash(b.state.trip), tripHash(a.state.trip));
  assert.deepEqual(b.log, a.log);
  assert.deepEqual(fromSaves({}, content), { state: { v: 1, device: { v: 1 }, hiker: null, trip: null }, log: null, base: null }, 'nothing stored: a fresh device');
});

test("replay of a save's log matches its snapshot", () => {
  const content = fxContent();
  const saves = json(toSaves(walk(content)));
  const r = replay({ log: saves.trip.log, profile: saves.trip.profile, base: saves.trip.base }, content);
  assert.equal(r.hash, saves.trip.hash);
  assert.equal(canon(r.state.trip), canon(saves.trip.snapshot));
});

test('a tampered snapshot is rebuilt from the log; a tampered snapshot and log are refused (EngineError "format")', () => {
  const content = fxContent();
  const s = walk(content);
  const saves = json(toSaves(s));
  const tampered = json(saves);
  tampered.trip.snapshot.flags = { rested: false };
  tampered.trip.snapshot.n = 99;
  const repaired = fromSaves(tampered, content);
  assert.equal(canon(repaired.state.trip), canon(s.state.trip), 'repaired from the log');
  const both = json(tampered);
  both.trip.log = toBase64url(pack({ ...s.log, actions: s.log.actions.slice(0, 1) }));
  assert.throws(() => fromSaves(both, content), { name: 'EngineError', code: 'format' });
  const garbled = json(saves);
  garbled.trip.log = 'not-a-log';
  assert.throws(() => fromSaves(garbled, content), { code: 'format' });
  const other = json(saves);
  other.trip.snapshot = { ...other.trip.snapshot, seed: '11111111' };
  other.trip.hash = tripHash(other.trip.snapshot);
  assert.throws(() => fromSaves(other, content), { code: 'format' }, 'a snapshot of another trip than its log');
  const weird = json(saves);
  weird.trip.snapshot = { odd: 'é' };
  assert.equal(canon(fromSaves(weird, content).state.trip), canon(s.state.trip), 'even a snapshot canon refuses is rebuilt');
});

test('a rules change rebases the log on the snapshot, and the rebased log replays to the same hash (call 4)', () => {
  const content = fxContent();
  const s = walk(content);
  const saves = json(toSaves(s));
  const { rules, voice } = compileFx();
  const next = loadContent({ rules, voice, rulesHash: '0000000000aa' });
  const rebased = fromSaves(saves, next);
  assert.equal(canon(rebased.state.trip), canon(s.state.trip), 'loads use the snapshot (E.6)');
  assert.equal(rebased.log.rules, '0000000000aa');
  assert.equal(rebased.log.base, hash12(s.state.trip));
  assert.deepEqual(rebased.log.actions, []);
  assert.equal(canon(rebased.base), canon(s.state.trip));
  const on = play(rebased, [{ t: 'choose', c: 'go' }, { t: 'next' }], next).session;
  const saved = json(toSaves(on));
  assert.equal(saved.trip.base.n, s.state.trip.n, 'the base rides in the save');
  const r = replay({ log: saved.trip.log, profile: saved.trip.profile, base: saved.trip.base }, next);
  assert.equal(r.hash, saved.trip.hash, 'the rebased log replays on the rules it names');
  assert.equal(r.hash, tripHash(play(s, [{ t: 'choose', c: 'go' }, { t: 'next' }], content).session.state.trip), 'to the same end as before the change');
  const again = fromSaves(saved, next);
  assert.deepEqual(again.log, on.log, 'same rules: the log continues');
  const damaged = json(saves);
  damaged.trip.snapshot.n = 7;
  assert.throws(() => fromSaves(damaged, next), { code: 'format' }, 'a damaged snapshot under other rules has no log to rebuild it');
});

test('migrations: v1 loads as is, a missing record is null, a newer one is refused, a step table moves an old one on', () => {
  assert.deepEqual(VERSIONS, { device: 1, hiker: 1, trip: 1 });
  assert.deepEqual(migrate('device', { v: 1, x: 2 }), { v: 1, x: 2 });
  assert.equal(migrate('hiker', null), null);
  assert.equal(migrate('trip', undefined), null);
  assert.throws(() => migrate('trip', { v: 2 }), { name: 'EngineError', code: 'format' });
  assert.throws(() => migrate('trip', { x: 1 }), { code: 'format' });
  assert.throws(() => migrate('trip', [1]), { code: 'format' });
  const steps = { hiker: { 1: (r) => ({ ...r, v: 2, wallet: 0 }), 2: (r) => ({ ...r, v: 3 }) } };
  assert.deepEqual(migrate('hiker', { v: 1, id: 'h1' }, steps, { hiker: 3 }), { v: 3, id: 'h1', wallet: 0 });
  assert.throws(() => migrate('hiker', { v: 1 }, { hiker: {} }, { hiker: 2 }), { code: 'format' }, 'no step from v1');
  const content = fxContent();
  const saves = json(toSaves(walk(content)));
  assert.throws(() => fromSaves({ ...saves, trip: { ...saves.trip, v: 2 } }, content), { code: 'format' });
});

test("the reconcile: a write cut off between the trip and the hiker brings the hiker's latest stop up to the trip's", () => {
  const content = fxContent();
  const s = walk(content);
  const saves = json(toSaves(s));
  const behind = fromSaves({ ...saves, hiker: { ...saves.hiker, latest: { seed: '00000000', stop: 1 } } }, content);
  assert.deepEqual(behind.state.hiker.latest, { seed: '00000000', stop: 3 });
  const none = fromSaves({ ...saves, hiker: { ...saves.hiker, latest: null } }, content);
  assert.deepEqual(none.state.hiker.latest, { seed: '00000000', stop: 3 }, 'cut off right after start');
  const old = fromSaves({ ...saves, hiker: { ...saves.hiker, latest: { seed: 'ZZZZZZZZ', stop: 9 } } }, content);
  assert.deepEqual(old.state.hiker.latest, { seed: '00000000', stop: 3 }, "the last trip's mark gives way to this one's");
  assert.deepEqual(fromSaves(saves, content).state.hiker.latest, saves.hiker.latest, 'in step: unchanged');
});

test("a trip older than the hiker's mark is refused (E.6), and so is an open trip whose plan, set or stop a later build lacks; each says why in detail.trip", () => {
  const content = fxContent();
  const saves = json(toSaves(walk(content)));
  const isFormat = (why) => (e) => e.code === 'format' && e.detail && e.detail.trip === why;
  assert.throws(() => fromSaves({ ...saves, hiker: { ...saves.hiker, latest: { seed: '00000000', stop: 4 } } }, content), isFormat('stale'), 'a mark ahead of the trip: never resumed at an earlier stop');
  assert.throws(() => fromSaves({ ...saves, hiker: { ...saves.hiker, latest: { seed: '00000000', stop: 4 } }, trip: { ...saves.trip, snapshot: { ...saves.trip.snapshot, n: 1 } } }, content), isFormat('stale'), 'a snapshot rebuilt from its log is checked too');
  assert.equal(fromSaves({ ...saves, hiker: { ...saves.hiker, latest: { seed: 'ZZZZZZZZ', stop: 9 } } }, content).state.trip.n, 3, "another trip's mark is no bar");
  // A later build renames the stop the trip stands on (b), or its plan.
  const later = (o) => {
    const { rules, voice, problems } = compileFx(o);
    assert.deepEqual(problems, []);
    return loadContent({ rules, voice, rulesHash: '0000000000ab' });
  };
  const renamed = JSON.parse(JSON.stringify(FX_SET).replaceAll('"b"', '"b2"'));
  assert.throws(() => fromSaves(saves, later({ sets: [renamed] })), (e) => isFormat('missing')(e) && e.detail.lacks === 'stop');
  assert.throws(() => fromSaves(saves, later({ plans: [{ ...FX_PLAN, id: 'fx_plan2' }] })), (e) => isFormat('missing')(e) && e.detail.lacks === 'plan');
  assert.equal(misfit(saves.trip.snapshot, content), null);
  assert.equal(misfit(null, content), null);
  // An ended trip needs no place: it opens home.
  const ended = json(toSaves(play(walk(content), [{ t: 'choose', c: 'go' }, { t: 'next' }], content).session));
  assert.ok(ended.trip.snapshot.end);
  const gone = JSON.parse(JSON.stringify(FX_SET).replaceAll('"c"', '"c2"').replaceAll('"d"', '"d2"'));
  assert.equal(fromSaves(ended, later({ sets: [gone] })).state.trip.end, 'fx_plan');
});

test("reportState: the phase, a hiker with no name ({HIKER} and its length), the trip's log, profile, hash, last 20 actions and snapshot", () => {
  const content = fxContent();
  let s = dispatch(newSession(content), { t: 'sign', name: 'Robin 🥾', id: 'hK7QM2Q9F' }, content).session;
  s = dispatch(s, { t: 'start', plan: 'fx_plan', seed: 'K7QM2Q9F' }, content).session;
  const acts = [{ t: 'next' }, ...Array.from({ length: 25 }, (_, i) => ({ t: 'wait', s: i })), { t: 'choose', c: 'rest' }];
  s = play(s, acts, content).session;
  const st = reportState(s, content);
  assert.deepEqual(Object.keys(st), ['phase', 'hiker', 'trip']);
  assert.equal(st.phase, 'trailhead');
  assert.deepEqual(st.hiker, { id: 'hK7QM2Q9F', name: HIKER_TOKEN, chars: 7, trips: 0 });
  assert.deepEqual(Object.keys(st.trip), ['seed', 'plan', 'stop', 'log', 'profile', 'base', 'hash', 'last', 'snapshot']);
  assert.equal(st.trip.stop, s.state.trip.n);
  assert.deepEqual(unpack(fromBase64url(st.trip.log)), s.log);
  assert.equal(st.trip.hash, tripHash(s.state.trip));
  assert.equal(st.trip.last.length, REPORT_LAST);
  assert.deepEqual(st.trip.last.slice(-3), ['wait 23', 'wait 24', 'choose rest']);
  assert.ok(!JSON.stringify(st).includes('Robin'), 'the typed name is never in the report');
  assert.ok(JSON.stringify(st).includes('{HIKER}'));
  const r = replay({ log: st.trip.log, profile: st.trip.profile, base: st.trip.base }, content);
  assert.equal(r.hash, st.trip.hash, "the report's state replays to its hash");
  assert.deepEqual(reportState(newSession(content), content), { phase: 'guestbook', hiker: null, trip: null });
  const broken = reportState({ state: { v: 1, device: { v: 1 }, hiker: null, trip: { seed: 'X', n: 1, profile: { x: 'é' } } }, log: null, base: null }, content);
  assert.deepEqual([broken.trip.log, broken.trip.profile, broken.trip.hash], [null, null, null], 'a part that cannot be made is null; the report never throws');
});

test("the saves' keys carry the channel: oph.main.* and oph.preview.* never share a save (E.9; lint S01)", () => {
  const names = Object.keys(toSaves(newSession(fxContent())));
  try {
    setChannel('preview');
    assert.deepEqual(names.map(keyName), ['oph.preview.device', 'oph.preview.hiker', 'oph.preview.trip']);
    setChannel('main');
    assert.deepEqual(names.map(keyName), ['oph.main.device', 'oph.main.hiker', 'oph.main.trip']);
  } finally {
    setChannel(null);
  }
});
