// The trail stop (BUILD_PLAN S5 track A; GAME_DESIGN 12.1, 12.2, 11.9): the
// space check for every phone, the frame's DOM on the tiny DOM in
// textfix.mjs, the cues, the (i) square, the quiet stop, the toolbar's fold
// into ≡, the stamps moving into ≡ (and still opening the debug menu), the
// hour, the caption, the strip, the dev routes and the check view, and
// main's page never reaching any of it. Against real builds of both
// channels (their data and words), as game.test.mjs does.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, posix, basename } from 'node:path';
import { build } from '../../tools/build.mjs';
import { ROOT } from '../../tools/pics.mjs';
import { selfcheckCorpus } from '../../tools/goldens.mjs';
import { fakeDocument } from './textfix.mjs';
import { setBundle, t as words, NBSP } from '../../web/js/text.js';
import { setChannel } from '../../web/js/platform/storage.js';
import { fmtInt, fmtTenths, feet, mileMarker } from '../../web/js/fmt.js';
import {
  frameLayout,
  fontPixel,
  hourOf,
  renderFrame,
  picturePlan,
  fixtureScreen,
  scenePics,
  remapFor,
  stubSound,
  savedHour,
  registerFrameDev,
  STAND_IN,
  HOURS,
  TRIP_HOURS,
  plainSizeOf,
  showScenes,
  hideScenes,
  SCENES_FALLBACK_NODE,
  STATUS_PT,
  KEYLINE_FP,
  CAPTION_PT,
  CAPTION_ROWS,
  CHROME_ROW_FP,
  STRIP_PT,
  CHOICE_PT,
  CHOICE_GAP_PT,
  CHOICES_FOOT_PT,
  TOOLBAR_PT,
  BOX_LINE_PT,
  BOX_CHROME_FP,
  BOX_GAP_FP,
  PLAIN_LINE,
  PLAIN_CHOICE_CHROME_FP,
} from '../../web/js/ui/frame.js';
import { FORCED_PLAIN_PX } from '../../web/js/ui/textsize.js';
import { breakLines } from '../../tools/fontmetrics.mjs';
import { stripProfile, stripPixels, elevAt, STRIP_SLOTS, STRIP_WIDTH, STRIP_HEIGHT, PLOT_WIDTH } from '../../web/js/ui/strip.js';
import { cueFor } from '../../web/js/ui/choices.js';
import { compose, drawable } from '../../web/js/gfx/compose.js';
import { PALETTE, REMAPS } from '../../web/js/gfx/palette.js';
import { contrastRatio } from '../../tools/color.mjs';
import { boxFits, checkBox } from '../../web/js/ui/textbox.js';
import { TOOLBAR } from '../../web/js/ui/toolbar.js';
import { createMenu } from '../../web/js/ui/menu.js';
import { devRoute, devSession, memoryStore, startGame, DEV_HIKER, TAP_GUARD_MS } from '../../web/js/ui/app.js';
import { initDebug, debugMode, devRegistry, opensTrail } from '../../web/js/ui/debug.js';
import { runCheck, resetCheck } from '../../web/js/ui/selfcheck.js';
import { loadContent, newSession, dispatch } from '../../web/js/engine/api.js';
import { lockboxActs } from '../../web/js/engine/selfcheck.js';

// ---- Builds of both channels ---------------------------------------------

const tmp = mkdtempSync(join(tmpdir(), 'oph-frame-'));
const out = {};
for (const channel of ['preview', 'main']) {
  out[channel] = join(tmp, channel);
  build({ out: out[channel], channel, quiet: true });
}
test.after(() => rmSync(tmp, { recursive: true, force: true }));
const readOut = (channel, f) => readFileSync(join(out[channel], f), 'utf8');
const RULES_HASH = JSON.parse(readOut('preview', 'version.json')).rules;
const WORDS = JSON.parse(readOut('preview', 'text/en.json'));
const RULES = JSON.parse(readOut('preview', 'data/rules.json'));
const VOICE = JSON.parse(readOut('preview', 'data/voice.json'));
const PARK = RULES.park;
const CSS = readFileSync(join(ROOT, 'web', 'css', 'frame.css'), 'utf8');
const GOLDEN = JSON.parse(readFileSync(join(ROOT, 'test', 'golden', 'park', 'm1a.json'), 'utf8'));
const content = () => loadContent({ rules: JSON.parse(readOut('preview', 'data/rules.json')), voice: JSON.parse(readOut('preview', 'data/voice.json')), rulesHash: RULES_HASH });

/** fetch() for the preview build's data/ (and nothing else: no art). */
async function fetchFn(url) {
  try {
    const body = readOut('preview', join('data', basename(url.pathname)));
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

/** Preview's channel, words and a fresh localStorage for one test. */
function device(t) {
  const ls = fakeStorage();
  const had = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: ls });
  setChannel('preview');
  setBundle(WORDS, {}, 'preview');
  t.after(() => {
    if (had) Object.defineProperty(globalThis, 'localStorage', had);
    else delete globalThis.localStorage;
    setChannel(null);
    setBundle({}, {}, null);
  });
  return ls;
}

/** A sound that records what it is asked to play. */
function fakeSound() {
  let on = true;
  const played = [];
  return {
    played,
    play: (cue) => played.push(cue),
    isOn: () => on,
    setOn: (v) => {
      on = v;
      played.push(v ? 'on' : 'off');
    },
  };
}

/** A tiny DOM document for the frame: SVG elements as plain ones, an optional window. */
function frameDoc({ win = null, channel = 'preview', screens = 'app debug guestbook map title trail' } = {}) {
  const doc = fakeDocument();
  doc.createElementNS = (_ns, tag) => doc.createElement(tag);
  doc.documentElement.setAttribute('data-channel', channel);
  doc.documentElement.setAttribute('data-screens', screens);
  if (win) doc.defaultView = { addEventListener() {}, removeEventListener() {}, ...win };
  return doc;
}

/** A phone as a window: its viewport, screen and pixel ratio. */
const phone = (width, height, dpr, usable = height) => ({ innerWidth: width, innerHeight: usable, devicePixelRatio: dpr, screen: { width, height } });

/** A stop screen through the real engine: Robin, the sample, Walk on n times. */
function stopScreen(n = 0) {
  const c = content();
  let s = newSession(c);
  for (const a of lockboxActs('K7QM2Q9F', c)) s = dispatch(s, a, c).session;
  s = dispatch(s, { t: 'sign', name: 'Robin', id: 'h00000001' }, c).session;
  let r = dispatch(s, { t: 'start', plan: 'sample', seed: 'K7QM2Q9F' }, c);
  for (let i = 0; i < n; i++) r = dispatch(r.session, { t: 'next' }, c);
  return { content: c, session: r.session, screen: r.screen };
}

/** The frame's context for a stop. */
function ctxFor(c, screen, extra = {}) {
  const v = c.voice(screen.stop.set, screen.stop.id);
  return { park: c.park(), view: v.view, day: 1, hour: 'day', art: null, palette: null, composer: null, sound: fakeSound(), menu: createMenu(extra.doc), ...extra };
}

const classes = (el) => el.children.map((c) => c.className);

// ---- The space check (12.1; BUILD_PLAN S5 3.2) ----------------------------

/**
 * [name, width, height, dpr, safe top, safe bottom, shape, picture, toolbar,
 * box row (3 choices), whole lines of box text, the mat each side]. The box
 * row is 1fr less nothing; the box itself is 4 fp shorter (2 above, 2
 * below), and its border and padding take 12 fp more, so the lines are
 * whole 26-pt lines of what is left (the next one is clipped, as in a
 * browser). Re-pinned in S6: the picture's keyline (1 fp above and below)
 * takes its 2 fp from the box row (S5's were 240, 221, 190, 246, 266 and
 * 213), and no phone loses a line.
 */
