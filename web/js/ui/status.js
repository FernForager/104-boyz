// The status line (GAME_DESIGN 12.1, 12.2, 2.2; BUILD_PLAN S5, S7): a
// 22-pt snow bar in the chrome font, King's Quest's own, shared by the trail
// frame (ui/frame.js), the cabin (ui/cabin.js) and the porch (ui/porch.js):
//
//   the left slot  the trail's score (empty until S9), the cabin's Pacific
//                  time (fmt.clock_*), set by its caller
//   ≡              opens the ≡ sheet (ui/menu.js: the mailbox at the cabin),
//                  named by its caller's line, with a brick flag while an
//                  update waits (E.7)
//   Sound:on       the Sound toggle (the `sound` key, through the audio
//                  facade: turning it on inside the tap unlocks the sound)
//
// The words are its caller's ids (lines), so this module reaches no line of
// its own (BUILD_PLAN S7 4.11): the cabin's modules never import the
// trail's. Every Sound toggle on the page (this bar's and the mailbox's)
// shows the same state: a change redraws them all (soundChanged).

import { t, tx } from '../text.js';
import { pixelGlyph } from './glyph.js';

/** The bar's height (12.1). */
export const STATUS_PT = 22;
/** ≡: three bars on an 8 x 8 grid of font pixels. */
export const MENU_RECTS = Object.freeze([
  [0, 1, 7, 1],
  [0, 4, 7, 1],
  [0, 7, 7, 1],
]);

/**
 * @typedef {{play: (cue: string) => void, isOn: () => boolean, setOn: (on: boolean) => void}} Sound
 * @typedef {{menu: string, soundOn: string, soundOff: string}} StatusLines the ids its controls are named and worded by
 */

/** Every Sound toggle shown, by its redraw. */
const soundViews = new Set();

/**
 * Redraw every Sound toggle on the page (after any of them changes it).
 */
export function soundChanged() {
  for (const show of soundViews) show();
}

/**
 * Keep a Sound toggle in step with the others; returns the function that stops.
 * @param {() => void} show its redraw
 */
export function watchSound(show) {
  soundViews.add(show);
  return () => {
    soundViews.delete(show);
  };
}

/**
 * Give an element a whole number of CSS pixels of width (its text's width
 * is a whole number of font pixels, which layout rounds to 1/64 px): so
 * what is right-aligned after it, like Sound:on, starts its glyphs on a
 * whole device pixel and stays crisp.
 * @param {HTMLElement} el
 */
export function snapWidth(el) {
  if (typeof el.getBoundingClientRect !== 'function') return;
  el.style.width = '';
  const w = el.getBoundingClientRect().width;
  if (w > 0) el.style.width = `${Math.ceil(w - 0.01)}px`;
}

/**
 * The status line: header.status-line > span.status-score +
 * button.status-menu + button.status-sound. onMenu runs on ≡'s tap. Returns
 * the parts and release(), which stops its Sound toggle following the others.
 * @param {Document} doc
 * @param {{sound: Sound, onMenu: () => void, lines: StatusLines}} o
 */
export function statusLine(doc, { sound, onMenu, lines }) {
  const header = doc.createElement('header');
  header.className = 'status-line';
  const left = doc.createElement('span');
  left.className = 'status-score';
  const menu = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
  menu.className = 'status-menu';
  menu.setAttribute('type', 'button');
  menu.setAttribute('aria-label', t(lines.menu)); // t-ids: trail.status.menu, home.place.mailbox
  menu.setAttribute('data-t-aria', lines.menu); // the line inspector finds a spoken name by it
  menu.setAttribute('aria-haspopup', 'dialog');
  menu.appendChild(pixelGlyph(doc, 8, 8, MENU_RECTS, 'menu-glyph'));
  menu.addEventListener('click', () => onMenu());
  const toggle = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
  toggle.className = 'status-sound';
  toggle.setAttribute('type', 'button');
  const show = () => {
    const on = sound.isOn();
    toggle.setAttribute('aria-pressed', String(on));
    tx(toggle, on ? lines.soundOn : lines.soundOff); // t-ids: trail.status.sound_on, trail.status.sound_off
  };
  show();
  const unwatch = watchSound(() => {
    show();
    snapWidth(toggle);
  });
  // Inside the tap: turning it on unlocks the sound (BUILD_PLAN 2.8).
  toggle.addEventListener('click', () => {
    sound.setOn(!sound.isOn());
    soundChanged();
  });
  header.appendChild(left);
  header.appendChild(menu);
  header.appendChild(toggle);
  return { header, left, menu, sound: toggle, release: unwatch };
}

/**
 * ≡'s flag while the update note waits (E.7): data-flag on each button,
 * following #update[hidden] wherever the note now lives. Returns a function
 * that stops watching.
 * @param {Document} doc
 * @param {readonly HTMLElement[]} buttons
 */
export function watchUpdate(doc, buttons) {
  const update = doc.getElementById('update');
  const flag = () => {
    for (const b of buttons) {
      if (update && !update.hidden) b.setAttribute('data-flag', '');
      else b.removeAttribute('data-flag');
    }
  };
  flag();
  if (!update || typeof MutationObserver !== 'function') return () => {};
  const obs = new MutationObserver(flag);
  obs.observe(update, { attributes: true, attributeFilter: ['hidden'] });
  return () => obs.disconnect();
}

/**
 * Does an update wait (the note is showing)?
 * @param {Document} doc
 */
export function updateWaits(doc) {
  const update = doc.getElementById('update');
  return Boolean(update && !update.hidden);
}
