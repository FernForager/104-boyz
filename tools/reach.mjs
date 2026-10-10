// What a built page can load (GAME_DESIGN E.7; BUILD_PLAN 2.2, S5): the
// files a channel's service worker precaches (tools/build.mjs step 6), so an
// installed app downloads what its page can use and nothing it never loads
// (main ships S5's fonts, sound and trail modules for file parity, and never
// loads one). From the built index.html it follows
//
//   - every src and href the page names: its scripts, stylesheets, icons,
//     the preloaded font and module, and the manifest;
//   - the manifest's icons (and its start_url, the page itself);
//   - a stylesheet's url()s and @imports;
//   - a module's imports, static and dynamic, and the files it names with
//     new URL('<path>', import.meta.url): a file (data, art, a worklet, a
//     stylesheet it links), or, for a folder, every file the build ships
//     directly in it (the module fetches them by name: data/, text/); never
//     the site's root, which a module names as its scope, not to fetch it.
//
// A dynamic import that runs only on some screens says so at the end of its
// line, `// screens: guestbook trail`: it counts only when the page's
// <html data-screens> lists every one of them. Main's page lists neither the
// trail nor the map, so it never reaches the game, the map or the inspector.
// A dynamic import needs a literal path, a file a page names must ship, and
// a module loads a file of the site only by a path the list can read: a
// fetch, a worklet or a worker, an element's src or href, or a FontFace's
// url() given a plain string (not a new URL(..., import.meta.url)) is an
// error, as each of the others is, so the list can't silently miss what a
// page loads.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';
import { parseHtml, walk, getAttr } from './html.mjs';
import { scanJs } from './textlint.mjs';

/** The page every channel opens at. */
export const PAGE = 'index.html';
/** The end-of-line note that gates a dynamic import on the page's screens. */
export const SCREENS_NOTE = /\/\/\s*screens:\s*([a-z][a-z0-9_]*(?:\s+[a-z][a-z0-9_]*)*)\s*$/;

/** A reference that stays on the site: not a scheme, a protocol-relative URL, a fragment or a data: URL. */
const local = (/** @type {string} */ ref) => Boolean(ref) && !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref);

/**
 * A reference resolved against the file that makes it, as a path under the
 * build ('' is the site's root; a folder keeps its trailing /).
 * @param {string} from the referring file's path
 * @param {string} ref
 */
