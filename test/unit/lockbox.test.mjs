// The lockbox (BUILD_PLAN S7 D6; GAME_DESIGN 2.6, 12.3, E.5; decision 45;
// lead call 53): the engine's deal, answers and key, the device record that
// remembers it, and its screens; then the UI's first launch (ui/home.js's
// shut lockbox in ui/cabin.js, ui/lockbox.js and ui/porch.js, the guest book
// on the porch) through a fake DOM.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileContent } from '../../tools/content.mjs';
import { loadContent } from '../../web/js/engine/content.js';
import { newSession, dispatch, screenOf, phaseOf } from '../../web/js/engine/step.js';
import { toSaves, fromSaves, reportState } from '../../web/js/engine/save.js';
import { migrate } from '../../web/js/engine/migrate.js';
import { deepFreeze } from '../../web/js/engine/canon.js';
import { draw } from '../../web/js/engine/rng.js';
import lockbox, { dealQuiz, progress, stepOf, lockboxOpen, OPENED, LINES, QUIZ_STREAM } from '../../web/js/engine/phases/lockbox.js';
import { lockboxActs } from '../../web/js/engine/selfcheck.js';
import { fxContent, play } from './enginefix.mjs';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { readText, bundle, stateOf } from '../../tools/text.mjs';
import { givenNames } from '../../tools/content.mjs';
import { compileArt } from '../../tools/build.mjs';
import { HOME_PHONES } from '../../tools/lint.mjs';
import { scanJs } from '../../tools/textlint.mjs';
import { setBundle } from '../../web/js/text.js';
import { setChannel } from '../../web/js/platform/storage.js';
import { epochDay } from '../../web/js/platform/now.js';
import { plateAnchors, composeCabin } from '../../web/js/gfx/cabin.js';
import { renderCabin, forgetCabin } from '../../web/js/ui/cabin.js';
import { renderLockbox, LOCKBOX_CUES } from '../../web/js/ui/lockbox.js';
import { porchLayout, windowOf, choicesPt, WINDOW, LAYOUT_CHOICES, GUESTBOOK_BELOW_PT, BOX_LINE_PT, CHOICE_PT, BOX_CHROME_FP, MIN_BOX_LINES } from '../../web/js/ui/porch.js';
import { renderGuestbook, pickGiven, randomBelow } from '../../web/js/ui/guestbook.js';
import { frameLayout } from '../../web/js/ui/frame.js';
import { GEOMETRY, wordsFor, fitParas } from '../../tools/t02.mjs';
import { loadFaces, widthOf } from '../../tools/fontmetrics.mjs';
import { createMenu } from '../../web/js/ui/menu.js';
import { installMailbox } from '../../web/js/ui/mailbox.js';
import { fakeDocument } from './textfix.mjs';

const refused = { name: 'EngineError', code: 'refused' };
const invalid = { name: 'EngineError', code: 'invalid' };
const json = (v) => JSON.parse(JSON.stringify(v));

/** The repo's content with the lockbox (its quiz and words), the guest book, home and the trail. */
function quizContent() {
  const { rules, voice, problems } = compileContent({ screens: ['lockbox', 'guestbook', 'home', 'trail'], checkText: false });
  assert.deepEqual(problems, []);
  return loadContent({ rules, voice, rulesHash: 'abcdef012345' });
}
const CONTENT = quizContent();
const QUIZ = CONTENT.quiz();
const PRON = new Set(QUIZ.questions.filter((q) => q.pronunciation).map((q) => q.id));
const right = (id) => QUIZ.questions.find((q) => q.id === id).right;

/** A session at the lockbox after a deal and some answers. */
function dealt(seed = 'K7QM2Q9F', answers = []) {
  let s = dispatch(deepFreeze(newSession(CONTENT)), { t: 'deal', seed }, CONTENT).session;
  for (const a of answers) s = dispatch(deepFreeze(s), { t: 'answer', a }, CONTENT).session;
  return s;
}

// ---- The engine --------------------------------------------------------------

test('the quiz ships with the lockbox: twelve questions, three dealt, the pronunciation rule; its words are voice data, never rules', () => {
  assert.equal(QUIZ.deal, 3);
  assert.equal(QUIZ.questions.length, 12);
  assert.equal(QUIZ.rules.no_two_pronunciations_in_a_row, true);
  assert.deepEqual([...PRON].sort(), ['q_dosewallips', 'q_hoh', 'q_puyallup', 'q_sequim']);
  for (const q of QUIZ.questions) assert.deepEqual(Object.keys(q).sort(), ['answers', 'id', 'indigenous_name', 'pronunciation', 'right'], q.id);
  const v = CONTENT.quizVoice();
  assert.equal(v.right, 'first.lockbox.right');
  assert.equal(v.wrong, 'first.lockbox.wrong');
  assert.deepEqual(v.questions.q_sequim, { ask: 'first.lockbox.q_sequim.ask', answers: ['first.lockbox.q_sequim.a0', 'first.lockbox.q_sequim.a1', 'first.lockbox.q_sequim.a2'] });
  assert.ok(!JSON.stringify(CONTENT.data.rules.quiz).includes('first.'), 'no line id in the rules');
  // A build without the lockbox ships neither.
  const trail = compileContent({ screens: ['trail'], checkText: false });
  assert.equal(trail.rules.quiz, undefined);
  assert.equal(trail.voice.quiz, undefined);
});

test('a fresh device is at the lockbox, shut: one choice, Open the lockbox (a deal the UI completes with a seed)', () => {
  const s = newSession(CONTENT);
  assert.equal(phaseOf(s.state), 'lockbox');
  assert.deepEqual(screenOf(s.state, CONTENT), { phase: 'lockbox', step: 'shut', box: [], choices: [{ act: { t: 'deal' }, label: { id: 'first.lockbox.start' }, enabled: true }] });
  assert.equal(lockbox.level, 'hiker', 'never logged');
  assert.deepEqual([...lockbox.accepts], ['deal', 'answer', 'open']);
  assert.equal(QUIZ_STREAM, 'quiz');
});

