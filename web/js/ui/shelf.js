// The title page (GAME_DESIGN 12.3): the cover drawing itself in at dusk,
// the title, the bookshelf (empty until the trail opens), the Add to Home
// Screen line, and the edition stamp. The Trail Register and the books
// arrive with the engine.

import { renderPic } from '../gfx/picvm.js';
import { makePalette } from '../gfx/palette.js';
import { createDisplay, startCycles } from '../gfx/display.js';
import { playDrawIn } from '../gfx/drawin.js';

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

/** True when the book runs from the Home Screen, not in a Safari tab. */
export function isInstalled() {
  // iOS sets navigator.standalone; other browsers report display-mode.
  const nav = /** @type {any} */ (navigator);
  if (nav.standalone === true) return true;
  return typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches;
}

function reducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function px(v) {
  return parseFloat(v) || 0;
}

/** Resolves once the phone is upright, so the draw-in plays where it can be seen. */
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
 * Show the title page.
 * @param {Document} doc
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
  if (doc.fonts) doc.fonts.ready.then(fit);
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);

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
        // The stars twinkle, unless Reduce Motion is on (doc 11.5).
        if (!reduced) stopCycles = startCycles(display, final, pic.width, palette, { remap: 'day' });
      },
    });
    // A tap anywhere finishes the draw-in.
    const skip = () => run.finish();
    doc.addEventListener('pointerdown', skip, { once: true });
    doc.addEventListener('keydown', skip, { once: true });
    return { finish: run.finish, stop: () => stopCycles() };
  } catch (err) {
    plate.classList.remove('drawing');
    throw err;
  }
}
