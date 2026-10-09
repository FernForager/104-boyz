// The clipboard and the share sheet (BUILD_PLAN 2.5, 2.8). Call these
// synchronously inside the tap: iOS refuses a clipboard write, or a share
// sheet, that starts after an await. Export, Import, files and the
// press-and-hold image arrive later (S12b, S24).

/**
 * Copy text: nav.clipboard.writeText, called at once. A rejected promise
 * when there is no clipboard, or iOS says no.
 * @param {string} text
 * @param {any} [nav]
 * @returns {Promise<void>}
 */
export function copyText(text, nav = globalThis.navigator) {
  try {
    const c = nav && nav.clipboard;
    if (!c || typeof c.writeText !== 'function') return Promise.reject(new Error('share: no clipboard'));
    return Promise.resolve(c.writeText(String(text)));
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * Open the share sheet with text: nav.share({ text }), called at once.
 * Rejects when there is no share sheet; an AbortError when it is closed.
 * @param {string} text
 * @param {any} [nav]
 * @returns {Promise<void>}
 */
export function shareText(text, nav = globalThis.navigator) {
  try {
    if (!nav || typeof nav.share !== 'function') return Promise.reject(new Error('share: no share sheet'));
    return Promise.resolve(nav.share({ text: String(text) }));
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * Select everything in a readonly textarea, so a long press offers iOS's own
 * Copy. Readonly keeps the keyboard down.
 * @param {HTMLTextAreaElement} area
 */
export function selectAll(area) {
  try {
    area.focus({ preventScroll: true });
    area.setSelectionRange(0, area.value.length);
    area.scrollTop = 0;
  } catch {
    // nothing to select
  }
}
