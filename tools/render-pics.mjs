#!/usr/bin/env node
// Render .pic pictures and composed places to PNG (BUILD_PLAN 4.8, S5), so
// pictures can be looked at and iterated like code.
//
//   npm run render                       every picture and place, every hour
//   npm run render -- deer_lake --palette night
//   npm run render -- --drawin           also a strip of draw-in frames
//   npm run render -- --out <dir>        somewhere other than out/
//   npm run render -- cabin              the cabin alone (S7)
//   node tools/render-pics.mjs --update  rewrite test/golden/art/compose.json
//                                        and test/golden/home/cabin.json
//                                        (on purpose only: review the diff)
//   node tools/render-pics.mjs --check   compare with them
//
// For each picture (plates, scenes and bases, drawn as they are) and each
// palette table, and for each drawable place in content/art/recipes.json
// composed by web/js/gfx/compose.js at each hour (its stars and its table,
// with the hiker idle at the trail spot, as the trail frame shows it), it
// writes under <out>/pics/<id>/:
//   <id>.<hour>.4x.png    square 4x pixels (the fair side-by-side with panel B)
//   <id>.<hour>.7x4.png   the iPhone 15, 16 and 17 pixel shape (doc 11.2)
//   <id>.<hour>.4x2.png   the iPhone SE pixel shape
//   <id>.drawin.png       with --drawin: the draw-in at six moments, by day
// and <out>/pics/contact.<hour>.png: the pictures, the composed places and
// every stamp on one sheet; and <out>/pics/stamps.<hour>.7x4.png: every
// stamp on the sky's glacier blue at the iPhone's pixel shape, as the
// trail shows it.
//
// The cabin (S7; web/js/gfx/cabin.js) at every hour (the morning's blue
// hour too) x sky (and fog over the dry ones) x state (none, first launch,
// the mailbox's flag), and the night under a clear sky at each of the
// moon's seven phases, under <out>/pics/cabin/ as cabin.<scene>.<shape>.png
// (the scene is the composed key after "cabin@"); <out>/pics/cabin.contact.png,
// every hour x sky on one sheet; and <out>/pics/cabin_vs_panel_b.png: panel
// B of design/art/style_options.png, the cover and the cabin by day and at
// night at the iPhone's 7x4, side by side.
//
// With every place drawn, it also writes <out>/pics/light.txt and prints
// its summary (BUILD_PLAN S6; decision 68): each drawable place's mean
// OKLab lightness at each hour and its night sky's, and the tables' slot
// pairs that must read, checked as test/unit/palette.test.mjs checks them
// (lightProblems, readProblems), so a new place, or a new table, is
// judged at every hour with no one looking.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderPic, composite, hashBytes, TRANSPARENT } from '../web/js/gfx/picvm.js';
import { makePalette, resolve, NAMES } from '../web/js/gfx/palette.js';
import { buildTimeline, frameAt } from '../web/js/gfx/drawin.js';
import { compose, drawable, HOURS, TRAIL_SPRITES } from '../web/js/gfx/compose.js';
import { composeCabin, cabinLights } from '../web/js/gfx/cabin.js';
import { slotsToPNG, encodePNG, decodePNG } from './png.mjs';
import { ROOT, loadArt, loadPalette, loadCabin } from './pics.mjs';
import { oklab, chroma, contrastRatio } from './color.mjs';

const SHAPES = [
  ['4x', 4, 4],
  ['7x4', 7, 4],
  ['4x2', 4, 2],
];

/** The widest a contact sheet grows before it wraps a row (px). */
const SHEET_WIDTH = 1400;
/** The widest the 7x4 stamp sheet grows before it wraps (picture pixels: a picture's width). */
const STAMP_SHEET_WIDTH = 160;

/** The composer's golden (test/golden/art/compose.json): these places at every hour. */
export const GOLDEN_PLACES = Object.freeze(['deer_lake', 'high_divide', 'seven_lakes_basin']);
export const GOLDEN_PATH = join(ROOT, 'test', 'golden', 'art', 'compose.json');

/**
 * The FNV hash (picvm.hashBytes) of each golden place's composite at each
 * hour, composed with the trail's hiker, from this tree's art.
 * @param {{pics: any, stamps: any, recipes: any}} [art]
 */
export function composeHashes(art = loadArt()) {
  const bundle = { pics: art.pics, stamps: art.stamps, recipes: art.recipes };
  /** @type {Record<string, Record<string, string>>} */
  const out = {};
  for (const id of GOLDEN_PLACES) {
    out[id] = {};
    for (const hour of HOURS) {
      const c = compose(id, bundle, { hour, sprites: TRAIL_SPRITES });
      out[id][hour] = hashBytes(composite(renderPic(c.ops, { width: c.width, height: c.height, stamps: art.stamps })));
    }
  }
  return out;
}

/** The golden file as written. */
export function goldenBody(hashes = composeHashes()) {
  return `${JSON.stringify({ $comment: 'The composer\'s golden (BUILD_PLAN S5; test/unit/compose.test.mjs): the FNV hash of each place\'s composited picture at each hour, with the trail\'s hiker. Rewritten only on purpose: node tools/render-pics.mjs --update, then look at the renders and review the diff.', places: hashes }, null, 1)}\n`;
}

/**
 * Night is night (decision 68): a night sky's mean OKLab lightness is at
 * most this, so the lift never turns night into dusk...
 */
