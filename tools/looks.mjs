// The pictures' words by part (BUILD_PLAN S6; GAME_DESIGN 11.8, 11.9,
// 12.1): the Look hotspots by kind (content/art/hotspots.json) and the alt
// text by part (web/js/gfx/alt.js), read the same way by the three tools
// that need them, so none of them can disagree about what a picture says:
//
//   lint P15 (tools/lint.mjs)   every hotspot kind of a drawable place is in
//                               hotspots.json; every looked kind has its
//                               Look and its spoken name; every place's
//                               alt parts have their lines, at every hour;
//                               a place's own Look names a place that has
//                               the kind
//   lint T11 (tools/textlint.mjs)  the lines the pictures name count as used
//                               (code that shows them ends its line
//                               // t-ids: @art)
//   the build (tools/build.mjs) ships {kind: looked} beside the recipes
//
// From S7 the cabin is one more picture (cabinParts): its Look and silent
// places' kinds (content/home/cabin.json places) and its alt parts at every
// hour, sky and moon (gfx/cabin.js cabinAlt), so P15 holds them to the same
// rules (P17, tools/lint.mjs, checks the rest of the cabin's map).
//
// The lines: look.<kind> (a Look, the hotspot's kind's), look.<kind>.<place>
// (one place's own Look, when it has one), look.name.<kind> (the Look
// button's spoken name), and alt.scene.*, alt.base.*, alt.skyline.*,
// alt.sprite.* and alt.hour.* (gfx/alt.js). Built to scale (decision 69):
// a new place, base, skyline or stamp is checked by what it draws, and a
// DEM skyline brings one Z and one alt line, never one line per place.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadArt, loadCabin } from './pics.mjs';
import { validate } from './schema.mjs';
import { compose, drawable, TRAIL_SPRITES, HOURS } from '../web/js/gfx/compose.js';
import { altParts } from '../web/js/gfx/alt.js';
import { cabinAlt, CABIN_HOURS, SKIES } from '../web/js/gfx/cabin.js';

export const HOTSPOTS_FILE = 'content/art/hotspots.json';
export const HOTSPOTS_SCHEMA = 'schemas/hotspots.schema.json';
/** A Look's line, a place's own Look, and a Look button's spoken name (web/js/ui/look.js reads the same shapes). */
export const lookId = (/** @type {string} */ kind) => `look.${kind}`;
export const placeLookId = (/** @type {string} */ kind, /** @type {string} */ place) => `look.${kind}.${place}`;
export const nameId = (/** @type {string} */ kind) => `look.name.${kind}`;
const KIND_RE = /^[a-z][a-z0-9_]*$/;
/** A kind may not be called this: look.name.* are the spoken names. */
export const RESERVED_KINDS = Object.freeze(['name']);

/**
 * content/art/hotspots.json, validated against its schema. hotspots is
 * null when the file is missing or won't parse; errors are the schema's
 * ({path, msg}), reported as J01.
 * @param {string} [root]
 * @returns {{hotspots: {kinds: Record<string, {look: boolean, why?: string, doc?: string}>} | null, src: string, errors: {path: string, msg: string}[]}}
 */
export function loadHotspots(root = ROOT) {
  const path = join(root, HOTSPOTS_FILE);
  if (!existsSync(path)) return { hotspots: null, src: '', errors: [] };
  const src = readFileSync(path, 'utf8');
  let hotspots;
  try {
    hotspots = JSON.parse(src);
  } catch (e) {
    return { hotspots: null, src, errors: [{ path: '', msg: `not JSON: ${/** @type {Error} */ (e).message}` }] };
  }
  // A partial tree (a test's copy of web/ and content/) reads the repo's own schema.
  const schemaPath = existsSync(join(root, HOTSPOTS_SCHEMA)) ? join(root, HOTSPOTS_SCHEMA) : join(ROOT, HOTSPOTS_SCHEMA);
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  return { hotspots, src, errors: validate(schema, hotspots).errors };
}

/**
 * The looked kinds as the build ships them: {kind: looked}.
 * @param {{kinds: Record<string, {look: boolean}>} | null} hotspots
 * @returns {Record<string, boolean>}
 */
