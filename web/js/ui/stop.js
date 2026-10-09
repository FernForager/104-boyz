// A trail stop, plain (BUILD_PLAN S3; GAME_DESIGN 12.1, 12.2): the Sierra
// box, line by line, then one button per choice. From S5 the frame
// (ui/frame.js) draws it inside the trail stop, with the picture above; a
// quiet stop (no lines, decision 32) has no box at all.
//
// The engine gives lines as refs by id ({id, vars}), never words; tx() turns
// them into words. A Walk on choice (`next`) carries no label of its own:
// the UI's word is trail.walk_on. The box takes focus on every new stop, so
// VoiceOver reads it.

import { tx } from '../text.js';

/** The UI's own word for a choice whose label is null, by action. */
const UI_LABELS = Object.freeze({ next: 'trail.walk_on' });

/**
 * @typedef {{id: string, vars?: Record<string, unknown>}} Ref
 * @typedef {{act: Record<string, unknown>, label: Ref | null, enabled: boolean}} Choice
 * @typedef {{phase: string, stop?: {set: string, id: string, n: number}, box: Ref[], choices: Choice[]}} StopScreen
 */

/**
 * The line a choice's button shows: its own ref, or the UI's word.
 * @param {Choice} c
 * @returns {Ref | null}
 */
export function choiceLine(c) {
  if (c.label) return c.label;
  const t = /** @type {string} */ (c.act.t);
  return Object.prototype.hasOwnProperty.call(UI_LABELS, t) ? { id: /** @type {Record<string, string>} */ (UI_LABELS)[t] } : null;
}

/**
 * Draw a stop into host. Calls onAct(action) with the choice's action when
 * one is tapped.
 * @param {HTMLElement} host the game screen's area
 * @param {StopScreen} screen
 * @param {(act: Record<string, unknown>) => void} onAct
 * @returns {{box: HTMLElement | null, buttons: HTMLButtonElement[]}} box: null on a quiet stop
 */
export function renderStop(host, screen, onAct) {
  const doc = host.ownerDocument;
  /** @type {HTMLElement | null} */
  let box = null;
  if (screen.box.length) {
    box = doc.createElement('div');
    box.classList.add('box', 'game-box');
    box.setAttribute('tabindex', '-1');
    for (const ref of screen.box) {
      const p = doc.createElement('p');
      tx(p, ref.id, ref.vars); // t-ids: @content
      box.appendChild(p);
    }
    host.appendChild(box);
  }
  const list = doc.createElement('div');
  list.className = 'game-choices';
  /** @type {HTMLButtonElement[]} */
  const buttons = [];
  for (const c of screen.choices) {
    const line = choiceLine(c);
    if (!line) continue; // a choice the UI has no word for is not drawn
    const b = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
    b.classList.add('box', 'choice');
    b.setAttribute('type', 'button');
    b.disabled = !c.enabled;
    const label = doc.createElement('span');
    label.className = 'choice-label';
    tx(label, line.id, line.vars); // t-ids: @content
    b.appendChild(label);
    b.addEventListener('click', () => onAct({ ...c.act }));
    list.appendChild(b);
    buttons.push(b);
  }
  host.appendChild(list);
  return { box, buttons };
}