export const NIGHT_SKY_MAX_L = 0.47;
/** ...and its mean OKLab chroma at least this, so it is blue, not grey (ink alone is 0.022). */
export const NIGHT_SKY_MIN_C = 0.035;
/** The scene reads: the least contrast (WCAG's ratio) a READ_PAIRS pair keeps at an hour. */
export const READS = 1.3;
/**
 * The slot pairs, by their day slots, that keep READS at every hour and are
 * never the same slot (decision 68's re-tune): [a, b, what]. The lake is
 * glacier blue, which is also the lake cycle's (16) first slot.
 */
export const READ_PAIRS = Object.freeze([
  Object.freeze([12, 13, "a conifer's lit side (forest) against the meadow (moss)"]),
  Object.freeze([3, 13, 'the lake (glacier blue) against its shore (moss)']),
  Object.freeze([3, 14, 'the lake (glacier blue) against its shore (sage)']),
  Object.freeze([5, 13, 'the trail (paper cream) against the meadow (moss)']),
]);
/**
 * The one pair the day table can't hold to READS: the sixteen as drawn put
 * glacier blue and sage 1.03 apart (1.04 in option B), apart by hue alone.
 * The day table is the identity, so no re-tune can move it; the pair stays
 * apart in slot by day, and keeps READS at every other hour.
 */
export const DAY_HUE_ONLY = Object.freeze([3, 14]);

/**
 * How light a rendered picture is at an hour: the mean OKLab lightness of
 * all its pixels (the cycles at frame 0, the stars included), and its
 * sky's (the sky layer's pixels that show, its lights, the stars, left
 * out: the table never touches a light) mean lightness and chroma.
 * @param {{width: number, height: number, layers: Uint8Array[]}} r renderPic()'s
 * @param {import('../web/js/gfx/palette.js').Palette} pal
 * @param {string} hour
 * @returns {{L: number, skyL: number, skyC: number, sky: number}} sky is the sky's pixel count (NaN means for no sky)
 */
export function lightOf(r, pal, hour) {
  const slots = resolve(composite(r), r.width, pal, { remap: hour, frame: 0 });
  const lab = pal.colors.map((h) => oklab(h)[0]);
  const ch = pal.colors.map(chroma);
  const [sky, ...over] = r.layers;
  let L = 0;
  let sL = 0;
  let sC = 0;
  let n = 0;
  for (let p = 0; p < slots.length; p++) {
    L += lab[slots[p]];
    const v = sky[p];
    if (v === TRANSPARENT || over.some((layer) => layer[p] !== TRANSPARENT)) continue;
    if (v >= 16 && pal.cycles[v] && pal.cycles[v].light) continue;
    sL += lab[slots[p]];
    sC += ch[slots[p]];
    n++;
  }
  return { L: L / slots.length, skyL: sL / n, skyC: sC / n, sky: n };
}

/**
 * Every drawable place's light at every hour, composed as the trail shows
 * it (with the hiker).
 * @param {{pics: any, stamps: any, recipes: any}} [art]
 * @param {import('../web/js/gfx/palette.js').Palette} [pal]
 * @returns {{id: string, hours: Record<string, {L: number, skyL: number, skyC: number, sky: number}>}[]}
 */
export function placeLights(art = loadArt(), pal = makePalette(loadPalette())) {
  const bundle = { pics: art.pics, stamps: art.stamps, recipes: art.recipes };
  const ids = art.recipes ? Object.keys(art.recipes.places).filter((p) => drawable(p, bundle)).sort() : [];
  return ids.map((id) => {
    /** @type {Record<string, {L: number, skyL: number, skyC: number, sky: number}>} */
    const hours = {};
    for (const hour of HOURS) {
      const c = compose(id, bundle, { hour, sprites: TRAIL_SPRITES });
      hours[hour] = lightOf(renderPic(c.ops, { width: c.width, height: c.height, stamps: art.stamps }), pal, hour);
    }
    return { id, hours };
  });
}

/**
 * Night is night, and not grey (decision 68): for each place, its mean
 * lightness falls strictly through day, dusk, blue hour and night, and its
 * night sky is dark enough and blue enough.
 * @param {ReturnType<typeof placeLights>} lights
 * @returns {string[]} one line a problem
 */
export function lightProblems(lights) {
  const out = [];
  for (const { id, hours } of lights) {
    for (let k = 1; k < HOURS.length; k++) {
      const a = hours[HOURS[k - 1]].L;
      const b = hours[HOURS[k]].L;
      if (!(b < a)) out.push(`${id}: ${HOURS[k]} (${b.toFixed(3)}) is no darker than ${HOURS[k - 1]} (${a.toFixed(3)})`);
    }
    const night = hours.night;
    if (!(night.skyL <= NIGHT_SKY_MAX_L)) out.push(`${id}: the night sky's lightness ${night.skyL.toFixed(3)} is over ${NIGHT_SKY_MAX_L} (dusk, not night)`);
    if (!(night.skyC >= NIGHT_SKY_MIN_C)) out.push(`${id}: the night sky's chroma ${night.skyC.toFixed(3)} is under ${NIGHT_SKY_MIN_C} (grey, not night)`);
  }
  return out;
}

/**
 * The scene reads (decision 68): at every hour, each READ_PAIRS pair is
 * two slots at least READS apart (DAY_HUE_ONLY by day: two slots).
 * @param {Readonly<Record<string, readonly number[]>>} remaps
 * @param {readonly string[]} colors the sixteen
 * @returns {string[]} one line a problem
 */
