// The app as installed (GAME_DESIGN E.7; BUILD_PLAN 2.5): registers the
// channel's worker, checks for a new build at launch and on every return to
// the foreground, shows the update note and its Restart (on the title page
// until the cabin's mailbox, S7), and the Works offline stamp once the worker
// has every file. A new build never takes over by itself: it waits for
// Restart, so a trip is never swapped mid-stop.

import { noteError } from '../ui/errors.js';
import { restart } from '../boot.js';

/** At most one update check a minute (each return to the foreground asks). */
const CHECK_EVERY_MS = 60 * 1000;

/** @type {{worker: 'unsupported' | 'none' | 'installing' | 'waiting' | 'active', build: string | null, update: boolean, offline: boolean}} */
const status = { worker: 'none', build: null, update: false, offline: false };

/** True when the game runs from the Home Screen, not in a Safari tab. */
export function isInstalled() {
  // iOS sets navigator.standalone; other browsers report display-mode.
  const nav = /** @type {any} */ (globalThis.navigator);
  if (nav && nav.standalone === true) return true;
  return typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches;
}

/**
 * Pure: is there an update to offer? A worker waits, and one already
 * controls the page (on a first visit nothing does, and nothing is new).
 * @param {{controller: unknown, waiting: unknown}} sw
 */
export function updateReady({ controller, waiting }) {
  return Boolean(controller && waiting);
}

/** What the bug report says about the worker. */
export function workerStatus() {
  return { ...status };
}

/**
 * Unhide one of the title page's elements, and let the page refit.
 * @param {Document} doc
 * @param {string} id
 */
function reveal(doc, id) {
  const el = doc.getElementById(id);
  if (!el || !el.hidden) return;
  el.hidden = false;
  const win = doc.defaultView;
  if (win) win.dispatchEvent(new win.Event('oph:layout'));
}

/**
 * The worker's state, from its registration.
 * @param {ServiceWorkerRegistration | null} reg
 */
function note(reg) {
  if (!reg) return;
  status.worker = reg.waiting ? 'waiting' : reg.installing ? 'installing' : reg.active ? 'active' : 'none';
}

/**
 * Ask our active worker which build it is, for the report.
 * @param {ServiceWorker | null} worker
 */
function askStatus(worker) {
  if (!worker || typeof MessageChannel !== 'function') return;
  const ch = new MessageChannel();
  ch.port1.onmessage = (event) => {
    const d = event.data || {};
    if (typeof d.build === 'string') status.build = d.build;
  };
  worker.postMessage({ type: 'status' }, [ch.port2]);
}

/**
 * Register the channel's worker and wire the update note, Restart and the
 * offline stamp. Never throws; returns workerStatus().
 * @param {Document} doc
 * @param {{serviceWorker?: ServiceWorkerContainer}} [nav]
 */
export function startWorker(doc, nav = globalThis.navigator) {
  try {
    const sw = nav && nav.serviceWorker;
    if (!sw) {
      status.worker = 'unsupported';
      return workerStatus();
    }
    // The unbuilt shell (web/, channel "dev") has no worker to register.
    const ch = doc.documentElement.dataset.channel;
    if (ch !== 'main' && ch !== 'preview') return workerStatus();
    const win = doc.defaultView;
    /** @type {ServiceWorkerRegistration | null} */
    let reg = null;
    let lastCheck = -Infinity;

    const showUpdate = () => {
      status.update = true;
      reveal(doc, 'update');
    };
    // Our own worker is active: its install, the whole precache, succeeded.
    // (Not navigator.serviceWorker.ready: on a first visit to /preview/ the
    // page starts out under main's worker, whose scope covers it, and ready
    // would answer for main's.)
    const offline = (/** @type {ServiceWorkerRegistration} */ r) => {
      if (status.offline) return;
      status.offline = true;
      note(r);
      reveal(doc, 'offline');
      askStatus(r.active);
    };
    const whenActive = (/** @type {ServiceWorkerRegistration} */ r, /** @type {ServiceWorker | null} */ w) => {
      if (!w) return;
      w.addEventListener('statechange', () => {
        note(r);
        // Installed while an older build of ours is active: it waits for Restart.
        if (w.state === 'installed' && r.active) showUpdate();
        if (w.state === 'activated') offline(r);
      });
    };
    const check = () => {
      const t = performance.now();
      if (!reg || t - lastCheck < CHECK_EVERY_MS) return;
      lastCheck = t;
      reg.update().then(() => note(reg), () => {}); // offline: try again next time
    };

    sw.register(new URL('../../sw.js', import.meta.url).href, {
      scope: new URL('../../', import.meta.url).href,
      updateViaCache: 'none',
    }).then(
      (r) => {
        reg = r;
        note(r);
        if (r.active) offline(r);
        else whenActive(r, r.installing || r.waiting);
        if (updateReady({ controller: sw.controller, waiting: r.waiting })) showUpdate();
        r.addEventListener('updatefound', () => whenActive(r, r.installing));
        check();
      },
      (err) => noteError(err),
    );

    doc.addEventListener('visibilitychange', () => {
      if (doc.visibilityState === 'visible') check();
    });

    // Restart: the waiting build takes over, then the page reloads into it
    // (boot.js, shared with the error sheet). The game is already saved: it
    // saves at every tap (ui/app.js), so the new build opens on the same screen.
    const again = doc.getElementById('update-restart');
    if (again && win) again.addEventListener('click', () => restart(win));
  } catch (err) {
    noteError(err);
  }
  return workerStatus();
}
