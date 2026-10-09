// The rules hash (BUILD_PLAN 14.1 T0, S3; GAME_DESIGN E.12, 9.10).
//
// What a result depends on: the engine's code and the outcome data, never
// the words. rulesHash(outDir) is the first 12 hex of
//   sha256("oph-rules\0" + for each file, by path: path + "\0" + bytes + "\0")
// over every file under js/engine/ and data/rules.json, sorted by path in
// code-unit order. Not voice.json, text/, art/, the UI, the CSS or the
// worker, so a word-only or a voice-only change leaves it alone, and a byte
// in the engine or a stop's next moves it. The build stamps it in
// version.json and on <html data-rules>; a timed mode will pin it (T1), and
// a bug report names it, so tools/play.mjs --replay can check it rebuilt
// the report's own rules.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { ROOT } from './pics.mjs';

/** The prefix, so this hash can never be mistaken for another. */
export const RULES_PREFIX = 'oph-rules\0';
/** Where the engine sits in a build (and under web/ in the source). */
export const ENGINE_DIR = 'js/engine';
/** The outcome data's file in a build. */
export const RULES_FILE = 'data/rules.json';

const byCode = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** Every file under dir, as paths relative to base, with "/" separators. */
function walk(dir, base) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    const rel = `${base}/${n}`;
    if (statSync(p).isDirectory()) out.push(...walk(p, rel));
    else out.push({ path: rel, file: p });
  }
  return out;
}

/**
 * The hash over a list of files.
 * @param {{path: string, bytes: Uint8Array | string}[]} files
 * @returns {string} 12 lowercase hex
 */
export function rulesHashOf(files) {
  const h = createHash('sha256');
  h.update(RULES_PREFIX);
  for (const f of [...files].sort((a, b) => byCode(a.path, b.path))) {
    h.update(f.path);
    h.update('\0');
    h.update(f.bytes);
    h.update('\0');
  }
  return h.digest('hex').slice(0, 12);
}

/**
 * The files a build's rules hash covers: js/engine/** and data/rules.json.
 * @param {string} outDir a built channel (dist/<channel>)
 */
export function rulesFiles(outDir) {
  const files = walk(join(outDir, ENGINE_DIR), ENGINE_DIR).map(({ path, file }) => ({ path, bytes: readFileSync(file) }));
  const rules = join(outDir, RULES_FILE);
  if (!existsSync(rules)) throw new Error(`rules: ${RULES_FILE} is missing from the build`);
  files.push({ path: RULES_FILE, bytes: readFileSync(rules) });
  return files;
}

/**
 * A built channel's rules hash.
 * @param {string} outDir
 */
export function rulesHash(outDir) {
  return rulesHashOf(rulesFiles(outDir));
}

/**
 * The rules hash a build of this tree would stamp, from the source engine
 * (web/js/engine/, copied as is) and the rules.json text the data step
 * writes, so Node can load content without a build (the smoke run, tests).
 * @param {{root?: string, rulesJson: string}} o
 */
export function sourceRulesHash({ root = ROOT, rulesJson }) {
  const files = walk(join(root, 'web', ENGINE_DIR), ENGINE_DIR).map(({ path, file }) => ({ path, bytes: readFileSync(file) }));
  files.push({ path: RULES_FILE, bytes: rulesJson });
  return rulesHashOf(files);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const dir = process.argv[2] || join(ROOT, 'dist', 'main');
  try {
    console.log(rulesHash(dir));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
