// A small JSON Schema validator (BUILD_PLAN 2.7, 3.3; GAME_DESIGN E.4:
// "validate at the door").
//
// The keywords content schemas use, and no more: type (string, number,
// integer, boolean, object, array, null, or a list of them), properties,
// required, additionalProperties (false or a schema), items, minItems,
// maxItems, enum, const, pattern, minimum, maximum, minLength, maxLength
// (in code points), oneOf, and $ref within the file ("#/$defs/name", any JSON pointer). Plus three
// of ours, which it reports as annotations on the values they mark:
//   "x-text": true              the value is an "@id" (a line in content/text)
//   "x-expr": "bool" | "number" an expression, compiled and type-checked
//   "x-voice": true             display data: voice.json, never rules.json
// An unknown keyword in a schema is an error, so a typo can't silently pass.

/** The keywords the validator knows. */
export const KEYWORDS = new Set([
  '$schema', '$id', '$comment', '$defs', 'definitions', 'title', 'description',
  'type', 'properties', 'required', 'additionalProperties', 'items', 'enum', 'const', 'pattern',
  'minimum', 'maximum', 'minLength', 'maxLength', 'minItems', 'maxItems', 'oneOf', '$ref',
  'x-text', 'x-expr', 'x-voice',
]);

/**
 * @typedef {{path: string, msg: string}} SchemaError
 * @typedef {{path: string, keyword: 'x-text' | 'x-expr' | 'x-voice', value: any, arg: any}} Annotation
 */

const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/** A JSON value's type, as the schema names it ('integer' is also a 'number'). */
function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
  return typeof v;
}

/** Resolve a JSON pointer ref ("#/a/b") in the root schema. */
function resolveRef(root, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#')) throw new Error(`schema: $ref "${ref}" is not within the file`);
  let at = root;
  for (const raw of ref.slice(1).split('/').filter(Boolean)) {
    const k = raw.replace(/~1/g, '/').replace(/~0/g, '~');
    if (!at || typeof at !== 'object' || !own(at, k)) throw new Error(`schema: $ref "${ref}" points at nothing`);
    at = at[k];
  }
  return at;
}

/** The path of a child: a.b, a[0]. */
const child = (path, k) => (typeof k === 'number' ? `${path}[${k}]` : path ? `${path}.${k}` : k);

/**
 * Validate a value against a schema.
 * @param {any} schema
 * @param {any} value
 * @returns {{errors: SchemaError[], annotations: Annotation[]}}
 */
export function validate(schema, value) {
  const root = schema;
  /**
   * @param {any} s
   * @param {any} v
   * @param {string} path
   * @returns {{errors: SchemaError[], annotations: Annotation[]}}
   */
  const run = (s, v, path) => {
    /** @type {SchemaError[]} */
    const errors = [];
    /** @type {Annotation[]} */
    const annotations = [];
    const err = (msg) => errors.push({ path: path || '(the file)', msg });
    const sub = (s2, v2, p2) => {
      const r = run(s2, v2, p2);
      errors.push(...r.errors);
      annotations.push(...r.annotations);
      return r.errors.length === 0;
    };
    if (s === true) return { errors, annotations };
    if (s === false) {
      err('nothing is allowed here');
      return { errors, annotations };
    }
    if (!s || typeof s !== 'object') throw new Error('schema: a schema is an object');
    for (const k of Object.keys(s)) if (!KEYWORDS.has(k)) throw new Error(`schema: unknown keyword "${k}"`);
    if (own(s, '$ref')) {
      sub(resolveRef(root, s.$ref), v, path);
    }
    if (own(s, 'type')) {
      const want = Array.isArray(s.type) ? s.type : [s.type];
      const t = typeOf(v);
      if (!want.includes(t) && !(t === 'integer' && want.includes('number'))) {
        err(`is ${t === 'integer' ? 'number' : t}, not ${want.join(' or ')}`);
        return { errors, annotations };
      }
    }
    if (own(s, 'enum') && !s.enum.some((e) => JSON.stringify(e) === JSON.stringify(v))) err(`is not one of ${s.enum.map((e) => JSON.stringify(e)).join(', ')}`);
    if (own(s, 'const') && JSON.stringify(s.const) !== JSON.stringify(v)) err(`is not ${JSON.stringify(s.const)}`);
    if (typeof v === 'string') {
      if (own(s, 'pattern') && !new RegExp(s.pattern, 'u').test(v)) err(`"${v}" does not match ${s.pattern}`);
      const n = [...v].length;
      if (own(s, 'minLength') && n < s.minLength) err(`is shorter than ${s.minLength}`);
      if (own(s, 'maxLength') && n > s.maxLength) err(`is longer than ${s.maxLength}`);
    }
    if (typeof v === 'number') {
      if (own(s, 'minimum') && v < s.minimum) err(`${v} is under ${s.minimum}`);
      if (own(s, 'maximum') && v > s.maximum) err(`${v} is over ${s.maximum}`);
    }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const k of s.required || []) if (!own(v, k)) err(`needs "${k}"`);
      const props = s.properties || {};
      for (const [k, val] of Object.entries(v)) {
        if (own(props, k)) sub(props[k], val, child(path, k));
        else if (s.additionalProperties === false) err(`has "${k}", which it doesn't take`);
        else if (s.additionalProperties && typeof s.additionalProperties === 'object') sub(s.additionalProperties, val, child(path, k));
      }
    }
    if (Array.isArray(v)) {
      if (own(s, 'minItems') && v.length < s.minItems) err(`has ${v.length} item${v.length === 1 ? '' : 's'}, fewer than ${s.minItems}`);
      if (own(s, 'maxItems') && v.length > s.maxItems) err(`has ${v.length} items, more than ${s.maxItems}`);
      if (own(s, 'items')) v.forEach((x, i) => sub(s.items, x, child(path, i)));
    }
    if (own(s, 'oneOf')) {
      const results = s.oneOf.map((o) => run(o, v, path));
      const ok = results.filter((r) => r.errors.length === 0);
      if (ok.length === 1) annotations.push(...ok[0].annotations);
      else if (ok.length === 0) {
        // Report the branch that came closest.
        const best = results.reduce((a, b) => (b.errors.length < a.errors.length ? b : a));
        errors.push(...best.errors);
      } else err('matches more than one of its forms');
    }
    if (errors.length === 0) {
      for (const kw of ['x-text', 'x-expr', 'x-voice']) if (own(s, kw)) annotations.push({ path, keyword: /** @type {any} */ (kw), value: v, arg: s[kw] });
    }
    return { errors, annotations };
  };
  return run(schema, value, '');
}
