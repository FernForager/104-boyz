// The compass roll (BUILD_PLAN S6 B.3.4, the spec's lead call 4; GAME_DESIGN
// 8.8, 11.9, 13.2): the rose is round on the phone at every pixel shape,
// its dial three bands (two on a night roll) with ink rules between them
// and the fatal sliver at the far end of the brick, never gold; the needle
// rests inside the band it landed in, from the art stream, never the roll;
// it always shows through the day table; the spin's ticks slow with it, a
// tap skips to rest, and under Reduce Motion it is at rest at once.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compassPic, compassBase, withNeedle, restOf, arcsOf, SLOT, COMPASS_W, COMPASS_H, FACE_R, RING_OUT, MIN_SLIVER } from '../../web/js/gfx/compass.js';
import { playCompass, restDraw, easeOut, SPIN_MS, REST_MS, TICK_TURN } from '../../web/js/ui/compass.js';
import { makePalette } from '../../web/js/gfx/palette.js';
import { setBundle } from '../../web/js/text.js';
import { draw } from '../../web/js/engine/rng.js';
import { fakeDocument } from './textfix.mjs';
import { WORDS, outcomeOf } from './forkfix.mjs';

/** The shapes a picture pixel takes on the phones (AGI's wide pixel): sx by sy device pixels. */
const SHAPES = [
  [7, 4],
  [8, 5],
  [6, 4],
  [5, 3],
  [4, 2],
];
const HIGH = { bands: { clean: 40, shaky: 25, fail: 35 }, fatal: { num: 7, den: 10 } };
const NIGHT = { bands: { clean: 10, shaky: 0, fail: 90 }, fatal: { num: 63, den: 10 } };

/** A pixel's turn from north and its radius share, in device space (the rose's own geometry). */
function polar(x, y, sx, sy) {
  const R = Math.min((COMPASS_W - 4) * sx, (COMPASS_H - 4) * sy) / 2;
  const X = (x + 0.5) * sx - (COMPASS_W * sx) / 2;
  const Y = (y + 0.5) * sy - (COMPASS_H * sy) / 2;
  let turn = Math.atan2(X, -Y) / (2 * Math.PI);
  if (turn < 0) turn += 1;
  return { r: Math.sqrt(X * X + Y * Y) / R, turn };
}

