// The dated conditions overlay (BUILD_PLAN 2.6, S4; GAME_DESIGN 4.6, 4.7,
// E.4): content/park/conditions/2026.json, as ingest generates it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { readInputs } from '../../tools/ingest.mjs';
import { conditions, datesIn, EFFECTS, ROADS, CONDITIONS_FILE } from '../../tools/ingest/conditions.mjs';
import { readSchemas } from '../../tools/content.mjs';
import { validate } from '../../tools/schema.mjs';

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const file = read(CONDITIONS_FILE);
const solDuc = read('design/data/regions/sol_duc_high_divide.json');

/** The generator over the real inputs, with an optional change to the parsed sources first. */
function gen(change) {
  const { ctx } = readInputs(ROOT);
  ctx.park = { statuses: [] };
  if (change) change(ctx);
  return conditions(ctx);
}

test('the file validates against its schema, and its date is the research date, never a clock (4.7)', () => {
  const v = validate(readSchemas(ROOT)['conditions.schema.json'], file);
  assert.deepEqual(v.errors, []);
  assert.equal(file.conditions_date, '2026-10-07');
  assert.equal(file.format, 1);
  const ids = file.entries.map((e) => e.id);
  assert.deepEqual(ids, [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)), 'sorted by id');
  assert.equal(new Set(ids).size, ids.length, 'ids are unique');
});

test("each of the 18 Sol Duc entries has its effect at the source, and the overlay carries them structured", () => {
  assert.equal(solDuc.conditions_2026.length, 18);
  for (const c of solDuc.conditions_2026) assert.ok(EFFECTS.includes(c.effect), `${c.note.slice(0, 40)}: ${c.effect}`);
  assert.ok(typeof solDuc.conditions_2026_fields.effect === 'string' && solDuc.conditions_2026_fields.effect.includes('fire_ban'), 'conditions_2026_fields defines effect');
  const mine = file.entries.filter((e) => e.region === 'sol_duc_high_divide');
  assert.equal(mine.length, 18);
  assert.ok(mine.every((e) => e.structured));
  const fire = mine.find((e) => e.effect === 'fire_ban');
  assert.deepEqual([fire.from, fire.until, fire.applies_to], ['2026-08-07', '2026-10-01', ['all_wilderness_camps']], "the 2026 Stage 2 ban, the USFS order's dates (4.6)");
  const slide = mine.find((e) => e.effect === 'hazard');
  assert.deepEqual(slide.adds_hazards, ['washout']);
  assert.deepEqual(Object.keys(slide.hazard_card).sort(), ['id', 'mitigations', 'where'], 'the hazard card keeps ids only, no words');
  assert.equal(slide.stale_after, '2027-06-30');
});

test('the US 101 Hoh River Bridge: three full-closure windows, and its single lane persists (3.3, 4.7)', () => {
  const bridge = file.entries.filter((e) => e.applies_to.includes('us101_hoh_river_bridge'));
  const shut = bridge.find((e) => e.effect === 'road_closure');
  assert.deepEqual(shut.windows, [['2026-09-24', '2026-09-29'], ['2026-10-01', '2026-10-06'], ['2026-10-08', '2026-10-13']]);
  assert.deepEqual(shut.hours, [[5, 17], [5, 12], [5, 12]], '5 am Oct 8 to noon Oct 13');
  assert.match(shut.source, /^https:\/\/wsdot\.wa\.gov\//);
  const lane = bridge.find((e) => e.effect === 'single_lane');
  assert.equal(lane.persists, true);
  const mora = file.entries.find((e) => e.applies_to.includes('rialto_beach_trailhead'));
  assert.deepEqual([mora.effect, mora.from, mora.until], ['road_closure', '2026-07-08', '2026-10-15']);
  // The source's own miles, one entry per distance: Whiskey Bend +6.5 and
  // Boulder Creek ~8 (park_rules.json: "Adds ~6.5 mi to Whiskey Bend TH and
  // ~8 mi to Boulder Creek"), and the Dosewallips +6.5 to its old road end.
  for (const [th, mi10] of [['whiskey_bend_trailhead', 65], ['boulder_creek_trailhead', 80], ['dosewallips_ranger_station', 65]]) {
    const w = file.entries.filter((e) => e.applies_to.includes(th));
    assert.equal(w.length, 1, th);
    assert.deepEqual([w[0].effect, w[0].persists, w[0].extra_mi10, w[0].estimate, w[0].applies_to], ['road_walk', true, mi10, true, [th]], `${th}: +${mi10 / 10} mi`);
  }
  for (const r of ROADS.filter((x) => x.extra_mi10 !== undefined)) assert.ok(r.check.some((w) => w.includes(`${r.extra_mi10 / 10} mi`)), `${r.applies_to}: the source's own words for its ${r.extra_mi10 / 10} mi are checked`);
});

/** The merged park's road walks and where cars stop: every region's road_walk segments, and the trailheads with a drive time. */
function roadGraph() {
  const adj = new Map();
  const drivable = new Set();
  const link = (a, b, mi10) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a).push([b, mi10]);
  };
  for (const r of ['coast', 'elwha_hurricane', 'hamma_hamma', 'hoh_olympus', 'northeast_dose', 'sol_duc_high_divide', 'south_quinault_skok']) {
    const reg = read(`content/park/regions/${r}.json`);
    for (const s of Object.values(reg.segments)) if (s.class === 'road_walk' && Number.isInteger(s.mi10)) (link(s.a, s.b, s.mi10), link(s.b, s.a, s.mi10));
    for (const [id, t] of Object.entries(reg.trailheads)) if (Object.values(t.drive_min).some((v) => v !== null)) drivable.add(id);
  }
  return { adj, drivable };
}

