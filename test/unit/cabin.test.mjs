// The cabin at Lake Quinault, composed (BUILD_PLAN S7; GAME_DESIGN 2.2,
// 11.11; the S7 spec's D1 and D3): web/js/gfx/cabin.js turns the
// hand-drawn plate, its stamps and content/home/cabin.json into one op list.
// Pure and stable (the golden pins every hour x sky x state, and the clear
// night at each phase of the moon); stars only at blue hour and night under
// a clear sky, never touching, never on or beside the Dipper; the moon only
// when it's up under a clear sky, at at_moon; the lights only at dusk, blue
// hour and night, at their anchors; no gold anywhere; every stamp it names
// exists and every anchor it needs is on the plate; and its alt parts come
// in their order.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { composeCabin, cabinAlt, cabinLights, cabinStarPoints, cabinPalette, plateAnchors, quietBoxes, inBoxes, CABIN_HOURS, SKIES, STATES, STAR, WIDTH, HEIGHT, MOON_CLEAR, DIPPER_CLEAR, MOON_PHASES } from '../../web/js/gfx/cabin.js';
import { renderPic, composite, hashBytes, TRANSPARENT } from '../../web/js/gfx/picvm.js';
import { buildTimeline, frameAt } from '../../web/js/gfx/drawin.js';
import { CYCLES, REMAPS, PALETTE, makePalette, resolve } from '../../web/js/gfx/palette.js';
import { loadArt, loadCabin } from '../../tools/pics.mjs';
import { cabinScenes, cabinHashes, cabinGoldenBody, CABIN_GOLDEN_PATH, CABIN_MOON } from '../../tools/render-pics.mjs';
import { cabinStamps, compileArt, withoutNotes } from '../../tools/build.mjs';
import { lintPictures, lintPalette } from '../../tools/lint.mjs';

const ART = loadArt();
const art = { pics: ART.pics, stamps: ART.stamps };
const cabin = loadCabin();
const render = (c, record = false) => renderPic(c.ops, { width: c.width, height: c.height, stamps: art.stamps, record });
/** Every hour, the morning's blue hour too, as [hour, evening]. */
const HOURS = [['night', true], ['blue', true], ['blue', false], ['dawn', false], ['day', true], ['dusk', true]];

/** The pixels a list of ops writes on a layer, by color. */
function layerPixels(c, layer, colors) {
  const r = render(c);
  const L = r.layers[['sky', 'far', 'mid', 'near'].indexOf(layer)];
  const out = [];
  for (let p = 0; p < L.length; p++) if (colors.includes(L[p])) out.push([p % WIDTH, Math.floor(p / WIDTH)]);
  return out;
}

test('the cabin composes pure and stable, and the golden pins every hour x sky x state and the clear night at each phase of the moon', () => {
  const scenes = cabinScenes();
  // Re-pinned in the S7 review: four states, the guest book alone (after a death) added to none, first launch and the flag.
  assert.equal(scenes.length, 6 * 5 * 4 + 6, 'six hours (two blue hours) x five skies (fog over the dry two) x four states, and six more moons');
  const keys = new Set();
  for (const sc of scenes) {
    const a = composeCabin({ art, cabin, ...sc });
    const b = composeCabin({ art: JSON.parse(JSON.stringify(art)), cabin: JSON.parse(JSON.stringify(cabin)), ...sc });
    assert.deepEqual(a, b, `${a.key}: twice, and from the bundle as the phone gets it`);
    assert.deepEqual([a.width, a.height], [WIDTH, HEIGHT]);
    assert.ok(!keys.has(a.key), `${a.key} is one scene`);
    keys.add(a.key);
  }
  const golden = JSON.parse(readFileSync(CABIN_GOLDEN_PATH, 'utf8'));
  assert.deepEqual(golden.scenes, cabinHashes(ART, cabin), 'test/golden/home/cabin.json (rewrite on purpose: node tools/render-pics.mjs --update)');
  assert.equal(readFileSync(CABIN_GOLDEN_PATH, 'utf8'), cabinGoldenBody(golden.scenes));
  assert.deepEqual(Object.keys(golden.scenes).sort(), [...keys].sort());
  // The key names the scene.
  assert.equal(composeCabin({ art, cabin, hour: 'night', moon: 3 }).key, 'cabin@night.clear.moon3');
  assert.equal(composeCabin({ art, cabin, hour: 'blue', evening: false, sky: 'cloudy', fog: true, state: ['flag_up', 'first'] }).key, 'cabin@blue.am.cloudy.fog.first.flag_up');
  assert.equal(composeCabin({ art, cabin, hour: 'day', sky: 'rain', moon: 4 }).key, 'cabin@day.rain', 'no moon by day');
  assert.throws(() => composeCabin({ art, cabin, hour: 'noon' }), /no hour "noon"/);
  assert.throws(() => composeCabin({ art, cabin, sky: 'snow' }), /no sky "snow"/);
  assert.throws(() => composeCabin({ art, cabin, moon: 8 }), /no moon phase "8"/);
  assert.throws(() => composeCabin({ art, cabin, state: 'crew' }), /no state "crew"/);
  assert.throws(() => composeCabin({ art: { pics: {}, stamps: {} }, cabin }), /no plate "cabin_quinault"/);
});

test('the plate is a tall plate of kind home, draws no sky of its own and leaves no pixel undrawn at any scene', () => {
  const plate = ART.pics[cabin.plate];
  assert.deepEqual([plate.kind, plate.width, plate.height], ['home', 160, 320]);
  assert.ok(!plate.ops.some((op) => op[0] === '@' && op[1] === 'sky'), 'the sky is a stamp the composer places');
  for (const sc of cabinScenes()) {
    const c = composeCabin({ art, cabin, ...sc });
    const r = render(c);
    assert.deepEqual(r.diag.unknownStamps, [], c.key);
    assert.deepEqual(r.diag.tooDeep, [], c.key);
    assert.ok(composite(r).every((v) => v !== TRANSPARENT), `${c.key}: every pixel drawn`);
  }
});

test('the anchors: every one the data and the spec name is on the plate, inside it, and none is a hotspot', () => {
  const at = plateAnchors(ART.pics[cabin.plate].ops);
  const named = new Set(['moon', 'star_floor', 'pipe', 'win_left', 'win_right', 'win_gable', 'stove', 'door', 'lantern_l', 'lantern_r', 'shed_light', 'spill_l', 'spill_r', 'bowl', 'lockbox', 'guestbook', 'mailbox_flag', 'chain_l', 'chain_r', 'lily_sketch', 'apex']);
  for (const list of [cabin.lights, cabin.embers, cabin.smoke, ...Object.values(cabin.states), ...Object.values(cabin.weather)]) for (const o of list) if (o.at) named.add(o.at);
  named.add(cabin.moon.at);
  named.add(cabin.stars.floor);
  for (const n of named) {
    assert.ok(at[n], `at_${n} is on the plate`);
    assert.ok(at[n][0] >= 0 && at[n][0] < WIDTH && at[n][1] >= 0 && at[n][1] < HEIGHT, `at_${n} is inside it`);
  }
  // The banks mirror, so one lit bank flipped lights both; so do the deck's spill and the lanterns.
  assert.equal(at.win_left[0] + at.win_right[0], WIDTH);
  assert.equal(at.spill_l[0] + at.spill_r[0], WIDTH);
  assert.equal(at.lantern_l[0] + at.lantern_r[0], WIDTH);
  const c = composeCabin({ art, cabin, hour: 'night' });
  assert.ok(!c.hotspots.some((h) => h.id.startsWith('at_')), 'anchors are dropped from the hotspots');
  assert.ok(!c.ops.some((op) => op[0] === 'Z' && String(op[1]).startsWith('at_')), 'and from the ops');
  assert.deepEqual(c.anchors, at);
});

test("the places' Z ops are cabin.json's art boxes, each inside its hit area", () => {
  const c = composeCabin({ art, cabin });
  const drawn = Object.fromEntries(c.hotspots.map((h) => [h.id, [h.x, h.y, h.w, h.h]]));
  for (const [id, p] of Object.entries(cabin.places)) {
    assert.deepEqual(drawn[id], p.art, `${id}: the plate's Z op is cabin.json's art box`);
    const [ax, ay, aw, ah] = p.art;
    const [hx, hy, hw, hh] = p.hit;
    assert.ok(hx <= ax && hy <= ay && hx + hw >= ax + aw && hy + hh >= ay + ah, `${id}: its hit area holds its art`);
    assert.ok(hx >= 0 && hy >= 0 && hx + hw <= WIDTH && hy + hh <= HEIGHT, `${id}: its hit area is on the plate`);
  }
  assert.deepEqual(Object.keys(drawn).sort(), Object.keys(cabin.places).sort(), 'every place drawn, and no other hotspot');
});

test('stars only at blue hour and at night under a clear sky with no fog, one pixel each, never touching, never on or beside a Dipper star, above the floor, and fewer toward the horizon', () => {
  const floor = plateAnchors(ART.pics[cabin.plate].ops)[cabin.stars.floor][1];
  for (const [hour, evening] of HOURS) {
    for (const sky of SKIES) {
      for (const fog of [false, true]) {
        const c = composeCabin({ art, cabin, hour, evening, sky, fog });
        const stars = c.ops.filter((op) => op[0] === 'L' && op[1].length === 2);
        const starPen = c.ops.some((op) => op[0] === 'C' && op[1] === STAR);
        const shown = (hour === 'blue' || hour === 'night') && sky === 'clear' && !fog;
        assert.equal(starPen, shown, `${c.key}: stars ${shown ? 'out' : 'hidden'}`);
        if (!shown) assert.equal(c.stars, 0);
      }
    }
  }
  for (const hour of ['blue', 'night']) {
    const pts = cabinStarPoints(hour, cabin.stars, floor, plateAnchors(ART.pics[cabin.plate].ops)[cabin.moon.at], quietBoxes(cabin));
    // The count is the whole sky's (S7b: the name's quiet band takes its share, the art critic's pass).
    const whole = cabinStarPoints(hour, cabin.stars, floor, plateAnchors(ART.pics[cabin.plate].ops)[cabin.moon.at]);
    const [lo, hi] = cabin.stars.count[hour];
    assert.ok(whole.length >= lo && whole.length <= hi, `${hour}: ${whole.length} stars in the whole sky`);
    assert.ok(pts.length >= (hour === 'night' ? 20 : 3) && pts.length < whole.length, `${hour}: ${pts.length} under the band`);
    const all = [...pts, ...cabin.stars.dipper];
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) assert.ok(Math.abs(all[i][0] - all[j][0]) > 1 || Math.abs(all[i][1] - all[j][1]) > 1, `${hour}: stars ${all[i]} and ${all[j]} touch`);
    }
    for (const [x, y] of pts) assert.ok(x >= 0 && x < WIDTH && y >= 0 && y < floor, `${hour}: ${x},${y} above the floor`);
    if (hour === 'night') {
      // Fewer toward the horizon, in the sky stars may use (S7b: under the
      // name's quiet band, which spans the plate): more in its upper half
      // than in its lower (rewritten from the whole sky's halves).
      const [qx, qy, qw, qh] = cabin.quiet.name;
      assert.deepEqual([qx, qw], [0, WIDTH], 'the quiet band spans the plate, so the stars\' sky starts under it');
      const mid = (qy + qh + floor) / 2;
      const high = pts.filter(([, y]) => y < mid).length;
      assert.ok(pts.every(([, y]) => y >= qy + qh), 'every star under the quiet band');
      assert.ok(high >= 2 * (pts.length - high), `at least twice as many stars high (${high}) as low (${pts.length - high})`);
    }
    assert.deepEqual(pts, cabinStarPoints(hour, cabin.stars, floor, plateAnchors(ART.pics[cabin.plate].ops)[cabin.moon.at], quietBoxes(cabin)), 'the same sky every visit');
  }
  // The Dipper reads alone: no twinkling star inside its box, DIPPER_CLEAR pixels out.
  const xs = cabin.stars.dipper.map((p) => p[0]);
  const ys = cabin.stars.dipper.map((p) => p[1]);
  assert.equal(DIPPER_CLEAR, 2);
  for (const hour of ['blue', 'night']) {
    const pts = cabinStarPoints(hour, cabin.stars, floor, plateAnchors(ART.pics[cabin.plate].ops)[cabin.moon.at], quietBoxes(cabin));
    const inside = pts.filter(([x, y]) => x >= Math.min(...xs) - 2 && x <= Math.max(...xs) + 2 && y >= Math.min(...ys) - 2 && y <= Math.max(...ys) + 2);
    assert.deepEqual(inside, [], `${hour}: no star in the Dipper's box`);
  }
  // The Dipper is always the same seven, right of the spruce's tip.
  const night = composeCabin({ art, cabin, hour: 'night' });
  const sky = layerPixels(night, 'sky', [STAR]);
  for (const [x, y] of cabin.stars.dipper) assert.ok(sky.some(([a, b]) => a === x && b === y), `the Dipper's star at ${x},${y}`);
  assert.equal(night.stars + 7, sky.length, 'the stars and the Dipper, each one pixel');
});

