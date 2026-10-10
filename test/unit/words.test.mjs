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
  // S4 (track B) adds the lockbox quiz's 50 drafts (content/text/en/first.json), which wait for S7's screen;
  // S4 (track C) adds the map's 25 place names from the gazetteer (not ours) and dev.map.
  // S5 (track A) adds the trail frame's 11 drafts, its 11 dev lines (hour, text, Scenes)
  // and the one place a caption shows that the map doesn't label: the Seven Lakes Basin.
  // S5 (track C) adds the sound's two dev lines: Render 10 s of this scene, and its result.
  // S5 (track D) adds the line inspector's three dev lines (its line, no batch, Copy for chat).
  // S5's review adds the nine places the #frame check view draws that no stop or map label
  // names (build.mjs viewNames: the composer's drawable places with gazetteer names, not ours).
  // S5's fixes trade the strip's mile line for two number formats (fmt.ft, fmt.mile_marker).
  // S6 (track B) adds the sample fork's 56 lines (B004's 17, B005's 35 and four with no words); the
  // places its Why sheet and pencil rows name (Heart Lake, Lunch Lake) were shipped already, as drawable places.
  // S6 (track C) adds 29: the Looks, their names and group, the alt text's parts (B006) and the ▾'s name.
  // S6's review adds the #frame check view's two fixture names (dev.fixture.three and .four).
  assert.equal(Object.keys(words).length, 237);
  assert.equal(words['dev.inspect.copy'], 'Copy for chat');
  assert.equal(words['dev.audio.render'], 'Render 10 s of this scene');
  assert.equal(words['dev.audio.result'], 'Sound: peak {peak} dBFS · {lufs} LUFS · dsp {dsp}');
  const places = Object.keys(words).filter((k) => k.startsWith('place.'));
  assert.equal(places.length, 35, 'the trailhead and the 24 camps the map labels, the rim\'s basin, and the check view\'s nine');
  assert.equal(words['place.seven_lakes_basin'], 'Seven Lakes Basin');
  assert.deepEqual(
    ['high_divide', 'bogachiel_peak', 'mirror_lake', 'long_lake', 'sol_duc_lake', 'morgenroth_lake', 'no_name_lake', 'y_lake', 'lake_8'].map((p) => words[`place.${p}`]),
    ['High Divide', 'Bogachiel Peak', 'Mirror Lake', 'Long Lake', 'Sol Duc Lake', 'Morgenroth Lake', 'No Name Lake', 'Y Lake', 'Lake #8'],
  );
  assert.ok(!('place.bogachiel_peak_junction' in words), 'a junction whose label is ours (T16) never ships as a place');
  assert.ok(!('place.c_b_flats_group_site' in words), 'nor a place the composer has no picture for yet');
  assert.equal(words['place.lunch_lake'], 'Lunch Lake');
  assert.equal(words['dev.map'], 'Map');
  const lockbox = Object.keys(words).filter((k) => k.startsWith('first.lockbox.'));
  assert.equal(lockbox.length, 50);
  const marks = JSON.parse(read('text/marks.json'));
  for (const k of lockbox) {
    assert.equal(marks[k], 'draft', k);
    delete marks[k];
  }
  // S6's drafts (B004's 17 and B005's 35), each marked; the four with no words are never marked.
  const s6 = JSON.parse(read('text/en.json'));
  const fork = Object.keys(s6).filter((k) => /^trail\.(?:deer_lake_rim\.fork|odds|confirm|why|compass|band|outcome|pencil)\b|^trail\.next$|^fmt\.(?:mi|clock_am|clock_pm|min)$/.test(k));
  assert.equal(fork.length, 54, "the fork's 56 new ids but the two percentage formats: 52 drafts, and the fail share's and the confirm's, which hold no words");
  for (const k of fork) {
    if (['trail.odds.fail', 'trail.confirm.ask'].includes(k)) {
      assert.equal(marks[k], undefined, `${k}: no words, no mark`);
      continue;
    }
    assert.equal(marks[k], 'draft', k);
    delete marks[k];
  }
  assert.deepEqual([marks['fmt.pct'], marks['fmt.pct_under']], [undefined, undefined], 'the percentage formats hold no words');
  // S6 track C's drafts (B006's 28 and B005's ▾), each marked.
  const pictures = Object.keys(s6).filter((k) => /^look\.|^alt\.(?:base|skyline|scene|sprite|hour)\.|^trail\.(?:look\.group|box\.more)$/.test(k));
  assert.equal(pictures.length, 29, 'the Looks, their names and group, the alt parts and the ▾');
  for (const k of pictures) {
    assert.equal(marks[k], 'draft', k);
    delete marks[k];
  }
  assert.deepEqual(marks, {
    'alt.cover_high_divide_dusk': 'draft',
    'first.guestbook.one_life': 'draft',
    'first.guestbook.prompt': 'draft',
    'first.guestbook.sign': 'draft',
    'fmt.ft': 'draft',
    'fmt.mile_marker': 'draft',
    'title.begin': 'draft',
    'title.begin_note': 'draft',
    'title.start_label': 'draft',
    'title.tagline': 'draft',
    'trail.caption': 'draft',
    'trail.choice.why': 'draft',
    'trail.deer_lake_rim.deer_lake': 'draft',
    'trail.deer_lake_rim.rim': 'draft',
    'trail.sol_duc_trailhead.lot': 'draft',
    'trail.sol_duc_trailhead.trail_mouth': 'draft',
    'trail.status.menu': 'draft',
    'trail.status.sound_off': 'draft',
    'trail.status.sound_on': 'draft',
    'trail.toolbar.log': 'draft',
    'trail.toolbar.map': 'draft',
    'trail.toolbar.pack': 'draft',
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

test("S5's words: the trail frame's 12 drafts (its two number formats among them) are drafts on preview and nowhere in main's bundle; every new dev line is in main.off (SPEC 6.1, 6.8)", () => {
  const drafts = ['fmt.ft', 'fmt.mile_marker', 'trail.deer_lake_rim.deer_lake', 'trail.deer_lake_rim.rim', 'trail.caption', 'trail.status.sound_on', 'trail.status.sound_off', 'trail.status.menu', 'trail.toolbar.pack', 'trail.toolbar.map', 'trail.toolbar.log', 'trail.choice.why'];
  const dev = ['dev.hour', 'dev.hour.auto', 'dev.hour.day', 'dev.hour.dusk', 'dev.hour.blue', 'dev.hour.night', 'dev.text', 'dev.text.auto', 'dev.text.pixel', 'dev.text.plain', 'dev.scenes', 'dev.audio.render', 'dev.audio.result', 'dev.inspect.line', 'dev.inspect.none', 'dev.inspect.copy'];
  const text = readText(ROOT);
  const marks = JSON.parse(built.preview.read('text/marks.json'));
  const meta = JSON.parse(built.preview.read('text/meta.json'));
  for (const id of drafts) {
    assert.equal(text.lines.get(id).class, 'ours', id);
    assert.equal(marks[id], 'draft', `${id}: a draft on preview`);
    assert.equal(typeof built.preview.words[id], 'string', `${id}: preview ships its working words`);
    assert.ok(!(id in built.main.words), `${id}: not in main's bundle`);
    assert.equal(meta[id].state, 'draft');
    assert.equal(meta[id].batch, 'B004', `${id}: filed in B004`);
  }
  for (const id of dev) {
    const line = text.lines.get(id);
    assert.deepEqual([line.class, line.screen], ['dev', 'debug'], id);
    assert.ok(Object.prototype.hasOwnProperty.call(text.scope.main.off, id), `${id}: in main.off`);
    assert.match(text.scope.main.off[id], /^Preview only/, id);
    assert.ok(!(id in built.main.words), `${id}: not in main's bundle`);
    assert.equal(typeof built.preview.words[id], 'string', `${id}: on preview`);
  }
  assert.equal(drafts.length + dev.length, 28, "S5's 12 drafts and 16 dev words");
  assert.ok(!text.lines.has('trail.strip.mile'), "the strip's mile is fmt.mile_marker, a number format");
});
