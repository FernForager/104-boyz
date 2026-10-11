// The title screen (BUILD_PLAN S7b; GAME_DESIGN 12.3; decisions 73 and 74;
// Lead calls 65 to 68): ui/title.js on the tiny DOM in textfix.mjs, with a
// stand-in for ui/home.js's showTitle (the cover's drawing needs a canvas).
// The Mount Olympus label's place at the four phones (titleMarks, pinned:
// flown from its tick like a flag, as the art critic's S7b pass asked), the summit and the floor re-derived from the cover's
// render, the quiet sky (quietOps), the quiet boxes against the name's line
// boxes and against what Chromium measured, the dev routes that skip the
// title, the resume mark (platform/resume.js), and the screen itself: its
// steps and their timings, the tap guard, one start, the controls that
// never go in, onEnter, stop(), the reading order, Reduce Motion and the
// resume path.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadArt, loadTitle } from '../../tools/pics.mjs';
import { compileArt } from '../../tools/build.mjs';
import { readText } from '../../tools/text.mjs';
import { contrastRatio } from '../../tools/color.mjs';
import { loadChromeFont } from '../../tools/fontbuild.mjs';
import { fakeDocument } from './textfix.mjs';
import { renderPic, composite, TRANSPARENT } from '../../web/js/gfx/picvm.js';
import { PALETTE, hexToRgb } from '../../web/js/gfx/palette.js';
import { createDisplay } from '../../web/js/gfx/display.js';
import { setBundle } from '../../web/js/text.js';
import { setChannel, keyName } from '../../web/js/platform/storage.js';
import { markResume, resuming, RESUME_KEY } from '../../web/js/platform/resume.js';
import { canvasInset, DEV_HOURS as CABIN_DEV_HOURS, DEV_SKIES as CABIN_DEV_SKIES } from '../../web/js/ui/cabin.js';
import { DEV_HOURS as FRAME_DEV_HOURS, SCENES_HASH as FRAME_SCENES_HASH } from '../../web/js/ui/frame.js';
import { HOURS as COMPOSE_HOURS } from '../../web/js/gfx/compose.js';
import { parseDevRoute, DEV_HOURS, DEV_SKIES, SCENES_HASH, STOP_HOURS } from '../../web/js/ui/devroute.js';
import { devRoute, TAP_GUARD_MS as GAME_GUARD_MS, FONT_WAIT_MS as GAME_FONT_WAIT_MS } from '../../web/js/ui/app.js';
import {
  titleMarks,
  quietOps,
  skipsTitle,
  nameBottom,
  overlay,
  showTitleScreen,
  STEPS,
  NAME_MS,
  LABEL_MS,
  PROMPT_MS,
  TAP_GUARD_MS,
  FONT_WAIT_MS,
  NAME_CLEAR_PT,
  LABEL_SIDE_PT,
  TICK_PT,
  NAME_LIFT_PT,
  TITLE_ROWS,
} from '../../web/js/ui/title.js';

const TITLE = /** @type {any} */ (loadTitle().title);
const { pics, stamps } = loadArt();
const COVER = pics.cover_high_divide_dusk;
const css = (f) => readFileSync(join(ROOT, 'web', 'css', f), 'utf8');

/**
 * The four phones' title-page shapes (display.js picks them: BUILD_PLAN 11.2's table) and the label's marks, in
 * device px (the art critic's S7b pass: the label flies from its tick like a flag, rises off the haze until the
 * tick is about 11 pt where the name leaves room, and rests one font pixel over the haze where it doesn't).
 */
const PHONES = [
  { name: 'se', sx: 4, sy: 2, dpr: 2, ox: 0, tick: { x: 361, y: 192, w: 2, h: 10 }, label: { x: 361, y: 162, w: 208, h: 28 }, nameEnds: 73.9, gap: 7.1, rises: false },
  { name: 'mini', sx: 6, sy: 4, dpr: 3, ox: 0, tick: { x: 541, y: 372, w: 3, h: 32 }, label: { x: 541, y: 327, w: 312, h: 42 }, nameEnds: 91.6, gap: 17.4, rises: true },
  { name: 'p17', sx: 7, sy: 4, dpr: 3, ox: 1, tick: { x: 633, y: 372, w: 3, h: 32 }, label: { x: 633, y: 327, w: 312, h: 42 }, nameEnds: 97.1, gap: 11.9, rises: true },
  { name: 'promax', sx: 8, sy: 5, dpr: 3, ox: 0, tick: { x: 722, y: 471, w: 3, h: 34 }, label: { x: 722, y: 426, w: 312, h: 42 }, nameEnds: 117.2, gap: 24.8, rises: true },
  // Not a phone's own shape: a squeezed 5x3 plate (a short Safari room with the update note), where a row is still 1 pt.
  { name: 'mini_squeezed', sx: 5, sy: 3, dpr: 3, ox: 0, tick: { x: 451, y: 288, w: 3, h: 15 }, label: { x: 451, y: 243, w: 312, h: 42 }, nameEnds: 71.4, gap: 9.6, rises: false },
];

/**
 * What Chromium measured on the title screen, 2026-10-11 (BUILD_LOG S7b; the label re-measured after the art
 * critic's pass), in picture pixels, inclusive: each line's block (its line box) rows, its text's columns, its ink
 * (with the ink shadow), and the label's box and ink (with the halo and the descenders, the tick hidden), at the
 * four phones, the SE's and the 13 mini's Safari rooms, the 13 mini in Safari with the update note (one line now:
 * the plate keeps its 6x4), and a squeezed 5x3 stand-in (a 13 mini in a 560-pt Safari room with the update note).
 */
const MEASURED = {
  se: { smallRows: [14, 32], bigRows: [33, 73], smallCols: [40, 119], bigCols: [51, 107], smallInk: [41, 17, 118, 34], bigInk: [53, 40, 106, 69], labelBox: [90, 81, 142, 94], labelInk: [89, 82, 142, 95] },
  mini: { smallRows: [19, 34], bigRows: [35, 68], smallCols: [36, 123], bigCols: [49, 110], smallInk: [37, 21, 122, 34], bigInk: [50, 41, 109, 65], labelBox: [90, 81, 142, 92], labelInk: [89, 82, 142, 92] },
  p17: { smallRows: [15, 32], bigRows: [34, 72], smallCols: [36, 123], bigCols: [49, 110], smallInk: [37, 18, 122, 33], bigInk: [50, 40, 109, 68], labelBox: [90, 81, 134, 92], labelInk: [89, 82, 134, 92] },
  promax: { smallRows: [17, 33], bigRows: [35, 70], smallCols: [36, 123], bigCols: [49, 110], smallInk: [37, 19, 122, 34], bigInk: [50, 40, 109, 65], labelBox: [90, 85, 129, 93], labelInk: [89, 85, 129, 94] },
  se_safari: { smallRows: [14, 32], bigRows: [33, 73], smallCols: [40, 119], bigCols: [51, 107], smallInk: [41, 17, 118, 34], bigInk: [53, 40, 106, 69], labelBox: [90, 81, 142, 94], labelInk: [89, 82, 142, 95] },
  mini_safari: { smallRows: [19, 34], bigRows: [35, 68], smallCols: [36, 123], bigCols: [49, 110], smallInk: [37, 21, 122, 34], bigInk: [50, 41, 109, 65], labelBox: [90, 81, 142, 92], labelInk: [89, 82, 142, 92] },
  mini_safari_update: { smallRows: [19, 34], bigRows: [35, 68], smallCols: [36, 123], bigCols: [49, 110], smallInk: [37, 21, 122, 34], bigInk: [50, 41, 109, 65], labelBox: [90, 81, 142, 92], labelInk: [89, 82, 142, 92] },
  mini_squeezed: { smallRows: [16, 33], bigRows: [34, 71], smallCols: [37, 123], bigCols: [49, 110], smallInk: [37, 19, 122, 34], bigInk: [50, 40, 109, 67], labelBox: [90, 81, 152, 94], labelInk: [89, 82, 152, 95] },
};

