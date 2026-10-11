// Fixtures for S6's fork tests (not a test file itself): the repo's content
// for the trail and preview's words for it (no build: tools/text.mjs's own
// bundle), the fork's screens through the real engine, and a tiny DOM and
// device for the frame (textfix.mjs's), so the choices, the Why sheet, the
// confirm, the outcome and the compass are tested on the screens the game
// really draws.

import assert from 'node:assert/strict';
import { ROOT } from '../../tools/pics.mjs';
import { readText, bundle } from '../../tools/text.mjs';
import { compileContent } from '../../tools/content.mjs';
import { loadContent, newSession, dispatch } from '../../web/js/engine/api.js';
import { lockboxActs } from '../../web/js/engine/selfcheck.js';
import { setBundle } from '../../web/js/text.js';
import { setChannel } from '../../web/js/platform/storage.js';
import { createMenu } from '../../web/js/ui/menu.js';
import { fakeDocument } from './textfix.mjs';

/** The places the fork's screens name: their captions, its Why sheets' arrivals, its outcomes' pencil rows. */
export const FORK_PLACES = Object.freeze(['deer_lake', 'seven_lakes_basin', 'heart_lake', 'lunch_lake', 'high_divide', 'sol_duc_trailhead'].map((p) => `place.${p}`));
/** Preview's words, as the build bundles them, with the fork's places. */
export const WORDS = bundle(readText(ROOT), 'preview', [], FORK_PLACES)['en.json'];

/** The repo's content for the trail. */
export function forkContent() {
  const { rules, voice, problems } = compileContent({ screens: ['trail'], checkText: false });
  assert.deepEqual(problems, []);
  return loadContent({ rules, voice, rulesHash: 'abcdef012345' });
}
export const CONTENT = forkContent();

/**
 * Robin at the fork: sign, start the sample with a seed, Walk on twice.
 * @param {string} [seed] K7QM2Q9F: the crest's storm hits close; D0000001 clean; D000000Z fatal
 */
export function atFork(seed = 'K7QM2Q9F') {
  let s = newSession(CONTENT);
  // S7: the lockbox first (this content has no quiz: Take the key at once).
  for (const a of lockboxActs(seed, CONTENT)) s = dispatch(s, a, CONTENT).session;
  s = dispatch(s, { t: 'sign', name: 'Robin', id: 'h00000001' }, CONTENT).session;
  s = dispatch(s, { t: 'start', plan: 'sample', seed }, CONTENT).session;
  s = dispatch(s, { t: 'next' }, CONTENT).session;
  return dispatch(s, { t: 'next' }, CONTENT);
}

/**
 * The outcome a choice at the fork lands on, with that seed.
 * @param {string} c
 * @param {string} [seed]
 */
export function outcomeOf(c, seed = 'K7QM2Q9F') {
  return dispatch(atFork(seed).session, { t: 'choose', c }, CONTENT);
}

/** A Map-backed localStorage. */
export function fakeStorage() {
  const m = new Map();
  return {
    get length() {
      return m.size;
    },
    key: (/** @type {number} */ i) => [...m.keys()][i] ?? null,
    getItem: (/** @type {string} */ k) => (m.has(k) ? m.get(k) : null),
    setItem: (/** @type {string} */ k, /** @type {string} */ v) => m.set(k, String(v)),
    removeItem: (/** @type {string} */ k) => m.delete(k),
    map: m,
  };
}

/** Preview's channel and words and a fresh localStorage, for one test. */
export function device(t) {
  const ls = fakeStorage();
  const had = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: ls });
  setChannel('preview');
  setBundle(WORDS, {}, 'preview');
  t.after(() => {
    if (had) Object.defineProperty(globalThis, 'localStorage', had);
    else delete globalThis.localStorage;
    setChannel(null);
    setBundle({}, {}, null);
  });
  return ls;
}

/** A sound that records what it is asked to play. */
export function fakeSound() {
  const played = /** @type {string[]} */ ([]);
  return { played, play: (/** @type {string} */ cue) => played.push(cue), isOn: () => true, setOn() {} };
}

/** A tiny document for the frame: SVG as plain elements. */
export function frameDoc() {
  const doc = fakeDocument();
  doc.createElementNS = (/** @type {string} */ _ns, /** @type {string} */ tag) => doc.createElement(tag);
  doc.documentElement.setAttribute('data-channel', 'preview');
  doc.documentElement.setAttribute('data-screens', 'app debug guestbook map title trail');
  return doc;
}

/** The frame's context for a screen. */
export function ctxFor(screen, doc, extra = {}) {
  const v = CONTENT.voice(screen.stop.set, screen.stop.id);
  return { park: CONTENT.park(), view: v.view, day: 1, hour: 'day', art: null, palette: null, composer: null, sound: fakeSound(), menu: createMenu(doc), ...extra };
}

/** Fire a document's listeners with a pointer or mouse event. */
export function fire(doc, type, init = {}) {
  const ev = {
    type,
    isPrimary: true,
    button: 0,
    clientX: 100,
    clientY: 100,
    prevented: false,
    stopped: false,
    preventDefault() {
      this.prevented = true;
    },
    stopPropagation() {
      this.stopped = true;
    },
    ...init,
  };
  for (const f of [...(doc.listeners.get(type) || [])]) f(ev);
  return ev;
}

/** The choice button whose label is a line. */
export const choiceBy = (root, id) => root.querySelectorAll('.choice').find((b) => b.querySelector('.choice-label') && b.querySelector('.choice-label').getAttribute('data-t') === id);
