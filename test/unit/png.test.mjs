import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { encodePNG, slotsToPNG, crc32 } from '../../tools/png.mjs';

/** Split a PNG into chunks, checking every CRC. */
function chunks(buf) {
  assert.deepEqual([...buf.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'PNG signature');
  const out = [];
  let p = 8;
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('ascii', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    const crc = buf.readUInt32BE(p + 8 + len);
    assert.equal(crc, crc32(buf.subarray(p + 4, p + 8 + len)), `${type} CRC`);
    out.push({ type, data });
    p += 12 + len;
  }
  assert.equal(p, buf.length, 'no trailing bytes');
  return out;
}

test('crc32 matches the standard check value', () => {
  assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926);
});

test('an RGBA image is a valid PNG: signature, IHDR, IDAT, IEND', () => {
  const data = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const png = encodePNG({ width: 3, height: 2, type: 'rgba', data });
  const cs = chunks(png);
  assert.equal(cs[0].type, 'IHDR');
  assert.equal(cs[0].data.length, 13);
  assert.equal(cs[0].data.readUInt32BE(0), 3);
  assert.equal(cs[0].data.readUInt32BE(4), 2);
  assert.equal(cs[0].data[8], 8, 'bit depth');
  assert.equal(cs[0].data[9], 6, 'RGBA');
  assert.equal(cs.at(-1).type, 'IEND');
  assert.equal(cs.at(-1).data.length, 0);
  const raw = inflateSync(Buffer.concat(cs.filter((c) => c.type === 'IDAT').map((c) => c.data)));
  assert.equal(raw.length, 2 * (1 + 3 * 4));
  assert.equal(raw[0], 0, 'filter byte');
  assert.deepEqual([...raw.subarray(1, 13)], [...data.subarray(0, 12)]);
  assert.deepEqual([...raw.subarray(14, 26)], [...data.subarray(12, 24)]);
});

test('an indexed image carries its palette', () => {
  const png = encodePNG({ width: 2, height: 2, type: 'indexed', data: new Uint8Array([0, 1, 1, 0]), palette: [[27, 31, 42], [242, 239, 230]] });
  const cs = chunks(png);
  assert.deepEqual(cs.map((c) => c.type), ['IHDR', 'PLTE', 'IDAT', 'IEND']);
  assert.equal(cs[0].data[9], 3, 'indexed');
  assert.deepEqual([...cs[1].data], [27, 31, 42, 242, 239, 230]);
});

test('slotsToPNG scales by whole pixels', () => {
  const pal = [[0, 0, 0], [255, 255, 255]];
  const png = slotsToPNG(new Uint8Array([0, 1, 1, 0]), 2, 2, pal, 7, 4);
  const cs = chunks(png);
  assert.equal(cs[0].data.readUInt32BE(0), 14);
  assert.equal(cs[0].data.readUInt32BE(4), 8);
  const raw = inflateSync(cs[2].data);
  // Row 0 (a filter byte, then 7 of slot 0 and 7 of slot 1); row 4 is the
  // second picture row.
  assert.deepEqual([...raw.subarray(1, 15)], [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1]);
  assert.deepEqual([...raw.subarray(4 * 15 + 1, 5 * 15)], [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0]);
});

test('a wrong data length is refused', () => {
  assert.throws(() => encodePNG({ width: 2, height: 2, type: 'rgb', data: new Uint8Array(5) }), /expected 12 bytes/);
});
