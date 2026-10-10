// The ≡ menu (GAME_DESIGN 12.1, 12.18; BUILD_PLAN 2.5). From S5 the trail's
// status line opens it: a bottom sheet named by trail.status.menu, with
// rows (on short screens Pack, Map and Log, folded out of the toolbar) and,
// at its foot on every screen, the update note and the stamps, which the
// frame moves in the first time it draws the trail (moved, never rebuilt,
// so their listeners keep working: five taps on the build code here still
// open the debug menu, E.11). Back in a Safari tab will open it (12.1) once
// the router (ui/app.js) wires popstate; from the cabin it will hold the
// settings.

import { t } from '../text.js';

/**
 * The menu's sheet, built on first use (.scrim.menu-scrim > .sheet.menu >
 * .menu-rows + .menu-foot): on first open, or when the frame mounts it to
 * move the stamps in.
 * @param {Document} doc
 * @param {{onOpen?: () => void}} [o] onOpen: inside the tap that opens it (the frame plays ui.open)
 */
export function createMenu(doc, { onOpen } = {}) {
  /** @type {HTMLElement | null} */
  let scrim = null;
  /** @type {HTMLElement | null} */
  let rows = null;
  /** @type {HTMLElement | null} */
  let foot = null;

  const build = () => {
    scrim = doc.createElement('div');
    scrim.classList.add('scrim', 'menu-scrim');
    scrim.hidden = true;
    const sheet = doc.createElement('div');
    sheet.classList.add('sheet', 'box', 'menu');
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-label', t('trail.status.menu'));
    sheet.setAttribute('data-t-aria', 'trail.status.menu'); // the line inspector finds a spoken name by it
    rows = doc.createElement('div');
    rows.className = 'menu-rows';
    foot = doc.createElement('div');
    foot.className = 'menu-foot';
    sheet.appendChild(rows);
    sheet.appendChild(foot);
    scrim.appendChild(sheet);
    scrim.addEventListener('click', (event) => {
      if (event.target === scrim) menu.close();
    });
    doc.body.appendChild(scrim);
  };

  const menu = {
    open() {
      if (!scrim) build();
      /** @type {HTMLElement} */ (scrim).hidden = false;
      if (onOpen) onOpen();
    },
    close() {
      if (scrim) scrim.hidden = true;
    },
    isOpen() {
      return Boolean(scrim && !scrim.hidden);
    },
    /** Build the sheet without opening it; returns its rows and its foot. */
    mount() {
      if (!scrim) build();
      return { rows: /** @type {HTMLElement} */ (rows), foot: /** @type {HTMLElement} */ (foot) };
    },
    /**
     * Replace the rows (the toolbar's three on a short screen, or none).
     * @param {HTMLElement[]} nodes
     */
    setRows(nodes) {
      const r = menu.mount().rows;
      while (r.firstChild) r.removeChild(r.firstChild);
      for (const n of nodes) r.appendChild(n);
    },
    /** The rows' container, once built (null before). */
    get rows() {
      return rows;
    },
    /** The foot (the update note and the stamps), once built (null before). */
    get foot() {
      return foot;
    },
  };
  return menu;
}

/**
 * What Back does, once the router installs it on popstate: it opens the
 * menu and never navigates, so it can never rewind a trip (12.1).
 * @param {{open: () => void}} menu
 */
export function onBack(menu) {
  menu.open();
}