const PHONES = [
  ['iPhone 17', 402, 874, 3, 62, 34, [7, 4], [374, 224], 50, 240 - 8 / 3, 8, 0],
  ['iPhone 15/16', 393, 852, 3, 59, 34, [7, 4], [374, 224], 50, 221 - 8 / 3, 7, 0],
  ['13 mini', 375, 812, 3, 50, 34, [6, 4], [320, 224], 50, 190 - 8 / 3, 6, 10],
  ['iPhone 11 / XR', 414, 896, 2, 48, 34, [5, 3], [400, 252], 50, 246 - 3, 8, 0],
  ['Pro Max', 440, 956, 3, 62, 34, [8, 5], [427, 280], 50, 266 - 8 / 3, 9, 0],
  ['SE (short)', 375, 667, 2, 20, 0, [4, 2], [320, 168], 0, 213 - 3, 7, 10],
];
const near = (a, b) => Math.abs(a - b) < 1e-9;

test('the space check: every phone of 3.2, row by row, with three choices and with one', () => {
  for (const [name, width, height, dpr, safeTop, safeBottom, shape, pic, toolbar, box, lines] of PHONES) {
    const l = frameLayout({ width, height, dpr, safeTop, safeBottom, choices: 3 });
    assert.deepEqual([l.shape.sx, l.shape.sy], shape, `${name}: the pixel`);
    assert.deepEqual([l.picture.width, l.picture.height], pic, `${name}: the picture`);
    assert.equal(l.short, height < 700, `${name}: short`);
    const caption = dpr >= 3 ? 40 : 42;
    // Three choices: 3 x 52 + 2 x 8, and the list's 6 under the last; the picture's row is the picture and its keyline (S6).
    const { box: gotBox, ...rest } = l.rows;
    assert.deepEqual(rest, { status: 22, picture: pic[1] + 2 * l.fp, caption, strip: 24, choices: 178, toolbar }, `${name}: the rows`);
    assert.ok(near(gotBox, box), `${name}: the box row, ${gotBox}`);
    assert.ok(near(Object.values(l.rows).reduce((a, b) => a + b, 0), height - safeTop - safeBottom), `${name}: the rows fill the screen`);
    assert.ok(near(l.box, box - 4 * l.fp), `${name}: the box is 2 fp clear of the strip and of the choices`);
    assert.equal(l.boxLines, lines, `${name}: ${lines} whole lines`);
    assert.equal(l.boxLines, Math.floor((l.box - 12 * l.fp) / 26), `${name}: whole lines, never rounded up`);
    assert.ok(l.rows.box >= 78, `${name}: never under three lines of box`);
    assert.ok(l.boxLines >= 3, `${name}: three whole lines at least, border and padding in`);
    assert.equal(l.column, Math.max(pic[0] + 2 * l.fp, width - 32), `${name}: the column, the picture and its keyline at least`);
    // Re-pinned in S6: the keyline is 1 fp (4/3 px on 3x), so the picture starts on a whole device pixel, the column on a whole CSS pixel.
    assert.ok(Number.isInteger(l.x.column) && near(Math.round(l.x.picture * dpr), l.x.picture * dpr), `${name}: left edges on whole pixels`);
    const one = frameLayout({ width, height, dpr, safeTop, safeBottom, choices: 1 });
    assert.ok(near(one.rows.box, box + 120), `${name}: Walk on alone gives the box 120 pt more`);
    assert.deepEqual(one.picture, l.picture, `${name}: the picture never moves with the choices`);
  }
  assert.deepEqual([fontPixel(3), fontPixel(2), fontPixel(1)], [4 / 3, 1.5, 2], 'a font pixel: 4 device px on 3x, 3 on 2x');
});

