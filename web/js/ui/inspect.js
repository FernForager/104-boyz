// The line inspector (GAME_DESIGN 18.6, 18.8; BUILD_PLAN 10.3, S5). On
// preview, in debug mode, a long press on any words opens a card: the
// line's id and the hash of its words, its state, its length against its
// max (T15's count) and its batch, the context note, the words, and Copy
// for chat, which puts all of that on the clipboard to paste into a chat
// with your own words after it (an edit, read like a batch answer).
//
// ui/debug.js loads it when debug mode starts, on a build whose <html
// data-screens> lists the trail (preview); main's page never imports it.
// Its data is preview's text/meta.json (tools/text.mjs metaFor: each line's
// state, ctx, screen, max, length, hash and batch), fetched once.
//
// The gesture: a press of PRESS_MS on an element with data-t, data-t-attr
// or data-t-aria, or inside one (the nearest such ancestor), or on an
// element whose line is tagged on a child (a choice's padding, off its
// label: the button's line; see lineAt), with the pointer moving under
// MOVE_PX; moving further, lifting early or the
// browser taking the touch for a scroll cancels it. A long press is an
// accelerator only (12.1), never the only way to anything. A press held
// PRESS_MS is never a tap, card or not: the click that follows its release
// is swallowed (a capture-phase listener, for SWALLOW_MS after the
// release), so a long press on a choice never commits it, nor lands on the
// card's scrim, and neither does one that drifted MOVE_PX before the card
// opened (still a tap to a browser's slop) or one that landed on no line
// (between two choices, where iOS sends the click to the nearest).
//
// Its labels are dev words (18.2); the ids, hashes, ctx and words it shows
// are data. Copy for chat builds its text at once, inside the tap, and
// copies it (platform/share.js); if the clipboard refuses, the text shows
// selected (a long press offers iOS's Copy) and the next tap opens the
// share sheet, as Copy bug report does (BUILD_PLAN 2.8).

import { t, tx, wordsOf, lineState } from '../text.js';
import { copyText, shareText, selectAll } from '../platform/share.js';

/** How long a press opens the card (ms). */
export const PRESS_MS = 500;
/** How far the pointer may move during it (CSS px). */
export const MOVE_PX = 10;
/** How long after the release the next click is swallowed (ms). */
export const SWALLOW_MS = 400;
/** The attributes that name a line (tools/text.mjs fills; tx(); spoken names set with t()). */
export const LINE_ATTRS = Object.freeze(['data-t', 'data-t-aria', 'data-t-attr']);
/** How long the ✓ shows after a copy (as the debug menu's). */
const DONE_MS = 2000;
const SHEET_ID = 'inspect-sheet';
const HEAD_ID = 'inspect-id';
const META = new URL('../../text/meta.json', import.meta.url);

/**
 * @typedef {{state: string, ctx: string, screen: string, max: number | null, len: number | null, hash: string, batch: string | null, n: number | null}} LineMeta
 * @typedef {{id: string, hash: string | null, state: string, len: number | null, max: number | null, batch: string | null, n: number | null, ctx: string, words: string}} LineInfo
 */

/**
 * The first id of a data-t-attr chain ("aria-label:title.start_label|app.name")
 * that the bundle has words for, as the build's fill picks it.
 * @param {string} spec
 * @param {(id: string) => boolean} known
 */
export function attrLine(spec, known) {
  for (const part of String(spec).split(';')) {
    const k = part.indexOf(':');
    for (const id of part.slice(k + 1).split('|').map((s) => s.trim())) {
      if (!id) break;
      if (known(id)) return id;
    }
  }
  return null;
}

/** The controls whose line can sit on a child: a press anywhere on one is a press on its line (its first, as the title's Begin and its note). */
const CONTROLS = new Set(['BUTTON', 'A', 'LABEL', 'SUMMARY']);

/**
 * The line an element itself names, or null.
 * @param {any} n
 * @param {(id: string) => boolean} known
 */