test("the name's quiet sky (S7b, Lead call 69): no twinkling star, no Dipper star, no moon and no rain in cabin.json's quiet.name, at every hour, sky, state and phase of the moon; a star that would fall there is left out, so the sky under it keeps S7's density", () => {
  const q = cabin.quiet.name;
  assert.deepEqual(q, [0, 0, WIDTH, 29], "the band the name sits in, rows 0 to 28 across the plate (P17 holds the name's line inside it at every phone)");
  assert.deepEqual(quietBoxes(cabin), [q]);
  assert.deepEqual(quietBoxes({}), [], 'no quiet box, no rule');
  const inQ = ([x, y]) => inBoxes([q], x, y);
  assert.ok(inBoxes([[2, 3, 4, 5]], 2, 3) && inBoxes([[2, 3, 4, 5]], 5, 7) && !inBoxes([[2, 3, 4, 5]], 6, 3) && !inBoxes([[2, 3, 4, 5]], 2, 8), 'a box holds [x, x + w) by [y, y + h)');
  assert.deepEqual(cabin.stars.dipper.filter(inQ), [], 'the Dipper sits under it');
  const at = plateAnchors(ART.pics[cabin.plate].ops);
  const floor = at[cabin.stars.floor][1];
  for (const hour of ['blue', 'night']) {
    const moonAt = at[cabin.moon.at];
    const quiet = cabinStarPoints(hour, cabin.stars, floor, moonAt, quietBoxes(cabin));
    const s7 = cabinStarPoints(hour, cabin.stars, floor, moonAt);
    assert.ok(s7.filter(inQ).length > 0, `${hour}: without the box, S7's sky put stars in the name's band (the full stop after Hiker)`);
    assert.deepEqual(quiet.filter(inQ), [], `${hour}: no star in the name's quiet sky`);
    // Left out, not drawn again (the art critic's S7b pass: redrawn under the band, they doubled its density):
    // the sky under the band is S7's, star for star, ten rows at a time.
    assert.deepEqual(quiet, s7.filter((p) => !inQ(p)), `${hour}: S7's sky under the band, exactly`);
    assert.ok(quiet.length < s7.length);
    const per10 = (pts) => pts.reduce((m, [, y]) => ({ ...m, [Math.floor(y / 10)]: (m[Math.floor(y / 10)] || 0) + 1 }), {});
    for (const [row, k] of Object.entries(per10(quiet))) assert.equal(k, per10(s7)[row], `${hour}: rows ${row}0 to ${row}9 keep S7's ${per10(s7)[row]}`);
  }
  // As composed and drawn: in the box, every pixel is the sky's own (no
  // star, Dipper star or moon), at blue hour (both) and night, at every
  // phase, every state; and no rain falls in it, at any hour.
  const skyOnly = (sky) => composite(renderPic([['@', 'sky'], ['T', cabin.skies[sky], 0, 0, 0]], { width: WIDTH, height: HEIGHT, stamps: art.stamps }));
  const clearSky = skyOnly('clear');
  for (const [hour, evening] of [['blue', true], ['blue', false], ['night', true]]) {
    for (let moon = 0; moon <= MOON_PHASES; moon++) {
      for (const state of [[], ['first'], ['flag_up']]) {
        const c = composeCabin({ art, cabin, hour, evening, moon, state });
        assert.ok(c.ops.some((op) => op[0] === 'C' && op[1] === STAR), `${c.key}: a starry sky`);
        // The stars, the Dipper and the moon are the sky layer's: there, the box is the sky stamp's alone.
        const skyL = render(c).layers[0];
        for (let y = q[1]; y < q[1] + q[3]; y++) for (let x = q[0]; x < q[0] + q[2]; x++) assert.equal(skyL[y * WIDTH + x], clearSky[y * WIDTH + x], `${c.key}: ${x},${y} in the name's quiet sky is the sky's own`);
      }
    }
  }
  const rainOnly = renderPic([['@', 'near'], ['T', 'cabin_rain', 0, 0, 0]], { width: WIDTH, height: HEIGHT, stamps: art.stamps }).layers[3];
  let streaks = 0;
  for (let p = 0; p < rainOnly.length; p++) {
    if (rainOnly[p] === TRANSPARENT) continue;
    streaks++;
    assert.ok(!inQ([p % WIDTH, Math.floor(p / WIDTH)]), `a rain streak at ${p % WIDTH},${Math.floor(p / WIDTH)} in the name's quiet sky`);
  }
  assert.ok(streaks > 1000, `${streaks} rain pixels still fall on the rest of the plate`);
  for (const [hour, evening] of HOURS) {
    const c = composeCabin({ art, cabin, hour, evening, sky: 'rain' });
    const comp = composite(render(c));
    const dry = composite(render({ ...c, ops: c.ops.filter((op) => !(op[0] === 'T' && op[1] === 'cabin_rain')) }));
    for (let y = q[1]; y < q[1] + q[3]; y++) for (let x = q[0]; x < q[0] + q[2]; x++) assert.equal(comp[y * WIDTH + x], dry[y * WIDTH + x], `${c.key}: rain at ${x},${y} in the name's quiet sky`);
  }
});

test("the moon: drawn at its phase's stamp only when it's up under a clear sky at blue hour or night, at at_moon, no star on its disc", () => {
  const at = plateAnchors(ART.pics[cabin.plate].ops)[cabin.moon.at];
  for (let n = 0; n <= 7; n++) {
    for (const [hour, evening] of HOURS) {
      for (const [sky, fog] of [['clear', false], ['clear', true], ['cloudy', false], ['rain', false]]) {
        const c = composeCabin({ art, cabin, hour, evening, sky, fog, moon: n });
        const drawn = n > 0 && (hour === 'blue' || hour === 'night') && sky === 'clear' && !fog;
        const t = c.ops.filter((op) => op[0] === 'T' && String(op[1]).startsWith(cabin.moon.stamp));
        assert.deepEqual(t, drawn ? [['T', `${cabin.moon.stamp}${n}`, at[0], at[1], 0]] : [], `${c.key}: moon ${n}`);
        assert.equal(c.moon, drawn ? n : 0);
      }
    }
  }
  // The disc: 6 columns by 10 rows about at_moon (columns -3 to 2, rows -5
  // to 4), plain lamp light with no mark inside it (at phone size a mark
  // reads as a face), no star on it.
  const inDisc = ([x, y]) => x - at[0] >= -3 && x - at[0] <= 2 && y - at[1] >= -5 && y - at[1] <= 4;
  for (let n = 1; n <= 7; n++) {
    const c = composeCabin({ art, cabin, hour: 'night', moon: n });
    const lit = layerPixels(c, 'sky', [24]);
    assert.ok(lit.length > 0 && lit.every(inDisc), `moon ${n}: its lamp light on the disc (6 columns by 10 rows)`);
    assert.deepEqual(new Set(art.stamps[`cabin_moon_${n}`].filter((op) => op[0] === 'C').map((op) => op[1])), new Set([24]), `moon ${n}: lamp light alone, no sea`);
    // One piece: every lit pixel touches another (8 ways), and they are all connected.
    const key = new Set(lit.map(([x, y]) => `${x},${y}`));
    const seen = new Set();
    const stack = [`${lit[0][0]},${lit[0][1]}`];
    while (stack.length) {
      const k = stack.pop();
      if (seen.has(k) || !key.has(k)) continue;
      seen.add(k);
      const [x, y] = k.split(',').map(Number);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) stack.push(`${x + dx},${y + dy}`);
    }
    assert.equal(seen.size, key.size, `moon ${n}: one continuous shape, no detached horn`);
    const stars = layerPixels(c, 'sky', [STAR]);
    assert.ok(stars.every(([x, y]) => Math.abs(x - at[0]) > MOON_CLEAR || Math.abs(y - at[1]) > MOON_CLEAR), `moon ${n}: no star on its disc`);
  }
  // Waxing lights the right, waning the left; full is round.
  const lit = (n) => layerPixels(composeCabin({ art, cabin, hour: 'night', moon: n }), 'sky', [24]);
  const disc = (n) => lit(n).map(([x]) => x - at[0] + 0.5);
  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  assert.ok(mean(disc(1)) > 1 && mean(disc(2)) > 0, 'a waxing moon is lit on the right');
  assert.ok(mean(disc(7)) < -1 && mean(disc(6)) < 0, 'a waning moon is lit on the left');
  assert.ok(Math.abs(mean(disc(4))) < 0.25 && disc(4).length > disc(3).length && disc(3).length > disc(2).length && disc(2).length > disc(1).length);
  // The crescents: an arc two pixels thick at its middle rows, one at its horns, hugging the limb.
  for (const n of [1, 7]) {
    const rows = {};
    for (const [x, y] of lit(n)) (rows[y - at[1]] ||= []).push(x);
    assert.deepEqual([-2, -1, 0, 1].map((r) => rows[r].length), [2, 2, 2, 2], `moon ${n}: two thick through its middle`);
    assert.deepEqual([-5, -4, -3, 2, 3, 4].map((r) => rows[r].length), [1, 1, 1, 1, 1, 1], `moon ${n}: one-pixel horns`);
  }
  // Drawn for the phone's wide pixels: the full moon's disc is 6 columns by
  // 10 rows, its corners rounded, so at 7:4 it is round (42 by 40 points).
  const full = lit(4);
  const cols = new Set(full.map(([x]) => x)).size;
  const rows = new Set(full.map(([, y]) => y)).size;
  assert.deepEqual([cols, rows], [6, 10]);
  assert.ok(Math.abs((cols * 7) / (rows * 4) - 1) < 0.1, 'round at 7:4');
  assert.ok(!full.some(([x, y]) => (x - at[0] === -3 || x - at[0] === 2) && (y - at[1] <= -4 || y - at[1] >= 3)), 'its corners rounded');
  // The gibbous moons keep a curved dark limb, the sky's: the far column on the dark side unlit through the middle rows.
  assert.ok(!lit(3).some(([x, y]) => x === at[0] - 3 && Math.abs(y - at[1] + 0.5) < 3), 'the waxing gibbous: dark on its left limb');
  assert.ok(!lit(5).some(([x, y]) => x === at[0] + 2 && Math.abs(y - at[1] + 0.5) < 3), 'the waning gibbous: dark on its right limb');
});

test('the lights: at dusk, blue hour and night (the morning blue hour too), never at dawn or by day; embers at the evening blue hour and at night; smoke with the lights, and all day under rain or fog', () => {
  const lights = (c) => c.ops.filter((op) => op[0] === 'T' && cabin.lights.some((l) => l.stamp === op[1])).length;
  const has = (c, list) => c.ops.some((op) => op[0] === 'T' && list.some((l) => l.stamp === op[1]));
  for (const [hour, evening] of HOURS) {
    for (const [sky, fog] of [['clear', false], ['cloudy', false], ['rain', false], ['clear', true]]) {
      const c = composeCabin({ art, cabin, hour, evening, sky, fog });
      const lit = hour === 'dusk' || hour === 'blue' || hour === 'night';
      assert.equal(lights(c), lit ? cabin.lights.length : 0, `${c.key}: lights`);
      assert.equal(c.lit, lit);
      assert.equal(has(c, cabin.embers), hour === 'night' || (hour === 'blue' && evening), `${c.key}: embers`);
      assert.equal(has(c, cabin.smoke), lit || sky === 'rain' || fog, `${c.key}: smoke`);
      assert.deepEqual(cabinLights({ hour, evening, sky, fog }), { lit, embers: c.embers, smoke: c.smoke, stars: (hour === 'blue' || hour === 'night') && sky === 'clear' && !fog });
    }
  }
  // Each light at its anchor, on the near layer, after the plate's near ops.
  const c = composeCabin({ art, cabin, hour: 'night' });
  const at = c.anchors;
  const near = c.ops.findIndex((op) => op[0] === '@' && op[1] === 'near');
  for (const l of [...cabin.lights, ...cabin.embers, ...cabin.smoke]) {
    const i = c.ops.findIndex((op) => op[0] === 'T' && op[1] === l.stamp && op[2] === at[l.at][0] && op[3] === at[l.at][1] && op[4] === (l.fx ? 1 : 0));
    assert.ok(i > near, `${l.stamp} at at_${l.at}`);
  }
  // At night the arched window and both banks glow, and the stove flickers.
  const r = render(c);
  const flat = composite(r);
  const g = at.win_gable;
  assert.equal(flat[(g[1] + 4) * WIDTH + g[0] - 3], 24, 'the fanlight is lamp light');
  assert.equal(flat[(at.win_left[1] + 8) * WIDTH + at.win_left[0] + 4], 24, 'the left bank');
  assert.equal(flat[(at.win_right[1] + 8) * WIDTH + at.win_right[0] - 4], 24, 'the right bank');
  assert.ok(flat.some((v) => v === 20), 'fire: the stove and the embers');
  assert.ok(flat.some((v) => v === 28), 'warm spill');
  assert.ok(flat.some((v) => v === 29), 'smoke');
  // By day no light is on.
  const day = composite(render(composeCabin({ art, cabin, hour: 'day' })));
  assert.ok(!day.some((v) => v === 24 || v === 20 || v === 28 || v === 29 || v === STAR));
});

test('the weather: each sky its stamp on the sky layer; the cloud cap under cloud, the rain cap under rain; the rain, puddles and chains only in rain; the fog on the far and mid layers', () => {
  const tOn = (c, layer) => {
    const out = [];
    let at = 'sky';
    for (const op of c.ops) {
      if (op[0] === '@') at = op[1];
      else if (op[0] === 'T' && at === layer) out.push(op[1]);
    }
    return out;
  };
  for (const sky of SKIES) {
    for (const fog of [false, true]) {
      const c = composeCabin({ art, cabin, hour: 'day', sky, fog });
      assert.equal(tOn(c, 'sky')[0], cabin.skies[sky]);
      assert.equal(tOn(c, 'far').includes('cabin_cloud_cap'), sky === 'cloudy');
      assert.equal(tOn(c, 'far').includes('cabin_rain_cap'), sky === 'rain', 'the rain sits on the peak in its own darker deck');
      assert.equal(tOn(c, 'far').includes('cabin_fog_far'), fog);
      assert.equal(tOn(c, 'mid').includes('cabin_fog_low'), fog);
      for (const s of ['cabin_rain', 'cabin_puddles', 'cabin_rain_chains']) assert.equal(tOn(c, 'near').includes(s), sky === 'rain', `${c.key}: ${s}`);
      assert.equal(tOn(c, 'near').filter((s) => s === 'cabin_rain_chains').length, sky === 'rain' ? 2 : 0, 'both chains');
    }
  }
  // The rain is a curtain, not a wall: under 6% of the plate.
  const rain = layerPixels(composeCabin({ art, cabin, hour: 'day', sky: 'rain' }), 'near', [3]).length - layerPixels(composeCabin({ art, cabin, hour: 'day' }), 'near', [3]).length;
  assert.ok(rain > 0 && rain < 0.06 * WIDTH * HEIGHT, `${rain} rain pixels`);
  // The weather's last on the near layer, over the lights: at night the rain crosses the lit windows.
  const c = composeCabin({ art, cabin, hour: 'night', sky: 'rain' });
  const flat = composite(render(c));
  const [wx, wy] = c.anchors.win_left;
  let crossed = 0;
  for (let y = wy; y < wy + 30; y++) for (let x = wx; x < wx + 29; x++) if (flat[y * WIDTH + x] === 3) crossed++;
  assert.ok(crossed > 0, 'rain streaks cross the lit windows');
});

