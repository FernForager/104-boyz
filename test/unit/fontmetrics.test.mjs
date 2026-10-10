// The fonts' measured widths (BUILD_PLAN S6 track C, the spec's C.3 and
// lead call 6; GAME_DESIGN 11.9): T02 reads the bytes the phone renders.
// The WOFF2 reader against both shipped files; Literata's opsz default and
// frame.css's pin to it; Pixelify's weight; the chrome's 8-font-pixel
// advance; the cmap formats; and the line breaker T02 and A.4's caption
// test share.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { readWoff2, parseCmap, parseFvar, faceOf, woff2Face, chromeFace, loadFaces, widthOf, breakLines, KNOWN_TAGS, FACE_FILES, SLACK_PX } from '../../tools/fontmetrics.mjs';

const CSS = readFileSync(join(ROOT, 'web', 'css', 'frame.css'), 'utf8');

test('WOFF2: both shipped files read; only glyf and loca are transformed, so head, hhea, maxp, hmtx and cmap read as they are; head has its magic number; the em is 1000', () => {
  for (const file of [FACE_FILES.pixelify, FACE_FILES.literata, FACE_FILES.literataItalic]) {
    const { flavor, tables, transformed } = readWoff2(readFileSync(join(ROOT, 'web', 'fonts', file)));
    assert.equal(flavor, '\u0000\u0001\u0000\u0000', `${file}: TrueType outlines`);
    assert.deepEqual(transformed.sort(), ['glyf', 'loca'], `${file}: only the outlines are transformed`);
    for (const tag of ['head', 'hhea', 'maxp', 'hmtx', 'cmap', 'fvar', 'HVAR']) assert.ok(tables.has(tag), `${file}: ${tag}`);
    assert.equal(tables.get('head').readUInt32BE(12), 0x5f0f3cf5);
    const face = woff2Face(file);
    assert.equal(face.unitsPerEm, 1000);
    assert.ok(face.hvar, `${file} is variable, with an HVAR`);
    for (const ch of 'AZaz09.,:;!?\'- ') assert.ok(face.advance(/** @type {number} */ (ch.codePointAt(0))) > 0, `${file}: "${ch}"`);
  }
  assert.throws(() => readWoff2(Buffer.from('wOFFxxxxxxxx')), /not a WOFF2 file/);
  assert.equal(KNOWN_TAGS[10], 'glyf');
  assert.equal(KNOWN_TAGS[47], 'fvar');
});

test("Literata's optical size (lead call 6): opsz 7 to 72, 12 by default; frame.css pins Plain to that default with optical sizing off, so the advances are hmtx's", () => {
  const { literata, literataItalic, pixelify } = loadFaces();
  for (const f of [literata, literataItalic]) assert.deepEqual(f.axes, [{ tag: 'opsz', min: 7, def: 12, max: 72 }]);
  const def = literata.axes[0].def;
  const plain = CSS.slice(CSS.indexOf('html[data-text="plain"] .frame .game-box,'));
  const rule = plain.slice(0, plain.indexOf('}'));
  assert.match(rule, /font-optical-sizing: none;/);
  assert.match(rule, new RegExp(`font-variation-settings: "opsz" ${def};`));
  assert.match(rule, /html\[data-text="plain"\] \.look-box/, 'the Look box in Plain too');
  // Pixelify: wght 400 to 700, 400 by default, and the box sets no other weight.
  assert.deepEqual(pixelify.axes, [{ tag: 'wght', min: 400, def: 400, max: 700 }]);
  const box = CSS.slice(CSS.indexOf('.frame .game-box {'));
  assert.ok(!/font-weight/.test(box.slice(0, box.indexOf('}'))), 'the box is at the default weight');
  assert.match(CSS, /font-kerning: none;/, 'no kerning on the frame (GPOS ignored)');
});

test('OPH Chrome, read through the font build: monospace, every advance 1024 units of a 1536 em, so 8 font pixels at the 12-font-pixel size the page sets', () => {
  const chrome = chromeFace();
  assert.equal(chrome.unitsPerEm, 1536);
  for (const ch of 'Stay high 0.7%·') assert.equal(chrome.advance(/** @type {number} */ (ch.codePointAt(0))), 1024, ch);
  const fp = 4 / 3;
  assert.equal(widthOf(chrome, 12 * fp, 'Stay high'), 9 * 8 * fp);
  assert.equal(chrome.advance(0x1f600), null, 'no glyph');
  const missing = new Set();
  assert.equal(widthOf(chrome, 12, 'a\u{1f600}', missing), 8);
  assert.deepEqual([...missing], ['\u{1f600}']);
  assert.equal(widthOf(chrome, 12, 'a b'), widthOf(chrome, 12, 'a b'), 'a no-break space is a space');
});

