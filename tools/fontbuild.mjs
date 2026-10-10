#!/usr/bin/env node
// The chrome font's build (BUILD_PLAN S5; GAME_DESIGN 11.9). OPH Chrome is
// our own EGA-style 8x14 bitmap font, drawn by hand in
// content/art/fonts/chrome8x14.txt (one # a font pixel), released under the
// SIL Open Font License 1.1 with no Reserved Font Name
// (web/fonts/OPHChrome-OFL.txt). The doc names Px437 IBM EGA 8x14, which is
// CC BY-SA, and this project ships only OFL, CC0 or public-domain fonts, so
// we draw our own: never traced or converted from another font.
//
//   parseBitmapFont(text) -> {name, cell: [8, 14], ascent: 11, glyphs}
//     The source: @font, @cell, @ascent, then @glyph <hex> <label> and its
//     14 rows of . and # (8 each); a line starting # elsewhere is a comment.
//     glyphs: Map<code point, Uint8Array(14)>, a byte a row, bit 7 the
//     leftmost column. Errors carry line numbers: a row not 8 wide, a
//     glyph not 14 rows, a repeated code point, a missing required glyph.
//   toTTF(font) -> Buffer, a TrueType file: 128 units a font pixel
//     (unitsPerEm 1536 = 12 x 128: see UNITS_PER_EM), ascender 1408 and
//     descender -384 (the 14-row cell), every advance 1024 (8 pixels). Each glyph's pixels are merged into
//     rectangles (row runs, then identical runs stacked), each one
//     clockwise contour of four on-curve points. Tables: head, hhea, maxp,
//     OS/2 (version 4, fsType 0), hmtx, cmap (format 4 and format 12),
//     loca (long), glyf, name (the OFL notice), post (format 3). No clock:
//     head's dates are a constant, so the same source makes the same bytes.
//   fromTTF(bytes) -> {glyphs, advances, names, ...}, the outlines read
//     back into bitmaps (the round-trip test).
//   chromeStrings(text) and coverage(font, strings): every character the
//     chrome font must set (BUILD_PLAN S5 3.6.2).
//   buildFonts(out): fonts/OPHChrome.ttf into a built channel (both
//     channels: file parity; main never loads it).
//
// `node tools/fontbuild.mjs --specimen` writes out/fonts/specimen.png:
// every glyph at 4 device pixels a font pixel, snow on ink and ink on snow,
// with the S5 lines set in it, for the design loop (look, compare with an
// EGA 8x14 reference by eye, redraw). No dependencies: Node's Buffer only.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './pics.mjs';
import { encodePNG } from './png.mjs';
import { PALETTE } from '../web/js/gfx/palette.js';

/** The font's source, and what it builds. */
export const FONT_SOURCE = join('content', 'art', 'fonts', 'chrome8x14.txt');
export const FONT_FILE = 'OPHChrome.ttf';
export const CELL = Object.freeze([8, 14]);
export const ASCENT = 11;
/** Font units a font pixel. */
export const UNIT = 128;
/**
 * The em is 12 font pixels (1536 units), not the cell's 14: the page sets
 * the font at 12 font pixels (16 CSS px on 3x, 18 on 2x, whole numbers that
 * browsers keep exactly) on 14-pixel lines. At 14 x 4/3 = 18.67 px Chromium
 * keeps the size in 1/64 px, and the glyphs drift off the device pixels.
 */
export const UNITS_PER_EM = 12 * UNIT;
export const ADVANCE = CELL[0] * UNIT;
export const FONT_VERSION = '1.000';
export const COPYRIGHT = 'Copyright 2026 The OP Hiker Project Authors';
export const LICENSE = 'This Font Software is licensed under the SIL Open Font License, Version 1.1. This license is available with a FAQ at: https://openfontlicense.org';
export const LICENSE_URL = 'https://openfontlicense.org';
/** head.created and head.modified: 2026-10-09T00:00:00Z in seconds since 1904, a constant (no clock). */
export const FONT_DATE = 3874348800;

/** The set (3.6.2): printable ASCII, and the symbols the chrome shows. */
export const REQUIRED = Object.freeze([
  ...Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) => 0x20 + i),
  0xb7, // · middle dot
  0xd7, // × multiplication sign
  0x2013, // – en dash
  0x2014, // — em dash
  0x2018, // ‘
  0x2019, // ’
  0x201c, // “
  0x201d, // ”
  0x2026, // … ellipsis
  0x2261, // ≡ identical to (the menu)
  0x25be, // ▾ small down triangle (the continuation, S6)
  0x2666, // ♦ diamond (the confirm mark, S6)
  0x2713, // ✓ check mark
]);