test('the states: first launch lights the lockbox and opens the guest book; after a death the guest book alone, never the lit lockbox; an update raises the mailbox flag; each at its anchor, last but the weather', () => {
  assert.deepEqual([...STATES], ['first', 'guestbook', 'flag_up']);
  assert.deepEqual(cabin.states.guestbook.map((o) => o.stamp), ['cabin_guestbook_open'], 'the guest book alone (S7 review: decision 45, lead call 53)');
  assert.ok(cabin.states.first.some((o) => o.stamp === 'cabin_lockbox_lit'));
  for (const state of [[], ['first'], ['guestbook'], ['flag_up'], ['first', 'flag_up'], ['guestbook', 'flag_up']]) {
    const c = composeCabin({ art, cabin, hour: 'day', sky: 'rain', state });
    const ts = c.ops.filter((op) => op[0] === 'T').map((op) => op[1]);
    const want = new Set(state.flatMap((s) => cabin.states[s].map((o) => o.stamp)));
    for (const s of STATES) for (const o of cabin.states[s]) assert.equal(ts.includes(o.stamp), want.has(o.stamp), `${c.key}: ${o.stamp}`);
    if (state.length) assert.ok(ts.lastIndexOf(cabin.states[state[state.length - 1]].at(-1).stamp) < ts.indexOf('cabin_rain'), 'the weather is over the states');
  }
  assert.equal(composeCabin({ art, cabin, state: 'first' }).key, 'cabin@day.clear.first');
});

test('no gold anywhere: no op, stamp or composed pixel uses 7 or the glow (19), at any scene', () => {
  const gold = (ops) => ops.some((op) => (op[0] === 'C' && (op[1] === 7 || op[1] === 19)) || (op[0] === 'D' && (op[1] === 7 || op[1] === 19 || op[2] === 7 || op[2] === 19)));
  for (const id of cabinStamps(cabin)) assert.ok(!gold(art.stamps[id]), id);
  for (const id of Object.keys(art.stamps).filter((s) => s.startsWith('cabin_') || /maple|spruce|adirondack|mole_hill|fire_bowl|tub_|register_post|mailbox_|car_dusty|clam_shovel/.test(s))) assert.ok(!gold(art.stamps[id]), id);
  for (const sc of cabinScenes()) {
    const c = composeCabin({ art, cabin, ...sc });
    assert.ok(!gold(c.ops), c.key);
    assert.ok(!composite(render(c)).some((v) => v === 7 || v === 19), c.key);
    for (const table of [...Object.values(REMAPS), ...Object.values(cabin.remaps).filter(Array.isArray)]) assert.ok(table.every((to, from) => to !== 7 || from === 7));
  }
  // Lint P12 holds the cabin's own tables too, and catches one that makes gold.
  const tables = Object.fromEntries(Object.entries(cabin.remaps).filter(([, m]) => Array.isArray(m)));
  assert.deepEqual(lintPalette('content/home/cabin.json', { remaps: tables }), []);
  const golden = [...cabin.remaps.cabin_night];
  golden[13] = 7;
  assert.deepEqual(lintPalette('content/home/cabin.json', { remaps: { cabin_night: golden } }).map((i) => i.code), ['P12']);
  assert.ok(!CYCLES[28].slots.includes(7) && !CYCLES[29].slots.includes(7) && !CYCLES[20].slots.includes(7), 'spill, smoke and fire never pass through gold');
});

