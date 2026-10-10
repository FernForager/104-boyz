// Numbers for the page (BUILD_PLAN 2.2): ASCII digits, a comma every three
// digits, a point before tenths, never the phone's locale, so a caption
// reads the same on every phone and in Node. A number with its unit comes
// from its format, a fmt.* token you approve once (content/text/en/fmt.json;
// GAME_DESIGN 18.3, E.12, decision 64): feet() and mileMarker() hand it over
// as a ref ({id, vars}) with the number filled, for t() or tx(), and
// web/js/text.js shows a format's spaces as no-break spaces, so 4,900 ft or
// mi 6.9 never breaks across a row. S5 has two formats; times, dates and the
// rest join with their sessions.
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
