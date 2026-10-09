// The preview screens (BUILD_PLAN S3; GAME_DESIGN 12.1, 12.4, E.6, E.11,
// 8.14): the plain guest book, the Sol Duc trailhead's two stops through
// step(), the saves written at every tap, resume on the same stop, and the
// gate that keeps all of it off main. Run on the tiny DOM in textfix.mjs,
// against a real preview build's data and words.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { build } from '../../tools/build.mjs';
import { ROOT } from '../../tools/pics.mjs';
import { fakeDocument } from './textfix.mjs';
import { setBundle } from '../../web/js/text.js';
import { setChannel } from '../../web/js/platform/storage.js';
import { base32, newSeed, newHikerId, CROCKFORD } from '../../web/js/platform/rand.js';
import { signName, canSign, codePoints, renderGuestbook, dropLone, KEYBOARD_VAR } from '../../web/js/ui/guestbook.js';
import { renderStop, choiceLine } from '../../web/js/ui/stop.js';
import { startGame, loadGameData, openSession, writeSaves, screenName, takePage, TAP_GUARD_MS, SAVE_ORDER, CLOSED_KEY, pendingOf } from '../../web/js/ui/app.js';
import { opensGame, GAME_SCREENS } from '../../web/js/ui/home.js';
import { buildReport, collectFacts, provideState } from '../../web/js/ui/debug.js';
import { recentErrors, clearErrors } from '../../web/js/ui/errors.js';
import { newSession, dispatch, screenOf, replay, unpack, fromBase64url, isEngineError, loadContent } from '../../web/js/engine/api.js';
import { HIKER_ID_RE, nameLength } from '../../web/js/engine/phases/guestbook.js';
import { SEED8_RE } from '../../web/js/engine/trip.js';

// ---- A preview build and main's page -------------------------------------

const tmp = mkdtempSync(join(tmpdir(), 'oph-game-'));
const out = {};
for (const channel of ['preview', 'main']) {
  out[channel] = join(tmp, channel);
  build({ out: out[channel], channel, quiet: true });
}
test.after(() => rmSync(tmp, { recursive: true, force: true }));
const readOut = (channel, f) => readFileSync(join(out[channel], f), 'utf8');
const RULES = JSON.parse(readOut('preview', 'version.json')).rules;
const WORDS = JSON.parse(readOut('preview', 'text/en.json'));
/** The preview content, loaded from the build's data. */
const loadNow = () => loadContent({ rules: JSON.parse(readOut('preview', 'data/rules.json')), voice: JSON.parse(readOut('preview', 'data/voice.json')), rulesHash: RULES });
const MARKS = JSON.parse(readOut('preview', 'text/marks.json'));

/** fetch() for the preview build's data/ folder. */
async function fetchFn(url) {
  const name = basename(url.pathname);
  try {
    const body = readOut('preview', join('data', name));
    return { ok: true, status: 200, json: async () => JSON.parse(body) };
  } catch {
    return { ok: false, status: 404, json: async () => null };
  }
}

/** A Map-backed localStorage. */
function fakeStorage() {
  const m = new Map();
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

/** The device for one test: preview's channel, a fresh localStorage, preview's words. */
function device(t, ls = fakeStorage()) {
  const had = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: ls });
  setChannel('preview');
  setBundle(WORDS, MARKS, 'preview');
  clearErrors();
  t.after(() => {
    if (had) Object.defineProperty(globalThis, 'localStorage', had);
    else delete globalThis.localStorage;
    setChannel(null);
    setBundle({}, {}, null);
    provideState(null);
    clearErrors();
  });
  return ls;
}

/** The shell's title page, as web/index.html has it (the parts the game moves). */
function shell({ screens = 'app debug guestbook title trail', rules = RULES } = {}) {
  const doc = fakeDocument();
  const html = doc.documentElement;
  html.setAttribute('data-channel', 'preview');
  html.setAttribute('data-build', '20261012-abc1234');
  html.setAttribute('data-commit', 'dev');
  html.setAttribute('data-rules', rules);
  html.setAttribute('data-screens', screens);
  const el = (tag, attrs = {}, ...kids) => {
    const e = doc.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    for (const k of kids) e.appendChild(k);
    return e;
  };
  const restart = el('button', { id: 'update-restart', type: 'button' });
  const update = el('div', { class: 'update-note box', id: 'update', hidden: '' }, restart);
  const install = el('p', { class: 'install', id: 'install' });
  const stamps = el('p', { class: 'stamps' }, el('span', { class: 'offline-stamp', id: 'offline', hidden: '' }), el('span', { class: 'build-stamp', id: 'build-stamp' }));
  const shelf = el('section', { class: 'shelf', id: 'shelf' }, el('button', { class: 'box choice', type: 'button' }), update, install, stamps);
  const plate = el('figure', { class: 'plate', id: 'plate' }, el('canvas', { id: 'cover' }));
  doc.body.appendChild(el('main', { class: 'title-page', id: 'app', 'data-screen': 'title' }, plate, shelf));
  return { doc, update, install, stamps, restart };
}

