// The sun tables (BUILD_PLAN 3.5, 6.6, S4; GAME_DESIGN 2.2, 7.2, B.2, E.5;
// Lead call 34): FACT_CHECK.md R3's fourteen Lake Quinault sunrises to the
// second, park_rules.json's 96 loop values for 2027 to the minute, the
// daylight-time dates, and the files as ingest makes them.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { readInputs, stableJson } from '../../tools/ingest.mjs';
import { conditions } from '../../tools/ingest/conditions.mjs';
import { sunTable, sunGenerator, dayOf, isoOf, dstDates, pacificOffset, hms, hmRound, instantOf, zenith, QUINAULT_FILE, DAYLIGHT_FILE, QUINAULT_TO } from '../../tools/sun.mjs';

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const quinault = read(QUINAULT_FILE);
const daylight = read(DAYLIGHT_FILE);
const row = (t, iso) => t.days[dayOf(iso) - dayOf(t.from)];

test("FACT_CHECK R3: Lake Quinault's fourteen sunrises of 2026, to the second (floored, never rounded)", () => {
  assert.deepEqual(quinault.point, [47.47, -123.86]);
  const r3 = {
    '2026-01-01': ['8:03:07', -8],
    '2026-01-02': ['8:03:05', -8],
    '2026-03-07': ['6:43:50', -8],
    '2026-03-08': ['7:41:53', -7],
    '2026-03-20': ['7:17:56', -7],
    '2026-06-15': ['5:17:42', -7],
    '2026-06-16': ['5:17:42', -7],
    '2026-06-21': ['5:18:18', -7],
    '2026-09-23': ['7:03:51', -7],
    '2026-10-09': ['7:25:50', -7],
    '2026-10-31': ['7:57:58', -7],
    '2026-11-01': ['6:59:28', -8],
    '2026-12-21': ['8:00:21', -8],
    '2026-12-31': ['8:03:06', -8],
  };
  for (const [d, [t, off]] of Object.entries(r3)) {
    const r = row(quinault, d);
    assert.equal(hms(r[2]), t, d);
    assert.equal(r[0], off, `${d}'s offset`);
  }
  // The UTC column: Jan 1 is 16:03:07 UTC, June 15 12:17:42 UTC (R3).
  const i = dayOf('2026-06-15') - dayOf(quinault.from);
  assert.equal(instantOf(quinault.from, i, quinault.days[i], 2) % 86400, 12 * 3600 + 17 * 60 + 42);
  const j = dayOf('2026-01-01') - dayOf(quinault.from);
  assert.equal(instantOf(quinault.from, j, quinault.days[j], 2) % 86400, 16 * 3600 + 3 * 60 + 7);
});

test("park_rules.json's 2027 loop daylight: all 96 values to the minute, and B.2's Thursday", () => {
  const pr = read('design/data/park_rules.json');
  const loop = pr.climate.m1a_weather_inputs.daylight_loop_2027;
  assert.equal(loop.rows.length, 24);
  assert.deepEqual(daylight.point, [47.97, -123.83]);
  // daylight.json covers the trip window (to 2027-10-31); the year's last four rows come from the same method.
  const year = sunTable({ lat: 47.97, lon: -123.83, from: '2027-01-01', to: '2027-12-31' });
  let n = 0;
  for (const r of loop.rows) {
    const inFile = r.date <= daylight.to ? row(daylight, r.date) : null;
    const x = inFile || row(year, r.date);
    if (inFile) assert.deepEqual(inFile, row(year, r.date), `${r.date}: the file and a fresh table agree`);
    assert.deepEqual([hmRound(x[2]), hmRound(x[3]), hmRound(x[1]), hmRound(x[4]), x[0]], [r.sunrise, r.sunset, r.civil_dawn, r.civil_dusk, r.utc_offset_h], r.date);
    n += 4;
  }
  assert.equal(n, 96);
  const b2 = row(daylight, '2027-08-12');
  assert.deepEqual([hmRound(b2[2]), hmRound(b2[3])], ['6:06', '20:34'], 'B.2: 6:06 am (the doc prints 6:07: doubt D1) and 8:34 pm');
});

