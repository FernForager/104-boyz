#!/usr/bin/env node
// Screenshots of the game in a real browser engine (BUILD_PLAN 2.1, 6.2,
// 10.7; S5), at the phones' sizes, for the session's report and for the
// batches' numbered pictures.
//
//   node tools/shots.mjs [--engine webkit|chromium] [--sizes se,17,promax]
//                        [--set s5 | --batch B004] [--out out/shots]
//
// It builds site/ if it isn't there (npm run build makes it fresh), serves
// it on a free port (tools/serve.mjs) and drives /preview/?debug=1 with a
// dev route per scenario: #stop=<set>.<stop>&hour=<h> opens a real stop
// through the real engine, in memory (ui/app.js), and #frame the frame's
// check view. Each size is a phone in portrait, with touch, its device
// pixel ratio and Reduce Motion on (an instant draw-in, still cycles), and
// its safe areas: a browser in a harness reports none, so each page gets
// the phone's top and bottom insets as --safe-top and --safe-bottom (the
// variables css/tokens.css reads env() into) before the game lays out.
// The debug menu that ?debug=1 opens is closed before each picture.
//
// --set s5: Deer Lake and the rim at day, dusk and night; the #frame
// fixture (three choices, the (i) square) by day; the High Divide by day
// and at dusk; the ≡ sheet open on the SE (the short screen's fold); the
// box in the Plain font. Files: <out>/<set>/<size>/<NN>-<name>.<engine>.png
// and <out>/<set>/manifest.json (the engine and its version, the sizes,
// the build id, the files).
//
// --set s6: main's title page at / (decision 68's lighter cover; main has
// no debug mode, so no menu to close), and palette A's Deer Lake and rim at
// all four hours, the picture in its mat (S6 track A). S6's later tracks
// add their own scenarios to it.
//
// --batch B004 (and tools/text.mjs batch --shots, through shootBatch): each
// screen the batch's lines are on is shot in its scenarios, in order; each
// scenario reads every [data-t] and [data-t-aria] element's box, numbers
// the batch's lines it shows (in the batch's order, each line once, where
// it first shows), draws numbered badges over them, then takes the
// picture; a line no scenario shows gets a mock of its box from a fixture
// page. The badges' boxes go in the batch's JSON.
//
// Playwright is never a dependency (BUILD_PLAN 2.1): it is loaded when this
// runs, from NODE_PATH or node_modules, and if it isn't there the tool says
// how to get it and exits 2. WebKit (Safari's engine) is tried first; where
// it isn't installed (this container has Chromium only) the tool falls
// back to Chromium with a warning, and the engine is in every file's name
// and the manifest, so a Chromium picture is never taken for Safari's
// (.github/workflows/shots.yml takes the WebKit ones: on a push to preview
// that changes it or this tool, and by hand once it is on main, S6).

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './pics.mjs';

/** The Playwright release the sessions and shots.yml use. */
export const PLAYWRIGHT_VERSION = '1.56.1';
export const ENGINES = Object.freeze(['webkit', 'chromium']);

/**
 * The phones (portrait, points), with their device pixel ratio and safe
 * areas [top, bottom] in points (BUILD_PLAN S5 3.2's space check).
 */
export const SIZES = Object.freeze({
  se: Object.freeze({ width: 375, height: 667, dpr: 2, safe: Object.freeze([20, 0]), label: 'iPhone SE' }),
  17: Object.freeze({ width: 402, height: 874, dpr: 3, safe: Object.freeze([62, 34]), label: 'iPhone 17' }),
  promax: Object.freeze({ width: 440, height: 956, dpr: 3, safe: Object.freeze([62, 34]), label: 'iPhone 17 Pro Max' }),
});
/** The sizes in the order they're shot: the creator's phone first (10.7). */
export const SIZE_ORDER = Object.freeze(['17', 'se', 'promax']);
/** The size a batch's pictures are taken at. */
export const BATCH_SIZE_NAME = '17';
/** The page every scenario opens, in debug mode (the dev routes need it). */
export const PAGE = '/preview/?debug=1';
/** The sample stops' set (content/stops/deer_lake_rim.json). */
const SET = 'deer_lake_rim';
/** The check view's hours, in its picker's order (ui/frame.js). */
export const SCENE_HOURS = Object.freeze(['day', 'dusk', 'blue', 'night']);

