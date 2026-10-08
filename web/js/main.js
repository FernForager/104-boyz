// Boot (BUILD_PLAN 2.2). Session 1: the title page. The service worker,
// the edition and the autosave arrive in sessions 2 and 3.

import { showTitle } from './ui/shelf.js';

showTitle(document).catch((err) => {
  // Never a white screen: the page stays, and the error is kept for the
  // bug report that arrives in session 2.
  document.documentElement.dataset.error = String((err && err.message) || err);
  console.error(err);
});
