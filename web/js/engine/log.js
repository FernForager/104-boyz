// The complete action log, in its canonical form (BUILD_PLAN 2.3, 14.1 T0;
// GAME_DESIGN E.12, Lead call 19).
//
// PURE. Everything that can change a result is an action, and the log
// keeps every accepted one, no-ops included. Its JSON form (in memory, in
// goldens, in the debug menu):
//   {format: 1, rules, mode, rule, seed, plan, profile, base, actions}
//   actions: ['next'], ['choose', id], ['wait', seconds]
// and its packed form, the canonical bytes that saves, bug reports and,
// later, crew links and the world board carry ("varint-packed, hashable,
// compressible", E.12):
//   0x4F 0x50              magic "OP"
//   varint  format         1
//   str     rules          12 lowercase hex
//   varint  mode           0 open, 1 daily, 2 fkt
//   varint  rule           0 oldschool, 1 gentle
//   str     seed           Crockford base32
//   str     plan           ASCII id
//   str     profile        12 lowercase hex
//   str     base           "" or 12 lowercase hex
//   varint  T              the string table's size
//   T x str                ids, in order of first use; each used, none twice
//   varint  N              the action count
//   N x action             varint kind, then that kind's args
//   str := varint byte length, then the bytes, each 0x21..0x7E
// Kinds are append-only and never reused: 1 next; 2 choose (varint: the
// choice id's table index); 3 wait (varint: seconds). S8 and later add
// pace, eat, refill, pack, strap, start time, replan, minigame input
// streams (S13), pause, stash, style.
//
// varint is unsigned LEB128 by arithmetic (values to 2^53 - 1, never 32-bit
// shifts above 2^31); zigzag maps signed values for later kinds. Decoding is
// strict, so one log has one byte string: a non-minimal varint, trailing
// bytes, a bad magic, an unknown format, mode, rule or kind, a table index
// out of range, an unused, repeated or out-of-order table entry, a
// non-ASCII or empty string (but base), or a wait over 86,400 all throw
// EngineError('format').

import { EngineError } from './error.js';
import { SEED_RE } from './rng.js';
import { MODES, RULES, CID_RE } from './trip.js';
import { MAX_WAIT } from './step.js';

/** The log format this engine reads and writes. */
export const FORMAT = 1;
/** The action kinds, by name (append-only). */
export const KINDS = Object.freeze({ next: 1, choose: 2, wait: 3 });
const HEX12 = /^[0-9a-f]{12}$/;
const MAGIC = [0x4f, 0x50];

/** A log that isn't canonical: EngineError('format'). */
export class LogError extends EngineError {
  /** @param {string} msg */
  constructor(msg) {
    super('format', `log: ${msg}`);
  }
}

/**
 * @typedef {object} Log the JSON form
 * @property {number} format
 * @property {string} rules
 * @property {string} mode
 * @property {string} rule
 * @property {string} seed
 * @property {string} plan
 * @property {string} profile
 * @property {string} base
 * @property {(string | number)[][]} actions
 */

/**
 * zigzag: a signed integer as an unsigned one (0, -1, 1, -2 -> 0, 1, 2, 3).
 * @param {number} v a safe integer
 */
export function zigzag(v) {
  if (!Number.isSafeInteger(v)) throw new EngineError('invalid', 'log: zigzag takes a safe integer');
  return v >= 0 ? 2 * v : -2 * v - 1;
}

/**
 * The signed integer back from zigzag.
 * @param {number} u
 */
export function unzigzag(u) {
  if (!Number.isSafeInteger(u) || u < 0) throw new EngineError('invalid', 'log: unzigzag takes a non-negative safe integer');
  return u % 2 === 0 ? u / 2 : -(u + 1) / 2;
}

/**
 * Append an unsigned LEB128 varint.
 * @param {number[]} out
 * @param {number} v a safe integer, 0 to 2^53 - 1
 */
export function writeVarint(out, v) {
  if (!Number.isSafeInteger(v) || v < 0) throw new EngineError('invalid', 'log: a varint is a non-negative safe integer');
  let n = v;
  while (n >= 128) {
    out.push((n % 128) + 128);
    n = Math.floor(n / 128);
  }
  out.push(n);
}

/**
 * A reader over bytes, strict.
 * @param {Uint8Array} bytes
 */
