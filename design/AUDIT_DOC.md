# Design doc audit before M1a

Audit of `design/GAME_DESIGN.md` on 2026-10-08, read end to end against "Decisions made", with the M1a numbers checked against `sol_duc_high_divide.json`. Nothing was committed. No game code was written.

**Result:** 14 issues fixed in the doc and 20 left open. Two open issues should be settled before M1a starts: N1 and N3. The rest can be settled during M1a, as long as each one is settled before the system it touches is built. All 42 internal anchors resolve. No retired idea is left as a live feature: every mention of the field guide, fox, helper animals, prologue, Read to me, Snowlamp, Perilous, a Hoh-first roadmap or Morgenroth as a planner camp is a stated denial. Hiker inheritance only appears in "a new hiker inherits nothing". Friends' names appear only as `{BOY_n}` placeholders.

*Closed the same day: all 20 open items are resolved in `GAME_DESIGN.md`, with the data check's doc-side items. See [Resolution](#resolution) at the end.*

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

## Resolution

Closed on 2026-10-08 by the lead designer, in `GAME_DESIGN.md` only. No data file was edited (the cleanup running alongside owns them), no game code was written, and nothing was committed. The engineering calls behind these fixes are recorded in the doc's new [Lead calls](GAME_DESIGN.md#lead-calls) section, right after "Decisions made", one line each, so the creator can overrule any of them. None contradicts a decision. After the edits, all 45 internal anchors resolve, every table has at most 4 columns, every wireframe line is at most 40 characters, and every JSON file under `design/data/` still parses.

