// The content compiler and loader (BUILD_PLAN 2.7, 3.3, S3; GAME_DESIGN
// E.4: validate at the door; E.12: words never move the rules hash).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validate } from '../../tools/schema.mjs';
import { compileContent, compileSources, readSchemas, readSources, jsonLines, lineOfPath, boxSlots, schemaFor, FOLDERS } from '../../tools/content.mjs';
import { ROOT } from '../../tools/pics.mjs';
import { loadContent } from '../../web/js/engine/content.js';
import { canon } from '../../web/js/engine/canon.js';
import { FX_SET, FX_PLAN, FX_HASH, compileFx, fxContent, source, rulesSources } from './enginefix.mjs';

const schemas = readSchemas(ROOT);
const codes = (problems) => problems.map((p) => `${p.file}:${p.line}: ${p.code}`);
/** The line of a path in a source made by source(): JSON with one-space indents. */
const lineIn = (data, path) => jsonLines(`${JSON.stringify(data, null, 1)}\n`).get(path);

test('the schema validator: the keywords content uses, and our three annotations', () => {
  const s = {
    type: 'object',
    required: ['a'],
    additionalProperties: false,
    properties: {
      a: { type: 'integer', minimum: 1, maximum: 3 },
      b: { type: ['string', 'null'], pattern: '^x', minLength: 2, maxLength: 3 },
      c: { type: 'array', items: { $ref: '#/$defs/line' } },
      d: { oneOf: [{ type: 'null' }, { const: 7 }] },
      e: { enum: ['p', 'q'] },
      f: { type: 'string', 'x-expr': 'bool' },
    },
    $defs: { line: { type: 'string', 'x-text': true, 'x-voice': true } },
  };
  const ok = validate(s, { a: 2, b: 'xy', c: ['@l.one'], d: 7, e: 'q', f: 'true' });
  assert.deepEqual(ok.errors, []);
  assert.deepEqual(
    ok.annotations.map((a) => [a.path, a.keyword, a.value]),
    [
      ['c[0]', 'x-text', '@l.one'],
      ['c[0]', 'x-voice', '@l.one'],
      ['f', 'x-expr', 'true'],
    ],
  );
  const bad = validate(s, { a: 4, b: 'y', c: [1], d: 8, e: 'r', g: 1, f: 2 });
  assert.deepEqual([...new Set(bad.errors.map((e) => e.path))].sort(), ['(the file)', 'a', 'b', 'c[0]', 'd', 'e', 'f']);
  assert.deepEqual(validate(s, {}).errors, [{ path: '(the file)', msg: 'needs "a"' }]);
  assert.match(validate(s, { a: 1.5 }).errors[0].msg, /not integer/);
  assert.match(validate({ oneOf: [{ type: 'number' }, { type: 'integer' }] }, 1).errors[0].msg, /more than one/);
  assert.throws(() => validate({ tpye: 'string' }, 'x'), /unknown keyword "tpye"/, 'a typo in a schema is an error');
  assert.throws(() => validate({ $ref: 'other.json#/x' }, 1), /not within the file/);
});

test("each schema accepts the repo's content files, read at any depth (S4: content/park/...)", () => {
  const files = readSources(ROOT);
  const names = files.map((f) => f.file);
  for (const f of ['content/rules/profile.json', 'content/rules/standard.json', 'content/trips/sample.json', 'content/stops/sol_duc_trailhead.json']) assert.ok(names.includes(f), f);
  for (const f of ['content/rules/movement.json', 'content/park/regions/sol_duc_high_divide.json', 'content/park/overlays/sol_duc_high_divide.json', 'content/park/overlays/park.json', 'content/park/vocab/hazards.json', 'content/park/vocab/zones.json', 'content/park/ingest_known.json', 'content/park/ingest_lock.json', 'content/scope/m1a.json']) assert.ok(names.includes(f), `S4: ${f}`);
  assert.equal(files.find((f) => f.file === 'content/park/regions/coast.json').folder, 'park/regions', 'a nested file keeps its folder path');
  assert.ok(!names.some((f) => f.startsWith('content/text/') || f.startsWith('content/art/') || !f.endsWith('.json')), 'the words, the art and the report have their own readers');
  for (const f of files) assert.ok(schemaFor(f.file.slice('content/'.length)), `${f.file} has a schema pattern`);
  const { problems } = compileContent({ screens: ['app', 'debug', 'guestbook', 'title', 'trail'], checkText: false });
  assert.deepEqual(problems, []);
});