test('the deal is a golden for fixed seeds: one draw per pick on the quiz stream, from the questions left in their order', () => {
  const golden = {
    K7QM2Q9F: dealQuiz('K7QM2Q9F', QUIZ),
    '00000000': dealQuiz('00000000', QUIZ),
    ZZZZZZZZ: dealQuiz('ZZZZZZZZ', QUIZ),
  };
  assert.deepEqual(golden, {
    K7QM2Q9F: ['q_camp_robber', 'q_geoduck', 'q_mountain_out'],
    '00000000': ['q_sequim', 'q_rain_forest', 'q_jojos'],
    ZZZZZZZZ: ['q_puyallup', 'q_rain_forest', 'q_jojos'],
  });
  // The rule spelled out for one seed: pick k is draw(seed, 'quiz', k).int(n) over what is left.
  let left = QUIZ.questions.slice();
  const want = [];
  for (let k = 0; k < 3; k++) {
    const last = want.length ? QUIZ.questions.find((q) => q.id === want[want.length - 1]) : null;
    const from = last && last.pronunciation && left.some((q) => !q.pronunciation) ? left.filter((q) => !q.pronunciation) : left;
    const pick = from[draw('00000000', 'quiz', k).int(from.length)];
    want.push(pick.id);
    left = left.filter((q) => q !== pick);
  }
  assert.deepEqual(golden['00000000'], want);
  assert.deepEqual(dealt('K7QM2Q9F').state.device.quiz, { seed: 'K7QM2Q9F', dealt: golden.K7QM2Q9F, answers: [], done: false });
  for (const d of Object.values(golden)) assert.equal(new Set(d).size, 3, 'three different questions');
});

test('over 10,000 seeds: never two pronunciation questions in a row, every question reachable, each within 20% of the uniform count', () => {
  const counts = Object.fromEntries(QUIZ.questions.map((q) => [q.id, 0]));
  const seed = (i) => {
    const digits = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let v = i;
    let s = '';
    for (let k = 0; k < 8; k++) {
      s = digits[v % 32] + s;
      v = Math.floor(v / 32);
    }
    return s;
  };
  const N = 10000;
  for (let i = 0; i < N; i++) {
    const d = dealQuiz(seed(i), QUIZ);
    assert.equal(new Set(d).size, 3);
    for (let k = 1; k < d.length; k++) assert.ok(!(PRON.has(d[k - 1]) && PRON.has(d[k])), `${seed(i)}: ${d.join(' ')}`);
    for (const id of d) counts[id]++;
  }
  const uniform = (N * 3) / QUIZ.questions.length;
  for (const [id, n] of Object.entries(counts)) {
    assert.ok(n > 0, `${id} is reachable`);
    assert.ok(Math.abs(n - uniform) <= uniform * 0.2, `${id}: ${n} against ${uniform}`);
  }
  // Without the rule, the deal is uniform without replacement; with only pronunciation questions left, they follow one another.
  const only = { ...QUIZ, questions: QUIZ.questions.filter((q) => q.pronunciation) };
  assert.equal(dealQuiz('K7QM2Q9F', only).filter((id) => PRON.has(id)).length, 3, 'no other kind left: the rule gives way');
});

test('the ask screens: the intro and Question 1 of 3, then the reply to the last answer; the three answers in their authored order', () => {
  const [q1, q2, q3] = dealQuiz('K7QM2Q9F', QUIZ);
  const v = CONTENT.quizVoice();
  const ask = (id) => v.questions[id];
  const s1 = screenOf(dealt().state, CONTENT);
  assert.deepEqual(s1, {
    phase: 'lockbox',
    step: 'ask',
    q: 1,
    box: [{ id: LINES.intro }, { id: LINES.count, vars: { q: 1 } }, { id: ask(q1).ask }],
    choices: ask(q1).answers.map((id, a) => ({ act: { t: 'answer', a }, label: { id }, enabled: true })),
  });
  const s2 = screenOf(dealt('K7QM2Q9F', [right(q1)]).state, CONTENT);
  assert.deepEqual(s2.box, [{ id: 'first.lockbox.right' }, { id: LINES.count, vars: { q: 2 } }, { id: ask(q2).ask }], 'a right answer: Welcome home.');
  const wrong = (right(q2) + 1) % 3;
  const s3 = screenOf(dealt('K7QM2Q9F', [right(q1), wrong]).state, CONTENT);
  assert.deepEqual(s3.box, [{ id: 'first.lockbox.wrong' }, { id: LINES.count, vars: { q: 3 } }, { id: ask(q3).ask }], 'a wrong one: Nice try, tourist.');
  assert.equal(s3.q, 3);
  assert.equal(stepOf(dealt('K7QM2Q9F', [0, 0]).state, CONTENT), 'ask');
});

test('the closing: all three right, Three for three. Welcome home.; else the reply to the third and Come in anyway; one choice, Take the key', () => {
  const d = dealQuiz('K7QM2Q9F', QUIZ);
  const all = screenOf(dealt('K7QM2Q9F', d.map(right)).state, CONTENT);
  assert.deepEqual(all, { phase: 'lockbox', step: 'open', box: [{ id: LINES.allRight }], choices: [{ act: { t: 'open' }, label: { id: LINES.takeKey }, enabled: true }] });
  // Wrong answers still open it (decision 45): everyone gets in.
  const none = screenOf(dealt('K7QM2Q9F', d.map((id) => (right(id) + 1) % 3)).state, CONTENT);
  assert.deepEqual(none.box, [{ id: 'first.lockbox.wrong' }, { id: LINES.comeIn }]);
  const two = screenOf(dealt('K7QM2Q9F', [right(d[0]), right(d[1]), (right(d[2]) + 1) % 3]).state, CONTENT);
  assert.deepEqual(two.box, [{ id: 'first.lockbox.wrong' }, { id: LINES.comeIn }], 'two of three is not three for three');
  const last = screenOf(dealt('K7QM2Q9F', [(right(d[0]) + 1) % 3, right(d[1]), right(d[2])]).state, CONTENT);
  assert.deepEqual(last.box, [{ id: 'first.lockbox.right' }, { id: LINES.comeIn }]);
  assert.deepEqual(none.choices, all.choices);
});

