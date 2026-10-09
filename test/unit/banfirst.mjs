// The ban test's child process (D11; BUILD_PLAN 6.6), not a test file
// itself: puts the bans in place before any engine module loads, so a
// module that keeps a Math function from its first run (const { exp } =
// Math) keeps the throwing one; then imports every engine module, runs
// every trip of the corpus on stdin (selfcheck.json's shape) and the
// self-check over it, and prints {banned, trips, groups} as JSON.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { installBans } from './bans.mjs';

installBans();
const banned = (() => {
  try {
    Math.exp(1);
    return false;
  } catch {
    return true;
  }
})();

const engine = fileURLToPath(new URL('../../web/js/engine/', import.meta.url));
/** @param {string} dir @returns {string[]} */
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.js') ? [join(dir, e.name)] : []));
for (const f of walk(engine).sort()) await import(pathToFileURL(f).href);

const { runTrip, runSelfCheck } = await import(pathToFileURL(join(engine, 'selfcheck.js')).href);
const { loadContent } = await import(pathToFileURL(join(engine, 'content.js')).href);
const corpus = JSON.parse(readFileSync(0, 'utf8'));
const trips = corpus.trips.map((t) => runTrip(t, loadContent(JSON.parse(JSON.stringify(corpus.fixture)))));
const { groups } = runSelfCheck(corpus);
process.stdout.write(JSON.stringify({ banned, trips, groups }));