test('the path table: each content path names its schema, nested folders included, and an unmatched file is J01', () => {
  assert.equal(schemaFor('rules/profile.json'), 'profile.schema.json');
  assert.equal(schemaFor('rules/movement.json'), 'movement.schema.json');
  assert.equal(schemaFor('park/regions/coast.json'), 'park_region.schema.json');
  assert.equal(schemaFor('park/overlays/park.json'), 'park_points.schema.json', 'the points file before the region overlays');
  assert.equal(schemaFor('park/overlays/sol_duc_high_divide.json'), 'park_overlay.schema.json');
  assert.equal(schemaFor('park/conditions/2026.json'), 'conditions.schema.json');
  assert.equal(schemaFor('data/quinault_sun.json'), 'sun.schema.json');
  assert.equal(schemaFor('scope/m1a.json'), 'scope.schema.json');
  assert.equal(schemaFor('park/regions/deeper/x.json'), null);
  for (const f of FOLDERS) assert.ok(f.owner, String(f.pattern));
  const stray = compileSources({ sources: [...rulesSources(), source('park/stray', 'x', { a: 1 })], schemas, screens: [] }).problems;
  assert.deepEqual(codes(stray), ['content/park/stray/x.json:1: J01']);
  assert.match(stray[0].msg, /no schema for it/);
});

test('minItems and maxItems (S4: the quiz takes exactly three answers)', () => {
  const s = { type: 'array', minItems: 3, maxItems: 3, items: { type: 'string' } };
  assert.deepEqual(validate(s, ['a', 'b', 'c']).errors, []);
  assert.match(validate(s, ['a', 'b']).errors[0].msg, /has 2 items, fewer than 3/);
  assert.match(validate(s, ['a']).errors[0].msg, /has 1 item, fewer than 3/);
  assert.match(validate(s, ['a', 'b', 'c', 'd']).errors[0].msg, /has 4 items, more than 3/);
  assert.deepEqual(validate({ minItems: 1 }, 'not an array').errors, [], 'only arrays are counted');
});

test('each schema rejects planted errors, with the file and the line (J01)', () => {
  const plant = (folder, name, data) => compileSources({ sources: [...rulesSources().filter((s) => !(folder === 'rules' && s.name === name)), source(folder, name, data)], schemas, screens: ['fx'] }).problems;
  const profile = JSON.parse(readFileSync(join(ROOT, 'content', 'rules', 'profile.json'), 'utf8'));
  const p0 = { ...profile, name_max: 0 };
  assert.deepEqual(codes(plant('rules', 'profile', p0)), [`content/rules/profile.json:${lineIn(p0, 'name_max')}: J01`]);
  assert.match(plant('rules', 'profile', p0)[0].msg, /name_max 0 is under 1/);
  assert.deepEqual(codes(plant('rules', 'profile', { ...profile, extra: 1 })), ['content/rules/profile.json:1: J01']);
  const standard = JSON.parse(readFileSync(join(ROOT, 'content', 'rules', 'standard.json'), 'utf8'));
  assert.match(plant('rules', 'standard', { ...standard, runner: 5 })[0].msg, /runner/);
  const m = { ...FX_PLAN, mode: 'storybook' };
  assert.deepEqual(codes(plant('trips', 'fx_plan', m)), [`content/trips/fx_plan.json:${lineIn(m, 'mode')}: J01`]);
  const d = { ...FX_PLAN, start: { set: 'fx', day: 0, s: 1 } };
  assert.deepEqual(codes(plant('trips', 'fx_plan', d)), [`content/trips/fx_plan.json:${lineIn(d, 'start.day')}: J01`]);
  const set = (stops) => ({ ...FX_SET, stops });
  assert.equal(plant('stops', 'fx', set([{ id: 'a', box: 'fx.a', next: null }]))[0].code, 'J01', 'a line is "@id"');
  assert.equal(plant('stops', 'fx', set([{ id: 'a', box: '@fx.a', next: null, choices: [] }]))[0].code, 'J01', 'next or choices, not both');
  assert.equal(plant('stops', 'fx', set([{ id: 'a', box: '@fx.a' }]))[0].code, 'J01', 'next or choices, not neither');
  assert.equal(plant('stops', 'fx', set([{ id: 'a', box: '@fx.a', choices: [{ id: 'x', label: '@fx.x', then: 'a', roll: { p: '1', pass: 'a', fail: 'a' } }] }]))[0].code, 'J01', 'then or a roll, not both');
  assert.equal(plant('stops', 'fx', set([{ id: 'a', box: '@fx.a', choices: [{ id: 'x', label: '@fx.x', then: 'a', effects: [{ flag: 'f', add_s: 1 }] }] }]))[0].code, 'J01', 'one op an effect');
  const other = compileSources({ sources: [...rulesSources(), source('rules', 'other', { x: 1 })], schemas, screens: [] }).problems;
  assert.deepEqual(codes(other), ['content/rules/other.json:1: J01'], 'a content file with no schema fails');
});

