import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { BOOK_WORDS, checkMainBuild, readText, gateSummary } from '../../tools/text.mjs';
import {
  scanJs,
  lintJsEnglish,
  lintHtmlEnglish,
  lintCssEnglish,
  lintManifestEnglish,
  lintSvgEnglish,
  lintTextFields,
  lintContentText,
  contentRefs,
  contentFiles,
  collectUses,
  lintT07,
  lintT11,
  lintT12,
  lintT13,
  lintT14,
  runTextLint,
  T07_PREVIEW,
} from '../../tools/textlint.mjs';
import { fakeText, entry } from './textfix.mjs';
import { readSchemas } from '../../tools/content.mjs';

const codes = (issues) => issues.map((i) => i.code);
const js = (code) => codes(lintJsEnglish('web/js/x.js', code));
const uses = (files) => collectUses(Object.entries(files).map(([file, src]) => ({ file, src })));

test('T07 finds the book words, whole words, case-blind', () => {
  for (const s of ['a book', 'Books', 'the BOOKSHELF', 'Chapter 2', 'a page', 'pages', 'Volume one', 'the back cover', 'a picture-book trip', 'Storybook', 'first edition', 'a shelf of trips', 'back\ncover', 'chapters', 'volumes', 'editions']) {
    assert.ok(BOOK_WORDS.test(s), s);
  }
  for (const s of ['a guidebook', 'my notebook', 'a sketchbook', 'a booklet', "a store's shelf", 'paged', 'editorial']) assert.ok(!BOOK_WORDS.test(s), s);
});

test('T07: an error where main can reach it or the ledger holds it; a warning on a preview-only draft', () => {
  const text = fakeText({
    lines: { 'app.shown': 'Open the book', 'app.held': 'Turn the page', 'title.draft': { text: 'Begin a new book', screen: 'title' }, 'app.guide': 'A guidebook', 'app.real': 'A bookstore book' },
    approved: { 'app.held': 'Turn the page' },
    off: { 'title.draft': 'test', 'app.held': 'test' },
    allow: { 'app.real': 'The bookstore job sells real books' },
  });
  const issues = lintT07(text, ['app.shown', 'app.guide']);
  const by = Object.fromEntries(issues.map((i) => [`${i.id}:${i.file}`, i.level]));
  assert.equal(by['app.shown:content/text/en/app.json'], 'error', 'main reaches it');
  assert.equal(by['app.held:content/text/en/app.json'], 'error', 'approved book words are never a warning');
  assert.equal(by['app.held:content/text/approved.json'], 'error', 'the ledger may not hold book words');
  assert.equal(by['title.draft:content/text/en/title.json'], T07_PREVIEW, 'a draft only preview shows');
  assert.equal(T07_PREVIEW, 'warn');
  assert.ok(!issues.some((i) => i.id === 'app.guide' || i.id === 'app.real'), 'guidebook passes; the allowlist passes');
  const empty = fakeText({ lines: { 'app.real': 'A book' }, allow: { 'app.real': ' ' } });
  assert.match(lintT07(empty, []).map((i) => i.msg).join('\n'), /allowlist entry for app\.real needs its reason/);
});

