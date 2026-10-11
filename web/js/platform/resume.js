// Coming back where you were (BUILD_PLAN S7b; GAME_DESIGN 12.3, E.7, E.11;
// Lead call 65). A Restart pressed inside the game (the update note's, in
// the mailbox, and the error sheet's) reloads the page into the autosave;
// it marks the reload as a resume first, so the reload skips the title
// screen (ui/title.js) and the game takes the page on its own as soon as
// the cover has drawn in. Every other page load shows the title screen,
// a Restart pressed on the title screen itself included.
//
// One session key, through platform/storage.js (oph.<channel>.resume in
// sessionStorage): iOS keeps it across a reload and drops it when the app
// is closed, so a real relaunch always shows the title. On main #app is
// always the title page, so nothing is ever written there.

import { load, save, remove } from './storage.js';

/** The session key a Restart inside the game leaves for the reload. */
export const RESUME_KEY = 'resume';

/**
 * Mark the coming reload as a resume, when the game has the page (#app's
 * data-screen is anything but the title's). Returns whether it wrote.
 * @param {Document} doc
 */
export function markResume(doc) {
  const app = doc && doc.getElementById('app');
  const screen = app ? app.getAttribute('data-screen') : null;
  if (!screen || screen === 'title') return false;
  return save(RESUME_KEY, 1, { session: true });
}

/**
 * Was this load a resume? Reads the mark once and removes it at once, so
 * only the reload right after the Restart skips the title.
 * @returns {boolean}
 */
export function takeResume() {
  const v = load(RESUME_KEY, { session: true });
  if (v === null) return false;
  remove(RESUME_KEY, { session: true });
  return true;
}
