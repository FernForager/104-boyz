// A small PNG encoder on node:zlib (BUILD_PLAN 2.7). Truecolor (RGB),
// truecolor with alpha (RGBA), or indexed with a palette; 8 bits a sample;
// filter 0 on every row (pixel art compresses well without filters).

import { deflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

/** CRC-32 as PNG uses it. */
export function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/**
 * Encode a PNG.
 * @param {object} img
 * @param {number} img.width
 * @param {number} img.height
 * @param {'rgb'|'rgba'|'indexed'} img.type
 * @param {Uint8Array|Uint8ClampedArray} img.data RGB or RGBA bytes, or one palette index a pixel
 * @param {number[][]} [img.palette] [r,g,b] entries, for 'indexed'
 * @returns {Buffer}
 */
export function encodePNG({ width, height, type, data, palette }) {
  const bpp = type === 'rgba' ? 4 : type === 'rgb' ? 3 : 1;
  const colorType = type === 'rgba' ? 6 : type === 'rgb' ? 2 : 3;
  if (data.length !== width * height * bpp) throw new Error(`png: expected ${width * height * bpp} bytes, got ${data.length}`);
  const stride = width * bpp;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    raw.set(data.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = colorType;
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // no interlace
  const parts = [SIGNATURE, chunk('IHDR', ihdr)];
  if (type === 'indexed') {
    if (!palette || palette.length === 0 || palette.length > 256) throw new Error('png: indexed needs 1-256 palette entries');
    parts.push(chunk('PLTE', Buffer.from(palette.flat())));
  }
  parts.push(chunk('IDAT', deflateSync(raw, { level: 9 })));
  parts.push(chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(parts);
}

/**
 * Scale palette slots up by whole pixels (sx across, sy down) and encode
 * them as an indexed PNG in the given palette.
 * @param {Uint8Array} slots one slot (0-15) a pixel
 * @param {number} width
 * @param {number} height
 * @param {number[][]} rgb the palette as [r,g,b]
 * @param {number} sx
 * @param {number} sy
 */
export function slotsToPNG(slots, width, height, rgb, sx = 1, sy = sx) {
  const W = width * sx;
  const H = height * sy;
  const out = new Uint8Array(W * H);
  for (let y = 0; y < height; y++) {
    const row = new Uint8Array(W);
    for (let x = 0; x < width; x++) row.fill(slots[y * width + x], x * sx, (x + 1) * sx);
    for (let k = 0; k < sy; k++) out.set(row, (y * sy + k) * W);
  }
  return encodePNG({ width: W, height: H, type: 'indexed', data: out, palette: rgb });
}
