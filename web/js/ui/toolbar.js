// The toolbar (GAME_DESIGN 12.2; BUILD_PLAN 2.5): Pack, Map and Log under
// the choices on tall screens, above the home indicator. They will open one
// modal with three tabs; in S5 they are drawn and disabled, the modal
// arriving with its sessions. On short screens (under 700 pt) the toolbar
// folds into the ≡ sheet: the same three, as its rows (12.1).

import { tx } from '../text.js';

/** The three, in order: [item, its line]. */
export const TOOLBAR = Object.freeze([
  ['pack', 'trail.toolbar.pack'],
  ['map', 'trail.toolbar.map'],
  ['log', 'trail.toolbar.log'],
]);

/**
 * The three buttons, disabled until their modal lands.
 * @param {Document} doc
 * @param {string[]} classes each button's classes
 * @returns {HTMLButtonElement[]}
 */
export function toolbarButtons(doc, classes) {
  return TOOLBAR.map(([item, id]) => {
    const b = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
    b.classList.add(...classes);
    b.setAttribute('type', 'button');
    b.setAttribute('data-item', item);
    b.disabled = true;
    tx(b, id); // t-ids: trail.toolbar.pack, trail.toolbar.map, trail.toolbar.log
    return b;
  });
}

/**
 * The toolbar on a tall screen: nav.toolbar > button.toolbar-item x3.
 * @param {Document} doc
 */
export function renderToolbar(doc) {
  const nav = doc.createElement('nav');
  nav.className = 'toolbar';
  for (const b of toolbarButtons(doc, ['toolbar-item'])) nav.appendChild(b);
  return nav;
}

/**
 * The same three as the ≡ sheet's rows, on a short screen.
 * @param {Document} doc
 */
export function menuRows(doc) {
  return toolbarButtons(doc, ['box', 'choice', 'menu-item']);
}
