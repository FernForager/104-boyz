// The hidden debug menu and Copy bug report (GAME_DESIGN E.11; BUILD_PLAN
// 2.5, 2.8). Five quick taps on the build stamp, or ?debug=1 at launch, open
// it; nothing marks it, and it lasts until reload. It shows the bug report
// exactly as it would be copied, a note field that rides in the next report,
// Copy bug report, on preview the words' marks (18.6) and, on a build with
// the map screen, a button that opens the pencil map at #map (S4); on a
// build with the trail screen (preview, S5), the dev controls and actions
// other modules register (registerDevControl, registerDevAction: the trail
// picture's hour, the box text's font, the Scenes check view), drawn after
// the map; and a button that throws a test error so the error sheet can be
// checked on the phone (F.5). On such a build, debug mode also loads the
// line inspector (ui/inspect.js, S5): a long press on any words opens it.
// Nothing in it can change a trip, and the gentle flag is not in it (9.4).
// It is built here when it first opens, so none of it is in the built page;
// its labels are dev words (decision 64), and Copy bug report is approved.
//
// The report holds only game state and device facts, and only the fields
// buildReport names: storage key names but never their values, no language,
// time zone, URL, referrer or location. Report 2 (S3) adds the commit and
// the rules hash the build stamped on <html>, the replay self-check's result
// (ui/selfcheck.js), and the state: the phase, the hiker without a name
// ({HIKER} and its length), and the trip's seed, plan, stop, packed action
// log, profile snapshot and hash (E.11), so `node tools/play.mjs --replay`
// replays it on its own commit. The state comes from a provider the game
// registers (provideState), so this module never imports the engine and
// main's menu loads none of it. The menu's first line says what the
// self-check found; opening the menu starts it if it hasn't run.
//
// On preview, once the sound has loaded (ui/sound.js provideAudio; S5), the
// report gains an audio field: the Sound state, the unlock and its session
// type, the context's state and rate, the limiter's worklet, the
// watchdog's kicks and rebuilds, the cues played and the last 10-second
// render. Main never loads the sound, so its report keeps version 2 and
// S3's keys exactly.

import { recentErrors } from './errors.js';
import { checkResult, runCheck, onCheck, CHECK_GROUPS } from './selfcheck.js';
import { workerStatus, isInstalled } from '../platform/sw-client.js';
import { lastFacts, storageFacts, ownKeys, load, save } from '../platform/storage.js';
import { copyText, shareText, selectAll } from '../platform/share.js';
import { t, tx, setMarks } from '../text.js';

/** A pasted report stays under this many characters (BUILD_PLAN 2.8). */
export const MAX_REPORT = 60000;
/** The report's version: 2 from S3 (commit, rules, selfcheck, state). */
export const REPORT_VERSION = 2;
/** The hiker's name, as a report writes it (the name never leaves the phone). */
export const HIKER_TOKEN = '{HIKER}';
/** The last actions a report spells out (E.11). */
const LAST_MAX = 20;
const CHECK_ERROR_CUT = 300;
const STACK_CUT = 2000;
const KEEP_ERRORS = 5;
const NOTE_MAX = 1000;
const NOTE_CUT = 500;
const KEYS_MAX = 100;
/** Five taps, each within this many ms of the last. */
const TAPS = 5;
const TAP_GAP_MS = 700;
/** How long the ✓ shows after a copy. */
const DONE_MS = 2000;
const MARK_MODES = ['on', 'drafts', 'off'];
/**
 * Preview's marks control: [mode, id] (GAME_DESIGN 18.6).
 * @type {['on' | 'drafts' | 'off', string][]}
 */
