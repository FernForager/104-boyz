// The content compiler: content/ to data/rules.json and data/voice.json
// (BUILD_PLAN 2.7, 3.3, S3; GAME_DESIGN E.4, E.12).
//
// compileContent({root, screens, checkText}) -> {rules, voice, problems}
//   1. Validate every file under content/rules/, content/trips/ and
//      content/stops/ against its schema (by folder; J01: a file with no
//      schema, or one that doesn't validate).
//   2. Compile every "x-expr" field to its syntax tree and type-check it
//      against schemas/vars.json and the field's type (X01).
//   3. Check references (R01): every next, then, pass and fail names a stop
//      in its set; every set's first stop exists; ids are unique per set and
//      across files; every plan's start.set exists and its phase is a built
//      one; the profile and standard rules agree with themselves; and, with
//      checkText, every "@id" in a file this build ships is a defined line
//      (a file on a screen the build doesn't have waits for its words, as
//      T11 lets a line wait for its screen: an info, not a problem); and a
//      stop's view (S5) names nodes of the scope's park and a picture place
//      in content/art/recipes.json (checked once that file is there).
//   4. Scope: keep a plan or a stop set only when its screen is in
//      `screens`; the profile and standard rules always.
//   5. Split the outcome data (rules: logic, expressions as trees; the rules
//      hash covers it) from the display data (voice: each stop's line ids,
//      choice labels and view, and from S6 a rolled choice's fail word and
//      its Why sheet's "if it goes badly" line, and the odds' row labels; it
//      doesn't), so a word-only change can never move the rules hash (E.12).
//   S6 adds the odds (content/rules/odds.json, the section `odds`) and its
//   checks (R01): every rolled choice names a base and skills the odds know,
//   and stops of its own set; every walk and route is one the router can
//   make; an outcome stop's view stands where its walk ends; and the fair
//   death rules (fairDeath: GAME_DESIGN 9.5, 8.3; S9's fair-death lint
//   replaces them).
// Problems are lint issues ({file, line, code, msg}, and level 'warn' for
// a warning: a divisor whose declared range includes 0); the build refuses
// on any error. Infos are notes (a stop set's words still to come). compileSources() does the same for files given in memory (the engine
// fixture, tests).

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validate } from './schema.mjs';
import { parse, check } from '../web/js/engine/expr.js';
import { PHASES } from '../web/js/engine/phases/index.js';
import { canon } from '../web/js/engine/canon.js';
import { ROOT } from './pics.mjs';
import { readText, hasId } from './text.mjs';
import { checkScope, ships } from './scope.mjs';
import { compilePark, mapData } from './park.mjs';
import { B_SECTIONS, stripWords } from './sections.mjs';
import { buildGraph, route } from '../web/js/engine/graph.js';

/**
 * The files compiled, by path under content/, and the schema each takes
 * (BUILD_PLAN 2.6, 2.7; S4): the first pattern a file's path matches names
 * its schema, as a file name or from the match. A JSON file under one of
 * DIRS that no pattern matches, or whose schema is missing, is J01.
 * tools/textlint.mjs reads the same table for T10.
 * @type {readonly {pattern: RegExp, schema: string | ((m: RegExpExecArray) => string), owner: string}[]}
 */
export const FOLDERS = Object.freeze([
  { pattern: /^rules\/([a-z][a-z0-9_]*)\.json$/, schema: (m) => `${m[1]}.schema.json`, owner: 'S3; S4 movement (A), kits (B)' },
  { pattern: /^trips\/[^/]+\.json$/, schema: 'plans.schema.json', owner: 'S3' },
  { pattern: /^stops\/[^/]+\.json$/, schema: 'stops.schema.json', owner: 'S3' },
  { pattern: /^park\/regions\/[^/]+\.json$/, schema: 'park_region.schema.json', owner: 'S4 A (generated)' },
  { pattern: /^park\/overlays\/park\.json$/, schema: 'park_points.schema.json', owner: 'S4 A' },
  { pattern: /^park\/overlays\/[^/]+\.json$/, schema: 'park_overlay.schema.json', owner: 'S4 A' },
  { pattern: /^park\/vocab\/hazards\.json$/, schema: 'hazards.schema.json', owner: 'S4 A' },
  { pattern: /^park\/vocab\/zones\.json$/, schema: 'zones.schema.json', owner: 'S4 A' },
  { pattern: /^park\/ingest_known\.json$/, schema: 'ingest_known.schema.json', owner: 'S4 A' },
  { pattern: /^park\/ingest_lock\.json$/, schema: 'ingest_lock.schema.json', owner: 'S4 A (generated)' },
  { pattern: /^park\/conditions\/[^/]+\.json$/, schema: 'conditions.schema.json', owner: 'S4 B (generated)' },
  { pattern: /^park\/permits\.json$/, schema: 'permits.schema.json', owner: 'S4 B (generated)' },
  { pattern: /^data\/climate\.json$/, schema: 'climate.schema.json', owner: 'S4 B (generated)' },
  { pattern: /^data\/(?:daylight|quinault_sun)\.json$/, schema: 'sun.schema.json', owner: 'S4 B (generated)' },
  { pattern: /^gear\/items\.json$/, schema: 'gear_items.schema.json', owner: 'S4 B (generated)' },
  { pattern: /^gear\/look_rules\.json$/, schema: 'look_rules.schema.json', owner: 'S4 B' },
  { pattern: /^food\/items\.json$/, schema: 'food_items.schema.json', owner: 'S4 B (generated)' },
  { pattern: /^stores\/stores\.json$/, schema: 'stores.schema.json', owner: 'S4 B' },
  { pattern: /^drive\/routes\.json$/, schema: 'drives.schema.json', owner: 'S4 B' },
  { pattern: /^quiz\/locals\.json$/, schema: 'quiz.schema.json', owner: 'S4 B' },
  { pattern: /^scope\/[a-z][a-z0-9_]*\.json$/, schema: 'scope.schema.json', owner: 'S4 A' },
  { pattern: /^home\/cabin\.json$/, schema: 'cabin.schema.json', owner: 'S7 A' },
]);

