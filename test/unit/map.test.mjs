// The pencil map at #map (BUILD_PLAN S4; GAME_DESIGN 4.3): preview's check
// view of the loop. Its pure parts run here on a real preview build's data:
// the gate, the frame, the picture's ops, the marks and their badges, and
// the legend's miles against the 4.3 tables (the A10 golden). The gate that
// keeps it off main is checked on main's built files.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, posix } from 'node:path';
import { build } from '../../tools/build.mjs';
import { ROOT } from '../../tools/pics.mjs';
import { selfcheckCorpus } from '../../tools/goldens.mjs';
import { fakeDocument } from './textfix.mjs';
import { opensMap, mapFrame, mapOps, layoutMap, milesText, MAP_WIDTH, MAP_SLOTS, BADGE_CSS } from '../../web/js/ui/map.js';
import { opensMap as debugOpensMap, openDebug, MAP_SCREEN, MAP_HASH } from '../../web/js/ui/debug.js';
import { runCheck, resetCheck } from '../../web/js/ui/selfcheck.js';
import { renderPic, composite, TRANSPARENT } from '../../web/js/gfx/picvm.js';
import { PIXEL_ASPECT, pickPixelShape } from '../../web/js/gfx/display.js';
import { setBundle } from '../../web/js/text.js';
import { setChannel } from '../../web/js/platform/storage.js';
import { loadContent } from '../../web/js/engine/api.js';

const tmp = mkdtempSync(join(tmpdir(), 'oph-map-'));
const out = { preview: join(tmp, 'preview'), main: join(tmp, 'main') };
for (const channel of ['preview', 'main']) build({ out: out[channel], channel, quiet: true });
test.after(() => rmSync(tmp, { recursive: true, force: true }));
const readOut = (channel, f) => readFileSync(join(out[channel], f), 'utf8');
const MAP = JSON.parse(readOut('preview', 'data/map.json'));
const RULES = JSON.parse(readOut('preview', 'data/rules.json'));
const GOLDEN = JSON.parse(readFileSync(join(ROOT, 'test', 'golden', 'park', 'm1a.json'), 'utf8'));
const SCOPE = JSON.parse(readFileSync(join(ROOT, 'content', 'scope', 'm1a.json'), 'utf8'));
const CAMPS = [...SCOPE.park.camps, ...SCOPE.park.desk];

/** A document stamped as a build stamps <html>. */
function stamped(screens, channel) {
  const doc = fakeDocument();
  doc.documentElement.setAttribute('data-screens', screens);
  doc.documentElement.setAttribute('data-channel', channel);
  return doc;
}

/** The screens a built page stamps on <html>. */
const screensOf = (html) => /<html[^>]*\sdata-screens="([^"]*)"/.exec(html)[1];

/** The badge box, in picture pixels, for a display shape (as showMap computes it). */
const badgeFor = (sx, sy, dpr) => [Math.ceil((BADGE_CSS[0] * dpr) / sx), Math.ceil((BADGE_CSS[1] * dpr) / sy)];

/**
 * Phones by the shape display.js picks for the sheet's width (its 8 px
 * gutters): the three the session looks at (iPhone SE, 17, 17 Pro Max) and
 * the 11, 13 mini and 14, whose pixels are 4x2 and 6x4. The picture is
 * drawn for each one's own pixel (aspect sy / sx), as showMap draws it.
 */
const PHONES = [
  [375, 667, 2],
  [414, 896, 2],
  [375, 812, 3],
  [390, 844, 3],
  [402, 874, 3],
  [440, 956, 3],
].map(([w, h, dpr]) => {
  const { sx, sy } = pickPixelShape({ cssWidth: w - 16, screenHeight: h, dpr });
  return { name: `${w}x${h}`, sx, sy, dpr, aspect: sy / sx, badge: badgeFor(sx, sy, dpr) };
});