const MARKS = [
  ['on', 'dev.marks.on'],
  ['drafts', 'dev.marks.drafts'],
  ['off', 'dev.marks.off'],
];
const HEAD_ID = 'debug-head';
const NOTE_ID = 'debug-note';
const MARKS_ID = 'debug-marks';
/** The pencil map's screen (content/scope/m1a.json; BUILD_PLAN S4), on preview only. */
export const MAP_SCREEN = 'map';
/** The address that opens it (main.js; the menu's Map button sets it). */
export const MAP_HASH = '#map';
/** The trail's screen (BUILD_PLAN S5): a build that lists it draws the registered dev controls and actions. */
export const TRAIL_SCREEN = 'trail';
const DEV_ID = 'debug-dev';

let note = '';
let debugOn = false;
/** @type {{doc: Document, scrim: HTMLElement, check: HTMLElement, pre: HTMLElement, area: HTMLTextAreaElement, noteField: HTMLTextAreaElement, close: HTMLElement, marks: [string, HTMLElement][], dev: HTMLElement | null} | null} */
let menu = null;
/**
 * A dev control: a row of choices, one pressed (the trail picture's hour,
 * the box text's font). label and each option's label are line ids (dev
 * words); get() says which value is on; set(value) applies and keeps it.
 * @typedef {{id: string, label: string, options: {value: string, label: string}[], get: () => string, set: (value: string) => void}} DevControl
 */
/**
 * A dev action: a button (Scenes, the 10-second sound render). run gets
 * the document, close() for the menu and out, a status line under the
 * button that the action may fill with its own words. preview: shown on
 * preview only (the only kind there is: main's menu builds none).
 * @typedef {{id: string, label: string, run: (o: {doc: Document, close: () => void, out: HTMLElement}) => unknown, preview?: boolean}} DevAction
 */
/** @type {Map<string, DevControl>} */
const devControls = new Map();
/** @type {Map<string, DevAction>} */
const devActions = new Map();
/** @type {(() => unknown) | null} the game's state for the report (ui/app.js registers it) */
let stateFn = null;
/** @type {(() => unknown) | null} the sound's state for the report (ui/sound.js registers it, preview only) */
let audioFn = null;

/**
 * Register what the report's state field holds: ui/app.js passes
 * () => reportState(session, content), read inside the tap. null clears it.
 * @param {(() => unknown) | null} f
 */
export function provideState(f) {
  stateFn = f;
  if (menu && !menu.scrim.hidden) refresh(menu);
}

/**
 * Register what the report's audio field holds (ui/sound.js, preview only):
 * the sound engine's report(), read inside the tap. null clears it.
 * @param {(() => unknown) | null} f
 */
export function provideAudio(f) {
  audioFn = f;
}

/**
 * Pure: count taps. The returned function takes each tap's time (ms) and
 * says true on the n-th tap in a row, each within gap ms of the last; then
 * the count starts over.
 * @param {number} [n]
 * @param {number} [gap]
 */
export function makeTapCounter(n = TAPS, gap = TAP_GAP_MS) {
  let count = 0;
  let last = -Infinity;
  return (/** @type {number} */ time) => {
    count = time - last <= gap ? count + 1 : 1;
    last = time;
    if (count < n) return false;
    count = 0;
    last = -Infinity;
    return true;
  };
}

/**
 * Pure: did the address ask for the debug menu (?debug=1)?
 * @param {string} [search]
 */
export function debugRequested(search) {
  try {
    return new URLSearchParams(search || '').get('debug') === '1';
  } catch {
    return false;
  }
}

/**
 * Pure: does this build carry the pencil map (BUILD_PLAN S4)? True when
 * <html data-screens> (stamped by the build from the scope file) lists the
 * map; main's lists app, debug and title, so main never imports ui/map.js.
 * It lives here, and ui/map.js re-exports it, so main.js and the menu can
 * ask without loading the map (the same gate as home.js's opensGame).
 * @param {Document} doc
 */
export function opensMap(doc) {
  const screens = String(doc.documentElement.getAttribute('data-screens') || '').split(/\s+/);
  return screens.includes(MAP_SCREEN);
}

/**
 * Pure: does this build carry the trail (BUILD_PLAN S5)? True when <html
 * data-screens> lists it (preview); main's never does, so main's menu draws
 * no dev control or action.
 * @param {Document} doc
 */
