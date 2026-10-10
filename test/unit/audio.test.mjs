// The sound on the page (BUILD_PLAN S5 sound A1, 2.8, 13.3; GAME_DESIGN
// 13.10, 13.11; Lead call 25), against a fake Web Audio, a fake
// navigator.audioSession and fake timers: the unlock's order inside the
// tap, the Sound state, the watchdog's kick and rebuild, hidden and back,
// the idle suspend, the buses and the voice caps, the limiter's worklet and
// its fallback, the sound's own dice, the report's audio field, the
// 10-second render, and main's page never reaching any of it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, posix } from 'node:path';
import { createUnlock, setAmbient, UNLOCK_EVENTS } from '../../web/js/audio/unlock.js';
import { createEngine, registerAudioDev, renderVars, variationRandom, SOUND_KEY, VOICE_MAX, BUS_VOICE_MAX, WATCH_MS, IDLE_MS, RAMPS, WORKLET_NAME } from '../../web/js/audio/engine.js';
import { BUSES, FALLBACK_DB, dbToGain, makeRandom, renderCue } from '../../web/js/audio/dsp.js';
import { buildReport, audioField, provideAudio, devRegistry, REPORT_VERSION } from '../../web/js/ui/debug.js';
import { setBundle, NBSP } from '../../web/js/text.js';
import { loadAudio, cueHashes, shippedBank, readGolden } from '../../tools/listen.mjs';
import { build } from '../../tools/build.mjs';
import { ROOT } from '../../tools/pics.mjs';
import { fakeDocument } from './textfix.mjs';

const AUDIO = loadAudio();
/** The bank as the build ships it: the recipes and the 48 kHz hashes. */
const SHIPPED = shippedBank(AUDIO.bank, cueHashes(AUDIO.bank));
const GOLDEN = readGolden();
const near = (a, b, tol, what = '') => assert.ok(Math.abs(a - b) <= tol, `${what} ${a} vs ${b}`);

// ---- The fakes ------------------------------------------------------------

/** A fake Web Audio: contexts, nodes and params that record what is done to them. */
function fakeAudio({ worklet = 'resolve', session = 'ok', rate = 48000 } = {}) {
  const log = [];
  const contexts = [];
  class Param {
    constructor(v) {
      this.value = v;
      this.events = [];
    }
    cancelScheduledValues(t) {
      this.events.push(['cancel', t]);
    }
    setValueAtTime(v, t) {
      this.events.push(['set', v, t]);
    }
    linearRampToValueAtTime(v, t) {
      this.events.push(['ramp', v, t]);
    }
  }
  class Node {
    constructor(ctx, kind) {
      this.ctx = ctx;
      this.kind = kind;
      this.outs = [];
    }
    connect(n) {
      this.outs.push(n);
      return n;
    }
    disconnect() {
      this.outs = [];
    }
  }
  class Gain extends Node {
    constructor(ctx) {
      super(ctx, 'gain');
      this.gain = new Param(1);
    }
  }
  class Source extends Node {
    constructor(ctx) {
      super(ctx, 'source');
      this.buffer = null;
      this.started = null;
      this.stopped = false;
      this.onended = null;
    }
    start(t = 0) {
      this.started = t;
      log.push(['start', this.buffer ? this.buffer.length : null]);
      this.ctx.sources.push(this);
    }
    stop() {
      this.stopped = true;
    }
    end() {
      if (this.onended) this.onended();
    }
  }
  class Buffer {
    constructor(ch, len, r) {
      this.length = len;
      this.sampleRate = r;
      this.data = new Float32Array(len);
    }
    getChannelData() {
      return this.data;
    }
  }
  const addModule = (ctx) => (url) => {
    ctx.calls.push(['addModule', String(url)]);
    if (worklet === 'reject') return Promise.reject(Object.assign(new Error('no'), { name: 'AbortError' }));
    if (worklet === 'pending') return new Promise(() => {});
    return Promise.resolve();
  };
  class Ctx {
    constructor(opts) {
      log.push(['context', opts]);
      this.opts = opts;
      this.state = 'running';
      this.currentTime = 0;
      this.sampleRate = rate;
      this.destination = new Node(this, 'destination');
      this.sources = [];
      this.calls = [];
      this.audioWorklet = { addModule: addModule(this) };
      contexts.push(this);
    }
    createGain() {
      return new Gain(this);
    }
    createBufferSource() {
      return new Source(this);
    }
    createBuffer(ch, len, r) {
      log.push(['buffer', len]);
      return new Buffer(ch, len, r);
    }
    resume() {
      this.calls.push('resume');
      log.push(['resume']);
      this.state = 'running';
      return Promise.resolve();
    }
    suspend() {
      this.calls.push('suspend');
      this.state = 'suspended';
      return Promise.resolve();
    }
    close() {
      this.calls.push('close');
      this.state = 'closed';
      return Promise.resolve();
    }
  }
  /** An offline context that mixes what is scheduled through its gain nodes (the worklet passes it as is). */
  class Offline extends Ctx {
    constructor(ch, len, r) {
      super({ offline: true });
      this.length = len;
      this.sampleRate = r;
    }
    startRendering() {
      const out = new Float64Array(this.length);
      const gainTo = (n) => {
        if (n.kind === 'destination') return 1;
        for (const o of n.outs) {
          const g = gainTo(o);
          if (g !== null) return g * (n.kind === 'gain' ? n.gain.value : 1);
        }
        return null;
      };
      for (const s of this.sources) {
        const g = gainTo(s);
        if (g === null) continue;
        const at = Math.round(s.started * this.sampleRate);
        for (let i = 0; i < s.buffer.length && at + i < out.length; i++) out[at + i] += s.buffer.data[i] * g;
      }
      const b = new Buffer(1, this.length, this.sampleRate);
      b.data.set(out);
      return Promise.resolve(b);
    }
  }
  class WorkletNode extends Node {
    constructor(ctx, name, opts) {
      super(ctx, 'worklet');
      this.name = name;
      this.opts = opts;
    }
  }
  const audioSession =
    session === 'none'
      ? undefined
      : {
          t: 'auto',
          get type() {
            return this.t;
          },
          set type(v) {
            if (session === 'throw') throw new Error('refused');
            log.push(['session', v]);
            this.t = v;
          },
        };
  return { log, contexts, Ctx, Offline, WorkletNode, audioSession };
}

