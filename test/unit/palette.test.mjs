import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PALETTE, REMAPS, CYCLES, makePalette, resolve, hasCycles } from '../../web/js/gfx/palette.js';
import { ROOT } from '../../tools/pics.mjs';

// Option B of design/art/style_mockup.py, copied by hand as a fixed point.
const OPTION_B = [
  '#1b1f2a', '#24324a', '#3f5a7a', '#8fb3c9', '#f2efe6', '#e8d9b5', '#e09a8a', '#e8b33a',
  '#c4602d', '#8a3b2a', '#5a3d2b', '#1f3b33', '#2f5b45', '#6b8a4a', '#a7b88a', '#3f7f7a',
];

test('the palette is the option-B sixteen, in slot order', () => {
  assert.deepEqual([...PALETTE], OPTION_B);
  // ...and the mockup script itself still says so.
  const py = readFileSync(join(ROOT, 'design', 'art', 'style_mockup.py'), 'utf8');
  const m = /^BOOK = \[([^\]]+)\]/m.exec(py);
  assert.ok(m, 'style_mockup.py has its BOOK list');
  const book = m[1].split(',').map((s) => s.trim().replace(/'/g, '').toLowerCase());
  assert.deepEqual(book, OPTION_B);
});

test('palette.json, palette.js and tokens.css agree', () => {
  const json = JSON.parse(readFileSync(join(ROOT, 'content', 'art', 'palette.json'), 'utf8'));
  assert.deepEqual(json.colors.map((c) => c.hex), OPTION_B);
  assert.deepEqual(json.colors.map((c) => c.slot), [...Array(16).keys()]);
  assert.deepEqual(json.remaps, JSON.parse(JSON.stringify(REMAPS)));
  assert.deepEqual(json.cycles, JSON.parse(JSON.stringify(CYCLES)));
  const css = readFileSync(join(ROOT, 'web', 'css', 'tokens.css'), 'utf8');
  for (let i = 0; i < 16; i++) {
    const m = new RegExp(`--c${i}:\\s*(#[0-9a-f]{6})`).exec(css);
    assert.ok(m, `tokens.css has --c${i}`);
    assert.equal(m[1], OPTION_B[i], `--c${i}`);
  }
});

test('day is the identity; dusk follows the doc 11.4 key slots', () => {
  assert.deepEqual([...REMAPS.day], [...Array(16).keys()]);
  const dusk = REMAPS.dusk;
  assert.equal(dusk.length, 16);
  assert.equal(dusk[2], 1, 'slate -> night navy');
  assert.equal(dusk[3], 2, 'glacier blue -> slate');
  assert.equal(dusk[4], 6, 'snow -> alpenglow pink');
  assert.equal(dusk[12], 11, 'forest -> spruce');
  for (const [name, map] of Object.entries(REMAPS)) {
    map.forEach((to, from) => {
      assert.ok(Number.isInteger(to) && to >= 0 && to <= 15, `${name}[${from}]`);
      if (from !== 7) assert.notEqual(to, 7, `${name} never makes gold from slot ${from}`);
    });
  }
});

test('S5: the four hours (day, dusk, blue, night), in palette.js and palette.json alike, with the doc 11.4 key slots', () => {
  assert.deepEqual(Object.keys(REMAPS), ['day', 'dusk', 'blue', 'night']);
  const json = JSON.parse(readFileSync(join(ROOT, 'content', 'art', 'palette.json'), 'utf8'));
  assert.deepEqual(Object.keys(json.remaps), ['day', 'dusk', 'blue', 'night']);
  // Doc 11.4's table: by the day slot, the dusk, blue-hour and night slots.
  const KEYS = {
    2: [1, 1, 0], // slate: the upper sky
    3: [2, 2, 1], // glacier blue: sky, lakes
    4: [6, 3, 2], // snow: snow, the horizon
    12: [11, 11, 11], // forest: spruce at night too, so a fir keeps its lit side against the night sky
  };
  for (const [from, [dusk, blue, night]] of Object.entries(KEYS)) {
    assert.equal(REMAPS.dusk[Number(from)], dusk, `dusk ${from}`);
    assert.equal(REMAPS.blue[Number(from)], blue, `blue ${from}`);
    assert.equal(REMAPS.night[Number(from)], night, `night ${from}`);
  }
  for (const name of ['blue', 'night']) {
    assert.equal(REMAPS[name].length, 16);
    assert.equal(REMAPS[name][7], 7, `${name}: gold stays gold`);
    REMAPS[name].forEach((to, from) => from !== 7 && assert.notEqual(to, 7, `${name} makes no gold from ${from}`));
  }
  // Night sinks into the blues: nothing but gold resolves brighter than slate,
  // so the stars (a light: paper cream, snow, glacier blue) are the brightest.
  const bright = (slot) => PALETTE[slot].slice(1).match(/../g).reduce((a, h) => a + parseInt(h, 16), 0);
  for (let s = 0; s < 16; s++) if (s !== 7) assert.ok(bright(REMAPS.night[s]) <= bright(2), `night ${s} -> ${REMAPS.night[s]}`);
  for (const star of CYCLES[22].slots) assert.ok(bright(star) > bright(2));
  // A lake glint at night is still visible: its cycle passes through more than one slot.
  assert.ok(new Set(CYCLES[16].slots.map((s) => REMAPS.night[s])).size > 1);
});

test('stars are a light: they twinkle through their cycle and skip the remap', () => {
  const pal = makePalette();
  const stars = CYCLES[22];
  assert.deepEqual(stars.slots, [5, 4, 5, 3]);
  assert.equal(stars.light, true);
  const one = new Uint8Array([22]);
  const seen = new Set();
  for (let frame = 0; frame < 4 * stars.hold; frame++) {
    const dusk = resolve(one, 1, pal, { remap: 'dusk', frame })[0];
    const day = resolve(one, 1, pal, { remap: 'day', frame })[0];
    assert.equal(dusk, day, 'a light is not remapped');
    seen.add(day);
  }
  assert.deepEqual([...seen].sort(), [3, 4, 5]);
  // A cycle that is not a light (the lake) is remapped with the scene.
  const lake = new Uint8Array([16]);
  for (let frame = 0; frame < 8; frame++) {
    const slot = CYCLES[16].slots[Math.floor(frame / CYCLES[16].hold) % 4];
    assert.equal(resolve(lake, 1, pal, { remap: 'dusk', frame })[0], REMAPS.dusk[slot]);
  }
});

test('resolving never leaves the sixteen', () => {
  const pal = makePalette();
  const src = new Uint8Array(26 * 3);
  for (let i = 0; i < src.length; i++) src[i] = i % 26;
  src[src.length - 1] = 255;
  for (const remap of ['day', 'dusk', 'blue', 'night']) {
    for (let frame = 0; frame < 12; frame++) {
      for (const v of resolve(src, 26, pal, { remap, frame })) assert.ok(v >= 0 && v <= 15);
    }
  }
  assert.equal(hasCycles(new Uint8Array([1, 2, 255])), false);
  assert.equal(hasCycles(new Uint8Array([1, 22])), true);
});

test('makePalette reads palette.json the same as the built-in tables', () => {
  const json = JSON.parse(readFileSync(join(ROOT, 'content', 'art', 'palette.json'), 'utf8'));
  const a = makePalette(json);
  const b = makePalette();
  assert.deepEqual(a.rgb, b.rgb);
  const src = new Uint8Array([0, 4, 12, 22, 16, 255]);
  for (const remap of ['day', 'dusk', 'blue', 'night']) assert.deepEqual(resolve(src, 6, a, { remap, frame: 5 }), resolve(src, 6, b, { remap, frame: 5 }));
});