/**
 * @typedef {{name: string, cell: number[], ascent: number, glyphs: Map<number, Uint8Array>}} BitmapFont
 */

/**
 * Parse the font's source.
 * @param {string} text
 * @param {{required?: readonly number[]}} [o]
 * @returns {BitmapFont}
 */
export function parseBitmapFont(text, { required = REQUIRED } = {}) {
  const errors = [];
  let name = '';
  let cell = [...CELL];
  let ascent = ASCENT;
  /** @type {Map<number, Uint8Array>} */
  const glyphs = new Map();
  /** @type {{cp: number, line: number, rows: number[]} | null} */
  let cur = null;
  const close = () => {
    if (!cur) return;
    if (cur.rows.length !== cell[1]) errors.push(`line ${cur.line}: glyph U+${hex(cur.cp)} has ${cur.rows.length} rows, not ${cell[1]}`);
    else glyphs.set(cur.cp, Uint8Array.from(cur.rows));
    cur = null;
  };
  text.split(/\r?\n/).forEach((raw, i) => {
    const n = i + 1;
    const row = raw.trimEnd();
    if (!row) return;
    // Inside a glyph a line of . and # is a row; anywhere else # starts a comment.
    const isRow = cur !== null && /^[.#]+$/.test(row);
    if (!isRow && row.startsWith('#')) return;
    if (row.startsWith('@')) {
      const [kw, ...rest] = row.slice(1).split(/\s+/);
      if (kw === 'glyph') {
        close();
        const cp = parseInt(rest[0] || '', 16);
        if (!/^[0-9A-Fa-f]{4,6}$/.test(rest[0] || '')) errors.push(`line ${n}: @glyph needs a code point in hex`);
        else if (glyphs.has(cp)) errors.push(`line ${n}: U+${hex(cp)} again`);
        else cur = { cp, line: n, rows: [] };
      } else if (kw === 'font') name = rest.join(' ');
      else if (kw === 'cell') cell = rest.map(Number);
      else if (kw === 'ascent') ascent = Number(rest[0]);
      else errors.push(`line ${n}: no directive @${kw}`);
      return;
    }
    if (!cur) {
      errors.push(`line ${n}: a row outside any @glyph`);
      return;
    }
    if (row.length !== cell[0] || /[^.#]/.test(row)) {
      errors.push(`line ${n}: a row is ${cell[0]} of . and #, not "${row}"`);
      return;
    }
    let bits = 0;
    for (let x = 0; x < row.length; x++) if (row[x] === '#') bits |= 0x80 >> x;
    cur.rows.push(bits);
  });
  close();
  if (cell[0] !== CELL[0] || cell[1] !== CELL[1]) errors.push(`@cell is ${cell.join(' ')}, not ${CELL.join(' ')}`);
  if (ascent !== ASCENT) errors.push(`@ascent is ${ascent}, not ${ASCENT}`);
  for (const cp of required) if (!glyphs.has(cp)) errors.push(`U+${hex(cp)} ${String.fromCodePoint(cp)} is missing`);
  if (errors.length) throw new Error(`fontbuild: ${FONT_SOURCE}:\n  ${errors.join('\n  ')}`);
  return { name, cell, ascent, glyphs };
}

/** @param {number} cp */
function hex(cp) {
  return cp.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * A glyph's pixels as rectangles: runs along each row, stacked while the
 * next row has the same run. [x0, x1, r0, r1]: columns x0..x1-1, rows
 * r0..r1-1. In a stable order (top to bottom, then left to right).
 * @param {Uint8Array} rows
 * @returns {number[][]}
 */
export function rectangles(rows) {
  /** @type {number[][]} */
  const done = [];
  /** @type {Map<string, number[]>} */
  let open = new Map();
  for (let r = 0; r <= rows.length; r++) {
    /** @type {Map<string, number[]>} */
    const next = new Map();
    const bits = r < rows.length ? rows[r] : 0;
    for (let x = 0; x < 8; ) {
      if (!(bits & (0x80 >> x))) {
        x++;
        continue;
      }
      let e = x;
      while (e < 8 && bits & (0x80 >> e)) e++;
      const k = `${x}:${e}`;
      const rect = open.get(k);
      if (rect) {
        rect[3] = r + 1;
        next.set(k, rect);
        open.delete(k);
      } else next.set(k, [x, e, r, r + 1]);
      x = e;
    }
    for (const rect of open.values()) done.push(rect);
    open = next;
  }
  return done.sort((a, b) => a[2] - b[2] || a[0] - b[0]);
}

// ---- Writing big-endian tables -------------------------------------------

class Out {
  constructor() {
    /** @type {number[]} */
    this.b = [];
  }
  u8(v) {
    this.b.push(v & 0xff);
    return this;
  }
  u16(v) {
    return this.u8(v >> 8).u8(v);
  }
  i16(v) {
    return this.u16(v < 0 ? v + 0x10000 : v);
  }
  u32(v) {
    return this.u16(Math.floor(v / 0x10000) & 0xffff).u16(v & 0xffff);
  }
  i64(v) {
    return this.u32(Math.floor(v / 0x100000000)).u32(v % 0x100000000);
  }
  tag(s) {
    for (let i = 0; i < 4; i++) this.u8(s.charCodeAt(i));
    return this;
  }
  bytes(arr) {
    for (const x of arr) this.u8(x);
    return this;
  }
  pad4() {
    while (this.b.length % 4) this.u8(0);
    return this;
  }
  get length() {
    return this.b.length;
  }
  buf() {
    return Buffer.from(this.b);
  }
}

/** The OpenType checksum: the sum of the big-endian uint32s, zero-padded. */
export function checksum(buf) {
  let sum = 0;
  for (let i = 0; i < buf.length; i += 4) {
    const w = ((buf[i] || 0) * 0x1000000 + ((buf[i + 1] || 0) << 16) + ((buf[i + 2] || 0) << 8) + (buf[i + 3] || 0)) >>> 0;
    sum = (sum + w) % 0x100000000;
  }
  return sum;
}

/** Unicode range bits for OS/2 (the blocks this font touches). */
const RANGE_BITS = [
  [0x0000, 0x007f, 0],
  [0x0080, 0x00ff, 1],
  [0x2000, 0x206f, 31],
  [0x2200, 0x22ff, 38],
  [0x25a0, 0x25ff, 45],
  [0x2600, 0x26ff, 46],
  [0x2700, 0x27bf, 47],
];

/**
 * @param {number[]} cps
 * @returns {number[]} ulUnicodeRange1..4
 */
function unicodeRanges(cps) {
  const r = [0, 0, 0, 0];
  for (const [a, b, bit] of RANGE_BITS) if (cps.some((c) => c >= a && c <= b)) r[bit >> 5] = (r[bit >> 5] | (1 << (bit & 31))) >>> 0;
  return r;
}

/**
 * One glyph's glyf record (empty for a glyph with no pixels), and its box.
 * @param {number[][]} rects
 */
function glyphRecord(rects) {
  if (!rects.length) return { bytes: Buffer.alloc(0), box: null, points: 0, contours: 0 };
  /** @type {number[][]} */
  const pts = [];
  for (const [x0, x1, r0, r1] of rects) {
    const xa = x0 * UNIT;
    const xb = x1 * UNIT;
    const yb = (ASCENT - r1) * UNIT;
    const yt = (ASCENT - r0) * UNIT;
    // Clockwise with y up: the outside of a filled contour (TrueType).
    pts.push([xa, yb], [xa, yt], [xb, yt], [xb, yb]);
  }
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const o = new Out();
  o.i16(rects.length);
  for (const v of box) o.i16(v);
  rects.forEach((_, i) => o.u16(i * 4 + 3));
  o.u16(0); // no instructions
  const flags = [];
  const xb = new Out();
  const yb = new Out();
  let px = 0;
  let py = 0;
  for (const [x, y] of pts) {
    let f = 0x01; // on the curve
    const dx = x - px;
    const dy = y - py;
    if (dx === 0) f |= 0x10;
    else if (Math.abs(dx) <= 255) {
      f |= 0x02 | (dx > 0 ? 0x10 : 0);
      xb.u8(Math.abs(dx));
    } else xb.i16(dx);
    if (dy === 0) f |= 0x20;
    else if (Math.abs(dy) <= 255) {
      f |= 0x04 | (dy > 0 ? 0x20 : 0);
      yb.u8(Math.abs(dy));
    } else yb.i16(dy);
    flags.push(f);
    px = x;
    py = y;
  }
  o.bytes(flags).bytes(xb.b).bytes(yb.b);
  return { bytes: o.pad4().buf(), box, points: pts.length, contours: rects.length };
}

/**
 * The cmap's two subtables for a sorted list of [code point, glyph id].
 * @param {number[][]} map
 */
function cmapTable(map) {
  // Format 4: runs of consecutive code points with consecutive glyph ids (BMP only).
  const bmp = map.filter(([cp]) => cp <= 0xffff);
  /** @type {number[][]} [start, end, delta] */
  const segs = [];
  for (const [cp, gid] of bmp) {
    const last = segs[segs.length - 1];
    if (last && cp === last[1] + 1 && gid - cp === last[2]) last[1] = cp;
    else segs.push([cp, cp, gid - cp]);
  }
  segs.push([0xffff, 0xffff, 1]);
  const n = segs.length;
  let pow = 1;
  let sel = 0;
  while (pow * 2 <= n) {
    pow *= 2;
    sel++;
  }
  const f4 = new Out();
  f4.u16(4).u16(16 + 8 * n).u16(0).u16(2 * n).u16(2 * pow).u16(sel).u16(2 * n - 2 * pow);
  for (const s of segs) f4.u16(s[1]);
  f4.u16(0);
  for (const s of segs) f4.u16(s[0]);
  for (const s of segs) f4.u16((s[2] + 0x10000) & 0xffff);
  for (let i = 0; i < n; i++) f4.u16(0);
  // Format 12: the same runs, for every code point.
  /** @type {number[][]} */
  const groups = [];
  for (const [cp, gid] of map) {
    const last = groups[groups.length - 1];
    if (last && cp === last[1] + 1 && gid === last[2] + (cp - last[0])) last[1] = cp;
    else groups.push([cp, cp, gid]);
  }
  const f12 = new Out();
  f12.u16(12).u16(0).u32(16 + 12 * groups.length).u32(0).u32(groups.length);
  for (const [a, b, g] of groups) f12.u32(a).u32(b).u32(g);
  // Records sorted by platform, then encoding: (0,3) and (3,1) to format 4, (0,4) and (3,10) to format 12.
  const head = 4 + 4 * 8;
  const at4 = head;
  const at12 = head + f4.length;
  const o = new Out();
  o.u16(0).u16(4);
  for (const [pid, eid, off] of [
    [0, 3, at4],
    [0, 4, at12],
    [3, 1, at4],
    [3, 10, at12],
  ])
    o.u16(pid).u16(eid).u32(off);
  return Buffer.concat([o.buf(), f4.buf(), f12.buf()]);
}

/**
 * The name table: Windows, US English, UTF-16BE.
 * @param {Record<number, string>} names
 */
function nameTable(names) {
  const ids = Object.keys(names)
    .map(Number)
    .sort((a, b) => a - b);
  const strings = new Out();
  const recs = new Out();
  for (const id of ids) {
    const s = names[id];
    const off = strings.length;
    for (const ch of s) {
      const c = ch.codePointAt(0) || 0;
      if (c > 0xffff) throw new Error('fontbuild: a name outside the BMP');
      strings.u16(c);
    }
    recs.u16(3).u16(1).u16(0x409).u16(id).u16(strings.length - off).u16(off);
  }
  const o = new Out();
  o.u16(0).u16(ids.length).u16(6 + 12 * ids.length);
  return Buffer.concat([o.buf(), recs.buf(), strings.buf()]);
}

/** The font's names (ids 0 to 6, 13, 14). */
export function fontNames(family = 'OPH Chrome') {
  const ps = family.replace(/[^A-Za-z0-9]/g, '');
  return {
    0: COPYRIGHT,
    1: family,
    2: 'Regular',
    3: `${FONT_VERSION};NONE;${ps}-Regular`,
    4: family,
    5: `Version ${FONT_VERSION}`,
    6: `${ps}-Regular`,
    13: LICENSE,
    14: LICENSE_URL,
  };
}

/**
 * The TrueType file.
 * @param {BitmapFont} font
 * @returns {Buffer}
 */
export function toTTF(font) {
  const cps = [...font.glyphs.keys()].sort((a, b) => a - b);
  // Glyph 0, .notdef: a hollow box the size of a capital.
  const notdef = new Uint8Array(CELL[1]);
  notdef[2] = 0xfe;
  for (let r = 3; r < 10; r++) notdef[r] = 0x82;
  notdef[10] = 0xfe;
  const bitmaps = [notdef, ...cps.map((cp) => /** @type {Uint8Array} */ (font.glyphs.get(cp)))];
  const records = bitmaps.map((rows) => glyphRecord(rectangles(rows)));
  const numGlyphs = records.length;

  const glyf = Buffer.concat(records.map((r) => r.bytes));
  const loca = new Out();
  let off = 0;
  for (const r of records) {
    loca.u32(off);
    off += r.bytes.length;
  }
  loca.u32(off);

  const boxes = records.filter((r) => r.box).map((r) => /** @type {number[]} */ (r.box));
  const xMin = Math.min(...boxes.map((b) => b[0]));
  const yMin = Math.min(...boxes.map((b) => b[1]));
  const xMax = Math.max(...boxes.map((b) => b[2]));
  const yMax = Math.max(...boxes.map((b) => b[3]));

  const hmtx = new Out();
  for (const r of records) hmtx.u16(ADVANCE).i16(r.box ? r.box[0] : 0);

  const head = new Out();
  head.u16(1).u16(0).u32(0x00010000).u32(0).u32(0x5f0f3cf5).u16(0x000b).u16(UNITS_PER_EM);
  head.i64(FONT_DATE).i64(FONT_DATE);
  head.i16(xMin).i16(yMin).i16(xMax).i16(yMax);
  head.u16(0).u16(12).i16(2).i16(1).i16(0);

  const descender = (ASCENT - CELL[1]) * UNIT;
  const hhea = new Out();
  hhea.u16(1).u16(0).i16(ASCENT * UNIT).i16(descender).i16(0).u16(ADVANCE);
  hhea.i16(xMin).i16(Math.min(...boxes.map((b) => ADVANCE - b[2]))).i16(xMax);
  hhea.i16(1).i16(0).i16(0).i16(0).i16(0).i16(0).i16(0).i16(0).u16(numGlyphs);

  const maxp = new Out();
  maxp.u32(0x00010000).u16(numGlyphs);
  maxp.u16(Math.max(...records.map((r) => r.points))).u16(Math.max(...records.map((r) => r.contours)));
  maxp.u16(0).u16(0).u16(2).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0);

  const os2 = new Out();
  const ranges = unicodeRanges(cps);
  os2.u16(4).i16(ADVANCE).u16(400).u16(5).u16(0);
  // Sub- and superscripts, the strikeout: plain proportions of the em.
  os2.i16(1152).i16(1152).i16(0).i16(256).i16(1152).i16(1152).i16(0).i16(768);
  os2.i16(UNIT).i16(5 * UNIT).i16(0);
  os2.bytes([2, 0, 0, 9, 0, 0, 0, 0, 0, 0]); // panose: Latin text, monospaced
  for (const r of ranges) os2.u32(r);
  os2.tag('NONE').u16(0x00c0); // REGULAR, USE_TYPO_METRICS
  os2.u16(Math.min(cps[0], 0xffff)).u16(Math.min(cps[cps.length - 1], 0xffff));
  os2.i16(ASCENT * UNIT).i16(descender).i16(0).u16(ASCENT * UNIT).u16(-descender);
  os2.u32(1).u32(0); // code pages: Latin 1
  os2.i16(7 * UNIT).i16(9 * UNIT).u16(0).u16(0x20).u16(0);

  const post = new Out();
  post.u32(0x00030000).u32(0).i16(-2 * UNIT).i16(UNIT).u32(1).u32(0).u32(0).u32(0).u32(0);

  // gasp: at every size, smooth and never grid-fit (the outlines are on the pixel grid already).
  const gasp = new Out();
  gasp.u16(1).u16(1).u16(0xffff).u16(0x000a);

  const map = cps.map((cp, i) => [cp, i + 1]);
  const tables = {
    'OS/2': os2.buf(),
    cmap: cmapTable(map),
    gasp: gasp.buf(),
    glyf,
    head: head.buf(),
    hhea: hhea.buf(),
    hmtx: hmtx.buf(),
    loca: loca.buf(),
    maxp: maxp.buf(),
    name: nameTable(fontNames(font.name || 'OPH Chrome')),
    post: post.buf(),
  };
  const tags = Object.keys(tables).sort();
  const n = tags.length;
  let pow = 1;
  let sel = 0;
  while (pow * 2 <= n) {
    pow *= 2;
    sel++;
  }
  const dir = new Out();
  dir.u32(0x00010000).u16(n).u16(pow * 16).u16(sel).u16(n * 16 - pow * 16);
  let at = 12 + 16 * n;
  const body = [];
  let headAt = 0;
  for (const tag of tags) {
    const data = /** @type {Record<string, Buffer>} */ (tables)[tag];
    dir.tag(tag).u32(checksum(data)).u32(at).u32(data.length);
    if (tag === 'head') headAt = at;
    const padded = Buffer.alloc(Math.ceil(data.length / 4) * 4);
    data.copy(padded);
    body.push(padded);
    at += padded.length;
  }
  const file = Buffer.concat([dir.buf(), ...body]);
  // checkSumAdjustment: 0xB1B0AFBA minus the whole file's sum (with it zero).
  file.writeUInt32BE((0xb1b0afba - checksum(file) + 0x100000000) % 0x100000000, headAt + 8);
  return file;
}

// ---- Reading it back ------------------------------------------------------

/**
 * Read a TrueType file this tool wrote: its tables, its names, every
 * mapped code point's advance and bitmap (each contour filled as the
 * rectangle its four points bound).
 * @param {Buffer | Uint8Array} bytes
 */
export function fromTTF(bytes) {
  const b = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const n = b.readUInt16BE(4);
  /** @type {Record<string, {checksum: number, offset: number, length: number}>} */
  const tables = {};
  for (let i = 0; i < n; i++) {
    const r = 12 + 16 * i;
    tables[b.toString('latin1', r, r + 4)] = { checksum: b.readUInt32BE(r + 4), offset: b.readUInt32BE(r + 8), length: b.readUInt32BE(r + 12) };
  }
  const t = (/** @type {string} */ tag) => {
    const e = tables[tag];
    if (!e) throw new Error(`fontbuild: no ${tag} table`);
    return b.subarray(e.offset, e.offset + e.length);
  };
  const head = t('head');
  const unitsPerEm = head.readUInt16BE(18);
  const longLoca = head.readInt16BE(50) === 1;
  const numGlyphs = t('maxp').readUInt16BE(4);
  const hhea = t('hhea');
  const numH = hhea.readUInt16BE(34);
  const hmtx = t('hmtx');
  const advance = (/** @type {number} */ g) => hmtx.readUInt16BE(4 * Math.min(g, numH - 1));
  const loca = t('loca');
  const locaAt = (/** @type {number} */ g) => (longLoca ? loca.readUInt32BE(4 * g) : 2 * loca.readUInt16BE(2 * g));
  const glyf = t('glyf');
  // The cmap: format 12 under (3,10), else format 4 under (3,1).
  const cmap = t('cmap');
  /** @type {Map<number, number>} */
  const cmapOf = new Map();
  const nt = cmap.readUInt16BE(2);
  const subs = [];
  for (let i = 0; i < nt; i++) subs.push([cmap.readUInt16BE(4 + 8 * i), cmap.readUInt16BE(6 + 8 * i), cmap.readUInt32BE(8 + 8 * i)]);
  const f12 = subs.find(([p, e]) => p === 3 && e === 10);
  const f4 = subs.find(([p, e]) => p === 3 && e === 1);
  const formats = subs.map(([p, e, o]) => [p, e, cmap.readUInt16BE(o)]);
  if (f12) {
    const o = f12[2];
    const groups = cmap.readUInt32BE(o + 12);
    for (let i = 0; i < groups; i++) {
      const g = o + 16 + 12 * i;
      const a = cmap.readUInt32BE(g);
      const z = cmap.readUInt32BE(g + 4);
      const s = cmap.readUInt32BE(g + 8);
      for (let cp = a; cp <= z; cp++) cmapOf.set(cp, s + cp - a);
    }
  }
  /** @type {Map<number, number>} */
  const cmap4 = new Map();
  if (f4) {
    const o = f4[2];
    const segX2 = cmap.readUInt16BE(o + 6);
    const seg = segX2 / 2;
    const ends = o + 14;
    const starts = ends + segX2 + 2;
    const deltas = starts + segX2;
    const ranges = deltas + segX2;
    for (let i = 0; i < seg; i++) {
      const end = cmap.readUInt16BE(ends + 2 * i);
      const start = cmap.readUInt16BE(starts + 2 * i);
      const delta = cmap.readUInt16BE(deltas + 2 * i);
      if (cmap.readUInt16BE(ranges + 2 * i) !== 0) throw new Error('fontbuild: idRangeOffset is not read');
      for (let cp = start; cp <= end && cp !== 0xffff; cp++) cmap4.set(cp, (cp + delta) & 0xffff);
    }
  }
  const readGlyph = (/** @type {number} */ g) => {
    const rows = new Uint8Array(CELL[1]);
    const a = locaAt(g);
    const z = locaAt(g + 1);
    if (z === a) return rows;
    const d = glyf.subarray(a, z);
    const nc = d.readInt16BE(0);
    const ends = [];
    for (let i = 0; i < nc; i++) ends.push(d.readUInt16BE(10 + 2 * i));
    const np = ends[nc - 1] + 1;
    let p = 10 + 2 * nc;
    p += 2 + d.readUInt16BE(p);
    const flags = [];
    while (flags.length < np) {
      const f = d[p++];
      flags.push(f);
      if (f & 0x08) for (let r = d[p++]; r > 0; r--) flags.push(f);
    }
    const coord = (/** @type {number} */ short, /** @type {number} */ same) => {
      const out = [];
      let v = 0;
      for (const f of flags) {
        if (f & short) {
          const m = d[p++];
          v += f & same ? m : -m;
        } else if (!(f & same)) {
          v += d.readInt16BE(p);
          p += 2;
        }
        out.push(v);
      }
      return out;
    };
    const xs = coord(0x02, 0x10);
    const ys = coord(0x04, 0x20);
    let s = 0;
    for (const e of ends) {
      const cx = xs.slice(s, e + 1);
      const cy = ys.slice(s, e + 1);
      s = e + 1;
      const x0 = Math.min(...cx) / UNIT;
      const x1 = Math.max(...cx) / UNIT;
      const r0 = ASCENT - Math.max(...cy) / UNIT;
      const r1 = ASCENT - Math.min(...cy) / UNIT;
      for (let r = r0; r < r1; r++) for (let x = x0; x < x1; x++) rows[r] |= 0x80 >> x;
    }
    return rows;
  };
  /** @type {Map<number, Uint8Array>} */
  const glyphs = new Map();
  /** @type {Map<number, number>} */
  const advances = new Map();
  for (const [cp, g] of cmapOf.size ? cmapOf : cmap4) {
    glyphs.set(cp, readGlyph(g));
    advances.set(cp, advance(g));
  }
  // The names (Windows, UTF-16BE).
  const nm = t('name');
  /** @type {Record<number, string>} */
  const names = {};
  const count = nm.readUInt16BE(2);
  const so = nm.readUInt16BE(4);
  for (let i = 0; i < count; i++) {
    const r = 6 + 12 * i;
    if (nm.readUInt16BE(r) !== 3) continue;
    const len = nm.readUInt16BE(r + 8);
    const o = so + nm.readUInt16BE(r + 10);
    let s = '';
    for (let k = 0; k < len; k += 2) s += String.fromCharCode(nm.readUInt16BE(o + k));
    names[nm.readUInt16BE(r + 6)] = s;
  }
  const os2 = t('OS/2');
  return {
    tables,
    unitsPerEm,
    numGlyphs,
    glyphs,
    advances,
    cmap4,
    cmap12: cmapOf,
    formats,
    names,
    fsType: os2.readUInt16BE(8),
    os2Version: os2.readUInt16BE(0),
    ascender: hhea.readInt16BE(4),
    descender: hhea.readInt16BE(6),
    checkSumAdjustment: head.readUInt32BE(8),
    created: head.readUInt32BE(20) * 0x100000000 + head.readUInt32BE(24),
  };
}

// ---- What the chrome sets --------------------------------------------------

/** The line ids the chrome font sets (BUILD_PLAN S5 3.6.2): the status line, the caption, the strip, the toolbar. */
export const CHROME_LINES = /^trail\.(status|caption|strip|toolbar|walk_on)\b/;

/**
 * Every string the chrome font must set, from tools/text.mjs readText():
 * the chrome's lines (their {vars} dropped), every choice label (content
 * refs from a "label" field), every place a caption can show (the scope's
 * park nodes, by the gazetteer), and the digits and the comma the caption
 * and the mile are built from.
 * @param {any} text readText()
 * @param {{labels?: string[], places?: string[]}} [o] label ids; place ids
 * @returns {string[]}
 */
export function chromeStrings(text, { labels = [], places = [] } = {}) {
  const out = ['0123456789,.'];
  for (const [id, line] of text.lines) {
    if (CHROME_LINES.test(id) || labels.includes(id)) out.push(...wordsOf(line.text));
  }
  for (const p of places) {
    const n = text.names && text.names.places && text.names.places.get(`place.${p}`);
    if (n) out.push(String(n.text));
  }
  return out;
}

/** @param {string | {one: string, other: string}} w */
function wordsOf(w) {
  const forms = typeof w === 'string' ? [w] : Object.values(w);
  return forms.map((f) => String(f).replace(/\{[A-Za-z0-9_]+\}/g, '').replace(/\*/g, ''));
}

/**
 * The characters in strings that the font has no glyph for, sorted, once each.
 * @param {BitmapFont} font
 * @param {string[]} strings
 */
export function coverage(font, strings) {
  const missing = new Set();
  for (const s of strings) for (const ch of s) if (ch !== '\n' && !font.glyphs.has(/** @type {number} */ (ch.codePointAt(0)))) missing.add(ch);
  return [...missing].sort();
}

// ---- Build and specimen ----------------------------------------------------

/**
 * Read and parse the repo's font.
 * @param {string} [root]
 */
export function loadChromeFont(root = ROOT) {
  return parseBitmapFont(readFileSync(join(root, FONT_SOURCE), 'utf8'));
}

/**
 * The build's step: fonts/OPHChrome.ttf into a built channel.
 * @param {string} out dist/<channel>
 * @param {{root?: string}} [o]
 */
export function buildFonts(out, { root = ROOT } = {}) {
  const ttf = toTTF(loadChromeFont(root));
  mkdirSync(join(out, 'fonts'), { recursive: true });
  writeFileSync(join(out, 'fonts', FONT_FILE), ttf);
  return ttf;
}

/**
 * The specimen: every glyph, snow on ink and ink on snow, then the lines,
 * at scale device pixels a font pixel.
 * @param {BitmapFont} font
 * @param {string[]} lines
 * @param {number} [scale]
 */
export function specimen(font, lines, scale = 4) {
  const cps = [...font.glyphs.keys()].sort((a, b) => a - b);
  const PER_ROW = 16;
  const pad = 2;
  const glyphRows = Math.ceil(cps.length / PER_ROW);
  const textCols = Math.max(PER_ROW, ...lines.map((l) => [...l].length));
  const cols = textCols + 2 * pad;
  const rowsInCells = pad + glyphRows + 1 + glyphRows + 1 + 2 * lines.length + 1 + pad;
  const W = cols * CELL[0] * scale;
  const H = rowsInCells * CELL[1] * scale;
  const rgb = new Uint8Array(W * H * 3);
  const ink = hexRgb(PALETTE[0]);
  const snow = hexRgb(PALETTE[4]);
  const fill = (/** @type {number} */ x0, /** @type {number} */ y0, /** @type {number} */ w, /** @type {number} */ h, /** @type {number[]} */ c) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) rgb.set(c, (y * W + x) * 3);
  };
  fill(0, 0, W, H, ink);
  const put = (/** @type {number} */ cp, /** @type {number} */ cx, /** @type {number} */ cy, /** @type {number[]} */ fg, /** @type {number[] | null} */ bg) => {
    const x0 = cx * CELL[0] * scale;
    const y0 = cy * CELL[1] * scale;
    if (bg) fill(x0, y0, CELL[0] * scale, CELL[1] * scale, bg);
    const rows = font.glyphs.get(cp);
    if (!rows) return;
    for (let r = 0; r < CELL[1]; r++) for (let x = 0; x < CELL[0]; x++) if (rows[r] & (0x80 >> x)) fill(x0 + x * scale, y0 + r * scale, scale, scale, fg);
  };
  let cy = pad;
  cps.forEach((cp, i) => put(cp, pad + (i % PER_ROW), cy + Math.floor(i / PER_ROW), snow, null));
  cy += glyphRows + 1;
  cps.forEach((cp, i) => put(cp, pad + (i % PER_ROW), cy + Math.floor(i / PER_ROW), ink, snow));
  cy += glyphRows + 1;
  for (const line of lines) {
    [...line].forEach((ch, i) => put(/** @type {number} */ (ch.codePointAt(0)), pad + i, cy, snow, null));
    [...line].forEach((ch, i) => put(/** @type {number} */ (ch.codePointAt(0)), pad + i, cy + 1, ink, snow));
    cy += 2;
  }
  return encodePNG({ width: W, height: H, type: 'rgb', data: rgb });
}