test('T10: a planted English string in JS fails', () => {
  assert.deepEqual(js("el.textContent = 'Hello there';"), ['T10']);
  assert.deepEqual(js("el.setAttribute('aria-label', 'Menu');"), ['T10']);
  assert.deepEqual(js("const s = 'Pack your bag.';"), ['T10']);
  assert.deepEqual(js('el.innerHTML = `<b>${n}</b> left`;'), ['T10']);
  assert.deepEqual(js("ctx.fillText('Hi', 0, 0);"), ['T10']);
  assert.deepEqual(js("navigator.share({ title: 'My trip', url });"), ['T10']);
  assert.deepEqual(js("alert('Saved');"), ['T10']);
  assert.deepEqual(js("el.ariaLabel = 'close';"), ['T10'], 'a sink takes any letter');
  assert.deepEqual(js("document.title = 'x';"), ['T10']);
  assert.deepEqual(js("const m = { msg: 'Something went wrong' };"), ['T10']);
  // Anything a sink's value holds, however it is joined, and the DOM's text methods.
  assert.deepEqual(js("el.title = n + ' miles';"), ['T10']);
  assert.deepEqual(js('done.title = n() + " miles";'), ['T10']);
  assert.deepEqual(js("x.textContent = cond ? 'yes' : 'no';"), ['T10', 'T10']);
  assert.deepEqual(js("x.textContent = cond\n  ? 'yes'\n  : 'no';"), ['T10', 'T10'], 'over several lines');
  assert.deepEqual(js("x.textContent = ('done');"), ['T10']);
  assert.deepEqual(js("x.textContent = [a, 'left'].join(' ');"), ['T10']);
  assert.deepEqual(js('x.textContent = `${n} left`;'), ['T10']);
  assert.deepEqual(js("el.append('restart');"), ['T10']);
  assert.deepEqual(js("x.replaceChildren('done');"), ['T10']);
  assert.deepEqual(js("x.after(icon, 'done');"), ['T10']);
  assert.deepEqual(js("x.insertAdjacentText('beforeend', 'done');"), ['T10']);
  assert.deepEqual(js("x.insertAdjacentHTML('afterbegin', '<b>go</b>');"), ['T10']);
  assert.deepEqual(js("const n = doc.createTextNode('lake');"), ['T10']);
  assert.deepEqual(js("sel.add(new Option('lake', 'v'));"), ['T10']);
  assert.deepEqual(js("el.label = 'lake';"), ['T10']);
  assert.deepEqual(js("input.value = 'trail';"), ['T10']);
  assert.deepEqual(js("el.setAttribute('value', 'go');"), ['T10']);
  assert.deepEqual(js("navigator.share({ text: n + ' nights' });"), ['T10']);
});

test('T10: a sink fed by t(), code attributes and comparisons pass', () => {
  for (const ok of [
    "el.textContent = t('app.offline');",
    "el.title = t('app.name') + ' ' + t('app.build', { build });",
    "x.textContent = cond ? t('app.a') : t('app.b');",
    "el.textContent = fmt(n, 'mi');",
    "el.append(t('app.x'), ' — ');",
    "x.insertAdjacentText('beforeend', t('app.x'));",
    "el.setAttribute('aria-hidden', 'true');",
    "b.setAttribute('aria-pressed', String(on));",
    "el.setAttribute('data-t-state', 'draft');",
    "sheet.setAttribute('role', 'dialog');",
    "area.value = text;",
    "if (el.title === 'x' || el.value !== 'y') go();",
    "navigator.share({ text: report, url });",
  ]) {
    assert.deepEqual(js(ok), [], ok);
  }
});

test('T10: code-shaped strings, console calls, errors and tagged lines pass', () => {
  for (const ok of [
    "const u = new URL('index.html', base);",
    "matchMedia('(display-mode: standalone)');",
    "const SIDEWAYS = '(orientation: landscape) and (max-height: 540px)';",
    "doc.querySelector('.shelf .choice');",
    "doc.querySelectorAll('button.choice > span');",
    "const type = 'image/png';",
    "worker.postMessage({ type: 'skip-waiting' });",
    "import { x } from '../gfx/picvm.js';",
    "console.log('Hello there');",
    "console.warn(`text: no line ${id}`, err);",
    "throw new Error('Bad thing.');",
    'if (!res.ok) throw new Error(`art: ${res.status}`);',
    "const NAMES = ['night navy']; // t-ok: palette names (developer text)",
    "el.textContent = '';",
    "el.textContent = `${a} / ${b}`;",
    "const re = /it's \"Hello there\"/; const ok = 'x';",
    "// el.textContent = 'Hello there';",
    "/* const s = 'Pack your bag.'; */",
    "const t = a / b; const s = 'ok';",
  ]) {
    assert.deepEqual(js(ok), [], ok);
  }
  assert.deepEqual(js("const s = 'Pack your bag.'; // t-ok:"), ['T10', 'T10'], 'a t-ok tag needs a reason, and an empty one exempts nothing');
});

