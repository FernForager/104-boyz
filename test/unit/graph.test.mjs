// The park graph and its router (BUILD_PLAN 6.6, S4; GAME_DESIGN 4.3, 7.4,
// B.1, F.4): every number of test/golden/park/m1a.json, routed on the
// compiled park (rules.park) with web/js/engine/graph.js, under the
// engine's bans.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { compileContent } from '../../tools/content.mjs';
import { buildGraph, route, distAlong } from '../../web/js/engine/graph.js';
import { baseSeconds, withBreaks, steepOf } from '../../web/js/engine/movement.js';
import { loadContent } from '../../web/js/engine/content.js';
import * as api from '../../web/js/engine/api.js';
import { installBans } from './bans.mjs';
import { spawnSync } from 'node:child_process';

const GOLDEN = JSON.parse(readFileSync(join(ROOT, 'test', 'golden', 'park', 'm1a.json'), 'utf8'));
const compiled = compileContent({ screens: ['app', 'debug', 'title'], checkText: false, sections: 'all' });
const park = compiled.rules.park;
const graph = buildGraph(park);
const mi = (x) => (x / 10).toFixed(1);

/** Run f with the engine's bans in place (Math.random, the approximate functions, Date, performance.now). */
function banned(f) {
  const restore = installBans();
  try {
    return f();
  } finally {
    restore();
  }
}

test('the compiled park: the scope cut, no names, no map positions, format 1', () => {
  assert.deepEqual(compiled.problems.filter((p) => p.level !== 'warn'), []);
  assert.equal(park.format, 1);
  assert.deepEqual(Object.keys(park).sort(), ['format', 'loops', 'movement', 'nodes', 'segs']);
  assert.equal(Object.keys(park.nodes).length, GOLDEN.counts.nodes);
  assert.equal(Object.keys(park.segs).length, GOLDEN.counts.routable, '49 segments less the 5 map-only');
  const text = JSON.stringify(park);
  assert.ok(!text.includes('map_xy') && !text.includes('"name"') && !text.includes('place'), 'display data stays out of the rules');
  for (const id of ['clear_lake->long_lake', 'long_lake->sol_duc_lake', 'long_lake->morgenroth_lake', 'morgenroth_lake->y_lake', 'morgenroth_lake->no_name_lake']) assert.ok(!park.segs[id], `${id} is map-only, never routed`);
  assert.deepEqual(park.loops.high_divide, { basin_via: 'lunch_lake', ccw_first: 'sol_duc_falls->hidden_lake_junction', crest_via: 'high_divide', cw_first: 'sol_duc_falls->sol_duc_river_1', trailhead: 'sol_duc_trailhead' });
  assert.equal(park.nodes.bogachiel_peak.spur_only, true);
  assert.equal(park.nodes.potholes.zone, 'high', 'Potholes (4,080 ft) is High');
  assert.equal(park.nodes.deer_lake.zone, 'north_mid', 'Deer Lake (3,530 ft) is North mid');
});

test('both loops, both ways: 18.4 by the crest, 18.7 through the basin (4.3, B.1)', () => {
  banned(() => {
    for (const l of GOLDEN.loops) {
      const r = route(graph, l.points);
      assert.deepEqual([r.mi10, r.gain, r.loss], [l.mi10, l.gain, l.loss], `${l.id}: ${mi(r.mi10)} mi +${r.gain}/-${r.loss}`);
    }
  });
});

test("the 24 M1a camps' miles both ways round, as 4.3's tables (distAlong)", () => {
  banned(() => {
    const ccw = distAlong(graph, GOLDEN.loop, 'ccw');
    const cw = distAlong(graph, GOLDEN.loop, 'cw');
    const camps = Object.keys(GOLDEN.camps.mi10);
    assert.equal(camps.length, GOLDEN.counts.plannable_camps);
    for (const id of camps) assert.deepEqual([ccw[id], cw[id]], GOLDEN.camps.mi10[id], `${id}: ${mi(ccw[id])} / ${mi(cw[id])}`);
    const b = GOLDEN.camps.bogachiel_peak;
    assert.deepEqual([ccw.bogachiel_peak, cw.bogachiel_peak], [b.ccw, b.cw]);
    // By the east spur: the trailhead to the east junction, then the spur.
    assert.equal(route(graph, [GOLDEN.trailhead, 'deer_lake', 'bogachiel_peak_junction']).mi10 + 1, b.ccw_east_spur);
    assert.ok(Object.isFrozen(ccw));
    const scope = JSON.parse(readFileSync(join(ROOT, 'content', 'scope', 'm1a.json'), 'utf8'));
    assert.deepEqual([...scope.park.camps, ...scope.park.desk].sort(), camps.sort(), "the golden's camps are the scope's plannable camps");
  });
});

