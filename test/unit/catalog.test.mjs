// Basic or nice, and the basics guarantee (BUILD_PLAN 3.5, 11.7, S4;
// GAME_DESIGN 5.7, 5.8, E.4; Lead calls 29, 33): every item, pack, tier and
// food carries its flag at the source; ingest checks the rule's hard edges
// (IG15) and fails a catalog with no free basic for a checklist row, a pack
// or the basic stove's fuel (IG16).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { readInputs } from '../../tools/ingest.mjs';
import { catalogs, origins, guarantee, versions, GEAR_FILE, FOOD_FILE } from '../../tools/ingest/catalogs.mjs';
import { readSchemas } from '../../tools/content.mjs';
import { validate } from '../../tools/schema.mjs';

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const gear = read('design/data/gear_catalog.json');
const food = read('design/data/food_catalog.json');
const items = read(GEAR_FILE);
const foods = read(FOOD_FILE);

/** The generator over the real inputs, with a change to the parsed sources first. */
function run(change) {
  const { ctx } = readInputs(ROOT);
  if (change) change(ctx);
  return catalogs(ctx);
}
/** Unset basic on item-tier keys ("id" or "id:tier"). */
const unset = (ctx, keys) => {
  const g = ctx.sources.gear_catalog;
  for (const k of keys) {
    const [id, tier] = k.split(':');
    const it = [...g.items, ...g.packs].find((x) => x.id === id);
    const v = tier ? it.tiers.find((t) => t.tier === tier) : it;
    v.basic = false;
  }
};
const ig16 = (out) => out.entries.filter((e) => e.code === 'IG16').map((e) => e.msg);

test('every item, pack, tier and food carries basic, at the source', () => {
  for (const p of gear.packs) assert.equal(typeof p.basic, 'boolean', p.id);
  for (const i of gear.items) {
    assert.equal(typeof i.basic, 'boolean', i.id);
    for (const t of i.tiers || []) assert.equal(typeof t.basic, 'boolean', `${i.id}:${t.tier}`);
  }
  for (const f of food.items) assert.equal(typeof f.basic, 'boolean', f.id);
  assert.ok(gear.notes.includes('BASIC OR NICE') && food.notes.includes('BASIC OR NICE'), "the rule is in each catalog's notes");
  assert.equal(gear.items.length, 223, '219 and the general store\'s four new items');
  assert.equal(gear.packs.length, 8);
  assert.equal(gear.items.reduce((a, i) => a + (i.tiers || []).length, 0), 25);
  assert.equal(food.items.length, 89, '88 and smoked salmon');
});

test('the guarantee passes on the real catalogs, and the run has no error', () => {
  const out = run();
  assert.deepEqual(out.entries.filter((e) => e.level === 'error'), []);
  assert.deepEqual(out.entries.filter((e) => e.level === 'warn'), []);
  // Doubt D7: B.2's kit against 5.7's shelves (the harness's kit; S11 or S12 settles what a player can buy).
  assert.equal(out.doubts.length, 1);
  assert.match(out.doubts[0], /^D7\. .*: sun_hat, sunglasses, headlamp, book_paperback\./);
});

test('IG16 fails a catalog with no free basic: the shelter row, the pack, the basic stove\'s fuel', () => {
  assert.deepEqual(ig16(run((ctx) => unset(ctx, ['tent_2p_dome:cheap', 'tarp_canvas']))), ['no free basic for the checklist row "shelter", need "shelter"']);
  assert.deepEqual(ig16(run((ctx) => unset(ctx, ['external_frame_70']))), ['no free basic pack: a sensible first kit needs one (GAME_DESIGN 5.8)']);
  assert.deepEqual(ig16(run((ctx) => unset(ctx, ['fuel_canister_110', 'fuel_canister_230', 'fuel_canister_450']))), ['no free basic for the checklist row "kitchen", need "fuel" (the basic stove stove_canister:cheap needs fuel_canister)']);
  assert.deepEqual(ig16(run((ctx) => unset(ctx, ['boots_leather']))), ['no free basic for the checklist row "worn", need "footwear"']);
  // The desk's can is the canister row's free basic (Lead call 33).
  const noDesk = run((ctx) => {
    ctx.stores = structuredClone(ctx.stores);
    ctx.stores.desk.loans = [];
  });
  assert.ok(ig16(noDesk).includes('no free basic for the checklist row "canister", need "canister"'));
});

