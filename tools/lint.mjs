#!/usr/bin/env node
// The lint (BUILD_PLAN 4.8, 6.7, 10.5; GAME_DESIGN 11.8, F.3). RULES below is
// the registry: every rule F.3 and the plan name, active or with the session
// it lands in; `npm run lint -- --rules` prints it, and the summary line
// names the active codes. The active rules:
//
// Pictures (content/art/pics/**/*.pic):
//   P01 a command, color, point or pattern the format doesn't know
//   P02 a stamp that doesn't exist
//   P03 a point off the canvas (in a plate or scene; stamps draw around
//       their anchor, so their own points may be anywhere)
//   P04 a fill over 60% of a non-sky layer (usually an outline left open)
//   P05 stamps nested more than 4 deep
//   P06 a Look hotspot off the canvas
//   P07 bonfire gold (7, or the glow cycle 19) outside the lily's own files;
//       M1a has no lily, so no gold at all
//   P08 the dust pseudo-color (25), which only the renderer may use
//   P09 a stamp fill that leaks out of its outline
//   P10 a picture outside plates/, scenes/, bases/ or stamps/, a bad id,
//       or a duplicate id
//   P11 a layer switch inside a stamp
//   P12 a palette table that makes gold: a remap that turns another color
//       into 7, or a cycle other than the lily's glow (19) that passes
//       through it (content/art/palette.json)
//   P13 the composer's recipes resolve (content/art/recipes.json; S5): a
//       drawn base's picture is in bases/, draws the sky, mid and near
//       layers once each in that order and never the far layer, and has
//       its anchors (trail_spot, far_bank, campsite, sky, star_floor); a
//       scene has trail_spot and star_floor; no anchor is off the canvas;
//       every prop slot's, skyline's, sprite's and fixed stamp is a stamp;
//       a slot's box is on the canvas and its count runs low to high; a
//       place's far names skylines, a place with a landmark skyline pins
//       flip: false, its prop overrides name its base's slots, and every
//       skyline it stands reaches 8 rows below its base's highest mid row
//       at any horizon shift; a stand-in is a base (the file's schema is
//       J01's)
//   P14 every drawable place composes at every hour (gfx/compose.js, with
//       the trail's hiker), and the composed picture passes P02, P03, P04,
//       P06, P07 and P09 like a drawn one; and its skyline is never lost,
//       for 4 columns in a row, against the sky right above it, the light
//       it carries behind its crest (a band with a dithered seam, drawn in
//       the skyline stamp) or the mid band right in front of it at any
//       hour: each column the same slot, or, against the sky or the light,
//       a slot too close in value (a contrast under FAINT: by value, not
//       just hue) (skylineMelts)
// Text (web/ and content/):
//   T04 no "Golden Glow" (the book is inspiration only, doc 10.1)
//   T06 no phone links (tel:), and the shell carries the format-detection
//       meta, so iOS never turns a number into a Call link (doc E.7)
//   T07, T10-T14 the words: no book frame, no English outside
//       content/text/, ids defined and used, the ledger, variables, and
//       the main gate (tools/textlint.mjs; doc 18.5)
//   T15 a line over its max, each {var} counted at its width in
//       content/text/vars.json, and an ours line with no max
//       (tools/textlint.mjs; S5, BUILD_PLAN 10.5)
//   T16 the gazetteer: every place a screen can show is a sourced place
//       in content/text/names/, no line names a descriptive label as a
//       place, quotes are their records' words exactly, cut words ship
//       nowhere (tools/textlint.mjs; S4, doc 18.2, 18.5)
//   U01 URLs stay relative: the same build is served at / and at /preview/
// Code:
//   E01 the picture VM and the palette stay pure: no Math.random, no Date,
//       no clock, no DOM
//   E02 the engine (web/js/engine/**) is deterministic (BUILD_PLAN 6.6;
//       GAME_DESIGN E.12): no Math.random, no approximate Math function,
//       no Math but its exact members (no alias, no destructuring), no
//       **, no clock or locale, no Unicode tables, no RegExp built at run
//       time or \p{} escapes, no DOM, storage, network, timers, console,
//       eval or dynamic import
//   E03 the engine imports only the engine: every static import in
//       web/js/engine/** resolves to a file inside web/js/engine/
//   E04 the sound's synthesis is bit-exact (BUILD_PLAN S5; GAME_DESIGN
//       13.11): web/js/audio/dsp.js keeps E02's bans, and imports only
//       the engine's pure modules (its math), so Node's goldens are the
//       phone's samples
//   S01 storage names (GAME_DESIGN E.9, F.3): in web/js/ only
//       platform/storage.js touches localStorage, sessionStorage, indexedDB
//       or caches, and no string starting oph. or oph- appears in web/
//       outside storage.js and sw.js, so every key and cache name carries
//       its channel and main and preview never share a save
// The park graph (tools/graphlint.mjs; BUILD_PLAN S4): inside the M1a scope
// every finding is an error; outside it, one content/park/ingest_known.json
// doesn't acknowledge is.
//   G01 references resolve (segment ends, hazards, presets, crossings,
//       traffic, overlays, the scope, conditions)
//   G02 every trailhead reaches a camp, every camp a trailhead
//   G03 elevation sanity (gain - loss against the endpoints, 100 ft)
//   G04 a shared id whose research records disagree by more than 100 ft
//   G06 presets route and end at a trailhead; no phone-only camp named
//   G07 the Bogachiel Peak spur, and no route through a spur node
//   G05 every place in the M1a scope has a picture recipe, every recipe
//       names a base or a scene, and a scene not drawn yet names its
//       stand-in and the session it lands in (content/art/recipes.json)
//   G08 the M1a scope's lists, map-only links, camps and loop gates
// Content (content/**: tools/content.mjs compiles it):
//   J01 every content file has a schema and validates against it (the
//       art's recipes and the sound's files, content/audio/, through their
//       own readers)
//   R01 references: next, then, pass and fail name a stop in their set; a
//       plan's start.set exists and its phase is built; ids unique; every
//       "@id" in a file the build ships is a line; the scope file's
//       switches and sections against tools/scope.mjs; the park's scope
//       ids (the build's rules.park)
//   X01 every x-expr parses and type-checks against schemas/vars.json (a
//       divisor whose range includes 0 is a warning)

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep, extname, dirname, posix } from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderPic, LAYERS, MAX_STAMP_DEPTH, TRANSPARENT } from '../web/js/gfx/picvm.js';
import { compose, drawable, resolvePlace, HOURS, HORIZON, ANCHOR, REQUIRED_ANCHORS, TRAIL_SPRITES, WIDTH, HEIGHT } from '../web/js/gfx/compose.js';
import { ROOT, loadPicSources, loadPalette, loadRecipes } from './pics.mjs';
import { PALETTE, REMAPS, CYCLES, hexToRgb } from '../web/js/gfx/palette.js';
import { runTextLint, scanJs } from './textlint.mjs';
import { compileContent, lineOfPath } from './content.mjs';
import { readText, channelScreens } from './text.mjs';
import { lintGraph } from './graphlint.mjs';
import { loadAudio } from './listen.mjs';

const GOLD_SLOT = 7;
const GLOW = 19;
const GOLD = new Set([GOLD_SLOT, GLOW]);
const DUST = 25;
const TEXT_EXT = new Set(['.html', '.css', '.js', '.mjs', '.json', '.webmanifest', '.pic', '.md', '.txt', '.svg']);
export const PURE_MODULES = ['web/js/gfx/picvm.js', 'web/js/gfx/palette.js', 'web/js/gfx/compose.js'];