test("the picture's mat (S6, lead call 2): a slate keyline as wide as the column, so every edge aligns on all six phones, and the picture inside it on a whole device pixel", () => {
  assert.equal(KEYLINE_FP, 1);
  for (const [name, width, height, dpr, safeTop, safeBottom, , pic, , , , mat] of PHONES) {
    const l = frameLayout({ width, height, dpr, safeTop, safeBottom });
    // The keyline's block is the column: its left edge is the status line's, the caption's, the box's and the choices' (all at --col-x, frame.css).
    assert.equal(l.keyline, l.fp, `${name}: the keyline, one font pixel`);
    assert.equal(l.mat, mat, `${name}: the mat each side`);
    assert.ok(near(Math.round(l.mat * dpr), l.mat * dpr), `${name}: the mat is whole device pixels`);
    assert.ok(near(l.x.picture, l.x.column + l.keyline + l.mat), `${name}: the picture inside the keyline and the mat`);
    assert.ok(near(Math.round(l.x.picture * dpr), l.x.picture * dpr), `${name}: the canvas starts on a whole device pixel`);
    // Centered: the ink either side differs by less than a device pixel each way, and the picture fits.
    const spare = l.column - 2 * l.keyline - pic[0] - 2 * l.mat;
    assert.ok(spare > -1e-9 && spare < 2 / dpr, `${name}: centered (${spare} px over)`);
    // The column's right edge is on a whole device pixel too.
    assert.ok(near(Math.round((l.x.column + l.column) * dpr), (l.x.column + l.column) * dpr), `${name}: the right edge`);
  }
  // The SE and the 13 mini: a 320-pt picture in a 343-pt column, about 10 pt of mat each side (S5's 11.5-pt overhang).
  assert.deepEqual(PHONES.filter((p) => p[11] > 0).map((p) => p[0]), ['13 mini', 'SE (short)']);
  // frame.css draws it: the figure is a column-wide block at --col-x (no --pic-x of its own), a 1-fp slate border, an ink mat, the picture at --mat.
  const fig = CSS.slice(CSS.indexOf('\n.frame-picture {'), CSS.indexOf('}', CSS.indexOf('\n.frame-picture {')));
  assert.match(fig, /box-sizing: border-box;/);
  assert.match(fig, /margin: 0 0 0 var\(--col-x\);/);
  assert.match(fig, /padding: 0 0 0 var\(--mat, 0px\);/);
  assert.match(fig, /border: calc\(1 \* var\(--fp\)\) solid var\(--c2\);/);
  assert.match(fig, /background: var\(--c0\);/);
  assert.match(CSS, /\.frame > \* \{\n\s+width: var\(--col\);\n\s+max-width: 100%;\n\s+margin-left: var\(--col-x\);/, "every row is the column's width, at its edge");
  assert.equal([...CSS.matchAll(/margin-left: var\(--pic-x\)/g)].length, 1, 'only the strip keeps to the picture');
  // At night the sky's top is ink, as the page is; the slate keyline stands off it, 2.04:1.
  assert.equal(REMAPS.night[2], 0, "a night sky's top is ink");
  assert.equal(contrastRatio(PALETTE[2], PALETTE[0]).toFixed(2), '2.04');
});

test('the caption never hangs a "·" at a row\'s end (S6): its separators bind to what follows, so on all six phones, for every place it can name, a row breaks before a dot, never after it', () => {
  // The chrome font: monospace, every advance 8 font pixels (tools/fontbuild.mjs). The caption: the column less 2 fp each side, two rows.
  // The line breaker is T02's (tools/fontmetrics.mjs, S6 track C): greedy; a break after a space (it hangs), never at a
  // no-break space; 1 px of slack. A row of n characters is 8n fp wide.
  const rowsOf = (text, l) => breakLines(text, l.column - 4 * l.fp, (s) => Array.from(s).length * 8 * l.fp).lines;
  const places = Object.keys(WORDS).filter((id) => id.startsWith('place.') && PARK.nodes[id.slice(6)] && Number.isFinite(PARK.nodes[id.slice(6)].elev_ft));
  assert.ok(places.length >= 34, `the loop's places with an elevation (S5: 34): ${places.length}`);
  setBundle(WORDS, {}, 'preview');
  const captions = places.flatMap((id) => [1, 12].map((day) => words('trail.caption', { day, place: { id }, elev: feet(PARK.nodes[id.slice(6)].elev_ft) })));
  setBundle({}, {}, null);
  let hung = 0;
  for (const [name, width, height, dpr, safeTop, safeBottom] of PHONES) {
    const l = frameLayout({ width, height, dpr, safeTop, safeBottom });
    for (const c of captions) {
      for (const row of rowsOf(c, l)) assert.ok(!row.endsWith('·'), `${name}: "${row}" hangs a dot (${c})`);
      // As S5 showed it, with plain spaces, a row could end on the dot.
      if (rowsOf(c.replaceAll(NBSP, ' '), l).some((row) => row.endsWith('·'))) hung++;
    }
  }
  assert.ok(hung > 0, "S5's captions hung a dot somewhere: the check bites");
  // The rim on the SE, S5's own case: the dot now starts the second row with the elevation.
  const se = frameLayout({ width: 375, height: 667, dpr: 2, safeTop: 20 });
  setBundle(WORDS, {}, 'preview');
  const rim = words('trail.caption', { day: 1, place: { id: 'place.seven_lakes_basin' }, elev: feet(4900) });
  setBundle({}, {}, null);
  assert.deepEqual(rowsOf(rim, se), [`Day 1 ·${NBSP}Seven Lakes Basin`, `·${NBSP}4,900${NBSP}ft`]);
});

test("frame.css and the space check agree: every length frameLayout counts is frame.css's own", () => {
  const rule = (sel) => {
    const at = CSS.indexOf(`\n${sel} {`);
    assert.ok(at >= 0, `frame.css has ${sel}`);
    return CSS.slice(at, CSS.indexOf('}', at));
  };
  const px = (block, prop) => {
    const m = block.match(new RegExp(`\\n\\s+${prop}: (\\d+)px;`));
    assert.ok(m, `${prop} in px`);
    return Number(m[1]);
  };
  const fps = (block, prop) => {
    const m = block.match(new RegExp(`\\n\\s+${prop}: (.+);`));
    assert.ok(m, prop);
    return [...m[1].matchAll(/calc\((?:100% - )?(\d+) \* var\(--fp\)\)/g)].map((x) => Number(x[1]));
  };
  // The grid: status, picture, caption, strip, box, choices, toolbar.
  const grid = rule('.game-screen.frame');
  assert.match(grid, new RegExp(`grid-template-rows: ${STATUS_PT}px auto max\\(${CAPTION_PT}px, calc\\(${CAPTION_ROWS * CHROME_ROW_FP} \\* var\\(--fp\\)\\)\\) ${STRIP_PT}px minmax\\(0, 1fr\\) auto auto;`));
  assert.equal(px(rule('.status-line'), 'height'), STATUS_PT);
  assert.equal(px(rule('.toolbar'), 'height'), TOOLBAR_PT);
  // The choices: 52 tall, 8 apart, 6 under the last.
  const choices = rule('.frame .game-choices');
  assert.equal(px(choices, 'gap'), CHOICE_GAP_PT);
  assert.equal(px(choices, 'padding-bottom'), CHOICES_FOOT_PT);
  const choice = rule('.frame .choice');
  assert.equal(px(choice, 'height'), CHOICE_PT);
  assert.equal(px(choice, 'min-height'), CHOICE_PT);
  // The box: 2 fp below the strip, 4 fp short of its row, 3 fp of border and 3 of padding top and bottom, 26-px lines.
  const box = rule('.frame .game-box');
  assert.deepEqual(fps(box, 'margin-top'), [BOX_GAP_FP]);
  assert.deepEqual(fps(box, 'max-height'), [2 * BOX_GAP_FP]);
  const [padY] = fps(box, 'padding');
  assert.match(box, /\n\s+border: var\(--chrome-border\);/);
  const [border] = fps(rule('.frame'), '--chrome-border');
  assert.equal(2 * (border + padY), BOX_CHROME_FP);
  assert.equal(px(box, 'line-height'), BOX_LINE_PT);
  // Plain: the serif's line, and a choice's border and padding.
  assert.match(CSS, new RegExp(`font-size: var\\(--plain-size, ${FORCED_PLAIN_PX}px\\);\\n\\s+line-height: ${PLAIN_LINE};`));
  const plainChoice = rule('html[data-text="plain"] .frame .choice');
  const [plainPadY] = fps(plainChoice, 'padding');
  assert.equal(2 * (border + plainPadY), PLAIN_CHOICE_CHROME_FP);
});

test('Larger Text: the caption and the choices grow to their words, never cut off; the space check keeps two Plain lines of caption and one of each choice, so the picture shrinks first', () => {
  // frame.css: in Plain the caption's row and each choice are as tall as their words.
  const plainGrid = CSS.match(/html\[data-text="plain"\] \.game-screen\.frame \{\s+grid-template-rows: ([^;]+);/);
  assert.ok(plainGrid, 'Plain has its own rows');
  assert.equal(plainGrid[1], '22px auto minmax(max(40px, calc(28 * var(--fp))), auto) 24px minmax(0, 1fr) auto auto', 'the caption row grows (auto), from the pixel row at least');
  assert.match(CSS, /html\[data-text="plain"\] \.frame-caption \{ max-height: none; overflow: visible; \}/, 'no cap on the caption, and a descender never clipped');
  assert.match(CSS, /html\[data-text="plain"\] \.frame \.choice \{\n\s+height: auto;\n\s+min-height: 52px;[^}]*white-space: normal;/, 'a choice grows to two lines when its label wraps');
  for (const block of CSS.split('}').filter((b) => b.includes('html[data-text="plain"]'))) {
    assert.doesNotMatch(block, /(?<!min-)height: \d+px|overflow: hidden/, 'nothing in Plain is capped');
  }
  // Everything the trail sets in words is in Plain (the spec's C.3): the Why sheet, the diamond's confirm and an outcome's pencil rows too.
  const plainFont = CSS.slice(CSS.indexOf('html[data-text="plain"] .frame .game-box,'));
  const plainSelectors = plainFont.slice(0, plainFont.indexOf('{'));
  for (const sel of ['.why', '.choice-confirm', '.outcome-notes', '.look-box']) assert.ok(plainSelectors.includes(`html[data-text="plain"] ${sel}`), `${sel} in Plain`);
  // A diamond's second line wraps between its shares in Plain, each share whole; the confirm grows to its words.
  assert.match(CSS, /html\[data-text="plain"\] \.choice-odds2 \{ white-space: normal; \}/);
  assert.match(CSS, /html\[data-text="plain"\] \.choice-fail,\nhtml\[data-text="plain"\] \.choice-fatal \{ white-space: nowrap; \}/);
  assert.match(CSS, /html\[data-text="plain"\] \.choice-confirm \{\n\s+height: auto;\n\s+min-height: 64px;/);
  // The space check: two Plain lines of caption and one of each choice, and three of box at least.
  for (const [name, width, height, dpr, safeTop, safeBottom, shape] of PHONES) {
    const pixel = frameLayout({ width, height, dpr, safeTop, safeBottom });
    for (const size of [20, 23, 28, 33, 40, 53]) {
      const l = frameLayout({ width, height, dpr, safeTop, safeBottom, plainPx: size });
      const line = PLAIN_LINE * size;
      assert.equal(l.rows.caption, Math.max(pixel.rows.caption, Math.ceil(2 * line - 1e-6)), `${name} at ${size}: two lines of caption`);
      const choice = Math.max(52, Math.ceil(line + PLAIN_CHOICE_CHROME_FP * l.fp - 1e-6));
      assert.equal(l.rows.choices, 3 * choice + 2 * 8 + 6, `${name} at ${size}: a line of each choice`);
      assert.equal(Object.values(l.rows).reduce((a, b) => a + b, 0), height - safeTop - safeBottom, `${name} at ${size}: the rows fill the screen`);
      assert.equal(l.boxLines, Math.max(0, Math.floor((l.box - 12 * l.fp) / line + 1e-6)), `${name} at ${size}: whole Plain lines`);
      assert.ok(l.picture.height <= pixel.picture.height, `${name} at ${size}: the picture only ever shrinks`);
      // The picture gives way before the box drops under three lines, while it can.
      if (l.shape.sx > 1) assert.ok(l.boxLines >= 3, `${name} at ${size}: three lines of box`);
    }
    // Up to xxxLarge (23 px, not an accessibility size) every phone keeps its picture.
    for (const size of [20, 23]) assert.deepEqual([frameLayout({ width, height, dpr, safeTop, safeBottom, plainPx: size }).shape.sx, frameLayout({ width, height, dpr, safeTop, safeBottom, plainPx: size }).shape.sy], shape, `${name} at ${size}: the same pixel`);
  }
  // The 13 mini at AX2 (33 px) gives up its 6x4 pixel for 5x3, so three lines of box still fit.
  assert.deepEqual(frameLayout({ width: 375, height: 812, dpr: 3, safeTop: 50, safeBottom: 34, plainPx: 33 }).shape, { sx: 5, sy: 3 });
});

test('the frame reads the Plain size from <html>: data-text="plain" and --plain-size, 20 px when unset; null in the pixel fonts', () => {
  const doc = fakeDocument();
  const html = doc.documentElement;
  assert.equal(plainSizeOf(doc, null), null);
  html.setAttribute('data-text', 'pixel');
  assert.equal(plainSizeOf(doc, null), null);
  html.setAttribute('data-text', 'plain');
  assert.equal(plainSizeOf(doc, null), FORCED_PLAIN_PX);
  html.style.setProperty('--plain-size', '28px');
  assert.equal(plainSizeOf(doc, null), 28);
});

test('frame.css: whole font pixels, the 44-pt hit areas below the status line, the (i) square, the fonts by relative URL', () => {
  assert.match(CSS, /:root \{ --fp: 2px; \}/);
  assert.match(CSS, /@media \(min-resolution: 2dppx\) \{ :root \{ --fp: 1\.5px; \} \}/);
  assert.match(CSS, /@media \(min-resolution: 3dppx\) \{ :root \{ --fp: calc\(4px \/ 3\); \} \}/);
  assert.match(CSS, /\.status-menu::after,\n\.status-sound::after \{\n\s+content: "";\n\s+position: absolute;\n\s+inset: 0 -10px -22px;/, '22 pt + 22 below = 44, all of it inside the frame (it clips above its top row)');
  assert.match(CSS, /\.game-screen\.frame \{[^}]*overflow: hidden;/s, 'the frame clips: why the hit areas reach only down');
  assert.match(CSS, /\.status-menu,\n\.status-sound \{\n\s+position: relative;\n\s+z-index: 1;/, 'the hit areas lie over the picture and take the tap');
  // Disabled toolbar items at full strength (iOS dims a disabled button on its own).
  assert.match(CSS, /\.toolbar-item:disabled \{[^}]*color: var\(--c2\);[^}]*opacity: 1;[^}]*-webkit-text-fill-color: currentColor;/s);
  // The check view's ≡ sheet and the debug menu open over the view; the inspector over all of them, the error sheet over that.
  const z = (sel) => Number(CSS.match(new RegExp(`${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{ z-index: (\\d+); \\}`))[1]);
  const sheet = Number(CSS.match(/\.frame-sheet \{[^}]*z-index: (\d+);/s)[1]);
  assert.ok(z('.scrim.menu-scrim') < 10, 'on the trail, the ≡ sheet is under the debug menu (10)');
  assert.ok(z('body:has(> .frame-sheet) > .scrim.menu-scrim') > sheet, 'in the check view, ≡ over the view');
  assert.ok(z('body:has(> .frame-sheet) > .scrim.debug') > z('body:has(> .frame-sheet) > .scrim.menu-scrim'), 'and the debug menu over ≡');
  assert.ok(z('.inspect-scrim') > z('body:has(> .frame-sheet) > .scrim.debug') && z('.inspect-scrim') < 20, 'the inspector over all of them, under the error sheet (20)');
  // While the inspector listens, words never start iOS's selection or callout (fields stay editable).
  assert.match(CSS, /html\[data-inspect\] :is\(\[data-t\], \[data-t-aria\], \[data-t-attr\]\):not\(input, textarea, \.inspect \*\) \{\n\s+-webkit-touch-callout: none;\n\s+user-select: none;\n\s+-webkit-user-select: none;/);
  assert.match(CSS, /\.status-line \{[^}]*height: 22px;[^}]*-webkit-touch-callout: none;[^}]*user-select: none;/s);
  assert.match(CSS, /\.choice-info \{[^}]*width: 44px;[^}]*height: 44px;/s);
  assert.match(CSS, /--chrome-border: calc\(3 \* var\(--fp\)\) double var\(--c9\);/, 'the Sierra border: 3 font pixels, double, brick');
  assert.match(CSS, /\.frame \.game-box \{[^}]*border: var\(--chrome-border\);[^}]*font-size: 20px;[^}]*line-height: 26px;/s);
  assert.match(CSS, /src: url\("\.\.\/fonts\/OPHChrome\.ttf"\) format\("truetype"\)/);
  assert.match(CSS, /src: url\("\.\.\/fonts\/Literata\.woff2"\) format\("woff2"\)/);
  assert.match(CSS, /src: url\("\.\.\/fonts\/Literata-Italic\.woff2"\) format\("woff2"\)/);
  assert.match(CSS, /html\[data-text="plain"\] \.frame \.game-box,/);
  // Every font-pixel length is a whole number of them.
  for (const m of CSS.matchAll(/calc\(([\d.]+) \* var\(--fp\)\)/g)) assert.ok(Number.isInteger(Number(m[1])), `calc(${m[1]} * var(--fp))`);
});

