// Listening with no ears (BUILD_PLAN 13.5, S5 sound A1): tools/listen.mjs
// writes a proper WAV, a spectrogram in the 16 colors and a readout; its
// --check passes on the repo and fails on a planted change; the audio
// reader holds the cue bank and the license log to their schemas and to
// each other; and the build's audio step refuses a bank that drifted from
// its goldens.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { wavBytes, spectrogramPNG, rampStep, paletteRGB, runChecks, loadAudio, buildAudio, makeGolden, goldenDiff, parseArgs, renderNamed, shippedBank, cueHashes, readGolden, SPECTROGRAM, MID, AUDIO_FILES } from '../../tools/listen.mjs';
import { mixScene, renderCue } from '../../web/js/audio/dsp.js';
import { ROOT } from '../../tools/pics.mjs';

const AUDIO = loadAudio();
const BANK = AUDIO.bank;
const LISTEN = join(ROOT, 'tools', 'listen.mjs');

/** A copy of what the reader and the build read (content/, schemas/) in a temp folder. */
function audioCopy(t) {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-listen-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  for (const d of ['content', 'schemas']) cpSync(join(ROOT, d), join(tmp, d), { recursive: true });
  return tmp;
}

/** A PNG's chunks: [type, data]. */
function chunks(png) {
  const out = [];
  let at = 8;
  while (at < png.length) {
    const len = png.readUInt32BE(at);
    out.push([png.toString('ascii', at + 4, at + 8), png.subarray(at + 8, at + 8 + len)]);
    at += 12 + len;
  }
  return out;
}

test('the WAV: RIFF, PCM 16-bit, mono, the rate and the data length; samples rounded without dither, clipped at full scale', () => {
  const samples = new Float32Array([0, 0.5, -0.5, 1, -1, 2, -2, 1 / 32767, 0.4 / 32767]);
  const w = wavBytes(samples, 44100);
  assert.equal(w.toString('ascii', 0, 4), 'RIFF');
  assert.equal(w.readUInt32LE(4), 36 + samples.length * 2);
  assert.equal(w.toString('ascii', 8, 16), 'WAVEfmt ');
  assert.equal(w.readUInt32LE(16), 16);
  assert.equal(w.readUInt16LE(20), 1, 'PCM');
  assert.equal(w.readUInt16LE(22), 1, 'mono');
  assert.equal(w.readUInt32LE(24), 44100);
  assert.equal(w.readUInt32LE(28), 88200, 'bytes a second');
  assert.equal(w.readUInt16LE(32), 2);
  assert.equal(w.readUInt16LE(34), 16);
  assert.equal(w.toString('ascii', 36, 40), 'data');
  assert.equal(w.readUInt32LE(40), samples.length * 2);
  assert.equal(w.length, 44 + samples.length * 2);
  const pcm = Array.from({ length: samples.length }, (_, i) => w.readInt16LE(44 + 2 * i));
  assert.deepEqual(pcm, [0, 16384, -16383, 32767, -32767, 32767, -32767, 1, 0], 'x 32767, rounded half up (Math.round)');
  assert.ok(wavBytes(samples, 44100).equals(w), 'the same bytes every time');
});

