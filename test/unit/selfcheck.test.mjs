// The self-check's runner (BUILD_PLAN S3, 6.6, 14.1 T0; GAME_DESIGN E.11):
// pure and repeatable, one hash per group, each group sensitive to its own
// vectors only, and the golden trip shapes (from the start, from a fresh
// device, through a save) agreeing where they should.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runSelfCheck, runTrip, bitsHex, GROUPS } from '../../web/js/engine/selfcheck.js';
import { hash12 } from '../../web/js/engine/step.js';
import { compileFx, FX_HASH, fxContent, play, started, withBans } from './enginefix.mjs';

/** A small corpus, shaped as the build's selfcheck.json. */
function corpus() {
  const content = fxContent();
  const pass = play(started(content, '00000000'), [{ t: 'next' }, { t: 'choose', c: 'go' }, { t: 'next' }], content).session;
  const head = play(started(content, '00000000'), [{ t: 'next' }, { t: 'choose', c: 'go' }], content).session;
  const { rules, voice } = compileFx();
  const profile = pass.state.trip.profile;
  return {
    v: 1,
    fixture: { rules, voice, rulesHash: FX_HASH },
    trips: [
      { name: 'pass', log: pass.log, profile, base: null },
      { name: 'first', log: pass.log, profile, base: null, first: { name: '{HIKER}', id: 'h00000001' } },
      { name: 'resume', log: pass.log, profile, base: null, resume: 2 },
      { name: 'rebase', log: { ...pass.log, base: hash12(head.state.trip), actions: [['next']] }, profile, base: head.state.trip },
      { name: 'refused', log: { ...pass.log, actions: [...pass.log.actions, ['choose', 'go']] }, profile, base: null },
    ],
    vectors: {
      sha: ['', 'abc', 'a'.repeat(1000)],
      rng: [
        { seed: 'K7QM2Q9F', stream: 'weather', key: [1], n: 8 },
        { seed: '00000000', stream: 'text', key: ['lot', 0, 1], n: 4 },
      ],
      math: { exp: [0, 1, -3.5], ln: [1, 2, 1e-300], pow: [[2, 0.5], [-2, 3]], sin: [0, 1, 1e4], cos: [0, 1, -2] },
      expr: [
        ["0.5 + (flag('rested') ? 0.25 : 0)", { flags: ['rested'] }],
        ['trip.day * 2', { vars: { 'trip.day': 3 } }],
        ['1 / trip.n', { vars: { 'trip.n': 0 } }],
      ],
    },
  };
}

test('runSelfCheck gives one SHA-256 hex per group, the same twice', () => {
  const c = corpus();
  const a = runSelfCheck(c);
  assert.deepEqual(Object.keys(a.groups), [...GROUPS]);
  for (const g of GROUPS) assert.match(a.groups[g], /^[0-9a-f]{64}$/, g);
  assert.deepEqual(runSelfCheck(corpus()).groups, a.groups);
});

test('each group answers to its own vectors only', () => {
  const base = runSelfCheck(corpus()).groups;
  const changed = (mutate) => {
    const c = corpus();
    mutate(c);
    const g = runSelfCheck(c).groups;
    return GROUPS.filter((k) => g[k] !== base[k]);
  };
  assert.deepEqual(changed((c) => c.vectors.sha.push('x')), ['sha']);
  assert.deepEqual(changed((c) => (c.vectors.rng[0].n = 9)), ['rng']);
  assert.deepEqual(changed((c) => c.vectors.math.sin.push(2)), ['math']);
  assert.deepEqual(changed((c) => c.vectors.expr.push(['1 + 1', {}])), ['expr']);
  assert.deepEqual(changed((c) => (c.trips[0].name = 'renamed')), ['trips', 'screens']);
  assert.deepEqual(changed((c) => (c.trips[0].log = { ...c.trips[0].log, actions: c.trips[0].log.actions.slice(0, 2) })), ['log', 'trips', 'screens']);
});

test('the golden shapes agree: from the start, from a fresh device and through a save end alike; a rebase too; a refusal is recorded', () => {
  const c = corpus();
  const content = fxContent();
  const [pass, first, resume, rebase, refused] = c.trips.map((t) => runTrip(t, content));
  assert.equal(first.hash, pass.hash, 'from a fresh device: sign, start, then the log');
  assert.equal(resume.hash, pass.hash, 'saved after two actions, through JSON');
  assert.equal(rebase.hash, pass.hash, 'from the base snapshot');
  assert.equal(first.identity, pass.identity);
  assert.equal(resume.screens, pass.screens, 'the same screens');
  assert.deepEqual(refused.error, { at: 3, code: 'refused' });
  assert.equal(refused.hash, pass.hash, 'the fold stops where it was refused');
  assert.match(pass.packed, /^4f50/);
  assert.equal(pass.error, null);
});

test('the self-check runs with the bans in force: no clock, no Math.random, no approximate Math (D11)', () => {
  const c = corpus();
  const plainRun = runSelfCheck(c).groups;
  const banned = withBans(() => runSelfCheck(corpus()).groups);
  assert.deepEqual(banned, plainRun);
});

test('bitsHex writes a double as 16 hex digits, big-endian', () => {
  assert.equal(bitsHex(1), '3ff0000000000000');
  assert.equal(bitsHex(Math.PI), '400921fb54442d18');
  assert.equal(bitsHex(-0), '8000000000000000');
});

test('a corpus with no fixture still checks its vectors, and records each trip as failed', () => {
  const c = corpus();
  delete c.fixture;
  const g = runSelfCheck(c).groups;
  assert.equal(g.sha, runSelfCheck(corpus()).groups.sha);
  assert.notEqual(g.trips, runSelfCheck(corpus()).groups.trips);
  assert.deepEqual(Object.keys(runSelfCheck({}).groups), [...GROUPS], 'an empty corpus hashes empty lists');
});
