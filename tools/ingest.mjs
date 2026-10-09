#!/usr/bin/env node
// Ingest (BUILD_PLAN 3.2, 6.5, S4; GAME_DESIGN 4.1, E.4, E.5): the research
// in design/data/ to the game's generated content.
//
//   npm run ingest                    write every generated file, the report
//                                     and the lock
//   node tools/ingest.mjs --check     re-run in memory and fail on any byte
//                                     difference (the first differing path and
//                                     line), on any error and on any
//                                     unexplained warning
//
// A run, in order (the spec's A1):
//   1. Read and parse every input (INPUTS; IG01 on a parse error).
//   2. Normalize each region, merge the seven by id and apply the overlays
//      (tools/ingest/regions.mjs).
//   3. The other generators, in GENERATORS' order (track B's conditions,
//      permits, climate, the sun tables, the catalogs and the gazetteer):
//      each is (ctx) => {files, entries, counts?, estimates?, doubts?}; ctx
//      holds the parsed inputs and the normalized park. Generators never
//      write: this module owns the files, the lock and the report.
//   4. IG21 over every generated JSON file outside content/text/: no
//      English (every string value outside $comment is an id, a segment
//      id, a date, a URL or a hash). The gazetteer, under content/text/,
//      is the one generated file of words.
//   5. Write (or compare) the files, content/park/ingest_report.md and
//      content/park/ingest_lock.json: {inputs: {path: sha256}, tools:
//      sha256, outputs: {path: sha256}}.
//
// Generated JSON is byte-stable: keys sorted at every level, one-space
// indent, a final newline, no clocks, no absolute paths. The build's step 0
// calls checkLock(), which only hashes (fast); the full re-run is
// test/unit/ingest.test.mjs's, so `npm run ci` re-runs ingest once.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './pics.mjs';
import { ingestRegions, OUT_DIR } from './ingest/regions.mjs';
import { explain, renderReport, sortEntries } from './ingest/report.mjs';
import { conditions, CONDITIONS_DIR } from './ingest/conditions.mjs';
import { climate } from './ingest/climate.mjs';
import { permits } from './ingest/permits.mjs';
import { catalogs } from './ingest/catalogs.mjs';
import { gazetteer } from './ingest/gazetteer.mjs';
import { DATA_DOUBTS } from './ingest/doubts.mjs';
import { sunGenerator } from './sun.mjs';

/**
 * Every input, hashed into the lock: a file, or a folder and the extension
 * of the files read from it. A missing input is skipped (a later session's
 * file), and a new one moves the lock.
 */
export const INPUTS = Object.freeze([
  { dir: 'design/data/regions', ext: '.json' },
  { file: 'design/data/park_rules.json' },
  { file: 'design/data/gear_catalog.json' },
  { file: 'design/data/food_catalog.json' },
  { dir: 'content/park/overlays', ext: '.json' },
  { dir: 'content/park/vocab', ext: '.json' },
  { file: 'content/park/ingest_known.json' },
  { file: 'content/rules/movement.json' },
  { file: 'content/rules/kits.json' },
  { file: 'content/gear/look_rules.json' },
  { file: 'content/stores/stores.json' },
  { file: 'content/text/names/places_extra.json' },
  { file: 'content/scope/m1a.json' },
]);

/**
 * The code a run depends on, hashed into the lock: ingest's own modules, the
 * sun tool, and the engine modules it routes the presets with.
 */
export const TOOLS = Object.freeze([{ file: 'tools/ingest.mjs' }, { dir: 'tools/ingest', ext: '.mjs' }, { file: 'tools/sun.mjs' }, { file: 'web/js/engine/graph.js' }, { file: 'web/js/engine/movement.js' }]);

/** The report and the lock. */
export const REPORT_FILE = 'content/park/ingest_report.md';
export const LOCK_FILE = 'content/park/ingest_lock.json';
export const KNOWN_FILE = 'content/park/ingest_known.json';
/** Folders that hold only generated files, so a stale file in one is a difference. */
export const GENERATED_DIRS = Object.freeze([OUT_DIR, CONDITIONS_DIR, 'content/data']);

