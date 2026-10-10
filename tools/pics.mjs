// Loads the picture sources under content/art/pics, and the composer's
// recipes (content/art/recipes.json), for the tools (build, lint, render,
// tests).
//
// The first folder sets a picture's kind and size: plates/ are tall plates
// (160x320), scenes/ and bases/ are 160x168 (a hand-drawn scene; a biome
// base the composer builds on, BUILD_PLAN S5), and stamps/ are stamps,
// drawn around their anchor (any folders below stamps/ only sort them:
// trees/, rocks/, sprites/, skylines/ ...). Every id is the file's base
// name, and ids are unique across folders. A kind's screens are the screens
// that show it, so a channel ships a picture only when it has one of them
// (tools/build.mjs compileArt).

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, basename, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePic } from '../web/js/gfx/picvm.js';
import { validate } from './schema.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const PICS_DIR = join(ROOT, 'content', 'art', 'pics');
export const PALETTE_PATH = join(ROOT, 'content', 'art', 'palette.json');
export const RECIPES_PATH = join(ROOT, 'content', 'art', 'recipes.json');
export const RECIPES_SCHEMA_PATH = join(ROOT, 'schemas', 'recipes.schema.json');

/**
 * Folder -> picture size (null for stamps) and the screens that show it:
 * the cover is the title's (S7's cabin plate will say home); scenes and
 * bases are the trail's; stamps ship when a shipped picture or recipe
 * reaches them.
 */
export const KINDS = Object.freeze({
  plates: Object.freeze({ width: 160, height: 320, screens: Object.freeze(['title']) }),
  scenes: Object.freeze({ width: 160, height: 168, screens: Object.freeze(['trail']) }),
  bases: Object.freeze({ width: 160, height: 168, screens: Object.freeze(['trail']) }),
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
      kind, // 'plates' | 'scenes' | 'bases' | 'stamps' | null (unknown folder)
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
 * The composer's recipes (content/art/recipes.json), validated against
 * schemas/recipes.schema.json. Returns {recipes, src, errors}: recipes is
 * null when the file is missing or won't parse; errors are the schema's
 * ({path, msg}), which the lint reports as J01.
 * @param {string} [path]
 * @param {string} [schemaPath]
 */
export function loadRecipes(path = RECIPES_PATH, schemaPath = RECIPES_SCHEMA_PATH) {
  if (!existsSync(path)) return { recipes: null, src: '', errors: [] };
  const src = readFileSync(path, 'utf8');
  let recipes;
  try {
    recipes = JSON.parse(src);
  } catch (e) {
    return { recipes: null, src, errors: [{ path: '', msg: `not JSON: ${/** @type {Error} */ (e).message}` }] };
  }
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  return { recipes, src, errors: validate(schema, recipes).errors };
}

/**
 * Pictures and stamps, compiled, keyed by id, and the recipes.
 * @param {string} [dir]
 * @param {string} [recipesPath]
 */
export function loadArt(dir = PICS_DIR, recipesPath = join(dir, '..', 'recipes.json')) {
  const sources = loadPicSources(dir);
  const stamps = {};
  const pics = {};
  for (const s of sources) {
    if (s.kind === 'stamps') stamps[s.id] = s.parsed.ops;
    else if (s.kind) pics[s.id] = { id: s.id, kind: s.kind, width: s.width, height: s.height, ops: s.parsed.ops };
  }
  const schemaPath = join(dir, '..', '..', '..', 'schemas', 'recipes.schema.json');
  const { recipes } = loadRecipes(recipesPath, existsSync(schemaPath) ? schemaPath : RECIPES_SCHEMA_PATH);
  return { sources, stamps, pics, recipes };
}
