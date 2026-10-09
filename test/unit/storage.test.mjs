// Channel-prefixed storage (GAME_DESIGN E.6, E.9): every key, database and
// cache name carries its channel, storage that throws never breaks the
// game, and the lint (S01) fails any storage name made anywhere else.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setChannel, channel, keyName, dbName, cacheName, pinName, load, save, remove, ownKeys, persist, storageFacts, lastFacts } from '../../web/js/platform/storage.js';
import { lintStorage } from '../../tools/lint.mjs';

/** A Map-backed localStorage. */
function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return {
    get length() {
      return m.size;
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    map: m,
  };
}

/** Put a store on globalThis for one test. */
function withStore(t, name, value) {
  const had = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, ...(typeof value === 'function' ? { get: value } : { value }) });
  t.after(() => {
    if (had) Object.defineProperty(globalThis, name, had);
    else delete globalThis[name];
  });
}

test('every name carries the channel', (t) => {
  t.after(() => setChannel(null));
  setChannel('main');
  assert.equal(channel(), 'main');
  assert.equal(keyName('device'), 'oph.main.device');
  assert.equal(dbName('reports'), 'oph-main-reports');
  assert.equal(cacheName('74b10ee5c288'), 'oph-main-74b10ee5c288');
  assert.equal(pinName('74b10ee5c288'), 'oph-main-pin-74b10ee5c288');
  setChannel('preview');
  assert.equal(keyName('device'), 'oph.preview.device');
  assert.equal(dbName('reports'), 'oph-preview-reports');
  assert.equal(cacheName('abc'), 'oph-preview-abc');
  assert.equal(pinName('abc'), 'oph-preview-pin-abc');
});

test('bad names and bad channels throw', (t) => {
  t.after(() => setChannel(null));
  setChannel('main');
  for (const bad of ['', 'Device', 'a.b', 'a-b', '1x', 'oph.main.x', '../x']) assert.throws(() => keyName(bad), /not a key name/, bad);
  assert.throws(() => dbName('A'), /not a database name/);
  assert.throws(() => cacheName('a-b'), /not a cache hash/);
  assert.throws(() => pinName(''), /not a cache hash/);
  for (const ch of ['dev', 'beta', '', null]) {
    setChannel(ch === null ? 'nope' : ch);
    assert.throws(() => keyName('device'), /no channel/, String(ch));
  }
  setChannel(null);
  assert.throws(() => channel(), /no channel/, 'no document and nothing set: no channel');
});

test('load and save round-trip under the channel key, and never throw', (t) => {
  t.after(() => setChannel(null));
  const ls = fakeStorage();
  withStore(t, 'localStorage', ls);
  setChannel('preview');
  assert.equal(load('marks'), null);
  assert.equal(save('marks', 'drafts'), true);
  assert.equal(ls.map.get('oph.preview.marks'), '"drafts"');
  assert.equal(load('marks'), 'drafts');
  setChannel('main');
  assert.equal(load('marks'), null, "main never reads preview's");
  setChannel('preview');
  assert.equal(remove('marks'), true);
  assert.equal(load('marks'), null);
  ls.map.set('oph.preview.broken', '{not json');
  assert.equal(load('broken'), null, 'bad JSON reads as nothing');
  assert.equal(save('Bad Name', 1), false, 'a bad name is refused, not thrown');
});

test('storage that throws on access, or is full, is survived', (t) => {
  t.after(() => setChannel(null));
  setChannel('main');
  withStore(t, 'localStorage', () => {
    throw new Error('SecurityError');
  });
  withStore(t, 'sessionStorage', {
    getItem() {
      throw new Error('denied');
    },
    setItem() {
      throw new Error('QuotaExceededError');
    },
    removeItem() {
      throw new Error('denied');
    },
  });
  assert.equal(load('device'), null);
  assert.equal(save('device', { a: 1 }), false);
  assert.equal(remove('device'), false);
  assert.deepEqual(ownKeys(), []);
  assert.equal(load('device', { session: true }), null);
  assert.equal(save('device', 1, { session: true }), false);
  assert.equal(remove('device', { session: true }), false);
});

