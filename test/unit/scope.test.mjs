// The scope file (BUILD_PLAN 3.4, 3.6, 10.6, S4; GAME_DESIGN 3.6, 4.3): it
// validates against its schema, every switch is in tools/scope.mjs's
// registry with its doc, every section ships with a known screen, and every
// id it names resolves in the park.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { validate } from '../../tools/schema.mjs';
import { readSchemas, compileSources, readSources } from '../../tools/content.mjs';
import { SWITCHES, SECTIONS, checkScope, ships, switchValue } from '../../tools/scope.mjs';
import { mergePark, readPark } from '../../tools/graphlint.mjs';
import { compileArt, cabinSwitches } from '../../tools/build.mjs';
import { readText } from '../../tools/text.mjs';

const SCOPE = JSON.parse(readFileSync(join(ROOT, 'content', 'scope', 'm1a.json'), 'utf8'));
const schema = readSchemas(ROOT)['scope.schema.json'];

test('the scope file validates (J01) and passes R01 against the registry', () => {
  assert.deepEqual(validate(schema, SCOPE).errors, []);
  assert.deepEqual(checkScope(SCOPE), []);
  const { problems } = compileSources({ sources: readSources(ROOT), schemas: readSchemas(ROOT), screens: SCOPE.screens });
  assert.deepEqual(problems.filter((p) => p.file === 'content/scope/m1a.json'), []);
});

test("every switch of BUILD_PLAN 3.6 is in the file and the registry, with its doc and the session that reads it", () => {
  assert.deepEqual(Object.keys(SCOPE.switches).sort(), Object.keys(SWITCHES).sort());
  for (const [k, s] of Object.entries(SCOPE.switches)) {
    assert.match(s.doc, /BUILD_PLAN|GAME_DESIGN/, `${k} names its doc`);
    assert.match(SWITCHES[k].reads, /^S\d+[ab]?$/, `${k}: the session that first reads it`);
  }
  assert.equal(switchValue(SCOPE, 'wic_phone'), false);
  assert.equal(switchValue(SCOPE, 'door.drive_in'), true);
  assert.deepEqual(switchValue(SCOPE, 'money'), { wallet: true, basic_and_nice: true });
  assert.deepEqual(switchValue(SCOPE, 'minigames'), ['bear_can', 'alpenglow', 'huckleberries', 'burgers']);
  assert.equal(switchValue(SCOPE, 'bonfire_lily_weight'), 0);
  assert.throws(() => switchValue(SCOPE, 'jetpack'), /no switch "jetpack"/);
  assert.deepEqual(SCOPE.months, [8, 9], 'August and September only (3.6)');
  assert.deepEqual(SCOPE.main.screens, ['app', 'debug', 'title'], "main's screens don't move in S4");
});

test('R01 catches a switch the registry lacks, a missing one, a wrong kind, a missing doc and an unknown section', () => {
  const bad = structuredClone(SCOPE);
  bad.switches.jetpack = { on: true, doc: 'BUILD_PLAN 3.6' };
  delete bad.switches.crew;
  bad.switches.wic_phone = { value: 'look', doc: 'BUILD_PLAN 3.6' };
  bad.switches.peak = { value: 'look', doc: '' };
  bad.switches.beer_cooler = { on: true, doc: 'BUILD_PLAN 3.6' };
  bad.ships.weather = [];
  delete bad.ships.drives;
  bad.main.screens.push('plan');
  const msgs = checkScope(bad).map((p) => `${p.path}: ${p.msg}`);
  for (const want of [/switches\.jetpack: "jetpack" is not a switch/, /switches: the switch "crew" is missing/, /switches\.wic_phone: is an on switch/, /switches\.wic_phone: has "value"/, /switches\.peak: needs its doc/, /switches\.beer_cooler: needs "overnight_only"/, /ships\.weather: "weather" is not a data section/, /ships: the section "drives" is missing/, /main\.screens: "plan" is not one of the screens/]) assert.ok(msgs.some((m) => want.test(m)), `${want}: ${msgs.join(' | ')}`);
});

test('ships: the park ships with the map screen, and from S6 with the trail, as the odds do; from S7 the sun table, the climate and the home section with the home, the quiz with the lockbox; every other section with nothing yet (BUILD_PLAN S4, S6, S7)', () => {
  assert.deepEqual(Object.keys(SCOPE.ships).sort(), Object.keys(SECTIONS).sort());
  // Re-pinned in S6: the trail's fork walks the router (the park) and prices its choices (the odds).
  assert.deepEqual(SCOPE.ships.park, ['map', 'trail']);
  assert.deepEqual(SCOPE.ships.odds, ['trail']);
  assert.deepEqual(SECTIONS.odds, { screen: 'trail', session: 'S6' });
  // Re-pinned in S7 (the cabin): its live scene reads the sun table and the climate, its next step the home section.
  const now = { park: ['map', 'trail'], odds: ['trail'], climate: ['home'], sun: ['home'], home: ['home'], quiz: ['lockbox'] };
  assert.deepEqual(SECTIONS.home, { screen: 'home', session: 'S7' });
  for (const [k, v] of Object.entries(SCOPE.ships)) assert.deepEqual(v, now[k] || [], `${k} ships with ${now[k] ? now[k].join(' ') : 'no screen'} in S7`);
  for (const [k, v] of Object.entries(now)) assert.ok(v.includes(SECTIONS[k].screen), `${k} ships with its own screen`);
  assert.equal(ships(SCOPE, 'park', ['app', 'map']), true);
  assert.equal(ships(SCOPE, 'park', ['app', 'trail']), true);
  assert.equal(ships(SCOPE, 'odds', ['app', 'map']), false, 'the odds go with the trail alone');
  assert.equal(ships(SCOPE, 'odds', SCOPE.main.screens), false, 'never on main');
  assert.equal(ships(SCOPE, 'park', SCOPE.main.screens), false, 'never on main');
  assert.equal(ships(SCOPE, 'quiz', ['lockbox']), true, 'S7');
  assert.equal(ships(SCOPE, 'quiz', SCOPE.main.screens), false, 'never on main');
  for (const k of ['sun', 'climate', 'home']) assert.equal(ships(SCOPE, k, SCOPE.main.screens), false, `${k}: never on main (until the cabin's promotion)`);
  assert.equal(ships(null, 'park', ['map']), false);
});

