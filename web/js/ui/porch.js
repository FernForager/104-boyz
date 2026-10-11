// The porch (BUILD_PLAN S7 D6; GAME_DESIGN 12.3, 12.4): the slim frame the
// lockbox's questions and the guest book are drawn in, top to bottom:
//
//   the status line   ui/status.js: the lake's time, ≡ (the mailbox), Sound
//   the picture       a 160 x 168 window of the cabin as composed now (the
//                     same hour, sky and moon as the cabin, kept live as
//                     the cabin keeps it: at each minute, at the scene's
//                     next change and back in the foreground; with the
//                     first-launch overlay, or after a death the guest book
//                     alone), rows cabin.json first.window_y
//                     to + window_h: the lower facade, the porch with the
//                     lit lockbox and the open guest book, the lawn and the
//                     fire bowl; at whole device pixels in the trail's mat;
//                     a tap reads the cabin's alt text as its Look
//   the box           the Sierra box, with S6's ▾ continuation
//   below it          the caller's: the lockbox's choices (ui/lockbox.js),
//                     or the guest book's label, field, Suggest, the
//                     one-life line and Sign (ui/guestbook.js), in the
//                     thumb zone
//
// porchLayout() is its space check, as frameLayout() is the trail's: the
// picture takes the largest pixel shape that leaves the box three lines
// over the room below it (the lockbox sizes it for its three choices, so it
// never jumps between a question and the closing). Under Larger Text the
// box's lines and each choice are the Plain serif's, and what is below the
// box counts at its measured height when its words wrap taller.
//
// The porch shows the picture at once: the cabin drew itself in already
// (11.4: a revisit), and Reduce Motion stops its cycles as on the cabin.
// This module never imports the trail's (ui/frame.js, choices.js, sheet.js,
// outcome.js, compass.js, strip.js, toolbar.js), so first launch reaches no
// trail line when the cabin comes to main (BUILD_PLAN S7 4.11).

import { t, tx } from '../text.js';
import { clock } from '../fmt.js';
import { pacificNow } from '../platform/now.js';
import { renderPic } from '../gfx/picvm.js';
import { makePalette } from '../gfx/palette.js';
import { createDisplay, startCycles, pickPixelShape } from '../gfx/display.js';
import { plainSizeOf, PLAIN_LINE, PLAIN_CHOICE_CHROME_FP } from './textsize.js';
import { playDrawIn } from '../gfx/drawin.js';
import { cabinAlt, cabinPalette, WIDTH } from '../gfx/cabin.js';
import { statusLine, watchUpdate, updateWaits, snapWidth, STATUS_PT } from './status.js';
import { openLook, closeLook } from './look.js';
import { continueBox } from './textbox.js';
import { liveCycles, onMotionChange } from './motion.js';
import { HOME_STATUS, composeFor, sceneOfCtx, fontPixel, canvasInset, timeout, KEYLINE_FP, SIDE_PT, MAX_WAIT_MS } from './cabin.js';

/** The porch's window on the plate (cabin.json first: window_y, window_h), when the build has no cabin. */
export const WINDOW = Object.freeze({ y: 128, h: 168 });
/** A box choice (the trail's: 52 pt, 8 apart, 6 under the last). */
export const CHOICE_PT = 52;
export const CHOICE_GAP_PT = 8;
export const CHOICES_FOOT_PT = 6;
/** The lockbox sizes the picture for three choices, its questions' count. */
export const LAYOUT_CHOICES = 3;
/** The box: 26-pt lines of the pixel font, its border and padding in font pixels, 2 fp clear above and below (frame.css). */
export const BOX_LINE_PT = 26;
export const BOX_CHROME_FP = 12;
export const BOX_GAP_FP = 2;
export const MIN_BOX_LINES = 3;
/**
 * The guest book's room under its box (home.css): the label (a chrome row
 * and 4 pt), the field and Suggest (52 pt), the one-life line (three lines
 * of 15-pt text at 1.3, 59 pt), Sign (52 pt), 8 pt between each and 6 under.
 */
export const GUESTBOOK_BELOW_PT = 24 + 8 + 52 + 8 + 59 + 8 + 52 + 6;

