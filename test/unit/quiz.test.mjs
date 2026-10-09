// The lockbox's locals' quiz (BUILD_PLAN 3.4, S4; GAME_DESIGN 2.6, 12.3,
// F.3): content/quiz/locals.json and its 50 draft lines, against the
// research's quiz_locals.json.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { readText, stateOf } from '../../tools/text.mjs';
import { readSchemas } from '../../tools/content.mjs';
import { validate } from '../../tools/schema.mjs';

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const quiz = read('content/quiz/locals.json');
const src = read('design/data/quiz_locals.json');
const text = readText(ROOT);
const words = (ref) => text.lines.get(ref.slice(1)).text;

test('the file validates: three answers each, one right, a source each (F.3)', () => {
  assert.deepEqual(validate(readSchemas(ROOT)['quiz.schema.json'], quiz).errors, []);
  assert.equal(quiz.questions.length, 12);
  assert.equal(quiz.deal, 3);
  for (const q of quiz.questions) {
    assert.equal(q.answers.length, 3, q.id);
    assert.ok(Number.isInteger(q.right) && q.right >= 0 && q.right < 3, q.id);
    assert.match(q.source.url, /^https:\/\//, q.id);
  }
  const planted = structuredClone(quiz);
  planted.questions[0].answers.pop();
  assert.ok(validate(readSchemas(ROOT)['quiz.schema.json'], planted).errors.length, 'two answers fail minItems');
});

test("the questions are the source's, in its order, with its right answers and sources", () => {
  assert.deepEqual(quiz.questions.map((q) => q.id), src.questions.map((q) => q.id));
  quiz.questions.forEach((q, i) => {
    const s = src.questions[i];
    assert.equal(q.right, s.right, q.id);
    assert.deepEqual(q.source, { url: s.source.url, publisher: s.source.publisher });
    assert.equal(q.indigenous_name === true, s.indigenous_name === true, `${q.id}: indigenous_name as the source has it`);
  });
  assert.deepEqual(quiz.questions.filter((q) => q.pronunciation).map((q) => q.id), ['q_sequim', 'q_hoh', 'q_puyallup', 'q_dosewallips'], 'four pronunciation questions (Geoduck asks what one is)');
});

test('every ref is a defined line, the words equal the source verbatim, every answer fits 22 characters', () => {
  quiz.questions.forEach((q, i) => {
    const s = src.questions[i];
    assert.equal(words(q.ask), s.question, q.id);
    q.answers.forEach((a, k) => {
      assert.equal(words(a), s.answers[k], `${q.id} a${k}`);
      assert.ok([...words(a)].length <= 22, `${a}: 22 characters or fewer`);
      assert.equal(text.lines.get(a.slice(1)).max, 22);
    });
  });
  assert.equal(words(quiz.right), 'Welcome home.');
  assert.equal(words(quiz.wrong), 'Nice try, tourist.');
});

test('the 50 lines are drafts on the lockbox screen, which waits for S7, with no braces (T13)', () => {
  const ids = [...text.lines.keys()].filter((id) => id.startsWith('first.lockbox.'));
  assert.equal(ids.length, 50);
  for (const id of ids) {
    const l = text.lines.get(id);
    assert.deepEqual([l.screen, l.class, stateOf(id, text)], ['lockbox', 'ours', 'draft'], id);
    assert.ok(!/[{}]/.test(l.text), id);
  }
  assert.ok(!text.scope.screens.includes('lockbox'), 'the lockbox screen is S7\'s');
  assert.ok(!text.scope.main.screens.includes('lockbox'));
});
