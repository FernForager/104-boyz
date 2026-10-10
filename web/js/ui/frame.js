// The trail stop (GAME_DESIGN 12.1, 12.2, 11.2 to 11.5, 11.9; BUILD_PLAN
// 2.5, S5): the frame every stop is drawn in, top to bottom:
//
//   the status line  a 22-pt snow bar in the chrome font: the score's slot
//                    (empty until S9), ≡ and Sound:on (King's Quest's own)
//   the picture      160x168 at whole device pixels (gfx/display.js), drawn
//                    in on a first visit, its hour a remap (day, dusk, blue
//                    hour, night), its water and stars cycling
//   the caption      Day 1 · Deer Lake · 3,530 ft
//   the strip        today's pencil profile and the mile (ui/strip.js)
//   the Sierra box   S3's box (ui/stop.js, ui/textbox.js), absent on a
//                    quiet stop (decision 32), when the caption takes focus
//   the choices      S3's buttons, with the cue each tap plays and the (i)
//                    square (ui/choices.js), in the thumb zone; from S6 a
//                    rolled choice's tag and a diamond's second line, the
//                    diamond's confirm, the (i)'s Why sheet (ui/sheet.js,
//                    also a long press on the choice: ui/press.js), the
//                    odds intro before the box, and on an outcome stop its
//                    ornament and pencil rows (ui/outcome.js)
//   the toolbar      Pack, Map and Log (ui/toolbar.js), tall screens only;
//                    on a short screen (under 700 pt) they fold into ≡ and
//                    the picture takes the flatter 4x2 pixel
//
// After a diamond's Yes the game asks the frame for the compass roll
// (compass(): ui/compass.js, drawn into this stop's own picture canvas),
// then draws the outcome.
//
// One CSS grid (css/frame.css) fills the game screen; every chrome length is
// a whole number of font pixels (--fp: 4 device px on 3x, 3 on 2x), so its
// edges land on whole device pixels. frameLayout() is the space check of
// 12.1 as this session builds it: pure, so Node checks every phone's rows.
//
// The picture comes from the composer (gfx/compose.js, BUILD_PLAN S5 track
// B) when the game passes one in; until then the cover plate stands in, a
// 168-row window of it shown as drawn. The hour is display only, never the
// engine's: the dev control's choice, else the trip count's (day, dusk,
// night, then day again). A place seen once this page load is shown at once
// at any hour, never drawn in again (11.4).
//
// On preview this module also registers the dev control *hour* and the dev
// action *Scenes*, the #frame check view (showScenes): the frame with a
// fixture screen (three choices, or from S6 four, the 15's budget, whose
// box continues with ▾), every drawable picture and the four hours, for
// the phone and the screenshots. main.js never imports it: ui/app.js, preview's only
// (home.js opensGame), does.

import { renderPic } from '../gfx/picvm.js';
import { createDisplay, startCycles, pickPixelShape, SHORT_SCREEN_PT } from '../gfx/display.js';
import { playDrawIn } from '../gfx/drawin.js';
import { t, tx, wordsOf } from '../text.js';
import { load, save } from '../platform/storage.js';
import { feet } from '../fmt.js';
import { renderStop } from './stop.js';
import { addInfo, addTags, cueFor, pixelGlyph, drawnChoices, withIntro, openConfirm } from './choices.js';
import { openWhy, closeWhy } from './sheet.js';
import { renderOutcome } from './outcome.js';
import { playCompass } from './compass.js';
import { onLongPress } from './press.js';
import { checkBox, continueBox } from './textbox.js';
import { renderLooks, openLook, closeLook, lookLines } from './look.js';
import { altFor } from '../gfx/alt.js';
import { reducedMotion, onMotionChange, liveCycles } from './motion.js';
import { renderStrip } from './strip.js';
import { renderToolbar, menuRows } from './toolbar.js';
import { registerDevControl, registerDevAction } from './debug.js';
import { FORCED_PLAIN_PX } from './textsize.js';

/** The picture (GAME_DESIGN 11.2). */
export const PIC = Object.freeze({ width: 160, height: 168 });
/** The hours a picture can show (the composer's HOURS; 11.4). */
export const HOURS = Object.freeze(['day', 'dusk', 'blue', 'night']);
/** The sample's hour by trip count (BUILD_PLAN S5): trips 0, 1, 2 give day, dusk, night. */
export const TRIP_HOURS = Object.freeze(['day', 'dusk', 'night']);
/** Until the composer lands, the cover plate stands in: rows y.. of it, as drawn. */
export const STAND_IN = Object.freeze({ pic: 'cover_high_divide_dusk', y: 96 });

/** The rows of the space check, in points (12.1; BUILD_PLAN S5 3.2). */
export const STATUS_PT = 22;
/** The caption's row keeps the doc's 40 pt, or two chrome rows where they are taller (2x: 42). */
export const CAPTION_PT = 40;
export const CAPTION_ROWS = 2;
/** S5's strip: the profile row of the 32-pt budget (the split row arrives in S8). */
export const STRIP_PT = 24;
export const CHOICE_PT = 52;
/** A choice whose odds take a second line (a diamond's fail and fatal shares, or a wrapped tag): 12.1's 64 pt. */
export const CHOICE_TALL_PT = 64;
export const CHOICE_GAP_PT = 8;
/** The choices' foot: frame.css pads the list 6 pt under the last one (off the screen's edge where there's no toolbar). */
export const CHOICES_FOOT_PT = 6;
export const TOOLBAR_PT = 50;
/** The picture is sized as if three choices showed, so it never jumps between stops. */
export const LAYOUT_CHOICES = 3;
/** The box: Pixelify Sans at 20 px on 26-px lines; never under three lines. */
export const BOX_LINE_PT = 26;
export const MIN_BOX_LINES = 3;
/** The box's border and padding, top and bottom, in font pixels (3 + 3, twice). */
export const BOX_CHROME_FP = 12;
/** The box's gap above it and below it, in font pixels (frame.css: margin-top 2 fp, max-height 100% - 4 fp). */
export const BOX_GAP_FP = 2;
/**
 * Larger Text (ui/textsize.js): the Plain serif's line height, and the lines
 * the space check keeps for the caption (two: a long place wraps) and for
 * each choice (one: a 22-character label fits on one up to about AX1).
 * frame.css lets both grow, so a longer caption or label wraps rather than
 * being cut off, and the box's row gives up the room.
 */
