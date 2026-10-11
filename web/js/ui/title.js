// The title screen (GAME_DESIGN 12.3; BUILD_PLAN S7b; decisions 73 and 74;
// Lead calls 65 to 68). Preview only: main.js imports it, beside the game,
// on a build whose <html data-screens> lists the home, so main's page never
// does (its title page is ui/home.js's alone until the cabin's promotion).
//
// Every fresh launch: the High Divide draws itself in (ui/home.js
// showTitle, with the cover's stars left out round the name and the label,
// quietOps), the name steps in, then *Mount Olympus* in small glacier-blue
// chrome type over the summit with a hairline down to its spire (the
// game's white whale, named: decision 73), then the prompt under the
// picture. It stays until a tap anywhere inside #app (or the prompt, a
// button: VoiceOver's double tap, Enter, Space) at least TAP_GUARD_MS
// after the prompt showed; one tap, one start (`entered`). Taps on the
// update note and the stamps never go in (the build code's five taps open
// the debug menu), and a tap while it draws in only hurries it. The game
// (ui/app.js) loads underneath and takes the page on `entered`.
//
// A resume skips it: any reload in a session the game has already had the
// page in (platform/resume.js: a Restart pressed inside the game, or iOS
// reloading the app after shutting it down in the background), or a
// preview dev route in debug mode (skipsTitle), draws the cover in under
// the name and hands over when it's done, as S7's loading art did. Nothing
// here listens for visibilitychange or pageshow: coming back from the
// background leaves you where you were, and once the game has the page
// the title's nodes are gone.
//
// titleMarks, quietOps and skipsTitle are pure (Node tests them). The rest
// reads the page's clock through performance.now() for the tap guard only.

import { showTitle } from './home.js';
import { reducedMotion } from './motion.js';
import { debugRequested, debugMode } from './debug.js';
import { parseDevRoute } from './devroute.js';
import { resuming } from '../platform/resume.js';
import { tx } from '../text.js';

/** The title screen's stylesheet: only preview's title screen loads it. */
const TITLE_CSS = new URL('../../css/title.css', import.meta.url);
/** The steps, as #app[data-title] shows them. */
export const STEPS = Object.freeze(['drawing', 'name', 'label', 'ready', 'entered']);
/** The name's step-in after the draw-in (game.css: 480 ms in four steps, S1's). */
export const NAME_MS = 480;
/** The label's step-in (title.css: 480 ms in four steps). */
export const LABEL_MS = 480;
/** The prompt's step-in (title.css: 240 ms in two steps), before it pulses. */
export const PROMPT_MS = 240;
/** A tap this soon after the prompt shows is the hurry tap's own click, and is dropped (ms; ui/app.js's TAP_GUARD_MS). */
export const TAP_GUARD_MS = 300;
/** How long the label and the prompt wait for the chrome font at most (ms; ui/app.js's FONT_WAIT_MS). */
export const FONT_WAIT_MS = 1500;
/** The chrome font, as the label and the prompt set it (css/title.css). */
export const TITLE_FONT = '12px "OPH Chrome"'; // t-ok: a CSS font spec, never shown
/** The label's chrome cell: 8 font pixels a character, 14 a line (tools/fontbuild.mjs). */
export const LABEL_ADVANCE_FP = 8;
export const LABEL_ROW_FP = 14;
/** The label's characters (Mount Olympus): its width is fixed, so the place is worked out before the words arrive. */
export const LABEL_CHARS = 13;
/** No star within this much (pt) of the label's line, either side (content/art/title.json label_line): a character cell and a half, so none reads as its punctuation. */
export const LABEL_SIDE_PT = 12;
/** The label keeps at least this much sky (pt) under the name's line box, or hides. */
export const NAME_CLEAR_PT = 6;
/**
 * The leader's length (pt) where the sky has room: the label rises off the
 * haze until its tick is this long (the art critic's 10 to 12 pt), so the
 * words read as a note flown from the summit, not a third line of the title.
 */