test('the spectrogram: 64 bands by 20 ms frames, 4 px a cell, in the palette, and only the ramp of ink, navy, slate, teal, sage and snow', () => {
  const rate = 48000;
  const scene = mixScene(BANK.scenes.ui_demo, BANK, { rate });
  const sg = spectrogramPNG(scene, rate);
  assert.equal(sg.frames, 500);
  assert.equal(sg.width, 500 * 4);
  assert.equal(sg.height, 64 * 4);
  const cs = chunks(sg.png);
  assert.deepEqual(cs.map((c) => c[0]), ['IHDR', 'PLTE', 'IDAT', 'IEND']);
  assert.equal(cs[0][1].readUInt32BE(0), sg.width);
  assert.equal(cs[0][1].readUInt32BE(4), sg.height);
  assert.equal(cs[0][1][9], 3, 'indexed color');
  const rgb = paletteRGB();
  assert.equal(rgb.length, 16);
  assert.deepEqual([...cs[1][1]], rgb.flat(), 'the palette is the game\'s 16 colors');
  // Re-pinned in S6: palette A's bonfire gold, #ebb53d (decision 68; option B's was #e8b33a).
  assert.deepEqual(rgb[7], [0xeb, 0xb5, 0x3d], 'slot 7 is bonfire gold');
  const raw = inflateSync(cs[2][1]);
  const used = new Set();
  for (let y = 0; y < sg.height; y++) for (let x = 0; x < sg.width; x++) used.add(raw[y * (sg.width + 1) + 1 + x]);
  assert.deepEqual(SPECTROGRAM.ramp, [0, 1, 2, 15, 14, 4]);
  for (const u of used) assert.ok(SPECTROGRAM.ramp.includes(u), `slot ${u} is on the ramp`);
  assert.ok(!used.has(7), 'never gold');
  assert.ok(used.has(0) && used.size >= 3, 'mostly ink, with the ticks in color');
  assert.deepEqual([rampStep(-200), rampStep(-96), rampStep(-81), rampStep(-80), rampStep(-20), rampStep(10), rampStep(NaN)], [0, 1, 1, 2, 5, 5, 0]);
});

test('--check passes on the repo: every golden, nothing over -1 dBFS out of the limiter, every cue in a phone speaker\'s range', () => {
  const r = runChecks({ bank: BANK });
  assert.deepEqual(r.failures, []);
  assert.equal(r.ok, true);
  assert.ok(r.readings.some((l) => l.startsWith('scene ui_demo: peak ')));
  assert.ok(r.readings.some((l) => l.startsWith('limiter: a +6 dBFS probe comes out at -1.00 dBFS')));
  assert.equal(MID.share, 0.4);
  // The command itself, as a session runs it.
  const out = execFileSync(process.execPath, [LISTEN, '--check'], { encoding: 'utf8' });
  assert.match(out, /listen: the goldens and the checks pass\n$/);
  // The golden file is what --update would write today.
  assert.deepEqual(goldenDiff(makeGolden(BANK), readGolden()), []);
});

test("--check fails on a planted change: a cue's frequency, a cue's level, a scene's timing", () => {
  const plant = (f) => {
    const b = JSON.parse(JSON.stringify(BANK));
    f(b);
    return runChecks({ bank: b });
  };
  const freq = plant((b) => {
    b.cues['ui.tick'].layers[1].hz = 1750;
  });
  assert.equal(freq.ok, false);
  assert.ok(freq.failures.some((f) => f.startsWith('ui.tick variant 0 at 48000: ')));
  assert.ok(freq.failures.some((f) => f.startsWith('ui.tick variant 0 at 44100: ')));
  assert.ok(freq.failures.some((f) => f.startsWith('ui.next variant 0 at 48000: ')), 'ui.next is two ticks');
  assert.ok(freq.failures.some((f) => f.startsWith('scene ui_demo: ')));
  assert.ok(!freq.failures.some((f) => f.startsWith('ui.open')), 'only what changed');
  const level = plant((b) => {
    b.cues['ui.open'].db = -5;
  });
  assert.ok(level.failures.some((f) => f.startsWith('ui.open variant 3 at 48000')));
  // A cue moved below the phone speaker's range fails the mid-range check too.
  const low = plant((b) => {
    b.cues['ui.open'].layers[0].hz = 300;
    b.cues['ui.open'].layers[1].hz = 600;
  });
  assert.ok(low.failures.some((f) => /^ui\.open variant \d keeps [\d.]+% of its energy between 800 Hz and 5000 Hz, under 40%$/.test(f)));
  const timing = plant((b) => {
    b.scenes.ui_demo.every = 0.4;
  });
  assert.deepEqual(timing.failures.filter((f) => !f.startsWith('scene ui_demo')), []);
  assert.ok(timing.failures.length >= 1);
});