export function readProblems(remaps, colors) {
  const out = [];
  for (const hour of HOURS) {
    const map = remaps[hour];
    for (const [a, b, what] of READ_PAIRS) {
      const x = map[a];
      const y = map[b];
      const ratio = contrastRatio(colors[x], colors[y]);
      const hueOnly = hour === 'day' && a === DAY_HUE_ONLY[0] && b === DAY_HUE_ONLY[1];
      if (x === y) out.push(`${hour}: ${what} are both ${NAMES[x]}`);
      else if (ratio < READS && !hueOnly) out.push(`${hour}: ${what}, ${NAMES[x]} against ${NAMES[y]}, ${ratio.toFixed(2)} apart, under ${READS}`);
    }
  }
  return out;
}

/**
 * The light report, as text: a row a place, then the problems.
 * @param {ReturnType<typeof placeLights>} lights
 * @param {string[]} problems
 */
export function lightText(lights, problems) {
  const w = Math.max(...lights.map((l) => l.id.length), 5);
  const head = `${'place'.padEnd(w)}  ${HOURS.map((h) => h.padStart(5)).join('  ')}  night sky L  night sky C`;
  const rows = lights.map(({ id, hours }) => `${id.padEnd(w)}  ${HOURS.map((h) => hours[h].L.toFixed(3)).join('  ')}  ${hours.night.skyL.toFixed(3).padStart(11)}  ${hours.night.skyC.toFixed(3).padStart(11)}`);
  const tail = problems.length ? ['', ...problems] : ['', `every place: day > dusk > blue > night; night skies at most L ${NIGHT_SKY_MAX_L} and at least C ${NIGHT_SKY_MIN_C}; every pair reads at every hour`];
  return `${[head, ...rows, ...tail].join('\n')}\n`;
}

// ---- The cabin (S7) -----------------------------------------------------------

/** The cabin's golden (test/golden/home/cabin.json): every scene's composed ops, hashed. */
export const CABIN_GOLDEN_PATH = join(ROOT, 'test', 'golden', 'home', 'cabin.json');
/** The hours the renders show, [hour, evening]: the evening's blue hour and the morning's. */
export const CABIN_HOUR_SET = Object.freeze([['night', true], ['blue', true], ['blue', false], ['dawn', false], ['day', true], ['dusk', true]]);
/** The skies, [sky, fog]: fog lies only over a dry sky. */
export const CABIN_SKY_SET = Object.freeze([['clear', false], ['cloudy', false], ['rain', false], ['clear', true], ['cloudy', true]]);
/** The states: none, first launch, the mailbox's flag. */
export const CABIN_STATE_SET = Object.freeze([[], ['first'], ['flag_up']]);
/** The renders' moon when it's up: a waxing gibbous, the seventh-night moon's three eighths. */
export const CABIN_MOON = 3;
/** The light cycles the night checks leave out of the means (lamp, spill, fire, stars). */
export const CABIN_LIGHTS = Object.freeze([20, 22, 24, 28]);
/** The night sky the name sits over: rows 0 to 28 (lead call 61). */
export const CABIN_NAME_ROWS = 29;
/** At night, at least this many lit pixels (lamp, spill and fire): decision 38's warm windows. */
export const CABIN_MIN_LIT = 120;
/** At night the arched window's glass is lamp light: at least this many pixels of it. */
export const CABIN_GABLE_LIT = 150;
/** The peak's summit reads against its sky at every hour by this much (WCAG ratio)... */
export const CABIN_SUMMIT = 1.5;
/** ...and the roof's raking line against the band behind it by this much. */
export const CABIN_ROOF = 1.3;
/** The rows of the peak's art box that count as its summit (from the box's top). */
export const CABIN_SUMMIT_ROWS = 24;
/** The columns either side of the apex that count as the roof's raking line. */
export const CABIN_ROOF_COLUMNS = 40;

/**
 * Every scene the cabin renders and its golden hashes: each hour x sky x
 * state, and the night under a clear sky at each phase of the moon.
 * @returns {{hour: string, evening: boolean, sky: string, fog: boolean, moon: number, state: string[]}[]}
 */
export function cabinScenes() {
  const out = [];
  for (const [hour, evening] of CABIN_HOUR_SET) {
    for (const [sky, fog] of CABIN_SKY_SET) {
      for (const state of CABIN_STATE_SET) out.push({ hour, evening, sky, fog, moon: hour === 'night' || hour === 'blue' ? CABIN_MOON : 0, state: [...state] });
    }
  }
  for (let moon = 1; moon <= 7; moon++) if (moon !== CABIN_MOON) out.push({ hour: 'night', evening: true, sky: 'clear', fog: false, moon, state: [] });
  return out;
}

/**
 * The art bundle the cabin composes from.
 * @param {{pics: any, stamps: any}} [art]
 */
const cabinArt = (art = loadArt()) => ({ pics: art.pics, stamps: art.stamps });

/**
 * Each scene's composed key and the FNV hash of its ops (as JSON), from
 * this tree's art: the golden test/unit/cabin.test.mjs holds.
 * @param {{pics: any, stamps: any}} [art]
 * @param {any} [cabin]
 * @returns {Record<string, string>}
 */
