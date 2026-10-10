// The title page (until the cabin replaces it, S7; GAME_DESIGN 12.3): the
// cover drawing itself in at dusk, the name, the update note, the install
// line and the stamps. This file becomes the cabin (BUILD_PLAN 2.5).
//
// On preview from S3 the title page is the loading art: showTitle's `done`
// settles when the draw-in has finished (or a tap finished it, or at once
// under Reduce Motion), and the game (ui/app.js) takes the page then.
// opensGame() is the gate: only a build whose <html data-screens> lists the
// guestbook and trail screens loads the game, so main's page never does.

import { renderPic } from '../gfx/picvm.js';
import { makePalette } from '../gfx/palette.js';
import { createDisplay, startCycles } from '../gfx/display.js';
import { playDrawIn } from '../gfx/drawin.js';
import { isInstalled } from '../platform/sw-client.js';
import { reducedMotion, liveCycles } from './motion.js';

const ART_URL = new URL('../../art/art.json', import.meta.url);
const COVER = 'cover_high_divide_dusk';
const PLATE = { width: 160, height: 320 };
/**
 * The title stays within the cover's top rows of quiet navy sky (see the
 * .pic header, which keeps at least this many clear of the dithered bands).
 */
const TITLE_ROWS = 88;
/** Held sideways: the title page hides behind the plate. Same query as game.css. */
const SIDEWAYS = '(orientation: landscape) and (max-height: 540px)';
/** The screens a build needs before it loads the game (content/scope/m1a.json; BUILD_PLAN S3). */
export const GAME_SCREENS = Object.freeze(['guestbook', 'trail']);

/**
 * Pure: does this build carry the game? True when <html data-screens>
 * (stamped by the build from the scope file) lists every one of
 * GAME_SCREENS. Main's lists app, debug and title, so main never loads it.
 * @param {Document} doc
 */
export function opensGame(doc) {
  const screens = String(doc.documentElement.getAttribute('data-screens') || '').split(/\s+/);
  return GAME_SCREENS.every((s) => screens.includes(s));
}

/** @param {string} v a CSS length */
function px(v) {
  return parseFloat(v) || 0;
}

/**
 * Resolves once the phone is upright, so the draw-in plays where it can be seen.
 * @returns {Promise<void>}
 */
function whenUpright() {
  if (typeof matchMedia !== 'function') return Promise.resolve();
  const mq = matchMedia(SIDEWAYS);
  if (!mq.matches) return Promise.resolve();
  return new Promise((done) => {
    const onChange = () => {
      if (mq.matches) return;
      mq.removeEventListener('change', onChange);
      done();
    };
    mq.addEventListener('change', onChange);
  });
}

/**
 * Show the title page. Resolves once the draw-in has started, to
 * {finish, stop, done}: finish() ends the draw-in, stop() ends the stars and
 * the page's resize handling (the game calls it when it takes the page), and
 * done settles when the picture has finished drawing.
 * @param {Document} doc
 * @returns {Promise<{finish: () => void, stop: () => void, done: Promise<void>}>}
 */