/** A stylesheet's innermost rule blocks, comments stripped: [{sel, body}] (an @media's rules come out on their own). */
function cssBlocks(css) {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));
}

test("every font shorthand turns Pixelify's ligatures back off (the shorthand resets them, and its fi draws like an A: firs read Ars)", () => {
  let n = 0;
  for (const f of ['tokens.css', 'game.css', 'frame.css']) {
    const css = readFileSync(join(ROOT, 'web', 'css', f), 'utf8');
    for (const { sel, body } of cssBlocks(css)) {
      const at = body.search(/(?:^|[;\s])font:\s/);
      if (at < 0) continue;
      n++;
      const after = body.slice(at);
      assert.match(after, /\bfont-variant-ligatures: none;/, `${f} ${sel}: font-variant-ligatures: none after its font shorthand`);
      assert.match(after, /\bfont-feature-settings: "liga" 0, "clig" 0;/, `${f} ${sel}: font-feature-settings "liga" 0, "clig" 0 after its font shorthand`);
    }
  }
  assert.ok(n >= 12, `the shorthands were found (${n})`);
  const words = cssBlocks(CSS).find((b) => b.sel === '.inspect .inspect-words');
  assert.ok(words && /font: 20px\/26px var\(--font-pixel\);/.test(words.body), "the inspector card's words, where the creator reads them to approve them");
});

test("codes read off the phone use the build stamp's face, where a 5 never reads as an S or a B as an 8", () => {
  const tokens = readFileSync(join(ROOT, 'web', 'css', 'tokens.css'), 'utf8');
  const game = readFileSync(join(ROOT, 'web', 'css', 'game.css'), 'utf8');
  assert.match(tokens, /--font-code: ui-monospace, "SF Mono", Menlo, monospace;/);
  const face = (css, sel) => {
    const b = cssBlocks(css).find((x) => x.sel === sel);
    assert.ok(b, `a rule for ${sel}`);
    return /font(?:-family)?:[^;]*var\(--font-code\)/.test(b.body);
  };
  assert.ok(face(game, '.build-stamp'), "main's build stamp");
  assert.ok(face(game, '.debug-id'), "the debug menu's header: the build code and the channel");
  assert.ok(face(CSS, '.inspect .inspect-id'), "the inspector's id and hash");
  assert.ok(face(CSS, '.inspect .inspect-line,\n.inspect .inspect-ctx'), "the inspector's state, length and batch, and its ctx");
  // One face for codes: no other monospace stack.
  for (const [f, css] of [['game.css', game], ['frame.css', CSS]]) assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g, ''), /ui-monospace/, `${f} names the code face by its token`);
});

// ---- The DOM ----------------------------------------------------------------

