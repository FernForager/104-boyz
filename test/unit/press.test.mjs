// The long press (BUILD_PLAN S6; GAME_DESIGN 12.1: an accelerator, never
// the only way): one gesture per page, shared by the line inspector and a
// rolled choice's Why sheet (ui/press.js, factored out of S5's inspector).
// The higher rank finds first; a held press on what a handler found is
// never a tap, run or not, and anywhere while a holdAll handler (the
// inspector) listens; otherwise a slow tap is a tap; a press a handler
// ignores is no press; the listeners come off with the last handler.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onLongPress, PRESS_MS, MOVE_PX, SWALLOW_MS } from '../../web/js/ui/press.js';
import * as inspect from '../../web/js/ui/inspect.js';
import { fakeDocument } from './textfix.mjs';
import { fire } from './forkfix.mjs';

test("the inspector's numbers are the gesture's own (S5's 500 ms, 10 px and 400 ms)", () => {
  assert.deepEqual([PRESS_MS, MOVE_PX, SWALLOW_MS], [500, 10, 400]);
  assert.deepEqual([inspect.PRESS_MS, inspect.MOVE_PX, inspect.SWALLOW_MS], [PRESS_MS, MOVE_PX, SWALLOW_MS]);
});

test('the higher rank finds first; a lower one runs where the higher finds nothing; one set of listeners for both, off with the last', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const doc = fakeDocument();
  const a = doc.body.appendChild(doc.createElement('p'));
  const b = doc.body.appendChild(doc.createElement('p'));
  const ran = [];
  const offLow = onLongPress(doc, { find: (target) => (target === a || target === b ? target : null), run: (hit) => ran.push(['low', hit === a ? 'a' : 'b']) });
  const offHigh = onLongPress(doc, { rank: 10, find: (target) => (target === a ? target : null), run: () => ran.push(['high', 'a']) });
  assert.equal((doc.listeners.get('pointerdown') || []).length, 1, 'one gesture for the page');
  fire(doc, 'pointerdown', { target: a });
  t.mock.timers.tick(PRESS_MS);
  fire(doc, 'pointerup', { target: a });
  assert.equal(fire(doc, 'click', { target: a }).stopped, true, 'held: never a tap');
  fire(doc, 'pointerdown', { target: b });
  t.mock.timers.tick(PRESS_MS);
  fire(doc, 'pointerup', { target: b });
  fire(doc, 'click', { target: b });
  assert.deepEqual(ran, [
    ['high', 'a'],
    ['low', 'b'],
  ]);
  offHigh();
  assert.equal((doc.listeners.get('pointerdown') || []).length, 1, 'still listening for the other');
  offLow();
  assert.equal((doc.listeners.get('pointerdown') || []).length, 0, 'off with the last');
  assert.equal((doc.listeners.get('click') || []).length, 0);
});

test('a press a handler ignores is no press (its own card); a quick tap is a tap; moving MOVE_PX cancels the run but a held press still swallows its click', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const doc = fakeDocument();
  const card = doc.body.appendChild(doc.createElement('div'));
  const line = doc.body.appendChild(doc.createElement('p'));
  const ran = [];
  const off = onLongPress(doc, { find: (target) => (target === line || target === card ? target : null), run: (hit) => ran.push(hit === card ? 'card' : 'line'), ignore: (target) => target === card });
  fire(doc, 'pointerdown', { target: card });
  t.mock.timers.tick(PRESS_MS);
  fire(doc, 'pointerup', { target: card });
  assert.equal(fire(doc, 'click', { target: card }).stopped, false, 'a press on the card is the card\'s own');
  fire(doc, 'pointerdown', { target: line });
  t.mock.timers.tick(PRESS_MS - 1);
  fire(doc, 'pointerup', { target: line });
  assert.equal(fire(doc, 'click', { target: line }).stopped, false, 'a quick tap');
  fire(doc, 'pointerdown', { target: line, clientX: 100 });
  fire(doc, 'pointermove', { target: line, clientX: 100 + MOVE_PX });
  t.mock.timers.tick(PRESS_MS);
  fire(doc, 'pointerup', { target: line });
  assert.equal(fire(doc, 'click', { target: line }).stopped, true, 'held, drifted: still never a tap');
  assert.deepEqual(ran, [], 'nothing ran');
  off();
});

test("a held press on nothing a handler finds is a slow tap, and taps (Walk on, Yes, ▾ held 650 ms); while a holdAll handler listens (the inspector), it isn't", (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const doc = fakeDocument();
  const choice = doc.body.appendChild(doc.createElement('button'));
  const walk = doc.body.appendChild(doc.createElement('button'));
  const off = onLongPress(doc, { find: (target) => (target === choice ? target : null), run: () => {} });
  fire(doc, 'pointerdown', { target: walk });
  t.mock.timers.tick(650);
  fire(doc, 'pointerup', { target: walk });
  assert.equal(fire(doc, 'click', { target: walk }).stopped, false, 'a slow tap on Walk on walks on');
  fire(doc, 'pointerdown', { target: choice });
  t.mock.timers.tick(650);
  fire(doc, 'pointerup', { target: choice });
  assert.equal(fire(doc, 'click', { target: choice }).stopped, true, 'on a rolled choice, held: never a tap');
  t.mock.timers.tick(1000);
  const offAll = onLongPress(doc, { rank: 10, holdAll: true, find: () => null, run: () => {} });
  fire(doc, 'pointerdown', { target: walk });
  t.mock.timers.tick(650);
  fire(doc, 'pointerup', { target: walk });
  assert.equal(fire(doc, 'click', { target: walk }).stopped, true, 'while the inspector listens, held anywhere: never a tap');
  t.mock.timers.tick(1000);
  offAll();
  fire(doc, 'pointerdown', { target: walk });
  t.mock.timers.tick(650);
  fire(doc, 'pointerup', { target: walk });
  assert.equal(fire(doc, 'click', { target: walk }).stopped, false, 'and once it stops, a slow tap taps again');
  off();
});
