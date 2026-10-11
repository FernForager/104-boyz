// tools/shots.mjs, the parts that need no browser (S5 SPEC 6.4): the
// sizes and their safe areas, the file names, the S5, S6 and S7 sets and
// the batches' scenarios against the game's own dev routes, badge
// numbering, the WebKit fallback, and what happens without Playwright.
// The pictures themselves are taken in the session (Chromium) and by
// shots.yml (WebKit).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadArt, loadCabin } from '../../tools/pics.mjs';
import { placeParts, cabinParts } from '../../tools/looks.mjs';
import { SIZES, SIZE_ORDER, SETS, SCREEN_SCENARIOS, SCENE_HOURS, PAGE, pageOf, PLAYWRIGHT_VERSION, BATCH_SIZE_NAME, OUTCOMES, shotName, pickSizes, safeCss, batchScenarios, claimBadges, missingMessage, launch, main, readyOf, CABIN_HOURS, CABIN_SKIES, LAKE_TIMES, KEYBOARD_PT, QUIZ_IDS, INSPECTOR } from '../../tools/shots.mjs';
import { DEV_HOURS, DEV_SKIES } from '../../web/js/ui/cabin.js';
import { cabinAlt } from '../../web/js/gfx/cabin.js';
import { INTRO_FORMS } from '../../web/js/ui/choices.js';
import { FIXTURES } from '../../web/js/ui/frame.js';
import { devRoute } from '../../web/js/ui/app.js';
import { frameLayout, HOURS } from '../../web/js/ui/frame.js';
import { keyName, setChannel } from '../../web/js/platform/storage.js';
import { TEXT_MODES } from '../../web/js/ui/textsize.js';
import { readText, batchLines } from '../../tools/text.mjs';

test("the sizes: the SE, the iPhone 17 and the Pro Max in portrait, each with its dpr and safe areas, and the frame's space check agrees about the fold", () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(SIZES).map(([k, s]) => [k, [s.width, s.height, s.dpr, ...s.safe]])),
    { se: [375, 667, 2, 20, 0], 17: [402, 874, 3, 62, 34], promax: [440, 956, 3, 62, 34] },
  );
  assert.deepEqual(SIZE_ORDER, ['17', 'se', 'promax'], "the creator's phone first");
  assert.equal(BATCH_SIZE_NAME, '17');
  // The SE is the short screen (the toolbar folds into ≡), the others are tall.
  for (const [k, s] of Object.entries(SIZES)) {
    const l = frameLayout({ width: s.width, height: s.height, dpr: s.dpr, safeTop: s.safe[0], safeBottom: s.safe[1] });
    assert.equal(l.short, k === 'se', k);
  }
  assert.equal(safeCss(SIZES[17]), ':root { --safe-top: 62px; --safe-bottom: 34px; }');
  assert.equal(safeCss(SIZES.se), ':root { --safe-top: 20px; --safe-bottom: 0px; }');
  const tokens = readFileSync(join(ROOT, 'web', 'css', 'tokens.css'), 'utf8');
  assert.match(tokens, /--safe-top: env\(safe-area-inset-top, 0px\);/, 'the variables the page reads its insets into');
  assert.match(tokens, /--safe-bottom: env\(safe-area-inset-bottom, 0px\);/);
});

test('--sizes picks in the shooting order; an unknown size is an error; the file names carry the number, the name and the engine', () => {
  assert.deepEqual(pickSizes(null), ['17', 'se', 'promax']);
  assert.deepEqual(pickSizes('promax,se'), ['se', 'promax']);
  assert.deepEqual(pickSizes('17'), ['17']);
  assert.throws(() => pickSizes('se,ipad'), /no size "ipad"/);
  assert.equal(shotName(3, 'rim_day', 'chromium'), '03-rim_day.chromium.png');
  assert.equal(shotName(12, 'trail-menu', 'webkit'), '12-trail-menu.webkit.png');
});