test('the frame: the rows in order, the status line named by its ids, Sound pressed with the state, the caption and the strip in words', (t) => {
  device(t);
  const doc = frameDoc();
  const { content: c, screen } = stopScreen(0);
  const host = doc.body.appendChild(doc.createElement('div'));
  host.className = 'game-screen';
  const sound = fakeSound();
  const ctx = ctxFor(c, screen, { doc, sound });
  const f = renderFrame(host, screen, () => {}, ctx);
  assert.deepEqual(classes(host), ['status-line', 'frame-picture', 'frame-caption', 'frame-strip', 'box game-box', 'game-choices', 'toolbar']);
  assert.ok(host.classList.contains('frame'));
  assert.equal(host.getAttribute('data-hour'), 'day');
  const status = host.querySelector('.status-line');
  assert.deepEqual(classes(status), ['status-score', 'status-menu', 'status-sound']);
  assert.equal(status.children[0].textContent, '', 'the score waits for S9');
  const menu = host.querySelector('.status-menu');
  assert.equal(menu.getAttribute('aria-label'), WORDS['trail.status.menu']);
  assert.ok(menu.querySelector('svg'), '≡ is a pixel icon, no letters');
  assert.equal(menu.textContent, '');
  const soundButton = host.querySelector('.status-sound');
  assert.equal(soundButton.getAttribute('data-t'), 'trail.status.sound_on');
  assert.equal(soundButton.textContent, 'Sound:on');
  assert.equal(soundButton.getAttribute('aria-pressed'), 'true');
  soundButton.click();
  assert.deepEqual(sound.played, ['off'], 'the tap sets the sound off, inside the click');
  assert.equal(soundButton.getAttribute('aria-pressed'), 'false');
  assert.equal(soundButton.textContent, 'Sound:off');
  // The caption and the strip's mile.
  const caption = host.querySelector('.frame-caption');
  assert.equal(caption.getAttribute('data-t'), 'trail.caption');
  assert.equal(caption.textContent, `Day 1 ·${NBSP}Deer Lake ·${NBSP}3,530${NBSP}ft`);
  assert.equal(host.querySelector('.strip-mile').textContent, `mi${NBSP}3.7`);
  assert.equal(host.querySelector('.strip-mile').getAttribute('data-t'), 'fmt.mile_marker', "the mile marker is its format's own line");
  assert.equal(host.querySelector('canvas.picture').getAttribute('aria-hidden'), 'true');
  assert.equal(host.querySelector('canvas.strip').getAttribute('aria-hidden'), 'true');
  // The box and the toolbar.
  assert.equal(f.focus, f.box, 'the box takes focus');
  assert.deepEqual(
    host.querySelectorAll('.toolbar-item').map((b) => [b.getAttribute('data-t'), b.disabled]),
    TOOLBAR.map(([, id]) => [id, true]),
    'Pack, Map and Log, disabled until their modal',
  );
  f.release();
});

test('a number never breaks from its unit: the caption\'s feet and the strip\'s mile come from their formats (fmt.*), bound with a no-break space, and no line types a unit by hand', (t) => {
  device(t);
  // The formats: refs with the number filled, words with plain spaces, shown with no-break ones.
  assert.deepEqual(feet(4900), { id: 'fmt.ft', vars: { ft: '4,900' } });
  assert.deepEqual(mileMarker(69), { id: 'fmt.mile_marker', vars: { mi: '6.9' } });
  assert.deepEqual([WORDS['fmt.ft'], WORDS['fmt.mile_marker']], ['{ft} ft', 'mi {mi}'], 'the tokens keep plain spaces');
  assert.equal(words('fmt.ft', feet(4900).vars), `4,900${NBSP}ft`);
  assert.equal(words('fmt.mile_marker', mileMarker(124).vars), `mi${NBSP}12.4`);
  assert.equal(words('trail.caption', { day: 3, place: { id: 'place.seven_lakes_basin' }, elev: feet(4900) }), `Day 3 ·${NBSP}Seven Lakes Basin ·${NBSP}4,900${NBSP}ft`, 'as a var: the caption breaks only at its own spaces, and before a separator, never after it (S6)');
  assert.equal(words('trail.walk_on'), 'Walk on', "any other line's spaces are as written");
  // Not by hand: no line holds a no-break space, and none but a format sets a unit beside a {var}.
  const text = JSON.parse(readOut('preview', 'text/en.json'));
  for (const [id, w] of Object.entries(text)) {
    for (const form of typeof w === 'string' ? [w] : Object.values(w)) {
      assert.ok(!form.includes(NBSP), `${id}: no no-break space typed in`);
      if (!id.startsWith('fmt.')) assert.doesNotMatch(form, /\}\s*(?:ft|mi|feet|miles?)\b|\b(?:ft|mi)\s*\{/, `${id}: a number's unit comes from its format`);
    }
  }
});

test('the rim: its caption, its mile, and both miles agree with the park goldens (A10)', (t) => {
  device(t);
  const doc = frameDoc();
  const { content: c, screen } = stopScreen(1);
  assert.equal(screen.stop.id, 'rim');
  const host = doc.body.appendChild(doc.createElement('div'));
  renderFrame(host, screen, () => {}, ctxFor(c, screen, { doc }));
  assert.equal(host.querySelector('.frame-caption').textContent, `Day 1 ·${NBSP}Seven Lakes Basin ·${NBSP}4,900${NBSP}ft`);
  assert.equal(host.querySelector('.strip-mile').textContent, `mi${NBSP}6.9`);
  const day = VOICE.stops.deer_lake_rim.rim.view.day;
  const atLake = stripProfile(PARK, day, 'deer_lake').you;
  const atRim = stripProfile(PARK, day, 'seven_lakes_basin').you;
  assert.ok(Math.abs(atLake - GOLDEN.camps.mi10.deer_lake[0]) <= 1, `Deer Lake ${atLake} by the camp table's ccw mile`);
  const rim = GOLDEN.spot_checks.find((s) => s.id === 'rim_to_trailhead');
  assert.ok(Math.abs(atRim - rim.mi10) <= 1, `the rim ${atRim} by the spot check's ${rim.mi10}`);
});

test("a quiet stop has no box, and the caption takes focus (decision 32)", (t) => {
  device(t);
  const doc = frameDoc();
  const { content: c, screen } = stopScreen(0);
  const quiet = { ...screen, box: [] };
  const host = doc.body.appendChild(doc.createElement('div'));
  const f = renderFrame(host, quiet, () => {}, ctxFor(c, quiet, { doc }));
  assert.equal(host.querySelector('.game-box'), null);
  assert.equal(f.box, null);
  const caption = host.querySelector('.frame-caption');
  assert.equal(f.focus, caption);
  assert.equal(caption.getAttribute('tabindex'), '-1');
  assert.deepEqual(classes(host), ['status-line', 'frame-picture', 'frame-caption', 'frame-strip', 'game-choices', 'toolbar']);
});

test('choices: Walk on plays ui.next, a choice ui.tick; the (i) square is its own button, named Why, and never commits the choice', (t) => {
  device(t);
  const doc = frameDoc();
  const { content: c } = stopScreen(0);
  const screen = fixtureScreen();
  const host = doc.body.appendChild(doc.createElement('div'));
  const acts = [];
  const sound = fakeSound();
  renderFrame(host, screen, (a, cue) => acts.push([a.t, cue]), { ...ctxFor(c, { stop: { set: 'deer_lake_rim', id: 'deer_lake' } }, { doc }), sound });
  const list = host.querySelector('.game-choices');
  assert.deepEqual(classes(list), ['box choice', 'box choice', 'choice-row'], 'the choice with info sits in a row with its square');
  const row = list.children[2];
  assert.deepEqual(classes(row), ['box choice', 'box choice-info']);
  const square = row.children[1];
  assert.equal(square.getAttribute('aria-label'), WORDS['trail.choice.why']);
  assert.ok(square.querySelector('svg'), 'a pixel i, no letter');
  assert.equal(square.textContent, '');
  square.click();
  assert.deepEqual(acts, [], 'the square commits nothing');
  assert.deepEqual(sound.played, ['ui.open'], 'it only plays ui.open in S5 (the Why sheet is S6)');
  list.children[0].click();
  row.children[0].click();
  assert.deepEqual(acts, [
    ['next', 'ui.next'],
    ['choose', 'ui.tick'],
  ]);
  assert.equal(cueFor({ t: 'next' }), 'ui.next');
  assert.equal(cueFor({ t: 'choose', c: 'x' }), 'ui.tick');
  // The fixture: three paragraphs from the two sample lines.
  assert.deepEqual(host.querySelectorAll('.game-box p').map((p) => p.getAttribute('data-t')), ['trail.deer_lake_rim.deer_lake', 'trail.deer_lake_rim.rim', 'trail.deer_lake_rim.deer_lake']);
});

