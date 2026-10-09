#!/usr/bin/env node
// The site assembly (GAME_DESIGN E.9; BUILD_PLAN 6.2, 6.3). GitHub Pages
// publishes one artifact as the whole site, so main's build goes at the root
// and preview's under preview/, and the two are uploaded together: two apps,
// two workers, two caches and two sets of saves, from one deployment.
//
//   node tools/assemble-site.mjs --main dist/main --preview <dir> --out site
//       Refuses a main that already holds preview/, a version.json or a
//       sw.js stamp that names the wrong channel. With no preview build,
//       /preview/ is a placeholder: one line of approved words, a link home,
//       no worker and no manifest.
//   node tools/assemble-site.mjs --check-live <url> <version.json>
//       Warns (never fails) when the live site has the same commit and
//       different files: a rebuild from a preview push must be byte for
//       byte main's, or every installed main app would see an update note.
//
// No .nojekyll and no CNAME: an Actions artifact skips Jekyll, and the
// custom domain lives in the repo's Pages settings. From T1 this adds
// daily/, fkt/ and e/, and the site branch.

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './pics.mjs';
import { readText, stateOf, wordsFor, PLACEHOLDER_IDS } from './text.mjs';

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The /preview/ placeholder, while there is no preview build: approved
 * words only (PLACEHOLDER_IDS), the preview's name and a link to main.
 * @param {Record<string, unknown>} words main's words, by id (wordsFor(text, 'main'))
 */
export function placeholderPage(words) {
  for (const id of PLACEHOLDER_IDS) {
    if (typeof words[id] !== 'string' || !words[id]) throw new Error(`assemble: the placeholder needs approved words for ${id}`);
  }
  const [title, home] = PLACEHOLDER_IDS.map((id) => escapeHtml(words[id]));
  return [
    '<!doctype html>',
    '<html lang="en">',
    `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>`,
    `<body><p><a href="../">${home}</a></p></body>`,
    '</html>',
    '',
  ].join('\n');
}

/** The placeholder's words, from the ledger: each must be approved (or changed, which keeps the ledger's). */
export function placeholderWords(root = ROOT) {
  const text = readText(root);
  for (const id of PLACEHOLDER_IDS) {
    const s = stateOf(id, text);
    if (s !== 'approved' && s !== 'changed') throw new Error(`assemble: ${id} is ${s}, and the placeholder ships approved words only`);
  }
  return wordsFor(text, 'main');
}

/** The version.json the placeholder carries. */
export const PLACEHOLDER_VERSION = { build: null, channel: 'preview', placeholder: true };

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

/** sw.js's stamp line: {channel, build, files}, or null. */
export function workerStamp(src) {
  const m = /^\/\/ oph-sw (\S+) (\S+) (\S+)$/m.exec(String(src).split('\n')[0] || '');
  return m ? { channel: m[1], build: m[2], files: m[3] } : null;
}

/**
 * Check one channel's build before it goes up: its version.json and its
 * worker's stamp both name the channel, and agree on the files.
 * @returns {string[]} problems
 */
export function checkChannel(dir, channel) {
  const problems = [];
  const version = readJson(join(dir, 'version.json'));
  if (!version) return [`${dir}: no version.json`];
  if (version.channel !== channel) problems.push(`${dir}/version.json is channel "${version.channel}", not ${channel}`);
  if (version.placeholder) return problems;
  const swPath = join(dir, 'sw.js');
  if (!existsSync(swPath)) return [...problems, `${dir}: no sw.js`];
  const stamp = workerStamp(readFileSync(swPath, 'utf8'));
  if (!stamp) problems.push(`${dir}/sw.js has no stamp (is it the unbuilt web/sw.js?)`);
  else {
    if (stamp.channel !== channel) problems.push(`${dir}/sw.js is stamped for "${stamp.channel}", not ${channel}`);
    if (stamp.files !== version.files) problems.push(`${dir}/sw.js is stamped with files ${stamp.files}, but version.json says ${version.files}`);
  }
  return problems;
}

const inside = (a, b) => a === b || a.startsWith(b + sep);

/**
 * Assemble the site: main at out/, preview at out/preview/ (or the
 * placeholder when preview is missing). Throws, and writes nothing, on a
 * build in the wrong place.
 * @param {{main: string, preview?: string, out: string, root?: string, words?: Record<string, unknown>}} o
 * @returns {{preview: 'build' | 'placeholder'}}
 */
export function assemble({ main, preview, out, root = ROOT, words }) {
  const m = resolve(main);
  const o = resolve(out);
  const p = preview && existsSync(preview) ? resolve(preview) : null;
  for (const d of [m, p].filter(Boolean)) {
    if (inside(d, o) || inside(o, d)) throw new Error(`assemble: ${out} and ${d} overlap`);
  }
  const problems = [];
  if (existsSync(join(m, 'preview'))) problems.push(`${main} already holds preview/: main's build never carries the other channel`);
  problems.push(...checkChannel(m, 'main'));
  if (p) problems.push(...checkChannel(p, 'preview'));
  if (problems.length) throw new Error(`assemble: refused:\n  ${problems.join('\n  ')}`);
  const placeholder = p ? null : placeholderPage(words || placeholderWords(root));

  rmSync(o, { recursive: true, force: true });
  cpSync(m, o, { recursive: true });
  const dest = join(o, 'preview');
  if (p) cpSync(p, dest, { recursive: true });
  else {
    mkdirSync(dest, { recursive: true });
    writeFileSync(join(dest, 'index.html'), placeholder);
    writeFileSync(join(dest, 'version.json'), `${JSON.stringify(PLACEHOLDER_VERSION, null, 2)}\n`);
  }
  return { preview: p ? 'build' : 'placeholder' };
}

/**
 * Pure: the live site against this build. 'warn' when the commit is the
 * same and the files differ (a rebuild that isn't byte for byte the same,
 * so every installed main app would see an update note); 'same' when both
 * match; 'new' otherwise (another commit, or nothing to compare).
 * @param {any} live the live version.json
 * @param {any} local this build's
 */
export function liveVerdict(live, local) {
  if (!live || !local || !live.commit || live.commit !== local.commit) return 'new';
  return live.files === local.files ? 'same' : 'warn';
}

/** --check-live: fetch the live version.json and compare. Never fails the run. */
export async function checkLive(url, localPath, { fetchFn = globalThis.fetch, log = console.log } = {}) {
  const local = readJson(localPath);
  let live = null;
  try {
    const res = await fetchFn(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (res.ok) live = await res.json();
  } catch {
    // offline, or the site is down: nothing to compare
  }
  const v = liveVerdict(live, local);
  if (v === 'warn') log(`::warning::main's files (${local.files}) differ from the live site's (${live.files}) at the same commit ${local.commit}: is Node pinned? Installed main apps will see an update note.`);
  else log(`check-live: ${v === 'same' ? 'the same commit and the same files as the live site' : live ? `a new commit (live: ${live.commit || 'none'})` : 'no live version.json to compare'}`);
  return v;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
  };
  try {
    const k = args.indexOf('--check-live');
    if (k >= 0) {
      await checkLive(args[k + 1], args[k + 2]);
    } else {
      const main = opt('--main');
      const out = opt('--out');
      if (!main || !out) throw new Error('usage: assemble-site.mjs --main <dir> [--preview <dir>] --out <dir>');
      const r = assemble({ main, preview: opt('--preview'), out });
      console.log(`assemble: ${out}/ holds main at /, and ${r.preview === 'build' ? "preview's build" : 'the placeholder'} at /preview/`);
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