test('answer refuses an index out of range, a fourth answer and anything malformed; deal and open only on their screens', () => {
  const at1 = deepFreeze(dealt());
  for (const a of [3, 7]) assert.throws(() => dispatch(at1, { t: 'answer', a }, CONTENT), invalid, `answer ${a}`);
  for (const a of [-1, 1.5, '1', null]) assert.throws(() => dispatch(at1, { t: 'answer', a }, CONTENT), invalid, JSON.stringify(a));
  assert.throws(() => dispatch(at1, { t: 'answer' }, CONTENT), invalid);
  assert.throws(() => dispatch(at1, { t: 'answer', a: 0, b: 1 }, CONTENT), invalid);
  assert.throws(() => dispatch(at1, { t: 'deal', seed: 'K7QM2Q9F' }, CONTENT), refused, 'no second deal');
  assert.throws(() => dispatch(at1, { t: 'open' }, CONTENT), refused, 'the key comes after the third answer');
  const done = deepFreeze(dealt('K7QM2Q9F', [0, 0, 0]));
  assert.throws(() => dispatch(done, { t: 'answer', a: 0 }, CONTENT), refused, 'a fourth answer');
  const fresh = deepFreeze(newSession(CONTENT));
  for (const seed of ['k7qm2q9f', 'K7QM2Q9', 'K7QM2Q9FX', 'K7QM2QUF', 7]) assert.throws(() => dispatch(fresh, { t: 'deal', seed }, CONTENT), invalid, String(seed));
  assert.throws(() => dispatch(fresh, { t: 'deal' }, CONTENT), invalid);
  assert.throws(() => dispatch(fresh, { t: 'open' }, CONTENT), refused, 'a box with a quiz opens only by its answers');
  assert.throws(() => dispatch(fresh, { t: 'answer', a: 0 }, CONTENT), refused, 'nothing dealt yet');
  assert.throws(() => dispatch(fresh, { t: 'open', x: 1 }, CONTENT), invalid);
  assert.throws(() => dispatch(fresh, { t: 'sign', name: 'Robin', id: 'h00000001' }, CONTENT), refused, 'the guest book waits');
  assert.throws(() => dispatch(fresh, { t: 'start', plan: 'sample', seed: 'K7QM2Q9F' }, CONTENT), refused);
});

test('open leads to the guest book with no hiker, and home with one (the v1 phone at its next return home); the actions are never logged', () => {
  const opened = dispatch(dealt('K7QM2Q9F', [0, 0, 0]), { t: 'open' }, CONTENT);
  assert.equal(opened.screen.phase, 'guestbook');
  assert.equal(opened.session.state.device.quiz.done, true);
  assert.equal(opened.session.log, null, 'the lockbox logs nothing');
  assert.ok(lockboxOpen(opened.session.state.device));
  // A phone from before S7: a hiker, a v1 device, no trip under way.
  const hiker = { v: 1, id: 'h00000001', name: 'Robin', profile: CONTENT.profile.open_start, trips: 2, latest: null };
  let s = fromSaves({ device: { v: 1 }, hiker: json(hiker), trip: null }, CONTENT);
  assert.equal(screenOf(s.state, CONTENT).phase, 'lockbox');
  for (const a of lockboxActs('K7QM2Q9F', CONTENT)) s = dispatch(s, a, CONTENT).session;
  assert.equal(screenOf(s.state, CONTENT).phase, 'home', 'with a hiker, Take the key goes home');
  assert.equal(screenOf(s.state, CONTENT).next.id, 'plan', 'a hiker with trips plans the next');
});

test('done survives a death, a save round trip, a reload and a v1 device\'s migration: the lockbox never comes back', () => {
  let s = newSession(CONTENT);
  for (const a of lockboxActs('K7QM2Q9F', CONTENT)) s = dispatch(s, a, CONTENT).session;
  s = dispatch(s, { t: 'sign', name: 'Robin', id: 'h00000001' }, CONTENT).session;
  const saved = json(toSaves(s));
  assert.equal(saved.device.v, 2);
  assert.equal(saved.device.quiz.done, true);
  const back = fromSaves(saved, CONTENT);
  assert.equal(screenOf(back.state, CONTENT).phase, 'home', 'a reload');
  // A death (the hiker gone): the guest book, not the lockbox.
  assert.equal(phaseOf({ ...back.state, hiker: null }), 'guestbook');
  assert.equal(phaseOf({ ...fromSaves({ ...saved, hiker: null }, CONTENT).state }), 'guestbook');
  // A v1 device migrates shut, then opens once and stays open.
  const v1 = fromSaves({ device: { v: 1 }, hiker: null, trip: null }, CONTENT);
  assert.deepEqual(v1.state.device, { v: 2, quiz: null });
  assert.deepEqual(migrate('device', saved.device), saved.device);
  // A trip under way on a phone that hasn't opened the box plays on.
  const mid = play(s, [{ t: 'start', plan: 'sample', seed: 'K7QM2Q9F' }], CONTENT).session;
  const shutMid = fromSaves({ ...json(toSaves(mid)), device: { v: 1 } }, CONTENT);
  assert.equal(screenOf(shutMid.state, CONTENT).phase, 'trailhead', 'the lockbox waits for home');
  // ...and when it ends, the lockbox shows once before home.
  let r = { session: shutMid };
  r = dispatch(r.session, { t: 'next' }, CONTENT);
  r = dispatch(r.session, { t: 'next' }, CONTENT);
  r = dispatch(r.session, { t: 'choose', c: 'car' }, CONTENT);
  r = dispatch(r.session, { t: 'next' }, CONTENT);
  assert.equal(r.screen.phase, 'lockbox');
  let after = r.session;
  for (const a of lockboxActs('K7QM2Q9F', CONTENT)) after = dispatch(after, a, CONTENT).session;
  assert.equal(screenOf(after.state, CONTENT).phase, 'home');
});

test('closing the app mid-quiz reopens on the same question with the same deal (the device record holds it)', () => {
  const s = dealt('K7QM2Q9F', [2]);
  const back = fromSaves(json(toSaves(s)), CONTENT);
  assert.deepEqual(screenOf(back.state, CONTENT), screenOf(s.state, CONTENT));
  assert.deepEqual(back.state.device.quiz, { seed: 'K7QM2Q9F', dealt: dealQuiz('K7QM2Q9F', QUIZ), answers: [2], done: false });
});

