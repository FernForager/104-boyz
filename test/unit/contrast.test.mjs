// Text contrast (BUILD_PLAN S6 track A; GAME_DESIGN 11.9; decision 68):
// every pair of colors the stylesheets draw words in, by token, with the
// ratio WCAG 2's AA asks of it, computed from web/js/gfx/palette.js. So the
// next palette tweak fails here at once, not on a phone.
//
// The table is kept by hand, beside the CSS it describes: each row names the
// rule that sets the words' color (the test checks the rule says so), the
// background they sit on (by hand: a rule's own, its box's, the page's, or
// the cover's sky), and what it needs: 4.5 for text, 3 for large text (24
// px, or 18.7 px bold) and for a glyph or mark that isn't words, and none
// for an inactive control (WCAG 1.4.3's exception) or a dev mark, which
// still keep 2:1 so they show. Every rule in game.css and frame.css that
// sets a color is in the table, so a new one can't slip past.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { PALETTE, NAMES } from '../../web/js/gfx/palette.js';
import { contrastRatio } from '../../tools/color.mjs';

const TEXT = 4.5;
const LARGE = 3;
const MARK = 3;
/** An inactive control or a dev mark: WCAG asks nothing, we ask that it shows. */
const EXEMPT = 0;
const SHOWS = 2;

/**
 * [stylesheet, the rule that sets the color, the words' token, the token
 * they sit on, the ratio needed, what and where]. A rule may sit on more
 * than one background; it has a row for each. null: no rule of its own
 * (a mark drawn as a background).
 * @type {[string, string | null, string, string, number, string][]}
 */
