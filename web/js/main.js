// Boot (BUILD_PLAN 2.2). The title page until the cabin (S7). First the error
// sheet, so nothing after it can white-screen; then the words, the worker,
// the hidden debug menu; then the title page, imported on its own so a
// broken module still reaches the sheet. If one of the imports below fails
// to load, parse or link, none of this runs: boot.js, loaded before this
// module, opens the sheet instead. The autosave arrives in session 3.

import { installErrors, showError } from './ui/errors.js';
import { loadText } from './text.js';
import { startWorker } from './platform/sw-client.js';
import { persist, storageFacts } from './platform/storage.js';
import { initDebug, copyReport } from './ui/debug.js';

installErrors(document, { copy: copyReport });
const words = loadText();
startWorker(document);
initDebug(document, words);
import('./ui/home.js')
  .then(({ showTitle }) => showTitle(document))
  .catch(showError);
// Ask for lasting storage after the first paint, and never wait on it (E.6).
requestAnimationFrame(() => setTimeout(() => persist().then(() => storageFacts()), 0));
