// Home: the cabin at Lake Quinault (GAME_DESIGN 2.2, 11.11, 12.1, 12.3;
// BUILD_PLAN S7, 11.2). The places are the menus, and everything is also a
// button. Top to bottom:
//
//   the status line   ui/status.js: the lake's time (fmt.clock_*), ≡ (the
//                     mailbox, with its flag while an update waits) and
//                     Sound:on
//   the picture       the cabin's plate (160x320) composed at the lake's
//                     hour, the date's sky and the real moon
//                     (gfx/cabin.js, platform/now.js), at whole device
//                     pixels in the frame's mat; app.name over its quiet
//                     sky; real buttons over its places' hit areas (lint
//                     P17: each at least 44 x 44 pt on every phone), and
//                     the labels: the rail's word at each place until it
//                     has been used, then a dot
//   the next step     one full-width box choice, the engine's
//                     (phases/home.js nextStep): Plan your first trip, then
//                     Plan a trip; disabled with Not open yet. when the
//                     build can't do it yet
//   the porch rail    Plan, Gear, Drive / Stories, Mailbox: every place is
//                     also a button here; the ones whose screens come later
//                     are aria-disabled, described by Not open yet. (lead
//                     call 59), and a tap shows the place's name and that line
//   the install line  Safari only, in the game's foot (ui/app.js) while
//                     the plate keeps its pixel shape with it there; else
//                     in the mailbox's foot (homeLayout's install: in
//                     Safari the SE's and the 13 mini's room under the
//                     toolbars is too short for both)
//
// A tap on the picture lands on the place whose art center is nearest
// among the hit areas holding it (placeAt; 11.2); a tap that lands on no
// place, or on a silent one (the peak, the chalkboard, the clam shovel:
// lead call 58), shows the cabin's alt text as its Look, as the trail does.
// A click with no pointer position (VoiceOver, the keyboard) goes to the
// button's own place. A long press (ui/press.js) shows the place's name in
// the Look box (lead call 57: the labels use the rail's word). The tub and
// the register post are Looks (ui/look.js). Labels are kept as `labels`
// in the channel's storage, the player's (a death keeps them).
//
// The live scene: the hour, the sky, the fog and the moon at the lake now,
// re-read when the cabin shows, when the page comes back to the
// foreground, and at the next minute (the clock) or the next change of the
// scene, whichever is first: one timer at a time, cleared when the cabin
// leaves the screen; a change redraws at once (a revisit, 11.4). The
// first show this page load draws in (800 ms; at once under Reduce
// Motion). The #home route overrides it, and so do preview's dev controls
// (hour, sky), but only in debug mode (?debug=1, or once the debug menu
// has opened): the hour key is the trail's too, and a choice left on a
// phone never pins the cabin to an hour off the lake's clock.
//
// First launch (S7 D6; decision 45; lead call 53): the engine's shut
// lockbox shows here, as the cabin: the full plate drawing itself in with
// the first-launch overlay (the key lockbox on the newel post lit by one
// lantern, the guest book open on the porch table), no labels, no rail, and
// the next step *Open the lockbox*, the shut screen's one choice (a deal the
// game completes with a seed); the lockbox's own hit area does the same.
// Its questions and the guest book are the porch's (ui/lockbox.js,
// ui/porch.js, ui/guestbook.js).
//
// This module never imports the trail's (ui/frame.js, choices.js, sheet.js,
// outcome.js, compass.js, strip.js, toolbar.js), so the cabin reaches no
// trail line when it comes to main (BUILD_PLAN S7 4.11).

import { t, tx, wordsOf } from '../text.js';
import { load, save } from '../platform/storage.js';
import { pacificNow, sceneAt } from '../platform/now.js';
import { clock } from '../fmt.js';
import { renderPic } from '../gfx/picvm.js';
import { makePalette } from '../gfx/palette.js';
import { createDisplay, startCycles, pickPixelShape } from '../gfx/display.js';
import { playDrawIn } from '../gfx/drawin.js';
import { composeCabin, cabinAlt, cabinPalette, WIDTH, HEIGHT } from '../gfx/cabin.js';
import { statusLine, watchUpdate, updateWaits, snapWidth, STATUS_PT } from './status.js';
import { openLook, closeLook } from './look.js';
import { onLongPress } from './press.js';
import { reducedMotion, onMotionChange, liveCycles } from './motion.js';
import { plainSizeOf, PLAIN_LINE, PLAIN_CHOICE_CHROME_FP } from './textsize.js';
import { pixelGlyph } from './glyph.js';
import { registerDevControl, debugMode, debugRequested } from './debug.js';

/** The cabin's status line: ≡ is the mailbox (lead call 63), and Sound:on the trail's. */
export const HOME_STATUS = Object.freeze({ menu: 'home.place.mailbox', soundOn: 'trail.status.sound_on', soundOff: 'trail.status.sound_off' });
/** The rows of the home's layout, in points (12.1; BUILD_PLAN S7 D5). */
export const NEXT_GAP_PT = 8;
export const NEXT_PT = 52;
export const RAIL_GAP_PT = 8;
export const RAIL_ROW_PT = 44;
export const RAIL_ROW_GAP_PT = 4;
export const RAIL_COLS = 3;
export const FOOT_PT = 6;
/** The column's side margins (pt), and the mat's keyline in font pixels: the trail frame's (S6, lead call 2). */
export const SIDE_PT = 32;
export const KEYLINE_FP = 1;
/** 12.1: a hit area is at least this, in points. */
export const HIT_MIN_PT = 44;
/**
 * The plate's smallest pixel, in points: the SE's 4x2 at 2x, the smallest
 * shape lint P17 holds every hit area at 44 pt in, so the plate never steps
 * under it for height (a 5x3 at 3x makes the register post 40 pt wide);
 * a room too short for it scrolls instead (home.css).
 */
