// The cabin's home screen (BUILD_PLAN S7 D4, D5, D7, D8; GAME_DESIGN 2.2,
// 11.11, 12.1, 12.18): ui/cabin.js, ui/status.js, ui/menu.js and
// ui/mailbox.js. The home's layout on the four phones it lays out; the hit
// areas and the nearest art center; the labels inside the plate and apart,
// turning to dots once used and kept across a reload and a death; the
// rail's disabled places and their Not open yet.; every button named by an
// id; the next step; ≡, the mailbox place and the rail's Mailbox opening
// one sheet, the mailbox; the Sound and Text toggles; an update's flag; the
// live clock and its one timer; the dev overrides; and the cabin's modules
// reaching no trail module.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { readText, bundle } from '../../tools/text.mjs';
import { compileArt } from '../../tools/build.mjs';
import { lintCabin, HOME_PHONES, SAFARI_PHONES } from '../../tools/lint.mjs';
import { loadHotspots } from '../../tools/looks.mjs';
import { setBundle } from '../../web/js/text.js';
import { setChannel, load, save } from '../../web/js/platform/storage.js';
import { pacificNow, hourBounds, sunRow, epochDay, DAY_S } from '../../web/js/platform/now.js';
import {
  renderCabin,
  homeLayout,
  cabinHits,
  placeAt,
  labelBox,
  labelled,
  tappable,
  canvasInset,
  sceneFor,
  sceneOfCtx,
  devOn,
  HOUR_KEY,
  SKY_KEY,
  usedPlaces,
  forgetCabin,
  fontPixel,
  labelChars,
  pointIn,
  LABELS_KEY,
  HOME_STATUS,
  NEXT_GAP_PT,
  NEXT_PT,
  RAIL_GAP_PT,
  RAIL_ROW_PT,
  RAIL_ROW_GAP_PT,
  FOOT_PT,
  MAX_WAIT_MS,
  labelFontPixel,
  nameBox,
  coveredLabels,
  rectIn,
  LABEL_CLEAR_PT,
  NAME_TOP_ROW,
  NAME_ROWS,
  NAME_CLEAR_FP,
} from '../../web/js/ui/cabin.js';
import { homeRooms } from '../../tools/lint.mjs';
import { fontPixel as frameFontPixel, TRAIL_STATUS } from '../../web/js/ui/frame.js';
import { createMenu, MENU_LINE, CLOSE_LINE } from '../../web/js/ui/menu.js';
import { mailboxRows, installMailbox, adoptFoot, nextText, TEXT_LINES } from '../../web/js/ui/mailbox.js';
import { statusLine, soundChanged, watchUpdate, updateWaits, STATUS_PT } from '../../web/js/ui/status.js';
import { PRESS_MS } from '../../web/js/ui/press.js';
import { fakeDocument } from './textfix.mjs';
import { fire } from './forkfix.mjs';

const TEXT = readText(ROOT);
const WORDS = bundle(TEXT, 'preview', [], [])['en.json'];
const ART = compileArt({ screens: ['home'] });
const CABIN = ART.cabin;
const read = (/** @type {string} */ p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const DATA = { sun: read('content/data/quinault_sun.json'), climate: read('content/data/climate.json'), realMoon: true };
const PLACES = CABIN.places;

/** A Map-backed localStorage. */
function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; }, map: m };
}

/** Preview's channel, words and a fresh localStorage, undone after the test. */
function device(t, ls = fakeStorage()) {
  const had = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: ls });
  setChannel('preview');
  setBundle(WORDS, {}, 'preview');
  forgetCabin();
  t.after(() => {
    if (had) Object.defineProperty(globalThis, 'localStorage', had);
    else delete globalThis.localStorage;
    setChannel(null);
    setBundle({}, {}, null);
    forgetCabin();
  });
  return ls;
}

/** A sound that keeps its state and what it played. */
function recSound() {
  let on = true;
  const played = [];
  return { played, play: (c) => played.push(c), isOn: () => on, setOn: (v) => (on = Boolean(v)) };
}

/** The lake's clock at a Pacific date and time (the sun table's offset that day). */
function lakeAt(y, m, d, h, min = 0, s = 0) {
  const row = sunRow(DATA.sun, { y, m, d });
  const secs = h * 3600 + min * 60 + s;
  return pacificNow(new Date((epochDay({ y, m, d }) * DAY_S + secs - row[0] * 3600) * 1000));
}

/** The cabin on a fake page; later records the one timer. */
function cabinOn(t, { screen = { phase: 'home', next: { id: 'plan_first', act: { t: 'start', plan: 'sample' } } }, now = () => lakeAt(2026, 10, 10, 12), dev = null, labels } = {}) {
  const doc = fakeDocument();
  const host = doc.body.appendChild(doc.createElement('div'));
  host.className = 'game-screen';
  const sound = recSound();
  const menu = createMenu(doc, { onOpen: () => sound.play('ui.open') });
  installMailbox(doc, menu, { sound });
  const timers = [];
  const later = (f, ms) => {
    const e = { f, ms, cleared: false };
    timers.push(e);
    return () => (e.cleared = true);
  };
  const nexts = [];
  const c = renderCabin(host, screen, { art: ART, data: DATA, sound, menu, onNext: (a) => nexts.push(a), now, dev, later, ...(labels === undefined ? {} : { labels }) });
  t.after(() => c.release());
  return { doc, host, sound, menu, c, timers, nexts };
}

// ---- The layout -----------------------------------------------------------

test("homeLayout: the plate's pixel shape on the four phones (SE 4x2, 13 mini 6x4, 17 7x4, Pro Max 8x5), and the rows fill the screen", () => {
  const want = {
    se: [[4, 2], [320, 320], 136],
    mini: [[6, 4], [320, 427], 110 + 1 / 3],
    p17: [[7, 4], [374, 427], 160 + 1 / 3],
    promax: [[8, 5], [427, 534], 135 + 1 / 3],
  };
  for (const [name, width, height, dpr, safeTop, safeBottom] of HOME_PHONES) {
    const l = homeLayout({ width, height, dpr, safeTop, safeBottom });
    const [shape, pic, spare] = want[/** @type {keyof typeof want} */ (name)];
    assert.deepEqual([l.shape.sx, l.shape.sy], shape, `${name}: the pixel shape`);
    assert.deepEqual([l.picture.width, l.picture.height], pic, `${name}: the plate in points`);
    assert.ok(Math.abs(l.spare - spare) < 1e-6, `${name}: ${l.spare} pt to spare`);
    assert.ok(l.spare > 100, `${name}: room to spare under the plate`);
    const sum = Object.values(l.rows).reduce((a, b) => a + b, 0) + l.spare;
    assert.ok(Math.abs(sum - (height - safeTop - safeBottom)) < 1e-9, `${name}: the rows and the spare fill the screen`);
    assert.equal(l.rows.status, STATUS_PT);
    assert.ok(l.column >= l.picture.width + 2 * l.keyline && l.mat >= 0, `${name}: the mat holds the plate`);
    assert.equal(Math.round(l.mat * dpr), l.mat * dpr, `${name}: the mat is whole device pixels`);
  }
  // A shorter room picks a smaller pixel, never a taller plate than fits, while the pixel stays at least
  // 2 x 1 pt (every hit area 44 pt: S7 review); a room too short even for that keeps the least tall such
  // shape, and the home scrolls (spare under zero).
  const pro = homeLayout({ width: 440, height: 956, dpr: 3, usable: 700 });
  assert.deepEqual([pro.shape.sx, pro.shape.sy], [7, 4], 'the Pro Max short of room for 8x5: 7x4');
  assert.ok(pro.picture.height + 2 * pro.keyline <= pro.maxCssHeight && pro.spare >= 0);
  const tight = homeLayout({ width: 402, height: 874, dpr: 3, usable: 600 });
  assert.deepEqual([tight.shape.sx, tight.shape.sy], [7, 4], 'the 17 with no room for 7x4: not 5x3 (a 40-pt register post) but 7x4, scrolling');
  assert.ok(tight.spare < 0);
  for (const usable of [400, 450, 500, 550, 600, 650]) {
    for (const [name, width, height, dpr] of HOME_PHONES) {
      const l = homeLayout({ width, height, dpr, usable });
      assert.ok(l.shape.sx / dpr >= 2 - 1e-9 && l.shape.sy / dpr >= 1 - 1e-9, `${name} in ${usable} pt: ${l.shape.sx}x${l.shape.sy} keeps a 2 x 1 pt pixel`);
      assert.ok(2 * l.shape.sy >= l.shape.sx, `${name} in ${usable} pt: never flatter than 2:1`);
      if (l.spare < 0) assert.ok(l.maxCssHeight < l.picture.height + 2 * l.keyline, `${name} in ${usable} pt: it scrolls only when even the smallest pixel can't fit`);
    }
  }
  // The font pixel is the trail frame's.
  for (const dpr of [1, 2, 3]) assert.equal(fontPixel(dpr), frameFontPixel(dpr));
});

