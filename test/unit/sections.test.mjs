// Track B's data sections (BUILD_PLAN S4; the spec's 2.3): every one is
// compiled, validated and linted on every build; none ships in S4, so
// neither channel's rules.json gains one; each reaches a channel's rules
// in the session that builds its screen, with no words in it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROOT } from '../../tools/pics.mjs';
import { compileContent, compileSources, readSources, readSchemas } from '../../tools/content.mjs';
import { readText, hasId } from '../../tools/text.mjs';
import { SECTIONS } from '../../tools/scope.mjs';
import { B_SECTIONS, stripWords } from '../../tools/sections.mjs';
import { canon } from '../../web/js/engine/canon.js';

const B = ['conditions', 'permits', 'daylight', 'climate', 'sun', 'kits', 'quiz', 'items', 'foods', 'stores', 'drives'];

test('every B section is registered, compiles with no problem, and carries no words', () => {
  assert.deepEqual(Object.keys(B_SECTIONS).sort(), [...B].sort());
  for (const s of B) assert.ok(SECTIONS[s], `${s} is a section tools/scope.mjs knows`);
  const all = compileContent({ screens: ['app', 'debug', 'guestbook', 'title', 'trail'], sections: 'all' });
  assert.deepEqual(all.problems, []);
  for (const s of B) {
    assert.ok(all.sections[s], `${s} compiled`);
    assert.equal(all.sections[s].format, 1, s);
    const text = canon(all.sections[s]);
    assert.ok(!text.includes('"@'), `${s}: no line refs in the rules`);
    for (const k of ['"$comment"', '"doc"', '"evidence"', '"deferred"']) assert.ok(!text.includes(k), `${s}: no ${k}`);
  }
  assert.deepEqual(all.sections.quiz.questions[0], { id: 'q_sequim', answers: 3, right: 1, pronunciation: true, indigenous_name: true });
  assert.deepEqual(all.sections.stores.stores.general.deferred_ids, ['shellfish_license']);
  assert.deepEqual(stripWords({ a: 1, doc: 'x', b: [{ evidence: 'y', c: 2 }] }), { a: 1, b: [{ c: 2 }] });
});

test("none ships in S4: neither channel's rules.json gains a B section; each ships with its screen", () => {
  for (const screens of [['app', 'debug', 'title'], ['app', 'debug', 'guestbook', 'title', 'trail']]) {
    const { rules } = compileContent({ screens });
    for (const s of B) assert.ok(!(s in rules), `${s} stays out of ${screens.join(' ')}`);
  }
  // In S4 their ships lists are empty: each gains its screen in the session that builds it.
  const scope = readSources(ROOT).find((x) => x.file === 'content/scope/m1a.json');
  for (const s of B) assert.deepEqual(JSON.parse(scope.src).ships[s], [], s);
  // A scope whose ships list names a section's screen ships it to a channel with that screen.
  const shipped = JSON.parse(scope.src);
  for (const s of B) shipped.ships[s] = [SECTIONS[s].screen];
  const sources = readSources(ROOT).map((x) => (x.file === scope.file ? { ...x, src: JSON.stringify(shipped) } : x));
  const later = compileSources({ sources, schemas: readSchemas(ROOT), screens: ['app', 'lockbox', 'home', 'trail', 'plan', 'town', 'drive'] });
  assert.deepEqual(later.problems, []);
  for (const s of B) assert.ok(s in later.rules, `${s} ships with ${SECTIONS[s].screen}`);
  assert.ok(!canon(later.rules).includes('"@'), 'no line ref reaches the rules');
});

test('a content ref may name a place or a term (@place.<id>), as T16 checks it', () => {
  const text = readText(ROOT);
  const defined = (id) => hasId(text, id);
  assert.ok(defined('place.lunch_lake') && defined('term.geoduck') && !defined('place.nowhere'));
  const sources = readSources(ROOT).map((s) => (s.file === 'content/quiz/locals.json' ? { ...s, src: s.src.replace('"@first.lockbox.right"', '"@place.lunch_lake"').replace('"@first.lockbox.wrong"', '"@place.nowhere"') } : s));
  const { problems, infos } = compileSources({ sources, schemas: readSchemas(ROOT), screens: ['app', 'lockbox'], defined, sections: 'all' });
  // The quiz file names no screen, so a ref it holds that isn't a line or a name is R01.
  assert.ok(problems.some((p) => p.code === 'R01' && /@place\.nowhere is not a line/.test(p.msg)));
  assert.ok(!problems.some((p) => /@place\.lunch_lake/.test(p.msg)));
  assert.ok(Array.isArray(infos));
});