export function shippedHotspots(hotspots) {
  /** @type {Record<string, boolean>} */
  const out = {};
  for (const k of Object.keys((hotspots && hotspots.kinds) || {}).sort()) out[k] = hotspots.kinds[k].look === true;
  return out;
}

/**
 * Every drawable place's parts: the hotspot kinds its trail picture carries
 * (with the trail's hiker), and its alt parts at each hour.
 * @param {any} art loadArt()'s: pics, stamps and recipes
 * @returns {{place: string, kinds: string[], alt: Record<string, string[]>}[]}
 */
export function placeParts(art) {
  if (!art || !art.recipes) return [];
  const out = [];
  for (const place of Object.keys(art.recipes.places || {}).sort()) {
    if (!drawable(place, art)) continue;
    const c = compose(place, art, { hour: 'day', sprites: TRAIL_SPRITES });
    /** @type {Record<string, string[]>} */
    const alt = {};
    for (const hour of HOURS) alt[hour] = altParts(place, art, { hour, sprites: TRAIL_SPRITES });
    out.push({ place, kinds: [...new Set(c.hotspots.map((h) => h.id))], alt });
  }
  return out;
}

/**
 * The cabin as a picture's parts (S7): the kinds of its Look and silent
 * places (its other places are the rail's, with their own lines: P17), and
 * its alt parts by hour, every sky, fog and moon folded in.
 * @param {any} cabin content/home/cabin.json, or null
 * @returns {{place: string, kinds: string[], alt: Record<string, string[]>}[]}
 */
export function cabinParts(cabin) {
  if (!cabin || !cabin.places) return [];
  const kinds = Object.entries(cabin.places)
    .filter(([, p]) => /** @type {any} */ (p).kind === 'look' || /** @type {any} */ (p).kind === 'silent')
    .map(([id]) => id);
  /** @type {Record<string, string[]>} */
  const alt = {};
  for (const hour of CABIN_HOURS) {
    const ids = new Set();
    for (const sky of SKIES) for (const fog of [false, true]) for (const moonShown of [false, true]) for (const id of cabinAlt({ hour, sky, fog, moonShown })) ids.add(id);
    alt[hour] = [...ids];
  }
  return [{ place: 'cabin', kinds, alt }];
}

/**
 * The lines the pictures name, for T11: every drawable place's alt parts
 * at every hour, and each looked kind's Look and spoken name where a place
 * has the kind, with a place's own Look where the words have one.
 * @param {ReturnType<typeof placeParts>} parts
 * @param {Record<string, boolean>} looked shippedHotspots()'s
 * @param {(id: string) => boolean} defined
 * @returns {Set<string>}
 */
export function artLineIds(parts, looked, defined) {
  const out = new Set();
  for (const p of parts) {
    for (const ids of Object.values(p.alt)) for (const id of ids) out.add(id);
    for (const k of p.kinds) {
      if (looked[k] !== true) continue;
      out.add(lookId(k));
      out.add(nameId(k));
      if (defined(placeLookId(k, p.place))) out.add(placeLookId(k, p.place));
    }
  }
  return out;
}

/**
 * The art's line ids T11 counts as used, read from the repo.
 * @param {string} root
 * @param {(id: string) => boolean} defined
 */
export function artUses(root, defined) {
  const art = loadArt(join(root, 'content', 'art', 'pics'));
  const { hotspots } = loadHotspots(root);
  const cabin = loadCabin(join(root, 'content', 'home', 'cabin.json'));
  return artLineIds([...placeParts(art), ...cabinParts(cabin)], shippedHotspots(hotspots), defined);
}

/**
 * P15 (BUILD_PLAN S6): the pictures' words are all there.
 * @param {object} o
 * @param {ReturnType<typeof placeParts>} o.parts
 * @param {ReturnType<typeof loadHotspots>} o.file
 * @param {(id: string) => boolean} o.defined a line is in content/text
 * @param {Iterable<string>} o.ids every line id (for the places' own Looks)
 * @returns {{file: string, line: number, code: string, msg: string, level?: 'warn'}[]}
 */