const PAIRS = [
  // The page and the title (game.css).
  ['game.css', 'html', '--c4', '--page', TEXT, 'page text: snow on ink'],
  ['game.css', '.title', '--c4', '--c1', LARGE, "the title, bold and large, on the cover's night-navy sky (its ink shadow helps; it isn't counted)"],
  ['game.css', '.title-small', '--c5', '--c1', TEXT, "the title's small line, on the cover's sky"],
  ['game.css', '.tagline', '--c5', '--c1', TEXT, "preview's tagline, on the cover's sky (S6: cream, as pink fell to 4.2)"],
  ['game.css', '.install', '--c5', '--page', TEXT, 'the install line'],
  ['game.css', '.stamps', '--c3', '--page', TEXT, 'the stamps, 13 px, under the shelf'],
  ['frame.css', '.menu .stamps', '--c2', '--box-fill', TEXT, 'the stamps in the ≡ sheet (a box)'],
  ['game.css', '.game-note', '--c5', '--page', TEXT, "the guest book's note"],
  ['game.css', '.turn-glyph', '--c4', '--c0', MARK, 'the turn-the-phone glyph'],
  ['game.css', '.upright p', '--ink', '--box-fill', TEXT, 'the upright line'],
  // The Sierra box, its choices and its sheets.
  ['game.css', '.box', '--ink', '--box-fill', TEXT, 'the box, the choices, the sheets: ink on snow'],
  ['game.css', '.update-line', '--ink', '--box-fill', TEXT, 'the update note'],
  ['game.css', '.choice-note', '--c9', '--box-fill', TEXT, "a choice's note in brick (the ♦'s red)"],
  ['game.css', '.choice-note', '--c9', '--c5', EXEMPT, "the note on the title's disabled Begin (an inactive control)"],
  ['game.css', '.choice:disabled .choice-label', '--c2', '--c5', EXEMPT, 'a disabled choice (an inactive control)'],
  ['game.css', '.name-field', '--ink', '--c4', TEXT, "the guest book's name field"],
  ['game.css', '.report', '--ink', '--box-fill', TEXT, 'the bug report'],
  // The debug menu and preview's marks (snow sheets).
  ['game.css', '.debug-id', '--c2', '--box-fill', TEXT, 'the build code in the debug menu'],
  ['game.css', '.debug-close', '--ink', '--box-fill', TEXT, "the debug menu's close"],
  ['game.css', '.debug-check', '--c2', '--box-fill', TEXT, 'the self-check line'],
  ['game.css', '.debug-check[data-check="differs"], .debug-check[data-check="error"]', '--c9', '--box-fill', TEXT, 'the self-check, failing'],
  ['game.css', '.debug-note-label', '--c2', '--box-fill', TEXT, "the bug report note's label"],
  ['game.css', '.debug-note', '--ink', '--c4', TEXT, 'the bug report note'],
  ['game.css', '.marks-label', '--c2', '--box-fill', TEXT, "the marks' label"],
  ['game.css', '.marks-mode', '--ink', '--c4', TEXT, 'a marks button'],
  ['game.css', '.marks-mode[aria-pressed="true"]', '--c4', '--c2', TEXT, 'a marks button, pressed'],
  ['game.css', 'html[data-marks="on"] .t-ph', '--c3', '--c0', EXEMPT, "preview's placeholder mark (a dev mark), on the page"],
  ['frame.css', '.inspect .inspect-line, .inspect .inspect-ctx', '--c2', '--box-fill', TEXT, "the line inspector's codes"],
  ['frame.css', '.inspect .inspect-words', '--ink', '--box-fill', TEXT, "the line inspector's words"],
  // The pencil map (#map).
  ['game.css', '.map-close', '--c4', '--page', TEXT, "the map's close"],
  ['game.css', '.map-badge', '--ink', '--c4', TEXT, 'a map badge'],
  ['game.css', '.map-badge[data-kind="trailhead"]', '--c4', '--c0', TEXT, "a trailhead's badge"],
  ['game.css', '.map-legend', '--ink', '--paper', TEXT, 'the legend rows: ink on paper cream'],
  ['game.css', '.map-n', '--c10', '--paper', TEXT, "a row's number (S6: bark, as slate fell to 4.1)"],
  ['game.css', '.map-mi', '--c10', '--paper', TEXT, "a row's miles, 13 px (S6: bark, as slate fell to 4.1)"],
  // The trail stop (frame.css).
  ['frame.css', '.status-line', '--c0', '--c4', TEXT, 'the status line: ink on snow'],
  ['frame.css', null, '--c9', '--c4', MARK, "the status line's ≡ flag (a brick dot)"],
  ['frame.css', '.frame-caption', '--c5', '--page', TEXT, 'the caption'],
  ['frame.css', '.strip-mile', '--c5', '--c0', TEXT, "the strip's mile, on the strip's ink"],
  ['frame.css', '.choice-info', '--c0', '--c4', MARK, 'the (i) glyph'],
  // The odds (S6): the diamond, a diamond's second line, the confirm's prompt, an outcome's notes, the Why sheet.
  ['frame.css', '.diamond-glyph', '--c9', '--box-fill', MARK, "a choice's brick diamond"],
  ['frame.css', '.choice-odds2', '--c9', '--box-fill', TEXT, "a diamond's fail and fatal shares, in brick"],
  ['frame.css', '.choice-confirm', '--c5', '--page', TEXT, "the confirm's prompt, on the page"],
  ['frame.css', '.outcome-notes', '--c5', '--page', TEXT, "an outcome's pencil rows, on the page"],
  ['frame.css', '.outcome-notes[data-sev="good"] .ornament', '--c13', '--box-fill', MARK, 'the moss fern (good), on its snow tile'],
  ['frame.css', '.outcome-notes[data-sev="mishap"] .ornament', '--c10', '--box-fill', MARK, 'the bark twig (a mishap)'],
  ['frame.css', '.outcome-notes[data-sev="serious"] .ornament, .outcome-notes[data-sev="death"] .ornament', '--c9', '--box-fill', MARK, 'the brick diamond (serious, or the end)'],
  ['frame.css', '.why-fatal', '--c9', '--box-fill', TEXT, "the Why sheet's fatal arithmetic, in brick"],
  // The ▾ continuation and Look (S6 track C): the ▾ is a brick glyph in a box's corner; a Look box is a .box.
  ['frame.css', '.box-more', '--c9', '--box-fill', MARK, "the box's ▾ (a brick glyph, named More)"],
  ['frame.css', '.toolbar-item', '--c5', '--page', TEXT, 'the toolbar'],
  ['frame.css', '.toolbar-item:disabled', '--c2', '--page', EXEMPT, 'a disabled toolbar item (an inactive control)'],
  ['frame.css', '.scenes-picker', '--c4', '--page', TEXT, 'the #frame check view'],
];

/** Every rule in a stylesheet: {sel, decls}, @media flattened. */
function cssRules(text) {
  const bare = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  const stack = [];
  let buf = '';
  for (const ch of bare) {
    if (ch === '{') {
      stack.push(buf.trim());
      buf = '';
    } else if (ch === '}') {
      const sel = stack.pop();
      if (buf.trim() && sel !== undefined && !sel.startsWith('@')) out.push({ sel: sel.replace(/\s+/g, ' '), body: buf });
      buf = '';
    } else buf += ch;
  }
  return out.map(({ sel, body }) => ({
    sel,
    decls: Object.fromEntries(
      body
        .split(';')
        .map((d) => d.trim())
        .filter((d) => d.includes(':'))
        .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]),
    ),
  }));
}

