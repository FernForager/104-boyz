// The Sierra message box (GAME_DESIGN 2.4, 12.1, 12.2; BUILD_PLAN 2.5,
// S6): snow, a double brick border, ink text, real HTML. S3's renderStop
// (ui/stop.js) builds it, one <p data-t> per line, and the frame focuses it
// on every new stop.
//
// The ▾ continuation (S6; 12.1: "a box that doesn't fit continues in a
// second box, ▾ in the corner, the way King's Quest showed a long message,
// never a scroll"). continueBox() moves the box's lines into a window
// (div.box-view) over the whole text (div.box-flow), so all of it stays in
// the DOM and VoiceOver reads the whole box; the window shows one page of
// whole line boxes at a time, measured with Range.getClientRects(), so a
// page never cuts a line in half. While pages remain, the ▾ (a brick pixel
// glyph in a 44-pt button named More, trail.box.more) sits in the box's
// corner, and a tap on the box or on the ▾ shows the next page; the frame
// keeps the choices inert until the last page (aria-disabled, dimmed by an
// outline, not by opacity), so nobody commits a diamond before reading its
// box. The same mechanism serves the Look box (ui/look.js) and an outcome's
// box. T02 (tools/textlint.mjs) predicts which boxes continue; this is the
// runtime backstop for any difference between its model and Safari.
//
// checkBox's console warning stays as a dev signal on preview: a box that
// continues says so.

import { t } from '../text.js';
import { pixelGlyph } from './choices.js';

/** The ▾ on a 7 x 4 grid of font pixels. */
export const MORE_RECTS = Object.freeze([
  [0, 0, 7, 1],
  [1, 1, 5, 1],
  [2, 2, 3, 1],
  [3, 3, 1, 1],
]);
/** The ▾'s spoken name. */
export const MORE_LINE = 'trail.box.more';

/**
 * Does the box's text fit its space? (Its content isn't taller than its
 * box, with a pixel for rounding.)
 * @param {{scrollHeight: number, clientHeight: number}} el
 */
export function boxFits(el) {
  return el.scrollHeight <= el.clientHeight + 1;
}

/**
 * Warn on preview when the box's words go past its space (it continues
 * with ▾; S5 clipped it).
 * @param {HTMLElement | null} el the box, or null on a quiet stop
 * @returns {boolean} whether it fits
 */
export function checkBox(el) {
  if (!el || typeof el.scrollHeight !== 'number') return true;
  const fits = boxFits(el);
  const preview = el.ownerDocument.documentElement.dataset.channel !== 'main';
  if (!fits && preview) console.warn('frame: box overflows', el.scrollHeight, el.clientHeight);
  return fits;
}

/**
 * Pure: the pages of a box, from its line boxes (top and bottom, in CSS px
 * from the top of the text) and the height its window shows. Each page
 * starts at a line's top and holds every whole line that ends within the
 * window; a line taller than the window gets a page of its own. Returns
 * each page's {top, bottom}: where the window starts and how far it shows.
 * @param {readonly {top: number, bottom: number}[]} lines in reading order
 * @param {number} height the window's height
 * @returns {{top: number, bottom: number}[]}
 */
export function pagesOf(lines, height) {
  /** @type {{top: number, bottom: number}[]} */
  const pages = [];
  let i = 0;
  while (i < lines.length) {
    const top = lines[i].top;
    let bottom = lines[i].bottom;
    let j = i + 1;
    while (j < lines.length && lines[j].bottom - top <= height + 0.5) bottom = lines[j++].bottom;
    pages.push({ top, bottom });
    i = j;
  }
  return pages;
}

/**
 * Pure: the rects of a text's runs (Range.getClientRects of each text
 * node, in any order) merged into line boxes, top to bottom: a rect joins
 * a line when its middle is within half a line of that line's middle
 * (half the line height, or with none given half the shorter rect).
 * Never by overlap: a font's content area can be taller than its line
 * (Literata's is, at 1.35: its runs on one line overlap the next line's
 * by a few pixels), and that would merge a whole paragraph into one line.
 * With a line height, each line box is that tall about its middle (a text
 * run's rect is its font's height, not its line's), so a page's window
 * holds whole lines, their leading too.
 * @param {readonly {top: number, bottom: number}[]} rects
 * @param {number} [origin] the text's own top, subtracted
 * @param {number} [lineHeight] the text's line height (CSS px), or 0
 * @returns {{top: number, bottom: number}[]}
 */
