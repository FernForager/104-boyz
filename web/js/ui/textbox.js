// The Sierra message box (GAME_DESIGN 2.4, 12.2; BUILD_PLAN 2.5): snow, a
// double brick border, ink text, real HTML. S3's renderStop (ui/stop.js)
// builds it, one <p data-t> per line, and the frame focuses it on every new
// stop. This module holds what S6 grows: the ▾ continuation, for a box too
// long for its space (12.1's box budget, lint T02). In S5 a box that
// doesn't fit is clipped by frame.css, and the frame warns in the console
// on preview, so a screenshot can't hide it.

/**
 * Does the box's text fit its space? (Its content isn't taller than its
 * box, with a pixel for rounding.)
 * @param {{scrollHeight: number, clientHeight: number}} el
 */
export function boxFits(el) {
  return el.scrollHeight <= el.clientHeight + 1;
}

/**
 * Warn on preview when the box overflows (S5; S6's ▾ continues it instead).
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
