// The Why sheet (BUILD_PLAN S6 B.3.5; GAME_DESIGN 12.11, 8.5, 8.8): the
// sample's two sheets, row by row in the player's words (every number the
// engine's, every word a line), the bar's pieces with their ink rules and
// the fatal sliver, and the dialog: named by its title, focus there and
// back, Close, Escape and the scrim close it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { openWhy, closeWhy, barPieces, BAR_W } from '../../web/js/ui/sheet.js';
import { NBSP } from '../../web/js/text.js';
import { ROOT } from '../../tools/pics.mjs';
import { atFork, device, frameDoc } from './forkfix.mjs';

/** A sheet's rows as the player reads them: each p's words, the dots' row as "words .. value". */
function rowsOf(sheet) {
  return sheet.children
    .filter((c) => c.tagName !== 'HR' && c.tagName !== 'SVG' && c.tagName !== 'BUTTON')
    .map((c) => (c.classList.contains('why-row') ? `${c.querySelector('.why-k').textContent} .. ${c.querySelector('.why-v').textContent}` : c.textContent))
    .map((s) => s.replaceAll(NBSP, ' '));
}

/** Open the sheet of one of the fork's choices. */
function sheetFor(t, c) {
  device(t);
  const doc = frameDoc();
  const choice = atFork().screen.choices.find((x) => x.act.c === c);
  const opener = doc.body.appendChild(doc.createElement('button'));
  const w = openWhy(doc, { label: choice.label, why: choice.why, opener });
  t.after(() => closeWhy(doc));
  return { doc, sheet: w.el, opener, close: w.close };
}

test("Stay high's sheet: the crest in a storm at 40, 65%, its bands, what goes badly, 35 x 100% x 2% = 0.70%, Heart Lake about 4:26 pm, and the open crest until about 4:11 pm", (t) => {
  const { sheet } = sheetFor(t, 'high');
  assert.deepEqual(rowsOf(sheet), [
    'Why these odds',
    'Stay high',
    'Open crest, thunderstorm .. 40',
    'Clean .. 40',
    'You make it .. 65%',
    'clean 40 · shaky 25 · fail 35',
    'If it goes badly: lightning hits close, on the highest ground for miles.',
    'Fatal: 35 x 100% x 2% = 0.70%, shown 0.7%',
    'Heart Lake about 4:26 pm, 3.4 mi',
    'On the open crest until about 4:11 pm',
  ]);
  assert.equal(sheet.querySelector('.why-close').textContent, 'Close');
  assert.equal(sheet.querySelector('.why-close').querySelector('.choice-label').getAttribute('data-t'), 'trail.why.close');
});

test("Through the basin's sheet: the staircase at 88, the footing skill's +2, 90 clean, 95%, Lunch Lake about 2:31 pm; no fatal arithmetic, no crest", (t) => {
  const { sheet } = sheetFor(t, 'basin');
  assert.deepEqual(rowsOf(sheet), [
    'Why these odds',
    'Through the basin',
    'The stone staircase, dry .. 88',
    'Footing skill (level 1) .. +2',
    'Clean .. 90',
    'You make it .. 95%',
    'clean 90 · shaky 5 · fail 5',
    'If it goes badly: a slip on the stairs. A bruise, at worst a turned ankle.',
    'Lunch Lake about 2:31 pm, 0.9 mi',
  ]);
  assert.equal(sheet.querySelector('.why-fatal'), null);
  // The legend binds each band's word to its number, so no row ends on a word whose number starts the next (T02e).
  assert.equal(sheet.querySelector('.why-legend').textContent, `clean${NBSP}90 ·${NBSP}shaky${NBSP}5 ·${NBSP}fail${NBSP}5`);
  // Every word on it is a line, by id (no word in code): each row's words carry their data-t.
  for (const el of sheet.querySelectorAll('.why-k')) assert.ok(el.getAttribute('data-t'), 'a row label is a line');
  for (const cls of ['.why-title', '.why-legend', '.why-badly', '.why-route']) assert.ok(sheet.querySelector(cls).getAttribute('data-t'), `${cls} is a line`);
});

