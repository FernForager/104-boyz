#!/usr/bin/env node
// The promotion's dry run (BUILD_PLAN 6.1, 10.6; S6). Main moves only at
// promotions: after the creator's OK the lead fast-forwards the main branch
// to preview's commit, and the deploy builds main's channel from it. This
// shows, before anyone does, exactly what main's channel would gain, and
// refuses when it would gain a word that isn't approved or a screen. The
// cabin's, S28's and the later promotions use it the same way.
//
//   node tools/promote.mjs --dry-run [--ref origin/main] [--out out/promotion]
//                                    [--check-live [https://ophiker.com/]] [--browser]
//   node tools/promote.mjs --dry-run --screens home,lockbox,guestbook,mailbox
//                                    (S7) what a promotion of those screens needs
//
//   --screens (S7, the cabin's promotion): main's words worked out as though
//   its scope carried these screens too (main.screens and them), with
//   preview's title screen (channels.preview.off: the title page's words
//   retire on main with the same promotion) and main.off's dev lines still
//   off; the ours lines main.off holds back today (the cover's description
//   and, from S7b, the title screen's prompt, waiting for B002) come back,
//   since the promotion is what they wait for.
//   It lists every line main would then reach that isn't approved, grouped
//   by the batch it is filed in (and any filed in none), in memory: main's
//   build would refuse such a scope, which is the point. Exit 0 when every
//   line it lists sits in a batch, 1 when one sits in none, 2 on a usage
//   error. The cabin's is exactly B002 and B003 (a test).
//
//   1. next: main's channel built from the working tree into <out>/next/
//      (tools/build.mjs), as the deploy would build it from preview's
//      commit.
//   2. live: --ref (origin/main, what ophiker.com serves) from git archive
//      into a scratch folder outside git, built there by its own tools with
//      GITHUB_ACTIONS cleared (outside git its build id is "dev", which a
//      build in Actions refuses), into <out>/live/. Without the ref (CI's
//      shallow checkout) it says so and reports next alone: this is a
//      session tool, not a CI check.
//   3. The report, on stdout and in <out>/report.json: main's words (every
//      id its bundle ships, with its words, its state and where it shows,
//      and T14 over what was built) and how they differ from live's; its
//      screens; the files added, removed and changed, each split into those
//      main's page reaches (its precache's paths and the worker: what an
//      installed app downloads) and those shipped for file parity and never
//      loaded; the shell's theme color and the manifest's two; the precache's
//      count and bytes; the rules hash. <out>/cover_icons.png puts live's
//      cover and four icons above next's, in that order, each drawn by its
//      own build.
//   4. --check-live: the live site's version.json, precache.json and page
//      against <out>/live/: the same commit, and the same bytes but the
//      build stamp, so live/ is what main serves today. Never fails the run.
//   5. --browser: the update itself in headless Chromium (Playwright, loaded
//      as tools/shots.mjs loads it): live/ served at the root and its worker
//      installed (the offline stamp shows), then next/ in its place; a reload
//      offers the update note, Restart takes the new build, and it opens
//      again offline. Pictures of each step go in <out>/update-*.png.
//
// Exit 0 when main would carry only approved words on the same screens, 1
// when it wouldn't (each problem listed), 2 on a usage error or a build that
// fails. It never pushes, never moves a branch and never writes outside
// <out> and its scratch folder.

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './pics.mjs';
import { build, ICONS, SW_STAMP, UNLISTED } from './build.mjs';
import { readText, stateOf, mainReach, shellSources, checkMainBuild, batchOf, SHIPPABLE } from './text.mjs';
import { encodePNG, decodePNG } from './png.mjs';

/** What the live site is built from. */
export const DEFAULT_REF = 'origin/main';
/** The live site. */
export const LIVE_URL = 'https://ophiker.com/';
/** The lists every build rewrites (its version and its precache), so they always differ. */
export const LISTS = Object.freeze(['precache.json', 'version.json']);
/** The cover the icons are drawn from (tools/build.mjs). */
const COVER = 'cover_high_divide_dusk';
/** The runner's files a step writes to change later steps (as tools/preview.mjs strips them). */
const RUNNER_FILES = ['GITHUB_ENV', 'GITHUB_OUTPUT', 'GITHUB_PATH', 'GITHUB_STATE', 'GITHUB_STEP_SUMMARY'];

