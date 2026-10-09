// Copy bug report (GAME_DESIGN E.11; BUILD_PLAN 2.8): the report holds only
// game state and device facts, is built without waiting, stays under 60,000
// characters, and the copy falls back to selected text and the share sheet.
// Also the debug menu's entry (five taps, ?debug=1), the errors ring, and
// the clipboard and share helpers.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport, reportText, copyReport, makeTapCounter, debugRequested, MAX_REPORT } from '../../web/js/ui/debug.js';
import { describeError, noteError, recentErrors, clearErrors, sitePath } from '../../web/js/ui/errors.js';
import { copyText, shareText, selectAll } from '../../web/js/platform/share.js';
import { updateReady, workerStatus } from '../../web/js/platform/sw-client.js';

const BASE = 'https://ophiker.com/';

/** Facts as collectFacts() gathers them, with things the report must never carry mixed in. */
const facts = (over = {}) => ({
  build: '20261010-abc1234',
  channel: 'main',
  time: '2026-10-10T17:03:11.000Z',
  screen: 'title',
  device: { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X)', screen: [402, 874], viewport: [402, 874], dpr: 3, standalone: true, orientation: 'portrait', reducedMotion: false, language: 'en-US', timeZone: 'America/Los_Angeles' },
  worker: { worker: 'active', build: '20261010-abc1234', update: false, offline: true, scope: 'https://ophiker.com/' },
  storage: { persisted: true, usage: 123456, quota: 987654321, values: { device: '{"name":"Someone"}' } },
  keys: ['device', 'marks'],
  errors: [describeError(new Error('boom'), { base: BASE, ms: 5321 })],
  note: 'the stars froze',
  url: 'https://ophiker.com/?debug=1#x',
  referrer: 'https://example.com/',
  ...over,
});

test('the report is built at once, field by field, with nothing personal', () => {
  const r = buildReport(facts());
  assert.ok(!(r instanceof Promise) && typeof r.then !== 'function', 'synchronous: built inside the tap');
  assert.deepEqual(Object.keys(r), ['report', 'build', 'channel', 'time', 'screen', 'device', 'app', 'errors', 'note', 'state']);
  assert.deepEqual(Object.keys(r.device), ['ua', 'screen', 'viewport', 'dpr', 'standalone', 'orientation', 'reducedMotion']);
  assert.deepEqual(Object.keys(r.app), ['worker', 'workerBuild', 'update', 'offline', 'persisted', 'storage', 'keys']);
  assert.deepEqual(Object.keys(r.app.storage), ['usage', 'quota']);
  for (const e of r.errors) assert.deepEqual(Object.keys(e), ['message', 'stack', 'source', 'line', 'col', 'ms']);
  assert.equal(r.report, 1);
  assert.equal(r.state, null, 'the trip state arrives with the engine (S3)');
  assert.deepEqual(r.app.keys, ['device', 'marks'], 'key names');
  assert.deepEqual(r.device.screen, [402, 874]);
  assert.equal(r.app.persisted, true);
  const text = JSON.stringify(r);
  for (const never of ['Someone', 'en-US', 'America/Los_Angeles', 'debug=1', 'example.com', 'values', 'language', 'timeZone', 'referrer', 'scope']) {
    assert.ok(!text.includes(never), `the report never carries ${never}`);
  }
  const bare = buildReport({});
  assert.deepEqual(Object.keys(bare), Object.keys(r), 'missing facts keep the same shape');
  assert.deepEqual(bare.app.storage, { usage: null, quota: null });
  assert.equal(bare.app.persisted, null);
});

test("an error's source and every URL in it are paths inside the site, with no origin or query", () => {
  const err = new Error('failed to fetch https://ophiker.com/art/art.json?v=2#top');
  err.stack = 'showTitle@https://ophiker.com/js/ui/home.js:12:3\nmodule code@https://ophiker.com/js/main.js?x=1:16:4\nsafari-web-extension://ABC-123/content.js:1:1';
  const e = describeError(err, { base: BASE, ms: 42 });
  assert.equal(e.source, 'js/ui/home.js');
  assert.equal(e.line, 12);
  assert.equal(e.col, 3);
  assert.equal(e.ms, 42);
  assert.equal(e.message, 'failed to fetch art/art.json');
  assert.equal(e.stack, 'showTitle@js/ui/home.js:12:3\nmodule code@js/main.js:16:4\nsafari-web-extension::1:1');
  assert.ok(!/ophiker\.com|\?|ABC-123/.test(JSON.stringify(e)));
  const fromEvent = describeError('Script error.', { base: BASE, filename: 'https://ophiker.com/js/ui/home.js?y#z', lineno: 7, colno: 9, ms: 1 });
  assert.deepEqual([fromEvent.source, fromEvent.line, fromEvent.col], ['js/ui/home.js', 7, 9]);
  assert.equal(sitePath('https://ophiker.com/preview/js/x.js?q', 'https://ophiker.com/preview/'), 'js/x.js');
  assert.equal(sitePath('https://elsewhere.example/x.js', BASE), 'https:');
});

