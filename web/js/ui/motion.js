// Reduce Motion (GAME_DESIGN 11.9, 12.1; BUILD_PLAN S6): the one place the
// game asks the phone whether motion is welcome, and hears when that
// changes. The system setting (Settings, Accessibility, Motion) turns off:
//
//   the draw-in       the picture shows finished (gfx/drawin.js)
//   palette cycling   the water and the stars hold still, and stop live
//                     when the setting turns on mid-stop (ui/frame.js,
//                     ui/home.js); they start again when it turns off
//   the compass spin  the needle is at rest at once, with one ui.land tick
//                     (ui/compass.js)
//   the sheet's slide, the Look box's pop and the confirm's swap: they
//                     appear (frame.css: every transition and animation sits
//                     inside @media (prefers-reduced-motion: no-preference),
//                     which a test holds)
//
// The in-game Pictures setting (11.4, the mailbox) is M6's, not this.

/** The media query the phone answers. */
export const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * The query's MediaQueryList, or null where there is none (Node).
 * @param {{matchMedia?: (q: string) => MediaQueryList} | null} [win]
 * @returns {MediaQueryList | null}
 */
function queryOf(win) {
  const w = win === undefined ? /** @type {any} */ (globalThis) : win;
  return w && typeof w.matchMedia === 'function' ? w.matchMedia(REDUCE_QUERY) : null;
}

/**
 * Does the phone ask for less motion, right now?
 * @param {{matchMedia?: (q: string) => MediaQueryList} | null} [win] the window (default: this one)
 */
export function reducedMotion(win) {
  const mq = queryOf(win);
  return Boolean(mq && mq.matches);
}

/**
 * Hear the setting change while a screen shows: onChange(reduced) runs on
 * every flip. Returns the function that stops listening.
 * @param {(reduced: boolean) => void} onChange
 * @param {{matchMedia?: (q: string) => MediaQueryList} | null} [win]
 * @returns {() => void}
 */
export function onMotionChange(onChange, win) {
  const mq = queryOf(win);
  if (!mq) return () => {};
  const listener = (/** @type {{matches: boolean}} */ e) => onChange(Boolean(e.matches));
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }
  // Safari before 14 knows only addListener.
  const old = /** @type {any} */ (mq);
  if (typeof old.addListener === 'function') {
    old.addListener(listener);
    return () => old.removeListener(listener);
  }
  return () => {};
}

/**
 * Palette cycling that follows the setting live: start() runs now unless
 * motion is reduced; when the setting turns on, the cycles stop (the
 * picture holds still in the colors it shows), and when it turns off they
 * start again. Returns the function that stops both the cycles and the
 * listening.
 * @param {() => () => void} start starts the cycles, returning their stop
 * @param {{matchMedia?: (q: string) => MediaQueryList} | null} [win]
 * @returns {() => void}
 */
export function liveCycles(start, win) {
  /** @type {(() => void) | null} */
  let stop = reducedMotion(win) ? null : start();
  const off = onMotionChange((reduced) => {
    if (reduced && stop) {
      stop();
      stop = null;
    } else if (!reduced && !stop) stop = start();
  }, win);
  return () => {
    off();
    if (stop) stop();
    stop = null;
  };
}