test('a bad expression fails with its file and line (X01), and a good one becomes a syntax tree', () => {
  const choice = (p, show) => ({ ...FX_SET, stops: [FX_SET.stops[0], { ...FX_SET.stops[1], choices: [{ ...FX_SET.stops[1].choices[0], roll: { p, pass: 'c', fail: 'd' } }, { ...FX_SET.stops[1].choices[1], show_if: show }] }, ...FX_SET.stops.slice(2)] });
  const problems = (p, show = "!flag('rested')") => compileFx({ sets: [choice(p, show)] }).problems;
  assert.deepEqual(problems('0.5'), []);
  assert.deepEqual(codes(problems('0.5 +')), [`content/stops/fx.json:${lineIn(choice('0.5 +', ''), 'stops[1].choices[0].roll.p')}: X01`]);
  assert.match(problems('trip.dy')[0].msg, /stops\[1\]\.choices\[0\]\.roll\.p: unknown variable trip\.dy in "trip\.dy"/);
  assert.match(problems('1 < 2')[0].msg, /wants a number/, "a roll's p is a number");
  assert.match(problems('0.5', '1')[0].msg, /wants a bool/, 'show_if is a bool');
  assert.match(problems('1 / clock.s')[0].msg, /range includes 0/);
  assert.equal(problems('1 / clock.s')[0].level, 'warn', 'a warning, for the lint: the build refuses only errors');
  assert.equal(problems('0.5 +')[0].level, undefined);
  const { rules } = compileFx();
  assert.deepEqual(rules.stops.fx.stops[1].choices[0].roll.p, ['bin', '+', ['num', 0.5], ['cond', ['call', 'flag', [['id', 'rested']]], ['num', 0.25], ['num', 0]]]);
  assert.deepEqual(rules.stops.fx.stops[1].choices[1].show_if, ['not', ['call', 'flag', [['id', 'rested']]]]);
});

