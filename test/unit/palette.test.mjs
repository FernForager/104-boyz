import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PALETTE, REMAPS, CYCLES, makePalette, resolve, hasCycles, hexToRgb } from '../../web/js/gfx/palette.js';
import { ROOT } from '../../tools/pics.mjs';
import { lift, oklab, contrastRatio } from '../../tools/color.mjs';
import { placeLights, lightProblems, readProblems, READS, READ_PAIRS, DAY_HUE_ONLY, NIGHT_SKY_MAX_L, NIGHT_SKY_MIN_C } from '../../tools/render-pics.mjs';
import { drawable } from '../../web/js/gfx/compose.js';
import { loadArt } from '../../tools/pics.mjs';

const LOADED = loadArt();

// Option B of design/art/style_mockup.py, copied by hand as a fixed point:
// shipped from S1 to S5, and the first hexes GAME_DESIGN 11.1 records.
const OPTION_B = [
  '#1b1f2a', '#24324a', '#3f5a7a', '#8fb3c9', '#f2efe6', '#e8d9b5', '#e09a8a', '#e8b33a',
  '#c4602d', '#8a3b2a', '#5a3d2b', '#1f3b33', '#2f5b45', '#6b8a4a', '#a7b88a', '#3f7f7a',
];

// Palette A, the creator's sixteen (decision 68, 2026-10-10), copied by hand
// from the decision as a second fixed point.
const PALETTE_A = [
  '#343945', '#394862', '#4d698a', '#93b7cd', '#f2efe6', '#e9dab6', '#e49d8d', '#ebb53d',
  '#ce6937', '#9b4a39', '#6d4f3d', '#345148', '#3f6c55', '#749353', '#aabb8d', '#4a8a85',
];

