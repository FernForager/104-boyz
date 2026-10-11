// The lockbox and the locals' quiz, first launch only (GAME_DESIGN 2.6,
// 12.3, E.5; decision 45; BUILD_PLAN S7, lead call 53). Built in S7.
//
// PURE. The key to the cabin is in a lockbox on the porch's newel post, and
// it wants three answers. The device record holds the quiz (save.js,
// device v2): null while the box is shut, then {seed, dealt, answers,
// done}. The phase shows while the quiz isn't done and no trip is under
// way (step.js phaseOf), before the guest book on a fresh phone and once
// at the next return home on a phone that already has a hiker; `done`
// never resets (not after a death, not after an update), so it never
// comes back. Its actions are the device's, never logged (level hiker):
//
//   deal {seed}   the box opens its questions: three of the content's
//                 quiz (content.quiz(), rules.quiz from
//                 content/quiz/locals.json), drawn from the seed the UI
//                 completes (platform/rand.js), one draw per pick on the
//                 quiz stream (draw(seed, 'quiz', k).int(n)), never two
//                 pronunciation questions in a row while another kind is
//                 left (rules.no_two_pronunciations_in_a_row). A content
//                 with no quiz (the engine fixture) deals none: its shut
//                 screen's only choice opens the box.
//   answer {a}    the answer to the question showing, 0 to its answers
//                 less one, in their authored order. Right or wrong, the
//                 box opens (decision 45: everyone gets in).
//   open          Take the key: done, and the next phase is home (a
//                 hiker) or the guest book.
//
// The screens, step by step (the words are the content's refs, voice.json
// quiz, and S7's first.lockbox.* lines):
//   shut   no box; one choice, Open the lockbox ({t: 'deal'}, the UI adds
//          the seed), or with no quiz {t: 'open'}
//   ask    the reply to the last answer (from the second question), the
//          intro (the first), Question {q} of 3., the question; its three
//          answers as choices
//   open   all three right: Three for three. Welcome home.; else the reply
//          to the third and Come in anyway...; one choice, Take the key
// A dealt question this build no longer has is skipped (its answer is
// null), counting neither way, so an update never strands a phone mid-quiz.

import { EngineError } from '../error.js';
import { draw } from '../rng.js';

/** The rng stream the deal draws on (rng.js STREAMS: a new stream shifts no other's draws). */
export const QUIZ_STREAM = 'quiz';
/** The lockbox's own lines (B003). */
export const LINES = Object.freeze({
  start: 'first.lockbox.start',
  intro: 'first.lockbox.intro',
  count: 'first.lockbox.count',
  allRight: 'first.lockbox.all_right',
  comeIn: 'first.lockbox.come_in',
  takeKey: 'first.lockbox.take_key',
});
/** The replies when the content names none (the quiz file names them: voice.json quiz). */
const REPLIES = Object.freeze({ right: 'first.lockbox.right', wrong: 'first.lockbox.wrong' });

/**
 * The quiz record of a box opened with nothing dealt: a build with no quiz,
 * and the stand-in device a replay plays on (replay.js), which is past the
 * lockbox as every logged trip is.
 */
export const OPENED = Object.freeze({ seed: null, dealt: Object.freeze([]), answers: Object.freeze([]), done: true });

/**
 * Is the lockbox open on this device (its quiz done)?
 * @param {any} device
 */
export const lockboxOpen = (device) => Boolean(device && device.quiz && device.quiz.done === true);

/**
 * @typedef {{id: string, answers: number, right: number, pronunciation: boolean}} Question rules.quiz's
 * @typedef {{format: number, deal: number, rules: Record<string, boolean>, questions: Question[]}} Quiz
 * @typedef {{seed: string | null, dealt: string[], answers: (number | null)[], done: boolean}} QuizRecord
 */

/**
 * The content's quiz, or null when it has none (or none to deal).
 * @param {import('../content.js').Content} content
 * @returns {Quiz | null}
 */
function quizOf(content) {
  const q = typeof content.quiz === 'function' ? content.quiz() : null;
  return q && q.questions.length && q.deal > 0 ? q : null;
}