test('references (R01): a dangling next, then, pass or fail, a missing first stop, a doubled id, an unbuilt phase, a plan with no set', () => {
  const with1 = (patch) => compileFx({ sets: [{ ...FX_SET, ...patch }] }).problems;
  const stops = JSON.parse(JSON.stringify(FX_SET.stops));
  stops[0].next = 'nowhere';
  assert.deepEqual(codes(with1({ stops })), [`content/stops/fx.json:${lineIn({ ...FX_SET, stops }, 'stops[0].next')}: R01`]);
  assert.match(with1({ stops })[0].msg, /stop "a": next "nowhere" is not a stop in set "fx"/);
  const s2 = JSON.parse(JSON.stringify(FX_SET.stops));
  s2[1].choices[0].roll.fail = 'e';
  s2[1].choices[1].then = 'z';
  assert.deepEqual(with1({ stops: s2 }).map((p) => p.msg.replace(/.*: /, '')), ['choices.go.roll.fail "e" is not a stop in set "fx"', 'choices.rest.then "z" is not a stop in set "fx"']);
  assert.match(with1({ first: 'q' })[0].msg, /first stop "q"/);
  assert.match(with1({ stops: [...FX_SET.stops, FX_SET.stops[0]] })[0].msg, /stop "a" twice/);
  assert.match(with1({ phase: 'day' })[0].msg, /phase "day" is built in S15a/);
  assert.match(with1({ phase: 'home' })[0].msg, /not a trip phase/);
  assert.match(with1({ phase: 'summit' })[0].msg, /"summit" is not a phase/);
  const noSet = compileFx({ plans: [{ ...FX_PLAN, start: { ...FX_PLAN.start, set: 'gone' } }] }).problems;
  assert.match(noSet[0].msg, /starts at "gone", which is not a stop set/);
  const dup = compileSources({ sources: [...rulesSources(), source('trips', 'one', FX_PLAN), source('trips', 'two', FX_PLAN), source('stops', 'fx', FX_SET)], schemas, screens: ['fx'] }).problems;
  assert.match(dup[0].msg, /plan "fx_plan" is also content\/trips\/one\.json/);
});

test('with checkText, every "@id" in a file the build ships is a defined line; a file on a screen the build lacks waits', () => {
  const defined = (id) => id !== 'fx.c';
  const on = compileSources({ sources: [...rulesSources(), source('trips', 'fx_plan', FX_PLAN), source('stops', 'fx', FX_SET)], schemas, screens: ['fx'], defined });
  assert.deepEqual(codes(on.problems), [`content/stops/fx.json:${lineIn(FX_SET, 'stops[2].box')}: R01`]);
  assert.match(on.problems[0].msg, /stops\[2\]\.box: @fx\.c is not a line in content\/text/);
  const off = compileSources({ sources: [...rulesSources(), source('trips', 'fx_plan', FX_PLAN), source('stops', 'fx', FX_SET)], schemas, screens: [], defined });
  assert.deepEqual(off.problems, []);
  assert.deepEqual(off.infos, ['content/stops/fx.json: @fx.c is not a line yet (screen fx waits)']);
});

test('scope and split: plans and sets only on the given screens; logic to rules, line ids to voice', () => {
  const { rules, voice } = compileFx();
  assert.deepEqual(Object.keys(rules), ['format', 'plans', 'profile', 'standard', 'stops']);
  assert.deepEqual(rules.plans, { fx_plan: { after: 'end', mode: 'open', start: { day: 1, s: 28800, set: 'fx' } } });
  assert.ok(!JSON.stringify(rules).includes('fx.'), 'no line id in the rules');
  assert.ok(!JSON.stringify(rules).includes('$comment'));
  assert.ok(!('screen' in rules.stops.fx), 'the screen scopes; it is not a rule');
  assert.deepEqual(voice.stops.fx.b, { box: [['fx.b1', 'fx.b2']], labels: { go: 'fx.go', rest: 'fx.rest' } });
  assert.deepEqual(voice.stops.fx.a, { box: [['fx.a']], labels: {} });
  const none = compileFx({ screens: ['app'] });
  assert.deepEqual([none.rules.plans, none.rules.stops, none.voice.stops], [{}, {}, {}]);
  assert.ok(none.rules.profile && none.rules.standard, 'the profile and standard rules always');
  assert.deepEqual(boxSlots([['@a.b', '@a.c'], ['@a.d']]), [['a.b', 'a.c'], ['a.d']], 'a list of slots');
  assert.equal(canon(compileFx().rules), canon(compileFx().rules), 'two compiles, the same bytes');
});

