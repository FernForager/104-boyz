// Ingest (BUILD_PLAN 3.2, 6.5, S4; GAME_DESIGN 4.1, E.4): the committed
// generated content is exactly a fresh run's, the lock holds, the report has
// no unexplained errors, and each E.4 rule does what it says on small
// fixtures. This test is where `npm run ci` re-runs ingest in full.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { runIngest, checkIngest, checkLock, englishIn, estimatesWithout, stableJson, listFiles, INPUTS, TOOLS, LOCK_FILE, REPORT_FILE, firstDifference } from '../../tools/ingest.mjs';
import { ingestRegions, parseSnow, mi10Of, doyOf, tideLimit } from '../../tools/ingest/regions.mjs';
import { explain, covers, sortEntries } from '../../tools/ingest/report.mjs';
import { route } from '../../web/js/engine/graph.js';

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const run = runIngest();

test('ingest --check: a fresh run reproduces every committed byte, with no unexplained error or warning', () => {
  const c = checkIngest();
  assert.equal(c.diff, null, c.diff ? `${c.diff.path}:${c.diff.line}: ${c.diff.msg}` : '');
  assert.deepEqual(c.unexplained.map((e) => `${e.code} ${e.where}: ${e.msg}`), []);
  assert.deepEqual(c.stale, [], 'every acknowledgement in ingest_known.json acknowledges something');
  assert.equal(c.ok, true);
  assert.deepEqual(run.entries.filter((e) => e.level === 'error'), [], 'zero errors (Done when 2)');
  for (const e of run.entries.filter((x) => x.scope)) assert.notEqual(e.level, 'warn', `nothing inside the M1a scope is a mere warning: ${e.where}`);
});

test('two runs give the same bytes, in the generated format (sorted keys, one-space indent, a final newline)', () => {
  const again = runIngest();
  assert.deepEqual([...again.files.keys()], [...run.files.keys()]);
  for (const [p, text] of run.files) assert.equal(again.files.get(p), text, p);
  for (const [p, text] of run.files) {
    if (!p.endsWith('.json')) continue;
    assert.equal(text, stableJson(JSON.parse(text)), `${p} is in the stable format`);
    assert.ok(JSON.parse(text).$comment.includes('npm run ingest'), `${p} says how it is made`);
  }
  assert.ok(run.files.has(REPORT_FILE) && run.files.has(LOCK_FILE));
  for (const r of ['coast', 'elwha_hurricane', 'hamma_hamma', 'hoh_olympus', 'northeast_dose', 'sol_duc_high_divide', 'south_quinault_skok']) assert.ok(run.files.has(`content/park/regions/${r}.json`), `all seven regions: ${r}`);
});

test('IG21: no English in any generated file, and the check finds a planted line', () => {
  assert.deepEqual(run.entries.filter((e) => e.code === 'IG21'), []);
  // The gazetteer (content/text/names/places.json, S4 track B) is the one generated file of words, by design.
  for (const [p, text] of run.files) if (p.endsWith('.json') && !p.startsWith('content/text/')) assert.deepEqual(englishIn(p, JSON.parse(text)), [], p);
  assert.deepEqual([...run.files.keys()].filter((p) => p.startsWith('content/text/')), ['content/text/names/places.json']);
  const planted = englishIn('x.json', { $comment: 'Words are fine here.', a: 'lunch_lake', b: ['https://www.nps.gov/olym/'], c: { d: 'A deep blue lake.' }, e: '2026-10-07', f: 'a->b', g: '07-01' });
  assert.deepEqual(planted.map((e) => e.where), ['x.json:c.d']);
});

test('IG20: an estimate in a generated file carries its evidence, beside it or in the report', () => {
  assert.deepEqual(run.entries.filter((e) => e.code === 'IG20'), []);
  const out = estimatesWithout('content/x/y.json', { a: { estimate: true }, b: { estimate: true, evidence: 'NPS' }, c: [{ estimate: true }], d: { estimate: false } }, [{ where: 'content/x/y.json:c[0]' }]);
  assert.deepEqual(out.map((e) => e.where), ['content/x/y.json:a']);
  assert.match(run.report, /`sol_duc_high_divide\/m1a_play_inputs`: place fields/);
  assert.ok(/gain \d+ ft, derived/.test(run.report), 'derived gains are listed as estimates');
});