test('a dealt question this build no longer has is skipped, counting neither way; a build with no quiz at all lets the box open', () => {
  const d = dealQuiz('K7QM2Q9F', QUIZ);
  // A later build drops the second question dealt.
  const { rules, voice } = compileContent({ screens: ['lockbox', 'guestbook', 'home', 'trail'], checkText: false });
  const later = json({ rules, voice });
  later.rules.quiz.questions = later.rules.quiz.questions.filter((q) => q.id !== d[1]);
  const c2 = loadContent({ rules: later.rules, voice: later.voice, rulesHash: 'abcdef012346' });
  let s = fromSaves(json(toSaves(dealt('K7QM2Q9F', [right(d[0])]))), c2);
  const sc = screenOf(s.state, c2);
  assert.equal(sc.step, 'ask');
  assert.equal(sc.box[sc.box.length - 1].id, `first.lockbox.${d[2]}.ask`, 'the next live question');
  assert.deepEqual(sc.box[1], { id: LINES.count, vars: { q: 2 } }, 'counted by the answers that count');
  s = dispatch(s, { t: 'answer', a: right(d[2]) }, c2).session;
  assert.deepEqual(s.state.device.quiz.answers, [right(d[0]), null, right(d[2])], 'the skipped position is null');
  assert.deepEqual(progress(s.state.device.quiz, c2.quiz()), { at: -1, answered: 2, right: 2 });
  const end = screenOf(s.state, c2);
  assert.deepEqual(end.box, [{ id: 'first.lockbox.right' }, { id: LINES.comeIn }], 'two of three dealt: not three for three');
  // The engine fixture has no quiz: the shut box's one choice opens it.
  const fx = fxContent();
  const shut = screenOf(newSession(fx).state, fx);
  assert.deepEqual(shut.choices, [{ act: { t: 'open' }, label: { id: 'first.lockbox.start' }, enabled: true }]);
  assert.throws(() => dispatch(newSession(fx), { t: 'deal', seed: 'K7QM2Q9F' }, fx), refused, 'nothing to deal');
  const o = dispatch(newSession(fx), { t: 'open' }, fx);
  assert.deepEqual(o.session.state.device.quiz, { ...OPENED, dealt: [], answers: [] });
  assert.equal(o.screen.phase, 'guestbook');
  assert.deepEqual(lockboxActs('K7QM2Q9F', fx), [{ t: 'open' }]);
  assert.deepEqual(lockboxActs('K7QM2Q9F', CONTENT), [{ t: 'deal', seed: 'K7QM2Q9F' }, { t: 'answer', a: 0 }, { t: 'answer', a: 0 }, { t: 'answer', a: 0 }, { t: 'open' }]);
});

test("reportState carries the device: its format and the quiz's progress (dealt, answered, right, done), and no name", () => {
  const d = dealQuiz('K7QM2Q9F', QUIZ);
  const s = dealt('K7QM2Q9F', [right(d[0]), (right(d[1]) + 1) % 3]);
  assert.deepEqual(reportState(s, CONTENT).device, { v: 2, quiz: { dealt: d, answered: 2, right: 1, done: false } });
  assert.equal(reportState(s, CONTENT).phase, 'lockbox');
  assert.deepEqual(reportState(newSession(CONTENT), CONTENT).device, { v: 2, quiz: null });
  assert.deepEqual(reportState(s).device.quiz, { dealt: d, answered: 0, right: 0, done: false }, 'without the content, nothing counts');
});

// ---- The UI: first launch on the cabin and the porch ------------------------

const TEXT = readText(ROOT);
const UI_WORDS = bundle(TEXT, 'preview', [], givenNames())['en.json'];
const ART = compileArt({ screens: ['home', 'lockbox', 'guestbook'] });
const SUN = JSON.parse(readFileSync(join(ROOT, 'content', 'data', 'quinault_sun.json'), 'utf8'));
const CLIMATE = JSON.parse(readFileSync(join(ROOT, 'content', 'data', 'climate.json'), 'utf8'));
const DATA = { sun: SUN, climate: CLIMATE, realMoon: true };

/** Preview's words and a fresh localStorage for one test. */
function uiDevice(t) {
  const m = new Map();
  const ls = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; }, map: m };
  const had = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: ls });
  setChannel('preview');
  setBundle(UI_WORDS, {}, 'preview');
  forgetCabin();
  t.after(() => {
    if (had) Object.defineProperty(globalThis, 'localStorage', had);
    else delete globalThis.localStorage;
    setChannel(null);
    setBundle({}, {}, null);
    forgetCabin();
  });
  return ls;
}

/** A fake page, the ≡ sheet with the mailbox, and a sound that records. */
function page() {
  const doc = fakeDocument();
  const host = doc.body.appendChild(doc.createElement('div'));
  host.className = 'game-screen';
  const played = [];
  const sound = { played, play: (c) => played.push(c), isOn: () => true, setOn() {} };
  const menu = createMenu(doc, { onOpen: () => sound.play('ui.open') });
  installMailbox(doc, menu, { sound });
  return { doc, host, sound, menu };
}

/** The lake at noon on 2026-10-10 (a clear day there). */
const NOON = () => ({ y: 2026, m: 10, d: 10, dow: 6, secs: 12 * 3600, day: epochDay({ y: 2026, m: 10, d: 10 }) - epochDay({ y: 2026, m: 1, d: 1 }) });

test("porchLayout (the porch's space check): on the four phones the window takes the trail's pixel shape, so nothing jumps; the lockbox's box keeps 9 or more whole lines over its three choices, the guest book's 8 or more over its field; the rows fill the screen", () => {
  const want = { se: [4, 2, 9, 8], mini: [6, 4, 10, 9], p17: [7, 4, 12, 11], promax: [8, 5, 13, 12] };
  for (const [name, width, height, dpr, safeTop, safeBottom] of HOME_PHONES) {
    const l = porchLayout({ width, height, dpr, safeTop, safeBottom });
    const g = porchLayout({ width, height, dpr, safeTop, safeBottom, below: GUESTBOOK_BELOW_PT });
    const f = frameLayout({ width, height, dpr, safeTop, safeBottom });
    assert.deepEqual([l.shape.sx, l.shape.sy, l.boxLines, g.boxLines], want[name], name);
    assert.deepEqual(l.shape, f.shape, `${name}: the trail's shape`);
    assert.equal(l.picture.height, Math.ceil((WINDOW.h * l.shape.sy) / dpr - 1e-6));
    const sum = l.rows.status + l.rows.picture + l.rows.box + l.rows.below;
    assert.ok(Math.abs(sum - (height - safeTop - safeBottom)) < 1e-9, `${name}: the rows fill the screen`);
    assert.equal(l.rows.below, choicesPt(LAYOUT_CHOICES), 'three 52-pt choices, 8 apart, 6 under');
  }
  assert.equal(choicesPt(3), 3 * 52 + 2 * 8 + 6);
  assert.deepEqual(windowOf(ART.cabin), { y: ART.cabin.first.window_y, h: ART.cabin.first.window_h });
  assert.deepEqual(windowOf(null), { y: 128, h: 168 });
  // The window shows the lit lockbox and the open guest book (their anchors inside it).
  const at = plateAnchors(ART.pics[ART.cabin.plate].ops);
  const w = windowOf(ART.cabin);
  for (const a of ['lockbox', 'guestbook', 'door']) assert.ok(at[a][1] >= w.y && at[a][1] < w.y + w.h, `at_${a} in the window`);
});