/**
 * A scenario: a page to open and what to do there.
 * @typedef {object} Scenario
 * @property {string} name a file name's part
 * @property {string} screen the screen it shows (a line's screen, for batches)
 * @property {string} hash the dev route: #stop=..., #frame, or '' for the game's own first screen
 * @property {string[]} [steps] taps after it settles: menu (≡), sound (Sound:on), pic:<id> and hour:<h> (the #frame pickers)
 * @property {string[]} [sizes] only these sizes (default: all)
 * @property {Record<string, unknown>} [store] preview's saved choices to start with (name -> value), e.g. {text: 'plain'}
 * @property {string} [page] the page to open, if not PAGE: '/' is main's title page (S6)
 */

/** The page a scenario opens. @param {Scenario} sc */
export const pageOf = (sc) => sc.page ?? PAGE;

/** @param {string} stop @param {string} hour */
const stopHash = (stop, hour) => `#stop=${SET}.${stop}&hour=${hour}`;

/** The named sets. @type {Readonly<Record<string, readonly Scenario[]>>} */
export const SETS = Object.freeze({
  s5: Object.freeze([
    ...['day', 'dusk', 'night'].map((h) => ({ name: `deer_lake_${h}`, screen: 'trail', hash: stopHash('deer_lake', h) })),
    ...['day', 'dusk', 'night'].map((h) => ({ name: `rim_${h}`, screen: 'trail', hash: stopHash('rim', h) })),
    { name: 'frame_fixture_day', screen: 'trail', hash: '#frame' },
    { name: 'high_divide_day', screen: 'trail', hash: '#frame', steps: ['pic:high_divide'] },
    { name: 'high_divide_dusk', screen: 'trail', hash: '#frame', steps: ['pic:high_divide', 'hour:dusk'] },
    { name: 'menu_fold', screen: 'trail', hash: stopHash('deer_lake', 'day'), steps: ['menu'], sizes: ['se'] },
    { name: 'plain_text', screen: 'trail', hash: stopHash('deer_lake', 'day'), store: { text: 'plain' } },
  ]),
  s6: Object.freeze([
    { name: 'title_main', screen: 'title', hash: '', page: '/' },
    ...SCENE_HOURS.map((h) => ({ name: `deer_lake_${h}`, screen: 'trail', hash: stopHash('deer_lake', h) })),
    ...SCENE_HOURS.map((h) => ({ name: `rim_${h}`, screen: 'trail', hash: stopHash('rim', h) })),
  ]),
});

/**
 * Where a batch's lines show, by screen: the scenarios that reach them, in
 * the order they're tried (a line is badged where it first shows). A
 * screen not here has no scenario yet, so its lines get mocks.
 * @type {Readonly<Record<string, readonly Scenario[]>>}
 */
export const SCREEN_SCENARIOS = Object.freeze({
  trail: Object.freeze([
    { name: 'deer_lake', screen: 'trail', hash: stopHash('deer_lake', 'day') },
    { name: 'rim', screen: 'trail', hash: stopHash('rim', 'day') },
    { name: 'sound_off', screen: 'trail', hash: stopHash('deer_lake', 'day'), steps: ['sound'] },
    { name: 'menu', screen: 'trail', hash: stopHash('deer_lake', 'day'), steps: ['menu'] },
    { name: 'frame_fixture', screen: 'trail', hash: '#frame' },
  ]),
  guestbook: Object.freeze([{ name: 'guestbook', screen: 'guestbook', hash: '' }]),
});

/**
 * Pure: a picture's file name: its number in the run (two digits), its
 * name and the engine that took it.
 * @param {number} k 1-based
 * @param {string} name
 * @param {string} engine
 */