test("E.4's tide rule (IG22): a tide limit in a coast segment's notes is proposed as its tide_max_ft, every one listed in the report, none in the region file", () => {
  assert.deepEqual(tideLimit('NPS tidal restriction 4.3 mi north of Rialto TH, 4 ft or lower, and NO overland trail'), { ft: 4, phrases: ['4 ft or lower'] });
  assert.deepEqual(tideLimit('may be underwater above 4.5 ft (NPS: 3.0 mi south)'), { ft: 4.5, phrases: ['underwater above 4.5 ft'] });
  assert.equal(tideLimit('two pinches at 5 ft and 4 ft').ft, 4, 'the strictest of two');
  assert.equal(tideLimit('multiple tidal restrictions of 4-6 ft').ft, 4);
  assert.equal(tideLimit('needs about +1 ft or lower').ft, 1);
  assert.equal(tideLimit('barefoot at -1 ft, ankle-deep at ~+1 ft, knee-deep at the mouth around +6 ft'), null, 'depths at a tide are no limit');
  assert.equal(tideLimit('both climb ~250 ft bluffs; a rope ended ~25 ft above the beach'), null, 'heights of other things are no limit');
  assert.equal(tideLimit('tide pools best below about +1 ft'), null);
  assert.equal(tideLimit(null), null);
  const tides = run.entries.filter((e) => e.code === 'IG22');
  assert.ok(tides.every((e) => e.level === 'info' && e.where.startsWith('coast/')), 'proposals, on the coast only');
  const proposed = Object.fromEntries(tides.filter((e) => e.msg.startsWith('propose')).map((e) => [e.where.slice('coast/'.length), Number(/tide_max_ft (-?[\d.]+)/.exec(e.msg)[1])]));
  assert.deepEqual(proposed, {
    'cape_johnson->chilean_memorial': 4,
    'chilean_memorial->hole_in_the_wall': 5,
    'jefferson_cove->diamond_rock': 2,
    'point_of_the_arches->father_and_son_cove': 4,
    'saddle_rock->cape_johnson': 5.5,
    'scott_creek->strawberry_point': 4,
    'scotts_bluff->scott_creek': 1,
    'seafield_creek->north_side_ozette_river': 6,
    'south_sand_point->yellow_banks': 5,
    'south_side_ozette_river->cape_alava': 4,
    'taylor_point_south_cove->scotts_bluff': 4.5,
    'yellow_banks->norwegian_memorial': 6,
  });
  const none = tides.filter((e) => !e.msg.startsWith('propose')).map((e) => e.where);
  assert.ok(none.includes('coast/shi_shi_beach->point_of_the_arches') && none.includes('coast/cape_alava->wedding_rocks_petroglyphs'), 'a tide-dependent segment whose notes give no height is listed for the overlay');
  const coast = read('content/park/regions/coast.json');
  assert.ok(Object.values(coast.segments).every((s) => !('tide_max_ft' in s)), 'proposals only: the coast overlay confirms each (M4)');
  for (const e of tides) assert.ok(run.report.includes(`\`${e.where}\`: ${e.msg}`), `the report lists ${e.where} in full`);
});