test("T02 on the porch (S7 8.3): every box the lockbox and the guest book can show fits its box whole on every phone, the SE's included, in the box's pixel face, so none needs the ▾ (the first question's box, the longest, about 125 characters, takes at most 7 of the SE's 9 lines)", () => {
  const text = readText(ROOT);
  const faces = loadFaces(ROOT);
  const missing = new Set();
  const measure = (s) => widthOf(faces.pixelify, GEOMETRY.boxPx, s, missing);
  const words = (ref) => {
    const w = wordsFor(text.lines, ref);
    assert.ok(w !== null, `${ref.id} has words`);
    return w;
  };
  // Every box the porch can show: each question first (the intro, Question 1 of 3.), each after a right or a
  // wrong answer (Question 2 or 3 of 3.), both closings, and the guest book's prompt.
  const quiz = CONTENT.quiz();
  const boxes = [];
  for (const q of quiz.questions) {
    const ask = { id: `first.lockbox.${q.id}.ask` };
    boxes.push([{ id: LINES.intro }, { id: LINES.count, vars: { q: 1 } }, ask]);
    for (const reply of ['first.lockbox.right', 'first.lockbox.wrong']) for (const n of [2, 3]) boxes.push([{ id: reply }, { id: LINES.count, vars: { q: n } }, ask]);
  }
  boxes.push([{ id: LINES.allRight }], [{ id: 'first.lockbox.right' }, { id: LINES.comeIn }], [{ id: 'first.lockbox.wrong' }, { id: LINES.comeIn }]);
  const prompt = [{ id: 'first.guestbook.prompt' }];
  assert.equal(boxes.length, quiz.questions.length * 5 + 3);
  let firstSe = 0;
  for (const [name, width, height, dpr, safeTop, safeBottom] of HOME_PHONES) {
    for (const [layout, list] of [[porchLayout({ width, height, dpr, safeTop, safeBottom }), boxes], [porchLayout({ width, height, dpr, safeTop, safeBottom, below: GUESTBOOK_BELOW_PT }), [prompt]]]) {
      const space = { width: layout.column - 2 * GEOMETRY.boxBorderFp * layout.fp - 2 * GEOMETRY.boxPadXFp * layout.fp, height: layout.boxLines * BOX_LINE_PT, line: BOX_LINE_PT };
      for (const refs of list) {
        const paras = refs.map(words);
        const r = fitParas(paras, space, measure);
        assert.deepEqual(r.tooWide, [], `${name}: no word wider than a line`);
        assert.ok(r.fits, `${name}: ${refs.map((x) => x.id).join(' + ')} takes ${r.lines} lines, ${r.height} pt of ${space.height}`);
        if (name === 'se' && refs[0].id === LINES.intro) firstSe = Math.max(firstSe, r.lines);
      }
    }
  }
  assert.ok(firstSe >= 4 && firstSe <= 7, `the first question's box on the SE: ${firstSe} lines`);
  assert.deepEqual([...missing], [], 'every character is in the face');
  // The box's lengths are home.css's, the ones T02 reads for the trail's frame.
  const css = readFileSync(join(ROOT, 'web', 'css', 'home.css'), 'utf8');
  const rule = /\.porch \.game-box \{([^}]*)\}/.exec(css)[1];
  assert.match(rule, /padding: calc\(3 \* var\(--fp\)\) calc\(4 \* var\(--fp\)\);/);
  assert.match(rule, /font-size: 20px;/);
  assert.match(rule, /line-height: 26px;/);
  assert.match(css, /\.porch \.game-box p \+ p \{ margin-top: 13px; \}/);
  assert.deepEqual([GEOMETRY.boxPadXFp, GEOMETRY.boxPx, GEOMETRY.paraGap, GEOMETRY.boxBorderFp], [4, 20, 13, 3]);
});

test('the shut lockbox is the cabin in its first-launch state: the plate with the lit lockbox and the open guest book, no labels, no rail, Open the lockbox; its own hit area opens it too', (t) => {
  uiDevice(t);
  const { host, sound, menu } = page();
  const shut = screenOf(newSession(CONTENT).state, CONTENT);
  const nexts = [];
  const c = renderCabin(host, shut, { art: ART, data: DATA, sound, menu, onNext: (a) => nexts.push(a), now: NOON, later: () => () => {} });
  t.after(() => c.release());
  assert.ok(host.hasAttribute('data-first'));
  assert.deepEqual(c.states(), ['first'], 'the first-launch overlay');
  assert.equal(c.labels.size, 0, 'no labels');
  assert.equal(c.rail.size, 0, 'no rail');
  assert.equal(host.querySelector('.cabin-rail'), null);
  assert.deepEqual([...c.places.keys()], ['lockbox'], "only the lockbox's button over the picture");
  assert.equal(c.places.get('lockbox').getAttribute('aria-label'), 'Open the lockbox');
  assert.equal(c.next.querySelector('.choice-label').getAttribute('data-t'), 'first.lockbox.start');
  assert.equal(c.focus, c.next, 'the next step takes focus');
  c.next.click();
  c.tap('lockbox');
  assert.deepEqual(nexts, [{ t: 'deal' }, { t: 'deal' }], 'the game completes the deal with a seed');
  // A tap on a silent place reads the cabin's description.
  c.tap('peak');
  assert.ok(host.querySelector('.look-box'), "the cabin's alt text, as its Look");
  // A content with no quiz: the button opens the box straight away.
  const fx = fxContent();
  const host2 = page().host;
  const c2 = renderCabin(host2, screenOf(newSession(fx).state, fx), { art: ART, data: DATA, sound, menu, onNext: (a) => nexts.push(a), now: NOON, later: () => () => {} });
  t.after(() => c2.release());
  c2.next.click();
  assert.deepEqual(nexts.at(-1), { t: 'open' });
});

