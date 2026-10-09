// The standard profile and the profile snapshot (BUILD_PLAN 14.1 T0;
// GAME_DESIGN E.1, E.12 #1; F.3, the timed modes): the timed modes'
// hiker reads nothing of the Open hiker, and a snapshot holds exactly the
// fields the engine reads.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { standardProfile, profileSnapshot } from '../../web/js/engine/standard.js';
import { sha256Hex } from '../../web/js/engine/hash.js';
import { canon } from '../../web/js/engine/canon.js';
import { ROOT } from '../../tools/pics.mjs';
import { fxContent, signed } from './enginefix.mjs';

/** The standard hiker's canonical hash, frozen: a change to it is a rules change, reviewed and logged. */
const STANDARD_HIKER = 'c1695851a682f0f91eea6dda89bb94c571115a4f1eab8fc12112459d337d6602';

test('the standard profile is the same whatever Open hiker the device holds, and its hash is frozen', () => {
  const content = fxContent();
  const strong = signed(content);
  const veteran = {
    ...strong,
    state: { ...strong.state, hiker: { ...strong.state.hiker, profile: { fitness: 'mountain_goat', body_lb: 140, skills: Object.fromEntries(content.profile.skills.map((k) => [k, 5])), regions: { hoh: { visits: 9 } }, seen: { 'ford.braided_river': 3 } } } },
  };
  // Its signature takes no state: there is no way to hand it a hiker.
  assert.equal(standardProfile.length, 1, 'standardProfile(content, kind) reads only the content');
  const a = standardProfile(content);
  const b = standardProfile(content);
  assert.equal(canon(a), canon(b));
  assert.equal(sha256Hex(canon(a)), STANDARD_HIKER);
  assert.notEqual(canon(profileSnapshot(veteran.state.hiker, content)), canon(a), 'the Open veteran differs, and never leaks in');
  assert.ok(Object.isFrozen(a) && Object.isFrozen(a.skills));
  assert.throws(() => standardProfile(content, 'runner'), { name: 'EngineError', code: 'unbuilt' }, 'T1 fills in the runner');
});

test('profileSnapshot keeps exactly the fields the engine reads (E.1): a planted extra field is dropped, a missing skill throws', () => {
  const content = fxContent();
  const hiker = signed(content).state.hiker;
  const snap = profileSnapshot(hiker, content);
  assert.deepEqual(Object.keys(snap).sort(), ['body_lb', 'fitness', 'regions', 'seen', 'skills']);
  assert.deepEqual(Object.keys(snap.skills).sort(), [...content.profile.skills].sort());
  const planted = profileSnapshot({ ...hiker, profile: { ...hiker.profile, wallet: 40, name: 'Robin', skills: { ...hiker.profile.skills, juggling: 5 } } }, content);
  assert.equal(canon(planted), canon(snap), 'the wallet, a name and an unknown skill are dropped');
  const { glacier, ...missing } = hiker.profile.skills;
  assert.equal(glacier, 0);
  assert.throws(() => profileSnapshot({ ...hiker, profile: { ...hiker.profile, skills: missing } }, content), { name: 'EngineError', code: 'state' });
  assert.throws(() => profileSnapshot({ ...hiker, profile: { ...hiker.profile, fitness: 'superhuman' } }, content), { code: 'state' });
  assert.throws(() => profileSnapshot({ id: 'h1' }, content), { code: 'state' });
});

test("the standard profile is in rules.json, so the rules hash covers it (BUILD_PLAN 14.1)", () => {
  const content = fxContent();
  const src = JSON.parse(readFileSync(join(ROOT, 'content', 'rules', 'standard.json'), 'utf8'));
  assert.equal(canon(content.data.rules.standard.hiker), canon(src.hiker));
  assert.deepEqual([content.data.rules.standard.runner, content.data.rules.standard.shed, content.data.rules.standard.pantry], [null, [], []], "T0's stub: the hiker only");
  const profile = JSON.parse(readFileSync(join(ROOT, 'content', 'rules', 'profile.json'), 'utf8'));
  assert.equal(canon(src.hiker), canon(profile.open_start), 'the stub matches the Open start today; T1 may part them');
});
