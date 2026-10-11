// The lockbox's questions and its key (BUILD_PLAN S7 D6; GAME_DESIGN 2.6,
// 12.3; decision 45), on the porch (ui/porch.js): the window on the porch
// with the lockbox lit by its lantern, the Sierra box (the intro and
// Question 1 of 3., then the reply to the last answer, then the question),
// and the three answers as box choices in their authored order; after the
// third, the closing and one choice, *Take the key*. The shut box is the
// cabin's (ui/cabin.js draws it, with *Open the lockbox*).
//
// Each answer plays ui.tick, Take the key ui.next (13.2), after the game's
// double-tap guard. While the box's ▾ pages remain, the choices show but
// are inert (aria-disabled), as on the trail: a tap turns the page.

import { renderPorch, porchBox, porchChoice, choicesPt, LAYOUT_CHOICES } from './porch.js';

/** The cue each tap plays (13.2): an answer's tick, the key's Next. */
export const LOCKBOX_CUES = Object.freeze({ answer: 'ui.tick', open: 'ui.next' });

/**
 * Draw the lockbox's ask or open screen into host. onAct(action, cue) runs
 * a choice's tap (the game guards it, plays the cue and dispatches).
 * @param {HTMLElement} host div.game-screen
 * @param {{phase: string, step?: string, box: {id: string, vars?: Record<string, unknown>}[], choices: {act: Record<string, unknown>, label: {id: string} | null, enabled: boolean}[]}} screen
 * @param {(act: Record<string, unknown>, cue: string) => void} onAct
 * @param {import('./porch.js').PorchCtx} ctx
 */
export function renderLockbox(host, screen, onAct, ctx) {
  const doc = host.ownerDocument;
  // The picture is sized for three choices on every step, so it never jumps.
  const porch = renderPorch(host, ctx, { below: choicesPt(LAYOUT_CHOICES), plainRows: LAYOUT_CHOICES, state: 'first' });
  host.setAttribute('data-step', String(screen.step || ''));
  const list = doc.createElement('div');
  list.className = 'game-choices';
  /** @type {HTMLButtonElement[]} */
  const buttons = [];
  const { box, pager } = porchBox(doc, screen.box, (pg) => {
    const wait = pg.waiting();
    if (wait) list.setAttribute('data-wait', '');
    else list.removeAttribute('data-wait');
    for (const b of buttons) {
      if (wait) b.setAttribute('aria-disabled', 'true');
      else b.removeAttribute('aria-disabled');
    }
  });
  host.appendChild(box);
  for (const c of screen.choices) {
    if (!c.label) continue;
    const act = { ...c.act };
    const cue = act.t === 'answer' ? LOCKBOX_CUES.answer : LOCKBOX_CUES.open;
    const b = porchChoice(doc, c.label, () => {
      // While the box's pages remain, a tap on a choice turns the page (12.1's ▾).
      if (pager.waiting()) {
        pager.next();
        return;
      }
      onAct(act, cue);
    });
    b.disabled = !c.enabled;
    if (act.t === 'answer') b.setAttribute('data-answer', String(act.a));
    list.appendChild(b);
    buttons.push(b);
  }
  host.appendChild(list);
  porch.onRelayout(() => pager.relayout());
  porch.layout();
  porch.whenFonts(() => pager.relayout());
  return {
    box,
    buttons,
    pager,
    porch,
    /** What takes focus: the box, so VoiceOver reads it. */
    focus: box,
    release: () => porch.release(),
  };
}