export function lineBoxes(rects, origin = 0, lineHeight = 0) {
  const mid = (/** @type {{top: number, bottom: number}} */ r) => (r.top + r.bottom) / 2;
  /** @type {{top: number, bottom: number, mid: number, h: number}[]} */
  const lines = [];
  const sorted = rects.filter((r) => r.bottom > r.top).map((r) => ({ top: r.top - origin, bottom: r.bottom - origin })).sort((a, b) => mid(a) - mid(b) || a.top - b.top);
  for (const r of sorted) {
    const last = lines[lines.length - 1];
    const h = r.bottom - r.top;
    const half = lineHeight > 0 ? lineHeight / 2 : Math.min(h, last ? last.h : h) / 2;
    if (last && Math.abs(mid(r) - last.mid) < half) {
      last.top = Math.min(last.top, r.top);
      last.bottom = Math.max(last.bottom, r.bottom);
    } else lines.push({ ...r, mid: mid(r), h });
  }
  const out = lines.map((l) => ({ top: l.top, bottom: l.bottom }));
  if (!(lineHeight > 0)) return out;
  return out.map((l) => {
    const mid = (l.top + l.bottom) / 2;
    const h = Math.max(lineHeight, l.bottom - l.top);
    return { top: mid - h / 2, bottom: mid + h / 2 };
  });
}

/**
 * The line boxes of an element's text, measured (null where the page
 * can't: Node's tests, or a browser with no Range): each text node's runs,
 * merged by line.
 * @param {HTMLElement} flow
 * @returns {{top: number, bottom: number}[] | null}
 */
function measureLines(flow) {
  const doc = flow.ownerDocument;
  if (typeof doc.createRange !== 'function' || typeof flow.getBoundingClientRect !== 'function') return null;
  /** @type {DOMRect[]} */
  const rects = [];
  const walk = (/** @type {Node} */ n) => {
    if (n.nodeType === 3) {
      const range = doc.createRange();
      range.selectNodeContents(n);
      rects.push(...Array.from(range.getClientRects()));
    } else for (const c of Array.from(n.childNodes)) walk(c);
  };
  walk(flow);
  const win = doc.defaultView;
  const lh = win ? parseFloat(win.getComputedStyle(flow).lineHeight) : 0;
  const origin = flow.getBoundingClientRect().top;
  const boxes = lineBoxes(rects, origin, Number.isFinite(lh) ? lh : 0);
  // Each line's ink bottom: a tall face (Literata) draws its descenders
  // below the line's box, into the next line's, so a later page clips them.
  return boxes.map((b) => {
    let ink = b.bottom;
    for (const r of rects) {
      const m = (r.top + r.bottom) / 2 - origin;
      if (m >= b.top && m < b.bottom) ink = Math.max(ink, r.bottom - origin);
    }
    return { ...b, ink };
  });
}

/**
 * @typedef {object} Pager
 * @property {() => number} pages how many pages the box has now
 * @property {() => number} page the page showing (0 first)
 * @property {() => boolean} waiting pages remain after this one
 * @property {() => boolean} next show the next page; false on the last
 * @property {() => void} relayout measure again (a resize, the fonts, a new text size)
 * @property {HTMLButtonElement} more the ▾
 */

/**
 * Give a box the ▾ continuation: its lines move into div.box-view >
 * div.box-flow, and a 44-pt ▾ button (named More) joins its corner.
 * onChange(pager) runs whenever the page or the page count changes (the
 * frame makes the choices inert while pager.waiting()). A tap on the box
 * or the ▾ shows the next page.
 * @param {HTMLElement} box
 * @param {{onChange?: (pager: Pager) => void, measure?: (flow: HTMLElement) => {top: number, bottom: number}[] | null, height?: (view: HTMLElement) => number}} [o]
 *   measure and height: the page's own by default; tests pass their own
 * @returns {Pager}
 */
