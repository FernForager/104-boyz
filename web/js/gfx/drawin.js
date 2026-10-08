// The draw-in (GAME_DESIGN 11.4): a new picture replays its commands over
// about 800 ms, like a 1984 PC drawing a King's Quest scene. Outlines come
// first, then the fills flood in, in the order the picture paints them.
// A tap finishes it; Reduce Motion shows the finished picture at once.
//
// buildTimeline and frameAt are pure (Node renders draw-in strips with
// them); playDrawIn is the browser part.

import { composite, TRANSPARENT } from './picvm.js';
import { resolve, toRGBA } from './palette.js';

export const DRAW_IN_MS = 800;
/** The share of the draw-in spent on outlines; fills take the rest. */
export const OUTLINE_SHARE = 0.35;

/**
 * When each pixel of each layer appears, from a recorded render
 * (renderPic(..., {record: true})). A pixel appears when the last op that
 * wrote it reaches it: lines at a steady pace, fills in their own flood
 * order, so a fill spreads out from its seed.
 * @returns {{width: number, height: number, layers: number, time: Float32Array, color: Uint8Array}}
 */
export function buildTimeline(result, outlineShare = OUTLINE_SHARE) {
  const rec = result.record;
  if (!rec) throw new Error('drawin: render with {record: true}');
  const W = result.width;
  const H = result.height;
  const N = W * H;
  const L = result.layers.length;
  const n = rec.kind.length;
  const weight = new Float64Array(n);
  let outlineTotal = 0;
  let fillTotal = 0;
  for (let k = 0; k < n; k++) {
    const count = rec.end[k] - rec.start[k];
    if (rec.kind[k] === 'fill') {
      // A big fill takes longer than a small one, but the sky can't hog it.
      weight[k] = count ? Math.sqrt(count) + 4 : 0;
      fillTotal += weight[k];
    } else {
      weight[k] = count;
      outlineTotal += weight[k];
    }
  }
  const aShare = fillTotal === 0 ? 1 : outlineTotal === 0 ? 0 : outlineShare;
  const time = new Float32Array(L * N).fill(2);
  const color = new Uint8Array(L * N).fill(TRANSPARENT);
  let ta = 0; // running start of the next outline window
  let tb = aShare; // running start of the next fill window
  for (let k = 0; k < n; k++) {
    const s = rec.start[k];
    const e = rec.end[k];
    if (e === s) continue;
    let t0;
    let span;
    if (rec.kind[k] === 'fill') {
      span = (weight[k] / fillTotal) * (1 - aShare);
      t0 = tb;
      tb += span;
    } else {
      span = (weight[k] / outlineTotal) * aShare;
      t0 = ta;
      ta += span;
    }
    const base = rec.layer[k] * N;
    const count = e - s;
    for (let i = s; i < e; i++) {
      const j = base + rec.writes[i];
      time[j] = Math.min(1, t0 + (span * (i - s + 1)) / count);
      color[j] = rec.colors[i];
    }
  }
  return { width: W, height: H, layers: L, time, color };
}

/**
 * The picture at draw-in time t (0 to 1): each pixel shows the nearest
 * layer that has appeared there.
 * @returns {Uint8Array} indices, TRANSPARENT where nothing has appeared
 */
export function frameAt(tl, t, out) {
  const N = tl.width * tl.height;
  const o = out || new Uint8Array(N);
  const { time, color, layers } = tl;
  for (let p = 0; p < N; p++) {
    let v = TRANSPARENT;
    for (let k = layers - 1; k >= 0; k--) {
      const j = k * N + p;
      if (time[j] <= t && color[j] !== TRANSPARENT) {
        v = color[j];
        break;
      }
    }
    o[p] = v;
  }
  return o;
}

/**
 * Play the draw-in on a display.
 * @param {object} o
 * @param {object} o.result renderPic result (recorded, unless reduced)
 * @param {object} o.palette makePalette()
 * @param {object} o.display createDisplay()
 * @param {string} [o.remap] time-of-day table
 * @param {number} [o.background] slot under nothing drawn
 * @param {boolean} [o.reduced] Reduce Motion: show it finished
 * @param {number} [o.ms] duration
 * @param {(final: Uint8Array) => void} [o.onDone]
 * @returns {{finish: () => void, readonly done: boolean}}
 */
export function playDrawIn(o) {
  const { result, palette, display } = o;
  const W = result.width;
  const N = W * result.height;
  const finalBuf = composite(result);
  const slots = new Uint8Array(N);
  const rgba = new Uint8ClampedArray(N * 4);
  const ropts = { remap: o.remap || 'day', frame: 0, background: o.background || 0 };
  const draw = (indices) => display.present(toRGBA(resolve(indices, W, palette, ropts, slots), palette, rgba));
  let done = false;
  let raf = 0;
  const finish = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    draw(finalBuf);
    if (o.onDone) o.onDone(finalBuf);
  };
  if (o.reduced || !result.record) {
    finish();
  } else {
    const tl = buildTimeline(result);
    const buf = new Uint8Array(N);
    const ms = o.ms || DRAW_IN_MS;
    let start = -1;
    const step = (now) => {
      if (done) return;
      if (start < 0) start = now;
      const t = Math.min(1, (now - start) / ms);
      if (t >= 1) return finish();
      draw(frameAt(tl, t, buf));
      raf = requestAnimationFrame(step);
    };
    draw(frameAt(tl, 0, buf));
    raf = requestAnimationFrame(step);
  }
  return {
    finish,
    get done() {
      return done;
    },
  };
}
