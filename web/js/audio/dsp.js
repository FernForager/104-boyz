// Pure synthesis, the limiter and the measures (BUILD_PLAN 13.2, 13.5, S5
// sound A1; GAME_DESIGN 13.3, 13.11).
//
// PURE and BIT-EXACT: the same recipe renders the same Float32 samples in
// Node and in Safari, as the picture VM draws the same pixels, so the phone
// can hash its own renders against Node's goldens (the debug menu's Render
// 10 s of this scene). That holds because every operation here is exactly
// rounded IEEE arithmetic in a fixed order: + - * /, Math.fround,
// Math.sqrt, Math.floor, Math.round, Math.abs, Math.min and Math.max,
// integer operations, and the sines, cosines, exponentials and logarithms
// of engine/math.js (fdlibm's formulas, whose bits S3's self-check pins).
// Never Math.sin, Math.exp, Math.pow or **, whose last bit each JavaScript
// engine computes its own way: lint E04 holds this file to E02's bans. It
// imports only the engine's math, so it runs in Node, on the page and in the
// limiter's AudioWorklet (limiter.worklet.js) alike.
//
// The building blocks: oscillators (sine from a 4096-entry table built from
// the engine's sin at load; pulse, square, saw and triangle band-limited
// with PolyBLEP), noise (sfc32, seeded per voice by a hash of where it is in
// the recipe), envelopes (a linear attack, then exponential segments by a
// per-sample multiplier from the engine's exp), filters (one-pole low- and
// high-pass; RBJ biquads: band-pass, peak, low- and high-pass), and gains.
//
//   renderCue(recipe, {rate, variant, bank, id})  one cue variant, mono
//   makeLimiter(...) / limitBlock(state, in, out)  the master limiter
//   mixScene(scene, bank, {rate, seconds})        the phone's graph, in Node
//   measure(samples, rate)                        BS.1770-4 loudness, peaks
//   spectrum(samples, rate, {bands, frames})      log-spaced bands, dB
//   pcmHash(samples)                              FNV-1a over the Float32 bytes
//
// A cue's recipe is content/audio/sounds.json's (schemas/sounds.schema.json):
// layers of a wave (or another cue, for ui.next's two ticks), each placed at
// a time, with its envelope, filters and level, and the cue's level and
// variants (a pitch and level spread, each variant rendered once). Sound
// picks a variant with its own generator (audio/engine.js), never an engine
// stream (Lead call 25): nothing here reads or advances one.

import { sin, cos, exp, ln, pow, PI } from '../engine/math.js';

/** The buses and their starting gains in dB (GAME_DESIGN 13.11). */
export const BUSES = Object.freeze({ body: -10, weather: -12, gear: -12, water: -14, bed: -16, life: -18, ui: -20, music: -6 });
/** The master limiter (13.11): a lookahead peak limiter, ceiling -1 dBFS. */
export const LIMITER = Object.freeze({ ceilingDb: -1, lookaheadMs: 5, releaseMs: 80 });
/** The master's gain while the limiter's worklet couldn't load (dB). */
export const FALLBACK_DB = -3;
/** The rate the goldens and the shipped hashes are rendered at. */
export const GOLDEN_RATE = 48000;
/** The sine table's size (a power of two). */
export const TABLE_SIZE = 4096;
/** How long a layer runs on after its envelope, so its filters ring out (s). */
export const TAIL_S = 0.008;
/** An envelope's decay and release times are to -60 dB (T60). */
const T60_LEVEL = 0.001;
/** The ceiling sits this far under -1 dBFS, so a Float32 rounding never crosses it. */
const CEILING_MARGIN = 1 - 1e-6;
/** The floor a spectrum's dB stops at (silence). */
export const SPECTRUM_FLOOR_DB = -120;

const LN10 = ln(10);
const LN2 = ln(2);
const TWO_PI = 2 * PI;

/** The sine table: one cycle, plus the first entry again for the interpolation. */
const SINE = new Float64Array(TABLE_SIZE + 1);
for (let i = 0; i < TABLE_SIZE; i++) SINE[i] = sin((TWO_PI * i) / TABLE_SIZE);
SINE[TABLE_SIZE] = SINE[0];

/**
 * dB to a gain (10^(db/20)), through the engine's exp.
 * @param {number} db
 */
export function dbToGain(db) {
  return db === 0 ? 1 : exp((db * LN10) / 20);
}

/**
 * A gain to dB, or -Infinity for silence.
 * @param {number} g
 */
