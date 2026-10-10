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
//
// S6 (BUILD_PLAN S6; GAME_DESIGN 8.1, 8.5, 8.7, 8.8, 8.14, 9.5, 12.11 to
// 12.13): a choice may carry `odds` instead, priced by odds.js from the
// shared constants (rules.odds) and rolled from the same key, three draws
// in order (the band, the fail entry, the death roll): the band's stop is
// the next, and trip.rolled holds {stop, c, band} until the next move. A
// stop may walk: the clock moves by the router's time with 7.4's breaks
// (S8's movement model replaces it), on Walk on from a stop, or on entering
// an outcome stop, whose extra time (add_s) follows. An outcome stop's Walk
// on ends the set; a death's ends the hiker too (the guest book signs a new
// one: S24a's five screens come later). The screen carries each rolled
// choice's odds (its kind, made it, its fail share, its fatal share as
// shown) and its Why sheet's data (the rows, the bands, the fatal
// arithmetic, the router's arrival), a sure choice's tag, and on an outcome
// stop its severity, its pencil rows and the roll's bands and band (never
// the raw draws, 8.8). The UI words and formats all of it.

import { EngineError } from '../error.js';
import { draw } from '../rng.js';
import { addSeconds } from '../clock.js';
import { route } from '../graph.js';
import { withBreaks } from '../movement.js';
import { pOf, bandsOf, diamondOf, fatalOf, landOf } from '../odds.js';
import { ref } from '../template.js';
import { exprEnv, moveTo, endOfSet, withTrip } from '../trip.js';
import { stopLines, choiceLabel, choiceWords } from '../voice.js';

const own = (/** @type {any} */ o, /** @type {string} */ k) => Object.prototype.hasOwnProperty.call(o, k);

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
 * The roll stream's generator for a choice at a trip's current stop: keyed
 * by E.8's order (the rule, the node, the card, the choice, the trip day,
 * the attempts here), with the stop set as the node and the stop as the
 * card, as the text stream keys them.
 * @param {any} trip
 * @param {string} choice
 */
function rollGen(trip, choice) {
  const key = attemptsKey(trip, choice);
  const k = own(trip.attempts, key) ? trip.attempts[key] : 0;
  return draw(trip.seed, 'roll', trip.rule, trip.set, trip.stop, choice, trip.clock.day, k);
}

/**
 * The roll's u for a choice at a trip's current stop: the first draw of its
 * key (rollGen). Tools that look for seeds (the goldens) call this, so they
 * never re-derive the key.
 * @param {any} trip
 * @param {string} choice
 * @returns {number} in [0, 1)
 */
export function rollOf(trip, choice) {
  return rollGen(trip, choice).float();
}

/**
 * The three draws an odds roll uses, in order, from the same key as rollOf
 * (whose u is the first over 2^32): the band, the fail entry, the death.
 * @param {any} trip
 * @param {string} choice
 * @returns {[number, number, number]} three u32s
 */
export function rollsOf(trip, choice) {
  const g = rollGen(trip, choice);
  return [g.u32(), g.u32(), g.u32()];
}

/**
 * A rolled choice priced for a trip as it stands (odds.js): its rows and
 * p, its bands, whether it is a diamond, and its fatal share.
 * @param {any} trip
 * @param {any} choice
 * @param {import('../content.js').Content} content
 */
export function priceOf(trip, choice, content) {
  const constants = content.odds();
  if (!constants) throw new EngineError('state', 'trailhead: a rolled choice, and no odds in the rules');
  const { rows, p } = pOf(constants, choice.odds, exprEnv(trip), content.oddsVoice());
  const bands = bandsOf(p, constants);
  const diamond = diamondOf(choice.odds.fail);
  // Only a diamond carries a fatal share (8.1; the content check holds every death to one).
  const fatal = diamond ? fatalOf(bands.fail, choice.odds.fail) : null;
  return { rows, p, bands, diamond, fatal };
}

/**
 * The router's time for a walk, with 7.4's breaks, and its miles.
 * @param {import('../content.js').Content} content
 * @param {{from: string, via?: string[], to: string}} w
 * @param {string} [to] another end on the same way (a route's exposed_to)
 */
function timed(content, w, to = w.to) {
  const graph = content.graph();
  if (!graph) throw new EngineError('state', 'trailhead: a walk, and no park in the rules');
  const r = route(graph, [w.from, ...(w.via || []), to]);
  return { s: withBreaks(graph.movement, r.s), mi10: r.mi10 };
}

/**
 * A trip after a walk: its clock moved by the router's time.
 * @param {any} state
 * @param {import('../content.js').Content} content
 * @param {{from: string, via?: string[], to: string}} w
 */
function walked(state, content, w) {
  const t = state.trip;
  return withTrip(state, { ...t, clock: addSeconds(t.clock, timed(content, w).s) });
}

/**
 * Move to a stop; on entering an outcome stop, take its walk and its extra
 * time.
 * @param {any} state
 * @param {import('../content.js').Content} content
 * @param {string} id
 */