test("IG15: the rule's hard edges", () => {
  const e15 = (out) => out.entries.filter((e) => e.code === 'IG15' && e.level === 'error').map((e) => e.msg);
  assert.ok(e15(run((ctx) => unset(ctx, ['tee_cotton']))).some((m) => /tee_cotton is a trap the general store sells/.test(m)));
  assert.ok(e15(run((ctx) => {
    ctx.sources.gear_catalog.items.find((i) => i.id === 'headlamp').basic = true;
  })).some((m) => /headlamp is basic, but its cheap tier is sold/.test(m)));
  assert.ok(e15(run((ctx) => {
    ctx.sources.food_catalog.items.find((f) => f.id === 'beer_hazy_ipa_16oz').basic = true;
  })).some((m) => /beer_hazy_ipa_16oz is basic/.test(m)));
  assert.ok(e15(run((ctx) => {
    delete ctx.sources.gear_catalog.items.find((i) => i.id === 'whistle').basic;
  })).some((m) => /whistle has no basic flag/.test(m)));
  assert.ok(e15(run((ctx) => {
    const m = ctx.sources.gear_catalog.items.find((i) => i.id === 'map_park_brochure');
    m.basic = false;
  })).some((m) => /costs \$0/.test(m)), 'a nice item has a price');
});

