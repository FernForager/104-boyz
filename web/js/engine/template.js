// Lines by id, never words (BUILD_PLAN 2.3, 10.3; GAME_DESIGN 18.5, E.12 #6;
// design/proposals/engine.md 5.1, 5.2).
//
// PURE. The engine never holds a word: a screen carries Refs, {id, vars},
// and the UI's t() and tx() turn them into the channel's words. A variant
// is picked from the text stream, so rewording a line or adding a variant
// never touches an outcome. A var's value is a safe integer, an ASCII id,
// or a nested Ref (one level), so {place} can later be a place name's line.

import { EngineError } from './error.js';
import { draw } from './rng.js';

/** A line id, as tools/text.mjs's ID_RE: area.thing[.detail], lowercase. */
export const ID_RE = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/;
/** A {variable} name, the rule T13 uses. */
export const VAR_RE = /^[a-z][a-z0-9_]*$/;
/** A var's id value: ASCII, lowercase. */
const VALUE_RE = /^[a-z0-9_.:-]+$/;

/**
 * @typedef {{id: string, vars?: Record<string, number | string | Ref>}} Ref
 */

/**
 * @param {unknown} vars
 * @param {boolean} nested
 * @returns {Record<string, number | string | Ref>}
 */
function checkVars(vars, nested) {
  if (vars === null || typeof vars !== 'object' || Array.isArray(vars)) throw new EngineError('invalid', 'template: vars is an object');
  /** @type {Record<string, number | string | Ref>} */
  const out = {};
  for (const [k, v] of Object.entries(vars)) {
    if (!VAR_RE.test(k)) throw new EngineError('invalid', 'template: a var name is [a-z][a-z0-9_]*');
    if (typeof v === 'number') {
      if (!Number.isSafeInteger(v)) throw new EngineError('invalid', 'template: a number var is a safe integer');
      out[k] = v === 0 ? 0 : v;
    } else if (typeof v === 'string') {
      if (!VALUE_RE.test(v)) throw new EngineError('invalid', 'template: a string var is an ASCII id');
      out[k] = v;
    } else if (v && typeof v === 'object' && !nested) {
      const r = /** @type {Ref} */ (v);
      out[k] = makeRef(r.id, r.vars, true);
    } else throw new EngineError('invalid', 'template: a var is an integer, an id or a Ref (one level)');
  }
  return out;
}

/**
 * @param {unknown} id
 * @param {unknown} vars
 * @param {boolean} nested
 * @returns {Ref}
 */
function makeRef(id, vars, nested) {
  if (typeof id !== 'string' || !ID_RE.test(id)) throw new EngineError('invalid', 'template: a line id is area.thing[.detail]');
  if (vars === undefined) return { id };
  return { id, vars: checkVars(vars, nested) };
}

/**
 * A reference to a line: {id} or {id, vars}. Throws EngineError('invalid').
 * @param {string} id
 * @param {Record<string, number | string | Ref>} [vars]
 * @returns {Ref}
 */
export function ref(id, vars) {
  return makeRef(id, vars, false);
}

/**
 * A variant id, from the text stream (E.8: node, slot, trip day), so
 * wording never touches outcomes. One variant needs no draw.
 * @param {string} seed the trip seed
 * @param {(string | number)[]} key
 * @param {string[]} variants
 * @returns {string}
 */
export function pick(seed, key, variants) {
  if (!Array.isArray(variants) || !variants.length) throw new EngineError('invalid', 'template: pick() takes a list of variants');
  if (variants.length === 1) return variants[0];
  return variants[draw(seed, 'text', ...key).int(variants.length)];
}

/**
 * The pool rule (engine.md 5.2): drop dot-qualifiers from the right until
 * has(id), so sky.dusk.clear.subalpine falls back to sky.dusk.clear, then
 * sky.dusk, then sky; or null.
 * @param {string} id
 * @param {(id: string) => boolean} has
 * @returns {string | null}
 */
export function fallback(id, has) {
  let at = id;
  for (;;) {
    if (has(at)) return at;
    const k = at.lastIndexOf('.');
    if (k < 0) return null;
    at = at.slice(0, k);
  }
}

/**
 * A line's {variables} (sorted), the rule T13 uses: braces around
 * [a-z][a-z0-9_]*. A plural's forms are read together, and a plural needs n.
 * @param {string | Record<string, string>} words
 * @returns {string[]}
 */
export function varsOf(words) {
  const set = new Set();
  const forms = typeof words === 'string' ? [words] : Object.values(words);
  for (const f of forms) for (const m of f.matchAll(/\{([^{}]*)\}/g)) if (VAR_RE.test(m[1])) set.add(m[1]);
  if (typeof words !== 'string') set.add('n');
  return [...set].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
