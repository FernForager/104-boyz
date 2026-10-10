import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parsePic } from '../../web/js/gfx/picvm.js';
import { lintPicture, lintPictures, lintPalette, lintText, lintShell, lintPure, lintUrls, lintEngine, lintEngineImports, lintContent, lintColors, colorOf, PALETTE_HOMES, runLint, isError, RULES, activeCodes, codeRanges, formatRules } from '../../tools/lint.mjs';
import { ROOT } from '../../tools/pics.mjs';

const plate = (text, id = 'test_plate') => ({ id, kind: 'plates', rel: `plates/${id}.pic`, parsed: parsePic(text), width: 160, height: 320 });
const stamp = (text, id = 'test_stamp') => ({ id, kind: 'stamps', rel: `stamps/${id}.pic`, parsed: parsePic(text), width: 0, height: 0 });
const codes = (issues) => issues.map((i) => i.code);

/** A copy of what the lint reads (web/, content/, schemas/) in a temp folder, removed after the test. */
function lintCopy(t, name) {
  const tmp = mkdtempSync(join(tmpdir(), `oph-${name}-`));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  for (const d of ['web', 'content', 'schemas']) cpSync(join(ROOT, d), join(tmp, d), { recursive: true });
  return tmp;
}

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
  const tmp = lintCopy(t, 's01');
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
  // S7: a pseudo-color in the VM's range (16-29) that the palette doesn't define: 26 (steam) and 27 (alpen) are
  // reserved for S25 and S17; the cabin's 28 (spill) and 29 (smoke) are defined.
  assert.deepEqual(codes(lintPicture(plate('@ near  C 26  L 3,3'), {})), ['P01']);
  assert.deepEqual(codes(lintPicture(plate('@ near  D 27 2 checker  F 3,3'), {})), ['P01', 'P04']);
  assert.deepEqual(codes(lintPicture(stamp('C 26  L 0,0'), {})), ['P01']);
  assert.deepEqual(codes(lintPicture(plate('@ near  C 28  L 3,3  C 29  L 4,4'), {})), []);
  assert.deepEqual(codes(lintPicture(plate('@ near  C 28  L 3,3'), {}, { 16: {} })), ['P01'], "against the palette it's given");
  assert.deepEqual(codes(lintPicture(stamp('@ far  C 1  L 0,0'), {})), ['P11']);
  assert.deepEqual(codes(lintPicture(stamp('C 1  L 0,0 4,0 4,4  F 1,3'), {})), ['P09'], 'an open outline leaks');
  assert.deepEqual(codes(lintPicture({ ...plate('@ near  C 1  L 1,1'), kind: null }, {})), ['P10'], 'a picture outside plates/, scenes/ and stamps/');
  assert.deepEqual(codes(lintPicture(plate('@ near  C 1  L 1,1', 'Bad-Id'), {})), ['P10'], 'a bad id');
  assert.deepEqual(codes(lintPictures([plate('@ near  C 1  L 1,1', 'twin'), plate('@ near  C 1  L 2,2', 'twin')])), ['P10'], 'an id twice');
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