/** A page: listeners with their options, visibility, and a window with the fake audio. */
function fakePage(audio, { withAudio = true } = {}) {
  const listeners = [];
  const win = {
    navigator: { audioSession: audio.audioSession },
    ...(withAudio ? { AudioContext: audio.Ctx, AudioWorkletNode: audio.WorkletNode, OfflineAudioContext: audio.Offline } : {}),
  };
  const doc = {
    defaultView: win,
    visibilityState: 'visible',
    addEventListener(type, f, opts) {
      listeners.push({ type, f, opts });
    },
    removeEventListener(type, f) {
      const i = listeners.findIndex((l) => l.type === type && l.f === f);
      if (i >= 0) listeners.splice(i, 1);
    },
    fire(type) {
      for (const l of [...listeners]) if (l.type === type) l.f({ type });
    },
    listeners,
  };
  return { doc, win };
}

/** Fake timers, advanced by hand. */
function fakeTimers() {
  let now = 0;
  let id = 0;
  const q = new Map();
  return {
    setTimeout(f, ms) {
      q.set(++id, { f, at: now + ms, every: 0 });
      return id;
    },
    clearTimeout(h) {
      q.delete(h);
    },
    setInterval(f, ms) {
      q.set(++id, { f, at: now + ms, every: ms });
      return id;
    },
    clearInterval(h) {
      q.delete(h);
    },
    advance(ms) {
      const end = now + ms;
      for (;;) {
        let next = null;
        for (const [k, t] of q) if (t.at <= end && (!next || t.at < next[1].at)) next = [k, t];
        if (!next) break;
        const [k, t] = next;
        now = t.at;
        if (t.every) t.at += t.every;
        else q.delete(k);
        t.f();
      }
      now = end;
    },
    intervals: () => [...q.values()].filter((t) => t.every).length,
  };
}

const memoryStore = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { load: (k) => (m.has(k) ? m.get(k) : null), save: (k, v) => (m.set(k, v), true), m };
};

/** A page with the unlock and the engine on it, the real bank in. */
function rig({ stored = {}, worklet = 'resolve', session = 'ok', bank = SHIPPED, seed = 1 } = {}) {
  const audio = fakeAudio({ worklet, session });
  const { doc, win } = fakePage(audio);
  const store = memoryStore(stored);
  const timers = fakeTimers();
  const unlock = createUnlock({ doc, isOn: () => store.load(SOUND_KEY) !== 'off' });
  const engine = createEngine({ doc, unlock, store, timers, rand: makeRandom(seed), now: () => 0 });
  engine.setBank(bank);
  return { audio, doc, win, store, timers, unlock, engine, ctx: () => audio.contexts[audio.contexts.length - 1] };
}

const settle = () => new Promise((r) => setTimeout(r, 0));
const masterRamps = (engine) => engine.master().gain.events.filter((e) => e[0] === 'ramp');

// ---- The unlock -------------------------------------------------------------