test('opensMap: preview, whose screens list the map, opens it; main never does', () => {
  const main = screensOf(readOut('main', 'index.html'));
  const preview = screensOf(readOut('preview', 'index.html'));
  assert.equal(main, 'app debug title', "main's screens don't move");
  assert.ok(preview.split(' ').includes(MAP_SCREEN));
  assert.equal(opensMap(stamped(main, 'main')), false);
  assert.equal(opensMap(stamped(preview, 'preview')), true);
  assert.equal(opensMap(stamped('', 'dev')), false, 'an unstamped page has no map');
  assert.equal(opensMap(stamped('app maps title', 'preview')), false, 'a whole screen name, not a substring');
  assert.equal(opensMap, debugOpensMap, 'ui/map.js re-exports the gate main.js and the menu ask');
  assert.equal(MAP_HASH, `#${MAP_SCREEN}`);
});

test("the frame: 160 columns, about 240 rows on the doc's wide pixel, and a mile is a mile both ways on it", () => {
  const f = mapFrame(MAP);
  assert.equal(f.width, MAP_WIDTH);
  assert.ok(f.height >= 225 && f.height <= 255, `about 240 rows (${f.height})`);
  const [x0, y0, x1, y1] = MAP.bounds;
  const [ax, ay] = f.at([x0, y0]);
  const [bx, by] = f.at([x1, y1]);
  assert.ok(ax >= 0 && ay >= 0 && bx < f.width && by < f.height, 'the bounds land inside the picture');
  const kx = (bx - ax) / (x1 - x0);
  const ky = (by - ay) / (y1 - y0);
  assert.ok(Math.abs((ky * PIXEL_ASPECT) / kx - 1) < 0.02, `rows per tenth are columns per tenth over PIXEL_ASPECT (${kx.toFixed(3)}, ${ky.toFixed(3)})`);
});

test("on screen, a mile is a mile both ways on every phone: the rows follow the pixel the display picks there", () => {
  assert.deepEqual(PHONES.map((p) => `${p.name} ${p.sx}x${p.sy}`), ['375x667 4x2', '414x896 4x2', '375x812 6x4', '390x844 6x4', '402x874 7x4', '440x956 7x4']);
  const [x0, y0, x1, y1] = MAP.bounds;
  /** Device pixels per tenth of a mile, south over east, for a frame shown at sx x sy. */
  const ratio = (f, sx, sy) => {
    const [ax, ay] = f.at([x0, y0]);
    const [bx, by] = f.at([x1, y1]);
    return (((by - ay) / (y1 - y0)) * sy) / (((bx - ax) / (x1 - x0)) * sx);
  };
  for (const p of PHONES) {
    const f = mapFrame(MAP, { aspect: p.aspect });
    assert.equal(mapOps(MAP, { aspect: p.aspect }).height, f.height);
    assert.equal(layoutMap(MAP, RULES, { aspect: p.aspect }).height, f.height);
    assert.ok(Math.abs(ratio(f, p.sx, p.sy) - 1) < 0.01, `${p.name} (${p.sx}x${p.sy}): a tenth south is a tenth east on screen (${ratio(f, p.sx, p.sy).toFixed(3)})`);
  }
  // The doc's fixed 0.6 is off on the phone wherever its pixel isn't 5:3:
  // the SE's 4x2 squashes the loop a sixth north to south.
  const se = PHONES[0];
  assert.ok(ratio(mapFrame(MAP), se.sx, se.sy) < 0.85, 'the check sees a frame drawn for another pixel');
});

