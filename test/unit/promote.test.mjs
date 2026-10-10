// The promotion's dry run (BUILD_PLAN 6.1, 10.6; S6): tools/promote.mjs's
// pure parts on fixtures (the live build's environment, the build stamp
// taken out, the file and word diffs, the reach split, the colors and
// screens, the refusals, the live site's check, the PNG reader and the side
// by side), and one run with no live ref, as CI's shallow checkout has: it
// says so and still holds main's words to the ledger. The run against the
// real origin/main, its live check and the update in Chromium are the
// session's (they need the history, the network and a browser).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { liveEnv, unstamp, diffFiles, splitReach, colorsOf, screensOf, wordRows, wordDiff, problemsOf, liveCheck, decodePNG, shrink, sideBySide, summaryText, dryRun, DEFAULT_REF, LIVE_URL, LISTS } from '../../tools/promote.mjs';
import { stampWorker, SW_STAMP } from '../../tools/build.mjs';
import { encodePNG, crc32 } from '../../tools/png.mjs';
import { PALETTE } from '../../web/js/gfx/palette.js';
import { ROOT } from '../../tools/pics.mjs';

const B = (s) => Buffer.from(s);

test('the live ref builds outside git with GITHUB_ACTIONS cleared, the runner files out and CHANNEL=main; nothing else changes', () => {
  const env = { PATH: '/bin', GITHUB_ACTIONS: 'true', CI: 'true', GITHUB_OUTPUT: '/x', GITHUB_STEP_SUMMARY: '/y', CHANNEL: 'preview' };
  assert.deepEqual(liveEnv(env), { PATH: '/bin', CI: 'true', CHANNEL: 'main' });
  assert.equal(env.GITHUB_ACTIONS, 'true', 'ours is untouched');
  assert.deepEqual([DEFAULT_REF, LIVE_URL], ['origin/main', 'https://ophiker.com/']);
  assert.deepEqual([...LISTS], ['precache.json', 'version.json']);
});

test("the build stamp comes out: sw.js's four lines, the page's data-build, data-commit and bare build code; every other file as it is", () => {
  const src = [...SW_STAMP, "self.addEventListener('install', () => {});", ''].join('\n');
  const a = B(stampWorker(src, { channel: 'main', build: 'dev', files: 'aaaaaaaaaaaa' }));
  const b = B(stampWorker(src, { channel: 'main', build: '20261010-1c73215', files: 'bbbbbbbbbbbb' }));
  assert.ok(!a.equals(b));
  assert.equal(unstamp('sw.js', a).toString(), src, 'back to the placeholders');
  assert.ok(unstamp('sw.js', a).equals(unstamp('sw.js', b)));
  const c = B(stampWorker(src.replace('install', 'activate'), { channel: 'main', build: 'dev', files: 'aaaaaaaaaaaa' }));
  assert.ok(!unstamp('sw.js', a).equals(unstamp('sw.js', c)), 'a change to the code is still a change');
  const page = (id, commit) => B(`<html lang="en" data-build="${id}" data-channel="main"${commit ? ` data-commit="${commit}"` : ''}>\n<span class="build-stamp" data-t="app.build">${id}</span>\n<p>dev words stay</p>`);
  assert.ok(unstamp('index.html', page('dev'), { build: 'dev' }).equals(unstamp('index.html', page('20261009-44d5baf'), { build: '20261009-44d5baf' })));
  assert.ok(unstamp('index.html', page('dev', 'abc'), { build: 'dev' }).equals(unstamp('index.html', page('x1', 'def'), { build: 'x1' })), 'the commit too');
  assert.match(unstamp('index.html', page('dev'), { build: 'dev' }).toString(), /dev words stay/, 'only the stamp, never the word "dev" elsewhere');
  const css = B('body{color:red}');
  assert.equal(unstamp('css/game.css', css, { build: 'dev' }), css, 'any other file is the same bytes');
});

