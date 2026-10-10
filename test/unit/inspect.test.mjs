// The line inspector (BUILD_PLAN 10.3, S5 SPEC 6.5; GAME_DESIGN 18.6):
// a long press on any words in debug mode on preview opens a card with the
// line's id and hash, state, length against max and batch, its ctx and
// words, and Copy for chat. Fake DOM (textfix.mjs), fake timers.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, posix } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { readText, bundle, metaFor, mainReach, shellSources } from '../../tools/text.mjs';
import { selfcheckCorpus } from '../../tools/goldens.mjs';
import { fakeDocument } from './textfix.mjs';
import { installInspector, lineAt, lineInfo, chatText, attrLine, PRESS_MS, MOVE_PX, SWALLOW_MS } from '../../web/js/ui/inspect.js';
import { openDebug, loadInspector } from '../../web/js/ui/debug.js';
import { runCheck, resetCheck } from '../../web/js/ui/selfcheck.js';
import { setBundle, tx, NBSP } from '../../web/js/text.js';
import { setChannel } from '../../web/js/platform/storage.js';

const TEXT = readText(ROOT);
const META = metaFor(TEXT);
const PREVIEW = bundle(TEXT, 'preview', [], ['place.deer_lake']);
const RIM = 'trail.deer_lake_rim.rim';
const RIM_WORDS = 'The ground falls away into a bowl of pale rock and heather. You count the lakes twice and get two answers.';

/** A preview page with the bundle loaded and a line on it. */
function page(channel = 'preview', screens = 'app debug guestbook map title trail') {
  setChannel(channel);
  setBundle(PREVIEW['en.json'], PREVIEW['marks.json'], channel);
  const doc = fakeDocument();
  doc.documentElement.setAttribute('data-channel', channel);
  doc.documentElement.setAttribute('data-screens', screens);
  const box = doc.createElement('div');
  box.className = 'box game-box';
  const p = doc.createElement('p');
  tx(p, RIM);
  box.appendChild(p);
  const choice = doc.createElement('button');
  choice.className = 'box choice';
  const label = doc.createElement('span');
  tx(label, 'trail.walk_on');
  choice.appendChild(label);
  const why = doc.createElement('button');
  why.setAttribute('aria-label', 'Why');
  why.setAttribute('data-t-aria', 'trail.choice.why');
  const plain = doc.createElement('div');
  for (const n of [box, choice, why, plain]) doc.body.appendChild(n);
  return { doc, p, label, choice, why, plain };
}

/** Fire a document's listeners (capture or not: the fake has one list) with an event. */
function fire(doc, type, init = {}) {
  const ev = {
    type,
    isPrimary: true,
    button: 0,
    clientX: 100,
    clientY: 100,
    prevented: false,
    stopped: false,
    preventDefault() {
      this.prevented = true;
    },
    stopPropagation() {
      this.stopped = true;
    },
    ...init,
  };
  for (const f of [...(doc.listeners.get(type) || [])]) f(ev);
  return ev;
}

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve();
};

function cleanup(t) {
  t.after(() => {
    setChannel(null);
    setBundle({}, {}, null);
  });
}

test('lineAt: the nearest element that names a line (data-t, data-t-aria, or the chain id the bundle has); none elsewhere', (t) => {
  cleanup(t);
  const { doc, p, label, why, plain } = page();
  const inner = doc.createElement('em');
  p.appendChild(inner);
  assert.deepEqual(lineAt(inner), { el: p, id: RIM }, 'inside the line');
  assert.equal(lineAt(p).id, RIM);
  assert.equal(lineAt(label).id, 'trail.walk_on');
  assert.equal(lineAt(why).id, 'trail.choice.why', 'a spoken name, tagged where t() set it');
  assert.equal(lineAt(plain), null);
  const shelf = doc.createElement('section');
  shelf.setAttribute('data-t-attr', 'aria-label:title.start_label|app.name');
  assert.equal(lineAt(shelf).id, 'title.start_label', "preview has the first of the chain's ids");
  assert.equal(attrLine('aria-label:nope.one|app.name', (id) => id === 'app.name'), 'app.name', 'the first the bundle has');
  assert.equal(attrLine('aria-label:nope.one|', () => false), null, 'an empty end: nothing');
});

