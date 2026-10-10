// The sound engine (BUILD_PLAN 2.5, 13.1 to 13.3, S5 sound A1; GAME_DESIGN
// 13.3, 13.10, 13.11; Lead call 25). Preview only: ui/sound.js, the facade
// the UI calls, loads it, and only preview's game (ui/app.js) loads that.
//
// The graph: one GainNode per bus at its starting gain (13.11: body -10,
// weather -12, gear -12, water -14, bed -16, life -18, ui -20, music -6
// dB) into the master GainNode, into dsp.js's own lookahead limiter in an
// AudioWorklet ('master-limiter', limiter.worklet.js, ceiling -1 dBFS, 5 ms
// lookahead), into the speakers. Until the worklet's module has loaded the
// master goes straight to the speakers (A1 plays only quiet UI ticks); if
// it can't load, that stays, with the master at -3 dB, and the report says
// worklet: fallback and why. Never a DynamicsCompressorNode, whose
// behavior differs from engine to engine.
//
// The context is the unlock's (audio/unlock.js): the engine adopts it at
// every unlock, builds the graph, and renders every cue variant into a
// buffer with dsp.js (the same samples Node's goldens hash), so a tap only
// starts a buffer. The rest, from 13.10:
//   - the watchdog: every second while the page is visible and Sound is
//     on, a context that claims to run while its clock hasn't moved, or is
//     interrupted or suspended when nothing here suspended it, is stale;
//     the next tap suspends and resumes it (a kick), and if it is still
//     stale at the next check, the next tap closes it and unlocks a new
//     one (a rebuild). The report counts both.
//   - hidden: the master ramps to 0 over 50 ms, then the context suspends;
//     visible: it resumes (or the next tap does) and the master ramps up
//     over a second.
//   - 30 s with nothing playing suspends it (the battery); the next cue
//     resumes it, and cues come from taps.
//   - at most 12 sources at once, and per bus 4 UI, 6 life, 2 body and 4
//     gear voices: the oldest drops first.
//   - Sound off: the master ramps to 0 over 30 ms, then the context
//     suspends, and "off" is kept (storage key sound); on, inside the tap:
//     unlock if needed, resume, ramp up, and play ui.sound_on.
// A cue's variant comes from the engine's own sfc32, seeded once a page
// load from platform/rand.js: never an engine stream, a trip's seed or the
// log, so a sound can never change an outcome (Lead call 25).
//
// The debug menu's Render 10 s of this scene (registerAudioDev) builds the
// same graph in an OfflineAudioContext, plays ui_demo through it, and
// reports measure() and a 16 x 10 spectrum; it also renders every cue
// variant with dsp.js on this phone and compares each hash with the ones
// the build shipped in audio/sounds.json (dsp: match), which shows Safari's
// synthesis equals Node's bit for bit. The result rides in the bug report's
// audio field, with the state above.

import { BUSES, LIMITER, FALLBACK_DB, GOLDEN_RATE, dbToGain, renderCue, variantCount, sceneEvents, makeRandom, measure, spectrum, spectrumDigits, pcmHash, limitAll } from './dsp.js';
import { load, save } from '../platform/storage.js';
import { newSeed, CROCKFORD } from '../platform/rand.js';
import { registerDevAction } from '../ui/debug.js';
import { tx } from '../text.js';

/** The Sound state's storage key ("on" or "off", default on). */
export const SOUND_KEY = 'sound';
/** At most this many sources at once (13.11). */
export const VOICE_MAX = 12;
/** And at most this many on a bus (13.11). */
export const BUS_VOICE_MAX = Object.freeze({ ui: 4, life: 6, body: 2, gear: 4 });
/** The watchdog's period, and the idle time before the context suspends (ms). */
export const WATCH_MS = 1000;
export const IDLE_MS = 30000;
/** The master's ramps (ms): hidden, back, Sound off, Sound on. */
export const RAMPS = Object.freeze({ hide: 50, show: 1000, off: 30, on: 30 });
/** The limiter worklet: loaded only through audioWorklet.addModule, never imported (WebKit bug 221879). */
export const WORKLET_URL = new URL('./limiter.worklet.js', import.meta.url);
/** Its processor's name (not oph-: S01 keeps that prefix for storage), and the node's options: mono in and out, dsp.js's settings. */
export const WORKLET_NAME = 'master-limiter';
const NODE_OPTIONS = Object.freeze({ numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], channelCount: 1, channelCountMode: 'explicit', processorOptions: { ...LIMITER } });
/** The debug render: ui_demo, 10 s at 48 kHz, a 16 x 10 spectrum. */
export const RENDER = Object.freeze({ scene: 'ui_demo', seconds: 10, rate: GOLDEN_RATE, bands: 16, frames: 10 });

