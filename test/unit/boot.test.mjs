// The boot guard (GAME_DESIGN E.11): when one of main.js's imports fails to
// load, parse or link, nothing of main.js runs, and boot.js alone opens the
// error sheet, copies a short report with nothing personal in it, and
// restarts into the newest build. Once errors.js takes over it gets what
// boot.js kept, and both Restarts let a waiting build take over (a reload
// alone would keep the broken one).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guard, handOver, shortReport, restart } from '../../web/js/boot.js';
import { installErrors, recentErrors, clearErrors } from '../../web/js/ui/errors.js';

/** boot.js's site root as Node sees it: the folder above web/js/. */
const SITE = new URL('../../web/', import.meta.url).href;
const BASE = 'https://ophiker.com/';

/** A button, the report's textarea and the sheet, as far as the guard and errors.js touch them. */
function el(id) {
  const listeners = [];
  const classes = new Set();
  return {
    id,
    hidden: true,
    value: '',
    dataset: {},
    focused: 0,
    classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), has: (c) => classes.has(c) },
    addEventListener: (type, fn) => listeners.push(fn),
    click: () => listeners.forEach((fn) => fn()),
    focus() {
      this.focused++;
    },
    setSelectionRange() {},
  };
}

/**
 * A window with the static error sheet, a clipboard that says yes or no, a
 * share sheet, and a worker registration (null: none; waiting: a new build).
 * @param {{clipboard?: boolean, reg?: any}} [o]
 */
function fakeWindow({ clipboard = true, reg = null } = {}) {
  const els = Object.fromEntries(['error-sheet', 'error-copy', 'error-report', 'error-restart'].map((id) => [id, el(id)]));
  const listeners = [];
  const swListeners = {};
  const calls = { copied: [], shared: [], reloads: 0, timers: [], updates: 0, posted: [] };
  const doc = {
    documentElement: { dataset: { build: '20261010-abc1234', channel: 'main' } },
    getElementById: (id) => els[id] || null,
  };
  const win = {
    document: doc,
    screen: { width: 402, height: 874 },
    innerWidth: 402,
    innerHeight: 874,
    devicePixelRatio: 3,
    location: {
      reload: () => calls.reloads++,
      href: 'https://ophiker.com/?debug=1#secret',
    },
    setTimeout: (fn, ms) => calls.timers.push({ fn, ms }),
    addEventListener: (type, fn, capture) => listeners.push({ type, fn, capture: Boolean(capture) }),
    navigator: {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X)',
      language: 'en-US',
      clipboard: { writeText: (t) => (clipboard ? (calls.copied.push(t), Promise.resolve()) : Promise.reject(new Error('no'))) },
      share: (data) => (calls.shared.push(data), Promise.resolve()),
      serviceWorker: {
        getRegistration: async () => reg,
        addEventListener: (type, fn) => (swListeners[type] = fn),
      },
    },
  };
  doc.defaultView = win;
  /** Dispatch an event to the window's listeners for that type. */
  const fire = (type, event) => listeners.filter((l) => l.type === type).forEach((l) => l.fn(event));
  return { win, els, calls, fire, listeners, swListeners };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

test('boot: listens in the capture phase, so a script that fails to load is seen', () => {
  const w = fakeWindow();
  guard(w.win);
  assert.deepEqual(
    w.listeners.map((l) => [l.type, l.capture]),
    [
      ['error', true],
      ['unhandledrejection', false],
    ],
  );
});

test('boot: a script error opens the sheet; an image that fails to load does not', async () => {
  const w = fakeWindow();
  guard(w.win);
  w.fire('error', { target: { tagName: 'IMG', src: `${BASE}icons/x.png` } });
  assert.equal(w.els['error-sheet'].hidden, true, "a picture's own business");
  w.fire('error', { target: { tagName: 'SCRIPT', src: `${SITE}js/ui/debug.js?v=2` } });
  assert.equal(w.els['error-sheet'].hidden, false, 'a module that did not load');
  assert.equal(w.els['error-copy'].focused, 1, 'focus goes to Copy bug report');
  const err = new SyntaxError(`Unexpected token at ${SITE}js/text.js?x=1`);
  w.fire('error', { target: w.win, error: err, filename: `${SITE}js/text.js`, lineno: 3, colno: 9 });
  w.fire('unhandledrejection', { reason: new TypeError('nope') });
  const kept = handOver();
  assert.equal(kept.length, 3);
  assert.match(String(kept[0].error.message), /^boot: js\/ui\/debug\.js did not load$/, 'the path inside the site, no query');
  assert.equal(kept[1].error, err);
  assert.equal(kept[1].lineno, 3);
  // Taken over: the guard steps aside.
  w.fire('error', { target: w.win, error: new Error('later') });
  assert.deepEqual(handOver(), []);
  await tick();
});

