// The choices (GAME_DESIGN 12.1, 12.2, 8.1, 8.7; BUILD_PLAN 2.5, S5, S6):
// full-width boxes, 52 pt tall, 8 pt apart, in the thumb zone, built by
// S3's renderStop (ui/stop.js). This module adds what the frame needs
// around them:
//
//   The cue: every choice tap plays ui.tick first, inside the click (the
//     sound unlock rule, 2.8); Walk on plays ui.next instead, two dry
//     clicks, until A2's walk-on montage (13.2). The game plays it after its
//     double-tap guard, so a dropped tap is silent.
//   The (i) square: a rolled choice (S6: it carries `why`, its Why sheet's
//     data; the #frame check view's fixture carries `info`) becomes a
//     div.choice-row holding the choice and a button.choice-info, its own
//     44x44-pt square at the right edge, so a slightly-off tap on the odds
//     never commits the choice (separate elements, separate handlers). Its
//     name is trail.choice.why; it shows a pixel i (an SVG, no letter).
//   The tag (S6, 8.1, 11.9): on line 1, right-aligned beside the label
//     when it fits, else on line 2: `sure` in ink; a %'s made it; a
//     diamond's brick pixel diamond (named Critical for VoiceOver) and its
//     made it in ink. A diamond carries line 2, right-aligned in brick: its
//     fail share and fail word, then its fatal share when it can kill. A
//     diamond's button is 64 pt tall (12.1).
//   The confirm (12.1): the first tap on a diamond turns it, in place, into
//     its prompt (This could be fatal., or the label and a question mark)
//     with Yes and Not yet, each at least 44 pt; Not yet, or a tap on
//     another choice, brings the diamond back; Yes takes it. The game's
//     300-ms double-tap guard starts again when it opens (the frame's
//     rearm), so the second tap of a double tap, landing where the diamond
//     was, never takes Yes.
//   The intros (8.7, the spec's lead call 3): the first %, the first
//     diamond, the first fatal share and the first sure each get one dry
//     line before the box the first time they show, one a stop, the most
//     serious unseen first (fatal, diamond, %, sure); with the fatal one,
//     the sure choice is outlined. The phone keeps which it has seen
//     (odds_seen, the player's, not the hiker's: a death keeps it, 9.8).
//     Display only: the engine never reads it.

import { t, tx } from '../text.js';
import { load, save } from '../platform/storage.js';
import { pct, share } from '../fmt.js';
import { choiceLine } from './stop.js';
import { pixelGlyph } from './glyph.js';

// pixelGlyph lives in ui/glyph.js (S7: the cabin's modules draw glyphs too, and never import this one); re-exported here.
export { pixelGlyph };
/** The pixel i on the chrome font's 8x14 grid: [x, y, w, h]. */
const I_RECTS = Object.freeze([
  [2, 2, 2, 2],
  [1, 5, 3, 1],
  [2, 6, 2, 4],
  [1, 10, 4, 1],
]);
/** The pixel diamond on a 7x7 grid (8.1's ♦). */
export const DIAMOND_RECTS = Object.freeze([
  [3, 0, 1, 1],
  [2, 1, 3, 1],
  [1, 2, 5, 1],
  [0, 3, 7, 1],
  [1, 4, 5, 1],
  [2, 5, 3, 1],
  [3, 6, 1, 1],
]);
/** The odds forms an intro can introduce, most serious first (lead call 3). */
export const INTRO_FORMS = Object.freeze(['fatal', 'diamond', 'pct', 'sure']);
/** Each form's intro line (8.7). */
export const INTRO_LINES = Object.freeze({ fatal: 'trail.odds.intro.fatal', diamond: 'trail.odds.intro.diamond', pct: 'trail.odds.intro.pct', sure: 'trail.odds.intro.sure' });
/** The phone's record of the forms introduced (platform/storage.js): the player's, kept across hikers. */
export const SEEN_KEY = 'odds_seen';

/**
 * @typedef {import('./stop.js').Choice & {info?: unknown, why?: any, tag?: string, odds?: {kind: string, made: number, fail: number, fatal: {tenths: number} | {under: true} | null, failWord: import('./stop.js').Ref | null}}} OddsChoice
 */

/**
 * The cue a choice's tap plays (C's ui/sound.js cue ids, BUILD_PLAN S5).
 * @param {Record<string, unknown>} act
 */
export function cueFor(act) {
  return act && act.t === 'next' ? 'ui.next' : 'ui.tick';
}

/**
 * The choices renderStop drew, in its order (a choice it has no word for
 * isn't drawn).
 * @param {{choices: OddsChoice[], outcome?: string}} screen
 * @returns {OddsChoice[]}
 */