function reader(bytes) {
  let pos = 0;
  return {
    get done() {
      return pos >= bytes.length;
    },
    byte() {
      if (pos >= bytes.length) throw new LogError('the bytes end too soon');
      return bytes[pos++];
    },
    varint() {
      let v = 0;
      let mul = 1;
      for (let i = 0; ; i++) {
        if (pos >= bytes.length) throw new LogError('the bytes end inside a varint');
        const b = bytes[pos++];
        v += (b % 128) * mul;
        if (!Number.isSafeInteger(v)) throw new LogError('a varint over 2^53 - 1');
        if (b < 128) {
          if (b === 0 && i > 0) throw new LogError('a varint that is not minimal');
          return v;
        }
        mul *= 128;
      }
    },
    /** @param {boolean} [empty] */
    str(empty = false) {
      const n = this.varint();
      if (n === 0 && !empty) throw new LogError('an empty string');
      if (pos + n > bytes.length) throw new LogError('the bytes end inside a string');
      let s = '';
      for (let i = 0; i < n; i++) {
        const c = bytes[pos++];
        if (c < 0x21 || c > 0x7e) throw new LogError('a string holds a byte outside 0x21..0x7E');
        s += String.fromCharCode(c);
      }
      return s;
    },
  };
}

/**
 * Append a string.
 * @param {number[]} out
 * @param {string} s ASCII 0x21..0x7E
 */
function writeStr(out, s) {
  writeVarint(out, s.length);
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x21 || c > 0x7e) throw new LogError('a string holds a character outside 0x21..0x7E');
    out.push(c);
  }
}

/**
 * Check a log's JSON form; throws EngineError('format').
 * @param {any} log
 * @returns {Log}
 */
export function checkLog(log) {
  if (!log || typeof log !== 'object') throw new LogError('not a log');
  const keys = ['format', 'rules', 'mode', 'rule', 'seed', 'plan', 'profile', 'base', 'actions'];
  if (Object.keys(log).length !== keys.length || !keys.every((k) => Object.prototype.hasOwnProperty.call(log, k))) throw new LogError('the header has other fields');
  if (log.format !== FORMAT) throw new LogError('an unknown format');
  if (typeof log.rules !== 'string' || !HEX12.test(log.rules)) throw new LogError('rules is 12 lowercase hex');
  if (!MODES.includes(log.mode)) throw new LogError('an unknown mode');
  if (!RULES.includes(log.rule)) throw new LogError('an unknown rule');
  if (typeof log.seed !== 'string' || !SEED_RE.test(log.seed)) throw new LogError('the seed is Crockford base32');
  if (typeof log.plan !== 'string' || !CID_RE.test(log.plan)) throw new LogError('the plan is an id');
  if (typeof log.profile !== 'string' || !HEX12.test(log.profile)) throw new LogError('profile is 12 lowercase hex');
  if (typeof log.base !== 'string' || (log.base !== '' && !HEX12.test(log.base))) throw new LogError('base is empty or 12 lowercase hex');
  if (!Array.isArray(log.actions)) throw new LogError('actions is a list');
  for (const a of log.actions) {
    if (!Array.isArray(a)) throw new LogError('an action is a list');
    if (a[0] === 'next' && a.length === 1) continue;
    if (a[0] === 'choose' && a.length === 2 && typeof a[1] === 'string' && CID_RE.test(a[1])) continue;
    if (a[0] === 'wait' && a.length === 2 && Number.isSafeInteger(a[1]) && a[1] >= 0 && a[1] <= MAX_WAIT) continue;
    throw new LogError('an action this format does not know');
  }
  return log;
}

/**
 * The canonical bytes of a log.
 * @param {Log} log the JSON form
 * @returns {Uint8Array}
 */
export function pack(log) {
  checkLog(log);
  /** @type {number[]} */
  const out = [...MAGIC];
  writeVarint(out, log.format);
  writeStr(out, log.rules);
  writeVarint(out, MODES.indexOf(log.mode));
  writeVarint(out, RULES.indexOf(log.rule));
  writeStr(out, log.seed);
  writeStr(out, log.plan);
  writeStr(out, log.profile);
  if (log.base === '') writeVarint(out, 0);
  else writeStr(out, log.base);
  /** @type {string[]} */
  const table = [];
  for (const a of log.actions) if (a[0] === 'choose' && !table.includes(/** @type {string} */ (a[1]))) table.push(/** @type {string} */ (a[1]));
  writeVarint(out, table.length);
  for (const s of table) writeStr(out, s);
  writeVarint(out, log.actions.length);
  for (const a of log.actions) {
    if (a[0] === 'next') writeVarint(out, KINDS.next);
    else if (a[0] === 'choose') {
      writeVarint(out, KINDS.choose);
      writeVarint(out, table.indexOf(/** @type {string} */ (a[1])));
    } else {
      writeVarint(out, KINDS.wait);
      writeVarint(out, /** @type {number} */ (a[1]));
    }
  }
  return Uint8Array.from(out);
}

