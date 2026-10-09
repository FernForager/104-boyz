// The standard profile and the profile snapshot (BUILD_PLAN 14.1 T0;
// GAME_DESIGN 1.3, 7.3, E.1, E.12 #1; content/rules/standard.json).
//
// PURE. A trip reads its hiker only through a snapshot holding exactly the
// fields the engine reads (E.1), which travels with every save, log and
// bug report. The timed modes read the standard profile instead, whose
// signature takes no state, so nothing of the Open hiker can reach it.

import { EngineError } from './error.js';
import { deepFreeze, plain } from './canon.js';

/**
 * The standard hiker (or, from T1, runner): a frozen copy of the rules'.
 * Reads nothing but the content.
 * @param {{standard: Record<string, any>}} content
 * @param {string} [kind] 'hiker' (T0) or 'runner' (T1)
 * @returns {Profile}
 */
export function standardProfile(content, kind = 'hiker') {
  const p = content.standard && Object.prototype.hasOwnProperty.call(content.standard, kind) ? content.standard[kind] : null;
  if (!p) throw new EngineError('unbuilt', 'standard: no standard profile of that kind yet');
  return deepFreeze(plain(p));
}

/**
 * @typedef {{fitness: string, body_lb: number, skills: Record<string, number>, regions: Record<string, unknown>, seen: Record<string, unknown>}} Profile
 */

/**
 * The profile snapshot of a hiker: fitness, body_lb, every skill the rules
 * name, regions and seen; nothing else. A missing skill throws
 * EngineError('state').
 * @param {{profile: Record<string, any>}} hiker
 * @param {{profile: {skills: string[], fitness_levels: string[]}}} content
 * @returns {Profile}
 */
export function profileSnapshot(hiker, content) {
  const src = hiker && hiker.profile;
  if (!src || typeof src !== 'object') throw new EngineError('state', 'standard: the hiker has no profile');
  const rules = content.profile;
  if (!rules.fitness_levels.includes(src.fitness)) throw new EngineError('state', 'standard: the fitness level is not one the rules know');
  if (!Number.isSafeInteger(src.body_lb) || src.body_lb <= 0) throw new EngineError('state', 'standard: body_lb is a whole number of pounds');
  /** @type {Record<string, number>} */
  const skills = {};
  for (const k of rules.skills) {
    const v = src.skills && src.skills[k];
    if (!Number.isSafeInteger(v) || v < 0) throw new EngineError('state', 'standard: a skill is missing from the profile');
    skills[k] = v;
  }
  return plain({ fitness: src.fitness, body_lb: src.body_lb, skills, regions: src.regions || {}, seen: src.seen || {} });
}