const boxOf = (name) => TITLE.quiet.find((q) => q.for === name).box;
/** Is [x0, y0, x1, y1] (inclusive) inside a quiet box [x, y, w, h]? */
const inside = ([x0, y0, x1, y1], [x, y, w, h]) => x0 >= x && y0 >= y && x1 < x + w && y1 < y + h;

// ---- The label's place (Lead call 67) ---------------------------------------

test("titleMarks: the label flies from its tick like a flag at the four phones (pinned), the tick standing on the summit pixel's top edge with a foot of ink, the label rising off the haze until the tick is about 11 pt where the name leaves room, 15 pt or more under Hiker's ink, inside the plate and its quiet box", () => {
  // The chrome font's M has no left bearing: its first column is ink, so a label starting on the tick's column
  // stands the tick under the M's first column, its casing flush with the label's halo.
  const M = loadChromeFont().glyphs.get('M'.codePointAt(0));
  assert.ok(M.some((row) => row & 0x80), "the M's first column is ink");
  for (const p of PHONES) {
    const m = titleMarks({ sx: p.sx, sy: p.sy, dpr: p.dpr }, { ox: p.ox }, TITLE);
    assert.equal(m.show, true, p.name);
    assert.equal(m.fp, p.dpr, `${p.name}: one CSS px a font pixel`);
    assert.deepEqual(m.tick, p.tick, `${p.name}: the tick`);
    assert.deepEqual(m.label, p.label, `${p.name}: the label`);
    assert.equal(Math.round(m.nameBottom * 10) / 10, p.nameEnds, `${p.name}: the name's line box ends`);
    assert.equal(Math.round(m.gap * 10) / 10, p.gap, `${p.name}: the sky between`);
    assert.ok(m.gap >= NAME_CLEAR_PT);
    // The tick: inside the summit's column, one font pixel under the label, down to the summit pixel's top edge;
    // its glacier-blue core stops one font pixel short, so its last font pixel is the casing's ink (the foot).
    const [cx, cy] = TITLE.label.summit;
    const col = p.ox + cx * p.sx;
    assert.ok(m.tick.x >= col && m.tick.x + m.tick.w <= col + p.sx, `${p.name}: inside the summit's column`);
    assert.ok(Math.abs(m.tick.x + m.tick.w / 2 - (col + p.sx / 2)) <= 0.5, `${p.name}: centered to the nearest device pixel`);
    assert.equal(m.tick.y + m.tick.h, cy * p.sy, `${p.name}: it ends on the summit pixel's top edge`);
    assert.equal(m.tick.y, m.label.y + m.label.h + p.dpr, `${p.name}: one font pixel under the label`);
    assert.deepEqual(m.core, { x: m.tick.x, y: m.tick.y, w: p.dpr, h: m.tick.h - p.dpr }, `${p.name}: the foot is one font pixel of ink`);
    assert.ok(m.core.h >= 3 * p.dpr, `${p.name}: and the blue above it reads as a line`);
    assert.deepEqual(m.summit, { x: col, y: cy * p.sy, w: p.sx, h: p.sy });
    // The label: 13 chrome cells wide and one row tall, flown from the tick (its first cell on the tick's
    // column), on whole CSS px, never lower than one font pixel over the haze (its descenders' halo clear of the
    // dither), in the plate.
    assert.equal(m.label.x, m.tick.x, `${p.name}: the tick under the M's first column`);
    assert.deepEqual([m.label.w, m.label.h], [104 * p.dpr, 14 * p.dpr]);
    assert.equal(m.label.y % p.dpr, 0, `${p.name}: on a whole CSS px`);
    const lowest = TITLE.label.floor * p.sy - p.dpr - m.label.h;
    assert.ok(m.label.y <= lowest, `${p.name}: one font pixel over the haze at the lowest`);
    assert.ok(m.label.x >= p.ox && m.label.x + m.label.w <= p.ox + 160 * p.sx, `${p.name}: inside the plate`);
    // Where the name leaves room it rises until the tick is about TICK_PT (10 to 12 pt); where it doesn't (the
    // SE, the squeezed plate) it rests on its lowest, still NAME_CLEAR_PT under the name's line box.
    if (p.rises) {
      assert.ok(m.label.y < lowest, `${p.name}: it rises`);
      assert.ok(Math.abs(m.tick.h / p.dpr - TICK_PT) <= 1, `${p.name}: a ${m.tick.h / p.dpr} pt leader`);
      assert.ok(m.tick.h / p.dpr >= 10 && m.tick.h / p.dpr <= 12);
      assert.ok(m.gap >= NAME_LIFT_PT, `${p.name}: NAME_LIFT_PT under the name's line box`);
    } else {
      assert.equal(m.label.y, lowest, `${p.name}: resting over the haze`);
      // because a label flown TICK_PT over the summit would come within NAME_LIFT_PT of the name.
      const flown = (TITLE.label.summit[1] * p.sy - TICK_PT * p.dpr - p.dpr - m.label.h) / p.dpr;
      assert.ok(flown - m.nameBottom < NAME_LIFT_PT, `${p.name}: no room to rise`);
    }
    // Hiker's ink, as Chromium measured it (with its ink shadow), ends 15 pt or more above the label wherever it
    // rises, and 10 pt or more on the SE, where it can't.
    const ink = MEASURED[/** @type {keyof typeof MEASURED} */ (p.name)];
    if (ink) {
      const inkEnds = ((ink.bigInk[3] + 1) * p.sy) / p.dpr;
      assert.ok(m.label.y / p.dpr - inkEnds >= (p.rises ? 15 : 10), `${p.name}: ${m.label.y / p.dpr - inkEnds} pt under Hiker's ink`);
    }
    const pic = [Math.floor((m.label.x - p.ox) / p.sx), Math.floor(m.label.y / p.sy), Math.ceil((m.label.x + m.label.w - p.ox) / p.sx) - 1, Math.ceil((m.label.y + m.label.h) / p.sy) - 1];
    assert.ok(inside(pic, boxOf('label')), `${p.name}: inside the label's quiet box (${pic})`);
    assert.equal(nameBottom(p), m.nameBottom);
  }
  assert.deepEqual([TICK_PT, NAME_LIFT_PT, NAME_CLEAR_PT], [11, 9, 6]);
  // A squeezed plate (the SE's 2x1: a picture row under 1 pt) hides it rather than crowd the name.
  assert.equal(titleMarks({ sx: 2, sy: 1, dpr: 2 }, { ox: 0 }, TITLE).show, false);
  // And so does a sky too short for 6 pt of clearance (a made-up summit floor 10 rows down).
  assert.equal(titleMarks({ sx: 4, sy: 2, dpr: 2 }, { ox: 0 }, { ...TITLE, label: { ...TITLE.label, floor: 86, summit: [90, 101] } }).show, false);
  // And a summit so close under the floor that no blue would stand over the foot.
  assert.equal(titleMarks({ sx: 4, sy: 2, dpr: 2 }, { ox: 0 }, { ...TITLE, label: { ...TITLE.label, summit: [90, 97] } }).show, false);
});