test('T10: pages, stylesheets, the manifest and SVG', () => {
  const html = (body) => codes(lintHtmlEnglish('web/x.html', `<html><head></head><body>${body}</body></html>`));
  assert.deepEqual(html('<p>Hello</p>'), ['T10']);
  assert.deepEqual(html('<button title="Go"></button>'), ['T10']);
  assert.deepEqual(html('<img alt="A lake">'), ['T10']);
  assert.deepEqual(html('<div aria-label="Menu"></div>'), ['T10']);
  assert.deepEqual(codes(lintHtmlEnglish('x.html', '<html><head><title>X</title></head><body></body></html>')), ['T10']);
  assert.deepEqual(codes(lintHtmlEnglish('x.html', '<html><head><meta name="description" content="A game"></head><body></body></html>')), ['T10']);
  // Any attribute but code counts as words: a button's value, an option's label, a link preview's meta.
  assert.deepEqual(html('<input class="box choice" type="button" value="Start trip">'), ['T10']);
  assert.deepEqual(html('<select><option label="lake" value="v"></option></select>'), ['T10'], "the label is words; an option's value is code");
  assert.deepEqual(html('<input type="text" value="Your name"><input type="hidden" name="k" value="main"><button type="button" value="go"></button>'), ['T10'], "a text field's value shows");
  assert.deepEqual(html('<p aria-valuetext="half"></p><p download="trip"></p>'), ['T10', 'T10'], 'an attribute not known to be code is words');
  assert.deepEqual(codes(lintHtmlEnglish('x.html', '<html><head><meta property="og:description" content="A picture-book hiking trip"><meta name="twitter:title" content="Hiker"></head><body></body></html>')), ['T10', 'T10']);
  assert.deepEqual(
    codes(lintHtmlEnglish('x.html', '<html lang="en" data-x="Any words"><head><meta charset="utf-8"><meta name="theme-color" content="dark"><meta property="og:image" content="https://ophiker.com/icons/icon-512.png"><meta http-equiv="refresh" content="0; url=x"><link rel="icon" sizes="192x192" as="image" crossorigin></head><body><button type="button" role="switch" aria-pressed="false" aria-controls="p q" hidden disabled></button></body></html>')),
    [],
    'code attributes, data-*, and the setting metas pass',
  );
  assert.deepEqual(html('<svg><text x="1">Hi</text></svg>'), ['T10', 'T10'], 'the <text> element and its words');
  assert.deepEqual(html('<p data-t="app.x">Hi</p>'), ['T10'], 'a data-t element is empty in source');
  assert.deepEqual(html('<p data-t="app.x"></p>'), []);
  assert.deepEqual(html('<p data-t="app.x">\n</p><span>12 &nbsp; —</span><!-- a note -->'), [], 'no letters, and comments, pass');
  assert.deepEqual(html('<script>const a = "Hello there";</script><style>p{}</style>'), [], 'scripts and styles are read as code');
  assert.deepEqual(codes(lintHtmlEnglish('web/index.html', readFileSync(join(ROOT, 'web', 'index.html'), 'utf8'))), [], 'the shell carries ids, not words');
  assert.deepEqual(codes(lintCssEnglish('a.css', 'a::after { content: "Next"; }')), ['T10']);
  assert.deepEqual(codes(lintCssEnglish('a.css', '.x::before { content: "> "; content: "> " / ""; }\n.y::after { content: "\\2713" / ""; }\n.z { align-content: center; }\n/* content: "Words" */')), []);
  assert.deepEqual(codes(lintManifestEnglish('m.webmanifest', '{"name": "Hiker", "short_name": "@app.short_name"}')), ['T10']);
  assert.deepEqual(codes(lintManifestEnglish('m.webmanifest', readFileSync(join(ROOT, 'web', 'manifest.webmanifest'), 'utf8'))), []);
  assert.deepEqual(codes(lintSvgEnglish('a.svg', '<svg><text>Hi</text></svg>')), ['T10']);
  assert.deepEqual(codes(lintSvgEnglish('a.svg', '<svg><rect/></svg>')), []);
  const schema = { properties: { name: { 'x-text': true }, stops: { items: { properties: { say: { 'x-text': true } } } } } };
  assert.deepEqual(codes(lintTextFields('c.json', { name: '@place.x', stops: [{ say: '@stop.a' }, { say: 'Hello' }] }, schema)), ['T10']);
});