export const PLAIN_LINE = 1.35;
export const PLAIN_CAPTION_ROWS = 2;
export const PLAIN_CHOICE_ROWS = 1;
/** A Plain choice's border and padding, top and bottom, in font pixels ((3 + 2) twice). */
export const PLAIN_CHOICE_CHROME_FP = 10;
/** A chrome row: the 8x14 font's cell. */
export const CHROME_ROW_FP = 14;
/** The column's side margins (pt): the column is max(picture and its keyline, viewport - 32). */
export const SIDE_PT = 32;
/**
 * The picture's mat (S6, lead call 2): a keyline this many font pixels
 * wide, slate (frame.css), round a block as wide as the column, and ink
 * between it and the picture. Every edge (the status line, the keyline,
 * the caption, the box, the choices) is the column's, on every phone, and
 * the picture's edge never meets the page, at any hour (a night sky's top
 * is ink, as the page is), with no rule on the art.
 */
export const KEYLINE_FP = 1;
/** The hiker on every composed trail picture (S5: idle at the trail spot). */
const SPRITES = Object.freeze([['hiker', 'idle', 'trail_spot']]);
const HOUR_KEY = 'hour';

/**
 * A font pixel in CSS px (frame.css --fp): 4 device px on 3x phones, 3 on
 * 2x (11.9), 2 CSS px on a 1x screen (dev).
 * @param {number} dpr
 */
export function fontPixel(dpr) {
  if (dpr >= 3) return 4 / 3;
  if (dpr >= 2) return 1.5;
  return 2;
}

/**
 * Pure: the space check (12.1, as S5 builds it), in the numbers frame.css
 * uses (a test reads them there). Every row's height in points, the
 * picture's pixel shape and size, the column, the box's own height inside
 * its row, and how many whole lines of box text it shows.
 * @param {{width: number, height: number, dpr: number, safeTop?: number, safeBottom?: number, usable?: number, choices?: number, tall?: number, plainPx?: number | null}} o
 *   width, height: the portrait screen (pt); usable: the frame's height when
 *   measured (else height minus the safe areas); choices: the choices shown,
 *   tall of them 64 pt (a diamond, S6), the rest 52; plainPx: the Plain
 *   size under Larger Text (frame.css --plain-size), else null for the
 *   pixel fonts. The picture is always sized as if three 52-pt choices
 *   showed, so it never jumps: a diamond's 12 pt come out of the box.
 */
export function frameLayout({ width, height, dpr, safeTop = 0, safeBottom = 0, usable, choices = LAYOUT_CHOICES, tall = 0, plainPx = null }) {
  const fp = fontPixel(dpr);
  const room = usable === undefined ? height - safeTop - safeBottom : usable;
  const short = height < SHORT_SCREEN_PT;
  const plain = typeof plainPx === 'number' && plainPx > 0 ? plainPx : null;
  // A line of box text; under Larger Text, a line of the Plain serif.
  const line = plain ? PLAIN_LINE * plain : BOX_LINE_PT;
  const caption = Math.max(CAPTION_PT, plain ? Math.ceil(PLAIN_CAPTION_ROWS * line - 1e-6) : CAPTION_ROWS * CHROME_ROW_FP * fp);
  const choice = plain ? Math.max(CHOICE_PT, Math.ceil(PLAIN_CHOICE_ROWS * line + PLAIN_CHOICE_CHROME_FP * fp - 1e-6)) : CHOICE_PT;
  const choicesOf = (/** @type {number} */ n, k = 0) => (n > 0 ? n * choice + Math.min(k, n) * Math.max(0, CHOICE_TALL_PT - choice) + (n - 1) * CHOICE_GAP_PT + CHOICES_FOOT_PT : 0);
  const toolbar = short ? 0 : TOOLBAR_PT;
  // The box's row less its gaps: the box itself, border and padding in.
  const gaps = 2 * BOX_GAP_FP * fp;
  const minBox = MIN_BOX_LINES * line + BOX_CHROME_FP * fp + gaps;
  const keyline = KEYLINE_FP * fp;
  const maxCssHeight = room - STATUS_PT - 2 * keyline - caption - STRIP_PT - choicesOf(LAYOUT_CHOICES) - toolbar - minBox;
  const shape = pickPixelShape({ cssWidth: width, screenHeight: height, dpr, picWidth: PIC.width, picHeight: PIC.height, maxCssHeight });
  const picture = {
    width: Math.ceil((PIC.width * shape.sx) / dpr - 1e-6),
    height: Math.ceil((PIC.height * shape.sy) / dpr - 1e-6),
  };
  const rows = {
    status: STATUS_PT,
    picture: picture.height + 2 * keyline,
    caption,
    strip: STRIP_PT,
    box: 0,
    choices: choicesOf(choices, tall),
    toolbar,
  };
  rows.box = room - rows.status - rows.picture - rows.caption - rows.strip - rows.choices - rows.toolbar;
  const box = Math.max(0, rows.box - gaps);
  const column = Math.max(picture.width + 2 * keyline, width - SIDE_PT);
  // The column's left edge on a whole CSS pixel, centered; inside its
  // keyline, the mat each side in whole device pixels (none where the
  // keyline hugs the picture), so the picture (and the strip under it)
  // starts on a whole device pixel too.
  const colX = Math.max(0, Math.floor((width - column) / 2));
  const mat = Math.floor(((column - 2 * keyline - picture.width) / 2) * dpr + 1e-6) / dpr;
  return {
    short,
    fp,
    shape: { sx: shape.sx, sy: shape.sy },
    picture,
    maxCssHeight,
    column,
    keyline,
    mat,
    x: { column: colX, picture: colX + keyline + mat },
    rows,
    box,
    // Whole lines only: the box clips the next one (S6's ▾ continues it).
    boxLines: Math.max(0, Math.floor((box - BOX_CHROME_FP * fp) / line + 1e-6)),
  };
}

