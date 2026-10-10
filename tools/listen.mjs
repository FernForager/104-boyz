#!/usr/bin/env node
// Listening with no ears (BUILD_PLAN 13.5, S5 sound A1; GAME_DESIGN 13.11).
// Renders a cue or a scene in Node with the same web/js/audio/dsp.js the
// phone runs, and writes, under out/listen/:
//
//   <name>.wav              16-bit PCM, mono, rounded without dither (so
//                           the same render always writes the same bytes)
//   <name>.spectrogram.png  log frequency (64 bands, 40 Hz to 16 kHz) by
//                           20 ms frames, 4 px a cell, in the 16 colors: a
//                           ramp of ink, navy, slate, teal, sage and snow
//   <name>.json             measure()'s readout (peaks, BS.1770 loudness),
//                           each cue variant's hash and mid-range share
//
//   node tools/listen.mjs <cue|scene> [--rate 48000] [--seconds 10] [--out out/listen]
//   node tools/listen.mjs --check     every golden: each cue variant's hash
//                                     at 48 and 44.1 kHz, the limiter's, the
//                                     scenes' hashes and measures; and the
//                                     checks: no peak over -1 dBFS after the
//                                     limiter, every cue with 40% of its
//                                     energy between 800 Hz and 5 kHz (a
//                                     phone's speaker); prints the readings
//   node tools/listen.mjs --update    rewrite test/golden/audio/a1.json
//                                     (sessions only, after a look at the
//                                     spectrograms)
//
// A cue renders each of its variants in turn, a quarter second apart, at
// its own level (no bus); a scene (content/audio/sounds.json's scenes:
// ui_demo, the 10 seconds the debug menu renders, and silence) mixes as the
// phone's graph does: buses, the master, the limiter (dsp.js mixScene).
//
// The audio reader (loadAudio) is here too: the cue bank and the license
// log against their schemas (J01, which the lint reports) and their
// references, and the build's audio step (buildAudio): it renders every cue
// variant at 48 kHz, refuses one whose hash differs from the golden ("run
// npm run listen -- --update and review"), and ships audio/sounds.json with
// the hashes stamped in, so the phone's debug render can compare its own.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, loadPalette } from './pics.mjs';
import { validate } from './schema.mjs';
import { lineOfPath } from './content.mjs';
import { encodePNG } from './png.mjs';
import { renderCue, mixScene, measure, spectrum, energyShare, pcmHash, limitAll, variantCount, GOLDEN_RATE, SPECTRUM_FLOOR_DB } from '../web/js/audio/dsp.js';
import { sin, PI } from '../web/js/engine/math.js';

/** The sound's content files and their schemas. */
export const AUDIO_FILES = Object.freeze({ bank: ['content/audio/sounds.json', 'sounds.schema.json'], credits: ['content/audio/credits.json', 'audio_credits.schema.json'] });
/** The goldens, always this tree's (the build reads them whatever root it builds). */
export const GOLDEN_PATH = join(ROOT, 'test', 'golden', 'audio', 'a1.json');
/** The rates the goldens hold every cue variant at. */
export const RATES = Object.freeze([48000, 44100]);
/** The phone speaker's range, and the share of a cue's energy that must sit in it. */
export const MID = Object.freeze({ lo: 800, hi: 5000, share: 0.4 });
/** Nothing out of the limiter over this (dBFS). */
export const PEAK_MAX_DB = -1;
/** Where ui_demo should sit, short-term (a reading, not a gate). */
export const UI_DEMO_LUFS = -30;
/** The spectrogram: bands, frame length (s), cell size (px), and the ramp's palette slots, quietest first. */
export const SPECTROGRAM = Object.freeze({ bands: 64, frameS: 0.02, cell: 4, ramp: Object.freeze([0, 1, 2, 15, 14, 4]), floorDb: -96, stepDb: 16 });
/** A cue's variants, laid end to end this far apart in its WAV (s). */
const VARIANT_GAP_S = 0.25;

