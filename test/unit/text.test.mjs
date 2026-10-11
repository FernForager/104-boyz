import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import {
  readText,
  stateOf,
  wordsFor,
  fnv1a,
  wordsHash,
  hasWords,
  applyBatch,
  countText,
  formatCount,
  wordCount,
  fillPage,
  makeManifest,
  bundle,
  json1,
  CLASSES,
  ID_RE,
  readNames,
  nameOf,
  hasId,
  checkMainBuild,
  SHIPPABLE,
} from '../../tools/text.mjs';
import { runTextLint } from '../../tools/textlint.mjs';
import { renderParts, setBundle, tx, t, lineState, setMarks } from '../../web/js/text.js';
import { fakeText, entry, page, bodyOf, fakeDocument } from './textfix.mjs';

const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');

/** B001's drafts as sent (content/text/review/B001.md), with their hashes. */
const B001_SENT = {
  'app.description': ['A backpacking game set in Olympic National Park.', '05128d7c'],
  'app.install': ['Before your first trip, tap Share, then Add to Home Screen. The Home Screen app keeps its own saves.', '8f70cb99'],
  'app.upright': ['Best held upright.', '717b8de7'],
  'app.offline': ['Works offline', 'bc3af3b2'],
  'app.update': ['An update has arrived. Open it?', 'daef6bfe'],
  'app.error.line': ['Something snagged.', '60ddbe8a'],
  'app.error.copy': ['Copy bug report', 'b3cfbd20'],
  'app.error.reopen': ['Reopen', 'b41fb578'],
  'app.preview_name': ['OP Preview', 'd7264112'],
  'app.build': ['20261009-565079f', 'd44beb90'],
  'app.update.restart': ['Restart', '2f44ed8c'],
};
const B000_WORDS = {
  'app.name': ['Olympic Peninsula Hiker', 'a3e3c244'],
  'app.short_name': ['OP Hiker', '4f8c12d9'],
  'credits.people': ['A work of fiction. Real people appear with permission.', '8681d2ef'],
  'credits.park_service': ['Not affiliated with the National Park Service.', '421fe49b'],
};
/** The 14 approved lines (the task's list), word for word. */
const APPROVED = {
  'app.name': 'Olympic Peninsula Hiker',
  'app.short_name': 'OP Hiker',
  'credits.people': 'A work of fiction. Real people appear with permission.',
  'credits.park_service': 'Not affiliated with the National Park Service.',
  'app.description': 'A backpacking adventure',
  'app.install': 'Tap Share, then Add to Home Screen.\nThe Home Screen app keeps its own saves.',
  'app.upright': 'Best held upright',
  'app.offline': 'Works offline',
  'app.update': 'A new version is ready.',
  'app.update.restart': 'Restart',
  'app.error.line': 'Something snagged.',
  'app.error.copy': 'Copy bug report',
  'app.error.reopen': 'Restart',
  'app.preview_name': 'OP Preview',
};

test('every line file reads cleanly: good ids, in their area, complete', () => {
  const text = readText(ROOT);
  assert.deepEqual(text.problems, []);
  // S7: the cabin's own file, en/home.json.
  assert.deepEqual(text.files, ['content/text/en/alt.json', 'content/text/en/app.json', 'content/text/en/credits.json', 'content/text/en/dev.json', 'content/text/en/first.json', 'content/text/en/fmt.json', 'content/text/en/home.json', 'content/text/en/look.json', 'content/text/en/title.json', 'content/text/en/trail.json']);
  for (const [id, l] of text.lines) {
    assert.match(id, ID_RE);
    assert.equal(l.file, `content/text/en/${id.split('.')[0]}.json`);
    assert.ok(CLASSES.includes(l.class), `${id}: class ${l.class}`);
    assert.ok(l.ctx && l.screen, `${id} has a ctx and a screen`);
    if (l.class === 'ours') assert.ok(Number.isInteger(l.max), `${id} has a max`);
  }
});

test('readText refuses a duplicate id, a line outside its area, a bad id and a missing field', (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-text-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  cpSync(join(ROOT, 'content'), join(tmp, 'content'), { recursive: true });
  writeFileSync(join(tmp, 'content', 'text', 'en', 'zz.json'), json1({ 'zz.ok': { text: 'x', ctx: 'c', screen: 'app', max: 9 }, 'app.name': { text: 'x', ctx: 'c', screen: 'app', max: 9 }, 'zz.Bad': { text: 'x', ctx: 'c', screen: 'app', max: 9 }, 'zz.nomax': { text: 'x', ctx: 'c', screen: 'app' }, 'zz.noctx': { text: 'x', screen: 'app', max: 9 } }));
  const { problems } = readText(tmp, { strict: false });
  const msgs = problems.map((p) => p.msg).join('\n');
  assert.match(msgs, /app\.name: belongs in en\/app\.json/);
  assert.match(msgs, /app\.name: also defined in content\/text\/en\/app\.json/);
  assert.match(msgs, /zz\.Bad: not a good id/);
  assert.match(msgs, /zz\.nomax: needs a max/);
  assert.match(msgs, /zz\.noctx: needs a ctx/);
  assert.throws(() => readText(tmp), /zz\.nomax: needs a max/);
});