export function gainToDb(g) {
  return g > 0 ? (20 * ln(g)) / LN10 : -Infinity;
}

/**
 * 10 log10(p), or -Infinity for p <= 0 (a power or a mean square).
 * @param {number} p
 */
export function powerDb(p) {
  return p > 0 ? (10 * ln(p)) / LN10 : -Infinity;
}

/**
 * A frequency ratio from cents.
 * @param {number} c
 */
export function centsRatio(c) {
  return c === 0 ? 1 : exp((c * LN2) / 1200);
}

/**
 * The tangent, from the engine's sin and cos.
 * @param {number} x
 */
function tan(x) {
  return sin(x) / cos(x);
}

// ---- Noise: sfc32, seeded per voice ---------------------------------------

/**
 * FNV-1a over an ASCII string: a voice's noise seed from where it is.
 * @param {string} s
 */
export function seedOf(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ (s.charCodeAt(i) & 255), 16777619);
  return h >>> 0;
}

/**
 * sfc32 from one 32-bit seed (splitmix32 into its four words, then twelve
 * outputs thrown away): the next unsigned 32-bit output on each call.
 * @param {number} seed
 * @returns {() => number}
 */
export function makeRandom(seed) {
  let s = seed | 0;
  const mix = () => {
    s = (s + 0x9e3779b9) | 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
    return (z ^ (z >>> 16)) | 0;
  };
  let a = mix();
  let b = mix();
  let c = mix();
  let d = mix();
  const next = () => {
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return t >>> 0;
  };
  for (let i = 0; i < 12; i++) next();
  return next;
}

// ---- Oscillators -----------------------------------------------------------

/**
 * PolyBLEP: the band-limited step's correction near a jump at phase 0.
 * @param {number} t phase in [0, 1)
 * @param {number} dt the phase step
 */
function blep(t, dt) {
  if (t < dt) {
    const u = t / dt;
    return u + u - u * u - 1;
  }
  if (t > 1 - dt) {
    const u = (t - 1) / dt;
    return u * u + u + u + 1;
  }
  return 0;
}

/** @param {number} x */
const frac = (x) => x - Math.floor(x);

/**
 * An oscillator: next() gives the next sample, about -1 to 1.
 * @param {string} wave sine, pulse, square, saw, triangle or noise
 * @param {number} hz
 * @param {number} rate
 * @param {{duty?: number, seed?: number}} [o]
 * @returns {() => number}
 */
export function oscillator(wave, hz, rate, { duty = 0.5, seed = 1 } = {}) {
  const dt = Math.min(hz / rate, 0.49);
  let phase = 0;
  if (wave === 'noise') {
    const rnd = makeRandom(seed);
    return () => rnd() / 2147483648 - 1;
  }
  if (wave === 'sine') {
    return () => {
      const at = phase * TABLE_SIZE;
      const i = Math.floor(at);
      const f = at - i;
      const v = SINE[i] + (SINE[i + 1] - SINE[i]) * f;
      phase = frac(phase + dt);
      return v;
    };
  }
  if (wave === 'saw') {
    return () => {
      const v = 2 * phase - 1 - blep(phase, dt);
      phase = frac(phase + dt);
      return v;
    };
  }
  const d = wave === 'pulse' ? Math.min(Math.max(duty, 0.01), 0.99) : 0.5;
  const pulse = () => {
    const naive = phase < d ? 1 : -1;
    const v = naive + blep(phase, dt) - blep(frac(phase + 1 - d), dt) - (2 * d - 1);
    phase = frac(phase + dt);
    return v;
  };
  if (wave === 'pulse' || wave === 'square') return pulse;
  if (wave === 'triangle') {
    // A leaky integral of the band-limited square, starting at its trough.
    let y = -1;
    const leak = 1 - 1e-4;
    return () => {
      y = y * leak + 4 * dt * pulse();
      return y;
    };
  }
  throw new Error(`dsp: no wave "${wave}"`);
}

// ---- Envelopes -------------------------------------------------------------

/**
 * @typedef {{a?: number, d: number, s?: number, hold?: number, r?: number}} Env
 *   a: the linear attack (s); d: the decay to -60 dB, or toward s (s);
 *   s: the sustain level (0 for a one-shot); hold: how long after the
 *   attack the note sustains (s); r: the release to -60 dB (s)
 */

/**
 * How long an envelope runs (s): the attack and the decay for a one-shot;
 * the attack, the hold and the release for a sustained note.
 * @param {Env} env
 */