test('T10 in the repo: a planted line in the shipped code fails the lint (the Done when)', (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-planted-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  cpSync(join(ROOT, 'web'), join(tmp, 'web'), { recursive: true });
  cpSync(join(ROOT, 'content'), join(tmp, 'content'), { recursive: true });
  const before = runTextLint(tmp).issues.filter((i) => i.level === 'error');
  assert.deepEqual(before, []);
  appendFileSync(join(tmp, 'web', 'js', 'main.js'), "\ndocument.body.textContent = 'Welcome back, hiker!';\n");
  const after = runTextLint(tmp).issues.filter((i) => i.level === 'error');
  assert.deepEqual(after.map((i) => `${i.file} ${i.code}`), ['web/js/main.js T10']);
});

test('scanJs reads literals, templates, regexes and t() calls', () => {
  const s = scanJs("const a = 'x'; // 'not this'\nconst b = `${t('app.one', { n, build: 2 })} ${y}`; const r = /'/g; tx(el, 'app.two'); t(id); t('app.three', vars);");
  assert.deepEqual(
    s.literals.map((l) => l.value),
    ['x', null, 'app.one', 'app.two', 'app.three'],
  );
  assert.deepEqual(
    s.calls.map((c) => [c.fn, c.id, c.vars]),
    [
      ['t', 'app.one', ['n', 'build']],
      ['tx', 'app.two', undefined],
      ['t', null, undefined],
      ['t', 'app.three', null],
    ],
  );
  assert.deepEqual(scanJs('export function t(id, vars) { return id; }').calls, [], "t's own definition isn't a call");
});

test('T11: ids used are defined, and lines on built screens are used', () => {
  const text = fakeText({
    lines: { 'app.name': 'N', 'app.short_name': 'S', 'app.description': 'D', 'app.preview_name': 'P', 'app.used': 'U', 'app.unused': 'Never', 'credits.later': { text: 'L', screen: 'credits' }, 'app.listed': 'L' },
  });
  const u = uses({
    'web/index.html': '<html><body><p data-t="app.used"></p><p data-t="app.gone"></p></body></html>',
    'web/js/a.js': "t('nope.x');\nt(which); // t-ids: app.listed\ntx(el, k);\n",
  });
  const r = lintT11(text, u);
  const msgs = r.issues.map((i) => `${i.file}:${i.line} ${i.msg}`);
  assert.deepEqual(msgs, [
    "web/index.html:1 data-t uses app.gone, which isn't defined in content/text",
    "web/js/a.js:1 t() asks for nope.x, which isn't defined in content/text",
    'web/js/a.js:3 tx() needs a literal id, or the line ends // t-ids: <every id it can be> (or @content)',
    'content/text/en/app.json:1 app.unused is defined and never used',
  ]);
  assert.deepEqual(r.infos, ['credits.later: waiting for screen credits']);
  const lit = lintT11(text, uses({ 'web/js/b.js': "const IDS = ['app.unused', 'app.used', 'app.listed'];" }));
  assert.deepEqual(lit.issues, [], 'an id in an array counts as used');
});

