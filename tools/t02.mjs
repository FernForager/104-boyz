// T02, measured fit (BUILD_PLAN 10.5, S6, the spec's C.3; GAME_DESIGN
// 11.9, 12.1, F.3): every box, label, caption, Look and Why-sheet row is set
// in the fonts the phone renders (tools/fontmetrics.mjs: the shipped bytes'
// advances), broken into lines as a browser breaks them, and held to the
// space frameLayout() (web/js/ui/frame.js, the space check frame.css is
// built on) gives it, at two phones:
//
//   375 x 667 @2x  the SE: safe areas 20 and 0, a short screen (the 4x2
//                  picture, the toolbar folded into ≡), three choices
//   393 x 852 @3x  the 15 and 16: safe areas 59 and 34, four choices
//
// The rules (tools/textlint.mjs runs them; lint.mjs's registry lists them):
//   T02a error  every trail box (each slot at its widest variant) fits its
//               whole lines at both phones with that phone's budget of
//               52-pt choices (three on the SE, four on the 15)
//   T02b error  every stop's box fits on the 15 with its own choices as
//               drawn (a diamond, or a tag wrapped to line 2, is 64 pt); on
//               the SE a stop over the three-choice budget, or with four
//               choices, may continue (the ▾, ui/textbox.js): it is counted
//               and printed (a warning), not failed
//   T02c error  at 375 pt every choice label fits one line, beside the (i)
//               when the choice is rolled; its tag fits beside it or on
//               line 2; a diamond's fail and fatal shares fit line 2. Real
//               numbers come from engine/odds.js for real stops (at every
//               skill level, 0 to 5); a choice whose odds are a template's
//               takes the widest forms (♦ 99%, 70% and its fail word, 16%
//               fatal, <0.1% fatal)
//   T02d error  the caption fits two chrome rows at both widths with its
//               widest real fill (every loop place's gazetteer name, the
//               widest elevation, the widest day) and never ends a row
//               with "·" (the S5 hang)
//   T02e error  every Look (look.*) fits the Look box; an outcome's box fits
//               with its pencil rows and its one button; every Why-sheet
//               row with leader dots fits one line at 375, and its bands'
//               legend never starts a row with a number (each band's word
//               is bound to its number, bindNumbers). A picture's
//               composed alt text, its Look where a tap hits no hotspot, may
//               continue (▾): counted and printed
//   T02f warn   a box that would continue under Larger Text xxxLarge
//               (Literata at 23 px) on the SE (12.1's warning). AX sizes
//               continue by design and aren't checked.
// Every rule also fails a character the face has no glyph for, and a word
// wider than its line.
//
// The box: Pixelify Sans at 20 px on 26-px lines, a 13-px gap between
// paragraphs, inside a 3-fp border and 3-fp by 4-fp padding (frame.css; a
// test holds these to it). The chrome: OPH Chrome at 12 fp, 14-fp rows.
// Plain: Literata at its size, lines 1.35 of it, pinned at its default
// optical size (the spec's lead call 6). A line's *emphasis* is measured in
// the upright face: no box line uses it yet (fontmetrics reads Literata's
// italic for when one does). The ▾ is the runtime backstop for any
// difference between this model and Safari: in headless Chromium S6 found
// every one of the 74 box lines and Looks breaking into exactly the lines
// T02 counts, at both phones.

import { compileContent } from './content.mjs';
import { readText, channelScreens } from './text.mjs';
import { loadFaces, widthOf, breakLines } from './fontmetrics.mjs';
import { placeParts, loadHotspots, shippedHotspots, lookId } from './looks.mjs';
import { renderParts, plainText, NBSP, bindNumbers } from '../web/js/text.js';
import { pct, share, clock, minutes, rowValue } from '../web/js/fmt.js';
import { pOf, bandsOf, diamondOf, fatalOf } from '../web/js/engine/odds.js';
import { frameLayout, BOX_LINE_PT, BOX_CHROME_FP, CHOICE_TALL_PT, CHOICE_PT, CHOICE_GAP_PT, PLAIN_LINE, CHROME_ROW_FP, CAPTION_ROWS } from '../web/js/ui/frame.js';
import { INTRO_LINES, formsOn } from '../web/js/ui/choices.js';
import { join } from 'node:path';
import { ROOT, loadArt } from './pics.mjs';