/**
 * @typedef {{file: string, line: number, code: string, msg: string}} AudioError
 * @typedef {{bank: any, credits: any, errors: AudioError[], src: Record<string, string>}} Audio
 */

/**
 * The sound's content files, validated: each against its schema (J01),
 * then their references: a layer's or a scene's cue is in the bank, a
 * wave other than noise has its hz, no cue names itself through its
 * layers, and every cue has its license-log entry and every entry its cue
 * (R01). The schemas come from root/schemas (this tree's when it has none).
 * @param {string} [root]
 * @returns {Audio}
 */
export function loadAudio(root = ROOT) {
  /** @type {AudioError[]} */
  const errors = [];
  /** @type {Record<string, any>} */
  const data = {};
  /** @type {Record<string, string>} */
  const src = {};
  for (const [key, [file, schemaName]] of Object.entries(AUDIO_FILES)) {
    const path = join(root, ...file.split('/'));
    if (!existsSync(path)) {
      errors.push({ file, line: 1, code: 'J01', msg: 'missing: the sound needs it (BUILD_PLAN 13.2)' });
      continue;
    }
    src[key] = readFileSync(path, 'utf8');
    try {
      data[key] = JSON.parse(src[key]);
    } catch (e) {
      errors.push({ file, line: 1, code: 'J01', msg: `not JSON: ${/** @type {Error} */ (e).message}` });
      continue;
    }
    const own = join(root, 'schemas', schemaName);
    const schema = JSON.parse(readFileSync(existsSync(own) ? own : join(ROOT, 'schemas', schemaName), 'utf8'));
    for (const e of validate(schema, data[key]).errors) errors.push({ file, line: lineOfPath(src[key], e.path), code: 'J01', msg: `${e.path || '(the file)'}: ${e.msg}` });
  }
  const bank = data.bank || null;
  const credits = data.credits || null;
  if (errors.length || !bank || !credits) return { bank, credits, errors, src };
  const [bankFile] = AUDIO_FILES.bank;
  const [creditsFile] = AUDIO_FILES.credits;
  const ref = (/** @type {string} */ path, /** @type {string} */ msg) => errors.push({ file: bankFile, line: lineOfPath(src.bank, path), code: 'R01', msg });
  for (const [id, cue] of Object.entries(bank.cues)) {
    cue.layers.forEach((/** @type {any} */ l, /** @type {number} */ i) => {
      const path = `cues.${id}.layers[${i}]`;
      if (l.cue !== undefined && !bank.cues[l.cue]) ref(path, `cue ${id}: no cue "${l.cue}" in the bank`);
      if (l.wave !== undefined && l.wave !== 'noise' && typeof l.hz !== 'number') ref(path, `cue ${id}: a ${l.wave} needs its hz`);
    });
    /** @type {(at: string, seen: string[]) => void} */
    const nest = (at, seen) => {
      for (const l of (bank.cues[at] || { layers: [] }).layers) {
        if (l.cue === undefined || !bank.cues[l.cue]) continue;
        if (seen.includes(l.cue)) {
          ref(`cues.${id}`, `cue ${id} names itself through ${[...seen, l.cue].join(' > ')}`);
          return;
        }
        if (seen.length < 4) nest(l.cue, [...seen, l.cue]);
      }
    };
    nest(id, [id]);
  }
  for (const [id, scene] of Object.entries(bank.scenes)) {
    scene.cues.forEach((/** @type {string} */ c, /** @type {number} */ i) => {
      if (!bank.cues[c]) ref(`scenes.${id}.cues[${i}]`, `scene ${id}: no cue "${c}" in the bank`);
    });
  }
  const logged = new Map(credits.sounds.map((/** @type {any} */ s, /** @type {number} */ i) => [s.id, i]));
  for (const id of Object.keys(bank.cues)) {
    if (!logged.has(id)) ref(`cues.${id}`, `cue ${id} has no entry in ${creditsFile}: every shipped sound is logged (decision 33)`);
  }
  credits.sounds.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    const at = lineOfPath(src.credits, `sounds[${i}]`);
    if (logged.get(s.id) !== i) errors.push({ file: creditsFile, line: at, code: 'R01', msg: `${s.id} is logged twice` });
    if (s.license === 'synth' && (!bank.cues[s.id] || s.recipe !== s.id)) errors.push({ file: creditsFile, line: at, code: 'R01', msg: `${s.id}: a synthesized sound names its own recipe, a cue in ${bankFile}` });
  });
  return { bank, credits, errors, src };
}

