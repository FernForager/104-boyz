// The boot guard (GAME_DESIGN E.11; BUILD_PLAN 2.2): the game never
// white-screens. The shell loads this module before main.js, and it imports
// nothing, so it runs even when one of main.js's imports can't be fetched,
// parsed or linked on the phone and nothing of main.js runs at all. Until
// errors.js takes over (installErrors, the first thing main.js does), it
// keeps every script error and rejection, opens the static error sheet and
// runs its two buttons: Copy bug report copies a short report (the build,
// the channel, device facts and the errors), and Restart restarts into the
// newest build, asking the worker for an update as the sheet opens.
// errors.js then takes what it kept and the sheet is its own; both Restarts
// use restart() below, and errors.js uses scrub() for every URL.
//
// The short report holds no personal data, as the full one: every URL in an
// error is cut to its path inside the site (or, off the site, to its scheme
// alone), with no query or hash; no language, time zone or address.

const KEEP = 10;
/** What a kept message or stack holds at most in the short report. */
const CUT = 2000;
/** Restart reloads anyway after this long, if the new worker never takes over. */
const RESTART_SAFETY_MS = 3000;
/** How long the ✓ shows after a copy. */
const DONE_MS = 2000;
/** The site's root (the shell is one folder up from here). */
const SITE = new URL('../', import.meta.url).href;
/** A URL: a short scheme, ://, and no spaces, quotes or parentheses. Bounded, so a long stack can't make it slow. */
const URL_RE = /\b[a-z][a-z0-9+.-]{0,31}:\/\/[^\s)'"]+/gi;

/** @typedef {{error: unknown, filename?: string, lineno?: number, colno?: number, ms: number}} Kept */

/** @type {Kept[]} */
let kept = [];
let taken = false;
let restarting = false;

const now = () => (typeof performance !== 'undefined' ? Math.round(performance.now()) : 0);

/**
 * A URL as a report may hold it: a path inside the site, with no query or
 * hash; anywhere else, its scheme alone.
 * @param {string} url
 * @param {string} [base] the site's root
 */