test('the rose is round on the phone at every pixel shape: the dial\'s extent in device pixels is as wide as it is tall', () => {
  for (const [sx, sy] of SHAPES) {
    const px = compassBase({ ...HIGH, sx, sy });
    assert.equal(px.length, COMPASS_W * COMPASS_H);
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (let y = 0; y < COMPASS_H; y++) {
      for (let x = 0; x < COMPASS_W; x++) {
        if (px[y * COMPASS_W + x] === SLOT.navy) continue;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
    }
    const w = (x1 - x0 + 1) * sx;
    const h = (y1 - y0 + 1) * sy;
    assert.ok(Math.abs(w - h) <= Math.max(sx, sy) * 2, `${sx}:${sy}: ${w} wide by ${h} tall, round on the phone`);
    assert.ok(x0 >= 0 && y0 >= 1 && y1 <= COMPASS_H - 2, `${sx}:${sy}: it fits the picture`);
  }
});

test("the dial (8.8): moss clean, pink shaky, brick fail clockwise from north, ink rules between the bands and round the ring, the fatal sliver in ink; snow face, slate points; never gold", () => {
  for (const [sx, sy] of SHAPES) {
    const px = compassBase({ ...HIGH, sx, sy });
    const used = new Set(px);
    assert.ok(!used.has(7), 'no bonfire gold: the lily\'s alone (P12)');
    assert.deepEqual([...used].sort((a, b) => a - b), [SLOT.ink, SLOT.navy, SLOT.slate, SLOT.snow, SLOT.pink, SLOT.brick, SLOT.moss]);
    // Away from the rules, mid-ring, each band's color at its turns.
    const arcs = arcsOf(HIGH.bands, HIGH.fatal);
    for (let y = 0; y < COMPASS_H; y++) {
      for (let x = 0; x < COMPASS_W; x++) {
        const { r, turn } = polar(x, y, sx, sy);
        const mid = (FACE_R + RING_OUT) / 2;
        if (Math.abs(r - mid) > 0.05) continue;
        const v = px[y * COMPASS_W + x];
        const away = (/** @type {number} */ a) => Math.min(Math.abs(turn - a), 1 - Math.abs(turn - a)) > 0.02;
        if (!away(0) || !away(arcs.clean[1]) || !away(arcs.shaky[1]) || !away(arcs.fail[1])) continue;
        const want = turn < arcs.clean[1] ? SLOT.moss : turn < arcs.shaky[1] ? SLOT.pink : turn < arcs.fail[1] ? SLOT.brick : SLOT.ink;
        assert.equal(v, want, `${sx}:${sy} at turn ${turn.toFixed(3)}`);
      }
    }
  }
  // Each band boundary is ruled in ink: walk the ring's middle and find ink between moss and pink, pink and brick.
  const px = compassBase({ ...HIGH, sx: 7, sy: 4 });
  const seq = [];
  for (let k = 0; k < 2000; k++) {
    const turn = k / 2000;
    const r = ((FACE_R + RING_OUT) / 2) * (Math.min((COMPASS_W - 4) * 7, (COMPASS_H - 4) * 4) / 2);
    const x = Math.floor((r * Math.sin(turn * 2 * Math.PI) + (COMPASS_W * 7) / 2) / 7);
    const y = Math.floor((-r * Math.cos(turn * 2 * Math.PI) + (COMPASS_H * 4) / 2) / 4);
    const v = px[y * COMPASS_W + x];
    if (seq[seq.length - 1] !== v) seq.push(v);
  }
  assert.deepEqual(seq, [SLOT.moss, SLOT.ink, SLOT.pink, SLOT.ink, SLOT.brick, SLOT.ink], 'moss, a rule, pink, a rule, brick, then the ink sliver and the rule at north');
});

test("a night roll's two bands (Lead call 6): moss and brick, no pink, the fatal sliver at the end of the brick; a share too small to see still shows a sliver", () => {
  const px = compassBase({ ...NIGHT, sx: 7, sy: 4 });
  assert.ok(!px.includes(SLOT.pink));
  assert.ok(px.includes(SLOT.moss) && px.includes(SLOT.brick));
  assert.deepEqual(arcsOf(NIGHT.bands, NIGHT.fatal).fatal, [1 - 0.063, 1]);
  assert.deepEqual(arcsOf(HIGH.bands, { num: 1, den: 100 }).fatal, [1 - MIN_SLIVER, 1], '0.01% is still a sliver');
  assert.equal(arcsOf(HIGH.bands, null).fatal, null, 'no fatal share, no sliver');
  assert.deepEqual(arcsOf({ clean: 90, shaky: 5, fail: 5 }, null).fail, [0.95, 1]);
});

test('the needle rests inside the band it landed in (8.8), never on the roll: from a cosmetic draw, away from the edges', () => {
  for (const landed of ['clean', 'shaky', 'fail', 'fatal', 'great']) {
    const arc = arcsOf(HIGH.bands, HIGH.fatal)[landed === 'great' ? 'clean' : landed];
    for (const u of [0, 0.25, 0.5, 0.999]) {
      const a = restOf(HIGH.bands, HIGH.fatal, landed, u);
      assert.ok(a > arc[0] && a < arc[1], `${landed} at u ${u}: ${a} in ${arc}`);
    }
  }
  assert.throws(() => restOf(HIGH.bands, null, 'fatal', 0.5), /no fatal band/);
  assert.throws(() => restOf({ clean: 10, shaky: 0, fail: 90 }, null, 'shaky', 0.5), /no shaky band/);
  // The needle points there: its tip pixel, mid-ring along its turn, is ink with a snow outline beside it.
  const turn = restOf(HIGH.bands, HIGH.fatal, 'shaky', 0.5);
  const px = compassPic({ ...HIGH, angle: turn, sx: 7, sy: 4 });
  const R = Math.min((COMPASS_W - 4) * 7, (COMPASS_H - 4) * 4) / 2;
  const at = (/** @type {number} */ r) => {
    const x = Math.floor((r * R * Math.sin(turn * 2 * Math.PI) + (COMPASS_W * 7) / 2) / 7);
    const y = Math.floor((-r * R * Math.cos(turn * 2 * Math.PI) + (COMPASS_H * 4) / 2) / 4);
    return px[y * COMPASS_W + x];
  };
  assert.equal(at(0.4), SLOT.ink, 'the needle');
  assert.equal(at(0.7), SLOT.ink, 'into the ring');
  assert.ok(compassPic({ ...HIGH, angle: turn, sx: 7, sy: 4 }).includes(SLOT.snow));
  // The rest draw: the art stream, keyed as the roll is (never the roll stream), the same for the same roll.
  const r = outcomeOf('high');
  const trip = r.session.state.trip;
  const u = restDraw(trip);
  assert.equal(u, restDraw(trip));
  assert.equal(u, draw(trip.seed, 'art', 'compass', 'deer_lake_rim', 'fork', 'high', 1, 0).float());
  assert.notEqual(u, draw(trip.seed, 'roll', 'oldschool', 'deer_lake_rim', 'fork', 'high', 1, 0).float(), 'not the roll');
});

/** A display that keeps every frame it is shown. */
function fakeDisplay(sx = 7, sy = 4) {
  const frames = [];
  return { frames, shape: { sx, sy }, present: (/** @type {Uint8ClampedArray} */ rgba) => frames.push(Uint8ClampedArray.from(rgba)) };
}
/** A clock and an animation-frame queue the test turns by hand. */
function clockwork() {
  let ms = 0;
  let queue = [];
  const timers = [];
  return {
    now: () => ms,
    frame: (/** @type {() => void} */ f) => queue.push(f),
    later: (/** @type {() => void} */ f, /** @type {number} */ d) => {
      const h = { f, at: ms + d, done: false };
      timers.push(h);
      return h;
    },
    cancelLater: (/** @type {any} */ h) => {
      h.done = true;
    },
    advance(/** @type {number} */ d) {
      ms += d;
      const q = queue;
      queue = [];
      for (const f of q) f();
      for (const h of timers) if (!h.done && h.at <= ms) {
        h.done = true;
        h.f();
      }
    },
    get pending() {
      return queue.length;
    },
  };
}
const sound = () => {
  const played = [];
  return { played, play: (/** @type {string} */ c) => played.push(c) };
};

test('the spin (8.8, 13.2): about 1.2 s easing out, a tick at each 12 degrees so the ticks slow, then two ticks falling at rest, the live region, and the outcome 600 ms later', () => {
  setBundle(WORDS, {}, 'preview');
  const doc = fakeDocument();
  const live = doc.createElement('p');
  const c = clockwork();
  const s = sound();
  const display = fakeDisplay();
  let done = 0;
  const spin = playCompass({ display, palette: makePalette(), roll: { ...HIGH, landed: 'fail' }, u: 0.5, reduced: false, sound: s, live, now: c.now, frame: c.frame, later: c.later, cancelLater: c.cancelLater, done: () => done++ });
  assert.equal(spin.state(), 'spin');
  // Turn the frames over 1.2 s, 16 ms at a time.
  const tickTimes = [];
  for (let t = 0; t <= SPIN_MS + 32; t += 16) {
    const before = s.played.length;
    c.advance(16);
    if (s.played.length > before && s.played[s.played.length - 1] === 'ui.compass') tickTimes.push(c.now());
  }
  assert.equal(spin.state(), 'rest');
  assert.ok(tickTimes.length > 10, `${tickTimes.length} ticks`);
  const gaps = tickTimes.slice(1).map((t, k) => t - tickTimes[k]);
  assert.ok(gaps.slice(-3).every((g) => g > gaps[0]), 'the ticks slow with the needle');
  assert.equal(s.played[s.played.length - 1], 'ui.land');
  assert.equal(live.textContent, 'The needle stops in fail.');
  assert.equal(live.getAttribute('data-t'), 'trail.compass.landed');
  assert.equal(done, 0);
  c.advance(REST_MS);
  assert.deepEqual([done, spin.state()], [1, 'done'], 'the outcome after about 600 ms');
  assert.ok(display.frames.length > 30, 'drawn frame by frame');
  assert.equal(easeOut(0), 0);
  assert.equal(easeOut(1), 1);
  assert.ok(easeOut(0.5) > 0.5, 'fast, then slowing');
  assert.equal(TICK_TURN, 12 / 360);
});

test('a tap skips to rest, and a second brings the outcome; the fatal sliver is spoken as the black', () => {
  setBundle(WORDS, {}, 'preview');
  const live = fakeDocument().createElement('p');
  const c = clockwork();
  let done = 0;
  const spin = playCompass({ display: fakeDisplay(), palette: makePalette(), roll: { ...HIGH, landed: 'fatal' }, u: 0.2, reduced: false, sound: sound(), live, now: c.now, frame: c.frame, later: c.later, cancelLater: c.cancelLater, done: () => done++ });
  c.advance(16);
  spin.tap();
  assert.equal(spin.state(), 'rest');
  assert.equal(live.textContent, 'The needle stops in the black.');
  spin.tap();
  assert.deepEqual([done, spin.state()], [1, 'done']);
  c.advance(REST_MS);
  assert.equal(done, 1, 'once');
});

test('Reduce Motion: no spin; the final frame at once, synchronously, with one ui.land and no animation loop', () => {
  setBundle(WORDS, {}, 'preview');
  const c = clockwork();
  const s = sound();
  const display = fakeDisplay(4, 2);
  let done = 0;
  const spin = playCompass({ display, palette: makePalette(), roll: { ...HIGH, landed: 'clean' }, u: 0.5, reduced: true, sound: s, live: null, now: c.now, frame: c.frame, later: c.later, cancelLater: c.cancelLater, done: () => done++ });
  assert.deepEqual([spin.state(), display.frames.length, s.played, c.pending], ['rest', 1, ['ui.land'], 0]);
  c.advance(REST_MS);
  assert.equal(done, 1);
});

test('always the day table (lead call 4): the bands keep their colors whatever the palette\'s evening tables do', () => {
  // A palette whose night would turn moss to forest: the compass never asks for it.
  const pal = makePalette();
  const display = fakeDisplay();
  playCompass({ display, palette: pal, roll: { ...HIGH, landed: 'clean' }, u: 0.5, reduced: true, sound: sound(), live: null, now: () => 0, frame: () => {}, later: () => 0, cancelLater: () => {}, done: () => {} });
  const want = new Set([SLOT.ink, SLOT.navy, SLOT.slate, SLOT.snow, SLOT.pink, SLOT.brick, SLOT.moss].map((k) => pal.rgb[k].join(',')));
  const got = new Set();
  const f = display.frames[0];
  for (let i = 0; i < f.length; i += 4) got.add(`${f[i]},${f[i + 1]},${f[i + 2]}`);
  assert.deepEqual([...got].sort(), [...want].sort());
  // withNeedle reuses its frame, so a spin draws without new arrays.
  const base = compassBase({ ...HIGH, sx: 7, sy: 4 });
  const out = new Uint8Array(base.length);
  assert.equal(withNeedle(base, 0.3, 7, 4, out), out);
});
