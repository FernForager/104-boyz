// The card expression language (BUILD_PLAN 2.3, 6.6; GAME_DESIGN 8.3;
// design/proposals/engine.md 4.3, 4.4).
//
// PURE. Short expressions in content (a choice's show_if, a roll's p) are
// parsed at build time into JSON syntax trees, type-checked against
// schemas/vars.json, stored in data/rules.json, and compiled on the phone
// into closures: no eval, no new Function. The grammar has no loops, no
// assignment and no randomness (6.6): every random event is a roll the
// engine makes, so every chance a player sees is a pure function of state.
//
//   expr    := cond
//   cond    := or ( "?" expr ":" expr )?
//   or      := and ( "||" and )*
//   and     := not ( "&&" not )*
//   not     := "!" not | cmp
//   cmp     := sum ( ( "<" | "<=" | ">" | ">=" | "==" | "!=" ) sum | "in" "[" list "]" )?
//   sum     := prod ( ( "+" | "-" ) prod )*
//   prod    := unary ( ( "*" | "/" | "%" ) unary )*
//   unary   := "-" unary | atom
//   atom    := number | string | "true" | "false" | call | path | "(" expr ")"
//   list    := expr ( "," expr )*
//   call    := ident "(" ( expr ( "," expr )* )? ")"
//   path    := ident ( "." ident )*
//   number  := [0-9]+ ( "." [0-9]+ )?
//   string  := "'" [a-z0-9_.:-]* "'"
//   ident   := [a-z_][a-z0-9_]*
//
// Whitespace is spaces, tabs and newlines; at most 500 characters and an
// AST 32 deep. Types: number, bool, id. The syntax tree:
//   ["num", 0.5] ["bool", true] ["id", "rested"] ["var", "trip.day"]
//   ["call", "flag", [args]] ["neg", x] ["not", x] ["bin", op, a, b]
//   ["and", a, b] ["or", a, b] ["cond", c, a, b] ["in", x, [items]]

import { EngineError } from './error.js';

/** The source limit, in characters. */
export const MAX_LENGTH = 500;
/** The syntax tree's depth limit. */
export const MAX_DEPTH = 32;
/** Words that are never names. */
export const RESERVED = Object.freeze(['true', 'false', 'in']);

const CMP = ['<', '<=', '>', '>=', '==', '!='];
const ARITH = ['+', '-', '*', '/', '%'];

/**
 * The function whitelist (in code, not data): argument types (a string
 * list, or `many` for two or more numbers) and the result's type. has,
 * lacks, count, since, echo, dark and month_in arrive with the systems they
 * read (S8 to S9).
 * @type {Readonly<Record<string, {args: string[] | 'many', ret: string}>>}
 */
export const FUNCS = Object.freeze({
  flag: { args: ['id'], ret: 'bool' },
  seen: { args: ['id'], ret: 'bool' },
  min: { args: 'many', ret: 'number' },
  max: { args: 'many', ret: 'number' },
  abs: { args: ['number'], ret: 'number' },
  clamp: { args: ['number', 'number', 'number'], ret: 'number' },
  round: { args: ['number'], ret: 'number' },
  floor: { args: ['number'], ret: 'number' },
  ceil: { args: ['number'], ret: 'number' },
  lerp: { args: ['number', 'number', 'number'], ret: 'number' },
  step: { args: ['number', 'number'], ret: 'number' },
});

/**
 * @typedef {any[]} Ast a syntax tree node, as JSON
 * @typedef {{type: 'num' | 'str' | 'ident' | 'op' | 'end', value: string, col: number}} Token
 */

/** A parse error: EngineError('expr'), with the column in its message and in detail.col. */
export class ExprError extends EngineError {
  /**
   * @param {string} msg
   * @param {number} col 1-based
   */
  constructor(msg, col) {
    super('expr', `expr: ${msg} at column ${col}`, { col }); // t-ok: a developer message
  }
}

const isDigit = (/** @type {string} */ c) => c >= '0' && c <= '9';
const isIdStart = (/** @type {string} */ c) => (c >= 'a' && c <= 'z') || c === '_';
const isIdChar = (/** @type {string} */ c) => isIdStart(c) || isDigit(c);
const isStrChar = (/** @type {string} */ c) => isIdChar(c) || c === '.' || c === ':' || c === '-';
const TWO = ['||', '&&', '<=', '>=', '==', '!='];
const ONE = '<>!+-*/%?:()[],.';