test("in Safari before the game is installed (the toolbars up, the install line under the cabin): each phone keeps its installed shape; the install line stays under the cabin only while the plate keeps it, else it goes to the mailbox (S7 review)", () => {
  const want = {
    se_safari: [[4, 2], 'mailbox', 37],
    mini_safari: [[6, 4], 'mailbox', 11 + 1 / 3],
    p17_safari: [[7, 4], 'foot', 26 + 1 / 3],
    promax_safari: [[8, 5], 'foot', 1 + 1 / 3],
  };
  for (const [name, width, height, dpr, usable, install] of SAFARI_PHONES) {
    const l = homeLayout({ width, height, dpr, usable, install });
    const [shape, where, spare] = want[/** @type {keyof typeof want} */ (name)];
    assert.deepEqual([l.shape.sx, l.shape.sy], shape, `${name}: the pixel shape`);
    assert.equal(l.install, where, `${name}: the install line`);
    assert.ok(Math.abs(l.spare - spare) < 1e-6, `${name}: ${l.spare} pt to spare`);
    assert.equal(l.rows.install, where === 'foot' ? install : 0);
    const sum = Object.values(l.rows).reduce((a, b) => a + b, 0) + l.spare;
    assert.ok(Math.abs(sum - usable) < 1e-9, `${name}: the rows, the install line and the spare fill the page`);
  }
  // The review's case: the SE in Safari (548 to 553 pt) counting the install line drew 3x1 (240 x 160 pt, 22-pt hit areas).
  for (const usable of [548, 553]) {
    const l = homeLayout({ width: 375, height: 667, dpr: 2, usable, install: 47 });
    assert.deepEqual([l.shape.sx, l.shape.sy, l.install], [4, 2, 'mailbox'], `${usable}`);
  }
  // Installed, there is no install line: nothing to place.
  assert.equal(homeLayout({ width: 375, height: 667, dpr: 2, safeTop: 20 }).install, 'none');
  // Room for both: the line stays under the cabin.
  assert.equal(homeLayout({ width: 375, height: 667, dpr: 2, usable: 600, install: 47 }).install, 'foot');
});

test("Larger Text: the next step counted at its Plain line (or what it measures when its words wrap), so the rail never runs off the screen (S7 review)", () => {
  const [, width, height, dpr, safeTop, safeBottom] = HOME_PHONES[0];
  const pixel = homeLayout({ width, height, dpr, safeTop, safeBottom });
  for (const px of [20, 33, 47, 53]) {
    const l = homeLayout({ width, height, dpr, safeTop, safeBottom, plainPx: px });
    const step = Math.max(NEXT_PT, Math.ceil(1.35 * px + 10 * l.fp - 1e-6));
    assert.equal(l.rows.next, NEXT_GAP_PT + step, `${px} px: a Plain line and its chrome`);
    const sum = Object.values(l.rows).reduce((a, b) => a + b, 0) + l.spare;
    assert.ok(Math.abs(sum - (height - safeTop - safeBottom)) < 1e-9);
    assert.ok(l.picture.height <= pixel.picture.height);
  }
  // AX5 on the SE: the next step measured at 157 pt (two lines): the spare gives it room, and the plate keeps 4x2.
  const ax5 = homeLayout({ width, height, dpr, safeTop, safeBottom, plainPx: 53, next: 157 });
  assert.equal(ax5.rows.next, NEXT_GAP_PT + 157);
  assert.deepEqual([ax5.shape.sx, ax5.shape.sy], [4, 2]);
  assert.ok(ax5.spare >= 0, `${ax5.spare} pt to spare: the rail stays on the screen`);
  // A measured height under the model's never shrinks it.
  assert.equal(homeLayout({ width, height, dpr, safeTop, safeBottom, plainPx: 53, next: 40 }).rows.next, homeLayout({ width, height, dpr, safeTop, safeBottom, plainPx: 53 }).rows.next);
});

test("home.css holds homeLayout's numbers: the status line, the next step, the rail and the foot", () => {
  const css = readFileSync(join(ROOT, 'web', 'css', 'home.css'), 'utf8');
  const rule = (/** @type {string} */ sel) => {
    const at = css.indexOf(`${sel} {`);
    assert.ok(at >= 0, `home.css has ${sel}`);
    return css.slice(at, css.indexOf('}', at));
  };
  assert.match(rule('.game-screen.cabin'), new RegExp(`grid-template-rows: ${STATUS_PT}px auto minmax\\(0, 1fr\\) auto auto;`));
  assert.match(rule('.game-screen.cabin'), new RegExp(`padding: 0 0 ${FOOT_PT}px;`));
  assert.match(rule('.cabin-next'), new RegExp(`margin-top: ${NEXT_GAP_PT}px;`));
  assert.match(rule('.cabin .next-step'), new RegExp(`height: ${NEXT_PT}px;`));
  assert.match(rule('.cabin-rail'), new RegExp(`margin-top: ${RAIL_GAP_PT}px;`));
  assert.match(rule('.cabin-rail'), new RegExp(`grid-auto-rows: ${RAIL_ROW_PT}px;`));
  assert.match(rule('.cabin-rail'), new RegExp(`gap: ${RAIL_ROW_GAP_PT}px 0;`));
  assert.match(rule('.cabin-rail'), /grid-template-columns: repeat\(3, 1fr\);/);
});

// ---- The hit areas and the labels ------------------------------------------