export function envSeconds(env) {
  const a = env.a || 0;
  return env.s ? a + (env.hold || 0) + (env.r || 0) : a + env.d;
}

/**
 * An envelope as a sample generator at a rate, by per-sample multipliers.
 * @param {Env} env
 * @param {number} rate
 * @returns {() => number}
 */
export function envelope(env, rate) {
  const aN = Math.round((env.a || 0) * rate);
  const s = env.s || 0;
  const holdN = s ? aN + Math.round((env.hold || 0) * rate) : Infinity;
  const kd = env.d > 0 ? exp(ln(T60_LEVEL) / (env.d * rate)) : 0;
  const kr = env.r && env.r > 0 ? exp(ln(T60_LEVEL) / (env.r * rate)) : 0;
  let n = 0;
  let over = 1; // the decaying part above the sustain level
  let rel = 1;
  let atRelease = 0;
  return () => {
    let v;
    if (n < aN) v = n / aN;
    else if (n < holdN) {
      v = s + (1 - s) * over;
      over *= kd;
      atRelease = v;
    } else {
      v = atRelease * rel;
      rel *= kr;
    }
    n++;
    return v;
  };
}

// ---- Filters ---------------------------------------------------------------

/**
 * @typedef {{type: 'lp1' | 'hp1' | 'bandpass' | 'peak' | 'lowpass' | 'highpass', hz: number, q?: number, db?: number}} FilterSpec
 */

/**
 * A filter as a per-sample function. One-pole low- and high-pass; RBJ
 * biquads (the band-pass at 0 dB peak gain), direct form I in doubles.
 * @param {FilterSpec} f
 * @param {number} rate
 * @returns {(x: number) => number}
 */
export function filter(f, rate) {
  const hz = Math.min(Math.max(f.hz, 1), 0.49 * rate);
  if (f.type === 'lp1' || f.type === 'hp1') {
    const a = 1 - exp((-TWO_PI * hz) / rate);
    let y = 0;
    if (f.type === 'lp1') {
      return (x) => {
        y += a * (x - y);
        return y;
      };
    }
    return (x) => {
      y += a * (x - y);
      return x - y;
    };
  }
  const c = biquad(f.type, hz, f.q || 0.7071067811865476, f.db || 0, rate);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  return (x) => {
    const y = c.b0 * x + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  };
}

/**
 * RBJ's biquad coefficients, normalized by a0.
 * @param {string} type bandpass, peak, lowpass or highpass
 * @param {number} hz
 * @param {number} q
 * @param {number} db the peak's gain
 * @param {number} rate
 */