| # | How it was closed | Where |
|---|---|---|
| N1 | Lead call 1. The *ask at the desk* request (a seeded roll, about 70% midweek and 40% on weekends) is in M1a for Bruce's Roost, Cat Basin and Hidden Lake, and Hidden Lake has a row in the camp table (2.3 mi ↺, 17.5 ↻, from the graph). Long Lake and Sol Duc Lake (off trail) and the Morgenroth call stay in M1b; in M1a their rows are pencil rows that can't be tapped. M1b's scope and cut list now name only those two, and M1a's cut list keeps every permitted camp (decision 17) | 3.1, 4.3, 15 |
| N2 | Lead call 3. A "What M1a shows and hides" table in 15: the WIC number, the counter card and their hotspot hidden until M1b; August and September chips only; the desk rows as in N1; the Skillet, Lodge and Second Growth chips hidden; the Bonfire Lily at weight 0; Walk out, trip codes and Share the Cover in M1b; Try this trip again and Print the permit at home shown; the `modes.storybook` override required on every `book_ends` from M1a, though the flag ships off. F.5's phone check now starts in M1b, and 11.7 and B.3 say which of their parts are M1b's | 15, F.5, 11.7, B.3 |
| N3 | Lead call 2. No permit; the score maximum is computed at *Start walking*; a day-use trip-plan line on the trailhead page, with its *back by* time, drives the overdue clock; the register shows *day hike*; day hikes never advance the 104 counter | 3, 3.1, 3.7, 9.6, 9.8, 12.6, 12.10, E.6 |
| N4 | Lead call 4. Allowed, and not a fourth hard block. 6.3 now says the park requires the canister; without one, all the food counts as not fitting, the visitor roll comes every night, and a ranger who checks adds a card. The Leave No Trace ledger gets a new line, food left out overnight -5 a night, on top of the -15 if wildlife gets it. The pitch now says "the bear canister the park requires", and the permit's canister field and the validator say going without is allowed | 1, 3.1, 4.6, 6.3, 9.6 |
| N5 | Lead call 5. The off-permit ranger is a forced roll every off-permit night, outside the cap, and it plays the permit-check card when it hits; the Director's cap covers only the check on a legal night. The Larry lint says the same | 2.6, 3.7, 8.4, F.3 |
| N6 | Lead call 6. Physics-curve rolls (the night roll, which is also the Cold chain's last step) have no shaky band and no 5-97 clamp: "made it" is 100 minus the curve's fail share. A new Words row covers below 30%, and the Why bar and the compass have two bands for them | 7.9, 8.1, 8.5, 8.7, 8.8 |
| N7 | Lead call 7. The budgets are defined, with starting values in `rules/tuning.json`: Looks 10 a trip day, wise choices 2 a day at 3 points, Leave No Trace acts 1 a day plus 1 a night at 2 points, and a likely sunset is a planned evening whose climatology is clear or partly cloudy at least half the time. The worked maximum, for the ↺ one-night crest fill, is 96, which matches B.6's pages. Layover nights earn no camp points; a citation and the Hard Way don't stack (10, not 5); a replan's maximum is the points earned plus what the new route can still earn, so it never drops below the score; side trips added on the trail don't raise the maximum. The other maxima (170, 131, 64, 120) are marked illustrative until the engine computes them | 3.1, 9.6 |
| N8 | Lead call 8. The trip seed is drawn at *Begin a new book*. Quotas are `hash(seed, date, camp)`, and desk requests, the WIC loan and Ranger Jon's dates are drawn on the same permit stream. *Try this trip again* copies the stamped permit under the next number, so nothing on it is rolled again | 3.1, 4.3, 4.6, 8.14, 9.7, 12.5, B.7, E.8 |
| N9 | Levels run 0 to 5 (`simulation.md`'s cap), with the thresholds in `rules/tuning.json` | 7.10 |
| N10 | The turnaround card points the shortest way to the car by hiking time, which on a loop past halfway is onward | 3.7 |
| N11 | The fork fires only when the hiker reaches the junction along the crest. Climbing out of the basin meets no fork at the top, nor at the other way in later that day | 7.4 |
| N12 | The stop page is defined: the Heart Lake landmark page on an overnight trip (passing by day, or walking up from a camp nearby), costing 30 to 60 minutes. For the summary, the conservative default replaced the suggested wording change: "Decisions made" is left as written, and the swim and the bold marmot follow its broadest reading, overnight only and never on a day hike or the walk-out day (2.6, 8.4, lint T05). This matches `BUILD_PLAN.md` 9.2's N12 default | 2.6, 8.4, F.3 |
| N13 | 6.5's table uses the canonical names (`water_cap`, `sleep_rating`, `nav`, `food_overflow`), and the schema keeps the one list | 6.5 |
| N14 | Pack presets are the ranger's sensible kit and B.5's skimpy kit, kept in `rules/kits.json` | 15 |
| N15 | The times were fixed rather than re-based: the braids at 1:35 pm (12.2), "River at 1:30 pm" (12.11) and the outcome at 2:05 pm (12.13), all before Lewis Meadow; the camp page moved from Elk Lake on Day 2 to Lewis Meadow on Day 1 at 3:20 pm (12.14); section 12's intro gives the Day 1 timeline | 12, 12.2, 12.11, 12.13, 12.14 |
| N16 | The edition date is the research date of the conditions overlay the build ships with, never the build day or the phone's clock; only a new overlay moves the 12-month window | 3.1, 4.7 |
| N17 | E.4 refreshed against the current data files (data check items 15 and 17, below) | E.4 |
| N18 | The layover bonus needs a second evening in the same place; a side-trip viewpoint seen once gets none, so B.3's 11% stands | 10.2, B.3 |
| N19 | Regenerated. On the old night figures the parts summed to 7.7% (1 in 13). With the catalog's night figures (item 5 below), A.6's share before the ice is 6.6%, and the parts now sum to 7.9%, which reads 1 in 12, the count the Outlook line already gave. The Bold bot's figure is 7.0%, 1 in 14 | A.7, F.1 |
| N20 | Capped at 100: the +3 only wins back points already lost | 9.6 |

**The data check's doc-side items** (`data/M1A_DATA_CHECK.md`):

| Item | How it was closed | Where |
|---|---|---|
| 5 · Night model vs the catalog | The catalog is authoritative, and 7.9 says so. It now reads each item's `warmth_bonus_f` (tents 4 to 8, the bivy 6, the emergency bivy 10, a space blanket 5, the tarp 2, a hammock -5, liners 4 and 8) and `wet_warmth_retained` (cotton 0 to 0.15, synthetics 0.3 to 0.7, wool 0.5 to 0.6, down 0.25). The old fixed figures are gone, and the doc's own defaults (pad steps, no bag, a damp bag, dinner, drink, beer) are named as tuning values. 7.9's example and 8.13's come out the same, because the solo tent is still 4, but 8.13 now says wet cotton keeps almost none of its warmth. In Appendix A the soaked hoodie is worth 0.2 °F instead of about 1, so the bagless night is comfortable at about 75 °F with a margin of -40 (it was 74 and -39), and it shows 42% shivering and 6.3% fatal (it was 41% and 6.1%). That moved A.2's look-ahead (6.6%; Elk Lake 5.0%), A.3's laps (6.9%) and neighbors (margin -19, 89%), A.5, A.6's table and bullets (keep pushing 6.6%, still 1 in 15; look for help 4.1%; Elk Lake 5.0%; the puffy and hat now need the emergency bivy to clear the -25 °F line), A.7, 9.5's table, 12.12, 12.17, D.16 and F.1. Appendices B and C are unchanged. Decision 1's "about 1 book in 15" still holds | 7.9, 8.13, 9.5, 12.12, 12.17, A, D.16, F.1 |
| 14 · 3.1 and 3.3 times | Confirmed already fixed: 11:25 am, 1:55 pm and 2:55 pm in 3.1, and "about 1:55 pm" in 3.3. The 7.4 formula reproduces them (Sol Duc Park is 5.44 h from an 8:30 start). No change | 3.1, 3.3 |
| 15 and 17 · E.4's list | Refreshed after reading the current files. Dropped: the Morgenroth "in person" bullet (the data now says phone only), and the fire-ban dates, the falls hazard, the rental prices and the catalog's book name, all fixed at the source. Kept every bullet that is still true, with corrections (the White Mountain loop is in `south_quinault_skok`, the Hoh's "WAG bags" are in four places, three Hamma Hamma trips have null days). Added the data check's open source items: the Bogachiel shortcut, group and stock sites, research ideas that predate the decisions, dated news in permanent fields, the shared Hoh Lake segment, the null segment fields and Aurora Creek, the plush fox, battery stats, the day kits, the climate inputs (which the parallel cleanup was adding as this list was written), `card_shelters`, the dark deck and `oh_q28`. The list says that cleanup may land some of them first | E.4 |
| 16 · "The High Divide crest" | Named: Heart Lake Junction camp (`heart_lake_junction`, 5,080 ft), the crest's one camp, where hazard `snowfield_high_divide` puts steep snow. Its 4.3 row now carries the ☆. 10.2 also notes that the research names no snowfield at Lunch Lake or Heart Lake, so those windows are the least certain, and marks the loop's lily places M1b | 4.3, 10.2 |

**Left as they are, on purpose:**
- The 13 code lines over 40 characters are the older formula and JSON blocks in 7.4, 7.8, 8.3, 8.5 and 8.8, not wireframes. The two 7.9 blocks that were rewritten now fit.
- `BUILD_PLAN.md` was not edited. Its 9.2 defaults match these calls, but its line saying N15, N17, N18 and N19 wait for their milestones is now out of date: all four are closed in the doc.
- The maxima other than B.6's 96 wait for the engine (9.6, F.4).

### Release check

Checked again on 2026-10-08, before the build, against the data cleanup as it landed. Every item above is closed, or deferred past M1a with a reason; none blocks M1a. The three "left as they are" items stand, with these follow-ups:
- `BUILD_PLAN.md` is now updated to match these calls: the M1a scope, the shows-and-hides list (its 3.6), the data now at the source, the `tuning.json` budgets, and a 9.2 with no open questions.
- E.4 and the doc's counts were refreshed once the cleanup landed: 217 gear items and 88 foods (1, 3.6, 4.1, 5.4, 6.1, 14.1, 14.3, E.5); the fixes now at the source are listed as such, and `quiz_locals.json` is in E.5. "Decisions made" is unchanged.
- The 13 long code lines stay as they are (formula and JSON blocks, not wireframes), and the illustrative maxima wait for the engine to compute them; neither blocks M1a.

All 52 internal links and anchors in the design files (`READY.md` included) resolve, every JSON file parses with Node, every table in the doc has at most 4 columns, and the Boyz appear only as `{BOY_n}` placeholders. The readiness note is `READY.md`.