/**
 * Track B's generators, in the order they run (A1 step 4). Each is
 * (ctx) => {files: {path: object | string}, entries, counts?, estimates?, doubts?}.
 * The conditions come first: they set ctx.conditions_date, which the
 * daylight table's window starts from.
 * @type {{name: string, run: (ctx: any) => any}[]}
 */
export const GENERATORS = [
  { name: 'conditions', run: conditions },
  { name: 'permits', run: permits },
  { name: 'climate', run: climate },
  { name: 'sun', run: sunGenerator },
  { name: 'catalogs', run: catalogs },
  { name: 'gazetteer', run: gazetteer },
];

const byCode = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** A value with its object keys sorted at every level. */
export function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort(byCode)) out[k] = sortKeys(v[k]);
    return out;
  }
  return v;
}

/** The generated JSON format: sorted keys, one-space indent, a final newline. */
export const stableJson = (v) => `${JSON.stringify(sortKeys(v), null, 1)}\n`;

/** The files a list of inputs names under root, sorted, as repo paths. */
export function listFiles(root, list) {
  const out = [];
  for (const x of list) {
    if (x.file) {
      if (existsSync(join(root, x.file))) out.push(x.file);
      continue;
    }
    const dir = join(root, x.dir);
    if (!existsSync(dir)) continue;
    for (const n of readdirSync(dir).sort(byCode)) if (n.endsWith(x.ext) && statSync(join(dir, n)).isFile()) out.push(`${x.dir}/${n}`);
  }
  return out;
}

/** The tools hash: sha256 over each tool file's path and bytes, in order. */
export function toolsHash(root) {
  const h = createHash('sha256');
  for (const f of listFiles(root, TOOLS)) {
    h.update(f);
    h.update('\0');
    h.update(readFileSync(join(root, f)));
    h.update('\0');
  }
  return h.digest('hex');
}

