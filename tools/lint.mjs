#!/usr/bin/env node
// The lint, session-1 rules (BUILD_PLAN 4.8, 6.7; GAME_DESIGN 11.8, F.3).
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
//   U01 URLs stay relative: the same build is served at / and at /preview/
// Code:
//   E01 the picture VM and the palette stay pure: no Math.random, no Date,
//       no clock, no DOM
//   S01 storage names (GAME_DESIGN E.9, F.3): in web/js/ only
//       platform/storage.js touches localStorage, sessionStorage, indexedDB
//       or caches, and no string starting oph. or oph- appears in web/
//       outside storage.js and sw.js, so every key and cache name carries
//       its channel and main and preview never share a save

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderPic, LAYERS, MAX_STAMP_DEPTH } from '../web/js/gfx/picvm.js';
import { ROOT, loadPicSources, loadPalette } from './pics.mjs';
import { runTextLint, scanJs } from './textlint.mjs';

const GOLD_SLOT = 7;
const GLOW = 19;
const GOLD = new Set([GOLD_SLOT, GLOW]);
const DUST = 25;
const TEXT_EXT = new Set(['.html', '.css', '.js', '.mjs', '.json', '.webmanifest', '.pic', '.md', '.txt', '.svg']);
export const PURE_MODULES = ['web/js/gfx/picvm.js', 'web/js/gfx/palette.js'];

/** @typedef {{file: string, line: number, code: string, msg: string, level?: 'error' | 'warn'}} Issue */

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
  issues.push(...runTextLint(root).issues);
  return issues;
}

/** Errors fail the lint; warnings are printed and counted. */
export const isError = (i) => (i.level || 'error') !== 'warn';

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const issues = runLint();
  for (const i of issues) console.log(`${i.file}:${i.line}: ${i.code} ${i.msg}${isError(i) ? '' : ' (warning)'}`);
  const n = issues.filter(isError).length;
  const w = issues.length - n;
  const warned = w ? `; ${w} warning${w === 1 ? '' : 's'}` : '';
  console.log(n ? `lint: ${n} problem${n === 1 ? '' : 's'}${warned}` : `lint: clean (pictures, palette, T04, T06, T07, T10-T14, U01, E01, S01)${warned}`);
  process.exit(n ? 1 : 0);
}