test("jsonLines finds each value's line by its path", () => {
  const src = '{\n "a": 1,\n "b": [\n  {"c": "x"},\n  {"c": "y\\"z"}\n ]\n}\n';
  const lines = jsonLines(src);
  assert.equal(lines.get('a'), 2);
  assert.equal(lines.get('b[1].c'), 5);
  assert.equal(lineOfPath(src, 'b[1].c.d'), 5, 'the nearest parent');
  assert.equal(lineOfPath('not json', 'x'), 1);
});

test('loadContent freezes the data, looks ids up, and compiles each expression once', () => {
  const content = fxContent();
  assert.equal(content.rulesHash, FX_HASH);
  assert.ok(Object.isFrozen(content.data.rules.stops.fx.stops[1].choices[0]));
  assert.equal(content.plan('fx_plan').start.set, 'fx');
  assert.equal(content.plan('nope'), null);
  assert.equal(content.plan('toString'), null, 'own ids only');
  assert.deepEqual(content.plans(), ['fx_plan']);
  assert.equal(content.set('fx').first, 'a');
  assert.equal(content.stop('fx', 'b').choices.length, 2);
  assert.equal(content.stop('fx', 'z'), null);
  assert.deepEqual(content.voice('fx', 'a').box, [['fx.a']]);
  assert.equal(content.voice('fx', 'z'), null);
  const ast = content.stop('fx', 'b').choices[0].roll.p;
  assert.equal(content.expr(ast), content.expr(ast), 'compiled once, cached by the tree');
  assert.equal(content.expr(ast)({ v: () => 0, flag: () => true, seen: () => false }), 0.75);
  assert.equal(content.profile.name_max, 12);
  assert.equal(content.standard.hiker.fitness, 'regular');
});

test('loadContent refuses data it cannot read (EngineError "format")', () => {
  const { rules, voice } = compileFx();
  const bad = (o) => assert.throws(() => loadContent(o), { name: 'EngineError', code: 'format' });
  bad({ rules: { ...rules, format: 2 }, voice, rulesHash: FX_HASH });
  bad({ rules, voice: { format: 0 }, rulesHash: FX_HASH });
  bad({ rules, voice, rulesHash: 'dev' });
  bad({ rules, voice, rulesHash: '00000000000G' });
  bad({ rules: { ...rules, stops: { fx: { ...rules.stops.fx, first: 'q' } } }, voice, rulesHash: FX_HASH });
  bad({ rules: { ...rules, stops: {} }, voice, rulesHash: FX_HASH });
});

test('compileContent reads a tree: the repo copied, with a planted error, fails as the build would', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'oph-content-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const d of ['content', 'schemas']) cpSync(join(ROOT, d), join(root, d), { recursive: true });
  assert.deepEqual(compileContent({ root, screens: ['trail'], checkText: false }).problems, []);
  writeFileSync(join(root, 'content', 'trips', 'sample.json'), readFileSync(join(root, 'content', 'trips', 'sample.json'), 'utf8').replace('"after": "end"', '"after": "home"'));
  assert.deepEqual(codes(compileContent({ root, screens: ['trail'], checkText: false }).problems), ['content/trips/sample.json:7: J01']);
});