export function cabinHashes(art = loadArt(), cabin = loadCabin()) {
  /** @type {Record<string, string>} */
  const out = {};
  if (!cabin) return out;
  const bundle = cabinArt(art);
  for (const sc of cabinScenes()) {
    const c = composeCabin({ art: bundle, cabin, ...sc });
    out[c.key] = hashBytes(new TextEncoder().encode(JSON.stringify(c.ops)));
  }
  return out;
}

/** The cabin's golden file as written. */
export function cabinGoldenBody(hashes = cabinHashes()) {
  return `${JSON.stringify({ $comment: "The cabin's golden (BUILD_PLAN S7; test/unit/cabin.test.mjs): the FNV hash of each scene's composed ops (web/js/gfx/cabin.js), every hour x sky x state and the clear night at each phase of the moon. Rewritten only on purpose: node tools/render-pics.mjs --update, then look at the renders and review the diff.", scenes: hashes }, null, 1)}\n`;
}

/**
 * The cabin at one scene, rendered: the composed result, its layers and its
 * composited indices.
 * @param {{pics: any, stamps: any}} art
 * @param {any} cabin
 * @param {any} scene
 */
export function renderCabinScene(art, cabin, scene) {
  const c = composeCabin({ art, cabin, ...scene });
  const r = renderPic(c.ops, { width: c.width, height: c.height, stamps: art.stamps });
  return { c, r, indices: composite(r) };
}

/**
 * The cabin's light at each hour under a clear sky (the moon up at blue
 * hour and night): the mean OKLab lightness of the picture with its lights
 * (lamp, spill, fire, stars) left out, the name's sky (rows 0 to 28 of the
 * sky layer, lights left out) and its chroma, and the lit pixels.
 * @param {{pics: any, stamps: any}} [art]
 * @param {any} [cabin]
 * @param {import('../web/js/gfx/palette.js').Palette} [pal]
 * @returns {Record<string, {L: number, skyL: number, skyC: number, lit: number}>}
 */
export function cabinLight(art = cabinArt(), cabin = loadCabin(), pal = makePalette(loadPalette())) {
  const lab = pal.colors.map((h) => oklab(h)[0]);
  const ch = pal.colors.map(chroma);
  /** @type {Record<string, {L: number, skyL: number, skyC: number, lit: number}>} */
  const out = {};
  for (const [hour, evening] of CABIN_HOUR_SET) {
    const name = hour === 'blue' && !evening ? 'blue_am' : hour;
    const { c, r, indices } = renderCabinScene(art, cabin, { hour, evening, sky: 'clear', fog: false, moon: hour === 'night' || hour === 'blue' ? CABIN_MOON : 0, state: [] });
    const slots = resolve(indices, c.width, pal, { remap: c.table, frame: 0 });
    let L = 0;
    let n = 0;
    let sL = 0;
    let sC = 0;
    let sn = 0;
    let lit = 0;
    const [sky, ...over] = r.layers;
    for (let p = 0; p < slots.length; p++) {
      if (CABIN_LIGHTS.includes(indices[p])) {
        if (indices[p] !== 22) lit++;
        continue;
      }
      L += lab[slots[p]];
      n++;
      if (p >= CABIN_NAME_ROWS * c.width || sky[p] === TRANSPARENT || over.some((layer) => layer[p] !== TRANSPARENT)) continue;
      sL += lab[slots[p]];
      sC += ch[slots[p]];
      sn++;
    }
    out[name] = { L: L / n, skyL: sL / sn, skyC: sC / sn, lit };
  }
  return out;
}

/**
 * The cabin's night checks (BUILD_PLAN S7 spec 6.3), one line a problem:
 * the picture darkens day > dusk > blue hour > night (lights left out);
 * the name's night sky is night and not grey; at night at least
 * CABIN_MIN_LIT lit pixels and the arched window lit; at every hour under a
 * clear sky, the peak's summit reads against the sky behind it and the
 * roof's raking line against the band behind it.
 * @param {{pics: any, stamps: any}} [art]
 * @param {any} [cabin]
 * @param {import('../web/js/gfx/palette.js').Palette} [pal]
 * @returns {string[]}
 */
