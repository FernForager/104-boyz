// The guest book, plain (BUILD_PLAN S3; GAME_DESIGN 12.4, 3.6). S7 puts it
// on the porch table, after the lockbox.
//
// PURE. Signing creates the hiker: an id the UI drew, a name the UI
// normalized (NFC, spaces collapsed, trimmed, cut at the limit), and the
// Open hiker's starting profile. The engine only checks the name, by code
// points, with no Unicode tables (E.12 #8). The name lives in the hiker
// record only: never in a trip, a log, a hash or a seed.

import { plain } from '../canon.js';

/** A hiker id: h and 8 characters of Crockford base32. */
export const HIKER_ID_RE = /^h[0-9A-HJKMNP-TV-Z]{8}$/;

/**
 * A name's length in code points, or -1 when it holds a C0 or C1 control
 * or a lone surrogate.
 * @param {string} name
 */
export function nameLength(name) {
  let n = 0;
  for (let i = 0; i < name.length; i++) {
    const c = name.charCodeAt(i);
    if (c < 0x20 || (c >= 0x7f && c <= 0x9f)) return -1;
    if (c >= 0xd800 && c <= 0xdbff) {
      const d = name.charCodeAt(i + 1);
      if (!(d >= 0xdc00 && d <= 0xdfff)) return -1;
      i++;
    } else if (c >= 0xdc00 && c <= 0xdfff) return -1;
    n++;
  }
  return n;
}

/** @type {import('../phase.js').Phase} */
export default Object.freeze({
  id: 'guestbook',
  built: true,
  lands: 'S3',
  level: 'hiker',
  accepts: Object.freeze(['sign']),
  enter: (state) => state,
  step(state, action, content) {
    const hiker = { v: 1, id: action.id, name: action.name, profile: plain(content.profile.open_start), trips: 0, latest: null };
    return { ...state, hiker };
  },
  screen: (state, content) => ({
    phase: 'guestbook',
    box: [],
    choices: [{ act: { t: 'sign' }, label: null, enabled: true }],
    input: { kind: 'name', max: content.profile.name_max },
  }),
});