export const MIN_PIXEL_PT = Object.freeze([2, 1]);
/** The chrome font: 8 font pixels a glyph on 14-pixel rows; a label's padding is one font pixel. */
export const CHROME_ADVANCE_FP = 8;
export const CHROME_ROW_FP = 14;
export const LABEL_PAD_FP = 1;
/** A used place's dot: 2 x 2 font pixels. */
export const DOT_FP = 2;
/** The places used once, kept on the phone (the player's). */
export const LABELS_KEY = 'labels';
/** The kinds that get a button (S7); on first launch only the lockbox's (FIRST_KINDS). */
export const BUTTON_KINDS = Object.freeze(['place', 'look']);
export const FIRST_KINDS = Object.freeze(['first']);
/** The places whose screens S7 opens; any other place shows its name and Not open yet. */
export const OPEN_NOW = Object.freeze(['next', 'mailbox']);
/** The dev controls' keys and choices (preview's debug menu). */
export const HOUR_KEY = 'hour';
export const SKY_KEY = 'sky';
export const DEV_HOURS = Object.freeze(['dawn', 'day', 'dusk', 'blue', 'night']);
export const DEV_SKIES = Object.freeze(['clear', 'cloudy', 'rain', 'fog']);
/** The longest the cabin waits between looks at the clock (ms): a phone asleep or a daylight-time change never leaves it long wrong. */
export const MAX_WAIT_MS = 60 * 1000;

/**
 * A font pixel in CSS px (frame.css --fp, the trail frame's): 4 device px on
 * 3x phones, 3 on 2x (11.9), 2 CSS px on a 1x screen (dev).
 * @param {number} dpr
 */
export function fontPixel(dpr) {
  if (dpr >= 3) return 4 / 3;
  if (dpr >= 2) return 1.5;
  return 2;
}

/**
 * Pure: the home's layout (BUILD_PLAN S7 D5), in the numbers home.css
 * uses: the status line, the plate in its mat and keyline at the largest
 * pixel shape that fits (pickPixelShape, picHeight 320) whose pixel is at
 * least MIN_PIXEL_PT, the next step and the rail in the thumb zone, the
 * foot, the install line under it when it shows (Safari) and the plate
 * keeps the shape it has without it (install: 'foot'; else 'mailbox', its
 * line in the mailbox's foot, or 'none'), and what is left over (spare,
 * between the picture and the next step; under zero, the home scrolls).
 * @param {{width: number, height: number, dpr: number, safeTop?: number, safeBottom?: number, usable?: number, rail?: number, install?: number, plainPx?: number | null, next?: number}} o
 *   width, height: the portrait screen (pt); usable: the room for the home
 *   and the install line when measured (else height minus the safe areas);
 *   rail: the rail's buttons; install: the install line's height under
 *   the cabin (pt, 0 when it doesn't show); plainPx: the Plain size under
 *   Larger Text (textsize.js plainSizeOf), else null; next: the next
 *   step's measured height (pt), when a label that wraps makes it taller
 */
export function homeLayout({ width, height, dpr, safeTop = 0, safeBottom = 0, usable, rail = 5, install = 0, plainPx = null, next }) {
  const fp = fontPixel(dpr);
  const room = usable === undefined ? height - safeTop - safeBottom : usable;
  const keyline = KEYLINE_FP * fp;
  const railRows = Math.max(1, Math.ceil(rail / RAIL_COLS));
  // The next step: 52 pt, or under Larger Text a Plain line and its chrome (home.css), or what it measures.
  const plain = typeof plainPx === 'number' && plainPx > 0 ? plainPx : null;
  const nextModel = plain ? Math.max(NEXT_PT, Math.ceil(PLAIN_LINE * plain + PLAIN_CHOICE_CHROME_FP * fp - 1e-6)) : NEXT_PT;
  const nextPt = typeof next === 'number' && next > nextModel ? next : nextModel;
  const rows = {
    status: STATUS_PT,
    picture: 0,
    next: NEXT_GAP_PT + nextPt,
    rail: RAIL_GAP_PT + railRows * RAIL_ROW_PT + (railRows - 1) * RAIL_ROW_GAP_PT,
    foot: FOOT_PT,
    install: 0,
  };
  const fixed = rows.status + 2 * keyline + rows.next + rows.rail + rows.foot;
  const pick = (/** @type {number} */ max) => pickPixelShape({ cssWidth: width, screenHeight: height, dpr, picWidth: WIDTH, picHeight: HEIGHT, maxCssHeight: max, minPixel: MIN_PIXEL_PT });
  // The install line stays under the cabin only while the plate keeps the shape it has without it.
  const best = pick(room - fixed);
  const bestHeight = Math.ceil((HEIGHT * best.sy) / dpr - 1e-6);
  const where = install > 0 ? (fixed + bestHeight + install <= room + 1e-9 ? 'foot' : 'mailbox') : 'none';
  rows.install = where === 'foot' ? install : 0;
  const maxCssHeight = room - fixed - rows.install;
  const shape = pick(maxCssHeight);
  const picture = {
    width: Math.ceil((WIDTH * shape.sx) / dpr - 1e-6),
    height: Math.ceil((HEIGHT * shape.sy) / dpr - 1e-6),
  };
  rows.picture = picture.height + 2 * keyline;
  const column = Math.max(picture.width + 2 * keyline, width - SIDE_PT);
  const colX = Math.max(0, Math.floor((width - column) / 2));
  const mat = Math.floor(((column - 2 * keyline - picture.width) / 2) * dpr + 1e-6) / dpr;
  const spare = room - Object.values(rows).reduce((a, b) => a + b, 0);
  return { fp, shape: { sx: shape.sx, sy: shape.sy }, picture, keyline, column, mat, x: { column: colX, picture: colX + keyline + mat }, rows, spare, maxCssHeight, install: where };
}

/**
 * Where the picture starts inside its canvas, in device pixels: the canvas
 * is a whole number of CSS px wide, and the picture is centered in it
 * (gfx/display.js layout).
 * @param {number} sx
 * @param {number} dpr
 */
export function canvasInset(sx, dpr) {
  const pw = WIDTH * sx;
  const bw = Math.round(Math.ceil(pw / dpr - 1e-6) * dpr);
  return (bw - pw) >> 1;
}