export function cabinProblems(art = cabinArt(), cabin = loadCabin(), pal = makePalette(loadPalette())) {
  const out = [];
  const light = cabinLight(art, cabin, pal);
  const order = ['day', 'dusk', 'blue', 'night'];
  for (let k = 1; k < order.length; k++) {
    const a = light[order[k - 1]].L;
    const b = light[order[k]].L;
    if (!(b < a)) out.push(`cabin: ${order[k]} (${b.toFixed(3)}) is no darker than ${order[k - 1]} (${a.toFixed(3)})`);
  }
  const night = light.night;
  if (!(night.skyL <= NIGHT_SKY_MAX_L)) out.push(`cabin: the name's night sky's lightness ${night.skyL.toFixed(3)} is over ${NIGHT_SKY_MAX_L}`);
  if (!(night.skyC >= NIGHT_SKY_MIN_C)) out.push(`cabin: the name's night sky's chroma ${night.skyC.toFixed(3)} is under ${NIGHT_SKY_MIN_C}`);
  if (!(night.lit >= CABIN_MIN_LIT)) out.push(`cabin: ${night.lit} lit pixels at night, under ${CABIN_MIN_LIT}`);
  const W = 160;
  for (const [hour, evening] of CABIN_HOUR_SET) {
    const name = hour === 'blue' && !evening ? 'blue_am' : hour;
    const { c, r, indices } = renderCabinScene(art, cabin, { hour, evening, sky: 'clear', fog: false, moon: 0, state: [] });
    const slots = resolve(indices, W, pal, { remap: c.table, frame: 0 });
    const [sky, far, mid, near] = r.layers;
    const only = (/** @type {number} */ p, /** @type {Uint8Array} */ L, /** @type {Uint8Array[]} */ above) => L[p] !== TRANSPARENT && above.every((a) => a[p] === TRANSPARENT);
    const ratio = (/** @type {number} */ p, /** @type {number} */ q) => contrastRatio(pal.colors[slots[p]], pal.colors[slots[q]]);
    if (hour === 'night' && evening) {
      // The arched window: most of its glass (below the crown, inside its frame) is lamp light at night.
      const g = c.anchors.win_gable;
      let lamp = 0;
      if (g) for (let y = g[1] + 1; y < g[1] + 34; y++) for (let x = g[0] - 7; x <= g[0] + 7; x++) if (indices[y * W + x] === 24) lamp++;
      if (lamp < CABIN_GABLE_LIT) out.push(`cabin: the arched window has ${lamp} lamp pixels at night, under ${CABIN_GABLE_LIT}`);
    }
    // The summit: the far layer's top edge in the peak's box, against the sky above it.
    const [px, py, pw] = cabin.places.peak.art;
    let summit = 0;
    for (let x = px; x < px + pw; x++) {
      for (let y = 1; y < py + CABIN_SUMMIT_ROWS; y++) {
        const p = y * W + x;
        if (!only(p, far, [mid, near])) continue;
        const q = p - W;
        if (only(q, sky, [far, mid, near]) && !CABIN_LIGHTS.includes(indices[q])) {
          summit++;
          if (ratio(p, q) < CABIN_SUMMIT) out.push(`cabin at ${name}: the summit at ${x},${y} is ${ratio(p, q).toFixed(2)} from its sky, under ${CABIN_SUMMIT}`);
        }
        break;
      }
    }
    if (summit < 8) out.push(`cabin at ${name}: only ${summit} summit pixels stand against the sky`);
    // The roof: the near layer's top edge either side of the apex, against the far band behind it.
    const apex = c.anchors.apex;
    let roof = 0;
    if (apex) {
      for (let x = apex[0] - CABIN_ROOF_COLUMNS; x <= apex[0] + CABIN_ROOF_COLUMNS; x++) {
        for (let y = apex[1]; y < 200; y++) {
          const p = y * W + x;
          if (near[p] === TRANSPARENT) continue;
          const q = p - W;
          if (only(q, far, [mid, near])) {
            roof++;
            if (ratio(p, q) < CABIN_ROOF) out.push(`cabin at ${name}: the roof at ${x},${y} is ${ratio(p, q).toFixed(2)} from the band behind it, under ${CABIN_ROOF}`);
          }
          break;
        }
      }
    }
    if (roof < 8) out.push(`cabin at ${name}: only ${roof} roof pixels stand against the far band`);
  }
  return out;
}

/** The light report's cabin rows. */
export function cabinLightText(light, problems) {
  const head = `cabin, clear sky  ${Object.keys(light).map((h) => h.padStart(7)).join('  ')}`;
  const rows = [
    `mean L (no lights)  ${Object.values(light).map((v) => v.L.toFixed(3).padStart(7)).join('  ')}`,
    `name's sky L        ${Object.values(light).map((v) => v.skyL.toFixed(3).padStart(7)).join('  ')}`,
    `name's sky C        ${Object.values(light).map((v) => v.skyC.toFixed(3).padStart(7)).join('  ')}`,
    `lit pixels          ${Object.values(light).map((v) => String(v.lit).padStart(7)).join('  ')}`,
  ];
  const tail = problems.length ? problems : ['the cabin: day > dusk > blue > night; the name\'s night sky dark and blue; the windows lit; the summit and the roof read at every hour'];
  return `${[head, ...rows, ...tail].join('\n')}\n`;
}

/**
 * RGB rows from palette slots, scaled.
 * @param {Uint8Array} slots
 * @param {number} w
 * @param {number} h
 * @param {number[][]} rgb
 * @param {number} sx
 * @param {number} sy
 */
function slotsRGB(slots, w, h, rgb, sx, sy) {
  const W = w * sx;
  const out = new Uint8Array(W * h * sy * 3);
  for (let y = 0; y < h * sy; y++) {
    for (let x = 0; x < W; x++) {
      const c = rgb[slots[Math.floor(y / sy) * w + Math.floor(x / sx)]];
      out.set(c, (y * W + x) * 3);
    }
  }
  return { width: W, height: h * sy, rgb: out };
}

/**
 * Lay RGB images side by side on paper cream, tops aligned.
 * @param {{width: number, height: number, rgb: Uint8Array}[]} imgs
 * @param {number[]} bg
 * @param {number} gap
 */
function sideBySideRGB(imgs, bg, gap = 24) {
  const width = imgs.reduce((s, i) => s + i.width, 0) + gap * (imgs.length + 1);
  const height = Math.max(...imgs.map((i) => i.height)) + gap * 2;
  const rgb = new Uint8Array(width * height * 3);
  for (let p = 0; p < width * height; p++) rgb.set(bg, p * 3);
  let x0 = gap;
  for (const img of imgs) {
    for (let y = 0; y < img.height; y++) rgb.set(img.rgb.subarray(y * img.width * 3, (y + 1) * img.width * 3), ((y + gap) * width + x0) * 3);
    x0 += img.width + gap;
  }
  return encodePNG({ width, height, type: 'rgb', data: rgb });
}