/** The two phones T02 measures at (12.1's box budget). */
export const T02_CASES = Object.freeze([
  Object.freeze({ id: 'se', name: '375 x 667 (SE)', width: 375, height: 667, dpr: 2, safeTop: 20, safeBottom: 0, budget: 3 }),
  Object.freeze({ id: '15', name: '393 x 852 (15, 16)', width: 393, height: 852, dpr: 3, safeTop: 59, safeBottom: 34, budget: 4 }),
]);
/** Larger Text's xxxLarge: Literata's size (T02f, on the SE). */
export const XXXL_PX = 23;
/** frame.css's lengths T02 reads (a test holds each to the stylesheet). */
export const GEOMETRY = Object.freeze({
  boxPx: 20, // the box's Pixelify size
  paraGap: 13, // p + p
  boxBorderFp: 3, // --chrome-border
  boxPadXFp: 4, // the box's side padding (its top and bottom padding are 3, in BOX_CHROME_FP)
  chromeSizeFp: 12, // --chrome-size
  chromePadFp: 2, // the caption's side padding
  infoPt: 44, // the (i) square
  rowGapFp: 2, // .choice-row's gap
  tagGapFp: 4, // .choice-head's column-gap
  diamondFp: 7, // the diamond glyph
  glyphGapFp: 2, // .choice-tag's gap
  lookInsetFp: 3, // the Look box's inset in the mat
  ornamentFp: 16, // an outcome's ornament
  notesGapFp: 4, // .outcome-notes' gap
  pencilFp: 8, // the pencil glyph
  pencilGapFp: 2, // .pencil-row's gap
  sheetMax: 440, // .sheet's max-width
  sheetBorder: 4, // .box's border, each side
  sheetPadX: 12, // .sheet's side padding
  dotsFp: 4, // .why-dots' min-width
  dotsMarginFp: 2, // and its margin each side
});
/** The widest forms a template's odds can show (T02c). */
export const WIDEST_ODDS = Object.freeze({ made: 99, fail: 70, fatal: [{ tenths: 160 }, { under: true }] });
/** The skill levels a real stop's odds are worded at (schemas/vars.json skill.*). */
export const SKILL_LEVELS = Object.freeze([0, 1, 2, 3, 4, 5]);

/** @typedef {{file: string, line: number, code: string, msg: string, level?: 'error' | 'warn', id?: string}} Issue */

/**
 * Words for a ref, as the page shows them: {vars} filled (a ref var as its
 * line's words, one level deep), a number format's spaces no-break, a
 * line's " · " bound to what follows (text.js renderParts).
 * @param {Map<string, {text: any}>} lines
 * @param {{id: string, vars?: Record<string, unknown>}} ref
 * @returns {string | null} null when a line is missing
 */
export function wordsFor(lines, ref) {
  const pickForm = (/** @type {any} */ w, /** @type {any} */ vars) => (typeof w === 'string' ? w : vars && vars.n === 1 ? w.one : w.other);
  const shown = (/** @type {string} */ id, /** @type {string} */ s) => (id.startsWith('fmt.') ? s.replace(/ /g, NBSP) : s);
  const render = (/** @type {{id: string, vars?: Record<string, unknown>}} */ r, /** @type {number} */ depth) => {
    const line = lines.get(r.id);
    if (!line) return null;
    /** @type {Record<string, unknown>} */
    const vars = {};
    for (const [k, v] of Object.entries(r.vars || {})) {
      if (v && typeof v === 'object' && typeof (/** @type {any} */ (v).id) === 'string') {
        const inner = depth < 1 ? render(/** @type {any} */ (v), depth + 1) : null;
        if (inner === null) return null;
        vars[k] = inner;
      } else vars[k] = v;
    }
    return shown(r.id, plainText(renderParts(pickForm(line.text, vars), vars)));
  };
  return render(ref, 0);
}

/**
 * A template's widest fill: for each {var}, the vars.json sample that
 * makes it widest in the face.
 * @param {any} text readText()'s
 * @param {string} id
 * @param {(s: string) => number} measure
 */
