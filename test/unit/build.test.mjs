import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { compileArt, makeIcons, buildInfo, build, checkSize, ICONS, MAX_BYTES } from '../../tools/build.mjs';

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

test('the icons are the right sizes, opaque, and drawn from the cover', () => {
  const icons = makeIcons(compileArt());
  assert.deepEqual(icons.map((i) => i.file), ICONS.map((i) => i.file));
  const sizes = { 'apple-touch-icon.png': 180, 'icon-192.png': 192, 'icon-512.png': 512, 'icon-maskable-512.png': 512 };
  for (const { file, png } of icons) {
    assert.equal(png.readUInt32BE(16), sizes[file], `${file} width`);
    assert.equal(png.readUInt32BE(20), sizes[file], `${file} height`);
    assert.equal(png[25], 2, `${file} is truecolor with no alpha, so iOS never fills it with black`);
  }
});

test('the build id is the commit date and short SHA, or dev', () => {
  const info = buildInfo();
  assert.match(info.id, /^(\d{8}-[0-9a-f]{7}|dev)$/);
  assert.deepEqual(buildInfo(), info, 'the same checkout stamps the same id');
});

test('the build is reproducible, stamps its id, and assembles site/', (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-build-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const a = build({ dist: join(tmp, 'a', 'dist'), site: join(tmp, 'a', 'site'), channel: 'main', quiet: true });
  const b = build({ dist: join(tmp, 'b', 'dist'), site: join(tmp, 'b', 'site'), channel: 'main', quiet: true });
  const sa = snapshot(join(tmp, 'a', 'site'));
  const sb = snapshot(join(tmp, 'b', 'site'));
  assert.deepEqual(Object.keys(sa), Object.keys(sb));
  for (const f of Object.keys(sa)) assert.ok(sa[f].equals(sb[f]), `${f} is the same bytes in both builds`);
  assert.deepEqual(Object.keys(snapshot(join(tmp, 'a', 'dist'))), Object.keys(sa), 'site/ is the main channel at the root');
  for (const f of ['index.html', 'manifest.webmanifest', 'version.json', 'flags.json', 'art/art.json', 'icons/apple-touch-icon.png', 'fonts/PixelifySans.woff2', 'fonts/OFL.txt', 'js/main.js']) {
    assert.ok(sa[f], `site/${f} ships`);
  }
  assert.ok(!Object.keys(sa).some((f) => f.endsWith('.pic')), 'the .pic text is compiled, not shipped');
  const version = JSON.parse(sa['version.json'].toString());
  assert.deepEqual(Object.keys(version), ['build', 'channel', 'commit', 'date', 'files']);
  assert.equal(version.build, a.info.id);
  assert.equal(version.build, b.info.id);
  assert.equal(version.channel, 'main');
  assert.match(version.files, /^[0-9a-f]{12}$/);
  if (version.build !== 'dev') {
    assert.equal(version.build, `${version.date.replaceAll('-', '')}-${version.commit.slice(0, 7)}`);
  }
  const html = sa['index.html'].toString();
  assert.ok(html.includes(`data-build="${version.build}"`));
  assert.ok(html.includes(`<span id="build-id">${version.build}</span>`), 'the title page shows the build id');
  assert.deepEqual(JSON.parse(sa['flags.json'].toString()), { storybook: false, larry: true, channel: 'main' });
  assert.ok(a.total < MAX_BYTES);
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
