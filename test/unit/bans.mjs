// The ban test's bans (D11; BUILD_PLAN 6.6; GAME_DESIGN E.12), not a test
// file itself: Math.random, the approximate Math functions (the list E02
// bans, MATH_BANNED in tools/lint.mjs; a test keeps the two equal), Date and
// performance.now, replaced with functions that throw. This module imports
// nothing, so a child process can put the bans in place before any engine
// module loads (banfirst.mjs).

/** The Math functions the bans replace: E02's list. */
export const BANNED_MATH = Object.freeze(['random', 'exp', 'expm1', 'log', 'log1p', 'log2', 'log10', 'pow', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh', 'cbrt', 'hypot']);

/**
 * Put the bans in place. Returns a function that puts the originals back.
 * @returns {() => void}
 */
export function installBans() {
  const thrower = (what) =>
    function banned() {
      throw new Error(`the engine called ${what}`);
    };
  const M = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (Math));
  const saved = { math: BANNED_MATH.map((name) => [name, M[name]]), Date: globalThis.Date, now: performance.now };
  for (const name of BANNED_MATH) M[name] = thrower(`Math.${name}`);
  globalThis.Date = /** @type {any} */ (thrower('Date'));
  performance.now = thrower('performance.now');
  return () => {
    for (const [name, f] of saved.math) M[/** @type {string} */ (name)] = f;
    globalThis.Date = saved.Date;
    performance.now = saved.now;
  };
}