export function shotName(k, name, engine) {
  return `${String(k).padStart(2, '0')}-${name}.${engine}.png`;
}

/**
 * Pure: the sizes a --sizes list names, in SIZE_ORDER; throws on one it
 * doesn't know.
 * @param {string | null | undefined} list "se,17,promax"
 * @returns {string[]}
 */
export function pickSizes(list) {
  if (!list) return [...SIZE_ORDER];
  const want = list.split(',').map((s) => s.trim()).filter(Boolean);
  for (const s of want) if (!Object.prototype.hasOwnProperty.call(SIZES, s)) throw new Error(`shots: no size "${s}" (${SIZE_ORDER.join(', ')})`);
  return SIZE_ORDER.filter((s) => want.includes(s));
}

/**
 * Pure: the CSS that gives a page the phone's safe areas (the variables
 * css/tokens.css reads env() into), for a size.
 * @param {{safe: readonly number[]}} size
 */
export function safeCss(size) {
  return `:root { --safe-top: ${size.safe[0]}px; --safe-bottom: ${size.safe[1]}px; }`;
}

/**
 * Pure: the scenarios that shoot a batch's lines, screen by screen in the
 * order the batch first meets each screen, with the screen's scenarios in
 * their own order.
 * @param {{screen: string}[]} lines
 * @returns {Scenario[]}
 */
export function batchScenarios(lines) {
  const screens = [...new Set(lines.map((l) => l.screen))];
  return screens.flatMap((s) => SCREEN_SCENARIOS[s] || []);
}

/**
 * Pure: the badges a scenario draws: of the lines on its screen not yet
 * badged elsewhere, those the page shows (found: id -> its box), numbered
 * by their place in the batch, in that order.
 * @param {{n: number, id: string, screen: string}[]} lines
 * @param {string} screen
 * @param {Record<string, number[]>} found
 * @param {Set<string>} claimed ids badged already (updated)
 * @returns {{n: number, id: string, box: number[]}[]}
 */
export function claimBadges(lines, screen, found, claimed) {
  const out = [];
  for (const l of [...lines].sort((a, b) => a.n - b.n)) {
    if (l.screen !== screen || claimed.has(l.id) || !Object.prototype.hasOwnProperty.call(found, l.id)) continue;
    claimed.add(l.id);
    out.push({ n: l.n, id: l.id, box: found[l.id] });
  }
  return out;
}

/** What to say when Playwright isn't there. */
export function missingMessage() {
  return [
    `shots: Playwright isn't installed here. It is never in package.json (BUILD_PLAN 2.1); fetch it for a run:`,
    `  npm install --no-save --ignore-scripts playwright@${PLAYWRIGHT_VERSION}`,
    `  npx -y playwright@${PLAYWRIGHT_VERSION} install webkit chromium`,
    `or point NODE_PATH at a node_modules that has it (NODE_PATH=/opt/node-tools/node_modules in the sessions' container), then run this again.`,
  ].join('\n');
}

/**
 * Load Playwright: through require, which honors NODE_PATH, then as a
 * module from node_modules. Null when neither has it.
 * @returns {Promise<any>}
 */
export async function loadPlaywright() {
  try {
    return createRequire(import.meta.url)('playwright');
  } catch {
    // not on NODE_PATH or beside the repo
  }
  try {
    const m = await import(/** @type {string} */ ('playwright'));
    return m.default || m;
  } catch {
    return null;
  }
}

/**
 * Launch the engine asked for; WebKit falls back to Chromium, with a
 * warning, where it isn't installed.
 * @param {any} pw
 * @param {string} want
 * @param {(msg: string) => void} warn
 * @returns {Promise<{browser: any, engine: string, version: string}>}
 */