/**
 * The Plain size in force on this page (frame.css --plain-size, 20 px when
 * unset), or null while the pixel fonts show.
 * @param {Document} doc
 * @param {Window | null} win
 * @returns {number | null}
 */
export function plainSizeOf(doc, win) {
  const html = doc.documentElement;
  if (!html || html.getAttribute('data-text') !== 'plain') return null;
  const raw = (html.style && html.style.getPropertyValue('--plain-size')) || (win && typeof win.getComputedStyle === 'function' ? win.getComputedStyle(html).getPropertyValue('--plain-size') : '');
  const px = parseFloat(raw);
  return Number.isFinite(px) && px > 0 ? px : FORCED_PLAIN_PX;
}

/**
 * The hour a stop's picture shows: the dev override when it names an hour,
 * else the trip count's (trips 0, 1, 2, 3: day, dusk, night, day).
 * @param {{state: any} | null} session
 * @param {string | null} [override]
 */
export function hourOf(session, override) {
  if (override && HOURS.includes(override)) return override;
  const hiker = session && session.state ? session.state.hiker : null;
  const trips = hiker && Number.isInteger(hiker.trips) ? hiker.trips : 0;
  return TRIP_HOURS[((trips % TRIP_HOURS.length) + TRIP_HOURS.length) % TRIP_HOURS.length];
}

/** The dev control's kept choice (auto when none, or not an hour). */
export function savedHour() {
  const v = load(HOUR_KEY);
  return HOURS.includes(v) ? v : 'auto';
}

/**
 * The palette table for an hour: its own, else (before the blue-hour and
 * night tables land) dusk for the evening hours, else the day's.
 * @param {{remaps: Record<string, unknown>}} palette
 * @param {string} hour
 */
export function remapFor(palette, hour) {
  if (palette.remaps[hour]) return hour;
  if (hour !== 'day' && palette.remaps.dusk) return 'dusk';
  return 'day';
}

/**
 * @typedef {{compose: (pic: string, art: any, o: {hour: string, sprites: readonly (readonly string[])[]}) => {ops: any[], width: number, height: number, key: string, hotspots?: {id: string, x: number, y: number, w: number, h: number}[]}, drawable: (pic: string, art: any) => boolean}} Composer
 * @typedef {{ops: any[], width: number, height: number, place: string, remap: string, y0: number, hotspots: {id: string, x: number, y: number, w: number, h: number}[], alt: {id: string}[]}} PicturePlan
 */

/**
 * What the picture area shows for a view at an hour: a composed place, or
 * (with no composer yet) the cover's stand-in window, or null (ink: no
 * picture for it yet).
 * @param {{pic: string} | null} view
 * @param {any} art art.json
 * @param {string} hour
 * @param {Composer | null} composer
 * @returns {PicturePlan | null}
 */
export function picturePlan(view, art, hour, composer) {
  if (!art) return null;
  if (composer) {
    if (!view || !composer.drawable(view.pic, art)) return null;
    const c = composer.compose(view.pic, art, { hour, sprites: SPRITES });
    // Its Looks are its hotspots' (S6), and its alt text its parts' lines (gfx/alt.js).
    return { ops: c.ops, width: c.width, height: c.height, place: String(c.key).split('@')[0], remap: hour, y0: 0, hotspots: c.hotspots || [], alt: altFor(view.pic, art, { hour, sprites: SPRITES }) };
  }
  const cover = art.pics && art.pics[STAND_IN.pic];
  if (!cover) return null;
  // The cover is drawn in its own dusk colors and shown with the day table, as the title shows it.
  return { ops: cover.ops, width: cover.width, height: cover.height, place: STAND_IN.pic, remap: 'day', y0: STAND_IN.y, hotspots: [], alt: [] };
}

/** Places drawn in this page load: a revisit, or a new hour, shows at once (11.4). */
const seen = new Set();
/** Forget the places seen (tests). */
export function forgetSeen() {
  seen.clear();
}

/**
 * A display that shows rows y0.. of a taller picture: present() takes the
 * whole picture's RGBA and passes the window on.
 * @param {{present: (rgba: Uint8ClampedArray) => void}} display
 * @param {number} width
 * @param {number} y0
 * @param {number} rows
 */
function windowed(display, width, y0, rows) {
  if (!y0) return display;
  return {
    present: (/** @type {Uint8ClampedArray} */ rgba) => display.present(rgba.subarray(y0 * width * 4, (y0 + rows) * width * 4)),
  };
}

/**
 * A sound that does nothing but keep the Sound state (C's ui/sound.js
 * takes its place: the same calls, and the same key, `sound`, "on" or
 * "off", default on).
 */
export function stubSound() {
  let on = load('sound') !== 'off';
  return {
    play(/** @type {string} */ _cue) {},
    isOn: () => on,
    setOn(/** @type {boolean} */ v) {
      on = Boolean(v);
      save('sound', on ? 'on' : 'off');
    },
    report: () => null,
  };
}