/**
 * The room the lockbox's choices take.
 * @param {number} n
 */
export const choicesPt = (n) => (n > 0 ? n * CHOICE_PT + (n - 1) * CHOICE_GAP_PT + CHOICES_FOOT_PT : 0);

/**
 * Pure: the porch's layout (its space check), in the numbers home.css
 * uses: the status line, the 168-row window in its mat and keyline at the
 * largest pixel shape that leaves the box three lines, the box, and the
 * room below it.
 * @param {{width: number, height: number, dpr: number, safeTop?: number, safeBottom?: number, usable?: number, below?: number, rows?: number, plainPx?: number | null, plainRows?: number, measured?: number}} o
 *   below: the room under the box in the pixel fonts (pt; the lockbox's
 *   three choices by default); rows: the window's height in picture rows;
 *   plainPx: the Plain size under Larger Text (textsize.js plainSizeOf),
 *   else null; plainRows: the box choices below holds, each a Plain line
 *   and its chrome under Larger Text (three for the lockbox, Sign for the
 *   guest book); measured: what is below the box, as the page measures it
 *   (pt), when its words wrap taller than that
 */
export function porchLayout({ width, height, dpr, safeTop = 0, safeBottom = 0, usable, below: belowPt = choicesPt(LAYOUT_CHOICES), rows: picRows = WINDOW.h, plainPx = null, plainRows = LAYOUT_CHOICES, measured }) {
  const fp = fontPixel(dpr);
  const room = usable === undefined ? height - safeTop - safeBottom : usable;
  const keyline = KEYLINE_FP * fp;
  const gaps = 2 * BOX_GAP_FP * fp;
  // Under Larger Text: a line of the Plain serif, and each choice a Plain line and its chrome (home.css).
  const plain = typeof plainPx === 'number' && plainPx > 0 ? plainPx : null;
  const line = plain ? PLAIN_LINE * plain : BOX_LINE_PT;
  const choice = plain ? Math.max(CHOICE_PT, Math.ceil(line + PLAIN_CHOICE_CHROME_FP * fp - 1e-6)) : CHOICE_PT;
  const model = belowPt + plainRows * (choice - CHOICE_PT);
  const below = typeof measured === 'number' && measured > model ? measured : model;
  const minBox = MIN_BOX_LINES * line + BOX_CHROME_FP * fp + gaps;
  const maxCssHeight = room - STATUS_PT - 2 * keyline - below - minBox;
  const shape = pickPixelShape({ cssWidth: width, screenHeight: height, dpr, picWidth: WIDTH, picHeight: picRows, maxCssHeight });
  const picture = {
    width: Math.ceil((WIDTH * shape.sx) / dpr - 1e-6),
    height: Math.ceil((picRows * shape.sy) / dpr - 1e-6),
  };
  const rowsPt = { status: STATUS_PT, picture: picture.height + 2 * keyline, box: 0, below };
  rowsPt.box = room - rowsPt.status - rowsPt.picture - rowsPt.below;
  const box = Math.max(0, rowsPt.box - gaps);
  const column = Math.max(picture.width + 2 * keyline, width - SIDE_PT);
  const colX = Math.max(0, Math.floor((width - column) / 2));
  const mat = Math.floor(((column - 2 * keyline - picture.width) / 2) * dpr + 1e-6) / dpr;
  return {
    fp,
    shape: { sx: shape.sx, sy: shape.sy },
    picture,
    maxCssHeight,
    keyline,
    column,
    mat,
    x: { column: colX, picture: colX + keyline + mat },
    rows: rowsPt,
    box,
    boxLines: Math.max(0, Math.floor((box - BOX_CHROME_FP * fp) / line + 1e-6)),
  };
}

/**
 * The porch's window on the plate: cabin.json's first, else WINDOW.
 * @param {any} cabin
 */
export function windowOf(cabin) {
  const f = cabin && cabin.first;
  return f && Number.isInteger(f.window_y) && Number.isInteger(f.window_h) ? { y: f.window_y, h: f.window_h } : { ...WINDOW };
}

/**
 * A display that shows rows y0..y0+rows of a taller picture: present()
 * takes the whole picture's RGBA and passes the window on.
 * @param {{present: (rgba: Uint8ClampedArray) => void}} display
 * @param {number} width
 * @param {number} y0
 * @param {number} rows
 */
