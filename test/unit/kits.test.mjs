// The ranger's checklist, the two pack presets and the test kits (BUILD_PLAN
// 2.6, 3.5, S4; GAME_DESIGN 6.1, 6.8, B.2, B.5): content/rules/kits.json
// against the catalog.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { versions, meets, tierKey } from '../../tools/ingest/catalogs.mjs';
import { readSchemas } from '../../tools/content.mjs';
import { validate } from '../../tools/schema.mjs';

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const kits = read('content/rules/kits.json');
const gear = read('design/data/gear_catalog.json');
const vs = new Map(versions(gear).map((v) => [v.key, v]));
const ref = (r) => {
  const [id, tier] = r.split(':');
  return vs.get(tierKey(id, tier || 'standard'));
};
const TEN = ['navigation', 'headlamp', 'sun', 'first_aid', 'knife', 'fire', 'shelter', 'extra_food', 'extra_water', 'extra_clothes'];

test('the file validates, and its rows are 6.1\'s, in order', () => {
  assert.deepEqual(validate(readSchemas(ROOT)['kits.schema.json'], kits).errors, []);
  assert.deepEqual(kits.checklist.rows, ['shelter', 'sleep', 'rain', 'warmth', 'kitchen', 'water', 'light', 'navigation', 'first_aid', 'extras']);
  assert.deepEqual(Object.keys(kits.checklist.needs), kits.checklist.rows);
  assert.equal(kits.checklist.not_traps, true);
});

test('every id and tier a kit names exists in the catalog', () => {
  for (const [name, k] of Object.entries({ ...kits.presets, ...kits.test_kits })) {
    for (const r of [k.pack, ...(k.worn || []), ...(k.carried || []), ...(k.minus || [])].filter(Boolean)) assert.ok(ref(r), `${name}: ${r}`);
    if (k.pack) assert.equal(ref(k.pack).kind, 'pack', `${name}: its pack is a pack`);
  }
});

test("every tag a need names is in the catalog's glossary, and each fuel names a stove's need", () => {
  const g = gear.tag_glossary;
  const needs = [...Object.values(kits.checklist.needs).flat(), ...kits.checklist.worn, kits.checklist.canister];
  for (const n of needs) for (const t of [...(n.any_tags || []), ...(n.all_tags || []), ...(n.not_tags || [])]) assert.ok(Object.prototype.hasOwnProperty.call(g, t), `${n.id}: ${t}`);
  for (const [need, fuel] of Object.entries(kits.checklist.fuels)) {
    assert.ok(gear.items.some((i) => i.tags.includes(need) && i.tags.includes('stove')), `${need} is a stove's`);
    assert.ok(gear.items.some((i) => i.tags.includes(fuel) && i.tags.includes('fuel')), `${fuel} is a fuel's`);
  }
  for (const n of needs) if (n.ten) assert.ok(TEN.includes(n.ten), n.ten);
  assert.ok(needs.some((n) => n.covers === 'feet'), 'the socks need reads covers: feet');
  for (const id of ['socks_wool_hiking', 'socks_liner', 'socks_waterproof', 'socks_cotton']) assert.deepEqual(gear.items.find((i) => i.id === id).stats.covers, ['feet'], `${id} covers feet (a completeness fix at the source)`);
});

test('the needs read the right things: a trap never meets one, cotton never fills warmth', () => {
  const layer = kits.checklist.needs.warmth[0];
  assert.ok(meets(layer, vs.get('fleece_jacket')));
  assert.ok(!meets(layer, vs.get('hoodie_cotton')), 'the cotton hoodie is a trap and cotton');
  assert.ok(!meets(layer, vs.get('flannel_cotton')), 'the flannel is cotton (the spec\'s call 14)');
  const map = kits.checklist.needs.navigation[0];
  assert.ok(meets(map, vs.get('map_topo_park')) && !meets(map, vs.get('map_park_brochure')));
  const shelter = kits.checklist.needs.shelter[0];
  assert.ok(meets(shelter, vs.get('tarp_canvas')) && !meets(shelter, vs.get('tube_tent_plastic')));
  assert.ok(meets(kits.checklist.canister, vs.get('canister_wic_loaner')) && !meets(kits.checklist.canister, vs.get('bear_sack_soft')));
});

test("the catalog's kits still list what the doc says: the trap kit misses 6 of the ten", () => {
  const sk = gear.pack_guidance.sample_kits_computed;
  for (const name of Object.keys(kits.test_kits)) {
    const k = kits.test_kits[name];
    assert.deepEqual([k.pack, k.nights, k.worn, k.carried], [sk[name].pack, sk[name].nights, sk[name].worn, sk[name].carried], `${name} copies the catalog's lists (no numbers)`);
  }
  const trap = kits.test_kits.olympus_day_gear_one_night_TRAP;
  const filled = new Set([...trap.worn, ...trap.carried].map((r) => ref(r).ten).filter(Boolean));
  const missing = TEN.filter((t) => !filled.has(t) && t !== 'extra_food'); // food is the food catalog's
  assert.deepEqual(missing.sort(), ['fire', 'first_aid', 'headlamp', 'knife', 'navigation', 'shelter'], '6.8: missing 6 of the ten essentials');
  assert.deepEqual(sk.olympus_day_gear_one_night_TRAP.missing_ten_essentials, ['fire', 'first_aid', 'headlamp', 'knife', 'navigation', 'shelter']);
});

test("B.5: the sensible kit is B.2's pack, and the skimpy one is it minus exactly four items", () => {
  const s = kits.presets.b5_sensible;
  const base = kits.test_kits.summer_3_nights_seven_lakes;
  assert.equal(s.from_kit, 'summer_3_nights_seven_lakes');
  assert.deepEqual([s.pack, s.worn], [base.pack, base.worn]);
  const swapped = base.carried.filter((x) => !['sketchbook_pocket', 'pencils_graphite'].includes(x));
  assert.deepEqual(s.carried, [...swapped, 'book_paperback', 'camp_chair_ultralight', 'camera_compact'], 'a paperback for the sketchbook and pencils, plus a camp chair and a small camera');
  assert.deepEqual(s.food, { kcal_per_day: 3000, distinct_dinners: true });
  const k = kits.presets.b5_skimpy;
  assert.equal(k.from, 'b5_sensible');
  assert.deepEqual(k.minus, ['trekking_poles', 'rain_pants', 'map_topo_park', 'puffy_down']);
  for (const m of k.minus) assert.ok(s.carried.includes(m), `${m} is in the sensible kit`);
});

test('the ranger reads one checklist for M1a\'s zones and months', () => {
  assert.deepEqual(kits.ranger.high, { 8: 'checklist', 9: 'checklist' });
  assert.deepEqual(kits.ranger.north_mid, { 8: 'checklist', 9: 'checklist' });
});
