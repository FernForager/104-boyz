// Canonical JSON (BUILD_PLAN 6.6; GAME_DESIGN E.12): one string per value,
// so a hash of it means the same thing in Node and on the phone. Objects
// with their keys sorted by code unit, arrays in order, no whitespace,
// -0 written as 0. Everything is ASCII, and anything JSON can't say the
// same way twice (undefined, NaN, Infinity, a function, a Map, a class
// instance) throws EngineError('invalid').
//
// PURE. Used for every hashed state and for the build's data/rules.json.

import { EngineError } from './error.js';

/**
 * A code-unit comparator, the engine's one sort order (E.12 #7).
 * @param {string} a
 * @param {string} b
 */
export const byCode = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** @param {string} s */
function asciiString(s) {
  for (let i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) > 127) throw new EngineError('invalid', 'canon: strings are ASCII');
  }
  return JSON.stringify(s);
}

/**
 * Canonical JSON of a plain value.
 * @param {unknown} value
 * @returns {string}
 */
export function canon(value) {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
      if (!Number.isFinite(value)) throw new EngineError('invalid', 'canon: numbers are finite');
      return JSON.stringify(value === 0 ? 0 : value);
    case 'string':
      return asciiString(value);
    case 'object': {
      if (Array.isArray(value)) return `[${value.map((v) => canon(v)).join(',')}]`;
      const proto = Object.getPrototypeOf(value);
      if (proto !== Object.prototype && proto !== null) throw new EngineError('invalid', 'canon: only plain objects');
      const o = /** @type {Record<string, unknown>} */ (value);
      const keys = Object.keys(o).sort(byCode);
      return `{${keys.map((k) => `${asciiString(k)}:${canon(o[k])}`).join(',')}}`;
    }
    default:
      throw new EngineError('invalid', 'canon: not a JSON value');
  }
}

/**
 * A deep copy through canonical JSON's rules (keys in code-unit order, -0 as 0).
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function plain(value) {
  return JSON.parse(canon(value));
}

/**
 * Freeze a value and everything in it.
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}
