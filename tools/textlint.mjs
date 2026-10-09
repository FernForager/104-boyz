// The text lints (GAME_DESIGN 18.5, F.3; BUILD_PLAN 10.5). tools/lint.mjs
// runs them with the rest, and `node tools/text.mjs check` runs them alone.
//
//   T07 no book frame: F.3's book words, whole words, in any line main can
//       reach, any ledger entry and main's built words; a warning on a
//       preview-only draft (SPEC call 1: T07_PREVIEW below makes it strict)
//   T10 no original English outside content/text/: JS sinks and shapes,
//       HTML text and attributes, CSS content, the manifest, SVG text
//   T11 every id used is defined, and every line on a built screen is used
//   T12 the ledger matches the answers files, entry by entry
//   T13 {variables} match their calls; {PLACEHOLDERS} only where allowed
//   T14 the main gate: every line main reaches is approved words
//
// Content refers to lines too (S3): a string "@<id>" in a content file
// (content/**/*.json outside content/text/ and content/art/) is a use (T11),
// a field its schema marks "x-text" must hold one (T10), and the engine
// passes such a line no {variables} yet (T13). Code that shows a line the
// content names ends its tx() or t() line `// t-ids: @content`: its ids are
// the content's refs, which T11 and the smoke run's template check cover.
//
// Each issue is {file, line, code, msg, level}, level 'error' or 'warn'.
// What isn't a problem but is worth knowing (a line waiting for its screen,
// an off-main line now approved) comes back as `infos`.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep, extname } from 'node:path';
import { ROOT } from './pics.mjs';
import { parseHtml, walk, getAttr, textOf } from './html.mjs';
import { validate } from './schema.mjs';
import { FOLDERS, readSchemas, lineOfPath } from './content.mjs';
import {
  readText,
  stateOf,
  forms,
  wordsString,
  wordsHash,
  fnv1a,
  lineOfKey,
  mainReach,
  manifestIds,
  parseAttrChains,
  shellSources,
  applicable,
  fillPage,
  makeManifest,
  bundle,
  checkMainBuild,
  wordAttrs,
  isWordAttr,
  metaName,
  BOOK_WORDS,
  MANIFEST_IDS,
  PLACEHOLDER_IDS,
  FILL_VARS,
  SCOPE_FILE,
  LEDGER_FILE,
} from './text.mjs';

/** T07 on a draft that only preview can show: 'warn' (SPEC call 1) or 'error'. */
export const T07_PREVIEW = 'warn';
/** Files whose lines may hold a {PLACEHOLDER} (T13), each added with a reason by the session that needs it. */
export const T13_PLACEHOLDER_FILES = [];
export const PLACEHOLDER_RE = /^(?:BOY_\d(?:_QUIRK|_TUB|_GUESTBOOK)?|JON_QUIRK|MORGENROTH_STORY_\d|STORE_GENERAL|STORE_GEAR|STORE_BOUTIQUE|JOB_DRIVEIN|JOB_GASTROPUB|JOB_BOOKSTORE|BOYZ_DATES)$/;
const VAR_RE = /^[a-z][a-z0-9_]*$/;
/** A content ref: "@" and a line id. */
export const CONTENT_REF_RE = /^@([a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+)$/;
/** The `// t-ids:` entry for a call whose ids come from content refs. */
export const CONTENT_TIDS = '@content';
const T10_EXT = new Set(['.html', '.js', '.css', '.svg', '.webmanifest']);
const KEYWORDS = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);
const LETTER = /\p{L}/u;

/** @typedef {{file: string, line: number, code: string, msg: string, level?: 'error' | 'warn', id?: string}} Issue */

const snip = (s, n = 48) => {
  const one = s.replace(/\s+/g, ' ').trim();
  return one.length > n ? `${one.slice(0, n - 1)}…` : one;
};

// ---- Reading JS -----------------------------------------------------------

function lineIndex(src) {
  const breaks = [];
  for (let j = src.indexOf('\n'); j >= 0; j = src.indexOf('\n', j + 1)) breaks.push(j);
  return (k) => {
    let lo = 0;
    let hi = breaks.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (breaks[mid] < k) lo = mid + 1;
      else hi = mid;
    }
    return lo + 1;
  };
}

const ESC = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };

/** One escape in a JS string at code[j] === '\\': [text, next index]. */
function readEscape(code, j) {
  const c = code[j + 1];
  if (c === 'u' && code[j + 2] === '{') {
    const k = code.indexOf('}', j);
    return [String.fromCodePoint(parseInt(code.slice(j + 3, k), 16) || 0), k + 1];
  }
  if (c === 'u') return [String.fromCharCode(parseInt(code.slice(j + 2, j + 6), 16) || 0), j + 6];
  if (c === 'x') return [String.fromCharCode(parseInt(code.slice(j + 2, j + 4), 16) || 0), j + 4];
  if (c === '\n') return ['', j + 2];
  return [ESC[c] ?? c ?? '', j + 2];
}

/**
 * Read a JS file's literals (BUILD_PLAN 10.5). Returns every string and
 * template literal with its static text ({value, chunks, line, callees}:
 * the calls it sits inside), the t() and tx() calls, and the code with its
 * comments blanked (code0) and also its literals' text blanked (masked).
 * Good enough for our own modules; not a full JS parser.
 * @param {string} code
 */
