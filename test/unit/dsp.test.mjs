// The sound's synthesis (BUILD_PLAN S5 sound A1, 13.5; GAME_DESIGN 13.11):
// web/js/audio/dsp.js renders every cue variant to its golden hash, bit
// for bit, at 48 and 44.1 kHz; the limiter holds its ceiling, delays by its
// lookahead and passes a quiet signal untouched; measure() reads BS.1770's
// reference; spectrum() finds a sine's band; and E04 keeps the module to
// the engine's bans, so Node's goldens are the phone's samples.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  renderCue,
  makeLimiter,
  limitBlock,
  limitAll,
  mixScene,
  measure,
  spectrum,
  spectrumDigits,
  bandEdges,
  energyShare,
  pcmHash,
  kWeighting,
  variantSpread,
  variantCount,
  oscillator,
  envelope,
  envSeconds,
  makeRandom,
  seedOf,
  sceneEvents,
  dbToGain,
  gainToDb,
  centsRatio,
  biquad,
  BUSES,
  LIMITER,
  GOLDEN_RATE,
  TABLE_SIZE,
} from '../../web/js/audio/dsp.js';
import { lintDsp, runLint, DSP_MODULE } from '../../tools/lint.mjs';
import { limiterProbe } from '../../tools/listen.mjs';
import { ROOT } from '../../tools/pics.mjs';

const BANK = JSON.parse(readFileSync(join(ROOT, 'content', 'audio', 'sounds.json'), 'utf8'));
const GOLDEN = JSON.parse(readFileSync(join(ROOT, 'test', 'golden', 'audio', 'a1.json'), 'utf8'));
const DB_MINUS_1 = 10 ** (-1 / 20);

/** A sine at a level (dBFS), seconds long, through Math.sin (a test signal, not the module's). */
function sine(hz, db, seconds, rate = 48000) {
  const a = 10 ** (db / 20);
  const x = new Float32Array(Math.round(seconds * rate));
  for (let i = 0; i < x.length; i++) x[i] = a * Math.sin((2 * Math.PI * hz * i) / rate);
  return x;
}

test('every cue variant renders to its golden hash at 48 kHz and at 44.1 kHz, the same twice (bit-exact)', () => {
  // Re-pinned at S6: A1's four UI cues, and S6 adds the compass's two and the outcomes' three.
  assert.deepEqual(Object.keys(BANK.cues).sort(), ['ui.compass', 'ui.good', 'ui.land', 'ui.mishap', 'ui.next', 'ui.open', 'ui.serious', 'ui.sound_on', 'ui.tick'], "A1's four UI cues and S6's five");
  for (const rate of [48000, 44100]) {
    const want = GOLDEN.cues[String(rate)];
    assert.deepEqual(Object.keys(want).sort(), Object.keys(BANK.cues).sort(), `the golden holds every cue at ${rate}`);
    for (const [id, cue] of Object.entries(BANK.cues)) {
      assert.equal(variantCount(cue), 4, `${id}: four variants`);
      const got = [];
      for (let v = 0; v < variantCount(cue); v++) {
        const a = renderCue(cue, { rate, variant: v, bank: BANK, id });
        const b = renderCue(cue, { rate, variant: v, bank: BANK, id });
        assert.ok(a instanceof Float32Array && a.length > 0);
        assert.equal(pcmHash(a), pcmHash(b), `${id} #${v} at ${rate}: the same twice`);
        got.push(pcmHash(a));
      }
      assert.deepEqual(got, want[id], `${id} at ${rate}`);
      assert.equal(new Set(got).size, got.length, `${id}: each variant differs`);
    }
  }
});

