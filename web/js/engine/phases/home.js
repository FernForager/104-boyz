// Home: the cabin (BUILD_PLAN S7, 11.2; GAME_DESIGN 2.2; S10 builds the map
// table).
//
// PURE. The next-step button is a pure function of the save (nextStep): the
// cabin's next table (content/home/cabin.json next, compiled to the rules'
// home section) lists every state the button will know, in order, each
// with the session that lands it; a row with a rule (`when`) is live, and
// the first whose rule holds is the button. S7's two:
//   plan_first  a hiker with no finished trip (Plan your first trip)
//   plan        any other hiker with no trip under way (Plan a trip)
// Each carries its act: until S10 a start of the sample plan when the
// content has one (the UI completes it with a seed it draws, E.8, Lead
// call 8), else null (main, after the cabin's promotion: the button shows,
// disabled, until trips reach it). The rows S10 to S25 fill (a plan
// drafted, the desk, back from town, packed, just home) have no rule yet,
// so none of them is reachable. A build without the home section (the
// engine fixture) takes S7's two rows (NEXT_S7; a test holds cabin.json's
// live rows to them). Nothing starts by itself: the screen has no `auto`,
// and a trip's end comes home to the cabin.

import { startTrip } from '../trip.js';

/** The plan S3's home starts, and S7's next step until S10's map table. */
export const HOME_PLAN = 'sample';

/**
 * The rules a next-step row may name (cabin.json next[].when), each a
 * test of the state. tools/sections.mjs refuses a table naming another.
 * @type {Readonly<Record<string, (state: any) => boolean>>}
 */
export const NEXT_WHEN = Object.freeze({
  no_finished_trip: (state) => Boolean(state.hiker) && !underWay(state) && state.hiker.trips === 0,
  no_trip_under_way: (state) => Boolean(state.hiker) && !underWay(state),
});

/** The acts a next-step row may carry (cabin.json next[].act). */
export const NEXT_ACTS = Object.freeze(['start']);

/** S7's live rows, for a build without the home section (the engine fixture). */
export const NEXT_S7 = Object.freeze([Object.freeze({ id: 'plan_first', when: 'no_finished_trip', act: 'start' }), Object.freeze({ id: 'plan', when: 'no_trip_under_way', act: 'start' })]);

/** @param {any} state */
const underWay = (state) => Boolean(state.trip && !state.trip.end);

/**
 * The plan the next step starts: the sample when the content has it, else
 * the first plan (the engine fixture's), else none.
 * @param {import('../content.js').Content} content
 * @returns {string | null}
 */
export function homePlan(content) {
  if (content.plan(HOME_PLAN)) return HOME_PLAN;
  const ids = content.plans();
  return ids.length ? ids[0] : null;
}

/**
 * @typedef {{id: string, act: {t: string, plan: string} | null}} NextStep
 */

/**
 * The next-step button for a state: the first live row of the content's
 * next table (S7's two without a home section) whose rule holds, with its
 * act (null when the content can't do it yet), or null when no row holds
 * (no hiker, or a trip under way).
 * @param {any} state
 * @param {import('../content.js').Content} content
 * @returns {NextStep | null}
 */
export function nextStep(state, content) {
  const home = typeof content.home === 'function' ? content.home() : null;
  /** @type {readonly {id: string, when?: string, act?: string}[]} */
  const rows = home ? home.next : NEXT_S7;
  for (const row of rows) {
    if (!row.when || !Object.prototype.hasOwnProperty.call(NEXT_WHEN, row.when)) continue;
    if (!NEXT_WHEN[row.when](state)) continue;
    const plan = row.act === 'start' ? homePlan(content) : null;
    return { id: row.id, act: plan ? { t: 'start', plan } : null };
  }
  return null;
}

/** @type {import('../phase.js').Phase} */
export default Object.freeze({
  id: 'home',
  built: true,
  lands: 'S7',
  level: 'hiker',
  accepts: Object.freeze(['start']),
  enter: (state) => state,
  step: (state, action, content) => startTrip(state, action.plan, action.seed, content),
  screen(state, content) {
    /** @type {import('../phase.js').Screen} */
    const screen = { phase: 'home', box: [], choices: [], next: nextStep(state, content) };
    return screen;
  },
});