export function scanJs(code) {
  const n = code.length;
  const c0 = code.split('');
  const c1 = code.split('');
  const blank = (arr, a, b, ch) => {
    for (let k = a; k < b; k++) if (arr[k] !== '\n') arr[k] = ch;
  };
  const literals = [];
  const tpl = [];
  let depth = 0;
  let prev = '';
  let i = 0;
  const chunk = (lit) => {
    const start = i;
    let s = '';
    while (i < n && code[i] !== '`' && !(code[i] === '$' && code[i + 1] === '{')) {
      if (code[i] === '\\') {
        const [t, j] = readEscape(code, i);
        s += t;
        i = j;
      } else s += code[i++];
    }
    lit.chunks.push(s);
    blank(c1, start, i, '_');
    if (i >= n || code[i] === '`') {
      lit.end = Math.min(i + 1, n);
      literals.push(lit);
      i++;
      prev = 'id';
    } else {
      lit.expr = true;
      tpl.push({ lit, depth });
      depth++;
      i += 2;
      prev = '(';
    }
  };
  while (i < n) {
    const ch = code[i];
    const nx = code[i + 1];
    if (ch === '/' && nx === '/') {
      let j = code.indexOf('\n', i);
      if (j < 0) j = n;
      blank(c0, i, j, ' ');
      blank(c1, i, j, ' ');
      i = j;
    } else if (ch === '/' && nx === '*') {
      let j = code.indexOf('*/', i + 2);
      j = j < 0 ? n : j + 2;
      blank(c0, i, j, ' ');
      blank(c1, i, j, ' ');
      i = j;
    } else if (ch === '"' || ch === "'") {
      let j = i + 1;
      let s = '';
      while (j < n && code[j] !== ch && code[j] !== '\n') {
        if (code[j] === '\\') {
          const [t, k] = readEscape(code, j);
          s += t;
          j = k;
        } else s += code[j++];
      }
      literals.push({ kind: 'str', start: i, end: j + 1, value: s, chunks: [s], expr: false });
      blank(c1, i + 1, j, '_');
      i = j + 1;
      prev = 'id';
    } else if (ch === '`') {
      const lit = { kind: 'tpl', start: i, end: -1, value: null, chunks: [], expr: false };
      i++;
      chunk(lit);
    } else if (ch === '}' && tpl.length && tpl[tpl.length - 1].depth === depth - 1) {
      depth--;
      const { lit } = tpl.pop();
      i++;
      chunk(lit);
    } else if (ch === '/' && (prev === '' || prev === 'kw' || '(,=:[!&|?{};+-*%<>~^'.includes(prev))) {
      let j = i + 1;
      let cls = false;
      while (j < n && code[j] !== '\n') {
        if (code[j] === '\\') {
          j += 2;
          continue;
        }
        if (code[j] === '[') cls = true;
        else if (code[j] === ']') cls = false;
        else if (code[j] === '/' && !cls) break;
        j++;
      }
      blank(c1, i + 1, j, '_');
      i = j + 1;
      while (i < n && /[a-z]/i.test(code[i])) i++;
      prev = 'id';
    } else if (/[A-Za-z_$]/.test(ch)) {
      let j = i;
      while (j < n && /[\w$]/.test(code[j])) j++;
      prev = KEYWORDS.has(code.slice(i, j)) ? 'kw' : 'id';
      i = j;
    } else if (/[0-9]/.test(ch)) {
      while (i < n && /[\w.]/.test(code[i])) i++;
      prev = 'id';
    } else {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      if (!/\s/.test(ch)) prev = ch === ')' || ch === ']' ? 'id' : ch;
      i++;
    }
  }

  const masked = c1.join('');
  const lineAt = lineIndex(code);
  for (const lit of literals) {
    lit.line = lineAt(lit.start);
    if (lit.kind === 'tpl' && !lit.expr) lit.value = lit.chunks[0];
  }
  literals.sort((a, b) => a.start - b.start);

  // The calls each literal sits inside, and the t()/tx() calls.
  const stack = [];
  const calls = [];
  let li = 0;
  for (let k = 0; k < masked.length; k++) {
    while (li < literals.length && literals[li].start === k) {
      literals[li].callees = stack.filter((e) => e.ch === '(').map((e) => e.callee);
      li++;
    }
    const ch = masked[k];
    if (ch === '(') {
      const callee = calleeBefore(masked, k);
      const e = { ch, callee, open: k, close: -1, line: lineAt(k) };
      stack.push(e);
      if (!callee.def && (callee.name === 't' || callee.name === 'tx')) calls.push(e);
    } else if (ch === '[' || ch === '{') stack.push({ ch });
    else if (ch === ')' || ch === ']' || ch === '}') {
      const e = stack.pop();
      if (e && e.ch === '(') e.close = k;
    }
  }
  for (; li < literals.length; li++) literals[li].callees = [];

  const byRange = new Map(literals.map((l) => [`${l.start}:${l.end}`, l]));
  const litAt = (a, b) => byRange.get(`${a}:${b}`);
  const tcalls = calls
    .filter((c) => c.close > c.open)
    .map((c) => {
      const args = splitArgs(masked, c.open + 1, c.close);
      const fn = c.callee.name;
      const idArg = args[fn === 't' ? 0 : 1];
      const varsArg = args[fn === 't' ? 1 : 2];
      const lit = idArg && litAt(idArg[0], idArg[1]);
      const id = lit && lit.value !== null ? lit.value : null;
      let vars;
      if (varsArg) vars = masked[varsArg[0]] === '{' ? objectKeys(masked, varsArg, litAt) : null;
      return { fn, id, literal: id !== null, vars, line: c.line };
    });
  return { code0: c0.join(''), masked, literals, calls: tcalls };
}

