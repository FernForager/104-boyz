// The rules hash (BUILD_PLAN 14.1 T0, S3; GAME_DESIGN E.12): over the
// engine's code and the outcome data, never the words. A word-only or a
// voice-only change leaves it alone; a byte in the engine or a stop's next
// moves it; the same tree always gives the same hash.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { build, makeData } from '../../tools/build.mjs';
import { rulesHash, rulesHashOf, sourceRulesHash, RULES_PREFIX } from '../../tools/rules.mjs';
import { ROOT } from '../../tools/pics.mjs';

/** A copy of the repo whose preview has the trail screen and the trailhead's words. */
function tree(t) {
  const root = mkdtempSync(join(tmpdir(), 'oph-rules-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const d of ['web', 'config', 'content', 'schemas']) cpSync(join(ROOT, d), join(root, d), { recursive: true });
  const scopeFile = join(root, 'content', 'scope', 'm1a.json');
  const scope = JSON.parse(readFileSync(scopeFile, 'utf8'));
  scope.screens = [...new Set([...scope.screens, 'guestbook', 'trail'])].sort();
  writeFileSync(scopeFile, JSON.stringify(scope, null, 1));
  const trail = join(root, 'content', 'text', 'en', 'trail.json');
  let have = { $comment: 'test' };
  try {
    have = JSON.parse(readFileSync(trail, 'utf8'));
  } catch {
    // C0 files the trailhead's lines; until then the test supplies its own
  }
  for (const id of ['trail.sol_duc_trailhead.lot', 'trail.sol_duc_trailhead.trail_mouth']) have[id] = have[id] || { text: 'Words.', ctx: 'test', screen: 'trail', max: 140 };
  writeFileSync(trail, JSON.stringify(have, null, 1));
  return root;
}

/** The hash a preview build of a tree would stamp. */
const hashOf = (root, channel = 'preview') => sourceRulesHash({ root, rulesJson: makeData({ root, channel }).files['rules.json'] });

test('the hash: sha256 of "oph-rules\\0" and each file by path, path\\0bytes\\0, first 12 hex', () => {
  const files = [
    { path: 'js/engine/b.js', bytes: 'B' },
    { path: 'data/rules.json', bytes: '{}\n' },
    { path: 'js/engine/a.js', bytes: Buffer.from('A') },
  ];
  const want = createHash('sha256').update(`${RULES_PREFIX}data/rules.json\0{}\n\0js/engine/a.js\0A\0js/engine/b.js\0B\0`).digest('hex').slice(0, 12);
  assert.equal(rulesHashOf(files), want, 'sorted by path, in code-unit order');
  assert.equal(rulesHashOf([...files].reverse()), want);
});

test('a word-only change and a voice-only change leave the rules hash alone (E.12, call 1)', (t) => {
  const root = tree(t);
  const base = hashOf(root);
  assert.match(base, /^[0-9a-f]{12}$/);
  const trail = join(root, 'content', 'text', 'en', 'trail.json');
  const words = JSON.parse(readFileSync(trail, 'utf8'));
  words['trail.sol_duc_trailhead.lot'].text = 'Other words for the same stop.';
  writeFileSync(trail, JSON.stringify(words, null, 1));
  assert.equal(hashOf(root), base, 'a line reworded');
  const stops = join(root, 'content', 'stops', 'sol_duc_trailhead.json');
  writeFileSync(stops, readFileSync(stops, 'utf8').replace('"box": "@trail.sol_duc_trailhead.lot"', '"box": ["@trail.sol_duc_trailhead.lot", "@trail.sol_duc_trailhead.trail_mouth"]'));
  assert.equal(hashOf(root), base, 'a box given another variant');
  appendFileSync(join(root, 'web', 'js', 'ui', 'home.js'), '\n');
  appendFileSync(join(root, 'web', 'css', 'game.css'), '\n');
  assert.equal(hashOf(root), base, 'the UI and the CSS are not rules');
});

test("a byte in the engine, a stop's next, a plan's start or the standard profile moves the hash", (t) => {
  const root = tree(t);
  const base = hashOf(root);
  const engine = join(root, 'web', 'js', 'engine', 'api.js');
  const src = readFileSync(engine, 'utf8');
  writeFileSync(engine, `${src} `);
  assert.notEqual(hashOf(root), base, 'one byte in web/js/engine/');
  writeFileSync(engine, src);
  assert.equal(hashOf(root), base, 'and back');
  const stops = join(root, 'content', 'stops', 'sol_duc_trailhead.json');
  const s = readFileSync(stops, 'utf8');
  writeFileSync(stops, s.replace('"next": "trail_mouth"', '"next": null'));
  assert.notEqual(hashOf(root), base, "a stop's next");
  writeFileSync(stops, s);
  const plan = join(root, 'content', 'trips', 'sample.json');
  // S6: the sample leaves Deer Lake at 11:05 am (s 39900; it was 8:30, 30600).
  assert.match(readFileSync(plan, 'utf8'), /"s": 39900/);
  writeFileSync(plan, readFileSync(plan, 'utf8').replace('"s": 39900', '"s": 39960'));
  const moved = hashOf(root);
  assert.notEqual(moved, base, "a plan's start time");
  const std = join(root, 'content', 'rules', 'standard.json');
  writeFileSync(std, readFileSync(std, 'utf8').replace('"body_lb": 165', '"body_lb": 170'));
  assert.notEqual(hashOf(root), moved, 'the standard profile (T1 pins it)');
});

test("main's and preview's hashes differ while their scopes do; main's has no stops (BUILD_PLAN S3 D10)", (t) => {
  const root = tree(t);
  assert.notEqual(hashOf(root, 'main'), hashOf(root, 'preview'));
  assert.deepEqual(makeData({ root, channel: 'main' }).rules.stops, {});
});

test("two builds give the same hash, and it is the one the source tree predicts", (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-rules-build-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const a = build({ out: join(tmp, 'a'), channel: 'main', quiet: true });
  const b = build({ out: join(tmp, 'b'), channel: 'main', quiet: true });
  assert.equal(a.rules, b.rules);
  assert.equal(rulesHash(join(tmp, 'a')), a.rules);
  assert.equal(sourceRulesHash({ rulesJson: readFileSync(join(tmp, 'a', 'data', 'rules.json')) }), a.rules, 'Node can know the hash without a build');
  assert.equal(JSON.parse(readFileSync(join(tmp, 'a', 'version.json'), 'utf8')).rules, a.rules);
  assert.match(readFileSync(join(tmp, 'a', 'index.html'), 'utf8'), new RegExp(`data-rules="${a.rules}"`));
  assert.throws(() => rulesHash(join(tmp, 'nothing')), /data\/rules\.json is missing/);
});