export async function launch(pw, want, warn) {
  if (!ENGINES.includes(want)) throw new Error(`shots: no engine "${want}" (${ENGINES.join(', ')})`);
  if (want === 'webkit') {
    try {
      const browser = await pw.webkit.launch();
      return { browser, engine: 'webkit', version: browser.version() };
    } catch (e) {
      warn(`shots: WebKit isn't available here (${String((e && e.message) || e).split('\n')[0]}); taking Chromium pictures instead. Safari's own come from .github/workflows/shots.yml: it runs when it (or this tool) lands on preview, and by hand from Actions once S6 puts it on main.`);
    }
  }
  const browser = await pw.chromium.launch();
  return { browser, engine: 'chromium', version: browser.version() };
}

/**
 * Serve site/, building it first if it isn't there. Resolves to the base
 * URL and a close().
 * @param {string} root
 * @returns {Promise<{base: string, close: () => Promise<void>}>}
 */
export async function serveSite(root = ROOT) {
  const site = join(root, 'site');
  if (!existsSync(join(site, 'preview', 'index.html'))) {
    const { buildAll } = await import('./build.mjs');
    buildAll({ root, quiet: true });
  }
  const { makeServer } = await import('./serve.mjs');
  const server = makeServer(site);
  await new Promise((done) => server.listen(0, '127.0.0.1', () => done(undefined)));
  const addr = /** @type {import('node:net').AddressInfo} */ (server.address());
  return {
    base: `http://127.0.0.1:${addr.port}`,
    close: () => new Promise((done) => server.close(() => done(undefined))),
  };
}

/**
 * A page at a size, with the phone's safe areas and the scenario's saved
 * choices in place before the game starts.
 * @param {any} browser
 * @param {typeof SIZES[keyof typeof SIZES]} size
 * @param {Scenario} sc
 */
async function openPage(browser, size, sc) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    screen: { width: size.width, height: size.height },
    deviceScaleFactor: size.dpr,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  // Preview's saved choices: the debug marks off, so a picture shows the
  // words as a player sees them, and the scenario's own.
  await context.addInitScript(
    ({ css, store }) => {
      for (const [k, v] of Object.entries(store)) localStorage.setItem(`oph.preview.${k}`, JSON.stringify(v));
      document.addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style');
        s.textContent = css;
        document.head.appendChild(s);
      });
    },
    { css: safeCss(size), store: { marks: 'off', ...(sc.store || {}) } },
  );
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  return { context, page, errors };
}

/**
 * Open a scenario and let it settle: the debug menu closed, the screen
 * drawn, the fonts in, the steps tapped.
 * @param {any} page
 * @param {string} base
 * @param {Scenario} sc
 */