function widestFill(text, id, measure) {
  const line = text.lines.get(id);
  if (!line) return null;
  const forms = typeof line.text === 'string' ? [line.text] : Object.values(line.text);
  const names = [...new Set(forms.flatMap((f) => [...String(f).matchAll(/\{([a-z][a-z0-9_]*)\}/g)].map((m) => m[1])))];
  if (!names.length) return wordsFor(text.lines, { id });
  const v = (text.vars && text.vars.vars) || {};
  /** @type {Record<string, unknown>} */
  const vars = {};
  for (const n of names) {
    const samples = v[n] && Array.isArray(v[n].samples) ? v[n].samples : [`{${n}}`];
    vars[n] = samples.reduce((best, s) => (measure(String(s)) > measure(String(best)) ? s : best), samples[0]);
  }
  return wordsFor(text.lines, { id, vars });
}

/**
 * The box's space at a phone: its inner width, its text's height, its
 * line height, and the face it sets.
 * @param {{width: number, height: number, dpr: number, safeTop: number, safeBottom: number}} phone
 * @param {{choices?: number, tall?: number, plainPx?: number | null, less?: number}} [o] less: points the choices' area takes beyond its buttons (an outcome's notes)
 */
export function boxSpace(phone, { choices = 3, tall = 0, plainPx = null, less = 0 } = {}) {
  const l = frameLayout({ ...phone, choices, tall, plainPx });
  const fp = l.fp;
  const line = plainPx ? PLAIN_LINE * plainPx : BOX_LINE_PT;
  return {
    layout: l,
    width: l.column - 2 * GEOMETRY.boxBorderFp * fp - 2 * GEOMETRY.boxPadXFp * fp,
    height: l.box - BOX_CHROME_FP * fp - less,
    line,
    plain: plainPx,
  };
}

/**
 * Set paragraphs in a face and see whether they fit a space.
 * @param {string[]} paras
 * @param {{width: number, height: number, line: number}} space
 * @param {(s: string) => number} measure
 * @param {number} [gap] between paragraphs
 */
export function fitParas(paras, space, measure, gap = GEOMETRY.paraGap) {
  let lines = 0;
  const tooWide = [];
  for (const p of paras) {
    const r = breakLines(p, space.width, measure);
    lines += r.lines.length;
    tooWide.push(...r.tooWide);
  }
  const height = lines * space.line + Math.max(0, paras.length - 1) * gap;
  return { lines, height, fits: height <= space.height + 0.5, tooWide };
}

/**
 * A choice's odds as its button words them, for each way it can show:
 * {tag, second} (second: a diamond's line 2, else null), at every skill
 * level (a real stop's) or in the widest forms (a template's).
 * @param {any} lines text.lines
 * @param {any} c the choice's rules
 * @param {any} constants rules.odds
 * @param {string | null} failWord the diamond's fail word, words
 * @returns {{kind: 'diamond' | 'pct' | 'sure' | null, forms: {made: string, second: string | null}[]}}
 */
export function oddsForms(lines, c, constants, failWord) {
  if (c.tag === 'sure') return { kind: 'sure', forms: [{ made: /** @type {string} */ (wordsFor(lines, { id: 'trail.odds.sure' })), second: null }] };
  if (!c.odds) return { kind: null, forms: [] };
  const diamond = diamondOf(c.odds.fail);
  const word = (/** @type {any} */ ref) => /** @type {string} */ (wordsFor(lines, ref));
  /** @type {{made: string, second: string | null}[]} */
  const forms = [];
  const add = (/** @type {number} */ made, /** @type {number} */ fail, /** @type {any} */ fatal) => {
    let second = null;
    if (diamond) {
      second = word({ id: 'trail.odds.fail', vars: { share: pct(fail), what: failWord || '' } });
      if (fatal) second += ` · ${word({ id: 'trail.odds.fatal', vars: { share: share(fatal) } })}`;
    }
    forms.push({ made: word(pct(made)), second });
  };
  if (constants && constants.bases && Object.prototype.hasOwnProperty.call(constants.bases, c.odds.base)) {
    for (const level of SKILL_LEVELS) {
      const { p } = pOf(constants, c.odds, { v: () => level });
      const bands = bandsOf(p, constants);
      const fatal = diamond ? fatalOf(bands.fail, c.odds.fail) : null;
      add(bands.made, bands.fail, fatal ? fatal.shown : null);
    }
  } else for (const f of WIDEST_ODDS.fatal) add(WIDEST_ODDS.made, WIDEST_ODDS.fail, diamond ? f : null);
  return { kind: diamond ? 'diamond' : 'pct', forms };
}