test("lineAt: a press on an element whose line is tagged on a child is a press on that line: a choice's padding, off its label, is the choice's", (t) => {
  cleanup(t);
  const { doc, label, choice, why } = page();
  assert.deepEqual(lineAt(choice), { el: label, id: 'trail.walk_on' }, "the button, off its label: the label's line");
  // A control with two lines (the title's Begin and its note): its first.
  const begin = doc.createElement('button');
  const name = doc.createElement('span');
  name.setAttribute('data-t', 'title.begin');
  const note = doc.createElement('span');
  note.setAttribute('data-t', 'title.begin_note');
  begin.appendChild(name);
  begin.appendChild(note);
  const shelf = doc.createElement('section');
  shelf.setAttribute('data-t-attr', 'aria-label:title.start_label|app.name');
  shelf.appendChild(begin);
  const glyph = doc.createElement('svg');
  begin.appendChild(glyph);
  assert.equal(lineAt(glyph).id, 'title.begin', "deeper in the button, off both lines: the button's first, not the shelf's name");
  assert.equal(lineAt(note).id, 'title.begin_note', 'on a line: that line');
  // A plain element with one shown line under it: that line (the box's padding).
  const box = doc.body.querySelector('.game-box');
  assert.equal(lineAt(box).id, RIM);
  const hidden = doc.createElement('p');
  hidden.setAttribute('data-t', 'trail.walk_on');
  hidden.hidden = true;
  box.appendChild(hidden);
  assert.equal(lineAt(box).id, RIM, 'a hidden line is never under the finger');
  // Two lines under a plain element: neither, and only an ancestor's own tag counts from there.
  const row = doc.createElement('div');
  row.appendChild(choice);
  row.appendChild(why);
  doc.body.appendChild(row);
  assert.equal(lineAt(row), null, 'between a choice and its (i) square: neither');
  shelf.appendChild(row);
  assert.equal(lineAt(row).id, 'title.start_label', "then the nearest ancestor's own name");
  assert.equal(lineAt(choice).id, 'trail.walk_on', 'the button still names its own');
});

test("lineInfo and Copy for chat's text: the id and its hash, state, length against max and batch; the words quoted; the ctx", (t) => {
  cleanup(t);
  page();
  const info = lineInfo(RIM, META);
  assert.deepEqual(info, { id: RIM, hash: 'be25b08f', state: 'draft', len: 106, max: 140, batch: 'B004', n: 7, ctx: TEXT.lines.get(RIM).ctx, words: RIM_WORDS });
  assert.equal(chatText(info), `${RIM} · be25b08f · draft · 106/140 · B004 #7\n"${RIM_WORDS}"\nctx: ${TEXT.lines.get(RIM).ctx}`);
  // A dev line has no max and no batch; a place is not ours; an unknown id is missing.
  assert.equal(chatText(lineInfo('dev.close', META)).split('\n')[0], `dev.close · ${META['dev.close'].hash} · dev · 5/? · no batch`);
  assert.deepEqual([lineInfo('place.deer_lake', META).state, lineInfo('place.deer_lake', META).words], ['place', 'Deer Lake']);
  assert.equal(lineInfo('trail.nope', META).state, 'missing');
  assert.equal(lineInfo(RIM, null).hash, null, 'without meta.json: the id and the words still');
});

