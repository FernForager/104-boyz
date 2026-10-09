// The graph lints G01-G04 and G06-G08 (BUILD_PLAN 6.7, S4; GAME_DESIGN F.3,
// E.4): clean on the real park, and each fires on a planted fixture: an
// error inside the M1a scope, and outside it an error until
// ingest_known.json acknowledges it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintGraph, readPark, graphFindings } from '../../tools/graphlint.mjs';
import { ROOT } from '../../tools/pics.mjs';
import { RULES, activeCodes } from '../../tools/lint.mjs';

const base = readPark(ROOT);
const SD = 'sol_duc_high_divide';

/** A deep copy of the lint's input, changed by f. */
function planted(f) {
  const copy = {};
  for (const [k, v] of Object.entries(base)) {
    if (v instanceof Map) copy[k] = new Map([...v].map(([n, x]) => [n, x && { src: x.src, data: structuredClone(x.data) }]));
    else copy[k] = v && { src: v.src, data: structuredClone(v.data) };
  }
  f(copy);
  return lintGraph(ROOT, copy);
}
const codes = (issues) => [...new Set(issues.map((i) => i.code))].sort();
const sd = (c) => c.regions.get(SD).data;

test('the real park is clean: every finding outside the scope is acknowledged, none inside', () => {
  assert.deepEqual(lintGraph(ROOT), []);
  const raw = graphFindings(ROOT);
  assert.ok(raw.length > 0, 'without ingest_known.json the outside-the-scope findings show');
  assert.ok(raw.every((i) => /outside the M1a scope/.test(i.msg)), 'and every one is outside the scope');
  assert.equal(raw.filter((i) => i.code === 'G03').length, 14, "GAME_DESIGN E.4's 14 elevation misses");
});

test('the registry: G01-G04 and G06-G08 active, G05 waits for S5', () => {
  const active = activeCodes();
  for (const c of ['G01', 'G02', 'G03', 'G04', 'G06', 'G07', 'G08']) assert.ok(active.includes(c), c);
  const g05 = RULES.find((r) => r.code === 'G05');
  assert.deepEqual([g05.status, g05.lands], ['lands', 'S5']);
  assert.ok(!RULES.some((r) => r.code === 'G'), 'the family placeholder is gone');
});

