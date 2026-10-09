// The scope file's registry and helpers (BUILD_PLAN 3.4, 3.6, 10.6; S4;
// GAME_DESIGN 3.6, 15).
//
// content/scope/m1a.json says what a milestone ships. Its shape is
// schemas/scope.schema.json (J01); this module holds what a schema can't:
//   SWITCHES  every shows-and-hides switch BUILD_PLAN 3.6 names: its kind
//             (on: a boolean; value: a string, a number or a list of ids;
//             flags: named booleans), any extra keys it carries, the session
//             that first reads it, and its doc. A switch in the file that
//             isn't here, or one here missing from the file, is R01.
//   SECTIONS  the data sections `ships` may name, each with the screen
//             whose session ships it (BUILD_PLAN S4: park with the map, the
//             quiz with the lockbox in S7, and so on).
// The switches are data in S4: their consumers arrive with the screens that
// show them, and read them through switchValue() at build (the engine gets
// them through rules.json when a screen ships them).

/**
 * @typedef {object} SwitchSpec
 * @property {'on' | 'value' | 'flags'} kind
 * @property {'string' | 'integer' | 'ids'} [value] a value switch's type
 * @property {string[]} [extra] keys it carries beside on or value
 * @property {string[]} [flags] a flags switch's booleans
 * @property {string} reads the session that first reads it
 * @property {string} doc
 */

/** @type {(kind: SwitchSpec['kind'], reads: string, doc: string, more?: Partial<SwitchSpec>) => SwitchSpec} */
const sw = (kind, reads, doc, more = {}) => ({ kind, reads, doc, ...more });

/**
 * The switches (BUILD_PLAN 3.6, plus the plan's own rows), frozen.
 * @type {Readonly<Record<string, SwitchSpec>>}
 */
export const SWITCHES = Object.freeze({
  wic_phone: sw('on', 'S7', 'BUILD_PLAN 3.6; GAME_DESIGN 4.3'),
  'drive_chip.huckleberry_skillet': sw('on', 'S15a', 'BUILD_PLAN 3.6'),
  'drive_chip.steaming_fern_lodge': sw('on', 'S15a', 'BUILD_PLAN 3.6'),
  'door.second_growth': sw('on', 'S11', 'BUILD_PLAN 3.6'),
  'door.boutique': sw('on', 'S11', 'BUILD_PLAN 3.6; decision 48'),
  'door.dish_pit': sw('on', 'S14b', 'BUILD_PLAN 3.6'),
  'door.bookstore': sw('on', 'S14b', 'BUILD_PLAN 3.6'),
  'door.drive_in': sw('on', 'S14b', 'BUILD_PLAN 3.6; Lead call 32'),
  beer_cooler: sw('on', 'S11', 'BUILD_PLAN 3.6; GAME_DESIGN 5.3', { extra: ['overnight_only'] }),
  bonfire_lily_weight: sw('value', 'S9', 'BUILD_PLAN 3.6', { value: 'integer' }),
  walk_out: sw('on', 'S15a', 'BUILD_PLAN 3.6'),
  trip_codes: sw('on', 'S15a', 'BUILD_PLAN 3.6'),
  gear_csv: sw('on', 'S12a', 'BUILD_PLAN 3.6, 11.4'),
  cabin_seasons: sw('value', 'S7', 'BUILD_PLAN 3.6', { value: 'ids' }),
  real_moon: sw('on', 'S7', 'BUILD_PLAN 3.6'),
  crew: sw('on', 'S7', 'BUILD_PLAN 3.6'),
  wool_blanket: sw('on', 'S11', 'BUILD_PLAN 3.6'),
  easter_eggs: sw('on', 'S7', 'BUILD_PLAN 3.6; decision 54'),
  chalkboard: sw('value', 'S7', 'BUILD_PLAN 3.6', { value: 'string' }),
  peak: sw('value', 'S7', 'BUILD_PLAN 3.6', { value: 'string' }),
  hike_it_again: sw('on', 'S15a', 'BUILD_PLAN 3.6, 8.3', { extra: ['cut_ladder'] }),
  wic_on_town_run: sw('value', 'S10', 'BUILD_PLAN 3.6; decision 40; Lead call 33', { value: 'string' }),
  money: sw('flags', 'S11', 'BUILD_PLAN 3.6; Lead call 29', { flags: ['wallet', 'basic_and_nice'] }),
  gentle: sw('value', 'S24a', 'BUILD_PLAN 3.6', { value: 'string' }),
  minigames: sw('value', 'S13', 'BUILD_PLAN 3.6', { value: 'ids' }),
  clam_shovel: sw('value', 'S7', 'BUILD_PLAN 3.6; decision 61', { value: 'string' }),
  settings: sw('value', 'S7', 'BUILD_PLAN 3.6', { value: 'ids' }),
  sound: sw('value', 'S22', 'BUILD_PLAN 3.6', { value: 'ids' }),
  last_chance_shelf: sw('on', 'S11', 'GAME_DESIGN 3.3, 5.3'),
});

/**
 * The data sections `ships` may name, each with the screen that ships it
 * and its session (BUILD_PLAN S4). Everything is compiled and linted on
 * every build; a section reaches a channel's rules.json only when one of
 * its ships screens is among the channel's screens.
 */