test("GAME_DESIGN 7.2's daylight table against the file: a minute late on 8 of its 15 cells, each listed in the report as doubt D8", () => {
  // 7.2's table, read from the doc (never edited here): date, sunrise, sunset, civil dusk.
  const doc = readFileSync(join(ROOT, 'design', 'GAME_DESIGN.md'), 'utf8');
  const sec = doc.slice(doc.indexOf('### 7.2 Daylight and darkness'), doc.indexOf('### 7.3'));
  const rows = [...sec.matchAll(/^\| (\w{3}) (\d+) \| (\d+:\d\d) \| (\d+:\d\d) pm \| (\d+:\d\d) pm \|$/gm)];
  assert.equal(rows.length, 5);
  const MON = { Jul: 7, Aug: 8, Sep: 9, Oct: 10 };
  const pm = (hm) => hm.replace(/^(\d+)/, (h) => String(Number(h) + 12));
  const late = [];
  for (const [, mon, day, rise, set, dusk] of rows) {
    const iso = `2027-${String(MON[mon]).padStart(2, '0')}-${day.padStart(2, '0')}`;
    const r = row(daylight, iso);
    const got = [hmRound(r[2]), hmRound(r[3]), hmRound(r[4])];
    [rise, pm(set), pm(dusk)].forEach((want, k) => {
      if (want === got[k]) return;
      const [wh, wm] = want.split(':').map(Number);
      const [gh, gm] = got[k].split(':').map(Number);
      assert.equal(wh * 60 + wm - (gh * 60 + gm), 1, `${iso} ${['sunrise', 'sunset', 'dusk'][k]}: the doc ${want}, the file ${got[k]}`);
      late.push(`${mon} ${day} ${['sunrise', 'sunset', 'dusk'][k]}`);
    });
  }
  assert.deepEqual(late, ['Jul 15 sunset', 'Aug 15 sunrise', 'Aug 15 sunset', 'Sep 15 sunrise', 'Oct 1 sunrise', 'Oct 1 dusk', 'Oct 15 sunset', 'Oct 15 dusk']);
  const report = readFileSync(join(ROOT, 'content', 'park', 'ingest_report.md'), 'utf8');
  const d8 = report.split('\n').find((l) => l.startsWith('- D8. '));
  assert.ok(d8 && /7\.2/.test(d8) && /8 of its 15 cells/.test(d8), "the report's Doubts carry it");
  for (const cell of ['9:11 (data 9:10)', '6:11 and sunset 8:29 (6:10, 8:28)', '6:53 (6:52)', '7:15 and civil dusk 7:26 (7:14, 7:25)', '6:28 and civil dusk 6:59 (6:27, 6:58)']) assert.ok(d8.includes(cell), cell);
});

test('Pacific time by the US rule since 2007: the daylight-time dates 2026 to 2030, the offset at 3 am local', () => {
  const want = { 2026: ['2026-03-08', '2026-11-01'], 2027: ['2027-03-14', '2027-11-07'], 2028: ['2028-03-12', '2028-11-05'], 2029: ['2029-03-11', '2029-11-04'], 2030: ['2030-03-10', '2030-11-03'] };
  for (const [y, [a, b]] of Object.entries(want)) {
    assert.deepEqual(dstDates(Number(y)).map(isoOf), [a, b], y);
    assert.equal(pacificOffset(dayOf(a)), -7, `${a} is daylight time from 3 am`);
    assert.equal(pacificOffset(dayOf(a) - 1), -8);
    assert.equal(pacificOffset(dayOf(b)), -8, `${b} is standard time from 3 am`);
    assert.equal(pacificOffset(dayOf(b) - 1), -7);
  }
  assert.equal(isoOf(dayOf('2028-02-29')), '2028-02-29');
  assert.equal(dayOf('1970-01-01'), 0);
});

test('every row: dawn before sunrise before sunset before dusk, and every day covered', () => {
  for (const t of [quinault, daylight]) {
    assert.equal(t.days.length, dayOf(t.to) - dayOf(t.from) + 1, `${t.from} to ${t.to}`);
    t.days.forEach((r, i) => {
      assert.ok(r.every(Number.isInteger));
      assert.ok(r[1] < r[2] && r[2] < r[3] && r[3] < r[4], `${isoOf(dayOf(t.from) + i)}: ${r.join(', ')}`);
      assert.equal(r[0], pacificOffset(dayOf(t.from) + i));
    });
  }
  assert.deepEqual([quinault.from, quinault.to], ['2026-01-01', '2030-12-31']);
  assert.equal(quinault.days.length, 1826);
  assert.deepEqual([daylight.from, daylight.to], ['2026-10-07', '2027-10-31'], 'the conditions date through the window (4.7)');
  // The floor: the recorded second is before the crossing, the next one at or past it.
  const t0 = instantOf(quinault.from, 0, quinault.days[0], 2);
  assert.ok(zenith(t0, 47.47, -123.86) > 90.833 && zenith(t0 + 1, 47.47, -123.86) <= 90.833);
});

test('the generated tables equal a fresh run', () => {
  const { ctx } = readInputs(ROOT);
  ctx.park = { statuses: [] };
  conditions(ctx);
  const out = sunGenerator(ctx);
  assert.deepEqual(out.entries, []);
  assert.equal(stableJson(out.files[QUINAULT_FILE]), readFileSync(join(ROOT, QUINAULT_FILE), 'utf8'));
  assert.equal(stableJson(out.files[DAYLIGHT_FILE]), readFileSync(join(ROOT, DAYLIGHT_FILE), 'utf8'));
});

test("the cabin's table is extended a year before it runs out (the build commit's date, from git; never the clock)", (t) => {
  let date;
  try {
    date = execFileSync('git', ['log', '-1', '--format=%cs', 'HEAD'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    t.skip('not a git checkout');
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    t.skip('no commit date');
    return;
  }
  const yearAhead = `${Number(date.slice(0, 4)) + 1}${date.slice(4)}`;
  assert.ok(yearAhead < QUINAULT_TO, `the commit is dated ${date}: extend content/data/quinault_sun.json past ${QUINAULT_TO} (tools/sun.mjs QUINAULT_TO)`);
});
