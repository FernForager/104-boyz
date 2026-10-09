// A small HTML tree for our own pages (BUILD_PLAN 10.3; GAME_DESIGN 18.5).
// The word fill, T10's HTML rule and T14's check of the built page all read
// pages through it. It is not a general HTML parser: it reads the pages we
// write, which close their elements, and throws on anything it can't place.
//
// parseHtml(src) gives a root node whose children are
//   {type: 'doctype' | 'comment' | 'text', raw, line}
//   {type: 'element', name, attrs: [[name, value | null]], children, raw, end, line}
// where raw is the source of the token (an element's start tag), end is the
// source of its end tag (null for a void or self-closed element), and an
// attribute's value is decoded (null for a bare attribute such as hidden).
// serialize(tree) gives the source back byte for byte when nothing changed:
// a token re-emits its raw text, and setAttr/removeAttr clear an element's
// raw so its start tag is written afresh.

/** Elements with no end tag. */
export const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
/** Elements whose content is text up to their end tag: raw (script, style) or with entities (title, textarea). */
export const RAW_TEXT = new Set(['script', 'style']);
export const RCDATA = new Set(['title', 'textarea']);

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const ATTR_RE = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/y;

/** Decode the entities our pages use (named basics and numeric). */
export function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return Object.prototype.hasOwnProperty.call(ENTITIES, e.toLowerCase()) ? ENTITIES[e.toLowerCase()] : m;
  });
}

/** Escape text for an element's content. */
export function escapeText(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Escape text for a double-quoted attribute value. */
export function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Parse one of our pages.
 * @param {string} src
 * @returns {{type: 'root', children: any[]}}
 */
export function parseHtml(src) {
  const root = { type: 'root', children: [] };
  const stack = [root];
  let i = 0;
  const breaks = [];
  for (let j = src.indexOf('\n'); j >= 0; j = src.indexOf('\n', j + 1)) breaks.push(j);
  const lineAt = (k) => {
    let lo = 0;
    let hi = breaks.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (breaks[mid] < k) lo = mid + 1;
      else hi = mid;
    }
    return lo + 1;
  };
  const top = () => stack[stack.length - 1];
  const inSvg = () => stack.some((n) => n.type === 'element' && n.name === 'svg');
  const fail = (k, msg) => {
    throw new Error(`html: line ${lineAt(k)}: ${msg}`);
  };

  while (i < src.length) {
    if (src.startsWith('<!--', i)) {
      const j = src.indexOf('-->', i + 4);
      if (j < 0) fail(i, 'a comment never ends');
      top().children.push({ type: 'comment', raw: src.slice(i, j + 3), line: lineAt(i) });
      i = j + 3;
    } else if (/^<!doctype/i.test(src.slice(i, i + 9))) {
      const j = src.indexOf('>', i);
      if (j < 0) fail(i, 'the doctype never ends');
      top().children.push({ type: 'doctype', raw: src.slice(i, j + 1), line: lineAt(i) });
      i = j + 1;
    } else if (src[i] === '<' && src[i + 1] === '/' && /[a-z]/i.test(src[i + 2] || '')) {
      const j = src.indexOf('>', i);
      if (j < 0) fail(i, 'an end tag never ends');
      const raw = src.slice(i, j + 1);
      const name = raw.slice(2, -1).trim().toLowerCase();
      let k = stack.length - 1;
      while (k > 0 && stack[k].name !== name) k--;
      if (k === 0) fail(i, `</${name}> closes nothing`);
      for (let j = k + 1; j < stack.length; j++) stack[j].end = ''; // closed by this end tag, with none of its own
      stack[k].end = raw;
      stack.length = k;
      i = j + 1;
    } else if (src[i] === '<' && /[a-z]/i.test(src[i + 1] || '')) {
      const start = i;
      const m = /^<([a-z][a-z0-9-]*)/i.exec(src.slice(i));
      const name = m[1].toLowerCase();
      i += m[0].length;
      const attrs = [];
      let selfClosed = false;
      for (;;) {
        while (/\s/.test(src[i] || '')) i++;
        if (i >= src.length) fail(start, `<${name}> never ends`);
        if (src[i] === '>') {
          i++;
          break;
        }
        if (src[i] === '/' && src[i + 1] === '>') {
          selfClosed = true;
          i += 2;
          break;
        }
        ATTR_RE.lastIndex = i;
        const a = ATTR_RE.exec(src);
        if (!a) fail(i, `a bad attribute in <${name}>`);
        const v = a[2] ?? a[3] ?? a[4];
        attrs.push([a[1].toLowerCase(), v === undefined ? null : decode(v)]);
        i = ATTR_RE.lastIndex;
      }
      const node = { type: 'element', name, attrs, children: [], raw: src.slice(start, i), end: null, line: lineAt(start) };
      top().children.push(node);
      if (VOID.has(name) || (selfClosed && (name === 'svg' || inSvg()))) continue;
      if (RAW_TEXT.has(name) || RCDATA.has(name)) {
        const close = new RegExp(`</${name}\\s*>`, 'ig');
        close.lastIndex = i;
        const c = close.exec(src);
        if (!c) fail(start, `<${name}> never ends`);
        if (c.index > i) node.children.push({ type: 'text', raw: src.slice(i, c.index), line: lineAt(i) });
        node.end = c[0];
        i = c.index + c[0].length;
        continue;
      }
      stack.push(node);
    } else {
      let j = src.indexOf('<', i + 1);
      while (j >= 0 && !/[a-z!/]/i.test(src[j + 1] || '')) j = src.indexOf('<', j + 1);
      if (j < 0) j = src.length;
      top().children.push({ type: 'text', raw: src.slice(i, j), line: lineAt(i) });
      i = j;
    }
  }
  if (stack.length > 1) fail(src.length, `<${top().name}> is never closed`);
  return root;
}

