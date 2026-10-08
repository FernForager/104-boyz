import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePic, compilePic, renderPic, composite, hashBytes, TRANSPARENT, LAYERS } from '../../web/js/gfx/picvm.js';
import { buildTimeline, frameAt } from '../../web/js/gfx/drawin.js';
import { loadArt } from '../../tools/pics.mjs';

const T = TRANSPARENT;
const run = (text, w, h, stamps = {}, record = false) => renderPic(compilePic(text), { width: w, height: h, stamps, record });
const layer = (r, name) => Array.from(r.layers[LAYERS.indexOf(name)]);

test('the cover renders the same twice (and from its shipped JSON)', () => {
  const { pics, stamps } = loadArt();
  const pic = pics.cover_high_divide_dusk;
  assert.ok(pic, 'the cover exists');
  const a = renderPic(pic.ops, { width: pic.width, height: pic.height, stamps });
  const b = renderPic(pic.ops, { width: pic.width, height: pic.height, stamps });
  assert.equal(hashBytes(composite(a)), hashBytes(composite(b)));
  a.layers.forEach((L, k) => assert.equal(hashBytes(L), hashBytes(b.layers[k]), `layer ${LAYERS[k]}`));
  const shipped = JSON.parse(JSON.stringify({ ops: pic.ops, stamps }));
  const c = renderPic(shipped.ops, { width: pic.width, height: pic.height, stamps: shipped.stamps });
  assert.equal(hashBytes(composite(c)), hashBytes(composite(a)));
  assert.equal(pic.width, 160);
  assert.equal(pic.height, 320);
});

test('the cover leaves no pixel undrawn', () => {
  const { pics, stamps } = loadArt();
  const pic = pics.cover_high_divide_dusk;
  const buf = composite(renderPic(pic.ops, { width: pic.width, height: pic.height, stamps }));
  assert.equal(buf.indexOf(T), -1);
});

test('a known tiny picture gives a known buffer', () => {
  const r = run(
    `# a box with a dot
     @ far
     C 3  L 0,0 5,0 5,4 0,4 0,0
     C 6  F 2,2
     @ near
     C 9  L 1,1`,
    6,
    5,
  );
  // prettier-ignore
  assert.deepEqual(Array.from(composite(r)), [
    3, 3, 3, 3, 3, 3,
    3, 9, 6, 6, 6, 3,
    3, 6, 6, 6, 6, 3,
    3, 6, 6, 6, 6, 3,
    3, 3, 3, 3, 3, 3,
  ]);
  assert.equal(layer(r, 'sky').every((v) => v === T), true);
});

test('lines are Bresenham, the same whichever way they are written', () => {
  const expect = [0, 0, 1, 1, 2, 1, 3, 2, 4, 2];
  for (const text of ['C 1  L 0,0 4,2', 'C 1  L 4,2 0,0']) {
    const L = layer(run(`@ sky\n${text}`, 5, 3), 'sky');
    const got = [];
    L.forEach((v, p) => v === 1 && got.push(p % 5, Math.floor(p / 5)));
    assert.deepEqual(got, expect, text);
  }
});

test('R steps are relative to the point before', () => {
  const { ops } = parsePic('R 2,3 1,0 0,2 -3,-1');
  assert.deepEqual(ops, [['L', [2, 3, 3, 3, 3, 5, 0, 4]]]);
});

test('dither fills follow their patterns exactly', () => {
  const rules = {
    checker: (x, y) => (x + y) % 2 === 0,
    checker25: (x, y) => x % 2 === 0 && y % 2 === 0,
    checker12: (x, y) => x % 4 === 0 && y % 2 === 0,
    hlines: (x, y) => y % 2 === 0,
    vlines: (x, y) => x % 2 === 0,
    diag: (x, y) => (x + y) % 4 === 0,
    brick: (x, y) => y % 4 === 0 || x % 4 === (Math.floor(y / 4) % 2) * 2,
  };
  for (const [name, rule] of Object.entries(rules)) {
    const L = layer(run(`@ mid  D 1 2 ${name}  F 3,3`, 9, 9), 'mid');
    for (let y = 0; y < 9; y++) {
      for (let x = 0; x < 9; x++) assert.equal(L[y * 9 + x], rule(x, y) ? 2 : 1, `${name} at ${x},${y}`);
    }
  }
});

test('D a alone is a solid fill, and C resets the paint to solid', () => {
  assert.equal(layer(run('@ far  D 4  F 0,0', 3, 3), 'far').every((v) => v === 4), true);
  assert.equal(layer(run('@ far  D 1 2 checker  C 5  F 0,0', 3, 3), 'far').every((v) => v === 5), true);
});