export function opensTrail(doc) {
  const screens = String(doc.documentElement.getAttribute('data-screens') || '').split(/\s+/);
  return screens.includes(TRAIL_SCREEN);
}

/**
 * Register a dev control for the menu (ui/frame.js, ui/textsize.js; S5).
 * The same id again replaces it. An open menu redraws.
 * @param {DevControl} c
 */
export function registerDevControl(c) {
  devControls.set(c.id, c);
  if (menu) renderDev(menu);
}

/**
 * Register a dev action for the menu (S5). The same id again replaces it.
 * @param {DevAction} a
 */
export function registerDevAction(a) {
  devActions.set(a.id, { preview: true, ...a });
  if (menu) renderDev(menu);
}

/** The registered controls and actions, by id (tests). */
export function devRegistry() {
  return { controls: [...devControls.keys()], actions: [...devActions.keys()] };
}

/** True once the menu has opened, until reload. */
export function debugMode() {
  return debugOn;
}

/**
 * Everything the report needs, read at once, with nothing awaited (a
 * clipboard write must start inside the tap, 2.8).
 * @param {Document} [doc]
 */
export function collectFacts(doc = document) {
  const win = /** @type {any} */ (doc.defaultView || globalThis);
  const html = doc.documentElement;
  const app = doc.getElementById('app');
  const mq = (/** @type {string} */ q) => typeof win.matchMedia === 'function' && win.matchMedia(q).matches;
  const scr = win.screen || {};
  let state = null;
  try {
    state = stateFn ? stateFn() : null;
  } catch {
    state = null; // a report never fails for want of its state
  }
  let audio = null;
  try {
    audio = audioFn ? audioFn() : null;
  } catch {
    audio = null; // nor of its sound
  }
  return {
    build: html.dataset.build || null,
    commit: html.dataset.commit || null,
    rules: html.dataset.rules || null,
    channel: html.dataset.channel || null,
    time: new Date().toISOString(),
    screen: (app && app.dataset.screen) || null,
    device: {
      ua: (win.navigator && win.navigator.userAgent) || '',
      screen: [scr.width, scr.height],
      viewport: [win.innerWidth, win.innerHeight],
      dpr: win.devicePixelRatio || 1,
      standalone: isInstalled(),
      orientation: mq('(orientation: landscape)') ? 'landscape' : 'portrait',
      reducedMotion: mq('(prefers-reduced-motion: reduce)'),
    },
    worker: workerStatus(),
    storage: lastFacts(),
    keys: ownKeys(),
    selfcheck: checkResult(),
    errors: recentErrors(),
    note,
    state,
    audio,
  };
}

const num = (/** @type {unknown} */ v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (/** @type {unknown} */ v) => (v === null || v === undefined ? null : String(v));
const pair = (/** @type {unknown} */ p) => (Array.isArray(p) ? [num(p[0]), num(p[1])] : [null, null]);
/** 40 hex (a commit) or 12 hex (the rules hash); "dev" outside a build is null. */
const hexOr = (/** @type {unknown} */ v, /** @type {RegExp} */ re) => (typeof v === 'string' && re.test(v) ? v : null);
/** A plain JSON copy of a value (objects the engine made), or null. */
const plain = (/** @type {unknown} */ v) => {
  if (v === null || v === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(v));
  } catch {
    return null;
  }
};

/**
 * The self-check's result, field by field (ui/selfcheck.js).
 * @param {any} c
 */
export function checkField(c) {
  if (!c || c.ran !== true) return { ran: false };
  if (typeof c.match !== 'boolean') return { ran: true, match: null, error: String(c.error ?? '').slice(0, CHECK_ERROR_CUT) };
  const g = c.groups || {};
  return {
    ran: true,
    match: c.match,
    ms: num(c.ms),
    groups: Object.fromEntries(CHECK_GROUPS.map((k) => [k, g[k] === true])),
    failed: (Array.isArray(c.failed) ? c.failed : []).slice(0, CHECK_GROUPS.length).map((/** @type {any} */ f) => ({
      group: String(f.group ?? '').slice(0, 12),
      got: String(f.got ?? '').slice(0, 12),
      want: String(f.want ?? '').slice(0, 12),
    })),
  };
}