test("every stamp the cabin's data names exists, and every cabin picture lints clean", () => {
  const ids = cabinStamps(cabin);
  assert.equal(ids.length, 30, 'three skies, seven weather stamps (a cap for the overcast and one for the rain), eight lights (each bank of windows its own room), the embers, the smoke, three states and seven moons');
  for (const id of ids) assert.ok(art.stamps[id], id);
  for (let n = 1; n <= 7; n++) assert.ok(ids.includes(`cabin_moon_${n}`));
  const issues = lintPictures(ART.sources).filter((i) => /home\/|stamps\/cabin\//.test(i.file));
  assert.deepEqual(issues, []);
});

test('the draw-in replays the composed cabin exactly, layer by layer', () => {
  for (const sc of [{ hour: 'night', moon: 3 }, { hour: 'day', sky: 'rain' }, { hour: 'dawn', evening: false, fog: true }]) {
    const c = composeCabin({ art, cabin, ...sc });
    const r = render(c, true);
    const tl = buildTimeline(r);
    assert.deepEqual(frameAt(tl, 1), composite(r), c.key);
  }
});

test("the hour resolves with the cabin's own table, dawn borrowing dusk's (11.4): the shared tables with the cabin's changes and no other, joined to the palette by cabinPalette", () => {
  for (const hour of CABIN_HOURS) assert.equal(composeCabin({ art, cabin, hour }).table, `cabin_${hour === 'dawn' ? 'dusk' : hour}`);
  assert.deepEqual(cabin.tables, { day: 'cabin_day', dawn: 'cabin_dusk', dusk: 'cabin_dusk', blue: 'cabin_blue', night: 'cabin_night' });
  // Each is its shared table with exactly these slots changed (cabin.json's remaps note says why):
  // the vapour (1, 6) everywhere; paper cream (5) at dusk, blue hour and night; bark (10) at dusk; the meadow (13, 14) at blue hour and night.
  const changes = {
    cabin_day: { base: 'day', slots: { 1: 3, 6: 4 } },
    cabin_dusk: { base: 'dusk', slots: { 1: 3, 5: 14, 6: 4, 10: 0 } },
    cabin_blue: { base: 'blue', slots: { 1: 2, 5: 15, 6: 3, 13: 12, 14: 12 } },
    cabin_night: { base: 'night', slots: { 1: 2, 5: 12, 6: 3, 13: 11, 14: 11 } },
  };
  assert.deepEqual(Object.keys(cabin.remaps).filter((k) => k !== '$comment').sort(), Object.keys(changes).sort());
  for (const [name, { base, slots }] of Object.entries(changes)) {
    const want = [...REMAPS[base]];
    for (const [from, to] of Object.entries(slots)) want[Number(from)] = to;
    assert.deepEqual(cabin.remaps[name], want, name);
  }
  // cabinPalette adds them under their names, never over a shared one, and a
  // cabin resolved without them fails loudly rather than in the wrong colors.
  const shared = makePalette();
  const pal = cabinPalette(shared, cabin);
  for (const name of Object.keys(changes)) assert.deepEqual(pal.remaps[name], cabin.remaps[name]);
  for (const name of Object.keys(REMAPS)) assert.equal(pal.remaps[name], shared.remaps[name]);
  assert.equal(shared.remaps.cabin_night, undefined, 'the shared palette is untouched');
  assert.throws(() => resolve(new Uint8Array([3]), 1, shared, { remap: 'cabin_night' }), /unknown remap "cabin_night"/);
  assert.throws(() => cabinPalette(shared, { ...cabin, remaps: { night: REMAPS.day } }), /would hide a shared one/);
});

test("cabinAlt: the scene, the sky (or the fog), the lights, the moon, the hour, in that order, each a whole sentence's id", () => {
  assert.deepEqual(cabinAlt({ hour: 'day' }), ['alt.scene.cabin']);
  assert.deepEqual(cabinAlt({ hour: 'dawn' }), ['alt.scene.cabin', 'alt.hour.dawn']);
  assert.deepEqual(cabinAlt({ hour: 'dusk' }), ['alt.scene.cabin', 'alt.cabin.lit', 'alt.hour.dusk']);
  assert.deepEqual(cabinAlt({ hour: 'night', moonShown: true }), ['alt.scene.cabin', 'alt.cabin.lit', 'alt.cabin.moon', 'alt.hour.night']);
  assert.deepEqual(cabinAlt({ hour: 'blue' }), ['alt.scene.cabin', 'alt.cabin.lit', 'alt.hour.blue']);
  assert.deepEqual(cabinAlt({ hour: 'night', sky: 'rain' }), ['alt.scene.cabin', 'alt.sky.rain', 'alt.cabin.lit', 'alt.hour.night_clouded']);
  assert.deepEqual(cabinAlt({ hour: 'blue', sky: 'cloudy', fog: true }), ['alt.scene.cabin', 'alt.sky.fog', 'alt.cabin.lit', 'alt.hour.blue_clouded']);
  assert.deepEqual(cabinAlt({ hour: 'day', sky: 'cloudy' }), ['alt.scene.cabin', 'alt.sky.cloudy']);
  assert.throws(() => cabinAlt({ hour: 'noon' }), /no hour/);
  // Every id it can give, over every scene, is one of the spec's (4.3).
  const ids = new Set();
  for (const hour of CABIN_HOURS) for (const sky of SKIES) for (const fog of [false, true]) for (const moonShown of [false, true]) for (const id of cabinAlt({ hour, sky, fog, moonShown })) ids.add(id);
  assert.deepEqual([...ids].sort(), ['alt.cabin.lit', 'alt.cabin.moon', 'alt.hour.blue', 'alt.hour.blue_clouded', 'alt.hour.dawn', 'alt.hour.dusk', 'alt.hour.night', 'alt.hour.night_clouded', 'alt.scene.cabin', 'alt.sky.cloudy', 'alt.sky.fog', 'alt.sky.rain']);
});

test("compileArt ships the cabin with the home's screens: its plate, the stamps it reaches, its data without the next table or the notes, and the spill and smoke cycles; never on a channel without them", () => {
  const home = compileArt({ screens: ['home'] });
  assert.deepEqual(Object.keys(home.pics), [cabin.plate]);
  for (const id of cabinStamps(cabin)) assert.ok(home.stamps[id], `${id} ships`);
  for (const id of ['sitka_spruce', 'bigleaf_maple_summer', 'maple_clump_l', 'adirondack_chair', 'cabin_shed']) assert.ok(home.stamps[id], `${id}, reached through the plate`);
  assert.equal(home.cabin.next, undefined, 'the next table is the rules\' (the home section)');
  // S7 track B: and the switches the cabin reads (BUILD_PLAN S7 4.2), from the scope file.
  const { switches, ...shown } = home.cabin;
  assert.deepEqual(shown, withoutNotes(Object.fromEntries(Object.entries(cabin).filter(([k]) => k !== 'next'))));
  assert.deepEqual(Object.keys(switches), ['cabin_seasons', 'chalkboard', 'clam_shovel', 'crew', 'easter_eggs', 'peak', 'real_moon', 'settings', 'wic_phone']);
  assert.ok(!JSON.stringify(home.cabin).includes('"$comment"') && !JSON.stringify(home.cabin).includes('"doc"') && !JSON.stringify(home.cabin).includes('"why"'));
  assert.deepEqual(Object.keys(home.palette.cycles), ['16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '28', '29']);
  for (const k of ['28', '29']) assert.deepEqual(home.palette.cycles[k].screens, ['home', 'lockbox', 'guestbook'], 'a cycle ships with the screens that show the cabin (KINDS.home)');
  for (const screens of [['app', 'debug', 'title'], ['app', 'debug', 'map', 'title', 'trail']]) {
    const art2 = compileArt({ screens });
    assert.equal(art2.cabin, undefined, `${screens}: no cabin`);
    assert.ok(!art2.pics[cabin.plate], `${screens}: no plate`);
    assert.ok(!Object.keys(art2.stamps).some((s) => s.startsWith('cabin_')), `${screens}: no cabin stamp`);
    assert.deepEqual(Object.keys(art2.palette.cycles), ['16', '17', '18', '19', '20', '21', '22', '23', '24', '25'], `${screens}: S6's cycles, so main's bundle doesn't change`);
  }
  // The lockbox's and the guest book's screens show the cabin on the porch, so they ship it too.
  assert.ok(compileArt({ screens: ['lockbox'] }).cabin && compileArt({ screens: ['guestbook', 'home'] }).cabin);
});

test('the renders show the spec\'s moon (a waxing gibbous) whenever it is up', () => {
  assert.equal(CABIN_MOON, 3);
  for (const sc of cabinScenes()) if (sc.hour === 'night' || sc.hour === 'blue') assert.ok(sc.moon >= 1);
});

// The art director's first round (S7 track A, revision 1): what read as
// faces, stripes or confetti is drawn out, and stays out.

test('the arched window: its fanlight glazed whole by day (no hole shows the hills through it) and lit whole at night, its three muntins ink from a hub', () => {
  const day = composeCabin({ art, cabin, hour: 'day' });
  const near = render(day).layers[3];
  const g = day.anchors.win_gable;
  // Inside the arch, above the transom bar: every pixel is the plate's own.
  for (let y = g[1] + 1; y < g[1] + 8; y++) {
    const row = [];
    for (let x = g[0] - 8; x <= g[0] + 8; x++) row.push(near[y * WIDTH + x]);
    const inside = row.slice(row.findIndex((v) => v === 10) + 1, row.lastIndexOf(10));
    assert.ok(inside.every((v) => v !== TRANSPARENT), `row ${y}: the fanlight has no hole`);
  }
  const glass = (flat) => {
    const out = [];
    for (let y = g[1] + 1; y < g[1] + 8; y++) for (let x = g[0] - 7; x <= g[0] + 7; x++) out.push(flat[y * WIDTH + x]);
    return out;
  };
  const dayGlass = glass(near);
  assert.ok(dayGlass.filter((v) => v === 3).length <= 2, 'one glint by day');
  const night = composite(render(composeCabin({ art, cabin, hour: 'night' })));
  const lit = glass(night);
  assert.ok(lit.every((v) => v !== 2 && v !== 3), 'no unlit glass left in the fanlight at night');
  assert.ok(lit.filter((v) => v === 24).length >= 40, 'the fanlight lamp-lit');
  for (const [x, y] of [[0, 3], [-3, 5], [3, 5]]) assert.equal(night[(g[1] + y) * WIDTH + g[0] + x], 0, `a muntin at ${x},${y} from the crown`);
});

test('the screen door: one flat dark screen with a single glint by day, flat lamp light at night, never a checker', () => {
  const at = composeCabin({ art, cabin }).anchors.door;
  const rows = [];
  for (let y = 182; y < 204; y++) if (y < 196 || y > 197) rows.push(y);
  const screen = (flat) => rows.flatMap((y) => Array.from({ length: 11 }, (_, i) => flat[y * WIDTH + at[0] + 2 + i]));
  const day = screen(composite(render(composeCabin({ art, cabin, hour: 'day' }))));
  assert.ok(day.filter((v) => v === 0).length >= day.length - 3, 'by day the screen is flat ink');
  assert.ok(day.filter((v) => v === 2).length >= 1 && day.filter((v) => v === 2).length <= 2, 'a single glint');
  const night = screen(composite(render(composeCabin({ art, cabin, hour: 'night' }))));
  assert.ok(night.filter((v) => v === 24).length >= night.length - 1, 'at night the screen is flat lamp light (the handle aside)');
});

/** The cabin's palette, its own tables joined (gfx/cabin.js cabinPalette). */
const PAL = cabinPalette(makePalette(), cabin);
/** A composed scene's slots, resolved with its table, at a frame. */
const slotsOf = (c, frame = 0) => resolve(composite(render(c)), WIDTH, PAL, { remap: c.table, frame });
/** The vapour: the slots the smoke and the fog draw in, never shown as themselves (cabin.json remaps). */
const VAPOUR = [1, 6];

test('the fog: solid bands of the vapour, its light over its shade (no lines, no red edge), snow over glacier blue by day and at dawn and never pink; the low band lies behind the maples and the shed', () => {
  for (const id of ['cabin_fog_far', 'cabin_fog_low']) {
    const colors = new Set(art.stamps[id].filter((op) => op[0] === 'C').map((op) => op[1]));
    assert.deepEqual([...colors].sort(), VAPOUR, `${id}: the vapour's light and shade only`);
  }
  // Snow over glacier blue by day and at dawn (the cabin's dusk table), so only the peak's lit face carries alpenglow.
  for (const hour of ['day', 'dawn']) {
    const table = PAL.remaps[cabin.tables[hour]];
    assert.deepEqual([table[6], table[1]], [4, 3], `${hour}: snow over glacier blue`);
  }
  const fogged = render(composeCabin({ art, cabin, hour: 'day', fog: true }));
  const clear = render(composeCabin({ art, cabin, hour: 'day' }));
  // Through its middle the far band is solid: every column of rows 90 to 98 is fog (where the far layer shows).
  const far = fogged.layers[1];
  for (let y = 90; y <= 98; y++) for (let x = 0; x < WIDTH; x++) assert.equal(far[y * WIDTH + x], 6, `${x},${y}: solid fog`);
  // At dawn no fog pixel is pink.
  const dawn = composeCabin({ art, cabin, hour: 'dawn', evening: false, fog: true });
  const dawnRaw = composite(render(dawn));
  const dawnSlots = slotsOf(dawn);
  for (let p = 0; p < dawnRaw.length; p++) if (VAPOUR.includes(dawnRaw[p])) assert.notEqual(dawnSlots[p], 6, `the fog at ${p % WIDTH},${Math.floor(p / WIDTH)} is pink at dawn`);
  // The low band is drawn at at_fog_low, after the forest wall and before the trees and the shed.
  const midOps = [];
  let layer = 'sky';
  for (const op of composeCabin({ art, cabin, hour: 'day', fog: true }).ops) {
    if (op[0] === '@') layer = op[1];
    else if (layer === 'mid' && op[0] === 'T') midOps.push(op[1]);
  }
  assert.ok(midOps.indexOf('cabin_fog_low') < midOps.indexOf('bigleaf_maple_summer') && midOps.indexOf('cabin_fog_low') < midOps.indexOf('cabin_shed'), midOps.join());
  // A mid stamp with no anchor of its own on the layer comes after the layer's ops.
  const loose = { ...cabin, weather: { ...cabin.weather, fog: [{ layer: 'mid', stamp: 'cabin_fog_low' }] } };
  const looseMid = [];
  layer = 'sky';
  for (const op of composeCabin({ art, cabin: loose, hour: 'day', fog: true }).ops) {
    if (op[0] === '@') layer = op[1];
    else if (layer === 'mid') looseMid.push(op);
  }
  assert.deepEqual(looseMid.at(-1), ['T', 'cabin_fog_low', 0, 0, 0]);
  // So the maples, the spruce and the shed stand crisp in front of it: every pixel of theirs unchanged.
  const onlyTrees = renderPic([['@', 'mid'], ...ART.pics[cabin.plate].ops.filter((op) => op[0] === 'T' && /^(bigleaf|sitka|cabin_shed)/.test(op[1]))], { width: WIDTH, height: HEIGHT, stamps: art.stamps }).layers[2];
  const midF = fogged.layers[2];
  const midC = clear.layers[2];
  let crisp = 0;
  for (let p = 0; p < onlyTrees.length; p++) {
    if (onlyTrees[p] === TRANSPARENT) continue;
    crisp++;
    assert.equal(midF[p], midC[p], `the trees and the shed at ${p % WIDTH},${Math.floor(p / WIDTH)} stay in front of the fog`);
  }
  assert.ok(crisp > 1000);
  // It shows through the gaps on both sides of the cabin (the art
  // director's third round: not a white block at the frame's edge): across
  // the forest wall under the left maple and round its trunk, and above the
  // shed behind the right maple's trunk, in the picture as composed.
  const shown = composite(fogged);
  const seen = (x0, x1, y0, y1) => {
    let n = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (VAPOUR.includes(shown[y * WIDTH + x]) && fogged.layers[3][y * WIDTH + x] === TRANSPARENT) n++;
    return n;
  };
  assert.ok(seen(0, 40, 140, 200) > 120, `${seen(0, 40, 140, 200)} fog pixels under the left maple`);
  assert.ok(seen(20, 40, 140, 200) > 30, 'and past its trunk, not only at the frame\'s edge');
  assert.ok(seen(120, 159, 140, 200) > 40, `${seen(120, 159, 140, 200)} fog pixels above the shed`);
  // Its foot hangs in rounded lobes, not a flat slab, and its ends are rounded inside the frame.
  const lowFoot = [];
  const lowTall = [];
  const low = renderPic([['@', 'mid'], ['T', 'cabin_fog_low', 0, 0, 0]], { width: WIDTH, height: HEIGHT, stamps: art.stamps }).layers[2];
  for (let x = 0; x < WIDTH; x++) {
    let foot = -1;
    let n = 0;
    for (let y = 0; y < HEIGHT; y++) if (low[y * WIDTH + x] !== TRANSPARENT) (foot = y), n++;
    lowFoot.push(foot);
    lowTall.push(n);
  }
  const feet = lowFoot.filter((y) => y >= 0);
  assert.ok(Math.max(...feet) - Math.min(...feet) >= 4, `its foot varies by ${Math.max(...feet) - Math.min(...feet)} rows`);
  const tallest = Math.max(...lowTall);
  assert.ok(lowTall[0] <= tallest * 0.6 && lowTall[WIDTH - 1] <= tallest * 0.6, `its ends taper (${lowTall[0]} and ${lowTall[WIDTH - 1]} rows at the edges, ${tallest} at most)`);
});

test('the vapour (night navy 1 and alpenglow pink 6) is drawn only by the smoke and the fog, so the cabin never shows those slots as themselves', () => {
  const draws = (ops) => ops.some((op) => (op[0] === 'C' && VAPOUR.includes(op[1])) || (op[0] === 'D' && (VAPOUR.includes(op[1]) || VAPOUR.includes(op[2]))));
  assert.ok(!draws(ART.pics[cabin.plate].ops), 'the plate');
  const vapour = ['cabin_smoke', 'cabin_fog_far', 'cabin_fog_low'];
  for (const id of Object.keys(art.stamps)) {
    if (!(id.startsWith('cabin_') || /maple|spruce|sitka|adirondack|mole_hill|fire_bowl|tub_|register_post|mailbox_|car_dusty|clam_shovel/.test(id))) continue;
    assert.equal(draws(art.stamps[id]), vapour.includes(id), id);
  }
  assert.deepEqual(CYCLES[29].slots.filter((v) => !VAPOUR.includes(v)), [], 'the smoke cycle runs through the vapour');
});

test('every sky is one flat color under the name (rows 0 to 28), with no ruled line at the top: glacier blue under a clear sky and the overcast, the rain deck\'s own slate under rain', () => {
  const band = (sky) => Array.from(render(composeCabin({ art, cabin, hour: 'day', sky })).layers[0].slice(0, 29 * WIDTH));
  for (const [sky, slot] of [['clear', 3], ['cloudy', 3], ['rain', 2]]) {
    const b = band(sky);
    assert.ok(b.every((v) => v === slot), `${sky}: rows 0 to 28 all ${slot}`);
  }
});

test('the smoke: a soft column of rounded puffs that rises straight from the pipe, then bends and drifts left; a step lighter than what it crosses at night, never on the foothills\' slate and never pink', () => {
  const px = new Map();
  let pen = 0;
  for (const op of art.stamps.cabin_smoke) {
    if (op[0] === 'C') pen = op[1];
    if (op[0] !== 'L') continue;
    // The stamp lays its puffs in rows: each L a point or one horizontal run.
    const [x0, y0, x1 = x0, y1 = y0] = op[1];
    assert.equal(y1, y0, 'a horizontal run');
    for (let x = x0; x <= x1; x++) px.set(`${x},${y0}`, pen);
  }
  assert.deepEqual([...new Set(px.values())].sort((a, b) => a - b), [6, 29], 'the vapour\'s light on the puffs\' rims, the smoke cycle in their cores');
  const pts = [...px.keys()].map((k) => k.split(',').map(Number));
  // One column with no gaps and no checker: every pixel 4-connected to the rest.
  const seen = new Set();
  const stack = [[...px.keys()][0]];
  while (stack.length) {
    const k = stack.pop();
    if (seen.has(k) || !px.has(k)) continue;
    seen.add(k);
    const [x, y] = k.split(',').map(Number);
    stack.push(`${x + 1},${y}`, `${x - 1},${y}`, `${x},${y + 1}`, `${x},${y - 1}`);
  }
  assert.equal(seen.size, px.size, 'one column, no gaps, no stray pixel');
  const row = (y) => pts.filter(([, py]) => py === y).map(([x]) => x);
  const top = Math.min(...pts.map(([, y]) => y));
  // Straight up from the pipe for its first ten rows, narrow at the pipe, then growing.
  for (let y = -9; y <= 0; y++) assert.ok(row(y).every((x) => x >= -2 && x <= 3), `row ${y} rises straight over the pipe`);
  assert.ok(Math.max(...row(-1)) - Math.min(...row(-1)) + 1 <= 3, 'three wide at most at the pipe');
  assert.ok(Math.max(...row(top + 4)) - Math.min(...row(top + 4)) + 1 >= 8, 'eight wide or more in its last puff');
  assert.ok(top <= -22 && Math.min(...pts.map(([x]) => x)) <= -18, "it rises some twenty-two rows and drifts left");
  // It stays under the peak's lit snowfield (smoke on snow reads as snow):
  // at most a tenth of it over the far layer's snow and glacier blue.
  const pipe = composeCabin({ art, cabin }).anchors.pipe;
  const farDay = render(composeCabin({ art, cabin, hour: 'day' })).layers[1];
  const onSnow = pts.filter(([x, y]) => [3, 4].includes(farDay[(pipe[1] + y) * WIDTH + pipe[0] + x])).length;
  assert.ok(onSnow <= pts.length / 10, `${onSnow} of ${pts.length} smoke pixels on the peak's snow`);
  // Its upper half drifts more across than up (the peak's gullies fall steeply), so it never runs with them.
  // Past its bend (row -10) it spreads across at least half again as far as it climbs.
  const upper = pts.filter(([, y]) => y <= -10);
  const across = Math.max(...upper.map(([x]) => x)) - Math.min(...upper.map(([x]) => x));
  assert.ok(across >= 1.5 * (-10 - top), `drifts ${across} across over ${-10 - top} rows`);
  // At night, over what it crosses: at least 90% of its pixels differ from
  // the picture behind it, at every frame of its cycle, and none sits on
  // the foothills' slate in their slate.
  const lit = composeCabin({ art, cabin, hour: 'night', moon: 3 });
  const bare = { ...lit, ops: lit.ops.filter((op) => !(op[0] === 'T' && op[1] === 'cabin_smoke')) };
  const raw = composite(render(lit));
  const r = render(lit);
  const behind = slotsOf(bare);
  for (const frame of [0, 3, 6, 9]) {
    const now = slotsOf(lit, frame);
    let smoke = 0;
    let differ = 0;
    for (let p = 0; p < raw.length; p++) {
      if (raw[p] !== 29 && raw[p] !== 6) continue;
      smoke++;
      if (now[p] !== behind[p]) differ++;
      const foothills = [11, 12, 15].includes(r.layers[1][p]) && r.layers[2][p] === TRANSPARENT;
      if (foothills) assert.ok(raw[p] === 6 && now[p] !== behind[p], `frame ${frame}: smoke at ${p % WIDTH},${Math.floor(p / WIDTH)} sits on the foothills' slate`);
    }
    assert.ok(smoke > 150 && differ / smoke >= 0.9, `frame ${frame}: ${differ} of ${smoke} smoke pixels differ from what is behind`);
  }
  // Never pink: not at dusk, not at dawn (alpenglow doesn't light smoke at roof height).
  for (const sc of [{ hour: 'dusk' }, { hour: 'dawn', evening: false, fog: true }, { hour: 'dusk', sky: 'rain' }]) {
    const c = composeCabin({ art, cabin, ...sc });
    const cr = composite(render(c));
    for (const frame of [0, 3, 6, 9]) {
      const sl = slotsOf(c, frame);
      for (let p = 0; p < cr.length; p++) if (cr[p] === 29 || VAPOUR.includes(cr[p])) assert.notEqual(sl[p], 6, `${c.key} frame ${frame}: pink smoke or fog`);
    }
  }
});

test('the smoke reads in the morning fog (S7b, Lead call 69): the far fog parts behind the stovepipe, so no fog lies behind any of the smoke, its column reads whole, and at least 90% of it reads at every frame; the fog is S7\'s everywhere else', () => {
  const pipe = composeCabin({ art, cabin }).anchors.pipe;
  const smokeOnly = renderPic([['@', 'near'], ['T', 'cabin_smoke', pipe[0], pipe[1], 0]], { width: WIDTH, height: HEIGHT, stamps: art.stamps }).layers[3];
  const fogFar = renderPic([['@', 'far'], ['T', 'cabin_fog_far', 0, 0, 0]], { width: WIDTH, height: HEIGHT, stamps: art.stamps }).layers[1];
  // The column: the stamp's pixels from the pipe's cap up to row 69. No fog stamp pixel behind any of them.
  let column = 0;
  for (let p = 0; p < smokeOnly.length; p++) {
    if (smokeOnly[p] === TRANSPARENT) continue;
    if (Math.floor(p / WIDTH) >= 69) column++;
    assert.equal(fogFar[p], TRANSPARENT, `the far fog lies behind the smoke at ${p % WIDTH},${Math.floor(p / WIDTH)}`);
  }
  assert.ok(column >= 30, `${column} pixels in the column`);
  // The fog's top: S7's row of puffs (rows 70 to 76) but for the part behind the pipe, x 61 to 75, where it drops to row 83, under the pipe's cap.
  const topOf = (x) => {
    for (let y = 0; y < HEIGHT; y++) if (fogFar[y * WIDTH + x] !== TRANSPARENT) return y;
    return HEIGHT;
  };
  for (let x = 0; x < WIDTH; x++) {
    const top = topOf(x);
    if (x >= 61 && x <= 75) assert.ok(top > 71 && top <= pipe[1] + 2, `x ${x}: the fog parts behind the pipe (its top at ${top})`);
    else assert.ok(top >= 70 && top <= 76, `x ${x}: the fog's top at ${top}, as S7 drew it`);
  }
  for (let x = 65; x <= 72; x++) assert.equal(topOf(x), pipe[1] + 2, `x ${x}: just under the pipe's cap`);
  // In every fog scene that smokes, as composed: no fog shows behind any
  // smoke pixel (what is behind it is what the same scene shows without
  // fog), the column resolves to slots other than what is behind it at every
  // frame, and so does 90% of all of it under a clear sky (under the
  // overcast, the cloud on the peak, not the fog, lies behind its drift).
  /** @type {string[]} */
  const shares = [];
  for (const [hour, evening] of HOURS) {
    for (const sky of ['clear', 'cloudy']) {
      const c = composeCabin({ art, cabin, hour, evening, sky, fog: true });
      if (!c.smoke) continue;
      const k = c.ops.findIndex((op) => op[0] === 'T' && op[1] === 'cabin_smoke');
      const comp = composite(render(c));
      const bare = { ...c, ops: c.ops.filter((_, i) => i !== k) };
      const noFog = composeCabin({ art, cabin, hour, evening, sky, fog: false });
      const noFogBare = { ...noFog, ops: noFog.ops.filter((op) => !(op[0] === 'T' && op[1] === 'cabin_smoke')) };
      const behind = composite(render(bare));
      const behindClear = composite(render(noFogBare));
      const mine = [];
      for (let p = 0; p < comp.length; p++) if (smokeOnly[p] !== TRANSPARENT && comp[p] === smokeOnly[p]) mine.push(p);
      assert.ok(mine.length > 200, `${c.key}: ${mine.length} smoke pixels show`);
      for (const p of mine) assert.equal(behind[p], behindClear[p], `${c.key}: fog behind the smoke at ${p % WIDTH},${Math.floor(p / WIDTH)}`);
      let worst = 1;
      for (let frame = 0; frame < 12; frame++) {
        const now = slotsOf(c, frame);
        const was = resolve(behind, WIDTH, PAL, { remap: c.table, frame });
        let differ = 0;
        for (const p of mine) {
          if (now[p] !== was[p]) differ++;
          else assert.ok(Math.floor(p / WIDTH) < 69, `${c.key} frame ${frame}: the column at ${p % WIDTH},${Math.floor(p / WIDTH)} is lost in what is behind it`);
        }
        worst = Math.min(worst, differ / mine.length);
      }
      shares.push(`${c.key} ${(worst * 100).toFixed(1)}%`);
      if (sky === 'clear') assert.ok(worst >= 0.9, `${c.key}: ${(worst * 100).toFixed(1)}% of the smoke reads at its worst frame`);
    }
  }
  assert.equal(shares.length, 12, shares.join(', '));
});

test('warm spill lands as light, not paint: a dither on the deck densest at the sill, each tread lit along its front lip in a checker that widens down the steps, a sparse fan on the grass before them; the lanterns stand apart from the lit glass', () => {
  const c = composeCabin({ art, cabin, hour: 'night' });
  const night = composite(render(c));
  const spill = new Set();
  for (let p = 0; p < night.length; p++) if (night[p] === 28) spill.add(p);
  const at = (x, y) => spill.has(y * WIDTH + x);
  const row = (y, x0 = 0, x1 = WIDTH - 1) => Array.from({ length: x1 - x0 + 1 }, (_, i) => x0 + i).filter((x) => at(x, y));
  // The deck (rows 212 to 217): never two lit pixels side by side, so no
  // painted stripe; the first board densest, thinning toward the front
  // edge; the ink seam (214) and the rim board (217) dark.
  // (From row 214 the steps stand in the deck's middle, their own below.)
  const deck = (y) => row(y, 24, 136).filter((x) => y < 214 || x < 62 || x > 98);
  for (let y = 212; y <= 217; y++) for (const x of deck(y)) assert.ok(!at(x + 1, y), `a solid run of spill at ${x},${y}`);
  const n = (y) => deck(y).length;
  assert.ok(n(212) >= 30, `${n(212)} lit on the first board`);
  assert.ok(n(212) > n(213) && n(213) >= n(215) && n(215) > n(216) && n(216) > 0, [212, 213, 215, 216].map(n).join());
  assert.deepEqual([n(214), n(217)], [0, 0], 'the seam and the rim board stay dark');
  // The steps: light only on each tread's front lip, a checker that widens as they come down.
  const treads = [214, 219, 224, 229];
  for (let y = 214; y <= 233; y++) {
    const lit = row(y, 60, 100);
    if (!treads.includes(y)) assert.deepEqual(lit, [], `row ${y} on the steps is unlit`);
    else for (const x of lit) assert.ok(!at(x + 1, y), `a solid run on the tread at ${x},${y}`);
  }
  const widths = treads.map((y) => {
    const lit = row(y, 60, 100);
    return Math.max(...lit) - Math.min(...lit);
  });
  for (let i = 1; i < widths.length; i++) assert.ok(widths[i] > widths[i - 1], `the treads' light widens: ${widths.join()}`);
  // The grass: a sparse fan before the steps, widening and thinning away
  // from them (spec 5.6 item 3), and the embers' glow in the bowl; no other
  // spill on the lawn.
  const [bx, , bw] = cabin.places.fire_bowl.art;
  const bowl = c.anchors.bowl;
  const fan = [];
  for (const p of spill) {
    const x = p % WIDTH;
    const y = Math.floor(p / WIDTH);
    if (y <= 233) continue;
    if (x >= bx && x < bx + bw && y >= bowl[1] && y <= bowl[1] + 3) continue;
    fan.push([x, y]);
  }
  assert.ok(fan.length >= 30, `${fan.length} pixels of the fan`);
  for (const [x, y] of fan) {
    assert.ok(y >= 235 && y <= 246, `spill on the grass at ${x},${y}, outside the fan's rows`);
    assert.ok(Math.abs(x - 80) <= 15 + (y - 236) + 1, `spill at ${x},${y}, outside the fan`);
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [-1, 1]]) assert.ok(!at(x + dx, y + dy), `the fan's dots at ${x},${y} touch`);
  }
  const density = (y0, y1) => {
    const rows = fan.filter(([, y]) => y >= y0 && y <= y1);
    const span = Array.from({ length: y1 - y0 + 1 }, (_, i) => 2 * (15 + (y0 + i - 236)) + 1).reduce((a, b) => a + b, 0);
    return rows.length / span;
  };
  assert.ok(density(236, 239) <= 0.25 && density(236, 239) > density(243, 246), `the fan thins: ${density(236, 239).toFixed(2)} near, ${density(243, 246).toFixed(2)} far`);
  // The lanterns: their lamp body never touches the lit glass; the window's
  // frame and the door's casing either side stay dark, a cap on top.
  for (const name of ['lantern_l', 'lantern_r']) {
    const [lx, ly] = c.anchors[name];
    const body = [];
    for (let y = ly + 1; y <= ly + 3; y++) for (let x = lx - 1; x <= lx + 1; x++) if (night[y * WIDTH + x] === 24) body.push([x, y]);
    assert.ok(body.length >= 6, `${name}: a small lamp-lit body`);
    for (let y = ly; y <= ly + 4; y++) for (const x of [lx - 2, lx + 2]) assert.ok(![24, 28].includes(night[y * WIDTH + x]), `${name}: light at ${x},${y} runs into the glass or the door`);
    for (let x = lx - 1; x <= lx + 1; x++) assert.equal(night[ly * WIDTH + x], 0, `${name}: its ink cap`);
  }
});

test('the embers: one solid mound of fire in the bowl\'s mouth with a hot core, the glow on its front lip and rim, the back of the bowl left dark, no ring on the grass', () => {
  const c = composeCabin({ art, cabin, hour: 'night' });
  const flat = composite(render(c));
  const [ax, ay] = c.anchors.bowl;
  const [bx, by, bw, bh] = cabin.places.fire_bowl.art;
  const at = (kind) => {
    const out = [];
    for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) if (flat[y * WIDTH + x] === kind) out.push([x - ax, y - ay]);
    return out;
  };
  const fire = at(20);
  const core = at(24);
  const mound = [...fire, ...core];
  // One mound: two rows, eight to ten wide, solid (no gap in a row).
  const rows = [...new Set(mound.map(([, y]) => y))].sort((a, b) => a - b);
  assert.deepEqual(rows, [0, 1], 'two rows tall, in the middle of the mouth');
  for (const r of rows) {
    const xs = mound.filter(([, y]) => y === r).map(([x]) => x).sort((a, b) => a - b);
    assert.equal(xs.length, xs[xs.length - 1] - xs[0] + 1, `row ${r} solid`);
    assert.ok(xs.length >= 8 && xs.length <= 10, `row ${r}: ${xs.length} wide`);
  }
  assert.ok(core.length >= 2 && core.length <= 3, `a hot core of ${core.length}`);
  // The glow: spill on the lip in front of the mound and along the front rim; nothing lit above the mound (the back of the mouth, the back rim).
  const spill = at(28);
  assert.ok(spill.filter(([, y]) => y === 2).length >= 12 && spill.filter(([, y]) => y === 3).length >= 8, 'the front lip and rim glow');
  assert.ok(![...spill, ...mound].some(([, y]) => y < 0), 'the back of the bowl stays dark');
  // The back rim's lit rust is laid over, so at night it is bark, not brick.
  const sl = slotsOf(c);
  for (let x = ax - 7; x <= ax + 7; x++) assert.equal(sl[(ay - 3) * WIDTH + x], 10, `the back rim at ${x} is dark`);
});

