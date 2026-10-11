// Fixtures for the engine tests (not a test file itself): a tiny stop set
// with choices, a roll and effects (the shape of BUILD_PLAN S3's engine
// fixture, D11), compiled in memory with tools/content.mjs against the
// repo's schemas and profile rules, and loaded with a fixed rules hash;
// plus helpers to play it and to deep-freeze what goes in.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compileSources, readSchemas } from '../../tools/content.mjs';
import { ROOT } from '../../tools/pics.mjs';
import { loadContent } from '../../web/js/engine/content.js';
import { newSession, dispatch } from '../../web/js/engine/step.js';
import { lockboxActs } from '../../web/js/engine/selfcheck.js';
import { deepFreeze } from '../../web/js/engine/canon.js';
import { installBans } from './bans.mjs';

/** The fixture's rules hash (a literal, so these tests never churn with an engine edit). */
export const FX_HASH = '000000000001';

/** The fixture's stop set: a, then b with go (a roll) and rest (once, then back to b), then c or d. */
export const FX_SET = {
  id: 'fx',
  screen: 'fx',
  phase: 'trailhead',
  first: 'a',
  stops: [
    { id: 'a', box: '@fx.a', next: 'b' },
    {
      id: 'b',
      box: ['@fx.b1', '@fx.b2'],
      choices: [
        { id: 'go', label: '@fx.go', roll: { p: "0.5 + (flag('rested') ? 0.25 : 0)", pass: 'c', fail: 'd' } },
        { id: 'rest', label: '@fx.rest', show_if: "!flag('rested')", effects: [{ flag: 'rested' }, { add_s: 600 }], then: 'b' },
      ],
    },
    { id: 'c', box: '@fx.c', next: null },
    { id: 'd', box: '@fx.d', next: null },
  ],
};

/** The fixture's plan. */
export const FX_PLAN = { id: 'fx_plan', screen: 'fx', mode: 'open', start: { set: 'fx', day: 1, s: 28800 }, after: 'end' };

/** A content source in memory. */
export const source = (folder, name, data) => ({ file: `content/${folder}/${name}.json`, folder, name, src: `${JSON.stringify(data, null, 1)}\n` });

/** The repo's profile and standard rules, as sources. */
export function rulesSources() {
  return ['profile', 'standard'].map((name) => ({ file: `content/rules/${name}.json`, folder: 'rules', name, src: readFileSync(join(ROOT, 'content', 'rules', `${name}.json`), 'utf8') }));
}

/**
 * Compile sets and plans (plus the repo's rules) for the fx screen.
 * @param {{sets?: any[], plans?: any[], screens?: string[]}} [o]
 */
export function compileFx({ sets = [FX_SET], plans = [FX_PLAN], screens = ['fx'] } = {}) {
  const sources = [...rulesSources(), ...plans.map((p) => source('trips', p.id, p)), ...sets.map((s) => source('stops', s.id, s))];
  return compileSources({ sources, schemas: readSchemas(ROOT), screens, defined: null });
}

/** The fixture's content, loaded. Throws on any compile problem. */
export function fxContent(o) {
  const { rules, voice, problems } = compileFx(o);
  if (problems.length) throw new Error(problems.map((p) => `${p.file}:${p.line}: ${p.code} ${p.msg}`).join('\n'));
  return loadContent({ rules, voice, rulesHash: FX_HASH });
}

/**
 * Play actions from a session, deep-freezing the session before each step
 * (step must never mutate its input). Returns the last {session, screen}
 * and every screen.
 */
export function play(session, actions, content) {
  let s = session;
  let screen = null;
  const screens = [];
  for (const a of actions) {
    deepFreeze(s);
    ({ session: s, screen } = dispatch(s, a, content));
    screens.push(screen);
  }
  return { session: s, screen, screens };
}

/**
 * A fresh device past the lockbox (S7): with a quiz, the deal from a seed
 * and answer 0 to each question; then Take the key. The guest book is next.
 * @param {any} content
 * @param {string} [seed]
 */
export function opened(content, seed = 'K7QM2Q9F') {
  let s = newSession(content);
  for (const a of lockboxActs(seed, content)) s = dispatch(s, a, content).session;
  return s;
}

/** A signed hiker at home, from a fresh device past the lockbox. */
export function signed(content, name = 'Robin', id = 'h00000001') {
  return dispatch(opened(content), { t: 'sign', name, id }, content).session;
}

/** A trip started on the fixture's plan with a seed. */
export function started(content, seed = 'K7QM2Q9F') {
  return dispatch(signed(content), { t: 'start', plan: 'fx_plan', seed }, content).session;
}

/**
 * Replace Math.random, Date, performance.now and every approximate Math
 * function (E02's list) with functions that throw, run f, and put them back
 * (D11's ban test: the engine never needs them). A module that kept a Math
 * function when it loaded is out of reach here; banfirst.mjs covers that.
 * @template T
 * @param {() => T} f
 * @returns {T}
 */
export function withBans(f) {
  const restore = installBans();
  try {
    return f();
  } finally {
    restore();
  }
}