test('mapOps draws in ink, slate, glacier blue, paper cream and brick only, every camp in place', () => {
  const pic = mapOps(MAP);
  assert.deepEqual(mapOps(MAP), pic, 'pure: the same ops twice');
  const slots = new Set(pic.ops.filter((op) => op[0] === 'C' || op[0] === 'D').flatMap((op) => op.slice(1).filter((v) => typeof v === 'number')));
  assert.ok([...slots].every((s) => MAP_SLOTS.includes(s)), `slots ${[...slots].join(', ')}`);
  assert.deepEqual(MAP_SLOTS, [0, 2, 3, 5, 9]);
  assert.ok(!slots.has(7), 'no gold (P07)');
  const r = renderPic(pic.ops, { width: pic.width, height: pic.height });
  assert.deepEqual(r.diag.oob, [], 'nothing drawn off the picture');
  const px = composite(r);
  const used = new Set(px);
  assert.ok(!used.has(TRANSPARENT), 'the paper covers the whole picture');
  assert.deepEqual([...used].sort((a, b) => a - b), [0, 2, 3, 5, 9], 'all five, and nothing else');
  const { at } = mapFrame(MAP);
  const color = (id, dx = 0, dy = 0) => {
    const [x, y] = at(MAP.nodes[id].xy);
    return px[(y + dy) * pic.width + x + dx];
  };
  for (const id of SCOPE.park.camps) {
    assert.equal(color(id), 9, `${id}: a brick mark`);
    assert.equal(color(id, 2, 2), 0, `${id}: with an ink edge`);
  }
  for (const id of SCOPE.park.desk) {
    assert.equal(color(id), 5, `${id}: hollow`);
    assert.equal(color(id, 2, 0), 9, `${id}: in brick`);
  }
  assert.equal(color('sol_duc_trailhead'), 0, 'the trailhead: an ink square');
  assert.equal(color('sol_duc_trailhead', 1, 1), 0);
  for (const id of SCOPE.park.never) assert.equal(color(id), 2, `${id}: a slate pixel, never a camp mark`);
  for (const id of SCOPE.park.map_looks) assert.equal(color(id), 3, `${id}: a glacier-blue lake`);
  assert.equal(color('morgenroth_lake'), 3, 'Lake Morgenroth: a lake with no camp mark (4.3)');
  // Map-only links are slate dots, never ink.
  const mid = (a, b) => at([(MAP.nodes[a].xy[0] + MAP.nodes[b].xy[0]) / 2, (MAP.nodes[a].xy[1] + MAP.nodes[b].xy[1]) / 2]);
  const near = (x, y) => [-1, 0, 1].flatMap((dy) => [-1, 0, 1].map((dx) => px[(y + dy) * pic.width + x + dx]));
  for (const id of SCOPE.park.map_only) {
    const s = MAP.segs[id];
    assert.ok(!near(...mid(s.a, s.b)).includes(0), `${id}: no ink`);
  }
  assert.ok(near(...mid('sol_duc_trailhead', 'sol_duc_falls')).includes(0), 'the maintained trail is ink');
});

test("mapOps on every phone's pixel: nothing off the picture, every camp a brick mark in place", () => {
  for (const { name, aspect } of PHONES) {
    const pic = mapOps(MAP, { aspect });
    const r = renderPic(pic.ops, { width: pic.width, height: pic.height });
    assert.deepEqual(r.diag.oob, [], `${name}: nothing drawn off the picture`);
    const px = composite(r);
    const { at } = mapFrame(MAP, { aspect });
    for (const id of SCOPE.park.camps) {
      const [x, y] = at(MAP.nodes[id].xy);
      assert.equal(px[y * pic.width + x], 9, `${name}: ${id}, a brick mark`);
    }
  }
});

test("layoutMap: the trailhead 0 and the 24 camps 1-24 in counterclockwise order, inside the picture, none on another's pixel, on every phone's pixel", () => {
  for (const aspect of [PIXEL_ASPECT, ...new Set(PHONES.map((p) => p.aspect))]) marksHold(layoutMap(MAP, RULES, { aspect }), aspect);
});

/** layoutMap's marks, as the test above checks them for one pixel aspect. */
function marksHold(L, aspect) {
  const say = (msg) => `${msg} (aspect ${aspect.toFixed(3)})`;
  assert.equal(L.loop, 'high_divide', say('the loop'));
  assert.equal(L.marks.length, 25);
  assert.deepEqual(L.marks.map((m) => m.n), [...Array(25).keys()]);
  assert.equal(L.marks[0].id, 'sol_duc_trailhead');
  assert.equal(L.marks[0].kind, 'trailhead');
  assert.deepEqual(L.marks.slice(1).map((m) => m.id).sort(), [...CAMPS].sort(), 'every plannable camp, desk camps among them');
  for (let i = 2; i < L.marks.length; i++) assert.ok(L.marks[i - 1].ccw <= L.marks[i].ccw, `${L.marks[i].id} follows ${L.marks[i - 1].id} counterclockwise`);
  assert.deepEqual(L.marks.slice(1, 4).map((m) => m.id), ['sol_duc_falls_camp', 'canyon_creek_1', 'hidden_lake']);
  assert.equal(L.marks[24].id, 'sol_duc_river_1');
  for (const m of L.marks) {
    assert.ok(m.x >= 2 && m.y >= 2 && m.x < L.width - 2 && m.y < L.height - 2, say(`${m.id} inside the picture with its mark`));
    assert.equal(m.label, `place.${m.id}`);
  }
  const at = new Set(L.marks.map((m) => `${m.x},${m.y}`));
  assert.equal(at.size, 25, say('no two on the same pixel'));
  const by = Object.fromEntries(L.marks.map((m) => [m.id, m]));
  const apart = (a, b) => Math.max(Math.abs(by[a].x - by[b].x), Math.abs(by[a].y - by[b].y));
  for (const [a, b] of [['round_lake', 'lunch_lake'], ['lunch_lake', 'clear_lake']]) {
    const d = apart(a, b);
    assert.ok(d >= 5 && d <= 8, say(`${a} and ${b} are ${d} pixels apart`));
  }
  // The 5x5 camp marks never overlap.
  for (const p of L.marks) for (const q of L.marks) if (p !== q) assert.ok(Math.abs(p.x - q.x) >= 5 || Math.abs(p.y - q.y) >= 5, say(`${p.id} and ${q.id} marks overlap`));
}

