// The ▾ continuation (BUILD_PLAN S6 track C; GAME_DESIGN 12.1: a box that
// doesn't fit continues in a second box with ▾ in its corner, never a
// scroll): pages of whole line boxes, measured; all the words stay in the
// DOM, so VoiceOver reads the whole box; the ▾ is a 44-pt button named
// More; while pages remain the choices show but are inert (aria-disabled,
// an outline, never opacity) and a tap on one only turns the page; the
// same mechanism serves the Look box.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { pagesOf, lineBoxes, continueBox, checkBox, boxFits, measureLines, withinText, MORE_RECTS } from '../../web/js/ui/textbox.js';
import { renderFrame } from '../../web/js/ui/frame.js';
import { atFork, device, frameDoc, ctxFor, choiceBy } from './forkfix.mjs';

const CSS = readFileSync(join(ROOT, 'web', 'css', 'frame.css'), 'utf8');

/** n lines of 26 px, a paragraph gap of 13 after each line in gaps. */
function lines(n, gaps = []) {
  const out = [];
  let y = 0;
  for (let i = 0; i < n; i++) {
    out.push({ top: y, bottom: y + 26 });
    y += 26 + (gaps.includes(i) ? 13 : 0);
  }
  return out;
}

test('pages: whole lines, each page starting at a line\'s top and holding every line that ends in the window; a line taller than the window gets a page of its own', () => {
  assert.deepEqual(pagesOf(lines(5), 182), [{ top: 0, bottom: 130 }], 'it fits: one page');
  assert.deepEqual(pagesOf(lines(9), 182), [{ top: 0, bottom: 182 }, { top: 182, bottom: 234 }], '7 lines, then 2');
  // The fork with its intro on the SE: 4 lines, a gap, 4 lines; the window holds 6 lines and the gap.
  assert.deepEqual(pagesOf(lines(8, [3]), 169), [{ top: 0, bottom: 169 }, { top: 169, bottom: 221 }]);
  assert.deepEqual(pagesOf([{ top: 0, bottom: 300 }, { top: 300, bottom: 326 }], 100), [{ top: 0, bottom: 300 }, { top: 300, bottom: 326 }]);
  assert.deepEqual(pagesOf([], 100), []);
});

test("line boxes: a text run's rects merged by line (any order), and grown to the line's height about their middle", () => {
  const rects = [
    { top: 103, bottom: 127 },
    { top: 101, bottom: 123 }, // the same line, an <em> run
    { top: 129, bottom: 153 },
    { top: 168, bottom: 192 }, // after a paragraph gap
    { top: 140, bottom: 140 }, // an empty rect
  ];
  assert.deepEqual(lineBoxes(rects, 100), [{ top: 1, bottom: 27 }, { top: 29, bottom: 53 }, { top: 68, bottom: 92 }]);
  assert.deepEqual(lineBoxes(rects, 100, 26), [{ top: 1, bottom: 27 }, { top: 28, bottom: 54 }, { top: 67, bottom: 93 }]);
});

test("line boxes in Plain: Literata's runs are taller than its 1.35 lines and overlap the next line's, and each is still its own line", () => {
  // 20-px Literata on 27-px lines: each run's rect 30 px tall, 3 px into the next line's.
  const rects = [
    { top: -2, bottom: 28 },
    { top: 25, bottom: 55 },
    { top: 52, bottom: 82 },
  ];
  assert.deepEqual(lineBoxes(rects, 0, 27), rects, 'three lines, each as tall as its run (taller than its line)');
  assert.deepEqual(lineBoxes(rects), rects, 'with no line height too');
  // The same line in two runs (an <em>, a bold name) still merges, in any order.
  assert.deepEqual(lineBoxes([{ top: 27, bottom: 55 }, { top: 25, bottom: 55 }, { top: -2, bottom: 28 }], 0, 27), [{ top: -2, bottom: 28 }, { top: 25, bottom: 55 }]);
  // Paged in a 104-px window, three Plain lines and three more: two pages, not one per paragraph.
  const six = [0, 1, 2, 3, 4, 5].map((i) => ({ top: i * 27 - 2, bottom: i * 27 + 28 }));
  assert.equal(pagesOf(lineBoxes(six, 0, 27), 104).length, 2);
});

