// The fork's choices in the frame (BUILD_PLAN S6; GAME_DESIGN 8.1, 8.7,
// 12.1, 12.2): the tags and a diamond's second line, the (i) and its Why
// sheet, a long press as the Why sheet's accelerator (and the line
// inspector's precedence), the diamond's confirm, and the odds intros, one
// a stop, the most serious unseen first, kept by the phone (odds_seen).
// The tiny DOM (textfix.mjs), the repo's content and preview's words.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderFrame } from '../../web/js/ui/frame.js';
import { addTags, formsOn, introFor, withIntro, seenForms, INTRO_FORMS, INTRO_LINES, SEEN_KEY } from '../../web/js/ui/choices.js';
import { closeWhy } from '../../web/js/ui/sheet.js';
import { PRESS_MS } from '../../web/js/ui/press.js';
import { installInspector } from '../../web/js/ui/inspect.js';
import { load, save } from '../../web/js/platform/storage.js';
import { atFork, device, frameDoc, ctxFor, fakeSound, fire, choiceBy, outcomeOf } from './forkfix.mjs';

const HIGH = 'trail.deer_lake_rim.fork.high';
const BASIN = 'trail.deer_lake_rim.fork.basin';
const CAR = 'trail.deer_lake_rim.fork.car';

/** The fork drawn in a frame; acts records each choice the frame hands the game. */
function forkFrame(t, { seen = INTRO_FORMS, screen = atFork().screen } = {}) {
  device(t);
  save(SEEN_KEY, seen);
  const doc = frameDoc();
  const host = doc.body.appendChild(doc.createElement('div'));
  host.className = 'game-screen';
  const acts = [];
  const sound = fakeSound();
  const f = renderFrame(host, screen, (a, cue) => acts.push([a.t, a.c, cue]), ctxFor(screen, doc, { sound }));
  t.after(() => {
    f.release();
    closeWhy(doc);
  });
  return { doc, host, f, acts, sound, screen };
}

test("the tags (8.1, 11.9): line 1 the label and its tag; a diamond's brick glyph, named Critical, and 65%; its line 2 the fail and fatal shares; 95%; sure", (t) => {
  const { host } = forkFrame(t);
  const high = choiceBy(host, HIGH);
  const basin = choiceBy(host, BASIN);
  const car = choiceBy(host, CAR);
  assert.deepEqual([high.getAttribute('data-odds'), basin.getAttribute('data-odds'), car.getAttribute('data-odds')], ['diamond', 'pct', null]);
  assert.equal(car.getAttribute('data-sure'), '');
  // Line 1: the label, then the tag, in one head.
  const head = high.querySelector('.choice-head');
  assert.deepEqual(head.children.map((c) => c.className), ['choice-label', 'choice-tag']);
  const tag = high.querySelector('.choice-tag');
  assert.ok(tag.querySelector('svg'), 'the diamond is a pixel glyph, no letter');
  assert.equal(tag.querySelector('svg').getAttribute('aria-hidden'), 'true');
  assert.deepEqual([tag.querySelector('.vh').textContent, tag.querySelector('.vh').getAttribute('data-t')], ['Critical', 'trail.odds.diamond'], 'its spoken name');
  assert.deepEqual([tag.querySelector('.choice-made').textContent, tag.querySelector('.choice-made').getAttribute('data-t')], ['65%', 'fmt.pct']);
  // Line 2, in brick: 35% hit · 0.7% fatal (20 characters: it fits the SE's line, 8.1's 22).
  const second = high.querySelector('.choice-odds2');
  assert.equal(second.textContent, '35% hit · 0.7% fatal');
  assert.ok(second.textContent.length <= 22);
  assert.deepEqual([second.querySelector('.choice-fail').getAttribute('data-t'), second.querySelector('.choice-fatal').getAttribute('data-t')], ['trail.odds.fail', 'trail.odds.fatal']);
  const sep = second.querySelector('.choice-sep');
  assert.deepEqual([sep.getAttribute('aria-hidden'), sep.querySelector('span').getAttribute('aria-hidden'), sep.querySelector('span').textContent], [null, 'true', '·'], 'the dot is a separator, not a word');
  // What VoiceOver reads of line 2: the text outside aria-hidden, the two shares apart (never "hit0.7%").
  const spoken = (n) => (n.nodeType === 3 ? n.data : n.getAttribute('aria-hidden') === 'true' ? '' : n.childNodes.map(spoken).join(''));
  assert.equal(spoken(second).replace(/\s+/g, ' '), '35% hit 0.7% fatal');
  assert.deepEqual([basin.querySelector('.choice-tag').textContent, basin.querySelector('.choice-odds2')], ['95%', null], 'a plain % has no second line');
  assert.deepEqual([car.querySelector('.choice-tag').textContent, car.querySelector('.choice-tag').getAttribute('data-t')], ['sure', 'trail.odds.sure']);
  // The rolled ones each sit in a row with their (i); the sure one has none.
  assert.deepEqual(host.querySelector('.game-choices').children.map((c) => c.className), ['choice-row', 'choice-row', 'box choice']);
  assert.equal(host.querySelectorAll('.choice-info').length, 2);
});

