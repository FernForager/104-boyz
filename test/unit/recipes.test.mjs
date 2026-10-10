// The composer's recipes and their lints (BUILD_PLAN 4.5, 4.6, S5):
// content/art/recipes.json against its schema (J01), P13 (the recipes
// resolve), P14 (every drawable place composes and lints at every hour)
// and G05 (every M1a place has a recipe). Each is clean on the real tree
// and fires on a planted fault.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, KINDS, loadPicSources, loadRecipes, loadArt } from '../../tools/pics.mjs';
import { parsePic } from '../../web/js/gfx/picvm.js';
import { lintRecipes, lintCompositions, skylineMelts, MELT_RUN, FAINT, contrast, anchorsOf, RULES, activeCodes } from '../../tools/lint.mjs';
import { lintGraph, readPark } from '../../tools/graphlint.mjs';
import { compileArt, recipeStamps } from '../../tools/build.mjs';
import { validate } from '../../tools/schema.mjs';

const SOURCES = loadPicSources();
const INFO = loadRecipes();
const codes = (issues) => [...new Set(issues.map((i) => i.code))].sort();
/** The recipes, changed by f. */
const plantRecipes = (f) => {
  const recipes = structuredClone(INFO.recipes);
  f(recipes);
  return { recipes, src: JSON.stringify(recipes, null, 1), errors: [] };
};
/** A source list (the real one, or another) with one picture's text replaced (or a new one added). */
const plantSource = (id, kind, text, from = SOURCES) => {
  const size = KINDS[kind] || { width: 0, height: 0 };
  const s = { id, kind, rel: `${kind}/${id}.pic`, path: '', text, parsed: parsePic(text), width: size.width, height: size.height };
  return [...from.filter((x) => x.id !== id), s];
};

test('the real recipes are clean: the schema (J01), P13, P14 and G05; every M1a node has a place, in the scope\'s order', () => {
  assert.deepEqual(INFO.errors, []);
  assert.deepEqual(lintRecipes(INFO, SOURCES), []);
  assert.deepEqual(lintCompositions(INFO, SOURCES), []);
  assert.deepEqual(lintGraph(ROOT).filter((i) => i.code === 'G05'), []);
  const scope = JSON.parse(readFileSync(join(ROOT, 'content', 'scope', 'm1a.json'), 'utf8')).park.nodes;
  assert.deepEqual(Object.keys(INFO.recipes.places), scope);
  for (const code of ['P13', 'P14', 'G05']) assert.ok(activeCodes().includes(code), `${code} is active`);
  assert.deepEqual(RULES.find((r) => r.code === 'G05').status, 'active');
  // BUILD_PLAN 4.5's bases, as the spec maps them.
  const base = (id) => INFO.recipes.places[id].base || INFO.recipes.places[id].scene;
  assert.equal(base('deer_lake'), 'lake_basin');
  assert.equal(base('potholes'), 'meadow');
  assert.equal(base('high_divide'), 'crest');
  assert.equal(base('seven_lakes_basin'), 'seven_lakes_basin_rim');
  assert.equal(base('sol_duc_trailhead'), 'trailhead');
  assert.equal(base('hoh_lake_trail_junction'), 'montane', 'down in the Hoh rain forest at 1,013 ft, not on the crest');
  assert.deepEqual(Object.entries(INFO.recipes.bases).filter(([, b]) => b.drawn).map(([id]) => id), ['lake_basin', 'meadow']);
  for (const [id, b] of Object.entries(INFO.recipes.bases)) if (!b.drawn) assert.match(b.lands, /^S\d+[a-z]?$/, `${id} lands in a session`);
});

test('J01: the recipes file against schemas/recipes.schema.json', () => {
  const bad = structuredClone(INFO.recipes);
  bad.places.deer_lake.horizon = 9;
  bad.places.deer_lake.colour = 'blue';
  bad.bases.meadow.props[0].layer = 'far';
  const schema = JSON.parse(readFileSync(join(ROOT, 'schemas', 'recipes.schema.json'), 'utf8'));
  const info = { recipes: bad, src: JSON.stringify(bad, null, 1), errors: validate(schema, bad).errors };
  assert.ok(info.errors.length >= 3, JSON.stringify(info.errors));
  assert.deepEqual(codes(lintRecipes(info, SOURCES)), ['J01']);
  assert.deepEqual(lintCompositions(info, SOURCES), [], 'a file that fails its schema is not composed');
  assert.deepEqual(validate(schema, { ...INFO.recipes, places: { x: { base: 'a', scene: 'b' } } }).errors.length > 0, true, 'a base or a scene, not both');
});