test('the rain: streaks one pixel wide and six tall, slanting left, densest over the windows and sparse on the lawn', () => {
  const streaks = art.stamps.cabin_rain.filter((op) => op[0] === 'L');
  assert.ok(streaks.length > 100);
  for (const op of streaks) {
    const [x0, y0, x1, y1] = op[1];
    assert.deepEqual([x0 - x1, y1 - y0], [2, 5], 'six tall, two to the left');
  }
  const tops = streaks.map((op) => [op[1][0], op[1][1]]);
  const density = (x0, x1, y0, y1) => tops.filter(([x, y]) => x >= x0 && x <= x1 && y >= y0 && y <= y1).length / ((x1 - x0 + 1) * (y1 - y0 + 1));
  assert.ok(density(40, 120, 176, 204) > 3 * density(0, 159, 236, 314), 'denser over the windows than on the lawn');
});

test('the mole hills: fifteen to eighteen rounded mounds (a brick top, a bark body, an ink foot) in a loose drift, growing toward us', () => {
  const sizes = {};
  for (const id of ['mole_hill_s', 'mole_hill_m', 'mole_hill_l']) {
    const xs = [];
    const ys = [];
    const colors = new Set();
    for (const op of art.stamps[id]) {
      if (op[0] === 'C') colors.add(op[1]);
      if (op[0] === 'L') for (let i = 0; i < op[1].length; i += 2) xs.push(op[1][i]), ys.push(op[1][i + 1]);
    }
    sizes[id] = [Math.max(...xs) - Math.min(...xs) + 1, Math.max(...ys) - Math.min(...ys) + 1];
    assert.deepEqual([...colors].sort((a, b) => a - b), [0, 9, 10], `${id}: brick top, bark body, ink foot`);
  }
  assert.deepEqual(sizes, { mole_hill_s: [3, 2], mole_hill_m: [6, 3], mole_hill_l: [10, 4] });
  const moles = ART.pics[cabin.plate].ops.filter((op) => op[0] === 'T' && String(op[1]).startsWith('mole_hill_'));
  assert.ok(moles.length >= 15 && moles.length <= 18, `${moles.length} mole hills`);
  for (const op of moles) {
    const y = op[3];
    const k = String(op[1]).slice(-1);
    if (k === 's') assert.ok(y >= 230 && y <= 252, `a small one at row ${y}, near the porch`);
    if (k === 'm') assert.ok(y > 252 && y <= 285, `a middling one at row ${y}`);
    if (k === 'l') assert.ok(y > 285 && y <= 312, `a big one at row ${y}, in front`);
  }
});

