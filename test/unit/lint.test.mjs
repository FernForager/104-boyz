import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parsePic } from '../../web/js/gfx/picvm.js';
import { lintPicture, lintPictures, lintPalette, lintText, lintShell, lintPure, lintUrls, runLint, isError } from '../../tools/lint.mjs';
import { ROOT } from '../../tools/pics.mjs';

const plate = (text, id = 'test_plate') => ({ id, kind: 'plates', rel: `plates/${id}.pic`, parsed: parsePic(text), width: 160, height: 320 });
const stamp = (text, id = 'test_stamp') => ({ id, kind: 'stamps', rel: `stamps/${id}.pic`, parsed: parsePic(text), width: 0, height: 0 });
const codes = (issues) => issues.map((i) => i.code);

test('the repo lints clean, with only the three T07 warnings', () => {
  const issues = runLint();
  assert.deepEqual(issues.filter(isError).map((i) => `${i.file}:${i.line}: ${i.code} ${i.msg}`), []);
  // Session 1's book words, on lines only preview shows; they retire with the
  // title page (S7). Any new warning fails here.
  assert.deepEqual(
    issues.filter((i) => !isError(i)).map((i) => `${i.code} ${i.id}`),
    ['T07 title.tagline', 'T07 title.start_label', 'T07 title.begin'],
  );
});

test('S01 in the repo: storage named outside platform/storage.js fails the lint (E.9)', (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-s01-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  cpSync(join(ROOT, 'web'), join(tmp, 'web'), { recursive: true });
  cpSync(join(ROOT, 'content'), join(tmp, 'content'), { recursive: true });
  assert.deepEqual(runLint(tmp).filter(isError), []);
  writeFileSync(join(tmp, 'web', 'js', 'ui', 'planted.js'), "export const saved = () => localStorage.getItem('oph.main.device');\n");
  assert.deepEqual(
    runLint(tmp).filter(isError).map((i) => `${i.file}:${i.line}: ${i.code}`),
    ['web/js/ui/planted.js:1: S01', 'web/js/ui/planted.js:1: S01'],
  );
});

test('gold is caught anywhere in M1a art', () => {
  assert.deepEqual(codes(lintPicture(plate('@ near  C 7  L 10,10'), {})), ['P07']);
  assert.deepEqual(codes(lintPicture(plate('@ near  D 3 7 checker  F 10,10'), {})), ['P07', 'P04']);
  assert.deepEqual(codes(lintPicture(plate('@ sky  C 19  L 10,10'), {})), ['P07'], 'the glow cycle resolves to gold');
  assert.deepEqual(codes(lintPicture(stamp('C 7  L 0,0'), {})), ['P07']);
  assert.deepEqual(codes(lintPicture(plate('@ near  C 7  L 1,1', 'bonfire_lily_plate'), {})), [], "the lily's own files may");
});

test('the palette tables never make gold', () => {
  const json = JSON.parse(readFileSync(join(ROOT, 'content', 'art', 'palette.json'), 'utf8'));
  assert.deepEqual(lintPalette('palette.json', json), []);
  const id = [...Array(16).keys()];
  assert.deepEqual(codes(lintPalette('p.json', { remaps: { dusk: id.map((v) => (v === 8 ? 7 : v)) } })), ['P12'], 'a remap that turns rust into gold');
  assert.deepEqual(codes(lintPalette('p.json', { remaps: { day: id } })), [], 'gold may stay gold');
  assert.deepEqual(codes(lintPalette('p.json', { cycles: { 20: { name: 'fire', slots: [8, 7, 5] } } })), ['P12']);
  assert.deepEqual(codes(lintPalette('p.json', { cycles: { 19: { name: 'glow', slots: [7, 6, 8] } } })), [], "the lily's glow may");
});

