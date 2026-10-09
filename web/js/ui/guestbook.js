// The guest book, plain (BUILD_PLAN S3; GAME_DESIGN 12.4, 3.6): a name,
// one plain line, and Sign. S7 puts it on the cabin's porch table, after
// the lockbox, with Suggest and the field's label.
//
// The field takes any name; what is signed is the name normalized here, as
// the engine wants it (NFC, whitespace collapsed, controls and lone
// surrogates dropped, trimmed, cut at the limit in code points). The engine
// only checks it, with no Unicode tables (E.12 #8). Sign is enabled while 1
// to 12 code points remain; Enter signs too. The name lives in the hiker
// record only, never in a trip, a log or a bug report.
//
// While the field has focus, the game view is lifted above the keyboard
// with visualViewport (BUILD_PLAN 2.8): iOS shrinks the visual viewport and
// leaves the fixed layout under the keyboard, so the field, the line under
// it and Sign would sit behind it. No RegExp lookbehind here: Safari reads
// one only from 16.4, and the page runs from iOS 15.4.

import { tx } from '../text.js';

/** C0 and C1 controls (whitespace among them is collapsed first). */
const CONTROLS = /[\u0000-\u001f\u007f-\u009f]/g;
const FIELD_ID = 'gb-name';
const PROMPT_ID = 'gb-prompt';
const SIGN_ID = 'gb-sign';

/**
 * A string's length in code points.
 * @param {string} s
 */
export const codePoints = (s) => Array.from(s).length;

/** The CSS custom property on <html> that lifts the game view above the keyboard (game.css). */
export const KEYBOARD_VAR = '--keyboard';

/**
 * Pure: s with every surrogate that has no partner dropped. Array.from
 * splits by code points, so a lone surrogate comes out as one UTF-16 unit
 * in the surrogate range (no lookbehind: see above).
 * @param {string} s
 */
export const dropLone = (s) =>
  Array.from(s)
    .filter((ch) => !(ch.length === 1 && ch >= '\uD800' && ch <= '\uDFFF'))
    .join('');

/**
 * Pure: the name as it is signed: NFC, every run of whitespace one space,
 * no controls or lone surrogates, trimmed, cut at max code points (and
 * trimmed again, so a cut never leaves a space at the end).
 * @param {string} raw
 * @param {number} max
 */
export function signName(raw, max) {
  const s = String(raw).normalize('NFC').replace(/\s+/g, ' ').replace(CONTROLS, '');
  return Array.from(dropLone(s).trim()).slice(0, max).join('').trim();
}

/**
 * Pure: may this name be signed? 1 to max code points.
 * @param {string} name
 * @param {number} max
 */
export function canSign(name, max) {
  const n = codePoints(name);
  return n >= 1 && n <= max;
}

/**
 * An element with its classes and attributes.
 * @param {Document} doc
 * @param {string} tag
 * @param {string[]} classes
 * @param {Record<string, string>} [attrs]
 * @returns {HTMLElement}
 */
function el(doc, tag, classes, attrs = {}) {
  const e = doc.createElement(tag);
  if (classes.length) e.className = classes.join(' ');
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

/**
 * While field has focus, keep it, the line under it and Sign above the
 * keyboard: the part of the layout the visual viewport no longer reaches at
 * the bottom becomes --keyboard on <html>, which game.css puts under the
 * game page. It goes on blur, or once the field has left the page.
 * @param {HTMLInputElement} field
 * @param {any} view the window (tests pass their own)
 */
export function keepAboveKeyboard(field, view) {
  const vv = view && view.visualViewport;
  const root = field.ownerDocument.documentElement;
  if (!vv || !root || !root.style) return;
  const drop = () => {
    vv.removeEventListener('resize', lift);
    vv.removeEventListener('scroll', lift);
    root.style.removeProperty(KEYBOARD_VAR);
  };
  function lift() {
    if (field.isConnected === false) return drop();
    const covered = Math.max(0, Math.round(view.innerHeight - vv.height - vv.offsetTop));
    root.style.setProperty(KEYBOARD_VAR, `${covered}px`);
  }
  field.addEventListener('focus', () => {
    vv.addEventListener('resize', lift);
    vv.addEventListener('scroll', lift);
    lift();
  });
  field.addEventListener('blur', drop);
}

/**
 * Draw the guest book into host. Calls onSign(name) with the signed name
 * when Sign is tapped (or Enter pressed) with 1 to max code points.
 * @param {HTMLElement} host the game screen's area
 * @param {{input?: {max: number}}} screen the engine's guest book screen
 * @param {(name: string) => void} onSign
 * @param {any} [view] the window, for visualViewport (tests pass their own)
 * @returns {{box: HTMLElement, field: HTMLInputElement, sign: HTMLButtonElement}}
 */
export function renderGuestbook(host, screen, onSign, view = host.ownerDocument.defaultView) {
  const doc = host.ownerDocument;
  const max = (screen.input && screen.input.max) || 12;
  const box = el(doc, 'div', ['box', 'game-box'], { tabindex: '-1' });
  const prompt = el(doc, 'p', [], { id: PROMPT_ID });
  tx(prompt, 'first.guestbook.prompt');
  box.appendChild(prompt);
  const field = /** @type {HTMLInputElement} */ (
    el(doc, 'input', ['name-field'], {
      id: FIELD_ID,
      type: 'text',
      'aria-labelledby': PROMPT_ID,
      autocomplete: 'off',
      autocapitalize: 'words',
      autocorrect: 'off',
      spellcheck: 'false',
      enterkeyhint: 'done',
    })
  );
  const note = el(doc, 'p', ['game-note']);
  tx(note, 'first.guestbook.one_life');
  const sign = /** @type {HTMLButtonElement} */ (el(doc, 'button', ['box', 'choice'], { type: 'button', id: SIGN_ID }));
  sign.disabled = true;
  const label = el(doc, 'span', ['choice-label']);
  tx(label, 'first.guestbook.sign');
  sign.appendChild(label);

  const update = (/** @type {boolean} */ cut) => {
    const name = signName(field.value, max);
    // Past the limit, the field stops at it; under it, typing is left alone
    // (a space before the next word stays until Sign).
    if (cut && codePoints(signName(field.value, Infinity)) > max) field.value = name;
    sign.disabled = !canSign(name, max);
    return name;
  };
  const go = () => {
    const name = update(false);
    if (!canSign(name, max)) return;
    field.blur();
    onSign(name);
  };
  field.addEventListener('input', (event) => update(!(/** @type {InputEvent} */ (event).isComposing)));
  field.addEventListener('compositionend', () => update(true));
  field.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.isComposing) { // t-ok: a key's name, never shown
      event.preventDefault();
      go();
    }
  });
  keepAboveKeyboard(field, view);
  field.addEventListener('focus', () => {
    // Once the keyboard is up and the view lifted, bring the field into view
    // if the lifted screen is too short to show it all.
    setTimeout(() => field.scrollIntoView({ block: 'nearest' }), 300);
  });
  sign.addEventListener('click', go);

  for (const n of [box, field, note, sign]) host.appendChild(n);
  return { box, field, sign };
}