/**
 * The game state, field by field (the engine's reportState): the hiker's
 * name is always {HIKER}, whatever the provider gave; pending, when an
 * action threw, is that action as the log would spell it.
 * @param {any} s
 */
export function stateField(s) {
  if (!s || typeof s !== 'object') return null;
  const h = s.hiker && typeof s.hiker === 'object' ? s.hiker : null;
  const t = s.trip && typeof s.trip === 'object' ? s.trip : null;
  return {
    phase: str(s.phase),
    hiker: h ? { id: str(h.id), name: HIKER_TOKEN, chars: num(h.chars), trips: num(h.trips) } : null,
    trip: t
      ? {
          seed: str(t.seed),
          plan: str(t.plan),
          stop: num(t.stop),
          log: str(t.log),
          profile: plain(t.profile),
          base: plain(t.base),
          hash: str(t.hash),
          last: (Array.isArray(t.last) ? t.last : []).slice(-LAST_MAX).map((/** @type {unknown} */ a) => String(a).slice(0, 64)),
          snapshot: plain(t.snapshot),
        }
      : null,
    // The action that threw, which never reached the log (ui/app.js pendingOf).
    ...(Array.isArray(s.pending) && s.pending.length ? { pending: s.pending.slice(0, 3).map((/** @type {unknown} */ a) => (typeof a === 'number' && Number.isFinite(a) ? a : String(a).slice(0, 64))) } : {}),
  };
}

/** The render's spectrum (16 x 10 digits and spaces) and its differing cues, at most. */
const SPECTRUM_CUT = 200;
const DIFFERS_MAX = 32;

/**
 * The sound's state, field by field (audio/engine.js report()), or null.
 * @param {any} a
 */
export function audioField(a) {
  if (!a || typeof a !== 'object') return null;
  const r = a.render && typeof a.render === 'object' ? a.render : null;
  return {
    v: 1,
    on: Boolean(a.on),
    unlocked: Boolean(a.unlocked),
    session: str(a.session),
    state: str(a.state),
    rate: num(a.rate),
    worklet: String(a.worklet ?? '').slice(0, 80),
    kicks: num(a.kicks),
    rebuilds: num(a.rebuilds),
    played: num(a.played),
    render: r
      ? {
          path: str(r.path),
          ms: num(r.ms),
          peakDb: num(r.peakDb),
          truePeakDb: num(r.truePeakDb),
          lufsI: num(r.lufsI),
          lufsMMax: num(r.lufsMMax),
          lufsSMax: num(r.lufsSMax),
          spectrum: String(r.spectrum ?? '').slice(0, SPECTRUM_CUT),
          dsp: str(r.dsp),
          differs: (Array.isArray(r.differs) ? r.differs : []).slice(0, DIFFERS_MAX).map((/** @type {unknown} */ d) => String(d).slice(0, 40)),
        }
      : null,
  };
}

/**
 * Pure and synchronous: the bug report, built field by field from the
 * facts, so nothing else can ride along. The audio field is there only
 * when the sound has loaded (preview).
 * @param {any} f collectFacts()
 */
