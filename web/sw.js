// oph-sw dev dev dev
const CHANNEL = 'dev';
const BUILD = 'dev';
const FILES = 'dev';
// The service worker (GAME_DESIGN E.7; BUILD_PLAN 2.2), one per channel. The
// build stamps the four lines above; the rest ships as written. Main's worker
// (scope /) passes everything under preview/ through; preview's (scope
// /preview/) passes review/ through. It precaches every file of its build into
// oph-<channel>-<files>, after checking version.json against its stamp,
// fetched past the HTTP cache, copying files whose hash hasn't changed from
// the last build's cache. Every file it stores has the hash precache.json
// lists for it, or the install fails and the next update check tries again:
// a CDN edge, or a deploy landing mid-install, can serve another build's
// file. It waits until the page asks it to take over (the update note's
// Restart). It never caches a redirect, and never deletes the other
// channel's caches, a pin cache, or the cache a newer install is filling.
//
// A classic script, not a module, for the widest iOS support, and so the
// tests can run it in node:vm.

const PREFIX = `oph-${CHANNEL}-`;
const PIN = `${PREFIX}pin-`;
const NAME = `${PREFIX}${FILES}`;
const PASS = CHANNEL === 'main' ? 'preview' : 'review';
const LIST = 'precache.json';

const here = (rel) => new URL(rel, self.registration.scope).href;
const usable = (res) => res && res.ok && !res.redirected; // never a redirect; opaque responses aren't ok
/** Another build's cache of this channel (not a pin, not this build's own). */
const ours = (name) => name.startsWith(PREFIX) && !name.startsWith(PIN) && name !== NAME;
/** A cache holds a whole build once it holds the list, which goes in last. Never creates the cache. */
const complete = async (name) => Boolean(await caches.match(here(LIST), { cacheName: name }));

async function fresh(rel) {
  const res = await fetch(here(rel), { cache: 'reload' });
  if (!usable(res)) throw new Error(`sw: ${rel} ${res && res.status}`);
  return res;
}

/** The first 12 hex of the SHA-256 of a response's bytes, as precache.json lists them. */
async function hashOf(res) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', await res.clone().arrayBuffer()));
  return Array.from(digest.slice(0, 6), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** The newest other cache of this channel's builds, with its file list. */
async function lastBuild() {
  const names = (await caches.keys()).filter(ours);
  for (const name of names.reverse()) {
    const cache = await caches.open(name);
    const res = await cache.match(here(LIST));
    if (res) return { cache, paths: (await res.json()).paths || {} };
  }
  return null;
}

async function precache() {
  const versionRes = await fetch(here('version.json'), { cache: 'no-store' });
  if (!usable(versionRes)) throw new Error(`sw: version.json ${versionRes && versionRes.status}`);
  const version = await versionRes.json();
  if (version.channel !== CHANNEL || version.files !== FILES) throw new Error('sw: version.json is another build');
  const listRes = await fresh(LIST);
  const list = await listRes.clone().json();
  if (list.files !== FILES) throw new Error('sw: precache.json is another build');
  // A cache with no list is an install that was cut off: one registration
  // installs one worker at a time, so none is still filling.
  for (const name of await caches.keys()) if (ours(name) && !(await complete(name))) await caches.delete(name);
  const cache = await caches.open(NAME);
  try {
    const old = await lastBuild();
    for (const [rel, hash] of Object.entries(list.paths)) {
      let res = old && old.paths[rel] === hash ? await old.cache.match(here(rel)) : undefined;
      if (!res || (await hashOf(res)) !== hash) {
        res = await fresh(rel);
        if ((await hashOf(res)) !== hash) throw new Error(`sw: ${rel} is another build's`);
      }
      await cache.put(here(rel), res);
    }
    // The list goes in last: a cache that holds it holds every file.
    await cache.put(here(LIST), listRes);
    // An older worker taking over (Restart) deletes the complete caches of
    // other builds; if this one went, the install fails and is tried again.
    if (!(await caches.has(NAME))) throw new Error('sw: the cache was removed during install');
  } catch (err) {
    await caches.delete(NAME);
    throw err;
  }
}

self.addEventListener('install', (event) => event.waitUntil(precache()));

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // The older builds go; a cache with no list yet is a newer install, still filling.
      for (const name of await caches.keys()) if (ours(name) && (await complete(name))) await caches.delete(name);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  const msg = event.data || {};
  if (msg.type === 'skip-waiting') self.skipWaiting();
  else if (msg.type === 'status' && event.ports && event.ports[0]) event.ports[0].postMessage({ channel: CHANNEL, build: BUILD, files: FILES });
});

async function fromCache(rel, req) {
  const hit = await caches.match(here(rel), { cacheName: NAME }); // never creates an empty cache
  return hit || fetch(req);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const rel = url.pathname.slice(scope.pathname.length);
  if (rel === PASS || rel.startsWith(`${PASS}/`)) return; // the other channel, or the review site
  if (rel === 'version.json' || rel === 'sw.js') return; // always the network
  if (req.mode === 'navigate') {
    if (rel === '' || rel === 'index.html') event.respondWith(fromCache('index.html', req)); // any ?query
    return;
  }
  event.respondWith(fromCache(rel, req));
});
