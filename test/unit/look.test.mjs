// Look (BUILD_PLAN S6 track C; GAME_DESIGN 12.1, 12.2, 11.8; the spec's
// lead call 5): the hotspots come from the data (bases', scenes' and
// stamps' own Z ops, mirrored with their stamps), so every drawable place
// has its Looks; the hit areas reach 44 pt at all six phones and every
// looked hotspot's own center opens its own Look; the words go by kind
// (with a place's own), a tap on no hotspot shows the alt text; the Look
// box is UI only (no action, so no log, state or hash moves); and lint P15
// holds every kind, Look and spoken name to its lines.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadArt, loadCabin } from '../../tools/pics.mjs';
import { compileArt } from '../../tools/build.mjs';
import { readText } from '../../tools/text.mjs';
import { validate } from '../../tools/schema.mjs';
import { loadHotspots, shippedHotspots, placeParts, cabinParts, lintLooks, artLineIds, HOTSPOTS_FILE } from '../../tools/looks.mjs';
import { lintArtWords } from '../../tools/lint.mjs';
import { renderPic } from '../../web/js/gfx/picvm.js';
import { compose, drawable, hotspotsOf, HOURS, TRAIL_SPRITES, WIDTH } from '../../web/js/gfx/compose.js';
import { hitAreas, lookAt, lookLines, lookedSpots, renderLooks, openLook, closeLook, LOOK_MIN_PT } from '../../web/js/ui/look.js';
import { renderFrame, frameLayout } from '../../web/js/ui/frame.js';
import { dispatch, screenOf } from '../../web/js/engine/api.js';
import { CONTENT, atFork, device, frameDoc, ctxFor, fire, fakeSound } from './forkfix.mjs';
import { newSession } from '../../web/js/engine/api.js';
import { lockboxActs } from '../../web/js/engine/selfcheck.js';
import { canon } from '../../web/js/engine/canon.js';

const ART = loadArt();
const SHIPPED = compileArt({ screens: ['app', 'debug', 'guestbook', 'title', 'trail'] });
const LOOKED = SHIPPED.hotspots;
const COMPOSER = { compose, drawable };
const PLACES = Object.keys(ART.recipes.places).filter((p) => drawable(p, ART));

/** The six phones of 3.2: their pixel shape (frameLayout's) and pixel ratio. */
const PHONES = [
  ['iPhone 17', 402, 874, 3, 62, 34],
  ['iPhone 15/16', 393, 852, 3, 59, 34],
  ['13 mini', 375, 812, 3, 50, 34],
  ['iPhone 11 / XR', 414, 896, 2, 48, 34],
  ['Pro Max', 440, 956, 3, 62, 34],
  ['SE (short)', 375, 667, 2, 20, 0],
].map(([name, width, height, dpr, safeTop, safeBottom]) => {
  const l = frameLayout({ width, height, dpr, safeTop, safeBottom });
  return { name, dpr, sx: l.shape.sx, sy: l.shape.sy, picture: l.picture };
});

test('the hotspots come from the data: a base\'s or a scene\'s own, and each stamp\'s in its own coordinates, offset and mirrored as the picture VM records them, for every drawable place at every hour', () => {
  let flipped = 0;
  for (const p of PLACES) {
    for (const hour of HOURS) {
      const c = compose(p, ART, { hour, sprites: TRAIL_SPRITES });
      const r = renderPic(c.ops, { width: c.width, height: c.height, stamps: ART.stamps });
      assert.deepEqual(c.hotspots, r.hotspots, `${p} at ${hour}: compose's hotspots are the VM's`);
      if (c.flip && hour === 'day') flipped++;
    }
  }
  assert.ok(flipped >= 3, `some places are mirrored (${flipped}), and their stamps' hotspots with them`);
  // The stamps' own: the privy, the ridge and the hiker at Deer Lake; Olympus at the High Divide.
  const dl = compose('deer_lake', ART, { sprites: TRAIL_SPRITES }).hotspots;
  assert.deepEqual(dl.find((h) => h.id === 'privy'), { id: 'privy', x: 132, y: 79, w: 12, h: 8 });
  assert.deepEqual(dl.find((h) => h.id === 'hiker'), { id: 'hiker', x: 33, y: 133, w: 6, h: 18 });
  assert.ok(compose('high_divide', ART, { sprites: TRAIL_SPRITES }).hotspots.some((h) => h.id === 'olympus'));
  // A mirrored stamp's hotspot: (WIDTH - 1 - x) - (w - 1) from the anchor.
  const flip = hotspotsOf([['T', 'privy_roof', 100, 50, 1]], ART.stamps);
  assert.deepEqual(flip, [{ id: 'privy', x: 100 + 2 - 11, y: 43, w: 12, h: 8 }]);
  assert.deepEqual(hotspotsOf([['T', 'privy_roof', WIDTH - 1 - 100, 50, 0]], ART.stamps)[0].x, WIDTH - (100 + 2 - 11) - 12, 'the same box as the unmirrored, mirrored');
  // Anchors are never Looks.
  assert.deepEqual(hotspotsOf([['Z', 'at_spot', 1, 1, 1, 1], ['Z', 'lake', 0, 0, 4, 4]], {}), [{ id: 'lake', x: 0, y: 0, w: 4, h: 4 }]);
});