test('two builds compared: added, removed, the same, the lists every build rewrites, the build stamp alone, and real changes', () => {
  const src = [...SW_STAMP, 'code();'].join('\n');
  const live = {
    'css/game.css': B('a'),
    'index.html': B('<html data-build="dev"><b>dev</b>'),
    'js/gone.js': B('x'),
    'precache.json': B('{"build":"dev"}'),
    'sw.js': B(stampWorker(src, { channel: 'main', build: 'dev', files: 'f1' })),
    'text/en.json': B('{"a":1}'),
  };
  const next = {
    'css/game.css': B('a'),
    'index.html': B('<html data-build="s6"><b>s6</b>'),
    'js/new.js': B('y'),
    'precache.json': B('{"build":"s6"}'),
    'sw.js': B(stampWorker(src, { channel: 'main', build: 's6', files: 'f2' })),
    'text/en.json': B('{"a":2}'),
  };
  assert.deepEqual(diffFiles(live, next, { liveStamp: { build: 'dev' }, nextStamp: { build: 's6' } }), {
    added: ['js/new.js'],
    removed: ['js/gone.js'],
    changed: ['text/en.json'],
    stamp: ['index.html', 'sw.js'],
    lists: ['precache.json'],
    same: ['css/game.css'],
  });
  // Without the stamps the page's bare build code differs, so the page is a change.
  assert.deepEqual(diffFiles(live, next).changed, ['index.html', 'text/en.json']);
});

test("the reach split: main's precache paths and the worker and its lists are what an installed app downloads; the rest ships and is never loaded", () => {
  assert.deepEqual(splitReach(['css/frame.css', 'index.html', 'js/engine/odds.js', 'sw.js', 'version.json'], ['index.html', 'js/engine/odds.js']), {
    reached: ['index.html', 'js/engine/odds.js', 'sw.js', 'version.json'],
    never: ['css/frame.css'],
  });
  assert.deepEqual(splitReach([], []), { reached: [], never: [] });
});

test("the shell's colors, a build's screens (its stamp, else its scope's main block), and where each word of main's bundle shows", () => {
  const html = '<html data-screens="title debug app"><meta name="theme-color" content="#343945"><p data-t="app.name"></p><button data-t-aria="app.update.restart"></button>';
  assert.deepEqual(colorsOf(html, '{"background_color":"#343945","theme_color":"#343945"}'), { meta: '#343945', background_color: '#343945', theme_color: '#343945' });
  assert.deepEqual(colorsOf('<html>', '{}'), { meta: null, background_color: null, theme_color: null });
  assert.deepEqual(screensOf(html), ['app', 'debug', 'title']);
  assert.deepEqual(screensOf('<html data-build="dev">', { main: { screens: ['title', 'app', 'debug'] } }), ['app', 'debug', 'title'], "S2's page has no stamp: its scope says");
  assert.equal(screensOf('<html>', null), null);
  const bundle = { 'app.name': 'Olympic Peninsula Hiker', 'app.short_name': 'OP Hiker', 'app.update.restart': 'Restart', 'dev.close': 'Close', 'app.preview_name': 'OP Preview' };
  const rows = wordRows(bundle, html, { state: (id) => (id.startsWith('dev.') ? 'dev' : 'approved'), dev: (id) => id.startsWith('dev.') });
  assert.deepEqual(
    rows.map((r) => [r.id, r.where, r.state]),
    [
      ['app.name', 'page', 'approved'],
      ['app.preview_name', 'code', 'approved'],
      ['app.short_name', 'manifest', 'approved'],
      ['app.update.restart', 'page', 'approved'],
      ['dev.close', 'debug menu', 'dev'],
    ],
  );
  assert.equal(rows[0].words, 'Olympic Peninsula Hiker');
  assert.deepEqual(wordDiff({ a: '1', b: '2', c: '3' }, { a: '1', b: '9', d: '4' }), { added: ['d'], removed: ['c'], changed: ['b'] });
});