export function resolveRef(from, ref) {
  const bare = ref.replace(/[?#].*$/s, '');
  const folder = bare === '' || bare.endsWith('/') || bare === '.' || bare === '..';
  const p = posix.normalize(posix.join(posix.dirname(from), bare));
  if (p === '.' || p === './') return '';
  if (p.startsWith('../') || p === '..') return null; // off the site
  const rel = p.replace(/^\.\//, '');
  return folder ? `${rel.replace(/\/$/, '')}/` : rel;
}

/**
 * The loads that take a plain string, which the list can't follow: a
 * fetch, a worklet, a worker, an element's src or href (assigned or set),
 * a FontFace's url(). Each pattern ends at the string's opening quote.
 */
const PLAIN_LOADS = [
  /\b(?:fetch|addModule|importScripts)\s*\(\s*(?=['"`])/g,
  /\bnew\s+(?:Shared)?Worker\s*\(\s*(?=['"`])/g,
  /\.\s*(?:src|href)\s*=\s*(?=['"`])/g,
  /\bsetAttribute\s*\(\s*(['"])(?:src|href)\1\s*,\s*(?=['"`])/g,
  /\bnew\s+FontFace\s*\([^,()]*,\s*(?=['"`])/g,
];

/**
 * The references in a module's code: [{ref, kind, line, screens}], kind
 * 'import' (static), 'dynamic' or 'url' (new URL(..., import.meta.url));
 * screens: a dynamic import's `// screens:` note, or null. Comments never
 * count. A dynamic import without a literal path is reported as kind 'bad';
 * a load of a file of the site by a plain string (PLAIN_LOADS: its text up
 * to any ${...}, or a FontFace's url() in it) as kind 'plain'.
 * @param {string} src
 */
export function moduleRefs(src) {
  const code = scanJs(src).code0;
  const rows = src.split('\n');
  const lineOf = (/** @type {number} */ at) => code.slice(0, at).split('\n').length;
  const out = [];
  for (const m of code.matchAll(/(?:^|[;}\s])(?:import|export)\s+(?:[^'";]*?\sfrom\s*)?(['"])([^'"\n]+)\1/g)) out.push({ ref: m[2], kind: 'import', line: lineOf(/** @type {number} */ (m.index)), screens: null });
  for (const m of code.matchAll(/\bimport\s*\(/g)) {
    const at = /** @type {number} */ (m.index);
    const line = lineOf(at);
    const lit = /^\s*(['"])([^'"\n]+)\1\s*\)/.exec(code.slice(at + m[0].length));
    const note = SCREENS_NOTE.exec(rows[line - 1] || '');
    if (!lit) out.push({ ref: null, kind: 'bad', line, screens: null });
    else out.push({ ref: lit[2], kind: 'dynamic', line, screens: note ? note[1].split(/\s+/) : null });
  }
  for (const m of code.matchAll(/\bnew\s+URL\(\s*(['"])([^'"\n]*)\1\s*,\s*import\.meta\.url\s*\)/g)) out.push({ ref: m[2], kind: 'url', line: lineOf(/** @type {number} */ (m.index)), screens: null });
  for (const re of PLAIN_LOADS) {
    for (const m of code.matchAll(re)) {
      const at = /** @type {number} */ (m.index) + m[0].length;
      const lit = /^(?:'([^'\n]*)'|"([^"\n]*)"|`([^`$]*))/.exec(code.slice(at));
      const text = lit ? (lit[1] ?? lit[2] ?? lit[3]) : '';
      const font = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))/.exec(text);
      const ref = font ? (font[1] ?? font[2] ?? font[3]) : text;
      if (local(ref)) out.push({ ref, kind: 'plain', line: lineOf(at), screens: null });
    }
  }
  return out.sort((a, b) => a.line - b.line);
}

/**
 * The references in a stylesheet: its url()s and @imports, comments aside.
 * @param {string} src
 * @returns {string[]}
 */
export function cssRefs(src) {
  const css = src.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  for (const m of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)/g)) out.push(m[1] ?? m[2] ?? m[3]);
  for (const m of css.matchAll(/@import\s+(?:"([^"]*)"|'([^']*)')/g)) out.push(m[1] ?? m[2]);
  return out;
}

/** Every file directly in a folder of the build, sorted. */
function filesIn(dir, folder) {
  const abs = join(dir, folder);
  if (!existsSync(abs) || !statSync(abs).isDirectory()) return null;
  return readdirSync(abs)
    .sort()
    .filter((n) => statSync(join(abs, n)).isFile())
    .map((n) => `${folder}${n}`);
}

/**
 * What the built page in dir can load: its files, sorted (the page first
 * among them by name only), and every gated dynamic import with whether
 * this page takes it. Throws on a reference to a file the build doesn't
 * ship, or a dynamic import without a literal path.
 * @param {string} dir a built channel (dist/<channel>/)
 * @returns {{screens: string[], files: string[], gated: {from: string, ref: string, screens: string[], taken: boolean}[]}}
 */
export function pageReach(dir) {
  const html = readFileSync(join(dir, PAGE), 'utf8');
  const stamp = /<html\b[^>]*\sdata-screens="([^"]*)"/.exec(html);
  const screens = stamp ? stamp[1].split(/\s+/).filter(Boolean) : [];
  const seen = new Set();
  const errors = [];
  const gated = [];
  const queue = [PAGE];
  /** @param {string} from @param {string} ref */
  const add = (from, ref) => {
    if (!local(ref)) return;
    const p = resolveRef(from, ref);
    if (p === null) errors.push(`${from} names ${ref}, off the site`);
    else if (p === '') return; // the root: a module's scope, or the manifest's start, which is the page
    else if (p.endsWith('/')) {
      const files = filesIn(dir, p);
      if (!files) errors.push(`${from} names the folder ${ref}, which the build doesn't ship`);
      else queue.push(...files);
    } else if (!existsSync(join(dir, p))) errors.push(`${from} names ${ref}, which the build doesn't ship`);
    else queue.push(p);
  };
  while (queue.length) {
    const f = /** @type {string} */ (queue.shift());
    if (seen.has(f)) continue;
    seen.add(f);
    const ext = posix.extname(f);
    if (f === PAGE || ext === '.html') {
      walk(parseHtml(readFileSync(join(dir, f), 'utf8')), (n) => {
        if (n.type !== 'element') return;
        for (const a of ['src', 'href']) {
          const v = getAttr(n, a);
          if (v) add(f, v);
        }
      });
    } else if (ext === '.webmanifest') {
      const m = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      for (const icon of [...(m.icons || []), ...(m.screenshots || [])]) if (icon && icon.src) add(f, icon.src);
      if (m.start_url) add(f, m.start_url);
    } else if (ext === '.css') {
      for (const ref of cssRefs(readFileSync(join(dir, f), 'utf8'))) add(f, ref);
    } else if (ext === '.js' || ext === '.mjs') {
      for (const r of moduleRefs(readFileSync(join(dir, f), 'utf8'))) {
        if (r.kind === 'bad') {
          errors.push(`${f}:${r.line}: a dynamic import needs a literal path, so the precache can see what it loads`);
          continue;
        }
        if (r.kind === 'plain') {
          errors.push(`${f}:${r.line}: ${r.ref} is loaded by a plain string; name it with new URL('${r.ref}', import.meta.url), so the precache can see it`);
          continue;
        }
        const ref = /** @type {string} */ (r.ref);
        if (r.screens) {
          const taken = r.screens.every((s) => screens.includes(s));
          gated.push({ from: f, ref, screens: r.screens, taken });
          if (!taken) continue;
        }
        add(f, ref);
      }
    }
  }
  if (errors.length) throw new Error(`reach: ${PAGE}'s files:\n  ${[...new Set(errors)].join('\n  ')}`);
  return { screens, files: [...seen].sort(), gated };
}
