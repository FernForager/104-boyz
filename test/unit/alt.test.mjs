// Alt text by id (BUILD_PLAN S6 track C, 2.4; GAME_DESIGN 11.9, 18.3):
// gfx/alt.js composes every drawable place's description from its parts'
// lines, in order (the scene's or the base's, each skyline's, the
// sprite's, the hour's), each a whole sentence, so no place needs a line of
// its own; the frame's picture is one element with role img and that
// aria-label, its canvas hidden; and every control on a fork, an outcome,
// a Why sheet and a Look has a spoken name from a line id.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadArt } from '../../tools/pics.mjs';
import { compileArt } from '../../tools/build.mjs';
import { readText } from '../../tools/text.mjs';
import { PURE_MODULES } from '../../tools/lint.mjs';
import { altParts, altFor } from '../../web/js/gfx/alt.js';
import { compose, drawable, HOURS, TRAIL_SPRITES } from '../../web/js/gfx/compose.js';
import { renderFrame } from '../../web/js/ui/frame.js';
import { closeWhy } from '../../web/js/ui/sheet.js';
import { CONTENT, atFork, outcomeOf, device, frameDoc, ctxFor, choiceBy } from './forkfix.mjs';

const ART = loadArt();
const SHIPPED = compileArt({ screens: ['app', 'debug', 'guestbook', 'title', 'trail'] });
const COMPOSER = { compose, drawable };

test("a place's alt text is its parts' lines, in order: the scene's or the base's, each skyline's, the sprite's, the hour's (day adds none)", () => {
  assert.deepEqual(altParts('deer_lake', ART), ['alt.base.lake_basin', 'alt.skyline.deer_lake_ridge', 'alt.sprite.hiker']);
  assert.deepEqual(altParts('deer_lake', ART, { hour: 'night' }), ['alt.base.lake_basin', 'alt.skyline.deer_lake_ridge', 'alt.sprite.hiker', 'alt.hour.night']);
  assert.deepEqual(altParts('seven_lakes_basin', ART, { hour: 'blue' }), ['alt.scene.seven_lakes_basin_rim', 'alt.sprite.hiker', 'alt.hour.blue']);
  // A stand-in's base describes a place whose own isn't drawn yet: Heart Lake's scene lands in S23.
  assert.deepEqual(altParts('heart_lake', ART, { hour: 'dusk' }), ['alt.base.lake_basin', 'alt.sprite.hiker', 'alt.hour.dusk']);
  // The crest stands in on the meadow, with Olympus.
  assert.deepEqual(altParts('high_divide', ART), ['alt.base.meadow', 'alt.skyline.olympus_from_divide', 'alt.sprite.hiker']);
  // A sprite at an anchor the picture lacks isn't drawn, so isn't described; one twice is said once.
  assert.deepEqual(altParts('deer_lake', ART, { sprites: [['hiker', 'idle', 'nowhere']] }), ['alt.base.lake_basin', 'alt.skyline.deer_lake_ridge']);
  assert.deepEqual(altParts('deer_lake', ART, { sprites: [...TRAIL_SPRITES, ['hiker', 'sit', 'campsite']] }), ['alt.base.lake_basin', 'alt.skyline.deer_lake_ridge', 'alt.sprite.hiker']);
  assert.deepEqual(altFor('deer_lake', ART), [{ id: 'alt.base.lake_basin' }, { id: 'alt.skyline.deer_lake_ridge' }, { id: 'alt.sprite.hiker' }]);
  assert.deepEqual(altParts('nowhere', ART), [], 'a place the composer can\'t draw has none');
  assert.throws(() => altParts('deer_lake', ART, { hour: 'noon' }), /no hour "noon"/);
});

test('every drawable place is described at every hour with no line of its own: each part is a line, and each line a whole sentence, so the parts join without grammar', () => {
  const text = readText();
  const places = Object.keys(ART.recipes.places).filter((p) => drawable(p, ART));
  const used = new Set();
  for (const p of places) {
    for (const hour of HOURS) {
      for (const id of altParts(p, ART, { hour })) {
        used.add(id);
        assert.ok(!id.includes(p) || id.startsWith('alt.scene.') || id.startsWith('alt.skyline.'), `${p}: no per-place line (${id})`);
      }
    }
  }
  assert.equal(used.size, 9, `${places.length} places at four hours, from nine lines`);
  // Rewritten in S7 (track C): the hour lines the cabin says too moved to the home screen, so main reaches them
  // when the cabin is promoted (B002); every other line is the trail's, as before.
  const shared = ['alt.hour.dusk', 'alt.hour.blue', 'alt.hour.night'];
  for (const id of shared) assert.ok(used.has(id), `${id}: the trail says it`);
  for (const id of used) {
    const words = text.lines.get(id).text;
    assert.match(words, /^[A-Z].*\.$/, `${id} is a sentence: "${words}"`);
    assert.equal(text.lines.get(id).screen, shared.includes(id) ? 'home' : 'trail', id);
  }
});

test('gfx/alt.js is pure (E01 holds it, with the picture VM and the composer), and it imports only the composer', () => {
  assert.ok(PURE_MODULES.includes('web/js/gfx/alt.js'));
  const src = readFileSync(join(ROOT, 'web', 'js', 'gfx', 'alt.js'), 'utf8');
  assert.deepEqual([...src.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]), ['./compose.js']);
});