test('the lawn: tufts in v and ^ clumps (no ruled dashes), a foreground seam of four checker rows at most, a flat band of dust on the car, and the path narrowing into the maples\' shade', () => {
  const day = render(composeCabin({ art, cabin, hour: 'day' }));
  const near = day.layers[3];
  // No moss dash of three or more in a row out on the sunlit field (rows 240 to 286): tufts, not ruled lines
  // (the fire bowl's own shadow on the grass aside).
  const [fx, fy, fw, fh] = cabin.places.fire_bowl.art;
  for (let y = 240; y <= 286; y++) {
    let run = 0;
    for (let x = 30; x < WIDTH; x++) {
      const v = near[y * WIDTH + x];
      const bowl = x >= fx - 2 && x < fx + fw + 2 && y >= fy && y <= fy + fh + 2;
      run = v === 13 && !bowl ? run + 1 : 0;
      assert.ok(run < 3, `a moss dash at ${x},${y}`);
    }
  }
  // The foreground seam: rows where sage and moss alternate pixel by pixel, at most four.
  let seam = 0;
  for (let y = 280; y < 312; y++) {
    let alt = 0;
    for (let x = 50; x < 130; x++) if ([13, 14].includes(near[y * WIDTH + x]) && [13, 14].includes(near[y * WIDTH + x + 1]) && near[y * WIDTH + x] !== near[y * WIDTH + x + 1]) alt++;
    if (alt > 30) seam++;
  }
  assert.ok(seam >= 1 && seam <= 4, `${seam} checker rows in the foreground seam`);
  assert.ok(!art.stamps.car_dusty.some((op) => op[0] === 'D'), 'the car\'s dust is a flat band, not a dither');
  // The path: one ribbon (the art director's third round), cream in the
  // sun, four pixels across nearest us, running up past the register post's
  // foot and tapering to one pixel where it enters the maples' shade (moss)
  // at the frame's left edge.
  const isPath = (x, y) => near[y * WIDTH + x] === 5 || (near[y * WIDTH + x] === 14 && y <= 250 && x <= 2);
  const path = [];
  for (let y = 240; y < 290; y++) for (let x = 0; x < 46; x++) if (isPath(x, y)) path.push([x, y]);
  const cream = path.filter(([x, y]) => near[y * WIDTH + x] === 5);
  assert.ok(cream.length > 60, `${cream.length} cream pixels of path in the sun`);
  // one piece (8 ways)
  const key = new Set(path.map(([x, y]) => `${x},${y}`));
  const reach = new Set();
  const stack = [`${path[0][0]},${path[0][1]}`];
  while (stack.length) {
    const k = stack.pop();
    if (reach.has(k) || !key.has(k)) continue;
    reach.add(k);
    const [x, y] = k.split(',').map(Number);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) stack.push(`${x + dx},${y + dy}`);
  }
  assert.equal(reach.size, key.size, 'one ribbon, not a lone shape');
  // past the post's foot
  const post = cabin.places.register_post.art;
  const foot = [post[0] + Math.floor(post[2] / 2), post[1] + post[3] - 1];
  assert.ok(path.some(([x, y]) => Math.abs(x - foot[0]) <= 3 && y > foot[1] && y - foot[1] <= 2), 'it runs past the post\'s foot');
  // tapering: one pixel at the left edge, in the shade; wide nearest us
  const edge = path.filter(([x]) => x === 0);
  assert.ok(edge.length > 0 && edge.every(([, y]) => y <= 252), 'it reaches the frame\'s left edge in the shade');
  assert.ok(edge.some(([, y]) => near[(y - 1) * WIDTH] === 13 || near[(y + 1) * WIDTH + 1] === 13), 'among the moss of the maples\' shade');
  // A one-pixel line where it enters the shade (no row of it there more
  // than two pixels long), at least three rows deep at every column of its
  // near end.
  const far = path.filter(([, y]) => y <= 253);
  assert.ok(far.length > 0 && [...new Set(far.map(([, y]) => y))].every((y) => far.filter(([, py]) => py === y).length <= 2), 'one pixel wide in the shade');
  for (let x = 30; x <= 37; x++) assert.ok(path.filter(([px]) => px === x).length >= 3, `three rows deep at ${x}, nearest us`);
});

test('dusk and dawn keep their alpenglow on the peak and the sky: the path, the chalk and the dry grass go to sage, never pink', () => {
  for (const sc of [{ hour: 'dusk' }, { hour: 'dawn', evening: false }]) {
    const c = composeCabin({ art, cabin, ...sc });
    const sl = slotsOf(c);
    const raw = composite(render(c));
    let cream = 0;
    for (let p = 0; p < raw.length; p++) {
      if (raw[p] !== 5) continue;
      cream++;
      assert.equal(sl[p], 14, `${c.key}: paper cream at ${p % WIDTH},${Math.floor(p / WIDTH)} is sage`);
    }
    assert.ok(cream > 30);
    // On the ground (below the porch) no pink but the car's windshield glints (the pink sky in the glass).
    const [cx, cy, cw, ch] = cabin.places.car.art;
    for (let p = 222 * WIDTH; p < sl.length; p++) {
      const x = p % WIDTH;
      const y = Math.floor(p / WIDTH);
      if (x >= cx && x < cx + cw && y >= cy && y < cy + ch) continue;
      assert.notEqual(sl[p], 6, `${c.key}: pink on the ground at ${x},${y}`);
    }
  }
});

test('at blue hour and at night the ground stands under the sky: the lawn no lighter than the name\'s sky, the maples dark against the horizon\'s glow', () => {
  const luma = (slot) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(PALETTE[slot].slice(i, i + 2), 16));
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };
  for (const hour of ['blue', 'night']) {
    const c = composeCabin({ art, cabin, hour });
    const sl = slotsOf(c);
    const day = composite(render(composeCabin({ art, cabin, hour: 'day' })));
    const r = render(c);
    const mean = (pred) => {
      let sum = 0;
      let n = 0;
      for (let p = 0; p < sl.length; p++) if (pred(p)) (sum += luma(sl[p])), n++;
      return sum / n;
    };
    // The lawn: the meadow's sage and moss below the porch, where nothing stands on it.
    const lawn = mean((p) => p >= 240 * WIDTH && p < 300 * WIDTH && [13, 14].includes(day[p]) && r.layers[3][p] !== TRANSPARENT);
    const sky = mean((p) => p < 29 * WIDTH && ![22, 24].includes(composite(r)[p]));
    assert.ok(lawn <= sky + 2, `${hour}: the lawn (${lawn.toFixed(0)}) is no lighter than the sky (${sky.toFixed(0)})`);
    // The maples (moss and sage by day on the mid layer) are no lighter than the lawn.
    const maples = mean((p) => p < 200 * WIDTH && [13, 14].includes(day[p]) && r.layers[2][p] !== TRANSPARENT && r.layers[3][p] === TRANSPARENT);
    assert.ok(maples <= lawn + 2, `${hour}: the maples (${maples.toFixed(0)}) are no lighter than the lawn (${lawn.toFixed(0)})`);
  }
});

// The art director's second round (S7 track A, revision 2).

test('the skies: rows 0 to 28 one flat color under the name, no ruled top line; the clear sky\'s horizon band a checker25 seam, a checker seam, then snow (a real glow at dusk in the gaps by the peak and the spruce); the overcast and the rain decks flat with billowed tops, the rain a step darker with no dark underside', () => {
  for (const [sky, slot] of [['clear', 3], ['cloudy', 3], ['rain', 2]]) {
    const L = render(composeCabin({ art, cabin, hour: 'day', sky })).layers[0];
    for (let y = 0; y <= 28; y++) for (let x = 0; x < WIDTH; x++) assert.equal(L[y * WIDTH + x], slot, `${sky}: ${x},${y} is the flat sky under the name`);
  }
  // The clear sky: flat glacier blue down to its horizon band, fourteen rows
  // deep, a quarter snow, then half, then snow to the valley.
  const clear = render(composeCabin({ art, cabin, hour: 'day' })).layers[0];
  const share = (y) => Array.from({ length: WIDTH }, (_, x) => clear[y * WIDTH + x]).filter((v) => v === 4).length / WIDTH;
  for (let y = 29; y < 54; y++) assert.equal(share(y), 0, `row ${y} is clear sky`);
  const seam = [54, 55, 56, 57, 58].map(share).reduce((a, b) => a + b, 0) / 5;
  assert.ok(seam > 0.2 && seam <= 0.3, `rows 54 to 58: the checker25 seam (${seam.toFixed(2)} snow)`);
  for (let y = 59; y <= 63; y++) assert.equal(share(y), 0.5, `row ${y}: the checker seam`);
  for (let y = 64; y <= 67; y++) assert.equal(share(y), 1, `row ${y}: solid snow`);
  // At dusk that is a pink glow in the gaps right of the spruce: solid pink
  // there, and it reaches the gap between the peak and the maples too.
  const dusk = composeCabin({ art, cabin, hour: 'dusk' });
  const sl = slotsOf(dusk);
  const r = render(dusk);
  const openSky = (p) => r.layers[1][p] === TRANSPARENT && r.layers[2][p] === TRANSPARENT && r.layers[3][p] === TRANSPARENT;
  let pinkRight = 0;
  let pinkLeft = 0;
  for (let y = 54; y < 80; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const p = y * WIDTH + x;
      if (!openSky(p) || sl[p] !== 6) continue;
      if (x >= 122) pinkRight++;
      if (x < 46) pinkLeft++;
    }
  }
  assert.ok(pinkRight >= 60 && pinkLeft >= 20, `the dusk glow: ${pinkRight} pink by the spruce, ${pinkLeft} by the peak`);
  // The decks: no dither in either sky (the rain's seam is its cap's, on the peak).
  for (const sky of ['cloudy', 'rain']) assert.equal(art.stamps[cabin.skies[sky]].filter((op) => op[0] === 'D').length, 0, `${sky}: flat fills`);
  const tones = {};
  for (const sky of ['cloudy', 'rain']) {
    const L = render(composeCabin({ art, cabin, hour: 'day', sky })).layers[0];
    for (let y = 29; y < 100; y++) {
      let flips = 0;
      for (let x = 0; x < WIDTH - 1; x++) if (L[y * WIDTH + x] !== L[y * WIDTH + x + 1]) flips++;
      assert.ok(flips < 20, `${sky}: row ${y} is no screen door (${flips} changes)`);
    }
    // Its billows: the top edge of the deck rises and falls at least three times across the frame.
    const top = L[0];
    const topEdge = [];
    for (let x = 0; x < WIDTH; x++) {
      let y = 29;
      while (L[y * WIDTH + x] === top && y < 100) y++;
      topEdge.push(y);
    }
    const steps = topEdge.filter((y, x) => x === 0 || y !== topEdge[x - 1]);
    let turns = 0;
    for (let i = 1; i < steps.length - 1; i++) if (steps[i] < steps[i - 1] && steps[i] < steps[i + 1]) turns++;
    assert.ok(turns >= 3, `${sky}: ${turns} billows along its top`);
    tones[sky] = new Set();
    for (let y = 0; y < 100; y++) tones[sky].add(L[y * WIDTH + 80]);
  }
  assert.deepEqual([...tones.cloudy].sort(), [2, 3, 4], 'the overcast: glacier over snow tops, glacier body, slate underside');
  assert.deepEqual([...tones.rain].sort(), [2, 3], 'the rain a step darker: slate over a glacier rim, a slate body, no ink');
});

/** S7's renders of the rain cap's box (x 20 to 118, rows 26 to 79) at blue hour and night, resolved at each of the smoke's twelve frames, hashed (taken before S7b's change; every state the same). */
const S7_RAIN_CAP = Object.freeze({ blue: '30cd537d', night: 'd6f67d95' });
const RAIN_CAP_BOX = Object.freeze([20, 26, 99, 54]);

test('the cloud on the peak is the deck itself, lowered over the summit: the sky\'s own colors where it joins the deck, a foot in the deck\'s own slate under rain (S7b, Lead call 69: no ink, so no dark strip over the roof by day or at dusk, and S7\'s soft dark foot at blue hour and night, pixel for pixel), and clear of the knoll behind the cabin', () => {
  const knollTop = (far, x) => {
    for (let y = 60; y < 100; y++) if ([11, 12, 15].includes(far[y * WIDTH + x])) return y;
    return HEIGHT;
  };
  const plateFar = renderPic(ART.pics[cabin.plate].ops.filter((op) => !(op[0] === 'Z')), { width: WIDTH, height: HEIGHT, stamps: art.stamps }).layers[1];
  for (const [sky, cap, under] of [['cloudy', 'cabin_cloud_cap', 2], ['rain', 'cabin_rain_cap', 2]]) {
    const c = composeCabin({ art, cabin, hour: 'day', sky });
    const r = render(c);
    const capL = renderPic([['@', 'far'], ['T', cap, 0, 0, 0]], { width: WIDTH, height: HEIGHT, stamps: art.stamps }).layers[1];
    const skyL = r.layers[0];
    let joined = 0;
    let lowered = 0;
    let seam = 0;
    for (let x = 0; x < WIDTH; x++) {
      let foot = -1;
      for (let y = 0; y < HEIGHT; y++) if (capL[y * WIDTH + x] !== TRANSPARENT) foot = y;
      if (foot < 0) continue;
      // Down to where it is lowered, the cap is the sky behind it, pixel for pixel.
      let y = 26;
      while (capL[y * WIDTH + x] === skyL[y * WIDTH + x] && y < foot) {
        joined++;
        y++;
      }
      // Its foot: the deck's underside color, lowered over the summit.
      assert.equal(capL[foot * WIDTH + x], under, `${cap}: its foot at ${x} is the underside`);
      if (foot >= 62) lowered++;
      // Under rain, what lies between the body and the foot is the deck's own slate (S7b: S7's checker of slate and ink, drawn in slate).
      if (sky === 'rain') {
        for (let yy = y; yy < foot; yy++) {
          const v = capL[yy * WIDTH + x];
          assert.equal(v, 2, `${cap} at ${x},${yy}: ${v} in its seam`);
          seam++;
        }
      }
      // It stays clear of the knoll behind the cabin: wherever its foot shows
      // (no tree or roof in front), two rows of the plate's far layer show under it.
      const shows = r.layers[2][foot * WIDTH + x] === TRANSPARENT && r.layers[3][foot * WIDTH + x] === TRANSPARENT;
      if (shows) assert.ok(foot <= knollTop(plateFar, x) - 2, `${cap}: its foot at ${x},${foot} sits on the knoll`);
    }
    assert.ok(joined > 2000 && lowered >= 40, `${cap}: ${joined} joined, ${lowered} columns lowered`);
    if (sky === 'rain') {
      // The deck's own slate all the way to its foot (S7's seam of slate and ink, and its ink foot, now slate): only its rim is glacier blue.
      let slate = 0;
      for (let p = 0; p < capL.length; p++) {
        if (capL[p] === TRANSPARENT) continue;
        const y = Math.floor(p / WIDTH);
        if (capL[p] === 3) assert.ok(y >= 29 && y <= 40, `${cap}: glacier blue at ${p % WIDTH},${y} off its rim`);
        else assert.equal(capL[p], 2, `${cap} at ${p % WIDTH},${y}`);
        if (capL[p] === 2 && y >= 60) slate++;
      }
      assert.ok(slate >= 300, `${slate} pixels of slate in its lowered foot (rows 60 and down)`);
      assert.equal(seam, 0, 'and so it joins the sky all the way down: no seam of another color');
    }
    // The summit is in the cloud: the cap covers the peak's crest round it.
    let hidden = 0;
    for (let y = 26; y < 50; y++) for (let x = 40; x < 70; x++) if (plateFar[y * WIDTH + x] !== TRANSPARENT) {
      assert.notEqual(capL[y * WIDTH + x], TRANSPARENT, `${sky}: the peak at ${x},${y} shows through the cloud`);
      hidden++;
    }
    assert.ok(hidden > 200, `${hidden} pixels of the summit in the cloud`);
    // And no snow of the crest shows beside it: none of the peak's snow is left in the far layer as composed.
    const far = r.layers[1];
    const mid = r.layers[2];
    for (let p = 0; p < far.length; p++) if (Math.floor(p / WIDTH) < 80 && far[p] === 4 && mid[p] === TRANSPARENT && r.layers[3][p] === TRANSPARENT) {
      if (sky === 'cloudy') assert.ok(capL[p] !== TRANSPARENT, `${sky}: the crest's snow shows at ${p % WIDTH},${Math.floor(p / WIDTH)} beside the cloud`);
    }
  }
  // S7b (Lead call 69): the rain cap draws no ink at all.
  const pens = art.stamps.cabin_rain_cap.flatMap((op) => (op[0] === 'C' ? [op[1]] : op[0] === 'D' ? [op[1], op[2]] : []));
  assert.ok(pens.length > 0 && !pens.includes(0), `cabin_rain_cap's pens: ${[...new Set(pens)]}`);
  const capOnly = renderPic([['@', 'far'], ['T', 'cabin_rain_cap', 0, 0, 0]], { width: WIDTH, height: HEIGHT, stamps: art.stamps }).layers[1];
  const [bx, by, bw, bh] = RAIN_CAP_BOX;
  for (let p = 0; p < capOnly.length; p++) if (capOnly[p] !== TRANSPARENT) assert.ok(inBoxes([RAIN_CAP_BOX], p % WIDTH, Math.floor(p / WIDTH)), 'the cap lies in its box');
  // By day, at dawn and at dusk, under rain, in every state: no pixel of the cap shows as ink (the S7 smudge over the roof).
  for (const [hour, evening] of [['day', true], ['dawn', false], ['dusk', true]]) {
    for (const state of [[], ['first'], ['guestbook'], ['flag_up']]) {
      const c = composeCabin({ art, cabin, hour, evening, sky: 'rain', state });
      const r = render(c);
      const sl = slotsOf(c);
      let shown = 0;
      for (let p = 0; p < capOnly.length; p++) {
        if (capOnly[p] === TRANSPARENT || r.layers[2][p] !== TRANSPARENT || r.layers[3][p] !== TRANSPARENT || r.layers[1][p] !== capOnly[p]) continue;
        shown++;
        assert.notEqual(sl[p], 0, `${c.key}: the cap shows ink at ${p % WIDTH},${Math.floor(p / WIDTH)}`);
      }
      assert.ok(shown > 1500, `${c.key}: ${shown} pixels of the cap show`);
    }
  }
  // At blue hour (both) and night the tables send slate to ink, so the cap's box resolves exactly as S7 drew it, at every frame of the smoke.
  for (const [hour, evening] of [['blue', true], ['blue', false], ['night', true]]) {
    for (const state of [[], ['first'], ['guestbook'], ['flag_up']]) {
      const c = composeCabin({ art, cabin, hour, evening, sky: 'rain', state });
      const comp = composite(render(c));
      const box = [];
      for (let frame = 0; frame < 12; frame++) {
        const sl = resolve(comp, WIDTH, PAL, { remap: c.table, frame });
        for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) box.push(sl[y * WIDTH + x]);
      }
      assert.equal(hashBytes(new Uint8Array(box)), S7_RAIN_CAP[hour], `${c.key}: the cap's box as S7 drew it`);
    }
  }
});