test("the park block: 47 places, 5 map-only links, 21 quota camps and 3 desk camps, and every id resolves", () => {
  const p = SCOPE.park;
  assert.equal(p.nodes.length, 47);
  assert.equal(new Set(p.nodes).size, 47);
  assert.equal(p.map_only.length, 5);
  assert.equal(p.camps.length, 21);
  assert.deepEqual(p.desk, ['bruces_roost', 'cat_basin', 'hidden_lake']);
  const { nodes, segs } = mergePark(readPark(ROOT).regions);
  for (const k of ['nodes', 'camps', 'desk', 'never', 'pencil_rows', 'map_looks', 'footnotes', 'phone_only_m1b']) for (const id of p[k]) assert.ok(nodes.has(id) && p.nodes.includes(id), `park.${k}: ${id}`);
  for (const id of p.map_only) assert.ok(segs.has(id), id);
  const research = JSON.parse(readFileSync(join(ROOT, 'design', 'data', 'regions', 'sol_duc_high_divide.json'), 'utf8')).m1a_play_inputs;
  assert.deepEqual(p.nodes, Object.keys(research.places.nodes), "the research's 47 loop places, in its order");
  assert.deepEqual([...p.camps].sort(), Object.keys(research.quota_availability.camps).sort(), 'the 21 quota camps');
  assert.deepEqual(p.desk, research.desk_requests.m1a);
  assert.deepEqual(p.pencil_rows, research.desk_requests.m1b);
  assert.deepEqual(p.phone_only_m1b, research.desk_requests.phone_only_m1b);
  assert.deepEqual(SCOPE.first_trip.never, ['morgenroth_lake']);
  assert.ok(nodes.has(SCOPE.first_trip.trailhead));
});

test("S7: preview's screens gain the home, the lockbox and the mailbox (main's don't move); preview leaves the title page's four lines out, each with its reason; the real moon is on; and the switches S7 reads ship in art.cabin, as the scope says", () => {
  for (const s of ['home', 'lockbox', 'mailbox']) {
    assert.ok(SCOPE.screens.includes(s), s);
    assert.ok(!SCOPE.main.screens.includes(s), `${s}: preview only until the cabin's promotion`);
  }
  assert.deepEqual(SCOPE.main.screens, ['app', 'debug', 'title']);
  const off = SCOPE.channels.preview.off;
  assert.deepEqual(Object.keys(off).sort(), ['title.begin', 'title.begin_note', 'title.start_label', 'title.tagline']);
  const text = readText(ROOT);
  for (const [id, why] of Object.entries(off)) {
    assert.ok(text.lines.has(id), `${id} is still defined (main's page shows it until the cabin's promotion)`);
    assert.ok(Object.prototype.hasOwnProperty.call(SCOPE.main.off, id), `${id}: off main too, so no page shows it`);
    assert.ok(why.length > 20, `${id}: its reason`);
  }
  assert.equal(switchValue(SCOPE, 'real_moon'), true, 'lead call 54: the real moon from S7');
  // The switches S7 reads, into the cabin's display data; each one's value what the cabin draws.
  const s7 = Object.keys(SWITCHES).filter((k) => SWITCHES[k].reads === 'S7').sort();
  assert.deepEqual(s7, ['cabin_seasons', 'chalkboard', 'clam_shovel', 'crew', 'easter_eggs', 'peak', 'real_moon', 'settings', 'wic_phone']);
  const shipped = compileArt({ screens: ['home'] }).cabin.switches;
  assert.deepEqual(shipped, cabinSwitches(SCOPE));
  assert.deepEqual(Object.keys(shipped), s7);
  assert.deepEqual(shipped.cabin_seasons, ['summer'], 'the plate is August');
  assert.equal(compileArt({ screens: ['home'] }).cabin.season, 'summer', "the plate's own season is the switch's");
  assert.deepEqual([shipped.crew, shipped.easter_eggs, shipped.wic_phone], [false, false, false], 'no crew, no egg, no wall phone on the plate');
  assert.deepEqual([shipped.peak, shipped.chalkboard, shipped.clam_shovel], ['look', 'look', 'look'], 'drawn, silent in S7 (lead call 58)');
  const places = compileArt({ screens: ['home'] }).cabin.places;
  for (const k of ['peak', 'chalkboard', 'clam_shovel']) assert.equal(places[k].kind, 'silent', `${k}: a look switch, drawn and silent`);
  // The settings the mailbox builds (sound, text) are on the scope's list; the rest wait for their sessions.
  for (const k of ['sound', 'text']) assert.ok(shipped.settings.includes(k), k);
});
