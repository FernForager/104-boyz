// T02, measured fit (BUILD_PLAN S6 track C, 10.5; GAME_DESIGN 12.1, 11.9,
// F.3): every box, label, tag, caption, Look, outcome and Why-sheet row,
// set in the shipped fonts' own advances and broken as a browser breaks
// it, fits frameLayout()'s space at 375 x 667 and 393 x 852. The repo is
// clean; each sub-rule fails a planted overflow; the lengths T02 reads are
// frame.css's and game.css's own.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadArt } from '../../tools/pics.mjs';
import { readText, channelScreens } from '../../tools/text.mjs';
import { compileContent } from '../../tools/content.mjs';
import { placeParts, loadHotspots, shippedHotspots } from '../../tools/looks.mjs';
import { loadFaces } from '../../tools/fontmetrics.mjs';
import { lintT02, runT02, boxSpace, lookSpace, choiceFit, oddsForms, wordsFor, captionFills, drawnStops, whyLegends, T02_CASES, GEOMETRY, XXXL_PX } from '../../tools/t02.mjs';
import { breakLines, widthOf } from '../../tools/fontmetrics.mjs';
import { NBSP } from '../../web/js/text.js';
import { runTextLint } from '../../tools/textlint.mjs';
import { frameLayout, BOX_CHROME_FP } from '../../web/js/ui/frame.js';

const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');
const FRAME_CSS = read('web', 'css', 'frame.css');
const GAME_CSS = read('web', 'css', 'game.css');
const FACES = loadFaces();
const ART = loadArt();

/** The repo's inputs, fresh each call, so a test can plant in them. */
function inputs() {
  const text = readText(ROOT, { strict: false });
  const { rules, voice } = compileContent({ root: ROOT, screens: channelScreens(text, 'preview') });
  return { text, rules, voice, parts: placeParts(ART), places: Object.keys(ART.recipes.places), looked: shippedHotspots(loadHotspots().hotspots), faces: FACES };
}

/** Plant words for a line. */
function plant(i, id, words) {
  const line = i.text.lines.get(id);
  i.text.lines.set(id, { ...(line || { file: 'content/text/en/trail.json', line: 1, ctx: 'c', screen: 'trail', max: 999 }), id, text: words });
  return i;
}

const errors = (r) => r.issues.filter((x) => x.level === 'error').map((x) => x.msg);
const warns = (r) => r.issues.filter((x) => x.level === 'warn').map((x) => x.msg);
const LONG = 'This is a box line long enough to run on and on past the end of any box the phone can give it, and then some more words after that, as far as the eye can see.';

test('T02 over the repo: no error; the box holds 7 whole lines on the SE with three choices and 5 on the 15 with four; the fork with its fatal intro continues (▾) on both, printed', () => {
  const r = runT02();
  assert.deepEqual(errors(r), []);
  assert.deepEqual(warns(r), []);
  assert.deepEqual(r.counts.boxLines, { se: 7, 15: 5 });
  assert.equal(r.counts.stops, 14);
  assert.ok(r.continues.some((c) => /^deer_lake_rim\.fork at 375 x 667 \(SE\) with its first intro \(trail\.odds\.intro\.fatal\): 8 lines, continues/.test(c)), r.continues.join('\n'));
  assert.ok(r.continues.some((c) => /^alt Looks at 375 x 667 \(SE\): \d+ of 112 continue/.test(c)));
  assert.equal(r.counts.altLooks['15'].continue, 0, 'no alt Look continues on the 15');
  // The text lint runs it, and prints what continues.
  const lint = runTextLint(ROOT);
  assert.deepEqual(lint.issues.filter((x) => x.code === 'T02' && x.level === 'error'), []);
  assert.ok(lint.infos.some((s) => s.startsWith('T02: deer_lake_rim.fork')));
});

