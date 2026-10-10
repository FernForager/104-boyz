// The long press (GAME_DESIGN 12.1: an accelerator, never the only way to
// anything; BUILD_PLAN S5, S6). One gesture for the page, shared by
// everything that takes a long press: the line inspector (ui/inspect.js,
// preview's debug mode) and, from S6, a rolled choice's Why sheet
// (ui/frame.js). Each registers a handler: find(target) names what a press
// there is on (or null), and run(hit) opens it once the press is held.
// The handler that registered with the higher rank goes first, so while
// the inspector listens it owns long presses (html[data-inspect]).
//
// The gesture: a primary press of PRESS_MS on something a handler finds,
// the pointer moving under MOVE_PX; moving further, lifting early or the
// browser taking the touch for a scroll cancels it. A press held PRESS_MS
// on something a handler found is never a tap, run or not: the click that
// follows its release is swallowed (a capture-phase listener, for
// SWALLOW_MS after the release), so a long press on a rolled choice never
// commits it, nor lands on the sheet it opened, and neither does one that
// drifted MOVE_PX before it ran (still a tap to a browser's slop). A
// handler that owns the page's presses (holdAll: the inspector) makes every
// held press no tap while it listens, even one that landed on nothing
// (between two choices, where iOS sends the click to the nearest).
// Otherwise a held press on anything else is a slow tap, and taps: a slow
// tapper, or iOS's Touch Accommodations' Hold Duration, still walks on. A
// press a handler ignores (on its own open card) is no press at all.
//
// The listeners go on the document at the first registration and come off
// with the last, one set per document, so two handlers never swallow twice.

/** How long a press is held to run (ms). */
export const PRESS_MS = 500;
/** How far the pointer may move during it (CSS px). */
export const MOVE_PX = 10;
/** How long after the release the next click is swallowed (ms). */
export const SWALLOW_MS = 400;

/**
 * @typedef {object} PressHandler
 * @property {(target: any) => any} find what a press on target is on, or null
 * @property {(hit: any) => void} run the long press, held
 * @property {(target: any) => boolean} [ignore] a press here is no press (a handler's own card)
 * @property {number} [rank] the higher goes first (default 0)
 * @property {boolean} [holdAll] while it listens, a held press anywhere is never a tap (the inspector)
 */

/** @type {WeakMap<Document, {handlers: PressHandler[], off: () => void}>} */
const installs = new WeakMap();

/**
 * Listen for long presses on a document; returns the function that stops.
 * @param {Document} doc
 * @param {PressHandler} handler
 * @returns {() => void}
 */
export function onLongPress(doc, handler) {
  let at = installs.get(doc);
  if (!at) {
    const handlers = /** @type {PressHandler[]} */ ([]);
    at = { handlers, off: install(doc, handlers) };
    installs.set(doc, at);
  }
  const mine = at;
  mine.handlers.push(handler);
  // Stable by rank: the earlier of two equal ranks stays first.
  mine.handlers.sort((a, b) => (b.rank || 0) - (a.rank || 0));
  return () => {
    const k = mine.handlers.indexOf(handler);
    if (k >= 0) mine.handlers.splice(k, 1);
    if (!mine.handlers.length && installs.get(doc) === mine) {
      mine.off();
      installs.delete(doc);
    }
  };
}

/**
 * The listeners, over a live list of handlers. Returns their removal.
 * @param {Document} doc
 * @param {PressHandler[]} handlers
 */
function install(doc, handlers) {
  /** @type {{x: number, y: number, timer: ReturnType<typeof setTimeout>} | null} */
  let press = null;
  /** Swallow the next click: from a run or a held release, then for SWALLOW_MS after the release. */
  let swallow = false;
  /** A primary press's hold, on something or not and however far it moved: its timer until PRESS_MS, then held. @type {ReturnType<typeof setTimeout> | null} */
  let holdTimer = null;
  let held = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let swallowTimer = null;

  const cancel = () => {
    if (press) clearTimeout(press.timer);
    press = null;
  };
  const endHold = () => {
    if (holdTimer) clearTimeout(holdTimer);
    holdTimer = null;
    held = false;
  };

  /** @param {PointerEvent} event */
  const down = (event) => {
    cancel();
    if (event.isPrimary === false || (typeof event.button === 'number' && event.button > 0)) return;
    const target = /** @type {any} */ (event.target);
    endHold();
    if (handlers.some((h) => h.ignore && h.ignore(target))) return;
    /** @type {{h: PressHandler, hit: any} | null} */
    let found = null;
    for (const h of handlers) {
      const hit = h.find(target);
      if (hit) {
        found = { h, hit };
        break;
      }
    }
    // Held, it is no tap: on what a handler found, or anywhere while one owns the page's presses.
    if (found || handlers.some((h) => h.holdAll)) {
      holdTimer = setTimeout(() => {
        holdTimer = null;
        held = true;
      }, PRESS_MS);
    }
    if (!found) return;
    const { h, hit } = found;
    press = {
      x: event.clientX || 0,
      y: event.clientY || 0,
      timer: setTimeout(() => {
        press = null;
        swallow = true;
        h.run(hit);
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
  /** @type {[string, (event: any) => void][]} */
  const on = [
    ['pointerdown', down],
    ['pointermove', move],
    ['pointerup', up],
    ['pointercancel', up],
    ['click', click],
  ];
  for (const [type, f] of on) doc.addEventListener(type, f, { capture: true });
  return () => {
    cancel();
    endHold();
    if (swallowTimer) clearTimeout(swallowTimer);
    swallowTimer = null;
    swallow = false;
    for (const [type, f] of on) doc.removeEventListener(type, f, { capture: true });
  };
}