test("the (i) opens the Why sheet (12.11) with ui.open, and never commits the choice; Close puts focus back on it", (t) => {
  const { doc, host, acts, sound } = forkFrame(t);
  const square = host.querySelectorAll('.choice-row')[0].querySelector('.choice-info');
  square.click();
  assert.deepEqual(acts, [], 'the square commits nothing');
  assert.deepEqual(sound.played, ['ui.open']);
  const sheet = doc.body.querySelector('.why');
  assert.ok(sheet);
  assert.deepEqual([sheet.getAttribute('role'), sheet.getAttribute('aria-modal'), sheet.getAttribute('aria-labelledby')], ['dialog', 'true', 'why-title']);
  assert.equal(doc.activeElement, sheet.querySelector('.why-title'), 'focus goes to its title');
  assert.equal(sheet.querySelector('.why-choice').getAttribute('data-t'), HIGH);
  sheet.querySelector('.why-close').click();
  assert.equal(doc.body.querySelector('.why'), null);
  assert.equal(doc.activeElement, square, 'and back to the (i)');
});

test("a rolled choice that also carries the sure tag still shows its odds, never 'sure' (the content checks refuse one; the frame never hides a roll)", (t) => {
  const fork = atFork().screen;
  const screen = { ...fork, choices: fork.choices.map((c) => (c.odds && c.odds.kind === 'diamond' ? { ...c, tag: 'sure' } : c)) };
  const { host } = forkFrame(t, { screen });
  const high = choiceBy(host, HIGH);
  assert.deepEqual([high.getAttribute('data-odds'), high.hasAttribute('data-sure')], ['diamond', false]);
  assert.equal(high.querySelector('.choice-odds2').textContent, '35% hit · 0.7% fatal');
  assert.deepEqual(formsOn(screen), ['fatal', 'diamond', 'pct', 'sure'], 'the sure form is the real sure choice');
  assert.deepEqual(host.querySelectorAll('.choice[data-sure]').map((b) => b.querySelector('.choice-label').getAttribute('data-t')), [CAR]);
});

test('a long press on a rolled choice opens its Why sheet and never commits it (12.1); while the line inspector listens, it owns the long press', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { doc, host, acts } = forkFrame(t);
  const basin = choiceBy(host, BASIN);
  fire(doc, 'pointerdown', { target: basin.querySelector('.choice-label') });
  t.mock.timers.tick(PRESS_MS);
  const sheet = doc.body.querySelector('.why');
  assert.ok(sheet, 'held: the sheet');
  assert.equal(sheet.querySelector('.why-choice').getAttribute('data-t'), BASIN);
  fire(doc, 'pointerup', { target: basin });
  const click = fire(doc, 'click', { target: basin });
  if (!click.stopped) basin.click();
  assert.deepEqual([click.stopped, acts], [true, []], 'the release never takes the choice');
  sheet.querySelector('.why-close').click();
  // A long press on the sure choice is no accelerator: it has no sheet, and held it is a slow tap that takes it.
  t.mock.timers.tick(1000);
  fire(doc, 'pointerdown', { target: choiceBy(host, CAR) });
  t.mock.timers.tick(PRESS_MS + 150);
  assert.equal(doc.body.querySelector('.why'), null);
  fire(doc, 'pointerup', { target: choiceBy(host, CAR) });
  assert.equal(fire(doc, 'click', { target: choiceBy(host, CAR) }).stopped, false, 'a slow tap on the sure choice is a tap');
  t.mock.timers.tick(1000);
  // The inspector (preview's debug mode) ranks first: its card, not the sheet.
  const insp = installInspector(doc, { meta: Promise.resolve({}) });
  await insp.ready;
  fire(doc, 'pointerdown', { target: basin.querySelector('.choice-label') });
  t.mock.timers.tick(PRESS_MS);
  for (let i = 0; i < 4; i++) await Promise.resolve();
  assert.equal(doc.body.querySelector('.why'), null, 'no sheet while the inspector listens');
  assert.ok(doc.body.querySelector('.inspect'), "the inspector's card");
  insp.uninstall();
});