/**
 * Split a source into tokens.
 * @param {string} src
 * @returns {Token[]}
 */
function tokenize(src) {
  /** @type {Token[]} */
  const out = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const col = i + 1;
    if (c === ' ' || c === '\t' || c === '\n') {
      i++;
    } else if (isDigit(c)) {
      let j = i;
      while (j < src.length && isDigit(src[j])) j++;
      if (src[j] === '.') {
        if (!isDigit(src[j + 1] || '')) throw new ExprError('a decimal point needs digits after it', j + 1);
        j++;
        while (j < src.length && isDigit(src[j])) j++;
      }
      if (j < src.length && (isIdChar(src[j]) || src[j] === '.')) throw new ExprError('a number ends at a digit (no exponents, no names after it)', j + 1);
      out.push({ type: 'num', value: src.slice(i, j), col });
      i = j;
    } else if (c === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== "'") {
        if (!isStrChar(src[j])) throw new ExprError('a string is an id: a-z, 0-9 and _ . : -', j + 1);
        j++;
      }
      if (j >= src.length) throw new ExprError('a string has no closing quote', col);
      out.push({ type: 'str', value: src.slice(i + 1, j), col });
      i = j + 1;
    } else if (isIdStart(c)) {
      let j = i;
      while (j < src.length && isIdChar(src[j])) j++;
      out.push({ type: 'ident', value: src.slice(i, j), col });
      i = j;
    } else if (TWO.includes(src.slice(i, i + 2))) {
      out.push({ type: 'op', value: src.slice(i, i + 2), col });
      i += 2;
    } else if (ONE.includes(c)) {
      out.push({ type: 'op', value: c, col });
      i++;
    } else {
      throw new ExprError(`no ${JSON.stringify(c)} in the language`, col);
    }
  }
  out.push({ type: 'end', value: '', col: src.length + 1 });
  return out;
}

/**
 * The depth of a syntax tree.
 * @param {Ast} ast
 * @returns {number}
 */
export function depthOf(ast) {
  let d = 0;
  for (const c of children(ast)) d = Math.max(d, depthOf(c));
  return d + 1;
}

/**
 * A node's child expressions.
 * @param {Ast} ast
 * @returns {Ast[]}
 */
function children(ast) {
  switch (ast[0]) {
    case 'call':
      return ast[2];
    case 'neg':
    case 'not':
      return [ast[1]];
    case 'bin':
      return [ast[2], ast[3]];
    case 'and':
    case 'or':
      return [ast[1], ast[2]];
    case 'cond':
      return [ast[1], ast[2], ast[3]];
    case 'in':
      return [ast[1], ...ast[2]];
    default:
      return [];
  }
}

/**
 * Parse a source into its syntax tree. Throws EngineError('expr') with the
 * column (detail.col) on anything outside the grammar or the limits.
 * @param {string} src
 * @returns {Ast}
 */
