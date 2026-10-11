// The ≡ menu (GAME_DESIGN 12.1, 12.18): built on first use, named by
// trail.status.menu from S5 (from S7 by its opener's line: the mailbox at
// the cabin), with a Close for VoiceOver, rows, the settings and a foot;
// Back opens it without ever navigating.

import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createMenu, onBack, MENU_LINE, CLOSE_LINE } from '../../web/js/ui/menu.js';
import { setBundle } from '../../web/js/text.js';
import { fakeDocument } from './textfix.mjs';

/** A small DOM (textfix.mjs's), counting what it makes. */
function fakeDoc() {
  const doc = fakeDocument();
  const made = [];
  const make = doc.createElement;
  doc.createElement = (tag) => {
    const n = make(tag);
    made.push(n);
    return n;
  };
  return Object.assign(doc, { made });
}

test('the ≡ stub builds nothing until opened, toggles, and Back only opens it', () => {
  const doc = fakeDoc();
  const menu = createMenu(doc);
  assert.equal(doc.made.length, 0, 'nothing built yet');
  assert.equal(menu.isOpen(), false);
  assert.equal(menu.rows, null);
  menu.open();
  assert.equal(menu.isOpen(), true);
  const scrim = doc.body.children[0];
  assert.equal(scrim.className, 'scrim menu-scrim');
  assert.equal(scrim.children[0].className, 'sheet box menu');
  assert.equal(scrim.children[0].getAttribute('role'), 'dialog');
  assert.equal(menu.rows.className, 'menu-rows');
  assert.equal(menu.settings.className, 'menu-settings');
  assert.equal(menu.foot.className, 'menu-foot');
  const close = scrim.children[0].children[0];
  assert.deepEqual(scrim.children[0].children, [close, menu.rows, menu.settings, menu.foot], 'S7: a Close, the rows, the settings (the mailbox\'s), the foot');
  assert.equal(close.getAttribute('data-t'), CLOSE_LINE, 'Close (trail.why.close), for VoiceOver');
  menu.close();
  assert.equal(menu.isOpen(), false);
  assert.equal(scrim.hidden, true);
  menu.open();
  assert.equal(doc.body.children.length, 1, 'built once');
  scrim.dispatchEvent({ type: 'click', target: scrim });
  assert.equal(menu.isOpen(), false, 'a tap on the scrim closes it');
  menu.open();
  close.click();
  assert.equal(menu.isOpen(), false, 'and so does Close');
  // Back opens the menu and never navigates.
  const history = { back: mock.fn(), go: mock.fn(), pushState: mock.fn(), replaceState: mock.fn() };
  const saved = globalThis.history;
  globalThis.history = history;
  try {
    onBack(menu);
  } finally {
    globalThis.history = saved;
  }
  assert.equal(menu.isOpen(), true);
  for (const f of Object.values(history)) assert.equal(f.mock.callCount(), 0);
});

test('S5: the sheet is named by trail.status.menu, mount() builds it without opening, setRows replaces the rows, and opening calls onOpen (ui.open)', (t) => {
  setBundle({ 'trail.status.menu': 'Menu', 'home.place.mailbox': 'The mailbox' }, {}, 'preview');
  t.after(() => setBundle({}, {}, null));
  const doc = fakeDoc();
  let opened = 0;
  const menu = createMenu(doc, { onOpen: () => opened++ });
  const { rows, foot } = menu.mount();
  assert.equal(menu.isOpen(), false, 'mounted, not open');
  const sheet = doc.body.children[0].children[0];
  assert.equal(sheet.getAttribute('aria-label'), 'Menu');
  assert.equal(menu.label(), MENU_LINE);
  assert.equal(menu.mount().rows, rows, 'built once');
  assert.equal(foot.className, 'menu-foot');
  const a = doc.createElement('button');
  const b = doc.createElement('button');
  menu.setRows([a, b]);
  assert.deepEqual(rows.children, [a, b]);
  menu.setRows([]);
  assert.deepEqual(rows.children, []);
  assert.equal(opened, 0);
  menu.open();
  assert.equal(opened, 1, 'the frame plays ui.open here');
  assert.equal(menu.isOpen(), true);
  // S7: named by its opener, the mailbox at the cabin; the settings rows and their redraw on every open.
  menu.close();
  let shown = 0;
  const row = doc.createElement('button');
  menu.setSettings([row], () => shown++);
  menu.open({ label: 'home.place.mailbox' });
  assert.equal(sheet.getAttribute('aria-label'), 'The mailbox');
  assert.equal(sheet.getAttribute('data-t-aria'), 'home.place.mailbox');
  assert.deepEqual(menu.settings.children, [row]);
  assert.equal(shown, 1, 'the settings redraw as it opens');
  menu.open();
  assert.equal(sheet.getAttribute('aria-label'), 'Menu', 'no line: the trail\'s');
});
