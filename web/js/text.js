// Words by id (GAME_DESIGN 18.3; BUILD_PLAN 2.2, 10.3). The build fills the
// shell's words; JS asks for the rest here. Preview's bundle carries the
// working words and each line's state, for the debug marks; main's carries
// approved words only. drawText (pictures) arrives with the pixel font's atlas.
//
// A line's words hold {vars} in braces, {UPPER} placeholders, one markup,
// *emphasis*, and \n for a line break; never HTML. renderParts turns them
// into parts, and the build's fill (tools/text.mjs) uses the same function,
// so the first paint and a later tx() agree.
//
// The engine hands the UI lines as refs, {id, vars}, never words (BUILD_PLAN
// 2.3; S3). A var whose value is itself a ref renders as that line's words,
// one level deep, so {place} can be a place-name line later; t() and tx()
// resolve such vars before renderParts, which stays pure.
//
// A number's format (a fmt.* line, E.12: "{ft} ft", "mi {mi}"; web/js/fmt.js
// hands them over as refs) is one unit on the page: wherever it shows, as a
// var or by its own id, its spaces render as no-break spaces, so a caption
// never breaks 4,900 from its ft. The words themselves keep plain spaces.
//
// A line's own separator, " · " (the caption's Day 1 · Deer Lake · 4,780
// ft), renders as " ·" and a no-break space (S6): the dot travels with what
// follows it, so a row breaks before a separator and never after it, and
// never hangs a " ·" at a row's end. One rule in renderParts, so the
// build's first paint, a later tx() and T15's count (one code point for
// one) agree.
//
// measure() is a line's length against its max (S5): lint T15 and the
// build's text/meta.json (preview's line inspector) both use it, so the
// number the inspector shows is the one the lint checks.

/** @type {Record<string, string | {one: string, other: string}>} */
let words = {};
/** @type {Record<string, string>} */
let marks = {};
/** @type {string | null} */
let channelSet = null;

const MODES = ['on', 'drafts', 'off'];
const PLACEHOLDER = /^[A-Z][A-Z0-9_]*$/;
/** The no-break space a number's format binds its number and unit with. */
export const NBSP = '\u00a0';
/**
 * A tally's words, each bound to its number: a space before a digit becomes
 * a no-break space, so a row never ends on a word whose number starts the
 * next (the Why sheet's legend: "fail 35", never "fail" and then "35").
 * @param {string} s
 */
export const bindNumbers = (s) => s.replace(/ (?=\d)/g, NBSP);
/** A line's separator as written, and as shown: the dot bound to what follows. */
export const SEP = ' · ';
export const SEP_SHOWN = ` ·${NBSP}`;

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

/** @typedef {string | {one: string, other: string}} Words a line's words, or its plural forms */
/** @typedef {{text?: string, em?: string, ph?: string, br?: boolean}} Part */

/**
 * Feed a bundle directly (tests, and loadText).
 * @param {Record<string, Words>} w
 * @param {Record<string, string>} [m]
 * @param {string | null} [ch]
 */
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
    /** @type {Record<string, string>} */
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

/**
 * Pick a plural form: one when vars.n is 1, else other.
 * @param {Words} w
 * @param {Record<string, unknown>} [vars]
 */
function pick(w, vars) {
  if (typeof w === 'string') return w;
  return vars && vars.n === 1 ? w.one : w.other;
}

/** @typedef {{id: string, vars?: Record<string, unknown>}} Ref a line by id, as the engine gives it */

/**
 * Is a var's value a ref to another line?
 * @param {unknown} v
 * @returns {v is Ref}
 */
export function isRef(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v) && typeof (/** @type {any} */ (v).id) === 'string';
}

/**
 * A line's parts as the page shows them: a number's format (fmt.*) binds
 * its words with no-break spaces; any other line's are as written.
 * @param {string} id
 * @param {Part[]} parts
 * @returns {Part[]}
 */
function shown(id, parts) {
  if (!id.startsWith('fmt.')) return parts;
  return parts.map((p) => {
    const q = { ...p };
    if (q.text !== undefined) q.text = q.text.replace(/ /g, NBSP);
    if (q.em !== undefined) q.em = q.em.replace(/ /g, NBSP);
    return q;
  });
}

/**
 * Vars with each ref value turned into its line's plain words, one level
 * deep: a ref inside a ref's own vars renders as a missing line.
 * @param {Record<string, unknown> | undefined} vars
 * @param {number} [depth]
 * @returns {Record<string, unknown> | undefined}
 */