/** The name called at an open paren: {name: 'a.b', isNew, def} (def: a function's own definition). */
function calleeBefore(masked, k) {
  let j = k - 1;
  while (j >= 0 && /\s/.test(masked[j])) j--;
  const e = j + 1;
  while (j >= 0 && /[\w$.]/.test(masked[j])) j--;
  const name = masked.slice(j + 1, e);
  let q = j;
  while (q >= 0 && /\s/.test(masked[q])) q--;
  const r = q;
  while (q >= 0 && /[\w$]/.test(masked[q])) q--;
  const before = masked.slice(q + 1, r + 1);
  return { name, isNew: before === 'new', def: before === 'function' };
}

/** Top-level comma-separated ranges in masked[a, b), trimmed. */
function splitArgs(masked, a, b) {
  const out = [];
  let d = 0;
  let s = a;
  for (let k = a; k <= b; k++) {
    const ch = masked[k];
    if (k === b || (ch === ',' && d === 0)) {
      let x = s;
      let y = k;
      while (x < y && /\s/.test(masked[x])) x++;
      while (y > x && /\s/.test(masked[y - 1])) y--;
      if (y > x) out.push([x, y]);
      s = k + 1;
    } else if ('([{'.includes(ch)) d++;
    else if (')]}'.includes(ch)) d--;
  }
  return out;
}