function arrive(state, content, id) {
  let s = moveTo(state, content, id);
  const stop = here(s, content);
  if (!stop.outcome) return s;
  if (stop.walk) s = walked(s, content, stop.walk);
  if (stop.add_s) s = withTrip(s, { ...s.trip, clock: addSeconds(s.trip.clock, stop.add_s) });
  return s;
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
  /** @type {{stop: string, c: string, band: string} | null} */
  let rolled = null;
  const counted = () => {
    const key = attemptsKey(t, choice.id);
    return { ...attempts, [key]: (own(attempts, key) ? attempts[key] : 0) + 1 };
  };
  if (choice.roll) {
    const p = content.expr(choice.roll.p)(exprEnv(t));
    if (typeof p !== 'number' || !(p >= 0 && p <= 1)) throw new EngineError('expr', 'trailhead: a roll p is outside 0..1');
    const u = rollOf(t, choice.id);
    target = u < p ? choice.roll.pass : choice.roll.fail;
    attempts = counted();
  } else if (choice.odds) {
    const priced = priceOf(t, choice, content);
    const land = landOf(priced.bands, choice.odds, rollsOf(t, choice.id), t.rule);
    target = land.to;
    attempts = counted();
    rolled = { stop: t.stop, c: choice.id, band: land.band };
  }
  let flags = t.flags;
  let clock = t.clock;
  for (const e of choice.effects || []) {
    if (own(e, 'flag')) flags = { ...flags, [e.flag]: true };
    else if (own(e, 'add_s')) clock = addSeconds(clock, e.add_s);
    else throw new EngineError('state', 'trailhead: an effect S3 does not know');
  }
  const next = arrive(withTrip(state, { ...t, flags, clock, attempts }), content, target);
  return rolled ? withTrip(next, { ...next.trip, rolled }) : next;
}

/**
 * A choice as the screen shows it: its action and label, and from S6 a
 * sure choice's tag, or a rolled choice's odds and Why sheet.
 * @param {any} t
 * @param {any} c
 * @param {import('../content.js').Content} content
 */
function choiceScreen(t, c, content) {
  /** @type {any} */
  const out = { act: { t: 'choose', c: c.id }, label: choiceLabel(content, t, c.id), enabled: true };
  if (c.tag === 'sure') out.tag = 'sure';
  if (!c.odds) return out;
  const pr = priceOf(t, c, content);
  const words = choiceWords(content, t, t.stop, c.id);
  const { clean, shaky, fail, made } = pr.bands;
  out.odds = { kind: pr.diamond ? 'diamond' : 'pct', made, fail, fatal: pr.fatal ? pr.fatal.shown : null, failWord: pr.diamond ? words.failWord : null };
  /** @type {any} */
  let way = null;
  if (c.route) {
    const to = timed(content, c.route);
    way = { place: ref(`place.${c.route.to}`), eta_s: addSeconds(t.clock, to.s).s, mi10: to.mi10 };
    if (c.route.exposed_to) way.exposedUntil_s = addSeconds(t.clock, timed(content, c.route, c.route.exposed_to).s).s;
  }
  out.why = {
    rows: pr.rows.map((r) => ({ label: r.label, value: r.value })),
    p: pr.p,
    bands: { clean, shaky, fail },
    made,
    badly: words.badly,
    fatalCalc: pr.fatal ? { fail, band: pr.fatal.band, death: pr.fatal.death, exact: pr.fatal.exact, shown: pr.fatal.shown } : null,
    route: way,
  };
  return out;
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
    if (!own(stop, 'next')) throw new EngineError('refused', 'trailhead: this stop has choices, not Walk on');
    // Walk on takes the stop's walk (an outcome stop took its own on entering).
    const s = stop.walk && !stop.outcome ? walked(state, content, stop.walk) : state;
    return stop.next === null ? endOfSet(s, content, { died: stop.outcome === 'death' }) : arrive(s, content, stop.next);
  },
  screen(state, content) {
    const t = state.trip;
    const stop = here(state, content);
    const choices = stop.choices ? shown(t, stop, content).map((/** @type {any} */ c) => choiceScreen(t, c, content)) : [{ act: { t: 'next' }, label: null, enabled: true }];
    /** @type {any} */
    const screen = { phase: t.phase, stop: { set: t.set, id: t.stop, n: t.n }, box: stopLines(content, t), choices };
    if (stop.outcome) {
      // 12.13: the severity's ornament, and the pencil rows (where you got to, and when; the time a band cost).
      screen.outcome = stop.outcome;
      screen.pencil = stop.walk ? [{ arrive: ref(`place.${stop.walk.to}`), at_s: t.clock.s }] : [];
      if (stop.add_s) screen.pencil.push({ add_s: stop.add_s });
    }
    if (t.rolled) {
      // The roll's bands and the band it landed in, for the compass (8.8):
      // never the draws. Only the tap's own draw plays the compass, under
      // the content that rolled it; a save restored under a later build
      // whose set lacks the choice, or its odds, shows the outcome without
      // its roll (the outcome is the trip's; the roll only its display).
      const from = content.stop(t.set, t.rolled.stop);
      const choice = from && from.choices ? from.choices.find((/** @type {any} */ x) => x.id === t.rolled.c) : null;
      if (choice && choice.odds) {
        const pr = priceOf(t, choice, content);
        screen.roll = { c: t.rolled.c, kind: pr.diamond ? 'diamond' : 'pct', bands: { clean: pr.bands.clean, shaky: pr.bands.shaky, fail: pr.bands.fail }, fatal: pr.fatal ? pr.fatal.exact : null, landed: t.rolled.band };
      }
    }
    return screen;
  },
});