test("ownKeys lists this channel's key names, never their values or another channel's", (t) => {
  t.after(() => setChannel(null));
  withStore(t, 'localStorage', fakeStorage({ 'oph.main.device': '{"name":"Someone"}', 'oph.main.marks': '"on"', 'oph.preview.trip': '{}', 'other.key': 'x', 'oph.mainly': 'y' }));
  setChannel('main');
  assert.deepEqual(ownKeys(), ['device', 'marks']);
  assert.ok(!JSON.stringify(ownKeys()).includes('Someone'));
  setChannel('preview');
  assert.deepEqual(ownKeys(), ['trip']);
});

test('persist() asks persisted() first, then persist(), and never throws', async () => {
  const calls = [];
  const nav = (persisted, granted) => ({
    storage: {
      persisted: async () => (calls.push('persisted'), persisted),
      persist: async () => (calls.push('persist'), granted),
      estimate: async () => ({ usage: 1234, quota: 98765 }),
    },
  });
  assert.equal(await persist(nav(false, true)), true);
  assert.deepEqual(calls, ['persisted', 'persist']);
  calls.length = 0;
  assert.equal(await persist(nav(true, false)), true);
  assert.deepEqual(calls, ['persisted'], 'already persisted: no second ask');
  assert.equal(await persist(nav(false, false)), false);
  assert.equal(await persist({}), null, 'no storage manager');
  assert.equal(await persist(undefined), null);
  assert.equal(await persist({ storage: { persisted: () => Promise.reject(new Error('no')) } }), null, 'a refusal is not a throw');
  assert.equal(await persist({ storage: { persisted: async () => false } }), false, 'no persist() to ask');
});

test('storageFacts keeps persisted, usage and quota for the synchronous report', async () => {
  const facts = await storageFacts({ storage: { persisted: async () => true, estimate: async () => ({ usage: 1234, quota: 98765 }) } });
  assert.deepEqual(facts, { persisted: true, usage: 1234, quota: 98765 });
  assert.deepEqual(lastFacts(), facts);
  assert.deepEqual(await storageFacts({ storage: { estimate: () => Promise.reject(new Error('no')) } }), { persisted: false, usage: null, quota: null }, "keeps persist()'s last answer");
  assert.deepEqual((await storageFacts(undefined)).usage, null);
});

test('S01: storage only through platform/storage.js, and oph names only there and in the worker', () => {
  const codes = (issues) => issues.map((i) => i.code);
  assert.deepEqual(codes(lintStorage('web/js/ui/x.js', "localStorage.setItem('k', '1');")), ['S01']);
  assert.deepEqual(codes(lintStorage('web/js/ui/x.js', 'const s = window.sessionStorage;')), ['S01']);
  assert.deepEqual(codes(lintStorage('web/js/ui/x.js', "indexedDB.open('x');")), ['S01']);
  assert.deepEqual(codes(lintStorage('web/js/ui/x.js', 'await caches.keys();')), ['S01']);
  assert.deepEqual(codes(lintStorage('web/js/ui/x.js', "const k = 'oph.main.x';")), ['S01']);
  assert.deepEqual(codes(lintStorage('web/js/ui/x.js', 'const k = `oph-${ch}-reports`;')), ['S01']);
  assert.deepEqual(codes(lintStorage('web/index.js', "const k = 'oph.preview.marks';")), ['S01'], 'anywhere in web/');
  assert.deepEqual(codes(lintStorage('web/js/ui/x.js', "// localStorage, in a comment\nconst e = 'oph:layout'; const s = 'localStorage';")), [], 'comments, events and the word in a string pass');
  assert.deepEqual(codes(lintStorage('web/js/ui/x.js', "import { load } from '../platform/storage.js'; load('marks');")), []);
  assert.deepEqual(lintStorage('web/js/platform/storage.js', "localStorage.getItem(`oph.${c}.x`); caches.keys();"), [], 'storage.js may');
  assert.deepEqual(codes(lintStorage('web/sw.js', 'const PREFIX = `oph-${CHANNEL}-`; caches.keys();')), [], 'the worker names its caches');
});