test("the lockbox's questions on the porch: the status line with the lake's time, a window on the porch with the lit lockbox, the box, three answers in their order; an answer ticks, the key plays Next", (t) => {
  uiDevice(t);
  const { host, sound, menu } = page();
  const acts = [];
  const s1 = screenOf(dealt('K7QM2Q9F').state, CONTENT);
  // The clock: 12:00:20 pm at the lake, then the next minute; one timer at a time, cleared on release.
  let secs = 12 * 3600 + 20;
  const timers = [];
  const later = (f, ms) => {
    const tm = { f, ms, cleared: false };
    timers.push(tm);
    return () => {
      tm.cleared = true;
    };
  };
  const l = renderLockbox(host, s1, (a, cue) => acts.push([a, cue]), { art: ART, data: DATA, sound, menu, now: () => ({ ...NOON(), secs }), later });
  assert.ok(host.classList.contains('porch'));
  assert.equal(host.getAttribute('data-step'), 'ask');
  const time = host.querySelector('.status-score');
  assert.deepEqual([time.getAttribute('data-t'), time.textContent], ['fmt.clock_pm', '12:00\u00a0pm'], "the lake's time, as on the cabin");
  assert.deepEqual(timers.map((x) => x.ms), [40 * 1000 + 50], 'again at the next minute');
  secs = 13 * 3600 + 5 * 60;
  timers[0].f();
  assert.equal(time.textContent, '1:05\u00a0pm');
  assert.deepEqual(timers.map((x) => x.ms), [40050, 60000], 'never more than a minute');
  l.release();
  assert.deepEqual(timers.map((x) => x.cleared), [false, true], 'release clears the timer that waits');
  assert.equal(host.querySelector('.status-menu').getAttribute('aria-label'), 'The mailbox', "≡ is the mailbox, as on the cabin");
  const img = host.querySelector('.porch-alt');
  assert.equal(img.getAttribute('role'), 'img');
  assert.equal(img.getAttribute('data-t-aria'), 'alt.scene.cabin');
  assert.match(l.porch.key(), /^cabin@day\.\w+.*\.first$/, 'the cabin at the hour, with the first-launch overlay');
  assert.deepEqual(l.box.querySelectorAll('p').map((p) => p.getAttribute('data-t')), s1.box.map((r) => r.id));
  assert.equal(l.box.querySelectorAll('p')[1].textContent, 'Question 1 of 3.');
  assert.deepEqual(l.buttons.map((b) => b.querySelector('.choice-label').getAttribute('data-t')), s1.choices.map((c) => c.label.id));
  assert.deepEqual(l.buttons.map((b) => b.getAttribute('data-answer')), ['0', '1', '2']);
  l.buttons[2].click();
  assert.deepEqual(acts, [[{ t: 'answer', a: 2 }, 'ui.tick']]);
  assert.equal(l.focus, l.box, 'the box takes focus, so VoiceOver reads it');
  // A tap on the picture reads the cabin's description.
  host.querySelector('.porch-picture').click();
  assert.ok(host.querySelector('.look-box'));
  // The closing: one choice, Take the key.
  const host2 = page().host;
  const s4 = screenOf(dealt('K7QM2Q9F', [0, 0, 0]).state, CONTENT);
  const l2 = renderLockbox(host2, s4, (a, cue) => acts.push([a, cue]), { art: ART, data: DATA, sound, menu, now: NOON });
  t.after(() => l2.release());
  assert.equal(l2.buttons.length, 1);
  assert.equal(l2.buttons[0].textContent, 'Take the key');
  l2.buttons[0].click();
  assert.deepEqual(acts.at(-1), [{ t: 'open' }, 'ui.next']);
  assert.deepEqual(LOCKBOX_CUES, { answer: 'ui.tick', open: 'ui.next' });
});

test("the guest book on the porch: the window on the porch table, the box, the field's visible label (its name), Suggest beside it (a real given name, never the one in the field), the one-life line and Sign", (t) => {
  uiDevice(t);
  const { host, sound, menu } = page();
  const names = givenNames();
  assert.equal(names.length, 16);
  let next = 0;
  const random = { getRandomValues: (a) => { a[0] = next; return a; } };
  const signed = [];
  const gb = renderGuestbook(host, { phase: 'guestbook', box: [], choices: [], input: { kind: 'name', max: 12 } }, (n) => signed.push(n), {}, { ctx: { art: ART, data: DATA, sound, menu, now: NOON }, names, random });
  t.after(() => gb.release());
  assert.ok(host.classList.contains('porch') && host.classList.contains('guestbook'));
  assert.equal(gb.field.getAttribute('aria-labelledby'), 'gb-label');
  assert.equal(gb.label.textContent, "Your hiker's name");
  assert.equal(gb.suggest.textContent, 'Suggest');
  assert.equal(gb.suggest.getAttribute('aria-controls'), 'gb-name');
  assert.deepEqual(gb.buttons, [gb.suggest, gb.sign]);
  gb.suggest.click();
  assert.equal(gb.field.value, 'Avery', 'the first name when the draw is 0');
  assert.equal(gb.sign.disabled, false, 'a suggested name can be signed');
  gb.suggest.click();
  assert.equal(gb.field.value, 'Casey', 'never the name already in the field');
  next = 14;
  gb.suggest.click();
  assert.equal(gb.field.value, 'Taylor', 'the last of the fifteen left besides Casey');
  gb.sign.click();
  assert.deepEqual(signed, ['Taylor']);
  // pickGiven and randomBelow, pure.
  const words = (id) => UI_WORDS[id];
  assert.equal(pickGiven(names, 'Avery', () => 0, words), 'term.given_casey');
  assert.equal(pickGiven(['term.given_jo'], 'Jo', () => 0, words), null, 'nothing left to suggest');
  // 2^32 is 1 more than a multiple of 15, so a draw of 2^32 - 1 would favour 0: it is thrown back.
  const seq = [4294967295, 7];
  assert.equal(randomBelow(15, { getRandomValues: (a) => { a[0] = seq.shift(); return a; } }), 7, 'a draw past the last whole multiple is thrown back');
  assert.equal(seq.length, 0);
  for (let i = 0; i < 200; i++) assert.ok(randomBelow(16) < 16);
});

