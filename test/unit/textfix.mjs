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
 * @param {{places?: Record<string, any>, not_places?: Record<string, any>, terms?: Record<string, any>}} [o.names] the gazetteer and the terms, by bare id (S4)
 */
export function fakeText({ lines = {}, approved = {}, cut = {}, off = {}, screens = ['app', 'title'], mainScreens, swap, allow = {}, answers = {}, names = {} } = {}) {
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
    names: {
      places: new Map(Object.entries(names.places || {}).map(([id, x]) => [`place.${id}`, { ...x, id: `place.${id}`, file: 'content/text/names/places.json' }])),
      notPlaces: new Map(Object.entries(names.not_places || {}).map(([id, x]) => [`place.${id}`, { ...x, id: `place.${id}`, file: 'content/text/names/places.json' }])),
      terms: new Map(Object.entries(names.terms || {}).map(([id, x]) => [`term.${id}`, { ...x, id: `term.${id}`, file: 'content/text/names/terms.json' }])),
    },
  };
}

/** A page for the fill, with the build's placeholders. */
export const page = (body, head = '') => `<!doctype html>\n<html lang="en" data-build="dev" data-channel="dev" data-commit="dev" data-rules="dev" data-screens="dev">\n<head>${head}</head>\n<body>${body}</body>\n</html>\n`;

/** The <body> of a filled page. */
export const bodyOf = (html) => html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));

// ---- A tiny DOM, enough for tx() and the game's screens ------------------

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
  insertBefore(n, ref) {
    if (!ref) return this.appendChild(n);
    if (n.parentNode) n.parentNode.removeChild(n);
    this.childNodes.splice(this.childNodes.indexOf(ref), 0, n);
    n.parentNode = this;
    return n;
  }
  contains(n) {
    for (let at = n; at; at = at.parentNode) if (at === this) return true;
    return false;
  }
  get textContent() {
    return this.childNodes.map((c) => c.textContent).join('');
  }
}

class FakeText extends FakeNode {
  constructor(doc, data) {
    super(doc);
    this.data = data;
  }
  get nodeType() {
    return 3;
  }
  get outerHTML() {
    return esc(this.data);
  }
  get textContent() {
    return this.data;
  }
}

/** data-* attributes as a dataset (camelCase keys), as the DOM gives them. */
function dataset(el) {
  const attr = (k) => `data-${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
  return new Proxy(
    {},
    {
      get: (_, k) => (typeof k === 'string' ? (el.getAttribute(attr(k)) ?? undefined) : undefined),
      set: (_, k, v) => {
        el.setAttribute(attr(String(k)), v);
        return true;
      },
    },
  );
}

class FakeElement extends FakeNode {
  constructor(doc, tag) {
    super(doc);
    this.tagName = tag.toUpperCase();
    this.attributes = new Map();
    this.listeners = new Map();
    this.value = '';
    this.dataset = dataset(this);
    this.focused = 0;
    const props = new Map();
    this.style = {
      setProperty: (k, v) => props.set(k, String(v)),
      removeProperty: (k) => props.delete(k),
      getPropertyValue: (k) => props.get(k) ?? '',
    };
    const el = this;
    this.classList = {
      add: (...cs) => el.setAttribute('class', [...new Set([...el.className.split(' ').filter(Boolean), ...cs])].join(' ')),
      remove: (...cs) => el.setAttribute('class', el.className.split(' ').filter((c) => c && !cs.includes(c)).join(' ')),
      contains: (c) => el.className.split(' ').includes(c),
    };
  }
  get nodeType() {
    return 1;
  }
  set className(v) {
    this.setAttribute('class', v);
  }
  get className() {
    return this.getAttribute('class') || '';
  }
  set id(v) {
    this.setAttribute('id', v);
  }
  get id() {
    return this.getAttribute('id') || '';
  }
  set disabled(v) {
    if (v) this.setAttribute('disabled', '');
    else this.removeAttribute('disabled');
  }
  get disabled() {
    return this.hasAttribute('disabled');
  }
  set hidden(v) {
    if (v) this.setAttribute('hidden', '');
    else this.removeAttribute('hidden');
  }
  get hidden() {
    return this.hasAttribute('hidden');
  }
  set textContent(v) {
    while (this.firstChild) this.removeChild(this.firstChild);
    this.appendChild(new FakeText(this.ownerDocument, String(v)));
  }
  get textContent() {
    return super.textContent;
  }
  get children() {
    return this.childNodes.filter((c) => c instanceof FakeElement);
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
  addEventListener(type, f) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(f);
  }
  removeEventListener(type, f) {
    const list = this.listeners.get(type) || [];
    if (list.includes(f)) list.splice(list.indexOf(f), 1);
  }
  /** Fire an event's listeners (an object with at least {type}). */
  dispatchEvent(event) {
    const e = { target: this, preventDefault() {}, ...event };
    for (const f of [...(this.listeners.get(e.type) || [])]) f(e);
    return true;
  }
  /** A click, as a tap gives it: nothing happens on a disabled button. */
  click() {
    if (this.disabled) return;
    this.dispatchEvent({ type: 'click' });
  }
  focus() {
    this.focused++;
    this.ownerDocument.activeElement = this;
  }
  blur() {
    if (this.ownerDocument.activeElement === this) this.ownerDocument.activeElement = null;
  }
  scrollIntoView() {}
  /** Every element under this one, in document order. */
  descendants() {
    return this.children.flatMap((c) => [c, ...c.descendants()]);
  }
  /** One simple selector: tag, .class, #id, or tag.class, or [attr]. */
  matches(sel) {
    const m = /^([a-z]+)?(?:#([\w-]+))?((?:\.[\w-]+)*)(?:\[([\w-]+)\])?$/.exec(sel);
    if (!m) throw new Error(`fake DOM: no selector ${sel}`);
    const [, tag, id, cls, attr] = m;
    if (tag && this.tagName !== tag.toUpperCase()) return false;
    if (id && this.id !== id) return false;
    if (attr && !this.hasAttribute(attr)) return false;
    return cls.split('.').filter(Boolean).every((c) => this.classList.contains(c));
  }
  /** Descendant selectors of simple parts ('.a .b'). */
  querySelectorAll(sel) {
    const parts = sel.trim().split(/\s+/);
    let found = [this];
    for (const part of parts) found = [...new Set(found.flatMap((n) => n.descendants().filter((d) => d.matches(part))))];
    return found;
  }
  querySelector(sel) {
    return this.querySelectorAll(sel)[0] || null;
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

/** A document with createElement, createTextNode, a documentElement and a body. */
export function fakeDocument() {
  const doc = {
    createElement: (tag) => new FakeElement(doc, tag),
    createTextNode: (data) => new FakeText(doc, data),
    activeElement: null,
    listeners: new Map(),
    getElementById: (id) => doc.documentElement.querySelector(`#${id}`),
    querySelector: (sel) => doc.documentElement.querySelector(sel),
    querySelectorAll: (sel) => doc.documentElement.querySelectorAll(sel),
    addEventListener(type, f) {
      if (!doc.listeners.has(type)) doc.listeners.set(type, []);
      doc.listeners.get(type).push(f);
    },
    removeEventListener(type, f) {
      const list = doc.listeners.get(type) || [];
      if (list.includes(f)) list.splice(list.indexOf(f), 1);
    },
  };
  doc.documentElement = new FakeElement(doc, 'html');
  doc.body = doc.documentElement.appendChild(new FakeElement(doc, 'body'));
  return doc;
}