test("the S5 set: Deer Lake and the rim at day, dusk and night, the #frame fixture, the High Divide by day and at dusk, the SE's fold, the Plain font; every route is one the game opens", () => {
  const s5 = SETS.s5;
  assert.deepEqual(
    s5.map((s) => s.name),
    ['deer_lake_day', 'deer_lake_dusk', 'deer_lake_night', 'rim_day', 'rim_dusk', 'rim_night', 'frame_fixture_day', 'high_divide_day', 'high_divide_dusk', 'menu_fold', 'plain_text'],
  );
  assert.equal(new Set(s5.map((s) => s.name)).size, s5.length, 'names are unique');
  const text = readText(ROOT);
  const recipes = JSON.parse(readFileSync(join(ROOT, 'content', 'art', 'recipes.json'), 'utf8'));
  // The batches' S5 scenarios: the trail's first five and the guest book (S6's follow them; their own test is below).
  // Rewritten in S7: a fresh phone opens on the lockbox, so the guest book is its own dev route (#guestbook), and
  // the cabin's screens, the mailbox, the lockbox and the title page (the loading art) have scenarios too.
  const s5batch = [...SCREEN_SCENARIOS.trail.slice(0, 5), ...SCREEN_SCENARIOS.guestbook];
  assert.deepEqual(s5batch.map((s) => s.name), ['deer_lake', 'rim', 'sound_off', 'menu', 'frame_fixture', 'guestbook']);
  assert.deepEqual(Object.keys(SCREEN_SCENARIOS), ['trail', 'guestbook', 'home', 'mailbox', 'lockbox', 'title']);
  for (const s of [...s5, ...s5batch]) {
    assert.ok(text.scope.screens.includes(s.screen), `${s.name}: ${s.screen} is a preview screen`);
    assert.ok(s.hash, `${s.name}: every S5 scenario opens on a dev route`);
    // The game opens it only in debug mode, on a build with the trail.
    assert.equal(devRoute({ hash: s.hash, debug: false, trail: true }), null, `${s.name}: nothing without debug mode`);
    const r = devRoute({ hash: s.hash, debug: true, trail: true });
    assert.ok(r, `${s.name}: ${s.hash} is a dev route`);
    if (r.stop) {
      assert.equal(r.stop.set, 'deer_lake_rim');
      assert.ok(['deer_lake', 'rim'].includes(r.stop.id), s.name);
      assert.ok(HOURS.includes(r.hour), `${s.name}: the hour ${r.hour}`);
    } else assert.deepEqual(r, s.screen === 'guestbook' ? { guestbook: true } : { frame: true }, s.name);
    for (const step of s.steps || []) {
      if (step.startsWith('pic:')) assert.ok(recipes.places[step.slice(4)], `${s.name}: ${step} is a place the check view offers`);
      else if (step.startsWith('hour:')) assert.ok(SCENE_HOURS.includes(step.slice(5)), step);
      else assert.ok(['menu', 'sound'].includes(step), step);
    }
  }
  assert.deepEqual(SCENE_HOURS, [...HOURS], "the check view's hour buttons, in its order");
  assert.deepEqual(s5.find((s) => s.name === 'menu_fold').sizes, ['se'], 'the fold is the short screen');
  const plain = s5.find((s) => s.name === 'plain_text');
  assert.ok(TEXT_MODES.includes(/** @type {string} */ (plain.store.text)), 'a mode the text control has');
  assert.equal(PAGE, '/preview/?debug=1');
  // The saved choices the shots write are the page's own storage names.
  setChannel('preview');
  try {
    assert.equal(keyName('text'), 'oph.preview.text');
    assert.equal(keyName('marks'), 'oph.preview.marks');
  } finally {
    setChannel(null);
  }
  const src = readFileSync(join(ROOT, 'tools', 'shots.mjs'), 'utf8');
  assert.ok(src.includes('localStorage.setItem(`oph.preview.${k}`'), "the shots write preview's names");
  assert.ok(src.includes("store: { marks: 'off', ...(sc.store || {}) }"), 'the debug marks off, so the words show as a player sees them');
});