test("Larger Text on the porch (S7 review): the box's lines and each choice are the Plain serif's, so the picture gives way before the box drops under three lines; what is below counts at its measured height when its words wrap", () => {
  const [, width, height, dpr, safeTop, safeBottom] = HOME_PHONES[0];
  const pixel = porchLayout({ width, height, dpr, safeTop, safeBottom });
  for (const px of [20, 28, 33, 40, 47, 53]) {
    const l = porchLayout({ width, height, dpr, safeTop, safeBottom, plainPx: px });
    const line = 1.35 * px;
    const choice = Math.max(CHOICE_PT, Math.ceil(line + 10 * l.fp - 1e-6));
    assert.equal(l.rows.below, choicesPt(3) + 3 * (choice - CHOICE_PT), `${px} px: three Plain choices`);
    assert.equal(l.boxLines, Math.max(0, Math.floor((l.box - BOX_CHROME_FP * l.fp) / line + 1e-6)), `${px} px: whole Plain lines`);
    assert.ok(l.picture.height <= pixel.picture.height, `${px} px: the picture only ever shrinks`);
    if (l.shape.sx > 1) assert.ok(l.boxLines >= MIN_BOX_LINES, `${px} px on the SE: three lines of box (${l.boxLines}, ${l.shape.sx}x${l.shape.sy})`);
    assert.ok(2 * l.shape.sy >= l.shape.sx, `${px} px: never flatter than 2:1`);
  }
  // The review's case: the SE at 47 px (AX4) kept 4x2 and crushed the box to its border; now the picture gives way.
  const ax4 = porchLayout({ width, height, dpr, safeTop, safeBottom, plainPx: 47 });
  assert.ok(ax4.shape.sy < pixel.shape.sy && ax4.boxLines >= 1, `${ax4.shape.sx}x${ax4.shape.sy}, ${ax4.boxLines} lines`);
  // Answers that wrap to two lines (141 pt each, as measured at 47 px): counted at their height.
  const wrapped = porchLayout({ width, height, dpr, safeTop, safeBottom, plainPx: 47, measured: 3 * 141 + 2 * 8 + 6 });
  assert.equal(wrapped.rows.below, 3 * 141 + 2 * 8 + 6);
  assert.ok(wrapped.box >= 0 && wrapped.picture.height <= ax4.picture.height);
  // A measured height under the model's never shrinks it; the pixel fonts are as before.
  assert.equal(porchLayout({ width, height, dpr, safeTop, safeBottom, measured: 66 }).rows.below, choicesPt(3), 'the closing (one choice) keeps the questions\' picture');
  assert.deepEqual(porchLayout({ width, height, dpr, safeTop, safeBottom, plainPx: null }), pixel);
  // The guest book's Sign grows the same way (one Plain choice).
  const gb = porchLayout({ width, height, dpr, safeTop, safeBottom, below: GUESTBOOK_BELOW_PT, plainRows: 1, plainPx: 33 });
  assert.equal(gb.rows.below, GUESTBOOK_BELOW_PT + Math.max(0, Math.ceil(1.35 * 33 + 10 * gb.fp - 1e-6) - CHOICE_PT));
});

test("the porch's picture stays live (S7 review): the scene looked at again at each minute, at its next change and back in the foreground, and drawn again when it changed; the alt text follows", (t) => {
  uiDevice(t);
  const { doc, host, sound, menu } = page();
  let secs = 18 * 3600;
  const timers = [];
  const later = (f, ms) => {
    const tm = { f, ms, cleared: false };
    timers.push(tm);
    return () => {
      tm.cleared = true;
    };
  };
  const gb = renderGuestbook(host, { phase: 'guestbook', box: [], choices: [], input: { kind: 'name', max: 12 } }, () => {}, {}, { ctx: { art: ART, data: DATA, sound, menu, now: () => ({ ...NOON(), secs }), later, devOn: () => false }, names: [] });
  t.after(() => gb.release());
  assert.equal(host.getAttribute('data-hour'), 'day', '6:00 pm on 2026-10-10: still day (dusk at 18:06)');
  const dayKey = host.getAttribute('data-key');
  assert.match(String(dayKey), /^cabin@day\./);
  const img = host.querySelector('.porch-alt');
  assert.ok(!img.getAttribute('data-t-alt').includes('alt.cabin.lit'), 'no lit windows by day');
  assert.equal(timers.length, 1);
  assert.ok(timers[0].ms <= 60 * 1000 + 50, 'again within the minute');
  // The phone left on the guest book until 7:45 pm: the next look at the clock draws the night.
  secs = 19 * 3600 + 45 * 60;
  timers[0].f();
  assert.equal(host.querySelector('.status-score').textContent, '7:45\u00a0pm');
  assert.equal(host.getAttribute('data-hour'), 'night');
  assert.match(String(host.getAttribute('data-key')), /^cabin@night\./);
  const alt = img.getAttribute('data-t-alt').split(' ');
  assert.ok(alt.includes('alt.cabin.lit') && alt.some((id) => id.startsWith('alt.hour.night')), alt.join(' '));
  assert.ok(img.getAttribute('aria-label').length > 0);
  // Asleep overnight, back in the foreground at 8:15 am: the morning, at once.
  secs = 8 * 3600 + 15 * 60;
  doc.visibilityState = 'visible';
  for (const f of doc.listeners.get('visibilitychange') || []) f({ type: 'visibilitychange' });
  assert.equal(host.getAttribute('data-hour'), 'day');
  assert.equal(host.querySelector('.status-score').textContent, '8:15\u00a0am');
  assert.equal(timers.length, 3, 'one timer at a time: the first fired, the second waited, the third waits');
  assert.deepEqual(timers.map((x) => x.cleared), [false, true, false], 'the one that waited was cleared for the new one');
  gb.release();
  assert.equal(timers.at(-1).cleared, true, 'release clears the timer');
  assert.equal((doc.listeners.get('visibilitychange') || []).length, 0, 'and its listener');
});

