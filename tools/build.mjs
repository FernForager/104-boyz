#!/usr/bin/env node
// The build (BUILD_PLAN 3.3). It makes one channel, main or preview, into
// dist/<channel>/ from web/, the art and the words, and assembles site/, the
// folder GitHub Pages deploys.
//
//   0. The ingest check (BUILD_PLAN 6.5, S4): the generated content
//      (content/park/regions/ and the rest tools/ingest.mjs writes) must
//      match its lock, content/park/ingest_lock.json: the inputs, the
//      ingest tools and the outputs hash as the lock says, or the build
//      refuses with "run npm run ingest". It only hashes; the full re-run
//      is test/unit/ingest.test.mjs's. A tree without the research
//      (design/data/regions/, as the tests' partial copies are) can't
//      re-run ingest, so it skips the check.
//   1. Compile every picture (.pic text) into op arrays, and check that
//      each one runs: art/art.json holds the palette, the pictures and the
//      stamps, so the phone fetches one small file and runs the same
//      picture VM as Node. (The .pic text is the source; it is not shipped.)
//      A channel ships what its screens reach (BUILD_PLAN S5): a picture
//      when its kind's screens meet the channel's (the cover is the
//      title's; scenes and bases are the trail's), the composer's recipes
//      (content/art/recipes.json) with the trail screen, and a stamp when a
//      shipped picture or the recipes reach it (their T ops, prop slots,
//      skylines, fixed stamps and sprites, transitively). So main's art.json
//      stays the cover and its five firs, and preview's adds the rest.
//   2. Copy web/ into dist/<channel>/ as is.
//   2a. The chrome font (BUILD_PLAN S5): content/art/fonts/chrome8x14.txt
//      built into fonts/OPHChrome.ttf (tools/fontbuild.mjs), the same bytes
//      on both channels (file parity: only preview's game loads it).
//   2a'. The sound (BUILD_PLAN S5, sound A1): content/audio/sounds.json
//      and credits.json checked against their schemas and each other (every
//      cue logged), every cue variant rendered at 48 kHz with
//      web/js/audio/dsp.js and its hash checked against this tree's
//      test/golden/audio/a1.json (a mismatch refuses: "run npm run listen
//      -- --update and review"), then audio/sounds.json, the recipes with
//      those hashes stamped in, on both channels (file parity: only
//      preview's game loads the sound). No audio files in S5: every cue is
//      synthesized on the phone (tools/listen.mjs buildAudio).
//   2b. The data (BUILD_PLAN S3): content/rules, trips and stops compiled
//      for the channel's screens (tools/content.mjs) into data/rules.json
//      (the outcome data, canonical JSON) and data/voice.json (the line
//      ids each stop shows); the build refuses on any error. A data
//      section (S4: the park) joins rules.json when the channel's screens
//      meet its ships list in the scope file; a channel with the map
//      screen also gets data/map.json, the pencil map's display data (not
//      rules-hashed), and the build refuses a map label that isn't a place
//      in the gazetteer (content/text/names/places.json; T16). Then the
//      rules hash over js/engine/ and data/rules.json (tools/rules.mjs),
//      which version.json and <html data-rules> carry.
//   2c. The self-check corpus (BUILD_PLAN S3, D11): selfcheck.json, the
//      frozen engine fixture, the golden trips' inputs and the vectors, with
//      the group hashes Node gets running web/js/engine/selfcheck.js over
//      them (tools/goldens.mjs), so the phone can compare itself with Node
//      on the same code. It comes from this tree's test/fixtures/ and
//      test/golden/, whatever root the build is given, and the same on both
//      channels; the rules hash doesn't cover it.
//   3. Draw the icons from the cover with the PNG tools: the 180 px
//      apple-touch-icon (opaque, or iOS fills it with black), 192, 512 and
//      a maskable 512. Preview's are the same crops at a later hour (the
//      dusk table) with a teal band along the bottom, so the two icons on
//      a Home Screen never look alike.
//   4. Write flags.json: config/flags.json plus the channel.
//   5. The words (GAME_DESIGN 18.6): the shell carries ids, and the fill
//      writes the channel's words into index.html, with the build id, the
//      channel, the commit, the rules hash and the channel's screens
//      stamped on <html>; the manifest is made from its ids;
//      text/en.json is the channel's bundle (and on preview text/marks.json,
//      each unapproved line's state), with the gazetteer's words for the
//      places its data shows (S4: the map's labels; content/text/names/,
//      not ours). Main ships the ledger's words only:
//      its gate (T14) runs before the fill and again over what was built,
//      and the build fails on any word that isn't approved.
//   6. The worker's lists (GAME_DESIGN E.7): precache.json names every
//      file the channel's built page can load (tools/reach.mjs: the files
//      its page names, its manifest's icons, its stylesheets' url()s, and
//      its modules' imports and the files they name, a dynamic import
//      counted only on the screens its line's `// screens:` note names),
//      each with the hash of its bytes, so an installed app downloads what
//      its page can use (main ships S5's fonts, sound and trail modules for
//      file parity and never loads them, so its worker never fetches them),
//      and a new worker only what changed. The files hash covers every
//      shipped file, and sw.js's first four lines are stamped with the
//      channel, the build id and that hash, so any change to any file
//      changes sw.js, which is what the phone's update check compares.
//   7. Stamp version.json: the build id, the channel, the commit, its date,
//      the files hash and the rules hash. The build id is the commit's own
//      UTC date and its short SHA, read from git, so the same commit always
//      builds the same stamp; outside git it is "dev".
//   8. Check the total size (under 5 MB a channel).
//
// `node tools/build.mjs` builds main and preview, then assembles site/: main
// at the root and preview under preview/, as ophiker.com serves them
// (tools/assemble-site.mjs). --channel <c> (or CHANNEL) builds one; main
// alone assembles site/ with the /preview/ placeholder.
//
// The same commit builds the same bytes: no clocks, sorted walks, and the
// build id from git, not from the time of the build. In GitHub Actions a
// missing git id is an error, so the live site never shows "dev".

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { renderPic, composite } from '../web/js/gfx/picvm.js';
import { drawable } from '../web/js/gfx/compose.js';
import { makePalette, resolve } from '../web/js/gfx/palette.js';
import { encodePNG } from './png.mjs';
import { ROOT, KINDS, loadArt, loadPalette } from './pics.mjs';
import { readText, fillPage, makeManifest, mainReach, bundle, checkMainBuild, gateSummary, stateOf, json1, channelScreens, CHANNELS } from './text.mjs';
import { assemble } from './assemble-site.mjs';
import { compileContent } from './content.mjs';
import { selfcheckCorpus } from './goldens.mjs';
import { rulesHash } from './rules.mjs';
import { checkLock } from './ingest.mjs';
import { buildFonts } from './fontbuild.mjs';
import { buildAudio } from './listen.mjs';
import { pageReach } from './reach.mjs';
import { loadHotspots, shippedHotspots } from './looks.mjs';
import { canon } from '../web/js/engine/canon.js';

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

