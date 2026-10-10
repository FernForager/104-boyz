// The chrome font (BUILD_PLAN S5 3.6; GAME_DESIGN 11.9): our own EGA-style
// 8x14 bitmap font, drawn in content/art/fonts/chrome8x14.txt and built by
// tools/fontbuild.mjs into a TrueType file with no dependencies. The source
// parses with every glyph the chrome needs; the file is the same bytes every
// time, its tables and checksums verify, its outlines read back to the
// drawn bitmaps, every advance is 8 font pixels, its names carry the OFL;
// and every character the chrome sets is in it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseBitmapFont,
  toTTF,
  fromTTF,
  rectangles,
  checksum,
  coverage,
  chromeStrings,
  loadChromeFont,
  specimen,
  REQUIRED,
  UNIT,
  UNITS_PER_EM,
  ADVANCE,
  ASCENT,
  FONT_SOURCE,
  FONT_DATE,
  COPYRIGHT,
  LICENSE_URL,
} from '../../tools/fontbuild.mjs';
import { ROOT } from '../../tools/pics.mjs';
import { readText } from '../../tools/text.mjs';

const SOURCE = readFileSync(join(ROOT, FONT_SOURCE), 'utf8');
const FONT = loadChromeFont();
const TTF = toTTF(FONT);

test('the source parses: 8x14, ascent 11, every required glyph; glyphs stay in columns 0-6 but the dashes and the ellipsis', () => {
  assert.equal(FONT.name, 'OPH Chrome');
  assert.deepEqual(FONT.cell, [8, 14]);
  assert.equal(FONT.ascent, 11);
  for (const cp of REQUIRED) assert.ok(FONT.glyphs.has(cp), `U+${cp.toString(16)}`);
  assert.equal(FONT.glyphs.size, REQUIRED.length, 'the set and nothing else');
  assert.equal(REQUIRED.length, 95 + 13);
  const wide = new Set([0x2014, 0x2026]);
  for (const [cp, rows] of FONT.glyphs) {
    assert.equal(rows.length, 14);
    if (!wide.has(cp)) for (const r of rows) assert.equal(r & 1, 0, `U+${cp.toString(16)} leaves column 7 blank`);
  }
  assert.ok(FONT.glyphs.get(0x20).every((r) => r === 0), 'the space is empty');
  // Capitals sit on rows 2-10, small letters' bodies on rows 4-10, descenders below.
  const rowsOf = (ch) => [...FONT.glyphs.get(ch.codePointAt(0))].map((r, i) => (r ? i : -1)).filter((i) => i >= 0);
  assert.deepEqual([rowsOf('H')[0], rowsOf('H').at(-1)], [2, 10]);
  assert.deepEqual([rowsOf('x')[0], rowsOf('x').at(-1)], [4, 10]);
  assert.deepEqual([rowsOf('g')[0], rowsOf('g').at(-1)], [4, 13]);
});

test('the shapes that must not be confused are different: 0 and O, 1 l and I, 5 and S, rn and m', () => {
  const g = (ch) => [...FONT.glyphs.get(ch.codePointAt(0))].join();
  for (const [a, b] of [
    ['0', 'O'],
    ['1', 'l'],
    ['1', 'I'],
    ['l', 'I'],
    ['5', 'S'],
    ['m', 'n'],
  ])
    assert.notEqual(g(a), g(b), `${a} and ${b}`);
  // The zero has a dot in the middle; the O doesn't.
  const mid = (ch) => FONT.glyphs.get(ch.codePointAt(0))[6];
  assert.notEqual(mid('0'), mid('O'));
});

