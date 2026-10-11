// The game on preview (BUILD_PLAN S3, S7, 2.2, 2.5; GAME_DESIGN 12.1, E.6,
// E.11, 8.14): first launch's lockbox (S7: the shut box as the cabin,
// ui/cabin.js; its questions on the porch, ui/lockbox.js), the guest book
// (on the porch from S7, ui/guestbook.js), the cabin and the Sol Duc
// trailhead's stops, played through the engine's step() and saved at every
// tap.
//
// main.js loads this module only when the build's <html data-screens> lists
// the home (home.js opensGame), so main's page never does. Under the title
// screen (ui/title.js, S7b; S7's loading art before it) it fetches
// data/rules.json and data/voice.json, reads the three saves and rebuilds
// the session (fromSaves). When both are ready and the tap has gone in (on
// a resume, once the cover has drawn in) the game takes the page: #app becomes
// the game view; the update note and the stamps move into the ≡ sheet's
// foot (the mailbox, ui/mailbox.js: moved, never rebuilt, so their
// listeners keep working), and the install line into the game's foot,
// which shows on the cabin only (Safari only: hidden when installed).
// From then on the session is marked (platform/resume.js), so a reload in
// it comes back past the title screen.
//
// Every tap: dispatch, then the saves in E.6's order (the device record
// first whenever it changed: each lockbox tap, S7; then the trip, then the
// hiker), then the next screen. So
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
// From S7 home is the cabin: its next step (the engine's, phases/home.js)
// starts the sample plan until S10's map table, on a tap (guarded like any
// other), with a seed the UI draws (platform/rand.js); a trip's end comes
// home to the cabin, and Plan a trip starts the next with a new seed and
// log. The cabin's live scene reads the lake's clock (platform/now.js) and
// the build's sun table and climate (rules.sun, rules.climate).
//
// From S6 a diamond's Yes plays the compass roll in the fork's own picture
// (frame.compass, ui/compass.js) before the outcome is drawn, only on that
// tap's own draw (fresh): the save written at the tap already holds the
// outcome (8.14), so a restored save shows the outcome directly. A fresh
// outcome plays its severity's cue (ui.good, ui.mishap, ui.serious). A
// death ends the hiker: the saves write the hiker as gone (null), and the
// guest book asks for a new one (S6's stand-in for S24a's sequence).
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
// #home&hour=<h>&sky=<s>&moon=<0-7> opens the cabin at that hour, sky and
// moon (each optional) in a session kept in memory, Robin signed (S7);
// #first a fresh device at the shut lockbox, #lockbox&q=<1-3> its question,
// #lockbox&ask=<question id> that question asked first (the first of the
// dev's fixed seeds that deals it first), #lockbox&open=<0|3> its closing
// (none right, or all three), and #guestbook the guest book past the
// lockbox, each in memory (S7);
// #stop=<set>.<stop>&hour=<h> opens that stop through the real engine in a
// session kept in memory (Robin, a fixed id, the sample with a fixed seed,
// Walk on until the stop; from S6, every choice in turn too, and for a
// stop only a roll reaches, the first of a fixed list of seeds that rolls
// there), never touching storage (tools/shots.mjs uses it); #frame opens
// the frame's check view (the dev action Scenes).

import { loadContent, newSession, dispatch, screenOf, toSaves, fromSaves, reportState, isEngineError } from '../engine/api.js';
import { lockboxActs } from '../engine/phases/lockbox.js';
import { makePalette } from '../gfx/palette.js';
import { compose, drawable } from '../gfx/compose.js';
import { load, save } from '../platform/storage.js';
import { markResume } from '../platform/resume.js';
import { newSeed, newHikerId } from '../platform/rand.js';
import { noteError } from './errors.js';
import { provideState, debugRequested, debugMode, opensTrail } from './debug.js';
import { renderGuestbook } from './guestbook.js';
import { createMenu } from './menu.js';
import { installMailbox, adoptFoot } from './mailbox.js';
import { renderCabin, registerHomeDev, isShutLockbox } from './cabin.js';
import { parseDevRoute, FIRST_HASH, GUESTBOOK_HASH } from './devroute.js';
import { renderLockbox } from './lockbox.js';
import { renderFrame, hourOf, savedHour, stubSound, registerFrameDev, showScenes, hideScenes, SCENES_HASH } from './frame.js';
import { restDraw } from './compass.js';
import { initTextSize } from './textsize.js';
import { createUnlock } from '../audio/unlock.js';