test('the hit areas: every art center and hit-area center lands on its own place on every phone, and the overlaps go to the nearer art center (the door and the chalkboard, the tub and the shed)', () => {
  for (const [name, width, height, dpr, safeTop, safeBottom] of HOME_PHONES) {
    const l = homeLayout({ width, height, dpr, safeTop, safeBottom });
    const shape = { sx: l.shape.sx, sy: l.shape.sy, dpr, ox: canvasInset(l.shape.sx, dpr) };
    const hits = cabinHits(tappable(PLACES), shape);
    assert.deepEqual(
      hits.map((h) => h.id),
      Object.keys(PLACES).filter((id) => PLACES[id].kind !== 'first'),
      'every place a tap can land on (the lockbox waits for first launch)',
    );
    for (const h of hits) {
      assert.ok(h.w >= 44 - 1e-9 && h.h >= 44 - 1e-9, `${name}: ${h.id} is at least 44 x 44 pt`);
      assert.equal(placeAt(hits, h.cx, h.cy)?.id, h.id, `${name}: ${h.id}'s art center`);
      assert.equal(placeAt(hits, h.x + h.w / 2, h.y + h.h / 2)?.id, h.id, `${name}: ${h.id}'s hit-area center`);
    }
    // Where two hit areas overlap, the nearer art center wins.
    const px = (/** @type {number} */ x, /** @type {number} */ y) => placeAt(hits, shape.ox / dpr + ((x + 0.5) * shape.sx) / dpr, ((y + 0.5) * shape.sy) / dpr);
    assert.equal(px(65, 216)?.id, 'chalkboard', `${name}: x 65 by the chalkboard`);
    assert.equal(px(68, 192)?.id, 'door', `${name}: x 68 by the door's top`);
    assert.equal(px(128, 222)?.id, 'tub', `${name}: by the tub`);
    assert.equal(px(130, 180)?.id, 'shed', `${name}: by the shed`);
    assert.equal(placeAt(hits, -5, -5), null, 'off every place');
  }
  // P17 holds the repo's map clean, and catches a hit area under 44 pt on the SE.
  const looked = loadHotspots(ROOT).hotspots.kinds;
  const defined = (/** @type {string} */ id) => TEXT.lines.has(id);
  const words = (/** @type {string} */ id) => (TEXT.lines.has(id) ? TEXT.lines.get(id).text : null);
  const plate = ART.pics[CABIN.plate];
  assert.deepEqual(lintCabin({ cabin: CABIN, plate, defined, words, looked }), []);
  const thin = structuredClone(CABIN);
  thin.places.mailbox.hit = [134, 276, 21, 44];
  assert.match(lintCabin({ cabin: thin, plate, defined, words, looked }).map((i) => i.msg).join('\n'), /mailbox: its hit area is 42\.0 x 44\.0 pt on the se/);
});

test('the labels: the rail word at each place, inside the plate and apart on every phone, each edge on a whole device pixel; the dot where the label was', (t) => {
  device(t);
  const ids = labelled(PLACES).map(([id]) => id);
  assert.deepEqual(ids, ['door', 'shed', 'car', 'fire_bowl', 'mailbox']);
  for (const [name, width, height, dpr, safeTop, safeBottom] of HOME_PHONES) {
    const l = homeLayout({ width, height, dpr, safeTop, safeBottom });
    const shape = { sx: l.shape.sx, sy: l.shape.sy, dpr, ox: canvasInset(l.shape.sx, dpr) };
    const boxes = labelled(PLACES).map(([id, p]) => ({ id, b: labelBox(p, Array.from(WORDS[`home.rail.${p.rail}`]).length, shape) }));
    // S7b (Lead call 69): the label's font pixel, never taller than a picture row (rewritten from the chrome's own, fontPixel).
    const fp = labelFontPixel(shape);
    assert.ok(fp <= fontPixel(dpr) + 1e-9 && fp <= shape.sy / dpr + 1e-9, `${name}: a label's font pixel is the chrome's or a row, the smaller`);
    assert.equal(Math.round(fp * dpr), fp * dpr, `${name}: a whole number of device pixels`);
    for (const { id, b } of boxes) {
      assert.ok(b.x >= shape.ox / dpr && b.y >= 0 && b.x + b.w <= shape.ox / dpr + l.picture.width && b.y + b.h <= l.picture.height, `${name}: ${id}'s label inside the plate`);
      assert.equal(Math.round(b.x * dpr), b.x * dpr, `${name}: ${id} starts on a device pixel`);
      assert.equal(b.h, 16 * fp, 'a chrome row and a font pixel above and below');
      assert.ok(b.h / (shape.sy / dpr) <= 16 + 1e-9, `${name}: ${id}'s label stands at most 16 rows tall (S7's SE: 24)`);
      assert.ok(b.dot.x > b.x && b.dot.x + b.dot.w < b.x + b.w && b.dot.y > b.y && b.dot.y + b.dot.h < b.y + b.h, `${name}: ${id}'s dot inside where its label was`);
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i].b;
        const c = boxes[j].b;
        assert.ok(!(a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.y + c.h && c.y < a.y + a.h), `${name}: ${boxes[i].id} and ${boxes[j].id} apart`);
      }
    }
  }
  // Mailbox (7 glyphs) on the SE: 7 x 8 + 2 font pixels at 1 pt (S7b: S7 drew them at the chrome's 1.5), on the 17 at 4/3 pt.
  assert.equal(labelBox(PLACES.mailbox, 7, { sx: 4, sy: 2, dpr: 2 }).w, 58);
  assert.equal(labelBox(PLACES.mailbox, 7, { sx: 7, sy: 4, dpr: 3 }).w, (58 * 4) / 3);
  assert.equal(labelChars('home.rail.stories'), 7, 'with the words loaded, their length');
});

test("labelFontPixel (S7b, Lead call 69): the chrome's font pixel or a picture row, the smaller, in whole device pixels: 1 pt on the SE's 4x2, 4/3 pt on the 3x phones, 1.5 pt on a 2x 5x3", () => {
  assert.equal(labelFontPixel({ sy: 2, dpr: 2 }), 1, "the SE's 4x2: a row is 1 pt, under the chrome's 1.5");
  assert.equal(labelFontPixel({ sy: 4, dpr: 3 }), 4 / 3, 'the 13 mini and the 17 (4 rows a 3 px): unchanged');
  assert.equal(labelFontPixel({ sy: 5, dpr: 3 }), 4 / 3, 'the Pro Max: the chrome\'s');
  assert.equal(labelFontPixel({ sy: 3, dpr: 2 }), 1.5, 'a 2x 5x3: the chrome\'s');
  assert.equal(labelFontPixel({ sy: 1, dpr: 2 }), 0.5, 'a squeezed row: one device pixel');
  assert.equal(labelFontPixel({ sy: 2, dpr: 1 }), 2, 'a 1x screen (dev): the chrome\'s 2');
  const css = readFileSync(join(ROOT, 'web', 'css', 'home.css'), 'utf8');
  // The rule of the selector alone (not the shared .label-tag, .label-dot one).
  const rule = (/** @type {string} */ sel) => css.slice(css.lastIndexOf(`\n${sel} {`), css.indexOf('}', css.lastIndexOf(`\n${sel} {`)));
  assert.match(rule('.label-tag'), /padding: var\(--label-fp\);/);
  assert.match(rule('.label-tag'), /font: calc\(12 \* var\(--label-fp\)\)\/calc\(14 \* var\(--label-fp\)\) var\(--font-chrome\);/);
  assert.match(rule('.label-dot'), /width: calc\(2 \* var\(--label-fp\)\);/);
  assert.match(rule('.label-dot'), /box-shadow: 0 0 0 var\(--label-fp\) var\(--c0\);/);
  assert.match(css, /\.cabin-label\[data-covered\] \{ visibility: hidden; \}/);
  assert.match(rule('.game-screen.cabin'), /--label-fp: var\(--fp\);/);
  // The cabin sets it from the display's shape.
  assert.match(readFileSync(join(ROOT, 'web', 'js', 'ui', 'cabin.js'), 'utf8'), /setProperty\('--label-fp', `\$\{labelFontPixel\(shape\)\}px`\)/);
});