test("the S6 set (track A): main's title page at /, and palette A's Deer Lake and rim at all four hours; every stop route is one the game opens", () => {
  const s6 = SETS.s6;
  const names = s6.map((s) => s.name);
  assert.deepEqual(names.slice(0, 9), ['title_main', 'deer_lake_day', 'deer_lake_dusk', 'deer_lake_blue', 'deer_lake_night', 'rim_day', 'rim_dusk', 'rim_blue', 'rim_night']);
  assert.equal(new Set(names).size, s6.length, 'names are unique');
  const title = s6[0];
  assert.deepEqual([title.page, title.hash, title.screen, pageOf(title)], ['/', '', 'title', '/'], "main's own page, no debug mode");
  const text = readText(ROOT);
  assert.ok(text.scope.main.screens.includes('title'), "the title is one of main's screens");
  for (const s of s6.slice(1, 9)) {
    assert.equal(pageOf(s), PAGE, `${s.name}: preview, in debug mode`);
    const r = devRoute({ hash: s.hash, debug: true, trail: true });
    assert.ok(r && r.stop && ['deer_lake', 'rim'].includes(r.stop.id) && HOURS.includes(r.hour), `${s.name}: ${s.hash}`);
  }
  assert.deepEqual([...new Set(s6.slice(1, 9).map((s) => devRoute({ hash: s.hash, debug: true, trail: true }).hour))], [...HOURS], 'every hour');
  // Track C: the fork's states, each outcome, the Looks, Plain and the four-choice fixture, each a route the game
  // opens (a stop of the sample set, or #frame) and steps the harness knows.
  assert.deepEqual(names.slice(9), ['fork_day', 'fork_night', 'fork_more', 'fork_confirm', 'why_high', 'why_basin', 'compass_rest', ...OUTCOMES.map((o) => `outcome_${o}`), 'look_privy', 'look_lunch_lake', 'look_alt', 'fork_plain', 'frame_four']);
  const stops = JSON.parse(readFileSync(join(ROOT, 'content', 'stops', 'deer_lake_rim.json'), 'utf8')).stops;
  assert.deepEqual(stops.filter((st) => st.outcome).map((st) => st.id), [...OUTCOMES], 'every outcome stop of the sample set');
  const kinds = JSON.parse(readFileSync(join(ROOT, 'content', 'art', 'hotspots.json'), 'utf8')).kinds;
  for (const s of s6.slice(9)) {
    const r = devRoute({ hash: s.hash, debug: true, trail: true });
    assert.ok(r, `${s.name}: ${s.hash} is a dev route`);
    if (r.stop) assert.ok(stops.some((st) => st.id === r.stop.id), `${s.name}: a stop of the set`);
    for (const step of s.steps || []) {
      if (step.startsWith('look:')) assert.equal(kinds[step.slice(5)].look, true, `${s.name}: ${step} is a looked kind`);
      else if (step.startsWith('fixture:')) assert.ok(FIXTURES.includes(step.slice(8)), step);
      else assert.ok(/^(choice|info):\d$/.test(step) || ['yes', 'alt'].includes(step), step);
    }
    if (s.store && s.store.odds_seen) assert.deepEqual(s.store.odds_seen, [...INTRO_FORMS], `${s.name}: every intro seen`);
  }
  assert.deepEqual(s6.find((s) => s.name === 'fork_more').store, undefined, 'the SE with its fatal intro: it continues (▾)');
  assert.equal(s6.find((s) => s.name === 'compass_rest').quick, true, 'shot at once, before the outcome');
  const src = readFileSync(join(ROOT, 'tools', 'shots.mjs'), 'utf8');
  for (const sel of ["'.scenes-fixtures button'", "'.frame .choice'", "'.frame .choice-info'", "'.confirm-yes'", '`.look[data-kind="${kind}"]`']) assert.ok(src.includes(sel), `the harness taps ${sel}`);
});