/**
 * The data sections (tools/scope.mjs SECTIONS), each compiled from the
 * validated files: ({files: Map<path, {data, src}>, scope, add}) => the
 * section's rules data, or null when its sources aren't here. add(file,
 * line, code, msg) reports a problem. Track B registers its own here.
 * @type {Record<string, (ctx: {files: Map<string, {data: any, src: string}>, scope: any, add: (file: string, line: number, code: string, msg: string) => void}) => any>}
 */
export const SECTION_COMPILERS = {
  park: compilePark,
  odds: compileOdds,
  ...B_SECTIONS,
};

/** The odds' file (S6). */
export const ODDS_FILE = 'content/rules/odds.json';

/**
 * The odds section (S6): content/rules/odds.json's numbers, its words
 * (docs) and its row labels (display data: oddsVoice) dropped, or null when
 * the file isn't here. Its clamp must run low to high.
 * @param {{files: Map<string, {data: any, src: string}>, add: (file: string, line: number, code: string, msg: string) => void}} ctx
 */
export function compileOdds({ files, add }) {
  const f = files.get(ODDS_FILE);
  if (!f) return null;
  const d = f.data;
  if (!(d.clamp[0] < d.clamp[1])) add(ODDS_FILE, lineOfPath(f.src, 'clamp'), 'R01', `clamp [${d.clamp.join(', ')}] must run low to high`);
  /** @type {Record<string, {base: number}>} */
  const bases = {};
  for (const id of Object.keys(d.bases).sort(byCode)) bases[id] = { base: d.bases[id].base };
  return stripWords({ format: 1, clamp: d.clamp, shaky_cap: d.shaky_cap, great_below: d.great_below, routine_at: d.routine_at, skill_per_level: d.skill_per_level, bases });
}

/**
 * The odds' display data (voice.json's odds): each base's and each skill's
 * Why-sheet row label, by id, or null when the file isn't here.
 * @param {Map<string, {data: any, src: string}>} files
 */
export function oddsVoice(files) {
  const f = files.get(ODDS_FILE);
  if (!f) return null;
  const labels = (/** @type {Record<string, {label: string}>} */ o) => Object.fromEntries(Object.keys(o).sort(byCode).map((k) => [k, lineId(o[k].label)]));
  return { bases: labels(f.data.bases), skills: labels(f.data.skills) };
}

/** The stops a choice can go to: then, a roll's pass and fail, and its odds' every band, fail and death. */
export function choiceTargets(c) {
  const out = [];
  if (c.then !== undefined) out.push(c.then);
  if (c.roll) out.push(c.roll.pass, c.roll.fail);
  if (c.odds) {
    out.push(c.odds.clean, c.odds.shaky);
    for (const f of c.odds.fail) {
      out.push(f.to);
      if (f.death) out.push(f.death.to, f.death.gentle);
    }
  }
  return out;
}

/**
 * The fair-death rules over one stop set (GAME_DESIGN 9.5, 8.3, F.3; S6's
 * check, which S9's fair-death lint replaces): a choice that needs a danger
 * named (needs: X) is reached only through a stop that names it first
 * (foreshadow: X) on every way there; a choice whose odds can kill sits
 * beside another choice that is sure, needs its danger named, and kills
 * only from a fail entry at rung 3 or more (so the choice is a diamond,
 * 8.1); a death goes to a death stop, and its gentle mode to one that
 * isn't; a death stop is reached only by a death (a fail entry's
 * death.to), never by a next, a then, a roll, a clean, a shaky or a fail's
 * own to, so nothing kills without a fatal share on its button first; and
 * a sure choice never rolls (it would show sure over its odds).
 * @param {any} set a stop set's data
 * @returns {{path: string, msg: string}[]}
 */
