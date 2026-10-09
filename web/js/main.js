// Boot (BUILD_PLAN 2.2). The title page until the cabin (S7). First the error
// sheet, so nothing after it can white-screen; then the words, the worker,
// the hidden debug menu; then the title page, imported on its own so a
// broken module still reaches the sheet. If one of the imports below fails
// to load, parse or link, none of this runs: boot.js, loaded before this
// module, opens the sheet instead.
//
// On a build whose <html data-screens> lists the guest book and the trail
// (preview, from S3), the title page is the loading art: the game
// (ui/app.js) loads its data and the saves while the cover draws in, then
// takes the page, back on the autosaved screen. Main's page never imports it.
// About a second after the first paint, the replay self-check runs on both
// channels (ui/selfcheck.js); its result rides in every bug report.

import { installErrors, showError } from './ui/errors.js';
import { loadText } from './text.js';
import { startWorker } from './platform/sw-client.js';
import { persist, storageFacts } from './platform/storage.js';
import { initDebug, copyReport } from './ui/debug.js';
import { runCheck } from './ui/selfcheck.js';

/** How long after the first paint the self-check starts (ms): after the cover's draw-in. */
const CHECK_AFTER_MS = 1000;

installErrors(document, { copy: copyReport });
const words = loadText();
startWorker(document);
initDebug(document, words);
import('./ui/home.js')
  .then(({ showTitle, opensGame }) => {
    const title = showTitle(document);
    if (opensGame(document)) {
      import('./ui/app.js')
        .then(({ startGame }) => startGame(document, { title, words }))
        .catch(showError);
    }
    return title;
  })
  .catch(showError);
// Ask for lasting storage after the first paint, and never wait on it (E.6).
requestAnimationFrame(() => setTimeout(() => persist().then(() => storageFacts()), 0));
requestAnimationFrame(() => setTimeout(() => runCheck(), CHECK_AFTER_MS));
