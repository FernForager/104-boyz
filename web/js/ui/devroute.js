// The dev routes' addresses (preview's debug mode; BUILD_PLAN S3 to S7b):
// one pure parser, so the game (ui/app.js devRoute, which opens the route's
// screen) and the title screen (ui/title.js skipsTitle, which steps aside
// for it) never disagree on which addresses are routes (S7b review: a
// malformed #lockbox skipped the title onto the autosave). It imports
// nothing, so the title screen reads it before the game has loaded.

/** The check view's address (ui/frame.js; the debug menu's Scenes sets it). */
export const SCENES_HASH = '#frame';
/** The first-launch dev routes (S7). */
export const FIRST_HASH = '#first';
export const GUESTBOOK_HASH = '#guestbook';
/** The hours #stop=...&hour= takes: a picture's (gfx/compose.js HOURS; 11.4). */
export const STOP_HOURS = Object.freeze(['day', 'dusk', 'blue', 'night']);
/** The cabin's dev hours and skies (#home&hour=&sky=, and the debug menu's controls: ui/cabin.js, ui/frame.js). */
export const DEV_HOURS = Object.freeze(['dawn', 'day', 'dusk', 'blue', 'night']);
export const DEV_SKIES = Object.freeze(['clear', 'cloudy', 'rain', 'fog']);

/**
 * @typedef {{stop?: {set: string, id: string}, hour?: string | null, home?: {hour: string | null, sky: string | null, moon: number | null}, first?: boolean, lockbox?: {q?: number, open?: number, ask?: string}, guestbook?: boolean, frame?: boolean}} DevRoute
 */

/**
 * Pure: the dev route an address's hash names, else null:
 * {stop: {set, id}, hour} for #stop=<set>.<stop>[&hour=<h>], {home: {hour,
 * sky, moon}} for #home[&hour=<h>][&sky=<s>][&moon=<0-7>] (S7; each null
 * when not given or not one the cabin knows), {first: true} for #first,
 * {lockbox: {q}} for #lockbox&q=<1-3>, {lockbox: {ask}} for
 * #lockbox&ask=<question id>, {lockbox: {open}} for #lockbox&open=<0|3>,
 * {guestbook: true} for #guestbook (S7), {frame: true} for #frame. Never
 * #map, which opens over whatever shows (ui/debug.js MAP_HASH).
 * @param {string} hash
 * @returns {DevRoute | null}
 */
export function parseDevRoute(hash) {
  const h = String(hash || '');
  if (h === SCENES_HASH) return { frame: true };
  if (h === FIRST_HASH) return { first: true };
  if (h === GUESTBOOK_HASH) return { guestbook: true };
  const ask = /^#lockbox&ask=([a-z][a-z0-9_]*)$/.exec(h);
  if (ask) return { lockbox: { ask: ask[1] } };
  const lb = /^#lockbox&(q|open)=([0-9])$/.exec(h);
  if (lb) {
    const v = Number(lb[2]);
    if (lb[1] === 'q' && v >= 1 && v <= 3) return { lockbox: { q: v } };
    if (lb[1] === 'open' && (v === 0 || v === 3)) return { lockbox: { open: v } };
    return null;
  }
  const home = /^#home((?:&[a-z]+=[a-z0-9]+)*)$/.exec(h);
  if (home) {
    /** @type {Record<string, string>} */
    const q = {};
    for (const part of home[1].split('&').filter(Boolean)) {
      const [k, v] = part.split('=');
      q[k] = v;
    }
    const moon = /^[0-7]$/.test(q.moon || '') ? Number(q.moon) : null;
    return { home: { hour: DEV_HOURS.includes(q.hour) ? q.hour : null, sky: DEV_SKIES.includes(q.sky) ? q.sky : null, moon } };
  }
  const m = /^#stop=([a-z][a-z0-9_]*)\.([a-z][a-z0-9_]*)(?:&hour=([a-z]+))?$/.exec(h);
  if (!m) return null;
  return { stop: { set: m[1], id: m[2] }, hour: m[3] && STOP_HOURS.includes(m[3]) ? m[3] : null };
}