test('describeError takes an Error, a string, undefined and odd things; the ring keeps the newest 10', () => {
  const huge = new Error('m'.repeat(100000));
  huge.stack = 'a.'.repeat(500000);
  const started = performance.now();
  const kept = describeError(huge, { base: BASE, ms: 0 });
  assert.ok(performance.now() - started < 1000, 'a 1 MB stack is read quickly');
  assert.ok(kept.stack.length <= 20000 && kept.message.length <= 20000, 'and kept short');
  assert.equal(describeError(new TypeError('bad'), { base: BASE, ms: 0 }).message, 'TypeError: bad');
  assert.equal(describeError(new Error('plain'), { base: BASE, ms: 0 }).message, 'plain');
  const s = describeError('just a string', { base: BASE, ms: 0 });
  assert.deepEqual(s, { message: 'just a string', stack: '', source: null, line: null, col: null, ms: 0 });
  assert.equal(describeError(undefined, { ms: 0 }).message, 'undefined');
  assert.equal(describeError(null, { ms: 0 }).message, 'null');
  assert.equal(describeError({ message: 'thrown object' }, { ms: 0 }).message, 'thrown object');
  assert.equal(typeof describeError(new Error('x')).ms, 'number', 'ms since launch');
  clearErrors();
  for (let i = 0; i < 13; i++) noteError(new Error(`e${i}`));
  const ring = recentErrors();
  assert.equal(ring.length, 10);
  assert.deepEqual(ring.map((e) => e.message), ['e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9', 'e10', 'e11', 'e12'], 'newest last');
  ring.pop();
  assert.equal(recentErrors().length, 10, 'a copy, not the ring');
  clearErrors();
});

test('reportText is fenced for a GitHub issue, and stays under 60,000 characters', () => {
  const report = buildReport(facts());
  const small = reportText(report);
  assert.ok(small.startsWith('```json\n') && small.endsWith('\n```'));
  assert.deepEqual(JSON.parse(small.slice(8, -4)), report, 'the JSON inside is the report, untouched when small');
  const errors = Array.from({ length: 50 }, (_, i) => ({ message: `e${i}`, stack: 'x'.repeat(1024 * 1024), source: 'js/main.js', line: 1, col: 1, ms: i }));
  const text = reportText(buildReport(facts({ errors, note: 'n'.repeat(10 * 1024) })));
  assert.ok(text.length <= MAX_REPORT, `${text.length} characters`);
  assert.equal(MAX_REPORT, 60000);
  const r = JSON.parse(text.slice(8, -4));
  assert.ok(r.errors.length >= 1 && r.errors.length <= 5, 'the newest errors stay');
  assert.equal(r.errors[r.errors.length - 1].message, 'e49', 'the newest is kept');
  for (const e of r.errors) assert.ok(e.stack.length <= 2000);
  assert.ok(r.note.length <= 1000, 'the note field holds 1,000 at most');
  // Even pathological escapes fit.
  const nasty = Array.from({ length: 10 }, () => ({ message: '\u0001'.repeat(5000), stack: '\u0001'.repeat(5000), source: null, line: null, col: null, ms: 0 }));
  assert.ok(reportText(buildReport(facts({ errors: nasty, device: { ua: '\u0001'.repeat(20000) } }))).length <= MAX_REPORT);
});

test('five quick taps open the menu; a pause over 700 ms starts over; so does a sixth tap', () => {
  const tap = makeTapCounter(5, 700);
  assert.deepEqual([0, 100, 200, 300, 400].map(tap), [false, false, false, false, true]);
  assert.equal(tap(500), false, 'a sixth tap starts over');
  const slow = makeTapCounter(5, 700);
  assert.deepEqual([0, 600, 1200, 2000, 2100, 2200, 2300].map(slow), [false, false, false, false, false, false, false], 'the 800 ms gap reset the count');
  assert.equal(slow(2400), true, 'five quick ones after the reset');
  const edge = makeTapCounter();
  assert.deepEqual([0, 700, 1400, 2100, 2800].map(edge), [false, false, false, false, true], 'exactly 700 ms apart still counts');
});