function startTag(node) {
  const attrs = node.attrs.map(([k, v]) => (v === null ? ` ${k}` : ` ${k}="${escapeAttr(v)}"`)).join('');
  return `<${node.name}${attrs}>`;
}

/** The source of a tree or node. */
export function serialize(node) {
  if (node.type === 'root') return node.children.map(serialize).join('');
  if (node.type !== 'element') return node.raw;
  const open = node.raw ?? startTag(node);
  if (VOID.has(node.name) || (node.end === null && node.raw !== null && node.raw.endsWith('/>'))) return open;
  return `${open}${node.children.map(serialize).join('')}${node.end ?? `</${node.name}>`}`;
}

/**
 * Visit every node, parents first. fn(node, parent) may return false to
 * skip a node's children.
 */
export function walk(node, fn, parent = null) {
  if (node.type !== 'root' && fn(node, parent) === false) return;
  for (const c of [...(node.children || [])]) walk(c, fn, node);
}

/** The decoded text inside a node (comments left out). */
export function textOf(node) {
  if (node.type === 'text') return decode(node.raw);
  if (node.type === 'element' || node.type === 'root') return node.children.map(textOf).join('');
  return '';
}

/** An attribute's value: a string, null for a bare attribute, undefined when absent. */
export function getAttr(node, name) {
  const a = node.attrs.find(([k]) => k === name);
  return a ? a[1] : undefined;
}

export function hasAttr(node, name) {
  return node.attrs.some(([k]) => k === name);
}

/** Set an attribute (null for a bare one); the start tag is written afresh. */
export function setAttr(node, name, value) {
  const a = node.attrs.find(([k]) => k === name);
  if (a) a[1] = value;
  else node.attrs.push([name, value]);
  node.raw = null;
}

export function removeAttr(node, name) {
  const n = node.attrs.length;
  node.attrs = node.attrs.filter(([k]) => k !== name);
  if (node.attrs.length !== n) node.raw = null;
}

/** A new element. */
export function el(name, attrs = [], children = []) {
  return { type: 'element', name, attrs, children, raw: null, end: null, line: 0 };
}

/** A new text node, escaped. */
export function text(s) {
  return { type: 'text', raw: escapeText(s), line: 0 };
}