/**
 * @typedef {{kind: string, art: number[], hit: number[], label?: number[], align?: string, rail?: string, opens: string, lands: string}} Place cabin.json's
 * @typedef {{id: string, kind: string, x: number, y: number, w: number, h: number, cx: number, cy: number}} Hit a hit area in CSS px from the canvas's top left, and its art box's center
 * @typedef {{sx: number, sy: number, dpr: number, ox?: number}} Shape the display's pixel shape; ox: the picture's inset in the canvas (device px)
 */

/**
 * Pure: every place's hit area in CSS px from the canvas's top left, with
 * its art box's center, in the order cabin.json lists them.
 * @param {Record<string, Place>} places
 * @param {Shape} shape
 * @returns {Hit[]}
 */
export function cabinHits(places, { sx, sy, dpr, ox = 0 }) {
  const cx = sx / dpr;
  const cy = sy / dpr;
  const x0 = ox / dpr;
  return Object.entries(places).map(([id, p]) => ({
    id,
    kind: p.kind,
    x: x0 + p.hit[0] * cx,
    y: p.hit[1] * cy,
    w: p.hit[2] * cx,
    h: p.hit[3] * cy,
    cx: x0 + (p.art[0] + p.art[2] / 2) * cx,
    cy: (p.art[1] + p.art[3] / 2) * cy,
  }));
}

/**
 * Pure: the place a tap at (x, y) (CSS px from the canvas's top left)
 * lands on: among the hit areas holding it, the one whose art center is
 * nearest (2.2, 11.2); null for none.
 * @param {readonly Hit[]} hits
 * @param {number} x
 * @param {number} y
 * @returns {Hit | null}
 */
export function placeAt(hits, x, y) {
  /** @type {Hit | null} */
  let best = null;
  let bestD = Infinity;
  for (const h of hits) {
    if (!(x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h)) continue;
    const d = (h.cx - x) * (h.cx - x) + (h.cy - y) * (h.cy - y);
    if (d < bestD) {
      best = h;
      bestD = d;
    }
  }
  return best;
}

/**
 * Pure: a label's box in CSS px from the canvas's top left: chars glyphs of
 * the chrome font and a font pixel of padding round them, at the place's
 * label anchor (its top edge's center, or its top right corner), each edge
 * on a whole device pixel; and its dot, 2 x 2 font pixels, centered where
 * the label was.
 * @param {Place} place
 * @param {number} chars
 * @param {Shape} shape
 */
export function labelBox(place, chars, { sx, sy, dpr, ox = 0 }) {
  const fp = fontPixel(dpr);
  const w = (chars * CHROME_ADVANCE_FP + 2 * LABEL_PAD_FP) * fp;
  const h = (CHROME_ROW_FP + 2 * LABEL_PAD_FP) * fp;
  const [lx, ly] = /** @type {number[]} */ (place.label);
  const ax = ox / dpr + (lx * sx) / dpr;
  const ay = (ly * sy) / dpr;
  const snap = (/** @type {number} */ v) => Math.round(v * dpr) / dpr;
  const x = snap(place.align === 'right' ? ax - w : ax - w / 2);
  const y = snap(ay);
  const d = DOT_FP * fp;
  return { x, y, w, h, dot: { x: snap(x + w / 2 - d / 2), y: snap(y + h / 2 - d / 2), w: d, h: d } };
}

/**
 * The places a tap can land on: the buttons' kinds and the silent ones (a
 * tap there reads the alt text); on first launch (the shut lockbox) the
 * lockbox's in place of the places and Looks.
 * @param {Record<string, Place>} places
 * @param {boolean} [first]
 */
export const tappable = (places, first = false) => Object.fromEntries(Object.entries(places).filter(([, p]) => (first ? FIRST_KINDS : BUTTON_KINDS).includes(p.kind) || p.kind === 'silent'));

/** The places that get a label: the place kind, with an anchor and a rail word. */
export const labelled = (/** @type {Record<string, Place>} */ places) => Object.entries(places).filter(([, p]) => p.kind === 'place' && p.label && p.rail);

/** A place's spoken name: a place's own (home.place.<id>), a Look's button's (look.name.<id>). */
export const nameLine = (/** @type {string} */ id, /** @type {Place} */ p) => (p.kind === 'look' ? `look.name.${id}` : `home.place.${id}`);
/** A rail button's word, and the label on the picture (lead call 57). */
export const railLine = (/** @type {string} */ rail) => `home.rail.${rail}`;
/** The next step's words. */
export const nextLine = (/** @type {string} */ id) => `home.next.${id}`;

/** @typedef {{load: (name: string) => any, save: (name: string, value: unknown) => boolean}} Store */

/**
 * The places used once, as kept (a list of place ids).
 * @param {Store} [store]
 * @returns {string[]}
 */
export function usedPlaces(store = { load, save }) {
  const v = store.load(LABELS_KEY);
  return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
}

/**
 * Keep a place as used (its label turns to a dot).
 * @param {string} id
 * @param {Store} [store]
 */
export function markUsed(id, store = { load, save }) {
  const kept = usedPlaces(store);
  if (!kept.includes(id)) store.save(LABELS_KEY, [...kept, id]);
}

/**
 * Are the dev controls' kept hour and sky in force? Only in debug mode: the
 * address asks for it (?debug=1), or the debug menu has opened since the
 * page loaded. Outside it the cabin keeps the lake's clock, whatever a
 * control left on the phone.
 * @param {string | null} [search] the address's query (location.search by default)
 */
export function devOn(search = typeof location === 'undefined' ? null : location.search) {
  return debugMode() || debugRequested(search || '');
}

/** The dev control's kept hour (auto when none). */
export function devHour() {
  const v = load(HOUR_KEY);
  return DEV_HOURS.includes(v) ? v : 'auto';
}

/** The dev control's kept sky (auto when none). */
export function devSky() {
  const v = load(SKY_KEY);
  return DEV_SKIES.includes(v) ? v : 'auto';
}

/**
 * @typedef {{hour?: string | null, sky?: string | null, moon?: number | null}} SceneOverride the dev route's or controls'
 * @typedef {import('../platform/now.js').CabinScene} CabinScene
 */

