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
import { startGame, loadGameData, openSession, writeSaves, screenName, takePage, devRoute, devHomeSession, devStart, TAP_GUARD_MS, SAVE_ORDER, CLOSED_KEY, pendingOf } from '../../web/js/ui/app.js';
import { createMenu } from '../../web/js/ui/menu.js';
import { opensGame, GAME_SCREENS } from '../../web/js/ui/home.js';
import { showTitleScreen } from '../../web/js/ui/title.js';
import { buildReport, collectFacts, provideState } from '../../web/js/ui/debug.js';
import { recentErrors, clearErrors } from '../../web/js/ui/errors.js';
import { newSession, dispatch, screenOf, replay, unpack, fromBase64url, isEngineError, loadContent } from '../../web/js/engine/api.js';
import { HIKER_ID_RE, nameLength } from '../../web/js/engine/phases/guestbook.js';
import { lockboxActs } from '../../web/js/engine/phases/lockbox.js';
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

/** A sessionStorage for one test (the resume mark, platform/resume.js). */
function sessionStore(t) {
  const had = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const ss = fakeStorage();
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: ss });
  t.after(() => {
    if (had) Object.defineProperty(globalThis, 'sessionStorage', had);
    else delete globalThis.sessionStorage;
  });
  return ss;
}

/** The device record of a phone that has opened the lockbox (S7): its quiz done. */
const OPENED_DEVICE = Object.freeze({ v: 2, quiz: { seed: 'K7QM2Q9F', dealt: ['q_camp_robber', 'q_geoduck', 'q_mountain_out'], answers: [1, 1, 0], done: true } });

/**
 * A localStorage on a phone past the lockbox (S7): the tests about the
 * guest book, the cabin and the trail start there, as a phone that has
 * opened the box does; the first-launch tests take a fresh one.
 */
function openedStorage() {
  const ls = fakeStorage();
  ls.setItem('oph.preview.device', JSON.stringify(OPENED_DEVICE));
  return ls;
}

/** The device for one test: preview's channel, a localStorage (past the lockbox unless given a fresh one), preview's words. */
function device(t, ls = openedStorage()) {
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
/** The choice button whose label is a line (S6: the fork's three). */
const choiceBy = (doc, id) => doc.querySelectorAll('.game-choices .choice').find((b) => b.querySelector('.choice-label') && b.querySelector('.choice-label').getAttribute('data-t') === id);
const tapLine = (doc, id, now) => {
  now.pass();
  choiceBy(doc, id).click();
};
/** Let the compass's promise (no canvas here: it resolves at once) hand over to the outcome. */
const settled = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve();
};

/** Start the game on a shell with the device's storage; deterministic seeds and ids. */
async function start(o = {}) {
  const page = shell(o);
  const now = o.now || clock();
  let n = 0;
  const game = await startGame(page.doc, { fetchFn: o.fetchFn || fetchFn, now, later: () => () => {}, seed: o.seed || (() => ['K7QM2Q9F', '5S45JTGZ', '00000006'][n++ % 3]), hikerId: o.hikerId || (() => 'h00000001'), title: o.title, ...(o.sound ? { sound: o.sound } : {}) });
  return { ...page, game, now };
}

/** Tap the cabin's next step (S7: Plan your first trip, Plan a trip): the trip starts at its first stop. */
const plan = (doc, now) => tap(doc, '.next-step', now);

/** Sign a name in the guest book on screen (S7: the cabin follows). */
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

