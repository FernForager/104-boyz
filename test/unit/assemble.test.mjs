// One deployment, two channels (GAME_DESIGN E.9; BUILD_PLAN 6.1 to 6.3): the
// site assembly, its refusals and the /preview/ placeholder; which preview
// goes up; and tools/preview.mjs against a real (temporary) git origin.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from '../../tools/build.mjs';
import { assemble, placeholderPage, placeholderWords, liveVerdict, checkLive, workerStamp } from '../../tools/assemble-site.mjs';
import { choosePreview, shouldTryTag, buildPreview, previewEnv } from '../../tools/preview.mjs';
import { pageStrings, readText, stateOf, PLACEHOLDER_IDS } from '../../tools/text.mjs';
import { ROOT } from '../../tools/pics.mjs';

const tmp = mkdtempSync(join(tmpdir(), 'oph-assemble-'));
const dist = {};
for (const channel of ['main', 'preview']) {
  dist[channel] = join(tmp, 'dist', channel);
  build({ out: dist[channel], channel, quiet: true });
}
test.after(() => rmSync(tmp, { recursive: true, force: true }));

const files = (dir) => {
  const out = [];
  const walk = (d, pre) => {
    for (const n of readdirSync(d, { withFileTypes: true })) {
      if (n.isDirectory()) walk(join(d, n.name), `${pre}${n.name}/`);
      else out.push(`${pre}${n.name}`);
    }
  };
  walk(dir, '');
  return out.sort();
};

test('two built channels assemble: main at the root, preview under preview/', () => {
  const out = join(tmp, 'site-both');
  assert.deepEqual(assemble({ main: dist.main, preview: dist.preview, out }), { preview: 'build' });
  const version = (p) => JSON.parse(readFileSync(join(out, p), 'utf8'));
  assert.equal(version('version.json').channel, 'main');
  assert.equal(version('preview/version.json').channel, 'preview');
  assert.equal(workerStamp(readFileSync(join(out, 'sw.js'), 'utf8')).channel, 'main');
  assert.equal(workerStamp(readFileSync(join(out, 'preview', 'sw.js'), 'utf8')).channel, 'preview');
  assert.deepEqual(files(out).filter((f) => !f.startsWith('preview/')), files(dist.main));
  assert.deepEqual(files(join(out, 'preview')), files(dist.preview));
  assert.ok(!existsSync(join(out, '.nojekyll')) && !existsSync(join(out, 'CNAME')), 'no .nojekyll, no CNAME');
});

test('a channel in the wrong place is refused, and nothing is written', () => {
  const out = join(tmp, 'site-refused');
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'keep.txt'), 'x');
  assert.throws(() => assemble({ main: dist.preview, preview: dist.main, out }), /refused[\s\S]*version\.json is channel "preview", not main[\s\S]*sw\.js is stamped for "preview"/);
  assert.ok(existsSync(join(out, 'keep.txt')), 'the old site is untouched');
  const withPreview = join(tmp, 'main-with-preview');
  cpSync(dist.main, withPreview, { recursive: true });
  mkdirSync(join(withPreview, 'preview'));
  assert.throws(() => assemble({ main: withPreview, out }), /already holds preview\//);
  const unstamped = join(tmp, 'main-unstamped');
  cpSync(dist.main, unstamped, { recursive: true });
  cpSync(join(ROOT, 'web', 'sw.js'), join(unstamped, 'sw.js'));
  assert.throws(() => assemble({ main: unstamped, out }), /sw\.js is stamped for "dev", not main/, "the unbuilt worker never ships");
  const noVersion = join(tmp, 'preview-broken');
  mkdirSync(noVersion, { recursive: true });
  assert.throws(() => assemble({ main: dist.main, preview: noVersion, out }), /no version\.json/, 'a preview folder that is there must be whole');
  assert.throws(() => assemble({ main: dist.main, out: dist.main }), /overlap/);
});

test('with no preview build, /preview/ is the placeholder: approved words, a link home, no worker, no manifest', () => {
  const out = join(tmp, 'site-placeholder');
  assert.deepEqual(assemble({ main: dist.main, preview: join(tmp, 'not-there'), out }), { preview: 'placeholder' });
  assert.deepEqual(files(join(out, 'preview')), ['index.html', 'version.json']);
  assert.deepEqual(JSON.parse(readFileSync(join(out, 'preview', 'version.json'), 'utf8')), { build: null, channel: 'preview', placeholder: true });
  const page = readFileSync(join(out, 'preview', 'index.html'), 'utf8');
  assert.deepEqual(
    pageStrings(page).map((s) => s.s),
    ['OP Preview', 'Olympic Peninsula Hiker'],
  );
  assert.match(page, /<title>OP Preview<\/title>/);
  assert.match(page, /<a href="\.\.\/">Olympic Peninsula Hiker<\/a>/, 'a relative link to main');
  const text = readText(ROOT);
  for (const id of PLACEHOLDER_IDS) assert.equal(stateOf(id, text), 'approved', `${id} is approved`);
  assert.equal(placeholderPage(placeholderWords(ROOT)), page);
  assert.equal(placeholderPage({ 'app.preview_name': 'A <b>', 'app.name': 'x & y' }).includes('A &lt;b&gt;'), true, 'escaped');
  assert.throws(() => placeholderPage({ 'app.name': 'x' }), /needs approved words for app\.preview_name/);
});

