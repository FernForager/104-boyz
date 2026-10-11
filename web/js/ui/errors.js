// The errors ring and the error sheet (GAME_DESIGN E.11, 18.5). Every
// uncaught error is kept, newest last, for the bug report, and opens the
// sheet: one fixed, approved line, Copy bug report and Restart. The error's
// own message stays inside the report. The sheet is static markup in the
// shell, filled by the build, so it shows even when a module fails to load:
// until installErrors runs, boot.js opens it, and hands over what it kept.
// Restart is boot.js's restart(), so a waiting fix takes over; inside the
// game it comes back where you were, without the title screen (S7b,
// platform/resume.js). sw-client.js notes its own failures here without
// opening the sheet.
//
// The report holds no personal data: an error's source is a path inside the
// site, and every URL in its message and stack is cut to that path (or, off
// the site, to its scheme alone), with no query or hash (boot.js's scrub).

import { sitePath, scrub, handOver, restart } from '../boot.js';
import { markResume } from '../platform/resume.js';

export { sitePath };

const RING = 10;
/** What an error keeps of its message and stack before anything reads them (the report cuts further). */
const KEEP_CHARS = 20000;
const FRAME_RE = /\b([a-z][a-z0-9+.-]{0,31}:\/\/[^\s)'"]+?):(\d+):(\d+)/i;
/** The site's root (the shell is two folders up from here), for relative sources. */
const SITE = new URL('../../', import.meta.url).href;

/** @typedef {{message: string, stack: string, source: string | null, line: number | null, col: number | null, ms: number}} ErrorFacts */

/** @type {ErrorFacts[]} */
const ring = [];
/** @type {Document | null} */
let sheetDoc = null;
/** @type {(button: HTMLElement, area: HTMLTextAreaElement) => unknown} */
let copyFn = () => undefined;

const now = () => (typeof performance !== 'undefined' ? Math.round(performance.now()) : 0);

/**
 * Pure: what the report keeps of an error. Message, stack, the source as a
 * path relative to the site, its line and column, and the time since launch
 * in ms. Takes an Error, anything thrown, or an ErrorEvent's own fields.
 * @param {unknown} err
 * @param {{filename?: string, lineno?: number, colno?: number, ms?: number, base?: string}} [o]
 * @returns {ErrorFacts}
 */
export function describeError(err, o = {}) {
  const base = o.base || SITE;
  const e = /** @type {any} */ (err);
  let message;
  if (e === undefined || e === null) message = String(e);
  else if (typeof e === 'object' && 'message' in e) message = e.name && e.name !== Error.prototype.name ? `${e.name}: ${e.message}` : String(e.message);
  else message = String(e);
  message = message.slice(0, KEEP_CHARS);
  const stack = e && typeof e === 'object' && typeof e.stack === 'string' ? e.stack.slice(0, KEEP_CHARS) : '';
  let source = o.filename || null;
  let line = typeof o.lineno === 'number' && Number.isFinite(o.lineno) ? o.lineno : null;
  let col = typeof o.colno === 'number' && Number.isFinite(o.colno) ? o.colno : null;
  if (!source && stack) {
    // The first frame with a URL: Safari's fn@url:1:2, or V8's "at fn (url:1:2)".
    const m = FRAME_RE.exec(stack);
    if (m) {
      source = m[1];
      line = Number(m[2]);
      col = Number(m[3]);
    }
  }
  return {
    message: scrub(message, base),
    stack: scrub(stack, base),
    source: source ? sitePath(source, base) : null,
    line,
    col,
    ms: Number.isFinite(o.ms) ? /** @type {number} */ (o.ms) : now(),
  };
}

/**
 * Keep an error in the ring (the newest 10) and return what was kept.
 * @param {unknown} err
 * @param {{filename?: string, lineno?: number, colno?: number, ms?: number}} [o]
 */
export function noteError(err, o) {
  const facts = describeError(err, o);
  ring.push(facts);
  while (ring.length > RING) ring.shift();
  return facts;
}

/** The kept errors, newest last. */
export function recentErrors() {
  return ring.slice();
}

/** Empty the ring (tests). */
export function clearErrors() {
  ring.length = 0;
}

/**
 * Show the error sheet, noting the error first when one is given. It is
 * never shown twice at once. Focus goes to Copy bug report.
 * @param {unknown} [err]
 */
export function showError(err) {
  if (err !== undefined) noteError(err);
  try {
    const doc = sheetDoc || (typeof document === 'undefined' ? null : document);
    const sheet = doc && doc.getElementById('error-sheet');
    if (!sheet || !sheet.hidden) return;
    sheet.hidden = false;
    const copy = doc.getElementById('error-copy');
    if (copy) copy.focus();
  } catch {
    // the sheet itself is broken: the static page stays, never a white screen
  }
}

/**
 * Listen for every uncaught error and rejection, and wire the sheet's two
 * buttons. Runs first in main.js, so nothing after it can white-screen; it
 * takes over from boot.js, with the errors boot.js kept. copy is debug.js's
 * copyReport, passed in so this module never imports it.
 * @param {Document} doc
 * @param {{copy?: (button: HTMLElement, area: HTMLTextAreaElement) => unknown}} [o]
 */
export function installErrors(doc, { copy } = {}) {
  sheetDoc = doc;
  if (copy) copyFn = copy;
  for (const k of handOver()) noteError(k.error, k);
  const win = doc.defaultView;
  if (win) {
    win.addEventListener('error', (event) => {
      // Script errors only: a picture or font that fails to load is the
      // element's own business (those events don't reach window anyway).
      if (event.target !== win && !event.error) return;
      noteError(event.error ?? event.message, { filename: event.filename, lineno: event.lineno, colno: event.colno });
      showError();
    });
    win.addEventListener('unhandledrejection', (event) => {
      noteError(event.reason);
      showError();
    });
  }
  const copyButton = doc.getElementById('error-copy');
  const area = /** @type {HTMLTextAreaElement | null} */ (doc.getElementById('error-report'));
  if (copyButton && area) copyButton.addEventListener('click', () => copyFn(copyButton, area));
  const again = doc.getElementById('error-restart');
  if (again && win) {
    again.addEventListener('click', () => {
      // Restart reloads, into the new build when one waits (a reload alone
      // would keep the broken one), and the game comes back on its
      // autosave: every tap saves before the screen changes (ui/app.js), so
      // nothing is rewound or lost (E.11). Pressed after the game has taken
      // the page, the reload skips the title screen (S7b, Lead call 65).
      markResume(doc);
      restart(win);
    });
  }
}
