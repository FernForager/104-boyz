// The scene composer v0 (BUILD_PLAN 4.4, 4.5, S5; GAME_DESIGN 11.7):
// web/js/gfx/compose.js builds a place's picture from content/art/
// recipes.json into one op list for the picture VM. Pure and stable (the
// golden pins Deer Lake, the High Divide and the rim at every hour), its
// layering rules hold, its variants are seeded and never change, its stars
// come only at blue hour and night, and no place is ever gold.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compose, drawable, resolvePlace, splitLayers, propOps, mirror, starPoints, HOURS, STAR, STAR_COUNTS, HORIZON, REQUIRED_ANCHORS, TRAIL_SPRITES, WIDTH, HEIGHT } from '../../web/js/gfx/compose.js';
import { renderPic, composite, LAYERS, TRANSPARENT } from '../../web/js/gfx/picvm.js';
import { buildTimeline, frameAt } from '../../web/js/gfx/drawin.js';
import { loadArt } from '../../tools/pics.mjs';
import { composeHashes, goldenBody, GOLDEN_PATH, GOLDEN_PLACES } from '../../tools/render-pics.mjs';

const ART = loadArt();
const art = { pics: ART.pics, stamps: ART.stamps, recipes: ART.recipes };
const R = art.recipes;
const render = (c, record = false) => renderPic(c.ops, { width: c.width, height: c.height, stamps: art.stamps, record });
const drawables = () => Object.keys(R.places).filter((p) => drawable(p, art));

/** The ops in each layer, in order, across the list's sections. */
function byLayer(ops) {
  const out = Object.fromEntries(LAYERS.map((l) => [l, []]));
  let at = 'sky';
  ops.forEach((op, i) => {
    if (op[0] === '@') at = op[1];
    else out[at].push({ op, i });
  });
  return out;
}

test('compose is pure and stable: the same place and hour give the same ops, and the golden pins three places at every hour', () => {
  for (const id of GOLDEN_PLACES) {
    for (const hour of HOURS) {
      const a = compose(id, art, { hour, sprites: TRAIL_SPRITES });
      const b = compose(id, JSON.parse(JSON.stringify(art)), { hour, sprites: TRAIL_SPRITES });
      assert.deepEqual(a, b, `${id} at ${hour}, and from the bundle as the phone gets it`);
      assert.equal(a.key, `${id}@${hour}`);
      assert.deepEqual([a.width, a.height], [WIDTH, HEIGHT]);
    }
  }
  const golden = JSON.parse(readFileSync(GOLDEN_PATH, 'utf8'));
  assert.deepEqual(golden.places, composeHashes(ART), 'test/golden/art/compose.json (rewrite on purpose: node tools/render-pics.mjs --update)');
  assert.equal(readFileSync(GOLDEN_PATH, 'utf8'), goldenBody(golden.places));
  assert.deepEqual(Object.keys(golden.places), ['deer_lake', 'high_divide', 'seven_lakes_basin']);
  for (const id of GOLDEN_PLACES) assert.deepEqual(Object.keys(golden.places[id]), [...HOURS]);
  assert.throws(() => compose('deer_lake', art, { hour: 'noon' }), /no hour "noon"/);
  assert.throws(() => compose('sol_duc_trailhead', art), /no picture for "sol_duc_trailhead"/);
});

test('drawable: Deer Lake, the rim and the High Divide (through the crest\'s stand-in, the meadow); not the trailhead, whose base waits for S15a', () => {
  assert.equal(drawable('deer_lake', art), true);
  assert.equal(drawable('seven_lakes_basin', art), true);
  assert.equal(drawable('high_divide', art), true);
  assert.equal(drawable('sol_duc_trailhead', art), false);
  assert.equal(drawable('sol_duc_falls', art), false, 'its scene waits for S18, and its stand-in (montane) for S15a');
  assert.equal(drawable('heart_lake', art), true, 'the lake basin stands in until S23 draws Heart Lake');
  assert.equal(drawable('nowhere', art), false);
  assert.equal(drawable('deer_lake', { ...art, recipes: undefined }), false, 'no recipes, no pictures');
  assert.equal(resolvePlace('high_divide', art).base.id, 'meadow');
  assert.equal(resolvePlace('seven_lakes_basin', art).scene, 'seven_lakes_basin_rim');
  assert.equal(compose('high_divide', art).from, 'meadow');
});