test("S5: a stop's view is display data (voice, never rules), and an empty box is a quiet stop (decision 32)", () => {
  const view = { pic: 'deer_lake', node: 'deer_lake', day: ['sol_duc_trailhead', 'deer_lake'] };
  const stops = JSON.parse(JSON.stringify(FX_SET.stops));
  stops[0] = { id: 'a', box: [], view, next: 'b' };
  const { rules, voice, problems, infos } = compileFx({ sets: [{ ...FX_SET, stops }] });
  assert.deepEqual(problems, [], 'nothing in memory to check the view against');
  assert.deepEqual(voice.stops.fx.a, { box: [], labels: {}, view });
  assert.deepEqual(rules.stops.fx.stops[0], { id: 'a', next: 'b' });
  assert.ok(!JSON.stringify(rules).includes('"view"'));
  assert.deepEqual(infos, ['content/stops/fx.json: stop "a" view.pic "deer_lake" waits for content/art/recipes.json to check against (set fx)']);
  assert.deepEqual(boxSlots([]), [], 'a quiet stop has no slots');
  // The schema: every field, nothing else.
  const bad = (v) => codes(compileFx({ sets: [{ ...FX_SET, stops: [{ ...stops[0], view: v }, ...stops.slice(1)] }] }).problems);
  assert.equal(bad({ pic: 'p', node: 'n' }).length, 1, 'no day');
  assert.equal(bad({ ...view, day: ['one'] }).length, 1, 'a day is two points or more');
  assert.equal(bad({ ...view, hour: 'dusk' }).length, 1, 'no other field');
  // The picture is checked against the recipes' places when there are some.
  const sources = [...rulesSources(), source('trips', 'fx_plan', FX_PLAN), source('stops', 'fx', { ...FX_SET, stops })];
  const checked = compileSources({ sources, schemas, screens: ['fx'], places: new Set(['lake_basin_only']) });
  assert.deepEqual(codes(checked.problems), [`content/stops/fx.json:${lineIn({ ...FX_SET, stops }, 'stops[0].view.pic')}: R01`]);
  assert.match(checked.problems[0].msg, /view\.pic "deer_lake" is not a place in content\/art\/recipes\.json/);
});

test("S5: in the repo's tree, a view's node and day are checked against the scope's park, and its picture against content/art/recipes.json once it is there (R01)", (t) => {
  const root = mkdtempSync(join(tmpdir(), 'oph-view-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const d of ['content', 'schemas']) cpSync(join(ROOT, d), join(root, d), { recursive: true });
  const file = join(root, 'content', 'stops', 'deer_lake_rim.json');
  const src = readFileSync(file, 'utf8');
  assert.deepEqual(compileContent({ root, screens: ['trail'], checkText: false }).problems, []);
  // S6: the rim walks on to the fork (it was the set's end in S5).
  writeFileSync(file, src.replace('"node": "deer_lake"', '"node": "atlantis"').replace('"day": ["sol_duc_trailhead", "seven_lakes_basin"] }, "next": "fork"', '"day": ["sol_duc_trailhead", "el_dorado"] }, "next": "fork"'));
  const msgs = compileContent({ root, screens: ['trail'], checkText: false }).problems.map((p) => `${p.code} ${p.msg}`);
  assert.deepEqual(msgs, [
    'R01 stop "deer_lake": view.node "atlantis" is not a node in the scope\'s park (content/scope/m1a.json)',
    'R01 stop "rim": view.day "el_dorado" is not a node in the scope\'s park (content/scope/m1a.json)',
  ]);
  writeFileSync(file, src);
  writeFileSync(join(root, 'content', 'art', 'recipes.json'), JSON.stringify({ places: { deer_lake: {} } }));
  const pics = compileContent({ root, screens: ['trail'], checkText: false }).problems.map((p) => p.msg);
  // Re-pinned in S6: the fork stands at the rim, and its outcomes at Heart Lake, the High Divide and Lunch Lake; the car's
  // shows Deer Lake (the way down) until S15a draws the trailhead, and Deer Lake is a place here.
  const notAPlace = (/** @type {string} */ stop, /** @type {string} */ pic) => `stop "${stop}": view.pic "${pic}" is not a place in content/art/recipes.json`;
  assert.deepEqual(pics, [
    notAPlace('rim', 'seven_lakes_basin'),
    notAPlace('fork', 'seven_lakes_basin'),
    notAPlace('high_clean', 'heart_lake'),
    notAPlace('high_shaky', 'heart_lake'),
    notAPlace('high_struck', 'high_divide'),
    notAPlace('high_fatal', 'high_divide'),
    notAPlace('basin_clean', 'lunch_lake'),
    notAPlace('basin_shaky', 'lunch_lake'),
    notAPlace('basin_slip', 'lunch_lake'),
    notAPlace('basin_sprain', 'lunch_lake'),
  ]);
});
