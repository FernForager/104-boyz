// The fonts' measured widths, from the bytes the phone renders (BUILD_PLAN
// S6, the spec's C.3; GAME_DESIGN 11.9, 12.1), for lint T02 (measured fit)
// and its tests. No new font files and no dependencies: Node's Buffer and
// Brotli only.
//
//   OPH Chrome      read through tools/fontbuild.mjs's own toTTF and
//                   fromTTF: monospace, every advance 1024 units of a 1536
//                   em (8 font pixels at the 12-font-pixel size the page
//                   sets it at). Labels, tags, the caption, the pencil rows
//                   and the Why sheet's rows.
//   Pixelify Sans   web/fonts/PixelifySans.woff2: the box and the Look box
//                   at the default text size. Variable (wght 400 to 700,
//                   400 by default), and the box sets 400, so its advances
//                   are hmtx's.
//   Literata        web/fonts/Literata.woff2 (and its italic): everything
//                   in Plain, under iOS Larger Text. Variable in opsz (7 to
//                   72, 12 by default) with an HVAR, so frame.css pins the
//                   Plain face to its default optical size (the spec's lead
//                   call 6: font-optical-sizing none, font-variation-
//                   settings "opsz" 12), and its advances are then exactly
//                   hmtx's; a test reads the 12 from fvar and the CSS.
//
// The WOFF2 reader (W3C WOFF2 5): the header, the table directory (a known
// tag's index or its own four bytes, a transform version, the original
// length and, for a transformed table, its transformed length, each a
// UIntBase128), then one Brotli stream holding every table, back to back
// in directory order. Only glyf and loca are transformed in our two files,
// so head, hhea, maxp, hmtx, cmap and fvar are read as they are; a
// transformed hmtx is refused rather than misread.
//
// The line breaker (breakLines; A.4's test shares it): greedy; a break
// after U+0020 (the space hangs past the line's end) and after -, – and —;
// never at a no-break space; \n forced; no kerning, no ligatures, no
// letter-spacing (frame.css sets all three off, 2.8); a word wider than
// its line is an error; and 1 px of slack each line, against Safari's
// sub-pixel advances: a line fits when it is at least 1 px narrower than
// its box.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { brotliDecompressSync } from 'node:zlib';
import { ROOT } from './pics.mjs';
import { loadChromeFont, toTTF, fromTTF } from './fontbuild.mjs';

/** WOFF2's known table tags, by their index in the directory's flags (WOFF2 5.1). */
export const KNOWN_TAGS = Object.freeze(['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill']);
/** The shipped faces T02 measures (web/fonts/). */
export const FACE_FILES = Object.freeze({ pixelify: 'PixelifySans.woff2', literata: 'Literata.woff2', literataItalic: 'Literata-Italic.woff2' });
/** A line fits when it is this much narrower than its box (Safari's sub-pixel advances). */
export const SLACK_PX = 1;
const NBSP = ' ';
/** Where a line may break: after a space (it hangs), a hyphen, an en dash or an em dash. */
const BREAK_AFTER = new Set([' ', '-', '–', '—']);

/**
 * @typedef {object} Face a font's widths
 * @property {string} name
 * @property {number} unitsPerEm
 * @property {(cp: number) => number | null} advance a code point's advance, in font units (null: no glyph)
 * @property {{tag: string, min: number, def: number, max: number}[]} axes fvar's, or none
 * @property {string[]} tables the font's tables
 */

/**
 * Read a WOFF2 file's untransformed tables.
 * @param {Uint8Array} bytes
 * @returns {{flavor: string, tables: Map<string, Buffer>, transformed: string[]}}
 */
export function readWoff2(bytes) {
  const b = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (b.toString('latin1', 0, 4) !== 'wOF2') throw new Error('fontmetrics: not a WOFF2 file');
  const flavor = b.toString('latin1', 4, 8);
  const numTables = b.readUInt16BE(12);
  const compressed = b.readUInt32BE(20);
  let o = 48;
  const base128 = () => {
    let v = 0;
    for (let i = 0; i < 5; i++) {
      const x = b[o++];
      if (i === 0 && x === 0x80) throw new Error('fontmetrics: a UIntBase128 with a leading zero');
      v = v * 128 + (x & 0x7f);
      if (!(x & 0x80)) return v;
    }
    throw new Error('fontmetrics: a UIntBase128 over five bytes');
  };
  /** @type {{tag: string, length: number, transformed: boolean}[]} */
  const dir = [];
  for (let i = 0; i < numTables; i++) {
    const flags = b[o++];
    const tag = (flags & 0x3f) === 0x3f ? b.toString('latin1', o, (o += 4)) : KNOWN_TAGS[flags & 0x3f];
    const version = (flags >> 6) & 3;
    const orig = base128();
    // glyf and loca: version 0 is their transform; every other table: version 0 is none.
    const transformed = tag === 'glyf' || tag === 'loca' ? version === 0 : version !== 0;
    const length = transformed ? base128() : orig;
    dir.push({ tag, length, transformed });
  }
  if (flavor === 'ttcf') throw new Error('fontmetrics: a font collection is not read');
  const data = brotliDecompressSync(b.subarray(o, o + compressed));
  /** @type {Map<string, Buffer>} */
  const tables = new Map();
  const transformed = [];
  let at = 0;
  for (const d of dir) {
    if (d.transformed) transformed.push(d.tag);
    else tables.set(d.tag, data.subarray(at, at + d.length));
    at += d.length;
  }
  if (at !== data.length) throw new Error(`fontmetrics: the tables take ${at} bytes of ${data.length}`);
  return { flavor, tables, transformed };
}

