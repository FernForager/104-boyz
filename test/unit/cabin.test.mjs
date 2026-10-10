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
import { composeCabin, cabinAlt, cabinLights, cabinStarPoints, plateAnchors, CABIN_HOURS, SKIES, STATES, STAR, WIDTH, HEIGHT, MOON_CLEAR } from '../../web/js/gfx/cabin.js';
import { renderPic, composite, TRANSPARENT } from '../../web/js/gfx/picvm.js';
import { buildTimeline, frameAt } from '../../web/js/gfx/drawin.js';
import { CYCLES, REMAPS } from '../../web/js/gfx/palette.js';
import { loadArt, loadCabin } from '../../tools/pics.mjs';
import { cabinScenes, cabinHashes, cabinGoldenBody, CABIN_GOLDEN_PATH, CABIN_MOON } from '../../tools/render-pics.mjs';
import { cabinStamps, compileArt, withoutNotes } from '../../tools/build.mjs';
import { lintPictures } from '../../tools/lint.mjs';

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
  assert.equal(scenes.length, 6 * 5 * 3 + 6, 'six hours (two blue hours) x five skies (fog over the dry two) x three states, and six more moons');
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
    const pts = cabinStarPoints(hour, cabin.stars, floor, plateAnchors(ART.pics[cabin.plate].ops)[cabin.moon.at]);
    const [lo, hi] = cabin.stars.count[hour];
    assert.ok(pts.length >= lo && pts.length <= hi, `${hour}: ${pts.length} stars`);
    const all = [...pts, ...cabin.stars.dipper];
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) assert.ok(Math.abs(all[i][0] - all[j][0]) > 1 || Math.abs(all[i][1] - all[j][1]) > 1, `${hour}: stars ${all[i]} and ${all[j]} touch`);
    }
    for (const [x, y] of pts) assert.ok(x >= 0 && x < WIDTH && y >= 0 && y < floor, `${hour}: ${x},${y} above the floor`);
    if (hour === 'night') {
      const high = pts.filter(([, y]) => y < floor / 2).length;
      assert.ok(high > pts.length - high, `more stars high (${high}) than low (${pts.length - high})`);
    }
    assert.deepEqual(pts, cabinStarPoints(hour, cabin.stars, floor, plateAnchors(ART.pics[cabin.plate].ops)[cabin.moon.at]), 'the same sky every visit');
  }
  // The Dipper is always the same seven, right of the spruce's tip.
  const night = composeCabin({ art, cabin, hour: 'night' });
  const sky = layerPixels(night, 'sky', [STAR]);
  for (const [x, y] of cabin.stars.dipper) assert.ok(sky.some(([a, b]) => a === x && b === y), `the Dipper's star at ${x},${y}`);
  assert.equal(night.stars + 7, sky.length, 'the stars and the Dipper, each one pixel');
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
  for (let n = 1; n <= 7; n++) {
    const c = composeCabin({ art, cabin, hour: 'night', moon: n });
    const lit = layerPixels(c, 'sky', [24]);
    assert.ok(lit.length > 0 && lit.every(([x, y]) => Math.abs(x - at[0]) <= 3 && Math.abs(y - at[1]) <= 3), `moon ${n}: its lamp light on the disc`);
    const stars = layerPixels(c, 'sky', [STAR]);
    assert.ok(stars.every(([x, y]) => Math.abs(x - at[0]) > MOON_CLEAR || Math.abs(y - at[1]) > MOON_CLEAR), `moon ${n}: no star on its disc`);
  }
  // Waxing lights the right, waning the left; full is round.
  const disc = (n) => layerPixels(composeCabin({ art, cabin, hour: 'night', moon: n }), 'sky', [24]).map(([x]) => x - at[0]);
  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  assert.ok(mean(disc(1)) > 1 && mean(disc(2)) > 0, 'a waxing moon is lit on the right');
  assert.ok(mean(disc(7)) < -1 && mean(disc(6)) < 0, 'a waning moon is lit on the left');
  assert.ok(Math.abs(mean(disc(4))) < 0.5 && disc(4).length > disc(3).length && disc(3).length > disc(2).length && disc(2).length > disc(1).length);
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

test('the weather: each sky its stamp on the sky layer; the cloud cap under cloud and rain; the rain, puddles and chains only in rain; the fog on the far and mid layers', () => {
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
      assert.equal(tOn(c, 'far').includes('cabin_cloud_cap'), sky !== 'clear');
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

test('the states: first launch lights the lockbox and opens the guest book; an update raises the mailbox flag; each at its anchor, last but the weather', () => {
  for (const state of [[], ['first'], ['flag_up'], ['first', 'flag_up']]) {
    const c = composeCabin({ art, cabin, hour: 'day', sky: 'rain', state });
    const ts = c.ops.filter((op) => op[0] === 'T').map((op) => op[1]);
    for (const s of STATES) for (const o of cabin.states[s]) assert.equal(ts.includes(o.stamp), state.includes(s), `${c.key}: ${o.stamp}`);
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
    for (const table of Object.values(REMAPS)) assert.ok(table.every((to, from) => to !== 7 || from === 7));
  }
  assert.ok(!CYCLES[28].slots.includes(7) && !CYCLES[29].slots.includes(7) && !CYCLES[20].slots.includes(7), 'spill, smoke and fire never pass through gold');
});

test("every stamp the cabin's data names exists, and every cabin picture lints clean", () => {
  const ids = cabinStamps(cabin);
  assert.equal(ids.length, 28, 'three skies, six weather stamps, seven lights, the embers, the smoke, three states and seven moons');
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

test('the hour resolves with its table: dawn borrows dusk\'s (11.4)', () => {
  for (const hour of CABIN_HOURS) assert.equal(composeCabin({ art, cabin, hour }).table, hour === 'dawn' ? 'dusk' : hour);
  assert.deepEqual(cabin.tables, { day: 'day', dawn: 'dusk', dusk: 'dusk', blue: 'blue', night: 'night' });
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
  assert.deepEqual(home.cabin, withoutNotes(Object.fromEntries(Object.entries(cabin).filter(([k]) => k !== 'next'))));
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
