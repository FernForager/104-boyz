// Crisp pictures on the phone (GAME_DESIGN 11.2, E.10).
//
// A picture is a small index buffer (160 wide). It is drawn once onto a
// canvas whose backing store is a whole-number multiple of it in DEVICE
// pixels: sx across and sy down, so every picture pixel is the same block
// of real pixels, with smoothing off. sx is the widest whole multiple that
// fits; sy keeps AGI's wide pixel (about 5:3, so sy is about 0.6 sx), and
// short screens (under about 700 pt) use the flatter 2:1 pixel to leave
// the text room. That gives the doc's table: 7x4 on the iPhone 15 and 16,
// 8x5 on the Plus and Pro Max, 6x4 on the 13 mini, 4x2 on the SE. No shape
// is ever flatter than 2:1 (a 3x1 or 5x2 pixel squashes the picture: the
// next shape down is taken instead, 2x1 or 4x2), and a screen with hit
// areas on its picture (the cabin) can ask for a smallest pixel, in
// points, that its shape never goes under (minPixel).

import { resolve, toRGBA, hasCycles, CYCLE_FPS, PALETTE } from './palette.js';

/** sy is about sx times this: AGI's double-wide pixel on a 4:3 screen. */
export const PIXEL_ASPECT = 0.6;
/** Screens shorter than this (in points) use the 2:1 pixel. */
export const SHORT_SCREEN_PT = 700;

/**
 * Choose the pixel shape. Pure, so Node tests it.
 * @param {object} o
 * @param {number} o.cssWidth  layout width available (CSS px = points)
 * @param {number} o.screenHeight the screen's portrait height (points)
 * @param {number} o.dpr devicePixelRatio
 * @param {number} [o.picWidth] picture width in picture pixels (160)
 * @param {number} [o.picHeight] picture height, to fit maxCssHeight
 * @param {number} [o.maxCssHeight] the most height the picture may take
 * @param {number} [o.margin] points kept free across (2)
 * @param {number} [o.maxCssWidth] the widest column (440)
 * @param {readonly number[]} [o.minPixel] the smallest picture pixel, [width, height] in points, the
 *   shape may step down to for height: when no shape at least that big fits, the one of them that
 *   is least tall (the widest of those) is taken, fitting or not (the cabin's hit areas: 44 pt)
 * @returns {{sx: number, sy: number, short: boolean}}
 */
export function pickPixelShape(o) {
  const dpr = o.dpr > 0 ? o.dpr : 1;
  const picW = o.picWidth || 160;
  const margin = o.margin === undefined ? 2 : o.margin;
  const avail = Math.min(o.cssWidth, o.maxCssWidth || 440) - margin;
  const short = o.screenHeight < SHORT_SCREEN_PT;
  const syFor = (/** @type {number} */ sx) => Math.max(1, short ? Math.floor(sx / 2) : Math.round(sx * PIXEL_ASPECT));
  // Never flatter than 2:1: the next shape down that isn't.
  const flat = (/** @type {number} */ sx) => 2 * syFor(sx) < sx;
  const down = (/** @type {number} */ sx) => {
    let s = sx - 1;
    while (s > 1 && flat(s)) s--;
    return Math.max(1, s);
  };
  let sx = Math.max(1, Math.floor((avail * dpr + 1e-6) / picW));
  if (sx > 1 && flat(sx)) sx = down(sx);
  if (o.picHeight && o.maxCssHeight) {
    const picH = o.picHeight;
    const maxH = o.maxCssHeight;
    const top = sx;
    while (sx > 1 && (picH * syFor(sx)) / dpr > maxH) sx = down(sx);
    const min = o.minPixel;
    const holds = (/** @type {number} */ s) => !min || (s / dpr >= min[0] - 1e-9 && syFor(s) / dpr >= min[1] - 1e-9);
    if (!holds(sx)) {
      // Too short for every shape that keeps the smallest pixel: the least tall of those (the widest).
      let best = 0;
      for (let s = top; s >= 1; s = down(s)) {
        if (holds(s) && (!best || syFor(s) < syFor(best))) best = s;
        if (s === 1) break;
      }
      if (best) sx = best;
    }
  }
  return { sx, sy: syFor(sx), short };
}

/**
 * A picture on a canvas: one small source canvas, one visible canvas,
 * one drawImage a frame.
 *
 * Layout works in 1/64ths of a CSS pixel (WebKit and Blink alike), so a
 * canvas 1120 device pixels wide can't be exactly 373.33 CSS px: the browser
 * would squeeze it by a fraction and every few rows would come out a pixel
 * short. So the canvas gets a whole number of CSS px, its backing store
 * exactly that many device pixels, and the picture is drawn into it at its
 * exact sx x sy blocks; the pixel or two left over stay ink. Then the canvas
 * is nudged onto whole pixels.
 * @param {HTMLCanvasElement} canvas
 * @param {number} width picture width
 * @param {number} height picture height
 * @param {string} [edge] the color of any leftover device pixels (ink, slot 0)
 */