/**
 * A text flow as the page measures it: paragraphs of text runs (their client
 * rects), its own top and height, and its line height.
 * @param {{top: number, bottom: number}[][]} paras each paragraph's runs, in page px
 * @param {number} top
 * @param {number} height
 * @param {number} lineHeight
 */
function measuredFlow(paras, top, height, lineHeight) {
  const doc = {
    createRange() {
      let node = null;
      return { selectNodeContents: (n) => (node = n), getClientRects: () => node.rects };
    },
    defaultView: { getComputedStyle: () => ({ lineHeight: `${lineHeight}px` }) },
  };
  return { ownerDocument: doc, nodeType: 1, getBoundingClientRect: () => ({ top, height }), childNodes: paras.map((runs) => ({ nodeType: 1, childNodes: [{ nodeType: 3, rects: runs }] })) };
}

test("Plain: a porch box whose text fits keeps one page, though Literata's runs reach past its first and last lines (S7 review: the last line hid behind ▾)", () => {
  // 20-px Literata on 27-px lines: each run 30 px tall about its line's middle. Two paragraphs, one line each,
  // the second 13 px after the first: the text is 67 px tall, and so is the window the box gives it.
  const flow = measuredFlow([[{ top: 98, bottom: 128 }], [{ top: 138, bottom: 168 }]], 100, 67, 27);
  const lines = measureLines(/** @type {any} */ (flow));
  assert.deepEqual(lines.map((l) => [l.top, l.bottom]), [[0, 28], [38, 67]], 'held inside the text: 0 to 67');
  assert.equal(lines[1].ink, 68, "the last line's ink is still its own");
  assert.equal(pagesOf(lines, 67).length, 1, 'one page: no ▾');
  // Unheld, the same lines made two pages of a box that fits.
  assert.equal(pagesOf(lineBoxes([{ top: 98, bottom: 128 }, { top: 138, bottom: 168 }], 100, 27), 67).length, 2);
  // The lockbox's first box in Plain: the intro over two lines and Question 1 of 3., in 161 px of text.
  const intro = measuredFlow([[{ top: -2, bottom: 28 }, { top: 25, bottom: 55 }], [{ top: 65, bottom: 95 }, { top: 92, bottom: 122 }, { top: 119, bottom: 149 }, { top: 132, bottom: 162 }]], 0, 161, 27);
  const pager = continueBox(/** @type {any} */ (fakeBoxFor(intro)), { measure: () => measureLines(/** @type {any} */ (intro)), height: () => 161 });
  pager.relayout();
  assert.equal(pager.pages(), 1, 'the whole box on one page');
  assert.equal(pager.waiting(), false, 'its answers live at once');
  // A box that doesn't fit still continues, page by whole page.
  assert.ok(pagesOf(measureLines(/** @type {any} */ (intro)), 100).length >= 2);
  // withinText leaves lines inside the text alone, and with no height, everything.
  assert.deepEqual(withinText([{ top: 3, bottom: 30 }], 40), [{ top: 3, bottom: 30 }]);
  assert.deepEqual(withinText([{ top: -3, bottom: 50 }], 0), [{ top: -3, bottom: 50 }]);
});

/** A box for a continueBox driven by hand: the tiny DOM's, with one paragraph. */
function fakeBoxFor(/** @type {any} */ _flow) {
  const doc = frameDoc();
  const box = doc.createElement('div');
  box.classList.add('box', 'game-box', 'porch-box');
  const p = doc.createElement('p');
  p.textContent = 'words';
  box.appendChild(p);
  doc.body.appendChild(box);
  return box;
}

/** A box with n paragraphs in the tiny DOM, and a continueBox measured by hand. */
function boxOf(doc, n, measured, height) {
  const box = doc.createElement('div');
  box.classList.add('box', 'game-box');
  for (let i = 0; i < n; i++) {
    const p = doc.createElement('p');
    p.setAttribute('data-t', `line.${i}`);
    p.textContent = `words ${i}`;
    box.appendChild(p);
  }
  doc.body.appendChild(box);
  const changes = [];
  const pager = continueBox(box, { measure: () => measured, height: () => height, onChange: (pg) => changes.push([pg.page(), pg.pages(), pg.waiting()]) });
  return { box, pager, changes };
}