/**
 * A choice button's layout at a phone: its inner width, whether its tag
 * wraps to line 2 (then the button is 64 pt), what doesn't fit.
 * @param {{fp: number, column: number}} l frameLayout's
 * @param {(s: string) => number} chrome a run's width in the chrome font
 * @param {string} label words
 * @param {ReturnType<typeof oddsForms>} odds
 * @param {boolean} info it has the (i) square
 */
export function choiceFit(l, chrome, label, odds, info) {
  const fp = l.fp;
  const inner = l.column - (info ? GEOMETRY.infoPt + GEOMETRY.rowGapFp * fp : 0) - 2 * GEOMETRY.boxBorderFp * fp - 2 * GEOMETRY.boxPadXFp * fp;
  const room = inner - 1; // fontmetrics' slack
  const labelW = chrome(label);
  const problems = [];
  if (labelW > room) problems.push(`its label "${label}" is ${labelW.toFixed(1)} px, wider than the ${room.toFixed(1)} px of one line${info ? ' beside the (i)' : ''}`);
  let wraps = false;
  for (const f of odds.forms) {
    const tagW = (odds.kind === 'diamond' ? (GEOMETRY.diamondFp + GEOMETRY.glyphGapFp) * fp : 0) + chrome(f.made);
    if (tagW > room) problems.push(`its tag (${f.made}) is wider than a line`);
    if (labelW + GEOMETRY.tagGapFp * fp + tagW > room) wraps = true;
    if (f.second !== null) {
      const w = chrome(f.second);
      if (w > room) problems.push(`its line 2, "${f.second}", is ${w.toFixed(1)} px, wider than the ${room.toFixed(1)} px of line 2`);
    }
  }
  const tall = odds.kind === 'diamond' || wraps;
  return { inner, wraps, tall, problems };
}

/**
 * The stops a channel draws: each with its box's slots, its choices as
 * drawn (label words, odds forms, the (i)), and an outcome's pencil rows.
 * @param {any} text
 * @param {any} rules compileContent's rules
 * @param {any} voice compileContent's voice
 */
export function drawnStops(text, rules, voice) {
  const out = [];
  const lines = text.lines;
  const place = (/** @type {string} */ node) => {
    const n = text.names && text.names.places && text.names.places.get(`place.${node}`);
    return n ? String(n.text) : node;
  };
  for (const [set, data] of Object.entries((rules && rules.stops) || {})) {
    const v = (voice && voice.stops && voice.stops[set]) || {};
    for (const st of /** @type {any[]} */ (data.stops || [])) {
      const sv = v[st.id] || {};
      const slots = Array.isArray(sv.box) ? sv.box : [];
      /** @type {{id: string, label: string, odds: ReturnType<typeof oddsForms>, info: boolean}[]} */
      const choices = [];
      if (Array.isArray(st.choices)) {
        for (const c of st.choices) {
          const labelId = sv.labels && sv.labels[c.id];
          if (!labelId) continue;
          const failId = sv.fail_words && sv.fail_words[c.id];
          const odds = oddsForms(lines, c, rules.odds, failId ? wordsFor(lines, { id: failId }) : null);
          choices.push({ id: labelId, label: /** @type {string} */ (wordsFor(lines, { id: labelId })), odds, info: Boolean(c.odds) });
        }
      } else {
        const id = st.outcome === 'death' ? 'trail.next' : 'trail.walk_on';
        choices.push({ id, label: /** @type {string} */ (wordsFor(lines, { id })), odds: { kind: null, forms: [] }, info: false });
      }
      /** @type {string[]} */
      const pencil = [];
      if (st.outcome) {
        if (st.walk) pencil.push(/** @type {string} */ (wordsFor(lines, { id: 'trail.pencil.arrive', vars: { place: place(st.walk.to), time: wordsFor(lines, clock(12 * 3600 + 59 * 60)) } })));
        if (Number.isInteger(st.add_s)) pencil.push(/** @type {string} */ (wordsFor(lines, { id: 'trail.pencil.time', vars: { delta: wordsFor(lines, minutes(st.add_s)) } })));
      }
      // The most serious odds form it shows, for its first intro (choices.js introFor, lead call 3).
      const forms = formsOn({ choices: (st.choices || []).map((/** @type {any} */ c) => ({ tag: c.tag, odds: c.odds ? { kind: diamondOf(c.odds.fail) ? 'diamond' : 'pct', fatal: c.odds.fail.some((/** @type {any} */ f) => f.death) ? true : null } : null })) });
      out.push({ set, id: st.id, slots, choices, outcome: st.outcome || null, pencil, intro: forms.length ? /** @type {Record<string, string>} */ (INTRO_LINES)[forms[0]] : null });
    }
  }
  return out;
}