test('E02 catches each banned form in the engine (BUILD_PLAN 6.6; GAME_DESIGN E.12)', () => {
  const e02 = (code) => lintEngine('web/js/engine/x.js', code).map((i) => i.msg.replace(/^the engine may not use (.*) \(BUILD_PLAN 6\.6; GAME_DESIGN E\.12\)$/, '$1'));
  const BARE_MATH = 'Math other than Math.sqrt/floor/ceil/round/trunc/abs/min/max/sign/imul/clz32/fround/PI (an alias, a destructuring or another member)';
  const cases = {
    'const r = Math.random();': 'Math.random',
    'const e = Math.exp(1);': 'Math.exp',
    'Math . log ( 2 )': 'Math.log',
    'Math.log1p(x)': 'Math.log1p',
    'Math.pow(2, 3)': 'Math.pow',
    'Math.sin(x) + 1': 'Math.sin',
    'Math.atan2(y, x)': 'Math.atan2',
    'Math.hypot(a, b)': 'Math.hypot',
    "Math['exp'](1)": 'Math[...] (a computed Math function)',
    'const y = x ** 2;': 'the ** operator',
    'x **= 2;': 'the ** operator',
    'const t = Date.now();': 'Date',
    'performance.now()': 'performance',
    'new Intl.Segmenter()': 'Intl',
    'n.toLocaleString()': 'toLocaleString',
    'a.localeCompare(b)': 'localeCompare',
    "s.normalize('NFC')": 'String.prototype.normalize',
    's.toLowerCase()': 'toLowerCase',
    's.toUpperCase()': 'toUpperCase',
    "new RegExp('a+')": 'new RegExp',
    'const re = /\\p{L}/u;': 'a Unicode property escape (\\p{...})',
    'document.body': 'document',
    'window.x': 'window',
    "localStorage.getItem('k')": 'localStorage',
    'fetch(url)': 'fetch',
    'crypto.getRandomValues(b)': 'crypto',
    'setTimeout(f, 1)': 'setTimeout',
    'queueMicrotask(f)': 'queueMicrotask',
    'globalThis.x = 1;': 'globalThis',
    'process.exit(1)': 'process',
    'eval("1")': 'eval',
    "new Function('return 1')": 'Function',
    'console.log(1)': 'console',
    'new TextEncoder()': 'TextEncoder',
    "await import('./x.js')": 'a dynamic import()',
    'const { exp, random } = Math;': BARE_MATH,
    'const M = Math;\nconst e = M.exp(1);': BARE_MATH,
    "const e = Reflect.get(Math, 'exp')(1);": BARE_MATH,
    'Math?.exp(1)': BARE_MATH,
    'const r = Math.E;': BARE_MATH,
    'const r = Math\n  .random();': 'Math.random',
    'const e = Math.\n  expm1(x);': 'Math.expm1',
    'Math.tan(x) + Math.cbrt(y)': 'Math.tan',
  };
  for (const [code, what] of Object.entries(cases)) assert.deepEqual(e02(code), [what], code);
  for (const ok of ['Math.sqrt(2) + Math.floor(x) + Math.imul(a, b) + Math.round(y)', 'const a = Math\n  .max(1, Math.PI);', '// Math.random() in a comment', "const s = 'Date.now() in a string';", 'x.fetch(1); obj.document;', '/** @type {Function} */\nconst f = g;', 'const r = /[a-z]+/;', "import { x } from './y.js';", 'const n = a * b;']) {
    assert.deepEqual(e02(ok), [], ok);
  }
  assert.deepEqual(lintEngine('web/js/engine/x.js', 'const a = 1;\nconst b = Math.random();')[0].line, 2);
  assert.deepEqual(lintEngine('web/js/engine/x.js', 'const a = 1;\nconst b = Math\n  .random();\nconst { pow } =\n  Math;').map((i) => i.line), [2, 5], 'a split chain at its first line; a destructuring at its Math');
});

test('E03: the engine imports only the engine', () => {
  const e03 = (code, file = 'web/js/engine/step.js') => lintEngineImports(file, code, ROOT).map((i) => i.msg);
  assert.deepEqual(e03("import { EngineError } from './error.js';\nexport { draw } from './rng.js';\nimport home from './phases/home.js';"), []);
  assert.deepEqual(e03("import { x } from '../text.js';"), ['"../text.js" is outside the engine: web/js/engine/ imports only web/js/engine/ (BUILD_PLAN 2.3; GAME_DESIGN E.2)']);
  assert.deepEqual(e03("import fs from 'node:fs';").length, 1);
  assert.deepEqual(e03("import '../../sw.js';").length, 1, 'a bare side-effect import');
  assert.deepEqual(e03("import { x } from '../trip.js';", 'web/js/engine/phases/home.js'), []);
  assert.deepEqual(e03("import { x } from '../../ui/app.js';", 'web/js/engine/phases/home.js').length, 1);
  assert.deepEqual(e03("import { x } from './nowhere.js';"), ['"./nowhere.js" is not a file in the engine']);
  assert.deepEqual(e03("// import x from '../text.js';\nconst s = \"import y from '../z.js'\";"), [], 'comments and strings are not imports');
});

test('the engine in the repo passes E02 and E03; a planted ban fails the repo lint', (t) => {
  const tmp = lintCopy(t, 'e02');
  assert.deepEqual(runLint(tmp).filter((i) => i.code === 'E02' || i.code === 'E03'), []);
  writeFileSync(join(tmp, 'web', 'js', 'engine', 'planted.js'), "import { t } from '../text.js';\nexport const roll = () => Math.random() < 0.5;\n");
  assert.deepEqual(
    runLint(tmp).filter((i) => i.code === 'E02' || i.code === 'E03').map((i) => `${i.file}:${i.line}: ${i.code}`),
    ['web/js/engine/planted.js:2: E02', 'web/js/engine/planted.js:1: E03'],
  );
});

