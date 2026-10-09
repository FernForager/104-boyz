// The type check (BUILD_PLAN 2.1, 6.5; GAME_DESIGN E.3): three projects,
// strict JSDoc-checked JS, TypeScript pinned by the lockfile; the engine's
// project has the ES library only, so the DOM is a type error there; and the
// install runs only when node_modules lacks the lockfile's version.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PROJECTS, INSTALL, needsInstall, errorLines, lockedVersion, installedVersion } from '../../tools/typecheck.mjs';
import { ROOT } from '../../tools/pics.mjs';

const read = (f) => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));

test('three projects, all strict, no emit, no ambient types; the engine with the ES library alone (BUILD_PLAN 2.1)', () => {
  assert.deepEqual([...PROJECTS], ['jsconfig.json', 'jsconfig.engine.json', 'jsconfig.worker.json']);
  const libs = {};
  for (const p of PROJECTS) {
    const { compilerOptions: o, include } = read(p);
    for (const [k, v] of Object.entries({ allowJs: true, checkJs: true, strict: true, noEmit: true, target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', skipLibCheck: true })) assert.equal(o[k], v, `${p}: ${k}`);
    assert.deepEqual(o.types, [], `${p}: no @types`);
    libs[p] = { lib: o.lib, include };
  }
  assert.deepEqual(libs, {
    'jsconfig.json': { lib: ['ES2022', 'DOM', 'DOM.Iterable'], include: ['web/js/**/*.js'] },
    'jsconfig.engine.json': { lib: ['ES2022'], include: ['web/js/engine/**/*.js'] },
    'jsconfig.worker.json': { lib: ['ES2022', 'WebWorker'], include: ['web/sw.js'] },
  });
});

test('TypeScript is installed only when node_modules lacks the lockfile\'s version', () => {
  assert.equal(needsInstall({ locked: '6.0.3', installed: '6.0.3' }), false);
  assert.equal(needsInstall({ locked: '6.0.3', installed: null }), true);
  assert.equal(needsInstall({ locked: '6.0.3', installed: '5.9.2' }), true);
  assert.equal(lockedVersion(), read('package.json').devDependencies.typescript);
  assert.deepEqual([...INSTALL], ['ci', '--ignore-scripts', '--no-audit', '--no-fund']);
  assert.deepEqual(errorLines('web/a.js(1,2): error TS2304: Cannot find name \'x\'.\nFound 1 error.\n'), ["web/a.js(1,2): error TS2304: Cannot find name 'x'."]);
});

test('the engine project makes the DOM and Node a type error; the page project allows the DOM', { skip: installedVersion() === null && 'typescript is not installed (npm ci)' }, (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'oph-tsc-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  for (const f of ['jsconfig.json', 'jsconfig.engine.json']) cpSync(join(ROOT, f), join(tmp, f));
  writeFileSync(join(tmp, 'package.json'), '{"type": "module"}\n');
  symlinkSync(join(ROOT, 'node_modules'), join(tmp, 'node_modules'), 'dir');
  cpSync(join(ROOT, 'web', 'js', 'engine'), join(tmp, 'web', 'js', 'engine'), { recursive: true });
  writeFileSync(join(tmp, 'web', 'js', 'engine', 'planted.js'), '/** @returns {number} */\nexport const width = () => document.body.clientWidth + process.pid;\n');
  const tsc = (p) => {
    try {
      execFileSync(process.execPath, [join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', p, '--pretty', 'false'], { cwd: tmp, stdio: ['ignore', 'pipe', 'pipe'] });
      return [];
    } catch (e) {
      return errorLines(`${e.stdout}`);
    }
  };
  const engine = tsc('jsconfig.engine.json');
  assert.equal(engine.length, 2, engine.join('\n'));
  assert.ok(engine.every((l) => l.startsWith('web/js/engine/planted.js(2,')));
  assert.ok(engine.some((l) => /'document'/.test(l)) && engine.some((l) => /'process'/.test(l)));
  const page = tsc('jsconfig.json');
  assert.deepEqual(page.map((l) => /'(\w+)'/.exec(l)[1]), ['process'], 'the page has the DOM, but never Node');
  assert.ok(existsSync(join(ROOT, 'package-lock.json')));
});