async function settle(page, base, sc) {
  const at = pageOf(sc);
  await page.goto(`${base}${at}${sc.hash}`, { waitUntil: 'load' });
  if (at.includes('debug=1')) {
    // ?debug=1 opens the debug menu; close it (Escape, as its own handler does).
    await page.waitForSelector('.scrim.debug:not([hidden])', { timeout: 5000 }).catch(() => null);
    await page.keyboard.press('Escape');
  }
  // The title page is ready when its cover has drawn in; the game's screens when their frame or the guest book shows.
  const ready = sc.screen === 'title' ? '.plate:not(.drawing)' : sc.hash === '#frame' ? '#frame-sheet .status-line' : sc.hash ? '.frame .status-line' : '#gb-name, .frame .status-line';
  await page.waitForSelector(ready, { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForTimeout(400);
  for (const step of sc.steps || []) {
    if (step === 'menu') await page.click('.status-menu');
    else if (step === 'sound') await page.click('.status-sound');
    else if (step.startsWith('pic:')) await page.locator('.scenes-pics button', { hasText: new RegExp(`^${step.slice(4)}$`) }).click();
    else if (step.startsWith('hour:')) await page.locator('.scenes-hours button').nth(SCENE_HOURS.indexOf(step.slice(5))).click();
    else throw new Error(`shots: no step "${step}"`);
    await page.waitForTimeout(300);
  }
  // A tap on a picker scrolls the check view; the picture is of its top.
  await page.evaluate(() => {
    const sheet = document.getElementById('frame-sheet');
    if (sheet) sheet.scrollTop = 0;
    window.scrollTo(0, 0);
  });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForTimeout(300);
}

/**
 * In the page: the box of every [data-t] and [data-t-aria] element that
 * shows (the first that does, by id), in CSS px [x, y, w, h].
 * @param {any} page
 * @returns {Promise<Record<string, number[]>>}
 */
function lineBoxes(page) {
  return page.evaluate(() => {
    /** @type {Record<string, number[]>} */
    const out = {};
    for (const el of document.querySelectorAll('[data-t], [data-t-aria]')) {
      for (const id of [el.getAttribute('data-t'), el.getAttribute('data-t-aria')]) {
        if (!id || out[id]) continue;
        const r = el.getBoundingClientRect();
        const shows = typeof el.checkVisibility === 'function' ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) : true;
        if (!shows || r.width < 1 || r.height < 1 || r.bottom <= 0 || r.right <= 0 || r.top >= innerHeight || r.left >= innerWidth) continue;
        out[id] = [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10);
      }
    }
    return out;
  });
}

/**
 * In the page: the words each line shows (its element's text, var fills
 * in), by id; a spoken name's is its aria-label.
 * @param {any} page
 * @returns {Promise<Record<string, string>>}
 */
function lineTexts(page) {
  return page.evaluate(() => {
    /** @type {Record<string, string>} */
    const out = {};
    for (const el of document.querySelectorAll('[data-t]')) {
      const id = el.getAttribute('data-t');
      if (id && !(id in out)) out[id] = (el.textContent || '').trim();
    }
    for (const el of document.querySelectorAll('[data-t-aria]')) {
      const id = el.getAttribute('data-t-aria');
      if (id && !(id in out)) out[id] = el.getAttribute('aria-label') || '';
    }
    return out;
  });
}

/**
 * In the page: numbered badges over the lines, in a layer above
 * everything (a dev overlay: the harness draws it, the game never does).
 * @param {any} page
 * @param {{n: number, box: number[]}[]} badges
 */
function drawBadges(page, badges) {
  return page.evaluate((list) => {
    const layer = document.createElement('div');
    layer.id = 'shot-badges';
    layer.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none';
    for (const b of list) {
      const [x, y, w, h] = b.box;
      const ring = document.createElement('div');
      ring.style.cssText = `position:fixed;left:${x - 1}px;top:${y - 1}px;width:${w + 2}px;height:${h + 2}px;outline:2px dashed #ff2bd6;outline-offset:0`;
      const tag = document.createElement('div');
      tag.textContent = String(b.n);
      tag.style.cssText = `position:fixed;left:${Math.max(0, x - 9)}px;top:${Math.max(0, y - 9)}px;min-width:20px;height:20px;padding:0 4px;box-sizing:border-box;font:700 13px/18px system-ui,sans-serif;color:#fff;background:#c2008a;border:1px solid #fff;border-radius:10px;text-align:center`;
      layer.appendChild(ring);
      layer.appendChild(tag);
    }
    document.body.appendChild(layer);
  }, badges);
}

/** HTML-escape a string. */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * A mock of a line's box (a line no scenario shows): the Sierra box in
 * the game's own stylesheets and font, with the line's words, its number
 * badged.
 * @param {any} page a page at preview's origin
 * @param {{n: number, id: string, words: any}} line
 * @param {string} file
 */
async function mockBox(page, line, file) {
  const words = typeof line.words === 'string' ? line.words : Object.values(line.words).join(' / ');
  const html = `<!doctype html><html lang="en" data-channel="preview"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="css/tokens.css"><link rel="stylesheet" href="css/game.css"><link rel="stylesheet" href="css/frame.css"></head><body style="margin:0;padding:16px;height:auto"><div class="game-screen frame" style="display:block;height:auto;padding:0"><div class="box game-box" id="mock" style="box-sizing:border-box;width:100%;max-width:100%;max-height:none;margin:0"><p data-t="${esc(line.id)}">${esc(words).replace(/\n/g, '<br>')}</p></div></div></body></html>`;
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const box = await page.evaluate(() => {
    const r = /** @type {HTMLElement} */ (document.getElementById('mock')).getBoundingClientRect();
    return [r.left, r.top, r.width, r.height];
  });
  await drawBadges(page, [{ n: line.n, box }]);
  const vw = page.viewportSize().width;
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: Math.min(vw, Math.ceil(box[0] + box[2] + 16)), height: Math.ceil(box[1] + box[3] + 16) } });
}