/** A clock the tests move by hand (the double-tap guard reads it). */
function clock() {
  let ms = 1000;
  const now = () => ms;
  now.pass = (d = TAP_GUARD_MS + 1) => {
    ms += d;
  };
  return now;
}

const ids = (root) => root.querySelectorAll('[data-t]').map((e) => e.getAttribute('data-t'));
const boxIds = (doc) => doc.querySelectorAll('.game-box p').map((p) => p.getAttribute('data-t'));
const tap = (doc, sel, now) => {
  now.pass();
  doc.querySelector(sel).click();
};

/** Start the game on a shell with the device's storage; deterministic seeds and ids. */
async function start(o = {}) {
  const page = shell(o);
  const now = o.now || clock();
  let n = 0;
  const game = await startGame(page.doc, { fetchFn, now, seed: o.seed || (() => ['K7QM2Q9F', '5S45JTGZ', '00000006'][n++ % 3]), hikerId: () => 'h00000001', title: o.title });
  return { ...page, game, now };
}

/** Sign a name in the guest book on screen. */
function sign(doc, now, name = 'Robin') {
  const field = doc.getElementById('gb-name');
  field.value = name;
  field.dispatchEvent({ type: 'input', isComposing: false });
  tap(doc, '#gb-sign', now);
}

// ---- platform/rand.js ------------------------------------------------------

test('rand: a seed is 40 bits as 8 Crockford base32 characters, and a hiker id is h and a seed (E.8; Lead call 8)', () => {
  assert.equal(base32([0, 0, 0, 0, 0]), '00000000');
  assert.equal(base32([0, 0, 0, 0, 1]), '00000001');
  assert.equal(base32([0, 0, 0, 0, 32]), '00000010');
  assert.equal(base32([255, 255, 255, 255, 255]), 'ZZZZZZZZ');
  assert.equal(base32([0x80, 0, 0, 0, 0]), 'G0000000', 'the top bit, with no 32-bit overflow');
  assert.throws(() => base32([1, 2, 3]), /5 bytes/);
  assert.equal(CROCKFORD.length, 32);
  assert.ok(!/[ILOU]/.test(CROCKFORD));
  let k = 0;
  const fake = { getRandomValues: (a) => a.map(() => (k += 37) & 255) };
  for (let i = 0; i < 50; i++) {
    assert.match(newSeed(fake), SEED8_RE, 'the engine takes every seed');
    assert.match(newHikerId(fake), HIKER_ID_RE, 'and every hiker id');
  }
  assert.match(newSeed(), SEED8_RE, "the platform's own generator");
});

// ---- The guest book ----------------------------------------------------------

test('the guest book signs the name normalized: NFC, spaces collapsed, no controls, trimmed, cut at 12 code points (GAME_DESIGN 12.4)', () => {
  assert.equal(signName('  Robin   the\tBold  ', 12), 'Robin the Bo');
  assert.equal(signName('  Robin   the  ', 12), 'Robin the');
  assert.equal(signName('émile', 12), 'émile', 'NFC');
  assert.equal(signName('Ro\u0007bin\u0085', 12), 'Robin', 'C0 and C1 controls go');
  assert.equal(signName('Ro\ud800bin\udc00', 12), 'Robin', 'lone surrogates go');
  assert.equal(signName('😀'.repeat(13), 12), '😀'.repeat(12), 'cut by code points, not UTF-16 units');
  assert.equal(signName('abcdefghijk l', 12), 'abcdefghijk', 'a cut never leaves a space at the end');
  assert.equal(signName('   ', 12), '');
  assert.equal(codePoints('😀😀'), 2);
  assert.equal(canSign('', 12), false);
  assert.equal(canSign('R', 12), true);
  assert.equal(canSign('😀'.repeat(12), 12), true, '12 emoji code points');
  assert.equal(canSign('abcdefghijklm', 12), false, '13 code points');
  // Whatever is typed, what is signed is a name the engine takes, or nothing.
  for (const raw of ['Robin', '  ', '\u0000\u0001', '😀'.repeat(20), 'à'.repeat(9), '\ud83d', 'x‍y', '{HIKER}', 'Ünïcødé  名前', 'a\nb\r\nc']) {
    const name = signName(raw, 12);
    if (canSign(name, 12)) {
      const n = nameLength(name);
      assert.ok(n >= 1 && n <= 12, `${JSON.stringify(raw)} signs as ${JSON.stringify(name)}, which the engine takes`);
    } else assert.equal(name, '');
  }
});

