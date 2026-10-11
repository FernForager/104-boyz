// The mailbox: settings (GAME_DESIGN 12.18; BUILD_PLAN S7, lead call 63).
// The ≡ sheet (ui/menu.js) is the mailbox; this module gives it its
// settings rows and its foot. S7 builds the scope's subset (the settings
// switch lists the rest, for S13 and S28): two King's Quest toggles in the
// chrome font,
//
//   Sound:on / Sound:off    the status line's toggle (the same `sound` key
//                           and unlock, through the audio facade), kept in
//                           step with it (ui/status.js soundChanged)
//   Text:pixel / Text:plain the box text's font (the same `text` key as
//                           preview's dev control): it shows the mode in
//                           force (textMode: Larger Text may have chosen
//                           Plain), and a tap writes the other, pixel or
//                           plain, and applies it at once (applyText)
//
// and its foot: the update note and its Restart, Works offline and the
// build stamp, moved in once when the game takes the page (adoptFoot: the
// same nodes, so five quick taps on the build code still open the debug
// menu, and Restart still saves and reloads).

import { tx } from '../text.js';
import { load, save } from '../platform/storage.js';
import { textMode, probeBody, applyText, TEXT_MODES } from './textsize.js';
import { watchSound, soundChanged } from './status.js';

/** The Text toggle's words, by the mode in force. */
export const TEXT_LINES = Object.freeze({ pixel: 'home.mail.text_pixel', plain: 'home.mail.text_plain' });
/** The Sound toggle's words (the status line's). */
export const SOUND_LINES = Object.freeze({ on: 'trail.status.sound_on', off: 'trail.status.sound_off' });
/** The `text` key (ui/textsize.js). */
const TEXT_KEY = 'text';

/**
 * The text setting kept on the phone (auto when none).
 */
export function keptText() {
  const v = load(TEXT_KEY);
  return TEXT_MODES.includes(v) ? v : 'auto';
}

/**
 * Pure: the mode a tap on the Text toggle writes: the other one.
 * @param {'pixel' | 'plain'} shown the mode in force
 * @returns {'pixel' | 'plain'}
 */
export function nextText(shown) {
  return shown === 'plain' ? 'pixel' : 'plain';
}

/**
 * The settings rows: Sound and Text, as buttons in the chrome font.
 * refresh() redraws both from what is in force (the sheet runs it on every
 * open); release() stops the Sound row following the others.
 * @param {Document} doc
 * @param {{sound: import('./status.js').Sound, onText?: () => void}} o onText: after the Text toggle applies (the game redraws)
 */
export function mailboxRows(doc, { sound, onText }) {
  const soundRow = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
  soundRow.classList.add('box', 'choice', 'menu-item', 'mail-toggle', 'mail-sound');
  soundRow.setAttribute('type', 'button');
  const textRow = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
  textRow.classList.add('box', 'choice', 'menu-item', 'mail-toggle', 'mail-text');
  textRow.setAttribute('type', 'button');
  const shownText = () => textMode(probeBody(doc), keptText()).mode;
  const showSound = () => {
    const on = sound.isOn();
    soundRow.setAttribute('aria-pressed', String(on));
    tx(soundRow, on ? SOUND_LINES.on : SOUND_LINES.off); // t-ids: trail.status.sound_on, trail.status.sound_off
  };
  const showText = () => {
    const mode = shownText();
    textRow.setAttribute('data-mode', mode);
    tx(textRow, TEXT_LINES[mode]); // t-ids: home.mail.text_pixel, home.mail.text_plain
  };
  const refresh = () => {
    showSound();
    showText();
  };
  refresh();
  const release = watchSound(showSound);
  // Inside the tap: turning it on unlocks the sound (BUILD_PLAN 2.8).
  soundRow.addEventListener('click', () => {
    sound.setOn(!sound.isOn());
    soundChanged();
  });
  textRow.addEventListener('click', () => {
    const want = nextText(shownText());
    save(TEXT_KEY, want);
    applyText(doc, textMode(probeBody(doc), want));
    showText();
    if (onText) onText();
  });
  return { nodes: [soundRow, textRow], sound: soundRow, text: textRow, refresh, release };
}

/**
 * The update note and the stamps into the sheet's foot: the same nodes,
 * moved once (a second call moves nothing).
 * @param {Document} doc
 * @param {{mount: () => {foot: HTMLElement}}} menu
 */
export function adoptFoot(doc, menu) {
  const { foot } = menu.mount();
  const update = doc.getElementById('update');
  const stamp = doc.getElementById('build-stamp');
  const stamps = stamp ? /** @type {HTMLElement | null} */ (stamp.parentNode) : null;
  for (const n of [update, stamps]) if (n && n.parentNode !== foot) foot.appendChild(n);
  return foot;
}

/**
 * Give the sheet its settings rows and its foot.
 * @param {Document} doc
 * @param {ReturnType<typeof import('./menu.js').createMenu>} menu
 * @param {{sound: import('./status.js').Sound, onText?: () => void}} o
 */
export function installMailbox(doc, menu, o) {
  const rows = mailboxRows(doc, o);
  menu.setSettings(rows.nodes, rows.refresh);
  adoptFoot(doc, menu);
  return rows;
}