export function parse(src) {
  if (typeof src !== 'string') throw new ExprError('an expression is a string', 1);
  if (src.length > MAX_LENGTH) throw new ExprError(`longer than ${MAX_LENGTH} characters`, MAX_LENGTH + 1);
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const isOp = (/** @type {string} */ v) => toks[p].type === 'op' && toks[p].value === v;
  const isWord = (/** @type {string} */ v) => toks[p].type === 'ident' && toks[p].value === v;
  /** @param {string} v */
  const expect = (v) => {
    if (!isOp(v)) throw new ExprError(`expected "${v}"`, peek().col);
    p++;
  };
  // The length limit bounds the recursion; the depth limit is checked on the tree.
  /** @returns {Ast} */
  const expr = () => cond();
  /** @returns {Ast} */
  const cond = () => {
    const c = or();
    if (!isOp('?')) return c;
    p++;
    const a = expr();
    expect(':');
    const b = expr();
    return ['cond', c, a, b];
  };
  /** @returns {Ast} */
  const or = () => {
    let a = and();
    while (isOp('||')) {
      p++;
      a = ['or', a, and()];
    }
    return a;
  };
  /** @returns {Ast} */
  const and = () => {
    let a = not();
    while (isOp('&&')) {
      p++;
      a = ['and', a, not()];
    }
    return a;
  };
  /** @returns {Ast} */
  const not = () => {
    if (isOp('!')) {
      p++;
      return ['not', not()];
    }
    return cmp();
  };
  /** @returns {Ast} */
  const cmp = () => {
    const a = sum();
    if (peek().type === 'op' && CMP.includes(peek().value)) {
      const op = toks[p++].value;
      return ['bin', op, a, sum()];
    }
    if (isWord('in')) {
      p++;
      expect('[');
      const items = [expr()];
      while (isOp(',')) {
        p++;
        items.push(expr());
      }
      expect(']');
      return ['in', a, items];
    }
    return a;
  };
  /** @returns {Ast} */
  const sum = () => {
    let a = prod();
    while (isOp('+') || isOp('-')) {
      const op = toks[p++].value;
      a = ['bin', op, a, prod()];
    }
    return a;
  };
  /** @returns {Ast} */
  const prod = () => {
    let a = unary();
    while (isOp('*') || isOp('/') || isOp('%')) {
      const op = toks[p++].value;
      a = ['bin', op, a, unary()];
    }
    return a;
  };
  /** @returns {Ast} */
  const unary = () => {
    if (isOp('-')) {
      p++;
      return ['neg', unary()];
    }
    return atom();
  };
  /** @returns {Ast} */
  const atom = () => {
    const t = peek();
    if (t.type === 'num') {
      p++;
      return ['num', Number(t.value)];
    }
    if (t.type === 'str') {
      p++;
      return ['id', t.value];
    }
    if (t.type === 'op' && t.value === '(') {
      p++;
      const e = expr();
      expect(')');
      return e;
    }
    if (t.type === 'ident') {
      if (t.value === 'true' || t.value === 'false') {
        p++;
        return ['bool', t.value === 'true'];
      }
      if (t.value === 'in') throw new ExprError('"in" follows a value', t.col);
      p++;
      if (isOp('(')) {
        p++;
        /** @type {Ast[]} */
        const args = [];
        if (!isOp(')')) {
          args.push(expr());
          while (isOp(',')) {
            p++;
            args.push(expr());
          }
        }
        expect(')');
        if (isOp('.')) throw new ExprError('nothing follows a call with "."', peek().col);
        return ['call', t.value, args];
      }
      const path = [t.value];
      while (isOp('.')) {
        p++;
        const n = peek();
        if (n.type !== 'ident' || RESERVED.includes(n.value)) throw new ExprError('a name follows "."', n.col);
        path.push(n.value);
        p++;
      }
      if (isOp('(')) throw new ExprError('only a whitelisted function can be called, by its bare name', peek().col);
      return ['var', path.join('.')];
    }
    if (t.type === 'end') throw new ExprError('the expression ends too soon', t.col);
    throw new ExprError(`unexpected "${t.value}"`, t.col);
  };

  const ast = expr();
  if (peek().type !== 'end') throw new ExprError(`unexpected "${peek().value}"`, peek().col);
  if (depthOf(ast) > MAX_DEPTH) throw new ExprError(`nested more than ${MAX_DEPTH} deep`, 1);
  return ast;
}

/**
 * @typedef {{type?: string, int?: boolean, min?: number, max?: number}} VarDecl
 * @typedef {{type: string | null, errors: string[], warnings: string[]}} Checked
 */

/**
 * Type-check a syntax tree against the declared variables (schemas/vars.json,
 * or its `vars` map). `want` is the field's declared type, if it has one.
 * @param {Ast} ast
 * @param {{vars?: Record<string, VarDecl>} | Record<string, VarDecl>} vars
 * @param {string} [want] 'number' or 'bool'
 * @returns {Checked}
 */