/**
 * Pure: the cabin's scene now, from the lake's clock and the build's sun
 * table and climate (a build without them shows the day, clear), with the
 * dev overrides on top: an hour (dawn is the morning's, blue hour the
 * evening's), a sky (fog is a clear morning's fog) and a moon phase.
 * @param {import('../platform/now.js').PacificNow} now
 * @param {{sun: any, climate: any, cabin: any, realMoon?: boolean}} data
 * @param {SceneOverride} [dev]
 * @returns {CabinScene}
 */
export function sceneFor(now, data, dev = {}) {
  const live = data.sun && data.climate ? sceneAt(now, data) : { hour: 'day', evening: now.secs >= 43200, sky: 'clear', fog: false, moon: 0, next: 86400 };
  const s = { ...live };
  if (dev.hour && DEV_HOURS.includes(dev.hour)) {
    s.hour = dev.hour;
    s.evening = dev.hour === 'dawn' ? false : dev.hour === 'blue' ? true : live.evening;
  }
  if (dev.sky && DEV_SKIES.includes(dev.sky)) {
    s.sky = dev.sky === 'fog' ? 'clear' : dev.sky;
    s.fog = dev.sky === 'fog';
  }
  if (Number.isInteger(dev.moon) && /** @type {number} */ (dev.moon) >= 0 && /** @type {number} */ (dev.moon) <= 7) s.moon = /** @type {number} */ (dev.moon);
  return s;
}

/**
 * Register preview's dev controls for the cabin: *hour* (the trail's
 * control, with dawn; frame.js registers the same id on the trail and the
 * last one wins, with the same key and choices) and *sky*. onChange runs
 * after either changes, so the cabin redraws at once.
 * @param {{onChange?: () => void}} [o]
 */
export function registerHomeDev({ onChange } = {}) {
  registerDevControl({
    id: SKY_KEY,
    label: 'dev.sky',
    options: [
      { value: 'auto', label: 'dev.sky.auto' },
      { value: 'clear', label: 'dev.sky.clear' },
      { value: 'cloudy', label: 'dev.sky.cloudy' },
      { value: 'rain', label: 'dev.sky.rain' },
      { value: 'fog', label: 'dev.sky.fog' },
    ],
    get: devSky,
    set: (v) => {
      save(SKY_KEY, v);
      if (onChange) onChange();
    },
  });
}

/** The scenes composed this page load, by key (4.9: built once per hour x sky x state). */
const composed = new Map();
/** True once the cabin has drawn in this page load (a revisit shows at once, 11.4). */
let drawnIn = false;
/** Forget what this page load has drawn (tests). */
export function forgetCabin() {
  composed.clear();
  drawnIn = false;
}

/**
 * The cabin composed for a scene, cached by its key (the porch's window
 * too: ui/porch.js).
 * @param {any} art
 * @param {CabinScene} scene
 * @param {string[]} states
 */
export function composeFor(art, scene, states) {
  const c = composeCabin({ art, cabin: art.cabin, hour: scene.hour, evening: scene.evening, sky: scene.sky, fog: scene.fog, moon: scene.moon, state: states });
  const kept = composed.get(c.key);
  if (kept) return kept;
  composed.set(c.key, c);
  return c;
}

/**
 * @typedef {import('./status.js').Sound} Sound
 * @typedef {ReturnType<typeof import('./menu.js').createMenu>} Menu
 * @typedef {object} CabinCtx
 * @property {any} art art.json (its pics, stamps, palette and cabin), or null
 * @property {{sun: any, climate: any, realMoon?: boolean}} data the build's sun table and climate (rules.sun, rules.climate), and the real moon's switch
 * @property {Sound} sound
 * @property {Menu} menu the ≡ sheet: the mailbox
 * @property {(act: Record<string, unknown>) => void} onNext the next step's tap (the game guards it, draws a seed and dispatches)
 * @property {() => import('../platform/now.js').PacificNow} [now] the lake's clock (platform/now.js pacificNow)
 * @property {SceneOverride | null} [dev] the #home route's override (over the dev controls)
 * @property {() => boolean} [devOn] are the dev controls in force (debug mode only: devOn; tests pass their own)
 * @property {(f: () => void, ms: number) => () => void} [later] the one timer (setTimeout's; tests pass their own)
 * @property {boolean} [labels] show the labels (false until the guest book is signed on first launch)
 * @property {Store} [store] where the labels are kept (the game's: the dev routes keep them in memory)
 */

/**
 * The one timer: setTimeout, and the function that clears it (the porch's
 * clock uses it too).
 * @param {() => void} f
 * @param {number} ms
 */
export function timeout(f, ms) {
  const h = setTimeout(f, ms);
  // Where the runtime can (Node's tests), the cabin's clock never keeps it alive.
  const node = /** @type {any} */ (h);
  if (node && typeof node.unref === 'function') node.unref();
  return () => clearTimeout(h);
}

/**
 * The cabin's scene now, from a context's clock and data, with the #home
 * route's override or else, in debug mode only (devOn), the dev controls'
 * (the porch shows the same scene: ui/porch.js).
 * @param {{now?: () => import('../platform/now.js').PacificNow, data: {sun: any, climate: any, realMoon?: boolean}, dev?: SceneOverride | null, devOn?: () => boolean}} ctx
 *   devOn: are the dev controls in force (devOn's by default; tests pass their own)
 * @param {any} cabin cabin.json (art.json's cabin), or null
 * @returns {CabinScene}
 */
export function sceneOfCtx(ctx, cabin) {
  const now = ctx.now || (() => pacificNow());
  const on = ctx.devOn ? ctx.devOn() : devOn();
  const dev = ctx.dev || (on ? { hour: devHour(), sky: devSky() } : {});
  return sceneFor(now(), { sun: ctx.data.sun, climate: ctx.data.climate, cabin: cabin || {}, realMoon: ctx.data.realMoon !== false }, dev);
}

/** Is this screen the engine's shut lockbox (first launch, drawn as the cabin)? */
export const isShutLockbox = (/** @type {{phase: string, step?: string}} */ screen) => screen.phase === 'lockbox' && screen.step === 'shut';