/**
 * Every cue variant's hash at a rate: {cue: [hash, ...]}.
 * @param {any} bank
 * @param {number} [rate]
 * @returns {Record<string, string[]>}
 */
export function cueHashes(bank, rate = GOLDEN_RATE) {
  /** @type {Record<string, string[]>} */
  const out = {};
  for (const [id, cue] of Object.entries(bank.cues)) {
    out[id] = [];
    for (let v = 0; v < variantCount(/** @type {any} */ (cue)); v++) out[id].push(pcmHash(renderCue(/** @type {any} */ (cue), { rate, variant: v, bank, id })));
  }
  return out;
}

/**
 * The limiter's probe: two full-scale sines (440 Hz and 1 kHz, together
 * +6 dBFS) for a second, through a fresh limiter.
 * @param {number} [rate]
 */
export function limiterProbe(rate = GOLDEN_RATE) {
  const n = rate;
  const x = new Float64Array(n);
  for (let i = 0; i < n; i++) x[i] = sin((2 * PI * 440 * (i % rate)) / rate) + sin((2 * PI * 1000 * (i % rate)) / rate);
  return { input: x, output: limitAll(x, rate) };
}

/** A measure, rounded for the golden (3 decimals; silence is null). @param {Record<string, number>} m */
export const roundMeasure = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, Number.isFinite(v) ? Math.round(v * 1000) / 1000 : null]));

/**
 * Render a cue (its variants end to end) or a scene, by name.
 * @param {any} bank
 * @param {string} name
 * @param {{rate?: number, seconds?: number}} [o]
 * @returns {{kind: 'cue' | 'scene', samples: Float32Array, variants?: {hash: string, mid: number, measure: Record<string, number | null>}[]}}
 */
export function renderNamed(bank, name, { rate = GOLDEN_RATE, seconds } = {}) {
  if (bank.cues[name]) {
    const cue = bank.cues[name];
    const parts = [];
    for (let v = 0; v < variantCount(cue); v++) parts.push(renderCue(cue, { rate, variant: v, bank, id: name }));
    const gap = Math.round(VARIANT_GAP_S * rate);
    const step = Math.max(gap, ...parts.map((p) => p.length + Math.round(0.05 * rate)));
    const samples = new Float32Array(step * parts.length);
    parts.forEach((p, k) => samples.set(p, k * step));
    const variants = parts.map((p) => ({ hash: pcmHash(p), mid: Math.round(energyShare(p, rate, MID.lo, MID.hi) * 1000) / 1000, measure: roundMeasure(measure(p, rate)) }));
    return { kind: 'cue', samples, variants };
  }
  if (bank.scenes[name]) {
    const scene = bank.scenes[name];
    return { kind: 'scene', samples: mixScene(scene, bank, { rate, seconds: seconds || scene.seconds }) };
  }
  throw new Error(`listen: no cue or scene "${name}" (cues: ${Object.keys(bank.cues).join(', ')}; scenes: ${Object.keys(bank.scenes).join(', ')})`);
}

/**
 * The goldens, as test/golden/audio/a1.json holds them.
 * @param {any} bank
 */
