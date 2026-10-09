import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { compileArt, makeIcons, buildInfo, build, buildAll, checkSize, stampWorker, precachePaths, makeData, ICONS, MAX_BYTES, SW_STAMP } from '../../tools/build.mjs';
import { ROOT } from '../../tools/pics.mjs';
import { readText, channelScreens } from '../../tools/text.mjs';
import { rulesHash } from '../../tools/rules.mjs';
import { canon } from '../../web/js/engine/canon.js';

/** Every file under dir, as {relative path: bytes}. */
function snapshot(dir) {
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

/** A truecolor PNG's pixels as "r,g,b" strings (filter 0 rows, as png.mjs writes them). */
function pixels(png) {
  const w = png.readUInt32BE(16);
  const h = png.readUInt32BE(20);
  const idat = [];
  for (let p = 8; p < png.length; ) {
    const len = png.readUInt32BE(p);
    if (png.toString('ascii', p + 4, p + 8) === 'IDAT') idat.push(png.subarray(p + 8, p + 8 + len));
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const out = new Set();
  for (let y = 0; y < h; y++) {
    assert.equal(raw[y * (w * 3 + 1)], 0, 'filter 0 on every row');
    for (let x = 0; x < w; x++) {
      const q = y * (w * 3 + 1) + 1 + x * 3;
      out.add(`${raw[q]},${raw[q + 1]},${raw[q + 2]}`);
    }
  }
  return out;
}

const sha12 = (b) => createHash('sha256').update(b).digest('hex').slice(0, 12);

test('the art bundle compiles, and carries no gold', () => {
  const art = compileArt();
  assert.ok(art.pics.cover_high_divide_dusk);
  assert.equal(art.palette.colors.length, 16);
  const all = [...Object.values(art.pics).map((p) => p.ops), ...Object.values(art.stamps)];
  for (const ops of all) {
    for (const op of ops) {
      if (op[0] === 'C') assert.ok(op[1] !== 7 && op[1] !== 19);
      if (op[0] === 'D') assert.ok(![op[1], op[2]].includes(7) && ![op[1], op[2]].includes(19));
    }
  }
  assert.ok(JSON.stringify(art).length < 100 * 1024, 'the art stays small');
});

test('the icons are the right sizes, opaque, and drawn from the cover; preview has its own', () => {
  const art = compileArt();
  const sizes = { 'apple-touch-icon.png': 180, 'icon-192.png': 192, 'icon-512.png': 512, 'icon-maskable-512.png': 512 };
  const palette = new Set(art.palette.colors.map((c) => c.hex.slice(1).match(/../g).map((x) => parseInt(x, 16)).join(',')));
  const main = makeIcons(art);
  const preview = makeIcons(art, 'preview');
  assert.deepEqual(makeIcons(art, 'main').map((i) => i.png), main.map((i) => i.png), 'main is the default');
  for (const icons of [main, preview]) {
    assert.deepEqual(icons.map((i) => i.file), ICONS.map((i) => i.file));
    for (const { file, png } of icons) {
      assert.equal(png.readUInt32BE(16), sizes[file], `${file} width`);
      assert.equal(png.readUInt32BE(20), sizes[file], `${file} height`);
      assert.equal(png[25], 2, `${file} is truecolor with no alpha, so iOS never fills it with black`);
      for (const c of pixels(png)) assert.ok(palette.has(c), `${file}: ${c} is a palette color`);
    }
  }
  preview.forEach(({ file, png }, k) => {
    assert.ok(!png.equals(main[k].png), `preview's ${file} differs from main's`);
    assert.ok(pixels(png).has('63,127,122'), `preview's ${file} has the teal band`);
  });
  assert.throws(() => makeIcons(art, 'beta'), /no channel "beta"/);
});

test('the build id is the commit date and short SHA, or dev', () => {
  const info = buildInfo();
  assert.match(info.id, /^(\d{8}-[0-9a-f]{7}|dev)$/);
  assert.deepEqual(buildInfo(), info, 'the same checkout stamps the same id');
});

test('each channel builds reproducibly into its own folder, and stamps its id', (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-build-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const swSource = readFileSync(join(ROOT, 'web', 'sw.js'), 'utf8');
  const icons = {};
  for (const channel of ['main', 'preview']) {
    const a = build({ out: join(tmp, 'a', channel), channel, quiet: true });
    const b = build({ out: join(tmp, 'b', channel), channel, quiet: true });
    const sa = snapshot(join(tmp, 'a', channel));
    const sb = snapshot(join(tmp, 'b', channel));
    assert.deepEqual(Object.keys(sa), Object.keys(sb));
    for (const f of Object.keys(sa)) assert.ok(sa[f].equals(sb[f]), `${channel}: ${f} is the same bytes in both builds`);
    for (const f of ['index.html', 'manifest.webmanifest', 'sw.js', 'precache.json', 'version.json', 'flags.json', 'text/en.json', 'art/art.json', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'fonts/PixelifySans.woff2', 'fonts/OFL.txt', 'js/boot.js', 'js/main.js', 'js/text.js', 'js/platform/storage.js', 'js/platform/sw-client.js', 'js/ui/debug.js', 'js/ui/errors.js', 'js/ui/home.js', 'data/rules.json', 'data/voice.json', 'js/engine/api.js', 'selfcheck.json']) {
      assert.ok(sa[f], `${channel}: ${f} ships`);
    }
    assert.equal(Boolean(sa['text/marks.json']), channel === 'preview', 'only preview carries the marks');
    assert.ok(!Object.keys(sa).some((f) => f.endsWith('.pic')), 'the .pic text is compiled, not shipped');
    const version = JSON.parse(sa['version.json'].toString());
    assert.deepEqual(Object.keys(version), ['build', 'channel', 'commit', 'date', 'files', 'rules']);
    assert.equal(version.build, a.info.id);
    assert.equal(version.build, b.info.id);
    assert.equal(version.channel, channel);
    assert.match(version.files, /^[0-9a-f]{12}$/);
    assert.match(version.rules, /^[0-9a-f]{12}$/);
    assert.equal(version.rules, rulesHash(join(tmp, 'a', channel)), "version.json's rules is the hash of the build's engine and rules.json");
    assert.equal(a.rules, b.rules, 'two builds give the same rules hash');
    if (version.build !== 'dev') {
      assert.equal(version.build, `${version.date.replaceAll('-', '')}-${version.commit.slice(0, 7)}`);
    }
    const html = sa['index.html'].toString();
    const screens = channelScreens(readText(), channel).join(' ');
    assert.ok(
      html.includes(`<html lang="en" data-build="${version.build}" data-channel="${channel}" data-commit="${version.commit || 'dev'}" data-rules="${version.rules}" data-screens="${screens}">`),
      'the build, the channel, the commit, the rules hash and the screens are stamped on <html>',
    );
    assert.ok(!/data-(commit|rules|screens)="dev"/.test(html) || version.commit === null, 'no placeholder left but a commit outside git');
    assert.ok(html.includes(`id="build-stamp" data-t="app.build">${version.build}</span>`), 'the build stamp is the bare build code');
    assert.ok(!html.includes('data-build="dev"') && !html.includes('data-channel="dev"'));
    assert.deepEqual(JSON.parse(sa['flags.json'].toString()), { gentle: false, larry: true, channel });

    // The worker: four stamped lines, then web/sw.js as written.
    const sw = sa['sw.js'].toString().split('\n');
    assert.deepEqual(sw.slice(0, 4), [`// oph-sw ${channel} ${version.build} ${version.files}`, `const CHANNEL = '${channel}';`, `const BUILD = '${version.build}';`, `const FILES = '${version.files}';`]);
    assert.equal(sw.slice(4).join('\n'), swSource.split('\n').slice(4).join('\n'), 'nothing else in sw.js changes');

    // The precache list: every shipped file but the worker and the two lists, by the hash of its bytes.
    const list = JSON.parse(sa['precache.json'].toString());
    assert.deepEqual(Object.keys(list), ['build', 'channel', 'files', 'paths']);
    assert.equal(list.build, version.build);
    assert.equal(list.channel, channel);
    assert.equal(list.files, version.files, "precache.json's files is version.json's");
    const shipped = Object.keys(sa).filter((f) => !['sw.js', 'version.json', 'precache.json'].includes(f));
    assert.deepEqual(Object.keys(list.paths), shipped, 'every other file, in sorted order');
    for (const f of shipped) assert.equal(list.paths[f], sha12(sa[f]), `${channel}: ${f}'s hash`);
    assert.deepEqual(precachePaths(join(tmp, 'a', channel)), list.paths);

    assert.ok(a.total < MAX_BYTES, `${channel} is under 5 MB`);
    icons[channel] = sa['icons/icon-192.png'];
  }
  assert.ok(!icons.main.equals(icons.preview), 'the two channels ship different icons');
});

test('one changed byte changes the files hash, its precache entry and sw.js, and nothing else', (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-hash-'));
  // Outside git the build id is "dev", which a GitHub Actions run refuses; these copies are not the deploy.
  const gha = process.env.GITHUB_ACTIONS;
  delete process.env.GITHUB_ACTIONS;
  t.after(() => {
    if (gha !== undefined) process.env.GITHUB_ACTIONS = gha;
    rmSync(tmp, { recursive: true, force: true });
  });
  const lists = {};
  for (const name of ['same', 'changed']) {
    const root = join(tmp, name);
    for (const d of ['web', 'config', 'content', 'schemas']) cpSync(join(ROOT, d), join(root, d), { recursive: true });
    if (name === 'changed') writeFileSync(join(root, 'web', 'css', 'tokens.css'), `${readFileSync(join(root, 'web', 'css', 'tokens.css'), 'utf8')} `);
    const { version } = build({ root, out: join(root, 'dist', 'main'), channel: 'main', quiet: true });
    lists[name] = { version, list: JSON.parse(readFileSync(join(root, 'dist', 'main', 'precache.json'), 'utf8')), sw: readFileSync(join(root, 'dist', 'main', 'sw.js'), 'utf8') };
  }
  const { same, changed } = lists;
  assert.notEqual(same.version.files, changed.version.files);
  assert.notEqual(same.sw, changed.sw, "a new files hash is a new sw.js, which is what the phone's update check compares");
  const moved = Object.keys(same.list.paths).filter((f) => same.list.paths[f] !== changed.list.paths[f]);
  assert.deepEqual(moved, ['css/tokens.css'], 'the new worker downloads only what changed');
});

test('the worker stamp refuses an unstamped source', () => {
  const src = readFileSync(join(ROOT, 'web', 'sw.js'), 'utf8');
  assert.deepEqual(src.split('\n').slice(0, 4), SW_STAMP, 'web/sw.js starts with the four placeholder lines');
  assert.throws(() => stampWorker(src.replace("const FILES = 'dev';", "const FILES = 'x';"), { channel: 'main', build: 'b', files: 'f' }), /line 4 must be exactly/);
  assert.throws(() => stampWorker(src.split('\n').slice(1).join('\n'), { channel: 'main', build: 'b', files: 'f' }), /line 1 must be exactly/);
  assert.match(stampWorker(src, { channel: "pre'view", build: 'b', files: 'f' }), /const CHANNEL = 'preview';/, 'stamped values stay plain');
});

test('the build refuses a channel it does not know', () => {
  assert.throws(() => build({ out: join(tmpdir(), 'oph-never'), channel: 'beta', quiet: true }), /no channel "beta"/);
});

test('building assembles site/: main at the root, preview (or the placeholder) under preview/', (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-site-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const [main] = buildAll({ channels: ['main'], dist: join(tmp, 'dist'), site: join(tmp, 'site'), quiet: true });
  assert.equal(main.out, join(tmp, 'dist', 'main'));
  let site = snapshot(join(tmp, 'site'));
  const dist = snapshot(main.out);
  for (const f of Object.keys(dist)) assert.ok(site[f].equals(dist[f]), `site/${f} is main's`);
  assert.deepEqual(Object.keys(site).filter((f) => !dist[f]), ['preview/index.html', 'preview/version.json'], 'main alone: the placeholder at /preview/');
  assert.deepEqual(JSON.parse(site['preview/version.json'].toString()), { build: null, channel: 'preview', placeholder: true });

  const built = buildAll({ dist: join(tmp, 'dist'), site: join(tmp, 'site'), quiet: true });
  assert.deepEqual(built.map((b) => b.version.channel), ['main', 'preview']);
  site = snapshot(join(tmp, 'site'));
  const preview = snapshot(join(tmp, 'dist', 'preview'));
  for (const f of Object.keys(preview)) assert.ok(site[`preview/${f}`].equals(preview[f]), `site/preview/${f} is preview's`);
  assert.equal(JSON.parse(site['version.json'].toString()).channel, 'main');
  assert.equal(JSON.parse(site['preview/version.json'].toString()).channel, 'preview');
});

test('the size check refuses a site over the budget', (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-size-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  mkdirSync(join(tmp, 'deep'), { recursive: true });
  writeFileSync(join(tmp, 'a.bin'), Buffer.alloc(600));
  writeFileSync(join(tmp, 'deep', 'b.bin'), Buffer.alloc(500));
  assert.equal(checkSize(tmp, 1100), 1100, 'at the budget is fine');
  assert.throws(() => checkSize(tmp, 1099), /1100 bytes, over the 1099-byte budget/);
  assert.equal(MAX_BYTES, 5 * 1024 * 1024, 'the budget is 5 MB');
});

test("the data step: each channel's rules.json is canonical and scoped to its screens (BUILD_PLAN S3, 6.1)", (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-data-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const text = readText();
  for (const channel of ['main', 'preview']) {
    const out = join(tmp, channel);
    build({ out, channel, quiet: true });
    const rulesSrc = readFileSync(join(out, 'data', 'rules.json'), 'utf8');
    const rules = JSON.parse(rulesSrc);
    const voice = JSON.parse(readFileSync(join(out, 'data', 'voice.json'), 'utf8'));
    assert.equal(rulesSrc, `${canon(rules)}\n`, 'canonical JSON and a final newline');
    assert.equal(rules.format, 1);
    assert.equal(voice.format, 1);
    assert.deepEqual(Object.keys(rules), ['format', 'plans', 'profile', 'standard', 'stops']);
    assert.ok(!rulesSrc.includes('trail.'), 'no line id in the outcome data (call 1)');
    const screens = channelScreens(text, channel);
    assert.deepEqual(Object.keys(rules.plans), screens.includes('trail') ? ['sample'] : [], `${channel}: the sample plan exactly when the channel has the trail screen`);
    assert.deepEqual(Object.keys(rules.stops), Object.keys(voice.stops));
    if (channel === 'main') {
      assert.deepEqual(rules.plans, {}, "main's rules.json holds no plans");
      assert.deepEqual(rules.stops, {}, "main's rules.json holds no stops");
      assert.deepEqual(voice.stops, {});
    }
  }
});

test('the data step on a preview whose scope has the trail screen carries the sample, and its words', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'oph-data-trail-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const d of ['web', 'config', 'content', 'schemas']) cpSync(join(ROOT, d), join(root, d), { recursive: true });
  const scopeFile = join(root, 'content', 'scope', 'm1a.json');
  const scope = JSON.parse(readFileSync(scopeFile, 'utf8'));
  scope.screens = [...new Set([...scope.screens, 'guestbook', 'trail'])].sort();
  writeFileSync(scopeFile, JSON.stringify(scope, null, 1));
  // The trailhead's two lines, as C0 files them (a temp copy; the repo's are C's).
  const trail = join(root, 'content', 'text', 'en', 'trail.json');
  const have = (() => {
    try {
      return JSON.parse(readFileSync(trail, 'utf8'));
    } catch {
      return { $comment: 'test' };
    }
  })();
  for (const id of ['trail.sol_duc_trailhead.lot', 'trail.sol_duc_trailhead.trail_mouth']) have[id] = have[id] || { text: 'Words.', ctx: 'test', screen: 'trail', max: 140 };
  writeFileSync(trail, JSON.stringify(have, null, 1));
  const { rules, voice, screens } = makeData({ root, channel: 'preview' });
  assert.ok(screens.includes('trail'));
  assert.deepEqual(rules.plans, { sample: { after: 'end', mode: 'open', start: { day: 1, s: 30600, set: 'sol_duc_trailhead' } } });
  assert.deepEqual(rules.stops.sol_duc_trailhead, { first: 'lot', phase: 'trailhead', stops: [{ id: 'lot', next: 'trail_mouth' }, { id: 'trail_mouth', next: null }] });
  assert.deepEqual(voice.stops.sol_duc_trailhead, { lot: { box: [['trail.sol_duc_trailhead.lot']], labels: {} }, trail_mouth: { box: [['trail.sol_duc_trailhead.trail_mouth']], labels: {} } });
  assert.deepEqual(makeData({ root, channel: 'main' }).rules.stops, {}, 'main still carries none');
  // A dangling next fails the build, with its file and line.
  const stopsFile = join(root, 'content', 'stops', 'sol_duc_trailhead.json');
  writeFileSync(stopsFile, readFileSync(stopsFile, 'utf8').replace('"next": "trail_mouth"', '"next": "nowhere"'));
  assert.throws(() => makeData({ root, channel: 'preview' }), /content\/stops\/sol_duc_trailhead\.json:8: R01 stop "lot": next "nowhere" is not a stop in set "sol_duc_trailhead"/);
});