test("display.origin is where the picture starts in its canvas, ui/cabin.js's canvasInset, and the tick's layer is its backing store, at the four phones' title-page shapes", (t) => {
  const had = { document: globalThis.document, window: globalThis.window };
  t.after(() => {
    if (had.document === undefined) delete globalThis.document;
    else globalThis.document = had.document;
    if (had.window === undefined) delete globalThis.window;
    else globalThis.window = had.window;
  });
  const ctx = { createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData() {}, drawImage() {}, fillRect() {}, imageSmoothingEnabled: false, fillStyle: '' };
  const canvas = () => ({ width: 0, height: 0, style: {}, dataset: {}, getContext: () => ctx, getBoundingClientRect: () => ({ left: 0, top: 0 }) });
  globalThis.document = /** @type {any} */ ({ createElement: () => canvas() });
  // The title page's room on each phone (home.js fit: the column, the screen, the room above the shelf's 160 pt).
  const rooms = { se: [375, 667, 647 - 160], mini: [375, 812, 728 - 160], p17: [402, 874, 778 - 160], promax: [440, 956, 860 - 160], mini_squeezed: [375, 812, 387] };
  for (const p of PHONES) {
    globalThis.window = /** @type {any} */ ({ devicePixelRatio: p.dpr });
    const visible = canvas();
    const d = createDisplay(/** @type {any} */ (visible), 160, 320);
    const [cssWidth, screenHeight, maxCssHeight] = rooms[/** @type {keyof typeof rooms} */ (p.name)];
    const shape = d.layout({ cssWidth, screenHeight, maxCssHeight });
    assert.deepEqual([shape.sx, shape.sy], [p.sx, p.sy], `${p.name}: its shape`);
    assert.deepEqual(d.origin, { ox: p.ox, oy: 0 }, p.name);
    assert.equal(d.origin.ox, canvasInset(p.sx, p.dpr), `${p.name}: canvasInset`);
    // The tick's layer is the canvas's backing store, device pixel for device pixel.
    assert.deepEqual(overlay(p), { w: visible.width, h: visible.height }, `${p.name}: the backing store`);
    assert.ok(visible.width > 0 && visible.height > 0);
  }
});

test("the summit and the floor in title.json are the cover's: its highest non-sky pixel (the West Peak's spire) and its first dithered sky row", () => {
  const r = renderPic(COVER.ops, { width: 160, height: 320, stamps });
  let top = null;
  for (let y = 0; y < 320 && !top; y++) {
    for (let x = 0; x < 160 && !top; x++) for (let L = 1; L < r.layers.length; L++) if (r.layers[L][y * 160 + x] !== TRANSPARENT) top = [x, y];
  }
  assert.deepEqual(top, TITLE.label.summit);
  assert.deepEqual(TITLE.label.summit, [90, 101]);
  // The navy band (with its stars) ends on the row before the floor; the floor row starts the checker.
  const sky = r.layers[0];
  const STARS = new Set([1, 4, 5, 22]);
  for (let y = 0; y < TITLE.label.floor; y++) for (let x = 0; x < 160; x++) assert.ok(STARS.has(sky[y * 160 + x]), `(${x}, ${y}): navy or a star`);
  const floorRow = [...sky.slice(TITLE.label.floor * 160, TITLE.label.floor * 160 + 160)];
  assert.ok(floorRow.filter((v) => v === 2).length >= 60, 'the floor row is the slate checker');
  assert.equal(TITLE.label.floor, 96);
  assert.equal(TITLE.cover, 'cover_high_divide_dusk');
});

// ---- The quiet sky (Lead call 68) ----------------------------------------------

test("quietOps drops exactly the cover's stars inside the quiet boxes: the render differs only at those pixels, each now the navy fill; the cover's own ops are untouched", () => {
  const before = JSON.stringify(COVER.ops);
  const boxes = TITLE.quiet.map((q) => q.box);
  const quiet = quietOps(COVER.ops, boxes);
  assert.equal(JSON.stringify(COVER.ops), before, 'the ops given are never touched (main keeps every star)');
  const dropped = COVER.ops.filter((op) => !quiet.includes(op)).map((op) => op[1]);
  // The full stop after Hiker (108, 66) and the stars inside and over the name; by the label, the one past its end
  // that read as its full stop (140, 81), two under it (112, 84 and 121, 90), one beside its tick (84, 90), and
  // (S7b review) the one in the haze just past the end of Olympus on the SE (147, 99).
  assert.deepEqual(
    dropped.map(([x, y]) => `${x},${y}`).sort(),
    ['78,27', '52,37', '99,44', '70,62', '108,66', '140,81', '112,84', '84,90', '121,90', '147,99'].sort(),
  );
  assert.equal(quiet.length, COVER.ops.length - 10);
  const a = composite(renderPic(COVER.ops, { width: 160, height: 320, stamps }));
  const b = composite(renderPic(quiet, { width: 160, height: 320, stamps }));
  const differ = [];
  for (let p = 0; p < a.length; p++) if (a[p] !== b[p]) differ.push([p % 160, Math.floor(p / 160), b[p]]);
  assert.deepEqual(differ.map(([x, y]) => `${x},${y}`).sort(), dropped.map(([x, y]) => `${x},${y}`).sort());
  for (const [, , v] of differ) assert.equal(v, 1, 'the navy fill under each');
  // Only the sky layer's single points: a line, a fill or another layer's point stays.
  const ops = [['@', 'sky'], ['L', [80, 20]], ['L', [80, 20, 90, 20]], ['F', [80, 20]], ['@', 'far'], ['L', [80, 20]], ['L', [5, 5]]];
  assert.deepEqual(quietOps(ops, [[70, 10, 30, 30]]), [['@', 'sky'], ['L', [80, 20, 90, 20]], ['F', [80, 20]], ['@', 'far'], ['L', [80, 20]], ['L', [5, 5]]]);
  assert.deepEqual(quietOps(ops, []), ops);
});

test("the quiet boxes hold the name's line boxes (game.css's formula) at the four phones, and everything Chromium measured of both lines and the label, at the phones and the Safari rooms", () => {
  assert.deepEqual(TITLE.quiet.map((q) => q.for), ['label', 'label_line', 'name_small', 'name_big']);
  // The label's line, a character cell and a half (12 pt) to either side at every phone, from its top row down
  // through the haze to the row above the summit (S7b review: the star at 147, 99 sat by the end of Olympus on the
  // SE): no star reads as its punctuation (the star at 140, 81, just past the s on every phone).
  const sides = PHONES.map((p) => {
    const m = titleMarks(p, { ox: p.ox }, TITLE);
    const pad = LABEL_SIDE_PT * p.dpr;
    return [Math.floor((m.label.x - pad - p.ox) / p.sx), Math.floor(m.label.y / p.sy), Math.ceil((m.label.x + m.label.w + pad - p.ox) / p.sx) - 1, Math.ceil((m.label.y + m.label.h) / p.sy) - 1];
  });
  const lineBox = [Math.min(...sides.map((b) => b[0])), Math.min(...sides.map((b) => b[1]))];
  assert.ok(Math.max(...sides.map((b) => b[3])) < TITLE.label.summit[1], "the label's rows are all above the summit's");
  lineBox.push(Math.max(...sides.map((b) => b[2])) - lineBox[0] + 1, TITLE.label.summit[1] - lineBox[1]);
  assert.deepEqual(boxOf('label_line'), lineBox);
  assert.deepEqual(boxOf('label_line'), [83, 81, 77, 20]);
  for (const p of PHONES) {
    const room = (TITLE_ROWS * p.sy) / p.dpr;
    const u = Math.min((160 * p.sx) / p.dpr, 3.3 * room);
    const top = (room - (0.062 + 0.006 + 0.145 * 0.95) * u) / 2;
    const smallEnd = top + 0.062 * u;
    const bigTop = smallEnd + 0.006 * u;
    const row = (pt) => (pt * p.dpr) / p.sy;
    const [, sy0, , sh] = boxOf('name_small');
    const [, by0, , bh] = boxOf('name_big');
    assert.ok(Math.floor(row(top)) >= sy0 && Math.ceil(row(smallEnd)) <= sy0 + sh, `${p.name}: Olympic Peninsula's line box`);
    assert.ok(Math.floor(row(bigTop)) >= by0 && Math.ceil(row(nameBottom(p))) <= by0 + bh, `${p.name}: Hiker's line box`);
  }
  assert.deepEqual(Object.keys(MEASURED), ['se', 'mini', 'p17', 'promax', 'se_safari', 'mini_safari', 'mini_safari_update', 'mini_squeezed']);
  for (const [room, m] of Object.entries(MEASURED)) {
    assert.ok(inside([m.smallCols[0], m.smallRows[0], m.smallCols[1], m.smallRows[1]], boxOf('name_small')), `${room}: Olympic Peninsula`);
    assert.ok(inside([m.bigCols[0], m.bigRows[0], m.bigCols[1], m.bigRows[1]], boxOf('name_big')), `${room}: Hiker`);
    assert.ok(inside(m.smallInk, boxOf('name_small')), `${room}: Olympic Peninsula's ink`);
    assert.ok(inside(m.bigInk, boxOf('name_big')), `${room}: Hiker's ink and its shadow`);
    assert.ok(inside(m.labelBox, boxOf('label')), `${room}: the label's box`);
    assert.ok(inside(m.labelInk, boxOf('label')), `${room}: the label's ink and halo`);
  }
  // The boxes are those unions, one pixel out, and no more: each edge touches what it holds plus one.
  const all = Object.values(MEASURED);
  const union = (get) => [Math.min(...all.map((m) => get(m)[0])), Math.min(...all.map((m) => get(m)[1])), Math.max(...all.map((m) => get(m)[2])), Math.max(...all.map((m) => get(m)[3]))];
  const out1 = ([x0, y0, x1, y1]) => [x0 - 1, y0 - 1, x1 - x0 + 3, y1 - y0 + 3];
  const small = union((m) => [Math.min(m.smallCols[0], m.smallInk[0]), Math.min(m.smallRows[0], m.smallInk[1]), Math.max(m.smallCols[1], m.smallInk[2]), Math.max(m.smallRows[1], m.smallInk[3])]);
  const big = union((m) => [Math.min(m.bigCols[0], m.bigInk[0]), Math.min(m.bigRows[0], m.bigInk[1]), Math.max(m.bigCols[1], m.bigInk[2]), Math.max(m.bigRows[1], m.bigInk[3])]);
  const label = union((m) => [Math.min(m.labelBox[0], m.labelInk[0]), Math.min(m.labelBox[1], m.labelInk[1]), Math.max(m.labelBox[2], m.labelInk[2]), Math.max(m.labelBox[3], m.labelInk[3])]);
  assert.deepEqual([boxOf('name_small'), boxOf('name_big'), boxOf('label')], [out1(small), out1(big), out1(label)]);
  // The label's box keeps clear of the name's, and of the summit (the tick's own pixels are the band's).
  const [, by, , bh] = boxOf('name_big');
  assert.ok(boxOf('label')[1] > by + bh, "the label's sky starts under Hiker's");
});