export const TICK_PT = 11;
/**
 * The label rises only while its top stays this far (pt) under the name's
 * line box: Hiker's ink ends 6.6 to 10 pt above that box on the four phones
 * (measured in Chromium, BUILD_LOG S7b), so 9 keeps 15 pt or more of sky
 * between the label and Hiker's ink. Where it can't rise (the SE), it rests
 * on the haze.
 */
export const NAME_LIFT_PT = 9;
/** The cover's quiet sky for the name (ui/home.js TITLE_ROWS), and game.css's title block (its unit, and its height in units). */
export const TITLE_ROWS = 88;
export const TITLE_UNIT_ROOMS = 3.3;
export const TITLE_BLOCK_U = 0.062 + 0.006 + 0.145 * 0.95;
/** The cover's size in picture pixels. */
const PIC_WIDTH = 160;
const PIC_HEIGHT = 320;
/** The SVG namespace, for the tick's layer. */
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * @typedef {{cover: string, label: {name: string, summit: number[], floor: number}, quiet: {for: string, box: number[]}[]}} TitleData art.json's title (content/art/title.json)
 * @typedef {{x: number, y: number, w: number, h: number}} Rect device pixels from the canvas's top left
 * @typedef {{show: boolean, fp: number, tick: Rect, core: Rect, label: Rect, summit: Rect, nameBottom: number, gap: number}} Marks
 */

/**
 * Pure: where the name's line box ends (pt from the plate's top), as
 * game.css sets the title: a unit of min(plate width, 3.3 x the title
 * room), a block 0.062u + 0.006u + 0.145u x 0.95 tall, centered in the
 * cover's top 88 rows.
 * @param {{sx: number, sy: number, dpr: number}} shape
 */
export function nameBottom({ sx, sy, dpr }) {
  const room = (TITLE_ROWS * sy) / dpr;
  const u = Math.min((PIC_WIDTH * sx) / dpr, TITLE_UNIT_ROOMS * room);
  return (room + TITLE_BLOCK_U * u) / 2;
}

/**
 * Pure: the label and its tick (Lead call 67; the art critic's S7b pass), in
 * device pixels from the canvas's top left. The label's font pixel is one
 * CSS px (dpr device px). The tick is one font pixel wide inside the
 * summit's column, centered to the nearest device pixel, from one font
 * pixel under the label down to the top edge of the summit pixel; its last
 * font pixel is a foot of ink three font pixels wide (core: the glacier-blue
 * part above it), so the line and the spire read as two things. The label
 * (13 characters of 8 font pixels, 14 tall) flies from the tick like a
 * flag: its first cell starts on the tick's column, so the tick stands
 * under the M's first column (the chrome font's M has no left bearing) and
 * the casing is flush with the label's halo. It sits one font pixel above
 * the haze's first row at the lowest (its descenders' halo clear of the
 * dither), and rises until the tick is TICK_PT long while its top stays
 * NAME_LIFT_PT under the name's line box; tops land on whole CSS px. show is
 * false when a picture row is under 1 pt (a squeezed plate) or the label
 * would come within NAME_CLEAR_PT of the name's line box.
 * @param {{sx: number, sy: number, dpr: number}} shape
 * @param {{ox: number}} origin where the picture starts in the canvas (display.origin)
 * @param {TitleData} title
 * @returns {Marks}
 */