test("S6's batch scenarios (track D): the fork with each odds intro in its turn, the confirm, both Why sheets, the compass, every outcome, every looked kind where it is drawn and the alt Look at every hour, each a route the game opens", () => {
  const s6 = SCREEN_SCENARIOS.trail.slice(5);
  const allLooked = Object.entries(JSON.parse(readFileSync(join(ROOT, 'content', 'art', 'hotspots.json'), 'utf8')).kinds)
    .filter(([, k]) => /** @type {any} */ (k).look)
    .map(([kind]) => kind);
  // The looked kinds a trail picture draws; from S7 the cabin draws the others (the tub and the register
  // post), and they are every looked kind no trail picture has: their shots are the s7 set's (track C).
  const onTrail = new Set(placeParts(loadArt()).flatMap((p) => p.kinds));
  const looked = allLooked.filter((k) => onTrail.has(k));
  const cabinKinds = new Set(cabinParts(loadCabin()).flatMap((p) => p.kinds));
  assert.deepEqual(allLooked.filter((k) => !onTrail.has(k)), ['tub', 'register_post'], 'the looked kinds no trail picture draws');
  for (const k of allLooked.filter((x) => !onTrail.has(x))) assert.ok(cabinKinds.has(k), `${k}: the cabin draws it`);
  assert.deepEqual(s6.map((s) => s.name), [
    ...INTRO_FORMS.map((f) => `fork_intro_${f}`),
    'fork_confirm',
    'why_high',
    'why_basin',
    'compass_rest',
    ...OUTCOMES.map((o) => `outcome_${o}`),
    ...looked.map((k) => `look_${k}`),
    'alt_rim',
    'alt_deer_lake',
    'alt_dusk',
    'alt_blue',
    'alt_night',
  ], 'every looked kind a trail picture draws has its scenario');
  assert.equal(new Set(SCREEN_SCENARIOS.trail.map((s) => s.name)).size, SCREEN_SCENARIOS.trail.length, 'names are unique');
  // Each intro shot has seen exactly the forms before it (one intro a stop, the most serious unseen first).
  INTRO_FORMS.forEach((f, k) => assert.deepEqual(s6[k].store, { odds_seen: INTRO_FORMS.slice(0, k) }, f));
  const stops = JSON.parse(readFileSync(join(ROOT, 'content', 'stops', 'deer_lake_rim.json'), 'utf8')).stops;
  const kinds = JSON.parse(readFileSync(join(ROOT, 'content', 'art', 'hotspots.json'), 'utf8')).kinds;
  for (const s of s6) {
    assert.equal(s.screen, 'trail', s.name);
    assert.equal(pageOf(s), PAGE, `${s.name}: preview, in debug mode`);
    assert.equal(devRoute({ hash: s.hash, debug: false, trail: true }), null, `${s.name}: nothing without debug mode`);
    const r = devRoute({ hash: s.hash, debug: true, trail: true });
    assert.ok(r && r.stop && r.stop.set === 'deer_lake_rim' && stops.some((st) => st.id === r.stop.id), `${s.name}: a stop of the sample set`);
    assert.ok(HOURS.includes(r.hour), `${s.name}: the hour ${r.hour}`);
    for (const step of s.steps || []) {
      if (step.startsWith('look:')) assert.equal(kinds[step.slice(5)].look, true, `${s.name}: ${step} is a looked kind`);
      else assert.ok(/^(choice|info):\d$/.test(step) || ['yes', 'alt'].includes(step), step);
    }
  }
  assert.deepEqual(s6.filter((s) => s.name.startsWith('alt_')).map((s) => devRoute({ hash: s.hash, debug: true, trail: true }).hour), ['day', 'day', 'dusk', 'blue', 'night'], "the alt Look's every hour line");
  assert.equal(s6.find((s) => s.name === 'compass_rest').quick, true, 'shot at once, before the outcome');
  // The batches meet the trail's scenarios in this order: S5's five, then S6's.
  const b005 = batchLines(readText(ROOT), 'B005').lines;
  assert.deepEqual(batchScenarios(b005).map((s) => s.name), SCREEN_SCENARIOS.trail.map((s) => s.name));
});