export function biquad(type, hz, q, db, rate) {
  const w0 = (TWO_PI * hz) / rate;
  const cs = cos(w0);
  const sn = sin(w0);
  const alpha = sn / (2 * q);
  let b0;
  let b1;
  let b2;
  let a0;
  let a1;
  let a2;
  if (type === 'bandpass') {
    [b0, b1, b2, a0, a1, a2] = [alpha, 0, -alpha, 1 + alpha, -2 * cs, 1 - alpha];
  } else if (type === 'peak') {
    const A = dbToGain(db / 2);
    [b0, b1, b2, a0, a1, a2] = [1 + alpha * A, -2 * cs, 1 - alpha * A, 1 + alpha / A, -2 * cs, 1 - alpha / A];
  } else if (type === 'lowpass') {
    [b0, b1, b2, a0, a1, a2] = [(1 - cs) / 2, 1 - cs, (1 - cs) / 2, 1 + alpha, -2 * cs, 1 - alpha];
  } else if (type === 'highpass') {
    [b0, b1, b2, a0, a1, a2] = [(1 + cs) / 2, -(1 + cs), (1 + cs) / 2, 1 + alpha, -2 * cs, 1 - alpha];
  } else throw new Error(`dsp: no filter "${type}"`);
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

// ---- Cues ------------------------------------------------------------------

/**
 * @typedef {{wave?: string, hz?: number, duty?: number, at?: number, env?: Env, filters?: FilterSpec[], db?: number, cue?: string, semitones?: number}} Layer
 * @typedef {{bus: string, db?: number, variants?: {n: number, cents?: number, db?: number}, layers: Layer[]}} Cue
 * @typedef {{seconds: number, every?: number, cues: string[]}} Scene
 * @typedef {{cues: Record<string, Cue>, scenes?: Record<string, Scene>}} Bank
 */

/**
 * A variant's spread, each from -1 to 1: [pitch, level]. Variant k of n is
 * evenly placed in pitch, and its level takes the place half the set over,
 * so the highest variant isn't also the loudest.
 * @param {number} k
 * @param {number} n
 * @returns {[number, number]}
 */
export function variantSpread(k, n) {
  if (n <= 1) return [0, 0];
  const at = (/** @type {number} */ i) => (2 * i - (n - 1)) / (n - 1);
  return [at(k % n), at((k + Math.floor(n / 2)) % n)];
}

/**
 * How many variants a cue has.
 * @param {Cue} cue
 */
export function variantCount(cue) {
  return cue.variants ? cue.variants.n : 1;
}

/**
 * How long a cue runs (s), its layers' tails included.
 * @param {Cue} cue
 * @param {Bank | null} bank
 * @param {number} [depth]
 * @returns {number}
 */
export function cueSeconds(cue, bank, depth = 0) {
  let end = 0;
  for (const l of cue.layers) {
    const at = l.at || 0;
    if (l.cue) {
      const ref = refCue(bank, l.cue, depth);
      end = Math.max(end, at + cueSeconds(ref, bank, depth + 1));
    } else end = Math.max(end, at + envSeconds(/** @type {Env} */ (l.env)) + TAIL_S);
  }
  return end;
}

/**
 * The cue a layer names, from the bank.
 * @param {Bank | null} bank
 * @param {string} id
 * @param {number} depth
 */
function refCue(bank, id, depth) {
  if (depth > 3) throw new Error(`dsp: cues nest too deep at "${id}"`);
  const c = bank && bank.cues[id];
  if (!c) throw new Error(`dsp: no cue "${id}" in the bank`);
  return c;
}

/**
 * Add one cue into out (Float64, at sample start) with a pitch ratio and a
 * gain; noise seeds come from path.
 * @param {Float64Array} out
 * @param {Cue} cue
 * @param {{rate: number, start: number, ratio: number, gain: number, path: string, bank: Bank | null, depth: number}} o
 */
function addCue(out, cue, { rate, start, ratio, gain, path, bank, depth }) {
  cue.layers.forEach((l, i) => {
    const at = start + Math.round((l.at || 0) * rate);
    const g = gain * dbToGain(l.db || 0);
    const p = `${path}/${i}`;
    if (l.cue) {
      const ref = refCue(bank, l.cue, depth);
      addCue(out, ref, { rate, start: at, ratio: ratio * centsRatio(100 * (l.semitones || 0)), gain: g * dbToGain(ref.db || 0), path: p, bank, depth: depth + 1 });
      return;
    }
    const env = /** @type {Env} */ (l.env);
    const wave = /** @type {string} */ (l.wave);
    const osc = oscillator(wave, (l.hz || 0) * ratio, rate, { duty: l.duty, seed: seedOf(p) });
    const shape = envelope(env, rate);
    const filters = (l.filters || []).map((f) => filter(f, rate));
    const on = Math.round(envSeconds(env) * rate);
    const len = on + Math.round(TAIL_S * rate);
    for (let n = 0; n < len && at + n < out.length; n++) {
      let x = n < on ? osc() * shape() : 0;
      for (const f of filters) x = f(x);
      if (at + n >= 0) out[at + n] += x * g;
    }
  });
}

/**
 * Render one variant of a cue, mono, at a rate: Float32 samples, the same
 * bits in every JavaScript engine.
 * @param {Cue} recipe
 * @param {{rate?: number, variant?: number, bank?: Bank | null, id?: string}} [o]
 *   bank: resolves layers that name another cue; id: the cue's id, which
 *   seeds its noise
 * @returns {Float32Array}
 */
export function renderCue(recipe, { rate = GOLDEN_RATE, variant = 0, bank = null, id = '' } = {}) {
  const n = variantCount(recipe);
  const [pitch, level] = variantSpread(variant, n);
  const v = recipe.variants || { n: 1, cents: 0, db: 0 };
  const ratio = centsRatio((v.cents || 0) * pitch);
  const gain = dbToGain((recipe.db || 0) + (v.db || 0) * level);
  const mix = new Float64Array(Math.max(1, Math.round(cueSeconds(recipe, bank) * rate)));
  addCue(mix, recipe, { rate, start: 0, ratio, gain, path: `${id}#${variant % n}`, bank, depth: 0 });
  return Float32Array.from(mix);
}

// ---- The limiter -----------------------------------------------------------

/**
 * @typedef {object} LimiterState
 * @property {number} delay the lookahead in samples
 * @property {number} ceiling the linear ceiling
 * @property {number} release the per-sample release coefficient
 * @property {Float64Array} ring the delay line
 * @property {Float64Array} qv the window's running maximum: a monotonic deque of levels
 * @property {Float64Array} qn and their sample numbers
 * @property {number} qh the deque's head
 * @property {number} ql its length
 * @property {number} n samples seen
 * @property {number} gain the gain now
 */

/**
 * A lookahead peak limiter: a delay line of lookaheadMs; the gain from the
 * peak over the window that runs from the sample leaving the delay to the
 * newest one, so it is down before the peak arrives (an instant attack
 * within the lookahead); an exponential release of releaseMs. No output
 * sample exceeds the ceiling.
 * @param {{rate: number, ceilingDb?: number, lookaheadMs?: number, releaseMs?: number}} o
 * @returns {LimiterState}
 */
export function makeLimiter({ rate, ceilingDb = LIMITER.ceilingDb, lookaheadMs = LIMITER.lookaheadMs, releaseMs = LIMITER.releaseMs }) {
  const delay = Math.max(1, Math.round((lookaheadMs * rate) / 1000));
  const size = delay + 1;
  return {
    delay,
    ceiling: dbToGain(ceilingDb) * CEILING_MARGIN,
    release: exp(-1000 / (releaseMs * rate)),
    ring: new Float64Array(size),
    qv: new Float64Array(size + 1),
    qn: new Float64Array(size + 1),
    qh: 0,
    ql: 0,
    n: 0,
    gain: 1,
  };
}

/**
 * Limit a block: output[i] is input delayed by the lookahead, times the
 * gain. The worklet calls it per 128-sample block; Node, over a whole mix.
 * Its state carries over from block to block.
 * @param {LimiterState} st
 * @param {ArrayLike<number>} input
 * @param {{[i: number]: number, length: number}} output as long as input
 */
export function limitBlock(st, input, output) {
  const size = st.delay + 1;
  const cap = size + 1;
  const { ring, qv, qn, ceiling, release, delay } = st;
  let { qh, ql, n, gain } = st;
  for (let i = 0; i < input.length; i++) {
    const x = input[i];
    const level = Math.abs(x);
    ring[n % size] = x;
    // The window's maximum: drop smaller levels from the back, then the expired from the front.
    while (ql > 0 && qv[(qh + ql - 1) % cap] <= level) ql--;
    qv[(qh + ql) % cap] = level;
    qn[(qh + ql) % cap] = n;
    ql++;
    while (qn[qh] < n - delay) {
      qh = (qh + 1) % cap;
      ql--;
    }
    const peak = qv[qh];
    const target = peak > ceiling ? ceiling / peak : 1;
    if (target < gain) gain = target;
    else {
      gain = target - (target - gain) * release;
      if (target - gain < 1e-7) gain = target;
    }
    const out = n >= delay ? ring[(n - delay) % size] : 0;
    output[i] = out * gain;
    n++;
  }
  st.qh = qh;
  st.ql = ql;
  st.n = n;
  st.gain = gain;
}

/**
 * Limit a whole signal at once (a new limiter): the samples as the master
 * plays them, delayed by the lookahead.
 * @param {ArrayLike<number>} samples
 * @param {number} rate
 * @returns {Float32Array}
 */
export function limitAll(samples, rate) {
  const out = new Float32Array(samples.length);
  limitBlock(makeLimiter({ rate }), samples, out);
  return out;
}

// ---- Scenes ----------------------------------------------------------------

/**
 * A scene's events: [{at (s), cue, variant}], in time order. A1's scenes
 * play their cues in turn, one every `every` seconds, each cycling through
 * its variants (ui_demo); a scene with no cues is silence.
 * @param {Scene} scene
 * @param {Bank} bank
 * @returns {{at: number, cue: string, variant: number}[]}
 */
export function sceneEvents(scene, bank) {
  /** @type {{at: number, cue: string, variant: number}[]} */
  const out = [];
  const k = scene.cues.length;
  if (!k || !(scene.every && scene.every > 0)) return out;
  const count = Math.floor(scene.seconds / scene.every);
  for (let i = 0; i < count; i++) {
    const cue = scene.cues[i % k];
    const n = variantCount(bank.cues[cue]);
    out.push({ at: i * scene.every, cue, variant: Math.floor(i / k) % n });
  }
  return out;
}

/**
 * Mix a scene as the phone's graph does: each cue into its bus at the
 * bus's gain, the buses into the master at 0 dB, and the master through the
 * limiter. Summed in doubles in event order; Float32 out.
 * @param {Scene} scene
 * @param {Bank} bank
 * @param {{rate?: number, seconds?: number}} [o]
 * @returns {Float32Array}
 */
export function mixScene(scene, bank, { rate = GOLDEN_RATE, seconds = scene.seconds } = {}) {
  const mix = new Float64Array(Math.round(seconds * rate));
  /** @type {Map<string, Float32Array>} */
  const cache = new Map();
  for (const e of sceneEvents(scene, bank)) {
    const key = `${e.cue}#${e.variant}`;
    if (!cache.has(key)) cache.set(key, renderCue(bank.cues[e.cue], { rate, variant: e.variant, bank, id: e.cue }));
    const buf = /** @type {Float32Array} */ (cache.get(key));
    const g = dbToGain(BUSES[/** @type {keyof typeof BUSES} */ (bank.cues[e.cue].bus)]);
    const start = Math.round(e.at * rate);
    for (let i = 0; i < buf.length && start + i < mix.length; i++) mix[start + i] += buf[i] * g;
  }
  return limitAll(mix, rate);
}

// ---- Measures --------------------------------------------------------------

/**
 * BS.1770-4's K-weighting at a rate: the pre-filter (a high shelf) and the
 * RLB high-pass, from the bilinear transform (at 48 kHz they are the
 * standard's own coefficients).
 * @param {number} rate
 */
export function kWeighting(rate) {
  let K = tan((PI * 1681.974450955533) / rate);
  let Q = 0.7071752369554196;
  const Vh = pow(10, 3.999843853973347 / 20);
  const Vb = pow(Vh, 0.4996667741545416);
  let a0 = 1 + K / Q + K * K;
  const shelf = { b0: (Vh + (Vb * K) / Q + K * K) / a0, b1: (2 * (K * K - Vh)) / a0, b2: (Vh - (Vb * K) / Q + K * K) / a0, a1: (2 * (K * K - 1)) / a0, a2: (1 - K / Q + K * K) / a0 };
  K = tan((PI * 38.13547087602444) / rate);
  Q = 0.5003270373238773;
  a0 = 1 + K / Q + K * K;
  const rlb = { b0: 1, b1: -2, b2: 1, a1: (2 * (K * K - 1)) / a0, a2: (1 - K / Q + K * K) / a0 };
  return [shelf, rlb];
}

/**
 * The K-weighted signal's squares, in doubles.
 * @param {ArrayLike<number>} samples
 * @param {number} rate
 */
function kSquares(samples, rate) {
  const out = new Float64Array(samples.length);
  const stages = kWeighting(rate).map((c) => ({ c, x1: 0, x2: 0, y1: 0, y2: 0 }));
  for (let i = 0; i < samples.length; i++) {
    let x = samples[i];
    for (const s of stages) {
      const y = s.c.b0 * x + s.c.b1 * s.x1 + s.c.b2 * s.x2 - s.c.a1 * s.y1 - s.c.a2 * s.y2;
      s.x2 = s.x1;
      s.x1 = x;
      s.y2 = s.y1;
      s.y1 = y;
      x = y;
    }
    out[i] = x * x;
  }
  return out;
}

/**
 * The mean squares of windows of `win` samples every `hop` samples (at
 * least one window; a signal shorter than a window is padded with silence).
 * @param {Float64Array} prefix prefix sums of the squares (length n + 1)
 * @param {number} win
 * @param {number} hop
 */
function windowMeans(prefix, win, hop) {
  const n = prefix.length - 1;
  const out = [];
  if (n <= win) {
    out.push(prefix[n] / win);
    return out;
  }
  for (let s = 0; s + win <= n; s += hop) out.push((prefix[s + win] - prefix[s]) / win);
  return out;
}

/** BS.1770's loudness of a mean square (mono: one channel at weight 1). @param {number} z */
const lufsOf = (z) => (z > 0 ? -0.691 + powerDb(z) : -Infinity);

/** The 4x true-peak interpolator's taps per phase (BS.1770-4 Annex 2: a 48-tap, 4-phase filter). */
const TP_TAPS = 12;
const TP_PHASES = 4;
/** Each fractional phase's taps: a Hann-windowed sinc. */
const TP_COEFS = (() => {
  /** @type {Float64Array[]} */
  const out = [];
  const half = TP_TAPS / 2;
  for (let p = 1; p < TP_PHASES; p++) {
    const c = new Float64Array(TP_TAPS);
    for (let j = 0; j < TP_TAPS; j++) {
      const x = j - half + 1 - p / TP_PHASES; // the tap's distance from the point between samples
      const sinc = x === 0 ? 1 : sin(PI * x) / (PI * x);
      const w = 0.5 + 0.5 * cos((PI * x) / (half + 0.5));
      c[j] = sinc * w;
    }
    out.push(c);
  }
  return out;
})();

/**
 * Peaks and loudness (ITU-R BS.1770-4, mono): the sample peak and the 4x
 * true peak in dBFS; the integrated loudness (400 ms blocks every 100 ms,
 * the -70 LUFS absolute gate and the -10 LU relative gate), and the
 * loudest momentary (400 ms) and short-term (3 s) windows, in LUFS. Silence
 * is -Infinity throughout.
 * @param {ArrayLike<number>} samples
 * @param {number} rate
 */
export function measure(samples, rate) {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]));
  let tp = peak;
  const half = TP_TAPS / 2;
  for (let i = 0; i + 1 < samples.length; i++) {
    for (const c of TP_COEFS) {
      let y = 0;
      for (let j = 0; j < TP_TAPS; j++) {
        const k = i + j - half + 1;
        if (k >= 0 && k < samples.length) y += samples[k] * c[j];
      }
      tp = Math.max(tp, Math.abs(y));
    }
  }
  const sq = kSquares(samples, rate);
  const prefix = new Float64Array(sq.length + 1);
  for (let i = 0; i < sq.length; i++) prefix[i + 1] = prefix[i] + sq[i];
  const hop = Math.round(0.1 * rate);
  const blocks = windowMeans(prefix, Math.round(0.4 * rate), hop);
  const shorts = windowMeans(prefix, Math.round(3 * rate), hop);
  const loud = blocks.filter((z) => lufsOf(z) > -70);
  let lufsI = -Infinity;
  if (loud.length) {
    let sum = 0;
    for (const z of loud) sum += z;
    const gate = lufsOf(sum / loud.length) - 10;
    const kept = loud.filter((z) => lufsOf(z) > gate);
    let s2 = 0;
    for (const z of kept) s2 += z;
    lufsI = kept.length ? lufsOf(s2 / kept.length) : -Infinity;
  }
  return {
    peakDb: gainToDb(peak),
    truePeakDb: gainToDb(tp),
    lufsI,
    lufsMMax: Math.max(...blocks.map(lufsOf)),
    lufsSMax: Math.max(...shorts.map(lufsOf)),
  };
}