test('layering: no base op on the far layer; within a layer the base comes first and stamps after; the hiker is the last near op; stars are last on the sky', () => {
  for (const id of drawables()) {
    for (const hour of HOURS) {
      const c = compose(id, art, { hour, sprites: TRAIL_SPRITES });
      const L = byLayer(c.ops);
      if (!resolvePlace(id, art).scene) {
        assert.ok(L.far.every(({ op }) => op[0] === 'T'), `${id}: only skylines on the far layer`);
        for (const layer of ['mid', 'near']) {
          const first = L[layer].findIndex(({ op }) => op[0] === 'T');
          if (first >= 0) assert.ok(L[layer].slice(first).every(({ op }) => op[0] === 'T'), `${id} ${layer}: no base op after a stamp`);
        }
      }
      const last = L.near[L.near.length - 1].op;
      assert.deepEqual([last[0], last[1]], ['T', 'hiker_idle'], `${id} at ${hour}: the hiker last`);
      assert.equal(c.ops.filter((op) => op[0] === 'T' && op[1] === 'hiker_idle').length, 1);
      if (c.stars) {
        const sky = L.sky.slice(-c.stars);
        assert.ok(sky.every(({ op }) => op[0] === 'L' && op[1].length === 2), `${id}: the stars are the sky's last ops, a pixel each`);
        assert.ok(sky[0].i > L.near[L.near.length - 1].i, 'after everything else');
      }
      assert.ok(!c.ops.some((op) => op[0] === 'Z' && String(op[1]).startsWith('at_')), 'anchors are not drawn');
      assert.ok(!c.hotspots.some((h) => h.id.startsWith('at_')), 'and Look never sees them');
    }
  }
  // The skyline sits on the horizon line, at its left end.
  const dl = compose('deer_lake', art, { sprites: TRAIL_SPRITES });
  assert.deepEqual(byLayer(dl.ops).far.map(({ op }) => op), [['T', 'skyline_deer_lake_ridge', 0, R.bases.lake_basin.far_y + 0, 0]]);
  assert.deepEqual(dl.anchors.trail_spot, [36, 150]);
  const hiker = dl.ops.find((op) => op[0] === 'T' && op[1] === 'hiker_idle');
  assert.deepEqual(hiker, ['T', 'hiker_idle', 36, 150, 0], 'the hiker stands at the trail spot, facing right, toward the water');
  // Re-pinned in S6 (S5's was the base's three, lake, far_shore and shore): the stamps carry their own
  // hotspots now (track C), so the ridge, the privy and the hiker join them, in op order.
  assert.deepEqual(dl.hotspots.map((h) => h.id), ['ridge', 'privy', 'lake', 'far_shore', 'shore', 'hiker']);
  // A left-facing sprite flips.
  const left = compose('deer_lake', art, { sprites: [['hiker', 'idle', 'trail_spot', 'left']] });
  assert.equal(left.ops.find((op) => op[0] === 'T' && op[1] === 'hiker_idle')[4], 1);
  // An anchor the picture lacks places nothing.
  assert.ok(!compose('deer_lake', art, { sprites: [['hiker', 'idle', 'nowhere']] }).ops.some((op) => op[1] === 'hiker_idle'));
  // Every base and scene declares its anchors.
  for (const [id, b] of Object.entries(R.bases)) {
    if (!b.drawn) continue;
    const names = art.pics[b.pic].ops.filter((op) => op[0] === 'Z' && op[1].startsWith('at_')).map((op) => op[1].slice(3));
    for (const n of REQUIRED_ANCHORS.bases) assert.ok(names.includes(n), `${id}: at_${n}`);
  }
});

