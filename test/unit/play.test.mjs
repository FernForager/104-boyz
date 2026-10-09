// tools/play.mjs (BUILD_PLAN 2.7, 6.6, S3; GAME_DESIGN E.11, F.4): a pasted
// bug report, fenced or bare, replays on the build it came from to a match;
// a tampered hash is a MISMATCH (exit 1); the commit comes from the report's
// full SHA, its build's short SHA, or dev; a frozen replay keeps only its
// allowed keys and never a name; a sample trip reads as a transcript; and,
// with git, a report replays through a worktree of its own commit.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readReport, notReplayable, resolveCommit, replayHere, verdict, errorNotes, tryPending, frozenReplay, writeFrozen, playTrip, screenWords, transcriptText, loadDist, PlayError, FROZEN_KEYS, FROZEN_TRIP_KEYS } from '../../tools/play.mjs';
import { build } from '../../tools/build.mjs';
import { readText } from '../../tools/text.mjs';
import { ROOT } from '../../tools/pics.mjs';
import { newSession, dispatch } from '../../web/js/engine/step.js';
import { reportState } from '../../web/js/engine/save.js';

const PLAY = join(ROOT, 'tools', 'play.mjs');
/** The trailhead's lines the sample names, as C0 files them (a temp copy only stubs any not yet in the repo). */
const TRAIL_LINES = ['trail.sol_duc_trailhead.lot', 'trail.sol_duc_trailhead.trail_mouth', 'trail.walk_on'];

/**
 * A copy of the repo in a temp folder whose scope has the guest book and
 * the trail (as C-final's will), so preview carries the sample plan.
 * @returns {string} the copy's root
 */
function trailTree(t, name, dirs = ['web', 'config', 'content', 'schemas']) {
  const root = mkdtempSync(join(tmpdir(), `oph-${name}-`));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const d of dirs) cpSync(join(ROOT, d), join(root, d), { recursive: true });
  const scopeFile = join(root, 'content', 'scope', 'm1a.json');
  const scope = JSON.parse(readFileSync(scopeFile, 'utf8'));
  scope.screens = [...new Set([...scope.screens, 'guestbook', 'trail'])].sort();
  writeFileSync(scopeFile, `${JSON.stringify(scope, null, 1)}\n`);
  const have = readText(root).lines;
  const trailFile = join(root, 'content', 'text', 'en', 'trail.json');
  const lines = existsSync(trailFile) ? JSON.parse(readFileSync(trailFile, 'utf8')) : { $comment: 'Test stubs.' };
  for (const id of TRAIL_LINES) if (!have.has(id)) lines[id] = { text: `Words for ${id.split('.').pop()}.`, ctx: 'test', screen: 'trail', max: 140 };
  writeFileSync(trailFile, `${JSON.stringify(lines, null, 1)}\n`);
  return root;
}

/** A preview build with the sample, in a temp folder. */
function trailDist(t) {
  const root = trailTree(t, 'play');
  const out = join(root, 'dist', 'preview');
  // Outside git the build id is "dev", which a GitHub Actions run refuses; this copy is not the deploy.
  const gha = process.env.GITHUB_ACTIONS;
  delete process.env.GITHUB_ACTIONS;
  try {
    build({ root, channel: 'preview', out, quiet: true });
  } finally {
    if (gha !== undefined) process.env.GITHUB_ACTIONS = gha;
  }
  return out;
}

/** A session played on a dist: sign, start the sample with a seed, then the actions. */
function playedOn(dist, seed, actions) {
  const { content } = loadDist(dist);
  let s = dispatch(newSession(content), { t: 'sign', name: 'Robin', id: `h${seed}` }, content).session;
  s = dispatch(s, { t: 'start', plan: 'sample', seed }, content).session;
  for (const a of actions) s = dispatch(s, a, content).session;
  return { session: s, content };
}

/** A version 2 report around a session's state, as the debug menu builds it (D18). */
function reportOf(dist, session, content, extra = {}) {
  const version = JSON.parse(readFileSync(join(dist, 'version.json'), 'utf8'));
  return { report: 2, build: version.build, commit: version.commit, rules: version.rules, channel: 'preview', time: '2026-10-09T12:00:00.000Z', screen: 'trail', device: { ua: 'x' }, errors: [], note: 'my friend Robin says hi', state: reportState(session, content), ...extra };
}

