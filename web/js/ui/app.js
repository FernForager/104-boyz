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
//
// From S5 a stop is drawn in the trail frame (ui/frame.js): the status line,
// the picture, the caption, the strip, S3's box and choices, the toolbar.
// While the cover draws in, the game also adds css/frame.css to the page,
// fetches art/art.json (the HTTP cache has it from the title) and loads the
// chrome font and the Plain serif, waiting for them (at most 1.5 s) before
// it takes the page, so the first trail paint has its fonts. A choice's tap
// plays its cue (ui.tick, or ui.next for Walk on) after the double-tap
// guard and before the step; ≡ opens with ui.open. The sound (S5 sound
// A1): the unlock (audio/unlock.js) is installed the moment the game
// starts, so the first tap anywhere, the cover's included, opens the sound
// in Safari's ambient session; the audio facade (ui/sound.js) is imported
// alongside the data and plays the cues, and frame.js's quiet stand-in
// takes its place only if it fails to load. The picture is the
// composer's (gfx/compose.js): the stop's place at the hour, from
// art.json's recipes (passing composer null shows the cover's stand-in
// instead).
//
// Dev routes, preview only, in debug mode (?debug=1, or the menu opened):
// #stop=<set>.<stop>&hour=<h> opens that stop through the real engine in a
// session kept in memory (Robin, a fixed id, the sample with a fixed seed,
// Walk on until the stop), never touching storage (tools/shots.mjs uses
// it); #frame opens the frame's check view (the dev action Scenes).

import { loadContent, newSession, dispatch, screenOf, toSaves, fromSaves, reportState, isEngineError } from '../engine/api.js';
import { makePalette } from '../gfx/palette.js';
import { compose, drawable } from '../gfx/compose.js';
import { load, save } from '../platform/storage.js';
import { newSeed, newHikerId } from '../platform/rand.js';
import { noteError } from './errors.js';
import { provideState, debugRequested, debugMode, opensTrail } from './debug.js';
import { renderGuestbook } from './guestbook.js';
import { createMenu } from './menu.js';
import { renderFrame, hourOf, savedHour, stubSound, registerFrameDev, showScenes, hideScenes, HOURS, SCENES_HASH } from './frame.js';
import { initTextSize } from './textsize.js';
import { createUnlock } from '../audio/unlock.js';

/** The scene composer the frame draws its pictures with (BUILD_PLAN S5). */
export const COMPOSER = Object.freeze({ compose, drawable });