/** @typedef {{file: string, line: number, code: string, msg: string, level?: 'error' | 'warn'}} Issue */

/**
 * @typedef {object} Rule
 * @property {string | null} code the code issues carry (null: a family F.3 names, coded when it lands)
 * @property {string} family
 * @property {string} doc where it is specified
 * @property {'active' | 'lands'} status
 * @property {string} [lands] the session it lands in
 * @property {string} what
 */

/** @type {(code: string | null, family: string, doc: string, what: string, lands?: string) => Rule} */
const rule = (code, family, doc, what, lands) => (lands ? { code, family, doc, status: 'lands', lands, what } : { code, family, doc, status: 'active', what });

/**
 * The registry (BUILD_PLAN 6.7, 10.5; GAME_DESIGN F.3): every rule, active
 * or waiting for its session. A code is active only here and in a check.
 * @type {readonly Rule[]}
 */
export const RULES = Object.freeze([
  rule('P01', 'pictures', 'BUILD_PLAN 4.2, 4.8', "a command, color, point or pattern the .pic format doesn't know"),
  rule('P02', 'pictures', 'BUILD_PLAN 4.8', "a stamp that doesn't exist"),
  rule('P03', 'pictures', 'BUILD_PLAN 4.8', 'a point off the canvas'),
  rule('P04', 'pictures', 'BUILD_PLAN 4.8', 'a fill over 60% of a non-sky layer (an outline left open)'),
  rule('P05', 'pictures', 'BUILD_PLAN 4.8', 'stamps nested more than 4 deep'),
  rule('P06', 'pictures', 'GAME_DESIGN 11.8', 'a Look hotspot off the canvas'),
  rule('P07', 'pictures', 'GAME_DESIGN 9.8, 11.1', "bonfire gold outside the lily's own files"),
  rule('P08', 'pictures', 'GAME_DESIGN 11.10', 'the dust pseudo-color, which only the renderer may use'),
  rule('P09', 'pictures', 'BUILD_PLAN 4.8', 'a stamp fill that leaks out of its outline'),
  rule('P10', 'pictures', 'BUILD_PLAN 4.2', 'a picture outside plates/, scenes/, bases/ or stamps/, a bad id, or a duplicate id'),
  rule('P11', 'pictures', 'BUILD_PLAN 4.2', 'a layer switch inside a stamp'),
  rule('P12', 'palette', 'BUILD_PLAN 4.7; GAME_DESIGN 11.4', 'a palette remap or cycle that makes bonfire gold'),
  rule('P13', 'pictures', 'BUILD_PLAN 4.4, 4.5, S5; GAME_DESIGN 11.7', "the composer's recipes resolve: bases, anchors, layers, slots, skylines, stamps, landmarks never flipped"),
  rule('P14', 'pictures', 'BUILD_PLAN 4.8, S5; GAME_DESIGN 11.1, 11.7, 11.8', 'every drawable place composes at every hour and lints like a drawn picture, its skyline apart from its sky and the light behind its crest (in value too) and from its mid band'),
  rule('T04', 'text', 'GAME_DESIGN 10.1, F.3', 'no "Golden Glow" in shipped text'),
  rule('T06', 'text', 'GAME_DESIGN E.7, F.3', 'no phone links, and the shell carries the format-detection meta'),
  rule('T07', 'text', 'GAME_DESIGN F.3; BUILD_PLAN 10.5', 'no book words in player-facing text, outside the allowlist'),
  rule('T10', 'text', 'GAME_DESIGN 18.5; BUILD_PLAN 10.5', 'no original English outside content/text/'),
  rule('T11', 'text', 'GAME_DESIGN 18.5; BUILD_PLAN 10.5', 'an id used but not defined, or defined and never used'),
  rule('T12', 'text', 'GAME_DESIGN 18.5; BUILD_PLAN 10.4', 'the ledger: an entry with no answer, or a bad hash'),
  rule('T13', 'text', 'GAME_DESIGN 18.5; BUILD_PLAN 10.5', "variables that don't match; a placeholder where none may be"),
  rule('T14', 'text', 'GAME_DESIGN 18.6; BUILD_PLAN 10.6', 'the main gate: main ships approved words only'),
  rule('T15', 'text', 'BUILD_PLAN 10.5, S5', "a line over its max (each {var} at its width in content/text/vars.json); an ours line with no max"),
  rule('T16', 'text', 'GAME_DESIGN 18.2, 18.5; BUILD_PLAN 10.5, S4', 'a place missing from the gazetteer; an inexact quote; cut words'),
  rule('U01', 'urls', 'BUILD_PLAN 6.1', 'URLs stay relative: one build is served at / and at /preview/'),
  rule('E01', 'code', 'BUILD_PLAN 4.2', 'the picture VM, the palette and the composer stay pure'),
  rule('E02', 'code', 'BUILD_PLAN 6.6; GAME_DESIGN E.12', 'the engine is deterministic: the bans'),
  rule('E03', 'code', 'BUILD_PLAN 2.3; GAME_DESIGN E.2', 'the engine imports only the engine'),
  rule('E04', 'code', 'BUILD_PLAN 13.5, S5; GAME_DESIGN 13.11', "the sound's synthesis (audio/dsp.js) is bit-exact: E02's bans, the engine's math only"),
  rule('S01', 'storage', 'GAME_DESIGN E.9, F.3', 'every storage key and cache name carries its channel'),
  rule('J01', 'content', 'BUILD_PLAN 2.7, S3; GAME_DESIGN F.3', 'every content file has a schema and validates against it'),
  rule('R01', 'content', 'GAME_DESIGN F.3', "next, then, pass, fail, a plan's start and its phase name what exists; ids unique; @ids are lines"),
  rule('X01', 'content', 'GAME_DESIGN F.3, 8.3; BUILD_PLAN S3', 'every expression parses and type-checks against schemas/vars.json'),
  rule('G01', 'park graph', 'GAME_DESIGN F.3; BUILD_PLAN S4', 'references: segment ends, hazards, presets, crossings, traffic, overlays, the scope and conditions resolve'),
  rule('G02', 'park graph', 'GAME_DESIGN F.3', 'every trailhead reaches a camp and every camp a trailhead, over routable segments'),
  rule('G03', 'park graph', 'GAME_DESIGN F.3, E.4', "elevation sanity: gain - loss meets the endpoints within 100 ft; no null elevation in the scope"),
  rule('G04', 'park graph', 'GAME_DESIGN E.4', 'a shared id whose records disagree by more than 100 ft'),
  rule('G05', 'park graph', 'GAME_DESIGN F.3; BUILD_PLAN S5', 'every place has a picture recipe; a scene not drawn yet names its stand-in and its session'),
  rule('G06', 'park graph', 'GAME_DESIGN F.3, 4.3', 'presets route and end at a trailhead; nothing names a phone-only camp'),
  rule('G07', 'park graph', 'M1A_DATA_CHECK item 1', "Bogachiel Peak is a spur, and no route between the plannable camps passes through one"),
  rule('G08', 'park graph', 'BUILD_PLAN 3.4; GAME_DESIGN 4.3, 4.6', "the M1a scope: real ids, the map-only links, no group or stock site plannable, every camp's fields, the loop's gates and forks"),
  rule('T02', 'text', 'GAME_DESIGN F.3; BUILD_PLAN 10.5', 'measured fit at 375 x 667 and 393 x 852', 'S6'),
  rule(null, 'cards', 'GAME_DESIGN F.3', 'reachability, no dead ends, fuzzed odds, chains end, flags set', 'S9'),
  rule(null, 'honest odds', 'GAME_DESIGN F.3, 8.1', 'no % without a roll; labeled modifiers; computed fatal shares', 'S9'),
  rule(null, 'economy', 'GAME_DESIGN F.3', 'items obtainable, rewarded tags provided, the sensible kit fits', 'S11'),
  rule('T03', 'text', 'GAME_DESIGN F.3; BUILD_PLAN 6.7', 'real businesses and people', 'S11'),
  rule('T05', 'text', 'GAME_DESIGN F.3; BUILD_PLAN 10.5', 'a drink or a joint near a car, or in the cabin scene', 'S11'),
  rule(null, 'minigames', 'GAME_DESIGN F.3, 17.2, 17.15', 'the diamond from the hands range, no death inside, the bans in engine/mini/', 'S13'),
  rule(null, 'coverage', 'GAME_DESIGN F.3, 14.2', 'event tags, catalog items and hazard tags covered by cards', 'S18'),
  rule(null, 'Boyz placeholders', 'GAME_DESIGN F.3; BUILD_PLAN 5.7', "the placeholders and the consent gate on a release build", 'S19'),
  rule('A01-A09', 'sound', 'GAME_DESIGN F.3, 13.12; BUILD_PLAN 13.4', 'licenses, hashes, budgets and where each cue may play', 'S22'),
  rule(null, 'Larry caps', 'GAME_DESIGN F.3, 2.6', 'sure choices, budgets and where a Larry card may show', 'S23'),
  rule(null, 'fair deaths', 'GAME_DESIGN F.3', 'a death only after a shown fatal share or a warned chain', 'S24a'),
  rule(null, 'the death sequence', 'GAME_DESIGN F.3', 'cause keys, YOU PERISHED lines and their quote tags', 'S24a'),
  rule(null, 'the epitaph dice', 'GAME_DESIGN F.3, 9.5', 'verified public-domain lines, 40 characters, 8 a cause', 'S24a'),
  rule(null, 'one death rule, one hiker, the people', 'GAME_DESIGN F.3, 9.4, 9.8, 12.4', 'no gentle mode on screen, the wipe, the permit numbers, Lake Morgenroth', 'S24b'),
  rule(null, 'the timed modes', 'GAME_DESIGN F.3, 9.9 to 9.12', 'disqualifying choices say so, the standard profile, no real FKT names', 'S29'),
]);

