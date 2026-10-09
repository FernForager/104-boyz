// The words each channel ships (BUILD_PLAN 6.6; GAME_DESIGN 18.11): main's
// page carries no English but the approved name and B001's lines; preview
// carries Session 1's words, marked as drafts.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from '../../tools/build.mjs';
import { readText, pageStrings, checkMainBuild, mainReach, shellSources } from '../../tools/text.mjs';
import { parseHtml, walk, getAttr } from '../../tools/html.mjs';
import { ROOT } from '../../tools/pics.mjs';

const tmp = mkdtempSync(join(tmpdir(), 'oph-words-'));
const built = {};
for (const channel of ['main', 'preview']) {
  const out = join(tmp, channel);
  const { info } = build({ out, channel, quiet: true });
  const read = (f) => readFileSync(join(out, f), 'utf8');
  built[channel] = { id: info.id, html: read('index.html'), manifest: read('manifest.webmanifest'), words: JSON.parse(read('text/en.json')), read };
}
test.after(() => rmSync(tmp, { recursive: true, force: true }));

/** Main's English, in document order (SPEC A.11; the head's metas come before <title>). */
const mainGolden = (id) => [
  ['meta apple-mobile-web-app-title', 'OP Hiker'],
  ['meta description', 'A backpacking adventure'],
  ['text', 'Olympic Peninsula Hiker'],
  ['text', 'Olympic Peninsula'],
  ['text', 'Hiker'],
  ['aria-label', 'Olympic Peninsula Hiker'],
  ['text', 'A new version is ready.'],
  ['text', 'Restart'],
  ['text', 'Tap Share, then Add to Home Screen.'],
  ['text', 'The Home Screen app keeps its own saves.'],
  ['text', 'Works offline'],
  ['text', id],
  ['text', 'Best held upright'],
  ['text', 'Something snagged.'],
  ['text', 'Copy bug report'],
  ['text', 'Restart'],
];

test("main's page carries no English but the approved name and B001's lines", () => {
  const { html, id } = built.main;
  assert.deepEqual(pageStrings(html).map((s) => [s.where, s.s]), mainGolden(id));
  assert.ok(!/tagline|choice-label|choice-note|role="img"/.test(html), 'no tagline, no Begin button, no alt text');
  assert.match(html, /<canvas class="picture" id="cover" width="160" height="320" data-t-img="alt\.cover_high_divide_dusk" aria-hidden="true"><\/canvas>/, 'the cover is decoration');
  assert.ok(!html.includes('data-t-state'), 'main has nothing to mark');
});

test("main's manifest and bundle hold approved words only, and pass the gate", () => {
  const { html, manifest, words, id } = built.main;
  const m = JSON.parse(manifest);
  assert.deepEqual([m.name, m.short_name, m.description], ['Olympic Peninsula Hiker', 'OP Hiker', 'A backpacking adventure']);
  assert.deepEqual([m.id, m.start_url, m.scope], ['./', './', './']);
  assert.equal(JSON.parse(built.preview.manifest).id, '/preview/', "preview's own app id (main's ./ resolves to the origin's root)");
  // The debug menu's dev words ride along for the debug screen (decision 64),
  // the self-check's three with them (S3); its marks control is preview's alone.
  assert.deepEqual(Object.keys(words), [
    'app.build',
    'app.description',
    'app.error.copy',
    'app.error.line',
    'app.error.reopen',
    'app.install',
    'app.name',
    'app.offline',
    'app.preview_name',
    'app.short_name',
    'app.update',
    'app.update.restart',
    'app.upright',
    'dev.check.differs',
    'dev.check.match',
    'dev.check.running',
    'dev.close',
    'dev.note',
    'dev.throw',
  ]);
  assert.equal(words['app.build'], '{build}');
  const text = readText(ROOT);
  const src = shellSources(ROOT);
  const reach = mainReach(text, src.html, src.manifest);
  assert.deepEqual(checkMainBuild({ html, manifest, words, text, build: id, reach }), []);
});

test('preview carries the working words, Session 1 marked as drafts', () => {
  const { html, manifest, read, id } = built.preview;
  const strings = pageStrings(html).map((s) => [s.where, s.s]);
  const expected = [
    ['meta apple-mobile-web-app-title', 'OP Preview'],
    ['meta description', 'A backpacking adventure'],
    ['text', 'Olympic Peninsula Hiker'],
    ['aria-label', 'The High Divide at dusk. Across the Hoh valley, Mount Olympus glows pink in the last light, under the first stars. A hiker in a rust jacket walks the crest trail among subalpine firs and pink heather.'],
    ['text', 'Olympic Peninsula'],
    ['text', 'Hiker'],
    ['text', 'a picture-book trip'],
    ['aria-label', 'Bookshelf'],
    ['text', 'Begin a new book'],
    ['text', 'The trail opens soon.'],
    ...mainGolden(id).slice(6),
  ];
  assert.deepEqual(strings, expected);
  const marked = [];
  walk(parseHtml(html), (n) => {
    if (n.type === 'element' && getAttr(n, 'data-t-state')) marked.push([getAttr(n, 'data-t'), getAttr(n, 'data-t-state')]);
  });
  assert.deepEqual(marked, [
    ['title.tagline', 'draft'],
    ['title.begin', 'draft'],
    ['title.begin_note', 'draft'],
  ]);
  const m = JSON.parse(manifest);
  assert.deepEqual([m.name, m.short_name, m.description], ['OP Preview', 'OP Preview', 'A backpacking adventure']);
  const words = JSON.parse(read('text/en.json'));
  assert.equal(Object.keys(words).length, 36);
  assert.deepEqual(JSON.parse(read('text/marks.json')), {
    'alt.cover_high_divide_dusk': 'draft',
    'first.guestbook.one_life': 'draft',
    'first.guestbook.prompt': 'draft',
    'first.guestbook.sign': 'draft',
    'title.begin': 'draft',
    'title.begin_note': 'draft',
    'title.start_label': 'draft',
    'title.tagline': 'draft',
    'trail.sol_duc_trailhead.lot': 'draft',
    'trail.sol_duc_trailhead.trail_mouth': 'draft',
    'trail.walk_on': 'draft',
  });
});

test('no phone links, and both pages carry the format-detection meta', () => {
  for (const channel of ['main', 'preview']) {
    const { html } = built[channel];
    assert.ok(!/tel:/i.test(html), `${channel}: no tel:`);
    assert.match(html, /<meta name="format-detection" content="telephone=no">/, `${channel}: format-detection`);
  }
});