/** The scene composer the frame draws its pictures with (BUILD_PLAN S5). */
export const COMPOSER = Object.freeze({ compose, drawable });

/** The build's data, next to the page (U01: relative to this module). */
const DATA = new URL('../../data/', import.meta.url);
/** The pictures (the title fetched them already). */
const ART = new URL('../../art/art.json', import.meta.url);
/** The trail frame's stylesheet and the cabin's: only preview's game loads them (main's page never does). */
const FRAME_CSS = new URL('../../css/frame.css', import.meta.url);
const HOME_CSS = new URL('../../css/home.css', import.meta.url);
/** The frame's two fonts (css/frame.css), loaded before the game takes the page. */
export const FRAME_FONTS = Object.freeze(['16px "OPH Chrome"', '16px Literata']); // t-ok: CSS font specs, never shown
/** How long the game waits for them at most (ms). */
export const FONT_WAIT_MS = 1500;
/** The dev route's hiker and seed (#stop=): fixed, so a screenshot is the same every time. */
export const DEV_HIKER = Object.freeze({ name: 'Robin', id: 'h00000001', seed: 'K7QM2Q9F' }); // t-ok: the dev route's fixture hiker (the doc's own example), never on main
/** Walk on at most this many times looking for a #stop= route's stop. */
const DEV_MAX_STEPS = 64;
/** How many seeds a #stop= route tries for a stop only a roll reaches (the fatal share's 0.7% needs a few hundred). */
export const DEV_MAX_SEEDS = 2000;
/** A tap this soon after a screen is drawn is the last screen's double tap, and is dropped (ms). */
export const TAP_GUARD_MS = 300;
/** Each outcome's cue (13.2; S6): good, a mishap, and serious or worse. */
export const OUTCOME_CUES = Object.freeze({ good: 'ui.good', mishap: 'ui.mishap', serious: 'ui.serious', death: 'ui.serious' });
/** The three saves, in the order a tap writes them (E.6; 8.14: the save at the tap holds the outcome; S7: the device first, when it changed). */
export const SAVE_ORDER = Object.freeze(['device', 'trip', 'hiker']);

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
 * Write a session's saves in E.6's order: the device record first when it
 * differs from the one stored (S7: each lockbox tap; it holds the quiz),
 * then the trip, then the hiker (each only when there is one). The hiker
 * follows its trip: when the phone refuses the trip, the hiker is held back
 * too, so its latest-stop mark never runs ahead of the trip on the phone.
 * Returns the names not written.
 * @param {Session} session
 * @param {Store} [store]
 * @returns {string[]}
 */