export function buildReport(f) {
  const d = f.device || {};
  const w = f.worker || {};
  const s = f.storage || {};
  return {
    report: REPORT_VERSION,
    build: str(f.build),
    commit: hexOr(f.commit, /^[0-9a-f]{40}$/),
    rules: hexOr(f.rules, /^[0-9a-f]{12}$/),
    channel: str(f.channel),
    time: str(f.time),
    screen: str(f.screen),
    device: {
      ua: String(d.ua || ''),
      screen: pair(d.screen),
      viewport: pair(d.viewport),
      dpr: num(d.dpr),
      standalone: Boolean(d.standalone),
      orientation: d.orientation === 'landscape' ? 'landscape' : 'portrait',
      reducedMotion: Boolean(d.reducedMotion),
    },
    app: {
      worker: str(w.worker),
      workerBuild: str(w.build),
      update: Boolean(w.update),
      offline: Boolean(w.offline),
      persisted: typeof s.persisted === 'boolean' ? s.persisted : null,
      storage: { usage: num(s.usage), quota: num(s.quota) },
      keys: (Array.isArray(f.keys) ? f.keys : []).slice(0, KEYS_MAX).map((/** @type {unknown} */ k) => String(k).slice(0, 64)),
    },
    selfcheck: checkField(f.selfcheck),
    errors: (Array.isArray(f.errors) ? f.errors : []).map((/** @type {any} */ e) => ({
      message: String(e.message ?? ''),
      stack: String(e.stack ?? ''),
      source: str(e.source),
      line: num(e.line),
      col: num(e.col),
      ms: num(e.ms),
    })),
    note: String(f.note || '').slice(0, NOTE_MAX),
    state: stateField(f.state),
    ...(f.audio ? { audio: audioField(f.audio) } : {}),
  };
}

/** The report in a json fence, so a pasted GitHub issue shows it verbatim. */
const fenced = (/** @type {unknown} */ r) => `\`\`\`json\n${JSON.stringify(r, null, 1)}\n\`\`\``;

/**
 * The report as copied, under MAX_REPORT characters: first the trip's
 * snapshot goes (a replay rebuilds it from the log), then each stack is cut
 * to 2,000 characters, then the oldest errors go (the newest 5 stay), then
 * the note is cut to 500, and last of all the messages too and, one by one,
 * the oldest errors left. The log, the profile and the base are never cut.
 * @param {ReturnType<typeof buildReport>} report
 */
export function reportText(report) {
  let r = report;
  let text = fenced(r);
  /** @typedef {ReturnType<typeof buildReport>} Report */
  /** @typedef {Report['errors'][number]} ReportError */
  /** @type {((x: Report) => Report)[]} */
  const steps = [
    (x) => (x.state && x.state.trip ? { ...x, state: { ...x.state, trip: { ...x.state.trip, snapshot: null } } } : x),
    (x) => ({ ...x, errors: x.errors.map((/** @type {ReportError} */ e) => ({ ...e, stack: e.stack.slice(0, STACK_CUT) })) }),
    (x) => ({ ...x, errors: x.errors.slice(-KEEP_ERRORS) }),
    (x) => ({ ...x, note: x.note.slice(0, NOTE_CUT) }),
    (x) => ({ ...x, device: { ...x.device, ua: x.device.ua.slice(0, NOTE_CUT) }, errors: x.errors.map((/** @type {ReportError} */ e) => ({ ...e, message: e.message.slice(0, NOTE_CUT) })) }),
  ];
  for (const step of steps) {
    if (text.length <= MAX_REPORT) return text;
    r = step(r);
    text = fenced(r);
  }
  while (text.length > MAX_REPORT && r.errors.length) {
    r = { ...r, errors: r.errors.slice(1) };
    text = fenced(r);
  }
  return text;
}

function clearNote() {
  note = '';
  if (menu) menu.noteField.value = '';
}

/**
 * Copy bug report, for the menu and the error sheet alike. Call it inside
 * the tap: the report is built and the clipboard written at once. On
 * success the button shows a ✓ for 2 s and the note is cleared. If the
 * clipboard refuses, the report appears selected in area (a long press
 * offers iOS's Copy), and the same button's next tap opens the share sheet,
 * whose first row is Copy. Resolves to what happened.
 * @param {HTMLElement} button
 * @param {HTMLTextAreaElement} area a readonly textarea, hidden until needed
 * @param {{nav?: any, facts?: any}} [o]
 * @returns {Promise<'copied' | 'fallback' | 'shared' | 'closed' | 'selected'>}
 */