test('cmap: format 12 first, then format 4 with its idRangeOffset glyph array; fvar axes', () => {
  // A format 4 subtable under (3,1): two segments, the first by delta, the second through the glyph array, then the 0xFFFF end.
  const seg = 3;
  const sub = Buffer.alloc(14 + 8 * seg + 2 + 2 * 3);
  sub.writeUInt16BE(4, 0);
  sub.writeUInt16BE(sub.length, 2);
  sub.writeUInt16BE(seg * 2, 6);
  const ends = [0x42, 0x63, 0xffff];
  const starts = [0x41, 0x61, 0xffff];
  const deltas = [10, 0, 1];
  ends.forEach((v, i) => sub.writeUInt16BE(v, 14 + 2 * i));
  starts.forEach((v, i) => sub.writeUInt16BE(v, 14 + 2 * seg + 2 + 2 * i));
  deltas.forEach((v, i) => sub.writeUInt16BE(v & 0xffff, 14 + 4 * seg + 2 + 2 * i));
  // Segment 1's idRangeOffset points at the glyph array right after the offsets.
  const rangesAt = 14 + 6 * seg + 2;
  sub.writeUInt16BE(2 * (seg - 1), rangesAt + 2);
  [7, 0, 9].forEach((g, i) => sub.writeUInt16BE(g, rangesAt + 2 * seg + 2 * i));
  const cmap = Buffer.alloc(4 + 8 + sub.length);
  cmap.writeUInt16BE(1, 2);
  cmap.writeUInt16BE(3, 4);
  cmap.writeUInt16BE(1, 6);
  cmap.writeUInt32BE(12, 8);
  sub.copy(cmap, 12);
  const map = parseCmap(cmap);
  assert.deepEqual([map.get(0x41), map.get(0x42), map.get(0x61), map.get(0x62), map.get(0x63)], [0x4b, 0x4c, 7, undefined, 9], 'a 0 in the array is no glyph');
  // fvar: one axis.
  const fvar = Buffer.alloc(16 + 20);
  fvar.writeUInt16BE(16, 4);
  fvar.writeUInt16BE(1, 8);
  fvar.writeUInt16BE(20, 10);
  fvar.write('wght', 16, 'latin1');
  fvar.writeInt32BE(100 * 65536, 20);
  fvar.writeInt32BE(400 * 65536, 24);
  fvar.writeInt32BE(900 * 65536, 28);
  assert.deepEqual(parseFvar(fvar), [{ tag: 'wght', min: 100, def: 400, max: 900 }]);
  assert.deepEqual(parseFvar(undefined), []);
  // A face's advance: hmtx's, the last long metric for glyphs past numberOfHMetrics.
  const head = Buffer.alloc(54);
  head.writeUInt32BE(0x5f0f3cf5, 12);
  head.writeUInt16BE(1000, 18);
  const hhea = Buffer.alloc(36);
  hhea.writeUInt16BE(2, 34);
  const maxp = Buffer.alloc(6);
  maxp.writeUInt16BE(100, 4);
  const hmtx = Buffer.alloc(4 * 2 + 2 * 98);
  hmtx.writeUInt16BE(500, 0);
  hmtx.writeUInt16BE(620, 4);
  const face = faceOf('t', new Map([['head', head], ['hhea', hhea], ['maxp', maxp], ['hmtx', hmtx], ['cmap', cmap]]));
  assert.deepEqual([face.advance(0x41), face.advance(0x61), face.advance(0x7a)], [620, 620, null], 'glyphs 75 and 7 take the last long metric; z has none');
  const few = Buffer.alloc(6);
  few.writeUInt16BE(8, 4);
  assert.equal(faceOf('t', new Map([['head', head], ['hhea', hhea], ['maxp', few], ['hmtx', hmtx], ['cmap', cmap]])).advance(0x41), null, 'a glyph past numGlyphs is none');
  assert.throws(() => faceOf('t', new Map([['head', Buffer.alloc(54)]])), /magic number/);
});

test('the line breaker: greedy; a space hangs; a hyphen or a dash may end a line; never at a no-break space; \\n forced; a word wider than its line is reported; 1 px of slack', () => {
  const w = (s) => Array.from(s).length * 10; // 10 px a character
  assert.deepEqual(breakLines('aaa bbb ccc', 71, w).lines, ['aaa bbb', 'ccc'], '7 characters is 70 px: it fits 71 less the slack');
  assert.deepEqual(breakLines('aaa bbb ccc', 70, w).lines, ['aaa', 'bbb', 'ccc'], '70 px less 1 px of slack holds 6 characters, never 7');
  assert.deepEqual(breakLines('aaa bbb ', 40, w).lines, ['aaa', 'bbb'], 'the space hangs past the end');
  assert.deepEqual(breakLines('well-worn path', 61, w).lines, ['well-', 'worn', 'path']);
  assert.deepEqual(breakLines('8 mi on', 51, w).lines, ['8 mi on'], 'never at a no-break space');
  assert.deepEqual(breakLines('Day 1 · Deer Lake', 101, w).lines, ['Day 1', '· Deer', 'Lake'], 'the dot travels with what follows (A.4)');
  assert.deepEqual(breakLines('a\nb', 500, w).lines, ['a', 'b']);
  const long = breakLines('extraordinarily', 51, w);
  assert.deepEqual([long.lines, long.tooWide], [['extraordinarily'], ['extraordinarily']]);
  assert.equal(SLACK_PX, 1);
});
