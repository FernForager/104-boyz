// The permit rules (BUILD_PLAN 2.6, S4; GAME_DESIGN 3.1, 4.3, 4.6, 5.8;
// Lead calls 1, 33): content/park/permits.json, every value its source's.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { readInputs } from '../../tools/ingest.mjs';
import { permits, mdRange, PERMITS_FILE, AREAS } from '../../tools/ingest/permits.mjs';
import { readSchemas } from '../../tools/content.mjs';
import { validate } from '../../tools/schema.mjs';

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const file = read(PERMITS_FILE);
const pr = read('design/data/park_rules.json').permits;
const mi = read('design/data/regions/sol_duc_high_divide.json').m1a_play_inputs;
const scope = read('content/scope/m1a.json');
const M = { Jul: '7', Aug: '8', Sep: '9', Oct: '10' };

test('the file validates against its schema', () => {
  assert.deepEqual(validate(readSchemas(ROOT)['permits.schema.json'], file).errors, []);
});

test('seasons, fees and the group, from park_rules.json (4.6, 5.8)', () => {
  assert.deepEqual(file.season.summer, ['05-15', '10-15']);
  assert.deepEqual(file.season.winter, ['10-16', '05-14']);
  assert.deepEqual([file.fees.per_adult_per_night_usd, file.fees.per_permit_usd, file.fees.youth_15_and_under_usd, file.fees.shown_not_paid], [pr.fees_2026.per_adult_per_night_usd, pr.fees_2026.reservation_fee_usd_per_permit, 0, true]);
  assert.deepEqual([file.group.max, file.group.group_site_from], [12, 7]);
});

test("the quota areas: all ten by id; the Sol Duc area's camps and online window; the 21 quota camps are the scope's", () => {
  assert.deepEqual(Object.keys(file.quota_areas).sort(), Object.keys(AREAS).sort());
  assert.equal(pr.quota_areas.value.length, 10);
  const sd = file.quota_areas.sol_duc_seven_lakes;
  assert.deepEqual(sd.online, ['07-15', '10-15'], "every camp's quota text says Jul 15-Oct 15");
  assert.equal(sd.camps.length, 20);
  assert.deepEqual(file.quota_areas.hoh_lake_cb_flats.camps, ['hoh_lake']);
  const quota = Object.keys(file.quota.camps).sort();
  assert.deepEqual(quota, [...scope.park.camps].sort(), 'the 21 quota camps are the scope file\'s plannable camps');
  assert.deepEqual([...sd.camps, 'hoh_lake'].sort(), quota);
});

test('the odds, copied: quota by camp, month and night type; the desk; the rangers; the visitors', () => {
  for (const [id, by] of Object.entries(mi.quota_availability.camps)) for (const [mon, v] of Object.entries(by)) assert.deepEqual(file.quota.camps[id][M[mon]], v, `${id} ${mon}`);
  assert.deepEqual(file.quota.night_types, { weekend: ['fri', 'sat'], midweek: ['sun', 'mon', 'tue', 'wed', 'thu'], labor_day: { nights: ['sat', 'sun'], of_weekend: 0.5 } });
  assert.equal(file.quota.estimate, true);
  assert.deepEqual(file.desk.p_granted, { midweek: 0.7, weekend: 0.4 }, 'Lead call 1: about 70% midweek and 40% on weekends');
  assert.deepEqual([file.desk.weekend_nights, file.desk.holiday_sunday, file.desk.season], [['fri', 'sat'], true, ['05-15', '10-15']]);
  assert.deepEqual([file.desk.m1a, file.desk.m1b, file.desk.phone_only], [['bruces_roost', 'cat_basin', 'hidden_lake'], ['long_lake', 'sol_duc_lake'], ['morgenroth_lake']]);
  assert.deepEqual(file.desk.m1a, scope.park.desk);
  for (const [id, v] of Object.entries(mi.ranger_presence.camp_evening_visit.camps)) assert.deepEqual(file.rangers.camp_evening_visit.camps[id], v, id);
  assert.deepEqual(file.rangers.on_trail.per_hour.crest, mi.trail_traffic.sections.crest.rangers_per_hour);
  assert.deepEqual([file.rangers.on_trail.evening_factor, file.rangers.permit_check.after_citation_factor], [0.4, 1.5]);
  assert.deepEqual(file.visitors.p_visitor_per_night, mi.food_storage_visitors.p_visitor_per_night);
  assert.deepEqual(file.visitors.p_bear_given_visitor, { 7: 0.08, 8: 0.15, 9: 0.15, 10: 0.05 });
  assert.equal(file.visitors.canister_closed_factor, 0.15);
  assert.deepEqual(file.loaner, { item: 'canister_wic_loaner', always: true }, 'Lead call 33: the desk always has a can');
});

test("the windows parse, and a typed value can't drift from its words", () => {
  assert.deepEqual(mdRange('May 15 - October 15'), ['05-15', '10-15']);
  assert.deepEqual(mdRange('Jul 15-Oct 15'), ['07-15', '10-15']);
  assert.deepEqual(mdRange('May 15 to Oct 15 (the summer permit season)'), ['05-15', '10-15']);
  assert.equal(mdRange('mid-July'), null);
  const { ctx } = readInputs(ROOT);
  assert.deepEqual(permits(ctx).entries.filter((e) => e.level === 'error'), []);
  const sd = ctx.sources.regions.find((r) => r.data.region_id === 'sol_duc_high_divide').data;
  sd.m1a_play_inputs.ranger_presence.on_trail.what = sd.m1a_play_inputs.ranger_presence.on_trail.what.replace('0.4 times', '0.5 times');
  const camp = sd.nodes.find((n) => n.id === 'rocky_creek');
  camp.camp.reservation_or_quota = camp.camp.reservation_or_quota.replace('Jul 15-Oct 15', 'Jul 1-Oct 15');
  const errs = permits(ctx).entries.filter((e) => e.level === 'error');
  assert.ok(errs.some((e) => /0\.4 times/.test(e.msg)), 'a changed factor is caught');
  assert.ok(errs.some((e) => e.where === 'sol_duc_high_divide/rocky_creek' && /disagrees/.test(e.msg)), 'a camp whose window disagrees is caught');
});
