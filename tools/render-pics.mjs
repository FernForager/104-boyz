#!/usr/bin/env node
// Render .pic pictures and composed places to PNG (BUILD_PLAN 4.8, S5), so
// pictures can be looked at and iterated like code.
//
//   npm run render                       every picture and place, every hour
//   npm run render -- deer_lake --palette night
//   npm run render -- --drawin           also a strip of draw-in frames
//   npm run render -- --out <dir>        somewhere other than out/
//   node tools/render-pics.mjs --update  rewrite test/golden/art/compose.json
//                                        (on purpose only: review the diff)
//   node tools/render-pics.mjs --check   compare with it
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
import { slotsToPNG } from './png.mjs';
import { ROOT, loadArt, loadPalette } from './pics.mjs';
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
  let ids = Object.keys(art.pics).sort();
  let places = placeIds;
  if (opts.ids.length) {
    for (const id of opts.ids) if (!art.pics[id] && !art.stamps[id] && !placeIds.includes(id)) throw new Error(`no picture, stamp or drawable place "${id}"`);
    ids = ids.filter((id) => opts.ids.includes(id));
    places = places.filter((id) => opts.ids.includes(id));
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
  /** @type {string[] | null} */
  let light = null;
  if (!opts.ids.length && opts.palette === 'all') {
    const lights = placeLights(art, pal);
    light = [...lightProblems(lights), ...readProblems(pal.remaps, pal.colors)];
    const file = join(dir, 'light.txt');
    writeFileSync(file, lightText(lights, light));
    written.push(file);
  }
  return { written, pictures: ids, places, stamps: stampTiles.map((t) => t.id), light };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log('usage: node tools/render-pics.mjs [id ...] [--palette day|dusk|blue|night|all] [--out dir] [--drawin] | --update | --check');
    process.exit(0);
  }
  if (opts.update || opts.check) {
    const body = goldenBody();
    if (opts.update) {
      mkdirSync(join(ROOT, 'test', 'golden', 'art'), { recursive: true });
      writeFileSync(GOLDEN_PATH, body);
      console.log(`render: wrote ${GOLDEN_PATH.replace(ROOT + '/', '')}`);
      process.exit(0);
    }
    let same = false;
    try {
      same = readFileSync(GOLDEN_PATH, 'utf8') === body;
    } catch {
      same = false;
    }
    console.log(same ? 'render: the composer golden matches' : 'render: the composer golden differs (look at the renders, then --update)');
    process.exit(same ? 0 : 1);
  }
  try {
    const { written, pictures, places, stamps, light } = renderAll(opts);
    console.log(`render: ${pictures.length} picture(s), ${places.length} composed place(s), ${stamps.length} stamp(s) -> ${written.filter((f) => f.endsWith('.png')).length} PNG(s)`);
    for (const f of written) console.log(`  ${f.replace(ROOT + '/', '')}`);
    if (light) console.log(light.length ? `render: the light report has ${light.length} problem(s):\n  ${light.join('\n  ')}` : 'render: light.txt: night is night at every place, and every pair reads at every hour');
  } catch (e) {
    console.error(`render: ${e.message}`);
    process.exit(1);
  }
}