test('a report reads fenced (as pasted in an issue or a chat) or bare; anything else is exit 2', () => {
  const r = { report: 2, state: null };
  assert.deepEqual(readReport(JSON.stringify(r)), r);
  assert.deepEqual(readReport(`Here it is:\n\n\`\`\`json\n${JSON.stringify(r, null, 1)}\n\`\`\`\n\nThanks`), r);
  assert.deepEqual(readReport(`\`\`\`json\r\n${JSON.stringify(r)}\r\n\`\`\`\r\n`), r, 'CRLF too');
  assert.throws(() => readReport('not json'), (e) => e instanceof PlayError && e.code === 2);
  // A note and an error holding ``` (JSON.stringify leaves backticks as they are) don't end the fence.
  const ticks = { report: 2, note: 'the box text overlaps: ```Walk on``` is cut off', errors: [{ msg: 'x ```', stack: '```\nat y' }], state: null };
  const fence = `\`\`\`json\n${JSON.stringify(ticks, null, 1)}\n\`\`\``;
  assert.deepEqual(readReport(fence), ticks, 'as copied');
  assert.deepEqual(readReport(`Here it is:\n\n${fence}\n\nThanks, and \`\`\`json\n{}\n\`\`\` is not it`), ticks, 'as pasted in an issue');
  assert.deepEqual(readReport(`\`\`\`json\n${JSON.stringify(r)}\`\`\``), r, 'a fence closed on the last line still reads');
});

test('only a report 2 with a trip replays: report 1, a boot report and no trip have nothing to replay', () => {
  const trip = { log: 'T1AB', profile: {}, base: null, hash: 'x' };
  assert.equal(notReplayable({ report: 2, state: { trip } }), null);
  assert.match(notReplayable({ report: 1, state: null }), /report 1 carries no trip/);
  assert.match(notReplayable({ report: 1, boot: true }), /boot report/);
  assert.match(notReplayable({ report: 2, state: { phase: 'guestbook', hiker: null, trip: null } }), /no trip/);
  assert.match(notReplayable({ report: 2, state: { trip: { ...trip, log: null } } }), /no log or profile/);
});

test("the commit: the report's full SHA; else its build's short SHA, resolved; else dev", () => {
  const full = 'abcdef0123456789abcdef0123456789abcdef01';
  const never = () => assert.fail('no lookup for a full SHA');
  assert.deepEqual(resolveCommit({ commit: full, build: '20261012-abcdef0' }, never), { sha: full, how: 'full' });
  assert.deepEqual(resolveCommit({ build: '20261012-abcdef0' }, (s) => (s === 'abcdef0' ? full : null)), { sha: full, how: 'short' });
  assert.deepEqual(resolveCommit({ commit: null, build: '20261012-abcdef0' }, () => full), { sha: full, how: 'short' }, 'a null commit (the page said dev) falls back to the build');
  assert.deepEqual(resolveCommit({ commit: null, build: 'dev' }, never), { sha: null, how: 'dev' });
  assert.throws(() => resolveCommit({ build: '20261012-abcdef0' }, () => null), (e) => e.code === 2 && /no commit abcdef0/.test(e.message));
  assert.throws(() => resolveCommit({ build: 'nonsense' }, never), (e) => e.code === 2);
});