test('hit areas (12.1): at all six phones, every looked hotspot of every drawable place gets at least 44 x 44 pt inside the picture, and its own center opens its own Look; the smaller stack over the larger', () => {
  let checked = 0;
  for (const ph of PHONES) {
    const cx = ph.sx / ph.dpr;
    const cy = ph.sy / ph.dpr;
    for (const p of PLACES) {
      const spots = lookedSpots(compose(p, ART, { sprites: TRAIL_SPRITES }).hotspots, LOOKED);
      const areas = hitAreas(spots, { sx: ph.sx, sy: ph.sy, dpr: ph.dpr });
      assert.equal(areas.length, spots.length);
      for (let k = 1; k < areas.length; k++) assert.ok(areas[k].spot.w * areas[k].spot.h <= areas[k - 1].spot.w * areas[k - 1].spot.h, `${ph.name} ${p}: bottom to top, larger first`);
      for (const a of areas) {
        assert.ok(a.w >= Math.min(LOOK_MIN_PT, 160 * cx) - 1e-9 && a.h >= Math.min(LOOK_MIN_PT, 168 * cy) - 1e-9, `${ph.name} ${p} ${a.id}: ${a.w} x ${a.h}`);
        assert.ok(a.x >= -1e-9 && a.y >= -1e-9 && a.x + a.w <= 160 * cx + 1e-9 && a.y + a.h <= 168 * cy + 1e-9, `${ph.name} ${p} ${a.id}: inside the picture`);
        const s = a.spot;
        const hit = lookAt(areas, (s.x + s.w / 2) * cx, (s.y + s.h / 2) * cy);
        assert.equal(hit && hit.id, a.id, `${ph.name} ${p}: ${a.id}'s own center opens its own Look`);
        checked++;
      }
    }
  }
  assert.ok(checked > 6 * 28, `${checked} hotspots checked`);
  // The rim on the SE (4x2: 44 pt is 22 columns by 44 rows): Lunch Lake sits over the basin, and the basin's
  // center, a row above Lunch Lake's own box, still opens the basin (Lunch Lake's area slides off it).
  const se = PHONES.find((p) => p.name === 'SE (short)');
  assert.deepEqual([se.sx, se.sy], [4, 2]);
  const rim = hitAreas(lookedSpots(compose('seven_lakes_basin', ART, { sprites: TRAIL_SPRITES }).hotspots, LOOKED), { sx: 4, sy: 2, dpr: 2 });
  assert.deepEqual(rim.map((a) => a.id), ['basin', 'bogachiel_peak', 'staircase', 'lunch_lake', 'sign', 'hiker']);
  const lunch = rim.find((a) => a.id === 'lunch_lake');
  assert.equal(lunch.h, 44, '13 rows grow to 44');
  assert.ok(lunch.y > 82, 'and slide below the basin\'s center row');
  assert.equal(lookAt(rim, 80 * 2, 82).id, 'basin');
  assert.equal(lookAt(rim, 90 * 2, 89).id, 'lunch_lake');
  assert.equal(lookAt(rim, 1, 1), null, 'the sky above the peak: no hotspot, the alt Look');
});