/** An object literal's keys, or null when a spread hides them. */
function objectKeys(masked, [a, b], litAt) {
  const keys = [];
  for (const [x, y] of splitArgs(masked, a + 1, b - 1)) {
    const prop = masked.slice(x, y);
    if (prop.startsWith('...')) return null;
    const close = prop.search(/['"]/) === 0 ? prop.indexOf(prop[0], 1) : -1;
    const lit = close > 0 ? litAt(x, x + close + 1) : null;
    if (lit) keys.push(lit.value);
    else {
      const m = /^([A-Za-z_$][\w$]*)/.exec(prop);
      if (m) keys.push(m[1]);
    }
  }
  return keys;
}

// ---- T10: no original English outside content/text/ ----------------------

/** Properties whose value is written onto the page: their right-hand side is a sink. */
const PROP_SINK = /\.(?:textContent|innerText|innerHTML|outerHTML|title|alt|placeholder|value|label|aria[A-Z]\w*)\s*\+?=(?!=)/g;
/**
 * Calls whose arguments are written onto the page, each pattern ending at
 * its open paren: which arguments ('all', an index), 'attr' (setAttribute's
 * second, when the first names an attribute that counts as words) or 'share'
 * (the text and title of navigator.share's object).
 */
const CALL_SINKS = [
  [/\.(?:append|prepend|replaceChildren|replaceWith|before|after)\s*\(/g, 'all'],
  [/\.(?:insertAdjacentText|insertAdjacentHTML)\s*\(/g, 1],
  [/\bcreateTextNode\s*\(/g, 0],
  [/\bnew\s+Option\s*\(/g, 0],
  [/\bfillText\s*\(/g, 0],
  [/(?:^|[^\w$.])(?:alert|confirm|prompt)\s*\(/g, 'all'],
  [/\.setAttribute\s*\(/g, 'attr'],
  [/\.share\s*\(/g, 'share'],
];

/** Where the expression starting at masked[a] ends: a ; or , at its own depth, or the closer of what holds it. */
function exprEnd(masked, a) {
  let d = 0;
  for (let k = a; k < masked.length; k++) {
    const ch = masked[k];
    if ('([{'.includes(ch)) d++;
    else if (')]}'.includes(ch)) {
      if (d === 0) return k;
      d--;
    } else if (d === 0 && (ch === ';' || ch === ',')) return k;
  }
  return masked.length;
}

/** The index of the bracket that closes the one at masked[k]. */
function closeOf(masked, k) {
  let d = 0;
  for (let j = k; j < masked.length; j++) {
    if ('([{'.includes(masked[j])) d++;
    else if (')]}'.includes(masked[j]) && --d === 0) return j;
  }
  return masked.length;
}

/** The ranges of code whose value a sink writes onto the page (18.5). */
function sinkRanges({ masked, literals }) {
  const ranges = [];
  for (const m of masked.matchAll(PROP_SINK)) {
    const a = m.index + m[0].length;
    ranges.push([a, exprEnd(masked, a)]);
  }
  for (const [re, which] of CALL_SINKS) {
    for (const m of masked.matchAll(re)) {
      const open = m.index + m[0].length - 1;
      const args = splitArgs(masked, open + 1, closeOf(masked, open));
      if (which === 'all') ranges.push(...args);
      else if (typeof which === 'number') {
        if (args[which]) ranges.push(args[which]);
      } else if (which === 'attr') {
        const name = args[0] && literals.find((l) => l.start === args[0][0] && l.end === args[0][1]);
        if (name && name.value !== null && isWordAttr(name.value.toLowerCase()) && args[1]) ranges.push(args[1]);
      } else if (args[0] && masked[args[0][0]] === '{') {
        for (const [x, y] of splitArgs(masked, args[0][0] + 1, args[0][1] - 1)) {
          const kv = /^(?:text|title)\s*:\s*/.exec(masked.slice(x, y));
          if (kv) ranges.push([x + kv[0].length, y]);
        }
      }
    }
  }
  return ranges;
}

/**
 * The literals a sink writes: anywhere in its value (joined with +, chosen
 * by ?: or ||, in parentheses, in an array or a template), but not an
 * argument to a call inside it, whose result is what is written (t('app.x')
 * is an id).
 */
function sinkLiterals(scan) {
  const out = new Set();
  const at = new Map(scan.literals.map((l) => [l.start, l]));
  for (const [a, b] of sinkRanges(scan)) {
    const stack = [];
    for (let k = a; k < b; k++) {
      const ch = scan.masked[k];
      if (at.has(k) && !stack.includes('call')) out.add(at.get(k));
      if (ch === '(') {
        const { name } = calleeBefore(scan.masked, k);
        stack.push(name && !KEYWORDS.has(name) ? 'call' : 'group');
      } else if (ch === '[' || ch === '{') stack.push('group');
      else if (ch === ')' || ch === ']' || ch === '}') stack.pop();
    }
  }
  return out;
}

/** Code, not words: ids, paths, URLs, MIME types, media queries, selectors. */
export function codeShaped(s) {
  const t = s.trim();
  if (!/\s/.test(t) && !/\b[A-Z][a-z]+\b/.test(t)) return true;
  if (/^\(.*\)$/s.test(t)) return true;
  return t.split(/\s+/).every((tok) => /^[.#[:>+~*]/.test(tok) || /^[a-z][a-z0-9-]*[.#[:]/.test(tok));
}

/** Two words, a capitalised word or sentence punctuation, and not code-shaped. */
export function englishShaped(s) {
  if (!/[A-Za-z]/.test(s)) return false;
  const shaped = /[A-Za-z]{2,}\s+[A-Za-z]{2,}/.test(s) || /\b[A-Z][a-z]+\b/.test(s) || /[A-Za-z][.!?…](\s|$)/.test(s);
  return shaped && !codeShaped(s);
}

/**
 * T10 over a JS module: words written to the page, and English-shaped
 * literals anywhere else. Exempt: console calls, Error messages, and a line
 * ending // t-ok: <reason> (developer text).
 * @returns {Issue[]}
 */
export function lintJsEnglish(file, code) {
  /** @type {Issue[]} */
  const out = [];
  const add = (line, msg) => out.push({ file, line, code: 'T10', msg });
  const ok = new Set();
  code.split('\n').forEach((row, i) => {
    const m = /\/\/\s*t-ok:(.*)$/.exec(row);
    if (!m) return;
    if (m[1].trim()) ok.add(i + 1);
    else add(i + 1, 'a // t-ok: tag needs its reason');
  });
  const scan = scanJs(code);
  const sunk = sinkLiterals(scan);
  for (const lit of scan.literals) {
    if (ok.has(lit.line)) continue;
    if (lit.callees.some((c) => /^console\.\w+$/.test(c.name) || (c.isNew && /Error$/.test(c.name)))) continue;
    if (sunk.has(lit)) {
      if (lit.chunks.some((s) => /[A-Za-z]/.test(s))) add(lit.line, `"${snip(lit.chunks.join('…'))}" is written to the page from code: give it an id in content/text and use t() or tx() (18.5)`);
      continue;
    }
    const s = lit.chunks.find(englishShaped);
    if (s !== undefined) add(lit.line, `"${snip(s)}" reads as English: give it an id in content/text, or end a developer line with // t-ok: <reason>`);
  }
  return out;
}

/**
 * T10 over a page: no text with letters, no words in any attribute that
 * counts as words (wordAttrs: all but code attributes), an empty <title>,
 * no content on a meta whose content is words, data-t elements empty in
 * source, and no <text> in an inline svg.
 * @returns {Issue[]}
 */
export function lintHtmlEnglish(file, html) {
  /** @type {Issue[]} */
  const out = [];
  const add = (line, msg) => out.push({ file, line, code: 'T10', msg });
  let tree;
  try {
    tree = parseHtml(html);
  } catch (e) {
    return [{ file, line: 1, code: 'T10', msg: `can't read the page: ${e.message}` }];
  }
  walk(tree, (n, parent) => {
    if (n.type === 'text') {
      const s = textOf(n);
      const quiet = parent && parent.type === 'element' && (parent.name === 'title' || getAttr(parent, 'data-t') !== undefined);
      if (!quiet && LETTER.test(s)) add(n.line, `"${snip(s)}" is English in the page: give the element data-t="<id>" (18.5)`);
      return undefined;
    }
    if (n.type !== 'element') return undefined;
    if (n.name === 'script' || n.name === 'style') return false;
    for (const [k, v] of wordAttrs(n)) {
      if (k === 'content' && n.name === 'meta') add(n.line, `the ${metaName(n) || 'unnamed'} meta's content counts as words: it takes them from data-t-attr="content:<id>"`);
      else if (v && LETTER.test(v)) add(n.line, `${k}="${snip(v)}" is English in the page: use data-t-attr="${k}:<id>"`);
    }
    if (n.name === 'title' && textOf(n).trim()) add(n.line, '<title> is empty in source: data-t fills it');
    if (n.name !== 'title' && getAttr(n, 'data-t') !== undefined && n.children.some((c) => c.type !== 'text' || c.raw.trim())) add(n.line, `the data-t="${getAttr(n, 'data-t')}" element has its own content in source; the build fills it`);
    if (n.name === 'svg') {
      walk(n, (m) => {
        if (m.type === 'element' && m.name === 'text') add(m.line, 'an inline svg holds no <text>: words come from content/text');
      });
    }
    return undefined;
  });
  return out;
}

/** T10 over a stylesheet: a content: string with a letter (glyphs like "> " pass). */
export function lintCssEnglish(file, css) {
  /** @type {Issue[]} */
  const out = [];
  const code = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const lineAt = lineIndex(code);
  for (const m of code.matchAll(/(?<![\w-])content\s*:\s*([^;}]*)/g)) {
    for (const q of m[1].matchAll(/"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g)) {
      const s = (q[1] ?? q[2]).replace(/\\([0-9a-f]{1,6})\s?/gi, (x, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\(.)/g, '$1');
      if (LETTER.test(s)) out.push({ file, line: lineAt(m.index), code: 'T10', msg: `content: "${snip(s)}" is English in a stylesheet (glyphs only; words come from content/text)` });
    }
  }
  return out;
}

/** T10 over the manifest source: name, short_name and description are "@id"s. */
export function lintManifestEnglish(file, src) {
  let m;
  try {
    m = JSON.parse(src);
  } catch (e) {
    return [{ file, line: 1, code: 'T10', msg: `not JSON: ${e.message}` }];
  }
  /** @type {Issue[]} */
  const out = [];
  for (const k of ['name', 'short_name', 'description']) {
    if (m[k] !== undefined && !(typeof m[k] === 'string' && /^@[a-z]/.test(m[k]))) out.push({ file, line: lineOfKey(src, k), code: 'T10', msg: `the manifest's ${k} is an id ("@app.${k}"), filled by the build` });
  }
  return out;
}

/** T10 over an SVG file: no <text>. */
export function lintSvgEnglish(file, src) {
  const lineAt = lineIndex(src);
  return [...src.matchAll(/<text[\s>/]/gi)].map((m) => ({ file, line: lineAt(m.index), code: 'T10', msg: 'an svg holds no <text>: words come from content/text' }));
}

/** A schema with the patterns on its "x-text" values set aside, so words in such a field still reach T10 (J01 reports the pattern). */
function looseText(schema) {
  if (Array.isArray(schema)) return schema.map(looseText);
  if (!schema || typeof schema !== 'object') return schema;
  const out = {};
  for (const [k, v] of Object.entries(schema)) if (!(k === 'pattern' && schema['x-text'])) out[k] = looseText(v);
  return out;
}

/**
 * T10 over content JSON: every value its schema marks "x-text" holds an
 * "@id", found through $ref, oneOf, items and properties (tools/schema.mjs's
 * annotations). src, when given, places each issue on its line.
 * @returns {Issue[]}
 */
export function lintTextFields(file, data, schema, src = '') {
  if (!schema || data === undefined || data === null) return [];
  let annotations = [];
  try {
    ({ annotations } = validate(looseText(schema), data));
  } catch {
    return []; // a broken schema is J01's
  }
  return annotations
    .filter((a) => a.keyword === 'x-text' && !(typeof a.value === 'string' && a.value.startsWith('@')))
    .map((a) => ({ file, line: src ? lineOfPath(src, a.path) : 1, code: 'T10', msg: `${a.path || 'the value'} is text: give it as "@<id>"` }));
}

/**
 * Every content file that refers to lines: content/**\/*.json outside
 * content/text/ and content/art/, read.
 * @returns {{file: string, src: string, data: any}[]}
 */
export function contentFiles(root = ROOT) {
  const rel = (p) => relative(root, p).split(sep).join('/');
  const out = [];
  for (const p of walkFiles(join(root, 'content'))) {
    const file = rel(p);
    if (extname(p) !== '.json' || file.startsWith('content/text/') || file.startsWith('content/art/')) continue;
    const src = readFileSync(p, 'utf8');
    let data;
    try {
      data = JSON.parse(src);
    } catch {
      continue; // J01 reports it
    }
    out.push({ file, src, data });
  }
  return out;
}

/**
 * Pure: the content refs in a file, every string "@<id>" (keys and
 * $comment aside), with its line.
 * @param {{file: string, src: string, data: any}} f
 * @returns {{id: string, file: string, line: number}[]}
 */
export function contentRefs({ file, src, data }) {
  const out = [];
  const visit = (v, path) => {
    if (typeof v === 'string') {
      const m = CONTENT_REF_RE.exec(v);
      if (m) out.push({ id: m[1], file, line: lineOfPath(src, path) });
    } else if (Array.isArray(v)) v.forEach((x, i) => visit(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (k !== '$comment') visit(x, path ? `${path}.${k}` : k);
  };
  visit(data, '');
  return out;
}

/**
 * T10 over the content the build compiles: each file against its schema
 * (by folder, as tools/content.mjs reads them).
 * @returns {Issue[]}
 */
export function lintContentText(root = ROOT, files = contentFiles(root)) {
  const schemas = readSchemas(root);
  const out = [];
  for (const f of files) {
    const [, folder, name] = /^content\/([a-z]+)\/([^/]+)\.json$/.exec(f.file) || [];
    if (!folder || !Object.prototype.hasOwnProperty.call(FOLDERS, folder)) continue;
    const schema = schemas[FOLDERS[folder](name)];
    if (schema) out.push(...lintTextFields(f.file, f.data, schema, f.src));
  }
  return out;
}

// ---- Where ids are used ---------------------------------------------------

function walkFiles(dir) {
  const out = [];
  let names = [];
  try {
    names = readdirSync(dir).sort();
  } catch {
    return out;
  }
  for (const n of names) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walkFiles(p));
    else out.push(p);
  }
  return out;
}

/**
 * Every id the code and the shell use (T11, T13): data-t* in pages, "@id"s
 * in the manifest, t()/tx() calls and id-shaped literals in modules, and
 * // t-ids: lists.
 * @param {{file: string, src: string}[]} files under web/
 */
export function collectUses(files) {
  const uses = { html: [], manifest: [], literals: [], calls: [], tids: [] };
  for (const { file, src } of files) {
    const ext = extname(file);
    if (ext === '.html') {
      let tree;
      try {
        tree = parseHtml(src);
      } catch {
        continue; // T10 reports it
      }
      walk(tree, (n) => {
        if (n.type !== 'element') return;
        const add = (id, how) => uses.html.push({ id, file, line: n.line, how });
        if (getAttr(n, 'data-t')) add(getAttr(n, 'data-t'), 'data-t');
        if (getAttr(n, 'data-t-img')) add(getAttr(n, 'data-t-img'), 'data-t-img');
        if (getAttr(n, 'data-t-attr')) for (const [, chain] of parseAttrChains(getAttr(n, 'data-t-attr'))) for (const id of chain) if (id) add(id, 'data-t-attr');
      });
    } else if (ext === '.webmanifest') {
      try {
        for (const id of manifestIds(src)) uses.manifest.push({ id, file, line: lineOfKey(src, Object.keys(JSON.parse(src)).find((k) => JSON.parse(src)[k] === `@${id}`)) });
      } catch {
        // T10 reports it
      }
    } else if (ext === '.js') {
      const scan = scanJs(src);
      for (const l of scan.literals) if (l.value !== null) uses.literals.push({ value: l.value, file, line: l.line });
      const tids = new Map();
      src.split('\n').forEach((row, i) => {
        const m = /\/\/\s*t-ids:(.*)$/.exec(row);
        if (!m) return;
        const ids = m[1].split(',').map((s) => s.trim()).filter(Boolean);
        tids.set(i + 1, ids);
        uses.tids.push({ ids, file, line: i + 1 });
      });
      for (const c of scan.calls) uses.calls.push({ ...c, file, tids: tids.get(c.line) || null });
    }
  }
  return uses;
}

/** The files T10 and T11 read: web/** and content/** outside content/text/. */
export function shippedSources(root = ROOT) {
  const rel = (p) => relative(root, p).split(sep).join('/');
  const out = [];
  for (const p of [...walkFiles(join(root, 'web')), ...walkFiles(join(root, 'content'))]) {
    const file = rel(p);
    if (file.startsWith('content/text/')) continue;
    if (!T10_EXT.has(extname(p))) continue;
    if (file.startsWith('content/') && extname(p) !== '.svg') continue;
    out.push({ file, src: readFileSync(p, 'utf8') });
  }
  return out;
}

// ---- T07, T11, T12, T13, T14 ----------------------------------------------

const defined = (text, id) => text.lines.has(id);
const has = (o, k) => Object.prototype.hasOwnProperty.call(o || {}, k);

/**
 * T07: no book frame (F.3). An error for any line main reaches and any
 * ledger entry; a warning (T07_PREVIEW) for a draft only preview shows.
 * @returns {Issue[]}
 */
export function lintT07(text, reach) {
  /** @type {Issue[]} */
  const out = [];
  const reached = new Set(reach);
  const allow = text.allow.ids || {};
  for (const [id, why] of Object.entries(allow)) {
    if (typeof why !== 'string' || !why.trim()) out.push({ file: 'content/text/t07_allow.json', line: 1, code: 'T07', msg: `the allowlist entry for ${id} needs its reason`, level: 'error' });
  }
  const hit = (t) => {
    for (const f of forms(t)) {
      const m = BOOK_WORDS.exec(f.replace(/\{[^{}]*\}/g, ' '));
      if (m) return m[0];
    }
    return null;
  };
  for (const [id, line] of text.lines) {
    if (has(allow, id)) continue;
    const s = stateOf(id, text);
    if (s === 'cut') continue; // cut words ship nowhere
    const w = hit(line.text);
    if (!w) continue;
    const level = s === 'draft' && !reached.has(id) ? T07_PREVIEW : 'error';
    out.push({ file: line.file, line: line.line, code: 'T07', level, id, msg: `${id}: "${w}" is a book word (F.3)${level === 'warn' ? '; a draft only preview shows' : ''}` });
  }
  for (const [id, e] of Object.entries(text.ledger.lines)) {
    if (has(allow, id)) continue;
    const w = hit(e.text);
    if (w) out.push({ file: LEDGER_FILE, line: lineOfKey(text.ledgerSrc || '', id), code: 'T07', level: 'error', id, msg: `${id}: the ledger holds the book word "${w}" (F.3)` });
  }
  return out;
}

/**
 * T11: every id used is defined; every line on a screen the build has is
 * used. A line on a screen not built yet waits for it (an info).
 * @returns {{issues: Issue[], infos: string[]}}
 */
export function lintT11(text, uses) {
  /** @type {Issue[]} */
  const issues = text.problems.map((p) => ({ file: p.file, line: p.line, code: 'T11', msg: p.msg }));
  const infos = [];
  const used = new Set();
  const need = (id, file, line, what) => {
    if (defined(text, id)) used.add(id);
    else issues.push({ file, line, code: 'T11', msg: `${what} ${id}, which isn't defined in content/text` });
  };
  for (const id of [...MANIFEST_IDS, ...PLACEHOLDER_IDS]) need(id, 'tools/text.mjs', 1, 'the generated files use');
  for (const u of uses.html) need(u.id, u.file, u.line, `${u.how} uses`);
  for (const u of uses.manifest) need(u.id, u.file, u.line, 'the manifest uses');
  for (const u of uses.content || []) need(u.id, u.file, u.line, 'content refers to');
  for (const l of uses.literals) if (defined(text, l.value)) used.add(l.value);
  for (const t of uses.tids) for (const id of t.ids) if (id !== CONTENT_TIDS) need(id, t.file, t.line, '// t-ids: lists');
  for (const c of uses.calls) {
    if (c.literal) need(c.id, c.file, c.line, `${c.fn}() asks for`);
    else if (!c.tids) issues.push({ file: c.file, line: c.line, code: 'T11', msg: `${c.fn}() needs a literal id, or the line ends // t-ids: <every id it can be> (or ${CONTENT_TIDS})` });
  }
  for (const [id, line] of text.lines) {
    if (used.has(id)) continue;
    if (text.scope.screens.includes(line.screen)) issues.push({ file: line.file, line: line.line, code: 'T11', msg: `${id} is defined and never used` });
    else infos.push(`${id}: waiting for screen ${line.screen}`);
  }
  return { issues, infos };
}

/**
 * T12: every ledger entry points at an answer with the same id, the hash
 * the creator saw and words that match; a warning for an answer `apply`
 * would still record.
 * @returns {Issue[]}
 */
export function lintT12(text) {
  /** @type {Issue[]} */
  const out = [];
  const check = (id, e, cut) => {
    const at = { file: LEDGER_FILE, line: lineOfKey(text.ledgerSrc, id, cut ? text.ledgerSrc.indexOf('"cut"') : 0), code: 'T12' };
    const bad = (msg) => out.push({ ...at, msg: `${id}: ${msg}` });
    for (const f of ['batch', 'on', 'how']) if (!e[f]) bad(`the entry has no ${f}`);
    if (e.sha256 !== wordsHash(e.text)) bad("the entry's sha256 isn't the hash of its words");
    const ans = text.answers.get(e.batch);
    if (!ans) return bad(`no content/text/review/${e.batch}.answers.json`);
    const entries = Object.entries(ans.data.lines || {});
    const k = entries.findIndex(([x]) => x === id);
    if (k < 0) return bad(`${e.batch} has no answer for it`);
    const a = entries[k][1];
    if (e.seen !== a.hash) bad(`seen ${e.seen}, but ${e.batch} answered ${a.hash}`);
    if (e.line !== k + 1) bad(`line ${e.line}, but it is answer ${k + 1} in ${e.batch}`);
    if (cut) {
      if (a.verdict !== 'cut') bad(`a cut entry, but ${e.batch}'s answer is ${a.verdict}`);
    } else if (a.verdict === 'approve') {
      if (fnv1a(wordsString(e.text)) !== a.hash) bad(`approved words whose hash isn't ${a.hash}`);
      if (a.text != null && wordsString(a.text) !== wordsString(e.text)) bad(`the words aren't the ones ${e.batch} approved`);
    } else if (a.verdict === 'rewrite') {
      if (a.text == null || wordsString(a.text) !== wordsString(e.text)) bad(`the words aren't ${e.batch}'s rewrite`);
    } else bad(`${e.batch}'s answer is ${a.verdict}, which approves nothing`);
    return undefined;
  };
  for (const [id, e] of Object.entries(text.ledger.lines)) check(id, e, false);
  for (const [id, list] of Object.entries(text.ledger.cut)) for (const e of list) check(id, e, true);
  for (const [batch, ans] of text.answers) {
    for (const [id, a] of Object.entries(ans.data.lines || {})) {
      if (applicable(text, batch, id, a)) out.push({ file: ans.file, line: lineOfKey(ans.src, id), code: 'T12', level: 'warn', msg: `${batch} ${id}: answered but not applied: run npm run text:apply -- ${batch}` });
    }
  }
  return out;
}

/** A line's variables, across its forms; a plural needs n. */
export function varsOf(line) {
  const vars = new Set();
  for (const f of forms(line.text)) for (const m of f.matchAll(/\{([^{}]*)\}/g)) if (VAR_RE.test(m[1])) vars.add(m[1]);
  if (typeof line.text !== 'string') vars.add('n');
  return [...vars].sort();
}

/**
 * T13: braces hold a {variable} or a known {PLACEHOLDER} (only in the files
 * allowed one); a call passes exactly a line's variables; a line the build
 * fills uses only the fill's.
 * @returns {Issue[]}
 */
export function lintT13(text, uses) {
  /** @type {Issue[]} */
  const out = [];
  for (const [id, line] of text.lines) {
    const bad = (msg) => out.push({ file: line.file, line: line.line, code: 'T13', msg: `${id}: ${msg}` });
    for (const f of forms(line.text)) {
      for (const m of f.matchAll(/\{([^{}]*)\}/g)) {
        if (VAR_RE.test(m[1])) continue;
        if (PLACEHOLDER_RE.test(m[1])) {
          if (!T13_PLACEHOLDER_FILES.includes(line.file)) bad(`{${m[1]}} is a placeholder, and ${line.file} may not hold one`);
        } else bad(`{${m[1]}} is neither a {variable} nor a known {PLACEHOLDER}`);
      }
      if (/[{}]/.test(f.replace(/\{[^{}]*\}/g, ''))) bad('a brace with no partner');
    }
  }
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  for (const c of uses.calls) {
    if (!c.literal || !defined(text, c.id) || c.vars === null) continue;
    const want = varsOf(text.lines.get(c.id));
    const got = [...new Set(c.vars || [])].sort();
    if (!same(want, got)) out.push({ file: c.file, line: c.line, code: 'T13', msg: `${c.fn}('${c.id}') passes {${got.join(', ')}}, but the line has {${want.join(', ')}}` });
  }
  for (const [list, known, what] of [
    [uses.html, FILL_VARS, 'the build fills'],
    [uses.manifest, [], 'the manifest takes'],
    [uses.content || [], [], 'content refers to'],
  ]) {
    for (const u of list) {
      if (!defined(text, u.id)) continue;
      const extra = varsOf(text.lines.get(u.id)).filter((v) => !known.includes(v));
      if (extra.length) out.push({ file: u.file, line: u.line, code: 'T13', msg: `${u.id}: ${what} it, and knows no {${extra.join(', ')}}${known.length ? ` (only {${known.join(', ')}})` : ''}` });
    }
  }
  return out;
}

/**
 * T14, the main gate, statically: every line main reaches is approved
 * words (or changed: main keeps the ledger's), and every main.off id is
 * defined. Infos for off-main lines that are now approved.
 * @returns {{issues: Issue[], infos: string[]}}
 */
export function lintT14(text, reach) {
  /** @type {Issue[]} */
  const issues = [];
  const infos = [];
  const scopeSrc = text.scopeSrc || '';
  for (const id of Object.keys(text.scope.main.off)) {
    if (!defined(text, id)) issues.push({ file: SCOPE_FILE, line: lineOfKey(scopeSrc, id), code: 'T14', msg: `main.off names ${id}, which isn't defined` });
    else if (stateOf(id, text) === 'approved') infos.push(`${id}: approved: can come back on main (content/scope/m1a.json main.off)`);
  }
  for (const id of reach) {
    const line = text.lines.get(id);
    if (!line) continue; // T11
    const s = stateOf(id, text);
    if (s === 'draft' || s === 'cut') issues.push({ file: line.file, line: line.line, code: 'T14', id, msg: `main gate: ${id} is ${s} on screen ${line.screen}, and main reaches it: get it approved, or add it to main.off with a reason` });
    if (line.class === 'dev' && line.screen !== 'debug') issues.push({ file: line.file, line: line.line, code: 'T14', id, msg: `main gate: dev line ${id} is on screen ${line.screen}; dev words reach main only on the debug screen` });
  }
  return { issues, infos };
}

/**
 * Main's built words, made in memory from the working tree (the fill, the
 * manifest and the bundle) and checked as the build checks them.
 * @returns {Issue[]}
 */
export function checkMainInMemory(text, { html, manifest }, reach, build = 'dev') {
  try {
    const page = fillPage(html, { channel: 'main', text, build });
    const man = makeManifest(manifest, { channel: 'main', text });
    const words = bundle(text, 'main', reach)['en.json'];
    return checkMainBuild({ html: page, manifest: man, words, text, build, reach }).map((i) => ({ ...i, file: `dist/main/${i.file}` }));
  } catch (e) {
    return [{ file: 'web/index.html', line: 1, code: 'T14', msg: e.message }];
  }
}

/**
 * Every text rule over the repo.
 * @param {string} [root]
 * @param {{main?: boolean}} [o] main: also check main's built words, in memory
 * @returns {{issues: Issue[], infos: string[], reach: string[]}}
 */
export function runTextLint(root = ROOT, { main = false } = {}) {
  /** @type {Issue[]} */
  const issues = [];
  const infos = [];
  const text = readText(root, { strict: false });
  const files = shippedSources(root);
  for (const { file, src } of files) {
    const ext = extname(file);
    if (ext === '.js') issues.push(...lintJsEnglish(file, src));
    else if (ext === '.html') issues.push(...lintHtmlEnglish(file, src));
    else if (ext === '.css') issues.push(...lintCssEnglish(file, src));
    else if (ext === '.webmanifest') issues.push(...lintManifestEnglish(file, src));
    else if (ext === '.svg') issues.push(...lintSvgEnglish(file, src));
  }
  let reach = [];
  let shell = null;
  try {
    shell = shellSources(root);
    reach = mainReach(text, shell.html, shell.manifest);
  } catch (e) {
    issues.push({ file: 'web/index.html', line: 1, code: 'T14', msg: `can't work out what main reaches: ${e.message}` });
  }
  const uses = collectUses(files.filter((f) => f.file.startsWith('web/')));
  const content = contentFiles(root);
  uses.content = content.flatMap(contentRefs);
  issues.push(...lintContentText(root, content));
  issues.push(...lintT07(text, reach));
  const t11 = lintT11(text, uses);
  issues.push(...t11.issues);
  infos.push(...t11.infos);
  issues.push(...lintT12(text));
  issues.push(...lintT13(text, uses));
  const t14 = lintT14(text, reach);
  issues.push(...t14.issues);
  infos.push(...t14.infos);
  if (main && shell && !issues.some((i) => i.code === 'T14' || (i.code === 'T11' && (i.level || 'error') === 'error'))) issues.push(...checkMainInMemory(text, shell, reach));
  for (const i of issues) i.level = i.level || 'error';
  return { issues, infos, reach };
}
