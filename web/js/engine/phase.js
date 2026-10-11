// What every phase module is (BUILD_PLAN 2.3: phases/*.js), and the stub a
// later session replaces.
//
// PURE. A phase module's default export:
//   id        the phase
//   built     false: entering it throws EngineError('unbuilt')
//   lands     the session that builds it (or finishes it)
//   level     'hiker' or 'trip': only trip phases' actions are logged
//   accepts   the action types it takes
//   enter(state, content) -> the state on entering
//   step(state, action, content) -> the next state (never mutating the input)
//   screen(state, content) -> the Screen

import { EngineError } from './error.js';

/**
 * @typedef {{act: Record<string, unknown>, label: import('./template.js').Ref | null, enabled: boolean}} Choice
 * @typedef {object} Screen
 * @property {string} phase
 * @property {'shut' | 'ask' | 'open'} [step] the lockbox's step (S7, phases/lockbox.js)
 * @property {number} [q] the lockbox's question shown, 1 to 3
 * @property {{set: string, id: string, n: number}} [stop]
 * @property {import('./template.js').Ref[]} box the Sierra box, line by line
 * @property {Choice[]} choices label null: the UI's own word (Sign, Walk on)
 * @property {{kind: string, max: number}} [input] the guest book's field
 * @property {{id: string, act: {t: string, plan: string} | null} | null} [next] home's next-step
 *   button (S7, phases/home.js nextStep): its id, and the act a tap completes
 *   and dispatches (null: shown disabled), or null for none
 * @typedef {object} Phase
 * @property {string} id
 * @property {boolean} built
 * @property {string} lands
 * @property {'hiker' | 'trip'} level
 * @property {readonly string[]} accepts
 * @property {(state: any, content: any) => any} enter
 * @property {(state: any, action: any, content: any) => any} step
 * @property {(state: any, content: any) => Screen} screen
 */

/**
 * A phase a later session builds: entering it, stepping it or drawing it
 * throws EngineError('unbuilt').
 * @param {string} id
 * @param {string} lands
 * @param {'hiker' | 'trip'} level
 * @returns {Phase}
 */
export function unbuilt(id, lands, level) {
  const no = () => {
    throw new EngineError('unbuilt', 'phase: built in a later session', { phase: id, lands });
  };
  return Object.freeze({ id, built: false, lands, level, accepts: Object.freeze([]), enter: no, step: no, screen: no });
}