/**
 * The stamps a recipes file reaches directly: its prop slots', skylines',
 * sprites', fixed stamps' and prop overrides' (not yet through T ops).
 * @param {any} recipes
 * @returns {string[]}
 */
export function recipeStamps(recipes) {
  const out = new Set();
  if (!recipes) return [];
  for (const b of Object.values(recipes.bases || {})) for (const slot of /** @type {any} */ (b).props || []) for (const id of slot.stamps) out.add(id);
  for (const sk of Object.values(recipes.skylines || {})) out.add(/** @type {any} */ (sk).stamp);
  for (const id of recipes.sprites || []) out.add(id);
  for (const p of Object.values(recipes.places || {})) {
    for (const st of /** @type {any} */ (p).stamps || []) out.add(st.id);
    for (const o of Object.values(/** @type {any} */ (p).props || {})) for (const id of /** @type {any} */ (o).stamps || []) out.add(id);
  }
  return [...out].sort();
}

/**
 * The art bundle the phone fetches. Throws on any picture that won't run.
 * screens: the channel's screens (BUILD_PLAN S5: a picture ships when its
 * kind's screens meet them, the recipes with the trail screen, a stamp when
 * what ships reaches it); none (the default) ships everything.
 * @param {{screens?: string[] | null}} [o]
 */
