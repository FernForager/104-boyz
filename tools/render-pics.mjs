#!/usr/bin/env node
// Render .pic pictures to PNG (BUILD_PLAN 4.8), so pictures can be looked
// at and iterated like code.
//
//   npm run render                       every plate and scene, every palette
//   npm run render -- cover_high_divide_dusk --palette dusk
//   npm run render -- --drawin           also a strip of draw-in frames
//
// For each picture and palette it writes, under out/pics/<id>/:
//   <id>.<palette>.4x.png    square 4x pixels (the fair side-by-side with panel B)
//   <id>.<palette>.7x4.png   the iPhone 15/16 pixel shape (doc 11.2)
//   <id>.<palette>.4x2.png   the iPhone SE pixel shape
// and out/pics/contact.<palette>.png, every picture and stamp on one sheet.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderPic, composite, TRANSPARENT } from '../web/js/gfx/picvm.js';
import { makePalette, resolve } from '../web/js/gfx/palette.js';
import { buildTimeline, frameAt } from '../web/js/gfx/drawin.js';
import { slotsToPNG } from './png.mjs';
import { ROOT, loadArt, loadPalette } from './pics.mjs';

const SHAPES = [
  ['4x', 4, 4],
  ['7x4', 7, 4],
  ['4x2', 4, 2],
];

function parseArgs(argv) {
  const o = { ids: [], palette: 'all', out: join(ROOT, 'out'), drawin: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--palette') o.palette = argv[++i];
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
function renderStamp(id, stamps) {
  const pad = 2;
  // Probe the extent with a big canvas, then crop.
  const W = 200;
  const H = 200;
  const r = renderPic([['@', 'near'], ['T', id, 100, 150, 0]], { width: W, height: H, stamps });
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

export function renderAll(opts) {
  const palJson = loadPalette();
  const pal = makePalette(palJson);
  const art = loadArt();
  const bad = art.sources.filter((s) => s.parsed.errors.length);
  for (const s of bad) for (const e of s.parsed.errors) console.error(`${s.rel}:${e.line}: ${e.msg}`);
  const remaps = opts.palette === 'all' ? Object.keys(pal.remaps) : [opts.palette];
  for (const r of remaps) if (!pal.remaps[r]) throw new Error(`unknown palette "${r}" (have: ${Object.keys(pal.remaps).join(', ')})`);
  let ids = Object.keys(art.pics).sort();
  if (opts.ids.length) {
    for (const id of opts.ids) if (!art.pics[id] && !art.stamps[id]) throw new Error(`no picture "${id}"`);
    ids = ids.filter((id) => opts.ids.includes(id));
  }
  const dir = join(opts.out, 'pics');
  mkdirSync(dir, { recursive: true });
  const written = [];
  const rendered = [];
  for (const id of ids) {
    const pic = art.pics[id];
    const result = renderPic(pic.ops, { width: pic.width, height: pic.height, stamps: art.stamps, record: opts.drawin });
    const indices = composite(result);
    rendered.push({ id, width: pic.width, height: pic.height, indices });
    const pdir = join(dir, id);
    mkdirSync(pdir, { recursive: true });
    for (const remap of remaps) {
      const slots = resolve(indices, pic.width, pal, { remap, frame: 0, background: 0 });
      for (const [name, sx, sy] of SHAPES) {
        const file = join(pdir, `${id}.${remap}.${name}.png`);
        writeFileSync(file, slotsToPNG(slots, pic.width, pic.height, pal.rgb, sx, sy));
        written.push(file);
      }
    }
    if (opts.drawin) {
      const tl = buildTimeline(result);
      const times = [0.12, 0.25, 0.36, 0.5, 0.7, 1];
      const s = 2;
      const gap = 4;
      const sw = times.length * (pic.width * s + gap) + gap;
      const sh = pic.height * s + gap * 2;
      const sheet = new Uint8Array(sw * sh).fill(5);
      times.forEach((t, i) => {
        const f = resolve(frameAt(tl, t), pic.width, pal, { remap: 'day', background: 0 });
        blit(sheet, sw, f, pic.width, pic.height, gap + i * (pic.width * s + gap), gap, s, -1);
      });
      const file = join(pdir, `${id}.drawin.png`);
      writeFileSync(file, slotsToPNG(sheet, sw, sh, pal.rgb, 1, 1));
      written.push(file);
    }
  }
  // Contact sheets: pictures at 2x, then stamps at 4x.
  const stampIds = Object.keys(art.stamps).sort();
  const stampTiles = stampIds.map((id) => ({ id, tile: renderStamp(id, art.stamps) })).filter((t) => t.tile);
  if (!opts.ids.length || stampTiles.length) {
    for (const remap of remaps) {
      const gap = 8;
      const ps = 2;
      const ss = 4;
      const picRowW = rendered.reduce((a, p) => a + p.width * ps + gap, gap);
      const picRowH = rendered.reduce((a, p) => Math.max(a, p.height * ps), 0) + gap * 2;
      const stampRowW = stampTiles.reduce((a, t) => a + t.tile.width * ss + gap, gap);
      const stampRowH = stampTiles.reduce((a, t) => Math.max(a, t.tile.height * ss), 0) + gap * 2;
      const sw = Math.max(picRowW, stampRowW, 16);
      const sh = picRowH + (stampTiles.length ? stampRowH : 0);
      const sheet = new Uint8Array(sw * sh).fill(5);
      let x = gap;
      for (const p of rendered) {
        const slots = resolve(p.indices, p.width, pal, { remap, background: 0 });
        blit(sheet, sw, slots, p.width, p.height, x, gap, ps, -1);
        x += p.width * ps + gap;
      }
      x = gap;
      for (const { tile } of stampTiles) {
        const slots = resolve(tile.indices, tile.width, pal, { remap, background: 3 });
        blit(sheet, sw, slots, tile.width, tile.height, x, picRowH + gap, ss, -1);
        x += tile.width * ss + gap;
      }
      const file = join(dir, `contact.${remap}.png`);
      writeFileSync(file, slotsToPNG(sheet, sw, sh, pal.rgb, 1, 1));
      written.push(file);
    }
  }
  return { written, pictures: ids, stamps: stampTiles.map((t) => t.id) };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log('usage: node tools/render-pics.mjs [id ...] [--palette day|dusk|all] [--out dir] [--drawin]');
    process.exit(0);
  }
  try {
    const { written, pictures, stamps } = renderAll(opts);
    console.log(`render: ${pictures.length} picture(s), ${stamps.length} stamp(s) -> ${written.length} PNG(s)`);
    for (const f of written) console.log(`  ${f.replace(ROOT + '/', '')}`);
  } catch (e) {
    console.error(`render: ${e.message}`);
    process.exit(1);
  }
}
