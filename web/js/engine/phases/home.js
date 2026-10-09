// Home, as a stub (BUILD_PLAN S3; S7 builds the cabin, S10 the map table).
//
// PURE. With no map table yet, home asks for the sample plan at once: its
// screen's `auto` is a start the UI completes with a seed it draws (E.8,
// Lead call 8) and dispatches. When a trip ends, the state comes back
// here, so the next start opens a fresh trip and a fresh log.

import { startTrip } from '../trip.js';

/** The plan S3's home starts. */
export const HOME_PLAN = 'sample';

/**
 * The plan the stub starts: the sample when the content has it, else the
 * first plan (the engine fixture's), else none.
 * @param {import('../content.js').Content} content
 * @returns {string | null}
 */
export function homePlan(content) {
  if (content.plan(HOME_PLAN)) return HOME_PLAN;
  const ids = content.plans();
  return ids.length ? ids[0] : null;
}

/** @type {import('../phase.js').Phase} */
export default Object.freeze({
  id: 'home',
  built: true,
  lands: 'S3',
  level: 'hiker',
  accepts: Object.freeze(['start']),
  enter: (state) => state,
  step: (state, action, content) => startTrip(state, action.plan, action.seed, content),
  screen(state, content) {
    const plan = homePlan(content);
    /** @type {import('../phase.js').Screen} */
    const screen = { phase: 'home', box: [], choices: [] };
    if (plan) screen.auto = { t: 'start', plan };
    return screen;
  },
});
