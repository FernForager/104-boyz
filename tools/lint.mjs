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
//   P10 a picture outside plates/, scenes/ or stamps/, a bad id, or a
//       duplicate id
//   P11 a layer switch inside a stamp
//   P12 a palette table that makes gold: a remap that turns another color
//       into 7, or a cycle other than the lily's glow (19) that passes
//       through it (content/art/palette.json)
// Text (web/ and content/):
//   T04 no "Golden Glow" (the book is inspiration only, doc 10.1)
//   T06 no phone links (tel:), and the shell carries the format-detection
//       meta, so iOS never turns a number into a Call link (doc E.7)
//   T07, T10-T14 the words: no book frame, no English outside
//       content/text/, ids defined and used, the ledger, variables, and
//       the main gate (tools/textlint.mjs; doc 18.5)
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
//   G08 the M1a scope's lists, map-only links, camps and loop gates
// Content (content/**: tools/content.mjs compiles it):
//   J01 every content file has a schema and validates against it
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
import { renderPic, LAYERS, MAX_STAMP_DEPTH } from '../web/js/gfx/picvm.js';
import { ROOT, loadPicSources, loadPalette } from './pics.mjs';
import { runTextLint, scanJs } from './textlint.mjs';
import { compileContent } from './content.mjs';
import { readText, channelScreens } from './text.mjs';
import { lintGraph } from './graphlint.mjs';

const GOLD_SLOT = 7;
const GLOW = 19;
const GOLD = new Set([GOLD_SLOT, GLOW]);
const DUST = 25;
const TEXT_EXT = new Set(['.html', '.css', '.js', '.mjs', '.json', '.webmanifest', '.pic', '.md', '.txt', '.svg']);
export const PURE_MODULES = ['web/js/gfx/picvm.js', 'web/js/gfx/palette.js'];

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
  rule('P10', 'pictures', 'BUILD_PLAN 4.2', 'a picture outside plates/, scenes/ or stamps/, a bad id, or a duplicate id'),
  rule('P11', 'pictures', 'BUILD_PLAN 4.2', 'a layer switch inside a stamp'),
  rule('P12', 'palette', 'BUILD_PLAN 4.7; GAME_DESIGN 11.4', 'a palette remap or cycle that makes bonfire gold'),
  rule('T04', 'text', 'GAME_DESIGN 10.1, F.3', 'no "Golden Glow" in shipped text'),
  rule('T06', 'text', 'GAME_DESIGN E.7, F.3', 'no phone links, and the shell carries the format-detection meta'),
  rule('T07', 'text', 'GAME_DESIGN F.3; BUILD_PLAN 10.5', 'no book words in player-facing text, outside the allowlist'),
  rule('T10', 'text', 'GAME_DESIGN 18.5; BUILD_PLAN 10.5', 'no original English outside content/text/'),
  rule('T11', 'text', 'GAME_DESIGN 18.5; BUILD_PLAN 10.5', 'an id used but not defined, or defined and never used'),
  rule('T12', 'text', 'GAME_DESIGN 18.5; BUILD_PLAN 10.4', 'the ledger: an entry with no answer, or a bad hash'),
  rule('T13', 'text', 'GAME_DESIGN 18.5; BUILD_PLAN 10.5', "variables that don't match; a placeholder where none may be"),
  rule('T14', 'text', 'GAME_DESIGN 18.6; BUILD_PLAN 10.6', 'the main gate: main ships approved words only'),
  rule('T16', 'text', 'GAME_DESIGN 18.2, 18.5; BUILD_PLAN 10.5, S4', 'a place missing from the gazetteer; an inexact quote; cut words'),
  rule('U01', 'urls', 'BUILD_PLAN 6.1', 'URLs stay relative: one build is served at / and at /preview/'),
  rule('E01', 'code', 'BUILD_PLAN 4.2', 'the picture VM and the palette stay pure'),
  rule('E02', 'code', 'BUILD_PLAN 6.6; GAME_DESIGN E.12', 'the engine is deterministic: the bans'),
  rule('E03', 'code', 'BUILD_PLAN 2.3; GAME_DESIGN E.2', 'the engine imports only the engine'),
  rule('S01', 'storage', 'GAME_DESIGN E.9, F.3', 'every storage key and cache name carries its channel'),
  rule('J01', 'content', 'BUILD_PLAN 2.7, S3; GAME_DESIGN F.3', 'every content file has a schema and validates against it'),
  rule('R01', 'content', 'GAME_DESIGN F.3', "next, then, pass, fail, a plan's start and its phase name what exists; ids unique; @ids are lines"),
  rule('X01', 'content', 'GAME_DESIGN F.3, 8.3; BUILD_PLAN S3', 'every expression parses and type-checks against schemas/vars.json'),
  rule('G01', 'park graph', 'GAME_DESIGN F.3; BUILD_PLAN S4', 'references: segment ends, hazards, presets, crossings, traffic, overlays, the scope and conditions resolve'),
  rule('G02', 'park graph', 'GAME_DESIGN F.3', 'every trailhead reaches a camp and every camp a trailhead, over routable segments'),
  rule('G03', 'park graph', 'GAME_DESIGN F.3, E.4', "elevation sanity: gain - loss meets the endpoints within 100 ft; no null elevation in the scope"),
  rule('G04', 'park graph', 'GAME_DESIGN E.4', 'a shared id whose records disagree by more than 100 ft'),
  rule('G05', 'park graph', 'GAME_DESIGN F.3; BUILD_PLAN S5', 'every place has a picture recipe (with content/art/recipes.json)', 'S5'),
  rule('G06', 'park graph', 'GAME_DESIGN F.3, 4.3', 'presets route and end at a trailhead; nothing names a phone-only camp'),
  rule('G07', 'park graph', 'M1A_DATA_CHECK item 1', "Bogachiel Peak is a spur, and no route between the plannable camps passes through one"),
  rule('G08', 'park graph', 'BUILD_PLAN 3.4; GAME_DESIGN 4.3, 4.6', "the M1a scope: real ids, the map-only links, no group or stock site plannable, every camp's fields, the loop's gates and forks"),
  rule('T15', 'text', 'BUILD_PLAN 10.5', "a line over its max", 'S5'),
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
  if (!src.kind) add(1, 'P10', 'pictures live in plates/, scenes/ or stamps/');
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
 * the code with its comments blanked but its literals kept.
 * @param {string} file
 * @param {string} code
 * @returns {Issue[]}
 */
export function lintEngine(file, code) {
  /** @type {Issue[]} */
  const out = [];
  const add = (line, what) => out.push({ file, line, code: 'E02', msg: `the engine may not use ${what} (BUILD_PLAN 6.6; GAME_DESIGN E.12)` });
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
  issues.push(...lintPictures(loadPicSources(join(root, 'content', 'art', 'pics'))).map((i) => ({ ...i, file: `content/art/pics/${i.file}` })));
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
  issues.push(...lintContent(root));
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