test('the siding: quiet bark battens on the cedar, rust only on the door, the boards silvered at the wall\'s foot on the weather side in a checker the battens run through', () => {
  const c = composeCabin({ art, cabin, hour: 'day' });
  const near = render(c).layers[3];
  const [dx, dy, dw, dh] = cabin.places.door.art;
  let battens = 0;
  for (let y = 102; y <= 211; y++) {
    for (let x = 30; x <= 130; x++) {
      const v = near[y * WIDTH + x];
      const door = x >= dx - 1 && x <= dx + dw && y >= dy - 1 && y <= dy + dh;
      if (!door) assert.notEqual(v, 8, `rust at ${x},${y} on the wall`);
      if (v === 10 && y > 120 && y < 168 && (x - 33) % 6 === 0) battens++;
    }
  }
  assert.ok(battens > 100, `${battens} batten pixels, a bark board every sixth column`);
  // Silvering (the art director's third round): worked into the lowest
  // rows of the left-most boards as a checker of glacier blue and slate
  // under a ragged top, never a solid grey block; the battens run through
  // it in bark.
  const tops = [];
  for (const x of [31, 32, 34, 35, 36, 37, 38]) {
    const col = [];
    for (let y = 190; y <= 210; y++) col.push(near[y * WIDTH + x]);
    const first = col.findIndex((v) => v === 2 || v === 3);
    assert.ok(first >= 0, `column ${x} is silvered`);
    tops.push(first);
    const worn = col.slice(-4);
    assert.ok(worn.includes(2) && worn.includes(3), `column ${x}: glacier and slate at its foot`);
    for (let i = 1; i < 4; i++) assert.notEqual(worn[i], worn[i - 1], `column ${x}: a checker at its foot, not a solid board`);
  }
  assert.ok(new Set(tops).size >= 4, `a ragged top: ${tops.join()}`);
  for (const x of [33, 39]) for (let y = 200; y <= 210; y++) assert.equal(near[y * WIDTH + x], 10, `the batten at ${x} runs through it at row ${y}`);
});

test('the spruce: stacked tiers, each its own stamp, lit on top and shaded beneath, so the light steps down tier by tier; a ragged spire with a leader under the quiet sky', () => {
  const tiers = ART.pics && art.stamps.sitka_spruce.filter((op) => op[0] === 'T' && String(op[1]).startsWith('sitka_tier_'));
  assert.ok(tiers.length >= 9 && tiers.length <= 12, `${tiers.length} tiers`);
  assert.ok(tiers.every((op, i) => i === 0 || op[3] < tiers[i - 1][3]), 'laid lowest first, so each tier hangs over the one below');
  // Within each tier the lit band's lower edge on the left is well below its top: the split steps, never one vertical line.
  const day = render(composeCabin({ art, cabin, hour: 'day' }));
  const spruce = renderPic([['@', 'mid'], ['T', 'sitka_spruce', 112, 152, 0]], { width: WIDTH, height: HEIGHT, stamps: art.stamps }).layers[2];
  const splits = new Set();
  for (let y = 60; y < 140; y++) {
    const xs = [];
    for (let x = 90; x < 135; x++) if (spruce[y * WIDTH + x] === 12) xs.push(x);
    if (xs.length) splits.add(Math.max(...xs));
  }
  assert.ok(splits.size >= 10, `the lit side ends at ${splits.size} different columns down the tree`);
  // Its top under the quiet sky: nothing above row 28.
  for (let y = 0; y < 28; y++) for (let x = 0; x < WIDTH; x++) assert.equal(spruce[y * WIDTH + x], TRANSPARENT);
  assert.ok(day);
});

test('the tub: a low upright cylinder, its cover an ellipse (round ends, lit sage on its upper left, forest along its back rim), its body lit left to dark right over a base that bows lower in the middle and steps in at its ends; its two steps stand on its deck', () => {
  const r = renderPic([['@', 'near'], ['T', 'tub_covered', 40, 40, 0]], { width: WIDTH, height: HEIGHT, stamps: art.stamps }).layers[3];
  const at = (x, y) => r[(40 + y) * WIDTH + 40 + x];
  const span = (y) => {
    const xs = [];
    for (let x = -13; x <= 13; x++) if (at(x, y) !== TRANSPARENT) xs.push(x);
    return xs.length ? [Math.min(...xs), Math.max(...xs)] : null;
  };
  // The cover: its top row is its back rim, forest, and much narrower than
  // its widest row (an ellipse, not a box with square corners).
  let top = -25;
  while (!span(top)) top++;
  const [t0, t1] = span(top);
  assert.ok(t1 - t0 + 1 <= 20, `its top row ${t1 - t0 + 1} wide: rounded`);
  for (let x = t0; x <= t1; x++) assert.equal(at(x, top), 12, `the back rim at ${x}`);
  assert.equal(span(top + 2)[1] - span(top + 2)[0] + 1, 25, 'the ellipse 25 wide at its middle');
  // Sage on its upper left, none on its right half.
  const coverRows = [top + 1, top + 2];
  assert.ok(coverRows.some((y) => at(-8, y) === 14), 'lit sage on the upper left');
  assert.ok(!coverRows.some((y) => [6, 8, 10].some((x) => at(x, y) === 14)), 'no light on its right');
  // The body: the left lit (sage), then moss, forest and spruce to the right.
  assert.deepEqual([-11, -4, 5, 10].map((x) => at(x, -8)), [14, 13, 12, 11]);
  // The base: a dark line, lower in the middle than at its ends, its ends stepped in.
  const base = (x) => {
    for (let y = -3; y > -20; y--) if (at(x, y) === 0) return y;
    return null;
  };
  assert.ok(base(0) > base(-11) && base(-11) > base(-12) && base(0) > base(11) && base(11) > base(12), `the base bows: ${[-12, -11, 0, 11, 12].map(base).join()}`);
  // The steps: bark with lit (brick) treads, standing on the low deck.
  assert.deepEqual([at(-15, -7), at(-15, -6), at(-15, -4), at(-15, -3)], [9, 10, 10, 3]);
});

test('the shed reads as a place: a flat bark door with a brick Z-brace and seams, no ink; the clam shovel pale against it; the right maple clear of its roof line', () => {
  const door = art.stamps.cabin_shed;
  const r = renderPic([['@', 'mid'], ['T', 'cabin_shed', 80, 100, 0]], { width: WIDTH, height: HEIGHT, stamps: art.stamps }).layers[2];
  for (let y = 100 - 16; y <= 100 - 2; y++) for (let x = 80 - 8; x <= 80 + 6; x++) assert.ok([9, 10].includes(r[y * WIDTH + x]), `the door at ${x - 80},${y - 100}: bark and brick only`);
  assert.ok(door.length > 0);
  // The clam shovel (the art director's third round): a pale handle and
  // D-grip (paper cream) with a bark shade, an ink edge only where it lies
  // across the bark door, a slate blade with a glacier glint.
  const shovel = new Set(art.stamps.clam_shovel.filter((op) => op[0] === 'C').map((op) => op[1]));
  assert.deepEqual([...shovel].sort((a, b) => a - b), [0, 2, 3, 5, 10], 'cream handle, bark shade, ink edge, slate blade, glacier glint');
  const day = render(composeCabin({ art, cabin, hour: 'day' })).layers[3];
  const [sx, sy, sw, sh] = cabin.places.clam_shovel.art;
  const shedOnly = renderPic(ART.pics[cabin.plate].ops.filter((op) => !(op[0] === 'T' && op[1] === 'clam_shovel')), { width: WIDTH, height: HEIGHT, stamps: art.stamps });
  let cream = 0;
  for (let y = sy; y < sy + sh; y++) {
    for (let x = sx; x < sx + sw; x++) {
      const v = day[y * WIDTH + x];
      if (v === 5) cream++;
      if (v === 0) assert.equal(shedOnly.layers[2][y * WIDTH + x], 10, `the shovel's ink at ${x},${y} lies on the bark door`);
    }
  }
  assert.ok(cream >= 12, `${cream} pixels of pale handle`);
  // The right maple never reaches the shed's roof line: the mid layer above the roof is the same with and without it.
  const plate = ART.pics[cabin.plate].ops;
  const withMaple = renderPic(plate, { width: WIDTH, height: HEIGHT, stamps: art.stamps }).layers[2];
  const right = plate.findIndex((op) => op[0] === 'T' && op[1] === 'bigleaf_maple_summer' && op[4] === 1);
  assert.ok(right >= 0, 'the right maple, flipped');
  const without = renderPic(plate.filter((_, i) => i !== right), { width: WIDTH, height: HEIGHT, stamps: art.stamps }).layers[2];
  const shed = cabin.places.shed.art;
  const apex = [shed[0] + Math.floor(shed[2] / 2), shed[1]];
  for (let x = apex[0] - 12; x <= apex[0] + 8; x++) {
    const roof = apex[1] + Math.round(Math.abs(x - apex[0]) * 1.6);
    for (let y = roof - 4; y < roof; y++) assert.equal(withMaple[y * WIDTH + x], without[y * WIDTH + x], `the right maple at ${x},${y}, on the shed's roof line`);
  }
});

test('the guest book reads on the porch table at every hour: pale pages, an ink spine and lower edge, a bark cover edge', () => {
  const colors = new Set(art.stamps.cabin_guestbook_open.filter((op) => op[0] === 'C').map((op) => op[1]));
  assert.ok(colors.has(0) && colors.has(4) && colors.has(10), [...colors].join());
  const at = composeCabin({ art, cabin }).anchors.guestbook;
  for (const hour of ['day', 'dusk', 'night']) {
    const c = composeCabin({ art, cabin, hour, state: 'first' });
    const sl = slotsOf(c);
    const spine = sl[(at[1] - 1) * WIDTH + at[0]];
    const page = sl[(at[1] - 1) * WIDTH + at[0] - 1];
    const edge = sl[at[1] * WIDTH + at[0]];
    assert.equal(spine, 0, `${hour}: the ink spine`);
    assert.equal(edge, 0, `${hour}: the ink lower edge`);
    assert.notEqual(page, 0, `${hour}: a page`);
    // It stands off the lit pane behind it: the pane's lamp light is no page color.
    assert.notEqual(page, 5, `${hour}: the page is not the lamp light`);
  }
});

// The art director's third round (S7 track A, revision 3).