test("the twelve fills, day by day, and their totals (B.1)", () => {
  banned(() => {
    assert.equal(GOLDEN.fills.length, 12);
    for (const f of GOLDEN.fills) {
      let total = 0;
      for (const d of f.days) {
        if (d === null) continue;
        const r = route(graph, d.points);
        const want = [d.mi10, ...(d.gain === undefined ? [] : [d.gain, d.loss])];
        const got = [r.mi10, ...(d.gain === undefined ? [] : [r.gain, r.loss])];
        assert.deepEqual(got, want, `${f.id}: ${d.points.join(' > ')} is ${mi(r.mi10)} mi +${r.gain}/-${r.loss}`);
        total += r.mi10;
      }
      assert.equal(total, f.mi10, `${f.id} totals ${mi(total)}`);
    }
  });
});

test("B.1's other miles: the crest with Lunch Lake down and back, 20.2 by the staircase and 20.6 by the Mirror Lake way trail", () => {
  banned(() => {
    for (const l of GOLDEN.b1_miles) {
      const r = route(graph, l.points);
      assert.deepEqual([r.mi10, r.gain, r.loss], [l.mi10, l.gain, l.loss], l.id);
    }
    const all = [...GOLDEN.loops, ...GOLDEN.b1_miles].map((l) => mi(l.mi10));
    for (const want of ['18.4', '18.7', '20.2', '20.6']) assert.ok(all.includes(want), `7.4's ${want}`);
    assert.ok(GOLDEN.fills.some((f) => f.mi10 === 204), "7.4's 20.4 (the two-night basin fill)");
  });
});

test("B.1's side trips there and back, and Lake Morgenroth's visit on the unscoped graph (M1b)", () => {
  banned(() => {
    for (const s of GOLDEN.side_trips) {
      const r = route(graph, s.points);
      assert.deepEqual([r.mi10, r.gain], [s.mi10, s.gain], s.id);
    }
    // The map-only links are drawn, never walked: on the M1a graph Morgenroth is out of reach.
    assert.throws(() => route(graph, GOLDEN.m1b[0].points), { name: 'EngineError', code: 'route' });
    const full = compileContent({ screens: ['app'], checkText: false, sections: 'all' }).rules.park;
    const regions = JSON.parse(readFileSync(join(ROOT, 'content', 'park', 'regions', 'sol_duc_high_divide.json'), 'utf8'));
    const segs = { ...full.segs };
    for (const id of ['clear_lake->long_lake', 'long_lake->morgenroth_lake']) {
      const s = regions.segments[id];
      segs[id] = { a: s.a, b: s.b, mi10: s.mi10, gain: s.gain, loss: s.loss, class: s.class, through: s.through, spur: s.spur };
    }
    const unscoped = buildGraph({ ...full, segs });
    assert.equal(route(unscoped, GOLDEN.m1b[0].points).mi10, GOLDEN.m1b[0].mi10);
  });
});

test('spot checks the doc and the data check quote: the rim to the trailhead in about 3.9 h, the climbs both ways, B.2 and B.6', () => {
  banned(() => {
    for (const c of GOLDEN.spot_checks) {
      const r = route(graph, c.points);
      assert.equal(r.mi10, c.mi10, c.id);
      if (c.gain !== undefined) assert.equal(r.gain, c.gain, `${c.id} gain`);
      if (c.loss !== undefined) assert.equal(r.loss, c.loss, `${c.id} loss`);
      if (c.steep !== undefined) assert.equal(r.steep, c.steep, `${c.id} steep`);
      if (c.hours_with_breaks_10 !== undefined) {
        const s = withBreaks(park.movement, r.s);
        // S4 freezes what its integer formula gives (12,457 s moving), and 7.4's "about 3.9 h" is its rounding.
        assert.equal(r.s, 12457);
        assert.equal(s, 13952);
        assert.equal(Math.round(s / 360), c.hours_with_breaks_10);
      }
    }
  });
});

