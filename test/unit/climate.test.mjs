// The climate table (BUILD_PLAN 2.6, S4; GAME_DESIGN 7.5, E.5):
// content/data/climate.json copies park_rules.json climate, field by field,
// with nothing new.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { readInputs } from '../../tools/ingest.mjs';
import { climate, monthDay, CLIMATE_FILE, STATES } from '../../tools/ingest/climate.mjs';
import { readSchemas } from '../../tools/content.mjs';
import { validate } from '../../tools/schema.mjs';

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const file = read(CLIMATE_FILE);
const src = read('design/data/park_rules.json').climate;
const M = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
/** A source monthly list as the file's {"1": {...}}. */
const months = (list) => Object.fromEntries(list.map(({ month, ...r }) => [String(M[month]), r]));

test('the file validates, and the cabin reads the west valleys (2.2, 7.5)', () => {
  assert.deepEqual(validate(readSchemas(ROOT)['climate.schema.json'], file).errors, []);
  assert.deepEqual(file.cabin, { zone: 'west_valleys' });
  assert.deepEqual(Object.keys(file.zones).sort(), ['alpine', 'coast', 'east_high', 'high', 'north_mid', 'west_valleys']);
});

test('the chain: every month copied, states in the source order, every row summing to 1 within its rounding', () => {
  const wc = src.m1a_weather_inputs.weather_chain;
  assert.deepEqual(file.chain.states, STATES);
  assert.equal(Object.keys(file.chain.months).length, 12);
  for (const r of wc.monthly) {
    const m = file.chain.months[String(M[r.month])];
    assert.deepEqual(m.p, STATES.map((s) => r.p[s]), r.month);
    assert.deepEqual(m.next, STATES.map((s) => r.next_day[s]), r.month);
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    assert.ok(Math.abs(sum(m.p) - 1) <= 0.0015, `${r.month} p sums to ${sum(m.p)}`);
    for (const row of m.next) assert.ok(Math.abs(sum(row) - 1) <= 0.0015, `${r.month} next ${row}`);
  }
  assert.equal(file.chain.computed, true);
  assert.deepEqual(file.chain.estimate_rows, [[6, 'storm'], [7, 'storm']], "the method's smoothed rows");
});

test('the zones, field by field from their stations', () => {
  const z = src.zones;
  assert.deepEqual(file.zones.coast.stations.quillayute.months, months(z.coast.monthly));
  assert.equal(file.zones.coast.stations.quillayute.elev_ft, 180);
  assert.deepEqual(file.zones.west_valleys.stations.clearwater.months, months(z.rain_forest_valleys.monthly));
  assert.equal(file.zones.west_valleys.hoh_annual_precip_in, 135);
  const nm = file.zones.north_mid;
  assert.deepEqual(nm.stations.sappho_8e.months, months(src.m1a_weather_inputs.north_mid_sol_duc_valley.monthly));
  assert.deepEqual(nm.stations.port_angeles.months, months(z.rain_shadow_lowlands_and_north_valleys.stations.port_angeles.monthly));
  for (const k of [6, 7, 8, 9, 10]) assert.deepEqual(nm.use[k], ['sappho_8e'], `north_mid ${k}: Sappho 8 E`);
  for (const k of [1, 2, 3, 4, 5, 11, 12]) assert.deepEqual(nm.use[k], ['port_angeles', 'elwha_ranger_station'], `north_mid ${k}`);
  assert.deepEqual(file.zones.high.stations.waterhole_snotel.months, months(z.subalpine_4000_6000ft.stations.waterhole_snotel.monthly));
  assert.deepEqual(file.zones.high.stations.buckinghorse_snotel.months, months(z.subalpine_4000_6000ft.stations.buckinghorse_snotel.monthly));
  assert.equal(file.zones.east_high.provisional, true);
  assert.deepEqual(file.zones.east_high.stations.dungeness_snotel.months, months(z.subalpine_4000_6000ft.stations.dungeness_snotel.monthly));
  assert.deepEqual([file.zones.alpine.estimate, file.zones.alpine.confidence, file.zones.alpine.lapse_f_per_1000ft], [true, 'low', 3.5]);
});

test('the High overlays, the freezing levels and the melt-outs, copied', () => {
  const m = src.m1a_weather_inputs;
  assert.deepEqual(file.high_overlays.thunder.months, months(m.thunderstorms_high_zone.monthly));
  assert.equal(file.high_overlays.thunder.estimate, true);
  assert.deepEqual(file.high_overlays.fog.months, months(m.fog_high_zone.monthly));
  assert.deepEqual(file.high_overlays.wind.months, months(m.ridge_wind_high_zone.monthly));
  assert.deepEqual(file.high_overlays.wind.afternoon_mean_mph_by_state['8'], m.ridge_wind_high_zone.afternoon_mean_mph_by_state.Aug);
  assert.deepEqual(file.high_overlays.wet_given_state.months['8'], STATES.map((s) => m.weather_chain.high_zone_wet_day_given_state.Aug[s]));
  assert.deepEqual(file.freezing_level_ft.months, months(src.freezing_level_ft.monthly));
  assert.equal(file.freezing_level_ft.months['8'].median, 12500, '7.5: Aug 12,500 ft');
  assert.deepEqual(file.snow_free.waterhole_snotel, { median: '06-17', earliest: '05-01', earliest_year: 2015, latest: '07-24', latest_year: 2011, recent: { 2023: '05-28', 2024: '06-01', 2025: '06-04', 2026: '05-11' } });
  assert.equal(file.snow_free.dungeness_snotel.median, '04-29');
  for (const u of file.sources) assert.match(u, /^https?:\/\//);
});

test("a typed value checks the source's words, so it can't drift", () => {
  const { ctx } = readInputs(ROOT);
  assert.deepEqual(climate(ctx).entries, []);
  ctx.sources.park_rules.climate.zones.coast.proxy_station = 'Quillayute Airport (UIL), 190 ft';
  assert.ok(climate(ctx).entries.some((e) => e.level === 'error' && /180 ft/.test(e.msg)));
  assert.deepEqual(monthDay('late April (Apr 29)'), { md: '04-29', year: null });
  assert.deepEqual(monthDay('May 1 (2015)'), { md: '05-01', year: 2015 });
});
