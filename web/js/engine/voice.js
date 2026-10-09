// Stop text by id (BUILD_PLAN 2.3: was narrator.js; GAME_DESIGN E.8, E.12 #6).
//
// PURE. A stop's box is a list of slots, each with its variant line ids
// (data/voice.json, not rules-hashed). The variant comes from the text
// stream keyed by the set, the stop, the slot and the trip day (E.8's text
// stream: node, slot, trip day), so wording never touches an outcome. S9's
// cards and pools grow this file.

import { EngineError } from './error.js';
import { pick, ref } from './template.js';

/**
 * The box's lines for a trip's current stop, as Refs.
 * @param {import('./content.js').Content} content
 * @param {{seed: string, set: string, stop: string, clock: {day: number}}} trip
 * @returns {import('./template.js').Ref[]}
 */
export function stopLines(content, trip) {
  const v = content.voice(trip.set, trip.stop);
  if (!v) throw new EngineError('state', 'voice: the stop has no display data');
  return v.box.map((/** @type {string[]} */ variants, /** @type {number} */ slot) => ref(pick(trip.seed, [trip.set, trip.stop, slot, trip.clock.day], variants)));
}

/**
 * A choice's label, as a Ref.
 * @param {import('./content.js').Content} content
 * @param {{set: string, stop: string}} trip
 * @param {string} choice
 * @returns {import('./template.js').Ref}
 */
export function choiceLabel(content, trip, choice) {
  const v = content.voice(trip.set, trip.stop);
  const id = v && v.labels && Object.prototype.hasOwnProperty.call(v.labels, choice) ? v.labels[choice] : null;
  if (!id) throw new EngineError('state', 'voice: a choice has no label');
  return ref(id);
}