export function fairDeath(set) {
  const out = [];
  const byId = new Map(set.stops.map((/** @type {any} */ st) => [st.id, st]));
  /** The stops each stop leads to. */
  const next = (/** @type {any} */ st) => [...(st.next ? [st.next] : []), ...(st.choices || []).flatMap(choiceTargets)].filter((id) => byId.has(id));
  // Every danger named on every way to a stop, before it: IN(s) = the meet
  // of OUT over the ways in, OUT(s) = IN(s) and its own foreshadow.
  /** @type {Map<string, Set<string> | null>} null: not reached yet (the top) */
  const into = new Map(set.stops.map((/** @type {any} */ st) => [st.id, null]));
  into.set(set.first, new Set());
  for (let changed = true; changed; ) {
    changed = false;
    for (const st of set.stops) {
      const at = into.get(st.id);
      if (!at) continue;
      const outs = new Set(at);
      if (st.foreshadow) outs.add(st.foreshadow);
      for (const to of next(st)) {
        const had = into.get(to);
        const meet = had ? new Set([...had].filter((x) => outs.has(x))) : new Set(outs);
        if (!had || meet.size !== had.size) {
          into.set(to, meet);
          changed = true;
        }
      }
    }
  }
  /** A choice that rolls (odds, or S3's plain roll). */
  const rolls = (/** @type {any} */ c) => Boolean(c.odds || c.roll);
  /** A death stop, by id. */
  const deathStop = (/** @type {any} */ id) => {
    const to = byId.get(id);
    return Boolean(to && to.outcome === 'death');
  };
  set.stops.forEach((/** @type {any} */ st, /** @type {number} */ i) => {
    const named = into.get(st.id);
    if (deathStop(st.next)) out.push({ path: `stops[${i}].next`, msg: `stop "${st.id}": next goes to death stop "${st.next}"; a death stop is reached only by a death, from a diamond with a fatal share on its button (9.5, F.3)` });
    (st.choices || []).forEach((/** @type {any} */ c, /** @type {number} */ k) => {
      const path = `stops[${i}].choices[${k}]`;
      if (c.needs && named && !named.has(c.needs)) out.push({ path: `${path}.needs`, msg: `stop "${st.id}": choice "${c.id}" needs "${c.needs}" named first, and a way to it passes no stop with foreshadow "${c.needs}" (9.5)` });
      if (c.tag === 'sure' && rolls(c)) out.push({ path: `${path}.tag`, msg: `stop "${st.id}": choice "${c.id}" is tagged sure and rolls; a sure choice never rolls (8.1)` });
      // Every way out of the choice but a death's own: none may lead to a death stop.
      /** @type {[string, any][]} */
      const ways = [];
      if (c.then !== undefined) ways.push(['then', c.then]);
      if (c.roll) ways.push(['roll.pass', c.roll.pass], ['roll.fail', c.roll.fail]);
      if (c.odds) {
        ways.push(['odds.clean', c.odds.clean], ['odds.shaky', c.odds.shaky]);
        c.odds.fail.forEach((/** @type {any} */ f, /** @type {number} */ j) => ways.push([`odds.fail[${j}].to`, f.to]));
      }
      for (const [where, to] of ways) if (deathStop(to)) out.push({ path: `${path}.${where.split('[')[0]}`, msg: `stop "${st.id}": choice "${c.id}"'s ${where} goes to death stop "${to}"; a death stop is reached only by a death, from a diamond with a fatal share on its button (9.5, F.3)` });
      const deadly = c.odds ? c.odds.fail.filter((/** @type {any} */ f) => f.death) : [];
      if (!deadly.length) return;
      if (!c.needs) out.push({ path, msg: `stop "${st.id}": choice "${c.id}" can kill, so it needs the danger it names foreshadowed (needs; 9.5, 8.3)` });
      if (!(st.choices || []).some((/** @type {any} */ x) => x !== c && x.tag === 'sure' && !rolls(x))) out.push({ path, msg: `stop "${st.id}": choice "${c.id}" can kill, and no choice beside it is sure (9.5)` });
      for (const f of deadly) {
        if (f.rung < 3) out.push({ path: `${path}.odds.fail`, msg: `stop "${st.id}": choice "${c.id}" kills from a fail at rung ${f.rung}; only a diamond can kill (rung 3 or more, 8.1)` });
        const dead = byId.get(f.death.to);
        const gentle = byId.get(f.death.gentle);
        if (dead && dead.outcome !== 'death') out.push({ path: `${path}.odds.fail`, msg: `stop "${st.id}": choice "${c.id}"'s death goes to "${f.death.to}", which is not a death stop (outcome: "death")` });
        if (gentle && gentle.outcome === 'death') out.push({ path: `${path}.odds.fail`, msg: `stop "${st.id}": choice "${c.id}"'s gentle mode goes to "${f.death.gentle}", a death stop: the gentle mode never kills (9.4)` });
      }
    });
    if (st.outcome === 'death' && !Object.prototype.hasOwnProperty.call(st, 'next')) out.push({ path: `stops[${i}]`, msg: `death stop "${st.id}" needs next (its one button ends the set, 9.5)` });
  });
  return out;
}