/** The codes the lint checks now, in the registry's order. */
export const activeCodes = () => RULES.filter((r) => r.status === 'active').map((r) => /** @type {string} */ (r.code));

/**
 * Codes written short: consecutive runs of one letter become ranges
 * (P01-P12, T10-T14, E01-E03).
 * @param {string[]} codes
 */
export function codeRanges(codes) {
  /** @type {string[]} */
  const out = [];
  let i = 0;
  while (i < codes.length) {
    const m = /^([A-Z])(\d{2})$/.exec(codes[i]);
    let j = i;
    if (m) {
      while (j + 1 < codes.length) {
        const n = /^([A-Z])(\d{2})$/.exec(codes[j + 1]);
        const prev = /** @type {RegExpExecArray} */ (/^([A-Z])(\d{2})$/.exec(codes[j]));
        if (!n || n[1] !== m[1] || Number(n[2]) !== Number(prev[2]) + 1) break;
        j++;
      }
    }
    out.push(j - i >= 2 ? `${codes[i]}-${codes[j]}` : codes.slice(i, j + 1).join(', '));
    i = j + 1;
  }
  return out.join(', ');
}

/** The registry as text, for --rules. */
export function formatRules() {
  const rows = RULES.map((r) => [r.code || '-', r.status === 'active' ? 'active' : `lands ${r.lands}`, r.family, `${r.what} (${r.doc})`]);
  const w = [0, 1, 2].map((k) => Math.max(...rows.map((row) => row[k].length)));
  const active = RULES.filter((r) => r.status === 'active').length;
  return [...rows.map((row) => `${row[0].padEnd(w[0])}  ${row[1].padEnd(w[1])}  ${row[2].padEnd(w[2])}  ${row[3]}`), `lint: ${active} rules active, ${RULES.length - active} waiting for their sessions`].join('\n');
}

function colorsOf(op) {
  if (op[0] === 'C') return [op[1]];
  if (op[0] === 'D') return op.length === 2 ? [op[1]] : [op[1], op[2]];
  return [];
}

/**
 * Lint one parsed picture source.
 * @param {{id: string, kind: string|null, rel: string, parsed: any, width: number, height: number}} src
 * @param {Record<string, any[][]>} stamps every stamp's ops, by id
 * @returns {Issue[]}
 */
export function lintPicture(src, stamps) {
  /** @type {Issue[]} */
  const out = [];
  const file = src.rel;
  const add = (line, code, msg) => out.push({ file, line, code, msg });
  const { ops, lines, errors } = src.parsed;
  for (const e of errors) add(e.line, 'P01', e.msg);
  if (!src.kind) add(1, 'P10', 'pictures live in plates/, scenes/, bases/ or stamps/');
  if (!/^[a-z][a-z0-9_]*$/.test(src.id)) add(1, 'P10', `"${src.id}" is not a good id (lowercase, digits, underscores)`);
  const lilyFile = src.id.includes('bonfire_lily');
  ops.forEach((op, k) => {
    for (const c of colorsOf(op)) {
      if (GOLD.has(c) && !lilyFile) add(lines[k], 'P07', `color ${c} is bonfire gold: the lily's alone, and M1a has no lily`);
      if (c === DUST) add(lines[k], 'P08', 'color 25 (dust) is for the renderer only');
    }
    if (op[0] === '@' && src.kind === 'stamps') add(lines[k], 'P11', 'a stamp draws on the layer it is placed on; no @ inside it');
  });
  if (!src.kind) return out;

  if (src.kind === 'stamps') {
    // Render the stamp on its own to check what it uses and how it fills.
    const W = 480;
    const H = 480;
    const r = renderPic([['@', 'near'], ['T', src.id, 240, 360, 0]], { width: W, height: H, stamps: { ...stamps, [src.id]: ops } });
    for (const u of r.diag.unknownStamps) add(1, 'P02', `unknown stamp "${u.id}"`);
    for (const d of r.diag.tooDeep) add(1, 'P05', `stamps nest more than ${MAX_STAMP_DEPTH} deep (at "${d.id}")`);
    for (const f of r.diag.fills) if (!f.top && f.edge) add(1, 'P09', `a fill from ${f.x},${f.y} leaks to the stamp's edge: is an outline open?`);
    return out;
  }

  const W = src.width;
  const H = src.height;
  const r = renderPic(ops, { width: W, height: H, stamps });
  const lineOf = (k) => lines[k] || 1;
  for (const u of r.diag.unknownStamps) add(lineOf(u.op), 'P02', `unknown stamp "${u.id}"`);
  for (const d of r.diag.tooDeep) add(lineOf(d.op), 'P05', `stamps nest more than ${MAX_STAMP_DEPTH} deep (at "${d.id}")`);
  for (const o of r.diag.oob) add(lineOf(o.op), 'P03', `${o.x},${o.y} is off the ${W}x${H} canvas`);
  for (const f of r.diag.fills) {
    if (f.top && f.layer !== 0 && f.count > 0.6 * W * H) {
      add(lineOf(f.op), 'P04', `the fill from ${f.x},${f.y} covers ${Math.round((100 * f.count) / (W * H))}% of the ${LAYERS[f.layer]} layer: is an outline open?`);
    }
    if (!f.top && f.edge) add(lineOf(f.op), 'P09', 'a stamp fill leaks to its edge: is an outline open?');
  }
  ops.forEach((op, k) => {
    if (op[0] !== 'Z') return;
    const [, id, x, y, w, h] = op;
    if (w <= 0 || h <= 0 || x < 0 || y < 0 || x + w > W || y + h > H) add(lineOf(k), 'P06', `hotspot "${id}" (${x},${y},${w},${h}) is off the ${W}x${H} canvas`);
  });
  return out;
}

