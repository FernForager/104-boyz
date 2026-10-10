// The content loader (BUILD_PLAN 2.3, 3.3; GAME_DESIGN E.4).
//
// PURE. The build writes two files per channel: data/rules.json, the
// outcome data the rules hash covers (profile rules, the standard profile,
// plans, stop sets with their expressions as checked syntax trees), and
// data/voice.json, the display data it doesn't (each stop's line ids and
// choice labels), so a word-only change can never move the rules hash
// (E.12). loadContent freezes both, builds the id lookups, and compiles an
// expression the first time it runs (E.10: lazy compiling), caching the
// closure by the syntax tree's identity. The cache is not state. From S4 a
// build may ship the park section (rules.park, the M1a slice of the graph,
// when a screen that shows it is in the channel); park() hands it to
// graph.js's buildGraph, or is null. From S6 a build with the trail ships
// the park (the router times its walks: graph() builds its graph once, a
// closure cache like the expressions', never state) and the odds
// (rules.odds, content/rules/odds.json; odds() hands them over, and
// oddsVoice() their row labels from voice.json).

import { EngineError } from './error.js';
import { deepFreeze } from './canon.js';
import { compile } from './expr.js';
import { buildGraph } from './graph.js';

/** The rules hash: 12 lowercase hex (tools/rules.mjs). */
export const RULES_HASH_RE = /^[0-9a-f]{12}$/;

/**
 * @typedef {object} Content
 * @property {string} rulesHash
 * @property {{rules: any, voice: any}} data the frozen files
 * @property {any} profile the profile rules (content/rules/profile.json)
 * @property {any} standard the standard profile (content/rules/standard.json)
 * @property {(id: string) => any} plan a plan, or null
 * @property {() => string[]} plans every plan id, in code-unit order
 * @property {(id: string) => any} set a stop set, or null
 * @property {(set: string, id: string) => any} stop a stop, or null
 * @property {(set: string, stop: string) => any} voice a stop's display data ({box, labels}), or null
 * @property {(ast: any[]) => import('./expr.js').Compiled} expr the compiled closure for a syntax tree
 * @property {() => import('./graph.js').Park | null} park the park section (rules.park, S4), or null when the build ships none
 * @property {() => import('./graph.js').Graph | null} graph the park's graph, built once (S6), or null with no park
 * @property {() => import('./odds.js').OddsConstants | null} odds the odds section (rules.odds, S6), or null
 * @property {() => import('./odds.js').OddsLabels | null} oddsVoice the odds' row labels (voice.odds, S6), or null
 */

const own = (/** @type {any} */ o, /** @type {string} */ k) => o !== null && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);

/**
 * Load a build's data. Throws EngineError('format') on a file that isn't
 * the format this engine reads.
 * @param {{rules: any, voice: any, rulesHash: string}} o
 * @returns {Content}
 */
export function loadContent({ rules, voice, rulesHash }) {
  if (!rules || rules.format !== 1) throw new EngineError('format', 'content: rules.json is not format 1');
  if (!voice || voice.format !== 1) throw new EngineError('format', 'content: voice.json is not format 1');
  if (typeof rulesHash !== 'string' || !RULES_HASH_RE.test(rulesHash)) throw new EngineError('format', 'content: the rules hash is 12 lowercase hex');
  if (!rules.profile || !rules.standard) throw new EngineError('format', 'content: rules.json has no profile rules or standard profile');
  deepFreeze(rules);
  deepFreeze(voice);
  const plans = rules.plans || {};
  const sets = rules.stops || {};
  /** @type {Map<string, Map<string, any>>} */
  const stops = new Map();
  for (const [id, set] of Object.entries(sets)) {
    const byId = new Map();
    for (const s of set.stops) byId.set(s.id, s);
    if (!byId.has(set.first)) throw new EngineError('format', 'content: a stop set has no first stop');
    stops.set(id, byId);
  }
  for (const p of Object.values(plans)) {
    if (!stops.has(p.start && p.start.set)) throw new EngineError('format', 'content: a plan starts at a set the rules lack');
  }
  const park = own(rules, 'park') ? rules.park : null;
  if (own(rules, 'park')) {
    const ok = park && park.format === 1 && park.nodes && typeof park.nodes === 'object' && park.segs && typeof park.segs === 'object' && park.loops && typeof park.loops === 'object' && park.movement && typeof park.movement === 'object';
    if (!ok) throw new EngineError('format', 'content: rules.park is not a park, format 1');
  }
  const odds = own(rules, 'odds') ? rules.odds : null;
  if (own(rules, 'odds')) {
    const ok = odds && odds.format === 1 && Array.isArray(odds.clamp) && odds.clamp.length === 2 && odds.bases && typeof odds.bases === 'object' && Number.isSafeInteger(odds.shaky_cap) && Number.isSafeInteger(odds.skill_per_level);
    if (!ok) throw new EngineError('format', 'content: rules.odds is not the odds, format 1');
  }
  const oddsVoice = own(voice, 'odds') ? voice.odds : null;
  /** @type {import('./graph.js').Graph | null} */
  let graph = null;
  const planIds = Object.keys(plans).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const vstops = (voice.stops || {});
  /** @type {Map<any, import('./expr.js').Compiled>} */
  const cache = new Map();
  return Object.freeze({
    rulesHash,
    data: Object.freeze({ rules, voice }),
    profile: rules.profile,
    standard: rules.standard,
    plan: (/** @type {string} */ id) => (own(plans, id) ? plans[id] : null),
    plans: () => planIds.slice(),
    set: (/** @type {string} */ id) => (own(sets, id) ? sets[id] : null),
    stop: (/** @type {string} */ set, /** @type {string} */ id) => {
      const byId = stops.get(set);
      return (byId && byId.get(id)) || null;
    },
    voice: (/** @type {string} */ set, /** @type {string} */ stop) => (own(vstops, set) && own(vstops[set], stop) ? vstops[set][stop] : null),
    park: () => park,
    graph: () => {
      if (!graph && park) graph = buildGraph(park);
      return graph;
    },
    odds: () => odds,
    oddsVoice: () => oddsVoice,
    expr: (/** @type {any[]} */ ast) => {
      let f = cache.get(ast);
      if (!f) {
        f = compile(ast);
        cache.set(ast, f);
      }
      return f;
    },
  });
}