/**
 * Draw the cabin into host (the game screen). Returns what the game needs:
 * the buttons (the double-tap guard disables them on a tap), the element to
 * focus, the place buttons, the rail and the next step (tests), redraw()
 * after a dev control changes, and release() before the next screen.
 * @param {HTMLElement} host div.game-screen
 * @param {{phase: string, step?: string, next?: {id: string, act: Record<string, unknown> | null} | null, choices?: {act: Record<string, unknown>, label: {id: string} | null}[]}} screen
 *   home's screen, or the shut lockbox's (first launch)
 * @param {CabinCtx} ctx
 */
export function renderCabin(host, screen, ctx) {
  const doc = host.ownerDocument;
  const win = /** @type {(Window & typeof globalThis) | null} */ (doc.defaultView || null);
  const art = ctx.art && ctx.art.cabin && ctx.art.pics && ctx.art.pics[ctx.art.cabin.plate] ? ctx.art : null;
  const cabin = art ? art.cabin : null;
  const places = /** @type {Record<string, Place>} */ (cabin ? cabin.places : {});
  const now = ctx.now || (() => pacificNow());
  const later = ctx.later || timeout;
  const first = isShutLockbox(screen);
  // First launch shows no labels until the guest book is signed (2.2 step 4), and no rail.
  const showLabels = ctx.labels !== false && !first;
  const kinds = first ? FIRST_KINDS : BUTTON_KINDS;
  const store = ctx.store || { load, save };
  host.classList.add('cabin');
  if (first) host.setAttribute('data-first', '');
  /** @type {(() => void)[]} */
  const stops = [];
  /** @type {HTMLButtonElement[]} */
  const buttons = [];

  // The status line: the lake's time, ≡ (the mailbox), Sound:on.
  const openMailbox = () => {
    ctx.menu.setRows([]);
    ctx.menu.open({ label: HOME_STATUS.menu });
  };
  const status = statusLine(doc, { sound: ctx.sound, onMenu: openMailbox, lines: HOME_STATUS });
  host.appendChild(status.header);
  stops.push(status.release);

  // The picture: its canvas (hidden from VoiceOver), the name over its sky,
  // its alt text, the place buttons and the labels.
  const figure = doc.createElement('figure');
  figure.className = 'cabin-picture';
  const canvas = /** @type {HTMLCanvasElement} */ (doc.createElement('canvas'));
  canvas.className = 'picture';
  canvas.setAttribute('aria-hidden', 'true');
  figure.appendChild(canvas);
  const name = doc.createElement('p');
  name.className = 'cabin-name';
  name.setAttribute('aria-hidden', 'true');
  tx(name, 'app.name');
  figure.appendChild(name);
  const img = doc.createElement('div');
  img.classList.add('vh', 'cabin-alt');
  img.setAttribute('role', 'img');
  figure.appendChild(img);
  const layer = doc.createElement('div');
  layer.className = 'cabin-places';
  figure.appendChild(layer);
  const tags = doc.createElement('div');
  tags.className = 'cabin-labels';
  tags.setAttribute('aria-hidden', 'true');
  figure.appendChild(tags);
  host.appendChild(figure);

  /** @type {{id: string, kind: string}[]} */
  let altRefs = [];
  const alt = () => altRefs.map((r) => ({ id: r.id }));
  const showAlt = () => openLook(figure, alt(), { sound: ctx.sound, flow: true });

  // The places: the rail's word on each until used, then a dot.
  /** @type {Map<string, HTMLElement>} */
  const labelEls = new Map();
  const used = new Set(usedPlaces(store));
  if (showLabels) {
    for (const [id, p] of labelled(places)) {
      const el = doc.createElement('span');
      el.className = 'cabin-label';
      el.setAttribute('data-place', id);
      if (used.has(id)) el.setAttribute('data-used', '');
      const tag = doc.createElement('span');
      tag.className = 'label-tag';
      tx(tag, railLine(/** @type {string} */ (p.rail))); // t-ids: home.rail.plan, home.rail.gear, home.rail.drive, home.rail.stories, home.rail.mailbox
      const dot = doc.createElement('span');
      dot.className = 'label-dot';
      el.appendChild(tag);
      el.appendChild(dot);
      tags.appendChild(el);
      labelEls.set(id, el);
    }
  }
  /** @param {string} id */
  const use = (id) => {
    markUsed(id, store);
    used.add(id);
    const el = labelEls.get(id);
    if (el) el.setAttribute('data-used', '');
  };

  // Not open yet (lead call 59): the place's name and the line, in the Look box.
  /** @param {string} id @param {HTMLElement | null} opener */
  const soon = (id, opener) => openLook(figure, [{ id: nameLine(id, places[id]) }, { id: 'home.soon' }], { opener, sound: ctx.sound }); // t-ids: home.place.door, home.place.shed, home.place.car, home.place.fire_bowl, home.place.mailbox
  // The next step: home's (the engine's nextStep), or the shut lockbox's one choice, Open the lockbox.
  const shut = first && screen.choices && screen.choices.length ? screen.choices[0] : null;
  const next = shut ? { id: '', act: shut.act, label: shut.label ? shut.label.id : 'first.lockbox.start' } : screen.next ? { ...screen.next, label: nextLine(screen.next.id) } : null;
  const canGo = Boolean(next && next.act);
  const goNext = () => {
    if (next && next.act) ctx.onNext(next.act);
  };
  /**
   * A place's own action.
   * @param {string} id
   * @param {HTMLElement | null} opener
   */
  const act = (id, opener) => {
    const p = places[id];
    if (!p || p.kind === 'silent') {
      showAlt();
      return;
    }
    if (p.kind === 'look') {
      openLook(figure, [{ id: `look.${id}` }], { opener, sound: ctx.sound }); // t-ids: look.tub, look.register_post
      return;
    }
    if (p.kind === 'first') {
      // The lockbox (first launch only): Open the lockbox, as the next step does.
      if (first && canGo) goNext();
      else showAlt();
      return;
    }
    use(id);
    if (p.opens === 'next' && canGo) goNext();
    else if (p.opens === 'mailbox') openMailbox();
    else soon(id, opener);
  };

  /** @type {Hit[]} the hit areas, once the display has its pixel shape */
  let hits = [];
  /** @type {Map<string, HTMLButtonElement>} */
  const placeButtons = new Map();
  for (const [id, p] of Object.entries(places)) {
    if (!kinds.includes(p.kind)) continue;
    const b = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
    b.className = 'cabin-place';
    b.setAttribute('type', 'button');
    b.setAttribute('data-place', id);
    // The lockbox's button is named by what it does, Open the lockbox (it has no name of its own in B002).
    const line = p.kind === 'first' ? (next ? next.label : 'first.lockbox.start') : nameLine(id, p);
    b.setAttribute('aria-label', t(line)); // t-ids: home.place.door, home.place.shed, home.place.car, home.place.fire_bowl, home.place.mailbox, look.name.tub, look.name.register_post, first.lockbox.start
    b.setAttribute('data-t-aria', line); // the line inspector finds a spoken name by it
    if (p.kind === 'place' && !OPEN_NOW.includes(p.opens)) b.setAttribute('aria-describedby', 'home-soon');
    b.addEventListener('click', (/** @type {any} */ event) => {
      if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
      // With the pointer's position, the nearest art center wins; without one (VoiceOver, the keyboard), this button's own place.
      const at = pointIn(layer, event);
      const hit = at && hits.length ? placeAt(hits, at.x, at.y) : null;
      act(hit ? hit.id : id, b);
    });
    layer.appendChild(b);
    placeButtons.set(id, b);
    buttons.push(b);
  }
  // A tap on the picture off every button: the alt text, as its Look.
  figure.addEventListener('click', () => {
    if (altRefs.length) showAlt();
  });
  // A long press on a place: its name (lead call 57).
  stops.push(
    onLongPress(doc, {
      find: (/** @type {any} */ target) => {
        if (doc.documentElement.hasAttribute('data-inspect')) return null;
        for (let at = target; at && at !== host; at = at.parentNode) {
          if (at.getAttribute && at.classList && at.classList.contains('cabin-place')) return { id: at.getAttribute('data-place'), el: at };
        }
        return null;
      },
      run: (/** @type {{id: string, el: HTMLElement}} */ hit) => openLook(figure, [{ id: places[hit.id].kind === 'first' ? 'first.lockbox.start' : nameLine(hit.id, places[hit.id]) }], { opener: hit.el, sound: ctx.sound }), // t-ids: home.place.door, home.place.shed, home.place.car, home.place.fire_bowl, home.place.mailbox, look.name.tub, look.name.register_post, first.lockbox.start
    }),
  );

  // The next step: one box choice, the trail's style, with its › glyph.
  // Not open yet. is a description only (aria-describedby reads a hidden
  // node's words), never a swipe stop of its own in the reading order.
  const soonNote = doc.createElement('span');
  soonNote.id = 'home-soon';
  soonNote.hidden = true;
  tx(soonNote, 'home.soon');
  const nextWrap = doc.createElement('div');
  nextWrap.className = 'cabin-next';
  /** @type {HTMLButtonElement | null} */
  let nextButton = null;
  if (next) {
    const b = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
    b.classList.add('box', 'choice', 'next-step');
    b.setAttribute('type', 'button');
    const label = doc.createElement('span');
    label.className = 'choice-label';
    tx(label, next.label); // t-ids: home.next.plan_first, home.next.plan, first.lockbox.start
    b.appendChild(label);
    b.appendChild(pixelGlyph(doc, 4, 7, CHEVRON_RECTS, 'next-glyph'));
    if (canGo) b.addEventListener('click', goNext);
    else {
      b.disabled = true;
      b.setAttribute('aria-describedby', 'home-soon');
    }
    nextWrap.appendChild(b);
    nextButton = b;
    buttons.push(b);
  }
  nextWrap.appendChild(soonNote);
  host.appendChild(nextWrap);

  // The porch rail: every place is also a button.
  const rail = doc.createElement('nav');
  rail.className = 'cabin-rail';
  /** @type {Map<string, HTMLButtonElement>} */
  const railButtons = new Map();
  for (const r of /** @type {string[]} */ (cabin && !first ? cabin.rail : [])) {
    const entry = Object.entries(places).find(([, p]) => p.rail === r);
    if (!entry) continue;
    const [id, p] = entry;
    const b = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
    b.className = 'rail-item';
    b.setAttribute('type', 'button');
    b.setAttribute('data-rail', r);
    tx(b, railLine(r)); // t-ids: home.rail.plan, home.rail.gear, home.rail.drive, home.rail.stories, home.rail.mailbox
    const open = (p.opens === 'next' && canGo) || p.opens === 'mailbox';
    if (!open) {
      b.setAttribute('aria-disabled', 'true');
      b.setAttribute('aria-describedby', 'home-soon');
    }
    b.addEventListener('click', () => act(id, b));
    rail.appendChild(b);
    railButtons.set(r, b);
    buttons.push(b);
  }
  if (!first) host.appendChild(rail);
  // ≡ and the rail's Mailbox carry the flag while an update waits (E.7).
  const flagged = [status.menu];
  const mailRail = railButtons.get('mailbox');
  if (mailRail) flagged.push(mailRail);
  stops.push(watchUpdate(doc, flagged));

  // The picture's pixels, and the live scene: only where there's a canvas (not in Node's tests).
  /** @type {ReturnType<typeof createDisplay> | null} */
  let display = null;
  let stopCycles = () => {};
  /** @type {{finish: () => void, readonly done: boolean} | null} */
  let run = null;
  /** @type {string | null} */
  let shownKey = null;
  /** @type {CabinScene | null} */
  let scene = null;
  const palette = art ? cabinPalette(makePalette(art.palette), art.cabin) : null;
  const canDraw = Boolean(win && art && palette && typeof canvas.getContext === 'function');

  /** The scene now, with the dev route's or the dev controls' override. */
  const sceneNow = () => sceneOfCtx({ ...ctx, now }, cabin);
  // First launch lights the lockbox and opens the guest book; an update raises the mailbox's flag.
  const states = () => [...(first ? ['first'] : []), ...(updateWaits(doc) ? ['flag_up'] : [])];

  /**
   * Show the scene: the clock, the alt text and (where it can) the picture.
   * @param {boolean} first the cabin's first show this page load draws in
   */
  const paint = (first) => {
    const p = now();
    const ref = clock(p.secs - (p.secs % 60));
    tx(status.left, ref.id, ref.vars); // t-ids: fmt.clock_am, fmt.clock_pm
    if (!cabin) return;
    scene = sceneNow();
    const c = art ? composeFor(art, scene, states()) : null;
    altRefs = cabinAlt({ hour: scene.hour, sky: scene.sky, fog: scene.fog, moonShown: Boolean(c && c.moon) }).map((id) => ({ id, kind: 'alt' }));
    img.setAttribute('aria-label', altRefs.map((r) => t(r.id)).join(' ')); // t-ids: alt.scene.cabin, alt.sky.cloudy, alt.sky.rain, alt.sky.fog, alt.cabin.lit, alt.cabin.moon, alt.hour.dawn, alt.hour.dusk, alt.hour.blue, alt.hour.night, alt.hour.blue_clouded, alt.hour.night_clouded
    img.setAttribute('data-t-aria', 'alt.scene.cabin'); // the line inspector finds a spoken name by it
    img.setAttribute('data-t-alt', altRefs.map((r) => r.id).join(' '));
    host.setAttribute('data-hour', scene.hour);
    host.setAttribute('data-sky', scene.fog ? 'fog' : scene.sky);
    if (!c || !canDraw || !display || !palette) return;
    if (c.key === shownKey) return;
    shownKey = c.key;
    host.setAttribute('data-key', c.key);
    if (run) run.finish();
    stopCycles();
    const reduced = reducedMotion();
    const drawIn = first && !drawnIn && !reduced;
    drawnIn = true;
    const result = renderPic(c.ops, { width: c.width, height: c.height, stamps: art.stamps, record: drawIn });
    const shown = display;
    run = playDrawIn({
      result,
      palette,
      display: shown,
      remap: c.table,
      reduced: !drawIn,
      onDone(final) {
        // The stars twinkle, the windows and the embers flicker, the smoke
        // drifts, unless Reduce Motion is on (11.5), live (ui/motion.js).
        stopCycles = liveCycles(() => startCycles(shown, final, c.width, palette, { remap: c.table }));
      },
    });
  };

  // One timer at a time: the next minute (the clock) or the scene's next change, whichever is first.
  let clear = () => {};
  const schedule = () => {
    clear();
    const p = now();
    const toMinute = 60 - (p.secs % 60);
    const toScene = scene ? Math.max(1, scene.next - p.secs) : toMinute;
    const ms = Math.min(MAX_WAIT_MS, Math.min(toMinute, toScene) * 1000 + 50);
    clear = later(tick, ms);
  };
  const tick = () => {
    paint(false);
    schedule();
  };

  if (win && canDraw) {
    display = createDisplay(canvas, WIDTH, HEIGHT);
    const relayout = () => {
      const l = measureHome(host, win, cabin ? cabin.rail.length : 5, { menu: ctx.menu, next: nextButton });
      if (!l || !display) return;
      snapWidth(status.sound);
      display.layout({ cssWidth: win.innerWidth, screenHeight: screenHeight(win), maxCssHeight: l.maxCssHeight, minPixel: MIN_PIXEL_PT });
      display.snap();
      const dpr = win.devicePixelRatio || 1;
      const shape = { ...display.shape, dpr, ox: canvasInset(display.shape.sx, dpr) };
      // A picture pixel's height and width (home.css: the name's band, rows 2 to 28).
      host.style.setProperty('--row', `${shape.sy / dpr}px`);
      host.style.setProperty('--px', `${shape.sx / dpr}px`);
      hits = cabinHits(tappable(places, first), shape);
      placeButtonsAt(placeButtons, hits);
      for (const [id, el] of labelEls) placeLabel(el, labelBox(places[id], labelChars(railLine(/** @type {string} */ (places[id].rail))), shape));
    };
    relayout();
    win.addEventListener('resize', relayout);
    win.addEventListener('orientationchange', relayout);
    // A wrapped next step under Larger Text measures its words once the fonts are in.
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => display && relayout());
    stops.push(() => {
      win.removeEventListener('resize', relayout);
      win.removeEventListener('orientationchange', relayout);
      // The install line goes back under the game's screen, where only the cabin shows it.
      placeInstall(doc, host, ctx.menu, 'foot');
    });
    // Reduce Motion turned on mid-draw: the picture shows finished.
    stops.push(onMotionChange((on) => on && run && run.finish()));
    // The first tap on the picture while it draws in only finishes the draw-in.
    const firstTap = (/** @type {Event} */ event) => {
      if (!run || run.done) return;
      event.preventDefault();
      event.stopPropagation();
      run.finish();
    };
    figure.addEventListener('click', firstTap, true);
  }
  paint(true);
  schedule();
  // Back in the foreground: the clock, the hour and the sky may have moved.
  const onVisible = () => {
    if (doc.visibilityState === 'visible') tick();
  };
  doc.addEventListener('visibilitychange', onVisible);
  // An update waits: the mailbox's flag goes up on the plate.
  const onUpdate = () => {
    shownKey = null;
    paint(false);
  };
  if (win) win.addEventListener('oph:update', onUpdate);
  stops.push(() => {
    clear();
    doc.removeEventListener('visibilitychange', onVisible);
    if (win) win.removeEventListener('oph:update', onUpdate);
  });

  return {
    buttons,
    /** What takes focus on the cabin: the next step, else the picture's description. */
    focus: nextButton || img,
    figure,
    places: placeButtons,
    rail: railButtons,
    next: nextButton,
    labels: labelEls,
    /** The scene shown now (tests, the shots). */
    scene: () => scene,
    /** The composed key shown, or null (no canvas). */
    key: () => shownKey,
    /** The alt parts' ids. */
    alt: () => altRefs.map((r) => r.id),
    /** The states composed on the plate now: first launch's, an update's flag (tests). */
    states: () => states(),
    /** Tap a place by id, as its button does without a position (tests). */
    tap: (/** @type {string} */ id) => act(id, placeButtons.get(id) || null),
    /** Look at the clock again, and draw what changed (a dev control, the tests). */
    redraw: () => {
      shownKey = null;
      tick();
    },
    release() {
      closeLook(figure);
      if (run) run.finish();
      stopCycles();
      for (const s of stops) s();
      if (display) display.release();
      // Gone with the screen: the fonts.ready above (and relayout, paint) test it, so a released cabin is never laid out again.
      display = null;
    },
  };
}