test("the report: counts first, no errors, every warning with its acknowledgement, and the doubts", () => {
  const md = run.report;
  assert.match(md, /^# Ingest report\n/);
  assert.ok(md.indexOf('## Counts') < md.indexOf('## Errors') && md.indexOf('## Errors') < md.indexOf('## Warnings') && md.indexOf('## Warnings') < md.indexOf('## Fixes') && md.indexOf('## Fixes') < md.indexOf('## Estimates') && md.indexOf('## Estimates') < md.indexOf('## Doubts'));
  assert.match(md, /## Errors\n\nNone\./);
  for (const [k, v] of [['Regions', 7], ['Node records', 510], ['Unique nodes', 497], ['Shared node ids', 13], ['Segment records', 496], ['Unique segments', 492], ['Shared segments (merged across regions)', 4], ['M1a scope: nodes', 47], ['M1a scope: segments (both ends in the scope)', 49], ['M1a scope: map-only segments', 5]]) assert.ok(md.includes(`| ${k} | ${v} |`), `${k}: ${v}`);
  assert.match(md, /D3\. The loop has 49 segments/);
  assert.match(md, /D4\. high_divide_loop_2n_classic/);
  // S4's doubts the docs and the source have since answered are kept, as
  // resolved, each saying where; the live list holds only the open ones.
  const [live, resolved] = md.slice(md.indexOf('## Doubts\n')).split('## Doubts resolved\n');
  assert.ok(resolved, 'a resolved part');
  for (const d of ['D1', 'D2', 'D3', 'D4', 'D5', 'D8']) {
    assert.ok(!live.includes(`- ${d}. `), `${d} is no longer a live doubt`);
    assert.match(resolved, new RegExp(`^- ${d}\\. .*Resolved 2026-10-09.*FACT_CHECK\\.md`, 'm'), `${d}: resolved, and where`);
  }
  for (const d of ['D6', 'D7']) assert.ok(live.includes(`- ${d}. `), `${d} is still open`);
  for (const stale of ['prints 6:07', 'say about 2 hours 10', 'still says "Begin a new book"', 'runs a minute late']) assert.ok(!md.includes(stale), `no stale claim: ${stale}`);
  assert.match(md, /WAG bags/, 'the stale rule text is listed (IG11)');
  assert.match(md, /uncertain_claims\[0\]/, "the M1a region's uncertain claims, by index");
  const warns = run.entries.filter((e) => e.level === 'warn');
  assert.ok(md.includes(`${warns.length} warnings: ${warns.length} acknowledged`));
});

test('the Sol Duc region, as normalized: Lunch Lake and the staircase to it (the spec\'s A2 example)', () => {
  const r = read('content/park/regions/sol_duc_high_divide.json');
  assert.equal(r.format, 1);
  assert.equal(r.researched_on, '2026-10-07');
  const n = r.nodes.lunch_lake;
  assert.deepEqual([n.type, n.elev_ft, n.elev_est, n.lat, n.lon, n.zone, n.spur_only], ['camp', 4450, false, 47.9167, -123.7841, 'high', false]);
  assert.deepEqual(n.camp, { sites: 9, group_site: false, stock_site: false, group_sites: 0, stock_sites: 0, desk: false, bear_can: true, food_storage: 'can', fires: false, toilet: true });
  assert.deepEqual([n.place.map_xy, n.place.canopy, n.place.cold_pool, n.place.water, n.place.view_score, n.place.traffic, n.place.lily], [[26, 26], 0.2, true, { 8: 'sure', 9: 'sure' }, 2, 'basin', { m1a: 0, from_m1b: 1 }]);
  assert.equal(n.place.snow_feature.estimate, true);
  const s = r.segments['round_lake_junction->lunch_lake'];
  assert.deepEqual([s.a, s.b, s.mi10, s.gain, s.loss, s.est, s.class, s.through, s.spur, s.one_way, s.hazards, s.snow_free_doy], ['round_lake_junction', 'lunch_lake', 4, 100, 10, [], 'maintained', true, null, false, ['steep'], [[196, 278]]]);
  assert.deepEqual(r.trailheads.sol_duc_trailhead, { drive_min: { forks: 69, port_angeles: 82, quilcene_or_hoodsport: 150 }, drive_est: true });
  const p = r.presets.high_divide_loop_2n_classic;
  assert.deepEqual([p.trailhead, p.shape, p.nights, p.mi10, p.typed_mi10], ['sol_duc_trailhead', 'loop', [2, 2], 204, 204]);
  assert.deepEqual(p.days.map((d) => [d.to, d.mi10, d.typed_mi10]), [['lunch_lake', 78, 78], ['heart_lake', 45, 45], ['sol_duc_trailhead', 81, 81]]);
  assert.deepEqual(r.hazards.snowfield_high_divide.tags, ['snowfield']);
  assert.ok(r.nodes.bruces_roost.camp.desk && r.nodes.cat_basin.camp.desk && r.nodes.hidden_lake.camp.desk, 'the desk camps');
  assert.deepEqual(r.nodes.c_b_flats_group_site.shared_with, ['hoh_olympus']);
  assert.ok(r.segments['hoh_lake_trail_junction->c_b_flats_group_site'], "one id for the Hoh Lake Trail's lower segment: hoh_olympus's");
  assert.ok(!r.segments['c_b_flats_group_site->hoh_lake_trail_junction']);
  // Every one of the loop's 19 hazard words maps to a canonical tag, never to x_.
  const scope = read('content/scope/m1a.json');
  const inScope = new Set(scope.park.nodes);
  for (const [id, seg] of Object.entries(r.segments)) if (inScope.has(seg.a) && inScope.has(seg.b)) for (const h of seg.hazards) assert.ok(!h.startsWith('x_'), `${id}: ${h}`);
  // Every preset on the loop routes to its typed miles.
  for (const [id, pr] of Object.entries(r.presets)) if (pr.days.every((d) => inScope.has(d.to))) for (const d of pr.days) assert.ok(Math.abs(d.mi10 - d.typed_mi10) <= 1, `${id} ${d.to}`);
});

test('the hazard vocab maps every word the seven regions use, each to one tag', () => {
  const vocab = read('content/park/vocab/hazards.json');
  const seen = new Map();
  for (const [tag, words] of Object.entries(vocab.tags)) for (const w of words) {
    assert.ok(!seen.has(w), `${w} is on ${seen.get(w)} and ${tag}`);
    seen.set(w, tag);
  }
  assert.equal(Object.keys(vocab.tags).length, 34);
  const used = new Set();
  for (const f of listFiles(ROOT, [{ dir: 'design/data/regions', ext: '.json' }])) for (const s of read(f).segments) for (const h of s.hazards || []) used.add(h);
  assert.equal(used.size, 113);
  for (const w of used) assert.ok(seen.has(w) || Object.prototype.hasOwnProperty.call(vocab.not_hazards, w), w);
  for (const w of ['blowdown', 'bridge', 'brush', 'crowds', 'exposure', 'fog', 'fragile_meadow', 'heat', 'ledges', 'lightning', 'mosquitoes', 'mud', 'no_water', 'route_finding', 'slippery_rock', 'snowfield', 'steep', 'steep_scree', 'steep_steps']) assert.ok(seen.has(w), `the loop's ${w}`);
});

// ---- The rules, on small fixtures --------------------------------------------

const VOCAB = read('content/park/vocab/hazards.json');
const ZONES = read('content/park/vocab/zones.json');
const MOVEMENT = read('content/rules/movement.json');
const node = (id, more = {}) => ({ id, name: id, type: 'junction', elevation_ft: 1000, lat: 47.9, lon: -123.8, camp: null, description: 'x', scene_art_notes: 'x', sources: ['https://www.nps.gov/olym/'], ...more });
const seg = (from, to, more = {}) => ({ from, to, miles: 1, gain_ft: 0, loss_ft: 0, trail_class: 'maintained', hazards: [], snow_free_typical: 'year-round', notes: 'x', sources: [], ...more });
const region = (id, nodes, segments, more = {}) => ({ file: `design/data/regions/${id}.json`, data: { region_id: id, researched_on: '2026-10-07', nodes, segments, trailheads: [], classic_trips: [], hazards: [], sources: [], ...more } });
const fx = (regions, scopeNodes = [], overlays = {}) => ingestRegions({ regions, hazards: VOCAB, zones: ZONES, overlays, scope: { park: { nodes: scopeNodes, play: ['aa'], footnotes: [], map_only: [] } }, movement: MOVEMENT });
const codesOf = (r, code) => r.entries.filter((e) => e.code === code);

test('a segment written one way walks both ways, gain and loss swapped (the reverse is synthesized)', () => {
  const r = fx([region('aa', [node('th', { type: 'trailhead' }), node('x', { elevation_ft: 1500 })], [seg('th', 'x', { gain_ft: 600, loss_ft: 100 })])]);
  const back = route(r.graph, ['x', 'th']);
  assert.deepEqual([back.mi10, back.gain, back.loss, back.legs[0].edges[0].dir], [10, 100, 600, -1]);
  assert.equal(r.counts.find(([k]) => k.startsWith('Directed edges'))[1], 2);
});

test('a null gain or loss is derived from the endpoints and flagged in est (IG04); a null distance stays out of routing', () => {
  const r = fx([region('aa', [node('a', { elevation_ft: 1000 }), node('b', { elevation_ft: 1400 }), node('c', { elevation_ft: 900 })], [seg('a', 'b', { gain_ft: null, loss_ft: null }), seg('b', 'c', { gain_ft: 200, loss_ft: null }), seg('a', 'c', { miles: null })])]);
  const s = r.normalized.get('aa').segments;
  assert.deepEqual([s['a->b'].gain, s['a->b'].loss, s['a->b'].est], [400, 0, ['gain', 'loss']]);
  assert.deepEqual([s['b->c'].gain, s['b->c'].loss, s['b->c'].est], [200, 700, ['loss']], 'with the gain known, the loss still meets the endpoints');
  assert.deepEqual(s['a->c'].est, ['mi10']);
  assert.equal(codesOf(r, 'IG04').filter((e) => e.level === 'info').length, 3);
  assert.equal(codesOf(r, 'IG04').filter((e) => e.level === 'warn').length, 1);
  assert.throws(() => route(r.graph, ['a', 'c'], { ban: ['a->b'] }), { code: 'route' }, 'the distance-less segment is not walked');
});

test('a null elevation is the mean of its neighbors to 10 ft, an estimate (IG05); inside the scope with no neighbor, an error', () => {
  const r = fx([region('aa', [node('a', { elevation_ft: 1000 }), node('b', { elevation_ft: null }), node('c', { elevation_ft: 1550 }), node('d', { elevation_ft: null })], [seg('a', 'b'), seg('b', 'c')])], ['a', 'b', 'c', 'd']);
  const n = r.normalized.get('aa').nodes;
  assert.deepEqual([n.b.elev_ft, n.b.elev_est], [1280, true], '(1000 + 1550) / 2 = 1275, half up to 1280');
  const e = codesOf(r, 'IG05').find((x) => x.where === 'aa/d');
  assert.equal(e.level, 'error');
});

test('a shared node merges; 150 ft apart inside the scope is an error (IG02), outside a warning', () => {
  const a = region('aa', [node('p', { elevation_ft: 5000 }), node('q')], [seg('p', 'q')]);
  const b = region('bb', [node('p', { elevation_ft: 5150, lat: null })], []);
  const inside = fx([a, b], ['p', 'q']);
  assert.equal(codesOf(inside, 'IG02')[0].level, 'error');
  const outside = fx([a, b], []);
  assert.equal(codesOf(outside, 'IG02')[0].level, 'warn');
  const n = outside.normalized.get('bb').nodes.p;
  assert.deepEqual([n.elev_ft, n.lat, n.shared_with], [5000, 47.9, ['aa']], "the first region's record, its nulls filled");
  const agree = fx([a, region('bb', [node('p', { elevation_ft: 5040 })], [])], ['p', 'q']);
  assert.equal(codesOf(agree, 'IG02')[0].level, 'info');
});

test('the same segment in two regions, written the other way, is one segment with the first region\'s id and numbers (IG03)', () => {
  const a = region('aa', [node('p'), node('q', { elevation_ft: 1200 })], [seg('p', 'q', { gain_ft: 200, loss_ft: 0, hazards: ['mud'] })]);
  const b = region('bb', [node('p'), node('q', { elevation_ft: 1200 })], [seg('q', 'p', { gain_ft: 0, loss_ft: 210, hazards: ['blowdown'] })]);
  const r = fx([a, b]);
  assert.deepEqual(Object.keys(r.normalized.get('bb').segments), ['p->q']);
  assert.deepEqual(r.normalized.get('bb').segments['p->q'].hazards, ['blowdown', 'mud'], 'the hazards joined');
  assert.equal(r.normalized.get('bb').segments['p->q'].gain, 200);
  assert.ok(codesOf(r, 'IG03').some((e) => e.level === 'info' && /merged/.test(e.msg)));
  const loopPair = fx([region('aa', [node('p'), node('q')], [seg('p', 'q'), seg('q', 'p', { miles: 1.2 })])]);
  assert.deepEqual(Object.keys(loopPair.normalized.get('aa').segments).sort(), ['p->q', 'q->p'], 'inside one region, two trails');
  assert.equal(codesOf(loopPair, 'IG03').length, 1);
});

test('an unknown hazard word becomes x_<word> with a warning (IG06); a status leaves the segment for the conditions (IG07)', () => {
  const r = fx([region('aa', [node('p'), node('q')], [seg('p', 'q', { hazards: ['mud', 'quicksand', 'trail_closed_2026', 'no_camping_zone'] })])]);
  const s = r.normalized.get('aa').segments['p->q'];
  assert.deepEqual(s.hazards, ['mud', 'x_quicksand']);
  assert.equal(s.no_camping, true);
  assert.equal(codesOf(r, 'IG06').find((e) => e.level === 'warn').msg.includes('x_quicksand'), true);
  assert.deepEqual(r.statuses.map(({ applies_to, from, persists, last_confirmed, effect, derived_from }) => ({ applies_to, from, persists, last_confirmed, effect, derived_from })), [{ applies_to: ['p->q'], from: null, persists: true, last_confirmed: '2026-10-07', effect: 'closure', derived_from: 'hazard' }]);
  assert.equal(codesOf(r, 'IG07').length, 1);
});

test('presets: each day routed and the typed miles kept (IG09); one that ends nowhere is rejected (IG10), an error inside the scope', () => {
  const nodes = [node('th', { type: 'trailhead' }), node('camp', { type: 'camp' }), node('pass')];
  const segs = [seg('th', 'camp', { miles: 2.0 }), seg('camp', 'pass', { miles: 1.5 })];
  const trips = [
    { id: 'good', name: 'x', trailhead: 'th', shape: 'out_and_back', nights_typical: [1, 1], itinerary: [{ day: 1, to: 'camp', miles: 2.1, gain_ft: 0 }, { day: 2, to: 'th', miles: 2.0, gain_ft: 0 }], total_miles: 4.0, difficulty: 'easy' },
    { id: 'off', name: 'x', trailhead: 'th', shape: 'out_and_back', nights_typical: [1, 1], itinerary: [{ day: 1, to: 'camp', miles: 3.0 }, { day: 2, to: 'th', miles: 2.0 }], total_miles: 5.0 },
    { id: 'nowhere', name: 'x', trailhead: 'th', shape: 'traverse', nights_typical: [1, 1], itinerary: [{ day: 1, to: 'camp', miles: 2 }, { day: 2, to: 'pass', miles: 1.5 }], total_miles: 3.5 },
  ];
  const r = fx([region('aa', nodes, segs, { classic_trips: trips })], ['th', 'camp', 'pass']);
  const p = r.normalized.get('aa').presets;
  assert.deepEqual(Object.keys(p), ['good', 'off']);
  assert.deepEqual(p.good.days.map((d) => [d.mi10, d.typed_mi10]), [[20, 21], [20, 20]], 'the graph\'s miles, the typed ones beside them');
  assert.equal(codesOf(r, 'IG09').find((e) => e.where === 'aa/off/day1').level, 'error', 'inside the scope a difference is an error');
  assert.equal(codesOf(r, 'IG10')[0].level, 'error');
  assert.match(codesOf(r, 'IG10')[0].msg, /ends at pass, not a trailhead/);
  const outside = fx([region('aa', nodes, segs, { classic_trips: trips })], []);
  assert.equal(codesOf(outside, 'IG09').find((e) => e.where === 'aa/off/day1').level, 'warn');
  assert.equal(codesOf(outside, 'IG10')[0].level, 'warn');
  // An overlay's turnaround pin makes an out-and-back day routable.
  const day = [{ id: 'day', name: 'x', trailhead: 'th', shape: 'out_and_back', nights_typical: [0, 0], itinerary: [{ day: 1, to: 'th', miles: 7.0 }], total_miles: 7.0 }];
  const unpinned = fx([region('aa', nodes, segs, { classic_trips: day })], []);
  assert.match(codesOf(unpinned, 'IG10')[0].msg, /turnaround/);
  const pinned = fx([region('aa', nodes, segs, { classic_trips: day })], [], { aa: { presets: { day: { days: { 1: { via: ['pass'], doc: 'test' } } } } } });
  assert.equal(pinned.normalized.get('aa').presets.day.mi10, 70);
});

test('a Strava link is stripped (IG12), and a source that is not a URL is not carried', () => {
  const r = fx([region('aa', [node('p', { sources: ['https://www.strava.com/activities/1', 'https://www.nps.gov/olym/', 'firsthand: a hiker'] })], [])]);
  assert.deepEqual(r.normalized.get('aa').nodes.p.sources, ['https://www.nps.gov/olym/']);
  assert.equal(codesOf(r, 'IG12').length, 1);
});

test('IG01: a region, node or segment missing its required fields is an error', () => {
  const r = fx([region('aa', [node('p'), { id: 'q', type: 'junction' }], [{ from: 'p', to: 'q' }])]);
  assert.equal(codesOf(r, 'IG01').filter((e) => e.level === 'error').length, 2);
  const none = fx([{ file: 'design/data/regions/zz.json', data: { region_id: 'zz' } }]);
  assert.ok(codesOf(none, 'IG01').some((e) => /researched_on/.test(e.msg)));
});

test('IG08: snow phrases parse to day-of-year windows; one that can\'t is null', () => {
  assert.deepEqual(parseSnow('mid-July to early October typical (NPS)'), [[196, 278]]);
  assert.deepEqual(parseSnow('year-round in most years (Sol Duc Road is often closed by snow and ice in winter)'), [[1, 366]]);
  assert.deepEqual(parseSnow('usually late May/June to October; lingering snow possible into June'), [[doyOf(5, 25), doyOf(10, 31)]]);
  assert.deepEqual(parseSnow('above 3,500 ft snow-covered Nov-June; typically snow-free mid-Jul to mid-Oct'), [[doyOf(7, 15), doyOf(10, 15)]], 'the snow-free range, not the snowy one');
  assert.deepEqual(parseSnow('Obstruction Point Road open mid-June through Oct 15 weather permitting'), [[doyOf(6, 15), doyOf(10, 15)]]);
  assert.deepEqual(parseSnow('never snow-free; climbing season late June to mid-August'), []);
  assert.equal(parseSnow('most of the year'), null);
  assert.equal(parseSnow(null), null);
  assert.equal(doyOf(7, 15), 196);
  // A phrase that doesn't parse is a warning, until the overlay supplies the window.
  const r = fx([region('aa', [node('p'), node('q')], [seg('p', 'q', { snow_free_typical: 'most of the year' })])]);
  assert.equal(codesOf(r, 'IG08').find((e) => e.where === 'aa/p->q').level, 'warn');
  assert.equal(r.normalized.get('aa').segments['p->q'].snow_free_doy, null);
  const o = fx([region('aa', [node('p'), node('q')], [seg('p', 'q', { snow_free_typical: 'most of the year' })])], [], { aa: { segments: { 'p->q': { snow_free_doy: [[100, 300]], source: 'test' } } } });
  assert.deepEqual(codesOf(o, 'IG08').map((e) => e.level), ['info']);
  assert.deepEqual(o.normalized.get('aa').segments['p->q'].snow_free_doy, [[100, 300]]);
});

test('distances read to the hundredth round to tenths, half up', () => {
  assert.deepEqual([0.95, 0.05, 1.85, 0.25, 3.65, 18.4, 0.1].map(mi10Of), [10, 1, 19, 3, 37, 184, 1]);
});

test('the report helpers: acknowledgements by key and by prefix, and stale ones found', () => {
  const entries = [{ code: 'IG04', level: 'warn', where: 'aa/x', msg: 'm' }, { code: 'IG08', level: 'warn', where: 'bb/y', msg: 'm' }, { code: 'IG09', level: 'error', where: 'aa/z', msg: 'm' }];
  const { acknowledged, unexplained, stale } = explain(entries, { 'IG04:aa/*': { why: 'w' }, 'IG10:cc/*': { why: 'w' }, 'G03:aa/*': { why: 'the lint\'s' } });
  assert.deepEqual(acknowledged.map((a) => a.ack), ['IG04:aa/*']);
  assert.deepEqual(unexplained.map((e) => e.code), ['IG08', 'IG09']);
  assert.deepEqual(stale, ['IG10:cc/*'], "a G key is the graph lint's to check");
  assert.ok(covers('IG04:aa/*', 'IG04:aa/b') && !covers('IG04:aa/b', 'IG04:aa/bc'));
  assert.deepEqual(sortEntries([{ code: 'IG09', where: 'a', msg: '' }, { code: 'IG01', where: 'b', msg: '' }]).map((e) => e.code), ['IG01', 'IG09']);
});

/** A copy of everything ingest reads and hashes, in a temp folder. */
function ingestTree(t) {
  const root = mkdtempSync(join(tmpdir(), 'oph-ingest-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const files = [...listFiles(ROOT, INPUTS), ...listFiles(ROOT, TOOLS), ...[...run.files.keys()]];
  for (const f of files) {
    if (!existsSync(join(ROOT, f))) continue;
    mkdirSync(dirname(join(root, f)), { recursive: true });
    cpSync(join(ROOT, f), join(root, f));
  }
  return root;
}

test('checkLock: the committed lock holds; one changed byte in an input, a tool or an output, or a stray generated file, breaks it', (t) => {
  assert.deepEqual(checkLock(), { ok: true, problems: [] });
  const lock = read(LOCK_FILE);
  assert.deepEqual(Object.keys(lock.inputs).sort(), listFiles(ROOT, INPUTS).sort(), 'every input is locked');
  assert.match(lock.tools, /^[0-9a-f]{64}$/);
  const root = ingestTree(t);
  assert.deepEqual(checkLock({ root }), { ok: true, problems: [] }, 'a faithful copy holds');
  const src = join(root, 'design', 'data', 'regions', 'coast.json');
  const before = readFileSync(src);
  writeFileSync(src, `${before} `);
  assert.deepEqual(checkLock({ root }).problems, ['design/data/regions/coast.json changed']);
  writeFileSync(src, before);
  const out = join(root, 'content', 'park', 'regions', 'coast.json');
  writeFileSync(out, readFileSync(out, 'utf8').replace('"format": 1', '"format": 1 '));
  assert.match(checkLock({ root }).problems[0], /coast\.json was edited/);
  assert.match(firstDifference(root, run.files).msg, /differs from a fresh run/);
  cpSync(join(ROOT, 'content', 'park', 'regions', 'coast.json'), out);
  writeFileSync(join(root, 'content', 'park', 'regions', 'extra.json'), '{}\n');
  assert.match(checkLock({ root }).problems[0], /extra\.json is not a generated file/);
  rmSync(join(root, 'content', 'park', 'regions', 'extra.json'));
  writeFileSync(join(root, 'tools', 'ingest.mjs'), `${readFileSync(join(root, 'tools', 'ingest.mjs'), 'utf8')}\n`);
  assert.deepEqual(checkLock({ root }).problems, ['the ingest tools changed']);
});
