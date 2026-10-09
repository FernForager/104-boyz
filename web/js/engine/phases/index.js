// The sixteen phases (BUILD_PLAN 2.3: phases/*.js), in the order a hiker
// meets them. fkt (T1) and daily (T2) join later.
//
// PURE.

import lockbox from './lockbox.js';
import guestbook from './guestbook.js';
import home from './home.js';
import plan from './plan.js';
import permit from './permit.js';
import town from './town.js';
import flatlay from './flatlay.js';
import drive from './drive.js';
import trailhead from './trailhead.js';
import day from './day.js';
import camp from './camp.js';
import night from './night.js';
import finish from './finish.js';
import report from './report.js';
import soak from './soak.js';
import death from './death.js';

/** Every phase, in order. */
export const ORDER = Object.freeze([lockbox, guestbook, home, plan, permit, town, flatlay, drive, trailhead, day, camp, night, finish, report, soak, death]);

/** @type {Readonly<Record<string, import('../phase.js').Phase>>} */
export const PHASES = Object.freeze(Object.fromEntries(ORDER.map((p) => [p.id, p])));