test("the diamond's confirm (12.1): the first tap turns it, in place, into This could be fatal. with Yes and Not yet; Not yet, or another choice, brings it back; Yes takes it", (t) => {
  const { doc, host, acts, sound, f } = forkFrame(t);
  const high = choiceBy(host, HIGH);
  high.click();
  assert.deepEqual(acts, [], 'one brush of the thumb takes nothing');
  assert.deepEqual(sound.played, ['ui.tick']);
  const confirm = host.querySelector('.choice-confirm');
  assert.ok(confirm);
  assert.equal(high.hidden, true, 'in place of the diamond');
  assert.equal(confirm.parentNode, high.parentNode);
  assert.deepEqual([confirm.querySelector('.confirm-prompt').getAttribute('data-t'), confirm.querySelector('.confirm-prompt').textContent], ['trail.confirm.fatal', 'This could be fatal.']);
  assert.deepEqual([confirm.querySelector('.confirm-yes').textContent, confirm.querySelector('.confirm-no').textContent], ['Yes', 'Not yet']);
  assert.equal(doc.activeElement, confirm.querySelector('.confirm-yes'), 'VoiceOver: focus moves to Yes');
  assert.deepEqual([f.live.getAttribute('aria-live'), f.live.textContent], ['polite', 'This could be fatal.'], 'and a polite live region reads the prompt');
  // Not yet: the diamond is back, as it was.
  confirm.querySelector('.confirm-no').click();
  assert.equal(host.querySelector('.choice-confirm'), null);
  assert.equal(high.hidden, false);
  assert.equal(doc.activeElement, high);
  // Another choice brings it back too, and is taken as its own tap.
  high.click();
  choiceBy(host, BASIN).click();
  assert.equal(host.querySelector('.choice-confirm'), null);
  assert.equal(high.hidden, false);
  assert.deepEqual(acts, [['choose', 'basin', 'ui.tick']]);
  // Yes takes the diamond, with its tick.
  high.click();
  host.querySelector('.confirm-yes').click();
  assert.deepEqual(acts, [
    ['choose', 'basin', 'ui.tick'],
    ['choose', 'high', 'ui.tick'],
  ]);
});

test("a diamond that can't kill asks with its label: Stay high?", (t) => {
  const { screen } = atFork();
  const tame = { ...screen, choices: screen.choices.map((c) => (c.odds && c.odds.kind === 'diamond' ? { ...c, odds: { ...c.odds, fatal: null } } : c)) };
  const { host } = forkFrame(t, { screen: tame });
  choiceBy(host, HIGH).click();
  const prompt = host.querySelector('.confirm-prompt');
  assert.deepEqual([prompt.getAttribute('data-t'), prompt.textContent], ['trail.confirm.ask', 'Stay high?']);
  assert.equal(choiceBy(host, HIGH).querySelector('.choice-odds2').textContent, '35% hit', 'no fatal share on its line');
});

test('the odds intros (8.7, lead call 3): one a stop, the most serious unseen first (fatal, diamond, %, sure); the fatal one outlines the sure way; the phone keeps them (odds_seen)', (t) => {
  device(t);
  const { screen } = atFork();
  assert.deepEqual(formsOn(screen), ['fatal', 'diamond', 'pct', 'sure']);
  assert.deepEqual([introFor(screen, []), introFor(screen, ['fatal']), introFor(screen, ['fatal', 'diamond']), introFor(screen, ['fatal', 'diamond', 'pct']), introFor(screen, INTRO_FORMS)], ['fatal', 'diamond', 'pct', 'sure', null]);
  assert.deepEqual(formsOn(outcomeOf('car').screen), [], 'an outcome shows no odds');
  // Four trips through the fork (day, dusk, night, day): one intro each, then none.
  const shown = [];
  for (let k = 0; k < 5; k++) {
    const doc = frameDoc();
    const host = doc.body.appendChild(doc.createElement('div'));
    const f = renderFrame(host, screen, () => {}, ctxFor(screen, doc));
    const first = host.querySelectorAll('.game-box p').map((p) => p.getAttribute('data-t'));
    shown.push(first.length > 1 ? first[0] : null);
    if (k === 0) assert.ok(choiceBy(host, CAR).classList.contains('choice-ring'), 'with the fatal intro, the sure choice is outlined');
    else assert.ok(!choiceBy(host, CAR).classList.contains('choice-ring'));
    f.release();
  }
  assert.deepEqual(shown, [INTRO_LINES.fatal, INTRO_LINES.diamond, INTRO_LINES.pct, INTRO_LINES.sure, null]);
  assert.deepEqual(seenForms(), ['fatal', 'diamond', 'pct', 'sure']);
  assert.deepEqual(load(SEEN_KEY), ['fatal', 'diamond', 'pct', 'sure'], "kept under the phone's own key, not the hiker's (a death keeps it, 9.8)");
  // withIntro is display only: the screen it gets back is new, the engine's untouched.
  save(SEEN_KEY, []);
  const w = withIntro(screen);
  assert.deepEqual([w.intro, w.screen.box.map((r) => r.id), screen.box.map((r) => r.id)], ['fatal', [INTRO_LINES.fatal, 'trail.deer_lake_rim.fork'], ['trail.deer_lake_rim.fork']]);
  save(SEEN_KEY, ['nonsense', 'pct']);
  assert.deepEqual(seenForms(), ['pct'], 'only forms it knows');
});

test("addTags marks each drawn choice's index, so a long press finds its Why sheet; a stop with no odds is left as S5 drew it", (t) => {
  device(t);
  const doc = frameDoc();
  const b = doc.createElement('button');
  const l = doc.createElement('span');
  l.className = 'choice-label';
  b.appendChild(l);
  addTags({ choices: [{ act: { t: 'next' }, label: null, enabled: true }] }, [b]);
  assert.deepEqual([b.getAttribute('data-choice'), b.querySelector('.choice-head')], ['0', null]);
});