/**
 * @typedef {{play: (cue: string) => void, isOn: () => boolean, setOn: (on: boolean) => void}} Sound
 * @typedef {ReturnType<typeof import('./menu.js').createMenu>} Menu
 * @typedef {object} FrameCtx
 * @property {any} park rules.park, or null
 * @property {{pic: string, node: string, day: string[]} | null} view the stop's view (voice.json), or null
 * @property {number} day the trip's day
 * @property {string} hour
 * @property {any} art art.json, or null
 * @property {import('../gfx/palette.js').Palette | null} palette
 * @property {Composer | null} composer
 * @property {Sound} sound
 * @property {Menu} menu
 * @property {() => void} [rearm] the diamond's confirm opened: the game
 *   restarts its double-tap guard, so the second tap of a double tap on the
 *   diamond can't land on Yes (12.1)
 */

/**
 * The status line: header.status-line > span.status-score +
 * button.status-menu + button.status-sound.
 * @param {Document} doc
 * @param {FrameCtx} ctx
 */
function statusLine(doc, ctx) {
  const header = doc.createElement('header');
  header.className = 'status-line';
  const score = doc.createElement('span');
  score.className = 'status-score';
  const menu = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
  menu.className = 'status-menu';
  menu.setAttribute('type', 'button');
  menu.setAttribute('aria-label', t('trail.status.menu'));
  menu.setAttribute('data-t-aria', 'trail.status.menu'); // the line inspector finds a spoken name by it
  menu.setAttribute('aria-haspopup', 'dialog');
  menu.appendChild(
    pixelGlyph(
      doc,
      8,
      8,
      [
        [0, 1, 7, 1],
        [0, 4, 7, 1],
        [0, 7, 7, 1],
      ],
      'menu-glyph',
    ),
  );
  menu.addEventListener('click', () => ctx.menu.open());
  const sound = /** @type {HTMLButtonElement} */ (doc.createElement('button'));
  sound.className = 'status-sound';
  sound.setAttribute('type', 'button');
  const show = () => {
    const on = ctx.sound.isOn();
    sound.setAttribute('aria-pressed', String(on));
    tx(sound, on ? 'trail.status.sound_on' : 'trail.status.sound_off'); // t-ids: trail.status.sound_on, trail.status.sound_off
  };
  show();
  // Inside the tap: turning it on unlocks the sound (BUILD_PLAN 2.8).
  sound.addEventListener('click', () => {
    ctx.sound.setOn(!ctx.sound.isOn());
    show();
    if (typeof sound.getBoundingClientRect === 'function') snapWidth(sound);
  });
  header.appendChild(score);
  header.appendChild(menu);
  header.appendChild(sound);
  return { header, menu, sound };
}

/**
 * ≡'s flag while the update note waits (E.7): data-flag on the button,
 * following #update[hidden]. Returns a function that stops watching.
 * @param {Document} doc
 * @param {HTMLElement} button
 */
function watchUpdate(doc, button) {
  const update = doc.getElementById('update');
  const flag = () => {
    if (update && !update.hidden) button.setAttribute('data-flag', '');
    else button.removeAttribute('data-flag');
  };
  flag();
  if (!update || typeof MutationObserver !== 'function') return () => {};
  const obs = new MutationObserver(flag);
  obs.observe(update, { attributes: true, attributeFilter: ['hidden'] });
  return () => obs.disconnect();
}

/**
 * The first time the trail draws, the update note and the stamps move into
 * the ≡ sheet's foot: the same nodes, so their listeners keep working (five
 * taps on the build code open the debug menu from there).
 * @param {Document} doc
 * @param {Menu} menu
 */
export function adoptStamps(doc, menu) {
  const { foot } = menu.mount();
  const update = doc.getElementById('update');
  const stamp = doc.getElementById('build-stamp');
  const stamps = stamp ? /** @type {HTMLElement | null} */ (stamp.parentNode) : null;
  for (const n of [update, stamps]) if (n && n.parentNode !== foot) foot.appendChild(n);
}

/**
 * Draw a trail stop into host (the game screen): the frame's grid, with
 * S3's box and choices inside. onAct(action, cue) runs a choice's tap (the
 * game plays the cue after its double-tap guard). Returns what the game
 * needs: the box (null on a quiet stop), the buttons, the element to focus,
 * relayout() for a resize, and release() before the next screen.
 * @param {HTMLElement} host div.game-screen
 * @param {import('./stop.js').StopScreen} screen
 * @param {(act: Record<string, unknown>, cue: string) => void} onAct
 * @param {FrameCtx} ctx
 */