test("the cue bank's shape: each cue on the UI bus, short, dry and quiet, with its weight between 800 Hz and 5 kHz (13.2, 13.11)", () => {
  for (const [id, cue] of Object.entries(BANK.cues)) {
    assert.equal(cue.bus, 'ui', id);
    assert.deepEqual(cue.variants, { n: 4, cents: 25, db: 1 }, id);
    for (let v = 0; v < 4; v++) {
      const s = renderCue(cue, { rate: 48000, variant: v, bank: BANK, id });
      assert.ok(s.length / 48000 <= 0.2, `${id}: short`);
      const m = measure(s, 48000);
      assert.ok(m.peakDb < -1, `${id} #${v} peaks under -1 dBFS before its bus (${m.peakDb})`);
      assert.ok(energyShare(s, 48000, 800, 5000) >= 0.4, `${id} #${v}: 40% of its energy in a phone speaker's range`);
      assert.ok(energyShare(s, 48000, 10000, 24000) < 0.01, `${id} #${v}: almost nothing above 10 kHz (no aliasing)`);
    }
  }
  // ui.next is ui.tick twice, 70 ms apart, the second 3 semitones lower and 2 dB quieter.
  assert.deepEqual(BANK.cues['ui.next'].layers, [{ cue: 'ui.tick', at: 0 }, { cue: 'ui.tick', at: 0.07, semitones: -3, db: -2 }]);
  const next = renderCue(BANK.cues['ui.next'], { rate: 48000, variant: 0, bank: BANK, id: 'ui.next' });
  const tick = renderCue(BANK.cues['ui.tick'], { rate: 48000, variant: 0, bank: BANK, id: 'ui.tick' });
  assert.ok(next.length >= Math.round(0.07 * 48000) + tick.length - 1, 'two ticks long');
});

test('no UI cue is a melody: a cue\'s pitched layers sound together or fall, and nothing rises, so only the Bonfire Lily\'s five notes ever rise on the trail (13.1 rule 1, 13.2, decision 62)', () => {
  /** Every pitched layer a cue sounds, as [seconds, hz], through the cues it plays. */
  const notes = (cue, at = 0, semis = 0) =>
    cue.layers.flatMap((l) => {
      const t = at + (l.at || 0);
      const s = semis + (l.semitones || 0);
      if (l.cue) return notes(BANK.cues[l.cue], t, s);
      return l.wave === 'noise' || !l.hz ? [] : [[t, l.hz * 2 ** (s / 12)]];
    });
  for (const [id, cue] of Object.entries(BANK.cues)) {
    if (!id.startsWith('ui.')) continue;
    const n = notes(cue);
    for (const [t1, hz1] of n) for (const [t2, hz2] of n) if (t2 > t1) assert.ok(hz2 <= hz1 + 1e-9, `${id}: ${hz1.toFixed(0)} Hz at ${t1} s rises to ${hz2.toFixed(0)} Hz at ${t2} s`);
  }
  // Sound turned on is one blip, every layer at once.
  assert.deepEqual([...new Set(BANK.cues['ui.sound_on'].layers.map((l) => l.at))], [0]);
  assert.ok(BANK.cues['ui.sound_on'].layers.every((l) => !(l.wave === 'pulse' && l.duty === 0.25)), "not the band's pluck lead (13.2)");
});

test('the variants spread pitch and level evenly, and never put the highest pitch at the loudest level', () => {
  assert.deepEqual(variantSpread(0, 1), [0, 0]);
  const four = [0, 1, 2, 3].map((k) => variantSpread(k, 4));
  assert.deepEqual(four.map((s) => s[0]), [-1, -1 / 3, 1 / 3, 1]);
  assert.deepEqual([...four.map((s) => s[1])].sort((a, b) => a - b), [-1, -1 / 3, 1 / 3, 1]);
  assert.ok(four.every(([p, l]) => !(p === 1 && l === 1)));
  assert.ok(Math.abs(centsRatio(1200) - 2) < 1e-12 && centsRatio(0) === 1);
  assert.ok(Math.abs(dbToGain(-6) - 10 ** (-6 / 20)) < 1e-12 && dbToGain(0) === 1);
  assert.ok(Math.abs(gainToDb(0.5) - 20 * Math.log10(0.5)) < 1e-12 && gainToDb(0) === -Infinity);
});