test('variants: an unpinned place gets a seeded flip and a horizon in [-6, 6] that never change; a landmark never flips; a flip mirrors the hotspots exactly', () => {
  const unpinned = drawables().filter((p) => typeof R.places[p].flip !== 'boolean' && R.places[p].base);
  assert.ok(unpinned.length >= 10, 'most composed places are unpinned');
  const flips = new Set();
  for (const id of unpinned) {
    const a = compose(id, art);
    const b = compose(id, art, { hour: 'night' });
    assert.equal(a.flip, b.flip, `${id}: the same flip at every hour`);
    assert.equal(a.horizon, b.horizon);
    assert.ok(Number.isInteger(a.horizon) && Math.abs(a.horizon) <= HORIZON, `${id}: horizon ${a.horizon}`);
    flips.add(a.flip);
  }
  assert.deepEqual([...flips].sort(), [false, true], 'the seed flips some places and not others');
  for (const [id, p] of Object.entries(R.places)) {
    if ((p.far || []).some((f) => R.skylines[f].landmark)) {
      assert.equal(p.flip, false, `${id} pins flip: false`);
      if (drawable(id, art)) assert.equal(compose(id, art).flip, false);
    }
  }
  // The pinned places keep their pins.
  assert.deepEqual([compose('deer_lake', art).flip, compose('deer_lake', art).horizon], [false, 0]);
  // A flipped place's hotspots are its base's, mirrored.
  const flipped = unpinned.find((id) => compose(id, art).flip && resolvePlace(id, art).base.id === 'lake_basin');
  assert.ok(flipped, 'some lake flips');
  const base = art.pics[R.bases.lake_basin.pic].ops.filter((op) => op[0] === 'Z' && !op[1].startsWith('at_'));
  const want = base.map(([, id, x, y, w, h]) => ({ id, x: WIDTH - x - w, y, w, h }));
  const c = compose(flipped, art);
  assert.deepEqual(c.hotspots, want);
  assert.deepEqual(render(c).hotspots, want, 'and the picture VM agrees');
  assert.deepEqual(c.anchors.trail_spot, [WIDTH - 1 - 36, 150]);
  // mirror() itself: points, stamps and hotspots.
  assert.deepEqual(mirror([['L', [0, 5, 10, 6]], ['T', 'x', 3, 4, 0], ['Z', 'a', 10, 1, 4, 2], ['C', 3]]), [['L', [159, 5, 149, 6]], ['T', 'x', 156, 4, 1], ['Z', 'a', 146, 1, 4, 2], ['C', 3]]);
});

test('props: a slot\'s count is seeded in its range, its stamps from its list, spaced, inside its box, back to front; an override wins', () => {
  const slot = R.bases.lake_basin.props.find((s) => s.id === 'far_ring');
  for (const place of ['round_lake', 'lunch_lake', 'clear_lake']) {
    const ops = propOps(place, slot, null);
    assert.deepEqual(propOps(place, slot, null), ops, 'stable');
    assert.ok(ops.length >= slot.count[0] - 2 && ops.length <= slot.count[1], `${place}: ${ops.length} props (spacing may skip a few)`);
    const [bx, by, bw, bh] = slot.box;
    for (const [t, id, x, y] of ops) {
      assert.equal(t, 'T');
      assert.ok(slot.stamps.includes(id));
      assert.ok(x >= bx && x < bx + bw && y >= by && y < by + bh);
    }
    for (let i = 1; i < ops.length; i++) assert.ok(ops[i][3] >= ops[i - 1][3], 'back to front');
    for (let i = 0; i < ops.length; i++) for (let j = 0; j < i; j++) assert.ok(Math.abs(ops[i][2] - ops[j][2]) >= slot.spacing, 'spaced');
  }
  const fixed = propOps('deer_lake', R.bases.lake_basin.props.find((s) => s.id === 'frame_left'), { stamps: ['mountain_hemlock_l'] });
  assert.deepEqual(fixed.map((op) => op[1]), ['mountain_hemlock_l']);
  assert.equal(propOps('deer_lake', slot, { count: [14, 14] }).length <= 14, true);
  assert.notDeepEqual(propOps('round_lake', slot, null), propOps('lunch_lake', slot, null), 'each place its own');
});

