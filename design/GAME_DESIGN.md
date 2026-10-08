# Olympic Peninsula Hiker

*Master game design document for `FernForager/104-boyz`. The game's name is **Olympic Peninsula Hiker**, and **OP Hiker** where space is tight, such as the Home Screen label (decision 35). Status: design, with Session 1 of the build shipped: a title page with a chunky-pixel High Divide cover at `fernforager.github.io/104-boyz`.*

*Written 2026-10-08 and revised the same day for every decision you made, one at a time. Then revised again, the same day, for the new direction (decisions 21 to 35). Your decisions override anything older in this document or the proposals. They are listed, in your words, in [Decisions made](#decisions-made). The engineering calls the lead designer made follow them in [Lead calls](#lead-calls), each yours to overrule. What is still to come from you is in the last section.*

*The new direction, in one breath. No book framing and no crutches: a game that the people who hike, backpack and run in Olympic National Park can't put down, great on its own merits (decision 22). The frame is backpacking's own stuff: the map, the permit, the town run, the gear flat lay, splits on the trail and a trip report at the end (decision 26). Home is **Ranger Jon's old ranger cabin at Lake Quinault**, and the places in that scene are the menus (2.2, decision 34). The hot tub is a reward after a big hike. The 104 Boyz and the number 104 are easter eggs for insiders, never needed to enjoy the game.*

*What stays: the chunky Sierra pixels and palette, the engine, the park data, honest odds with the red diamond, permadeath and the death sequence, the Larry moments, the Bonfire Lily, the High Divide loop as the first playable, Lake Morgenroth off the menu, Ranger Jon with badge #104, and permit numbers that start with 104.*

*Still being written in: the three ways to play (Open, the Hike of the Day and FKT attempts, decisions 23 to 25 and 31), the eight minigames (29, 30), the sound (32, 33) and the text system (21). Until they land here, their drafts in `design/drafts/` (`daily_fkt.md`, `minigames.md`, `audio_text.md`) hold the detail. This document already gives them their places: the chalkboard, the peak and the camp tiles (2.2, 12.14).*

*Every line of in-game English in this document is a draft for you to rewrite or approve (decision 21). Lines written for this revision are marked (DRAFT). Real place names, real terms and verbatim public-domain quotes are not ours to write, but stay yours to veto.*

*This document merges the park research in `design/data/` with three proposals: `proposals/storybook.md` (feel, voice, art, screens), `proposals/simulation.md` (state, odds, consequences) and `proposals/engine.md` (data, engine, tools). This document wins wherever they differ. `storybook.md` is now a historical file: its book frame, narrator and title page are retired (decision 22), and nothing new cites it. The proposals also still describe other things you retired: the golden plant's old placeholder name "Snowlamp" (it is the **Bonfire Lily**), the old field guide, sketching for points, the prologue, the margin fox, animal helpers, a narrator pitched at children, Read to me, the stock EGA palette, preset epitaphs, character options, named companions, a fictional guide company and a roadmap that starts on the Hoh. None of them is in the game.*

> **Read this first (about 10 minutes on a phone):**
> 1. [The one-page pitch](#1-one-page-pitch)
> 2. [Home: the old ranger cabin at Lake Quinault](#22-home-the-old-ranger-cabin-at-lake-quinault): where every trip starts and ends
> 3. [Decisions made](#decisions-made), [the lead calls](#lead-calls) and [still to come from you](#still-to-come-from-you): the last three sections
> 4. [The first trip](#36-the-first-trip): what a new player meets, on the High Divide loop
> 5. The first playable, worked through: [Appendix B](#appendix-b-seven-lakes-and-the-high-divide-planned-well): the loop both ways round, the basin or the crest, and [the fork where you choose](#b6-the-other-way-round-the-fork-at-the-rim) (B.6)
> 6. [Larry moments](#26-larry-moments-pg-13): the PG-13 part, with beer and weed in (your call)
>
> **With 20 more minutes:** [player experience](#2-player-experience-and-tone), [the core loop](#3-core-loop), [the build roadmap](#15-build-roadmap), and your Olympus example from day one, how it ends and how often it ends for good: [A.5 to A.7](#a5-the-ending). Everything else is reference; the engineering detail lives in Appendices E and F.

---

## Contents

1. [One-page pitch](#1-one-page-pitch)
2. [Player experience and tone](#2-player-experience-and-tone), with [home: the cabin](#22-home-the-old-ranger-cabin-at-lake-quinault)
3. [Core loop](#3-core-loop)
4. [The park in the game](#4-the-park-in-the-game)
5. [The three stores and food](#5-the-three-stores-and-food)
6. [Packing: the flat lay](#6-packing-the-flat-lay)
7. [Simulation](#7-simulation)
8. [Decisions and odds](#8-decisions-and-odds)
9. [Consequences, modes and scoring](#9-consequences-modes-and-scoring)
10. [The homage: art style and the Bonfire Lily](#10-the-homage-art-style-and-the-bonfire-lily)
11. [Art direction and the scene system](#11-art-direction-and-the-scene-system)
12. [iPhone screens](#12-iphone-screens)
13. [Audio](#13-audio)
14. [Content plan and volume targets](#14-content-plan-and-volume-targets)
15. [Build roadmap](#15-build-roadmap)
16. [Risks](#16-risks)
- [Appendix A: Olympus in one night with day gear](#appendix-a-olympus-in-one-night-with-day-gear) (M2)
- [Appendix B: Seven Lakes and the High Divide, planned well](#appendix-b-seven-lakes-and-the-high-divide-planned-well) (the first playable: start here)
- [Appendix C: The coast tide mistake](#appendix-c-the-coast-tide-mistake) (M4)
- [Appendix D: Sample screens](#appendix-d-sample-screens)
- [Appendix E: Tech architecture and data files](#appendix-e-tech-architecture-and-data-files)
- [Appendix F: Balancing and testing](#appendix-f-balancing-and-testing)
- [Sources for this document](#sources-for-this-document)
- [Decisions made](#decisions-made)
- [Lead calls](#lead-calls)
- [Still to come from you](#still-to-come-from-you)

---

## 1. One-page pitch

**Olympic Peninsula Hiker is a backpacking game set in the real Olympic National Park, for the people who hike, backpack and run there.** It began as *Oregon Trail* meets *King's Quest*, with a dash of *Leisure Suit Larry* (decisions 1 and 18). Your touchstones since then add more, and the blend is its own (decision 22: *"it's also entirely its own blend"*):

- **Oregon Trail** for the outfitting and the odds. You plan a real trip, buy the food, lay out your gear and drive to the trailhead, and what you packed decides how the trip goes. Hazards come with honest numbers, and a hiker can die of very ordinary things.
- **King's Quest** for the look and the manners. Every stop on the trail is a chunky Sierra picture on top and a few words in a Sierra message box below. Tap the picture to Look. You never walk a character around.
- **Leisure Suit Larry**, a dash, for the cheek: Sierra's own 1987 comedy. A few PG-13 moments with a pixel censor bar (a snowmelt skinny dip, a beer at a lake, a joint where federal law says no), each with real stakes in the simulation (2.6).
- **1000 Heroz** for the daily one-shot. The **Hike of the Day** is the same route and the same real forecast for everyone, one attempt, timed (decisions 23, 24, 31).
- **Suika Game** for the signature minigame: packing the bear can, round things that squish and merge (decision 30).
- **Lonely Mountains: Downhill** for the sound and the speed. No music on the trail, only the place and your footsteps (decision 32). FKT attempts run the big routes against the clock, with splits (decision 23).
- **Sword & Sworcery** for the real clock. The cabin at home shows Lake Quinault's real season, light, weather and moon (2.2).
- **The real Olympics** for everything else. Real trails, camps, rivers, quotas, tides and closures in Olympic National Park, from researched park data.

**The frame is backpacking's own stuff, for the hardcore crowd and the moss crowd alike** (decision 26). The map on the cabin table, the permit you print, the run to the three stores in Port Angeles, and the **gear flat lay**: everything laid out top-down on the deck boards, the pre-trip photo backpackers post. It is the packing screen, and you can share it (6.1). On the trail you get splits; at the end, a trip report (9.7).

**How it looks.** Sierra technique, our own colors. Chunky 160x168 pictures drawn the AGI way, as vector lines, flood fills and checkerboard dithers, in a custom 16-color palette inspired by the flat, layered shapes of Benjamin Flouw's picture book *The Golden Glow*: layered ridges, stacked-tier conifers, flat fills (11.1). The words sit in a snow-white Sierra message box with a double brick-red border, under a `Score: 0 of 131` status line.

**How it reads.** Deadpan, dry but kind, written for adults (decision 5). There is no narrator character any more (decision 22). The recommended voice is terse second person, present tense, in the Sierra box, and the hiker's own first-person log is the record that becomes the trip report (2.3). Animals never talk and never help. They are wildlife: lovely to watch, sometimes in the way, and very interested in your lunch. Somewhere high in the park, on snow, after dark, there is a rare golden flower that most players will never see. The game never advertises it (10.2).

**How you play an Open trip.**
- **Sign** the guest book at the cabin with your hiker's name. That's the whole character sheet: every hiker starts the same (12.4).
- **Plan** at the cabin's map table: where to go, which way round a loop, day hike or how many nights, a layover day or a new camp each night, the basin or the crest. **Print** your own permit, as real Olympic hikers do (3.1).
- **Go to town** the day before: Port Angeles, with the Wilderness Information Center (optional: a briefing, the free loaner can, the camps you can only ask for at the desk) and **three stores**, in the spirit of Swain's, Brown's Outdoor and MOSS (decision 27, 5.2).
- **Lay it out**: the flat lay at the shed. Everything must fit: liters, pounds, a few outside straps, and the bear canister the park requires, which limits your food days (6).
- **Drive** from the cabin to the trailhead, and take a last look at the tailgate at what to leave in the car.
- **Hike**, stop by stop. About 3 to 5 real decisions a day. Camp, cook, watch the light change, sleep, wake up.
- **Come home** to the cabin: the trip report, and after a big hike, the hot tub (2.2).

**Three ways to play** (decisions 23 to 25). **Open** is the career: plan any hike, with one hiker who carries on from trip to trip until they die, Old School. **The Hike of the Day** gives everyone the same route and today's real forecast, one shot, scored on time; it uses a fresh standard hiker, and a death there is a DNF that breaks your streak but never touches your Open hiker. **FKT attempts** race the big routes. Their full rules are being written in (see the note at the top).

**Decisions with honest odds.** Every risky choice shows the chance it goes all right: `Wade across now  83%`. Tap the small (i) beside it to see why: the river's depth at this hour, the poles you packed (+10), the tent strapped outside (-3). Choices that could turn serious get a red diamond, the chance it goes badly in red (`Climb the ladder ♦ 79% · 21% fall`), a confirming tap and a short compass roll. When a choice could kill the hiker, its **fatal share** shows in red too (`21% fall · 0.3% fatal`, always rounded up), and no setting hides it. If you lack knowledge (no tide table, no forecast), the number blurs into a range, and a fatal share shows the worst end of it, so knowing things matters as much as carrying things.

**Consequences: hard, final and fair.** This is an old-school game. The hiker can die, and death is final: no Restore, no going back. But planning is what keeps you alive. Plan well and it is as easy and lovely as backpacking: sensible trips in season finish happily at least 95% of the time (at least 85% in the shoulder season), and end in death at most 1 time in 200 (the model says far less).

A hiker can die only at a red-diamond choice that showed its fatal share, or after two warnings you walked past, and every such moment offers a sure way out that costs time, comfort or score, never the hiker. Try Mount Olympus in one night with day-hike gear and keep pushing, and you will have a problem: trouble or worse nearly every time (the target is at least 80%), and about 1 trip in 15 ends in death on the mountain (A.6). Take the turnaround the game offers, and almost nobody dies.

When a hiker dies, the game says so the old way: **YOU PERISHED** in big blocky letters, a one-line Oregon Trail cause (*You have died of cotton.*), then the hiker's bones and pack crumbling to dust under the words *Leave No Trace*. You type an epitaph, or tap the dice for a line from the early accounts of the park's first explorers, and it goes into the Trail Register, our version of Oregon Trail's tombstones and Top Ten. Then you are back at the cabin, at dusk, where the hiker's trip reports go to dust too. That register line is all that survives: the hiker, their skills and their stories are gone, and the next hiker starts from nothing. (A gentle no-death mode waits in the engine, hidden, in case you ever want it, 9.4.)

**The park.** Six researched regions join into one trail network: 449 places, about 450 trail segments and 150 classic trips (a seventh, the Hamma Hamma, has just arrived, 4.1). Version 1.0 plays the three must-haves: Seven Lakes Basin and the High Divide (the first playable), Mount Olympus with every camp on the Hoh, and Royal Basin. The park map on the cabin's table always shows the whole park; valleys not yet built are pencil sketches until they arrive (milestones M4 and M5).

**Mount Olympus itself.** The summit means crossing the Blue Glacier. Hire **Ranger Jon**, badge #104, the only guide in the game (a ranger who guides on his days off: a playful liberty, since real rangers don't guide climbs), and he ropes you up. Or go alone, at your own risk: every crevasse crossing is a ♦ with its honest fatal share, and turning back is always offered (4.2).

**Solo, with company on the trail.** You hike alone. Other hikers pass by, and now and then one of them is one of **the 104 Boyz**: a tip, a trade or a warning, and then they're gone. To a stranger they are just other hikers with names. They are also in the Trail Register before you, each with a fictional, good-natured death and a funny epitaph (your call), and the game never explains how you keep meeting them (7.11). They are easter eggs, like everything else about the Boyz and 104 (2.2).

**Lots of outcomes.** About 217 gear items and 88 foods become about 40 event tags. Every card reads those tags, the place, the weather, the hour and what already happened. Version 1.0 has about 260 hand-written cards with about 730 choices, and their combinations make nearly every multi-night trip tell its own story (8.12). A test harness proves each item matters somewhere.

**Built simply.** Plain HTML, CSS and JavaScript modules with a canvas picture: no framework, no bundler, only a small data build step. Hosted free on GitHub Pages at `fernforager.github.io/104-boyz`, installable to the Home Screen as OP Hiker, playable offline at the trailhead, portrait and touch only.

**First playable: the High Divide and Seven Lakes Basin loop** (your calls: *"Gotta be B only because I know that hike"*, then *"The first one should just be High Divide and the 7 Lakes Basin loop either direction and option if drop into basin or stay high I mean every choice needs to be made"*). The vertical slice (M1a) is the whole loop from the Sol Duc trailhead, clockwise or counterclockwise, as a day hike or one to three nights or more, with layovers, at any permitted camp on or just off it. Every route choice is yours, at the map table and on the trail: the direction, each night, the basin or the crest at a fork card with honest numbers, the side trips, and changing your mind with real permit consequences (4.3). Then the whole Sol Duc side (M1b), with your favorite spot, **Lake Morgenroth**, kept off the menu: no list or preset offers it, and the only way in is to call the WIC (4.3). The Hoh, Glacier Meadows and Mount Olympus with Ranger Jon come next (M2), and Royal Basin completes version 1.0 (M3).

### 1.1 What a play session looks like

A **first trip** reaches the trail within about 7 minutes of opening the game (3.6). A returning player spends 4 to 8 minutes planning, in town and at the flat lay ("Fill from the list" and "Like last time" keep it quick), then 5 to 7 minutes per hiking day, evening included (8.4). A two-night trip has three hiking days, so it is a 20 to 30 minute trip (your call, confirmed 2026-10-08). The Hike of the Day is shorter: most days it is a day hike with no town run.

Every stop autosaves, so a phone call never loses anything, and nothing ever goes back: what happened, happened.

### 1.2 Calls this document makes

Where the three proposals disagreed, these are the calls. The reasoning is in the proposals; you can overrule any of them. The ones marked as yours are your decisions, listed in your words in [Decisions made](#decisions-made).

- **The pitch: its own blend** (yours: decision 1, *"your line about plays like nails it"*; decision 18, the dash of *Larry*; then decision 22, *"It's 1000 heroz it's suica game it's kings quest it's Oregon trail but it's also entirely its own blend"*). *Oregon Trail* meets *King's Quest*, with a dash of *Leisure Suit Larry*, in the real Olympics, plus a daily one-shot, a Suika-style can, a soundscape with no trail music and a home on the real clock.
- **No book framing** (yours, decision 22). No bookshelf, books, chapters, pages, volumes, back cover, "picture-book" or storybook narrator. A trip is a trip, and its record is a trip report (2.2, 9.7).
- **The frame is backpacking's own stuff** (yours, decision 26): the map, the permit, the town run, the flat lay, splits on the trail and a trip report at the end. The flat lay is the signature screen, and it is shareable (6.1, 6.10).
- **Home: Ranger Jon's old ranger cabin at Lake Quinault** (yours, decision 34, which revises 28). The places in the scene are the menus, on Lake Quinault's real clock. The hot tub is lit only after a big hike (2.2).
- **Near-universal** (yours, decision 34: *"I am making this game for the 104 boyz but I want it to also be near universal"*). The Boyz, 104 and the inside jokes are easter eggs that reward insiders, and a stranger never needs them (2.2).
- **The name: Olympic Peninsula Hiker, OP Hiker for short** (yours, decision 35).
- **PG-13, with beer and weed** (yours, 2026-10-08: *"Pg 13 but beer and weed."*). Cheeky innuendo and a pixel censor bar, never anything explicit, in the same deadpan voice. Beer and cannabis are in, with honest consequences in the simulation, and never anywhere near a car (2.6). Every Larry moment carries the `larry` tag, and `flags.larry` is on in every v1 build, main and preview.
- **Old School** (your decision, 2026-10-08). Death is possible and final, and it plays as one short **death sequence** (your design, the same day): the death box with its Ranger's Note, *YOU PERISHED* with an Oregon Trail cause of death, the remains turning to dust (*Leave No Trace*), an epitaph for the Trail Register, then GAME OVER (9.5, 12.17). It is the rule of Open play, the career. In the Hike of the Day a death is a DNF on a fresh standard hiker, and the Open hiker is untouched (yours, decisions 24 and 25).
- **The gentle mode: kept, but hidden** (yours, 2026-10-08: *"C but don't release that shelf yet hide it"*). The no-death mode stays in the engine, with its own hikers, never in the Trail Register or Best trips. No v1 screen, setting or line mentions it; it sits behind an internal flag, off in every build you can install, until you decide to release it (9.4). Code and data call the modes `oldschool` and `gentle` (its old name, Storybook, is retired with the book, decision 22; the older key `sierra` stays retired, so a real company's name never reaches a button).
- **Fair deaths only:** a hiker can die only at a ♦ choice that showed its fatal share, or at the end of a crisis chain after two warnings the player walked past; never on a random draw. Every such moment offers a sure way out (9.5).
- **What survives a death:** only the hiker's line in the Trail Register: name, epitaph, cause, dates and score (no tombstone in the park: Leave No Trace). The hiker, their skills, their trip reports, the career marks at the cabin and anything they collected are gone, and the next hiker inherits nothing (yours, 2026-10-08: *"Full wipe"*; 9.8). While a hiker lives, they carry on from trip to trip: skills grow, and their trip reports pile up by the fire bowl.
- **One hiker, one trip at a time:** a phone has one living Open hiker, and that hiker has one trip in progress at most, so no hiker is ever alive on one trip and dead on another (9.8). The Hike of the Day's fresh hiker never touches them.
- **The hiker: a name, nothing else** (yours: *"less is more"*). You sign a name in the guest book, and every hiker starts the same: no backgrounds, occupations, pronouns, fitness level, jacket color or glacier-course box (12.4).
- **The epitaph: type your own or roll the dice** (yours: *"Write your own or tap random"*). Up to 40 characters of your own, or a dice button that draws a short line from the public-domain accounts of the park's first explorers and the 1890 newspapers that printed their story (the 1889-90 Press Expedition, Lt. Joseph O'Neil, other pre-1931 texts), preferring lines that suit the cause of death, or skip. You asked for a random Robert Wood sentence: Wood's books are the backbone of the game's history, but they are still in copyright, so his sentences are not quoted; he is credited in Credits and on the **Ranger's Bookshelf**, a real shelf of his books inside the cabin door (9.5, 12.20).
- **Score:** one KQ-style `Score: N of M`, with M computed for the itinerary. No spirits multiplier; low spirits instead switch off some joys ("too cold to stay up for the sunset").
- **Odds:** every rolled choice shows the chance it goes all right ("made it"). Choices that can reach Serious or worse get a ♦, the fail share in red, a confirming tap and the compass roll; a ♦ that can kill adds its fatal share, which no setting hides (yours: *"A for sure"*). Safe choices show costs, never a %. Missing knowledge shows an honest range, and a fatal share shows the worst end of it, always rounded up (8.1, 8.6-8.8).
- **Meters:** seven simulated, four shown as plain conditions, plus a Wet or Thirsty glyph when it matters.
- **Endings come from crisis cards the player saw**, never from a count of bad conditions. Two bad conditions only prompt a ranger-voice nudge.
- **Voice: deadpan Sierra, with no narrator character** (yours: decision 5, dry but kind, written for adults; decision 22, no storybook narrator). Three ways to carry it are laid out in 2.3, and the recommendation is terse second person, present tense, in the Sierra box, with the hiker's first-person log as the record. Look boxes keep Sierra's second person. Deaths get the same voice (9.5). A long line continues in a second box (▾) and never scrolls. There is no spoken narration: Read to me is cut (yours), and VoiceOver reads the real HTML text (11.9). The words themselves are yours (decision 21).
- **Animals never talk, and they never help** (yours). They are wildlife: beautiful moments, hazards and food thieves. The voice may say what an animal seems to be doing, sparingly (2.3, 7.11).
- **The homage, trimmed** (yours: *"Yes do all of that"*). *The Golden Glow* survives as three things only: the art-style inspiration, the Bonfire Lily and a credit line (10). There is no field guide to fill, no sketching for points, no prologue, no fox and no animal helpers.
- **Art: Sierra pixels in our own 16 colors** (yours: *"I love B I love chunky pixels"*). Low-res vector lines, flood fills and checkerboard dithers, in a custom palette inspired by *The Golden Glow*'s flat, layered shapes instead of the stock EGA colors. Gold is kept for the Bonfire Lily (11.1).
- **The plant** is called **the Bonfire Lily** (your name for it, 2026-10-08), never "golden glow" in the game. It is a rare hidden find and a bragging right, not the point of the game: nothing advertises it, it is worth no points, and the only ledger it touches is Leave No Trace, when you choose to sketch it or pick it (10.2).
- **No restore, in any mode.** No going back, no Back to Last Camp, no Restart Trip. Every stop autosaves, an error never rolls back a choice, and an imported save can't be older than the game's record of that trip or bring back a dead hiker. Rolls are keyed to content and to the mode, so the same choice in the same place repeats its result, and a gentle-mode trip can never scout an Old School one (8.14, E.6).
- **Physics lives in one place:** fords from the river model, headlands from the tide margin, freezing levels from measured soundings, tides from NOAA La Push predictions.
- **Park conditions** (yours, confirmed 2026-10-08): the real 2026 conditions by default ("As researched (Oct 2026)"), and "Timeless" one tap away. A trip falls in the 12 months after the conditions date, and dated closures apply only on their dates (4.7).
- **Session length** (yours, confirmed): about 20 to 30 minutes for a two-night trip, about 7 minutes to the trail on a first trip, and 5 to 7 minutes per hiking day (1.1, 3.5).
- **Rules can be broken**, with gentle ranger cards, Leave No Trace costs and wildlife consequences. **Only three hard blocks:** a pack that won't close, a load you can't lift (over about 60% of body weight), and routing through a closed trail.
- **Money:** prices and a receipt are shown, with no budget. Because there is no budget, the three stores differ in kind, not only in price (5.2). The Shoestring wallet comes later (M6).
- **Gear comes from** the shed at the cabin, the WIC's loaner canister and the three stores in Port Angeles (rent or buy at the gear shop). For Olympus you can also hire Ranger Jon.
- **Three stores in Port Angeles** (yours, decision 27): a general store in the spirit of Swain's (cheap, heavy, bombproof), a gear shop in the spirit of Brown's Outdoor (light, technical, pricey, sometimes fragile) and a boutique in the spirit of MOSS (Pacific Northwest style and morale). Their in-game names are fictional and yours to write: `{STORE_GENERAL}`, `{STORE_GEAR}` and `{STORE_BOUTIQUE}` until then (5.2).
- **Party: solo** (yours). The **104 Boyz** are cameos only: other hikers you meet on the trail (a tip, a trade, a warning) and pre-filled entries in the Trail Register, plus, at the cabin, friends around on summer weekends (2.2). Their names and quirks are still to come from you (7.11). There are no companions in v1. The engine keeps party support, but no milestone promises companions.
- **The Boyz in the register** (yours, 2026-10-08: *"A"*, decision 19): pre-filled *Remembered* entries with **fictional misadventure deaths and funny epitaphs**, good-natured and never mean. You still meet the same Boyz alive on the trail, and the game never explains it (7.11). The repo is public, so the game uses first names or nicknames unless you confirm the friends are fine with full names ([still to come](#still-to-come-from-you)).
- **Mount Olympus: Ranger Jon, or alone** (yours). The only guide you can hire is **Ranger Jon**, a ranger moonlighting as a guide (a playful liberty: real rangers don't guide climbs), who wears badge #104; his quirk is still to come from you. Or go alone at your own risk: each crevasse crossing is a ♦ with its honest fatal share, and turning back is always offered (4.2).
- **The 104 wink** (yours): every wilderness permit number starts with 104 (`Permit No. 104-0037`), and Ranger Jon wears badge #104 (12.6).
- **Bug reports** (yours: *"A, no Mac"*): a **Copy bug report** button in a hidden debug menu. You have no Mac, so the testing plan never needs Safari's Web Inspector (E.11, F.5).
- **Hosting** (yours, set up 2026-10-08): the repo `FernForager/104-boyz` is public, and GitHub Pages deploys it from GitHub Actions, so the game lives at `fernforager.github.io/104-boyz` (E.9).
- **Trip date:** you pick it; the planner suggests the destination's best month; October is allowed with warnings.
- **Sound:** on after the first tap, in an "ambient" audio session so the silent switch mutes it. No music on the trail (yours, decision 32).
- **Data:** `gear_catalog.json` names and stats are authoritative (for example `daypack_28`).
- **First playable: the High Divide and Seven Lakes Basin loop** (yours: *"Gotta be B only because I know that hike"*, then, 2026-10-08, *"The first one should just be High Divide and the 7 Lakes Basin loop either direction"*). The vertical slice ships the whole loop, both directions, as a day or one to three nights or more, with the basin-or-crest fork and every other route choice left to the player (4.3, 15). The Hoh, Glacier Meadows and Mount Olympus with Ranger Jon come after. Appendix B is the primary worked example.
- **Lake Morgenroth is off the menu** (yours: *"Morgenroth shouldn't be the trip it's an off menu gotta call"*). It is never in the camp list, a preset, a fill or a first trip. The only way to camp there is the hidden phone call to the WIC, from the cabin's phone while you plan. It stays a hand-drawn signature scene, reached by a primitive but findable way trail, and it arrives in M1b, after the slice (4.3, 12.5).

---

## 2. Player experience and tone

### 2.1 Three feelings, in order

1. **Home, on the real clock.** An old ranger cabin at Lake Quinault, in today's light and weather. Every trip starts there and ends there. Nothing is timed; the trail waits for you.
2. **The night before, Oregon Trail style.** What backpackers actually do: spread the map on the table, print the permit, make the town run, fight the bear canister for space, and lay everything out on the deck to decide whether the camp chair is worth a pound.
3. **A dungeon crawl, old-school rules.** Out on the trail, the mountain asks questions your pack has to answer. A river with no bridge. A ladder at dusk. A headland and a rising tide. A cold, clear night at 4,300 feet. Each answer comes from what you packed, what you know and what you choose, and a bad enough answer, chosen with the odds in plain view, can kill the hiker.

### 2.2 Home: the old ranger cabin at Lake Quinault

*Decisions 22, 26, 34 and 35. The full draft behind this section, with every screen, is `design/drafts/frame_home.md`. The art brief is 11.11.*

#### What it is

Home is **Ranger Jon's old ranger cabin at Lake Quinault**, on the wet southwest side of the park (decision 34). You have the keys. Every trip starts and ends there: you plan at its table, keep your gear in its shed, drive out from its lawn and come home to its porch.

**The game never tells a backstory.** The place does it instead: a flat ranger's hat on a peg, badge #104 on a nail, a guest book with older handwriting than yours. Everyone understands a cabin, so a stranger is at home in the first second. A player who has met Ranger Jon on Olympus (4.2) can put it together. An insider sees whose cabin it was at once.

**The cabin stays generic.** It reads as any old ranger cabin: no sign, no address, no road name and no shoreline that would place it. Its sun and weather are computed for the center of the lake, never for a real building's position. It is drawn from a written description of your photos, never from the photos, and no photo enters the repo (11.11).

**The geography is honest.** Port Angeles, with the WIC and the three stores, is about three hours from Quinault by road, and Forks about one hour ([NPS, Visiting Quinault](https://www.nps.gov/olym/planyourvisit/visiting-quinault.htm)). The Sol Duc trailhead is 69 minutes past Forks in the region data, so the first playable's drive is about 2 hours 10 minutes from the cabin.

- **The town run is the whole day before.** It costs no trip time (3.1).
- **The departure-morning drive sets Day 1's start** (3.3). Leave at 6:15 and you are at the Sol Duc trailhead at about 8:25.
- **The Quinault WIC is closed for 2026** (`south_quinault_skok.json`), so the game's WIC is the one in Port Angeles.

#### The places are the menus

| Place | A tap opens | What changes it |
|---|---|---|
| **The screen door** | Plan an Open trip: the map table and the permit (3.1) | The printed permit pinned to the door |
| **The chalkboard** by the steps | The Hike of the Day | Today's route in chalk, the weather in chalk marks, your time, the streak in tally marks |
| **The peak** above the trees | FKT attempts on the big routes | The snow line follows the season; alpenglow at dusk |
| **The shed** | Your gear, then the flat lay (6.1) | The door open after a town run; a plank sign on its wall for each route you finish |
| **The car** | Drive: to town, or to the trailhead once packed | Grocery bags on the seat after town; the pack in the back |
| **The fire bowl** | Stories: your trip reports and photos, and the hiker's card | Lit on homecoming evenings; ashes otherwise; a cap of snow in winter |
| **The register post** at the lawn's edge | The Trail Register (9.8) | A fresh pencil mark when a line is added |
| **The mailbox** | Settings, Credits, the Ranger's Bookshelf, Export and Import | The flag goes up when an update arrives |
| **The hot tub** | The soak, only after a big hike | Covered and cold otherwise, and then only a Look |
| **The guest book** on the porch table | Sign in a new hiker | Open on the first launch and after a death |

The chalkboard and the peak belong to the Hike of the Day and FKT attempts (decisions 23 to 25), whose rules are being written in. Here they only get their places.

**How the places behave:**

- **One tap goes there.** A long-press shows the place's name.
- **Labels fade as you learn.** Each place shows its name until you have used it once, then a small dot.
- **Everything is also a button.** A big **next-step button** and a **porch rail** of buttons under the picture repeat every place, so nobody has to hunt, and VoiceOver reads them. The picture has alt text, as every picture does (11.9).
- **Hit areas are at least 44 pt** (12.1), wider than the art where they need to be. When two overlap, the nearest center wins.
- **Things that do nothing only answer a Look:** the badge, the hat, the mole hills, the chairs, the maples, the dog. No function ever hides in a Look.

**The next-step button** always names what the current trip needs next (all wording DRAFT):

| Where you are | The button |
|---|---|
| A hiker with no plan | Plan a trip |
| A plan drafted | Print the permit |
| Permit printed, overnight | Drive to town |
| Back from town, or a day hike planned | Lay out your gear |
| Packed | Leave in the morning (time chips show the arrival) |
| A trip in progress | No home: the app opens on the trail |
| Just home | Read the trip report, then the tub if it glows |

When the button is idle and today's hike is unplayed, a second line offers the Hike of the Day. Going back is free until *Start walking* (3). After that, nothing goes back.

#### A live scene, on Lake Quinault's clock

The cabin runs on Lake Quinault's own clock, the way *Sword & Sworcery* syncs its moon to the real one ([Wikipedia](https://en.wikipedia.org/wiki/Superbrothers:_Sword_%26_Sworcery_EP)). Open the game at six in the morning and it is dawn at the cabin. On a rainy Quinault night, it rains on the roof.

- **Pacific time, always.** A player in New York at 10 pm sees the cabin at 7 pm. Sunrise and sunset come from a small sun function for the lake's center.
- **The time of day uses the existing remaps** (11.4): Day, Dusk, Blue hour and Night. Dawn borrows the Dusk table, so the peak goes pink in the morning too.
- **The season follows the art brief's table** (11.11): bare mossy maples in spring, full leaf in summer, sage and cream leaves in autumn, snow in winter when the forecast says snow.
- **The weather comes from the same scheduled build that bakes the Hike of the Day's forecast** (decision 31). It also bakes one for the lake, from api.weather.gov, which asks every app for a User-Agent ([NWS API docs](https://www.weather.gov/documentation/services-web-api)). The forecast's words pick an overlay: clear, cloudy, rain, fog or snow. Offline, or with a forecast more than two days old, the cabin falls back on the month's climatology.
- **The moon is the real phase,** worked out from the date.
- **One exception: coming home.** The homecoming shows the trip's own return time and season, then fades back to now.

Opening the game becomes a small ritual, and it keeps the daily honest: today at the cabin is today's Hike of the Day. The cost is one sun function, one table and one small file the daily build already writes.

#### What you've done shows

| Kind | What you see | When |
|---|---|---|
| This trip | The permit pinned to the screen door | Printed |
| This trip | Grocery bags on the porch steps | Back from town |
| This trip | A tiny flat lay on the deck boards | Laid out |
| This trip | The pack leaning on the car | Packed |
| The hiker | Plank route signs on the shed wall, up to six | Each new route finished |
| The hiker | Tally marks on the chalkboard | The daily streak |
| The hiker | A race bib on a porch post | An FKT record |
| The hiker | A gold sketch in the arched gable window | The Bonfire Lily, found and left |

**The lily's sketch is allowed to be gold.** It is the lily's own mark, the one place outside the lily itself where gold may appear (11.1). Nobody who hasn't found the lily ever sees it, so the cabin never advertises the flower. **The full wipe takes every career mark** (9.8).

#### Coming home

1. **The car at the trailhead.** A stamp names the ending, with the last split and the trail hours (9.3, 12.22).
2. **The drive home.** One screen, with an optional stop for pie (3.3).
3. **The cabin at the trip's own arrival time and season.** The car pulls in. The fire bowl is lit if it's evening.
4. **The trip report opens** (9.7). Share it or don't.
5. **The porch.** After a big hike, the tub's cover is off and steam rises, and the next-step button says so. Tap the tub for the soak (12.24). It waits for you until your next trip leaves.
6. **Then the cabin catches up to the real now,** with a slow cross-fade.

Nothing on the way home asks you to type. The trip report's title is picked from three, not written.

#### The hot tub: a reward after a big hike

The tub is **a reward, not the home and not the frame** (decision 34, revising 28): a green inflatable tub on a small low deck at the porch's right corner. It is covered and cold until you come home from a big hike.

**What "big" means (proposed).** A trip is big when the hiker comes home alive having done one of these:

- walked at least **8 trail hours**,
- summited Mount Olympus, or
- finished an FKT attempt.

**Trail hours = miles / 2.4 + feet climbed / 1,300.** That is the base of the movement formula (7.4) at Regular pace, without its load, pace or weather terms, summed over what was actually walked. Side trips count, and so does a walk that turned back. So the number measures the hike, not the hiker, and it is the same for everyone. The trip report shows it.

| Trip (region data) | Miles · climb | Trail hours | Big? |
|---|---|---|---|
| Sol Duc Falls | 1.6 · 260 ft | 0.9 | No |
| Deer Lake overnight | 7.4 · 1,950 ft | 4.6 | No |
| Mink Lake and the Little Divide | 13.6 · 2,920 ft | 7.9 | Just no |
| Lunch Lake, out and back | 15.6 · 4,130 ft | 9.7 | Yes |
| The High Divide loop, either way | 18.4 · 4,400 ft | 11.1 | Yes |
| Olympus Guard Station and back | 18.2 · 813 ft | 8.2 | Yes |
| The Blue Glacier classic | 37.8 · 5,906 ft | 20.3 | Yes |

- **Every finished High Divide loop gets the tub,** so the first playable's reward is there for anyone who finishes it.
- **A rescue or a turnaround counts what you actually walked.** A death gets no tub.
- **The Hike of the Day uses the same rule.**
- **Why 8 hours:** it splits the Sol Duc side's classic trips cleanly into walks and real days out. The number lives in `rules/tuning.json`.

**The soak** (12.24) is a full scene with no chrome: night, stars, the real moon, steam off the tub, and a floating thermometer at 104°F, the usual safe maximum for hot tub water ([CPSC](https://www.cpsc.gov/content/cpsc-warns-of-hot-tub-temperatures)). The cabin's music plays, since music belongs at home and at key moments (decision 32). The trip's best three to five moments come back from the log, one at a time, picked by the same weights that pick the day headlines (9.7). When the crew is around, they are in the tub too, and each gets one line (`{BOY_n_TUB}`, yours to write). You can get out any time, and the share card is offered once, at the end.

**No drink in the tub by default.** No drink ever shows in the cabin scene, because the car is in it (lint T05). The soak has no car in frame, so a can on the tub's edge would pass the lint; that is your call ([still to come](#still-to-come-from-you)).

#### After a death

- **The five death screens stay exactly as approved** (9.5, 12.17): the death box, YOU PERISHED, Leave No Trace, the epitaph and GAME OVER.
- **Then back to the cabin, at dusk** (12.25). The porch light is on and one Adirondack chair is empty. The tub is covered and the fire bowl is cold.
- **The full wipe plays here.** The trip reports by the fire bowl and the route signs on the shed wall crumble to dust, with the same renderer as the bones (11.10). The shed door swings shut on its starting shelves. With Reduce Motion it is a cross-fade.
- **The register post gets a fresh mark,** and two buttons follow (DRAFT): *Read the register* and *Sign the guest book*.

**Only the Open hiker dies this way.** A death on the Hike of the Day is a DNF: the chalkboard says so, the streak resets, and the Open hiker is untouched (decision 25). How much of the death sequence a daily death plays is settled with the modes.

#### The Trail Register lives at the cabin

- **The register box stands on a post at the edge of the lawn,** where an old trail leaves into the maples. Old ranger stations often sit at a trailhead.
- **Its contents are unchanged:** Best trips, and *Remembered*, with every GAME OVER and the Boyz' pre-filled lines (9.8), and the 104 permit counter (12.6).
- **The epitaph is still signed at the trailhead** where the trip began, as approved (decision 1, 9.5). It is the same register you read at the cabin's post. Signing it at the cabin's post instead, so the name goes home, is your call ([still to come](#still-to-come-from-you)).
- **Daily DNFs stay on the chalkboard,** not in *Remembered* (proposed).

#### Near-universal: the Boyz and 104 are easter eggs

*"I am making this game for the 104 boyz but I want it to also be near universal"* (decision 34). So everything about the Boyz and 104 is an egg: it rewards an insider and costs a stranger nothing.

| The egg | A stranger sees | An insider gets |
|---|---|---|
| The tub's thermometer at 104°F | A hot tub at the usual maximum | The crew's name |
| Badge #104 on a nail by the door | An old ranger's badge (a Look) | Jon's badge |
| Permit numbers 104-0001 and up | A permit number | The wink (decision 14) |
| A flat hat on a peg; "J." in the guest book | Whoever had the cabin before | Jon |
| The crew on summer weekends: tents on the lawn, camp chairs, a cooler, a dog | Friends visiting | The Boyz, by their quirks (`{BOY_n_QUIRK}`) |
| The crew's lines in the tub | Friends joking | Inside jokes (`{BOY_n_TUB}`) |
| Old signatures in the guest book | Old signatures | The Boyz' entries (`{BOY_n_GUESTBOOK}`) |
| The Boyz in *Remembered* | Old register lines | Their fictional deaths (decision 19) |
| A clam gun leaning on the shed | A tool | Jon's razor clamming, and the door to that minigame if the minigames use it |

**Rules for every egg:**

- **It is a Look or a cosmetic,** never a function. Nothing is required, nothing is explained, and nothing is private.
- **You write every word** (decision 21).
- **The consent gate stays.** `{BOYZ_CONSENT}` in Credits still blocks a release build (12.20).
- **The crew is around (proposed):** on real summer weekends, from 5 pm Pacific on Fridays and Saturdays, June to September; the evening of any big homecoming; and any dates you pick (`{BOYZ_DATES}`).

**What a stranger never meets** is the word Boyz, an explanation of 104 or a name they are supposed to know.

#### First launch

| Step | What happens | About |
|---|---|---|
| 1 | The cabin draws itself in, at the real time of day | 10 s |
| 2 | **The key lockbox** on the porch post asks three locals' questions (the opener from 2.6, moved). Wrong answers open it too | 30 s |
| 3 | **The guest book:** type a name, or tap suggest (12.4) | 20 s |
| 4 | The porch, with labels on. The next-step button says to plan your first trip | — |
| 5 | The first trip (3.6) | about 7 min |

The Hike of the Day is on the chalkboard from the first minute, and nothing gates it. Teaching new players beyond this minimum is still open.

### 2.3 Who speaks: the voice

Your calls: the voice is **deadpan Sierra, dry but kind, written for adults** (decision 5), and there is **no storybook narrator** (decision 22). Something still has to say what is happening. There are three ways to do it, shown here on the same moment, the fork at the rim of the Seven Lakes Basin (12.12). Every line below is DRAFT, there only to show the shape. **The words are yours** (decision 21).

**A. You, now.** Terse second person, present tense, in the Sierra box. It is King's Quest's own voice: its message boxes spoke to "you."

> (DRAFT) The basin lies below. Clouds are stacking up over Olympus. You have half a liter of water.

- **For:** it talks to the player, not about a character. It already matches the Look boxes and the YOU PERISHED lines (*You have died of...*). It needs no name, which suits the Hike of the Day's fresh hiker. The deadpan survives intact.
- **Against:** it can sound like an old text adventure if the writing slips.

**B. The log.** The hiker's own trail log, in the first person, terse, past tense.

> (DRAFT) 1:50 pm. The rim. Clouds over Olympus. Half a liter left.

- **For:** it is entirely backpacking's own stuff, and it becomes the trip report word for word.
- **Against:** a log can't hand you a decision in the moment without sounding odd, and it clashes with the second-person death lines.

**C. No narrator.** The world speaks for itself: a caption, signs, the map, the permit, rangers and other hikers in quotes. The picture and the sound do the rest, as in *Lonely Mountains: Downhill*.

> (DRAFT) `The rim · 1:50 pm · 4,900 ft` · `Thunder after 3 (40%)` · `Water 0.5 L`

- **For:** the fewest words for you to approve, and it travels well.
- **Against:** it loses the dry humor that the Larry moments and the death boxes are built on.

**Recommended: A for the moment, B for the record.** The live screens speak in short second-person lines, and only when they add something the picture and the sound can't: C's discipline, as a rule. Every day also writes the hiker's first-person log, which becomes the trip report's body (9.7). The Boyz' voices are heard on the trail in their cameos and, at home, only in the tub. Until you choose, the examples in this document follow the recommendation where they were rewritten for it; older examples still in the third person are drafts of the same moments.

**Look boxes keep Sierra's second person** in every option. Tapping the picture is KQ's LOOK (2.4), and the pop-up answers the way KQ did: *"You see a marmot. It sees you. Neither of you is impressed."*

**Animals never talk.** They are wildlife: beautiful moments, hazards and food thieves (7.11). The voice may say what an animal seems to be doing, sparingly, and never gives it lines: *The marmot appears to be supervising.* Rangers, shopkeepers and other hikers do talk. All have fictional names, Ranger Jon (4.2) among them, except the 104 Boyz, who appear by their own first names or nicknames (7.11).

**Death gets the same voice** (decision 5; 9.5): aimed at the weather, the water, the dark or the gear, never at the player and never at the loss. It is written for adults, and it never mocks, never gloats and never gets gory.

**The end of each night** used to close on a refrain (*And far away, the river went on talking to itself.*). Under the recommended voice it can keep one closing line, or let the river itself be heard instead (decision 32). Your call.

**Ten voice rules** (these replace `storybook.md` 10.1 and the old narrator rules):
1. Write for adults. Read a line aloud once: it should sound like a dry, patient Sierra game, not a bedtime story.
2. Second person, present tense, on the live screens (under recommendation A). The hiker's name never appears in the moment; it is on the permit, the log, the register and the report.
3. At most two short sentences at a stop: about 140 characters. Many stops have none, and the picture and the sound carry them.
4. Deadpan. Understate, state the fact and stop. No exclamation marks.
5. Kind, not cute. Humor aims at weather, rivers, jays, gear and plans, never at the player. (A Larry moment may tease the hiker's dignity, gently, 2.6.)
6. Real public places and real nature; fictional names for private businesses.
7. Safety is told as story. Only the Ranger's Note speaks plainly.
8. Animals never talk and never help. At most one "seems to" a day.
9. Items are characters. The voice notices what you brought and what you didn't. Turning back is never a failure.
10. At least one quiet stop a day where nothing happens but the place.

**Words to love:** scree, tarn, krummholz, alpenglow, cairn, moraine, nurse log, blue hour, huckleberry, splits, base weight. **Words to avoid:** epic, crush, insane, loot, grind, real brand names, gamer jargon (HP, XP) in the prose, anything cute (critters, tummy, oopsie), the retired book words (book, chapter, page, volume, shelf), and anything explicit: the Larry moments get their laughs from timing and the censor bar, never from a described body (2.6).

### 2.4 The King's Quest look and manners

- The status line reads `Score: 22 of 131` with the mile, the clock and ≡ (12.2).
- **Every trail stop puts its words in a Sierra message box:** a snow-white fill, a double brick-red border and ink-black text in an EGA-style bitmap font, with a small inner margin (the colors are the palette's, 11.1). It is drawn in CSS around real HTML text, so VoiceOver still reads it. The choices are matching boxes below it (12.2). This box, more than anything, is what makes a stop look like a Sierra game and not a web page with a picture on it.
- **Tapping the picture is KQ's LOOK.** A smaller pop-up box of the same style describes what you tapped in Sierra's second person (2.3), costs no game time, and gives +1 score the first time you look at that thing on a trip.
- Pictures **draw themselves in** over about 0.8 seconds, outlines first and then fills flooding in, the way AGI games drew on a 1984 PC. A tap skips it.
- **Death comes the Sierra way, then the Oregon Trail way.** Five screens, in order (9.5, 12.17):
  1. **The death box.** The scene drains to cold blue-grays, and a Sierra message box says what happened in a deadpan, kind line that never mocks the player, with a real Ranger's Note on what would have prevented it.
  2. **YOU PERISHED.** A black screen with big blocky EGA letters, and under them one line in the second person, Oregon Trail style: *You have died of a rising tide.* A public-domain funeral march plays.
  3. **Leave No Trace.** The picture of the spot where it happened, with a small skeleton lying beside the pack. Over about seven seconds the bones and the pack crumble pixel by pixel into dust, the dust blows away, and the place is left exactly as it was before the hiker came. A Sierra box says only *Leave No Trace.*
  4. **The epitaph.** Type your own line, tap the dice for a short line from the early accounts of the park's first explorers (preferring one that suits the cause), or skip. It goes into the Trail Register: there is no tombstone in the park.
  5. **GAME OVER.** The GAME OVER card. Then the cabin at dusk, where the wipe takes the hiker's trip reports, and only the Trail Register remembers them (2.2, 9.8).

### 2.5 Hard, but fair

- **Plan well and it's easy.** A well-packed hiker on a sensible itinerary sees mostly joy cards, and their risky choices mostly show 90% or better. Sensible trips in season finish happily at least 95% of the time (at least 85% in the shoulder season, when the planner suggests a better month), and a sensible plan ends in death at most 1 time in 200, in the model far less (F.1).
- **Death is real, and final.** In Old School, the rule of Open play, the hiker can die, with no restore, and the hiker's whole career goes with them. That is what makes the planning matter.
- **No ambushes.** Anything that can end a trip is foreshadowed at least one stop earlier (the forecast, a ranger's remark, "the light is going amber", the river "talking louder") and passes through a choice the player made. A hiker can die only at a ♦ that showed its fatal share, or at the end of a crisis chain after at least two warnings the player walked past (9.5). Never on a random draw.
- **There is always a way out.** Every moment that could kill offers at least one sure choice: turn back, wait for the tide, make camp, bail out or call for help. It costs time, comfort or score, never the hiker.
- **Turning back is honored.** *Sooner Than Planned* is a real ending with its own stamp at the car and a line of its own (DRAFT: *"The mountain will keep."*).
- **Bad news is told kindly and specifically.** The words name the cause gently so the lesson lands. State changes go in a pencil strip under the box, not in the prose. Serious news is always followed by a choice. A death is told the same way: deadpan, kind, never mocking, never gory.
- **A gentler mode, kept in a drawer.** The engine keeps a gentle mode with every rule above except the last rung (its worst case is a kind ranger with a thermos), with its own hikers, but v1 never shows it (9.4).

### 2.6 Larry moments (PG-13)

Your call (2026-10-08): *"I want it to have some leisure suit Larry in it too. like swimming naked in heart lake. Drinking a hazy ipa at morgrnroth. Smoking a doobie at st peters gate."* Asked how spicy: *"Pg 13 but beer and weed."* So: a dash of *Leisure Suit Larry*, rated PG-13, with beer and weed in (decision 18). Al Lowe's *Leisure Suit Larry in the Land of the Lounge Lizards* (1987) was Sierra's own comedy, so a dash of it belongs in a Sierra homage. Ours is cheeky innuendo, bad timing and a pixel censor bar, in the same deadpan voice (2.3). Nothing explicit, ever. The game itself never names Larry: inside the content, a Larry moment is any card tagged `larry`.

**The rules for every Larry moment:**
- **Cheek, not crude.** Innuendo and timing; never a described body, a slur or a joke at the player. The joke may tease the hiker's dignity, gently, the way Larry's games did.
- **Real stakes.** Each one moves meters, time, food, score or Leave No Trace, and any rolled choice in it shows its odds like every other (8.1).
- **Fair like everything else.** None kills except by the two fair paths (9.5), and each offers a sure choice.
- **Never near a car.** No drink and no joint on a drive screen, at a trailhead, at the car or the tailgate, on an ending stamp, anywhere in the cabin scene (the car is in it), or in any line that ties them to driving (lint T05, F.3). Both counters that sell them show 21+ (5.2).
- **Overnight only, and never on the way out.** A day hike's grab-lunch stop has no cooler and no door to Second Growth (5.3). *Crack the IPA* and *Light it* are offered only on an overnight trip: at a camp where the hiker sleeps that night, or on a layover day's side trip from that camp. Never on a day that ends at the car, and never on the walk-out day. The trail's other Larry moments keep the same rule, the broadest reading of decision 18: the swim and the bold marmot come only on an overnight trip, never on a day hike or the walk-out day (a lead call). The opener and The Steaming Fern Lodge are off the trail, and serve no drink and no joint (T05).
- **Out of sight at the car.** Beer and the pre-roll can be taken out of the pack only in the flat lay at the cabin. The tailgate never lists them, its flat lay draws the bear can closed, and the trip report leaves them out of its lists, *What the pack taught* included (3.3, 9.7).
- **Rare, where the game deals them.** The Director deals at most one Larry card a day and two a trip (8.4): the bold marmot, the permit check on a legal night, the thin tent wall. An off-permit night is different: its ranger is a forced roll every such night, outside the cap, and when a ranger comes, the permit-check card plays (3.7). A tile the player starts (the swim, *Crack the IPA*, *Light it*) is not dealt, so it is not capped: it costs what it costs, and the canister limits how many cans come along. The opener and The Steaming Fern Lodge (a drive chip) don't count either.
- **The censor bar.** A black bar, absurdly big for a 7x18 hiker, with CENSORED in small snow-white pixel letters, slammed on with a low blip (11.6, 13.2).
- **One switch.** Every Larry card carries the `larry` tag, and `flags.larry` is on in every v1 build, main and preview. If the hidden gentle mode is ever released for a younger player (9.4), the switch can go with it.

**The opener: a quiz for locals** (first launch only). The original *Larry* opened with an "adults only" trivia quiz. Ours asks three questions only a Pacific Northwest local would know, dealt from a pool of about twelve, each with a source: how to say *Sequim*, what a *sunbreak* is, what *Hoh* rhymes with, what locals call a Canada jay. A right answer gets *"Welcome home."* A wrong one gets *"Nice try, tourist."* Everyone gets in anyway. It is now the cabin's **key lockbox** on the porch post: the key is inside, and the box wants three answers, right or wrong (2.2). It takes about 30 seconds, comes before the guest book (so a first trip's 7 minutes start after it), and never comes back, not even after a death (wireframe in 12.3).

**Skinny dipping in Heart Lake** (M1a). Heart Lake sits at 4,780 ft just below the crest, a small lake shaped like a heart and fed by snow. At camp there, or on a stop at the lake during an overnight trip (the Heart Lake landmark stop, passing by day or walking up from a camp nearby; never on a day hike or the walk-out day, and it costs 30 to 60 minutes), the *Swim (brr)* tile (12.14) offers three ways in: feet only (sure, a little joy), in your shorts (sure: spirits up, soaked, a warmth cost), or **skinny dipping**, the biggest spirits lift a swim can give and the biggest warmth cost. Then, on screen:
- **The censor bar**, every time (wireframe in 12.21; Appendix D, screen 25).
- **A Canada jay**, the trail's *camp robber*, goes for the granola bar in your shorts pocket, about one time in four when there is food in it, and the shorts go into the outlet stream. They come back wet, or not at all. It costs dignity and a pair of shorts, never warmth that matters: the rest of your clothes are in the tent, so the jay is never a link in a cold chain (9.5, principle 2).
- **Company.** If a Boy is due this trip (7.11), he comes down the trail with a party of hikers at the worst possible moment, and they all admire the view very hard.
- **The towel decides the evening.** With a towel (`towel`), you are dry in a minute. Without one you air-dry, which on a sunny afternoon is a sunny afternoon. **At dusk, wet and with no towel,** the breeze starts the Cold chain (8.10): *shivering* (warning one), then *fumbling with the zipper* (warning two), each with *get dressed and into the bag* beside it, sure. In Old School a player who walks past both, to stay out wet for the stars, meets the chain's ♦ with its fatal share (about ♦ 70% · 30% shivering · 4.5% fatal on an August dusk, illustrative), with the sure choice still beside it. That death reads ***You have died of skinny dipping.*** (9.5):

> **The Lake Was Fed by Snow**
> *(DRAFT) Heart Lake looks like a postcard and feels like a snowbank, which is what most of it was in June. The swim took two minutes. The evening took the rest.*
> **Ranger's Note:** Snowmelt lakes chill you faster than the air does, and the danger comes after you get out, in the wind at dusk. Swim early in the day, bring a towel, and be dry and dressed before the sun goes. Shivering that turns to fumbling means stop: dry clothes, the sleeping bag, a hot drink.

**A hazy IPA at Lake Morgenroth** (beer from M1a; Morgenroth in M1b). The general store (`{STORE_GENERAL}`) sells *Blue Hour Hazy IPA* from the fictional Slugwater Brewing Co. (both draft names) in 16-oz cans, and the shopkeeper asks for ID (5.3). Beer is legal in the park for adults 21 and over (no backcountry ban was found; `hamma_hamma.json` has the rule). A can is a real packing decision: about 17 oz full, a pound and change, and it is scented, so it rides in the bear canister, where it takes about 0.5 L, a lunch's worth of room (5.5, 6.7). At camp a packed can adds a tile, *Crack the IPA*:
- **Spirits**, by the place and the sky: a big lift at a beautiful spot on a clear evening, a small one in the rain. The biggest in the game is at Morgenroth, your lake, with a bear grazing the far shore (B.7).
- **Buzzed** until bedtime: -5 on footing and navigation, and on anything else the evening asks, such as a sunset scramble or a swim (8.5). A second can doubles it, and the voice stops counting at two.
- **A little dehydration**, about 0.3 L, and a drink makes a cold night feel warmer than it is: -2 °F on the night margin (7.9), with a Ranger's Note line if it mattered.
- **The empty** is trash. Crushed, it goes in the canister for the night (outside it, it counts as food left out, 6.3). Packed out, it is a Leave No Trace act (+2 score); left behind, -5 on the Leave No Trace ledger (9.6).

**A joint at St. Peter's Gate** (M5, with the Hamma Hamma region; a pre-roll on the Seven Lakes loop from M1b). Cannabis is legal in Washington for adults 21 and over, and **illegal on federal land**: in the national park (36 CFR 2.35) and in the national forest below it, where rangers can and do write citations (`hamma_hamma.json`, `permit_and_rules`). St. Peter's Gate (5,934 ft) is a narrow notch between black cliffs on the shoulder of Mount Stone, inside the park: 0.9 mi and nearly 1,000 ft of steep, loose off-trail scrambling above Lake of the Angels (4,950 ft), which is itself 3.6 mi and 3,420 ft up the Putvin Trail, headwall and all. Through the Gate lie the Stone Ponds, as you remembered (*"St. Peter's gate connects the ridge above lake of the angles with whatever is on the other side stone ponds I think"*), and, beyond, Scout Lake (4.1). The pre-roll comes from **Second Growth**, a fictional licensed shop next door to the general store (5.2), whose clerk says the true thing out loud: *"Legal here. Not where you're going."* It is smellable, so it rides in the canister. At the Gate, *Light it* is offered only to a hiker who camps that night at Lake of the Angels or the Stone Ponds, so the walk down ends at a tent, not a car. It is a plain rolled choice:
- **The % is the chance no ranger strolls by,** from the trail's popularity, the day of the week and the hour: about 88% on a summer Saturday afternoon and 96% on a weekday evening (illustrative). Sometimes the ranger is Ranger Jon, on duty for once and a long way from his glacier.
- **If it goes badly: a citation,** never more. A pink carbon copy clipped to the permit; the fine on the receipt (shown, not paid, like the permit fees; the research records the federal maximum, six months or $5,000, and the receipt shows a typical ticket, its amount still to confirm); the finish award halved, as for the Hard Way (9.6); a small *cited* stamp on the trip's Trail Register line; and a likelier permit check the next time this hiker comes to that region (9.8). It never ends a trip, and never the hiker.
- **The munchies:** the hiker eats 400 to 800 kcal past the day's allowance, out of the canister, which can bring the *running short* card (5.6) a day early.
- **Time slips:** the clock jumps 30 to 60 minutes (seeded, and told after the fact, DRAFT: *It is later than it was.*), so dusk comes sooner than the plan said, and a Fork card (8.2) may come with it. Footing and navigation are -5 for two hours (8.5), and the way down from the Gate is loose scree where a helmet is the research's advice, so that -5 shows up where it matters, in the Why sheet of the next footing check.
- On the Seven Lakes loop the same pre-roll gets the same card, at camp in the evening or on a layover day's side trip from camp, never on the walk-out day (the rules above). In August the High Divide is busy, so the odds are worse. Whether a fire ban's smoking rules apply as well is for the research to confirm.

**More Larry moments on the loop**, each a card with real stakes:

| Moment | Where | The stakes |
|---|---|---|
| **The bold marmot** | The basin or the crest, when nature calls | Walk 200 ft from water and dig 6-8 in with a trowel (a Leave No Trace act, +2 score), or don't (-5 on the Leave No Trace ledger, 9.6). Leave the pack on the ground and a marmot may chew the salty hip belt, and the pack carries worse for the rest of the trip. A trail-running group rounds the switchback on cue |
| **The permit check** | Any camp, while you're changing behind a boulder | The censor bar, and a ranger who waits politely. A night that's on the permit is a nod and a story. One that isn't (you dropped into the basin and stayed) has already cost its Leave No Trace (3.7); there the ranger's visit is a forced roll every night, outside the Director's cap, and this card adds the off-permit lines: a talking-to, and maybe a walk to a legal camp at dusk |
| **The thin tent wall** | Lunch Lake, where sites sit close and some lie on paths to others | The neighbors are very happy to be in the mountains. Earplugs (`sleep_aid`) mean a good night. Without them, sleep quality drops and tomorrow's legs with it; a pointed cough works about half the time (a plain %) |
| **The Steaming Fern Lodge** | The hot springs near the end of the Sol Duc road, under its fictional name | Before the hike, a soak costs about 90 minutes of Day 1's daylight. After it, the pools take only a hiker who is out before the last session, so the last day races the clock (and Push pace has its costs). No swimsuit means the gift shop's, in a size best called optimistic. Spirits, and a trip-report line (DRAFT): *Smell: improved*. No drinks at the lodge (T05) |

(Marmots' taste for salty gear is to be confirmed for the Olympic marmot in the research before M1b. The permit check and the basin-or-crest fork are meant to meet: it is where a mid-trip change of plan comes due, 3.7.)

---

## 3. Core loop

An Open trip, from the cabin and back (the Hike of the Day and FKT attempts use the same trail, with their own starts, 2.2):

```
 First launch only: the lockbox,
 then the guest book (a name)
    ▼
 THE CABIN (live time)
    │  the screen door: plan
    ▼
 THE DAY BEFORE
 MAP TABLE: where · which way
    │  round · day hike or nights ·
    │  each night's camp · the basin
    │  or the crest · date · Jon,
    │  for Olympus
    ▼
 PERMIT: print it (104-xxxx)
    │  the car
    ▼
 TOWN: Port Angeles · the WIC
    │  (optional) · three stores
    ▼
 CABIN, evening ─ the shed ─▶
 FLAT LAY: lay it out · share it
    │  · pack it
    ▼
 DEPARTURE MORNING
 DRIVE: through Forks · the
    │  tailgate: "leave anything
    │  in the car?"
    ▼
 DAYS: morning ▸ depart ▸ trail
    │  stops and decisions ▸
    │  arrive ▸ make camp ▸ sunset
    │  ▸ night ▸ morning ▸ ...
    ▼
 THE CAR: the ending's stamp ▸
 DRIVE HOME ▸ CABIN ▸ TRIP REPORT
 ▸ (a big hike) THE SOAK
    │
    └ or the death box ▸ YOU
      PERISHED ▸ Leave No Trace ▸
      an epitaph ▸ GAME OVER ▸ the
      cabin at dusk ▸ the register
      ▸ the guest book: a new name
```

**When things happen.** Planning, the town run and the flat lay all happen the day before the trip. You plan at the cabin and print the permit in the morning, make the run to Port Angeles (the WIC's loaner canister is picked up there, and the food is bought), and lay out your gear on the deck that evening. The drive starts on departure morning, when you choose when to leave. None of the day before costs trip time.

**Day hikes** need no wilderness permit and no canister, so they skip both, and they skip the town run too: lunch is grabbed on the drive, at the last-chance shelf in Forks, with no beer cooler and no Second Growth (2.6), and the flat lay uses a day pack from the shed. With no permit to carry them, the trip plan goes on a day-use line at the trailhead (12.10), where it drives the overdue clock (3.7); the score maximum is set at *Start walking* (9.6); the Trail Register shows *day hike* where a permit number would be; and the 104 counter doesn't move (12.6).

Going back is free while you plan, shop and lay out your gear (it is planning, after all). It closes at **Start walking**. After that nothing goes back, in any mode: every stop autosaves, and what happened, happened (9.4).

### 3.1 Planning at the map table

You plan at home, at the cabin's table, with the park map spread on it, and you print your own permit, as real Olympic hikers do: once a reservation is issued, *"you will be able to log in to your account and print the permit yourself"* ([NPS, Wilderness Reservations](https://www.nps.gov/olym/planyourvisit/wilderness-reservations.htm)). The Wilderness Information Center (WIC) in Port Angeles becomes an optional stop on the town run (3.2).

**Step 1: Where.** The park map always shows the whole park. Tap a region, then a trailhead; regions not built yet are pencil sketches that can't be chosen (4.1). Or open *the ranger's favorite trips*, a binder the cabin's old ranger left on the table: the presets, filtered by region, number of nights and level, about 8 at a time. On a first trip the table asks three questions about the High Divide loop instead (3.6).

**Step 2: What kind of trip, and when.** A row of chips: `Day hike` `1` `2` `3` `4` `5` `6+` nights. Then the date: month chips plus a calendar. The date chips and the permit always show the year.
- **The calendar rule.** A trip falls in the 12 months after the conditions date (the research date of the conditions overlay the build carries, never the phone's clock, 4.7), in the next open season. With this build's conditions, any date up to Oct 15, 2026 is this autumn, and anything later is in 2027 (4.7). The cabin itself runs on the real clock (2.2); the trip's date is the one you pick.
- **Seasons.** Summer permits run May 15 to Oct 15. Glacier Meadows, Elk Lake and Martin Creek are reservable Jun 15 to Oct 15, and the Seven Lakes Basin and High Divide camps are bookable online from Jul 15 to Oct 15. A date outside those windows routes to a *Phone the WIC* card (`park_rules.json`: high camps outside the online window are arranged by phone), with winter rules only when the date is also outside May 15 to Oct 15. The card is a form, not the call: it handles the out-of-window permit for the camps already on the itinerary and says what season rules apply, and it offers nothing else (no *Ask about a lake*). Lake Morgenroth still needs the number in the fine print (4.3).
- **Weekends** make quotas tighter, trails busier (more kind strangers) and the free canister loan scarcer. The planner suggests the destination's best month.

**Step 3: The itinerary, night by night.** On a loop the first row asks **which way round**, two chips with an honest line each (4.3): on the High Divide, *↺ Deer Lake first* (counterclockwise) or *↻ River first* (clockwise). Then each night is a row. Tapping a night row opens a list of the camps reachable from the night before, in that direction first, sorted by distance, each with the day's numbers:

```
Way round: ↻ river first  [change]
Sol Duc River #4 4.3 mi  +1,020
  arrive 11:25 am · quota OK
Sol Duc Park   7.1 mi  +2,470
  arrive 1:55 pm · quota OK
Heart Lake     8.1 mi  +3,060
  arrive 2:55 pm · a long climb
Lunch Lake    10.9 mi  (full that night)
```

(Night 1 of Appendix B's trip, clockwise from the Sol Duc trailhead at 8:30 am on a Thursday in August, at a Regular hiker's pace with a comfortable load, by the 7.4 formula: Sol Duc Park is (7.1 / 2.4 + 2,470 / 1,300) x 1.12 = 5.4 h.) The map highlights each camp as you scroll the list. The map also pinch-zooms, with clustered markers ("3 camps") that open into single ones, because Round, Lunch and Clear Lakes (or the Hoh's 13.1, 13.2 and 13.3 Mile sites) sit a couple of points apart at phone scale. Disabled rows say why: closed, full that night, outside the quota season, or a group site (7 to 12 people) that a solo hiker can't book. Camps kept off the website show as *ask at the desk* rows (in M1a: Bruce's Roost, Cat Basin and Hidden Lake; Long Lake and Sol Duc Lake are pencil rows until M1b, 15). One lake in the basin isn't in the list at all: Lake Morgenroth, which you get only by calling the WIC (4.3).

**Desk requests.** Tapping an *ask at the desk* row marks that night as a request. A plan with a request can't be printed at the cabin: the next-step button says to take it to the WIC (DRAFT wording), and the permit is issued at the counter on the town run, where the ranger considers the request (a seeded roll, 4.3). If she can't grant it, she offers the nearest legal camps there and then.

**Up high: the basin or the crest.** On the High Divide, the day that crosses the Divide gets one more chip pair, *Drop into the basin* or *Stay on the crest*. It sets the route between that day's camps, through Lunch Lake by the stone staircase or the Mirror Lake way trail, or along the crest past Bogachiel Peak, and the day's miles, climb and arrival time change with it. It is a plan, not a promise: the same question comes back on the trail as a fork card (7.4, 12.12).

The route between camps follows the trails automatically (shortest by hiking time, avoiding closures), except where the plan pins it with `via` waypoints: the basin-or-crest chip, a pinned side trip, or a fill or preset that keeps a research route (4.6, B.1). Each day row shows:
- miles, gain and loss, and an estimated hiking time at a Regular hiker's pace (7.3);
- when you'd arrive, compared with dark ("arrive 5:10 pm; dark at 7:15");
- a plain difficulty word (DRAFT): *an easy stroll, a good day, a long day, a very long day, a ranger would raise an eyebrow*.

Each night row has two buttons:
- **Stay again** makes it a **layover**: no packing up, a free day for side trips with a light pack (the research's `layover_ideas` become suggestions), more joy, and at a high camp a second evening up high.
- **Move on** picks a new camp: more scenery and more miles, with a heavier pack every day.

Side trips on the way (Bogachiel Peak, Hoh Lake and back, the edge of Cat Basin) are pinned with **Add a side trip** on a day row; they add their miles and climb, and they can still be skipped or added on the trail. Traverses ask how you'll get back to your car: a fictional shuttle service, a bike stashed at the far end, or hitching (slow). Two cars would need a party, and v1 hikers go alone. Day hikes pick a turnaround point (on a loop, just the way round and the basin or the crest) and a "back by" time instead of camps.

**Step 4: The plan's notes, and the briefing.** At the cabin, every check in 4.6 becomes a plain note at the foot of the permit, written as a fact, in no one's voice (DRAFT: *"Day 2 crosses the crest. Thunder 20% after 2 pm Friday."*). The **briefing** is at the WIC: if you stop there on the town run, the ranger reads your plan back in her own words, then gives a **one-screen briefing** on the one to three things that matter most for this plan, chosen from the plan itself: snow on the Divide in early July, the Hoh in the afternoon, the tide gates on the coast, bears in berry season. The briefing grants all of that knowledge at once (8.6), so there is no list of topics to tap through, and a player who doesn't know what to ask still learns it. Skip the WIC and you skip the briefing.

**Olympus.** Put Snow Dome or the summit on the plan, and the map table asks the one question that matters (DRAFT): *"Going up with Jon, or on your own?"* Booking Ranger Jon happens here, at planning, on one of his days off; going alone is allowed, with an honest Outlook (4.2).

**The Trip Outlook, first reading.** In the background the game plays the plan forward many times (8.9), **assuming you pack the ranger's sensible kit** (the checklist pinned inside the shed door, 6.1), and reports in words (DRAFT): *"If you pack well: a long, lovely trip. Day 2 is a climb, and the nights will be cold."* Tap it for the numbers. It reads again, with your actual pack, when you pack it (3.2) and at the trailhead (3.3).

**The phone.** The cabin has an old wall phone by the map table, and the WIC's number is in the permit's fine print. The *Phone the WIC* card uses it for out-of-window permits, and a player who finds the number on their own can call about anything. It is the only way to Lake Morgenroth (4.3, 12.5).

**Step 5: The permit.** A paper form, printed at the cabin:
- the permit number, which always starts with 104 (`Permit No. 104-0037`, 12.6);
- party (you, plus Ranger Jon if you booked him, 4.2), entry trailhead, dates with the year, the camp for each night;
- a quota check for each night (a seeded, weekend-weighted roll, `hash(trip seed, date, camp)`: the trip seed is drawn when the plan is first saved, so going back to the map table never re-rolls a night, and changing the date does, E.8; "Lunch Lake is full that Saturday" is a planning event with alternatives, not an error);
- fees, shown for realism: $8 per adult per night plus a $6 reservation fee;
- **bear canister**: bring your own, buy or rent one at the gear shop, or try the free WIC loan on the town run (available about 70% of the time on summer weekends, 95% midweek). Going without is allowed, with its costs on the trail (6.3);
- **trip plan left with:** a friend, or no one. A friend reports you overdue 12 hours after your planned exit (3.7);
- **the forecast**, for the trip days within five days of the planning day. Later days show climatology instead (DRAFT: "late September: rain about one day in three");
- **the plan's notes** (Step 4);
- **the fine print** at the foot: *Questions? Call the Wilderness Information Center, 360-565-3100.* It is the real number, from the region data, and the hidden phone (4.3, 12.5). It opens only the game's own call screen: it is never a `tel:` link, and the app shell switches off iOS's phone-number detection, so a tap or a long-press never offers to call the real desk (E.7).

Tap **Print it** (DRAFT; an old printer's clatter). The printed permit is pinned to the screen door (2.2), and the score line appears with the maximum computed for this itinerary (9.6): `Score: 0 of 170` on Appendix B's three-night trip (B.4), `Score: 0 of 131` on the Hoh trip the wireframes use (12). A day hike has no permit to print, so its maximum is computed at *Start walking*.

### 3.2 Town and the flat lay

**The town run** (sections 5 and 12.7). The car drives to Port Angeles along Lake Crescent, the day before. Town is a stylized street with four doors, and you may visit any, all or none:
- **the WIC**: the briefing, the free loaner can, and the desk-only camps (3.1);
- **the three stores**: the general store, the gear shop and the boutique (5.2).

The shopping list is driven by the itinerary (2 breakfasts, 3 lunches, 2 dinners...) and shows a canister gauge at every counter. Then *Head home*: the grocery bags wait on the porch steps.

**The flat lay** (6.1), that evening, at the shed. Everything you might carry is laid out top-down on the deck boards, and what you lay out is what goes. **Pack it** runs the Trip Outlook a second time, now **with this pack**, and names the two or three biggest gaps (DRAFT): *"With this pack: this trip very likely ends in serious trouble, and if you keep pushing, about one time in fifteen the hiker dies. Biggest gaps: no sleeping bag, no headlamp, no rain jacket."* In Old School the Outlook always says how often the plan, followed to the end, ends in death, whenever that is not zero, and any plan that reaches a ♦ that can kill says so, however small the share (8.9). It is a warning, never a block.

There is no packing prose any more: the flat lay is the picture of the pack, and you can share it (6.10).

### 3.3 The drive

**From the cabin, through Forks.** Quinault is about an hour from Forks ([NPS](https://www.nps.gov/olym/planyourvisit/visiting-quinault.htm)), and the region data gives the time from Forks to each trailhead: the Sol Duc 69 minutes, so about 2 hours 10 from the cabin; the Hoh 58, so about 2 hours. East-side trailheads go through Port Angeles or Hoodsport; the legs from the cabin to those towns are to be measured before M3, and NPS gives about three hours to Port Angeles. On a route you haven't driven before, the drive is two to five road scenes: the lake and the rain forest at the start, the coast and the long straights of US 101, elk on the Upper Hoh Road, the old forest at the end of the Sol Duc Road. **On a route you've already driven, the drive is one screen**, with the optional stops as chips: *The Huckleberry Skillet* (a fictional diner; pie costs 45 minutes and lifts spirits), the last-chance shelf in Forks with higher prices, and on the Sol Duc road a soak at *The Steaming Fern Lodge* (about 90 minutes of Day 1's daylight, 2.6). **No drive, trailhead or car screen ever offers, shows or mentions a drink or a joint**, and nothing links either to driving (lint T05). Lake Crescent, with its palette-cycled water, is on the town run (3.2).

**Leaving time matters.** You choose when to leave the cabin, and a late start shortens Day 1. Road conditions come from the dated conditions overlay and apply only on the dates they cover (4.7): the Elwha road walk from Madison Falls and the Dosewallips washout (open-ended), entrance-station lines at the Hoh in summer, and in this autumn only, Mora Road closed through Oct 15, 2026 and the US 101 Hoh River Bridge closed Oct 8 to 13, 2026: a 4-hour detour that cuts Kalaloch, Queets and Quinault, and so the cabin, off from Forks.

**The trailhead: the tailgate.** The hatch is up for one screen, with the same flat lay in the back (12.10). Move anything between pack and car, except beer and the pre-roll: those come out of the pack only in the flat lay at the cabin, and the tailgate never lists them (2.6, T05). The screen shows the Trip Outlook a third time, with this pack, and the honest ETA for Day 1 (on Appendix B's trip: *"Sol Duc Park about 1:55 pm, seven hours before dark"*; on Appendix A's: *"Glacier Meadows about 12:30 am: five and a half hours after dark, by phone light"*). This is the last chance to change the pack, exactly as on a real trip. The game **never makes you forget things at random**: every gap is a choice, which keeps the "why did this happen" trace honest.

### 3.4 The days

```
MORNING weather now, breakfast,
        pack up
DEPART  pace: Easy / Steady / Push
LEGS    trail stops; 0-2 beat slots
        per segment, plus landmarks
        and splits
ARRIVE  pick a site
CAMP    Make camp (one tap), then
        free time; the sky darkens
        as it goes
NIGHT   a night card only if
        something happens; the
        river, or a closing line
MORNING move on / stay / side trip /
        home
```

A layover day replaces DEPART and LEGS with side trips and camp time. **Splits** are taken at each named place on the route (the trailhead, falls, junctions, lakes, camps) against the plan's ETAs; the strip under the picture shows them (12.2).

**Known ground: Walk out and Walk on.** On ground you have already walked (the way home on an out-and-back, or a valley from an earlier trip), the morning screen offers **Walk out** (or **Walk on**): one summary stop per leg (DRAFT: *"You go down the valley the way you came. The river, loud going up, has calmed down about everything."*). The simulation still runs underneath, and the summary stops only for forced beats (a crisis, a fork, a delayed payoff) and for anything new (an animal, a view not yet seen, a river that has changed). Out-and-back trips stay brisk without extra writing. M1 transcript reviews track stops per return day (target: 3 to 6).

### 3.5 Pacing targets

| Trip | Stops | Minutes in all | Real decisions |
|---|---|---|---|
| Day hike | 12-18 | 8-13 | 3-5 |
| 1 night | 25-35 | 15-22 | 6-10 |
| 2 nights | 45-60 | 20-30 | 10-15 |
| 3 nights | 60-75 | 25-35 | 12-18 |
| 4-6 nights | 75-120 | 30-55 | 18-30 |

Minutes are the whole trip, planning included: 4 to 8 minutes at the map table, in town and at the flat lay (about 7 on a first trip), then 5 to 7 per hiking day (1.1).

A **Trail stops** setting (DRAFT: Few, Usual, Many) changes how many quiet, decision-free stops appear: about 8 to 20 per day.

### 3.6 The first trip

**Target: the trail within about 7 minutes of opening the game for the first time.** There is no prologue: after the lockbox and the guest book (2.2), the game opens on the cabin with the next-step button pointing at the map table. Without help, a new player would face a park map, a long list of presets, quotas, 88 foods and a 217-item shed before Day 1, which is where players quit. So the first trip is short on chores and long on trail. Every later trip gets the full manual path.

| Step | On the first trip | Minutes |
|---|---|---|
| Guest book | Type a name (12.4) | 0.5 |
| Map table | The loop's three questions; a filled-in permit to print | 2 |
| Town | "Fill from the list" at the general store, 2-3 swaps; the loaner can at the WIC | 1 |
| Flat lay | The checklist chalked on the deck; about 15 taps | 2.5 |
| Drive and tailgate | One screen and the last look | 1 |
| **Total** | | **about 7** |

1. **The loop, three questions.** In M1, the first playable, a first trip is always the High Divide and Seven Lakes Basin loop from the Sol Duc trailhead (your call, 2026-10-08). The map table asks three things, each a row of chips with one honest line (wireframe in 12.5): **which way round** (Deer Lake first, or the river first), **how long** (a day, or 1, 2 or 3 nights), and **up high, the basin or the crest**. It fills in sensible camps for that answer (the twelve fills are in B.1), every night row stays one tap from changing, and the full map and the planner are one tap away for a player who wants more nights or other camps. From M2 the first trip may offer the Hoh instead (Happy Four, the Blue Glacier classic, Five Mile Island), and from v1.0 Royal Basin with a layover. No fill ever offers Lake Morgenroth, and nothing mentions the phone (4.3).
2. **Fill from the list.** The general store's list fills itself with a varied menu sized to the itinerary that fits the canister, then highlights two or three swaps for the player to make (5.3).
3. **The checklist is chalked on the deck.** On the flat lay, the ranger's checklist items show as chalk outlines in their places on the deck boards, not yet laid out. Each tap lays one out from the shed, and whatever is still only an outline stays in plain sight. A first flat lay is about 15 meaningful taps; the long tail and the traps wait in *More from the shed* (6.1).
4. **The presets list is short:** filtered by region, nights and level, about 8 at a time.
5. **No tutorial screens.** The box explains each new thing once, in one line, the first time it appears: the first %, the first ♦, the first fatal share (8.7).
6. **There is nothing to choose but a name** (12.4). No mode, no character options: the guest book asks for a name and says one plain line (DRAFT): *"One life. If your hiker dies, the trail ends, and their stories go with them."* A new hiker after a death gets exactly this first trip again, short chores and all, because they start from nothing (9.8). Every fill with nights in it is a sensible plan, so a first trip that takes the ranger's kit is about as safe as backpacking (F.1). The *Day* chip is the one ambitious answer, and its note says so (DRAFT): *"Eighteen miles. Take a headlamp and three liters."* With that kit it is the "ambitious but equipped" row of F.1. The first time a button shows a fatal share, the sure choice beside it is outlined, and the box says why in one line (8.7).

### 3.7 Changing plans on the trail

- **Replanning.** From the morning screen, a Fork card or the Map tab, *Change the plan* re-runs the validator with in-trip rules. Closures still route around, but a quota camp is never a block: it becomes an off-permit night (below), and if a ranger comes by, a ranger card (*"It's all right this once. The camp was half empty, and you looked honest."*) with a polite talking-to. The change is noted on the permit, and the score maximum is recomputed without lowering the score already earned (9.6). A change to a camp outside any quota area is simply legal, and costs nothing but the miles.
- **What a change really costs.** The rule is real: in a quota area you camp where your permit says, and changes are made before the trip unless a ranger approves them (`park_rules.json`). So every changed night there is an **off-permit night**, and the screen says what that means before you choose. **One rule, everywhere:** the Leave No Trace cost is always charged, -5 for an off-permit night at a legal site and -10 on the meadow, because it is about the impact, not about getting caught (9.6). The only part that is rolled is the ranger: the chance one comes by that night (from the camp's popularity and the day of the week), shown in the Why sheet, and if one does, a talking-to and maybe a walk to a legal camp at dusk. That roll is forced and uncapped: it is made every off-permit night, whatever the Director's budget, and when it hits it plays the permit-check card (2.6). The Director's cap on Larry cards covers only the permit check it deals on a legal night. **A full camp is still full:** if every site is taken, the honest choices are another legal camp, walking on, or the meadow at -10. Moving one night moves the rest: each later night is checked again. The overdue clock (below) does not move: the friend holding your trip plan still expects the exit you left with them, unless a satellite messenger tells them otherwise, and the screen says when they will start to worry. Day visits change nothing: dropping into the basin for lunch, or walking to Lake Morgenroth and back, needs no permit.
- **Up high.** On the High Divide the basin-or-crest fork card (12.12) is a replanning stop of its own: it offers the plan's way, the other way, a night in the basin if that isn't the plan, and the sure way home, each with tonight's ETA against dark, the forecast for the crest, water and what it does to the permit (7.4).
- **Where's the car?** The game tracks where the car is. Coming out at a different trailhead (the High Divide down to the Hoh via Hoh Lake; out the Elwha) opens an exit menu, each with its time cost and a screen: phone the shuttle (needs signal; a 2 to 4 hour wait), hitch (1 to 6 hours, better on busy roads), or a ride with a ranger if one is at the station.
- **The overdue clock.** If you left a trip plan with a friend (on the permit, or on a day hike the trailhead's day-use line, whose *back by* time is the planned exit, 12.10), they report you overdue at your planned exit plus 12 hours, and the chance of a search finding you rises from then on (9.2). With no trip plan, nobody knows to look until someone notices the car, after 2 to 3 days. Staying out longer (a night under the stars, waiting out a tide or a river) moves your exit, and a pencil-strip line says when your friend will start to worry.
- **Day hikes** get a turnaround card 30 minutes before the "back by" time. It points the shortest way to the car by hiking time from where you stand, which on a loop past halfway is onward, not back the way you came.
- **Bailing out is always on the table.** The morning screen, every Fork card and every crisis card carry a sure way home or a way to call for help. At any moment that could kill the hiker, that sure choice is guaranteed and linted (9.5). Turning back never kills anyone.

---

## 4. The park in the game

### 4.1 Six regions, one park

The research covers the whole park in six region files under `design/data/regions/`. A graph-join check found **zero undefined trail endpoints**, so the six files join into one network. Fourteen ids appeared in two files. The fact-check (`design/data/FACT_CHECK.md`) found that two of them were really *different* places sharing an id and renamed them (`slide_camp_gray_wolf` and `slide_camp_skokomish`; `badger_valley_elk_mountain_junction` and `elk_mountain_grand_ridge_junction`, now joined by a new 1.3-mile Elk Mountain Primitive Trail segment). The other 12 (for example `grand_pass`, `appleton_pass`, `low_divide`, `c_b_flats_group_site`) are true shared places, now aligned. Ingest merges shared places, and its lint catches collisions like these automatically (E.4).

| Region (file) | Places · segments | Camps · trips | Known for |
|---|---|---|---|
| Hoh and Olympus (`hoh_olympus`) | 63 · 65 | 29 · 21 | Rain forest, Blue Glacier, Mount Olympus, Bogachiel, Queets |
| Sol Duc and High Divide (`sol_duc_high_divide`) | 83 · 81 | 39 · 27 | Seven Lakes Basin, High Divide, Hoh Lake, Appleton Pass, Lake Crescent |
| Northeast and Dosewallips (`northeast_dose`) | 70 · 68 | 33 · 26 | Royal Basin, Upper Dungeness, Grand Ridge, Lake Constance, Gray Wolf |
| Elwha and Hurricane Ridge (`elwha_hurricane`) | 90 · 101 | 37 · 27 | Hurricane Hill, Lake Angeles, Grand Valley, the Elwha, Bailey Range |
| South: Quinault, Duckabush, Skokomish (`south_quinault_skok`) | 81 · 84 | 42 · 26 | Enchanted Valley, LaCrosse Basin, Low Divide, Skyline, Staircase |
| Wilderness Coast (`coast`) | 74 · 58 | 21 · 23 | Shi Shi, Ozette, Rialto, Third Beach to Oil City, tide gates |
| **Whole park** | **449 · 449 unique** | **201 · 150** | |

**Raw, unique and compiled counts.** The files hold 461 place records and 457 segment records. Twelve places and eight segments appear in two files, so the park has 449 unique places and 449 unique segments (about 900 directed). The compiled graph adds overlay points the research doesn't list as places (each ford, the ladder, viewpoints, mid-segment landmarks), so it will hold somewhat more: roughly 500 to 600 places at full park. The build prints the exact counts, and the statistics in this document should be regenerated from that report by a script rather than typed by hand.

The gear catalog (217 items and 8 packs), the food catalog (88 foods) and the park-wide rules (`park_rules.json`: permits, food storage, fires, climate, tides, rescue patterns, fall 2026 conditions) complete the data. The fact-check confirmed the signature mileages against NPS (Hoh trailhead to Glacier Meadows 17.4, Upper Dungeness to Royal Lake 7.2, the High Divide loop 18.4 vs NPS 18.2) and that canisters are required at all 156 public wilderness camp areas. **The files are the source of truth**; this document only cites them. Known gaps: hidden or closed camps (Beaver Flats/Four Stream, Donahue Creek, Madeline Creek, Twelve Mile, Camp Pan, Chateau Camp) have no nodes. **A seventh region has just arrived:** `hamma_hamma.json` (researched 2026-10-07: 49 places, 39 segments, 12 camps, 16 classic trips) covers the Hamma Hamma and Lena valleys on the southeast edge of the park: Lena Lake and Upper Lena Lake (a quota area), the Putvin Trail to Lake of the Angels in the Valley of Heaven, St. Peter's Gate and the Stone Ponds, and The Brothers. It joins the park graph at First Divide. It is planned for M5 (15). It hasn't been through the fact-check or the ingest merge yet, so the counts in the table above are still the six original regions'.

**What a v1.0 player sees of the rest of the park.** The park map on the cabin's table always shows the whole park. Regions not yet built (the coast, the Elwha, the Quinault and the rest) are drawn as pencil sketches (DRAFT label: *still being drawn*). Tapping one gets a plain note (DRAFT: *"That valley is for another day."*), and it can't be chosen for a trip. The Quinault is the cabin's own valley, so its sketch sits right under the cabin's mark on the map. The ranger's favorite trips list only playable ones. Each milestone inks in more of the map (15).

### 4.2 Mount Olympus and every camp on the Hoh

*Built in M2, after the first playable (15).*

The Hoh River Trail climbs from rain forest at 578 ft to Glacier Meadows at 4,300 ft in 17.4 miles. It is easy walking for 13 miles, then about 3,000 ft of climbing past a broken-runged ladder in a washed-out avalanche chute. Beyond Glacier Meadows lie the Blue Glacier and the 7,980-ft summit. Mileages are from `hoh_olympus.json` (sources disagree by up to 0.4 mi; for example Glacier Meadows is listed at 17.3 to 17.5). Elk Lake, Martin Creek and Glacier Meadows are in the Hoh quota area, reservable Jun 15 to Oct 15.

| Camp | Trail mile | Elev (ft) | Notes |
|---|---|---|---|
| Hoh Campground (drive-in) | 0.2 | 586 | Front-country; the night before |
| 1 Mile Camp | 0.9 | 625 | |
| 1.4 Mile Camp | 1.4 | 644 | |
| Mount Tom Creek Camp | 2.9 | 681 | 3 sites + 1 group |
| 3.3 Mile Camp | 3.3 | 717 | |
| Five Mile Island | 5.0 | 782 | Gravel bars, elk; 3 + 2 group + stock |
| Happy Four | 5.7 | 800 | 2 sites; the classic easy first overnight |
| (river braid ford) | 8.0 | 921 | Side channels; no bridge |
| Olympus Guard Station | 9.1 | 947 | 1930s cabin, seasonal ranger; 7 + 2 group |
| (Hoh Lake Trail junction) | 9.7 | 1,013 | To C.B. Flats and Hoh Lake (14.7), quota; on to the High Divide |
| Lewis Meadow | 10.4 | 995 | 2 + 1 group + stock; the usual first night on the way up |
| 12.4 Mile Camp | 12.4 | 1,283 | |
| 13.1, 13.2, 13.3 Mile sites | 13.1-13.3 | 1,362-1,456 | Beside the High Hoh Bridge gorge |
| Martin Creek | 15.0 | 2,450 | Quota |
| Elk Lake | 15.3 | 2,600 | Quota, 7 + 1 group, no fires |
| (Glacier Meadows ladder) | 17.15 | 4,150 | The washout ladder (3 broken rungs, 1 missing, June 2026) |
| Glacier Meadows | 17.4 | 4,300 | Quota, 11 + 1 group; base camp; ☆ Bonfire Lily |
| (Lateral moraine viewpoint) | ~18.5 | 5,100 | First close view of the Blue Glacier; ☆ |
| (Edge of the Blue Glacier) | ~18.7 | — | 0.2 mi off trail down the moraine wall: cliff, rockfall |
| Caltech Rocks | ~19.6 | unsurveyed | Climbers' camp; blue bags required |
| Snow Dome | ~20.1 | ~6,786 | Climbers' high camp; melt snow; blue bags; ☆ |
| Summit (West Peak) | ~21.8 | 7,980 | Fifth-class summit block |

☆ marks Bonfire Lily places for designers; players never see the mark (10.2).

Everything past Glacier Meadows is an estimate in the data. The park requires blue bags for human waste on Olympus (from the Hoh Visitor Center or the Port Angeles WIC), and there is no camping between Glacier Meadows and the glacier.

**Who can go where past Glacier Meadows.**
- **Anyone** can walk the 1.1 miles of primitive trail to the lateral moraine viewpoint: the first close look at the Blue Glacier and, in the evening, a Bonfire Lily place.
- **Beyond the moraine there are two ways up** (your decision, 2026-10-08): hire Ranger Jon, or go alone at your own risk. The planner allows both and blocks neither.
- **Glacier skill** is the eighth skill (7.3). Every hiker starts it at 0 (12.4). You earn level 1 on a **glacier school** day with Ranger Jon on the Blue Glacier (an optional extra layover on a guided trip: self-arrest, roped travel, crevasse-rescue practice), and it grows on later climbs, guided or alone, like any skill (7.10).

**With Ranger Jon.** Jon is the only guide you can hire. He is a park ranger who guides Olympus on his days off and wears **badge #104**. That is a playful liberty, and Credits say so: real rangers don't guide climbs (12.20). The cabin at home was his once (2.2), though the game never says so out loud. You book him at planning when the summit is on your plan (3.1), on his fixed dates; he may already be booked (a seeded roll by date). His fee shows on the receipt. He meets you at Glacier Meadows the evening before the climb, with the rope (he walks up on his own; it's his day off, and he likes the walk), and from there to the summit and back he is your rope team. You bring the glacier kit (crampons, ice axe, helmet, harness), rented or bought at the gear shop (5.1).
- On Jon's rope a crevasse fall is held, so the crossings are plain percentages with no ♦: the worst case is a cold, frightening hour, never a death. He belays the summit block.
- He is a guide for the ice, not a companion. He doesn't carry your food or fix your pack, and the 17 miles up the Hoh are yours alone: every card below Glacier Meadows treats you as solo.
- **His personality quirk is still to come from you.** Until then his lines use a placeholder, `{JON_QUIRK}`, and content refers to him by id (`people/ranger_jon`), so the quirk drops in without touching a card.

**Alone.** Without Jon you are a party of one, unroped. On the way up the route crosses the Blue Glacier three times, and each crossing is a forced ♦ card with its honest fatal share and a sure way back beside it:
1. **Off the moraine** onto the lower glacier.
2. **The crevasse field below Snow Dome.**
3. **The upper glacier below Crystal Pass**, where a bergschrund opens late in the season.

Each % comes from the crevasse model: month and snow bridges, time of day, crampons, footwear, fatigue and glacier skill. A fail usually means the crevasses stop you (you turn back with a story) or a slide and a cold wait for a ranger (a rescue). The worst band is a fall into a crevasse, and 30% of those falls are fatal (9.5). **Retracing your own track is the sure choice** on every crossing card, and the way down follows it without another roll. That is a deliberate simplification: what the game prices is stepping onto snow you haven't tested.

The **summit block**, a short pitch of fifth-class rock, is a ♦ for a soloist too, but its worst case is a fall and a rescue, never a death. The Olympus climbing route is tagged `real_incident` (9.5), and only the generic crevasse keeps a fatal branch there.

**What going alone costs, equipped.** A soloist with crampons, boots and an ice axe, rested, on a late-July morning, meets roughly ♦ 85% · 0.3% fatal at the first crossing, ♦ 80% · 0.6% at the second and ♦ 78% · 0.7% at the third. (These are the true values. Below glacier 2, July snow bridges show as a range, and the fatal share shows its worst end, 7.10, 8.6.) Going on at all three ends about 1.2% of such trips in death, more than one in a hundred, and a little under half stand on top. That sits under the 3% cap for ambitious but equipped plans, and F.1 holds it there. With Jon, the same day kills essentially no one.

**Anyone can put Snow Dome or the summit on the plan.** The planner allows it, the plan's note offers Jon, and the Trip Outlook says in a sentence what the crossings cost. It is never a hard block. A soloist in day gear meets the first crossing like this, at the edge of the moraine:

> *The moraine ended in a wall of loose gravel, and below it the Blue Glacier lay like a frozen river, cracked into blue rooms.*
>
> `[ Turn back from the ice       sure ]`
> `[ Step onto the ice    ♦ 55%   (i) ]`
> `[       45% stopped · 0.7% fatal   ]`

- **Turn back** is sure. You keep the glacier view (+5) and, if it's evening, a Bonfire Lily place for the night.
- **Step onto the ice** is the 55% shown for late-September day gear: sneakers, no crampons, tired. A fail is 70% a crevasse field that stops you, 25% a slide and a cold wait for a ranger, and 5% a fall into a crevasse, 30% of which are fatal: 45% x 5% x 30% = 0.675%, shown on the button rounded up as 0.7%. (In the hidden gentle mode the same fall ends in a rescue, 9.4.) Past it come the other two crossings and the summit block, as above.

So every crossing offers a sure way back, no plan is refused, and the summit is open to anyone willing to look at the price. Appendix A.7 plays out the day-gear version, and F.1 tests both.

### 4.3 Seven Lakes Basin and the High Divide

*The first playable, built in M1: the whole loop, either way round (your calls, 2026-10-08: "Gotta be B only because I know that hike", then "the 7 Lakes Basin loop either direction and option if drop into basin or stay high I mean every choice needs to be made"; 15).*

From the Sol Duc trailhead the High Divide loop runs about 18.4 miles (data; NPS says 18.2, WTA 19). **Counterclockwise** it climbs past Sol Duc Falls and Deer Lake to the rim of the Seven Lakes Basin and the High Divide, with Mount Olympus face to face across the Hoh valley, then drops past Heart Lake and Sol Duc Park and follows the river home. **Clockwise** it goes the other way round: the river first, then Sol Duc Park and Heart Lake, the crest, and down past Deer Lake.

Every camp is a designated site in the Sol Duc/Seven Lakes quota area (Hoh Lake and C.B. Flats have their own). The online season is Jul 15 to Oct 15; outside it, permits come by phone from the WIC (360-565-3100). Canisters are required, there are no fires above 3,500 ft, and the crest is dry.

**Every choice on the loop is the player's.** Nothing about the route is fixed, at the map table or on the trail:
- **Which way round** (the table below).
- **How long:** a day (the research's hard 18.4-mile day), or one, two, three nights or more, with a layover wherever a camp deserves a second evening. The ranger's fills stop at three nights; longer plans add layovers or camps by hand, from M1a on (15).
- **Where each night is:** any permitted camp on the loop or just off it (the camp tables below), quota and season permitting.
- **The basin or the crest.** Two ways lead down into the Seven Lakes Basin, one on each side of Bogachiel Peak: the **stone staircase** at the rim junction (maintained; 0.9 mi and 540 ft down to Lunch Lake) and the **Mirror Lake way trail** east of the peak (unmaintained, unsigned and easy to miss in fog; 1.1 mi and 530 ft down to Lunch Lake). Drop in, or stay high on the Divide: chosen at the map table (3.1), and asked again on the trail on a fork card with honest numbers (12.12).
- **Side trips:** Bogachiel Peak, Hoh Lake, the edge of Cat Basin, Heart Lake, Round and Clear lakes, Mirror Lake (B.1 has the miles).
- **Changing any of it on the trail,** with real permit consequences (3.7).

| | ↺ Deer Lake first | ↻ River first |
|---|---|---|
| The climb | Steep: about 3,200 ft in 6.9 mi to the rim | Gentler: about 3,350 ft in 8.5 mi to the crest |
| The crest | On day 1 of a short trip, in the afternoon, when thunder likes the Divide | In the morning, from a night at Sol Duc Park or Heart Lake |
| Water | Deer Lake is the last sure water before the dry crest | Heart Lake is the last sure water before the crest |
| The way down | 8.1 mi of river trail from Heart Lake, long and rocky in places (2026 reports: knees, a sprained ankle) | From the rim, 3,200 ft down past Deer Lake in 6.9 mi, steep and rooty, on tired knees |

**Mile** below is the distance from the Sol Duc trailhead along the loop in each direction: ↺ counterclockwise, ↻ clockwise. Basin camps are reached by the staircase going ↺ and by the Mirror Lake way trail going ↻, the shorter way in each case. **Sites** are the groups allowed per night (Recreation.gov, Oct 2026), so they are the quota. The group sites (7 to 12 people: Deer Lake's, Sol Duc Park's, Seven Mile and C.B. Flats) and the Horse Head stock camp are never offered to a solo hiker.

**Up the Deer Lake side**

| Camp (elev, ft) | ↺ mile | ↻ mile | Sites · notes |
|---|---|---|---|
| Sol Duc Falls Camp (2,080) | 1.0 | 1.0 | 3 |
| Hidden Lake (2,830) | 2.3 | 17.5 | Ask at the desk; 0.7 mi up a way trail from mile 1.6 |
| Canyon Creek #1, #2, #3 (2,610-3,370) | 1.9-3.0 | 15.4-16.5 | 1 each |
| Deer Lake (3,530) | 3.7 | 14.7 | 10 · privy; cougar sign reported |
| Potholes (4,080) | 4.7 | 13.7 | 2 · ponds on a heather bench; late-summer water unverified |

**In the basin**

| Camp (elev, ft) | ↺ mile | ↻ mile | Sites · notes |
|---|---|---|---|
| Round Lake (4,260) | 7.6 | 11.5 | 1 |
| Lunch Lake (4,450) | 7.8 | 10.9 | 9 · privy; often full; the basin's water; ☆ early season |
| Clear Lake (4,230) | 8.1 | 11.2 | 1 · 225 ft below Lunch Lake on a way trail |
| Long Lake (3,840) | 8.4 | 11.5 | Ask at the desk; off trail |
| Sol Duc Lake (3,680) | 8.9 | 12.0 | Ask at the desk; off trail |
| Lake Morgenroth (4,130) | 9.0 | 12.1 | In no list: call the WIC (below) |
| Lake #8 | — | — | Not plannable (location unverified) |

**On the Divide**

| Place (elev, ft) | ↺ mile | ↻ mile | Sites · notes |
|---|---|---|---|
| Bogachiel Peak (5,474) | 7.8 | 10.5 | A spur; the big view; no camping; ☆ |
| Hoh Lake (4,520) | 9.0 | 11.8 | 4 · its own quota; 1.2 mi and 670 ft below the crest; the link to the Hoh |
| Heart Lake Junction camp (5,080) | 9.9 | 8.5 | 1 · on the crest; no water; ☆ early season |
| Bruce's Roost (5,100) | 10.6 | 8.9 | Ask at the desk; no water |
| Cat Basin (4,580) | 11.8 | 9.6 | Ask at the desk; primitive trail |

**Down (or up) the river**

| Camp (elev, ft) | ↺ mile | ↻ mile | Sites · notes |
|---|---|---|---|
| Heart Lake (4,780) | 10.3 | 8.1 | 5 · privy; last water before the crest going ↻; ☆ early season |
| Sol Duc Park (4,200) | 11.3 | 7.1 | 4 · privy; a trail shelter |
| Lower Bridge Creek (3,830) | 11.9 | 6.5 | 2 · cold pools below the bridge |
| Sol Duc Crossing, Rocky Creek, Appleton Junction (3,090-3,230) | 12.8-13.5 | 4.9-5.6 | 1 each |
| Sol Duc River #1-#4 (2,210-2,755) | 14.1-16.0 | 2.4-4.3 | 1 each |

(Miles run along the loop through the joined graph. Bogachiel Peak going ↺ is by the short, ledgy west route; the better east spur makes it 8.1. Bruce's Roost and Cat Basin going ↻ are by the Cat Basin cutoff above Heart Lake. ☆ marks Bonfire Lily places for designers; players never see the mark. See 10.2 for the months.)

**WIC-only camps.** Long Lake, Sol Duc Lake, Bruce's Roost, Cat Basin and Hidden Lake (0.7 mi up a way trail off the Deer Lake trail) are listed in the permit system but hidden from online booking. In the game they are **special permit requests**, like Upper Royal Basin: tap an *ask at the desk* row at the map table, take the plan to the WIC on the town run, and the ranger considers it at the counter (in season, granted about 70% of the time midweek and 40% on weekends, a roll seeded by the trip seed, the date and the camp, E.8), with a line about why they're kept quiet (3.1). The WIC's phone line can ask for them too, from the cabin (below). **By milestone:** Bruce's Roost, Cat Basin and Hidden Lake are desk requests from M1a, the vertical slice; Long Lake and Sol Duc Lake, which only off-trail links reach, wait for M1b with the off-trail navigation and the phone, and until then they are pencil rows that can't be tapped (15). Lake #8 can't be planned: its location is unverified and no trail reaches it in the data. It lives in a pencil footnote, and on the phone it gets one line (12.5).

**Lake Morgenroth, your favorite spot, off the menu.** The node is `morgenroth_lake`, at 4,130 ft in the quiet eastern end of the basin; the map spells it Morgenroth, and the data calls it Morgenroth Lake. You camped there once and have been back several times. It is not the first playable's trip and not the vertical slice's destination: it is the loop's secret, and it arrives in M1b (15). It gets three things no other camp gets:
- **You have to call** (your words: *"it's an off menu gotta call"*). It is never in the camp list, a preset, the fills, a first trip or the WIC ranger's talk, and the map shows the lake with no camp mark. The one way to camp there is a phone call to the Wilderness Information Center. The number, 360-565-3100 (the real one, from the region data), is in plain sight and pointed at by nothing: the small print at the foot of the itinerary sheet and the permit (3.1), the cabin's old wall phone by the map table, and a card taped to the WIC counter, each a Look hotspot. Tap it and the call opens. *Ask about a lake*, tap the small lake east of Long Lake, and the voice on the line says *"Morgenroth. Nobody asks for Morgenroth."* Then it is a request like the other WIC-only camps, with the same seeded odds. It works from the cabin and from the WIC counter alike. Tapping the lake on the map gets only a plain Look (*"You see a small lake with no camp mark."*), but the call still works (wireframe in 12.5). The out-of-season *Phone the WIC* card is not this call and never offers it (3.1). The game never dials a real phone, and iOS is never allowed to offer to (E.7, 16).
- **A way trail you vouched for.** The last stretch, from Long Lake, is a primitive but findable way trail (your firsthand report). In the game that means way-trail time (x1.4, 7.4), navigation checks that show a plain % on a clear day, and fragile meadow to stay off (Leave No Trace). The data's figures are still straight-line estimates: 0.6 mi and +290 ft from Long Lake, about 9.0 mi from the trailhead counterclockwise (12.1 clockwise), and the link down from Clear Lake to Long Lake is still marked off-trail (steep scree). Your GPS track (GPX) replaces all of them (E.5). A day visit needs no permit at all: from Lunch Lake it is 2.4 mi there and back.
- **A hand-drawn signature scene** (11.7): boulders and heather in front, the lake, the basin rim in layered bands, and now and then a bear grazing the far shore, as the research says they do. It is drawn from your GPS track, photos and stories once you send them; until then, from the research's art notes (B.7). It is also the best place in the game for a cold IPA (2.6, your call).

The only hint is a rumor: now and then one of the 104 Boyz mentions, on the trail, *"There's a lake past Long Lake nobody books. You have to call for it."* (7.11). Nothing about Morgenroth changes the odds or the score rules: it is a camp like any other, just harder to find. B.7 plays a night there.

**The seven lakes**, for the badge *Seven Lakes, all seven* (M6): Lunch, Round, Clear, Long, Sol Duc, Morgenroth and No Name. You earn it by Looking at each of them on one trip; most are visible from the rim or the basin trail. Ask the WIC ranger how many lakes there really are, and she lowers her voice: *"More than seven. Don't tell anyone."* (Y Lake, Mirror Lake and Lake #8.)

### 4.4 Royal Basin

On the dry northeast side, in the Olympic rain shadow. From the Upper Dungeness trailhead (about 90 minutes from Port Angeles on rough Forest Service roads; a Northwest Forest Pass is needed): the Royal Basin Trail junction at 1.0 mi, Royal Creek Camp at 4.0, Lower Royal Meadow at 6.3, and **Royal Lake at 7.2 mi and 5,100 ft**, under Mount Deception (7,788 ft). Royal Lake is a quota area (about 8 parties a night) with no campfires anywhere in the basin, a composting toilet, a summer ranger station and rodents that chew through packs. **Upper Royal Basin** (about 8.2 mi, 5,700 ft) is a moon-like basin of tarns, talus and late snow. Camping there is by arrangement with the WIC only, which in the game is a special permit request.

### 4.5 Signature trips

Miles are round-trip (or end-to-end) totals from the region files, recomputed from the graph at ingest (E.4). "Level" is the research's difficulty. These are the ranger's presets: *the ranger's favorite trips*, the binder the cabin's old ranger left on the map table (3.1), listing only playable regions; players can build any other itinerary on the graph. The binder never recommends a mistake: a one-night Glacier Meadows trip is listed plainly as "a very long day", and the trap comes from what the player packs. Its Olympus presets all include Ranger Jon; a solo summit is something you build yourself (4.2).

**Seven Lakes Basin and the High Divide (M1, the first playable)**

| Trip | Miles · nights | Level | Best months |
|---|---|---|---|
| High Divide loop in a day | 18.4 · 0 | hard | late Jul-late Sep |
| The loop, 1 night (Lunch Lake or Heart Lake) | 18.4-18.7 · 1 | hard | late Jul-Sep |
| The loop, 2 nights (Lunch + Heart), the classic | 20.4 · 2 | moderate | late Jul-Sep |
| The loop, 3 nights with a layover in the basin | 18.7 · 3 | moderate | late Jul-Sep |
| Seven Lakes Basin explorer | 19.3 · 3 | moderate | late Jul-Sep |
| The loop with a night at Hoh Lake | 20.8 · 2 | hard | late Jul-Sep |
| Deer Lake overnight (from M1b) | 7.4 · 1-2 | moderate | Jul-early Oct |
| Day hike to Sol Duc Falls (from M1b) | 1.6 · 0 | easy | when the road is open |
| Hoh to Sol Duc via Hoh Lake (either direction; from M2) | 24.4 · 2-3 | hard | late Jul-mid Sep |

Every loop preset can be flipped to the other direction and switched between the basin and the crest; the planner recomputes the miles (4.3). The first trip uses the twelve fills instead of this list (3.6, B.1). (The Sol Duc file's version of the traverse adds a night at Lunch Lake, 25.5 miles. Ingest lists it as its own variant, and both directions of the plain traverse use the graph's mileage.) No preset goes to Lake Morgenroth: the only way there is to call (4.3).

**Mount Olympus and the Hoh (M2)**

| Trip | Miles · nights | Level | Best months |
|---|---|---|---|
| First overnight: Happy Four | 11.4 · 1-2 | easy | May-Oct |
| Day hike to Five Mile Island | 10.0 · 0 | easy | Apr-Oct |
| Blue Glacier classic (Lewis Mdw, Glacier Mdws x2, Five Mile Is.) | 37.8 · 3-5 | hard | late Jul-late Sep |
| Slow ramble to the ice | 37.0 · 5-6 | moderate | late Jul-mid Sep |
| Blue Glacier fast, via Elk Lake | 37.0 · 2 | hard | Aug-mid Sep |
| Glacier Meadows, 1 night: a very long day | 34.8 · 1 | hard | Jul-Sep |
| Mount Olympus with Ranger Jon (+1 night for glacier school) | 43.4 · 4-5 | expert | late Jun-mid Aug |
| Mount Olympus, Snow Dome high camp (with Ranger Jon) | 43.6 · 3 | expert | late Jun-mid Aug |

**Royal Basin (M3)**

| Trip | Miles · nights | Level | Best months |
|---|---|---|---|
| Royal Lake in a day | 14.4 · 0 | hard | mid Jul-early Oct |
| Royal Basin overnight | 14.4 · 1 | moderate | mid Jul-early Oct |
| Royal Basin with a layover (the classic) | 16.4 · 2-3 | moderate | late Jul-mid Sep |

**Elsewhere in the park (from M4-M5; a taste of the 150)**

| Trip | Miles · nights | Level | Best months |
|---|---|---|---|
| Hurricane Hill | 3.2 · 0 | easy | Jul-Sep |
| Lake Angeles | 7.0 · 0-1 | moderate | Jun-Oct |
| Grand Valley backpack | 13.1 · 1-2 | moderate | mid Jul-Sep |
| Shi Shi Beach overnight | 6.6 · 1-2 | easy | May-Sep |
| Ozette Triangle overnight | 9.1 · 1-2 | easy | Apr-Oct |
| Third Beach to Toleak Point | 12.8 · 2-3 | moderate | May-Oct |
| South Coast traverse to Oil City | 17.3 · 2-3 | hard | May-Oct |
| Enchanted Valley classic | 36.6 · 2-4 | moderate | Jun-Sep |
| Lake Constance | 13.6 · 1 | expert | Jul-Sep |
| Enchanted Valley in a day: a very long day | 26.2 · 0 | expert | late Jun-Aug |
| Skyline Trail traverse | 46.9 · 5-7 | expert | mid Aug-Sep |
| Bailey Range traverse | unknown · 7-9 | expert | late Jul-mid Sep |

### 4.6 How planning validates an itinerary

Each check becomes a plain note on the permit at the cabin, and a line in the WIC ranger's own words if you stop at the WIC (3.1). Only routing through a **closed trail** is refused outright, and the planner suggests another way.

- **Legal camps.** Every night is at a real camp node that is open on that date under the conditions overlay (4.7).
- **A route exists.** The shortest path by estimated hiking minutes, skipping segments closed on those dates, through any `via` waypoints the plan pins (3.1). Loops offer a direction; `via` pins waypoints.
- **Permits and quotas.** Quota areas (`park_rules.json`): Ozette Coast, Royal Basin, Lake Constance, Upper Lena, East Fork Quinault, Flapjack Lakes, Grand and Badger Valleys, Sol Duc/Seven Lakes/Mink Lake/Cat Basin/Little Divide, Hoh Lake and C.B. Flats, and Elk Lake, Martin Creek and Glacier Meadows on the Hoh. In quota areas: designated sites only. The quota roll is keyed by the trip seed, the calendar date and the camp (E.8), so changing the date re-rolls it, and asking again for the same night on the same trip never does. WIC-only camps are special requests, made at the WIC on the town run or by phone; Lake Morgenroth only by phone (4.3). Dates outside a camp's online window go to a *Phone the WIC* card (with winter rules only from Oct 16 to May 14): a form for the camps already on the plan, not the call (3.1).
- **Group size.** 12 people at most; groups of 7 to 12 need group sites, so a solo hiker never sees them offered.
- **Loops.** A loop plan records its direction and, where the route forks around a basin, which way it goes (`via`, the basin or the crest); every day row shows the result (3.1).
- **Daily load.** Estimated hiking hours at a Regular hiker's pace (7.3); above 9 hours the note says so. Arrival time is compared with trail-dark.
- **Snow.** Snow on the route by date, aspect and snow year (7.6): the note recommends traction or an ice axe.
- **Fires.** Allowed only below 3,500 ft, outside named no-fire areas (all of Royal Basin, Grand Valley, Appleton Pass and Oyster Lake, Hoh Lake, Low Divide, Lake Constance, Lake Angeles, Elk Lake and above, the Ozette coast from Wedding Rocks to north of Yellow Banks), and when no ban is on for that date. The 2026 Stage 2 ban (USFS order Aug 7 to Oct 1) is treated as ended inside the park, because no NPS end date was found; the note says so. Future summers draw a late-summer ban from climatology (4.7).
- **Food storage.** The validator reads each camp's `bear_can_required`. A hard-sided canister is required at every NPS wilderness camp (2026 rule; hangs and soft sacks don't count). The note says so plainly, but a plan with no canister is never refused: it is a broken rule, with its costs on the trail (6.3). At the few national forest camps where the data says it isn't required (Slide Camp on the Gray Wolf, Camp Mystery, Shelter Rock), the note still recommends one.
- **Water.** Dry stretches are flagged (the High Divide crest, the Hoh Lake Trail switchbacks, Grand Ridge).
- **Tides.** Coast plans show the tide gates on the route. With the WIC briefing or `coast` skill 2, the planner computes the windows for you.
- **Road walks and closures,** by date: the Elwha road walk (+6.5 mi to Whiskey Bend) and the Dosewallips washout (+6.5 mi), both open-ended; Staircase's wilderness trails and 14 camps (closed after the 2025 Bear Gulch Fire, open-ended); Six Ridge from Graves Creek to Lake Sundown (closed, open-ended); Mora Road and Rialto Beach (closed through Oct 15, 2026; sources disagree); Lake of the Gods (closed in June 2026 by the Mount Tom Creek Fire near Olympus; status unknown, with a note about smoke on the Hoh).
- **Olympus.** Past the moraine alone: a warning, a note and the offer of Ranger Jon, never a block. Every crossing card offers a sure way back (4.2).
- **Traverses.** A way back to the car (3.7).

### 4.7 Park settings and the calendar

Your call, confirmed 2026-10-08: the real conditions by default, and Timeless one tap away.

- **As researched (Oct 2026)**, the default: real dated closures, road walks, bridge work and fire restrictions, from a conditions overlay (`content/park/conditions/2026.json`). Credits say "Park conditions as researched on 2026-10-07".
- **Timeless park:** closures off. Seasonal patterns that are climate rather than news (snowpack by month, late-summer fire bans, bugs, berries) stay on.

**Which year a trip happens in.** A trip falls in the 12 months after the conditions date (2026-10-07), in the next open season: up to Oct 15, 2026 it is this autumn; after that it is 2027. The year is shown on the date chips and the permit, and all examples in this document use 2027 dates unless they say otherwise. The **conditions date** is the research date of the conditions overlay the build ships with (`conditions/2026.json`, researched 2026-10-07): not the day the build was made, and never the phone's clock. Only a refreshed overlay moves it, and the 12-month window with it, so this build's window ends in October 2027, and a trip planned on this build after that still falls inside it. (The cabin's scene runs on the real clock regardless, 2.2.)

**How dated news ages.** Every overlay entry carries a `from` date, an `until` date or a `persists` flag, and the date it was last confirmed:
- **Dated entries expire.** Mora Road closed through Oct 15, 2026, and the US 101 Hoh River Bridge closed Oct 8 (5 am) to Oct 13 (noon), 2026, affect only trips on those dates.
- **Open-ended entries persist** until the overlay is updated: the Staircase closures, the Dosewallips washout, Six Ridge, the Hoh River Bridge's single lane.
- **Stale entries are told as stale.** Anything past its last confirmation date is given as *"last we heard"* (DRAFT).
- **Fire bans** apply only on their own dates. For a 2027 trip, both settings draw a late-summer ban from climatology, and the note says (DRAFT) *"we'll know closer to the date"*.

---

## 5. The three stores and food

### 5.1 Where things come from

| Source | What it supplies | Notes |
|---|---|---|
| **The shed** (at the cabin) | Your own gear: the catalog's standard-tier items, the traps among them (cotton hoodie, jeans, cast-iron skillet) | Free. Laying out is choosing, not buying. A smaller starting shed is proposed below |
| **The WIC** (Port Angeles, an optional stop on the town run) | The free loaner bear canister (10.1 L, heavy), the briefing, the desk-only camps | The can is a seeded roll: about 70% available on summer weekends, 95% midweek |
| **`{STORE_GENERAL}`**, in the spirit of Swain's | Food, fuel, the beer cooler (21+), and cheap, heavy, bombproof gear | 5.2 |
| **`{STORE_GEAR}`**, in the spirit of Brown's Outdoor | Light, technical gear to rent or buy: canisters, glacier kit, satellite messenger, premium tiers; trail food | Glacier sets limited to 2-3 on summer weekends; pickup the day before |
| **`{STORE_BOUTIQUE}`**, in the spirit of MOSS | Style and morale: wool flannel, an enamel mug, stickers, treats | Shows in your flat lay |
| **Second Growth** (next door to the general store) | A pre-roll (21+) | A fictional licensed cannabis shop: one shelf (2.6) |
| **The last-chance shelf** in Forks | Lunch for a day hike, and anything forgotten, at higher prices | On the drive (3.3) |
| **Ranger Jon** (booked at planning) | A guided Olympus climb and glacier school: the only guide in the game (4.2) | On his fixed days off (he may already be booked); the fee is shown on the receipt; he brings the rope and meets you at Glacier Meadows |

Rentals come from `gear_catalog.json` (`rentals`, `stats.rent_usd_per_day`). **Skills are not rentable:** an ice axe helps only if you can self-arrest, and a rope only helps a trained team of two or more. Ranger Jon is the one exception, because the skill comes with him (4.2).

**A smaller starting shed (proposed).** Today the shed would hold every standard-tier item. Proposed instead: the ranger's sensible kit for the loop, at the standard tier, plus the 18 traps. Everything else is bought, so the flat lay shows where you shop (6.1). Gear lasts as long as the hiker: it stays in the shed while they live, and the full wipe resets the shed (9.8). Your call ([still to come](#still-to-come-from-you)).

### 5.2 The stores

**Three stores in Port Angeles** (decision 27: *"Three stores, ones closely based on swains browns and moss."*). Real businesses inspire the vibe; the in-game names, shopkeepers and lines are fictional and yours to write, unless a store gives permission to use its real name. Until then they are `{STORE_GENERAL}`, `{STORE_GEAR}` and `{STORE_BOUTIQUE}`.

| Store | In the spirit of | Behind the counter | In your flat lay |
|---|---|---|---|
| `{STORE_GENERAL}` | Swain's General Store, open since 1957, selling everything from hardware and clothing to hunting and fishing gear ([Peninsula Daily News](https://peninsuladailynews.com/news/more-of-swains-port-angeles-store-expanding-into-space-left-by-neighbor)) | Plainspoken, proud of things that last; talks price and durability | Plaid, canvas and olive; chunky 2-pixel outlines; heavy shapes |
| `{STORE_GEAR}` | Brown's Outdoor, a family outfitter that *Outside* named the town's best ([Peninsula Daily News](https://www.peninsuladailynews.com/?p=48639)) | Knows the park, weighs things in grams, honest about what's fragile | Slate, teal and titanium; crisp 1-pixel outlines; small, minimal shapes |
| `{STORE_BOUTIQUE}` | MOSS, a downtown boutique of Pacific Northwest clothes and goods ([Wanderlog](https://wanderlog.com/place/details/2251622)) | Warm and style-forward; cares how the trip feels and looks | Moss, sage and alpenglow pink; patterned dithers and a tiny fern motif |

*Fernwood Mercantile*, the old draft name for the single store, could live on as the general store's name, if you like it.

**Why they differ in kind, not only in price.** The game shows prices and has no budget (1.2). With no budget, a cheap tier that is simply worse would never be bought. So:

- **The general store is heavy and bombproof.** A new `bombproof` tag means the item never fails from wear. The canvas tarp shrugs off wind that tears a fragile tent, and the foam pad never punctures.
- **The gear shop is light and technical, and some of it is fragile:** the composite-fabric tent, the 900-fill bag, the carbon poles. The simulation already has their failure chances (the `fragile` and `puncture_risk` tags).
- **The boutique is morale and style:** a small lift at camp each evening, and the look.

Without a budget, buying is choosing whose version you carry. The receipt still shows the money. The Shoestring wallet waits for M6. **The Hike of the Day has no shopping (proposed):** everyone packs from the same standard shed, so the skill on display is choosing what to leave behind.

**Everyone else on the Peninsula.** All private businesses get fictional names. Public places keep real names.
- **Second Growth**, next door to the general store: a licensed cannabis shop (21+). In the game it sells one thing, a pre-roll, and its clerk says the true thing out loud: *"Legal here. Not where you're going."* (2.6). Washington sells cannabis only in licensed shops, which is why it isn't on the general store's shelves.
- **Calawah Grocery & Tackle**, Forks: the last-chance shelf on the drive, at higher prices (3.3).
- **Spit and Sound Outfitters**, Sequim: rentals for the east side, on the way to the Dungeness (M3).
- **The Huckleberry Skillet:** the diner on US 101 (pie on the way out, pie on the way home).
- Lodges, where scenes need them, using the names already in the region files: *The Steaming Fern Lodge* (Sol Duc Hot Springs, whose pools are a Larry moment, 2.6), *Stillwater Lodge* (Lake Crescent), *The Mossback Lodge* (Lake Quinault, down the shore from the cabin).
- **Brands are fictional too:** *Blue Hour Hazy IPA* from Slugwater Brewing Co., and Second Growth's house pre-roll. Lint T03 checks them against real breweries and shops like every other name.

Every one of these names is a draft (decision 21). There is no guide company. The only guide is **Ranger Jon**, a fictional ranger with a fictional side job, booked at planning (4.2), and he has his own voice: *"Ice is honest. It just doesn't tell you everything at once."*

Before shipping, the linter checks every fictional name against a deny-list of real Peninsula businesses, guide services and park staff (lint T03). The deny-list gains Swain's, Brown's Outdoor and MOSS, so a real name never ships by accident.

### 5.3 The shopping screen

**Town** is one screen: a wet street running down to the Strait, three storefronts and the WIC up the hill (12.7). Any door, all of them, or none.

**One list, three ways to fill it.** The same notepad and gauge travel to every counter:
- A **shopping-list notepad** built from the itinerary: Breakfasts ●●○, Lunches ●●●, Dinners ●○○, Snacks, Drinks, Fuel ✓. It checks itself off as you buy, wherever you buy.
- **A canister gauge** on the same notepad: `Canister: 6.4 of 8.6 L · 3.2 days`. Overflow shows the moment it happens, not at the flat lay, with a shopkeeper's line (DRAFT: *"That won't all fit in a can, friend."*).
- **Fill from the list** (one tap) buys a varied menu sized to the itinerary, with no dinner twice in a row, that fits the canister you plan to carry, **from that store's own shelves**: cans and ramen at the general store, freeze-dried meals and bars at the gear shop, treats on top at the boutique. It then highlights 2 or 3 swaps for you to make. It is the default on a first trip (3.6) and always available after. It shows in the flat lay: a row of cans looks nothing like a row of pouches.

**Each store's screen:**
- An illustrated interior (tap the shelves to jump to a category; tap the shopkeeper for advice).
- Rows show name, weight, calories or use, price and a − / + stepper (44 pt targets). Fragile premium items say so on their row. Boutique rows say what they do on the trail (morale, or nothing but looks) and that they show in your flat lay.
- **At the gear shop, tap the scale** to weigh any item, in ounces and grams. Rentals live behind its counter.
- A running **receipt** with real-feeling prices. No budget limit (the Shoestring wallet comes in M6).
- Each shopkeeper comments on silly purchases, in their own voice (DRAFT, the general store: *"Those'll be heavy, friend. Beans are mostly can."*).

**Day hikes** skip the town run and get the *grab lunch* version on the drive, at the last-chance shelf in Forks: one shelf, a sandwich, snacks and water, about three taps. It has no cooler and no door next door: no beer or pre-roll on a day hike (2.6).

**The cooler by the general store's register** (overnight trips only) holds *Blue Hour Hazy IPA* in 16-oz cans. The first can on a trip gets the shopkeeper's ID check (DRAFT: *"Humor me."*), and each can shows its weight and its canister liters on the gauge like any food (2.6). Fill from the list never buys beer: it is always the player's choice.

**Next door** (a door on the town street, overnight trips only): Second Growth's one shelf, the pre-roll, 21+, with the clerk's line about federal land (5.2).

### 5.4 The food data

`food_catalog.json` holds **88 foods**: 49 no-cook, 25 boil, 11 fresh and 3 cold-soak. Each has calories, ounces, liters as sold and repacked, water, fuel, morale (-2 to +3), spoilage and crushability. Traps are realistic and say so in their notes: canned food, a whole watermelon, chips (calorie-light, volume-heavy), a foam noodle cup.

**The two Larry items** (2.6), in the catalog since 2026-10-08 (both brands fictional; 21+, overnight only, `requires_flag: larry`). Only builds with `flags.larry` on (every v1 build) sell them, and the pre-roll waits for M1b:

| Item | Weight · canister | Price · kcal | Notes |
|---|---|---|---|
| *Blue Hour Hazy IPA*, 16-oz can | 17.4 oz full, 0.5 oz empty · 0.55 L, crushed empty 0.05 L | $4 · 270 | Smellable; morale +3; buzzed, -0.3 L water (7.9); 21+ |
| Second Growth pre-roll | 0.2 oz in its tube · 0.015 L | $10 · 0 | Smellable; the munchies and the clock (2.6); illegal on federal land; 21+ |

**How much to bring** (`food_catalog.json` `needs`, for a 165-lb adult):

| Day type | kcal | Example |
|---|---|---|
| Rest or layover | 2,200 | Lunch Lake layover |
| Easy | 2,800 | Hoh TH to Five Mile Island |
| Moderate | 3,300 | Upper Dungeness TH to Royal Lake |
| Strenuous | 4,000 | Hoh TH to Glacier Meadows |
| Summit day | 4,800 | Glacier Meadows to Olympus and back |

Cold nights add 5 to 20%. Most hikers pack 2,500 to 3,500 kcal a day, about 1.75 lb, and run a small deficit, which is normal on trips under a week.

### 5.5 Food has a volume, and the canister has a size

Food rides **inside the bear canister** at night. Its liters count against the canister, not the pack. A canister holds fewer days than people expect: rigid walls leave gaps (only about 85% is usable), and toothpaste, sunscreen and trash need room too (about 0.3 L plus 0.1 L per night).

| Canister | Usable L | Days of food (typical 2.0 L/day) | Weight |
|---|---|---|---|
| Small (7.2 L) | 6.1 | 3.0 | 33 oz |
| WIC loaner / classic (10.1 L) | 8.6 | 4.3 | 44 oz |
| Carbon (10.6 L; the standard's premium tier) | 9.0 | 4.5 | 31 oz |
| Standard (11.5 L) | 9.8 | 4.9 | 41 oz |

Dense food (1.6 L/day) stretches a standard canister to about 6 days; bulky food (2.6 L/day) shrinks it to about 3.5 (3.4 to 3.8 days after smellables). A 16-oz can of beer is a smellable too, and at about 0.5 L it costs a canister a lunch (2.6). **Repacking** is a free action: a freeze-dried pouch drops from 1.5 L to 0.6 L in a zip bag, and the flat lay's canister panel has a one-tap **Repack all food** (6.1).

### 5.6 Small systems that make food matter

- **Morale.** Dinner joy grows with the food's morale and whether it is hot.
- **Food fatigue.** The same dinner on consecutive nights loses one morale point per repeat, which rewards a varied shopping list.
- **Fuel.** About 7 g of canister fuel per half-liter boil plus 1 g per minute of simmering. A 110 g canister gives about 14 boils. Boil meals plus hot drinks use about 24 g a day; melting snow at the Snow Dome uses about 130 g.
- **Spoilage.** Fresh food has a `spoils_days`; the watermelon makes one camp very happy and then becomes a problem.
- **No stove, no fuel or no lighter** turns dinner into *Cold dinner*, with a funny line and less warmth that night.
- **Auto-snacking.** On the trail the hiker eats trail food automatically, up to a **daily allowance**: the calories left divided by the planned days left. An "Eat extra" button appears only when energy is low. No micromanagement.
- **Beer and the pre-roll** are treats with costs, never food the list plans around: a can lifts an evening and buzzes it, a pre-roll brings the munchies, and both ride in the canister (2.6).
- **Running short is a decision, not a surprise.** When the food left falls below 80% of what the rest of the plan needs (an under-shopped layover, an extra night waiting out a river), a morning card asks: *half rations*, *cut the trip short*, *ask the neighbors*, or *skip today's side trip*. The Pack tab shows food left by meal, and the Field Notes compare calories planned with calories burned.

### 5.7 Shelf by shelf, and the new items

The ids are from `gear_catalog.json` and `food_catalog.json`. A tier is the catalog's cheap or premium version of an item, and prices are the catalogs' own. Ingest writes these lists to `stores/stores.json` (E.5).

**`{STORE_GENERAL}`: cheap, heavy, bombproof**

| Shelf | Items |
|---|---|
| Packs | `external_frame_70`, `daypack_20` (trap), `weekender_50` |
| Shelter | `tent_2p_dome` (cheap tier), `tent_3p_dome`, `tube_tent_plastic` (trap), `space_blanket`, `tent_footprint`, new `tarp_canvas` |
| Sleep | `bag_synth_45`, `_30`, `_20`; `bag_flannel_rectangle` (trap); `pad_foam_ccf`, `pad_foam_torso`, `pad_self_inflating`, `pad_inflatable` (cheap tier); `liner_fleece` |
| Clothes | The cotton traps (`tee_cotton`, `jeans_denim`, `hoodie_cotton`, `socks_cotton`); `socks_wool_hiking`, `sweater_wool_vintage`, `fleece_jacket`, the synthetic base layers, `pants_convertible`, `beanie_wool`, `gloves_liner`, `bandana_cotton`, `ball_cap`; new `flannel_cotton`, `wool_pants_surplus`, `blanket_wool` (plain) |
| Rain | `rain_jacket` and `rain_pants` (cheap tiers), `poncho` and its plastic tier, `pack_liner_compactor`, `zip_bags_gallon` |
| Feet | `boots_leather`, `sneakers_canvas` (trap), `flip_flops`, `camp_shoes_foam` |
| Kitchen | `stove_canister` (cheap tier), the three fuel canisters, `pot_aluminum_1_3l`, `skillet_cast_iron` (trap), `mug_insulated`, `cold_soak_jar`, `lighter_mini`, `matches_storm`, `firestarter_cubes`, `camp_soap_scrubber` |
| Water | `bottle_disposable_1l`, `bottle_hard_1l`, `water_bag_3l`, `tablets_chlorine_dioxide` |
| Tackle and tools | `fishing_rod_spinning`, `tide_table` (by the tackle), `knife_folding`, `multitool`, `hatchet` (trap), `paracord_50ft`, `duct_tape_roll` (trap), `whistle`, `trekking_poles` (cheap tier), `traction_chains` |
| Light, nav | `headlamp` (cheap tier), `flashlight_big` (trap), `batteries_spare_aaa`, `compass_button`, `watch_basic`, `map_park_brochure` (free, in a rack) |
| Sundries | `first_aid_basic`, `sunscreen`, `lip_balm_spf`, `bug_repellent`, `hand_sanitizer`, `toiletry_kit`, `wet_wipes`, `deodorant` (trap), `toilet_paper_kit`, `hand_warmers` |
| Fun | `playing_cards`, `flying_disc`, `harmonica`, `camera_disposable_film`, `speaker_portable` (trap), `camp_chair_ultralight` (its 96-oz car-chair tier) |
| Food | Every food sold at `grocery` (74 of them), new `smoked_salmon`, and the beer cooler (21+, ID checked) |

**`{STORE_GEAR}`: ultralight, technical, pricey, sometimes fragile**

| Shelf | Items |
|---|---|
| Packs | `daypack_28`, `fastpack_35`, `weekender_50`, `ultralight_55`, `trekker_65`, `expedition_80` |
| Shelter | `tent_1p_trekking_pole` and its Cloudspun tier; `tent_2p_dome` and its Featherdome tier; `tent_4season`, `tarp_flat`, `bivy_sack`, `emergency_bivy`, `hammock_system`, `stakes_sand_snow` |
| Sleep | The down bags in every tier; `quilt_down_30`, `_20`; `pad_inflatable` and its R 7 tier; `pillow_inflatable`, `liner_silk`, `compression_sack` |
| Clothes | `tee_synthetic`, `tee_merino`, the merino base layers, `pants_hiking`, `shorts_hiking`, `underwear_synthetic`, `socks_liner`, `socks_waterproof`, `booties_down`, `fleece_grid_hoody`, `puffy_down` (every tier), `puffy_synthetic`, `vest_down`, `pants_down`, `wind_shell`, `balaclava`, `gloves_insulated`, `neck_gaiter`, `sun_hoody` |
| Rain | `rain_jacket` and `rain_pants` (standard and premium), `poncho_tarp`, `umbrella_trekking`, `pack_cover`, `pack_liner_drybag`, both dry bags |
| Feet | `trail_runners`, `boots_mid_waterproof`, `boots_mountaineering` (to rent), `sandals_sport`, both gaiters |
| Kitchen | `stove_canister` (standard and premium), `stove_integrated`, `stove_alcohol`, `stove_white_gas`, every fuel, `pot_titanium_750`, `spork_titanium`, `windscreen`, `coffee_pour_over` |
| Water | The three filters, `purifier_uv`, both chlorine dioxide options, `bladder_2l` |
| Nav, power | `map_topo_park`, `map_coast_strip`, `compass_baseplate`, `gps_handheld`, `app_offline_maps`, both power banks, `satellite_messenger`, `watch_altimeter`, `guidebook_olympics`, `solar_panel_small` |
| Safety, repair | `first_aid_complete`, `blister_kit`, `meds_kit`, `splint_moldable`, the four repair kits, `seam_sealer`, `signal_mirror`, `bear_spray` |
| Snow, glacier | `trekking_poles` (standard and carbon), both crampons, `ice_axe` and its light tier, `snowshoes`, `helmet_climbing`, `harness_alpine`, `rope_glacier_30m`, `crevasse_rescue_kit`, `avalanche_kit` |
| Food storage | The three canisters and the carbon tier, to buy or rent; `odor_proof_bags`; `bear_sack_soft` and `hang_kit` (traps: sold here, not park-approved, and the staff say so) |
| Camp | `trowel`, `wag_bags`, `sit_pad`, `camp_chair_ultralight`, `pack_towel`, `earplugs_eyemask`, `bug_headnet`, `permethrin_treatment` |
| Toys | `fishing_kit_fly`, `binoculars`, `camera_compact`, `camera_dslr`, `planisphere`, `drone_mini` (trap: sold, but prohibited in the park) |
| Food | Every food sold at `outfitter` (35 of them): freeze-dried meals, gels, chews, bars, drink mixes |
| Rentals | Everything with `rent_usd_per_day`. Glacier sets are capped at two or three on summer weekends (5.1) |

**`{STORE_BOUTIQUE}`: style and morale**

| Shelf | Items |
|---|---|
| Wear | New `flannel_wool`, `beanie_moss`, `trucker_cap`, `socks_wool_pattern`, `bandana_print`; `sun_hat` |
| Camp | New `enamel_mug` and `blanket_wool` (patterned); `coffee_pour_over` |
| Paper and art | `book_paperback` (local writing), `sketchbook_pocket`, both pencil sets, `watercolor_kit`, `journal_waterproof`, the four field guides, `planisphere`, new `cards_pnw` |
| Music and toys | `harmonica`, `ukulele`, `camera_disposable_film`, `flower_press` (trap: sold as decor, though picking plants is prohibited in the park) |
| Stickers | New `sticker_sheet`, `pack_patch` |
| Packs | New `rucksack_waxed_25` |
| Treats | New `chocolate_fancy`, `coffee_local`, `smoked_salmon`, `huckleberry_candy` |
| For the dog | New `dog_bandana`, for the cabin only: dogs aren't allowed on park trails (`park_rules.json`) |

**New items the catalogs need.** The weights and prices are proposals. Calories for the new foods are still to research from real labels before ingest, and every name is a draft.

| Id | Store | Weight · price | Why |
|---|---|---|---|
| `tarp_canvas` | General | 64 oz · $49 | Bombproof shelter: heavy, never tears |
| `flannel_cotton` | General | 12 oz · $29 | The flannel look, cotton inside: a soft trap |
| `wool_pants_surplus` | General | 24 oz · $35 | Surplus wool: heavy, warm when wet |
| `blanket_wool` | General, Boutique | 64 oz · $59 or $189 | Warmth at camp, heavy; also a flat-lay backdrop |
| `flannel_wool` | Boutique | 14 oz · $79 | The same look in wool: warm when wet, a little morale |
| `beanie_moss` | Boutique | 2 oz · $38 | A style twin of `beanie_wool` |
| `trucker_cap` | Boutique | 2.5 oz · $34 | A style twin of `ball_cap` |
| `socks_wool_pattern` | Boutique | 6 oz · $36 | A style twin of `socks_wool_hiking` |
| `bandana_print` | Boutique | 1 oz · $18 | Morale and style |
| `enamel_mug` | Boutique | 6 oz · $28 | Heavier than the insulated mug; the hot drink lifts morale |
| `cards_pnw` | Boutique | 3 oz · $15 | A style twin of `playing_cards` |
| `sticker_sheet` | Boutique | 0.2 oz · $8 | Decorates the can, bottles and pack in the flat lay |
| `pack_patch` | Boutique | 0.3 oz · $12 | Shows on the pack sprite on the trail |
| `rucksack_waxed_25` | Boutique | 40 oz · $189 | A beautiful day pack with no hip belt: it carries like a trap |
| `chocolate_fancy` | Boutique | 3 oz · $6 | A treat, morale +3 |
| `coffee_local` | Boutique | 0.7 oz a day · $2 | A morale twin of `coffee_ground` |
| `smoked_salmon` | Boutique, General | 3 oz · $9 | Smelly, morale +3 |
| `huckleberry_candy` | Boutique | 3 oz · $7 | A treat |
| `dog_bandana` | Boutique | — · $16 | Cabin only: the dog wears it |

**Four new fields on every item:**

- **`origin`:** the shed or one of the three stores.
- **`look`:** a palette pair, a dither pattern and an outline weight, for the flat lay (6.1).
- **`bombproof`:** a new tag. The item never fails from wear.
- **`style`:** a new tag. The look, with little or no effect on the trail.

The catalog item *Town Book Bag 20* is a school bag, not a book frame, so it keeps its name unless you'd rather rename it.

---

## 6. Packing: the flat lay

### 6.1 The flat lay: the packing screen

**What it is.** The night before a trip, backpackers lay everything out and photograph it from above. You asked for that ethos (decision 26: *"you know how people will take a picture of all their stuff laid out before a trip to post on instagram? That's the best. I want that ethos."*). It has a name and a history: "knolling," arranging things at right angles in a grid, was named by a janitor in Frank Gehry's furniture shop, after the Knoll furniture the shop was building; 1987 is the commonly cited year ([Kinfolk](https://www.kinfolk.com/stories/word-knolling/)).

In this game **the flat lay is the packing screen itself**, not a picture of it. You reach it from the shed at the cabin (2.2), the evening before you leave. Everything laid out on the deck goes; everything in the shed stays. It is the screen players will share (6.10), and the wireframe is in 12.8.

**Backdrops.** The default is the cabin's deck boards. Two others:
- **the tailgate,** at the trailhead's last look (3.3, 12.10), where only the pack and the car trade items;
- **the patterned wool blanket,** once you own it (`blanket_wool`, 5.7).

**Art direction.**
- **Straight down, lit from the upper left.** A 1-pixel shadow falls lower right, in the backdrop's shadow color.
- **Deck boards:** weathered silver (a glacier blue and slate dither), with ink seams and the odd bark knot. **Tailgate:** slate with a ribbed liner (`hlines`). **Blanket:** brick and paper-cream stripes, copying no real blanket's pattern.
- **Items:** flat fills, one highlight band on the lit side, and a dither for texture: `checker` for fleece, `hlines` for ripstop, `brick` for wool knit, `diag` for canvas (11.4).
- **Outlines show where you shopped:** 2-pixel bark for the general store, 1-pixel ink for the gear shop, 1-pixel with a pattern fill for the boutique (5.2). Shed items keep plain outlines.
- **The rain jacket is rust:** the same jacket the hiker wears on the trail (11.6). **Gold never appears** (11.1).
- **The scale.** One picture pixel across is about half an inch, and one row about 2/7 of an inch (the wide AGI pixel), so the 160 x 240 lay is about 80 by 69 inches, a section of deck. Things are drawn at their true relative size, with a 3 x 6 pixel minimum.

**Layout rules.**
1. **Right angles only.** Everything turns 0° or 90° and lines up with the boards.
2. **Fixed zones,** so players learn where to look:
   - **top:** shelter on the left, the pack in the middle (the anchor, drawn to its liters), sleep on the right;
   - **middle:** clothes and rain on the left, the kitchen and water in the middle, the worn row on the right;
   - **lower:** the open bear can with its lid beside it and the food around it, then the small kits;
   - **bottom edge:** the fun row (book, camera, mug, stickers, ukulele).
3. **The worn row lies head to toe,** like an outfit on the floor: hat, shirt, shorts, socks, shoes.
4. **Gutters are 2 pixels and 2 rows.** Inside a zone, the biggest item goes first, in checklist order. Pairs and sets line up: socks paired, bottles in a row.
5. **Food is grouped by meal** in rows around the can (breakfast, lunch, dinner, snacks), so you can count the days at a glance.
6. **When a zone overflows,** it borrows from its neighbor. When the whole lay is full, the gutters shrink to one pixel, and small items gather into their kit bags, which a tap fans out.
7. **The layout is deterministic:** the same kit always draws the same picture, so a share can be reproduced.

**How you pack on it.**
- **The drawer below the picture is the shed,** grouped by the ranger's checklist rows: Shelter, Sleep, Rain, Warmth, Kitchen, Water, Light, Navigation, First aid, Extras. Each item lives in exactly one group. The long tail of the 217 items, and the traps, sit in a collapsed **More from the shed** at the bottom.
- **Two taps move things.** Tap a row in the drawer to lay the item out (a *bloop*); tap an item on the deck to put it back in the shed.
- **A long-press opens the item's card:** its weight and volume, its store, its state (wet, patched, used up) and where it rides.
- **Choosing a place.** Where an item rides is the **slot picker** (12.9), opened from the item's card. It lists only the legal places for that item, each with its cost: *Inside (stuffed in its sack: 3.1 L)*, *Bottom straps: may snag; wet without a dry bag*, *Top strap: top-heavy, -4 on footing*. The picker is optional: the game picks the sensible place by default, and items riding outside are drawn beside the pack with a small strap mark.
- **Tap the bear can** for the canister panel (12.9): food liters against usable liters and days of food (`Food 7.1 of 8.6 L · 4.1 days · smellables 0.5 L`), with **Repack all food** as one tap. The can-packing minigame opens from here too (decision 30; its rules are being written in).
- **The water stepper** sets liters carried in 0.5 L steps, up to your bottles' capacity, and shows the weight (2.2 lb per liter).
- **The ranger's checklist** is a corner chip, from the list the cabin's old ranger pinned inside the shed door: the ten essentials plus what this region and month expect, ticking as you lay things out. It never packs for you. On a first trip, its items show as chalk outlines on the deck (3.6).
- **The checklist reads the forecast.** When showers are forecast and the rain jacket is still in the shed, its row says so in one dry line (DRAFT: *"Showers Thursday. The jacket is in the shed."*); a September high camp with no warm layer gets the same. When everything is fine, the checklist says nothing, which is the best feedback in the game.
- **Like last time** reloads this hiker's previous kit. On a first trip, including a new hiker's first trip after a death, the checklist's outlines are chalked on the deck instead (3.6).
- **Pack it** flies everything into the pack, checks the volume ("won't close" is still one of the three hard blocks, 6.3), and runs the Trip Outlook with this pack (3.2). Then the pack leans against the car at the cabin (2.2).

**The numbers, always live:**

| Number | What it counts | Why |
|---|---|---|
| Base weight | Everything packed, minus food, water and fuel, and minus worn items | The hardcore crowd's number. The usual marks are under 20 lb (lightweight), under 10 (ultralight) and under 5 (super ultralight): conventions, not rules ([REI](https://www.rei.com/learn/expert-advice/ultralight-backpacking-gear-essentials.html)) |
| Pack weight | Base plus food, water and fuel, with the felt-load word (6.4) | What the simulation's felt load reads (6.3) |
| Worn | Shoes and the outfit you start in | Counted apart, as gear lists do |
| Liters, can | Inside liters of the pack; can liters and days of food | The two hard fits (6.3) |
| From | Items from the shed and from each store | The style read, and the share image's store marks |

**Worn items need a lead call.** Today every item counts toward the pack. Proposed: a `worn` place for footwear and one outfit. Worn things leave the pack's weight and liters, and footwear keeps its own effect on pace. It is a small change in the simulation, and every serious backpacker will expect it. Your call ([still to come](#still-to-come-from-you)).

**Building it.** About 80 top-down stamps for M1a: the roughly 60 gear items in play (14.1), the 8 packs and about 12 food groups, with style twins reusing a stamp with a palette swap. They are drawn in the picture VM like any stamp and judged as PNGs (11.8). The layout is a shelf-packing pass per zone, in a few milliseconds. The gauges are the same numbers the old pack screen computed: nothing in the simulation changes except the worn place.

### 6.2 The packs

From `gear_catalog.json`. The load rating is the weight the frame and hip belt carry well.

| Pack | Liters · rating | Frame | Character |
|---|---|---|---|
| Town Book Bag 20 | 20 · 10 lb | none | A trap: canvas soaks up rain, no hip belt |
| Ridge Runner Daypack 28 | 28 · 18 lb | framesheet | A good day pack |
| Featherline Fastpack 35 | 35 · 22 lb | framesheet | Light and fast, little room |
| Lake Basin Weekender 50 | 50 · 32 lb | internal | The sensible 2-4 night pack |
| Thru-Line Ultralight 55 | 55 · 30 lb | framesheet | Light, rain-resistant, unforgiving |
| Hurricane Ridge Trekker 65 | 65 · 42 lb | internal | Big and patient |
| Blue Glacier Expedition 80 | 80 · 55 lb | internal | For Olympus kits |
| Grandpa's External Frame 70 | 70 · 45 lb | external | $35, lots of straps, snags on everything |

### 6.3 Four limits

**1. Volume (hard).** Inside liters = the sum of inside items (compressed when stuffed in a sack) plus 8% dead space around rigid items (canister, pot).

| Fill | State | Effect |
|---|---|---|
| ≤ 85% | Roomy | none |
| ≤ 100% | Snug | none |
| ≤ 110% | Stuffed | +10 min packing each morning; lid barely closes |
| > 110% | Won't close | You can't leave until something comes out or goes outside |

**2. Outside slots (hard count, real penalties).** Each pack lists its side pockets, front mesh (liters), bottom straps, top strap, tool loops and compression straps.

| Slot | Takes | Penalty |
|---|---|---|
| Side pockets | Bottles, poles, tent poles | none |
| Front mesh | Soft items: rain gear, sandals | Gets wet in rain; small snag chance |
| Bottom straps | Pad, tent, bag in a dry bag | Bulky; wet unless waterproof; snags on brush and blowdown |
| Top strap | Canister, pad, rope | Canister on top is top-heavy: -4 on footing |
| Tool loops | Ice axe, poles | none |

Each **bulky outside item** costs -3 on footing, ladder, ford and headland checks (cap -10). With three or more, the voice calls you a Christmas tree. A down bag strapped outside without a dry bag has an 8% chance per rain-hour of getting wet, and a wet down bag keeps only a quarter of its warmth. An inflatable pad strapped outside in brush can puncture (patchable only with a repair kit).

**3. The bear canister (required by the park).** The park requires one for every overnight at NPS wilderness camps, and it is the only legal place for food and smellables at night. It caps food days (5.5). It is the park's rule, not a fourth hard block: rules can be broken (1.2), so an overnight with no canister is allowed. All its food then counts as food that doesn't fit, every night, and a ranger who comes by (the permit check, 2.6) adds a ranger card about the rule. **Food that doesn't fit** triggers the night visitor roll, shown honestly on the evening screen: coast raccoons 40%, mice at popular camps 30%, bears 5% (10% in August-September berry country). Food left out costs Leave No Trace -5 a night whether or not anything comes (9.6). A visitor eats the overflow, Leave No Trace drops (-15), and if a bear got it, a ranger card follows and the region remembers (9.8).

**4. Weight (soft), as two ratios.**
- **Pack ratio** = pack weight / the pack's load rating. It says how well this pack carries this load: above 1.3 the straps cut in (footing and ford -5, feet wear faster, spirits dip), above 1.6 it's -10.
- **Body ratio** = pack weight / (25% of body weight). It says how much this person can carry, whatever the pack.
- **The felt load** `r` is the larger of the two, and drives the words, pace and energy in 6.4.
- **The only weight block** is a body ratio above about 2.4, which is about 60% of body weight: 99 lb for the 165-lb hiker. *"You can't lift it onto your shoulders."* A 21-lb load in a 10-lb book bag is miserable, not impossible.
- Body weight is a state variable, `body_lb`, fixed at 165 lb in v1 (it also scales food needs, 5.4). Every hiker is the same size, as every hiker starts the same (12.4).
- Water counts at 2.2 lb per liter, so "carry 3 L for the dry crest" is a real decision.

### 6.4 What the weight feels like

| r (felt load) | Word | Spring-scale words | Time on trail |
|---|---|---|---|
| ≤ 0.6 | Light | *light as a jay* | x0.90-0.94 |
| ≤ 1.0 | Comfortable | *a comfortable load* | x1.00 |
| ≤ 1.3 | Heavy | *heavier than it looked at home* | up to x1.14 |
| ≤ 1.6 | Very heavy | *like carrying a second, smaller hiker* | up to x1.29 |
| ≤ 2.0 | Brutal | *a whole elk calf, and it has opinions* | up to x1.67 |
| > 2.0 | Crushing | *the straps had stopped being polite hours ago* | up to x2.0 |

Heavier also means hungrier, wobblier on ladders and harder on knees on the way down.

### 6.5 Pack tags: how the pack talks to the story

The gear catalog defines 222 item tags (`tag_glossary`). **Tag rules** turn the packed set into about 40 **event tags** and a few numbers that every card reads. Cards never name an item, so new gear needs no card edits, and every card responds to every loadout. Every catalog item maps to at least one event tag (F.3).

| Rule kind | Example output |
|---|---|
| Sum | `insulation`, `water_cap` (liters) |
| Best of | `sleep_rating` (°F), `light` (headlamp > phone > none) |
| Combination | `nav` = map and compass when both are packed; `hot_meal` = stove + fuel + lighter |
| Placement | `outside_bulky`, `top_heavy` |
| Fit | `food_overflow`, `over_volume_l` |
| Load | `pack_lb`, `pack_ratio`, `body_ratio` |
| Condition | a wet item adds `<tag>_wet` and loses warmth; a dead battery removes its tags |

The core event tags: `rain_top`, `rain_bottom`, `insulation`, `sleep_rating`, `pad_r`, `shelter` (tent, tarp, bivy, none), `light` (headlamp, phone, none), `water_treat` (filter, chemical, boil, none), `water_cap`, `nav` (map, map and compass, GPS, none), `traction`, `ice_axe`, `rope`, `glacier_team` (a rope team with glacier skill: in v1, only Ranger Jon), `tide_table`, `time_source`, `first_aid` (1, 2), `blister_kit`, `sun`, `bug`, `stove`, `fuel`, `canister`, `food_overflow`, `camp_clothes_dry`, `camp_shoes`, `messenger`, `poles`, `outside_bulky`, `top_heavy`, `camera`, `binoculars`, `id_book`, `luxury`, `waterproofing` (liner, cover, none), `pack_liner`, `dry_bag`. The Larry moments (2.6) read five more: `towel`, `trowel`, `sleep_aid` (earplugs), `beer` and `pre_roll`. These names are canonical: the content schema (`schemas/`) keeps the one list, and every card, rule and table uses its names.

### 6.6 Chekhov's pack: combinations, not single items

Every item has at least two moments where having it, lacking it, or its state (wet, lost, outside, used up, out of battery) changes a stop. Many checks read **sets**:

- Stove + fuel + lighter = a hot dinner and a hot drink in a crisis. Stove + fuel and no lighter = a funny stop and maybe a kind neighbor.
- Crampons + ice axe + helmet + harness + a rope team (in v1, Ranger Jon) = glacier-ready. Any one alone does little; the kit without Jon still sharpens a soloist's crossings (4.2).
- Camp shoes + trekking poles = good fords.
- No rain pants + west side + showers = wet legs, then a damp camp, then a cold night (the Soggy Day chain, 8.10).
- Cotton socks + a ford + a cold night = blisters and misery.
- Food left out + a Canada jay = theft.
- Tide table + a watch or a phone with battery = exact odds at headlands. Tide table alone, no time source = still guessing.

The trip report's gear notes, **What the pack taught**, list what you used every day, what you never used, and what you wished for (9.7). That lesson feeds the next trip's flat lay: the checklist in the shed gains a line, and the WIC ranger remembers it, for as long as the hiker lives (9.8).

### 6.7 Trade-offs that bite

| Dilemma | Choose A | Choose B |
|---|---|---|
| A 50 L pack: canister + bulky synthetic bag + tent is 3 L over | Strap the tent outside: snags, wet fly, ladder -3 | Leave the puffy: colder evenings |
| Rain pants vs. a fourth food day in a full canister | Short on food the last day | Wet legs in showers and wet brush; colder night |
| Ice axe for early-July avalanche chutes above Elk Lake | +25 on snow traverses, 17 oz on a tool loop | Turn-back card likely |
| A day pack "for one night" | — | No room for bag, tent or canister (Appendix A) |
| Extra water on a dry crest | 3 L: +6.6 lb | 1 L: parched by the crest |
| Camp chair vs. dry camp clothes | Layover joy | Warmth reset at camp; feet recover |
| A 16-oz IPA for the lake (2.6) | A big evening at a beautiful spot; +1.1 lb; 0.5 L of canister; buzzed until bed (8.5) | A lunch's room in the canister, and a clear head on the evening's scramble |
| A 2-oz towel | Dry in a minute after a swim; the skinny dip stays a story | Air-dry, fine by day; at dusk, the start of a cold evening (2.6) |
| Foam pad outside vs. inflatable inside | Never fails, but snags and gets wet | Warmer; punctures only if strapped outside |
| A joy item: a paperback, a deck of cards, a camera, binoculars or an ID book (wildflowers, trees, birds, tide pools; a paperback you carry, and nothing is collected or logged) (3-40 oz) | Spirits on quiet evenings; a photo for the trip report; wildlife from a safe distance; Look boxes that name what you see | Leave them home: lighter, and the evenings are just evenings |

### 6.8 Sample kits computed from the catalog

From `gear_catalog.json` `pack_guidance.sample_kits_computed` (165-lb hiker):

| Kit | Pack | Weight | Notes |
|---|---|---|---|
| Sensible day hike | Daypack 28 | 11.0 lb | All ten essentials, r = 0.61 |
| Seven Lakes, 3 nights, August | Weekender 50 | 28.1 lb | 35.8 L inside, r = 0.88 |
| Blue Glacier climb, 5 nights | Expedition 80 | 52.1 lb | Heavy; the catalog splits the rope with a partner (in v1, Ranger Jon brings it) |
| **Day gear to Olympus, 1 night (the trap)** | Daypack 28 | 10.4 lb | Canvas sneakers, cotton tee, jeans, cotton hoodie, a brochure map, a phone, one bottle and the WIC canister; missing 6 of the ten essentials |

The trap kit (`olympus_day_gear_one_night_TRAP`) is **the canonical day-gear kit**: Appendix A uses it, and so does the F.2 assertion.

### 6.9 The traps

Eighteen catalog items are tagged `trap`: cotton tee, jeans, cotton hoodie, cotton socks, canvas sneakers, flannel sleeping bag, plastic tube tent, cast-iron skillet, brochure map, big D-cell flashlight, a whole roll of duct tape, hatchet, deodorant (a smellable), portable speaker, mini drone (prohibited in the park), soft bear sack (not approved) and hang kit (hanging food is prohibited in the park), and a **wooden flower press**, which has nothing legal to press: picking plants is prohibited in the park.

### 6.10 Sharing the flat lay, and a gear list

**The share image** (wireframe in 12.8) is the signature share: the flat lay as a picture, ready for the photo backpackers post the night before.

- **Size:** 1080 x 1350, Instagram's usual portrait size (4:5, per [third-party guides](https://dimensions.com/element/instagram-feed-images-portrait); Instagram's own help page wasn't found).
- **The picture uses whole pixels.** The 160 x 240 flat lay at 6 x 4 device pixels per picture pixel is 960 x 960, close to the 7 x 4 shape the phone shows.

| Band | Height | Contents |
|---|---|---|
| Top | 150 px | A paper-cream permit strip: permit number, route, dates, nights, direction. A day hike shows *day hike* and no number |
| Picture | 960 px | The flat lay, with 60 px of deck boards either side |
| Bottom | 240 px | Base weight, pack weight, can and days, liters; the store marks; the hiker's name (optional); *Olympic Peninsula Hiker* and `fernforager.github.io/104-boyz` in small type |

- **The text is drawn into the PNG** with the pixel fonts at whole-number scales. Its wording is yours (DRAFT until approved).
- **The file is small.** The palette is the 16 colors, and the repo's own PNG encoder (`tools/png.mjs`) can write an indexed file in the browser.
- **A Hike of the Day version** heads its strip with the day instead of a permit. The trip report's own card is in 9.7.
- **How it reaches the share sheet:** `navigator.canShare({ files })`, then `navigator.share`. Safari has supported sharing files since iOS 15 ([Adactio](https://adactio.com/journal/15972)). The fallback is the image on a sheet with "press and hold to save" (DRAFT); the usual no-callout rule is lifted on that one image. Both paths are tested on your phone (F.5).
- **Privacy.** No location and no real names. The hiker's name is an in-game name and can be switched off.
- **Beer and the pre-roll** may show in a deck flat lay (no car in frame), never in a tailgate one (2.6, T05).

**A gear list for the spreadsheet crowd.** *Copy gear list* (DRAFT) puts the kit on the clipboard as CSV, in LighterPack's columns, so gram-counters can paste it into the tools they already use: item, category, description, quantity, weight, unit, worn and consumable. LighterPack's exact header row is not confirmed, so the first step is to export a real list and copy its header. It is cheap, and it can wait for M1b.

---

## 7. Simulation

One deterministic, seeded simulation sits under the screens. The player sees words, pictures and honest numbers; the debug overlay (and, from M6, a Notebook setting) shows the raw values. Full formulas are in `simulation.md`; this section fixes the design, and wins where the two differ.

### 7.1 Clock and beats

- **Tick** = 15 minutes. Each tick runs movement, weather, body meters and the delayed-consequence queue.
- **Beat** = a stop the player sees. Beats sit at landmark nodes (camps, junctions, bridges, fords, passes, headlands), in mid-segment slots (0 to 2 per segment, by hiking time) and at forced moments (thresholds crossed, delayed consequences due, darkness).

### 7.2 Daylight and darkness

Computed for 47.9°N with Pacific time (full table in `data/daylight.json`):

| Date | Sunrise | Sunset | Civil dusk |
|---|---|---|---|
| Jul 15 | 5:32 | 9:11 pm | 9:50 pm |
| Aug 15 | 6:11 | 8:29 pm | 9:03 pm |
| Sep 15 | 6:53 | 7:28 pm | 7:59 pm |
| Oct 1 | 7:15 | 6:55 pm | 7:26 pm |
| Oct 15 | 7:35 | 6:28 pm | 6:59 pm |

**Trail-dark** is when headlamp rules start: civil dusk minus 25 minutes under dense rain-forest canopy, minus 10 in mixed forest, at civil dusk on open meadow, crest, beach or snow, and 15 minutes earlier under heavy overcast.

After trail-dark, travel time is multiplied: **headlamp x1.35** (x1.5 on primitive trail), **phone light x1.6** (and about 12% battery an hour), **no light x2.5** and only on maintained trail or beach. Elsewhere, no light means you stop where you are, and that becomes a "night under the stars", told by the night model (7.9). If that night is cold enough to kill, its bedtime screen is a ♦ with a sure choice beside it (9.5).

### 7.3 The hiker

| Meter | Shown as | Driven by |
|---|---|---|
| Energy (with a ceiling) | Legs: Fresh, Steady, Tired, Spent, Bonked | Miles, climb, load, food, sleep |
| Warmth (core-temperature proxy) | Warm: Toasty to Hypothermic | Air, wind, layers, wetness, activity |
| Wet | Dry, Damp, Wet, Soaked (glyph when not dry) | Rain x (1 - protection), wet brush, fords, sweat |
| Hydration | Thirsty, Parched, Dehydrated (glyph when bad) | Sweat, heat, carried water |
| Feet | Happy, Hot spot, Blister, Shredded | Miles, wet socks, boots, load |
| Spirits | Heart: ♥ to ♥♥♥♥♥ | Views, dinners, swims, rain, mishaps |
| Calories | "hungry" hints | Burned minus eaten; lowers the energy ceiling |

Plus injuries and illness, body weight (`body_lb`, 165 in v1), **fitness** and **eight skills**: footing, navigation, river, snow, coast, campcraft, first aid and **glacier** (4.2). **Every hiker starts the same** (your call: a name and nothing else, 12.4): Regular fitness, 165 lb, and beginner's skills, level 1 in each except glacier at 0. The other four fitness levels (Easygoing, Casual, Strong, Mountain goat) stay in the engine for the harness and are never offered. Skills grow across trips for as long as the hiker lives, and a death resets everything (9.8).

The caption line shows four plain conditions (Warm, Legs, Feet, Heart) and adds a Wet or Thirsty glyph only when it matters. **Two bad conditions at once** trigger a ranger-voice nudge (DRAFT: *"It might be time to think about the way home."*), always with a sure choice: Turn back, or, where the way back is itself rolled (a dark trail by phone light), stop and make camp or wait for help. The nudge is an extra warning; it never stands in for one of a crisis chain's own warning steps (8.10).

### 7.4 Movement

```
moving hours = miles x class / flat speed
             + gain / climb rate
             + steep descent / 2000
hours = moving hours x load x dark x energy
      x injury x weather x snow x pace
      x 1.12 (breaks) x today's legs
```

| Fitness | Flat mph | Climb ft/h | Energy cost |
|---|---|---|---|
| 1 Easygoing | 1.8 | 900 | x1.35 |
| 2 Casual | 2.1 | 1,100 | x1.15 |
| 3 Regular | 2.4 | 1,300 | x1.00 |
| 4 Strong | 2.7 | 1,600 | x0.88 |
| 5 Mountain goat | 3.0 | 1,900 | x0.78 |

**Steep descent** is the loss beyond 400 ft per mile on each segment (`simulation.md` 5.1): gentler descents cost nothing extra, steeper ones a minute for every 33 ft. From the rim of the Seven Lakes Basin to the Sol Duc trailhead (6.9 mi, +280 / -3,200 ft), about 740 ft of the descent counts as steep, so a Regular hiker with a comfortable load needs about 3.9 h with breaks.

Trail class multiplies distance: road walk 0.85, maintained 1.0, primitive 1.25, way trail 1.4, off trail 1.9, snow or glacier 1.8, beach sand 1.3, beach cobble 1.7, coast overland 1.8. Ladders and rope ladders add 10 to 20 minutes each. **Pace** is a morning choice: Easy (x1.15 time, more discoveries), Steady, Push (x0.88 time, more energy, worse footing and feet). "Today's legs" is a small daily draw (about ±7%): *your legs feel springy today.*

**Sanity check** (Regular fitness, light pack): Hoh trailhead to Lewis Meadow, 10.4 mi, about 5.1 h. Hoh trailhead to Glacier Meadows, 17.4 mi and +4,292 ft, about **11.3 h**. Trip reports say 4.5 to 6 h and 9 to 12 h.

**Honest ETAs.** Wherever you choose where to go next, the screen shows the ETA from the same formula with a 10th-to-90th percentile band: *"About 6 h. You'd arrive between 9:40 and 10:50 pm, about 2½ hours after dark."*

**The Fork card** (8.2) fires at the first landmark beat (a named camp or junction where stopping or turning is a real option) at which the ETA to tonight's camp lands within an hour of trail-dark or after it. It fires again at later landmarks while that stays true, at most once every two hours of walking. So no one walks into the dark without being asked: the tailgate already showed the ETA, and the first fork comes at the first real place to stop.

**The basin-or-crest fork** is a Fork card that fires on the High Divide whatever the clock says: at the first way into the basin in your direction (the rim junction going counterclockwise, the Mirror Lake way-trail junction going clockwise), and again at the second if you passed the first. It fires only when you reach the junction along the crest, so the next segment could be a way in: climbing out of the basin (Day 2 of the ↺ two-night basin fill, the last day of B.2) meets no fork at the top, nor at the other way in later that day. It shows, for each way, tonight's ETA against trail-dark, the forecast for the crest (thunder, fog), Legs, the water you carry and the next water, and what the choice does to the permit, and it always carries a sure way home (3.7, wireframe in 12.12).

### 7.5 Weather

- **Six zones:** Coast, West valleys (Hoh, Queets, Quinault, Bogachiel), North mid (Sol Duc, Elwha), High (4,000-6,000 ft), East high (the rain shadow: Royal Basin, Dosewallips, Deer Park), Alpine (glaciers and Olympus).
- **Climatology** comes from `park_rules.json`: NOAA 1991-2020 normals (Quillayute 101 in/yr with 203 rain days; Port Angeles 26.5 in), SNOTEL high-country stations, measured monthly **freezing levels** (medians: Jul 12,200 ft, Aug 12,500, Sep 11,600, Oct 8,000, Nov 5,100) and monthly river flows.
- **One park-wide weather story per day.** A single synoptic Markov chain per month (fair, unsettled, wet, storm; tomorrow tends to be like today) drives every zone, so the Hoh valley and Glacier Meadows can't disagree about the same storm. Each zone derives its daily state from it: clear, partly cloudy, fog, overcast/drizzle, showers, rain, storm. The rain shadow stays dry on about 40% of wet synoptic days; the coast adds a fog overlay; High and Alpine add an afternoon **thunderstorm** overlay.
- **The actual weather is generated when the trip is created and never changes.** The **forecast** is derived from the synoptic state, less accurate the further ahead it looks (85% at 1 day down to 45% at 5 days). It covers only trip days within five days of the planning day; later days get climatology.
- **Rain chances are honest.** The "40%" on the ranger's board is computed by Monte Carlo so that it really rains 40% of the time in the game.
- **Temperature** comes from the shared synoptic state through each zone's reference and a lapse rate with elevation (-3.3 °F per 1,000 ft in cloud, -4.5 on clear afternoons), plus a daily cycle, cold pools in basins and meadows (-4 °F on clear nights), canopy and glacier effects, and NWS wind chill.

### 7.6 Snow

Normal-year **melt-out line** (above it, expect snow on the trail), anchored to the SNOTEL medians (about 5,000 ft around June 20) with shaded, north-facing slopes about three to four weeks behind, which matches the park's guidance that north-facing slopes above 5,000 ft hold snow until mid to late July:

| Date | Open, south-facing | Shaded, north-facing |
|---|---|---|
| Jun 1 | 4,250 ft | 3,500 ft |
| Jun 20 | 5,000 | 4,200 |
| Jul 1 | 5,450 | 4,550 |
| Jul 15 | 6,000 | 5,050 |
| Aug 1 | 6,700 (patches) | 5,700 |
| Aug 15 onward | permanent snow only | 6,300, then permanent snow only |

**Snow cover on a segment:** `s = clamp(0.5 + (z - z_melt) / 800, 0, 1)`, where `z_melt` is the line for that aspect, date and snow year. **Snow is present** where s ≥ 0.25 (patches), and the trail counts as snow-covered where s ≥ 0.75.

Each trip draws a **snow year** that the ranger board shows: low (lines about two weeks early), normal, or high (two to three weeks late). The SNOTEL record ranges from May 1 to August 11 for melt-out near 5,000 ft; 2026 was a low year (melted out May 11). Regression tests check the model against SNOTEL years 2011 (late), 2015 and 2026 (early), within a week. From late September, fresh snow falls on wet days when the freezing level drops below the trail.

Snow slows travel (up to x1.8), asks for footing checks on steep patches, and needs traction or an ice axe on avalanche paths. It is hard and icy before 10 am and soft and postholing after 1 pm. Bonfire Lily eligibility does **not** use this line: it uses each place's own snow feature (10.2).

### 7.7 Rivers

Each crossing has a type (glacial, snowmelt, rain-fed, tidal mouth), a monthly base depth and a speed. Glacial rivers like the Hoh run **lowest around 8 am and highest around 6 pm**, and every river rises after rain. The hour and the rain live **only in the depth model**: they set the flow index, and no card adds a separate "afternoon melt" modifier.

The ford base is **piecewise linear in the flow index**, so a small change in the river is a small change in the odds:

| Flow index | Feels like | Ford base (clean) | Label |
|---|---|---|---|
| 0.8 or less | Ankle or shin | 97 | Told, no choice |
| 1.25 | Knee | 85 | |
| 1.85 | Thigh | 60 | Risky |
| 2.5 or more | Waist | 25 | "Not recommended" |

Between the points the base is a straight line (flow index 1.6 gives 70). A knowledge range of ±0.2 in flow index therefore spans about 10 to 20 points, never a 25-point cliff.

Modifiers come from the shared table (8.5): trekking poles +10, unbuckling the hip belt +3, scouting upstream +5 (20 minutes), tired or cold -5 to -20, river skill +2 a level, each bulky outside item -3, canister on top -4, a heavy pack -5 or -10, and a helping partner +5 (engine only: a v1 hiker crosses rivers alone). A gravel-bar camp can get a night card, *the river talks louder*.

### 7.8 Tides

- **Real predictions.** The game ships NOAA high/low predictions for La Push (station 9442396) for the playable years, about 30 KB a year, with per-place time offsets. Between extremes the height follows a cosine curve. For other years and Timeless mode it uses the harmonic model in `park_rules.json` (`tides.game_simulation`).
- **Waves add run-up:** +0.5 ft calm, +1.5 ft in showers or rain, +3 ft in a storm. Storm surge is hidden from the printed table: the box says (DRAFT) *the sea is running higher than your tide card promised.*
- **Tide gates** come from `coast.json`: for example the cove south of Taylor Point (4.5 ft), Scott Creek to Strawberry Point (4.0 ft), Diamond Rock (2.0 ft, sometimes impassable in daylight for days), Cape Johnson (4 ft, no overland trail).
- **The headland check** uses the margin `m = limit - (tide + run-up)`:

```
m ≥ 1      auto-pass (told)
0 ≤ m < 1  base = 85 + 10m      (cap 95)
-1 ≤ m < 0 base = 85 + 55m
m < -1     base = 30 + 20(m+1)  (floor 5)
rising tide -10, falling tide +5
```

  The card always offers **Wait** (showing the next passable window) and **Overland** where a rope-ladder trail exists.
- **The tide table is an item** (1 oz, $2): a booklet you open from the Pack tab (12.19). With it and a working time source, the coast HUD shows the curve: *Now 5.6 ft, rising.* Without it, you get only the box (DRAFT): *the sea looks close to the rocks.* If the time source dies (a flat phone and no watch), the tide odds blur back into a range (8.6). **Misreading the table is a player mistake, never a die roll** (Appendix C).
- **Season matters:** summer minus tides fall in the morning, autumn ones in the evening. In September and October 2026 only 7 days each had a daylight low below 1 ft.

### 7.9 Body models in brief

- **Energy and food.** Drain scales with effort-miles, fitness, load and weather. A calorie deficit lowers the energy ceiling. **Bonk** (energy under 15) slows you, hurts footing and makes you cold: the classic way day-gear trips go wrong. Daily eating follows the allowance and rationing rules in 5.6.
- **Water.** Loss per moving hour rises with heat and climbing. Treated water is automatic if you have a filter or tablets. Untreated water carries a small risk per liter (1-4% by source, stylized and labeled as such): a **trail bug** 36 to 96 hours later, or a **giardia epilogue** 7 to 14 days after the trip. A can of beer costs about 0.3 L of water on top of its own (2.6).
- **Warmth.** A heat balance each tick: air temperature, wind (halved by a shell), rain, insulation reduced by wetness, and activity (climbing makes heat, sitting doesn't). The danger starts when the walking stops.
- **The night.** A sleep-system rating, built from each item's stats in `gear_catalog.json`, which are authoritative: `comfort_f` for bags, `r_value` for pads, `insulation` for clothes, `warmth_bonus_f` for shelters and liners, and `wet_warmth_retained` for anything soaked. (This section used to carry fixed figures of its own: tent -4, bivy -3, tarp -2, and wet cotton 20%, wool and synthetic 70%. They disagreed with the catalog, so they are gone, and the worked nights here, in 8.13 and in Appendix A, were recomputed from the item stats on 2026-10-08.)

```
comfortable down to =
  the bag's comfort_f (with an R≥2 pad)
    or 65 °F with no bag
+ pad: none +10 · R<2 +4 · R2-4 0
       · R>4 -2
- clothes: 0.4 x insulation in a bag,
           0.7 x insulation without
- shelter or liner: warmth_bonus_f
- hot dinner -2 · hot drink at bed -1
+ a beer in the last two hours +2
wet: x wet_warmth_retained per item
     (soaked); a damp bag keeps 60%
```

  From the catalog, a shelter's `warmth_bonus_f` is 4 to 8 for the tents (the solo trekking-pole tent 4, the two-person dome 5, the four-season tent 8), 6 for the bivy sack, 10 for the emergency bivy, 5 for a space blanket, 2 for the tarp or the plastic tube tent, and -5 for a hammock; only the warmest shelter counts, and a bag liner adds its own (silk 4, fleece 8). A soaked item keeps its `wet_warmth_retained` share of its warmth: cotton 0 to 0.15 (the cotton hoodie 0.05), synthetics 0.3 to 0.7, wool 0.5 to 0.6, down 0.25 (treated down 0.4); an item with no figure uses the stat glossary's for its material. The pad steps, the 65 °F of no bag, a damp bag's 60% and the dinner, drink and beer terms are this document's own defaults, kept in `rules/tuning.json`.

  A 30 °F bag (`comfort_f` 40) on an R 2-4 pad is comfortable at about 40 °F; with the solo tent (4) and a hot dinner, about 34; with a down puffy (`insulation` 18) on inside the bag, about 27. So a sensible kit sleeps well in August and can still have a cold night at Glacier Meadows in late September (lows of 25 to 35 °F). The **margin** is the night's low minus the rating. It sets sleep quality, tomorrow's energy and dawn warmth. Below -12 °F there's a **hypothermia roll** on one curve, the one in `simulation.md` 7.6, adopted unchanged:

```
chance of dangerous shivering =
  1.5 x (-margin - 12) %, capped at 90%
margin -18: 9% · -34: 33% · -40: 42%
```

  It is shown on the bedtime screen as its complement (*"Chance you get through the night without dangerous shivering: 91%"*). It is a **physics-curve roll**: its chance comes straight from the curve, so it has no shaky band and no 5-97 clamp, only the curve's 90% cap, and its "made it" can fall below 30% (8.8). Bedtime choices change it: eat everything, a hot drink, walk around, ask the neighbors. **Below -25 °F with no shelter, a failed roll can kill** in Old School (a 15% death roll, 9.5), so toughing the night out becomes a ♦ with its fatal share (at a margin of -40: 42% x 15% = 6.3%), and the screen always offers a sure choice: ask for help, or huddle and wait for rescue, which ends the trip but not the hiker (A.3). Reference nights (EN comfort ratings; Glacier Meadows in late September) are unit tests.
- **Feet.** Wear per mile doubles with wet feet and rises with new boots, heavy loads, pushing and beach cobbles. A hot spot always gets a card: tape it now, or keep going.
- **Injuries.** Scrape, mild sprain (pace x1.15), moderate sprain (pace x1.6, Serious), knee strain, cut, sunburn, sting, heat exhaustion, hypothermia. A first aid kit gives a 30% (basic) or 50% (complete) chance to step an injury down one level.
- **Batteries.** One model for every item tagged `needs_battery` (phone, headlamp, GPS, messenger, camera, UV purifier): a charge that drains by use and cold, with a small battery glyph on the caption line when it gets low. A phone used as a light drains about 12% an hour; a headlamp lasts about 4 hours on high and 40 on low; a messenger about 10 days. When the phone dies, everything it provided goes with it: the light, the time source (so the tide odds blur again), GPS and the camera.
- **Gear failure, only where the catalog marks fragility.** A canister stove sputters below its cold rating (keep the fuel in your sleeping bag), a filter can crack if it freezes overnight (keep it in your bag too, or carry backup tablets), a tent pole can snap in a storm (a repair kit splints it). Each is a small conditional chance with a mitigation you can pack.
- **Spirits.** Up with sunsets, wildlife, good dinners, swims (a skinny dip most of all), a beer at a beautiful spot, joy items and layover mornings; down with rain days, cold, mosquitoes, blisters, theft and a wet bag. Below 20 at camp, the hiker asks to go home: a real choice, Oregon Trail style.

### 7.10 Experience: better information, not better dice

Each trip earns experience in the skills you used, for as long as the hiker lives (a new hiker, after a death, starts over at beginner's level: 9.8). Levels run from 0 to 5, the cap `simulation.md` sets, and the experience each level needs lives in `rules/tuning.json` (a few trips that use a skill reach level 2, as Robin's navigation has by B.2). Each level adds +2 on matching checks, counted from 0, so a beginner's level 1 already adds +2 and glacier at 0 adds nothing (every worked example in this document includes it), **and unlocks better foreshadowing**: at `coast` 2 the HUD computes *"You'll reach Strawberry Point about 4:10 pm, tide 3.2 ft and falling"*; at `navigation` 2 way-trail forks are flagged; at `campcraft` 2 the evening screen says whether you'll sleep warm; `glacier` 1 comes from glacier school with Ranger Jon (4.2) and adds +2 on a soloist's crossings, and at `glacier` 2 the crevasse odds on the ice sharpen from a range to a number. Veterans read the world better.

### 7.11 Other people and living things

Trail popularity x weekend x month sets how likely you meet kind strangers, a ranger patrol (Olympus Guard Station in summer, Royal Lake's summer ranger) or a full camp. You always hike alone (1.2); other people are part of the place, like the weather. Seasonal curves drive mosquitoes (high country, late June to early August), yellowjackets (August-September), bears (berry season, late July to September), the elk rut (mid-September to October) and marmots (June to September).

**Animals are wildlife, nothing more** (your decision, 2026-10-08). They give a trip some of its best quiet stops, they are sometimes a hazard, and they are the usual reason food goes missing. None of them helps, guides, warns or talks (2.3).
- **Beautiful moments:** elk on the gravel bars, a dipper bobbing in the shallows, a marmot on a warm rock, a varied thrush in the fog. Tap to Look, as at anything (+1 the first time on a trip, 2.4); they lift spirits.
- **Hazards:** a bear in the huckleberries (wait, detour or make noise), bull elk in the rut (give them a wide berth), a cougar's tracks (a rare, tense stop, always survivable). No wildlife card has a fatal branch (9.5).
- **Food thieves:** Canada jays by day, mice at popular camps, raccoons on the coast, and now and then a bear that learns (6.3, 8.10).

**The 104 Boyz** (your decision, 2026-10-08: cameos only). A loose crew of hikers who seem to be on every trail in the park, a day ahead of you or a day behind. They never join you. A Boy turns up for one stop, says a line or two, and goes on his way, in one of three ways:
- **A tip:** true local knowledge, which sharpens a range the way the ranger's briefing does (8.6). *"Fog'll be on the crest by two. It was yesterday."* Tips are about conditions, never invented route details about real places. (One tip is about permits instead: in the Seven Lakes Basin, a Boy may mention a lake past Long Lake that nobody books, and that you have to call for, 4.3.)
- **A trade:** a fair swap, one item for one item, from what each of you is carrying. *"I'll give you a fuel canister for the cheese. All of the cheese."*
- **A warning:** an honest one, which counts as an in-story warning of that danger, like a ranger's line (9.5). *"River's up. I'd wait for morning."*

At most one Boy per trip, and a Boy is likelier on busy trails. Now and then that one Boy turns up at the worst possible moment instead, at a Larry moment (2.6). They are not rescuers or rope partners (kind strangers and rangers do that, 9.2), and no Boy is ever hurt or killed on screen.

**To a stranger they are just hikers with names.** A Boy's line never leans on an inside joke a stranger needs to get, and nothing on the trail explains who they are. The joke is for insiders, and the line still has to work without it (2.2, decision 34).

**They are also in the Trail Register before you, dead** (yours, 2026-10-08: for decision 7 you answered *"A"*, the option where *"their names are already in the trailhead register when you first open it, with epitaphs about their own (fictional) misadventures"*). The register comes pre-filled with one *Remembered* entry per Boy: a **fictional misadventure death** and a **funny epitaph**, good-natured and never mean (9.8, 12.3). For example, `{BOY_1}`, at Heart Lake after dark, *died of skinny dipping*, epitaph *"Worth it."*; `{BOY_2}`, at Lunch Lake, *died of the cheese*, epitaph *"I regret nothing. Except the cheese."*

The entries have places, dates and scores like any other line. They follow the rules for every cause line (at most 40 characters, *died of*, 9.5), may be sillier than any death the game can actually deal, never name a real incident or a place where one happened, and never turn on a Boy's real life, looks or habits.

And yet you keep meeting the same Boys alive on the trail. The game never explains it. A Look at a Boy's register line, on a trip where you met him, says only: *"You see {BOY_1}'s name, a date and a cause. You saw {BOY_1} this morning. You decide not to think about it."*

**Their names and quirks are still to come from you.** Until then the document and the content use clearly marked placeholders: `{BOY_1}`, `{BOY_2}` and so on for names, `{BOY_1_QUIRK}` for quirks. Cards name a Boy by id (`people/boyz/boy_1`), so the real names, quirks and epitaphs drop in without touching a card, and the release build refuses to ship with a placeholder left (F.3). **The repo is public,** so the game uses first names or nicknames, unless you confirm the friends are fine with their full names. Each Boy sees his entry and agrees before it ships: until all of them have, the line about them in Credits is a `{BOYZ_CONSENT}` placeholder, which a release build refuses to ship (12.20, F.3).

---

## 8. Decisions and odds

You asked for decisions inside the story, Oregon Trail style, with "lots and lots of potential outcomes" driven by what you can and can't fit in the pack, and maybe a % on all decisions or the critical ones. This section is the answer: a % on every rolled decision, and a red diamond on the critical ones.

### 8.1 A decision is a sentence you finish

The stop sets up the dilemma, and the buttons finish the sentence. Labels are verbs, 22 characters or fewer, no question marks, 2 to 4 per stop (button layout in 12.2).

> *The trail went down to the gravel and simply stopped. Beyond it the Hoh had split into three gray ropes of meltwater, none of them deeper than a knee. Robin...*
>
> `[ Wade across now        83%  (i) ]`
> `[ Camp, cross at dawn     night   ]`
> `[ Turn back to the car    sure    ]`

| Kind | Shown as | Example |
|---|---|---|
| **Sure** (no roll; maybe a cost, even the trip, but it can never kill the hiker) | `sure`, or a cost tag: a clock, food, battery or spirits icon, or one of the words `night`, `rest`, `cold` and `permit` (it changes the permit's nights; the Why sheet says whether that is an off-permit night, 3.7) | *Camp, cross at dawn* (costs a night) |
| **Risky** (rolled; the worst case is Trouble or less) | the chance it goes all right, as a %; the (i) opens *Why these odds* | *Wade across now 83%* (knee-deep, but tired) |
| **Critical ♦** (rolled; some branch can reach Serious, a rescue, the end of the trip, or in Old School the hiker's death) | `♦ %`, the fail share in red, the fatal share in red if the hiker can die, a confirming tap, a three-band bar in the Why sheet (two bands on a night roll, 8.8), and the compass roll | *Climb the ladder ♦ 79% · 21% fall · 0.3% fatal* |
| **Flavor** (no stakes) | no tag | *Count the banana slugs* |

**The rules:**
- Every rolled choice shows its odds, and nothing that can end a trip is ever unmarked.
- **The ♦ is computed, not authored.** The linter walks each card's fail table in each context and marks a choice ♦ only if a branch can reach rung 3 or higher (9.1). A soak, lost gear or a mild sprain stays a plain %. So the same ford is plain at knee depth in the morning and ♦ at thigh depth in the afternoon, when "swept" enters its fail table.
- **The fatal share is computed the same way:** the fail share x the share of fails in the fatal band x that moment's death roll (9.5). It is never hidden and is always **rounded up, toward danger**: to one decimal below 10% (0.21% shows as `0.3% fatal`, 6.08% as `6.1%`) and to a whole number from 10% up (15.25% shows as `16%`). A share under 0.1% reads `<0.1% fatal`, never 0. A fail share that isn't a whole number rounds up too (40.5% shivering shows as 41%). Only a ♦, or a compound bar that reports the ♦s further on (8.9), can carry a fatal share. Most ♦s can't kill at all: at thigh depth "swept" means a rescue, not a death.
- **The diamond must stay rare.** Target: on sensible plans, at most about one ♦ choice per moving day (F.1), and a fatal share rarer still.

### 8.2 Kinds of event cards

| Card | Fires when | Example |
|---|---|---|
| Landmark | Arriving at a tagged place | High Hoh Bridge; the ladder; Heart Lake |
| Hazard | Conditions + a weighted draw (one that can kill also needs its danger foreshadowed first, 9.5) | Showers on the Divide; blowdown; a ford |
| Encounter | Weighted draw | Bear on the trail; elk bull; kind strangers; one of the 104 Boyz (7.11) |
| Discovery / joy | Quiet slots | Avalanche lilies; a marmot; sea stacks at sunset |
| Camp | Arrival and evening | Pick a site; dinner; stay up for sunset |
| Night | Only if something happens | Cold night; a visitor; storm; river rising |
| Crisis | A meter crosses a threshold | *Your fingers won't work the zipper* |
| Fork | Dark is coming, camp unreachable, trail closed; or a real route choice up high (7.4) | *The light is going amber*; the basin or the crest |
| Larry moment | A camp tile the player starts (not capped), or a Director card tagged `larry`, at most one a day and two a trip (2.6) | Heart Lake after dinner; the permit check |
| Chain step | An earlier card set it up | Wet legs, then a damp camp, then a cold night |
| Delayed payoff | A queued consequence comes due | The trail bug arrives |
| Drive / town / trailhead | Those phases | Elk on the Upper Hoh Road |
| Epilogue | After the trip | Giardia; "the bears here have learned" |

### 8.3 Inside a card

Cards are JSON (full format: `engine.md` section 4). In short:

- **Where and when facets** (node, node type, segment hazard, zone, elevation band, month, time of day, weather) are indexed at build time, so finding candidates for a slot is instant.
- **An `if` expression** reads anything: meters, pack tags, weather, river level, tide, time to dark, flags, history. A small safe expression language (no `eval`, no randomness inside it).
- **Choices** each either resolve to a fixed outcome or **roll**: a base plus labeled modifiers, then a pass outcome and a weighted fail table.
- **Outcomes** carry text variants and typed **effects**: meters, time, food and water, gear wet or lost, injuries, flags at day/night/trip/region/hiker scope, queued consequences with foreshadowing, route changes (turn back, take the overland trail, bivouac, end trip), trip-log lines, score, Leave No Trace, skill experience. Region and hiker flags belong to the hiker record and are deleted by the wipe (9.8, E.6); only the phone's settings, the odds lines already shown (8.7) and the Trail Register outlive a hiker, so nothing leaks to the next one.
- **Modes.** A death outcome (`hiker_dies`) may appear **only** in a ♦ choice's fail table or at the last step of a crisis chain with at least two warning steps before it, and every one must carry a `modes.gentle` override (a rescue instead) and name a `cause` key from the cause-of-death table, which picks its *YOU PERISHED* line and the quote tags the epitaph dice prefer (9.5). A card the Director draws may hold one only if it names the foreshadow flag its danger needs, which an earlier stop must have set (9.5). The linter enforces both, so the hidden gentle mode can never kill anyone by accident, and Old School can never kill anyone without a fatal share on a button first (F.3).
- **Archetypes and place patches.** A generic archetype (any braided-river ford) plus a short place patch (the Hoh braids at mile 8) covers the park with personality. (This is card reuse in the data, nothing to do with hikers: a new hiker inherits nothing, 9.8.)

```json
{ "id": "wade",
  "label": "Wade across now",
  "roll": {
    "base": "river.ford_base",
    "mods": [
      {"if": "has('poles')", "add": 10,
       "why": "Trekking poles to lean on"},
      {"if": "gear.outside_bulky > 0",
       "add": "max(-10, -3 * gear.outside_bulky)",
       "why": "Gear strapped outside"}],
    "use_mods": ["mods.dark", "mods.fatigue",
                 "mods.load", "mods.skill.river"],
    "pass": "across",
    "fail": [{"to": "soaked", "w": 70},
             {"to": "dropped_item", "w": 15},
             {"to": "swept", "w": 15,
              "if": "river.flow_index > 1.5"}] } }
```

The hour and the afternoon snowmelt are already inside `river.ford_base`, through the depth model (7.7), so no card adds them twice. Shared modifier sets (`mods.*`) come from `rules/mods.json`, one value each, everywhere.

### 8.4 How a stop's event is chosen

At each beat slot:

1. **Forced first**, in priority order: crisis, fork, delayed payoff, chain step, landmark.
2. **Otherwise the Trail Director draws** from the eligible cards, weighted by the card's weight, how well the weather fits, **gap bias**, novelty (x0.3 if seen in either of the last two trips) and pace (Easy pace favors discoveries).
3. **Otherwise a quiet stop** composed from the place, its sound and the text pools, or the slot is skipped.

**Gap bias is the dungeon-crawler heart.** A *gap* is a tag the ranger's sensible kit for this zone and month expects but your pack lacks: rain pants on the west side in September, traction on the High Divide in early July, a tide table on the coast. Hazard cards that test a real gap are weighted x1.8 in Old School (x1.3 in the gentle mode). **The mountain asks the questions your pack can't answer**, but the Director keeps it from asking all of them at once.

**The Director also paces tension.** After a bad outcome, tension rises and quiet joy stops become more likely, then it decays. Budgets cap the decisions:

| Day | Real decisions | One-tap stops | Play time |
|---|---|---|---|
| Moving day | 3-5 | 3-6 | 4-6 min |
| Layover day | 2-3 | 2-4 | 3-4 min |
| Day hike | 3-4 | 3-5 | 4-5 min |
| Evening and night | 1-2 | 1-2 | 1-2 min |

At most 2 hazard cards per day in either mode, not counting forced ones, and at most one dealt Larry card a day and two a trip, on overnight trips only and never on the walk-out day; tiles the player starts don't count, and neither does the off-permit ranger, a forced roll outside the cap that plays the permit-check card (2.6, 3.7). Old School asks harder questions of the gaps in your pack, not more questions of a good one, which is what keeps sensible plans inside their targets (F.1).

### 8.5 How the % is computed

**One formula, everywhere:**

```
p = clamp(base + Σ labeled modifiers, 5, 97)
```

- **This p is the chance of a clean success.** The button shows the chance you make it at all, clean or shaky, which is p plus the shaky band (8.8).
- **Additive percentage points**, so a player can check the arithmetic in the Why sheet ("Base 90, dark -10, tired -10 = 70 clean").
- **Clamped 5 to 97.** Nothing is certain on a mountain, and nothing is hopeless. Cards may narrow the clamp, never widen it. (The night roll is the exception: it takes its chance straight from the cold curve, with that curve's own 90% cap, 7.9, 8.8.)
- **Bases come from physics where physics exists** (river flow index, tide margin, snow cover, night margin), from shared constants in `rules/`, and only otherwise from the card. Numbers are never invented per card.
- **Shared modifier sets** (`rules/mods.json`) keep common effects consistent across every card, one value each:

| Modifier | Footing | Ford | Navigation |
|---|---|---|---|
| Dark: headlamp / phone / none | -10 / -20 / -35 | -15 / -25 / -40 | -10 / -20 / -35 |
| Energy below 30 / below 15 | -10 / -20 | -10 / -20 | -5 / -10 |
| Warmth below 40 / below 25 | -5 / -10 | -5 / -15 | -5 / -10 |
| Each bulky outside item (cap -10) | -3 | -3 | — |
| Canister on top | -4 | -4 | — |
| Heavy pack: pack ratio over 1.3 / 1.6 | -5 / -10 | -5 / -10 | — |
| Trekking poles | +5 | +10 | — |
| Map / map + compass / phone GPS | — | — | +10 / +15 / +10 |
| Mild / moderate sprain | -10 / -25 | -10 / -25 | — |
| Skill, per level (level 1, a beginner's, is +2; 7.10) | +2 | +2 | +2 |
| Each companion helping, cap +10 (engine only; none in v1) | +5 | +5 | +5 |
| Push pace | -5 | — | -5 |
| A beer, until bed (each can) / a pre-roll, for two hours (2.6) | -5 / -5 | -5 / -5 | -5 / -5 |
| Fog / whiteout | — | — | -15 / -30 |
| Wet rock (rain in last 3 h) | -5 | — | — |

(Coast, snow and dexterity columns are in `simulation.md` 9.3.)

**Routine checks.** When p ≥ 95 and there's no meaningful alternative, the check is still rolled but told, not asked (DRAFT: *"You hop the braided channels."*), and a failure can only be the mildest band, so a told check can never kill. Honest, and it keeps taps down.

### 8.6 Knowledge blurs or sharpens the number

This is what makes **knowing** as important as **carrying**.

- A modifier can be **knowledge-gated**: the tide, the river's mood today, the weather this afternoon, which fork the way trail takes.
- If you lack the knowledge (no tide table, no forecast, no map, didn't scout the ford, skipped the WIC briefing), the gated modifier is unknown to you. The tag shows the **range of p over that modifier's possible values**, for example `40-80%`.
- **The roll always uses the true value, and the true value always lies inside the range.** Because the range comes from the modifier's real spread, not from a blur around the answer, the middle of the range is not a giveaway.
- If the range is 50 points or wider, the tag reads `??`, which is itself a strong hint.
- The Why sheet shows the gated row honestly: `? Tide (no tide table): -40 to +10`.
- **A blurred ♦ shows its worst case for death.** When a ♦ choice's odds are a range, its fatal share is computed at the worst end of that range and reads `up to 18% fatal`. Not knowing never hides how bad it could be. Finding out narrows the range around the true value at that moment. But finding out by waiting lets the clock run, and on a rising tide or a river in the afternoon the true value itself gets worse while you watch, so a range can narrow and still keep its fatal share, or gain one (C.4).
- **Ways to sharpen it:** carry the item (tide table, map), get the ranger's briefing at planning, spend time at the stop (*Wait and watch the water* for an hour; *Scout upstream* for 20 minutes; *Study the map* for 10), have walked this way before, raise the skill.

On the coast this makes a 1-oz tide table an item of real power. On the High Divide in fog, a map and compass turn `??` into `92%`.

### 8.7 What shows a %, and the words option

| Decision kind | Shows |
|---|---|
| Rolled, can kill (Old School) | everything in the next row, plus the fatal share in red (`0.3% fatal`, rounded up; a blurred range shows its worst end); the confirm reads (DRAFT) *This could be fatal* |
| Rolled, can reach Serious or worse | ♦ + "made it" % + the fail share in red; the Why sheet adds a three-band bar (two bands on a night roll, 8.8) and an "if it goes badly" line |
| Rolled, smaller stakes (a soak, a lost sandal, a mild sprain) | "made it" % |
| Rolled, tiny stakes (spot the marmot, a photo before the fog) | a small grey % |
| Compound (push on 7 miles in the dark) | one word and a small three-color bar (8.9) |
| Unrolled (camp here or there, eat now) | no %; deterministic effects (ETA, kcal, liters, LNT) |
| Planning | the forecast's rain %, and the Trip Outlook in words |

**Settings: Odds = Numbers (default) / Words / Hidden.** Words are built on the same "made it" number, and add how often it goes badly:

| Made it | Words |
|---|---|
| 95-99 | almost surely |
| 85-94 | very likely (about 1 in 10 goes badly) |
| 75-84 | probably (1 in 4 or 5 goes badly) |
| 60-74 | a real risk (1 in 3 goes badly) |
| 45-59 | a gamble (about half go badly) |
| 30-44 | unlikely (most go badly) |
| below 30 | very unlikely (nearly all go badly); only a night roll gets here (8.8) |

A range wider than 30 points reads *hard to say*. The prose carries the hunch naturally in every mode: *"It looked likely enough."*

**The fatal share is the one number no setting hides.** In Words it reads as a plain count, (DRAFT) *about 1 in 500 is fatal* (rounded to a friendly 1 in 2, 3, 4, 5, 10, 20, 50, 100, 200, 500 or 1,000, always toward the more dangerous side). In Hidden it still shows. A player may choose not to see the odds; they may not be surprised by a death. (The Trip Outlook, which has room for a whole sentence, may use any count, *one time in N*, with N rounded down toward danger: 6.3% reads *about one time in fifteen*.)

**Each odds form is introduced the first time it appears,** with one dry line in the box. The phone remembers which ones you've seen, so none repeats; that is the player's, not the hiker's, so a death doesn't reset it (9.8):
- the first %: *"The number is the chance this goes all right. The (i) shows the arithmetic."*
- the first range: *"A range means you don't know something yet. Find out, and it narrows."*
- the first `??`: *"Two question marks: you really don't know. Look, wait, or ask."*
- the first ♦: *"A red diamond: this one could go badly wrong. The red number says how often."*
- the first fatal share, with the sure choice beside it outlined: (DRAFT) *"'Fatal' means your hiker would die here, for good. There is always another way: look for 'sure'."*
- the first compound bar: *"For a long push, the bar shows how evenings like this tend to end."*
- the first `sure` or cost icon, and the first Words phrase, the same way.

### 8.8 What the % means: made it, and the compass roll

Every roll has bands, built from the clean chance p (8.5):

```
shaky = min(ceil((100 - p) / 2), 25)
        (a card may set its own)
roll < p - 30      Great (only if the card has it)
roll < p           Clean success
roll < p + shaky   Shaky: made it, at a small cost
otherwise          Fail, then the card's fail table
```

**The number on the button is "made it": clean plus shaky.** It is the chance of the outcome the player is actually deciding about, so `79%` means about one time in five it goes badly. The fail share is never more than 70% (p is at least 5), and "made it" runs from 30% to 99%.

**Physics-curve rolls skip the bands.** A roll whose chance comes straight from a physics curve, rather than from p and its modifiers, has no shaky band and no 5-97 clamp. In v1 that is the night roll (7.9), which is also the Cold chain's last step. Its "made it" is simply 100 minus the curve's fail share, rounded like any fail share, so it can fall below 30% (at a margin of -72 the curve gives 90% shivering, and the button shows ♦ 10%). Words reads it with the row below 30% (8.7), and its Why sheet and compass have two bands, made it and fail, with the fatal sliver at the end of the fail when there is one.

On ♦ choices the fail share sits beside the % in red, and the Why sheet shows all three bands and the fail table:

```
Climb with your pack on
You make it ............ 79%
███████████░░░░░▒▒▒▒▒▒
clean 57 · shaky 22 · fall 21
If you fall: 80% bruised,
18% sprained ankle, 2% badly hurt;
half of the bad falls are fatal
Fatal: 21 x 2% x 50% = 0.21%,
shown rounded up: 0.3%
```

**The compass roll** plays only on ♦ choices, after the confirming tap: a compass rose fills the picture, its dial painted with the same three bands in the palette's colors (moss clean, alpenglow pink shaky, brick fail; 11.1), or two on a night roll (moss and brick), plus a thin ink-black sliver at the far end of the red for the fatal share when there is one. The needle spins about 1.2 seconds with PC-speaker ticks and comes to rest **somewhere inside the band it landed in**, not at the exact roll, so a player replaying the same weather on a new trip (9.7) can't read the number and nudge the odds just past it. Raw rolls appear only in the debug overlay and, from M6, the post-trip Notebook. A tap skips the spin. Ordinary risky choices go straight to the outcome.

### 8.9 Compound choices: an honest look-ahead

Some choices aren't one roll: *push on to Glacier Meadows in the dark*, *wait for the tide*, *hike out tomorrow with 250 calories*. For these, the game plays the situation forward many times from the current state and shows how it tends to end.

- **No peeking.** Each run resamples everything the player doesn't know, from the player's own information: the weather from the forecast for each lead time (or climatology beyond it), the river's hidden noise from its prior, the tide from its prior when no tide table is carried. The trip's real stored weather, river and tide are never read. The look-ahead is exactly as good as what you know, and it uses its own random stream, so the trip's dice are untouched.
- **One named policy for the numbers: *keep pushing*.** Look-ahead bars and the Trip Outlook follow the plan (or this choice) to the end, turning aside only where the plan becomes impossible (no light on bad ground, a closed trail). At every later warning and every later ♦ they go on, whatever its %, and they never look for or ask for help. So the fatal share is the honest price of sticking to the plan, and taking a sure choice later can only lower it. (The Bold bot, F.2, is the same except that it turns back at a ♦ below 50% made-it, so on a plan with such a ♦ the Outlook reads a little higher than Bold's figure, as in A.7.) The test bots use their own styles, including *sensible* (F.2).
- **On the button:** one word and a small three-color bar, `Push on · mostly trouble`. When any run reaches a ♦ that can kill, the bar gets a black tip and the fatal share shows in red. The numbers are in the Why sheet. Appendix A's first fork, with day gear:

> **Push on to Glacier Meadows** · Arrive in OK shape **5%** · Arrive in serious trouble **65%** · Need help **25%** · **Fatal 6.6%** (DRAFT labels)

- **Budget:** the runs happen in a Web Worker, up to 400 within about 50 ms for a choice. With 400 runs the results round to 5%; if fewer finish, they round to 10% and read *about*.
- **The fatal share is not counted from sampled deaths.** Counting would miss small shares: a true 0.7% shows no death at all in 400 runs about 6% of the time, and a true 0.1% about two times in three, so the black tip would come and go on plans that really can kill. Instead each run carries on as if the hiker lived through every ♦, and combines the exact fatal share of each ♦ it reaches under the policy (one minus the product of the survivals); the bar shows the average, rounded up like any fatal share (8.1). And if any run reaches a ♦ with a fatal branch, the bar keeps its black tip and reads at least `<0.1% fatal`. So the parts may not add to exactly 100.
- **The Trip Outlook** runs whole trips the same way, in the same worker, in the background while you plan, refining for up to about a second, and never blocks a screen.

### 8.10 Chains, delays and memory: why things happen *because*

**Delayed consequences** go into one queue. The odds were shown when you chose; the foreshadow line appears at the current stop.

| Cause (your choice) | When it pays off | Payoff |
|---|---|---|
| Drank untreated water | 36-96 h; or 7-14 days after | Trail bug; giardia epilogue |
| No rain pants in rain or wet brush | That evening | Damp camp; colder night |
| No sun kit on snow or beach | Next morning | Sunburn |
| New boots | Around mile 6 | Hot spot card |
| Heavy pack, long descent, no poles | Next day | Knee strain |
| Food that didn't fit the canister | That night | Visitor roll |
| Ignored a hot spot | 2-4 miles later | Blister |
| Gravel-bar camp with rain forecast | That night | *The river talks louder* |
| Stayed up past sunset at a clear high camp near snow | Blue hour | A quiet roll for the Bonfire Lily (10.2) |
| A bear got your food | **Your next trip to that region** | *The bears here have learned* |

**Chains** are linked cards. The **Soggy Day chain**: showers on the Hoh with no rain pants (keep walking, or wait under a cedar for 45 minutes) → a damp camp (dry camp clothes, a fire if legal, a big hot dinner, or bed early in damp clothes) → *the cold hours* at night (the night-margin breakdown shows "damp clothes in bag -4 °F") → a grey morning (dry layers in the sun, press on, or turn around). The same first card plays four different ways depending on `rain_bottom`, `camp_clothes_dry`, `stove`, the sleeping bag and the elevation (fire rules).

**Chains that can kill** (Old School). A crisis chain may end in death only after **at least two explicit warnings the player walked past**, each a stop that names the danger and offers a sure way out, and its last step is always a ♦ with its fatal share (9.5). The **Cold chain**: *shivering* (warning one: make camp, add layers, eat, turn back) → *stumbling* (warning two: stop and shelter, or call for help) → a ♦, *keep going* with its fatal share, beside *stop and wait for help*, which is sure. **Both warning steps always come before the ♦, every time.** A ranger-voice nudge (7.3) or a Fork card may add warnings of its own, but it never stands in for one of the chain's steps, and only a stop that names the same danger (the cold, the wet, the night) counts toward the two. Every warning is logged with a danger tag, and the fairness invariant checks that two of them match the cause of any death (F.1). No step fires on a random draw: each needs the state the previous choice left. While the hiker is climbing, the chain rarely starts (climbing makes heat); it is the stop, the wind and the wet that start it.

**Memory** stores small facts (`wet_from = "the Hoh"`), so later stops can echo them (DRAFT): *Your socks are still damp from the Hoh.*

### 8.11 One ford, five ways

The same braided-river card, with the gear and the hour changing everything. Every number comes from the shared tables (7.7, 8.5), and every row includes a beginner's river skill (level 1, +2); the card bench regenerates this table as a golden test (F.4).

| Situation | Clean → shown | If it goes wrong |
|---|---|---|
| Knee-deep (flow 1.25) at 8 am, poles, light pack | 97 → told | At worst a cold soak |
| Same river, no poles, tent and pad strapped outside (-6) | 81 → 91% | Mostly a soak; about 1 failure in 5 loses an outside item |
| Thigh-deep (flow 1.85) at 3 pm, no poles, heavy pack (-5), tired (-10) | 47 → ♦ 72% | 28% goes badly: soaked, a lost item, or swept (about 4% overall) |
| Same, but you camped and crossed at 8 am (flow 1.3: base 83; heavy pack -5) | 80 → 90% | It cost the evening; a soak at worst |
| The afternoon again, but you scouted upstream for 20 minutes | +5, and the range narrows | — |

If the soak happens, the damp evening chain is queued **only if you have no dry camp clothes**. The pack decides whether a wet crossing becomes a bad night.

None of these five can kill: "swept" at thigh depth means a rescue. **At waist depth** (flow 2.5, base 25) it can. The same tired, heavy, pole-less hiker gets 25 - 5 - 10 + 2 = 12 clean, shaky 25, so the button reads **♦ 37% · 63% goes badly · 1.9% fatal** in Old School: 63% fail x 15% swept x a 20% death roll (9.5) = 1.89%, rounded up to 1.9%. *Camp, cross at dawn* sits right under it, sure.

### 8.12 How many outcomes, measured

Raw path counts are effectively infinite (about 10^16 per itinerary) and therefore meaningless. What matters is variety the player can feel, so the harness measures these (`engine.md` 6):

- **Plans alone:** the 15 main Hoh camps give about **140,000 sensible out-and-back itineraries** of 1 to 5 nights. Across the park's loops, traverses and trailheads, millions.
- **Authored content:** about 260 cards and 730 choices in v1.0 (about 600 cards and 1,700 choices at full park; 14.1). Across about 36 context classes (weather x light x gear bucket), that is at most about 26,000 distinguishable moments in v1.0. Not every class fits every card, so the real number is lower; it is measured, not claimed.
- **Story-signature uniqueness** (the ordered notable cards, choices and outcomes, plus the ending): at least **90%** of 2+ night trips on the same template are unique.
- **Ending headlines** ("walked out early, cold night, Glacier Meadows, day 2"): at least **25 per multi-night template**.
- **Repeat rate.** *Notable* cards are the ones the Director draws; forced landmarks and chain steps don't count, because they repeat by design. A 2 to 3 night trip draws about 8. With at least 32 eligible notable cards per coverage cell (14.2) and the novelty weight, two consecutive trips on the same template share **2 or fewer** of them (median).
- **Pack sensitivity:** removing any meaningful tag from a sensible kit changes something measurable somewhere: the ending, the score, spirits or Leave No Trace (F.2).

### 8.13 Field Notes: the cause trace

Every effect records the modifiers and earlier choices that produced it. After the trip, the trip report's **Field Notes** turn the biggest causes into plain words and tips:

> **Why the night at Glacier Meadows was so cold:** no sleeping bag (a 20 °F bag is worth about 35 °F of comfort), no pad (10 °F colder), a cotton hoodie soaked by the evening rain (wet cotton keeps almost none of its warmth). The kind neighbors' puffy, sit pad, tarp and cocoa (about 22 °F together) kept it from being worse.
> **Next time:** a 20 °F bag, a pad, a small tent and a hot dinner would have made you comfortable down to about 24 °F: 10 °F on the warm side of that night.

(Every figure in those notes comes from the item stats in `gear_catalog.json` through the night model, 7.9: the 20 °F bag's `comfort_f` is 30, the soaked hoodie keeps 5% of its warmth, the neighbors' down puffy is worth 12.6 °F worn without a bag, the sit pad 6 and the tarp 2, and the solo tent's `warmth_bonus_f` is 4.)

This is the Oregon Trail learning loop made explicit, and the main tool for checking the game feels fair.

### 8.14 Seeds and save-scumming

- Randomness comes from one seeded generator split into named streams (weather, environment, permits, director, rolls, effects, text, art, store, lookahead). The trip seed is drawn when a plan is first saved at the map table, so planning's own draws (quotas, desk requests, the canister loan) use it too (E.8). A Hike of the Day's seed is the day's, the same for everyone. **Weather never shifts because you dawdled**, and editing text never changes an outcome.
- **There is no going back, in any mode.** No Restore, no going back a stop, no Back to Last Camp, no Restart Trip. Every stop autosaves. **The save written at the confirming tap already holds the outcome**, before the compass spins, so closing the app mid-spin changes nothing. If the outcome is a death, that same write adds the Trail Register entry and marks the hiker dead, so nothing can bring them back; the death sequence only displays it, and the full wipe of the hiker's trip reports and skills follows at the cabin when the sequence closes (E.6). The one thing still unwritten is the epitaph, which can add words to the register entry and change nothing else (9.5). An error never rolls back a choice either (E.11).
- **Rolls are keyed to content and mode, not to stop counts:** `hash(trip seed, mode, node, card, choice, trip day, attempts here)`. An optional stop inserted before a check (a Look, a rest, a different chore order) changes nothing. And the same choice at the same ladder on the same day, in the same weather and the same mode, always gives the same result: on a new trip with the same weather (*Hike it again*, 9.7), a fall is still a fall. It is a puzzle you solve on the next trip by changing your approach (haul the pack up on a rope, wait for morning, take the overland trail), the King's Quest way, never by reloading. A different choice, a new day, or a genuine second attempt (trying the ford again after failing it) gets a fresh, equally honest roll.
- **No scouting.** A phone has one living Open hiker with one trip in progress at a time, so there is no parallel trip to scout with; a seed already in progress can't be opened twice, and a code from a trip that ended in GAME OVER rolls new weather for your own hiker (the register keeps the seed, 9.7, 9.8). The mode is in the key too, so if the hidden gentle mode is ever released, a gentle trip of the same route rolls its own dice and can never show which Old School ♦ would have killed (9.4). An imported save can never be older than the hiker record's mark for that trip (E.6). The Hike of the Day is one shot for the same reason: the same seed for everyone, and no second try (decision 24).
- The compass shows only the band, never the exact roll (8.8).

---

## 9. Consequences, modes and scoring

### 9.1 The consequence ladder

| Rung | Name | Examples | Way out |
|---|---|---|---|
| 0 | Fine | — | — |
| 1 | Uncomfortable | Damp, tired, hungry, bitten, sore feet, chilly night | Camp, food, sleep |
| 2 | Trouble | Cold, blister, mild sprain, food lost to mice, behind schedule, off-permit camp, trail bug | Choices that cost time or joy; may shorten the trip |
| 3 | Serious | Shivering or hypothermic, moderate sprain, bonked far from the car, no light on bad trail, stranded by the tide, lost in fog | A forced crisis card with at least one bail option and one help option |
| 4a | Trip over | Walk out early | *Sooner Than Planned* |
| 4b | Rescue | Rangers walk you out, a carry-out, a helicopter (Olympus) or Coast Guard (coast) | *With a Little Help* |
| 5 | Death | **Old School only**: a ♦ that showed its fatal share, or a chain's end after two warnings (9.5) | None. The death sequence (9.5): the death box, YOU PERISHED, Leave No Trace, an epitaph, then the GAME OVER card and the cabin at dusk |

**Escalation rules:**
1. A rung goes up only through a failed check, a crossed threshold, or a delayed payoff the player risked knowingly.
2. Trouble becomes Serious only after a crisis card the player saw.
3. Serious always offers a safe-ish option, and any moment that could reach rung 5 offers a sure one (9.5).
4. Rung 5 is reached only by the two fair paths in 9.5, never from a choice shown as `sure`.
5. In the hidden gentle mode nothing goes above 4b (9.4). On the Hike of the Day, rung 5 is a DNF (9.3).

### 9.2 Help and rescue

Help can arrive in either mode, and who helps depends on what you packed and planned. In Old School it is the best of the bad endings (in the hidden gentle mode it is the worst case), and *call for help* is always one of the sure choices at a moment that could kill (9.5).

| Way out | Needs | Time to help |
|---|---|---|
| Walk out yourself | Legs | ETA by formula (look-ahead %) |
| Kind strangers | Other hikers nearby (popularity, weekend, month) | Now ("Ask for help": base 70%) |
| Ranger patrol | A ranger in the area (station, season) | 1-6 h |
| Send a companion (engine only; none in v1) | A party, and someone fit to go | Trailhead ETA + 2-4 h |
| Satellite SOS | `messenger` with battery | Helicopter in 3-6 h if it can fly; else ground team 8-16 h |
| Wait | — | 2-25% per hour by trail traffic; once a friend reports you overdue (planned exit + 12 h, 3.7), a search adds its own chance each hour |

**At a moment that could kill, the sure *wait for help* is stylized:** the hiker survives the wait for certain and is found by morning (*With a Little Help*), whatever the hourly chance above, so a sure choice is always sure (9.5). The Wait row applies everywhere else, where waiting decides only how long the trouble lasts.

Rescue is told gently and is never embarrassing. No bills, no lecture, no score penalty beyond the lost finish; the lesson goes in the Field Notes. Hesitating to call for help is the one lesson the game must never teach.

> *(DRAFT) The ranger's name is Ines, and she has a thermos, which is the second-best thing a person can have on a cold mountain. The first-best thing is someone who knows where you are.*

### 9.3 The endings

Every ending is stamped at the car, where the trip comes off the trail (12.22). The stamps' words are drafts for you.

| Ending | When | At the car |
|---|---|---|
| **Finished** | Trip finished as planned, never reaching Serious | Stamp (DRAFT): FINISHED. The car at golden hour: boots on the dashboard, the permit in the visor |
| **The Hard Way** | Finished as planned, but reached Serious on the way | Stamp (DRAFT): THE HARD WAY. The car in the rain, the hiker asleep in the driver's seat with the heater on |
| **Sooner Than Planned** | You turned back (any reason) | Stamp (DRAFT): TURNED BACK. The trailhead sign, and one line (DRAFT): *"The mountain will keep."* |
| **With a Little Help** | A rung-4b rescue | Stamp (DRAFT): WALKED OUT WITH HELP. The Olympus Guard Station porch, or a helicopter as a dot over the valley |
| **GAME OVER** | The hiker died (Old School) | No car. After the death sequence (9.5): the GAME OVER card at the trailhead's register box, its lid closed; then the cabin at dusk, with only the Trail Register line left (2.2, 9.8, 12.17) |

**On the Hike of the Day** a death is a DNF on today's board, not a GAME OVER: the streak resets, and the Open hiker is untouched (decisions 24 and 25). Its other endings are the same four.

**Finding the Bonfire Lily is not an ending.** It adds a small gold ✶ to whatever ending the trip gets, on its stamp, its trip report and its Trail Register line, and a gold sketch in the cabin's gable window, if the hiker left it where it grew (2.2, 10.2).

*The Hard Way* is honest about a trip that technically worked: the finish bonus is halved (9.6), and the Field Notes open by default instead of waiting behind a tap. "Happy" in the targets (F.1) means plain *Finished*, never the Hard Way.

**GAME OVER** is the one ending with no way back. The trip still gets a title from what happened (DRAFT: *The Long Night at Glacier Meadows*), and its **GAME OVER card** replaces the trip report: the title with a black register mark (▌) beside it, the dates, the place, the score reached, the *YOU PERISHED* line, the epitaph chosen just before it (9.5) and a line on what would have kept the hiker alive (from the cause trace, 8.13). The Ranger's Note, the route map dotted to where it ended, and the Field Notes are each one tap away (12.17). It is the last look anyone gets at the trip: after it, back at the cabin at dusk, the trip goes to dust with the rest of the hiker's trip reports, and only its line in the Trail Register remains (9.8). A hiker who found the Bonfire Lily, left it and did not come home keeps the gold ✶ on the GAME OVER card and in the register.

**Every trip report is titled from what happened.** You pick one of three suggestions, built from templates you write (the route plus the trip's biggest event), or keep the route's name. DRAFT examples: *The Hiker Who Forgot the Stove*, *Too Much Cheese on the High Divide*, *The Night of the Raccoons*, *A Soggy Story*.

### 9.4 Ways to play, and a gentle mode kept hidden

**Three ways to play** (decisions 23 to 25; their full rules are being written in, and `design/drafts/daily_fkt.md` holds them until then):

| Way | What it is | If the hiker dies |
|---|---|---|
| **Open** | Plan any hike. One career hiker per phone, who carries on from trip to trip (9.8) | Old School: the death sequence and the full wipe |
| **Hike of the Day** | The same route and today's real forecast for everyone, one shot, scored on time, with a fresh standard hiker (decision 31) | A DNF: the streak resets; the Open hiker is untouched |
| **FKT attempts** | The big routes against the clock | Being written in, with the modes |

**Old School is the rule of Open play.** Every Open trip is Old School, and nothing in the v1 UI mentions another death rule: no mode picker, no setting, no mark on a trip report, no line of text. The **gentle mode**, where nobody dies, stays in the engine, but hidden (your decision, 2026-10-08: *"C but don't release that shelf yet hide it"*). Its old name, Storybook, is retired with the book frame (decision 22): the internal key is `gentle`, and it gets a public name only if you ship it. It is released later only if you decide to.

| | **Old School** (Open) | **Gentle** (hidden) |
|---|---|---|
| Who sees it | Everyone | No one: behind an internal flag, off in every build |
| Death | Possible and final, by the two fair paths in 9.5 only | Never: each would-be death is a rescue |
| Worst outcome | The death sequence (9.5), then a full wipe at the cabin; only the Trail Register line survives (9.8) | A gentle rescue; no screen of the death sequence |
| Odds | Every ♦ that can kill shows its fatal share | The same ♦s, with no fatal share |
| Director | Gap bias x1.8: the gaps in your pack get asked about | Gap bias x1.3 |
| Dice | Its own: the mode is part of every roll's key (8.14) | Its own |
| Hikers and register | One career hiker; the Trail Register and its Best trips | Its own hikers; never in the Trail Register or Best trips |
| Going back, rescue | None after Start walking; rescue free and kind | The same |

**Why keep it at all.** It costs little: every `hiker_dies` outcome already carries its rescue override (8.3), and the linter and the harness keep both modes honest (F.1, F.3). So the gentler game is one switch away if you ever want it, for a younger player in the family or for anyone who wants the trip without the old rules. For a younger player, the PG-13 Larry moments have a switch of their own (`flags.larry`, 2.6).

**How it stays hidden.** The switch is `flags.gentle` in the build config. It is off in every build you can install, main and preview alike, and it is not in the mailbox's settings or the debug menu. The engine, the linter and the harness run it headless; no screen does. A UI test walks every v1 screen with the flag off and fails on any mention of the mode, under either name (F.3).

**If you release it.** It opens from a second guest book at the cabin (a proposal), chosen before a hiker is named, with its own hikers and trips. A trip never changes mode, so the mode can never become an escape hatch halfway up a ladder. Its trips never appear in the Trail Register or Best trips, and because each mode rolls its own dice, a gentle trip can't be used to scout an Old School one (8.14). Code and data call the modes `oldschool` and `gentle`.

**Why Old School is fair as well as hard:** the shown fatal share is the real one, rounded up and never down (unit-tested, F.1); a blurred ♦ shows its worst case (8.6); every moment that can kill has a sure way out (9.5); and sensible plans stay under 1 death in 200 (F.1). The hard part is meant to be the planning, not the dice.

### 9.5 How a hiker can die (Old School)

**Two paths, and only two.**
1. **A ♦ choice the player confirmed**, after at least one in-story warning, whose button showed its fatal share in red (8.7).
2. **The end of a crisis chain**, after at least two explicit, foreshadowed warnings of that same danger, which the player walked past, each offering a sure way out (8.10). The chain's last step is a ♦ too, with its fatal share.

**Never on a random draw with no choice.** Weather, gear failure, a trail bug, a night visitor or a told routine check can hurt, but none can kill. **A Director draw can never kill by itself.** A card the Director draws (a ford, a thunderstorm on the crest, fog near a cliff) may carry a ♦ with a fatal share only if that danger was foreshadowed at an earlier stop of the same trip (the forecast, a ranger's line, the river talking louder at night) and the card offers a sure choice. The card names the foreshadow flag it needs, and the Director can't deal it until that flag is set (F.3).

**Every such moment has a sure way out:** turn back, wait for the tide, make camp, bail out, or call for help. It may cost time, comfort, the trip or the score (a cold night, *Sooner Than Planned*, a rescue), never the hiker. A sure way through a night that could kill always gives up the trip: the morning offers only the way down, or help. The linter checks all of this in every context (F.3).

**The fatal share** is the fail share x the share of fails in the fatal band x the death roll below, rounded up (8.1). It sits on the button (8.7), and a blurred range shows its worst end (8.6). These death rolls are the ones `simulation.md` proposed (its section 10.3); what is new is that each one is shown on the button before the tap.

| Moment | Death roll after the failure | Fatal share, worked |
|---|---|---|
| A ladder or exposed washout whose fail table has a badly-hurt band (the Glacier Meadows washout ladder; not the coast's rope ladders, whose worst case is a sprain), worst fall band | 50% of the 2% band | 21% x 2% x 50% = 0.21%, shown 0.3% (8.8) |
| Ford at waist depth (flow index 2.5 or more), swept | 20% | 63% x 15% x 20% = 1.89%, shown 1.9% (8.11) |
| Headland attempt more than 1 ft over the limit | 25% | 61% x 25% = 15.25%, shown 16% (C.2) |
| Crevasse fall on the Blue Glacier, alone (any of the three crossings; on Ranger Jon's rope a fall is held) | 30% | 45% x 5% x 30% = 0.675%, shown 0.7% (4.2) |
| A night with a margin below -25 °F and no shelter, toughed out; or the end of the Cold chain | 15% | 42% x 15% = 6.3%, shown 6.3% (A.3; the night curve in 7.9 at a margin of -40) |
| Staying on an exposed crest in a thunderstorm (a choice) | 2% | shown on the card |
| Off trail in fog near a cliff | 10% | shown on the card |

(The Cold chain's last step is the same night roll whatever started the chain: a bagless night, a soaking, or a skinny dip at dusk with no towel, 2.6.)

**Death box principles:**
1. **Fair:** only by the two paths above.
2. **Never caused by an animal.** Bears, elk and cougars are wildlife, not monsters (7.11), and no wildlife card has a fatal branch (lint, F.3).
3. **Never gory, never about real tragedies.** Real fatal incidents in the park are never turned into game deaths, by name or by place. At ingest, every research hazard and every *what goes wrong* line that cites a real death is tagged `real_incident`: the Klahhane Ridge mountain goat (2010), the hiker-placed ropes above Storm King (2017), the upper Sol Duc River above the falls (2025), cross-country shortcuts toward Boulder Lake near Mount Appleton (2026), and the Olympus climbing route (1993, 2013). Their card stubs drop every death outcome the research suggested, no card placed at a tagged site or built from a tagged hazard may hold a `hiker_dies` (F.3), and assertions built from tagged lines may test only non-fatal outcomes (F.2). Those places get the **stay-on-trail mechanic** instead, and it is never fatal: a ranger card (DRAFT: *"Most people stop at the viewpoint. It's the best seat anyway."*), a Leave No Trace cost for leaving the trail, and a Field Notes line. The one reviewed exception is the generic crevasse on the Blue Glacier, the ordinary hazard of every glacier: it keeps its ♦, and no text in the game carries any detail of a real incident there.
4. **Deadpan and kind, never mocking.** In the Sierra manner, but any joke aims at the weather, the water, the dark or the gear, never at the player and never at the loss.
5. **Always teach:** a real Ranger's Note names what would have prevented it.
6. **Final:** no Restore, no going back, no Back to Last Camp, no Restart Trip. The box has one button (DRAFT: *Next*), and the next screen is *YOU PERISHED*, the second of the five screens below (12.17).

> **The Sea Kept Its Own Time**
> *(DRAFT) The sea has kept its own time for ten thousand years, fifty minutes later every day, and it has never once been late. It comes around the point the way it always does, patiently and all the way, until there is no room left between the water and the rock.*
> **Ranger's Note:** Some coast headlands can only be rounded at low tide. Check the tide for each point on the right day, leave an hour to spare, and when the water is close, take the overland trail (look for the round red-and-black markers) or wait for the next low.

`[ Next ▸ ]` → ***YOU PERISHED.*** *You have died of a rising tide.*

**The death sequence.** In Old School every death plays the same five screens, in this order, and nothing else (wireframes in 12.17; one complete sample in Appendix D, screen 17). The hidden gentle mode never shows any of them, because its would-be deaths are rescues (9.4). How much of it a Hike of the Day DNF plays is settled with the modes.

1. **The death box**, as above: the scene drained to cold blue-grays, a title and a deadpan line, the Ranger's Note, one button.
2. **YOU PERISHED.** A black screen with the chrome hidden. *YOU PERISHED* stands in big blocky EGA letters, and under it is one line in the second person, Oregon Trail style: *You have died of the river.* The dirge plays once (13.2).
3. **Leave No Trace.** The place where it happened, in its own daylight colors, with a small cartoon skeleton lying beside the pack. Over about seven seconds both crumble into dust, pixel by pixel, the dust blows away, and the picture is left exactly as it was before the hiker came. A Sierra box says *Leave No Trace.* A tap skips it, and Reduce Motion makes it a cross-fade (11.10).
4. **The epitaph.** The register box at the trailhead where the trip began, lid open. One line to fill: type your own (up to 40 characters), tap the dice for a line from the early accounts of the park's first explorers, or leave it blank (below). There is no stone on the mountain, so the epitaph goes where trailheads keep names: the Trail Register (9.8).
5. **GAME OVER.** The GAME OVER card (9.3). Its button (DRAFT: *Back to the cabin*) closes the trip for good: at the cabin, at dusk, the full wipe takes the hiker, their skills and their trip reports, and the guest book asks for a new name (2.2, 9.8).

Closing the app anywhere in the sequence changes nothing: the death was saved at the confirming tap (8.14), and the trip reopens on the screen of the sequence it was showing. The epitaph is saved when it is signed; until then the register entry simply has none. After the GAME OVER card there is no trip to reopen, only its line in the register.

**The cause of death** is a key on every `hiker_dies` outcome (8.3), so the content picks it, never the dice. Each fatal moment in the death-roll table above has one:

| Fatal moment | Key | The line under YOU PERISHED |
|---|---|---|
| A fall from the Glacier Meadows ladder or an exposed washout | `fall` | *You have died of a wet rung.* (a washout with no ladder: *...of loose gravel.*) |
| Swept at a waist-deep ford | `river` | *You have died of the river.* |
| A headland attempt more than 1 ft over the limit | `tide` | *You have died of a rising tide.* |
| A crevasse fall, unroped on the Blue Glacier | `crevasse` | *You have died of a crevasse.* |
| A night with a margin below -25 °F and no shelter, toughed out; or the end of the Cold chain | `cold` | By a fixed order among what the cause trace (8.13) holds: a skinny dip at dusk with no towel, *...of skinny dipping.* (2.6); else wet cotton, *...of cotton.*; else rain, *...of a long, wet night.*; else a clear sky, *...of a cold, clear night.*; else *...of the cold.* |
| Staying on an exposed crest in a thunderstorm | `lightning` | *You have died of a thunderstorm.* |
| Off trail in fog near a cliff | `fog` | *You have died of the fog.* |

Any fall or cliff after trail-dark without a headlamp reads *You have died of the dark.* instead. A variant is picked by **whether its condition is in the trace, in that fixed order**, never by which factor cost the most, so the line is easy to predict and to test: a night with wet cotton reads *cotton* even when the missing sleeping bag cost more warmth (Appendix D, screen 17). The rules for every line: second person, starting *You have died of*, at most 40 characters; wry, never mocking; it names the weather, the water, the ground, the dark or the gear, never the player's choice. There is one exception, which comes with your Larry moments (2.6): *You have died of skinny dipping.* names the swim, because that line is the joke the whole Larry moment is built to earn (2.6); its death box still aims only at the water and the wind. There is no wildlife key, because no animal can kill (principle 2), and no line names a real incident or a place where one happened (principle 3). Each milestone brings its fatal moments' keys with it: `lightning`, `fog` and `cold` (skinny dipping included) with the first playable (M1), `fall`, `river` and `crevasse` with the Hoh and Olympus (M2), `tide` with the coast (M4). A `hiker_dies` with no known key fails the lint (F.3).

**The epitaph: type your own, or roll the dice** (your decision, 2026-10-08: *"Write your own or tap random"*). The epitaph screen has one line to fill and three ways to fill it (wireframe in 12.17):
- **Type your own.** Up to 40 characters, on a one-line field with a counter. The words are the player's, kept in the Trail Register and its exports.
- **Tap the dice.** The dice button fills the field with a short line from the park's own history, in the words of its first explorers and the 1890 newspapers that printed their story, with a small credit under the field (*C. A. Barnes, Press Expedition, Jan. 14, 1890*). Each tap deals the next line. Edit a dealt line and it becomes your own, and the credit drops away.
- **Skip.** *Leave it blank* is a full answer.

Nothing is filled in until the player acts, and *Sign the Trail Register* writes whatever the field holds.

**Where the dice lines come from:** `design/data/lore/quotes_public_domain.json`, planned and still being written as part of the history knowledge base. Today its lines are drafted in the working files `press_expedition.json`, `oneil_expeditions.json` and `other_history.json`, each with its own quote pool. Every line is verbatim from a U.S. text published before 1931 or a U.S. government work, copied from a page image we fetched, with its URL:
- the 1889-90 **Press Expedition**'s account in the *Seattle Press* of July 16, 1890, as reprinted and condensed in other 1890 newspapers and in *The Mountaineer* of 1907;
- **Lt. Joseph P. O'Neil**'s report of his 1890 expedition (Senate Doc. 59, 1896);
- other pre-1931 accounts, drafted in `other_history.json`: The Mountaineers' 1907 and 1920 outings, the Gilmans (*National Geographic*, 1896) and Meany's place names (1923), with more as the knowledge base grows.

A line can be dealt only if it fits 40 characters as printed (`fits_epitaph_40`) and its suggested uses include `epitaph`.

**How the dice deal.** Each death shuffles its own deck on the trip's text stream, so the same death always deals the same lines in the same order. Lines tagged for this death's cause come first, then the general pool (hardship, weather, wry understatement). Within each, lines in an explorer's own words (Barnes, Christie, O'Neil and the other expedition members) come before newspaper summaries and editorials, which are credited by paper. A line with a `caution` is dealt only for the causes it names. The deck never repeats until it runs out, then starts over.

| Cause key | Prefers lines tagged | A line it might deal |
|---|---|---|
| `cold` | cold, snow | "It was terribly cold." (C. A. Barnes, journal, Jan. 14, 1890) |
| `crevasse`, `fall` | fall, snow, terrain | "a man will frequently sink out of sight." (Barnes, the same entry) |
| `river`, `tide`, `lightning`, `fog` | none suitable yet; the general pool | "all but one sad day" (Winona Bailey, *The Mountaineer*, 1920, of a three-week outing) |

Lines are printed exactly, 1890 spelling and lower-case starts included. The deadpan comes free: a man of 1890 saying *It was terribly cold* about a January on the Elwha, set under a hiker who died of cotton, is as dry as anything we could write.

**Robert L. Wood.** You asked for *"a random Robert Wood sentence."* Robert L. Wood (1925-2003) wrote the histories of the Press and O'Neil expeditions and the standard Olympic trail guide, and his books are the factual backbone of the game's history (`lore/history.json`, planned): what we take from them is facts, retold in our own words and credited. His sentences are not quoted, because his books are still in copyright (`lore/wood_bibliography.json` has the details). He is credited in Credits and on the **Ranger's Bookshelf**, a real shelf of his books inside the cabin door, listed on a screen of its own (12.20). If his rights holders, reached through The Mountaineers Books, ever give written permission, licensed lines would live in a file of their own (`lore/wood_licensed_lines.json`) with the permission's scope and credit wording, and could join the deck. Whether to ask is up to you.

**Rules for every epitaph line:** at most 40 characters. A typed line is the player's own and is checked only for length. A dealt line is verbatim and credited. It comes from a verified public-domain text, never from a Wood book and never from the unverified secondary pool. It never mentions a real death, an injury or a named person, so O'Neil's lines about a fallen mule or a private who nearly died are never dealt (F.3). The register stores the line and, for a dealt line, its quote id, so the credit goes wherever the line goes.

### 9.6 Scoring

**The status line:** `Score: 22 of 131`. The maximum is computed for your itinerary when the permit is printed (a day hike's, which has no permit, at *Start walking*): every landmark and likely sunset on the planned route, the planned camps and the finish, plus budgets for Looks, wise choices and Leave No Trace acts. The Bonfire Lily is never in it, so the maximum can't give the flower away (10.2). Bigger trips have bigger maxima, but finishing is worth more than overreaching. Like King's Quest, **the score only goes up**, and it can never pass the maximum: points past it simply aren't counted, so a viewpoint found off the plan can make up for one the plan promised and the trail skipped.

| Points | For |
|---|---|
| 1 | Looking at something new (tap the picture), first time per thing per trip |
| 3 | A wise, safe choice when it mattered (waiting out the river, turning back in a storm, taking the sure choice beside a fatal share), up to the itinerary's budget |
| 2 | A Leave No Trace act (food stored right, trash packed out, durable campsite), up to the budget |
| 3 | A sunset watched on a clear evening |
| 5 | A landmark or viewpoint reached (2 on a repeat visit) |
| 10 | Reaching each planned camp (a layover night earns none: the camp was reached the day before) |
| 20 | Finishing as planned (10 for the Hard Way or Sooner Than Planned) |

**How the maximum is built.** Every budget is a number in `rules/tuning.json`, which the harness tunes (F.2). These are the starting values:
- **Landmarks and viewpoints:** 5 for each one on the planned route and its pinned side trips, and 2 for each repeat visit the route makes. A planned camp that is also a landmark (Heart Lake) counts once, as the camp. A side trip added on the trail doesn't raise the maximum; its points count up to it, like anything else.
- **Camps:** 10 for each arrival at a planned camp. A layover night earns no camp points; its day earns its own budgets and its side trips' landmarks.
- **Likely sunsets:** 3 for each planned evening, at a camp or on a pinned evening side trip, where the climatology gives a clear or partly cloudy evening at least half the time in that month (on the High Divide in August, every evening).
- **Looks:** 10 a trip day (each calendar day from *Start walking* to the car; a day hike has one).
- **Wise choices:** 2 a trip day, at 3 points each.
- **Leave No Trace acts:** 1 a trip day plus 1 a night, at 2 points each.
- **The finish:** 20.

**A worked maximum:** the ranger's fill for *↺ Deer Lake first*, one night, *Stay high* (B.1), as Robin planned it in B.6 (Heart Lake, Aug 21-22, 2027):

| Part | What counts | Points |
|---|---|---|
| Landmarks and viewpoints | Sol Duc Falls, Deer Lake, the rim of the basin, Mount Olympus from the crest, the Hoh Lake junction: 5 x 5 | 25 |
| The planned camp | Heart Lake, a landmark too, counted once | 10 |
| Likely sunsets | One August evening on the Divide | 3 |
| Looks | 10 a day x 2 days | 20 |
| Wise choices | 2 a day x 2 days x 3 | 12 |
| Leave No Trace acts | (2 days + 1 night) x 2 | 6 |
| Finishing as planned | | 20 |
| **The maximum** | | **96** |

That is the 96 on B.6's screens (12.12, 12.21), and the card bench regenerates it as a golden test (F.4). The other maxima in this document (170 for B.2, 131 on the Hoh wireframes, 64 in Appendix A, 120 in Appendix D's examples) are illustrative until the engine computes them by these rules.

Looking at the same marmot ten times earns its point once. There are no points for sketching, photographing or collecting anything, and none for the Bonfire Lily. **Replanning** (3.7) recomputes the maximum as the points already earned plus everything the rest of the new route can still earn, so a replan can lower the maximum, but never below the score already earned. **A GAME OVER trip keeps the score it reached**, with no finish points; the GAME OVER card and the Trail Register show it as it stood (`Score 25 of 64`).

**Leave No Trace** is a separate ledger (starts at 100) shown in the trip report: off-permit camp -5 (-10 on a meadow), always charged, whether or not a ranger comes by (3.7), food left out overnight (no canister, or food that doesn't fit it, 6.3) -5 a night, food lost to wildlife -15, a fire above 3,500 ft or during a ban -20, shortcutting switchbacks -5, feeding wildlife -10, picking plants -10 (the Bonfire Lily included, 10.2), a can, a roach or a shallow cathole left behind -5, packing out someone else's trash +3. The ledger never goes above 100: the +3 can only win back points already lost.

**A citation** (the pre-roll and a passing ranger, 2.6) is the one penalty that touches the score line, and it still never takes points away: the finish award drops to 10, as for the Hard Way, and the trip's register line gets a small *cited* stamp. The two don't stack: a cited trip that also ends the Hard Way or Sooner Than Planned still gets 10, not 5.

### 9.7 The trip report

**Every finished trip ends in a trip report** (decision 26). It opens at the cabin, after the drive home (2.2), and it scrolls, because it's a report (wireframe in 12.23). From the top:

- **Ending and title.** The ending's stamp (9.3), and the title, picked from three suggestions or the route's name.
- **Route and permit.** Dates and the permit number (or *day hike*), then the route map with the camps and the split ticks.
- **Stats:** miles, climb, nights, moving time, trail hours (and whether the trip was big, 2.2), base weight, the score and Leave No Trace.
- **Splits:** one line per day, from the checkpoints the trail screen showed (12.2).
- **The days.** Each day's headline, picked from that day's biggest event, and the hiker's log lines under it (2.3).
- **Gear notes:** used every day, never used, wished for. This is *What the pack taught* (6.6). It never lists beer or the pre-roll, used or not, and no line in the report mentions either (2.6, T05).
- **Conditions:** trail, road, bugs, snow. Published Washington Trails Association trip reports carry the same fields (Type of Hike, Trail Conditions, Road, Bugs, Snow), so local hikers will recognize the shape ([an example report](https://www.wta.org/go-hiking/trip-reports/trip_report-2024-06-21.151916120349), seen in search results). The game's report keeps a generic name.
- **Photos,** if you carried a camera: the alpenglow shot, if the minigames give you one (decision 30).
- **Field Notes:** the cause trace, one tap away (8.13).
- **Buttons** (DRAFT): *Share*, *Hike it again* and *Back to the cabin*.

**Hike it again** (DRAFT; it was *Try this trip again*) is the Oregon Trail loop made one tap: it copies the printed permit (the plan, the dates, each night's camp as granted and the canister as lent) under the next permit number, skips planning, so nothing on the permit is rolled again, and goes straight to the town run and the flat lay with your last kit loaded. You choose **same weather** (the same seed: change the pack, see what changes) or **new weather** (a new seed for everything after the permit). Either way it is a new trip for the same hiker, never a restore, and it can't open a seed that is already in progress. A trip that ended in GAME OVER has its GAME OVER card instead of a report, and no *Hike it again*: the next hiker may plan the same trip, but with new weather (the register keeps the dead trip's seed for exactly this), so a death can never be replayed choice by choice.

**Share** renders a **share card** as a 1080 x 1350 PNG through the iOS share sheet, with no server: the picture (the trip's best photo, or the route's own scene), the stamp, the title, the dates, the miles, climb and nights, the elevation profile, the splits, the permit number and the hiker's name (optional), and the game's name and address in small type (wireframe in 12.23). The flat lay has its own share image (6.10). A Hike of the Day shares as text, so it pastes anywhere and gives nothing away; its format is settled with the modes.

### 9.8 Across trips: the hiker's career

**One hiker at a time.** A phone has one living Open hiker, and that hiker has at most one trip in progress. While the hiker lives, they carry on from trip to trip:
- **Trip reports** pile up by the fire bowl at the cabin, to read again: the report and its log, with the route replaying on the map with its splits (E.6). If the phone runs short of space, the oldest reports keep their summary and lose their log text first.
- **Career marks** show at the cabin: a plank sign on the shed wall for each route finished, a race bib for an FKT record, the lily's gold sketch (2.2).
- **Skills** grow (7.10).
- **Memory:** *Like last time* reloads their last kit; the checklist in the shed and the WIC ranger remember what the pack taught (6.6); if a bear got their food, their next trip into that region meets a bolder bear; and if a ranger wrote them a citation, the next permit check there is likelier (2.6).
- **From M6, badges** (Every camp on the Hoh; Seven Lakes, all seven; Royal Basin; Tide Reader, for every South Coast headland rounded with at least 1 ft to spare). Badges belong to the hiker. The same-weather-for-everyone idea once planned for M6 is now the Hike of the Day (decision 23), with its own fresh hiker.

**After a death: a full wipe** (your decision, 2026-10-08: *"Full wipe"*). Everything that was the hiker's is gone: the hiker, their skills, their trip reports, the dead trip itself, their career marks at the cabin, their badges and anything else they collected, their region memory and their *Like last time*. It plays at the cabin at dusk, where the reports and the signs crumble to dust (2.2). The next trip starts a **new hiker** from nothing: a new name in the guest book, beginner's skills, a first trip with its short chores (3.6), and nothing inherited.

**The only thing that survives is the Trail Register.** There is no tombstone in the park, because Leave No Trace: the hiker's remains turn to dust on screen (9.5), and the epitaph goes where trailheads keep names. What the phone itself keeps is not the hiker's: your settings, the daily streak and personal bests (which belong to the player, decision 25), and which odds lines you've already been shown (8.7).

**The Trail Register** is our version of Oregon Trail's tombstones and its Top Ten in one, like the paper sign-in registers at real trailheads. It opens from the register post at the edge of the cabin's lawn (2.2, 12.3) and holds two lists:
- **Best trips:** the top ten finished Open trips by any hiker who ever lived on this phone, ranked by the share of their own maximum, so a good day hike can top a long trip. Each line has the hiker's name, the trip, the date and the score (and a *cited* stamp, if a ranger wrote one, 9.6). The list starts empty, so a first finished trip tops it.
- **Remembered:** every hiker whose trip ended in GAME OVER, newest first, with the name, the place, the dates, the score reached, the *YOU PERISHED* line, the permit number (or *day hike*, which has none) and the epitaph (typed, dealt with its credit, or blank). Tapping a line opens a small card with the same facts and the trip's title. It comes **pre-filled with the 104 Boyz** (your call; 7.11): one line each, a fictional misadventure death with a funny epitaph, dated before any trip on the phone, so real lines always sit above them. To a stranger they are old register lines (2.2). They can never be removed, and they carry no seed.

Each new trip's trailhead screen shows the register's last few lines on the kiosk, epitaphs included (12.10). Gentle-mode trips, if that mode is ever released, never appear in either list (9.4), and Hike of the Day DNFs stay on the chalkboard (2.2). The register also keeps what the game needs to stay fair after a wipe, out of sight: each dead trip's seed (so its code rolls new weather, 9.7) and the permit counter (12.6).

**Trip codes:** `SOL3-K7QM-2Q9F` shares a template, a seed and the profile values the engine reads. *Same mountain, same weather, your own pack.* When friends compare the same code, novelty is switched off so the trips match. A code from a GAME OVER trip still shares its mountain and weather with friends; on your own phone it opens a new trip with new weather, so a code is never a restore. A code whose seed is already in progress won't open at all. A code remembers its trip's mode, for the day the gentle mode is released: opened in the other mode, it rolls new weather.

---

## 10. The homage: art style and the Bonfire Lily

The game began as a homage to Benjamin Flouw's picture book *The Golden Glow* (Tundra, 2018). Your trim of 2026-10-08 (*"it feels like maybe you're overdoing the golden glow stuff"*, then *"Yes do all of that"*) leaves three things of it and no more: the art style, the Bonfire Lily and a credit line. In your words: *"If anything it was the art style of the book I just love. Reminds me of Sierra also."*

### 10.1 What we borrow, and what we don't

**We borrow three things:**
1. **The art style, as inspiration.** The book's flat, layered geometric shapes and its colors shaped our 16-color palette and our shape language: layered ridges, stacked-tier conifers, flat fills (11.1). We render them the Sierra way, in chunky pixels with vector lines, flood fills and dithers. It is inspiration only: no picture in the game copies, traces or reworks any of Flouw's actual illustrations, compositions or characters.
2. **A golden flower in the snow**, made our own as the Bonfire Lily: a rare hidden find and a bragging right, not the point of the game (10.2).
3. **A credit line** in Credits (10.3).

**We borrow nothing else:** not its text, illustrations, characters, names, plot or plant. The game is about a trip, not a quest for a flower. These are gone for good: the old field guide and its blank page, the 104-entry collection, sketching plants and animals for points, the prologue, the margin fox (and any fox), animal helpers, talking animals, and a narrator pitched at children (2.3). Every line of prose is original, and lint T04 blocks *The Golden Glow*'s title, names and phrases anywhere outside Credits (F.3).

### 10.2 The Bonfire Lily: a rare hidden find

**What it is.** A small golden flower that shows itself, very rarely, on high snow at the end of blue hour. *Bonfire Lily* is your name for it (2026-10-08). It is invented, and the game never pretends otherwise: a trip that finds it names the real endemic flowers in its trip report (the golden Olympic Mountain groundsel, Piper's bellflower, Flett's violet) without claiming the lily is one of them.

**It is hidden.** Nothing advertises it. The planner marks no places, the ranger never recommends it, the score maximum leaves it out (9.6), and no first-time line mentions it. The only hints are rumors. Now and then a hiker at a high camp, or the ranger at the WIC, says something like *"Some people say there's a flower up there that only comes out after dark. Some people say a lot of things."* A climber may call it, with a straight face, *the climber's campfire*: campfires are banned above 3,500 feet (4.6), so up in the snow it would be the only fire allowed. That stays a joke, never a rule. The lily gives no warmth and can't be lit or carried, and no rule, card or odds treats it as a fire.

**Where it can appear.** On an evening at a place with a **snow feature**: a glacier or snowfield within sight and a short walk, in the months that feature lasts. You must be there at sunset, at a camp or at a viewpoint you stay at past sunset with a headlamp for the way back. Each node carries a `snow_feature` with month windows by snow year, and a `bonfire_lily_weight`. The melt-out line (7.6) is not used, because a drift-fed snowfield or a glacier outlasts the general melt.

| Place | Snow feature | Normal-year months |
|---|---|---|
| Bogachiel Peak (M1b) | The north-face snowfield above the Seven Lakes Basin | Jul to about Aug 20 |
| Lunch Lake, Heart Lake, and the crest at Heart Lake Junction camp (`heart_lake_junction`, 5,080 ft) (M1b) | Basin and crest snowfields | Jul to about Aug 10 |
| Glacier Meadows and the Blue Glacier moraine (M2) | The Blue Glacier (perennial) | Jun-Oct |
| Snow Dome and Caltech Rocks (M2) | On the glacier (with Ranger Jon, or alone past the crossings, 4.2) | Jun-Oct |
| Upper Royal Basin (M3) | Remnant snowfields and the small glacier under Mount Deception | Jul-Sep |
| Anderson Pass (M5) | The vanishing Anderson Glacier | Jul-Sep |
| Grand Valley and Grand Pass (M5) | Snowfields | Jul-early Aug |
| Appleton Pass, Oyster Lake (M5) | Snowfields | Jul |
| Lake Constance (M5) | Snowfields under Mount Constance | Jul-Aug |
| Hurricane Hill (M5) | Snow patches; day hike only, if you stay for sunset with a headlamp | Jun-Jul |

Windows shift about two weeks earlier in a low snow year and two to three weeks later in a high one. The Bogachiel and High Divide windows are design estimates to confirm against August trip reports (and against your own memory of the Divide, since the first playable's lily lives there). The crest's lily place is its one camp, Heart Lake Junction, where the research's hazard `snowfield_high_divide` puts steep snow, as it does at Bogachiel Peak and the rim; it names no snowfield at Lunch Lake or Heart Lake themselves, so those two windows are the least certain. Lake Morgenroth has no snow feature, so it never rolls for the lily.

**The odds, per eligible evening.** Rolled quietly; no % is ever shown.

```
P = sky x (0.05
  + 0.03 whole sunset (warm layer)
  + 0.03 headlamp off
  + 0.02 layover (2nd evening)
  + place bonus)
Snow Dome bonus +0.04
sky = 1.0 clear, 0.6 partly cloudy,
      0.1 overcast, 0 rain or fog
```

Each eligible evening rolls on its own, and the trip's chance is `1 - (1 - P1)(1 - P2)...`. The layover bonus is for a second evening in the same place: a second sunset at the camp, or at a viewpoint you also watched from the evening before. A side-trip viewpoint seen once on a layover day is a first evening there and gets no layover bonus, which is why B.3's sunset on Bogachiel Peak rolls 11%, not 13%. With August high-country skies (an average sky factor near 0.57), a player who stays out for the whole sunset and turns the headlamp off gets about 6% from one evening and about 13% from a layover's two. One who goes to bed at sunset gets about 3%. The targets are **4-8% of such trips with one eligible evening, 10-16% with a high layover**, and no plan above 25% (F.1). There is no first-trip guarantee and no pity counter. Most players will finish many trips before they see it, and some never will, which is what makes it worth mentioning to a friend.

**The sequence.** Only on the evening the roll comes up, three screens:
1. **The glow plate** (full-bleed, chrome hidden, in the night palette with the snow gone to slate): one pixel of gold in the snow begins to cycle and grows over three seconds into a small 5x5 star, the only gold in the picture (11.1, 11.5). (DRAFT) *"Where the snow is bluest, something small is shining. You check the headlamp. The headlamp is off."* The Bonfire Lily motif plays once (13.2).
2. **Sketch it or pick it.** No odds and no third button; this is not a test.
   - **Sketch it.** The picture zooms 2x on the flower and redraws it as line work, the same vector commands with fills switched off (11.3), one line at a time with a soft scratch, in gold on paper: the only gold lines the pencil ever makes. The hiker draws it on the back of the permit. The sketch goes in the trip report and, at home, in the cabin's gable window (2.2); the flower stays where it grew, Leave No Trace is untouched, and the trip earns its gold ✶. The log gets one line, as in Appendix D's example (screen 14; DRAFT): *"Day 2. Upper Royal Basin. Saw something. Left it."*
   - **Pick it.** No scolding. By the tent it has gone gray; by morning it is a small brown curl. Leave No Trace -10, because picking plants is prohibited in the park (9.6). The trip report says (DRAFT) *"Picked. Faded by morning,"* and the register line gets a bark-brown ✶ marked *picked*.
3. **The night screen,** with the place's own closing: its sound, or a closing line if you keep one (2.3). In Upper Royal Basin that is the creek in the dark.

**What it's worth.** No points (9.6). It is scored only by Leave No Trace, and it is a **bragging right**: a gold ✶ on the trip's ending stamp, its trip report and its line in the Trail Register (12.3), where everyone who opens the register on this phone can see it, and the gold sketch in the cabin's gable window for as long as the hiker lives (2.2).

### 10.3 The credit line

Credits carry the only credit, in one line, and the game names *The Golden Glow* nowhere else:

> *Art style inspired by Benjamin Flouw's* The Golden Glow *(Tundra Books, 2018). The Bonfire Lily is our own invention. No text or illustration from the book appears in this game.*

---

## 11. Art direction and the scene system

### 11.1 The palette: Sierra pixels, sixteen colors of our own

**Your choice: option B** in `design/art/style_options.png` (*"I love B I love chunky pixels"*). Pictures are made the Sierra way: low-res vector lines, flood fills and ordered (checkerboard) dithers, in chunky pixels (11.2-11.4). The colors are not the stock EGA sixteen. They are a custom palette inspired by the flat, layered shapes of *The Golden Glow* (10.1): night blues, cool glacier tones, cream paper, forest greens, rust and brick, and one gold.

**Sixteen colors, fixed, at every hour.** Dusk, blue hour and night are remaps among these same sixteen (11.4), so a screenshot never shows a 17th. `design/art/style_mockup.py` renders the reference scene, and its role table (sky, ridge, tree, tree shadow, path, lake, lily) is the starting point for every scene's colors.

| # | Name | Hex | Typical use |
|---|---|---|---|
| 0 | Ink | `#1b1f2a` | Outlines, text, night |
| 1 | Night navy | `#24324a` | Upper sky at dusk, deep water, night forest |
| 2 | Slate | `#3f5a7a` | Upper day sky, far ridges, rock in shade, rain, snow at night |
| 3 | Glacier blue | `#8fb3c9` | Day sky, lakes, ice, shadows on snow, snow at blue hour |
| 4 | Snow | `#f2efe6` | Snow, surf, clouds, the message-box fill |
| 5 | Paper cream | `#e8d9b5` | Paper (permit, register), trails, sand, stars, headlamp light |
| 6 | Alpenglow pink | `#e09a8a` | Dusk sky, alpenglow on snow, heather, salmon |
| 7 | Bonfire gold | `#e8b33a` | **The Bonfire Lily**, and almost nothing else |
| 8 | Rust | `#c4602d` | The hiker's jacket, fall huckleberry and vine maple, flame |
| 9 | Brick | `#8a3b2a` | Message-box border, the pack, cedar bark, the ♦ and fatal shares |
| 10 | Bark | `#5a3d2b` | Trunks, logs, driftwood, the bear, the elk, forest trail |
| 11 | Spruce | `#1f3b33` | Conifer shadow sides, far tree bands |
| 12 | Forest | `#2f5b45` | Conifers, deep forest |
| 13 | Moss | `#6b8a4a` | Meadows, moss, the rain-forest floor |
| 14 | Sage | `#a7b88a` | Sunlit meadow, lichen, dry grass, gravel bars, banana slugs |
| 15 | Teal | `#3f7f7a` | Glacial rivers (the Hoh's milky teal), the sea, hazy mid ridges |

**Gold is for the Bonfire Lily.** Color 7 appears in a picture only where the lily is, and in the chrome only on the lily's own marks (its gold ✶ and its sketch). The sun, the headlamp, glacier lilies and banana slugs use snow, paper cream or sage instead. The picture lint fails any recipe or stamp other than the lily's that uses color 7 (11.8). So a player who has seen gold once will know it again.

**Shape language.** Ridges are layered flat bands, each a step lighter than the one in front of it, which gives distance without gradients. Conifers are stacked-tier geometric shapes, lit side forest (12) and shadow side spruce (11), as in the mockup. Fills are flat with crisp edges; dithers are kept for skies, haze, water and the seams between bands. There are no gradients and no textures but the dithers. And it is inspiration only: we draw the Olympics, never Flouw's pictures (10.1).

**The chrome uses the same sixteen**, as CSS custom properties, so a screen and its picture never disagree. The Sierra message box is snow (4) with a double brick (9) border and ink (0) text, the AGI box in our colors (2.4, 12.2). Brick is also the red of the ♦ and the fatal share, moss (13) the green of a clean band, and alpenglow pink (6) the shaky band (8.8). Contrast is in 11.9.

### 11.2 Resolution: AGI 160x168 with fat pixels

All three proposals agree: **160x168, the KQ1-3 resolution**, with each pixel wider than tall. At 160 columns on a phone, every pixel is a visible, deliberate block, which is the "low-res chunky pixels" look. The picture takes about the top quarter of an iPhone 15, leaving room for the box and the choices below.

**Crisp scaling:** render into a 160x168 index buffer, then draw it once onto a canvas whose backing store is a whole-number multiple in *device* pixels (`sx` across, `sy` down, chosen near the original wide pixel shape), with smoothing off.

| Device (portrait) | Pixel ratio | sx x sy | Picture (pt) |
|---|---|---|---|
| iPhone 15/16 (393 x 852 pt) | 3 | 7 x 4 | 373 x 224 |
| iPhone 16 Pro (402 pt) | 3 | 7 x 4 | 373 x 224 |
| Plus / Pro Max (430-440 pt) | 3 | 8 x 5 | 427 x 280 |
| iPhone 13 mini (375 x 812 pt) | 3 | 6 x 4 | 320 x 224 |
| iPhone SE (375 x 667 pt) | 2 | 4 x 2 | 320 x 168 |

**Short screens** (under about 700 pt tall, such as the SE) use 4x2, AGI's familiar 2:1 pixel, so the picture is 168 pt tall instead of 252 and the text gets the room (12.1).

**Tall plates** (160x320) are for about 8 full-bleed moments: the cabin at home (11.11), the loading art (Session 1's High Divide cover at dusk), the first view of Olympus, the Bonfire Lily, the soak (12.24). On short screens they also use 4x2 (320x320 pt), which leaves room for three choices below.

### 11.3 Pictures are small programs

Each picture is a text file of drawing commands, like AGI's PICTURE resources: easy to hand-author, easy to generate, and the reason draw-in (and the Bonfire Lily's one sketch, 10.2) comes for free.

| Command | Meaning |
|---|---|
| `C n` | Pen color (0-15 from the palette, 11.1, or pseudo-colors 16-24, 11.5) |
| `L` / `R` | Absolute or relative polyline (Bresenham) |
| `F x,y` | Flood fill the region under the seed |
| `D a b pattern` | Fill with a two-color dither |
| `B` / `S` | Brush shape and size; stamp the brush (foliage, flowers, snow) |
| `T id x,y` | Place a reusable stamp (a tree, a rock, a log), optionally flipped |
| `Z id x,y,w,h` | A tap hotspot for Look |
| `@ layer` | sky, far, mid, near |

```
@ sky
D 2 3 checker25  F 80,2
D 3              F 80,20
D 3 4 checker    F 80,40
@ far
C 2  L 0,62 14,50 27,55 41,38 58,52
     74,44 95,30 108,41 126,36 159,44
     159,63 0,63
D 3 15 checker   F 70,58
@ mid
T subalpine_fir 18,88
T subalpine_fir 131,86 fx
@ near
B splat 1  C 6  S 12,140 19,146 33,152
Z meadow 0,96,160,72
```

(Slate into glacier blue overhead, glacier blue into snow at the horizon, a hazy far ridge in glacier blue and teal, two firs, and alpenglow-pink heather in the meadow.)

**Each layer renders into its own buffer**, then they composite. A fill in one layer can't leak into another, which removes the classic AGI headache.

### 11.4 Dithers, draw-in and time of day

**Dithers** give the "dithered skies" you remember. Each dithered fill is a color pair and a pattern:

| Pattern | Rule | Use |
|---|---|---|
| checker | (x + y) even | 50% blends: sky bands, haze, moss |
| checker25 | x and y both even | Light speckle: thin gradients, frost |
| checker12 | x % 4 = 0, y even | Starfields, mist edges |
| hlines | y even | Water, fog bands |
| vlines | x even | Rain curtains, bark |
| diag | (x + y) % 4 = 0 | Glacier striations, sand |
| brick | offset every other row | Talus, cedar bark |

**Draw-in.** A new place's picture replays its commands over about 800 ms: outlines, then fills popping in, layer by layer, like a 1984 PC drawing a KQ scene. Revisits appear instantly. (A Pictures setting with Draw-in / Wipe / Instant comes in M6; until then a tap skips it, and Reduce Motion turns it off.)

**Time of day is a palette remap, inside the sixteen.** Each time of day is a lookup table that sends every slot to one of the same 16 colors (snow to alpenglow pink at dusk, for example), so the scene darkens without being redrawn and never needs a 17th color. Remaps apply at the final blit, so sprites and overlays tint along for free. Key slots, by their daytime color:

| Slot (by day) | Dusk | Blue hour | Night |
|---|---|---|---|
| 2 slate: upper sky | 1 night navy | 1 night navy | 0 ink |
| 3 glacier blue: sky, lakes | 2 slate | 2 slate | 1 night navy |
| 4 snow: snow, horizon | 6 **alpenglow pink** | 3 **glacier blue** | 2 slate |
| 12 forest | 11 spruce | 11 spruce | 1 night navy |

So a day sky of slate over glacier blue over snow becomes, at dusk, night navy over slate over alpenglow pink: the reference mockup's sky (11.1). At night everything sinks into the blues. **Lights are exempt:** the headlamp beam, a tent lit from inside, the stars, flame and the Bonfire Lily are pseudo-colors resolved after the remap (11.5), so they stay bright and a headlamp beam pops. Weather tints stack on top (overcast sends the sky slots to slate and glacier blue; lightning sends every slot to snow for two frames). The full lookup tables live in `content/art/palette.json` (E.5). The EGA tables in the retired `storybook.md` 6.6 are not used.

**Camp stops step through these remaps as chores pass:** arrive in Day, cook in Dusk, watch the sunset into Blue hour, then Night. You watch evening fall while deciding what to do: the most alive the scene ever gets. The cabin at home does the same on the real clock (2.2).

### 11.5 Palette cycling: water that moves, a glow that breathes

Pseudo-colors 16-24 resolve each frame to a palette color from a cycle (numbers are palette slots, 11.1), phased by pixel position so motion appears. Output stays strictly 16-color.

| Pseudo | Name | Cycle (slots) | Used for |
|---|---|---|---|
| 16 | lake | 3, 2, 3, 4 | Lake shimmer |
| 17 | falls | 4, 3, 2, 3 | Sol Duc Falls, Marymere, Enchanted Valley |
| 18 | river | 15, 3, 15, 14 | The Hoh, the Elwha |
| 19 | glow | a light: 7, 6, 8 | **The Bonfire Lily**: rings radiating out |
| 20 | fire | a light: 8, 6, 5 | Campfire, stove flame |
| 21 | surf | 4, 3, 2, 15 | Breaking waves, sea stacks |
| 22 | stars | a light: 5, 4, 5, 3 | Twinkle |
| 23 | rain glint | 2, 3 | Puddles in rain |
| 24 | lamp | a light: 5, fixed | A headlamp beam, a tent lit from inside |
| 25 | dust | by age, not by frame: 5, 10, 2, then gone | The Leave No Trace dissolve and the wipe at the cabin only (11.10); renderer-only, so no picture can use it |
| 26 | steam | a light: 4, 3, 5, phased by row so it rises | The lit hot tub at the cabin and in the soak (11.11) |

**Lights are exempt from the time-of-day remap.** Glow, fire, stars and lamp are resolved after it, to their own slots, so at blue hour and night, when the snow has gone to glacier blue or slate and the forest to navy, a headlamp beam, a stove flame and the stars stay bright, and the Bonfire Lily stays the only gold in the picture and never flickers blue. The other cycles are remapped with the scene. The fire cycle never uses gold; nothing but the glow does (11.1).

Cycling runs at **8 fps** only while a cycling screen is visible, pauses when static or hidden, and freezes under iOS Reduce Motion (except the glow, which slows to 2 fps).

### 11.6 Sprites

Small pixel figures in the same 16 colors, placed at anchors each base scene defines (trail spot, far bank, campsite, rock, sky).

- **The hiker** (7x18): idle, sit, wade, shiver, kneel, wave. Every hiker wears the same rust (8) jacket with a brick (9) pack, as in the mockup: there is no jacket picker (12.4). **The pack sprite shows what you packed**: day pack, mid pack or big pack, with the pad roll, a swinging pot or an ice axe dangling outside.
- **Tent** (pitched, sagging in rain, glowing with a headlamp inside at night).
- **Animals:** black bear, Roosevelt elk (antlers Sept-Oct), black-tailed deer, Olympic marmot, Canada jay (sometimes with a tortilla, or somebody's shorts), American dipper (a two-frame bob), raccoon, a one-pixel-tall sage banana slug (never gold, 11.1), bald eagle, salmon, harbor seal. All are wildlife and behave like it (7.11).
- **People:** a ranger with a flat hat; **Ranger Jon**, the same flat hat plus a coil of rope (his badge is one paper-cream pixel, and a Look reads it for you: *"You see Ranger Jon. His badge says 104."*); the 104 Boyz, other hikers in teal, slate and moss jackets, each to get a detail of their own when you've named them (7.11); the car, the same dusty one for every hiker. The engine can draw extra party members in other jacket colors, but v1 never does on the trail.
- **At the cabin** (11.11): the hiker sitting in an Adirondack chair or soaking in the tub; the crew on summer weekends, three figures in teal, slate and moss with a dog; steam off the lit tub; smoke from the fire bowl.
- **The censor bar** (Larry moments only, 2.6): an ink (0) bar about 40x7 picture pixels, far too big for the 7x18 hiker it covers, with CENSORED in a 4x5 pixel font in snow (4). It sits on the sprite layer, so the hiker pose under it is never drawn at all.
- **The remains** (Old School only, one screen per death): a small cartoon skeleton (16x6) lying on its back with its hands folded, beside the pack sprite of the pack the hiker carried. Snow (4) bones with paper-cream (5) shading and an ink (0) outline, tidy and KQ-comic, never gory: no injury, no blood, and never posed to show what happened. It exists only to turn to dust (11.10).

### 11.7 The scene composer: hundreds of places, about 24 drawn by hand

The park has 449 places in the research and roughly 500 to 600 once overlay points are compiled in (4.1). Hand-drawing each is impossible, so a place's picture is **composed from layers**, chosen by data and seeded by the place's id. Elk Lake always looks like Elk Lake, and it doesn't look like Lunch Lake.

```
 1 BASE     biome base picture
            (about 14 kinds)
 2 VARIANT  seeded: flip, horizon
            ±6 px, ridges
 3 FAR      skyline / landmark
            (Olympus, Deception)
 4 PROPS    seeded stamps: trees by
            species and elevation,
            rocks, logs, ferns,
            flowers
 5 FEATURE  lake, ford, falls,
            bridge, ladder, shelter,
            sea stack, sign
 6 SEASON   snowline, fall color,
            flowers, berries
 7 SPRITES  hiker, tent, animals
            (pose from state)
 8 WEATHER  rain, drizzle, fog
            bands, snow, stars
 9 PALETTE  time of day + weather
            tint
10 CYCLE    pseudo-colors each frame
11 HOTSPOTS merged: Look, alt text
```

**Biome bases:** rain forest, montane forest, subalpine meadow, alpine, glacier, lake basin, river valley, waterfall, beach, headland, pass, trailhead, road, store interior, ranger station interior, town, plus a camp overlay. A node's base is inferred from its type and elevation in the region data (trailhead, ford, glacier, lake, pass, coast, then elevation bands at 2,000 / 4,000 / 5,500 ft); a recipe can override anything. Each region node already carries `scene_art_notes` from the research, which become recipes.

**Skylines** are drawn once and reused wherever they're visible: the Olympus massif, the Bailey Range, Mount Deception and the Royal Basin walls, Mount Constance, Mount Anderson, the Enchanted Valley walls, Storm King over Lake Crescent, the Strait and Vancouver Island, the sea stacks of Point of the Arches, Rialto and Toleak, Grand Valley.

**Seasonal and weather overlays:** ground above the snowline switches to snow dithers; fall color swaps vine maple and huckleberry to rust and brick; flowers by month and elevation; fog hides the far layer and lays bands across the middle; stars and the real moon phase for the trip date.

**About 24 hand-drawn signature scenes** get an illustrator's full attention, still accepting palette, weather and sprite layers. They arrive with their milestones (15):
- **The first playable (M1):** **the cabin at Lake Quinault** (the home scene, in its seasons and times of day, 11.11); the High Divide at dusk (Session 1's cover, now the loading art, and the Hike of the Day card's picture whenever the day's route is on the loop); **Lake Morgenroth, your favorite spot** (M1b), drawn from your GPS track, photos and stories (4.3, B.7); the town street in Port Angeles and the store interiors (one interior drawn three ways, by each store's palette, 5.2); the WIC counter, with the number card on it (drawn in from M1b, with the call, 15); the flat lay's deck boards (6.1); US 101 along Lake Crescent, on the town run; Sol Duc Falls; Seven Lakes Basin from the rim; Heart Lake; the Bonfire Lily in the blue snow; the car at the trailhead, for the ending's stamp (12.22); and the soak (12.24).
- **The Hoh and Olympus (M2):** the Hall of Mosses; the Hoh braids with elk; the Glacier Meadows ladder; the Blue Glacier from the moraine; Snow Dome and the summit block at dawn.
- **Royal Basin (M3):** Royal Lake under Mount Deception; Upper Royal Basin.
- **Later (M4-M5):** Hurricane Hill and the Bailey Range; Grand Valley and Moose Lake; the Enchanted Valley chalet; Rialto's Hole-in-the-Wall; Shi Shi and Point of the Arches.

Each is drawn in the shape language of 11.1, and none is modeled on a picture from *The Golden Glow* (10.1).

**The death sequence adds no 25th scene** (9.5, 12.17). The death box is the place's own picture drained to cold blue-grays (12.17). *YOU PERISHED* is type on ink-black (11.10). The Leave No Trace screen is the place's own composed picture with the remains sprite over it (11.6). The epitaph screen and the GAME OVER card share one new stamp on the trailhead base: the wooden **register box** on its post, a pencil on a string, drawn with its lid open (the epitaph is being written) and closed (GAME OVER). The same box stands on the register post at the cabin and heads the Trail Register screen (12.3). The cabin at dusk after a death is a state of the cabin scene, not a new one (11.11).

**Respect:** the Ozette petroglyphs are shown only at a distance, never up close or copied into a picture, and Tskawahyah Island stays off-limits, as the research notes.

### 11.8 Art tooling: Claude can see its own pictures

AI-drawn vector art drawn blind would break. So the same picture VM runs in Node and writes PNGs (4x nearest-neighbor, in any palette) and per-region contact sheets. **Claude opens the PNGs and critiques its own art**, which makes pictures iterable like code. A picture lint catches unknown stamps, out-of-bounds points, fills covering more than 60% of a non-sky layer (usually an unclosed outline), deep stamp recursion, off-canvas hotspots, and color 7 (bonfire gold) anywhere but the Bonfire Lily's own recipes and stamps (11.1). The reference look is option B of `design/art/style_options.png`, rendered by `design/art/style_mockup.py`; new pictures are judged against it side by side. An in-browser picture editor is a likely later tool for the 24 hand-drawn scenes.

### 11.9 Type and accessibility

Sizes are specified in **device pixels**, because on a 3x phone the crisp unit is a third of a point.

- **Chrome** (status line, labels, choice labels, the pencil strip): an EGA 8x14 bitmap-style font (for example *Px437 IBM EGA 8x14*, CC BY-SA 4.0, credited in Credits), drawn at **4 device pixels per font pixel on 3x phones** (10.7 pt per character, glyphs about 19 pt tall) and **3 per font pixel on 2x phones** (12 pt per character). A 343-pt button minus its 44-pt (i) square holds about 28 characters on 3x and 25 on 2x.
- **Choice labels** are capped at **22 characters**. The odds tag (up to 10 characters, such as `♦ 55-75%`) sits on the same line when it fits; otherwise the button grows to two lines with the tag right-aligned on its own line. The ♦ fail share always takes the second line. Lint T02 checks every label at 375 pt.
- **The box text:** a proportional pixel font (an OFL font such as *Pixelify Sans*, or a custom one). Characters per line are **derived from the measured font metrics**, not assumed: about 31 per line at 343 pt for the default size.
- **Plain font:** a bundled OFL serif for readability, also used when iOS Larger Text is on.
- **Text is real HTML**, not canvas, so VoiceOver reads it and it scales. Every composed picture generates **alt text** from its layers (*"A meadow under a blue sky. Mount Olympus far away. A marmot on a rock."*).
- Fonts are self-hosted (woff2) so the game works offline. In the palette (11.1), ink on snow is about 14:1 contrast, brick on snow (the ♦ and fatal shares) about 6.7:1, and night screens use paper cream on ink (about 12:1). Rust on snow is only about 3.6:1, so rust never carries text.
- **Gold is never told by hue alone.** Bonfire gold and glacier blue are almost the same brightness (about 1.2:1), so the glow plate uses the night palette, where the snow is slate and the gold stands out by brightness too (about 3.7:1), and the plate's alt text says what is there (10.2).

### 11.10 YOU PERISHED and the Leave No Trace dissolve (Old School)

Two screens of the death sequence (9.5) need the renderer, and so does the wipe at the cabin. Neither needs new scene art beyond the remains sprite (11.6) and the register-box stamp (11.7).

**YOU PERISHED** is type, not a picture. The letters are drawn into the 160x168 picture buffer from an 8x14 EGA bitmap font at double size, so each letter is 16x28 picture pixels: *YOU* on one line and *PERISHED* (128 pixels wide) on the next, snow (4) on ink (0), scaled like any picture (11.2), and as big and blocky as the screen allows. The canvas is labeled *"You perished"* for VoiceOver. The cause line under it is real HTML text in the chrome font, paper cream on ink.

**The Leave No Trace picture** is the place where it happened, drawn from its usual recipe and seed in the Day palette with the weather layer off: exactly the picture that place has on a fine day. The sprite layer holds only the remains, at the scene's campsite or trail-spot anchor (11.6). Where the death happened in water or ice, the remains lie at the last place the hiker stood: the gravel bar at the ford, the foot of the headland, the edge of the moraine.

**How the dissolve renders:**
- **Cache the scene once.** Layers 1-6 compose into one 160x168 index buffer, cached for the screen. The remains are a separate list of opaque pixels (about 120 to 180, skeleton plus pack).
- **A seeded dissolve order.** Each remains pixel gets its turn in three dither passes, the `checker25` pixels first, then `checker`, then the rest (11.4), so the bones fade through the same dithers as the skies. Within a pass the order is `hash(trip seed, "dust", x, y)` on its own display-only stream (E.8), biased so the upwind side goes first. The same death always shows the same dissolve.
- **A pixel turns to dust.** At its turn a pixel becomes pseudo-color 25, `dust` (11.5), which resolves by age: paper cream (5) for 2 frames, bark (10) for 2, slate (2) for 2, then gone. All three are in the palette, so the screen never shows a 17th color.
- **A few frames of drift.** A loose mote moves 1 px downwind per frame for 3 to 6 frames (seeded), rising or falling 1 px on some of them, then vanishes, and the cached scene pixel shows through. Motes live only in the picture buffer and never cross into the text.
- **Each frame:** copy the cached buffer, draw the bones still standing and the live motes into it, then remap and blit once (11.4, E.10). It runs at 10 frames a second, chunky on purpose, at well under a millisecond a frame.
- **Timing:** about 0.8 s still on the bones, about 4.5 s of crumbling, about 2 s for the last motes to blow away: about 7 seconds in all. Then a Sierra box draws in with one line, *Leave No Trace.*, and the *Next* button (DRAFT). Nothing advances on its own (12.1).
- **The wipe at the cabin** (2.2) uses the same renderer on the cabin plate: the trip reports by the fire bowl and the route signs on the shed wall are the remains, with the cabin as the cached scene.
- **A tap skips** straight to the empty scene and the box.
- **Reduce Motion:** no dissolve and no drift. A plain cross-fade of about one second goes from the scene with the remains to the scene without them, then the box.
- **Sound and words:** a faint hiss that thins as the dust goes (13.2), and alt text that tells it: *"Bones and a pack lay beside the trail on the High Divide. They crumbled to dust and blew away, and the crest was as it had been."*

### 11.11 The cabin: art brief

*The home scene (2.2), drawn from a written description of your photos and never from the photos themselves. No photo is traced, copied or committed (16). Chunky AGI pixels in the 16-color palette (11.1): one hand-drawn signature scene that takes Session 1's cover slot as scene number one (11.7).*

**What it is, in words.** A steep-gabled, nearly A-frame cedar cabin with vertical board-and-batten siding, warm red-brown weathering to silver-gray. Deep overhanging eaves show the gable framing and a king post. A tall arched window sits high in the gable, and two banks of three tall windows flank a wood-framed screen door, with small lantern lights beside it. A raised deck runs across the front, with wide steps and four pale blue-gray Adirondack chairs with little side tables. An antenna stands at the peak. To the right is a small matching gabled shed with one small window, and at the porch's right corner a green inflatable hot tub on a small low deck. Out on the lawn is a big rust-colored iron fire bowl. The lawn is a wide meadow dotted with mole hills, under huge mossy bigleaf maples, with a towering Sitka spruce behind the roof and a snow-dusted rocky peak above the trees.

**Canvas and composition.** A 160 x 320 tall plate, the cover's size and slot in Session 1's title page: 373 x 427 pt on an iPhone 15 at 7x4 device pixels. The steep gable suits portrait: the peak, the spruce and the roof stack up the screen. Rows run top to bottom; positions are approximate.

| Rows | Band | What's there |
|---|---|---|
| 0-70 | Sky | Dithered bands by time of day; stars and the moon at night; weather |
| 30-95 | Far | The snow-dusted rocky peak, left of center, so the spruce doesn't hide it |
| 15-150 | Mid | The Sitka spruce behind the roof, its crown above the ridge; bigleaf maples left and right, their limbs heavy with moss |
| 95-215 | The cabin | The steep gable, the antenna, the arched window, the eaves with framing and king post, the two banks of windows, the screen door, the lanterns |
| 212-232 | The porch | The deck with its wide steps; four Adirondack chairs and side tables; the chalkboard leaning by the steps |
| 165-232 | Right | The shed with its one window; the tub on its low deck at the porch's right corner |
| 232-320 | The lawn | Mole hills; the fire bowl in the center foreground; the register post at the left edge, where a path enters the maples; the car at bottom left; the mailbox at bottom right |

**Layers:** the picture VM's four (11.3) plus the scene composer's overlays (11.7): sky (with stars and the moon on clear nights); far (the peak, its snow line by season); mid (spruce, maples, forest band); near (cabin, porch, shed, tub, lawn, fire bowl, post, car, mailbox); season; props (the trip-progress and career marks of 2.2); sprites; weather; palette; cycle; hotspots with their alt text.

**The palette, object by object.**

| Object | Slots (11.1) | Notes |
|---|---|---|
| Siding | 9 brick, 10 bark (vertical lines) | Silvering toward the base and on the weather side: a 2 slate or 3 glacier-blue dither |
| Roof | 11 spruce, 0 ink shade, 13 moss dither | In winter, 4 snow with skylights in 2 slate |
| Gable framing, king post | 10 bark, 0 ink | |
| Windows | 3 glacier-blue panes, 0 ink frames | Lit at night by the lamp pseudo-color (24) |
| Lanterns | 5 paper cream, lamp (24) | Exempt from the night remap |
| Deck and steps | 3 glacier blue + 2 slate, silvered | 0 ink seams |
| Adirondack chairs | 3 glacier blue, 2 slate shade | Pale blue-gray |
| Antenna | 0 ink | A 1-pixel lamp light blinks when today's hike is new |
| Hot tub | 13 moss, 12 forest shade, 15 teal water | A 12 forest cover when cold; steam from pseudo-color 26 |
| Fire bowl | 8 rust, 9 brick | The fire cycle (20) when lit; 2 slate ash |
| Sitka spruce | 11 spruce, 12 forest | Stacked tiers with drooping tips, taller than everything |
| Bigleaf maples | 10 bark trunks; 13 moss, 14 sage on the limbs | Licorice-fern stamps in 12 forest |
| The peak | 2 slate rock, 4 snow, 3 glacier-blue shadow | 6 alpenglow pink at dusk and dawn |
| Lawn, mole hills | 13 moss, 14 sage; 10 bark mounds | |
| Chalkboard, mailbox | 0 ink with 5 paper chalk; 2 slate with an 8 rust flag | |
| Tents | 15 teal, 2 slate, 13 moss | The Boyz' jacket colors (11.6) |

**Never gold (7).** Bigleaf maples turn yellow in autumn ([WSU Extension](https://extension.wsu.edu/maplesyrup/bigleafmaple/)), so here their leaves are 14 sage over 5 paper cream. Warm window light is paper cream, and the fire bowl's flame uses the fire cycle. The one exception is the Bonfire Lily's sketch in the gable window (2.2).

**Seasons**, by the real date (2.2):

| Season | The maples | Ground and roof | Extras |
|---|---|---|---|
| Spring, March to May | Bare, with bright moss; new leaves in May | A bright lawn, fresh mole hills | Bright sun on bare mossy limbs; sun breaks |
| Summer, June to September | Full leaf | A lawn going sage by August | Long dusks. On crew evenings: tents on the lawn, camp chairs, a cooler, a dog, friends on the porch |
| Autumn, October and November | Sage and paper-cream leaves, falling | Leaves on the lawn | Fog, rain, low cloud |
| Winter, December to February | Bare and mossy | Snow only when the forecast says snow: a deep white roof with its skylights showing, a deep lawn, a buried deck, icicles. Otherwise rain | The fire bowl wears a cap of snow |

**Time of day and weather.** The existing remaps (11.4): Day, Dusk, Blue hour and Night, with Dawn on the Dusk table. The lights resolve after the remap: windows, lanterns, the antenna light, fire, steam, stars and moon. Weather uses the shared overlays: rain curtains (`vlines`), fog bands that hide the far layer and cross the maples, falling snow, and a two-frame thunderstorm flash.

**States:** normal; a trip in preparation (the four props of 2.2); homecoming (the car pulls in; the fire bowl lit in the evening); tub lit (cover off, steam, the 104°F thermometer); the crew around (tents, camp chairs, a closed cooler, the dog, figures on the porch); after a death (dusk, one chair empty, the tub covered, the bowl cold); first launch (the lockbox lit by one lantern, the guest book open).

**The hotspot map,** in picture pixels on the 160 x 320 plate. A 44-pt target is about 19 x 33 pixels at 7x4 on a 3x phone, so hit areas are drawn bigger than the art.

| Place | Art (x, y, w, h) | Hit area (x, y, w, h) |
|---|---|---|
| Peak | 20, 30, 75, 60 | 10, 20, 90, 70 |
| Screen door | 73, 180, 14, 32 | 66, 175, 28, 40 |
| Chalkboard | 52, 214, 12, 14 | 40, 200, 26, 36 |
| Shed | 130, 165, 28, 65 | 126, 160, 34, 70 |
| Hot tub | 112, 218, 24, 16 | 104, 205, 28, 36 |
| Car | 0, 280, 40, 40 | 0, 272, 44, 48 |
| Fire bowl | 68, 262, 24, 14 | 56, 250, 46, 36 |
| Register post | 4, 225, 10, 37 | 0, 220, 24, 46 |
| Mailbox | 142, 292, 12, 22 | 132, 284, 28, 36 |
| Guest book | 58, 212, 8, 4 | First launch only; the rail otherwise |

**New stamps and sprites.** Stamps: the cabin, one per season; the shed; the tub, with and without its cover; the fire bowl, cold and lit; an Adirondack chair; the chalkboard; the register post; the mailbox, flag up and down; mole hills; a bigleaf maple, bare and in leaf; a Sitka spruce; a tent; a cooler; the clam gun; route signs; the race bib; the lily sketch (gold, the lily's own mark). Sprites: the hiker sitting and soaking; three crew figures; the dog. Pseudo-color 26, `steam` (11.5).

**Rules.** Draw from the words, never from the photos. No sign, number, road name or shoreline that would place the cabin. Gold only in the lily's own sketch. The shape language of 11.1 applies: flat layered bands, stacked-tier conifers, dithers only where they belong.

**Cost:** about 2 to 3 sessions for the plate and its overlays, judged against the PNG renders (11.8): close to what the cover took in Session 1, plus the seasons.

---

## 12. iPhone screens

The screens before the trail (the cabin, the map table, the permit, town and the flat lay) use the first playable's example trip, Robin's from Appendix B.2: ↻ river first, three nights, Thursday to Sunday, August 12 to 15, 2027, `Score: 0 of 170` at the permit. The trail screens use Robin's four-night Hoh trip (Lewis Meadow, Glacier Meadows twice, Five Mile Island), Jul 14 to 18, 2027, `Score: 0 of 131` at the permit, because its Day 1 has the ford that the odds screens need: the trailhead at 9:40 am (12.10), the braids at mile 8.0 about 1:35 pm (12.2, 12.11, 12.13), and camp at Lewis Meadow, mile 10.4, about 3:20 pm, half an hour behind the planned 2:50 because of the ford (12.14). Screens from other trips say so. The Hoh arrives in M2; on the loop these are the same screens with Sol Duc's places in them.

**Every word inside a wireframe is a DRAFT** for you to rewrite (decision 21), and so is every quoted line under one. The Hike of the Day's board and the FKT board get their wireframes with the modes; their places at the cabin are already in 12.3.

### 12.1 Global rules

- **Viewport:** `width=device-width, initial-scale=1, viewport-fit=cover`. Installed as a Home Screen web app named **OP Hiker** (`display: standalone`, portrait). iOS ignores the manifest's orientation, so in landscape a small plate asks you to hold the phone upright (DRAFT wording; Session 1's line said "book" and is retired).
- **Safe areas:** the app pads with `env(safe-area-inset-*)`. The status line sits below the Dynamic Island; the toolbar sits above the home indicator.
- **Height:** `100dvh`, `overscroll-behavior: none` (no rubber band), `touch-action: manipulation` (no double-tap zoom). Only explicit panes scroll (a store's list, the flat lay's drawer, the log, the trip report).
- **Targets:** at least 44x44 pt everywhere, the cabin's hotspots included (11.11). The status line is 22 pt tall, so ≡ and Sound get invisible 44x44-pt hit areas that extend below it. Choices are full width, 52 pt tall (64 pt when the odds tag takes a second line), 8 pt apart, in the bottom half (the thumb zone). The **(i) is its own 44x44-pt square** at a choice's right edge, so a slightly-off tap on the odds never commits the choice. Picture hotspots get a hit area of at least 44 pt.
- **♦ choices need a confirming tap.** Tapping one turns it, in place, into `Climb the ladder?  [Yes]  [Not yet]`; when it carries a fatal share, the prompt reads (DRAFT) `This could be fatal. [Yes] [Not yet]`. Nothing critical happens on a single brush of the thumb.
- **Touch only.** On the trail, swipe left on the box to walk on (always duplicated by the *Walk on* button, DRAFT); swipe right to open today's log. Elsewhere the button reads *Next* (DRAFT). **Swipes that start within 24 pt of a screen edge are ignored**, so they never fight Safari's edge-swipe Back. Long-press is an accelerator (the Why sheet, an item's card, a place's name at the cabin), never the only way. Choices and the picture set `-webkit-touch-callout: none` and `user-select: none`, so a long-press never selects text or opens the iOS callout menu. The only typing is the hiker's name in the guest book, which has a suggest button (12.4), and the optional epitaph on the death sequence's epitaph screen (up to 40 characters), which has the dice beside it (12.17); and, in the hidden debug menu, the bug-report note (E.11).
- **Browser history:** trip screens use `history.replaceState`, so the browser's Back button can never rewind a trip. A `popstate` (Back pressed in a Safari tab) opens the ≡ menu instead.
- **No timers, ever,** outside the clock you choose to race (the Hike of the Day and FKT attempts score elapsed trail time; nothing on screen counts down).

**Space check** on the trail, at the default text size, with three choices:

| Device | Fixed parts (pt) | Box (pt) | About |
|---|---|---|---|
| iPhone 15/16 (393 x 852) | safe 59, status 22, picture 224, caption 40, strip 32, choices 172, toolbar 50, safe 34 | ~219 | 8 lines |
| iPhone SE (375 x 667), short-screen layout | safe 20, status with toolbar folded in 22, picture 168, caption 40, strip 32, choices 172 | ~213 | 8 lines |
| iPhone SE with a 4x3 picture and a toolbar (rejected) | as above, but picture 252 and toolbar 50 | ~79 | 3 lines |

**Short screens** (under about 700 pt tall) therefore use the 4x2 picture (11.2) and fold the toolbar into the status line, with Pack, Map and Log behind ≡.

**Box budget.** Lint T02 checks that every box fits at 375 x 667 with three choices and at 393 x 852 with four, using measured font metrics: about **240 characters** is the most a box can hold, and the recommended voice aims for about 140 (2.3). A box that doesn't fit (a four-choice stop on an SE, or any box at the Large text setting) continues in a second box (▾ in the corner, the way King's Quest showed a long message), never a scroll. The lint also warns about boxes that would continue at Large text on an SE.

### 12.2 The trail screen (every stop)

```
┌──────────────────────────────────────┐
│ Score: 22 of 131         ≡  Sound:on │
│ ┌──────────────────────────────────┐ │
│ │   PICTURE 160x168, 16 colors     │ │
│ │   Hoh braids: three milky        │ │
│ │   channels, elk on the far       │ │
│ │   gravel, a dipper on a rock     │ │
│ │   (tap the picture = Look)       │ │
│ └──────────────────────────────────┘ │
│ Day 1 · 1:35 pm · Hoh braids · Jul   │
│ Warm:ok  Legs:tired  Feet:ok  ♥♥♥♥○  │
│ ▁▁▁▁▂▂▂▂▂▂▃▃▃▃▃▃▄▄▅▆▇█     mi 8.0    │
│ T━━━━━━━●──L────E─────G              │
│ SPLIT braids 3:55 · on plan          │
│ ╔══════════════════════════════════╗ │
│ ║ (DRAFT) The bridge is gone. The  ║ │
│ ║ river has split into three gray  ║ │
│ ║ ropes.                           ║ │
│ ╚══════════════════════════════════╝ │
│ ╔═════════════════════════════╗╔═══╗ │
│ ║ Wade across now  ♦ 83-93%   ║║ i ║ │
│ ║          7-17% goes badly   ║╚═══╝ │
│ ╚═════════════════════════════╝      │
│ ╔═════════════════════════════╗      │
│ ║ Camp, cross at dawn   night ║      │
│ ╚═════════════════════════════╝      │
│ ╔═════════════════════════════╗      │
│ ║ Turn back to the car   sure ║      │
│ ╚═════════════════════════════╝      │
├──────────────────────────────────────┤
│ [Pack]       [Map]        [Log]      │
└──────────────────────────────────────┘
```

- **The box** is the Sierra message box (2.4): snow (4) fill, a double brick (9) border, ink (0) text, a small inner margin, drawn in CSS around real HTML text. It holds one or two short lines, or nothing at all: a quiet stop may have no box, and the scene and its sound carry it (decision 32).
- **The strip** between the caption and the box is today's elevation profile, with a tick for each checkpoint (the trailhead, falls, junctions, lakes, camps), a dot for you and the mile, and under it the last **split** against the plan's ETA (7.4). FKT attempts show splits against the record instead, with the modes.
- **The choices** are matching boxes. This ford is ♦ because at thigh depth in the afternoon "swept" is in its fail table (8.1); the fail share takes the second line. It shows no fatal share, because at thigh depth "swept" ends in a rescue. A ♦ that can kill adds its fatal share to that second line in red: `21% fall · 0.3% fatal`.
- **The toolbar** opens one modal with three tabs: **Pack** (contents with states: wet, used, lost, outside, battery; food left by meal; water; weight; the conditions), **Map** (the park map, your route dotted, "you are here", today's profile and splits) and **Log** (the hiker's first-person log, day by day, with each day's headline, 2.3). There is no field guide tab: nothing is collected. On short screens it folds into ≡.

### 12.3 Home: the cabin, and the Trail Register

**First launch only: the key lockbox** (2.2; the locals' quiz from 2.6, one of the Larry moments). Before the guest book, three questions, one screen each, dealt from the pool in `content/quiz/locals.json` (E.5):

```
┌──────────────────────────────────────┐
│ ┌──────────────────────────────────┐ │
│ │ THE CABIN at dusk, drawing       │ │
│ │ itself in for the first time; a  │ │
│ │ key lockbox on the porch post,   │ │
│ │ lit by one lantern               │ │
│ └──────────────────────────────────┘ │
│ ╔══════════════════════════════════╗ │
│ ║ (DRAFT) The key is in the        ║ │
│ ║ lockbox. It wants three answers. ║ │
│ ║                                  ║ │
│ ║ Question 1 of 3. How do you say  ║ │
│ ║ SEQUIM?                          ║ │
│ ╚══════════════════════════════════╝ │
│ [ See-kwim                         ] │
│ [ Skwim                            ] │
│ [ Seh-kwim                         ] │
│                                      │
│ Wrong: "Nice try, tourist." Right:   │
│ "Welcome home." Either way, the      │
│ next question, then the key.         │
└──────────────────────────────────────┘
```

Each answer is a choice button; there is no typing and no timer. After the third, one closing line (DRAFT: *"Three for three. Welcome home."*, or *"None for three. Come in anyway. The mountains don't check."*), the lockbox opens, and *Next* goes to the guest book (12.4). The device record remembers that the quiz was taken, so it never comes back on this phone, not after a death and not after an update (E.6). VoiceOver reads it like any screen.

**Home: the cabin.** Every place in the picture is a menu, and the rail under it repeats them (2.2):

```
┌──────────────────────────────────────┐
│ Wed 7:52 pm · blue hour · clear    ≡ │
│ ┌──────────────────────────────────┐ │
│ │ THE CABIN, 160x320, live time    │ │
│ │   .  *   the peak, snow-dusted   │ │
│ │   /\/\/\         [ FKT ]         │ │
│ │  spruce   /\  antenna light: on  │ │
│ │  maple   /()\  gable window lit  │ │
│ │  moss   /____\   shed  [ Gear ]  │ │
│ │ [Today] ▌▌▌ ▯ ▌▌▌    [ Plan ]    │ │
│ │ ==porch, 4 chairs==  tub (lid)   │ │
│ │  groceries on the steps          │ │
│ │ [Register]      fire bowl, ashes │ │
│ │  post            [ Stories ]     │ │
│ │ car [ Drive ]      mailbox  [≡]  │ │
│ └──────────────────────────────────┘ │
│ [ Next: lay out your gear       >  ] │
│ [  Today   ][   Plan   ][   FKT    ] │
│ [   Gear   ][  Drive   ][ Stories  ] │
│ [ Register ][≡ Mailbox ]             │
└──────────────────────────────────────┘
```

- **The picture is the menu.** Its places carry small labels until each has been used once (2.2).
- **The rail repeats the places,** and the next-step button names the next thing this trip needs.
- **This is the evening after the town run:** groceries on the steps, the tub covered, the antenna light blinking for a new Hike of the Day.
- **The first time,** a one-line note (DRAFT) explains why to **Add to Home Screen** before the first save (it replaces Session 1's line about "the Home Screen book"), and the mailbox shows a "works offline" stamp (DRAFT) once everything is cached (E.7).
- **A trip in progress** skips home: the game opens on the trail (2.2).
- **When there is no living hiker,** the very first time and after a death, the guest book lies open on the porch table and the next-step button reads *Sign the guest book* (DRAFT), which opens 12.4.

**A trip that ended in GAME OVER never sits by the fire bowl:** the full wipe takes it with everything else the hiker had (9.8). What remembers it is **the Trail Register**, opened from the register post at the edge of the lawn, styled like the paper register at a trailhead:

```
┌──────────────────────────────────────┐
│ < Cabin      THE TRAIL REGISTER      │
│ ┌──────────────────────────────────┐ │
│ │ A wooden register box on a post, │ │
│ │ lid open; a pencil on a string   │ │
│ └──────────────────────────────────┘ │
│ BEST TRIPS (share of each maximum)   │
│ 1 Robin   Seven Lakes, 3 nts  87%    │
│ 2 Sam     High Divide, 2 nts  84%    │
│ 3 Robin   Royal Basin, 2 nts  81%    │
│ ...                                  │
│ REMEMBERED                           │
│ ▌ Robin · Sep 25-26, 2027            │
│ ▌ Glacier Meadows, the first night   │
│ ▌ Score 25 of 64 · died of cotton    │
│ ▌ "It was terribly cold."            │
│ ▌     C. A. Barnes, 1890             │
│ ▌ Jo · Jul 30, 2027                  │
│ ▌ the Hoh braids · died of the river │
│ ▌ Score 14 of 52                     │
│ ▌ "Should have crossed at dawn."     │
│ ▌ {BOY_1} · Aug 9, 2019              │
│ ▌ Heart Lake, after dark             │
│ ▌ Score 61 of 88                     │
│ ▌ died of skinny dipping             │
│ ▌ "Worth it."                        │
│ ▌ ...                                │
│ [ Close ]                            │
└──────────────────────────────────────┘
```

Best trips rank by the share of each trip's own maximum, so a lovely day hike can sit above a long trip. They are the register's Top Ten, and they outlive their hikers: Robin's two best trips stay at the top after Robin's death, and Sam, the next hiker, slots in between. *Remembered* lists every hiker whose trip ended in GAME OVER, newest first, with the place, the dates, the score reached, the cause and the epitaph in quotes. Robin's line was dealt by the dice, so its credit sits under it; Jo, an earlier hiker on this phone, typed theirs (9.5). At the bottom, older than anyone on the phone, are the 104 Boyz' pre-filled lines (your call, 7.11): `{BOY_1}`, dead of skinny dipping at Heart Lake and not sorry about it, is one of them, a fictional death with a funny epitaph, and the real names drop in when you send them. To a stranger they are old lines in an old register (2.2). It is the game's only graveyard, and there is no stone in it: Leave No Trace. Tapping a line opens a small card with the trip's title and the full *YOU PERISHED* line. Only Old School trips are ever listed (9.4).

### 12.4 A new hiker: the guest book

```
┌──────────────────────────────────────┐
│ ┌──────────────────────────────────┐ │
│ │ THE PORCH TABLE: an old guest    │ │
│ │ book, open; the earlier pages    │ │
│ │ full of other people's writing   │ │
│ └──────────────────────────────────┘ │
│ ╔══════════════════════════════════╗ │
│ ║ (DRAFT) Sign the guest book.     ║ │
│ ╚══════════════════════════════════╝ │
│ Your hiker's name                    │
│ [ Robin                 (suggest) ]  │
│ (DRAFT) One life. If your hiker      │
│ dies, the trail ends, and their      │
│ stories go with them.                │
│ [ Sign  >                          ] │
└──────────────────────────────────────┘
```

**A name, and nothing else** (your decision, 2026-10-08: *"less is more"*). Every hiker starts the same: Regular fitness, 165 lb, beginner's skills (glacier at 0), the rust jacket and the same starting shed (7.3, 5.1). There are no backgrounds or occupations, no pronoun, fitness or jacket pickers, no glacier-course box and no mode to choose (9.4). Under the recommended voice the moment never names the hiker; the permit, the log, the register and the report do, with *they* where a sentence needs a pronoun (2.3). *Suggest* offers a random first name; names are up to 12 characters, so they fit a register line. The old one-life line said "book" and is retired; this one is a draft.

The guest book opens only when there is no living Open hiker: the first time the game opens (just after the lockbox, 12.3), and after a death. **After a death,** it starts a new hiker from nothing: a new name, beginner's skills, a first trip, and nothing inherited (9.8). The guest book's earlier pages hold older signatures, an easter egg for insiders (2.2); the dead hiker's one new line is in the Trail Register, at the cabin's post and on the trailhead kiosk (12.3, 12.10).

### 12.5 The map table: itinerary builder

The park map fills the picture area; the itinerary is a bottom sheet with three heights (peek, half, full), written like a permit. Here Night 1's camp list is open, on the Hoh trip:

```
┌──────────────────────────────────────┐
│ < Park map    THE HOH & OLYMPUS      │
│ ┌──────────────────────────────────┐ │
│ │ REGION MAP (the park map; pinch) │ │
│ │ T Hoh ··5mi▲··OGS▲··Lewis▲··     │ │
│ │     ··Elk Lk▲··Glacier Mdws▲     │ │
│ │ (Lewis Meadow highlighted)       │ │
│ └──────────────────────────────────┘ │
│ ┌─── YOUR TRIP (drag up) ───────────┐│
│ │Start: Hoh Rain Forest TH [change] ││
│ │[Day][1][2][3][4][5][6+] nights    ││
│ │Date: [Jul][Aug][Sep] Jul 14, 2027 ││
│ │Night 1: choose a camp             ││
│ │ ▸ Lewis Meadow   10.4mi  +640     ││
│ │     arrive 2:50 pm · quota OK     ││
│ │   12.4 Mile Camp 12.4mi  +900     ││
│ │     arrive 3:50 pm                ││
│ │   Elk Lake       15.3mi  +2,250   ││
│ │     arrive 6:15 pm · quota OK     ││
│ │   Martin Creek   (full that night)││
│ └───────────────────────────────────┘│
│ [ Write it on the permit  >        ] │
└──────────────────────────────────────┘
```

Once chosen, a night collapses to one line (`Night 1  Lewis Meadow  10.4mi +640`), with **Stay again** and **Move on** on the next night's row, and the plan's note appears under the trip (DRAFT: *"Day 2 is a climb. The ladder is no place to be at dusk."*). Before this screen, the park map offers *the ranger's favorite trips*, the old ranger's binder on the table (presets, filtered, 3.1).

**A first trip: the loop, three questions** (3.6). In M1 a first trip skips the park map and opens on the High Divide loop:

```
┌──────────────────────────────────────┐
│ < Cabin                THE MAP TABLE │
│ ┌──────────────────────────────────┐ │
│ │ THE PARK MAP on the cabin table, │ │
│ │ the loop inked in: T .. Deer Lk  │ │
│ │ .. the rim .. Heart Lk .. Sol    │ │
│ │ Duc Park .. the river .. T       │ │
│ └──────────────────────────────────┘ │
│ Which way round?                     │
│ [↺ Deer Lake first][↻ River first]   │
│ How long?                            │
│ [Day] [1 night] [2] [3]  more: map   │
│ Up high?                             │
│ [Drop into the basin] [Stay high]    │
│ [ Fill in the camps  >             ] │
└──────────────────────────────────────┘
```

Each chip shows its honest line under its row when tapped (all DRAFT): *↺ Deer Lake first*, *"Steep first, the crest in the afternoon, Deer Lake's water."*; *↻ River first*, *"Gentler first, the crest in the morning, knees at the end."*; *Drop into the basin*, *"Lunch Lake, the lakes and the stone stairs."*; *Stay high*, *"The crest, Bogachiel Peak and the view."* The Day chip gets its note (3.6). *Fill in the camps* writes the nights for that answer (the twelve fills, B.1) into the itinerary sheet, where each night is one tap from changing, and then goes to the permit. Nothing is preselected: three taps and the button, because each of these is the player's to make.

**The call: off the menu** (M1b; 4.3; Appendix B's trip, B.7). Lake Morgenroth has no row and no camp mark, and tapping the lake on the map gets only a plain Look, the same as any unnamed tarn's (*"You see a small lake with no camp mark."*), so the planner never hints. The way in is the WIC's number: the small print at the foot of the itinerary sheet and of the permit (12.6), or the cabin's old wall phone by the map table, a Look hotspot. Robin, at the map table, taps it:

```
┌──────────────────────────────────────┐
│ < Map table     THE WIC LINE         │
│ ┌──────────────────────────────────┐ │
│ │ The cabin's old wall phone by    │ │
│ │ the map table; the cord across   │ │
│ │ the park map; rain on the window │ │
│ └──────────────────────────────────┘ │
│ ╔══════════════════════════════════╗ │
│ ║ (DRAFT) Two rings, then a click. ║ │
│ ║ "Wilderness Information Center." ║ │
│ ╚══════════════════════════════════╝ │
│ [ Ask about a lake                 ] │
│ [ Ask about the weather            ] │
│ [ Hang up                          ] │
└──────────────────────────────────────┘
```

*Ask about a lake* opens the basin map. Tapping a camp that's on the website gets (DRAFT) *"That one's on the website."*; Long Lake or another WIC-only camp becomes the same request as its *ask at the desk* row; Lake #8 gets (DRAFT) *"Number Eight. If you find it, tell me where it is."* Tapping the small lake east of Long Lake:

```
┌──────────────────────────────────────┐
│ < Map table     THE WIC LINE         │
│ ┌──────────────────────────────────┐ │
│ │ REGION MAP: Long Lk ▲, and east  │ │
│ │ of it a small blue lake with no  │ │
│ │ camp mark (tapped)               │ │
│ └──────────────────────────────────┘ │
│ ╔══════════════════════════════════╗ │
│ ║ (DRAFT) "Morgenroth," says the   ║ │
│ ║ voice on the line. "Nobody asks  ║ │
│ ║ for Morgenroth. Which night?"    ║ │
│ ╚══════════════════════════════════╝ │
│ [ Night 3, Saturday                ] │
│ [ Never mind                       ] │
└──────────────────────────────────────┘
```

*Night 3, Saturday* makes it a WIC-only request for that night, rolled on the call like any other (in season about 70% midweek, 40% on a weekend, seeded by the trip seed, the date and the camp, E.8). Granted, it becomes a night row like any other (`Night 3  Lake Morgenroth  1.2mi`), and the permit prints with a note (DRAFT): *Way trail. No privy. Stay off the meadow.* Refused, the voice says why in one line and offers Lunch Lake. From the WIC counter on the town run the call is the same, except that the phone on the counter rings and the ranger answers it looking at you. *Ask about the weather* gives the forecast and the climatology. The game shows the number but never dials it, and since the app shell turns off iOS's phone-number detection, tapping or long-pressing the number offers no Call, Copy or Add to Contacts (E.7, 16).

### 12.6 The permit

```
┌──────────────────────────────────────┐
│ < Map table               THE PERMIT │
│ ┌──────────────────────────────────┐ │
│ │ THE MAP TABLE: an old printer    │ │
│ │ feeding out the permit           │ │
│ └──────────────────────────────────┘ │
│ ┌─ WILDERNESS PERMIT ──────────────┐ │
│ │ Permit No. 104-0037              │ │
│ │ Party: Robin            Size: 1  │ │
│ │ Entry: Sol Duc TH · ↻ river 1st  │ │
│ │ Thu-Sun, Aug 12-15, 2027         │ │
│ │ N1   Sol Duc Park  7.1 mi +2,470 │ │
│ │ N2-3 Lunch Lake    3.8 mi +1,130 │ │
│ │ Quota: OK, all three nights      │ │
│ │ Canister: [ my own 11.5 L    v ] │ │
│ │ Plan left with: [ a friend   v ] │ │
│ │ Forecast: cloud-sun · sun · sun  │ │
│ │ Fees: $24 + $6 (shown, not paid) │ │
│ │ Questions? Call the WIC:         │ │
│ │   360-565-3100   (small print)   │ │
│ └──────────────────────────────────┘ │
│ Notes: Day 2 crosses the crest.      │
│ Thunder 20% after 2 pm Friday.       │
│ [ Print it  (clatter)              ] │
│ [ < Change the plan                ] │
└──────────────────────────────────────┘
```

**You print your own permit,** as Olympic's real permits are printed (3.1). The old rubber stamp's thunk becomes an old printer's clatter, and the printed permit is pinned to the screen door (2.2). The forecast covers the trip days within five days of the planning day (Wednesday, Aug 11); later days would show climatology. **The notes** are the plan's own checks (4.6), written as plain facts in no one's voice; the WIC ranger reads them back in her own words only if you visit the WIC. A plan with a desk request shows *Take it to the WIC* (DRAFT) instead of *Print it* (3.1).

The small print at the foot is the WIC's real number, from the region data: on any permit it is a Look hotspot that opens the call (12.5), the only way to Lake Morgenroth, and nothing on the screen points at it. It is drawn by the phone hotspot, never as loose text and never as a `tel:` link, so iOS can't turn it into a Call link (E.7). It is hidden in M1a (15).

**Every permit number starts with 104** (your wink, 2026-10-08). The four digits after it count the permits printed on this phone, `104-0001` and up. A day hike has no permit, so it never moves the counter. The counter lives in the Trail Register, so it survives a death: a new hiker's first permit carries on from the last one, the way a real permit office never starts over. Nobody explains the 104. Ranger Jon's badge, on a nail at the cabin and on his shirt on Olympus, is the other half of the joke (2.2, 4.2).

A guided Olympus trip adds Jon to the party line: `Party: Robin + Ranger Jon  Size: 2`, with the climb days marked *guided*. A solo summit plan prints a note instead (DRAFT): *Alone on the ice. Ranger advised.*

### 12.7 Town and the three stores

```
┌──────────────────────────────────────┐
│ < Cabin                 PORT ANGELES │
│ ┌──────────────────────────────────┐ │
│ │ TOWN: a wet street running down  │ │
│ │ to the Strait; three storefronts │ │
│ │ [ General ] [ Gear ] [Boutique]  │ │
│ │ and the WIC up the hill          │ │
│ └──────────────────────────────────┘ │
│ The day before · Wed Aug 11          │
│ List: Brk 0/3 · Lun 0/4 · Din 0/3    │
│ Can: own 11.5 L · 0 of 9.8 L         │
│ [ {STORE_GENERAL}                  ] │
│ [ {STORE_GEAR}                     ] │
│ [ {STORE_BOUTIQUE}                 ] │
│ [ The WIC: briefing, a loaner can  ] │
│ [ Head home  >                     ] │
└──────────────────────────────────────┘
```

A stylized street, not real storefronts: any of the four doors, or none (5.3). The WIC gives the briefing (8.6), the loaner can and the desk-only camps (3.1). Second Growth's door, next to the general store, shows on overnight trips only (2.6).

**The general store:**

```
┌──────────────────────────────────────┐
│ 0/170 · General store              ≡ │
│ ┌──────────────────────────────────┐ │
│ │ {STORE_GENERAL}: a wood floor,   │ │
│ │ tarps and rope from the beams,   │ │
│ │ tackle, a wall of boots, a beer  │ │
│ │ cooler by the register (21+)     │ │
│ └──────────────────────────────────┘ │
│ ┌─ SHOPPING LIST ──────────────────┐ │
│ │ Brk ●●○ Lun ●●●○ Din ●○○ Fuel ✓  │ │
│ │ Can 6.4 of 9.8 L · 3.2 days      │ │
│ └──────────────────────────────────┘ │
│ [ Fill from the list (cans, cheap) ] │
│ [Food][Camp][Wool][Rain][Tackle]>    │
│ Canned chili  17oz $3.00   - 1 +     │
│ Ramen          3oz $0.50   - 2 +     │
│ Cotton flannel 12oz $29    - 0 +     │
│ Canvas tarp    4 lb $49    - 0 +     │
│ (DRAFT) the shopkeeper's line        │
│ [ Pay $38.50 and go on  >          ] │
└──────────────────────────────────────┘
```

(Prices here are placeholders; real ones come from the catalogs.) The canister gauge uses the canister on the permit; when food overflows it, the gauge turns red and the shopkeeper says so (5.3).

**The gear shop:**

```
┌──────────────────────────────────────┐
│ 0/170 · Gear shop                  ≡ │
│ ┌──────────────────────────────────┐ │
│ │ {STORE_GEAR}: a wall of packs,   │ │
│ │ a scale on the counter, rentals  │ │
│ │ behind it, a topo map on the     │ │
│ │ wall (tap the scale: weigh it)   │ │
│ └──────────────────────────────────┘ │
│ [Packs][Shelter][Sleep][Food]>       │
│ Solo tent     27oz $299   [buy]      │
│  premium 18oz  $649 · fragile        │
│ Freeze-dried   5oz $13.50 - 1 +      │
│ Carbon can    31oz rent $7/day       │
│ Squeeze filter 3oz $45    [buy]      │
│ On the scale: 18 oz                  │
│ (DRAFT) staff line about grams       │
│ [ Pay $361 and go on  >            ] │
└──────────────────────────────────────┘
```

**The boutique:**

```
┌──────────────────────────────────────┐
│ 0/170 · Boutique                   ≡ │
│ ┌──────────────────────────────────┐ │
│ │ {STORE_BOUTIQUE}: moss-green     │ │
│ │ walls, plants, a sticker wall,   │ │
│ │ a dog bed by the door            │ │
│ └──────────────────────────────────┘ │
│ [Wear][Camp][Treats][Stickers]>      │
│ Wool flannel  14oz  $79  morale      │
│ Enamel mug     6oz  $28  morale      │
│ Moss beanie    2oz  $38  style       │
│ Sticker sheet  0oz   $8  on can      │
│ Smoked salmon  3oz   $9  treat       │
│ Shows in your flat lay: yes          │
│ (DRAFT) the clerk's line             │
│ [ Pay $162 and go on  >            ] │
└──────────────────────────────────────┘
```

Each row says what the item does on the trail (morale, or nothing but looks) and that it shows in your flat lay (6.1).

### 12.8 The flat lay (the pack screen)

```
┌──────────────────────────────────────┐
│ < Cabin   THE FLAT LAY · deck      ⇪ │
│ ┌──────────────────────────────────┐ │
│ │ TOP-DOWN 160x240 on deck boards  │ │
│ │ [tent][bag ][  PACK  ][pad][pfy] │ │
│ │ [rain][pnts][  50 L  ][ WORN   ] │ │
│ │ [base][sox ][ kitchen][  hat   ] │ │
│ │ [fleece   ][stove pot][  tee   ] │ │
│ │ [ BEAR CAN, lid off][ shorts   ] │ │
│ │ [brk][lun][din][snk ][ socks   ] │ │
│ │ [map][lamp][aid][fix][ shoes   ] │ │
│ │ [book][camera][mug][stickers  ]  │ │
│ └──────────────────────────────────┘ │
│ Base 19 lb 11 oz · Pack 27 lb 9      │
│ 40 of 50 L Roomy · comfortable       │
│ Can 6.6 of 9.8 L · 3.0 days food     │
│ From: shed 22 · G 5 · B 11 · M 3     │
│ [Checklist 10/10]  [Like last]       │
│ [Shelter][Sleep][Rain][Warm] >       │
│ · Rain pants   8oz   in the shed     │
│ ✓ Rain jacket 10oz   on the deck     │
│ [ Pack it  >                       ] │
└──────────────────────────────────────┘
```

The picture is the deck, seen from above (6.1). Only the drawer scrolls; the picture, the gauges and the buttons stay put. Tap a row in the drawer to lay an item out; tap an item on the deck to put it back in the shed. Long-press an item for its card: weight and volume, store, state, and where it rides, which opens the slot picker (12.9). Tap the can for the canister panel. ⇪ is the share image. The weights are computed from the catalog for a kit like B.2's; "From" counts the shed and the three stores.

**The share image** (6.10):

```
┌──────────────────────────────────────┐
│ ▓ WILDERNESS PERMIT No. 104-0037     │
│ HIGH DIVIDE LOOP · 3 NIGHTS          │
│ AUG 12-15, 2027 · ↻ RIVER FIRST      │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ │   THE FLAT LAY: 160x240 picture  │ │
│ │   pixels at 6x4 device pixels    │ │
│ │   = 960 x 960, deck boards,      │ │
│ │   60 px of boards either side    │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│ BASE 19 lb 11 oz · PACK 27 lb 9      │
│ CAN 6.6/9.8 L · 3 DAYS · 40 L        │
│ SHED 22 · G 5 · B 11 · M 3  Robin    │
│ OLYMPIC PENINSULA HIKER              │
│ fernforager.github.io/104-boyz       │
└──────────────────────────────────────┘
```

A 1080 x 1350 PNG; the picture uses the same pixels as the screen.

### 12.9 The slot picker and the canister panel

```
┌──────────────────────────────────────┐
│ ─── Where does the foam pad go? ──── │
│ ( ) Inside     +11 L: the pack would │
│                be Stuffed (57 of 50) │
│ (•) Bottom straps   bulky: -3 on     │
│     footing; may snag; gets wet      │
│ ( ) Top strap       bulky: -3; and   │
│     the canister moves inside        │
│ ( ) Side compression straps: -3,     │
│     catches on brush                 │
│ [ Done ]                             │
└──────────────────────────────────────┘
```

The picker lists only the places this item can legally go on this pack, each with its cost in plain words; places that can't take it (the front mesh for a foam pad, a tool loop for anything but a tool) simply don't appear. In the flat lay, an item riding outside is drawn beside the pack with a small strap mark (6.1).

```
┌──────────────────────────────────────┐
│ ─── The bear canister ────────────── │
│ WIC loaner · 8.6 L usable · 44 oz    │
│ ████████████████████░░░░  7.6 / 8.6 L│
│ Food 7.1 L · smellables 0.5 L        │
│ Days of food: 4.1 (needed: 4)        │
│ Breakfasts 4 · Lunches 4 · Dinners 4 │
│ Repacked: 2 of 5 pouches             │
│ [ Repack all food ]   saves 1.4 L    │
│ Doesn't fit: nothing                 │
│ [ Done ]                             │
└──────────────────────────────────────┘
```

The can-packing minigame opens from this panel when it lands (decision 30).

### 12.10 The trailhead: the tailgate

```
┌──────────────────────────────────────┐
│ Sol Duc TH · Thu 8:25 am · fog       │
│ ┌──────────────────────────────────┐ │
│ │ THE TAILGATE: the hatch up, the  │ │
│ │ same flat lay in the back; the   │ │
│ │ kiosk and register box behind    │ │
│ └──────────────────────────────────┘ │
│ With this pack: a long, lovely       │
│ trip. Sol Duc Park about 2 pm.       │
│ Leave anything in the car?           │
│ [ ] Camp chair 18oz [ ] Book 8oz     │
│ [ ] Camera 8oz    [ ] Puffy 11oz     │
│ Pack 27 lb 9 oz -> 25 lb 12 oz       │
│ Trip plan left with: a friend        │
│ [ Start walking  >                 ] │
└──────────────────────────────────────┘
```

The last look is the flat lay's second backdrop: the open tailgate (6.1), on Appendix B's trip. The outlook line is the Trip Outlook's third reading (3.3). The *Leave anything in the car?* list never shows beer or the pre-roll, and the tailgate's flat lay draws the bear can with its lid on: they come out of the pack only in the flat lay at the cabin, so nothing at the car ever shows or mentions them (2.6, T05). (The "Book" here is the paperback you might carry.)

**The trailhead register.** Tapping the kiosk shows the Trail Register's last few lines in pencil, as on a real trailhead register: the 104 Boyz' memorial lines from the start, with their fictional deaths and funny epitaphs (7.11), and later any real memorial line with its epitaph (*"Robin. Sep 25. Glacier Meadows, 1 night. 'It was terribly cold.'"*). This is the register a dead hiker's epitaph is written into (9.5): the one at the trailhead where that trip began, the same register you read at the cabin's post (2.2). *Start walking* signs this trip in, with its permit number, and the clock for its splits starts.

**A day hike's trip plan.** A day hike has no permit, so this screen carries what the permit would have: one more line under the Outlook, *Trip plan left with: [a friend v] · back by 6:30 pm*. The *back by* time is the planned exit the overdue clock reads (3.7). *Start walking* then fixes the trip's score maximum (9.6) and signs it into the register as *day hike*, with no permit number and no turn of the 104 counter (12.6).

### 12.11 The Why sheet (bottom sheet)

```
┌──────────────────────────────────────┐
│ ─── Why these odds ───────────────── │
│ Wade across the Hoh braids           │
│   River at 1:30 pm (flow 1.75) . 64  │
│ + Trekking poles (in pack) ...  +10  │
│ + You scouted upstream .......   +5  │
│ - Heavy pack (r 1.4) .........   -5  │
│ + River skill (level 1) ......   +2  │
│ ? River since last night's           │
│   rain (unknown) ........ -10 to +10 │
│ ──────────────────────────────────   │
│   Clean crossing ..........  66-86   │
│   You make it .............  83-93%  │
│ ███████████████░░░░░▒▒▒              │
│ If it goes badly: a cold swim, wet   │
│ gear, and something may float away.  │
│ [ Close                            ] │
└──────────────────────────────────────┘
```

Every line comes from the shared tables (the 64 is the piecewise ford base at flow 1.75, 7.7), and the card bench regenerates this sheet as a golden test (F.4). Pack items in the list show as small icons that light up, so you *see* the pack working. An unused option at the stop appears as a suggestion (*+ scout upstream: 20 min*).

### 12.12 The Fork card

From Appendix A's trip (Glacier Meadows in one night), at the first real place to stop:

```
┌──────────────────────────────────────┐
│ Score: 9 of 64           ≡  Sound:on │
│ ┌──────────────────────────────────┐ │
│ │ FIVE MILE ISLAND: gravel bars,   │ │
│ │ elk, the sky a flat pewter       │ │
│ └──────────────────────────────────┘ │
│ Day 1 · 12:50 pm · Five Mile Island  │
│ ╔══════════════════════════════════╗ │
│ ║ (DRAFT) Glacier Meadows: twelve  ║ │
│ ║ miles on, four thousand feet up. ║ │
│ ║ At this pace, after midnight.    ║ │
│ ╚══════════════════════════════════╝ │
│ ╔═════════════════════════════╗╔═══╗ │
│ ║ Push on tonight             ║║ i ║ │
│ ║ mostly trouble ▓█ 6.6% fatal║╚═══╝ │
│ ╚═════════════════════════════╝      │
│ ╔═════════════════════════════╗╔═══╗ │
│ ║ Stop at Happy Four          ║║ i ║ │
│ ║ a cold night ▒░█ 0.8% fatal ║╚═══╝ │
│ ╚═════════════════════════════╝      │
│ ╔═════════════════════════════╗      │
│ ║ Turn back to the car   sure ║      │
│ ╚═════════════════════════════╝      │
└──────────────────────────────────────┘
```

A compound choice shows one word and a three-color bar (OK, serious trouble, need help); its (i) opens the look-ahead numbers (8.9). In Old School, when any run reaches a ♦ that can kill, the bar adds a black tip and the fatal share in red: here 6.6%, the honest price of following this plan to the end and toughing out every ♦ after it (A.2, A.6). *Stop at Happy Four* is 0.7 mi on; it isn't on the permit, but Happy Four is not a quota camp, so it's a legal change (3.7). It is not sure, though: with no bag, a cold enough night there still turns its bedtime screen into a ♦, so its bar carries a small black tip too (0.8%, A.2). Only *Turn back to the car* is sure.

**The basin or the crest** (the first playable; Appendix B's trip, B.6). Counterclockwise, one night planned at Heart Lake, staying high; at the rim of the Seven Lakes Basin the fork fires whatever the clock says (7.4):

```
┌──────────────────────────────────────┐
│ Score: 31 of 96          ≡  Sound:on │
│ ┌──────────────────────────────────┐ │
│ │ THE RIM: the basin below, blue   │ │
│ │ lakes in pale rock and heather;  │ │
│ │ the stone staircase; clouds      │ │
│ │ stacking up over Olympus         │ │
│ └──────────────────────────────────┘ │
│ Day 1 · 1:50 pm · the rim · 4,900ft  │
│ SPLIT the rim 5:20 · +0:15 plan      │
│ Water 0.5 L · Lunch Lake 0.9 mi      │
│ ╔══════════════════════════════════╗ │
│ ║ (DRAFT) The basin lies below.    ║ │
│ ║ Clouds stack up over Olympus:    ║ │
│ ║ thunder likely after three.      ║ │
│ ╚══════════════════════════════════╝ │
│ ╔═════════════════════════════╗╔═══╗ │
│ ║ Stay high to Heart Lk  4:30 ║║ i ║ │
│ ║ mostly fine ▒░█ 0.2% fatal  ║╚═══╝ │
│ ╚═════════════════════════════╝      │
│ ╔═════════════════════════════╗╔═══╗ │
│ ║ Through the basin      5:00 ║║ i ║ │
│ ║ mostly fine ▒░█ <0.1% fatal ║╚═══╝ │
│ ╚═════════════════════════════╝      │
│ ╔═════════════════════════════╗      │
│ ║ Lunch Lake tonight   permit ║      │
│ ╚═════════════════════════════╝      │
│ ╔═════════════════════════════╗      │
│ ║ Back to the car        sure ║      │
│ ╚═════════════════════════════╝      │
└──────────────────────────────────────┘
```

Everything the player needs is on the screen or one tap under it, and none of it is hidden. The permit's Heart Lake and the water left are in the strip, not the prose:
- **Stay high to Heart Lk** is the plan: 3.4 mi along the crest past Bogachiel Peak (its spur is offered when you get there), about 2:00 to 4:10 on the open crest, arriving 4:30. Its bar follows *keep pushing* (8.9), which means staying on the crest if the storm comes, so it carries a black tip: about 0.2% fatal (B.6).
- **Through the basin** drops down the stone staircase to Lunch Lake (2:25: water, a privy, and a place to sit out a storm), then climbs the unsigned Mirror Lake way trail, a navigation check that shows 97% now and a range if fog comes, to only 1.3 mi of crest; Heart Lake at 5:00. Under 0.1% fatal.
- **Lunch Lake tonight** isn't on the permit, and Lunch Lake was full when Robin planned, which is why the permit says Heart Lake. So it is an off-permit night with no site of your own: Leave No Trace -10 on the meadow, charged whether or not anyone sees (3.7), and the ranger card only if a ranger comes by (25% on an August Saturday, shown in the Why sheet). It is marked `permit`, a cost, not a %. It can't hurt the hiker.
- **Back to the car** is 6.9 mi and 3,200 ft down the way Robin came, about 3.9 h by the 7.4 formula (its steep-descent term included), out about 5:45: sure, *Sooner Than Planned*.

Going clockwise the same card fires at the Mirror Lake way-trail junction, the first way into the basin from that side, and again at the rim if the player stayed high past it. A plan that already drops in gets the same card with the plan's way on top.

### 12.13 An outcome

```
┌──────────────────────────────────────┐
│ Score: 22 of 131         ≡  Sound:on │
│ ┌──────────────────────────────────┐ │
│ │ Same braids; the hiker on the    │ │
│ │ far bank, wringing a sock        │ │
│ └──────────────────────────────────┘ │
│ Day 1 · 2:05 pm · Hoh braids         │
│ ╔══════════════════════════════════╗ │
│ ║ (DRAFT) The second channel is    ║ │
│ ║ deeper than it looks, as second  ║ │
│ ║ channels are. The _poles_ are    ║ │
│ ║ why it isn't worse.              ║ │
│ ╚══════════════════════════════════╝ │
│ ✎ Socks: wet (1 dry pair left)       │
│ ✎ Time -30m · Feet: ok -> sore       │
│ [ Walk on  >                       ] │
├──────────────────────────────────────┤
│ [Pack]       [Map]        [Log]      │
└──────────────────────────────────────┘
```

State changes go in a **pencil strip** under the box, never in a side column, so the text keeps its full width. The item that mattered is underlined (tap for its card). A small ornament signals severity: a green fern (good), a brown twig (mishap or setback), a red ♦ with a red border (serious or trip-ending), a gold star (the Bonfire Lily). The black register mark (▌) appears only for a trip that ended in GAME OVER, on its GAME OVER card and its Trail Register entry; never on an outcome.

### 12.14 Camp: Make camp, then the evening

```
┌──────────────────────────────────────┐
│ Score: 40 of 131         ≡  Sound:on │
│ ┌──────────────────────────────────┐ │
│ │ LEWIS MEADOW camp: the Hoh       │ │
│ │ (cycling); a Canada jay on a log │ │
│ └──────────────────────────────────┘ │
│ Day 1 · 3:20 pm · Lewis Mdw · 995ft  │
│ SPLIT camp 5:40 · plan 5:10          │
│ ╔══════════════════════════════════╗ │
│ ║ (DRAFT) An arrival line, or none ║ │
│ ╚══════════════════════════════════╝ │
│ [ Make camp: tent, water,      45m ] │
│   dinner, food in the can            │
│ [ Pack the can*  ][ Rain pitch*    ] │
│ [ Wander  30m    ][ Watch sunset   ] │
│ [ Swim (brr)     ][ Side trip  1 h ] │
│ [ My own way...  ][ Go to sleep  > ] │
│ * the minigames, when they apply     │
├──────────────────────────────────────┤
│ [Pack]       [Map]        [Log]      │
└──────────────────────────────────────┘
```

- **Make camp** does the sensible routine in one tap: pitch the tent, get water with your treatment, cook the next planned dinner, put the food in the canister. It sums up all of it at one stop, with a pencil strip for what changed.
- **Two tiles open minigames** when they apply (decision 30): packing the can, and pitching the tent in the rain. Their rules are being written in; until then the tiles do the sensible thing in one tap.
- **My own way...** opens the separate chores for anything different: pitch somewhere else, drink from the creek (with its honest later-days risk), a different dinner, no cooking, food left out.
- **The other tiles are joys and side trips.** *Wander* is half an hour around camp with new things to Look at. A packed joy item adds its own quiet use to the evening (a chapter of the paperback, a photo, the binoculars), for spirits, never for points. Dimmed tiles explain themselves on tap (no warm layer: the sunset lasts 10 minutes). *Swim (brr)* asks how far in, and at a lake like Heart Lake that includes all the way (2.6). A packed can of beer adds *Crack the IPA*, and a packed pre-roll adds *Light it*, each with its costs on the tile, at a camp where the hiker sleeps that night (2.6); *My own way...* holds them on a full grid.
- **The light keeps moving.** Everything costs time, so the sky palette steps Day, Dusk, Blue hour, Night as you go.
- **Go to sleep** first lists any undone essentials (DRAFT: *"Your food is still out. [Store it] [Leave it out]"*). Leaving food out is a real choice, never a missed tile. Then it shows the night's honest outlook before you commit. On a night cold enough to kill (Old School: margin below -25 °F with no shelter), that outlook is a ♦ with its fatal share, and a sure choice beside it (A.3).

### 12.15 The morning

```
┌──────────────────────────────────────┐
│ Score: 61 of 131         ≡  Sound:on │
│ ┌──────────────────────────────────┐ │
│ │ DAWN at Glacier Meadows; mist    │ │
│ │ in the valley; a marmot on a     │ │
│ │ rock, whistling twice            │ │
│ └──────────────────────────────────┘ │
│ Day 3 · 6:10 am · clear · 34°F       │
│ ╔══════════════════════════════════╗ │
│ ║ (DRAFT) The marmot stands up very║ │
│ ║ straight and whistles twice. It  ║ │
│ ║ is not clear at whom.            ║ │
│ ╚══════════════════════════════════╝ │
│ [ Stay: a day at the ice      rest ] │
│ [ Go on to Five Mile Is.    permit ] │
│ [ Head for home               sure ] │
├──────────────────────────────────────┤
│ [Pack]       [Map]        [Log]      │
└──────────────────────────────────────┘
```

On ground already walked, the morning also offers **Walk out** (3.4). Changing the plan from here follows 3.7.

### 12.16 The Bonfire Lily plate

```
┌──────────────────────────────────────┐
│ ┌──────────────────────────────────┐ │
│ │ TALL PLATE 160x320               │ │
│ │ night palette; first stars       │ │
│ │ the ridge in night navy          │ │
│ │                                  │ │
│ │ snowfield gone to slate          │ │
│ │                                  │ │
│ │           ·  ✶  ·                │ │
│ │    (gold rings radiate: the      │ │
│ │     only gold in the picture)    │ │
│ │ tiny hiker kneeling,             │ │
│ │ headlamp OFF                     │ │
│ │ ╔════════════════════════╗       │ │
│ │ ║ (DRAFT) Where the snow ║       │ │
│ │ ║ is bluest, something   ║       │ │
│ │ ║ small is shining. You  ║       │ │
│ │ ║ check the headlamp.    ║       │ │
│ │ ║ It is off.             ║       │ │
│ │ ╚════════════════════════╝       │ │
│ └──────────────────────────────────┘ │
│ [ Sketch it                        ] │
│ [ Pick it to take home             ] │
└──────────────────────────────────────┘
```

The status line and toolbar are **hidden** on full-bleed plates. On the trail, apart from the four screens after an Old School death box (12.17), it's the only time the chrome goes away, which is what makes the moment feel singular. It appears only on the rare evening the lily shows (10.2). On short screens the tall plate is 320x320 pt (11.2), which leaves room for the two choices.

### 12.17 The death sequence: from the death box to GAME OVER

Five screens, in this order, and nothing else (9.5), then the cabin at dusk (12.25). None of them exists in the hidden gentle mode (9.4). From Appendix A's trip, had no tent glowed through the trees at Glacier Meadows (A.3): Robin chose *Curl up, wait for dawn* (♦ 58% · 42% shivering · 6.3% fatal), and the roll landed in the black. The death box keeps the status line, with the score frozen; the four screens after it hide the chrome, like a full-bleed plate. Each screen waits for a tap: nothing in the sequence advances on its own (12.1). Appendix D, screen 17, has the same sequence as text. M1a's review site shows this sequence for a Divide death (Appendix D, 18b).

**1. The death box**

```
┌──────────────────────────────────────┐
│ Score: 25 of 64          ≡  Sound:on │
│ ┌──────────────────────────────────┐ │
│ │ Glacier Meadows at night, in     │ │
│ │ blue-grays; rain; biggest tree   │ │
│ │ ╔════════════════════════╗       │ │
│ │ ║ (DRAFT) THE GLACIER    ║       │ │
│ │ ║ GOES ON BEING VERY OLD ║       │ │
│ │ ║ The rain keeps on, and ║       │ │
│ │ ║ the cold keeps on, and ║       │ │
│ │ ║ the cotton hoodie gives║       │ │
│ │ ║ up first. Before dawn, ║       │ │
│ │ ║ under the biggest tree,║       │ │
│ │ ║ your story stops.      ║       │ │
│ │ ╚════════════════════════╝       │ │
│ └──────────────────────────────────┘ │
│ RANGER'S NOTE                        │
│ Wet cotton keeps almost none of its  │
│ warmth. Even for a day, carry a warm │
│ non-cotton layer, a rain shell and   │
│ an emergency shelter. Shivering and  │
│ stumbling mean stop now: get dry,    │
│ get off the ground, call for help.   │
│ [ Next  >                          ] │
└──────────────────────────────────────┘
```

**The death box** is the Sierra message box over the scene drained to cold blue-grays (every slot sent to ink 0, slate 2, glacier blue 3 or snow 4 by its brightness, one more lookup table in 11.4), with a short low sting (13.2). Its title and line are deadpan and kind, aimed at the weather, the water, the dark or the gear, never at the player and never at the loss. The **Ranger's Note** is real and names what would have prevented this death. There is one button. No Restore, no going back, no Back to Last Camp, no Restart: the save written at the confirming tap already held the outcome, and that same write added the register entry and marked the hiker dead. The sequence only displays it (8.14).

**2. YOU PERISHED**

```
┌──────────────────────────────────────┐
│ (black screen; no status line)       │
│                                      │
│             █ █ █▀█ █ █              │
│             ▀█▀ █ █ █ █              │
│              █  █▄█ █▄█              │
│                                      │
│   █▀█ █▀▀ █▀▄ ▀█▀ █▀▀ █ █ █▀▀ █▀▄    │
│   █▀▀ █▀▀ █▀▄  █  ▀▀█ █▀█ █▀▀ █ █    │
│   █   █▄▄ █ █ ▄█▄ ▄▄█ █ █ █▄▄ █▄▀    │
│                                      │
│       You have died of cotton.       │
│                                      │
│ (the dirge plays once: the opening   │
│  bars of Chopin's funeral march)     │
│                                      │
│ [ Next  >                          ] │
└──────────────────────────────────────┘
```

Snow-white blocky letters on ink, drawn into the picture buffer at double size (11.10), and one line of real text under them in paper cream: the cause line for this death's key (9.5), here `cold` with wet cotton in the trace, which comes ahead of rain and a clear sky in that key's fixed order. The dirge is a public-domain funeral march (13.2). The button appears when the dirge ends, or at once with sound off; a tap anywhere also goes on.

**3. Leave No Trace**

```
┌──────────────────────────────────────┐
│ ┌──────────────────────────────────┐ │
│ │ GLACIER MEADOWS by day, in its   │ │
│ │ own colors: firs, heather, snow  │ │
│ │   ▲      ▲            ▲          │ │
│ │      o─┼─<  ▓▓ ░·:·. ·  .  ~>    │ │
│ │      bones  pack  dust    wind   │ │
│ └──────────────────────────────────┘ │
│ (no chrome, no text yet; tap skips)  │
└──────────────────────────────────────┘
  about seven seconds later:
┌──────────────────────────────────────┐
│ ┌──────────────────────────────────┐ │
│ │ GLACIER MEADOWS by day, exactly  │ │
│ │ as it was before anyone came     │ │
│ │   ▲      ▲            ▲          │ │
│ │                                  │ │
│ │ ╔══════════════════════════════╗ │ │
│ │ ║       Leave No Trace.        ║ │ │
│ │ ╚══════════════════════════════╝ │ │
│ └──────────────────────────────────┘ │
│ [ Next  >                          ] │
└──────────────────────────────────────┘
```

The place where it happened, in its own daylight colors, with the remains sprite (11.6): a small cartoon skeleton beside the pack the hiker carried. After a still moment, the bones and the pack crumble pixel by pixel through the dithers into dust-colored pixels, the dust drifts off downwind and is gone, and the picture is left exactly as it was before the hiker came (11.10 has the renderer). Then the Sierra box draws in with its one line. A tap skips to the end; with iOS Reduce Motion on, it is a one-second cross-fade instead.

**4. The epitaph**

```
┌──────────────────────────────────────┐
│ ┌──────────────────────────────────┐ │
│ │ HOH RIVER TRAILHEAD at evening:  │ │
│ │ the register box on its post,    │ │
│ │ lid open, a pencil on a string   │ │
│ └──────────────────────────────────┘ │
│ ╔══════════════════════════════════╗ │
│ ║ (DRAFT) There are no stones on   ║ │
│ ║ the mountain. But the register   ║ │
│ ║ at the trailhead keeps one line  ║ │
│ ║ for everyone who goes in.        ║ │
│ ╚══════════════════════════════════╝ │
│ ROBIN'S LINE                         │
│ ┌────────────────────────────┐ ┌───┐ │
│ │ It was terribly cold.      │ │ ⚄ │ │
│ └────────────────────────────┘ └───┘ │
│ C. A. Barnes, Press Expedition,      │
│ Jan. 14, 1890             21 of 40   │
│ Type your own, or tap the dice.      │
│ [ Sign the Trail Register  >       ] │
│ [ Leave it blank ]                   │
└──────────────────────────────────────┘
```

**The epitaph screen** has one line to fill and the dice beside it (9.5); the wireframe shows it after one tap of the dice. Tapping the field opens the iOS keyboard on a one-line field with a counter that stops at 40 characters. The dice button (a 44-pt square, like every target) fills the field with the next line from this death's deck, with its credit beneath in small type. Here the deck for `cold` dealt Charles A. Barnes's journal line of January 14, 1890, written while the Press Expedition hauled its boat up the Elwha. Each tap deals the next line, with a small rattle (13.2). Editing a dealt line makes it the player's own and drops the credit. *Leave it blank* is a full answer, and nothing is filled in until the player acts. *Sign the Trail Register* adds the line, and for a dealt line its quote id, to the register entry the death already wrote (8.14), with the pencil's sketch ticks (13.2). The picture is the register box at the trailhead where this trip began, because there is no tombstone in the park: Leave No Trace. Signing it at the cabin's register post instead is your call (2.2). The field and the dice are not choice buttons, so the 22-character label cap doesn't apply; the lint checks every dealt line at 40 characters as printed (F.3).

**5. GAME OVER**

```
┌──────────────────────────────────────┐
│ ▌THE LONG NIGHT AT GLACIER MEADOWS   │
│ ┌──────────────────────────────────┐ │
│ │ The same register box, its lid   │ │
│ │ closed, the pencil hanging still │ │
│ │ in the last light                │ │
│ └──────────────────────────────────┘ │
│            G A M E   O V E R         │
│ ╔══════════════════════════════════╗ │
│ ║ (DRAFT) Here ends the trail of   ║ │
│ ║ Robin, who went to see the Blue  ║ │
│ ║ Glacier in one long day.         ║ │
│ ║ Sep 25-26, 2027 · Glacier Mdws   ║ │
│ ║ Score 25 of 64 · 17.4 mi         ║ │
│ ║ You have died of cotton.         ║ │
│ ║ "It was terribly cold."          ║ │
│ ║    C. A. Barnes, 1890            ║ │
│ ╚══════════════════════════════════╝ │
│ What would have kept Robin alive:    │
│ a sleeping bag, a pad, a rain shell; │
│ turning back at Lewis Meadow; or,    │
│ that night, waiting for help.        │
│ [ Back to the cabin  >             ] │
│ [ Ranger's Note ]  [ Route map ]     │
│ [ Field Notes ]                      │
└──────────────────────────────────────┘
```

**The GAME OVER card** replaces the trip report (9.3). It opens with the trip's title, the black register mark (▌) beside it. The picture is the register box from screen 4, now closed: the same stamp, no new scene (11.7). *Ranger's Note* opens the death box's note in full in a bottom sheet (12.11), *Route map* opens the trip map with the route dotted to where it ended, and *Field Notes* opens the cause trace (8.13). This card is the last look anyone gets at the trip, so everything worth keeping from it is one tap away here. The *what would have kept Robin alive* lines come from the cause trace: the biggest missing items, the last sure turnaround the player passed in daylight (here Lewis Meadow), and the last sure choice of all (here the bedtime *Huddle and wait for help*). A slow, single bar of the cabin's theme plays once (13.2).

*Back to the cabin* closes the trip for good, after one confirm, since nothing comes back (DRAFT: *"Close Robin's trail for good?" [Yes] [Not yet]*). Then the cabin at dusk (12.25), where **the wipe happens** (9.8). Closing the app before that reopens this card; the hiker is already dead, so there is nothing else to open.

### 12.18 Settings (the mailbox)

```
┌──────────────────────────────────────┐
│ X   SETTINGS             the mailbox │
│ Every stop saves itself.             │
│ ──────────────────────────────────   │
│ Odds     [Numbers] [Words] [Hidden]  │
│ Text     [Pixel] [Plain] [Large]     │
│ Stops    [Few] [Usual] [Many]        │
│ Sound    [On] [Off]                  │
│ Park     [As researched] [Timeless]  │
│ ──────────────────────────────────   │
│ [Export save]  [Import]  [Credits]   │
│ [Ranger's Bookshelf]   v1.0 · 3f9c   │
└──────────────────────────────────────┘
```

Settings open from the mailbox at the cabin and from ≡ on the trail. That is the whole v1.0 list: Odds, Text, Trail stops, Sound and Park (all labels DRAFT). There is no Read to me (cut; VoiceOver reads the real text, 11.9), no hint character to switch off, and **no mode setting**: Open play is Old School, and the gentle flag is in no menu at all (9.4). Pictures (the draw-in style), Money (the Shoestring wallet), Units, Paper, the Notebook of raw numbers, the Tandy sound mode and badges wait for M6, so the first release reads as a game and not a control panel. The sound settings may change with decision 32 (a separate Music switch is proposed). On short screens the ≡ menu also holds Pack, Map and Log.

*Credits* and *Ranger's Bookshelf* open the credits screens (12.20). The small **version stamp** in the corner (`v1.0 · 3f9c`, the build hash) hides the debug menu: five taps on it open the menu with **Copy bug report** (E.11). Nothing marks it, and nothing in it can change a trip. When an update arrives, the mailbox flag goes up at the cabin (E.7).

### 12.19 The tide booklet (M4)

```
┌──────────────────────────────────────┐
│ TIDE TABLE · La Push · July 2027     │
│ Day     Low       High      Low      │
│ Fri 16  2:31a -.4  8:44a 5.9  2:52p  │
│⌈Sat 17  3:20a -.7  9:30a 6.0  3:41p  │
│|Sun 18  4:05a -.9 10:15a 5.9  4:31p  │
│⌊Mon 19  4:49a -.9 11:00a 5.8  5:20p  │
│ Tue 20  5:33a -.7 11:44a 5.7  6:08p  │
│ (two weeks to a page; the afternoon  │
│  low heights are on the next column) │
│ Gates on your route: Taylor Point    │
│ cove below 4.5 ft; Strawberry Point  │
│ below 4.0 ft                         │
│ [ Close ]                            │
└──────────────────────────────────────┘
```

A two-week page, like the paper booklet it is. The trip days carry the player's pencil bracket, and **nothing marks today**, exactly as on paper; reading the wrong row is the player's own mistake (Appendix C). At `coast` skill 2 a small pencil arrow marks today, and the HUD computes the windows (7.10). Opening the booklet costs no game time. The heights shown here are illustrative until the real NOAA tables ship.

### 12.20 Credits and the Ranger's Bookshelf

**Credits** are one scrolling screen of plain credits, opened from the mailbox (12.18). With the Ranger's Bookshelf below, it is the only place the game names its sources. Every line is a DRAFT for you:
- **Art style:** the credit line for *The Golden Glow* (10.3).
- **History:** *"The history in this game draws on the work of Robert L. Wood (1925-2003), historian of the exploration of the Olympic Mountains. No text from his books appears in this game; facts are retold in our own words."* Then a line for the quotations: *"Quoted lines are from public-domain accounts of the Press Expedition of 1889-90 (the Seattle Press, July 16, 1890, as reprinted in 1890 newspapers and The Mountaineer, 1907) and Lt. Joseph P. O'Neil's 1890 expedition (Senate Doc. 59, 1896), with a few from other accounts published before 1931, such as The Mountaineer of 1907 and 1920."* The full source list, with page and URL for every quoted line, is generated from `lore/quotes_public_domain.json` (E.5).
- **People:** *"Every person in this game is fictional, except the 104 Boyz, who play themselves, by first name or nickname; Ranger Jon is one of them. {BOYZ_CONSENT} Their deaths in the Trail Register are fiction. Real park rangers don't guide climbs; Jon does it only here."* `{BOYZ_CONSENT}` becomes, for example, *"With their blessing."* only once each Boy has seen his entry and agreed; until then it is a placeholder, and a release build refuses to ship it (7.11, F.3).
- **The stores:** *"The stores in Port Angeles are fictional, inspired by the town's own."* No real store is named unless it gives permission (5.2).
- **The park:** *"Park conditions as researched on 2026-10-07"* (4.7); *"Lake Morgenroth is drawn from the trips of someone who camped there once and keeps going back"* (4.3); and the credit for the weather, *"Forecasts from the National Weather Service"*, with no edited NWS text presented as theirs. Then the font and sound credits (11.9, 13).

**The Ranger's Bookshelf** lists Wood's books, so the credit points somewhere a reader can go. It is a real shelf of his books inside the cabin door: a shelf of real books is a place, not a frame. It opens from the mailbox, from Credits, and from a Look at the shelf (a hotspot inside the screen door, +1 the first time like any Look). Its picture is the shelf stamp: no new scene.

```
┌──────────────────────────────────────┐
│ < Back    THE RANGER'S BOOKSHELF     │
│ ┌──────────────────────────────────┐ │
│ │ Inside the cabin door: a shelf   │ │
│ │ of six worn books, a coffee mug  │ │
│ └──────────────────────────────────┘ │
│ The history in this game stands on   │
│ the books of Robert L. Wood          │
│ (1925-2003). Read them.              │
│ · Across the Olympic Mountains:      │
│   The Press Expedition, 1889-90      │
│   (1967)                             │
│ · Trail Country: Olympic National    │
│   Park (1968)                        │
│ · Wilderness Trails of Olympic       │
│   National Park (1970)               │
│ · Men, Mules, and Mountains (1976)   │
│ · Olympic Mountains Trail Guide      │
│   (1984; 4th edition 2020)           │
│ · The Land That Slept Late (1995)    │
│ None of his sentences appear here.   │
│ The facts are retold in our words.   │
└──────────────────────────────────────┘
```

The titles, years and editions come from `lore/wood_bibliography.json`, which also records where each book can be borrowed. The screen sells nothing and links nowhere; it is a list, the way a ranger would write one on the back of a map.

### 12.21 A Larry moment: the censor bar

From Appendix B's trip (B.6): Heart Lake after dinner, a skinny dip (2.6), a Boy right on cue. This is the stop after *Walk out with dignity* (the stop before it is Appendix D, screen 25):

```
┌──────────────────────────────────────┐
│ Score: 50 of 96          ≡  Sound:on │
│ ┌──────────────────────────────────┐ │
│ │ HEART LAKE at golden hour; the   │ │
│ │ outlet falls; hikers above,      │ │
│ │ all admiring the view, hard;     │ │
│ │ and on the shore, much too big:  │ │
│ │       ███ CENSORED ███           │ │
│ └──────────────────────────────────┘ │
│ Day 1 · 7:30 pm · Heart Lake         │
│ ╔══════════════════════════════════╗ │
│ ║ (DRAFT) You walk out of the lake ║ │
│ ║ with as much dignity as the      ║ │
│ ║ moment has in stock. {BOY_1}     ║ │
│ ║ tells the lake it's a lovely     ║ │
│ ║ evening.                         ║ │
│ ╚══════════════════════════════════╝ │
│ ✎ Heart: ♥♥♥♥♥ · Warm: chilly        │
│ ✎ Towel: packed. Dry in a minute.    │
│ [ Walk on  >                       ] │
├──────────────────────────────────────┤
│ [Pack]       [Map]        [Log]      │
└──────────────────────────────────────┘
```

The censor bar is a sprite (11.6), slammed on with a low blip (13.2) the moment the hiker would be in view, and it stays until the hiker is dressed. It never covers anything but the hiker, and the words never describe what it covers. The pencil strip carries the stakes as usual: spirits at the top, warmth down, and the towel line, which is the difference between a story and the start of a cold evening (2.6). Without a towel, the strip would read (DRAFT) *✎ Towel: in the shed. The breeze has noticed.*, and an hour later, as the sun went, a hiker still out and wet would meet the Cold chain's first warning, with *Dress, into the bag* beside it, sure.

### 12.22 Finish, at the car

```
┌──────────────────────────────────────┐
│ 150/170 · Sol Duc TH · 1:30 pm       │
│ ┌──────────────────────────────────┐ │
│ │ THE CAR at the trailhead: boots  │ │
│ │ on the dashboard, the permit in  │ │
│ │ the visor, showers clearing      │ │
│ └──────────────────────────────────┘ │
│ ▓▓ FINISHED ▓▓   (DRAFT label)       │
│ Moving 14:35 · out 3 d 5 h           │
│ Last split: Deer Lk to TH 2:10       │
│ 13.5 trail hours: a big one          │
│ [ Drive home (about 2 h 10)  >     ] │
│ [ Pie on the way: 45 min ]           │
└──────────────────────────────────────┘
```

The ending's stamp (9.3), on Appendix B's trip. The trail hours decide the tub (2.2): B.2's trip walked 22.3 miles and climbed 5,480 ft, side trip included, so 22.3 / 2.4 + 5,480 / 1,300 = 13.5 trail hours. No drink or joint ever appears here (T05).

### 12.23 The trip report and its share card

```
┌──────────────────────────────────────┐
│ < Cabin                  TRIP REPORT │
│ ┌──────────────────────────────────┐ │
│ │ ROUTE MAP: the loop ↻, three     │ │
│ │ tents, split ticks, the rim      │ │
│ └──────────────────────────────────┘ │
│ THUNDER ON THE HIGH DIVIDE           │
│ (pick one of three titles)           │
│ Aug 12-15, 2027 · 104-0037           │
│ FINISHED · 3 nights · ↻ basin        │
│ 22.3 mi · +5,480 ft · 13.5 h         │
│ Moving 14:35 · Base 19 lb 11         │
│ Score 150 of 170 · LNT 100           │
│ SPLITS  Park 5:30 · Lunch 2:55       │
│         Bogachiel 1:05 · TH 5:00     │
│ DAY 1  (DRAFT headline)              │
│ DAY 2  (DRAFT headline)              │
│ ...                                  │
│ GEAR NOTES                           │
│  Every day: rain pants, poles        │
│  Never: the camera                   │
│  Wished for: nothing                 │
│ CONDITIONS                           │
│  Trail: good · Road: open            │
│  Bugs: some · Snow: patches          │
│ [ Share  >                         ] │
│ [ Hike it again                    ] │
│ [ Back to the cabin                ] │
└──────────────────────────────────────┘
```

The report (9.7) replaces the old back cover, and it scrolls. Its share card:

```
┌──────────────────────────────────────┐
│ SHARE CARD · 1080 x 1350 (4:5)       │
│ ┌──────────────────────────────────┐ │
│ │ THE PICTURE: your alpenglow      │ │
│ │ shot, or the route's own scene,  │ │
│ │ 160x168 at 6x4 = 960 x 672       │ │
│ └──────────────────────────────────┘ │
│ ▓ FINISHED ▓   Thunder on the        │
│ High Divide · Aug 12-15, 2027        │
│ 22.3 mi · +5,480 ft · 3 nights       │
│ ▁▃▅█▅▃▁▂▅▇▅▂  (the profile)          │
│ Splits 5:30 · 2:55 · 1:05 · 5:00     │
│ Permit No. 104-0037 · Robin          │
│ OLYMPIC PENINSULA HIKER              │
│ fernforager.github.io/104-boyz       │
└──────────────────────────────────────┘
```

### 12.24 The soak

```
┌──────────────────────────────────────┐
│ ┌──────────────────────────────────┐ │
│ │ THE SOAK, full scene, no chrome: │ │
│ │ night, stars, the real moon;     │ │
│ │ steam rising off the green tub   │ │
│ │ on its little deck; a floating   │ │
│ │ thermometer: 104°F; the hiker    │ │
│ │ leaning back (the crew too,      │ │
│ │ when the crew is around)         │ │
│ └──────────────────────────────────┘ │
│ ╔══════════════════════════════════╗ │
│ ║ (DRAFT) One best moment from     ║ │
│ ║ the trip's log, then the next.   ║ │
│ ╚══════════════════════════════════╝ │
│ The cabin's music plays here.        │
│ [ Next  >                          ] │
│ [ Get out                          ] │
└──────────────────────────────────────┘
```

Shown only after a big hike (2.2). The cabin's music plays (decision 32). When the crew is around, each of them gets one line (`{BOY_n_TUB}`), yours to write. The share card is offered once, at the end.

### 12.25 After a death: the cabin at dusk

```
┌──────────────────────────────────────┐
│ Dusk at the cabin                    │
│ ┌──────────────────────────────────┐ │
│ │ THE CABIN at dusk: the porch     │ │
│ │ light on, one chair empty, the   │ │
│ │ tub covered, the fire bowl cold; │ │
│ │ the trip reports by the bowl go  │ │
│ │ to dust, as the bones did        │ │
│ │ the register post: a new mark    │ │
│ └──────────────────────────────────┘ │
│ ╔══════════════════════════════════╗ │
│ ║ (DRAFT) One quiet line.          ║ │
│ ╚══════════════════════════════════╝ │
│ [ Read the register  >             ] │
│ [ Sign the guest book (new hiker)  ] │
└──────────────────────────────────────┘
```

This follows the GAME OVER card (12.17). The wipe plays in this scene (2.2, 11.10): the trip reports and the route signs crumble to dust, and the shed door swings shut on its starting shelves. With Reduce Motion it is a cross-fade. The game never opens on this scene again: after the guest book, the cabin returns to the real clock.

---

## 13. Audio

*Decisions 32 and 33 reshape this section: no music on the trail, only the place and your own footsteps, as in* Lonely Mountains: Downhill*; music only at the cabin and at a few key moments; every sound public-domain (CC0) or synthesized, each source logged. The full design is in `design/drafts/audio_text.md` until it is written in here. This section has only had its book-era cue names replaced so far.*

### 13.1 The sound engine: PC-speaker charm

The 1984 PC speaker was one square-wave voice, and we imitate it honestly with Web Audio: a square oscillator, an envelope at low gain (about 0.06), and a gentle low-pass filter (about 3.5 kHz) to take the harsh edge off. A tiny sequencer plays `[note, ms]` lists, one voice at a time.

- **Mostly events and jingles,** like AGI games. No continuous music by default.
- **iOS:** the audio context is created on the first tap. Where Safari supports it, `navigator.audioSession.type = "ambient"` makes the game **respect the ring/silent switch** and mix politely with your own music. The game never depends on sound.
- **The status line** toggle `Sound: on / off` works exactly as in KQ.
- **Later options (M6):** a *Tandy* mode with 3 voices plus noise (an easter egg for those who remember the PCjr), and an ambient bed (rain as filtered noise, surf, a creek), off by default.
- **No Read to me.** Spoken narration is cut (your decision, 2026-10-08). Players who want the screen read aloud use VoiceOver, which reads the real HTML text (11.9).

### 13.2 Cue list

| Cue | When | Sound |
|---|---|---|
| Cabin theme, "The Trail Goes Up" (working title) | Home, at the cabin | 8 bars, C major pentatonic, walking pace: a melody that climbs and comes home |
| Walk on / Next | Every *Walk on* and *Next* | Two clicks: 1,200 Hz then 900 Hz, 12 ms each (on the trail, a footstep instead, decision 32) |
| Day start | The first stop of each trail day | G4 C5 E5 G5, then a held C6 (to be revisited: decision 32 keeps the trail free of music) |
| Look box | Picture tap | A5, 30 ms |
| Pack bloop / thunk | Item in / pack full | A rising slide; a low 110 Hz thunk |
| Printer | Permit printed | A short, rattling burst of filtered noise, like an old printer |
| Compass roll | ♦ choices | Ticks that slow, then a landing chord (major, falling or low) |
| Success / mishap / serious | Outcomes | C-E-G up; G-F slightly flat; a slow four-note descent |
| Sketch | Sketching the Bonfire Lily, the game's one sketch (10.2) | Soft 2 kHz ticks, one per line |
| Marmot | Marmot | A high whistle, twice |
| Elk bugle | Sept-Oct | A slide up to 1,800 Hz, then three low grunts |
| Varied thrush | Fog stops | One long vibrato note, then silence |
| Pacific wren | Rain-forest dawn | A trill far too big for its body |
| Jay | A theft | Two quick notes and a flutter |
| Campfire | Where fires are legal | Faint random crackle |
| **The Bonfire Lily motif** | The glow plate, on the rare evening it shows | C5 E5 G5 C6 E6, then C6 held with tremolo. **Played once, nowhere else**, so no other cue hints at it |
| Finish | The stamp at the car (12.22) | The cabin theme's first four bars, slower |
| Death sting | The death box (Old School) | Three low notes falling, then silence: a nod to Sierra's death sting without quoting any real melody |
| **Dirge** | YOU PERISHED (Old School) | The opening bars of Chopin's funeral march (the *Marche funèbre* of his Piano Sonata No. 2, 1839, public domain) in B♭ minor: our own one-voice square-wave arrangement of the melody, slow, about 8 seconds, played once |
| Dust | The Leave No Trace dissolve | A faint low-passed noise hiss that thins to nothing as the dust blows away |
| Dice | Tapping the dice on the epitaph screen | Three quick clicks, falling in pitch, like dice on a wooden counter |
| Pencil | Signing the Trail Register | The sketch ticks, one per word of the epitaph |
| GAME OVER | The GAME OVER card | The cabin theme's first bar, once, slowly, then silence |
| Locals' quiz | First launch: a right answer, a wrong one | C-E-G up; a two-note raspberry, low and a little flat |
| Censor bar | A Larry moment's bar slamming on (2.6) | One low 110 Hz blip, 40 ms |
| The WIC line | The hidden phone call (12.5) | Two short rings, 440 and 480 Hz alternated fast, then a click |
| A can, opened | *Crack the IPA* | A 120 ms burst of filtered noise, falling |

None of the death cues (the sting, the dirge, the dust, the dice, the pencil and GAME OVER) exists in the hidden gentle mode. The quiz, censor-bar and can cues play only in builds with `flags.larry` on (2.6). The dirge is the game's one borrowed melody, and it is borrowed from the score, not from any recording.

---

## 14. Content plan and volume targets

### 14.1 How much content

| Content | M1: the High Divide loop and the Sol Duc side | v1.0: three must-haves | Full park |
|---|---|---|---|
| Regions | 1 (the Sol Duc side) | 3 | 7 (with Hamma Hamma, 4.1) |
| Compiled places (research places plus overlay points, 4.1) | ~55 | ~170 | ~500-600 |
| Directed trail segments | ~110 | ~340 | ~1,000 |
| Trailheads | 1 | 5 | ~45 |
| Trip templates (presets and the ranger's loop fills) | ~16 (the 12 fills, 3.6) | ~40 | ~130-160 |
| Generic archetype cards | 55 | 140 | 220 |
| Place cards and patches | 30 | 80 | 300 |
| Chain, fork, crisis, finale, epilogue cards | 20 | 40 | 80 |
| **Total cards** | **~105** | **~260** | **~600** |
| Larry moments, counted above (2.6) | 7, and the opener | 8 | 12 |
| Choices (about 2.8 per card) | ~295 | ~730 | ~1,700 |
| Text pools / lines | 60 / 450 | 150 / 1,500 | 300 / 4,000 |
| Place text variants | 35 x 3 | 170 x 3 | 600 x 2-4 |
| Biome base pictures | 6 | 12 | 20 |
| Skylines and landmark overlays | 10 | 35 | 110 |
| Stamps and sprites | 25 | 50 | 80 |
| Tall plates | 3 | 6 | 12 |
| Gear / food items in play | 60 / 37 | 100 / 62 | 217 / 88 |
| Simulation assertions | 15 | 60 | 200 |
| Data file size (gzip) | ~150 KB | ~400 KB | ~1 MB |

### 14.2 Coverage rules

- **Every event tag** (about 40) appears as a modifier or condition in at least **3 cards**, every catalog item maps to at least one event tag, and every segment hazard tag appears in at least 1 card. The linter enforces all three.
- **Every item** gets item "notices" (the voice noticing it: has, lacks, wet, lost). To keep this sane with 217 items, notices are written per **tag family** (about 40 families x 3-4 states) with a `{gear:tag}` slot for the item's name, plus hand-written lines for the 40 or so most characterful items (the ukulele, the watermelon, the flower press, the cast-iron skillet).
- **The coverage matrix:** for each region x season (early Jun-Jul, peak Aug-Sep, late Oct) x weather class (fair, wet, cold or snow, fog), at least **32 eligible notable cards** (cards the Director draws, not forced landmarks or chain steps), 24 discovery cards and 6 night cards along the classic routes. Why 32: a 2 to 3 night trip draws about 8 notable cards, and 8 x 8 / 32 = 2 shared on average, before the novelty weight lowers it (8.12). Thin cells become writing assignments.
- **Archetype plus place patch** is preferred over a new card. Generic archetypes fill every cell (fords in every valley, showers wherever it rains); place cards give personality where players will remember it (Heart Lake, the stone staircase into the basin, the basin-or-crest fork from both directions, Lake Morgenroth, the ladder, the High Hoh Bridge, Royal Basin's moraine).

### 14.3 From research to content

| Research field | Becomes |
|---|---|
| `nodes`, `segments` | The compiled park graph (deterministic ingest) |
| `nodes[].description` | Place text in the game's voice (2.3; 3 variants: day, dusk, rain or snow) |
| `nodes[].scene_art_notes` | Scene recipes; new pictures only for landmarks |
| `nodes[].camp` | Camp tags, quotas, fire, toilets, water |
| `segments[].hazards`, `notes` | Canonical hazard tags; tide gates parsed from notes and confirmed |
| `segments[].snow_free_typical` | Snow windows for the snow model |
| `classic_trips` | The ranger's presets |
| `classic_trips[].what_goes_wrong_for_underprepared_hikers` | **Simulation assertions** (one per line; a line tagged `real_incident` may assert only non-fatal outcomes) |
| `hazards[]` (with `game_event_idea`) | Place-card stubs. A research idea's "Sierra mode" death (the research's name for the retired mode key; the game's is `oldschool`, 1.2) becomes, at most, a candidate ♦ that must pass the fair-death lint; a hazard or line that cites a real death is tagged `real_incident`, and its stub carries no death outcome at all (9.5) |
| `wildlife_and_plants[]` | Look-box text, discovery and wildlife cards (7.11), sprites |
| `permit_and_rules[]`, `conditions_2026[]` | Permit logic and the dated conditions overlay |
| `uncertain_claims[]` | Never stated as fact; flagged on the review site |

### 14.4 The authoring loop (per batch of about 25 cards)

1. **Ingest** the research and read the ingest report.
2. **Scaffold** card stubs from hazards, recipes from art notes, assertions from "what goes wrong".
3. **Write** one family or one place per file, against the Authoring Brief (`content/AUTHORING.md`: schema, six exemplar cards, the deadpan voice rules of 2.3, fairness rules, multiplication rules, originality rules).
4. **Lint** to zero errors.
5. **Bench** each card under six loadouts.
6. **Render** new pictures to PNG and look at them.
7. **Simulate** the region's matrix: targets, coverage, ablations, calibration.
8. **Read** about 20 trip transcripts for voice, pacing and repetition.
9. **Review site:** an HTML page for you (not for players), with each card as the player sees it, odds and fatal shares for four loadouts, every death box with its Ranger's Note, its *YOU PERISHED* line and the first lines its epitaph dice would deal (with their credits), every new 104 Boyz and Ranger Jon line (the Boyz' register entries among them), every Larry moment with its censor bar, odds and costs (2.6), new pictures in every palette, and the facts used with their sources and confidence. (The hidden gentle mode's outcomes go in an appendix of the review site, for the day you might want them.) Every line on it is marked draft or approved, for your approval (decision 21).
10. **Playtest** on the iPhone preview build; notes come back to step 3.

**Fairness rules for every card:** every bad outcome has a mitigation that exists in the catalog or as a choice; every % comes from a check with labeled modifiers; numbers come from research data or shared constants, never invented per card; the gentle mode never kills; Old School kills only at a ♦ that shows its fatal share or at a chain's end after two warnings, and every such moment has a sure way out (9.5); each choice has a *different kind* of consequence (time vs. risk vs. comfort vs. Leave No Trace); at least one delayed consequence or echo per three cards.

**Rough effort:** about 8 to 12 Claude sessions per region after M1 (ingest, place text, place cards, new archetypes, pictures, templates and assertions, a balance pass). Several sessions can author in parallel, one per region or family, because files and ids are namespaced.

---

## 15. Build roadmap

From the vertical slice, the High Divide loop either way round (M1a), to the full park. The order is your call (2026-10-08): the High Divide and Seven Lakes Basin loop first, then the rest of the Sol Duc side, then the Hoh and Olympus, then Royal Basin for v1.0. Each milestone ends with you playing it on your iPhone. A **session** below means one focused Claude Code working session of a few hours. The estimates are rough, and each milestone names what gets cut first if it runs long.

**Where the build stands.** Session 1 shipped the start of M0 and M0.5: the app shell, the build and lint tools, and a title page with the chunky-pixel High Divide cover, at `fernforager.github.io/104-boyz`. Under the new direction (decision 22) its book words are retired: the title page becomes the cabin (2.2), the cover becomes the loading art and the Hike of the Day's picture on loop days (11.7), and its 13 live strings wait for your approval in the text system (decision 21). The Hike of the Day, FKT attempts, the minigames and the new sound join this roadmap as they are written in.

### M0 and M0.5, side by side: foundations and the look

The look-and-feel spike (M0.5) is the biggest risk, and it needs only the picture VM and the trail screen, so it runs first or alongside M0, before content piles up.

**M0: Foundations** (3-5 sessions)
- Repo layout, the Pages workflow (one combined deploy for main and preview, E.9), the PWA shell with the offline stamp, the hidden debug menu with Copy bug report (E.11), and the error sheet.
- Engine core: rng, expressions, templates, content loader and index, effects, phases with stub screens, saves.
- Picture VM with 3 test pictures and headless PNG rendering; linter skeleton; harness skeleton with one bot.
- **Exit:** a two-screen "hello trailhead" trip (the Sol Duc trailhead, naturally), served from `fernforager.github.io/104-boyz`, installs to the Home Screen and works offline; 1,000 trivial simulated trips run.
- **Cut first:** the debug menu's extras (keep Copy bug report: it is how you report bugs without a Mac).

**M0.5: Look-and-feel spike** (2-3 sessions)
- One composed scene and one hand-drawn scene in the custom 16-color palette and shape language (11.1), checked side by side against the option-B mockup; a full trail screen with the Sierra box and the pixel font; one decision with a Why sheet, a ♦ confirm and the compass roll; draw-in and palette cycling; a few beeps (next, Look, the printer). On a real iPhone SE and a Pro Max, including the SE's short-screen layout.
- **Exit:** you confirm the pixels are chunky but crisp, the palette reads well on a phone indoors and out, the text is readable, the Sierra box makes every stop look like a Sierra game, and it feels like a King's Quest scene. Fix fonts, scaling and colors now.
- **Cut first:** the hand-drawn scene (keep the composed one).

### M1a: The High Divide loop, either way round: the vertical slice (14-20 sessions)

- **Scope:** the Sol Duc trailhead and the whole High Divide and Seven Lakes Basin loop (your call, 2026-10-08), clockwise or counterclockwise, as a day hike or one night or more, with layovers, on August and September dates. The ranger's fills stop at three nights; the planner's chips run to 6+, and a longer loop adds layovers or camps by hand. Every permitted camp on or just off the loop, with its real quota and a seeded quota roll (4.3): Sol Duc Falls, Canyon Creek #1-#3, Deer Lake, Potholes, Lunch, Round and Clear lakes, Heart Lake Junction, Heart Lake, Sol Duc Park, Lower Bridge Creek, Sol Duc Crossing, Rocky Creek, Appleton Junction, Sol Duc River #1-#4, and Hoh Lake down its side trail; and the *ask at the desk* request (a seeded roll, about 70% midweek and 40% on weekends, 4.3) for the WIC-only camps on or just off the loop that its trails reach: Bruce's Roost, Cat Basin and Hidden Lake (a lead call). Long Lake and Sol Duc Lake, reached only off trail, and the phone call for Lake Morgenroth wait for M1b.
- **Every choice the player's (4.3):** the map table with the way round, each night's camp, layovers and the basin or the crest (3.1); a first trip's three questions and the twelve fills (3.6, B.1); the basin-or-crest fork card at both ways into the basin, with honest ETAs, weather, Legs, water and permit lines (7.4, 12.12); the side trips (Bogachiel Peak, Hoh Lake and back, the edge of Cat Basin, Round and Clear lakes, Mirror Lake) and the Mirror Lake and Clear Lake way trails; and *Change the plan* on the trail, with off-permit nights, full camps and the overdue clock (3.7).
- **Home and the frame (2.2):** the cabin plate in late summer (August, the loop's month) with all four times of day, rain and fog, on the live clock (until the daily build exists, the weather comes from climatology); the door, shed, car, fire bowl, register post, mailbox, the tub and its soak, the guest book and the lockbox; the next-step button and the rail; the map table and *Print it*; the town run with the WIC, the general store and the gear shop (5.2); the flat lay and its share image (6.1, 6.10); the tailgate; the trail screen with splits against the plan (12.2); the stamp at the car, the drive home and the trip report with its share card (9.7). About 4 to 6 of this milestone's sessions are the frame's (an estimate): mostly the flat lay's stamps and the cabin's overlays.
- Pack presets (the ranger's sensible kit and B.5's skimpy kit, from `rules/kits.json`: what the first trip's chalk outlines show on the deck, 3.6, and what the harness packs, F.2) plus free packing, Fill from the list (and, with `flags.larry`, the beer cooler), a one-screen drive from the cabin, **Old School** (the main game) with fatal shares on the buttons.
- About 50 cards (showers, fog on the crest and on the Mirror Lake way trail, cold nights, the stone staircase, the dry crest, thunder, marmots, jays, a bear in the huckleberries, people, sunsets, the forks), 6 scenes, the endings including the Hard Way and GAME OVER, the trip report and Field Notes, the first 104 Boyz encounter cards (7.11), the Trail Register with the Boyz' placeholder memorial lines and the permit counter, the full wipe at the cabin, and the lockbox and the name-only guest book (12.3, 12.4). Sol Duc Falls gets the stay-on-trail mechanic, since the river above the falls is tagged `real_incident` (9.5, principle 3).
- **The first Larry moments (2.6), your call:** the locals' quiz at first launch, skinny dipping in Heart Lake with the censor bar, the IPA from the general store's cooler, and the permit check, which is where a changed plan comes due. They are built behind `flags.larry`, which is on in every build, main and preview.
- **The whole death sequence (12.17), since this is the first milestone where a hiker can die:** the death box and its Ranger's Note for the Divide's fatal moments (staying on the exposed crest in a thunderstorm, off trail in fog near a cliff, the bagless night and the Cold chain, skinny dipping included); *YOU PERISHED* with the `lightning`, `fog` and `cold` cause lines (and the *...of the dark.* and *...of skinny dipping.* variants), and the dirge; the remains sprite and the Leave No Trace dissolve, with its tap-to-skip and Reduce Motion cross-fade (11.10); the register-box stamp; the epitaph screen with typing, the dice and their first public-domain deck from `lore/quotes_public_domain.json` (9.5); the GAME OVER card with its Ranger's Note and route map; and the cabin at dusk, where the wipe follows it (12.25).
- **Why the loop first:** your calls (*"Gotta be B only because I know that hike"*, then *"every choice needs to be made"*), and it suits a first milestone. You know it on foot, so you'll spot a wrong stop at once. Its trips run from a day to three nights or more; a two-night trip is the 20 to 30 minute trip (1.1). Every finished loop earns the tub (2.2). And it exercises early what the Hoh doesn't: a loop and its direction, a route that forks around a basin, tight quotas, way trails, fog navigation, a dry crest and thunderstorms. What it lacks (big fords, the ladder at dusk, glaciers, Ranger Jon) arrives with the Hoh in M2, over the Hoh Lake trail.
- **Exit:** the first playable's rows in F.1 pass for the loop both ways round, with the basin and with the crest (all twelve of the ranger's fills, in August, with the sensible kit and the skimpy one; Appendix B), for the loop in a day with real gear, and for the first playable's trap, the loop in a day on day gear, with both policies; the fork card fires at the first way into the basin in each direction, and its ETAs match the engine's; every simulated death passes the fairness invariant (F.1); the death lints pass (every `hiker_dies` has a cause line, and every cause key has a full dice deck, F.3); the harness finds no crashes, dead ends or stuck states; **you play the loop on your phone both ways round, drop into the basin once and stay high once, change the plan once on the trail, share one flat lay, soak once, and lose one hiker on purpose, all the way from the death box through the wipe at the cabin to a new name in the guest book.**
- **Cut first:** the Hoh Lake and Cat Basin side trips as day trips (their camps stay: decision 17 promises every permitted camp on or just off the loop), then plans of four nights or more (the chips stop at three until M1b), then the IPA and the permit check, then the trip report's share card (keep the flat lay's), the moon and the winter overlays. Never a direction, the basin or the crest, the fork, or the three-night fills, which B.2 is built on.
- **What M1a shows and hides** (a lead call). Some screens already carry hooks for later milestones; in M1a they behave like this:

| Hook | In M1a |
|---|---|
| The WIC's phone number (the fine print on the itinerary and the permit) and the card on the counter, with their Look hotspot | Hidden until the call exists (M1b): no screen shows the number, and the cabin's wall phone is only a Look |
| Month chips and the calendar | August and September only (June to October from M1b), so the out-of-season *Phone the WIC* card never comes up |
| *Ask at the desk* rows | Bruce's Roost, Cat Basin and Hidden Lake, tappable, and taken to the WIC on the town run; Long Lake and Sol Duc Lake as pencil rows that can't be tapped, until M1b |
| Drive chips: The Huckleberry Skillet, The Steaming Fern Lodge | Hidden until M1b (B.3's pie and B.6's soak are M1b's) |
| Second Growth's door on the town street | Hidden until M1b and its pre-roll; the general store's beer cooler is in |
| The Bonfire Lily | Its weight is 0 everywhere, so no roll, no plate and no rumor until M1b (B.3's roll on Bogachiel Peak is M1b's) |
| Walk out and Walk on, trip codes, the gear-list CSV | M1b |
| The boutique; the cabin's spring, autumn and winter; the real moon; the crew and the easter eggs; the other flat-lay backdrops | M1b |
| The chalkboard (Hike of the Day) and the peak (FKT) | Looks only, until the modes arrive (decisions 23 to 25) |
| Hike it again | Shown; it copies the printed permit (9.7) |
| The WIC on the town run | Shown: the briefing, the loaner can and the three desk camps; there is no phone to call yet |
| The gentle mode | No screen at all, but every `hiker_dies` carries its `modes.gentle` override from M1a, and the lint holds it (8.3, F.3) |

### M1b: The whole Sol Duc side, and the call for Lake Morgenroth (8-12 sessions)

- **Scope:** the rest of the Sol Duc file: its out-and-backs (the Deer Lake overnight, the day hike to Sol Duc Falls, Lunch Lake out and back, the river base camp, Hoh Lake from Sol Duc), Mink Lake and the Little Divide, and Appleton Pass, as the data allows, and longer trips that join them to the loop; June to October, with the calendar rule and the shoulder season (snow on the Divide in early July, mosquitoes); quota-heavy permits, with one scripted quota denial (Lunch Lake full on an August Saturday); and the last WIC-only camps, Long Lake and Sol Duc Lake, asked for at the WIC or by phone (the others are desk requests from M1a).
- **Lake Morgenroth, off the menu (4.3):** the hidden phone call to the WIC (12.5), the way trail past Clear and Long lakes, and the hand-drawn signature scene, with the best IPA in the game (2.6). It is built from your GPS track and stories once you send them; until then from the research's straight-line estimates and art notes, with `{MORGENROTH_STORY_n}` placeholders that a release build refuses to ship (F.3).
- **The rest of the loop's Larry moments (2.6):** the bold marmot, the thin tent wall at Lunch Lake, The Steaming Fern Lodge, and Second Growth's pre-roll with its ranger odds and its citation.
- Off-trail navigation (the link down from Clear Lake to Long Lake, and the Morgenroth way trail), more 104 Boyz cards, including the rumor of a lake you have to call for (7.11).
- About 105 cards in total, about 12 scenes and 3 plates; the Bonfire Lily at Bogachiel Peak, the basin and the crest (10.2); the hidden gentle mode run headless in the harness (each death outcome's rescue override, required and linted since M1a, now simulated too, with no UI, 9.4); share codes; Walk out; the nightly calibration job; the audio cues (13.2).
- **Exit:** the Seven Lakes rows in F.1, in season and in the shoulder season, and the loop in a day with real gear (the "ambitious but equipped" row); story uniqueness at least 90% on 2-3 night templates; every coverage cell in the region has at least 32 notable cards; the ablation vector passes for map and compass, water capacity, bug kit, rain pants and the towel; return days average 3 to 6 stops; the device checklist passes; **you find the number, call the WIC, camp at Lake Morgenroth in the game and tell us what we got wrong, and you play three different Sol Duc trips and want a fourth.**
- **Cut first:** Long Lake and Sol Duc Lake as camps (never Morgenroth or the call), then share codes, then Mink Lake and Appleton Pass.

### M2: The Hoh, Glacier Meadows, and Olympus with Ranger Jon or alone (10-15 sessions)

- **Scope:** all 15 Hoh camps, day hikes, 1-5 nights with layovers, June to October; one scripted quota denial (Glacier Meadows full on a July Saturday); the first traverse (the Hoh to Sol Duc via Hoh Lake) with the car's location and the exit menu (3.7), and cross-region routing.
- **Olympus, with Ranger Jon or alone (4.2):** booking Jon at planning, his lines (with `{JON_QUIRK}` until you send it), the glacier kit, glacier school and the `glacier` skill, Snow Dome and the summit; and for soloists the three crossing cards and the solo summit block.
- The Hoh's fatal moments, each with its death box, cause line and dice tags: the ladder (`fall`), the waist-deep ford on the braids (`river`, 8.11) and the crevasse (`crevasse`). The Bonfire Lily at Glacier Meadows, the moraine and Snow Dome.
- About +100 cards (place patches, plus the crossings, Jon and glacier school), +10 scenes and +2 plates.
- **Exit:** the Hoh rows in F.1, including your own example from day one (day gear to Glacier Meadows in one night, both policies, Appendix A), Olympus with Ranger Jon, the equipped solo summit and the literal summit on day gear; Jon's preset passes the validator and summits in 55-75% of equipped simulations; story uniqueness at least 90% on 3-4 night templates; **you play three different Hoh trips, one of them up Olympus, and want a fourth.**
- **Cut first:** the Snow Dome high camp (keep Jon's summit day from Glacier Meadows), then the traverse.

### M3: Royal Basin = v1.0, all three must-haves (8-12 sessions)

- The northeast region: the Upper Dungeness trailhead, Royal Creek, Royal Lake and the upper basin, plus natural neighbors (Marmot Pass, Deer Park, Grand Valley as data allows).
- The rain-shadow weather, different flora, tarns and moraine, the Mount Deception skyline, rodents at Royal Lake, the WIC-arranged upper-basin permit.
- About +60 cards and +8 scenes.
- **v1.0 release:** three must-haves, about 260 cards (730 choices), about 170 places, 5 trailheads, 30 presets, the full lint and simulation gates. **The park map shows the whole park, with every unbuilt region drawn in pencil and unchoosable** (4.1), and the ranger's list holds only playable trips.
- **Cut first:** Marmot Pass and Deer Park.

### M4: The Wilderness Coast (10-14 sessions)

- **New system:** tides (the NOAA table, the tide booklet, the HUD, headland checks, overland rope ladders as alternate segments, river mouths at low tide). Beach camps, raccoons, fog, sneaker waves, the respectful petroglyph and island beats.
- About +80 cards; a new biome set (beach, sea stacks, coast forest); surf cycling.
- **Cut first:** the Shi Shi end of the North Coast.

### M5: The rest of the park (25-40 sessions)

- The Elwha and Hurricane Ridge (including the Madison Falls road walk), Enchanted Valley and the Quinault, the Duckabush and LaCrosse Basin, Staircase (closed through the conditions overlay while that lasts), the Bogachiel and Queets, Grand Valley and the Gray Wolf, the expert routes (Bailey Range, Skyline).
- **The Hamma Hamma, a seventh region** (`hamma_hamma.json`, just researched, 4.1): Lena and Upper Lena lakes, the Putvin Trail to Lake of the Angels and the Valley of Heaven, St. Peter's Gate and the Stone Ponds, and the expert Lena-to-Angels traverse through the Gate, in the national forest and the park, which the park map grows to include. Lake of the Angels and the Stone Ponds aren't bookable online in real life: their permits come from the WIC by phone. In the game they are visible *ask at the desk* rows, like Long Lake, requested at the WIC on the town run (or on the phone line, by a player who has found it), so every player can see the camps exist; neither is a quota camp, so the ranger grants them, with a line about the headwall. Lake Morgenroth stays the only camp in no list (4.3). The region brings the doobie at St. Peter's Gate (2.6, your call): Second Growth's pre-roll, its honest ranger odds on federal land, the citation, the munchies and the slipping clock, offered only to a hiker camped that night at Lake of the Angels or the Stone Ponds. First the region goes through the fact-check and the ingest merge like the other six.
- About +250 cards, mostly place patches; the generic families are stable by now.
- **Exit:** the full-park targets in 14.1 with every region's coverage cells filled, and no pencil regions left on the map.
- **Cut first:** the Bailey Range and Skyline expert routes, then the Hamma Hamma (St. Peter's Gate moves to a later update).

### M6: Polish (6-10 sessions)

- No companions: you hike solo, and the 104 Boyz stay cameos (1.2). The engine keeps its party support, but no milestone promises companions.
- The deferred extras: the Pictures, Money (Shoestring), Units, Paper and Notebook settings; the Tandy sound mode; badges. (The old "trail of the day" is now the Hike of the Day, decision 23, and no longer waits for M6.)
- Accessibility pass, a tone review of every death box, *YOU PERISHED* line and epitaph dice deck written so far (each milestone brings its own: thunderstorms, fog and cold nights in M1, skinny dipping among them, the ladder, the river and the ice in M2, the tide in M4, cliffs in M5), a PG-13 pass over every Larry moment and every Boy's register line (cheeky, never explicit, never mean, never near a car, 2.6, 7.11), and a voice pass reading every line against the voice rules (2.3), with every line approved by you before it ships (decision 21).

**In total:** about 45 to 65 sessions to v1.0 before the modes and minigames are added, and roughly 80 to 120 to the full park.

---

## 16. Risks

| Risk | Mitigation |
|---|---|
| **Writing volume and voice drift.** Hundreds of stops, item notices and Look boxes must keep one quality voice, and every line needs your approval (decision 21). | A strict style guide and Authoring Brief; the shorter recommended voice (2.3), where many stops have no box at all; templates and pools; archetype + place patch; 20 transcripts per batch; the review site; a dedicated writing pass for the 24 signature places |
| **Procedural scenes look samey or muddy** at 160x168, or the custom palette's close tones (snow and paper cream, spruce and ink) blur on a small screen. | The M0.5 look-and-feel spike on real iPhones, indoors and in daylight; the option-B mockup as the reference; contrast figures in 11.9; gold kept for one thing; PNG previews Claude can see; a picture editor for hand-drawn scenes; biome bases reused, only landmarks drawn new |
| **Odds feel unfair** (a 90% that fails; a 74% headland that dunks the pack). | Clear bands and fail tables; kind outcome text; Field Notes showing the causes; calibration gates; bots that only see shown information |
| **Numbers feel like a spreadsheet.** | Odds live in a small pencil tag; the Why sheet is opt-in; Words mode; the compass roll only on ♦ choices; playtest Numbers vs. Words defaults |
| **Too many tuning knobs** (about 60). | One `tuning.json`; the harness built before most content; tune physics against reality first, then event bases |
| **Content is the critical path, not code.** | The coverage matrix assigns writing where players go; parallel authoring by region and family; generic families cover gaps |
| **The expression language grows into a programming language.** | A fixed function whitelist, no loops or assignment or randomness; bigger needs become tested engine features |
| **Research data is inconsistent** (duplicates, one-way segments, null gains, statuses as hazards, conflicting dates). | The ingest step and its report; graph lint rules; overlays; `uncertain_claims` never stated as fact |
| **Real 2026 conditions go stale.** | Overlay entries carry from/until dates and a last-confirmed date, and stale ones are told as "last we heard" (4.7); the overlay is one file to refresh; the Timeless setting |
| **iOS storage eviction** and the Safari/Home Screen split. | Install prompt before the first save; Export/Import codes; `storage.persist()` where available |
| **Pixel-font readability** on small phones. | Device-pixel font sizes (11.9); the Plain font; the short-screen layout; a box budget linted at 375 x 667 (12.1) |
| **Performance and battery** (cycling, draw-in, audio, look-ahead). | 8 fps cycling only when visible; Reduce Motion; one blit per frame; look-ahead in a Web Worker with a 50 ms budget (8.9) |
| **Tone.** Death is now the default, and a deadpan line about drowning or hypothermia can feel flip to people who know real park accidents; rescue must stay gentle without trivializing SAR. | Deadpan and kind: any joke aims at weather, water, dark or gear, never at the player or the loss; never about real incidents, by name or by place: research lines that cite a real death are tagged `real_incident` at ingest, and no card at those sites or built from them can kill (9.5, F.3); no wildlife deaths; a real Ranger's Note on every death box; the *YOU PERISHED* lines and the epitaph dice decks follow the same rules and are linted, and no dealt public-domain line mentions a death, an injury or a named person (F.3); the skeleton is a tidy cartoon that turns to dust, never a wound; your review of each one |
| **Permadeath feels unfair**, or too harsh for some players. | Only two fair paths to death, a fatal share on every deadly button (never hidden, worst case when blurred), a sure way out at every one (linted), sensible plans capped at 0.5% death and checked nightly (F.1), and a Trail Register that remembers every hiker. The full wipe makes a death cost more, so the fairness gates matter more, not less. If it still proves too harsh for someone, the hidden gentle mode is finished and tested, ready to release on your word (9.4). The Hike of the Day never kills a career: its deaths are DNFs on a fresh hiker (decision 25) |
| **Save-scumming** through Export / Import, trip codes, parallel trips or errors (and, if it is ever released, gentle-mode scouting). | No restore anywhere; one living Open hiker per phone with one trip in progress, so there is no parallel trip; rolls keyed to content and mode, so a gentle trip could never preview an Old School trip's dice; a seed already in progress can't be opened twice; a code from a dead trip rolls new weather on your own phone; import refuses any trip save older than the hiker record's mark for that trip, refuses any hiker the register lists as dead, and never removes a Remembered entry; an error reopens the current autosave and never rolls back a choice (8.14, 9.8, E.6, E.11) |
| **The homage drifts too close to *The Golden Glow*,** or creeps back in. | Only three things survive (10.1); all prose original; lint T04; the credit line in Credits (10.3); the art takes the book's shapes and colors as inspiration and never copies, traces or reworks its illustrations (11.1); no field guide, fox, helper animals or talking animals; the lily stays rare and hidden (10.2) |
| **Fictional business names collide with real ones,** or a store inspired by a real one reads as that store. | A deny-list check (lint T03) before shipping, which includes Swain's, Brown's Outdoor and MOSS; the three stores are drawn as types, not as the real storefronts (5.2, 12.7); a real name only with the store's permission |
| **Real history and real people.** Robert L. Wood's books are in copyright; a misquoted 1890 line is a fabrication; Ranger Jon could read as a real park service. | No Wood sentence ships (only facts in our words, credited, 12.20); dice lines only from public-domain texts copied from a page image with its URL, never from the unverified pool (9.5, F.3); Jon is a fictional character with a fictional side job, and Credits say real rangers don't guide climbs; asking The Mountaineers Books for permission is your call |
| **Teaching wrong backcountry facts** (the stylized trail-bug timing; design-only odds). | Label stylized numbers in Ranger's Notes; hard facts come from data through slots, so they change in one place |
| **The repo is public** (decided: Pages deploys from it), so everything committed is visible, including your Lake Morgenroth track and stories when they arrive. The data already cites your Strava activity by link (`strava.com/activities/5761886000`, in `sol_duc_high_divide.json`). | Nothing secret goes in, and the game needs no keys; the GPS track itself is never committed, only a simplified line made from it (see *A quiet, fragile lake made famous* below), and the Strava link stays only if you say so (E.5, E.9, Still to come) |
| **Tone, the PG-13 part** (your call, 2.6). Beer, weed, a skinny dip and innuendo can tip into crude, read as encouraging drinking or illegal use on federal land, or end up next to driving. | Cheek, never explicit: the censor bar does the work (2.6); every consequence is honest and on screen (the ranger odds and the citation, the buzz, the cold water); overnight trips only, at camp, never on a day hike or the walk-out day, and no drink or joint on any drive, trailhead, car, tailgate or ending screen, or anywhere in the cabin scene, where the car is in frame (lint T05); 21+ at both counters; fictional brands (T03); one switch, `flags.larry`, for turning all of it off; your review of each moment on the review site (14.4) |
| **The real WIC number on screen.** A player might call the real desk about a game, and iOS Safari turns phone-shaped text into a tappable Call link by default. | It is the WIC's public line, and the in-game call is only a screen: never a `tel:` link; the app shell carries `<meta name="format-detection" content="telephone=no">`, and the number is drawn only by the phone hotspot, with no callout or text selection, so a tap or long-press never offers Call, Copy or Add to Contacts (E.7). Lint T06 and a device check hold it (F.3, F.5). What a player would ask the real desk for, a WIC-only camp, is a real request it handles every day |
| **Real friends, fictional deaths, in a public repo** (your call, 7.11). | First names or nicknames unless you confirm full names; each Boy sees his line and agrees before it ships, and the `{BOYZ_CONSENT}` line in Credits blocks a release until then (12.20); the lines are good-natured and never about a real person's life, looks or habits (7.11) |
| **A quiet, fragile lake made famous.** Lake Morgenroth is your favorite spot, WIC-only, with meadows the data calls extremely fragile. A game that shows the way in and how to get its permit, from a public repo, could bring it more visits and more trampled meadow than it gets now. | No raw GPX in the repo: your track stays on your machine, and ingest commits only a simplified way-trail line at the map's scale, with its distance, gain and trail class (E.5). The game never shows coordinates, and the permit's printed note says *Stay off the meadow* (12.5). Whether you're comfortable publishing the route at all is your call ([still to come](#still-to-come-from-you)); if not, the way trail stays a generalized line and the scene keeps its secrets |
| **The game leans on the Boyz or on 104,** and strangers feel left out of a private joke (decision 34). | Every egg is a Look or a cosmetic, never a function, and never explained (2.2); a Boy's trail line must work without the joke (7.11); a stranger never meets the word Boyz or an explanation of 104; first launch is tested on someone who has never heard of the Boyz (F.5) |
| **The cabin gives away a private place,** or the reference photos leak into the public repo. | Drawn only from a written description, never from the photos, and no photo is committed (11.11); no sign, address, road name or shoreline; the sun and weather are computed for the lake's center, never a building's position (2.2); Jon by first name only, and nothing about where he lives |
| **The real clock makes the home feel wrong,** such as a dark cabin at lunch for a player in another time zone, or a forecast that fails to arrive. | Pacific time is a feature, said once in a Look; the homecoming shows the trip's own time first (2.2); a stale or missing forecast falls back on climatology (2.2, E.9) |
| **Players misread the %.** | The button shows "made it", ♦ choices add the fail share in red (8.8), each odds form is explained the first time (8.7), and Words use the same number |
| **Scope: M1 holds most of a game.** | M1 split into M1a and M1b, each with a session estimate and a cut list; Olympus, Jon and the glacier wait for M2 (15) |
| **The first playable is a hike you know,** so small errors will jump out (a wrong lake, a way trail drawn where there isn't one). | That is the point of choosing it: your M1a and M1b reviews are the fidelity check, your GPS track replaces the straight-line estimates, and `uncertain_claims` are never stated as fact |
| **The preview channel breaks the stable link or its saves.** | One combined deploy; storage and caches namespaced by channel; a CI test for shared names (E.7, E.9) |

---

## Appendix A: Olympus in one night with day gear

> *"Go for Mount Olympus with day hike gear in one night, might have a problem."* And, on how harsh: *"if you die its game over old school."* This is exactly how the problem happens, why it is honest, and where, in Old School, it can kill: three kinds of ♦ moment on this trip can (the ladder, a bagless night, the ice in A.7), each shows its fatal share before the tap, and each has a sure way out beside it. The kit is the catalog's canonical trap kit (6.8), and the formulas are those of sections 7 to 9. The night figures follow the catalog's item stats (7.9) and were recomputed from them on 2026-10-08: the soaked cotton is now worth almost nothing, so the bagless night is a degree colder than this appendix first said, and its fatal share is 6.3%, not 6.1%. The numbers are illustrative until the M2 engine regenerates this appendix from a seeded run (F.4).

*A later-milestone reference: the Hoh and Olympus arrive in M2 (15). The primary worked example, for the first playable, is [Appendix B](#appendix-b-seven-lakes-and-the-high-divide-planned-well). Everything here already follows your later calls: Ranger Jon is the only guide (A.7), and a death here (12.17) is a full wipe (9.8).*

### A.1 The plan the player made

| Item | Value |
|---|---|
| Itinerary | Hoh trailhead to Glacier Meadows (17.4 mi, +4,292 / -683 ft), 1 night, out the same way. Sat Sep 25 to Sun Sep 26, 2027 |
| The day before | Friday Sep 24 at the WIC: permit, loaner canister, briefing. Shopping and packing that evening |
| Permit | Glacier Meadows (quota area; available in late September) |
| Hiker | Robin, a few trips in (Appendix B's trip among them, 12.3): Regular fitness, 165 lb; footing 1, river 1 and glacier 0, the skills this trip checks (navigation 2 from earlier trips, which nothing here uses) |
| Drive | Left Port Angeles Saturday at 8:15, Hoh trailhead 10:40, walking at 10:45. Legs: Fresh (92) |
| Pack | `olympus_day_gear_one_night_TRAP` in the Ridge Runner Daypack 28. Worn: canvas sneakers, cotton tee, jeans, cotton socks, a cap. Carried: a cotton hoodie, the park brochure map, a phone at 80%, one 1-L bottle, the WIC loaner canister. **10.4 lb: Light** |
| Food | 1,800 kcal in the canister: a sandwich, three bars, trail mix |
| Missing, vs. the ranger's kit for High, September | Rain jacket and pants, a warm non-cotton layer, sleeping bag, pad, shelter, stove, water treatment, headlamp, a real map, first aid, knife, fire starter |

**The warnings the player got, and walked past:**
- **At the map table,** the Trip Outlook, assuming the ranger's kit: *"If you pack well: a very long day. You'd reach Glacier Meadows tired and around dark, and a cold night up there is normal in late September."*
- **At *Pack it*,** the Outlook with this pack: *"With this pack: this trip very likely ends in serious trouble. About one time in four, rangers help you down, and if you keep pushing, about one time in fifteen the hiker dies. Biggest gaps: no sleeping bag, no headlamp, no rain jacket."*
- **At the trailhead:** *"Glacier Meadows about 12:30 am: five and a half hours after dark, by phone light."*
- **The forecast,** from Friday (the planning day): Saturday *Cloudy, showers likely after noon, snow level 6,500 ft* (60%); Sunday *Rain* (80%).
- **Actual weather** (seed 4417): Saturday overcast, showers from 2:30 pm, steady rain after 9 pm. Sunday rain.
- **Daylight, September 25:** sunset 7:08 pm, civil dusk 7:38. Under the Hoh canopy trail-dark would be 7:13; under Saturday's heavy overcast it comes 15 minutes earlier, at **6:58**.

### A.2 Saturday

Today's legs: 1.03 (slightly slow).

| Clock | Where | What happens | Legs · Warm · Wet |
|---|---|---|---|
| 10:45 | Hoh trailhead | Pace: Steady | 92 · 75 · 0 |
| 12:50 | Five Mile Island | Joy: an elk bugles across the gravel bars. Robin taps the picture to look (+1): *"You see a bull elk. He has opinions about September."* Then the **first Fork card** (12.12) | 82 · 75 · 0 |

**The first fork, at Five Mile Island, 12:50 pm** (the first landmark where the ETA lands after dark):

| Choice | ETA | Look-ahead (400 runs) |
|---|---|---|
| Push on to Glacier Meadows | ~12:15 am (11:30-1:00), 5 h after dark | *mostly trouble*: OK 5% · serious trouble 65% · rangers help 25% · **fatal 6.6%** |
| Stop at Happy Four tonight (0.7 mi; not a quota camp) | 1:10 pm | *a cold night*: Trouble 85% · Serious 12% · help 3% · **fatal 0.8%** (about a third of its 15% bad nights fall below -25 °F with no shelter: 15% x 1/3 x 15% = 0.75%) |
| Turn back to the car | 2:55 pm | Sooner Than Planned; sure, never fatal |

(The look-ahead follows the plan and toughs out every ♦ after this one (8.9), so 6.6% is the honest price of sticking to it; A.6 shows where it comes from. Fatal shares are exact expected values, rounded up (8.1, 8.9); the rest round to 5%.)

**The player pushes on.**

| Clock | Where | What happens | Legs · Warm · Wet |
|---|---|---|---|
| 2:20 | Hoh braids | Routine ford: late-season low water (flow 0.8, base 97). Told | 76 · 74 · 0 |
| 3:20 | Olympus Guard Station | Is a ranger in? 30% on a late-September Saturday. No | 72 · 72 · 6 |
| **4:03** | **Lewis Meadow** | **Second Fork card** (still arriving after dark) | 70 · 72 · 9 |

**The second fork, at Lewis Meadow, 4:03 pm:**

> *The light was going pewter. Glacier Meadows was still seven miles and 3,650 feet above, and the daypack held a cotton hoodie, two bars and a bag of trail mix.*

| Choice | ETA | Look-ahead (400 runs) |
|---|---|---|
| Push on to Glacier Meadows | ~12:25 am (11:40-1:10), 5½ h after dark | Serious trouble 65% · rangers help 30% · **fatal 6.6%** |
| Hike to Elk Lake instead (off-permit) | 8:20 pm | Own way out 85% · rangers 10% · **fatal 5.0%** |
| Spend the night here (off-permit) | now | Trouble 85% · Serious 10% · rangers 5% · **fatal 0.7%** |
| Turn back to the car | 10:40 pm by phone light | Sooner Than Planned; sure, no ♦ on the way down |

(ETA for pushing on: 6.31 h of hiking left. 2.92 h fits before trail-dark at 6:58; the other 3.39 h runs at x1.6 by phone light, which is 5.42 h.)

**The player pushes on again.**

| Clock | Where | What happens | Legs · Warm · Wet |
|---|---|---|---|
| 5:30 | High Hoh Bridge | The gorge in amber light. +5 | 60 · 74 · 13 |
| 6:58 | below Martin Creek | Trail-dark (overcast). (DRAFT) *You thumb on the phone's light.* | 43 · 76 · 22 |
| 8:20 | Elk Lake | Legs below 30 after the climb: *Eat extra?* Eats the trail mix | 25 → 47 · 77 · 26 |
| 9:05 | above Elk Lake | Steady rain. The cotton hoodie soaks through. Tired and Wet at once: the ranger-voice nudge, *"It might be time to think about the way home"*, with *Back down to Elk Lake* (**♦ 86%** by phone light: base 95, phone -20, wet rock -5, skill +2 = 72 clean; a sprain in the dark can be Serious, but it can't kill) and *Stop here, wait for help* (sure). Robin goes on | 44 · 77 · 40 |
| 10:40 | avalanche chutes | **Footing** (plain %: the worst case is a mild sprain). Base 90, phone light -20, wet rock -5, tired -10, skill +2 = 57 clean, shown **79%**. Roll 41: clean | 28 · 76 · 60 |
| 12:05 | **the ladder** | **♦ Ladder** (a fall can be Serious, and a bad fall can kill). The same 57 clean: **♦ 79% · 21% fall · 0.3% fatal** (21 x 2% badly hurt x 50% = 0.21%, rounded up), beside *Hunker down here* (sure). A confirming tap (DRAFT: *This could be fatal*), the compass. Roll 68: **Shaky**. (DRAFT) *A foot slips; the rope saves you.* | 21 · 76 · 74 |
| 12:25 am | Glacier Meadows | Arrival, in the dark and the rain. The phone, which was the light, the clock and the map, is at 11% | 18 · 75 · 75 |

Warmth stays fairly high because climbing makes heat. **The danger starts when the walking stops.**

### A.3 The night

The forecast low at Glacier Meadows is 35 °F. With no bag, no pad and a soaked cotton hoodie, Robin is comfortable down to about **75 °F** (65 with no bag, +10 for no pad, and next to nothing for the clothes: soaked, the catalog's cotton keeps 0 to 5% of its warmth, so the hoodie is worth 0.2 °F, 7.9). The margin is about -40 °F with no shelter, past the -25 °F line where a night can kill (9.5), so in Old School this bedtime screen is a ♦. It is where the trip's warnings come due: the Outlook at the map table and at *Pack it*, the trailhead ETA, two Fork cards and the nudge above Elk Lake. Bedtime choices:

| Choice | What it does | Shown to the player |
|---|---|---|
| Curl up, wait for dawn | Margin about -40; tough it out alone, to carry on tomorrow | **♦ 58% · 42% shivering · 6.3% fatal** (the night curve, 7.9: 1.5 x 28 = 42%, x the 15% death roll = 6.3%) |
| Look for other campers' lights | 55% someone is here on a late-September Saturday | Roll 22: **a tent glows blue through the trees.** Then *Ask for help* (70%): roll 35, yes |
| Huddle and wait for help | Give up the trip: out of the wind, off the ground, awake, waiting to be found. Help comes in the morning, and the trip ends *With a Little Help* | **sure**: it costs the trip and the finish bonus, never the hiker |
| Walk laps all night | Warm while legs last; bonk around 2:30 am; the phone dies first. Then the Cold chain (8.10): shivering and stumbling, two warnings that each offer *stop and wait for help* (sure), and its ♦ before dawn, at a margin near -46 once the legs stop making heat (1.5 x 34 = 51% x 15% = 7.65%). About 9 runs in 10 get that far | A compound choice: *mostly worse* ▓█ **6.9% fatal** (0.9 x 7.65%, rounded up) |
| Eat both bars now | +25 legs; food gone | (no roll) |

The sure choice trades the trip for the hiker. The game honors it as sure because that is the lesson: call it early. Had the lights roll missed, the screen would have come back with the ♦, the sure wait and the laps, and a player who keeps pushing would have died about 6 times in 100 (12.17 and Appendix D, screen 17, show that death, from the death box to GAME OVER).

The neighbors lend a spare puffy and a foam sit pad, make room under their tarp, and pour cocoa. Now Robin is comfortable down to about 53 °F (75, minus 12.6 for the puffy worn without a bag, 6 for the sit pad, 2 for the tarp, 1 for the cocoa). The actual low is 34.6 °F: **margin about -19**. Hypothermia roll 10.5% (1.5 x 7, 7.9; *89% you'll be okay*): roll 58, fine. Sleep quality 0.4.

**Dawn:** a calorie deficit of about 2,100 lowers the energy ceiling to 86; a poor night caps the morning at 69. Legs 69, Warm 42 (Cool, barely), Heart 36 (Grumpy).

### A.4 Sunday

Rain all day. Today's legs: 1.05.

| Clock | Where | What happens | Legs · Warm · Wet |
|---|---|---|---|
| 7:30 | Glacier Meadows | The neighbors press oatmeal and jerky on Robin (+500 kcal) | 69 · 42 · 74 |
| 7:40 | | Morning: hike out (ETA 5:20 pm; own way 90%, rangers 10%) or wait for help. Hikes out | 69 · 50 · 74 |
| 8:10 | the ladder, down | Base 90, wet -5, skill +2 = 87 clean: **♦ 94% · 6% fall · <0.1% fatal** (6 x 2% x 50% = 0.06%). Roll 12: clean | 66 · 70 · 76 |
| 1:00 | Lewis Meadow | Told. Eats the gifted food | 45 · 72 · 85 |
| 3:40 | near Five Mile Island | **Crisis: Bonked.** *Robin's legs felt like wet bread.* Ask passing day hikers (someone passes 90% of hours on a Sunday): 70%, roll 51, yes. Two granola bars | 12 → 36 · 66 · 86 |
| 6:05 | Hoh trailhead | Out, about an hour before trail-dark | 14 · 68 · 86 |

### A.5 The ending

Robin reached Serious twice (a bagless cold night; bonked far from the car) but walked out as planned. In Old School that was a survival, not a sure thing: three stops could have killed Robin (the ladder going up, 0.3% on the button; the night, 6.3%, had no tent glowed through the trees; and the ladder coming down, under 0.1%). Ending: **the Hard Way** (9.3), and the trip report is titled (DRAFT) ***A Soggy Story: Made It Back, Barely***. At the car, the stamp (DRAFT: THE HARD WAY) over the car in the rain, Robin asleep in the driver's seat with the heater on. Score: about 30 of 64, with the finish bonus halved. Trail hours: about 17 (34.8 mi / 2.4 + about 3,700 ft / 1,300), a big hike, so the tub is lit at the cabin, the reward for coming home at all (2.2). Leave No Trace: 100 (the food stayed in the canister).

**Field Notes** (open by default after the Hard Way):
> *The night was cold because:* no sleeping bag (a 20 °F bag is worth about 35 °F of comfort), no pad (10 °F colder), a cotton hoodie soaked by the evening rain (wet cotton keeps almost none of its warmth). Kind neighbors (about 22 °F) made the difference.
> *You ran out of legs because:* 1,800 kcal for two days that burned about 7,400.
> *You arrived after midnight because:* a 10:45 start for 17.4 miles in late September, when the Hoh goes dark before 7 under cloud.
> *The phone was your light, your clock and your map,* and it was at 11% by midnight.
> *What kept this hiker alive:* a tent glowing through the trees at Glacier Meadows. Without it, the night was a ♦ with a 6.3% fatal share, and the sure choice was to give up the trip and wait for help.
> *A gentler plan:* the classic 3 to 5 nights (Lewis Meadow, Glacier Meadows twice, Five Mile Island), a 20 °F bag, a pad, a tent, rain gear and a headlamp. That plan finishes happily about nine times in ten, even in late September.

### A.6 The same situation, 20,000 times

From `simulation.md` 12.3 (its scratch calculator, day-hike gear, the Lewis Meadow fork), with Old School's death rolls (9.5) and the night curve (7.9) applied under the policy each row names. M2 regenerates this table with the canonical kit, and these are targets until it does (F.4). Each row reads Happy · Trouble · Serious · Rescue · Death, in percent, rounded, so a row may not add to exactly 100; "Serious" here means walked out after reaching Serious (the Hard Way). **"Keeps pushing"** means answering every later ♦ with *go on*, never looking for help, and toughing the night out alone (the Bold bot, F.2; on this trip no ♦ falls below its 50% line, so it is also the Outlook's policy, 8.9).

| Choice at the Lewis Meadow fork | Happy · Trouble · Serious · Rescue · **Death** |
|---|---|
| Push on, and keep pushing | 0 · 0 · 65 · 28 · **6.6** |
| Push on, but look for help at camp first | 0 · 0 · 75 · 21 · **4.1** |
| Push on, and keep pushing (hidden gentle mode) | 0 · 0 · 65 · 35 · 0 |
| Hike to Elk Lake, and keep pushing | 0 · 0 · 85 · 10 · **5.0** |
| Bivouac at Lewis Meadow | 0 · 86 · 9 · 4 · **0.7** |
| Turn back to the car | 100 Sooner Than Planned · **0** |
| *The same push with real overnight gear* | 50 · 39 · 8.8 · 2 · **0.2** |

(The gentle-mode row is for the harness only, since that mode is hidden in v1 (9.4); it turns each would-be death into a rescue. Nearly every card that matters on this night is forced (the forks, the ladder, the bedtime screen), so the gentle mode's softer Director barely changes it here; the harness measures the gentle mode on its own, F.1.)

**Where the deaths come from** (each from a ♦ that showed its share first):
- **The ladder, going up:** 21% fall x 2% badly hurt x a 50% death roll = **0.21%** (the button shows 0.3%, rounded up). Coming down on Sunday: 6% x 2% x 50% = 0.06% (shown `<0.1%`).
- **The bagless night** at Glacier Meadows (margin about -40 °F, no shelter): the night curve (7.9) gives 1.5 x (40 - 12) = 42% dangerous shivering, x a 15% death roll = **6.3%** for a hiker who toughs it out alone.
- **Keeps pushing:** 0.21 + 6.3 + 0.06 ≈ **6.6%, about 1 trip in 15** (counts round toward danger: 1 in 15.2 reads 1 in 15).
- **Looks for help first:** someone is camped there 55% of the time and helps 70% of those, so 61.5% are still alone: 0.615 x 6.3 + 0.21 + 0.06 ≈ **4.1%** (the scratch calculator, on the older night figures, had 4.0%).
- **Elk Lake:** 1,700 ft lower, so about 6 °F warmer (35 + 1.7 x 3.3 ≈ 41 °F) and a margin near -34. The same curve gives 1.5 x 22 = 33%; x 15% ≈ **4.95%** (shown 5.0%), and no ladder.
- **Bivouac at Lewis Meadow:** stopped at 4 pm with daylight to make a shelter, so most nights stay above -25 °F. About a third of its 14% Serious-or-rescue nights fall below the line: 14% x 1/3 x 15% ≈ **0.7%**, and the sure walk out is always offered beside it.
- **Turn back:** no ♦ on the way down (maintained trail, and the braids at flow 0.8 have no "swept" branch), so **0**.
- **With real gear:** the night's margin stays above -25 °F, so only the ladder in the dark counts, by headlamp: 90 - 10 - 5 - 10 + 2 = 67 clean, made it 84%, and 16% x 2% x 50% ≈ **0.2%**. That is "ambitious but equipped", far under its 3% cap (F.1).

**Trouble or worse on every run in the model (the target is at least 80%); about one in four rescued; and for a hiker who keeps pushing, about 1 trip in 15 ends in death on the mountain.** Turn back at either fork and nobody dies. The same night with a bag, pad, tent, rain gear and headlamp becomes a hard but fair push. The gap between those rows is the whole lesson of the game, and it comes entirely from the pack. (Targets, F.1: trouble or worse at least 80%, rescue 15-35%, death 4-10% for a hiker who keeps pushing, at most 0.1% for one who takes the turnaround.)

**How single items change this trip:**
- **Headlamp:** the ladder goes from ♦ 79% to ♦ 84% (headlamp -10 instead of phone -20; its fatal share from 0.3% to 0.2%), the phone keeps its battery for the clock and the map, and *Back down to Elk Lake* at the nudge reads ♦ 91% instead of ♦ 86%.
- **Puffy and warm hat:** the night's fatal share drops from 6.3% to about 3%: the margin climbs to about -26 °F (75 - 12.6 for the puffy - 2.1 for the wool hat ≈ 60 °F comfortable, against a 34.6 °F low), just short of the -25 °F line below which a night can kill (1.5 x 14 = 21%, x 15% = 3.2%). Add the 4-oz emergency bivy (`warmth_bonus_f` 10, and a shelter) and the fatal share falls away: the cold night drops from Serious to Trouble, and spirits recover by morning.
- **Satellite messenger:** a rescue, if needed, is certain and fast, so the sure choice on the bagless night is a short wait instead of a long one.
- **Water filter:** the "drink from the creek" choice disappears into a pencil-strip line.

On the next trip, the WIC ranger, if Robin stops by, says (DRAFT) *"Back again. This time, maybe take four days."* The checklist in the shed has a line about the puffy jacket, too (6.1). Robin lived, so Robin remembers; a new hiker after a death would get neither line (9.8).

### A.7 Literally the summit, day gear, one night

The same kit and dates, but the player taps the summit onto the plan and doesn't book Ranger Jon: Glacier Meadows for the night, then up the Blue Glacier alone, to the top and all the way out on Day 2.

- **At the map table** the planner allows it, and asks (DRAFT) *"Going up with Jon, or on your own?"* Robin goes alone. Outlook (DRAFT): *"If you pack well: three crevasse crossings alone, each a red diamond, and a very long way home. Jon is free that weekend, if you change your mind."*
- **At *Pack it*:** *"With this pack: very likely serious trouble, and if you keep pushing, about one time in twelve the hiker dies. Biggest gaps: no rope team, no sleeping bag, no headlamp."*
- **Day 1** is A.2: two forks, each with its fatal share on the push-on bar, and a player who keeps pushing goes on.
- **Day 2, 9:10 am, the edge of the moraine:** the first crossing, a forced ♦ card (4.2). Late-September ice is bare, so the crevasses show and the odds are a number, not a range. But Robin is in canvas sneakers with no crampons, and tired. Crevasse base 70, no crampons on ice -20, sneakers -10, tired -10 = 30 clean: **♦ 55% · 45% stopped · 0.7% fatal**.

| Alone, day gear | Clean → shown | Fatal share |
|---|---|---|
| 1. Off the moraine (base 70) | 30 → ♦ 55% · 45% stopped | 45% x 5% x 30% = 0.675%, shown 0.7% |
| 2. Below Snow Dome (base 60) | 20 → ♦ 45% · 55% stopped | 55% x 10% x 30% = 1.65%, shown 1.7% |
| 3. Below Crystal Pass (base 55) | 15 → ♦ 40% · 60% stopped | 60% x 10% x 30% = 1.8%, shown 1.8% |
| The summit block (rock) | 45 → ♦ 70% · 30% fall | None: a fall here is a rescue (9.5, principle 3) |

Every card has *Turn back along your own track* beside it, sure. A failed crossing is mostly the crevasses stopping you (70% at the first, 65% at the others), then a slide and a cold wait for a ranger (25%, a rescue), and the worst band is a fall into a crevasse (5% at the first, 10% where the crevasses crowd together), 30% of which are fatal. In the hidden gentle mode those falls are rescues too. Turning back from the moraine itself keeps the glacier view (+5): *Sooner Than Planned*.

**Keeps pushing, in numbers:** about 6.6% end before the ice (A.6) and 28% are rescued in the night or the morning, so about 65% reach the moraine. There, 65% x 0.675% ≈ 0.44% more end on the first crossing, and another 65% x 45% x (25% + 5% x 70%) ≈ 8% are rescued (a slide, or a fall that isn't fatal). The second crossing shows 45%, below the Bold bot's 50% line, so Bold turns back there. **For the Bold bot: Sooner Than Planned about 56%, rescue about 36%, death about 7.0%, 1 trip in 14.**

A Reckless player goes on at every ♦, and so does the Outlook's *keep pushing* policy (8.9). The second crossing adds 36% x 1.65% ≈ 0.6%, and the third 16% x 1.8% ≈ 0.3%. The 6.4% who pass all three meet the block, and about 4.5% of all runs stand on the summit, where a day that was always too long turns into a second night out on the way down. Altogether that is 6.6 + 0.44 + 0.6 + 0.3, **about 7.9%, 1 trip in 12** (1 in 12.7, rounded down toward danger), the figure the Outlook gives at *Pack it*. Taking the turnaround at either fork, or at any crossing, kills no one.

**The assertion** (late season, all plans of this shape):

| Outcome | F.2 bot mix | Keeps pushing (Bold) | Reckless |
|---|---|---|---|
| Summit | ≤ 1% (model: 0) | 0: Bold turns back at the second crossing | ≤ 8% (model: about 4.5%) |
| Sooner Than Planned | ≥ 60% | 50-65% (model: about 56%) | 30-55% (model: about 41%) |
| Rescue | ≤ 35% | 20-40% (model: about 36%) | 25-50% (model: about 47%) |
| Death (Old School) | ≤ 3% (model: about 1%) | 5-12% (model: about 7.0%) | 6-12% (model: about 7.9%) |

---

## Appendix B: Seven Lakes and the High Divide, planned well

**The primary worked example.** This is the first playable (M1, 15), on the hike you know: the High Divide and Seven Lakes Basin loop from the Sol Duc trailhead, either way round, as a day or one to three nights or more, with every choice on it the player's (4.3). B.1 lays the choices out. B.2 to B.5 play one plan well: three nights clockwise, dropping into the basin for a layover at Lunch Lake. B.6 goes the other way round, planned to stay high, and meets the fork at the rim. B.7 is the off-menu call: a night at Lake Morgenroth, which arrives in M1b. Appendices A and C are later-milestone references (the Hoh and Olympus in M2, the coast in M4).

From the research's loop presets (`high_divide_loop_1n_lunch_lake`, `high_divide_loop_1n_heart_lake`, `high_divide_loop_2n_classic`, `high_divide_loop_3n_layover`), the graph's segments in `sol_duc_high_divide.json` and `simulation.md` section 13. August 2027. The numbers are illustrative until regenerated from the engine (F.4).

### B.1 The loop, and every choice on it

**The ranger's twelve fills.** A first trip's three questions (3.6, 12.5) pick one of these. Every night stays a row the player can change, and any later trip can build any other plan on the same trails. A day hike is the loop with no camps: 18.4 mi along the crest, or 18.7 through the basin.

| Nights · up high | ↺ Deer Lake first | ↻ River first | Miles |
|---|---|---|---|
| 1 · the basin | Lunch Lake (7.8 mi, then 10.9) | Lunch Lake (10.9, then 7.8) | 18.7 |
| 1 · the crest | Heart Lake (10.3, then 8.1) | Heart Lake (8.1, then 10.3) | 18.4 |
| 2 · the basin | Lunch Lake, Heart Lake | Sol Duc Park, Lunch Lake | 20.4 ↺ · 18.7 ↻ |
| 2 · the crest | Deer Lake, Heart Lake | Heart Lake, Deer Lake | 18.4 |
| 3 · the basin | Deer Lake, Lunch Lake x2 | Sol Duc Park, Lunch Lake x2 | 18.7 |
| 3 · the crest | Deer Lake, Heart Lake x2 | Heart Lake x2, Deer Lake | 18.4 |

The fills follow the research's presets where one fits (the one-night Lunch Lake and Heart Lake loops, the two-night classic, the three-night layover) and otherwise keep every day under the 9-hour note (4.6), end each day at water where the crest allows, and put the crest in the morning when they can. The ↺ two-night basin fill is the research's classic: Day 2 climbs back out by the staircase and crosses Bogachiel Peak to Heart Lake (4.5 mi). It is stored with `via` pins (the rim, Bogachiel Peak), because the shortest route would climb the Mirror Lake way trail instead (2.8 mi, and 18.7 for the loop). The crest fills camp at Deer Lake, not Potholes: Potholes is a mile higher, but the data marks its ponds' late-summer reliability as unverified, and Deer Lake has sure water and 10 sites. The planner still offers Potholes, with that water line.

**When a fill's camp is full** that night, the ranger moves the night before the permit is written and says why in one line. Lunch Lake, often full, goes to Round Lake, then Clear Lake (one site each, a few minutes away: *"Lunch Lake's full. Round Lake has its one site, and it's quieter."*); if all three are full, she offers the crest fill for the same nights instead. Heart Lake goes to Sol Duc Park, then Heart Lake Junction camp, where she tells you to carry water. Deer Lake goes to Canyon Creek, or to Potholes with its water line.

**Which way round** is the table in 4.3: ↺ climbs steeply on fresh legs and, on a short trip, meets the crest in the afternoon; ↻ climbs gently up the river, meets the crest in the morning from a high camp, and saves the steep way down past Deer Lake for the last day.

**The basin or the crest:**

| Over the top | Miles | What it changes |
|---|---|---|
| The crest all the way | 18.4 | Bogachiel Peak (+0.2) and the Hoh Lake junction on the way; no reliable water between Deer Lake and Heart Lake in late summer |
| Through the basin: the staircase one way, the Mirror Lake way trail the other | 18.7 | Trades 1.7 mi of crest, with Bogachiel Peak and the Hoh Lake junction, for Lunch Lake's water and Mirror Lake; one way-trail navigation check |
| The crest, with Lunch Lake down and back by the staircase | 20.2 | +1.8 mi and about 650 ft of climbing back up |
| The crest, with Lunch Lake down and back by the Mirror Lake way trail | 20.6 | +2.2 mi, about 530 ft back up, and the way-trail check twice |

**Side trips:**

| Side trip | From | There and back | Notes |
|---|---|---|---|
| Bogachiel Peak | Either Bogachiel junction | 0.2 mi, +100 to 150 ft | The east spur is the better path; the west route is ledgy; ☆ |
| Hoh Lake | The High Divide (Hoh Lake) junction | 2.4 mi, 670 ft back up | Its own quota for a night; the trail on to the Hoh opens in M2 |
| The edge of Cat Basin | Heart Lake Junction | 4.0 mi | The primitive trail past Bruce's Roost; the Catwalk beyond is for experts |
| Heart Lake | Heart Lake Junction camp | 0.8 mi, 300 ft back up | Water, a privy and a swim (2.6) |
| Round and Clear lakes | Lunch Lake | 1.2 / 0.6 mi | Clear Lake is 225 ft down a way trail |
| Mirror Lake | The Mirror Lake junction | 1.2 mi, 160 ft back up | A tarn on a rocky shelf above Lunch Lake, down the unsigned way trail; easy to miss in fog |
| Lake Morgenroth, a visit | Lunch Lake | 2.4 mi | Off trail to Long Lake, then the way trail; a night there needs the call (B.7) |

**Changing the plan on the trail** (3.7): the basin-or-crest fork at each way into the basin (12.12), *Change the plan* on any morning screen, off-permit nights, full camps and the overdue clock. B.6 plays a fork and a change that wasn't made.

### B.2 The plan: three nights clockwise, with a layover in the basin

| Item | Value |
|---|---|
| How it was chosen | At the map table: *↻ River first*, three nights, *Drop into the basin*: the ranger's fill for that answer, with Bogachiel Peak pinned as the layover's side trip |
| Itinerary | Night 1 Sol Duc Park (7.1 mi, +2,470). Night 2 Lunch Lake via Heart Lake, the crest and the Mirror Lake way trail (3.8 mi, +1,130 / -870). Night 3 layover at Lunch Lake (evening side trip to Bogachiel Peak, 3.6 mi round trip, about +1,050). Day 4 out by the stone staircase and Deer Lake (7.8 mi, +830 / -3,300). Thu Aug 12 to Sun Aug 15 |
| Permits | Sol Duc Park 1 night (Thursday); Lunch Lake 2 nights (Friday and Saturday in the Seven Lakes quota area: a tight weekend roll that came up yes) |
| Hiker | Robin, on a later trip: Regular fitness, 165 lb, navigation 2 from earlier trips (skills grow while a hiker lives, 9.8). On a first trip navigation is 1, and each navigation check below shows about a point lower |
| Pack | Lake Basin Weekender 50, close to the catalog's `summer_3_nights_seven_lakes` kit: standard canister, 30 °F down bag, trekking-pole tent, inflatable pad, down puffy, rain jacket and pants, dry camp clothes, stove and 110 g fuel, filter, first aid, blister kit, sun and bug kits, map and compass, headlamp, trowel, pack liner, a paperback; plus a camp chair and a small camera |
| Fit | About 40 L inside of 50 (80%, Roomy). The canister holds 3 days of food (6.0 L) plus smellables (0.6 L): 6.6 of 9.8 L usable |
| Weight | About 29 lb on a 32-lb pack rating: pack ratio 0.91, body ratio 0.70, so r = 0.91 (Comfortable). One extra liter for the dry crest on Day 2 |
| Food | 3,000 kcal a day; three different dinners (no food fatigue) |
| Gaps vs. the ranger's kit | None |

**Forecast** on Wednesday, the planning day: Thu morning clouds then sun (10%); Fri sunny, slight chance of afternoon thunderstorms (20%); Sat sunny (5%); Sun increasing clouds, showers possible (40%). **Actual** (seed 77120): Thu fog then partly cloudy; Fri partly cloudy with a thunderstorm 2-3 pm; Sat clear; Sun showers. Sunrise 6:07, sunset 8:34 pm.

### B.3 The trip

| Day, clock | Beat | Roll | Result |
|---|---|---|---|
| D1 8:30 | Departure in fog: wet brush. Rain pants on, because you have them | — | Wet +1 instead of +8 |
| D1 9:00 | Sol Duc Falls, slick rock: routine 97% | 30 | Told; +5 |
| D1 10:15 | A dipper bobbing on a rock. Robin stops to Look: *"You see a dipper. It is doing deep knee bends in a waterfall, for reasons of its own."* | — | +1; spirits up |
| D1 2:00 | Sol Duc Park. Mosquitoes, end of season; bug kit packed | — | Spirits unaffected |
| D1 7:30 | Walk up to Heart Lake for golden hour (1 mi) or rest? Walks | — | Back at 9:00 by headlamp |
| D1 night | 43 °F in the cold-pool basin; comfortable down to about 30 °F (23 with the puffy on): margin +13. Bear visit 10% | 63 | Slept like a marmot |
| D2 8:45 | *"Thunder possible this afternoon. Early start to clear the Divide by noon?"* Early start | — | On the crest 10:10-11:10 |
| D2 10:15 | **Mount Olympus across the Hoh valley** (full-bleed plate) | — | +5, a landmark view |
| D2 11:05 | **The fork at the Mirror Lake way-trail junction** (7.4, 12.12): the plan's way down (Lunch Lake about 11:45), or on along the crest past Bogachiel Peak to the stone staircase (+1.5 mi, Lunch Lake about 1:20, under a 20% chance of afternoon thunder), or the sure way home. Robin keeps the plan | — | Down by 11:10 |
| D2 11:10 | Mirror Lake way trail, navigation: 75 + map and compass 15 + skill 4 = 94 clean, shown **97%** | 77 | Clean |
| D2 11:40 | Scree down to Lunch Lake: 88 + poles 5 + skill 2 = 95 clean: routine | 30 | Told |
| D2 2:10 | **Thunder walks along the Divide.** In camp: wait it out in the tent (the safe choice, no roll) | — | +3 for a wise choice |
| D2 night | A 41 °F night: margin +11. Bear visit roll | 07 | **A visitor.** Big paw prints 30 ft from the closed canister. Nothing lost; a story |
| D3 day | Layover: swim in Lunch Lake (in shorts: the camp is full of neighbors), an afternoon in the camp chair with a paperback (spirits, no points). Then: **Bogachiel Peak for sunset?** | — | Yes, with the puffy and headlamp |
| D3 8:31 pm | **Sunset on Bogachiel Peak.** The north-face snowfield above the basin is still there in mid-August (10.2), so the evening quietly rolls for the Bonfire Lily, which Robin knows nothing about: clear sky 1.0 x (0.05 + 0.03 full sunset + 0.03 headlamp off) = **11%**, with no layover bonus, since it is Robin's first evening on the peak (10.2). The lily arrives in M1b; an M1a build rolls nothing here (15) | 14 | Nothing. A very good sunset, which is not nothing |
| D3 9:10 | Down in the dark: navigation 75 + 15 + 4 - 10 (headlamp) = 84 clean, shown **92%** | 55 | Clean |
| D3 9:30 | Scree in the dark: 88 + 5 + 2 - 10 = 85 clean, shown **93%** | 88 | **Shaky** (85 to 92): *a boot skated and Robin sat down hard.* Heart -4 |
| D4 8:30 | Showers. Rain gear on: protection 0.85 | — | Barely damp |
| D4 9:10 | The stone staircase, climbing out of the basin on wet rock: 88 + 5 + 2 - 5 = 90 clean, shown **95%** | 33 | Clean |
| D4 11:30 | Down past Deer Lake and Canyon Creek, steep, rooty and wet: the knee strain check is skipped (poles) | — | Knees fine |
| D4 1:30 pm | Sol Duc trailhead. Pie at The Huckleberry Skillet | — | +joy |

### B.4 The ending

**Finished.** Trip report title (DRAFT): *Thunder on the High Divide*. Score: about 150 of 170 (illustrative). Leave No Trace 100. The trip report never mentions the Bonfire Lily, and Robin never learns that an 11% evening came up 14: that is what a rare hidden find looks like from the inside (10.2). Field Notes are short (DRAFT): *"You were ready for everything the mountain asked."* The trip report shows 13.5 trail hours, so the tub is lit at home (2.2, 12.22). No stop on this trip could have killed Robin. Its only possible fatal moment, staying on the crest in the thunderstorm (9.5), never came up, because the early start had Robin off the Divide by 11:10; the scree and way trails can only sprain an ankle, so they show plain percentages.

### B.5 The same plan, 20,000 times (random August weather)

| Kit | Happy finish | Finished, but grumpy | Serious · Death |
|---|---|---|---|
| Sensible (as above) | **98.3%** | 1.3% | 0.4% · under 0.05% |
| Skimpy: no poles, rain pants, map or puffy | 91.8% | 7.3% | 0.9% · under 0.1% |

August in the Olympic high country is forgiving, which is right for "as fun and easy as backpacking": the skimpy kit mostly costs **joy**, not safety, and neither kit comes near the 0.5% death cap for sensible plans (F.1). Deaths need a ♦ with a fatal branch, and this plan has almost none: the crest thunderstorm is a choice the forecast warns about, and without a map, fog on the Divide can put an *off trail near a cliff* ♦ on screen, which is where the skimpy kit's tiny share comes from. These two figures are targets to be regenerated with Old School's rolls (F.4). In late September (cold nights, more rain) the gap between the kits should open much wider, and the harness checks that it does.

The other eleven fills run the same way, each against the same sensible-plan row (F.1), and M1a's first runs fill in their model figures for your review. The ones to watch are the one-night plans: ↺ to Heart Lake puts the whole crest in the afternoon (B.6), and ↻ to Lunch Lake asks for 10.9 miles and about 3,600 ft on the first day.

### B.6 The other way round: the fork at the rim

Robin's next trip goes the other way round, planned to stay high, and meets the fork that the clockwise trip met at the Mirror Lake junction, this time at the rim. It shows the fork's honest numbers, a choice against the plan, and a change of plan that the screen talked Robin out of.

| Item | Value |
|---|---|
| How it was chosen | *↺ Deer Lake first*, one night, *Stay high*: the ranger's fill. Lunch Lake was full that Saturday anyway |
| Itinerary | Night 1 Heart Lake by the crest (10.3 mi, +4,150). Day 2 out by the river (8.1 mi). Sat Aug 21 to Sun Aug 22, 2027; planned exit Sunday 1 pm, so the friend holding the trip plan would report Robin overdue at 1 am Monday (3.7) |
| Pack | B.2's kit with food for one night and no camp chair, plus a 2-oz towel |
| Forecast | From Friday: Saturday partly cloudy, **a chance of thunderstorms on the High Divide after 3 pm (30%)**; Sunday fair. The plan's note on the permit (DRAFT): *"Day 1 is on the crest in the afternoon. Thunder likes the Divide then. Start early."* |

| Day, clock | Beat | Roll | Result |
|---|---|---|---|
| D1 7:30 | Sol Duc trailhead. Pace: Steady | — | — |
| D1 10:45 | Deer Lake. Fill to 2 L: the last sure water before the crest, as the briefing said | — | A 20-minute lunch |
| D1 1:50 | **The rim: the basin-or-crest fork** (12.12) | — | Below |

**The fork at the rim, 1:50 pm** (the wireframe in 12.12):

| Choice | ETA | What the screen shows |
|---|---|---|
| Stay high to Heart Lake (the plan) | 4:30 pm; on the open crest about 2:00 to 4:10 | *mostly fine*, with a black tip: **0.2% fatal** |
| Through the basin, out by the Mirror Lake way trail | 5:00 pm; Lunch Lake 2:25; the last 1.3 mi of crest about 4:00 to 4:40 | *mostly fine*, **under 0.1% fatal**; the way-trail check 97% now, a range in fog |
| Lunch Lake tonight | now | `permit`: off-permit, and full, so no site of its own; Leave No Trace -10 on the meadow, always; a ranger card at 25% |
| Back to the car | about 5:45 pm | Sure: *Sooner Than Planned* (6.9 mi, -3,200 ft: 3.9 h by 7.4) |

**Where 0.2% comes from** (illustrative until the engine regenerates it, F.4). The look-ahead follows *keep pushing* (8.9), which stays on the crest if the storm comes. About 24% of its runs put a storm over the crest while Robin is on it (the 30% forecast, over most of the afternoon window). There the crest card's ♦, *Stay for one more look*, shows about 35% goes badly, beside *Off the crest, now* (sure), and the exposed crest's death roll is 2% (9.5): 24% x 35% x 2% ≈ 0.17%, shown rounded up as 0.2%. Through the basin, only 40 late minutes of crest are left: about 0.05%, shown `<0.1%`. Both sit under the sensible-plan cap (F.1), and the screen offers the sure way home beside them.

**Robin drops into the basin**, against the plan.

| Day, clock | Beat | Roll | Result |
|---|---|---|---|
| D1 2:25 | Lunch Lake: water (filter, 2 L) and lunch on a rock. A Canada jay watches the tortilla. Robin holds on to it | — | +1 a Look; water 2.5 L |
| D1 3:05 | **Thunder walks along the Divide**, as forecast. In the basin it is a stop with a sure *wait it out* (45 minutes) and no ♦, because Robin isn't on the crest | — | +3 for a wise choice |
| D1 3:50 | The storm moves east. The Mirror Lake way trail up, wet: navigation 75 + 15 + 4 = 94 clean, shown **97%** | 18 | Clean |
| D1 4:50 | The crest from the Mirror Lake junction to Heart Lake Junction: Olympus clearing across the Hoh, steam coming off the ridges (the full-bleed plate) | — | +5, a landmark view |
| D1 5:50 | Heart Lake. Make camp | — | +10, the planned camp |
| D1 7:25 | **Swim (brr)?** All the way in (2.6; Appendix D, screen 25). The censor bar; `{BOY_1}` and a party on the trail above, on cue; no food in a pocket, so no jay. Then the towel (12.21) | — | Heart ♥♥♥♥♥; Warm chilly, then ok |
| D1 night | Clear, 44 °F: margin +14 | — | Slept like a marmot |
| D2 7:30 | Morning screen. *Change the plan* to stay a second night and see the edge of Cat Basin? The screen shows the price before the tap: Heart Lake has room on Sunday, but the night isn't on the permit (an off-permit night: Leave No Trace -5 whether or not anyone sees, and a 20% chance a ranger comes by on a Sunday, 3.7), and the friend expects Robin out by 1 pm, so a search would start at 1 am Monday, with no signal to say otherwise. Robin keeps the plan and takes Cat Basin as a morning side trip instead | — | — |
| D2 7:45 | The edge of Cat Basin and back with a light pack (4.0 mi): the Bailey Range across the valley, Bruce's Roost on its windy ridge | — | +5, a viewpoint; +2 in Looks |
| D2 10:15 | Out by the river. Feet in the cold pools at Lower Bridge Creek for ten minutes | — | Spirits up |
| D2 2:45 pm | Sol Duc trailhead, less than two hours behind the planned exit and ten hours before anyone would worry. *The Steaming Fern Lodge*: the pools are open, the gift shop's swim trunks are in a size best called optimistic, and the soak takes an hour and a half (2.6) | — | *Smell: improved* |

**The ending.** *Finished.* Trip report title (DRAFT): *Seen at Heart Lake*. Score: about 80 of 96 (illustrative). Leave No Trace 100. Field Notes: *"You left the crest to the storm, and the storm had it to itself."* The trip report's map dots the route through the basin, not along the crest the permit planned, and nobody minds: a day route isn't on a permit, only the nights are.

**Had Robin stayed high,** the storm would have caught Robin past Bogachiel Peak, on the open crest above the Mirror Lake junction, at about 3:05. The crest card would have offered *Off the crest, now* (sure: down the staircase or the Mirror Lake way trail, whichever was nearer) beside *Stay for one more look* (♦ with its fatal share), and its death box would have been Appendix D's screen 18b. That is what the fork's black tip was pricing.

### B.7 Off the menu: a night at Lake Morgenroth

*M1b: Morgenroth comes after the vertical slice (15).* The same trip as B.2, with one change: Saturday night at Lake Morgenroth instead of a second night at Lunch Lake. It shows the loop's one secret, the call, the way trail and the hand-drawn scene (4.3), and the best place in the game for a cold IPA (2.6; your *"Drinking a hazy ipa at morgrnroth"*).

**The call, Wednesday.** Morgenroth isn't in the camp list, in the ranger's fills or in any preset, and on the map it has no camp mark. On an earlier trip a Boy on the crest had said there was a lake past Long Lake that nobody books, and that you have to call for it (7.11). So, at the map table, Robin taps the WIC's number in the small print at the foot of the itinerary, and the cabin's old wall phone rings through (12.5). *Ask about a lake*; Robin taps the small lake east of Long Lake. (DRAFT) *"Morgenroth,"* says the voice on the line. *"Nobody asks for Morgenroth. Which night?"* It's a weekend night, so the request is about 40%, seeded by the trip seed, the date and the camp (4.3), and this one comes up yes. The permit's third night prints as *Lake Morgenroth (by phone)*, with a note (DRAFT): *Way trail. No privy. Stay off the meadow.* A player who never finds the number never sees any of this, and the planner never hints.

**What changes.** Town: one 16-oz can of *Blue Hour Hazy IPA* from the general store's cooler (ID checked, 5.3), 1.1 lb more and about 0.5 L of the canister (6.6 of 9.8 L becomes 7.1). Days 1 and 2 are exactly B.3. Day 3 is no longer a layover but a short move, so there is no Bogachiel sunset, and no quiet roll for the Bonfire Lily: Morgenroth has no snow feature (10.2). The trade is an 11% evening on the peak for a night at your lake, and the planner never says which is better.

| Day, clock | Beat | Roll | Result |
|---|---|---|---|
| D3 9:00 | A swim in Lunch Lake, then pack up | — | Spirits up |
| D3 10:30 | Past Clear Lake and down toward Long Lake, off trail (the data's link, until your track replaces it). Navigation 65 + map and compass 15 + skill 4 = 84 clean, shown **92%** | 41 | Clean |
| D3 11:00 | Steep scree with the full pack, footing: 80 + poles 5 + skill 2 = 87 clean, shown **94%** | 62 | Clean |
| D3 11:20 | From Long Lake, the way trail: primitive but findable, as you said. Navigation 75 + 15 + 4 = 94 clean, shown **97%** | 12 | Clean |
| D3 12:00 | **Lake Morgenroth** (the hand-drawn plate; Appendix D, screen 23) | — | +5 a landmark; +10 the planned camp |
| D3 1:00 | Make camp: the tent on rock, not the meadow; a cathole with the trowel; no fire | — | +2, a Leave No Trace act (9.6) |
| D3 7:15 | **Crack the IPA** (2.6): the can that has ridden in the canister since Thursday, at the best spot in the game on a clear evening. Buzzed until bed (-5 on footing and navigation; nothing tonight asks for either); about 0.3 L of water; the night margin 2 °F worse | — | Heart ♥♥♥♥♥ |
| D3 7:40 | A black bear grazing the far shore. Robin Looks: *"You see a bear across the lake. It is eating the meadow one mouthful at a time and has not looked up."* | — | +1; spirits up |
| D3 8:45 | The empty, crushed, into the canister with the food. It will be packed out | — | +2, a Leave No Trace act |
| D3 night | Clear, 39 °F in the basin's cold pool: margin +7 (+9 without the beer) | — | A quiet night |
| D4 8:00 | Out in showers, back past Long and Clear lakes. The scree with wet rock (-5): 82 clean, shown **91%** | 24 | Clean |
| D4 9:30 | Lunch Lake; then B.3's last day, an hour behind it | — | — |
| D4 2:30 pm | Sol Duc trailhead. Pie at The Huckleberry Skillet | — | +joy |

**Why every check here is a plain %.** The worst a way trail or the scree can do on a clear day is a sprain. Had the forecast said fog for Saturday, the off-trail stretch could have dealt the *off trail in fog near a cliff* ♦, with its fatal share and a sure *wait for it to lift* beside it (9.5). Saturday was clear, and the beer was after the walking, which is where the game puts it.

**The ending.** *Finished.* Trip report title (DRAFT): *The Lake You Have to Call For*. Field Notes, in full: *"You called. Most people don't."* Leave No Trace 100. The harness runs this variant as its own plan, against the same sensible-plan row in F.1.

**What still waits for you.** The way trail's line, distance and gain are straight-line placeholders (0.6 mi and +290 ft from Long Lake), and the link down from Clear Lake is still drawn off-trail. Your GPS track (GPX) replaces them, and it may move this table: if the real way is a way trail end to end, the 92% off-trail check becomes a way-trail one. The plate and screen 23 use the research's art notes until your stories and photos arrive: where the trail is easy to lose, where you camped, what the lake does in the evening. Cards that need one of your stories carry a `{MORGENROTH_STORY_n}` placeholder until then, and a release build won't ship one (F.3).

---

## Appendix C: The coast tide mistake

*A later-milestone reference: the coast and its tides arrive in M4 (15).*

From `simulation.md` section 14, checked against `coast.json`. July 2027. **The tide rows below are illustrative** until the real 2027 NOAA table ships; the method is exact.

### C.1 The plan, and the misread

| Item | Value |
|---|---|
| Itinerary | Third Beach trailhead to Toleak Point (6.4 mi each way), 2 nights with a layover at Toleak. Sat Jul 17 to Mon Jul 19 |
| Tide gates on the way (`coast.json`) | The cove south of Taylor Point: passable below **4.5 ft**. Scott Creek to Strawberry Point: below **4.0 ft**, with no overland trail |
| Overland trails | Taylor Point (1.2 mi, ladders and ropes). Scott's Bluff (a short rope; its ladder washed out in spring 2026) |
| Hiker | Regular; `coast` skill 1 (the HUD shows raw tide heights but doesn't compute windows) |
| Pack | Weekender 50, standard canister (raccoons!), down bag inside **with a pack cover but no liner**, foam pad strapped on the bottom (one bulky outside item), poles, **tide table**, phone |
| WIC | Skipped: own canister, permit printed at home, so no briefing |

**The tide table** (La Push, the player's booklet; illustrative):

| Day | Morning low · high | Afternoon low | Night high |
|---|---|---|---|
| **Sat Jul 17** | 3:20 am -0.7 · 9:30 am 6.0 | **3:41 pm 2.9 ft** | 9:54 pm 8.6 |
| Sun Jul 18 | 4:05 am -0.9 · 10:15 am 5.9 | **4:31 pm 3.0 ft** | 10:40 pm 8.5 |

**The misread:** planning on Saturday, the player read **Sunday's row** and planned to round Strawberry Point "around 5:00 to 5:30, an hour after the 4:31 low." The game did not stop them. **Misreading is a player action, not a die roll.** The Trip Outlook said only *"Tide timing is tight on day 1"*, in words, because a novice doesn't get computed windows.

### C.2 The day

Start 1:30 pm after lunch in Forks. The run-up is +0.5 ft (calm).

| Clock | Where | Tide (with run-up) | What happens |
|---|---|---|---|
| 1:30 | Third Beach trailhead | 3.8 ft, falling | Departure |
| 2:09 | Third Beach | 3.3, falling | Sea stacks in haze |
| 2:30-3:32 | Taylor Point overland | — | Rope ladders: 90, pad outside -3, skill +2 = 89 clean, shown **95%**. Roll 23: clean |
| 3:32 | The cove south of Taylor Point (4.5 ft) | 2.9 (3.4) | Margin +1.1: auto-pass, told |
| 4:29 | Scott Creek | 3.1, rising | Tide pools: *stop for the anemones (25 min)?* The misread makes it feel like there's time. Stops |
| 4:54 | Scott Creek mouth | 3.4 | Creek ford, routine |
| **5:24** | **North end of Strawberry Point (4.0 ft)** | **3.91, rising (4.41)** | **The headland card** |

**The tide at 5:24**, by cosine interpolation between the 3:41 pm low (2.9) and the 9:54 pm high (8.6): 103 of 373 minutes in, so h = 2.9 + 5.7 x (1 - cos(π x 0.276)) / 2 = **3.91 ft**; with run-up, **4.41 ft**. Margin m = 4.0 - 4.41 = **-0.41 ft**, rising.

**The odds:** base = 85 + 55 x (-0.41) = 62.5; rising -10 → 52.5. Then poles +3, foam pad outside -3, coast skill +2, wet rock from spray -5: **49 clean**. Shaky is 25, so the button shows **♦ 74%** with **26% knocked down** in red: about one try in four goes badly.

> *The rocks at the point were wet to the knee between the waves, and each set reached a little further. Tide 3.9 ft + waves 0.5 = 4.4 ft, rising. Passable below 4.0 ft.*

| Choice | Outcome | Cost |
|---|---|---|
| **Go now, between waves ♦ 74% · 26% knocked down** | 49 clean · 25 soaked (pack bottom dunked) · 26 knocked down (then: 55% soaked and pack wet, 25% the foam pad swept away, 15% mild sprain, 5% moderate sprain) | About 1.3% Serious; about 0.4% rescue (Coast Guard). No fatal share: the sea is less than 1 ft over |
| Wait for the sea to fall | 100% safe | Camp at Scott Creek (off-permit, a "tidal delay" the rangers understand; Leave No Trace -2). Lose the Toleak sunset, gain Scott Creek's. Passable again 1:10-7:45 am |
| Go back to Scott Creek and decide there | Same as waiting, plus the walk | — |

**Can this be fatal?** Not at 5:24. The death roll applies only more than 1 ft over the limit (9.5), so the button shows no fatal share at m = -0.41. But the tide keeps rising, and the card is re-dealt each time the player waits a little. At 5:39 the same button reads ♦ 59% (m = -0.70: 85 - 38.3 - 10 - 3 = 34 clean). From about 5:54 pm the sea is more than a foot over (h = 4.5 ft, m < -1), and the button gains a fatal share. At 6:00 pm (h = 4.64, m = -1.14): base 30 + 20 x (-0.14) = 27, rising -10, mods -3 = **14 clean**, made it 39%, and 61% x the 25% death roll = 15.25%, rounded up: **♦ 39% · 61% knocked down · 16% fatal**. *Wait for the sea to fall* stays sure the whole time.

### C.3 What happened

The player chose **Go now**. Roll 63: **Shaky** (49 to 74). (DRAFT) *A wave slaps the rock and climbs your legs to the hip; the bottom of the pack goes under for a heartbeat.*

- Wet 55, feet wet. With no liner, each inside item has a 60% chance of going damp: the sleeping bag rolls 41, **damp**; the camp clothes roll 77, dry.
- **Evening at Toleak (6:35 pm):** dry camp clothes on; body wet resets to 0; the bag stays damp.
- **Night:** a 51 °F coast low. The damp bag keeps 60% of its warmth, so Robin is comfortable down to about 42 °F (a damp 30 °F bag 50, foam pad 0, dry base layers -2, tent -4, hot dinner -2): a margin of **+9 °F**. A clammy but fine night (*the bag smelled of the sea*).
- **Day 2 (layover):** wet boots double foot wear; a hot spot card on the tide-pool walk; taped with the blister kit. The bag hangs in the sun for two hours and dries.

**Field Notes:**
> *You read Sunday's tide row on Saturday. Tides come about 50 minutes later each day: on Saturday the afternoon low was 3:41, not 4:31.* ***If this had been October*** *(a 40 °F night, rain), the damp bag would have made the night margin about -2 °F, a long and shivery night, and the dunk could have been the start of a real problem. A pack liner (0.2 lb) would have kept the bag dry.*

### C.4 The good version, and the no-tide-table version

- **Reading Saturday's row,** the player leaves at 11:45 am and passes Strawberry Point about 3:20 pm on the falling tide (2.92 ft, 3.42 with run-up, m = +0.58). Base 85 + 5.8 + 5 (falling) caps at 95; then +3 -3 +2 -5: 92 clean, shown **96%**. Roll 35, clean. The Toleak sunset; *Tide Reader* badge progress +1.
- **With no tide table at all,** the tide modifier is unknown, and the tag reads **`??`** (the margin could be anywhere from comfortable to badly over). Because the worst end of that range is more than a foot over the limit, the ♦ also shows its worst case for death (8.6): at the clamp floor, 5 clean, made it 30%, and 70% x 25% = 17.5%, rounded up: **up to 18% fatal**. Choosing *Wait and watch the water* for an hour shows whether the sea is rising or falling, and narrows the range, **computed for the moment the card is dealt again, from the tide as it is then**. If the sea is falling, it reads about **80-95%** and the fatal share drops off. If it is rising, the hour usually makes things worse: on this day the card comes back at 6:24 pm, when the tide is 5.19 ft (163 of 373 minutes after the low: 2.9 + 5.7 x (1 - cos(π x 0.437)) / 2), 5.69 with run-up, so m = -1.69. Base 30 + 20 x (-0.69) = 16, rising -10, mods -3, at the clamp: 5 clean, made it 30%, and 70% x 25% = 17.5%. So the button reads about **30-45% · up to 18% fatal**, and the sure way is still beside it: wait for the next low (Strawberry Point has no overland trail; where one exists, its rope ladders are a plain % with no fatal share). Learning by looking is a skill the game rewards, and on a rising tide what it teaches is the real rule: don't round a headland on an incoming tide. (A golden test, F.4: a wait on a rising tide never removes a fatal share while the true m is below -1.)
- **At `coast` skill 2,** the HUD computes it for you: *"You'll reach Strawberry Point about 5:20 pm: 3.9 ft and rising, passable below 4.0."* The WIC briefing flags the same at planning time. Veterans don't get better dice; they get better information.

---

## Appendix D: Sample screens

**Every line here is a DRAFT** (decision 21), written in the recommended voice so you can judge it: second person, present tense, at most two short sentences at a stop, and the hiker's first-person log as the record (2.3). The words are yours to rewrite, and the voice is yours to choose. The epitaph lines the dice deal are the exception: they are verbatim public domain (9.5). The hiker is **Robin**; the live box never uses the name. Picture notes are in brackets; the caption line follows; then the box and its choices. The numbers match the earlier sample numbering, so cross-references still find them.

**1. A Look box (in town, at the general store)**
`[{STORE_GENERAL}: shelves, a rainy window, the shopkeeper; the player has tapped the produce bin, and a small Sierra box pops up over the picture]` · *Town · the general store · Raining*
> **Look:** *You see a whole watermelon. It weighs eight pounds and is mostly water. There is a great deal of water outside, for free.*

`(tap anywhere)`

*(Look boxes speak Sierra's second person in every voice option, 2.3. The first Look at each thing on a trip is +1.)*

**2. The flat lay (the evening before)**
`[the flat lay on the deck boards, seen from above: a small green tent, a down bag, a pot, two pairs of wool socks and one pair of cotton socks, a great deal of cheese around the open bear can]` · *The cabin · Wednesday evening*
> **Look** (on the cotton socks): *You see one pair of cotton socks. They will come up again.*

`[ Pack it ▸ ]`

*(There is no packing prose any more: the flat lay is the picture of the pack (6.1). When the checklist is happy it says nothing, so the joke lives in a Look.)*

**3. Arriving at Glacier Meadows (a composed stop)**
`[subalpine meadow, late snow, firs, the moraine above; dusk remap]` · *Day 2 · 6:40 pm · Glacier Meadows · 4,300 ft*
> The trail steps out of the trees at last: heather, late snow, and air that smells of ice. Your socks are still damp from the Hoh.

*(Three sources: a "long climb" opener, the place's own text and an echo of the earlier ford. The night model's foreshadow goes in the pencil strip, not the box.)*

**4. A lovely moment (Royal Basin)**
`[Royal Lake mid-afternoon; Mount Deception's snowy wall; a marmot on a boulder; lake cycling]` · *Day 1 · 3:30 pm · Royal Lake · 5,100 ft*
> All at once, the lake, holding the whole mountain upside down. A marmot on a warm rock decides you are not an emergency.

`[ Find a campsite ]` `[ Sit for a while ]` `[ Up to the tarns  1 h ]`

**5. First sight of Olympus (full-bleed plate)**
`[tall plate: the Hoh valley in blue haze; Mount Olympus and the Blue Glacier filling the far half; heather; a tiny hiker; chrome hidden]`
> *Across the whole deep valley of the Hoh stands Mount Olympus, wearing its glaciers like an old king's cloak.*

`(tap anywhere)`

*(Or no box at all: the plate and the wind may carry it, 2.3.)*

**6. Wildlife with odds (the High Divide, September)**
`[subalpine slope, huckleberries in rust and moss; a black bear downslope, eating; the trail crossing the slope]` · *Day 2 · 11:00 am · High Divide · 5,200 ft*
> Below the trail, a black bear is eating huckleberries with total concentration. It hasn't noticed you, and the trail goes right past its patch.

`[ Wait for it to wander   ~45 min · sure ]`
`[ Make noise, walk on          95%  (i) ]`

*(The bear is wildlife, not a guide or a monster: a beautiful moment that is also in the way, 7.11. Why: base 80; poles +5 (you look bigger, and they click on rock); the bear is downhill and busy +5 = 90 clean, shown 95%. If it goes badly, the bear stands up to look, you back away slowly, and lose 20 minutes and a heartbeat or two. Never more than that, in any mode, so it is a plain %, not a ♦.)*

**7. A small mishap (Lunch Lake)**
`[Lunch Lake shore; a Canada jay on a fir branch with something round and pale in its beak; the hiker with empty hands]` · *Day 2 · 12:40 pm · Lunch Lake · 4,450 ft*
> You set the tortilla on a rock for one second, one second longer than a Canada jay needs.

`pencil: ✎ Food: -1 lunch (the jay)` · `[ Walk on ▸ ]`

**8. A critical decision (the ladder at dusk, with day gear)**
`[the Glacier Meadows ladder in the washout; dusk remap; the hiker small at the bottom; a daypack, no tent]` · *Day 1 · 7:50 pm · below Glacier Meadows · 4,100 ft*
> A very long day is turning into a very short evening. The ladder climbs the washout, and above it the light goes pink, then not pink.

`[ Climb the ladder        ♦ 72%  (i) ]`
`[           28% fall · 0.3% fatal    ]`
`[ Hunker down here     cold · sure ]`
`[ Walk back to Elk Lake   ♦ 76%  (i) ]`
`[                         24% hurt   ]`

*(Why for the ladder, all from the shared tables: base 90; no light (the phone died at the bridge) -35; tired after 17 miles -10; wet rock -5; poles +5; footing skill (a beginner's level 1) +2 = 47 clean: clean 47 · shaky 25 · fall 28. If it goes badly: a slip on the rungs, a hurt ankle, far from help. Back down to Elk Lake is maintained trail, base 95, with the same -35, -10, -5, +5 and +2: 52 clean, shaky 24, shown 76%, and a sprain in the dark can be Serious, so it is ♦ too, but a sprain can't kill, so it has no fatal share. On the ladder, 2% of falls are the bad kind and half of those are fatal in Old School: 28 x 2% x 50% = 0.28%, shown rounded up as 0.3%. *Hunker down here* is the sure choice.)*

**9. A bad night**
`[night screen, black paper; the hiker under a tree in a crinkly emergency blanket that glints; stars]` · *Night 1 · below Glacier Meadows · 31°F · clear*
> Clear, which is lovely to look at and terrible to sleep in. The blanket crackles every time you breathe.

`pencil: ✎ Warm: cold · ✎ Heart: ♥♥○○○ · ✎ Feet: numb` · `[ Next ▸ ]`

*(This is the night after* Hunker down here*, which was shown as sure, so it can't kill. Its price is the trip: in the morning the only ways on are down, or help. A sure way through a night that could kill always gives up the trip, 9.5.)*

**10. With a little help (a rescue, in any mode)**
`[the Olympus Guard Station porch; a ranger with a thermos; the hiker in a wool blanket; afternoon light]` · *Day 2 · 4:15 pm · Olympus Guard Station · 950 ft*
> The ranger's name is Ines, and she has a thermos. "You're all right," she says, the way people say it when it has just become true.

`[ Next ▸ ]` → the stamp at the car: *With a Little Help* (stamp, DRAFT: WALKED OUT WITH HELP)

**11. Sooner than planned**
`[the trailhead sign in soft rain; the car; the hiker taking off the pack]` · *Day 2 · 2:00 pm · Hoh River Trailhead · rain*
> You meant to sleep beside a glacier, and you'll sleep beside a pizza. The mountain will keep.

`[ Drive home ▸ ]` · stamp (DRAFT): TURNED BACK

**12. A tide decision with no tide table**
`[headland base; a cliff; a round red-and-black marker above a rope ladder; surf cycling at the foot]` · *Day 2 · 1:20 pm · south of Third Beach*
> The beach runs out at a wall of rock, and a rope ladder hangs by a round red-and-black sign. Your tide table is in the shed, at the cabin.

`[ Round the point          ♦ ??  (i) ]`
`[            up to 18% fatal         ]`
`[ Go overland, up ladder  +1 hr · 95% ]`
`[ Watch the sea an hour       ~1 hr ]`
`[ Wait for the next low        sure ]`

*(The worst end of the unknown range is more than a foot over the limit, so in Old School the ♦ shows its worst case for death: 5 clean at the clamp, made it 30%, and 70% x the 25% death roll = 17.5%, rounded up to 18% (C.4). The overland rope ladders are rolled (C.2: 89 clean, shown 95%), but their worst case is a sprain, so they show a plain % and no fatal share; the sure choice is waiting for the next low. Watching the sea for an hour narrows the range: on a falling tide the fatal share drops off; on a rising tide it stays or grows, and the sure way is still the next low.)*

**13. The Bonfire Lily, on the rare evening it shows**
`[upper Royal Basin; a tarn; the moraine; a snowfield; Mount Deception; no flowers anywhere]` · *Day 2 · 4:40 pm · Upper Royal Basin · 5,700 ft*
> No flowers up here. Stone, snow, and a little round tarn the color of a cold eye.

`[blue-hour remap: the snow in glacier blue; the headlamp beam in paper cream]`
> The sun goes down behind the ridge, and the snow turns blue. Your headlamp makes a small, pale room in the dark.

`[ Turn off the headlamp ]` `[ Keep it on ]` `[ Go to bed ]`

*(Every clear evening at a high camp gets a stop like this one. What follows almost never does: with the whole sunset watched and the headlamp off, the quiet roll here is 0.05 + 0.03 + 0.03 = 11% on a clear evening (10.2). This is the evening it came up.)*

`[tall plate in the night palette: the snow gone to slate; one point of gold cycling outward; chrome hidden]`
> *Where the snow is bluest, something small is shining. You check the headlamp. The headlamp is off.*

`[ Sketch it ]` `[ Pick it to take home ]`

**14. Sketch it, and Finished with a gold star**
`[zoom 2x on the glow; gold lines drawing themselves, one by one, on the back of a wilderness permit]`
> You draw it on the back of the permit, twice, to be sure. Then you leave it where it lives.

`pencil: ✎ Log: "Day 2. Upper Royal Basin. Saw something. Left it."` · `[ Next ▸ ]`

`[the car at the trailhead with the stamp (DRAFT: FINISHED) and a small gold ✶ in the corner; the permit on the passenger seat, drawing side up]`

*(No box at the car: the stamp says it. At home, a gold sketch appears in the cabin's arched gable window, and stays for as long as Robin lives, 2.2.)*

**15. A quiet stop (nothing happens, beautifully)**
`[a rain-forest gravel bar at dawn; mist in bands; elk silhouettes across the river; a wren hotspot]` · *Day 3 · 6:20 am · Five Mile Island · 780 ft · fog*

*(No box at all. The river, the elk and a wren singing a song far too big for its size carry it (decision 32). The log gets one line: "Day 3. Five Mile Island. Fog. Elk at breakfast.")*

`[ Walk on ▸ ]`

**16. A night that could kill (Old School)**
`[Glacier Meadows at night; rain in vertical lines; the biggest subalpine fir; the phone's small light; no tents anywhere]` · *Night 1 · 12:40 am · Glacier Meadows · 4,300 ft · rain*
> No tent glows anywhere. The rain has found every thread of the cotton hoodie, and the cold is coming up out of the ground.

`[ Curl up, wait for dawn  ♦ 58%  (i) ]`
`[      42% shivering · 6.3% fatal    ]`
`[ Huddle, wait for help         sure ]`
`[ Walk laps to stay warm        (i) ]`
`[     mostly worse ▓█ 6.9% fatal    ]`

*(Why: a margin of about -40 °F with no shelter is past the -25 °F line, so a failed night can kill. The night curve (7.9) gives 42% dangerous shivering, and 42% x the 15% death roll = 6.3%. Walking laps is a compound choice: it leads into the Cold chain, two warnings and then its own ♦ before dawn, so its bar carries a black tip too (A.3). The sure choice gives up the trip, and help comes in the morning, whatever the hour (9.2). The first time a fatal share appears, the sure choice is outlined and the box points it out in one line, 8.7.)*

**17. The death sequence, complete: the night (Old School)**

*(Screen 16's night, had Robin chosen* Curl up, wait for dawn *and the roll landed in the black. Five screens, in order, from the death box to GAME OVER, then the cabin at dusk. 9.5 has the rules, 12.17 the wireframes, 11.10 the renderer. None of it exists in the hidden gentle mode.)*

**17a. The death box**
`[the same picture drained to cold blue-grays; the Sierra box over it; a short low sting]`
> **The Glacier Goes On Being Very Old**
> *The rain keeps on, and the cold keeps on, and the cotton hoodie, which tried its best, gives up first. Some time before dawn, under the biggest tree, your story stops.*
>
> **Ranger's Note:** Wet cotton keeps almost none of its warmth. Even for a day hike, carry a warm non-cotton layer, a rain shell and an emergency shelter. When shivering turns to stumbling, stop: get out of the wind and off the cold ground, put on everything dry, and call for help. Turning back early is never wrong.

`[ Next ▸ ]` → *YOU PERISHED*

**17b. YOU PERISHED**
`[a black screen, no chrome; YOU PERISHED in big blocky snow-white letters; the dirge, the opening bars of Chopin's funeral march, plays once]`
> *You have died of cotton.*

`[ Next ▸ ]`

*(The key is `cold`, and wet cotton (the soaked hoodie) is in the cause trace. Wet cotton comes ahead of rain in the key's fixed order (only a skinny dip comes before it), so the line names cotton rather than a long, wet night, even though the missing sleeping bag cost more warmth (9.5).)*

**17c. Leave No Trace**
`[Glacier Meadows by day, in its own colors: heather, late snow, firs, the moraine above. Beside the trail, a small cartoon skeleton lies on its back next to a little gray daypack. Over about seven seconds both crumble pixel by pixel into dust, the dust drifts off down the valley, and the meadow is exactly as it was before anyone came. A tap skips.]`
> **Leave No Trace.**

`[ Next ▸ ]`

**17d. The epitaph**
`[the Hoh River Trailhead at evening; the wooden register box on its post, lid open, a pencil on a string]`
> There are no stones on the mountain. But the register at the trailhead keeps one line for everyone who goes in.

`[ type a line, or tap the dice   ] [⚄]`
`[ Sign the Trail Register ▸ ]` `[ Leave it blank ]`

*(The player taps the dice once. The `cold` deck deals its cold-tagged lines first, and the first is Charles A. Barnes's, from his journal of January 14, 1890, the day the Press Expedition hauled its boat up the Elwha in the snow:)*

`[ It was terribly cold.        ] [⚄]`
`  C. A. Barnes, Press Expedition,`
`  Jan. 14, 1890`

*(The player keeps it, and the pencil writes it in. A second tap would have dealt Barnes again, "The snow is our greatest difficulty", since a line in the words of someone who was there comes before a newspaper's; the Fairhaven Herald's "some of it very cold" waits behind them (9.5). Typing over the line would have made it the player's own, with no credit.)*

**17e. GAME OVER: the GAME OVER card**
`[the trip's title with a black register mark beside it; the same register box, its lid closed, the pencil hanging still in the last light]` · *GAME OVER*
> ***The Long Night at Glacier Meadows***
>
> **Here ends the trail of Robin,** who went to see the Blue Glacier in one long day.
>
> *September 25 and 26, 2027 · Glacier Meadows, the first night · Score 25 of 64 · 17.4 mi*
>
> *You have died of cotton.* *Epitaph:* "It was terribly cold." (C. A. Barnes, 1890)
>
> *What would have kept Robin alive:* a sleeping bag, a pad and a rain shell; turning back at Lewis Meadow; or, that night, waiting for help.

`[ Back to the cabin ▸ ]` `[ Ranger's Note ]` `[ Route map ]` `[ Field Notes ]`

*(The Ranger's Note button opens 17a's note in full, and the route map shows the route dotted from the Hoh River Trailhead to the biggest tree at Glacier Meadows.)*

**17f. The cabin at dusk**
`[the cabin at dusk: the porch light on, one Adirondack chair empty, the tub covered, the fire bowl cold; Robin's trip reports by the bowl and the route signs on the shed wall crumbling to dust, as the bones did; a fresh pencil mark on the register post]`
> One chair is empty tonight.

`[ Read the register ▸ ]` `[ Sign the guest book ]`

*(One confirm before it (12.17), and the wipe happens here: Robin's trip reports and skills go with Robin. The guest book asks for a new name, and the Trail Register's* Remembered *list opens with Robin's line: screen 20.)*

**18. The death box: the ice**
`[the Blue Glacier from the moraine, drained to cold blue-grays; one dark seam in the snow]`
> **The Blue Glacier Keeps Its Rooms**
> *Snow bridges look exactly like the snow on either side of them, which is the whole trouble with snow bridges. The Blue Glacier closes one of its blue rooms behind you, as quietly as a door.*
>
> **Ranger's Note:** Glaciers hide crevasses under snow bridges, even late in the season. Travel on a glacier only roped to a trained team, with crampons and an ice axe, or enjoy it from the moraine, which is where the best view is anyway.

`[ Next ▸ ]` → ***YOU PERISHED.*** *You have died of a crevasse.*
Its dice deal fall- and snow-tagged lines first, such as *"a man will frequently sink out of sight."* (C. A. Barnes, Jan. 14, 1890, of snow hiding the gaps between river boulders).

**18b. The death box: the crest (the first playable)**
`[the High Divide crest under a thunderhead, drained to cold blue-grays; Mount Olympus gone into the cloud; one bare snag]` · *Day 2 · 2:20 pm · High Divide · 5,100 ft*
> **The Divide Is the Tallest Thing Around**
> *The thunder has been asking since noon, politely at first. The High Divide is the tallest thing for some distance, which is what makes the view, and this afternoon the storm comes to see the view as well. On the open crest, a short walk above the basin, your story stops.*
>
> **Ranger's Note:** Summer thunderstorms build over the Olympics in the afternoon, so cross the High Divide in the morning. When you hear thunder, no place outside is safe, only safer: get off the crest, away from lone trees, and down into the basin. The view will still be there tomorrow.

`[ Next ▸ ]` → ***YOU PERISHED.*** *You have died of a thunderstorm.*

*(The fair path: the morning forecast named afternoon thunder, the crest card offered* Off the crest, now *(sure: down to the nearest shelter, as in B.6) beside* Stay for one more look *(♦, with its fatal share), and the player stayed (9.5). The remains lie on the trail tread of the crest. Then the epitaph screen, at the Sol Duc Trailhead, where the loop began:)*

`[the Sol Duc Trailhead in the rain; the wooden register box on its post, lid open, a pencil on a string]`

`[ all but one sad day          ] [⚄]`
`  Winona Bailey, The Mountaineer,`
`  1920`

*(No line suits a lightning death yet, so the deck deals the general pool, someone who was there first: a member of The Mountaineers' 1920 outing, on three weeks of sunshine. In the register it reads like Robin's line at Glacier Meadows (12.3): the High Divide, the second day, died of a thunderstorm, and the line with its credit. M1a's review site prints this sequence for the Divide's `lightning`, `fog` and `cold` deaths, so you can judge it on the hike you know (12.17, 14.4).)*

**19. The death box: the river**
`[the Hoh at waist depth in the late afternoon, drained to cold blue-grays; the far bank very far]`
> **The River Is in a Hurry**
> *The Hoh is on its way to the Pacific, as it is every afternoon, and this afternoon it is in a particular hurry. It doesn't mean anything by it. Rivers never do.*
>
> **Ranger's Note:** Glacial and snowmelt rivers run highest in the late afternoon. Cross in the early morning, unbuckle your hip belt, face upstream and lean on poles, and if it looks too deep, it is: camp and wait.

`[ Next ▸ ]` → ***YOU PERISHED.*** *You have died of the river.*
No line in the knowledge base suits a river death yet, so its dice deal from the general pool, the explorers' own lines first (*"We look like tramps"*, C. A. Barnes, 1890), then the newspapers' (*"Many other days were full of trials"*, *Sacramento Daily Record-Union*, Aug. 14, 1890). A player who would rather write *Should have crossed at dawn.* types it.

*(Screens 18 and 19 then go on exactly as 17c to 17f. The remains lie where the hiker last stood, never in the ice or the water (11.10): at the edge of the moraine above the glacier, and on the gravel bar at the ford.)*

**20. The next hiker, and the Trail Register**
`[the Hoh River Trailhead in the morning; the wooden register box on its post, lid open, a pencil on a string; the car behind]` · *Day 1 · 8:05 am · Hoh River Trailhead*
> Two pages back in the register, in the same pencil: Robin, who signed in and never signed out. *"It was terribly cold."*

`[ Back to the car for the wool sweater ]` `[ Start walking ▸ ]`

*(Robin's skills and trip reports are gone, and Sam inherits nothing (9.8): Sam typed a name in the guest book, and that was the whole of it. The register line is all that is left, and anyone who signs in can read it, here or at the cabin's post. Sam's first trip starts at the map table like any other; there is no prologue. Sam's permit number carries on from Robin's last, because the counter lives in the register (12.6).)*

**21. One of the 104 Boyz (a tip, on the High Divide)**
`[the High Divide crest at mid-morning; a second hiker coming the other way in a teal jacket, a fly rod case strapped to the pack; Mount Olympus far off]` · *Day 2 · 10:20 am · High Divide · 5,100 ft*
> A hiker in a teal jacket, coming the other way: {BOY_1}. {BOY_1_QUIRK}. "Fog'll be on the crest by two. It was yesterday."

`[ Thank him, walk on ]`

*(A tip is honest knowledge: the weather this afternoon is one of the knowledge-gated modifiers, so the fog's arrival is now a time, and the navigation checks on the crest show a number where they showed a range, 8.6. A tip never invents a route detail about a real place. The name and the quirk are placeholders until you send them (7.11); the fly rod is a stand-in detail, to be replaced by his real one. To a stranger he is a hiker with a name, and the line works without the joke (2.2). A Boy says his line and leaves. He never joins Robin, carries anything or comes back to help.)*

**22. Ranger Jon (the evening before the climb)**
`[Glacier Meadows at dusk; a ranger in a flat hat sitting on a log, a coil of rope beside him; one paper-cream pixel on his shirt]` · *Day 3 · 7:30 pm · Glacier Meadows · 4,300 ft*
> Ranger Jon arrives the way rangers arrive anywhere, as if he's been here a while. {JON_QUIRK}. "We leave at four. The glacier is friendlier before breakfast. So am I."

`[ Check gear with Jon  20 min ]` `[ Go to bed early ]`

*(A Look at the badge reads* "You see Ranger Jon. His badge says 104." *Nobody explains it; the same badge hangs on a nail at the cabin (2.2). Jon guides only on his days off, which is the game's one deliberate liberty with how the park works, and Credits own up to it (12.20). His quirk is a placeholder until you send it (4.2).)*

**23. Lake Morgenroth (the hand-drawn signature scene)**
`[hand-drawn: boulders and heather in front; the lake still and dark; the basin rim in layered bands; a black bear, small, on the far shore; the dusk remap]` · *Day 3 · 7:40 pm · Lake Morgenroth · 4,130 ft*
> The way trail was there all along, for anyone who looked. On the far shore a bear is eating the meadow, slowly and with great attention.

`[ Sit by the water ]` `[ Watch the bear ]` `[ Watch the sunset ]`

*(Your favorite spot, from B.7, reached only by the call (4.3). It is drawn from the research's art notes until your photos, stories and GPS track arrive, and this stop and its plate are the first things they change. The bear is wildlife at a respectful distance, a beautiful moment and nothing more (7.11). The stop before it was the IPA's tile, at 7:15 (2.6).)*

**24. The basin or the crest (a fork card, the first playable)**
`[the rim of the Seven Lakes Basin: blue lakes in a bowl of pale rock and heather below; the stone staircase going down; clouds stacking up over Mount Olympus]` · *Day 1 · 1:50 pm · the rim · 4,900 ft*
`strip: SPLIT the rim 5:20 · +0:15 plan · Water 0.5 L · Lunch Lake 0.9 mi`
> The basin lies below. Clouds stack up over Olympus: thunder likely after three.

`[ Stay high to Heart Lk  4:30  (i) ]`
`[   mostly fine ▒░█ 0.2% fatal     ]`
`[ Through the basin      5:00  (i) ]`
`[   mostly fine ▒░█ <0.1% fatal    ]`
`[ Lunch Lake tonight       permit ]`
`[ Back to the car            sure ]`

*(From B.6, counterclockwise, one night planned at Heart Lake by the crest. The fork fires at the first way into the basin whatever the clock says (7.4), and everything it knows is on the screen or under its (i): the ETAs against dark, the forecast for the crest, the water in the strip, and what each choice does to the permit. The black tips are the look-ahead's honest price for keeping on along a crest that may have a storm on it; B.6 shows the arithmetic. Every choice here is the player's, and one of them is sure.)*

**25. A Larry moment: Heart Lake after dinner (PG-13)**
`[Heart Lake at golden hour: the heart-shaped lake and its little outlet falls; a towel folded on a rock; the hiker small, up to the neck in the water; the trail above, empty for one more second]` · *Day 1 · 7:25 pm · Heart Lake · 4,780 ft · clear*
> You go in all at once, on the theory that it'll be over sooner. It isn't. Then voices on the trail above: {BOY_1} and a party of hikers, stopping to admire the view.

`[ Stay low in the water   cold ]`
`[ Walk out with dignity   sure ]`
`[ Wave                    sure ]`

*(From B.6. The censor bar comes down only when the hiker leaves the water in view: *Walk out with dignity* is the stop in 12.21, and *Wave* gets {BOY_1} waving back, at the lake. *Stay low* is a plain cost, not a roll: warmth every ten minutes, because the party is in no hurry. No food was in a pocket, so the jay rolled nothing. With the towel on the rock, the evening is a story and a full heart. Without one, after sunset, a hiker who stays out wet meets the Cold chain's two warnings, each with a sure way into the tent, and in Old School its ♦ after them: the only way this stop could kill, as* You have died of skinny dipping. *(2.6, 9.5).)*

**26. The log, as the trip report shows it (voice B)**
`[the trip report's DAY 1, scrolled; the route map above with the split ticks]` · *Trip report · Thunder on the High Divide*
> **Day 1. Fog in the river trail, sun at the park.** 8:25 Sol Duc trailhead. Fog. 8:56 the falls, -0:04 on plan. 2:00 Sol Duc Park. Marmot on a rock, unimpressed. Feet: fine. Spirits: high.

*(The log is the record: first person, terse, past or plain, one line per moment the day kept, written as you go and read at home. The headline is picked from the day's biggest event (9.7). It is the same record a backpacker keeps in a notebook, so it shares well.)*

---

## Appendix E: Tech architecture and data files

*For the engineering sessions. Players never see any of this.*

### E.1 Principles

1. **Data first, engine small.** Every place, item, card, line and picture is data. The engine is an interpreter of roughly 6 to 8 thousand lines that knows nothing about the Hoh. Growing to the whole park is a content job, not an engine job (tides are the one genuinely new system).
2. **Deterministic.** A trip is a pure function of `(build, seed, plan, profile snapshot, actions)`. The profile snapshot holds exactly the fields of the living hiker that the engine reads (skills, region memory, recently seen cards for novelty), and it travels with every save, bug report and trip code. That gives replays, share codes, exact bug reports, and a test harness that runs the real game.
3. **The pack talks through tags; cards listen to tags** (6.5).
4. **Honest odds come from the same code that rolls.**
5. **Validate at the door.** With an AI writing most of the content, the linter and the simulation gates are the main quality tool.
6. **Hard by default, fair by construction:** a death outcome exists only behind a ♦ with a computed fatal share (or at a chain's end after two warnings), every one carries a rescue override for the hidden gentle mode, and the linter and the harness check both (F.1, F.3).
7. **The phone is the target; Node is the lab.** Everything that runs on the phone runs headless in Node.

### E.2 The one boundary

```
 engine/ (pure: no DOM, no timers,
          no Math.random)
   rng · expr · content index · plan
   pack · weather · movement · body
   tides · director · cards · effects
   queue · voice · score · phases
   save
        ▲ Actions         │ Screens
        │                 ▼
 ui/   DOM screens, text, choices,
       map, home, stores, flat lay,
       settings
 gfx/  picture VM ▸ composer ▸ palette
       remap and cycling ▸ canvas
 platform/ storage, service worker,
       share, audio
```

```
Screen = { scene, caption, strip,
           box, choices, margin,
           odds }
Action = choose | next | plan | buy
       | lay | pack | car | setting
       ...
step(state, action)
  -> { state, screen }
```

The UI never changes game state; the engine never touches the DOM. Node imports the same engine modules for the simulator, card bench, transcripts and picture previews.

### E.3 Stack

- **Plain ES modules, no bundler, no framework.** What runs on the iPhone is exactly the files in the repo, so a pasted stack trace points at a real line, and Node imports the same files. A 40-line DOM helper is enough for about 20 screen types.
- **Types from JSDoc**, checked with `tsc --checkJs` in CI only. Content types are generated from JSON Schema.
- **Zero runtime dependencies.** Dev dependency: TypeScript (type-check only). Everything else uses Node 22 built-ins (`node --test`, `node:zlib` for PNGs, `worker_threads` for the harness).
- **Text is DOM; only the picture is canvas.**
- **The only build step is for data:** `tools/build.mjs` compiles the content into one data file (E.4). The code ships as written.
- **Escape hatch:** if first load ever gets slow, one `esbuild` step in the deploy job bundles it, with no source changes.

### E.4 The data pipeline

```
design/data/regions/*.json   (research)
design/data/*_catalog.json
design/data/park_rules.json
design/data/lore/*.json      (history)
        │  tools/ingest.mjs
        ▼
content/park/regions/*.json
  (normalized)
  + content/park/overlays/ (patches)
  + content/park/conditions/2026.json
  + cards, text, scenes, gear, food,
    stores
        │  tools/build.mjs: validate ▸
        │  compile expressions ▸ index
        │  cards ▸ compile pictures ▸
        │  lint ▸ hash
        ▼
dist/data/build.<hash>.json + precache
```

**What ingest fixes** (and reports, every fix and every doubt):

| Problem in the raw data | Ingest rule |
|---|---|
| The same id in two regions (14 found; 2 were different places, since renamed) | Merge true shared places by id; prefer non-null fields; **lint G04** flags elevation or coordinate disagreements over 100 ft, which is exactly how a collision shows up |
| Segments listed one way only | Synthesize the reverse with gain and loss swapped, unless marked one-way |
| Null gain or loss | Derive from the endpoint elevations; flag as estimated |
| Null elevation (Caltech Rocks, the false summit) | Interpolate from neighbors; flag; overlays can pin a value |
| Many hazard words (65+ across files) | Map to about 30 canonical tags; unknown words become `x_<word>` with a warning |
| Statuses written as hazards (`trail_closed_2026`) | Move to the dated conditions overlay |
| Tide limits in free text | Propose `tide_max_ft` per beach segment; a human confirms each in the coast overlay |
| `snow_free_typical` as text ("mid-Jul to early Oct") | Parse to day-of-year windows; the overlay supplies any that fail |
| Missing coordinates | Not needed for play; the map uses `map_xy` from overlays |
| Itinerary miles typed by hand (some null, some shorter than the graph allows) | Recompute every day from the graph; keep the typed miles only as notes; report every difference |
| Presets that don't end at a trailhead (or, for a loop, at the start) | Reject them as presets and list them in the report |
| Rule text in a region file that disagrees with `park_rules.json` | `park_rules.json` wins; the report lists the stale text |
| Lore quotes of mixed standing (verified, partly checked, seen only in a modern transcription) | Only lines marked `page_image_checked`, with a public-domain reason and a URL, reach `content/lore/quotes.json`; the secondary pool never does; any line whose source is a Robert L. Wood work fails the build (F.3) |

**Known data fixes** (refreshed again on 2026-10-08, after the data cleanup landed: `data/M1A_DATA_CHECK.md`'s Resolution has every item. The ingest report, not this list, is the check.)

*Fixed at the source for M1a* (ingest only checks them now):
- `sol_duc_high_divide`: Bogachiel Peak is a spur (`through_route: false` and a `spur` block on both summit segments), so the loop routes to 18.4 mi by the crest and 18.7 through the basin (4.3). Every camp has `camp.group_site` and `camp.stock_site`, so a solo hiker is never offered either. The wildlife and hazard ideas were rewritten to fit your decisions. Dated 2026 news moved into `conditions_2026`, each entry with `from`, `until` or `persists`, `last_confirmed` and `applies_to` (4.7). The Hoh Lake to C.B. Flats segment matches `hoh_olympus`. And `m1a_play_inputs` holds M1a's flagged estimates: quota odds, desk requests, ranger visits and the permit check, trail traffic, the no-canister visitor roll, the place fields for all 47 loop nodes, and the crossings (E.5).
- `park_rules.json`: `climate.m1a_weather_inputs` (the weather chain, High-zone thunder and fog, ridge wind, a Sol Duc valley station, 2027 daylight), `permits.desk_requests` and `campfires.future_ban_climatology`, each estimate flagged.
- The catalogs: the beer and the pre-roll (88 foods, 5.4); the plush fox is gone (217 items); the cameras, the speaker and the drone have battery stats; `night_model_stats` makes each item's own stats the night model's source (7.9); and two kits for F.1, `loop_in_a_day_3l` and `day_gear_TRAP_no_canister`.
- Lore: `card_shelters` re-anchored, with a new card for the CCC's 1939 shelter above Sol Duc Falls; the `dark` deck split into `dark_fall` and `dark_fog`, with a lint rule; `oh_q28` no longer drawable.
- New: `quiz_locals.json`, the twelve locals' quiz questions, each with a source (2.6).

*Still for ingest:*
- `gear_catalog.json` still carries the retired collection system's `journal_points` stat on 5 items (the three cameras, the sketchbook and the journal); ingest drops it. Its glosses say the system is retired, and no catalog string names *The Golden Glow* (lint T04). Ingest also retires two tags: the four `field_guide_*` items (tag `field_guide`) map to the `id_book` event tag, and `sketchbook_pocket` (tag `sketchbook`) maps to `luxury`, since the only sketch in the game is the Bonfire Lily's, on the back of the permit (10.2).

*The other region files (M2 on):*
- `northeast_dose` `dose_to_quinault_traverse`: day 3 miles are null; it ends at `enchanted_valley`, not a trailhead; its total, 15.4, is under the graph's 22.2.
- `northeast_dose` `dose_to_elwha_traverse`: day 4 is null; it ends at `elkhorn`; total 19.1 against 35.3 on the graph.
- `south_quinault_skok` `quinault_to_elwha_traverse`: three null days (4 to 6).
- `elwha_hurricane` `hurricane_ridge_elwha_grand_valley_loop`: a null day and a blank total.
- `elwha_hurricane` `bailey_range_traverse` and `northern_bailey_range_dodger_exit`: null days (off-trail, so expected; they stay hand-checked).
- Small shortfalls, both in `south_quinault_skok`: `white_mountain_loop_from_dosewallips` day 3 (12.1 against 12.2) and `quinault_to_dosewallips_traverse` day 3 (6.7 against 6.8).
- 93 segment fields are null outside the loop (45 in the Elwha, 18 in the Hamma Hamma, 14 on the Hoh, 10 in the Dosewallips, 4 on the coast, 2 in the south); ingest derives most of them. The Aurora Creek trail's climb (+3,220 ft) is 340 ft short of its endpoints.
- `hoh_olympus` still says "WAG bags" in four places (Caltech Rocks, Snow Dome, a trip's warnings and a 2026 conditions note); `park_rules.json` says blue bags.
- Camps that mix group or stock sites with individual ones (Five Mile Island, Lewis Meadow, Elk Lake and others) need the `group_site` and `stock_site` flags, and some research ideas there still mention sketches and the journal (14.3 treats them as void). Each region's milestone fixes its own.
- `hamma_hamma.json` is new (2026-10-07/08) and hasn't been through `FACT_CHECK.md` yet: 15 unofficial places (the Valley of Heaven, the Stone Ponds junction and pass, the Scout Lake divide and others) carry null coordinates, which ingest must place from overlays before the map can draw them (4.1), and three of its trips have null days.
- `FACT_CHECK.md` says the Bailey Range is the only itinerary shorter than the graph allows; the two shortfalls above say otherwise.

*No longer needed* (fixed at the source before the cleanup): `morgenroth_lake.game_notes` says phone only, as your call has it (4.3); the 2026 fire ban dates in the Sol Duc camp notes (Aug 7); `sol_duc_falls_edge` cites the 2025 death and is tagged `real_incident` (9.5); the canisters have rental prices (`rent_usd_per_day`, 5.1); and the catalog strings that named *The Golden Glow*.

### E.5 Data files

**Inputs that exist now** (fact-checked 2026-10-08; cite, don't copy):

| File | Holds | Feeds |
|---|---|---|
| `regions/*.json` (6, plus the new `hamma_hamma`, 4.1) | Places, segments, trailheads, 150 classic trips (166 with the Hamma Hamma's), hazards, wildlife, rules, 2026 conditions, uncertain claims, sources; for the loop, `m1a_play_inputs` (quota and desk odds, rangers, traffic, visitors, place fields, crossings: flagged estimates) | The park graph, presets, cards, scenes, assertions, permits, overlays |
| `park_rules.json` | Permits, quotas, desk requests, fees, food storage, fires and the future-ban climatology, LNT, climate with M1a's weather inputs, tides, SAR patterns, wildlife, fall 2026 conditions | Planner, weather, tides, rescue, ranger lines |
| `gear_catalog.json` | 8 packs, 217 items, tiers, tag and stat glossaries, night-model stats, sample kits, rentals | The shed, the stores, the flat lay, tags, the night model |
| `food_catalog.json` | 88 foods (the beer and the pre-roll among them), daily needs, canister capacities | Store, canister fit, energy, morale |
| `quiz_locals.json` | Twelve locals' quiz questions, each with a source | The first-launch quiz (2.6) |
| `lore/` (still being written) | `history.json`, the park's history as facts, much of it after Robert L. Wood's books, in our own words with credits; `quotes_public_domain.json`, verbatim lines from U.S. texts before 1931 and government reports, each with source, page, URL, length, uses, tags and cautions; `LORE.md`, the rules. Working files: `press_expedition.json`, `oneil_expeditions.json`, `other_history.json` (each with its own quote pool) and `wood_bibliography.json` | History asides, the epitaph dice (9.5), Credits and the Ranger's Bookshelf (12.20) |

**New data the game needs** (each written in the milestone that first needs it, from M0 on; Ranger Jon's file, for example, comes with M2):

| File / field | Holds |
|---|---|
| `content/park/conditions/2026.json` | Closures, road walks, fire bans, ladder condition; each entry has `from`, `until` or `persists`, and its last-confirmed date (4.7) |
| `data/climate.json` | Zone x month: references, rain chance, thunderstorm chance, weather chain, freezing level (from `park_rules.json`) |
| `data/daylight.json` | Sunrise, sunset, civil twilight for the 1st and 15th of each month |
| `data/tides/la_push_YYYY.json` | NOAA high/low predictions, plus per-place offsets |
| `rules/kits.json` | The ranger's sensible kit by zone x month (for the checklist, gap bias and the item-value audit) |
| `rules/tuning.json`, `rules/mods.json`, `rules/macros.json` | Every tuning knob; shared modifier sets; effect bundles |
| Overlay fields per place | `canopy`, `cold_pool`, `water`, `ranger` presence, `snow_feature` (with month windows by snow year), `bonfire_lily_weight`, `views`, `map_xy` |
| Overlay fields per crossing | River type, monthly base depth, speed, bridge |
| Overlay fields per beach segment | `tide_max_ft`, overland alternative, impassable |
| `content/art/palette.json` | The 16 colors (11.1); the dusk, blue-hour, night, weather and drained death-box lookup tables (11.4, 12.17); the cycles and lights (11.5) |
| `content/text/look/*.json` | Look-box lines in Sierra's second person, per place, feature and animal (2.3) |
| `content/death/causes.json` | The cause-of-death table (9.5), Old School only: for each cause key, its *YOU PERISHED* line and its variants, each with an id and the trace condition that selects it, tried in a fixed order (for `cold`: a skinny dip with no towel, then wet cotton, then rain, then a clear sky; for a fall or a cliff: after dark without a headlamp), and the quote tags its epitaph dice prefer (9.5). Cards only name the key; every word of the sequence lives here, so tone fixes never touch a card. A fix reaches future deaths only: a Trail Register entry keeps the line it showed (E.6) |
| `stores/stores.json`, `drive/routes.json` | The three stores' fictional placeholders and shelves (5.7: the general store's beer cooler, Second Growth's one shelf, The Steaming Fern Lodge's pools and gift shop), with each item's `origin` and `look`; drive routes from the researched drive times |
| `people/ranger_jon.json` | Ranger Jon: badge 104, his bookable days off, the fee, his lines, and `{JON_QUIRK}` until you send it (4.2) |
| `content/park/tracks/morgenroth.json` | Made from your GPS track of the way to Lake Morgenroth, once you send it. The raw GPX never enters the public repo: ingest reads it once in a working session, outside the repo, and commits only a simplified way-trail line at the map's scale (a few points, no timestamps), its distance, gain and trail class, replacing the straight-line estimates and reporting every change (4.3, 16). If you'd rather the route not be published at all, the line stays generalized |
| `people/boyz.json` | The 104 Boyz: ids, `{BOY_n}` names (first names or nicknames) and `{BOY_n_QUIRK}` quirks until you send them, their tips, trades and warnings, and their pre-filled *Remembered* entries: a fictional misadventure death each, with place, date, score, cause line and a funny epitaph (7.11) |
| `content/quiz/locals.json` | The first-launch quiz (2.6): about twelve Pacific Northwest questions, each with its answers, the right one, a source, and the lines for right and wrong (*"Welcome home."*, *"Nice try, tourist."*) |
| `content/lore/quotes.json` | Built from `lore/quotes_public_domain.json`: the drawable epitaph lines with their credits and tags (9.5) |
| `config/flags.json` | Build flags: `gentle` (false in every build you can install, 9.4), `larry` (true in every v1 build, main and preview, 2.6) and the build's channel |

### E.6 Saves, and iOS storage realities

`<channel>` is `main` or `preview` (E.9).

| Key | Holds | Size |
|---|---|---|
| `oph.<channel>.device` (localStorage) | What outlives every hiker: settings, which odds forms you've seen, whether the locals' quiz was taken (2.6), the daily streak and personal bests, and **the Trail Register** (Best trips; Remembered entries; the Boyz' pre-filled lines; each dead hiker's id and their last trip's seed; the permit counter) | 10-40 KB |
| `oph.<channel>.hiker` (localStorage) | The living hiker: id, name, skills, region memory, last pack, recently seen cards, career marks, and the trip-report index with each trip's seed and **latest stop number**. The wipe deletes it | 10-40 KB |
| `oph.<channel>.trip` (localStorage) | The one Open trip in progress, rewritten after every stop. The wipe deletes it | 15-40 KB |
| IndexedDB `oph-<channel>-reports` | The living hiker's trip reports: the rendered log and scene recipe ids, to read again. The wipe deletes it | 20-40 KB per trip; the oldest log text is pruned first if space runs short |
| `oph.<channel>.gentle.*`, IndexedDB `oph-<channel>-gentle` | The hidden gentle mode's hikers and trips (9.4). Never written while `flags.gentle` is off | none in v1 |

- A save is a **snapshot plus the action log plus the profile snapshot** (E.1). Loads use the snapshot (migrated if the build changed); the action log replays only for tests and bug reports.
- **One trip in progress:** one living Open hiker per phone, with at most one trip in progress (9.8). A trip code or *Hike it again* can't open a seed that is already in progress (9.7). A Hike of the Day attempt is saved apart from the Open hiker (decision 25).
- **Going back:** none. There is no restore ring and no manual bookmark; every stop overwrites the trip's one autosave, so nothing can quietly undo a choice. Reading a finished trip report is read-only.
- **A death is saved at once.** The save written at the confirming tap already holds the outcome (8.14). If it is a death, that same write adds the memorial entry to the Trail Register and marks the hiker dead. The entry stores the name, the hiker's id, the trip's title, place, dates, score, permit number (or *day hike*) and seed, the cause key, the variant id and the rendered *YOU PERISHED* line, so a later build's `causes.json` can never reword it. From that write on, the trip opens only on its death-sequence screens, so closing the app on any of them, or anywhere after the tap, changes nothing. **The epitaph is the one later write:** signing adds the line, and for a dealt line its quote id, to the register entry and changes nothing else; once GAME OVER is shown it is fixed.
- **The wipe** runs when the player taps the GAME OVER card's button (DRAFT: *Back to the cabin*, 12.17), and plays at the cabin at dusk (12.25). It deletes the hiker record, the trip save and the hiker's trip reports, and leaves the device record and its register alone. If the app dies halfway, the next launch finds a dead hiker with data left over and finishes the wipe before it shows anything. There is no undo, by design: *"Full wipe."*
- **Trip reports survive updates.** An old action log can't replay after a new build (the old engine and content are gone from the cache), so each trip report keeps its rendered log and recipe ids instead, and redraws the pictures from recipes (an unknown recipe falls back to its biome base).
- **iOS:** Safari may clear site storage after about 7 days without a visit, and **Home Screen apps keep separate storage from Safari**. So the cabin recommends installing *before* the first save (12.3), the game calls `navigator.storage.persist()` where available (never depending on it), and **Export / Import** turns the device record, the hiker and the trip into a code you can share to yourself. It is for moving phones and surviving eviction, not for undoing.
  - **The hiker record holds each trip's latest stop number**, and Import refuses any trip save older than that record (offering to open it read-only, as a report), so an export from before a sprain, a lost item or a rescue can't be replayed with a different choice.
  - **Import never brings back the dead.** The register lists every dead hiker's id, and a hiker or trip save with a listed id is refused, so an export from before a death can't undo the wipe.
  - **A register import merges** with the one on the phone: it never removes a *Remembered* entry, and the permit counter keeps the higher number.
  - A player who carries old codes between phones on purpose can still cheat; the game doesn't fight that, any more than a 1984 floppy did.

### E.7 Offline at the trailhead (PWA)

- `manifest.webmanifest`: name "Olympic Peninsula Hiker", short name "Hiker", standalone, portrait, black theme, 192/512/maskable icons; `apple-touch-icon` 180 px. The preview channel has its own manifest, name ("Hiker Preview") and icon.
- **One service worker per channel.** Main's `sw.js` has scope `/104-boyz/`, which would also cover `/104-boyz/preview/`, so it passes every request under `preview/` straight through, and its navigation fallback never serves main's `index.html` for a preview URL. The preview worker is registered from `/104-boyz/preview/` with scope `./`.
- Each worker precaches every file of its current build (under 5 MB) into `oph-<channel>-<hash>`, fetched with `cache: 'reload'` so GitHub Pages' 10-minute HTTP cache can't slip a stale file in. On activate it deletes only old caches with its own `oph-<channel>-` prefix, never the other channel's.
- **Updates wait.** A new build installs in the background, and only the cabin shows it: the mailbox flag goes up, with one line inside (DRAFT: *"An update has arrived. Open it?"*). A trip is never swapped mid-stop. Session 1's "new edition" wording is retired.
- A **"works offline" stamp** (DRAFT) appears on the cabin's mailbox once precaching finishes, teaching players to open the game at home before they lose signal on the Sol Duc Road or the Upper Hoh Road.
- **No phone links, ever.** The app shell's `<head>` carries `<meta name="format-detection" content="telephone=no">`, so iOS Safari never turns phone-shaped text into a Call link. The WIC number is drawn only by the phone hotspot component (in the pixel font, with an `aria-label` VoiceOver reads), never as loose text, with `-webkit-touch-callout: none` and `user-select: none`, so a tap opens the game's own call screen and a long-press offers nothing. No screen has a `tel:` link (12.5, 16, lint T06).
- All URLs are relative (the site lives at `https://fernforager.github.io/104-boyz/`). Top-level screens use `#` routes; trip screens use `history.replaceState`, so Back never rewinds a trip (12.1).
- **One origin for the whole account.** Every Pages project under `fernforager.github.io` shares this origin, so an unrelated project there would share the same localStorage (about 5 MB) and Cache Storage. The `oph.` prefixes keep the game's keys apart, but the quota is shared.

### E.8 Randomness

A seeded `sfc32` generator, with every draw keyed by `hash(trip seed, stream, key)`. `Math.random` is banned in the engine (a unit test makes it throw). Keys are content (places, cards, days) and, for rolls and effects, the trip's mode, never running counters, so an optional stop never shifts a later roll (8.14). Weather stays keyed to the seed alone, so friends comparing a code see the same mountain and the same weather in either mode.

**When the seed is drawn.** The trip seed is drawn when a plan is first saved at the map table (a Hike of the Day's comes with the day), so the planning draws use it too: a night's quota is `hash(trip seed, "permit", date, camp)`, and so are a desk request, the WIC's loaner canister and Ranger Jon's free dates. Within a trip the same night always gives the same answer, so going back to the map table can't re-roll a full camp; another date can come out differently, and so can another trip. A trip code carries its seed, so a friend's planning rolls what yours did (9.8). *Hike it again* copies the printed permit, so nothing on it is re-rolled, whichever weather the player picks (9.7).

| Stream | Keyed by | Used for |
|---|---|---|
| weather | day | The park-wide synoptic chain and zone weather, generated at the start |
| env | day, river or tide | River noise, fog persistence |
| permit | calendar date, camp | Quota availability, WIC-only requests, the WIC's loaner canister, Ranger Jon's free dates (drawn at planning from the trip seed, above) |
| director | node, slot, trip day | Which card fills a slot |
| roll | mode, node, card, choice, trip day, attempts here | Outcome rolls (the mode keeps a gentle trip from scouting an Old School one, 8.14) |
| effect | mode, node, card, outcome, op, trip day | Chances inside effects |
| text | node, slot, trip day | Which wording; the order of a death's epitaph dice deck (keyed by the trip, 9.5) |
| art | scene id | Prop placement (same on every trip) |
| dust | trip, pixel | The Leave No Trace dissolve's order and drift (11.10); display only, it never touches an outcome |
| lookahead | its own, per call | Look-ahead and Outlook runs, which resample hidden values (8.9) |

### E.9 Hosting and CI

- **GitHub Pages from Actions, set up.** The repo `FernForager/104-boyz` is public, and its Pages source is set to GitHub Actions (decided 2026-10-08), so the game lives at `https://fernforager.github.io/104-boyz/` and the preview at `.../104-boyz/preview/`. Nothing in the repo is secret, and the game needs no keys ([Decisions made](#decisions-made)).
- **One deploy, two channels.** Pages publishes one artifact as the whole site, so a single workflow checks out `main` and `preview`, builds both, puts preview under `/preview/`, and uploads one combined artifact. (A job that uploaded only `/preview/` would replace the whole site and break your link.) You can keep a stable icon and a preview icon on your Home Screen.
- **Everything is namespaced by channel:** `oph.main.*` and `oph.preview.*` keys, `oph-main-<hash>` and `oph-preview-<hash>` caches, separate save formats. A preview save migrated to a newer format can never touch the stable save. A CI test fails on any storage key or cache name without a channel prefix.
- **On every push:** build ▸ lint ▸ type-check ▸ unit tests ▸ a 2,000-trip smoke test that checks only crashes, dead ends, stuck states and determinism (the same seed and actions give the same trip twice) ▸ deploy. No statistical gate runs per push, so deploys never fail at random.
- **Unit tests** check the roll-to-band mapping exactly: a seeded generator and a known p give known Great, Clean, Shaky and Fail bands, and a known fatal share gives exactly that many deaths. That is what "the shown % is the real chance" means in code.
- **Nightly,** capped at 60 minutes: the stratified simulation matrix (F.2), statistical calibration (F.1), the coverage report and a balance diff, uploaded as artifacts. Auto-tuning runs only on demand.

### E.10 iPhone performance notes

- Draw at 160x168 and scale with one `drawImage`. At most 3 live canvases; release old ones by setting `width = 0` (iOS caps canvas memory and fails silently).
- Palette cycling at 8 fps touches only cycling pixels: well under a millisecond. Pause on `visibilitychange`, on static screens and under Reduce Motion.
- Startup under 1.5 s from a cached load: one data JSON (about 1 MB raw at full park), a prebuilt card index, lazy expression compiling, preloaded fonts.
- `localStorage` is synchronous: write right after the screen paints, under about 50 KB. Trip reports go to IndexedDB (E.6).
- The look-ahead and the Trip Outlook run in a Web Worker (8.9), so a screen never waits for them.
- The Leave No Trace dissolve (11.10) composes its scene once and then redraws only about 150 remains pixels and their motes into a copy of the cached buffer, at 10 fps for about 7 seconds: one blit per frame, well under a millisecond. It stops on `visibilitychange` and resumes at its last frame; under Reduce Motion it is a one-second CSS cross-fade between two canvases.
- Standalone mode has no back button (every screen has its own) and may be killed in the background (hence autosave every stop). No vibration API on iOS, so no haptics.

### E.11 The debugging loop with you

You test on your iPhone, and you have no Mac (your answer, 2026-10-08), so the testing plan never uses Safari's Web Inspector or any other desktop tool. What the inspector would have shown, the game copies for you.

- **The hidden debug menu.** Five taps on the version stamp in the ≡ menu (12.18), or `?debug=1` on the address, open it. Nothing marks it, and nothing in it can change a trip; the gentle flag is not in it (9.4). It shows the build, seed, phase, beat, the current card with its full odds breakdown, the last 20 actions, frame time, storage use and the last error.
- **Copy bug report** is the button that matters. One tap copies a small JSON report to the clipboard: the build and channel, the iOS version and screen size, the seed, the plan, the action log, the profile snapshot, the current screen and the last error with its stack. Paste it into a GitHub issue, a note to yourself, or straight into a Claude session, and `tools/play.mjs --replay bug.json` reproduces the trip exactly. iOS lets a web page write to the clipboard only from a tap, which this is; if it still refuses, the report opens as selectable text with a *Share* button for the iOS share sheet.
- **Note:** a field in the menu attaches your comment to the current screen, and it rides along in the next bug report.
- Any uncaught error shows a short apology (DRAFT: *"Something snagged."*) with **Copy bug report** and *Reopen* (DRAFT), which re-renders the screen from the trip's current autosave and never rewinds. An error never rolls back a choice: the autosave written at the confirming tap stands (8.14). The game should never white-screen.

---

## Appendix F: Balancing and testing

### F.1 Targets

From `simulation.md` 15 and `engine.md` 9.5, merged and recalibrated to the shown "made it" number (8.8), then reset for Old School as the default (2026-10-08). **"Happy" means plain *Finished*:** finished as planned without reaching Serious. The Hard Way doesn't count. **Death is measured in Old School,** the rule of Open play (the Hike of the Day's DNF rate is measured the same way on its fresh standard hiker). The hidden gentle mode is still measured, so it stays ready to release (9.4): its death rate is 0 by construction (F.3), and its rescue rate is measured in its own runs (at any single ♦ a would-be death becomes a rescue, but the gentle mode's softer Director deals somewhat different cards). The "model" figures are this document's worked numbers (A.6, A.7, B.5, B.6, C.2); the engine harness regenerates them, and the ranges are what it enforces. **The death caps are harness-enforced:** sensible, well-packed plans at most 0.5% per trip, ambitious but properly equipped plans at most 3%, and your own example as in its rows below.

**The reference population.** Targets are measured over named plan sets and a weighted mix of bot policies (F.2), not over "players" in general: 50% Steady, 25% Cautious, 15% Joy-seeker and 10% Bold, all following the plan unless a card changes it. Each row names its plans.

| Plan type | Happy finish | Rescue | Death (Old School) |
|---|---|---|---|
| Sensible plan, in season (the High Divide loop in Aug: all twelve of the ranger's fills, 1 to 3 nights, either way round, the basin or the crest, B.1; Hoh classic in Aug; Royal Basin 2 nights) | ≥ 95% | ≤ 0.3% | **≤ 0.5%** (model: under 0.05% for the three-night clockwise fill, B.5; the one-night crest fill counterclockwise shows 0.2% at its fork under *keep pushing*, B.6, and the bot mix less; about 0.1% for the Hoh classic, which passes the ladder by day going up and coming down, about 0.04% each way) |
| Sensible plan, shoulder season (High Divide late Sep; Hoh early Jul with chute snow): a well-packed plan outside the month the planner suggests | ≥ 85% | ≤ 0.5% | **≤ 0.5%** |
| Olympus with Ranger Jon, sensible kit, July | ≥ 85%; summit 55-75% | ≤ 1% | ≤ 0.5% (roped: no crevasse death roll) |
| Olympus alone, equipped (glacier kit, rested, late July, an early start), going on at every crossing | Summit 35-55% (model: a little under half, 4.2) | ≤ 15% | **≤ 3%** (model: about 1.2%, 4.2) |
| Ambitious but equipped (Glacier Meadows in 1 night with real gear; High Divide loop in a day with headlamp and 3 L) | 60-85% | ≤ 3% | **≤ 3%** (model: about 0.2%, A.6) |
| Skimpy kit, benign season | 85-95% (costs joy, not safety) | ≤ 1% | ≤ 0.5% (model: under 0.1%, B.5) |
| **The first playable's trap: the High Divide loop in a day on the canonical day-gear kit** (no headlamp, one liter), starting at noon in late September, keeps pushing (Bold bot) | ≤ 10%; trouble or worse ≥ 80% | 10-35% | **2-10%** (no model yet: M1a's first runs fill it in, for your review) |
| **The same plan, takes the turnaround** at the first fork that offers it (Cautious bot) | ~0%; nearly all Sooner Than Planned | ≤ 1% | **≤ 0.1%** |
| **Your example: day gear (the canonical trap kit) to Glacier Meadows in 1 night, September, keeps pushing** (Bold bot) | ≤ 5%; trouble or worse ≥ 80% | 15-35% (model: about 28%) | **4-10%** (model: about 6.6%, 1 in 15, A.6) |
| **The same plan, takes the turnaround** at the first fork that offers it (Cautious bot) | ~0%; nearly all Sooner Than Planned | ≤ 1% | **≤ 0.1%** (model: 0) |
| **Literally the summit, day gear, 1 night, alone** (A.7), bot mix | Summit ≤ 1%; Sooner Than Planned ≥ 60% | ≤ 35% | ≤ 3% (model: about 1%) |
| The same, keeps pushing (Bold bot) | Summit 0 (turns back at the second crossing); Sooner Than Planned 50-65% | 20-40% (model: about 36%) | **5-12%** (model: about 7.0%, 1 in 14, A.7) |
| Reckless: onto the Blue Glacier alone, day gear, going on at every ♦ (A.7) | Summit ≤ 8% (model: about 4.5%) | 25-50% (model: about 47%) | **6-12%** (model: about 7.9%, 1 in 12, A.7) |
| Reckless: a waist-deep ford (the Queets in June), crossed tired and without poles | — (one crossing) | 5-15% per crossing (model: about 8%) | **1-5% per crossing** (model: about 2%, 8.11) |
| Reckless: the South Coast ignoring tides | ≤ 2% | 20-40% | **10-25%** (model: 16% for each headland attempt more than 1 ft over, C.2) |
| Bail at the first fork, any plan | ~0%, nearly all Sooner Than Planned | ~0% | ~0% |

**Global health targets:**
- Rescue rate across the reference population: **under 3%**, measured in each mode (the hidden gentle mode's runs a little higher, since its would-be deaths are rescues).
- **Old School deaths across the reference population on the ranger's presets: under 0.3%**, and on every sensible plan at most 0.5% per trip (the cap in the table, a hard gate).
- **Every death is fair** (an invariant checked on every simulated death, and one violation fails the night): it followed a ♦ the player confirmed whose shown fatal share in that context was above 0, or a chain's last step after at least two logged warnings whose danger tag matches the cause of death (8.10); at least one warning came before it; if the deciding card was a Director draw, its foreshadow flag was set at an earlier stop (9.5); and the screen offered a choice shown as `sure`.
- **Sure choices never kill:** 0 deaths whose deciding choice (the one the cause trace ends on) was shown as `sure`, in any number of runs.
- **Fatal shares are honest:** exact by construction on a single roll and unit-tested (E.9), then rounded up, never down (8.1); a blurred ♦'s shown worst case is never below the true share, comparing unrounded values (a unit test, like knowledge ranges); look-ahead fatal shares are expected values, never falsely zero, and are tested for mean bias like the rest of the bar (8.9).
- Real decisions per moving day: **3 to 5** (median 4).
- **♦ choices on sensible plans: at most about 1 per moving day** (median).
- **The interesting zone, per plan type.** On sensible plans, at least one optional choice a day (a shortcut, a snowfield, a sunset scramble) shows 60-90% made-it, so careful players still meet real odds. On ambitious and under-equipped plans, at least 35% of rolled choices show 60-90%.
- Trips that show at least one % choice: at least 90%.
- **Knowledge ranges:** the true p lies inside the shown range 100% of the time (a unit test).
- **Odds calibration,** nightly only. The shown % on a single roll is exact by construction and unit-tested (E.9). What needs statistical calibration is what the game *estimates*: the middle of knowledge ranges, Words bands, forecast rain chances and look-ahead bars. The test is a two-sided binomial test per bucket at p < 0.001 after a Bonferroni correction across buckets; a plain |error| < 3 points applies only to buckets with at least 10,000 samples. Look-ahead is tested for mean bias across many states, not bar by bar.
- **Larry moments don't move the caps:** on every sensible plan, a Joy-seeker who starts every Larry tile it has packed for (the skinny dip, every can of beer, the pre-roll) and takes every Larry card the Director deals (the bold marmot, the permit check, the thin tent wall) still meets the sensible-plan caps above. The skinny dip's only fatal path is the Cold chain's, after two warnings (2.6, 9.5), and a citation is never worse than Trouble.
- **Bonfire Lily, rare by design:** for a player who stays out for the whole sunset with the headlamp off, 4-8% of sensible trips with one eligible evening and 10-16% with a high layover, in each zone and month where it's possible; no plan above 25% (10.2).
- **Where outcomes come from:** about 70% planning, 20% trail choices, 10% luck (±10 each), measured with Sobol indices (first-order and total) over plan, choice policy and seed, since the three interact.
- **Variety:** the measures in 8.12.

### F.2 The harness

- `tools/sim.mjs` runs the **real engine** headless with bots. A trip is about 0.2-0.5 ms of computation, so 100,000 trips take under a minute on 8 workers.
- **Bots only see what a player sees:** the shown %, the words, the ETAs and the look-ahead bars. If a sensible bot using shown information can't hit the targets, the information is insufficient, and that's a UI bug.
  - Cautious (safest option; turns back below 75% made-it; never takes a fatal share), Steady (best expected ending one step ahead, counting GAME OVER as the worst ending), Bold (fastest unless below 50% made-it; ignores fatal shares; never looks for or asks for help at camp, and toughs out every night ♦; F.1's "keeps pushing" rows mean this bot), Reckless (Bold without the 50% line: goes on at every ♦, which is exactly the look-ahead's and the Trip Outlook's *keep pushing* policy, 8.9; the two differ only where a ♦ falls below 50%, as in A.7), Random, Joy-seeker (every sunset, side trip and Larry moment, 2.6), Oracle (sees the rolls; an upper bound).
- **The plan library:** all 150 classic trips (plus variants: ±1 night, an added layover, a reversed loop) x months x loadouts (sensible, ultralight-smart, overpacked, day-hike gear, cotton-and-hope, glacier kit, photographer) x start times. On the High Divide every loop runs both ways round and both over the top (the basin and the crest, B.1), and every plan also runs with the fork's other answer taken on the trail. **The trap plans live here only,** never in the ranger's list (4.5): the High Divide loop in a day on day gear (the first playable's trap), Glacier Meadows in 1 night on day gear, the literal summit on day gear, Enchanted Valley in a day. So do the solo summit plans, equipped and not, since the ranger's Olympus presets all include Ranger Jon.
- **Stratified runs.** The full library is roughly 63,000 plans, too many to run deeply every night. Rare-event targets (deaths, rescues) run on about 20 representative plan classes at 50,000 runs each, with importance sampling where a rate is under 1%. Everything else runs 1,000 to 2,000 times per plan. The nightly job stops at 60 minutes.
- **"The pack matters"** (ablations): remove each tag from the sensible kit, one at a time, and measure a vector: the ending distribution, score, spirits and Leave No Trace. Each has its own threshold (for example total variation ≥ 0.05 for endings, 3 points of score), a minimum of 2,000 runs per cell and a significance test. Every tag must move something somewhere, or it's decoration. Joy items (paperback, camera, binoculars, ID books, camp chair) pass on spirits and on score through Looks (6.7). No single non-required tag may drop the happy rate by more than 40 points everywhere, or the game is a checklist.
- **"The choice matters":** every pair of choices on a card must differ in outcome distribution or effect kind somewhere, unless the card marks a deliberate lesson (grabbing food from the bear).
- **Assertions from research:** each `what_goes_wrong_for_underprepared_hikers` line becomes a regression test, using the canonical trap kit (6.8) wherever it says day gear. A line tagged `real_incident` (one that cites a real death, such as the cross-country shortcuts toward Boulder Lake) may assert only non-fatal outcomes: the ranger card, the Leave No Trace cost, a rescue (9.5). Examples: *day-hike gear, one night at Glacier Meadows in September: trouble or worse ≥ 80%, rescue between 15% and 35%, death between 4% and 10% for the Bold bot and at most 0.1% for the Cautious bot*; *an under-shopped layover plan produces at least one rationing decision* (5.6); *Ranger Jon's Olympus preset passes the validator and summits in 55-75% of equipped runs*; *an equipped solo summit that goes on at every crossing ends at most 3% of trips in death*.
- **Failure reports** name the cards and modifiers that most often appear in bad outcomes ("the ladder produced 41% of Serious outcomes in Hoh / September / sensible"), pointing straight at the knob.

### F.3 The linter (about 45 rules)

Errors block the deploy.
- **References:** no duplicate or unknown ids anywhere.
- **Park graph:** endpoints exist after the merge; every trailhead reaches a camp and every camp is reachable; elevation sanity; every place has a picture recipe; every preset routes and ends at a trailhead (or at its start, for a loop).
- **Cards:** schema-valid; expressions type-check; every card can fire somewhere (reachability); no dead ends (a visible, enabled choice in every context); fuzzed odds stay in range; loops and chains terminate; route effects target reachable places; read flags are set somewhere.
- **Fair deaths (Old School):** a `hiker_dies` outcome appears only in a ♦ choice's fail table or at the last step of a chain with at least two warning steps, tagged with the same danger, before it; every one carries a `modes.gentle` override; every context in which a choice shows a fatal share above 0 also offers a choice that is `sure` for life; no `hiker_dies` is reachable from a sure choice, a told routine check, a delayed payoff, an epilogue or any card tagged wildlife. **A Director draw can never kill by itself:** a card the Director can draw may hold a fatal-capable ♦ only if it names the foreshadow flag its danger needs (set by the forecast, a ranger's line, or a night card such as *the river talks louder*), some stop sets that flag, and the card offers a sure choice. No `hiker_dies` in any card placed at a site, or built from a hazard, tagged `real_incident` (9.5). Every death box has a Ranger's Note with a prevention and names no real incident.
- **The death sequence (Old School):** every `hiker_dies` names a `cause` key that exists in `content/death/causes.json` (E.5), and no cause key is tagged wildlife. Every key has a *YOU PERISHED* line for every variant it can reach (second person, starting *You have died of*, at most 40 characters), and a list of the quote tags its epitaph dice prefer. No cause line names a real incident, a real person, an animal or a place tagged `real_incident`. No screen of the death sequence, and none of its audio cues (13.2), is reachable in the hidden gentle mode. The review site prints every key's lines and the first lines its dice would deal, for your review (14.4).
- **The epitaph dice (9.5):** every drawable line in `content/lore/quotes.json` comes from `lore/quotes_public_domain.json` with `verification: page_image_checked`, a public-domain reason, a source id and a URL, and its text matches the source record exactly; it is at most 40 characters as printed; its source is not a Robert L. Wood work (checked against the work ids in `lore/wood_bibliography.json`) and not the unverified secondary pool; no drawable line mentions a death, an injury or a named person; a line with a `caution` is dealt only for the causes it names; and every cause key can deal at least 8 distinct lines, its own tags first, then the general pool.
- **One death rule, one hiker, the people (9.4, 9.8, 12.4):** with `flags.gentle` off, a UI test walks every v1 screen and fails on any mention of the gentle mode under either name, or of a second guest book, and a unit test checks that no gentle trip can write to the Trail Register or Best trips. The guest book asks for a name and nothing else. A wipe test kills a hiker, taps the GAME OVER card's button, and checks that storage holds nothing of them but their register entry, and that the cabin shows none of their career marks. A Hike of the Day death leaves the Open hiker's save untouched (decision 25). Every permit number matches `104-` and four digits, and Ranger Jon's badge reads 104 wherever it appears. A release build fails if a placeholder (`{BOY_n}`, `{BOY_n_QUIRK}`, `{BOYZ_CONSENT}`, `{JON_QUIRK}`, `{MORGENROTH_STORY_n}`) is left in shipped text; preview builds show them, so you can see where your words will go. Lake Morgenroth never appears in a preset, a fill, a first trip or the camp list, no ranger line names it, and only a request made on the WIC phone line can put it on a permit (4.3); the out-of-season *Phone the WIC* card never offers *Ask about a lake* (3.1). **T06, no phone links:** the built app shell carries the `format-detection` meta with `telephone=no`; no screen has a `tel:` link; and the WIC number reaches a screen only through the phone hotspot component, never as loose text in a box, a permit field or a Look line (E.7, 16).
- **Larry moments (2.6):** every card tagged `larry` offers a sure choice; none holds a `hiker_dies` of its own (the skinny dip reaches death only through the Cold chain's last step, linted like any chain); no Director budget allows more than one dealt Larry card a day or two a trip (tiles the player starts are not dealt, 2.6, and neither is the off-permit ranger's forced roll, 3.7); with `flags.larry` off, none can be dealt. **T05, never near a car:** no card, line or picture that offers, shows or mentions a drink or cannabis may appear on a drive screen, a trailhead screen, the car, the tailgate (whose list never holds beer or the pre-roll, and whose flat lay draws the can closed), an ending stamp, the trip report (*What the pack taught* included) or anywhere in the cabin scene, where the car is in frame; and no line may tie either to driving. The day-hike lunch shelf in Forks has no cooler and no door to Second Growth. *Crack the IPA* and *Light it* are reachable only on an overnight trip, at a camp where the hiker sleeps that night or on a layover day's side trip from it, never on a day hike or on a day that ends at the car; the swim and the bold marmot only on an overnight trip, never on a day hike or the walk-out day (2.6); St. Peter's Gate's card only when the hiker's permit puts that night at Lake of the Angels or the Stone Ponds. Every brand is fictional and passes T03. The locals' quiz: every question has a source and exactly one right answer, and every answer leads on.
- **The 104 Boyz' register lines (7.11):** each uses a name from `people/boyz.json`, follows the cause-line rules (at most 40 characters, *died of*), names no real incident or place where one happened, and carries a funny epitaph of at most 40 characters; none can be removed by an import.
- **Honest odds:** a choice without a roll can't show a %; every roll has labeled modifiers from shared sets where one exists; the ♦ and the fatal share are computed from fail tables and death rolls per context, never set by hand (8.1); no setting can hide a fatal share.
- **Coverage:** every event tag in at least 3 cards; every catalog item maps to an event tag; every segment hazard tag in at least 1 card (14.2).
- **Text (T02):** every box fits at 375 x 667 with three choices and at 393 x 852 with four, from measured font metrics; choice labels are 22 characters or fewer and fit at 375 pt. **T03:** no real private businesses or real people (every fictional name and brand is checked against a deny-list of real Peninsula businesses, breweries, shops, guide services and park staff; exceptions: Credits, the Ranger's Bookshelf, the credit under a dealt epitaph line, and the 104 Boyz' own names, 7.11). The deny-list includes Swain's, Brown's Outdoor and MOSS, the stores that inspire the three in town (5.2). No use of the name *Leisure Suit Larry* anywhere in the game (2.6). **T04: no *Golden Glow* text, names or phrases** outside Credits (10.1). **T07, no book frame:** no player-facing string uses the retired frame words (book, bookshelf, shelf of trips, chapter, page as a game noun, volume, back cover, picture-book, storybook, edition) or the old mode name; the exceptions are real things (the paperback, the Ranger's Bookshelf, the tide booklet's pages, *The Golden Glow*'s credit). **Approval (decision 21):** a release build ships only lines you have approved; drafts show only on preview. Also: no death words in the gentle mode's text (except "dead tree"); the voice you choose in 2.3, checked by the lint once chosen (until then, the recommended second person, present tense, with the exceptions by design: Look boxes, the first-person log, Ranger's Notes in plain second person, quoted dialogue, the *YOU PERISHED* lines, and epitaph lines, which are the player's own words or verbatim public-domain text and are checked only for length and exactness); no exclamation marks in a box; no line of dialogue spoken by an animal (2.3); readability grade 7 or below.
- **Economy:** every item is obtainable; every tag a card rewards is provided by some item; the sensible kit for every zone and month fits in some pack.
- **Storage names:** every storage key and cache name carries a channel prefix (E.9).

### F.4 Other tools

- **The card bench:** one command prints a card's odds, fail shares, text lengths and queued consequences under six loadouts and several river levels. Claude runs it on every new card first.
- **Golden worked examples:** every number in this document's worked examples (8.11, 12.11, Appendices A to D), every fatal share included, is generated by the card bench or a seeded run and checked as a golden test, so the document and the engine can't drift apart. One of them guards the tide: a wait on a rising tide never removes a fatal share while the true margin is below -1 ft (C.4).
- **Golden replays:** engine goldens on a frozen mini data build (any change is a regression); content goldens on the live build (expected to drift, reviewed as diffs).
- **Transcripts:** `tools/play.mjs` prints a whole trip as a transcript (stops, boxes, odds, rolls, margin effects, the log and the trip report). About 20 are read per batch, because voice and pacing can't be measured.
- **Auto-tuning suggestions** (on demand, not nightly): coordinate descent over declared tunable ranges toward the target bands, written as a patch for review, never applied silently. Order of tuning: physics against reality first (segment times against trip reports, night temperatures against normals, tides against NOAA), then event bases, then playtests for feel.

### F.5 Device checklist (every milestone)

Everything here is done on the phone itself. There is no Mac and no Web Inspector step (E.11): when something goes wrong, *Copy bug report* is the whole report.

- iPhone SE (375 x 667, 2x, the short-screen layout) and a Pro Max (3x); Safari tab and Home Screen app; Safari's Back button and edge swipe mid-trip.
- Main and preview installed side by side: updating one never touches the other's saves or offline cache.
- Install, airplane mode, a full trip offline.
- Background the app mid-trip (a phone call) and come back to the same stop.
- Low Power Mode: cycling and draw-in still pleasant.
- Outdoors in daylight at full and half brightness: the 16 colors stay distinct and the message box reads (11.1, 11.9).
- VoiceOver for one full day; the largest text setting.
- An update mid-trip: the mailbox flag appears only at the cabin; the save migrates.
- Export the device record, the hiker and the trip, wipe site data, import all three; then try to import an older export of the same trip, and see it refused (E.6).
- Rotate to landscape and back.
- Lose one Old School hiker on purpose and play the whole death sequence: the dirge with the silent switch on and off, the Leave No Trace dissolve watched through and tapped to skip, then again with iOS Reduce Motion on (a cross-fade), a typed epitaph on the SE's keyboard (and on the next death, the dice tapped a few times, credits and all). Then *Back to the cabin* (DRAFT): the cabin at dusk, the trip reports and route signs go to dust, the guest book asks for a new name, and the Trail Register has the new line. Import an export from before the death, and see it refused (E.6).
- Open the hidden debug menu (five taps on the version stamp), tap *Copy bug report*, and paste it into a GitHub issue from the phone; then force an error and copy the report from the error sheet (E.11).
- Look for the gentle mode, under either name, and for the retired book words everywhere, and find them nowhere (9.4, T07).
- The cabin: open the game at dawn, midday, dusk and night, in rain and in clear weather, and check the scene matches Lake Quinault's real clock (Pacific time) and the forecast; tap every place and every rail button with VoiceOver on (2.2, 11.11).
- Share the flat lay and a trip report from the share sheet, and press-and-hold-to-save the fallback image (6.10, 9.7).
- Show first launch to someone who has never heard of the Boyz: nothing should need explaining (2.2).
- First launch on a clean install: the locals' quiz, once; a wrong answer earns *"Nice try, tourist."* and lets you in. Lose a hiker and check it doesn't come back (2.6).
- From M1b, when the number and the call arrive (in M1a, check instead that no screen shows the number, 15): find the WIC number on the permit, the itinerary's fine print and the counter card. Tap it and long-press it in the Safari tab and in the Home Screen app, and check that iOS offers no Call, Copy or Add to Contacts action and that nothing dials; then make the in-game call (12.5, E.7, 16).
- Walk the loop both ways round and meet the fork at both ways into the basin (12.12).

---

## Sources for this document

- **Park data:** `design/data/regions/{coast, elwha_hurricane, hoh_olympus, northeast_dose, sol_duc_high_divide, south_quinault_skok}.json` (the loop's camps, miles, quotas, junctions and the WIC's number all come from `sol_duc_high_divide.json`), `design/data/park_rules.json`, `design/data/gear_catalog.json`, `design/data/food_catalog.json`. Mileages, camps, quotas, conditions, drive times and tide gates cited here come from these files. They were fact-checked in parallel (`design/data/FACT_CHECK.md`, 2026-10-08); this document was updated to match, and the data files win any remaining disagreement.
- **Proposals:** `design/proposals/storybook.md` (now historical: its book frame, narrator and title page are retired by decision 22), `design/proposals/simulation.md` (state, movement, weather, tides, body models, odds, consequences, worked examples A-C, balancing), `design/proposals/engine.md` (data model, card format, narration, combinatorics, runtime, stack, testing, authoring, milestones).
- **The new direction's drafts** (2026-10-08, decisions 21 to 35): `design/drafts/frame_home.md` (the frame, the cabin, the stores, the flat lay, the voice: written into this document), `design/drafts/daily_fkt.md` (the ways to play), `design/drafts/minigames.md` (the eight minigames) and `design/drafts/audio_text.md` (sound and the text system). The last three are still being written in.
- **Firsthand:** your own trips to Lake Morgenroth (camped once, visited several times), which make its approach a primitive but findable way trail in the data. Your GPS track and stories are still to come (4.3). The cabin is drawn from your written description of Ranger Jon's old cabin, never from the photos, which stay out of the repo (11.11).
- **Art-style inspiration:** *The Golden Glow* by Benjamin Flouw (Tundra Books, 2018), credited in the game's Credits (10.3). Nothing in this document or the game reproduces its text or illustrations.
- **Art reference:** `design/art/style_options.png` (option B chosen: Sierra pixels in the custom palette) and the script that draws it, `design/art/style_mockup.py` (11.1).
- **Tone inspiration:** Al Lowe's *Leisure Suit Larry in the Land of the Lounge Lizards* (Sierra On-Line, 1987), for the cheek, the censor bar and the trivia opener only (2.6). The game borrows no text, art, music or name from it. Your other touchstones (decision 22), each for one idea only: *Superbrothers: Sword & Sworcery EP* syncs its moon to the real one by the system clock ([Wikipedia](https://en.wikipedia.org/wiki/Superbrothers:_Sword_%26_Sworcery_EP)); *1000 Heroz* (RedLynx, 2011) added a level a day with 24-hour leaderboards ([Wikipedia](https://en.wikipedia.org/wiki/1000_Heroz)); *Suika Game* (Aladdin X, 2021) is the fruit-merging drop game ([Wikipedia](https://en.wikipedia.org/wiki/Suika_Game)); *Lonely Mountains: Downhill* plays no music on the ride (the sound draft has the sources).
- **The frame's real-world facts** (checked 2026-10-08):
  - Olympic wilderness permits are printed by the hiker: *"you will be able to log in to your account and print the permit yourself"* ([NPS, Wilderness Reservations](https://www.nps.gov/olym/planyourvisit/wilderness-reservations.htm)).
  - Quinault is *"about a three-hour drive from Port Angeles and one hour from Forks"* ([NPS, Visiting Quinault](https://www.nps.gov/olym/planyourvisit/visiting-quinault.htm)).
  - The CPSC's guidance keeps hot tub water at 104°F or below ([CPSC](https://www.cpsc.gov/content/cpsc-warns-of-hot-tub-temperatures)).
  - Swain's General Store opened in Port Angeles in 1957 and sells everything from home improvement to clothing, hunting and fishing ([Peninsula Daily News, 2014](https://peninsuladailynews.com/news/more-of-swains-port-angeles-store-expanding-into-space-left-by-neighbor)); Brown's Outdoor is a four-generation family outfitter that *Outside* named the town's best ([Peninsula Daily News, 2015](https://www.peninsuladailynews.com/?p=48639)); MOSS is a downtown boutique of Pacific Northwest clothes and goods ([Wanderlog](https://wanderlog.com/place/details/2251622)).
  - "Knolling" was named in 1987 in Frank Gehry's furniture shop ([Kinfolk](https://www.kinfolk.com/stories/word-knolling/)); base-weight marks are conventions, not standards ([REI](https://www.rei.com/learn/expert-advice/ultralight-backpacking-gear-essentials.html)); Instagram's portrait feed size is 1080 x 1350 per third-party guides ([Dimensions](https://dimensions.com/element/instagram-feed-images-portrait)); Safari can share files from iOS 15 ([Adactio](https://adactio.com/journal/15972)).
  - The NWS API asks every app for a User-Agent, and `/points` returns the forecast URLs ([weather.gov](https://www.weather.gov/documentation/services-web-api)).
  - Bigleaf maples turn yellow in autumn ([WSU Extension](https://extension.wsu.edu/maplesyrup/bigleafmaple/)).
  - Published WTA trip reports carry Type of Hike, Trail Conditions, Road, Bugs and Snow ([example](https://www.wta.org/go-hiking/trip-reports/trip_report-2024-06-21.151916120349), seen in search results; wta.org refused a direct fetch).
  - Not confirmed: LighterPack's exact CSV header row (6.10).
- **The Hamma Hamma** (Lake of the Angels, the Valley of Heaven, St. Peter's Gate): `design/data/regions/hamma_hamma.json`, new and not yet fact-checked. This document cites only St. Peter's Gate's and Lake of the Angels' elevations and mileages from it, and its rules on cannabis and alcohol (2.6, 4.1).
- **History:** the knowledge base in `design/data/lore/`, still being written. Planned: `history.json` (facts, much of them after Robert L. Wood's books, retold in our own words and credited), `quotes_public_domain.json` (verbatim lines from public-domain texts: the Press Expedition's report of 1890 as reprinted in 1890 newspapers and *The Mountaineer* of 1907, Lt. Joseph P. O'Neil's report, Senate Doc. 59, 1896, and other pre-1931 accounts) and `LORE.md`. Written so far, as working drafts: `press_expedition.json`, `oneil_expeditions.json`, `other_history.json` and `wood_bibliography.json`. Wood's books are in copyright, so no sentence of his appears in this document or the game; the epitaph examples here are public-domain lines from those working files (9.5, 12.20).

---

## Decisions made

Every decision here is yours, made one at a time in conversation on 2026-10-08. They override anything older in this document or the proposals. Your own words are in quotes where you gave them. Decisions 21 to 35 came later the same day and set the new direction; where they change an earlier decision, the earlier one says so. (Decision 22 retired the book frame, so the summaries of 1 to 20 now use the game's own words, trip, stop and trip report; your quotes are unchanged.)

- **The pitch:** *Oregon Trail* meets *King's Quest*, with a dash of *Leisure Suit Larry*, in the real Olympics. *"your line about plays like nails it"* (1); the dash of Larry is yours too (18). Broadened by 22 into a blend of its own.
- **The homage, trimmed:** *"it feels like maybe you're overdoing the golden glow stuff"*, then *"Yes do all of that"*, and *"If anything it was the art style of the book I just love. Reminds me of Sierra also."* *The Golden Glow* survives only as the art style, the Bonfire Lily (a rare hidden find: sketch it or pick it, scored by Leave No Trace) and a credit line. No field guide, prologue, fox, helper animals or narrator for children; a deadpan Sierra voice for adults (no narrator character since 22); the hiker's terse log, now the record that becomes the trip report (2.3, 10).
- **The plant's name:** the Bonfire Lily (10.2).
- **Art:** option B. *"I love B I love chunky pixels."* Sierra technique in a custom 16-color palette inspired by *The Golden Glow*'s flat, layered shapes; gold kept for the lily (11.1).
- **1. Death:** *"For 1 I think it should actually be hard like if you die its game over old school."* Old School is the rule of Open play (23 to 25 add the Hike of the Day, where a death is a DNF). A death plays the sequence you described, *"the end screen should say you perished and then a little thing how like Oregon trail style and then it says leave no trace as your skeleton turns to dust"*, which you approved in five screens (*"Sounds good"*): the death box, YOU PERISHED, Leave No Trace, the epitaph, GAME OVER (9.5, 12.17). Your Olympus example ends in death about 1 trip in 15 for a hiker who keeps pushing, and never for one who turns back (A.6).
- **2. After a death:** *"Full wipe."* Only the Trail Register survives (9.8). It now plays at the cabin, at dusk (2.2).
- **3. The easy mode:** *"C but don't release that shelf yet hide it."* The no-death mode stays in the engine with its own hikers, hidden behind a flag in v1. Its old name, Storybook, is retired with the book (22); the internal key is `gentle` (9.4).
- **4. The epitaph:** *"Write your own or tap random."* Up to 40 characters, or dice that deal public-domain lines from the early accounts of the park's first explorers, or skip. You asked for *"random Robert Wood sentence"*: Wood is the history's backbone, credited in Credits and on the Ranger's Bookshelf, but not quoted, because his books are in copyright (9.5, 12.20).
- **5. Death tone:** deadpan Sierra, dry but kind (2.3, 9.5).
- **6. The hiker:** *"less is more."* A name, and every hiker starts the same (12.4). The name is signed in the cabin's guest book.
- **7. The 104 Boyz:** cameos only. You hike solo; they are hikers you meet (a tip, a trade, a warning) and pre-filled entries in the Trail Register. No companions in v1 (7.11). Their register entries are fictional misadventure deaths with funny epitaphs (19). Since 34 they are easter eggs a stranger never needs (2.2).
- **8. Odds:** *"A for sure."* A % on every risky choice, and the ♦ with its fatal share on deadly ones (8.1, 8.7).
- **9. Animals:** they never talk (2.3, 7.11).
- **10. Mount Olympus:** hire Ranger Jon, badge #104, the only guide, or go alone at your own risk, with honest fatal shares and turning back always offered (4.2).
- **11. First playable:** *"Gotta be B only because I know that hike."* Seven Lakes Basin and the High Divide (4.3, 15, Appendix B). Sharpened by 17.
- **12. Read to me:** cut. VoiceOver reads the real text (11.9, 13.1).
- **13. Session length:** confirmed. About 20 to 30 minutes for a two-night trip (1.1).
- **14. The 104 wink:** every permit number starts with 104, and Ranger Jon wears badge #104 (12.6).
- **15. Park conditions:** confirmed. The real 2026 conditions by default, applied only on their dates, with Timeless one tap away (4.7).
- **16. Bug reports:** *"A, no Mac."* Copy bug report in a hidden debug menu, and no Web Inspector anywhere in the plan (E.11, F.5).
- **Hosting:** the repo `FernForager/104-boyz` is public, and GitHub Pages deploys it from GitHub Actions to `fernforager.github.io/104-boyz` (E.9).
- **17. The first playable is the loop, and Morgenroth is off the menu:** *"Morgenroth shouldn't be the trip it's an off menu gotta call. The first one should just be High Divide and the 7 Lakes Basin loop either direction and option if drop into basin or stay high I mean every choice needs to be made ya know."* The vertical slice is the whole High Divide and Seven Lakes Basin loop from the Sol Duc trailhead, clockwise or counterclockwise, as a day or one to three nights or more, at any permitted camp on or just off it, with layovers. Every route choice is the player's, at the map table and on the trail: the way round, each night, the basin or the crest at a fork card with honest numbers, the side trips, and changing the plan with real permit consequences (3.1, 3.6, 3.7, 4.3, 12.12, 15, Appendix B). Lake Morgenroth is in no list, preset or fill; the only way to camp there is the hidden phone call to the WIC (360-565-3100). It stays the hand-drawn signature scene and your favorite spot, by a primitive but findable way trail, in M1b. Lake #8 stays unplannable (4.3, 12.5, B.7).
- **18. Larry moments, PG-13, with beer and weed in:** *"I want it to have some leisure suit Larry in it too. like swimming naked in heart lake. Drinking a hazy ipa at morgrnroth. Smoking a doobie at st peters gate."* Asked how spicy: *"Pg 13 but beer and weed."* And on the Gate: *"St. Peter's gate connects the ridge above lake of the angles with whatever is on the other side stone ponds I think"*. A dash of *Leisure Suit Larry* in the pitch: cheeky innuendo and a pixel censor bar, nothing explicit, in the deadpan voice. Skinny dipping in Heart Lake (with an honest Old School path to *You have died of skinny dipping.* after two warnings), a hazy IPA at Lake Morgenroth, a doobie (Second Growth's pre-roll) at St. Peter's Gate (illegal on federal land: a ranger's honest odds and a citation, never a death), a locals' quiz at first launch (now the cabin's key lockbox), and four more on the loop. Overnight only, never on a day hike, the walk-out day or anywhere near a car (lint T05). `flags.larry` is on in every v1 build (1, 1.2, 2.6, 4.1).
- **19. The Boyz in the Trail Register:** for decision 7 you answered *"A"*, the option where the Boyz are hikers you bump into on the trail, and *"their names are already in the trailhead register when you first open it, with epitaphs about their own (fictional) misadventures."* So the register comes pre-filled with one *Remembered* entry per Boy: a fictional misadventure death and a funny epitaph, good-natured and never mean, while you keep meeting the same Boyz alive on the trail, and the game never explains it. Their real names are still to come; the public game uses first names or nicknames unless you confirm full names (7.11, 9.8, 12.3).
- **20. Ranger Jon is one of the Boyz:** you confirmed it (2026-10-08). Jon plays himself as Ranger Jon, by first name only, like the other Boyz in this public repo; he sees his lines and agrees before release, like the rest (7.11, 12.20).
- **21. Every line of original English is yours:** *"I also want to personally decide on every single bit of English text that appears in the game that is original... including UI menus everything."* All strings live in one text system with ids; each is a draft until you approve it; release builds ship approved text only. Not ours: real place names and verbatim public-domain quotes (still vetoable). Every example in this document is a draft (the note at the top, F.3). The text system's design is being written in.
- **22. No book framing, no crutches:** *"I feel like leaning hard into the book theme isn't a great direction. I want this game to be great on its own merits. Like swords and sworcery... It's 1000 heroz it's suica game it's kings quest it's Oregon trail but it's also entirely its own blend."* The bookshelf, books, chapters, pages, volumes, back cover, "picture-book", the storybook narrator and the "Storybook" mode name are gone. The art, engine, permadeath, odds, park, Larry moments and Trail Register stay (1, 2.2, 2.3, 9, 12, Lead call 11). Session 1's title-page text waits for your approval under the new frame.
- **23. Ways to play:** an open mode to plan any hike, and a **Hike of the Day**: the same route for everyone each day, with a time leaderboard. Each big route can also have an **FKT** (*"I love trail running and FKT culture. Each big route in the game could also have a fkt"*) (1, 9.4; rules being written in).
- **24. The Hike of the Day is one shot:** *"One shot I love it."* One attempt per day; the score is the time, alive (a death is a DNF) (9.3).
- **25. A daily death never touches the Open hiker:** you chose "A": each Hike of the Day uses a fresh hiker with standard skills; a death is a DNF on today's board and resets the daily streak; the Open hiker and career are untouched (9.3, 9.4).
- **26. The frame is backpacking's own stuff, for both crowds:** *"I think a but for hardcore and the moss crowd you know both. Swains hikers and browns hikers. So like, you know how people will take a picture of all their stuff laid out before a trip to post on instagram? That's the best. I want that ethos."* The permit, the map, the pack, splits on the trail, a trip report at the end; the signature screen is the gear flat lay, and it is shareable. Real stores inspire the vibe; in-game businesses keep fictional names (3, 6.1, 6.10, 9.7).
- **27. Three stores in Port Angeles:** *"Three stores, ones closely based on swains browns and moss."* A general store in the spirit of Swain's, a gear shop in the spirit of Brown's Outdoor and a boutique in the spirit of MOSS. In-game names are fictional and yours to write, unless a store gives permission to use its real name. Where you shop shows in your flat lay (5.2, 5.7, 6.1).
- **What 104 means:** *"104 is a reference to hot tub temperature. After a long day of hiking or razor clamming or work Ranger Jon would always go home to his hot tub. On bro trips the hot tub is key. So 104 is a nod to sitting around after ONP adventures and telling stories in the hot tub."* (104 W 1st Street, MOSS's address, is a coincidence.)
- **28. The hot tub as home base:** you chose *"A yes let's do it"*. **Revised by 34:** the tub is a reward after a big hike, not the home or the frame (2.2).
- **29. A few pitch-perfect minigames:** *"Good games like the one we're making have addictive and pitch perfectly dialed in mini games here and there."* A handful only, each tied to a real ONP activity, quick, one-thumb, polished, with real stakes in the trip (being written in).
- **30. The minigame list:** *"I'll take your advice here I like all of it."* Eight: packing the bear can (Suika-style, the signature), razor clamming, huckleberry picking, the alpenglow shot, the technical descent, ice-axe self-arrest (can kill), the cold creek ford, and pitching a tent in the rain. The Seven Lakes first playable gets the bear can, the alpenglow shot and huckleberries (being written in; their places: 6.1, 12.9, 12.14).
- **31. The Hike of the Day uses today's real forecast:** *"a"*: each morning a scheduled build bakes the National Weather Service forecast for that day's route into the daily; winter weather pushes the daily to the coast and low trails. The same build bakes the cabin's weather (2.2).
- **32. Sound like *Lonely Mountains: Downhill*:** *"I like how lonely mountains downhill did music honestly."* No music on the trail: the place and your own sounds carry it. Music only at home at the cabin and at a few key moments (13, being written in).
- **33. Sound sources, no homework:** *"I won't have time to record anything anytime soon."* Claude handles all sound: public-domain (CC0) field recordings and synthesis, each source logged with its license. Your own recordings stay welcome but are never needed (13).
- **34. Near-universal, and home is a ranger cabin (revises 28):** *"The hot tub emphasis may be too much. I am making this game for the 104 boyz but I want it to also be near universal if that makes sense. Hot tub is a reward after a big hike. In any case the home should be modeled after ranger jons old ranger cabin when he was stationed at lake quinault."* The Boyz and 104 are easter eggs that reward insiders and are never needed; the tub is a reward after a big hike; home is the old ranger cabin at Lake Quinault, drawn from your reference photos' description, which stay out of the public repo unless you say otherwise (2.2, 11.11).
- **35. The name:** *"Olympic Peninsula Hiker. OP Hiker when needed like on phone screen under the app etc."* Full name *Olympic Peninsula Hiker*; short name *OP Hiker*, the Home Screen label and anywhere space is tight. This also approves those two strings (21).

Everything else in this document is a call you can overrule (1.2), but none of it needs an answer to start building.

## Lead calls

These are not your decisions. They are engineering calls the lead designer (Claude) made on 2026-10-08 to close the pre-build audit (`design/AUDIT_DOC.md`, whose Resolution lists every item), and later the same day to carry the new direction through the document (11 to 15). None changes a decision above, and each is yours to overrule.

1. **M1a's camps:** the *ask at the desk* request (a seeded roll, about 70% midweek and 40% on weekends) is in M1a, for Bruce's Roost, Cat Basin and Hidden Lake; Long Lake and Sol Duc Lake (off trail) and the call for Morgenroth stay in M1b (4.3, 15).
2. **Day hikes:** no permit; the score maximum is set at *Start walking*; a day-use trip-plan line at the trailhead drives the overdue clock; the register says *day hike*; day hikes never move the 104 counter (3.7, 9.6, 12.10).
3. **What M1a shows:** a list in 15. The WIC's number and its hotspot wait for M1b, the month chips are August and September only, and every `hiker_dies` carries its gentle-mode override from M1a, though the flag ships off.
4. **No canister is allowed:** an overnight without one is a broken rule, not a fourth hard block: a visitor roll every night, a ranger card if one checks, and Leave No Trace costs (6.3).
5. **The off-permit ranger** is a forced, uncapped roll that plays the permit-check card; the Director's cap on Larry cards covers only the check on a legal night (2.6, 3.7).
6. **Night rolls** take their chance straight from the cold curve, so they skip the shaky band, read with a Words row below 30% and spin a two-band compass (8.7, 8.8).
7. **Scoring:** the budgets live in `rules/tuning.json`, with one fill's maximum worked out (96); layover nights earn no camp points; a citation and the Hard Way halve the finish once, not twice; a replan never sets the maximum below the score; the Leave No Trace ledger stops at 100 (9.6).
8. **Seeds:** the trip seed is drawn when a plan is first saved and keys planning's draws too (`hash(seed, date, camp)` for quotas); *Hike it again* copies the printed permit (8.14, 9.7, E.8).
9. **The smaller calls**, each the auditor's fix or the most cautious default: skills run 0 to 5; a day hike's turnaround points the shortest way to the car; the basin fork fires only on the way in; the swim and the bold marmot are overnight-only, the broadest reading of decision 18; one canonical tag list; pack presets are B.5's two kits; the conditions date is the conditions overlay's; the lily's layover bonus needs a second evening in the same place (2.6, 3.7, 4.7, 6.5, 7.4, 7.10, 10.2, 15).
10. **The night model follows the catalog:** shelter and wet-clothing warmth come from each item's stats in `gear_catalog.json`, and the worked nights were recomputed, so Appendix A's bagless night now shows 6.3% fatal, not 6.1% (7.9, A.3).
11. **The words that replace the book** (decision 22). A book is a **trip**; a page on the trail is a **stop**, and anywhere else a **screen**; chapters are **phases** (plan, town, flat lay, drive, the days, home); the back cover is the **trip report**; the memorial page is the **GAME OVER card**, with a black register mark (▌) for the old ribbon; the shelf of finished books is the hiker's **trip reports**, by the fire bowl; the endpaper map is the **park map** on the cabin's table; the colophon is **Credits**; the Journal tab is the **Log**; *Turn the page* is *Walk on* or *Next*; *Try this trip again* is *Hike it again*; *The End* is **Finished**; Page density is **Trail stops**; the Book font is the **Plain** font; the review book is the **review site**; "edition" is a **build**, and the edition date the **conditions date**. In code: `book_ends` becomes `hiker_dies` (clearer than "trip ends", since a turnaround ends a trip too), `storybook` becomes `gentle` (`flags.gentle`, `modes.gentle`), `narrator.js` becomes `voice.js`, `phases/shelf` and Session 1's `ui/shelf.js` become `phases/home` and `ui/home.js`, and the save keys follow (E.6). Every in-game word in that list is a draft for you (decision 21).
12. **Planning moves home** (decision 26): you plan at the cabin's map table and print the permit, as real Olympic hikers do; the WIC is an optional town stop for the briefing, the loaner can and the desk-only camps, and a plan with a desk request is issued there (3.1). The old ranger's favorite trips and checklist stay as things he left at the cabin.
13. **The cabin's live scene** runs on Lake Quinault's real clock, season, NWS weather and moon, computed for the lake's center, never a building; the homecoming shows the trip's own time first (2.2).
14. **Appendix D and the examples** were rewritten in the recommended voice, as drafts, so the recommendation can be judged; the older third-person examples left elsewhere are drafts of the same moments (2.3).
15. **A new lint, T07,** fails any player-facing string that uses the retired book words, with exceptions for real things (F.3).

## Still to come from you

- **The 104 Boyz' names and quirks.** First names or nicknames, since the repo is public, unless you tell us the friends are fine with full names. Their register entries are yours to write too, if you like, and so are their tub lines and guest-book signatures (`{BOY_n_TUB}`, `{BOY_n_GUESTBOOK}`, 2.2). Each Boy sees his entry and agrees before it ships; until all of them have, the line in Credits is `{BOYZ_CONSENT}` (12.20). Until then, `{BOY_1}`, `{BOY_1_QUIRK}` and so on, with placeholder entries (7.11).
- **Ranger Jon's quirk.** Jon is one of the Boyz (decision 20), so his quirk can come with theirs, and his OK with theirs. Until then, `{JON_QUIRK}` (4.2).
- **Your Lake Morgenroth GPS track (GPX) and stories.** The track replaces the way trail's straight-line estimates; the stories, and any photos, shape the hand-drawn scene. Until then, `{MORGENROTH_STORY_n}` (4.3, B.7). The data already cites your Strava activity *"Hike to camp at Morgenroth Lake"* (`strava.com/activities/5761886000`, on the Long Lake to Morgenroth segment of `sol_duc_high_divide.json`). If that's the track, export its GPX, and tell us whether the link may stay in the public repo, and whether you're comfortable publishing the route at all: the repo only ever holds a simplified line, never the raw track (16, E.5).
- **Optional: your own locals' quiz questions.** The lockbox deals three from a pool of about twelve (2.6); a question only you and your friends would get right is welcome, as long as it has a true answer.
- **Optional: Robert Wood.** Whether to ask The Mountaineers Books for written permission to quote his sentences. Until then he is credited, never quoted (9.5).

**From the new frame** (decisions 22, 26, 27 and 34; the full reasoning is in `design/drafts/frame_home.md`). Each has a recommendation already in this document, so building can start:

1. **The replacement words** (Lead call 11): approve them, or mark the ones you'd change.
2. **Home on the real clock:** the cabin shows Lake Quinault's real season, light, weather and moon, except at the homecoming (2.2); or the game's own calendar?
3. **What "big" means for the tub:** at least 8 trail hours walked, an Olympus summit or a finished FKT (2.2); or a different bar?
4. **Who speaks:** A (you, now) for the moment and B (the log) for the record, with the Boyz heard only in their cameos and the tub (2.3); or A, B or C alone?
5. **Planning at the cabin:** you print your own permit and the WIC is an optional town stop (3.1); or keep the WIC visit mandatory?
6. **Where the epitaph is signed:** at the trailhead's register box, as approved, or at the cabin's register post (2.2, 12.17)?
7. **The three stores' names** (`{STORE_GENERAL}`, `{STORE_GEAR}`, `{STORE_BOUTIQUE}`). Should *Fernwood Mercantile* live on as the general store, and *Second Growth* stay next door (5.2)?
8. **Money:** Open trips with no budget, and a Hike of the Day with no shopping (5.2); or a wallet?
9. **A smaller starting shed:** the ranger's sensible kit plus the traps, so the flat lay shows where you shop (5.1)?
10. **Worn items** counted apart from the pack's weight and liters (6.1)?
11. **The share images** carry the hiker's name and the game's address by default (6.10, 9.7)?
12. **The locals' quiz becomes the cabin's key lockbox** (2.6, 12.3)?
13. **The end of each night:** one closing line in the new voice, or the river's own sound (2.3)?
14. **The hidden mode's internal name:** `gentle`, with a public name only if you ever ship it (9.4)?
15. **When the crew is around:** summer Friday and Saturday evenings, the evening of a big homecoming, and dates you choose, `{BOYZ_DATES}` (2.2)?
16. **The Bonfire Lily's gold sketch** in the cabin's gable window after a find (2.2)?
17. **Drinks:** none anywhere in the cabin scene, since the car is in frame; in the soak, a can on the tub's edge, or nothing (2.2)?
18. **Jon at the cabin:** always absent (his hat, badge #104 and initials), or sometimes with the crew (2.2)?
19. **The cabin's reference photos** stay out of the public repo (decision 34 says unless you say otherwise): confirm, or tell us what may be committed (11.11).
20. **Every line of English** (decision 21): the batches come to you screen by screen as the text system lands. Session 1's 13 live lines, including the retired book lines, are the first.

A release build won't ship with any of these placeholders left in, or with any line you haven't approved; preview builds show them, so you can see where your words will go (F.3).