export const SECTIONS = Object.freeze({
  park: { screen: 'map', session: 'S4' },
  conditions: { screen: 'plan', session: 'S10' },
  permits: { screen: 'plan', session: 'S10' },
  daylight: { screen: 'trail', session: 'S8' },
  climate: { screen: 'home', session: 'S7' },
  sun: { screen: 'home', session: 'S7' },
  kits: { screen: 'town', session: 'S11' },
  quiz: { screen: 'lockbox', session: 'S7' },
  items: { screen: 'town', session: 'S11' },
  foods: { screen: 'town', session: 'S11' },
  stores: { screen: 'town', session: 'S11' },
  drives: { screen: 'drive', session: 'S15a' },
});

const own = (o, k) => o !== null && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);
const isId = (v) => typeof v === 'string' && /^[a-z][a-z0-9_]*$/.test(v);

/**
 * Does a section ship to a channel with these screens?
 * @param {any} scope the parsed scope file
 * @param {string} section
 * @param {string[]} screens the channel's screens
 */
export function ships(scope, section, screens) {
  const list = scope && own(scope.ships, section) ? scope.ships[section] : [];
  return Array.isArray(list) && list.some((s) => screens.includes(s));
}

/**
 * A switch's value: its value, or its on (a flags switch: the object of its
 * flags). Throws on a switch the registry doesn't know, so a typo in a
 * consumer can't read undefined.
 * @param {any} scope
 * @param {string} key
 */
export function switchValue(scope, key) {
  if (!own(SWITCHES, key)) throw new Error(`scope: no switch "${key}" in the registry (tools/scope.mjs)`);
  const s = scope && scope.switches && scope.switches[key];
  if (!s) throw new Error(`scope: the switch "${key}" is missing from the scope file`);
  const spec = SWITCHES[key];
  if (spec.kind === 'on') return s.on;
  if (spec.kind === 'value') return s.value;
  return Object.fromEntries((spec.flags || []).map((f) => [f, s[f]]));
}

/**
 * R01 over the scope file (pure): every switch against the registry (its
 * kind, its value's type, its extra keys and a doc), every registry switch
 * present; every ships key a known section, every section listed; the
 * first trip's never list inside the park's phone-only list; main's screens
 * among the screens.
 * @param {any} scope the parsed file
 * @returns {{path: string, msg: string}[]}
 */
export function checkScope(scope) {
  const out = [];
  const bad = (path, msg) => out.push({ path, msg });
  const switches = (scope && scope.switches) || {};
  for (const [key, s] of Object.entries(switches)) {
    const path = `switches.${key}`;
    if (!own(SWITCHES, key)) {
      bad(path, `"${key}" is not a switch the registry knows (tools/scope.mjs SWITCHES)`);
      continue;
    }
    const spec = SWITCHES[key];
    if (typeof s.doc !== 'string' || !s.doc.trim()) bad(path, 'needs its doc');
    const allowed = new Set(['doc', 'until', ...(spec.extra || [])]);
    if (spec.kind === 'on') {
      allowed.add('on');
      if (typeof s.on !== 'boolean') bad(path, 'is an on switch: needs "on": true or false');
    } else if (spec.kind === 'value') {
      allowed.add('value');
      const v = s.value;
      const ok = spec.value === 'string' ? isId(v) : spec.value === 'integer' ? Number.isInteger(v) : Array.isArray(v) && v.every(isId);
      if (!ok) bad(path, `is a value switch: its value is ${spec.value === 'ids' ? 'a list of ids' : `a${spec.value === 'integer' ? 'n integer' : 'n id'}`}`);
    } else {
      for (const f of spec.flags || []) {
        allowed.add(f);
        if (typeof s[f] !== 'boolean') bad(path, `needs "${f}": true or false`);
      }
    }
    for (const k of spec.extra || []) if (!own(s, k)) bad(path, `needs "${k}"`);
    for (const k of Object.keys(s)) if (!allowed.has(k)) bad(path, `has "${k}", which this switch doesn't take`);
  }
  for (const key of Object.keys(SWITCHES)) if (!own(switches, key)) bad('switches', `the switch "${key}" is missing (BUILD_PLAN 3.6)`);
  const shipsBlock = (scope && scope.ships) || {};
  for (const key of Object.keys(shipsBlock)) if (!own(SECTIONS, key)) bad(`ships.${key}`, `"${key}" is not a data section (tools/scope.mjs SECTIONS)`);
  for (const key of Object.keys(SECTIONS)) if (!own(shipsBlock, key)) bad('ships', `the section "${key}" is missing: list the screens it ships with, or []`);
  const screens = (scope && scope.screens) || [];
  for (const s of (scope && scope.main && scope.main.screens) || []) if (!screens.includes(s)) bad('main.screens', `"${s}" is not one of the screens`);
  const ft = scope && scope.first_trip;
  const park = scope && scope.park;
  if (ft && park) {
    for (const id of ft.never || []) if (!(park.phone_only_m1b || []).includes(id) && !(park.never || []).includes(id)) bad('first_trip.never', `"${id}" is not off the menu in park (phone_only_m1b or never)`);
    if (!(park.nodes || []).includes(ft.trailhead)) bad('first_trip.trailhead', `"${ft.trailhead}" is not one of the park's nodes`);
  }
  return out;
}