/** @param {string} h */
function hexRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    const font = loadChromeFont();
    const ttf = toTTF(font);
    console.log(`fontbuild: ${font.glyphs.size} glyphs, ${ttf.length} bytes`);
    if (process.argv.includes('--specimen')) {
      const { readText } = await import('./text.mjs');
      const text = readText(ROOT, { strict: false });
      const t = (/** @type {string} */ id) => String(text.lines.get(id)?.text ?? '');
      const lines = [
        'Day 1 · Deer Lake · 3,530 ft',
        'Day 1 · Seven Lakes Basin · 4,900 ft',
        `${t('trail.status.sound_on')}  ${t('trail.status.sound_off')}  ≡`,
        'mi 3.7  mi 6.9  0O 1lI 5S rn m',
        `> ${t('trail.walk_on')}`,
        `${t('trail.toolbar.pack')}  ${t('trail.toolbar.map')}  ${t('trail.toolbar.log')}`,
        '♦ 55-75%  ✓ ▾ × “quoted” ‘it’s’ – — …',
        'The quick brown fox jumps over the lazy dog.',
        'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG!',
      ];
      const dir = join(ROOT, 'out', 'fonts');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'specimen.png'), specimen(font, lines));
      console.log(`fontbuild: out/fonts/specimen.png`);
    }
  } catch (e) {
    console.error(/** @type {Error} */ (e).message);
    process.exit(1);
  }
}