/**
 * T02 over the content: the issues, and what continues (printed).
 * @param {object} o
 * @param {any} o.text readText()'s
 * @param {any} o.rules
 * @param {any} o.voice
 * @param {ReturnType<typeof placeParts>} o.parts the drawable places' parts (tools/looks.mjs)
 * @param {string[]} o.places the loop's places (recipes.json's), for the caption
 * @param {Record<string, boolean>} o.looked the shipped hotspot kinds
 * @param {ReturnType<typeof loadFaces>} o.faces
 * @returns {{issues: Issue[], continues: string[], counts: Record<string, any>}}
 */
export function lintT02({ text, rules, voice, parts, places, looked, faces }) {
  /** @type {Issue[]} */
  const issues = [];
  /** @type {string[]} */
  const continues = [];
  const at = (/** @type {string} */ id) => {
    const line = text.lines.get(id);
    return line ? { file: line.file, line: line.line } : { file: 'content/stops', line: 1 };
  };
  const missing = new Set();
  const add = (/** @type {string} */ code, /** @type {string} */ id, /** @type {string} */ msg, /** @type {'error' | 'warn'} */ level = 'error') => issues.push({ ...at(id), code: 'T02', id, msg: `${code} ${msg}`, level });
  const measurer = (/** @type {any} */ face, /** @type {number} */ size) => (/** @type {string} */ s) => widthOf(face, size, s, missing);
  const box = measurer(faces.pixelify, GEOMETRY.boxPx);
  const stops = drawnStops(text, rules, voice);
  /** @type {Record<string, any>} */
  const counts = { stops: stops.length, boxLines: {}, continues: 0 };

  // Each slot at its widest variant (the one that sets the most height).
  const widest = (/** @type {any} */ stop, /** @type {any} */ space, /** @type {(s: string) => number} */ m) =>
    stop.slots.map((/** @type {string[]} */ slot) => {
      let best = '';
      let most = -1;
      for (const id of slot) {
        const w = widestFill(text, id, m);
        if (w === null) continue;
        const h = fitParas([w], space, m).height;
        if (h > most) {
          most = h;
          best = w;
        }
      }
      return best;
    });
  const wideWord = (/** @type {string[]} */ words, /** @type {string} */ id, /** @type {string} */ code) => {
    for (const w of new Set(words)) add(code, id, `"${w}" is wider than a line`);
  };

  for (const phone of T02_CASES) {
    const lay = frameLayout({ ...phone, choices: phone.budget });
    counts.boxLines[phone.id] = lay.boxLines;
    const chrome = measurer(faces.chrome, GEOMETRY.chromeSizeFp * lay.fp);
    for (const stop of stops) {
      const name = `${stop.set}.${stop.id}`;
      const firstId = stop.slots.length && stop.slots[0].length ? stop.slots[0][0] : stop.choices.length ? stop.choices[0].id : 'trail.walk_on';
      // T02c, and the choices as drawn (at the SE's 375 pt for T02c; both phones for the tall count).
      let tall = 0;
      for (const c of stop.choices) {
        const fit = choiceFit(lay, chrome, c.label, c.odds, c.info);
        if (fit.tall) tall++;
        if (phone.id === 'se') for (const p of fit.problems) add('T02c', c.id, `${name}: at 375 pt, ${p}`);
      }
      if (!stop.slots.length) continue;
      // T02a: the budget's choices, all 52 pt.
      const budget = boxSpace(phone, { choices: phone.budget });
      const paras = widest(stop, budget, box);
      const a = fitParas(paras, budget, box);
      wideWord(a.tooWide, firstId, 'T02a');
      if (!a.fits) add('T02a', firstId, `${name} at ${phone.name} with ${phone.budget} choices: ${a.lines} lines, ${a.height} px, over the box's ${Math.floor(budget.height)} px (${lay.boxLines} lines)`);
      // T02b: its own choices; an outcome's notes take their room too.
      const notes = stop.outcome ? notesHeight(lay, chrome, stop.pencil) + CHOICE_GAP_PT : 0;
      const own = boxSpace(phone, { choices: stop.choices.length, tall, less: notes });
      const b = fitParas(widest(stop, own, box), own, box);
      if (!b.fits) {
        const what = `${name} at ${phone.name} with its own ${stop.choices.length} choice${stop.choices.length === 1 ? '' : 's'} (${tall} tall)${stop.outcome ? ' and its notes' : ''}: ${b.lines} lines, ${b.height} px, over the box's ${Math.floor(own.height)} px`;
        // On the SE, a stop over the three-choice budget (or with four) may continue; an outcome never.
        const over = stop.choices.length >= 4 || stop.choices.length * CHOICE_PT + tall * (CHOICE_TALL_PT - CHOICE_PT) > phone.budget * CHOICE_PT;
        if (stop.outcome) add('T02e', firstId, what);
        else if (phone.id === 'se' && over) {
          continues.push(`${what}: continues (▾)`);
          add('T02b', firstId, `${what}: it continues (▾)`, 'warn');
        } else add('T02b', firstId, what);
      }
      // The odds intro, once a phone: printed when it makes the box continue.
      if (stop.intro) {
        const intro = wordsFor(text.lines, { id: stop.intro });
        const withIntro = fitParas([/** @type {string} */ (intro), ...widest(stop, own, box)], own, box);
        if (!withIntro.fits) continues.push(`${name} at ${phone.name} with its first intro (${stop.intro}): ${withIntro.lines} lines, continues (▾)`);
      }
      // T02f: Larger Text xxxLarge, on the SE.
      if (phone.id === 'se') {
        const lit = measurer(faces.literata, XXXL_PX);
        const plain = boxSpace(phone, { choices: phone.budget, plainPx: XXXL_PX });
        const f = fitParas(widest(stop, plain, lit), plain, lit);
        if (!f.fits) add('T02f', firstId, `${name} on the SE under Larger Text xxxLarge (Literata ${XXXL_PX} px): ${f.lines} lines in ${Math.floor(plain.height / plain.line)}, so it continues (▾)`, 'warn');
      }
    }
    // T02d: the caption, two rows, never a hanging dot.
    const capW = lay.column - 2 * GEOMETRY.chromePadFp * lay.fp;
    for (const p of captionFills(text, places, chrome)) {
      const r = breakLines(p.words, capW, chrome);
      if (r.lines.length > CAPTION_ROWS) add('T02d', 'trail.caption', `at ${phone.name}, ${p.place}'s caption takes ${r.lines.length} rows: "${r.lines.join(' / ')}"`);
      for (const row of r.lines) if (row.endsWith('·')) add('T02d', 'trail.caption', `at ${phone.name}, a row of ${p.place}'s caption ends with "·": "${row}"`);
      wideWord(r.tooWide, 'trail.caption', 'T02d');
    }
    // T02e: the Looks fit the Look box; a picture's alt Look may continue.
    const look = lookSpace(lay);
    for (const kind of Object.keys(looked).filter((k) => looked[k])) {
      for (const id of [...text.lines.keys()].filter((i) => i === lookId(kind) || i.startsWith(`${lookId(kind)}.`)).filter((i) => !i.startsWith('look.name.'))) {
        const w = wordsFor(text.lines, { id });
        if (w === null) continue;
        const f = fitParas([w], look, box);
        wideWord(f.tooWide, id, 'T02e');
        if (!f.fits) add('T02e', id, `at ${phone.name}, ${id} is ${f.lines} lines in a Look box of ${Math.floor(look.height / look.line)}`);
      }
    }
    // A picture's alt Look is its parts' sentences run together in one paragraph (ui/look.js), as VoiceOver reads them.
    let altLooks = 0;
    let altGo = 0;
    /** @type {{place: string, hour: string, lines: number} | null} */
    let worst = null;
    for (const p of parts) {
      for (const [hour, ids] of Object.entries(p.alt)) {
        const words = ids.map((id) => wordsFor(text.lines, { id })).filter((w) => w !== null);
        const f = fitParas([words.join(' ')], look, box);
        altLooks++;
        if (f.fits) continue;
        altGo++;
        if (!worst || f.lines > worst.lines) worst = { place: p.place, hour, lines: f.lines };
      }
    }
    if (worst) continues.push(`alt Looks at ${phone.name}: ${altGo} of ${altLooks} continue (▾), the longest ${worst.place} at ${worst.hour}, ${worst.lines} lines in ${Math.floor((look.height + 0.5) / look.line)}`);
    counts.altLooks = { ...(counts.altLooks || {}), [phone.id]: { looks: altLooks, continue: altGo } };
  }
  // T02e: the Why sheet's rows with leader dots, one line at 375.
  const se = frameLayout({ ...T02_CASES[0], choices: 3 });
  const chromeSe = measurer(faces.chrome, GEOMETRY.chromeSizeFp * se.fp);
  const sheetInner = Math.min(T02_CASES[0].width, GEOMETRY.sheetMax) - 2 * GEOMETRY.sheetBorder - 2 * GEOMETRY.sheetPadX;
  for (const row of whyRows(text, rules, voice)) {
    const w = chromeSe(row.label) + (GEOMETRY.dotsFp + 2 * GEOMETRY.dotsMarginFp) * se.fp + chromeSe(row.value);
    if (w > sheetInner - 1) add('T02e', row.id, `the Why sheet's row "${row.label} ... ${row.value}" is ${w.toFixed(1)} px, wider than the sheet's ${sheetInner} px at 375`);
  }
  // T02e: the bands' legend, as the sheet shows it, never orphans a number on its own row.
  for (const words of whyLegends(text, rules)) {
    const f = breakLines(words, sheetInner, chromeSe);
    wideWord(f.tooWide, LEGEND_LINE, 'T02e');
    const orphan = f.lines.slice(1).find((l) => /^\d/.test(l));
    if (orphan !== undefined) add('T02e', LEGEND_LINE, `the Why sheet's legend "${words.replaceAll(NBSP, ' ')}" breaks a band's word from its number at 375 (a row starts "${orphan}")`);
  }
  for (const ch of [...missing].sort()) issues.push({ file: 'web/fonts/FONTS.md', line: 1, code: 'T02', msg: `a line sets "${ch}" (U+${(/** @type {number} */ (ch.codePointAt(0))).toString(16).toUpperCase().padStart(4, '0')}), which its face has no glyph for: a browser would fall back to another font`, level: 'error' });
  counts.continues = continues.length;
  return { issues, continues, counts };
}