/** Panel B's rows in design/art/style_options.png (160x120 at 4x, under its caption). */
export const PANEL_B = Object.freeze({ x: 0, y: 572, width: 640, height: 480 });

/**
 * Render the cabin: every scene at every shape, the contact sheet, and the
 * side by side with panel B and the cover.
 * @param {{out: string, pal: import('../web/js/gfx/palette.js').Palette, art: any, cabin: any, written: string[]}} o
 */
export function renderCabin({ out, pal, art, cabin, written }) {
  const bundle = cabinArt(art);
  const dir = join(out, 'pics', 'cabin');
  mkdirSync(dir, { recursive: true });
  /** @type {Map<string, Uint8Array>} */
  const slotsOf = new Map();
  for (const sc of cabinScenes()) {
    const { c, indices } = renderCabinScene(bundle, cabin, sc);
    const tag = c.key.slice('cabin@'.length);
    const slots = resolve(indices, c.width, pal, { remap: c.table, frame: 0, background: 0 });
    slotsOf.set(tag, slots);
    for (const [name, sx, sy] of SHAPES) {
      const file = join(dir, `cabin.${tag}.${name}.png`);
      writeFileSync(file, slotsToPNG(slots, c.width, c.height, pal.rgb, sx, sy));
      written.push(file);
    }
  }
  // The contact sheet: every hour (rows) x sky (columns), no state, at 1x.
  const tagOf = (/** @type {string} */ hour, /** @type {boolean} */ evening, /** @type {string} */ sky, /** @type {boolean} */ fog) => composeCabin({ art: bundle, cabin, hour, evening, sky, fog, moon: hour === 'night' || hour === 'blue' ? CABIN_MOON : 0 }).key.slice('cabin@'.length);
  const gap = 6;
  const cw = CABIN_SKY_SET.length * (160 + gap) + gap;
  const chh = CABIN_HOUR_SET.length * (320 + gap) + gap;
  const sheet = new Uint8Array(cw * chh).fill(5);
  CABIN_HOUR_SET.forEach(([hour, evening], i) => {
    CABIN_SKY_SET.forEach(([sky, fog], j) => {
      const slots = /** @type {Uint8Array} */ (slotsOf.get(tagOf(hour, evening, sky, fog)));
      blit(sheet, cw, slots, 160, 320, gap + j * (160 + gap), gap + i * (320 + gap), 1, -1);
    });
  });
  const contact = join(out, 'pics', 'cabin.contact.png');
  writeFileSync(contact, slotsToPNG(sheet, cw, chh, pal.rgb, 2, 2));
  written.push(contact);
  // Beside panel B and the cover, at the iPhone's 7x4: day and night.
  const style = decodePNG(readFileSync(join(ROOT, 'design', 'art', 'style_options.png')));
  const pb = new Uint8Array(PANEL_B.width * PANEL_B.height * 3);
  for (let y = 0; y < PANEL_B.height; y++) pb.set(style.rgb.subarray(((PANEL_B.y + y) * style.width + PANEL_B.x) * 3, ((PANEL_B.y + y) * style.width + PANEL_B.x + PANEL_B.width) * 3), y * PANEL_B.width * 3);
  const cover = art.pics.cover_high_divide_dusk;
  const coverSlots = resolve(composite(renderPic(cover.ops, { width: cover.width, height: cover.height, stamps: art.stamps })), cover.width, pal, { remap: 'day' });
  const imgs = [
    { width: PANEL_B.width, height: PANEL_B.height, rgb: pb },
    slotsRGB(coverSlots, 160, 320, pal.rgb, 7, 4),
    slotsRGB(/** @type {Uint8Array} */ (slotsOf.get(tagOf('day', true, 'clear', false))), 160, 320, pal.rgb, 7, 4),
    slotsRGB(/** @type {Uint8Array} */ (slotsOf.get(tagOf('night', true, 'clear', false))), 160, 320, pal.rgb, 7, 4),
  ];
  const vs = join(out, 'pics', 'cabin_vs_panel_b.png');
  writeFileSync(vs, sideBySideRGB(imgs, pal.rgb[5]));
  written.push(vs);
}

function parseArgs(argv) {
  const o = { ids: [], palette: 'all', out: join(ROOT, 'out'), drawin: false, update: false, check: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--update') o.update = true;
    else if (a === '--check') o.check = true;
    else if (a === '--palette') o.palette = argv[++i];
    else if (a === '--out') o.out = argv[++i];
    else if (a === '--drawin') o.drawin = true;
    else if (a === '--help' || a === '-h') o.help = true;
    else o.ids.push(a.replace(/^.*\//, '').replace(/\.pic$/, ''));
  }
  return o;
}

/** Copy a slot buffer into a sheet at (x, y), scaled by s. */
function blit(sheet, sw, src, w, h, x, y, s, transparentSlot) {
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      let v = src[py * w + px];
      if (v === TRANSPARENT) {
        if (transparentSlot < 0) continue;
        v = transparentSlot;
      }
      for (let dy = 0; dy < s; dy++) {
        const row = (y + py * s + dy) * sw + x + px * s;
        sheet.fill(v, row, row + s);
      }
    }
  }
}