export function compileArt({ screens = null } = {}) {
  const palette = loadPalette();
  const { sources, pics, stamps, recipes } = loadArt();
  const errors = [];
  for (const s of sources) {
    for (const e of s.parsed.errors) errors.push(`${s.rel}:${e.line}: ${e.msg}`);
    if (!s.kind) errors.push(`${s.rel}: not in plates/, scenes/, bases/ or stamps/`);
  }
  for (const id of Object.keys(pics)) {
    const p = pics[id];
    const r = renderPic(p.ops, { width: p.width, height: p.height, stamps });
    for (const u of r.diag.unknownStamps) errors.push(`${id}: unknown stamp "${u.id}"`);
    for (const d of r.diag.tooDeep) errors.push(`${id}: stamp "${d.id}" nests too deep`);
  }
  for (const id of recipeStamps(recipes)) if (!stamps[id]) errors.push(`content/art/recipes.json: unknown stamp "${id}"`);
  if (errors.length) throw new Error(`pictures:\n  ${errors.join('\n  ')}`);
  const meets = (/** @type {readonly string[]} */ list) => !screens || list.some((x) => screens.includes(x));
  const shipped = Object.keys(pics)
    .filter((id) => meets(KINDS[pics[id].kind].screens))
    .sort();
  const withRecipes = Boolean(recipes) && meets(['trail']);
  // The stamps what ships reaches, transitively.
  const reached = new Set();
  const visit = (/** @type {string} */ id) => {
    if (reached.has(id) || !stamps[id]) return;
    reached.add(id);
    for (const op of stamps[id]) if (op[0] === 'T') visit(op[1]);
  };
  for (const id of shipped) for (const op of pics[id].ops) if (op[0] === 'T') visit(op[1]);
  if (withRecipes) for (const id of recipeStamps(recipes)) visit(id);
  const { $comment, ...pal } = palette;
  const out = { format: 1, palette: pal, pics: {}, stamps: {} };
  for (const id of shipped) {
    const p = pics[id];
    out.pics[id] = { width: p.width, height: p.height, ops: p.ops };
  }
  for (const id of [...reached].sort()) out.stamps[id] = stamps[id];
  if (withRecipes) {
    out.recipes = recipes;
    // The Look hotspots by kind, {kind: looked} (S6; ui/look.js): a silent kind gets no button.
    out.hotspots = shippedHotspots(loadHotspots().hotspots);
  }
  return out;
}

/** Preview's band along the bottom of its icons: teal (BUILD_PLAN S2). */
export const PREVIEW_BAND = { slot: 15, rows: 1 / 8 };

/**
 * Draw the icons from the cover. Main's are the cover as drawn (the day
 * table); preview's are the same crops through the dusk table, with a solid
 * teal band across the bottom eighth. Returns [{file, png}].
 * @param {any} art the compiled art bundle
 * @param {string} [channel] 'main' or 'preview'
 */
