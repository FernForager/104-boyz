// The engine's one error (BUILD_PLAN 2.3, 14.2; GAME_DESIGN E.11). Every
// refusal the engine makes is an EngineError with a short code, so a golden
// trip, a replay and a bug report can record it, and its message is for
// developers only (the UI never shows it as words).
//
// The codes, all deterministic:
//   refused  an action that isn't on the screen (a stale tap, a bad replay)
//   invalid  an action or a value whose arguments are malformed
//   unbuilt  a phase a later session builds
//   format   a log or a save that isn't canonical, or doesn't verify
//   rules    a log made under other rules than the content's
//   expr     an expression that can't be evaluated (divide by zero, a p
//            outside 0..1, a math function out of its domain)
//   state    a broken invariant

/** The codes, frozen. */
export const CODES = Object.freeze(['refused', 'invalid', 'unbuilt', 'format', 'rules', 'expr', 'state']);

/** An engine refusal: `code` is one of CODES; `detail` is optional data (a column, an index). */
export class EngineError extends Error {
  /**
   * @param {string} code one of CODES
   * @param {string} [message] for developers
   * @param {Record<string, unknown>} [detail]
   */
  constructor(code, message = code, detail = undefined) {
    super(message);
    this.name = 'EngineError';
    /** @type {string} */
    this.code = CODES.includes(code) ? code : 'state';
    /** @type {Record<string, unknown> | undefined} */
    this.detail = detail;
  }
}

/**
 * True when e is an EngineError (by its name and code, so an error from a
 * second copy of the module, as in a worktree replay, still counts).
 * @param {unknown} e
 * @returns {e is EngineError}
 */
export function isEngineError(e) {
  return e instanceof Error && e.name === 'EngineError' && typeof (/** @type {any} */ (e).code) === 'string';
}