/**
 * Pure: the deal for a seed: the quiz's `deal` question ids, in the order
 * asked. Pick k draws once on the quiz stream, keyed by k, from the
 * questions not yet dealt, in their authored order; after a pronunciation
 * question, from the others while any are left (when the rule is on).
 * @param {string} seed
 * @param {Quiz} quiz
 * @returns {string[]}
 */
export function dealQuiz(seed, quiz) {
  const rule = Boolean(quiz.rules && quiz.rules.no_two_pronunciations_in_a_row);
  let left = quiz.questions.slice();
  /** @type {Question[]} */
  const picks = [];
  const n = Math.min(quiz.deal, left.length);
  for (let k = 0; k < n; k++) {
    const last = picks.length ? picks[picks.length - 1] : null;
    let from = left;
    if (rule && last && last.pronunciation) {
      const others = left.filter((q) => !q.pronunciation);
      if (others.length) from = others;
    }
    const pick = from[draw(seed, QUIZ_STREAM, k).int(from.length)];
    picks.push(pick);
    left = left.filter((q) => q !== pick);
  }
  return picks.map((q) => q.id);
}

/**
 * The question with an id in this content, or null.
 * @param {Quiz | null} quiz
 * @param {string} id
 */
const questionOf = (quiz, id) => (quiz ? quiz.questions.find((q) => q.id === id) || null : null);

/**
 * Pure: the quiz's progress: the dealt position asked next (or -1 when
 * every one is answered), how many were answered (skips aside) and how
 * many of those were right, each counted only while this content has the
 * question.
 * @param {QuizRecord} rec
 * @param {Quiz | null} quiz
 */
export function progress(rec, quiz) {
  let answered = 0;
  let right = 0;
  rec.answers.forEach((a, k) => {
    const q = questionOf(quiz, rec.dealt[k]);
    if (a === null || !q) return;
    answered++;
    if (a === q.right) right++;
  });
  let at = rec.answers.length;
  while (at < rec.dealt.length && !questionOf(quiz, rec.dealt[at])) at++;
  return { at: at < rec.dealt.length ? at : -1, answered, right };
}

/**
 * The words of the quiz (voice.json quiz): each question's ask and answers,
 * and the two replies.
 * @param {import('../content.js').Content} content
 * @returns {{right: string, wrong: string, questions: Record<string, {ask: string, answers: string[]}>}}
 */
function words(content) {
  const v = typeof content.quizVoice === 'function' ? content.quizVoice() : null;
  return { right: (v && v.right) || REPLIES.right, wrong: (v && v.wrong) || REPLIES.wrong, questions: (v && v.questions) || {} };
}

/**
 * A question's words, or a state error when the build lacks them.
 * @param {ReturnType<typeof words>} w
 * @param {string} id
 */
function asked(w, id) {
  const q = Object.prototype.hasOwnProperty.call(w.questions, id) ? w.questions[id] : null;
  if (!q) throw new EngineError('state', 'lockbox: a question has no words');
  return q;
}

/**
 * The reply to the answer at a dealt position (right or wrong), or null for
 * a skipped one.
 * @param {QuizRecord} rec
 * @param {Quiz | null} quiz
 * @param {ReturnType<typeof words>} w
 * @param {number} k
 * @returns {import('../template.js').Ref | null}
 */
function replyTo(rec, quiz, w, k) {
  const a = rec.answers[k];
  const q = questionOf(quiz, rec.dealt[k]);
  if (a === null || a === undefined || !q) return null;
  return { id: a === q.right ? w.right : w.wrong };
}

/**
 * A fresh device's way past the lockbox (the self-check's first launch, the
 * tools' bots, the dev routes): with a quiz, deal with the seed and answer
 * 0 to each question dealt; then Take the key.
 * @param {string} seed
 * @param {import('../content.js').Content} content
 * @returns {Record<string, unknown>[]}
 */
export function lockboxActs(seed, content) {
  const quiz = quizOf(content);
  if (!quiz) return [{ t: 'open' }];
  const n = Math.min(quiz.deal, quiz.questions.length);
  return [{ t: 'deal', seed }, ...Array.from({ length: n }, () => ({ t: 'answer', a: 0 })), { t: 'open' }];
}