test("the S7 set (track C): the cabin at every hour, clear, in rain and in fog; first launch; each lockbox step; the guest book and its keyboard; the mailbox, a Look, a place not open yet, a long press, the alt Look; the loading art; every route one the game opens, at a fixed time at the lake", () => {
  const s7 = SETS.s7;
  const names = s7.map((s) => s.name);
  assert.deepEqual(CABIN_HOURS, [...DEV_HOURS], "the #home route's hours, dawn first");
  assert.deepEqual(CABIN_HOURS, ['dawn', 'day', 'dusk', 'blue', 'night']);
  assert.deepEqual(CABIN_SKIES, ['clear', 'rain', 'fog']);
  for (const sky of CABIN_SKIES) assert.ok(DEV_SKIES.includes(sky), sky);
  assert.deepEqual(names, [
    ...CABIN_HOURS.flatMap((h) => CABIN_SKIES.map((sky) => `cabin_${h}_${sky}`)),
    'first',
    'first_drawin',
    'lockbox_q1',
    'lockbox_q2',
    'lockbox_q3',
    'lockbox_open3',
    'lockbox_open0',
    'lockbox_plain',
    'guestbook',
    'guestbook_keyboard',
    'mailbox',
    'look_tub',
    'soon_shed',
    'press_car',
    'alt_night',
    'loading',
  ]);
  assert.equal(new Set(names).size, s7.length, 'names are unique');
  // The lake's times: one an hour, in the day's order, each a real time.
  assert.deepEqual(Object.keys(LAKE_TIMES), [...CABIN_HOURS]);
  const ms = CABIN_HOURS.map((h) => Date.parse(LAKE_TIMES[h]));
  assert.ok(ms.every(Number.isFinite) && ms.every((v, k) => k === 0 || v > ms[k - 1]), 'dawn to night, in order');
  assert.deepEqual(Object.keys(KEYBOARD_PT).sort(), Object.keys(SIZES).sort(), "the keyboard's stand-in at every size");
  const places = loadCabin().places;
  const text = readText(ROOT);
  for (const s of s7) {
    assert.ok(text.scope.screens.includes(s.screen), `${s.name}: ${s.screen} is a preview screen`);
    if (s.name === 'loading') continue;
    assert.equal(pageOf(s), PAGE, `${s.name}: preview, in debug mode`);
    assert.ok(s.at && Number.isFinite(Date.parse(s.at)), `${s.name}: the page's clock is fixed`);
    assert.equal(devRoute({ hash: s.hash, debug: false, trail: true }), null, `${s.name}: nothing without debug mode`);
    const r = devRoute({ hash: s.hash, debug: true, trail: true });
    assert.ok(r, `${s.name}: ${s.hash} is a dev route`);
    if (s.name.startsWith('cabin_')) {
      const [, hour, sky] = s.name.split('_');
      assert.deepEqual(r, { home: { hour, sky, moon: null } }, s.name);
      assert.equal(s.at, LAKE_TIMES[hour], `${s.name}: at its hour's time`);
    }
    if (r.home) assert.ok(r.home.hour && r.home.sky, `${s.name}: an hour and a sky the cabin knows`);
    else assert.ok(r.first || r.lockbox || r.guestbook, s.name);
    for (const step of s.steps || []) {
      if (step.startsWith('place:')) assert.ok(['place', 'look'].includes(places[step.slice(6)].kind), `${s.name}: ${step} is a place or a Look`);
      else if (step.startsWith('press:')) assert.equal(places[step.slice(6)].kind, 'place', `${s.name}: ${step} is a named place`);
      else assert.ok(['menu', 'sound', 'alt', 'keyboard'].includes(step), step);
    }
    if (s.motion) assert.equal(s.name, 'first_drawin', 'Reduce Motion is on but for the draw-in');
  }
  assert.deepEqual(s7.find((s) => s.name === 'first_drawin').sizes, ['17']);
  assert.deepEqual(['lockbox_q1', 'lockbox_q2', 'lockbox_q3', 'lockbox_open3', 'lockbox_open0'].map((n) => devRoute({ hash: s7.find((s) => s.name === n).hash, debug: true, trail: true }).lockbox), [{ q: 1 }, { q: 2 }, { q: 3 }, { open: 3 }, { open: 0 }]);
  assert.deepEqual(s7.find((s) => s.name === 'lockbox_plain').store, { text: 'plain' });
  assert.deepEqual(s7.find((s) => s.name === 'guestbook_keyboard').steps, ['keyboard']);
  // The long press: the line inspector (debug mode's, which owns every long press on words) held back.
  const press = s7.find((s) => s.name === 'press_car');
  assert.deepEqual(press.block, [INSPECTOR]);
  assert.ok(existsSync(join(ROOT, 'web', INSPECTOR)), "the inspector's module");
  // The loading art: preview's own page, the game held back, ready when the cover has drawn in.
  const loading = s7.at(-1);
  assert.deepEqual([loading.page, loading.hash, loading.screen, loading.block], ['/preview/', '', 'title', ['data/rules.json']]);
  // What each scenario waits for before its picture.
  assert.equal(readyOf(loading), '.plate:not(.drawing)');
  assert.equal(readyOf(s7[0]), '.cabin[data-key] .status-line');
  assert.equal(readyOf({ name: 'f', screen: 'lockbox', hash: '#first' }), '.cabin[data-key] .status-line', 'the shut lockbox is the cabin');
  assert.equal(readyOf({ name: 'q', screen: 'lockbox', hash: '#lockbox&q=1' }), '.porch[data-key] .status-line');
  assert.equal(readyOf({ name: 'g', screen: 'guestbook', hash: '#guestbook' }), '.porch #gb-name');
  assert.equal(readyOf({ name: 'x', screen: 'trail', hash: '#frame' }), '#frame-sheet .status-line');
  assert.equal(readyOf(SETS.s5[0]), '.frame .status-line');
  assert.match(readyOf({ name: 'x', screen: 'trail', hash: '' }), /#gb-name, \.frame \.status-line, \.cabin \.status-line, \.porch \.status-line/);
  // The harness's own parts the scenarios lean on, and the game's attributes they wait for.
  const src = readFileSync(join(ROOT, 'tools', 'shots.mjs'), 'utf8');
  for (const part of ['context.clock.setFixedTime(new Date(sc.at))', 'context.route(`**/${path}`, () => {})', "reducedMotion: sc.motion ? 'no-preference' : 'reduce'", '`.cabin-place[data-place="${step.slice(6)}"]`', 'PRESS_MS + 200', 'KEYBOARD_VAR', "'[data-t], [data-t-aria], [data-t-img][aria-label]'"]) assert.ok(src.includes(part), part);
  for (const f of ['cabin.js', 'porch.js']) assert.ok(readFileSync(join(ROOT, 'web', 'js', 'ui', f), 'utf8').includes("host.setAttribute('data-key'"), `${f} marks its composed picture`);
});

test("S7's batch scenarios (track C): each B002 and B003 line's screen has scenarios, so it shows in one or gets a mock; every question of the quiz asked first, both replies and both closings; the alt Look under every sky and hour line; each Look; the mailbox in both modes; the loading art", () => {
  const text = readText(ROOT);
  const b002 = batchLines(text, 'B002').lines;
  const b003 = batchLines(text, 'B003').lines;
  for (const l of [...b002, ...b003]) assert.ok((SCREEN_SCENARIOS[l.screen] || []).length, `${l.id}: its screen (${l.screen}) has scenarios`);
  assert.deepEqual(batchScenarios(b002).map((s) => `${s.screen}:${s.name}`), [...SCREEN_SCENARIOS.home, ...SCREEN_SCENARIOS.mailbox, ...SCREEN_SCENARIOS.title].map((s) => `${s.screen}:${s.name}`));
  assert.deepEqual(batchScenarios(b003).map((s) => `${s.screen}:${s.name}`), [...SCREEN_SCENARIOS.guestbook, ...SCREEN_SCENARIOS.lockbox].map((s) => `${s.screen}:${s.name}`));
  const all = [...SCREEN_SCENARIOS.guestbook, ...SCREEN_SCENARIOS.home, ...SCREEN_SCENARIOS.mailbox, ...SCREEN_SCENARIOS.lockbox];
  for (const s of all) {
    assert.equal(pageOf(s), PAGE, s.name);
    assert.ok(s.at, `${s.name}: the page's clock is fixed`);
    assert.ok(devRoute({ hash: s.hash, debug: true, trail: true }), `${s.name}: ${s.hash} is a dev route`);
  }
  for (const k of ['home', 'mailbox', 'lockbox']) assert.equal(new Set(SCREEN_SCENARIOS[k].map((s) => s.name)).size, SCREEN_SCENARIOS[k].length, `${k}: names are unique`);
  // The lockbox: every question of the pool asked first, in the file's order, its words all in B003.
  const quiz = JSON.parse(readFileSync(join(ROOT, 'content', 'quiz', 'locals.json'), 'utf8'));
  assert.deepEqual(QUIZ_IDS, quiz.questions.map((q) => q.id));
  const ids = new Set(b003.map((l) => l.id));
  for (const id of QUIZ_IDS) {
    const sc = SCREEN_SCENARIOS.lockbox.find((s) => s.name === `ask_${id}`);
    assert.deepEqual(devRoute({ hash: sc.hash, debug: true, trail: true }), { lockbox: { ask: id } }, id);
    for (const part of ['ask', 'a0', 'a1', 'a2']) assert.ok(ids.has(`first.lockbox.${id}.${part}`), `${id}.${part} is in B003`);
  }
  const lb = (n) => devRoute({ hash: SCREEN_SCENARIOS.lockbox.find((s) => s.name === n).hash, debug: true, trail: true });
  assert.deepEqual([lb('first'), lb('q2'), lb('q3'), lb('open3'), lb('open0')], [{ first: true }, { lockbox: { q: 2 } }, { lockbox: { q: 3 } }, { lockbox: { open: 3 } }, { lockbox: { open: 0 } }]);
  // The cabin's alt Look: every alt line of B002's on the cabin is one some alt scenario's scene says.
  const said = new Set();
  for (const s of SCREEN_SCENARIOS.home.filter((x) => (x.steps || []).includes('alt'))) {
    const { hour, sky, moon } = devRoute({ hash: s.hash, debug: true, trail: true }).home;
    for (const id of cabinAlt({ hour, sky: sky === 'fog' ? 'clear' : sky, fog: sky === 'fog', moonShown: moon !== null })) said.add(id);
  }
  const altLines = b002.filter((l) => l.screen === 'home' && l.id.startsWith('alt.')).map((l) => l.id);
  assert.ok(altLines.length >= 12);
  assert.deepEqual(altLines.filter((id) => !said.has(id)), [], 'every alt line is said in some scenario');
  // Each Look and a place not open yet, where the cabin draws them.
  const places = loadCabin().places;
  const tapped = SCREEN_SCENARIOS.home.flatMap((s) => (s.steps || []).filter((st) => st.startsWith('place:')).map((st) => st.slice(6)));
  const looks = Object.keys(places).filter((k) => places[k].kind === 'look');
  for (const k of looks) assert.ok(tapped.includes(k) && b002.some((l) => l.id === `look.${k}`), `${k}: its Look is tapped and in B002`);
  assert.ok(tapped.some((k) => places[k].kind === 'place' && !['next', 'mailbox'].includes(places[k].opens)), 'a place not open yet (home.soon)');
  assert.deepEqual(SCREEN_SCENARIOS.mailbox.map((s) => [s.steps, s.store]), [[['menu'], undefined], [['menu'], { text: 'plain' }]], 'the mailbox in each text mode');
  assert.deepEqual(SCREEN_SCENARIOS.title.map((s) => [s.page, s.block]), [['/preview/', ['data/rules.json']]], 'the loading art, the game held back');
});

test("a batch's scenarios and badges: each screen's scenarios in order, each line badged once where it first shows, numbered by its place in the batch", () => {
  const lines = [
    { n: 1, id: 'trail.walk_on', screen: 'trail' },
    { n: 2, id: 'trail.sol_duc_trailhead.lot', screen: 'trail' },
    { n: 3, id: 'first.guestbook.sign', screen: 'guestbook' },
    { n: 4, id: 'trail.status.sound_off', screen: 'trail' },
    { n: 5, id: 'credits.people', screen: 'credits' },
  ];
  const scs = batchScenarios(lines);
  assert.deepEqual(
    scs.map((s) => `${s.screen}:${s.name}`),
    // S6 (track D): the fork's scenarios follow S5's five on the trail.
    ['trail:deer_lake', 'trail:rim', 'trail:sound_off', 'trail:menu', 'trail:frame_fixture', ...SCREEN_SCENARIOS.trail.slice(5).map((s) => `trail:${s.name}`), 'guestbook:guestbook'],
    'a screen with no scenario (credits) has none: its lines get mocks',
  );
  const claimed = new Set();
  const first = claimBadges(lines, 'trail', { 'trail.status.sound_on': [1, 1, 1, 1], 'trail.walk_on': [0, 800, 370, 52], 'first.guestbook.sign': [0, 0, 1, 1] }, claimed);
  assert.deepEqual(first, [{ n: 1, id: 'trail.walk_on', box: [0, 800, 370, 52] }], "only the batch's lines, on the scenario's screen");
  const second = claimBadges(lines, 'trail', { 'trail.status.sound_off': [300, 60, 80, 20], 'trail.walk_on': [0, 800, 370, 52] }, claimed);
  assert.deepEqual(second, [{ n: 4, id: 'trail.status.sound_off', box: [300, 60, 80, 20] }], 'a line already badged is not badged again');
  assert.deepEqual([...claimed], ['trail.walk_on', 'trail.status.sound_off']);
  // B004's lines are all on the trail.
  const b004 = batchLines(readText(ROOT), 'B004').lines;
  assert.ok(batchScenarios(b004).every((s) => s.screen === 'trail'));
});

test('WebKit first, falling back to Chromium with a warning where it is not installed; an unknown engine is refused', async () => {
  const launched = [];
  const browser = (name) => ({ version: () => `${name} 1.0`, close: async () => {} });
  const pw = (webkitOk) => ({
    webkit: { launch: async () => (webkitOk ? (launched.push('webkit'), browser('webkit')) : Promise.reject(new Error("Executable doesn't exist at /x/pw_run.sh\nmore"))) },
    chromium: { launch: async () => (launched.push('chromium'), browser('chromium')) },
  });
  const warnings = [];
  const a = await launch(pw(true), 'webkit', (m) => warnings.push(m));
  assert.deepEqual([a.engine, a.version, warnings.length], ['webkit', 'webkit 1.0', 0]);
  const b = await launch(pw(false), 'webkit', (m) => warnings.push(m));
  assert.deepEqual([b.engine, b.version], ['chromium', 'chromium 1.0']);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /^shots: WebKit isn't available here \(Executable doesn't exist at \/x\/pw_run\.sh\); taking Chromium pictures instead\. Safari's own come from \.github\/workflows\/shots\.yml: it runs when it \(or this tool\) lands on preview, and by hand from Actions once S6 puts it on main\.$/);
  const c = await launch(pw(true), 'chromium', (m) => warnings.push(m));
  assert.equal(c.engine, 'chromium');
  assert.deepEqual(launched, ['webkit', 'chromium', 'chromium']);
  await assert.rejects(launch(pw(true), 'firefox', () => {}), /no engine "firefox"/);
});