function ownLine(n, known) {
  const direct = n.getAttribute('data-t') || n.getAttribute('data-t-aria');
  if (direct) return direct;
  const chain = n.getAttribute('data-t-attr');
  return chain ? attrLine(chain, known) : null;
}

/**
 * The shown elements under n that name a line, in document order, with
 * their ids (a tagged element's own children are its line's, so the walk
 * stops there), at most `most` of them.
 * @param {any} n
 * @param {(id: string) => boolean} known
 * @param {number} most
 * @returns {{el: HTMLElement, id: string}[]}
 */
function linesUnder(n, known, most) {
  /** @type {{el: HTMLElement, id: string}[]} */
  const out = [];
  const visit = (/** @type {any} */ el) => {
    for (const kid of Array.from(/** @type {ArrayLike<any>} */ (el.children || []))) {
      if (out.length >= most) return;
      if (typeof kid.getAttribute !== 'function' || kid.getAttribute('hidden') !== null) continue; // a hidden line is never under the finger
      const id = ownLine(kid, known);
      if (id) out.push({ el: kid, id });
      else visit(kid);
    }
  };
  visit(n);
  return out;
}

/**
 * The element a press landed in that names a line, and its id: the
 * nearest of el and its ancestors with data-t, data-t-aria or data-t-attr,
 * or with the line tagged on a child: a control's (a press on a button's
 * padding, off its label, is a press on its line; its first, when it has
 * two), or a plain element's one line. Two lines under a plain element (a
 * press between the box's paragraphs, or between two choices) name
 * neither, so from there only an ancestor's own tag counts.
 * @param {any} el
 * @param {(id: string) => boolean} [known] the bundle has the id (for a data-t-attr chain)
 * @returns {{el: HTMLElement, id: string} | null}
 */
export function lineAt(el, known = (id) => wordsOf(id) !== undefined) {
  let below = true;
  for (let n = el; n && typeof n.getAttribute === 'function'; n = n.parentNode) {
    const id = ownLine(n, known);
    if (id) return { el: n, id };
    if (!below) continue;
    const under = linesUnder(n, known, 2);
    if (under.length && (under.length === 1 || CONTROLS.has(String(n.tagName).toUpperCase()) || n.getAttribute('role') === 'button')) return under[0];
    if (under.length) below = false;
  }
  return null;
}

/** A line's words as one string: a plural's forms joined by " / ". */
function plainWords(/** @type {unknown} */ w) {
  if (typeof w === 'string') return w;
  if (w && typeof w === 'object') return Object.values(w).map(String).join(' / ');
  return '';
}

/**
 * Pure: what the card shows for an id, from meta.json (or, for a place or
 * a term, which are not ours, from its id): the state, length, max, batch,
 * ctx, hash and the working words.
 * @param {string} id
 * @param {Record<string, LineMeta> | null} meta
 * @param {(id: string) => unknown} [words]
 * @returns {LineInfo}
 */
export function lineInfo(id, meta, words = wordsOf) {
  const m = meta && Object.prototype.hasOwnProperty.call(meta, id) ? meta[id] : null;
  const name = /^(place|term)\./.exec(id);
  return {
    id,
    hash: m ? m.hash : null,
    state: m ? m.state : name ? name[1] : lineState(id),
    len: m ? m.len : null,
    max: m ? m.max : null,
    batch: m ? m.batch : null,
    n: m ? m.n : null,
    ctx: m ? m.ctx : '',
    words: plainWords(words(id)),
  };
}

/** The batch and number, as the card and the chat show them, or dev.inspect.none's words. */
function batchWords(/** @type {LineInfo} */ info) {
  return info.batch ? `${info.batch} #${info.n}` : t('dev.inspect.none');
}

/** A number, or ? when there is none. */
const orQ = (/** @type {number | null} */ v) => (v === null || v === undefined ? '?' : String(v));