/** The folders under content/ whose JSON files are compiled (walked recursively); content/text/ and content/art/ have their own readers. */
export const DIRS = Object.freeze(['rules', 'trips', 'stops', 'park', 'data', 'gear', 'food', 'stores', 'drive', 'quiz', 'scope', 'home']);

/**
 * The schema a content file takes, by its path under content/
 * ("park/regions/coast.json"), or null when no pattern matches.
 * @param {string} rel
 * @returns {string | null}
 */
export function schemaFor(rel) {
  for (const f of FOLDERS) {
    const m = f.pattern.exec(rel);
    if (m) return typeof f.schema === 'string' ? f.schema : f.schema(m);
  }
  return null;
}

/** @typedef {{file: string, line: number, code: string, msg: string, level?: 'error' | 'warn'}} Problem */
/** @typedef {{file: string, folder: string, name: string, src: string}} Source */

/**
 * The line each value starts on in a JSON source, by its path ("stops[1].next",
 * the form the schema validator reports; "" is the whole file).
 * @param {string} src valid JSON
 * @returns {Map<string, number>}
 */
export function jsonLines(src) {
  const out = new Map();
  let i = 0;
  let line = 1;
  const ws = () => {
    while (i < src.length && ' \t\n\r'.includes(src[i])) {
      if (src[i] === '\n') line++;
      i++;
    }
  };
  const str = () => {
    let j = i + 1;
    while (src[j] !== '"') j += src[j] === '\\' ? 2 : 1;
    const v = JSON.parse(src.slice(i, j + 1));
    i = j + 1;
    return v;
  };
  const value = (path) => {
    ws();
    out.set(path, line);
    const c = src[i];
    if (c === '{') {
      i++;
      ws();
      if (src[i] === '}') return void i++;
      for (;;) {
        ws();
        const k = str();
        ws();
        i++; // :
        value(path ? `${path}.${k}` : k);
        ws();
        if (src[i++] === '}') return undefined;
      }
    }
    if (c === '[') {
      i++;
      ws();
      if (src[i] === ']') return void i++;
      for (let n = 0; ; n++) {
        value(`${path}[${n}]`);
        ws();
        if (src[i++] === ']') return undefined;
      }
    }
    if (c === '"') return void str();
    while (i < src.length && !',]}'.includes(src[i]) && !' \t\n\r'.includes(src[i])) i++;
    return undefined;
  };
  value('');
  return out;
}

/** The line of a path in a JSON source, or of its nearest parent; 1 when it can't be read. */
export function lineOfPath(src, path) {
  let lines;
  try {
    lines = jsonLines(src);
  } catch {
    return 1;
  }
  let p = String(path === '(the file)' ? '' : path);
  for (;;) {
    if (lines.has(p)) return lines.get(p);
    const k = Math.max(p.lastIndexOf('.'), p.lastIndexOf('['));
    if (k < 0) return 1;
    p = p.slice(0, k);
  }
}

/**
 * Every content source under root/content/<DIRS>, walked recursively, as
 * {file, folder: the path of its folder under content/ ("park/regions"),
 * name: its base name, src}, sorted by path in code-unit order.
 * @param {string} [root]
 */
export function readSources(root = ROOT) {
  /** @type {Source[]} */
  const out = [];
  const walk = (folder) => {
    const dir = join(root, 'content', ...folder.split('/'));
    if (!existsSync(dir)) return;
    for (const n of readdirSync(dir).sort(byCode)) {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) walk(`${folder}/${n}`);
      else if (n.endsWith('.json')) out.push({ file: `content/${folder}/${n}`, folder, name: n.slice(0, -5), src: readFileSync(p, 'utf8') });
    }
  };
  for (const folder of DIRS) walk(folder);
  return out;
}

const byCode = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** Every schema under root/schemas, by file name, and vars.json. */
export function readSchemas(root = ROOT) {
  const dir = join(root, 'schemas');
  /** @type {Record<string, any>} */
  const schemas = {};
  if (existsSync(dir)) for (const n of readdirSync(dir).sort()) if (n.endsWith('.json')) schemas[n] = JSON.parse(readFileSync(join(dir, n), 'utf8'));
  return schemas;
}

/** "@trail.x" -> "trail.x". */
const lineId = (v) => v.slice(1);

/** A box (one "@id", a list of variants, or a list of slots) as slots of variant ids. */
export function boxSlots(box) {
  if (typeof box === 'string') return [[lineId(box)]];
  if (!box.length) return []; // a quiet stop: no box (decision 32)
  if (box.every((b) => typeof b === 'string')) return [box.map(lineId)];
  return box.map((slot) => slot.map(lineId));
}