test("after a death the guest book's porch draws the open book alone: no lit lockbox, which never comes back once opened (decision 45, lead call 53; S7 review)", (t) => {
  uiDevice(t);
  const { host, sound, menu } = page();
  const gb = renderGuestbook(host, { phase: 'guestbook', box: [], choices: [], input: { kind: 'name', max: 12 } }, () => {}, {}, { ctx: { art: ART, data: DATA, sound, menu, now: NOON, later: () => () => {}, devOn: () => false }, names: [], first: false });
  t.after(() => gb.release());
  const key = String(host.getAttribute('data-key'));
  assert.match(key, /\.guestbook$/);
  const scene = { hour: host.getAttribute('data-hour'), sky: host.getAttribute('data-sky') === 'fog' ? 'clear' : host.getAttribute('data-sky'), fog: host.getAttribute('data-sky') === 'fog' };
  const ops = composeCabin({ art: ART, cabin: ART.cabin, ...scene, state: ['guestbook'] }).ops.filter((op) => op[0] === 'T').map((op) => op[1]);
  assert.ok(ops.includes('cabin_guestbook_open'), 'the open guest book');
  assert.ok(!ops.includes('cabin_lockbox_lit'), 'never the lit lockbox');
  // First launch's (the default): the lit lockbox beside the book.
  const { host: host2 } = page();
  const first = renderGuestbook(host2, { phase: 'guestbook', box: [], choices: [], input: { kind: 'name', max: 12 } }, () => {}, {}, { ctx: { art: ART, data: DATA, sound, menu, now: NOON, later: () => () => {}, devOn: () => false }, names: [] });
  t.after(() => first.release());
  assert.match(String(host2.getAttribute('data-key')), /\.first$/);
});

test("the mailbox's Text toggle redraws the guest book with the name typed in it, and Sign with it (S7 review)", (t) => {
  uiDevice(t);
  const { host, sound, menu } = page();
  const screen = { phase: 'guestbook', box: [], choices: [], input: { kind: 'name', max: 12 } };
  const ctx = { art: ART, data: DATA, sound, menu, now: NOON, later: () => () => {}, devOn: () => false };
  const gb = renderGuestbook(host, screen, () => {}, {}, { ctx, names: [] });
  gb.field.value = 'Quinn';
  gb.field.dispatchEvent({ type: 'input', isComposing: false });
  assert.equal(gb.sign.disabled, false);
  gb.release();
  while (host.firstChild) host.removeChild(host.firstChild);
  const again = renderGuestbook(host, screen, () => {}, {}, { ctx, names: [], value: gb.field.value });
  t.after(() => again.release());
  assert.equal(again.field.value, 'Quinn', 'the name stays');
  assert.equal(again.sign.disabled, false, 'and Sign with it');
});

test("D10: every line the cabin's and the porch's modules can show is in B002 or B003, approved, or a dev line; the exceptions, the trail's Look group in ui/look.js and the trail's number formats in fmt.js, are never called from them", () => {
  const banned = ['ui/frame.js', 'ui/choices.js', 'ui/sheet.js', 'ui/outcome.js', 'ui/compass.js', 'ui/strip.js', 'ui/toolbar.js', 'ui/app.js'];
  const seen = new Set();
  const visit = (rel) => {
    if (seen.has(rel) || !rel.startsWith('ui/') && !rel.startsWith('gfx/') && !rel.startsWith('platform/') && rel !== 'text.js' && rel !== 'fmt.js') return;
    seen.add(rel);
    const src = readFileSync(join(ROOT, 'web', 'js', rel), 'utf8');
    for (const m of src.matchAll(/^import [^;]*?from '(\.{1,2}\/[^']+)'/gm)) {
      const dep = join(dirname(rel), m[1]).split('\\').join('/');
      assert.ok(!banned.includes(dep), `${rel} imports ${dep}`);
      visit(dep);
    }
  };
  for (const root of ['ui/cabin.js', 'ui/porch.js', 'ui/lockbox.js', 'ui/guestbook.js', 'ui/mailbox.js', 'ui/menu.js', 'ui/status.js']) visit(root);
  const batches = TEXT.batches.batches;
  const ok = new Set([...Object.keys(batches.B002.lines), ...Object.keys(batches.B003.lines)]);
  const named = new Set();
  for (const rel of seen) {
    const src = readFileSync(join(ROOT, 'web', 'js', rel), 'utf8');
    for (const l of scanJs(src).literals) if (l.value && TEXT.lines.has(l.value)) named.add(l.value);
    for (const m of src.matchAll(/\/\/\s*t-ids:(.*)$/gm)) for (const id of m[1].split(',').map((x) => x.trim())) if (TEXT.lines.has(id)) named.add(id);
  }
  const stray = [...named].filter((id) => !ok.has(id) && !['approved', 'dev', 'nowords'].includes(stateOf(id, TEXT))).sort();
  assert.deepEqual(stray, ['fmt.ft', 'fmt.mi', 'fmt.mile_marker', 'fmt.min', 'trail.look.group'], "only the trail's Look group and number formats");
  // ui/look.js names the group for renderLooks, which only the trail frame calls.
  for (const rel of seen) if (rel !== 'ui/look.js') assert.ok(!/\brenderLooks\b/.test(readFileSync(join(ROOT, 'web', 'js', rel), 'utf8')), `${rel} calls renderLooks`);
  // fmt.js names the trail's formats for feet(), mileMarker(), miles() and minutes(); the cabin's modules take clock() alone (B002's).
  for (const rel of seen) {
    for (const m of readFileSync(join(ROOT, 'web', 'js', rel), 'utf8').matchAll(/^import \{([^}]*)\} from '\.{1,2}\/(?:\.\.\/)?fmt\.js'/gm)) assert.deepEqual(m[1].split(',').map((x) => x.trim()), ['clock'], `${rel} takes clock() alone from fmt.js`);
  }
  for (const id of ['first.lockbox.start', 'first.guestbook.label', 'home.next.plan_first', 'trail.box.more', 'fmt.clock_am']) assert.ok(named.has(id), id);
});
