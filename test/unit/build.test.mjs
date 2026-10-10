import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { compileArt, makeIcons, buildInfo, build, buildAll, checkSize, stampWorker, precachePaths, makeData, ingestGate, ICONS, MAX_BYTES, SW_STAMP } from '../../tools/build.mjs';
import { pageReach } from '../../tools/reach.mjs';
import { listFiles, INPUTS, TOOLS } from '../../tools/ingest.mjs';
import { ROOT } from '../../tools/pics.mjs';
import { readText, channelScreens } from '../../tools/text.mjs';
import { rulesHash } from '../../tools/rules.mjs';
import { canon } from '../../web/js/engine/canon.js';
import { PALETTE, hexToRgb } from '../../web/js/gfx/palette.js';

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
    // Re-pinned in S6: palette A's teal, #4a8a85 (decision 68; option B's was 63,127,122).
    assert.ok(pixels(png).has('74,138,133'), `preview's ${file} has the teal band`);
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

    // The precache list: every file the built page can load (tools/reach.mjs) but the worker and the two lists, by the hash of its bytes.
    const list = JSON.parse(sa['precache.json'].toString());
    assert.deepEqual(Object.keys(list), ['build', 'channel', 'files', 'paths']);
    assert.equal(list.build, version.build);
    assert.equal(list.channel, channel);
    assert.equal(list.files, version.files, "precache.json's files is version.json's");
    const loads = pageReach(join(tmp, 'a', channel)).files.filter((f) => !['sw.js', 'version.json', 'precache.json'].includes(f));
    assert.deepEqual(Object.keys(list.paths), loads, 'what the page can load, in sorted order');
    for (const f of loads) assert.equal(list.paths[f], sha12(sa[f]), `${channel}: ${f}'s hash`);
    assert.deepEqual(precachePaths(join(tmp, 'a', channel)), list.paths);
    for (const f of ['index.html', 'manifest.webmanifest', 'css/tokens.css', 'css/game.css', 'fonts/PixelifySans.woff2', 'js/boot.js', 'js/main.js', 'js/ui/home.js', 'art/art.json', 'text/en.json', 'selfcheck.json', ...ICONS.map((i) => `icons/${i.file}`)]) assert.ok(list.paths[f], `${channel} precaches ${f}`);
    for (const f of ['flags.json', 'fonts/OFL.txt']) assert.ok(sa[f] && !list.paths[f], `${channel} ships ${f}, and its page never loads it`);

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
    const screens = channelScreens(text, channel);
    // S4: main's rules keys are exactly S3's; preview adds the park when its screens include the map. S6: the
    // park ships with the trail too (the fork's walks), and the odds with it (content/scope/m1a.json ships).
    const trail = channel === 'preview' && screens.includes('trail');
    const park = channel === 'preview' && (screens.includes('map') || trail);
    assert.deepEqual(Object.keys(rules), ['format', ...(trail ? ['odds'] : []), ...(park ? ['park'] : []), 'plans', 'profile', 'standard', 'stops']);
    assert.equal(Object.keys(voice).includes('odds'), trail, "the odds' row labels go with the odds, in voice.json");
    assert.equal(readdirSync(join(out, 'data')).includes('map.json'), channel === 'preview' && screens.includes('map'), 'data/map.json exactly when the channel has the map');
    if (channel === 'main') assert.deepEqual(Object.keys(rules), ['format', 'plans', 'profile', 'standard', 'stops'], "main's keys don't move");
    assert.ok(!rulesSrc.includes('trail.'), 'no line id in the outcome data (call 1)');
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
  // S5: the sample starts at Deer Lake (content/stops/deer_lake_rim.json); S3's trailhead set stays, unreachable.
  // Re-pinned in S6: it leaves Deer Lake at 11:05 am (s 39900: GAME_DESIGN B.6's 10:45 and its 20-minute lunch).
  assert.deepEqual(rules.plans, { sample: { after: 'end', mode: 'open', start: { day: 1, s: 39900, set: 'deer_lake_rim' } } });
  // S6: Deer Lake names the storm and walks on to the rim, the rim walks on to the fork, and the fork's three
  // choices go to the outcomes: the logic in the rules, never a view, a label or a word.
  const dl = rules.stops.deer_lake_rim;
  assert.deepEqual([dl.first, dl.phase], ['deer_lake', 'trailhead']);
  assert.deepEqual(dl.stops.slice(0, 2), [{ id: 'deer_lake', next: 'rim', foreshadow: 'thunder', walk: { from: 'deer_lake', to: 'seven_lakes_basin' } }, { id: 'rim', next: 'fork' }], 'no view in the rules');
  assert.deepEqual(dl.stops[2].choices.map((c) => [c.id, Object.keys(c).sort()]), [
    ['high', ['id', 'needs', 'odds', 'route']],
    ['basin', ['id', 'odds', 'route']],
    ['car', ['id', 'tag', 'then']],
  ]);
  assert.deepEqual(dl.stops.slice(3).map((st) => [st.id, st.outcome, st.next]), [
    ['high_clean', 'good', null],
    ['high_shaky', 'mishap', null],
    ['high_struck', 'serious', null],
    ['high_fatal', 'death', null],
    ['basin_clean', 'good', null],
    ['basin_shaky', 'mishap', null],
    ['basin_slip', 'mishap', null],
    ['basin_sprain', 'mishap', null],
    ['car_out', 'good', null],
  ]);
  assert.deepEqual(voice.stops.deer_lake_rim.rim, { box: [['trail.deer_lake_rim.rim']], labels: {}, view: { pic: 'seven_lakes_basin', node: 'seven_lakes_basin', day: ['sol_duc_trailhead', 'seven_lakes_basin'] } });
  assert.deepEqual(
    [voice.stops.deer_lake_rim.fork.labels, voice.stops.deer_lake_rim.fork.fail_words, voice.stops.deer_lake_rim.fork.badly],
    [
      { high: 'trail.deer_lake_rim.fork.high', basin: 'trail.deer_lake_rim.fork.basin', car: 'trail.deer_lake_rim.fork.car' },
      { high: 'trail.deer_lake_rim.fork.high.fail' },
      { high: 'trail.deer_lake_rim.fork.high.badly', basin: 'trail.deer_lake_rim.fork.basin.badly' },
    ],
    "a rolled choice's words are display data",
  );
  assert.deepEqual(voice.odds, { bases: { exposed_crest_storm: 'trail.why.crest_storm', stone_staircase_dry: 'trail.why.staircase' }, skills: { footing: 'trail.why.skill_footing' } });
  assert.deepEqual(rules.odds.bases, { exposed_crest_storm: { base: 40 }, stone_staircase_dry: { base: 88 } }, 'the odds: numbers only');
  assert.deepEqual(rules.stops.sol_duc_trailhead, { first: 'lot', phase: 'trailhead', stops: [{ id: 'lot', next: 'trail_mouth' }, { id: 'trail_mouth', next: null }] });
  assert.deepEqual(voice.stops.sol_duc_trailhead, { lot: { box: [['trail.sol_duc_trailhead.lot']], labels: {} }, trail_mouth: { box: [['trail.sol_duc_trailhead.trail_mouth']], labels: {} } });
  assert.deepEqual(makeData({ root, channel: 'main' }).rules.stops, {}, 'main still carries none');
  // A dangling next fails the build, with its file and line.
  const stopsFile = join(root, 'content', 'stops', 'sol_duc_trailhead.json');
  writeFileSync(stopsFile, readFileSync(stopsFile, 'utf8').replace('"next": "trail_mouth"', '"next": "nowhere"'));
  assert.throws(() => makeData({ root, channel: 'preview' }), /content\/stops\/sol_duc_trailhead\.json:8: R01 stop "lot": next "nowhere" is not a stop in set "sol_duc_trailhead"/);
});