test('the roofline: a steep, nearly A-frame gable (the rakes about 44 degrees on the phone, 40 on the SE; the eaves about 1.6 times as wide as the apex stands over the deck), the mast, the stovepipe, the truss and the arched window raised with the apex, the roof against the knoll\'s teal and the spruce still over the right rake', () => {
  const c = composeCabin({ art, cabin, hour: 'day' });
  const r = render(c);
  const [far, mid, near] = [r.layers[1], r.layers[2], r.layers[3]];
  const apex = c.anchors.apex;
  assert.deepEqual(apex, [80, 76]);
  // The slate edge runs straight from the apex to each eave tip, (17, 182)
  // and (143, 182) (its first rows, where the fascia's lines converge on
  // it, aside).
  for (const tip of [17, 143]) {
    for (let y = apex[1] + 6; y <= 182; y++) {
      const x = Math.round(apex[0] + ((tip - apex[0]) * (y - apex[1])) / (182 - apex[1]));
      assert.ok([x - 1, x, x + 1].some((xx) => near[y * WIDTH + xx] === 2), `the rake's slate edge at row ${y}, near ${x}`);
    }
  }
  const run = apex[0] - 17;
  const rise = 182 - apex[1];
  const deg = (sx, sy) => (Math.atan2(rise * sy, run * sx) * 180) / Math.PI;
  assert.ok(deg(7, 4) >= 43 && deg(7, 4) <= 46, `the rakes at ${deg(7, 4).toFixed(1)} degrees on the 17 (7x4)`);
  assert.ok(deg(4, 2) >= 39, `and ${deg(4, 2).toFixed(1)} on the SE (4x2)`);
  const ratio = ((143 - 17) * 7) / ((212 - apex[1]) * 4);
  assert.ok(ratio >= 1.45 && ratio <= 1.65, `eave to eave ${ratio.toFixed(2)} times the apex's height over the deck`);
  // The mast and its dome over the apex, the dome near row 68.
  for (let y = apex[1] - 7; y < apex[1]; y++) assert.equal(near[y * WIDTH + apex[0]], 0, `the mast at row ${y}`);
  assert.ok([66, 67, 68, 69].some((y) => near[y * WIDTH + apex[0]] === 4), 'its dome near row 68');
  // The stovepipe: from just under at_pipe down to where it meets the left rake, ink.
  const [px, py] = c.anchors.pipe;
  assert.ok(px < apex[0] - 8 && py < apex[1] + 8, `at_pipe ${px},${py} just below the ridge on the left slope`);
  const meet = Math.round(apex[1] + ((apex[0] - px) * rise) / run);
  for (let y = py + 1; y < meet - 1; y++) assert.equal(near[y * WIDTH + px], 0, `the pipe at row ${y}`);
  // The tie beam a quarter of the way down, bark across the inner rakes.
  const beam = [];
  for (let y = apex[1] + 10; y < apex[1] + 30; y++) if (Array.from({ length: 17 }, (_, i) => near[y * WIDTH + 72 + i]).every((v) => v === 10)) beam.push(y);
  assert.ok(beam.length >= 1 && beam[0] - apex[1] >= 16 && beam[0] - apex[1] <= 24, `the tie beam at rows ${beam.join()}`);
  assert.ok(c.anchors.win_gable[1] <= 118, 'the arched window lifted with the gable');
  // Above the old foothills' top (row 88), the roof stands on the knoll's teal or its treetops, never on the peak's rock.
  for (let x = 66; x <= 94; x++) {
    let y = 0;
    while (y < HEIGHT && near[y * WIDTH + x] === TRANSPARENT) y++;
    if (y >= 88) continue;
    const behind = far[(y - 1) * WIDTH + x];
    assert.ok(near[(y - 1) * WIDTH + x] !== TRANSPARENT || [12, 15].includes(behind) || x === apex[0] || Math.abs(x - apex[0]) <= 1, `the roof at ${x},${y} stands on ${behind}`);
  }
  // The spruce still shows above the right rake.
  let spruce = 0;
  for (let p = 0; p < mid.length; p++) {
    const x = p % WIDTH;
    const y = Math.floor(p / WIDTH);
    if (x > apex[0] && [11, 12].includes(mid[p]) && near[p] === TRANSPARENT && y < apex[1] + ((x - apex[0]) * rise) / (143 - apex[0])) spruce++;
  }
  assert.ok(spruce > 1200, `${spruce} pixels of the spruce over the right rake`);
});

test('the board-and-batten gable keeps two colors at every hour (bark goes to ink at dusk and dawn, so the battens stay a step below the boards)', () => {
  for (const [hour, evening] of HOURS) {
    const c = composeCabin({ art, cabin, hour, evening });
    const sl = slotsOf(c);
    const raw = composite(render(c));
    const day = render(composeCabin({ art, cabin, hour: 'day' })).layers[3];
    const tie = c.anchors.apex[1] + 20;
    for (let y = tie + 6; y <= 168; y += 3) {
      const wall = [];
      for (let x = 20; x <= 70; x++) {
        const p = y * WIDTH + x;
        if ([9, 10].includes(day[p]) && !CYCLES[raw[p]]?.light) wall.push(sl[p]);
      }
      if (wall.length < 6) continue;
      assert.ok(new Set(wall).size >= 2, `${c.key}: row ${y} of the gable is one flat color (${[...new Set(wall)]})`);
    }
    // The art director's own row: 165, columns 36 to 71.
    const row = Array.from({ length: 36 }, (_, i) => sl[165 * WIDTH + 36 + i]);
    assert.ok(new Set(row).size >= 2, `${c.key}: row 165 shows ${new Set(row).size} color`);
  }
  // At dusk (and dawn) the boards are bark and the battens ink, as at blue hour.
  const t = PAL.remaps[cabin.tables.dusk];
  assert.deepEqual([t[9], t[10]], [10, 0]);
});

test('the night\'s warm light lands: the four porch chairs stand in ink against the lit panes, the tie beam and the king post catch the arched window\'s light, the loft\'s rail crosses the casements\' foot with the lily\'s pane clear above it, the door\'s knob is never green', () => {
  const night = composeCabin({ art, cabin, hour: 'night' });
  const raw = composite(render(night));
  const chairs = ART.pics[cabin.plate].ops.filter((op) => op[0] === 'T' && op[1] === 'adirondack_chair');
  assert.equal(chairs.length, 4);
  for (const [, , cx, cy] of chairs) {
    assert.ok((cx - 4 >= 40 && cx + 4 <= 68) || (cx - 4 >= 92 && cx + 4 <= 120), `the chair at ${cx} stands in front of a window bank`);
    let ink = 0;
    for (let y = cy - 9; y <= cy - 4; y++) {
      for (let x = cx - 4; x <= cx + 4; x++) {
        const p = y * WIDTH + x;
        if (raw[p] !== 0) continue;
        if ([p - 1, p + 1, p - WIDTH].some((q) => raw[q] === 24 || raw[q] === 28)) ink++;
      }
    }
    assert.ok(ink >= 8, `the chair at ${cx}: ${ink} ink pixels against the warm glass`);
    // its slats: lamp light between them
    const gaps = [cx - 1, cx + 1].filter((x) => [24, 28].includes(raw[(cy - 6) * WIDTH + x])).length;
    assert.equal(gaps, 2, `the chair at ${cx}: light between its slats`);
  }
  // The truss: the tie beam's underside and the king post's foot in spill.
  const [ax, ay] = night.anchors.apex;
  const tie = ay + 20;
  const under = Array.from({ length: 17 }, (_, i) => raw[(tie + 1) * WIDTH + 72 + i]).filter((v) => v === 28).length;
  assert.ok(under >= 12, `${under} pixels of light under the tie beam`);
  assert.equal(raw[(tie - 1) * WIDTH + ax], 28, 'the king post\'s foot catches the light');
  // The loft's rail: an ink top rail across both casements, balusters under
  // it, lamp light between them; the lily's pane above it lamp-lit, clear.
  const [gx, gy] = night.anchors.win_gable;
  const rail = gy + 30;
  for (const x of [73, 74, 75, 76, 77, 78, 79, 81, 82, 83, 84, 85, 86, 87]) assert.equal(raw[rail * WIDTH + x], 0, `the rail at ${x}`);
  const below = Array.from({ length: 15 }, (_, i) => raw[(rail + 2) * WIDTH + 73 + i]);
  assert.ok(below.filter((v) => v === 0).length >= 4 && below.filter((v) => v === 24).length >= 8, `balusters over the lamp light: ${below.join()}`);
  const lily = night.anchors.lily_sketch;
  assert.ok(lily[1] < rail - 2 && lily[0] < gx, 'at_lily_sketch in the lower left pane, above the rail');
  for (let y = lily[1] - 2; y <= lily[1] + 2; y++) assert.equal(raw[y * WIDTH + lily[0]], 24, `the lily's pane is clear at ${lily[0]},${y}`);
  // The knob: ink on the lit screen at every lit hour, never a green speck.
  const door = night.anchors.door;
  const knob = [];
  const dayNear = render(composeCabin({ art, cabin, hour: 'day' })).layers[3];
  for (let y = door[1]; y < door[1] + 32; y++) for (let x = door[0]; x < door[0] + 15; x++) if (dayNear[y * WIDTH + x] === 5) knob.push(y * WIDTH + x);
  assert.equal(knob.length, 1, 'one knob');
  for (const [hour, evening] of [['dusk', true], ['blue', true], ['blue', false], ['night', true]]) {
    const c = composeCabin({ art, cabin, hour, evening });
    assert.equal(slotsOf(c)[knob[0]], 0, `${c.key}: the knob`);
  }
});

test('the gibbous moons are lopsided: the whole round limb lit, the terminator flat', () => {
  const at = plateAnchors(ART.pics[cabin.plate].ops)[cabin.moon.at];
  const rows = (n) => {
    const out = {};
    for (const [x, y] of layerPixels(composeCabin({ art, cabin, hour: 'night', moon: n }), 'sky', [24])) (out[y - at[1]] ||= []).push(x - at[0]);
    return out;
  };
  const full = rows(4);
  for (const [n, side] of [[3, 'left'], [5, 'right']]) {
    const g = rows(n);
    const flat = [];
    for (let y = -4; y <= 3; y++) flat.push(side === 'left' ? Math.min(...g[y]) : Math.max(...g[y]));
    assert.equal(new Set(flat).size, 1, `moon ${n}: its terminator one straight column through its middle eight rows (${flat})`);
    for (let y = -5; y <= 4; y++) {
      const limb = side === 'left' ? Math.max : Math.min;
      assert.equal(limb(...g[y]), limb(...full[y]), `moon ${n}: its lit limb at row ${y} is the full moon's`);
    }
    assert.notDeepEqual(Object.values(g).map((xs) => xs.length), Object.values(full).map((xs) => xs.length - 2), `moon ${n}: not a smaller full moon`);
  }
});

test('the bigleaf maple: a few big overlapping domes of leaves (sage tops, moss bodies) over a shaded canopy, only a few small holes of sky, the mossy limbs showing under it', () => {
  const ops = art.stamps.bigleaf_maple_summer;
  const masses = ops.filter((op) => op[0] === 'T' && String(op[1]).startsWith('maple_clump_') && op[1] !== 'maple_clump_deep');
  // behind them, the canopy's shaded depths, laid first
  const deep = ops.findIndex((op) => op[0] === 'T' && op[1] === 'maple_clump_deep');
  assert.ok(deep >= 0 && deep < ops.indexOf(masses[0]), 'the shaded depths behind the lit masses');
  assert.deepEqual([...new Set(art.stamps.maple_clump_deep.filter((op) => op[0] === 'C').map((op) => op[1]))], [12], 'the depths in forest shade');
  assert.ok(masses.length >= 5 && masses.length <= 8, `${masses.length} masses`);
  const width = (id) => {
    const xs = [];
    for (const op of art.stamps[id]) if (op[0] === 'L') for (let i = 0; i < op[1].length; i += 2) xs.push(op[1][i]);
    return Math.max(...xs) - Math.min(...xs) + 1;
  };
  assert.ok(masses.filter((op) => width(op[1]) >= 30).length >= 3, 'at least three great masses, 30 columns or more');
  for (const id of new Set(masses.map((op) => op[1]))) {
    const colors = new Set(art.stamps[id].filter((op) => op[0] === 'C').map((op) => op[1]));
    assert.deepEqual([...colors].sort((a, b) => a - b), [12, 13, 14], `${id}: forest edge and shade, moss body, sage dome`);
  }
  // The canopy alone: its holes (sky enclosed by leaves) few and small.
  const L = renderPic([['@', 'mid'], ['T', 'bigleaf_maple_summer', 80, 300, 0]], { width: WIDTH, height: HEIGHT, stamps: art.stamps }).layers[2];
  const leaf = (p) => [12, 13, 14].includes(L[p]);
  let top = HEIGHT;
  let bottom = 0;
  for (let p = 0; p < L.length; p++) if (leaf(p)) (top = Math.min(top, Math.floor(p / WIDTH))), (bottom = Math.max(bottom, Math.floor(p / WIDTH)));
  const seen = new Uint8Array(L.length);
  const holes = [];
  let area = 0;
  for (let p = top * WIDTH; p <= bottom * WIDTH; p++) {
    if (L[p] !== TRANSPARENT || seen[p]) continue;
    const stack = [p];
    let n = 0;
    let open = false;
    seen[p] = 1;
    while (stack.length) {
      const q = stack.pop();
      n++;
      const x = q % WIDTH;
      const y = Math.floor(q / WIDTH);
      if (x === 0 || x === WIDTH - 1 || y <= top || y >= bottom) open = true;
      for (const nq of [q - 1, q + 1, q - WIDTH, q + WIDTH]) {
        // a gap a limb closes is the open space under the canopy, not a hole in it
        if (nq >= 0 && nq < L.length && (L[nq] === 10 || L[nq] === 0)) open = true;
        if (nq < 0 || nq >= L.length || seen[nq] || L[nq] !== TRANSPARENT) continue;
        if (Math.abs((nq % WIDTH) - x) > 1) continue;
        seen[nq] = 1;
        stack.push(nq);
      }
    }
    if (!open) holes.push(n);
  }
  for (let p = top * WIDTH; p <= bottom * WIDTH; p++) if (leaf(p)) area++;
  assert.ok(holes.length >= 1 && holes.length <= 8, `${holes.length} holes of sky in the canopy`);
  assert.ok(holes.every((n) => n <= 30), `each small: ${holes.join()}`);
  assert.ok(holes.reduce((a, b) => a + b, 0) <= area * 0.03, 'a few small holes, not a jigsaw');
  // The limbs, mossy, still show under the canopy, with a licorice fern or more.
  const bark = [];
  for (let p = 0; p < L.length; p++) if (L[p] === 10) bark.push(p);
  assert.ok(bark.length > 300, `${bark.length} pixels of limb and trunk`);
});