// ---- Spectra ---------------------------------------------------------------

/** @type {Map<number, {cs: Float64Array, sn: Float64Array}>} */
const TWIDDLES = new Map();

/**
 * An in-place radix-2 FFT (re and im, length a power of two), its twiddles
 * from the engine's sin and cos.
 * @param {Float64Array} re
 * @param {Float64Array} im
 */
export function fft(re, im) {
  const n = re.length;
  if (n & (n - 1)) throw new Error('dsp: an FFT is a power of two long');
  let tw = TWIDDLES.get(n);
  if (!tw) {
    tw = { cs: new Float64Array(n / 2), sn: new Float64Array(n / 2) };
    for (let k = 0; k < n / 2; k++) {
      tw.cs[k] = cos((TWO_PI * k) / n);
      tw.sn[k] = -sin((TWO_PI * k) / n);
    }
    TWIDDLES.set(n, tw);
  }
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const step = n / len;
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const wr = tw.cs[k * step];
        const wi = tw.sn[k * step];
        const a = i + k;
        const b = a + len / 2;
        const xr = re[b] * wr - im[b] * wi;
        const xi = re[b] * wi + im[b] * wr;
        re[b] = re[a] - xr;
        im[b] = im[a] - xi;
        re[a] += xr;
        im[a] += xi;
      }
    }
  }
}