test('a short screen folds the toolbar into ≡: no toolbar row, and Pack, Map and Log as the sheet\'s rows; a tall one keeps it', (t) => {
  device(t);
  const { content: c, screen } = stopScreen(0);
  for (const [win, short] of [
    [phone(375, 667, 2), true],
    [phone(402, 874, 3, 778), false],
  ]) {
    const doc = frameDoc({ win });
    const host = doc.body.appendChild(doc.createElement('div'));
    const menu = createMenu(doc);
    renderFrame(host, screen, () => {}, ctxFor(c, screen, { doc, menu }));
    assert.equal(host.getAttribute('data-short'), short ? '1' : '0');
    assert.equal(host.querySelector('.toolbar') === null, short, short ? 'no toolbar' : 'the toolbar');
    const rows = menu.rows.children;
    assert.deepEqual(
      rows.map((b) => [b.getAttribute('data-t'), b.disabled]),
      short ? TOOLBAR.map(([, id]) => [id, true]) : [],
    );
    // The frame's numbers for frame.css.
    const l = frameLayout({ width: win.innerWidth, height: win.screen.height, dpr: win.devicePixelRatio, usable: win.innerHeight });
    assert.equal(host.style.getPropertyValue('--col'), `${l.column}px`);
    assert.equal(host.style.getPropertyValue('--col-x'), `${l.x.column}px`);
    assert.equal(host.style.getPropertyValue('--pic-x'), `${l.x.picture}px`);
    assert.equal(host.style.getPropertyValue('--mat'), `${l.mat}px`, 'the mat (S6)');
  }
});

test('the update note and the stamps move into the ≡ sheet as the same nodes when the game takes the page (S7: the mailbox; it was the first trail draw), five taps on the build code there still open the debug menu, and ≡ opens with ui.open', async (t) => {
  device(t);
  resetCheck();
  await runCheck({ fetchFn: async () => ({ ok: true, status: 200, json: async () => selfcheckCorpus() }) });
  t.after(() => resetCheck());
  const doc = frameDoc();
  const html = doc.documentElement;
  html.setAttribute('data-rules', RULES_HASH);
  html.setAttribute('data-build', '20261012-abc1234');
  const el = (tag, attrs = {}, ...kids) => {
    const e = doc.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    for (const k of kids) e.appendChild(k);
    return e;
  };
  const update = el('div', { class: 'update-note box', id: 'update', hidden: '' }, el('button', { id: 'update-restart', type: 'button' }));
  const install = el('p', { class: 'install', id: 'install' });
  const stamp = el('span', { class: 'build-stamp', id: 'build-stamp' });
  const stamps = el('p', { class: 'stamps' }, el('span', { class: 'offline-stamp', id: 'offline', hidden: '' }), stamp);
  doc.body.appendChild(el('main', { class: 'title-page', id: 'app' }, el('section', { class: 'shelf', id: 'shelf' }, update, install, stamps)));
  initDebug(doc);
  let ms = 1000;
  const now = () => ms;
  const sound = fakeSound();
  const game = await startGame(doc, { fetchFn, now, seed: () => 'K7QM2Q9F', hikerId: () => 'h00000001', sound, later: () => () => {} });
  // S7: at the take-over, already on the first launch's lockbox, the update note and the stamps are in the sheet's foot (the mailbox).
  const foot = game.menu.foot;
  assert.deepEqual(foot.children, [update, stamps], 'moved, the same nodes');
  assert.equal(doc.querySelector('.game-foot').children.includes(install), true, 'the install line stays (home.css shows the footer on the cabin only)');
  // A fresh device opens the lockbox first: Open the lockbox, three answers, Take the key; then the guest book.
  assert.equal(doc.getElementById('app').getAttribute('data-screen'), 'lockbox');
  for (const sel of ['.next-step', '.game-choices .choice', '.game-choices .choice', '.game-choices .choice', '.game-choices .choice']) {
    ms += TAP_GUARD_MS + 1;
    doc.querySelector(sel).click();
  }
  assert.equal(doc.getElementById('app').getAttribute('data-screen'), 'guestbook');
  assert.deepEqual(foot.children, [update, stamps], 'still the same nodes');
  const field = doc.getElementById('gb-name');
  field.value = 'Robin';
  field.dispatchEvent({ type: 'input', isComposing: false });
  ms += TAP_GUARD_MS + 1;
  doc.querySelector('#gb-sign').click();
  assert.equal(doc.getElementById('app').getAttribute('data-screen'), 'home', 'the cabin');
  ms += TAP_GUARD_MS + 1;
  doc.querySelector('.next-step').click();
  assert.equal(doc.getElementById('app').getAttribute('data-screen'), 'trail');
  assert.deepEqual(foot.children, [update, stamps], 'still there, the same nodes');
  sound.played.length = 0;
  // ≡ opens the sheet, with a soft tick.
  doc.querySelector('.status-menu').click();
  assert.equal(game.menu.isOpen(), true);
  assert.deepEqual(sound.played, ['ui.open']);
  // The stamp kept its listener: five quick taps open the debug menu.
  assert.equal(debugMode(), false);
  for (let i = 0; i < 5; i++) stamp.dispatchEvent({ type: 'pointerup', timeStamp: 100 + i * 100 });
  assert.equal(debugMode(), true, 'five taps from inside ≡');
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(doc.querySelector('.debug'), 'the debug menu is built');
  // Its dev section: hour, then text, then (S7) the cabin's sky, then Scenes (preview, with the trail).
  const dev = doc.querySelector('.debug-dev');
  assert.ok(dev, 'the dev section');
  assert.deepEqual(
    dev.children.map((c) => c.getAttribute('data-dev')),
    ['hour', 'text', 'sky', 'scenes', null],
  );
  assert.deepEqual(devRegistry(), { controls: ['hour', 'text', 'sky'], actions: ['scenes'] });
  // The hour control: auto pressed; dusk keeps "dusk" and draws the stop at dusk. S7 adds dawn (the cabin's; the trail draws it with the dusk table).
  const hourButtons = dev.children[0].querySelectorAll('.marks-mode');
  assert.deepEqual(hourButtons.map((b) => b.getAttribute('data-t')), ['dev.hour.auto', 'dev.hour.dawn', 'dev.hour.day', 'dev.hour.dusk', 'dev.hour.blue', 'dev.hour.night']);
  assert.equal(hourButtons[0].getAttribute('aria-pressed'), 'true');
  hourButtons[1].click();
  assert.equal(savedHour(), 'dawn');
  assert.equal(doc.querySelector('.frame').getAttribute('data-hour'), 'dusk', 'dawn on the trail: the dusk table');
  dev.children[0].querySelectorAll('.marks-mode')[3].click();
  assert.equal(savedHour(), 'dusk');
  assert.equal(doc.querySelector('.frame').getAttribute('data-hour'), 'dusk');
  // Walk on: the cue after the guard; a double tap is silent.
  sound.played.length = 0;
  ms += TAP_GUARD_MS + 1;
  doc.querySelector('.game-choices .choice').click();
  doc.querySelector('.game-choices .choice').click();
  assert.deepEqual(sound.played, ['ui.next'], 'Walk on clicks twice (one cue), and the dropped double tap plays nothing');
});

