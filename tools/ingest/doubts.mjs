// The data-side doubts track B found (the spec's section 8: D1, D2 and D5,
// and the review's D8), for the ingest report's Doubts. D3 and D4 are the
// regions' (ingest.mjs); D6 is the permits generator's own, D7 the
// catalogs'. Nothing in GAME_DESIGN is edited here.

/** The doubts, in the report's order. */
export const DATA_DOUBTS = Object.freeze([
  "D1. B.2's sunrise: GAME_DESIGN B.2 prints 6:07 for Thursday, Aug 12, 2027; content/data/daylight.json and park_rules.json's daylight_loop_2027 give 6:06 (6:06:09, the floor of the instant; sunset 8:34 pm agrees).",
  'D2. The drive: Forks about 60 minutes (NPS, Visiting Quinault) plus 69 minutes from Forks (the region data, OSRM) is 129, so leaving at 6:15 arrives at 8:24:00 (content/drive/routes.json); GAME_DESIGN 2.2 and 3.3 say about 2 hours 10 and about 8:25.',
  'D5. The research\'s own text still says "Begin a new book" and "a book" (sol_duc_high_divide.json m1a_play_inputs: quota_availability.roll_key and ranger_presence.permit_check.legal_night; park_rules.json permits.desk_requests.roll_key): research text, never shipped (permits.json carries no words; T07 doesn\'t read design/data). Worth a cleanup at the source in a later data pass.',
  "D8. GAME_DESIGN 7.2's daylight table (computed for 47.9 N; its full table is data/daylight.json) runs a minute late on 8 of its 15 cells against content/data/daylight.json for 2027, M1a's trip year, rounded to the minute (the loop's point, 47.97 N 123.83 W; the file matches all 96 values of park_rules.json's daylight_loop_2027): Jul 15 sunset 9:11 (data 9:10); Aug 15 sunrise 6:11 and sunset 8:29 (6:10, 8:28); Sep 15 sunrise 6:53 (6:52); Oct 1 sunrise 7:15 and civil dusk 7:26 (7:14, 7:25); Oct 15 sunset 6:28 and civil dusk 6:59 (6:27, 6:58). The latitude doesn't explain it: the same method at 47.9 N differs from the doc on 11 cells (on 1 at 47.9 N 124.0 W, about 8 miles west). The engine reads daylight.json, so S8's trail-dark goldens pin its values, not 7.2's cells, unless the doc's table is refreshed.",
]);
