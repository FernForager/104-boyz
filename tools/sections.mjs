// Track B's data sections (BUILD_PLAN S4; the spec's section 2.3): each
// compiled from its validated files into the rules data the engine will
// read, whenever its sources are here. tools/scope.mjs SECTIONS says which
// screen ships each; in S4 only the park ships (with the map), so these are
// compiled, validated and linted on every build, and reach a channel's
// rules.json in the sessions that build their screens. Words never reach
// the rules: docs, evidence and reasons are dropped here, and the quiz's
// line refs wait for S7's voice data.
//
//   conditions  content/park/conditions/2026.json (S10, plan)
//   permits     content/park/permits.json (S10, plan)
//   daylight    content/data/daylight.json (S8, trail)
//   climate     content/data/climate.json (S7, home)
//   sun         content/data/quinault_sun.json (S7, home)
//   kits        content/rules/kits.json (S11, town)
//   quiz        content/quiz/locals.json: the deal and each question's
//               right answer (S7, lockbox; the words are voice data)
//   items       content/gear/items.json (S11, town)
//   foods       content/food/items.json (S11, town)
//   stores      content/stores/stores.json (S11, town)
//   drives      content/drive/routes.json (S15a, drive)
//   home        content/home/cabin.json's next table: the next-step
//               button's states, each with its rule and the session that
//               lands it (S7, home; the rest of cabin.json is display data,
//               art.json's cabin)

import { NEXT_WHEN, NEXT_ACTS } from '../web/js/engine/phases/home.js';

const own = (o, k) => o !== null && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);

/** Keys that hold words for authors, never rules. */
const WORD_KEYS = new Set(['$comment', 'doc', 'evidence', 'deferred']);

/** A value with every word key dropped, at every level. */
export function stripWords(v) {
  if (Array.isArray(v)) return v.map(stripWords);
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, x] of Object.entries(v)) if (!WORD_KEYS.has(k)) out[k] = stripWords(x);
    return out;
  }
  return v;
}

/** The section compiler for one file: its data, words dropped, or null when it isn't here. */
const fromFile = (path, shape = (d) => d) => ({ files }) => {
  const f = files.get(path);
  if (!f) return null;
  return { format: 1, ...stripWords(shape(f.data)) };
};

/**
 * The drives: words dropped, and every road's conditions entry found.
 * @param {{files: Map<string, {data: any, src: string}>, add: (file: string, line: number, code: string, msg: string) => void}} ctx
 */
function compileDrives({ files, add }) {
  const f = files.get('content/drive/routes.json');
  if (!f) return null;
  const cond = files.get('content/park/conditions/2026.json');
  const named = new Set(cond ? cond.data.entries.flatMap((e) => e.applies_to) : []);
  for (const road of Object.keys(f.data.roads || {})) if (cond && !named.has(road)) add('content/drive/routes.json', 1, 'R01', `roads.${road} is named by no entry of the dated conditions`);
  for (const [id, r] of Object.entries(f.data.routes || {})) {
    if (r.legs) {
      const sum = r.legs.reduce((a, l) => a + l.minutes, 0);
      if (sum !== r.minutes) add('content/drive/routes.json', 1, 'R01', `routes.${id}: its legs sum to ${sum} minutes, not ${r.minutes}`);
      if (r.legs[r.legs.length - 1].to !== r.to) add('content/drive/routes.json', 1, 'R01', `routes.${id}: its last leg ends at ${r.legs[r.legs.length - 1].to}, not ${r.to}`);
    }
  }
  return { format: 1, ...stripWords(f.data) };
}

/**
 * The quiz's rules data: the deal, its rules and each question's right
 * answer and kinds; the words (line refs) are display data, for S7.
 * @param {{files: Map<string, {data: any, src: string}>, add: (file: string, line: number, code: string, msg: string) => void}} ctx
 */
function compileQuiz({ files, add }) {
  const f = files.get('content/quiz/locals.json');
  if (!f) return null;
  const d = f.data;
  const seen = new Set();
  for (const q of d.questions) {
    if (seen.has(q.id)) add('content/quiz/locals.json', 1, 'R01', `questions: ${q.id} is listed twice`);
    seen.add(q.id);
  }
  if (d.deal > d.questions.length) add('content/quiz/locals.json', 1, 'R01', `deal ${d.deal} is more than the ${d.questions.length} questions`);
  return {
    format: 1,
    deal: d.deal,
    rules: { ...d.rules },
    questions: d.questions.map((q) => ({ id: q.id, answers: q.answers.length, right: q.right, pronunciation: q.pronunciation, indigenous_name: own(q, 'indigenous_name') })),
  };
}

/**
 * The stores: their shelves by id, the desk and the jobs; the deferred
 * items' reasons are words, so only their ids stay.
 * @param {{files: Map<string, {data: any, src: string}>}} ctx
 */
function compileStores({ files }) {
  const f = files.get('content/stores/stores.json');
  if (!f) return null;
  const d = structuredClone(f.data);
  for (const s of Object.values(d.stores)) if (s && s.deferred) s.deferred_ids = Object.keys(s.deferred).sort();
  return { format: 1, ...stripWords(d) };
}

/** The cabin's data (S7). */
export const CABIN_FILE = 'content/home/cabin.json';

/**
 * The home section (S7): the cabin's next-step table, its words (docs)
 * dropped. A row's rule must be one the engine knows (phases/home.js
 * NEXT_WHEN) and carry an act it knows (NEXT_ACTS); a row with no rule is
 * a later session's state, listed so the table is the plan's whole list,
 * and never reachable. Ids are unique.
 * @param {{files: Map<string, {data: any, src: string}>, add: (file: string, line: number, code: string, msg: string) => void}} ctx
 */
function compileHome({ files, add }) {
  const f = files.get(CABIN_FILE);
  if (!f) return null;
  const seen = new Set();
  for (const row of f.data.next) {
    if (seen.has(row.id)) add(CABIN_FILE, 1, 'R01', `next: ${row.id} is listed twice`);
    seen.add(row.id);
    if (row.when !== undefined && !own(NEXT_WHEN, row.when)) add(CABIN_FILE, 1, 'R01', `next.${row.id}: "${row.when}" is no rule the engine knows (phases/home.js NEXT_WHEN)`);
    if (row.when !== undefined && !NEXT_ACTS.includes(row.act)) add(CABIN_FILE, 1, 'R01', `next.${row.id}: a live row needs an act the engine knows (${NEXT_ACTS.join(', ')})`);
    if (row.when === undefined && row.act !== undefined) add(CABIN_FILE, 1, 'R01', `next.${row.id}: an act with no rule`);
  }
  return { format: 1, next: f.data.next.map((/** @type {any} */ row) => stripWords(row)) };
}

/** Track B's section compilers, by section name (tools/scope.mjs SECTIONS). */
export const B_SECTIONS = Object.freeze({
  conditions: fromFile('content/park/conditions/2026.json'),
  permits: fromFile('content/park/permits.json'),
  daylight: fromFile('content/data/daylight.json'),
  climate: fromFile('content/data/climate.json'),
  sun: fromFile('content/data/quinault_sun.json'),
  kits: fromFile('content/rules/kits.json'),
  quiz: compileQuiz,
  items: fromFile('content/gear/items.json'),
  foods: fromFile('content/food/items.json'),
  stores: compileStores,
  drives: compileDrives,
  home: compileHome,
});
