// The router's ban check (BUILD_PLAN 6.6, S4), not a test file itself: the
// bans in place before any engine module loads (as banfirst.mjs does for the
// trips), then every engine module imported, then the park on stdin
// (rules.park) built and routed: both loops, every camp's mile both ways.
// Prints {banned, loops, ccw, cw} as JSON.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { installBans } from './bans.mjs';

installBans();
const banned = (() => {
  try {
    Math.sin(1);
    return false;
  } catch {
    return true;
  }
})();

const engine = fileURLToPath(new URL('../../web/js/engine/', import.meta.url));
/** @param {string} dir @returns {string[]} */
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.js') ? [join(dir, e.name)] : []));
for (const f of walk(engine).sort()) await import(pathToFileURL(f).href);

const { buildGraph, route, distAlong } = await import(pathToFileURL(join(engine, 'graph.js')).href);
const { park, loops } = JSON.parse(readFileSync(0, 'utf8'));
const g = buildGraph(park);
const out = { banned, loops: loops.map((pts) => route(g, pts)).map((r) => [r.mi10, r.gain, r.loss, r.s]), ccw: distAlong(g, 'high_divide', 'ccw'), cw: distAlong(g, 'high_divide', 'cw') };
process.stdout.write(JSON.stringify(out));