test("the legend's miles are 4.3's tables, both ways round (the A10 golden)", () => {
  const L = layoutMap(MAP, RULES);
  const by = Object.fromEntries(L.marks.map((m) => [m.id, m]));
  assert.deepEqual(Object.keys(GOLDEN.camps.mi10).sort(), [...CAMPS].sort());
  for (const [id, [ccw, cw]] of Object.entries(GOLDEN.camps.mi10)) assert.deepEqual([by[id].ccw, by[id].cw], [ccw, cw], id);
  assert.deepEqual([by.sol_duc_trailhead.ccw, by.sol_duc_trailhead.cw], [0, 0]);
  assert.equal(milesText(by.lunch_lake), '↺ 7.8 · ↻ 10.9');
  assert.equal(milesText(by.sol_duc_river_1), '↺ 16.0 · ↻ 2.4');
  assert.equal(milesText(by.sol_duc_trailhead), '↺ 0.0 · ↻ 0.0');
  assert.equal(milesText({ ccw: null, cw: 5 }), '↺ - · ↻ 0.5');
  // The same rules, loaded as the phone loads them.
  const content = loadContent({ rules: RULES, voice: JSON.parse(readOut('preview', 'data/voice.json')), rulesHash: JSON.parse(readOut('preview', 'version.json')).rules });
  assert.deepEqual(layoutMap(MAP, content.data.rules).marks, L.marks);
});

test('the badges stay inside the picture and cover no mark and no other badge, on every phone', () => {
  const box = (m) => {
    const r = m.kind === 'trailhead' ? 1 : 2;
    return [m.x - r, m.y - r, 2 * r + 1, 2 * r + 1];
  };
  const hit = (p, q) => p[0] < q[0] + q[2] && q[0] < p[0] + p[2] && p[1] < q[1] + q[3] && q[1] < p[1] + p[3];
  for (const phone of PHONES) {
    const L = layoutMap(MAP, RULES, { badge: phone.badge, aspect: phone.aspect });
    const [w, h] = phone.badge;
    const badges = L.marks.map((m) => [m.badge[0], m.badge[1], w, h]);
    badges.forEach((b, i) => {
      const m = L.marks[i];
      assert.ok(b[0] >= 0 && b[1] >= 0 && b[0] + w <= L.width && b[1] + h <= L.height, `${phone.name}: ${m.id}'s badge inside`);
      for (const n of L.marks) assert.ok(!hit(b, box(n)), `${phone.name}: ${m.id}'s badge covers ${n.id}'s mark`);
      badges.forEach((c, j) => j !== i && assert.ok(!hit(b, c), `${phone.name}: ${m.id}'s badge covers ${L.marks[j].id}'s`));
      // Beside its own mark: within a badge's reach of it.
      assert.ok(b[0] <= m.x + 4 && b[0] + w >= m.x - 3 && b[1] <= m.y + 4 && b[1] + h >= m.y - 3, `${phone.name}: ${m.id}'s badge sits by its mark`);
    });
  }
});