test('the unlock: on touchend or click, never touchstart; inside the handler, in order: the ambient session, the context, one silent frame (BUILD_PLAN 2.8, 13.3)', () => {
  for (const type of ['touchend', 'click']) {
    const audio = fakeAudio();
    const { doc } = fakePage(audio);
    const unlock = createUnlock({ doc });
    assert.deepEqual(
      doc.listeners.map((l) => [l.type, l.opts]),
      [
        ['touchend', { capture: true, passive: true }],
        ['click', { capture: true, passive: true }],
      ],
      'capture phase, passive',
    );
    doc.fire('touchstart');
    doc.fire('pointerdown');
    assert.deepEqual(audio.log, [], 'touchstart can be a scroll: nothing');
    doc.fire(type);
    // All of it happened before the handler returned (the log is read right after).
    assert.deepEqual(audio.log, [['session', 'ambient'], ['context', { latencyHint: 'interactive' }], ['buffer', 1], ['start', 1]], type);
    assert.deepEqual(unlock.state(), { unlocked: true, session: 'ambient', taps: 1, error: null });
    // The next tap makes no second context.
    doc.fire(type);
    assert.equal(audio.contexts.length, 1);
    // A context that was suspended is resumed by the unlock's step 2, not replaced.
    audio.contexts[0].state = 'suspended';
    unlock.unlockNow();
    assert.equal(audio.contexts.length, 1);
    assert.ok(audio.contexts[0].calls.includes('resume'));
  }
  assert.deepEqual([...UNLOCK_EVENTS], ['touchend', 'click']);
  // Where Safari has no audioSession, or refuses it, the outcome says so.
  assert.equal(setAmbient({}), 'unsupported');
  assert.equal(setAmbient(null), 'unsupported');
  assert.equal(setAmbient({ audioSession: fakeAudio({ session: 'throw' }).audioSession }), 'error');
  assert.equal(setAmbient({ audioSession: { type: 'auto' } }), 'ambient');
  // Never playback.
  const src = readFileSync(join(ROOT, 'web', 'js', 'audio', 'unlock.js'), 'utf8');
  assert.ok(!/type\s*=\s*['"]playback/.test(src) && /\.type = 'ambient'/.test(src));
  assert.ok(!/touchstart'/.test(src.replace(/^\/\/.*$/gm, '')), 'touchstart is never listened to');
  // No AudioContext at all: nothing throws, nothing unlocks.
  const bare = fakeAudio();
  const page = fakePage(bare, { withAudio: false });
  const u = createUnlock({ doc: page.doc });
  page.doc.fire('touchend');
  assert.deepEqual(u.state(), { unlocked: false, session: 'ambient', taps: 1, error: 'unsupported' });
});

test("Sound: no unlock while it's off; off ramps down, suspends and keeps \"off\"; on, inside the tap, keeps \"on\", unlocks and plays ui.sound_on", async () => {
  const r = rig({ stored: { sound: 'off' } });
  assert.equal(r.engine.isOn(), false);
  r.doc.fire('touchend');
  r.doc.fire('click');
  assert.equal(r.audio.contexts.length, 0, 'no unlock while Sound is off');
  assert.equal(r.engine.play('ui.tick'), false);
  // The status line's tap turns it on: the unlock happens in that tap.
  r.engine.setOn(true);
  assert.equal(r.store.load(SOUND_KEY), 'on');
  assert.equal(r.audio.contexts.length, 1);
  assert.deepEqual(r.audio.log.slice(0, 4), [['session', 'ambient'], ['context', { latencyHint: 'interactive' }], ['buffer', 1], ['start', 1]]);
  const soundOn = renderCue(AUDIO.bank.cues['ui.sound_on'], { rate: 48000, variant: 0, bank: AUDIO.bank, id: 'ui.sound_on' });
  assert.deepEqual(r.audio.log.at(-1), ['start', soundOn.length], 'ui.sound_on plays');
  assert.equal(r.engine.report().played, 1);
  // Off: the master ramps to 0 over 30 ms, then the context suspends.
  const ctx = r.ctx();
  r.engine.setOn(false);
  assert.equal(r.store.load(SOUND_KEY), 'off');
  assert.deepEqual(masterRamps(r.engine).at(-1), ['ramp', 0, RAMPS.off / 1000]);
  assert.ok(!ctx.calls.includes('suspend'));
  r.timers.advance(RAMPS.off);
  assert.ok(ctx.calls.includes('suspend'));
  assert.equal(r.engine.play('ui.tick'), false, 'silent while off');
  r.doc.fire('touchend');
  assert.equal(r.audio.contexts.length, 1);
  // On again: resume, ramp up, the cue.
  r.engine.setOn(true);
  assert.equal(ctx.calls.at(-1), 'resume');
  assert.deepEqual(masterRamps(r.engine).at(-1), ['ramp', 1, RAMPS.on / 1000]);
  assert.equal(r.engine.report().played, 2);
  await settle();
});

test('the graph: eight buses at 13.11\'s gains into the master, the limiter worklet between it and the speakers; a rejected worklet keeps the fallback at -3 dB and says why', async () => {
  const r = rig();
  r.doc.fire('touchend');
  const ctx = r.ctx();
  assert.deepEqual(Object.fromEntries(r.engine.buses()), Object.fromEntries(Object.entries(BUSES).map(([k, db]) => [k, dbToGain(db)])));
  assert.deepEqual(BUSES, { body: -10, weather: -12, gear: -12, water: -14, bed: -16, life: -18, ui: -20, music: -6 });
  const master = r.engine.master();
  assert.equal(master.gain.value, 1);
  assert.deepEqual(master.outs.map((n) => n.kind), ['destination'], 'straight to the speakers until the worklet loads');
  assert.equal(ctx.calls[0][0], 'addModule');
  assert.match(ctx.calls[0][1], /\/js\/audio\/limiter\.worklet\.js$/);
  assert.equal(r.engine.report().worklet, 'loading');
  await settle();
  assert.deepEqual(master.outs.map((n) => n.kind), ['worklet']);
  const node = master.outs[0];
  assert.equal(node.name, WORKLET_NAME);
  assert.deepEqual(node.opts.processorOptions, { ceilingDb: -1, lookaheadMs: 5, releaseMs: 80 });
  assert.deepEqual(node.opts.outputChannelCount, [1]);
  assert.deepEqual(node.outs.map((n) => n.kind), ['destination']);
  assert.equal(r.engine.report().worklet, 'on');
  // Never a DynamicsCompressorNode.
  for (const f of ['engine.js', 'dsp.js', 'limiter.worklet.js', 'unlock.js']) assert.ok(!/DynamicsCompressor/.test(readFileSync(join(ROOT, 'web', 'js', 'audio', f), 'utf8').replace(/^\s*\/\/.*$/gm, '')), f);
  // A worklet that won't load: the master stays on the speakers, at -3 dB.
  const bad = rig({ worklet: 'reject' });
  bad.doc.fire('touchend');
  await settle();
  assert.equal(bad.engine.report().worklet, 'fallback: AbortError');
  assert.deepEqual(bad.engine.master().outs.map((n) => n.kind), ['destination']);
  assert.deepEqual(masterRamps(bad.engine).at(-1)[1], dbToGain(FALLBACK_DB));
  // No AudioWorkletNode at all.
  const old = rig();
  delete old.win.AudioWorkletNode;
  old.doc.fire('touchend');
  assert.equal(old.engine.report().worklet, 'fallback: unsupported');
});

test('voices: at most 4 on the UI bus and 12 in all; the oldest drops first (13.11)', () => {
  const r = rig();
  r.doc.fire('touchend');
  const ctx = r.ctx();
  for (let i = 0; i < 5; i++) assert.equal(r.engine.play('ui.tick'), true);
  assert.equal(BUS_VOICE_MAX.ui, 4);
  assert.equal(r.engine.voices().length, 4);
  assert.deepEqual(ctx.sources.map((s) => s.stopped), [false, true, false, false, false, false], 'the silent frame, then the oldest tick stopped');
  // A source that ends leaves its place.
  ctx.sources[2].end();
  assert.equal(r.engine.voices().length, 3);
  // Twelve in all: a bed cue (no bus cap) thirteen times.
  const bank = { ...SHIPPED, cues: { ...SHIPPED.cues, 'bed.hush': { ...SHIPPED.cues['ui.tick'], bus: 'bed' } } };
  const b = rig({ bank });
  b.doc.fire('touchend');
  const bctx = b.ctx();
  for (let i = 0; i < 13; i++) b.engine.play('bed.hush');
  assert.equal(VOICE_MAX, 12);
  assert.equal(b.engine.voices().length, 12);
  const ticks = bctx.sources.slice(1);
  assert.equal(ticks.length, 13);
  assert.deepEqual(ticks.map((s) => s.stopped), [true, ...Array(12).fill(false)], 'the 13th source dropped the oldest');
  assert.equal(b.engine.play('no.such_cue'), false);
});

test('the watchdog: a stuck clock is kicked on the next tap (suspend, then resume), and rebuilt on the one after if still stuck; interrupted resumes on the next tap (13.10)', () => {
  const r = rig();
  r.doc.fire('touchend');
  const first = r.ctx();
  // The clock moves: all is well.
  first.currentTime = 0.5;
  r.timers.advance(WATCH_MS);
  first.currentTime = 1.5;
  r.timers.advance(WATCH_MS);
  r.doc.fire('touchend');
  assert.deepEqual(first.calls.filter((c) => typeof c === 'string'), [], 'nothing to do');
  // Now it stops: the next check marks it stale, and the next tap kicks it.
  r.timers.advance(WATCH_MS);
  assert.deepEqual(first.calls.filter((c) => typeof c === 'string'), [], 'no kick outside a tap');
  r.doc.fire('touchend');
  assert.deepEqual(first.calls.filter((c) => typeof c === 'string'), ['suspend', 'resume'], 'both inside the tap, in that order');
  assert.equal(r.engine.report().kicks, 1);
  // Still stuck at the next check: the next tap rebuilds.
  r.timers.advance(WATCH_MS);
  r.doc.fire('touchend');
  assert.ok(first.calls.includes('close'));
  assert.equal(r.audio.contexts.length, 2, 'a new context');
  assert.equal(r.engine.report().rebuilds, 1);
  assert.equal(r.engine.master().ctx, r.ctx(), 'the engine adopted it');
  assert.equal(r.engine.play('ui.tick'), true);
  // Interrupted (a call, the lock screen): the next tap resumes it.
  const ctx = r.ctx();
  ctx.state = 'interrupted';
  ctx.currentTime = 9;
  r.timers.advance(WATCH_MS);
  r.doc.fire('click');
  assert.ok(ctx.calls.includes('resume'));
  assert.equal(ctx.state, 'running');
  assert.equal(r.engine.report().kicks, 2);
  // A healthy check clears the kick; then a context that ended up closed is rebuilt too, two taps on.
  ctx.currentTime = 10;
  r.timers.advance(WATCH_MS);
  ctx.state = 'closed';
  r.timers.advance(WATCH_MS);
  r.doc.fire('touchend');
  assert.equal(r.engine.report().kicks, 3);
  r.timers.advance(WATCH_MS);
  r.doc.fire('touchend');
  assert.equal(r.engine.report().rebuilds, 2);
  assert.equal(r.audio.contexts.length, 3);
  assert.equal(r.ctx().state, 'running');
});

test('hidden: the master ramps to 0 over 50 ms, then the context suspends; back: it resumes and ramps up over a second; 30 s with nothing playing suspends it, and the next cue resumes it', () => {
  const r = rig();
  r.doc.fire('touchend');
  const ctx = r.ctx();
  ctx.currentTime = 2;
  r.doc.visibilityState = 'hidden';
  r.doc.fire('visibilitychange');
  assert.deepEqual(masterRamps(r.engine).at(-1), ['ramp', 0, 2 + RAMPS.hide / 1000]);
  assert.equal(r.timers.intervals(), 0, 'the watchdog sleeps while hidden');
  r.timers.advance(RAMPS.hide);
  assert.ok(ctx.calls.includes('suspend'));
  assert.equal(r.engine.play('ui.tick'), false, 'nothing plays while hidden');
  r.doc.visibilityState = 'visible';
  r.doc.fire('visibilitychange');
  assert.equal(ctx.calls.at(-1), 'resume');
  assert.deepEqual(masterRamps(r.engine).at(-1), ['ramp', 1, 2 + RAMPS.show / 1000]);
  assert.equal(r.timers.intervals(), 1, 'and wakes when it is back');
  // Idle: 30 s with nothing playing.
  const before = ctx.calls.filter((c) => c === 'suspend').length;
  r.timers.advance(IDLE_MS - 1);
  assert.equal(ctx.calls.filter((c) => c === 'suspend').length, before);
  ctx.currentTime = 40; // a moving clock, so the watchdog has nothing to say
  r.timers.advance(1);
  assert.equal(ctx.calls.filter((c) => c === 'suspend').length, before + 1, 'suspended for the battery');
  assert.equal(r.engine.report().state, 'suspended');
  // The parked context isn't stale: a tap leaves it be; a cue resumes it.
  r.timers.advance(WATCH_MS * 3);
  r.doc.fire('touchend');
  assert.equal(r.engine.report().kicks, 0);
  assert.equal(r.engine.play('ui.tick'), true);
  assert.equal(ctx.calls.at(-1), 'resume');
  // A playing voice holds the idle suspend off.
  const n = ctx.calls.filter((c) => c === 'suspend').length;
  r.timers.advance(IDLE_MS);
  assert.equal(ctx.calls.filter((c) => c === 'suspend').length, n, 'a voice still sounding');
});

test("variations come from the sound's own generator, never the engine's streams (Lead call 25); a cue never plays the same variant twice running", () => {
  // Tell the variants apart by the buffers the engine made (one per variant).
  const variantsOf = (seed) => {
    const r = rig({ seed });
    r.doc.fire('touchend');
    const order = [];
    for (let i = 0; i < 12; i++) {
      r.engine.play('ui.tick');
      const src = r.ctx().sources.at(-1);
      order.push(src.buffer);
    }
    const ids = new Map();
    return order.map((b) => {
      if (!ids.has(b)) ids.set(b, ids.size);
      return ids.get(b);
    });
  };
  const a = variantsOf(5);
  assert.deepEqual(variantsOf(5), a, 'the same generator, the same picks');
  for (let i = 1; i < a.length; i++) assert.notEqual(a[i], a[i - 1], 'never twice running');
  assert.ok(new Set(a).size >= 3, 'the variants all get their turn');
  assert.ok(new Set(a).size <= 4);
  // Seeded once a page load from platform/rand.js, never from a trip's seed.
  const r1 = variationRandom('K7QM2Q9F');
  const r2 = variationRandom('K7QM2Q9F');
  assert.deepEqual([r1(), r1(), r1()], [r2(), r2(), r2()]);
  const engineSrc = readFileSync(join(ROOT, 'web', 'js', 'audio', 'engine.js'), 'utf8');
  assert.match(engineSrc, /import \{ newSeed, CROCKFORD \} from '\.\.\/platform\/rand\.js';/);
  assert.match(engineSrc, /rand = variationRandom\(\)/);
  // No audio module reaches the engine's generator or its streams.
  const seen = new Set();
  const walk = (rel) => {
    if (seen.has(rel)) return;
    seen.add(rel);
    const src = readFileSync(join(ROOT, 'web', rel), 'utf8');
    for (const m of src.matchAll(/^\s*(?:import|export)\s[^;]*?from\s+'([^']+)'/gms)) walk(posix.normalize(posix.join(dirname(rel), m[1])));
  };
  for (const f of ['js/audio/engine.js', 'js/audio/dsp.js', 'js/audio/unlock.js', 'js/audio/limiter.worklet.js', 'js/ui/sound.js']) walk(f);
  assert.ok(seen.has('js/engine/math.js'), `the walk follows imports (${seen.size})`);
  assert.ok(!seen.has('js/engine/rng.js'), "the sound never imports the engine's rng");
  assert.ok(![...seen].some((f) => /js\/engine\/(step|api|trip|phase)\.js$/.test(f)), 'nor anything that steps a trip');
});

test("the report's audio field: the sound's state, field by field; main's report keeps version 2 and S3's keys", async () => {
  const r = rig();
  const before = r.engine.report();
  assert.deepEqual(Object.keys(before), ['v', 'on', 'unlocked', 'session', 'state', 'rate', 'worklet', 'kicks', 'rebuilds', 'played', 'render']);
  assert.deepEqual(before, { v: 1, on: true, unlocked: false, session: 'none', state: null, rate: null, worklet: 'none', kicks: 0, rebuilds: 0, played: 0, render: null });
  r.doc.fire('touchend');
  await settle();
  r.engine.play('ui.tick');
  assert.deepEqual(r.engine.report(), { v: 1, on: true, unlocked: true, session: 'ambient', state: 'running', rate: 48000, worklet: 'on', kicks: 0, rebuilds: 0, played: 1, render: null });
  // buildReport: with the sound loaded (preview), an audio field; without (main), none.
  const facts = { build: 'x', device: {}, worker: {}, storage: {}, keys: [], errors: [], note: '', state: null };
  const plain = buildReport(facts);
  assert.equal(plain.report, REPORT_VERSION);
  assert.equal(REPORT_VERSION, 2);
  assert.deepEqual(Object.keys(plain), ['report', 'build', 'commit', 'rules', 'channel', 'time', 'screen', 'device', 'app', 'selfcheck', 'errors', 'note', 'state']);
  const withAudio = buildReport({ ...facts, audio: { ...r.engine.report(), extra: 'never', render: { path: 'worklet', ms: 812, peakDb: -Infinity, truePeakDb: -21.9, lufsI: null, lufsMMax: -41.9, lufsSMax: -46.3, spectrum: '0'.repeat(500), dsp: 'match', differs: [], secret: 1 } } });
  assert.deepEqual(Object.keys(withAudio).at(-1), 'audio');
  assert.deepEqual(withAudio.audio, {
    v: 1,
    on: true,
    unlocked: true,
    session: 'ambient',
    state: 'running',
    rate: 48000,
    worklet: 'on',
    kicks: 0,
    rebuilds: 0,
    played: 1,
    render: { path: 'worklet', ms: 812, peakDb: null, truePeakDb: -21.9, lufsI: null, lufsMMax: -41.9, lufsSMax: -46.3, spectrum: '0'.repeat(200), dsp: 'match', differs: [] },
  });
  assert.equal(audioField(null), null);
  assert.equal(JSON.stringify(withAudio).length < 60000, true);
  provideAudio(null);
});

test("Render 10 s of this scene: ui_demo through the graph in an offline context, measured like Node's, and this phone's dsp.js checked against the shipped hashes", async (t) => {
  const r = rig();
  const res = await r.engine.renderCheck();
  assert.equal(res.path, 'worklet');
  assert.equal(res.dsp, 'match');
  assert.deepEqual(res.differs, []);
  const g = GOLDEN.scenes.ui_demo.measure;
  near(res.truePeakDb, g.truePeakDb, 0.1, 'true peak');
  near(res.lufsSMax, g.lufsSMax, 0.1, 'short-term');
  near(res.lufsI, g.lufsI, 0.1, 'integrated');
  assert.match(res.spectrum, /^([0-9]{16} ){9}[0-9]{16}$/);
  assert.deepEqual(r.engine.report().render, res, 'the report carries it');
  const off = r.audio.contexts.find((c) => c.opts && c.opts.offline);
  assert.equal(off.length, 480000);
  // Without the worklet, dsp.js's limiter runs over the result.
  const fb = rig({ worklet: 'reject' });
  const res2 = await fb.engine.renderCheck();
  assert.equal(res2.path, 'dsp');
  near(res2.truePeakDb, g.truePeakDb, 0.1);
  // A phone whose synthesis differs says which cues.
  const bank = JSON.parse(JSON.stringify(SHIPPED));
  bank.golden.cues['ui.open'][2] = '00000000';
  const d = rig({ bank });
  const res3 = await d.engine.renderCheck();
  assert.equal(res3.dsp, 'differs');
  assert.deepEqual(res3.differs, ['ui.open#2']);
  // The dev action: registered under its dev words, and its line in them.
  const words = JSON.parse(readFileSync(join(ROOT, 'content', 'text', 'en', 'dev.json'), 'utf8'));
  setBundle(Object.fromEntries(Object.entries(words).map(([k, v]) => [k, v.text])), {}, 'preview');
  t.after(() => setBundle({}, {}, null));
  /** @type {any} */
  let action = null;
  registerAudioDev(r.engine, (a) => {
    action = a;
  });
  assert.deepEqual([action.id, action.label], ['audio.render', 'dev.audio.render']);
  const out = fakeDocument().createElement('p');
  const running = action.run({ doc: null, close() {}, out });
  assert.equal(out.textContent, '…', 'at once, while it renders');
  await running;
  // S6: a line's " · " binds to what follows with a no-break space (text.js), so a row never ends on the dot.
  assert.equal(out.textContent, `Sound: peak ${res.truePeakDb.toFixed(1)} dBFS ·${NBSP}${res.lufsSMax.toFixed(1)} LUFS ·${NBSP}dsp match`);
  assert.equal(out.getAttribute('data-t'), 'dev.audio.result');
  assert.deepEqual(renderVars(res3), { peak: res3.truePeakDb.toFixed(1), lufs: res3.lufsSMax.toFixed(1), dsp: 'differs (ui.open#2)' });
  assert.deepEqual(renderVars(null), { peak: '-', lufs: '-', dsp: 'error' });
  assert.deepEqual(renderVars({ ...res, truePeakDb: null, lufsSMax: null }), { peak: '-∞', lufs: '-∞', dsp: 'match' });
  // And the real registry: the menu draws it on preview.
  registerAudioDev(r.engine);
  assert.ok(devRegistry().actions.includes('audio.render'));
  // A page with no offline context still answers (the dsp check, no measure).
  const none = rig();
  delete none.win.OfflineAudioContext;
  const res4 = await none.engine.renderCheck();
  assert.equal(res4.path, 'none');
  assert.equal(res4.dsp, 'match');
  assert.equal(res4.truePeakDb, null);
});

test('main never reaches the sound: no static path from its page to js/audio/ or js/ui/sound.js; both channels ship the same audio/sounds.json, with its golden hashes', (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-audio-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const out = { main: join(tmp, 'main'), preview: join(tmp, 'preview') };
  for (const channel of ['main', 'preview']) build({ out: out[channel], channel, quiet: true });
  const seen = new Set();
  const walk = (rel) => {
    if (seen.has(rel)) return;
    seen.add(rel);
    const src = readFileSync(join(out.main, rel), 'utf8');
    for (const m of src.matchAll(/^\s*(?:import|export)\s[^;]*?from\s+'([^']+)'/gms)) walk(posix.normalize(posix.join(dirname(rel), m[1])));
    for (const m of src.matchAll(/^import\s+'([^']+)'/gm)) walk(posix.normalize(posix.join(dirname(rel), m[1])));
  };
  walk('js/boot.js');
  walk('js/main.js');
  assert.ok(seen.has('js/ui/debug.js'), `the walk follows imports (${seen.size} modules)`);
  assert.ok(![...seen].some((f) => f.startsWith('js/audio/')), "main's page never reaches the sound");
  assert.ok(!seen.has('js/ui/sound.js') && !seen.has('js/ui/app.js'));
  // The game (preview's only, behind home.js's gate) is what imports the unlock and the facade.
  const app = readFileSync(join(out.preview, 'js', 'ui', 'app.js'), 'utf8');
  assert.match(app, /^import \{ createUnlock \} from '\.\.\/audio\/unlock\.js';$/m);
  assert.match(app, /import\('\.\/sound\.js'\)/);
  // File parity: the same bank on both channels, the hashes stamped in, the notes left out.
  const a = readFileSync(join(out.main, 'audio', 'sounds.json'), 'utf8');
  assert.equal(readFileSync(join(out.preview, 'audio', 'sounds.json'), 'utf8'), a);
  const shipped = JSON.parse(a);
  assert.deepEqual(shipped, SHIPPED);
  assert.deepEqual(shipped.golden, { rate: 48000, cues: GOLDEN.cues['48000'] });
  assert.ok(!/"when"|"what"|\$comment/.test(a), 'no authoring notes ship');
  // Preview's worker precaches the sound, so it plays offline; main's never downloads it (its page never loads it).
  const pre = (ch) => JSON.parse(readFileSync(join(out[ch], 'precache.json'), 'utf8')).paths;
  for (const f of ['audio/sounds.json', 'js/audio/engine.js', 'js/audio/dsp.js', 'js/audio/unlock.js', 'js/audio/limiter.worklet.js', 'js/ui/sound.js']) {
    assert.ok(pre('preview')[f], `preview precaches ${f} (offline)`);
    assert.ok(!pre('main')[f], `main ships ${f} and never precaches it`);
  }
  // Main's words carry none of the sound's dev lines.
  const mainWords = JSON.parse(readFileSync(join(out.main, 'text', 'en.json'), 'utf8'));
  assert.ok(!('dev.audio.render' in mainWords) && !('dev.audio.result' in mainWords));
  const previewWords = JSON.parse(readFileSync(join(out.preview, 'text', 'en.json'), 'utf8'));
  assert.equal(previewWords['dev.audio.render'], 'Render 10 s of this scene');
});

test('the facade (ui/sound.js): the bank from audio/sounds.json, the unlock the game installed, the report and the dev action; a no-op before the first tap', async () => {
  const { createSound } = await import('../../web/js/ui/sound.js');
  const audio = fakeAudio();
  const { doc } = fakePage(audio);
  doc.documentElement = { getAttribute: (k) => (k === 'data-screens' ? 'app debug title guestbook trail' : null) };
  const unlock = createUnlock({ doc });
  const asked = [];
  const fetchFn = async (url) => {
    asked.push(url.pathname);
    return { ok: true, json: async () => JSON.parse(JSON.stringify(SHIPPED)) };
  };
  const timers = fakeTimers();
  const sound = createSound({ doc, unlock, fetchFn, timers });
  assert.deepEqual(Object.keys(sound).sort(), ['engine', 'isOn', 'loaded', 'play', 'report', 'setOn']);
  assert.equal(await sound.loaded, true);
  assert.match(asked[0], /\/audio\/sounds\.json$/);
  assert.equal(sound.isOn(), true);
  sound.play('ui.tick');
  assert.equal(sound.report().played, 0, 'locked: nothing plays before the first tap');
  doc.fire('touchend');
  sound.play('ui.tick');
  assert.equal(sound.report().played, 1);
  assert.equal(sound.report().session, 'ambient');
  assert.equal(timers.intervals(), 1, "the watchdog runs on the facade's timers");
  sound.engine.dispose();
  assert.equal(timers.intervals(), 0, 'and stops with dispose');
  assert.ok(devRegistry().actions.includes('audio.render'), 'on a build with the trail, the dev action');
  // The report's audio field comes from it now.
  const { collectFacts } = await import('../../web/js/ui/debug.js');
  const fdoc = fakeDocument();
  assert.equal(buildReport(collectFacts(fdoc)).audio.played, 1);
  provideAudio(null);
  assert.equal('audio' in buildReport(collectFacts(fdoc)), false);
  // A bank that won't load leaves a quiet sound, never an error.
  const quietPage = fakePage(fakeAudio()).doc;
  quietPage.documentElement = { getAttribute: () => 'app debug title' };
  const none = createSound({ doc: quietPage, unlock: null, fetchFn: async () => ({ ok: false }), timers: fakeTimers() });
  assert.equal(await none.loaded, false);
  none.play('ui.tick');
  assert.equal(none.report().played, 0);
  provideAudio(null);
});

test('a suspend that is still waiting is called off by whatever wakes the sound first: a cue, Sound on, the page back', () => {
  const r = rig();
  r.doc.fire('touchend');
  const ctx = r.ctx();
  const suspends = () => ctx.calls.filter((c) => c === 'suspend').length;
  // Sound off, then on again within the 30 ms ramp: no suspend lands.
  r.engine.setOn(false);
  r.engine.setOn(true);
  r.timers.advance(RAMPS.off);
  assert.equal(suspends(), 0);
  // Hidden, then back within 50 ms.
  r.doc.visibilityState = 'hidden';
  r.doc.fire('visibilitychange');
  r.doc.visibilityState = 'visible';
  r.doc.fire('visibilitychange');
  r.timers.advance(RAMPS.hide);
  assert.equal(suspends(), 0);
  // And the watchdog still watches afterwards: a stuck clock is caught.
  r.timers.advance(WATCH_MS * 2);
  r.doc.fire('touchend');
  assert.equal(r.engine.report().kicks, 1);
});