function resolveVars(vars, depth = 0) {
  if (!vars || !Object.values(vars).some(isRef)) return vars;
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [k, v] of Object.entries(vars)) {
    if (!isRef(v)) out[k] = v;
    else if (depth > 0 || words[v.id] === undefined) out[k] = missing(v.id);
    else {
      const inner = resolveVars(v.vars, depth + 1);
      out[k] = plainText(shown(v.id, renderParts(pick(words[v.id], inner), inner)));
    }
  }
  return out;
}

/**
 * @param {string} s
 * @param {Record<string, unknown>} [vars]
 */
function fill(s, vars) {
  return s.replace(/\{([a-z][a-z0-9_]*)\}/g, (/** @type {string} */ m, /** @type {string} */ k) => (vars && Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m));
}

/** A line's own separators, bound to what follows (a var's value is left as it is). @param {string} s */
const bindSeps = (s) => s.split(SEP).join(SEP_SHOWN);

/**
 * Pure: the parts of a line's words, {vars} filled after the markup is
 * read (so a var's value can never add markup), and its own " · "
 * separators bound to what follows them. Parts are {text}, {em}, {ph} for
 * an {UPPER} placeholder, and {br: true}.
 * @param {string} s
 * @param {Record<string, unknown>} [vars]
 * @returns {Part[]}
 */
export function renderParts(s, vars) {
  /** @type {Part[]} */
  const out = [];
  String(s)
    .split('\n')
    .forEach((row, i) => {
      if (i) out.push({ br: true });
      row.split(/(\*[^*\n]+\*)/).forEach((chunk) => {
        if (!chunk) return;
        if (chunk.length > 2 && chunk[0] === '*' && chunk[chunk.length - 1] === '*') {
          out.push({ em: fill(bindSeps(chunk.slice(1, -1)), vars) });
          return;
        }
        chunk.split(/(\{[A-Z][A-Z0-9_]*\})/).forEach((bit) => {
          if (!bit) return;
          if (bit[0] === '{' && PLACEHOLDER.test(bit.slice(1, -1))) out.push({ ph: bit });
          else out.push({ text: fill(bindSeps(bit), vars) });
        });
      });
    });
  return out;
}

/**
 * Plain text from parts: markup dropped, line breaks kept.
 * @param {Part[]} parts
 */
export function plainText(parts) {
  return parts.map((p) => (p.br ? '\n' : p.em ?? p.ph ?? p.text)).join('');
}

/**
 * Pure: a line's length, as lint T15 holds it to its max (BUILD_PLAN 10.5,
 * S5) and the line inspector shows it: for each form (a plural's each), the
 * code points of its plain words (the *emphasis* marks dropped, a line
 * break counted as 1), each {var} counted at its width and each
 * {PLACEHOLDER} at its own (content/text/vars.json, flattened: {day: 2,
 * place: 21, ...}). The longest form's length; NaN when a {var} or a
 * {PLACEHOLDER} has no width.
 * @param {Words} w
 * @param {Record<string, number>} widths
 */
export function measure(w, widths) {
  const width = (/** @type {string} */ k) => (Object.prototype.hasOwnProperty.call(widths, k) && Number.isInteger(widths[k]) ? widths[k] : NaN);
  const count = (/** @type {string} */ s) =>
    s.split(/(\{[a-z][a-z0-9_]*\})/).reduce((n, bit) => n + (/^\{[a-z][a-z0-9_]*\}$/.test(bit) ? width(bit.slice(1, -1)) : Array.from(bit).length), 0);
  let most = 0;
  for (const form of typeof w === 'string' ? [w] : [w.one, w.other]) {
    let n = 0;
    for (const p of renderParts(form)) n += p.br ? 1 : p.ph !== undefined ? width(p.ph.slice(1, -1)) : count(p.em ?? p.text ?? '');
    if (Number.isNaN(n)) return NaN;
    most = Math.max(most, n);
  }
  return most;
}

/**
 * The working words of a line, as the bundle has them (a string, or a
 * plural's forms), with their {vars} unfilled; undefined when the id isn't
 * there. For the line inspector (ui/inspect.js), which copies them for chat.
 * @param {string} id
 * @returns {Words | undefined}
 */
export function wordsOf(id) {
  return words[id];
}

/**
 * What a missing id shows: ⟦id⟧ on preview, nothing on main.
 * @param {string} id
 */
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
  const v = resolveVars(vars);
  return plainText(shown(id, renderParts(pick(w, v), v)));
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
    const v = resolveVars(vars);
    for (const p of shown(id, renderParts(pick(w, v), v))) {
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
      } else nodes.push(doc.createTextNode(p.ph ?? p.text ?? ''));
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