/**
 * What's wrong with the road walks: one names a trailhead cars still reach
 * (whose road walk the graph already holds, so the miles would count
 * twice), or its extra miles aren't the graph's own road walk from the
 * nearest trailhead cars reach, within half a mile.
 */
function roadWalkProblems(entries) {
  const { adj, drivable } = roadGraph();
  const out = [];
  for (const e of entries.filter((x) => x.effect === 'road_walk')) {
    for (const id of e.applies_to) {
      if (drivable.has(id)) {
        out.push(`${e.id}: ${id} is where cars stop; the graph already walks its road`);
        continue;
      }
      // Dijkstra over the road walks, from every trailhead cars reach.
      const dist = new Map([...drivable].map((d) => [d, 0]));
      const todo = [...drivable];
      while (todo.length) {
        todo.sort((a, b) => dist.get(b) - dist.get(a));
        const n = todo.pop();
        for (const [m, w] of adj.get(n) || []) if (!dist.has(m) || dist.get(n) + w < dist.get(m)) (dist.set(m, dist.get(n) + w), todo.push(m));
      }
      if (!dist.has(id)) out.push(`${e.id}: no road walk reaches ${id} from a trailhead cars reach`);
      else if (Math.abs(dist.get(id) - e.extra_mi10) > 5) out.push(`${e.id}: +${e.extra_mi10 / 10} mi, but the graph walks ${dist.get(id) / 10} mi to ${id}`);
    }
  }
  return out;
}

test("no road walk counts the graph's own road twice, and each one's miles are the graph's walk to its old road end (E.4)", () => {
  assert.deepEqual(roadWalkProblems(file.entries), []);
  const walk = file.entries.filter((e) => e.effect === 'road_walk');
  assert.equal(walk.length, 3);
  const plant = (id, mi10) => [{ id: 'planted', effect: 'road_walk', applies_to: [id], extra_mi10: mi10 }];
  assert.match(roadWalkProblems(plant('dosewallips_trailhead', 65))[0], /where cars stop/, 'the road end itself: the walk would count twice');
  assert.match(roadWalkProblems(plant('madison_falls_trailhead', 65))[0], /where cars stop/);
  assert.match(roadWalkProblems(plant('boulder_creek_trailhead', 65))[0], /graph walks 8.2 mi/, 'Boulder Creek at 6.5 is short by the graph too');
});

test('a road closure shuts a road the drives name or a trailhead, never a trail node', () => {
  const roads = new Set(Object.keys(read('content/drive/routes.json').roads));
  const trailheads = new Set();
  for (const r of ['coast', 'elwha_hurricane', 'hamma_hamma', 'hoh_olympus', 'northeast_dose', 'sol_duc_high_divide', 'south_quinault_skok']) {
    const reg = read(`content/park/regions/${r}.json`);
    for (const [id, n] of Object.entries(reg.nodes)) if (n.type === 'trailhead') trailheads.add(id);
  }
  const shut = file.entries.filter((e) => e.effect === 'road_closure');
  assert.equal(shut.length, 2, 'the Hoh River Bridge and Mora Road');
  for (const e of shut) for (const a of e.applies_to) assert.ok(roads.has(a) || trailheads.has(a), `${e.id}: ${a}`);
  // The Sol Duc file's copy of the bridge closure is news on the Hoh Lake
  // Trail junction (a Hoh-side exit takes the detour): park_rules.json's
  // entry on the bridge is the one structured closure, with its hours.
  const copy = file.entries.find((e) => e.region === 'sol_duc_high_divide' && e.applies_to.includes('hoh_lake_trail_junction'));
  assert.equal(copy.effect, 'news');
});