test('the building blocks: oscillators, noise, envelopes and filters behave', () => {
  const rate = 48000;
  for (const wave of ['sine', 'saw', 'pulse', 'square', 'triangle']) {
    const osc = oscillator(wave, 440, rate, { duty: 0.25 });
    let peak = 0;
    let sum = 0;
    const n = rate; // a second: 440 whole cycles
    for (let i = 0; i < n; i++) {
      const v = osc();
      peak = Math.max(peak, Math.abs(v));
      sum += v;
    }
    assert.ok(peak > 0.5 && peak < 2.2, `${wave}: bounded (${peak})`);
    assert.ok(Math.abs(sum / n) < 0.02, `${wave}: no DC (${sum / n})`);
  }
  // The sine table is the engine's: a quarter cycle in, the peak.
  const s = oscillator('sine', rate / TABLE_SIZE, rate);
  for (let i = 0; i < TABLE_SIZE / 4; i++) s();
  assert.ok(Math.abs(s() - 1) < 1e-12);
  // Noise: deterministic per seed, different between seeds, inside -1..1.
  const n1 = oscillator('noise', 0, rate, { seed: seedOf('ui.tick#0/0') });
  const n2 = oscillator('noise', 0, rate, { seed: seedOf('ui.tick#0/0') });
  const n3 = oscillator('noise', 0, rate, { seed: seedOf('ui.tick#1/0') });
  const a = Array.from({ length: 64 }, () => n1());
  assert.deepEqual(Array.from({ length: 64 }, () => n2()), a);
  assert.notDeepEqual(Array.from({ length: 64 }, () => n3()), a);
  assert.ok(a.every((v) => v >= -1 && v < 1));
  const r = makeRandom(7);
  const r2 = makeRandom(7);
  assert.deepEqual([r(), r(), r()], [r2(), r2(), r2()]);
  // A one-shot envelope: up in its attack, down 60 dB by its end.
  const env = { a: 0.002, d: 0.03 };
  assert.equal(envSeconds(env), 0.032);
  const e = envelope(env, rate);
  const vals = Array.from({ length: Math.round(envSeconds(env) * rate) }, () => e());
  assert.equal(vals[0], 0);
  assert.ok(Math.abs(Math.max(...vals) - 1) < 1e-9);
  assert.ok(Math.abs(vals[vals.length - 1] - 0.001) < 0.0002, `-60 dB at the end (${vals[vals.length - 1]})`);
  // A sustained note holds its level, then releases.
  const held = envelope({ a: 0, d: 0.01, s: 0.5, hold: 0.1, r: 0.05 }, rate);
  const hv = Array.from({ length: Math.round(0.15 * rate) }, () => held());
  assert.ok(Math.abs(hv[Math.round(0.09 * rate)] - 0.5) < 0.01);
  assert.ok(hv[hv.length - 1] < 0.002);
  // RBJ's band-pass has unity gain at its center.
  const c = biquad('bandpass', 2400, 4, 0, rate);
  assert.ok(Math.abs(c.b0 + c.b2) < 1e-15 && c.b1 === 0);
});

test('the limiter: a +6 dBFS two-sine input never exceeds -1 dBFS; the delay is the lookahead; a quiet signal passes untouched (13.11)', () => {
  const rate = 48000;
  const loud = new Float64Array(rate);
  for (let i = 0; i < rate; i++) loud[i] = Math.sin((2 * Math.PI * 440 * i) / rate) + Math.sin((2 * Math.PI * 1000 * i) / rate);
  const out = limitAll(loud, rate);
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  assert.ok(peak <= DB_MINUS_1, `peak ${20 * Math.log10(peak)} dBFS`);
  assert.ok(peak > DB_MINUS_1 * 0.99, 'and it limits, not mutes');
  // The delay: 5 ms at 48 kHz is 240 samples.
  const st = makeLimiter({ rate });
  assert.equal(st.delay, 240);
  assert.equal(makeLimiter({ rate: 44100 }).delay, 221);
  const impulse = new Float32Array(1000);
  impulse[0] = 0.5;
  const o = new Float32Array(1000);
  limitBlock(st, impulse, o);
  assert.equal(o.findIndex((v) => v !== 0), 240);
  assert.equal(o[240], 0.5, 'under the ceiling: exactly itself');
  // A quiet signal comes through sample for sample, only later.
  const quiet = sine(1000, -6, 0.5);
  const q = limitAll(quiet, rate);
  for (let i = 240; i < quiet.length; i++) if (q[i] !== quiet[i - 240]) assert.fail(`sample ${i} changed`);
  // The worklet's 128-sample blocks give exactly what one pass does.
  const blocks = new Float32Array(loud.length);
  const sb = makeLimiter({ rate });
  for (let at = 0; at < loud.length; at += 128) limitBlock(sb, loud.subarray(at, at + 128), blocks.subarray(at, at + 128));
  assert.equal(pcmHash(blocks), pcmHash(out));
  // The golden's probe: the same two sines from the engine's sin, through a fresh limiter.
  const probe = limiterProbe();
  assert.equal(pcmHash(probe.output), GOLDEN.limiter, "the limiter's golden");
  assert.ok(probe.output.every((v) => Math.abs(v) <= DB_MINUS_1));
  assert.deepEqual(LIMITER, { ceilingDb: -1, lookaheadMs: 5, releaseMs: 80 });
});

