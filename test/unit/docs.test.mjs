// Session 2's renames and the record (BUILD_PLAN 1.1, 8.1, 8.2; GAME_DESIGN
// Lead call 11): the flag is gentle, the title page lives in ui/home.js, the
// README and package.json carry no book frame, and every build log entry has
// its five lines and its batch line.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { BOOK_WORDS } from '../../tools/text.mjs';

const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

/** Every file under a folder, as repo paths with forward slashes, sorted. */
function files(rel) {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else out.push(relative(ROOT, p).split(sep).join('/'));
    }
  };
  walk(join(ROOT, rel));
  return out;
}

/** F.3's book words in a text, every hit. */
function bookWords(s) {
  return s.match(new RegExp(BOOK_WORDS.source, 'gi')) || [];
}

test('the flag is gentle, not storybook (lead call 11)', () => {
  const flags = JSON.parse(read('config/flags.json'));
  assert.deepEqual(flags, { gentle: false, larry: true });
});

test('the title page lives in ui/home.js, and nothing names the old file', () => {
  assert.ok(existsSync(join(ROOT, 'web/js/ui/home.js')));
  assert.ok(!existsSync(join(ROOT, 'web/js/ui/shelf.js')));
  assert.match(read('web/js/main.js'), /import\('\.\/ui\/home\.js'\)/);
  const home = read('web/js/ui/home.js');
  assert.match(home, /^export async function showTitle\(/m, 'showTitle keeps its name');
  const header = home.split('\n').filter((l) => l.startsWith('//')).join('\n');
  assert.deepEqual(bookWords(header).filter((w) => !/^pages?$/i.test(w)), [], 'the header has no book words (the title page is a web page)');
  const old = ['shelf', 'js'].join('.');
  const self = 'test/unit/docs.test.mjs';
  const scanned = [...files('web'), ...files('tools'), ...files('test'), ...files('.github'), 'README.md', 'package.json', 'content/text/README.md'];
  const naming = scanned.filter((f) => f !== self && !f.endsWith('.png') && !f.endsWith('.woff2') && read(f).includes(old));
  assert.deepEqual(naming, []);
});

test('package.json names OP Hiker, has no book words, and its scripts are the README\'s', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.description, /^Olympic Peninsula Hiker \(OP Hiker\): /);
  assert.deepEqual(bookWords(JSON.stringify(pkg)), []);
  // BUILD_PLAN 2.1: one dev dependency, TypeScript, exact, with a lockfile; nothing the page loads.
  assert.ok(!pkg.dependencies, 'no runtime dependencies');
  assert.deepEqual(Object.keys(pkg.devDependencies), ['typescript'], 'exactly one dev dependency');
  assert.match(pkg.devDependencies.typescript, /^\d+\.\d+\.\d+$/, 'at an exact version');
  const lock = JSON.parse(read('package-lock.json'));
  assert.equal(lock.packages['node_modules/typescript'].version, pkg.devDependencies.typescript, 'the lockfile pins the same');
  assert.deepEqual(Object.keys(lock.packages).sort(), ['', 'node_modules/typescript'], 'and nothing else');
  const scripts = Object.keys(pkg.scripts).sort();
  // S4 adds ingest (BUILD_PLAN 3.2); S5 (sound A1) adds listen (BUILD_PLAN 13.5), and (the words) shots and text:batch (10.7).
  assert.deepEqual(scripts, ['build', 'ci', 'ingest', 'lint', 'listen', 'play', 'render', 'serve', 'shots', 'sim:smoke', 'test', 'text:apply', 'text:batch', 'text:check', 'text:count', 'typecheck']);
  assert.equal(pkg.scripts.listen, 'node tools/listen.mjs');
  assert.equal(pkg.scripts.shots, 'node tools/shots.mjs');
  assert.equal(pkg.scripts['text:batch'], 'node tools/text.mjs batch');
  // BUILD_PLAN 6.5: ci runs the five checks, in that order.
  assert.equal(pkg.scripts.ci, 'npm run build && npm run lint && npm run typecheck && npm run test && npm run sim:smoke');
  assert.equal(pkg.scripts['sim:smoke'], 'node tools/sim.mjs --smoke 1000');
  // The README's command list is the scripts, no more and no fewer.
  const readme = read('README.md');
  const listed = [...readme.matchAll(/^npm (?:run )?([a-z:]+)/gm)].map((m) => m[1]).sort();
  assert.deepEqual(listed, scripts);
});

test('the README carries the icon and both names, serves at the root, and has no book frame', () => {
  const readme = read('README.md');
  assert.ok(readme.startsWith('<img src="https://ophiker.com/icons/icon-192.png" width="96" alt="The OP Hiker icon">\n'), 'the icon comes first');
  for (const s of ['**OP Hiker**', '**OP Preview**', 'https://ophiker.com/preview/', 'http://127.0.0.1:8104/, preview at /preview/', 'content/text/', 'content/scope/', 'web/js/platform/', 'web/sw.js', 'web/js/engine/', 'schemas/', 'sims/', 'test/golden/', 'test/fixtures/', 'npm ci --ignore-scripts', 'The engine is pure: Node runs the same files']) {
    assert.ok(readme.includes(s), s);
  }
  assert.ok(!readme.includes('8104/104-boyz'), 'serve is at the root now');
  assert.ok(!/working title/i.test(readme), 'decision 35 named it');
  // "page" is the web's own word here (the title page, GitHub Pages), and the
  // guest book is a real one, on T07's allowlist (F.3; S3); T07's other words
  // are the book frame, which is gone (decision 22).
  assert.deepEqual(bookWords(readme.replace(/\bguest book\b/gi, '')).filter((w) => !/^pages?$/i.test(w)), []);
});

test('every build log entry from S2 on has the five lines and the batch line (BUILD_PLAN 8.1)', () => {
  const log = read('design/BUILD_LOG.md');
  const entries = log.split(/^## /m).slice(1).filter((e) => /^S\d+[a-z]? · /.test(e));
  assert.ok(entries.length >= 2);
  for (const entry of entries) {
    const head = entry.slice(0, entry.indexOf('\n'));
    assert.match(head, /^S\d+[a-z]? · .+ \(\d{4}-\d{2}-\d{2}\)$/, head);
    const body = entry.split('\n').slice(1).join('\n').trim();
    // The entry's own bullets: the first run of lines that start a bullet.
    const bullets = body.split('\n\n')[0].split('\n').map((l) => /^- \*\*([^*]+):\*\*/.exec(l)?.[1]);
    const n = Number(/^S(\d+)/.exec(head)[1]);
    const want = ['Shipped', 'Try this', 'Next', 'Questions', 'Notes'];
    if (n >= 2) want.push('Batch');
    assert.deepEqual(bullets, want, head);
    if (n >= 2) assert.match(body, /^- \*\*Batch:\*\* (?:none|B\d{3}), \d+ lines?\b/m, `${head}: Batch: <id or none>, n lines`);
  }
});