test("main's built menu has no dev section, and main's page never reaches the frame, its fonts or its stylesheet", () => {
  // The gate: main's screens lack the trail.
  const screensOf = (html) => /<html[^>]*\sdata-screens="([^"]*)"/.exec(html)[1];
  const mainDoc = frameDoc({ channel: 'main', screens: screensOf(readOut('main', 'index.html')) });
  assert.equal(opensTrail(mainDoc), false);
  assert.equal(opensTrail(frameDoc({ screens: screensOf(readOut('preview', 'index.html')) })), true);
  const src = readFileSync(join(ROOT, 'web', 'js', 'ui', 'debug.js'), 'utf8');
  assert.match(src, /const dev = preview && opensTrail\(doc\) \?/, 'the dev section is built only behind the gate');
  // No static import from main's page reaches the trail's modules.
  const seen = new Set();
  const walk = (rel) => {
    if (seen.has(rel)) return;
    seen.add(rel);
    const s = readOut('main', rel);
    for (const m of s.matchAll(/^\s*(?:import|export)\s[^;]*?from\s+'([^']+)'/gms)) walk(posix.normalize(posix.join(dirname(rel), m[1])));
    for (const m of s.matchAll(/^import\s+'([^']+)'/gm)) walk(posix.normalize(posix.join(dirname(rel), m[1])));
  };
  walk('js/boot.js');
  walk('js/main.js');
  assert.ok(seen.has('js/ui/debug.js'), `the walk follows imports (${seen.size} modules)`);
  for (const f of ['js/ui/frame.js', 'js/ui/strip.js', 'js/ui/textbox.js', 'js/ui/choices.js', 'js/ui/toolbar.js', 'js/ui/textsize.js', 'js/fmt.js', 'js/ui/app.js']) assert.ok(!seen.has(f), `main never loads ${f}`);
  const page = readOut('main', 'index.html');
  assert.ok(!/frame\.css|OPHChrome|Literata/.test(page), "main's page names none of them");
  // File parity: both channels ship the fonts (main never loads them).
  for (const f of ['fonts/OPHChrome.ttf', 'fonts/OPHChrome-OFL.txt', 'fonts/Literata.woff2', 'fonts/Literata-Italic.woff2', 'fonts/Literata-OFL.txt', 'css/frame.css']) {
    assert.deepEqual(readFileSync(join(out.main, f)), readFileSync(join(out.preview, f)), f);
  }
  const pre = JSON.parse(readOut('preview', 'precache.json'));
  for (const f of ['fonts/OPHChrome.ttf', 'fonts/Literata.woff2', 'css/frame.css', 'js/ui/frame.js']) assert.ok(pre.paths[f], `preview precaches ${f}, so the frame works offline`);
});

// ---- The hour, the picture, the check view ------------------------------

test('the hour: trips 0, 1, 2, 3 give day, dusk, night, day; an override wins; an unknown one falls back', () => {
  const at = (trips) => ({ state: { hiker: { trips } } });
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map((n) => hourOf(at(n))), ['day', 'dusk', 'night', 'day', 'dusk', 'night', 'day']);
  assert.deepEqual(TRIP_HOURS, ['day', 'dusk', 'night']);
  for (const h of HOURS) assert.equal(hourOf(at(1), h), h, `the override ${h}`);
  assert.equal(hourOf(at(1), 'noon'), 'dusk', 'not an hour: the trip count');
  assert.equal(hourOf(at(2), 'auto'), 'night');
  assert.equal(hourOf(null), 'day', 'no hiker yet');
});

test('the picture: the cover stands in until the composer lands; the composer draws the view at the hour, with the hiker; an undrawable place is ink', () => {
  const art = JSON.parse(readOut('preview', 'art/art.json'));
  const view = VOICE.stops.deer_lake_rim.deer_lake.view;
  const stand = picturePlan(view, art, 'night', null);
  assert.deepEqual([stand.place, stand.remap, stand.y0, stand.width, stand.height], [STAND_IN.pic, 'day', STAND_IN.y, 160, 320]);
  assert.ok(STAND_IN.y + 168 <= 320, 'the window is inside the cover');
  assert.equal(picturePlan(view, null, 'day', null), null, 'no art, no picture');
  const calls = [];
  const composer = {
    drawable: (pic) => pic !== 'nowhere',
    compose: (pic, a, o) => {
      calls.push([pic, o.hour, o.sprites]);
      return { ops: [], width: 160, height: 168, key: `${pic}@${o.hour}` };
    },
  };
  const plan = picturePlan(view, art, 'dusk', composer);
  assert.deepEqual([plan.place, plan.remap, plan.y0], ['deer_lake', 'dusk', 0]);
  assert.deepEqual(calls, [['deer_lake', 'dusk', [['hiker', 'idle', 'trail_spot']]]]);
  assert.equal(picturePlan({ pic: 'nowhere' }, art, 'day', composer), null);
  // The tables: until blue hour and night land, the evening hours use dusk's.
  const pal = { remaps: { day: [], dusk: [] } };
  assert.deepEqual(HOURS.map((h) => remapFor(pal, h)), ['day', 'dusk', 'dusk', 'dusk']);
  assert.deepEqual(HOURS.map((h) => remapFor({ remaps: { day: [], dusk: [], blue: [], night: [] } }, h)), HOURS);
  // The check view's pictures.
  assert.deepEqual(scenePics(art, null), [STAND_IN.pic]);
  const withRecipes = { ...art, recipes: { places: { high_divide: {}, deer_lake: {}, nowhere: {} } } };
  assert.deepEqual(scenePics(withRecipes, composer), ['deer_lake', 'high_divide'], 'the drawable places, sorted');
});

test('the #frame check view: every picture it offers is captioned with its own place (a junction, whose label is ours, with none), never another place\'s or a missing-id marker; the ≡ sheet never stays open behind it or after it', (t) => {
  device(t);
  const doc = frameDoc();
  const art = JSON.parse(readOut('preview', 'art/art.json'));
  const composer = { compose, drawable };
  const pics = scenePics(art, composer);
  assert.ok(pics.length >= 20, `${pics.length} pictures`);
  for (const p of ['deer_lake', 'seven_lakes_basin', 'high_divide', 'bogachiel_peak', 'mirror_lake', 'long_lake', 'y_lake']) assert.ok(pics.includes(p), p);
  const menu = createMenu(doc);
  menu.open();
  showScenes(doc, { park: PARK, day: 1, art, palette: null, composer, sound: fakeSound(), menu, onClose() {} });
  assert.equal(menu.isOpen(), false, 'opening the view closes ≡');
  const sheet = doc.getElementById('frame-sheet');
  const pickers = () => sheet.querySelectorAll('.scenes-pics button');
  assert.deepEqual(pickers().map((b) => b.textContent), pics);
  // The fixture picker's words are dev lines (main.off), never ids in code.
  assert.deepEqual(
    sheet.querySelectorAll('.scenes-fixtures button').map((b) => [b.getAttribute('data-t'), b.textContent]),
    [
      ['dev.fixture.three', 'three choices'],
      ['dev.fixture.four', 'four choices'],
    ],
  );
  const own = [];
  for (const pic of pics) {
    pickers()
      .find((b) => b.textContent === pic)
      .click();
    const caption = sheet.querySelector('.frame-caption').textContent;
    assert.doesNotMatch(caption, /⟦|⟧/, `${pic}: ${caption}`);
    const node = PARK.nodes[pic] ? pic : SCENES_FALLBACK_NODE;
    const named = WORDS[`place.${node}`] !== undefined;
    // Lake #8 has no elevation in the research, and a junction whose label is ours no name: no caption, rather than a wrong one (or a throw).
    const elev = PARK.nodes[node].elev_ft;
    assert.equal(caption, named && Number.isFinite(elev) ? `Day 1 ·${NBSP}${WORDS[`place.${node}`]} ·${NBSP}${fmtInt(elev)}${NBSP}ft` : '', pic);
    assert.equal(sheet.querySelector('.frame-caption').getAttribute('data-t'), named && Number.isFinite(elev) ? 'trail.caption' : null);
    if (named) own.push(pic);
  }
  // Every picture with a gazetteer name is captioned with it; only the junctions whose labels are ours are not.
  const gazetteer = JSON.parse(readFileSync(join(ROOT, 'content', 'text', 'names', 'places.json'), 'utf8'));
  assert.deepEqual(
    pics.filter((p) => !own.includes(p)),
    pics.filter((p) => !gazetteer.places[p]),
  );
  assert.ok(pics.filter((p) => !own.includes(p)).every((p) => gazetteer.not_places[p]), 'the rest are labels of ours (T16)');
  pickers()
    .find((b) => b.textContent === 'high_divide')
    .click();
  assert.equal(sheet.querySelector('.frame-caption').textContent, `Day 1 ·${NBSP}High Divide ·${NBSP}5,180${NBSP}ft`, 'the shots of the High Divide name it');
  // ≡ opened from the view's frame closes with the view.
  menu.open();
  assert.equal(hideScenes(doc), true);
  assert.equal(menu.isOpen(), false, '× leaves no ≡ open over the game');
  assert.equal(doc.getElementById('frame-sheet'), null);
});

