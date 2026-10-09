import test from 'node:test';
import assert from 'node:assert/strict';
import { initDebug } from '../../web/js/ui/debug.js';

// A real iPhone zoomed in on the build stamp's quick taps instead of counting
// them (2026-10-09). The stamp cancels its touchend, non-passively, so iOS
// can't treat the taps as a double-tap zoom.
test('the build stamp cancels its touchend so quick taps never zoom (iOS)', () => {
  const listeners = [];
  const stamp = { addEventListener: (type, fn, opts) => listeners.push({ type, fn, opts }) };
  const doc = { getElementById: (id) => (id === 'build-stamp' ? stamp : null), defaultView: { location: { search: '' } } };
  initDebug(/** @type {any} */ (doc));
  const end = listeners.find((l) => l.type === 'touchend');
  assert.ok(end, 'a touchend listener');
  assert.equal(end.opts && end.opts.passive, false, 'not passive, or preventDefault is ignored');
  let prevented = false;
  end.fn({ preventDefault: () => { prevented = true; } });
  assert.ok(prevented);
  assert.ok(listeners.some((l) => l.type === 'pointerup'), 'the taps are still counted on pointerup');
});