export function writeSaves(session, store = { load, save }) {
  const records = toSaves(session);
  /** @type {string[]} */
  const refused = [];
  for (const name of SAVE_ORDER) {
    if (name === 'device') {
      if (JSON.stringify(store.load('device')) !== JSON.stringify(records.device) && !store.save('device', records.device)) refused.push(name);
      continue;
    }
    const rec = /** @type {Record<string, unknown>} */ (records)[name];
    if (!rec) {
      // A death (S6): the trip ended with no hiker, so the stored hiker goes too.
      if (name === 'hiker' && records.trip && !refused.includes('trip') && !store.save(name, null)) refused.push(name);
      continue;
    }
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
 * view. The update note and the stamps move into the ≡ sheet's foot (the
 * mailbox; with no sheet given, into the game's foot), and the install
 * line into the game's foot (moved, never rebuilt, so their listeners
 * still work).
 * @param {Document} doc
 * @param {{mount: () => {foot: HTMLElement}} | null} [menu]
 * @returns {{app: HTMLElement, host: HTMLElement}}
 */
export function takePage(doc, menu = null) {
  const app = /** @type {HTMLElement} */ (doc.getElementById('app'));
  const sheetFoot = menu ? adoptFoot(doc, menu) : null;
  const keep = ['update', 'install'].map((id) => doc.getElementById(id));
  const stampsEl = doc.getElementById('build-stamp');
  const stamps = stampsEl && /** @type {HTMLElement | null} */ (stampsEl.parentNode);
  const section = doc.createElement('section');
  section.className = 'game';
  const host = doc.createElement('div');
  host.className = 'game-screen';
  const foot = doc.createElement('footer');
  foot.className = 'game-foot';
  for (const n of [...keep, stamps]) if (n && n.parentNode !== sheetFoot) foot.appendChild(n);
  section.appendChild(host);
  section.appendChild(foot);
  while (app.firstChild) app.removeChild(app.firstChild);
  app.className = 'game-page';
  app.appendChild(section);
  return { app, host };
}

/**
 * Pure: the dev route an address asks for (preview's debug mode only):
 * ui/devroute.js parseDevRoute's (shared with the title screen, which steps
 * aside for exactly these). Null when the build lacks the trail (main), or
 * debug mode is off.
 * @param {{hash: string, debug: boolean, trail: boolean}} o
 * @returns {import('./devroute.js').DevRoute | null}
 */
export function devRoute({ hash, debug, trail }) {
  if (!debug || !trail) return null;
  return parseDevRoute(hash);
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
 * with a fixed id, the sample starts with a fixed seed, and Walk on (and
 * from S6 each choice in turn, breadth first) until the stop shows. A stop
 * only a roll reaches (an outcome) may need another seed: then the seeds
 * of a fixed list, in order (devSeed), until one rolls there. Null when
 * none reaches it.
 * @param {Content} content
 * @param {{set: string, id: string}} stop
 * @returns {Session | null}
 */
export function devSession(content, stop) {
  for (let k = 0; k < DEV_MAX_SEEDS; k++) {
    const s = devWalk(content, stop, k === 0 ? DEV_HIKER.seed : devSeed(k));
    if (s) return s;
  }
  return null;
}

/** The first-launch dev routes (S7; ui/devroute.js). */
export { FIRST_HASH, GUESTBOOK_HASH };

/**
 * A fresh device past the lockbox, through the real engine: the deal from
 * the dev seed, answer 0 to each question, Take the key (the guest book is
 * next).
 * @param {Content} content
 * @returns {Session}
 */
export function devOpened(content) {
  let s = newSession(content);
  for (const a of lockboxActs(DEV_HIKER.seed, content)) s = dispatch(s, a, content).session;
  return s;
}

/**
 * A session at the cabin, through the real engine (#home, S7): past the
 * lockbox, Robin signs with a fixed id, and the cabin shows with Plan your
 * first trip.
 * @param {Content} content
 * @returns {Session}
 */
export function devHomeSession(content) {
  return dispatch(devOpened(content), { t: 'sign', name: DEV_HIKER.name, id: DEV_HIKER.id }, content).session;
}

/**
 * A session at the lockbox, through the real engine (#lockbox, S7): the
 * deal from the dev seed, then question q (the answers before it right,
 * then wrong, so q 2 shows Welcome home. and q 3 Nice try, tourist.), or
 * the closing with none (open 0) or all three (open 3) right. With ask, the
 * first question is that one: the deal from the first of the dev's seeds
 * (DEV_HIKER.seed, then devSeed's list) that asks it first. Null when the
 * build has no quiz, or no seed asks it.
 * @param {Content} content
 * @param {{q?: number, open?: number, ask?: string}} at
 * @returns {Session | null}
 */
export function devLockboxSession(content, at) {
  const quiz = typeof content.quiz === 'function' ? content.quiz() : null;
  if (!quiz) return null;
  const deal = (/** @type {string} */ seed) => dispatch(newSession(content), { t: 'deal', seed }, content).session;
  if (at.ask) {
    for (let k = 0; k < DEV_MAX_SEEDS; k++) {
      const s = deal(k === 0 ? DEV_HIKER.seed : devSeed(k));
      if (s.state.device.quiz.dealt[0] === at.ask) return s;
    }
    return null;
  }
  let s = deal(DEV_HIKER.seed);
  const dealt = /** @type {string[]} */ (s.state.device.quiz.dealt);
  const rightOf = (/** @type {number} */ k) => {
    const q = quiz.questions.find((x) => x.id === dealt[k]);
    return q ? q.right : 0;
  };
  const wrongOf = (/** @type {number} */ k) => (rightOf(k) + 1) % 3;
  const answers = at.q ? Array.from({ length: at.q - 1 }, (_, k) => (k === 0 ? rightOf(k) : wrongOf(k))) : dealt.map((_, k) => (at.open === 3 ? rightOf(k) : wrongOf(k)));
  for (const a of answers) s = dispatch(s, { t: 'answer', a }, content).session;
  return s;
}

/**
 * The dev route's k-th fallback seed (k >= 1): Crockford base32 of k, a
 * fixed list, so a screenshot of a rolled outcome is the same every time.
 * @param {number} k
 */
export function devSeed(k) {
  const digits = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let v = k;
  let out = '';
  for (let i = 0; i < 8; i++) {
    out = digits[v % 32] + out;
    v = Math.floor(v / 32);
  }
  return `D${out.slice(1)}`;
}

/**
 * One seed's search: breadth first over Walk on and each choice, from the
 * sample's start, until the stop shows (within DEV_MAX_STEPS moves).
 * @param {Content} content
 * @param {{set: string, id: string}} stop
 * @param {string} seed
 * @returns {Session | null}
 */
function devWalk(content, stop, seed) {
  let s = devOpened(content);
  s = dispatch(s, { t: 'sign', name: DEV_HIKER.name, id: DEV_HIKER.id }, content).session;
  s = dispatch(s, { t: 'start', plan: 'sample', seed }, content).session;
  /** @type {Session[]} */
  let layer = [s];
  for (let i = 0; i < DEV_MAX_STEPS && layer.length; i++) {
    /** @type {Session[]} */
    const next = [];
    for (const at of layer) {
      const trip = at.state.trip;
      if (!trip || trip.end) continue;
      const sc = screenOf(at.state, content);
      if (sc.stop && sc.stop.set === stop.set && sc.stop.id === stop.id) return at;
      for (const c of sc.choices) {
        try {
          next.push(dispatch(at, c.act, content).session);
        } catch {
          // a choice that can't be taken here leads nowhere
        }
      }
    }
    layer = next;
  }
  return null;
}

/**
 * The session a dev route opens on, in memory, or null for none (or a
 * route this build can't show).
 * @param {Content} content
 * @param {ReturnType<typeof devRoute>} route
 * @returns {Session | null}
 */
export function devStart(content, route) {
  if (!route) return null;
  if (route.stop) return devSession(content, route.stop);
  if (route.home) return devHomeSession(content);
  if (route.first) return newSession(content);
  if (route.lockbox) return devLockboxSession(content, route.lockbox);
  if (route.guestbook) return devOpened(content);
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
 * @param {{doc: Document, app: HTMLElement, host: HTMLElement, content: Content, session: Session, store?: Store, seed?: () => string, hikerId?: () => string, now?: () => number, art?: any, sound?: import('./frame.js').Sound, composer?: import('./frame.js').Composer | null, hour?: string | null, menu?: ReturnType<typeof createMenu> | null, home?: {hour: string | null, sky: string | null, moon: number | null} | null, lakeNow?: () => import('../platform/now.js').PacificNow, later?: (f: () => void, ms: number) => () => void}} o
 *   art: art.json (null: no pictures); sound: the audio facade (the quiet
 *   stand-in until ui/sound.js); composer: gfx/compose.js's (null: the cover
 *   stands in); hour: the dev route's hour, over the dev control's; menu:
 *   the ≡ sheet (takePage moved the stamps into it; one is made when none
 *   is given); home: the #home route's override of the cabin's scene;
 *   lakeNow, later: the cabin's clock and its timer (tests)
 */
export function runGame({ doc, app, host, content, session: start, store = { load, save }, seed = newSeed, hikerId = newHikerId, now = () => performance.now(), art = null, sound = stubSound(), composer = COMPOSER, hour: routeHour = null, menu: given = null, home: routeHome = null, lakeNow, later }) {
  let session = start;
  /** @type {Screen | null} */
  let screen = null;
  let shownAt = -Infinity;
  let refusedWrite = false;
  /** @type {HTMLButtonElement[]} */
  let buttons = [];
  /** @type {(string | number)[] | null} the action that last threw, until one goes through */
  let pending = null;
  /** @type {{release: () => void, compass?: (roll: any, u: number) => Promise<void>} | null} the trail frame on screen */
  let frame = null;
  /** @type {ReturnType<typeof renderCabin> | null} the cabin on screen (the shut lockbox's too) */
  let cabin = null;
  /** @type {{release: () => void, field?: HTMLInputElement} | null} the porch on screen: the lockbox's questions, the guest book (S7) */
  let porch = null;
  /** The guest book on screen follows the lockbox this page load: first launch's (its overlay the lit lockbox beside the book). */
  let bookAfterLockbox = false;
  const palette = art && art.palette ? makePalette(art.palette) : null;
  // ≡ opens with a soft tick, inside the tap (C's ui.open).
  const menu = given || createMenu(doc, { onOpen: () => sound.play('ui.open') });
  // The mailbox: its settings rows (Sound, Text) and its foot (the stamps, moved once).
  installMailbox(doc, menu, { sound, onText: () => screen && draw(screen) });
  // The cabin's live scene reads the build's sun table and climate, and the real moon's switch (art.cabin.switches).
  const switches = art && art.cabin && art.cabin.switches ? art.cabin.switches : {};
  const homeData = { sun: content.section('sun'), climate: content.section('climate'), realMoon: switches.real_moon !== false };
  /** Suggest's pool on the guest book: the build's given names (voice.json given, term.given_*; lead call 64). */
  const givenNames = Array.isArray(content.data.voice.given) ? content.data.voice.given : [];
  /** The porch's context (ui/porch.js): the cabin's picture, clock and dev override, the sound and the mailbox. */
  const porchCtx = () => ({ art, data: homeData, sound, menu, dev: routeHome, ...(lakeNow ? { now: lakeNow } : {}), ...(later ? { later } : {}) });
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
    draw(r.screen, { fresh: true });
    return true;
  };

  /**
   * @param {Screen} next
   * @param {{fresh?: boolean, cue?: boolean}} [o] fresh: this tap's own draw
   *   (the compass rolls, and an outcome plays its cue, only then; a
   *   restored save shows the outcome directly); cue: the outcome after
   *   its compass, which plays its cue too
   */
  const draw = (next, { fresh = false, cue = false } = {}) => {
    const n = /** @type {any} */ (next);
    const trip = session.state.trip;
    if (fresh && n.roll && n.roll.kind === 'diamond' && frame && frame.compass && trip && trip.rolled) {
      // 8.8: the compass in the fork's own picture, then the outcome.
      const shown = frame;
      /** @type {(roll: any, u: number) => Promise<void>} */ (shown.compass)(n.roll, restDraw(trip)).then(() => {
        if (frame === shown) draw(next, { fresh: false, cue: true });
      });
      return;
    }
    // 13.2: an outcome's own cue, on the tap that brought it (two and three dry ticks, never a melody).
    if ((fresh || cue) && n.outcome) sound.play(/** @type {Record<string, string>} */ (OUTCOME_CUES)[n.outcome] || 'ui.serious');
    const before = screen;
    // The guest book drawn again (the mailbox's Text toggle, a dev control) keeps the name typed in it.
    const typed = before && before.phase === 'guestbook' && next.phase === 'guestbook' && porch && porch.field ? porch.field.value : '';
    if (next.phase !== 'guestbook') bookAfterLockbox = false;
    else if (before && before.phase === 'lockbox') bookAfterLockbox = true;
    screen = next;
    if (frame) frame.release();
    frame = null;
    if (cabin) cabin.release();
    cabin = null;
    if (porch) porch.release();
    porch = null;
    while (host.firstChild) host.removeChild(host.firstChild);
    host.className = 'game-screen';
    for (const a of ['data-hour', 'data-short', 'data-compass', 'data-sky', 'data-key', 'data-first', 'data-step']) host.removeAttribute(a);
    app.setAttribute('data-screen', screenName(next));
    let box;
    if (next.phase === 'guestbook') {
      // On the porch table (S7), with its label and Suggest: first launch's (no trip yet on this phone, or
      // right after the lockbox) with the lit lockbox beside the book; after a death the book alone (decision 45).
      const first = bookAfterLockbox || !session.state.trip;
      const gb = renderGuestbook(host, next, (name) => act({ t: 'sign', name, id: hikerId() }), doc.defaultView, { ctx: porchCtx(), names: givenNames, first, value: typed });
      porch = gb;
      box = gb.box;
      buttons = gb.buttons;
    } else if (next.phase === 'home' || isShutLockbox(/** @type {any} */ (next))) {
      // The cabin (S7): its next step is a tap, guarded like any other, with a
      // seed drawn here; on first launch, the shut lockbox drawn as the cabin,
      // whose Open the lockbox deals with a seed drawn here too.
      const c = renderCabin(host, /** @type {any} */ (next), {
        art,
        data: homeData,
        sound,
        menu,
        store,
        onNext: (a) => act(a.t === 'open' ? { ...a } : { ...a, seed: seed() }, { cue: 'ui.next' }),
        dev: routeHome,
        ...(lakeNow ? { now: lakeNow } : {}),
        ...(later ? { later } : {}),
      });
      cabin = c;
      box = c.focus;
      buttons = c.buttons;
    } else if (next.phase === 'lockbox') {
      // Its questions and its key, on the porch (S7).
      const l = renderLockbox(host, /** @type {any} */ (next), (a, cue) => act(a, { cue }), porchCtx());
      porch = l;
      box = l.focus;
      buttons = l.buttons;
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
        rearm: () => {
          shownAt = now();
        },
      });
      frame = f;
      box = f.focus;
      buttons = f.buttons;
    } else throw new Error(`app: no view for the ${next.phase} screen`);
    shownAt = now();
    // Focus goes to the new screen, unless the mailbox is open over it (its Text toggle redraws the screen
    // behind it: the focus stays in the sheet, on the toggle).
    if (menu.isOpen()) return;
    if (box && typeof box.focus === 'function') box.focus({ preventScroll: true });
  };

  draw(screenOf(session.state, content));

  // The check view (#frame): the game's frame (or the cabin) lets its canvases go while it shows.
  const scenes = {
    open() {
      if (frame) frame.release();
      frame = null;
      if (cabin) cabin.release();
      cabin = null;
      if (porch) porch.release();
      porch = null;
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
    /** The dev control's hour wins from now on, over the route's (the trail's and the cabin's). */
    clearRouteHour: () => {
      routeHour = null;
      routeHome = null;
    },
    /** The cabin on screen, or null (tests, the shots). */
    cabin: () => cabin,
    scenes,
    menu,
    doc,
  };
}