/**
 * Pure: the environment the live ref's build runs in: ours, less
 * GITHUB_ACTIONS (outside git the build id is "dev", which the build
 * refuses in Actions) and the runner's files, with CHANNEL=main.
 * @param {Record<string, string | undefined>} env
 */
export function liveEnv(env) {
  const out = { ...env, CHANNEL: 'main' };
  for (const k of ['GITHUB_ACTIONS', ...RUNNER_FILES]) delete out[k];
  return out;
}

/**
 * Every file under dir, as {repo-style path: bytes}, sorted.
 * @param {string} dir
 * @returns {Record<string, Buffer>}
 */
export function snapshot(dir) {
  /** @type {Record<string, Buffer>} */
  const out = {};
  const walk = (d) => {
    for (const n of readdirSync(d).sort()) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else out[relative(dir, p).split(sep).join('/')] = readFileSync(p);
    }
  };
  walk(dir);
  return out;
}

/**
 * Pure: a built file with its build stamp taken out, so two builds of the
 * same sources compare equal: sw.js's four stamped lines go back to the
 * placeholders, and the page loses its data-build and data-commit values and
 * its bare build code (stamp.build between two tags). Any other file is as
 * it is.
 * @param {string} path
 * @param {Buffer} buf
 * @param {{build?: string | null}} [stamp]
 * @returns {Buffer}
 */
export function unstamp(path, buf, stamp = {}) {
  if (path === 'sw.js') {
    const lines = buf.toString('utf8').split('\n');
    if (/^\/\/ oph-sw \S+ \S+ \S+$/.test(lines[0] || '')) lines.splice(0, SW_STAMP.length, ...SW_STAMP);
    return Buffer.from(lines.join('\n'));
  }
  if (path === 'index.html') {
    let s = buf.toString('utf8').replace(/\sdata-(build|commit)="[^"]*"/g, ' data-$1=""');
    if (stamp.build) s = s.split(`>${stamp.build}<`).join('><');
    return Buffer.from(s);
  }
  return buf;
}

/**
 * Pure: two builds' files, compared. added and removed by path; same when
 * the bytes are; lists for the version and the precache, which every
 * build rewrites; stamp when only the build stamp differs (unstamp); else
 * changed. Each list is sorted.
 * @param {Record<string, Buffer>} live
 * @param {Record<string, Buffer>} next
 * @param {{liveStamp?: {build?: string | null}, nextStamp?: {build?: string | null}}} [o]
 */
export function diffFiles(live, next, { liveStamp = {}, nextStamp = {} } = {}) {
  /** @type {{added: string[], removed: string[], changed: string[], stamp: string[], lists: string[], same: string[]}} */
  const out = { added: [], removed: [], changed: [], stamp: [], lists: [], same: [] };
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  for (const p of [...new Set([...Object.keys(live), ...Object.keys(next)])].sort()) {
    if (!has(next, p)) out.removed.push(p);
    else if (!has(live, p)) out.added.push(p);
    else if (live[p].equals(next[p])) out.same.push(p);
    else if (LISTS.includes(p)) out.lists.push(p);
    else if (unstamp(p, live[p], liveStamp).equals(unstamp(p, next[p], nextStamp))) out.stamp.push(p);
    else out.changed.push(p);
  }
  return out;
}

/**
 * Pure: paths split by what main's page reaches (the precache's paths, and
 * the worker and its lists, which every installed app fetches) and what
 * ships for file parity and is never loaded.
 * @param {string[]} paths
 * @param {Iterable<string>} reached the build's precache paths
 */
export function splitReach(paths, reached) {
  const r = new Set(reached);
  const reaches = (p) => r.has(p) || UNLISTED.has(p);
  return { reached: paths.filter(reaches), never: paths.filter((p) => !reaches(p)) };
}

/**
 * Pure: the shell's colors: its theme-color meta, and the manifest's
 * background and theme colors.
 * @param {string} html
 * @param {string} manifest
 */
export function colorsOf(html, manifest) {
  const m = /<meta\s+name="theme-color"\s+content="([^"]*)"/.exec(html);
  const man = JSON.parse(manifest);
  return { meta: m ? m[1] : null, background_color: man.background_color ?? null, theme_color: man.theme_color ?? null };
}

/**
 * Pure: a build's screens, sorted: its page's data-screens stamp (S3 on),
 * else the main block of the scope it was built from (S2's page carries no
 * stamp), else null.
 * @param {string} html
 * @param {any} [scope] content/scope/m1a.json
 * @returns {string[] | null}
 */
