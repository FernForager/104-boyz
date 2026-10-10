// An outcome (BUILD_PLAN S6 B.3.7; GAME_DESIGN 12.13): the new place in
// the picture and the caption, the profile strip moved on to it, and under
// the box the severity's ornament (a spoken name each; never the lily's
// gold) and the pencil rows: where you got to and when, and the time a
// band cost. A death box's one button is Next.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderFrame } from '../../web/js/ui/frame.js';
import { renderOutcome, ORNAMENTS, FERN_RECTS, TWIG_RECTS, PENCIL_RECTS } from '../../web/js/ui/outcome.js';
import { stripProfile } from '../../web/js/ui/strip.js';
import { NBSP } from '../../web/js/text.js';
import { CONTENT, outcomeOf, device, frameDoc, ctxFor } from './forkfix.mjs';

/** An outcome drawn in a frame. */
function outcomeFrame(t, c, seed) {
  device(t);
  const { screen } = outcomeOf(c, seed);
  const doc = frameDoc();
  const host = doc.body.appendChild(doc.createElement('div'));
  const f = renderFrame(host, screen, () => {}, ctxFor(screen, doc));
  t.after(() => f.release());
  return { doc, host, screen };
}
const words = (/** @type {any} */ el) => el.textContent.replaceAll(NBSP, ' ');

test('Stay high, clean: Heart Lake in the caption, a fern named Good, and the pencil row Heart Lake at 4:26 pm; Walk on', (t) => {
  const { host, screen } = outcomeFrame(t, 'high', 'D0000001');
  assert.equal(screen.stop.id, 'high_clean');
  assert.equal(words(host.querySelector('.frame-caption')), 'Day 1 · Heart Lake · 4,780 ft', 'the caption follows the place');
  const notes = host.querySelector('.game-choices').children[0];
  assert.equal(notes.className, 'outcome-notes', 'under the box, above Walk on');
  assert.equal(notes.getAttribute('data-sev'), 'good');
  const orn = notes.querySelector('.ornament');
  assert.deepEqual([orn.getAttribute('role'), orn.getAttribute('aria-label'), orn.getAttribute('data-t-aria')], ['img', 'Good', 'trail.outcome.good']);
  assert.ok(orn.querySelector('svg'));
  assert.deepEqual(notes.querySelectorAll('.pencil-row').map(words), ['Heart Lake at 4:26 pm']);
  assert.equal(notes.querySelector('.pencil-row span').getAttribute('data-t'), 'trail.pencil.arrive');
  assert.ok(notes.querySelector('.pencil-row svg'), 'the pencil, a pixel glyph');
  assert.equal(host.querySelector('.game-choices .choice .choice-label').getAttribute('data-t'), 'trail.walk_on');
});

test('Stay high, shaky: a twig named A mishap, Heart Lake at 4:46 pm, and Time +20 min', (t) => {
  const { host } = outcomeFrame(t, 'high', 'D0000002');
  const notes = host.querySelector('.outcome-notes');
  assert.deepEqual([notes.getAttribute('data-sev'), notes.querySelector('.ornament').getAttribute('aria-label')], ['mishap', 'A mishap']);
  assert.deepEqual(notes.querySelectorAll('.pencil-row').map(words), ['Heart Lake at 4:46 pm', 'Time +20 min']);
});

test('struck on the crest: a brick diamond named Serious, at the High Divide; a death box\'s one button is Next', (t) => {
  const { host } = outcomeFrame(t, 'high', 'K7QM2Q9F');
  assert.deepEqual([host.querySelector('.outcome-notes').getAttribute('data-sev'), host.querySelector('.ornament').getAttribute('aria-label')], ['serious', 'Serious']);
  assert.deepEqual(host.querySelectorAll('.pencil-row').map(words), ['High Divide at 2:39 pm']);
  const death = outcomeFrame(t, 'high', 'D000000Z').host;
  assert.equal(death.querySelector('.outcome-notes').getAttribute('data-sev'), 'death');
  assert.equal(death.querySelector('.ornament').getAttribute('aria-label'), 'Serious', 'trip-ending wears the serious ornament (12.13)');
  const next = death.querySelector('.game-choices .choice .choice-label');
  assert.deepEqual([next.getAttribute('data-t'), next.textContent], ['trail.next', 'Next']);
});

test('the profile strip moves on (12.2): the route so far, you at its end, the rust square and the mile at the destination', (t) => {
  for (const [c, seed, node, mile] of [
    ['high', 'D0000001', 'heart_lake', 'mi 10.3'],
    ['basin', 'D0000001', 'lunch_lake', 'mi 7.8'],
    ['car', 'K7QM2Q9F', 'sol_duc_trailhead', 'mi 13.8'],
  ]) {
    const { host, screen } = outcomeFrame(t, c, seed);
    const v = CONTENT.voice(screen.stop.set, screen.stop.id).view;
    assert.equal(v.node, node);
    const p = stripProfile(CONTENT.park(), v.day, v.node);
    assert.equal(p.you, p.total, `${node}: you at the day's end so far`);
    assert.equal(words(host.querySelector('.strip-mile')), mile);
  }
});

test("the ornaments' glyphs: a fern, a twig, a diamond, a pencil, each on its grid; none is the lily's gold star", () => {
  for (const rects of [FERN_RECTS, TWIG_RECTS, PENCIL_RECTS]) for (const [x, y, w, h] of rects) assert.ok(x >= 0 && y >= 0 && x + w <= 8 && y + h <= 8);
  assert.deepEqual(Object.keys(ORNAMENTS), ['good', 'mishap', 'serious', 'death']);
  assert.deepEqual(
    Object.values(ORNAMENTS).map((o) => o.name),
    ['trail.outcome.good', 'trail.outcome.mishap', 'trail.outcome.serious', 'trail.outcome.serious'],
  );
});

test('renderOutcome on its own: no pencil rows, no list; an unknown severity, no ornament', (t) => {
  device(t);
  const doc = frameDoc();
  const notes = renderOutcome(doc, { outcome: 'good', pencil: [] });
  assert.deepEqual(notes.children.map((c) => c.className), ['box ornament']);
  assert.deepEqual(renderOutcome(doc, { outcome: 'odd' }).children, []);
});