/**
 * @typedef {{play: (cue: string) => boolean, isOn: () => boolean, setOn: (on: boolean) => void, report: () => AudioReport}} SoundApi
 * @typedef {{v: 1, on: boolean, unlocked: boolean, session: string, state: string | null, rate: number | null, worklet: string, kicks: number, rebuilds: number, played: number, render: RenderResult | null}} AudioReport
 * @typedef {{path: 'worklet' | 'dsp' | 'none', ms: number, peakDb: number | null, truePeakDb: number | null, lufsI: number | null, lufsMMax: number | null, lufsSMax: number | null, spectrum: string, dsp: 'match' | 'differs' | 'error', differs: string[]}} RenderResult
 * @typedef {{setTimeout: (f: () => void, ms: number) => unknown, clearTimeout: (h: any) => void, setInterval: (f: () => void, ms: number) => unknown, clearInterval: (h: any) => void}} Timers
 */

/** The page's timers. @returns {Timers} */
const pageTimers = () => ({
  setTimeout: (f, ms) => setTimeout(f, ms),
  clearTimeout: (h) => clearTimeout(h),
  setInterval: (f, ms) => setInterval(f, ms),
  clearInterval: (h) => clearInterval(h),
});

/**
 * The sound's own generator: sfc32 (dsp.js makeRandom), seeded once from a
 * platform/rand.js seed (40 bits of crypto), never from the engine's
 * streams.
 * @param {string} [seed] 8 Crockford base32 characters
 */
export function variationRandom(seed = newSeed()) {
  let v = 0;
  for (const ch of seed) v = v * 32 + Math.max(0, CROCKFORD.indexOf(ch));
  const lo = v % 4294967296;
  const hi = Math.floor(v / 4294967296);
  return makeRandom((lo ^ Math.imul(hi, 0x9e3779b1)) >>> 0);
}

/** A promise's refusal, kept quiet (a refused resume is the watchdog's to retry). @param {any} p */
const quiet = (p) => {
  if (p && typeof p.catch === 'function') p.catch(() => {});
};

/** One decimal, or null for silence (the report's numbers). @param {number} x */
const r1 = (x) => (Number.isFinite(x) ? Math.round(x * 10) / 10 : null);

/**
 * The engine. doc: the page; unlock: audio/unlock.js's; the rest for tests.
 * @param {{doc: Document, unlock: import('./unlock.js').Unlock | null, store?: {load: (k: string) => any, save: (k: string, v: unknown) => boolean}, rand?: () => number, timers?: Timers, worklet?: URL, now?: () => number}} o
 */