test('the ▾: the words move into a window over the whole text, all still in the DOM; a 44-pt button named More in the corner while pages remain; a tap on the box or the ▾ shows the next page', (t) => {
  device(t);
  const doc = frameDoc();
  const { box, pager, changes } = boxOf(doc, 3, lines(9, [2, 5]), 182);
  const flow = box.querySelector('.box-flow');
  assert.deepEqual(flow.querySelectorAll('p').map((p) => p.getAttribute('data-t')), ['line.0', 'line.1', 'line.2'], 'every line in the DOM, in its order: VoiceOver reads the whole box');
  assert.equal(box.querySelector('.box-view').childNodes[0], flow);
  const more = pager.more;
  assert.equal(more.getAttribute('aria-label'), 'More');
  assert.equal(more.getAttribute('data-t-aria'), 'trail.box.more');
  assert.equal(more.hidden, true, 'unmeasured, one page, no ▾');
  pager.relayout();
  assert.equal(pager.pages(), 2);
  assert.equal(box.getAttribute('data-pages'), '1/2');
  assert.equal(more.hidden, false);
  assert.equal(box.querySelector('.box-view').style.getPropertyValue('height'), '169px', 'six lines and a gap: the seventh would end past the window');
  assert.ok(pager.waiting());
  // A tap on the box turns the page.
  box.click();
  assert.equal(box.getAttribute('data-pages'), '2/2');
  assert.equal(flow.style.getPropertyValue('transform'), 'translateY(-182px)', 'the window starts at the next page\'s first line');
  assert.equal(more.hidden, true, 'the last page has no ▾');
  assert.ok(!pager.waiting());
  assert.equal(pager.next(), false);
  assert.deepEqual(changes, [[0, 2, true], [1, 2, false]]);
  // Measured again (a resize): the reader stays on the page holding the line they were on.
  pager.relayout();
  assert.equal(pager.page(), 1);
  // A box that fits shows no ▾ and holds no height.
  const fits = boxOf(doc, 1, lines(3), 182);
  fits.pager.relayout();
  assert.deepEqual([fits.pager.pages(), fits.pager.waiting(), fits.box.hasAttribute('data-pages'), fits.pager.more.hidden], [1, false, false, true]);
  // The ▾ is a brick pixel glyph (aria-hidden SVG), on a 7 x 4 grid.
  assert.equal(MORE_RECTS.length, 4);
  assert.equal(more.querySelector('svg').getAttribute('aria-hidden'), 'true');
});