test('T02a and T02b: a box over its lines fails at both phones with the budget\'s choices, and on the 15 with its own; on the SE a stop over the three-choice budget continues (a warning, counted)', () => {
  const a = lintT02(plant(inputs(), 'trail.deer_lake_rim.rim', `${LONG} ${LONG} ${LONG}`));
  assert.ok(errors(a).some((m) => /^T02a deer_lake_rim\.rim at 375 x 667 \(SE\) with 3 choices: \d+ lines/.test(m)), errors(a).join('\n'));
  assert.ok(errors(a).some((m) => /^T02a deer_lake_rim\.rim at 393 x 852 \(15, 16\) with 4 choices/.test(m)));
  assert.ok(errors(a).some((m) => /^T02b deer_lake_rim\.rim at 393 x 852 \(15, 16\) with its own 1 choice/.test(m)));
  // The fork: a diamond (64 pt) and two more is over the SE's budget, so a box that fits the budget but not its own continues.
  const i = inputs();
  const fork = 'trail.deer_lake_rim.fork';
  // Seven lines on the SE fit the budget's three 52-pt choices; with the diamond's 12 pt more, six lines and a bit: it continues.
  let words = '';
  for (let n = 1; n < 40; n++) {
    const w = Array.from({ length: n }, () => 'Thunder rolls along the Divide.').join(' ');
    const space = boxSpace(T02_CASES[0], { choices: 3 });
    const fits = (s, sp) => {
      const m = (x) => FACES.pixelify.advance && Array.from(x).reduce((t, ch) => t + FACES.pixelify.advance(ch.codePointAt(0)) * 20 / 1000, 0);
      let lines = 1;
      let row = '';
      for (const word of s.split(' ')) {
        const next = row ? `${row} ${word}` : word;
        if (m(next) > sp.width - 1) {
          lines++;
          row = word;
        } else row = next;
      }
      return lines * 26 <= sp.height + 0.5;
    };
    if (fits(w, space) && !fits(w, boxSpace(T02_CASES[0], { choices: 3, tall: 1 }))) {
      words = w;
      break;
    }
  }
  assert.ok(words, 'a box that fits the budget and not the diamond');
  const b = lintT02(plant(i, fork, words));
  assert.ok(warns(b).some((m) => /^T02b deer_lake_rim\.fork at 375 x 667 \(SE\) with its own 3 choices \(1 tall\).*: it continues/.test(m)), warns(b).join('\n'));
  assert.ok(!errors(b).some((m) => /fork at 375/.test(m)), 'not an error on the SE');
  // An outcome's box never continues: its notes and its one button take their room.
  const c = lintT02(plant(inputs(), 'trail.deer_lake_rim.fork.high.shaky', `${LONG} ${LONG}`));
  assert.ok(errors(c).some((m) => /^T02e deer_lake_rim\.high_shaky at 375 x 667 \(SE\) with its own 1 choice \(0 tall\) and its notes/.test(m)), errors(c).join('\n'));
});

test('T02c: at 375 pt a label too wide for one line beside the (i), a tag that pushes a label to line 2 (a 64-pt button), and a diamond\'s line 2 too wide', () => {
  const r = lintT02(plant(inputs(), 'trail.deer_lake_rim.fork.basin', 'Down the stone staircase'));
  assert.ok(errors(r).some((m) => /^T02c deer_lake_rim\.fork: at 375 pt, its label "Down the stone staircase" is \d+\.\d px, wider than the 274\.0 px of one line beside the \(i\)/.test(m)), errors(r).join('\n'));
  const r2 = lintT02(plant(inputs(), 'trail.deer_lake_rim.fork.high.fail', 'struck'));
  assert.ok(errors(r2).some((m) => /^T02c .*its line 2, "35% struck · 0\.7% fatal", is 276\.0 px, wider than the 274\.0 px of line 2/.test(m)), errors(r2).join('\n'));
  // The spec's own numbers (B.1): at 2x a chrome glyph is 12 pt and a rolled choice holds 275 px, 22 characters.
  const l = frameLayout({ ...T02_CASES[0], choices: 3 });
  const chrome = (s) => Array.from(s).length * 8 * l.fp;
  const fit = choiceFit(l, chrome, 'Through the basin', { kind: 'pct', forms: [{ made: '95%', second: null }] }, true);
  assert.equal(fit.inner, 275);
  assert.deepEqual([fit.wraps, fit.tall, fit.problems], [false, false, []], 'Through the basin 95% is 21 with its gap: line 1');
  const wrap = choiceFit(l, chrome, 'Through the stone basin', { kind: 'pct', forms: [{ made: '95%', second: null }] }, true);
  assert.deepEqual([wrap.wraps, wrap.tall], [true, true], 'a tag that doesn\'t fit beside goes to line 2: 64 pt');
  assert.equal(choiceFit(l, chrome, 'Back to the car', { kind: 'sure', forms: [{ made: 'sure', second: null }] }, false).inner, 322, 'no (i)');
  // A real stop's odds are worded at every skill level; a template's in the widest forms.
  const i = inputs();
  const fork = i.rules.stops.deer_lake_rim.stops.find((s) => s.id === 'fork');
  const high = oddsForms(i.text.lines, fork.choices[0], i.rules.odds, 'hit');
  assert.deepEqual(high.forms[0], { made: '65%', second: '35% hit · 0.7% fatal' });
  assert.equal(high.forms.length, 6);
  const basin = oddsForms(i.text.lines, fork.choices[1], i.rules.odds, null);
  assert.deepEqual(basin.forms.map((f) => f.made), ['94%', '95%', '96%', '97%', '98%', '99%'], 'footing 0 to 5: 88 + 2 a level, clamped at 97, with its shaky band');
  const template = oddsForms(i.text.lines, fork.choices[0], { bases: {} }, 'hit');
  assert.deepEqual(template.forms.map((f) => f.second), ['70% hit · 16% fatal', '70% hit · <0.1% fatal']);
  assert.equal(template.forms[0].made, '99%');
});