export function copyReport(button, area, { nav = globalThis.navigator, facts } = {}) {
  const text = reportText(buildReport(facts || collectFacts(button.ownerDocument)));
  if (button.dataset.mode === 'share') {
    area.value = text;
    return shareText(text, nav).then(
      () => 'shared',
      (err) => {
        if (err && err.name === 'AbortError') return 'closed';
        selectAll(area);
        return 'selected';
      },
    );
  }
  return copyText(text, nav).then(
    () => {
      button.classList.add('done');
      setTimeout(() => button.classList.remove('done'), DONE_MS);
      clearNote();
      return 'copied';
    },
    () => {
      area.value = text;
      area.hidden = false;
      selectAll(area);
      button.dataset.mode = 'share';
      return 'fallback';
    },
  );
}

/**
 * An element with attributes (class as a list) and children.
 * @param {Document} doc
 * @param {string} tag
 * @param {Record<string, string | string[]>} [attrs]
 * @param {...Node} kids
 * @returns {HTMLElement}
 */
function h(doc, tag, attrs = {}, ...kids) {
  const el = doc.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (Array.isArray(v)) el.classList.add(...v);
    else el.setAttribute(k, v);
  }
  for (const kid of kids) el.appendChild(kid);
  return el;
}

/** Preview's saved marks choice (default on). */
function savedMarks() {
  const m = load('marks');
  return MARK_MODES.includes(m) ? m : 'on';
}

/**
 * @param {{marks: [string, HTMLElement][]}} m the menu
 * @param {string} mode
 */
function showMarks(m, mode) {
  for (const [k, b] of m.marks) b.setAttribute('aria-pressed', String(k === mode));
}

/**
 * Pure: the self-check line's state and its words' id, from a result.
 * @param {any} c ui/selfcheck.js's result
 * @returns {['running' | 'match' | 'differs' | 'error', string]}
 */
export function checkLine(c) {
  if (!c || !c.ran) return ['running', 'dev.check.running'];
  if (c.match === true) return ['match', 'dev.check.match'];
  return [c.match === false ? 'differs' : 'error', 'dev.check.differs'];
}

/** @param {{doc: Document, check: HTMLElement, pre: HTMLElement}} m the menu */
function refresh(m) {
  const [state, id] = checkLine(checkResult());
  m.check.setAttribute('data-check', state);
  tx(m.check, id); // t-ids: dev.check.running, dev.check.match, dev.check.differs
  m.pre.textContent = reportText(buildReport(collectFacts(m.doc)));
}

/**
 * Draw the registered dev controls and actions into the menu's dev section
 * (preview builds with the trail only; it is null elsewhere): controls
 * first, then actions, each in the order registered.
 * @param {{doc: Document, dev: HTMLElement | null}} m the menu
 */
function renderDev(m) {
  const box = m.dev;
  if (!box) return;
  const doc = m.doc;
  while (box.firstChild) box.removeChild(box.firstChild);
  for (const c of devControls.values()) {
    const labelId = `${DEV_ID}-${c.id}`;
    const label = h(doc, 'span', { class: ['marks-label'], id: labelId });
    tx(label, c.label); // t-ids: dev.hour, dev.text
    const group = h(doc, 'div', { class: ['marks', 'dev-control'], role: 'group', 'aria-labelledby': labelId, 'data-dev': c.id }, label);
    const now = c.get();
    for (const o of c.options) {
      const b = h(doc, 'button', { class: ['marks-mode'], type: 'button', 'data-value': o.value });
      tx(b, o.label); // t-ids: dev.hour.auto, dev.hour.day, dev.hour.dusk, dev.hour.blue, dev.hour.night, dev.text.auto, dev.text.pixel, dev.text.plain
      b.setAttribute('aria-pressed', String(o.value === now));
      b.addEventListener('click', () => {
        c.set(o.value);
        renderDev(m);
      });
      group.appendChild(b);
    }
    box.appendChild(group);
  }
  for (const a of devActions.values()) {
    const b = h(doc, 'button', { class: ['box', 'choice', 'debug-action'], type: 'button', 'data-dev': a.id });
    tx(b, a.label); // t-ids: dev.scenes, dev.audio.render
    const out = h(doc, 'p', { class: ['debug-check', 'debug-out'], role: 'status' });
    b.addEventListener('click', () => a.run({ doc, close: closeMenu, out }));
    box.appendChild(b);
    box.appendChild(out);
  }
}