export function screensOf(html, scope = null) {
  const m = /<html\b[^>]*\sdata-screens="([^"]*)"/.exec(html);
  if (m) return m[1].split(/\s+/).filter(Boolean).sort();
  return scope && scope.main && Array.isArray(scope.main.screens) ? [...scope.main.screens].sort() : null;
}

/**
 * Pure: every id main's bundle ships, with its words, its state and where
 * it shows: on the page (a data-t or data-t-aria the page carries), in the
 * manifest (the name, short name and description it is made from), in the
 * debug menu (a dev line), or by code (a line the page's scripts show).
 * @param {Record<string, string>} bundle text/en.json
 * @param {string} html the built page
 * @param {{state: (id: string) => string, dev: (id: string) => boolean}} o
 * @returns {{id: string, words: string, state: string, where: string}[]}
 */
export function wordRows(bundle, html, { state, dev }) {
  const onPage = new Set([...html.matchAll(/\sdata-t(?:-aria)?="([^"]+)"/g)].map((m) => m[1]));
  const manifest = new Set(['app.name', 'app.short_name', 'app.description']);
  return Object.keys(bundle)
    .sort()
    .map((id) => ({ id, words: bundle[id], state: state(id), where: onPage.has(id) ? 'page' : manifest.has(id) ? 'manifest' : dev(id) ? 'debug menu' : 'code' }));
}

/**
 * Pure: two bundles compared: ids added and removed, and those whose words
 * changed, each sorted.
 * @param {Record<string, string>} live
 * @param {Record<string, string>} next
 */
export function wordDiff(live, next) {
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  return {
    added: Object.keys(next).filter((k) => !has(live, k)).sort(),
    removed: Object.keys(live).filter((k) => !has(next, k)).sort(),
    changed: Object.keys(next).filter((k) => has(live, k) && live[k] !== next[k]).sort(),
  };
}

/**
 * Pure: why main can't be promoted to next: a line in its bundle that
 * isn't shippable (a draft or a cut), T14's issues over what was built,
 * or screens that would change (unknown when live's aren't).
 * @param {{rows: {id: string, state: string, where: string}[], issues: {file: string, line: number, code: string, msg: string}[], screens: {live: string[] | null, next: string[] | null}}} o
 * @returns {string[]}
 */
export function problemsOf({ rows, issues, screens }) {
  const out = [];
  for (const r of rows) if (!SHIPPABLE.has(r.state)) out.push(`${r.id} (${r.where}) is ${r.state}: main ships approved words only (T14)`);
  for (const i of issues) out.push(`${i.file}:${i.line}: ${i.code} ${i.msg}`);
  if (screens.live && screens.next && screens.live.join(' ') !== screens.next.join(' ')) out.push(`main's screens would change: ${screens.live.join(' ')} -> ${screens.next.join(' ')}`);
  return out;
}

/**
 * Pure: the live site against the live build: the same commit, every
 * precache path's hash the same but the page's (its build stamp), and the
 * page the same once both stamps are out.
 * @param {{version: any, precache: any, page: string | null}} site what the live site serves
 * @param {{commit: string, version: any, precache: any, page: string}} live the live ref's build
 */
export function liveCheck(site, live) {
  if (!site || !site.version) return { reached: false, same: false };
  const a = (site.precache && site.precache.paths) || {};
  const b = (live.precache && live.precache.paths) || {};
  const differ = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((p) => p !== 'index.html' && a[p] !== b[p]).sort();
  const sameCommit = site.version.commit === live.commit;
  const page = site.page === null ? null : unstamp('index.html', Buffer.from(site.page), { build: site.version.build }).equals(unstamp('index.html', Buffer.from(live.page), { build: live.version.build }));
  return { reached: true, build: site.version.build, commit: site.version.commit, sameCommit, differ, page, same: sameCommit && !differ.length && page === true };
}

// ---- Pictures ----------------------------------------------------------------

// decodePNG lives in tools/png.mjs (S7: render-pics reads panel B with it); re-exported here.
export { decodePNG };

/**
 * Pure: an image shrunk by a whole factor, nearest pixel.
 * @param {{width: number, height: number, rgb: Uint8Array}} img
 * @param {number} k
 */
export function shrink(img, k) {
  const width = Math.floor(img.width / k);
  const height = Math.floor(img.height / k);
  const rgb = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) for (let c = 0; c < 3; c++) rgb[(y * width + x) * 3 + c] = img.rgb[(y * k * img.width + x * k) * 3 + c];
  return { width, height, rgb };
}