/**
 * Compile sources given in memory.
 * @param {{sources: Source[], schemas: Record<string, any>, screens: string[], defined?: ((id: string) => boolean) | null, sections?: 'ships' | 'all'}} o
 *   defined: is a line id defined (null: don't check text refs)
 *   sections: 'ships' puts a data section in rules.json only when the
 *   screens meet its ships list (the build); 'all' puts every compiled one
 *   in (tests, goldens and the lint)
 *   places: the picture places (content/art/recipes.json's places) a
 *   stop's view.pic must name, or null when the recipes aren't there to
 *   check against (an info, not a problem)
 * @returns {{rules: any, voice: any, problems: Problem[], infos: string[], sections: Record<string, any>, map: any}}
 */
export function compileSources({ sources, schemas, screens, defined = null, sections = 'ships', places = null }) {
  /** @type {Problem[]} */
  const problems = [];
  /** @type {string[]} */
  const infos = [];
  const add = (file, line, code, msg) => problems.push({ file, line, code, msg });
  const vars = schemas['vars.json'] || { vars: {} };
  /** @type {any} */
  let profile = null;
  /** @type {any} */
  let standard = null;
  /** @type {Map<string, {data: any, file: string, src: string}>} */
  const plans = new Map();
  /** @type {Map<string, {data: any, file: string, src: string}>} */
  const sets = new Map();

  /** Files that failed validation, so their absence doesn't cascade into more problems. */
  const broken = new Set();
  /** Every file that validated, by path: its data (no $comment) and its source. */
  /** @type {Map<string, {data: any, src: string}>} */
  const valid = new Map();
  for (const s of sources) {
    const at = (path) => lineOfPath(s.src, path);
    const schemaName = schemaFor(`${s.folder}/${s.name}.json`);
    const schema = schemaName ? schemas[schemaName] : null;
    if (!schema) {
      add(s.file, 1, 'J01', `no schema for it (schemas/${schemaName || '?'})`);
      continue;
    }
    let data;
    try {
      data = JSON.parse(s.src);
    } catch (e) {
      add(s.file, 1, 'J01', `not JSON: ${e.message}`);
      continue;
    }
    const v = validate(schema, data);
    for (const e of v.errors) add(s.file, at(e.path), 'J01', `${e.path} ${e.msg}`);
    if (v.errors.length) {
      broken.add(s.folder === 'rules' ? `rules/${s.name}` : `${s.folder}/${data && typeof data.id === 'string' ? data.id : s.name}`);
      continue;
    }
    // Expressions: compile each to its tree, and type-check it.
    for (const a of v.annotations) {
      if (a.keyword !== 'x-expr') continue;
      try {
        const ast = parse(a.value);
        const c = check(ast, vars, a.arg);
        for (const msg of c.errors) add(s.file, at(a.path), 'X01', `${a.path}: ${msg} in "${a.value}"`);
        for (const msg of c.warnings) problems.push({ file: s.file, line: at(a.path), code: 'X01', level: 'warn', msg: `${a.path}: ${msg} in "${a.value}" (a division whose divisor can be 0 throws at run time)` });
        if (!c.errors.length) setPath(data, a.path, ast);
      } catch (e) {
        add(s.file, at(a.path), 'X01', `${a.path}: ${e.message}`);
      }
    }
    if (defined) {
      // A file on a screen this build doesn't have needs no words yet (as T11
      // lets a line wait for its screen); one this build ships does.
      const ships = typeof data.screen !== 'string' || screens.includes(data.screen);
      for (const a of v.annotations) {
        if (a.keyword !== 'x-text' || defined(lineId(a.value))) continue;
        if (ships) add(s.file, at(a.path), 'R01', `${a.path}: ${a.value} is not a line in content/text`);
        else infos.push(`${s.file}: ${a.value} is not a line yet (screen ${data.screen} waits)`);
      }
    }
    // A file whose expressions failed is still registered, so nothing cascades
    // from it; its problems already stop the build.
    const { $comment, ...body } = data;
    valid.set(s.file, { data: body, src: s.src });
    if (s.folder === 'rules' && s.name === 'profile') profile = body;
    else if (s.folder === 'rules' && s.name === 'standard') standard = body;
    else if (s.folder === 'trips') {
      if (plans.has(body.id)) add(s.file, at('id'), 'R01', `plan "${body.id}" is also ${plans.get(body.id).file}`);
      else plans.set(body.id, { data: body, file: s.file, src: s.src });
    } else if (s.folder === 'stops') {
      if (sets.has(body.id)) add(s.file, at('id'), 'R01', `stop set "${body.id}" is also ${sets.get(body.id).file}`);
      else sets.set(body.id, { data: body, file: s.file, src: s.src });
    }
  }

  if (!profile && !broken.has('rules/profile')) add('content/rules/profile.json', 1, 'J01', 'the profile rules are missing');
  if (!standard && !broken.has('rules/standard')) add('content/rules/standard.json', 1, 'J01', 'the standard profile is missing');
  const checkProfile = (p, file, path) => {
    if (!p || !profile) return;
    if (!profile.fitness_levels.includes(p.fitness)) add(file, 1, 'R01', `${path}.fitness "${p.fitness}" is not one of the fitness levels`);
    const want = [...profile.skills].sort();
    const got = Object.keys(p.skills).sort();
    if (canon(want) !== canon(got)) add(file, 1, 'R01', `${path}.skills has {${got.join(', ')}}, but the rules' skills are {${want.join(', ')}}`);
  };
  if (profile) checkProfile(profile.open_start, 'content/rules/profile.json', 'open_start');
  if (standard) {
    checkProfile(standard.hiker, 'content/rules/standard.json', 'hiker');
    checkProfile(standard.runner, 'content/rules/standard.json', 'runner');
  }

  // References within each set.
  for (const [id, { data, file, src }] of sets) {
    const at = (k) => lineOfPath(src, k);
    const ids = new Set();
    for (const st of data.stops) {
      if (ids.has(st.id)) add(file, at(`stops`), 'R01', `stop "${st.id}" twice in set "${id}"`);
      ids.add(st.id);
    }
    if (!ids.has(data.first)) add(file, at('first'), 'R01', `first stop "${data.first}" is not in set "${id}"`);
    const phase = Object.prototype.hasOwnProperty.call(PHASES, data.phase) ? PHASES[data.phase] : null;
    if (!phase) add(file, at('phase'), 'R01', `"${data.phase}" is not a phase`);
    else if (!phase.built) add(file, at('phase'), 'R01', `phase "${data.phase}" is built in ${phase.lands}, not yet`);
    else if (phase.level !== 'trip') add(file, at('phase'), 'R01', `phase "${data.phase}" is not a trip phase`);
    data.stops.forEach((st, i) => {
      const need = (to, path) => {
        if (to !== null && !ids.has(to)) add(file, lineOfPath(src, `stops[${i}].${path}`), 'R01', `stop "${st.id}": ${path} "${to}" is not a stop in set "${id}"`);
      };
      if (Object.prototype.hasOwnProperty.call(st, 'next')) need(st.next, 'next');
      const seen = new Set();
      (st.choices || []).forEach((c) => {
        if (seen.has(c.id)) add(file, lineOfPath(src, `stops[${i}].choices`), 'R01', `stop "${st.id}": choice "${c.id}" twice`);
        seen.add(c.id);
        if (c.then !== undefined) need(c.then, `choices.${c.id}.then`);
        if (c.roll) {
          need(c.roll.pass, `choices.${c.id}.roll.pass`);
          need(c.roll.fail, `choices.${c.id}.roll.fail`);
        }
        if (c.odds) {
          need(c.odds.clean, `choices.${c.id}.odds.clean`);
          need(c.odds.shaky, `choices.${c.id}.odds.shaky`);
          c.odds.fail.forEach((f, k) => {
            need(f.to, `choices.${c.id}.odds.fail[${k}].to`);
            if (f.death) {
              need(f.death.to, `choices.${c.id}.odds.fail[${k}].death.to`);
              need(f.death.gentle, `choices.${c.id}.odds.fail[${k}].death.gentle`);
            }
          });
        }
      });
      // An outcome stop (S6) stands where its walk ends, and ends the set.
      if (st.outcome) {
        if (!st.walk) add(file, lineOfPath(src, `stops[${i}]`), 'R01', `outcome stop "${st.id}" needs the walk that brought you there`);
        else if (st.view && st.view.node !== st.walk.to) add(file, lineOfPath(src, `stops[${i}].view.node`), 'R01', `outcome stop "${st.id}": its view stands at "${st.view.node}", but its walk ends at "${st.walk.to}"`);
        if (st.next !== null) add(file, lineOfPath(src, `stops[${i}]`), 'R01', `outcome stop "${st.id}" ends the set (next: null)`);
      } else if (st.add_s !== undefined) add(file, lineOfPath(src, `stops[${i}].add_s`), 'R01', `stop "${st.id}": add_s is an outcome's time (outcome)`);
      if (st.walk && st.choices) add(file, lineOfPath(src, `stops[${i}].walk`), 'R01', `stop "${st.id}" has choices: a walk is Walk on's, or an outcome's`);
    });
    for (const p of fairDeath(data)) add(file, lineOfPath(src, p.path), 'R01', p.msg);
  }
  for (const [id, { data, file, src }] of plans) {
    const set = sets.get(data.start.set);
    if (!set && broken.has(`stops/${data.start.set}`)) continue;
    if (!set) add(file, lineOfPath(src, 'start.set'), 'R01', `plan "${id}" starts at "${data.start.set}", which is not a stop set`);
    else if (screens.includes(data.screen) && !screens.includes(set.data.screen)) add(file, lineOfPath(src, 'screen'), 'R01', `plan "${id}" is on screen ${data.screen}, but its set is on ${set.data.screen}, which this build doesn't have`);
  }

  // The scope file (R01): its switches and sections against tools/scope.mjs.
  const scopeFile = [...valid.keys()].find((f) => /^content\/scope\/[^/]+\.json$/.test(f));
  const scope = scopeFile ? /** @type {{data: any, src: string}} */ (valid.get(scopeFile)).data : null;
  if (scopeFile && scope) for (const p of checkScope(scope)) add(scopeFile, lineOfPath(/** @type {{data: any, src: string}} */ (valid.get(scopeFile)).src, p.path), 'R01', `${p.path}: ${p.msg}`);

  // A stop's view (S5, display data): its node and its day's points are
  // nodes of the scope's park, and its picture is a place in the recipes.
  const scopeNodes = scope && scope.park && Array.isArray(scope.park.nodes) ? new Set(scope.park.nodes) : null;
  for (const [id, { data, file, src }] of sets) {
    data.stops.forEach((st, i) => {
      if (!st.view) return;
      const at = (/** @type {string} */ k) => lineOfPath(src, `stops[${i}].view.${k}`);
      if (scopeNodes) {
        if (!scopeNodes.has(st.view.node)) add(file, at('node'), 'R01', `stop "${st.id}": view.node "${st.view.node}" is not a node in the scope's park (${scopeFile})`);
        st.view.day.forEach((n, k) => {
          if (!scopeNodes.has(n)) add(file, at(`day[${k}]`), 'R01', `stop "${st.id}": view.day "${n}" is not a node in the scope's park (${scopeFile})`);
        });
      }
      if (places) {
        if (!places.has(st.view.pic)) add(file, at('pic'), 'R01', `stop "${st.id}": view.pic "${st.view.pic}" is not a place in content/art/recipes.json`);
      } else infos.push(`${file}: stop "${st.id}" view.pic "${st.view.pic}" waits for content/art/recipes.json to check against (set ${id})`);
    });
  }

  // The data sections (S4): each compiled whenever its sources are here, and
  // in rules.json only when the channel's screens meet its ships list (or
  // sections is 'all', for tests and lints).
  /** @type {Record<string, any>} */
  const compiled = {};
  for (const [name, compile] of Object.entries(SECTION_COMPILERS)) {
    const out = compile({ files: valid, scope, add });
    if (out !== null && out !== undefined) compiled[name] = out;
  }

  // The odds' names and the router's walks (S6): a rolled choice's base and
  // skills are the odds', and every walk and route is one the router makes.
  const odds = compiled.odds || null;
  const oddsWords = oddsVoice(valid);
  /** @type {import('../web/js/engine/graph.js').Graph | null} */
  let graph = null;
  try {
    graph = compiled.park ? buildGraph(compiled.park) : null;
  } catch {
    graph = null; // the park's own lints report it
  }
  for (const [id, { data, file, src }] of sets) {
    data.stops.forEach((st, i) => {
      const walks = [];
      if (st.walk) walks.push([st.walk, `stops[${i}].walk`]);
      (st.choices || []).forEach((c, k) => {
        const at = (/** @type {string} */ p) => lineOfPath(src, `stops[${i}].choices[${k}].${p}`);
        if (c.route) walks.push([c.route, `stops[${i}].choices[${k}].route`]);
        if (!c.odds) return;
        if (!odds || !oddsWords) {
          add(file, at('odds'), 'R01', `stop "${st.id}": choice "${c.id}" has odds, and there is no ${ODDS_FILE}`);
          return;
        }
        if (!Object.prototype.hasOwnProperty.call(odds.bases, c.odds.base)) add(file, at('odds.base'), 'R01', `stop "${st.id}": choice "${c.id}": "${c.odds.base}" is not a base in ${ODDS_FILE}`);
        c.odds.mods.forEach((m, n) => {
          if (!Object.prototype.hasOwnProperty.call(oddsWords.skills, m.skill)) add(file, at(`odds.mods[${n}]`), 'R01', `stop "${st.id}": choice "${c.id}": the skill "${m.skill}" has no row in ${ODDS_FILE}'s skills`);
          else if (profile && !profile.skills.includes(m.skill)) add(file, at(`odds.mods[${n}]`), 'R01', `stop "${st.id}": choice "${c.id}": "${m.skill}" is not one of the profile's skills`);
        });
      });
      if (!graph) {
        if (walks.length && screens.includes(data.screen)) infos.push(`${file}: set ${id}'s walks wait for the park to check against`);
        return;
      }
      for (const [w, path] of walks) {
        const tries = [[w.from, ...(w.via || []), w.to]];
        if (w.exposed_to) tries.push([w.from, ...(w.via || []), w.exposed_to]);
        for (const pts of tries) {
          try {
            route(graph, pts);
          } catch (e) {
            add(file, lineOfPath(src, path), 'R01', `stop "${st.id}": the router can't walk ${pts.join(' > ')}: ${e.message}`);
          }
        }
      }
    });
  }

  // Scope and split.
  /** @type {any} */
  const rules = { format: 1, profile, standard, plans: {}, stops: {} };
  for (const name of Object.keys(compiled).sort()) if (sections === 'all' || ships(scope, name, screens)) rules[name] = compiled[name];
  const voice = { format: 1, stops: {} };
  for (const id of [...plans.keys()].sort()) {
    const p = plans.get(id).data;
    if (!screens.includes(p.screen)) continue;
    rules.plans[id] = { mode: p.mode, start: p.start, after: p.after };
  }
  for (const id of [...sets.keys()].sort()) {
    const s = sets.get(id).data;
    if (!screens.includes(s.screen)) continue;
    rules.stops[id] = {
      phase: s.phase,
      first: s.first,
      stops: s.stops.map((st) => {
        // A stop's logic (S6): its walk, an outcome's severity and extra time, and the danger it names.
        const more = {};
        for (const k of ['walk', 'add_s', 'outcome', 'foreshadow']) if (st[k] !== undefined) more[k] = st[k];
        if (!st.choices) return { id: st.id, next: st.next, ...more };
        return {
          id: st.id,
          ...more,
          choices: st.choices.map((c) => {
            const { label, fail_word, badly, ...logic } = c;
            return logic;
          }),
        };
      }),
    };
    voice.stops[id] = {};
    for (const st of s.stops) {
      const labels = {};
      /** @type {Record<string, string>} */
      const failWords = {};
      /** @type {Record<string, string>} */
      const badly = {};
      for (const c of st.choices || []) {
        labels[c.id] = lineId(c.label);
        if (c.fail_word) failWords[c.id] = lineId(c.fail_word);
        if (c.badly) badly[c.id] = lineId(c.badly);
      }
      /** @type {any} */
      const v = st.view ? { box: boxSlots(st.box), labels, view: st.view } : { box: boxSlots(st.box), labels };
      if (Object.keys(failWords).length) v.fail_words = failWords;
      if (Object.keys(badly).length) v.badly = badly;
      voice.stops[id][st.id] = v;
    }
  }
  // The odds' row labels go with the odds (S6).
  if (rules.odds && oddsWords) voice.odds = oddsWords;
  // x-voice values (every "@id", and a stop's view) are display data: none may reach the rules.
  const text = canon(rules);
  if (text.includes('"@')) add('tools/content.mjs', 1, 'J01', 'an x-voice value reached rules.json; it belongs in voice.json');
  if (Object.values(rules.stops).some((set) => set.stops.some((/** @type {any} */ st) => Object.prototype.hasOwnProperty.call(st, 'view')))) add('tools/content.mjs', 1, 'J01', "a stop's view reached rules.json; it belongs in voice.json");
  problems.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line));
  // The pencil map's display data (data/map.json), for a channel with the map screen.
  const map = screens.includes('map') || sections === 'all' ? mapData({ files: valid, scope }) : null;
  return { rules: JSON.parse(text), voice, problems, infos, sections: compiled, map };
}