test("the labels stand 6 pt clear of every other place's and Look's art on every room (S7b, Lead call 69: the SE's Plan and Stories no longer close on the fire bowl), and P17 holds it", () => {
  assert.equal(LABEL_CLEAR_PT, 6);
  for (const { name, dpr, layout: l } of homeRooms(CABIN.rail.length)) {
    const shape = { sx: l.shape.sx, sy: l.shape.sy, dpr, ox: canvasInset(l.shape.sx, dpr) };
    const cx = shape.sx / dpr;
    const cy = shape.sy / dpr;
    for (const [id, p] of labelled(PLACES)) {
      const b = labelBox(p, Array.from(WORDS[`home.rail.${p.rail}`]).length, shape);
      for (const [other, q] of Object.entries(PLACES)) {
        if (other === id || !['place', 'look'].includes(q.kind)) continue;
        const a = { x: shape.ox / dpr + q.art[0] * cx, y: q.art[1] * cy, w: q.art[2] * cx, h: q.art[3] * cy };
        const gap = Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w), a.y - (b.y + b.h), b.y - (a.y + a.h));
        assert.ok(gap >= LABEL_CLEAR_PT - 1e-9, `${name}: ${id}'s label ${gap.toFixed(1)} pt from the ${other}`);
      }
    }
  }
  // On the SE, Plan (the door's) stands 12 pt over the fire bowl (S7: 1 pt), and Gear 6 over the tub. Plan's top
  // sits on the bottom step's lower edge, row 233, so it reads as the porch's, not a label loose on the lawn (the
  // art critic's S7b pass: 3 rows up from 236, where it floated between the steps and the bowl).
  const se = homeLayout({ width: 375, height: 667, dpr: 2, safeTop: 20 });
  const seShape = { sx: se.shape.sx, sy: se.shape.sy, dpr: 2, ox: 0 };
  const plan = labelBox(PLACES.door, 4, seShape);
  assert.deepEqual(PLACES.door.label, [80, 233]);
  assert.equal(plan.y, 233 * (seShape.sy / 2), "Plan's top on the bottom step's lower edge");
  assert.equal(PLACES.fire_bowl.art[1] - (plan.y + plan.h), 12);
  const gear = labelBox(PLACES.shed, 4, seShape);
  assert.equal(PLACES.tub.art[1] - (gear.y + gear.h), 6);
});