test("palette A: option B's sixteen lifted (decision 68), in slot order", () => {
  assert.deepEqual([...PALETTE], PALETTE_A);
  // The rule reproduces every hex: L' = L + 0.18 x (1 - L)^2 in OKLab, a and b kept.
  assert.deepEqual(OPTION_B.map(lift), PALETTE_A, "each is option B's color lifted by decision 68's rule");
  // The darks lift most; snow doesn't move, and paper cream barely.
  const dL = OPTION_B.map((h, i) => oklab(PALETTE_A[i])[0] - oklab(h)[0]);
  assert.equal(PALETTE_A[4], OPTION_B[4], 'snow is unchanged');
  assert.ok(dL[0] > 0.1 && dL[0] === Math.max(...dL), 'ink lifts most');
  assert.ok(dL[5] < 0.01, 'paper cream barely moves');
  // ...and the mockup script still records option B, the art decision.
  const py = readFileSync(join(ROOT, 'design', 'art', 'style_mockup.py'), 'utf8');
  const m = /^BOOK = \[([^\]]+)\]/m.exec(py);
  assert.ok(m, 'style_mockup.py has its BOOK list');
  const book = m[1].split(',').map((s) => s.trim().replace(/'/g, '').toLowerCase());
  assert.deepEqual(book, OPTION_B);
});

test('palette.json, palette.js and tokens.css agree (and the scrim is ink)', () => {
  const json = JSON.parse(readFileSync(join(ROOT, 'content', 'art', 'palette.json'), 'utf8'));
  assert.deepEqual(json.colors.map((c) => c.hex), PALETTE_A);
  assert.deepEqual(json.colors.map((c) => c.slot), [...Array(16).keys()]);
  assert.match(json.$comment, /decision 68/, "palette.json's comment names decision 68");
  assert.deepEqual(json.remaps, JSON.parse(JSON.stringify(REMAPS)));
  assert.deepEqual(json.cycles, JSON.parse(JSON.stringify(CYCLES)));
  const css = readFileSync(join(ROOT, 'web', 'css', 'tokens.css'), 'utf8');
  for (let i = 0; i < 16; i++) {
    const m = new RegExp(`--c${i}:\\s*(#[0-9a-f]{6})`).exec(css);
    assert.ok(m, `tokens.css has --c${i}`);
    assert.equal(m[1], PALETTE_A[i], `--c${i}`);
  }
  // The scrim (S6): slot 0 at 72%, as a token, since a color can't be var() inside rgb() with an alpha.
  const scrim = /--scrim:\s*rgb\((\d+) (\d+) (\d+) \/ 0\.72\);/.exec(css);
  assert.ok(scrim, 'tokens.css has --scrim');
  assert.deepEqual(scrim.slice(1, 4).map(Number), hexToRgb(PALETTE_A[0]), 'the scrim is ink');
  assert.match(readFileSync(join(ROOT, 'web', 'css', 'game.css'), 'utf8'), /\.scrim \{[^}]*background: var\(--scrim\);/);
});

test("the shell's theme-color, the manifest's two colors and the display's edge are slot 0 (ink), so a palette change can't miss them", () => {
  const html = readFileSync(join(ROOT, 'web', 'index.html'), 'utf8');
  assert.equal(/<meta name="theme-color" content="(#[0-9a-f]{6})">/.exec(html)?.[1], PALETTE[0]);
  const manifest = JSON.parse(readFileSync(join(ROOT, 'web', 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.background_color, PALETTE[0]);
  assert.equal(manifest.theme_color, PALETTE[0]);
  assert.match(readFileSync(join(ROOT, 'web', 'js', 'gfx', 'display.js'), 'utf8'), /export function createDisplay\(canvas, width, height, edge = PALETTE\[0\]\)/);
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

test('S5: the four hours (day, dusk, blue, night), in palette.js and palette.json alike, with the doc 11.4 key slots (as S6 re-tuned them)', () => {
  assert.deepEqual(Object.keys(REMAPS), ['day', 'dusk', 'blue', 'night']);
  const json = JSON.parse(readFileSync(join(ROOT, 'content', 'art', 'palette.json'), 'utf8'));
  assert.deepEqual(Object.keys(json.remaps), ['day', 'dusk', 'blue', 'night']);
  // Doc 11.4's table: by the day slot, the dusk, blue-hour and night slots.
  // Re-pinned in S6 (decision 68's re-tune): blue hour's slate goes down one
  // more step, to ink, as at night (S5's was night navy), so its upper sky sits
  // under dusk's; its glacier blue stays slate, as at dusk, so its sky stays
  // lighter than night's (and than S5's).
  const KEYS = {
    2: [1, 0, 0], // slate: the upper sky
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
  // S6: but paper cream, the trail, which goes to teal so it reads on the night
  // meadow (forest at 1.06 from slate; 1.51 from teal): the one pale thing left
  // on the ground, and still under every star.
  const bright = (slot) => PALETTE[slot].slice(1).match(/../g).reduce((a, h) => a + parseInt(h, 16), 0);
  for (let s = 0; s < 16; s++) if (s !== 7 && s !== 5) assert.ok(bright(REMAPS.night[s]) <= bright(2), `night ${s} -> ${REMAPS.night[s]}`);
  assert.equal(REMAPS.night[5], 15, 'the trail is teal at night');
  for (const star of CYCLES[22].slots) assert.ok(bright(star) > bright(2) && bright(star) > bright(REMAPS.night[5]), `star ${star} outshines the ground`);
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

// S6 (decision 68): the tables, judged over every drawable place, so the
// 500 to 600 places of decision 69 are judged at every hour as they arrive.

/** S5's tables, as they stood before S6's re-tune. */
const S5_TABLES = Object.freeze({
  day: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  dusk: [0, 1, 1, 2, 6, 6, 9, 7, 9, 10, 10, 0, 11, 12, 13, 2],
  blue: [0, 1, 1, 2, 3, 2, 2, 7, 9, 10, 0, 0, 11, 12, 13, 2],
  night: [0, 0, 0, 1, 2, 2, 1, 7, 9, 10, 0, 0, 11, 12, 12, 2],
});

test('S6: night is night and not grey, at every drawable place: its lightness falls through day, dusk, blue hour and night, and its night sky is dark and blue', () => {
  const lights = placeLights();
  const places = Object.keys(LOADED.recipes.places).filter((p) => drawable(p, { pics: LOADED.pics, stamps: LOADED.stamps, recipes: LOADED.recipes }));
  assert.equal(lights.length, places.length, 'every drawable place');
  assert.ok(lights.length >= 28, 'the loop: 28 places today');
  assert.deepEqual(lightProblems(lights), []);
  for (const { id, hours } of lights) {
    assert.ok(hours.night.sky > 0, `${id} shows some sky`);
    assert.ok(hours.night.skyL <= NIGHT_SKY_MAX_L && hours.night.skyC >= NIGHT_SKY_MIN_C, id);
  }
  assert.equal(NIGHT_SKY_MAX_L, 0.47);
  assert.equal(NIGHT_SKY_MIN_C, 0.035);
  // Lighter than S5, as the creator asked (decision 68): Deer Lake's night is brighter, and still night.
  const deer = lights.find((l) => l.id === 'deer_lake').hours;
  assert.ok(deer.night.L > 0.4 && deer.night.L < deer.blue.L, `Deer Lake at night: ${deer.night.L.toFixed(3)}`);
  // The checks bite: a night that is the day table is no night; a night sky of ink alone is grey.
  const pal = makePalette();
  const asDay = lightProblems(placeLights(LOADED, { ...pal, remaps: { ...pal.remaps, night: [...REMAPS.day] } }));
  assert.ok(asDay.some((p) => /^deer_lake: night \(\d\.\d+\) is no darker than blue/.test(p)) && asDay.some((p) => /night sky's lightness .* is over 0\.47/.test(p)), asDay.join('\n'));
  const inkSky = [...REMAPS.night];
  inkSky[3] = 0;
  const grey = lightProblems(placeLights(LOADED, { ...pal, remaps: { ...pal.remaps, night: inkSky } }));
  assert.ok(grey.some((p) => /^deer_lake: the night sky's chroma 0\.02\d is under 0\.035 \(grey, not night\)/.test(p)), grey.join('\n'));
});

test("S6: a few shades lighter (decision 68): at every drawable place, no hour's picture, nor its sky, is darker than S5's sixteen and tables made it; and blue hour's sky is not night's", () => {
  const s5 = { ...makePalette(), colors: OPTION_B, rgb: OPTION_B.map(hexToRgb), remaps: S5_TABLES };
  const before = new Map(placeLights(LOADED, s5).map((l) => [l.id, l.hours]));
  const now = placeLights();
  assert.ok(now.length >= 28);
  const darker = [];
  for (const { id, hours } of now) {
    const was = /** @type {any} */ (before.get(id));
    for (const hour of ['day', 'dusk', 'blue', 'night']) {
      if (hours[hour].L < was[hour].L) darker.push(`${id} ${hour}: ${was[hour].L.toFixed(3)} -> ${hours[hour].L.toFixed(3)}`);
      if (hours[hour].skyL < was[hour].skyL) darker.push(`${id} ${hour}'s sky: ${was[hour].skyL.toFixed(3)} -> ${hours[hour].skyL.toFixed(3)}`);
    }
    assert.ok(hours.blue.skyL > hours.night.skyL + 0.05, `${id}: blue hour's sky (${hours.blue.skyL.toFixed(3)}) is lighter than night's (${hours.night.skyL.toFixed(3)})`);
  }
  assert.deepEqual(darker, []);
  // The check bites: the first S6 re-tune (glacier blue to night navy at blue hour) made blue hour's sky night's, darker than S5's.
  const first = { ...makePalette(), remaps: { ...REMAPS, blue: [0, 0, 0, 1, 3, 15, 1, 7, 9, 10, 0, 0, 11, 12, 12, 2] } };
  const deer = placeLights(LOADED, first).find((l) => l.id === 'deer_lake');
  assert.ok(deer && deer.hours.blue.skyL < /** @type {any} */ (before.get('deer_lake')).blue.skyL);
});

test('S6: the scene reads at every hour: a conifer against the meadow, the lake against its shore, the trail against the meadow, at least 1.3 apart and never one slot', () => {
  assert.equal(READS, 1.3);
  assert.deepEqual(READ_PAIRS.map(([a, b]) => [a, b]), [[12, 13], [3, 13], [3, 14], [5, 13]]);
  assert.equal(CYCLES[16].slots[0], 3, "the lake cycle's first slot is the lake's glacier blue");
  assert.deepEqual(readProblems(REMAPS, PALETTE), []);
  // By day the sixteen as drawn keep the lake and the sage apart by hue alone; no table can move day.
  assert.deepEqual([...DAY_HUE_ONLY], [3, 14]);
  assert.equal(contrastRatio(PALETTE[3], PALETTE[14]).toFixed(2), '1.03');
  // Why S6 re-tuned: S5's tables, in palette A's sixteen, lose the lake and the trail in the meadow after sunset.
  assert.deepEqual(readProblems(S5_TABLES, PALETTE), [
    'dusk: the lake (glacier blue) against its shore (moss), slate against forest, 1.06 apart, under 1.3',
    'blue: the lake (glacier blue) against its shore (moss), slate against forest, 1.06 apart, under 1.3',
    'blue: the trail (paper cream) against the meadow (moss), slate against forest, 1.06 apart, under 1.3',
    'night: the trail (paper cream) against the meadow (moss), slate against forest, 1.06 apart, under 1.3',
  ]);
  // Never the same slot: a table that sends the trail to the meadow's slot fails, at that hour.
  const same = { ...REMAPS, night: REMAPS.night.map((to, from) => (from === 5 ? REMAPS.night[13] : to)) };
  assert.deepEqual(readProblems(same, PALETTE), ['night: the trail (paper cream) against the meadow (moss) are both forest']);
});

test('S6: the re-tune, slot by slot against S5 (palette.json records each, and why)', () => {
  const moved = [];
  for (const hour of ['dusk', 'blue', 'night']) REMAPS[hour].forEach((to, from) => to !== S5_TABLES[hour][from] && moved.push(`${hour} ${from}: ${S5_TABLES[hour][from]} -> ${to}`));
  assert.deepEqual(moved, [
    'dusk 13: 12 -> 15', // moss: teal, not forest (1.06 from the lake's slate)
    'blue 2: 1 -> 0', // slate: ink, as at night (a key slot): the upper sky a step under dusk's
    'blue 6: 2 -> 1', // alpenglow pink: night navy, as at night
    'blue 13: 12 -> 15', // moss: teal, as at dusk, apart from the lake's slate
    'blue 14: 13 -> 15', // sage: teal, apart from the lake's slate
    'night 5: 2 -> 15', // paper cream: teal, the trail
  ]);
  const json = JSON.parse(readFileSync(join(ROOT, 'content', 'art', 'palette.json'), 'utf8'));
  for (const what of ['teal', 'night navy', 'key slot']) assert.match(json.$comment, new RegExp(what), `palette.json's comment says ${what}`);
});