/** Render a stamp on its own, around its anchor, for the contact sheet. */
export function renderStamp(id, stamps) {
  const pad = 2;
  // Probe the extent with a big canvas, then crop.
  const W = 400;
  const H = 240;
  const r = renderPic([['@', 'near'], ['T', id, 120, 180, 0]], { width: W, height: H, stamps });
  const buf = composite(r);
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (buf[y * W + x] !== TRANSPARENT) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(W - 1, x1 + pad);
  y1 = Math.min(H - 1, y1 + pad);
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) out.set(buf.subarray((y + y0) * W + x0, (y + y0) * W + x0 + w), y * w);
  return { width: w, height: h, indices: out };
}

/**
 * Lay tiles out left to right, wrapping at the sheet's width.
 * @param {{width: number, height: number, scale: number}[][]} rows each a group that starts a new row
 * @param {number} gap
 */
function flow(rows, gap, limit = SHEET_WIDTH) {
  const placed = [];
  let y = gap;
  let width = 16;
  for (const group of rows) {
    if (!group.length) continue;
    let x = gap;
    let rowH = 0;
    for (const t of group) {
      const w = t.width * t.scale;
      const h = t.height * t.scale;
      if (x > gap && x + w + gap > limit) {
        y += rowH + gap;
        x = gap;
        rowH = 0;
      }
      placed.push({ t, x, y });
      x += w + gap;
      rowH = Math.max(rowH, h);
      width = Math.max(width, x);
    }
    y += rowH + gap * 2;
  }
  return { placed, width, height: y };
}

function writeShapes(dir, id, tag, indices, width, height, pal, remap, written) {
  const slots = resolve(indices, width, pal, { remap, frame: 0, background: 0 });
  for (const [name, sx, sy] of SHAPES) {
    const file = join(dir, `${id}.${tag}.${name}.png`);
    writeFileSync(file, slotsToPNG(slots, width, height, pal.rgb, sx, sy));
    written.push(file);
  }
}

function writeDrawIn(dir, id, result, pal, remap, written) {
  const tl = buildTimeline(result);
  const times = [0.12, 0.25, 0.36, 0.5, 0.7, 1];
  const s = 2;
  const gap = 4;
  const sw = times.length * (result.width * s + gap) + gap;
  const sh = result.height * s + gap * 2;
  const sheet = new Uint8Array(sw * sh).fill(5);
  times.forEach((t, i) => {
    const f = resolve(frameAt(tl, t), result.width, pal, { remap, background: 0 });
    blit(sheet, sw, f, result.width, result.height, gap + i * (result.width * s + gap), gap, s, -1);
  });
  const file = join(dir, `${id}.drawin.png`);
  writeFileSync(file, slotsToPNG(sheet, sw, sh, pal.rgb, 1, 1));
  written.push(file);
}

/**
 * Render everything asked for.
 * @param {{ids: string[], palette: string, out: string, drawin: boolean}} opts
 */
