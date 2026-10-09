// Words by id (GAME_DESIGN 18.3; BUILD_PLAN 2.2, 10.3). The build fills the
// shell's words; JS asks for the rest here. Preview's bundle carries the
// working words and each line's state, for the debug marks; main's carries
// approved words only. drawText (pictures) arrives with the pixel font's atlas.
//
// A line's words hold {vars} in braces, {UPPER} placeholders, one markup,
// *emphasis*, and \n for a line break; never HTML. renderParts turns them
// into parts, and the build's fill (tools/text.mjs) uses the same function,
// so the first paint and a later tx() agree.

/** @type {Record<string, string | {one: string, other: string}>} */
let words = {};
/** @type {Record<string, string>} */
let marks = {};
/** @type {string | null} */
let channelSet = null;

const MODES = ['on', 'drafts', 'off'];
const PLACEHOLDER = /^[A-Z][A-Z0-9_]*$/;

/** The channel the build stamped on <html>: 'main', 'preview', or 'dev' (web/ unbuilt). */
function channel() {
  if (channelSet) return channelSet;
  if (typeof document === 'undefined') return 'main';
  return document.documentElement.dataset.channel || 'main';
}

/** Main hides what it can't say; preview and dev show it, marked. */
function showsDrafts() {
  return channel() !== 'main';
}

/** Feed a bundle directly (tests, and loadText). */
export function setBundle(w, m = {}, ch = null) {
  words = { ...w };
  marks = { ...m };
  channelSet = ch;
}

/**
 * Fetch the channel's words (and, on preview, the marks). Never throws: a
 * failed fetch leaves t() showing ids on preview and nothing on main.
 * @param {URL | string} [base]
 * @returns {Promise<{ok: boolean}>}
 */
export async function loadText(base = new URL('../text/', import.meta.url)) {
  try {
    const res = await fetch(new URL('en.json', base));
    if (!res.ok) throw new Error(`text: en.json ${res.status}`);
    const w = await res.json();
    let m = {};
    if (showsDrafts()) {
      const mr = await fetch(new URL('marks.json', base));
      if (mr.ok) m = await mr.json();
    }
    words = w;
    marks = m;
    return { ok: true };
  } catch (err) {
    console.warn('text: no words loaded', err);
    return { ok: false };
  }
}

/** Pick a plural form: one when vars.n is 1, else other. */
function pick(w, vars) {
  if (typeof w === 'string') return w;
  return vars && vars.n === 1 ? w.one : w.other;
}

function fill(s, vars) {
  return s.replace(/\{([a-z][a-z0-9_]*)\}/g, (m, k) => (vars && Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m));
}

/**
 * Pure: the parts of a line's words, {vars} filled after the markup is
 * read (so a var's value can never add markup). Parts are {text}, {em},
 * {ph} for an {UPPER} placeholder, and {br: true}.
 * @param {string} s
 * @param {Record<string, unknown>} [vars]
 */
export function renderParts(s, vars) {
  const out = [];
  String(s)
    .split('\n')
    .forEach((row, i) => {
      if (i) out.push({ br: true });
      row.split(/(\*[^*\n]+\*)/).forEach((chunk) => {
        if (!chunk) return;
        if (chunk.length > 2 && chunk[0] === '*' && chunk[chunk.length - 1] === '*') {
          out.push({ em: fill(chunk.slice(1, -1), vars) });
          return;
        }
        chunk.split(/(\{[A-Z][A-Z0-9_]*\})/).forEach((bit) => {
          if (!bit) return;
          if (bit[0] === '{' && PLACEHOLDER.test(bit.slice(1, -1))) out.push({ ph: bit });
          else out.push({ text: fill(bit, vars) });
        });
      });
    });
  return out;
}

/** Plain text from parts: markup dropped, line breaks kept. */
export function plainText(parts) {
  return parts.map((p) => (p.br ? '\n' : p.em ?? p.ph ?? p.text)).join('');
}

/** What a missing id shows: ⟦id⟧ on preview, nothing on main. */
function missing(id) {
  console.warn(`text: no line ${id}`);
  return showsDrafts() ? `⟦${id}⟧` : '';
}

/**
 * The words for an id, {vars} filled, as plain text (the *emphasis* marks
 * dropped, \n kept). A missing id gives ⟦id⟧ on preview and '' on main.
 * @param {string} id
 * @param {Record<string, unknown>} [vars]
 */
export function t(id, vars) {
  const w = words[id];
  if (w === undefined) return missing(id);
  return plainText(renderParts(pick(w, vars), vars));
}

/**
 * The state of an id for the marks: the bundle's state on preview, or
 * 'approved'; 'missing' when the id isn't defined. Main: always 'approved'.
 * @param {string} id
 */
export function lineState(id) {
  if (!showsDrafts()) return 'approved';
  if (words[id] === undefined) return 'missing';
  return marks[id] || 'approved';
}

/**
 * Set an element's words by id: text nodes, <br> for \n, <em> for *x*,
 * never innerHTML. Tags the element with data-t, and on preview with
 * data-t-state when the line isn't approved. Returns the element.
 * @param {HTMLElement} el
 * @param {string} id
 * @param {Record<string, unknown>} [vars]
 */
export function tx(el, id, vars) {
  const doc = el.ownerDocument;
  const w = words[id];
  const state = lineState(id);
  const nodes = [];
  if (w === undefined) {
    nodes.push(doc.createTextNode(missing(id)));
  } else {
    for (const p of renderParts(pick(w, vars), vars)) {
      if (p.br) nodes.push(doc.createElement('br'));
      else if (p.em !== undefined) {
        const em = doc.createElement('em');
        em.appendChild(doc.createTextNode(p.em));
        nodes.push(em);
      } else if (p.ph !== undefined && showsDrafts()) {
        const span = doc.createElement('span');
        span.className = 't-ph';
        span.appendChild(doc.createTextNode(p.ph));
        nodes.push(span);
      } else nodes.push(doc.createTextNode(p.ph ?? p.text));
    }
  }
  while (el.firstChild) el.removeChild(el.firstChild);
  for (const n of nodes) el.appendChild(n);
  el.setAttribute('data-t', id);
  if (showsDrafts() && state !== 'approved') el.setAttribute('data-t-state', state);
  else el.removeAttribute('data-t-state');
  return el;
}

/**
 * Preview's debug marks (GAME_DESIGN 18.6): 'on' marks drafts, changed and
 * cut lines; 'drafts' marks drafts only; 'off' none. Sets <html data-marks>.
 * A no-op on main, which has nothing to mark.
 * @param {Document} doc
 * @param {'on' | 'drafts' | 'off'} mode
 */
export function setMarks(doc, mode) {
  if (!showsDrafts()) return false;
  if (!MODES.includes(mode)) throw new Error(`text: no marks mode "${mode}"`);
  doc.documentElement.setAttribute('data-marks', mode);
  return true;
}