test('the guest book renders its ids (S7: the field\'s visible label too, which names it), and Sign is enabled only for 1 to 12 code points', () => {
  // Rewritten in S7: the field is named by its visible label, Your hiker's name (12.4's wireframe), not the box's prompt.
  setBundle(WORDS, MARKS, 'preview');
  const doc = fakeDocument();
  const host = doc.createElement('div');
  const signed = [];
  const gb = renderGuestbook(host, { phase: 'guestbook', box: [], choices: [], input: { kind: 'name', max: 12 } }, (name) => signed.push(name));
  assert.deepEqual(ids(host), ['first.guestbook.prompt', 'first.guestbook.label', 'first.guestbook.one_life', 'first.guestbook.sign']);
  assert.equal(host.querySelector('#gb-prompt').textContent, 'Sign the guest book.');
  assert.equal(host.querySelector('#gb-label').textContent, "Your hiker's name");
  assert.equal(gb.label.getAttribute('for'), 'gb-name');
  assert.equal(gb.suggest, null, 'no names to suggest: no Suggest');
  for (const [k, v] of Object.entries({ type: 'text', 'aria-labelledby': 'gb-label', autocomplete: 'off', autocapitalize: 'words', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done' })) {
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

test('the game takes the page: #app becomes the game view; the update note and the stamps move into the ≡ sheet\'s foot (the mailbox, S7), the install line into the game\'s foot (and with no sheet, all three there)', (t) => {
  device(t);
  const { doc, update, install, stamps, restart } = shell();
  let restarted = 0;
  restart.addEventListener('click', () => restarted++);
  const menu = createMenu(doc);
  const taken = takePage(doc, menu);
  assert.deepEqual(menu.foot.children, [update, stamps], 'the update note and the stamps: the mailbox\'s foot, the same nodes');
  assert.deepEqual(taken.app.children[0].children[1].children, [install], 'the install line: the game\'s foot (the cabin shows it, Safari only)');
  restart.click();
  assert.equal(restarted, 1, "Restart's listener traveled with it");
  const again = shell();
  const { app, host } = takePage(again.doc);
  const page = again;
  assert.equal(app.id, 'app');
  assert.equal(app.className, 'game-page');
  assert.equal(app.children.length, 1);
  const section = app.children[0];
  assert.equal(section.className, 'game');
  assert.deepEqual(section.children.map((c) => c.className), ['game-screen', 'game-foot']);
  assert.equal(host, section.children[0]);
  const foot = section.children[1];
  assert.deepEqual(foot.children, [page.update, page.install, page.stamps], 'the same nodes, moved');
  assert.ok(page.doc.getElementById('build-stamp') && page.doc.getElementById('offline'));
  assert.equal(page.doc.getElementById('plate'), null, 'the cover is gone');
});

test('a full run from a fresh device writes oph.preview.device, .hiker, .labels and .trip, and nothing else (E.6: the device first whenever it changed, then the trip, then the hiker)', async (t) => {
  // Rewritten in S7: first launch is the lockbox (each tap writes the device record), then the guest book, then the cabin.
  const ls = device(t, fakeStorage());
  const order = [];
  const setItem = ls.setItem;
  ls.setItem = (k, v) => {
    order.push(k);
    setItem(k, v);
  };
  const seeds = ['0000000A', 'K7QM2Q9F'];
  const { doc, game, now } = await start({ fetchFn: fetchArt, seed: () => seeds.shift() });
  const app = doc.getElementById('app');
  assert.equal(app.getAttribute('data-screen'), 'lockbox');
  assert.deepEqual(order, ['oph.preview.device'], 'the device, at the first launch');
  assert.equal(doc.querySelector('.next-step .choice-label').getAttribute('data-t'), 'first.lockbox.start');
  tap(doc, '.next-step', now);
  assert.deepEqual(order, ['oph.preview.device', 'oph.preview.device'], 'the deal writes the device');
  assert.equal(JSON.parse(ls.getItem('oph.preview.device')).quiz.seed, '0000000A', 'with the seed the game drew');
  for (let q = 0; q < 3; q++) tap(doc, '.game-choices .choice', now);
  tap(doc, '.game-choices .choice', now);
  assert.equal(app.getAttribute('data-screen'), 'guestbook');
  assert.deepEqual(order, Array(6).fill('oph.preview.device'), 'each answer and the key write the device, and nothing else');
  assert.equal(doc.activeElement, doc.querySelector('.game-box'), 'the box takes focus');
  sign(doc, now);
  // S7: the cabin, with Plan your first trip.
  assert.equal(app.getAttribute('data-screen'), 'home');
  assert.equal(doc.querySelector('.next-step .choice-label').getAttribute('data-t'), 'home.next.plan_first');
  assert.equal(doc.activeElement, doc.querySelector('.next-step'), 'the next step takes focus');
  assert.deepEqual(order.slice(6), ['oph.preview.hiker'], 'sign saves the hiker');
  // A place used: its label turns to a dot, kept on the phone (the player's).
  tap(doc, '.rail-item[aria-disabled]', now);
  assert.deepEqual(order.slice(-1), ['oph.preview.labels']);
  plan(doc, now);
  assert.equal(app.getAttribute('data-screen'), 'trail');
  assert.deepEqual(boxIds(doc), ['trail.deer_lake_rim.deer_lake']);
  assert.deepEqual(order.slice(6), ['oph.preview.hiker', 'oph.preview.labels', 'oph.preview.trip', 'oph.preview.hiker'], 'the start saves the trip, then the hiker');
  tap(doc, '.game-choices .choice', now);
  assert.deepEqual(boxIds(doc), ['trail.deer_lake_rim.rim']);
  assert.deepEqual(order.slice(-2), ['oph.preview.trip', 'oph.preview.hiker'], 'the device is written only when it changed');
  assert.deepEqual([...ls.map.keys()].sort(), ['oph.preview.device', 'oph.preview.hiker', 'oph.preview.labels', 'oph.preview.trip']);
  const hiker = JSON.parse(ls.getItem('oph.preview.hiker'));
  const trip = JSON.parse(ls.getItem('oph.preview.trip'));
  const dev = JSON.parse(ls.getItem('oph.preview.device'));
  assert.equal(dev.v, 2);
  assert.equal(dev.quiz.done, true);
  assert.deepEqual(dev.quiz.answers, [0, 0, 0]);
  assert.equal(hiker.name, 'Robin');
  assert.deepEqual(hiker.latest, { seed: 'K7QM2Q9F', stop: 2 }, "the hiker holds the trip's latest stop");
  assert.deepEqual(Object.keys(trip).sort(), ['base', 'hash', 'log', 'profile', 'rules', 'snapshot', 'v']);
  assert.equal(trip.rules, RULES);
  assert.equal(trip.snapshot.n, 2);
  assert.ok(!JSON.stringify(trip).includes('Robin'), 'the name is in the hiker record only');
  assert.deepEqual(unpack(fromBase64url(trip.log)).actions, [['next']], 'the complete log');
  assert.equal(game.session().state.trip.stop, 'rim');
  assert.deepEqual(SAVE_ORDER, ['device', 'trip', 'hiker']);
});

test('resume: closing the app on a stop and opening it again shows the same stop (the Done when)', async (t) => {
  device(t);
  const first = await start();
  sign(first.doc, first.now);
  plan(first.doc, first.now);
  tap(first.doc, '.game-choices .choice', first.now);
  const before = first.game.session();
  // The app is swiped closed; the saves stay. A new page opens on them.
  const again = await start();
  assert.equal(again.doc.getElementById('app').getAttribute('data-screen'), 'trail');
  assert.deepEqual(boxIds(again.doc), ['trail.deer_lake_rim.rim']);
  assert.deepEqual(again.game.session().state, before.state, 'the same state');
  assert.deepEqual(again.game.session().log, before.log, 'and the same log, which goes on');
  // S6: the rim walks on to the fork (re-pinned: S5's rim ended the trip); its sure way back ends it.
  tap(again.doc, '.game-choices .choice', again.now);
  assert.deepEqual(boxIds(again.doc), ['trail.odds.intro.fatal', 'trail.deer_lake_rim.fork'], "the fork, with the first fatal share's intro");
  tapLine(again.doc, 'trail.deer_lake_rim.fork.car', again.now);
  assert.equal(again.game.session().state.trip.stop, 'car_out');
  tap(again.doc, '.game-choices .choice', again.now);
  assert.deepEqual(again.game.session().state.hiker.trips, 1);
  // S7: the trip's end comes home to the cabin.
  assert.equal(again.doc.getElementById('app').getAttribute('data-screen'), 'home');
});

test('closing the guest book before Sign brings back an empty guest book; after Sign, the cabin (rewritten in S7: no trip starts by itself), whose Plan your first trip starts a fresh trip at the first stop', async (t) => {
  device(t);
  await start();
  const back = await start();
  assert.equal(back.doc.getElementById('app').getAttribute('data-screen'), 'guestbook');
  assert.equal(back.doc.getElementById('gb-name').value, '');
  sign(back.doc, back.now);
  assert.equal(back.doc.getElementById('app').getAttribute('data-screen'), 'home');
  assert.equal(back.game.session().state.trip, null, 'nothing starts by itself');
  // Closed and opened again: the cabin, and its next step starts the trip with a new seed.
  const fresh = await start({ seed: () => 'Q5Z2K8M1' });
  assert.equal(fresh.doc.getElementById('app').getAttribute('data-screen'), 'home');
  assert.equal(fresh.doc.querySelector('.next-step .choice-label').getAttribute('data-t'), 'home.next.plan_first');
  plan(fresh.doc, fresh.now);
  assert.deepEqual(boxIds(fresh.doc), ['trail.deer_lake_rim.deer_lake']);
  assert.equal(fresh.game.session().state.trip.seed, 'Q5Z2K8M1', 'the next step starts a new trip with a drawn seed');
  assert.equal(fresh.game.session().state.trip.n, 1);
});

test("the mailbox over the guest book (S7 review): ≡ opens it with focus inside it; its Text toggle redraws the guest book behind it with the typed name kept and the focus still on the toggle; closing it gives focus back to ≡", async (t) => {
  device(t);
  const { doc } = await start();
  assert.equal(doc.getElementById('app').getAttribute('data-screen'), 'guestbook');
  const field = doc.getElementById('gb-name');
  field.value = 'Quinn';
  field.dispatchEvent({ type: 'input', isComposing: false });
  const menuButton = doc.querySelector('.game-screen .status-menu');
  menuButton.focus();
  menuButton.click();
  const sheet = doc.querySelector('.menu');
  assert.equal(sheet.getAttribute('aria-modal'), 'true', 'a modal dialog');
  assert.ok(sheet.contains(doc.activeElement), 'focus is in the sheet');
  const text = doc.querySelector('.menu .mail-text');
  assert.ok(doc.activeElement === doc.querySelector('.menu .mail-sound'), 'on its first row');
  text.focus();
  text.click();
  assert.equal(doc.getElementById('gb-name').value, 'Quinn', 'the name typed stays');
  assert.equal(doc.getElementById('gb-sign').disabled, false, 'and Sign with it');
  assert.ok(doc.activeElement === text, 'focus stays on the toggle while the sheet is open');
  // Escape closes it; focus goes back to ≡ (the one drawn again behind the sheet).
  for (const f of [...(doc.listeners.get('keydown') || [])]) f({ type: 'keydown', key: 'Escape' });
  assert.equal(doc.querySelector('.menu-scrim').hidden, true);
  assert.ok(doc.activeElement === doc.querySelector('.game-screen .status-menu'), `focus back on ≡, not ${doc.activeElement && doc.activeElement.className}`);
  // Text back to what it was.
  doc.querySelector('.game-screen .status-menu').click();
  doc.querySelector('.menu .mail-text').click();
});

test('after the fork, the sure way back ends the sample trip at the cabin (rewritten in S7: no auto-restart), whose Plan a trip starts a new one at the first stop, with a new seed and log', async (t) => {
  // Re-pinned in S6: the sample walks on from the rim to the fork; Back to the car, sure, then Walk on, ends it.
  device(t);
  const { doc, game, now } = await start();
  sign(doc, now);
  plan(doc, now);
  const firstSeed = game.session().state.trip.seed;
  tap(doc, '.game-choices .choice', now);
  tap(doc, '.game-choices .choice', now);
  tapLine(doc, 'trail.deer_lake_rim.fork.car', now);
  tap(doc, '.game-choices .choice', now);
  // The trip's end comes home.
  assert.equal(doc.getElementById('app').getAttribute('data-screen'), 'home');
  assert.ok(game.session().state.trip.end, 'the trip is over, and nothing new has started');
  assert.equal(game.session().state.hiker.trips, 1);
  assert.equal(doc.querySelector('.next-step .choice-label').getAttribute('data-t'), 'home.next.plan', 'Plan a trip');
  plan(doc, now);
  const s = game.session();
  assert.deepEqual(boxIds(doc), ['trail.deer_lake_rim.deer_lake']);
  assert.notEqual(s.state.trip.seed, firstSeed);
  assert.equal(s.state.trip.n, 1);
  assert.deepEqual(s.log.actions, [], 'a fresh log');
  assert.equal(s.state.hiker.trips, 1);
});

// ---- S6: the fork, end to end ------------------------------------------------

/** A sound that records what it plays. */
function recSound() {
  const played = [];
  return { played, play: (c) => played.push(c), isOn: () => true, setOn() {}, report: () => null };
}

/** Sign, plan the first trip, and walk to the fork. */
function toFork(doc, now) {
  sign(doc, now);
  plan(doc, now);
  tap(doc, '.game-choices .choice', now);
  tap(doc, '.game-choices .choice', now);
}

test("the fork end to end (S6): the diamond's confirm, Yes, the compass, the outcome and its cue; the save at the tap already holds the outcome, and reopened it shows the outcome directly", async (t) => {
  const ls = device(t);
  const sound = recSound();
  const { doc, game, now } = await start({ sound });
  toFork(doc, now);
  assert.deepEqual(boxIds(doc), ['trail.odds.intro.fatal', 'trail.deer_lake_rim.fork']);
  // One tap on the diamond: the confirm, and nothing taken.
  tapLine(doc, 'trail.deer_lake_rim.fork.high', now);
  assert.equal(game.session().state.trip.stop, 'fork');
  assert.ok(doc.querySelector('.choice-confirm'));
  // Yes: the step, the saves, then the compass (no canvas here: at once), then the outcome.
  now.pass();
  doc.querySelector('.confirm-yes').click();
  assert.equal(game.session().state.trip.stop, 'high_struck', 'K7QM2Q9F: lightning hits close');
  const saved = JSON.parse(ls.getItem('oph.preview.trip'));
  assert.equal(saved.snapshot.stop, 'high_struck', 'the save at the confirming tap holds the outcome (8.14)');
  assert.deepEqual(saved.snapshot.rolled, { stop: 'fork', c: 'high', band: 'fail' });
  await settled();
  assert.deepEqual(boxIds(doc), ['trail.deer_lake_rim.fork.high.struck']);
  assert.ok(doc.querySelector('.outcome-notes'));
  assert.equal(sound.played[sound.played.length - 1], 'ui.serious', 'the outcome plays its cue after the compass');
  // Reopened (the app closed mid-spin, or after): the outcome, at once, and no cue.
  const sound2 = recSound();
  const again = await start({ sound: sound2 });
  assert.deepEqual(boxIds(again.doc), ['trail.deer_lake_rim.fork.high.struck']);
  assert.ok(!sound2.played.includes('ui.serious'), 'a restored save shows the outcome directly');
  tap(again.doc, '.game-choices .choice', again.now);
  assert.equal(again.game.session().state.hiker.trips, 1, 'Walk on ends the trip');
});

test("a double tap on the diamond takes nothing (12.1): its second tap lands where Yes now is, inside the guard the confirm restarted", async (t) => {
  device(t);
  const { doc, game, now } = await start();
  toFork(doc, now);
  const at = game.session().state.trip.n;
  tapLine(doc, 'trail.deer_lake_rim.fork.high', now);
  assert.ok(doc.querySelector('.choice-confirm'), 'the first tap opens the confirm');
  now.pass(120);
  doc.querySelector('.confirm-yes').click();
  assert.equal(game.session().state.trip.stop, 'fork', 'the second tap of the double tap is dropped');
  assert.equal(game.session().state.trip.n, at, 'nothing was dispatched');
  assert.ok(doc.querySelector('.choice-confirm'), 'the confirm stays open');
  // A deliberate Yes, once the guard has passed, takes it.
  now.pass();
  doc.querySelector('.confirm-yes').click();
  assert.equal(game.session().state.trip.stop, 'high_struck');
});

/**
 * Give the game's page a phone with canvases from here on (the frame then
 * draws its picture, and the diamond's Yes plays the compass on it), with
 * Reduce Motion on so nothing waits on a frame. The art comes from the
 * preview build. Undone after the test.
 * @returns {{art: any}}
 */
function canvasPhone(t, doc) {
  // A 2D context that draws nothing: every method a no-op, and image data to fill.
  const ctx2d = new Proxy({ createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) }, { get: (o, k) => (k in o ? o[k] : () => {}), set: () => true });
  const make = doc.createElement;
  doc.createElement = (tag) => {
    const el = make(tag);
    el.getBoundingClientRect = () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 });
    if (tag === 'canvas') el.getContext = () => ctx2d;
    return el;
  };
  const win = {
    innerWidth: 402,
    innerHeight: 778,
    devicePixelRatio: 3,
    screen: { width: 402, height: 874 },
    addEventListener() {},
    removeEventListener() {},
    getComputedStyle: () => ({ getPropertyValue: () => '', lineHeight: 'normal', paddingTop: '0', paddingBottom: '0' }),
  };
  doc.defaultView = win;
  const had = {};
  for (const k of ['document', 'window', 'matchMedia', 'requestAnimationFrame', 'cancelAnimationFrame']) had[k] = Object.getOwnPropertyDescriptor(globalThis, k);
  const set = (k, v) => Object.defineProperty(globalThis, k, { configurable: true, writable: true, value: v });
  set('document', doc);
  set('window', win);
  set('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  set('requestAnimationFrame', () => 0);
  set('cancelAnimationFrame', () => {});
  t.after(() => {
    doc.createElement = make;
    for (const [k, d] of Object.entries(had)) {
      if (d) Object.defineProperty(globalThis, k, d);
      else delete globalThis[k];
    }
  });
}

/** fetch() for the preview build's data/ folder and its art/art.json. */
async function fetchArt(url) {
  if (basename(url.pathname) !== 'art.json') return fetchFn(url);
  const body = readOut('preview', join('art', 'art.json'));
  return { ok: true, status: 200, json: async () => JSON.parse(body) };
}

test("after the compass, the outcome's choices take taps again: the compass's inert mark goes with the fork's frame (the outcome's Walk on, its picture's Look)", async (t) => {
  device(t);
  const page = shell();
  const now = clock();
  let n = 0;
  const game = await startGame(page.doc, { fetchFn: fetchArt, now, seed: () => ['K7QM2Q9F', '5S45JTGZ', '00000006'][n++ % 3], hikerId: () => 'h00000001', sound: recSound() });
  const { doc } = page;
  sign(doc, now);
  plan(doc, now);
  tap(doc, '.game-choices .choice', now);
  canvasPhone(t, doc);
  tap(doc, '.game-choices .choice', now);
  assert.equal(game.session().state.trip.stop, 'fork');
  const host = doc.querySelector('.game-screen');
  assert.ok(host.querySelector('canvas.picture').getContext, 'the fork drawn on a canvas');
  tapLine(doc, 'trail.deer_lake_rim.fork.high', now);
  now.pass();
  doc.querySelector('.confirm-yes').click();
  assert.equal(game.session().state.trip.stop, 'high_struck');
  assert.ok(host.hasAttribute('data-compass'), 'the compass plays: the box and the choices are inert');
  assert.deepEqual(boxIds(doc), ['trail.odds.intro.fatal', 'trail.deer_lake_rim.fork'], 'the fork stays under the compass');
  // At rest (Reduce Motion), a tap goes on to the outcome.
  host.dispatchEvent({ type: 'click' });
  await settled();
  assert.deepEqual(boxIds(doc), ['trail.deer_lake_rim.fork.high.struck']);
  assert.equal(host.hasAttribute('data-compass'), false, "the outcome's choices and picture are live");
  doc.querySelector('.frame-picture').dispatchEvent({ type: 'click' });
  assert.ok(doc.querySelector('.look-box'), "a tap on the outcome's picture shows its Look");
  tap(doc, '.game-choices .choice', now);
  assert.equal(game.session().state.hiker.trips, 1, 'Walk on ends the trip');
});

test('a % choice goes straight to its outcome (8.8): no confirm, no compass; the outcome plays its cue', async (t) => {
  device(t);
  const sound = recSound();
  const { doc, game, now } = await start({ sound });
  toFork(doc, now);
  tapLine(doc, 'trail.deer_lake_rim.fork.basin', now);
  assert.equal(doc.querySelector('.choice-confirm'), null);
  assert.equal(game.session().state.trip.stop, 'basin_shaky');
  assert.deepEqual(boxIds(doc), ['trail.deer_lake_rim.fork.basin.shaky'], 'drawn at once');
  assert.deepEqual(sound.played.slice(-2), ['ui.tick', 'ui.mishap']);
});

test("a death (S6's stand-in): the death box's Next ends the trip and the hiker; the saves keep no hiker; the guest book signs a new one; the odds intros already seen stay seen", async (t) => {
  const ls = device(t);
  let ids = 0;
  const { doc, game, now } = await start({ seed: () => 'D000000Z', hikerId: () => `h0000000${++ids}` });
  toFork(doc, now);
  tapLine(doc, 'trail.deer_lake_rim.fork.high', now);
  now.pass();
  doc.querySelector('.confirm-yes').click();
  await settled();
  assert.equal(game.session().state.trip.stop, 'high_fatal');
  assert.deepEqual(boxIds(doc), ['trail.deer_lake_rim.fork.high.fatal']);
  const next = doc.querySelector('.game-choices .choice .choice-label');
  assert.deepEqual([next.getAttribute('data-t'), next.textContent], ['trail.next', 'Next']);
  assert.equal(JSON.parse(ls.getItem('oph.preview.hiker')).name, 'Robin', 'until Next, the hiker is there to see it');
  tap(doc, '.game-choices .choice', now);
  assert.equal(doc.getElementById('app').getAttribute('data-screen'), 'guestbook');
  assert.equal(game.session().state.hiker, null);
  assert.equal(ls.getItem('oph.preview.hiker'), 'null', 'the stored hiker goes too');
  assert.equal(JSON.parse(ls.getItem('oph.preview.trip')).snapshot.end, 'sample');
  // Closing the app now reopens on the guest book, never the dead hiker.
  const reopened = await start({ seed: () => 'D000000Z', hikerId: () => 'h00000009' });
  assert.equal(reopened.doc.getElementById('app').getAttribute('data-screen'), 'guestbook');
  // A new hiker signs and comes home to the cabin (S7), and the next step starts fresh at Deer Lake; the phone's odds intros stay seen (9.8: the player's, not the hiker's).
  sign(doc, now, 'Sam');
  assert.equal(doc.getElementById('app').getAttribute('data-screen'), 'home');
  assert.equal(doc.querySelector('.next-step .choice-label').getAttribute('data-t'), 'home.next.plan_first', 'a new hiker has no finished trip');
  plan(doc, now);
  assert.equal(game.session().state.hiker.name, 'Sam');
  assert.equal(game.session().state.trip.stop, 'deer_lake');
  assert.equal(game.session().state.hiker.trips, 0);
  assert.deepEqual(JSON.parse(ls.getItem('oph.preview.odds_seen')), ['fatal']);
  tap(doc, '.game-choices .choice', now);
  tap(doc, '.game-choices .choice', now);
  assert.deepEqual(boxIds(doc), ['trail.odds.intro.diamond', 'trail.deer_lake_rim.fork'], 'the next intro, not the first again');
});

test("after a death the guest book's porch shows the open book alone, never first launch's lit lockbox (decision 45, lead call 53: the lockbox never comes back; S7 review)", async (t) => {
  device(t);
  let ids = 0;
  const { doc, now } = await start({ fetchFn: fetchArt, seed: () => 'D000000Z', hikerId: () => `h0000000${++ids}` });
  toFork(doc, now);
  tapLine(doc, 'trail.deer_lake_rim.fork.high', now);
  now.pass();
  doc.querySelector('.confirm-yes').click();
  await settled();
  tap(doc, '.game-choices .choice', now);
  assert.equal(doc.getElementById('app').getAttribute('data-screen'), 'guestbook');
  const key = String(doc.querySelector('.game-screen').getAttribute('data-key'));
  assert.match(key, /^cabin@.*\.guestbook$/, key);
  assert.ok(!key.includes('.first'), 'no first-launch overlay');
  // Reopened on the guest book after the death: the book alone still.
  const reopened = await start({ fetchFn: fetchArt });
  assert.match(String(reopened.doc.querySelector('.game-screen').getAttribute('data-key')), /\.guestbook$/);
});

test('a double tap is dropped, and a stale tap the engine refuses is ignored', async (t) => {
  device(t);
  const { doc, game, now } = await start();
  sign(doc, now);
  plan(doc, now);
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
  plan(doc, now);
  tap(doc, '.game-choices .choice', now);
  assert.equal(game.session().state.trip.n, 2, 'play goes on');
  const notes = recentErrors().filter((e) => /storage: the phone refused/.test(e.message));
  assert.equal(notes.length, 1, 'noted once, not at every tap');
});

test('a damaged save stops with EngineError format, for the error sheet, and nothing is deleted', async (t) => {
  const ls = device(t);
  const { doc, now } = await start();
  sign(doc, now);
  plan(doc, now);
  const trip = JSON.parse(ls.getItem('oph.preview.trip'));
  const bad = JSON.stringify({ ...trip, hash: '0'.repeat(64), log: 'T1AB' });
  ls.setItem('oph.preview.trip', bad);
  await assert.rejects(start(), (e) => isEngineError(e) && e.code === 'format');
  assert.equal(ls.getItem('oph.preview.trip'), bad, 'the save is kept for the report');
});

test('openSession and writeSaves: a fresh device, then the records: the device first whenever it changed (S7), then the trip', () => {
  // Rewritten in S7: SAVE_ORDER is device, trip, hiker; the device is written only when it differs from the one stored.
  assert.deepEqual([...SAVE_ORDER], ['device', 'trip', 'hiker']);
  const content = loadNow();
  const mem = new Map();
  const store = { load: (k) => (mem.has(k) ? JSON.parse(mem.get(k)) : null), save: (k, v) => (mem.set(k, JSON.stringify(v)), true) };
  const fresh = openSession(content, store);
  assert.equal(fresh.first, true);
  assert.deepEqual(fresh.session, newSession(content));
  assert.equal(screenName(screenOf(fresh.session.state, content)), 'lockbox');
  let s = fresh.session;
  for (const a of [{ t: 'deal', seed: 'K7QM2Q9F' }, { t: 'answer', a: 0 }, { t: 'answer', a: 1 }, { t: 'answer', a: 2 }, { t: 'open' }]) {
    s = dispatch(s, a, content).session;
    assert.deepEqual(writeSaves(s, store), []);
    assert.deepEqual(JSON.parse(mem.get('device')), s.state.device, `${a.t}: the device written`);
  }
  assert.deepEqual([...mem.keys()], ['device'], 'the lockbox writes the device alone');
  const writes = [];
  const counting = { ...store, save: (k, v) => (writes.push(k), store.save(k, v)) };
  s = dispatch(s, { t: 'sign', name: 'Robin', id: 'h00000001' }, content).session;
  assert.deepEqual(writeSaves(s, counting), []);
  assert.deepEqual(writes, ['hiker'], 'an unchanged device is not written again');
  assert.deepEqual([...mem.keys()], ['device', 'hiker'], 'no trip yet, so no trip record');
  s = dispatch(s, { t: 'start', plan: 'sample', seed: 'K7QM2Q9F' }, content).session;
  writeSaves(s, store);
  assert.deepEqual(writeSaves(s, { ...store, save: () => false }), ['trip', 'hiker'], 'what the phone refused');
  assert.deepEqual(writeSaves({ ...s, state: { ...s.state, device: { v: 2, quiz: null } } }, { ...store, save: () => false }), ['device', 'trip', 'hiker'], 'a changed device the phone refused');
  const back = openSession(content, store);
  assert.equal(back.first, false, 'the device record is on the phone');
  assert.equal(back.session.state.device.quiz.done, true, 'the lockbox stays open');
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
  let s = newSession(content);
  for (const a of lockboxActs('K7QM2Q9F', content)) s = dispatch(s, a, content).session;
  s = dispatch(s, { t: 'sign', name: 'Robin', id: 'h00000001' }, content).session;
  s = dispatch(s, { t: 'start', plan: 'sample', seed: 'K7QM2Q9F' }, content).session;
  assert.deepEqual(writeSaves(s, store), []);
  s = dispatch(s, { t: 'next' }, content).session;
  const noTrip = { ...store, save: (k, v) => k !== 'trip' && store.save(k, v) };
  assert.deepEqual(writeSaves(s, noTrip), ['trip', 'hiker'], 'the hiker follows its trip (the device, unchanged, is not written)');
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
  assert.deepEqual(screenOf(closed.session.state, content).next, { id: 'plan_first', act: { t: 'start', plan: 'sample' } }, "home's next step starts a fresh trip (S7: on a tap)");
  assert.deepEqual(JSON.parse(mem.get(CLOSED_KEY)), [JSON.parse(rec)], 'the closed trip is kept');
  assert.equal(mem.get('trip'), 'null');
  assert.equal(recentErrors().filter((e) => /\(stale\) was closed and kept in trip_closed/.test(e.message)).length, 1, 'the bug report notes it');
});

test("a trip a later build can't place (its stop renamed) is closed and kept, and the game opens on a fresh trip, not the error sheet at every launch", async (t) => {
  const ls = device(t);
  const { doc, now } = await start();
  sign(doc, now);
  plan(doc, now);
  tap(doc, '.game-choices .choice', now);
  const rec = JSON.parse(ls.getItem('oph.preview.trip'));
  assert.equal(rec.snapshot.stop, 'rim');
  // The next build renames the stop the trip stands on.
  const renamed = async (url) => {
    const body = readOut('preview', join('data', basename(url.pathname))).replaceAll('"rim"', '"rim_end"');
    return { ok: true, status: 200, json: async () => JSON.parse(body) };
  };
  const page = shell({ rules: '0000000000ab' });
  const pageNow = clock();
  const game = await startGame(page.doc, { fetchFn: renamed, now: pageNow, seed: () => '00000006', hikerId: () => 'h00000001' });
  assert.equal(game.session().state.trip, null, 'the trip is closed, and the game opens on the cabin');
  assert.equal(page.doc.getElementById('app').getAttribute('data-screen'), 'home');
  plan(page.doc, pageNow);
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

// Rewritten in S7b (was "the title hands over when its draw-in is done, and a failed title never blocks the
// game"): the title screen (ui/title.js, decision 74) holds the page until a tap, at least as strongly.
test('the title screen hands over on the tap, never before; the data loads under it; a tap before the data has loaded hands over once it has; nothing brings the title back after (visibilitychange, a persisted pageshow), and the session is marked so a reload comes back past it; a failed title never blocks the game (S7b)', async (t) => {
  device(t);
  const ss = sessionStore(t);
  // A real title screen (ui/title.js) over a stand-in for the cover's drawing (home.js showTitle needs a canvas).
  const later = () => () => {};
  let stopped = 0;
  const fakeShow = async (doc, { prepare, onFit }) => {
    prepare({ pics: { cover_high_divide_dusk: { width: 160, height: 320, ops: [] } }, title: { cover: 'cover_high_divide_dusk', label: { name: 'place.mount_olympus_west_peak', summit: [90, 101], floor: 96 }, quiet: [] } });
    if (onFit) onFit({ sx: 7, sy: 4, short: false }, { origin: { ox: 1, oy: 0 } });
    return { finish() {}, stop: () => stopped++, done: Promise.resolve(), art: null, display: null };
  };
  // The data/ fetches, each held until the test lets it go.
  const held = [];
  const fetched = [];
  const holdFetch = (url) => {
    fetched.push(basename(url.pathname));
    if (basename(url.pathname) !== 'rules.json') return fetchFn(url);
    return new Promise((r) => held.push(() => r(fetchFn(url))));
  };
  const winListeners = new Map();
  const page = shell({ screens: 'app debug guestbook home title trail' });
  const { doc } = page;
  doc.defaultView = { devicePixelRatio: 3, location: { hash: '', search: '', pathname: '/' }, addEventListener: (type, f) => winListeners.set(type, [...(winListeners.get(type) || []), f]), removeEventListener() {}, history: { replaceState() {} } };
  const now = clock();
  const sound = { played: [], play(c) { this.played.push(c); }, isOn: () => true, setOn() {}, report: () => null };
  const title = showTitleScreen(doc, { show: fakeShow, words: Promise.resolve(), now, later, reduced: true });
  const pending = startGame(doc, { title, fetchFn: holdFetch, now, later, sound, seed: () => 'K7QM2Q9F', hikerId: () => 'h00000001' });
  await new Promise((r) => setTimeout(r, 20));
  const app = doc.getElementById('app');
  assert.ok(fetched.includes('rules.json'), 'the data is fetched while the title waits');
  assert.equal(app.getAttribute('data-title'), 'ready', 'the prompt shows');
  assert.equal(app.getAttribute('data-screen'), 'title');
  // The tap, before the data has loaded: nothing yet but the cue, inside the tap.
  now.pass();
  app.dispatchEvent({ type: 'click', target: doc.querySelector('.title-go') });
  assert.equal(app.getAttribute('data-title'), 'entered');
  assert.deepEqual(sound.played, ['ui.next'], "Next's two dry clicks, inside the tap");
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(app.getAttribute('data-screen'), 'title', 'still the title: the data has not loaded');
  assert.equal(stopped, 0);
  assert.equal(ss.map.size, 0, 'no resume mark before the game has the page');
  // A second tap changes nothing: one start.
  now.pass();
  app.dispatchEvent({ type: 'click', target: app });
  assert.deepEqual(sound.played, ['ui.next']);
  // The data arrives: the game takes the page, once.
  for (const go of held.splice(0)) go();
  await pending;
  assert.equal(stopped, 1, 'the cover stops once, at the take-over');
  assert.equal(app.getAttribute('data-screen'), 'guestbook');
  assert.equal(app.getAttribute('data-title'), null, 'the title screen let go of #app');
  assert.equal(doc.querySelector('.title-go'), null);
  assert.equal(doc.querySelector('.peak-label'), null);
  // The game has the page: the session is marked (S7b review), so any reload in it, iOS reloading the app it shut
  // down in the background included, comes back past the title screen; closing the app drops it.
  assert.deepEqual([...ss.map.entries()], [['oph.preview.resume', '1']]);
  // Back from the background, or out of the back-forward cache: nothing brings the title back.
  for (const f of doc.listeners.get('visibilitychange') || []) f({ type: 'visibilitychange' });
  for (const f of winListeners.get('pageshow') || []) f({ type: 'pageshow', persisted: true });
  assert.equal(app.getAttribute('data-screen'), 'guestbook');
  assert.equal(doc.querySelector('.title-go'), null);
  assert.equal(doc.querySelector('.peak-label'), null);
  assert.equal(doc.querySelector('.plate'), null);
  assert.ok(!winListeners.has('pageshow'), 'nobody listens for the cache\'s pageshow');

  // The data first, then the tap: the game waits for the tap, and takes the page on it.
  let entered = () => {};
  let stops = 0;
  const waiting = Promise.resolve({ stop: () => stops++, done: Promise.resolve(), entered: new Promise((r) => { entered = r; }), onEnter() {} });
  const slow = start({ title: waiting });
  let settled = false;
  slow.then(() => {
    settled = true;
  });
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(settled, false, 'the draw-in is done, the data is in: still the title, until the tap');
  assert.equal(stops, 0);
  entered();
  const { doc: d2 } = await slow;
  assert.equal(stops, 1);
  assert.equal(d2.getElementById('app').getAttribute('data-screen'), 'guestbook');
  // Main's title page (no entered) and a resume (entered is done) hand over when the draw-in is done, never before
  // (S7b review: a title with no entered and its draw-in still going).
  let drawn = () => {};
  const drawing = start({ title: Promise.resolve({ stop() {}, done: new Promise((r) => { drawn = r; }) }) });
  let mainSettled = false;
  drawing.then(() => {
    mainSettled = true;
  });
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(mainSettled, false, 'the data is in: still the cover, until its draw-in is done');
  drawn();
  const mainStyle = await drawing;
  assert.equal(mainStyle.doc.getElementById('app').getAttribute('data-screen'), 'guestbook');
  const failed = await start({ title: Promise.reject(new Error('art: 404')) });
  assert.equal(failed.doc.getElementById('app').getAttribute('data-screen'), 'guestbook', 'a failed title never blocks the game');
});

test('the report: its screen follows #app[data-screen], its state names nobody, and its log replays to its hash (the Done when)', async (t) => {
  device(t);
  const { doc, now } = await start();
  const r0 = buildReport(collectFacts(doc));
  assert.equal(r0.screen, 'guestbook');
  assert.equal(r0.state.phase, 'guestbook');
  assert.equal(r0.state.hiker, null);
  sign(doc, now, 'Robin Hood');
  assert.equal(buildReport(collectFacts(doc)).screen, 'home');
  plan(doc, now);
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
  plan(doc, now);
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

test("main's built page has data-screens=\"app debug title\" and never loads ui/app.js; preview's lists the home (S7), the lockbox and the mailbox too, and the game needs the home", () => {
  const screensOf = (html) => /<html [^>]*data-screens="([^"]*)"/.exec(html)[1];
  const mainHtml = readOut('main', 'index.html');
  const previewHtml = readOut('preview', 'index.html');
  assert.equal(screensOf(mainHtml), 'app debug title');
  // S4: preview's screens gain the map (#map, ui/map.js; map.test.mjs checks its gate). S7: the home, the lockbox and the mailbox.
  assert.equal(screensOf(previewHtml), 'app debug guestbook home lockbox mailbox map title trail');
  assert.deepEqual(GAME_SCREENS, ['home']);
  assert.equal(opensGame(shell({ screens: 'app debug title' }).doc), false);
  assert.equal(opensGame(shell({ screens: 'app debug guestbook title trail' }).doc), false, 'S7: no home, no game');
  assert.equal(opensGame(shell({ screens: 'app debug guestbook home title trail' }).doc), true);
  assert.equal(opensGame(shell({ screens: 'dev' }).doc), false, 'the unbuilt shell has no game');
  // main.js imports the game in one place, behind the gate, and nothing
  // imports it statically, so main's module graph never holds it.
  // Rewritten in S7b: the gate now returns main's title page first, and the
  // title screen (ui/title.js) is imported beside the game, behind the same
  // gate, in one place; nothing imports either statically.
  const mainJs = readFileSync(join(ROOT, 'web', 'js', 'main.js'), 'utf8');
  assert.equal(mainJs.match(/ui\/app\.js/g).length, 2, 'the comment and the one import');
  assert.equal(mainJs.match(/ui\/title\.js/g).length, 2, 'the comment and the one import');
  // After S7b's review the title screen's stylesheet is linked beside its module, behind the same gate.
  assert.match(mainJs, /if \(!opensGame\(document\)\) return showTitle\(document\);\n(?:\s*\/\/[^\n]*\n)*\s*const css = linkStyle\(new URL\('\.\.\/css\/title\.css', import\.meta\.url\)\); \/\/ screens: home\n\s*const title = import\('\.\/ui\/title\.js'\) \/\/ screens: home\n\s*\.then\(\(\{ showTitleScreen \}\) => showTitleScreen\(document, \{ words, css \}\)\);\n[^]*?import\('\.\/ui\/app\.js'\) \/\/ screens: home\n\s*\.then\(\(\{ startGame \}\) => startGame\(document, \{ title, words \}\)\)/);
  assert.equal(mainJs.match(/css\/title\.css/g).length, 1, 'the one link');
  for (const dir of ['', 'ui', 'platform', 'gfx']) {
    for (const f of readdirSync(join(ROOT, 'web', 'js', dir)).filter((n) => n.endsWith('.js'))) {
      const src = readFileSync(join(ROOT, 'web', 'js', dir, f), 'utf8');
      assert.ok(!/^import [^;]*from '\.{1,2}\/(?:ui\/)?app\.js'/m.test(src), `${dir}/${f} imports app.js statically`);
      assert.ok(!/^import [^;]*from '\.{1,2}\/(?:ui\/)?title\.js'/m.test(src), `${dir}/${f} imports title.js statically`);
    }
  }
  // Main's data carries no plans or stops for the game to find.
  const rules = JSON.parse(readOut('main', 'data/rules.json'));
  assert.deepEqual([rules.plans, rules.stops], [{}, {}]);
});

test('the #home dev route (S7, debug mode only): the cabin at an hour, a sky and a moon, each optional, in a session kept in memory with Robin signed', async (t) => {
  assert.deepEqual(devRoute({ hash: '#home', debug: true, trail: true }), { home: { hour: null, sky: null, moon: null } });
  assert.deepEqual(devRoute({ hash: '#home&hour=night&sky=rain&moon=4', debug: true, trail: true }), { home: { hour: 'night', sky: 'rain', moon: 4 } });
  assert.deepEqual(devRoute({ hash: '#home&hour=dawn&sky=fog', debug: true, trail: true }), { home: { hour: 'dawn', sky: 'fog', moon: null } });
  assert.deepEqual(devRoute({ hash: '#home&hour=noon&sky=snow&moon=8', debug: true, trail: true }), { home: { hour: null, sky: null, moon: null } }, 'unknown values are left to the clock');
  assert.equal(devRoute({ hash: '#home&hour=night', debug: false, trail: true }), null, 'debug mode only');
  assert.equal(devRoute({ hash: '#home', debug: true, trail: false }), null, 'never on main');
  const s = devHomeSession(loadNow());
  assert.equal(s.state.hiker.name, 'Robin');
  assert.equal(screenOf(s.state, loadNow()).phase, 'home');
  // Through the game: the cabin at the route's hour, the phone's saves untouched.
  const ls = device(t, fakeStorage());
  const ss = sessionStore(t);
  const page = shell({ screens: 'app debug guestbook home title trail' });
  page.doc.defaultView = { location: { hash: '#home&hour=night&sky=clear&moon=4', search: '?debug=1', pathname: '/' }, addEventListener() {}, removeEventListener() {}, history: { replaceState() {} } };
  const game = await startGame(page.doc, { fetchFn: fetchArt, now: clock(), later: () => () => {} });
  assert.equal(page.doc.getElementById('app').getAttribute('data-screen'), 'home');
  assert.deepEqual(game.cabin().scene(), { ...game.cabin().scene(), hour: 'night', evening: true, sky: 'clear', fog: false, moon: 4 });
  assert.deepEqual([...ls.map.keys()].filter((k) => /device|hiker|trip|labels/.test(k)), [], 'the dev route never touches the saves');
  assert.equal(ss.map.size, 0, 'nor marks the session: it plays in memory');
});

test('the first-launch dev routes (S7, debug mode only): #first the shut lockbox, #lockbox&q= a question, #lockbox&ask= a question asked first, #lockbox&open= its closing, #guestbook the guest book; each in memory', async (t) => {
  assert.deepEqual(devRoute({ hash: '#first', debug: true, trail: true }), { first: true });
  assert.deepEqual(devRoute({ hash: '#guestbook', debug: true, trail: true }), { guestbook: true });
  assert.deepEqual(devRoute({ hash: '#lockbox&q=2', debug: true, trail: true }), { lockbox: { q: 2 } });
  assert.deepEqual(devRoute({ hash: '#lockbox&open=3', debug: true, trail: true }), { lockbox: { open: 3 } });
  assert.deepEqual(devRoute({ hash: '#lockbox&open=0', debug: true, trail: true }), { lockbox: { open: 0 } });
  assert.deepEqual(devRoute({ hash: '#lockbox&ask=q_hoh', debug: true, trail: true }), { lockbox: { ask: 'q_hoh' } });
  for (const hash of ['#lockbox&q=0', '#lockbox&q=4', '#lockbox&open=2', '#lockbox', '#lockbox&ask=', '#lockbox&ask=Q-1']) assert.equal(devRoute({ hash, debug: true, trail: true }), null, hash);
  assert.equal(devRoute({ hash: '#first', debug: false, trail: true }), null, 'debug mode only');
  assert.equal(devRoute({ hash: '#guestbook', debug: true, trail: false }), null, 'never on main');
  const content = loadNow();
  const at = (route) => screenOf(devStart(content, route).state, content);
  assert.deepEqual([at({ first: true }).phase, at({ first: true }).step], ['lockbox', 'shut']);
  for (const q of [1, 2, 3]) assert.equal(at({ lockbox: { q } }).q, q, `#lockbox&q=${q}`);
  assert.equal(at({ lockbox: { q: 2 } }).box[0].id, 'first.lockbox.right', 'question 2 after a right answer');
  assert.equal(at({ lockbox: { q: 3 } }).box[0].id, 'first.lockbox.wrong', 'question 3 after a wrong one');
  assert.deepEqual(at({ lockbox: { open: 3 } }).box.map((r) => r.id), ['first.lockbox.all_right']);
  assert.deepEqual(at({ lockbox: { open: 0 } }).box.map((r) => r.id), ['first.lockbox.wrong', 'first.lockbox.come_in']);
  assert.equal(at({ guestbook: true }).phase, 'guestbook');
  // #lockbox&ask=: every question of the pool is asked first on some seed of the dev's fixed list (the
  // batch's pictures show each), through the real deal; a question the pool lacks opens nothing.
  for (const q of content.quiz().questions) {
    const s = devStart(content, { lockbox: { ask: q.id } });
    assert.ok(s, q.id);
    assert.equal(s.state.device.quiz.dealt[0], q.id);
    const sc = screenOf(s.state, content);
    assert.deepEqual([sc.step, sc.q, sc.box.at(-1).id], ['ask', 1, `first.lockbox.${q.id}.ask`], q.id);
  }
  assert.equal(devStart(content, { lockbox: { ask: 'q_nowhere' } }), null);
  // Through the game: a question on the porch, the phone's saves untouched.
  const ls = device(t, fakeStorage());
  const ss = sessionStore(t);
  const page = shell({ screens: 'app debug guestbook home lockbox title trail' });
  page.doc.defaultView = { location: { hash: '#lockbox&q=2', search: '?debug=1', pathname: '/' }, addEventListener() {}, removeEventListener() {}, history: { replaceState() {} } };
  await startGame(page.doc, { fetchFn: fetchArt, now: clock(), later: () => () => {} });
  assert.equal(page.doc.getElementById('app').getAttribute('data-screen'), 'lockbox');
  assert.equal(page.doc.querySelectorAll('.porch .game-choices .choice').length, 3);
  assert.deepEqual([...ls.map.keys()].filter((k) => /device|hiker|trip|labels/.test(k)), [], 'the dev route never touches the saves');
  assert.equal(ss.map.size, 0, 'nor marks the session: it plays in memory');
});

test('first launch through the game (S7 D6): the cabin draws in with Open the lockbox and no rail; three questions on the porch; wrong answers still open it; Take the key; the guest book on the porch; the cabin with its labels', async (t) => {
  const ls = device(t, fakeStorage());
  const sound = { played: [], play(c) { this.played.push(c); }, isOn: () => true, setOn() {}, report: () => null };
  const { doc, game, now } = await start({ fetchFn: fetchArt, sound, seed: () => 'K7QM2Q9F' });
  const app = doc.getElementById('app');
  assert.equal(app.getAttribute('data-screen'), 'lockbox');
  const host = doc.querySelector('.game-screen');
  assert.ok(host.classList.contains('cabin') && host.hasAttribute('data-first'), 'the shut lockbox is the cabin, in its first-launch state');
  assert.equal(doc.querySelector('.cabin-rail'), null, 'no rail');
  assert.equal(doc.querySelectorAll('.cabin-label').length, 0, 'no labels');
  assert.deepEqual(doc.querySelectorAll('.cabin-place').map((b) => b.getAttribute('data-place')), ['lockbox'], "only the lockbox's hit area");
  assert.equal(doc.querySelector('.cabin-place').getAttribute('aria-label'), 'Open the lockbox');
  // The lockbox's own hit area opens it too.
  now.pass();
  doc.querySelector('.cabin-place').click();
  assert.equal(game.screen().step, 'ask');
  assert.ok(doc.querySelector('.game-screen').classList.contains('porch'), 'the questions are on the porch');
  assert.equal(sound.played.slice(-1)[0], 'ui.next');
  const quiz = loadNow().quiz();
  for (let q = 1; q <= 3; q++) {
    assert.deepEqual(boxIds(doc).slice(-2)[0], 'first.lockbox.count');
    const id = game.session().state.device.quiz.dealt[q - 1];
    const wrong = (quiz.questions.find((x) => x.id === id).right + 1) % 3;
    now.pass();
    doc.querySelectorAll('.game-choices .choice').find((b) => b.getAttribute('data-answer') === String(wrong)).click();
    assert.equal(sound.played.slice(-1)[0], 'ui.tick');
  }
  assert.deepEqual(boxIds(doc), ['first.lockbox.wrong', 'first.lockbox.come_in'], 'Nice try, tourist., and the box opens anyway');
  tap(doc, '.game-choices .choice', now);
  assert.equal(sound.played.slice(-1)[0], 'ui.next');
  assert.equal(app.getAttribute('data-screen'), 'guestbook');
  assert.ok(doc.querySelector('.game-screen').classList.contains('porch'), 'the guest book lies on the porch table');
  assert.match(String(doc.querySelector('.game-screen').getAttribute('data-key')), /\.first$/, "first launch's guest book: the lit lockbox beside the open book");
  assert.equal(doc.querySelector('#gb-label').getAttribute('data-t'), 'first.guestbook.label');
  assert.ok(doc.querySelector('#gb-suggest'), 'Suggest');
  tap(doc, '#gb-suggest', now);
  const suggested = doc.getElementById('gb-name').value;
  assert.ok(suggested.length > 0 && !doc.querySelector('#gb-sign').disabled, 'Suggest fills in a name');
  tap(doc, '#gb-sign', now);
  assert.equal(app.getAttribute('data-screen'), 'home');
  assert.equal(game.session().state.hiker.name, suggested);
  assert.ok(doc.querySelectorAll('.cabin-label').length > 0, 'the porch, with labels on');
  assert.ok(doc.querySelector('.cabin-rail'), 'and the rail');
  assert.deepEqual([...ls.map.keys()].sort(), ['oph.preview.device', 'oph.preview.hiker'], 'the device and the hiker');
});

test('closing the app mid-quiz reopens on the same question with the same deal; the lockbox never comes back once open (a reload, a death)', async (t) => {
  const ls = device(t, fakeStorage());
  const first = await start({ fetchFn: fetchArt, seed: () => 'K7QM2Q9F' });
  tap(first.doc, '.next-step', first.now);
  tap(first.doc, '.game-choices .choice', first.now);
  const asked = first.game.screen();
  assert.equal(asked.q, 2);
  // Closed and reopened on the same phone.
  const again = await start({ fetchFn: fetchArt, seed: () => '0000000A' });
  assert.deepEqual(again.game.screen(), asked, 'the same question, the same deal');
  assert.deepEqual(again.game.session().state.device.quiz.dealt, first.game.session().state.device.quiz.dealt);
  for (let k = 0; k < 2; k++) tap(again.doc, '.game-choices .choice', again.now);
  tap(again.doc, '.game-choices .choice', again.now);
  assert.equal(again.game.screen().phase, 'guestbook');
  const reloaded = await start({ fetchFn: fetchArt });
  assert.equal(reloaded.game.screen().phase, 'guestbook', 'a reload: the guest book, never the lockbox');
  sign(reloaded.doc, reloaded.now);
  // A death wipes the hiker, never the device's lockbox.
  ls.setItem('oph.preview.hiker', 'null');
  const after = await start({ fetchFn: fetchArt });
  assert.equal(after.game.screen().phase, 'guestbook');
});