function windowed(display, width, y0, rows) {
  return {
    present: (/** @type {Uint8ClampedArray} */ rgba) => display.present(rgba.subarray(y0 * width * 4, (y0 + rows) * width * 4)),
  };
}

/**
 * @typedef {import('./status.js').Sound} Sound
 * @typedef {ReturnType<typeof import('./menu.js').createMenu>} Menu
 * @typedef {object} PorchCtx
 * @property {any} art art.json (its pics, stamps, palette and cabin), or null
 * @property {{sun: any, climate: any, realMoon?: boolean}} data the build's sun table and climate, and the real moon's switch
 * @property {Sound} sound
 * @property {Menu} menu the ≡ sheet: the mailbox
 * @property {() => import('../platform/now.js').PacificNow} [now] the lake's clock
 * @property {import('./cabin.js').SceneOverride | null} [dev] the dev route's override
 * @property {() => boolean} [devOn] are the dev controls in force (the cabin's devOn by default)
 * @property {(f: () => void, ms: number) => () => void} [later] the clock's one timer (setTimeout's; tests pass their own)
 */

/**
 * The porch's box: one paragraph a line, the ▾ continuation, focusable so
 * VoiceOver reads it.
 * @param {Document} doc
 * @param {readonly {id: string, vars?: Record<string, unknown>}[]} lines
 * @param {(pager: import('./textbox.js').Pager) => void} [onChange]
 */
export function porchBox(doc, lines, onChange) {
  const box = doc.createElement('div');
  box.classList.add('box', 'game-box', 'porch-box');
  box.setAttribute('tabindex', '-1');
  for (const ref of lines) {
    const p = doc.createElement('p');
    tx(p, ref.id, ref.vars); // t-ids: @content, first.lockbox.intro, first.lockbox.count, first.lockbox.all_right, first.lockbox.come_in, first.guestbook.prompt
    box.appendChild(p);
  }
  const pager = continueBox(box, onChange ? { onChange } : {});
  return { box, pager };
}

/** The porch's plate states: first launch's (the lockbox lit, the guest book open), or the guest book alone (after a death). */
export const PORCH_STATES = Object.freeze(['first', 'guestbook']);

/**
 * Draw the porch into host (the game screen): the status line and the
 * picture's window; the caller adds the box and what goes below it.
 * Returns the parts, layout() for the CSS numbers (call it once the box
 * and the rest are in), and release() before the next screen. The picture
 * stays live, as the cabin's does: the scene is looked at again at each
 * minute (the clock), at its next change and when the page comes back to
 * the foreground, and drawn again when it changed.
 * @param {HTMLElement} host div.game-screen
 * @param {PorchCtx} ctx
 * @param {{below?: number, plainRows?: number, state?: string}} [o] below: the room under the box (pt) in
 *   the pixel fonts, for the space check; plainRows: the box choices it holds (Larger Text grows each);
 *   state: the plate's overlay, first launch's ('first': the lockbox's questions, and the guest book
 *   that follows them) or the guest book alone ('guestbook': after a death, decision 45)
 */