test('the guest book renders its three ids, and Sign is enabled only for 1 to 12 code points', () => {
  setBundle(WORDS, MARKS, 'preview');
  const doc = fakeDocument();
  const host = doc.createElement('div');
  const signed = [];
  const gb = renderGuestbook(host, { phase: 'guestbook', box: [], choices: [], input: { kind: 'name', max: 12 } }, (name) => signed.push(name));
  assert.deepEqual(ids(host), ['first.guestbook.prompt', 'first.guestbook.one_life', 'first.guestbook.sign']);
  assert.equal(host.querySelector('#gb-prompt').textContent, 'Sign the guest book.');
  for (const [k, v] of Object.entries({ type: 'text', 'aria-labelledby': 'gb-prompt', autocomplete: 'off', autocapitalize: 'words', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done' })) {
    assert.equal(gb.field.getAttribute(k), v, k);
  }
  assert.equal(gb.box.getAttribute('tabindex'), '-1');
  assert.equal(gb.sign.disabled, true, 'nothing typed yet');
  const type = (v) => {
    gb.field.value = v;
    gb.field.dispatchEvent({ type: 'input', isComposing: false });
  };
  type('   ');
  assert.equal(gb.sign.disabled, true, 'spaces are not a name');
  type('R');
  assert.equal(gb.sign.disabled, false);
  type('Robin ');
  assert.equal(gb.field.value, 'Robin ', 'a space before the next word is left alone while typing');
  type('abcdefghijklmnop');
  assert.equal(gb.field.value, 'abcdefghijkl', 'the field stops at 12');
  assert.equal(gb.sign.disabled, false);
  gb.field.value = 'abcdefghijklmnop';
  gb.field.dispatchEvent({ type: 'input', isComposing: true });
  assert.equal(gb.field.value, 'abcdefghijklmnop', 'never cut while a keyboard is composing');
  gb.field.dispatchEvent({ type: 'compositionend' });
  assert.equal(gb.field.value, 'abcdefghijkl');
  type(' Robin  Hood ');
  gb.field.dispatchEvent({ type: 'keydown', key: 'Enter', isComposing: false });
  gb.sign.click();
  assert.deepEqual(signed, ['Robin Hood', 'Robin Hood'], 'Enter signs, and so does Sign');
  type('');
  gb.sign.click();
  assert.equal(signed.length, 2, 'a disabled Sign does nothing');
  setBundle({}, {}, null);
});

test('while its field has focus, the guest book lifts the game view above the keyboard with visualViewport (BUILD_PLAN 2.8)', () => {
  setBundle(WORDS, MARKS, 'preview');
  const doc = fakeDocument();
  const host = doc.createElement('div');
  const vv = { height: 874, offsetTop: 0, listeners: new Map() };
  vv.addEventListener = (type, f) => vv.listeners.set(type, [...(vv.listeners.get(type) || []), f]);
  vv.removeEventListener = (type, f) => vv.listeners.set(type, (vv.listeners.get(type) || []).filter((g) => g !== f));
  const fire = (type) => (vv.listeners.get(type) || []).forEach((f) => f({ type }));
  const view = { innerHeight: 874, visualViewport: vv };
  const gb = renderGuestbook(host, { phase: 'guestbook', box: [], choices: [], input: { kind: 'name', max: 12 } }, () => {}, view);
  const lift = () => doc.documentElement.style.getPropertyValue(KEYBOARD_VAR);
  assert.equal(lift(), '', 'no lift before the field has focus');
  assert.equal((vv.listeners.get('resize') || []).length, 0, 'and no listener');
  gb.field.dispatchEvent({ type: 'focus' });
  assert.equal(lift(), '0px', 'the keyboard is not up yet');
  vv.height = 874 - 336.4;
  fire('resize');
  assert.equal(lift(), '336px', 'the keyboard slid up: the view sits above it');
  vv.offsetTop = 40;
  fire('scroll');
  assert.equal(lift(), '296px', 'iOS panned the page by 40: that much less');
  gb.field.dispatchEvent({ type: 'blur' });
  assert.equal(lift(), '', 'gone on blur');
  assert.deepEqual([(vv.listeners.get('resize') || []).length, (vv.listeners.get('scroll') || []).length], [0, 0], 'and so are the listeners');
  // No visualViewport (an old browser, a test): nothing breaks.
  renderGuestbook(doc.createElement('div'), { phase: 'guestbook', box: [], choices: [] }, () => {}, {}).field.dispatchEvent({ type: 'focus' });
  assert.equal(lift(), '');
  assert.match(readFileSync(join(ROOT, 'web', 'css', 'game.css'), 'utf8'), /\.game-page \{[^}]*padding:[^;]*max\(var\(--safe-bottom\), var\(--keyboard, 0px\)\)/, 'game.css lifts the page by it');
  setBundle({}, {}, null);
});

test('no module the page loads uses a RegExp lookbehind, which Safari reads only from 16.4 (the page runs from iOS 15.4)', () => {
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.js') ? [join(dir, e.name)] : []));
  const found = walk(join(ROOT, 'web')).filter((f) => /\(\?<[=!]/.test(readFileSync(f, 'utf8')));
  assert.deepEqual(found, []);
  assert.equal(dropLone('a\udc00\ud800b\ud83d\ude00\ud83d'), 'ab\ud83d\ude00', 'lone surrogates go, a pair stays');
});

// ---- A stop ------------------------------------------------------------------

test('a stop renders its box ids, line by line, and Walk on; a choice shows its own label', () => {
  setBundle(WORDS, MARKS, 'preview');
  const doc = fakeDocument();
  const host = doc.createElement('div');
  const acts = [];
  const screen = { phase: 'trailhead', stop: { set: 'sol_duc_trailhead', id: 'lot', n: 1 }, box: [{ id: 'trail.sol_duc_trailhead.lot' }], choices: [{ act: { t: 'next' }, label: null, enabled: true }] };
  const st = renderStop(host, screen, (a) => acts.push(a));
  assert.deepEqual(ids(host), ['trail.sol_duc_trailhead.lot', 'trail.walk_on']);
  assert.equal(st.box.textContent, 'The road ends in a ring of giant trees. You smell wet moss and the river.');
  assert.equal(st.buttons[0].textContent, 'Walk on');
  assert.equal(st.buttons[0].querySelector('.choice-label').getAttribute('data-t-state'), 'draft', 'preview marks a draft');
  st.buttons[0].click();
  assert.deepEqual(acts, [{ t: 'next' }]);
  // The fixture's shape: two lines in the box, and choices with labels.
  const host2 = doc.createElement('div');
  const two = renderStop(host2, { phase: 'trailhead', box: [{ id: 'fx.b1' }, { id: 'fx.b2' }], choices: [{ act: { t: 'choose', c: 'go' }, label: { id: 'fx.go' }, enabled: true }, { act: { t: 'odd' }, label: null, enabled: true }] }, (a) => acts.push(a));
  assert.deepEqual(ids(host2), ['fx.b1', 'fx.b2', 'fx.go'], 'a choice the UI has no word for is not drawn');
  assert.equal(two.box.textContent, '⟦fx.b1⟧⟦fx.b2⟧', 'an undefined line shows as missing on preview');
  two.buttons[0].click();
  assert.deepEqual(acts[1], { t: 'choose', c: 'go' });
  assert.deepEqual(choiceLine({ act: { t: 'next' }, label: null, enabled: true }), { id: 'trail.walk_on' });
  setBundle({}, {}, null);
});

// ---- The game, through app.js --------------------------------------------------

test('the game takes the page: #app becomes the game view, and the update note, install line and stamps move into its footer', (t) => {
  device(t);
  const { doc, update, install, stamps, restart } = shell();
  let restarted = 0;
  restart.addEventListener('click', () => restarted++);
  const { app, host } = takePage(doc);
  assert.equal(app.id, 'app');
  assert.equal(app.className, 'game-page');
  assert.equal(app.children.length, 1);
  const section = app.children[0];
  assert.equal(section.className, 'game');
  assert.deepEqual(section.children.map((c) => c.className), ['game-screen', 'game-foot']);
  assert.equal(host, section.children[0]);
  const foot = section.children[1];
  assert.deepEqual(foot.children, [update, install, stamps], 'the same nodes, moved');
  assert.ok(doc.getElementById('build-stamp') && doc.getElementById('offline'));
  assert.equal(doc.getElementById('plate'), null, 'the cover is gone');
  restart.click();
  assert.equal(restarted, 1, "Restart's listener traveled with it");
});

test('a full run writes oph.preview.device, .hiker and .trip, and nothing else (E.6: the trip, then the hiker)', async (t) => {
  const ls = device(t);
  const order = [];
  const setItem = ls.setItem;
  ls.setItem = (k, v) => {
    order.push(k);
    setItem(k, v);
  };
  const { doc, game, now } = await start();
  const app = doc.getElementById('app');
  assert.equal(app.getAttribute('data-screen'), 'guestbook');
  assert.deepEqual(order, ['oph.preview.device'], 'the device, once, at the first launch');
  assert.equal(doc.activeElement, doc.querySelector('.game-box'), 'the box takes focus');
  sign(doc, now);
  assert.equal(app.getAttribute('data-screen'), 'trail');
  assert.deepEqual(boxIds(doc), ['trail.deer_lake_rim.deer_lake']);
  assert.deepEqual(order, ['oph.preview.device', 'oph.preview.hiker', 'oph.preview.trip', 'oph.preview.hiker'], 'sign saves the hiker; the start saves the trip, then the hiker');
  tap(doc, '.game-choices .choice', now);
  assert.deepEqual(boxIds(doc), ['trail.deer_lake_rim.rim']);
  assert.deepEqual(order.slice(-2), ['oph.preview.trip', 'oph.preview.hiker']);
  assert.deepEqual([...ls.map.keys()].sort(), ['oph.preview.device', 'oph.preview.hiker', 'oph.preview.trip']);
  const hiker = JSON.parse(ls.getItem('oph.preview.hiker'));
  const trip = JSON.parse(ls.getItem('oph.preview.trip'));
  assert.deepEqual(JSON.parse(ls.getItem('oph.preview.device')), { v: 1 });
  assert.equal(hiker.name, 'Robin');
  assert.deepEqual(hiker.latest, { seed: 'K7QM2Q9F', stop: 2 }, "the hiker holds the trip's latest stop");
  assert.deepEqual(Object.keys(trip).sort(), ['base', 'hash', 'log', 'profile', 'rules', 'snapshot', 'v']);
  assert.equal(trip.rules, RULES);
  assert.equal(trip.snapshot.n, 2);
  assert.ok(!JSON.stringify(trip).includes('Robin'), 'the name is in the hiker record only');
  assert.deepEqual(unpack(fromBase64url(trip.log)).actions, [['next']], 'the complete log');
  assert.equal(game.session().state.trip.stop, 'rim');
  assert.deepEqual(SAVE_ORDER, ['trip', 'hiker']);
});

test('resume: closing the app on a stop and opening it again shows the same stop (the Done when)', async (t) => {
  device(t);
  const first = await start();
  sign(first.doc, first.now);
  tap(first.doc, '.game-choices .choice', first.now);
  const before = first.game.session();
  // The app is swiped closed; the saves stay. A new page opens on them.
  const again = await start();
  assert.equal(again.doc.getElementById('app').getAttribute('data-screen'), 'trail');
  assert.deepEqual(boxIds(again.doc), ['trail.deer_lake_rim.rim']);
  assert.deepEqual(again.game.session().state, before.state, 'the same state');
  assert.deepEqual(again.game.session().log, before.log, 'and the same log, which goes on');
  tap(again.doc, '.game-choices .choice', again.now);
  assert.deepEqual(again.game.session().state.hiker.trips, 1);
});

test('closing the guest book before Sign brings back an empty guest book; closing after Sign gives a fresh trip at the first stop', async (t) => {
  const ls = device(t);
  await start();
  const back = await start();
  assert.equal(back.doc.getElementById('app').getAttribute('data-screen'), 'guestbook');
  assert.equal(back.doc.getElementById('gb-name').value, '');
  // A hiker saved, and no trip (the start's save was cut off).
  sign(back.doc, back.now);
  ls.removeItem('oph.preview.trip');
  const fresh = await start({ seed: () => 'Q5Z2K8M1' });
  assert.deepEqual(boxIds(fresh.doc), ['trail.deer_lake_rim.deer_lake']);
  assert.equal(fresh.game.session().state.trip.seed, 'Q5Z2K8M1', 'home starts a new trip with a new seed');
});

test('after the second stop, Walk on ends the sample trip and a new one starts at the first stop, with a new seed and log', async (t) => {
  device(t);
  const { doc, game, now } = await start();
  sign(doc, now);
  const firstSeed = game.session().state.trip.seed;
  tap(doc, '.game-choices .choice', now);
  tap(doc, '.game-choices .choice', now);
  const s = game.session();
  assert.deepEqual(boxIds(doc), ['trail.deer_lake_rim.deer_lake']);
  assert.notEqual(s.state.trip.seed, firstSeed);
  assert.equal(s.state.trip.n, 1);
  assert.deepEqual(s.log.actions, [], 'a fresh log');
  assert.equal(s.state.hiker.trips, 1);
});

test('a double tap is dropped, and a stale tap the engine refuses is ignored', async (t) => {
  device(t);
  const { doc, game, now } = await start();
  sign(doc, now);
  const b = doc.querySelector('.game-choices .choice');
  now.pass();
  b.click();
  // The second tap of a double tap lands on the next stop's button at once.
  doc.querySelector('.game-choices .choice').click();
  assert.equal(game.session().state.trip.n, 2, 'one stop, not two');
  const warn = console.warn;
  const warned = [];
  console.warn = (...a) => warned.push(a);
  try {
    now.pass();
    assert.equal(game.act({ t: 'choose', c: 'go' }), false, 'refused');
  } finally {
    console.warn = warn;
  }
  assert.equal(warned.length, 1);
  assert.equal(game.session().state.trip.n, 2, 'nothing moved');
  assert.deepEqual(boxIds(doc), ['trail.deer_lake_rim.rim'], 'the same stop, drawn again');
  assert.equal(doc.querySelector('.game-choices .choice').disabled, false);
  now.pass();
  assert.throws(() => game.act({ t: 'wait', s: -1 }), (e) => isEngineError(e) && e.code === 'invalid', 'anything else reaches the error sheet');
});

test('a save the phone refuses is noted for the bug report, once, and play goes on', async (t) => {
  const ls = device(t);
  const { doc, game, now } = await start();
  ls.setItem = () => {
    throw new Error('QuotaExceededError');
  };
  sign(doc, now);
  tap(doc, '.game-choices .choice', now);
  assert.equal(game.session().state.trip.n, 2, 'play goes on');
  const notes = recentErrors().filter((e) => /storage: the phone refused/.test(e.message));
  assert.equal(notes.length, 1, 'noted once, not at every tap');
});

test('a damaged save stops with EngineError format, for the error sheet, and nothing is deleted', async (t) => {
  const ls = device(t);
  const { doc, now } = await start();
  sign(doc, now);
  const trip = JSON.parse(ls.getItem('oph.preview.trip'));
  const bad = JSON.stringify({ ...trip, hash: '0'.repeat(64), log: 'T1AB' });
  ls.setItem('oph.preview.trip', bad);
  await assert.rejects(start(), (e) => isEngineError(e) && e.code === 'format');
  assert.equal(ls.getItem('oph.preview.trip'), bad, 'the save is kept for the report');
});

test('openSession and writeSaves: a fresh device, then the records, the trip first', () => {
  const content = loadNow();
  const mem = new Map();
  const store = { load: (k) => (mem.has(k) ? JSON.parse(mem.get(k)) : null), save: (k, v) => (mem.set(k, JSON.stringify(v)), true) };
  const fresh = openSession(content, store);
  assert.equal(fresh.first, true);
  assert.deepEqual(fresh.session, newSession(content));
  let s = dispatch(fresh.session, { t: 'sign', name: 'Robin', id: 'h00000001' }, content).session;
  assert.deepEqual(writeSaves(s, store), []);
  assert.deepEqual([...mem.keys()], ['hiker'], 'no trip yet, so no trip record');
  s = dispatch(s, { t: 'start', plan: 'sample', seed: 'K7QM2Q9F' }, content).session;
  writeSaves(s, store);
  assert.deepEqual(writeSaves(s, { ...store, save: () => false }), ['trip', 'hiker'], 'what the phone refused');
  const back = openSession(content, store);
  assert.equal(back.first, true, 'no device record was written here');
  assert.deepEqual(back.session.state.trip, s.state.trip);
  assert.equal(screenName(screenOf(back.session.state, content)), 'trail');
  assert.equal(screenName({ phase: 'guestbook', box: [], choices: [] }), 'guestbook');
  assert.equal(screenName({ phase: 'home', box: [], choices: [] }), 'home');
});

test("writeSaves holds the hiker back when the phone refuses the trip; openSession closes a trip older than the hiker's mark, keeping it, never resuming it at an earlier stop (E.6)", (t) => {
  device(t);
  const content = loadNow();
  const mem = new Map();
  const store = { load: (k) => (mem.has(k) ? JSON.parse(mem.get(k)) : null), save: (k, v) => (mem.set(k, JSON.stringify(v)), true) };
  let s = dispatch(newSession(content), { t: 'sign', name: 'Robin', id: 'h00000001' }, content).session;
  s = dispatch(s, { t: 'start', plan: 'sample', seed: 'K7QM2Q9F' }, content).session;
  assert.deepEqual(writeSaves(s, store), []);
  s = dispatch(s, { t: 'next' }, content).session;
  const noTrip = { ...store, save: (k, v) => k !== 'trip' && store.save(k, v) };
  assert.deepEqual(writeSaves(s, noTrip), ['trip', 'hiker'], 'the hiker follows its trip');
  assert.deepEqual(JSON.parse(mem.get('hiker')).latest, { seed: 'K7QM2Q9F', stop: 1 }, "the mark stays with the trip the phone holds");
  assert.equal(openSession(content, store).session.state.trip.n, 1);
  // A mark ahead of its trip (as a build before this rule could leave one).
  mem.set('hiker', JSON.stringify({ ...JSON.parse(mem.get('hiker')), latest: { seed: 'K7QM2Q9F', stop: 2 } }));
  const rec = mem.get('trip');
  const kept = { ...store, save: (k, v) => k !== CLOSED_KEY && store.save(k, v) };
  assert.throws(() => openSession(content, kept), (e) => isEngineError(e) && e.code === 'format' && e.detail.trip === 'stale', "a phone that won't keep the record: the error stands");
  assert.equal(mem.get('trip'), rec, 'and nothing is deleted');
  clearErrors();
  const closed = openSession(content, store);
  assert.equal(closed.session.state.trip, null);
  assert.equal(screenOf(closed.session.state, content).auto.t, 'start', 'home starts a fresh trip');
  assert.deepEqual(JSON.parse(mem.get(CLOSED_KEY)), [JSON.parse(rec)], 'the closed trip is kept');
  assert.equal(mem.get('trip'), 'null');
  assert.equal(recentErrors().filter((e) => /\(stale\) was closed and kept in trip_closed/.test(e.message)).length, 1, 'the bug report notes it');
});

test("a trip a later build can't place (its stop renamed) is closed and kept, and the game opens on a fresh trip, not the error sheet at every launch", async (t) => {
  const ls = device(t);
  const { doc, now } = await start();
  sign(doc, now);
  tap(doc, '.game-choices .choice', now);
  const rec = JSON.parse(ls.getItem('oph.preview.trip'));
  assert.equal(rec.snapshot.stop, 'rim');
  // The next build renames the stop the trip stands on.
  const renamed = async (url) => {
    const body = readOut('preview', join('data', basename(url.pathname))).replaceAll('"rim"', '"rim_end"');
    return { ok: true, status: 200, json: async () => JSON.parse(body) };
  };
  const page = shell({ rules: '0000000000ab' });
  const game = await startGame(page.doc, { fetchFn: renamed, now: clock(), seed: () => '00000006', hikerId: () => 'h00000001' });
  assert.deepEqual([game.session().state.trip.seed, game.session().state.trip.n], ['00000006', 1], 'a fresh trip at the first stop');
  assert.deepEqual(boxIds(page.doc), ['trail.deer_lake_rim.deer_lake']);
  assert.deepEqual(JSON.parse(ls.getItem('oph.preview.trip_closed')), [rec], 'the old trip is kept');
  assert.ok(recentErrors().some((e) => /\(missing\) was closed/.test(e.message)));
});

test('loadGameData fetches data/rules.json and data/voice.json beside the page, with the rules hash from <html data-rules>', async () => {
  const content = await loadGameData({ rulesHash: RULES, fetchFn });
  assert.equal(content.rulesHash, RULES);
  assert.ok(content.plan('sample'));
  await assert.rejects(loadGameData({ rulesHash: RULES, fetchFn: async () => ({ ok: false, status: 404 }) }), /data\/rules\.json 404/);
  await assert.rejects(loadGameData({ rulesHash: 'dev', fetchFn }), (e) => isEngineError(e) && e.code === 'format', "an unbuilt shell's dev hash loads nothing");
});

test('the title hands over when its draw-in is done, and a failed title never blocks the game', async (t) => {
  device(t);
  let stopped = 0;
  let finish = () => {};
  const done = new Promise((r) => {
    finish = r;
  });
  const title = Promise.resolve({ stop: () => stopped++, done });
  const pending = start({ title });
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(stopped, 0, 'the cover is still drawing in');
  finish();
  const { doc } = await pending;
  assert.equal(stopped, 1, 'the stars and the resize handling stop');
  assert.equal(doc.getElementById('app').getAttribute('data-screen'), 'guestbook');
  const failed = await start({ title: Promise.reject(new Error('art: 404')) });
  assert.equal(failed.doc.getElementById('app').getAttribute('data-screen'), 'guestbook');
});

test('the report: its screen follows #app[data-screen], its state names nobody, and its log replays to its hash (the Done when)', async (t) => {
  device(t);
  const { doc, now } = await start();
  const r0 = buildReport(collectFacts(doc));
  assert.equal(r0.screen, 'guestbook');
  assert.equal(r0.state.phase, 'guestbook');
  assert.equal(r0.state.hiker, null);
  sign(doc, now, 'Robin Hood');
  tap(doc, '.game-choices .choice', now);
  const r = buildReport(collectFacts(doc));
  assert.equal(r.screen, 'trail');
  assert.equal(r.state.phase, 'trailhead');
  assert.deepEqual(r.state.hiker, { id: 'h00000001', name: '{HIKER}', chars: 10, trips: 0 });
  assert.equal(r.state.trip.stop, 2);
  assert.deepEqual(r.state.trip.last, ['next']);
  const text = JSON.stringify(r);
  assert.ok(!text.includes('Robin'), 'the typed name is nowhere in the report');
  const content = loadNow();
  const log = unpack(fromBase64url(r.state.trip.log));
  const again = replay({ log, profile: r.state.trip.profile, base: r.state.trip.base }, content);
  assert.equal(again.error, null);
  assert.equal(again.hash, r.state.trip.hash, 'the report replays to its own hash');
  assert.equal(r.state.pending, undefined, 'no action threw');
});

test("an action that throws (not a stale tap) is named in the report's state.pending, since it never reached the log; one that goes through clears it (E.11)", async (t) => {
  device(t);
  const { doc, game, now } = await start();
  sign(doc, now, 'Robin');
  now.pass();
  assert.throws(() => game.act({ t: 'wait', s: -1 }), (e) => isEngineError(e) && e.code === 'invalid');
  const r = buildReport(collectFacts(doc));
  assert.deepEqual(r.state.pending, ['wait', -1]);
  assert.deepEqual(r.state.trip.last, [], 'not in the log');
  now.pass();
  game.act({ t: 'next' });
  assert.equal(buildReport(collectFacts(doc)).state.pending, undefined);
  assert.deepEqual(pendingOf({ t: 'choose', c: 'go' }), ['choose', 'go']);
  assert.deepEqual(pendingOf({ t: 'start', plan: 'sample', seed: 'K7QM2Q9F' }), ['start', 'sample', 'K7QM2Q9F']);
  assert.deepEqual(pendingOf({ t: 'sign', name: 'Robin', id: 'h00000001' }), ['sign'], 'never the name');
});

// ---- The gate: main never loads the game --------------------------------------

test("main's built page has data-screens=\"app debug title\" and never loads ui/app.js; preview's lists the guest book and the trail", () => {
  const screensOf = (html) => /<html [^>]*data-screens="([^"]*)"/.exec(html)[1];
  const mainHtml = readOut('main', 'index.html');
  const previewHtml = readOut('preview', 'index.html');
  assert.equal(screensOf(mainHtml), 'app debug title');
  // S4: preview's screens gain the map (#map, ui/map.js; map.test.mjs checks its gate).
  assert.equal(screensOf(previewHtml), 'app debug guestbook map title trail');
  assert.deepEqual(GAME_SCREENS, ['guestbook', 'trail']);
  assert.equal(opensGame(shell({ screens: 'app debug title' }).doc), false);
  assert.equal(opensGame(shell({ screens: 'app debug guestbook title' }).doc), false, 'both screens, or no game');
  assert.equal(opensGame(shell({ screens: 'app debug guestbook title trail' }).doc), true);
  assert.equal(opensGame(shell({ screens: 'dev' }).doc), false, 'the unbuilt shell has no game');
  // main.js imports the game in one place, behind the gate, and nothing
  // imports it statically, so main's module graph never holds it.
  const mainJs = readFileSync(join(ROOT, 'web', 'js', 'main.js'), 'utf8');
  assert.equal(mainJs.match(/ui\/app\.js/g).length, 2, 'the comment and the one import');
  assert.match(mainJs, /if \(opensGame\(document\)\) \{\s*import\('\.\/ui\/app\.js'\)/);
  for (const dir of ['', 'ui', 'platform', 'gfx']) {
    for (const f of readdirSync(join(ROOT, 'web', 'js', dir)).filter((n) => n.endsWith('.js'))) {
      const src = readFileSync(join(ROOT, 'web', 'js', dir, f), 'utf8');
      assert.ok(!/^import [^;]*from '\.{1,2}\/(?:ui\/)?app\.js'/m.test(src), `${dir}/${f} imports app.js statically`);
    }
  }
  // Main's data carries no plans or stops for the game to find.
  const rules = JSON.parse(readOut('main', 'data/rules.json'));
  assert.deepEqual([rules.plans, rules.stops], [{}, {}]);
});