test('?debug=1 asks for the menu; nothing else does', () => {
  assert.equal(debugRequested('?debug=1'), true);
  assert.equal(debugRequested('?x=2&debug=1'), true);
  assert.equal(debugRequested('?debug=0'), false);
  assert.equal(debugRequested('?debug'), false);
  assert.equal(debugRequested(''), false);
  assert.equal(debugRequested(undefined), false);
});

/** Just enough of an element for the copy flow. */
function fakeEl() {
  const classes = new Set();
  return {
    dataset: {},
    hidden: true,
    value: '',
    focused: 0,
    selected: null,
    classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), contains: (c) => classes.has(c) },
    focus() {
      this.focused++;
    },
    setSelectionRange(a, b) {
      this.selected = [a, b];
    },
  };
}

test('Copy bug report: a copy shows the ✓ for 2 s; a refusal shows the report selected, then the share sheet', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const f = facts();
  const want = reportText(buildReport(f));

  // The clipboard takes it.
  const button = fakeEl();
  const area = fakeEl();
  const written = [];
  const ok = { clipboard: { writeText: (s) => (written.push(s), Promise.resolve()) } };
  assert.equal(await copyReport(button, area, { nav: ok, facts: f }), 'copied');
  assert.deepEqual(written, [want]);
  assert.ok(button.classList.contains('done'), 'the ✓ shows');
  t.mock.timers.tick(2000);
  assert.ok(!button.classList.contains('done'), 'for two seconds');
  assert.equal(area.hidden, true);

  // The clipboard refuses: the report appears, selected, and the button turns to share.
  const b2 = fakeEl();
  const a2 = fakeEl();
  const shared = [];
  const refuses = { clipboard: { writeText: () => Promise.reject(new Error('NotAllowedError')) }, share: (o) => (shared.push(o), Promise.resolve()) };
  assert.equal(await copyReport(b2, a2, { nav: refuses, facts: f }), 'fallback');
  assert.equal(a2.hidden, false);
  assert.equal(a2.value, want);
  assert.deepEqual(a2.selected, [0, want.length]);
  assert.equal(b2.dataset.mode, 'share');
  assert.ok(!b2.classList.contains('done'));
  // The same button's next tap opens the share sheet.
  assert.equal(await copyReport(b2, a2, { nav: refuses, facts: f }), 'shared');
  assert.deepEqual(shared, [{ text: want }]);
  // Closing the sheet is fine; a share that fails selects the text again.
  const abort = Object.assign(new Error('closed'), { name: 'AbortError' });
  a2.selected = null;
  assert.equal(await copyReport(b2, a2, { nav: { share: () => Promise.reject(abort) }, facts: f }), 'closed');
  assert.equal(a2.selected, null);
  assert.equal(await copyReport(b2, a2, { nav: {}, facts: f }), 'selected', 'no share sheet at all');
  assert.deepEqual(a2.selected, [0, want.length]);
});

test('copyText and shareText start inside the tap, and reject without a clipboard or a sheet', async () => {
  const calls = [];
  const nav = { clipboard: { writeText: (s) => (calls.push(['write', s]), Promise.resolve()) }, share: (o) => (calls.push(['share', o.text]), Promise.resolve()) };
  const p1 = copyText('a', nav);
  const p2 = shareText('b', nav);
  assert.deepEqual(calls, [['write', 'a'], ['share', 'b']], 'called before any await');
  await Promise.all([p1, p2]);
  await assert.rejects(copyText('x', {}), /no clipboard/);
  await assert.rejects(copyText('x', undefined), /no clipboard/);
  await assert.rejects(shareText('x', {}), /no share sheet/);
  await assert.rejects(copyText('x', { clipboard: { writeText: () => { throw new Error('sync'); } } }), /sync/);
  const area = fakeEl();
  area.value = 'abc';
  selectAll(area);
  assert.equal(area.focused, 1);
  assert.deepEqual(area.selected, [0, 3]);
  selectAll(null); // nothing to select: no throw
});

test('the update note waits for a worker while another runs the page', () => {
  assert.equal(updateReady({ controller: {}, waiting: {} }), true);
  assert.equal(updateReady({ controller: null, waiting: {} }), false, 'a first visit: nothing is new');
  assert.equal(updateReady({ controller: {}, waiting: null }), false);
  assert.deepEqual(Object.keys(workerStatus()), ['worker', 'build', 'update', 'offline']);
});