test('FNV-1a gives the hashes the creator saw: B001 as sent, and B000', () => {
  for (const [id, [words, hash]] of Object.entries({ ...B001_SENT, ...B000_WORDS })) assert.equal(fnv1a(words), hash, id);
  const answers = JSON.parse(read('content', 'text', 'review', 'B001.answers.json'));
  for (const [id, a] of Object.entries(answers.lines)) assert.equal(a.hash, B001_SENT[id][1], `${id} in B001.answers.json`);
  const b000 = JSON.parse(read('content', 'text', 'review', 'B000.answers.json'));
  for (const [id, a] of Object.entries(b000.lines)) assert.equal(a.hash, fnv1a(a.text), `${id} in B000.answers.json`);
});

test('the ledger holds exactly the 14 approved lines, each matching its words and its answer', () => {
  const text = readText(ROOT);
  const ids = Object.keys(text.ledger.lines);
  assert.deepEqual(ids, Object.keys(APPROVED).sort());
  assert.deepEqual(text.ledger.cut, {});
  assert.ok(!ids.includes('app.build'), 'the bare build code has no words to approve');
  const byBatch = { B000: 0, B001: 0 };
  for (const [id, e] of Object.entries(text.ledger.lines)) {
    assert.equal(e.text, APPROVED[id], `${id}: the creator's words`);
    assert.equal(e.sha256, wordsHash(e.text), `${id}: sha256`);
    assert.equal(stateOf(id, text), 'approved', `${id} is approved in the working text`);
    const ans = text.answers.get(e.batch).data.lines[id];
    assert.equal(e.seen, ans.hash, `${id}: seen is the answer's hash`);
    byBatch[e.batch]++;
  }
  assert.deepEqual(byBatch, { B000: 4, B001: 10 });
  assert.match(read('content', 'text', 'approved.json'), /^\{\n "\$comment": "The ledger/);
});

test('apply rebuilds the committed ledger and app.json from the drafts as sent, byte for byte', (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-apply-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  cpSync(join(ROOT, 'content'), join(tmp, 'content'), { recursive: true });
  const appPath = join(tmp, 'content', 'text', 'en', 'app.json');
  const app = JSON.parse(readFileSync(appPath, 'utf8'));
  for (const [id, [words]] of Object.entries(B001_SENT)) if (id !== 'app.build') app[id].text = words;
  writeFileSync(appPath, json1(app));
  rmSync(join(tmp, 'content', 'text', 'approved.json'));
  const a = applyBatch(tmp, 'B000');
  assert.deepEqual(a.errors, []);
  assert.deepEqual(a.results.map((r) => r.result), ['approved', 'approved', 'approved', 'approved']);
  const b = applyBatch(tmp, 'B001');
  assert.deepEqual(b.errors, []);
  assert.deepEqual(
    Object.fromEntries(b.results.map((r) => [r.id, r.result])),
    {
      'app.description': 'rewritten and approved',
      'app.install': 'rewritten and approved',
      'app.upright': 'rewritten and approved',
      'app.offline': 'approved',
      'app.update': 'rewritten and approved',
      'app.error.line': 'approved',
      'app.error.copy': 'approved',
      'app.error.reopen': 'rewritten and approved',
      'app.preview_name': 'approved',
      'app.build': 'no words',
      'app.update.restart': 'approved',
    },
  );
  assert.equal(readFileSync(join(tmp, 'content', 'text', 'approved.json'), 'utf8'), read('content', 'text', 'approved.json'));
  assert.equal(readFileSync(appPath, 'utf8'), read('content', 'text', 'en', 'app.json'));
  const again = applyBatch(tmp, 'B001');
  assert.deepEqual(again.wrote, [], 'a second apply writes nothing');
  assert.ok(again.results.every((r) => ['already applied', 'no words'].includes(r.result)));
});

test('apply refuses what it should, and writes nothing on an error', (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-refuse-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  cpSync(join(ROOT, 'content'), join(tmp, 'content'), { recursive: true });
  const ledgerBefore = readFileSync(join(tmp, 'content', 'text', 'approved.json'), 'utf8');
  const review = (b, lines) => writeFileSync(join(tmp, 'content', 'text', 'review', `${b}.answers.json`), json1({ batch: b, answered: '2026-11-01', via: 'test', lines }));
  const tagline = 'a picture-book trip';
  review('B090', {
    'title.tagline': { hash: fnv1a('a picture-book walk'), verdict: 'approve', text: null },
    'title.begin': { hash: fnv1a('Begin a new book'), verdict: 'later' },
    'title.begin_note': { hash: fnv1a('The trail opens soon.'), verdict: 'note', note: 'too flat' },
    'app.build': { hash: '00000000', verdict: 'looks_fine', text: null },
  });
  const r = applyBatch(tmp, 'B090');
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.results.map((x) => x.result), ['stays a draft (changed since B090: not approved; goes in the next batch)', 'stays a draft (later)', 'stays a draft (note: too flat)', 'no words']);
  assert.deepEqual(r.wrote, []);
  assert.equal(readFileSync(join(tmp, 'content', 'text', 'approved.json'), 'utf8'), ledgerBefore);
  review('B091', { 'title.tagline': { hash: fnv1a(tagline), verdict: 'approve', text: null }, 'title.nope': { hash: '00000000', verdict: 'approve' } });
  const u = applyBatch(tmp, 'B091');
  assert.match(u.errors.join('\n'), /title\.nope isn't defined/);
  assert.deepEqual(u.wrote, []);
  review('B092', { 'title.tagline': { hash: fnv1a(tagline), verdict: 'maybe' } });
  assert.match(applyBatch(tmp, 'B092').errors.join('\n'), /unknown verdict "maybe"/);
  assert.match(applyBatch(tmp, 'B093').errors.join('\n'), /no content\/text\/review\/B093\.answers\.json/);
  assert.equal(readFileSync(join(tmp, 'content', 'text', 'approved.json'), 'utf8'), ledgerBefore, 'nothing was written');
  // A cut, then the same answers again.
  review('B094', { 'title.tagline': { hash: fnv1a(tagline), verdict: 'cut' } });
  assert.deepEqual(applyBatch(tmp, 'B094').results.map((x) => x.result), ['cut']);
  assert.equal(stateOf('title.tagline', readText(tmp)), 'cut');
  assert.deepEqual(applyBatch(tmp, 'B094').results.map((x) => x.result), ['already applied']);
});

test('a later batch supersedes an earlier answer, even one rewritten back to the words it saw', (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-revert-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  cpSync(join(ROOT, 'content'), join(tmp, 'content'), { recursive: true });
  const appPath = join(tmp, 'content', 'text', 'en', 'app.json');
  const app = JSON.parse(readFileSync(appPath, 'utf8'));
  // B001 approved "Restart"; a session edits it, B002 sends the edit, and the creator rewrites it back.
  app['app.update.restart'].text = 'Restart now';
  writeFileSync(appPath, json1(app));
  writeFileSync(join(tmp, 'content', 'text', 'review', 'B002.answers.json'), json1({ batch: 'B002', answered: '2026-11-01', via: 'test', lines: { 'app.update.restart': { hash: fnv1a('Restart now'), verdict: 'rewrite', text: 'Restart' } } }));
  assert.deepEqual(applyBatch(tmp, 'B002').results.map((r) => r.result), ['rewritten and approved']);
  const text = readText(tmp);
  assert.equal(stateOf('app.update.restart', text), 'approved');
  assert.deepEqual(runTextLint(tmp).issues.filter((i) => i.code === 'T12'), [], "B001's answer isn't 'answered but not applied'");
  assert.deepEqual(countText(text, { html: read('web', 'index.html'), manifest: read('web', 'manifest.webmanifest') }).unapplied, []);
  const again = applyBatch(tmp, 'B001');
  assert.equal(again.results.find((r) => r.id === 'app.update.restart').result, 'superseded (a later batch answered it)');
  assert.deepEqual(again.wrote, [], "B001 can't take back B002's entry");
  assert.equal(readText(tmp).ledger.lines['app.update.restart'].batch, 'B002');
});

test('states: approved, changed (main keeps the frozen words), cut, draft, no words, dev', () => {
  const text = fakeText({
    lines: { 'app.a': 'Hello there', 'app.b': 'New words', 'app.c': 'Vetoed words', 'app.d': 'A draft', 'app.e': '{build}', 'app.f': { text: 'Debug', class: 'dev', screen: 'debug' } },
    approved: { 'app.a': 'Hello there', 'app.b': 'Old words' },
    cut: { 'app.c': [entry('Vetoed words')] },
  });
  assert.deepEqual(
    [...text.lines.keys()].map((id) => stateOf(id, text)),
    ['approved', 'changed', 'cut', 'draft', 'nowords', 'dev'],
  );
  assert.equal(stateOf('app.zz', text), 'missing');
  const main = wordsFor(text, 'main');
  assert.deepEqual(main, { 'app.a': 'Hello there', 'app.b': 'Old words', 'app.e': '{build}', 'app.f': 'Debug' }, 'main: the ledger, never a draft or a cut line');
  const preview = wordsFor(text, 'preview');
  assert.equal(preview['app.b'], 'New words', 'preview shows the edit');
  assert.equal(preview['app.c'], '', 'cut words ship empty on preview');
  assert.equal(preview['app.d'], 'A draft');
  assert.equal(hasWords('{build}'), false);
  assert.equal(hasWords({ one: '{n} night', other: '{n} nights' }), true);
  assert.equal(hasWords('— {n} —'), false);
});

test('B003, filed not sent, holds the guest book and every lockbox draft once, in order, each hash its draft as filed (S3, S4, S7), the quiz pool marked as one set', () => {
  // Re-pinned in S7: S7 files eight more (the lockbox's own six, the guest book's label and Suggest) as 54 to 61.
  const md = read('content', 'text', 'review', 'B003.md');
  const rows = [...md.matchAll(/^\| (\d+) \| `([^`]+)` \| ([0-9a-f]{8}) \| (.+) \| (none|[^|]+) \| ([^|]+) \|$/gm)].map((m) => ({ n: Number(m[1]), id: m[2], hash: m[3], where: m[4], live: m[5], draft: m[6] }));
  const first = JSON.parse(read('content', 'text', 'en', 'first.json'));
  const lockbox = Object.keys(first).filter((k) => k.startsWith('first.lockbox.'));
  const S7 = ['first.lockbox.start', 'first.lockbox.intro', 'first.lockbox.count', 'first.lockbox.all_right', 'first.lockbox.come_in', 'first.lockbox.take_key', 'first.guestbook.label', 'first.guestbook.suggest'];
  const pool = lockbox.filter((k) => !S7.includes(k));
  assert.equal(pool.length, 50);
  assert.deepEqual(rows.map((r) => r.n), Array.from({ length: 61 }, (_, i) => i + 1), 'lines 1 to 61');
  assert.deepEqual(rows.map((r) => r.id), ['first.guestbook.prompt', 'first.guestbook.one_life', 'first.guestbook.sign', ...pool, ...S7], "in first.json's order, S7's after");
  assert.match(md, /\*\*Lines 4 to 53 are one set: the lockbox's quiz pool\.\*\*/, 'the quiz pool, read and answered as one set (Lead call 46)');
  for (const r of rows) {
    assert.equal(r.hash, fnv1a(r.draft), `${r.id}: the hash is the draft's`);
    assert.equal(r.draft, first[r.id].text, `${r.id}: filed as drafted`);
    assert.equal(r.live, 'none', `${r.id}: nothing live`);
    assert.match(r.where, new RegExp(`\\(max ${first[r.id].max}\\)$`), `${r.id}: its max`);
  }
  // Every right answer is marked, and only those: the quiz file's own.
  const quiz = JSON.parse(read('content', 'quiz', 'locals.json'));
  const right = new Set(quiz.questions.map((q) => q.answers[q.right].slice(1)));
  for (const r of rows.filter((x) => /\.a\d$/.test(x.id))) assert.equal(r.where.includes('**the right one**'), right.has(r.id), r.id);
  assert.match(md, /\*\*Not sent:\*\* it goes out with B002 on the review page/);
  // The not-ours tail names every place and term the lines carry, and S7's given names (lead call 64).
  const tail = md.slice(md.indexOf('Not ours'));
  for (const name of ['Sequim', 'Hoh', 'Puyallup', 'Rainier', 'Dosewallips', 'Olympic', 'the Queets', 'the Elwha', 'Canada jay', 'geoduck', 'Avery', 'Robin', 'Taylor']) assert.ok(tail.includes(`*${name}*`), name);
});

test('count: where things stand', () => {
  const text = readText(ROOT);
  const lint = runTextLint(ROOT);
  const t07 = lint.issues.filter((i) => i.code === 'T07' && i.level === 'warn').map((i) => i.id).sort();
  const c = countText(text, { t07 });
  // S3 adds six drafts (the guest book's three, the trail's three) and the
  // self-check's three dev lines (BUILD_PLAN S3; SPEC D19). S4 (track B)
  // adds the lockbox quiz's 50 drafts, waiting for S7's lockbox screen; S4
  // (track C) adds dev.map, the menu's way to the pencil map, preview only.
  // S5 (track A) adds the trail frame's 11 drafts (the sample stops at Deer
  // Lake and the rim, the caption, the status line, the toolbar, the strip,
  // the (i) square) and 11 dev lines (the hour and text controls, Scenes),
  // all preview only. S5 (track C) adds the sound's two dev lines (Render
  // 10 s of this scene and its result line), preview only. S5 (track D)
  // adds the line inspector's three dev lines, preview only. S5's fixes
  // make the strip's mile and the caption's feet two number formats
  // (content/text/en/fmt.json, E.12), retiring trail.strip.mile: one more.
  // S6 (track B) adds the sample fork's 56: B004's 17 (Next and the fork's
  // 16), B005's 35 (the odds, the Why sheet, the outcome and four number
  // formats), and four with no words to approve (a percentage, a share under
  // the least shown, the diamond's fail share and the confirm's question).
  // S6 (track C) adds 29: B006's 28 (the Looks in a new file, en/look.json,
  // their buttons' names and group, the alt text's nine parts) and B005's
  // ▾ (trail.box.more), all preview only. S6's review adds the #frame check
  // view's two fixture names (dev.fixture.three and .four), preview only.
  // S7 (track B) adds the cabin's 28 new drafts (B002: en/home.json's 15,
  // the tub's and the register post's Looks and names, the cabin's nine alt
  // parts) and seven dev lines (the hour's dawn, the sky control and its
  // five), preview only. S7 (track C) adds B003's eight (the lockbox's own
  // six, the guest book's label and Suggest), preview only.
  assert.equal(c.lines, 245);
  assert.equal(c.files, 10);
  assert.deepEqual(c.ours, { total: 209, approved: 14, draft: 190, changed: 0, cut: 0, nowords: 5 });
  assert.equal(c.dev, 36);
  // The 13 app lines, and the debug menu's six dev lines main keeps
  // (dev.note, dev.close, dev.throw and the three dev.check lines; the marks
  // are preview's alone, and so are dev.map, S4, and S5's hour, text, Scenes
  // and the sound's render).
  assert.equal(c.main.reach.length, 19);
  assert.deepEqual(c.main.screens, ['app', 'debug', 'title']);
  assert.deepEqual(c.main.needs, []);
  assert.equal(c.main.off.length, 35, "S6's review: the check view's two fixture names are off main too; S7: the seven new dev lines");
  assert.deepEqual(c.t07, [], 'S7: no preview page shows a book word (the title page retired there)');
  assert.deepEqual(c.unapplied, []);
  // The words (18.9): the 14 approved lines hold 58, the bare build code none.
  assert.equal(wordCount(APPROVED['app.install']), 15);
  assert.equal(Object.values(APPROVED).reduce((n, w) => n + wordCount(w), 0), 58);
  assert.equal(wordCount('{build}'), 0);
  assert.equal(wordCount({ one: '{n} night left', other: '{n} nights left' }), 4, 'every form of a plural');
  assert.equal(c.words.ours.approved, 58);
  assert.equal(c.words.ours.total, c.words.ours.approved + c.words.ours.draft + c.words.ours.changed + c.words.ours.cut);
  assert.ok(c.words.ours.draft > 0 && c.words.dev > 0);
  const out = formatCount(c);
  assert.match(out, /^text: 245 lines in 10 files\n {2}ours {2}209: approved 14, draft 190, changed 0, cut 0, no words 5\n {8}words \d+: approved 58, draft \d+, changed 0, cut 0\n {2}dev {4}36: exempt \(decision 64\); words \d+/);
  assert.match(out, /credits 2 \(approved 2; waiting for its screen\)/);
  assert.match(out, /debug 36 \(dev 36\)/);
  assert.match(out, /main: carries app, debug, title; reaches 19 lines, all shippable; needs 0; off main 35/);
  assert.match(out, /answers not yet applied: none$/);
});

const SAMPLE = {
  'app.name': 'Olympic Peninsula Hiker',
  'app.amp': 'Salt & <pepper> "quoted"',
  'app.em': 'A *big* day',
  'app.two': 'One line.\nTwo lines.',
  'app.build': '{build}',
  'app.ph': 'Hello {BOY_1}',
  'app.draft': 'Not yet',
  'app.label': 'Shelf label',
  'app.alt': 'A picture',
  'title.off': 'Off main',
};
const sampleText = (extra = {}) =>
  fakeText({
    lines: Object.fromEntries(Object.entries(SAMPLE).map(([id, w]) => [id, id === 'title.off' ? { text: w, screen: 'title' } : w])),
    approved: Object.fromEntries(Object.entries(SAMPLE).filter(([id]) => !['app.draft', 'title.off', 'app.build'].includes(id))),
    off: { 'title.off': 'test', 'app.draft': 'test' },
    swap: { 'app.name': 'app.label' },
    ...extra,
  });

test('the fill: escaping, emphasis, line breaks, the build code, the title split', () => {
  const text = sampleText();
  const body = (html) => bodyOf(fillPage(page(html), { channel: 'main', text, build: '20261009-abcdef0' }));
  assert.equal(body('<p data-t="app.amp"></p>'), '<p data-t="app.amp">Salt &amp; &lt;pepper&gt; "quoted"</p>');
  assert.equal(body('<p data-t="app.em"></p>'), '<p data-t="app.em">A <em>big</em> day</p>');
  assert.equal(body('<p data-t="app.two"></p>'), '<p data-t="app.two">One line.<br>Two lines.</p>');
  assert.equal(body('<span data-t="app.build"></span>'), '<span data-t="app.build">20261009-abcdef0</span>');
  assert.equal(body('<h1 data-t="app.name" data-t-split="title"></h1>'), '<h1 data-t="app.name" data-t-split="title"><span class="title-small">Olympic Peninsula</span> <span class="title-big">Hiker</span></h1>');
  assert.equal(body('<p data-t="app.ph"></p>'), '<p data-t="app.ph">Hello {BOY_1}</p>', 'main shows a placeholder plainly (T13 keeps them out of main)');
  const html = fillPage(page('<p></p>'), { channel: 'main', text, build: 'b1' });
  assert.match(html, /<html lang="en" data-build="b1" data-channel="main" data-commit="dev" data-rules="dev" data-screens="app title">/);
  assert.throws(() => fillPage('<html lang="en"><body></body></html>', { channel: 'main', text, build: 'b1' }), /lost its placeholder \(<html data-build="dev">\)/);
});

test('the fill: attribute chains, pictures, units, missing ids, and the marks', () => {
  const text = sampleText();
  const fill = (html, channel) => bodyOf(fillPage(page(html), { channel, text, build: 'b' }));
  const chain = '<section data-t-attr="aria-label:title.off|app.label"></section>';
  assert.equal(fill(chain, 'main'), '<section data-t-attr="aria-label:title.off|app.label" aria-label="Shelf label"></section>', 'main falls back past an off line');
  assert.equal(fill(chain, 'preview'), '<section data-t-attr="aria-label:title.off|app.label" aria-label="Off main"></section>');
  const leave = '<section data-t-attr="aria-label:title.off|"></section>';
  assert.equal(fill(leave, 'main'), '<section data-t-attr="aria-label:title.off|"></section>', 'an empty end leaves the attribute out');
  assert.equal(fill('<canvas data-t-img="app.alt"></canvas>', 'main'), '<canvas data-t-img="app.alt" role="img" aria-label="A picture"></canvas>');
  assert.equal(fill('<canvas data-t-img="title.off"></canvas>', 'main'), '<canvas data-t-img="title.off" aria-hidden="true"></canvas>', 'off main, a picture is decoration');
  const unit = '<div><button data-t-unit>\n  <span data-t="title.off"></span>\n  <span data-t="app.em"></span>\n</button>\n<p data-t="app.amp"></p></div>';
  assert.equal(fill(unit, 'main'), '<div>\n<p data-t="app.amp">Salt &amp; &lt;pepper&gt; "quoted"</p></div>', 'an off line takes its whole unit off main');
  assert.match(fill(unit, 'preview'), /<span data-t="title\.off" data-t-state="draft">Off main<\/span>/, 'preview keeps it, marked');
  assert.equal(fill('<p data-t="app.draft"></p>', 'preview'), '<p data-t="app.draft" data-t-state="draft">Not yet</p>');
  assert.equal(fill('<p data-t="app.ph"></p>', 'preview'), '<p data-t="app.ph">Hello <span class="t-ph">{BOY_1}</span></p>');
  assert.equal(fill('<p data-t="app.nope"></p>', 'preview'), '<p data-t="app.nope" data-t-state="missing">⟦app.nope⟧</p>');
  assert.throws(() => fill('<p data-t="app.nope"></p>', 'main'), /T11 main uses undefined ids: app\.nope/);
  assert.equal(fill('<title data-t="app.name"></title>', 'preview'), '<title data-t="app.name">Shelf label</title>', "preview's swap");
  const leaky = sampleText({ off: { 'title.off': 'test' } });
  assert.throws(() => bodyOf(fillPage(page('<p data-t="app.draft"></p>'), { channel: 'main', text: leaky, build: 'b' })), /T14 main gate: 1 line not approved \| app: app\.draft \(draft\)/);
});

test('the manifest: main from the ledger, preview under its own name, one app per channel', () => {
  const text = readText(ROOT);
  const src = read('web', 'manifest.webmanifest');
  const main = JSON.parse(makeManifest(src, { channel: 'main', text }));
  assert.equal(main.name, text.ledger.lines['app.name'].text);
  assert.equal(main.short_name, text.ledger.lines['app.short_name'].text);
  assert.equal(main.description, text.ledger.lines['app.description'].text);
  const preview = JSON.parse(makeManifest(src, { channel: 'preview', text }));
  assert.equal(preview.name, 'OP Preview');
  assert.equal(preview.short_name, 'OP Preview');
  for (const m of [main, preview]) {
    assert.equal(m.start_url, './');
    assert.equal(m.scope, './');
  }
  // An id resolves against start_url's origin, not the manifest's URL (W3C
  // appmanifest), so only distinct ids make two apps: main / and preview /preview/.
  const appId = (m, manifestUrl) => new URL(m.id, new URL(m.start_url, manifestUrl).origin).href;
  assert.equal(appId(main, 'https://ophiker.com/manifest.webmanifest'), 'https://ophiker.com/');
  assert.equal(appId(preview, 'https://ophiker.com/preview/manifest.webmanifest'), 'https://ophiker.com/preview/');
  assert.equal(main.id, './', "main keeps its id, so an installed main app stays the same app");
  assert.equal(new URL(preview.start_url, 'https://ophiker.com/preview/manifest.webmanifest').href, appId(preview, 'https://ophiker.com/preview/manifest.webmanifest'), "preview's id is its start_url");
  const draft = fakeText({ lines: { 'app.name': 'X Hiker', 'app.short_name': 'X', 'app.description': 'Words' }, approved: { 'app.name': 'X Hiker', 'app.short_name': 'X' } });
  assert.throws(() => makeManifest(src, { channel: 'main', text: draft }), /description \(app\.description\) has no words to ship on main/);
});

test("the bundles: main's holds what it reaches and nothing else; preview's every line and the marks", () => {
  const text = sampleText();
  const main = bundle(text, 'main', ['app.amp', 'app.build'])['en.json'];
  assert.deepEqual(main, { 'app.amp': 'Salt & <pepper> "quoted"', 'app.build': '{build}' });
  assert.throws(() => bundle(text, 'main', ['app.draft']), /main reaches app\.draft \(draft\)/);
  const p = bundle(text, 'preview', []);
  assert.equal(Object.keys(p['en.json']).length, Object.keys(SAMPLE).length);
  assert.deepEqual(p['marks.json'], { 'app.draft': 'draft', 'title.off': 'draft' });
});

test("parity: the page's tx() renders a line as the build's fill does", () => {
  const text = sampleText();
  const ids = ['app.amp', 'app.em', 'app.two', 'app.build', 'app.ph', 'app.draft'];
  for (const channel of ['main', 'preview']) {
    const words = bundle(text, 'preview', [])['en.json'];
    const marks = channel === 'preview' ? bundle(text, 'preview', [])['marks.json'] : {};
    setBundle(channel === 'main' ? Object.fromEntries(Object.entries(words).filter(([id]) => id !== 'app.draft')) : words, marks, channel);
    const doc = fakeDocument();
    for (const id of ids) {
      if (channel === 'main' && id === 'app.draft') continue;
      const filled = bodyOf(fillPage(page(`<p data-t="${id}"></p>`), { channel, text: id === 'app.draft' ? sampleText({ off: {} }) : text, build: 'b7' }));
      const el = doc.createElement('p');
      tx(el, id, { build: 'b7' });
      const order = ['data-t', 'data-t-state'];
      const attrs = order.filter((k) => el.hasAttribute(k)).map((k) => ` ${k}="${el.getAttribute(k)}"`).join('');
      assert.equal(`<p${attrs}>${el.innerHTML}</p>`, filled, `${channel}: ${id}`);
    }
  }
  setBundle({}, {}, null);
});

test('t(), lineState() and setMarks() on each channel', () => {
  setBundle({ 'app.a': 'A *b*\nc {n}', 'app.p': { one: '{n} night', other: '{n} nights' } }, { 'app.a': 'draft' }, 'preview');
  assert.equal(t('app.a', { n: 3 }), 'A b\nc 3', 'plain words: markup dropped, line breaks kept');
  assert.equal(t('app.p', { n: 1 }), '1 night');
  assert.equal(t('app.p', { n: 2 }), '2 nights');
  assert.equal(t('app.zz'), '⟦app.zz⟧');
  assert.equal(lineState('app.a'), 'draft');
  assert.equal(lineState('app.p'), 'approved');
  assert.equal(lineState('app.zz'), 'missing');
  const doc = fakeDocument();
  assert.equal(setMarks(doc, 'drafts'), true);
  assert.equal(doc.documentElement.getAttribute('data-marks'), 'drafts');
  assert.throws(() => setMarks(doc, 'loud'), /no marks mode/);
  setBundle({ 'app.a': 'A' }, {}, 'main');
  assert.equal(t('app.zz'), '', 'main shows nothing for a missing id');
  assert.equal(lineState('app.zz'), 'approved');
  const quiet = fakeDocument();
  assert.equal(setMarks(quiet, 'on'), false, 'main has no marks');
  assert.equal(quiet.documentElement.getAttribute('data-marks'), null);
  setBundle({}, {}, null);
  assert.deepEqual(renderParts('*a* {x}\n{BOY_2}', { x: '*y*' }), [{ em: 'a' }, { text: ' *y*' }, { br: true }, { ph: '{BOY_2}' }], "a var's value never adds markup");
});

test("a var that is a ref renders as that line's words, one level deep (SPEC D4: the engine gives refs, never words)", () => {
  setBundle({ 'trail.at': 'You reach {place}.', 'place.falls': '*Sol Duc* Falls', 'place.near': 'near {place}', 'trail.n': { one: '{n} mile to {place}', other: '{n} miles to {place}' } }, { 'trail.at': 'draft' }, 'preview');
  assert.equal(t('trail.at', { place: { id: 'place.falls' } }), 'You reach Sol Duc Falls.', 'the inner line in plain words');
  assert.equal(t('trail.n', { n: 2, place: { id: 'place.falls' } }), '2 miles to Sol Duc Falls', 'plurals still pick by n');
  assert.equal(t('trail.at', { place: { id: 'place.near', vars: { place: { id: 'place.falls' } } } }), 'You reach near ⟦place.falls⟧.', 'one level: a ref inside a ref is not followed');
  assert.equal(t('trail.at', { place: { id: 'place.gone' } }), 'You reach ⟦place.gone⟧.', 'a missing inner line shows as missing on preview');
  const doc = fakeDocument();
  const el = doc.createElement('p');
  tx(el, 'trail.at', { place: { id: 'place.falls' } });
  assert.equal(el.outerHTML, '<p data-t="trail.at" data-t-state="draft">You reach Sol Duc Falls.</p>', 'the inner markup never becomes markup');
  setBundle({ 'trail.at': 'You reach {place}.' }, {}, 'main');
  assert.equal(t('trail.at', { place: { id: 'place.gone' } }), 'You reach .', 'main shows nothing for a missing inner line');
  setBundle({}, {}, null);
  assert.deepEqual(renderParts('a {x}', { x: 'b' }), [{ text: 'a b' }], 'renderParts itself is unchanged: the fill keeps parity');
});

test('the ledger only ever comes from apply: no hand-written entry slips past T12', () => {
  assert.ok(existsSync(join(ROOT, 'content', 'text', 'approved.json')));
  const lint = runTextLint(ROOT);
  assert.deepEqual(lint.issues.filter((i) => i.code === 'T12'), []);
});

// ---- The names: the gazetteer and the terms (S4) -------------------------

test('the names are read from content/text/names, as place.<id> and term.<id>, apart from the lines', () => {
  const names = readNames(ROOT);
  assert.deepEqual(names.problems, []);
  assert.equal(names.places.get('place.lunch_lake').text, 'Lunch Lake');
  assert.equal(names.places.get('place.port_angeles').file, 'content/text/names/places_extra.json');
  assert.equal(names.notPlaces.get('place.hidden_lake_junction').why, 'descriptive');
  assert.equal(names.terms.get('term.geoduck').text, 'geoduck');
  const text = readText(ROOT);
  assert.ok(!text.lines.has('place.lunch_lake'), 'names are not lines: they need no approval and no screen');
  assert.ok(hasId(text, 'place.lunch_lake') && hasId(text, 'term.canada_jay') && !hasId(text, 'place.hidden_lake_junction'));
  assert.equal(nameOf(text, 'place.hidden_lake_junction'), null, 'a not_place is no name a screen may show');
});

test("a name's state: place or term, both shippable; cut when the creator vetoed its words", () => {
  const names = { places: { lunch_lake: { text: 'Lunch Lake', kind: 'camp', source: 'https://x.org/' } }, terms: { geoduck: { text: 'geoduck', kind: 'species', source: 'https://x.org/' } } };
  const text = fakeText({ lines: { 'app.a': 'A' }, names });
  assert.deepEqual([stateOf('place.lunch_lake', text), stateOf('term.geoduck', text), stateOf('place.nowhere', text)], ['place', 'term', 'missing']);
  assert.ok(SHIPPABLE.has('place') && SHIPPABLE.has('term'));
  const cut = fakeText({ lines: { 'app.a': 'A' }, names, cut: { 'place.lunch_lake': [entry('Lunch Lake')] } });
  assert.equal(stateOf('place.lunch_lake', cut), 'cut');
  const other = fakeText({ lines: { 'app.a': 'A' }, names, cut: { 'place.lunch_lake': [entry('Lunch Lake!')] } });
  assert.equal(stateOf('place.lunch_lake', other), 'place', 'a cut of other words leaves these alone');
});

test("the bundle carries the places a channel's data names; main's names none; a cut name ships nowhere", () => {
  const names = { places: { lunch_lake: { text: 'Lunch Lake', kind: 'camp', source: 'https://x.org/' }, deer_lake: { text: 'Deer Lake', kind: 'camp', source: 'https://x.org/' } } };
  const text = fakeText({ lines: { 'app.name': 'N', 'app.short_name': 'S' }, approved: { 'app.name': 'N', 'app.short_name': 'S' }, names, cut: { 'place.deer_lake': [entry('Deer Lake')] } });
  const preview = bundle(text, 'preview', [], ['place.lunch_lake', 'place.deer_lake'])['en.json'];
  assert.equal(preview['place.lunch_lake'], 'Lunch Lake');
  assert.ok(!('place.deer_lake' in preview), 'cut');
  assert.throws(() => bundle(text, 'preview', [], ['place.nowhere']), /place\.nowhere is no place or term/);
  const main = bundle(text, 'main', ['app.name'])['en.json'];
  assert.deepEqual(Object.keys(main), ['app.name']);
  // Main's gate takes a place at the gazetteer's words, and refuses other words.
  const issues = (v) => checkMainBuild({ html: page(''), manifest: JSON.stringify({ name: 'N', short_name: 'S', description: 'D' }), words: { 'place.lunch_lake': v }, text, build: 'b', reach: [] }).filter((i) => i.file === 'text/en.json');
  assert.deepEqual(issues('Lunch Lake'), []);
  assert.equal(issues('Lunch Lake!').length, 1);
});

test("the repo: main's built bundle has no place or term; apply takes a cut on a place, and nothing else", (t) => {
  const text = readText(ROOT);
  const reach = countText(text).main.reach;
  assert.ok(!reach.some((id) => /^(place|term)\./.test(id)));
  const tmp = mkdtempSync(join(tmpdir(), 'oph-names-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  cpSync(join(ROOT, 'content'), join(tmp, 'content'), { recursive: true });
  const review = (b, lines) => writeFileSync(join(tmp, 'content', 'text', 'review', `${b}.answers.json`), json1({ batch: b, answered: '2026-11-01', via: 'test', lines }));
  review('B095', { 'place.lunch_lake': { hash: fnv1a('Lunch Lake'), verdict: 'approve' } });
  assert.match(applyBatch(tmp, 'B095').errors.join('\n'), /place\.lunch_lake is a place or a term, not ours: it takes only cut, later or a note/);
  review('B096', { 'place.lunch_lake': { hash: fnv1a('Lunch Lake'), verdict: 'cut' } });
  assert.deepEqual(applyBatch(tmp, 'B096').results.map((x) => x.result), ['cut']);
  assert.equal(stateOf('place.lunch_lake', readText(tmp)), 'cut');
});
