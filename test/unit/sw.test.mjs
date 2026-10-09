// The service worker (GAME_DESIGN E.7, E.9), run as built in node:vm with a
// fake worker global: a Map-backed Cache Storage and a fetch that reads the
// built folder. Each channel's worker caches only under its own prefix,
// passes the other channel through, and never deletes what isn't its own.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { build } from '../../tools/build.mjs';

const tmp = mkdtempSync(join(tmpdir(), 'oph-sw-'));
const built = {};
for (const channel of ['main', 'preview']) {
  const out = join(tmp, channel);
  const { version } = build({ out, channel, quiet: true });
  built[channel] = { out, version, list: JSON.parse(readFileSync(join(out, 'precache.json'), 'utf8')) };
}
test.after(() => rmSync(tmp, { recursive: true, force: true }));

const SCOPES = { main: 'https://ophiker.com/', preview: 'https://ophiker.com/preview/' };

/**
 * A worker world: run the channel's built sw.js against fakes.
 * @param {'main' | 'preview'} channel
 * stamp: run it as another build of the same files (its worker, version.json
 * and precache.json carry that files hash); wait: a promise a fetch of that
 * path waits on (a slow download).
 * @param {{files?: Record<string, Buffer | string>, redirected?: string[], missing?: string[], version?: any, caches?: Map<string, Map<string, Response>>, stamp?: string, wait?: Record<string, Promise<unknown>>}} [o]
 */
function world(channel, o = {}) {
  const { out } = built[channel];
  const version = o.stamp ? { ...built[channel].version, files: o.stamp } : built[channel].version;
  const scope = SCOPES[channel];
  const listeners = {};
  const store = o.caches || new Map();
  const opened = [];
  const fetched = [];
  const calls = { skipWaiting: 0, claim: 0 };
  const read = (rel) => {
    if (o.files && rel in o.files) return o.files[rel];
    if (rel === 'version.json' && (o.version || o.stamp)) return JSON.stringify(o.version || version);
    if (rel === 'precache.json' && o.stamp) return JSON.stringify({ ...built[channel].list, files: o.stamp });
    return readFileSync(join(out, rel));
  };
  const caches = {
    async keys() {
      return [...store.keys()];
    },
    async has(name) {
      return store.has(name);
    },
    async match(url, { cacheName } = {}) {
      const m = store.get(cacheName);
      const r = m && m.get(String(url));
      return r ? r.clone() : undefined;
    },
    async open(name) {
      opened.push(name);
      if (!store.has(name)) store.set(name, new Map());
      const m = store.get(name);
      return {
        async match(url) {
          const r = m.get(String(url));
          return r ? r.clone() : undefined;
        },
        async put(url, res) {
          m.set(String(url), res);
        },
      };
    },
    async delete(name) {
      return store.delete(name);
    },
  };
  async function fetch(input, init = {}) {
    const url = typeof input === 'string' ? input : input.url;
    fetched.push({ url, cache: init.cache });
    const path = new URL(url).pathname;
    const base = new URL(scope).pathname;
    const rel = path.startsWith(base) ? path.slice(base.length) : null;
    if (o.wait && rel in o.wait) await o.wait[rel];
    if (rel === null || (o.missing || []).includes(rel)) return new Response('Not found', { status: 404 });
    let body;
    try {
      body = read(rel || 'index.html');
    } catch {
      return new Response('Not found', { status: 404 });
    }
    const res = new Response(body, { status: 200 });
    if ((o.redirected || []).includes(rel)) Object.defineProperty(res, 'redirected', { value: true });
    return res;
  }
  const self = {
    registration: { scope },
    addEventListener(type, fn) {
      listeners[type] = fn;
    },
    skipWaiting() {
      calls.skipWaiting++;
    },
    clients: {
      async claim() {
        calls.claim++;
      },
    },
  };
  const context = vm.createContext({ self, caches, fetch, crypto, Response, Request, URL, console });
  let src = readFileSync(join(out, 'sw.js'), 'utf8');
  if (o.stamp) src = src.replace(/^const FILES = '\w+';$/m, `const FILES = '${o.stamp}';`);
  vm.runInContext(src, context, { filename: `${channel}/sw.js` });
  const fire = async (type, extra = {}) => {
    let waited;
    const event = { ...extra, waitUntil: (p) => (waited = p) };
    listeners[type](event);
    await waited;
    return event;
  };
  /** A fetch event; resolves to the response given, or null when the worker let it pass. */
  const request = async (path, { mode = 'no-cors', method = 'GET' } = {}) => {
    let responded = null;
    listeners.fetch({ request: { url: new URL(path, 'https://ophiker.com/').href, mode, method }, respondWith: (p) => (responded = p) });
    return responded ? await responded : null;
  };
  const message = (data, port) => listeners.message({ data, ports: port ? [port] : [] });
  return { store, opened, fetched, calls, fire, request, message, name: `oph-${channel}-${version.files}`, scope, version };
}