test('hit areas: a smaller hotspot slides off a larger one\'s center that its own box doesn\'t cover, but never off its own box; one that holds the larger one\'s center keeps it', () => {
  const big = { id: 'big', x: 0, y: 0, w: 160, h: 40 };
  const small = { id: 'small', x: 70, y: 21, w: 20, h: 4 }; // the big one's center (80, 20) is a row above it
  const areas = hitAreas([small, big], { sx: 2, sy: 1, dpr: 1 });
  assert.deepEqual(areas.map((a) => a.id), ['big', 'small']);
  const s = areas[1];
  assert.ok(s.y > 20 && s.y <= 21, `slid down past the center: ${s.y}`);
  assert.equal(s.h, 44);
  assert.equal(lookAt(areas, 160, 20).id, 'big');
  assert.equal(lookAt(areas, 160, 23).id, 'small');
  const inside = { id: 'inside', x: 75, y: 18, w: 10, h: 4 }; // holds (80, 20)
  const two = hitAreas([big, inside], { sx: 2, sy: 1, dpr: 1 });
  assert.equal(lookAt(two, 160, 20).id, 'inside', "a hotspot drawn over another's center is the Look there");
});

test('the words: a kind\'s Look, a place\'s own where the words have one; looked kinds only get buttons, named by look.name.<kind>, in a group named Look, bottom to top', (t) => {
  device(t);
  assert.deepEqual(lookLines('lake', 'deer_lake', () => false), [{ id: 'look.lake' }]);
  assert.deepEqual(lookLines('lake', 'deer_lake', (id) => id === 'look.lake.deer_lake'), [{ id: 'look.lake.deer_lake' }]);
  const doc = frameDoc();
  const spots = compose('deer_lake', ART, { sprites: TRAIL_SPRITES }).hotspots;
  const tapped = [];
  const looks = renderLooks(doc, spots, LOOKED, (kind) => tapped.push(kind));
  assert.equal(looks.layer.getAttribute('role'), 'group');
  assert.equal(looks.layer.getAttribute('aria-label'), 'Look');
  assert.equal(looks.layer.getAttribute('data-t-aria'), 'trail.look.group');
  assert.deepEqual(looks.buttons.map((b) => b.getAttribute('data-kind')), ['lake', 'ridge', 'hiker', 'privy'], 'far_shore and shore are silent: no button');
  assert.deepEqual(looks.buttons.map((b) => b.getAttribute('aria-label')), ['The lake', 'The ridge', 'You', 'The privy']);
  assert.deepEqual(looks.buttons.map((b) => b.getAttribute('data-t-aria')), ['look.name.lake', 'look.name.ridge', 'look.name.hiker', 'look.name.privy']);
  looks.buttons[3].click();
  assert.deepEqual(tapped, ['privy']);
  // Placed for the SE's 4x2 shape: CSS px from the canvas's top left.
  const areas = looks.place({ sx: 4, sy: 2, dpr: 2, ox: 0 });
  assert.equal(looks.buttons[0].style.getPropertyValue('left'), `${areas[0].x}px`);
  assert.equal(looks.buttons[3].style.getPropertyValue('height'), '44px');
});