/** Every picture, with stamps resolved across files. */
export function lintPictures(sources) {
  const stamps = {};
  /** @type {Issue[]} */
  const out = [];
  const seen = new Map();
  for (const s of sources) {
    if (seen.has(s.id)) out.push({ file: s.rel, line: 1, code: 'P10', msg: `id "${s.id}" is also ${seen.get(s.id)}` });
    else seen.set(s.id, s.rel);
    if (s.kind === 'stamps') stamps[s.id] = s.parsed.ops;
  }
  for (const s of sources) out.push(...lintPicture(s, stamps));
  return out;
}

/**
 * P12: the palette tables never make gold where the art didn't ask for it.
 * @param {string} file
 * @param {{remaps?: Record<string, number[]>, cycles?: Record<string, {name?: string, slots: number[]}>}} pal
 * @returns {Issue[]}
 */
export function lintPalette(file, pal) {
  /** @type {Issue[]} */
  const out = [];
  for (const [name, map] of Object.entries(pal.remaps || {})) {
    map.forEach((to, from) => {
      if (to === GOLD_SLOT && from !== GOLD_SLOT) out.push({ file, line: 1, code: 'P12', msg: `the ${name} remap turns color ${from} into bonfire gold` });
    });
  }
  for (const [id, cycle] of Object.entries(pal.cycles || {})) {
    if (Number(id) !== GLOW && cycle.slots.includes(GOLD_SLOT)) out.push({ file, line: 1, code: 'P12', msg: `cycle ${id} (${cycle.name || '?'}) passes through bonfire gold; only the lily's glow (19) may` });
  }
  return out;
}

/** The anchors (at_<name> hotspots) a picture's ops declare: name -> [x, y]. */
export function anchorsOf(ops) {
  /** @type {Record<string, number[]>} */
  const out = {};
  for (const op of ops) if (op[0] === 'Z' && String(op[1]).startsWith(ANCHOR)) out[String(op[1]).slice(ANCHOR.length)] = [op[2], op[3]];
  return out;
}

/** The art as the composer reads it (art.json's shape), from the parsed sources and the recipes. */
export function artOf(sources, recipes) {
  const pics = {};
  const stamps = {};
  for (const s of sources) {
    if (s.kind === 'stamps') stamps[s.id] = s.parsed.ops;
    else if (s.kind) pics[s.id] = { kind: s.kind, width: s.width, height: s.height, ops: s.parsed.ops };
  }
  return { pics, stamps, recipes };
}

/** A stamp's lowest row below its anchor, or null for one that draws nothing. */
function stampBottom(id, stamps) {
  const W = 480;
  const H = 480;
  const r = renderPic([['@', 'near'], ['T', id, 240, 240, 0]], { width: W, height: H, stamps });
  const buf = r.layers[3];
  for (let y = H - 1; y >= 0; y--) for (let x = 0; x < W; x++) if (buf[y * W + x] !== TRANSPARENT) return y - 240;
  return null;
}

/** A picture's highest drawn row on a layer, or null. */
function topRow(ops, layer, stamps) {
  const r = renderPic(ops, { width: WIDTH, height: HEIGHT, stamps });
  const buf = r.layers[LAYERS.indexOf(layer)];
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) if (buf[y * WIDTH + x] !== TRANSPARENT) return y;
  return null;
}

/**
 * P13: the composer's recipes resolve (and J01: the file against its schema).
 * @param {{recipes: any, src: string, errors: {path: string, msg: string}[]}} info loadRecipes()
 * @param {any[]} sources loadPicSources()
 * @param {string} [file]
 * @returns {Issue[]}
 */
export function lintRecipes(info, sources, file = 'content/art/recipes.json') {
  /** @type {Issue[]} */
  const out = [];
  const add = (path, code, msg) => out.push({ file, line: lineOfPath(info.src, path), code, msg });
  for (const e of info.errors) add(e.path, 'J01', `${e.path || '(the file)'}: ${e.msg}`);
  if (!info.recipes || info.errors.length) return out;
  const R = info.recipes;
  const byId = new Map(sources.map((s) => [s.id, s]));
  const isStamp = (id) => byId.has(id) && byId.get(id).kind === 'stamps';
  const own = (o, k) => o !== null && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);
  const art = artOf(sources, R);
  const anchorsOk = (path, what, ops, need) => {
    const at = anchorsOf(ops);
    for (const n of need) if (!own(at, n)) add(path, 'P13', `${what} has no anchor at_${n} (a 1x1 hotspot)`);
    for (const [n, [x, y]] of Object.entries(at)) if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) add(path, 'P13', `${what}'s anchor at_${n} (${x},${y}) is off the canvas`);
  };
  /** The drawn base a base id resolves to (through stand-ins), or null. */
  const drawnBase = (id) => {
    let at = id;
    for (let k = 0; k < 4 && own(R.bases, at); k++) {
      if (R.bases[at].drawn) return byId.has(R.bases[at].pic) ? R.bases[at] : null;
      at = R.bases[at].stand_in;
    }
    return null;
  };
  for (const [id, b] of Object.entries(R.bases)) {
    const path = `bases.${id}`;
    if (!b.drawn) {
      if (b.stand_in !== undefined && !own(R.bases, b.stand_in)) add(`${path}.stand_in`, 'P13', `base ${id}: its stand-in "${b.stand_in}" is no base`);
      continue;
    }
    const pic = byId.get(b.pic);
    if (!pic || pic.kind !== 'bases') {
      add(`${path}.pic`, 'P13', `base ${id}: no picture "${b.pic}" in pics/bases/`);
      continue;
    }
    // Rule 1: the sky, mid and near layers, each once, in that order; never the far layer.
    let last = 0;
    const seen = new Set();
    for (const op of pic.parsed.ops) {
      if (op[0] !== '@') continue;
      const k = LAYERS.indexOf(op[1]);
      if (op[1] === 'far') add(`${path}.pic`, 'P13', `base ${id}: ${b.pic} draws on the far layer, which is the skylines' (the composer's rule 1)`);
      else if (k < last || seen.has(op[1])) add(`${path}.pic`, 'P13', `base ${id}: ${b.pic} must draw its layers once each, in the order sky, mid, near`);
      seen.add(op[1]);
      last = Math.max(last, k);
    }
    anchorsOk(`${path}.pic`, `base ${id} (${b.pic})`, pic.parsed.ops, REQUIRED_ANCHORS.bases);
    const ids = new Set();
    (b.props || []).forEach((slot, i) => {
      const sp = `${path}.props[${i}]`;
      if (ids.has(slot.id)) add(sp, 'P13', `base ${id}: two prop slots are "${slot.id}"`);
      ids.add(slot.id);
      for (const st of slot.stamps) if (!isStamp(st)) add(`${sp}.stamps`, 'P13', `base ${id}, slot ${slot.id}: no stamp "${st}"`);
      const [x, y, w, h] = slot.box;
      if (x + w > WIDTH || y + h > HEIGHT || w < 1 || h < 1) add(`${sp}.box`, 'P13', `base ${id}, slot ${slot.id}: the box ${slot.box.join(',')} is off the ${WIDTH}x${HEIGHT} canvas`);
      if (slot.count[0] > slot.count[1]) add(`${sp}.count`, 'P13', `base ${id}, slot ${slot.id}: the count runs ${slot.count[0]} to ${slot.count[1]}, high before low`);
    });
  }
  for (const [id, sk] of Object.entries(R.skylines)) if (!isStamp(sk.stamp)) add(`skylines.${id}.stamp`, 'P13', `skyline ${id}: no stamp "${sk.stamp}"`);
  R.sprites.forEach((id, i) => {
    if (!isStamp(id)) add(`sprites[${i}]`, 'P13', `sprite "${id}" is no stamp`);
  });
  for (const s of sources) if (s.kind === 'scenes') anchorsOk('(the file)', `scene ${s.id}`, s.parsed.ops, REQUIRED_ANCHORS.scenes);
  for (const [id, p] of Object.entries(R.places)) {
    const path = `places.${id}`;
    if (p.stand_in !== undefined && !own(R.bases, p.stand_in)) add(`${path}.stand_in`, 'P13', `place ${id}: its stand-in "${p.stand_in}" is no base`);
    const baseId = typeof p.base === 'string' ? p.base : byId.has(p.scene) ? null : p.stand_in;
    const base = baseId ? drawnBase(baseId) : null;
    for (const f of p.far || []) {
      if (!own(R.skylines, f)) {
        add(`${path}.far`, 'P13', `place ${id}: no skyline "${f}"`);
        continue;
      }
      if (R.skylines[f].landmark && p.flip !== false) add(`${path}.flip`, 'P13', `place ${id} stands the landmark ${f}, so it must pin flip: false (a landmark is never mirrored)`);
      if (base && isStamp(R.skylines[f].stamp)) {
        const bottom = stampBottom(R.skylines[f].stamp, art.stamps);
        const mid = topRow(byId.get(base.pic).parsed.ops, 'mid', art.stamps);
        if (bottom !== null && mid !== null && base.far_y - HORIZON + bottom < mid + 8) {
          add(`${path}.far`, 'P13', `place ${id}: the skyline ${f} reaches row ${base.far_y + bottom} at most, ${base.far_y - HORIZON + bottom} with the horizon up ${HORIZON}; it must reach 8 rows below the base's highest mid row (${mid}), row ${mid + 8} (the composer's rule 3)`);
        }
      }
    }
    (p.stamps || []).forEach((st, i) => {
      if (!isStamp(st.id)) add(`${path}.stamps[${i}]`, 'P13', `place ${id}: no stamp "${st.id}"`);
    });
    for (const [slot, o] of Object.entries(p.props || {})) {
      if (base && !(base.props || []).some((s) => s.id === slot)) add(`${path}.props.${slot}`, 'P13', `place ${id}: its base has no prop slot "${slot}"`);
      for (const st of o.stamps || []) if (!isStamp(st)) add(`${path}.props.${slot}`, 'P13', `place ${id}, slot ${slot}: no stamp "${st}"`);
      if (o.count && o.count[0] > o.count[1]) add(`${path}.props.${slot}`, 'P13', `place ${id}, slot ${slot}: the count runs high before low`);
    }
  }
  return out;
}