/**
 * An outcome's notes' height (the ornament, or its pencil rows, set in the
 * chrome beside it), in points.
 * @param {{fp: number, column: number}} l
 * @param {(s: string) => number} chrome
 * @param {string[]} pencil
 */
export function notesHeight(l, chrome, pencil) {
  const fp = l.fp;
  const width = l.column - (GEOMETRY.ornamentFp + GEOMETRY.notesGapFp + GEOMETRY.pencilFp + GEOMETRY.pencilGapFp) * fp;
  const rows = pencil.reduce((n, p) => n + breakLines(p, width, chrome).lines.length, 0);
  return Math.max(GEOMETRY.ornamentFp * fp, rows * CHROME_ROW_FP * fp);
}

/**
 * The Look box's space at a phone (frame.css .look-box): inside the mat,
 * 3 fp in from it, the picture's height less 3 fp above and below, a box's
 * border and padding inside.
 * @param {ReturnType<typeof frameLayout>} l
 */
export function lookSpace(l) {
  const fp = l.fp;
  const outer = l.column - 2 * l.keyline - 2 * l.mat - 2 * GEOMETRY.lookInsetFp * fp;
  return {
    width: outer - 2 * GEOMETRY.boxBorderFp * fp - 2 * GEOMETRY.boxPadXFp * fp,
    height: l.picture.height - 2 * GEOMETRY.lookInsetFp * fp - BOX_CHROME_FP * fp,
    line: BOX_LINE_PT,
  };
}