test("boot: the short report: the build, the channel, device facts and the errors, and nothing personal", () => {
  const err = new TypeError(`failed to fetch ${BASE}art/art.json?v=2#top`);
  err.stack = `load@${BASE}js/ui/home.js:12:3\nsafari-web-extension://ABC-123/content.js:1:1`;
  const r = shortReport(
    { build: '20261010-abc1234', channel: 'main', time: '2026-10-10T17:03:11.000Z', ua: 'Mozilla/5.0 (iPhone)', screen: [402, 874], viewport: [402, 874], dpr: 3, language: 'en-US', url: `${BASE}?debug=1` },
    [{ error: err, filename: `${BASE}js/ui/home.js?x=1`, lineno: 12, colno: 3, ms: 40 }],
    BASE,
  );
  assert.deepEqual(Object.keys(r), ['report', 'boot', 'build', 'channel', 'time', 'device', 'errors']);
  assert.deepEqual(Object.keys(r.device), ['ua', 'screen', 'viewport', 'dpr']);
  assert.equal(r.boot, true);
  assert.deepEqual(r.errors, [{ message: 'TypeError: failed to fetch art/art.json', stack: 'load@js/ui/home.js:12:3\nsafari-web-extension::1:1', source: 'js/ui/home.js', line: 12, col: 3, ms: 40 }]);
  const text = JSON.stringify(r);
  for (const never of ['ophiker.com', 'en-US', 'debug=1', 'ABC-123', 'v=2', '#top']) assert.ok(!text.includes(never), `never ${never}`);
  const many = Array.from({ length: 14 }, (_, k) => ({ error: k, ms: k }));
  assert.deepEqual(shortReport({}, many).errors.map((e) => e.message), ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13'], 'the newest 10');
});

test('boot: Copy bug report copies the short report; if the clipboard says no, it shows selected, then the share sheet', async () => {
  const w = fakeWindow();
  guard(w.win);
  w.fire('error', { target: w.win, error: new Error(`boom at ${SITE}js/main.js`) });
  w.els['error-copy'].click();
  await tick();
  assert.equal(w.calls.copied.length, 1);
  const r = JSON.parse(w.calls.copied[0].replace(/^```json\n|\n```$/g, ''));
  assert.equal(r.build, '20261010-abc1234');
  assert.equal(r.channel, 'main');
  assert.equal(r.errors[0].message, 'boom at js/main.js');
  assert.ok(w.els['error-copy'].classList.has('done'), 'the ✓');
  assert.ok(!w.calls.copied[0].includes('secret') && !w.calls.copied[0].includes('en-US'));

  const no = fakeWindow({ clipboard: false });
  guard(no.win);
  no.fire('error', { target: no.win, error: new Error('boom') });
  no.els['error-copy'].click();
  await tick();
  assert.equal(no.els['error-report'].hidden, false, 'the report shows, selected');
  assert.match(no.els['error-report'].value, /^```json\n/);
  no.els['error-copy'].click();
  await tick();
  assert.equal(no.calls.shared.length, 1, 'the next tap opens the share sheet');
  handOver();
});

test("boot: Restart lets a waiting build take over, and reloads once it does; with none waiting, a reload", async () => {
  const posted = [];
  const reg = { scope: SITE, waiting: { postMessage: (m) => posted.push(m) }, update: async () => {} };
  const w = fakeWindow({ reg });
  guard(w.win);
  w.fire('error', { target: w.win, error: new Error('boom') });
  w.els['error-restart'].click();
  await tick();
  assert.deepEqual(posted, [{ type: 'skip-waiting' }]);
  assert.equal(w.calls.reloads, 0, 'not yet');
  w.swListeners.controllerchange();
  assert.equal(w.calls.reloads, 1, 'reloaded into the new build');
  assert.ok(w.calls.timers.some((t) => t.ms === 3000), 'and reloads anyway if it never takes over');

  const plain = fakeWindow({ reg: { scope: SITE, waiting: null, update: async () => {} } });
  guard(plain.win);
  restart(plain.win);
  await tick();
  assert.equal(plain.calls.reloads, 1);

  const other = fakeWindow({ reg: { scope: 'https://ophiker.com/', waiting: { postMessage: () => assert.fail("never main's worker from preview") } } });
  guard(other.win);
  restart(other.win);
  await tick();
  assert.equal(other.calls.reloads, 1, "another scope's registration isn't ours");
  handOver();
});

test("errors.js takes over from boot: it keeps what boot kept, and its Restart lets a waiting build take over", async () => {
  clearErrors();
  const posted = [];
  const reg = { scope: SITE, waiting: { postMessage: (m) => posted.push(m) }, update: async () => {} };
  const w = fakeWindow({ reg });
  guard(w.win);
  w.fire('unhandledrejection', { reason: new Error(`early at ${SITE}js/text.js?q=1`) });
  installErrors(w.win.document);
  assert.deepEqual(
    recentErrors().map((e) => e.message),
    ['early at js/text.js'],
  );
  w.fire('error', { target: w.win, error: new Error('after') });
  assert.deepEqual(handOver(), [], 'boot keeps nothing once errors.js has taken over');
  // The sheet's Restart (wired by boot when it opened, and by errors.js): one skip-waiting, not a bare reload.
  w.els['error-restart'].click();
  await tick();
  assert.deepEqual(posted, [{ type: 'skip-waiting' }]);
  assert.equal(w.calls.reloads, 0);
  clearErrors();
});