test('parse errors carry their line: a row not 8 wide, a short glyph, a repeated code point, a missing glyph', () => {
  const one = (rows) => `@font T\n@cell 8 14\n@ascent 11\n@glyph 0041 A\n${rows.join('\n')}\n`;
  const ok = Array(14).fill('........');
  assert.equal(parseBitmapFont(one(ok), { required: [0x41] }).glyphs.size, 1);
  assert.throws(() => parseBitmapFont(one([...ok.slice(0, 13), '.......']), { required: [0x41] }), /line 18: a row is 8 of \. and #/);
  assert.throws(() => parseBitmapFont(one(ok.slice(0, 13)), { required: [0x41] }), /line 4: glyph U\+0041 has 13 rows, not 14/);
  assert.throws(() => parseBitmapFont(`${one(ok)}@glyph 0041 A\n${ok.join('\n')}\n`, { required: [0x41] }), /line 19: U\+0041 again/);
  assert.throws(() => parseBitmapFont(one(ok), { required: [0x41, 0x42] }), /U\+0042 B is missing/);
  // A row of #s inside a glyph is a row, not a comment.
  const solid = parseBitmapFont(one(['########', ...ok.slice(1)]), { required: [0x41] });
  assert.equal(solid.glyphs.get(0x41)[0], 0xff);
  assert.ok(SOURCE.startsWith('# OPH Chrome 8x14'), 'the file says what it is');
  assert.match(SOURCE, /SIL OFL 1\.1 \(web\/fonts\/OPHChrome-OFL\.txt\)/);
});

test('rectangles: row runs, stacked while the next row has the same run, covering each pixel once', () => {
  const rows = Uint8Array.from([0, 0b11000110, 0b11000110, 0b11111110, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(rectangles(rows), [
    [0, 2, 1, 3],
    [5, 7, 1, 3],
    [0, 7, 3, 4],
  ]);
  for (const [cp, bits] of FONT.glyphs) {
    const back = new Uint8Array(14);
    for (const [x0, x1, r0, r1] of rectangles(bits)) {
      for (let r = r0; r < r1; r++)
        for (let x = x0; x < x1; x++) {
          assert.equal(back[r] & (0x80 >> x), 0, `U+${cp.toString(16)}: no pixel twice`);
          back[r] |= 0x80 >> x;
        }
    }
    assert.deepEqual(back, bits, `U+${cp.toString(16)}`);
  }
});

test('toTTF is the same bytes twice (no clock in it)', () => {
  assert.deepEqual(toTTF(loadChromeFont()), TTF);
  assert.ok(TTF.length > 4000 && TTF.length < 40000, `${TTF.length} bytes`);
  assert.equal(fromTTF(TTF).created, FONT_DATE);
});

test('the table directory: sorted tags, 4-byte aligned, every checksum right, and checkSumAdjustment makes the file sum to 0xB1B0AFBA', () => {
  assert.equal(TTF.readUInt32BE(0), 0x00010000, 'TrueType outlines');
  const n = TTF.readUInt16BE(4);
  const tags = [];
  for (let i = 0; i < n; i++) {
    const r = 12 + 16 * i;
    const tag = TTF.toString('latin1', r, r + 4);
    tags.push(tag);
    const sum = TTF.readUInt32BE(r + 4);
    const off = TTF.readUInt32BE(r + 8);
    const len = TTF.readUInt32BE(r + 12);
    assert.equal(off % 4, 0, `${tag} is aligned`);
    const data = Buffer.from(TTF.subarray(off, off + len));
    if (tag === 'head') data.writeUInt32BE(0, 8);
    assert.equal(sum, checksum(data), `${tag}'s checksum`);
  }
  assert.deepEqual(tags, ['OS/2', 'cmap', 'gasp', 'glyf', 'head', 'hhea', 'hmtx', 'loca', 'maxp', 'name', 'post']);
  assert.deepEqual(tags, [...tags].sort(), 'sorted by tag');
  let pow = 1;
  while (pow * 2 <= n) pow *= 2;
  assert.equal(TTF.readUInt16BE(6), pow * 16, 'searchRange');
  assert.equal(checksum(TTF), 0xb1b0afba, 'the whole file, with the adjustment');
  assert.equal(TTF.readUInt32BE(TTF.readUInt32BE(12 + 16 * tags.indexOf('head') + 8) + 12), 0x5f0f3cf5, "head's magic number");
});

test('the outlines read back to the drawn bitmaps, every code point through both cmaps, every advance 8 pixels', () => {
  const back = fromTTF(TTF);
  assert.equal(back.unitsPerEm, UNITS_PER_EM);
  assert.equal(UNITS_PER_EM, 12 * UNIT);
  assert.deepEqual([back.ascender, back.descender], [ASCENT * UNIT, (ASCENT - 14) * UNIT]);
  assert.equal(back.numGlyphs, FONT.glyphs.size + 1, 'and .notdef');
  assert.deepEqual(back.formats, [
    [0, 3, 4],
    [0, 4, 12],
    [3, 1, 4],
    [3, 10, 12],
  ]);
  for (const [cp, rows] of FONT.glyphs) {
    assert.deepEqual(back.glyphs.get(cp), rows, `U+${cp.toString(16)} round-trips`);
    assert.equal(back.advances.get(cp), ADVANCE);
    assert.equal(back.cmap4.get(cp), back.cmap12.get(cp), `U+${cp.toString(16)}: format 4 and 12 agree`);
  }
  assert.equal(back.glyphs.size, FONT.glyphs.size, 'nothing else is mapped');
  assert.equal(back.os2Version, 4);
  assert.equal(back.fsType, 0, 'installable: no embedding restrictions');
});

test('the name table carries the OFL notice, the copyright and no Reserved Font Name', () => {
  const { names } = fromTTF(TTF);
  assert.equal(names[0], COPYRIGHT);
  assert.equal(names[1], 'OPH Chrome');
  assert.equal(names[2], 'Regular');
  assert.equal(names[4], 'OPH Chrome');
  assert.equal(names[6], 'OPHChrome-Regular');
  assert.match(names[5], /^Version \d+\.\d{3}$/);
  assert.match(names[13], /SIL Open Font License, Version 1\.1/);
  assert.equal(names[14], LICENSE_URL);
  const ofl = readFileSync(join(ROOT, 'web', 'fonts', 'OPHChrome-OFL.txt'), 'utf8');
  assert.equal(ofl.split('\n')[0], COPYRIGHT, 'the license file beside it names the same holder');
  assert.match(ofl, /SIL OPEN FONT LICENSE Version 1\.1/);
  assert.ok(!/with Reserved Font Name/.test(ofl.split('\n')[0]));
  for (const f of ['Literata-OFL.txt', 'OFL.txt']) assert.match(readFileSync(join(ROOT, 'web', 'fonts', f), 'utf8'), /SIL OPEN FONT LICENSE Version 1\.1/, `${f}: every font beside its license`);
  assert.match(readFileSync(join(ROOT, 'web', 'fonts', 'Literata-OFL.txt'), 'utf8').split('\n')[0], /^Copyright 2017 The Literata Project Authors/);
});

test('coverage: every character the chrome sets is in the font, and a planted é is caught', () => {
  const text = readText(ROOT);
  const scope = JSON.parse(readFileSync(join(ROOT, 'content', 'scope', 'm1a.json'), 'utf8'));
  const stops = JSON.parse(readFileSync(join(ROOT, 'content', 'stops', 'deer_lake_rim.json'), 'utf8'));
  // Every choice label in the content (none in S5 beyond Walk on) and every place a caption can show.
  const labels = stops.stops.flatMap((s) => (s.choices || []).map((c) => c.label.slice(1)));
  const strings = chromeStrings(text, { labels, places: scope.park.nodes });
  assert.ok(strings.some((s) => s.includes('Sound:on')) && strings.some((s) => s.includes('Seven Lakes Basin')) && strings.some((s) => s.includes('Walk on')));
  assert.ok(strings.some((s) => s.includes('Day') && s.includes('·')), 'the caption, its vars dropped');
  assert.deepEqual(coverage(FONT, strings), []);
  assert.deepEqual(coverage(FONT, [...strings, 'Café']), ['é']);
});

test('the specimen is a PNG of every glyph and the lines', () => {
  const png = specimen(FONT, ['Day 1 · Deer Lake · 3,530 ft'], 2);
  assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.ok(png.readUInt32BE(16) > 0 && png.readUInt32BE(20) > 0);
});
