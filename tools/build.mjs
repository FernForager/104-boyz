#!/usr/bin/env node
// The build (BUILD_PLAN 3.3, session-1 form). It makes dist/ from web/ and
// the art, then assembles site/, the folder GitHub Pages deploys.
//
//   1. Compile every picture (.pic text) into op arrays, and check that
//      each one runs: dist/art/art.json holds the palette, the pictures and
//      the stamps, so the phone fetches one small file and runs the same
//      picture VM as Node. (The .pic text is the source; it is not shipped.)
//   2. Copy web/ into dist/ as is.
//   3. Draw the icons from the cover with the PNG tools: the 180 px
//      apple-touch-icon (opaque, or iOS fills it with black), 192, 512 and
//      a maskable 512.
//   4. Stamp the build id into dist/index.html and dist/version.json. The id
//      is the commit's own UTC date and its short SHA, read from git, so the
//      same commit always builds the same stamp; outside git it is "dev".
//   5. Write dist/flags.json: config/flags.json plus the channel.
//   6. Check the total size (under 5 MB).
//   7. Assemble site/. For now site/ is the main channel, at the root; the
//      preview channel joins it under preview/ in session 2.
//
// The same commit builds the same bytes: no clocks, sorted walks, and the
// build id from git, not from the time of the build. In GitHub Actions a
// missing git id is an error, so the live site never shows "dev".

import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { renderPic, composite } from '../web/js/gfx/picvm.js';
import { makePalette, resolve } from '../web/js/gfx/palette.js';
import { encodePNG } from './png.mjs';
import { ROOT, loadArt, loadPalette } from './pics.mjs';

export const MAX_BYTES = 5 * 1024 * 1024;
const COVER = 'cover_high_divide_dusk';

/**
 * Icons: a square crop of the cover around Mount Olympus, from the sky to
 * the valley haze ([x, y, size] in picture pixels), scaled up by whole
 * pixels; out is the final size, cut from the center when the scaled crop
 * is a little bigger. The maskable icon takes a wider crop, so the massif
 * sits inside its safe circle.
 */
export const ICONS = [
  { file: 'apple-touch-icon.png', crop: [40, 95, 90], scale: 2, out: 180 },
  { file: 'icon-192.png', crop: [37, 93, 96], scale: 2, out: 192 },
  { file: 'icon-512.png', crop: [34, 90, 103], scale: 5, out: 512 },
  { file: 'icon-maskable-512.png', crop: [21, 82, 128], scale: 4, out: 512 },
];

/** The build id from git: commit date (UTC) and short SHA, or "dev". */
export function buildInfo(root = ROOT) {
  const git = (args) =>
    execFileSync('git', args, { cwd: root, env: { ...process.env, TZ: 'UTC' }, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  try {
    const commit = git(['rev-parse', 'HEAD']);
    const short = commit.slice(0, 7);
    const date = git(['show', '-s', '--format=%cd', '--date=format-local:%Y-%m-%d', 'HEAD']);
    return { id: `${date.replaceAll('-', '')}-${short}`, commit, date };
  } catch {
    return { id: 'dev', commit: null, date: null };
  }
}

/**
 * The size check: every file under dir, in bytes, against the budget.
 * @returns {number} the total
 */
export function checkSize(dir, max = MAX_BYTES) {
  const total = walkFiles(dir).reduce((a, f) => a + statSync(f).size, 0);
  const name = dir.startsWith(ROOT + sep) ? relative(ROOT, dir).split(sep).join('/') : dir;
  if (total > max) throw new Error(`build: ${name}/ is ${total} bytes, over the ${max % 1048576 ? `${max}-byte` : `${max / 1048576} MB`} budget`);
  return total;
}

function walkFiles(dir) {
  const out = [];
  for (const n of readdirSync(dir).sort()) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walkFiles(p));
    else out.push(p);
  }
  return out;
}

/** The art bundle the phone fetches. Throws on any picture that won't run. */
export function compileArt() {
  const palette = loadPalette();
  const { sources, pics, stamps } = loadArt();
  const errors = [];
  for (const s of sources) {
    for (const e of s.parsed.errors) errors.push(`${s.rel}:${e.line}: ${e.msg}`);
    if (!s.kind) errors.push(`${s.rel}: not in plates/, scenes/ or stamps/`);
  }
  for (const id of Object.keys(pics)) {
    const p = pics[id];
    const r = renderPic(p.ops, { width: p.width, height: p.height, stamps });
    for (const u of r.diag.unknownStamps) errors.push(`${id}: unknown stamp "${u.id}"`);
    for (const d of r.diag.tooDeep) errors.push(`${id}: stamp "${d.id}" nests too deep`);
  }
  if (errors.length) throw new Error(`pictures:\n  ${errors.join('\n  ')}`);
  const { $comment, ...pal } = palette;
  const out = { format: 1, palette: pal, pics: {}, stamps };
  for (const id of Object.keys(pics).sort()) {
    const p = pics[id];
    out.pics[id] = { width: p.width, height: p.height, ops: p.ops };
  }
  return out;
}