test('the refusals: a word that is not approved, a T14 issue, or a change to main\'s screens; none when live\'s screens are unknown', () => {
  const ok = [{ id: 'app.name', state: 'approved', where: 'page' }, { id: 'app.build', state: 'nowords', where: 'page' }, { id: 'dev.close', state: 'dev', where: 'debug menu' }, { id: 'app.x', state: 'changed', where: 'page' }];
  const same = { live: ['app', 'debug', 'title'], next: ['app', 'debug', 'title'] };
  assert.deepEqual(problemsOf({ rows: ok, issues: [], screens: same }), []);
  assert.deepEqual(problemsOf({ rows: [...ok, { id: 'trail.walk_on', state: 'draft', where: 'page' }], issues: [], screens: same }), ['trail.walk_on (page) is draft: main ships approved words only (T14)']);
  assert.deepEqual(problemsOf({ rows: [{ id: 'x.y', state: 'cut', where: 'code' }], issues: [], screens: same }), ['x.y (code) is cut: main ships approved words only (T14)']);
  assert.deepEqual(problemsOf({ rows: ok, issues: [{ file: 'index.html', line: 3, code: 'T14', msg: 'main\'s page shows "Hi"' }], screens: same }), ['index.html:3: T14 main\'s page shows "Hi"']);
  assert.deepEqual(problemsOf({ rows: ok, issues: [], screens: { live: ['app', 'debug', 'title'], next: ['app', 'debug', 'title', 'trail'] } }), ["main's screens would change: app debug title -> app debug title trail"]);
  assert.deepEqual(problemsOf({ rows: ok, issues: [], screens: { live: null, next: ['app'] } }), []);
});

test("the live check: the live site's commit, its precache's hashes and its page against the live build, the stamps aside", () => {
  const page = (id) => `<html data-build="${id}"><span>${id}</span>`;
  const live = { commit: 'c1', version: { build: 'dev' }, precache: { paths: { 'index.html': 'h0', 'css/game.css': 'h1' } }, page: page('dev') };
  const site = { version: { build: '20261009-44d5baf', commit: 'c1' }, precache: { paths: { 'index.html': 'hX', 'css/game.css': 'h1' } }, page: page('20261009-44d5baf') };
  assert.deepEqual(liveCheck(site, live), { reached: true, build: '20261009-44d5baf', commit: 'c1', sameCommit: true, differ: [], page: true, same: true });
  assert.equal(liveCheck({ ...site, version: { ...site.version, commit: 'c2' } }, live).same, false, 'another commit');
  assert.deepEqual(liveCheck({ ...site, precache: { paths: { 'index.html': 'hX', 'css/game.css': 'h2', 'js/x.js': 'h3' } } }, live).differ, ['css/game.css', 'js/x.js']);
  assert.equal(liveCheck({ ...site, page: '<html data-build="x"><p>new</p>' }, live).page, false);
  assert.equal(liveCheck({ ...site, page: null }, live).page, null, 'the page not fetched');
  assert.deepEqual(liveCheck({ version: null, precache: null, page: null }, live), { reached: false, same: false });
});