test('the picture for VoiceOver: one element with role img, its aria-label the parts\' words, its ids on it; the canvas hidden; the Look buttons a group named Look', (t) => {
  device(t);
  const doc = frameDoc();
  const r = atFork();
  const host = doc.createElement('div');
  doc.body.appendChild(host);
  const f = renderFrame(host, r.screen, () => {}, ctxFor(r.screen, doc, { art: SHIPPED, composer: COMPOSER, hour: 'night' }));
  const fig = host.querySelector('.frame-picture');
  assert.equal(fig.querySelector('canvas').getAttribute('aria-hidden'), 'true');
  const img = fig.querySelector('.frame-alt');
  assert.equal(img.getAttribute('role'), 'img');
  assert.equal(img.getAttribute('data-t-alt'), 'alt.scene.seven_lakes_basin_rim alt.sprite.hiker alt.hour.night');
  assert.equal(img.getAttribute('aria-label'), 'From the rim, the Seven Lakes Basin below: blue lakes in pale rock and heather, Bogachiel Peak above, a stone staircase dropping into it. A hiker in a rust jacket stands on the trail. Night, under the stars.');
  assert.equal(img.getAttribute('data-t-aria'), 'alt.scene.seven_lakes_basin_rim');
  assert.ok(img.classList.contains('vh'), 'spoken, never seen');
  const group = fig.querySelector('.looks');
  assert.equal(group.getAttribute('aria-label'), 'Look');
  assert.deepEqual(group.querySelectorAll('.look').map((b) => b.getAttribute('aria-label')), ['The basin', 'Bogachiel Peak', 'The stone staircase', 'Lunch Lake', 'The trail sign', 'You']);
  f.release();
});

/** Every button (and role=button, and the picture's img) under el, with whether its name comes from a line id. */
function named(el) {
  const out = [];
  for (const n of [el, ...el.descendants()]) {
    const control = n.tagName === 'BUTTON' || n.getAttribute('role') === 'button' || n.getAttribute('role') === 'img';
    if (!control) continue;
    const own = n.getAttribute('data-t-aria') || n.getAttribute('data-t');
    const inside = n.descendants().some((d) => d.getAttribute('data-t'));
    out.push({ el: n, ok: Boolean(own || inside), what: `${n.tagName.toLowerCase()}.${n.className || ''}` });
  }
  return out;
}

test("every stop's picture is one preview's composer can draw: no stop shows an empty frame with no alt text (12.13, 11.9)", () => {
  const dir = join(ROOT, 'content', 'stops');
  let n = 0;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const set = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    for (const st of set.stops) {
      if (!st.view) continue;
      n++;
      assert.ok(drawable(st.view.pic, SHIPPED), `${f}: stop "${st.id}" shows "${st.view.pic}", which can't be drawn yet: point it at a drawn place, logged as a stand-in`);
      assert.ok(altFor(st.view.pic, SHIPPED).length > 0, `${f}: stop "${st.id}": its picture has alt text`);
    }
  }
  assert.ok(n >= 12, 'the sample set and its fork');
});

test('VoiceOver: every control on a rendered fork, its confirm, its Why sheet, a Look and an outcome has a spoken name from a line id (data-t on it or in it, or data-t-aria)', (t) => {
  device(t);
  const doc = frameDoc();
  const host = doc.createElement('div');
  doc.body.appendChild(host);
  const r = atFork();
  const ctx = ctxFor(r.screen, doc, { art: SHIPPED, composer: COMPOSER });
  const f = renderFrame(host, r.screen, () => {}, ctx);
  const check = (root, where) => {
    const list = named(root);
    assert.ok(list.length > 0, where);
    for (const c of list) assert.ok(c.ok, `${where}: ${c.what} has no spoken name from a line`);
    return list.length;
  };
  let n = check(host, 'the fork');
  // The diamond's name: its label, Critical, its made it, its fail share and its fatal share.
  const high = choiceBy(host, 'trail.deer_lake_rim.fork.high');
  assert.deepEqual(high.descendants().filter((d) => d.getAttribute('data-t')).map((d) => d.getAttribute('data-t')), ['trail.deer_lake_rim.fork.high', 'trail.odds.diamond', 'fmt.pct', 'trail.odds.fail', 'trail.odds.fatal']);
  // The confirm.
  high.click();
  n += check(host.querySelector('.choice-confirm'), 'the confirm');
  // The Why sheet (from the (i)), a dialog named by its title, its Close.
  host.querySelector('.choice-info').click();
  const sheet = doc.body.querySelector('.why');
  n += check(sheet, 'the Why sheet');
  assert.equal(sheet.getAttribute('role'), 'dialog');
  closeWhy(doc);
  // A Look box (UI words only: no controls of its own but the ▾, hidden unless it continues).
  f.looks.buttons[0].click();
  n += check(host.querySelector('.look-box'), 'a Look');
  f.release();
  // An outcome: the ornament (an img named by its severity), the pencil rows a list, Walk on.
  const o = outcomeOf('high');
  const host2 = doc.createElement('div');
  doc.body.appendChild(host2);
  const f2 = renderFrame(host2, o.screen, () => {}, ctxFor(o.screen, doc, { art: SHIPPED, composer: COMPOSER }));
  n += check(host2, 'an outcome');
  assert.equal(host2.querySelector('.ornament').getAttribute('role'), 'img');
  assert.equal(host2.querySelector('.pencil').tagName, 'UL');
  f2.release();
  assert.ok(n >= 20, `${n} controls named`);
});