test('without Playwright the tool says how to get it and exits 2; bad flags exit 1, before looking for it', async () => {
  const errors = [];
  let loads = 0;
  const load = async () => {
    loads++;
    return null;
  };
  assert.equal(await main(['--set', 's5'], { load, error: (s) => errors.push(s), log: () => {} }), 2);
  assert.equal(loads, 1);
  assert.equal(errors.join('\n'), missingMessage());
  assert.match(missingMessage(), new RegExp(`npm install --no-save --ignore-scripts playwright@${PLAYWRIGHT_VERSION.replace(/\./g, '\\.')}`));
  assert.match(missingMessage(), /npx -y playwright@1\.56\.1 install webkit chromium/);
  assert.match(missingMessage(), /NODE_PATH/);
  assert.equal(await main(['--sizes', 'tablet'], { load, error: () => {}, log: () => {} }), 1);
  assert.equal(await main(['--engine', 'firefox'], { load, error: () => {}, log: () => {} }), 1);
  assert.equal(loads, 1, 'bad flags fail before Playwright is looked for');
  // Playwright is never a dependency (BUILD_PLAN 2.1).
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.ok(!JSON.stringify(pkg).includes('playwright'));
  assert.equal(pkg.scripts.shots, 'node tools/shots.mjs');
});

