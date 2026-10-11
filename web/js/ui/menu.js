// The ≡ sheet (GAME_DESIGN 12.1, 12.18; BUILD_PLAN 2.5, S7 lead call 63):
// one bottom sheet, opened by ≡ on the trail's status line and, at the
// cabin, by ≡, the mailbox and the rail's Mailbox; at the cabin it is the
// mailbox. It holds, top to bottom:
//
//   rows      on a short screen on the trail, Pack, Map and Log, folded out
//             of the toolbar (ui/toolbar.js); none elsewhere
//   settings  the mailbox's settings rows (ui/mailbox.js): Sound and Text in
//             S7 (12.18's subset; the scope's settings switch lists the rest)
//   foot      the update note and its Restart, Works offline and the build
//             stamp, moved in once when the game takes the page (moved, never
//             rebuilt, so their listeners keep working: five taps on the
//             build code here still open the debug menu, E.11)
//
// Its name is the opener's line: home.place.mailbox at the cabin,
// trail.status.menu on the trail; a Close button (trail.why.close) closes
// it for VoiceOver, and so does a tap on the scrim or Escape. It is a modal
// dialog, as the Why sheet is (ui/sheet.js): aria-modal, so VoiceOver stays
// in it, its first row taking focus as it opens (else Close), and focus
// going back to what opened it as it closes (or, when a redraw behind it
// took that away, to the status line's ≡). Back in a Safari tab will open
// it (12.1) once the router wires popstate.

import { t, tx } from '../text.js';

/** The sheet's name when the opener names none: the trail's ≡. */
export const MENU_LINE = 'trail.status.menu';
/** The Close button's word (12.11's Why sheet has the same). */
export const CLOSE_LINE = 'trail.why.close';

/**
 * The sheet, built on first use (.scrim.menu-scrim > .sheet.menu >
 * .menu-close + .menu-rows + .menu-settings + .menu-foot): on first open,
 * or when the game mounts it to move the stamps in.
 * @param {Document} doc
 * @param {{onOpen?: () => void}} [o] onOpen: inside the tap that opens it (the game plays ui.open)
 */
export function createMenu(doc, { onOpen } = {}) {
  /** @type {HTMLElement | null} */
  let scrim = null;
  /** @type {HTMLElement | null} */
  let sheet = null;
  /** @type {HTMLElement | null} */
  let rows = null;
  /** @type {HTMLElement | null} */
  let settings = null;
  /** @type {HTMLElement | null} */
  let foot = null;
  /** @type {(() => void)[]} run on every open (the settings rows redraw their state) */
  const onShow = [];
  /** @type {HTMLButtonElement | null} */
  let closeButton = null;
  /** @type {HTMLElement | null} what had focus when the sheet opened */
  let opener = null;
  /** @param {KeyboardEvent} event */
  const onKey = (event) => {
    if (event.key === 'Escape') menu.close(); // t-ok: a key's name, never shown
  };

  /** @param {string} line */
  const name = (line) => {
    const s = /** @type {HTMLElement} */ (sheet);
    s.setAttribute('aria-label', t(line)); // t-ids: trail.status.menu, home.place.mailbox
    s.setAttribute('data-t-aria', line); // the line inspector finds a spoken name by it
  };

  const build = () => {
    scrim = doc.createElement('div');
    scrim.classList.add('scrim', 'menu-scrim');
    scrim.hidden = true;
    sheet = doc.createElement('div');
    sheet.classList.add('sheet', 'box', 'menu');
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    name(MENU_LINE);
    const close = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
    closeButton = close;
    close.classList.add('menu-close', 'vh');
    close.setAttribute('type', 'button');
    tx(close, CLOSE_LINE); // t-ids: trail.why.close
    close.addEventListener('click', () => menu.close());
    rows = doc.createElement('div');
    rows.className = 'menu-rows';
    settings = doc.createElement('div');
    settings.className = 'menu-settings';
    foot = doc.createElement('div');
    foot.className = 'menu-foot';
    sheet.appendChild(close);
    sheet.appendChild(rows);
    sheet.appendChild(settings);
    sheet.appendChild(foot);
    scrim.appendChild(sheet);
    scrim.addEventListener('click', (event) => {
      if (event.target === scrim) menu.close();
    });
    doc.body.appendChild(scrim);
  };

  const menu = {
    /**
     * Open the sheet, named by the opener's line.
     * @param {{label?: string}} [o]
     */
    open({ label = MENU_LINE } = {}) {
      if (!scrim) build();
      name(label);
      for (const f of onShow) f();
      const was = !(/** @type {HTMLElement} */ (scrim).hidden);
      /** @type {HTMLElement} */ (scrim).hidden = false;
      if (!was) {
        const active = /** @type {HTMLElement | null} */ (doc.activeElement);
        opener = active && active !== doc.body && !(sheet && sheet.contains(active)) ? active : null;
        doc.addEventListener('keydown', onKey, true);
      }
      // Focus into the sheet: its first row, else Close (VoiceOver starts there).
      const first = /** @type {HTMLElement | null} */ ((rows && rows.querySelector('button')) || (settings && settings.querySelector('button')) || closeButton);
      if (first && typeof first.focus === 'function') first.focus({ preventScroll: true });
      if (onOpen) onOpen();
    },
    close() {
      if (!scrim || scrim.hidden) return;
      scrim.hidden = true;
      doc.removeEventListener('keydown', onKey, true);
      // Focus back to the opener; a redraw behind the sheet may have taken it away: then the status line's ≡.
      const back = opener && doc.documentElement.contains(opener) ? opener : /** @type {HTMLElement | null} */ (doc.querySelector('.status-menu'));
      opener = null;
      if (back && typeof back.focus === 'function') back.focus({ preventScroll: true });
    },
    isOpen() {
      return Boolean(scrim && !scrim.hidden);
    },
    /** The name it shows under now (its line), or null before it is built. */
    label() {
      return sheet ? sheet.getAttribute('data-t-aria') : null;
    },
    /** Build the sheet without opening it; returns its rows, its settings and its foot. */
    mount() {
      if (!scrim) build();
      return { rows: /** @type {HTMLElement} */ (rows), settings: /** @type {HTMLElement} */ (settings), foot: /** @type {HTMLElement} */ (foot) };
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
    /**
     * Replace the settings rows (ui/mailbox.js); refresh runs on every open.
     * @param {HTMLElement[]} nodes
     * @param {() => void} [refresh]
     */
    setSettings(nodes, refresh) {
      const r = menu.mount().settings;
      while (r.firstChild) r.removeChild(r.firstChild);
      for (const n of nodes) r.appendChild(n);
      onShow.length = 0;
      if (refresh) onShow.push(refresh);
    },
    /** The rows' container, once built (null before). */
    get rows() {
      return rows;
    },
    /** The settings' container, once built (null before). */
    get settings() {
      return settings;
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