/** Draw the icons from the cover. Returns [{file, png}]. */
export function makeIcons(art) {
  const pic = art.pics[COVER];
  if (!pic) throw new Error(`icons: no picture "${COVER}"`);
  const pal = makePalette(art.palette);
  const r = renderPic(pic.ops, { width: pic.width, height: pic.height, stamps: art.stamps });
  const slots = resolve(composite(r), pic.width, pal, { remap: 'day', frame: 0, background: 0 });
  return ICONS.map(({ file, crop: [cx, cy, n], scale, out }) => {
    if (cx < 0 || cy < 0 || cx + n > pic.width || cy + n > pic.height) throw new Error(`icons: ${file} crop is off the cover`);
    const big = n * scale;
    const off = (big - out) >> 1;
    if (off < 0) throw new Error(`icons: ${file} crop is too small`);
    const rgb = new Uint8Array(out * out * 3);
    for (let y = 0; y < out; y++) {
      for (let x = 0; x < out; x++) {
        const px = cx + Math.floor((x + off) / scale);
        const py = cy + Math.floor((y + off) / scale);
        const c = pal.rgb[slots[py * pic.width + px]];
        const q = (y * out + x) * 3;
        rgb[q] = c[0];
        rgb[q + 1] = c[1];
        rgb[q + 2] = c[2];
      }
    }
    // Truecolor with no alpha channel: opaque by construction.
    return { file, png: encodePNG({ width: out, height: out, type: 'rgb', data: rgb }) };
  });
}

/** A hash over every shipped file but version.json (paths and bytes). */
function hashFiles(dir) {
  const h = createHash('sha256');
  for (const f of walkFiles(dir)) {
    const rel = relative(dir, f).split(sep).join('/');
    if (rel === 'version.json') continue;
    h.update(rel);
    h.update('\0');
    h.update(readFileSync(f));
    h.update('\0');
  }
  return h.digest('hex').slice(0, 12);
}

/**
 * Build dist/ and site/.
 * @param {object} [o]
 * @param {string} [o.root] the repo (web/, config/ and git are read from it)
 * @param {string} [o.dist] where the channel is built
 * @param {string} [o.site] the folder Pages deploys
 * @param {string} [o.channel]
 * @param {boolean} [o.quiet]
 */
export function build({
  root = ROOT,
  dist = join(root, 'dist'),
  site = join(root, 'site'),
  channel = process.env.CHANNEL || 'main',
  quiet = false,
} = {}) {
  const log = quiet ? () => {} : (...a) => console.log(...a);
  rmSync(dist, { recursive: true, force: true });
  rmSync(site, { recursive: true, force: true });

  // 1. Pictures.
  const art = compileArt();
  // 2. The shell, as written.
  cpSync(join(root, 'web'), dist, { recursive: true });
  mkdirSync(join(dist, 'art'), { recursive: true });
  writeFileSync(join(dist, 'art', 'art.json'), JSON.stringify(art));
  // 3. Icons.
  mkdirSync(join(dist, 'icons'), { recursive: true });
  for (const { file, png } of makeIcons(art)) writeFileSync(join(dist, 'icons', file), png);
  // 4. Flags, with the channel stamped in.
  const flags = JSON.parse(readFileSync(join(root, 'config', 'flags.json'), 'utf8'));
  writeFileSync(join(dist, 'flags.json'), `${JSON.stringify({ ...flags, channel }, null, 2)}\n`);
  // 5. The build id.
  const info = buildInfo(root);
  if (info.id === 'dev' && process.env.GITHUB_ACTIONS === 'true') throw new Error('build: no git build id in GitHub Actions (is git on the runner?)');
  const indexPath = join(dist, 'index.html');
  const html = readFileSync(indexPath, 'utf8');
  for (const mark of ['data-build="dev"', '<span id="build-id">dev</span>']) {
    if (!html.includes(mark)) throw new Error(`build: web/index.html has lost its build-id placeholder (${mark})`);
  }
  const stamped = html
    .replace('data-build="dev"', `data-build="${info.id}"`)
    .replace('<span id="build-id">dev</span>', `<span id="build-id">${info.id}</span>`);
  writeFileSync(indexPath, stamped);
  const version = {
    build: info.id,
    channel,
    commit: info.commit,
    date: info.date,
    files: hashFiles(dist),
  };
  writeFileSync(join(dist, 'version.json'), `${JSON.stringify(version, null, 2)}\n`);
  // 6. Size.
  const files = walkFiles(dist);
  const total = checkSize(dist);
  // 7. The site: main at the root.
  cpSync(dist, site, { recursive: true });
  log(`build: ${info.id} (${channel}), ${files.length} files, ${(total / 1024).toFixed(1)} KB -> site/`);
  log(`  art.json ${(statSync(join(dist, 'art', 'art.json')).size / 1024).toFixed(1)} KB: ${Object.keys(art.pics).length} picture(s), ${Object.keys(art.stamps).length} stamp(s)`);
  return { info, version, total, files: files.length };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    build();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
