// Reduce Motion (BUILD_PLAN S6 track C; GAME_DESIGN 11.9, 12.1): one
// module (ui/motion.js) asks the phone and hears it change; the draw-in,
// palette cycling (which now stops live when the setting turns on mid-stop,
// and starts again when it turns off), the compass's spin, the Why sheet's
// slide and the Look box's pop all honor it; every CSS transition or
// animation sits inside @media (prefers-reduced-motion: no-preference);
// and the screenshots run with it on, so the compass is shot at rest.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';
import { reducedMotion, onMotionChange, liveCycles, REDUCE_QUERY } from '../../web/js/ui/motion.js';

const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');

/** A window whose Reduce Motion setting the test flips. */
function fakeWin(on = false, { legacy = false } = {}) {
  const listeners = new Set();
  const mq = {
    media: REDUCE_QUERY,
    get matches() {
      return on;
    },
  };
  if (legacy) {
    mq.addListener = (f) => listeners.add(f);
    mq.removeListener = (f) => listeners.delete(f);
  } else {
    mq.addEventListener = (type, f) => type === 'change' && listeners.add(f);
    mq.removeEventListener = (type, f) => listeners.delete(f);
  }
  const asked = [];
  return {
    matchMedia: (q) => {
      asked.push(q);
      return mq;
    },
    asked,
    listeners,
    flip(v) {
      on = v;
      for (const f of [...listeners]) f({ matches: v });
    },
  };
}

test('reducedMotion asks the one query; with no matchMedia (Node) motion is welcome', () => {
  const win = fakeWin(true);
  assert.equal(reducedMotion(win), true);
  assert.deepEqual(win.asked, ['(prefers-reduced-motion: reduce)']);
  assert.equal(reducedMotion(fakeWin(false)), false);
  assert.equal(reducedMotion(null), false);
  assert.equal(reducedMotion({}), false);
});

test('onMotionChange hears each flip until it stops listening; Safari before 14 through addListener', () => {
  for (const legacy of [false, true]) {
    const win = fakeWin(false, { legacy });
    const heard = [];
    const off = onMotionChange((r) => heard.push(r), win);
    win.flip(true);
    win.flip(false);
    off();
    win.flip(true);
    assert.deepEqual(heard, [true, false], legacy ? 'addListener' : 'addEventListener');
    assert.equal(win.listeners.size, 0);
  }
  assert.doesNotThrow(() => onMotionChange(() => {}, null)());
});

test('palette cycling stops live when Reduce Motion turns on mid-stop, and starts again when it turns off; never starts under it', () => {
  const win = fakeWin(false);
  const log = [];
  const start = () => {
    log.push('start');
    return () => log.push('stop');
  };
  const stop = liveCycles(start, win);
  assert.deepEqual(log, ['start']);
  win.flip(true);
  assert.deepEqual(log, ['start', 'stop'], 'the water and the stars hold still at once');
  win.flip(true);
  win.flip(false);
  assert.deepEqual(log, ['start', 'stop', 'start']);
  stop();
  assert.deepEqual(log, ['start', 'stop', 'start', 'stop']);
  win.flip(true);
  win.flip(false);
  assert.equal(log.length, 4, 'and the listening stops with it');
  const under = fakeWin(true);
  const log2 = [];
  liveCycles(() => {
    log2.push('start');
    return () => log2.push('stop');
  }, under)();
  assert.deepEqual(log2, [], 'under Reduce Motion they never start');
});

test('one module: frame.js and home.js ask ui/motion.js, never matchMedia themselves; the draw-in finishes and the cycles follow the setting live', () => {
  for (const f of ['frame.js', 'home.js']) {
    const src = read('web', 'js', 'ui', f);
    assert.match(src, /import \{ reducedMotion[^}]*\} from '\.\/motion\.js';/, f);
    assert.ok(!/prefers-reduced-motion/.test(src), `${f} has no query of its own`);
    assert.match(src, /liveCycles\(\(\) => startCycles\(/, `${f}: its cycles follow the setting`);
  }
  // The frame: Reduce Motion turning on mid-draw finishes the draw-in; the compass is told the setting.
  const frame = read('web', 'js', 'ui', 'frame.js');
  assert.match(frame, /stops\.push\(onMotionChange\(\(on\) => on && run && run\.finish\(\)\)\);/);
  assert.match(frame, /reduced: o\.reduced === undefined \? reducedMotion\(\) : o\.reduced,/);
  // Nothing else in web/ asks the query but motion.js (and the debug menu's facts, which only report it).
  const asks = ['ui/app.js', 'ui/choices.js', 'ui/sheet.js', 'ui/look.js', 'ui/textbox.js', 'ui/compass.js', 'gfx/display.js', 'gfx/drawin.js'].filter((f) => /prefers-reduced-motion/.test(read('web', 'js', ...f.split('/'))));
  assert.deepEqual(asks, []);
});

/** Every rule's declarations in a stylesheet, with the @media blocks it sits in. */
function declarations(css) {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  const stack = [];
  let buf = '';
  for (const ch of bare) {
    if (ch === '{') {
      stack.push(buf.trim());
      buf = '';
    } else if (ch === '}') {
      for (const d of buf.split(';')) if (d.includes(':')) out.push({ prop: d.slice(0, d.indexOf(':')).trim(), media: stack.filter((s) => s.startsWith('@media')), keyframes: stack.some((s) => s.startsWith('@keyframes')) });
      stack.pop();
      buf = '';
    } else buf += ch;
  }
  return out;
}

test('every CSS transition and animation sits inside @media (prefers-reduced-motion: no-preference), in frame.css and game.css', () => {
  let found = 0;
  for (const f of ['frame.css', 'game.css']) {
    for (const d of declarations(read('web', 'css', f))) {
      if (!/^(transition|animation)(-|$)/.test(d.prop) || d.keyframes) continue;
      found++;
      assert.ok(d.media.some((m) => /prefers-reduced-motion:\s*no-preference/.test(m)), `${f}: ${d.prop} outside a no-preference block`);
    }
  }
  assert.ok(found >= 4, `the title's step-in and safety, the Why sheet's slide, the Look box's pop: ${found}`);
  // A planted one fails.
  assert.ok(declarations('.x { transition: opacity 1s; }').some((d) => d.prop === 'transition' && !d.media.length));
});

test('the screenshots run with Reduce Motion on (tools/shots.mjs), so the draw-in is instant and the compass is shot at rest', async () => {
  const src = read('tools', 'shots.mjs');
  // Rewritten in S7 (track C): one scenario may turn it off (the s7 set's first_drawin, a picture part way
  // through the cabin's draw-in); every other scenario of every set and batch keeps it on.
  assert.match(src, /reducedMotion: sc\.motion \? 'no-preference' : 'reduce',/);
  const { SETS, SCREEN_SCENARIOS } = await import('../../tools/shots.mjs');
  const moving = [...Object.entries(SETS), ...Object.entries(SCREEN_SCENARIOS)].flatMap(([k, list]) => list.filter((sc) => sc.motion).map((sc) => `${k}:${sc.name}`));
  assert.deepEqual(moving, ['s7:first_drawin']);
});