test('rendering by name: a cue lays its variants end to end with each one\'s hash; a scene mixes; an unknown name says what there is', (t) => {
  const r = renderNamed(BANK, 'ui.tick');
  assert.equal(r.kind, 'cue');
  assert.equal(r.variants.length, 4);
  assert.deepEqual(r.variants.map((v) => v.hash), cueHashes(BANK)['ui.tick']);
  assert.ok(r.variants.every((v) => v.mid >= 0.4 && v.measure.peakDb < -1));
  const s = renderNamed(BANK, 'ui_demo', { seconds: 2 });
  assert.equal(s.kind, 'scene');
  assert.equal(s.samples.length, 96000);
  // Re-pinned at S6: the bank's five new cues are in the list.
  assert.throws(() => renderNamed(BANK, 'ui.nope'), /no cue or scene "ui\.nope" \(cues: ui\.tick, ui\.next, ui\.open, ui\.sound_on, ui\.compass, ui\.land, ui\.good, ui\.mishap, ui\.serious; scenes: ui_demo, silence\)/);
  // The command writes the WAV, the spectrogram and the readout.
  const out = mkdtempSync(join(tmpdir(), 'oph-listen-out-'));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  const said = execFileSync(process.execPath, [LISTEN, 'ui.open', '--out', out], { encoding: 'utf8' });
  assert.match(said, /^listen: ui\.open \(cue\) /);
  for (const f of ['ui.open.wav', 'ui.open.spectrogram.png', 'ui.open.json']) assert.ok(existsSync(join(out, f)), f);
  const readout = JSON.parse(readFileSync(join(out, 'ui.open.json'), 'utf8'));
  assert.deepEqual(Object.keys(readout), ['name', 'kind', 'rate', 'seconds', 'hash', 'measure', 'variants']);
  assert.deepEqual(Object.keys(readout.measure), ['peakDb', 'truePeakDb', 'lufsI', 'lufsMMax', 'lufsSMax']);
  assert.equal(readFileSync(join(out, 'ui.open.wav')).toString('ascii', 0, 4), 'RIFF');
  // Arguments.
  assert.deepEqual(parseArgs(['ui_demo', '--rate', '44100', '--seconds', '3', '--out', 'x']), { name: 'ui_demo', rate: 44100, seconds: 3, out: 'x', check: false, update: false });
  assert.equal(parseArgs(['--check']).check, true);
  assert.throws(() => parseArgs(['--rate', '7']), /--rate is 8000 to 192000/);
  assert.throws(() => parseArgs(['--seconds', '0']), /--seconds/);
  assert.throws(() => parseArgs(['--loud']), /what is "--loud"/);
});

test('the audio reader: the repo\'s bank and log check; a schema break is J01, a dangling or unlogged cue is R01', (t) => {
  assert.deepEqual(AUDIO.errors, []);
  assert.deepEqual(Object.keys(AUDIO_FILES), ['bank', 'credits']);
  // Every cue has its synth entry, and every entry its recipe: decision 33's log.
  assert.deepEqual(AUDIO.credits.sounds.map((s) => [s.id, s.source, s.license, s.recipe, s.file, s.made_by]), Object.keys(BANK.cues).map((id) => [id, 'synth', 'synth', id, null, 'web/js/audio/dsp.js']));
  for (const s of AUDIO.credits.sounds) assert.ok(s.uses.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(s.checked));
  const tmp = audioCopy(t);
  const bankPath = join(tmp, 'content', 'audio', 'sounds.json');
  const creditsPath = join(tmp, 'content', 'audio', 'credits.json');
  const write = (path, f) => {
    const j = JSON.parse(readFileSync(join(ROOT, 'content', 'audio', path.endsWith('credits.json') ? 'credits.json' : 'sounds.json'), 'utf8'));
    f(j);
    writeFileSync(path, JSON.stringify(j, null, 1));
  };
  write(bankPath, (b) => {
    b.cues['ui.tick'].bus = 'radio';
  });
  const e1 = loadAudio(tmp).errors;
  assert.equal(e1.length, 1);
  assert.equal(e1[0].code, 'J01');
  assert.equal(e1[0].file, 'content/audio/sounds.json');
  assert.match(e1[0].msg, /^cues\.ui\.tick\.bus: /);
  assert.ok(e1[0].line > 1, 'at its line');
  write(bankPath, (b) => {
    b.cues['ui.next'].layers[1].cue = 'ui.tock';
    b.cues['ui.blip'] = { when: 'x', bus: 'ui', variants: { n: 1 }, layers: [{ wave: 'sine', at: 0, env: { d: 0.01 } }] };
    b.scenes.ui_demo.cues.push('ui.gone');
  });
  const e2 = loadAudio(tmp).errors.map((e) => `${e.code} ${e.msg}`);
  assert.deepEqual(e2, [
    'R01 cue ui.next: no cue "ui.tock" in the bank',
    'R01 cue ui.blip: a sine needs its hz',
    'R01 scene ui_demo: no cue "ui.gone" in the bank',
    'R01 cue ui.blip has no entry in content/audio/credits.json: every shipped sound is logged (decision 33)',
  ]);
  write(bankPath, () => {});
  write(creditsPath, (c) => {
    c.sounds[1].license = 'CC-BY-SA-4.0';
  });
  const e3 = loadAudio(tmp).errors;
  assert.equal(e3.length, 1);
  assert.equal(e3[0].code, 'J01');
  assert.equal(e3[0].file, 'content/audio/credits.json');
  write(creditsPath, (c) => {
    c.sounds.push({ ...c.sounds[0] });
  });
  assert.deepEqual(loadAudio(tmp).errors.map((e) => `${e.code} ${e.msg}`), ['R01 ui.tick is logged twice']);
  // A cue that names itself through its layers.
  write(creditsPath, () => {});
  write(bankPath, (b) => {
    b.cues['ui.tick'].layers.push({ cue: 'ui.next', at: 0.2 });
  });
  assert.ok(loadAudio(tmp).errors.some((e) => e.code === 'R01' && /names itself through ui\.tick > ui\.next > ui\.tick/.test(e.msg)));
  rmSync(bankPath);
  assert.deepEqual(loadAudio(tmp).errors.map((e) => `${e.file} ${e.code}`), ['content/audio/sounds.json J01']);
});