/** Set a value at a schema path ("stops[1].choices[0].roll.p"). */
function setPath(obj, path, value) {
  const parts = [];
  for (const m of String(path).matchAll(/([^.[\]]+)|\[(\d+)\]/g)) parts.push(m[2] !== undefined ? Number(m[2]) : m[1]);
  let at = obj;
  for (let i = 0; i < parts.length - 1; i++) at = at[parts[i]];
  at[parts[parts.length - 1]] = value;
}

/**
 * Compile the repo's content for a channel's screens.
 * @param {{root?: string, screens: string[], checkText?: boolean, defined?: ((id: string) => boolean) | null}} o
 *   defined: how to tell a defined line (default: content/text, read with tools/text.mjs).
 *   A stop's view.pic is checked against content/art/recipes.json when it's there (recipePlaces).
 * @returns {{rules: any, voice: any, problems: Problem[], infos: string[]}}
 */
export function compileContent({ root = ROOT, screens, checkText = true, defined, sections = 'ships' }) {
  let isDefined = null;
  if (checkText) isDefined = defined || textLines(root);
  return compileSources({ sources: readSources(root), schemas: readSchemas(root), screens, defined: isDefined, sections, places: recipePlaces(root) });
}

/**
 * The picture places a stop's view may name: the keys of
 * content/art/recipes.json's places (S5, track B's file), or null when the
 * file isn't there yet. A recipes file that won't parse is null too: the
 * picture lints (P13) report it.
 * @param {string} root
 * @returns {Set<string> | null}
 */
export function recipePlaces(root = ROOT) {
  const p = join(root, 'content', 'art', 'recipes.json');
  if (!existsSync(p)) return null;
  try {
    const data = JSON.parse(readFileSync(p, 'utf8'));
    return new Set(Object.keys((data && data.places) || {}));
  } catch {
    return null;
  }
}

/** Is a line id defined in root/content/text/en, or a place or term in content/text/names (tools/text.mjs)? */
function textLines(root) {
  const text = readText(root, { strict: false });
  return (id) => hasId(text, id);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const k = process.argv.indexOf('--screens');
  const screens = k > 0 ? process.argv[k + 1].split(',') : ['app', 'debug', 'guestbook', 'title', 'trail'];
  const { rules, voice, problems } = compileContent({ screens });
  for (const p of problems) console.log(`${p.file}:${p.line}: ${p.code} ${p.msg}`);
  if (!problems.length) console.log(JSON.stringify({ rules, voice }, null, 1));
  process.exit(problems.length ? 1 : 0);
}