/** The next step's › on a 4 x 7 grid. */
const CHEVRON_RECTS = Object.freeze([
  [0, 0, 1, 1],
  [1, 1, 1, 1],
  [2, 2, 1, 1],
  [3, 3, 1, 1],
  [2, 4, 1, 1],
  [1, 5, 1, 1],
  [0, 6, 1, 1],
]);

/**
 * A pointer's position in CSS px from an element's top left, or null when
 * the click carries none (VoiceOver's activation, the keyboard: detail 0)
 * or the element can't say where it is.
 * @param {HTMLElement} el
 * @param {any} event
 * @returns {{x: number, y: number} | null}
 */
export function pointIn(el, event) {
  if (!event || event.detail === 0 || typeof event.clientX !== 'number' || typeof event.clientY !== 'number') return null;
  if (typeof el.getBoundingClientRect !== 'function') return null;
  const r = el.getBoundingClientRect();
  return { x: event.clientX - r.left, y: event.clientY - r.top };
}

/**
 * The glyphs a label shows: its words' length (an id's own when the words
 * aren't loaded).
 * @param {string} id
 */
export function labelChars(id) {
  const w = wordsOf(id);
  return typeof w === 'string' ? Array.from(w).length : id.length;
}

/**
 * Put each place's button over its hit area.
 * @param {Map<string, HTMLButtonElement>} buttons
 * @param {readonly Hit[]} hits
 */