test('which preview goes up', () => {
  const cases = [
    [{ head: 'a', headOk: true, tag: 'b', tagOk: true }, 'head'],
    [{ head: 'a', headOk: true, tag: null, tagOk: false }, 'head'],
    [{ head: 'a', headOk: false, tag: 'b', tagOk: true }, 'tag'],
    [{ head: 'a', headOk: false, tag: 'b', tagOk: false }, 'placeholder'],
    [{ head: 'a', headOk: false, tag: 'a', tagOk: true }, 'placeholder'],
    [{ head: null, headOk: false, tag: 'b', tagOk: true }, 'tag'],
    [{ head: null, headOk: false, tag: null, tagOk: false }, 'placeholder'],
  ];
  for (const [o, want] of cases) assert.equal(choosePreview(o), want, JSON.stringify(o));
  assert.equal(shouldTryTag({ head: 'a', headOk: true, tag: 'b' }), false, 'the head built: no need');
  assert.equal(shouldTryTag({ head: 'a', headOk: false, tag: 'a' }), false, 'the same commit would fail the same way');
  assert.equal(shouldTryTag({ head: 'a', headOk: false, tag: 'b' }), true);
  assert.equal(shouldTryTag({ head: null, headOk: false, tag: 'b' }), true);
  assert.equal(shouldTryTag({ head: null, headOk: false, tag: null }), false);
});

test('the live check warns only on the same commit with other files', async () => {
  assert.equal(liveVerdict({ commit: 'c1', files: 'f1' }, { commit: 'c1', files: 'f2' }), 'warn');
  assert.equal(liveVerdict({ commit: 'c1', files: 'f1' }, { commit: 'c1', files: 'f1' }), 'same');
  assert.equal(liveVerdict({ commit: 'c0', files: 'f0' }, { commit: 'c1', files: 'f1' }), 'new');
  assert.equal(liveVerdict(null, { commit: 'c1', files: 'f1' }), 'new');
  assert.equal(liveVerdict({ build: 'old' }, { commit: 'c1', files: 'f1' }), 'new');
  const local = join(dist.main, 'version.json');
  const v = JSON.parse(readFileSync(local, 'utf8'));
  const logged = [];
  const log = (s) => logged.push(s);
  const answer = (body) => async () => ({ ok: true, json: async () => body });
  assert.equal(await checkLive('u', local, { fetchFn: answer({ ...v, files: 'ffffffffffff' }), log }), 'warn');
  assert.match(logged.pop(), /^::warning::/);
  assert.equal(await checkLive('u', local, { fetchFn: answer(v), log }), 'same');
  assert.equal(await checkLive('u', local, { fetchFn: async () => { throw new Error('offline'); }, log }), 'new', 'a network failure is ignored');
});

// ---- tools/preview.mjs, against a temporary origin ------------------------