/**
 * Shoot a batch's lines (tools/text.mjs batch --shots): at the iPhone 17's
 * size, every scenario of every screen the lines are on, badging each line
 * where it first shows; a mock for each line none shows.
 * @param {{batch: string, lines: {n: number, id: string, screen: string, words: any}[], dir: string, engine?: string, size?: string, pw?: any, root?: string, warn?: (msg: string) => void}} o
 * @returns {Promise<{engine: string, version: string, size: string, shots: {file: string, name: string, screen: string, badges: {n: number, id: string, box: number[]}[], shown: {n: number, text: string}[]}[], mocks: {n: number, id: string, file: string}[], errors: string[]}>}
 */
export async function shootBatch({ batch, lines, dir, engine = 'webkit', size: sizeName = BATCH_SIZE_NAME, pw = null, root = ROOT, warn = (m) => console.warn(m) }) {
  const playwright = pw || (await loadPlaywright());
  if (!playwright) throw Object.assign(new Error(missingMessage()), { code: 'NO_PLAYWRIGHT' });
  const size = SIZES[/** @type {keyof typeof SIZES} */ (sizeName)];
  mkdirSync(dir, { recursive: true });
  const { browser, engine: used, version } = await launch(playwright, engine, warn);
  const site = await serveSite(root);
  const claimed = new Set();
  const shots = [];
  const mocks = [];
  const errors = [];
  try {
    let k = 0;
    for (const sc of batchScenarios(lines)) {
      if (!lines.some((l) => l.screen === sc.screen && !claimed.has(l.id))) continue;
      const { context, page, errors: pageErrors } = await openPage(browser, size, sc);
      try {
        await settle(page, site.base, sc);
        const found = await lineBoxes(page);
        const badges = claimBadges(lines, sc.screen, found, claimed);
        if (!badges.length) continue;
        // The words every one of the batch's lines shows in this picture, var
        // fills in, badged here or earlier (the batch's not-ours tail reads them).
        const texts = await lineTexts(page);
        const shown = lines.filter((l) => l.screen === sc.screen && found[l.id] && texts[l.id]).map((l) => ({ n: l.n, text: texts[l.id] }));
        await drawBadges(page, badges);
        const file = shotName(++k, `${sc.screen}-${sc.name}`, used);
        await page.screenshot({ path: join(dir, file) });
        shots.push({ file, name: sc.name, screen: sc.screen, badges, shown });
      } finally {
        errors.push(...pageErrors.map((e) => `${sc.name}: ${e}`));
        await context.close();
      }
    }
    const rest = lines.filter((l) => !claimed.has(l.id));
    if (rest.length) {
      const { context, page } = await openPage(browser, size, { name: 'mock', screen: 'mock', hash: '' });
      try {
        await page.goto(`${site.base}/preview/version.json`);
        for (const l of rest) {
          const file = `mock-${String(l.n).padStart(2, '0')}-${l.id.replace(/[^a-z0-9]+/g, '_')}.${used}.png`;
          await mockBox(page, l, join(dir, file));
          mocks.push({ n: l.n, id: l.id, file });
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
    await site.close();
  }
  return { engine: used, version, size: `${size.label} (${size.width} x ${size.height} @${size.dpr})`, shots, mocks, errors, batch };
}

/**
 * Shoot a set at the sizes: <out>/<set>/<size>/<NN>-<name>.<engine>.png
 * and <out>/<set>/manifest.json.
 * @param {{set: string, sizes: string[], out: string, engine?: string, pw: any, root?: string, build?: string, warn?: (msg: string) => void}} o
 */
export async function shootSet({ set, sizes, out, engine = 'webkit', pw, root = ROOT, build = 'dev', warn = (m) => console.warn(m) }) {
  const scenarios = SETS[set];
  if (!scenarios) throw new Error(`shots: no set "${set}" (${Object.keys(SETS).join(', ')})`);
  const { browser, engine: used, version } = await launch(pw, engine, warn);
  const site = await serveSite(root);
  const dir = join(out, set);
  rmSync(dir, { recursive: true, force: true });
  const files = [];
  const errors = [];
  try {
    for (const s of sizes) {
      const size = SIZES[/** @type {keyof typeof SIZES} */ (s)];
      mkdirSync(join(dir, s), { recursive: true });
      let k = 0;
      for (const sc of scenarios) {
        k++;
        if (sc.sizes && !sc.sizes.includes(s)) continue;
        const { context, page, errors: pageErrors } = await openPage(browser, size, sc);
        try {
          await settle(page, site.base, sc);
          const file = `${s}/${shotName(k, sc.name, used)}`;
          await page.screenshot({ path: join(dir, file) });
          files.push({ file, size: s, name: sc.name, hash: sc.hash, steps: sc.steps || [] });
        } finally {
          errors.push(...pageErrors.map((e) => `${s} ${sc.name}: ${e}`));
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
    await site.close();
  }
  const manifest = {
    set,
    engine: used,
    version,
    playwright: PLAYWRIGHT_VERSION,
    build,
    sizes: Object.fromEntries(sizes.map((s) => [s, SIZES[/** @type {keyof typeof SIZES} */ (s)]])),
    files,
    errors,
  };
  writeFileSync(join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 1)}\n`);
  return manifest;
}

/** The value after a flag, or null. */
const flag = (args, f) => {
  const k = args.indexOf(f);
  return k >= 0 && k + 1 < args.length ? args[k + 1] : null;
};

/**
 * The command line. Returns the exit code: 0, 1 on an error, 2 when
 * Playwright isn't there.
 * @param {string[]} args
 * @param {{load?: () => Promise<any>, log?: (s: string) => void, error?: (s: string) => void, root?: string}} [o]
 */
export async function main(args, { load = loadPlaywright, log = (s) => console.log(s), error = (s) => console.error(s), root = ROOT } = {}) {
  let sizes;
  try {
    sizes = pickSizes(flag(args, '--sizes'));
  } catch (e) {
    error(e.message);
    return 1;
  }
  const engine = flag(args, '--engine') || 'webkit';
  if (!ENGINES.includes(engine)) {
    error(`shots: no engine "${engine}" (${ENGINES.join(', ')})`);
    return 1;
  }
  const pw = await load();
  if (!pw) {
    error(missingMessage());
    return 2;
  }
  const out = flag(args, '--out') || join(root, 'out', 'shots');
  const { buildInfo } = await import('./build.mjs');
  const build = buildInfo(root).id;
  const batch = flag(args, '--batch');
  if (batch) {
    const { readText, batchLines } = await import('./text.mjs');
    const r = batchLines(readText(root), batch);
    if (r.errors.length) {
      for (const e of r.errors) error(e);
      return 1;
    }
    for (const s of sizes) {
      const shot = await shootBatch({ batch, lines: r.lines, dir: join(out, batch, s), engine, size: s, pw, root, warn: error });
      log(`shots: ${batch} at ${s}: ${shot.shots.length} pictures, ${shot.mocks.length} mocks (${shot.engine} ${shot.version}) -> ${relative(root, join(out, batch, s))}/`);
      for (const e of shot.errors) error(`shots: page error: ${e}`);
    }
    return 0;
  }
  const set = flag(args, '--set') || 's5';
  const m = await shootSet({ set, sizes, out, engine, pw, root, build, warn: error });
  log(`shots: ${set}, ${m.files.length} pictures at ${sizes.join(', ')} (${m.engine} ${m.version}, ${build}) -> ${relative(root, join(out, set))}/`);
  for (const e of m.errors) error(`shots: page error: ${e}`);
  return 0;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      console.error(e && e.stack ? e.stack : String(e));
      process.exit(1);
    },
  );
}