/** A truecolor PNG with each row's own filter, as other encoders write them. */
function filteredPNG(width, height, rgb, filters) {
  const bpp = 3;
  const stride = width * bpp;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    const f = filters[y % filters.length];
    raw[y * (stride + 1)] = f;
    for (let i = 0; i < stride; i++) {
      const x = rgb[y * stride + i];
      const left = i >= bpp ? rgb[y * stride + i - bpp] : 0;
      const up = y ? rgb[(y - 1) * stride + i] : 0;
      const ul = y && i >= bpp ? rgb[(y - 1) * stride + i - bpp] : 0;
      const pa = Math.abs(up - ul);
      const pb = Math.abs(left - ul);
      const pc = Math.abs(left + up - 2 * ul);
      const pred = [0, left, up, (left + up) >> 1, pa <= pb && pa <= pc ? left : pb <= pc ? up : ul][f];
      raw[y * (stride + 1) + 1 + i] = (x - pred) & 255;
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

test("the PNG reader: png.mjs's own RGB and RGBA, every row filter, and a refusal for anything else", () => {
  const w = 5;
  const h = 5;
  const rgb = new Uint8Array(w * h * 3).map((_, i) => (i * 37 + (i >> 2) * 11) & 255);
  assert.deepEqual(decodePNG(encodePNG({ width: w, height: h, type: 'rgb', data: rgb })), { width: w, height: h, rgb });
  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) rgba.set([rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2], 200], i * 4);
  assert.deepEqual(decodePNG(encodePNG({ width: w, height: h, type: 'rgba', data: rgba })).rgb, rgb, 'alpha dropped');
  assert.deepEqual(decodePNG(filteredPNG(w, h, rgb, [0, 1, 2, 3, 4])).rgb, rgb, 'None, Sub, Up, Average and Paeth');
  assert.throws(() => decodePNG(encodePNG({ width: 2, height: 1, type: 'indexed', data: new Uint8Array([0, 1]), palette: [[0, 0, 0], [255, 255, 255]] })), /only 8-bit truecolor/);
  assert.throws(() => decodePNG(Buffer.alloc(40)), /not a PNG/);
});

test('shrink takes every kth pixel; side by side puts rows of pictures top-aligned on a ground, an empty cell as wide as its column', () => {
  const px = (r) => ({ width: 2, height: 2, rgb: new Uint8Array([r, 0, 0, r + 1, 0, 0, r + 2, 0, 0, r + 3, 0, 0]) });
  assert.deepEqual(shrink(px(10), 2), { width: 1, height: 1, rgb: new Uint8Array([10, 0, 0]) });
  const tall = { width: 1, height: 3, rgb: new Uint8Array(9).fill(7) };
  const img = sideBySide([[px(10), tall], [null, px(50)]], [1, 2, 3], 1);
  // Columns 2 and 2 wide (the second as wide as its widest, 50's), rows 3 and 2 tall, a 1-pixel gap around and between.
  assert.deepEqual([img.width, img.height], [1 + 2 + 1 + 2 + 1, 1 + 3 + 1 + 2 + 1]);
  const at = (x, y) => [...img.rgb.subarray((y * img.width + x) * 3, (y * img.width + x) * 3 + 3)];
  assert.deepEqual(at(0, 0), [1, 2, 3], 'the ground');
  assert.deepEqual(at(1, 1), [10, 0, 0]);
  assert.deepEqual(at(2, 2), [13, 0, 0]);
  assert.deepEqual(at(1, 3), [1, 2, 3], 'top-aligned: under a short picture is ground');
  assert.deepEqual(at(4, 3), [7, 7, 7], 'the tall one runs down its row');
  assert.deepEqual(at(5, 1), [1, 2, 3], 'beside a narrow picture is ground');
  assert.deepEqual(at(1, 5), [1, 2, 3], 'an empty cell');
  assert.deepEqual(at(4, 5), [50, 0, 0]);
});