/**
 * Pure: rows of images side by side, top-aligned, gap pixels apart and
 * around, on bg; a missing image (null) leaves its cell empty, as wide as
 * the same cell in the other rows.
 * @param {({width: number, height: number, rgb: Uint8Array} | null)[][]} rows
 * @param {number[]} bg [r, g, b]
 * @param {number} [gap]
 * @returns {{width: number, height: number, rgb: Uint8Array}}
 */
export function sideBySide(rows, bg, gap = 8) {
  const cols = Math.max(...rows.map((r) => r.length));
  const colW = Array.from({ length: cols }, (_, c) => Math.max(0, ...rows.map((r) => (r[c] ? r[c].width : 0))));
  const rowH = rows.map((r) => Math.max(0, ...r.map((im) => (im ? im.height : 0))));
  const width = gap + colW.reduce((a, w) => a + w + gap, 0);
  const height = gap + rowH.reduce((a, h) => a + h + gap, 0);
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) rgb.set(bg, i * 3);
  let y0 = gap;
  rows.forEach((r, j) => {
    let x0 = gap;
    for (let c = 0; c < cols; c++) {
      const im = r[c];
      if (im) for (let y = 0; y < im.height; y++) rgb.set(im.rgb.subarray(y * im.width * 3, (y + 1) * im.width * 3), ((y0 + y) * width + x0) * 3);
      x0 += colW[c] + gap;
    }
    y0 += rowH[j] + gap;
  });
  return { width, height, rgb };
}

/**
 * A build's cover by day, drawn by that build's own picture VM and palette
 * (so live's is drawn as live draws it), or null when it has no cover.
 * @param {string} dir a built channel
 */
async function coverOf(dir) {
  try {
    const art = JSON.parse(readFileSync(join(dir, 'art', 'art.json'), 'utf8'));
    const pic = art.pics && art.pics[COVER];
    if (!pic) return null;
    const vm = await import(pathToFileURL(join(dir, 'js', 'gfx', 'picvm.js')).href);
    const pal = await import(pathToFileURL(join(dir, 'js', 'gfx', 'palette.js')).href);
    const p = pal.makePalette(art.palette);
    const slots = pal.resolve(vm.composite(vm.renderPic(pic.ops, { width: pic.width, height: pic.height, stamps: art.stamps })), pic.width, p, { remap: 'day', frame: 0, background: 0 });
    const rgb = new Uint8Array(pic.width * pic.height * 3);
    for (let i = 0; i < slots.length; i++) rgb.set(p.rgb[slots[i]], i * 3);
    return { width: pic.width, height: pic.height, rgb };
  } catch {
    return null;
  }
}

/** A build's cover and icons, in ICONS' order, the 512s at half size. */
async function pictureRow(dir) {
  const row = [await coverOf(dir)];
  for (const { file } of ICONS) {
    const p = join(dir, 'icons', file);
    if (!existsSync(p)) {
      row.push(null);
      continue;
    }
    const img = decodePNG(readFileSync(p));
    row.push(img.width > 256 ? shrink(img, 2) : img);
  }
  return row;
}

// ---- The run -----------------------------------------------------------------

/**
 * Build a ref of the repo's history as the deploy did: git archive into a
 * scratch folder outside git, its own tools/build.mjs with liveEnv(), its
 * dist/main/ copied to out. Returns the ref's commit and the scope it was
 * built from, or null when the ref isn't here.
 * @param {string} root
 * @param {string} ref
 * @param {string} out
 */