test('content refs (S3): "@id" strings in content files are uses; a call ending // t-ids: @content is accepted', () => {
  const src = '{\n "id": "s",\n "$comment": "@app.comment",\n "stops": [\n  { "id": "a", "box": "@trail.a", "next": null },\n  { "id": "b", "box": ["@trail.b1", "not an id", "@trail.gone"] }\n ]\n}\n';
  const refs = contentRefs({ file: 'content/stops/s.json', src, data: JSON.parse(src) });
  assert.deepEqual(refs.map((r) => `${r.id}:${r.line}`), ['trail.a:5', 'trail.b1:6', 'trail.gone:6'], 'with their lines; $comment and plain strings aside');
  const text = fakeText({
    lines: { 'app.name': 'N', 'app.short_name': 'S', 'app.description': 'D', 'app.preview_name': 'P', 'trail.a': { text: 'A', screen: 'trail' }, 'trail.b1': { text: 'B', screen: 'trail' }, 'trail.walk_on': { text: 'Walk on', screen: 'trail' } },
    screens: ['app', 'trail'],
  });
  const u = uses({ 'web/js/stop.js': "const W = 'trail.walk_on';\ntx(p, ref.id, ref.vars); // t-ids: @content\n" });
  u.content = refs;
  const r = lintT11(text, u);
  assert.deepEqual(r.issues.map((i) => `${i.file}:${i.line} ${i.msg}`), ["content/stops/s.json:6 content refers to trail.gone, which isn't defined in content/text"], 'trail.a and trail.b1 count as used; the tagged call passes');
  const none = lintT11(text, uses({ 'web/js/stop.js': "const W = 'trail.walk_on';" }));
  assert.deepEqual(none.issues.map((i) => i.msg), ['trail.a is defined and never used', 'trail.b1 is defined and never used'], 'without the content, its lines are unused');
});

test('content refs: T13 holds their lines to no {variables} (the engine passes none yet), and T10 finds words where a schema wants an "@id"', () => {
  const text = fakeText({ lines: { 'trail.a': { text: 'At {place}', screen: 'trail' }, 'trail.b': { text: 'Plain', screen: 'trail' } } });
  const u = uses({});
  u.content = [{ id: 'trail.a', file: 'content/stops/s.json', line: 3 }, { id: 'trail.b', file: 'content/stops/s.json', line: 4 }];
  assert.deepEqual(lintT13(text, u).map((i) => `${i.file}:${i.line} ${i.msg}`), ['content/stops/s.json:3 trail.a: content refers to it, and knows no {place}']);
  // The real stops schema: box and label are "@id"s through $ref and oneOf.
  const schema = readSchemas(ROOT)['stops.schema.json'];
  const stops = (box, label = '@fx.go') => ({ id: 'fx', screen: 'fx', phase: 'trailhead', first: 'a', stops: [{ id: 'a', box, choices: [{ id: 'go', label, then: 'a' }] }] });
  const t10 = (data) => lintTextFields('content/stops/fx.json', data, schema, `${JSON.stringify(data, null, 1)}\n`).map((i) => `${i.line} ${i.msg}`);
  assert.deepEqual(t10(stops('@fx.a')), []);
  assert.deepEqual(t10(stops(['@fx.a', '@fx.b'])), []);
  assert.deepEqual(t10(stops([['@fx.a'], ['@fx.b1', '@fx.b2']])), []);
  assert.deepEqual(t10(stops('The road ends here.')), ['9 stops[0].box is text: give it as "@<id>"']);
  assert.deepEqual(t10(stops(['@fx.a', 'You smell moss.'])), ['11 stops[0].box[1] is text: give it as "@<id>"']);
  assert.deepEqual(t10(stops('@fx.a', 'Go on')), ['13 stops[0].choices[0].label is text: give it as "@<id>"']);
  // The repo's content passes, and so does every content file it has.
  assert.deepEqual(lintContentText(ROOT), []);
  assert.ok(contentFiles(ROOT).some((f) => f.file === 'content/stops/sol_duc_trailhead.json'));
  assert.ok(!contentFiles(ROOT).some((f) => f.file.startsWith('content/text/') || f.file.startsWith('content/art/')));
});