test("the debug menu's Map button sets #map and closes the menu, on a build with the map", async (t) => {
  t.after(() => {
    setChannel(null);
    setBundle({}, {}, null);
    resetCheck();
  });
  resetCheck();
  await runCheck({ fetchFn: async () => ({ ok: true, status: 200, json: async () => selfcheckCorpus() }) });
  setChannel('preview');
  setBundle(JSON.parse(readOut('preview', 'text/en.json')), {}, 'preview');
  const doc = stamped(screensOf(readOut('preview', 'index.html')), 'preview');
  const location = { hash: '', search: '', pathname: '/preview/' };
  doc.defaultView = { location };
  await openDebug(doc);
  const button = doc.querySelector('.debug-map');
  assert.ok(button, 'built where the map is');
  assert.equal(button.getAttribute('data-t'), 'dev.map');
  assert.equal(button.textContent, 'Map');
  const kids = doc.querySelector('.debug-sheet').children.map((c) => c.className);
  assert.ok(kids.indexOf('box choice debug-map') < kids.indexOf('box choice debug-throw'), 'above the test-error button');
  button.click();
  assert.equal(location.hash, 'map');
  assert.equal(doc.querySelector('.debug').hidden, true, 'the menu closes');
  // Main has no map: the menu builds the button only behind the gate.
  assert.equal(opensMap(stamped(screensOf(readOut('main', 'index.html')), 'main')), false);
  const src = readFileSync(join(ROOT, 'web', 'js', 'ui', 'debug.js'), 'utf8');
  assert.match(src, /if \(opensMap\(doc\)\) \{\n\s+const mapButton/, "the button is built only behind opensMap");
});

test("main never imports ui/map.js: no static path reaches it, and main.js's dynamic import sits behind the gate", () => {
  const dist = out.main;
  const seen = new Set();
  const walk = (rel) => {
    if (seen.has(rel)) return;
    seen.add(rel);
    const src = readFileSync(join(dist, rel), 'utf8');
    for (const m of src.matchAll(/^\s*(?:import|export)\s[^;]*?from\s+'([^']+)'/gms)) walk(posix.normalize(posix.join(dirname(rel), m[1])));
    for (const m of src.matchAll(/^import\s+'([^']+)'/gm)) walk(posix.normalize(posix.join(dirname(rel), m[1])));
  };
  walk('js/boot.js');
  walk('js/main.js');
  assert.ok(seen.has('js/ui/debug.js') && seen.has('js/text.js'), `the walk follows imports (${[...seen].length} modules)`);
  assert.ok(!seen.has('js/ui/map.js'), 'no static import reaches the map');
  assert.ok(!seen.has('js/engine/graph.js'), "nor the router: main's page loads no engine at launch");
  const main = readOut('main', 'js/main.js');
  const imports = [...main.matchAll(/import\('([^']+)'\)/g)].map((m) => m[1]);
  assert.deepEqual(imports.filter((p) => p.includes('map')), ['./ui/map.js'], 'one dynamic import of the map');
  const gate = main.indexOf('if (opensMap(document)) {');
  assert.ok(gate > 0 && gate < main.indexOf("import('./ui/map.js')"), 'inside the opensMap gate');
  const importsMap = /(?:import\s*\(|from)\s*'[^']*\bmap\.js'/;
  for (const f of ['js/ui/debug.js', 'js/ui/home.js', 'js/ui/app.js', 'js/text.js']) assert.ok(!importsMap.test(readOut('main', f)), `${f} never imports the map`);
  assert.ok(importsMap.test(main), 'the pattern finds an import');
  // And the gate is shut on main's own page.
  assert.equal(opensMap(stamped(screensOf(readOut('main', 'index.html')), 'main')), false);
});

test('preview precaches the map and its data, so it opens offline', () => {
  const pre = JSON.parse(readOut('preview', 'precache.json'));
  for (const f of ['data/map.json', 'data/rules.json', 'data/voice.json', 'js/ui/map.js', 'js/engine/graph.js', 'js/engine/movement.js']) assert.ok(pre.paths[f], f);
  const words = JSON.parse(readOut('preview', 'text/en.json'));
  for (const m of layoutMap(MAP, RULES).marks) assert.equal(typeof words[m.label], 'string', `${m.label} has its words on preview`);
  assert.equal(words['dev.map'], 'Map');
  const mainWords = JSON.parse(readOut('main', 'text/en.json'));
  assert.ok(!Object.keys(mainWords).some((k) => k.startsWith('place.') || k === 'dev.map'), 'main carries none of it');
});