/** IG21: the strings generated content may hold. */
const IG21_OK = [
  /^[a-z][a-z0-9_]*$/, // an id or an enum
  /^[a-z][a-z0-9_]*->[a-z][a-z0-9_]*$/, // a segment id
  /^\d{4}-\d{2}-\d{2}$/, // an ISO date
  /^\d{2}-\d{2}$/, // a month and day
  /^https?:\/\/\S+$/, // a URL
  /^[0-9a-f]{8,64}$/, // a hash
  /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/, // a line id
  /^@[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/, // a content ref
  /^(?:design|content|tools|schemas|web)\/[A-Za-z0-9_./-]+$/, // a repo path
];

/**
 * IG21 over one generated value: every string outside $comment is code-shaped.
 * @param {string} file
 * @param {any} value
 */
export function englishIn(file, value) {
  const out = [];
  const visit = (v, path) => {
    if (typeof v === 'string') {
      if (!IG21_OK.some((re) => re.test(v))) out.push({ code: 'IG21', level: 'error', where: `${file}:${path}`, msg: `"${v.length > 60 ? `${v.slice(0, 57)}...` : v}" reads as English: research prose stays in design/data (words go to content/text)` });
    } else if (Array.isArray(v)) v.forEach((x, i) => visit(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (k !== '$comment') visit(x, path ? `${path}.${k}` : k);
  };
  visit(value, '');
  return out;
}

/**
 * IG20 over one generated value: every object that says estimate: true
 * carries its evidence, or the run's Estimates list names it (an entry whose
 * where is "<file>:<path>", or begins with the file's own name and a "/":
 * a region's estimates are listed by "<region>/...").
 * @param {string} file
 * @param {any} value
 * @param {{where: string}[]} estimates
 */
export function estimatesWithout(file, value, estimates) {
  const out = [];
  const base = file.split('/').pop().replace(/\.json$/, '');
  const listed = (path) => estimates.some((e) => e.where === `${file}:${path}` || e.where.startsWith(`${base}/`));
  const visit = (v, path) => {
    if (Array.isArray(v)) v.forEach((x, i) => visit(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') {
      const evidence = v.evidence;
      const has = (typeof evidence === 'string' && evidence.trim()) || (Array.isArray(evidence) && evidence.length);
      if (v.estimate === true && !has && !listed(path)) out.push({ code: 'IG20', level: 'error', where: `${file}:${path || '(the file)'}`, msg: 'an estimate without its evidence (beside it, or in the report\'s Estimates)' });
      for (const [k, x] of Object.entries(v)) if (k !== '$comment') visit(x, path ? `${path}.${k}` : k);
    }
  };
  visit(value, '');
  return out;
}

/**
 * Read every input, parse the JSON ones, and build the generators' context.
 * @param {string} root
 */
export function readInputs(root) {
  const entries = [];
  /** @type {Map<string, string>} */
  const texts = new Map();
  /** @type {Map<string, any>} */
  const parsed = new Map();
  for (const f of listFiles(root, INPUTS)) {
    const text = readFileSync(join(root, f), 'utf8');
    texts.set(f, text);
    try {
      parsed.set(f, JSON.parse(text));
    } catch (e) {
      entries.push({ code: 'IG01', level: 'error', where: f, msg: `not JSON: ${e.message}` });
    }
  }
  const json = (f) => (parsed.has(f) ? parsed.get(f) : null);
  const under = (dir) => [...parsed.keys()].filter((f) => f.startsWith(`${dir}/`)).sort(byCode);
  const overlays = {};
  for (const f of under('content/park/overlays')) {
    const name = f.slice('content/park/overlays/'.length, -'.json'.length);
    if (name !== 'park') overlays[name] = json(f);
  }
  const ctx = {
    root,
    texts,
    json,
    sources: {
      regions: under('design/data/regions').map((f) => ({ file: f, data: json(f) })),
      park_rules: json('design/data/park_rules.json'),
      gear_catalog: json('design/data/gear_catalog.json'),
      food_catalog: json('design/data/food_catalog.json'),
    },
    overlays,
    points: json('content/park/overlays/park.json'),
    vocab: { hazards: json('content/park/vocab/hazards.json') || { tags: {}, not_hazards: {} }, zones: json('content/park/vocab/zones.json') || { regions: {} } },
    scope: json('content/scope/m1a.json') || {},
    known: json(KNOWN_FILE) || {},
    movement: json('content/rules/movement.json'),
    kits: json('content/rules/kits.json'),
    look_rules: json('content/gear/look_rules.json'),
    stores: json('content/stores/stores.json'),
    places_extra: json('content/text/names/places_extra.json'),
    /** @type {any} the normalized park, set once the regions are in */
    park: null,
  };
  return { ctx, entries };
}

/**
 * Run ingest in memory.
 * @param {{root?: string}} [o]
 * @returns {{files: Map<string, string>, entries: any[], unexplained: any[], stale: string[], report: string, ctx: any}}
 */
export function runIngest({ root = ROOT } = {}) {
  const { ctx, entries } = readInputs(root);
  /** @type {Map<string, string>} */
  const files = new Map();
  const counts = [];
  const estimates = [];
  const doubts = [];
  if (!ctx.movement) entries.push({ code: 'IG01', level: 'error', where: 'content/rules/movement.json', msg: 'missing: the presets are routed with it' });
  const regions = ingestRegions({ regions: ctx.sources.regions, hazards: ctx.vocab.hazards, zones: ctx.vocab.zones, overlays: ctx.overlays, scope: ctx.scope, movement: ctx.movement });
  ctx.park = regions;
  entries.push(...regions.entries);
  counts.push(...regions.counts);
  estimates.push(...regions.estimates);
  doubts.push(...regions.doubts, ...REGION_DOUBTS, ...DATA_DOUBTS);
  const add = (path, body) => {
    if (files.has(path)) entries.push({ code: 'IG01', level: 'error', where: path, msg: 'generated twice' });
    files.set(path, typeof body === 'string' ? body : stableJson(body));
    // The gazetteer is words by design (content/text/ holds every word); every other generated file holds none.
    if (typeof body !== 'string' && path.endsWith('.json') && !path.startsWith('content/text/')) entries.push(...englishIn(path, body));
  };
  for (const [path, body] of Object.entries(regions.files)) add(path, body);
  for (const g of GENERATORS) {
    const out = g.run(ctx) || {};
    for (const [path, body] of Object.entries(out.files || {})) add(path, body);
    entries.push(...(out.entries || []));
    counts.push(...(out.counts || []));
    estimates.push(...(out.estimates || []));
    doubts.push(...(out.doubts || []));
  }
  // IG20: every estimate a generated file carries has its evidence, beside it or in the report.
  for (const [path, text] of files) if (path.endsWith('.json')) entries.push(...estimatesWithout(path, JSON.parse(text), estimates));
  const inputs = [...ctx.texts.keys()];
  const sorted = sortEntries(entries);
  const report = renderReport({ entries: sorted, known: ctx.known, counts, estimates, doubts, sources: inputs });
  files.set(REPORT_FILE, report);
  const lock = {
    $comment: 'Generated by tools/ingest.mjs (BUILD_PLAN 3.2, 6.5): the sha256 of every input, of the ingest tools and of every generated file. The build refuses when they differ (run npm run ingest); test/unit/ingest.test.mjs re-runs ingest in full.',
    inputs: Object.fromEntries(inputs.map((f) => [f, sha256(ctx.texts.get(f))])),
    tools: toolsHash(root),
    outputs: Object.fromEntries([...files.keys()].sort(byCode).map((f) => [f, sha256(files.get(f))])),
  };
  files.set(LOCK_FILE, stableJson(lock));
  const { unexplained, stale } = explain(sorted, ctx.known);
  return { files: new Map([...files].sort((a, b) => byCode(a[0], b[0]))), entries: sorted, unexplained, stale, report, ctx };
}

/** The doubts the region data carries against the doc (the spec's section 8: D3 and D4). */
export const REGION_DOUBTS = Object.freeze([
  'D3. The loop has 49 segments with both ends among the 47 scope nodes, not 47 (BUILD_PLAN 3.4, M1A_DATA_CHECK): the extra two are the Hoh Lake Trail\'s, hoh_lake->c_b_flats_group_site and C.B. Flats to the Hoh Lake Trail junction, shared with hoh_olympus. Five of the 49 are map-only.',
  'D4. high_divide_loop_2n_classic day 2\'s via_note says Bogachiel Peak "from the west junction"; its gain_ft (1,600) and the router say the east spur. The miles are 4.5 either way.',
  'The Hoh Lake Trail\'s lower segment is one trail written both ways (hoh_olympus: hoh_lake_trail_junction->c_b_flats_group_site; sol_duc_high_divide the other way): one id, hoh_olympus\'s, since its region id sorts first. Likewise LaCrosse Pass (northeast_dose\'s id) and Low Divide to Lake Margaret (elwha_hurricane\'s).',
]);

/** The generated files on disk, under the generated folders, that a run didn't make. */
function strays(root, files) {
  const out = [];
  for (const d of GENERATED_DIRS) {
    const dir = join(root, d);
    if (!existsSync(dir)) continue;
    for (const n of readdirSync(dir).sort(byCode)) if (!files.has(`${d}/${n}`)) out.push(`${d}/${n}`);
  }
  return out;
}

/**
 * Write a run's files under root, and remove strays from the generated folders.
 * @param {string} root
 * @param {Map<string, string>} files
 */
export function writeFiles(root, files) {
  for (const s of strays(root, files)) rmSync(join(root, s), { force: true });
  for (const [path, text] of files) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
}

/**
 * The first difference between a run and the files on disk, or null.
 * @param {string} root
 * @param {Map<string, string>} files
 * @returns {{path: string, line: number, msg: string} | null}
 */
export function firstDifference(root, files) {
  for (const [path, text] of files) {
    const p = join(root, path);
    if (!existsSync(p)) return { path, line: 1, msg: 'missing (run npm run ingest)' };
    const disk = readFileSync(p, 'utf8');
    if (disk === text) continue;
    const a = disk.split('\n');
    const b = text.split('\n');
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return { path, line: i + 1, msg: `differs from a fresh run at line ${i + 1} (run npm run ingest): on disk ${JSON.stringify((a[i] ?? '').slice(0, 80))}, fresh ${JSON.stringify((b[i] ?? '').slice(0, 80))}` };
  }
  const s = strays(root, files);
  if (s.length) return { path: s[0], line: 1, msg: 'is in a generated folder, but a fresh run makes no such file' };
  return null;
}

/**
 * The full check: a fresh run in memory, against the files on disk.
 * @param {{root?: string}} [o]
 */
export function checkIngest({ root = ROOT } = {}) {
  const run = runIngest({ root });
  const diff = firstDifference(root, run.files);
  return { ok: !diff && !run.unexplained.length && !run.stale.length, diff, unexplained: run.unexplained, stale: run.stale, run };
}

/**
 * The cheap check the build runs first (BUILD_PLAN 6.5, step 0): the inputs,
 * the tools and the outputs hash as the lock says.
 * @param {{root?: string}} [o]
 * @returns {{ok: boolean, problems: string[]}}
 */
export function checkLock({ root = ROOT } = {}) {
  const problems = [];
  const p = join(root, LOCK_FILE);
  if (!existsSync(p)) return { ok: false, problems: [`${LOCK_FILE} is missing`] };
  let lock;
  try {
    lock = JSON.parse(readFileSync(p, 'utf8'));
  } catch (e) {
    return { ok: false, problems: [`${LOCK_FILE} is not JSON: ${e.message}`] };
  }
  const inputs = listFiles(root, INPUTS);
  const locked = Object.keys(lock.inputs || {});
  for (const f of inputs) if (!locked.includes(f)) problems.push(`${f} is a new input`);
  for (const f of locked) {
    if (!inputs.includes(f)) problems.push(`${f} is gone`);
    else if (sha256(readFileSync(join(root, f))) !== lock.inputs[f]) problems.push(`${f} changed`);
  }
  if (toolsHash(root) !== lock.tools) problems.push('the ingest tools changed');
  const outputs = lock.outputs || {};
  for (const [f, h] of Object.entries(outputs)) {
    if (!existsSync(join(root, f))) problems.push(`${f} is missing`);
    else if (sha256(readFileSync(join(root, f))) !== h) problems.push(`${f} was edited (generated files are never hand-edited)`);
  }
  for (const d of GENERATED_DIRS) {
    const dir = join(root, d);
    if (existsSync(dir)) for (const n of readdirSync(dir)) if (!own(outputs, `${d}/${n}`)) problems.push(`${d}/${n} is not a generated file`);
  }
  return { ok: !problems.length, problems };
}

const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/** A one-line summary of a run's entries. */
export function summary(run) {
  const n = (lvl) => run.entries.filter((e) => e.level === lvl).length;
  return `ingest: ${run.files.size} files; ${n('error')} errors, ${n('warn')} warnings (${n('warn') - run.unexplained.filter((e) => e.level === 'warn').length} acknowledged), ${n('info')} fixes and notes`;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    if (process.argv.includes('--check')) {
      const c = checkIngest();
      console.log(summary(c.run));
      if (c.diff) console.log(`${c.diff.path}:${c.diff.line}: ${c.diff.msg}`);
      for (const e of c.unexplained) console.log(`${e.code} ${e.where}: ${e.msg}${e.level === 'warn' ? ' (warning, not acknowledged)' : ''}`);
      for (const k of c.stale) console.log(`${KNOWN_FILE}: "${k}" acknowledges nothing (stale)`);
      console.log(c.ok ? 'ingest --check: clean' : 'ingest --check: failed');
      process.exit(c.ok ? 0 : 1);
    } else {
      const run = runIngest();
      writeFiles(ROOT, run.files);
      console.log(summary(run));
      for (const e of run.unexplained) console.log(`${e.code} ${e.where}: ${e.msg}${e.level === 'warn' ? ' (warning, not acknowledged)' : ''}`);
      for (const k of run.stale) console.log(`${KNOWN_FILE}: "${k}" acknowledges nothing (stale)`);
      process.exit(run.unexplained.length || run.stale.length ? 1 : 0);
    }
  } catch (e) {
    console.error(e.stack || e.message);
    process.exit(1);
  }
}