test('T12: the ledger matches the answers', () => {
  const answers = {
    B010: { batch: 'B010', lines: { 'app.a': { hash: entry('Alpha').seen, verdict: 'approve', text: 'Alpha' }, 'app.b': { hash: 'aaaaaaaa', verdict: 'rewrite', text: 'Beta two' }, 'app.c': { hash: entry('Gamma').seen, verdict: 'approve', text: null } } },
  };
  const good = fakeText({
    lines: { 'app.a': 'Alpha', 'app.b': 'Beta two', 'app.c': 'Gamma' },
    approved: { 'app.a': { ...entry('Alpha', 'B010', 1) }, 'app.b': { ...entry('Beta two', 'B010', 2), seen: 'aaaaaaaa' } },
    answers,
  });
  const ok = lintT12(good);
  assert.deepEqual(ok.map((i) => [i.level, i.msg]), [['warn', 'B010 app.c: answered but not applied: run npm run text:apply -- B010']]);
  const bad = fakeText({
    lines: { 'app.a': 'Alpha', 'app.b': 'Beta three', 'app.d': 'Delta', 'app.e': 'Epsilon', 'app.f': 'Phi' },
    approved: {
      'app.a': { ...entry('Alpha', 'B010', 1), seen: '12345678' },
      'app.b': { ...entry('Beta three', 'B010', 2), seen: 'aaaaaaaa' },
      'app.d': entry('Delta', 'B011', 1),
      'app.e': entry('Epsilon', 'B010', 1),
      'app.f': { ...entry('Phi', 'B010', 1), sha256: '0'.repeat(64) },
    },
    answers,
  });
  const msgs = lintT12(bad).filter((i) => i.level !== 'warn').map((i) => i.msg);
  assert.ok(msgs.includes('app.a: seen 12345678, but B010 answered ' + entry('Alpha').seen), 'a wrong seen');
  assert.ok(msgs.includes("app.b: the words aren't B010's rewrite"), 'a rewrite whose answer differs');
  assert.ok(msgs.includes('app.d: no content/text/review/B011.answers.json'), 'no answers file');
  assert.ok(msgs.includes('app.e: B010 has no answer for it'), 'no answer for the id');
  assert.ok(msgs.includes("app.f: the entry's sha256 isn't the hash of its words"), 'a bad sha256');
});

test('T13: variables match their calls; placeholders stay where allowed', () => {
  const text = fakeText({
    lines: { 'app.one': 'Day {day} of {days}', 'app.plural': { one: '{n} night', other: '{n} nights' }, 'app.boy': 'Hi {BOY_1}', 'app.odd': 'Hi {Foo} and {1}', 'app.fill': 'Built {build} on {date}', 'app.half': 'a } b' },
  });
  const issues = lintT13(
    text,
    uses({
      'web/js/a.js': "t('app.one', { day });\nt('app.one', { day, days, extra });\nt('app.plural', { n });\nt('app.plural');\nt('app.one', { ...o });\n",
      'web/index.html': '<html><body><p data-t="app.fill"></p></body></html>',
    }),
  );
  const msgs = issues.map((i) => `${i.file}:${i.line} ${i.msg}`);
  assert.deepEqual(msgs, [
    'content/text/en/app.json:1 app.boy: {BOY_1} is a placeholder, and content/text/en/app.json may not hold one',
    'content/text/en/app.json:1 app.odd: {Foo} is neither a {variable} nor a known {PLACEHOLDER}',
    'content/text/en/app.json:1 app.odd: {1} is neither a {variable} nor a known {PLACEHOLDER}',
    'content/text/en/app.json:1 app.half: a brace with no partner',
    "web/js/a.js:1 t('app.one') passes {day}, but the line has {day, days}",
    "web/js/a.js:2 t('app.one') passes {day, days, extra}, but the line has {day, days}",
    "web/js/a.js:4 t('app.plural') passes {}, but the line has {n}",
    'web/index.html:1 app.fill: the build fills it, and knows no {date} (only {build})',
  ]);
});

