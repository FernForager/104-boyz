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

test('never flatter than 2:1: a short screen steps from 4x2 to 2x1, never 3x1, and a narrow one starts at 2x1 (S7 review)', () => {
  // The SE with too little height for 4x2 (the cabin in Safari before the install line moved): 2x1, not 3x1.
  const se = pickPixelShape({ cssWidth: 375, screenHeight: 667, dpr: 2, picHeight: 320, maxCssHeight: 315 });
  assert.deepEqual([se.sx, se.sy], [2, 1]);
  // A first-generation SE (320 wide at 2x) would fit 3 device pixels across: 2x1 instead.
  const narrow = pickPixelShape({ cssWidth: 320, screenHeight: 568, dpr: 2 });
  assert.deepEqual([narrow.sx, narrow.sy], [2, 1]);
  // Every shape any width and height picks keeps sy at least half sx.
  for (let w = 300; w <= 440; w += 7) {
    for (const [h, dpr] of [[568, 2], [667, 2], [812, 3], [874, 3]]) {
      for (const max of [undefined, 100, 200, 315, 400, 500]) {
        const s = pickPixelShape({ cssWidth: w, screenHeight: h, dpr, picHeight: max ? 320 : undefined, maxCssHeight: max });
        assert.ok(2 * s.sy >= s.sx, `${w}x${h}@${dpr} under ${max}: ${s.sx}x${s.sy}`);
      }
    }
  }
});

test("minPixel: the shape steps down for height only while its pixel keeps that size; too short for every such shape, the least tall of them (the cabin's 44-pt hit areas, S7 review)", () => {
  const MIN = [2, 1];
  // The 13 mini in Safari with the install line under the cabin: 5x3 would fit, but its pixel is 1.67 pt wide.
  const mini = pickPixelShape({ cssWidth: 375, screenHeight: 812, dpr: 3, picHeight: 320, maxCssHeight: 397, minPixel: MIN });
  assert.deepEqual([mini.sx, mini.sy], [6, 4]);
  assert.deepEqual(pickPixelShape({ cssWidth: 375, screenHeight: 812, dpr: 3, picHeight: 320, maxCssHeight: 397 }), { sx: 5, sy: 3, short: false }, 'without it, 5x3');
  // The 17 with too little room for 7x4: 6x4 is as tall, so 7x4 stays (the widest of the least tall).
  const p17 = pickPixelShape({ cssWidth: 402, screenHeight: 874, dpr: 3, picHeight: 320, maxCssHeight: 409, minPixel: MIN });
  assert.deepEqual([p17.sx, p17.sy], [7, 4]);
  // The SE: 4x2 is its smallest 2 x 1 pt pixel, kept even when short of room.
  const se = pickPixelShape({ cssWidth: 375, screenHeight: 667, dpr: 2, picHeight: 320, maxCssHeight: 300, minPixel: MIN });
  assert.deepEqual([se.sx, se.sy], [4, 2]);
  // With room, the largest shape that fits, as always.
  const roomy = pickPixelShape({ cssWidth: 440, screenHeight: 956, dpr: 3, picHeight: 320, maxCssHeight: 560, minPixel: MIN });
  assert.deepEqual([roomy.sx, roomy.sy], [8, 5]);
  // A screen too narrow for the smallest pixel steps down for height as before, to 1x1 at the least.
  const tiny = pickPixelShape({ cssWidth: 200, screenHeight: 667, dpr: 2, picHeight: 320, maxCssHeight: 100, minPixel: MIN });
  assert.deepEqual([tiny.sx, tiny.sy], [1, 1]);
});