function placeButtonsAt(buttons, hits) {
  for (const h of hits) {
    const b = buttons.get(h.id);
    if (!b) continue;
    b.style.setProperty('left', `${h.x}px`);
    b.style.setProperty('top', `${h.y}px`);
    b.style.setProperty('width', `${h.w}px`);
    b.style.setProperty('height', `${h.h}px`);
  }
}

/**
 * Put a label (and its dot) at its box.
 * @param {HTMLElement} el
 * @param {ReturnType<typeof labelBox>} box
 */
function placeLabel(el, box) {
  el.style.setProperty('--lx', `${box.x}px`);
  el.style.setProperty('--ly', `${box.y}px`);
  el.style.setProperty('--lw', `${box.w}px`);
  el.style.setProperty('--dx', `${box.dot.x - box.x}px`);
  el.style.setProperty('--dy', `${box.dot.y - box.y}px`);
}

/** @param {Window} win */
function screenHeight(win) {
  const s = win.screen;
  return s ? Math.max(s.width, s.height) : win.innerHeight;
}

/**
 * The install line (#install: Safari only, until the game is on the Home
 * Screen) into the game's foot, under the cabin, or into the mailbox's
 * foot, before the stamps (the same node, moved). Returns the game's foot.
 * @param {Document} doc
 * @param {HTMLElement} host
 * @param {Menu | null | undefined} menu
 * @param {'foot' | 'mailbox'} where
 * @returns {HTMLElement | null}
 */