test('stars: none by day or at dusk; 36 to 44 at night and 6 to 9 at blue hour, all color 22, on the sky layer, above the star floor, never two touching', () => {
  for (const id of drawables()) {
    const floor = compose(id, art).anchors.star_floor[1];
    for (const hour of HOURS) {
      const c = compose(id, art, { hour, sprites: TRAIL_SPRITES });
      const pts = starPoints(id, hour, floor);
      assert.equal(c.stars, pts.length);
      const range = STAR_COUNTS[hour];
      if (!range) assert.equal(c.stars, 0, `${id}: no stars at ${hour}`);
      else assert.ok(c.stars >= range[0] && c.stars <= range[1], `${id} at ${hour}: ${c.stars} stars`);
      for (const [x, y] of pts) assert.ok(x >= 0 && x < WIDTH && y >= 0 && y < floor);
      for (let i = 0; i < pts.length; i++) for (let j = 0; j < i; j++) assert.ok(Math.abs(pts[i][0] - pts[j][0]) > 1 || Math.abs(pts[i][1] - pts[j][1]) > 1, 'never adjacent');
      const sky = render(c).layers[LAYERS.indexOf('sky')];
      assert.equal(sky.filter((v) => v === STAR).length, c.stars, 'each star a pixel of 22 on the sky layer');
      for (const L of render(c).layers.slice(1)) assert.ok(!L.includes(STAR), 'and nowhere else');
    }
  }
  // Blue hour's stars are night's first ones: the sky fills in.
  const floor = compose('deer_lake', art).anchors.star_floor[1];
  const blue = starPoints('deer_lake', 'blue', floor);
  assert.deepEqual(starPoints('deer_lake', 'night', floor).slice(0, blue.length), blue);
  assert.deepEqual(STAR_COUNTS, { blue: [6, 9], night: [36, 44] });
});

test('the pictures: Deer Lake shimmers by day; no place is gold at any hour; every pixel is drawn; the draw-in ends on the composite', () => {
  const dl = composite(render(compose('deer_lake', art, { sprites: TRAIL_SPRITES })));
  assert.ok(dl.includes(16), "Deer Lake's glints (the lake cycle) by day");
  assert.ok(composite(render(compose('seven_lakes_basin', art))).includes(16), "and Lunch Lake's");
  for (const id of drawables()) {
    for (const hour of HOURS) {
      const c = compose(id, art, { hour, sprites: TRAIL_SPRITES });
      const r = render(c, true);
      const buf = composite(r);
      assert.ok(!buf.includes(7) && !buf.includes(19), `${id} at ${hour}: no bonfire gold`);
      assert.equal(buf.indexOf(TRANSPARENT), -1, `${id} at ${hour}: no pixel left undrawn`);
      assert.deepEqual(frameAt(buildTimeline(r), 1), buf, `${id} at ${hour}: the draw-in's last frame is the picture`);
    }
  }
});

test('splitLayers: a base\'s ops by layer, ops before any @ on the sky', () => {
  assert.deepEqual(splitLayers([['C', 1], ['@', 'mid'], ['L', [0, 0]], ['@', 'near'], ['F', [1, 1]]]), [[['C', 1]], [], [['L', [0, 0]]], [['F', [1, 1]]]]);
});
