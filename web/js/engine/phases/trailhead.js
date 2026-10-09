// The trailhead: S3 runs a stop list here (BUILD_PLAN S3; S15a's tailgate
// replaces it).
//
// PURE. A stop has either `next` (Walk on: the next stop, or null for the
// set's end, where the plan's `after` applies) or `choices`. A choice
// shows when its show_if holds (a hidden choice is not on the screen);
// choosing it applies its effects in order (a flag, whole seconds), then
// goes to `then`, or rolls: p from the state the player saw, u from the
// roll stream keyed by the rule, the set, the stop, the choice, the trip day
// and the attempts at that choice that day (8.14: the same choice on the
// same day gives the same roll; a genuine second attempt rolls fresh), pass
// when u < p. Every move to a stop, the same one included, counts n up.

import { EngineError } from '../error.js';
import { draw } from '../rng.js';
import { addSeconds } from '../clock.js';
import { exprEnv, moveTo, endOfSet, withTrip } from '../trip.js';
import { stopLines, choiceLabel } from '../voice.js';

/**
 * The choices showing at a stop.
 * @param {any} trip
 * @param {any} stop
 * @param {import('../content.js').Content} content
 */
function shown(trip, stop, content) {
  const env = exprEnv(trip);
  return stop.choices.filter((/** @type {any} */ c) => !c.show_if || content.expr(c.show_if)(env) === true);
}

/** @param {any} state @param {import('../content.js').Content} content */
function here(state, content) {
  const t = state.trip;
  const stop = content.stop(t.set, t.stop);
  if (!stop) throw new EngineError('state', 'trailhead: no such stop');
  return stop;
}

/**
 * The attempts key for a choice at a trip's stop on its day.
 * @param {any} trip
 * @param {string} choice
 */
export const attemptsKey = (trip, choice) => `${trip.set}.${trip.stop}.${choice}.${trip.clock.day}`;

/**
 * The roll's u for a choice at a trip's current stop: the roll stream keyed
 * by E.8's order (the rule, the node, the card, the choice, the trip day,
 * the attempts here), with the stop set as the node and the stop as the
 * card, as the text stream keys them. Tools that look for seeds (the
 * goldens) call this, so they never re-derive the key.
 * @param {any} trip
 * @param {string} choice
 * @returns {number} in [0, 1)
 */
export function rollOf(trip, choice) {
  const key = attemptsKey(trip, choice);
  const k = Object.prototype.hasOwnProperty.call(trip.attempts, key) ? trip.attempts[key] : 0;
  return draw(trip.seed, 'roll', trip.rule, trip.set, trip.stop, choice, trip.clock.day, k).float();
}

/**
 * @param {any} state
 * @param {string} c
 * @param {import('../content.js').Content} content
 */
function choose(state, c, content) {
  const t = state.trip;
  const stop = here(state, content);
  if (!stop.choices) throw new EngineError('refused', 'trailhead: this stop has no choices');
  const choice = shown(t, stop, content).find((/** @type {any} */ x) => x.id === c);
  if (!choice) throw new EngineError('refused', 'trailhead: that choice is not on the screen');
  let target = choice.then;
  let attempts = t.attempts;
  if (choice.roll) {
    const p = content.expr(choice.roll.p)(exprEnv(t));
    if (typeof p !== 'number' || !(p >= 0 && p <= 1)) throw new EngineError('expr', 'trailhead: a roll p is outside 0..1');
    const key = attemptsKey(t, choice.id);
    const u = rollOf(t, choice.id);
    target = u < p ? choice.roll.pass : choice.roll.fail;
    attempts = { ...attempts, [key]: (Object.prototype.hasOwnProperty.call(attempts, key) ? attempts[key] : 0) + 1 };
  }
  let flags = t.flags;
  let clock = t.clock;
  for (const e of choice.effects || []) {
    if (Object.prototype.hasOwnProperty.call(e, 'flag')) flags = { ...flags, [e.flag]: true };
    else if (Object.prototype.hasOwnProperty.call(e, 'add_s')) clock = addSeconds(clock, e.add_s);
    else throw new EngineError('state', 'trailhead: an effect S3 does not know');
  }
  return moveTo(withTrip(state, { ...t, flags, clock, attempts }), content, target);
}

/** @type {import('../phase.js').Phase} */
export default Object.freeze({
  id: 'trailhead',
  built: true,
  lands: 'S3',
  level: 'trip',
  accepts: Object.freeze(['next', 'choose', 'wait']),
  enter(state, content) {
    here(state, content);
    return state;
  },
  step(state, action, content) {
    const t = state.trip;
    if (action.t === 'wait') return withTrip(state, { ...t, clock: addSeconds(t.clock, action.s) });
    if (action.t === 'choose') return choose(state, action.c, content);
    const stop = here(state, content);
    if (!Object.prototype.hasOwnProperty.call(stop, 'next')) throw new EngineError('refused', 'trailhead: this stop has choices, not Walk on');
    return stop.next === null ? endOfSet(state, content) : moveTo(state, content, stop.next);
  },
  screen(state, content) {
    const t = state.trip;
    const stop = here(state, content);
    const choices = stop.choices
      ? shown(t, stop, content).map((/** @type {any} */ c) => ({ act: { t: 'choose', c: c.id }, label: choiceLabel(content, t, c.id), enabled: true }))
      : [{ act: { t: 'next' }, label: null, enabled: true }];
    return { phase: t.phase, stop: { set: t.set, id: t.stop, n: t.n }, box: stopLines(content, t), choices };
  },
});