export async function showTitle(doc = document) {
  const install = doc.getElementById('install');
  if (install && isInstalled()) install.hidden = true;

  const plate = /** @type {HTMLElement} */ (doc.getElementById('plate'));
  const canvas = /** @type {HTMLCanvasElement} */ (doc.getElementById('cover'));
  const shelf = /** @type {HTMLElement} */ (doc.getElementById('shelf'));
  const main = /** @type {HTMLElement} */ (doc.getElementById('app'));

  let display = createDisplay(canvas, PLATE.width, PLATE.height);
  const fit = () => {
    const cs = getComputedStyle(main);
    const padX = px(cs.paddingLeft) + px(cs.paddingRight);
    const padY = px(cs.paddingTop) + px(cs.paddingBottom);
    // Leave the shelf room for what it holds; the picture takes the rest.
    const ss = getComputedStyle(shelf);
    const kids = Array.from(shelf.children).filter((k) => !(/** @type {HTMLElement} */ (k).hidden));
    const shelfNeeds =
      kids.reduce((h, k) => h + /** @type {HTMLElement} */ (k).offsetHeight, 0) +
      px(ss.rowGap) * Math.max(0, kids.length - 1) +
      px(ss.paddingTop) +
      px(ss.paddingBottom);
    const shape = display.layout({
      cssWidth: main.clientWidth - padX,
      screenHeight: Math.max(screen.width, screen.height),
      maxCssHeight: window.innerHeight - padY - Math.max(160, shelfNeeds),
    });
    // The title is sized to the plate, not the window, and kept inside the
    // plate's quiet sky: on the SE's flat 4x2 pixel that sky is only 88 pt.
    const dpr = window.devicePixelRatio || 1;
    plate.style.setProperty('--plate-w', `${(PLATE.width * shape.sx) / dpr}px`);
    plate.style.setProperty('--title-room', `${(TITLE_ROWS * shape.sy) / dpr}px`);
    // Centering lands the plate on a fraction of a pixel (text heights are
    // fractional). Nudge it onto whole CSS pixels, which are whole device
    // pixels at any pixel ratio, with a relative offset that moves nothing
    // else. Then display.snap() finds nothing to correct and the canvas needs
    // no sub-pixel transform, which compositors smear at its edges.
    plate.style.left = '0px';
    plate.style.top = '0px';
    const r = plate.getBoundingClientRect();
    plate.style.left = `${Math.round(r.left) - r.left}px`;
    plate.style.top = `${Math.round(r.top) - r.top}px`;
    display.snap();
  };
  fit();
  let fitting = true;
  if (doc.fonts) doc.fonts.ready.then(() => fitting && fit());
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);
  // The update note and the offline stamp appear later (sw-client.js).
  window.addEventListener('oph:layout', fit);
  const unfit = () => {
    fitting = false;
    window.removeEventListener('resize', fit);
    window.removeEventListener('orientationchange', fit);
    window.removeEventListener('oph:layout', fit);
  };
  /** @type {() => void} */
  let drawn = () => {};
  /** @type {Promise<void>} */
  const done = new Promise((resolve) => {
    drawn = resolve;
  });

  const reduced = reducedMotion();
  // The page starts with the title held back (class "drawing"); it steps in
  // when the picture is done, or at once under Reduce Motion.
  if (reduced) plate.classList.remove('drawing');
  try {
    const res = await fetch(ART_URL);
    if (!res.ok) throw new Error(`art: ${res.status}`);
    const art = await res.json();
    const pic = art.pics[COVER];
    if (pic.width !== PLATE.width || pic.height !== PLATE.height) {
      display.release();
      display = createDisplay(canvas, pic.width, pic.height);
      fit();
    }
    const palette = makePalette(art.palette);
    const result = renderPic(pic.ops, {
      width: pic.width,
      height: pic.height,
      stamps: art.stamps,
      record: !reduced,
    });
    let stopCycles = () => {};
    // Opened sideways, the draw-in waits for the phone to turn upright. (The
    // title's CSS fallback doesn't run while the page is hidden either.)
    await whenUpright();
    const run = playDrawIn({
      result,
      palette,
      display,
      remap: 'day', // the cover is drawn in its own dusk colors
      reduced,
      onDone(final) {
        plate.classList.remove('drawing');
        // The stars twinkle, unless Reduce Motion is on (doc 11.5), and stop
        // (or start) when it changes while the title shows (ui/motion.js).
        stopCycles = liveCycles(() => startCycles(display, final, pic.width, palette, { remap: 'day' }));
        drawn();
      },
    });
    // A tap anywhere finishes the draw-in.
    const skip = () => run.finish();
    doc.addEventListener('pointerdown', skip, { once: true });
    doc.addEventListener('keydown', skip, { once: true });
    return {
      finish: run.finish,
      stop: () => {
        stopCycles();
        unfit();
        doc.removeEventListener('pointerdown', skip);
        doc.removeEventListener('keydown', skip);
      },
      done,
    };
  } catch (err) {
    plate.classList.remove('drawing');
    drawn();
    throw err;
  }
}
