#!/usr/bin/env node
// DIAGNOSTIC ONLY (branch diag-webkit, not for merge): which Web API call
// rejects with InvalidStateError in WebKit on S7.
//
//   diagInit       a context init script: wraps every method of the page's
//                  DOM interfaces (and the promise getters: ready, finished,
//                  loaded, closed, ...), so a call that throws a DOMException
//                  or whose promise rejects logs "DIAG throw|reject <Iface.m>"
//                  with the JS stack at call time; logs every
//                  unhandledrejection with the call that produced its
//                  reason; logs the screen changes and the error sheet.
//   node tools/diag-webkit.mjs [--engine webkit] [--out out/shots/flow]
//                  the real player flow at /preview/ (no debug): the
//                  loading art, first launch's shut lockbox, the lockbox's
//                  questions, the guest book, the cabin, the mailbox, a
//                  Look, a reload, the next step; every DIAG line printed,
//                  and whether #error-sheet ever showed.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './pics.mjs';

/** In the page, before any of its scripts (context.addInitScript). */
export function diagInit() {
  const w = /** @type {any} */ (window);
  if (w.__diagInstalled) return;
  w.__diagInstalled = true;
  const log = console.error.bind(console);
  const apply = Reflect.apply;
  const gopd = Object.getOwnPropertyDescriptor;
  const defp = Object.defineProperty;
  const PromiseC = Promise;
  const then = Promise.prototype.then;
  const sites = new WeakMap();
  const t0 = performance.now();
  const ctx = () => {
    let screen = '-';
    try {
      const app = document.getElementById('app');
      screen = (app && app.getAttribute('data-screen')) || '-';
    } catch {
      // too early
    }
    return `[t=${Math.round(performance.now() - t0)}ms screen=${screen} hash=${location.hash || '-'}]`;
  };
  const desc = (e) => {
    try {
      return e && typeof e === 'object' ? `${e.name}: ${e.message}` : String(e);
    } catch {
      return '?';
    }
  };
  const stackNow = () => {
    const s = String(new Error().stack || '');
    return s
      .split('\n')
      .filter((l) => l && !l.includes('__diag'))
      .slice(0, 16)
      .map((l) => l.replace(/https?:\/\/[^/\s]+/g, ''))
      .join(' <- ');
  };
  const isDom = (e) => {
    try {
      return typeof DOMException === 'function' && e instanceof DOMException;
    } catch {
      return false;
    }
  };
  const note = (e, rec) => {
    if (e && (typeof e === 'object' || typeof e === 'function') && !sites.has(e)) sites.set(e, rec);
  };
  const watchPromise = (p, label) => {
    const st = stackNow();
    return apply(then, p, [
      undefined,
      (e) => {
        note(e, { kind: 'reject', label, st });
        log(`DIAG reject ${label}: ${desc(e)} ${ctx()} | called at: ${st}`);
        throw e;
      },
    ]);
  };
  const wrapFn = (orig, label) => {
    const wrapped = {
      __diag(...args) {
        let r;
        try {
          r = apply(orig, this, args);
        } catch (e) {
          if (isDom(e) && !sites.has(e)) {
            const st = stackNow();
            note(e, { kind: 'throw', label, st });
            log(`DIAG throw ${label}: ${desc(e)} ${ctx()} | at: ${st}`);
          }
          throw e;
        }
        return r instanceof PromiseC ? watchPromise(r, label) : r;
      },
    }.__diag;
    try {
      defp(wrapped, 'name', { value: orig.name });
      defp(wrapped, 'length', { value: orig.length });
    } catch {
      // fine
    }
    return wrapped;
  };
  const rawGetters = {};
  const PROMISE_GETTERS = new Set(['ready', 'finished', 'loaded', 'closed', 'updateCallbackDone', 'released', 'ended', 'committed']);
  const wrapOwner = (owner, label, statics) => {
    let keys;
    try {
      keys = Object.getOwnPropertyNames(owner);
    } catch {
      return 0;
    }
    let n = 0;
    for (const k of keys) {
      if (k === 'constructor' || (statics && (k === 'prototype' || k === 'length' || k === 'name'))) continue;
      let d;
      try {
        d = gopd(owner, k);
      } catch {
        continue;
      }
      if (!d || !d.configurable) continue;
      try {
        if (typeof d.value === 'function') {
          defp(owner, k, { ...d, value: wrapFn(d.value, `${label}.${k}`) });
          n++;
        } else if (typeof d.get === 'function' && PROMISE_GETTERS.has(k)) {
          const g = d.get;
          const lab = `${label}.${k}`;
          rawGetters[lab] = g;
          defp(owner, k, {
            ...d,
            get() {
              const r = apply(g, this, []);
              return r instanceof PromiseC ? watchPromise(r, lab) : r;
            },
          });
          n++;
        }
      } catch {
        // not ours to wrap
      }
    }
    return n;
  };
  const ES = new Set(
    'Object Function Array Number Boolean String Symbol Date Promise RegExp Map BigInt Set WeakMap WeakSet Proxy Reflect FinalizationRegistry WeakRef ArrayBuffer SharedArrayBuffer DataView Atomics JSON Math Intl Iterator AsyncIterator DisposableStack AsyncDisposableStack ShadowRealm Temporal WebAssembly Window WindowProperties Location'.split(' '),
  );
  let count = 0;
  const wrappedNames = [];
  for (const name of Object.getOwnPropertyNames(window)) {
    if (!/^[A-Z]/.test(name) || ES.has(name) || /Error$|Array$/.test(name)) continue;
    let v;
    try {
      v = w[name];
    } catch {
      continue;
    }
    if (typeof v !== 'function' || !v.prototype || typeof v.prototype !== 'object') continue;
    const c = wrapOwner(v.prototype, name, false) + wrapOwner(v, name, true);
    if (c) wrappedNames.push(name);
    count += c;
  }
  // The window's own functions (fetch, createImageBitmap, structuredClone, ...): own properties of the global.
  for (const k of ['fetch', 'createImageBitmap', 'structuredClone', 'atob', 'btoa', 'queueMicrotask', 'reportError']) {
    const d = gopd(window, k) || gopd(Object.getPrototypeOf(window), k);
    if (d && typeof d.value === 'function' && d.configurable !== false) {
      try {
        defp(window, k, { ...d, value: wrapFn(d.value, `window.${k}`) });
        count++;
      } catch {
        // fine
      }
    }
  }
  if (typeof WebAssembly === 'object') count += wrapOwner(WebAssembly, 'WebAssembly', true);
  // document.fonts' own prototype (FontFaceSet is no global in some engines).
  try {
    const fp = document.fonts && Object.getPrototypeOf(document.fonts);
    if (fp && !wrappedNames.includes('FontFaceSet')) {
      count += wrapOwner(fp, 'FontFaceSet', false);
      wrappedNames.push('FontFaceSet');
    }
  } catch {
    // fine
  }
  log(`DIAG init: wrapped ${count} members on ${wrappedNames.length} interfaces ${ctx()} (${['AudioContext', 'BaseAudioContext', 'CanvasRenderingContext2D', 'FontFaceSet', 'ServiceWorkerContainer', 'HTMLMediaElement', 'Clipboard', 'Navigator', 'Animation', 'Document', 'Element', 'HTMLCanvasElement'].map((n) => `${n}:${wrappedNames.includes(n) ? 'y' : 'n'}`).join(' ')})`);

  window.addEventListener('unhandledrejection', (ev) => {
    const r = ev.reason;
    const s = r && typeof r === 'object' ? sites.get(r) : null;
    log(`DIAG unhandledrejection: ${desc(r)} ${ctx()} | from: ${s ? `${s.kind} ${s.label} at: ${s.st}` : 'no wrapped call'} | reason.stack: ${(r && r.stack) || '(none)'}`);
  });
  window.addEventListener('error', (ev) => {
    const e = ev.error;
    const s = e && typeof e === 'object' ? sites.get(e) : null;
    log(`DIAG window.error: ${ev.message} @ ${ev.filename}:${ev.lineno}:${ev.colno} ${ctx()} | from: ${s ? `${s.kind} ${s.label} at: ${s.st}` : '-'} | stack: ${(e && e.stack) || '(none)'}`);
  });
  // The screens, the fonts, the error sheet.
  const watchDom = () => {
    try {
      const app = document.getElementById('app');
      let last = null;
      const onScreen = () => {
        const s = app && app.getAttribute('data-screen');
        if (s === last) return;
        last = s;
        log(`DIAG screen -> ${s} fonts.status=${document.fonts ? document.fonts.status : '-'} ${ctx()}`);
        // Is document.fonts.ready (the engine's own promise, unwrapped) settled as this screen draws, and when does it settle?
        try {
          const g = rawGetters['FontFaceSet.ready'];
          const rp = g ? apply(g, document.fonts, []) : document.fonts.ready;
          let st = 'pending';
          apply(then, rp, [
            () => {
              const was = st;
              st = 'resolved';
              if (was === 'pending-after-task') log(`DIAG fonts.ready (as of screen ${s}) settled LATE, status=${document.fonts.status} ${ctx()}`);
            },
          ]);
          setTimeout(() => {
            if (st === 'pending') st = 'pending-after-task';
            log(`DIAG fonts.ready at screen ${s}, one task later: ${st} (status=${document.fonts.status}) ${ctx()}`);
          }, 0);
        } catch (e) {
          log(`DIAG fonts.ready probe failed: ${desc(e)}`);
        }
      };
      if (app) new MutationObserver(onScreen).observe(app, { attributes: true, attributeFilter: ['data-screen'] });
      const sheet = document.getElementById('error-sheet');
      if (sheet) {
        new MutationObserver(() => {
          if (!sheet.hidden) log(`DIAG ERROR-SHEET SHOWN ${ctx()}`);
        }).observe(sheet, { attributes: true, attributeFilter: ['hidden'] });
      }
      if (document.fonts) {
        const f = document.fonts;
        log(`DIAG fonts.status at DOMContentLoaded: ${f.status} ${ctx()}`);
        f.addEventListener('loading', () => log(`DIAG fonts loading ${ctx()}`));
        f.addEventListener('loadingdone', () => log(`DIAG fonts loadingdone status=${f.status} ${ctx()}`));
      }
    } catch (e) {
      log(`DIAG watchDom failed: ${desc(e)}`);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchDom);
  else watchDom();
}

/**
 * Print a page's DIAG lines (and its other errors) with a tag.
 * @param {any} page
 * @param {string} tag
 * @param {string[]} [into]
 */
export function hookPage(page, tag, into = []) {
  page.on('pageerror', (e) => {
    const s = `DIAG[${tag}] pageerror: ${String(e)} | ${(e && e.stack) || ''}`;
    into.push(s);
    console.log(s);
  });
  page.on('console', (m) => {
    const text = m.text();
    if (text.startsWith('DIAG') || m.type() === 'error' || m.type() === 'warning') {
      const s = `DIAG[${tag}] console.${m.type()}: ${text}`;
      into.push(s);
      console.log(s);
    }
  });
  return into;
}

/** The real player flow, fresh, at /preview/ (no debug), on the 17's size. */
export async function runFlow({ engine = 'webkit', out = join(ROOT, 'out', 'shots', 'flow'), motion = true, size = { width: 402, height: 874, dpr: 3, safe: [62, 34] }, tag = 'flow', slowFonts = 0, fast = false, allFonts = false } = {}) {
  const { loadPlaywright, launch, serveSite, safeCss } = await import('./shots.mjs');
  const pw = await loadPlaywright();
  if (!pw) throw new Error('no playwright');
  mkdirSync(out, { recursive: true });
  const { browser, engine: used, version } = await launch(pw, engine, (m) => console.log(m));
  console.log(`DIAG[${tag}] engine ${used} ${version} motion=${motion} slowFonts=${slowFonts} allFonts=${allFonts} fast=${fast}`);
  const site = await serveSite(ROOT);
  const lines = [];
  let sheetSeen = false;
  let k = 0;
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    screen: { width: size.width, height: size.height },
    deviceScaleFactor: size.dpr,
    isMobile: true,
    hasTouch: true,
    reducedMotion: motion ? 'no-preference' : 'reduce',
  });
  await context.addInitScript(diagInit);
  // A slow first visit (cellular): every font answers slowFonts ms late.
  if (slowFonts) {
    // The frame's two fonts (ui/app.js FRAME_FONTS), which the game waits for 1.5 s at most.
    await context.route(allFonts ? /\/fonts\/[^/]+\.(ttf|woff2)$/ : /\/fonts\/(OPHChrome\.ttf|Literata[^/]*\.woff2)$/, async (route) => {
      await new Promise((done) => setTimeout(done, slowFonts));
      await route.continue().catch(() => null);
    });
  }
  await context.addInitScript(({ css }) => {
    document.addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = css;
      document.head.appendChild(s);
    });
  }, { css: safeCss(size) });
  const page = await context.newPage();
  hookPage(page, tag, lines);
  const shot = async (name) => {
    try {
      await page.screenshot({ path: join(out, `${String(++k).padStart(2, '0')}-${tag}-${name}.${used}.png`) });
    } catch (e) {
      console.log(`DIAG[${tag}] screenshot ${name} failed: ${e.message}`);
    }
  };
  const state = async () =>
    page.evaluate(() => {
      const app = document.getElementById('app');
      const sheet = document.getElementById('error-sheet');
      const host = document.querySelector('.game-screen');
      return {
        screen: app ? app.getAttribute('data-screen') : null,
        first: Boolean(host && host.hasAttribute('data-first')),
        step: host ? host.getAttribute('data-step') : null,
        sheet: Boolean(sheet && !sheet.hidden),
        report: (() => {
          const a = document.getElementById('error-report');
          return a ? String(a.value || a.textContent || '').slice(0, 600) : '';
        })(),
      };
    });
  const check = async (where) => {
    const s = await state();
    console.log(`DIAG[${tag}] at ${where}: screen=${s.screen} first=${s.first} step=${s.step} errorSheet=${s.sheet ? 'VISIBLE' : 'hidden'}`);
    if (s.sheet) sheetSeen = true;
    return s;
  };
  const tap = async (sel, where) => {
    if (sheetSeen) throw new Error(`the error sheet is up: the flow stops before ${where}`);
    try {
      const loc = page.locator(sel).first();
      await loc.waitFor({ state: 'visible', timeout: 8000 });
      await loc.tap({ timeout: 8000 });
      console.log(`DIAG[${tag}] tapped ${sel} (${where})`);
      return true;
    } catch (e) {
      console.log(`DIAG[${tag}] could not tap ${sel} (${where}): ${String(e.message).split('\n')[0]}`);
      if ((await state()).sheet) {
        sheetSeen = true;
        console.log(`DIAG[${tag}] the error sheet is up (${where})`);
      }
      return false;
    }
  };
  try {
    await page.goto(`${site.base}/preview/`, { waitUntil: fast ? 'domcontentloaded' : 'load' });
    if (!fast) await page.waitForTimeout(300);
    if (!fast) await shot('loading');
    await check('loading');
    await page.waitForSelector('#app[data-screen]', { timeout: 20000 }).catch(() => null);
    await page.waitForSelector('.cabin[data-key] .status-line', { timeout: 20000 }).catch(() => console.log(`DIAG[${tag}] no cabin within 20 s`));
    // Fast: a quick player, just past the game's 300 ms double-tap guard (ui/app.js TAP_GUARD_MS).
    await page.waitForTimeout(fast ? 450 : 1500);
    await check('first launch');
    if (!fast) await shot('first');
    // Open the lockbox (fast: as soon as it shows, the fonts maybe still on their way).
    await tap('.cabin .next-step', 'open the lockbox');
    await page.waitForTimeout(fast ? Math.max(1200, slowFonts + 2500) : 1200);
    await check('lockbox');
    await shot('lockbox');
    // The questions: the first answer each time, until the key.
    for (let q = 0; q < 6; q++) {
      const s = await check(`lockbox q${q}`);
      if (s.screen !== 'lockbox') break;
      await tap('.game-choices .choice:not([disabled])', `lockbox choice ${q}`);
      await page.waitForTimeout(900);
      await shot(`lockbox_${q}`);
    }
    await check('after lockbox');
    // The guest book: a name, Sign.
    try {
      await page.waitForSelector('#gb-name', { timeout: 8000 });
      await page.locator('#gb-name').tap();
      await page.fill('#gb-name', 'Ada');
      await page.waitForTimeout(400);
      await shot('guestbook');
      await tap('#gb-sign', 'sign');
    } catch (e) {
      console.log(`DIAG[${tag}] guest book: ${String(e.message).split('\n')[0]}`);
    }
    await page.waitForTimeout(1500);
    await check('cabin after signing');
    await shot('cabin');
    // The mailbox: open, look, close.
    await tap('.status-menu', 'open the mailbox');
    await page.waitForTimeout(800);
    await check('mailbox');
    await shot('mailbox');
    // The Text toggle twice (Plain, then Pixel): each redraws the cabin behind the sheet.
    await tap('.mail-text', 'text toggle 1');
    await page.waitForTimeout(150);
    await tap('.mail-text', 'text toggle 2');
    await page.waitForTimeout(1500);
    await check('mailbox after text toggles');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    // A Look (the tub), the alt Look, Sound off and on.
    await tap('.cabin-place[data-place="tub"]', 'tub');
    await page.waitForTimeout(800);
    await shot('look_tub');
    await page.mouse.click(5, 300);
    await page.waitForTimeout(600);
    await tap('.status-sound', 'sound off');
    await page.waitForTimeout(400);
    await tap('.status-sound', 'sound on');
    await page.waitForTimeout(600);
    await check('cabin after look and sound');
    // A second visit: reload, the cabin from the save, the mailbox again.
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('.cabin[data-key] .status-line', { timeout: 20000 }).catch(() => console.log(`DIAG[${tag}] no cabin after reload`));
    await page.waitForTimeout(1500);
    await check('reload');
    await shot('reload');
    await tap('.status-menu', 'mailbox after reload');
    await page.waitForTimeout(800);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    // The next step (Plan your first trip): the cabin gives way to what follows.
    await tap('.cabin .next-step', 'next step');
    await page.waitForTimeout(2000);
    await check('after next step');
    await shot('next');
    // A hidden page and back (an app switch): the visibilitychange paths.
    await page.evaluate(() => {
      try {
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
        document.dispatchEvent(new Event('visibilitychange'));
      } catch (e) {
        console.error('DIAG could not fake hidden', String(e));
      }
    });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      try {
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
        document.dispatchEvent(new Event('visibilitychange'));
      } catch (e) {
        console.error('DIAG could not fake visible', String(e));
      }
    });
    await page.waitForTimeout(1500);
    await check('after visibility');
    await shot('end');
  } catch (e) {
    console.log(`DIAG[${tag}] flow stopped: ${e && e.stack ? e.stack : String(e)}`);
  } finally {
    const s = await state().catch(() => null);
    if (s && s.sheet) sheetSeen = true;
    const rejects = lines.filter((l) => /DIAG (reject|unhandledrejection|throw)|pageerror/.test(l));
    const summary = `DIAG[${tag}] SUMMARY engine=${used} motion=${motion}: errorSheetEverVisible=${sheetSeen}, ${rejects.length} reject/throw/pageerror lines, ${lines.filter((l) => l.includes('unhandledrejection')).length} unhandled rejections${s && s.report ? ` | report: ${s.report.replace(/\s+/g, ' ')}` : ''}`;
    console.log(summary);
    writeFileSync(join(out, `${tag}.log`), `${[...lines, summary].join('\n')}\n`);
    await context.close();
    await browser.close();
    await site.close();
  }
  return { sheetSeen };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  const flag = (f) => {
    const i = args.indexOf(f);
    return i >= 0 ? args[i + 1] : null;
  };
  const engine = flag('--engine') || 'webkit';
  const out = flag('--out') || join(ROOT, 'out', 'shots', 'flow');
  const only = flag('--only');
  const variants = [
    { motion: true, tag: 'flow-motion' },
    { motion: false, tag: 'flow-reduce' },
    // A first visit on a slow connection, and a player who taps Open the lockbox at once.
    { motion: true, tag: 'flow-slowfonts-fast', slowFonts: 4000, fast: true },
    { motion: true, tag: 'flow-fast', fast: true },
    // Every font slow (the loading art's too), Reduce Motion on and off.
    { motion: true, tag: 'flow-slowall-fast', slowFonts: 4000, fast: true, allFonts: true },
    { motion: false, tag: 'flow-slowall-fast-reduce', slowFonts: 4000, fast: true, allFonts: true },
  ].filter((v) => !only || v.tag === only);
  (async () => {
    const seen = [];
    for (const v of variants) {
      const r = await runFlow({ engine, out, ...v });
      seen.push(`${v.tag}: errorSheetEverVisible=${r.sheetSeen}`);
    }
    console.log(`DIAG FLOWS: ${seen.join('; ')}`);
  })().then(
    () => process.exit(0),
    (e) => {
      console.error(e && e.stack ? e.stack : String(e));
      process.exit(1);
    },
  );
}