export function createDisplay(canvas, width, height, edge = PALETTE[0]) {
  const src = document.createElement('canvas');
  src.width = width;
  src.height = height;
  const sctx = /** @type {CanvasRenderingContext2D} */ (src.getContext('2d'));
  const img = sctx.createImageData(width, height);
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', { alpha: false }));
  let shape = { sx: 1, sy: 1, short: false };
  let dpr = 1;
  let ox = 0;
  let oy = 0;
  /** @type {ArrayLike<number> | null} */
  let last = null;

  function snap() {
    canvas.style.transform = '';
    const r = canvas.getBoundingClientRect();
    let fx;
    let fy;
    if (Number.isInteger(dpr)) {
      // Whole CSS pixels are whole device pixels.
      fx = Math.round(r.left) - r.left;
      fy = Math.round(r.top) - r.top;
    } else {
      fx = (Math.round(r.left * dpr) - r.left * dpr) / dpr;
      fy = (Math.round(r.top * dpr) - r.top * dpr) / dpr;
    }
    if (Math.abs(fx) > 1e-3 || Math.abs(fy) > 1e-3) canvas.style.transform = `translate(${fx}px, ${fy}px)`;
  }

  /** @param {ArrayLike<number>} rgba RGBA bytes, width x height */
  function present(rgba) {
    last = rgba;
    img.data.set(rgba);
    sctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, ox, oy, width * shape.sx, height * shape.sy);
  }

  return {
    get shape() {
      return shape;
    },
    /** Where the picture starts in the canvas's backing store (device px): the leftover pixels split either side (S7b: the title screen's label is placed from it). */
    get origin() {
      return { ox, oy };
    },
    /**
     * Size the canvas for this screen.
     * @param {{cssWidth: number, screenHeight: number, maxCssHeight?: number, margin?: number, maxCssWidth?: number, minPixel?: readonly number[]}} opts
     */
    layout(opts) {
      dpr = window.devicePixelRatio || 1;
      shape = pickPixelShape({ dpr, picWidth: width, picHeight: height, ...opts });
      const pw = width * shape.sx;
      const ph = height * shape.sy;
      const cssW = Math.ceil(pw / dpr - 1e-6);
      const cssH = Math.ceil(ph / dpr - 1e-6);
      const bw = Math.round(cssW * dpr);
      const bh = Math.round(cssH * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      ox = (bw - pw) >> 1;
      oy = 0;
      ctx.fillStyle = edge;
      ctx.fillRect(0, 0, bw, bh);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.dataset.pixel = `${shape.sx}x${shape.sy}`;
      if (last) present(last);
      return shape;
    },
    snap,
    present,
    /** Free the backing stores (iOS caps canvas memory). */
    release() {
      canvas.width = 0;
      canvas.height = 0;
      src.width = 0;
      src.height = 0;
    },
  };
}

/**
 * Run the palette cycles (stars, water) at 8 fps while the page is
 * visible. Returns a stop function. Does nothing for a still picture.
 * @param {ReturnType<typeof createDisplay>} display
 * @param {Uint8Array} indices composited picture (0-29, 255)
 * @param {number} width
 * @param {import('./palette.js').Palette} pal makePalette()
 * @param {{remap?: string, background?: number}} [o]
 */
export function startCycles(display, indices, width, pal, o = {}) {
  if (!hasCycles(indices)) return () => {};
  const slots = new Uint8Array(indices.length);
  const rgba = new Uint8ClampedArray(indices.length * 4);
  let raf = 0;
  let shown = -1;
  let t0 = -1;
  const tick = (/** @type {number} */ now) => {
    if (t0 < 0) t0 = now;
    const frame = Math.floor(((now - t0) * CYCLE_FPS) / 1000);
    if (frame !== shown) {
      shown = frame;
      resolve(indices, width, pal, { ...o, frame }, slots);
      display.present(toRGBA(slots, pal, rgba));
    }
    raf = requestAnimationFrame(tick);
  };
  const onVis = () => {
    cancelAnimationFrame(raf);
    if (document.visibilityState === 'visible') raf = requestAnimationFrame(tick);
  };
  document.addEventListener('visibilitychange', onVis);
  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener('visibilitychange', onVis);
  };
}