/**
 * P14: every drawable place composes at every hour, with the trail's
 * hiker, and its composed picture lints like a drawn one.
 * @param {{recipes: any, src: string, errors: any[]}} info loadRecipes()
 * @param {any[]} sources loadPicSources()
 * @param {string} [file]
 * @returns {Issue[]}
 */
export function lintCompositions(info, sources, file = 'content/art/recipes.json') {
  /** @type {Issue[]} */
  const out = [];
  if (!info.recipes || info.errors.length) return out;
  const art = artOf(sources, info.recipes);
  const KEEP = new Set(['P02', 'P03', 'P04', 'P06', 'P07', 'P09']);
  for (const id of Object.keys(info.recipes.places)) {
    if (!drawable(id, art)) continue;
    const line = lineOfPath(info.src, `places.${id}`);
    for (const hour of HOURS) {
      let c;
      try {
        c = compose(id, art, { hour, sprites: TRAIL_SPRITES });
      } catch (e) {
        out.push({ file, line, code: 'P14', msg: `place ${id} doesn't compose at ${hour}: ${e.message}` });
        continue;
      }
      const src = { id, kind: 'scenes', rel: file, parsed: { ops: c.ops, lines: [], errors: [] }, width: c.width, height: c.height };
      for (const i of lintPicture(src, art.stamps)) if (KEEP.has(i.code)) out.push({ file, line, code: 'P14', msg: `place ${id} at ${hour} (from ${c.from}): ${i.code} ${i.msg}` });
      // Gold from anywhere, a stamp's included: the picture's own pixels.
      const r = renderPic(c.ops, { width: c.width, height: c.height, stamps: art.stamps });
      if (r.layers.some((L) => L.some((v) => GOLD.has(v)))) out.push({ file, line, code: 'P14', msg: `place ${id} at ${hour} (from ${c.from}): P07 bonfire gold in the composed picture` });
      // A skyline is never lost against the sky above it, the light behind its crest, or the band in front of it.
      for (const m of skylineMelts(r, hour)) {
        const where = `for ${m.xs.length} columns (x ${m.xs[0]} to ${m.xs[m.xs.length - 1]}): slot ${m.slots[0]} against ${m.slots[1]}`;
        const at = `place ${id} at ${hour} (from ${c.from})`;
        let msg = `${at}: its skyline melts into ${m.into} ${where}, the same slot at this hour (doc 11.1: each band a step apart)`;
        if (m.faint && m.same) msg = `${at}: its skyline is lost against ${m.into} ${where}, ${m.same} of them the same slot at this hour and the rest a contrast of ${m.faint} at most, under ${FAINT} (doc 11.1: each band a step apart, by value too)`;
        else if (m.faint) msg = `${at}: its skyline is too faint against ${m.into} ${where}, a contrast of ${m.faint} at this hour, under ${FAINT} (doc 11.1: value, not just hue)`;
        out.push({ file, line, code: 'P14', msg });
      }
    }
  }
  return out;
}

/** P14: a skyline melts where its edge shares a slot with what meets it for this many columns in a row. */
export const MELT_RUN = 4;

/**
 * P14: a skyline is too faint against the sky where the two slots'
 * contrast ratio stays under this for MELT_RUN columns in a row: by value,
 * not just hue (ink against night navy, 1.28, is too faint; night navy
 * against slate, 1.81, is not).
 */
export const FAINT = 1.5;

/** Each palette slot's relative luminance (sRGB, as WCAG 2 counts it). */
const LUMINANCE = PALETTE.map((hex) => {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
});

/**
 * The contrast ratio of two palette slots (1 for the same, 21 at most).
 * @param {number} a
 * @param {number} b
 */