export function makeGolden(bank) {
  /** @type {Record<string, Record<string, string[]>>} */
  const cues = {};
  for (const r of RATES) cues[String(r)] = cueHashes(bank, r);
  /** @type {Record<string, {hash: string, measure: Record<string, number | null>}>} */
  const scenes = {};
  for (const id of Object.keys(bank.scenes)) {
    const s = mixScene(bank.scenes[id], bank, { rate: GOLDEN_RATE });
    scenes[id] = { hash: pcmHash(s), measure: roundMeasure(measure(s, GOLDEN_RATE)) };
  }
  return {
    $comment: "S5 sound A1's goldens (BUILD_PLAN 13.5): every cue variant's FNV-1a hash over its Float32 samples at 48 and 44.1 kHz (web/js/audio/dsp.js renderCue), the limiter's over its probe (two full-scale sines through it), and each scene's hash and BS.1770 readout at 48 kHz (dsp.js mixScene, measure). Written by `node tools/listen.mjs --update` after a look at the spectrograms; checked by --check, test/unit/dsp.test.mjs and the build, which ships the 48 kHz hashes in audio/sounds.json so the phone's debug render can compare its own.",
    format: 1,
    cues,
    limiter: pcmHash(limiterProbe().output),
    scenes,
  };
}

/**
 * Read the goldens.
 * @param {string} [path]
 */