/**
 * A log's JSON form from its canonical bytes; strict.
 * @param {Uint8Array} bytes
 * @returns {Log}
 */
export function unpack(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new LogError('unpack takes bytes');
  const r = reader(bytes);
  if (r.byte() !== MAGIC[0] || r.byte() !== MAGIC[1]) throw new LogError('no "OP" magic');
  const format = r.varint();
  if (format !== FORMAT) throw new LogError('an unknown format');
  const rules = r.str();
  const mode = MODES[r.varint()];
  if (!mode) throw new LogError('an unknown mode');
  const rule = RULES[r.varint()];
  if (!rule) throw new LogError('an unknown rule');
  const seed = r.str();
  const plan = r.str();
  const profile = r.str();
  const base = r.str(true);
  const t = r.varint();
  /** @type {string[]} */
  const table = [];
  for (let i = 0; i < t; i++) {
    const s = r.str();
    if (table.includes(s)) throw new LogError('a table entry is repeated');
    table.push(s);
  }
  const n = r.varint();
  /** @type {(string | number)[][]} */
  const actions = [];
  let used = 0;
  for (let i = 0; i < n; i++) {
    const kind = r.varint();
    if (kind === KINDS.next) actions.push(['next']);
    else if (kind === KINDS.choose) {
      const k = r.varint();
      if (k >= table.length) throw new LogError('a table index out of range');
      if (k > used) throw new LogError('the table is not in order of first use');
      if (k === used) used++;
      actions.push(['choose', table[k]]);
    } else if (kind === KINDS.wait) {
      const s = r.varint();
      if (s > MAX_WAIT) throw new LogError('a wait over 86,400 seconds');
      actions.push(['wait', s]);
    } else throw new LogError('an unknown action kind');
  }
  if (used !== table.length) throw new LogError('a table entry is never used');
  if (!r.done) throw new LogError('trailing bytes');
  return checkLog({ format, rules, mode, rule, seed, plan, profile, base, actions });
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * base64url (RFC 4648 section 5), no padding.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function toBase64url(bytes) {
  let s = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const v = bytes[i] * 65536 + bytes[i + 1] * 256 + bytes[i + 2];
    s += B64[v >> 18] + B64[(v >> 12) & 63] + B64[(v >> 6) & 63] + B64[v & 63];
  }
  const rest = bytes.length - i;
  if (rest === 1) {
    const v = bytes[i];
    s += B64[v >> 2] + B64[(v & 3) << 4];
  } else if (rest === 2) {
    const v = bytes[i] * 256 + bytes[i + 1];
    s += B64[v >> 10] + B64[(v >> 4) & 63] + B64[(v & 15) << 2];
  }
  return s;
}

/**
 * Bytes from base64url, strict: the alphabet only, no padding, and the
 * last character's unused bits zero (one string per byte string).
 * @param {string} s
 * @returns {Uint8Array}
 */
export function fromBase64url(s) {
  if (typeof s !== 'string' || s.length % 4 === 1) throw new LogError('not base64url');
  /** @type {number[]} */
  const v = [];
  for (let i = 0; i < s.length; i++) {
    const k = B64.indexOf(s[i]);
    if (k < 0) throw new LogError('not base64url');
    v.push(k);
  }
  /** @type {number[]} */
  const out = [];
  let i = 0;
  for (; i + 3 < v.length; i += 4) {
    const w = v[i] * 262144 + v[i + 1] * 4096 + v[i + 2] * 64 + v[i + 3];
    out.push(w >> 16, (w >> 8) & 255, w & 255);
  }
  const rest = v.length - i;
  if (rest === 2) {
    if (v[i + 1] & 15) throw new LogError('base64url with stray bits');
    out.push((v[i] << 2) | (v[i + 1] >> 4));
  } else if (rest === 3) {
    if (v[i + 2] & 3) throw new LogError('base64url with stray bits');
    out.push((v[i] << 2) | (v[i + 1] >> 4), ((v[i + 1] & 15) << 4) | (v[i + 2] >> 2));
  }
  return Uint8Array.from(out);
}
