# Design doc audit before M1a

Audit of `design/GAME_DESIGN.md` on 2026-10-08, read end to end against "Decisions made", with the M1a numbers checked against `sol_duc_high_divide.json`. Nothing was committed. No game code was written.

**Result:** 14 issues fixed in the doc and 20 left open. Two open issues should be settled before M1a starts: N1 and N3. The rest can be settled during M1a, as long as each one is settled before the system it touches is built. All 42 internal anchors resolve. No retired idea is left as a live feature: every mention of the field guide, fox, helper animals, prologue, Read to me, Snowlamp, Perilous, a Hoh-first roadmap or Morgenroth as a planner camp is a stated denial. Hiker inheritance only appears in "a new hiker inherits nothing". Friends' names appear only as `{BOY_n}` placeholders.

## Fixed in place

| # | Sev | Where | What changed |
|---|---|---|---|
| F1 | high | 7.10, 8.5, 8.11, 9.5, 12.2, 12.11, D.8 | The skill bonus had two readings. Appendices A to C and `simulation.md` count a beginner's level 1 as +2, but 8.11, the Why sheet and D.8 left it out. The rule is now stated as "+2 per level, counted from 0, so a beginner's level 1 is +2", and those examples are recomputed. The waist-deep ford now reads ♦ 37% · 63% · **1.9%** fatal (it was 2%). The Why sheet reads 66-86 clean and 83-93%. The ladder at dusk reads ♦ 72% · 28% fall · 0.3%. |
| F2 | high | 3.1, 3.3, B.3 | The night-list ETAs (11:40, 2:30, 3:35) and "Sol Duc Park 2:30, six hours before dark" ran about 35 minutes later than the 7.4 formula gives. The formula does reproduce B.6 and the 12.12 fork exactly. They now read 11:25 am, 1:55 pm and 2:55 pm, and B.3's times match. |
| F3 | med | 3.1, 12.21 | 3.1 gave the Hoh trip's maximum (131) for Appendix B's trip, which is 170. The 12.21 censor-bar page showed 48 of 96 after B.6 had already earned 50. |
| F4 | med | 2.6 | "+2 Leave No Trace" now says "+2 score", as 9.6 defines it. The −5 penalties are now labeled as the Leave No Trace ledger. |
| F5 | low | 8.1 | Defined the cost tags the pages use: `night`, `rest`, `cold` and `permit`. |
| F6 | low | 7.7 | The ford penalty for being tired or cold is now −5 to −20, as in the 8.5 table (it said −15). |
| F7 | med | 3.1, 4.6 | The *Phone the WIC* card applied winter rules to any date outside the online window. Winter rules now apply only from Oct 16 to May 14 (`park_rules.json`). |
| F8 | low | 8.3 | The card-archetype bullet titled "Inheritance" is now "Archetypes and place patches", so it can't be confused with the retired hiker inheritance. |
| F9 | low | 14.3 | Marked "Sierra mode" as the research's name for the retired mode key. The game's key is `oldschool`. |
| F10 | low | F.3 | Lint codes T03 (the deny-list) and T04 (*Golden Glow*) were cited elsewhere but never labeled in F.3. They are now. |
| F11 | low | F.2 | "Keeps pushing" named two policies. F.1's rows mean the Bold bot, and the look-ahead's policy (8.9) is Reckless. Both are now stated. |
| F12 | low | 12.5, 4.3, 3.1, B.7, F.3, 12.21, D.18b | Three choice labels broke the 22-character cap. They now read *Ask about a lake*, *Dress, into the bag* and *Off the crest, now* (the label B.6 already uses). |
| F13 | low | 12.4 | Removed a Trail Register shown on the WIC's wall. The register lives at the trailhead and on the bookshelf. |
| F14 | low | 3.1, 4.6, B.1 | The router takes the shortest route, but the ↺ two-night basin fill (20.4 mi) isn't the shortest. The fill is now stored with `via` pins; without them the loop routes to 18.7 mi. |

## Still open (need a call)