/** @param {number} n */
const pow2At = (n) => {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
};

/**
 * The band edges (Hz), log-spaced from fmin to fmax.
 * @param {number} bands
 * @param {number} fmin
 * @param {number} fmax
 */
export function bandEdges(bands, fmin, fmax) {
  const out = [];
  const step = ln(fmax / fmin) / bands;
  for (let k = 0; k <= bands; k++) out.push(k === 0 ? fmin : k === bands ? fmax : fmin * exp(step * k));
  return out;
}

/**
 * A spectrogram: frames x bands of dB, log-spaced bands from 40 Hz to
 * 16 kHz (or the Nyquist frequency), each frame an equal slice of the
 * signal; a slice longer than 4,096 samples averages its whole
 * Hann-windowed 4,096-sample chunks (a shorter one is one chunk, padded).
 * A full-scale sine reads 0 dB in its band; silence reads
 * SPECTRUM_FLOOR_DB.
 * @param {ArrayLike<number>} samples
 * @param {number} rate
 * @param {{bands?: number, frames?: number, fmin?: number, fmax?: number}} [o]
 * @returns {number[][]}
 */
export function spectrum(samples, rate, { bands = 16, frames = 10, fmin = 40, fmax = Math.min(16000, rate / 2) } = {}) {
  const edges = bandEdges(bands, fmin, fmax);
  const slice = Math.max(1, Math.floor(samples.length / frames));
  const size = Math.min(4096, pow2At(slice));
  // Each chunk is len samples under a Hann window, zero-padded to size.
  const len = Math.min(size, slice);
  const chunks = Math.max(1, Math.floor(slice / len));
  const win = new Float64Array(len);
  let wsum = 0;
  for (let i = 0; i < len; i++) {
    win[i] = 0.5 - 0.5 * cos((TWO_PI * i) / len);
    wsum += win[i] * win[i];
  }
  const binHz = rate / size;
  const out = [];
  for (let f = 0; f < frames; f++) {
    const power = new Float64Array(size / 2 + 1);
    for (let c = 0; c < chunks; c++) {
      const at = f * slice + c * len;
      const re = new Float64Array(size);
      const im = new Float64Array(size);
      for (let i = 0; i < len && at + i < samples.length; i++) re[i] = samples[at + i] * win[i];
      fft(re, im);
      for (let k = 0; k <= size / 2; k++) power[k] += re[k] * re[k] + im[k] * im[k];
    }
    const norm = wsum > 0 ? 4 / (size * wsum * chunks) : 0;
    const row = [];
    for (let b = 0; b < bands; b++) {
      let lo = Math.ceil(edges[b] / binHz);
      let hi = Math.ceil(edges[b + 1] / binHz) - 1;
      if (hi < lo) {
        lo = Math.round((edges[b] + edges[b + 1]) / 2 / binHz);
        hi = lo;
      }
      let p = 0;
      for (let k = lo; k <= hi && k <= size / 2; k++) p += power[k];
      row.push(Math.max(SPECTRUM_FLOOR_DB, powerDb(p * norm)));
    }
    out.push(row);
  }
  return out;
}

