// Fixtures for the words tests (not a test file itself): a made-up set of
// lines shaped as tools/text.mjs readText() returns them, and a tiny DOM
// for tx().

import { fnv1a, wordsHash, wordsString } from '../../tools/text.mjs';

/** A ledger entry for words, as `apply` would write it. */
export function entry(words, batch = 'B009', line = 1) {
  return { text: words, sha256: wordsHash(words), seen: fnv1a(wordsString(words)), batch, line, on: '2026-10-09', how: 'approve, test' };
}

/**
 * Text as readText() returns it.
 * @param {object} o
 * @param {Record<string, string | object>} o.lines id -> words, a plural, or a partial line ({text, ...})
 * @param {Record<string, any>} [o.approved] id -> approved words (or a full entry)
 * @param {Record<string, any[]>} [o.cut]
 * @param {Record<string, string>} [o.off] main.off
 * @param {string[]} [o.screens]
 * @param {string[]} [o.mainScreens]
 * @param {Record<string, string>} [o.swap] preview's swap
 * @param {Record<string, string>} [o.allow] T07's allowlist
 * @param {Record<string, any>} [o.answers] batch -> answers file
 */
export function fakeText({ lines = {}, approved = {}, cut = {}, off = {}, screens = ['app', 'title'], mainScreens, swap, allow = {}, answers = {} } = {}) {
  const map = new Map();
  for (const [id, l] of Object.entries(lines)) {
    const area = id.split('.')[0];
    const partial = typeof l === 'object' && 'text' in l ? l : { text: l }; // words, a plural, or a partial line
    map.set(id, { id, ctx: 'a note', screen: 'app', max: 99, class: 'ours', file: `content/text/en/${area}.json`, line: 1, ...partial });
  }
  const ledger = { lines: {}, cut };
  for (const [id, w] of Object.entries(approved)) ledger.lines[id] = w && w.sha256 ? w : entry(w);
  return {
    root: '/nowhere',
    lines: map,
    files: [...new Set([...map.values()].map((l) => l.file))],
    ledger,
    ledgerSrc: JSON.stringify(ledger, null, 1),
    scope: { screens, main: { screens: mainScreens || screens, off }, channels: swap ? { preview: { swap } } : {} },
    scopeSrc: '',
    allow: { ids: allow },
    answers: new Map(Object.entries(answers).map(([b, data]) => [b, { file: `content/text/review/${b}.answers.json`, src: JSON.stringify(data, null, 1), data }])),
    problems: [],
  };
}

/** A page for the fill, with the build's placeholders. */
export const page = (body, head = '') => `<!doctype html>\n<html lang="en" data-build="dev" data-channel="dev">\n<head>${head}</head>\n<body>${body}</body>\n</html>\n`;

/** The <body> of a filled page. */
export const bodyOf = (html) => html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));

// ---- A tiny DOM, enough for tx() ----------------------------------------

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

class FakeNode {
  constructor(doc) {
    this.ownerDocument = doc;
    this.childNodes = [];
    this.parentNode = null;
  }
  get firstChild() {
    return this.childNodes[0] || null;
  }
  appendChild(n) {
    if (n.parentNode) n.parentNode.removeChild(n);
    this.childNodes.push(n);
    n.parentNode = this;
    return n;
  }
  removeChild(n) {
    this.childNodes.splice(this.childNodes.indexOf(n), 1);
    n.parentNode = null;
    return n;
  }
}

class FakeText extends FakeNode {
  constructor(doc, data) {
    super(doc);
    this.data = data;
  }
  get outerHTML() {
    return esc(this.data);
  }
}

class FakeElement extends FakeNode {
  constructor(doc, tag) {
    super(doc);
    this.tagName = tag.toUpperCase();
    this.attributes = new Map();
  }
  set className(v) {
    this.setAttribute('class', v);
  }
  get className() {
    return this.getAttribute('class') || '';
  }
  setAttribute(k, v) {
    this.attributes.set(k, String(v));
  }
  getAttribute(k) {
    return this.attributes.has(k) ? this.attributes.get(k) : null;
  }
  removeAttribute(k) {
    this.attributes.delete(k);
  }
  hasAttribute(k) {
    return this.attributes.has(k);
  }
  get innerHTML() {
    return this.childNodes.map((c) => c.outerHTML).join('');
  }
  get outerHTML() {
    const tag = this.tagName.toLowerCase();
    const attrs = [...this.attributes].map(([k, v]) => ` ${k}="${esc(v).replace(/"/g, '&quot;')}"`).join('');
    return tag === 'br' ? `<br${attrs}>` : `<${tag}${attrs}>${this.innerHTML}</${tag}>`;
  }
}

/** A document with createElement, createTextNode and a documentElement. */
export function fakeDocument() {
  const doc = {
    createElement: (tag) => new FakeElement(doc, tag),
    createTextNode: (data) => new FakeText(doc, data),
  };
  doc.documentElement = new FakeElement(doc, 'html');
  return doc;
}