test("art.json's title ships with the home screen only, without its note; content/art/title.json's schema holds it", () => {
  assert.equal(compileArt({ screens: ['app', 'debug', 'title'] }).title, undefined, "main's art keeps its four keys");
  const { $comment, ...rest } = JSON.parse(readFileSync(join(ROOT, 'content', 'art', 'title.json'), 'utf8'));
  assert.ok($comment);
  assert.deepEqual(compileArt({ screens: ['app', 'debug', 'home', 'title'] }).title, rest);
  assert.deepEqual(loadTitle().errors, []);
  const bad = loadTitle(join(ROOT, 'content', 'art', 'title.json'));
  assert.deepEqual(bad.errors, []);
  // The label's words are the gazetteer's name, not a line of ours.
  const text = readText(ROOT);
  assert.equal(TITLE.label.name, 'place.mount_olympus_west_peak');
  assert.equal(text.names.places.get(TITLE.label.name).text, 'Mount Olympus');
  assert.ok(!text.lines.has(TITLE.label.name));
});

// ---- The dev routes and the resume (Lead call 65) -----------------------------

// Rewritten after S7b's review: skipsTitle read its own list of prefixes, so a malformed dev hash (#lockbox,
// #stop=nope, #home&junk, #first&x=1) skipped the title while devRoute opened nothing, and the autosave showed with no
// title. Both now read ui/devroute.js parseDevRoute; this holds them together over every route and every near miss.
test("skipsTitle: in debug mode, exactly the hashes ui/app.js devRoute opens skip the title (one parser, ui/devroute.js); a malformed dev hash, #map, a stray hash or no debug mode never does", () => {
  const routes = ['#stop=deer_lake_rim.rim', '#stop=deer_lake_rim.fork&hour=night', '#stop=deer_lake_rim.fork&hour=noon', '#home', '#home&hour=night&sky=rain&moon=4', '#home&hour=noon', '#first', '#lockbox&q=1', '#lockbox&open=3', '#lockbox&ask=q_hoh', '#guestbook', '#frame'];
  for (const hash of routes) {
    assert.ok(devRoute({ hash, debug: true, trail: true }), `${hash}: a dev route`);
    assert.deepEqual(parseDevRoute(hash), devRoute({ hash, debug: true, trail: true }), `${hash}: the game reads the shared parser`);
    assert.equal(skipsTitle({ hash, search: '?debug=1' }), true, `${hash} with ?debug=1`);
    assert.equal(skipsTitle({ hash, search: '', debug: true }), true, `${hash} with the menu opened`);
    assert.equal(skipsTitle({ hash, search: '' }), false, `${hash} outside debug mode`);
  }
  // The near misses: each opens no dev route, so the title shows (the review's four first).
  const misses = ['#lockbox', '#stop=nope', '#home&junk', '#first&x=1', '#map', '', '#', '#homework', '#firstly', '#guestbooks', '#guestbook&x=1', '#frames', '#frame&x=1', '#stop', '#stop=', '#stop=a.', '#stop=A.b', '#lockboxes', '#lockbox&q=0', '#lockbox&q=4', '#lockbox&open=2', '#lockbox&ask=', '#lockbox&ask=Q-1', '#home&Hour=night', '#home&hour='];
  for (const hash of misses) {
    assert.equal(devRoute({ hash, debug: true, trail: true }), null, `${hash}: no dev route`);
    assert.equal(skipsTitle({ hash, search: '?debug=1' }), false, `${hash}: the title shows`);
    assert.equal(skipsTitle({ hash, search: '', debug: true }), false, `${hash}: the title shows, menu opened`);
  }
  // Every route kind the parser knows is covered above.
  const kinds = new Set(routes.flatMap((hash) => Object.keys(parseDevRoute(hash)).filter((k) => k !== 'hour')));
  assert.deepEqual([...kinds].sort(), ['first', 'frame', 'guestbook', 'home', 'lockbox', 'stop']);
  // The title screen and the game read the one parser; neither keeps a list of its own.
  const titleSrc = readFileSync(join(ROOT, 'web', 'js', 'ui', 'title.js'), 'utf8');
  const appSrc = readFileSync(join(ROOT, 'web', 'js', 'ui', 'app.js'), 'utf8');
  assert.match(titleSrc, /import \{ parseDevRoute \} from '\.\/devroute\.js';/);
  assert.match(appSrc, /return parseDevRoute\(hash\);/);
  assert.ok(!/#lockbox|#stop=|#home/.test(titleSrc.replace(/^\s*(\/\/|\*|\/\*\*).*$/gm, '')), 'no route of its own in title.js');
  // The constants the cabin and the frame's dev controls read are the parser's.
  assert.equal(CABIN_DEV_HOURS, DEV_HOURS);
  assert.equal(CABIN_DEV_SKIES, DEV_SKIES);
  assert.equal(FRAME_DEV_HOURS, DEV_HOURS);
  assert.equal(FRAME_SCENES_HASH, SCENES_HASH);
  assert.deepEqual(STOP_HOURS, COMPOSE_HOURS, "a stop's hours are a picture's");
  assert.deepEqual(readFileSync(join(ROOT, 'web', 'js', 'ui', 'devroute.js'), 'utf8').match(/^import .*/gm), null, 'it imports nothing: the title screen loads it before the game');
});

/** A Map-backed web storage. */
function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), map: m };
}