test('the sound stand-in keeps the Sound state as C\'s facade will: `sound`, "on" or "off", default on', (t) => {
  const ls = device(t);
  const s = stubSound();
  assert.equal(s.isOn(), true);
  s.play('ui.tick');
  assert.equal(ls.map.size, 0, 'playing writes nothing');
  s.setOn(false);
  assert.equal(s.isOn(), false);
  assert.equal(stubSound().isOn(), false, 'kept');
  assert.deepEqual([...ls.map.keys()], ['oph.preview.sound']);
});

// ---- The caption's numbers and the strip --------------------------------

test('fmt: commas every three digits and tenths, ASCII and never the locale', () => {
  assert.deepEqual([0, 7, 999, 1000, 3530, 4900, 12345, 1234567, -1200].map(fmtInt), ['0', '7', '999', '1,000', '3,530', '4,900', '12,345', '1,234,567', '-1,200']);
  assert.equal(fmtInt(3529.6), '3,530');
  assert.deepEqual([0, 7, 37, 69, 104, 1234].map(fmtTenths), ['0.0', '0.7', '3.7', '6.9', '10.4', '123.4']);
  assert.throws(() => fmtInt(NaN));
  assert.throws(() => fmtTenths(3.5));
});

test('the strip: the day by the route, ticks at the camps and landmarks, you on the line; its pixels only ink, navy, paper cream, rust and sage, the label\'s quarter clear', () => {
  const day = ['sol_duc_trailhead', 'seven_lakes_basin'];
  const p = stripProfile(PARK, day, 'deer_lake');
  assert.equal(p.total, 69);
  assert.equal(p.you, 37);
  assert.deepEqual([p.low, p.high], [Math.min(...p.points.map((x) => x.elev)), 4900]);
  assert.deepEqual(p.points[0], { id: 'sol_duc_trailhead', mi10: 0, elev: 1980, type: 'trailhead' });
  assert.ok(p.ticks.includes(37) && p.ticks.includes(69), 'Deer Lake and the rim are ticked');
  assert.equal(elevAt(p.points, 37), 3530);
  assert.equal(elevAt(p.points, 0), 1980);
  const px = stripPixels(p);
  assert.equal(px.length, STRIP_WIDTH * STRIP_HEIGHT);
  assert.deepEqual([...new Set(px)].sort((a, b) => a - b), [...STRIP_SLOTS], 'all five, and nothing else');
  for (let y = 0; y < STRIP_HEIGHT; y++) for (let x = PLOT_WIDTH; x < STRIP_WIDTH; x++) assert.equal(px[y * STRIP_WIDTH + x], 0, `x ${x} is clear for the mile`);
  const youX = Math.round((37 * (PLOT_WIDTH - 1)) / 69);
  const rust = [];
  px.forEach((v, i) => v === 8 && rust.push([i % STRIP_WIDTH, Math.floor(i / STRIP_WIDTH)]));
  assert.equal(rust.length, 4, 'a 2x2 square');
  assert.ok(rust.every(([x]) => x === youX || x === youX + 1));
  // Behind you sage, ahead paper cream, on the line's rows.
  const lineAt = (x) => [...Array(STRIP_HEIGHT).keys()].map((y) => px[y * STRIP_WIDTH + x]);
  assert.ok(lineAt(5).includes(14) && !lineAt(5).includes(5));
  assert.ok(lineAt(110).includes(5));
  assert.deepEqual(stripProfile(PARK, day, 'high_divide').you, null, 'not on the day: no you');
});

test('the box: it fits or it warns on preview (S6 continues it with ▾)', (t) => {
  assert.equal(boxFits({ scrollHeight: 100, clientHeight: 99.5 }), true);
  assert.equal(boxFits({ scrollHeight: 120, clientHeight: 100 }), false);
  const doc = frameDoc();
  const box = doc.createElement('div');
  box.scrollHeight = 300;
  box.clientHeight = 200;
  const warn = console.warn;
  const warned = [];
  console.warn = (...a) => warned.push(a[0]);
  t.after(() => {
    console.warn = warn;
  });
  assert.equal(checkBox(box), false);
  assert.equal(checkBox(null), true, 'a quiet stop has no box to check');
  assert.deepEqual(warned, ['frame: box overflows']);
});

// ---- The dev routes (preview, debug mode) --------------------------------

test('#stop= and #frame do nothing without debug mode, nor on a build without the trail', () => {
  const on = { debug: true, trail: true };
  assert.deepEqual(devRoute({ hash: '#stop=deer_lake_rim.rim&hour=night', ...on }), { stop: { set: 'deer_lake_rim', id: 'rim' }, hour: 'night' });
  assert.deepEqual(devRoute({ hash: '#stop=deer_lake_rim.deer_lake', ...on }), { stop: { set: 'deer_lake_rim', id: 'deer_lake' }, hour: null });
  assert.deepEqual(devRoute({ hash: '#stop=deer_lake_rim.rim&hour=noon', ...on }), { stop: { set: 'deer_lake_rim', id: 'rim' }, hour: null }, 'an unknown hour is dropped');
  assert.deepEqual(devRoute({ hash: '#frame', ...on }), { frame: true });
  for (const hash of ['', '#map', '#stop=', '#stop=Deer.rim', '#frames']) assert.equal(devRoute({ hash, ...on }), null, hash);
  for (const hash of ['#stop=deer_lake_rim.rim', '#frame']) {
    assert.equal(devRoute({ hash, debug: false, trail: true }), null, `${hash}: no debug mode`);
    assert.equal(devRoute({ hash, debug: true, trail: false }), null, `${hash}: no trail (main)`);
  }
});

test('#stop= plays the real engine in memory: Robin, the sample with its fixed seed, Walk on to the stop; the phone\'s saves are never touched', (t) => {
  const ls = device(t);
  const c = content();
  const s = devSession(c, { set: 'deer_lake_rim', id: 'rim' });
  assert.equal(s.state.trip.stop, 'rim');
  assert.equal(s.state.trip.seed, DEV_HIKER.seed);
  assert.equal(s.state.hiker.id, DEV_HIKER.id);
  assert.deepEqual(s.log.actions, [['next']]);
  assert.equal(devSession(c, { set: 'deer_lake_rim', id: 'nowhere' }), null);
  const store = memoryStore();
  assert.equal(store.save('trip', { a: 1 }), true);
  assert.deepEqual(store.load('trip'), { a: 1 });
  assert.equal(store.load('hiker'), null);
  assert.equal(ls.map.size, 0, 'nothing in localStorage');
});

test('the dev control *hour* is kept as `hour`, and Scenes opens #frame (registered once each)', (t) => {
  const ls = device(t);
  let redrawn = 0;
  let opened = 0;
  registerFrameDev({ onHour: () => redrawn++, openScenes: () => opened++ });
  assert.equal(savedHour(), 'auto');
  const reg = devRegistry();
  assert.ok(reg.controls.includes('hour') && reg.actions.includes('scenes'));
  assert.equal(new Set(reg.controls).size, reg.controls.length, 'no control twice');
  ls.setItem('oph.preview.hour', JSON.stringify('blue'));
  assert.equal(savedHour(), 'blue');
  ls.setItem('oph.preview.hour', JSON.stringify('teatime'));
  assert.equal(savedHour(), 'auto', 'not an hour: auto');
  assert.equal(redrawn + opened, 0);
});