export function check(ast, vars, want) {
  /** @type {Record<string, VarDecl>} */
  const decl = /** @type {any} */ (vars && typeof vars.vars === 'object' ? vars.vars : vars || {});
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];
  const has = (/** @type {object} */ o, /** @type {string} */ k) => Object.prototype.hasOwnProperty.call(o, k);
  /** @param {Ast} n */
  const isLiteral = (n) => n[0] === 'num' || n[0] === 'id' || n[0] === 'bool' || (n[0] === 'neg' && n[1][0] === 'num');
  /** @param {Ast} n */
  const isZero = (n) => (n[0] === 'num' && n[1] === 0) || (n[0] === 'neg' && n[1][0] === 'num' && n[1][1] === 0);

  /**
   * @param {Ast} n
   * @returns {string | null}
   */
  const type = (n) => {
    if (!Array.isArray(n)) {
      errors.push('not a syntax tree node'); // t-ok: a developer message (build time)
      return null;
    }
    switch (n[0]) {
      case 'num':
        if (typeof n[1] !== 'number' || !Number.isFinite(n[1]) || n[1] < 0) {
          errors.push('a number literal is finite and not negative'); // t-ok: a developer message (build time)
          return null;
        }
        return 'number';
      case 'bool':
        if (typeof n[1] === 'boolean') return 'bool';
        errors.push('a bool literal is true or false'); // t-ok: a developer message (build time)
        return null;
      case 'id':
        if (typeof n[1] === 'string' && /^[a-z0-9_.:-]*$/.test(n[1])) return 'id';
        errors.push('a string literal is an id'); // t-ok: a developer message (build time)
        return null;
      case 'var': {
        if (!has(decl, n[1])) {
          errors.push(`unknown variable ${n[1]}`); // t-ok: a developer message (build time)
          return null;
        }
        const t = decl[n[1]].type || 'number';
        return t === 'boolean' ? 'bool' : t;
      }
      case 'call': {
        const [, name, args] = n;
        /** @type {(string | null)[]} */
        const types = args.map(type);
        if (!has(FUNCS, name)) {
          errors.push(`unknown function ${name}()`); // t-ok: a developer message (build time)
          return null;
        }
        const f = FUNCS[name];
        if (f.args === 'many') {
          if (args.length < 2) errors.push(`${name}() takes two or more numbers`); // t-ok: a developer message (build time)
          types.forEach((t, k) => {
            if (t && t !== 'number') errors.push(`${name}() argument ${k + 1} is ${t}, not a number`); // t-ok: a developer message (build time)
          });
        } else {
          if (args.length !== f.args.length) errors.push(`${name}() takes ${f.args.length} argument${f.args.length === 1 ? '' : 's'}, not ${args.length}`); // t-ok: a developer message (build time)
          types.forEach((t, k) => {
            const w = /** @type {string[]} */ (f.args)[k];
            if (t && w && t !== w) errors.push(`${name}() argument ${k + 1} is ${t}, not ${w === 'id' ? 'an id' : `a ${w}`}`); // t-ok: a developer message (build time)
          });
        }
        return f.ret;
      }
      case 'neg': {
        const t = type(n[1]);
        if (t && t !== 'number') errors.push(`"-" takes a number, not ${t}`); // t-ok: a developer message (build time)
        return 'number';
      }
      case 'not': {
        const t = type(n[1]);
        if (t && t !== 'bool') errors.push(`"!" takes a bool, not ${t}`); // t-ok: a developer message (build time)
        return 'bool';
      }
      case 'bin': {
        const [, op, a, b] = n;
        const ta = type(a);
        const tb = type(b);
        if (op === '==' || op === '!=') {
          if (ta && tb && ta !== tb) errors.push(`"${op}" compares ${ta} with ${tb}`); // t-ok: a developer message (build time)
          return 'bool';
        }
        if (!ARITH.includes(op) && !CMP.includes(op)) {
          errors.push(`no operator "${op}"`); // t-ok: a developer message (build time)
          return null;
        }
        for (const t of [ta, tb]) if (t && t !== 'number') errors.push(`"${op}" takes numbers, not ${t}`); // t-ok: a developer message (build time)
        if (op === '/' || op === '%') {
          if (isZero(b)) errors.push(`"${op}" by zero`); // t-ok: a developer message (build time)
          else if (b[0] === 'var' && has(decl, b[1])) {
            const d = decl[b[1]];
            const lo = typeof d.min === 'number' ? d.min : -Infinity;
            const hi = typeof d.max === 'number' ? d.max : Infinity;
            if (lo <= 0 && hi >= 0) warnings.push(`"${op}" by ${b[1]}, whose range includes 0`); // t-ok: a developer message (build time)
          }
        }
        return ARITH.includes(op) ? 'number' : 'bool';
      }
      case 'and':
      case 'or': {
        for (const t of [type(n[1]), type(n[2])]) if (t && t !== 'bool') errors.push(`"${n[0] === 'and' ? '&&' : '||'}" takes bools, not ${t}`); // t-ok: a developer message (build time)
        return 'bool';
      }
      case 'cond': {
        const tc = type(n[1]);
        const ta = type(n[2]);
        const tb = type(n[3]);
        if (tc && tc !== 'bool') errors.push(`"?" needs a bool before it, not ${tc}`); // t-ok: a developer message (build time)
        if (ta && tb && ta !== tb) errors.push(`"?:" gives ${ta} or ${tb}: both sides need one type`); // t-ok: a developer message (build time)
        return ta || tb;
      }
      case 'in': {
        const tx = type(n[1]);
        const items = n[2];
        if (!Array.isArray(items) || !items.length) {
          errors.push('"in" needs a list'); // t-ok: a developer message (build time)
          return 'bool';
        }
        for (const it of items) {
          if (!isLiteral(it)) errors.push('"in" needs a list of literals'); // t-ok: a developer message (build time)
          else {
            const ti = type(it);
            if (tx && ti && ti !== tx) errors.push(`"in" looks for ${tx} in a list holding ${ti}`); // t-ok: a developer message (build time)
          }
        }
        return 'bool';
      }
      default:
        errors.push(`no node "${n[0]}"`); // t-ok: a developer message (build time)
        return null;
    }
  };

  let t = null;
  try {
    t = depthOf(ast) > MAX_DEPTH ? null : type(ast);
    if (t === null && !errors.length) errors.push(`nested more than ${MAX_DEPTH} deep`); // t-ok: a developer message (build time)
  } catch {
    errors.push('not a syntax tree'); // t-ok: a developer message (build time)
  }
  if (t && want && t !== want) errors.push(`the field wants ${want === 'bool' ? 'a bool' : `a ${want}`}, and this is ${t === 'id' ? 'an id' : `a ${t}`}`); // t-ok: a developer message (build time)
  return { type: errors.length ? null : t, errors, warnings };
}