/**
 * Add css/frame.css and css/home.css (the cabin's, S7) to the page
 * (preview's game only). Resolves when both have loaded or failed; at once
 * where there's no <head> (Node's tests).
 * @param {Document} doc
 * @returns {Promise<void>}
 */
export function addFrameCss(doc) {
  const head = doc.head;
  if (!head) return Promise.resolve();
  const add = (/** @type {URL} */ url) =>
    new Promise((done) => {
      const link = doc.createElement('link');
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('href', url.href);
      link.addEventListener('load', () => done(undefined));
      link.addEventListener('error', () => done(undefined));
      head.appendChild(link);
    });
  return Promise.all([add(FRAME_CSS), add(HOME_CSS)]).then(() => {});
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
 * Start the game: load the data and the saves under the title screen, then
 * take the page on the tap that goes in. title is showTitleScreen()'s
 * promise (ui/title.js, S7b: its entered settles on that tap, and onEnter
 * registers the tap's cue; on a resume entered is done) or showTitle()'s
 * (its done settles when the draw-in has finished); words is loadText()'s.
 * The rest are for tests (composer: gfx/compose.js's unless given, null for
 * the cover's stand-in; sound: the audio facade, track C's).
 * @param {Document} doc
 * @param {{title?: Promise<{stop: () => void, done: Promise<void>, entered?: Promise<void>, onEnter?: (fn: () => void) => void}>, words?: Promise<unknown>, fetchFn?: (url: URL) => Promise<Response>, store?: Store, seed?: () => string, hikerId?: () => string, now?: () => number, sound?: import('./frame.js').Sound, composer?: import('./frame.js').Composer | null, lakeNow?: () => import('../platform/now.js').PacificNow, later?: (f: () => void, ms: number) => () => void}} [o]
 *   lakeNow, later: the cabin's clock and its timer (tests)
 */
export async function startGame(doc, { title, words = Promise.resolve(), fetchFn = (u) => fetch(u), store: kept = { load, save }, seed, hikerId, now, sound, composer = COMPOSER, lakeNow, later } = {}) {
  // The unlock first, so the first tap (the title screen's, too) opens the sound.
  const unlock = createUnlock({ doc, isOn: () => load('sound') !== 'off' });
  const soundP = sound ? Promise.resolve(sound) : loadSound(doc, unlock, fetchFn);
  // The title screen's tap plays Next's two dry clicks (13.2; S7b), inside
  // the tap, if the sound has loaded by then: never queued for later.
  /** @type {import('./frame.js').Sound | null} */
  let soundReady = null;
  soundP.then((s) => {
    soundReady = s;
  });
  if (title) {
    title.then(
      (c) => {
        if (c && c.onEnter) c.onEnter(() => soundReady && soundReady.play('ui.next'));
      },
      () => {},
    );
  }
  const css = addFrameCss(doc);
  const fonts = loadFrameFonts(doc, css);
  const artP = loadArt(fetchFn);
  const rulesHash = String(doc.documentElement.getAttribute('data-rules') || '');
  const content = await loadGameData({ rulesHash, fetchFn });
  // A dev route (#stop=, #home) plays in memory, never on the phone's saves.
  const route = routeOf(doc);
  const atStop = devStart(content, route);
  const store = atStop ? memoryStore() : kept;
  const { session, first } = atStop ? { session: atStop, first: false } : openSession(content, store);
  if (first && !store.save('device', toSaves(session).device)) noteError(new Error('storage: the phone refused the device save'));
  await words;
  const art = await artP;
  await fonts;
  /** @type {{stop: () => void, done: Promise<void>, entered?: Promise<void>} | null} */
  let cover = null;
  if (title) {
    // A title that failed has opened the sheet already; the game goes on.
    // The title screen hands over on the tap that goes in (S7b: entered);
    // main's title page and a resume, when the draw-in is done.
    cover = await title.catch(() => null);
    if (cover) await (cover.entered || cover.done);
  }
  // The cover's canvas goes with the title (E.10: three canvases at most; iOS caps canvas memory).
  const coverCanvas = /** @type {HTMLCanvasElement | null} */ (doc.getElementById('cover'));
  // The ≡ sheet first, so the stamps move straight into its foot; ≡ opens with a soft tick, inside the tap (C's ui.open).
  /** @type {{play: (cue: string) => void}} the sound the ≡ sheet's open plays through, once it loads */
  let soundNow = stubSound();
  const menu = createMenu(doc, { onOpen: () => soundNow.play('ui.open') });
  const { app, host } = takePage(doc, menu);
  if (cover) cover.stop();
  if (coverCanvas) {
    coverCanvas.width = 0;
    coverCanvas.height = 0;
  }
  /** @type {ReturnType<typeof runGame> | null} */
  let game = null;
  // The dev controls (hour, then text, then the cabin's sky) and Scenes, for preview's debug menu.
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
  registerHomeDev({
    onChange: () => {
      if (!game) return;
      game.clearRouteHour();
      game.redraw();
    },
  });
  const theSound = (await soundP) || stubSound();
  soundNow = theSound;
  game = runGame({ doc, app, host, content, session, store, seed, hikerId, now, art, sound: theSound, composer, hour: atStop && route ? route.hour || null : null, menu, home: route && route.home ? route.home : null, lakeNow, later });
  // The game has the page, on the phone's own saves: every reload in this session (a Restart, iOS reloading the
  // app it shut down in the background) comes back here past the title screen (Lead call 65; a dev route plays
  // in memory, so it never marks).
  if (!atStop) markResume(doc);
  const g = game;
  // The dev routes, as the address changes: #frame opens the check view and
  // any other hash closes it; a new #stop= or #home (or leaving one) reloads.
  const win = doc.defaultView;
  if (win && opensTrail(doc)) {
    let onStop = Boolean(atStop);
    const follow = () => {
      const r = routeOf(doc);
      if (r && r.frame) g.scenes.open();
      else g.scenes.close();
      if ((r && (r.stop || r.home || r.first || r.lockbox || r.guestbook)) || (onStop && !(r && r.frame))) {
        onStop = false;
        win.location.reload();
      }
    };
    win.addEventListener('hashchange', follow);
    if (route && route.frame) g.scenes.open();
  }
  return game;
}