/**
 * A cmap table: code point -> glyph id, from format 12 (3,10 or 0,4..6),
 * else format 4 (3,1 or 0,x), idRangeOffset included.
 * @param {Buffer} cmap
 * @returns {Map<number, number>}
 */
export function parseCmap(cmap) {
  const n = cmap.readUInt16BE(2);
  const subs = [];
  for (let i = 0; i < n; i++) subs.push({ p: cmap.readUInt16BE(4 + 8 * i), e: cmap.readUInt16BE(6 + 8 * i), o: cmap.readUInt32BE(8 + 8 * i) });
  /** @type {Map<number, number>} */
  const map = new Map();
  const f12 = subs.find((s) => cmap.readUInt16BE(s.o) === 12 && ((s.p === 3 && s.e === 10) || s.p === 0));
  if (f12) {
    const o = f12.o;
    const groups = cmap.readUInt32BE(o + 12);
    for (let i = 0; i < groups; i++) {
      const g = o + 16 + 12 * i;
      const a = cmap.readUInt32BE(g);
      const z = cmap.readUInt32BE(g + 4);
      const s = cmap.readUInt32BE(g + 8);
      for (let cp = a; cp <= z; cp++) map.set(cp, s + cp - a);
    }
    return map;
  }
  const f4 = subs.find((s) => cmap.readUInt16BE(s.o) === 4 && ((s.p === 3 && s.e === 1) || s.p === 0));
  if (!f4) throw new Error('fontmetrics: no cmap format 12 or 4 for Unicode');
  const o = f4.o;
  const segX2 = cmap.readUInt16BE(o + 6);
  const ends = o + 14;
  const starts = ends + segX2 + 2;
  const deltas = starts + segX2;
  const ranges = deltas + segX2;
  for (let i = 0; i < segX2 / 2; i++) {
    const end = cmap.readUInt16BE(ends + 2 * i);
    const start = cmap.readUInt16BE(starts + 2 * i);
    const delta = cmap.readUInt16BE(deltas + 2 * i);
    const range = cmap.readUInt16BE(ranges + 2 * i);
    for (let cp = start; cp <= end && cp !== 0xffff; cp++) {
      if (range === 0) map.set(cp, (cp + delta) & 0xffff);
      else {
        // The glyph index array, addressed from the idRangeOffset word itself.
        const g = cmap.readUInt16BE(ranges + 2 * i + range + 2 * (cp - start));
        if (g !== 0) map.set(cp, (g + delta) & 0xffff);
      }
    }
  }
  return map;
}

/**
 * An fvar table's axes, in design units.
 * @param {Buffer | undefined} fvar
 */
export function parseFvar(fvar) {
  if (!fvar) return [];
  const axesAt = fvar.readUInt16BE(4);
  const count = fvar.readUInt16BE(8);
  const size = fvar.readUInt16BE(10);
  const out = [];
  for (let i = 0; i < count; i++) {
    const a = axesAt + i * size;
    out.push({ tag: fvar.toString('latin1', a, a + 4), min: fvar.readInt32BE(a + 4) / 65536, def: fvar.readInt32BE(a + 8) / 65536, max: fvar.readInt32BE(a + 12) / 65536 });
  }
  return out;
}

/**
 * A face from its tables: head's em, hhea's and maxp's counts, hmtx's
 * advances and the cmap.
 * @param {string} name
 * @param {Map<string, Buffer>} tables
 * @returns {Face}
 */