/**
 * The caption's widest fills: every loop place (a recipe's: G05 gives
 * every M1a node one) with a gazetteer name, at the widest day and the
 * widest elevation (vars.json's samples, measured).
 * @param {any} text
 * @param {Iterable<string>} placeIds
 * @param {(s: string) => number} measure the chrome's widths
 */
export function captionFills(text, placeIds, measure) {
  const v = (text.vars && text.vars.vars) || {};
  const widest = (/** @type {string} */ k, /** @type {string} */ fallback) => {
    const samples = v[k] && Array.isArray(v[k].samples) ? v[k].samples.map(String) : [fallback];
    return samples.reduce((a, b) => (measure(b) > measure(a) ? b : a), samples[0]);
  };
  const day = widest('day', '12');
  const elev = { id: 'fmt.ft', vars: { ft: widest('ft', '5,474') } };
  /** @type {{place: string, words: string}[]} */
  const out = [];
  for (const id of placeIds) {
    const n = text.names && text.names.places && text.names.places.get(`place.${id}`);
    if (!n) continue;
    const words = wordsFor(text.lines, { id: 'trail.caption', vars: { day, place: String(n.text), elev } });
    if (words !== null) out.push({ place: id, words });
  }
  return out;
}

/**
 * The Why sheet's rows with leader dots, worded: each base and modifier
 * row, Clean and You make it, for every odds choice at every skill level.
 * @param {any} text
 * @param {any} rules
 * @param {any} voice
 * @returns {{id: string, label: string, value: string}[]}
 */
