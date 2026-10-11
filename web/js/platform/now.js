// The cabin's clock (BUILD_PLAN S7, 11.2; GAME_DESIGN 2.2, 11.4): the
// lake's own hour, the date's sky and the real moon, in the UI only.
//
// pacificNow() is the one clock read for the cabin: Intl's
// America/Los_Angeles time zone, for numbers only (the words are fmt.*'s),
// so a phone in New York at 10 pm sees the cabin at 7 pm. Everything else
// here is pure, so Node pins it for every day of the sun table:
//
//   sunRow    the sun table's row for a date (content/data/quinault_sun.json,
//             shipped as rules.sun with the home's screen), or outside 2026
//             to 2030 the same month and day in the nearest year it has,
//             its times moved to the lake's own UTC offset that day (the
//             borrowed year's daylight time may begin or end on another
//             date)
//   hourAt    night, blue hour, dawn, day or dusk, from the row and the
//             cabin's hours rule (content/home/cabin.json hours)
//   skyOn     the date's sky, the same on every phone that date: one draw
//             a date from the engine's art seed on the weather stream,
//             keyed by the date (as compose.js draws), ranks the month's
//             dates, and they take the month's climatology (rules.climate)
//             in that order: rain by the cabin zone's station's wet days,
//             cloudy by the weather chain's unsettled share of the rest,
//             clear otherwise; and on a dry day a second draw for morning
//             fog, flagged estimates until T2's forecast
//   moonOn    the moon's age and its phase in eighths by integer
//             arithmetic from a fixed new moon (lead call 54), and when it
//             is up by a plain rule (it rises at 6:00 Pacific plus 48
//             minutes a day of age and is up for 12 hours)
//   sceneAt   all of that for one moment: what the cabin composes, and the
//             next moment it changes (the UI's one timer)
//
// No engine module imports this (the engine never reads a clock: E02).

import { draw, ART_SEED } from '../engine/rng.js';

/** The lake's time zone (an IANA name, never shown). */
export const TIME_ZONE = 'America/Los_Angeles'; // t-ok: an IANA time zone name, never shown
/** The locale Intl formats the numbers in (never shown: only its digits are read). */
const NUMBER_LOCALE = 'en-US'; // t-ok: a locale tag for formatToParts' digits, never shown
/** A day, in seconds and in milliseconds. */
export const DAY_S = 86400;
const DAY_MS = DAY_S * 1000;
/** The hours the cabin shows, in the day's order from midnight. */
export const HOUR_ORDER = Object.freeze(['night', 'blue', 'dawn', 'day', 'dusk', 'blue', 'night']);

/**
 * @typedef {{y: number, m: number, d: number}} Ymd a civil date (m 1 to 12)
 * @typedef {Ymd & {dow: number, secs: number, ms: number, off?: number}} PacificNow the
 *   lake's date, its weekday (0 Sunday), seconds since its local midnight,
 *   the instant (epoch ms) and the lake's UTC offset then, in whole hours
 *   (-8 or -7; pacificNow always gives it)
 * @typedef {{hour: string, evening: boolean}} CabinHour
 * @typedef {{sky: string, fog: boolean}} DateSky fog: a foggy morning on this date
 * @typedef {{age: number, phase: number, rise: number, set: number, up: (secs: number) => boolean}} Moon
 *   age: hundred-thousandths of a day since the last new moon; phase: eighths, 0
 *   (new) to 7, rounded to the nearest; rise and set: seconds since local
 *   midnight
 */

/**
 * Pure: days since 1970-01-01 of a civil date (Date.UTC's arithmetic; no
 * clock is read).
 * @param {Ymd} ymd
 */