export function titleMarks({ sx, sy, dpr }, { ox }, title) {
  const fp = dpr;
  const [cx, cy] = title.label.summit;
  const floor = title.label.floor;
  const x0 = ox + cx * sx;
  const top = cy * sy;
  const tickX = x0 + Math.floor((sx - fp) / 2);
  const w = LABEL_CHARS * LABEL_ADVANCE_FP * fp;
  const h = LABEL_ROW_FP * fp;
  const bottom = nameBottom({ sx, sy, dpr });
  // The lowest it sits (one font pixel over the haze), where the leader would be TICK_PT long, and the highest the name allows.
  const lowest = floor * sy - fp - h;
  const flown = fp * Math.round((top - TICK_PT * dpr - fp - h) / fp);
  const highest = fp * Math.ceil(((bottom + NAME_LIFT_PT) * dpr) / fp);
  const labelY = Math.min(lowest, Math.max(flown, highest));
  const label = { x: tickX, y: labelY, w, h };
  const tickY = labelY + h + fp;
  const tick = { x: tickX, y: tickY, w: fp, h: top - tickY };
  const core = { x: tickX, y: tickY, w: fp, h: tick.h - fp };
  const gap = label.y / dpr - bottom;
  const show = sy / dpr >= 1 - 1e-9 && gap >= NAME_CLEAR_PT - 1e-9 && core.h > 0;
  return { show, fp, tick, core, label, summit: { x: x0, y: top, w: sx, h: sy }, nameBottom: bottom, gap };
}

/**
 * Pure: the cover's ops with the stars inside any quiet box left out (Lead
 * call 68): each single-point L op of its sky layer whose point lies in a
 * box [x, y, w, h] (picture pixels). Nothing else changes, and the ops
 * given are never touched (main's cover keeps every star).
 * @param {any[][]} ops compiled (art.json's)
 * @param {readonly (readonly number[])[]} boxes
 * @returns {any[][]}
 */
export function quietOps(ops, boxes) {
  const inBox = (/** @type {number} */ x, /** @type {number} */ y) => boxes.some(([bx, by, bw, bh]) => x >= bx && x < bx + bw && y >= by && y < by + bh);
  let layer = null;
  const out = [];
  for (const op of ops) {
    if (op[0] === '@') layer = op[1];
    const pts = op[1];
    if (layer === 'sky' && op[0] === 'L' && Array.isArray(pts) && pts.length === 2 && inBox(pts[0], pts[1])) continue;
    out.push(op);
  }
  return out;
}

/**
 * Pure: does this address skip the title screen? Only in debug mode (the
 * address's ?debug=1, or the menu opened) with a hash that is one of the
 * game's dev routes, by the parser the game itself reads (ui/devroute.js),
 * so the screenshot tools open straight onto their screens and a
 * malformed one shows the title. Never #map, which opens over whatever
 * shows.
 * @param {{search?: string, hash?: string, debug?: boolean}} o
 */
export function skipsTitle({ search = '', hash = '', debug = false }) {
  if (!(debug || debugRequested(search))) return false;
  return parseDevRoute(hash) !== null;
}

/**
 * Wait for css/title.css: the one main.js linked beside this module (linked,
 * resolving when it has loaded or failed), or, with none given, add it to
 * the page now (at once where there's no <head>: Node's tests). Never
 * waits longer than FONT_WAIT_MS.
 * @param {Document} doc
 * @param {(f: () => void, ms: number) => () => void} later
 * @param {Promise<unknown>} [linked]
 * @returns {Promise<void>}
 */
function addTitleCss(doc, later, linked) {
  const head = doc.head;
  if (!linked && !head) return Promise.resolve();
  return new Promise((done) => {
    if (linked) linked.then(() => done(), () => done());
    else {
      const link = doc.createElement('link');
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('href', TITLE_CSS.href);
      link.addEventListener('load', () => done());
      link.addEventListener('error', () => done());
      head.appendChild(link);
    }
    later(() => done(), FONT_WAIT_MS);
  });
}

/**
 * Pure: the canvas's backing store in device pixels, as gfx/display.js
 * sizes it (a whole number of CSS px wide and tall): the tick's layer.
 * @param {{sx: number, sy: number, dpr: number}} shape
 */
export function overlay({ sx, sy, dpr }) {
  return { w: Math.round(Math.ceil((PIC_WIDTH * sx) / dpr - 1e-6) * dpr), h: Math.round(Math.ceil((PIC_HEIGHT * sy) / dpr - 1e-6) * dpr) };
}

