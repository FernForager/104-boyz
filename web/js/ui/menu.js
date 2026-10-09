// The ≡ menu (GAME_DESIGN 12.1, 12.18; BUILD_PLAN 2.5), a stub until it has
// rows. Back in a Safari tab will open it (12.1) once the router (ui/app.js)
// wires popstate; on short screens it will hold Pack, Map and Log, and from
// the cabin the settings. In S2 it has no button and no words: the title page
// has nothing for it to hold, and its label comes in the batch of the session
// that shows it. Nothing calls it yet.

/**
 * The menu's sheet, built on first open (.scrim > .sheet.menu > .menu-rows).
 * @param {Document} doc
 */
export function createMenu(doc) {
  /** @type {HTMLElement | null} */
  let scrim = null;
  /** @type {HTMLElement | null} */
  let rows = null;

  const build = () => {
    scrim = doc.createElement('div');
    scrim.className = 'scrim';
    scrim.hidden = true;
    const sheet = doc.createElement('div');
    sheet.classList.add('sheet', 'box', 'menu');
    // Its accessible name arrives with its label, in the session that shows it.
    sheet.setAttribute('role', 'dialog');
    rows = doc.createElement('div');
    rows.className = 'menu-rows';
    sheet.appendChild(rows);
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
    },
    close() {
      if (scrim) scrim.hidden = true;
    },
    isOpen() {
      return Boolean(scrim && !scrim.hidden);
    },
    /** The rows' container, once built (null before the first open). */
    get rows() {
      return rows;
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
