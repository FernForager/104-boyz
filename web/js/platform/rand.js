// The game's one draw outside the engine (BUILD_PLAN S3; GAME_DESIGN E.8,
// 8.14; Lead call 8): a trip's seed, drawn at the plan's first save, and a
// new hiker's id. Both come from crypto.getRandomValues, and the engine only
// ever sees them as an action's argument ({t: 'start', plan, seed} and
// {t: 'sign', name, id}), so every outcome still comes from the seeded
// streams and a logged trip replays exactly.

/** Crockford base32: no I, L, O or U (E.8). */
export const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Pure: 5 bytes (40 bits) as 8 Crockford base32 characters, most
 * significant first.
 * @param {ArrayLike<number>} bytes
 */
export function base32(bytes) {
  if (bytes.length !== 5) throw new Error('rand: a seed is 5 bytes');
  // 40 bits fit a double exactly; arithmetic, never 32-bit shifts.
  let v = 0;
  for (let i = 0; i < 5; i++) v = v * 256 + (bytes[i] & 255);
  let out = '';
  for (let i = 0; i < 8; i++) {
    out = CROCKFORD[v % 32] + out;
    v = Math.floor(v / 32);
  }
  return out;
}

/** @typedef {{getRandomValues: (a: Uint8Array<ArrayBuffer>) => Uint8Array}} RandomSource the platform's generator, or a test's */

/**
 * Five random bytes from the platform's generator.
 * @param {RandomSource} [c]
 */
function bytes5(c = globalThis.crypto) {
  return c.getRandomValues(new Uint8Array(5));
}

/**
 * A new trip seed: 8 characters of Crockford base32 (40 bits).
 * @param {RandomSource} [c]
 */
export function newSeed(c) {
  return base32(bytes5(c));
}

/**
 * A new hiker's id: h and a seed.
 * @param {RandomSource} [c]
 */
export function newHikerId(c) {
  return `h${newSeed(c)}`;
}