test('the spur rule: Bogachiel Peak never shortcuts the crest (4.5, not 4.2; the loop 20.4, not 20.1)', () => {
  const sr = GOLDEN.spur_rule;
  assert.equal(route(graph, sr.points).mi10, sr.with);
  // The negative case: the same park with the peak a through node.
  const loose = buildGraph({
    ...park,
    nodes: { ...park.nodes, bogachiel_peak: { ...park.nodes.bogachiel_peak, spur_only: false } },
    segs: Object.fromEntries(Object.entries(park.segs).map(([id, s]) => [id, s.spur ? { ...s, through: true } : s])),
  });
  assert.equal(route(loose, sr.points).mi10, sr.without, 'without the rule the day is 4.2');
  const fill = GOLDEN.fills.find((f) => f.id === 'ccw_2_basin');
  const total = (g) => fill.days.filter(Boolean).reduce((a, d) => a + route(g, d.points).mi10, 0);
  assert.equal(total(graph), sr.loop_with);
  assert.equal(total(loose), sr.loop_without);
  // A leg that ends at the peak is followed by one that leaves by the segment it came up.
  const r = route(graph, ['high_divide', 'bogachiel_peak', 'mirror_lake_way_trail_junction']);
  const into = r.legs[0].edges[r.legs[0].edges.length - 1];
  const out = r.legs[1].edges[0];
  assert.equal(into.id, out.id);
  assert.equal(into.dir, -out.dir);
  // No route between two non-spur places passes through the peak.
  for (const [a, b] of [['bogachiel_peak_west_junction', 'bogachiel_peak_junction'], ['seven_lakes_basin', 'heart_lake_junction']]) assert.ok(!route(graph, [a, b]).legs[0].nodes.includes('bogachiel_peak'), `${a} to ${b}`);
});

test("the camp table is distance, trips are time: Cat Basin counterclockwise is 11.8 along the loop, 11.9 routed", () => {
  const d = GOLDEN.distance_not_time;
  assert.equal(distAlong(graph, GOLDEN.loop, d.dir)[d.to], d.dist_along);
  assert.equal(route(graph, [GOLDEN.trailhead, 'deer_lake', d.to]).mi10, d.route);
  assert.ok(route(graph, [GOLDEN.trailhead, 'deer_lake', d.to]).legs[1].nodes.includes('bruces_roost'), 'by time, by Bruce\'s Roost');
  // Without the direction gate every clockwise mile would collapse to its counterclockwise value.
  const both = buildGraph({ ...park, loops: { high_divide: { ...park.loops.high_divide, ccw_first: 'none', cw_first: 'none' } } });
  assert.equal(distAlong(both, GOLDEN.loop, 'cw').hidden_lake, GOLDEN.camps.mi10.hidden_lake[0]);
});

test('baseSeconds: integer, one rounding half up, as a hand computation of 7.4', () => {
  const m = park.movement;
  const seg = (id) => park.segs[id];
  // 0.4 mi at 2.4 mph is 600 s; 100 ft at 1,300 ft/h is 276.92 s: 876.92, so 877. Back: 600 + 27.69 = 628.
  assert.equal(baseSeconds(m, seg('round_lake_junction->lunch_lake'), 1), 877);
  assert.equal(baseSeconds(m, seg('round_lake_junction->lunch_lake'), -1), 628);
  // The staircase down: 750 s, and 540 - 200 = 340 steep ft at 2,000 ft/h, 612 s: 1,362 exactly. Up: 750 + 1,495.38.
  assert.equal(baseSeconds(m, seg('seven_lakes_basin->round_lake_junction'), 1), 1362);
  assert.equal(baseSeconds(m, seg('seven_lakes_basin->round_lake_junction'), -1), 2245);
  assert.equal(steepOf(m, 5, 540), 340);
  // Primitive trail x1.25: 0.7 mi is 1,312.5 s, and 30 ft 83.08 s: 1,395.58, so 1,396.
  assert.equal(baseSeconds(m, seg('heart_lake_junction->bruces_roost'), 1), 1396);
  // Half up, exactly: 0.1 mi of trail at x1.0 is 150 s; 13 ft is 36 s; 6.5 ft would be 18 s.
  assert.equal(baseSeconds(m, { mi10: 1, gain: 13, loss: 0, class: 'maintained' }), 186);
  for (const e of Object.values(graph.adj).flat()) assert.ok(Number.isSafeInteger(e.s) && e.s > 0, `${e.id} ${e.dir}`);
  assert.throws(() => baseSeconds(m, { mi10: 1, gain: 0, loss: 0, class: 'jetpack' }), { name: 'EngineError', code: 'format' });
  assert.throws(() => baseSeconds(m, { mi10: 1.5, gain: 0, loss: 0, class: 'maintained' }), { name: 'EngineError', code: 'format' });
});