test('the summary names both builds, every word with its state, the screens, the files by reach, the colors, the precache and the hash, and says REFUSED with a problem', () => {
  const report = {
    next: { build: 's6', worktree: 'clean', screens: ['app', 'debug', 'title'], rules: 'r6', colors: { meta: '#343945', background_color: '#343945', theme_color: '#343945' }, cache: { files: 66, bytes: 2048 }, palette0: '#343945' },
    live: { ref: 'origin/main', commit: '44d5bafe1d45', build: 'dev', screens: ['app', 'debug', 'title'], rules: null, colors: { meta: '#1b1f2a', background_color: '#1b1f2a', theme_color: '#1b1f2a' }, cache: { files: 27, bytes: 1024 } },
    words: { rows: [{ id: 'app.name', words: 'Olympic Peninsula Hiker', state: 'approved', where: 'page' }], issues: [], diff: { added: ['dev.check.match'], removed: [], changed: [] } },
    screens: { live: ['app', 'debug', 'title'], next: ['app', 'debug', 'title'] },
    files: { added: { reached: ['js/ui/motion.js'], never: ['css/frame.css'] }, changed: { reached: ['css/tokens.css'], never: [] }, removed: { reached: [], never: [] }, stamp: [], lists: ['precache.json', 'version.json'], same: 4 },
    pictures: 'cover_icons.png',
    problems: [],
  };
  const text = summaryText(report).join('\n');
  for (const s of [
    'main dev (origin/main 44d5baf) -> s6',
    'app.name [approved, page]: "Olympic Peninsula Hiker"',
    'added dev.check.match',
    'screens: app debug title -> app debug title (unchanged)',
    "files added: main's page reaches js/ui/motion.js; shipped, never loaded: 1 (css/frame.css)",
    'theme-color #1b1f2a, manifest #1b1f2a and #1b1f2a -> theme-color #343945',
    'precache: 27 files, 1.0 KB -> 66 files, 2.0 KB',
    'rules hash: none -> r6',
    'main can be promoted',
  ])
    assert.ok(text.includes(s), s);
  const refused = summaryText({ ...report, problems: ['x.y (page) is draft'] }).join('\n');
  assert.match(refused, /REFUSED: 1 problem\(s\):\n {4}x\.y \(page\) is draft/);
  assert.match(summaryText({ ...report, live: null, files: undefined, screens: { live: null, next: ['app'] } }).join('\n'), /main \(no live build\) -> s6/);
});

test("a dry run with no live ref (CI's shallow checkout) says so, builds main from the tree and holds its words to the ledger: B001's lines, the bare build code and the debug menu's dev lines, in palette A", async (t) => {
  const out = mkdtempSync(join(tmpdir(), 'oph-promote-test-'));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  const logs = [];
  const { report, code } = await dryRun({ ref: 'refs/heads/no-such-branch-here', out, log: (s) => logs.push(s) });
  assert.equal(code, 0);
  assert.match(logs[0], /no refs\/heads\/no-such-branch-here here .*git fetch origin main/);
  assert.equal(report.live, null);
  assert.deepEqual(report.problems, []);
  assert.deepEqual(report.words.issues, [], 'T14 over the build is green');
  assert.deepEqual(report.screens.next, ['app', 'debug', 'title'], "main's screens");
  const states = Object.fromEntries(report.words.rows.map((r) => [r.id, r.state]));
  assert.ok(Object.values(states).every((s) => ['approved', 'nowords', 'dev'].includes(s)), JSON.stringify(states));
  assert.equal(states['app.build'], 'nowords');
  assert.deepEqual(report.words.rows.filter((r) => r.state === 'dev').map((r) => r.where), Array(6).fill('debug menu'));
  // Palette A: the shell's and manifest's colors are slot 0 (decision 68).
  assert.deepEqual(report.next.colors, { meta: PALETTE[0], background_color: PALETTE[0], theme_color: PALETTE[0] });
  assert.equal(report.next.palette0, PALETTE[0]);
  assert.ok(existsSync(join(out, 'next', 'version.json')) && existsSync(join(out, 'report.json')));
  assert.deepEqual(JSON.parse(readFileSync(join(out, 'report.json'), 'utf8')).problems, []);
  assert.ok(!existsSync(join(out, 'live')), 'no live build');
});

test('the tool only dry-runs: without --dry-run it says who promotes, and exits 2', () => {
  let err = null;
  try {
    execFileSync(process.execPath, [join(ROOT, 'tools', 'promote.mjs')], { stdio: 'pipe' });
  } catch (e) {
    err = e;
  }
  assert.ok(err);
  assert.equal(/** @type {any} */ (err).status, 2);
  assert.match(String(/** @type {any} */ (err).stderr), /only --dry-run: main is promoted by the lead/);
});