const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.invalid', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.invalid', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' };
const git = (cwd, ...args) => execFileSync('git', ['-c', 'commit.gpgsign=false', '-c', 'tag.gpgsign=false', ...args], { cwd, env: GIT_ENV, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();

/**
 * The fake CI: a commit with a file named good builds dist/preview/
 * (version.json naming the channel and the commit); any other fails.
 */
const FAKE_CI = `node -e "const fs=require('fs');if(!fs.existsSync('good'))process.exit(1);fs.mkdirSync('dist/preview',{recursive:true});fs.writeFileSync('dist/preview/version.json',JSON.stringify({channel:process.env.CHANNEL,commit:fs.readFileSync('good','utf8').trim()}))"`;

/** An origin with main and, optionally, a preview branch and a last-good-preview tag; and a clone of it. */
function repos(name, { head, tag }) {
  const dir = join(tmp, name);
  const origin = join(dir, 'origin.git');
  const seed = join(dir, 'seed');
  mkdirSync(seed, { recursive: true });
  git(dir, 'init', '-q', '--bare', origin);
  git(seed, 'init', '-q', '-b', 'main');
  writeFileSync(join(seed, 'README'), 'main\n');
  git(seed, 'add', '.');
  git(seed, 'commit', '-q', '-m', 'main');
  git(seed, 'remote', 'add', 'origin', origin);
  git(seed, 'push', '-q', 'origin', 'main');
  const shas = {};
  const commit = (label, good) => {
    git(seed, 'checkout', '-q', '-B', label);
    if (good) writeFileSync(join(seed, 'good'), `${label}\n`);
    else rmSync(join(seed, 'good'), { force: true });
    writeFileSync(join(seed, 'which'), `${label}\n`);
    git(seed, 'add', '-A');
    git(seed, 'commit', '-q', '-m', label);
    return git(seed, 'rev-parse', 'HEAD');
  };
  if (tag) {
    shas.tag = commit('tagged', tag === 'good');
    git(seed, 'tag', 'last-good-preview');
    git(seed, 'push', '-q', 'origin', 'refs/tags/last-good-preview');
  }
  if (head) {
    shas.head = commit('head', head === 'good');
    git(seed, 'push', '-q', 'origin', 'HEAD:refs/heads/preview');
  }
  const main = join(dir, 'main');
  git(dir, 'clone', '-q', '--depth=1', '--no-tags', `file://${origin}`, main);
  return { main, out: join(dir, 'preview-dist'), shas, dir };
}

const run = (r) => buildPreview({ repo: r.main, out: r.out, ci: FAKE_CI, build: FAKE_CI, quiet: true, env: GIT_ENV });

test('preview.mjs: no preview branch and no tag gives the placeholder', () => {
  const r = repos('none', {});
  const got = run(r);
  assert.equal(got.status, 'placeholder');
  assert.equal(got.sha, '');
  assert.match(got.summary, /no preview branch; no last-good-preview; \/preview\/ is the placeholder/);
  assert.equal(existsSync(r.out), false, '--out is left absent');
});

test('preview.mjs: a good head is built, with its SHA', () => {
  const r = repos('good-head', { head: 'good', tag: 'good' });
  const got = run(r);
  assert.equal(got.status, 'built');
  assert.equal(got.sha, r.shas.head);
  assert.match(got.summary, new RegExp(`^preview: built ${r.shas.head.slice(0, 7)}$`));
  assert.deepEqual(JSON.parse(readFileSync(join(r.out, 'version.json'), 'utf8')), { channel: 'preview', commit: 'head' });
  assert.equal(existsSync(join(r.dir, 'preview-head')), false, 'the worktree is cleaned up');
});

test('preview.mjs: a bad head falls back to last-good-preview', () => {
  const r = repos('bad-head', { head: 'bad', tag: 'good' });
  const got = run(r);
  assert.equal(got.status, 'tag');
  assert.equal(got.sha, r.shas.tag);
  assert.match(got.summary, /head \w{7} failed; deployed last-good-preview \w{7}/);
  assert.deepEqual(JSON.parse(readFileSync(join(r.out, 'version.json'), 'utf8')), { channel: 'preview', commit: 'tagged' });
});

test("preview.mjs: the preview branch's build can't write the runner's env, outputs, path or summary", () => {
  const env = { PATH: '/usr/bin', HOME: '/home/runner', GITHUB_ENV: '/r/env', GITHUB_OUTPUT: '/r/out', GITHUB_PATH: '/r/path', GITHUB_STATE: '/r/state', GITHUB_STEP_SUMMARY: '/r/sum', GITHUB_SHA: 'abc', CHANNEL: 'main' };
  assert.deepEqual(previewEnv(env), { PATH: '/usr/bin', HOME: '/home/runner', GITHUB_SHA: 'abc', CHANNEL: 'preview' });
  assert.equal(env.GITHUB_ENV, '/r/env', 'ours is untouched');
  // And in a real run: the fake CI records what it was given.
  const r = repos('env', { head: 'good' });
  const spy = `node -e "const fs=require('fs');fs.mkdirSync('dist/preview',{recursive:true});fs.writeFileSync('dist/preview/version.json',JSON.stringify({channel:process.env.CHANNEL,env:process.env.GITHUB_ENV||null,out:process.env.GITHUB_OUTPUT||null}))"`;
  const got = buildPreview({ repo: r.main, out: r.out, ci: spy, build: spy, quiet: true, env: { ...GIT_ENV, GITHUB_ENV: join(r.dir, 'env'), GITHUB_OUTPUT: join(r.dir, 'out') } });
  assert.equal(got.status, 'built');
  assert.deepEqual(JSON.parse(readFileSync(join(r.out, 'version.json'), 'utf8')), { channel: 'preview', env: null, out: null });
});

test('preview.mjs: a bad head and a bad tag give the placeholder', () => {
  const r = repos('both-bad', { head: 'bad', tag: 'bad' });
  const got = run(r);
  assert.equal(got.status, 'placeholder');
  assert.match(got.summary, /failed too; \/preview\/ is the placeholder/);
  assert.equal(existsSync(r.out), false);
});
