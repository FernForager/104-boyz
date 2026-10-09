// The doubts S4 found (the spec's section 8: D1 to D5, and the review's
// D8), for the ingest report. D6 is the permits generator's own and D7 the
// catalogs', both still open. The rest were answered at the source on
// 2026-10-09, after S4 (design/data/FACT_CHECK.md, "Session 4's doubts,
// answered at the source"), so the report lists them as resolved, each with
// where it was fixed, and no longer as live disagreements. Nothing in
// GAME_DESIGN is edited here.

/** The open data-side doubts, in the report's order (none: D1, D2, D5 and D8 are resolved). */
export const DATA_DOUBTS = Object.freeze([]);

/** Where FACT_CHECK.md records the answers. */
const ANSWERED = 'design/data/FACT_CHECK.md, "Session 4\'s doubts, answered at the source"';

/** The doubts answered since S4, in the report's order: what the data said, and where the doc or the source now agrees. */
export const RESOLVED_DOUBTS = Object.freeze([
  `D1. B.2's sunrise for Thursday, Aug 12, 2027: content/data/daylight.json and park_rules.json's daylight_loop_2027 give 6:06 (6:06:09, the floor of the instant; sunset 8:34 pm). Resolved 2026-10-09: GAME_DESIGN B.2 now prints 6:06, not 6:07 (${ANSWERED}).`,
  `D2. The drive: Forks about 60 minutes (NPS, Visiting Quinault) plus 69 minutes from Forks (the region data, OSRM) is 129, so leaving at 6:15 arrives at 8:24:00 (content/drive/routes.json). Resolved 2026-10-09: GAME_DESIGN 2.2 and 3.3 now say about 2 hours 9 and about 8:24, not 2 hours 10 and 8:25 (${ANSWERED}).`,
  `D5. The research's last book-frame words (decision 22): sol_duc_high_divide.json m1a_play_inputs quota_availability.roll_key and ranger_presence.permit_check.legal_night, and park_rules.json permits.desk_requests.roll_key. Resolved 2026-10-09 at the source: they now say the seed is drawn when the plan is first saved, Hike it again, and two permit checks a trip; none of them ever reached generated content (${ANSWERED}).`,
  `D8. GAME_DESIGN 7.2's daylight table ran a minute late on 8 of its 15 cells against content/data/daylight.json for 2027 (the loop's point, 47.97 N 123.83 W; the file matches all 96 values of park_rules.json's daylight_loop_2027). Resolved 2026-10-09: 7.2's cells and M1A_DATA_CHECK now carry the file's values, so S8's trail-dark goldens pin the file and the doc agrees (${ANSWERED}).`,
]);