test('a 500 ms press on a line opens the card with its id, state, length and batch; earlier, or after moving 10 px, it does not', async (t) => {
  cleanup(t);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { doc, p, plain } = page();
  const insp = installInspector(doc, { meta: Promise.resolve(META) });
  await insp.ready;
  const card = () => doc.body.querySelector('.inspect');
  // frame.css turns off iOS's selection and callout on words while it listens.
  assert.equal(doc.documentElement.getAttribute('data-inspect'), '', '<html data-inspect> while installed');

  fire(doc, 'pointerdown', { target: p });
  t.mock.timers.tick(PRESS_MS - 1);
  await settle();
  assert.equal(card(), null, 'not yet');
  fire(doc, 'pointerup', { target: p });
  t.mock.timers.tick(10);
  await settle();
  assert.equal(card(), null, 'released early: nothing');

  fire(doc, 'pointerdown', { target: p, clientX: 100, clientY: 100 });
  fire(doc, 'pointermove', { target: p, clientX: 100 + MOVE_PX - 1, clientY: 100 });
  t.mock.timers.tick(PRESS_MS - 100);
  fire(doc, 'pointermove', { target: p, clientX: 100 + MOVE_PX, clientY: 100 });
  t.mock.timers.tick(200);
  await settle();
  assert.equal(card(), null, 'moved 10 px: a scroll, not a press');

  fire(doc, 'pointerdown', { target: p });
  fire(doc, 'pointercancel', { target: p });
  t.mock.timers.tick(PRESS_MS);
  await settle();
  assert.equal(card(), null, 'the browser took the touch');

  fire(doc, 'pointerdown', { target: plain });
  t.mock.timers.tick(PRESS_MS);
  await settle();
  assert.equal(card(), null, 'no line there');

  fire(doc, 'pointerdown', { target: p, clientX: 100, clientY: 100 });
  fire(doc, 'pointermove', { target: p, clientX: 105, clientY: 105 });
  t.mock.timers.tick(PRESS_MS);
  await settle();
  const sheet = card();
  assert.ok(sheet, 'open');
  assert.equal(sheet.getAttribute('role'), 'dialog');
  assert.equal(sheet.querySelector('.inspect-id').textContent, `${RIM} · be25b08f`);
  assert.equal(sheet.querySelector('.inspect-line').textContent, `draft ·${NBSP}106 of 140 ·${NBSP}B004 #7`, 'its separators bound to what follows (S6)');
  assert.equal(sheet.querySelector('.inspect-line').getAttribute('data-t'), 'dev.inspect.line');
  assert.equal(sheet.querySelector('.inspect-ctx').textContent, TEXT.lines.get(RIM).ctx);
  assert.equal(sheet.querySelector('.inspect-words').textContent, `"${RIM_WORDS}"`);
  assert.equal(sheet.querySelector('.inspect-copy').textContent, 'Copy for chat');
  assert.equal(sheet.querySelector('.debug-close').getAttribute('aria-label'), 'Close');
  // × closes it.
  sheet.querySelector('.debug-close').click();
  assert.equal(card(), null);
  insp.uninstall();
  assert.equal((doc.listeners.get('pointerdown') || []).length, 0, 'uninstalled');
  assert.equal(doc.documentElement.getAttribute('data-inspect'), null, 'and the words select again');
});

test("the click after a long press is swallowed, so a long press on a choice never commits it; the next tap after SWALLOW_MS goes through", async (t) => {
  cleanup(t);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { doc, label } = page();
  const insp = installInspector(doc, { meta: Promise.resolve(META) });
  await insp.ready;
  const plain = fire(doc, 'click', { target: label });
  assert.equal(plain.stopped, false, 'an ordinary tap is left alone');
  fire(doc, 'pointerdown', { target: label });
  t.mock.timers.tick(PRESS_MS);
  await settle();
  assert.ok(doc.body.querySelector('.inspect'));
  assert.equal(doc.body.querySelector('.inspect-id').textContent.split(' · ')[0], 'trail.walk_on');
  fire(doc, 'pointerup', { target: label });
  const after = fire(doc, 'click', { target: label });
  assert.deepEqual([after.stopped, after.prevented], [true, true], 'the release click never reaches the choice (nor the scrim)');
  const next = fire(doc, 'click', { target: label });
  assert.equal(next.stopped, false, 'only that one click');
  // Released with no click: the window closes after SWALLOW_MS.
  fire(doc, 'pointerdown', { target: label });
  t.mock.timers.tick(PRESS_MS);
  await settle();
  fire(doc, 'pointerup', { target: label });
  t.mock.timers.tick(SWALLOW_MS);
  assert.equal(fire(doc, 'click', { target: label }).stopped, false, 'a tap after the window goes through');
  // A long press's own menu never opens over a line.
  assert.equal(fire(doc, 'contextmenu', { target: label }).prevented, true);
  insp.uninstall();
});