test("measure(): BS.1770-4's reference, silence and a full-scale square", () => {
  // K-weighting at 48 kHz: the standard's own coefficients.
  const [shelf, rlb] = kWeighting(48000);
  const near = (a, b, tol) => assert.ok(Math.abs(a - b) < tol, `${a} vs ${b}`);
  near(shelf.b0, 1.53512485958697, 1e-9);
  near(shelf.b1, -2.69169618940638, 1e-9);
  near(shelf.b2, 1.19839281085285, 1e-9);
  near(shelf.a1, -1.69065929318241, 1e-9);
  near(shelf.a2, 0.73248077421585, 1e-9);
  near(rlb.a1, -1.99004745483398, 1e-7);
  near(rlb.a2, 0.99007225036621, 1e-7);
  // A 1 kHz sine at -20 dBFS, 10 s, mono: -23.0 LUFS.
  const m = measure(sine(1000, -20, 10), 48000);
  near(m.lufsI, -23.0, 0.1);
  near(m.lufsMMax, -23.0, 0.1);
  near(m.lufsSMax, -23.0, 0.1);
  near(m.peakDb, -20, 0.01);
  near(m.truePeakDb, -20, 0.05);
  // Silence: minus infinity throughout.
  const z = measure(new Float32Array(48000), 48000);
  assert.deepEqual(z, { peakDb: -Infinity, truePeakDb: -Infinity, lufsI: -Infinity, lufsMMax: -Infinity, lufsSMax: -Infinity });
  // A full-scale square's sample peak is 0.0 dB; its true peak no lower.
  const sq = new Float32Array(48000).map((_, i) => (Math.floor(i / 24) % 2 ? -1 : 1));
  const ms = measure(sq, 48000);
  assert.equal(ms.peakDb, 0);
  assert.ok(ms.truePeakDb >= 0);
  // An inter-sample peak: a sine at a quarter of the rate, sampled 45 degrees off its peaks.
  const isp = new Float32Array(4800).map((_, i) => 0.5 * Math.sin((Math.PI * i) / 2 + Math.PI / 4));
  const mi = measure(isp, 48000);
  near(mi.peakDb, 20 * Math.log10(0.5 * Math.SQRT1_2), 0.01);
  assert.ok(mi.truePeakDb > mi.peakDb + 2, `the true peak sees between the samples (${mi.truePeakDb} vs ${mi.peakDb})`);
});

test('spectrum() puts a 1 kHz sine in the band that holds 1 kHz; silence reads the floor; the digits are 10 x 16', () => {
  const edges = bandEdges(16, 40, 16000);
  const band = edges.findIndex((e, k) => k < 16 && e <= 1000 && edges[k + 1] > 1000);
  const spec = spectrum(sine(1000, -20, 1), 48000, { bands: 16, frames: 10 });
  assert.equal(spec.length, 10);
  for (const row of spec) {
    assert.equal(row.length, 16);
    assert.equal(row.indexOf(Math.max(...row)), band, 'the loudest band holds 1 kHz');
    assert.ok(Math.abs(row[band] - -20) < 1.5, `about -20 dB there (${row[band]})`);
  }
  const silent = spectrum(new Float32Array(48000), 48000);
  assert.ok(silent.every((row) => row.every((db) => db === -120)));
  const digits = spectrumDigits(spec);
  assert.match(digits, /^([0-9]{16} ){9}[0-9]{16}$/);
  assert.equal(digits.split(' ')[0][band], String(Math.floor((spec[0][band] + 90) / 10)), '10 dB a step from -90 dB');
  assert.equal(spectrumDigits([[0, -5, -10, -89.9, -90.1, -200, 12]]), '9880009', '0 dB and over is 9, -10 dB 8; under -80 dB, 0');
});

