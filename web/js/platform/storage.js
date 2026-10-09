// Storage under the channel's own names (GAME_DESIGN E.6, E.9): localStorage
// and sessionStorage keys oph.<channel>.<name>, IndexedDB databases
// oph-<channel>-<name>, caches oph-<channel>-<hash>, pin caches
// oph-<channel>-pin-<hash>. Nothing else in web/js touches storage (lint S01),
// so main and preview never share a save. Every read and write is wrapped:
// storage can be missing or full, and the game runs without it.
//
// S2 stores one key, preview's marks choice (oph.preview.marks). The saves
// arrive in session 3.

const CHANNELS = ['main', 'preview'];
const NAME = /^[a-z][a-z0-9_]*$/;
const HASH = /^[0-9a-z_]+$/;

/** @type {string | null} */
let channelSet = null;
/** @type {boolean | null | undefined} persist()'s answer, once asked */
let persisted;
/** @type {{persisted: boolean | null, usage: number | null, quota: number | null} | null} */
let facts = null;

/** Set the channel by hand (tests); null goes back to <html data-channel>. */
export function setChannel(ch) {
  channelSet = ch;
}

/**
 * The channel the build stamped on <html>: 'main' or 'preview'. Throws on
 * anything else (the unbuilt shell says 'dev'), so nothing is ever stored
 * under a name another channel could read.
 */
export function channel() {
  const ch = channelSet ?? (typeof document === 'undefined' ? null : document.documentElement.dataset.channel);
  if (!CHANNELS.includes(ch)) throw new Error(`storage: no channel "${ch}" (main or preview)`);
  return ch;
}

/** oph.<channel>.<name>, for localStorage and sessionStorage. */
export function keyName(name) {
  if (!NAME.test(String(name))) throw new Error(`storage: "${name}" is not a key name (a-z, 0-9, _)`);
  return `oph.${channel()}.${name}`;
}

/** oph-<channel>-<name>, for an IndexedDB database. */
export function dbName(name) {
  if (!NAME.test(String(name))) throw new Error(`storage: "${name}" is not a database name (a-z, 0-9, _)`);
  return `oph-${channel()}-${name}`;
}

/** oph-<channel>-<hash>, for a build's cache (the worker makes the same name, web/sw.js). */
export function cacheName(hash) {
  if (!HASH.test(String(hash))) throw new Error(`storage: "${hash}" is not a cache hash`);
  return `oph-${channel()}-${hash}`;
}

/** oph-<channel>-pin-<hash>, for a timed attempt's pinned build (9.10). */
export function pinName(hash) {
  if (!HASH.test(String(hash))) throw new Error(`storage: "${hash}" is not a cache hash`);
  return `oph-${channel()}-pin-${hash}`;
}

/** The store, or null when it's missing or refuses to be touched (a private tab, a sandbox). */
function store(session) {
  try {
    const s = session ? globalThis.sessionStorage : globalThis.localStorage;
    return s || null;
  } catch {
    return null;
  }
}

/**
 * A stored value, parsed, or null (nothing there, no storage, or bad JSON).
 * @param {string} name
 * @param {{session?: boolean}} [o]
 */
export function load(name, { session = false } = {}) {
  try {
    const s = store(session);
    if (!s) return null;
    const raw = s.getItem(keyName(name));
    return raw === null || raw === undefined ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Store a value as JSON. False when it couldn't be (no storage, full).
 * @param {string} name
 * @param {unknown} value
 * @param {{session?: boolean}} [o]
 */
export function save(name, value, { session = false } = {}) {
  try {
    const s = store(session);
    if (!s) return false;
    s.setItem(keyName(name), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove a stored value. False when it couldn't be.
 * @param {string} name
 * @param {{session?: boolean}} [o]
 */
export function remove(name, { session = false } = {}) {
  try {
    const s = store(session);
    if (!s) return false;
    s.removeItem(keyName(name));
    return true;
  } catch {
    return false;
  }
}

/** This channel's keys in localStorage, by name only, never their values (for the bug report). */
export function ownKeys() {
  try {
    const s = store(false);
    if (!s) return [];
    const prefix = `oph.${channel()}.`;
    const out = [];
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k && k.startsWith(prefix)) out.push(k.slice(prefix.length));
    }
    return out.sort();
  } catch {
    return [];
  }
}

/**
 * Ask for lasting storage (E.6: Safari may clear a site's storage after
 * about 7 days without a visit; never depend on this). Asks whether it is
 * already persisted, and asks for it only if not. True or false, or null
 * where the browser has no such thing. Never throws; the answer is kept.
 * @param {any} [nav]
 */
export async function persist(nav = globalThis.navigator) {
  try {
    const s = nav && nav.storage;
    if (!s || typeof s.persisted !== 'function') {
      persisted = null;
      return null;
    }
    let ok = await s.persisted();
    if (!ok && typeof s.persist === 'function') ok = await s.persist();
    persisted = Boolean(ok);
    return persisted;
  } catch {
    persisted = null;
    return null;
  }
}

/**
 * What the bug report says about storage: persisted, usage and quota, from
 * persisted() and estimate(). Kept, so the report can be built inside a tap
 * without waiting (BUILD_PLAN 2.8). Never throws.
 * @param {any} [nav]
 */
export async function storageFacts(nav = globalThis.navigator) {
  const s = nav && nav.storage;
  let p = persisted === undefined ? null : persisted;
  let usage = null;
  let quota = null;
  try {
    if (s && typeof s.persisted === 'function') p = Boolean(await s.persisted());
  } catch {
    // keep what persist() learned
  }
  try {
    if (s && typeof s.estimate === 'function') {
      const e = await s.estimate();
      if (Number.isFinite(e.usage)) usage = e.usage;
      if (Number.isFinite(e.quota)) quota = e.quota;
    }
  } catch {
    // no estimate on this phone
  }
  facts = { persisted: p, usage, quota };
  return facts;
}

/** The last storageFacts(), or null before the first. */
export function lastFacts() {
  return facts;
}