/**
 * @typedef {object} Env what an expression may read
 * @property {(path: string) => number | boolean | string} v a variable's value
 * @property {(id: string) => boolean} flag a trip flag is set
 * @property {(id: string) => boolean} seen the profile's recently seen cards
 * @typedef {(env: Env) => any} Compiled
 */

/** @param {number} v */
const num = (v) => {
  if (!Number.isFinite(v)) throw new EngineError('expr', 'expr: a result is not a finite number');
  return v === 0 ? 0 : v;
};

/**
 * Compile a syntax tree to a closure (no eval, no new Function). Runtime
 * errors (a division by zero, a non-finite result) throw
 * EngineError('expr'); && and || short-circuit.
 * @param {Ast} ast
 * @returns {Compiled}
 */
export function compile(ast) {
  if (!Array.isArray(ast)) throw new EngineError('expr', 'expr: not a syntax tree');
  switch (ast[0]) {
    case 'num':
    case 'bool':
    case 'id': {
      const v = ast[1];
      return () => v;
    }
    case 'var': {
      const path = ast[1];
      return (env) => env.v(path);
    }
    case 'call': {
      const [, name, args] = ast;
      /** @type {Compiled[]} */
      const fs = args.map(compile);
      switch (name) {
        case 'flag': {
          const [a] = fs;
          return (env) => env.flag(a(env));
        }
        case 'seen': {
          const [a] = fs;
          return (env) => env.seen(a(env));
        }
        case 'min':
          return (env) => num(Math.min(...fs.map((f) => f(env))));
        case 'max':
          return (env) => num(Math.max(...fs.map((f) => f(env))));
        case 'abs':
          return (env) => num(Math.abs(fs[0](env)));
        case 'round':
          return (env) => num(Math.round(fs[0](env)));
        case 'floor':
          return (env) => num(Math.floor(fs[0](env)));
        case 'ceil':
          return (env) => num(Math.ceil(fs[0](env)));
        case 'clamp': {
          const [x, lo, hi] = fs;
          return (env) => num(Math.min(Math.max(x(env), lo(env)), hi(env)));
        }
        case 'lerp': {
          const [a, b, w] = fs;
          return (env) => {
            const va = a(env);
            return num(va + (b(env) - va) * w(env));
          };
        }
        case 'step': {
          const [edge, x] = fs;
          return (env) => (x(env) < edge(env) ? 0 : 1);
        }
        default:
          throw new EngineError('expr', 'expr: not a whitelisted function');
      }
    }
    case 'neg': {
      const a = compile(ast[1]);
      return (env) => num(-a(env));
    }
    case 'not': {
      const a = compile(ast[1]);
      return (env) => !a(env);
    }
    case 'bin': {
      const [, op, x, y] = ast;
      const a = compile(x);
      const b = compile(y);
      switch (op) {
        case '+':
          return (env) => num(a(env) + b(env));
        case '-':
          return (env) => num(a(env) - b(env));
        case '*':
          return (env) => num(a(env) * b(env));
        case '/':
        case '%':
          return (env) => {
            const va = a(env);
            const vb = b(env);
            if (vb === 0) throw new EngineError('expr', 'expr: a division by zero');
            return num(op === '/' ? va / vb : va % vb);
          };
        case '<':
          return (env) => a(env) < b(env);
        case '<=':
          return (env) => a(env) <= b(env);
        case '>':
          return (env) => a(env) > b(env);
        case '>=':
          return (env) => a(env) >= b(env);
        case '==':
          return (env) => a(env) === b(env);
        case '!=':
          return (env) => a(env) !== b(env);
        default:
          throw new EngineError('expr', 'expr: not an operator');
      }
    }
    case 'and': {
      const a = compile(ast[1]);
      const b = compile(ast[2]);
      return (env) => Boolean(a(env) && b(env));
    }
    case 'or': {
      const a = compile(ast[1]);
      const b = compile(ast[2]);
      return (env) => Boolean(a(env) || b(env));
    }
    case 'cond': {
      const c = compile(ast[1]);
      const a = compile(ast[2]);
      const b = compile(ast[3]);
      return (env) => (c(env) ? a(env) : b(env));
    }
    case 'in': {
      const x = compile(ast[1]);
      /** @type {Compiled[]} */
      const items = ast[2].map(compile);
      return (env) => {
        const v = x(env);
        return items.some((f) => f(env) === v);
      };
    }
    default:
      throw new EngineError('expr', 'expr: not a syntax tree node');
  }
}

