// Loads the picture sources under content/art/pics for the tools
// (build, lint, render, tests).
//
// The folder sets a picture's size: plates/ are tall plates (160x320),
// scenes/ are 160x168, and stamps/ are stamps, drawn around their anchor.
// Every id is the file's base name, and ids are unique across folders.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, basename, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePic } from '../web/js/gfx/picvm.js';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const PICS_DIR = join(ROOT, 'content', 'art', 'pics');
export const PALETTE_PATH = join(ROOT, 'content', 'art', 'palette.json');

/** Folder -> picture size; null for stamps. */
export const KINDS = Object.freeze({
  plates: { width: 160, height: 320 },
  scenes: { width: 160, height: 168 },
  stamps: null,
});

function walk(dir) {
  const out = [];
  let names = [];
  try {
    names = readdirSync(dir).sort();
  } catch {
    return out;
  }
  for (const n of names) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (n.endsWith('.pic')) out.push(p);
  }
  return out;
}

/**
 * Every .pic under a folder, parsed.
 * @param {string} [dir]
 */
export function loadPicSources(dir = PICS_DIR) {
  return walk(dir).map((path) => {
    const rel = relative(dir, path).split(sep).join('/');
    const folder = rel.split('/')[0];
    const kind = Object.prototype.hasOwnProperty.call(KINDS, folder) ? folder : null;
    const text = readFileSync(path, 'utf8');
    const parsed = parsePic(text);
    const size = kind ? KINDS[kind] : null;
    return {
      id: basename(path, '.pic'),
      kind, // 'plates' | 'scenes' | 'stamps' | null (unknown folder)
      path,
      rel,
      text,
      parsed,
      width: size ? size.width : 0,
      height: size ? size.height : 0,
    };
  });
}

/** The palette data. */
export function loadPalette(path = PALETTE_PATH) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Pictures and stamps, compiled, keyed by id.
 * @param {string} [dir]
 */
export function loadArt(dir = PICS_DIR) {
  const sources = loadPicSources(dir);
  const stamps = {};
  const pics = {};
  for (const s of sources) {
    if (s.kind === 'stamps') stamps[s.id] = s.parsed.ops;
    else if (s.kind) pics[s.id] = { id: s.id, kind: s.kind, width: s.width, height: s.height, ops: s.parsed.ops };
  }
  return { sources, stamps, pics };
}