test("the build's audio step ships the bank with its golden hashes, and refuses one that renders differently", (t) => {
  const tmp = audioCopy(t);
  const out = join(tmp, 'dist');
  mkdirSync(out, { recursive: true });
  const r = buildAudio(out, { root: tmp });
  assert.deepEqual(r, { cues: 9, variants: 36 }, 'S6: A1\'s four cues and S6\'s five, four variants each');
  const shipped = JSON.parse(readFileSync(join(out, 'audio', 'sounds.json'), 'utf8'));
  assert.deepEqual(shipped, shippedBank(BANK, cueHashes(BANK)));
  assert.deepEqual(Object.keys(shipped), ['format', 'cues', 'scenes', 'golden']);
  assert.deepEqual(Object.keys(shipped.cues['ui.tick']), ['bus', 'db', 'variants', 'layers']);
  // The shipped recipes render exactly as the source does.
  assert.deepEqual(Array.from(renderCue(shipped.cues['ui.next'], { variant: 1, bank: shipped, id: 'ui.next' })), Array.from(renderCue(BANK.cues['ui.next'], { variant: 1, bank: BANK, id: 'ui.next' })));
  // A changed recipe: the build refuses, naming the cue and the fix.
  const bankPath = join(tmp, 'content', 'audio', 'sounds.json');
  const b = JSON.parse(readFileSync(bankPath, 'utf8'));
  b.cues['ui.sound_on'].layers[1].hz = 1174;
  writeFileSync(bankPath, JSON.stringify(b));
  assert.throws(() => buildAudio(out, { root: tmp }), /the cue bank renders differently from test\/golden\/audio\/a1\.json \(ui\.sound_on variant 0 at 48000: [0-9a-f]{8}, golden [0-9a-f]{8}.*\): run npm run listen -- --update and review/);
  // A bank that doesn't check never reaches the goldens.
  b.cues['ui.sound_on'].bus = 'radio';
  writeFileSync(bankPath, JSON.stringify(b));
  assert.throws(() => buildAudio(out, { root: tmp }), /the sound's files don't check: content\/audio\/sounds\.json:\d+: J01/);
  // No goldens at all.
  assert.throws(() => buildAudio(out, { root: ROOT, golden: join(tmp, 'none.json') }), /no goldens at .*: run npm run listen -- --update and review/);
});