export function makeIcons(art, channel = 'main') {
  if (!CHANNELS.includes(channel)) throw new Error(`icons: no channel "${channel}"`);
  const pic = art.pics[COVER];
  if (!pic) throw new Error(`icons: no picture "${COVER}"`);
  const pal = makePalette(art.palette);
  const r = renderPic(pic.ops, { width: pic.width, height: pic.height, stamps: art.stamps });
  const remap = channel === 'preview' ? 'dusk' : 'day';
  const slots = resolve(composite(r), pic.width, pal, { remap, frame: 0, background: 0 });
  return ICONS.map(({ file, crop: [cx, cy, n], scale, out }) => {
    if (cx < 0 || cy < 0 || cx + n > pic.width || cy + n > pic.height) throw new Error(`icons: ${file} crop is off the cover`);
    const big = n * scale;
    const off = (big - out) >> 1;
    if (off < 0) throw new Error(`icons: ${file} crop is too small`);
    const band = channel === 'preview' ? out - Math.round(out * PREVIEW_BAND.rows) : out;
    const rgb = new Uint8Array(out * out * 3);
    for (let y = 0; y < out; y++) {
      for (let x = 0; x < out; x++) {
        const px = cx + Math.floor((x + off) / scale);
        const py = cy + Math.floor((y + off) / scale);
        const c = pal.rgb[y >= band ? PREVIEW_BAND.slot : slots[py * pic.width + px]];
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

/** Files the worker's lists leave out: the worker itself and the two lists. */
export const UNLISTED = new Set(['sw.js', 'version.json', 'precache.json']);

/**
 * The files the worker caches: every one the built page in dir can load
 * (tools/reach.mjs pageReach), but the worker and the two lists, as {rel
 * path: first 12 hex of the sha256 of its bytes}, sorted.
 * @param {string} dir a built channel
 */
export function precachePaths(dir) {
  const paths = {};
  for (const rel of pageReach(dir).files) {
    if (UNLISTED.has(rel)) continue;
    paths[rel] = createHash('sha256').update(readFileSync(join(dir, rel))).digest('hex').slice(0, 12);
  }
  return paths;
}

/** A hash over every shipped file but sw.js and the two lists (paths and bytes). */
function hashFiles(dir) {
  const h = createHash('sha256');
  for (const f of walkFiles(dir)) {
    const rel = relative(dir, f).split(sep).join('/');
    if (UNLISTED.has(rel)) continue;
    h.update(rel);
    h.update('\0');
    h.update(readFileSync(f));
    h.update('\0');
  }
  return h.digest('hex').slice(0, 12);
}

/** The placeholder lines web/sw.js starts with, which the build stamps. */
export const SW_STAMP = ['// oph-sw dev dev dev', "const CHANNEL = 'dev';", "const BUILD = 'dev';", "const FILES = 'dev';"];

/**
 * Stamp the worker: its first four lines become the channel, the build id
 * and the files hash; nothing else changes. Throws if a placeholder line is
 * missing, so a worker can never ship unstamped.
 * @param {string} src web/sw.js
 * @param {{channel: string, build: string, files: string}} stamp
 */
export function stampWorker(src, { channel, build: id, files }) {
  const lines = src.split('\n');
  SW_STAMP.forEach((want, k) => {
    if (lines[k] !== want) throw new Error(`build: web/sw.js line ${k + 1} must be exactly ${JSON.stringify(want)}`);
  });
  const q = (v) => `'${String(v).replace(/[^\w.-]/g, '')}'`;
  lines.splice(0, 4, `// oph-sw ${channel} ${id} ${files}`, `const CHANNEL = ${q(channel)};`, `const BUILD = ${q(id)};`, `const FILES = ${q(files)};`);
  return lines.join('\n');
}

/**
 * The data for a channel (step 2b): rules.json and voice.json from the
 * content, scoped to the channel's screens. Throws on any error (J01,
 * X01, R01), so a broken reference never ships; warnings are the lint's.
 * @param {{root?: string, channel: string}} o
 * @returns {{screens: string[], rules: any, voice: any, files: Record<string, string>}}
 */
export function makeData({ root = ROOT, channel }) {
  if (!CHANNELS.includes(channel)) throw new Error(`build: no channel "${channel}" (main or preview)`);
  const screens = channelScreens(readText(root), channel);
  const { rules, voice, map, problems: all } = compileContent({ root, screens });
  const problems = all.filter((p) => p.level !== 'warn');
  if (problems.length) throw new Error(`build: the content has ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n  ${problems.map((p) => `${p.file}:${p.line}: ${p.code} ${p.msg}`).join('\n  ')}`);
  /** @type {Record<string, string>} */
  const files = { 'rules.json': `${canon(rules)}\n`, 'voice.json': JSON.stringify(voice) };
  if (map) {
    const places = gazetteerPlaces(root);
    const missing = Object.values(map.nodes)
      .map((n) => n.label)
      .filter((l) => l && !places.has(l.slice('place.'.length)));
    if (missing.length) throw new Error(`build: the map's labels must be places in the gazetteer (content/text/names/places.json; T16): ${missing.join(', ')}`);
    files['map.json'] = `${canon(map)}\n`;
  }
  return { screens, rules, voice, map, files };
}

/**
 * The place.<id> lines a channel's data shows, sorted: the map's labels
 * (S4), every stop view's node (S5: the trail caption's place), and, where
 * the channel ships the composer's recipes (preview's trail), every place
 * the composer can draw that is a park node with a gazetteer name: the
 * #frame check view captions each picture with its place. A junction whose label is ours (a
 * not_places entry, T16) is never captioned, so it adds nothing.
 * @param {{map: any, voice: any, rules?: any}} data makeData()'s
 * @param {any} [art] compileArt()'s: its recipes, when the channel has them
 * @param {Set<string>} [places] the gazetteer's place ids
 * @returns {string[]}
 */
export function viewNames(data, art = null, places = new Set()) {
  const out = new Set();
  if (data.map) for (const n of Object.values(data.map.nodes)) if (n.label) out.add(n.label);
  for (const set of Object.values((data.voice && data.voice.stops) || {})) {
    for (const stop of Object.values(set)) if (stop.view) out.add(`place.${stop.view.node}`);
  }
  const nodes = data.rules && data.rules.park ? data.rules.park.nodes : null;
  if (art && art.recipes && art.recipes.places && nodes) {
    for (const id of Object.keys(art.recipes.places)) if (nodes[id] && places.has(id) && drawable(id, art)) out.add(`place.${id}`);
  }
  return [...out].sort();
}

/** The gazetteer's place ids (content/text/names/places.json), or none when it isn't there yet. */
export function gazetteerPlaces(root = ROOT) {
  const p = join(root, 'content', 'text', 'names', 'places.json');
  if (!existsSync(p)) return new Set();
  const data = JSON.parse(readFileSync(p, 'utf8'));
  return new Set(Object.keys((data && data.places) || {}));
}

/**
 * Step 0: refuse a tree whose generated content doesn't match its lock.
 * @param {string} root
 */
export function ingestGate(root = ROOT) {
  if (!existsSync(join(root, 'design', 'data', 'regions'))) return { checked: false };
  const { ok, problems } = checkLock({ root });
  if (!ok) throw new Error(`build: the generated content is out of date (run npm run ingest):\n  ${problems.slice(0, 12).join('\n  ')}${problems.length > 12 ? `\n  ... and ${problems.length - 12} more` : ''}`);
  return { checked: true };
}

/**
 * The words for a channel: the filled shell, the manifest and the bundles.
 * Main's gate (T14) runs first, over every line main reaches, and then over
 * what was made, so a draft can never reach main. names: the place.<id> and
 * term.<id> ids the channel's data shows (S4: the map's labels), whose
 * words the bundle adds from the gazetteer.
 * @param {{root?: string, channel: string, build: string, commit?: string | null, rules?: string, names?: string[]}} o
 * @returns {{html: string, manifest: string, files: Record<string, string>}}
 */
export function makeWords({ root = ROOT, channel, build: id, commit = null, rules = 'dev', names = [] }) {
  const text = readText(root);
  const html = readFileSync(join(root, 'web', 'index.html'), 'utf8');
  const manifestSrc = readFileSync(join(root, 'web', 'manifest.webmanifest'), 'utf8');
  const reach = mainReach(text, html, manifestSrc);
  if (channel === 'main') {
    const blocked = reach.filter((r) => ['draft', 'cut'].includes(stateOf(r, text)));
    if (blocked.length) throw new Error(`build: ${gateSummary(text, blocked)}`);
  }
  const page = fillPage(html, { channel, text, build: id, commit, rules });
  const manifest = makeManifest(manifestSrc, { channel, text });
  const files = Object.fromEntries(Object.entries(bundle(text, channel, reach, names)).map(([f, o]) => [f, json1(o)]));
  if (channel === 'main') {
    const issues = checkMainBuild({ html: page, manifest, words: JSON.parse(files['en.json']), text, build: id, reach });
    if (issues.length) throw new Error(`build: main's words fail the gate:\n  ${issues.map((i) => `${i.file}:${i.line}: ${i.code} ${i.msg}`).join('\n  ')}`);
  }
  return { html: page, manifest, files };
}

/**
 * Build one channel into out (dist/<channel>/).
 * @param {object} [o]
 * @param {string} [o.root] the repo (web/, content/, config/ and git are read from it)
 * @param {string} [o.channel] 'main' or 'preview'
 * @param {string} [o.out] where the channel is built
 * @param {boolean} [o.quiet]
 */
export function build({ root = ROOT, channel = process.env.CHANNEL || 'main', out = join(root, 'dist', channel), quiet = false } = {}) {
  if (!CHANNELS.includes(channel)) throw new Error(`build: no channel "${channel}" (main or preview)`);
  const log = quiet ? () => {} : (...a) => console.log(...a);
  // 0. The ingest check.
  ingestGate(root);
  rmSync(out, { recursive: true, force: true });

  // 1. Pictures, as far as the channel's screens reach.
  const art = compileArt({ screens: channelScreens(readText(root), channel) });
  // 2. The shell, as written.
  cpSync(join(root, 'web'), out, { recursive: true });
  // 2a. The chrome font.
  buildFonts(out, { root });
  // 2a'. The sound's cue bank, checked against its goldens.
  const audio = buildAudio(out, { root });
  mkdirSync(join(out, 'art'), { recursive: true });
  writeFileSync(join(out, 'art', 'art.json'), JSON.stringify(art));
  // 2b. The data, and the rules hash over the engine and the outcome data.
  const data = makeData({ root, channel });
  mkdirSync(join(out, 'data'), { recursive: true });
  for (const [f, body] of Object.entries(data.files)) writeFileSync(join(out, 'data', f), body);
  const rules = rulesHash(out);
  // 2c. The self-check corpus, with Node's group hashes.
  const corpus = selfcheckCorpus();
  writeFileSync(join(out, 'selfcheck.json'), JSON.stringify(corpus));
  // 3. Icons, the channel's own.
  mkdirSync(join(out, 'icons'), { recursive: true });
  for (const { file, png } of makeIcons(art, channel)) writeFileSync(join(out, 'icons', file), png);
  // 4. Flags, with the channel stamped in.
  const flags = JSON.parse(readFileSync(join(root, 'config', 'flags.json'), 'utf8'));
  writeFileSync(join(out, 'flags.json'), `${JSON.stringify({ ...flags, channel }, null, 2)}\n`);
  // 5. The words, and the build id.
  const info = buildInfo(root);
  if (info.id === 'dev' && process.env.GITHUB_ACTIONS === 'true') throw new Error('build: no git build id in GitHub Actions (is git on the runner?)');
  // The places and terms the channel's data names (S4: the map's labels; S5:
  // the places the trail's captions show, each stop view's node, and on
  // preview every place the #frame check view draws) join its words.
  const names = viewNames(data, art, gazetteerPlaces(root));
  const words = makeWords({ root, channel, build: info.id, commit: info.commit, rules, names });
  writeFileSync(join(out, 'index.html'), words.html);
  writeFileSync(join(out, 'manifest.webmanifest'), words.manifest);
  mkdirSync(join(out, 'text'), { recursive: true });
  for (const [f, body] of Object.entries(words.files)) writeFileSync(join(out, 'text', f), body);
  // 6. The worker's lists, and its stamp.
  const paths = precachePaths(out);
  const filesHash = hashFiles(out);
  writeFileSync(join(out, 'precache.json'), `${JSON.stringify({ build: info.id, channel, files: filesHash, paths }, null, 1)}\n`);
  writeFileSync(join(out, 'sw.js'), stampWorker(readFileSync(join(out, 'sw.js'), 'utf8'), { channel, build: info.id, files: filesHash }));
  // 7. The version.
  const version = {
    build: info.id,
    channel,
    commit: info.commit,
    date: info.date,
    files: filesHash,
    rules,
  };
  writeFileSync(join(out, 'version.json'), `${JSON.stringify(version, null, 2)}\n`);
  // 8. Size.
  const files = walkFiles(out);
  const total = checkSize(out);
  const name = out.startsWith(root + sep) ? relative(root, out).split(sep).join('/') : out;
  log(`build: ${info.id} (${channel}), ${files.length} files, ${(total / 1024).toFixed(1)} KB -> ${name}/`);
  log(`  art.json ${(statSync(join(out, 'art', 'art.json')).size / 1024).toFixed(1)} KB: ${Object.keys(art.pics).length} picture(s), ${Object.keys(art.stamps).length} stamp(s)`);
  log(`  rules ${rules}: ${Object.keys(data.rules.plans).length} plan(s), ${Object.keys(data.rules.stops).length} stop set(s)${data.rules.park ? `, the park (${Object.keys(data.rules.park.nodes).length} places, ${Object.keys(data.rules.park.segs).length} segments)` : ''} for screens ${data.screens.join(' ')}`);
  log(`  audio/sounds.json ${(statSync(join(out, 'audio', 'sounds.json')).size / 1024).toFixed(1)} KB: ${audio.cues} cues, ${audio.variants} variants, each matching its golden`);
  log(`  selfcheck.json ${(statSync(join(out, 'selfcheck.json')).size / 1024).toFixed(1)} KB: ${corpus.trips.length} golden trips, ${Object.keys(corpus.expect).length} groups`);
  const cached = Object.keys(paths).reduce((n, f) => n + statSync(join(out, f)).size, 0);
  log(`  precache.json: ${Object.keys(paths).length} files, ${(cached / 1024).toFixed(1)} KB, what its page can load`);
  return { info, version, total, files: files.length, out, rules };
}

/**
 * Build the channels into dist/<channel>/ and, when main is among them,
 * assemble site/: main at the root, and preview under preview/ (or, when
 * preview wasn't built, the placeholder), as ophiker.com serves them.
 * @param {{root?: string, channels?: string[], dist?: string, site?: string, quiet?: boolean}} [o]
 */
export function buildAll({ root = ROOT, channels = CHANNELS, dist = join(root, 'dist'), site = join(root, 'site'), quiet = false } = {}) {
  // Every channel at once starts from an empty dist/, so nothing stale ships.
  if (CHANNELS.every((c) => channels.includes(c))) rmSync(dist, { recursive: true, force: true });
  const built = channels.map((channel) => build({ root, channel, out: join(dist, channel), quiet }));
  const main = built.find((b) => b.version.channel === 'main');
  if (main) {
    const preview = built.find((b) => b.version.channel === 'preview');
    assemble({ root, main: main.out, preview: preview ? preview.out : undefined, out: site });
    if (!quiet) console.log(`  site/: main at /, ${preview ? 'preview' : 'the placeholder'} at /preview/`);
  }
  return built;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    const k = process.argv.indexOf('--channel');
    const one = k > 0 ? process.argv[k + 1] : process.env.CHANNEL;
    buildAll({ channels: one ? [one] : CHANNELS });
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