export function lintLooks({ parts, file, defined, ids }) {
  /** @type {{file: string, line: number, code: string, msg: string, level?: 'warn'}[]} */
  const out = [];
  const add = (/** @type {string} */ msg, /** @type {'warn' | undefined} */ level = undefined) => out.push({ file: HOTSPOTS_FILE, line: 1, code: 'P15', msg, ...(level ? { level } : {}) });
  for (const e of file.errors) out.push({ file: HOTSPOTS_FILE, line: 1, code: 'J01', msg: `${e.path || '(file)'} ${e.msg} (${HOTSPOTS_SCHEMA})` });
  if (!file.hotspots) {
    if (parts.some((p) => p.kinds.length)) add(`no ${HOTSPOTS_FILE}: the pictures' hotspots have no kinds to look at`);
    return out;
  }
  const kinds = file.hotspots.kinds || {};
  const lineOf = (/** @type {string} */ k) => {
    const at = file.src.indexOf(`"${k}"`);
    return at < 0 ? 1 : file.src.slice(0, at).split('\n').length;
  };
  for (const k of Object.keys(kinds)) {
    if (!KIND_RE.test(k) || RESERVED_KINDS.includes(k)) out.push({ file: HOTSPOTS_FILE, line: lineOf(k), code: 'P15', msg: `"${k}" can't be a hotspot kind (lowercase, digits and underscores, and never ${RESERVED_KINDS.join(' or ')})` });
  }
  /** @type {Map<string, string[]>} kind -> the places that carry it */
  const carried = new Map();
  /** @type {Map<string, Set<string>>} a missing alt line -> the places it describes */
  const unsaid = new Map();
  for (const p of parts) {
    for (const k of p.kinds) {
      if (!carried.has(k)) carried.set(k, []);
      /** @type {string[]} */ (carried.get(k)).push(p.place);
    }
    for (const list of Object.values(p.alt)) {
      for (const id of list) {
        if (defined(id)) continue;
        if (!unsaid.has(id)) unsaid.set(id, new Set());
        /** @type {Set<string>} */ (unsaid.get(id)).add(p.place);
      }
    }
  }
  const few = (/** @type {Iterable<string>} */ list) => {
    const a = [...list];
    return a.length > 3 ? `${a.slice(0, 3).join(', ')} and ${a.length - 3} more` : a.join(', ');
  };
  for (const [k, places] of carried) {
    if (!Object.prototype.hasOwnProperty.call(kinds, k)) add(`the "${k}" hotspot (in ${few(places)}) isn't in ${HOTSPOTS_FILE}: add it, looked (with look.${k} and look.name.${k}) or silent (with its why)`);
  }
  for (const [id, places] of unsaid) add(`${id} isn't a line, and it describes ${places.size} drawable place${places.size === 1 ? '' : 's'} (${few(places)}): add it to content/text/en/alt.json, one whole sentence`);
  for (const [k, v] of Object.entries(kinds)) {
    if (!carried.has(k)) {
      add(`kind "${k}" is in no drawable place's picture`, 'warn');
      continue;
    }
    if (v.look !== true) continue;
    for (const id of [lookId(k), nameId(k)]) if (!defined(id)) out.push({ file: HOTSPOTS_FILE, line: lineOf(k), code: 'P15', msg: `kind "${k}" is looked, so it needs the line ${id} (content/text/en/look.json)` });
  }
  // A place's own Look names a drawable place whose picture has that looked kind.
  const placeOf = new Map(parts.map((p) => [p.place, p]));
  for (const id of ids) {
    const m = /^look\.([a-z][a-z0-9_]*)\.([a-z][a-z0-9_]*)$/.exec(id);
    if (!m || m[1] === 'name') continue;
    const [, k, place] = m;
    const p = placeOf.get(place);
    if (!p || !p.kinds.includes(k) || !(kinds[k] && kinds[k].look === true)) add(`${id} is a place's own Look, but ${p ? `${place}'s picture has no looked "${k}"` : `${place} is no drawable place`}`);
  }
  return out;
}