export function contrast(a, b) {
  const hi = Math.max(LUMINANCE[a], LUMINANCE[b]);
  const lo = Math.min(LUMINANCE[a], LUMINANCE[b]);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Where a composed picture's skyline (its far layer) is lost at an hour.
 * Down every column, three edges, each where both its pixels show:
 *   - the sky: the far layer's top pixel against the sky pixel right above;
 *   - its own light: where the far layer's top is a dithered seam (its top
 *     two rows two values, swapped in a column beside it with the same top,
 *     a checker), the skyline carries the horizon's light behind its crest,
 *     a band drawn in the stamp (the Deer Lake ridge's, Olympus's): the
 *     first pixel under the band (under the seam and the run of one value
 *     below it) against the band pixel right above it, so the crest is
 *     linted against the light it stands in, not the band against the sky;
 *   - the band in front of it: the mid layer's top pixel against the far
 *     pixel right above it.
 * Each resolves through the hour's remap (a cycle through all its slots; a
 * light, like a star, is no band and is passed by). An edge is lost where
 * its two share a slot, or, against the sky or the light, where they are
 * apart in slot but too close in value (every pair's contrast under
 * FAINT): an edge the eye loses on a phone, as the ridges did in a dusk sky
 * in S5's first pictures. A run of MELT_RUN columns in a row each lost,
 * either way, is reported (SPEC 4.2.1: the sky bands, the far skyline and
 * the mid band stay apart at every hour); a shorter one is a dithered
 * seam, where the band's other color, truly apart, shows the edge.
 * @param {{width: number, height: number, layers: Uint8Array[]}} r renderPic()'s
 * @param {string} hour
 * @returns {{into: string, xs: number[], slots: number[], faint?: string, same?: number}[]} for each edge, its longest lost run of columns, with the raw pair at its first column: a run of shared slots carries no faint; a faint one carries its best contrast, to two places; a mixed one both, and how many of its columns share a slot
 */
export function skylineMelts(r, hour) {
  const W = r.width;
  const H = r.height;
  const [sky, far, mid, near] = r.layers;
  const remap = REMAPS[/** @type {keyof typeof REMAPS} */ (hour)];
  /** The slots a value can show at this hour; null for a light. @param {number} v */
  const slots = (v) => {
    if (v < 16) return [remap[v]];
    const c = /** @type {any} */ (CYCLES)[v];
    if (!c || c.light) return null;
    return c.slots.map((/** @type {number} */ s) => remap[s]);
  };
  const shows = (/** @type {Uint8Array[]} */ over, /** @type {number} */ i) => over.every((L) => L[i] === TRANSPARENT);
  const INTO = ['the sky', 'its own light', 'the band in front of it'];
  /** Each edge's columns: x to {a, b, same, best}, where an edge is lost. @type {Map<number, {a: number, b: number, same: boolean, best: number}>[]} */
  const lost = INTO.map(() => new Map());
  /** @param {number} k the edge @param {number} x @param {number} a @param {number} b */
  const meet = (k, x, a, b) => {
    const sa = slots(a);
    const sb = slots(b);
    if (!sa || !sb) return;
    if (sa.some((s) => sb.includes(s))) {
      lost[k].set(x, { a, b, same: true, best: 1 });
      return;
    }
    if (INTO[k] === 'the band in front of it') return; // held to its slot alone
    // Apart in slot: lost when every pair is too close in value.
    let best = 0;
    for (const p of sa) for (const q of sb) best = Math.max(best, contrast(p, q));
    if (best < FAINT) lost[k].set(x, { a, b, same: false, best });
  };
  /** The far layer's top row in column x, or -1. @param {number} x */
  const topOf = (x) => {
    for (let y = 0; y < H; y++) if (far[y * W + x] !== TRANSPARENT) return y;
    return -1;
  };
  const tops = Array.from({ length: W }, (_, x) => topOf(x));
  /** A dithered seam at the far layer's top in column x: two values there, swapped in a column beside it at the same top. @param {number} x */
  const seam = (x) => {
    const t = tops[x];
    if (t < 0 || t + 2 >= H) return false;
    const a = far[t * W + x];
    const b = far[(t + 1) * W + x];
    if (b === TRANSPARENT || a === b) return false;
    return [x - 1, x + 1].some((n) => n >= 0 && n < W && tops[n] === t && far[t * W + n] === b && far[(t + 1) * W + n] === a);
  };
  for (let x = 0; x < W; x++) {
    const top = tops[x];
    if (top <= 0) continue;
    const i = top * W + x;
    const above = i - W;
    if (shows([mid, near], i) && shows([mid, near], above) && sky[above] !== TRANSPARENT) meet(0, x, far[i], sky[above]);
    // Its own light: the crest, the first pixel under the band, against the band.
    if (seam(x)) {
      let y = top + 2;
      const v = far[y * W + x];
      while (y < H && far[y * W + x] === v) y++;
      const j = y * W + x;
      if (y < H && far[j] !== TRANSPARENT && shows([mid, near], j) && shows([mid, near], j - W)) meet(1, x, far[j], far[j - W]);
    }
    // The mid band in front: its top pixel against the skyline right above it.
    for (let y = top + 1; y < H; y++) {
      const j = y * W + x;
      if (mid[j] === TRANSPARENT) continue;
      if (shows([near], j) && shows([mid, near], j - W) && far[j - W] !== TRANSPARENT) meet(2, x, mid[j], far[j - W]);
      break;
    }
  }
  /** @type {{into: string, xs: number[], slots: number[], faint?: string, same?: number}[]} */
  const out = [];
  lost.forEach((cols, k) => {
    /** @type {number[]} */
    let best = [];
    /** @type {number[]} */
    let run = [];
    for (let x = 0; x < W; x++) {
      run = cols.has(x) ? [...run, x] : [];
      if (run.length > best.length) best = run;
    }
    if (best.length < MELT_RUN) return;
    const at = best.map((x) => /** @type {{a: number, b: number, same: boolean, best: number}} */ (cols.get(x)));
    const same = at.filter((c) => c.same).length;
    const faint = at.filter((c) => !c.same);
    /** @type {{into: string, xs: number[], slots: number[], faint?: string, same?: number}} */
    const m = { into: INTO[k], xs: best, slots: [at[0].a, at[0].b] };
    if (faint.length) m.faint = Math.max(...faint.map((c) => c.best)).toFixed(2);
    if (faint.length && same) m.same = same;
    out.push(m);
  });
  return out;
}

/** T04 and T06 over one text file. */
export function lintText(file, text) {
  /** @type {Issue[]} */
  const out = [];
  text.split(/\r?\n/).forEach((row, i) => {
    if (/golden\s+glow/i.test(row)) out.push({ file, line: i + 1, code: 'T04', msg: 'no "Golden Glow" in shipped text (doc 10.1)' });
    if (/\btel:/i.test(row)) out.push({ file, line: i + 1, code: 'T06', msg: 'no phone links (tel:) anywhere (doc E.7)' });
  });
  return out;
}

/** The shell's own rules: the format-detection meta (T06). */
export function lintShell(file, html) {
  /** @type {Issue[]} */
  const out = [];
  const meta = /<meta\s+name=["']format-detection["']\s+content=["'][^"']*telephone=no[^"']*["']/i;
  if (!meta.test(html)) out.push({ file, line: 1, code: 'T06', msg: 'the shell needs <meta name="format-detection" content="telephone=no">' });
  return out;
}