test('J01, R01 and X01: the repo\'s content passes; a file with no schema, a broken file, a dangling next and a bad expression fail (GAME_DESIGN F.3)', (t) => {
  assert.deepEqual(lintContent(), [], "the repo's content");
  const tmp = lintCopy(t, 'content');
  const plant = (rel, data) => writeFileSync(join(tmp, 'content', ...rel.split('/')), `${JSON.stringify(data, null, 1)}\n`);
  const set = (id, stops) => ({ id, screen: 'trail', phase: 'trailhead', first: stops[0].id, stops });
  plant('rules/extra.json', { anything: 1 });
  plant('stops/no_first.json', { id: 'no_first', screen: 'trail', phase: 'trailhead', stops: [] });
  plant('stops/dangling.json', set('dangling', [{ id: 'a', box: '@trail.walk_on', next: 'nowhere' }]));
  plant('stops/bad_expr.json', set('bad_expr', [{ id: 'a', box: '@trail.walk_on', choices: [{ id: 'go', label: '@trail.walk_on', show_if: 'x = 1', then: 'a' }] }]));
  plant('stops/bad_type.json', set('bad_type', [{ id: 'a', box: '@trail.walk_on', choices: [{ id: 'go', label: '@trail.walk_on', show_if: 'trip.day + 1', then: 'a' }] }]));
  const got = lintContent(tmp).map((i) => `${i.file} ${i.code}`);
  assert.deepEqual(got, [
    'content/rules/extra.json J01',
    'content/stops/bad_expr.json X01',
    'content/stops/bad_type.json X01',
    'content/stops/dangling.json R01',
    'content/stops/no_first.json J01',
  ]);
  const issues = runLint(tmp).filter(isError).map((i) => i.code);
  for (const c of ['J01', 'R01', 'X01']) assert.ok(issues.includes(c), `the repo lint runs ${c}`);
  const msg = lintContent(tmp).find((i) => i.file === 'content/stops/dangling.json');
  assert.match(msg.msg, /next "nowhere" is not a stop in set "dangling"/);
  assert.equal(msg.line, 10, 'the line of the dangling next');
});

test('the registry lists every rule once, with its family, doc and status; the summary names the active codes (BUILD_PLAN 6.7, 10.5)', () => {
  const coded = RULES.filter((r) => r.code).map((r) => r.code);
  assert.equal(new Set(coded).size, coded.length, 'no code twice');
  for (const r of RULES) {
    assert.ok(r.family && r.doc && r.what, JSON.stringify(r));
    assert.ok(r.status === 'active' ? !r.lands : /^S\d+[a-z]?$/.test(r.lands), JSON.stringify(r));
  }
  // S4 adds the graph lints (tools/graphlint.mjs): G01-G04 and G06-G08; G05 waited for S5's recipes.
  // S4 (track B) also turns T16 on: the gazetteer, the quotes and cut words (tools/textlint.mjs).
  // S5 (track B) turns on the composer's lints, P13 and P14, and G05 with content/art/recipes.json.
  // S5 (track C) turns on E04: the sound's synthesis (audio/dsp.js) keeps E02's bans.
  // S5 (track D) turns on T15: a line over its max, each {var} at its width (content/text/vars.json).
  // S6 (track A) turns on P16: a color literal outside the palette's homes.
  // S6 (track C) turns on P15: the pictures' words (hotspot kinds, Looks, alt parts; tools/looks.mjs),
  // and T02: measured fit in the shipped fonts (tools/t02.mjs, tools/fontmetrics.mjs).
  assert.equal(codeRanges(activeCodes()), 'P01-P16, T02, T04, T06, T07, T10-T16, U01, E01-E04, S01, J01, R01, X01, G01-G08');
  assert.equal(codeRanges(['A01', 'A02', 'B01', 'A04']), 'A01, A02, B01, A04', 'a range is three or more in a row');
  // The park graph's last rule, G05, landed in S5.
  assert.ok(RULES.filter((r) => r.family === 'park graph').every((r) => r.status === 'active'));
  for (const family of ['cards', 'honest odds', 'economy', 'minigames', 'coverage', 'Boyz placeholders', 'sound', 'Larry caps', 'fair deaths', 'the death sequence', 'the epitaph dice', 'the timed modes']) {
    assert.ok(RULES.some((r) => r.family === family && r.status === 'lands'), `${family} waits for its session`);
  }
  const text = formatRules();
  assert.match(text, /^P01 +active +pictures/m);
  assert.match(text, /^G01 +active +park graph/m);
  assert.match(text, /^G05 +active +park graph/m);
  assert.match(text, /^P13 +active +pictures/m);
  assert.match(text, /^E04 +active +code/m);
  assert.match(text, /^T15 +active +text/m);
  assert.match(text, /^T02 +active +text/m);
  assert.match(text, /^P15 +active +pictures/m);
  assert.match(text, /^P16 +active +palette/m);
  // 44 since S6 turned on P16, P15 and T02 (41 since S5 turned on P13, P14, G05, E04 and T15; 36 since S4 turned T16 on, 35 with the graph lints).
  assert.match(text, /^lint: 44 rules active, \d+ waiting for their sessions$/m);
});