const css = (f) => readFileSync(join(ROOT, 'web', 'css', f), 'utf8');
const RULES = { 'game.css': cssRules(css('game.css')), 'frame.css': cssRules(css('frame.css')) };

/** tokens.css's names, down to a palette slot: --ink is --c0, and so on. */
function slotOf(token) {
  const tokens = css('tokens.css');
  let name = token;
  for (let i = 0; i < 4; i++) {
    const m = /^--c(\d+)$/.exec(name);
    if (m) return Number(m[1]);
    const def = new RegExp(`${name}:\\s*var\\((--[a-z0-9-]+)\\)`).exec(tokens);
    assert.ok(def, `tokens.css defines ${name}`);
    name = def[1];
  }
  throw new Error(`${token} doesn't come down to a slot`);
}

const ratio = (fg, bg) => contrastRatio(PALETTE[slotOf(fg)], PALETTE[slotOf(bg)]);

test('every text pair the stylesheets draw keeps its WCAG AA ratio, computed from the palette (4.5 for text, 3 for large text and marks)', () => {
  const short = [];
  for (const [file, sel, fg, bg, need, what] of PAIRS) {
    const r = ratio(fg, bg);
    if (need === EXEMPT) {
      if (r < SHOWS) short.push(`${file} ${sel}: ${what}: ${NAMES[slotOf(fg)]} on ${NAMES[slotOf(bg)]} is ${r.toFixed(2)}, too faint to show`);
    } else if (r < need) short.push(`${file} ${sel}: ${what}: ${NAMES[slotOf(fg)]} on ${NAMES[slotOf(bg)]} is ${r.toFixed(2)}, under ${need}`);
  }
  assert.deepEqual(short, []);
});

test("the table is the CSS's: each row's rule sets that color, and every rule that sets a color has a row", () => {
  for (const [file, sel, fg] of PAIRS) {
    if (sel === null) continue;
    const rule = RULES[file].find((r) => r.sel === sel && r.decls.color !== undefined);
    assert.ok(rule, `${file}: a rule ${sel} that sets color`);
    assert.equal(rule.decls.color, `var(${fg})`, `${file} ${sel}`);
  }
  const listed = new Set(PAIRS.map(([file, sel]) => `${file} ${sel}`));
  for (const [file, rules] of Object.entries(RULES)) {
    for (const r of rules) {
      const c = r.decls.color;
      if (c === undefined || /^(inherit|currentColor|transparent)$/.test(c)) continue;
      assert.ok(listed.has(`${file} ${r.sel}`), `${file} ${r.sel} sets color: ${c}, and has no row in the table`);
    }
  }
  // The ≡ flag's dot is a background, by its own rule.
  assert.match(css('frame.css'), /\.status-menu\[data-flag\]::before \{[^}]*background: var\(--c9\);/);
});

test("decision 68's contrast figures (GAME_DESIGN 11.9), exactly, from the palette", () => {
  const r = (a, b) => contrastRatio(PALETTE[a], PALETTE[b]).toFixed(2);
  // 11.9's figures, Revised by 68: ink on snow about 10:1, brick on snow (the ♦ and fatal shares) about 5.3:1,
  // paper cream on ink about 8.4:1, rust on snow about 3.2:1 (rust never carries text), gold against glacier
  // about 1.1:1 (gold is never told by hue alone), and the night plate's gold against slate about 3:1.
  assert.deepEqual([r(0, 4), r(9, 4), r(5, 0), r(8, 4), r(7, 3), r(7, 2)], ['10.05', '5.32', '8.35', '3.20', '1.13', '3.03']);
  const doc = readFileSync(join(ROOT, 'design', 'GAME_DESIGN.md'), 'utf8');
  const s119 = doc.slice(doc.indexOf('### 11.9 Type and accessibility'), doc.indexOf('### 11.10'));
  for (const figure of ['about 10:1', 'about 5.3:1', 'about 8.4:1', 'about 3.2:1', 'about 1.1:1', 'about 3:1']) assert.ok(s119.includes(figure), `11.9 says ${figure}`);
  // Rust never carries text: no rule colors words rust.
  assert.ok(!PAIRS.some(([, , fg]) => slotOf(fg) === 8), 'no words in rust');
  // ...nor in bonfire gold, the lily's alone (P07, P12).
  assert.ok(!PAIRS.some(([, , fg, bg]) => slotOf(fg) === 7 || slotOf(bg) === 7), 'no gold in the chrome');
});