/** U01: no root-relative or absolute URLs in the shell. */
export function lintUrls(file, text) {
  /** @type {Issue[]} */
  const out = [];
  const ext = extname(file);
  const bad = (line, url) => out.push({ file, line, code: 'U01', msg: `"${url}" must be relative: the same build is served at / and at /preview/` });
  if (ext === '.webmanifest') {
    let m;
    try {
      m = JSON.parse(text);
    } catch (e) {
      out.push({ file, line: 1, code: 'U01', msg: `not JSON: ${e.message}` });
      return out;
    }
    const urls = [m.id, m.start_url, m.scope, ...(m.icons || []).map((i) => i.src)].filter((u) => typeof u === 'string');
    for (const u of urls) if (/^(\/|[a-z]+:)/i.test(u)) bad(1, u);
    return out;
  }
  text.split(/\r?\n/).forEach((row, i) => {
    if (ext === '.html') {
      for (const m of row.matchAll(/\b(?:href|src)\s*=\s*["']([^"']*)["']/gi)) if (/^(\/|[a-z]+:)/i.test(m[1])) bad(i + 1, m[1]);
    }
    if (ext === '.css' || ext === '.html') {
      for (const m of row.matchAll(/url\(\s*["']?([^"')]*)/gi)) if (/^(\/|[a-z]+:)/i.test(m[1]) && !m[1].startsWith('data:')) bad(i + 1, m[1]);
    }
    if (ext === '.js' || ext === '.mjs') {
      for (const m of row.matchAll(/(?:fetch|new URL|import)\(\s*["'](\/[^"']*)["']/g)) bad(i + 1, m[1]);
      for (const m of row.matchAll(/\b(?:import|export)\b[^'"]*?\bfrom\s*["'](\/[^"']*)["']/g)) bad(i + 1, m[1]);
      for (const m of row.matchAll(/^\s*import\s*["'](\/[^"']*)["']/g)) bad(i + 1, m[1]);
    }
  });
  return out;
}

/** Strip comments (a little loosely: enough for a ban list). */
function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:"'`])\/\/.*$/gm, '$1');
}

/** E01: a pure module touches no randomness, clock or DOM. */
export function lintPure(file, code) {
  /** @type {Issue[]} */
  const out = [];
  const banned = [
    [/\bMath\.random\b/, 'Math.random'],
    [/\bDate\b/, 'Date'],
    [/\bperformance\b/, 'performance'],
    [/\b(?:document|window|navigator|localStorage)\b/, 'the DOM'],
  ];
  stripComments(code)
    .split('\n')
    .forEach((row, i) => {
      for (const [re, what] of banned) if (re.test(row)) out.push({ file, line: i + 1, code: 'E01', msg: `a pure module may not use ${what}` });
    });
  return out;
}

/** E02 and E03: where the engine lives. */
export const ENGINE_DIR = 'web/js/engine';

/** The Math members the engine may use: exact operations and constants (BUILD_PLAN 6.6). */
export const MATH_ALLOWED = Object.freeze(['sqrt', 'floor', 'ceil', 'round', 'trunc', 'abs', 'min', 'max', 'sign', 'imul', 'clz32', 'fround', 'PI']);

/** The approximate Math functions (and Math.random), which each JavaScript engine computes its own way. */
export const MATH_BANNED = Object.freeze(['random', 'exp', 'expm1', 'log', 'log1p', 'log2', 'log10', 'pow', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh', 'cbrt', 'hypot']);

/**
 * E02's bans: [pattern over the code with strings and comments blanked,
 * what it is]. The patterns run over the whole module, so a member chain
 * split across lines (Math\n  .random()) is caught too.
 */
export const ENGINE_BANS = [
  [new RegExp(`(?<![\\w$])Math\\s*\\.\\s*(${MATH_BANNED.join('|')})(?![\\w$])`), (m) => `Math.${m[1]}`],
  [/(?<![\w$])Math\s*\[/, () => 'Math[...] (a computed Math function)'],
  [
    new RegExp(`(?<![\\w$])Math(?![\\w$])(?!\\s*(?:\\[|\\.\\s*(?:${[...MATH_ALLOWED, ...MATH_BANNED].join('|')})(?![\\w$])))`),
    () => `Math other than Math.${MATH_ALLOWED.join('/')} (an alias, a destructuring or another member)`,
  ],
  [/\*\*/, () => 'the ** operator'],
  [/\bDate\b/, () => 'Date'],
  [/\bperformance\b/, () => 'performance'],
  [/\bIntl\b/, () => 'Intl'],
  [/\btoLocale\w*/, (m) => m[0]],
  [/\blocaleCompare\b/, () => 'localeCompare'],
  [/\.\s*normalize\s*\(/, () => 'String.prototype.normalize'],
  [/\.\s*to(Lower|Upper)Case\s*\(/, (m) => `to${m[1]}Case`],
  [/\bnew\s+RegExp\b/, () => 'new RegExp'],
  [/(?<!\.\s*)(?<![\w$])(document|window|navigator|localStorage|sessionStorage|indexedDB|caches|fetch|XMLHttpRequest|crypto|setTimeout|setInterval|requestAnimationFrame|requestIdleCallback|queueMicrotask|setImmediate|globalThis|process|require|eval|Function|console|TextEncoder|TextDecoder|Atomics|SharedArrayBuffer|WeakRef|FinalizationRegistry)(?![\w$])/, (m) => m[1]],
  [/(?<!\.\s*)(?<![\w$])import\s*\(/, () => 'a dynamic import()'],
];

/**
 * E02 over one engine module: the bans, over the whole code with its
 * strings and comments blanked (one issue per ban per line, at the line
 * where the match starts); and \p{ or \P{ (Unicode property escapes) in
 * the code with its comments blanked but its literals kept. E04 runs the
 * same bans over the sound's synthesis (lintDsp), under its own code.
 * @param {string} file
 * @param {string} code
 * @param {{code?: string, who?: string, why?: string}} [o]
 * @returns {Issue[]}
 */
export function lintEngine(file, code, { code: rc = 'E02', who = 'the engine', why = 'BUILD_PLAN 6.6; GAME_DESIGN E.12' } = {}) {
  /** @type {Issue[]} */
  const out = [];
  const add = (line, what) => out.push({ file, line, code: rc, msg: `${who} may not use ${what} (${why})` });
  const scan = scanJs(code);
  const starts = [0];
  for (let k = 0; k < scan.masked.length; k++) if (scan.masked[k] === '\n') starts.push(k + 1);
  const lineAt = (at) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= at) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
  /** @type {{line: number, k: number, what: string}[]} */
  const found = [];
  const seen = new Set();
  ENGINE_BANS.forEach(([re, what], k) => {
    for (const m of scan.masked.matchAll(new RegExp(re.source, `${re.flags.replace('g', '')}g`))) {
      const line = lineAt(m.index);
      if (seen.has(`${line} ${k}`)) continue;
      seen.add(`${line} ${k}`);
      found.push({ line, k, what: what(m) });
    }
  });
  found.sort((a, b) => a.line - b.line || a.k - b.k).forEach((f) => add(f.line, f.what));
  scan.code0.split('\n').forEach((row, i) => {
    if (/\\[pP]\{/.test(row)) add(i + 1, 'a Unicode property escape (\\p{...})');
  });
  return out;
}

/**
 * E03 over one engine module: every static import and re-export resolves
 * to an existing file inside web/js/engine/.
 * @param {string} file repo-relative, under web/js/engine/
 * @param {string} code
 * @param {string} root the repo
 * @returns {Issue[]}
 */
export function lintEngineImports(file, code, root) {
  /** @type {Issue[]} */
  const out = [];
  const scan = scanJs(code);
  const masked = scan.masked;
  const re = /(?<![\w$.])(?:import|export)\b[^;'"`]*?\bfrom\s*(["'])|(?<![\w$.])import\s*(["'])/g;
  for (const m of masked.matchAll(re)) {
    const at = m.index + m[0].length - 1;
    const lit = scan.literals.find((l) => l.start === at);
    if (!lit || lit.value === null) continue;
    const spec = lit.value;
    const target = spec.startsWith('.') ? posix.normalize(posix.join(posix.dirname(file), spec)) : spec;
    const line = lit.line;
    if (!target.startsWith(`${ENGINE_DIR}/`)) out.push({ file, line, code: 'E03', msg: `"${spec}" is outside the engine: web/js/engine/ imports only web/js/engine/ (BUILD_PLAN 2.3; GAME_DESIGN E.2)` });
    else if (!existsSync(join(root, ...target.split('/')))) out.push({ file, line, code: 'E03', msg: `"${spec}" is not a file in the engine` });
  }
  return out;
}

/** E04: the sound's synthesis, held to the engine's bans. */
export const DSP_MODULE = 'web/js/audio/dsp.js';

/**
 * E04 over the synthesis module: E02's bans (so its samples are the same
 * bits in V8 and JavaScriptCore), and every static import an existing
 * module inside web/js/engine/ (its math): never the DOM, the page's
 * modules or a clock.
 * @param {string} file repo-relative
 * @param {string} code
 * @param {string} root the repo
 * @returns {Issue[]}
 */
export function lintDsp(file, code, root) {
  const why = 'BUILD_PLAN 13.5; GAME_DESIGN 13.11';
  const out = lintEngine(file, code, { code: 'E04', who: 'dsp.js', why });
  const scan = scanJs(code);
  const re = /(?<![\w$.])(?:import|export)\b[^;'"`]*?\bfrom\s*(["'])|(?<![\w$.])import\s*(["'])/g;
  for (const m of scan.masked.matchAll(re)) {
    const at = m.index + m[0].length - 1;
    const lit = scan.literals.find((l) => l.start === at);
    if (!lit || lit.value === null) continue;
    const spec = lit.value;
    const target = spec.startsWith('.') ? posix.normalize(posix.join(posix.dirname(file), spec)) : spec;
    if (!target.startsWith(`${ENGINE_DIR}/`)) out.push({ file, line: lit.line, code: 'E04', msg: `"${spec}" is outside the engine: dsp.js imports only the engine's pure modules (${why})` });
    else if (!existsSync(join(root, ...target.split('/')))) out.push({ file, line: lit.line, code: 'E04', msg: `"${spec}" is not a file in the engine` });
  }
  out.sort((a, b) => a.line - b.line);
  return out;
}

/**
 * J01 for the sound's files (content/audio/sounds.json and credits.json):
 * each against its schema, through the audio reader (tools/listen.mjs).
 * @param {string} [root]
 * @returns {Issue[]}
 */
export function lintAudio(root = ROOT) {
  const a = loadAudio(root);
  return a.errors.map((e) => ({ file: e.file, line: e.line, code: 'J01', msg: e.msg }));
}

/** S01: where storage may be named. */
export const STORAGE_MODULE = 'web/js/platform/storage.js';
export const WORKER = 'web/sw.js';
const STORAGE_APIS = /(?<![\w$])(localStorage|sessionStorage|indexedDB|caches)(?![\w$])/g;

/**
 * S01 over one module under web/: the storage APIs only in storage.js, and
 * oph. and oph- names only there and in the worker.
 * @returns {Issue[]}
 */
export function lintStorage(file, code) {
  /** @type {Issue[]} */
  const out = [];
  if (file === STORAGE_MODULE) return out;
  const scan = scanJs(code);
  if (file.startsWith('web/js/')) {
    scan.masked.split('\n').forEach((row, i) => {
      for (const m of row.matchAll(STORAGE_APIS)) out.push({ file, line: i + 1, code: 'S01', msg: `${m[1]} only in platform/storage.js, which names every key and cache by channel (E.9)` });
    });
  }
  if (file !== WORKER) {
    for (const lit of scan.literals) {
      const head = lit.chunks[0] || '';
      if (/^oph[.-]/.test(head)) out.push({ file, line: lit.line, code: 'S01', msg: `"${head}" is a storage name: make it with platform/storage.js (keyName, dbName, cacheName), which adds the channel` });
    }
  }
  return out;
}

function walk(dir) {
  const out = [];
  let names = [];
  try {
    names = readdirSync(dir).sort();
  } catch {
    return out;
  }
  for (const n of names) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

/**
 * J01, R01 and X01: the content compiled for preview's screens (the
 * superset of main's), so every file is validated, every expression
 * checked, and every reference in what a build ships resolved
 * (tools/content.mjs, the same compiler the build runs).
 * @param {string} [root]
 * @returns {Issue[]}
 */
export function lintContent(root = ROOT) {
  const screens = channelScreens(readText(root, { strict: false }), 'preview');
  return compileContent({ root, screens }).problems.map((p) => ({ file: p.file, line: p.line, code: p.code, msg: p.msg, ...(p.level === 'warn' ? { level: /** @type {'warn'} */ ('warn') } : {}) }));
}

/** Run every rule over the repo. */
export function runLint(root = ROOT) {
  /** @type {Issue[]} */
  const issues = [];
  const rel = (p) => relative(root, p).split(sep).join('/');
  const sources = loadPicSources(join(root, 'content', 'art', 'pics'));
  issues.push(...lintPictures(sources).map((i) => ({ ...i, file: `content/art/pics/${i.file}` })));
  const recipes = loadRecipes(join(root, 'content', 'art', 'recipes.json'), join(root, 'schemas', 'recipes.schema.json'));
  issues.push(...lintRecipes(recipes, sources));
  issues.push(...lintCompositions(recipes, sources));
  issues.push(...lintPalette('content/art/palette.json', loadPalette(join(root, 'content', 'art', 'palette.json'))));
  for (const dir of ['web', 'content']) {
    for (const f of walk(join(root, dir))) {
      if (!TEXT_EXT.has(extname(f)) && !f.endsWith('.webmanifest')) continue;
      const text = readFileSync(f, 'utf8');
      issues.push(...lintText(rel(f), text));
      if (dir === 'web') issues.push(...lintUrls(rel(f), text));
      if (dir === 'web' && extname(f) === '.js') issues.push(...lintStorage(rel(f), text));
    }
  }
  const shell = join(root, 'web', 'index.html');
  issues.push(...lintShell('web/index.html', readFileSync(shell, 'utf8')));
  for (const m of PURE_MODULES) issues.push(...lintPure(m, readFileSync(join(root, m), 'utf8')));
  for (const f of walk(join(root, ...ENGINE_DIR.split('/')))) {
    if (extname(f) !== '.js') continue;
    const code = readFileSync(f, 'utf8');
    issues.push(...lintEngine(rel(f), code));
    issues.push(...lintEngineImports(rel(f), code, root));
  }
  if (existsSync(join(root, ...DSP_MODULE.split('/')))) issues.push(...lintDsp(DSP_MODULE, readFileSync(join(root, ...DSP_MODULE.split('/')), 'utf8'), root));
  issues.push(...lintContent(root));
  issues.push(...lintAudio(root));
  issues.push(...lintGraph(root));
  issues.push(...runTextLint(root).issues);
  return issues;
}

/** Errors fail the lint; warnings are printed and counted. */
export const isError = (i) => (i.level || 'error') !== 'warn';

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain && process.argv.includes('--rules')) {
  console.log(formatRules());
} else if (isMain) {
  const issues = runLint();
  for (const i of issues) console.log(`${i.file}:${i.line}: ${i.code} ${i.msg}${isError(i) ? '' : ' (warning)'}`);
  const n = issues.filter(isError).length;
  const w = issues.length - n;
  const warned = w ? `; ${w} warning${w === 1 ? '' : 's'}` : '';
  console.log(n ? `lint: ${n} problem${n === 1 ? '' : 's'}${warned}` : `lint: clean (${codeRanges(activeCodes())})${warned}`);
  process.exit(n ? 1 : 0);
}
