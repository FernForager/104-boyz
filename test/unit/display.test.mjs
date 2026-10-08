import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickPixelShape } from '../../web/js/gfx/display.js';

// Doc 11.2's table: the whole-number device-pixel shapes, portrait.
const TABLE = [
  ['iPhone 15/16', 393, 852, 3, 7, 4],
  ['iPhone 16 Pro', 402, 874, 3, 7, 4],
  ['iPhone 15/16 Plus', 430, 932, 3, 8, 5],
  ['iPhone 16 Pro Max', 440, 956, 3, 8, 5],
  ['iPhone 13 mini', 375, 812, 3, 6, 4],
  ['iPhone SE', 375, 667, 2, 4, 2],
];

test('the pixel shapes match doc 11.2 on every iPhone size', () => {
  for (const [name, w, h, dpr, sx, sy] of TABLE) {
    const s = pickPixelShape({ cssWidth: w, screenHeight: h, dpr });
    assert.deepEqual([s.sx, s.sy], [sx, sy], name);
    // The picture fits the width, in whole device pixels.
    assert.ok((160 * s.sx) / dpr <= w, `${name} fits`);
  }
});

test('short screens use the 2:1 pixel; a tall plate shrinks to fit', () => {
  assert.equal(pickPixelShape({ cssWidth: 375, screenHeight: 667, dpr: 2 }).short, true);
  assert.equal(pickPixelShape({ cssWidth: 393, screenHeight: 852, dpr: 3 }).short, false);
  // A 160x320 plate at 7x4 is 427 pt tall; with only 400 pt free it steps
  // down to the next shape that fits (6x4 is just as tall, so 5x3).
  const s = pickPixelShape({ cssWidth: 393, screenHeight: 852, dpr: 3, picHeight: 320, maxCssHeight: 400 });
  assert.ok((320 * s.sy) / 3 <= 400);
  assert.deepEqual([s.sx, s.sy], [5, 3]);
});

test('never smaller than one device pixel', () => {
  assert.deepEqual(pickPixelShape({ cssWidth: 100, screenHeight: 300, dpr: 1 }), { sx: 1, sy: 1, short: true });
});
