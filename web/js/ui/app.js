// The game on preview (BUILD_PLAN S3, 2.2, 2.5; GAME_DESIGN 12.1, E.6,
// E.11, 8.14): the plain guest book, then the Sol Duc trailhead's two stops,
// played through the engine's step() and saved at every tap.
//
// main.js loads this module only when the build's <html data-screens> lists
// the guest book and the trail (home.js opensGame), so main's page never
// does. While the cover draws itself in (the loading art), it fetches
// data/rules.json and data/voice.json, reads the three saves and rebuilds
// the session (fromSaves). When both are ready the game takes the page:
// #app becomes the game view, and the update note, the install line and the
// stamps move into its footer, their listeners with them.
//
// Every tap: dispatch, then the saves in E.6's order (the trip, then the
// hiker; the device once, at the first launch), then the next screen. So
// closing the app at any moment reopens on the same stop: nothing is ever
// unsaved, and Restart (the update note's and the error sheet's) reloads
// into the autosave. A save the phone refuses (no storage, full) is noted
// for the bug report and play goes on; a refused trip holds the hiker back
// too, so the hiker's mark never runs ahead of the trip. A trip that can't
// go on (older than that mark, or its stop gone from a later build) is
// closed and kept in trip_closed, and a fresh trip starts. A stale tap the
// engine refuses is ignored; anything else opens the error sheet, and the
// bug report names the action that threw (state.pending), since it never
// reached the log. No history entry is ever pushed, so Back can't rewind a
// trip (12.1).
//
// Home is a stub in S3: its screen asks for the sample plan at once, and the
// UI draws the trip's seed (platform/rand.js) and dispatches the start. So
// after the second stop, a new trip begins at the first stop again; the
// trail beyond the trailhead arrives in S15a.

import { loadContent, newSession, dispatch, screenOf, toSaves, fromSaves, reportState, isEngineError } from '../engine/api.js';
import { load, save } from '../platform/storage.js';
import { newSeed, newHikerId } from '../platform/rand.js';
import { noteError } from './errors.js';
import { provideState } from './debug.js';
import { renderGuestbook } from './guestbook.js';
import { renderStop } from './stop.js';

/** The build's data, next to the page (U01: relative to this module). */
const DATA = new URL('../../data/', import.meta.url);
/** A tap this soon after a screen is drawn is the last screen's double tap, and is dropped (ms). */
export const TAP_GUARD_MS = 300;
/** The three saves, in the order a tap writes them (E.6; 8.14: the save at the tap holds the outcome). */
export const SAVE_ORDER = Object.freeze(['trip', 'hiker']);

/**
 * @typedef {import('../engine/step.js').Session} Session
 * @typedef {import('../engine/content.js').Content} Content
 * @typedef {import('../engine/phase.js').Screen} Screen
 * @typedef {{load: (name: string) => any, save: (name: string, value: unknown) => boolean}} Store
 */

/**
 * Fetch and load the build's data. The rules hash is the one the build
 * stamped on <html data-rules> (the page can't read version.json offline).
 * @param {{rulesHash: string, fetchFn?: (url: URL) => Promise<Response>, base?: URL}} o
 * @returns {Promise<Content>}
 */
export async function loadGameData({ rulesHash, fetchFn = (u) => fetch(u), base = DATA }) {
  const get = async (/** @type {string} */ f) => {
    const res = await fetchFn(new URL(f, base));
    if (!res.ok) throw new Error(`app: data/${f} ${res.status}`);
    return res.json();
  };
  const [rules, voice] = await Promise.all([get('rules.json'), get('voice.json')]);
  return loadContent({ rules, voice, rulesHash });
}

/** Where a trip this build can't go on with is kept: a list of its trip records, oldest first. */
export const CLOSED_KEY = 'trip_closed';

/**
 * The session from the saves, or a fresh device. A save that can't be
 * loaded throws (EngineError 'format'): the error sheet shows, with Copy bug
 * report, and nothing is deleted. The one exception is a trip that can't
 * go on (fromSaves' detail {trip}: older than the hiker's mark, or its stop
 * gone from this build): it is closed, never resumed at an earlier stop
 * (E.6), and never deleted. Its record joins trip_closed, the bug report
 * notes it, and the session opens without it, so home starts a fresh trip
 * instead of the error sheet coming back at every launch. If the phone
 * won't keep the record, the error stands.
 * @param {Content} content
 * @param {Store} [store]
 * @returns {{session: Session, first: boolean}}
 */