test('route refuses what it cannot route (EngineError "route"), and the graph is frozen and ordered', () => {
  assert.throws(() => route(graph, ['sol_duc_trailhead']), { name: 'EngineError', code: 'route' });
  assert.throws(() => route(graph, ['sol_duc_trailhead', 'nowhere']), { name: 'EngineError', code: 'route' });
  assert.throws(() => route(graph, ['sol_duc_trailhead', 'lake_8']), { name: 'EngineError', code: 'route' }, 'a footnote no trail reaches');
  assert.throws(() => route(graph, ['sol_duc_trailhead', 'sol_duc_falls'], { ban: ['sol_duc_trailhead->sol_duc_falls'] }), { name: 'EngineError', code: 'route' });
  assert.throws(() => distAlong(graph, 'nope', 'ccw'), { name: 'EngineError', code: 'route' });
  assert.throws(() => distAlong(graph, GOLDEN.loop, 'up'), { name: 'EngineError', code: 'invalid' });
  assert.throws(() => buildGraph({ ...park, format: 2 }), { name: 'EngineError', code: 'format' });
  assert.throws(() => buildGraph({ ...park, segs: { ...park.segs, 'a->b': { a: 'a', b: 'b', mi10: 1, gain: 0, loss: 0, class: 'maintained', through: true, spur: null } } }), { name: 'EngineError', code: 'format' });
  assert.ok(Object.isFrozen(graph) && Object.isFrozen(graph.adj) && Object.isFrozen(graph.adj.lunch_lake));
  for (const list of Object.values(graph.adj)) for (let i = 1; i < list.length; i++) assert.ok(list[i - 1].id <= list[i].id, 'adjacency by segment id');
  const same = route(buildGraph(JSON.parse(JSON.stringify(park))), GOLDEN.loops[0].points);
  assert.deepEqual(same, route(graph, GOLDEN.loops[0].points), 'the same park routes the same way twice');
  const zero = route(graph, ['lunch_lake', 'lunch_lake']);
  assert.deepEqual([zero.mi10, zero.s, zero.legs[0].nodes], [0, 0, ['lunch_lake']], 'a layover is a leg of nothing');
});

test("the content loader carries the park (park()), refuses a malformed one, and the API exports the router at API 1", () => {
  const { rules } = compiled;
  const voice = { format: 1, stops: {} };
  const c = loadContent({ rules: JSON.parse(JSON.stringify(rules)), voice, rulesHash: '000000000001' });
  assert.equal(c.park().format, 1);
  assert.ok(Object.isFrozen(c.park().nodes.lunch_lake));
  assert.equal(route(buildGraph(c.park()), GOLDEN.loops[0].points).mi10, 184, 'the loaded park routes');
  const { park: _p, ...noPark } = rules;
  assert.equal(loadContent({ rules: JSON.parse(JSON.stringify(noPark)), voice, rulesHash: '000000000001' }).park(), null);
  assert.throws(() => loadContent({ rules: { ...JSON.parse(JSON.stringify(rules)), park: { format: 2 } }, voice, rulesHash: '000000000001' }), { name: 'EngineError', code: 'format' });
  assert.throws(() => loadContent({ rules: { ...JSON.parse(JSON.stringify(rules)), park: null }, voice, rulesHash: '000000000001' }), { name: 'EngineError', code: 'format' });
  assert.equal(api.API, 1);
  for (const f of ['buildGraph', 'route', 'distAlong', 'baseSeconds']) assert.equal(typeof api[f], 'function', f);
});

test('the bans hold for the router in a child whose bans come before any engine module loads', () => {
  const loops = GOLDEN.loops.map((l) => l.points);
  const r = spawnSync(process.execPath, [join(ROOT, 'test', 'unit', 'banpark.mjs')], { input: JSON.stringify({ park, loops }), encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const got = JSON.parse(r.stdout);
  assert.equal(got.banned, true, 'the bans were in place');
  assert.deepEqual(got.loops, loops.map((pts) => {
    const x = route(graph, pts);
    return [x.mi10, x.gain, x.loss, x.s];
  }), 'the same miles and seconds as Node without the bans');
  for (const [id, [a, b]] of Object.entries(GOLDEN.camps.mi10)) assert.deepEqual([got.ccw[id], got.cw[id]], [a, b], id);
});