function closeMenu() {
  if (!menu || menu.scrim.hidden) return;
  menu.scrim.hidden = true;
  const stamp = menu.doc.getElementById('build-stamp');
  if (stamp && typeof stamp.focus === 'function') stamp.focus({ preventScroll: true });
}

/**
 * The menu, built once, on first open.
 * @param {Document} doc
 */
function buildMenu(doc) {
  const html = doc.documentElement;
  const preview = html.dataset.channel !== 'main';

  const id = h(doc, 'p', { class: ['debug-id'], id: HEAD_ID });
  id.textContent = `${html.dataset.build || ''} · ${html.dataset.channel || ''}`;
  const close = h(doc, 'button', { class: ['debug-close'], type: 'button' });
  close.textContent = '×';
  close.setAttribute('aria-label', t('dev.close'));
  const head = h(doc, 'div', { class: ['debug-head'] }, id, close);

  // The copy fallback's textarea sits before the report, which CSS hides
  // while the textarea shows (they hold the same text).
  const area = /** @type {HTMLTextAreaElement} */ (h(doc, 'textarea', { class: ['report'], readonly: '', 'aria-labelledby': HEAD_ID }));
  area.hidden = true;
  const pre = h(doc, 'pre', { class: ['report'] });
  // The replay self-check's one line, above the report (BUILD_PLAN S3).
  const check = h(doc, 'p', { class: ['debug-check'], role: 'status' });

  const noteLabel = h(doc, 'label', { class: ['debug-note-label'], for: NOTE_ID });
  tx(noteLabel, 'dev.note');
  const noteField = /** @type {HTMLTextAreaElement} */ (h(doc, 'textarea', { class: ['debug-note'], id: NOTE_ID, maxlength: String(NOTE_MAX), rows: '3' }));
  noteField.value = note;

  const copy = h(doc, 'button', { class: ['box', 'choice'], type: 'button' });
  tx(copy, 'app.error.copy');

  const sheet = h(doc, 'div', { class: ['sheet', 'box', 'debug-sheet'], role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': HEAD_ID }, head, check, area, pre, noteLabel, noteField, copy);

  /** @type {[string, HTMLElement][]} */
  const marks = [];
  if (preview) {
    const label = h(doc, 'span', { class: ['marks-label'], id: MARKS_ID });
    tx(label, 'dev.marks');
    const group = h(doc, 'div', { class: ['marks'], role: 'group', 'aria-labelledby': MARKS_ID }, label);
    for (const [mode, lineId] of MARKS) {
      const b = h(doc, 'button', { class: ['marks-mode'], type: 'button' });
      tx(b, lineId); // t-ids: dev.marks.on, dev.marks.drafts, dev.marks.off
      b.addEventListener('click', () => {
        save('marks', mode);
        setMarks(doc, mode);
        showMarks(/** @type {any} */ (menu), mode);
      });
      group.appendChild(b);
      marks.push([mode, b]);
    }
    sheet.appendChild(group);
  }

  // The pencil map, where the build has it (preview, S4): the installed app
  // has no address bar, so this sets #map, and main.js opens the map.
  if (opensMap(doc)) {
    const mapButton = h(doc, 'button', { class: ['box', 'choice', 'debug-map'], type: 'button' });
    tx(mapButton, 'dev.map');
    mapButton.addEventListener('click', () => {
      closeMenu();
      const win = doc.defaultView;
      if (win) win.location.hash = MAP_HASH.slice(1);
    });
    sheet.appendChild(mapButton);
  }

  // The registered dev controls and actions (S5), after the map, where the
  // build has the trail (preview); main's menu has no such section.
  const dev = preview && opensTrail(doc) ? h(doc, 'div', { class: ['debug-dev'], id: DEV_ID }) : null;
  if (dev) sheet.appendChild(dev);

  const throwIt = h(doc, 'button', { class: ['box', 'choice', 'debug-throw'], type: 'button' });
  tx(throwIt, 'dev.throw');
  sheet.appendChild(throwIt);

  const scrim = h(doc, 'div', { class: ['scrim', 'debug'] }, sheet);
  scrim.hidden = true;
  doc.body.appendChild(scrim);

  const m = { doc, scrim, check, pre, area, noteField, close, marks, dev };
  renderDev(m);
  // A self-check that finishes while the menu is built redraws it.
  onCheck(() => refresh(m));
  close.addEventListener('click', closeMenu);
  scrim.addEventListener('click', (/** @type {Event} */ event) => {
    if (event.target === scrim) closeMenu();
  });
  doc.addEventListener('keydown', (/** @type {KeyboardEvent} */ event) => {
    if (event.key === 'Escape') closeMenu(); // t-ok: a key's name, never shown
  });
  noteField.addEventListener('input', () => {
    note = noteField.value;
    refresh(m);
  });
  noteField.addEventListener('focus', () => {
    // Keep the field in view above the keyboard once it has slid up.
    setTimeout(() => noteField.scrollIntoView({ block: 'center' }), 300);
  });
  copy.addEventListener('click', () => {
    copyReport(copy, area).then(() => refresh(m));
  });
  throwIt.addEventListener('click', () => {
    closeMenu();
    // Uncaught on purpose, so it reaches the error sheet as a real one would.
    setTimeout(() => {
      throw new Error('debug: test error');
    }, 0);
  });
  return m;
}

/** @type {Promise<unknown> | null} the line inspector, once debug mode has loaded it */
let inspector = null;

/**
 * The line inspector (ui/inspect.js; BUILD_PLAN 10.3, S5): loaded once,
 * when debug mode starts on a build with the trail (preview); main's page
 * never imports it. A long press on any words then opens its card.
 * @param {Document} doc
 */
export function loadInspector(doc) {
  if (!inspector) {
    inspector = import('./inspect.js') // screens: trail
      .then(({ installInspector }) => installInspector(doc))
      .catch((e) => {
        console.warn('debug: no line inspector', e);
        inspector = null;
        return null;
      });
  }
  return inspector;
}

/**
 * Open the debug menu, building it the first time. Debug mode stays on
 * until reload; on preview it applies the saved marks choice.
 * @param {Document} doc
 * @param {Promise<unknown>} [words] loadText(), so the labels are there
 */
export async function openDebug(doc, words = Promise.resolve()) {
  debugOn = true;
  const preview = doc.documentElement.dataset.channel !== 'main';
  if (preview) setMarks(doc, savedMarks());
  if (preview && opensTrail(doc)) loadInspector(doc);
  await words;
  await storageFacts();
  if (!menu) menu = buildMenu(doc);
  if (!checkResult().ran) runCheck();
  if (preview) showMarks(menu, savedMarks());
  renderDev(menu);
  refresh(menu);
  menu.scrim.hidden = false;
  menu.close.focus();
}

/**
 * Wire the entry: five quick taps on the build stamp, or ?debug=1.
 * @param {Document} doc
 * @param {Promise<unknown>} [words] loadText()
 */
export function initDebug(doc, words = Promise.resolve()) {
  const stamp = doc.getElementById('build-stamp');
  const tap = makeTapCounter();
  if (stamp) {
    stamp.addEventListener('pointerup', (event) => {
      if (tap(event.timeStamp)) openDebug(doc, words);
    });
    // iOS still zooms on quick repeated taps on text, touch-action or not;
    // cancelling the touch's end stops the zoom (pointerup has already fired).
    stamp.addEventListener('touchend', (event) => event.preventDefault(), { passive: false });
  }
  const win = doc.defaultView;
  if (win && debugRequested(win.location.search)) openDebug(doc, words);
}