export function createEngine({ doc, unlock, store = { load, save }, rand = variationRandom(), timers = pageTimers(), worklet = WORKLET_URL, now = () => performance.now() }) {
  const win = /** @type {any} */ (doc && doc.defaultView);
  let on = store.load(SOUND_KEY) !== 'off';
  /** @type {any} the cue bank (audio/sounds.json) */
  let bank = null;
  /** @type {AudioContext | null} */
  let ctx = null;
  /** @type {GainNode | null} */
  let master = null;
  /** @type {Map<string, GainNode>} */
  const buses = new Map();
  /** The master's level while playing: 1, or -3 dB without the limiter. */
  let level = 1;
  let worklet_ = 'none';
  let kicks = 0;
  let rebuilds = 0;
  let played = 0;
  /** @type {RenderResult | null} */
  let render = null;
  /** 0: well; 1: kick on the next tap; 2: rebuild on the next tap. */
  let stale = 0;
  let kicked = false;
  let lastTime = -1;
  /** True while this engine has suspended the context on purpose (off, hidden, idle). */
  let parked = false;
  let hidden = Boolean(doc && doc.visibilityState === 'hidden');
  /** @type {{src: AudioBufferSourceNode, bus: string}[]} oldest first */
  let voices = [];
  /** @type {Map<string, AudioBuffer>} */
  let buffers = new Map();
  /** @type {Map<string, number>} each cue's last variant, so none plays twice running */
  const lastVariant = new Map();
  /** @type {unknown} */
  let watch = null;
  /** @type {unknown} */
  let idle = null;

  /**
   * Ramp the master to a level over ms.
   * @param {number} target
   * @param {number} ms
   */
  function ramp(target, ms) {
    if (!ctx || !master) return;
    const p = master.gain;
    const t = ctx.currentTime;
    try {
      p.cancelScheduledValues(t);
      p.setValueAtTime(p.value, t);
      p.linearRampToValueAtTime(target, t + ms / 1000);
    } catch {
      p.value = target;
    }
  }

  function resume() {
    if (!ctx || ctx.state === 'closed') return;
    parked = false;
    try {
      ctx.resume().catch(() => {
        stale = Math.max(stale, 1); // refused outside a tap: the next tap does it
      });
    } catch {
      stale = Math.max(stale, 1);
    }
  }

  /** Suspend on purpose after ms (the ramp's length), if still wanted then (nothing resumed it). @param {number} ms @param {() => boolean} still */
  function park(ms, still) {
    parked = true;
    timers.setTimeout(() => {
      if (ctx && parked && still() && ctx.state !== 'closed') quiet(ctx.suspend());
    }, ms);
  }

  function check() {
    if (!ctx || !on || hidden) return;
    const t = ctx.currentTime;
    if (parked) {
      lastTime = t;
      return;
    }
    const st = /** @type {string} */ (ctx.state);
    // A closed context (a rebuild that failed) is stale too: the next taps kick, then rebuild it.
    const bad = st === 'interrupted' || st === 'suspended' || st === 'closed' || (st === 'running' && t === lastTime);
    lastTime = t;
    if (!bad) {
      stale = 0;
      kicked = false;
      return;
    }
    stale = kicked ? 2 : 1;
  }

  function startWatch() {
    if (watch !== null || !on || hidden) return;
    watch = timers.setInterval(check, WATCH_MS);
  }

  function stopWatch() {
    if (watch !== null) timers.clearInterval(watch);
    watch = null;
  }

  function idleCheck() {
    idle = null;
    if (!ctx || !on || hidden || parked) return;
    if (voices.length) {
      scheduleIdle();
      return;
    }
    park(0, () => voices.length === 0 && on);
  }

  function scheduleIdle() {
    if (idle !== null) timers.clearTimeout(idle);
    idle = timers.setTimeout(idleCheck, IDLE_MS);
  }

  /** The tap hook: the watchdog's kick, or its rebuild, inside the tap. */
  function onTap() {
    if (!ctx || !on || hidden) return;
    if (stale === 1) {
      kicks++;
      kicked = true;
      stale = 0;
      parked = false;
      try {
        quiet(ctx.suspend());
        quiet(ctx.resume());
      } catch {
        stale = 2;
      }
    } else if (stale === 2 && unlock) {
      rebuilds++;
      stale = 0;
      kicked = false;
      unlock.rebuild();
    }
  }

  /**
   * Adopt a context (at every unlock): the buses, the master, the limiter.
   * @param {AudioContext} c
   */
  function adopt(c) {
    if (c === ctx) return;
    for (const v of voices) {
      try {
        v.src.stop();
      } catch {
        // already stopped
      }
    }
    voices = [];
    buffers = new Map();
    ctx = c;
    level = 1;
    master = c.createGain();
    master.gain.value = on && !hidden ? level : 0;
    buses.clear();
    for (const [bus, db] of Object.entries(BUSES)) {
      const g = c.createGain();
      g.gain.value = dbToGain(db);
      g.connect(master);
      buses.set(bus, g);
    }
    master.connect(c.destination);
    loadLimiter(c, /** @type {GainNode} */ (master));
    stale = 0;
    kicked = false;
    parked = false;
    lastTime = c.currentTime;
    startWatch();
    scheduleIdle();
    timers.setTimeout(prerender, 0);
  }

  /**
   * Put dsp.js's limiter between the master and the speakers, once its
   * worklet has loaded; if it can't, the master stays straight to the
   * speakers at -3 dB.
   * @param {AudioContext} c
   * @param {GainNode} m
   */
  function loadLimiter(c, m) {
    const fallback = (/** @type {string} */ why) => {
      if (ctx !== c) return;
      worklet_ = `fallback: ${why}`;
      level = dbToGain(FALLBACK_DB);
      if (on && !hidden) ramp(level, RAMPS.on);
    };
    if (!c.audioWorklet || !win || typeof win.AudioWorkletNode !== 'function') {
      fallback('unsupported');
      return;
    }
    worklet_ = 'loading';
    let p;
    try {
      p = c.audioWorklet.addModule(worklet.href);
    } catch (e) {
      fallback(errName(e));
      return;
    }
    p.then(
      () => {
        if (ctx !== c) return;
        try {
          const node = new win.AudioWorkletNode(c, WORKLET_NAME, NODE_OPTIONS);
          m.disconnect();
          m.connect(node);
          node.connect(c.destination);
          worklet_ = 'on';
        } catch (e) {
          m.connect(c.destination);
          fallback(errName(e));
        }
      },
      (e) => fallback(errName(e)),
    );
  }

  /** A cue variant's buffer, rendered once. @param {string} id @param {number} v */
  function bufferFor(id, v) {
    const key = `${id}#${v}`;
    let b = buffers.get(key);
    if (!b && ctx) {
      const samples = renderCue(bank.cues[id], { rate: ctx.sampleRate, variant: v, bank, id });
      b = ctx.createBuffer(1, samples.length, ctx.sampleRate);
      b.getChannelData(0).set(samples);
      buffers.set(key, b);
    }
    return b || null;
  }

  /** Every cue variant into a buffer (after the unlock, off the tap). */
  function prerender() {
    if (!ctx || !bank) return;
    for (const [id, cue] of Object.entries(bank.cues)) for (let v = 0; v < variantCount(/** @type {any} */ (cue)); v++) bufferFor(id, v);
  }

  /** A variant from the sound's own generator, never the last one again. @param {string} id @param {number} n */
  function pickVariant(id, n) {
    if (n <= 1) return 0;
    let k = rand() % n;
    if (k === lastVariant.get(id)) k = (k + 1 + (rand() % (n - 1))) % n;
    lastVariant.set(id, k);
    return k;
  }

  /** Stop and drop the oldest voice (on a bus, or any). @param {string | null} bus */
  function dropOldest(bus) {
    const i = voices.findIndex((v) => bus === null || v.bus === bus);
    if (i < 0) return;
    const [v] = voices.splice(i, 1);
    try {
      v.src.stop();
    } catch {
      // already stopped
    }
  }

  /**
   * Play a cue: a no-op while Sound is off, before the unlock, while the
   * page is hidden, or before the bank has loaded. Returns whether it played.
   * @param {string} id
   */
  function play(id) {
    if (!on || !ctx || !bank || hidden || !bank.cues[id] || ctx.state === 'closed') return false;
    if (ctx.state !== 'running') resume(); // cues come from taps: the next cue resumes
    else parked = false; // an idle suspend not yet done is called off
    const cue = bank.cues[id];
    const buf = bufferFor(id, pickVariant(id, variantCount(cue)));
    const bus = buses.get(cue.bus);
    if (!buf || !bus) return false;
    const cap = /** @type {Record<string, number>} */ (BUS_VOICE_MAX)[cue.bus];
    while (cap !== undefined && voices.filter((v) => v.bus === cue.bus).length >= cap) dropOldest(cue.bus);
    while (voices.length >= VOICE_MAX) dropOldest(null);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(bus);
    const voice = { src, bus: cue.bus };
    src.onended = () => {
      voices = voices.filter((v) => v !== voice);
    };
    voices.push(voice);
    src.start(0);
    played++;
    scheduleIdle();
    return true;
  }

  /**
   * Sound on or off. Call it inside the tap that asks (turning it on may
   * unlock, which iOS allows only there).
   * @param {boolean} v
   */
  function setOn(v) {
    on = Boolean(v);
    store.save(SOUND_KEY, on ? 'on' : 'off');
    if (!on) {
      stopWatch();
      if (ctx) {
        ramp(0, RAMPS.off);
        park(RAMPS.off, () => !on);
      }
      return;
    }
    if (unlock && (!unlock.state().unlocked || !unlock.context())) unlock.unlockNow();
    else resume();
    if (ctx) ramp(level, RAMPS.on);
    startWatch();
    play('ui.sound_on');
  }

  function onVisibility() {
    hidden = doc.visibilityState === 'hidden';
    if (!ctx || !on) return;
    if (hidden) {
      stopWatch();
      ramp(0, RAMPS.hide);
      park(RAMPS.hide, () => hidden);
      return;
    }
    resume();
    if (master) {
      master.gain.value = 0;
      ramp(level, RAMPS.show);
    }
    lastTime = ctx.currentTime;
    startWatch();
    scheduleIdle();
  }

  /** @returns {AudioReport} */
  function report() {
    const u = unlock ? unlock.state() : null;
    return {
      v: 1,
      on,
      unlocked: Boolean(u && u.unlocked),
      session: u ? u.session : 'none',
      state: ctx ? String(ctx.state) : null,
      rate: ctx ? ctx.sampleRate : null,
      worklet: worklet_,
      kicks,
      rebuilds,
      played,
      render,
    };
  }

  /**
   * Render 10 s of ui_demo through the graph in an OfflineAudioContext
   * (the limiter in its worklet, or dsp.js's over the result if that won't
   * load), measure it, and check this phone's dsp.js against the shipped
   * hashes.
   * @returns {Promise<RenderResult>}
   */
  async function renderCheck() {
    const t0 = now();
    const OAC = win && (win.OfflineAudioContext || win.webkitOfflineAudioContext);
    /** @type {RenderResult} */
    let r = { path: 'none', ms: 0, peakDb: null, truePeakDb: null, lufsI: null, lufsMMax: null, lufsSMax: null, spectrum: '', dsp: 'error', differs: [] };
    if (!bank) {
      render = r;
      return r;
    }
    let samples = null;
    /** @type {'worklet' | 'dsp' | 'none'} */
    let path = 'none';
    if (OAC) {
      const off = /** @type {OfflineAudioContext} */ (new OAC(1, RENDER.rate * RENDER.seconds, RENDER.rate));
      const m = off.createGain();
      /** @type {Record<string, GainNode>} */
      const nodes = {};
      for (const [bus, db] of Object.entries(BUSES)) {
        nodes[bus] = off.createGain();
        nodes[bus].gain.value = dbToGain(db);
        nodes[bus].connect(m);
      }
      path = 'dsp';
      try {
        await off.audioWorklet.addModule(worklet.href);
        const node = new win.AudioWorkletNode(off, WORKLET_NAME, NODE_OPTIONS);
        m.connect(node);
        node.connect(off.destination);
        path = 'worklet';
      } catch {
        m.connect(off.destination);
      }
      /** @type {Map<string, AudioBuffer>} */
      const made = new Map();
      for (const e of sceneEvents(bank.scenes[RENDER.scene], bank)) {
        const key = `${e.cue}#${e.variant}`;
        let b = made.get(key);
        if (!b) {
          const s = renderCue(bank.cues[e.cue], { rate: RENDER.rate, variant: e.variant, bank, id: e.cue });
          b = off.createBuffer(1, s.length, RENDER.rate);
          b.getChannelData(0).set(s);
          made.set(key, b);
        }
        const src = off.createBufferSource();
        src.buffer = b;
        src.connect(nodes[bank.cues[e.cue].bus]);
        src.start(e.at);
      }
      const out = await off.startRendering();
      samples = out.getChannelData(0);
      if (path === 'dsp') samples = limitAll(samples, RENDER.rate);
    }
    const differs = [];
    const golden = (bank.golden && bank.golden.cues) || {};
    for (const [id, cue] of Object.entries(bank.cues)) {
      for (let v = 0; v < variantCount(/** @type {any} */ (cue)); v++) {
        const h = pcmHash(renderCue(/** @type {any} */ (cue), { rate: GOLDEN_RATE, variant: v, bank, id }));
        if (!golden[id] || golden[id][v] !== h) differs.push(`${id}#${v}`);
      }
    }
    r = { ...r, path, dsp: differs.length ? 'differs' : 'match', differs };
    if (samples) {
      const m = measure(samples, RENDER.rate);
      r = { ...r, peakDb: r1(m.peakDb), truePeakDb: r1(m.truePeakDb), lufsI: r1(m.lufsI), lufsMMax: r1(m.lufsMMax), lufsSMax: r1(m.lufsSMax), spectrum: spectrumDigits(spectrum(samples, RENDER.rate, { bands: RENDER.bands, frames: RENDER.frames })) };
    }
    r.ms = Math.round(now() - t0);
    render = r;
    return r;
  }

  if (unlock) {
    unlock.setIsOn(() => on);
    unlock.onTap(onTap);
    unlock.onUnlock(adopt);
  }
  if (doc) doc.addEventListener('visibilitychange', onVisibility);

  return {
    play,
    isOn: () => on,
    setOn,
    report,
    renderCheck,
    /** @param {any} b the cue bank (audio/sounds.json) */
    setBank: (b) => {
      bank = b;
      if (ctx) timers.setTimeout(prerender, 0);
    },
    /** Stop the timers and the listener (a page that drops its sound; tests). */
    dispose: () => {
      stopWatch();
      if (idle !== null) timers.clearTimeout(idle);
      idle = null;
      if (doc) doc.removeEventListener('visibilitychange', onVisibility);
    },
    /** For tests: the watchdog's check, the voices, the buses. */
    check,
    voices: () => voices.map((v) => v.bus),
    buses: () => new Map([...buses].map(([k, g]) => [k, g.gain.value])),
    master: () => master,
  };
}