test("P16: a color literal outside the palette's homes fails unless it is a palette color (decision 68: a palette change is one edit)", () => {
  const codes = (issues) => issues.map((i) => `${i.line}:${i.code}`);
  // Option B's ink, S5's scrim and a stray hex: the literals S6 found.
  const css = '/* #1b1f2a in a comment */\n#bad, #fade:hover, #c0ffee .x {\n  color: #bad;\n  background: rgb(27 31 42 / 0.72);\n}\n.ok { border: 1px solid var(--c0); fill: #343945; background: rgb(52 57 69 / 0.72); }\n@media (min-width: 1px) { #cafe { color: rgba(52, 57, 69, .5); outline-color: #345; } }\n';
  assert.deepEqual(codes(lintColors('web/css/game.css', css)), ['3:P16', '4:P16', '7:P16'], 'the stray hex, the old scrim and a short hex that is no palette color; never a selector or a comment');
  assert.deepEqual(codes(lintColors('web/index.html', '<!-- #1b1f2a -->\n<meta name="theme-color" content="#1b1f2a">\n<p>&#8212;</p><a href="#map">')), ['2:P16']);
  assert.deepEqual(codes(lintColors('web/index.html', '<meta name="theme-color" content="#343945">')), [], "ink is a palette color");
  assert.deepEqual(codes(lintColors('web/manifest.webmanifest', '{"background_color": "#343945",\n "theme_color": "#1b1f2a"}')), ['2:P16']);
  // A module: its strings only, upper case too, and a color built in code is no literal the lint can check.
  const js = "// '#1b1f2a' in a comment\nconst a = '#1B1F2A';\nconst b = '#343945cc', d = '#frame';\nconst c = `rgb(${r} ${g} ${b})`;\n";
  assert.deepEqual(codes(lintColors('web/js/ui/x.js', js)), ['2:P16', '4:P16']);
  assert.match(lintColors('web/js/ui/x.js', js)[1].msg, /built in code/);
  // The homes may write anything; they are what the palette test holds.
  assert.deepEqual(PALETTE_HOMES, ['web/css/tokens.css', 'web/js/gfx/palette.js']);
  for (const home of PALETTE_HOMES) assert.deepEqual(lintColors(home, "a { color: #123456; } const x = '#123456';"), []);
  // colorOf reads the forms CSS writes.
  assert.deepEqual(colorOf('#345'), [0x33, 0x44, 0x55]);
  assert.deepEqual(colorOf('#343945cc'), [52, 57, 69]);
  assert.deepEqual(colorOf('rgb(52 57 69 / 0.72)'), [52, 57, 69]);
  assert.deepEqual(colorOf('rgba(52, 57, 69, 0.5)'), [52, 57, 69]);
  assert.deepEqual(colorOf('rgb(100% 0% 50%)'), [255, 0, 128]);
  assert.equal(colorOf('rgb(var(--x))'), null);
});

test("P16 in the repo: S5's scrim literal, planted back in game.css, fails the lint; the repo's own web/ passes", (t) => {
  const tmp = lintCopy(t, 'p16');
  const file = join(tmp, 'web', 'css', 'game.css');
  writeFileSync(file, readFileSync(file, 'utf8').replace('background: var(--scrim);', 'background: rgb(27 31 42 / 0.72);'));
  const p16 = runLint(tmp).filter((i) => i.code === 'P16');
  assert.deepEqual(p16.map((i) => i.file), ['web/css/game.css']);
  assert.match(p16[0].msg, /rgb\(27 31 42 \/ 0\.72\) is no palette color/);
});

test('every active code has a failing case and a passing one in the unit tests', () => {
  // The failing and passing cases live beside each rule's family: pictures,
  // E and S rules and the content codes here, the text codes in textlint.test.mjs,
  // the park graph's in graphlint.test.mjs (S4), the composer's (P13, P14,
  // G05) in recipes.test.mjs (S5), the sound's (E04) in dsp.test.mjs (S5).
  const tests = ['lint.test.mjs', 'textlint.test.mjs', 'graphlint.test.mjs', 'recipes.test.mjs', 'dsp.test.mjs'].map((f) => readFileSync(join(ROOT, 'test', 'unit', f), 'utf8')).join('\n');
  for (const code of activeCodes()) assert.ok(new RegExp(`\\b${code}\\b`).test(tests), `${code} has cases`);
});