export function renderAll(opts) {
  const palJson = loadPalette();
  const pal = makePalette(palJson);
  const art = loadArt();
  const bundle = { pics: art.pics, stamps: art.stamps, recipes: art.recipes };
  const bad = art.sources.filter((s) => s.parsed.errors.length);
  for (const s of bad) for (const e of s.parsed.errors) console.error(`${s.rel}:${e.line}: ${e.msg}`);
  const remaps = opts.palette === 'all' ? Object.keys(pal.remaps) : [opts.palette];
  for (const r of remaps) if (!pal.remaps[r]) throw new Error(`unknown palette "${r}" (have: ${Object.keys(pal.remaps).join(', ')})`);
  const hours = HOURS.filter((h) => remaps.includes(h));
  const placeIds = art.recipes ? Object.keys(art.recipes.places).filter((p) => drawable(p, bundle)).sort() : [];
  // The cabin's plate draws no sky of its own: it renders composed (renderCabin), never as drawn.
  let ids = Object.keys(art.pics).filter((id) => art.pics[id].kind !== 'home').sort();
  let places = placeIds;
  const cabin = loadCabin();
  let withCabin = Boolean(cabin) && opts.palette === 'all';
  if (opts.ids.length) {
    for (const id of opts.ids) if (!art.pics[id] && !art.stamps[id] && !placeIds.includes(id) && id !== 'cabin') throw new Error(`no picture, stamp or drawable place "${id}"`);
    ids = ids.filter((id) => opts.ids.includes(id));
    places = places.filter((id) => opts.ids.includes(id));
    withCabin = withCabin && opts.ids.includes('cabin');
  }
  const dir = join(opts.out, 'pics');
  mkdirSync(dir, { recursive: true });
  const written = [];
  const rendered = [];
  for (const id of ids) {
    const pic = art.pics[id];
    const result = renderPic(pic.ops, { width: pic.width, height: pic.height, stamps: art.stamps, record: opts.drawin });
    const indices = composite(result);
    rendered.push({ id, width: pic.width, height: pic.height, indices, hour: null });
    const pdir = join(dir, id);
    mkdirSync(pdir, { recursive: true });
    for (const remap of remaps) writeShapes(pdir, id, remap, indices, pic.width, pic.height, pal, remap, written);
    if (opts.drawin) writeDrawIn(pdir, id, result, pal, 'day', written);
  }
  /** @type {Record<string, {id: string, width: number, height: number, indices: Uint8Array}[]>} */
  const composed = {};
  for (const id of places) {
    const pdir = join(dir, id);
    mkdirSync(pdir, { recursive: true });
    for (const hour of hours) {
      const c = compose(id, bundle, { hour, sprites: TRAIL_SPRITES });
      const result = renderPic(c.ops, { width: c.width, height: c.height, stamps: art.stamps, record: opts.drawin && hour === hours[0] });
      const indices = composite(result);
      (composed[hour] = composed[hour] || []).push({ id, width: c.width, height: c.height, indices });
      writeShapes(pdir, id, hour, indices, c.width, c.height, pal, hour, written);
      if (opts.drawin && hour === hours[0]) writeDrawIn(pdir, id, result, pal, hour, written);
    }
  }
  // Contact sheets: pictures and places at 2x, then stamps at 4x.
  const stampIds = Object.keys(art.stamps).sort();
  const stampTiles = stampIds.map((id) => ({ id, tile: renderStamp(id, art.stamps) })).filter((t) => t.tile);
  if (!opts.ids.length) {
    for (const remap of remaps) {
      const gap = 8;
      const tiles = (list, scale, bg) => list.map((p) => ({ width: p.width, height: p.height, scale, indices: p.indices, bg }));
      const rows = [
        tiles(rendered, 2, -1),
        tiles(composed[remap] || [], 2, -1),
        tiles(stampTiles.map((t) => t.tile), 4, 3),
      ];
      const { placed, width, height } = flow(rows, gap);
      const sheet = new Uint8Array(width * height).fill(5);
      for (const { t, x, y } of placed) {
        const slots = resolve(t.indices, t.width, pal, { remap, background: t.bg < 0 ? 0 : t.bg });
        blit(sheet, width, slots, t.width, t.height, x, y, t.scale, -1);
      }
      const file = join(dir, `contact.${remap}.png`);
      writeFileSync(file, slotsToPNG(sheet, width, height, pal.rgb, 1, 1));
      written.push(file);
      // The stamps alone at the phone's pixel shape, in picture pixels.
      const st = flow([tiles(stampTiles.map((t) => t.tile), 1, 3)], 2, STAMP_SHEET_WIDTH);
      const ss = new Uint8Array(st.width * st.height).fill(5);
      for (const { t, x, y } of st.placed) blit(ss, st.width, resolve(t.indices, t.width, pal, { remap, background: t.bg }), t.width, t.height, x, y, 1, -1);
      const sfile = join(dir, `stamps.${remap}.7x4.png`);
      writeFileSync(sfile, slotsToPNG(ss, st.width, st.height, pal.rgb, 7, 4));
      written.push(sfile);
    }
  }
  if (withCabin) renderCabin({ out: opts.out, pal, art, cabin, written });
  /** @type {string[] | null} */
  let light = null;
  if (!opts.ids.length && opts.palette === 'all') {
    const lights = placeLights(art, pal);
    light = [...lightProblems(lights), ...readProblems(pal.remaps, pal.colors)];
    let text = lightText(lights, light);
    if (cabin) {
      const cabinBundle = cabinArt(art);
      const problems = cabinProblems(cabinBundle, cabin, pal);
      light.push(...problems);
      text += `\n${cabinLightText(cabinLight(cabinBundle, cabin, pal), problems)}`;
    }
    const file = join(dir, 'light.txt');
    writeFileSync(file, text);
    written.push(file);
  }
  return { written, pictures: ids, places, stamps: stampTiles.map((t) => t.id), light, cabin: withCabin };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log('usage: node tools/render-pics.mjs [id ... | cabin] [--palette day|dusk|blue|night|all] [--out dir] [--drawin] | --update | --check');
    process.exit(0);
  }
  if (opts.update || opts.check) {
    const goldens = [
      { path: GOLDEN_PATH, body: goldenBody(), what: 'the composer golden' },
      { path: CABIN_GOLDEN_PATH, body: cabinGoldenBody(), what: "the cabin's golden" },
    ];
    if (opts.update) {
      for (const g of goldens) {
        mkdirSync(join(g.path, '..'), { recursive: true });
        writeFileSync(g.path, g.body);
        console.log(`render: wrote ${g.path.replace(ROOT + '/', '')}`);
      }
      process.exit(0);
    }
    let all = true;
    for (const g of goldens) {
      let same = false;
      try {
        same = readFileSync(g.path, 'utf8') === g.body;
      } catch {
        same = false;
      }
      all = all && same;
      console.log(same ? `render: ${g.what} matches` : `render: ${g.what} differs (look at the renders, then --update)`);
    }
    process.exit(all ? 0 : 1);
  }
  try {
    const { written, pictures, places, stamps, light, cabin } = renderAll(opts);
    console.log(`render: ${pictures.length} picture(s), ${places.length} composed place(s), ${stamps.length} stamp(s)${cabin ? `, the cabin at ${cabinScenes().length} scenes` : ''} -> ${written.filter((f) => f.endsWith('.png')).length} PNG(s)`);
    for (const f of written) console.log(`  ${f.replace(ROOT + '/', '')}`);
    if (light) console.log(light.length ? `render: the light report has ${light.length} problem(s):\n  ${light.join('\n  ')}` : 'render: light.txt: night is night at every place, and every pair reads at every hour');
  } catch (e) {
    console.error(`render: ${e.message}`);
    process.exit(1);
  }
}