export function renderFrame(host, screen, onAct, ctx) {
  const doc = host.ownerDocument;
  const win = /** @type {(Window & typeof globalThis) | null} */ (doc.defaultView || null);
  host.classList.add('frame');
  host.setAttribute('data-hour', ctx.hour);
  const view = ctx.view;
  /** @type {(() => void)[]} */
  const stops = [];

  // The status line.
  const status = statusLine(doc, ctx);
  host.appendChild(status.header);
  stops.push(watchUpdate(doc, status.menu));

  // The picture: its canvas (hidden from VoiceOver), its alt text (an
  // element with role img, its words the parts' lines: gfx/alt.js), its
  // Look buttons over the canvas (ui/look.js), and its polite live region
  // (the confirm's prompt, the compass's result).
  const plan = picturePlan(view, ctx.art, ctx.hour, ctx.composer);
  const figure = doc.createElement('figure');
  figure.className = 'frame-picture';
  const canvas = /** @type {HTMLCanvasElement} */ (doc.createElement('canvas'));
  canvas.className = 'picture';
  canvas.setAttribute('aria-hidden', 'true');
  figure.appendChild(canvas);
  const alt = plan ? plan.alt : [];
  if (alt.length) {
    const img = doc.createElement('div');
    img.classList.add('vh', 'frame-alt');
    img.setAttribute('role', 'img');
    img.setAttribute('aria-label', alt.map((r) => t(r.id)).join(' ')); // t-ids: @art
    img.setAttribute('data-t-aria', alt[0].id); // the line inspector finds a spoken name by it
    img.setAttribute('data-t-alt', alt.map((r) => r.id).join(' '));
    figure.appendChild(img);
  }
  const placeId = view ? view.node : null;
  /** @param {string} kind @param {HTMLElement} button */
  const look = (kind, button) => openLook(figure, lookLines(kind, placeId), { opener: button, sound: ctx.sound });
  const looks = renderLooks(doc, plan ? plan.hotspots : [], ctx.art ? ctx.art.hotspots : null, look);
  if (looks.buttons.length) figure.appendChild(looks.layer);
  // A tap on the picture that hits no Look shows its alt text as the Look (King's Quest's LOOK at the room).
  figure.addEventListener('click', () => {
    if (host.hasAttribute('data-compass') || !alt.length) return;
    openLook(figure, alt, { sound: ctx.sound, flow: true });
  });
  const live = doc.createElement('p');
  live.classList.add('vh', 'frame-live');
  live.setAttribute('aria-live', 'polite');
  figure.appendChild(live);
  host.appendChild(figure);

  // The caption.
  const caption = doc.createElement('p');
  caption.className = 'frame-caption';
  const node = view && ctx.park && ctx.park.nodes ? ctx.park.nodes[view.node] : null;
  // A place the research gives no elevation (Lake #8) has no caption yet, rather than a wrong one.
  if (view && node && Number.isFinite(node.elev_ft)) tx(caption, 'trail.caption', { day: ctx.day, place: { id: `place.${view.node}` }, elev: feet(node.elev_ft) }); // t-ids: @places
  else if (view && node && doc.documentElement.dataset.channel !== 'main') console.warn(`frame: no elevation for ${view.node}, so no caption`);
  host.appendChild(caption);

  // The strip.
  const stripEl = doc.createElement('div');
  stripEl.className = 'frame-strip';
  host.appendChild(stripEl);
  /** @type {ReturnType<typeof renderStrip> | null} */
  let strip = null;
  if (view && ctx.park) {
    try {
      strip = renderStrip(stripEl, { park: ctx.park, view, palette: ctx.palette });
    } catch (e) {
      console.warn('frame: no strip for this view', e);
    }
  }

  // The box and the choices: S3's, with the cue each tap plays, the odds
  // intro before the box, the tags, the (i) square and its Why sheet, the
  // diamond's confirm, and an outcome's notes.
  const { screen: shown, intro } = withIntro(/** @type {any} */ (screen));
  /** @type {ReturnType<typeof openConfirm> | null} */
  let confirm = null;
  const drawn = drawnChoices(/** @type {any} */ (shown));
  /** @type {import('./textbox.js').Pager | null} */
  let pager = null;
  /** @param {Record<string, unknown>} a */
  const tap = (a) => {
    // While the box's pages remain, the choices are inert: a tap turns the page (12.1's ▾).
    if (pager && pager.waiting()) {
      pager.next();
      return;
    }
    const k = drawn.findIndex((c) => c.act.t === a.t && c.act.c === a.c);
    const c = k >= 0 ? drawn[k] : null;
    if (confirm) {
      confirm.close();
      confirm = null;
    }
    if (c && c.odds && c.odds.kind === 'diamond') {
      // 12.1: nothing critical happens on one brush of the thumb.
      ctx.sound.play('ui.tick');
      const button = st.buttons[k];
      confirm = openConfirm(button, c, {
        live,
        onYes: () => onAct(a, cueFor(a)),
        onClose: () => {
          confirm = null;
        },
      });
      // Yes and Not yet sit where the diamond was: a double tap's second tap is dropped there too.
      if (ctx.rearm) ctx.rearm();
      return;
    }
    onAct(a, cueFor(a));
  };
  const st = renderStop(host, /** @type {any} */ (shown), tap);
  const list = /** @type {HTMLElement} */ (host.querySelector('.game-choices'));
  // The ▾ continuation (ui/textbox.js): the choices show, inert, until the box's last page.
  if (st.box) {
    pager = continueBox(st.box, {
      onChange: (pg) => {
        const wait = pg.waiting();
        if (list) {
          if (wait) list.setAttribute('data-wait', '');
          else list.removeAttribute('data-wait');
        }
        for (const b of st.buttons) {
          if (wait) b.setAttribute('aria-disabled', 'true');
          else b.removeAttribute('aria-disabled');
        }
      },
    });
  }
  addTags(/** @type {any} */ (shown), st.buttons);
  /** @param {any} c @param {HTMLElement | null} opener */
  const why = (c, opener) => {
    ctx.sound.play('ui.open');
    if (c.why) openWhy(doc, { label: c.label, why: c.why, opener });
  };
  if (list) addInfo(list, /** @type {any} */ (shown), st.buttons, (c, sq) => why(c, sq));
  // With the fatal share's intro, the sure way is outlined (8.7).
  if (intro === 'fatal') for (const b of st.buttons) if (b.hasAttribute('data-sure')) b.classList.add('choice-ring');
  // A long press on a rolled choice opens its Why sheet (12.1's accelerator), unless the line inspector listens.
  const stopPress = onLongPress(doc, {
    find: (/** @type {any} */ target) => {
      if (doc.documentElement.hasAttribute('data-inspect')) return null;
      for (let at = target; at && at !== host; at = at.parentNode) {
        if (at.getAttribute && at.hasAttribute('data-choice')) {
          const c = drawn[Number(at.getAttribute('data-choice'))];
          return c && c.why ? { c, el: at } : null;
        }
      }
      return null;
    },
    run: (/** @type {{c: any, el: HTMLElement}} */ hit) => why(hit.c, hit.el),
  });
  stops.push(stopPress);
  if (list && /** @type {any} */ (shown).outcome) list.insertBefore(renderOutcome(doc, /** @type {any} */ (shown)), list.firstChild);
  if (!st.box) caption.setAttribute('tabindex', '-1');

  // The toolbar, or (short) its three in the ≡ sheet.
  const layout = measure(host, win, screen.choices.length, drawn.filter((c) => c.odds && c.odds.kind === 'diamond').length);
  const short = layout ? layout.short : false;
  host.setAttribute('data-short', short ? '1' : '0');
  if (!short) host.appendChild(renderToolbar(doc));
  ctx.menu.setRows(short ? menuRows(doc) : []);
  adoptStamps(doc, ctx.menu);

  // The picture's pixels: only where there's a canvas to draw on (not in Node's tests).
  /** @type {ReturnType<typeof createDisplay> | null} */
  let display = null;
  let stopCycles = () => {};
  /** @type {{finish: () => void, readonly done: boolean} | null} */
  let run = null;
  const preview = doc.documentElement.dataset.channel !== 'main';
  // (With no art.json at all, the title page has said so already.)
  if (!plan && ctx.art && preview) console.warn(`frame: no picture for ${view ? view.pic : screen.stop ? screen.stop.id : '?'} yet`);
  if (plan && !ctx.composer && preview) console.info(`frame: the cover stands in for ${view ? view.pic : '?'} until the composer lands`);
  if (win && typeof canvas.getContext === 'function') {
    display = createDisplay(canvas, PIC.width, PIC.height);
    const relayoutAll = () => {
      const l = measure(host, win, screen.choices.length, drawn.filter((c) => c.odds && c.odds.kind === 'diamond').length);
      if (!l || !display) return;
      snapWidth(status.sound);
      display.layout({ cssWidth: win.innerWidth, screenHeight: screenHeight(win), maxCssHeight: l.maxCssHeight });
      if (strip) strip.relayout(display.shape, screenHeight(win));
      display.snap();
      const dpr = win.devicePixelRatio || 1;
      looks.place({ ...display.shape, dpr, ox: canvasInset(display.shape.sx, dpr) });
      if (pager) pager.relayout();
    };
    relayoutAll();
    if (plan && ctx.palette) {
      const reduced = reducedMotion();
      const first = !seen.has(plan.place);
      const result = renderPic(plan.ops, { width: plan.width, height: plan.height, stamps: ctx.art.stamps, record: !reduced && first });
      seen.add(plan.place);
      const shown = windowed(display, plan.width, plan.y0, PIC.height);
      const remap = remapFor(ctx.palette, plan.remap);
      const palette = ctx.palette;
      run = playDrawIn({
        result,
        palette,
        display: /** @type {any} */ (shown),
        remap,
        reduced,
        onDone(final) {
          // The water shimmers and the stars twinkle, unless Reduce Motion is
          // on (11.5), and they stop (or start) when it changes mid-stop (ui/motion.js).
          stopCycles = liveCycles(() => startCycles(/** @type {any} */ (shown), final, plan.width, palette, { remap }));
        },
      });
      // Reduce Motion turned on mid-draw: the picture shows finished.
      stops.push(onMotionChange((on) => on && run && run.finish()));
      // The first tap on the picture while it draws in only finishes the draw-in, before any Look.
      const firstTap = (/** @type {Event} */ event) => {
        if (!run || run.done) return;
        event.preventDefault();
        event.stopPropagation();
        run.finish();
      };
      figure.addEventListener('click', firstTap, true);
    }
    // Back in the foreground the text size may have changed (ui/textsize.js
    // reads it first: it listened first), and the Plain rows with it.
    const onVisible = () => {
      if (doc.visibilityState === 'visible') relayoutAll();
    };
    win.addEventListener('resize', relayoutAll);
    win.addEventListener('orientationchange', relayoutAll);
    doc.addEventListener('visibilitychange', onVisible);
    stops.push(() => {
      win.removeEventListener('resize', relayoutAll);
      win.removeEventListener('orientationchange', relayoutAll);
      doc.removeEventListener('visibilitychange', onVisible);
    });
    // The box's overflow can only be measured once the fonts have laid it out.
    if (doc.fonts && doc.fonts.ready)
      doc.fonts.ready.then(() => {
        if (pager) pager.relayout();
        checkBox(st.box);
      });
  }

  /** @type {ReturnType<typeof playCompass> | null} */
  let spin = null;
  return {
    box: st.box,
    buttons: st.buttons,
    /** What takes focus on a new stop: the box, or on a quiet stop the caption. */
    focus: st.box || caption,
    /** The live region the confirm and the compass speak in. */
    live,
    /** The box's pages (the ▾), or null on a quiet stop. */
    pager,
    /** The picture's Look buttons (ui/look.js), and what a tap off them shows: its alt text. */
    looks,
    alt,
    /**
     * The compass roll (ui/compass.js) in this stop's picture: the box and
     * the choices inert, a tap anywhere skips to rest and then on. Resolves
     * when the outcome's turn comes (at once with no canvas, in Node).
     * @param {import('./compass.js').CompassRoll} roll the outcome screen's roll
     * @param {number} u the rest draw (restDraw)
     * @param {{reduced?: boolean, now?: () => number, frame?: (f: () => void) => unknown, later?: (f: () => void, ms: number) => unknown}} [o]
     * @returns {Promise<void>}
     */
    compass(roll, u, o = {}) {
      closeWhy(doc);
      closeLook(figure);
      looks.layer.hidden = true;
      if (confirm) confirm.close();
      const pal = ctx.palette;
      if (!display || !pal) return Promise.resolve();
      if (run) run.finish();
      stopCycles();
      host.setAttribute('data-compass', '');
      const shownDisplay = display;
      return new Promise((resolve) => {
        const onTap = () => spin && spin.tap();
        host.addEventListener('click', onTap, true);
        stops.push(() => host.removeEventListener('click', onTap, true));
        spin = playCompass({
          display: shownDisplay,
          palette: pal,
          roll,
          u,
          reduced: o.reduced === undefined ? reducedMotion() : o.reduced,
          sound: ctx.sound,
          live,
          ...(o.now ? { now: o.now } : {}),
          ...(o.frame ? { frame: o.frame } : {}),
          ...(o.later ? { later: o.later } : {}),
          done: () => {
            host.removeEventListener('click', onTap, true);
            resolve();
          },
        });
      });
    },
    release() {
      if (spin) spin.stop();
      // The compass's inert box and choices end with this stop (the host is the next one's too).
      host.removeAttribute('data-compass');
      closeWhy(doc);
      closeLook(figure);
      if (run) run.finish();
      stopCycles();
      for (const s of stops) s();
      if (display) display.release();
      if (strip) strip.release();
    },
  };
}