test('the Look box: a tap on a hotspot opens its Look with ui.open\'s tick, focus on the box; a tap anywhere closes it (the tap is the box\'s) and focus goes back; Escape too; UI only, so the game never acts', (t) => {
  device(t);
  const doc = frameDoc();
  let s = newSession(CONTENT);
  for (const a of lockboxActs('K7QM2Q9F', CONTENT)) s = dispatch(s, a, CONTENT).session;
  const r = dispatch(s, { t: 'sign', name: 'Robin', id: 'h00000001' }, CONTENT);
  const start = dispatch(r.session, { t: 'start', plan: 'sample', seed: 'K7QM2Q9F' }, CONTENT);
  const host = doc.createElement('div');
  host.className = 'game-screen';
  doc.body.appendChild(host);
  const acts = [];
  const sound = fakeSound();
  const before = canon(start.session);
  const f = renderFrame(host, start.screen, (a) => acts.push(a), ctxFor(start.screen, doc, { art: SHIPPED, composer: COMPOSER, sound }));
  const figure = host.querySelector('.frame-picture');
  const lake = f.looks.buttons.find((b) => b.getAttribute('data-kind') === 'lake');
  lake.click();
  const box = figure.querySelector('.look-box');
  assert.ok(box, 'the Look box is in the picture');
  assert.equal(box.querySelector('p').getAttribute('data-t'), 'look.lake');
  assert.equal(box.querySelector('p').textContent, 'You see a mountain lake, very still, keeping a copy of everything above it.');
  assert.ok(box.classList.contains('box'), 'a Sierra box');
  assert.equal(doc.activeElement, box);
  assert.deepEqual(sound.played, ['ui.open']);
  // A tap anywhere: the document's capture listener takes it, and the box closes.
  const ev = fire(doc, 'click');
  assert.ok(ev.prevented && ev.stopped, 'the dismissing tap reaches nothing under it');
  assert.equal(figure.querySelector('.look-box'), null);
  assert.equal(doc.activeElement, lake, 'focus back on the hotspot');
  // Escape closes it too; and closeLook (a new stop, the compass) with no Look open does nothing.
  lake.click();
  fire(doc, 'keydown', { key: 'Escape' });
  assert.equal(figure.querySelector('.look-box'), null);
  closeLook(figure);
  // A tap on the picture that hits no Look: the alt text, one paragraph of its parts' lines.
  figure.click();
  const alt = figure.querySelector('.look-box');
  assert.deepEqual(alt.querySelectorAll('p').length, 1);
  assert.deepEqual(alt.querySelectorAll('span').map((s) => s.getAttribute('data-t')), ['alt.base.lake_basin', 'alt.skyline.deer_lake_ridge', 'alt.sprite.hiker']);
  fire(doc, 'click');
  assert.deepEqual(acts, [], 'no Look ever acts');
  assert.equal(canon(start.session), before, 'nor moves the session');
  assert.equal(canon(screenOf(start.session.state, CONTENT)), canon(start.screen));
  f.release();
});