export const drawnChoices = (screen) => screen.choices.filter((c) => choiceLine(c, screen));

/**
 * After renderStop: give each drawn choice that carries `why` (or `info`)
 * its (i) square. The list keeps its order; such a choice moves into a
 * div.choice-row with its square. Returns the squares.
 * @param {HTMLElement} list div.game-choices
 * @param {{choices: OddsChoice[], outcome?: string}} screen
 * @param {HTMLButtonElement[]} buttons renderStop's, one per drawn choice
 * @param {(choice: OddsChoice, square: HTMLButtonElement) => void} onInfo the square's tap (never the choice's)
 * @returns {HTMLButtonElement[]}
 */
export function addInfo(list, screen, buttons, onInfo) {
  const doc = list.ownerDocument;
  const drawn = drawnChoices(screen);
  if (!drawn.some((c) => c.why || c.info)) return [];
  /** @type {HTMLButtonElement[]} */
  const squares = [];
  const kids = Array.from(list.children);
  while (list.firstChild) list.removeChild(list.firstChild);
  kids.forEach((kid) => {
    const i = buttons.indexOf(/** @type {HTMLButtonElement} */ (kid));
    const c = i >= 0 ? drawn[i] : null;
    if (!c || !(c.why || c.info)) {
      list.appendChild(kid);
      return;
    }
    const row = doc.createElement('div');
    row.className = 'choice-row';
    const sq = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
    sq.classList.add('box', 'choice-info');
    sq.setAttribute('type', 'button');
    sq.setAttribute('aria-label', t('trail.choice.why'));
    sq.setAttribute('data-t-aria', 'trail.choice.why'); // the line inspector finds a spoken name by it
    sq.appendChild(pixelGlyph(doc, 8, 14, I_RECTS, 'info-glyph'));
    sq.addEventListener('click', (event) => {
      if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
      onInfo(c, sq);
    });
    row.appendChild(kid);
    row.appendChild(sq);
    list.appendChild(row);
    squares.push(sq);
  });
  return squares;
}

/**
 * The tags and a diamond's second line (8.1, 11.9): line 1 is the label
 * and, right-aligned, its tag; line 2 a diamond's fail share and fatal
 * share, in brick. Marks each rolled choice's button with data-odds (pct
 * or diamond) and its index among the drawn choices (data-choice).
 * @param {{choices: OddsChoice[], outcome?: string}} screen
 * @param {HTMLButtonElement[]} buttons
 */
export function addTags(screen, buttons) {
  drawnChoices(screen).forEach((c, i) => {
    const b = buttons[i];
    if (!b) return;
    b.setAttribute('data-choice', String(i));
    if (!c.odds && c.tag !== 'sure') return;
    const doc = b.ownerDocument;
    const label = b.querySelector('.choice-label');
    const head = doc.createElement('span');
    head.className = 'choice-head';
    if (label) head.appendChild(label);
    const tag = doc.createElement('span');
    tag.className = 'choice-tag';
    head.appendChild(tag);
    b.insertBefore(head, b.firstChild);
    // A rolled choice always shows its odds, whatever else it carries (the content checks refuse a sure one that rolls).
    if (c.tag === 'sure' && !c.odds) {
      b.setAttribute('data-sure', '');
      tx(tag, 'trail.odds.sure');
      return;
    }
    const odds = /** @type {NonNullable<OddsChoice['odds']>} */ (c.odds);
    b.setAttribute('data-odds', odds.kind);
    const made = doc.createElement('span');
    made.className = 'choice-made';
    const m = pct(odds.made);
    tx(made, m.id, m.vars); // t-ids: fmt.pct
    if (odds.kind !== 'diamond') {
      tag.appendChild(made);
      return;
    }
    // The diamond: a brick pixel glyph, named for VoiceOver, then the made it in ink.
    tag.appendChild(pixelGlyph(doc, 7, 7, DIAMOND_RECTS, 'diamond-glyph'));
    const name = doc.createElement('span');
    name.className = 'vh';
    tx(name, 'trail.odds.diamond');
    tag.appendChild(name);
    tag.appendChild(made);
    const second = doc.createElement('span');
    second.className = 'choice-odds2';
    const fail = doc.createElement('span');
    fail.className = 'choice-fail';
    tx(fail, 'trail.odds.fail', { share: pct(odds.fail), what: odds.failWord || '' });
    second.appendChild(fail);
    if (odds.fatal) {
      // The dot is a separator glyph, no word, hidden from VoiceOver; the
      // spaces about it are not, so the two shares stay two in the
      // button's name ("35% hit 0.7% fatal", never "hit0.7%").
      const sep = doc.createElement('span');
      sep.className = 'choice-sep';
      const dot = doc.createElement('span');
      dot.setAttribute('aria-hidden', 'true');
      dot.textContent = '·';
      sep.appendChild(doc.createTextNode(' '));
      sep.appendChild(dot);
      sep.appendChild(doc.createTextNode(' '));
      second.appendChild(sep);
      const fatal = doc.createElement('span');
      fatal.className = 'choice-fatal';
      tx(fatal, 'trail.odds.fatal', { share: share(odds.fatal) });
      second.appendChild(fatal);
    }
    b.appendChild(second);
  });
}