export function epochDay({ y, m, d }) {
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

/**
 * Pure: the civil date of a day number (days since 1970-01-01).
 * @param {number} n
 * @returns {Ymd}
 */
export function dateOfDay(n) {
  const t = new Date(n * DAY_MS);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** @param {number} y */
export const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/**
 * Pure: the days in a month.
 * @param {number} y
 * @param {number} m 1 to 12
 */
export function daysInMonth(y, m) {
  return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}

/**
 * The lake's date and time now (or at a given instant): the cabin's one
 * clock read. Numbers only, from Intl.DateTimeFormat's parts.
 * @param {Date} [date]
 * @returns {PacificNow}
 */
export function pacificNow(date = new Date()) {
  const fmt = new Intl.DateTimeFormat(NUMBER_LOCALE, {
    timeZone: TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });
  /** @type {Record<string, number>} */
  const n = {};
  for (const p of fmt.formatToParts(date)) if (p.type !== 'literal') n[p.type] = parseInt(p.value, 10);
  // An engine that still says 24 for midnight under h23 means 0.
  const h = n.hour === 24 ? 0 : n.hour;
  const ymd = { y: n.year, m: n.month, d: n.day };
  const secs = h * 3600 + n.minute * 60 + n.second;
  const ms = date.getTime();
  // The offset: the wall clock's reading as if it were UTC, less the instant (whole seconds), in hours.
  const off = Math.round((epochDay(ymd) * DAY_S + secs - Math.floor(ms / 1000)) / 3600);
  return { ...ymd, dow: (((epochDay(ymd) + 4) % 7) + 7) % 7, secs, ms, off };
}

/**
 * Pure: the sun table's row for a date: [utc_offset_h, civil_dawn_s,
 * sunrise_s, sunset_s, civil_dusk_s], seconds since local midnight.
 * Outside the table's years, the same month and day in the nearest year it
 * has (Feb 29 is Feb 28 in a year without one); that row's times are its
 * own year's wall clock, so given the lake's offset on the date (off, in
 * hours: pacificNow's), they move by the difference, and the row carries
 * that offset (2031-03-09 is daylight time, 2030-03-09 standard: the
 * borrowed sunset at 18:12 is 19:12 on 2031's clock).
 * @param {{from: string, days: number[][]}} sun rules.sun
 * @param {Ymd & {off?: number}} ymd
 * @returns {number[]}
 */
export function sunRow(sun, { y, m, d, off }) {
  const [fy, fm, fd] = sun.from.split('-').map(Number);
  const first = epochDay({ y: fy, m: fm, d: fd });
  const last = dateOfDay(first + sun.days.length - 1);
  let at = { y, m, d };
  if (y < fy || y > last.y) {
    const ny = y < fy ? fy : last.y;
    at = { y: ny, m, d: m === 2 && d === 29 && !isLeap(ny) ? 28 : d };
  }
  const k = Math.min(sun.days.length - 1, Math.max(0, epochDay(at) - first));
  const row = sun.days[k];
  if (at.y === y || typeof off !== 'number' || !Number.isInteger(off) || off === row[0]) return row;
  const shift = (off - row[0]) * 3600;
  return [off, ...row.slice(1).map((s) => s + shift)];
}

/**
 * Pure: the moments a day's hours change, in seconds since local midnight
 * (the cabin's hours rule, cabin.json hours; GAME_DESIGN 11.4): with A =
 * sunrise - civil dawn and B = civil dusk - sunset, the morning's blue
 * hour from civil dawn - A x outside to civil dawn + A x inside, dawn to
 * sunrise + the margin, day, dusk from sunset - the margin, the evening's
 * blue hour from sunset + B x inside, night from civil dusk + B x outside.
 * The shares are per mille, so the rule stays integer.
 * @param {number[]} row sunRow()'s
 * @param {{sun_margin_s: number, blue_outside_permille: number, blue_inside_permille: number}} rule
 * @returns {{blue: number, dawn: number, day: number, dusk: number, blue_pm: number, night: number}}
 */
export function hourBounds(row, rule) {
  const [, cdawn, rise, set, cdusk] = row;
  const a = rise - cdawn;
  const b = cdusk - set;
  const part = (/** @type {number} */ s, /** @type {number} */ pm) => Math.floor((s * pm) / 1000);
  return {
    blue: cdawn - part(a, rule.blue_outside_permille),
    dawn: cdawn + part(a, rule.blue_inside_permille),
    day: rise + rule.sun_margin_s,
    dusk: set - rule.sun_margin_s,
    blue_pm: set + part(b, rule.blue_inside_permille),
    night: cdusk + part(b, rule.blue_outside_permille),
  };
}

/**
 * Pure: the cabin's hour at a moment of the day. Dawn draws with the dusk
 * table (the peak goes pink in the morning too); the hour keeps 'dawn' for
 * the alt text, the lights and the dev control. evening: the moment is
 * after midday (the evening's blue hour lights the embers; the morning's
 * doesn't).
 * @param {number[]} row
 * @param {number} secs seconds since local midnight
 * @param {Parameters<typeof hourBounds>[1]} rule
 * @returns {CabinHour}
 */
export function hourAt(row, secs, rule) {
  const b = hourBounds(row, rule);
  const evening = secs >= Math.floor((row[2] + row[3]) / 2);
  let hour = 'night';
  if (secs >= b.night) hour = 'night';
  else if (secs >= b.blue_pm) hour = 'blue';
  else if (secs >= b.dusk) hour = 'dusk';
  else if (secs >= b.day) hour = 'day';
  else if (secs >= b.dawn) hour = 'dawn';
  else if (secs >= b.blue) hour = 'blue';
  return { hour, evening };
}

/**
 * Pure: the date's sky (BUILD_PLAN 11.2, 9.2), the same on every phone.
 * Each date has one draw from the engine's art seed on the weather stream,
 * keyed by the date; the month's dates in the order of their draws take
 * the month's skies by climatology's weights per mille (skyWeights): the
 * first rain's share of them rain, the next cloudy's share cloudy, the
 * rest clear. So the date's sky is a fixed shuffle, and every month's
 * shares are its climatology's to within a day (a draw per date against
 * the weights alone wanders 6 points off over the table's five years).
 * On a dry day a second draw against the month's fog odds (cabin.json
 * sky.fog_permille) makes a foggy morning. The cabin's season stays
 * summer (cabin_seasons): a winter date draws rain where a forecast would
 * say snow, until S37.
 * @param {Ymd} ymd
 * @param {any} climate rules.climate
 * @param {{zone?: string, fog_permille: {m: number, permille: number}[]}} knobs cabin.json sky
 * @returns {DateSky}
 */
export function skyOn({ y, m, d }, climate, knobs) {
  const { rain, cloudy } = skyWeights(m, climate, knobs, y);
  const days = daysInMonth(y, m);
  const order = [];
  for (let k = 1; k <= days; k++) order.push({ k, u: draw(ART_SEED, 'weather', 'cabin', y, m, k).u32() });
  order.sort((a, b) => a.u - b.u || a.k - b.k);
  const rank = order.findIndex((o) => o.k === d);
  const wet = Math.round((rain * days) / 1000);
  const grey = Math.round(((rain + cloudy) * days) / 1000);
  const sky = rank < wet ? 'rain' : rank < grey ? 'cloudy' : 'clear';
  const fog = sky !== 'rain' && draw(ART_SEED, 'weather', 'cabin_fog', y, m, d).int(1000) < fogPermille(m, knobs);
  return { sky, fog };
}

/**
 * Pure: a month's weights per mille: rain and cloudy (clear takes the rest).
 * @param {number} m 1 to 12
 * @param {any} climate rules.climate
 * @param {{zone?: string}} knobs cabin.json sky
 * @param {number} [y] the year (February's days)
 */
export function skyWeights(m, climate, knobs, y = 2026) {
  const zone = knobs.zone || climate.cabin.zone;
  const stations = climate.zones[zone].stations;
  const station = stations[Object.keys(stations).sort()[0]];
  const wet = station.months[String(m)].days_ge_0_01in;
  const rain = Math.min(1000, Math.round((wet * 1000) / daysInMonth(y, m)));
  const states = climate.chain.states;
  const p = climate.chain.months[String(m)].p;
  const fair = p[states.indexOf('fair')];
  const unsettled = p[states.indexOf('unsettled')];
  const cloudy = fair + unsettled > 0 ? Math.round(((1000 - rain) * unsettled) / (fair + unsettled)) : 0;
  return { rain, cloudy, clear: 1000 - rain - cloudy };
}

/**
 * The month's fog odds, per mille (flagged estimates).
 * @param {number} m
 * @param {{fog_permille: {m: number, permille: number}[]}} knobs
 */
export function fogPermille(m, knobs) {
  const row = knobs.fog_permille.find((r) => r.m === m);
  return row ? row.permille : 0;
}

/**
 * Pure: the moon at an instant (lead call 54): its age in
 * hundred-thousandths of a day since the fixed new moon, modulo the
 * synodic month (synodic_e5); its phase in
 * eighths (0 new, 4 full), to the nearest; and up(secs), the plain rule:
 * it rises at rise_min plus rise_per_day_min a day of age (Pacific) and is
 * up for up_min minutes.
 * @param {number} ms epoch ms
 * @param {{new_moon_ms: number, synodic_e5: number, rise_min: number, rise_per_day_min: number, up_min: number}} rule cabin.json moon
 * @returns {Moon}
 */
export function moonOn(ms, rule) {
  const syn = rule.synodic_e5;
  // Hundred-thousandths of a day: 864 ms each.
  const raw = Math.floor((ms - rule.new_moon_ms) / 864);
  const age = ((raw % syn) + syn) % syn;
  const phase = Math.floor((age * 8 + Math.floor(syn / 2)) / syn) % 8;
  const rise = (rule.rise_min * 60 + Math.floor((age * rule.rise_per_day_min * 60) / 100000)) % DAY_S;
  const up = (/** @type {number} */ secs) => (((secs - rise) % DAY_S) + DAY_S) % DAY_S < rule.up_min * 60;
  return { age, phase, rise, set: (rise + rule.up_min * 60) % DAY_S, up };
}

/**
 * @typedef {object} CabinScene what the cabin composes at a moment
 * @property {string} hour
 * @property {boolean} evening
 * @property {string} sky
 * @property {boolean} fog
 * @property {number} moon the phase drawn when it's up, else 0
 * @property {number} next the next moment the scene can change, in seconds
 *   since the same local midnight (an hour's change, the fog's end, the
 *   moon's rising or setting, or midnight, 86400)
 */

/**
 * Pure: the cabin's scene at a moment: the hour from the sun table, the
 * date's sky (fog only in the morning, from the morning's blue hour to
 * fog_until), the moon's phase when it's up (when real_moon is off, none),
 * and when to look again.
 * @param {PacificNow} now
 * @param {{sun: any, climate: any, cabin: any, realMoon?: boolean}} data rules.sun, rules.climate, art.cabin
 * @returns {CabinScene}
 */
export function sceneAt(now, { sun, climate, cabin, realMoon = true }) {
  const row = sunRow(sun, now);
  const { hour, evening } = hourAt(row, now.secs, cabin.hours);
  const b = hourBounds(row, cabin.hours);
  const day = skyOn(now, climate, cabin.sky);
  const fogUntil = cabin.sky.fog_until_s;
  const fog = day.fog && now.secs >= b.blue && now.secs < fogUntil;
  const m = moonOn(now.ms, cabin.moon);
  const moon = realMoon && m.phase > 0 && m.up(now.secs) ? m.phase : 0;
  const marks = [b.blue, b.dawn, b.day, b.dusk, b.blue_pm, b.night, DAY_S];
  if (realMoon) marks.push(m.rise, m.set);
  if (day.fog) marks.push(b.blue, fogUntil);
  const next = Math.min(...marks.filter((s) => s > now.secs));
  return { hour, evening, sky: day.sky, fog, moon, next };
}