test('the picture rules catch what they should', () => {
  assert.deepEqual(codes(lintPicture(plate('@ near  X 1,1'), {})), ['P01']);
  assert.deepEqual(codes(lintPicture(plate('@ near  T nothing_here 10,10'), {})), ['P02']);
  assert.deepEqual(codes(lintPicture(plate('@ near  C 1  L 10,10 170,10'), {})), ['P03']);
  assert.deepEqual(codes(lintPicture(plate('@ far  C 1  F 10,10'), {})), ['P04']);
  assert.deepEqual(codes(lintPicture(plate('@ sky  C 1  F 10,10'), {})), [], 'the sky may be one big fill');
  assert.deepEqual(codes(lintPicture(plate('Z rock 150,300,20,30'), {})), ['P06']);
  assert.deepEqual(codes(lintPicture(plate('@ near  C 25  L 3,3'), {})), ['P08']);
  assert.deepEqual(codes(lintPicture(stamp('@ far  C 1  L 0,0'), {})), ['P11']);
  assert.deepEqual(codes(lintPicture(stamp('C 1  L 0,0 4,0 4,4  F 1,3'), {})), ['P09'], 'an open outline leaks');
  const deep = [0, 1, 2, 3, 4, 5].map((i) => stamp(i === 5 ? 'C 1  L 0,0' : `T s${i + 1} 0,0`, `s${i}`));
  const issues = lintPictures([...deep, plate('@ near  T s0 5,5')]);
  assert.ok(codes(issues).includes('P05'));
});

test('T04 and T06 catch shipped text', () => {
  assert.deepEqual(codes(lintText('x.html', `Inspired by The ${'Gold'}en  ${'Gl'}ow.`)), ['T04']);
  assert.deepEqual(codes(lintText('x.html', '<a href="tel:5550100">Call</a>')), ['T06']);
  assert.deepEqual(codes(lintText('x.json', '{"desk": "TEL:+1 555 0100"}')), ['T06']);
  assert.deepEqual(codes(lintText('x.html', 'A hotel: fine. Telescope: fine.')), []);
  assert.deepEqual(codes(lintShell('index.html', '<head><meta charset="utf-8"></head>')), ['T06']);
  const shell = readFileSync(join(ROOT, 'web', 'index.html'), 'utf8');
  assert.deepEqual(lintShell('web/index.html', shell), []);
});

test('U01 keeps URLs relative', () => {
  assert.deepEqual(lintUrls('a.html', '<link rel="manifest" href="/manifest.webmanifest">'), [
    { file: 'a.html', line: 1, code: 'U01', msg: '"/manifest.webmanifest" must be relative: the same build is served at / and at /preview/' },
  ]);
  assert.deepEqual(codes(lintUrls('a.html', '<a href="https://ophiker.com/">x</a>')), ['U01'], 'not even our own address');
  assert.deepEqual(codes(lintUrls('a.js', "navigator.serviceWorker.register(new URL('/sw.js', import.meta.url));")), ['U01']);
  assert.deepEqual(codes(lintUrls('a.js', "navigator.serviceWorker.register(new URL('../../sw.js', import.meta.url).href);")), []);
  assert.deepEqual(codes(lintUrls('a.html', '<script src="js/main.js"></script>')), []);
  assert.deepEqual(codes(lintUrls('a.css', 'src: url("/fonts/x.woff2")')), ['U01']);
  assert.deepEqual(codes(lintUrls('m.webmanifest', '{"start_url": "/104-boyz/", "scope": "./"}')), ['U01']);
  assert.deepEqual(codes(lintUrls('a.js', "import { x } from '/js/gfx/picvm.js';")), ['U01']);
  assert.deepEqual(codes(lintUrls('a.js', "const m = await import('/js/ui/home.js');")), ['U01']);
  assert.deepEqual(codes(lintUrls('a.js', "const r = await fetch('/art/art.json');")), ['U01']);
  assert.deepEqual(codes(lintUrls('a.js', "import { x } from '../gfx/picvm.js';")), []);
  assert.deepEqual(codes(lintUrls('a.js', "const u = new URL('../../art/art.json', import.meta.url);")), []);
});

test('E01 keeps the picture VM pure', () => {
  assert.deepEqual(codes(lintPure('vm.js', 'const r = Math.random();')), ['E01']);
  assert.deepEqual(codes(lintPure('vm.js', 'const t = Date.now();')), ['E01']);
  assert.deepEqual(codes(lintPure('vm.js', 'document.body;')), ['E01']);
  assert.deepEqual(codes(lintPure('vm.js', '// no Math.random here, no Date\nconst x = 1;')), []);
  const vm = readFileSync(join(ROOT, 'web', 'js', 'gfx', 'picvm.js'), 'utf8');
  assert.deepEqual(lintPure('web/js/gfx/picvm.js', vm), []);
});
