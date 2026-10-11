// The cabin's clock (BUILD_PLAN S7, 11.2; GAME_DESIGN 2.2, 11.4; lead call
// 54): platform/now.js. The lake's own time at fixed instants, across both
// daylight-time changes and on every day of the sun table; the hours rule
// pinned to the minute on four dates and its order held on all 1,826 days;
// the date's sky the same twice, its shares by month within four points of
// climatology over the table's five years, fog only on a dry morning; the
// real moon new and full on NASA's eclipse dates.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from '../../tools/pics.mjs';
import { pacificNow, sunRow, hourAt, hourBounds, skyOn, skyWeights, moonOn, sceneAt, epochDay, dateOfDay, daysInMonth, HOUR_ORDER, DAY_S } from '../../web/js/platform/now.js';

const read = (/** @type {string} */ p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const sun = read('content/data/quinault_sun.json');
const climate = read('content/data/climate.json');
const cabin = read('content/home/cabin.json');
const hm = (/** @type {number} */ s) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`;
const FIRST = epochDay({ y: 2026, m: 1, d: 1 });

test("pacificNow: the lake's own date and time, across both daylight-time changes, whatever the phone's zone", () => {
  const at = (/** @type {string} */ iso) => {
    const p = pacificNow(new Date(iso));
    return `${p.y}-${p.m}-${p.d} ${hm(p.secs)}:${String(p.secs % 60).padStart(2, '0')}`;
  };
  // Spring forward, 2026-03-08: 1:59:59 PST, then 3:00:00 PDT.
  assert.equal(at('2026-03-08T09:59:59Z'), '2026-3-8 1:59:59');
  assert.equal(at('2026-03-08T10:00:00Z'), '2026-3-8 3:00:00');
  // Fall back, 2026-11-01: 1:59:59 PDT, then 1:00:00 PST.
  assert.equal(at('2026-11-01T08:59:59Z'), '2026-11-1 1:59:59');
  assert.equal(at('2026-11-01T09:00:00Z'), '2026-11-1 1:00:00');
  // Midnight is 0, never 24.
  assert.equal(at('2026-10-10T07:00:00Z'), '2026-10-10 0:00:00');
  // A phone in New York at 10 pm (EDT) sees the cabin at 7 pm.
  assert.equal(at('2026-10-11T02:00:00Z'), '2026-10-10 19:00:00');
  const p = pacificNow(new Date('2026-10-10T19:00:00Z'));
  assert.equal(p.dow, 6, 'a Saturday');
  assert.equal(p.ms, Date.parse('2026-10-10T19:00:00Z'));
  // The phone's own zone changes nothing (a child process in New York and in Tokyo).
  for (const tz of ['America/New_York', 'Asia/Tokyo']) {
    const src = `import { pacificNow } from ${JSON.stringify(join(ROOT, 'web/js/platform/now.js'))}; const p = pacificNow(new Date('2026-10-11T02:00:00Z')); console.log(p.d, p.secs);`;
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', src], { env: { ...process.env, TZ: tz }, encoding: 'utf8' });
    assert.equal(r.stdout.trim(), '10 68400', `TZ=${tz}`);
  }
});

test("Intl's Pacific offset is the sun table's on every day 2026 to 2030, at noon", () => {
  assert.equal(sun.from, '2026-01-01');
  assert.equal(sun.days.length, 1826);
  sun.days.forEach((row, k) => {
    const n = FIRST + k;
    const instant = (n * DAY_S + 12 * 3600 - row[0] * 3600) * 1000;
    const p = pacificNow(new Date(instant));
    const want = dateOfDay(n);
    assert.deepEqual([p.y, p.m, p.d, p.secs], [want.y, want.m, want.d, 12 * 3600], `${want.y}-${want.m}-${want.d}`);
  });
});

test('sunRow: the table\'s row for a date in it; outside 2026 to 2030 the same month and day in the nearest year (Feb 29 to Feb 28)', () => {
  const rowOf = (/** @type {number} */ y, /** @type {number} */ m, /** @type {number} */ d) => sun.days[epochDay({ y, m, d }) - FIRST];
  assert.equal(sunRow(sun, { y: 2026, m: 10, d: 10 }), rowOf(2026, 10, 10));
  assert.equal(sunRow(sun, { y: 2030, m: 12, d: 31 }), sun.days[1825]);
  assert.equal(sunRow(sun, { y: 2028, m: 2, d: 29 }), rowOf(2028, 2, 29));
  assert.equal(sunRow(sun, { y: 2025, m: 6, d: 21 }), rowOf(2026, 6, 21));
  assert.equal(sunRow(sun, { y: 2031, m: 6, d: 21 }), rowOf(2030, 6, 21));
  assert.equal(sunRow(sun, { y: 2040, m: 1, d: 1 }), rowOf(2030, 1, 1));
  assert.equal(sunRow(sun, { y: 2024, m: 2, d: 29 }), rowOf(2026, 2, 28));
  assert.equal(sunRow(sun, { y: 2032, m: 2, d: 29 }), rowOf(2030, 2, 28));
});

test("sunRow: a borrowed row moves to the lake's own offset that day, so a year whose daylight time starts or ends on another date keeps its hours (S7 review)", () => {
  const rowOf = (/** @type {number} */ y, /** @type {number} */ m, /** @type {number} */ d) => sun.days[epochDay({ y, m, d }) - FIRST];
  // pacificNow gives the offset: -8 in winter, -7 in summer.
  assert.equal(pacificNow(new Date('2026-01-10T20:00:00Z')).off, -8);
  assert.equal(pacificNow(new Date('2026-10-10T19:00:00Z')).off, -7);
  assert.equal(pacificNow(new Date('2026-11-01T08:59:59Z')).off, -7, 'the last second of daylight time');
  assert.equal(pacificNow(new Date('2026-11-01T09:00:00Z')).off, -8, 'standard time again');
  // 2031-03-09 is daylight time; 2030-03-09, the row it borrows, was standard (2030's began on the 10th).
  const spring = pacificNow(new Date('2031-03-09T19:00:00Z'));
  assert.deepEqual([spring.y, spring.m, spring.d, spring.secs, spring.off], [2031, 3, 9, 12 * 3600, -7]);
  const was = rowOf(2030, 3, 9);
  assert.equal(was[0], -8);
  assert.deepEqual(sunRow(sun, spring), [-7, ...was.slice(1).map((s) => s + 3600)], "an hour later on 2031's clock");
  const sunset = sunRow(sun, spring)[3];
  assert.equal(hm(sunset), '19:12', 'the sunset at 19:12 PDT, not 18:12');
  const dusk = hourAt(sunRow(sun, spring), 17 * 3600 + 45 * 60, cabin.hours);
  assert.equal(dusk.hour, 'day', 'at 17:45 it is still day (the unmoved row said dusk)');
  // 2031-11-02 is standard time; 2030-11-02, the row it borrows, was daylight (2030's ended on the 3rd).
  const fall = pacificNow(new Date('2031-11-02T20:00:00Z'));
  assert.equal(fall.off, -8);
  const then = rowOf(2030, 11, 2);
  assert.equal(then[0], -7);
  assert.deepEqual(sunRow(sun, fall), [-8, ...then.slice(1).map((s) => s - 3600)], "an hour earlier on 2031's clock");
  // A borrowed row whose offset agrees is the table's own; a date in the table is never moved.
  const june = pacificNow(new Date('2031-06-21T19:00:00Z'));
  assert.equal(sunRow(sun, june), rowOf(2030, 6, 21));
  assert.equal(sunRow(sun, { y: 2026, m: 3, d: 8, off: -8 }), rowOf(2026, 3, 8), 'the table keeps its own day, even at 1 am before the change');
  // Without an offset (a hand-built date), the borrowed row is as the table has it.
  assert.equal(sunRow(sun, { y: 2031, m: 3, d: 9 }), was);
});

test('hourAt: the hours of 2026-10-10, 06-21, 12-21 and 03-08 to the minute, at every 15 minutes', () => {
  const pins = {
    '2026-10-10': ['6:25', '7:11', '7:57', '18:06', '18:52', '19:38'],
    '2026-6-21': ['3:57', '4:58', '5:48', '20:46', '21:36', '22:37'],
    '2026-12-21': ['6:48', '7:42', '8:30', '15:57', '16:44', '17:38'],
    '2026-3-8': ['6:40', '7:26', '8:11', '18:41', '19:26', '20:12'],
  };
  for (const [iso, want] of Object.entries(pins)) {
    const [y, m, d] = iso.split('-').map(Number);
    const row = sunRow(sun, { y, m, d });
    const b = hourBounds(row, cabin.hours);
    const marks = [b.blue, b.dawn, b.day, b.dusk, b.blue_pm, b.night];
    assert.deepEqual(marks.map(hm), want, iso);
    // Every 15 minutes, the hour is the one its marks say.
    for (let s = 0; s < DAY_S; s += 900) {
      const k = marks.filter((x) => x <= s).length;
      assert.equal(hourAt(row, s, cabin.hours).hour, HOUR_ORDER[k], `${iso} ${hm(s)}`);
    }
    // The evening's blue hour is the evening's; the morning's isn't.
    assert.equal(hourAt(row, b.blue, cabin.hours).evening, false);
    assert.equal(hourAt(row, b.blue_pm, cabin.hours).evening, true);
    assert.equal(hourAt(row, b.night, cabin.hours).evening, true);
  }
});

test('the hours step night, blue, dawn, day, dusk, blue, night on every day of the table, each for a while', () => {
  sun.days.forEach((row, k) => {
    const b = hourBounds(row, cabin.hours);
    const marks = [0, b.blue, b.dawn, b.day, b.dusk, b.blue_pm, b.night, DAY_S];
    for (let i = 1; i < marks.length; i++) assert.ok(marks[i] > marks[i - 1] + 600, `day ${k}: each hour lasts over ten minutes`);
    /** @type {string[]} */
    const seen = [];
    for (let s = 0; s < DAY_S; s += 300) {
      const h = hourAt(row, s, cabin.hours).hour;
      if (seen[seen.length - 1] !== h) seen.push(h);
    }
    assert.deepEqual(seen, HOUR_ORDER, `day ${k}`);
  });
});

test("skyOn: the date's sky is the same twice, fog only on a dry day, and every month's shares sit within four points of climatology over the table's five years", () => {
  assert.deepEqual(skyOn({ y: 2026, m: 10, d: 10 }, climate, cabin.sky), skyOn({ y: 2026, m: 10, d: 10 }, climate, cabin.sky));
  /** @type {Record<number, {n: number, rain: number, cloudy: number, clear: number, fog: number}>} */
  const by = {};
  for (let k = 0; k < sun.days.length; k++) {
    const ymd = dateOfDay(FIRST + k);
    const s = skyOn(ymd, climate, cabin.sky);
    assert.ok(['clear', 'cloudy', 'rain'].includes(s.sky));
    if (s.fog) assert.notEqual(s.sky, 'rain', `${ymd.y}-${ymd.m}-${ymd.d}: fog only on a dry day`);
    const c = (by[ymd.m] ||= { n: 0, rain: 0, cloudy: 0, clear: 0, fog: 0 });
    c.n++;
    c[/** @type {'rain' | 'cloudy' | 'clear'} */ (s.sky)]++;
    if (s.fog) c.fog++;
  }
  for (let m = 1; m <= 12; m++) {
    const w = skyWeights(m, climate, cabin.sky);
    for (const k of /** @type {const} */ (['rain', 'cloudy', 'clear'])) {
      const got = (100 * by[m][k]) / by[m].n;
      assert.ok(Math.abs(got - w[k] / 10) <= 4, `month ${m} ${k}: ${got.toFixed(1)}% against ${w[k] / 10}%`);
    }
    assert.ok(by[m].fog > 0, `month ${m} has a foggy morning`);
  }
  // The station's wet days over the month's: August 8.4 of 31, October 17.7 of 31.
  assert.equal(skyWeights(8, climate, cabin.sky).rain, 271);
  assert.equal(skyWeights(10, climate, cabin.sky).rain, 571);
  // Each weight's per mille, and they total 1000.
  for (let m = 1; m <= 12; m++) {
    const w = skyWeights(m, climate, cabin.sky);
    assert.equal(w.rain + w.cloudy + w.clear, 1000);
    for (const v of Object.values(w)) assert.ok(Number.isInteger(v) && v >= 0);
  }
  // Every fog estimate is flagged with its reason.
  for (const r of cabin.sky.fog_permille) assert.ok(r.estimate === true && r.why.length > 0, `month ${r.m}`);
  assert.equal(daysInMonth(2028, 2), 29);
});

test("moonOn: new on NASA's 2026-08-12 and 2027-08-02 solar eclipses, full on the 2026-03-03 and 2026-08-28 lunar eclipses, its phase stepping on through a month", () => {
  // NASA's eclipse catalog (eclipse.gsfc.nasa.gov): total solar 2026 Aug 12 and 2027 Aug 2; total lunar 2026 Mar 3; partial lunar 2026 Aug 28.
  assert.equal(moonOn(Date.parse('2026-08-12T17:46:00Z'), cabin.moon).phase, 0);
  assert.equal(moonOn(Date.parse('2027-08-02T10:07:00Z'), cabin.moon).phase, 0);
  assert.equal(moonOn(Date.parse('2026-03-03T11:33:00Z'), cabin.moon).phase, 4);
  assert.equal(moonOn(Date.parse('2026-08-28T04:13:00Z'), cabin.moon).phase, 4);
  // From one new moon, the phase steps 0 to 7 once and back to 0, never back.
  const t0 = Date.parse('2026-08-12T17:46:00Z');
  /** @type {number[]} */
  const steps = [];
  for (let h = 0; h <= 30 * 24; h += 6) {
    const p = moonOn(t0 + h * 3600000, cabin.moon).phase;
    if (steps[steps.length - 1] !== p) steps.push(p);
  }
  assert.deepEqual(steps, [0, 1, 2, 3, 4, 5, 6, 7, 0]);
  const m = moonOn(t0, cabin.moon);
  assert.ok(Number.isInteger(m.age) && m.age >= 0 && m.age < cabin.moon.synodic_e5);
});

test('the moon rises at 6:00 plus 48 minutes a day of age and is up 12 hours: a full moon up at midnight and down at noon, a first quarter up at 20:00 and down at 03:00', () => {
  const full = moonOn(Date.parse('2026-08-28T04:13:00Z'), cabin.moon);
  assert.equal(full.up(0), true);
  assert.equal(full.up(12 * 3600), false);
  // A first quarter: about seven and a third days after the new moon.
  const quarter = moonOn(Date.parse('2026-08-12T17:46:00Z') + 7.38 * DAY_S * 1000, cabin.moon);
  assert.equal(quarter.phase, 2);
  assert.equal(quarter.up(20 * 3600), true);
  assert.equal(quarter.up(3 * 3600), false);
  assert.equal((quarter.set - quarter.rise + DAY_S) % DAY_S, 12 * 3600);
});

test("sceneAt: the cabin's scene at a moment, and the next moment it changes", () => {
  const data = { sun, climate, cabin };
  // 2026-10-10 at 19:00 Pacific: the evening's blue hour (19:38 is night).
  const at7 = sceneAt(pacificNow(new Date('2026-10-11T02:00:00Z')), data);
  assert.equal(at7.hour, 'blue');
  assert.equal(at7.evening, true);
  const oct10 = hourBounds(sunRow(sun, { y: 2026, m: 10, d: 10 }), cabin.hours);
  assert.ok(at7.next > 19 * 3600 && at7.next <= oct10.night);
  // Noon: day, and the next change is dusk's (or the moon's), never past midnight.
  const noon = sceneAt(pacificNow(new Date('2026-10-10T19:00:00Z')), data);
  assert.equal(noon.hour, 'day');
  assert.ok(noon.next > 12 * 3600 && noon.next <= oct10.dusk);
  // Fog only in the morning: a foggy date shows it from the morning's blue hour to 11:00, and never after.
  let foggy = null;
  for (let k = 0; k < 400 && !foggy; k++) {
    const ymd = dateOfDay(FIRST + k);
    if (skyOn(ymd, climate, cabin.sky).fog) foggy = ymd;
  }
  assert.ok(foggy, 'a foggy morning in the first 400 days');
  const row = sunRow(sun, foggy);
  const b = hourBounds(row, cabin.hours);
  const at = (/** @type {number} */ secs) => sceneAt({ ...foggy, dow: 0, secs, ms: (epochDay(foggy) * DAY_S + secs - row[0] * 3600) * 1000 }, data);
  assert.equal(at(b.blue - 60).fog, false, 'not in the night before');
  assert.equal(at(b.blue).fog, true);
  assert.equal(at(cabin.sky.fog_until_s - 1).fog, true);
  assert.equal(at(cabin.sky.fog_until_s).fog, false);
  assert.equal(at(b.blue - 60).next, b.blue);
  assert.equal(at(cabin.sky.fog_until_s - 1).next <= cabin.sky.fog_until_s, true);
  // The moon: drawn at its phase when it's up, none when it isn't, and none with real_moon off.
  for (let h = 0; h < 24; h++) {
    const p = pacificNow(new Date(Date.parse('2026-08-28T07:00:00Z') + h * 3600000));
    const s = sceneAt(p, data);
    const m = moonOn(p.ms, cabin.moon);
    assert.equal(s.moon, m.up(p.secs) ? m.phase : 0);
    assert.equal(sceneAt(p, { ...data, realMoon: false }).moon, 0);
    assert.ok(s.next > p.secs && s.next <= DAY_S);
  }
});
