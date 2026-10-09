// The one event-tag list (GAME_DESIGN 6.5; Lead call 9; BUILD_PLAN 2.7, S4):
// schemas/tags.json holds exactly 6.5's names, each with its type, read
// from the design doc's own text so the two can't drift apart.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';

const TAGS = JSON.parse(readFileSync(join(ROOT, 'schemas', 'tags.json'), 'utf8')).tags;

/** GAME_DESIGN 6.5's section. */
function section65() {
  const doc = readFileSync(join(ROOT, 'design', 'GAME_DESIGN.md'), 'utf8');
  const a = doc.indexOf('### 6.5 Pack tags');
  return doc.slice(a, doc.indexOf('\n### ', a + 1));
}

test("schemas/tags.json is exactly 6.5's core tags, the Larry five and the load and fit numbers", () => {
  const s = section65();
  const core = s.slice(s.indexOf('The core event tags:'), s.indexOf('The Larry moments'));
  const larry = s.slice(s.indexOf('The Larry moments'), s.indexOf('These names are canonical'));
  const names = (text) => [...text.matchAll(/`([a-z_]+)`/g)].map((m) => m[1]);
  const table = s.slice(s.indexOf('| Rule kind'), s.indexOf('The core event tags'));
  const rows = (kind) => names(table.split('\n').find((l) => l.startsWith(`| ${kind} `)));
  const want = new Set([...names(core), ...names(larry), ...rows('Load'), ...rows('Fit')]);
  assert.equal(names(larry).length, 5);
  assert.deepEqual(Object.keys(TAGS).sort(), [...want].sort());
  for (const t of names(larry)) assert.equal(TAGS[t].larry, true, t);
});

test('each tag has its type; the enums carry 6.5\'s values (and the catalog\'s hammock)', () => {
  for (const [k, t] of Object.entries(TAGS)) {
    assert.ok(['boolean', 'number', 'enum'].includes(t.type), k);
    if (t.type === 'enum') assert.ok(t.values.length >= 2 && t.values.includes('none'), k);
  }
  assert.deepEqual(TAGS.shelter.values, ['tent', 'tarp', 'bivy', 'hammock', 'none']);
  assert.deepEqual(TAGS.light.values, ['headlamp', 'phone', 'none']);
  assert.deepEqual(TAGS.water_treat.values, ['filter', 'chemical', 'boil', 'none']);
  assert.deepEqual(TAGS.nav.values, ['map', 'map_and_compass', 'gps', 'none']);
  assert.deepEqual(TAGS.waterproofing.values, ['liner', 'cover', 'none']);
  assert.deepEqual([TAGS.first_aid.min, TAGS.first_aid.max], [0, 2]);
  assert.equal(TAGS.sleep_rating.unit, 'f');
  assert.equal(Object.values(TAGS).filter((t) => t.type === 'boolean').length, 32);
  assert.equal(Object.values(TAGS).filter((t) => t.type === 'number').length, 9);
});
