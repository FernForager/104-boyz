// Larger Text and the Plain font (GAME_DESIGN 11.9; BUILD_PLAN S5). The box
// and the choices are drawn in the pixel fonts at a fixed size; a player
// who has asked iOS for larger text gets the Plain serif (Literata) at the
// size they asked for instead, so the game reads the way their phone does.
//
// A hidden probe styled `font: -apple-system-body` reports Dynamic Type's
// body size: 17 px at the default (Large) setting. Over 17, <html
// data-text="plain"> and --plain-size is that size (frame.css switches the
// box, the choices and the caption; the status line, the strip's label and
// the toolbar stay in the chrome font). It is read at start and whenever
// the page comes back to the foreground (iOS fires no resize for a text
// size change). Chromium has no -apple-system-body, so nothing changes
// there. The dev control *text* (auto, pixel, plain) overrides it on
// preview, kept as `text` in the channel's storage.

import { load, save } from '../platform/storage.js';
import { registerDevControl } from './debug.js';

/** Dynamic Type's body size at the default setting (Large), in CSS px. */
export const DEFAULT_BODY_PX = 17;
/** The Plain size when the dev control forces it at the default setting: the box's own 20 px. */
export const FORCED_PLAIN_PX = 20;
/** The dev control's values. */
export const TEXT_MODES = Object.freeze(['auto', 'pixel', 'plain']);
/** The Plain serif's line height (frame.css and home.css: 1.35). */
export const PLAIN_LINE = 1.35;
/** A Plain choice's border and padding, top and bottom, in font pixels ((3 + 2) twice): the trail's, the next step's and the porch's. */
export const PLAIN_CHOICE_CHROME_FP = 10;
const KEY = 'text';

/**
 * Pure: the font for a body size and an override.
 * @param {number | null} bodyPx the probe's size, or null where there's no probe
 * @param {string | null} [override] 'auto', 'pixel' or 'plain'
 * @returns {{mode: 'pixel' | 'plain', size: number | null}}
 */
export function textMode(bodyPx, override = 'auto') {
  const big = typeof bodyPx === 'number' && bodyPx > DEFAULT_BODY_PX;
  if (override === 'pixel') return { mode: 'pixel', size: null };
  if (override === 'plain') return { mode: 'plain', size: big ? /** @type {number} */ (bodyPx) : FORCED_PLAIN_PX };
  return big ? { mode: 'plain', size: /** @type {number} */ (bodyPx) } : { mode: 'pixel', size: null };
}

/**
 * Dynamic Type's body size from a hidden probe, or null when the browser
 * doesn't know -apple-system-body (it rejects the value).
 * @param {Document} doc
 * @returns {number | null}
 */
export function probeBody(doc) {
  const win = doc.defaultView;
  if (!win || typeof win.getComputedStyle !== 'function') return null;
  const probe = doc.createElement('span');
  probe.style.font = '-apple-system-body';
  if (!probe.style.font) return null;
  probe.setAttribute('aria-hidden', 'true');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  doc.body.appendChild(probe);
  const px = parseFloat(win.getComputedStyle(probe).fontSize);
  doc.body.removeChild(probe);
  return Number.isFinite(px) ? px : null;
}

/** The dev override kept on preview (auto when none). */
export function savedText() {
  const v = load(KEY);
  return TEXT_MODES.includes(v) ? v : 'auto';
}

/**
 * Apply a mode to <html>: data-text and --plain-size.
 * @param {Document} doc
 * @param {{mode: 'pixel' | 'plain', size: number | null}} m
 */
export function applyText(doc, m) {
  const html = doc.documentElement;
  html.setAttribute('data-text', m.mode);
  if (m.size) html.style.setProperty('--plain-size', `${m.size}px`);
  else html.style.removeProperty('--plain-size');
}

/**
 * Read the probe and apply, now and on every return to the foreground, and
 * register the dev control. Returns a function that re-applies (the frame
 * calls it after the control changes).
 * @param {Document} doc
 * @param {{onChange?: () => void}} [o]
 */
export function initTextSize(doc, { onChange } = {}) {
  const apply = () => applyText(doc, textMode(probeBody(doc), savedText()));
  apply();
  doc.addEventListener('visibilitychange', () => {
    if (doc.visibilityState === 'visible') apply();
  });
  registerDevControl({
    id: KEY,
    label: 'dev.text',
    options: [
      { value: 'auto', label: 'dev.text.auto' },
      { value: 'pixel', label: 'dev.text.pixel' },
      { value: 'plain', label: 'dev.text.plain' },
    ],
    get: savedText,
    set: (v) => {
      save(KEY, v);
      apply();
      if (onChange) onChange();
    },
  });
  return apply;
}

/**
 * The Plain size in force on this page (--plain-size, 20 px when unset), or
 * null while the pixel fonts show: the trail's space check and the cabin's
 * and the porch's read it (ui/frame.js, ui/cabin.js, ui/porch.js).
 * @param {Document} doc
 * @param {Window | null} win
 * @returns {number | null}
 */
export function plainSizeOf(doc, win) {
  const html = doc.documentElement;
  if (!html || html.getAttribute('data-text') !== 'plain') return null;
  const raw = (html.style && html.style.getPropertyValue('--plain-size')) || (win && typeof win.getComputedStyle === 'function' ? win.getComputedStyle(html).getPropertyValue('--plain-size') : '');
  const px = parseFloat(raw);
  return Number.isFinite(px) && px > 0 ? px : FORCED_PLAIN_PX;
}
