// Numbers for the page (BUILD_PLAN 2.2): ASCII digits, a comma every three
// digits, a point before tenths, never the phone's locale, so a caption
// reads the same on every phone and in Node. A number with its unit comes
// from its format, a fmt.* token you approve once (content/text/en/fmt.json;
// GAME_DESIGN 18.3, E.12, decision 64): feet() and mileMarker() hand it over
// as a ref ({id, vars}) with the number filled, for t() or tx(), and
// web/js/text.js shows a format's spaces as no-break spaces, so 4,900 ft or
// mi 6.9 never breaks across a row. S5 has two formats; S6 adds a share in
// percent (and one under the least a tag shows), a distance, a clock time
// in the morning and the afternoon, and a span of minutes, for the odds,
// the Why sheet and an outcome's pencil rows; dates and the rest join with
// their sessions. The engine hands over numbers (whole points, exact
// fractions, whole seconds) and these word them: the engine never formats.
//
// Pure: no DOM, no clock, no locale.

/**
 * A whole number with a comma every three digits: 3530 -> "3,530",
 * -1200 -> "-1,200". A fraction is rounded to the nearest whole first.
 * @param {number} n
 */
export function fmtInt(n) {
  if (!Number.isFinite(n)) throw new Error(`fmt: ${n} is not a number`);
  const r = Math.round(n);
  const digits = String(Math.abs(r));
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += ',';
    out += digits[i];
  }
  return r < 0 ? `-${out}` : out;
}

/**
 * Tenths as a number with one decimal: 37 -> "3.7", 104 -> "10.4",
 * 0 -> "0.0" (a mile on the strip, from the engine's mi10).
 * @param {number} tenths an integer
 */
export function fmtTenths(tenths) {
  if (!Number.isInteger(tenths)) throw new Error(`fmt: ${tenths} is not a whole number of tenths`);
  const sign = tenths < 0 ? '-' : '';
  const a = Math.abs(tenths);
  return `${sign}${fmtInt(Math.floor(a / 10))}.${a % 10}`;
}

/** @typedef {{id: string, vars: Record<string, string>}} FormatRef a format, as a ref with its number filled */

/**
 * A height in feet, as its format words it (fmt.ft, "{ft} ft"): the
 * number with a comma every three digits. The trail caption's elevation:
 * 4900 -> 4,900 ft.
 * @param {number} ft
 * @returns {FormatRef}
 */
export function feet(ft) {
  return { id: 'fmt.ft', vars: { ft: fmtInt(ft) } };
}

/**
 * Today's mile as the strip's marker words it (fmt.mile_marker, "mi {mi}"),
 * from the engine's tenths: 69 -> mi 6.9.
 * @param {number} tenths an integer
 * @returns {FormatRef}
 */
export function mileMarker(tenths) {
  return { id: 'fmt.mile_marker', vars: { mi: fmtTenths(tenths) } };
}

/**
 * a / b rounded up, for whole numbers a >= 0 and b > 0, exactly.
 * @param {number} a
 * @param {number} b
 */
const cdiv = (a, b) => (a + b - 1 - ((a + b - 1) % b)) / b;

/**
 * Whole points as a percentage (fmt.pct): an odds tag's made it, a fail
 * share. 65 -> 65%.
 * @param {number} n a whole number
 * @returns {FormatRef}
 */
export function pct(n) {
  if (!Number.isInteger(n)) throw new Error(`fmt: ${n} is not a whole number of points`);
  return { id: 'fmt.pct', vars: { pct: fmtInt(n) } };
}

/**
 * A share as a tag shows it (engine/odds.js shownOf: tenths of a percent,
 * already rounded up, or under 0.1%): one decimal under 10%, a whole number
 * from 10% (8.1). {tenths: 7} -> 0.7%; {tenths: 160} -> 16%; {under} ->
 * <0.1%.
 * @param {{tenths: number} | {under: true}} shown
 * @returns {FormatRef}
 */
export function share(shown) {
  if ('under' in shown) return { id: 'fmt.pct_under', vars: { pct: '0.1' } };
  const t = shown.tenths;
  return { id: 'fmt.pct', vars: { pct: t >= 100 ? fmtInt(t / 10) : fmtTenths(t) } };
}

/**
 * An exact share in percent, a fraction, as the Why sheet's arithmetic
 * shows it (8.8: 0.21%, 1.89%, 0.675%): two decimals at least, three at
 * most, rounded up past them, toward danger.
 * @param {{num: number, den: number}} f
 * @returns {FormatRef}
 */
export function exactPct({ num, den }) {
  const th = cdiv(num * 1000, den);
  const whole = Math.floor(th / 1000);
  const rest = String(th % 1000).padStart(3, '0');
  return { id: 'fmt.pct', vars: { pct: `${fmtInt(whole)}.${th % 10 === 0 ? rest.slice(0, 2) : rest}` } };
}

/**
 * A fraction of the whole as a percentage: a whole number when it is one,
 * else one decimal, rounded up (the fatal band's share of the fails: 1 ->
 * 100%; 2/100 -> 2%).
 * @param {{num: number, den: number}} f
 * @returns {FormatRef}
 */
export function partPct({ num, den }) {
  const tenths = cdiv(num * 1000, den);
  return { id: 'fmt.pct', vars: { pct: tenths % 10 === 0 ? fmtInt(tenths / 10) : fmtTenths(tenths) } };
}

/**
 * A death roll in permille as a percentage (9.5): 20 -> 2%, 500 -> 50%,
 * 15 -> 1.5%.
 * @param {number} permille a whole number
 * @returns {FormatRef}
 */
export function permillePct(permille) {
  return partPct({ num: permille, den: 1000 });
}

/**
 * A clock time to the nearest minute, from whole seconds since midnight
 * (fmt.clock_am, fmt.clock_pm): 59188 -> 4:26 pm; noon is 12:00 pm,
 * midnight 12:00 am.
 * @param {number} s whole seconds, 0 to 86,399
 * @returns {FormatRef}
 */
export function clock(s) {
  if (!Number.isInteger(s) || s < 0) throw new Error(`fmt: ${s} is not a time of day in whole seconds`);
  const m = Math.floor((s + 30) / 60) % 1440;
  const h24 = Math.floor(m / 60);
  const h = h24 % 12 || 12;
  return { id: h24 < 12 ? 'fmt.clock_am' : 'fmt.clock_pm', vars: { h: String(h), mm: String(m % 60).padStart(2, '0') } };
}

/**
 * A distance in miles from the engine's tenths (fmt.mi): 34 -> 3.4 mi.
 * @param {number} tenths an integer
 * @returns {FormatRef}
 */
export function miles(tenths) {
  return { id: 'fmt.mi', vars: { mi: fmtTenths(tenths) } };
}

/**
 * A span of whole seconds in minutes, to the nearest one (fmt.min): 1200 ->
 * 20 min.
 * @param {number} s
 * @returns {FormatRef}
 */
export function minutes(s) {
  return { id: 'fmt.min', vars: { m: fmtInt(Math.round(s / 60)) } };
}

/**
 * A Why-sheet row's value: a base as it is, a modifier with its sign (12.11:
 * +2, -5). Numbers, not words.
 * @param {number} n
 * @param {boolean} signed
 */
export function rowValue(n, signed) {
  return signed && n > 0 ? `+${fmtInt(n)}` : fmtInt(n);
}