test("nameBox: the cabin's name's line box in picture pixels, as home.css's .cabin-name sets it, inside cabin.json's quiet.name at every room, a cell and a half either side along it (S7b, Lead call 69)", () => {
  const css = readFileSync(join(ROOT, 'web', 'css', 'home.css'), 'utf8');
  const at = css.indexOf('.cabin-name {');
  const name = css.slice(at, css.indexOf('}', at));
  assert.match(name, new RegExp(`top: calc\\(${NAME_TOP_ROW} \\* var\\(--row\\)\\);`));
  assert.match(name, new RegExp(`height: calc\\(${NAME_ROWS} \\* var\\(--row\\)\\);`));
  assert.match(name, /font: var\(--chrome-size\)\/var\(--chrome-line\) var\(--font-chrome\);/);
  assert.match(name, /text-shadow: 0 var\(--fp\) 0 var\(--c0\);/);
  assert.match(name, /left: var\(--mat, 0px\);\s*right: var\(--mat, 0px\);/);
  assert.match(name, /justify-content: center;/);
  assert.equal(NAME_CLEAR_FP, 12, 'a character cell and a half');
  const chars = Array.from(WORDS['app.name']).length;
  assert.equal(chars, 23);
  // The SE: 23 glyphs of 8 font pixels at 1.5 pt is 276 pt, 138 columns of 2 pt, centered: columns 11 to 149; its 14-pixel line and the shadow's pixel centered on row 15.
  const se = nameBox({ sx: 4, sy: 2, dpr: 2 }, chars);
  assert.deepEqual([se.x, se.w, se.y, se.y + se.h], [11, 138, 4.5, 27]);
  const q = CABIN.quiet.name;
  assert.deepEqual(q, [0, 0, 160, 29]);
  let widest = 0;
  for (const { name: room, dpr, layout: l } of homeRooms(CABIN.rail.length)) {
    const shape = { sx: l.shape.sx, sy: l.shape.sy, dpr, ox: canvasInset(l.shape.sx, dpr) };
    const n = nameBox(shape, chars, l);
    // Centered between the mats: within a device pixel of the plate's middle.
    assert.ok(Math.abs(n.x + n.w / 2 - 80) <= 1 / shape.sx + 1e-9, `${room}: centered (${(n.x + n.w / 2).toFixed(3)})`);
    for (const b of [n, nameBox(shape, chars, l, NAME_CLEAR_FP)]) {
      const box = [Math.max(0, Math.floor(b.x) - 1), 0, Math.min(160, Math.ceil(b.x + b.w) + 1), Math.ceil(b.y + b.h) + 1];
      assert.ok(box[0] >= q[0] && box[2] <= q[0] + q[2] && box[3] <= q[1] + q[3], `${room}: the name's line [${box}] inside quiet.name`);
    }
    widest = Math.max(widest, nameBox(shape, chars, l, NAME_CLEAR_FP).w);
  }
  assert.ok(widest >= 156, `on the SE a cell and a half either side reaches the plate's edges (${widest.toFixed(1)} columns), so the quiet sky is the whole band`);
  // P17 catches a quiet sky that no longer holds the name, and a Dipper star in it.
  const looked = loadHotspots(ROOT).hotspots.kinds;
  const defined = (/** @type {string} */ id) => TEXT.lines.has(id);
  const words = (/** @type {string} */ id) => (TEXT.lines.has(id) ? TEXT.lines.get(id).text : null);
  const plate = ART.pics[CABIN.plate];
  const narrow = structuredClone(CABIN);
  narrow.quiet.name = [10, 0, 141, 29];
  assert.match(lintCabin({ cabin: narrow, plate, defined, words, looked }).map((i) => i.msg).join('\n'), /quiet\.name \[10,0,141,29\] does not hold the name's line on the se/);
  const short = structuredClone(CABIN);
  short.quiet.name = [0, 0, 160, 20];
  assert.match(lintCabin({ cabin: short, plate, defined, words, looked }).map((i) => i.msg).join('\n'), /does not hold the name's line on the mini/);
  const dipper = structuredClone(CABIN);
  dipper.stars.dipper[0] = [121, 20];
  assert.match(lintCabin({ cabin: dipper, plate, defined, words, looked }).map((i) => i.msg).join('\n'), /stars\.dipper: the star at 121,20 is in the name's quiet sky/);
  const none = structuredClone(CABIN);
  delete none.quiet;
  assert.match(lintCabin({ cabin: none, plate, defined, words, looked }).map((i) => i.msg).join('\n'), /quiet\.name: the name needs its quiet sky/);
});

test('coveredLabels and rectIn (S7b, Lead call 69): a label whose rect the Look box overlaps is covered; one clear of it, or only touching its edge, is not', () => {
  const box = { x: 6, y: 280, w: 300, h: 40 };
  const labels = new Map([
    ['mailbox', { x: 230, y: 264, w: 58, h: 16.5 }],
    ['car', { x: 9, y: 276, w: 42, h: 16 }],
    ['door', { x: 140, y: 236, w: 34, h: 16 }],
    ['shed', { x: 260, y: 264, w: 34, h: 16 }],
  ]);
  assert.deepEqual(coveredLabels(box, labels), ['mailbox', 'car'], "the mailbox's half under it and the car's under it; the door clear; the shed touching its top edge only");
  assert.deepEqual(coveredLabels(box, new Map([['dot', { x: 10, y: 290, w: 0, h: 0 }]])), [], 'nothing with no area');
  // rectIn: the offset chain to the figure (a transform never moves it), with an inner parent's border.
  const figure = {};
  const layer = { offsetLeft: 10, offsetTop: 0, offsetParent: figure, clientLeft: 0, clientTop: 0 };
  assert.deepEqual(rectIn({ offsetLeft: 5, offsetTop: 7, offsetWidth: 30, offsetHeight: 16, offsetParent: layer }, figure), { x: 15, y: 7, w: 30, h: 16 });
  const bordered = { offsetLeft: 10, offsetTop: 4, offsetParent: figure, clientLeft: 2, clientTop: 3 };
  assert.deepEqual(rectIn({ offsetLeft: 5, offsetTop: 7, offsetWidth: 30, offsetHeight: 16, offsetParent: bordered }, figure), { x: 17, y: 14, w: 30, h: 16 });
  const rect = (left, top, width, height) => () => ({ left, top, width, height });
  assert.deepEqual(rectIn({ getBoundingClientRect: rect(110, 220, 30, 16) }, { getBoundingClientRect: rect(100, 200, 320, 320) }), { x: 10, y: 20, w: 30, h: 16 });
  assert.equal(rectIn({}, {}), null);
});

test('a Look box over the cabin hides each label it covers until it closes: a long press on the car, a Look, Not open yet. (S7b, Lead call 69)', (t) => {
  device(t);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { doc, host, c } = cabinOn(t);
  // The fake page lays out: the Look box over the plate's lower part, each label where the SE draws it.
  const proto = Object.getPrototypeOf(doc.createElement('div'));
  const se = { sx: 4, sy: 2, dpr: 2 };
  const at = new Map(labelled(PLACES).map(([id, p]) => [id, labelBox(p, Array.from(WORDS[`home.rail.${p.rail}`]).length, se)]));
  Object.defineProperty(proto, 'getBoundingClientRect', {
    configurable: true,
    value() {
      if (this.classList && this.classList.contains('look-box')) return { left: 4.5, top: 275, width: 311, height: 42 };
      if (this.classList && (this.classList.contains('label-tag') || this.classList.contains('label-dot'))) {
        const b = at.get(this.parentNode.getAttribute('data-place'));
        const r = this.classList.contains('label-tag') ? b : { ...b.dot, x: b.dot.x, y: b.dot.y };
        return { left: r.x, top: r.y, width: r.w, height: r.h };
      }
      return { left: 0, top: 0, width: 320, height: 320 };
    },
  });
  t.after(() => delete proto.getBoundingClientRect);
  const covered = () => host.querySelectorAll('.cabin-label').filter((l) => l.hasAttribute('data-covered')).map((l) => l.getAttribute('data-place'));
  assert.deepEqual(covered(), []);
  const car = host.querySelectorAll('.cabin-place').find((b) => b.getAttribute('data-place') === 'car');
  fire(doc, 'pointerdown', { target: car });
  t.mock.timers.tick(PRESS_MS);
  fire(doc, 'pointerup', { target: car });
  assert.deepEqual(c.figure.querySelectorAll('.look-box p').map((p) => p.getAttribute('data-t')), ['home.place.car']);
  assert.deepEqual(covered(), ['car', 'fire_bowl', 'mailbox'], "Drive, Stories and the mailbox's half-hidden label hide under the box");
  // The tap that closes the box shows them again.
  fire(doc, 'click', { target: c.figure });
  assert.equal(c.figure.querySelectorAll('.look-box').length, 0);
  assert.deepEqual(covered(), []);
  // A Look (the tub) and Not open yet. (the shed) do the same; a used label's dot counts where it shows.
  c.tap('tub');
  assert.deepEqual(covered(), ['car', 'fire_bowl', 'mailbox']);
  c.tap('shed');
  assert.deepEqual(c.figure.querySelectorAll('.look-box p').map((p) => p.getAttribute('data-t')), ['home.place.shed', 'home.soon']);
  assert.deepEqual(covered(), ['car', 'fire_bowl', 'mailbox'], 'opening one box over another moves the marks with it');
  c.release();
  assert.deepEqual(covered(), [], 'and leaving the cabin clears them');
});

// ---- The screen -------------------------------------------------------------

test('the cabin: the status line (the time, ≡ named as the mailbox, Sound:on), the picture named by its alt parts, the place buttons by id, the next step and the rail, in reading order', (t) => {
  device(t);
  const { host, c } = cabinOn(t);
  const kids = host.children.map((k) => k.className);
  assert.deepEqual(kids, ['status-line', 'cabin-picture', 'cabin-next', 'cabin-rail']);
  const status = host.querySelector('.status-line');
  assert.equal(status.querySelector('.status-score').getAttribute('data-t'), 'fmt.clock_pm', 'noon: 12:00 pm');
  assert.equal(status.querySelector('.status-score').textContent.replace(/\s/g, ' '), '12:00 pm');
  assert.equal(status.querySelector('.status-menu').getAttribute('data-t-aria'), 'home.place.mailbox');
  assert.equal(status.querySelector('.status-sound').getAttribute('data-t'), 'trail.status.sound_on');
  const img = host.querySelector('.cabin-alt');
  assert.equal(img.getAttribute('role'), 'img');
  assert.deepEqual(img.getAttribute('data-t-alt').split(' '), c.alt());
  assert.equal(c.alt()[0], 'alt.scene.cabin');
  assert.equal(img.getAttribute('aria-label').split(' ')[0], 'An');
  // The place buttons, in reading order (4.7), each named by its line.
  const places = host.querySelectorAll('.cabin-place');
  assert.deepEqual(places.map((b) => b.getAttribute('data-place')), ['door', 'shed', 'car', 'fire_bowl', 'mailbox', 'tub', 'register_post']);
  assert.deepEqual(places.map((b) => b.getAttribute('data-t-aria')), ['home.place.door', 'home.place.shed', 'home.place.car', 'home.place.fire_bowl', 'home.place.mailbox', 'look.name.tub', 'look.name.register_post']);
  for (const b of places) assert.equal(b.getAttribute('aria-label'), WORDS[b.getAttribute('data-t-aria')]);
  // The shed, the car and the fire bowl come later: described by Not open yet.
  assert.deepEqual(places.filter((b) => b.getAttribute('aria-describedby') === 'home-soon').map((b) => b.getAttribute('data-place')), ['shed', 'car', 'fire_bowl']);
  assert.equal(host.querySelector('#home-soon').getAttribute('data-t'), 'home.soon');
  // A description only: hidden, so VoiceOver never reads a stray Not open yet. as its own stop after the next step (S7 review).
  assert.equal(host.querySelector('#home-soon').hidden, true);
  assert.ok(!host.querySelector('#home-soon').classList.contains('vh'));
  // The next step and the rail.
  const next = host.querySelector('.next-step');
  assert.equal(next.querySelector('.choice-label').getAttribute('data-t'), 'home.next.plan_first');
  assert.equal(next.disabled, false);
  const rail = host.querySelectorAll('.rail-item');
  assert.deepEqual(rail.map((b) => b.getAttribute('data-t')), ['home.rail.plan', 'home.rail.gear', 'home.rail.drive', 'home.rail.stories', 'home.rail.mailbox']);
  assert.deepEqual(rail.filter((b) => b.getAttribute('aria-disabled') === 'true').map((b) => b.getAttribute('data-rail')), ['gear', 'drive', 'stories']);
  for (const b of rail.filter((x) => x.getAttribute('aria-disabled') === 'true')) assert.equal(b.getAttribute('aria-describedby'), 'home-soon');
  // The name over the sky: app.name, hidden from VoiceOver.
  const name = host.querySelector('.cabin-name');
  assert.equal(name.getAttribute('data-t'), 'app.name');
  assert.equal(name.getAttribute('aria-hidden'), 'true');
  assert.equal(c.focus, next, 'the next step takes focus');
});

test('the next step: its act on a tap (the game draws the seed and guards it); a step the build can\'t take yet shows disabled with Not open yet., and the door and Plan say so too', (t) => {
  device(t);
  const { host, nexts } = cabinOn(t);
  host.querySelector('.next-step').click();
  assert.deepEqual(nexts, [{ t: 'start', plan: 'sample' }]);
  host.querySelector('.cabin-place[data-place]').click();
  assert.deepEqual(nexts[1], { t: 'start', plan: 'sample' }, 'the screen door does the next step until S10');
  host.querySelectorAll('.rail-item')[0].click();
  assert.equal(nexts.length, 3, 'and so does Plan');
  // Main, after the cabin's promotion: no trip to start.
  const off = cabinOn(t, { screen: { phase: 'home', next: { id: 'plan_first', act: null } } });
  const b = off.host.querySelector('.next-step');
  assert.equal(b.disabled, true);
  assert.equal(b.getAttribute('aria-describedby'), 'home-soon');
  b.click();
  assert.deepEqual(off.nexts, []);
  assert.equal(off.host.querySelectorAll('.rail-item')[0].getAttribute('aria-disabled'), 'true');
  off.c.tap('door');
  assert.deepEqual(off.c.figure.querySelectorAll('.look-box p').map((p) => p.getAttribute('data-t')), ['home.place.door', 'home.soon'], 'the door: its name and Not open yet.');
  assert.deepEqual(off.nexts, []);
  // After a trip: Plan a trip.
  const after = cabinOn(t, { screen: { phase: 'home', next: { id: 'plan', act: { t: 'start', plan: 'sample' } } } });
  assert.equal(after.host.querySelector('.next-step .choice-label').getAttribute('data-t'), 'home.next.plan');
});

test("a place whose screen comes later (the shed, the car, the fire bowl), from its button or the rail: its name and Not open yet. in the Look box; the tub and the register post answer Looks; a tap on no place reads the cabin's alt text", (t) => {
  device(t);
  const { host, c, sound } = cabinOn(t);
  const box = () => c.figure.querySelectorAll('.look-box p').map((p) => p.getAttribute('data-t'));
  host.querySelector('.cabin-place[data-place]');
  const btn = (/** @type {string} */ id) => host.querySelectorAll('.cabin-place').find((b) => b.getAttribute('data-place') === id);
  btn('shed').click();
  assert.deepEqual(box(), ['home.place.shed', 'home.soon']);
  assert.ok(sound.played.includes('ui.open'), 'the Look opens with its tick');
  host.querySelectorAll('.rail-item').find((b) => b.getAttribute('data-rail') === 'drive').click();
  assert.deepEqual(box(), ['home.place.car', 'home.soon'], 'the rail opens the same');
  btn('fire_bowl').click();
  assert.deepEqual(box(), ['home.place.fire_bowl', 'home.soon']);
  btn('tub').click();
  assert.deepEqual(box(), ['look.tub']);
  btn('register_post').click();
  assert.deepEqual(box(), ['look.register_post']);
  c.figure.dispatchEvent({ type: 'click' });
  assert.deepEqual(c.figure.querySelectorAll('.look-box span').map((s) => s.getAttribute('data-t')), c.alt(), 'off every place: the alt text, as the trail does');
  c.tap('peak');
  assert.deepEqual(c.figure.querySelectorAll('.look-box span').map((s) => s.getAttribute('data-t')), c.alt(), 'a silent place: the alt text too (lead call 58)');
});

test('a click with a pointer position lands on the nearest art center; one without (VoiceOver, the keyboard) on its own button', () => {
  assert.equal(pointIn({ getBoundingClientRect: () => ({ left: 10, top: 20 }) }, { clientX: 15, clientY: 30, detail: 1 })?.x, 5);
  assert.equal(pointIn({ getBoundingClientRect: () => ({ left: 10, top: 20 }) }, { clientX: 15, clientY: 30, detail: 0 }), null, "VoiceOver's activation, the keyboard");
  assert.equal(pointIn({}, { clientX: 15, clientY: 30, detail: 1 }), null);
  assert.equal(pointIn({ getBoundingClientRect: () => ({ left: 0, top: 0 }) }, {}), null);
});

test('a long press on a place shows its name (lead call 57: the labels use the rail word); never a tap', (t) => {
  device(t);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { doc, host, c, nexts } = cabinOn(t);
  const door = host.querySelector('.cabin-place');
  fire(doc, 'pointerdown', { target: door });
  t.mock.timers.tick(PRESS_MS);
  fire(doc, 'pointerup', { target: door });
  assert.deepEqual(c.figure.querySelectorAll('.look-box p').map((p) => p.getAttribute('data-t')), ['home.place.door']);
  // (The press's capture listener stops the click before the Look's own sees it, stopImmediatePropagation; fire() calls both.)
  assert.equal(fire(doc, 'click', { target: door }).stopped, true, 'the held press is no tap');
  assert.deepEqual(nexts, []);
});

test("the labels: the rail's word at each place until it is used (its button or its rail button), then a dot; kept as labels, the player's (a reload and a death keep them); none on first launch until the guest book is signed", (t) => {
  const ls = device(t);
  const first = cabinOn(t);
  const label = (/** @type {any} */ host, /** @type {string} */ id) => host.querySelectorAll('.cabin-label').find((l) => l.getAttribute('data-place') === id);
  assert.deepEqual(first.host.querySelectorAll('.cabin-label').map((l) => l.getAttribute('data-place')), ['door', 'shed', 'car', 'fire_bowl', 'mailbox']);
  assert.equal(first.host.querySelector('.cabin-labels').getAttribute('aria-hidden'), 'true');
  assert.deepEqual(first.host.querySelectorAll('.label-tag').map((s) => s.getAttribute('data-t')), ['home.rail.plan', 'home.rail.gear', 'home.rail.drive', 'home.rail.stories', 'home.rail.mailbox']);
  assert.equal(label(first.host, 'shed').hasAttribute('data-used'), false);
  first.c.tap('shed');
  assert.equal(label(first.host, 'shed').hasAttribute('data-used'), true, "the shed's label turns to a dot");
  first.host.querySelectorAll('.rail-item').find((b) => b.getAttribute('data-rail') === 'mailbox').click();
  assert.equal(label(first.host, 'mailbox').hasAttribute('data-used'), true, 'the rail button counts');
  first.c.tap('tub');
  assert.deepEqual(usedPlaces(), ['shed', 'mailbox'], 'a Look has no label');
  assert.deepEqual(JSON.parse(ls.getItem(`oph.preview.${LABELS_KEY}`)), ['shed', 'mailbox']);
  // A reload (a new cabin on the same storage), and a death (the labels are no hiker's): kept.
  const again = cabinOn(t, { screen: { phase: 'home', next: { id: 'plan_first', act: { t: 'start', plan: 'sample' } } } });
  assert.deepEqual(again.host.querySelectorAll('.cabin-label[data-used]').map((l) => l.getAttribute('data-place')), ['shed', 'mailbox']);
  assert.deepEqual(load(LABELS_KEY), ['shed', 'mailbox']);
  // First launch: none until the guest book is signed (2.2 step 4).
  const none = cabinOn(t, { labels: false });
  assert.equal(none.host.querySelectorAll('.cabin-label').length, 0);
});

test('≡, the mailbox place and the rail\'s Mailbox open one sheet, the mailbox, named home.place.mailbox, with a Close for VoiceOver; on the trail ≡ names it Menu', (t) => {
  device(t);
  const { host, menu, sound, c } = cabinOn(t);
  const sheet = () => /** @type {any} */ (menu.settings).parentNode;
  host.querySelector('.status-menu').click();
  assert.equal(menu.isOpen(), true);
  assert.equal(menu.label(), 'home.place.mailbox');
  assert.equal(sheet().getAttribute('aria-label'), WORDS['home.place.mailbox']);
  assert.ok(sound.played.includes('ui.open'));
  const close = sheet().querySelector('.menu-close');
  assert.equal(close.getAttribute('data-t'), CLOSE_LINE);
  assert.equal(CLOSE_LINE, 'trail.why.close');
  close.click();
  assert.equal(menu.isOpen(), false);
  c.tap('mailbox');
  assert.equal(menu.isOpen(), true, 'the mailbox place');
  menu.close();
  host.querySelectorAll('.rail-item').find((b) => b.getAttribute('data-rail') === 'mailbox').click();
  assert.equal(menu.isOpen(), true, "the rail's Mailbox");
  menu.close();
  menu.open({ label: TRAIL_STATUS.menu });
  assert.equal(menu.label(), MENU_LINE, 'the trail names it Menu');
  assert.equal(sheet().getAttribute('data-t-aria'), 'trail.status.menu');
  assert.deepEqual(sheet().children.map((k) => k.className.split(' ').find((x) => x.startsWith('menu-'))), ['menu-close', 'menu-rows', 'menu-settings', 'menu-foot'], 'rows (Pack, Map and Log on a short trail screen), the settings, the foot');
  assert.equal(HOME_STATUS.menu, 'home.place.mailbox');
});

test("the mailbox's settings: Sound:on / Sound:off with the status line's key, in step with it; Text:pixel / Text:plain writing the text key and applying it at once", (t) => {
  const ls = device(t);
  const doc = fakeDocument();
  const sound = recSound();
  sound.setOn = (v) => ls.setItem('oph.preview.sound', v ? 'on' : 'off');
  sound.isOn = () => ls.getItem('oph.preview.sound') !== 'off';
  const status = statusLine(doc, { sound, onMenu: () => {}, lines: HOME_STATUS });
  let redrawn = 0;
  const rows = mailboxRows(doc, { sound, onText: () => redrawn++ });
  t.after(() => {
    status.release();
    rows.release();
  });
  assert.equal(rows.sound.getAttribute('data-t'), 'trail.status.sound_on');
  assert.equal(rows.sound.getAttribute('aria-pressed'), 'true');
  rows.sound.click();
  assert.equal(ls.getItem('oph.preview.sound'), 'off');
  assert.equal(rows.sound.getAttribute('data-t'), 'trail.status.sound_off');
  assert.equal(status.sound.getAttribute('data-t'), 'trail.status.sound_off', "the status line's toggle follows");
  status.sound.click();
  assert.equal(ls.getItem('oph.preview.sound'), 'on');
  assert.equal(rows.sound.getAttribute('data-t'), 'trail.status.sound_on', 'and the other way');
  // Text: no probe here (Node), so the pixel font; a tap writes plain and applies it.
  assert.equal(rows.text.getAttribute('data-t'), TEXT_LINES.pixel);
  rows.text.click();
  assert.equal(ls.getItem('oph.preview.text'), '"plain"');
  assert.equal(doc.documentElement.getAttribute('data-text'), 'plain');
  assert.equal(rows.text.getAttribute('data-t'), 'home.mail.text_plain');
  assert.equal(redrawn, 1, 'the game redraws');
  rows.text.click();
  assert.equal(ls.getItem('oph.preview.text'), '"pixel"');
  assert.equal(doc.documentElement.getAttribute('data-text'), 'pixel');
  assert.deepEqual([nextText('pixel'), nextText('plain')], ['plain', 'pixel']);
  soundChanged();
});

test('the foot moves into the sheet once, the same nodes (five taps on the build code still open the debug menu from there)', (t) => {
  device(t);
  const doc = fakeDocument();
  const update = doc.body.appendChild(doc.createElement('div'));
  update.id = 'update';
  update.hidden = true;
  const stamps = doc.body.appendChild(doc.createElement('p'));
  const stamp = stamps.appendChild(doc.createElement('span'));
  stamp.id = 'build-stamp';
  let taps = 0;
  stamp.addEventListener('pointerup', () => taps++);
  const menu = createMenu(doc);
  const foot = adoptFoot(doc, menu);
  assert.deepEqual(foot.children, [update, stamps]);
  adoptFoot(doc, menu);
  assert.deepEqual(foot.children, [update, stamps], 'moved once');
  stamp.dispatchEvent({ type: 'pointerup' });
  assert.equal(taps, 1, 'its listener came with it');
  // ≡'s flag while the update waits.
  const b = doc.createElement('button');
  assert.equal(updateWaits(doc), false);
  watchUpdate(doc, [b]);
  assert.equal(b.hasAttribute('data-flag'), false);
  update.hidden = false;
  assert.equal(updateWaits(doc), true);
  watchUpdate(doc, [b]);
  assert.equal(b.hasAttribute('data-flag'), true);
});

// ---- The live scene ---------------------------------------------------------

test("the live scene: the lake's hour on the status line and in the alt text, one timer at a time to the next minute or the scene's next change, a change redrawn at once", (t) => {
  device(t);
  let at = lakeAt(2026, 10, 10, 18, 5, 30);
  const { host, c, timers } = cabinOn(t, { now: () => at });
  assert.equal(c.scene().hour, 'day', '18:05:30: still day (dusk at 18:06)');
  assert.equal(host.querySelector('.status-score').textContent.replace(/\s/g, ' '), '6:05 pm', 'the clock never rounds up');
  assert.equal(host.getAttribute('data-hour'), 'day');
  assert.equal(timers.length, 1);
  const b = hourBounds(sunRow(DATA.sun, at), CABIN.hours);
  assert.ok(timers[0].ms <= Math.min(30, b.dusk - at.secs) * 1000 + 50 && timers[0].ms > 0, `the next minute: ${timers[0].ms} ms`);
  at = lakeAt(2026, 10, 10, 18, 7);
  timers[0].f();
  assert.equal(c.scene().hour, 'dusk');
  assert.equal(host.getAttribute('data-hour'), 'dusk');
  assert.ok(c.alt().includes('alt.hour.dusk') && c.alt().includes('alt.cabin.lit'), 'the lights are on');
  assert.equal(timers.length, 2, 'the next timer');
  // At night: the clock in the evening, never longer than a minute to wait.
  at = lakeAt(2026, 10, 10, 23, 59, 50);
  timers[1].f();
  assert.equal(c.scene().hour, 'night');
  assert.equal(host.querySelector('.status-score').getAttribute('data-t'), 'fmt.clock_pm');
  assert.ok(timers[2].ms <= MAX_WAIT_MS);
  // Leaving the screen clears the timer.
  c.release();
  assert.equal(timers[2].cleared, true);
});

test('sceneFor: the dev overrides (an hour, a sky, the moon) over the live scene; dawn is the morning\'s and blue hour the evening\'s', () => {
  const noon = lakeAt(2026, 10, 10, 12);
  const live = sceneFor(noon, { ...DATA, cabin: CABIN });
  assert.equal(live.hour, 'day');
  assert.deepEqual(sceneFor(noon, { ...DATA, cabin: CABIN }, { hour: 'dawn' }), { ...live, hour: 'dawn', evening: false });
  assert.deepEqual(sceneFor(noon, { ...DATA, cabin: CABIN }, { hour: 'blue' }), { ...live, hour: 'blue', evening: true });
  assert.deepEqual(sceneFor(noon, { ...DATA, cabin: CABIN }, { sky: 'fog' }), { ...live, sky: 'clear', fog: true });
  assert.deepEqual(sceneFor(noon, { ...DATA, cabin: CABIN }, { sky: 'rain' }), { ...live, sky: 'rain', fog: false });
  assert.equal(sceneFor(noon, { ...DATA, cabin: CABIN }, { moon: 4 }).moon, 4);
  assert.deepEqual(sceneFor(noon, { ...DATA, cabin: CABIN }, { hour: 'dusk_x', sky: 'snow', moon: 9 }), live, 'unknown overrides change nothing');
  // A build without the sun table or the climate: the day, clear.
  assert.deepEqual(sceneFor(noon, { sun: null, climate: null, cabin: CABIN }), { hour: 'day', evening: true, sky: 'clear', fog: false, moon: 0, next: DAY_S });
});

test("the dev controls' kept hour and sky apply only in debug mode: a choice left on a phone (the hour key is the trail's too) never pins the cabin off the lake's clock (S7 review)", (t) => {
  device(t);
  const noon = () => lakeAt(2026, 10, 10, 12);
  const live = sceneOfCtx({ now: noon, data: DATA, devOn: () => false }, CABIN);
  assert.equal(live.hour, 'day');
  save(HOUR_KEY, 'night');
  save(SKY_KEY, 'rain');
  assert.deepEqual(sceneOfCtx({ now: noon, data: DATA, devOn: () => false }, CABIN), live, 'outside debug mode: the lake\'s clock and the date\'s sky');
  const dev = sceneOfCtx({ now: noon, data: DATA, devOn: () => true }, CABIN);
  assert.deepEqual([dev.hour, dev.sky], ['night', 'rain'], 'in debug mode: the controls');
  // Debug mode is the address's ?debug=1 or the debug menu opened since the page loaded (neither here).
  assert.equal(devOn(''), false);
  assert.equal(devOn('?debug=1'), true);
  assert.equal(devOn('?debug=0'), false);
  assert.deepEqual(sceneOfCtx({ now: noon, data: DATA }, CABIN), live, 'by default, debug mode decides');
  // The #home route's override is debug mode's own, and wins.
  assert.equal(sceneOfCtx({ now: noon, data: DATA, dev: { hour: 'dusk' }, devOn: () => false }, CABIN).hour, 'dusk');
  // The cabin itself, with the night and the rain kept: the lake's noon.
  const { c, host } = cabinOn(t, { now: noon });
  assert.equal(c.scene().hour, 'day');
  assert.equal(host.getAttribute('data-sky'), live.fog ? 'fog' : live.sky);
});

/**
 * A phone with a canvas (a 2D context that draws nothing) and Reduce
 * Motion on, so nothing waits on a frame; undone after the test.
 */
function canvasPhone(t, doc) {
  const ctx2d = new Proxy({ createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) }, { get: (o, k) => (k in o ? o[k] : () => {}), set: () => true });
  const make = doc.createElement;
  doc.createElement = (tag) => {
    const el = make(tag);
    el.getBoundingClientRect = () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 });
    if (tag === 'canvas') el.getContext = () => ctx2d;
    return el;
  };
  const listeners = new Map();
  const win = {
    innerWidth: 402,
    innerHeight: 778,
    devicePixelRatio: 3,
    screen: { width: 402, height: 874 },
    addEventListener: (k, f) => listeners.set(k, [...(listeners.get(k) || []), f]),
    removeEventListener: (k, f) => listeners.set(k, (listeners.get(k) || []).filter((x) => x !== f)),
    fire: (k) => (listeners.get(k) || []).forEach((f) => f({ type: k })),
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
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
  return win;
}

test('on a phone: the picture is the composed cabin at the hour (its key), the buttons sit over their hit areas, and an update raises the mailbox flag on the plate and marks ≡ and the rail', (t) => {
  device(t);
  const doc = fakeDocument();
  const win = canvasPhone(t, doc);
  const host = doc.body.appendChild(doc.createElement('div'));
  const update = doc.body.appendChild(doc.createElement('div'));
  update.id = 'update';
  update.hidden = true;
  const sound = recSound();
  const menu = createMenu(doc);
  const c = renderCabin(host, { phase: 'home', next: { id: 'plan', act: { t: 'start', plan: 'sample' } } }, { art: ART, data: DATA, sound, menu, onNext: () => {}, now: () => lakeAt(2026, 8, 20, 21, 30), dev: { sky: 'clear' }, later: () => () => {} });
  t.after(() => c.release());
  assert.match(String(c.key()), /^cabin@night\.clear/, `the night's key: ${c.key()}`);
  assert.equal(host.getAttribute('data-key'), c.key());
  assert.equal(c.alt().at(-1), 'alt.hour.night');
  const door = host.querySelectorAll('.cabin-place')[0];
  assert.ok(parseFloat(door.style.getPropertyValue('width')) >= 44, 'the door button is 44 pt wide at least');
  assert.ok(host.style.getPropertyValue('--col'), 'the layout set the column');
  // The update waits: the flag goes up on the plate.
  update.hidden = false;
  win.fire('oph:update');
  assert.match(String(c.key()), /\.flag_up$/);
  assert.equal(host.querySelector('.status-menu').hasAttribute('data-flag'), false, 'no observer in Node: ≡ is marked on the next draw');
  const again = renderCabin(doc.body.appendChild(doc.createElement('div')), { phase: 'home', next: null }, { art: ART, data: DATA, sound, menu, onNext: () => {}, now: () => lakeAt(2026, 8, 20, 21, 30), later: () => () => {} });
  t.after(() => again.release());
  assert.equal(again.figure.parentNode.querySelector('.status-menu').hasAttribute('data-flag'), true, '≡ carries the flag');
  assert.equal(again.rail.get('mailbox').hasAttribute('data-flag'), true, "and the rail's Mailbox");
  assert.equal(again.next, null, 'no next step: no button');
});

// ---- The module graph -------------------------------------------------------

test("the cabin's modules never import the trail's (ui/frame.js, choices.js, sheet.js, outcome.js, compass.js, strip.js, toolbar.js), so the cabin reaches no trail line when it comes to main", () => {
  const banned = ['ui/frame.js', 'ui/choices.js', 'ui/sheet.js', 'ui/outcome.js', 'ui/compass.js', 'ui/strip.js', 'ui/toolbar.js', 'ui/app.js'];
  const seen = new Set();
  const visit = (/** @type {string} */ rel) => {
    if (seen.has(rel)) return;
    seen.add(rel);
    const src = readFileSync(join(ROOT, 'web', 'js', rel), 'utf8');
    for (const m of src.matchAll(/^import [^;]*?from '(\.{1,2}\/[^']+)'/gm)) {
      const dep = join(dirname(rel), m[1]).split('\\').join('/');
      assert.ok(!banned.includes(dep), `${rel} imports ${dep}`);
      visit(dep);
    }
  };
  // S7 track C: first launch's too (the lockbox's questions and the guest book on the porch).
  for (const root of ['ui/cabin.js', 'ui/status.js', 'ui/menu.js', 'ui/mailbox.js', 'ui/look.js', 'ui/textbox.js', 'ui/press.js', 'ui/motion.js', 'gfx/cabin.js', 'platform/now.js', 'ui/porch.js', 'ui/lockbox.js', 'ui/guestbook.js']) visit(root);
  assert.ok(seen.has('ui/glyph.js') && seen.has('gfx/cabin.js') && seen.has('platform/now.js') && seen.has('ui/porch.js'));
});