test('the first tap on the picture while it draws in only finishes the draw-in, in the figure\'s capture phase, before any Look', () => {
  const src = readFileSync(join(ROOT, 'web', 'js', 'ui', 'frame.js'), 'utf8');
  assert.match(src, /const firstTap = \(\/\*\* @type \{Event\} \*\/ event\) => \{\n\s+if \(!run \|\| run\.done\) return;\n\s+event\.preventDefault\(\);\n\s+event\.stopPropagation\(\);\n\s+run\.finish\(\);\n\s+\};\n\s+figure\.addEventListener\('click', firstTap, true\);/);
  // The compass hides the Looks and closes an open one.
  assert.match(src, /compass\(roll, u, o = \{\}\) \{\n\s+closeWhy\(doc\);\n\s+closeLook\(figure\);\n\s+looks\.layer\.hidden = true;/);
});

test('hotspots.json: every kind looked (its Look, its spoken name) or silent with its reason, its schema clean; the build ships {kind: looked} beside the recipes', () => {
  const file = loadHotspots();
  assert.deepEqual(file.errors, []);
  const kinds = file.hotspots.kinds;
  for (const [k, v] of Object.entries(kinds)) assert.ok(v.look === true || (v.look === false && v.why.length > 20), `${k}: looked, or silent with its reason`);
  // S7: and the cabin's three silent kinds (lead call 58: the peak, the chalkboard and the clam shovel).
  assert.deepEqual(Object.keys(kinds).filter((k) => !kinds[k].look).sort(), ['chalkboard', 'clam_shovel', 'cloud', 'far_shore', 'heather', 'meadow', 'olympus', 'peak', 'shore', 'sky'], "S6's silent kinds (the spec's six, and the rim's cloud), and S7's cabin's");
  assert.deepEqual(shippedHotspots(file.hotspots), LOOKED);
  // A missing look on a looked kind fails the schema's oneOf.
  const schema = JSON.parse(readFileSync(join(ROOT, 'schemas', 'hotspots.schema.json'), 'utf8'));
  assert.ok(validate(schema, { kinds: { x: { look: false } } }).errors.length, 'silent with no why');
  assert.ok(validate(schema, { kinds: { x: { look: true, why: 'w' } } }).errors.length, 'looked with a why');
});

test('P15 in the repo is clean; planted, it fails a kind hotspots.json lacks, a looked kind with no Look or no name, a part with no alt line, a place\'s own Look for a place without the kind, and a reserved kind', () => {
  assert.deepEqual(lintArtWords().filter((i) => i.code === 'P15' || i.code === 'J01'), []);
  const parts = [
    { place: 'here', kinds: ['lake', 'newkind'], alt: { day: ['alt.base.x'], night: ['alt.base.x', 'alt.hour.night'] } },
    { place: 'there', kinds: ['lake'], alt: { day: ['alt.base.x'] } },
  ];
  const lines = new Set(['look.lake', 'alt.base.x', 'look.lake.nowhere', 'look.lake.here']);
  const file = { hotspots: { kinds: { lake: { look: true }, name: { look: false, why: 'w' }, gone: { look: false, why: 'w' } } }, src: '', errors: [] };
  const msgs = lintLooks({ parts, file, defined: (id) => lines.has(id), ids: lines }).map((i) => `${i.code}${i.level ? ` ${i.level}` : ''}: ${i.msg}`);
  assert.ok(msgs.some((m) => /^P15: the "newkind" hotspot \(in here\) isn't in content\/art\/hotspots\.json/.test(m)), msgs.join('\n'));
  assert.ok(msgs.some((m) => /^P15: kind "lake" is looked, so it needs the line look\.name\.lake/.test(m)));
  assert.ok(msgs.some((m) => /^P15: alt\.hour\.night isn't a line, and it describes 1 drawable place \(here\)/.test(m)));
  assert.ok(msgs.some((m) => /^P15: look\.lake\.nowhere is a place's own Look, but nowhere is no drawable place/.test(m)));
  assert.ok(!msgs.some((m) => /look\.lake\.here/.test(m)), "a place's own Look that fits is fine");
  assert.ok(msgs.some((m) => /^P15: "name" can't be a hotspot kind/.test(m)));
  assert.ok(msgs.some((m) => /^P15 warn: kind "gone" is in no drawable place's picture/.test(m)));
  // The lines the art names, for T11: the parts at every hour, the looked kinds' Looks and names, a place's own.
  assert.deepEqual([...artLineIds(parts, { lake: true }, (id) => lines.has(id))].sort(), ['alt.base.x', 'alt.hour.night', 'look.lake', 'look.lake.here', 'look.name.lake']);
});

test("P15 over the repo's places: every drawable place's kinds are in hotspots.json, and every place's alt parts are lines, at every hour (S7: the cabin's Look and silent kinds, and its alt parts, too)", () => {
  const text = readText();
  const parts = [...placeParts(ART), ...cabinParts(loadCabin())];
  assert.equal(parts.length, PLACES.length + 1);
  assert.deepEqual(parts.at(-1).kinds, ['tub', 'register_post', 'peak', 'chalkboard', 'clam_shovel'], "the cabin's");
  const kinds = new Set(parts.flatMap((p) => p.kinds));
  assert.deepEqual([...kinds].sort(), Object.keys(loadHotspots().hotspots.kinds).sort(), 'every kind a place carries, and no other');
  for (const p of parts) for (const ids of Object.values(p.alt)) for (const id of ids) assert.ok(text.lines.has(id), `${p.place}: ${id}`);
  assert.equal(HOTSPOTS_FILE, 'content/art/hotspots.json');
});

test('the Look on a tall picture (S7: the cabin, 160 x 320): a hit area grows to 44 pt and stays inside the plate, and its box opens over the picture\'s figure', (t) => {
  // The register post at the plate's left edge on the SE's 4x2 pixel: clamped to the picture, 44 pt at least.
  const spot = { id: 'register_post', x: 3, y: 221, w: 12, h: 42 };
  const [a] = hitAreas([spot], { sx: 4, sy: 2, dpr: 2, width: 160, height: 320 });
  assert.ok(a.w >= LOOK_MIN_PT && a.h >= LOOK_MIN_PT);
  assert.ok(a.x >= 0 && a.y >= 0 && a.x + a.w <= 320 && a.y + a.h <= 320, 'inside the 320 x 320-pt plate');
  // Low on the plate, where a 168-row picture would have clamped it away.
  const low = hitAreas([{ id: 'mailbox', x: 142, y: 290, w: 12, h: 24 }], { sx: 4, sy: 2, dpr: 2, width: 160, height: 320 })[0];
  assert.ok(low.y + low.h <= 320 && low.y > 200, 'its own place, low on the tall plate');
  device(t);
  const doc = frameDoc();
  const figure = doc.body.appendChild(doc.createElement('figure'));
  const look = openLook(figure, [{ id: 'look.tub' }]);
  assert.equal(look.el.parentNode, figure);
  assert.equal(look.el.querySelector('p').getAttribute('data-t'), 'look.tub');
  look.close();
});