export function renderPorch(host, ctx, { below = choicesPt(LAYOUT_CHOICES), plainRows = LAYOUT_CHOICES, state = 'first' } = {}) {
  const doc = host.ownerDocument;
  const win = /** @type {(Window & typeof globalThis) | null} */ (doc.defaultView || null);
  const art = ctx.art && ctx.art.cabin && ctx.art.pics && ctx.art.pics[ctx.art.cabin.plate] ? ctx.art : null;
  const cabin = art ? art.cabin : null;
  const view = windowOf(cabin);
  host.classList.add('porch');
  /** @type {(() => void)[]} */
  const stops = [];

  // The status line: the lake's time, ≡ (the mailbox), Sound:on.
  const openMailbox = () => {
    ctx.menu.setRows([]);
    ctx.menu.open({ label: HOME_STATUS.menu });
  };
  const status = statusLine(doc, { sound: ctx.sound, onMenu: openMailbox, lines: HOME_STATUS });
  host.appendChild(status.header);
  stops.push(status.release);
  stops.push(watchUpdate(doc, [status.menu]));
  const now = ctx.now || (() => pacificNow());
  const later = ctx.later || timeout;

  // The picture: its canvas (hidden from VoiceOver), and the cabin's alt text.
  const figure = doc.createElement('figure');
  figure.className = 'porch-picture';
  const canvas = /** @type {HTMLCanvasElement} */ (doc.createElement('canvas'));
  canvas.className = 'picture';
  canvas.setAttribute('aria-hidden', 'true');
  figure.appendChild(canvas);
  const img = doc.createElement('div');
  img.classList.add('vh', 'porch-alt');
  img.setAttribute('role', 'img');
  figure.appendChild(img);
  host.appendChild(figure);

  const overlay = PORCH_STATES.includes(state) ? state : 'first';
  // The overlay, and an update's flag on the mailbox.
  const states = () => [overlay, ...(updateWaits(doc) ? ['flag_up'] : [])];
  /** @type {import('./cabin.js').CabinScene | null} */
  let scene = null;
  /** @type {ReturnType<typeof composeFor> | null} */
  let composed = null;
  /** @type {string[]} */
  let altIds = [];
  /** @type {string | null} the composed key on the canvas */
  let shownKey = null;
  // A tap on the picture reads its description, as a Look (the trail's way).
  figure.addEventListener('click', () => {
    if (altIds.length) openLook(figure, altIds.map((id) => ({ id })), { sound: ctx.sound, flow: true });
  });

  /** @type {ReturnType<typeof createDisplay> | null} */
  let display = null;
  let stopCycles = () => {};
  /** @type {{finish: () => void} | null} */
  let run = null;
  const palette = art ? cabinPalette(makePalette(art.palette), cabin) : null;
  if (win && art && typeof canvas.getContext === 'function') display = createDisplay(canvas, WIDTH, view.h);

  /** The scene now: its alt text, its data attributes and (where it can) its picture, drawn again only when it changed. */
  const paint = () => {
    scene = cabin ? sceneOfCtx(ctx, cabin) : null;
    composed = art && scene ? composeFor(art, scene, states()) : null;
    altIds = scene ? cabinAlt({ hour: scene.hour, sky: scene.sky, fog: scene.fog, moonShown: Boolean(composed && composed.moon) }) : [];
    if (altIds.length) {
      img.setAttribute('aria-label', altIds.map((id) => t(id)).join(' ')); // t-ids: alt.scene.cabin, alt.sky.cloudy, alt.sky.rain, alt.sky.fog, alt.cabin.lit, alt.cabin.moon, alt.hour.dawn, alt.hour.dusk, alt.hour.blue, alt.hour.night, alt.hour.blue_clouded, alt.hour.night_clouded
      img.setAttribute('data-t-aria', 'alt.scene.cabin'); // the line inspector finds a spoken name by it
      img.setAttribute('data-t-alt', altIds.join(' '));
    }
    if (scene) {
      host.setAttribute('data-hour', scene.hour);
      host.setAttribute('data-sky', scene.fog ? 'fog' : scene.sky);
    }
    if (!composed) return;
    host.setAttribute('data-key', composed.key);
    if (!display || !palette || composed.key === shownKey) return;
    shownKey = composed.key;
    if (run) run.finish();
    stopCycles();
    const c = composed;
    const result = renderPic(c.ops, { width: c.width, height: c.height, stamps: art.stamps, record: false });
    const shown = windowed(display, c.width, view.y, view.h);
    // At once: the cabin drew itself in already (11.4: a revisit).
    run = playDrawIn({
      result,
      palette,
      display: /** @type {any} */ (shown),
      remap: c.table,
      reduced: true,
      onDone(final) {
        stopCycles = liveCycles(() => startCycles(/** @type {any} */ (shown), final, c.width, palette, { remap: c.table }));
      },
    });
  };

  // The lake's time and the scene, as on the cabin: now, and again at the next minute or the scene's
  // next change, whichever is first (one timer, cleared on release), and back in the foreground.
  let clearClock = () => {};
  const tick = () => {
    const p = now();
    const ref = clock(p.secs - (p.secs % 60));
    tx(status.left, ref.id, ref.vars); // t-ids: fmt.clock_am, fmt.clock_pm
    paint();
    const toMinute = 60 - (p.secs % 60);
    const toScene = scene ? Math.max(1, scene.next - p.secs) : toMinute;
    clearClock = later(tick, Math.min(MAX_WAIT_MS, Math.min(toMinute, toScene) * 1000 + 50));
  };
  tick();
  const onVisible = () => {
    if (doc.visibilityState !== 'visible') return;
    clearClock();
    tick();
  };
  doc.addEventListener('visibilitychange', onVisible);
  // An update waits: the mailbox's flag goes up on the plate.
  const onUpdate = () => paint();
  if (win) win.addEventListener('oph:update', onUpdate);
  stops.push(() => {
    clearClock();
    doc.removeEventListener('visibilitychange', onVisible);
    if (win) win.removeEventListener('oph:update', onUpdate);
  });

  /** @type {(() => void)[]} */
  const relayouts = [];
  const layout = () => {
    if (!win) return null;
    const under = /** @type {HTMLElement | null} */ (host.querySelector('.game-choices') || host.querySelector('.gb-below'));
    const measured = under && typeof under.getBoundingClientRect === 'function' ? under.getBoundingClientRect().height : 0;
    const l = porchLayout({
      width: win.innerWidth,
      height: screenHeight(win),
      dpr: win.devicePixelRatio || 1,
      usable: host.clientHeight || win.innerHeight,
      below,
      rows: view.h,
      plainPx: plainSizeOf(doc, win),
      plainRows,
      ...(measured > 0 ? { measured } : {}),
    });
    host.style.setProperty('--col', `${l.column}px`);
    host.style.setProperty('--col-x', `${l.x.column}px`);
    host.style.setProperty('--pic-x', `${l.x.picture}px`);
    host.style.setProperty('--mat', `${l.mat}px`);
    snapWidth(status.sound);
    if (display) {
      display.layout({ cssWidth: win.innerWidth, screenHeight: screenHeight(win), maxCssHeight: l.maxCssHeight });
      display.snap();
    }
    for (const f of relayouts) f();
    return l;
  };
  if (win && display) {
    stops.push(onMotionChange((on) => on && run && run.finish()));
    const onResize = () => layout();
    win.addEventListener('resize', onResize);
    win.addEventListener('orientationchange', onResize);
    stops.push(() => {
      win.removeEventListener('resize', onResize);
      win.removeEventListener('orientationchange', onResize);
    });
  }
  return {
    status,
    figure,
    img,
    canvas,
    /** The scene shown (tests, the shots). */
    scene: () => scene,
    /** The composed key shown, or null. */
    key: () => (composed ? composed.key : null),
    alt: () => altIds.slice(),
    /** The states composed on the plate now (tests). */
    states: () => states(),
    /** Measure and place everything (once the box and the rest are in); a box's pager joins with onRelayout. */
    layout,
    /** @param {() => void} f run after every layout (the box's ▾ measures again) */
    onRelayout(f) {
      relayouts.push(f);
    },
    /** The box's overflow can only be measured once the fonts have laid it out. */
    whenFonts(/** @type {() => void} */ f) {
      if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(f);
    },
    release() {
      closeLook(figure);
      if (run) run.finish();
      stopCycles();
      for (const s of stops) s();
      if (display) display.release();
    },
  };
}

/**
 * A box choice in the porch's style (the trail's look, the cabin's
 * module): a full-width button with its label.
 * @param {Document} doc
 * @param {{id: string, vars?: Record<string, unknown>}} label
 * @param {() => void} onTap
 */
export function porchChoice(doc, label, onTap) {
  const b = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
  b.classList.add('box', 'choice');
  b.setAttribute('type', 'button');
  const span = doc.createElement('span');
  span.className = 'choice-label';
  tx(span, label.id, label.vars); // t-ids: @content, first.lockbox.take_key, first.guestbook.sign
  b.appendChild(span);
  b.addEventListener('click', onTap);
  return b;
}

/** @param {Window} win */
function screenHeight(win) {
  const s = win.screen;
  return s ? Math.max(s.width, s.height) : win.innerHeight;
}