/**
 * Give an element a whole number of CSS pixels of width (its text's width
 * is a whole number of font pixels, which layout rounds to 1/64 px): so
 * what is right-aligned after it, like Sound:on, starts its glyphs on a
 * whole device pixel and stays crisp.
 * @param {HTMLElement} el
 */
function snapWidth(el) {
  el.style.width = '';
  const w = el.getBoundingClientRect().width;
  if (w > 0) el.style.width = `${Math.ceil(w - 0.01)}px`;
}

/**
 * Where the picture starts inside its canvas, in device pixels: the canvas
 * is a whole number of CSS px wide, and the picture is centered in it
 * (gfx/display.js layout), so a pixel or two may stay ink at its left.
 * @param {number} sx
 * @param {number} dpr
 */
export function canvasInset(sx, dpr) {
  const pw = PIC.width * sx;
  const bw = Math.round(Math.ceil(pw / dpr - 1e-6) * dpr);
  return (bw - pw) >> 1;
}

/** @param {Window} win */
function screenHeight(win) {
  const s = win.screen;
  return s ? Math.max(s.width, s.height) : win.innerHeight;
}

/**
 * The frame's layout on this screen, with its CSS numbers set on host:
 * --col (the column), --col-x and --pic-x (their left edges) and --mat
 * (the ink between the picture's keyline and the picture). Null
 * without a window.
 * @param {HTMLElement} host
 * @param {(Window & typeof globalThis) | null} win
 * @param {number} choices
 * @param {number} [tall] of them 64 pt (a diamond)
 */