export function whyRows(text, rules, voice) {
  const out = [];
  const constants = rules && rules.odds;
  const labels = voice && voice.odds;
  if (!constants) return out;
  for (const data of Object.values((rules && rules.stops) || {})) {
    for (const st of /** @type {any[]} */ (data.stops || [])) {
      for (const c of st.choices || []) {
        if (!c.odds) continue;
        for (const level of SKILL_LEVELS) {
          const { rows, p } = pOf(constants, c.odds, { v: () => level }, labels);
          const bands = bandsOf(p, constants);
          rows.forEach((r, k) => {
            if (!r.label) return;
            out.push({ id: r.label.id, label: /** @type {string} */ (wordsFor(text.lines, r.label)), value: rowValue(r.value, k > 0) });
          });
          out.push({ id: 'trail.why.clean', label: /** @type {string} */ (wordsFor(text.lines, { id: 'trail.why.clean' })), value: String(p) });
          out.push({ id: 'trail.why.made', label: /** @type {string} */ (wordsFor(text.lines, { id: 'trail.why.made' })), value: /** @type {string} */ (wordsFor(text.lines, pct(bands.made))) });
        }
      }
    }
  }
  return out;
}

/** The Why sheet's bands legend (ui/sheet.js). */
export const LEGEND_LINE = 'trail.why.bands';

/**
 * The Why sheet's bands legend, worded as the sheet shows it (each band's
 * word bound to its number), for every odds choice at every skill level.
 * @param {any} text
 * @param {any} rules
 * @param {(s: string) => string} [bind] the sheet's binding (a test passes none)
 * @returns {string[]}
 */
export function whyLegends(text, rules, bind = bindNumbers) {
  const out = new Set();
  const constants = rules && rules.odds;
  if (!constants) return [];
  for (const data of Object.values((rules && rules.stops) || {})) {
    for (const st of /** @type {any[]} */ (data.stops || [])) {
      for (const c of st.choices || []) {
        if (!c.odds) continue;
        for (const level of SKILL_LEVELS) {
          const { p } = pOf(constants, c.odds, { v: () => level });
          const b = bandsOf(p, constants);
          const words = wordsFor(text.lines, { id: LEGEND_LINE, vars: { clean: b.clean, shaky: b.shaky, fail: b.fail } });
          if (words !== null) out.add(bind(words));
        }
      }
    }
  }
  return [...out];
}

/**
 * T02 over the repo: preview's content (the superset of main's), its
 * words, its art, the shipped fonts.
 * @param {string} [root]
 */
export function runT02(root = ROOT) {
  const text = readText(root, { strict: false });
  const { rules, voice } = compileContent({ root, screens: channelScreens(text, 'preview') });
  const art = loadArt(join(root, 'content', 'art', 'pics'));
  const parts = placeParts(art);
  return lintT02({ text, rules, voice, parts, places: Object.keys((art.recipes && art.recipes.places) || {}), looked: shippedHotspots(loadHotspots(root).hotspots), faces: loadFaces(root) });
}