test('T14: the main gate, listed by screen', () => {
  const lines = { 'app.ok': 'Fine', 'title.begin': { text: 'Begin', screen: 'title' }, 'app.dev': { text: 'Dev', class: 'dev' }, 'debug.dev': { text: 'Dev', class: 'dev', screen: 'debug' } };
  const open = fakeText({ lines, approved: { 'app.ok': 'Fine' }, off: { 'app.dev': 'x' } });
  const r = lintT14(open, ['app.ok', 'title.begin', 'debug.dev']);
  assert.deepEqual(r.issues.map((i) => i.id), ['title.begin']);
  assert.match(r.issues[0].msg, /title\.begin is draft on screen title, and main reaches it/);
  assert.equal(gateSummary(open, ['title.begin']), 'T14 main gate: 1 line not approved | title: title.begin (draft)');
  const closed = fakeText({ lines, approved: { 'app.ok': 'Fine' }, off: { 'title.begin': 'not yet', 'app.dev': 'x' } });
  assert.deepEqual(lintT14(closed, ['app.ok', 'debug.dev']).issues, [], 'the same draft in main.off passes');
  assert.deepEqual(lintT14(open, ['app.dev']).issues.map((i) => i.msg), ['main gate: dev line app.dev is on screen app; dev words reach main only on the debug screen']);
  const ghost = fakeText({ lines, approved: { 'app.ok': 'Fine', 'app.dev': 'Dev' }, off: { 'app.nope': 'x', 'title.begin': 'x' } });
  assert.deepEqual(lintT14(ghost, []).issues.map((i) => i.msg), ["main.off names app.nope, which isn't defined"]);
  const back = fakeText({ lines: { 'app.ok': 'Fine' }, approved: { 'app.ok': 'Fine' }, off: { 'app.ok': 'x' } });
  assert.deepEqual(lintT14(back, []).infos, ['app.ok: approved: can come back on main (content/scope/m1a.json main.off)']);
});

test("T14's check of main's built words catches a planted line and a draft manifest", () => {
  const text = readText(ROOT);
  const reach = ['app.name', 'app.short_name', 'app.description', 'app.build'];
  const manifest = JSON.stringify({ name: 'Olympic Peninsula Hiker', short_name: 'OP Hiker', description: 'A backpacking adventure' });
  const words = { 'app.name': 'Olympic Peninsula Hiker', 'app.build': '{build}' };
  const html = (body) => `<!doctype html><html><head><title>Olympic Peninsula Hiker</title></head><body>${body}<span>b1</span></body></html>`;
  assert.deepEqual(checkMainBuild({ html: html(''), manifest, words, text, build: 'b1', reach }), []);
  const planted = checkMainBuild({ html: html('<p>Hello</p>'), manifest, words, text, build: 'b1', reach });
  assert.deepEqual(planted.map((i) => i.msg), ['main\'s page shows "Hello" (text), which isn\'t approved words']);
  const draft = JSON.stringify({ name: 'Olympic Peninsula Hiker', short_name: 'OP Hiker', description: 'A backpacking game set in Olympic National Park.' });
  assert.deepEqual(codes(checkMainBuild({ html: html(''), manifest: draft, words, text, build: 'b1', reach })), ['T14']);
  assert.deepEqual(codes(checkMainBuild({ html: html('<p aria-label="My book"></p>'), manifest, words, text, build: 'b1', reach })), ['T14', 'T07'], 'and T07 runs over the same strings');
  const head = (meta, body) => `<!doctype html><html><head><title>Olympic Peninsula Hiker</title>${meta}</head><body>${body}<span>b1</span></body></html>`;
  const unseen = checkMainBuild({ html: head('<meta property="og:description" content="A picture-book hiking trip">', '<input class="box choice" type="button" value="Start trip">'), manifest, words, text, build: 'b1', reach });
  assert.deepEqual(
    unseen.map((i) => `${i.code} ${i.msg}`),
    [
      'T14 main\'s page shows "A picture-book hiking trip" (meta og:description), which isn\'t approved words',
      'T14 main\'s page shows "Start trip" (value), which isn\'t approved words',
      'T07 main ships the book word "picture-book" in "A picture-book hiking trip" (F.3)',
    ],
    "a link preview's meta and a button's value are words main shows",
  );
  const leaky = { ...words, 'title.tagline': 'a picture-book trip' };
  assert.deepEqual(codes(checkMainBuild({ html: html(''), manifest, words: leaky, text, build: 'b1', reach })), ['T14', 'T07'], "a draft in main's bundle");
});

test('the repo passes the text lints, with only the three T07 warnings', () => {
  const { issues } = runTextLint(ROOT, { main: true });
  assert.deepEqual(
    issues.map((i) => `${i.level} ${i.code} ${i.id || ''}`),
    ['warn T07 title.tagline', 'warn T07 title.start_label', 'warn T07 title.begin'],
  );
});
