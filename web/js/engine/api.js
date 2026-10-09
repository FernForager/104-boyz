// The engine's API, versioned (BUILD_PLAN 2.3, 14.2; GAME_DESIGN E.2).
//
// PURE. What the UI, the tools and the self-check import: the UI never
// changes game state, and the engine never touches the DOM. Node imports
// these same files for the harness, replays and goldens. API goes up by
// one whenever a signature here changes, so a pinned engine (14.2) and the
// UI that drives it can tell. S4 adds the router (buildGraph, route,
// distAlong) and baseSeconds; no existing signature changed, so API stays 1.

/** The versioned engine API (BUILD_PLAN 14.2): init, step, replay. */
export const API = 1;
export { EngineError, isEngineError } from './error.js';
export { loadContent } from './content.js';
export { newSession, dispatch, screenOf, phaseOf } from './step.js';
export { toSaves, fromSaves, reportState, tripHash } from './save.js';
export { replay, identity } from './replay.js';
export { pack, unpack, toBase64url, fromBase64url } from './log.js';
export { buildGraph, route, distAlong } from './graph.js';
export { baseSeconds, withBreaks } from './movement.js';