function measure(host, win, choices, tall = 0) {
  if (!win) return null;
  const l = frameLayout({ width: win.innerWidth, height: screenHeight(win), dpr: win.devicePixelRatio || 1, usable: host.clientHeight || win.innerHeight, choices, tall, plainPx: plainSizeOf(host.ownerDocument, win) });
  host.style.setProperty('--col', `${l.column}px`);
  host.style.setProperty('--col-x', `${l.x.column}px`);
  host.style.setProperty('--pic-x', `${l.x.picture}px`);
  host.style.setProperty('--mat', `${l.mat}px`);
  return l;
}

/**
 * Register the dev control *hour* (auto, day, dusk, blue hour, night) and
 * the dev action *Scenes* (#frame). onHour runs after the hour changes, so
 * the game draws the stop again (at once: the place is seen).
 * @param {{onHour?: () => void, openScenes?: () => void}} [o]
 */
export function registerFrameDev({ onHour, openScenes } = {}) {
  registerDevControl({
    id: HOUR_KEY,
    label: 'dev.hour',
    options: [
      { value: 'auto', label: 'dev.hour.auto' },
      { value: 'day', label: 'dev.hour.day' },
      { value: 'dusk', label: 'dev.hour.dusk' },
      { value: 'blue', label: 'dev.hour.blue' },
      { value: 'night', label: 'dev.hour.night' },
    ],
    get: savedHour,
    set: (v) => {
      save(HOUR_KEY, v);
      if (onHour) onHour();
    },
  });
  registerDevAction({
    id: 'scenes',
    label: 'dev.scenes',
    run: ({ close }) => {
      close();
      if (openScenes) openScenes();
    },
  });
}

// ---- The #frame check view (preview, debug mode) ----------------------

/** The address of the check view (the dev action Scenes sets it). */
export const SCENES_HASH = '#frame';
const SCENES_ID = 'frame-sheet';
/** The check view's place for a picture that is no park node: the first sample stop's. */
export const SCENES_FALLBACK_NODE = 'deer_lake';
/** @type {{release: () => void, menu: Menu} | null} the open check view's frame, and the ≡ sheet it shares with the game */
let scenes = null;
/** The check view's hours, with their dev words. */
const HOUR_WORDS = Object.freeze([
  ['day', 'dev.hour.day'],
  ['dusk', 'dev.hour.dusk'],
  ['blue', 'dev.hour.blue'],
  ['night', 'dev.hour.night'],
]);

/** The check view's fixtures, by the choices they show (S6: four, the 15's budget, lint T02's). */
export const FIXTURES = Object.freeze(['three', 'four']);
/** Each fixture's dev words in the picker. */
const FIXTURE_WORDS = Object.freeze({ three: 'dev.fixture.three', four: 'dev.fixture.four' });

/**
 * A fixture screen the check view shows: a three-paragraph box from the
 * two sample lines, and three choices: Walk on, and two whose labels are
 * the sample lines' ids (shown as data), the second with the (i) square.
 * The four-choice fixture (S6) adds a third with its (i), the 15's budget
 * (12.1, lint T02), so its box continues with ▾ there and on any phone.
 * @param {string} [which] a FIXTURES id
 */
export function fixtureScreen(which = 'three') {
  const a = 'trail.deer_lake_rim.deer_lake';
  const b = 'trail.deer_lake_rim.rim';
  const choices = [
    { act: { t: 'next' }, label: null, enabled: true },
    { act: { t: 'choose', c: 'one' }, label: { id: a }, enabled: true },
    { act: { t: 'choose', c: 'two' }, label: { id: b }, enabled: true, info: { fixture: true } },
  ];
  if (which === 'four') choices.push({ act: { t: 'choose', c: 'three' }, label: { id: a }, enabled: true, info: { fixture: true } });
  return {
    phase: 'trailhead',
    stop: { set: 'deer_lake_rim', id: 'deer_lake', n: 1 },
    box: [{ id: a }, { id: b }, { id: a }],
    choices,
  };
}