/**
 * A spectrum as digits, 10 dB a step (-10 dB and over reads 8 or 9, under
 * -80 dB 0), one group of bands per frame: the debug render's small
 * spectrogram, which rides in the bug report.
 * @param {number[][]} spec
 */
export function spectrumDigits(spec) {
  return spec.map((row) => row.map((db) => String(Math.min(9, Math.max(0, Math.floor((db + 90) / 10))))).join('')).join(' ');
}

/**
 * The share of a signal's energy between lo and hi Hz (a whole cue, one
 * FFT, no window: the cue starts and ends in silence).
 * @param {ArrayLike<number>} samples
 * @param {number} rate
 * @param {number} lo
 * @param {number} hi
 */
export function energyShare(samples, rate, lo, hi) {
  const size = pow2At(Math.max(2, samples.length));
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  for (let i = 0; i < samples.length; i++) re[i] = samples[i];
  fft(re, im);
  let all = 0;
  let band = 0;
  for (let k = 1; k <= size / 2; k++) {
    const p = re[k] * re[k] + im[k] * im[k];
    const hz = (k * rate) / size;
    all += p;
    if (hz >= lo && hz < hi) band += p;
  }
  return all > 0 ? band / all : 0;
}

// ---- The hash --------------------------------------------------------------

/**
 * FNV-1a over the samples as little-endian Float32 bytes: 8 hex digits.
 * The goldens and the phone's self-check compare these.
 * @param {ArrayLike<number>} samples
 */
export function pcmHash(samples) {
  const view = new DataView(new ArrayBuffer(4));
  let h = 2166136261;
  for (let i = 0; i < samples.length; i++) {
    view.setFloat32(0, samples[i], true);
    for (let b = 0; b < 4; b++) h = Math.imul(h ^ view.getUint8(b), 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