/**
 * Hide or show an element by its hidden attribute (game.css: [hidden] is
 * display: none), an SVG element's too.
 * @param {Element} el
 * @param {boolean} hidden
 */
function hide(el, hidden) {
  if (hidden) el.setAttribute('hidden', '');
  else el.removeAttribute('hidden');
}

/** setTimeout, as a cancel function. */
function timeout(/** @type {() => void} */ f, /** @type {number} */ ms) {
  const id = setTimeout(f, ms);
  return () => clearTimeout(id);
}

/**
 * The page's clock, for the tap guard.
 * @returns {number}
 */
function pageNow() {
  return typeof performance !== 'undefined' ? performance.now() : 0;
}

/**
 * @typedef {{stop: () => void, done: Promise<void>, entered: Promise<void>, onEnter: (fn: () => void) => void, finish: () => void, resume: boolean}} TitleScreen
 */

/**
 * Show the title screen (or, on a resume, the cover alone). Resolves once
 * the draw-in has started, to {stop, done, entered, onEnter, finish,
 * resume}: entered settles on the tap that goes in (on a resume, when the
 * draw-in is done); onEnter(fn) runs fn once inside that tap; stop() ends
 * every listener and timer (the game calls it when it takes the page).
 * css is css/title.css's load, when main.js has linked it already. The
 * rest are for tests: show (ui/home.js showTitle), now (the clock), later
 * (a timer), reduced (Reduce Motion), resume (a resume, instead of the
 * session's mark and the address).
 * @param {Document} doc
 * @param {{words?: Promise<unknown>, css?: Promise<unknown>, resume?: boolean, now?: () => number, later?: (f: () => void, ms: number) => () => void, show?: typeof showTitle, reduced?: boolean}} [o]
 * @returns {Promise<TitleScreen>}
 */
