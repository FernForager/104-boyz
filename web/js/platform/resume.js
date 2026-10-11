// Coming back where you were (BUILD_PLAN S7b; GAME_DESIGN 12.3, E.7, E.11;
// Lead call 65). Once the game has taken the page on the phone's own saves
// (ui/app.js, right after the take-over), this tab's session is marked, and
// every reload in it skips the title screen (ui/title.js): the game takes
// the page on its own as soon as the cover has drawn in, back on the
// autosave. That covers a Restart pressed inside the game (the update
// note's, in the mailbox, and the error sheet's, which mark it too) and iOS
// reloading the app after it shut the page down in the background. A
// session that never went in (a Restart pressed on the title screen
// itself) shows the title screen again.
//
// One session key, through platform/storage.js (oph.<channel>.resume in
// sessionStorage), kept for the session: iOS keeps it across a reload and
// drops it when the app is closed, so a real relaunch always shows the
// title (owed: a check on the phone, BUILD_LOG S7b). On main #app is always
// the title page, so nothing is ever written there.

import { load, save } from './storage.js';

/** The session key the game leaves once it has the page. */
export const RESUME_KEY = 'resume';

/**
 * Mark this session as one the game has had the page in (#app's
 * data-screen is anything but the title's), so a reload comes back where
 * you were. Returns whether it wrote.
 * @param {Document} doc
 */
export function markResume(doc) {
  const app = doc && doc.getElementById('app');
  const screen = app ? app.getAttribute('data-screen') : null;
  if (!screen || screen === 'title') return false;
  return save(RESUME_KEY, 1, { session: true });
}

/**
 * Is this load a resume? Reads the mark and keeps it, so every reload in
 * the session skips the title, until the app is closed.
 * @returns {boolean}
 */
export function resuming() {
  return load(RESUME_KEY, { session: true }) !== null;
}