export function openSession(content, store = { load, save }) {
  const saves = { device: store.load('device'), hiker: store.load('hiker'), trip: store.load('trip') };
  const first = !saves.device;
  if (!saves.device && !saves.hiker && !saves.trip) return { session: newSession(content), first };
  try {
    return { session: fromSaves(saves, content), first };
  } catch (e) {
    const why = isEngineError(e) && e.detail && typeof e.detail.trip === 'string' ? e.detail.trip : null;
    if (!why) throw e;
    const kept = store.load(CLOSED_KEY);
    if (!store.save(CLOSED_KEY, [...(Array.isArray(kept) ? kept : []), saves.trip])) throw e;
    store.save('trip', null);
    noteError(new Error(`save: a trip this build can't go on with (${why}) was closed and kept in ${CLOSED_KEY}`));
    return { session: fromSaves({ ...saves, trip: null }, content), first };
  }
}

/**
 * Write a session's saves in E.6's order: the trip, then the hiker (each
 * only when there is one). The hiker follows its trip: when the phone
 * refuses the trip, the hiker is held back too, so its latest-stop mark
 * never runs ahead of the trip on the phone. Returns the names not
 * written.
 * @param {Session} session
 * @param {Store} [store]
 * @returns {string[]}
 */
export function writeSaves(session, store = { load, save }) {
  const records = toSaves(session);
  /** @type {string[]} */
  const refused = [];
  for (const name of SAVE_ORDER) {
    const rec = /** @type {Record<string, unknown>} */ (records)[name];
    if (!rec) continue;
    if (name === 'hiker' && refused.includes('trip')) refused.push(name);
    else if (!store.save(name, rec)) refused.push(name);
  }
  return refused;
}

/**
 * An action as a bug report carries it when it threw (E.11): it never
 * reached the log, so the report names it apart, as state.pending, and
 * play.mjs --replay tries it again after the fold. A trip action as the log
 * spells it (["choose", "go"], ["wait", 600], ["next"]), a start with its
 * plan and seed, and anything else by its kind alone: a sign holds the
 * name, which never reaches a report (call 3).
 * @param {Record<string, unknown>} action
 * @returns {(string | number)[]}
 */
export function pendingOf(action) {
  const t = String(action.t);
  if (t === 'choose') return [t, String(action.c)];
  if (t === 'wait') return [t, Number(action.s)];
  if (t === 'start') return [t, String(action.plan), String(action.seed)];
  return [t];
}

/**
 * The screen name a game screen shows as (#app[data-screen], which the bug
 * report reads): the guest book, the trail for a stop, else its phase.
 * @param {Screen} screen
 */
export function screenName(screen) {
  if (screen.phase === 'guestbook') return 'guestbook';
  if (screen.stop) return 'trail';
  return screen.phase;
}

/**
 * Take the page from the title: #app keeps its id and becomes the game
 * view, and the update note, the install line and the stamps move into its
 * footer (moved, never rebuilt, so their listeners still work).
 * @param {Document} doc
 * @returns {{app: HTMLElement, host: HTMLElement}}
 */
export function takePage(doc) {
  const app = /** @type {HTMLElement} */ (doc.getElementById('app'));
  const keep = ['update', 'install'].map((id) => doc.getElementById(id));
  const stampsEl = doc.getElementById('build-stamp');
  const stamps = stampsEl && /** @type {HTMLElement | null} */ (stampsEl.parentNode);
  const section = doc.createElement('section');
  section.className = 'game';
  const host = doc.createElement('div');
  host.className = 'game-screen';
  const foot = doc.createElement('footer');
  foot.className = 'game-foot';
  for (const n of [...keep, stamps]) if (n) foot.appendChild(n);
  section.appendChild(host);
  section.appendChild(foot);
  while (app.firstChild) app.removeChild(app.firstChild);
  app.className = 'game-page';
  app.appendChild(section);
  return { app, host };
}

