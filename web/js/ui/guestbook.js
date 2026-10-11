// The guest book (BUILD_PLAN S3, S7; GAME_DESIGN 12.4, 3.6): a name, one
// plain line, and Sign. S7 puts it on the cabin's porch table, after the
// lockbox (ui/porch.js: the window on the porch, the guest book open on the
// table), with the field's visible label (*Your hiker's name*, which names
// the field for VoiceOver too) and *Suggest*, a 44-pt button beside the
// field that fills in a real given name (lead call 64: the build's
// term.given_* names, from the SSA's baby-name data; never ours), drawn
// with crypto.getRandomValues, never the one already in the field.
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

import { t, tx } from '../text.js';
import { renderPorch, porchBox, porchChoice, GUESTBOOK_BELOW_PT } from './porch.js';

/** C0 and C1 controls (whitespace among them is collapsed first). */
const CONTROLS = /[\u0000-\u001f\u007f-\u009f]/g;
const FIELD_ID = 'gb-name';
const PROMPT_ID = 'gb-prompt';
const LABEL_ID = 'gb-label';
const SIGN_ID = 'gb-sign';
const SUGGEST_ID = 'gb-suggest';

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

/** @typedef {{getRandomValues: (a: Uint32Array<ArrayBuffer>) => Uint32Array}} RandomSource the platform's generator, or a test's */

/**
 * Pure (given its draw): Suggest's name, a term id from the pool whose
 * words aren't the name already in the field, or null when there is none.
 * draw(n) is an integer in [0, n).
 * @param {readonly string[]} pool term ids (term.given_*)
 * @param {string} current the field's name, as it would be signed
 * @param {(n: number) => number} draw
 * @param {(id: string) => string} [words] a term's words
 * @returns {string | null}
 */
export function pickGiven(pool, current, draw, words = (id) => t(id)) { // t-ids: @terms
  const left = pool.filter((id) => words(id) !== current);
  return left.length ? left[draw(left.length)] : null;
}

/**
 * An unbiased integer in [0, n) from the platform's generator (rejection
 * sampling over 32 bits). The game's one other draw outside the engine
 * (platform/rand.js has the seeds); Suggest never touches an outcome.
 * @param {number} n
 * @param {RandomSource} [c]
 */
export function randomBelow(n, c = globalThis.crypto) {
  const limit = 4294967296 - (4294967296 % n);
  const a = new Uint32Array(1);
  for (;;) {
    c.getRandomValues(a);
    if (a[0] < limit) return a[0] % n;
  }
}

/**
 * @typedef {object} GuestbookPorch the porch the guest book lies on (S7)
 * @property {import('./porch.js').PorchCtx} ctx
 * @property {readonly string[]} [names] Suggest's pool: the build's given names (term.given_*)
 * @property {RandomSource} [random] the generator Suggest draws with (tests pass their own)
 * @property {boolean} [first] first launch's guest book, right after the lockbox (its overlay: the lit
 *   lockbox beside the open book); false after a death, the guest book alone (decision 45: the lockbox
 *   never comes back once opened)
 * @property {string} [value] the name already typed, kept across a redraw (the mailbox's Text toggle)
 */

/**
 * Draw the guest book into host: on the porch (S7) when porch is given,
 * plain otherwise. Calls onSign(name) with the signed name when Sign is
 * tapped (or Enter pressed) with 1 to max code points.
 * @param {HTMLElement} host the game screen's area
 * @param {{input?: {max: number}}} screen the engine's guest book screen
 * @param {(name: string) => void} onSign
 * @param {any} [view] the window, for visualViewport (tests pass their own)
 * @param {GuestbookPorch | null} [porch]
 * @returns {{box: HTMLElement, field: HTMLInputElement, sign: HTMLButtonElement, suggest: HTMLButtonElement | null, label: HTMLElement, buttons: HTMLButtonElement[], release: () => void}}
 */
export function renderGuestbook(host, screen, onSign, view = host.ownerDocument.defaultView, porch = null) {
  const doc = host.ownerDocument;
  const max = (screen.input && screen.input.max) || 12;
  const frame = porch ? renderPorch(host, porch.ctx, { below: GUESTBOOK_BELOW_PT, plainRows: 1, state: porch.first === false ? 'guestbook' : 'first' }) : null;
  if (frame) host.classList.add('guestbook');
  // The box: Sign the guest book. (the ▾ continuation on the porch, as any box there).
  const made = porchBox(doc, [{ id: 'first.guestbook.prompt' }]);
  const box = made.box;
  const prompt = /** @type {HTMLElement} */ (box.querySelector('p'));
  prompt.setAttribute('id', PROMPT_ID);
  // The field's visible label, which names it for VoiceOver too (12.4).
  const label = el(doc, 'label', ['gb-label'], { id: LABEL_ID, for: FIELD_ID });
  tx(label, 'first.guestbook.label');
  const field = /** @type {HTMLInputElement} */ (
    el(doc, 'input', ['name-field'], {
      id: FIELD_ID,
      type: 'text',
      'aria-labelledby': LABEL_ID,
      autocomplete: 'off',
      autocapitalize: 'words',
      autocorrect: 'off',
      spellcheck: 'false',
      enterkeyhint: 'done',
    })
  );
  const row = el(doc, 'div', ['gb-row']);
  row.appendChild(field);
  const names = porch && porch.names ? porch.names : [];
  /** @type {HTMLButtonElement | null} */
  let suggest = null;
  if (names.length) {
    suggest = /** @type {HTMLButtonElement} */ (el(doc, 'button', ['gb-suggest'], { type: 'button', id: SUGGEST_ID, 'aria-controls': FIELD_ID }));
    tx(suggest, 'first.guestbook.suggest');
    row.appendChild(suggest);
  }
  const note = el(doc, 'p', ['game-note']);
  tx(note, 'first.guestbook.one_life');
  const sign = porchChoice(doc, { id: 'first.guestbook.sign' }, () => go());
  sign.setAttribute('id', SIGN_ID);
  sign.disabled = true;

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
  const below = el(doc, 'div', ['gb-below']);
  field.addEventListener('focus', () => {
    // Once the keyboard is up and the view lifted, bring the field into view
    // if the lifted screen is too short to show it all; on the porch, the
    // label, the field, the one-life line and Sign together (the porch
    // scrolls, the picture going up under the status line: home.css).
    const target = frame ? below : field;
    setTimeout(() => target.scrollIntoView({ block: 'nearest' }), 300);
  });
  if (suggest) {
    const random = porch && porch.random ? porch.random : globalThis.crypto;
    suggest.addEventListener('click', () => {
      const id = pickGiven(names, signName(field.value, max), (n) => randomBelow(n, random));
      if (!id) return;
      field.value = t(id); // t-ids: @terms
      update(true);
    });
  }

  // A name typed before a redraw (the mailbox's Text toggle) stays, and Sign with it.
  if (porch && porch.value) {
    field.value = porch.value;
    update(true);
  }
  for (const n of [label, row, note, sign]) below.appendChild(n);
  host.appendChild(box);
  host.appendChild(below);
  if (frame) {
    frame.onRelayout(() => made.pager.relayout());
    frame.layout();
  }
  /** @type {HTMLButtonElement[]} */
  const buttons = suggest ? [suggest, sign] : [sign];
  return { box, field, sign, suggest, label, buttons, release: () => (frame ? frame.release() : undefined) };
}
