#!/usr/bin/env node
// The type check (BUILD_PLAN 2.1, 6.5; GAME_DESIGN E.3): JSDoc-checked
// JavaScript, never .ts, so the code ships exactly as written. TypeScript is
// the one dev dependency, pinned exactly in package-lock.json; `tsc` runs
// once per project, because the DOM and WebWorker libraries conflict in one:
//
//   jsconfig.json         web/js/**          ES2022, DOM, DOM.Iterable (the page)
//   jsconfig.engine.json  web/js/engine/**   ES2022 only (no DOM, no Node: the engine is pure)
//   jsconfig.worker.json  web/sw.js          ES2022, WebWorker (the service worker)
//   jsconfig.worklet.json web/js/audio/limiter.worklet.js
//                                            ES2022 and types/audioworklet.d.ts (the
//                                            limiter's AudioWorklet scope; S5)
//
// `npm run typecheck` (in `npm run ci`, after the lint). If TypeScript is
// missing from node_modules, or isn't the lockfile's version, it runs
// `npm ci --ignore-scripts --no-audit --no-fund` first: the deploy's preview
// job runs main's tools/preview.mjs, which runs `npm run ci` in the preview
// branch's worktree with no install step, and this keeps that green. If the
// registry can't be reached, it says so plainly and fails. Tools
// (tools/*.mjs) aren't type-checked: that would need @types/node, a second
// dependency the plan doesn't call for.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './pics.mjs';

/** The four projects, in the order they run. */
export const PROJECTS = Object.freeze(['jsconfig.json', 'jsconfig.engine.json', 'jsconfig.worker.json', 'jsconfig.worklet.json']);
/** The install, exactly as the workflows run it. */
export const INSTALL = ['ci', '--ignore-scripts', '--no-audit', '--no-fund'];

/**
 * The TypeScript version the lockfile pins, or null when it pins none.
 * @param {string} [root]
 */
export function lockedVersion(root = ROOT) {
  try {
    const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
    const ts = lock.packages && lock.packages['node_modules/typescript'];
    return ts && typeof ts.version === 'string' ? ts.version : null;
  } catch {
    return null;
  }
}

/**
 * The TypeScript version in node_modules, or null when it isn't installed.
 * @param {string} [root]
 */
export function installedVersion(root = ROOT) {
  try {
    return JSON.parse(readFileSync(join(root, 'node_modules', 'typescript', 'package.json'), 'utf8')).version || null;
  } catch {
    return null;
  }
}

/**
 * Pure: does node_modules need `npm ci` before tsc can run?
 * @param {{locked: string | null, installed: string | null}} v
 */
export function needsInstall({ locked, installed }) {
  return !installed || installed !== locked;
}

/**
 * Pure: the error lines in tsc's output ("file(line,col): error TSnnnn: ...").
 * @param {string} out
 */
export function errorLines(out) {
  return String(out)
    .split('\n')
    .filter((l) => /\berror TS\d+:/.test(l));
}

/**
 * Run the four projects. Returns {errors: {project, lines}[], total}.
 * @param {{root?: string, log?: (s: string) => void}} [o]
 */
export function typecheck({ root = ROOT, log = (s) => console.log(s) } = {}) {
  const locked = lockedVersion(root);
  if (!locked) throw new Error('typecheck: package-lock.json pins no typescript (npm install --save-dev --save-exact typescript)');
  if (needsInstall({ locked, installed: installedVersion(root) })) {
    log(`typecheck: installing typescript ${locked} (npm ${INSTALL.join(' ')})`);
    try {
      execFileSync('npm', INSTALL, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      const why = /** @type {any} */ (e).stderr ? String(/** @type {any} */ (e).stderr).trim().split('\n').slice(-3).join(' ') : String(e);
      throw new Error(`typecheck: npm couldn't install typescript ${locked}; is the registry reachable? (${why})`);
    }
    if (installedVersion(root) !== locked) throw new Error(`typecheck: npm ran, but node_modules has typescript ${installedVersion(root)}, not the lockfile's ${locked}`);
  }
  const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  const errors = [];
  let total = 0;
  for (const project of PROJECTS) {
    if (!existsSync(join(root, project))) throw new Error(`typecheck: ${project} is missing`);
    let out = '';
    try {
      out = execFileSync(process.execPath, [tsc, '-p', project, '--pretty', 'false'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
    } catch (e) {
      const err = /** @type {any} */ (e);
      out = `${err.stdout || ''}${err.stderr || ''}`;
      if (!errorLines(out).length) throw new Error(`typecheck: tsc -p ${project} failed: ${out.trim() || err.message}`);
    }
    const lines = errorLines(out);
    total += lines.length;
    if (lines.length) errors.push({ project, lines });
  }
  return { version: locked, errors, total };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    const r = typecheck();
    for (const { project, lines } of r.errors) for (const l of lines) console.log(`${project}: ${l}`);
    console.log(r.total ? `typecheck: ${r.total} error${r.total === 1 ? '' : 's'} (typescript ${r.version})` : `typecheck: clean (typescript ${r.version}; ${PROJECTS.join(', ')})`);
    process.exit(r.total ? 1 : 0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