/** Resolves once a world's worker has asked the network for rel. */
async function reached(w, rel) {
  const url = new URL(rel, w.scope).href;
  for (let k = 0; !w.fetched.some((f) => f.url === url); k++) {
    if (k > 2000) throw new Error(`the worker never asked for ${rel}`);
    await new Promise((r) => setTimeout(r, 1));
  }
}

for (const channel of ['main', 'preview']) {
  test(`${channel}: install precaches every listed file, fetched past the HTTP cache, into its own cache`, async () => {
    const w = world(channel);
    await w.fire('install');
    const { list } = built[channel];
    const cache = w.store.get(w.name);
    assert.ok(cache, `the cache is ${w.name}`);
    const urls = [...Object.keys(list.paths), 'precache.json'].map((rel) => new URL(rel, w.scope).href).sort();
    assert.deepEqual([...cache.keys()].sort(), urls);
    for (const f of w.fetched.filter((x) => !x.url.endsWith('version.json'))) assert.equal(f.cache, 'reload', `${f.url} past the HTTP cache`);
    assert.equal(w.fetched.find((x) => x.url.endsWith('version.json')).cache, 'no-store');
    assert.ok(!w.fetched.some((x) => x.url.endsWith('/sw.js')), 'the worker never caches itself (nor version.json, above)');
    for (const name of w.opened) assert.ok(name.startsWith(`oph-${channel}-`), `${name} carries the channel prefix (E.9)`);
    assert.equal(w.calls.skipWaiting, 0, 'an update waits for Restart');
  });

  test(`${channel}: install fails and leaves no cache on a 404, a redirect or another build's version.json`, async () => {
    for (const o of [{ missing: ['css/game.css'] }, { redirected: ['js/main.js'] }, { version: { ...built[channel].version, files: '000000000000' } }, { version: { ...built[channel].version, channel: channel === 'main' ? 'preview' : 'main' } }]) {
      const w = world(channel, o);
      await assert.rejects(w.fire('install'), /sw: /, JSON.stringify(o));
      assert.equal(w.store.has(w.name), false, `no half-filled cache (${JSON.stringify(o)})`);
    }
  });

  test(`${channel}: a new build copies unchanged files from the last build's cache and fetches only the rest`, async () => {
    const caches = new Map();
    const old = world(channel, { caches });
    await old.fire('install');
    // Pretend the last build was another one, in which only css/game.css differed.
    const oldCache = caches.get(old.name);
    caches.delete(old.name);
    const oldName = `oph-${channel}-111111111111`;
    const list = JSON.parse(readFileSync(join(built[channel].out, 'precache.json'), 'utf8'));
    list.paths['css/game.css'] = 'ffffffffffff';
    oldCache.set(new URL('precache.json', old.scope).href, new Response(JSON.stringify(list)));
    caches.set(oldName, oldCache);
    const w = world(channel, { caches });
    await w.fire('install');
    const got = w.fetched.map((x) => new URL(x.url).pathname.slice(new URL(w.scope).pathname.length));
    assert.deepEqual(got.sort(), ['css/game.css', 'precache.json', 'version.json']);
    assert.equal(caches.get(w.name).size, Object.keys(list.paths).length + 1, 'every file is in the new cache');
    assert.ok(caches.has(oldName), 'the old build stays until activate');
  });

  test(`${channel}: activate deletes only its own old caches, never the other channel's, a pin or an install still filling, and claims`, async () => {
    const other = channel === 'main' ? 'preview' : 'main';
    const listed = (name) => new Map([[new URL('precache.json', SCOPES[channel]).href, new Response('{}')]]);
    const caches = new Map([
      [`oph-${channel}-111111111111`, listed()],
      [`oph-${channel}-444444444444`, new Map()], // no list yet: a newer build installing
      [`oph-${channel}-pin-222222222222`, listed()],
      [`oph-${other}-333333333333`, listed()],
      ['someone-else', new Map()],
    ]);
    const w = world(channel, { caches });
    caches.set(w.name, new Map());
    await w.fire('activate');
    assert.deepEqual([...caches.keys()].sort(), [`oph-${channel}-444444444444`, `oph-${channel}-pin-222222222222`, `oph-${other}-333333333333`, w.name, 'someone-else'].sort());
    assert.equal(w.calls.claim, 1);
  });

  test(`${channel}: install stores only the bytes precache.json lists, fetched or kept`, async () => {
    const stale = 'an older build of this file';
    const bad = world(channel, { files: { 'js/main.js': stale } });
    await assert.rejects(bad.fire('install'), /sw: js\/main\.js is another build's/, 'a fetched file that is another build fails the install');
    assert.equal(bad.store.has(bad.name), false, 'and leaves no cache');
    // A last build whose cache holds wrong bytes under an unchanged hash: fetched again, never copied.
    const caches = new Map();
    const scopeUrl = (rel) => new URL(rel, SCOPES[channel]).href;
    const last = new Map([
      [scopeUrl('js/main.js'), new Response(stale)],
      [scopeUrl('css/game.css'), new Response(readFileSync(join(built[channel].out, 'css', 'game.css')))],
      [scopeUrl('precache.json'), new Response(JSON.stringify(built[channel].list))],
    ]);
    caches.set(`oph-${channel}-111111111111`, last);
    const w = world(channel, { caches });
    await w.fire('install');
    const got = w.fetched.map((x) => new URL(x.url).pathname.slice(new URL(w.scope).pathname.length));
    assert.ok(got.includes('js/main.js'), 'the wrong copy is fetched again');
    assert.ok(!got.includes('css/game.css'), 'the right copy is kept');
    const res = await caches.get(w.name).get(scopeUrl('js/main.js')).clone().text();
    assert.equal(res, readFileSync(join(built[channel].out, 'js', 'main.js'), 'utf8'));
  });

  test(`${channel}: a Restart during a newer install leaves that install its cache, and an install whose cache goes fails`, async () => {
    const caches = new Map();
    const y = world(channel, { caches, stamp: 'aaaaaaaaaaaa' });
    await y.fire('install'); // build Y waits for Restart
    let release;
    const slow = new Promise((r) => (release = r));
    // Z changed js/main.js, so it downloads it rather than copying Y's.
    const main = '// build Z\n';
    const list = { ...built[channel].list, files: 'bbbbbbbbbbbb', paths: { ...built[channel].list.paths, 'js/main.js': createHash('sha256').update(main).digest('hex').slice(0, 12) } };
    const z = world(channel, { caches, stamp: 'bbbbbbbbbbbb', wait: { 'js/main.js': slow }, files: { 'js/main.js': main, 'precache.json': JSON.stringify(list) } });
    const zInstall = z.fire('install'); // build Z, deployed since, is downloading
    await reached(z, 'js/main.js');
    assert.ok(caches.has(z.name), "Z's cache is filling");
    await y.fire('activate'); // Restart: Y takes over
    assert.ok(caches.has(z.name), "Y's activate leaves Z's half-filled cache");
    release();
    await zInstall;
    assert.deepEqual([...caches.keys()].sort(), [y.name, z.name].sort());
    await z.fire('activate'); // the next Restart
    assert.deepEqual([...caches.keys()], [z.name], 'Z holds the whole build, and Y is gone');
    assert.equal(caches.get(z.name).size, Object.keys(list.paths).length + 1);
    // A cache taken out from under an install (an older worker's clean-up) fails it, and it is tried again.
    let go;
    const gate = new Promise((r) => (go = r));
    const v = world(channel, { caches, stamp: 'cccccccccccc', wait: { 'js/main.js': gate } }); // js/main.js changed back
    const vInstall = v.fire('install');
    await reached(v, 'js/main.js');
    caches.delete(v.name);
    go();
    await assert.rejects(vInstall, /sw: the cache was removed during install/);
    assert.deepEqual([...caches.keys()], [z.name]);
  });

  test(`${channel}: an install clears a cut-off install's cache, and keeps the complete ones`, async () => {
    const listed = new Map([[new URL('precache.json', SCOPES[channel]).href, new Response(JSON.stringify(built[channel].list))]]);
    const caches = new Map([
      [`oph-${channel}-111111111111`, new Map([[new URL('index.html', SCOPES[channel]).href, new Response('x')]])], // no list: cut off
      [`oph-${channel}-222222222222`, listed],
    ]);
    const w = world(channel, { caches });
    await w.fire('install');
    assert.deepEqual([...caches.keys()].sort(), [`oph-${channel}-222222222222`, w.name].sort());
  });

  test(`${channel}: messages: skip-waiting on Restart, and its status for the bug report`, () => {
    const w = world(channel);
    w.message({ type: 'skip-waiting' });
    assert.equal(w.calls.skipWaiting, 1);
    const got = [];
    w.message({ type: 'status' }, { postMessage: (m) => got.push({ ...m }) }); // copied out of the worker's realm
    assert.deepEqual(got, [{ channel, build: w.version.build, files: w.version.files }]);
    w.message(null);
    w.message({ type: 'nothing' });
    assert.equal(w.calls.skipWaiting, 1);
  });
}

test('fetch: main passes /preview through; both pass version.json, sw.js and POST', async () => {
  const main = world('main');
  await main.fire('install');
  for (const p of ['/preview', '/preview/', '/preview/index.html', '/preview/js/main.js']) {
    assert.equal(await main.request(p, { mode: 'navigate' }), null, `main lets ${p} through (a navigation)`);
    assert.equal(await main.request(p), null, `main lets ${p} through`);
  }
  const preview = world('preview');
  await preview.fire('install');
  assert.equal(await preview.request('/preview/review/x'), null, 'preview lets review/ through');
  assert.equal(await preview.request('/preview/review', { mode: 'navigate' }), null);
  assert.equal(await preview.request('/index.html'), null, "preview leaves main's files alone");
  for (const [w, base] of [
    [main, '/'],
    [preview, '/preview/'],
  ]) {
    assert.equal(await w.request(`${base}version.json`), null, 'version.json: always the network');
    assert.equal(await w.request(`${base}sw.js`), null, 'sw.js: always the network');
    assert.equal(await w.request(`${base}css/game.css`, { method: 'POST' }), null);
    assert.equal(await w.request('https://example.com/x.js'), null, 'another origin');
  }
});

test('fetch: navigations get the cached page, assets the cache, and the rest the network, never stored', async () => {
  for (const channel of ['main', 'preview']) {
    const w = world(channel);
    await w.fire('install');
    const page = readFileSync(join(built[channel].out, 'index.html'), 'utf8');
    w.fetched.length = 0;
    for (const p of ['', '?debug=1', 'index.html', 'index.html?x=1']) {
      const res = await w.request(new URL(p, w.scope).href, { mode: 'navigate' });
      assert.ok(res, `${channel}: ${p || './'} is answered`);
      assert.equal(await res.text(), page, `${channel}: ${p || './'} gets the cached index.html`);
    }
    const css = await w.request(new URL('css/game.css', w.scope).href);
    assert.equal(await css.text(), readFileSync(join(built[channel].out, 'css', 'game.css'), 'utf8'));
    assert.deepEqual(w.fetched, [], 'all of that from the cache');
    assert.equal(await w.request(new URL('somewhere/else', w.scope).href, { mode: 'navigate' }), null, 'another page: the network');
    const before = w.store.get(w.name).size;
    const res = await w.request(new URL('fonts/OFL.txt?v=2', w.scope).href);
    assert.ok(res.ok, 'a query on a cached file still hits');
    const miss = await w.request(new URL('not/listed.json', w.scope).href);
    assert.equal(miss.status, 404, 'an unlisted file goes to the network');
    assert.equal(w.store.get(w.name).size, before, 'and is never stored');
  }
});
