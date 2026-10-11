// The seeded generator and its named streams (BUILD_PLAN 2.3, 6.6;
// GAME_DESIGN E.8, 8.14; design/proposals/engine.md 7.3).
//
// PURE: the only randomness the engine has. Every draw comes from a short
// sfc32 generator seeded by cyrb128 of a key string, seed|stream|k1|k2|...,
// so a draw depends only on its key: an optional stop never shifts a later
// roll, adding a stream never shifts another's draws, and rewording a line
// (the text stream) never touches an outcome (E.12 #6). Integer operations
// only (Math.imul, shifts, | 0), so V8 and JavaScriptCore agree bit for bit.

import { EngineError } from './error.js';

/**
 * E.8's streams, append-only. 8.14 also names `store`; it joins when S11
 * needs it (a new stream shifts no other's draws). S7 adds `quiz`: the
 * lockbox's deal, from the seed the UI draws at Open the lockbox
 * (phases/lockbox.js).
 */
export const STREAMS = Object.freeze(['weather', 'env', 'permit', 'director', 'roll', 'effect', 'text', 'mini', 'art', 'dust', 'lookahead', 'quiz']);

/** A seed: Crockford base32 (no I, L, O, U), 8 to 26 characters (40 to 130 bits). */
export const SEED_RE = /^[0-9A-HJKMNP-TV-Z]{8,26}$/;
/** A key part that is an id: lowercase ASCII, digits and _ . : - */
export const PART_RE = /^[a-z0-9_.:-]+$/;
/** The art stream's seed: a place looks the same on every trip (E.8). */
export const ART_SEED = '00000000';
/** PractRand's seeding rounds: outputs thrown away after seeding. */
export const DISCARD = 12;

const TWO32 = 4294967296;

/**
 * cyrb128: four 32-bit words from an ASCII string (engine.md 7.3).
 * @param {string} s
 * @returns {[number, number, number, number]}
 */
export function hash128(s) {
  if (typeof s !== 'string') throw new EngineError('invalid', 'rng: a key is a string');
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < s.length; i++) {
    const k = s.charCodeAt(i);
    if (k > 127) throw new EngineError('invalid', 'rng: a key is ASCII');
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/**
 * sfc32: a small fast counting generator over four 32-bit words. Raw: no
 * seeding rounds (draw() discards DISCARD outputs).
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @returns {() => number} the next unsigned 32-bit output
 */
export function sfc32(a, b, c, d) {
  a |= 0;
  b |= 0;
  c |= 0;
  d |= 0;
  return () => {
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return t >>> 0;
  };
}

/**
 * The key string for a draw: seed|stream|k1|k2|... Throws
 * EngineError('invalid') on a bad seed, an unknown stream, or a key part
 * that is neither an ASCII id nor a non-negative safe integer.
 * @param {string} seed
 * @param {string} stream
 * @param {(string | number)[]} key
 * @returns {string}
 */
export function keyOf(seed, stream, key) {
  if (typeof seed !== 'string' || !SEED_RE.test(seed)) throw new EngineError('invalid', 'rng: the seed is 8 to 26 characters of Crockford base32');
  if (!STREAMS.includes(stream)) throw new EngineError('invalid', 'rng: no such stream');
  const parts = [seed, stream];
  for (const k of key) {
    if (typeof k === 'number') {
      if (!Number.isSafeInteger(k) || k < 0) throw new EngineError('invalid', 'rng: a number in a key is a non-negative safe integer');
      parts.push(String(k));
    } else if (typeof k === 'string' && PART_RE.test(k)) parts.push(k);
    else throw new EngineError('invalid', 'rng: a key part is an ASCII id or an integer');
  }
  return parts.join('|');
}

/**
 * @typedef {object} Gen
 * @property {() => number} u32 the next unsigned 32-bit integer
 * @property {() => number} float in [0, 1): u32 / 2^32, exact
 * @property {(n: number) => number} int an integer in [0, n), unbiased; n a safe integer 1 to 2^32
 * @property {(weights: number[]) => number} pick an index, by integer weights
 */

/**
 * A generator for one keyed draw: draw(seed, 'roll', 'oldschool', 'lot', ...).
 * @param {string} seed the trip seed (ART_SEED for the art stream)
 * @param {string} stream one of STREAMS
 * @param {...(string | number)} key E.8's key parts for the stream
 * @returns {Gen}
 */
export function draw(seed, stream, ...key) {
  const next = sfc32(...hash128(keyOf(seed, stream, key)));
  for (let i = 0; i < DISCARD; i++) next();
  /** @param {number} n */
  const int = (n) => {
    if (!Number.isSafeInteger(n) || n < 1 || n > TWO32) throw new EngineError('invalid', 'rng: int(n) takes a safe integer from 1 to 2^32');
    const limit = TWO32 - (TWO32 % n);
    for (;;) {
      const u = next();
      if (u < limit) return u % n;
    }
  };
  return {
    u32: next,
    float: () => next() / TWO32,
    int,
    pick(weights) {
      if (!Array.isArray(weights) || !weights.length) throw new EngineError('invalid', 'rng: pick() takes a list of weights');
      let total = 0;
      for (const w of weights) {
        if (!Number.isSafeInteger(w) || w < 0) throw new EngineError('invalid', 'rng: a weight is a non-negative integer');
        total += w;
      }
      if (total < 1 || total > TWO32) throw new EngineError('invalid', 'rng: the weights total 1 to 2^32');
      let r = int(total);
      for (let i = 0; i < weights.length; i++) {
        if (r < weights[i]) return i;
        r -= weights[i];
      }
      throw new EngineError('state', 'rng: pick() ran past its weights');
    },
  };
}
