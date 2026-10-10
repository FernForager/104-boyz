// Larger Text and the Plain font (BUILD_PLAN S5 3.6.5; GAME_DESIGN 11.9):
// the probe's 17 px (iOS's default Large) keeps the pixel fonts, 20 px
// gives the Plain serif at 20 px, the dev override wins, and Chromium (no
// -apple-system-body) changes nothing.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakeDocument } from './textfix.mjs';
import { textMode, probeBody, applyText, initTextSize, savedText, DEFAULT_BODY_PX, FORCED_PLAIN_PX, TEXT_MODES } from '../../web/js/ui/textsize.js';
import { devRegistry } from '../../web/js/ui/debug.js';
import { setChannel } from '../../web/js/platform/storage.js';

/** A document whose probe reports a body size (null: the browser rejects -apple-system-body). */
function probed(px) {
  const doc = fakeDocument();
  doc.documentElement.setAttribute('data-channel', 'preview');
  const create = doc.createElement;
  doc.createElement = (tag) => {
    const el = create(tag);
    let font = '';
    Object.defineProperty(el.style, 'font', {
      get: () => font,
      set: (v) => {
        font = px === null ? '' : v;
      },
    });
    return el;
  };
  doc.defaultView = { getComputedStyle: () => ({ fontSize: `${px}px` }) };
  return doc;
}

/** A Map-backed localStorage on preview's channel. */
function device(t) {
  const m = new Map();
  const ls = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; } };
  const had = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: ls });
  setChannel('preview');
  t.after(() => {
    if (had) Object.defineProperty(globalThis, 'localStorage', had);
    else delete globalThis.localStorage;
    setChannel(null);
  });
  return m;
}

test('the mode: 17 px leaves the pixel fonts; anything larger is Plain at that size; the override wins', () => {
  assert.equal(DEFAULT_BODY_PX, 17);
  assert.deepEqual(textMode(17), { mode: 'pixel', size: null });
  assert.deepEqual(textMode(15), { mode: 'pixel', size: null }, 'smaller text keeps the pixel fonts');
  assert.deepEqual(textMode(20), { mode: 'plain', size: 20 });
  assert.deepEqual(textMode(null), { mode: 'pixel', size: null }, 'no probe (Chromium): nothing changes');
  assert.deepEqual(textMode(20, 'pixel'), { mode: 'pixel', size: null }, 'the override wins');
  assert.deepEqual(textMode(17, 'plain'), { mode: 'plain', size: FORCED_PLAIN_PX });
  assert.deepEqual(textMode(28, 'plain'), { mode: 'plain', size: 28 });
  assert.deepEqual(textMode(28, 'auto'), { mode: 'plain', size: 28 });
  assert.deepEqual(TEXT_MODES, ['auto', 'pixel', 'plain']);
});

test('the probe reads -apple-system-body, and reads nothing where the browser rejects it', () => {
  assert.equal(probeBody(probed(17)), 17);
  assert.equal(probeBody(probed(23)), 23);
  assert.equal(probeBody(probed(null)), null);
  assert.equal(probeBody(fakeDocument()), null, 'no window: no probe');
  const doc = probed(20);
  probeBody(doc);
  assert.equal(doc.body.children.length, 0, 'the probe is removed');
});

test('<html data-text> and --plain-size follow the probe at start, the dev control overrides, and it is kept as `text`', (t) => {
  const m = device(t);
  const doc = probed(20);
  const html = doc.documentElement;
  let changed = 0;
  initTextSize(doc, { onChange: () => changed++ });
  assert.equal(html.getAttribute('data-text'), 'plain');
  assert.equal(html.style.getPropertyValue('--plain-size'), '20px');
  assert.ok(devRegistry().controls.includes('text'), 'the dev control *text*');
  applyText(doc, textMode(17));
  assert.equal(html.getAttribute('data-text'), 'pixel');
  assert.equal(html.style.getPropertyValue('--plain-size'), '');
  assert.equal(savedText(), 'auto');
  m.set('oph.preview.text', JSON.stringify('pixel'));
  assert.equal(savedText(), 'pixel');
  applyText(doc, textMode(probeBody(doc), savedText()));
  assert.equal(html.getAttribute('data-text'), 'pixel', 'the override wins over 20 px');
  m.set('oph.preview.text', JSON.stringify('huge'));
  assert.equal(savedText(), 'auto', 'not a mode: auto');
  // Back in the foreground, it is read again (iOS fires no resize for a text size change).
  m.delete('oph.preview.text');
  doc.visibilityState = 'visible';
  for (const f of doc.listeners.get('visibilitychange') || []) f({ type: 'visibilitychange' });
  assert.equal(html.getAttribute('data-text'), 'plain');
  assert.equal(changed, 0, 'onChange is for the control');
});