| # | Sev | Issue | Suggested resolution |
|---|---|---|---|
| N1 | **high** | Decision 17 says "any permitted camp on or just off it". M1a's camp list leaves out the WIC-only camps on or just off the loop (Bruce's Roost, Cat Basin, Hidden Lake, Long Lake, Sol Duc Lake), and the *ask at the desk* request is in M1b. 3.1's planner still shows those rows. | Move the desk-side request (a seeded roll: about 70% midweek, 40% on weekends) into M1a for Bruce's Roost, Cat Basin and Hidden Lake. Keep Long Lake and Sol Duc Lake (they need off-trail navigation), the phone and Morgenroth in M1b. |
| N2 | med | M1a never says what happens to hooks the screens already show. These include the WIC number and counter card (the call comes in M1b, but F.5 asks to make it at every milestone) and month chips outside Aug-Sep. They also include the Lodge, Second Growth and Skillet chips, the Bonfire Lily roll (B.3), Walk out, Try this trip again, and whether `book_ends` needs a `modes.storybook` override in M1a. | Add an "M1a shows / hides" list to 15. Suggested: hide the number until M1b, offer only Aug-Sep chips, and require the overrides from M1a. |
| N3 | med | Day hikes skip the permit. Yet the score maximum is computed at the stamp, the trip plan left with a friend is a permit field, and the register stores a permit number. *Start walking* also signs in "with its permit number". The loop in a day and its trap are M1a exit tests. | Compute the maximum at *Start walking*. Add a trailhead day-use trip-plan line. Show "day hike" in the register. Decide whether day hikes advance the 104 counter. |
| N4 | med | An overnight with no canister is undefined. 6.3 calls the canister "hard, legal", but 1.2 allows only three hard blocks. | Allow it: all the food "doesn't fit", so the visitor roll comes every night, along with a ranger card and Leave No Trace costs. Or add a fourth block. |
| N5 | med | The off-permit ranger visit is a shown % roll (3.7). The permit check is a Director Larry card capped at 1 a day and 2 a book (2.6, 8.4). If the cap is used up, does the ranger still come? | Make the off-permit roll forced and uncapped, playing the permit-check card when it hits. Cap only the Director's check on a legal night. |
| N6 | med | A night-roll ♦ uses the hypothermia curve directly (up to 90% fail), so "made it" can fall under 30%. 8.8 says the range is 30-99%, and the Words table and the three-band compass assume that. | State that physics-curve rolls skip the bands. Add a Words row under 30% and a two-band compass. |
| N7 | med | The score maximum's "fixed budgets" for Looks, wise choices and Leave No Trace acts are undefined. So are "likely sunset", camp points on layover nights, a citation on top of the Hard Way, and a replan whose new maximum is below the score. | Put the budgets in `rules/tuning.json` and give a worked maximum for one of the twelve fills. |
| N8 | med | Seed timing. E.8 keys every draw by the trip seed, but 3.1 and 4.6 key quotas by date and camp only. Try this trip again with new weather skips the desk, so does the permit re-roll? | Draw the seed at *Begin a new book*. Planning draws use it. Try this trip again copies the stamped permit. |
| N9 | low | Skill experience thresholds and the level cap are undefined (`simulation.md` says 0 to 5). | `rules/tuning.json`. |
| N10 | low | On a loop, a day hike's turnaround card can point the long way. | Offer the shortest way to the car. |
| N11 | low | Does the basin-or-crest fork fire when climbing out of the basin (Day 2 of the ↺ two-night basin fill)? | Fire only when the next segment is a way in. |
| N12 | low | 2.6 offers the swim "on a stop on the loop", but no page outside camp offers it. Decision 18's summary reads "overnight only" for every Larry moment, while 2.6 and T05 limit that to beer and the pre-roll. | Define the stop page. Change the summary to "beer and the pre-roll: overnight only" (it is the doc's wording, not a quote). |
| N13 | low | Event tag names disagree (6.5): `water_cap_l` vs `water_cap`, `sleep_rating_f` vs `sleep_rating`, `nav_kit` vs `nav`, `food_fits_can` vs `food_overflow`. | Keep one canonical list in the schema. |
| N14 | low | "Pack presets" in M1a's scope is undefined. | Probably the sensible and skimpy kits (B.5). Say so. |
| N15 | low | The screen wireframes use the Hoh (M2) trip. 12.14 makes camp at Elk Lake, which isn't on that plan. 12.2 and 12.13 put the braids (mile 8.0) after the Lewis Meadow (mile 10.4) ETA. | Re-base on B.2 or fix the times. |
| N16 | low | "Edition date" means both the build and the 2026-10-07 research. The 12-month window ends Oct 2027. | Tie it to the conditions overlay's date. |
| N17 | low | E.4's list of known data fixes will go stale as the parallel data cleanup lands (catalog journal notes, rental prices, Morgenroth notes). | Refresh it after that pass. |
| N18 | low | Does the lily's +0.02 layover bonus apply at a side-trip viewpoint? B.3 leaves it out. | Decide and state it. |
| N19 | low | A.7's "about 8%, 1 in 12": the parts sum to about 7.7%, which the rounding rule turns into 1 in 13 (M2). | Regenerate. |
| N20 | low | Can the Leave No Trace ledger go over 100 (+3 for packing out someone else's trash)? | Cap it at 100 or say it can go over. |