test('a report made from a real session (reportState) replays here to a match; a tampered hash is a MISMATCH and exit 1', (t) => {
  const dist = trailDist(t);
  const { session, content } = playedOn(dist, 'K7QM2Q9F', [{ t: 'wait', s: 0 }, { t: 'next' }]);
  const report = reportOf(dist, session, content);
  assert.equal(report.state.hiker.name, '{HIKER}', 'the report never holds the name');
  const r = replayHere(report, dist);
  assert.equal(r.match, true, verdict(r));
  assert.equal(verdict(r), `replay: match ${report.state.trip.hash.slice(0, 12)}`);
  assert.deepEqual(r.steps.map((s) => s.action), [null, 'wait 0', 'next']);
  assert.deepEqual(r.steps.map((s) => s.screen.stop), ['sol_duc_trailhead.lot', 'sol_duc_trailhead.lot', 'sol_duc_trailhead.trail_mouth']);
  assert.ok(r.steps[0].screen.lines[0].length > 0 && !r.steps[0].screen.lines[0].startsWith('⟦'), 'the box in words');
  // The CLI, inside the commit: exit 0 on a match, 1 on a mismatch.
  const dir = mkdtempSync(join(tmpdir(), 'oph-report-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const good = join(dir, 'good.json');
  writeFileSync(good, `\`\`\`json\n${JSON.stringify(report, null, 1)}\n\`\`\``);
  const ok = spawnSync(process.execPath, [PLAY, '--replay-here', good, '--dist', dist], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /^replay: match [0-9a-f]{12}$/m);
  const bad = join(dir, 'bad.json');
  const tampered = { ...report, state: { ...report.state, trip: { ...report.state.trip, hash: '0'.repeat(64) } } };
  writeFileSync(bad, JSON.stringify(tampered));
  const no = spawnSync(process.execPath, [PLAY, '--replay-here', bad, '--dist', dist], { encoding: 'utf8' });
  assert.equal(no.status, 1);
  assert.match(no.stdout, new RegExp(`^replay: MISMATCH want 000000000000 got ${report.state.trip.hash.slice(0, 12)}$`, 'm'));
  // A log for other rules stops with its code.
  const other = replayHere({ ...report, state: { ...report.state, trip: { ...report.state.trip, profile: { ...report.state.trip.profile, body_lb: 1 } } } }, dist);
  assert.equal(other.match, false);
  assert.equal(other.error.code, 'format');
  assert.match(verdict(other), /MISMATCH .* \(stopped: format\)$/);
});

test("the action that threw (state.pending, never in the log) is tried again after the fold, and a report's errors the log doesn't reproduce are named (E.11)", (t) => {
  const dist = trailDist(t);
  const { session, content } = playedOn(dist, 'K7QM2Q9F', [{ t: 'next' }]);
  const report = reportOf(dist, session, content, { errors: [{ message: 'TypeError: x is undefined' }] });
  const plain = replayHere(report, dist);
  assert.equal(plain.match, true);
  assert.equal(plain.pending, null);
  assert.deepEqual(errorNotes(report, plain), ["play: warning: the report carries 1 error, which the log replays without (see the report's errors)"]);
  const threw = replayHere({ ...report, state: { ...report.state, pending: ['wait', -1] } }, dist);
  assert.equal(threw.match, true, 'the verdict is still the log\'s');
  assert.deepEqual(threw.pending, { action: 'wait -1', tried: true, threw: 'EngineError invalid' });
  assert.deepEqual(errorNotes(report, threw), ['replay: the action that threw, "wait -1", throws here too: EngineError invalid']);
  const clean = replayHere({ ...report, state: { ...report.state, pending: ['next'] } }, dist);
  assert.match(errorNotes(report, clean)[0], /"next", runs clean here: its error wasn't the engine's/);
  assert.deepEqual(tryPending(['sign'], null, content), { action: 'sign', tried: false, threw: null });
  assert.deepEqual(errorNotes({ errors: [] }, { pending: null }), []);
});

test('--freeze keeps only the allowed keys: no device facts, errors, note or time, and never a name', (t) => {
  const report = {
    report: 2,
    build: '20261012-abc1234',
    commit: 'a'.repeat(40),
    rules: '0123456789ab',
    channel: 'preview',
    time: 'x',
    device: { ua: 'x' },
    errors: [{ message: 'm' }],
    note: 'my friend Robin',
    selfcheck: { ran: true },
    state: { phase: 'trailhead', hiker: { id: 'hK7QM2Q9F', name: '{HIKER}', chars: 5, trips: 0 }, trip: { seed: 'K7QM2Q9F', plan: 'sample', stop: 2, log: 'T1AB', profile: { seen: {} }, base: null, hash: 'f'.repeat(64), last: ['next'], snapshot: { n: 2 } } },
  };
  const f = frozenReplay(report, 'first_report');
  assert.deepEqual(Object.keys(f), [...FROZEN_KEYS]);
  assert.deepEqual(Object.keys(f.state), ['trip']);
  assert.deepEqual(Object.keys(f.state.trip), [...FROZEN_TRIP_KEYS]);
  assert.ok(!JSON.stringify(f).includes('Robin'), 'the note is dropped');
  const named = { ...report, state: { ...report.state, hiker: { ...report.state.hiker, name: 'seen' } } };
  assert.throws(() => frozenReplay(named, 'x'), /holds the hiker's name/, 'a name in what it keeps refuses the freeze');
  assert.throws(() => frozenReplay(report, 'Bad Name'), (e) => e.code === 2);
  const root = mkdtempSync(join(tmpdir(), 'oph-freeze-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const file = writeFrozen(report, 'first_report', root);
  assert.equal(file, join(root, 'test', 'golden', 'replays', 'first_report.json'));
  assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')), f);
});

test('a sample trip reads as a transcript: the guest book, both stops in words, and the final hash', (t) => {
  const dist = trailDist(t);
  const a = playTrip({ dist, seed: 'K7QM2Q9F', bot: 'first' });
  const b = playTrip({ dist, seed: 'K7QM2Q9F', bot: 'first' });
  assert.equal(a.hash, b.hash, 'the same seed, the same trip');
  assert.equal(a.ended, true);
  assert.deepEqual(a.steps.map((s) => s.action), [null, 'sign', 'start sample K7QM2Q9F', 'next', 'next']);
  assert.deepEqual(a.steps.map((s) => s.screen.phase), ['guestbook', 'home', 'trailhead', 'trailhead', 'home']);
  const text = transcriptText(a.steps);
  assert.match(text, /\[trailhead sol_duc_trailhead\.lot, stop 1\]/);
  assert.match(text, /\[trailhead sol_duc_trailhead\.trail_mouth, stop 2\]/);
  assert.match(text, /\(a name field\)/);
  assert.ok(!text.includes('⟦trail.'), 'every trail line in words');
  assert.equal(playTrip({ dist, seed: 'K7QM2Q9F', bot: 'random' }).ended, true);
  assert.throws(() => playTrip({ dist, seed: 'nope' }), (e) => e.code === 2);
  assert.throws(() => playTrip({ dist, bot: 'oracle' }), (e) => e.code === 2);
  const w = screenWords({ phase: 'trailhead', stop: { set: 's', id: 'a', n: 1 }, box: [{ id: 'zz.none' }], choices: [{ act: { t: 'choose', c: 'go' }, label: { id: 'zz.go' }, enabled: false }] }, {});
  assert.deepEqual(w.lines, ['⟦zz.none⟧'], 'a line the build lacks shows its id');
  assert.deepEqual(w.choices, ['⟦zz.go⟧ (not now)']);
});

const hasGit = (() => {
  try {
    execFileSync('git', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

test('with git: a report replays through a worktree of its own commit, here when it is HEAD and clean, and a rules mismatch is exit 3', { skip: !hasGit && 'no git here' }, (t) => {
  const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.invalid', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.invalid', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' };
  const repo = trailTree(t, 'git', ['web', 'config', 'content', 'schemas', 'tools', 'sims', 'test/fixtures', 'test/golden']);
  cpSync(join(ROOT, 'package.json'), join(repo, 'package.json'));
  writeFileSync(join(repo, '.gitignore'), 'dist/\nsite/\nout/\nnode_modules/\n');
  const git = (...args) => execFileSync('git', ['-c', 'commit.gpgsign=false', ...args], { cwd: repo, env: GIT_ENV, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
  git('init', '-q');
  git('add', '-A');
  git('commit', '-q', '-m', 'A');
  const shaA = git('rev-parse', 'HEAD');
  // The report: preview built at A, a trip played on it.
  const distA = join(repo, 'dist', 'preview');
  execFileSync(process.execPath, ['tools/build.mjs', '--channel', 'preview'], { cwd: repo, env: { ...GIT_ENV, CHANNEL: 'preview' }, stdio: 'ignore' });
  const { session, content } = playedOn(distA, '00000001', [{ t: 'next' }]);
  const report = reportOf(distA, session, content);
  assert.equal(report.commit, shaA);
  // Then another commit, so A is not HEAD.
  writeFileSync(join(repo, 'NOTES.md'), 'later\n');
  git('add', '-A');
  git('commit', '-q', '-m', 'B');
  const shaB = git('rev-parse', 'HEAD');
  const dir = mkdtempSync(join(tmpdir(), 'oph-report-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  let k = 0;
  const run = (r, ...args) => {
    const file = join(dir, `report-${k++}.json`);
    writeFileSync(file, `Pasted:\n\`\`\`json\n${JSON.stringify(r, null, 1)}\n\`\`\`\n`);
    return spawnSync(process.execPath, ['tools/play.mjs', '--replay', file, ...args], { cwd: repo, env: GIT_ENV, encoding: 'utf8' });
  };
  const viaWorktree = run(report);
  assert.equal(viaWorktree.status, 0, viaWorktree.stderr + viaWorktree.stdout);
  assert.match(viaWorktree.stderr, new RegExp(`${shaA.slice(0, 7)} rebuilt in `));
  assert.match(viaWorktree.stdout, /^replay: match [0-9a-f]{12}$/m);
  assert.match(viaWorktree.stdout, /sol_duc_trailhead\.trail_mouth, stop 2/);
  assert.ok(!git('worktree', 'list').includes(`oph-replay-${shaA.slice(0, 7)}`), `the worktree is removed: ${git('worktree', 'list')}`);
  assert.ok(!existsSync(join(tmpdir(), `oph-replay-${shaA.slice(0, 7)}`)));
  // The same trip named by its build's short SHA only, at HEAD (B changed no rules), with a clean tree: built here.
  const { commit, ...trimmed } = report;
  const here = run({ ...trimmed, build: `20261009-${shaB.slice(0, 7)}` });
  assert.equal(here.status, 0, here.stderr + here.stdout);
  assert.match(here.stderr, /is HEAD and the tree is clean; building here/);
  // A report whose rules the commit doesn't rebuild.
  const wrong = run({ ...report, rules: 'ffffffffffff' });
  assert.equal(wrong.status, 3, wrong.stderr);
  assert.match(wrong.stderr, /the commit rebuilds rules [0-9a-f]{12}, the report says ffffffffffff: the build isn't reproducible/);
  // A local build of uncommitted work stamps HEAD: when the working tree rebuilds the report's rules, it replays here, with a warning.
  const errorJs = join(repo, 'web', 'js', 'engine', 'error.js');
  const pristine = readFileSync(errorJs, 'utf8');
  writeFileSync(errorJs, `${pristine}// An uncommitted change: a byte in the engine moves the rules hash.\n`);
  execFileSync(process.execPath, ['tools/build.mjs', '--channel', 'preview'], { cwd: repo, env: { ...GIT_ENV, CHANNEL: 'preview' }, stdio: 'ignore' });
  const dirty = (() => {
    const { session: s2, content: c2 } = playedOn(distA, '00000001', [{ t: 'next' }]);
    return reportOf(distA, s2, c2);
  })();
  assert.equal(dirty.commit, shaB, 'the stamp names HEAD');
  assert.notEqual(dirty.rules, report.rules);
  const local = run(dirty);
  assert.equal(local.status, 0, local.stderr + local.stdout);
  assert.match(local.stderr, new RegExp(`${shaB.slice(0, 7)} is HEAD with uncommitted changes, and this tree rebuilds the report's rules ${dirty.rules}; replaying on the working tree`));
  assert.match(local.stdout, /^replay: match [0-9a-f]{12}$/m);
  const neither = run({ ...dirty, rules: 'ffffffffffff' });
  assert.equal(neither.status, 3, 'rules neither this tree nor HEAD rebuilds');
  writeFileSync(errorJs, pristine);
  // Nothing to replay.
  const none = run({ ...report, state: { ...report.state, trip: null } });
  assert.equal(none.status, 2);
  assert.match(none.stderr, /nothing to replay/);
  // Frozen (last: it leaves the tree dirty), then replayed on its own commit by --check-frozen.
  const frozen = run(report, '--freeze', 'first_report');
  assert.equal(frozen.status, 0, frozen.stderr);
  const kept = JSON.parse(readFileSync(join(repo, 'test', 'golden', 'replays', 'first_report.json'), 'utf8'));
  assert.equal(kept.commit, shaA);
  assert.ok(!JSON.stringify(kept).includes('Robin'));
  const check = spawnSync(process.execPath, ['tools/play.mjs', '--check-frozen'], { cwd: repo, env: GIT_ENV, encoding: 'utf8' });
  assert.equal(check.status, 0, check.stderr + check.stdout);
  assert.match(check.stdout, /^first_report\.json: replay: match [0-9a-f]{12}$/m);
  assert.match(check.stdout, /^play: 1 of 1 frozen replays match$/m);
});