export function placeInstall(doc, host, menu, where) {
  const install = doc.getElementById('install');
  const section = /** @type {HTMLElement | null} */ (host.parentNode);
  const foot = section && typeof section.querySelector === 'function' ? /** @type {HTMLElement | null} */ (section.querySelector('.game-foot')) : null;
  if (!install) return foot;
  if (where === 'foot') {
    if (foot && install.parentNode !== foot) foot.insertBefore(install, foot.firstChild);
    return foot;
  }
  const mail = menu && typeof menu.mount === 'function' ? menu.mount().foot : null;
  if (!mail || install.parentNode === mail) return foot;
  const stamp = doc.getElementById('build-stamp');
  const stamps = stamp && stamp.parentNode && stamp.parentNode.parentNode === mail ? stamp.parentNode : null;
  if (stamps) mail.insertBefore(install, stamps);
  else mail.appendChild(install);
  return foot;
}

/**
 * The home's layout on this screen, with its CSS numbers set on host:
 * --col, --col-x, --pic-x and --mat (the trail frame's names), and the
 * install line where homeLayout puts it: measured in the game's foot under
 * the cabin, it stays there while the plate keeps its shape, else it goes
 * to the mailbox (frame.css hides the empty foot). Null without a window.
 * @param {HTMLElement} host
 * @param {(Window & typeof globalThis) | null} win
 * @param {number} rail
 * @param {{menu?: Menu | null, next?: HTMLElement | null}} [o] the mailbox, and the next step (its height when its words wrap)
 */
function measureHome(host, win, rail, { menu = null, next = null } = {}) {
  if (!win) return null;
  const doc = host.ownerDocument;
  const install = doc.getElementById('install');
  // Measure the install line where it would show: under the cabin.
  const foot = placeInstall(doc, host, menu, 'foot');
  const shows = Boolean(install && !install.hidden && foot && install.parentNode === foot);
  const footPt = shows && foot && typeof foot.getBoundingClientRect === 'function' ? foot.getBoundingClientRect().height : 0;
  const nextPt = next && typeof next.getBoundingClientRect === 'function' ? next.getBoundingClientRect().height : 0;
  const l = homeLayout({
    width: win.innerWidth,
    height: screenHeight(win),
    dpr: win.devicePixelRatio || 1,
    usable: (host.clientHeight || win.innerHeight) + footPt,
    rail,
    install: footPt,
    plainPx: plainSizeOf(doc, win),
    ...(nextPt > 0 ? { next: nextPt } : {}),
  });
  if (l.install === 'mailbox') placeInstall(doc, host, menu, 'mailbox');
  host.style.setProperty('--col', `${l.column}px`);
  host.style.setProperty('--col-x', `${l.x.column}px`);
  host.style.setProperty('--pic-x', `${l.x.picture}px`);
  host.style.setProperty('--mat', `${l.mat}px`);
  return l;
}