/**
 * The step a device's lockbox is at: shut, ask or open.
 * @param {any} state
 * @param {import('../content.js').Content} content
 * @returns {'shut' | 'ask' | 'open'}
 */
export function stepOf(state, content) {
  const rec = state.device && state.device.quiz;
  if (!rec) return 'shut';
  return progress(rec, quizOf(content)).at >= 0 ? 'ask' : 'open';
}

/**
 * @param {any} state
 * @param {any} device
 */
const withDevice = (state, device) => ({ ...state, device });

/** @type {import('../phase.js').Phase} */
export default Object.freeze({
  id: 'lockbox',
  built: true,
  lands: 'S7',
  level: 'hiker',
  accepts: Object.freeze(['deal', 'answer', 'open']),
  enter: (state) => state,
  step(state, action, content) {
    const quiz = quizOf(content);
    const at = stepOf(state, content);
    const rec = state.device.quiz;
    const refused = () => new EngineError('refused', 'lockbox: not on this screen');
    if (action.t === 'deal') {
      if (at !== 'shut' || !quiz) throw refused();
      return withDevice(state, { ...state.device, quiz: { seed: action.seed, dealt: dealQuiz(action.seed, quiz), answers: [], done: false } });
    }
    if (action.t === 'answer') {
      if (at !== 'ask') throw refused();
      const k = progress(rec, quiz).at;
      const q = /** @type {Question} */ (questionOf(quiz, rec.dealt[k]));
      if (action.a >= q.answers) throw new EngineError('invalid', 'lockbox: no such answer');
      // Positions skipped on the way (questions this build lacks) are null.
      const answers = [...rec.answers];
      while (answers.length < k) answers.push(null);
      answers.push(action.a);
      return withDevice(state, { ...state.device, quiz: { ...rec, answers } });
    }
    // open: Take the key (or, with no quiz, the shut box's one choice).
    if (at === 'open') return withDevice(state, { ...state.device, quiz: { ...rec, done: true } });
    if (at === 'shut' && !quiz) return withDevice(state, { ...state.device, quiz: { seed: null, dealt: [], answers: [], done: true } });
    throw refused();
  },
  screen(state, content) {
    const quiz = quizOf(content);
    const at = stepOf(state, content);
    if (at === 'shut') {
      const act = quiz ? { t: 'deal' } : { t: 'open' };
      return { phase: 'lockbox', step: 'shut', box: [], choices: [{ act, label: { id: LINES.start }, enabled: true }] };
    }
    const rec = state.device.quiz;
    const w = words(content);
    const p = progress(rec, quiz);
    if (at === 'ask') {
      const id = rec.dealt[p.at];
      const q = asked(w, id);
      /** @type {import('../template.js').Ref[]} */
      const box = [];
      // The reply to the last answer that counts, from the second question.
      for (let k = p.at - 1; k >= 0; k--) {
        const r = replyTo(rec, quiz, w, k);
        if (r) {
          box.push(r);
          break;
        }
      }
      const n = p.answered + 1;
      if (n === 1) box.push({ id: LINES.intro });
      box.push({ id: LINES.count, vars: { q: n } });
      box.push({ id: q.ask });
      const choices = q.answers.map((ref, a) => ({ act: { t: 'answer', a }, label: { id: ref }, enabled: true }));
      return { phase: 'lockbox', step: 'ask', q: n, box, choices };
    }
    // open: every dealt question answered (or skipped).
    const allRight = rec.dealt.length > 0 && p.right === rec.dealt.length;
    /** @type {import('../template.js').Ref[]} */
    let box;
    if (allRight) box = [{ id: LINES.allRight }];
    else {
      const last = replyTo(rec, quiz, w, rec.dealt.length - 1);
      box = last ? [last, { id: LINES.comeIn }] : [{ id: LINES.comeIn }];
    }
    return { phase: 'lockbox', step: 'open', box, choices: [{ act: { t: 'open' }, label: { id: LINES.takeKey }, enabled: true }] };
  },
});
