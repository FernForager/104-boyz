// Copy bug report (GAME_DESIGN E.11; BUILD_PLAN 2.8): the report holds only
// game state and device facts, is built without waiting, stays under 60,000
// characters, and the copy falls back to selected text and the share sheet.
// Also the debug menu's entry (five taps, ?debug=1), the errors ring, and
// the clipboard and share helpers. Report 2 (BUILD_PLAN S3): the commit, the
// rules hash, the replay self-check's result and the game state, named by
// nobody.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport, reportText, copyReport, makeTapCounter, debugRequested, MAX_REPORT, checkField, stateField, checkLine, HIKER_TOKEN, REPORT_VERSION, openDebug, provideState } from '../../web/js/ui/debug.js';
import { setBundle } from '../../web/js/text.js';
import { setChannel } from '../../web/js/platform/storage.js';
import { fakeDocument } from './textfix.mjs';
import { compareGroups, runCheck, checkResult, onCheck, resetCheck, CHECK_GROUPS } from '../../web/js/ui/selfcheck.js';
import { GROUPS } from '../../web/js/engine/selfcheck.js';
import { readFileSync as readFile } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { selfcheckCorpus } from '../../tools/goldens.mjs';
import { describeError, noteError, recentErrors, clearErrors, sitePath } from '../../web/js/ui/errors.js';
import { copyText, shareText, selectAll } from '../../web/js/platform/share.js';
import { updateReady, workerStatus } from '../../web/js/platform/sw-client.js';

const BASE = 'https://ophiker.com/';

/** Facts as collectFacts() gathers them, with things the report must never carry mixed in. */
/** A self-check that matched. */
const MATCH = { ran: true, match: true, ms: 41, groups: Object.fromEntries(CHECK_GROUPS.map((g) => [g, true])), failed: [] };
/** The state reportState gives for a trip on its second stop, with the name planted where it must never go. */
const STATE = {
  phase: 'trailhead',
  hiker: { id: 'hK7QM2Q9F', name: 'Robin', chars: 5, trips: 0, profile: { secret: 'Robin' } },
  trip: {
    seed: 'K7QM2Q9F',
    plan: 'sample',
    stop: 2,
    log: 'T1ABDDk3OGM3Mzc2MjgxNwAACEs3UU0yUTlGBnNhbXBsZQxjMTY5NTg1MWE2ODIAAAEB',
    profile: { body_lb: 165, fitness: 'regular', regions: {}, seen: {}, skills: { footing: 1 } },
    base: null,
    hash: 'f'.repeat(64),
    last: ['next'],
    snapshot: { n: 2, seed: 'K7QM2Q9F', clock: { day: 1, s: 30600 } },
    name: 'Robin',
  },
  name: 'Robin',
};

const facts = (over = {}) => ({
  build: '20261010-abc1234',
  commit: '44d5bafe1d459886b4ad104615257ecde0d0af9c',
  rules: '978c73762817',
  channel: 'main',
  time: '2026-10-10T17:03:11.000Z',
  screen: 'title',
  device: { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X)', screen: [402, 874], viewport: [402, 874], dpr: 3, standalone: true, orientation: 'portrait', reducedMotion: false, language: 'en-US', timeZone: 'America/Los_Angeles' },
  worker: { worker: 'active', build: '20261010-abc1234', update: false, offline: true, scope: 'https://ophiker.com/' },
  storage: { persisted: true, usage: 123456, quota: 987654321, values: { device: '{"name":"Someone"}' } },
  keys: ['device', 'marks'],
  selfcheck: MATCH,
  errors: [describeError(new Error('boom'), { base: BASE, ms: 5321 })],
  note: 'the stars froze',
  state: STATE,
  url: 'https://ophiker.com/?debug=1#x',
  referrer: 'https://example.com/',
  ...over,
});