export function continueBox(box, { onChange, measure = measureLines, height = viewHeight } = {}) {
  const doc = box.ownerDocument;
  const view = doc.createElement('div');
  view.className = 'box-view';
  const flow = doc.createElement('div');
  flow.className = 'box-flow';
  while (box.firstChild) flow.appendChild(box.firstChild);
  view.appendChild(flow);
  box.appendChild(view);
  const more = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
  more.className = 'box-more';
  more.setAttribute('type', 'button');
  more.setAttribute('aria-label', t('trail.box.more'));
  more.setAttribute('data-t-aria', MORE_LINE); // the line inspector finds a spoken name by it
  more.appendChild(pixelGlyph(doc, 7, 4, MORE_RECTS, 'more-glyph'));
  more.hidden = true;
  box.appendChild(more);
  /** @type {{top: number, bottom: number}[]} */
  let pages = [];
  /** @type {{top: number, bottom: number, ink?: number}[]} */
  let measured = [];
  let page = 0;

  const show = () => {
    const p = pages[page];
    view.style.removeProperty('clip-path');
    if (!p || pages.length < 2) {
      flow.style.removeProperty('transform');
      view.style.removeProperty('height');
      box.removeAttribute('data-pages');
      more.hidden = true;
    } else {
      // Whole CSS pixels, so the pixel font's glyphs stay on device pixels.
      const top = Math.round(p.top);
      flow.style.setProperty('transform', `translateY(${-top}px)`);
      view.style.setProperty('height', `${Math.round(p.bottom) - top}px`);
      // The last line of the page before may reach into this window with its
      // descenders' tips: hide that strip.
      const before = measured.filter((l) => l.bottom <= p.top + 0.5).pop();
      const bleed = before && typeof before.ink === 'number' ? Math.ceil(before.ink - top) : 0;
      if (bleed > 0) view.style.setProperty('clip-path', `inset(${bleed}px 0 0 0)`);
      box.setAttribute('data-pages', `${page + 1}/${pages.length}`);
      more.hidden = page >= pages.length - 1;
    }
    if (onChange) onChange(pager);
  };

  /** @type {Pager} */
  const pager = {
    pages: () => Math.max(1, pages.length),
    page: () => page,
    waiting: () => page < pages.length - 1,
    next() {
      if (page >= pages.length - 1) return false;
      page++;
      show();
      // VoiceOver already read the whole box; sighted, the page turned.
      return true;
    },
    relayout() {
      // Measure the whole text, unclipped, then show the page again.
      flow.style.removeProperty('transform');
      view.style.removeProperty('height');
      const lines = measure(flow);
      measured = lines || [];
      const h = height(view);
      const shown = pages[page];
      pages = lines && lines.length && h > 0 ? pagesOf(lines, h) : [];
      // Keep the reader where they were: the page holding the line they were on.
      page = shown ? Math.max(0, pages.findIndex((p) => p.bottom > shown.top)) : 0;
      if (page >= pages.length) page = Math.max(0, pages.length - 1);
      show();
    },
    more,
  };
  const onTap = (/** @type {Event} */ e) => {
    if (!pager.waiting()) return;
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    pager.next();
    if (!pager.waiting() && typeof box.focus === 'function') box.focus({ preventScroll: true });
  };
  box.addEventListener('click', onTap);
  more.addEventListener('click', onTap);
  return pager;
}

/**
 * The height a box's window may show: the box's own space (its row, less
 * its border and padding), with the window measured from where it starts.
 * @param {HTMLElement} view
 */
function viewHeight(view) {
  const box = /** @type {HTMLElement} */ (view.parentNode);
  if (!box || typeof box.getBoundingClientRect !== 'function') return 0;
  const win = box.ownerDocument.defaultView;
  const cs = win ? win.getComputedStyle(box) : null;
  const inner = box.clientHeight - (cs ? parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) : 0);
  return Math.max(0, Math.floor(inner + 1e-6));
}