test('shots.yml takes the WebKit set when it (or the tool) lands on preview, and by hand: read-only, the pinned Node and Playwright, the artifact kept 30 days', () => {
  const yml = readFileSync(join(ROOT, '.github', 'workflows', 'shots.yml'), 'utf8');
  const checks = readFileSync(join(ROOT, '.github', 'workflows', 'checks.yml'), 'utf8');
  // GitHub dispatches a workflow by hand only from the default branch: until
  // S6 puts this file on main, a push to preview that brings it (or the tool)
  // is what runs it, and nothing else does.
  assert.match(
    yml,
    /^on:\n {2}push:\n {4}branches: \[preview\]\n {4}paths:\n {6}- \.github\/workflows\/shots\.yml\n {6}- tools\/shots\.mjs\n {2}workflow_dispatch:\n(?! )/m,
    'on its own landing on preview, else by hand',
  );
  assert.ok(!/pull_request|schedule|workflow_run|branches: \[main/.test(yml), 'no other trigger');
  assert.match(yml, /^permissions:\n {2}contents: read\n/m);
  const node = /node-version: (\S+)/.exec(checks)[1];
  assert.ok(yml.includes(`node-version: ${node}`), 'the same Node as the checks');
  assert.ok(yml.includes('npm ci --ignore-scripts'));
  assert.ok(yml.includes(`npm install --no-save --ignore-scripts --no-audit --no-fund playwright@${PLAYWRIGHT_VERSION}`), 'Playwright fetched for the run, never saved');
  assert.ok(yml.includes(`npx -y playwright@${PLAYWRIGHT_VERSION} install --with-deps webkit`));
  assert.ok(yml.indexOf('npm run build') < yml.indexOf('node tools/shots.mjs --engine webkit --set s5'));
  assert.match(yml, /uses: actions\/upload-artifact@v7\n {8}with:\n {10}name: shots\n {10}path: out\/shots\/\n {10}retention-days: 30\n/);
  assert.ok(!/contents: write|pages: write|id-token/.test(yml), 'it writes nothing back');
});
