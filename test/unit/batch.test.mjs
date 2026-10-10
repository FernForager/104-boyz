// Batches (BUILD_PLAN 10.7; S5 SPEC 6.3): content/text/review/batches.json
// against the B00n.md tables, filing with `text.mjs batch B00n --file`, and
// building a batch for review with a fake shooter (CI never needs a
// browser), plus the line inspector's meta.json data.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { readText, parseBatchTable, fileBatch, buildBatch, batchLines, batchMarkdown, unfiledLines, metaFor, batchOf, sampleFills, notOurs, fnv1a, wordsString, BATCHES_FILE, BATCH_SIZE } from '../../tools/text.mjs';
import { encodePNG } from '../../tools/png.mjs';
import { validate } from '../../tools/schema.mjs';

const read = (f, root = ROOT) => readFileSync(join(root, f), 'utf8');
const REVIEW = join(ROOT, 'content', 'text', 'review');
/** The B00n.md files, by batch. */
const mdFiles = () => Object.fromEntries(readdirSync(REVIEW).filter((f) => /^B\d{3,}\.md$/.test(f)).map((f) => [f.slice(0, -3), readFileSync(join(REVIEW, f), 'utf8')]));

/** A copy of the tree the text tools read (content/, schemas/, web/). */
function copyTree(t) {
  const root = mkdtempSync(join(tmpdir(), 'oph-batch-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const d of ['content', 'schemas', 'web']) cpSync(join(ROOT, d), join(root, d), { recursive: true });
  return root;
}

/** A shooter that takes no pictures: a 1 x 1 PNG per screen, every line badged there (and mocks for a screen named in mocks). */
function fakeShoot({ mocks = [] } = {}) {
  const calls = [];
  const png = encodePNG({ width: 1, height: 1, type: 'rgb', data: new Uint8Array([27, 31, 42]) });
  const shoot = async ({ batch, lines, dir }) => {
    calls.push({ batch, lines, dir });
    const shots = [];
    const mocked = [];
    let k = 0;
    for (const screen of [...new Set(lines.map((l) => l.screen))]) {
      const mine = lines.filter((l) => l.screen === screen);
      if (mocks.includes(screen)) {
        for (const l of mine) {
          const file = `mock-${l.n}.fake.png`;
          writeFileSync(join(dir, file), png);
          mocked.push({ n: l.n, id: l.id, file });
        }
        continue;
      }
      const file = `${String(++k).padStart(2, '0')}-${screen}.fake.png`;
      writeFileSync(join(dir, file), png);
      // The words a badged line showed, var fills in: here the caption at a place no line or sample names.
      const shown = mine.filter((l) => l.id === 'trail.caption').map((l) => ({ n: l.n, text: 'Day 1 · Bogachiel Peak · 5,474 ft' }));
      shots.push({ file, name: screen, screen, badges: mine.map((l, i) => ({ n: l.n, id: l.id, box: [0, i * 10, 10, 10] })), shown });
    }
    return { engine: 'fake', version: '0', size: 'iPhone 17 (402 x 874 @3)', shots, mocks: mocked, errors: [] };
  };
  return { shoot, calls };
}

test('batches.json agrees with every B00n.md table: the same ids, in the same order, with the same hashes, and back (SPEC 6.3)', () => {
  const data = JSON.parse(read(BATCHES_FILE));
  const schema = JSON.parse(read('schemas/batches.schema.json'));
  assert.deepEqual(validate(schema, data).errors, []);
  const md = mdFiles();
  assert.deepEqual(Object.keys(data.batches).sort(), Object.keys(md).sort(), 'a batch for every .md and an .md for every batch');
  for (const [b, src] of Object.entries(md)) {
    const rows = parseBatchTable(src);
    assert.ok(rows.length > 0, `${b} has its table`);
    rows.forEach((r, k) => assert.equal(r.n, k + 1, `${b}: row ${k + 1} is numbered ${r.n}`));
    assert.deepEqual(
      rows.map((r) => [r.id, r.hash]),
      Object.entries(data.batches[b].lines),
      `${b}: the table and batches.json`,
    );
  }
  // B004 grew from S3's 3 lines to 15 in S5 (the two number formats among them); B003 is S3's and S4's 53.
  assert.equal(Object.keys(data.batches.B004.lines).length, 15);
  assert.deepEqual(Object.keys(data.batches.B004.lines).slice(3, 5), ['fmt.ft', 'fmt.mile_marker']);
  assert.deepEqual(data.batches.B004.by, ['S3', 'S5']);
  assert.equal(data.batches.B004.status, 'filed');
  assert.equal(Object.keys(data.batches.B003.lines).length, 53);
  assert.deepEqual([data.batches.B000.status, data.batches.B001.status], ['answered', 'answered']);
});

test("every draft on a built screen is filed in a batch or held out with a reason; a filed batch's words are its lines' words now", () => {
  const text = readText(ROOT);
  assert.deepEqual(unfiledLines(text), []);
  for (const [id, why] of Object.entries(text.batches.held)) {
    assert.ok(text.lines.has(id), `${id} is a line`);
    assert.ok(why.length > 10, `${id} says why it is held`);
  }
  for (const b of ['B003', 'B004']) assert.deepEqual(batchLines(text, b).errors, [], `${b} matches its lines`);
});

test('--file on a copy rebuilds S5\'s filing of B004 byte for byte: exactly the 12 unfiled drafts, appended to the .md; a second run does nothing', (t) => {
  const root = copyTree(t);
  // Wind B004 back to S3's three lines, as S5 found it.
  const bj = JSON.parse(read(BATCHES_FILE, root));
  const s3 = Object.fromEntries(Object.entries(bj.batches.B004.lines).slice(0, 3));
  bj.batches.B004 = { ...bj.batches.B004, by: ['S3'], lines: s3 };
  writeFileSync(join(root, BATCHES_FILE), `${JSON.stringify(bj, null, 1)}\n`);
  const mdPath = join(root, 'content', 'text', 'review', 'B004.md');
  const md = read('content/text/review/B004.md');
  writeFileSync(mdPath, md.split('\n').filter((l) => !/^\| (?:[4-9]|1[0-5]) \|/.test(l)).join('\n'));
  const before = readText(root);
  assert.equal(unfiledLines(before).length, 12);
  const r = fileBatch(root, 'B004', { by: 'S5' });
  assert.deepEqual(r.errors, []);
  assert.deepEqual(
    r.filed.map((f) => [f.n, f.id, f.how]),
    unfiledLines(before).map((id, k) => [k + 4, id, 'added']),
  );
  assert.equal(read(BATCHES_FILE, root), read(BATCHES_FILE), 'batches.json as committed');
  assert.deepEqual(parseBatchTable(readFileSync(mdPath, 'utf8')), parseBatchTable(md), "B004.md's table as committed");
  const again = fileBatch(root, 'B004', { by: 'S5' });
  assert.deepEqual([again.errors, again.filed, again.wrote], [[], [], []], 'a no-op the second time');
});

test('--file: named lines, a changed line refiled while the batch is unsent, held lines passed by; refusals write nothing', (t) => {
  const root = copyTree(t);
  const trail = join(root, 'content', 'text', 'en', 'trail.json');
  const data = JSON.parse(readFileSync(trail, 'utf8'));
  data['trail.new_one'] = { text: 'A new draft.', ctx: 'a test line', screen: 'trail', max: 40 };
  data['trail.new_two'] = { text: 'Another.', ctx: 'a test line', screen: 'trail', max: 40 };
  data['trail.deer_lake_rim.rim'].text = 'The ground falls away.';
  writeFileSync(trail, JSON.stringify(data, null, 1));
  const text = readText(root);
  assert.deepEqual(unfiledLines(text), ['trail.deer_lake_rim.rim', 'trail.new_one', 'trail.new_two'], 'the edited line comes back, the held title lines never do');
  assert.match(batchLines(text, 'B004').errors.join('\n'), /B004 #7 trail\.deer_lake_rim\.rim changed since filing \(be25b08f, now [0-9a-f]{8}\): it comes back in the next batch, or refile it here/);
  const snap = () => [read(BATCHES_FILE, root), read('content/text/review/B004.md', root)];
  const start = snap();
  for (const [b, ids, re] of [
    ['B001', ['trail.new_one'], /B001 is answered: its record is never edited/],
    ['B009', ['trail.new_one'], /no B009 in content\/text\/review\/batches\.json/],
    ['B004', ['dev.close'], /dev\.close is a dev line: exempt/],
    ['B004', ['app.build'], /app\.build has no words to approve/],
    ['B004', ['trail.nope'], /trail\.nope isn't defined/],
    ['x4', ['trail.new_one'], /is not a batch/],
  ]) {
    const r = fileBatch(root, b, { ids });
    assert.match(r.errors.join('\n'), re, `${b} ${ids}`);
    assert.deepEqual(snap(), start, 'nothing written');
  }
  const r = fileBatch(root, 'B004', { ids: ['trail.new_two', 'trail.deer_lake_rim.rim'] });
  assert.deepEqual(r.errors, []);
  assert.deepEqual(
    r.filed.map((f) => [f.n, f.id, f.how]),
    [
      [16, 'trail.new_two', 'added'],
      [7, 'trail.deer_lake_rim.rim', 'refiled'],
    ],
  );
  const after = readText(root);
  assert.deepEqual(batchLines(after, 'B004').errors, [], 'refiled: B004 builds again');
  const rows = parseBatchTable(read('content/text/review/B004.md', root));
  assert.deepEqual(rows[6], { n: 7, id: 'trail.deer_lake_rim.rim', hash: fnv1a('The ground falls away.') });
  assert.match(read('content/text/review/B004.md', root), /^\| 7 \| `trail\.deer_lake_rim\.rim` \| [0-9a-f]{8} \| .* \| none \| The ground falls away\. \|$/m);
  assert.deepEqual(rows[15], { n: 16, id: 'trail.new_two', hash: fnv1a('Another.') });
  assert.deepEqual(unfiledLines(after), ['trail.new_one']);
});

test('batch B004 with a fake shooter: the .md, the JSON and one shot per screen, numbered in order, measured with T15; a mock where no shot reaches; it fails on a line edited after filing', async (t) => {
  const root = copyTree(t);
  const out = join(root, 'out', 'review');
  const { shoot, calls } = fakeShoot();
  const r = await buildBatch(root, 'B004', { out, build: '20261009-abcdef0', shoot });
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, [`batch: B004 has 15 lines, outside ${BATCH_SIZE.min} to ${BATCH_SIZE.max} (decision 64); it is filed, and grows until it goes out`]);
  assert.equal(calls.length, 1);
  assert.deepEqual(
    calls[0].lines.map((l) => [l.n, l.screen]),
    Array.from({ length: 15 }, (_, k) => [k + 1, 'trail']),
  );
  const dir = join(out, 'B004');
  assert.deepEqual(readdirSync(join(dir, 'shots')), ['01-trail.fake.png'], 'one shot per screen');
  const j = JSON.parse(readFileSync(join(dir, 'B004.json'), 'utf8'));
  assert.equal(j.batch, 'B004');
  assert.equal(j.build, '20261009-abcdef0');
  assert.deepEqual(
    j.lines.map((l) => l.n),
    Array.from({ length: 15 }, (_, k) => k + 1),
  );
  const byId = Object.fromEntries(j.lines.map((l) => [l.id, l]));
  assert.deepEqual([byId['trail.deer_lake_rim.rim'].len, byId['trail.deer_lake_rim.rim'].max], [106, 140]);
  assert.deepEqual([byId['trail.caption'].len, byId['trail.caption'].max], [41, 44], "the caption at its vars' widths");
  assert.deepEqual(byId['trail.caption'].samples, ['Day 1 · Deer Lake · 3,530 ft', 'Day 3 · Seven Lakes Basin · 4,900 ft', 'Day 12 · Seven Mile Group Site · 5,474 ft']);
  assert.equal(byId['trail.caption'].hash, fnv1a('Day {day} · {place} · {elev}'));
  // The formats: a height and the strip's marker, each filled from its own var's samples.
  assert.deepEqual(byId['fmt.ft'].samples, ['3,530 ft', '4,900 ft', '5,474 ft']);
  assert.deepEqual(byId['fmt.mile_marker'].samples, ['mi 0.0', 'mi 3.7', 'mi 12.4']);
  assert.deepEqual([byId['fmt.ft'].len, byId['fmt.ft'].max, byId['fmt.mile_marker'].len], [8, 8, 7]);
  assert.equal(byId['trail.walk_on'].shot, 'shots/01-trail.fake.png');
  assert.deepEqual(byId['trail.walk_on'].badge, [0, 0, 10, 10]);
  // The tail: the places the lines name, the ones their sample fills show,
  // and the ones their screenshots show through a var (the fake's caption
  // at Bogachiel Peak), each with the lines that show it.
  assert.deepEqual(
    j.not_ours.map((x) => [x.id, x.text, x.kind, x.lines]),
    [
      ['place.sol_duc_falls', 'Sol Duc Falls', 'place', [3]],
      ['place.bogachiel_peak', 'Bogachiel Peak', 'place', [8]],
      ['place.deer_lake', 'Deer Lake', 'place', [8]],
      ['place.seven_lakes_basin', 'Seven Lakes Basin', 'place', [8]],
      ['place.seven_mile_group_camp', 'Seven Mile Group Site', 'place', [8]],
    ],
  );
  assert.equal(byId['trail.caption'].n, 8);
  const md = readFileSync(join(dir, 'B004.md'), 'utf8');
  assert.match(md, /^\*Sol Duc Falls\* \(a place, line 3\); \*Bogachiel Peak\* \(a place, line 8\); \*Deer Lake\* \(a place, line 8\); \*Seven Lakes Basin\* \(a place, line 8\); \*Seven Mile Group Site\* \(a place, line 8\): no approval needed, vetoable\.$/m);
  assert.equal(md, batchMarkdown(j));
  assert.match(md, /^# B004 · Trail stops · 15 lines$/m);
  assert.match(md, /^!\[trail: trail, lines 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15\]\(shots\/01-trail\.fake\.png\)$/m);
  assert.match(md, /^\| 7 \| `trail\.deer_lake_rim\.rim` \| .* \| 106 of 140 \| \(DRAFT\) The ground falls away/m);
  assert.match(md, /^\*\*8\*\*, three sample fills: \*Day 1 · Deer Lake · 3,530 ft\*/m);
  assert.ok(md.indexOf('![trail') < md.indexOf('| # | Id |'), 'the screenshot comes first');
  // A screen no shot reaches gets mocks of its boxes.
  const mocked = fakeShoot({ mocks: ['trail'] });
  const r2 = await buildBatch(root, 'B004', { out, shoot: mocked.shoot });
  assert.deepEqual(r2.errors, []);
  assert.equal(r2.json.lines[1].mock, 'shots/mock-2.fake.png');
  assert.match(readFileSync(join(dir, 'B004.md'), 'utf8'), /^\*\*2\*\*: no screenshot reaches it, so here is a mock of its box:$/m);
  // Without a shooter it still builds, with no pictures.
  const r3 = await buildBatch(root, 'B004', { out });
  assert.deepEqual([r3.errors, r3.json.engine, r3.json.shots], [[], null, []]);
  // A line edited after filing fails the build, and nothing is shot.
  const trail = join(root, 'content', 'text', 'en', 'trail.json');
  const data = JSON.parse(readFileSync(trail, 'utf8'));
  data['trail.walk_on'].text = 'Walk on, walk on';
  writeFileSync(trail, JSON.stringify(data, null, 1));
  const before = calls.length;
  const bad = await buildBatch(root, 'B004', { out, shoot });
  assert.match(bad.errors.join('\n'), /B004 #1 trail\.walk_on changed since filing \(d5383259, now [0-9a-f]{8}\)/);
  assert.equal(calls.length, before, 'no pictures for a batch that fails');
  assert.match((await buildBatch(root, 'B001', { out })).errors.join('\n'), /B001 is answered/);
});

test('the template fills, the not-ours tail, and a changed line shows the words it was approved as', async (t) => {
  const root = copyTree(t);
  const text = readText(root);
  assert.deepEqual(sampleFills(text, 'mi {mi}'), ['mi 0.0', 'mi 3.7', 'mi 12.4']);
  assert.deepEqual(sampleFills(text, 'Walk on'), []);
  assert.deepEqual(sampleFills(text, { one: '{day} day', other: '{day} days' }), ['1 day', '3 days', '12 days'], "a plural's forms by n");
  assert.deepEqual(notOurs(text, [{ n: 1, words: 'From Deer Lake to Lunch Lake, then Deer Lake again.' }, { n: 2, words: 'No names.' }]).map((x) => [x.id, x.lines]), [
    ['place.deer_lake', [1]],
    ['place.lunch_lake', [1]],
  ]);
  // A template names no place itself: its sample fills and what its screenshots showed do.
  const caption = { n: 4, words: 'Day {day} · {place} · {elev}', samples: ['Day 1 · Deer Lake · 3,530 ft'] };
  assert.deepEqual(notOurs(text, [caption]).map((x) => [x.id, x.lines]), [['place.deer_lake', [4]]]);
  assert.deepEqual(notOurs(text, [caption], [{ n: 4, text: 'Day 1 · Seven Lakes Basin · 4,900 ft' }]).map((x) => [x.id, x.lines]), [
    ['place.deer_lake', [4]],
    ['place.seven_lakes_basin', [4]],
  ]);
  // Approve trail.walk_on in the copy's ledger as other words: it is changed.
  const ledgerPath = join(root, 'content', 'text', 'approved.json');
  const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
  const { wordsHash } = await import('../../tools/text.mjs');
  ledger.lines['trail.walk_on'] = { text: 'Go on', sha256: wordsHash('Go on'), seen: fnv1a('Go on'), batch: 'B002', line: 1, on: '2026-10-09', how: 'approve, test' };
  writeFileSync(ledgerPath, JSON.stringify(ledger, null, 1));
  const r = await buildBatch(root, 'B004', { out: join(root, 'out') });
  assert.equal(r.json.lines[0].state, 'changed');
  assert.equal(r.json.lines[0].old, 'Go on');
  const md = readFileSync(join(root, 'out', 'B004', 'B004.md'), 'utf8');
  assert.match(md, /^\| 1 \| `trail\.walk_on` \| .* \| 7 of 22 \| \(CHANGED\) Walk on \|$/m);
  assert.match(md, /^\*\*1\*\* was approved as: Go on$/m);
});

test("meta.json (the line inspector's data): every line's state, ctx, max, length, hash and batch; a line added in chat takes its batch from the ledger", () => {
  const text = readText(ROOT);
  const meta = metaFor(text);
  assert.deepEqual(Object.keys(meta), [...text.lines.keys()].sort());
  assert.deepEqual(meta['trail.deer_lake_rim.rim'], {
    state: 'draft',
    ctx: text.lines.get('trail.deer_lake_rim.rim').ctx,
    screen: 'trail',
    max: 140,
    len: 106,
    hash: 'be25b08f',
    batch: 'B004',
    n: 7,
  });
  assert.deepEqual([meta['app.update.restart'].batch, meta['app.update.restart'].n, meta['app.update.restart'].state], ['B001', 11, 'approved'], 'B001.answers.json added it in chat; the ledger says where');
  assert.deepEqual(batchOf(text, 'app.offline'), { batch: 'B001', n: 4 });
  assert.equal(batchOf(text, 'dev.close'), null);
  assert.deepEqual([meta['dev.close'].state, meta['dev.close'].max, meta['dev.close'].batch], ['dev', null, null]);
  assert.equal(meta['app.build'].len, 17, "the bare build code at {build}'s width");
  for (const [id, m] of Object.entries(meta)) {
    assert.equal(m.hash, fnv1a(wordsString(text.lines.get(id).text)), id);
    if (m.max !== null && m.len !== null) assert.ok(m.len <= m.max, `${id} fits (T15)`);
  }
});

test('npm run text:batch is wired; the CLI refuses what is not a batch, and names its uses', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['text:batch'], 'node tools/text.mjs batch');
  const run = (...args) => spawnSync(process.execPath, [join(ROOT, 'tools', 'text.mjs'), ...args], { encoding: 'utf8' });
  const bad = run('batch', 'x9');
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /batch: "x9" is not a batch/);
  const filed = run('batch', 'B001', '--file', 'trail.walk_on');
  assert.equal(filed.status, 1);
  assert.match(filed.stderr, /B001 is answered/);
  const usage = run('nope');
  assert.equal(usage.status, 2);
  assert.match(usage.stderr, /batch B00n --file \[id \.\.\.\] \[--by S5\] \| batch B00n \[--shots\]/);
});
