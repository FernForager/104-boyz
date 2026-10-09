#!/usr/bin/env node
// The preview channel's build for the deploy (BUILD_PLAN 6.1 to 6.3;
// GAME_DESIGN E.9). pages.yml runs this in its own job, from the workspace,
// beside a checkout of main; main's build and the site's assembly happen in
// other jobs, so nothing the preview branch's code does can reach what goes
// live at /:
//
//   node main/tools/preview.mjs --repo main --out preview-dist
//
//   1. Fetch the preview branch's head and the last-good-preview tag (the
//      repo is public, so no credentials; either may be missing).
//   2. Build the head in its own worktree with CHANNEL=preview npm run ci,
//      and copy its dist/preview/ to --out: status "built".
//   3. If the head fails, or there is no preview branch, and the tag names
//      another commit, build the tag (CHANNEL=preview node tools/build.mjs):
//      status "tag".
//   4. Otherwise "placeholder": --out is left absent, and the assembly puts
//      the placeholder at /preview/.
//
// It writes status=<built|tag|placeholder> and sha=<commit> to
// $GITHUB_OUTPUT (the tag job moves last-good-preview only on "built"), and
// one line to $GITHUB_STEP_SUMMARY; the preview build itself runs without
// those files in its environment, so it can't write them. It exits 0 in
// every case but its own crash, so a bad preview never stops main (6.2), and
// it never pushes.

import { execFileSync, execSync } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CI_TIMEOUT_MS = 10 * 60 * 1000;
export const TAG = 'last-good-preview';
const BRANCH = 'preview';

/**
 * Pure: which preview goes up. The head when it built; else the tag when it
 * names another commit and built; else the placeholder.
 * @param {{head: string | null, headOk: boolean, tag: string | null, tagOk: boolean}} o
 * @returns {'head' | 'tag' | 'placeholder'}
 */
export function choosePreview({ head, headOk, tag, tagOk }) {
  if (head && headOk) return 'head';
  if (tag && tag !== head && tagOk) return 'tag';
  return 'placeholder';
}

/** Is the tag worth building? Only when the head didn't build and the tag is another commit. */
export function shouldTryTag({ head, headOk, tag }) {
  return Boolean(tag) && !(head && headOk) && tag !== head;
}

const short = (sha) => (sha ? sha.slice(0, 7) : '');

/** The runner's files a step writes to change later steps, its outputs or its summary. */
const RUNNER_FILES = ['GITHUB_ENV', 'GITHUB_OUTPUT', 'GITHUB_PATH', 'GITHUB_STATE', 'GITHUB_STEP_SUMMARY'];

/**
 * Pure: the environment the preview branch's build runs in: ours, less the
 * runner's files, with CHANNEL=preview.
 * @param {Record<string, string | undefined>} env
 */
export function previewEnv(env) {
  const out = { ...env, CHANNEL: 'preview' };
  for (const k of RUNNER_FILES) delete out[k];
  return out;
}

/**
 * Build the preview channel from the repo's preview branch, or its last
 * good tag. Never throws for a failed build; returns what happened.
 * @param {{repo: string, out: string, ci?: string, build?: string, quiet?: boolean, env?: Record<string, string | undefined>}} o
 * @returns {{status: 'built' | 'tag' | 'placeholder', sha: string, summary: string}}
 */
export function buildPreview({ repo, out, ci = 'npm run ci', build = 'node tools/build.mjs', quiet = false, env = process.env }) {
  const log = quiet ? () => {} : (s) => console.log(s);
  const stdio = quiet ? 'pipe' : 'inherit';
  const git = (args, o = {}) => execFileSync('git', ['-C', repo, ...args], { stdio: ['ignore', 'pipe', quiet ? 'pipe' : 'inherit'], ...o }).toString().trim();
  const tryGit = (args) => {
    try {
      return git(args);
    } catch {
      return null;
    }
  };
  rmSync(out, { recursive: true, force: true });

  // 1. The head and the tag (either may be missing).
  let head = null;
  if (tryGit(['fetch', '--depth=1', '--no-tags', 'origin', `+refs/heads/${BRANCH}:refs/remotes/origin/${BRANCH}`]) !== null) head = tryGit(['rev-parse', `refs/remotes/origin/${BRANCH}^{commit}`]);
  let tag = null;
  if (tryGit(['fetch', '--depth=1', 'origin', `+refs/tags/${TAG}:refs/tags/${TAG}`]) !== null) tag = tryGit(['rev-parse', `refs/tags/${TAG}^{commit}`]);
  log(`preview: head ${head ? short(head) : 'none'}, ${TAG} ${tag ? short(tag) : 'none'}`);

  const work = dirname(resolve(repo));
  /** Build one commit in its own worktree; true when dist/preview/ came out right and was copied to out. */
  const attempt = (sha, name, cmd) => {
    const wt = join(work, name);
    try {
      rmSync(wt, { recursive: true, force: true });
      tryGit(['worktree', 'prune']);
      git(['worktree', 'add', '--detach', wt, sha]);
      execSync(cmd, { cwd: wt, env: previewEnv(env), stdio, timeout: CI_TIMEOUT_MS });
      const dist = join(wt, 'dist', 'preview');
      const version = JSON.parse(readFileSync(join(dist, 'version.json'), 'utf8'));
      if (version.channel !== 'preview') throw new Error(`version.json is channel "${version.channel}"`);
      cpSync(dist, out, { recursive: true });
      return true;
    } catch (e) {
      log(`preview: ${name} at ${short(sha)} failed: ${(e && e.message ? e.message : String(e)).split('\n')[0]}`);
      rmSync(out, { recursive: true, force: true });
      return false;
    } finally {
      tryGit(['worktree', 'remove', '--force', wt]);
    }
  };

  // 2. The head, through the whole CI.
  const headOk = head ? attempt(head, 'preview-head', ci) : false;
  // 3. The last good preview, if the head didn't make it.
  const tagOk = shouldTryTag({ head, headOk, tag }) ? attempt(/** @type {string} */ (tag), 'preview-tag', build) : false;
  const choice = choosePreview({ head, headOk, tag, tagOk });

  let status;
  let sha = '';
  let summary;
  if (choice === 'head') {
    status = 'built';
    sha = /** @type {string} */ (head);
    summary = `preview: built ${short(sha)}`;
  } else if (choice === 'tag') {
    status = 'tag';
    sha = /** @type {string} */ (tag);
    summary = `preview: ${head ? `head ${short(head)} failed` : 'no preview branch'}; deployed ${TAG} ${short(sha)}`;
  } else {
    status = 'placeholder';
    const why = head ? `head ${short(head)} failed` : 'no preview branch';
    summary = `preview: ${why}${tag ? `; ${TAG} ${short(tag)} ${tag === head ? 'is the same commit' : 'failed too'}` : `; no ${TAG}`}; /preview/ is the placeholder`;
  }
  return { status, sha, summary };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (name, dflt) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : dflt;
  };
  try {
    const repo = opt('--repo', 'main');
    const out = resolve(opt('--out', 'preview-dist'));
    if (!existsSync(join(repo, '.git'))) throw new Error(`preview: ${repo} is not a git checkout`);
    const r = buildPreview({ repo, out, ci: opt('--ci', 'npm run ci'), build: opt('--build', 'node tools/build.mjs') });
    console.log(r.summary);
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `status=${r.status}\nsha=${r.sha}\n`);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${r.summary}\n`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