test("a long press anywhere on a choice, off its label, opens the card for the choice's line and never commits it", async (t) => {
  cleanup(t);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { doc, choice } = page();
  let walked = 0;
  choice.addEventListener('click', () => walked++);
  const insp = installInspector(doc, { meta: Promise.resolve(META) });
  await insp.ready;
  fire(doc, 'pointerdown', { target: choice });
  t.mock.timers.tick(PRESS_MS);
  await settle();
  assert.equal(doc.body.querySelector('.inspect-id').textContent.split(' · ')[0], 'trail.walk_on', "the button's line");
  fire(doc, 'pointerup', { target: choice });
  // The release's click: the capture listener stops it before the button's own.
  const after = fire(doc, 'click', { target: choice });
  if (!after.stopped) choice.dispatchEvent({ type: 'click' });
  assert.deepEqual([after.stopped, after.prevented, walked], [true, true, 0], 'it never walks on');
  assert.equal(fire(doc, 'contextmenu', { target: choice }).prevented, true, "and the browser's own menu never opens on it");
  insp.uninstall();
});

test('a press held PRESS_MS is never a tap: one that drifted MOVE_PX before the card opened never commits its choice; a quick tap that drifted still does', async (t) => {
  cleanup(t);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { doc, label, choice } = page();
  let walked = 0;
  choice.addEventListener('click', () => walked++);
  const insp = installInspector(doc, { meta: Promise.resolve(META) });
  await insp.ready;
  /** The release, then its click (a browser's tap slop runs past MOVE_PX), reaching the button unless the capture listener stops it. */
  const release = () => {
    fire(doc, 'pointerup', { target: label, clientX: 100 + MOVE_PX + 1 });
    const ev = fire(doc, 'click', { target: label });
    if (!ev.stopped) choice.dispatchEvent({ type: 'click' });
    return ev;
  };
  fire(doc, 'pointerdown', { target: label, clientX: 100, clientY: 100 });
  fire(doc, 'pointermove', { target: label, clientX: 100 + MOVE_PX + 1, clientY: 100 });
  t.mock.timers.tick(PRESS_MS);
  await settle();
  assert.equal(doc.body.querySelector('.inspect'), null, 'moved off: no card');
  const after = release();
  assert.deepEqual([after.stopped, after.prevented, walked], [true, true, 0], 'held, so it never walks on');
  t.mock.timers.tick(SWALLOW_MS);
  fire(doc, 'pointerdown', { target: label, clientX: 100, clientY: 100 });
  fire(doc, 'pointermove', { target: label, clientX: 100 + MOVE_PX + 1, clientY: 100 });
  t.mock.timers.tick(PRESS_MS - 1);
  assert.equal(release().stopped, false, 'a quick tap is a tap');
  assert.equal(walked, 1);
  insp.uninstall();
});

test('a press held PRESS_MS between two choices, on no line, never commits the nearest on release', async (t) => {
  cleanup(t);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { doc, choice } = page();
  const list = doc.createElement('div');
  list.className = 'game-choices';
  const other = doc.createElement('button');
  other.className = 'box choice';
  const otherLabel = doc.createElement('span');
  tx(otherLabel, 'trail.choice.why');
  other.appendChild(otherLabel);
  list.appendChild(choice);
  list.appendChild(other);
  doc.body.appendChild(list);
  assert.equal(lineAt(list), null, 'two lines under the list: the gap names neither');
  let walked = 0;
  choice.addEventListener('click', () => walked++);
  const insp = installInspector(doc, { meta: Promise.resolve(META) });
  await insp.ready;
  fire(doc, 'pointerdown', { target: list });
  t.mock.timers.tick(PRESS_MS);
  await settle();
  assert.equal(doc.body.querySelector('.inspect'), null, 'no line, no card');
  fire(doc, 'pointerup', { target: list });
  // iOS sends the click to the nearest button.
  const after = fire(doc, 'click', { target: choice });
  if (!after.stopped) choice.dispatchEvent({ type: 'click' });
  assert.deepEqual([after.stopped, after.prevented, walked], [true, true, 0], 'it never walks on');
  // A press the browser took (a scroll) sends no click, so it arms nothing.
  t.mock.timers.tick(SWALLOW_MS);
  fire(doc, 'pointerdown', { target: list });
  t.mock.timers.tick(PRESS_MS);
  fire(doc, 'pointercancel', { target: list });
  assert.equal(fire(doc, 'click', { target: choice }).stopped, false, 'the next tap goes through');
  insp.uninstall();
});