/** A copy of the repo whose preview has the map, with a gazetteer stub for the labels a test copy lacks. */
function mapTree(t) {
  const root = mkdtempSync(join(tmpdir(), 'oph-data-map-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const d of ['web', 'config', 'content', 'schemas']) cpSync(join(ROOT, d), join(root, d), { recursive: true });
  const scopeFile = join(root, 'content', 'scope', 'm1a.json');
  const scope = JSON.parse(readFileSync(scopeFile, 'utf8'));
  scope.screens = [...new Set([...scope.screens, 'map'])].sort();
  writeFileSync(scopeFile, JSON.stringify(scope, null, 1));
  const gaz = join(root, 'content', 'text', 'names', 'places.json');
  const have = existsSync(gaz) ? JSON.parse(readFileSync(gaz, 'utf8')) : { places: {}, not_places: {} };
  for (const id of ['sol_duc_trailhead', ...scope.park.camps, ...scope.park.desk]) have.places[id] = have.places[id] || { text: id, kind: 'camp', region: 'sol_duc_high_divide', source: 'https://www.nps.gov/olym/' };
  mkdirSync(join(root, 'content', 'text', 'names'), { recursive: true });
  writeFileSync(gaz, JSON.stringify(have, null, 1));
  return { root, scope };
}

test('the data step with the map screen (S4): preview carries rules.park and data/map.json; main carries neither', (t) => {
  const { root, scope } = mapTree(t);
  const preview = makeData({ root, channel: 'preview' });
  // S6: preview has the trail, so it carries the odds too.
  assert.deepEqual(Object.keys(preview.rules), ['format', 'odds', 'park', 'plans', 'profile', 'standard', 'stops']);
  assert.deepEqual(Object.keys(preview.files).sort(), ['map.json', 'rules.json', 'voice.json']);
  const park = preview.rules.park;
  assert.equal(Object.keys(park.nodes).length, 47);
  assert.equal(Object.keys(park.segs).length, 44);
  assert.ok(!preview.files['rules.json'].includes('map_xy') && !preview.files['rules.json'].includes('place.'), 'display data stays out of the rules');
  const map = JSON.parse(preview.files['map.json']);
  assert.equal(preview.files['map.json'], `${canon(map)}\n`);
  assert.equal(map.format, 1);
  assert.deepEqual(map.bounds, [1, 0, 58, 53]);
  const labelled = Object.entries(map.nodes).filter(([, n]) => n.label);
  assert.equal(labelled.length, 25, 'the trailhead and the 24 camps');
  assert.deepEqual(labelled.map(([id]) => id).sort(), ['sol_duc_trailhead', ...scope.park.camps, ...scope.park.desk].sort());
  for (const [id, n] of labelled) assert.equal(n.label, `place.${id}`);
  const kinds = {};
  for (const n of Object.values(map.nodes)) kinds[n.kind] = (kinds[n.kind] || 0) + 1;
  assert.deepEqual(kinds, { camp: 21, desk: 3, group: 3, junction: 11, lake: 6, peak: 1, trailhead: 1 });
  assert.ok(!map.nodes.lake_8, 'a footnote with no position is not drawn');
  assert.equal(Object.keys(map.segs).length, 49);
  assert.equal(Object.values(map.segs).filter((x) => x.map_only).length, 5);
  const main = makeData({ root, channel: 'main' });
  assert.deepEqual(Object.keys(main.rules), ['format', 'plans', 'profile', 'standard', 'stops']);
  assert.deepEqual(Object.keys(main.files).sort(), ['rules.json', 'voice.json'], 'main gets no data/map.json');
  // A label the gazetteer lacks fails the build (T16).
  const gaz = join(root, 'content', 'text', 'names', 'places.json');
  const g = JSON.parse(readFileSync(gaz, 'utf8'));
  delete g.places.lunch_lake;
  writeFileSync(gaz, JSON.stringify(g, null, 1));
  assert.throws(() => makeData({ root, channel: 'preview' }), /the map's labels must be places in the gazetteer .*place\.lunch_lake/);
});

/** Main's words as S3 shipped them: the 13 app lines and the six dev lines its menu shows. */
const MAIN_S3_IDS = ['app.build', 'app.description', 'app.error.copy', 'app.error.line', 'app.error.reopen', 'app.install', 'app.name', 'app.offline', 'app.preview_name', 'app.short_name', 'app.update', 'app.update.restart', 'app.upright', 'dev.check.differs', 'dev.check.match', 'dev.check.running', 'dev.close', 'dev.note', 'dev.throw'];

test("main stays put in S4: its screens, its words, its data and its files; the map is preview's (SPEC C2)", (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-main-s4-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const out = {};
  for (const channel of ['main', 'preview']) {
    out[channel] = join(tmp, channel);
    build({ out: out[channel], channel, quiet: true });
  }
  const read = (channel, f) => readFileSync(join(out[channel], f), 'utf8');
  const screens = (channel) => /<html[^>]*\sdata-screens="([^"]*)"/.exec(read(channel, 'index.html'))[1];
  assert.equal(screens('main'), 'app debug title');
  assert.equal(screens('preview'), 'app debug guestbook map title trail');
  // Main's words: S3's ids exactly, each approved line in the ledger's words.
  const words = JSON.parse(read('main', 'text/en.json'));
  assert.deepEqual(Object.keys(words).sort(), MAIN_S3_IDS);
  assert.ok(!Object.keys(words).some((k) => /^(?:place|term|first\.lockbox)\./.test(k) || k === 'dev.map'), 'no place, term, quiz or map words');
  const ledger = JSON.parse(readFileSync(join(ROOT, 'content', 'text', 'approved.json'), 'utf8')).lines;
  for (const [id, w] of Object.entries(words)) if (ledger[id]) assert.equal(w, ledger[id].text, `${id}: the approved words`);
  assert.ok(!existsSync(join(out.main, 'text', 'marks.json')), 'main marks nothing');
  // Main's data: S3's two files and keys; no map.
  assert.deepEqual(readdirSync(join(out.main, 'data')).sort(), ['rules.json', 'voice.json']);
  assert.deepEqual(Object.keys(JSON.parse(read('main', 'data/rules.json'))), ['format', 'plans', 'profile', 'standard', 'stops']);
  assert.deepEqual(readdirSync(join(out.preview, 'data')).sort(), ['map.json', 'rules.json', 'voice.json']);
  // Main's files: the same as preview's but for the map's data, preview's marks and (S5) the line inspector's text/meta.json; the map's module ships on both (web/ is copied as is) and main never imports it (map.test.mjs).
  const files = (channel) => Object.keys(snapshot(out[channel]));
  assert.deepEqual(files('preview').filter((f) => !files('main').includes(f)), ['data/map.json', 'text/marks.json', 'text/meta.json']);
  assert.deepEqual(files('main').filter((f) => !files('preview').includes(f)), []);
  assert.ok(files('main').includes('js/ui/map.js'));
});

test("main stays put in S5: its screens, words, data, rules hash, page, art and modules are S4's; the trail, the sound and the inspector are preview's (SPEC 7)", (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-main-s5-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const out = {};
  const built = {};
  for (const channel of ['main', 'preview']) {
    out[channel] = join(tmp, channel);
    built[channel] = build({ out: out[channel], channel, quiet: true });
  }
  const read = (channel, f) => readFileSync(join(out[channel], f), 'utf8');
  // 1. The same screens and words; nothing to mark, nothing to inspect.
  assert.equal(/<html[^>]*\sdata-screens="([^"]*)"/.exec(read('main', 'index.html'))[1], 'app debug title');
  assert.deepEqual(Object.keys(JSON.parse(read('main', 'text/en.json'))).sort(), MAIN_S3_IDS);
  assert.deepEqual(readdirSync(join(out.main, 'text')), ['en.json'], 'no marks.json, no meta.json');
  assert.deepEqual(readdirSync(join(out.preview, 'text')).sort(), ['en.json', 'marks.json', 'meta.json']);
  // 2. The same data. (S5's rules hash, 46dd9f1e4c40, S4's: no engine file changed in S5. S6's engine files
  // move it, so its pin is in "main at S6" below, with its reason.)
  const rules = JSON.parse(read('main', 'data/rules.json'));
  assert.deepEqual(Object.keys(rules), ['format', 'plans', 'profile', 'standard', 'stops']);
  assert.deepEqual([rules.plans, rules.stops, rules.park, rules.odds], [{}, {}, undefined, undefined]);
  assert.deepEqual(JSON.parse(read('main', 'data/voice.json')), { format: 1, stops: {} });
  assert.notEqual(built.preview.rules, built.main.rules, "preview's moved: the new stop set");
  // 3. The same page: the same links and scripts, nothing new preloaded.
  const heads = (html) => [...html.matchAll(/<(?:link|script)\b[^>]*>/g)].map((m) => m[0].replace(/\s+data-[a-z-]+="[^"]*"/g, ''));
  assert.deepEqual(heads(read('main', 'index.html')), [
    '<link rel="manifest" href="manifest.webmanifest">',
    '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">',
    '<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">',
    '<link rel="preload" href="fonts/PixelifySans.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="modulepreload" href="js/gfx/picvm.js">',
    '<link rel="stylesheet" href="css/tokens.css">',
    '<link rel="stylesheet" href="css/game.css">',
    '<script type="module" src="js/boot.js">',
    '<script type="module" src="js/main.js">',
  ]);
  assert.ok(!/frame\.css|OPHChrome|Literata|inspect/.test(read('main', 'index.html')), "main's page names none of S5's files");
  // 4. The same art: the cover and its five firs.
  const art = JSON.parse(read('main', 'art/art.json'));
  assert.deepEqual([Object.keys(art.pics), Object.keys(art.stamps).length, art.recipes], [['cover_high_divide_dusk'], 5, undefined]);
  // 5. Nothing new loads: main's static import graph reaches none of S5's modules.
  const seen = new Set();
  const walk = (rel) => {
    if (seen.has(rel)) return;
    seen.add(rel);
    const src = read('main', rel);
    for (const m of src.matchAll(/^\s*(?:import|export)\s[^;]*?from\s+'([^']+)'/gms)) walk(join(rel, '..', m[1]).split(sep).join('/'));
    for (const m of src.matchAll(/^import\s+'([^']+)'/gm)) walk(join(rel, '..', m[1]).split(sep).join('/'));
  };
  walk('js/boot.js');
  walk('js/main.js');
  assert.ok(seen.has('js/ui/debug.js') && seen.has('js/text.js'));
  const s5 = ['js/ui/frame.js', 'js/ui/sound.js', 'js/ui/inspect.js', 'js/ui/strip.js', 'js/ui/textbox.js', 'js/ui/choices.js', 'js/ui/toolbar.js', 'js/ui/textsize.js', 'js/gfx/compose.js'];
  for (const f of s5) assert.ok(!seen.has(f), `main never imports ${f}`);
  assert.ok(![...seen].some((f) => f.startsWith('js/audio/')), 'nor the sound');
  // ... and its dynamic imports are S4's (the title, the game behind opensGame, the map behind opensMap, the self-check's engine) and S5's one, the inspector, behind preview and the trail.
  const dynamic = [...seen].flatMap((f) => [...read('main', f).matchAll(/import\('([^']+)'\)/g)].map((m) => `${f} ${m[1]}`)).sort();
  assert.deepEqual(dynamic, ['js/main.js ./ui/app.js', 'js/main.js ./ui/home.js', 'js/main.js ./ui/map.js', 'js/ui/debug.js ./inspect.js', 'js/ui/selfcheck.js ../engine/selfcheck.js']);
  assert.match(read('main', 'js/ui/debug.js'), /if \(preview && opensTrail\(doc\)\) loadInspector\(doc\);/);
  // 6. File parity: main's files are preview's minus the map's data, the marks and meta.json.
  const files = (channel) => Object.keys(snapshot(out[channel]));
  assert.deepEqual(files('preview').filter((f) => !files('main').includes(f)), ['data/map.json', 'text/marks.json', 'text/meta.json']);
  assert.deepEqual(files('main').filter((f) => !files('preview').includes(f)), []);
  for (const f of ['fonts/OPHChrome.ttf', 'css/frame.css', 'js/ui/inspect.js', 'js/ui/frame.js', 'audio/sounds.json']) assert.ok(files('main').includes(f), `${f} ships on both (main never loads it)`);
});

test("main at S6: S5's screens, words, data, page and modules, with S6's rules hash, palette A on both channels, and the fork, the sheet, the compass, the Looks and the alt text preview's (SPEC D.2)", (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-main-s6-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const out = {};
  const built = {};
  for (const channel of ['main', 'preview']) {
    out[channel] = join(tmp, channel);
    built[channel] = build({ out: out[channel], channel, quiet: true });
  }
  const read = (channel, f) => readFileSync(join(out[channel], f), 'utf8');
  // 1. The same screens and words: S3's ids, each the ledger's; nothing to mark, nothing to inspect.
  assert.equal(/<html[^>]*\sdata-screens="([^"]*)"/.exec(read('main', 'index.html'))[1], 'app debug title');
  assert.equal(/<html[^>]*\sdata-screens="([^"]*)"/.exec(read('preview', 'index.html'))[1], 'app debug guestbook map title trail');
  const words = JSON.parse(read('main', 'text/en.json'));
  assert.deepEqual(Object.keys(words).sort(), MAIN_S3_IDS);
  const ledger = JSON.parse(readFileSync(join(ROOT, 'content', 'text', 'approved.json'), 'utf8')).lines;
  for (const [id, w] of Object.entries(words)) if (ledger[id]) assert.equal(w, ledger[id].text, `${id}: the approved words`);
  assert.ok(!Object.keys(words).some((k) => /^(?:trail|look|alt|fmt)\./.test(k)), 'none of the trail, the Looks, the alt text or the formats');
  assert.deepEqual(readdirSync(join(out.main, 'text')), ['en.json'], 'no marks.json, no meta.json');
  // 2. The same data: no park and no odds on main; preview carries both with the trail.
  const rules = JSON.parse(read('main', 'data/rules.json'));
  assert.deepEqual(Object.keys(rules), ['format', 'plans', 'profile', 'standard', 'stops']);
  assert.deepEqual([rules.plans, rules.stops, rules.park, rules.odds], [{}, {}, undefined, undefined]);
  assert.deepEqual(JSON.parse(read('main', 'data/voice.json')), { format: 1, stops: {} });
  assert.deepEqual(Object.keys(JSON.parse(read('preview', 'data/rules.json'))), ['format', 'odds', 'park', 'plans', 'profile', 'standard', 'stops']);
  // Re-pinned in S6 (S4's and S5's was 46dd9f1e4c40): engine files changed in S6 (odds.js, and the
  // trailhead, the trip, the content and the voice for the fork; the review's trailhead fix, an outcome
  // restored under a later build drawn without its roll); main's rules.json is byte-identical.
  assert.equal(built.main.rules, '2b38247b1be6', "main's rules hash: engine files changed in S6");
  assert.notEqual(built.preview.rules, built.main.rules, "preview's moved: the fork");
  // 3. The same page: the same links and scripts, nothing new preloaded.
  const heads = (html) => [...html.matchAll(/<(?:link|script)\b[^>]*>/g)].map((m) => m[0].replace(/\s+data-[a-z-]+="[^"]*"/g, ''));
  assert.deepEqual(heads(read('main', 'index.html')), [
    '<link rel="manifest" href="manifest.webmanifest">',
    '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">',
    '<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">',
    '<link rel="preload" href="fonts/PixelifySans.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="modulepreload" href="js/gfx/picvm.js">',
    '<link rel="stylesheet" href="css/tokens.css">',
    '<link rel="stylesheet" href="css/game.css">',
    '<script type="module" src="js/boot.js">',
    '<script type="module" src="js/main.js">',
  ]);
  assert.ok(!/frame\.css|OPHChrome|Literata|inspect|(?:compass|sheet|look|outcome|press|alt|odds)\.js/.test(read('main', 'index.html')), "main's page names none of S5's or S6's files");
  // 4. Nothing new loads: main's static import graph reaches none of S5's or S6's screens' modules. The one S6
  // module main does load is ui/motion.js, Reduce Motion in one place (SPEC C.4), behind the title page, whose
  // draw-in and stars read it.
  const seen = new Set();
  const walk = (rel) => {
    if (seen.has(rel)) return;
    seen.add(rel);
    const src = read('main', rel);
    for (const m of src.matchAll(/^\s*(?:import|export)\s[^;]*?from\s+'([^']+)'/gms)) walk(join(rel, '..', m[1]).split(sep).join('/'));
    for (const m of src.matchAll(/^import\s+'([^']+)'/gm)) walk(join(rel, '..', m[1]).split(sep).join('/'));
  };
  walk('js/boot.js');
  walk('js/main.js');
  const s5 = ['js/ui/frame.js', 'js/ui/sound.js', 'js/ui/inspect.js', 'js/ui/strip.js', 'js/ui/textbox.js', 'js/ui/choices.js', 'js/ui/toolbar.js', 'js/ui/textsize.js', 'js/gfx/compose.js'];
  const s6 = ['js/ui/compass.js', 'js/ui/sheet.js', 'js/ui/look.js', 'js/ui/outcome.js', 'js/ui/press.js', 'js/gfx/compass.js', 'js/gfx/alt.js', 'js/engine/odds.js'];
  for (const f of [...s5, ...s6]) assert.ok(!seen.has(f), `main never imports ${f}`);
  assert.ok(!seen.has('js/ui/home.js') && !seen.has('js/ui/motion.js'), 'the title page, and motion.js with it, come by main.js\'s import() on demand');
  assert.match(read('main', 'js/ui/home.js'), /^import \{ reducedMotion, liveCycles \} from '\.\/motion\.js';$/m);
  assert.ok(![...seen].some((f) => f.startsWith('js/audio/')), 'nor the sound');
  const dynamic = [...seen].flatMap((f) => [...read('main', f).matchAll(/import\('([^']+)'\)/g)].map((m) => `${f} ${m[1]}`)).sort();
  assert.deepEqual(dynamic, ['js/main.js ./ui/app.js', 'js/main.js ./ui/home.js', 'js/main.js ./ui/map.js', 'js/ui/debug.js ./inspect.js', 'js/ui/selfcheck.js ../engine/selfcheck.js']);
  // ... and what its worker downloads (its page's reach) has none of the trail's screens' modules either.
  const cached = Object.keys(JSON.parse(read('main', 'precache.json')).paths);
  for (const f of [...s5, ...s6.filter((f) => !f.startsWith('js/engine/'))]) assert.ok(!cached.includes(f), `main's worker never downloads ${f}`);
  assert.ok(cached.includes('js/ui/motion.js') && cached.includes('js/ui/home.js'));
  // 5. File parity: main's files are preview's minus the map's data, the marks and meta.json; S6's ship on both.
  const files = (channel) => Object.keys(snapshot(out[channel]));
  assert.deepEqual(files('preview').filter((f) => !files('main').includes(f)), ['data/map.json', 'text/marks.json', 'text/meta.json']);
  assert.deepEqual(files('main').filter((f) => !files('preview').includes(f)), []);
  for (const f of [...s6, 'js/ui/motion.js']) assert.ok(files('main').includes(f), `${f} ships on both (main never loads it, but motion.js)`);
  // 6. Palette A on both channels (decision 68): the art bundle, palette.js and tokens.css carry its sixteen; the
  // shell's theme-color and the manifest's two colors are its ink; every icon pixel is one of its colors, and
  // none is option B's ink, #1b1f2a.
  const rgbA = new Set(PALETTE.map((h) => hexToRgb(h).join(',')));
  for (const channel of ['main', 'preview']) {
    const art = JSON.parse(read(channel, 'art/art.json'));
    assert.deepEqual(art.palette.colors.map((c) => (typeof c === 'string' ? c : c.hex)), [...PALETTE], `${channel}: art.json`);
    assert.match(read(channel, 'css/tokens.css'), new RegExp(`--c0: ${PALETTE[0]};`), `${channel}: tokens.css`);
    assert.match(read(channel, 'index.html'), new RegExp(`<meta name="theme-color" content="${PALETTE[0]}">`), `${channel}: theme-color`);
    const m = JSON.parse(read(channel, 'manifest.webmanifest'));
    assert.deepEqual([m.background_color, m.theme_color], [PALETTE[0], PALETTE[0]], `${channel}: the manifest`);
    for (const { file } of ICONS) {
      const px = pixels(readFileSync(join(out[channel], 'icons', file)));
      assert.ok([...px].every((p) => rgbA.has(p)), `${channel}'s ${file}: palette A's colors only`);
      assert.ok(!px.has('27,31,42'), `${channel}'s ${file}: no option-B ink`);
    }
  }
});

test("S5: each channel's art.json is what its screens reach: main the cover and its five firs; preview the trail's bases and scene, the stamps they and the recipes reach, and the recipes", (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-art-s5-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const art = {};
  for (const channel of ['main', 'preview']) {
    build({ out: join(tmp, channel), channel, quiet: true });
    art[channel] = JSON.parse(readFileSync(join(tmp, channel, 'art', 'art.json'), 'utf8'));
    assert.deepEqual(art[channel], JSON.parse(JSON.stringify(compileArt({ screens: channelScreens(readText(), channel) }))), `${channel}: the build writes compileArt for its screens`);
  }
  assert.deepEqual(Object.keys(art.main), ['format', 'palette', 'pics', 'stamps'], 'main: no recipes');
  assert.deepEqual(Object.keys(art.main.pics), ['cover_high_divide_dusk']);
  assert.deepEqual(Object.keys(art.main.stamps), ['subalpine_fir_l', 'subalpine_fir_m', 'subalpine_fir_s', 'subalpine_fir_xl', 'subalpine_fir_xs']);
  // S6 (track C): beside the recipes, the Look hotspots by kind, {kind: looked} (content/art/hotspots.json).
  assert.deepEqual(Object.keys(art.preview), ['format', 'palette', 'pics', 'stamps', 'recipes', 'hotspots']);
  assert.deepEqual(Object.keys(art.preview.hotspots).filter((k) => art.preview.hotspots[k]), ['basin', 'bogachiel_peak', 'hiker', 'lake', 'lunch_lake', 'privy', 'ridge', 'sign', 'staircase']);
  assert.deepEqual(Object.keys(art.preview.pics), ['base_lake_basin', 'base_meadow', 'cover_high_divide_dusk', 'seven_lakes_basin_rim']);
  for (const id of Object.keys(art.main.stamps)) assert.deepEqual(art.preview.stamps[id], art.main.stamps[id], `${id}: the same stamp on both`);
  assert.deepEqual(art.preview.pics.cover_high_divide_dusk, art.main.pics.cover_high_divide_dusk);
  assert.deepEqual(art.main.palette, art.preview.palette, 'the same tables (S5 adds blue hour and night)');
  assert.deepEqual(Object.keys(art.main.palette.remaps), ['day', 'dusk', 'blue', 'night']);
});

test("the build's step 0: generated content that doesn't match its lock is refused (run npm run ingest)", (t) => {
  assert.deepEqual(ingestGate(ROOT), { checked: true }, 'the repo holds its lock');
  const root = mkdtempSync(join(tmpdir(), 'oph-gate-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const d of ['web', 'config', 'content', 'schemas']) cpSync(join(ROOT, d), join(root, d), { recursive: true });
  assert.deepEqual(ingestGate(root), { checked: false }, 'a copy without the research skips the check');
  for (const f of [...listFiles(ROOT, INPUTS), ...listFiles(ROOT, TOOLS)]) {
    mkdirSync(join(root, f, '..'), { recursive: true });
    cpSync(join(ROOT, f), join(root, f));
  }
  assert.deepEqual(ingestGate(root), { checked: true });
  const region = join(root, 'content', 'park', 'regions', 'sol_duc_high_divide.json');
  writeFileSync(region, readFileSync(region, 'utf8').replace('"elev_ft": 4450', '"elev_ft": 4451'));
  assert.throws(() => ingestGate(root), /out of date \(run npm run ingest\):\n {2}content\/park\/regions\/sol_duc_high_divide\.json was edited/);
  const gha = process.env.GITHUB_ACTIONS;
  delete process.env.GITHUB_ACTIONS;
  t.after(() => {
    if (gha !== undefined) process.env.GITHUB_ACTIONS = gha;
  });
  assert.throws(() => build({ root, channel: 'main', out: join(root, 'dist', 'main'), quiet: true }), /run npm run ingest/);
});