test('the dialog: named by its title, which takes focus; Close, Escape or the scrim closes it, and focus goes back to what opened it', (t) => {
  const { doc, sheet, opener } = sheetFor(t, 'high');
  assert.deepEqual([sheet.getAttribute('role'), sheet.getAttribute('aria-modal'), sheet.getAttribute('aria-labelledby'), sheet.querySelector('#why-title').getAttribute('data-t')], ['dialog', 'true', 'why-title', 'trail.why.title']);
  assert.equal(doc.activeElement, sheet.querySelector('.why-title'));
  // Escape.
  for (const f of [...(doc.listeners.get('keydown') || [])]) f({ key: 'Escape' });
  assert.equal(doc.body.querySelector('.why'), null);
  assert.equal(doc.activeElement, opener);
  assert.equal((doc.listeners.get('keydown') || []).length, 0, 'its key listener goes with it');
  // The scrim.
  const again = openWhy(doc, { label: null, why: atFork().screen.choices[0].why, opener });
  const scrim = doc.body.querySelector('.why-scrim');
  scrim.dispatchEvent({ type: 'click', target: again.el });
  assert.ok(doc.body.querySelector('.why'), 'a tap on the sheet is not on the scrim');
  scrim.dispatchEvent({ type: 'click', target: scrim });
  assert.equal(doc.body.querySelector('.why'), null);
  // One sheet at a time; closeWhy closes it (a new screen, or the frame let go).
  openWhy(doc, { label: null, why: atFork().screen.choices[0].why });
  openWhy(doc, { label: null, why: atFork().screen.choices[1].why });
  assert.equal(doc.body.querySelectorAll('.why').length, 1);
  closeWhy(doc);
  assert.equal(doc.body.querySelector('.why'), null);
});

test("the bar (8.8, 11.9): moss, pink, brick in points, an ink rule between each, the fatal sliver in ink at the far end of the brick; the legend says it in words", () => {
  assert.deepEqual(barPieces({ clean: 40, shaky: 25, fail: 35 }, { fail: 35, band: { num: 1, den: 1 }, death: 20, exact: { num: 7, den: 10 }, shown: { tenths: 7 } }), [
    { cls: 'bar-clean', x: 0, w: 40 },
    { cls: 'bar-rule', x: 39.5, w: 1 },
    { cls: 'bar-shaky', x: 40, w: 25 },
    { cls: 'bar-rule', x: 64.5, w: 1 },
    { cls: 'bar-fail', x: 65, w: 35 },
    { cls: 'bar-fatal', x: BAR_W - 1, w: 1 },
  ]);
  // A night roll's two bands (Lead call 6): moss and brick, one rule.
  assert.deepEqual(
    barPieces({ clean: 10, shaky: 0, fail: 90 }, null).map((p) => p.cls),
    ['bar-clean', 'bar-rule', 'bar-fail'],
  );
  // A wide fatal share shows its own width (C.2's headland, 15.25%).
  assert.deepEqual(barPieces({ clean: 14, shaky: 25, fail: 61 }, { fail: 61, band: { num: 1, den: 1 }, death: 250, exact: { num: 61, den: 4 }, shown: { tenths: 160 } }).at(-1), { cls: 'bar-fatal', x: BAR_W - 15.25, w: 15.25 });
  // frame.css colors each piece: moss, pink, brick and ink (11.1), never gold.
  const css = readFileSync(join(ROOT, 'web', 'css', 'frame.css'), 'utf8');
  assert.match(css, /\.why-bar \.bar-clean \{ fill: var\(--c13\); \}/);
  assert.match(css, /\.why-bar \.bar-shaky \{ fill: var\(--c6\); \}/);
  assert.match(css, /\.why-bar \.bar-fail \{ fill: var\(--c9\); \}/);
  assert.match(css, /\.why-bar \.bar-rule,\n\.why-bar \.bar-fatal \{ fill: var\(--c0\); \}/);
  // It slides up only where motion is welcome (Reduce Motion: it appears).
  const block = css.slice(css.indexOf('@media (prefers-reduced-motion: no-preference)'));
  assert.match(block, /^@media \(prefers-reduced-motion: no-preference\) \{\n {2}\.why \{ animation: why-up/);
  // Re-pinned in S6 track C (it was 1): the Look box pops up too, in its own no-preference block (motion.test.mjs holds every one inside one).
  assert.equal((css.match(/animation:/g) || []).length, 2, "the sheet's slide and the Look box's pop");
});