const PREC = { or: 1, and: 2, not: 3, cmp: 4, sum: 5, prod: 6, unary: 7, atom: 8 };

/**
 * A syntax tree back to source, with only the parentheses it needs (so
 * parse(format(ast)) deep-equals ast).
 * @param {Ast} ast
 * @returns {string}
 */
export function format(ast) {
  /**
   * @param {Ast} n
   * @returns {[string, number]} source and precedence
   */
  const f = (n) => {
    /** @param {Ast} c @param {number} min */
    const at = (c, min) => {
      const [s, p] = f(c);
      return p < min ? `(${s})` : s;
    };
    switch (n[0]) {
      case 'num':
        return [String(n[1]), PREC.atom];
      case 'bool':
        return [n[1] ? 'true' : 'false', PREC.atom];
      case 'id':
        return [`'${n[1]}'`, PREC.atom];
      case 'var':
        return [n[1], PREC.atom];
      case 'call':
        return [`${n[1]}(${n[2].map((/** @type {Ast} */ a) => f(a)[0]).join(', ')})`, PREC.atom];
      case 'neg':
        return [`-${at(n[1], PREC.unary)}`, PREC.unary];
      case 'not':
        return [`!${at(n[1], PREC.not)}`, PREC.not];
      case 'bin': {
        const [, op, a, b] = n;
        if (CMP.includes(op)) return [`${at(a, PREC.sum)} ${op} ${at(b, PREC.sum)}`, PREC.cmp];
        const p = op === '+' || op === '-' ? PREC.sum : PREC.prod;
        return [`${at(a, p)} ${op} ${at(b, p + 1)}`, p];
      }
      case 'and':
        return [`${at(n[1], PREC.and)} && ${at(n[2], PREC.not)}`, PREC.and];
      case 'or':
        return [`${at(n[1], PREC.or)} || ${at(n[2], PREC.and)}`, PREC.or];
      case 'cond':
        return [`${at(n[1], PREC.or)} ? ${f(n[2])[0]} : ${f(n[3])[0]}`, 0];
      case 'in':
        return [`${at(n[1], PREC.sum)} in [${n[2].map((/** @type {Ast} */ a) => f(a)[0]).join(', ')}]`, PREC.cmp];
      default:
        throw new EngineError('expr', 'expr: not a syntax tree node');
    }
  };
  return f(ast)[0];
}