test('Copy for chat builds its text inside the tap and copies it at once; if the clipboard refuses, the text shows selected and the next tap shares it', async (t) => {
  cleanup(t);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { doc } = page();
  const copied = [];
  const shared = [];
  let refuse = false;
  const nav = {
    clipboard: { writeText: (s) => (copied.push(s), refuse ? Promise.reject(new Error('no')) : Promise.resolve()) },
    share: (o) => (shared.push(o.text), Promise.resolve()),
  };
  const insp = installInspector(doc, { meta: Promise.resolve(META), nav });
  await insp.open(RIM);
  const copy = doc.body.querySelector('.inspect-copy');
  copy.click();
  assert.deepEqual(copied, [chatText(lineInfo(RIM, META))], 'written in the same tick as the tap');
  await settle();
  assert.ok(copy.classList.contains('done'), 'the ✓');
  refuse = true;
  await insp.open(RIM);
  const copy2 = doc.body.querySelector('.inspect-copy');
  copy2.click();
  await settle();
  const area = doc.body.querySelector('.inspect-area');
  assert.equal(area.hidden, false);
  assert.equal(area.value, chatText(lineInfo(RIM, META)));
  assert.equal(copy2.dataset.mode, 'share');
  copy2.click();
  assert.deepEqual(shared, [chatText(lineInfo(RIM, META))], 'the share sheet, inside the next tap');
  insp.uninstall();
});

test('debug mode loads it on preview with the trail, and never on main; preview ships text/meta.json and main does not', async (t) => {
  t.after(() => {
    setChannel(null);
    setBundle({}, {}, null);
    resetCheck();
  });
  resetCheck();
  await runCheck({ fetchFn: async () => ({ ok: true, status: 200, json: async () => selfcheckCorpus() }) });
  // Main: its menu opens, and nothing listens for a press.
  const main = page('main', 'app debug title');
  main.doc.defaultView = { location: { hash: '', search: '', pathname: '/' } };
  await openDebug(main.doc);
  await settle();
  assert.equal((main.doc.listeners.get('pointerdown') || []).length, 0, 'no inspector on main');
  // Preview: debug mode installs it.
  const prev = page();
  prev.doc.defaultView = { location: { hash: '', search: '', pathname: '/preview/' } };
  await openDebug(prev.doc);
  const insp = /** @type {any} */ (await loadInspector(prev.doc));
  assert.ok(insp && typeof insp.open === 'function');
  assert.equal((prev.doc.listeners.get('pointerdown') || []).length, 1, 'installed once');
  assert.equal(await loadInspector(prev.doc), insp, 'loaded once');
  insp.uninstall();
  // The gate, in the source: loadInspector only behind preview and the trail.
  const debugSrc = readFileSync(join(ROOT, 'web', 'js', 'ui', 'debug.js'), 'utf8');
  assert.match(debugSrc, /if \(preview && opensTrail\(doc\)\) loadInspector\(doc\);/);
  assert.deepEqual([...debugSrc.matchAll(/import\('([^']+)'\)/g)].map((m) => m[1]), ['./inspect.js'], 'one dynamic import, of the inspector');
  // Main's static import graph never reaches it.
  const seen = new Set();
  const walk = (rel) => {
    if (seen.has(rel)) return;
    seen.add(rel);
    const src = readFileSync(join(ROOT, 'web', rel), 'utf8');
    for (const m of src.matchAll(/^\s*(?:import|export)\s[^;]*?from\s+'([^']+)'/gms)) walk(posix.normalize(posix.join(dirname(rel), m[1])));
  };
  walk('js/main.js');
  assert.ok(seen.has('js/ui/debug.js'));
  assert.ok(!seen.has('js/ui/inspect.js'), 'no static path to the inspector');
  // The data: preview's bundle has meta.json, main's has none.
  const src = shellSources(ROOT);
  const mainFiles = bundle(TEXT, 'main', mainReach(TEXT, src.html, src.manifest));
  assert.deepEqual(Object.keys(mainFiles), ['en.json']);
  assert.deepEqual(Object.keys(PREVIEW), ['en.json', 'marks.json', 'meta.json']);
  assert.deepEqual(PREVIEW['meta.json'], META);
});