/**
 * Pure: the text Copy for chat copies: the id, the hash of its words, its
 * state, length against max and batch on the first row; the words, quoted;
 * the context note.
 * @param {LineInfo} info
 */
export function chatText(info) {
  const head = [info.id, info.hash || '?', info.state, `${orQ(info.len)}/${orQ(info.max)}`, batchWords(info)].join(' · ');
  const ctx = info.ctx ? `\nctx: ${info.ctx}` : ''; // t-ok: the chat format's field name (dev words, BUILD_PLAN 10.3)
  return `${head}\n"${info.words}"${ctx}`;
}

/**
 * An element with its classes and attributes.
 * @param {Document} doc
 * @param {string} tag
 * @param {string[]} cls
 * @param {Record<string, string>} [attrs]
 */
function make(doc, tag, cls, attrs = {}) {
  const el = doc.createElement(tag);
  el.classList.add(...cls);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

/**
 * Install the inspector on a page (ui/debug.js calls it when debug mode
 * starts, preview only). Returns open(id) (the card, for tests), close(),
 * and uninstall().
 * @param {Document} doc
 * @param {{meta?: Promise<Record<string, LineMeta> | null>, fetchFn?: (url: URL) => Promise<Response>, nav?: any}} [o]
 */
export function installInspector(doc, { fetchFn = (u) => fetch(u), meta, nav = globalThis.navigator } = {}) {
  /** @type {Record<string, LineMeta> | null} */
  let data = null;
  const metaP = (
    meta ||
    fetchFn(META)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
  ).then((m) => {
    data = m;
    return m;
  });

  /** @type {{x: number, y: number, timer: ReturnType<typeof setTimeout>, id: string} | null} */
  let press = null;
  /** Swallow the next click: 'armed' while the finger is still down, then for SWALLOW_MS after the release. */
  let swallow = false;
  /** A primary press's hold, on a line or not and however far it moved: its timer until PRESS_MS, then held. @type {ReturnType<typeof setTimeout> | null} */
  let holdTimer = null;
  let held = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let swallowTimer = null;
  /** @type {HTMLElement | null} */
  let scrim = null;

  const cancel = () => {
    if (press) clearTimeout(press.timer);
    press = null;
  };

  const endHold = () => {
    if (holdTimer) clearTimeout(holdTimer);
    holdTimer = null;
    held = false;
  };

  const close = () => {
    if (scrim && scrim.parentNode) scrim.parentNode.removeChild(scrim);
    scrim = null;
  };

  /** @param {string} id */
  const open = (id) => {
    close();
    const info = lineInfo(id, data);
    scrim = make(doc, 'div', ['scrim', 'inspect-scrim']);
    const sheet = make(doc, 'div', ['sheet', 'box', 'inspect'], { id: SHEET_ID, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': HEAD_ID });
    const head = make(doc, 'div', ['debug-head']);
    const idEl = make(doc, 'p', ['debug-id', 'inspect-id'], { id: HEAD_ID });
    idEl.textContent = info.hash ? `${info.id} · ${info.hash}` : info.id; // an id and a hash, shown as data
    const x = make(doc, 'button', ['debug-close'], { type: 'button', 'aria-label': t('dev.close'), 'data-t-aria': 'dev.close' });
    x.textContent = '×';
    head.appendChild(idEl);
    head.appendChild(x);
    const line = make(doc, 'p', ['inspect-line']);
    tx(line, 'dev.inspect.line', { state: info.state, len: orQ(info.len), max: orQ(info.max), batch: batchWords(info) });
    const ctx = make(doc, 'p', ['inspect-ctx']);
    ctx.textContent = info.ctx; // the line's ctx note, shown as data
    const words = make(doc, 'p', ['inspect-words']);
    words.textContent = `"${info.words}"`; // the line's words, shown as data
    const area = /** @type {HTMLTextAreaElement} */ (make(doc, 'textarea', ['report', 'inspect-area'], { readonly: '', 'aria-labelledby': HEAD_ID }));
    area.hidden = true;
    const copy = make(doc, 'button', ['box', 'choice', 'inspect-copy'], { type: 'button' });
    tx(copy, 'dev.inspect.copy');
    // Inside the tap: the text is built and the clipboard written at once.
    copy.addEventListener('click', () => {
      const text = chatText(lineInfo(id, data));
      if (copy.dataset.mode === 'share') {
        area.value = text;
        shareText(text, nav).catch(() => selectAll(area));
        return;
      }
      copyText(text, nav).then(
        () => {
          copy.classList.add('done');
          setTimeout(() => copy.classList.remove('done'), DONE_MS);
        },
        () => {
          area.value = text;
          area.hidden = false;
          selectAll(area);
          copy.dataset.mode = 'share';
        },
      );
    });
    x.addEventListener('click', close);
    scrim.addEventListener('click', (/** @type {Event} */ event) => {
      if (event.target === scrim) close();
    });
    for (const n of [head, line, ctx, words, area, copy]) sheet.appendChild(n);
    scrim.appendChild(sheet);
    doc.body.appendChild(scrim);
    if (typeof x.focus === 'function') x.focus({ preventScroll: true });
    return sheet;
  };

  /** @param {PointerEvent} event */
  const down = (event) => {
    cancel();
    if (event.isPrimary === false || (typeof event.button === 'number' && event.button > 0)) return;
    const target = /** @type {any} */ (event.target);
    endHold();
    if (scrim && target && typeof scrim.contains === 'function' && scrim.contains(target)) return; // a press on the card is the card's
    holdTimer = setTimeout(() => {
      holdTimer = null;
      held = true;
    }, PRESS_MS);
    const hit = lineAt(target);
    if (!hit) return;
    const x = event.clientX || 0;
    const y = event.clientY || 0;
    press = {
      x,
      y,
      id: hit.id,
      timer: setTimeout(() => {
        const id = hit.id;
        press = null;
        swallow = true;
        metaP.then(() => open(id));
      }, PRESS_MS),
    };
  };
  /** @param {PointerEvent} event */
  const move = (event) => {
    if (!press) return;
    if (Math.hypot((event.clientX || 0) - press.x, (event.clientY || 0) - press.y) >= MOVE_PX) cancel();
  };
  /** @param {PointerEvent} event */
  const up = (event) => {
    cancel();
    if (event.isPrimary !== false) {
      if (held && event.type === 'pointerup') swallow = true; // a held press is never a tap (a cancelled one sends no click)
      endHold();
    }
    if (!swallow) return;
    if (swallowTimer) clearTimeout(swallowTimer);
    swallowTimer = setTimeout(() => {
      swallow = false;
      swallowTimer = null;
    }, SWALLOW_MS);
  };
  /** @param {Event} event */
  const click = (event) => {
    if (!swallow) return;
    swallow = false;
    if (swallowTimer) clearTimeout(swallowTimer);
    swallowTimer = null;
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
  };
  /** A long press's own menu (a desktop's right click, Android's) never opens over a line. @param {Event} event */
  const menu = (event) => {
    if (lineAt(/** @type {any} */ (event.target))) event.preventDefault();
  };
  /** @type {[string, (event: any) => void][]} */
  const on = [
    ['pointerdown', down],
    ['pointermove', move],
    ['pointerup', up],
    ['pointercancel', up],
    ['click', click],
    ['contextmenu', menu],
  ];
  for (const [type, f] of on) doc.addEventListener(type, f, { capture: true });
  // frame.css: while this listens, a long press on words never starts iOS's
  // text selection or its callout, which would take the touch first.
  doc.documentElement.setAttribute('data-inspect', '');
  return {
    /** @param {string} id */
    open: (id) => metaP.then(() => open(id)),
    close,
    ready: metaP,
    uninstall() {
      cancel();
      endHold();
      close();
      for (const [type, f] of on) doc.removeEventListener(type, f, { capture: true });
      doc.documentElement.removeAttribute('data-inspect');
    },
  };
}
