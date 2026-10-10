// The sound's unlock (BUILD_PLAN 2.8, 13.3, S5 sound A1; GAME_DESIGN 13.10).
// iOS lets a page make sound only from inside a tap, so this module is
// tiny, imports nothing, and is imported statically by ui/app.js: its
// listeners exist as soon as the game module runs, before the audio engine
// (audio/engine.js, through ui/sound.js) has loaded.
//
// On the first touchend or click anywhere (capture phase, passive; never
// touchstart, which can be the start of a scroll, WebKit bug 149367), and
// only while the Sound state is on, it does three things synchronously,
// inside the handler, in this order:
//   1. navigator.audioSession.type = 'ambient' where the session exists
//      (iOS 16.4 on), never 'playback': the ambient category is silenced
//      by Silent Mode and the lock and mixes with the player's own music.
//      The outcome is kept: ambient, unsupported or error.
//   2. a new AudioContext({latencyHint: 'interactive'}), or resume() on
//      the one there is;
//   3. one silent frame: a 1-sample buffer started at once.
// Then the listeners stay: every later tap is passed to the engine's
// hooks (its watchdog kicks a stalled context on the next tap, and
// rebuilds it there as a last resort, through rebuild()). The engine
// adopts the context through onUnlock, now or whenever the unlock happens.

/** The events that unlock, in the order a tap fires them. */
export const UNLOCK_EVENTS = Object.freeze(['touchend', 'click']);

/**
 * @typedef {'none' | 'ambient' | 'unsupported' | 'error'} SessionOutcome
 * @typedef {{ctx: AudioContext | null, session: SessionOutcome, unlocked: boolean, taps: number, error: string | null}} UnlockState
 * @typedef {ReturnType<typeof createUnlock>} Unlock
 */

/**
 * Put the page's audio session in the ambient category, where Safari has
 * one. Never throws.
 * @param {any} nav navigator
 * @returns {SessionOutcome}
 */
export function setAmbient(nav) {
  const s = nav && nav.audioSession;
  if (!s) return 'unsupported';
  try {
    s.type = 'ambient';
    return s.type === 'ambient' ? 'ambient' : 'error';
  } catch {
    return 'error';
  }
}

/**
 * Play one silent frame through a context (the unlock's third step).
 * @param {AudioContext} ctx
 */
export function silentFrame(ctx) {
  const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start(0);
}

/**
 * Install the unlock on a document. isOn says whether the Sound state is
 * on (the engine replaces it with its own through setIsOn).
 * @param {{doc: Document, isOn?: () => boolean}} o
 */
export function createUnlock({ doc, isOn = () => true }) {
  const win = /** @type {any} */ (doc.defaultView);
  /** @type {UnlockState} */
  const st = { ctx: null, session: 'none', unlocked: false, taps: 0, error: null };
  /** @type {((e: Event) => void)[]} */
  const tapHooks = [];
  /** @type {((ctx: AudioContext) => void)[]} */
  const unlockHooks = [];
  let on = isOn;

  /**
   * The unlock's three steps, synchronously: call it only inside a tap.
   * Returns the context, or null when this browser has none.
   * @returns {AudioContext | null}
   */
  function unlockNow() {
    st.session = setAmbient(win && win.navigator);
    const AC = win && (win.AudioContext || win.webkitAudioContext);
    if (!AC) {
      st.error = 'unsupported';
      return null;
    }
    try {
      if (!st.ctx || st.ctx.state === 'closed') st.ctx = /** @type {AudioContext} */ (new AC({ latencyHint: 'interactive' }));
      else if (st.ctx.state !== 'running') st.ctx.resume().catch(() => {});
      silentFrame(/** @type {AudioContext} */ (st.ctx));
    } catch (e) {
      st.error = String((e && /** @type {Error} */ (e).name) || 'error').slice(0, 40);
      return null;
    }
    st.unlocked = true;
    st.error = null;
    const ctx = /** @type {AudioContext} */ (st.ctx);
    for (const f of unlockHooks) f(ctx);
    return ctx;
  }

  /**
   * The last resort, inside a tap: close the context and unlock a new one.
   * @returns {AudioContext | null}
   */
  function rebuild() {
    const old = st.ctx;
    st.ctx = null;
    if (old) {
      try {
        old.close().catch(() => {});
      } catch {
        // a context that won't close is dropped all the same
      }
    }
    return unlockNow();
  }

  /** @param {Event} event */
  const handler = (event) => {
    if (!on()) return;
    st.taps++;
    if (!st.unlocked || !st.ctx) unlockNow();
    for (const f of tapHooks) f(event);
  };
  const opts = { capture: true, passive: true };
  for (const type of UNLOCK_EVENTS) doc.addEventListener(type, handler, opts);

  return {
    /** What the report needs (the engine copies it). */
    state: () => ({ unlocked: st.unlocked, session: st.session, taps: st.taps, error: st.error }),
    /** The context, once unlocked (null before). */
    context: () => st.ctx,
    unlockNow,
    rebuild,
    /** @param {(e: Event) => void} f called on every tap after the unlock's own work, while Sound is on */
    onTap: (f) => {
      tapHooks.push(f);
    },
    /** @param {(ctx: AudioContext) => void} f called with the context at every unlock (and at once if it has happened) */
    onUnlock: (f) => {
      unlockHooks.push(f);
      if (st.unlocked && st.ctx) f(st.ctx);
    },
    /** @param {() => boolean} f the Sound state, from now on */
    setIsOn: (f) => {
      on = f;
    },
    /** Remove the listeners (tests). */
    uninstall: () => {
      for (const type of UNLOCK_EVENTS) doc.removeEventListener(type, handler, opts);
    },
  };
}
