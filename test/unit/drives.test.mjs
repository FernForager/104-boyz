// The drives from the cabin (BUILD_PLAN 2.6, S4; GAME_DESIGN 2.2, 3.3):
// content/drive/routes.json.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { readText, nameOf } from '../../tools/text.mjs';
import { readSchemas, compileSources, readSources } from '../../tools/content.mjs';
import { validate } from '../../tools/schema.mjs';
import { lintT16 } from '../../tools/textlint.mjs';

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const drives = read('content/drive/routes.json');
const text = readText(ROOT);

test('the file validates, and every estimate has its evidence', () => {
  assert.deepEqual(validate(readSchemas(ROOT)['drives.schema.json'], drives).errors, []);
  const visit = (v, path) => {
    if (Array.isArray(v)) v.forEach((x, i) => visit(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') {
      if (v.estimate === true) assert.ok(typeof v.evidence === 'string' && v.evidence.length > 10, `${path} carries its evidence`);
      for (const [k, x] of Object.entries(v)) visit(x, `${path}.${k}`);
    }
  };
  visit(drives, '');
});

test("the Sol Duc drive: its legs sum to its minutes, so 6:15 arrives at 8:24:00 (3.3; doubt D2)", () => {
  const r = drives.routes.sol_duc;
  assert.equal(r.legs.reduce((a, l) => a + l.minutes, 0), r.minutes);
  assert.equal(r.minutes, 129);
  assert.equal(r.trip_time, true);
  const leave = 6 * 3600 + 15 * 60;
  const arrive = leave + r.minutes * 60;
  assert.equal(`${Math.floor(arrive / 3600)}:${String(Math.floor(arrive / 60) % 60).padStart(2, '0')}:${String(arrive % 60).padStart(2, '0')}`, '8:24:00', 'the doc says about 8:25');
  // The Forks leg is the region data's own number.
  const region = read('content/park/regions/sol_duc_high_divide.json');
  assert.equal(r.legs[1].minutes, region.trailheads.sol_duc_trailhead.drive_min.forks);
  assert.equal(drives.routes.town.trip_time, false, 'the town run costs no trip time (2.2)');
  assert.equal(drives.routes.town.minutes, 180, 'about three hours (NPS)');
});

test('every place a drive names is a place in the gazetteer, and T16 checks them', () => {
  const roads = new Set(Object.keys(drives.roads));
  for (const r of Object.values(drives.routes)) {
    for (const id of [r.to, ...r.through, ...(r.legs || []).map((l) => l.to)]) {
      if (roads.has(id)) continue;
      const p = nameOf(text, `place.${id}`);
      assert.ok(p && /^https?:\/\//.test(p.source), `${id} is a sourced place`);
    }
  }
  assert.ok(nameOf(text, 'place.us_101'));
  assert.deepEqual(lintT16(text, { drives }), []);
  const planted = structuredClone(drives);
  planted.routes.town.through.push('nowhere_town');
  assert.match(lintT16(text, { drives: planted })[0].msg, /place\.nowhere_town, which isn't in the gazetteer/);
});

test('the bridge resolves in the dated conditions; a drive whose legs disagree is R01', () => {
  const cond = read('content/park/conditions/2026.json');
  for (const road of Object.keys(drives.roads)) assert.ok(cond.entries.some((e) => e.applies_to.includes(road)), road);
  // The cabin is south of the Hoh River Bridge and Forks north of it, so
  // every drive from the cabin through Forks crosses it, before Forks (3.3:
  // closed, it cuts Quinault and so the cabin off from Forks), and the
  // bridge's closure and single lane reach that drive by its through list.
  const viaForks = Object.entries(drives.routes).filter(([, r]) => r.through.includes('forks') || r.to === 'forks');
  assert.deepEqual(viaForks.map(([id]) => id).sort(), ['sol_duc', 'town']);
  for (const [id, r] of viaForks) {
    const at = r.through.indexOf('us101_hoh_river_bridge');
    assert.ok(at >= 0 && (r.through.indexOf('forks') < 0 || at < r.through.indexOf('forks')), `${id}: crosses the bridge on the way to Forks`);
    const effects = new Set(cond.entries.filter((e) => r.through.some((p) => e.applies_to.includes(p))).map((e) => e.effect));
    assert.ok(effects.has('road_closure') && effects.has('single_lane'), `${id}: the bridge's closures and its single lane apply to it`);
  }
  const sources = readSources(ROOT).map((s) => (s.file === 'content/drive/routes.json' ? { ...s, src: s.src.replace('"minutes": 69', '"minutes": 70') } : s));
  const { problems } = compileSources({ sources, schemas: readSchemas(ROOT), screens: ['app'], sections: 'all' });
  assert.ok(problems.some((p) => p.code === 'R01' && /legs sum to 130 minutes, not 129/.test(p.msg)));
});