test('scenes: ui_demo plays the nine cues in turn every 500 ms, cycling their variants, and mixes to its golden; silence is silent', () => {
  const ev = sceneEvents(BANK.scenes.ui_demo, BANK);
  assert.equal(ev.length, 20);
  // Re-pinned at S6: the scene gains the compass's two cues and the outcomes' three, so the tick's second variant comes tenth.
  assert.deepEqual(ev.slice(0, 10).map((e) => [e.at, e.cue, e.variant]), [
    [0, 'ui.tick', 0],
    [0.5, 'ui.next', 0],
    [1, 'ui.open', 0],
    [1.5, 'ui.sound_on', 0],
    [2, 'ui.compass', 0],
    [2.5, 'ui.land', 0],
    [3, 'ui.good', 0],
    [3.5, 'ui.mishap', 0],
    [4, 'ui.serious', 0],
    [4.5, 'ui.tick', 1],
  ]);
  const demo = mixScene(BANK.scenes.ui_demo, BANK, { rate: 48000 });
  assert.equal(demo.length, 480000);
  assert.equal(pcmHash(demo), GOLDEN.scenes.ui_demo.hash);
  const m = measure(demo, 48000);
  assert.ok(m.peakDb <= -1, 'nothing over -1 dBFS out of the limiter');
  // The UI bus at -20 dB under the cues' own levels.
  assert.ok(m.peakDb < -20 && m.peakDb > -26, `quiet ticks (${m.peakDb})`);
  const silence = mixScene(BANK.scenes.silence, BANK, { rate: 48000 });
  assert.ok(silence.every((v) => v === 0));
  assert.equal(pcmHash(silence), GOLDEN.scenes.silence.hash);
  assert.deepEqual(BUSES, { body: -10, weather: -12, gear: -12, water: -14, bed: -16, life: -18, ui: -20, music: -6 });
  assert.equal(GOLDEN_RATE, 48000);
});

test('E04: the real dsp.js passes; a planted Math.sin, **, a clock or an import outside the engine fails', (t) => {
  const real = readFileSync(join(ROOT, DSP_MODULE), 'utf8');
  assert.deepEqual(lintDsp(DSP_MODULE, real, ROOT), []);
  const e04 = (code) => lintDsp(DSP_MODULE, code, ROOT).map((i) => `${i.line} ${i.code} ${i.msg}`);
  assert.deepEqual(e04("import { sin } from '../engine/math.js';\nexport const s = (x) => Math.sin(x);"), ['2 E04 dsp.js may not use Math.sin (BUILD_PLAN 13.5; GAME_DESIGN 13.11)']);
  assert.deepEqual(e04('export const sq = (x) => x ** 2;'), ['1 E04 dsp.js may not use the ** operator (BUILD_PLAN 13.5; GAME_DESIGN 13.11)']);
  assert.equal(e04('export const now = () => performance.now();').length, 1);
  assert.equal(e04('export const r = () => Math.random();').length, 1);
  assert.deepEqual(e04("import { t } from '../text.js';"), ['1 E04 "../text.js" is outside the engine: dsp.js imports only the engine\'s pure modules (BUILD_PLAN 13.5; GAME_DESIGN 13.11)']);
  assert.deepEqual(e04("import { x } from '../engine/nowhere.js';"), ['1 E04 "../engine/nowhere.js" is not a file in the engine']);
  assert.deepEqual(e04("import { exp } from '../engine/math.js';\nexport const g = (db) => exp(db) * Math.sqrt(2) + Math.fround(1);"), [], 'the exact Math members and the engine math pass');
  // In the repo lint: the real module is clean, and a planted ban fails it.
  const tmp = mkdtempSync(join(tmpdir(), 'oph-e04-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  for (const d of ['web', 'content', 'schemas']) cpSync(join(ROOT, d), join(tmp, d), { recursive: true });
  assert.deepEqual(runLint(tmp).filter((i) => i.code === 'E04'), []);
  writeFileSync(join(tmp, DSP_MODULE), `${real}\nexport const planted = (x) => Math.exp(x);\n`);
  assert.deepEqual(runLint(tmp).filter((i) => i.code === 'E04').map((i) => `${i.file} ${i.code}`), [`${DSP_MODULE} E04`]);
});
