// The sound, as the UI calls it (BUILD_PLAN S5 sound A1; GAME_DESIGN 13.2,
// 13.11). Preview only: ui/app.js imports it when the game starts, and
// main's page never loads the game. Until it has loaded, the frame uses
// frame.js's quiet stand-in (the same calls, the same `sound` key).
//
//   sound.play(cue)      'ui.tick' | 'ui.next' | 'ui.open' | 'ui.sound_on';
//                        a no-op while Sound is off or before the first tap
//   sound.isOn()
//   sound.setOn(on)      inside the tap that asks (turning it on unlocks)
//   sound.report()       the bug report's audio field
//
// It fetches the cue bank (audio/sounds.json, which the build checked
// against its goldens), hands the engine the unlock ui/app.js installed,
// gives the bug report its audio field (debug.js provideAudio), and on a
// build with the trail adds Render 10 s of this scene to the debug menu.

import { createEngine, registerAudioDev } from '../audio/engine.js';
import { provideAudio, opensTrail } from './debug.js';

/** The cue bank, next to the page (U01: relative to this module). */
const BANK = new URL('../../audio/sounds.json', import.meta.url);

/**
 * The sound for a page. timers: the page's unless a test gives its own.
 * @param {{doc: Document, unlock: import('../audio/unlock.js').Unlock | null, fetchFn?: (url: URL) => Promise<Response>, timers?: import('../audio/engine.js').Timers}} o
 */
export function createSound({ doc, unlock, fetchFn = (u) => fetch(u), timers }) {
  const engine = createEngine({ doc, unlock, ...(timers ? { timers } : {}) });
  const loaded = fetchFn(BANK)
    .then((res) => (res && res.ok ? res.json() : null))
    .then((bank) => {
      if (bank && bank.cues) engine.setBank(bank);
      return Boolean(bank && bank.cues);
    })
    .catch(() => false);
  provideAudio(() => engine.report());
  if (opensTrail(doc)) registerAudioDev(engine);
  return {
    play: (/** @type {string} */ cue) => {
      engine.play(cue);
    },
    isOn: engine.isOn,
    setOn: engine.setOn,
    report: engine.report,
    /** Resolves true once the cue bank is in (tests). */
    loaded,
    engine,
  };
}