/** @param {unknown} e */
function errName(e) {
  return String((e && /** @type {Error} */ (e).name) || 'error').slice(0, 40);
}

/**
 * Pure: the render's line's variables (dev.audio.result): the true peak and
 * the loudest 3 s, one decimal (-∞ for silence), and the dsp check.
 * @param {RenderResult | null} r null: the render failed
 */
export function renderVars(r) {
  if (!r) return { peak: '-', lufs: '-', dsp: 'error' };
  const one = (/** @type {number | null} */ x) => (x === null ? '-∞' : x.toFixed(1));
  return { peak: one(r.truePeakDb), lufs: one(r.lufsSMax), dsp: r.dsp === 'differs' ? `${r.dsp} (${r.differs.join(' ')})` : r.dsp };
}

/**
 * The dev action Render 10 s of this scene (preview's debug menu): runs
 * the engine's renderCheck and shows its line (dev.audio.result).
 * @param {{renderCheck: () => Promise<RenderResult>}} engine
 * @param {(a: import('../ui/debug.js').DevAction) => void} [register] the menu's registry (tests pass their own)
 */
export function registerAudioDev(engine, register = registerDevAction) {
  register({
    id: 'audio.render',
    label: 'dev.audio.render',
    run: ({ out }) => {
      out.textContent = '…';
      const show = (/** @type {RenderResult | null} */ r) => {
        const v = renderVars(r);
        tx(out, 'dev.audio.result', { peak: v.peak, lufs: v.lufs, dsp: v.dsp });
      };
      return engine.renderCheck().then(show, () => show(null));
    },
  });
}