/** The build's data, next to the page (U01: relative to this module). */
const DATA = new URL('../../data/', import.meta.url);
/** The pictures (the title fetched them already). */
const ART = new URL('../../art/art.json', import.meta.url);
/** The trail frame's stylesheet: only preview's game loads it (main's page never does). */
const FRAME_CSS = new URL('../../css/frame.css', import.meta.url);
/** The frame's two fonts (css/frame.css), loaded before the game takes the page. */
export const FRAME_FONTS = Object.freeze(['16px "OPH Chrome"', '16px Literata']); // t-ok: CSS font specs, never shown
/** How long the game waits for them at most (ms). */
export const FONT_WAIT_MS = 1500;
/** The dev route's hiker and seed (#stop=): fixed, so a screenshot is the same every time. */
export const DEV_HIKER = Object.freeze({ name: 'Robin', id: 'h00000001', seed: 'K7QM2Q9F' }); // t-ok: the dev route's fixture hiker (the doc's own example), never on main
/** Walk on at most this many times looking for a #stop= route's stop. */
const DEV_MAX_STEPS = 64;
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
 * Pure: the dev route an address asks for (preview's debug mode only):
 * {stop: {set, id}, hour} for #stop=<set>.<stop>[&hour=<h>], {frame: true}
 * for #frame, else null. Null too when the build lacks the trail (main), or
 * debug mode is off.
 * @param {{hash: string, debug: boolean, trail: boolean}} o
 * @returns {{stop?: {set: string, id: string}, hour?: string | null, frame?: boolean} | null}
 */
export function devRoute({ hash, debug, trail }) {
  if (!debug || !trail) return null;
  if (hash === SCENES_HASH) return { frame: true };
  const m = /^#stop=([a-z][a-z0-9_]*)\.([a-z][a-z0-9_]*)(?:&hour=([a-z]+))?$/.exec(String(hash || ''));
  if (!m) return null;
  return { stop: { set: m[1], id: m[2] }, hour: m[3] && HOURS.includes(m[3]) ? m[3] : null };
}

/**
 * The dev route for this page: its hash, in debug mode (?debug=1, or the
 * debug menu opened), on a build with the trail.
 * @param {Document} doc
 */
function routeOf(doc) {
  const win = doc.defaultView;
  if (!win) return null;
  return devRoute({ hash: win.location.hash, debug: debugRequested(win.location.search) || debugMode(), trail: opensTrail(doc) });
}

/**
 * A session at a real stop, through the real engine (#stop=): Robin signs
 * with a fixed id, the sample starts with a fixed seed, and Walk on until
 * the stop shows. Null when the walk never reaches it.
 * @param {Content} content
 * @param {{set: string, id: string}} stop
 * @returns {Session | null}
 */
export function devSession(content, stop) {
  let s = newSession(content);
  s = dispatch(s, { t: 'sign', name: DEV_HIKER.name, id: DEV_HIKER.id }, content).session;
  s = dispatch(s, { t: 'start', plan: 'sample', seed: DEV_HIKER.seed }, content).session;
  for (let i = 0; i < DEV_MAX_STEPS; i++) {
    const sc = screenOf(s.state, content);
    if (sc.stop && sc.stop.set === stop.set && sc.stop.id === stop.id) return s;
    try {
      s = dispatch(s, { t: 'next' }, content).session;
    } catch {
      return null;
    }
  }
  return null;
}

/** A store that keeps everything in memory: the dev route never touches the phone's saves. */
export function memoryStore() {
  const m = new Map();
  return {
    load: (/** @type {string} */ k) => (m.has(k) ? m.get(k) : null),
    save: (/** @type {string} */ k, /** @type {unknown} */ v) => {
      m.set(k, v);
      return true;
    },
  };
}

/**
 * The game, from a loaded content and session, drawn into host. Returns a
 * handle the tests drive (act, session, screen, redraw).
 * @param {{doc: Document, app: HTMLElement, host: HTMLElement, content: Content, session: Session, store?: Store, seed?: () => string, hikerId?: () => string, now?: () => number, art?: any, sound?: import('./frame.js').Sound, composer?: import('./frame.js').Composer | null, hour?: string | null}} o
 *   art: art.json (null: no pictures); sound: the audio facade (the quiet
 *   stand-in until ui/sound.js); composer: gfx/compose.js's (null: the cover
 *   stands in); hour: the dev route's hour, over the dev control's
 */
export function runGame({ doc, app, host, content, session: start, store = { load, save }, seed = newSeed, hikerId = newHikerId, now = () => performance.now(), art = null, sound = stubSound(), composer = COMPOSER, hour: routeHour = null }) {
  let session = start;
  /** @type {Screen | null} */
  let screen = null;
  let shownAt = -Infinity;
  let refusedWrite = false;
  /** @type {HTMLButtonElement[]} */
  let buttons = [];
  /** @type {(string | number)[] | null} the action that last threw, until one goes through */
  let pending = null;
  /** @type {{release: () => void} | null} the trail frame on screen */
  let frame = null;
  const palette = art && art.palette ? makePalette(art.palette) : null;
  // ≡ opens with a soft tick, inside the tap (C's ui.open).
  const menu = createMenu(doc, { onOpen: () => sound.play('ui.open') });
  /** The hour for the next trail picture: the route's (until the dev control changes), the dev control's, or the trip count's. */
  const hourNow = () => {
    const kept = savedHour();
    return hourOf(session, routeHour || (kept === 'auto' ? null : kept));
  };

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
   * @param {{tap?: boolean, cue?: string | null}} [o] tap: from the player (guarded
   *   against a double tap); cue: the sound the tap plays once it passes the guard
   */
  const act = (action, { tap = true, cue = null } = {}) => {
    if (tap && now() - shownAt < TAP_GUARD_MS) return false;
    if (cue) sound.play(cue);
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
    if (frame) frame.release();
    frame = null;
    while (host.firstChild) host.removeChild(host.firstChild);
    host.className = 'game-screen';
    host.removeAttribute('data-hour');
    host.removeAttribute('data-short');
    app.setAttribute('data-screen', screenName(next));
    let box;
    if (next.phase === 'guestbook') {
      const gb = renderGuestbook(host, next, (name) => act({ t: 'sign', name, id: hikerId() }));
      box = gb.box;
      buttons = [gb.sign];
    } else if (next.stop) {
      const v = content.voice(next.stop.set, next.stop.id);
      const trip = session.state.trip;
      const f = renderFrame(host, next, (a, cue) => act(a, { cue }), {
        park: content.park(),
        view: v && v.view ? v.view : null,
        day: trip && trip.clock ? trip.clock.day : 1,
        hour: hourNow(),
        art,
        palette,
        composer,
        sound,
        menu,
      });
      frame = f;
      box = f.focus;
      buttons = f.buttons;
    } else throw new Error(`app: no view for the ${next.phase} screen`);
    shownAt = now();
    if (box && typeof box.focus === 'function') box.focus({ preventScroll: true });
  };

  draw(screenOf(session.state, content));

  // The check view (#frame): the game's frame lets its canvases go while it shows.
  const scenes = {
    open() {
      if (frame) frame.release();
      frame = null;
      showScenes(doc, { park: content.park(), day: 1, art, palette, composer, sound, menu, onClose: () => scenes.close(true) });
    },
    /** @param {boolean} [clear] clear the address too (×) */
    close(clear = false) {
      if (!hideScenes(doc)) return;
      const win = doc.defaultView;
      if (clear && win && win.location.hash === SCENES_HASH) win.history.replaceState(null, '', win.location.pathname + win.location.search);
      if (screen) draw(screen);
    },
  };
  return {
    act,
    session: () => session,
    screen: () => screen,
    /** Draw the screen again (a dev control changed the hour or the font). */
    redraw: () => {
      if (screen) draw(screen);
    },
    /** The dev control's hour wins from now on, over the route's. */
    clearRouteHour: () => {
      routeHour = null;
    },
    scenes,
    menu,
    doc,
  };
}

/**
 * Add css/frame.css to the page (preview's game only). Resolves when it has
 * loaded or failed; at once where there's no <head> (Node's tests).
 * @param {Document} doc
 * @returns {Promise<void>}
 */
export function addFrameCss(doc) {
  const head = doc.head;
  if (!head) return Promise.resolve();
  return new Promise((done) => {
    const link = doc.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', FRAME_CSS.href);
    link.addEventListener('load', () => done());
    link.addEventListener('error', () => done());
    head.appendChild(link);
  });
}

/**
 * Load the frame's fonts (once frame.css declares them), waiting at most
 * FONT_WAIT_MS: a slow font never holds the game back.
 * @param {Document} doc
 * @param {Promise<void>} css addFrameCss()
 */
export function loadFrameFonts(doc, css) {
  const fonts = doc.fonts;
  const loaded = css.then(() => (fonts ? Promise.all(FRAME_FONTS.map((f) => fonts.load(f))) : null)).catch(() => null);
  return Promise.race([loaded, new Promise((done) => setTimeout(done, FONT_WAIT_MS))]);
}

/**
 * The pictures (art/art.json), or null: the frame draws ink without them.
 * @param {(url: URL) => Promise<Response>} fetchFn
 */
async function loadArt(fetchFn) {
  try {
    const res = await fetchFn(ART);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/**
 * The sound (ui/sound.js), imported now and handed the unlock; null when it
 * can't load (the game goes on with the quiet stand-in).
 * @param {Document} doc
 * @param {import('../audio/unlock.js').Unlock} unlock
 * @param {(url: URL) => Promise<Response>} fetchFn
 * @returns {Promise<import('./frame.js').Sound | null>}
 */
export function loadSound(doc, unlock, fetchFn) {
  return import('./sound.js')
    .then(({ createSound }) => createSound({ doc, unlock, fetchFn }))
    .catch((e) => {
      noteError(e instanceof Error ? e : new Error(String(e)));
      return null;
    });
}

/**
 * Start the game: load the data and the saves while the title draws in,
 * then take the page. title is showTitle()'s promise (its done settles when
 * the draw-in has finished); words is loadText()'s. The rest are for tests
 * (composer: gfx/compose.js's unless given, null for the cover's stand-in;
 * sound: the audio facade, track C's).
 * @param {Document} doc
 * @param {{title?: Promise<{stop: () => void, done: Promise<void>}>, words?: Promise<unknown>, fetchFn?: (url: URL) => Promise<Response>, store?: Store, seed?: () => string, hikerId?: () => string, now?: () => number, sound?: import('./frame.js').Sound, composer?: import('./frame.js').Composer | null}} [o]
 */
export async function startGame(doc, { title, words = Promise.resolve(), fetchFn = (u) => fetch(u), store: kept = { load, save }, seed, hikerId, now, sound, composer = COMPOSER } = {}) {
  // The unlock first, so the first tap (on the cover, too) opens the sound.
  const unlock = createUnlock({ doc, isOn: () => load('sound') !== 'off' });
  const soundP = sound ? Promise.resolve(sound) : loadSound(doc, unlock, fetchFn);
  const css = addFrameCss(doc);
  const fonts = loadFrameFonts(doc, css);
  const artP = loadArt(fetchFn);
  const rulesHash = String(doc.documentElement.getAttribute('data-rules') || '');
  const content = await loadGameData({ rulesHash, fetchFn });
  // A dev route (#stop=) plays in memory, never on the phone's saves.
  const route = routeOf(doc);
  const atStop = route && route.stop ? devSession(content, route.stop) : null;
  const store = atStop ? memoryStore() : kept;
  const { session, first } = atStop ? { session: atStop, first: false } : openSession(content, store);
  if (first && !store.save('device', toSaves(session).device)) noteError(new Error('storage: the phone refused the device save'));
  await words;
  const art = await artP;
  await fonts;
  /** @type {{stop: () => void, done: Promise<void>} | null} */
  let cover = null;
  if (title) {
    // A title that failed has opened the sheet already; the game goes on.
    cover = await title.catch(() => null);
    if (cover) await cover.done;
  }
  // The cover's canvas goes with the title (E.10: three canvases at most; iOS caps canvas memory).
  const coverCanvas = /** @type {HTMLCanvasElement | null} */ (doc.getElementById('cover'));
  const { app, host } = takePage(doc);
  if (cover) cover.stop();
  if (coverCanvas) {
    coverCanvas.width = 0;
    coverCanvas.height = 0;
  }
  /** @type {ReturnType<typeof runGame> | null} */
  let game = null;
  // The dev controls (hour, then text) and Scenes, for preview's debug menu.
  registerFrameDev({
    onHour: () => {
      if (!game) return;
      game.clearRouteHour();
      game.redraw();
    },
    openScenes: () => {
      const win = doc.defaultView;
      if (win) win.location.hash = SCENES_HASH.slice(1);
    },
  });
  initTextSize(doc, { onChange: () => game && game.redraw() });
  const theSound = (await soundP) || stubSound();
  game = runGame({ doc, app, host, content, session, store, seed, hikerId, now, art, sound: theSound, composer, hour: atStop && route ? route.hour || null : null });
  const g = game;
  // The dev routes, as the address changes: #frame opens the check view and
  // any other hash closes it; a new #stop= (or leaving one) reloads.
  const win = doc.defaultView;
  if (win && opensTrail(doc)) {
    let onStop = Boolean(atStop);
    const follow = () => {
      const r = routeOf(doc);
      if (r && r.frame) g.scenes.open();
      else g.scenes.close();
      if ((r && r.stop) || (onStop && !(r && r.frame))) {
        onStop = false;
        win.location.reload();
      }
    };
    win.addEventListener('hashchange', follow);
    if (route && route.frame) g.scenes.open();
  }
  return game;
}