export function sitePath(url, base = SITE) {
  const bare = String(url).replace(/[?#].*$/s, '');
  if (bare.startsWith(base)) return bare.slice(base.length);
  const m = /^([a-z][a-z0-9+.-]*:)/i.exec(bare);
  return m ? m[1] : bare;
}

/**
 * Every URL in a message or stack, cut down as sitePath does, keeping a
 * frame's :line:col.
 * @param {unknown} s
 * @param {string} [base]
 */
export function scrub(s, base = SITE) {
  return String(s).replace(URL_RE, (u) => {
    const m = /^(.*?)((?::\d+){1,2})$/.exec(u);
    return m ? `${sitePath(m[1], base)}${m[2]}` : sitePath(u, base);
  });
}

/**
 * Restart into the newest build (the update note's Restart, E.7, and the
 * error sheet's, E.11): a worker of ours that waits takes over first, and
 * the page reloads once it controls the page; with none waiting, a reload,
 * which also has the browser check for a new worker. Nothing is lost: the
 * game saves at every tap (ui/app.js, from S3), so the reload comes back to
 * the autosaved screen.
 * @param {any} [win]
 */
export function restart(win = globalThis.window) {
  if (restarting || !win) return;
  restarting = true;
  const reload = () => win.location.reload();
  win.setTimeout(reload, RESTART_SAFETY_MS);
  ours(win).then((reg) => {
    if (!reg || !reg.waiting) return reload();
    win.navigator.serviceWorker.addEventListener('controllerchange', reload);
    return reg.waiting.postMessage({ type: 'skip-waiting' });
  }, reload);
}

/**
 * This channel's worker registration, or null. Ours only: on a first visit
 * to preview/, main's registration (scope /) would answer.
 * @param {any} win
 * @returns {Promise<any>}
 */
function ours(win) {
  const sw = win.navigator && win.navigator.serviceWorker;
  if (!sw || typeof sw.getRegistration !== 'function') return Promise.resolve(null);
  return Promise.resolve()
    .then(() => sw.getRegistration(SITE))
    .then((reg) => (reg && reg.scope === SITE ? reg : null));
}

/**
 * errors.js takes over: what was kept so far, oldest first. From now on
 * this guard does nothing.
 * @returns {Kept[]}
 */
export function handOver() {
  taken = true;
  return kept.splice(0);
}

/**
 * Pure: the short report, from the page's facts and the kept errors. The
 * same fields as the full report's, where it has them, and boot: true.
 * @param {{build?: unknown, channel?: unknown, time?: unknown, ua?: unknown, screen?: unknown[], viewport?: unknown[], dpr?: unknown}} f
 * @param {Kept[]} errors
 * @param {string} [base]
 */
export function shortReport(f, errors, base = SITE) {
  const num = (/** @type {unknown} */ v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const str = (/** @type {unknown} */ v) => (v === null || v === undefined ? null : String(v));
  const pair = (/** @type {unknown} */ p) => (Array.isArray(p) ? [num(p[0]), num(p[1])] : [null, null]);
  return {
    report: 1,
    boot: true,
    build: str(f.build),
    channel: str(f.channel),
    time: str(f.time),
    device: { ua: String(f.ua || '').slice(0, CUT), screen: pair(f.screen), viewport: pair(f.viewport), dpr: num(f.dpr) },
    errors: errors.slice(-KEEP).map((k) => {
      const e = /** @type {any} */ (k.error);
      const message = e && typeof e === 'object' && 'message' in e ? `${e.name && e.name !== Error.prototype.name ? `${e.name}: ` : ''}${e.message}` : String(e);
      return {
        message: scrub(message.slice(0, CUT), base),
        stack: scrub(e && typeof e === 'object' && typeof e.stack === 'string' ? e.stack.slice(0, CUT) : '', base),
        source: k.filename ? sitePath(k.filename, base) : null,
        line: num(k.lineno),
        col: num(k.colno),
        ms: num(k.ms),
      };
    }),
  };
}

/**
 * The page's facts for the short report, read at once inside the tap.
 * @param {any} win
 */
function facts(win) {
  const html = win.document.documentElement;
  const scr = win.screen || {};
  return {
    build: html.dataset.build,
    channel: html.dataset.channel,
    time: new Date().toISOString(),
    ua: win.navigator && win.navigator.userAgent,
    screen: [scr.width, scr.height],
    viewport: [win.innerWidth, win.innerHeight],
    dpr: win.devicePixelRatio,
  };
}

/**
 * Copy the short report; if the clipboard refuses, show it selected, and the next tap opens the share sheet.
 * @param {any} win
 * @param {HTMLElement} button
 * @param {any} area the report's textarea
 */
function copyShort(win, button, area) {
  const text = `\`\`\`json\n${JSON.stringify(shortReport(facts(win), kept), null, 1)}\n\`\`\``;
  const nav = win.navigator || {};
  const show = () => {
    area.value = text;
    area.hidden = false;
    button.dataset.mode = 'share';
    try {
      area.focus({ preventScroll: true });
      area.setSelectionRange(0, text.length);
    } catch {
      // nothing to select
    }
  };
  try {
    if (button.dataset.mode === 'share' && typeof nav.share === 'function') nav.share({ text }).catch(() => {});
    else {
      nav.clipboard.writeText(text).then(() => {
        button.classList.add('done');
        win.setTimeout(() => button.classList.remove('done'), DONE_MS);
      }, show);
    }
  } catch {
    show();
  }
}

/**
 * Keep an error and open the sheet, until errors.js takes over. The sheet's
 * buttons are wired the first time it opens.
 * @param {any} win
 * @param {Kept} k
 */
function caught(win, k) {
  if (taken) return;
  kept.push(k);
  if (kept.length > KEEP) kept.shift();
  try {
    const doc = win.document;
    const sheet = doc.getElementById('error-sheet');
    if (!sheet || !sheet.hidden) return;
    const copy = doc.getElementById('error-copy');
    const area = doc.getElementById('error-report');
    const again = doc.getElementById('error-restart');
    if (copy && area) copy.addEventListener('click', () => taken || copyShort(win, copy, area));
    if (again) again.addEventListener('click', () => taken || restart(win));
    sheet.hidden = false;
    if (copy) copy.focus();
    // A fix may be out: have the worker look now, so Restart can take it.
    ours(win)
      .then((reg) => reg && reg.update())
      .catch(() => {}); // offline: the next launch looks again
  } catch {
    // the sheet itself is broken: the static page stays
  }
}

/**
 * Listen for script errors (a script that fails to load, in the capture
 * phase, as its error event doesn't bubble) and rejections, until errors.js
 * takes over. Runs when the module loads in a page; the tests call it with
 * a fake window.
 * @param {any} win
 */
export function guard(win) {
  kept = [];
  taken = false;
  restarting = false;
  win.addEventListener(
    'error',
    (/** @type {any} */ event) => {
      const t = event.target;
      if (t === win || event.error) caught(win, { error: event.error ?? event.message, filename: event.filename, lineno: event.lineno, colno: event.colno, ms: now() });
      else if (t && t.tagName === 'SCRIPT') caught(win, { error: new Error(`boot: ${sitePath(t.src || '')} did not load`), ms: now() });
    },
    true,
  );
  win.addEventListener('unhandledrejection', (/** @type {any} */ event) => caught(win, { error: event.reason, ms: now() }));
}

if (typeof window !== 'undefined' && window.document) guard(window);