test("5.8's own examples: the beer and the freeze-dried dinners are nice; ramen, oatmeal and canned chili basic; every premium tier nice", () => {
  for (const id of ['beer_hazy_ipa_16oz', 'pre_roll', 'fd_chili_mac', 'fd_pad_thai', 'fd_lasagna', 'fd_stroganoff', 'fd_curry_veg', 'smoked_salmon']) assert.equal(foods.foods[id].basic, false, id);
  for (const id of ['ramen_brick', 'ramen_cup', 'oatmeal_packet', 'canned_chili']) assert.equal(foods.foods[id].basic, true, id);
  for (const v of versions(gear)) if (v.tier === 'premium') assert.equal(v.basic, false, v.key);
  for (const id of ['tent_2p_dome', 'stove_canister', 'rain_jacket', 'headlamp']) {
    assert.equal(items.items[id].basic, false, `${id}'s standard tier is nice`);
    assert.equal(items.items[id].tiers.cheap.basic, true, `${id}'s cheap tier is basic`);
  }
  assert.equal(foods.foods.smoked_salmon.calories, 100);
  assert.match(food.items.find((f) => f.id === 'smoked_salmon').calories_source, /^https:\/\/fdc\.nal\.usda\.gov\//);
});

test('origin comes from the shelves; the generated files validate, with no journal_points and E.4\'s tag mappings', () => {
  const sc = readSchemas(ROOT);
  assert.deepEqual(validate(sc['gear_items.schema.json'], items).errors, []);
  assert.deepEqual(validate(sc['food_items.schema.json'], foods).errors, []);
  assert.deepEqual(items.items.tent_2p_dome.tiers.cheap.origin, ['general']);
  assert.deepEqual(items.items.tent_2p_dome.origin, ['gear']);
  assert.deepEqual(items.items.fuel_canister_110.origin, ['gear', 'general']);
  assert.deepEqual(items.items.canister_wic_loaner.origin, ['desk']);
  assert.deepEqual(items.items.phone.origin, [], 'the hiker\'s own phone is on no shelf (Q3)');
  assert.deepEqual(items.packs.weekender_50.origin, ['gear', 'general']);
  assert.deepEqual(foods.foods.smoked_salmon.origin, ['general']);
  assert.deepEqual(foods.foods.beer_hazy_ipa_16oz.origin, ['general'], 'the cooler');
  assert.deepEqual(foods.foods.fd_pad_thai.origin, ['gear']);
  assert.deepEqual(foods.foods.pre_roll.origin, [], 'Second Growth waits for M1b');
  for (const [id, it] of Object.entries(items.items)) {
    assert.ok(!('journal_points' in it.stats) && !('journal_points_bonus' in it.stats), id);
    assert.ok(!it.tags.includes('field_guide') && !it.tags.includes('sketchbook'), id);
  }
  assert.ok(items.items.field_guide_birds.tags.includes('id_book'));
  assert.ok(items.items.sketchbook_pocket.tags.includes('luxury'));
  assert.ok(items.items.pad_foam_ccf.tags.includes('bombproof') && items.items.tarp_canvas.tags.includes('bombproof'));
  assert.ok(gear.tag_glossary.bombproof && gear.tag_glossary.style && !gear.tag_glossary.unbreakable);
});

test('the new items carry evidence for every estimated number (IG19), and their records are the doc\'s', () => {
  const ne = gear.items.filter((i) => i.estimate === true);
  assert.deepEqual(ne.map((i) => i.id).sort(), ['blanket_wool', 'flannel_cotton', 'tarp_canvas', 'wool_pants_surplus']);
  const want = { tarp_canvas: [64, 49, true], flannel_cotton: [12, 29, false], wool_pants_surplus: [24, 35, true], blanket_wool: [64, 59, false] };
  for (const i of ne) {
    assert.deepEqual([i.weight_oz, i.price_usd, i.basic], want[i.id], `${i.id}: GAME_DESIGN 5.7's weight and price`);
    for (const k of ['weight_oz', 'volume_l', 'price_usd', 'stats']) assert.ok(i.evidence[k], `${i.id}: evidence for ${k}`);
    assert.ok(!i.flavor, 'no flavor until S12a');
  }
  assert.ok(!gear.items.find((i) => i.id === 'flannel_cotton').tags.includes('trap'), "6.9's eighteen traps stay eighteen");
  assert.equal(gear.items.filter((i) => i.tags.includes('trap')).length, 18);
  const out = run((ctx) => {
    delete ctx.sources.gear_catalog.items.find((i) => i.id === 'tarp_canvas').evidence.volume_l;
    delete ctx.sources.food_catalog.items.find((f) => f.id === 'smoked_salmon').calories_source;
  });
  const e19 = out.entries.filter((e) => e.code === 'IG19').map((e) => e.msg);
  assert.ok(e19.some((m) => /tarp_canvas has no evidence for volume_l/.test(m)));
  assert.ok(e19.some((m) => /smoked_salmon has no source for its calories/.test(m)));
});

test('no look uses gold (slot 7), and the rain jacket is rust', () => {
  for (const [id, x] of [...Object.entries(items.items), ...Object.entries(items.packs)]) assert.ok(!x.look.pair.includes(7), id);
  assert.deepEqual(items.items.rain_jacket.look, { pair: [8, 9], dither: 'hlines' });
  assert.equal(items.items.sweater_wool_vintage.look.dither, 'brick', '6.1: brick for wool');
  assert.equal(items.items.tarp_canvas.look.dither, 'diag', '6.1: diag for canvas');
  assert.equal(items.items.fleece_jacket.look.dither, 'checker', '6.1: checker for fleece');
});

test('the guarantee as a pure check over a tiny catalog', () => {
  const tiny = {
    packs: [{ id: 'p', price_usd: 1, basic: true, tags: [] }],
    items: [
      { id: 'stove', price_usd: 1, basic: true, tags: ['stove', 'needs_fuel_canister'] },
      { id: 'gas', price_usd: 1, basic: true, tags: ['fuel', 'fuel_canister'] },
    ],
  };
  const kits = { checklist: { needs: { kitchen: [{ id: 'stove', any_tags: ['stove'] }, { id: 'fuel', fuel_for: 'stove' }] }, worn: [], fuels: { needs_fuel_canister: 'fuel_canister' }, not_traps: true } };
  const sold = new Map([['p', ['general']], ['stove', ['general']], ['gas', ['general']]]);
  assert.deepEqual(guarantee({ gear: tiny, kits, sold }), []);
  sold.delete('gas');
  assert.equal(guarantee({ gear: tiny, kits, sold }).length, 1, 'fuel at no counter is no basic');
  const o = origins({ gear: tiny, food: { items: [] }, stores: { stores: { general: { shelves: [{ id: 's', items: [{ id: 'nope' }] }] } }, desk: {} }, scope: { stores: { open: ['general'] } } });
  assert.match(o.entries[0].msg, /"nope" is no item/);
});