test('the report is built at once, field by field, with nothing personal', () => {
  const r = buildReport(facts());
  assert.ok(!(r instanceof Promise) && typeof r.then !== 'function', 'synchronous: built inside the tap');
  assert.deepEqual(Object.keys(r), ['report', 'build', 'commit', 'rules', 'channel', 'time', 'screen', 'device', 'app', 'selfcheck', 'errors', 'note', 'state']);
  assert.deepEqual(Object.keys(r.device), ['ua', 'screen', 'viewport', 'dpr', 'standalone', 'orientation', 'reducedMotion']);
  assert.deepEqual(Object.keys(r.app), ['worker', 'workerBuild', 'update', 'offline', 'persisted', 'storage', 'keys']);
  assert.deepEqual(Object.keys(r.app.storage), ['usage', 'quota']);
  for (const e of r.errors) assert.deepEqual(Object.keys(e), ['message', 'stack', 'source', 'line', 'col', 'ms']);
  assert.equal(r.report, 2);
  assert.equal(REPORT_VERSION, 2);
  assert.equal(r.commit, '44d5bafe1d459886b4ad104615257ecde0d0af9c');
  assert.equal(r.rules, '978c73762817');
  assert.deepEqual(Object.keys(r.selfcheck), ['ran', 'match', 'ms', 'groups', 'failed']);
  assert.deepEqual(Object.keys(r.state), ['phase', 'hiker', 'trip']);
  assert.deepEqual(Object.keys(r.state.hiker), ['id', 'name', 'chars', 'trips']);
  assert.deepEqual(Object.keys(r.state.trip), ['seed', 'plan', 'stop', 'log', 'profile', 'base', 'hash', 'last', 'snapshot']);
  assert.deepEqual(r.app.keys, ['device', 'marks'], 'key names');
  assert.deepEqual(r.device.screen, [402, 874]);
  assert.equal(r.app.persisted, true);
  const text = JSON.stringify(r);
  for (const never of ['Someone', 'Robin', 'secret', 'en-US', 'America/Los_Angeles', 'debug=1', 'example.com', 'values', 'language', 'timeZone', 'referrer', 'scope']) {
    assert.ok(!text.includes(never), `the report never carries ${never}`);
  }
  const bare = buildReport({});
  assert.deepEqual(Object.keys(bare), Object.keys(r), 'missing facts keep the same shape');
  assert.deepEqual(bare.app.storage, { usage: null, quota: null });
  assert.equal(bare.app.persisted, null);
  assert.deepEqual([bare.commit, bare.rules, bare.state], [null, null, null]);
  assert.deepEqual(bare.selfcheck, { ran: false });
  const dev = buildReport(facts({ commit: 'dev', rules: 'dev', build: 'dev' }));
  assert.deepEqual([dev.build, dev.commit, dev.rules], ['dev', null, null], "an unbuilt shell's dev stamps are no commit and no rules");
});

test('the state never holds the typed name: {HIKER} and its length stand in (SPEC call 3)', () => {
  const r = buildReport(facts());
  assert.equal(r.state.hiker.name, HIKER_TOKEN);
  assert.equal(HIKER_TOKEN, '{HIKER}');
  assert.equal(r.state.hiker.chars, 5);
  const text = reportText(r);
  assert.ok(!text.includes('Robin'), 'planted in the hiker, the trip and the state: absent');
  assert.ok(text.includes('"name": "{HIKER}"'));
  assert.equal(r.state.trip.log, STATE.trip.log, 'the log rides whole');
  assert.deepEqual(r.state.trip.profile, STATE.trip.profile);
  assert.equal(stateField(null), null);
  assert.equal(stateField({ phase: 'guestbook', hiker: null, trip: null }).hiker, null);
  const long = stateField({ ...STATE, trip: { ...STATE.trip, last: Array.from({ length: 50 }, (_, i) => `wait ${i}`) } });
  assert.equal(long.trip.last.length, 20, 'the last 20 actions, for a human');
  assert.equal(long.trip.last[19], 'wait 49');
});

test('the self-check rides in the report, field by field', () => {
  assert.deepEqual(buildReport(facts()).selfcheck, MATCH);
  const differs = { ran: true, match: false, ms: 50, groups: { ...MATCH.groups, math: false }, failed: [{ group: 'math', got: 'a'.repeat(64), want: 'b'.repeat(64), extra: 'x' }], extra: 1 };
  assert.deepEqual(checkField(differs), { ran: true, match: false, ms: 50, groups: { ...MATCH.groups, math: false }, failed: [{ group: 'math', got: 'a'.repeat(12), want: 'b'.repeat(12) }] });
  assert.deepEqual(checkField({ ran: true, match: null, error: 'e'.repeat(1000) }), { ran: true, match: null, error: 'e'.repeat(300) });
  assert.deepEqual(checkField({ ran: false }), { ran: false });
  assert.deepEqual(checkField(undefined), { ran: false });
  assert.deepEqual(checkLine({ ran: false }), ['running', 'dev.check.running']);
  assert.deepEqual(checkLine(MATCH), ['match', 'dev.check.match']);
  assert.deepEqual(checkLine(differs), ['differs', 'dev.check.differs']);
  assert.deepEqual(checkLine({ ran: true, match: null, error: 'x' }), ['error', 'dev.check.differs']);
});

test("the self-check's groups are the engine runner's, compared one by one with Node's", () => {
  assert.deepEqual(CHECK_GROUPS, GROUPS, 'the UI lists the groups the engine hashes');
  const want = Object.fromEntries(CHECK_GROUPS.map((g, i) => [g, String(i).repeat(64)]));
  assert.deepEqual(compareGroups(want, want, 41.6), { ...MATCH, ms: 42 });
  const got = { ...want, rng: 'f'.repeat(64) };
  const r = compareGroups(got, want, 10);
  assert.equal(r.match, false);
  assert.equal(r.groups.rng, false);
  assert.deepEqual(r.failed, [{ group: 'rng', got: 'f'.repeat(12), want: '1'.repeat(12) }]);
  assert.equal(compareGroups({}, {}, 1).match, false, 'an empty run never matches');
});

