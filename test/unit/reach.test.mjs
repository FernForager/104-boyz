// What a built page can load (tools/reach.mjs; GAME_DESIGN E.7, BUILD_PLAN
// S5): the list each channel's worker precaches. Its reading rules on small
// pages of our own; the built channels are sw.test.mjs's and build.test.mjs's.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pageReach, moduleRefs, cssRefs, resolveRef, SCREENS_NOTE } from '../../tools/reach.mjs';

/** A built folder from {path: text}. */
function site(t, files) {
  const dir = mkdtempSync(join(tmpdir(), 'oph-reach-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(join(dir, dirname(rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }
  return dir;
}

const page = (screens, head = '') =>
  `<!doctype html>\n<html lang="en" data-channel="x" data-screens="${screens}">\n<head>\n<link rel="manifest" href="manifest.webmanifest">\n<link rel="stylesheet" href="css/a.css">\n${head}<script type="module" src="js/main.js"></script>\n</head>\n<body><a href="#top">x</a><img src="https://example.com/x.png" alt=""></body>\n</html>\n`;

test('resolveRef: a path under the build, a folder with its /, the root as empty, off the site as null', () => {
  assert.equal(resolveRef('js/ui/app.js', '../../data/'), 'data/');
  assert.equal(resolveRef('js/ui/app.js', '../../art/art.json?v=1#x'), 'art/art.json');
  assert.equal(resolveRef('js/text.js', '../text/'), 'text/');
  assert.equal(resolveRef('js/ui/errors.js', '../../'), '');
  assert.equal(resolveRef('js/boot.js', '../'), '');
  assert.equal(resolveRef('index.html', 'icons/icon-192.png'), 'icons/icon-192.png');
  assert.equal(resolveRef('manifest.webmanifest', './'), '');
  assert.equal(resolveRef('js/main.js', '../../x.js'), null);
});

test("moduleRefs: static, dynamic and new URL(..., import.meta.url) references, a gate's // screens: note; comments never count", () => {
  const src = [
    "import { a } from './a.js';",
    'import {',
    '  b,',
    "} from '../b.js';",
    "import './side.js';",
    "export { c } from './c.js';",
    "/** @typedef {import('./typeonly.js').T} T */",
    "// import('./commented.js')",
    "const DATA = new URL('../../data/', import.meta.url);",
    "const ART = new URL(\"../../art/art.json\", import.meta.url);",
    "import('./always.js').then(() => {});",
    "if (x) import('./gated.js'); // screens: guestbook trail",
    "const s = 'import nothing from here';",
  ].join('\n');
  assert.deepEqual(
    moduleRefs(src).map((r) => [r.kind, r.ref, r.screens]),
    [
      ['import', './a.js', null],
      ['import', '../b.js', null],
      ['import', './side.js', null],
      ['import', './c.js', null],
      ['url', '../../data/', null],
      ['url', '../../art/art.json', null],
      ['dynamic', './always.js', null],
      ['dynamic', './gated.js', ['guestbook', 'trail']],
    ],
  );
  assert.deepEqual(
    moduleRefs("const f = 'x.js';\nimport(f);").map((r) => [r.kind, r.line]),
    [['bad', 2]],
    'a dynamic import with no literal path',
  );
  assert.equal(SCREENS_NOTE.exec("import('./x.js') // screens: map")[1], 'map');
  assert.equal(SCREENS_NOTE.exec("import('./x.js') // the screens: map, later"), null);
});

test('cssRefs: url()s in any quoting and @imports, comments aside', () => {
  const css = '@import "base.css";\n/* url("../fonts/Old.woff2") */\n@font-face { src: url("../fonts/A.woff2") format("woff2"), url(\'../fonts/A.ttf\'); }\n.x { background: url(../img/b.png); }';
  assert.deepEqual(cssRefs(css), ['../fonts/A.woff2', '../fonts/A.ttf', '../img/b.png', 'base.css']);
});

test("pageReach: the page's files, the manifest's icons, the CSS's fonts, the module graph and the files it names; a gated import only on its screens", (t) => {
  const files = {
    'manifest.webmanifest': JSON.stringify({ start_url: './', icons: [{ src: 'icons/i.png' }] }),
    'icons/i.png': 'png',
    'icons/unused.png': 'png',
    'css/a.css': '@font-face { src: url("../fonts/A.woff2"); }',
    'css/game2.css': '.y { background: url("../img/g.png"); }',
    'fonts/A.woff2': 'font',
    'fonts/OFL.txt': 'licence',
    'img/g.png': 'png',
    'js/main.js': "import { x } from './lib.js';\nconst SITE = new URL('../', import.meta.url);\nimport('./home.js');\nif (opensGame()) import('./game.js'); // screens: guestbook trail\n",
    'js/lib.js': "export const x = new URL('../text/', import.meta.url);\n",
    'js/home.js': "const ART = new URL('../art/art.json', import.meta.url);\n",
    'js/game.js': "import './deep.js';\nconst CSS = new URL('../css/game2.css', import.meta.url);\n",
    'js/deep.js': 'export {};\n',
    'js/never.js': 'export {};\n',
    'art/art.json': '{}',
    'text/en.json': '{}',
    'text/marks.json': '{}',
    'sw.js': '',
  };
  const mainish = site(t, { ...files, 'index.html': page('app title') });
  const r = pageReach(mainish);
  assert.deepEqual(r.screens, ['app', 'title']);
  assert.deepEqual(r.files, ['art/art.json', 'css/a.css', 'fonts/A.woff2', 'icons/i.png', 'index.html', 'js/home.js', 'js/lib.js', 'js/main.js', 'manifest.webmanifest', 'text/en.json', 'text/marks.json']);
  assert.deepEqual(r.gated, [{ from: 'js/main.js', ref: './game.js', screens: ['guestbook', 'trail'], taken: false }]);
  const previewish = site(t, { ...files, 'index.html': page('app guestbook title trail') });
  const p = pageReach(previewish);
  for (const f of ['js/game.js', 'js/deep.js', 'css/game2.css', 'img/g.png']) assert.ok(p.files.includes(f), `the game's screens reach ${f}`);
  for (const f of ['js/never.js', 'icons/unused.png', 'fonts/OFL.txt', 'sw.js']) assert.ok(!p.files.includes(f), `nothing names ${f}`);
  assert.equal(p.gated[0].taken, true);
});

test('pageReach refuses a file a page names that the build does not ship, and a dynamic import it cannot read', (t) => {
  const base = { 'index.html': page('app'), 'manifest.webmanifest': '{}', 'css/a.css': '' };
  assert.throws(() => pageReach(site(t, { ...base, 'js/main.js': "import './gone.js';\n" })), /js\/main\.js names \.\/gone\.js, which the build doesn't ship/);
  assert.throws(() => pageReach(site(t, { ...base, 'js/main.js': "const DATA = new URL('../data/', import.meta.url);\n" })), /names the folder \.\.\/data\/, which the build doesn't ship/);
  assert.throws(() => pageReach(site(t, { ...base, 'js/main.js': "const id = 'x';\nimport(`./${id}.js`);\n" })), /js\/main\.js:2: a dynamic import needs a literal path/);
  assert.throws(() => pageReach(site(t, { ...base, 'js/main.js': "import '../../up.js';\n" })), /off the site/);
});

test('pageReach refuses a file of the site loaded by a plain string, which the list could not see; a new URL(..., import.meta.url), a URL off the site or a computed one is fine', (t) => {
  const plain = [
    "fetch('../../art/odds.json');",
    "link.href = 'css/why.css';",
    'img.src = "../img/x.png";',
    "link.setAttribute('href', 'css/why.css');",
    "ctx.audioWorklet.addModule('./w.js');",
    "new Worker('./w.js', { type: 'module' });",
    "new FontFace('A', 'url(../fonts/A.woff2)');",
    'fetch(`../data/${id}.json`);',
  ];
  assert.deepEqual(
    moduleRefs(plain.join('\n')).map((r) => [r.kind, r.ref, r.line]),
    [
      ['plain', '../../art/odds.json', 1],
      ['plain', 'css/why.css', 2],
      ['plain', '../img/x.png', 3],
      ['plain', 'css/why.css', 4],
      ['plain', './w.js', 5],
      ['plain', './w.js', 6],
      ['plain', '../fonts/A.woff2', 7],
      ['plain', '../data/', 8],
    ],
  );
  const fine = [
    "const ODDS = new URL('../art/odds.json', import.meta.url);",
    'fetch(ODDS);',
    'link.href = FRAME_CSS.href;',
    "link.setAttribute('href', FRAME_CSS.href);",
    "a.href = 'https://www.nps.gov/olym/';",
    "a.href = '#top';",
    'fetch(`${base}x.json`);',
    "if (img.src === 'x.png') go();",
    "// fetch('./commented.json')",
  ];
  assert.deepEqual(moduleRefs(fine.join('\n')).filter((r) => r.kind === 'plain'), []);
  const base = { 'index.html': page('app'), 'manifest.webmanifest': '{}', 'css/a.css': '', 'css/why.css': '' };
  assert.throws(() => pageReach(site(t, { ...base, 'js/main.js': "const link = {};\nlink.href = 'css/why.css';\n" })), /js\/main\.js:2: css\/why\.css is loaded by a plain string; name it with new URL/);
  assert.throws(() => pageReach(site(t, { ...base, 'js/main.js': "fetch('../css/why.css');\n" })), /js\/main\.js:1: \.\.\/css\/why\.css is loaded by a plain string/, 'even a file that ships');
  assert.ok(pageReach(site(t, { ...base, 'js/main.js': "const WHY = new URL('../css/why.css', import.meta.url);\nfetch(WHY);\n" })).files.includes('css/why.css'));
});