test('G01: a reference to nothing (a hazard, a scope id, an overlay gate, a conditions entry)', () => {
  const a = planted((c) => {
    sd(c).hazards.snowfield_high_divide.where.push('nowhere');
  });
  assert.deepEqual(codes(a), ['G01']);
  assert.match(a[0].msg, /acknowledge "G01:sol_duc_high_divide\/snowfield_high_divide"/);
  const b = planted((c) => {
    c.scope.data.park.nodes.push('nowhere');
  });
  assert.ok(b.some((i) => i.code === 'G01' && /park\.nodes: "nowhere" is no node/.test(i.msg)));
  const d = planted((c) => {
    c.overlays.get(SD).data.loops.high_divide.ccw_first = 'a->b';
  });
  assert.ok(d.some((i) => i.code === 'G01' && /ccw_first/.test(i.msg)));
  const e = planted((c) => {
    c.conditions.set('2026', { src: '{}', data: { entries: [{ id: 'x', region: SD, applies_to: ['lunch_lake', 'all_wilderness_camps', 'nowhere'] }] } });
  });
  assert.deepEqual(e.map((i) => i.msg.replace(/ \(outside.*/, '')), ['applies_to "nowhere" is no node, segment, region or road']);
});

test('G02: a camp no trailhead reaches', () => {
  const issues = planted((c) => {
    delete sd(c).segments['sol_duc_falls->sol_duc_falls_camp'];
  });
  assert.ok(issues.some((i) => i.code === 'G02' && /the camp sol_duc_falls_camp can't be reached/.test(i.msg) && !/outside/.test(i.msg)), 'inside the scope: an error, no acknowledgement offered');
  assert.ok(issues.some((i) => i.code === 'G01' && /traffic section falls_trail/.test(i.msg)), 'and the traffic section that names the segment');
});

test('G03: gain - loss that misses the endpoints by more than 100 ft; and no null elevation in the scope', () => {
  const issues = planted((c) => {
    sd(c).segments['deer_lake->potholes'].gain += 150;
    sd(c).nodes.potholes.elev_ft = null;
  });
  assert.ok(issues.some((i) => i.code === 'G03' && /potholes has no elevation/.test(i.msg)));
  const miss = planted((c) => {
    sd(c).segments['canyon_creek_3->deer_lake'].gain += 150;
  });
  assert.deepEqual(codes(miss), ['G03']);
  assert.match(miss[0].msg, /150 ft apart/);
});

test('G04: a shared id whose research records disagree by more than 100 ft', () => {
  const issues = planted((c) => {
    const raw = c.raw.get(SD).data;
    raw.nodes.find((n) => n.id === 'cat_basin').elevation_ft += 150;
  });
  assert.deepEqual(codes(issues), ['G04']);
  assert.match(issues[0].msg, /cat_basin is in elwha_hurricane and sol_duc_high_divide, 150 ft apart/);
});

test('G06: a preset naming Lake Morgenroth, a trip file naming it, and a preset that no longer routes to its miles', () => {
  const issues = planted((c) => {
    const p = sd(c).presets.deer_lake_overnight;
    p.days[0].to = 'morgenroth_lake';
    c.trips.set('fills', { src: '{"camps": ["morgenroth_lake"]}', data: { camps: ['morgenroth_lake'] } });
    sd(c).presets.high_divide_loop_1n_heart_lake.days[1].mi10 = 90;
  });
  assert.ok(issues.some((i) => i.code === 'G06' && /names morgenroth_lake/.test(i.msg)));
  assert.ok(issues.some((i) => i.code === 'G06' && i.file === 'content/trips/fills.json'));
  assert.ok(issues.some((i) => i.code === 'G06' && /routes to 8\.1 mi now, not 9\.0/.test(i.msg)));
});

test('G07: Bogachiel Peak must stay a spur, and no camp-to-camp route may pass through one', () => {
  const issues = planted((c) => {
    sd(c).nodes.bogachiel_peak.spur_only = false;
    sd(c).segments['bogachiel_peak_junction->bogachiel_peak'].through = true;
  });
  assert.ok(issues.some((i) => i.code === 'G07' && /must be spur_only/.test(i.msg)));
  assert.ok(issues.some((i) => i.code === 'G07' && /must not be a through route/.test(i.msg)));
  const through = planted((c) => {
    const n = sd(c).nodes.bogachiel_peak;
    n.spur_only = false;
    for (const id of ['bogachiel_peak_junction->bogachiel_peak', 'bogachiel_peak_west_junction->bogachiel_peak']) sd(c).segments[id].through = true;
    // A plannable camp on the peak's far side makes a camp-to-camp route that would cut over it.
    c.scope.data.park.camps.push('bogachiel_peak_west_junction');
    sd(c).nodes.bogachiel_peak_west_junction.camp = { ...sd(c).nodes.lunch_lake.camp };
  });
  assert.ok(through.some((i) => i.code === 'G07'));
});

test('G08: the scope: a map-only link missing, a group site made plannable, a camp with no water, a fork off the loop', () => {
  const a = planted((c) => {
    c.scope.data.park.map_only = c.scope.data.park.map_only.filter((id) => id !== 'long_lake->morgenroth_lake');
  });
  assert.ok(a.some((i) => i.code === 'G08' && /long_lake->morgenroth_lake .*belongs in park\.map_only/.test(i.msg)));
  const b = planted((c) => {
    c.scope.data.park.camps.push('seven_mile_group_camp');
  });
  assert.ok(b.some((i) => i.code === 'G08' && /seven_mile_group_camp is a group site/.test(i.msg)));
  const d = planted((c) => {
    delete sd(c).nodes.lunch_lake.place.water['8'];
  });
  assert.ok(d.some((i) => i.code === 'G08' && /lunch_lake has no water for month 8/.test(i.msg)));
  const e = planted((c) => {
    c.overlays.get(SD).data.forks.seven_lakes_basin.way_in = 'lunch_lake->clear_lake';
  });
  assert.ok(e.some((i) => i.code === 'G08' && /doesn't touch seven_lakes_basin/.test(i.msg)));
  const f = planted((c) => {
    sd(c).nodes.round_lake.camp.sites = null;
  });
  assert.ok(f.some((i) => i.code === 'G08' && /round_lake has no sites/.test(i.msg)));
});

test('an acknowledgement that matches nothing is stale, and an error', () => {
  const issues = planted((c) => {
    c.known.data['G03:coast/nowhere->else'] = { why: 'a test of a stale key' };
  });
  assert.deepEqual(issues.map((i) => [i.code, i.msg]), [['G03', '"G03:coast/nowhere->else" acknowledges nothing (stale)']]);
});