/**
 * The odds forms a screen shows (8.7): fatal (a fatal share), diamond, pct
 * (any rolled choice's %), sure.
 * @param {{choices: OddsChoice[]}} screen
 * @returns {string[]} in INTRO_FORMS' order
 */
export function formsOn(screen) {
  const has = new Set();
  for (const c of screen.choices || []) {
    if (!c.odds) {
      if (c.tag === 'sure') has.add('sure');
      continue;
    }
    has.add('pct');
    if (c.odds.kind === 'diamond') has.add('diamond');
    if (c.odds.fatal) has.add('fatal');
  }
  return INTRO_FORMS.filter((f) => has.has(f));
}

/**
 * The one intro a stop shows (lead call 3): the most serious form on it
 * not yet seen, or null.
 * @param {{choices: OddsChoice[]}} screen
 * @param {readonly string[]} seen
 * @returns {string | null}
 */
export function introFor(screen, seen) {
  return formsOn(screen).find((f) => !seen.includes(f)) || null;
}

/** The forms this phone has been introduced to (odds_seen). */
export function seenForms() {
  const v = load(SEEN_KEY);
  return Array.isArray(v) ? v.filter((f) => INTRO_FORMS.includes(f)) : [];
}

/**
 * The screen with its intro, if it has one: the intro's line before the
 * box, the form marked seen on the phone. Returns {screen, intro}.
 * @template {{box: import('./stop.js').Ref[], choices: OddsChoice[]}} S
 * @param {S} screen
 * @returns {{screen: S, intro: string | null}}
 */
export function withIntro(screen) {
  const seen = seenForms();
  const intro = introFor(screen, seen);
  if (!intro) return { screen, intro: null };
  save(SEEN_KEY, [...seen, intro]);
  return { screen: { ...screen, box: [{ id: /** @type {Record<string, string>} */ (INTRO_LINES)[intro] }, ...screen.box] }, intro };
}

/**
 * The confirm (12.1): a diamond's button turned, in place, into its prompt
 * with Yes and Not yet. Returns {el, yes, no, close}: close() brings the
 * button back. The prompt also goes to the frame's polite live region, and
 * focus to Yes.
 * @param {HTMLButtonElement} button the diamond
 * @param {OddsChoice} c
 * @param {{onYes: () => void, onClose?: () => void, live?: HTMLElement | null}} o
 */
export function openConfirm(button, c, { onYes, onClose, live = null }) {
  const doc = button.ownerDocument;
  const box = doc.createElement('div');
  box.classList.add('box', 'choice-confirm');
  box.setAttribute('role', 'group');
  const prompt = doc.createElement('p');
  prompt.className = 'confirm-prompt';
  const fatal = Boolean(c.odds && c.odds.fatal);
  const say = (/** @type {HTMLElement} */ el) => {
    if (fatal) tx(el, 'trail.confirm.fatal');
    else tx(el, 'trail.confirm.ask', { choice: c.label || { id: 'trail.walk_on' } });
  };
  say(prompt);
  const buttons = doc.createElement('div');
  buttons.className = 'confirm-buttons';
  const yes = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
  yes.classList.add('box', 'confirm-yes');
  yes.setAttribute('type', 'button');
  tx(yes, 'trail.confirm.yes');
  const no = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
  no.classList.add('box', 'confirm-no');
  no.setAttribute('type', 'button');
  tx(no, 'trail.confirm.no');
  buttons.appendChild(yes);
  buttons.appendChild(no);
  box.appendChild(prompt);
  box.appendChild(buttons);
  /** @type {HTMLElement} */ (button.parentNode).insertBefore(box, button);
  button.hidden = true;
  let open = true;
  const close = () => {
    if (!open) return;
    open = false;
    if (box.parentNode) box.parentNode.removeChild(box);
    button.hidden = false;
    if (onClose) onClose();
  };
  yes.addEventListener('click', () => {
    if (!open) return;
    onYes();
  });
  no.addEventListener('click', () => {
    close();
    if (typeof button.focus === 'function') button.focus();
  });
  if (live) say(live);
  if (typeof yes.focus === 'function') yes.focus();
  return { el: box, yes, no, close };
}
