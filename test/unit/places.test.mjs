// The gazetteer (BUILD_PLAN 3.2, 10.2, S4; GAME_DESIGN 18.2): every real
// place name a screen may show, with its source; descriptive labels kept
// out; the business names the game renames never in.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { readInputs } from '../../tools/ingest.mjs';
import { ingestRegions } from '../../tools/ingest/regions.mjs';
import { gazetteer, cleanName, descriptive, nameSource, PLACES_FILE } from '../../tools/ingest/gazetteer.mjs';
import { readNames } from '../../tools/text.mjs';
import { mapLabels } from '../../tools/textlint.mjs';
import { readSchemas } from '../../tools/content.mjs';
import { validate } from '../../tools/schema.mjs';

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const gaz = read(PLACES_FILE);
const scope = read('content/scope/m1a.json').park;

test('the names files validate against names.schema.json', () => {
  const schema = readSchemas(ROOT)['names.schema.json'];
  for (const f of ['content/text/names/places.json', 'content/text/names/places_extra.json', 'content/text/names/terms.json']) assert.deepEqual(validate(schema, read(f)).errors, [], f);
  assert.deepEqual(readNames(ROOT).problems, []);
});

test("the map's 25 labels are places, each with its source; the loop's 8 descriptive junctions are not", () => {
  const labels = mapLabels(ROOT);
  assert.equal(labels.length, 25);
  for (const l of labels) {
    const p = gaz.places[l.slice('place.'.length)];
    assert.ok(p, l);
    assert.match(p.source, /^https:\/\//, l);
  }
  assert.equal(gaz.places.lunch_lake.text, 'Lunch Lake');
  const loop = scope.nodes;
  assert.equal(loop.filter((id) => gaz.places[id]).length, 39, 'the loop: 39 places');
  const junctions = loop.filter((id) => gaz.not_places[id]).sort();
  assert.deepEqual(junctions, ['bogachiel_peak_junction', 'bogachiel_peak_west_junction', 'cat_basin_cutoff_junction', 'hidden_lake_junction', 'hoh_lake_trail_junction', 'mirror_lake_way_trail_junction', 'round_lake_junction', 'swimming_bear_lake_junction']);
  for (const id of junctions) assert.equal(gaz.not_places[id].why, 'descriptive');
  assert.deepEqual([gaz.places.heart_lake_junction.text, gaz.places.appleton_junction.text], ['Heart Lake Junction', 'Appleton Junction'], 'proper names, capitalized');
  assert.deepEqual([gaz.places.seven_lakes_basin.text, gaz.places.high_divide.text], ['Seven Lakes Basin', 'High Divide'], 'the parenthetical moved out');
  assert.deepEqual([gaz.places.mirror_lake.text, gaz.places.mirror_lake.unofficial], ['Mirror Lake', true]);
  assert.ok(gaz.places.forks && gaz.places.sequim, 'the towns are nodes, with USGS sources');
});

test("a business the game renames never enters, not even as a not_place (5.2)", () => {
  for (const id of ['sol_duc_hot_springs_resort', 'barnes_point_lodge', 'lake_quinault_lodge_area']) assert.ok(!gaz.places[id] && !gaz.not_places[id], id);
  assert.ok(cleanName('Sol Duc Hot Springs (in-game business name: The Steaming Fern Lodge)').business);
  assert.ok(gaz.places.olympic_hot_springs, 'the natural hot springs are a public place');
});

test('the rules, as pure functions: cleaning, descriptive names, the source host order', () => {
  assert.deepEqual(cleanName('Seven Lakes Basin (rim junction with High Divide Trail)'), { text: 'Seven Lakes Basin', paren: 'rim junction with High Divide Trail', unofficial: false, business: false });
  assert.ok(descriptive('Lunch Lake / Round Lake trail junction'));
  assert.ok(descriptive('Shi Shi overnight parking'));
  assert.ok(!descriptive('Heart O\' the Hills Campground'), 'a short connective is fine');
  assert.ok(!descriptive('Lake of the Angels'));
  const urls = ['https://epqs.nationalmap.gov/v1/json?x=1', 'https://www.openstreetmap.org/node/1', 'https://www.wta.org/x', 'https://carto.nationalmap.gov/arcgis/x', 'https://www.recreation.gov/x'];
  assert.equal(nameSource(urls), 'https://www.recreation.gov/x');
  assert.equal(nameSource(urls.slice(0, 4)), 'https://carto.nationalmap.gov/arcgis/x');
  assert.equal(nameSource(['https://epqs.nationalmap.gov/v1/json?x=1']), null, 'never the elevation service');
  assert.equal(nameSource(['https://nps.gov/olym/x', 'https://www.recreation.gov/x']), 'https://nps.gov/olym/x');
});

test('a node with no usable source is a not_place (IG18), and places_extra may not reuse a node id', () => {
  const { ctx } = readInputs(ROOT);
  const sd = ctx.sources.regions.find((r) => r.data.region_id === 'sol_duc_high_divide').data;
  const lunch = sd.nodes.find((n) => n.id === 'lunch_lake');
  lunch.sources = ['https://epqs.nationalmap.gov/v1/json?x=1'];
  ctx.park = ingestRegions({ regions: ctx.sources.regions, hazards: ctx.vocab.hazards, zones: ctx.vocab.zones, overlays: ctx.overlays, scope: ctx.scope, movement: ctx.movement });
  ctx.places_extra = { places: { ...ctx.places_extra.places, deer_lake: { text: 'Deer Lake', kind: 'lake', source: 'https://x.org/' } } };
  const out = gazetteer(ctx);
  const g = out.files[PLACES_FILE];
  assert.equal(g.not_places.lunch_lake.why, 'no_source');
  const errs = out.entries.filter((e) => e.level === 'error').map((e) => e.msg);
  assert.ok(errs.some((m) => /lunch_lake/.test(m)), 'inside the scope, an unsourced name is an error');
  assert.ok(errs.some((m) => /deer_lake is also a node's name/.test(m)));
});

test("places_extra and the terms: the quiz's and the drives' real names, each with a source in the repo's data", () => {
  const extra = read('content/text/names/places_extra.json').places;
  assert.deepEqual(Object.keys(extra).sort(), ['dosewallips', 'elwha', 'hoh', 'lake_crescent', 'lake_quinault', 'mount_rainier', 'olympic_national_park', 'port_angeles', 'puyallup', 'queets', 'us_101']);
  const data = ['design/data/quiz_locals.json', 'design/data/park_rules.json', ...['coast', 'elwha_hurricane', 'hamma_hamma', 'hoh_olympus', 'northeast_dose', 'sol_duc_high_divide', 'south_quinault_skok'].map((r) => `design/data/regions/${r}.json`), 'design/GAME_DESIGN.md'].map((f) => readFileSync(join(ROOT, f), 'utf8')).join('\n');
  for (const [id, p] of Object.entries(extra)) assert.ok(data.includes(p.source), `${id}: ${p.source} is in the repo's data`);
  const terms = read('content/text/names/terms.json').terms;
  assert.deepEqual(Object.keys(terms).sort(), ['canada_jay', 'geoduck']);
  assert.ok(data.includes(terms.canada_jay.source) && data.includes(terms.geoduck.source));
});