/**
 * The pictures the check view offers: every place the composer can draw
 * (art.json's recipes), or the stand-in alone before the composer lands.
 * @param {any} art
 * @param {Composer | null} composer
 */
export function scenePics(art, composer) {
  if (composer && art && art.recipes && art.recipes.places) return Object.keys(art.recipes.places).filter((p) => composer.drawable(p, art)).sort();
  return art && art.pics && art.pics[STAND_IN.pic] ? [STAND_IN.pic] : [];
}

/**
 * Open the check view over the game: a full-screen sheet holding a frame
 * (the fixture screen, the chosen picture at the chosen hour) and, under
 * it, the pickers and ×. × clears the hash; any other hash closes it too
 * (ui/app.js). The game releases its own frame first, so the page never
 * holds more than three canvases (E.10).
 * @param {Document} doc
 * @param {Omit<FrameCtx, 'view' | 'hour'> & {onClose: () => void}} ctx
 */
export function showScenes(doc, ctx) {
  hideScenes(doc);
  // The ≡ sheet is the game's: it opens over the view (frame.css) and never
  // stays open behind it, or after it.
  ctx.menu.close();
  const pics = scenePics(ctx.art, ctx.composer);
  let pic = pics[0] || STAND_IN.pic;
  let hour = 'day';
  let fixture = FIXTURES[0];
  const sheet = doc.createElement('div');
  sheet.className = 'frame-sheet';
  sheet.id = SCENES_ID;
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', t('dev.scenes'));
  const host = doc.createElement('div');
  host.className = 'game-screen';
  const picker = doc.createElement('div');
  picker.className = 'scenes-picker';
  sheet.appendChild(host);
  sheet.appendChild(picker);
  doc.body.appendChild(sheet);
  /** @type {{release: () => void} | null} */
  let frame = null;

  const draw = () => {
    if (frame) frame.release();
    while (host.firstChild) host.removeChild(host.firstChild);
    host.className = 'game-screen';
    // The picture's own place for the strip and the caption (a picture that
    // is no park node takes the first sample stop's). Preview ships every
    // recipe place's gazetteer name (build.mjs viewNames); a junction whose
    // label is ours (T16) has no name to show, so its caption stays empty
    // rather than show another place's or a missing-id marker.
    const node = ctx.park && ctx.park.nodes && ctx.park.nodes[pic] ? pic : SCENES_FALLBACK_NODE;
    const named = wordsOf(`place.${node}`) !== undefined;
    const view = { pic, node, day: ['sol_duc_trailhead', node] };
    frame = renderFrame(host, fixtureScreen(fixture), () => {}, { ...ctx, view, hour });
    if (!named) {
      const caption = /** @type {HTMLElement} */ (host.querySelector('.frame-caption'));
      while (caption.firstChild) caption.removeChild(caption.firstChild);
      caption.removeAttribute('data-t');
      caption.removeAttribute('data-t-state');
    }
    // The fixture's labels are line ids, shown as data.
    for (const label of host.querySelectorAll('.choice-label')) {
      const id = label.getAttribute('data-t');
      if (id && id !== 'trail.walk_on') {
        label.textContent = id;
        label.removeAttribute('data-t-state');
      }
    }
    drawPicker();
  };

  const drawPicker = () => {
    while (picker.firstChild) picker.removeChild(picker.firstChild);
    const row = (/** @type {string} */ cls) => {
      const r = doc.createElement('div');
      r.className = `marks ${cls}`;
      picker.appendChild(r);
      return r;
    };
    const pickRow = row('scenes-pics');
    for (const p of pics) {
      const b = doc.createElement('button');
      b.className = 'marks-mode';
      b.setAttribute('type', 'button');
      b.setAttribute('aria-pressed', String(p === pic));
      b.textContent = p; // a picture's id, shown as data
      b.addEventListener('click', () => {
        pic = p;
        draw();
      });
      pickRow.appendChild(b);
    }
    const hourRow = row('scenes-hours');
    for (const [h, id] of HOUR_WORDS) {
      const b = doc.createElement('button');
      b.className = 'marks-mode';
      b.setAttribute('type', 'button');
      b.setAttribute('aria-pressed', String(h === hour));
      tx(b, id); // t-ids: dev.hour.day, dev.hour.dusk, dev.hour.blue, dev.hour.night
      b.addEventListener('click', () => {
        hour = h;
        draw();
      });
      hourRow.appendChild(b);
    }
    const fixtureRow = row('scenes-fixtures');
    for (const f of FIXTURES) {
      const b = doc.createElement('button');
      b.className = 'marks-mode';
      b.setAttribute('type', 'button');
      b.setAttribute('aria-pressed', String(f === fixture));
      tx(b, /** @type {Record<string, string>} */ (FIXTURE_WORDS)[f]); // t-ids: dev.fixture.three, dev.fixture.four
      b.addEventListener('click', () => {
        fixture = f;
        draw();
      });
      fixtureRow.appendChild(b);
    }
    const close = doc.createElement('button');
    close.className = 'map-close';
    close.setAttribute('type', 'button');
    close.setAttribute('aria-label', t('dev.close'));
    close.textContent = '×';
    close.addEventListener('click', () => ctx.onClose());
    picker.appendChild(close);
  };

  draw();
  scenes = {
    release() {
      if (frame) frame.release();
      frame = null;
    },
    menu: ctx.menu,
  };
  return scenes;
}

/**
 * Close the check view, if it is open.
 * @param {Document} doc
 */
export function hideScenes(doc) {
  if (scenes) {
    scenes.release();
    scenes.menu.close();
  }
  scenes = null;
  const sheet = doc.getElementById(SCENES_ID);
  if (!sheet) return false;
  if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
  return true;
}
