// The ≡ menu stub (GAME_DESIGN 12.1, 12.18): built on first open, no words,
// and Back opens it without ever navigating.

import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createMenu, onBack } from '../../web/js/ui/menu.js';

/** A small DOM: enough for the ≡ stub. */
function fakeDoc() {
  const made = [];
  const node = (tag) => {
    const n = {
      tag,
      hidden: false,
      className: '',
      children: [],
      attrs: {},
      listeners: {},
      classList: { add: (...c) => (n.className = [n.className, ...c].filter(Boolean).join(' ')) },
      appendChild: (c) => (n.children.push(c), c),
      setAttribute: (k, v) => (n.attrs[k] = v),
      addEventListener: (k, fn) => (n.listeners[k] = fn),
    };
    made.push(n);
    return n;
  };
  return { made, body: node('body'), createElement: node };
}

test('the ≡ stub builds nothing until opened, toggles, and Back only opens it', () => {
  const doc = fakeDoc();
  const menu = createMenu(doc);
  assert.equal(doc.made.length, 1, 'nothing built yet (only the body)');
  assert.equal(menu.isOpen(), false);
  assert.equal(menu.rows, null);
  menu.open();
  assert.equal(menu.isOpen(), true);
  const scrim = doc.body.children[0];
  assert.equal(scrim.className, 'scrim');
  assert.equal(scrim.children[0].className, 'sheet box menu');
  assert.equal(scrim.children[0].attrs.role, 'dialog');
  assert.equal(menu.rows.className, 'menu-rows');
  menu.close();
  assert.equal(menu.isOpen(), false);
  assert.equal(scrim.hidden, true);
  menu.open();
  assert.equal(doc.body.children.length, 1, 'built once');
  scrim.listeners.click({ target: scrim });
  assert.equal(menu.isOpen(), false, 'a tap on the scrim closes it');
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