test('loadRecipes: missing is null with no errors; unparsable is null with one', () => {
  assert.deepEqual(loadRecipes(join(ROOT, 'content', 'art', 'nope.json')), { recipes: null, src: '', errors: [] });
  const r = loadRecipes(join(ROOT, 'content', 'art', 'palette.json'));
  assert.ok(r.recipes, 'palette.json parses');
  assert.ok(r.errors.length > 0, '...but it is no recipes file');
});

test('P13: a missing stamp, a flipped landmark, a base without trail_spot, a base on the far layer, a short skyline, an unknown slot, a bad stand-in', () => {
  const missing = plantRecipes((r) => {
    r.places.deer_lake.stamps.push({ id: 'canoe', at: [80, 110], layer: 'mid' });
  });
  assert.deepEqual(codes(lintRecipes(missing, SOURCES)), ['P13']);
  assert.match(lintRecipes(missing, SOURCES)[0].msg, /place deer_lake: no stamp "canoe"/);
  const slotStamp = plantRecipes((r) => {
    r.bases.lake_basin.props[0].stamps.push('nope');
  });
  assert.match(lintRecipes(slotStamp, SOURCES)[0].msg, /slot far_ring: no stamp "nope"/);
  const flipped = plantRecipes((r) => {
    r.places.high_divide.flip = true;
  });
  assert.match(lintRecipes(flipped, SOURCES)[0].msg, /high_divide stands the landmark olympus_from_divide, so it must pin flip: false/);
  const unpinned = plantRecipes((r) => {
    delete r.places.deer_lake.flip;
  });
  assert.deepEqual(codes(lintRecipes(unpinned, SOURCES)), ['P13'], 'a landmark place must pin it, not leave it to the seed');
  const base = SOURCES.find((s) => s.id === 'base_lake_basin');
  const noSpot = plantSource('base_lake_basin', 'bases', base.text.replace(/^Z at_trail_spot .*$/m, ''));
  const a = lintRecipes(INFO, noSpot);
  assert.deepEqual(codes(a), ['P13']);
  assert.match(a[0].msg, /base lake_basin \(base_lake_basin\) has no anchor at_trail_spot/);
  const far = plantSource('base_lake_basin', 'bases', `${base.text}\n@ far\nC 2 L 0,60 10,60\n`);
  assert.ok(lintRecipes(INFO, far).some((i) => /draws on the far layer/.test(i.msg)));
  const order = plantSource('base_lake_basin', 'bases', `${base.text}\n@ mid\nC 2 L 0,130 10,130\n`);
  assert.ok(lintRecipes(INFO, order).some((i) => /once each, in the order sky, mid, near/.test(i.msg)));
  const short = plantSource('skyline_deer_lake_ridge', 'stamps', 'C 15 L 0,-20 160,-20 160,2 0,2 0,-20\nC 15 F 80,-10\n');
  const s = lintRecipes(INFO, short);
  assert.ok(s.some((i) => /the skyline deer_lake_ridge reaches row .* it must reach 8 rows below the base's highest mid row/.test(i.msg)), JSON.stringify(s));
  const slot = plantRecipes((r) => {
    r.places.deer_lake.props.no_such_slot = { count: [1, 1] };
  });
  assert.match(lintRecipes(slot, SOURCES)[0].msg, /its base has no prop slot "no_such_slot"/);
  const standIn = plantRecipes((r) => {
    r.bases.crest.stand_in = 'tundra';
  });
  assert.match(lintRecipes(standIn, SOURCES)[0].msg, /base crest: its stand-in "tundra" is no base/);
  const box = plantRecipes((r) => {
    r.bases.meadow.props[0].box = [150, 98, 20, 6];
  });
  assert.match(lintRecipes(box, SOURCES)[0].msg, /off the 160x168 canvas/);
  const sprite = plantRecipes((r) => {
    r.sprites.push('ranger_wave');
  });
  assert.match(lintRecipes(sprite, SOURCES)[0].msg, /sprite "ranger_wave" is no stamp/);
  // A scene without its anchors.
  const rim = SOURCES.find((x) => x.id === 'seven_lakes_basin_rim');
  const noFloor = plantSource('seven_lakes_basin_rim', 'scenes', rim.text.replace(/^Z at_star_floor .*$/m, ''));
  assert.ok(lintRecipes(INFO, noFloor).some((i) => /scene seven_lakes_basin_rim has no anchor at_star_floor/.test(i.msg)));
  assert.deepEqual(anchorsOf(rim.parsed.ops), { star_floor: [0, 36], trail_spot: [42, 158], sign: [126, 140] });
});

test('P14: a planted open outline (a leaking stamp) and gold in a composed place fail it, at every hour', () => {
  const leaky = plantSource('leaky_rock', 'stamps', 'C 2 L -3,0 0,-4 3,0\nC 2 F 0,-6\n');
  const info = plantRecipes((r) => {
    r.places.deer_lake.stamps.push({ id: 'leaky_rock', at: [80, 130], layer: 'near' });
  });
  const issues = lintCompositions(info, leaky);
  assert.deepEqual(codes(issues), ['P14']);
  assert.equal(issues.length, 4, 'once an hour');
  assert.match(issues[0].msg, /place deer_lake at day \(from lake_basin\): P09/);
  const gold = plantSource('gold_rock', 'stamps', 'C 7 L -1,0 1,0\n');
  const golden = plantRecipes((r) => {
    r.places.potholes.stamps = [{ id: 'gold_rock', at: [80, 130], layer: 'near' }];
  });
  assert.ok(lintCompositions(golden, gold).some((i) => /place potholes at night .*P07/.test(i.msg)));
  const broken = plantRecipes((r) => {
    r.places.deer_lake.far = ['deer_lake_ridge', 'nowhere'];
  });
  assert.deepEqual(lintCompositions(broken, SOURCES), [], 'an unknown skyline is P13\'s, and composes without it');
});

/** The Deer Lake ridge without the outcrops on its summits, which stand in the horizon's light. */
const ridgeWithoutKnobs = (text) => text.replace(/^# The outcrops at the two summits[\s\S]*?(?=^# 2\. The haze at its foot)/m, '');
/** The Deer Lake ridge without its own band of the horizon's light, which it draws last. */
const ridgeWithoutBand = (text) => text.replace(/^# 3\. The horizon's light[\s\S]*$/m, '');
/** The lake base's sky as S5 first drew it: glacier blue down to the far trees, without the thin band of horizon light it draws now over its trees. */
const baseWithoutLight = (text) => text.replace(/^D 3 4 checker {4}F 80,67 80,66\nC 4 {14}F 80,80 80,68 80,101$/m, 'C 3              F 80,67 80,66 80,80 80,68 80,101');
/** The sources with the Deer Lake ridge (its text by f) standing as S5 first drew it, its crest straight on the base's glacier-blue sky. */
const ridgeWithoutLight = (f = (/** @type {string} */ t) => t) => {
  const ridge = SOURCES.find((x) => x.id === 'skyline_deer_lake_ridge');
  const base = SOURCES.find((x) => x.id === 'base_lake_basin');
  return plantSource('base_lake_basin', 'bases', baseWithoutLight(base.text), plantSource('skyline_deer_lake_ridge', 'stamps', f(ridgeWithoutBand(ridgeWithoutKnobs(ridge.text)))));
};

test("P14: a skyline that melts into its sky fails it, at the hours it melts: S5's first Deer Lake ridge, teal under glacier blue, both slate at dusk and blue hour", () => {
  const ridge = SOURCES.find((x) => x.id === 'skyline_deer_lake_ridge');
  const base = SOURCES.find((x) => x.id === 'base_lake_basin');
  assert.match(ridge.text, /^C 2 {2}L -1,-12 /m, 'the ridge is slate now');
  assert.notEqual(ridgeWithoutKnobs(ridge.text), ridge.text, 'with its outcrops');
  assert.notEqual(ridgeWithoutBand(ridge.text), ridge.text, "and its own band of the horizon's light");
  assert.notEqual(baseWithoutLight(base.text), base.text, "and the base's sky a thin band of it");
  const teal = (/** @type {string} */ t) => t.replace(/^C 2 {2}L -1,-12 /m, 'C 15  L -1,-12 ').replace(/^C 2 {2}F 80,0$/m, 'C 15  F 80,0');
  assert.notEqual(teal(ridge.text), ridge.text);
  const issues = lintCompositions(INFO, ridgeWithoutLight(teal));
  const melts = issues.filter((i) => /deer_lake .*its skyline melts into the sky/.test(i.msg));
  // S6's re-tune keeps blue hour's glacier blue on slate, as at dusk (its sky stays lighter than night's), so teal melts at both, as in S5.
  assert.deepEqual([...new Set(melts.map((i) => /at (\w+) \(/.exec(i.msg)[1]))], ['dusk', 'blue'], 'by day and at night it stands');
  assert.match(melts[0].msg, /for \d+ columns \(x \d+ to \d+\): slot 15 against 3, the same slot at this hour/);
  assert.ok(Number(/for (\d+) columns/.exec(melts[0].msg)[1]) >= 40, 'the crest between its outcrops');
});

test("P14: a skyline that melts into the light it carries fails it: S5's teal ridge planted in today's Deer Lake stamp, its band kept, goes slate on the band's slate at night", () => {
  const ridge = SOURCES.find((x) => x.id === 'skyline_deer_lake_ridge');
  assert.match(ridge.text, /^# 3\. The horizon's light/m, 'the stamp draws its own band behind its crest');
  const teal = ridge.text.replace(/^C 2 {2}L -1,-12 /m, 'C 15  L -1,-12 ').replace(/^C 2 {2}F 80,0$/m, 'C 15  F 80,0');
  assert.notEqual(teal, ridge.text);
  const issues = lintCompositions(INFO, plantSource('skyline_deer_lake_ridge', 'stamps', teal)).filter((i) => /place deer_lake /.test(i.msg));
  assert.deepEqual([...new Set(issues.map((i) => /at (\w+) \(/.exec(i.msg)[1]))], ['night'], 'by day, at dusk and at blue hour the band (snow, pink, glacier blue) stands off the teal');
  assert.match(issues[0].msg, /its skyline melts into its own light for \d+ columns \(x \d+ to \d+\): slot 15 against 4, the same slot at this hour/);
  assert.ok(Number(/for (\d+) columns/.exec(issues[0].msg)[1]) >= 40, 'the crest between its outcrops');
  assert.deepEqual(lintCompositions(INFO, SOURCES), [], "today's slate ridge stands in its light at every hour");
});

test("skylineMelts: under a skyline's own light (a band whose top is a dithered seam), the crest against the band; a far layer with no seam has no light to check", () => {
  const W = 12;
  const H = 7;
  const T = 255;
  /** Rows 0-1 sky (glacier blue), rows 2-3 a checker seam of snow and glacier blue, row 4 the band's snow, rows 5-6 the ridge. */
  const pic = (ridge, seam = true) => ({
    width: W,
    height: H,
    layers: [
      Uint8Array.from({ length: W * H }, (_, i) => (i < 2 * W ? 3 : T)),
      Uint8Array.from({ length: W * H }, (_, i) => {
        const x = i % W;
        const y = Math.floor(i / W);
        if (y < 2) return T;
        if (y < 4) return seam && (x + y) % 2 ? 3 : 4;
        return y < 5 ? 4 : ridge;
      }),
      new Uint8Array(W * H).fill(T),
      new Uint8Array(W * H).fill(T),
    ],
  });
  for (const hour of ['day', 'dusk', 'blue', 'night']) assert.deepEqual(skylineMelts(pic(2), hour), [], `slate in its light, ${hour}`);
  assert.deepEqual(skylineMelts(pic(15), 'night'), [{ into: 'its own light', xs: [...Array(W).keys()], slots: [15, 4] }], "teal on the band's slate at night");
  // Re-pinned in S6: palette A's forest against its slate, 1.06 (decision 68; option B's were 1.09).
  assert.deepEqual(skylineMelts(pic(13), 'night'), [{ into: 'its own light', xs: [...Array(W).keys()], slots: [13, 4], faint: '1.06' }], "moss's forest on the band's slate at night: apart in slot, too faint in value, as against the sky");
  assert.deepEqual(skylineMelts(pic(15, false), 'night'), [], 'a solid top is the skyline itself, against the sky alone');
});

test('skylineMelts: a run of MELT_RUN columns sharing a slot at the hour is a melt; a dithered seam is not; a light (a star) is no band', () => {
  const W = 12;
  const T = 255;
  /** A 12x4 picture: row 0 sky (from sky(x)), rows 1-3 far (ridge), the mid and near layers empty. */
  const pic = (sky, ridge = 15) => ({
    width: W,
    height: 4,
    layers: [
      Uint8Array.from({ length: W * 4 }, (_, i) => (i < W ? sky(i) : 3)),
      Uint8Array.from({ length: W * 4 }, (_, i) => (i < W ? T : ridge)),
      new Uint8Array(W * 4).fill(T),
      new Uint8Array(W * 4).fill(T),
    ],
  });
  assert.deepEqual(skylineMelts(pic(() => 3), 'day'), [], 'teal under glacier blue by day: apart');
  const dusk = skylineMelts(pic(() => 3), 'dusk');
  assert.deepEqual(dusk, [{ into: 'the sky', xs: [...Array(W).keys()], slots: [15, 3] }], 'both slate at dusk');
  assert.deepEqual(skylineMelts(pic((x) => (x % 2 ? 3 : 4)), 'dusk'), [], 'a checker of glacier blue and snow: the pink shows the edge');
  assert.deepEqual(skylineMelts(pic((x) => (x < MELT_RUN - 1 ? 3 : 4)), 'dusk'), [], `${MELT_RUN - 1} columns is a seam`);
  assert.equal(skylineMelts(pic((x) => (x < MELT_RUN ? 3 : 4)), 'dusk').length, 1, `${MELT_RUN} is a melt`);
  assert.deepEqual(skylineMelts(pic(() => 22), 'night'), [], 'the stars are a light');
  assert.deepEqual(skylineMelts(pic(() => 3, 2), 'dusk'), [], "slate's navy against glacier blue's slate");
});

test('skylineMelts: against the sky, slots apart but too close in value for MELT_RUN columns are faint; the band in front is held to its slot alone', () => {
  const W = 12;
  const T = 255;
  const pic = (sky, ridge) => ({
    width: W,
    height: 4,
    layers: [
      Uint8Array.from({ length: W * 4 }, (_, i) => (i < W ? sky(i) : 3)),
      Uint8Array.from({ length: W * 4 }, (_, i) => (i < W ? T : ridge)),
      new Uint8Array(W * 4).fill(T),
      new Uint8Array(W * 4).fill(T),
    ],
  });
  assert.equal(FAINT, 1.5);
  // Re-pinned in S6: palette A's darks sit closer (decision 68; option B's were 1.28 and 1.81).
  assert.equal(contrast(0, 1).toFixed(2), '1.25', 'ink and night navy');
  assert.equal(contrast(1, 2).toFixed(2), '1.63', 'night navy and slate');
  assert.equal(contrast(4, 4), 1);
  // A slate ridge under a glacier-blue sky: apart by day, at dusk and at blue hour (ink against slate); at night ink against navy.
  for (const hour of ['day', 'dusk', 'blue']) assert.deepEqual(skylineMelts(pic(() => 3, 2), hour), [], hour);
  assert.deepEqual(skylineMelts(pic(() => 3, 2), 'night'), [{ into: 'the sky', xs: [...Array(W).keys()], slots: [2, 3], faint: '1.25' }], 'faint at night');
  // The same ridge under the horizon's light (snow by day, slate at night) stands at every hour.
  for (const hour of ['day', 'dusk', 'blue', 'night']) assert.deepEqual(skylineMelts(pic(() => 4, 2), hour), [], `under the light, ${hour}`);
  // A short faint run is no melt; a dither whose other color stands apart shows the edge.
  assert.deepEqual(skylineMelts(pic((x) => (x < MELT_RUN - 1 ? 3 : 4), 2), 'night'), []);
  assert.deepEqual(skylineMelts(pic((x) => (x % 2 ? 3 : 4), 2), 'night'), []);
  // A same-slot melt is a melt, not faint, and is reported once.
  assert.deepEqual(skylineMelts(pic(() => 3, 15), 'dusk'), [{ into: 'the sky', xs: [...Array(W).keys()], slots: [15, 3] }]);
  // A seam whose columns are each lost, one way or the other, is one run: a slate ridge under the day skies' slate and glacier-blue checker at night, ink on ink, then ink on navy.
  assert.deepEqual(skylineMelts(pic((x) => (x % 2 ? 3 : 2), 2), 'night'), [{ into: 'the sky', xs: [...Array(W).keys()], slots: [2, 2], faint: '1.25', same: W / 2 }]);
  assert.deepEqual(skylineMelts(pic((x) => (x < MELT_RUN - 1 ? 3 : 2), 2), 'night').map((m) => m.xs.length), [W], 'faint, then the same slot: one run');
  assert.deepEqual(skylineMelts(pic((x) => (x % 2 ? 4 : 2), 2), 'night'), [], "a seam whose other color is truly apart (the snow's slate) shows the edge");
});

test("P14: S5's second Deer Lake ridge, slate under glacier blue with no horizon light, is too faint against its sky at night", () => {
  const issues = lintCompositions(INFO, ridgeWithoutLight());
  const faint = issues.filter((i) => /deer_lake .*its skyline is too faint against the sky/.test(i.msg));
  // Re-pinned in S6: palette A's ink and navy are 1.25 apart (option B's 1.28); at blue hour the ridge is ink against the slate sky, and stands.
  assert.deepEqual([...new Set(faint.map((i) => /at (\w+) \(/.exec(i.msg)[1]))], ['night'], 'by day, at dusk and at blue hour it stands; at night it is ink against navy');
  assert.match(faint[0].msg, /slot 2 against 3, a contrast of 1\.25 at this hour, under 1\.5 \(doc 11\.1: value, not just hue\)/);
  assert.ok(!issues.some((i) => /deer_lake .*melts into the sky/.test(i.msg)), 'apart in slot at every hour');
});

test('G05: a scope node without a recipe, a recipe with neither base nor scene, an undrawn scene without its stand-in or session', () => {
  const base = readPark(ROOT);
  const plant = (f) => {
    const recipes = { src: base.recipes.src, data: structuredClone(base.recipes.data) };
    f(recipes.data);
    return lintGraph(ROOT, { ...base, recipes });
  };
  const a = plant((d) => {
    delete d.places.deer_lake;
  });
  assert.deepEqual(codes(a), ['G05']);
  assert.match(a[0].msg, /deer_lake has no picture recipe/);
  const b = plant((d) => {
    d.places.deer_lake = { far: [] };
  });
  assert.match(b[0].msg, /place deer_lake names neither a base nor a scene/);
  const c = plant((d) => {
    delete d.places.sol_duc_falls.stand_in;
    delete d.places.sol_duc_falls.lands;
  });
  assert.equal(c.length, 2);
  assert.ok(c.every((i) => i.code === 'G05'));
  const d = plant((x) => {
    x.places.deer_lake.base = 'tundra';
  });
  assert.match(d[0].msg, /no base "tundra"/);
  assert.deepEqual(plant((x) => {
    x.places.elwha_somewhere = { base: 'lake_basin' };
  }), [], 'a place outside the scope is allowed');
  assert.deepEqual(codes(lintGraph(ROOT, { ...base, recipes: null })), ['G05'], 'no recipes file at all');
  assert.deepEqual(lintGraph(ROOT, { ...base, scenes: { src: '', data: [] } }).map((i) => i.msg), ['place seven_lakes_basin: the scene seven_lakes_basin_rim isn\'t drawn yet, so it names a base in stand_in', 'place seven_lakes_basin: the scene seven_lakes_basin_rim isn\'t drawn yet, so it names the session it lands in (lands)']);
});

test('the art by channel: main keeps the cover and its five firs; preview adds the bases, the scene, the stamps they reach and the recipes', () => {
  const main = compileArt({ screens: ['app', 'debug', 'title'] });
  assert.deepEqual(Object.keys(main.pics), ['cover_high_divide_dusk']);
  assert.deepEqual(Object.keys(main.stamps), ['subalpine_fir_l', 'subalpine_fir_m', 'subalpine_fir_s', 'subalpine_fir_xl', 'subalpine_fir_xs']);
  assert.equal(main.recipes, undefined);
  const preview = compileArt({ screens: ['app', 'debug', 'guestbook', 'map', 'title', 'trail'] });
  assert.deepEqual(Object.keys(preview.pics), ['base_lake_basin', 'base_meadow', 'cover_high_divide_dusk', 'seven_lakes_basin_rim']);
  assert.deepEqual(preview.recipes, loadArt().recipes);
  for (const id of recipeStamps(preview.recipes)) assert.ok(preview.stamps[id], `${id} ships`);
  for (const id of ['hiker_idle', 'skyline_deer_lake_ridge', 'skyline_olympus_from_divide', 'signpost', 'krummholz_b', 'subalpine_fir_xs']) assert.ok(preview.stamps[id], id);
  assert.ok(!preview.stamps.talus_patch, 'a stamp nothing reaches stays home');
  assert.deepEqual(Object.keys(preview.stamps), Object.keys(preview.stamps).sort());
  // The palette tables are the same on both.
  assert.deepEqual(main.palette, preview.palette);
  assert.deepEqual(Object.keys(main.palette.remaps), ['day', 'dusk', 'blue', 'night']);
});