test("the self-check, run as the phone runs it, matches Node's numbers from the same build; a failure to run is its error", async () => {
  resetCheck();
  const corpus = selfcheckCorpus();
  const seen = [];
  onCheck((r) => seen.push(r));
  assert.deepEqual(checkResult(), { ran: false });
  let t = 0;
  const run = runCheck({ fetchFn: async () => ({ ok: true, status: 200, json: async () => corpus }), now: () => (t += 25) });
  assert.equal(runCheck(), run, 'one run, however often it is asked for');
  const r = await run;
  assert.equal(r.match, true, JSON.stringify(r.failed));
  assert.equal(r.ms, 25, 'timed by the UI, never by the engine');
  assert.deepEqual(checkResult(), r);
  assert.deepEqual(seen, [r], 'listeners hear the result');
  resetCheck();
  const tampered = { ...corpus, expect: { ...corpus.expect, trips: '0'.repeat(64) } };
  const bad = await runCheck({ fetchFn: async () => ({ ok: true, status: 200, json: async () => tampered }) });
  assert.equal(bad.match, false);
  assert.deepEqual(bad.failed.map((f) => f.group), ['trips']);
  resetCheck();
  const gone = await runCheck({ fetchFn: async () => ({ ok: false, status: 404 }) });
  assert.deepEqual(gone, { ran: true, match: null, error: 'selfcheck: selfcheck.json 404' });
  resetCheck();
  const offline = await runCheck({ fetchFn: async () => { throw new TypeError('Failed to fetch https://ophiker.com/selfcheck.json?x=1'); } });
  assert.equal(offline.match, null);
  assert.ok(!/ophiker\.com|\?x/.test(offline.error), `the error is scrubbed to site paths: ${offline.error}`);
  resetCheck();
  assert.ok(readFile(join(ROOT, 'web', 'js', 'ui', 'selfcheck.js'), 'utf8').includes("import('../engine/selfcheck.js')"), 'the engine loads only when the check runs');
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

test("a long report drops the trip's snapshot first, and never cuts the log, the profile or the base", () => {
  const big = { ...STATE, trip: { ...STATE.trip, snapshot: { pad: 'x'.repeat(70000) } } };
  const f = facts({ state: big });
  const text = reportText(buildReport(f));
  assert.ok(text.length <= MAX_REPORT, `${text.length} characters`);
  const r = JSON.parse(text.slice(8, -4));
  assert.equal(r.state.trip.snapshot, null, 'a replay rebuilds it');
  assert.equal(r.state.trip.log, STATE.trip.log);
  assert.deepEqual(r.state.trip.profile, STATE.trip.profile);
  assert.equal(r.errors[0].stack, buildReport(f).errors[0].stack, 'nothing else was cut');
  const small = JSON.parse(reportText(buildReport(facts())).slice(8, -4));
  assert.deepEqual(small.state.trip.snapshot, STATE.trip.snapshot, 'a short report keeps it');
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

test('the debug menu shows the self-check line above the report, starts the check if it has not run, and redraws when it ends', async (t) => {
  t.after(() => {
    setChannel(null);
    setBundle({}, {}, null);
    provideState(null);
    resetCheck();
  });
  resetCheck();
  setChannel('preview');
  const dev = JSON.parse(readFile(join(ROOT, 'content', 'text', 'en', 'dev.json'), 'utf8'));
  setBundle(Object.fromEntries(Object.entries(dev).filter(([k]) => k !== '$comment').map(([k, v]) => [k, v.text])), {}, 'preview');
  const doc = fakeDocument();
  doc.documentElement.setAttribute('data-channel', 'preview');
  let release = () => {};
  const corpus = selfcheckCorpus();
  const gate = new Promise((r) => {
    release = r;
  });
  const run = runCheck({ fetchFn: () => gate.then(() => ({ ok: true, status: 200, json: async () => corpus })) });
  provideState(() => ({ phase: 'trailhead', hiker: { id: 'h00000001', name: 'Robin', chars: 5, trips: 0 }, trip: null }));
  await openDebug(doc);
  const sheet = doc.querySelector('.debug-sheet');
  const kids = sheet.children.map((c) => c.className);
  assert.ok(kids.indexOf('debug-check') >= 0 && kids.indexOf('debug-check') < kids.indexOf('report'), 'the line sits above the report');
  const line = doc.querySelector('.debug-check');
  assert.equal(line.getAttribute('data-check'), 'running');
  assert.equal(line.getAttribute('data-t'), 'dev.check.running');
  assert.equal(line.textContent, 'Self-check: running');
  assert.match(doc.querySelector('pre.report').textContent, /"ran": false/);
  assert.ok(!doc.querySelector('pre.report').textContent.includes('Robin'), "the menu's report names nobody");
  release();
  await run;
  assert.equal(line.getAttribute('data-check'), 'match', 'redrawn when the check ends');
  assert.equal(line.textContent, 'Self-check: match');
  assert.match(doc.querySelector('pre.report').textContent, /"match": true/);
});
