// The stores' shelves (BUILD_PLAN 11.3, S4; GAME_DESIGN 5.2, 5.3, 5.7):
// content/stores/stores.json against 5.7, shelf by shelf, and the catalogs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { origins } from '../../tools/ingest/catalogs.mjs';
import { readSchemas } from '../../tools/content.mjs';
import { validate } from '../../tools/schema.mjs';

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const stores = read('content/stores/stores.json');
const gear = read('design/data/gear_catalog.json');
const food = read('design/data/food_catalog.json');
const scope = read('content/scope/m1a.json');
const shelf = (store, id) => stores.stores[store].shelves.find((s) => s.id === id);
const ids = (store, id) => shelf(store, id).items.map((e) => (e.tiers ? `${e.id}[${e.tiers.join(',')}]` : e.id));

test('the file validates, and every shelf id and tier exists (IG17)', () => {
  assert.deepEqual(validate(readSchemas(ROOT)['stores.schema.json'], stores).errors, []);
  const o = origins({ gear, food, stores, scope });
  assert.deepEqual(o.entries, []);
  const planted = structuredClone(stores);
  planted.stores.general.shelves[0].items.push({ id: 'jetpack' }, { id: 'tent_3p_dome', tiers: ['premium'] }, { id: 'daypack_20' });
  const bad = origins({ gear, food, stores: planted, scope }).entries;
  assert.ok(bad.some((e) => e.level === 'error' && /"jetpack" is no item/.test(e.msg)));
  assert.ok(bad.some((e) => e.level === 'error' && /tent_3p_dome has no premium tier/.test(e.msg)));
  assert.ok(bad.some((e) => e.level === 'warn' && /daypack_20 is also on general's packs shelf/.test(e.msg)));
});

test("the general store's shelves, as 5.7 lists them", () => {
  const g = stores.stores.general;
  assert.deepEqual(g.shelves.map((s) => s.id), ['packs', 'shelter', 'sleep', 'clothes', 'rain', 'feet', 'kitchen', 'water', 'tackle_tools', 'light_nav', 'sundries', 'fun', 'food']);
  assert.deepEqual(ids('general', 'packs'), ['external_frame_70', 'daypack_20', 'weekender_50']);
  assert.deepEqual(ids('general', 'shelter'), ['tent_2p_dome[cheap]', 'tent_3p_dome', 'tube_tent_plastic', 'space_blanket', 'tent_footprint', 'tarp_canvas']);
  assert.deepEqual(ids('general', 'rain'), ['rain_jacket[cheap]', 'rain_pants[cheap]', 'poncho[standard,cheap]', 'pack_liner_compactor', 'zip_bags_gallon']);
  assert.deepEqual(ids('general', 'kitchen').slice(0, 4), ['stove_canister[cheap]', 'fuel_canister_110', 'fuel_canister_230', 'fuel_canister_450'], 'the three fuel canisters');
  assert.ok(ids('general', 'light_nav').includes('map_park_brochure') && !ids('general', 'light_nav').includes('map_topo_park'), '5.7: only the brochure at the general store (Q1)');
  assert.ok(ids('general', 'fun').includes('melodica') && ids('general', 'fun').includes('camp_chair_ultralight[cheap]'));
  const blanket = shelf('general', 'clothes').items.find((e) => e.id === 'blanket_wool');
  assert.equal(blanket.switch, 'wool_blanket', 'the wool blanket waits for its switch (M1b, S37)');
  assert.equal(scope.switches.wool_blanket.on, false);
  assert.deepEqual(shelf('general', 'food').foods, { sold_at: 'grocery', minus: ['beer_hazy_ipa_16oz'], plus: ['smoked_salmon'] });
  assert.ok(g.deferred.shellfish_license, 'the shellfish license waits for clams (call 12)');
  assert.deepEqual([g.placeholder, g.kind, g.look], ['STORE_GENERAL', 'bombproof', { outline: 2, outline_slot: 10 }]);
});

test('the cooler holds the beer only, overnight, with its ID check and switch', () => {
  assert.deepEqual(stores.stores.general.cooler, { items: ['beer_hazy_ipa_16oz'], overnight_only: true, id_check: true, switch: 'beer_cooler' });
  assert.equal(scope.switches.beer_cooler.on, true);
});

test("the gear shop's shelves, as 5.7 lists them", () => {
  const s = stores.stores.gear;
  assert.deepEqual(s.shelves.map((x) => x.id), ['packs', 'shelter', 'sleep', 'clothes', 'rain', 'feet', 'kitchen', 'water', 'nav_power', 'safety_repair', 'snow_glacier', 'food_storage', 'camp', 'toys', 'food']);
  assert.deepEqual(ids('gear', 'packs'), ['daypack_28', 'fastpack_35', 'weekender_50', 'ultralight_55', 'trekker_65', 'expedition_80']);
  assert.deepEqual(ids('gear', 'water'), ['filter_squeeze', 'filter_pump', 'filter_gravity', 'purifier_uv', 'tablets_chlorine_dioxide', 'drops_chlorine_dioxide', 'bladder_2l'], 'the three filters, both chlorine dioxide options');
  assert.ok(['repair_kit_basic', 'pad_patch_kit', 'repair_tape', 'pole_splint'].every((id) => ids('gear', 'safety_repair').includes(id)), 'the four repair kits');
  assert.ok(ids('gear', 'snow_glacier').includes('crampons_steel') && ids('gear', 'snow_glacier').includes('crampons_aluminum'), 'both crampons');
  assert.deepEqual(ids('gear', 'food_storage').slice(0, 3), ['canister_standard[standard,premium]', 'canister_small', 'canister_classic'], 'the three canisters and the carbon tier');
  for (const id of gear.items.filter((i) => i.tags.includes('fuel')).map((i) => i.id)) assert.ok(ids('gear', 'kitchen').includes(id), `every fuel: ${id}`);
  assert.ok(['map_topo_park', 'compass_baseplate'].every((id) => ids('gear', 'nav_power').includes(id)) && ids('gear', 'camp').includes('trowel'), 'the free map, compass and trowel (call 2, Q1)');
  assert.deepEqual(shelf('gear', 'food').foods, { sold_at: 'outfitter' });
  assert.deepEqual(s.rentals, { items: 'stats.rent_usd_per_day', glacier_sets_summer_weekend: [2, 3] });
  assert.deepEqual([s.placeholder, s.kind, s.scale, s.look], ['STORE_GEAR', 'light', true, { outline: 1, outline_slot: 0 }]);
});

test('the desk, the later stores and the jobs; the scope opens two stores and the drive-in', () => {
  assert.deepEqual(stores.desk, { loans: ['canister_wic_loaner'], issues: ['permit_wilderness'] });
  assert.deepEqual(stores.stores.boutique, { placeholder: 'STORE_BOUTIQUE', from: 'M1b' });
  assert.deepEqual(stores.stores.second_growth, { from: 'M1b', items: ['pre_roll'] });
  assert.deepEqual(Object.keys(stores.jobs), ['drive_in', 'gastropub', 'bookstore']);
  assert.deepEqual(scope.stores.open, ['general', 'gear']);
  assert.deepEqual(scope.jobs.open, ['drive_in']);
  // Placeholders are names, never lines: no braces.
  for (const s of [...Object.values(stores.stores), ...Object.values(stores.jobs)]) if (s.placeholder) assert.match(s.placeholder, /^[A-Z_]+$/);
});