test('the ▾ in frame.css: a 44-pt button in the box\'s corner, brick; the window hides what is past it; inert choices are dimmed by an outline, never by opacity', () => {
  assert.match(CSS, /\.box-more \{\n {2}position: absolute;\n {2}right: 0;\n {2}bottom: 0;\n {2}width: 44px;\n {2}height: 44px;/);
  assert.match(CSS, /\.box-more \{[^}]*color: var\(--c9\);/);
  assert.match(CSS, /\.box-view \{ overflow: hidden; \}/);
  assert.match(CSS, /\.frame \.game-choices\[data-wait\] \.choice,\n\.frame \.game-choices\[data-wait\] \.choice-info \{\n {2}border-color: var\(--c2\);/);
  const wait = CSS.slice(CSS.indexOf('.frame .game-choices[data-wait] .choice,'));
  assert.ok(!/opacity/.test(wait.slice(0, wait.indexOf('}'))), 'not by opacity');
  // checkBox stays a dev signal on preview.
  assert.equal(boxFits({ scrollHeight: 200, clientHeight: 199 }), true);
  assert.equal(boxFits({ scrollHeight: 202, clientHeight: 199 }), false);
});

test('the frame: while the fork\'s box has pages left, its choices show but are inert (aria-disabled, the list marked); a tap on one turns the page and never acts; on the last page they act', (t) => {
  device(t);
  const doc = frameDoc();
  const host = doc.createElement('div');
  doc.body.appendChild(host);
  const r = atFork();
  const acts = [];
  const f = renderFrame(host, r.screen, (a) => acts.push(a), ctxFor(r.screen, doc));
  // The tiny DOM can't lay out, so the box measures as one page: nothing waits.
  assert.ok(f.pager, 'the fork has a box, so a pager');
  assert.equal(f.pager.pages(), 1);
  assert.equal(host.querySelector('.game-choices').hasAttribute('data-wait'), false);
  f.release();
  // Laid out as Chromium lays out the fork with its fatal intro on the SE: eight lines with a gap, in a window
  // of six lines and the gap (the page's Range rects, the box's height and padding, the line height).
  const host2 = doc.createElement('div');
  doc.body.appendChild(host2);
  const f2 = renderFrame(host2, r.screen, (a) => acts.push(a), ctxFor(r.screen, doc));
  const box = host2.querySelector('.game-box');
  const flow = box.querySelector('.box-flow');
  flow.getBoundingClientRect = () => ({ top: 0 });
  doc.createRange = () => ({ selectNodeContents() {}, getClientRects: () => lines(8, [3]).map((l) => ({ ...l, top: l.top + 1, bottom: l.bottom - 1 })) });
  box.getBoundingClientRect = () => ({ top: 0 });
  Object.defineProperty(box, 'clientHeight', { value: 169 + 2 * 4.5 });
  doc.defaultView = { getComputedStyle: () => ({ paddingTop: '4.5', paddingBottom: '4.5', lineHeight: '26px' }) };
  f2.pager.relayout();
  assert.equal(f2.pager.pages(), 2);
  const list2 = host2.querySelector('.game-choices');
  assert.ok(list2.hasAttribute('data-wait'));
  const buttons = host2.querySelectorAll('.choice');
  assert.ok(buttons.every((b) => b.getAttribute('aria-disabled') === 'true'), 'every choice inert');
  // A tap on Back to the car turns the page; it doesn't go back to the car.
  choiceBy(host2, 'trail.deer_lake_rim.fork.car').click();
  assert.deepEqual(acts, []);
  assert.equal(f2.pager.page(), 1);
  assert.ok(!list2.hasAttribute('data-wait'));
  assert.ok(buttons.every((b) => !b.hasAttribute('aria-disabled')));
  choiceBy(host2, 'trail.deer_lake_rim.fork.car').click();
  assert.deepEqual(acts, [{ t: 'choose', c: 'car' }], 'on the last page the choice acts');
  f2.release();
  delete doc.createRange;
});

test("checkBox's warning stays on preview: a box whose words go past its space says so in the console", (t) => {
  const doc = frameDoc();
  const warned = [];
  const was = console.warn;
  console.warn = (...a) => warned.push(a[0]);
  t.after(() => {
    console.warn = was;
  });
  const el = doc.createElement('div');
  doc.body.appendChild(el);
  Object.defineProperty(el, 'scrollHeight', { value: 300 });
  Object.defineProperty(el, 'clientHeight', { value: 200 });
  assert.equal(checkBox(el), false);
  assert.deepEqual(warned, ['frame: box overflows']);
  assert.equal(checkBox(null), true, 'a quiet stop');
});

test('the ▾ in a tall face: the page after hides the tips of the last line before it, never more', (t) => {
  device(t);
  const doc = frameDoc();
  // Nine 26-px lines, no paragraph gap; each one's ink reaches 4 px below its box (Literata's descenders).
  const inked = lines(9).map((l) => ({ ...l, ink: l.bottom + 4 }));
  const { box, pager } = boxOf(doc, 3, inked, 182);
  pager.relayout();
  const view = box.querySelector('.box-view');
  assert.equal(view.style.getPropertyValue('clip-path'), '', 'the first page has nothing above it');
  box.click();
  assert.equal(view.style.getPropertyValue('clip-path'), 'inset(4px 0 0 0)', 'the strip the line before reaches into is hidden');
  // A face whose ink stays in its box (the pixel font) clips nothing.
  const flat = boxOf(doc, 3, lines(9).map((l) => ({ ...l, ink: l.bottom })), 182);
  // After a paragraph gap the ink ends above the window: nothing to hide either.
  const gapped = boxOf(doc, 3, lines(9, [2, 5]).map((l) => ({ ...l, ink: l.bottom + 4 })), 182);
  gapped.pager.relayout();
  gapped.box.click();
  assert.equal(gapped.box.querySelector('.box-view').style.getPropertyValue('clip-path'), '');
  flat.pager.relayout();
  flat.box.click();
  assert.equal(flat.box.querySelector('.box-view').style.getPropertyValue('clip-path'), '');
});
