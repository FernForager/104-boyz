// Photos stay out of the repo (BUILD_PLAN S7 D11). The cabin's plate is
// drawn from GAME_DESIGN 11.11's written brief and the architecture the
// creator's private reference photos show; no photo, and no file derived
// from one, may ever be committed. Every file git would commit (tracked,
// or new and not ignored) is checked: no photo format by name, no image by
// its bytes (a renamed JPEG or HEIC is still caught), no PNG but the
// allowlisted style sheet, and no file that names the private uploads
// folder. The folder is known here only by a digest (SHA-256 of its
// 15-character tail, the folder above it and its own name), so nothing
// in the repo can be read back as where the photos are: each "uploads" in
// a file is checked with the 8 characters before it.

import { test } from 'node:test';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, openSync, readSync, closeSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { ROOT } from '../../tools/pics.mjs';

/** The one image the repo keeps: the art direction's style sheet (decision 70's panel B is on it). */
export const PNG_ALLOW = Object.freeze(['design/art/style_options.png']);
/** Photo and raw-image formats, by extension, never committed. */
export const PHOTO_EXT = Object.freeze(['.jpg', '.jpeg', '.jpe', '.heic', '.heif', '.tif', '.tiff', '.webp', '.gif', '.bmp', '.dng', '.cr2', '.nef', '.arw', '.raw']);
/** The private uploads folder's tail, as a digest only: SHA-256 (hex) of its 15 characters. */
export const UPLOADS_SHA256 = 'c06fe3ef31697a195e904dcc6ef30a9fe17acfadd338c6a2018aa1cc2306a8b4';
/** The tail's last word, and how many characters come before it in the tail. */
const UPLOADS_WORD = 'uploads';
const UPLOADS_LEAD = 8;

/**
 * Pure: does text name the private uploads folder? Each "uploads" with the
 * 8 characters before it is hashed against the digest.
 * @param {string} text
 * @param {string} [digest]
 */
export function namesUploads(text, digest = UPLOADS_SHA256) {
  for (let at = text.indexOf(UPLOADS_WORD, UPLOADS_LEAD); at !== -1; at = text.indexOf(UPLOADS_WORD, at + 1)) {
    const tail = text.slice(at - UPLOADS_LEAD, at + UPLOADS_WORD.length);
    if (createHash('sha256').update(tail, 'latin1').digest('hex') === digest) return true;
  }
  return false;
}

/** Every file a commit could carry: tracked, and untracked but not ignored. */
function committable() {
  const out = execFileSync('git', ['-C', ROOT, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], { maxBuffer: 64 * 1024 * 1024 }).toString();
  return out.split('\0').filter(Boolean).filter((f) => existsSync(join(ROOT, f)) && statSync(join(ROOT, f)).isFile());
}

/**
 * Pure: an image's kind from its first bytes, or null.
 * @param {Uint8Array} b
 */
export function imageKind(b) {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b.length >= 12 && String.fromCharCode(...b.slice(4, 8)) === 'ftyp') {
    const brand = String.fromCharCode(...b.slice(8, 12));
    if (/^(heic|heix|hevc|heim|heis|mif1|msf1|avif)$/.test(brand)) return 'heif';
  }
  if (b.length >= 4 && ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0) || (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0 && b[3] === 0x2a))) return 'tiff';
  if (b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') return 'webp';
  if (b.length >= 4 && String.fromCharCode(...b.slice(0, 4)) === 'GIF8') return 'gif';
  return null;
}

/** @param {string} f */
function head(f) {
  const fd = openSync(join(ROOT, f), 'r');
  try {
    const b = new Uint8Array(16);
    const n = readSync(fd, b, 0, 16, 0);
    return b.slice(0, n);
  } finally {
    closeSync(fd);
  }
}

test('imageKind knows a photo by its bytes, whatever its name', () => {
  assert.equal(imageKind(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0, 0])), 'jpeg');
  assert.equal(imageKind(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'png');
  const heic = new Uint8Array([0, 0, 0, 0x18, ...Array.from('ftypheic', (c) => c.charCodeAt(0))]);
  assert.equal(imageKind(heic), 'heif');
  assert.equal(imageKind(new Uint8Array([0x49, 0x49, 0x2a, 0])), 'tiff');
  assert.equal(imageKind(new TextEncoder().encode('{"a": 1}')), null);
  assert.equal(imageKind(new TextEncoder().encode('@ far\nC 3\n')), null, 'a picture program is words');
});

test('namesUploads finds the folder by its digest alone, and nothing else', () => {
  // A stand-in folder and its digest: the real one is named nowhere, here either.
  const fake = 'xample/uploads';
  const digest = createHash('sha256').update(`e${fake}`, 'latin1').digest('hex');
  assert.equal(namesUploads(`see /home/u/e${fake}/abc.txt`, digest), true);
  assert.equal(namesUploads(`e${fake}`, digest), true, 'at the very start');
  assert.equal(namesUploads('the uploads folder, uploads/ and /tmp/uploads', digest), false);
  assert.equal(namesUploads(`see /home/u/E${fake}/abc.txt`, digest), false, 'case counts');
  assert.equal(namesUploads('uploads', digest), false, 'too short to hold the tail');
  assert.match(UPLOADS_SHA256, /^[0-9a-f]{64}$/);
});

test('.gitignore keeps the photo formats out', () => {
  const ignore = readFileSync(join(ROOT, '.gitignore'), 'utf8').split('\n').map((l) => l.trim());
  for (const p of ['*.jpg', '*.jpeg', '*.heic', '*.heif']) assert.ok(ignore.includes(p), p);
  const ignored = (f) => {
    try {
      execFileSync('git', ['-C', ROOT, 'check-ignore', '-q', f]);
      return true;
    } catch {
      return false;
    }
  };
  for (const f of ['IMG_0001.jpg', 'design/art/cabin.jpeg', 'x.HEIC', 'y.heif']) assert.ok(ignored(f), `${f} is ignored`);
});

test('no photo in the repo: no photo format, no image by its bytes, no PNG but the style sheet, and no file naming the private uploads folder', () => {
  const files = committable();
  assert.ok(files.length > 100 && files.includes('package.json'), 'the files git would commit');
  const bad = [];
  for (const f of files) {
    const ext = extname(f).toLowerCase();
    if (PHOTO_EXT.includes(ext)) bad.push(`${f}: a photo format`);
    const kind = imageKind(head(f));
    if (kind && kind !== 'png') bad.push(`${f}: a ${kind} image`);
    if ((kind === 'png' || ext === '.png') && !PNG_ALLOW.includes(f)) bad.push(`${f}: a PNG outside the allowlist`);
    if (!kind && statSync(join(ROOT, f)).size < 32 * 1024 * 1024 && namesUploads(readFileSync(join(ROOT, f), 'latin1'))) bad.push(`${f}: names the private uploads folder`);
  }
  assert.deepEqual(bad, []);
  for (const f of PNG_ALLOW) assert.ok(files.includes(f), `${f} is still the one image`);
});