export function readGolden(path = GOLDEN_PATH) {
  if (!existsSync(path)) throw new Error(`listen: no goldens at ${path}: run npm run listen -- --update and review`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * What differs between two goldens, as lines ("ui.tick variant 2 at 48000:
 * 1a2b3c4d, golden 5e6f7a8b"). Only the cues at 48 kHz when cuesOnly.
 * @param {any} got
 * @param {any} want
 * @param {{cuesOnly?: boolean}} [o]
 * @returns {string[]}
 */
export function goldenDiff(got, want, { cuesOnly = false } = {}) {
  const out = [];
  const rates = cuesOnly ? [String(GOLDEN_RATE)] : [...new Set([...Object.keys(got.cues || {}), ...Object.keys(want.cues || {})])];
  for (const r of rates) {
    const g = (got.cues || {})[r] || {};
    const w = (want.cues || {})[r] || {};
    for (const id of [...new Set([...Object.keys(g), ...Object.keys(w)])].sort()) {
      const a = g[id] || [];
      const b = w[id] || [];
      if (!w[id]) out.push(`${id} at ${r}: not in the golden`);
      else if (!g[id]) out.push(`${id} at ${r}: in the golden, not in the bank`);
      else for (let v = 0; v < Math.max(a.length, b.length); v++) if (a[v] !== b[v]) out.push(`${id} variant ${v} at ${r}: ${a[v] || 'none'}, golden ${b[v] || 'none'}`);
    }
  }
  if (cuesOnly) return out;
  if (got.limiter !== want.limiter) out.push(`the limiter: ${got.limiter}, golden ${want.limiter}`);
  for (const id of [...new Set([...Object.keys(got.scenes || {}), ...Object.keys(want.scenes || {})])].sort()) {
    const a = (got.scenes || {})[id];
    const b = (want.scenes || {})[id];
    if (!a || !b) out.push(`scene ${id}: ${a ? 'not in the golden' : 'in the golden, not in the bank'}`);
    else {
      if (a.hash !== b.hash) out.push(`scene ${id}: ${a.hash}, golden ${b.hash}`);
      if (JSON.stringify(a.measure) !== JSON.stringify(b.measure)) out.push(`scene ${id}'s measure: ${JSON.stringify(a.measure)}, golden ${JSON.stringify(b.measure)}`);
    }
  }
  return out;
}

/**
 * The checks a session reads (13.5): every golden, no peak over -1 dBFS
 * out of the limiter (its probe and every scene), and every cue variant's
 * mid-range share; plus the readings (ui_demo's loudness, the share above
 * 10 kHz, where aliasing would show).
 * @param {{bank: any, golden?: any}} o
 */
export function runChecks({ bank, golden = readGolden() }) {
  const got = makeGolden(bank);
  const failures = goldenDiff(got, golden);
  const readings = [];
  const probe = limiterProbe();
  const probePeak = measure(probe.output, GOLDEN_RATE).peakDb;
  if (probePeak > PEAK_MAX_DB) failures.push(`the limiter lets its probe through at ${probePeak.toFixed(2)} dBFS`);
  readings.push(`limiter: a +6 dBFS probe comes out at ${probePeak.toFixed(2)} dBFS`);
  for (const [id, s] of Object.entries(got.scenes)) {
    const m = s.measure;
    if (m.peakDb !== null && m.peakDb > PEAK_MAX_DB) failures.push(`scene ${id} peaks at ${m.peakDb} dBFS, over ${PEAK_MAX_DB}`);
    readings.push(`scene ${id}: peak ${m.peakDb ?? '-inf'} dBFS, true peak ${m.truePeakDb ?? '-inf'}, ${m.lufsI ?? '-inf'} LUFS integrated, ${m.lufsSMax ?? '-inf'} short-term max, ${m.lufsMMax ?? '-inf'} momentary max${id === 'ui_demo' ? ` (aim: near ${UI_DEMO_LUFS} short-term)` : ''}`);
  }
  for (const [id, cue] of Object.entries(bank.cues)) {
    const shares = [];
    const highs = [];
    for (let v = 0; v < variantCount(/** @type {any} */ (cue)); v++) {
      const s = renderCue(/** @type {any} */ (cue), { rate: GOLDEN_RATE, variant: v, bank, id });
      const mid = energyShare(s, GOLDEN_RATE, MID.lo, MID.hi);
      shares.push(mid);
      highs.push(energyShare(s, GOLDEN_RATE, 10000, GOLDEN_RATE / 2));
      if (mid < MID.share) failures.push(`${id} variant ${v} keeps ${(100 * mid).toFixed(1)}% of its energy between ${MID.lo} Hz and ${MID.hi} Hz, under ${100 * MID.share}%`);
    }
    readings.push(`${id}: ${shares.map((x) => `${(100 * x).toFixed(0)}%`).join(' ')} between ${MID.lo} Hz and ${MID.hi} Hz; above 10 kHz at most ${(100 * Math.max(...highs)).toFixed(2)}%`);
  }
  return { ok: failures.length === 0, failures, readings, golden: got };
}

/**
 * A 16-bit PCM mono WAV, rounded without dither.
 * @param {ArrayLike<number>} samples
 * @param {number} rate
 */
export function wavBytes(samples, rate) {
  const data = samples.length * 2;
  const b = Buffer.alloc(44 + data);
  b.write('RIFF', 0, 'ascii');
  b.writeUInt32LE(36 + data, 4);
  b.write('WAVE', 8, 'ascii');
  b.write('fmt ', 12, 'ascii');
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); // PCM
  b.writeUInt16LE(1, 22); // mono
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36, 'ascii');
  b.writeUInt32LE(data, 40);
  for (let i = 0; i < samples.length; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + 2 * i);
  return b;
}

/**
 * The ramp's step for a band's level (0 quietest, ramp.length - 1 loudest).
 * @param {number} db
 */
export function rampStep(db) {
  const { ramp, floorDb, stepDb } = SPECTROGRAM;
  if (!(db >= floorDb)) return 0;
  return Math.min(ramp.length - 1, 1 + Math.floor((db - floorDb) / stepDb));
}

/**
 * The spectrogram as an indexed PNG in the 16 colors: low frequencies at
 * the bottom, time to the right.
 * @param {ArrayLike<number>} samples
 * @param {number} rate
 * @param {number[][]} [rgb] the palette, slot by slot
 */
export function spectrogramPNG(samples, rate, rgb = paletteRGB()) {
  const { bands, frameS, cell, ramp } = SPECTROGRAM;
  const frames = Math.max(1, Math.ceil(samples.length / (frameS * rate)));
  const spec = spectrum(samples, rate, { bands, frames });
  const W = frames * cell;
  const H = bands * cell;
  const data = new Uint8Array(W * H);
  for (let f = 0; f < frames; f++) {
    for (let b = 0; b < bands; b++) {
      const slot = ramp[rampStep(spec[f][b])];
      for (let y = 0; y < cell; y++) data.fill(slot, ((bands - 1 - b) * cell + y) * W + f * cell, ((bands - 1 - b) * cell + y) * W + (f + 1) * cell);
    }
  }
  return { png: encodePNG({ width: W, height: H, type: 'indexed', data, palette: rgb }), width: W, height: H, frames, floor: SPECTRUM_FLOOR_DB };
}

/** The 16 colors as [r, g, b], slot by slot (content/art/palette.json). */
export function paletteRGB() {
  return loadPalette().colors.map((/** @type {{hex: string}} */ c) => [1, 3, 5].map((i) => parseInt(c.hex.slice(i, i + 2), 16)));
}

/**
 * The build's audio step: validate the bank and the log, render every cue
 * variant at 48 kHz, refuse a hash that differs from the golden, and write
 * audio/sounds.json (both channels: file parity) with the hashes in it.
 * @param {string} out dist/<channel>/
 * @param {{root?: string, golden?: string}} [o]
 */
export function buildAudio(out, { root = ROOT, golden = GOLDEN_PATH } = {}) {
  const a = loadAudio(root);
  if (a.errors.length) throw new Error(`build: the sound's files don't check: ${a.errors.slice(0, 5).map((e) => `${e.file}:${e.line}: ${e.code} ${e.msg}`).join('; ')}`);
  const hashes = cueHashes(a.bank, GOLDEN_RATE);
  const diff = goldenDiff({ cues: { [String(GOLDEN_RATE)]: hashes } }, readGolden(golden), { cuesOnly: true });
  if (diff.length) throw new Error(`build: the cue bank renders differently from test/golden/audio/a1.json (${diff.slice(0, 4).join('; ')}): run npm run listen -- --update and review`);
  mkdirSync(join(out, 'audio'), { recursive: true });
  const shipped = shippedBank(a.bank, hashes);
  writeFileSync(join(out, 'audio', 'sounds.json'), JSON.stringify(shipped));
  return { cues: Object.keys(hashes).length, variants: Object.values(hashes).reduce((n, h) => n + h.length, 0) };
}

/**
 * The bank as it ships: the recipes and the scenes without their notes
 * ($comment, when, what: authoring words, never shown), and the golden
 * hashes at 48 kHz.
 * @param {any} bank
 * @param {Record<string, string[]>} hashes
 */
export function shippedBank(bank, hashes) {
  const strip = (/** @type {Record<string, any>} */ o, /** @type {string[]} */ drop) => Object.fromEntries(Object.entries(o).filter(([k]) => !drop.includes(k)));
  return {
    format: bank.format,
    cues: Object.fromEntries(Object.entries(bank.cues).map(([id, c]) => [id, strip({ ...c, layers: c.layers.map((/** @type {any} */ l) => strip(l, ['$comment'])) }, ['$comment', 'when'])])),
    scenes: Object.fromEntries(Object.entries(bank.scenes).map(([id, sc]) => [id, strip(sc, ['$comment', 'what'])])),
    golden: { rate: GOLDEN_RATE, cues: hashes },
  };
}

/**
 * Pure: the command line.
 * @param {string[]} argv
 */
export function parseArgs(argv) {
  const o = { name: /** @type {string | null} */ (null), rate: GOLDEN_RATE, seconds: /** @type {number | undefined} */ (undefined), out: join(ROOT, 'out', 'listen'), check: false, update: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--rate') o.rate = Number(argv[++i]);
    else if (a === '--seconds') o.seconds = Number(argv[++i]);
    else if (a === '--out') o.out = argv[++i];
    else if (a === '--check') o.check = true;
    else if (a === '--update') o.update = true;
    else if (!a.startsWith('--') && !o.name) o.name = a;
    else throw new Error(`listen: what is "${a}"?`);
  }
  if (!(o.rate >= 8000 && o.rate <= 192000)) throw new Error('listen: --rate is 8000 to 192000');
  if (o.seconds !== undefined && !(o.seconds > 0 && o.seconds <= 120)) throw new Error('listen: --seconds is over 0, at most 120');
  return o;
}

/**
 * Render one name into out: the WAV, the spectrogram and the readout.
 * @param {any} bank
 * @param {string} name
 * @param {{rate: number, seconds?: number, out: string}} o
 */
export function listen(bank, name, { rate, seconds, out }) {
  const r = renderNamed(bank, name, { rate, seconds });
  mkdirSync(out, { recursive: true });
  const m = roundMeasure(measure(r.samples, rate));
  const sg = spectrogramPNG(r.samples, rate);
  writeFileSync(join(out, `${name}.wav`), wavBytes(r.samples, rate));
  writeFileSync(join(out, `${name}.spectrogram.png`), sg.png);
  const readout = { name, kind: r.kind, rate, seconds: r.samples.length / rate, hash: pcmHash(r.samples), measure: m, ...(r.variants ? { variants: r.variants } : {}) };
  writeFileSync(join(out, `${name}.json`), `${JSON.stringify(readout, null, 1)}\n`);
  return readout;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    const o = parseArgs(process.argv.slice(2));
    const a = loadAudio();
    if (a.errors.length) throw new Error(a.errors.map((e) => `${e.file}:${e.line}: ${e.code} ${e.msg}`).join('\n'));
    if (o.update) {
      const g = makeGolden(a.bank);
      mkdirSync(join(ROOT, 'test', 'golden', 'audio'), { recursive: true });
      writeFileSync(GOLDEN_PATH, `${JSON.stringify(g, null, 1)}\n`);
      console.log(`listen: wrote test/golden/audio/a1.json (${Object.keys(a.bank.cues).length} cues at ${RATES.join(' and ')} Hz, the limiter, ${Object.keys(g.scenes).length} scenes)`);
    }
    if (o.check || o.update) {
      const r = runChecks({ bank: a.bank });
      for (const line of r.readings) console.log(`  ${line}`);
      for (const f of r.failures) console.log(`listen: ${f}`);
      console.log(r.ok ? 'listen: the goldens and the checks pass' : `listen: ${r.failures.length} problem${r.failures.length === 1 ? '' : 's'}`);
      if (!r.ok) process.exit(1);
    }
    if (o.name) {
      const r = listen(a.bank, o.name, { rate: o.rate, seconds: o.seconds, out: o.out });
      const m = r.measure;
      console.log(`listen: ${o.name} (${r.kind}) ${r.seconds.toFixed(2)} s at ${o.rate} Hz, hash ${r.hash}: peak ${m.peakDb ?? '-inf'} dBFS, true peak ${m.truePeakDb ?? '-inf'}, ${m.lufsI ?? '-inf'} LUFS, short-term max ${m.lufsSMax ?? '-inf'} -> ${o.out}/${o.name}.{wav,spectrogram.png,json}`);
      for (const [k, v] of (r.variants || []).entries()) console.log(`  variant ${k}: ${v.hash}, peak ${v.measure.peakDb} dBFS, ${(100 * v.mid).toFixed(0)}% between ${MID.lo} Hz and ${MID.hi} Hz`);
    } else if (!o.check && !o.update) {
      console.log(`listen: name a cue (${Object.keys(a.bank.cues).join(', ')}) or a scene (${Object.keys(a.bank.scenes).join(', ')}), or --check, or --update`);
    }
  } catch (e) {
    console.error(/** @type {Error} */ (e).message);
    process.exit(1);
  }
}