export function buildRef(root, ref, out) {
  let commit;
  try {
    commit = execFileSync('git', ['-C', root, 'rev-parse', '--verify', '--quiet', `${ref}^{commit}`], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
  const scratch = mkdtempSync(join(tmpdir(), 'oph-promote-'));
  try {
    const tar = join(scratch, 'ref.tar');
    const tree = join(scratch, 'tree');
    mkdirSync(tree);
    execFileSync('git', ['-C', root, 'archive', '--format=tar', '-o', tar, commit], { stdio: 'pipe' });
    execFileSync('tar', ['-xf', tar, '-C', tree], { stdio: 'pipe' });
    execFileSync(process.execPath, ['tools/build.mjs', '--channel', 'main'], { cwd: tree, env: liveEnv(process.env), stdio: 'pipe' });
    rmSync(out, { recursive: true, force: true });
    cpSync(join(tree, 'dist', 'main'), out, { recursive: true });
    const scopePath = join(tree, 'content', 'scope', 'm1a.json');
    return { commit, scope: existsSync(scopePath) ? JSON.parse(readFileSync(scopePath, 'utf8')) : null };
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

/** A built channel's facts for the report. */
function facts(dir) {
  const read = (f) => readFileSync(join(dir, f), 'utf8');
  const version = JSON.parse(read('version.json'));
  const precache = JSON.parse(read('precache.json'));
  const paths = Object.keys(precache.paths || {});
  return {
    version,
    precache,
    page: read('index.html'),
    manifest: read('manifest.webmanifest'),
    bundle: JSON.parse(read(join('text', 'en.json'))),
    colors: colorsOf(read('index.html'), read('manifest.webmanifest')),
    cache: { files: paths.length, bytes: paths.reduce((n, p) => n + statSync(join(dir, p)).size, 0) },
  };
}

/** --check-live: what the live site serves, or nulls when it can't be reached. */
async function fetchSite(url, fetchFn) {
  const get = async (path, json) => {
    try {
      const res = await fetchFn(new URL(path, url).href, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
      if (!res.ok) return null;
      return json ? await res.json() : await res.text();
    } catch {
      return null;
    }
  };
  return { version: await get('version.json', true), precache: await get('precache.json', true), page: await get('index.html', false) };
}

/**
 * --browser: the update in headless Chromium. live/ is served at the root
 * and its worker installs; next/ takes its place; a reload offers the
 * update note; Restart takes the new build; offline, it opens again.
 * @param {{live: string, next: string, out: string, pw: any}} o
 */
export async function updateCheck({ live, next, out, pw }) {
  const { makeServer } = await import('./serve.mjs');
  const served = join(out, 'served');
  const swap = (dir) => {
    rmSync(served, { recursive: true, force: true });
    cpSync(dir, served, { recursive: true });
  };
  swap(live);
  const server = makeServer(served);
  await new Promise((done) => server.listen(0, '127.0.0.1', () => done(undefined)));
  const addr = /** @type {import('node:net').AddressInfo} */ (server.address());
  const base = `http://127.0.0.1:${addr.port}/`;
  const browser = await pw.chromium.launch();
  /** @type {{step: string, build: string | null, ok: boolean, note?: string, shot: string}[]} */
  const steps = [];
  const nextBuild = JSON.parse(readFileSync(join(next, 'version.json'), 'utf8')).build;
  const liveBuild = JSON.parse(readFileSync(join(live, 'version.json'), 'utf8')).build;
  try {
    const context = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const shot = async (name) => {
      const file = `update-${name}.png`;
      await page.screenshot({ path: join(out, file) });
      return file;
    };
    const build = () => page.evaluate(() => document.documentElement.getAttribute('data-build'));
    const shows = (sel) => page.evaluate((s) => Boolean(document.querySelector(s)) && !(/** @type {HTMLElement} */ (document.querySelector(s)).hidden), sel);
    // 1. Live, installed: its worker has every file (the offline stamp).
    await page.goto(base, { waitUntil: 'load' });
    await page.waitForSelector('#offline:not([hidden])', { timeout: 30000 });
    steps.push({ step: 'live installed', build: await build(), ok: (await build()) === liveBuild, shot: await shot('1-live') });
    // 2. Next goes up; the app comes back and finds it.
    swap(next);
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('#update:not([hidden])', { timeout: 30000 });
    const note = ((await page.textContent('#update')) || '').replace(/\s+/g, ' ').trim();
    steps.push({ step: 'update note', build: await build(), ok: true, note, shot: await shot('2-note') });
    // 3. Restart: the new worker takes over and the page reloads into it.
    const nav = page.waitForNavigation({ timeout: 30000 });
    await page.click('#update-restart');
    await nav;
    await page.waitForLoadState('load');
    await page.waitForSelector('#offline:not([hidden])', { timeout: 30000 });
    steps.push({ step: 'restarted', build: await build(), ok: (await build()) === nextBuild && !(await shows('#update')), shot: await shot('3-restarted') });
    // 4. Offline, it opens again, from its own cache.
    await context.setOffline(true);
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('#offline:not([hidden])', { timeout: 30000 });
    steps.push({ step: 'offline', build: await build(), ok: (await build()) === nextBuild, shot: await shot('4-offline') });
    await context.close();
  } finally {
    await browser.close();
    await new Promise((done) => server.close(() => done(undefined)));
    rmSync(served, { recursive: true, force: true });
  }
  return { ok: steps.length === 4 && steps.every((s) => s.ok), steps };
}

/**
 * The dry run. Returns the report and the exit code.
 * @param {{root?: string, ref?: string, out?: string, checkLive?: string | null, browser?: boolean, pw?: any, fetchFn?: typeof fetch, log?: (s: string) => void}} [o]
 */
export async function dryRun({ root = ROOT, ref = DEFAULT_REF, out = join(root, 'out', 'promotion'), checkLive = null, browser = false, pw = null, fetchFn = globalThis.fetch, log = (s) => console.log(s) } = {}) {
  mkdirSync(out, { recursive: true });
  // 1. Next: main's channel from the working tree.
  const nextDir = join(out, 'next');
  const built = build({ root, channel: 'main', out: nextDir, quiet: true });
  const next = facts(nextDir);
  const text = readText(root);
  const src = shellSources(root);
  const reach = mainReach(text, src.html, src.manifest);
  const issues = checkMainBuild({ html: next.page, manifest: next.manifest, words: next.bundle, text, build: built.info.id, reach });
  const rows = wordRows(next.bundle, next.page, { state: (id) => stateOf(id, text), dev: (id) => Boolean(text.lines.get(id) && text.lines.get(id).class === 'dev') });
  let dirty = false;
  try {
    dirty = execFileSync('git', ['-C', root, 'status', '--porcelain'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() !== '';
  } catch {
    // outside git: the build id says dev
  }
  /** @type {any} */
  const report = {
    next: { build: next.version.build, commit: next.version.commit, worktree: dirty ? 'uncommitted changes' : 'clean', screens: screensOf(next.page), rules: next.version.rules ?? null, colors: next.colors, cache: next.cache, palette0: slot0(JSON.parse(readFileSync(join(nextDir, 'art', 'art.json'), 'utf8'))) },
    words: { rows, issues },
  };
  // 2. Live: the ref, built as the deploy built it.
  const liveDir = join(out, 'live');
  const ref0 = buildRef(root, ref, liveDir);
  if (!ref0) {
    log(`promote: no ${ref} here (a shallow checkout?), so nothing to compare main with: run git fetch origin main, then this again. Main's words alone:`);
    report.live = null;
  } else {
    const live = facts(liveDir);
    const files = diffFiles(snapshot(liveDir), snapshot(nextDir), { liveStamp: live.version, nextStamp: next.version });
    const nr = Object.keys(next.precache.paths);
    const lr = Object.keys(live.precache.paths);
    report.live = { ref, commit: ref0.commit, build: live.version.build, screens: screensOf(live.page, ref0.scope), rules: live.version.rules ?? null, colors: live.colors, cache: live.cache };
    report.words.diff = wordDiff(live.bundle, next.bundle);
    report.files = {
      added: splitReach(files.added, nr),
      changed: splitReach(files.changed, nr),
      removed: splitReach(files.removed, lr),
      stamp: files.stamp,
      lists: files.lists,
      same: files.same.length + files.stamp.length,
    };
    // The cover and the icons, live's row above next's.
    const bg = /** @type {number[]} */ (hexRgb(report.next.palette0).map((v) => 255 - ((255 - v) >> 3)));
    const img = sideBySide([await pictureRow(liveDir), await pictureRow(nextDir)], bg);
    writeFileSync(join(out, 'cover_icons.png'), encodePNG({ width: img.width, height: img.height, type: 'rgb', data: img.rgb }));
    report.pictures = 'cover_icons.png';
    if (checkLive) {
      report.checkLive = { url: checkLive, ...liveCheck(await fetchSite(checkLive, fetchFn), { commit: ref0.commit, version: live.version, precache: live.precache, page: live.page }) };
    }
    if (browser) {
      if (!pw) report.update = { ok: false, skipped: 'Playwright is not here (see tools/shots.mjs)' };
      else report.update = await updateCheck({ live: liveDir, next: nextDir, out, pw });
    }
  }
  report.screens = { live: report.live ? report.live.screens : null, next: report.next.screens };
  report.problems = problemsOf({ rows, issues, screens: report.screens });
  if (report.update && !report.update.ok && !report.update.skipped) report.problems.push('the update did not go through in Chromium (see update in report.json)');
  writeFileSync(join(out, 'report.json'), `${JSON.stringify(report, null, 1)}\n`);
  for (const line of summaryText(report)) log(line);
  return { report, code: report.problems.length ? 1 : 0 };
}

/**
 * --screens (S7): what a promotion of these screens needs. Main's reach
 * worked out (in memory, as the build's fill does) as though its scope
 * carried them, with preview's off list (the retired title page) and
 * main.off's dev lines; every line it would reach that isn't shippable
 * today (a draft, or a cut), by the batch it is filed in.
 * @param {{root?: string, screens: string[]}} o
 * @returns {{screens: string[], reach: string[], needs: Record<string, string[]>, unbatched: string[], count: number}}
 */
export function screensNeed({ root = ROOT, screens }) {
  const text = readText(root);
  const scope = text.scope;
  const unknown = screens.filter((s) => !scope.screens.includes(s));
  if (!screens.length || unknown.length) throw new Error(`promote: --screens names ${unknown.length ? `screens this build doesn't have: ${unknown.join(', ')}` : 'no screen'}`);
  /** @type {Record<string, string>} */
  const off = {};
  for (const [id, why] of Object.entries(scope.main.off)) {
    const line = text.lines.get(id);
    if (line && line.class === 'dev') off[id] = why;
  }
  const preview = (scope.channels && scope.channels.preview && scope.channels.preview.off) || {};
  for (const [id, why] of Object.entries(preview)) off[id] = why;
  const as = { ...text, scope: { ...scope, main: { ...scope.main, screens: [...new Set([...scope.main.screens, ...screens])].sort(), off } } };
  const src = shellSources(root);
  const reach = mainReach(as, src.html, src.manifest);
  /** @type {Record<string, string[]>} */
  const needs = {};
  /** @type {string[]} */
  const unbatched = [];
  for (const id of reach) {
    if (SHIPPABLE.has(stateOf(id, as))) continue;
    const at = batchOf(as, id);
    if (!at) unbatched.push(id);
    else (needs[at.batch] = needs[at.batch] || []).push(id);
  }
  const sorted = Object.fromEntries(Object.keys(needs).sort().map((b) => [b, needs[b]]));
  return { screens: as.scope.main.screens, reach, needs: sorted, unbatched, count: Object.values(needs).reduce((n, ids) => n + ids.length, 0) + unbatched.length };
}

/**
 * Pure: --screens' report as lines for the terminal.
 * @param {ReturnType<typeof screensNeed>} r
 * @returns {string[]}
 */
export function screensText(r) {
  const out = [`promote --dry-run --screens: main with ${r.screens.join(' ')} would reach ${r.reach.length} lines; ${r.count} of them aren't approved`];
  for (const [b, ids] of Object.entries(r.needs)) out.push(`  ${b}: ${ids.length} line(s): ${ids.join(' ')}`);
  if (r.unbatched.length) out.push(`  in no batch: ${r.unbatched.join(' ')}`);
  out.push(r.unbatched.length ? '  REFUSED: a line it needs is in no batch' : `  the promotion needs ${Object.keys(r.needs).length ? Object.keys(r.needs).join(' and ') : 'nothing more'} answered`);
  return out;
}

/** An art bundle's palette slot 0 (ink), as its hex. */
const slot0 = (art) => {
  const c = art.palette.colors[0];
  return typeof c === 'string' ? c : c.hex;
};

/** "#343945" -> [52, 57, 69] */
const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(String(hex).slice(i, i + 2), 16));

/**
 * Pure: the report as lines for the terminal.
 * @param {any} r
 * @returns {string[]}
 */
export function summaryText(r) {
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  const list = (a) => (a.length ? a.join(' ') : 'none');
  const out = [];
  out.push(`promote --dry-run: main ${r.live ? `${r.live.build} (${r.live.ref} ${String(r.live.commit).slice(0, 7)})` : '(no live build)'} -> ${r.next.build} (the working tree, ${r.next.worktree})`);
  const n = r.words.rows.length;
  const byState = {};
  for (const row of r.words.rows) byState[row.state] = (byState[row.state] || 0) + 1;
  out.push(`  words: ${n} ids in main's bundle (${Object.entries(byState).map(([s, k]) => `${s} ${k}`).join(', ')}); T14 over the build: ${r.words.issues.length ? `${r.words.issues.length} issue(s)` : 'green'}`);
  for (const row of r.words.rows) out.push(`    ${row.id} [${row.state}, ${row.where}]: ${JSON.stringify(row.words)}`);
  if (r.words.diff) out.push(`  words against live: added ${list(r.words.diff.added)}; removed ${list(r.words.diff.removed)}; changed ${list(r.words.diff.changed)}`);
  out.push(`  screens: ${r.screens.live ? r.screens.live.join(' ') : '?'} -> ${r.screens.next ? r.screens.next.join(' ') : '?'}${r.screens.live && r.screens.next && r.screens.live.join(' ') === r.screens.next.join(' ') ? ' (unchanged)' : ''}`);
  if (r.files) {
    for (const k of ['added', 'changed', 'removed']) out.push(`  files ${k}: main's page reaches ${list(r.files[k].reached)}; shipped, never loaded: ${r.files[k].never.length}${r.files[k].never.length ? ` (${r.files[k].never.join(' ')})` : ''}`);
    out.push(`  files the same: ${r.files.same} (${r.files.stamp.length} but the build stamp: ${list(r.files.stamp)}); rewritten by every build: ${list(r.files.lists)}`);
  }
  const c = (x) => (x ? `theme-color ${x.colors.meta}, manifest ${x.colors.background_color} and ${x.colors.theme_color}` : '?');
  out.push(`  colors: ${r.live ? `${c(r.live)} -> ` : ''}${c(r.next)} (palette slot 0 ${r.next.palette0})`);
  out.push(`  precache: ${r.live ? `${r.live.cache.files} files, ${kb(r.live.cache.bytes)} -> ` : ''}${r.next.cache.files} files, ${kb(r.next.cache.bytes)}`);
  out.push(`  rules hash: ${r.live ? `${r.live.rules || 'none'} -> ` : ''}${r.next.rules}`);
  if (r.pictures) out.push(`  cover and icons, live above next: ${r.pictures}`);
  if (r.checkLive) {
    const k = r.checkLive;
    out.push(`  check-live ${k.url}: ${!k.reached ? 'not reached' : `${k.build}, ${k.sameCommit ? 'the same commit' : `another commit (${k.commit})`}; ${k.differ.length ? `files differ: ${k.differ.join(' ')}` : 'every precached file the same'}; the page ${k.page === null ? 'not fetched' : k.page ? 'the same but its stamp' : 'differs'}`}`);
  }
  if (r.update) out.push(`  update in Chromium: ${r.update.skipped || r.update.steps.map((s) => `${s.step} ${s.ok ? 'ok' : 'FAILED'} (${s.build}${s.note ? `, "${s.note}"` : ''})`).join('; ')}`);
  out.push(r.problems.length ? `  REFUSED: ${r.problems.length} problem(s):\n    ${r.problems.join('\n    ')}` : '  main can be promoted: only approved words, the same screens');
  return out;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (name, fallback) => {
    const i = args.indexOf(name);
    if (i < 0) return undefined;
    const v = args[i + 1];
    return v && !v.startsWith('--') ? v : fallback;
  };
  if (!args.includes('--dry-run')) {
    console.error('promote: only --dry-run: main is promoted by the lead, by fast-forwarding the main branch after the creator\'s OK (BUILD_PLAN 6.1)');
    process.exit(2);
  }
  if (args.includes('--screens')) {
    try {
      const r = screensNeed({ screens: String(opt('--screens', '')).split(',').map((s) => s.trim()).filter(Boolean) });
      for (const line of screensText(r)) console.log(line);
      process.exit(r.unbatched.length ? 1 : 0);
    } catch (e) {
      console.error(e && e.message ? e.message : String(e));
      process.exit(2);
    }
  }
  try {
    let pw = null;
    if (args.includes('--browser')) {
      const { loadPlaywright, missingMessage } = await import('./shots.mjs');
      pw = await loadPlaywright();
      if (!pw) console.warn(missingMessage());
    }
    const { code } = await dryRun({
      ref: opt('--ref', DEFAULT_REF),
      out: opt('--out', undefined) || join(ROOT, 'out', 'promotion'),
      checkLive: args.includes('--check-live') ? opt('--check-live', LIVE_URL) : null,
      browser: args.includes('--browser'),
      pw,
    });
    process.exit(code);
  } catch (e) {
    console.error(`promote: ${e && e.message ? e.message : e}`);
    process.exit(2);
  }
}