test('a flood fill stays in its own layer', () => {
  const r = run(
    `@ far
     C 3  L 2,2 7,2 7,7 2,7 2,2
     C 4  F 4,4
     @ near
     C 6  F 4,4`,
    10,
    10,
  );
  const far = layer(r, 'far');
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const v = far[y * 10 + x];
      const edge = (x === 2 || x === 7 || y === 2 || y === 7) && x >= 2 && x <= 7 && y >= 2 && y <= 7;
      const inside = x > 2 && x < 7 && y > 2 && y < 7;
      assert.equal(v, edge ? 3 : inside ? 4 : T, `far ${x},${y}`);
    }
  }
  // The near layer was empty, so its fill covered all of it; the far box
  // did not bound it, and the far layer was not touched.
  assert.equal(layer(r, 'near').every((v) => v === 6), true);
  assert.equal(layer(r, 'mid').every((v) => v === T), true);
});

test('a fill is 4-connected: it cannot slip through a diagonal line', () => {
  const r = run('@ far  C 1  L 0,4 4,0  C 2  F 0,0', 5, 5);
  const far = layer(r, 'far');
  assert.equal(far[4 * 5 + 4], T, 'the far corner stays empty');
  assert.equal(far[0], 2);
});

test('stamps: anchored, flipped as exact mirrors, and kept to their own fills', () => {
  const stamps = {
    flag: compilePic('C 9  L 0,0 0,-4  C 8  L 1,-4 3,-4 1,-2 1,-4  F 2,-3'),
  };
  const a = layer(run('@ near  T flag 5,6', 11, 8, stamps), 'near');
  const b = layer(run('@ near  T flag 5,6 fx', 11, 8, stamps), 'near');
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 11; x++) assert.equal(b[y * 11 + x], a[y * 11 + (10 - x)], `mirror at ${x},${y}`);
  }
  assert.equal(a[6 * 11 + 5], 9, 'the anchor is the foot of the pole');
  // A stamp's fill never spills into what is already on the layer.
  const c = layer(run('@ near  C 13  F 0,0  T flag 5,6', 11, 8, stamps), 'near');
  assert.equal(c.filter((v) => v === 13).length, 11 * 8 - a.filter((v) => v !== T).length);
});

test('unknown stamps and deep nesting are reported, not drawn', () => {
  const deep = {};
  for (let i = 0; i < 6; i++) deep[`s${i}`] = compilePic(i === 5 ? 'C 1  L 0,0' : `T s${i + 1} 0,0`);
  const r = run('@ near  T s0 2,2  T nope 1,1', 5, 5, deep);
  assert.deepEqual(r.diag.unknownStamps.map((u) => u.id), ['nope']);
  assert.equal(r.diag.tooDeep.length, 1);
  assert.equal(layer(r, 'near').every((v) => v === T), true);
});

test('hotspots are recorded and draw nothing', () => {
  const r = run('@ near  Z meadow 0,2,6,3', 6, 6);
  assert.deepEqual(r.hotspots, [{ id: 'meadow', x: 0, y: 2, w: 6, h: 3 }]);
  assert.equal(composite(r).every((v) => v === T), true);
});

test('bad commands, colors and patterns are parse errors with line numbers', () => {
  const { errors } = parsePic('C 3\nX 1,2\nC 26\nD 1 2 plaid\n@ attic\nB blob 2\nL 1,2,3');
  assert.deepEqual(
    errors.map((e) => e.line),
    [2, 3, 4, 5, 6, 7],
  );
  assert.throws(() => compilePic('Q 1'), /unknown command/);
});

test('the draw-in log replays to the finished picture', () => {
  const { pics, stamps } = loadArt();
  const pic = pics.cover_high_divide_dusk;
  const r = renderPic(pic.ops, { width: pic.width, height: pic.height, stamps, record: true });
  const N = pic.width * pic.height;
  const replay = r.layers.map(() => new Uint8Array(N).fill(T));
  const rec = r.record;
  for (let k = 0; k < rec.kind.length; k++) {
    for (let i = rec.start[k]; i < rec.end[k]; i++) replay[rec.layer[k]][rec.writes[i]] = rec.colors[i];
  }
  replay.forEach((L, k) => assert.equal(hashBytes(L), hashBytes(r.layers[k]), `layer ${LAYERS[k]}`));
  // Outlines come first: at a third of the way, some lines are down and no
  // fill has started; at the end the frame is the finished picture.
  const tl = buildTimeline(r);
  const early = frameAt(tl, 0.3);
  assert.ok(early.some((v) => v !== T), 'outlines show early');
  assert.ok(early.filter((v) => v !== T).length < N / 10, 'fills have not flooded in yet');
  assert.equal(hashBytes(frameAt(tl, 1)), hashBytes(composite(r)));
});