test('the statuses moved off the segments: here, structured, and on no segment any more', () => {
  const st = file.entries.filter((e) => e.derived_from === 'hazard');
  assert.equal(st.length, 25, '23 trail_closed_2026 and 2 possibly_closed_2026');
  assert.equal(st.filter((e) => e.effect === 'closure').length, 23);
  assert.equal(st.filter((e) => e.effect === 'maybe_closed').length, 2);
  for (const e of st) assert.deepEqual([e.from, e.persists, e.last_confirmed], [null, true, '2026-10-07']);
  for (const r of ['coast', 'elwha_hurricane', 'hamma_hamma', 'hoh_olympus', 'northeast_dose', 'sol_duc_high_divide', 'south_quinault_skok']) {
    const reg = read(`content/park/regions/${r}.json`);
    for (const [id, s] of Object.entries(reg.segments)) for (const h of s.hazards) assert.ok(!/_2026$/.test(h), `${r}/${id} still carries ${h}`);
  }
});

test("the other six regions' 119 entries are kept, unstructured and inert, each applying to its region", () => {
  const loose = file.entries.filter((e) => !e.structured);
  assert.equal(loose.length, 119);
  for (const e of loose) {
    assert.deepEqual([e.effect, e.applies_to, e.persists], ['news', [e.region], true]);
    assert.match(e.source, /^https?:\/\//);
  }
  assert.ok(loose.some((e) => e.stale), "park_rules.json's staleness rule: a claim dated before 2025 is stale");
});

test('every applies_to resolves: a node, a segment, a region, a road of the drives, or the park-wide camps (G01)', () => {
  const ids = new Set(['all_wilderness_camps']);
  for (const r of ['coast', 'elwha_hurricane', 'hamma_hamma', 'hoh_olympus', 'northeast_dose', 'sol_duc_high_divide', 'south_quinault_skok']) {
    const reg = read(`content/park/regions/${r}.json`);
    ids.add(r);
    for (const k of Object.keys(reg.nodes)) ids.add(k);
    for (const k of Object.keys(reg.segments)) ids.add(k);
  }
  for (const k of Object.keys(read('content/drive/routes.json').roads)) ids.add(k);
  for (const e of file.entries) for (const a of e.applies_to) assert.ok(ids.has(a), `${e.id}: ${a}`);
});

test("the road table can't drift from park_rules.json, and a structured entry's fields are checked", () => {
  assert.deepEqual(gen().entries.filter((e) => e.level === 'error'), []);
  const drift = gen((ctx) => {
    const it = ctx.sources.park_rules.current_conditions.roads.items.find((x) => x.road.startsWith('Mora Road'));
    it.status = it.status.replace('Oct 15', 'Oct 31');
  });
  assert.ok(drift.entries.some((e) => e.code === 'IG13' && e.level === 'error' && /Mora|mora/.test(e.where)), 'a changed closure date is caught');
  const bad = gen((ctx) => {
    const sd = ctx.sources.regions.find((r) => r.data.region_id === 'sol_duc_high_divide').data;
    sd.conditions_2026[0].effect = 'sunny';
    delete sd.conditions_2026[1].persists;
  });
  const errs = bad.entries.filter((e) => e.code === 'IG13' && e.level === 'error').map((e) => e.where);
  assert.ok(errs.includes('sol_duc_high_divide/conditions_2026[0]'), 'an unknown effect');
  assert.ok(errs.includes('sol_duc_high_divide/conditions_2026[1]'), 'neither until nor persists');
  for (const r of ROADS) assert.ok(r.doc.startsWith('GAME_DESIGN'), 'each road names its doc');
});

test('free-text dates read as ISO dates', () => {
  assert.deepEqual(datesIn('NPS entry 2017-08-25; page updated 2026-08-07'), ['2017-08-25', '2026-08-07']);
  assert.deepEqual(datesIn('2026-09'), ['2026-09-01']);
  assert.deepEqual(datesIn('2013 (stale)'), ['2013-01-01']);
  assert.deepEqual(datesIn(null), []);
});