/** Preview's channel and a session store for one test. */
function session(t) {
  const had = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const ss = fakeStorage();
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: ss });
  setChannel('preview');
  t.after(() => {
    if (had) Object.defineProperty(globalThis, 'sessionStorage', had);
    else delete globalThis.sessionStorage;
    setChannel(null);
  });
  return ss;
}

// Rewritten after S7b's review: the mark is kept for the session (it was read once and removed), so any reload in a
// session the game has had the page in skips the title, iOS reloading the app it shut down in the background too.
test('the resume mark: written only when the game has the page (the take-over, and the two Restarts); every later load in the session reads it and keeps it', (t) => {
  const ss = session(t);
  const doc = fakeDocument();
  const app = doc.createElement('main');
  app.setAttribute('id', 'app');
  app.setAttribute('data-screen', 'title');
  doc.body.appendChild(app);
  assert.equal(RESUME_KEY, 'resume');
  assert.equal(markResume(doc), false, 'the title screen (and main\'s title page): nothing written');
  assert.equal(ss.map.size, 0);
  app.setAttribute('data-screen', 'home');
  assert.equal(markResume(doc), true);
  assert.deepEqual([...ss.map.keys()], [keyName('resume')]);
  assert.equal(ss.map.get('oph.preview.resume'), '1');
  assert.equal(resuming(), true);
  assert.equal(ss.map.size, 1, 'kept');
  assert.equal(resuming(), true, 'every load in the session');
  assert.equal(markResume(doc), true, 'written again, still one key');
  assert.deepEqual([...ss.map.keys()], [keyName('resume')]);
  // The app closed: iOS drops session storage, so the next launch is fresh.
  ss.map.clear();
  assert.equal(resuming(), false);
  assert.equal(markResume(fakeDocument()), false, 'no #app');
  assert.equal(ss.map.size, 0);
  // Nothing but the session store: no lasting key that a relaunch would find.
  assert.ok(!/localStorage|session: false/.test(readFileSync(join(ROOT, 'web', 'js', 'platform', 'resume.js'), 'utf8')));
  // The two Restarts mark it first, then reload.
  assert.match(readFileSync(join(ROOT, 'web', 'js', 'platform', 'sw-client.js'), 'utf8'), /again\.addEventListener\('click', \(\) => \{\n\s*markResume\(doc\);\n\s*restart\(win\);/);
  assert.match(readFileSync(join(ROOT, 'web', 'js', 'ui', 'errors.js'), 'utf8'), /markResume\(doc\);\n\s*restart\(win\);/);
  assert.ok(!/resume/.test(readFileSync(join(ROOT, 'web', 'js', 'boot.js'), 'utf8')), "boot.js's Restart runs before the game exists");
});

// ---- The screen itself, on the tiny DOM ----------------------------------------

/** The built page's title page, as preview's index.html has it. */
function shell() {
  const doc = fakeDocument();
  const el = (tag, attrs = {}, ...kids) => {
    const e = doc.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    for (const k of kids) e.appendChild(k);
    return e;
  };
  const canvas = el('canvas', { class: 'picture', id: 'cover', 'data-t-img': 'alt.cover_high_divide_dusk', role: 'img' });
  const h1 = el('h1', { class: 'title', 'data-t': 'app.name' });
  const plate = el('figure', { class: 'plate drawing', id: 'plate' }, canvas, el('figcaption', { class: 'cover-title' }, h1));
  const restart = el('button', { id: 'update-restart', type: 'button' });
  const update = el('div', { class: 'update-note box', id: 'update', hidden: '' }, restart);
  const stamp = el('span', { class: 'build-stamp', id: 'build-stamp' });
  const stamps = el('p', { class: 'stamps' }, el('span', { class: 'offline-stamp', id: 'offline', hidden: '' }), stamp);
  const shelf = el('section', { class: 'shelf', id: 'shelf' }, update, el('p', { class: 'install', id: 'install' }), stamps);
  const app = el('main', { class: 'title-page', id: 'app', 'data-screen': 'title' }, plate, shelf);
  doc.body.appendChild(app);
  doc.defaultView = { devicePixelRatio: 3, location: { search: '', hash: '' } };
  return { doc, app, plate, canvas, h1, shelf, restart, stamp };
}

/** Timers the test fires by hand: later(f, ms) and fire(ms). */
function timers() {
  const list = [];
  const later = (f, ms) => {
    const t = { f, ms, live: true };
    list.push(t);
    return () => {
      t.live = false;
    };
  };
  const fire = (ms) => {
    for (const t of list.filter((x) => x.live && x.ms === ms)) {
      t.live = false;
      t.f();
    }
  };
  return { later, fire, live: () => list.filter((t) => t.live).map((t) => t.ms) };
}

/** A clock moved by hand. */
function clock() {
  let ms = 5000;
  const now = () => ms;
  now.pass = (d) => {
    ms += d;
  };
  return now;
}

/** A stand-in for home.js showTitle: the art handed to prepare, a fit at the 17's shape, a draw-in the test ends. */
function fakeShow({ shape = { sx: 7, sy: 4, short: false }, ox = 1 } = {}) {
  const calls = { opts: [], finished: 0, stopped: 0, ops: null };
  let drawn = () => {};
  const done = new Promise((r) => {
    drawn = r;
  });
  const show = async (doc, opts) => {
    calls.opts.push(opts);
    calls.ops = opts.prepare({ pics: { cover_high_divide_dusk: COVER }, title: TITLE });
    if (opts.onFit) opts.onFit(shape, { origin: { ox, oy: 0 } });
    return {
      finish: () => {
        calls.finished++;
        drawn();
      },
      stop: () => calls.stopped++,
      done,
      art: null,
      display: null,
    };
  };
  return { show, calls, draw: () => drawn() };
}

const settle = () => new Promise((r) => setImmediate(r));

/** Preview's words for the screen: the prompt (a line) and the label (the gazetteer's name). */
function words(t) {
  const text = readText(ROOT);
  setBundle({ 'title.prompt': text.lines.get('title.prompt').text, 'place.mount_olympus_west_peak': text.names.places.get('place.mount_olympus_west_peak').text }, { 'title.prompt': 'draft' }, 'preview');
  setChannel('preview');
  t.after(() => {
    setBundle({}, {}, null);
    setChannel(null);
  });
}

test('the title screen: the name, then the label, then the prompt, each after the one before (480, 480 and 240 ms, the CSS\'s own); a tap goes in only 300 ms after the prompt shows, once; the update note and the stamps never go in; stop() leaves nothing behind', async (t) => {
  words(t);
  const { doc, app, plate, canvas, h1, shelf, restart, stamp } = shell();
  const tm = timers();
  const now = clock();
  const fake = fakeShow();
  const screen = await showTitleScreen(doc, { show: fake.show, words: Promise.resolve(), now, later: tm.later, reduced: false, resume: false });
  assert.equal(screen.resume, false);
  // The name first, then the picture, the label, the tick; the prompt heads the shelf.
  const label = plate.querySelector('.peak-label');
  const tick = plate.querySelector('.peak-tick');
  const go = shelf.querySelector('.title-go');
  assert.ok(label && tick && go);
  assert.deepEqual(plate.children.map((c) => c.className), ['cover-title', 'picture', 'peak-label', 'peak-tick']);
  assert.equal(shelf.children[0], go);
  assert.deepEqual(app.descendants().filter((e) => [h1, canvas, label, go].includes(e)), [h1, canvas, label, go], 'the reading order: the name, the picture, the label, the prompt');
  assert.equal(canvas.getAttribute('role'), 'img');
  assert.equal(tick.getAttribute('aria-hidden'), 'true');
  assert.equal(go.getAttribute('type'), 'button');
  // Placed in CSS px from the 17's marks (device px / 3), shown: it fits.
  assert.deepEqual(['left', 'top', 'width', 'height'].map((k) => label.style.getPropertyValue(k)), ['211px', '109px', '104px', '14px']);
  // The tick's layer covers the canvas (374 x 427 CSS px, its 1122 x 1281 device pixels); in it, the tick in device
  // pixels: cased in ink 3 each side from row 372 to the summit's top edge (404), glacier blue 3 wide inside it
  // down to row 401, so its last 3 rows are a foot of ink.
  assert.deepEqual(['left', 'top', 'width', 'height'].map((k) => tick.style.getPropertyValue(k)), ['0px', '0px', '374px', '427px']);
  assert.equal(tick.getAttribute('viewBox'), '0 0 1122 1281');
  assert.equal(tick.getAttribute('shape-rendering'), 'crispEdges');
  const rectOf = (r) => ['x', 'y', 'width', 'height'].map((k) => Number(r.getAttribute(k)));
  assert.deepEqual(rectOf(tick.querySelector('.peak-tick-line')), [633, 372, 3, 29]);
  assert.deepEqual(rectOf(tick.querySelector('.peak-tick-case')), [630, 372, 9, 32]);
  assert.deepEqual(tick.children.map((c) => c.className), ['peak-tick-case', 'peak-tick-line'], 'the casing under the line');
  assert.equal(label.hidden, false);
  assert.equal(tick.hidden, false);
  // The cover drawn is the quiet one.
  assert.deepEqual(fake.calls.ops, quietOps(COVER.ops, TITLE.quiet.map((q) => q.box)));
  assert.equal(fake.calls.opts.length, 1);
  assert.equal(typeof fake.calls.opts[0].onFit, 'function');
  // Drawing in: nothing but the picture, whatever the timers do.
  await settle();
  assert.equal(app.getAttribute('data-title'), 'drawing');
  tm.fire(NAME_MS);
  tm.fire(LABEL_MS);
  await settle();
  assert.equal(app.getAttribute('data-title'), 'drawing', 'the label and the prompt wait for the picture');
  // The words are in (the fonts too: no FontFaceSet here): the label's and the prompt's.
  assert.equal(label.textContent, 'Mount Olympus');
  assert.equal(label.getAttribute('data-t'), 'place.mount_olympus_west_peak');
  assert.equal(go.textContent, 'Tap to start');
  assert.equal(go.getAttribute('data-t'), 'title.prompt');
  // A click while it draws in never goes in.
  let entered = false;
  screen.entered.then(() => {
    entered = true;
  });
  let cues = 0;
  screen.onEnter(() => cues++);
  now.pass(10000);
  app.dispatchEvent({ type: 'click', target: canvas });
  await settle();
  assert.equal(entered, false);
  // The picture is done: the name steps in, then after 480 ms the label, then after 480 more the prompt.
  fake.draw();
  await settle();
  assert.equal(app.getAttribute('data-title'), 'name');
  assert.ok(tm.live().includes(NAME_MS));
  tm.fire(NAME_MS);
  await settle();
  assert.equal(app.getAttribute('data-title'), 'label');
  assert.ok(tm.live().includes(LABEL_MS));
  app.dispatchEvent({ type: 'click', target: canvas });
  await settle();
  assert.equal(entered, false, 'not before the prompt');
  tm.fire(LABEL_MS);
  await settle();
  assert.equal(app.getAttribute('data-title'), 'ready');
  // The guard: a tap under 300 ms after the prompt showed is the last tap's, dropped.
  app.dispatchEvent({ type: 'click', target: canvas });
  now.pass(TAP_GUARD_MS - 1);
  app.dispatchEvent({ type: 'click', target: canvas });
  await settle();
  assert.equal(entered, false);
  now.pass(1);
  // The update note's Restart and the build stamp (five taps: the debug menu) never go in.
  app.dispatchEvent({ type: 'click', target: restart });
  for (let i = 0; i < 5; i++) app.dispatchEvent({ type: 'click', target: stamp });
  await settle();
  assert.equal(entered, false);
  assert.equal(cues, 0);
  // A tap anywhere else goes in: once, the cue inside it.
  app.dispatchEvent({ type: 'click', target: canvas });
  assert.equal(cues, 1, 'onEnter runs inside the tap');
  assert.equal(app.getAttribute('data-title'), 'entered');
  assert.equal(go.getAttribute('aria-disabled'), 'true');
  await settle();
  assert.equal(entered, true);
  app.dispatchEvent({ type: 'click', target: go });
  now.pass(1000);
  app.dispatchEvent({ type: 'click', target: canvas });
  assert.equal(cues, 1, 'one start');
  screen.onEnter(() => cues++);
  app.dispatchEvent({ type: 'click', target: canvas });
  assert.equal(cues, 1, 'a cue registered after the tap never plays');
  // stop(): every listener and timer gone, #app let go, the cover's own stop called.
  screen.stop();
  assert.deepEqual([app.listeners.get('click'), app.listeners.get('pointerdown'), doc.listeners.get('keydown')].map((l) => (l || []).length), [0, 0, 0]);
  assert.deepEqual(tm.live(), [], 'the font wait too');
  assert.equal(app.getAttribute('data-title'), null);
  assert.equal(fake.calls.stopped, 1);
  // The steps and timings are the stylesheets': the name's 480 ms in four steps (game.css), the label's 480 in
  // four and the prompt's 240 in two (title.css); the guard and the font wait are the game's.
  assert.deepEqual(STEPS, ['drawing', 'name', 'label', 'ready', 'entered']);
  assert.deepEqual([NAME_MS, LABEL_MS, PROMPT_MS, TAP_GUARD_MS, FONT_WAIT_MS], [480, 480, 240, GAME_GUARD_MS, GAME_FONT_WAIT_MS]);
  assert.match(css('game.css'), /\.plate:not\(\.drawing\) \.cover-title \{\n\s*transition: opacity 480ms steps\(4, end\);/);
  assert.match(css('title.css'), /\.peak-label,\n\s*\.peak-tick,\n\s*#app\[data-title\] \.plate::before \{\n\s*transition: opacity 480ms steps\(4, end\), visibility 0s;/);
  assert.match(css('title.css'), /\.title-go \{\n\s*transition: opacity 240ms steps\(2, end\), visibility 0s;/);
});

test("the prompt's own activation goes in (VoiceOver's double tap, Enter, Space: the button's click); a tap while it draws in hurries it to the prompt at once, and that tap's click is dropped", async (t) => {
  words(t);
  const { doc, app, canvas } = shell();
  const tm = timers();
  const now = clock();
  const fake = fakeShow();
  const screen = await showTitleScreen(doc, { show: fake.show, words: Promise.resolve(), now, later: tm.later, reduced: false, resume: false });
  await settle();
  app.dispatchEvent({ type: 'pointerdown', target: canvas });
  assert.equal(fake.calls.finished, 1, 'the draw-in finishes');
  assert.equal(app.getAttribute('data-hurry'), '');
  await settle();
  assert.equal(app.getAttribute('data-title'), 'ready', 'the name, the label and the prompt at once, no timer fired');
  let entered = false;
  screen.entered.then(() => {
    entered = true;
  });
  app.dispatchEvent({ type: 'click', target: canvas });
  await settle();
  assert.equal(entered, false, "the hurry tap's own click");
  now.pass(TAP_GUARD_MS);
  app.dispatchEvent({ type: 'click', target: doc.querySelector('.title-go') });
  await settle();
  assert.equal(entered, true);
  // A key hurries too.
  const two = shell();
  const fake2 = fakeShow();
  await showTitleScreen(two.doc, { show: fake2.show, words: Promise.resolve(), now, later: timers().later, reduced: false, resume: false });
  for (const f of two.doc.listeners.get('keydown')) f({ type: 'keydown', key: 'Enter' });
  await settle();
  assert.equal(two.app.getAttribute('data-title'), 'ready');
});

test("a press held through the draw-in never goes in, however long (S7b review: held 450 ms it went in); a fresh tap after the prompt does, once; the keyboard's and VoiceOver's activation (detail 0) never counts as that press", async (t) => {
  words(t);
  const { doc, app, canvas } = shell();
  const now = clock();
  const fake = fakeShow();
  const screen = await showTitleScreen(doc, { show: fake.show, words: Promise.resolve(), now, later: timers().later, reduced: false, resume: false });
  await settle();
  let entered = 0;
  screen.entered.then(() => entered++);
  let cues = 0;
  screen.onEnter(() => cues++);
  // The press lands while the picture draws in: it hurries everything to the prompt.
  app.dispatchEvent({ type: 'pointerdown', target: canvas });
  await settle();
  assert.equal(app.getAttribute('data-title'), 'ready');
  // Released 400 ms after the prompt showed: past the guard, still the hurry press's click.
  now.pass(TAP_GUARD_MS + 100);
  app.dispatchEvent({ type: 'click', target: canvas, detail: 1 });
  await settle();
  assert.equal(entered, 0, 'the held press is dropped');
  assert.equal(app.getAttribute('data-title'), 'ready');
  // A fresh tap goes in, once.
  now.pass(1000);
  app.dispatchEvent({ type: 'pointerdown', target: canvas });
  app.dispatchEvent({ type: 'click', target: canvas, detail: 1 });
  app.dispatchEvent({ type: 'pointerdown', target: canvas });
  app.dispatchEvent({ type: 'click', target: canvas, detail: 1 });
  await settle();
  assert.equal(entered, 1);
  assert.equal(cues, 1, 'one start');
  // A press held from before the prompt, then the button activated from the keyboard (or VoiceOver): that goes in.
  const two = shell();
  const s2 = await showTitleScreen(two.doc, { show: fakeShow().show, words: Promise.resolve(), now, later: timers().later, reduced: false, resume: false });
  await settle();
  let in2 = false;
  s2.entered.then(() => {
    in2 = true;
  });
  two.app.dispatchEvent({ type: 'pointerdown', target: two.canvas });
  await settle();
  assert.equal(two.app.getAttribute('data-title'), 'ready');
  now.pass(TAP_GUARD_MS);
  two.app.dispatchEvent({ type: 'click', target: two.doc.querySelector('.title-go'), detail: 0 });
  await settle();
  assert.equal(in2, true);
  // A press before the prompt whose click lands before it too is spent there: the next tap after the guard goes in.
  const three = shell();
  const tm3 = timers();
  const fake3 = fakeShow();
  const s3 = await showTitleScreen(three.doc, { show: fake3.show, words: Promise.resolve(), now, later: tm3.later, reduced: false, resume: false });
  await settle();
  let in3 = false;
  s3.entered.then(() => {
    in3 = true;
  });
  fake3.draw();
  await settle();
  assert.equal(three.app.getAttribute('data-title'), 'name');
  three.app.dispatchEvent({ type: 'pointerdown', target: three.canvas });
  three.app.dispatchEvent({ type: 'click', target: three.canvas, detail: 1 });
  await settle();
  assert.equal(three.app.getAttribute('data-title'), 'ready');
  now.pass(TAP_GUARD_MS);
  three.app.dispatchEvent({ type: 'click', target: three.canvas, detail: 1 });
  await settle();
  assert.equal(in3, true, 'a click with no press of its own before it (a synthetic tap) goes in once the earlier press is spent');
});

test("the stylesheet main.js linked beside the module (S7b review): the cover's first fit waits for it, at most FONT_WAIT_MS, and title.js links no second copy", async (t) => {
  words(t);
  const { doc } = shell();
  const head = doc.createElement('head');
  doc.head = head;
  const tm = timers();
  const fake = fakeShow();
  let loaded = () => {};
  const css = new Promise((r) => {
    loaded = r;
  });
  const pending = showTitleScreen(doc, { show: fake.show, words: Promise.resolve(), css, now: clock(), later: tm.later, reduced: true, resume: false });
  await settle();
  assert.equal(fake.calls.opts.length, 0, 'no fit before the stylesheet');
  assert.deepEqual(head.children, [], 'no second link');
  loaded();
  await pending;
  assert.equal(fake.calls.opts.length, 1);
  // A stylesheet that never answers holds the cover back FONT_WAIT_MS at most.
  const two = shell();
  two.doc.head = two.doc.createElement('head');
  const tm2 = timers();
  const fake2 = fakeShow();
  const stuck = showTitleScreen(two.doc, { show: fake2.show, words: Promise.resolve(), css: new Promise(() => {}), now: clock(), later: tm2.later, reduced: true, resume: false });
  await settle();
  assert.equal(fake2.calls.opts.length, 0);
  tm2.fire(FONT_WAIT_MS);
  await stuck;
  assert.equal(fake2.calls.opts.length, 1);
  // With none given (a caller of its own), title.js links css/title.css itself.
  const three = shell();
  three.doc.head = three.doc.createElement('head');
  const tm3 = timers();
  const own = showTitleScreen(three.doc, { show: fakeShow().show, words: Promise.resolve(), now: clock(), later: tm3.later, reduced: true, resume: false });
  await settle();
  const link = three.doc.head.children[0];
  assert.equal(link.getAttribute('rel'), 'stylesheet');
  assert.match(link.getAttribute('href'), /\/css\/title\.css$/);
  tm3.fire(FONT_WAIT_MS);
  await own;
});

test('Reduce Motion: the picture finished, then the name, the label and the prompt together, no timer waited on; the CSS keeps every step-in and the pulse under no-preference, and the pulse never dims the prompt under 5:1', async (t) => {
  words(t);
  const { doc, app } = shell();
  const tm = timers();
  const fake = fakeShow();
  fake.draw(); // home.js finishes the draw-in at once under Reduce Motion
  await showTitleScreen(doc, { show: fake.show, words: Promise.resolve(), now: clock(), later: tm.later, reduced: true, resume: false });
  await settle();
  assert.equal(app.getAttribute('data-title'), 'ready');
  assert.deepEqual(tm.live(), [FONT_WAIT_MS], 'only the font wait, unfired');
  // The pulse: from full to 0.7, paper cream on the page's ink, 5.0:1 at its dimmest.
  const src = css('title.css');
  assert.match(src, /@keyframes title-pulse \{\n\s*from \{ opacity: 1; \}\n\s*to \{ opacity: 0\.7; \}\n\}/);
  assert.match(src, /@media \(prefers-reduced-motion: no-preference\) \{[^]*#app\[data-title="ready"\] \.title-go \{\n\s*animation: title-pulse /);
  const cream = hexToRgb(PALETTE[5]);
  const ink = hexToRgb(PALETTE[0]);
  const dim = `#${cream.map((v, i) => Math.round(0.7 * v + 0.3 * ink[i]).toString(16).padStart(2, '0')).join('')}`;
  assert.ok(contrastRatio(dim, PALETTE[0]) >= 5.0, `${contrastRatio(dim, PALETTE[0])}`);
  assert.equal(contrastRatio(dim, PALETTE[0]).toFixed(1), '5.0');
});

test("the shelf while the title shows (the art critic's S7b pass): Works offline's place held from the start so nothing jumps when it arrives; the prompt the only cream line under the picture; an update waiting as one line with a full-height Restart; the sky above the picture navy once it has drawn in; all scoped to #app[data-title], which the game removes", () => {
  const src = css('title.css');
  const rule = (sel) => {
    const at = src.indexOf(`${sel} {`);
    assert.ok(at >= 0, sel);
    return src.slice(at, src.indexOf('}', at));
  };
  // game.css hides [hidden] with !important; the title screen keeps the hidden stamp in the layout, unseen and unread.
  assert.match(css('game.css'), /\[hidden\] \{ display: none !important; \}/);
  const held = rule('#app[data-title] .offline-stamp[hidden]');
  assert.match(held, /display: block !important;/);
  assert.match(held, /visibility: hidden;/);
  // The stamps' size and glacier blue for the install line and the update note (the contrast test holds the colors).
  assert.match(css('game.css'), /\.stamps \{[^}]*font-size: 13px;[^}]*color: var\(--c3\);/);
  for (const sel of ['#app[data-title] .install', '#app[data-title] .update-line', '#app[data-title] #update-restart']) {
    assert.match(rule(sel), /font-size: 13px;/, sel);
    assert.match(rule(sel), /color: var\(--c3\);/, sel);
  }
  const prompts = [...src.matchAll(/color: var\(--c5\)/g)];
  assert.equal(prompts.length, 1, "cream is the prompt's alone");
  // The update note: one row, no box, its Restart a link a full target tall.
  const note = rule('#app[data-title] .update-note');
  for (const d of ['flex-direction: row;', 'min-height: var(--target);', 'background: none;', 'border: 0;']) assert.ok(note.includes(d), d);
  const restart = rule('#app[data-title] #update-restart');
  for (const d of ['min-height: var(--target);', 'text-decoration: underline;', 'background: none;', 'border: 0;']) assert.ok(restart.includes(d), d);
  // The navy above the picture: the plate's width, the cover's own c1, only once the picture has drawn in.
  const sky = rule('#app[data-title] .plate::before');
  for (const d of ['bottom: 100%;', 'background: var(--c1);', 'pointer-events: none;', 'visibility: hidden;']) assert.ok(sky.includes(d), d);
  assert.match(src, /#app\[data-title="name"\] \.plate::before,\n#app\[data-title="label"\] \.plate::before,\n#app\[data-title="ready"\] \.plate::before,\n#app\[data-title="entered"\] \.plate::before \{\n\s*visibility: visible;/);
  assert.ok(!/#app\[data-title="drawing"\] \.plate::before/.test(src), 'never while it draws in');
  // The cover's top rows are flat navy (c1), so the join is seamless.
  const top = composite(renderPic(COVER.ops, { width: 160, height: 320, stamps }));
  for (let x = 0; x < 160; x++) for (let y = 0; y < 2; y++) assert.equal(top[y * 160 + x], 1, `(${x}, ${y})`);
  // Every rule that restyles the page or the shelf is scoped to the title screen, so the take-over undoes it.
  for (const sel of src.replace(/\/\*[^]*?\*\//g, '').match(/^[^@\s{}][^{}]*(?=\{)/gm)) {
    if (/\.(install|update-note|update-line|offline-stamp|plate)\b|#update-restart/.test(sel)) assert.match(sel.trim(), /^#app\[data-(title|hurry)/, sel);
  }
});

test('a squeezed plate hides the label (the prompt stays); a title without its marks draws the cover as it is', async (t) => {
  words(t);
  const squeezed = shell();
  squeezed.doc.defaultView.devicePixelRatio = 2;
  const fake = fakeShow({ shape: { sx: 2, sy: 1, short: true }, ox: 0 });
  await showTitleScreen(squeezed.doc, { show: fake.show, words: Promise.resolve(), now: clock(), later: timers().later, reduced: true, resume: false });
  assert.equal(squeezed.plate.querySelector('.peak-label').hidden, true);
  assert.equal(squeezed.plate.querySelector('.peak-tick').hidden, true);
  assert.ok(squeezed.shelf.querySelector('.title-go'));
  // An art bundle with no title (a misbuild): the cover's own ops, and the label never placed.
  const bare = shell();
  let ops = null;
  const show = async (doc, opts) => {
    ops = opts.prepare({ pics: { cover_high_divide_dusk: COVER } });
    opts.onFit({ sx: 7, sy: 4, short: false }, { origin: { ox: 1, oy: 0 } });
    return { finish() {}, stop() {}, done: Promise.resolve(), art: null, display: null };
  };
  await showTitleScreen(bare.doc, { show, words: Promise.resolve(), now: clock(), later: timers().later, reduced: true, resume: false });
  assert.equal(ops, COVER.ops);
  assert.equal(bare.plate.querySelector('.peak-label').hidden, true);
  // A title whose picture fails lets go of #app (the game takes the page without a tap).
  const failing = shell();
  await assert.rejects(
    showTitleScreen(failing.doc, { show: async () => Promise.reject(new Error('art: 404')), words: Promise.resolve(), now: clock(), later: timers().later, reduced: true, resume: false }),
    /art: 404/,
  );
  assert.equal(failing.app.getAttribute('data-title'), null);
});

test('the resume path (Lead call 65): the session mark, or a dev route in debug mode, draws the quiet cover under the name with no label and no prompt, and hands over when it is done; #map shows the title', async (t) => {
  const ss = session(t);
  words(t);
  // The mark a Restart inside the game left.
  ss.setItem('oph.preview.resume', '1');
  const marked = shell();
  const fake = fakeShow();
  const screen = await showTitleScreen(marked.doc, { show: fake.show, words: Promise.resolve(), now: clock(), later: timers().later, reduced: false });
  assert.equal(screen.resume, true);
  assert.equal(ss.map.get('oph.preview.resume'), '1', 'read and kept for the session');
  assert.equal(marked.doc.querySelector('.title-go'), null, 'no prompt');
  assert.equal(marked.doc.querySelector('.peak-label'), null, 'no label');
  assert.equal(marked.app.getAttribute('data-title'), null);
  assert.equal(fake.calls.opts[0].onFit, undefined);
  assert.deepEqual(fake.calls.ops, quietOps(COVER.ops, TITLE.quiet.map((q) => q.box)), 'the quiet cover, as on the title screen');
  assert.equal(screen.entered, screen.done, 'entered is done');
  let handed = false;
  screen.entered.then(() => {
    handed = true;
  });
  await settle();
  assert.equal(handed, false);
  fake.draw();
  await settle();
  assert.equal(handed, true);
  // The next load in the same session (another Restart, or iOS reloading the app it shut down): a resume again.
  const later = shell();
  const kept = await showTitleScreen(later.doc, { show: fakeShow().show, words: Promise.resolve(), now: clock(), later: timers().later, reduced: true });
  assert.equal(kept.resume, true);
  assert.equal(later.doc.querySelector('.title-go'), null);
  // A new session (the app closed and opened: no mark): the title screen.
  ss.map.clear();
  const next = shell();
  const again = await showTitleScreen(next.doc, { show: fakeShow().show, words: Promise.resolve(), now: clock(), later: timers().later, reduced: true });
  assert.equal(again.resume, false);
  assert.ok(next.doc.querySelector('.title-go'));
  // A dev route in debug mode skips it; #map doesn't.
  for (const [hash, skips] of [['#home&hour=night', true], ['#first', true], ['#map', false]]) {
    const s = shell();
    s.doc.defaultView.location = { search: '?debug=1', hash };
    const r = await showTitleScreen(s.doc, { show: fakeShow().show, words: Promise.resolve(), now: clock(), later: timers().later, reduced: true });
    assert.equal(r.resume, skips, hash);
    assert.equal(Boolean(s.doc.querySelector('.title-go')), !skips, hash);
  }
});

test('nothing in the title screen listens for the page coming back (visibilitychange, pageshow), and main never reaches it', () => {
  const src = readFileSync(join(ROOT, 'web', 'js', 'ui', 'title.js'), 'utf8');
  assert.ok(!/visibilitychange|pageshow|pagehide/.test(src.replace(/^\s*\/\/.*$/gm, '')), 'no such listener');
  const home = readFileSync(join(ROOT, 'web', 'js', 'ui', 'home.js'), 'utf8');
  assert.match(home, /export async function showTitle\(doc = document, opts = \{\}\) \{/);
  assert.match(home, /const ops = opts\.prepare \? opts\.prepare\(art\) : pic\.ops;/, "main's cover: its own ops");
  assert.match(home, /if \(opts\.onFit\) opts\.onFit\(shape, display\);/);
});