export function faceOf(name, tables) {
  const need = (/** @type {string} */ tag) => {
    const t = tables.get(tag);
    if (!t) throw new Error(`fontmetrics: ${name} has no readable ${tag} table`);
    return t;
  };
  const head = need('head');
  if (head.readUInt32BE(12) !== 0x5f0f3cf5) throw new Error(`fontmetrics: ${name}'s head has no magic number`);
  const unitsPerEm = head.readUInt16BE(18);
  const numH = need('hhea').readUInt16BE(34);
  const numGlyphs = need('maxp').readUInt16BE(4);
  const hmtx = need('hmtx');
  if (hmtx.length < 4 * numH) throw new Error(`fontmetrics: ${name}'s hmtx is short`);
  const cmap = parseCmap(need('cmap'));
  return {
    name,
    unitsPerEm,
    advance(cp) {
      const g = cmap.get(cp);
      if (g === undefined || g >= numGlyphs) return null;
      return hmtx.readUInt16BE(4 * Math.min(g, numH - 1));
    },
    axes: parseFvar(tables.get('fvar')),
    tables: [...tables.keys()].sort(),
  };
}

/**
 * A shipped WOFF2 face.
 * @param {string} file under web/fonts/
 * @param {string} [root]
 * @returns {Face & {hvar: boolean}}
 */
export function woff2Face(file, root = ROOT) {
  const { tables, transformed } = readWoff2(readFileSync(join(root, 'web', 'fonts', file)));
  if (transformed.includes('hmtx')) throw new Error(`fontmetrics: ${file}'s hmtx is transformed, and this reader keeps to untransformed advances`);
  return { ...faceOf(file, tables), hvar: tables.has('HVAR') || transformed.includes('HVAR') };
}

/**
 * OPH Chrome, as the build makes it (tools/fontbuild.mjs), read back.
 * @param {string} [root]
 * @returns {Face}
 */
export function chromeFace(root = ROOT) {
  const ttf = fromTTF(toTTF(loadChromeFont(root)));
  return { name: 'OPH Chrome', unitsPerEm: ttf.unitsPerEm, advance: (cp) => (ttf.advances.has(cp) ? /** @type {number} */ (ttf.advances.get(cp)) : null), axes: [], tables: Object.keys(ttf.tables).sort() };
}

/** Every face T02 measures, read once a root. @type {Map<string, {chrome: Face, pixelify: Face, literata: Face & {hvar: boolean}, literataItalic: Face}>} */
const cache = new Map();
/** @param {string} [root] */
export function loadFaces(root = ROOT) {
  let f = cache.get(root);
  if (!f) {
    f = { chrome: chromeFace(root), pixelify: woff2Face(FACE_FILES.pixelify, root), literata: woff2Face(FACE_FILES.literata, root), literataItalic: woff2Face(FACE_FILES.literataItalic, root) };
    cache.set(root, f);
  }
  return f;
}

/**
 * A string's width in CSS px at a size: the sum of its advances (no
 * kerning, no ligatures, no letter-spacing). A no-break space is a space.
 * A character the face lacks adds nothing and goes in missing: a browser
 * would fall back to another font, whose width T02 can't know, so the
 * caller reports it.
 * @param {Face} face
 * @param {number} size font size, CSS px
 * @param {string} s
 * @param {Set<string>} [missing] collects characters the face lacks
 */
export function widthOf(face, size, s, missing) {
  let units = 0;
  for (const ch of s) {
    const cp = /** @type {number} */ ((ch === NBSP ? ' ' : ch).codePointAt(0));
    const a = face.advance(cp);
    if (a === null) {
      if (missing) missing.add(ch);
      continue;
    }
    units += a;
  }
  return (units * size) / face.unitsPerEm;
}

/**
 * Break text into lines, as a browser lays it out with frame.css's rules
 * (see the header). measure(s) is a run's width in CSS px.
 * @param {string} text plain words (\n a forced break; a no-break space binds)
 * @param {number} width the line's box, CSS px
 * @param {(s: string) => number} measure
 * @returns {{lines: string[], tooWide: string[]}} lines without their hanging spaces; tooWide: words wider than a line
 */
export function breakLines(text, width, measure) {
  const room = width - SLACK_PX;
  /** @type {string[]} */
  const lines = [];
  /** @type {string[]} */
  const tooWide = [];
  for (const para of String(text).split('\n')) {
    // Runs that end at a break opportunity: a space (kept, it hangs), or a hyphen or a dash.
    /** @type {string[]} */
    const runs = [];
    let run = '';
    for (const ch of para) {
      run += ch;
      if (BREAK_AFTER.has(ch)) {
        runs.push(run);
        run = '';
      }
    }
    if (run) runs.push(run);
    let line = '';
    for (const r of runs) {
      const next = line + r;
      if (line && measure(next.replace(/ +$/, '')) > room) {
        lines.push(line.replace(/ +$/, ''));
        line = r;
      } else line = next;
      const word = r.replace(/ +$/, '');
      if (measure(word) > room) tooWide.push(word);
    }
    lines.push(line.replace(/ +$/, ''));
  }
  return { lines, tooWide };
}