/**
 * The game, from a loaded content and session, drawn into host. Returns a
 * handle the tests drive (act, session, screen).
 * @param {{doc: Document, app: HTMLElement, host: HTMLElement, content: Content, session: Session, store?: Store, seed?: () => string, hikerId?: () => string, now?: () => number}} o
 */
export function runGame({ doc, app, host, content, session: start, store = { load, save }, seed = newSeed, hikerId = newHikerId, now = () => performance.now() }) {
  let session = start;
  /** @type {Screen | null} */
  let screen = null;
  let shownAt = -Infinity;
  let refusedWrite = false;
  /** @type {HTMLButtonElement[]} */
  let buttons = [];
  /** @type {(string | number)[] | null} the action that last threw, until one goes through */
  let pending = null;

  provideState(() => {
    const st = reportState(session, content);
    return pending ? { ...st, pending } : st;
  });

  const persist = () => {
    const refused = writeSaves(session, store);
    if (refused.length && !refusedWrite) noteError(new Error(`storage: the phone refused the ${refused.join(' and ')} save`));
    refusedWrite = refused.length > 0;
  };

  /**
   * Step the engine by one action, save, and draw what comes next.
   * @param {Record<string, unknown>} action
   * @param {{tap?: boolean}} [o] tap: from the player (guarded against a double tap)
   */
  const act = (action, { tap = true } = {}) => {
    if (tap && now() - shownAt < TAP_GUARD_MS) return false;
    for (const b of buttons) b.disabled = true;
    let r;
    try {
      r = dispatch(session, action, content);
    } catch (e) {
      if (isEngineError(e) && e.code === 'refused') {
        console.warn('app: a stale tap, refused', e);
        draw(/** @type {Screen} */ (screen));
        return false;
      }
      // The report's state is the one before this tap: name the tap too.
      pending = pendingOf(action);
      throw e;
    }
    pending = null;
    session = r.session;
    persist();
    draw(r.screen);
    return true;
  };

  /** @param {Screen} next */
  const draw = (next) => {
    if (next.auto) {
      // Home's stub: start the plan it asks for, with a seed drawn here.
      act({ ...next.auto, seed: seed() }, { tap: false });
      return;
    }
    screen = next;
    while (host.firstChild) host.removeChild(host.firstChild);
    app.setAttribute('data-screen', screenName(next));
    let box;
    if (next.phase === 'guestbook') {
      const gb = renderGuestbook(host, next, (name) => act({ t: 'sign', name, id: hikerId() }));
      box = gb.box;
      buttons = [gb.sign];
    } else if (next.stop) {
      const st = renderStop(host, next, (a) => act(a));
      box = st.box;
      buttons = st.buttons;
    } else throw new Error(`app: no view for the ${next.phase} screen`);
    shownAt = now();
    if (box && typeof box.focus === 'function') box.focus({ preventScroll: true });
  };

  draw(screenOf(session.state, content));
  return {
    act,
    session: () => session,
    screen: () => screen,
    doc,
  };
}

/**
 * Start the game: load the data and the saves while the title draws in,
 * then take the page. title is showTitle()'s promise (its done settles when
 * the draw-in has finished); words is loadText()'s. The rest are for tests.
 * @param {Document} doc
 * @param {{title?: Promise<{stop: () => void, done: Promise<void>}>, words?: Promise<unknown>, fetchFn?: (url: URL) => Promise<Response>, store?: Store, seed?: () => string, hikerId?: () => string, now?: () => number}} [o]
 */
export async function startGame(doc, { title, words = Promise.resolve(), fetchFn, store = { load, save }, seed, hikerId, now } = {}) {
  const rulesHash = String(doc.documentElement.getAttribute('data-rules') || '');
  const content = await loadGameData({ rulesHash, fetchFn });
  const { session, first } = openSession(content, store);
  if (first && !store.save('device', toSaves(session).device)) noteError(new Error('storage: the phone refused the device save'));
  await words;
  /** @type {{stop: () => void, done: Promise<void>} | null} */
  let cover = null;
  if (title) {
    // A title that failed has opened the sheet already; the game goes on.
    cover = await title.catch(() => null);
    if (cover) await cover.done;
  }
  const { app, host } = takePage(doc);
  if (cover) cover.stop();
  return runGame({ doc, app, host, content, session, store, seed, hikerId, now });
}