export async function showTitleScreen(doc, o = {}) {
  const { words = Promise.resolve(), now = pageNow, later = timeout, show = showTitle } = o;
  const win = doc.defaultView;
  const loc = win && win.location ? win.location : { search: '', hash: '' };
  // The session's mark: the game has had the page in this session (a Restart inside it, or iOS reloading the app it shut down in the background).
  const marked = resuming();
  const resume = o.resume !== undefined ? o.resume : marked || skipsTitle({ search: loc.search, hash: loc.hash, debug: debugMode() });
  /** @type {TitleData | null} */
  let data = null;
  const prepare = (/** @type {any} */ art) => {
    data = art && art.title ? art.title : null;
    const pic = art.pics[(data && data.cover) || 'cover_high_divide_dusk'];
    return data ? quietOps(pic.ops, data.quiet.map((q) => q.box)) : pic.ops;
  };
  if (resume) {
    const cover = await show(doc, { prepare });
    return { stop: cover.stop, done: cover.done, entered: cover.done, onEnter: () => {}, finish: cover.finish, resume: true };
  }

  const app = /** @type {HTMLElement} */ (doc.getElementById('app'));
  const plate = /** @type {HTMLElement} */ (doc.getElementById('plate'));
  const canvas = /** @type {HTMLElement} */ (doc.getElementById('cover'));
  const shelf = /** @type {HTMLElement} */ (doc.getElementById('shelf'));
  const update = doc.getElementById('update');
  const stampsEl = doc.getElementById('build-stamp');
  const stamps = stampsEl ? stampsEl.parentNode : null;
  /** @type {(() => void)[]} */
  const cancels = [];
  const css = addTitleCss(doc, later, o.css);
  const reduced = o.reduced !== undefined ? o.reduced : reducedMotion();

  // The name first (VoiceOver meets it before the picture), then the
  // picture, the label (its own stop) and its tick; the prompt heads the
  // shelf. All are placed absolutely or held back by visibility, so
  // nothing moves on screen and fit() reserves the prompt's room at once.
  const caption = plate.querySelector('.cover-title');
  if (caption && canvas) plate.insertBefore(caption, canvas);
  const label = doc.createElement('p');
  label.className = 'peak-label';
  // The tick, in an SVG laid over the picture in its own device pixels (a
  // viewBox the size of the canvas's backing store, crisp edges): one font
  // pixel of glacier blue cased in ink, its last font pixel a foot of ink,
  // ending exactly on the summit pixel's top edge on any engine, whether it
  // lays out in device or CSS pixels.
  const svg = (/** @type {string} */ tag) => doc.createElementNS(SVG_NS, tag);
  const tick = svg('svg');
  tick.setAttribute('class', 'peak-tick');
  tick.setAttribute('aria-hidden', 'true');
  tick.setAttribute('focusable', 'false');
  tick.setAttribute('shape-rendering', 'crispEdges');
  tick.setAttribute('preserveAspectRatio', 'none');
  const tickCase = svg('rect');
  tickCase.setAttribute('class', 'peak-tick-case');
  const tickLine = svg('rect');
  tickLine.setAttribute('class', 'peak-tick-line');
  tick.appendChild(tickCase);
  tick.appendChild(tickLine);
  // Hidden until the label's place is known and it fits (titleMarks).
  hide(label, true);
  hide(tick, true);
  plate.appendChild(label);
  plate.appendChild(tick);
  const go = doc.createElement('button');
  go.className = 'title-go';
  go.setAttribute('type', 'button');
  shelf.insertBefore(go, shelf.firstChild);
  app.setAttribute('data-title', 'drawing');

  /** @type {{sx: number, sy: number, short: boolean} | null} */
  let lastShape = null;
  /** @type {{origin: {ox: number, oy: number}} | null} */
  let lastDisplay = null;
  const place = () => {
    if (!data || !lastShape || !lastDisplay) return;
    const dpr = (win && win.devicePixelRatio) || 1;
    const m = titleMarks({ sx: lastShape.sx, sy: lastShape.sy, dpr }, lastDisplay.origin, data);
    const offX = (canvas && canvas.offsetLeft) || 0;
    const offY = (canvas && canvas.offsetTop) || 0;
    const set = (/** @type {Element} */ el, /** @type {Rect} */ r) => {
      const st = /** @type {HTMLElement} */ (el).style;
      st.setProperty('left', `${offX + r.x / dpr}px`);
      st.setProperty('top', `${offY + r.y / dpr}px`);
      st.setProperty('width', `${r.w / dpr}px`);
      st.setProperty('height', `${r.h / dpr}px`);
    };
    const rect = (/** @type {Element} */ el, /** @type {Rect} */ r) => {
      for (const [k, v] of Object.entries({ x: r.x, y: r.y, width: r.w, height: r.h })) el.setAttribute(k, String(v));
    };
    set(label, m.label);
    // The tick's layer covers the canvas exactly: its CSS size, its backing store's device pixels.
    const layer = overlay({ sx: lastShape.sx, sy: lastShape.sy, dpr });
    set(tick, { x: 0, y: 0, w: layer.w, h: layer.h });
    tick.setAttribute('viewBox', `0 0 ${layer.w} ${layer.h}`);
    rect(tickCase, { x: m.tick.x - m.fp, y: m.tick.y, w: 3 * m.fp, h: m.tick.h });
    rect(tickLine, m.core);
    hide(label, !m.show);
    hide(tick, !m.show);
  };
  const onFit = (/** @type {{sx: number, sy: number, short: boolean}} */ shape, /** @type {any} */ display) => {
    lastShape = shape;
    lastDisplay = display;
    place();
  };
  await css;
  /** @type {Awaited<ReturnType<typeof showTitle>>} */
  let cover;
  try {
    cover = await show(doc, { prepare, onFit });
  } catch (err) {
    // No picture (the sheet opens): the game takes the page without a tap.
    app.removeAttribute('data-title');
    throw err;
  }
  place();

  // The steps: the name, the label, the prompt; each waits for the one
  // before, and the label and the prompt for the chrome font and the words.
  const fonts = doc.fonts ? doc.fonts : null;
  const fontWait = Promise.race([
    fonts ? fonts.load(TITLE_FONT).then(() => undefined, () => undefined) : Promise.resolve(),
    new Promise((/** @type {(v?: unknown) => void} */ r) => cancels.push(later(() => r(), FONT_WAIT_MS))),
  ]);
  const ready = Promise.all([words.then(() => undefined, () => undefined), fontWait]).then(() => {
    if (data) tx(label, data.label.name); // t-ids: @places
    tx(go, 'title.prompt');
  });
  let step = 'drawing';
  let readyAt = -Infinity;
  let hurried = reduced;
  let stopped = false;
  const setStep = (/** @type {string} */ s) => {
    if (stopped || STEPS.indexOf(s) <= STEPS.indexOf(step)) return;
    step = s;
    app.setAttribute('data-title', s);
    if (s === 'ready') readyAt = now();
  };
  const wait = (/** @type {number} */ ms) => new Promise((/** @type {(v?: unknown) => void} */ r) => (hurried ? r() : cancels.push(later(() => r(), ms))));
  /** @type {() => void} */
  let wake = () => {};
  const hurry = new Promise((/** @type {(v?: unknown) => void} */ r) => {
    wake = r;
  });
  const either = (/** @type {Promise<unknown>} */ p) => Promise.race([p, hurry]);
  const run = async () => {
    await cover.done;
    setStep('name');
    await either(wait(NAME_MS));
    await ready;
    setStep('label');
    await either(wait(LABEL_MS));
    setStep('ready');
  };
  run();

  /** @type {() => void} */
  let goIn = () => {};
  /** @type {Promise<void>} */
  const entered = new Promise((r) => {
    goIn = r;
  });
  /** @type {(() => void)[]} */
  const onEnters = [];
  // A press that began before the prompt showed (the hurry tap): its click
  // never goes in, however long it was held (S7b review). Any click spends
  // it; a fresh press after the prompt clears it.
  let pressBeforeReady = false;
  const onHurry = () => {
    if (step === 'ready' || step === 'entered' || stopped) return;
    hurried = true;
    app.setAttribute('data-hurry', '');
    cover.finish();
    wake();
  };
  const onDown = () => {
    pressBeforeReady = step !== 'ready' && step !== 'entered';
    onHurry();
  };
  const onClick = (/** @type {MouseEvent} */ e) => {
    const held = pressBeforeReady;
    pressBeforeReady = false;
    if (step !== 'ready' || now() - readyAt < TAP_GUARD_MS) return;
    // A pointer's click (detail 1 or more) from a press that began before ready; the keyboard's and VoiceOver's (detail 0) still go in.
    if (held && e.detail > 0) return;
    const target = /** @type {Node | null} */ (e.target);
    if (target && ((update && update.contains(target)) || (stamps && stamps.contains(target)))) return;
    setStep('entered');
    go.setAttribute('aria-disabled', 'true');
    app.removeEventListener('click', onClick);
    for (const fn of onEnters.splice(0)) fn();
    goIn();
  };
  app.addEventListener('pointerdown', onDown);
  doc.addEventListener('keydown', onHurry);
  app.addEventListener('click', onClick);
  if (reduced) wake();

  return {
    stop: () => {
      stopped = true;
      for (const c of cancels.splice(0)) c();
      app.removeEventListener('pointerdown', onDown);
      doc.removeEventListener('keydown', onHurry);
      app.removeEventListener('click', onClick);
      app.removeAttribute('data-title');
      app.removeAttribute('data-hurry');
      cover.stop();
    },
    done: cover.done,
    entered,
    onEnter: (fn) => {
      if (step !== 'entered') onEnters.push(fn);
    },
    finish: cover.finish,
    resume: false,
  };
}