test('T02d: the caption, every loop place at the widest day and elevation, in two rows, never a hanging dot; a planted long name fails', () => {
  const i = inputs();
  const l = frameLayout({ ...T02_CASES[0], choices: 3 });
  const fills = captionFills(i.text, i.places, (s) => Array.from(s).length * 8 * l.fp);
  assert.ok(fills.length >= 34, `${fills.length} places`);
  assert.ok(fills.some((f) => /^Day 12 ·\u00a0Seven Mile Group Site ·\u00a0\d,\d{3}\u00a0ft$/.test(f.words)), 'the widest day (two digits) and elevation (four, with a comma): every digit is 8 fp in the chrome');
  const name = i.text.names.places.get('place.lunch_lake');
  i.text.names.places.set('place.lunch_lake', { ...name, text: 'Lunch Lake of the Seven Lakes Basin Under Bogachiel Peak' });
  const r = lintT02(i);
  assert.ok(errors(r).some((m) => /^T02d at 375 x 667 \(SE\), lunch_lake's caption takes 3 rows/.test(m)), errors(r).join('\n'));
  // A caption whose dot isn't the bound " · " separator can hang it at a row's end, as S5's did.
  const j = plant(inputs(), 'trail.caption', 'Day {day} . . . . . . . . . . . {place}· {elev}');
  const r2 = lintT02(j);
  assert.ok(errors(r2).some((m) => /^T02d at .*, a row of .*'s caption ends with "·"/.test(m)), errors(r2).join('\n'));
});

test("T02e: a Look too long for the Look box fails; a Why-sheet row too wide for one line at 375 fails; the bands' legend never starts a row with a number; the alt Looks only print", () => {
  const r = lintT02(plant(inputs(), 'look.sign', `${LONG} ${LONG}`));
  assert.ok(errors(r).some((m) => /^T02e at 375 x 667 \(SE\), look\.sign is \d+ lines in a Look box of 5/.test(m)), errors(r).join('\n'));
  const r2 = lintT02(plant(inputs(), 'trail.why.staircase', 'The stone staircase, dry and steep'));
  assert.ok(errors(r2).some((m) => /^T02e the Why sheet's row "The stone staircase, dry and steep \.\.\. 88" is \d+\.\d px, wider than the sheet's 343 px at 375/.test(m)), errors(r2).join('\n'));
  // The bands' legend: each band's word bound to its number, so at 375 its second row starts at a dot, never at a number.
  const i = inputs();
  const legends = whyLegends(i.text, i.rules);
  assert.ok(legends.includes(`clean${NBSP}40 ·${NBSP}shaky${NBSP}25 ·${NBSP}fail${NBSP}35`), legends.join('\n'));
  const se0 = frameLayout({ ...T02_CASES[0], choices: 3 });
  const chrome = (s) => widthOf(FACES.chrome, GEOMETRY.chromeSizeFp * se0.fp, s);
  const inner = Math.min(375, GEOMETRY.sheetMax) - 2 * GEOMETRY.sheetBorder - 2 * GEOMETRY.sheetPadX;
  const unbound = whyLegends(i.text, i.rules, (s) => s).find((s) => s.endsWith('fail 35'));
  assert.equal(breakLines(/** @type {string} */ (unbound), inner, chrome).lines.at(-1), '35', 'unbound, the fail share would sit alone on its row (the review saw it on the SE)');
  assert.deepEqual(breakLines(legends.find((s) => s.endsWith(`fail${NBSP}35`)), inner, chrome).lines.map((l) => l.replaceAll(NBSP, ' ')), ['clean 40 · shaky 25', '· fail 35']);
  const r3 = lintT02(plant(inputs(), 'trail.why.bands', 'clean {clean} · shaky {shaky} · fail and gone {fail}'));
  assert.deepEqual(errors(r3).filter((m) => /legend/.test(m)), [], 'bound, a longer legend still keeps each number with its word');
  // The Look box at the SE: 5 lines (168 rows, less 3 fp above and below, less a box's border and padding); 290 px wide.
  const se = frameLayout({ ...T02_CASES[0], choices: 3 });
  const look = lookSpace(se);
  assert.deepEqual([look.width, Math.floor(look.height / look.line)], [320 - 20 * se.fp, 5]);
});

test('T02f: a box that would continue under Larger Text xxxLarge (Literata at 23 px) on the SE is a warning, never an error', () => {
  // Six lines of Pixelify on the SE (it holds seven), but more than the five lines of Literata at 23 px it holds in Plain.
  const r = lintT02(plant(inputs(), 'trail.deer_lake_rim.rim', LONG));
  assert.deepEqual(errors(r), []);
  assert.ok(warns(r).some((m) => new RegExp(`^T02f deer_lake_rim\\.rim on the SE under Larger Text xxxLarge \\(Literata ${XXXL_PX} px\\): \\d+ lines in \\d+, so it continues`).test(m)), warns(r).join('\n'));
});

test('a character the face has no glyph for fails (a browser would fall back to another font); a word wider than its line fails', () => {
  const r = lintT02(plant(inputs(), 'trail.deer_lake_rim.rim', 'A snowflake ❄ on the rim.'));
  assert.ok(errors(r).some((m) => /sets "❄" \(U\+2744\), which its face has no glyph for/.test(m)), errors(r).join('\n'));
  const r2 = lintT02(plant(inputs(), 'trail.deer_lake_rim.rim', 'Supercalifragilisticexpialidociousness-and-more-of-it'));
  assert.ok(errors(r2).some((m) => /^T02a ".*" is wider than a line/.test(m)), errors(r2).join('\n'));
});

test("the lengths T02 reads are the stylesheets' own: the box's font, border and padding, the chrome's size, the caption's padding, the choice row, the tag, the diamond, the Look box's inset and height, the notes, the sheet", () => {
  const rule = (css, sel) => {
    const at = css.indexOf(`\n${sel} {`);
    assert.ok(at >= 0, `${sel}`);
    return css.slice(at, css.indexOf('}', at));
  };
  assert.match(rule(FRAME_CSS, '.frame .game-box'), new RegExp(`font-size: ${GEOMETRY.boxPx}px;`));
  assert.match(rule(FRAME_CSS, '.frame .game-box'), new RegExp(`padding: calc\\(3 \\* var\\(--fp\\)\\) calc\\(${GEOMETRY.boxPadXFp} \\* var\\(--fp\\)\\);`));
  assert.equal(BOX_CHROME_FP, 2 * GEOMETRY.boxBorderFp + 2 * 3, "the box's border and its 3-fp padding, top and bottom");
  assert.match(FRAME_CSS, new RegExp(`--chrome-border: calc\\(${GEOMETRY.boxBorderFp} \\* var\\(--fp\\)\\) double var\\(--c9\\);`));
  assert.match(FRAME_CSS, new RegExp(`--chrome-size: calc\\(${GEOMETRY.chromeSizeFp} \\* var\\(--fp\\)\\);`));
  assert.match(FRAME_CSS, new RegExp(`\\.frame \\.game-box p \\+ p \\{ margin-top: ${GEOMETRY.paraGap}px; \\}`));
  assert.match(rule(FRAME_CSS, '.frame-caption'), new RegExp(`padding: 0 calc\\(${GEOMETRY.chromePadFp} \\* var\\(--fp\\)\\);`));
  assert.match(rule(FRAME_CSS, '.frame .choice'), new RegExp(`padding: 0 calc\\(${GEOMETRY.boxPadXFp} \\* var\\(--fp\\)\\);`));
  assert.match(rule(FRAME_CSS, '.choice-row'), new RegExp(`gap: calc\\(${GEOMETRY.rowGapFp} \\* var\\(--fp\\)\\);`));
  assert.match(rule(FRAME_CSS, '.choice-info'), new RegExp(`width: ${GEOMETRY.infoPt}px;`));
  assert.match(rule(FRAME_CSS, '.choice-head'), new RegExp(`column-gap: calc\\(${GEOMETRY.tagGapFp} \\* var\\(--fp\\)\\);`));
  assert.match(rule(FRAME_CSS, '.choice-tag'), new RegExp(`gap: calc\\(${GEOMETRY.glyphGapFp} \\* var\\(--fp\\)\\);`));
  assert.match(rule(FRAME_CSS, '.diamond-glyph'), new RegExp(`width: calc\\(${GEOMETRY.diamondFp} \\* var\\(--fp\\)\\);`));
  const look = rule(FRAME_CSS, '.look-box');
  assert.match(look, new RegExp(`left: calc\\(var\\(--mat, 0px\\) \\+ ${GEOMETRY.lookInsetFp} \\* var\\(--fp\\)\\);`));
  assert.match(look, new RegExp(`bottom: calc\\(${GEOMETRY.lookInsetFp} \\* var\\(--fp\\)\\);`));
  assert.match(look, new RegExp(`max-height: calc\\(100% - ${2 * GEOMETRY.lookInsetFp} \\* var\\(--fp\\)\\);`));
  assert.match(look, new RegExp(`padding: calc\\(3 \\* var\\(--fp\\)\\) calc\\(${GEOMETRY.boxPadXFp} \\* var\\(--fp\\)\\);`));
  assert.match(look, /font: 20px\/26px var\(--font-pixel\);/);
  assert.match(rule(FRAME_CSS, '.ornament'), new RegExp(`width: calc\\(${GEOMETRY.ornamentFp} \\* var\\(--fp\\)\\);`));
  assert.match(rule(FRAME_CSS, '.outcome-notes'), new RegExp(`gap: calc\\(${GEOMETRY.notesGapFp} \\* var\\(--fp\\)\\);`));
  assert.match(rule(FRAME_CSS, '.pencil-glyph'), new RegExp(`width: calc\\(${GEOMETRY.pencilFp} \\* var\\(--fp\\)\\);`));
  assert.match(rule(FRAME_CSS, '.pencil-row'), new RegExp(`gap: calc\\(${GEOMETRY.pencilGapFp} \\* var\\(--fp\\)\\);`));
  assert.match(rule(FRAME_CSS, '.why-dots'), new RegExp(`min-width: calc\\(${GEOMETRY.dotsFp} \\* var\\(--fp\\)\\);\\n {2}margin: 0 calc\\(${GEOMETRY.dotsMarginFp} \\* var\\(--fp\\)\\);`));
  assert.match(rule(GAME_CSS, '.sheet'), new RegExp(`max-width: ${GEOMETRY.sheetMax}px;`));
  assert.match(rule(GAME_CSS, '.sheet'), new RegExp(`padding: 14px ${GEOMETRY.sheetPadX}px calc\\(14px \\+ var\\(--safe-bottom\\)\\);`));
  assert.match(rule(GAME_CSS, '.box'), new RegExp(`border: ${GEOMETRY.sheetBorder}px double var\\(--box-border\\);`));
});

test('the space comes from frameLayout itself, with the mat: the SE\'s box is 322 px wide inside, the 15\'s 358; the stops as drawn', () => {
  const se = boxSpace(T02_CASES[0], { choices: 3 });
  const p15 = boxSpace(T02_CASES[1], { choices: 4 });
  assert.equal(se.width, 343 - 9 - 12);
  // The 15's column is the picture and its keyline (374 + 2 fp, wider than 393 - 32), less 3 fp of border and 4 of padding each side.
  assert.ok(Math.abs(p15.width - 358) < 1e-9, `${p15.width}`);
  assert.equal(Math.floor(se.height / 26), 7);
  const i = inputs();
  const stops = drawnStops(i.text, i.rules, i.voice);
  const fork = stops.find((s) => s.id === 'fork');
  assert.deepEqual(fork.choices.map((c) => [c.label, c.odds.kind, c.info]), [['Stay high', 'diamond', true], ['Through the basin', 'pct', true], ['Back to the car', 'sure', false]]);
  assert.equal(fork.intro, 'trail.odds.intro.fatal', 'its most serious form first (lead call 3)');
  const shaky = stops.find((s) => s.id === 'high_shaky');
  assert.deepEqual([shaky.outcome, shaky.pencil], ['mishap', ['Heart Lake at 12:59 pm', 'Time +20 min']]);
  assert.equal(stops.find((s) => s.id === 'high_fatal').choices[0].id, 'trail.next', "a death box's one button is Next");
  assert.equal(wordsFor(i.text.lines, { id: 'nowhere' }), null);
});
