# Olympic Peninsula Hiker

*Master game design document. Working title. Status: design (no game code yet). Written 2026-10-08 for `fernforager/104-boyz`; final revision after a design review and the data fact-check.*

*This document merges the park research in `design/data/` with three proposals: `proposals/storybook.md` (feel, voice, art, screens), `proposals/simulation.md` (state, odds, consequences) and `proposals/engine.md` (data, engine, tools). Where they disagreed, this document makes one call (section 1.2). Where this document and a proposal differ, this document wins; the proposals stay as detailed reference.*

> **Read this first (about 10 minutes on a phone):**
> 1. [The one-page pitch](#1-one-page-pitch)
> 2. [Decisions needed from you](#decisions-needed-from-you): the last section, a short list, each with a recommended default
> 3. [The first book](#36-the-first-book): what a new player meets
> 4. Your own example, how it ends: [A.5 to A.7](#a5-the-ending) (Olympus in one night with day gear)
>
> **With 20 more minutes:** [player experience](#2-player-experience-and-tone), [the core loop](#3-core-loop) and [all of Appendix A](#appendix-a-olympus-in-one-night-with-day-gear). Everything else is reference; the engineering detail lives in Appendices E and F.

---

## Contents

1. [One-page pitch](#1-one-page-pitch)
2. [Player experience and tone](#2-player-experience-and-tone)
3. [Core loop](#3-core-loop)
4. [The park in the game](#4-the-park-in-the-game)
5. [Store and food](#5-store-and-food)
6. [Packing](#6-packing)
7. [Simulation](#7-simulation)
8. [Decisions and odds](#8-decisions-and-odds)
9. [Consequences, modes and scoring](#9-consequences-modes-and-scoring)
10. [The Golden Glow homage](#10-the-golden-glow-homage)
11. [Art direction and the scene system](#11-art-direction-and-the-scene-system)
12. [iPhone screens](#12-iphone-screens)
13. [Audio](#13-audio)
14. [Content plan and volume targets](#14-content-plan-and-volume-targets)
15. [Build roadmap](#15-build-roadmap)
16. [Risks](#16-risks)
- [Appendix A: Olympus in one night with day gear](#appendix-a-olympus-in-one-night-with-day-gear)
- [Appendix B: Seven Lakes and the High Divide, planned well](#appendix-b-seven-lakes-and-the-high-divide-planned-well)
- [Appendix C: The coast tide mistake](#appendix-c-the-coast-tide-mistake)
- [Appendix D: Sample storybook pages](#appendix-d-sample-storybook-pages)
- [Appendix E: Tech architecture and data files](#appendix-e-tech-architecture-and-data-files)
- [Appendix F: Balancing and testing](#appendix-f-balancing-and-testing)
- [Sources for this document](#sources-for-this-document)
- [Decisions needed from you](#decisions-needed-from-you)

---

## 1. One-page pitch

**Olympic Peninsula Hiker is a picture book you hike through.** You plan a real backpacking trip in Olympic National Park, buy the food, pack the pack and drive to the trailhead. Then the trip plays out as an illustrated storybook in the style of the early Sierra *King's Quest* games, and what you packed decides how the story goes.

**How it looks.** Sixteen EGA colors. Chunky 160x168 pictures drawn the AGI way, as vector lines and flood fills, with dithered skies. The narration sits in a white Sierra message box with a double dark-red border, under a `Score: 0 of 131` status line. You never walk a character around: every screen is a page.

**How it feels.** A gentle homage to Benjamin Flouw's *The Golden Glow*. An old field guide has one entry with no picture: a small golden flower that grows only high in the snow. A warm narrator reads your trip aloud. Bears, elk and marmots help in their own way. High up, after the sunset, you may find it. You choose to sketch it, pick it, or just look.

**How you play.**
- **Plan** at the ranger desk: where to go, day hike or how many nights, a layover day or a new camp each night. Get the permit stamped.
- **Shop** for food with a shopping list that checks itself off and a gauge that shows what will fit in the bear canister.
- **Pack**: choose what goes inside, what straps outside and what stays home. Everything must fit: liters, pounds, a few outside straps, and a required bear canister that limits your food days.
- **Drive** to the trailhead and take a last look at what to leave in the car.
- **Hike** by turning pages. About 3 to 5 real decisions a day. Camp, cook, watch the light change, sleep, wake up.

**Decisions with honest odds.** Every risky choice shows the chance it goes all right: `Wade across now  83%`. Tap the small (i) beside it to see why: the river's depth at this hour, the poles you packed (+10), the tent strapped outside (-3). Choices that could turn serious get a red diamond, the chance it goes badly in red (`Climb the ladder ♦ 79% · 21% fall`), a confirming tap and a short compass roll. If you lack knowledge (no tide table, no forecast), the number blurs into a range, so knowing things matters as much as carrying things.

**Consequences, gentle but real.** Plan well and it is as easy and lovely as backpacking: sensible trips finish happily at least 95% of the time. Try Mount Olympus in one night with day-hike gear, and you will have a problem: trouble or worse at least 80% of the time. In the default **Storybook** mode every story ends with you safely home. The worst case is a trip that ends early or a kind ranger with a thermos, then you plan again. An optional **Perilous** mode brings back real Sierra-style deaths at flagged moments.

**The park.** Six researched regions join into one trail network: 449 places, about 450 trail segments and 150 classic trips. Version 1.0 plays the three must-haves: Mount Olympus with every camp on the Hoh, Seven Lakes Basin and the High Divide, and Royal Basin. The endpaper map always shows the whole park; valleys not yet built are pencil sketches, "pages still being drawn", until they arrive (milestones M4 and M5).

**Mount Olympus itself.** The summit is roped glacier climbing. In v1.0 you reach it by hiring a (fictional) guide at the outfitter counter. Anyone may put the summit on a plan, and anyone who tries the ice unroped meets an honest choice at the edge of the glacier, with a sure way to turn around (4.2).

**Lots of outcomes.** About 218 gear items and 86 foods become about 40 event tags. Every card reads those tags, the place, the weather, the hour and what already happened. Version 1.0 has about 260 hand-written cards with about 730 choices, and their combinations make nearly every multi-night trip tell its own story (8.12). A test harness proves each item matters somewhere.

**Built simply.** Plain HTML, CSS and JavaScript modules with a canvas picture: no framework, no bundler, only a small data build step. Hosted free on GitHub Pages, installable to the Home Screen, playable offline at the trailhead, portrait and touch only.

**First playable:** one short Hoh book (M1a), then the full Hoh with Olympus by guide (M1b). Version 1.0 adds Seven Lakes Basin, the High Divide and Royal Basin.

### 1.1 What a play session looks like

A **first book** reaches its first trail page within about 8 minutes of opening, prologue included (3.6). A returning player spends 4 to 8 minutes planning, shopping and packing ("Fill from the list" and "Like last time" keep it quick), then 4 to 6 minutes per hiking day. A two-night trip is a 20 to 30 minute book. Every page autosaves, so a phone call never loses a page.

### 1.2 Calls this document makes

Where the three proposals disagreed, these are the calls. The reasoning is in the proposals; you can overrule any of them.

- **Default mode:** Storybook (every story ends with you safely home). **Perilous** is opt-in per book; code and data call it `sierra`, which keeps a real company's name off a button.
- **Score:** one KQ-style `Score: N of M`, with M computed for the itinerary. No spirits multiplier; low spirits instead switch off some joys ("too cold to sketch").
- **Odds:** every rolled choice shows the chance it goes all right ("made it"). Choices that can reach Serious or worse get a ♦, the fail share in red, a confirming tap and the compass roll. Safe choices show costs, never a %. Missing knowledge shows an honest range (8.6-8.8).
- **Meters:** seven simulated, four shown as storybook conditions, plus a Wet or Thirsty glyph when it matters.
- **Endings come from crisis cards the player saw**, never from a count of bad conditions. Two bad conditions only prompt a ranger-voice nudge.
- **Narrator:** third person, past tense, read aloud. Long text splits into a "more ▸" page and never scrolls.
- **The plant** is called **the Snowlamp** (placeholder), never "golden glow" in the game.
- **Restore** exists only in Perilous: Turn Back a Page, Back to Last Camp, Restart Trip. Rolls are keyed to content, so the same choice repeats its result.
- **Physics lives in one place:** fords from the river model, headlands from the tide margin, freezing levels from measured soundings, tides from NOAA La Push predictions.
- **Park conditions:** "As researched (Oct 2026)" by default, "Timeless" one tap away. A trip falls in the 12 months after the edition date, and dated closures apply only on their dates (4.7).
- **Rules can be broken**, with gentle ranger cards, Leave No Trace costs and wildlife consequences. **Only three hard blocks:** a pack that won't close, a load you can't lift (over about 60% of body weight), and routing through a closed trail.
- **Money:** prices and a receipt are shown, with no budget. The Shoestring wallet comes later (M6).
- **Gear comes from** your closet at home, the WIC's loaner canister, the store, the outfitter counter (rent or buy) and, for Olympus, a guide service.
- **Store name:** Fernwood Mercantile in Port Angeles.
- **Party:** solo in v1. The engine supports a party from day one; named companions arrive in M6. In v1 the only partner is a hired guide.
- **Trip date:** you pick it; the ranger suggests the destination's best month; October is allowed with warnings.
- **Sound:** on after the first tap, in an "ambient" audio session so the silent switch mutes it.
- **Data:** `gear_catalog.json` names and stats are authoritative (for example `daypack_28`).
- **First milestone:** the Hoh to Glacier Meadows, your own example.

---

## 2. Player experience and tone

### 2.1 Three feelings, in order

1. **Reading a picture book.** Every screen is a page with a picture on top and a few sentences underneath. You turn pages. Nothing is timed. The book waits for you.
2. **Planning a real trip.** The first chapters are what backpackers actually do: talk to a ranger, check the forecast and the quotas, build an itinerary, buy food, fight the bear canister for space, and decide whether the camp chair is worth a pound.
3. **A gentle dungeon crawl.** Out on the trail, the mountain asks questions your pack has to answer. A river with no bridge. A ladder at dusk. A headland and a rising tide. A cold, clear night at 4,300 feet. Each answer comes from what you packed, what you know and what you choose.

### 2.2 The book

- **One trip is one volume** on a bookshelf (the title screen). Chapters: *Prologue: The Blank Page* (first book only), *Chapter One: In Which a Trip Is Planned*, *Two: In Which We Go to the Store*, *Three: In Which Everything Must Fit*, *Four: In Which We Drive to the Trailhead*, then one chapter per day.
- **Chapters are retitled after they happen.** *Day Two: In Which the Trail Goes Up* becomes *Day Two: In Which a Jay Steals Lunch*. The volume gets a title at The End: *The Hiker Who Forgot the Stove*.
- **Page numbers** sit at the foot of the narration box (`- 37 -`), and a red ribbon bookmark marks the autosave.
- **The back cover** sums up the trip: the route map, miles, the score, what the pack taught, and the moral.

### 2.3 The voice

- A warm read-aloud narrator in the **third person, past tense**, lightly wry: *"Robin looked at the river for a long time."* About once a chapter the narrator speaks to the reader: *"And what do you suppose was at the very bottom of the pack?"*
- The hiker's **field journal** is a second voice, first person and terse: *"Day 2. Elk Lake. Feet: damp. Spirits: high. Slugs counted: 9."*
- **Animals do not talk.** The narrator translates what they seem to say, in italics: *Not that way,* the elk seemed to say. Rangers, shopkeepers and other hikers do talk, and all have fictional names.
- **A refrain ends each night page:** *And far away, the river went on talking to itself.* (On the coast, the sea goes on folding and unfolding. On Olympus, the glacier goes on being very old.)

**Ten voice rules** (the full guide is `storybook.md` 10.1):
1. Read it aloud. It should please a seven-year-old and their parent.
2. Short sentences, concrete nouns: cedar, gravel, wool, steam.
3. One small surprise per page.
4. Kind, not cute. Humor aims at weather, jays, rivers and gear, never at the player.
5. Real public places and real nature; fictional names for private businesses.
6. Safety is told as story. Only the Ranger's Note and the field guide speak plainly.
7. Animals don't talk.
8. Items are characters. The narrator notices what you brought and what you didn't.
9. Turning back is brave.
10. At least one quiet page per chapter where nothing happens but beauty.

**Words to love:** scree, tarn, krummholz, alpenglow, cairn, moraine, nurse log, blue hour, huckleberry. **Words to avoid:** epic, crush, insane, loot, grind, brand names, and gamer jargon (HP, XP) in the prose.

### 2.4 The King's Quest look and manners

- The status line reads `Score: 22 of 131     Sound: on`.
- **Every in-book page puts its narration in a Sierra message box:** white fill, a double dark-red border, black EGA-style text and a small inner margin. It is drawn in CSS around real HTML text, so VoiceOver still reads it. The choices are matching boxes below it (12.2). This box, more than anything, is what makes a page look like a Sierra game and not a web page with a picture on it.
- **Tapping the picture is KQ's LOOK.** A smaller pop-up box of the same style describes what you tapped, costs no game time, and gives +1 score the first time you look at that thing in a book.
- Pictures **draw themselves in** over about 0.8 seconds, outlines first and then fills flooding in, the way AGI games drew on a 1984 PC. A tap skips it.
- In Perilous mode, death comes in a Sierra text box with a deadpan joke and a real Ranger's Note.

### 2.5 Gentle but real

- **Plan well and it's easy.** A well-packed hiker on a sensible itinerary sees mostly joy cards, and their risky choices mostly show 90% or better.
- **No ambushes.** Anything that can end a trip is foreshadowed at least one page earlier (the forecast, a ranger's remark, "the light is going amber", the river "talking louder") and passes through a choice the player made.
- **Turning back is honored.** *The End, Sooner Than Planned* is a real ending with its own plate: *"The mountain will keep."*
- **Bad news is told kindly and specifically.** The narration names the cause gently so the lesson lands. State changes go in a pencil strip under the narration, not in the prose. Serious news is always followed by a choice.

---

## 3. Core loop

```
 Bookshelf
    │  Begin a new book
    ▼
 THE DAY BEFORE
 Ch.1 RANGER DESK ── where · day hike or nights
    │                · layover or move · date
    │                · briefing · permit
    ▼
 Ch.2 STORE ──────── food · fuel · small items
    │                · rent, buy, hire a guide
    ▼
 Ch.3 PACK ───────── in the pack, strapped
    │                outside, or left home
    ▼
 DEPARTURE MORNING
 Ch.4 DRIVE ──────── road pages · trailhead:
    │                "leave anything in the car?"
    ▼
 DAYS: morning ▸ depart ▸ trail pages and
    │  decisions ▸ arrive ▸ make camp ▸
    │  sunset ▸ night ▸ morning ▸ ...
    ▼
 THE END ▸ back cover ▸ Field Notes ▸
 plan again, or try this trip again
```

**When things happen.** Chapters One to Three happen the day before the trip: the permit and the WIC's loaner canister are picked up then, the food is bought that afternoon, and the pack is packed that evening. Chapter Four starts on departure morning, when you choose when to leave.

**Day hikes** need no wilderness permit and no canister, so they skip both. Chapter Two shrinks to a quick *grab lunch* stop on the way, and the pack chapter uses a day pack.

Back navigation is free during planning, shopping and packing (it is planning, after all). It closes at **Start walking**. After that, only Perilous mode's restore goes back.

### 3.1 Chapter One: the ranger desk (planning)

The first page is the Wilderness Information Center (WIC) in Port Angeles: a counter, a big wall map, a forecast board and a ranger. The planner is the book's **endpaper map**.

**Step 1: Where.** The endpaper map always shows the whole park. Tap a region, then a trailhead; regions not built yet are pencil sketches that can't be chosen (4.1). Or open *The ranger's favorite trips*: the presets, filtered by region, number of nights and level, about 8 at a time. In a first book the ranger simply offers three trips (3.6).

**Step 2: What kind of trip, and when.** A row of chips: `Day hike` `1` `2` `3` `4` `5` `6+` nights. Then the date: month chips plus a calendar. The date chips and the permit always show the year.
- **The calendar rule.** A trip falls in the 12 months after the edition date, in the next open season. In this edition, any date up to Oct 15, 2026 is this autumn, and anything later is in 2027 (4.7).
- **Seasons.** Summer permits run May 15 to Oct 15. Glacier Meadows, Elk Lake and Martin Creek are reservable Jun 15 to Oct 15, and the high camps are bookable online from mid-July to mid-October. A date outside those windows routes to a *Phone the WIC* card and winter rules.
- **Weekends** make quotas tighter, trails busier (more kind strangers) and the free canister loan scarcer. The ranger suggests the destination's best month.

**Step 3: The itinerary, night by night.** Each night is a row. Tapping a night row opens a list of the camps reachable from the night before, sorted by distance, each with the day's numbers:

```
Lewis Meadow   10.4 mi  +640
  arrive 2:50 pm
Elk Lake       15.3 mi  +2,250
  arrive 6:15 pm · quota OK
Glacier Mdws   17.4 mi  +4,290
  about 9 pm · a very long day
Martin Creek   (full that night)
```

The map highlights each camp as you scroll the list. The map also pinch-zooms, with clustered markers ("3 camps") that open into single ones, because the 13.1, 13.2 and 13.3 Mile sites sit a couple of points apart at phone scale. Disabled rows say why: closed, full that night, or outside the quota season.

The route between camps follows the trails automatically (shortest by hiking time, avoiding closures). Each day row shows:
- miles, gain and loss, and an estimated hiking time for your fitness;
- when you'd arrive, compared with dark ("arrive 5:10 pm; dark at 7:15");
- a storybook difficulty word: *an easy stroll, a good day, a long day, a very long day, the ranger raises an eyebrow*.

Each night row has two buttons:
- **Stay again** makes it a **layover**: no packing up, a free day for side trips with a light pack (the research's `layover_ideas` become suggestions), more joy, and at a high camp a second evening for the Snowlamp (10.6).
- **Move on** picks a new camp: more scenery and more miles, with a heavier pack every day.

Loops ask for a direction (the High Divide clockwise or counterclockwise). Traverses ask how you'll get back to your car: a fictional shuttle service, a bike stashed at the far end, hitching (slow), or two cars once you have a party (M6). Day hikes pick a turnaround point and a "back by" time instead of camps. In season, a tiny pencil star marks camps where the Snowlamp is possible that month (10.6).

**Step 4: The ranger's review and briefing.** The ranger reads the plan back in her own voice. Every check in 4.6 becomes a friendly line ("Day 2 is a climb. The ladder is no place to be at dusk."). Then comes a **one-page briefing** on the one to three things that matter most for this plan, chosen from the plan itself: snow on the Divide in early July, the Hoh in the afternoon, the tide gates on the coast, bears in berry season. The briefing grants all of that knowledge at once (8.6), so there is no list of topics to tap through, and a player who doesn't know what to ask still learns it. The ranger also tells the story of the wolf, once (10.4).

**The Trip Outlook, first reading.** In the background the game plays the plan forward many times (8.9), **assuming you pack the ranger's sensible kit**, and reports in words: *"If you pack well: a long, lovely trip. Day 2 is a climb, and the nights will be cold."* Tap it for the numbers. It reads again, with your actual pack, when you close the pack (3.2) and at the trailhead (3.3).

**Print the permit at home** is the alternative to the WIC. You plan at the kitchen table and keep the afternoon, so you can leave at first light, but there is no briefing and no loaner canister.

**Step 5: The permit.** A paper form with pixel handwriting:
- party (you, plus a guide if you booked one, 4.2), entry trailhead, dates with the year, the camp for each night;
- a quota check for each night (a seeded, weekend-weighted roll keyed by calendar date and camp; "Lunch Lake is full that Saturday" is a planning event with alternatives, not an error);
- fees, shown for realism: $8 per adult per night plus a $6 reservation fee;
- **bear canister**: bring your own, rent one, or try the free WIC loan (available about 70% of the time on summer weekends, 95% midweek);
- **trip plan left with:** a friend, or no one. A friend reports you overdue 12 hours after your planned exit (3.7);
- **the forecast**, for the trip days within five days of the planning day. Later days show the ranger's climatology instead ("late September: rain about one day in three").

Tap **Stamp it** (a rubber-stamp *thunk*). The score line appears: `Score: 0 of 131`, the maximum computed for this itinerary.

### 3.2 Chapters Two and Three: store and pack

Covered in sections 5 and 6. The store's shopping list is driven by the itinerary (2 breakfasts, 3 lunches, 2 dinners...) and shows a canister gauge as you shop.

**Close the pack** runs the Trip Outlook a second time, now **with this pack**, and names the two or three biggest gaps: *"With this pack: this trip very likely ends in serious trouble. Biggest gaps: no sleeping bag, no headlamp, no rain jacket."* It is a warning, never a block. The pack chapter then ends with the **packing page**: the narrator reads the pack's contents aloud as prose.

### 3.3 Chapter Four: the drive

On a route you haven't driven before, two to five road pages from Port Angeles to the trailhead, using the research's drive times (Port Angeles to the Hoh about 143 minutes, to the Upper Dungeness about 90). Lake Crescent with palette-cycled water, elk on the Upper Hoh Road, gravel to the Dungeness. **On a route you've already driven, the drive is one page**, with the optional stops as chips: *The Huckleberry Skillet* (a fictional diner; pie costs 45 minutes and lifts spirits) and a last-chance store in Forks with higher prices.

**Leaving time matters.** You choose when to leave home, and a late start shortens Day 1. Road conditions come from the dated conditions overlay and apply only on the dates they cover (4.7): the Elwha road walk from Madison Falls and the Dosewallips washout (open-ended), entrance-station lines at the Hoh in summer, and in this autumn only, Mora Road closed through Oct 15, 2026 and the US 101 Hoh River Bridge closed Oct 8 to 13, 2026 (a 4-hour detour that cuts Kalaloch, Queets and Quinault off from Forks).

**The trailhead: Last look.** The car is open for one page. Move anything between pack and car. The page shows the Trip Outlook a third time, with this pack, and the honest ETA for Day 1 (on Appendix A's trip: *"Glacier Meadows about 12:30 am: five and a half hours after dark, by phone light"*). This is the last chance to change the pack, exactly as on a real trip. The game **never makes you forget things at random**: every gap is a choice, which keeps the "why did this happen" trace honest.

### 3.4 The days

```
MORNING   weather now, breakfast, pack up
DEPART    pace: Easy / Steady / Push
LEGS      trail pages; 0-2 beat slots per
          segment, plus landmarks
ARRIVE    pick a site
CAMP      Make camp (one tap), then free
          time; the sky darkens as it goes
NIGHT     a night card only if something
          happens; the refrain
MORNING   move on / stay / side trip / home
```

A layover day replaces DEPART and LEGS with side trips and camp time.

**Known ground: Walk out and Walk on.** On ground you have already walked (the way home on an out-and-back, or a valley from an earlier book), the morning page offers **Walk out** (or **Walk on**): one summary page per leg. *"Robin went down the valley the way Robin had come, and the river, which had been loud going up, seemed to have calmed down about everything."* The simulation still runs underneath, and the summary stops only for forced beats (a crisis, a fork, a delayed payoff) and for anything new (an animal, a field guide entry not yet found, a river that has changed). Out-and-back trips stay brisk without extra writing. M1 transcript reviews track pages per return day (target: 3 to 6).

### 3.5 Pacing targets

| Trip | Pages | Minutes | Real decisions |
|---|---|---|---|
| Day hike | 12-18 | 5-8 | 3-5 |
| 1 night | 25-35 | 10-14 | 6-10 |
| 2-3 nights | 40-70 | 15-30 | 10-18 |
| 4-6 nights | 70-120 | 30-50 | 18-30 |

A **Page density** setting (Short / Storybook / Long) changes how many quiet, decision-free pages appear: about 8 to 20 per day.

### 3.6 The first book

**Target: the first trail page within about 8 minutes of opening a new book, prologue included.** Without help, a new player would face a park map, a long list of presets, quotas, 86 foods and a 218-item closet before Day 1, which is where players quit. So book one is short on chores and long on story. Every later book gets the full manual path.

| Step | In the first book | Minutes |
|---|---|---|
| Prologue | Six pages (10.2) | 1.5 |
| Ranger desk | Three suggested trips; a filled-in permit to stamp | 2 |
| Store | "Fill from the list", then 2-3 swaps | 1 |
| Pack | The ranger's checklist on the floor; about 15 taps | 2.5 |
| Drive and trailhead | One page and the last look | 1 |
| **Total** | | **about 8** |

1. **Three trips from the ranger,** with the full map one tap away: an easy overnight, a high trip with a layover and a Snowlamp chance, and a day hike. In M1 those are Happy Four, the Blue Glacier classic (Glacier Meadows twice), and a day hike to Five Mile Island. From v1.0 the high trip is Royal Basin with a layover or Seven Lakes for three nights. The high trip comes with the ranger's hint: *"If you're looking for something that only shows at dusk, camp high, near snow, and stay up late."*
2. **Fill from the list.** The store's list fills itself with a varied menu sized to the itinerary that fits the canister, then highlights two or three swaps for the player to make (5.3).
3. **The pack starts on the floor.** The ranger's checklist items lie around the open pack, not in it. Each tap puts one in, and the fox points at whatever is still out. A first pack is about 15 meaningful taps; the long tail and the traps wait in "More from the closet" (6.1).
4. **The presets list is short:** filtered by region, nights and level, about 8 at a time.
5. **The first clear evening at a Snowlamp place shows it** (10.6), so the first book can end the way the picture book does.

### 3.7 Changing plans on the trail

- **Replanning.** From the morning page, a Fork card or the Map tab, *Change the plan* re-runs the validator with in-trip rules. Closures still route around, but a quota camp is never a block: it becomes a ranger card (*"It's all right this once. The camp was half empty, and you looked honest."*), a polite talking-to and a little Leave No Trace. The change is noted on the permit, and the score maximum is recomputed without lowering the score already earned (9.6).
- **Where's the car?** The game tracks where the car is. Coming out at a different trailhead (the High Divide down to the Hoh via Hoh Lake; out the Elwha) opens an exit menu, each with its time cost and a page: phone the shuttle (needs signal; a 2 to 4 hour wait), hitch (1 to 6 hours, better on busy roads), or a ride with a ranger if one is at the station.
- **The overdue clock.** If you left a trip plan with a friend, they report you overdue at your planned exit plus 12 hours, and the chance of a search finding you rises from then on (9.2). With no trip plan, nobody knows to look until someone notices the car, after 2 to 3 days. Staying out longer (a night under the stars, waiting out a tide or a river) moves your exit, and a margin note says when your friend will start to worry.
- **Day hikes** get a turnaround card 30 minutes before the "back by" time.

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

The gear catalog (218 items and 8 packs), the food catalog (86 foods) and the park-wide rules (`park_rules.json`: permits, food storage, fires, climate, tides, rescue patterns, fall 2026 conditions) complete the data. The fact-check confirmed the signature mileages against NPS (Hoh trailhead to Glacier Meadows 17.4, Upper Dungeness to Royal Lake 7.2, the High Divide loop 18.4 vs NPS 18.2) and that canisters are required at all 156 public wilderness camp areas. **The files are the source of truth**; this document only cites them. Known gaps: Upper Lena Lake (a quota area) isn't modeled, and hidden or closed camps (Beaver Flats/Four Stream, Donahue Creek, Madeline Creek, Twelve Mile, Camp Pan, Chateau Camp, Lake of the Angels) have no nodes.

**What a v1.0 player sees of the rest of the park.** The endpaper map always shows the whole park. Regions not yet built (the coast, the Elwha, the Quinault and the rest) are drawn as pencil sketches labeled *pages still being drawn*. Tapping one gets the ranger's *"That valley is a story for another day,"* and it can't be chosen for a trip. The ranger's favorite trips list only playable ones. Each milestone inks in more of the map (15).

### 4.2 Mount Olympus and every camp on the Hoh

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
| Glacier Meadows | 17.4 | 4,300 | Quota, 11 + 1 group; base camp; ☆ Snowlamp |
| (Lateral moraine viewpoint) | ~18.5 | 5,100 | First close view of the Blue Glacier; ☆ |
| (Edge of the Blue Glacier) | ~18.7 | — | 0.2 mi off trail down the moraine wall: cliff, rockfall |
| Caltech Rocks | ~19.6 | unsurveyed | Climbers' camp; blue bags required |
| Snow Dome | ~20.1 | ~6,786 | Climbers' high camp; melt snow; blue bags; ☆ |
| Summit (West Peak) | ~21.8 | 7,980 | Fifth-class summit block |

Everything past Glacier Meadows is an estimate in the data. The park requires blue bags for human waste on Olympus (from the Hoh Visitor Center or the Port Angeles WIC), and there is no camping between Glacier Meadows and the glacier.

**Who can go where past Glacier Meadows.**
- **Anyone** can walk the 1.1 miles of primitive trail to the lateral moraine viewpoint: the first close look at the Blue Glacier and, in the evening, a Snowlamp place.
- **The summit needs a rope team on the glacier.** In v1.0 it opens with **the glacier kit** (crampons, ice axe, helmet, harness) **plus a booked guide** from Larkspur Glacier Guides, a fictional guide service at the outfitter counter (5.1). The guide is your rope partner, brings the rope and has glacier skill for that trip. From M6, it also opens with the glacier kit, a rope, and a rope team of two or more in which everyone has `glacier` skill 1 or better (you and a companion), with no guide.
- **Glacier skill** is the eighth skill (7.3). You earn it on a guided **glacier school** day on the Blue Glacier (an optional extra layover on a guided trip: self-arrest, roped travel, crevasse-rescue practice), or start a book with level 1 by ticking *"has taken a glacier course"* on the New Book page.

**Anyone can put Snow Dome or the summit on the plan.** The planner allows it, the ranger frowns, and the Trip Outlook says *"very likely serious trouble"* when the rope team is missing. It is not a hard block. Instead, every unroped hiker meets the same forced ♦ card at the edge of the moraine:

> *The moraine ended in a wall of loose gravel, and below it the Blue Glacier lay like a frozen river, cracked into blue rooms.*
>
> `[ Turn back from the ice       sure ]`
> `[ Step onto the ice    ♦ 55%   (i) ]`
> `[                  45% stopped     ]`

- **Turn back** is sure. You keep the glacier view (+5) and, if it's evening, a Snowlamp place for the night.
- **Step onto the ice** uses an honest % from the crevasse model (month and snow bridges, time of day, crampons, footwear, fatigue, glacier skill). The 55% shown is for late-September day gear: sneakers, no crampons, tired. In Storybook a fail means a crevasse field stops you: you turn back with a story, or wait for a ranger after a slide. Perilous adds the 30% death roll on the worst band (9.5). Even a lucky unroped hiker can't climb the fifth-class summit block without a belay, so the false summit is the highest they can reach.

So every path offers a sure turnaround at the moraine, and the plan is never refused. Appendix A.7 plays this out, and F.1 tests it.

### 4.3 Seven Lakes Basin and the High Divide

From the Sol Duc trailhead the High Divide loop runs about 18.4 miles (data; NPS says 18.2, WTA 19). It climbs past Sol Duc Falls and Deer Lake to the rim of the Seven Lakes Basin and the High Divide, with Mount Olympus face to face across the Hoh valley, then drops past Heart Lake and Sol Duc Park and follows the river home.

Every camp is a designated site in the Sol Duc/Seven Lakes quota area (Hoh Lake and C.B. Flats have their own). The online season is Jul 15 to Oct 15; outside it, permits come by phone from the WIC. Canisters are required, there are no fires above 3,500 ft, and the crest is dry. **Mile** is the shortest path from the Sol Duc trailhead through the joined graph. **Sites** are the groups allowed per night (Recreation.gov, Oct 2026), so they are the quota.

**Up the Deer Lake side**

| Camp | Mile | Elev (ft) | Sites · notes |
|---|---|---|---|
| Sol Duc Falls Camp | 1.0 | 2,080 | 3 |
| Canyon Creek #1, #2, #3 | 1.9-3.0 | 2,610-3,370 | 1 each |
| Deer Lake | 3.7 | 3,530 | 10 + group · privy; cougar sign reported |
| Potholes | 4.7 | 4,080 | 2 · ponds on the ridge |

**In the basin**

| Camp | Mile | Elev (ft) | Sites · notes |
|---|---|---|---|
| Round Lake | 7.6 | 4,260 | 1 |
| Lunch Lake | 7.8 | 4,450 | 9 · privy; often full; ☆ early season |
| Clear Lake | 8.1 | 4,230 | 1 |
| Long Lake | 8.4 | 3,840 | WIC request only |
| Sol Duc Lake | 8.9 | 3,680 | WIC request only |
| Morgenroth Lake | 9.0 | 4,130 | WIC request only |
| Lake #8 | — | — | Not plannable (location unverified) |

**On the Divide, and down the river**

| Place | Mile | Elev (ft) | Sites · notes |
|---|---|---|---|
| Bogachiel Peak (spur) | 7.8 | 5,474 | The big view; no camping; ☆ |
| Heart Lake | 8.1 | 4,780 | 5 · privy; ☆ early season |
| Heart Lake Junction camp | 8.5 | 5,080 | 1 · on the crest |
| Bruce's Roost | 8.9 | 5,100 | WIC request only |
| Hoh Lake | 9.0 | 4,520 | 4 · Hoh Lake quota; the link to the Hoh |
| Cat Basin | 9.6 | 4,580 | WIC request only; primitive way trail |
| Sol Duc Park | 7.1 | 4,200 | 4 + group · privy |
| Lower Bridge Creek | 6.5 | 3,830 | 2 |
| Sol Duc River camps | 2.4-5.9 | 2,210-3,400 | Sol Duc River #1-4, Appleton Junction, Rocky Creek, Sol Duc Crossing: 1 each; Seven Mile group site; Horse Head stock camp |

(Mile figures run via whichever side is shorter, so Lunch Lake is measured via Deer Lake and Heart Lake via the river trail. ☆ marks Snowlamp places; see 10.6 for the months.)

**WIC-only camps.** Long Lake, Sol Duc Lake, Morgenroth Lake, Bruce's Roost, Cat Basin and Hidden Lake are listed in the permit system but hidden from online booking. In the game they are **special permit requests**, like Upper Royal Basin: tap one and the ranger considers it (in season, granted about 70% of the time midweek and 40% on weekends, seeded by date and camp), with a line about why they're kept quiet. Lake #8 can't be planned: its location is unverified and no trail reaches it in the data. It lives in a pencil footnote.

**The seven lakes**, for the badge *Seven Lakes, all seven* (M6): Lunch, Round, Clear, Long, Sol Duc, Morgenroth and No Name. You earn it by Looking at each of them in one book; most are visible from the rim or the basin trail. E.W.'s footnote in the field guide: *"There are more than seven. Don't tell anyone."* (Y Lake, Mirror Lake and Lake #8.)

### 4.4 Royal Basin

On the dry northeast side, in the Olympic rain shadow. From the Upper Dungeness trailhead (about 90 minutes from Port Angeles on rough Forest Service roads; a Northwest Forest Pass is needed): the Royal Basin Trail junction at 1.0 mi, Royal Creek Camp at 4.0, Lower Royal Meadow at 6.3, and **Royal Lake at 7.2 mi and 5,100 ft**, under Mount Deception (7,788 ft). Royal Lake is a quota area (about 8 parties a night) with no campfires anywhere in the basin, a composting toilet, a summer ranger station and rodents that chew through packs. **Upper Royal Basin** (about 8.2 mi, 5,700 ft) is a moon-like basin of tarns, talus and late snow. Camping there is by arrangement with the WIC only, which in the game is a special permit request.

### 4.5 Signature trips

Miles are round-trip (or end-to-end) totals from the region files, recomputed from the graph at ingest (E.4). "Level" is the research's difficulty. These are the ranger's presets, listing only playable regions; players can build any other itinerary on the graph. The ranger never recommends a mistake: a one-night Glacier Meadows trip is listed plainly as "a very long day", and the trap comes from what the player packs.

**Mount Olympus and the Hoh**

| Trip | Miles · nights | Level | Best months |
|---|---|---|---|
| First overnight: Happy Four | 11.4 · 1-2 | easy | May-Oct |
| Day hike to Five Mile Island | 10.0 · 0 | easy | Apr-Oct |
| Blue Glacier classic (Lewis Mdw, Glacier Mdws x2, Five Mile Is.) | 37.8 · 3-5 | hard | late Jul-late Sep |
| Slow ramble to the ice | 37.0 · 5-6 | moderate | late Jul-mid Sep |
| Blue Glacier fast, via Elk Lake | 37.0 · 2 | hard | Aug-mid Sep |
| Glacier Meadows, 1 night: a very long day | 34.8 · 1 | hard | Jul-Sep |
| Mount Olympus with a guide (+1 night for glacier school) | 43.4 · 4-5 | expert | late Jun-mid Aug |
| Mount Olympus, Snow Dome high camp (guide; or a trained party from M6) | 43.6 · 3 | expert | late Jun-mid Aug |

**Seven Lakes Basin and the High Divide**

| Trip | Miles · nights | Level | Best months |
|---|---|---|---|
| Deer Lake overnight | 7.4 · 1-2 | moderate | Jul-early Oct |
| High Divide loop in a day | 18.4 · 0 | hard | late Jul-late Sep |
| High Divide loop, 2 nights (Lunch + Heart) | 20.4 · 2 | moderate | late Jul-Sep |
| High Divide, 3 nights with a layover | 18.7 · 3 | moderate | late Jul-Sep |
| Seven Lakes Basin explorer | 19.3 · 3 | moderate | late Jul-Sep |
| Hoh to Sol Duc via Hoh Lake (either direction) | 24.4 · 2-3 | hard | late Jul-mid Sep |

(The Sol Duc file's version of the traverse adds a night at Lunch Lake, 25.5 miles. Ingest lists it as its own variant, and both directions of the plain traverse use the graph's mileage.)

**Royal Basin**

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

Each check becomes a ranger line. Only routing through a **closed trail** is refused outright, and the ranger suggests another way.

- **Legal camps.** Every night is at a real camp node that is open on that date under the conditions overlay (4.7).
- **A route exists.** The shortest path by estimated hiking minutes, skipping segments closed on those dates. Loops offer a direction; `via` pins waypoints.
- **Permits and quotas.** Quota areas (`park_rules.json`): Ozette Coast, Royal Basin, Lake Constance, Upper Lena, East Fork Quinault, Flapjack Lakes, Grand and Badger Valleys, Sol Duc/Seven Lakes/Mink Lake/Cat Basin/Little Divide, Hoh Lake and C.B. Flats, and Elk Lake, Martin Creek and Glacier Meadows on the Hoh. In quota areas: designated sites only. The quota roll is keyed by calendar date and camp, so changing the date re-rolls it. WIC-only camps are special requests (4.3). Out-of-season dates go to a *Phone the WIC* card with winter rules.
- **Group size.** 12 people at most; groups of 7 to 12 need group sites.
- **Daily load.** Estimated hiking hours for your fitness; above 9 hours the ranger frowns. Arrival time is compared with trail-dark.
- **Snow.** Snow on the route by date, aspect and snow year (7.6): the ranger recommends traction or an ice axe.
- **Fires.** Allowed only below 3,500 ft, outside named no-fire areas (all of Royal Basin, Grand Valley, Appleton Pass and Oyster Lake, Hoh Lake, Low Divide, Lake Constance, Lake Angeles, Elk Lake and above, the Ozette coast from Wedding Rocks to north of Yellow Banks), and when no ban is on for that date. The 2026 Stage 2 ban (USFS order Aug 7 to Oct 1) is treated as ended inside the park, because no NPS end date was found; the ranger says so. Future summers draw a late-summer ban from climatology (4.7).
- **Food storage.** The validator reads each camp's `bear_can_required`. A hard-sided canister is required at every NPS wilderness camp (2026 rule; hangs and soft sacks don't count). At the few national forest camps where the data says it isn't required (Slide Camp on the Gray Wolf, Camp Mystery, Shelter Rock), the ranger still recommends one.
- **Water.** Dry stretches are flagged (the High Divide crest, the Hoh Lake Trail switchbacks, Grand Ridge).
- **Tides.** Coast plans show the tide gates on the route. With the WIC briefing or `coast` skill 2, the ranger computes the windows for you.
- **Road walks and closures,** by date: the Elwha road walk (+6.5 mi to Whiskey Bend) and the Dosewallips washout (+6.5 mi), both open-ended; Staircase's wilderness trails and 14 camps (closed after the 2025 Bear Gulch Fire, open-ended); Six Ridge from Graves Creek to Lake Sundown (closed, open-ended); Mora Road and Rialto Beach (closed through Oct 15, 2026; sources disagree); Lake of the Gods (closed in June 2026 by the Mount Tom Creek Fire near Olympus; status unknown, with a ranger line about smoke on the Hoh).
- **Olympus.** Past the moraine without a rope team: a warning and a frowning ranger, never a block. The moraine card always offers a sure turnaround (4.2).
- **Traverses.** A way back to the car (3.7).

### 4.7 Park settings and the calendar

- **As researched (Oct 2026)**, the default: real dated closures, road walks, bridge work and fire restrictions, from a conditions overlay (`content/park/conditions/2026.json`). The colophon says "Park conditions as researched on 2026-10-07".
- **Timeless park:** closures off. Seasonal patterns that are climate rather than news (snowpack by month, late-summer fire bans, bugs, berries) stay on.

**Which year a trip happens in.** A trip falls in the 12 months after the edition date (2026-10-07), in the next open season: up to Oct 15, 2026 it is this autumn; after that it is 2027. The year is shown on the date chips and the permit, and all examples in this document use 2027 dates unless they say otherwise.

**How dated news ages.** Every overlay entry carries a `from` date, an `until` date or a `persists` flag, and the date it was last confirmed:
- **Dated entries expire.** Mora Road closed through Oct 15, 2026, and the US 101 Hoh River Bridge closed Oct 8 (5 am) to Oct 13 (noon), 2026, affect only trips on those dates.
- **Open-ended entries persist** until the overlay is updated: the Staircase closures, the Dosewallips washout, Six Ridge, the Hoh River Bridge's single lane.
- **Stale entries are told as stale.** Anything past its last confirmation date is given by the ranger as *"last we heard"*.
- **Fire bans** apply only on their own dates. For a 2027 trip, both settings draw a late-summer ban from climatology, and the ranger says *"we'll know closer to the date"*.

---

## 5. Store and food

### 5.1 Where things come from

| Source | What it supplies | Notes |
|---|---|---|
| **Your gear closet** (home) | The catalog's standard-tier gear, including the traps (cotton hoodie, jeans, cast-iron skillet) | Free. Packing is choosing, not buying |
| **The WIC** (Port Angeles) | The free loaner bear canister (10.1 L, heavy) | A seeded roll: about 70% available on summer weekends, 95% midweek |
| **The store** | Food, fuel canisters, batteries, tide table booklet, small consumables | Chapter Two |
| **The outfitter counter** (same store) | Rent or buy: canisters, glacier kit, satellite messenger, premium and cheap tiers | Glacier sets limited to 2-3 on summer weekends; pickup the day before |
| **The guide desk** (same counter) | Larkspur Glacier Guides: a guided Olympus climb | Booked at planning on fixed departure dates (two places each, may be full); the fee is shown on the receipt; the guide brings the rope and meets you at the trailhead |

Rentals come from `gear_catalog.json` (`rentals`, `stats.rent_usd_per_day`). **Skills are not rentable:** an ice axe helps only if you can self-arrest, and a rope only helps a trained team of two or more. A guide is the one exception, because the skill comes with the guide (4.2).

### 5.2 The stores

All private businesses get fictional names. Public places keep real names.

- **Fernwood Mercantile**, Port Angeles: the main store, grocery plus an outfitter counter. Shopkeeper with Sierra-style remarks.
- **Larkspur Glacier Guides**, a desk at the back of Fernwood: the guide service for Olympus. The guide is a fictional character with their own voice (*"Ice is honest. It just doesn't tell you everything at once."*).
- **Calawah Grocery & Tackle**, Forks: the last-chance store on the drive west, at higher prices.
- **Spit and Sound Outfitters**, Sequim: rentals for the east side.
- **The Huckleberry Skillet:** the diner on US 101 (pie on the way out, pie on the way home).
- Lodges, where scenes need them, using the names already in the region files: *The Steaming Fern Lodge* (Sol Duc Hot Springs), *Stillwater Lodge* (Lake Crescent), *The Mossback Lodge* (Lake Quinault).

Before shipping, the linter checks every fictional name against a deny-list of real Peninsula businesses and guide services (lint T03).

### 5.3 The shopping screen

- An illustrated shop page (tap the shelves to jump to a category; tap the shopkeeper for advice).
- A **shopping-list notepad** built from the itinerary: Breakfasts ●●○, Lunches ●●●, Dinners ●○○, Snacks, Drinks, Fuel ✓. It checks itself off as you buy.
- **A canister gauge** on the same notepad: `Canister: 6.4 of 8.6 L · 3.2 days`. Overflow shows the moment it happens, not on the pack screen, with the shopkeeper's *"That won't all fit in a can, friend."*
- **Fill from the list** (one tap) buys a varied menu sized to the itinerary, with no dinner twice in a row, that fits the canister you plan to carry. It then highlights 2 or 3 swaps for you to make. It is the default in a first book (3.6) and always available after.
- Rows show name, weight, calories, price and a − / + stepper (44 pt targets).
- A running **receipt** with real-feeling prices. No budget limit (the Shoestring wallet comes in M6).
- The shopkeeper comments on silly purchases: *"Those'll be heavy, friend. Beans are mostly can."*
- **Day hikes** get the *grab lunch* version instead: one shelf, a sandwich, snacks and water, about three taps.

### 5.4 The food data

`food_catalog.json` holds **86 foods**: 47 no-cook, 25 boil, 11 fresh and 3 cold-soak. Each has calories, ounces, liters as sold and repacked, water, fuel, morale (-2 to +3), spoilage and crushability. Traps are realistic and say so in their notes: canned food, a whole watermelon, chips (calorie-light, volume-heavy), a foam noodle cup.

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

Dense food (1.6 L/day) stretches a standard canister to about 6 days; bulky food (2.6 L/day) shrinks it to about 3.5 (3.4 to 3.8 days after smellables). **Repacking** is a free action: a freeze-dried pouch drops from 1.5 L to 0.6 L in a zip bag, and the pack screen has a one-tap **Repack all food** (6.1).

### 5.6 Small systems that make food matter

- **Morale.** Dinner joy grows with the food's morale and whether it is hot.
- **Food fatigue.** The same dinner on consecutive nights loses one morale point per repeat, which rewards a varied shopping list.
- **Fuel.** About 7 g of canister fuel per half-liter boil plus 1 g per minute of simmering. A 110 g canister gives about 14 boils. Boil meals plus hot drinks use about 24 g a day; melting snow at the Snow Dome uses about 130 g.
- **Spoilage.** Fresh food has a `spoils_days`; the watermelon makes one camp very happy and then becomes a problem.
- **No stove, no fuel or no lighter** turns dinner into *Cold dinner*, with a funny line and less warmth that night.
- **Auto-snacking.** On the trail the hiker eats trail food automatically, up to a **daily allowance**: the calories left divided by the planned days left. An "Eat extra" button appears only when energy is low. No micromanagement.
- **Running short is a decision, not a surprise.** When the food left falls below 80% of what the rest of the plan needs (an under-shopped layover, an extra night waiting out a river), a morning card asks: *half rations*, *cut the trip short*, *ask the neighbors*, or *skip today's side trip*. The Pack tab shows food left by meal, and the Field Notes compare calories planned with calories burned.

---

## 6. Packing

### 6.1 The pack screen

The book's backpack spread, drawn our own way, designed for one thumb. **The picture shows the pack and what is in it**, not the whole closet: items inside sit in the open pack, items strapped outside hang on it, and labels with leader lines name them. The closet is a list below.

- **The closet is grouped by the ranger's checklist rows:** Shelter, Sleep, Rain, Warmth, Kitchen, Water, Light, Navigation, First aid, Extras. Each item lives in exactly one group. The long tail of the 218 items, and the traps, sit in a collapsed **More from the closet** at the bottom.
- **Tap an item to put it in the pack** (a *bloop*); tap it again to take it out. Its row moves to the top of its group with a check.
- **Choosing a place.** Dragging an item onto the pack picture, or a long-press on a packed item, opens the **slot picker** (12.9). It lists only the legal places for that item, each with its cost: *Inside (stuffed in its sack: 3.1 L)*, *Bottom straps: may snag; wet without a dry bag*, *Top strap: top-heavy, -4 on footing*. The picker is optional: the game picks the sensible place by default.
- **The canister panel** sits on the same screen: food liters against usable liters and days of food (`Food 7.1 of 8.6 L · 4.1 days · smellables 0.5 L`), with **Repack all food** as one tap.
- **The water stepper** sets liters carried in 0.5 L steps, up to your bottles' capacity, and shows the weight (2.2 lb per liter).
- **The ranger's checklist** is an overlay, not a tab: the ten essentials plus what this region and month expect, ticking as you pack. It never packs for you.
- **The pack silhouette flood-fills** as it gets fuller, using the same fill routine as the scenes, so the volume meter is literally a fill. **A hanging spring scale** shows the weight with a storybook word (6.4).
- **The margin fox** points at the rain jacket when showers are forecast, shivers when there's no warm layer for a September high camp, and sleeps when everything is fine.
- **Like last time** reloads your previous pack. In a first book, the pack starts with the checklist items laid out on the floor (3.6).
- **Close the pack** runs the Trip Outlook with this pack (3.2), then the packing page, where the narrator reads the contents aloud.

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

Each **bulky outside item** costs -3 on footing, ladder, ford and headland checks (cap -10). With three or more, the narrator calls you a Christmas tree. A down bag strapped outside without a dry bag has an 8% chance per rain-hour of getting wet, and a wet down bag keeps only a quarter of its warmth. An inflatable pad strapped outside in brush can puncture (patchable only with a repair kit).

**3. The bear canister (hard, legal).** Required for every overnight at NPS wilderness camps, and the only legal place for food and smellables at night. It caps food days (5.5). **Food that doesn't fit** triggers the night visitor roll, shown honestly on the evening page: coast raccoons 40%, mice at popular camps 30%, bears 5% (10% in August-September berry country). A visitor eats the overflow, Leave No Trace drops, and if a bear got it, a ranger card follows and the region remembers (9.8).

**4. Weight (soft), as two ratios.**
- **Pack ratio** = pack weight / the pack's load rating. It says how well this pack carries this load: above 1.3 the straps cut in (footing and ford -5, feet wear faster, spirits dip), above 1.6 it's -10.
- **Body ratio** = pack weight / (25% of body weight). It says how much this person can carry, whatever the pack.
- **The felt load** `r` is the larger of the two, and drives the words, pace and energy in 6.4.
- **The only weight block** is a body ratio above about 2.4, which is about 60% of body weight: 99 lb for the 165-lb hiker. *"You can't lift it onto your shoulders."* A 21-lb load in a 10-lb book bag is miserable, not impossible.
- Body weight is a state variable, `body_lb`, fixed at 165 lb in v1 (it also scales food needs, 5.4). A size chip on the New Book page can come later.
- Water counts at 2.2 lb per liter, so "carry 3 L for the dry crest" is a real decision.

### 6.4 What the weight feels like

| r (felt load) | Word | Storybook scale | Time on trail |
|---|---|---|---|
| ≤ 0.6 | Light | *light as a jay* | x0.90-0.94 |
| ≤ 1.0 | Comfortable | *a comfortable load* | x1.00 |
| ≤ 1.3 | Heavy | *like carrying a sleepy cub* | up to x1.14 |
| ≤ 1.6 | Very heavy | *like carrying a grumpy cub* | up to x1.29 |
| ≤ 2.0 | Brutal | *a whole elk calf, and it has opinions* | up to x1.67 |
| > 2.0 | Crushing | *the straps had stopped being polite hours ago* | up to x2.0 |

Heavier also means hungrier, wobblier on ladders and harder on knees on the way down.

### 6.5 Pack tags: how the pack talks to the story

The gear catalog defines 222 item tags (`tag_glossary`). **Tag rules** turn the packed set into about 40 **event tags** and a few numbers that every card reads. Cards never name an item, so new gear needs no card edits, and every card responds to every loadout. Every catalog item maps to at least one event tag (F.3).

| Rule kind | Example output |
|---|---|
| Sum | `insulation`, `water_cap_l` |
| Best of | `sleep_rating_f`, `light` (headlamp > phone > none) |
| Combination | `nav_kit` = map + compass; `hot_meal` = stove + fuel + lighter |
| Placement | `outside_bulky`, `top_heavy` |
| Fit | `food_fits_can`, `over_volume_l` |
| Load | `pack_lb`, `pack_ratio`, `body_ratio` |
| Condition | a wet item adds `<tag>_wet` and loses warmth; a dead battery removes its tags |

The core event tags: `rain_top`, `rain_bottom`, `insulation`, `sleep_rating`, `pad_r`, `shelter` (tent, tarp, bivy, none), `light` (headlamp, phone, none), `water_treat` (filter, chemical, boil, none), `water_cap`, `nav` (map, map and compass, GPS, none), `traction`, `ice_axe`, `rope`, `glacier_team` (a rope team with glacier skill: a guide in v1, a trained companion from M6), `tide_table`, `time_source`, `first_aid` (1, 2), `blister_kit`, `sun`, `bug`, `stove`, `fuel`, `canister`, `food_overflow`, `camp_clothes_dry`, `camp_shoes`, `messenger`, `poles`, `outside_bulky`, `top_heavy`, `sketchbook`, `camera`, `binoculars`, `field_guide`, `luxury`, `waterproofing` (liner, cover, none), `pack_liner`, `dry_bag`.

### 6.6 Chekhov's pack: combinations, not single items

Every item has at least two moments where having it, lacking it, or its state (wet, lost, outside, used up, out of battery) changes a page. Many checks read **sets**:

- Stove + fuel + lighter = a hot dinner and a hot drink in a crisis. Stove + fuel and no lighter = a funny page and maybe a kind neighbor.
- Crampons + ice axe + helmet + harness + a rope team (in v1, a guide) = glacier-ready. Any one alone does little.
- Camp shoes + trekking poles = good fords.
- No rain pants + west side + showers = wet legs, then a damp camp, then a cold night (the Soggy Day chain, 8.10).
- Cotton socks + a ford + a cold night = blisters and misery.
- Food left out + a Canada jay = theft.
- Tide table + a watch or a phone with battery = exact odds at headlands. Tide table alone, no time source = still guessing.

The back cover's **What the pack taught** lists what you used every day, what you never used, and what you wished for. That lesson feeds the next book's packing chapter, and the ranger and the margin fox remember it.

### 6.7 Trade-offs that bite

| Dilemma | Choose A | Choose B |
|---|---|---|
| A 50 L pack: canister + bulky synthetic bag + tent is 3 L over | Strap the tent outside: snags, wet fly, ladder -3 | Leave the puffy: colder evenings |
| Rain pants vs. a fourth food day in a full canister | Short on food the last day | Wet legs in showers and wet brush; colder night |
| Ice axe for early-July avalanche chutes above Elk Lake | +25 on snow traverses, 17 oz on a tool loop | Turn-back card likely |
| A day pack "for one night" | — | No room for bag, tent or canister (Appendix A) |
| Extra water on a dry crest | 3 L: +6.6 lb | 1 L: parched by the crest |
| Camp chair vs. dry camp clothes | Layover joy | Warmth reset at camp; feet recover |
| Foam pad outside vs. inflatable inside | Never fails, but snags and gets wet | Warmer; punctures only if strapped outside |
| Sketchbook vs. camera vs. binoculars | Full journal pages (the book's lesson) | Camera: photos are worth less; binoculars: more wildlife |
| The old field guide (20 oz) | Identify what you sketch on the spot; Snowlamp odds +5 | Sketches stay "unidentified" until home |

### 6.8 Sample kits computed from the catalog

From `gear_catalog.json` `pack_guidance.sample_kits_computed` (165-lb hiker):

| Kit | Pack | Weight | Notes |
|---|---|---|---|
| Sensible day hike | Daypack 28 | 11.0 lb | All ten essentials, r = 0.61 |
| Seven Lakes, 3 nights, August | Weekender 50 | 28.1 lb | 35.8 L inside, r = 0.88 |
| Blue Glacier climb, 5 nights | Expedition 80 | 52.1 lb | Heavy; shares the rope with a partner (in v1, the guide carries it) |
| **Day gear to Olympus, 1 night (the trap)** | Daypack 28 | 10.4 lb | Canvas sneakers, cotton tee, jeans, cotton hoodie, a brochure map, a phone, one bottle and the WIC canister; missing 6 of the ten essentials |

The trap kit (`olympus_day_gear_one_night_TRAP`) is **the canonical day-gear kit**: Appendix A uses it, and so does the F.2 assertion.

### 6.9 The traps

Eighteen catalog items are tagged `trap`: cotton tee, jeans, cotton hoodie, cotton socks, canvas sneakers, flannel sleeping bag, plastic tube tent, cast-iron skillet, brochure map, big D-cell flashlight, a whole roll of duct tape, hatchet, deodorant (a smellable), portable speaker, mini drone (prohibited in the park), soft bear sack (not approved) and hang kit (hanging food is prohibited in the park), and a **wooden flower press**. Picking plants is prohibited in the park, so the flower press is the homage's quiet joke (section 10).

---

## 7. Simulation

One deterministic, seeded simulation sits under the pages. The player sees words, pictures and honest numbers; the debug overlay (and, from M6, a Notebook setting) shows the raw values. Full formulas are in `simulation.md`; this section fixes the design, and wins where the two differ.

### 7.1 Clock and beats

- **Tick** = 15 minutes. Each tick runs movement, weather, body meters and the delayed-consequence queue.
- **Beat** = a page the player sees. Beats sit at landmark nodes (camps, junctions, bridges, fords, passes, headlands), in mid-segment slots (0 to 2 per segment, by hiking time) and at forced moments (thresholds crossed, delayed consequences due, darkness).

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

After trail-dark, travel time is multiplied: **headlamp x1.35** (x1.5 on primitive trail), **phone light x1.6** (and about 12% battery an hour), **no light x2.5** and only on maintained trail or beach. Elsewhere, no light means you stop: in Storybook mode that becomes a "night under the stars" chapter.

### 7.3 The hiker

| Meter | Shown as | Driven by |
|---|---|---|
| Energy (with a ceiling) | Legs: Fresh, Steady, Tired, Spent, Bonked | Miles, climb, load, food, sleep |
| Warmth (core-temperature proxy) | Warm: Toasty to Hypothermic | Air, wind, layers, wetness, activity |
| Wet | Dry, Damp, Wet, Soaked (glyph when not dry) | Rain x (1 - protection), wet brush, fords, sweat |
| Hydration | Thirsty, Parched, Dehydrated (glyph when bad) | Sweat, heat, carried water |
| Feet | Happy, Hot spot, Blister, Shredded | Miles, wet socks, boots, load |
| Spirits | Heart: ♥ to ♥♥♥♥♥ | Views, sketches, dinners, rain, mishaps |
| Calories | "hungry" hints | Burned minus eaten; lowers the energy ceiling |

Plus injuries and illness, body weight (`body_lb`, 165 in v1), **fitness** (chosen per book: Easygoing, Casual, Regular, Strong, Mountain goat) and **eight skills** earned across trips: footing, navigation, river, snow, coast, campcraft, first aid and **glacier** (4.2).

The caption line shows four storybook conditions (Warm, Legs, Feet, Heart) and adds a Wet or Thirsty glyph only when it matters. **Two bad conditions at once** trigger a ranger-voice nudge page, *"It might be time to think about the way home,"* with Turn back as a sure choice.

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

Trail class multiplies distance: road walk 0.85, maintained 1.0, primitive 1.25, way trail 1.4, off trail 1.9, snow or glacier 1.8, beach sand 1.3, beach cobble 1.7, coast overland 1.8. Ladders and rope ladders add 10 to 20 minutes each. **Pace** is a morning choice: Easy (x1.15 time, more discoveries), Steady, Push (x0.88 time, more energy, worse footing and feet). "Today's legs" is a small daily draw (about ±7%): *your legs feel springy today.*

**Sanity check** (Regular fitness, light pack): Hoh trailhead to Lewis Meadow, 10.4 mi, about 5.1 h. Hoh trailhead to Glacier Meadows, 17.4 mi and +4,292 ft, about **11.3 h**. Trip reports say 4.5 to 6 h and 9 to 12 h.

**Honest ETAs.** Wherever you choose where to go next, the page shows the ETA from the same formula with a 10th-to-90th percentile band: *"About 6 h. You'd arrive between 9:40 and 10:50 pm, about 2½ hours after dark."*

**The Fork card** (8.2) fires at the first landmark beat (a named camp or junction where stopping or turning is a real option) at which the ETA to tonight's camp lands within an hour of trail-dark or after it. It fires again at later landmarks while that stays true, at most once every two hours of walking. So no one walks into the dark without being asked: the trailhead page already showed the ETA, and the first fork comes at the first real place to stop.

### 7.5 Weather

- **Six zones:** Coast, West valleys (Hoh, Queets, Quinault, Bogachiel), North mid (Sol Duc, Elwha), High (4,000-6,000 ft), East high (the rain shadow: Royal Basin, Dosewallips, Deer Park), Alpine (glaciers and Olympus).
- **Climatology** comes from `park_rules.json`: NOAA 1991-2020 normals (Quillayute 101 in/yr with 203 rain days; Port Angeles 26.5 in), SNOTEL high-country stations, measured monthly **freezing levels** (medians: Jul 12,200 ft, Aug 12,500, Sep 11,600, Oct 8,000, Nov 5,100) and monthly river flows.
- **One park-wide weather story per day.** A single synoptic Markov chain per month (fair, unsettled, wet, storm; tomorrow tends to be like today) drives every zone, so the Hoh valley and Glacier Meadows can't disagree about the same storm. Each zone derives its daily state from it: clear, partly cloudy, fog, overcast/drizzle, showers, rain, storm. The rain shadow stays dry on about 40% of wet synoptic days; the coast adds a fog overlay; High and Alpine add an afternoon **thunderstorm** overlay.
- **The actual weather is generated when the trip is created and never changes.** The **forecast** is derived from the synoptic state, less accurate the further ahead it looks (85% at 1 day down to 45% at 5 days). It covers only trip days within five days of the planning day; later days get the ranger's climatology.
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

Snow slows travel (up to x1.8), asks for footing checks on steep patches, and needs traction or an ice axe on avalanche paths. It is hard and icy before 10 am and soft and postholing after 1 pm. Snowlamp eligibility does **not** use this line: it uses each place's own snow feature (10.6).

### 7.7 Rivers

Each crossing has a type (glacial, snowmelt, rain-fed, tidal mouth), a monthly base depth and a speed. Glacial rivers like the Hoh run **lowest around 8 am and highest around 6 pm**, and every river rises after rain. The hour and the rain live **only in the depth model**: they set the flow index, and no card adds a separate "afternoon melt" modifier.

The ford base is **piecewise linear in the flow index**, so a small change in the river is a small change in the odds:

| Flow index | Feels like | Ford base (clean) | Label |
|---|---|---|---|
| 0.8 or less | Ankle or shin | 97 | Narrated, no choice |
| 1.25 | Knee | 85 | |
| 1.85 | Thigh | 60 | Risky |
| 2.5 or more | Waist | 25 | "Not recommended" |

Between the points the base is a straight line (flow index 1.6 gives 70). A knowledge range of ±0.2 in flow index therefore spans about 10 to 20 points, never a 25-point cliff.

Modifiers come from the shared table (8.5): trekking poles +10, unbuckling the hip belt +3, scouting upstream +5 (20 minutes), tired or cold -5 to -15, each bulky outside item -3, canister on top -4, a heavy pack -5 or -10, and from M6 a partner +5. A gravel-bar camp can get a night card, *the river talks louder*.

### 7.8 Tides

- **Real predictions.** The game ships NOAA high/low predictions for La Push (station 9442396) for the playable years, about 30 KB a year, with per-place time offsets. Between extremes the height follows a cosine curve. For other years and Timeless mode it uses the harmonic model in `park_rules.json` (`tides.game_simulation`).
- **Waves add run-up:** +0.5 ft calm, +1.5 ft in showers or rain, +3 ft in a storm. Storm surge is hidden from the printed table: the narrator says *the sea is running higher than your tide card promised.*
- **Tide gates** come from `coast.json`: for example the cove south of Taylor Point (4.5 ft), Scott Creek to Strawberry Point (4.0 ft), Diamond Rock (2.0 ft, sometimes impassable in daylight for days), Cape Johnson (4 ft, no overland trail).
- **The headland check** uses the margin `m = limit - (tide + run-up)`:

```
m ≥ 1      auto-pass (narrated)
0 ≤ m < 1  base = 85 + 10m      (cap 95)
-1 ≤ m < 0 base = 85 + 55m
m < -1     base = 30 + 20(m+1)  (floor 5)
rising tide -10, falling tide +5
```

  The card always offers **Wait** (showing the next passable window) and **Overland** where a rope-ladder trail exists.
- **The tide table is an item** (1 oz, $2): a booklet you open from the Pack tab (12.19). With it and a working time source, the coast HUD shows the curve: *Now 5.6 ft, rising.* Without it, you get only the narrator: *the sea looks close to the rocks.* If the time source dies (a flat phone and no watch), the tide odds blur back into a range (8.6). **Misreading the table is a player mistake, never a die roll** (Appendix C).
- **Season matters:** summer minus tides fall in the morning, autumn ones in the evening. In September and October 2026 only 7 days each had a daylight low below 1 ft.

### 7.9 Body models in brief

- **Energy and food.** Drain scales with effort-miles, fitness, load and weather. A calorie deficit lowers the energy ceiling. **Bonk** (energy under 15) slows you, hurts footing and makes you cold: the classic way day-gear trips go wrong. Daily eating follows the allowance and rationing rules in 5.6.
- **Water.** Loss per moving hour rises with heat and climbing. Treated water is automatic if you have a filter or tablets. Untreated water carries a small risk per liter (1-4% by source, stylized and labeled as such): a **trail bug** 36 to 96 hours later, or a **giardia epilogue** 7 to 14 days after the trip.
- **Warmth.** A heat balance each tick: air temperature, wind (halved by a shell), rain, insulation reduced by wetness, and activity (climbing makes heat, sitting doesn't). The danger starts when the walking stops.
- **The night.** A sleep-system rating, calibrated to the catalog's `comfort_f`:

```
comfortable down to =
    the bag's comfort_f (assumes an R≥2 pad),
      or 65 °F with no bag
  + pad:  none +10 · R<2 +4 · R2-4 0 · R>4 -2
  - clothes: 0.4 x insulation inside a bag,
             0.7 x insulation without one
  - shelter: tent -4 · bivy -3 · tarp -2
  - hot dinner -2 · hot drink at bed -1
wet: cotton keeps 20% of its warmth, wool or
synthetic 70%, down 25%; a damp bag keeps 60%
```

  A 30 °F bag (`comfort_f` 40) on an R 2-4 pad is comfortable at about 40 °F; with a tent and a hot dinner, about 34; with a down puffy on inside the bag, about 27. So a sensible kit sleeps well in August and can still have a cold night at Glacier Meadows in late September (lows of 25 to 35 °F). The **margin** is the night's low minus the rating. It sets sleep quality, tomorrow's energy and dawn warmth. Below -12 °F there's a hypothermia roll, shown on the bedtime page as its complement (*"Chance you get through the night without dangerous shivering: 88%"*). Bedtime choices change it: eat everything, a hot drink, walk around, ask the neighbors. Reference nights (EN comfort ratings; Glacier Meadows in late September) are unit tests.
- **Feet.** Wear per mile doubles with wet feet and rises with new boots, heavy loads, pushing and beach cobbles. A hot spot always gets a card: tape it now, or keep going.
- **Injuries.** Scrape, mild sprain (pace x1.15), moderate sprain (pace x1.6, Serious), knee strain, cut, sunburn, sting, heat exhaustion, hypothermia. A first aid kit gives a 30% (basic) or 50% (complete) chance to step an injury down one level.
- **Batteries.** One model for every item tagged `needs_battery` (phone, headlamp, GPS, messenger, camera, UV purifier): a charge that drains by use and cold, with a small battery glyph in the margin when it gets low. A phone used as a light drains about 12% an hour; a headlamp lasts about 4 hours on high and 40 on low; a messenger about 10 days. When the phone dies, everything it provided goes with it: the light, the time source (so the tide odds blur again), GPS and the camera.
- **Gear failure, only where the catalog marks fragility.** A canister stove sputters below its cold rating (keep the fuel in your sleeping bag), a filter can crack if it freezes overnight (keep it in your bag too, or carry backup tablets), a tent pole can snap in a storm (a repair kit splints it). Each is a small conditional chance with a mitigation you can pack.
- **Spirits.** Up with sunsets, wildlife, good dinners, swims, sketches and layover mornings; down with rain days, cold, mosquitoes, blisters, theft and a wet bag. Below 20 at camp, the hiker asks to go home: a real choice, Oregon Trail style.

### 7.10 Experience: better information, not better dice

Each trip earns experience in the skills you used. Each level adds +2 on matching checks **and unlocks better foreshadowing**: at `coast` 2 the HUD computes *"You'll reach Strawberry Point about 4:10 pm, tide 3.2 ft and falling"*; at `navigation` 2 way-trail forks are flagged; at `campcraft` 2 the evening page says whether you'll sleep warm; at `glacier` 1 you can be part of a rope team, and at `glacier` 2 the crevasse odds on the ice sharpen from a range to a number. Veterans read the world better.

### 7.11 Other people and living things

Trail popularity x weekend x month sets how likely you meet kind strangers, a ranger patrol (Olympus Guard Station in summer, Royal Lake's summer ranger) or a full camp. Seasonal curves drive mosquitoes (high country, late June to early August), yellowjackets (August-September), bears (berry season, late July to September), the elk rut (mid-September to October) and marmots (June to September).

---

## 8. Decisions and odds

You asked for decisions inside the storybook, Oregon Trail style, with "lots and lots of potential outcomes" driven by what you can and can't fit in the pack, and maybe a % on all decisions or the critical ones. This section is the answer: a % on every rolled decision, and a red diamond on the critical ones.

### 8.1 A decision is a sentence you finish

The page sets up the dilemma, and the buttons finish the sentence. Labels are verbs, 22 characters or fewer, no question marks, 2 to 4 per page (button layout in 12.2).

> *The trail went down to the gravel and simply stopped. Beyond it the Hoh had split into three gray ropes of meltwater, none of them deeper than a knee. Robin...*
>
> `[ Wade across now        83%  (i) ]`
> `[ Camp, cross at dawn     night   ]`
> `[ Turn back to the car    sure    ]`

| Kind | Shown as | Example |
|---|---|---|
| **Sure** (no risk, maybe a cost) | `sure`, or cost icons: clock, food, battery, spirits | *Camp, cross at dawn* (costs a night) |
| **Risky** (rolled; the worst case is Trouble or less) | the chance it goes all right, as a %; the (i) opens *Why these odds* | *Wade across now 83%* (knee-deep, but tired) |
| **Critical ♦** (rolled; some branch can reach Serious, a rescue, the end of the trip, or a Perilous death) | `♦ %`, the fail share in red, a confirming tap, a three-band bar in the Why sheet, and the compass roll | *Climb the ladder ♦ 79% · 21% fall* |
| **Flavor** (no stakes) | no tag | *Count the banana slugs* |

**The rules:**
- Every rolled choice shows its odds, and nothing that can end a trip is ever unmarked.
- **The ♦ is computed, not authored.** The linter walks each card's fail table in each context and marks a choice ♦ only if a branch can reach rung 3 or higher (9.1) or a Perilous death. A soak, lost gear or a mild sprain stays a plain %. So the same ford is plain at knee depth in the morning and ♦ at thigh depth in the afternoon, when "swept" enters its fail table.
- **The diamond must stay rare.** Target: on sensible plans, at most about one ♦ choice per moving day (F.1).

### 8.2 Kinds of event cards

| Card | Fires when | Example |
|---|---|---|
| Landmark | Arriving at a tagged place | High Hoh Bridge; the ladder; Heart Lake |
| Hazard | Conditions + a weighted draw | Showers on the Divide; blowdown; a ford |
| Encounter | Weighted draw | Bear on the trail; elk bull; kind strangers |
| Discovery / joy | Quiet slots | Avalanche lilies; a marmot; sea stacks at sunset |
| Camp | Arrival and evening | Pick a site; dinner; stay up for sunset |
| Night | Only if something happens | Cold night; a visitor; storm; river rising |
| Crisis | A meter crosses a threshold | *Your fingers won't work the zipper* |
| Fork | Dark is coming, camp unreachable, trail closed | *The light is going amber* |
| Chain step | An earlier card set it up | Wet legs, then a damp camp, then a cold night |
| Delayed payoff | A queued consequence comes due | The trail bug arrives |
| Drive / store / trailhead | Those chapters | Elk on the Upper Hoh Road |
| Epilogue | After the trip | Giardia; "the bears here have learned" |

### 8.3 Inside a card

Cards are JSON (full format: `engine.md` section 4). In short:

- **Where and when facets** (node, node type, segment hazard, zone, elevation band, month, time of day, weather) are indexed at build time, so finding candidates for a slot is instant.
- **An `if` expression** reads anything: meters, pack tags, weather, river level, tide, time to dark, flags, history. A small safe expression language (no `eval`, no randomness inside it).
- **Choices** each either resolve to a fixed outcome or **roll**: a base plus labeled modifiers, then a pass outcome and a weighted fail table.
- **Outcomes** carry text variants and typed **effects**: meters, time, food and water, gear wet or lost, injuries, flags at day/night/trip/region/meta scope, queued consequences with foreshadowing, route changes (turn back, take the overland trail, bivouac, end trip), journal entries, score, Leave No Trace, skill experience.
- **Modes.** An outcome may carry a `modes.sierra` override. Death can exist **only** there, and the linter enforces it, so Storybook mode can never kill anyone by accident.
- **Inheritance.** A generic archetype (any braided-river ford) plus a short place patch (the Hoh braids at mile 8) covers the park with personality.

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

### 8.4 How a page's event is chosen

At each beat slot:

1. **Forced first**, in priority order: crisis, fork, delayed payoff, chain step, landmark.
2. **Otherwise the Trail Director draws** from the eligible cards, weighted by the card's weight, how well the weather fits, **gap bias**, novelty (x0.3 if seen in either of the last two trips) and pace (Easy pace favors discoveries).
3. **Otherwise a quiet page** composed from text pools, or the slot is skipped.

**Gap bias is the dungeon-crawler heart.** A *gap* is a tag the ranger's sensible kit for this zone and month expects but your pack lacks: rain pants on the west side in September, traction on the High Divide in early July, a tide table on the coast. Hazard cards that test a real gap are weighted x1.3 in Storybook (x1.8 in Perilous). **The mountain asks the questions your pack can't answer**, but the Director keeps it from asking all of them at once.

**The Director also paces tension.** After a bad outcome, tension rises and quiet joy pages become more likely, then it decays. Budgets cap the decisions:

| Day | Real decisions | One-tap pages | Play time |
|---|---|---|---|
| Moving day | 3-5 | 3-6 | 4-6 min |
| Layover day | 2-3 | 2-4 | 3-4 min |
| Day hike | 3-4 | 3-5 | 4-5 min |
| Evening and night | 1-2 | 1-2 | 1-2 min |

At most 2 hazard cards per day in Storybook (3 in Perilous), not counting forced ones.

### 8.5 How the % is computed

**One formula, everywhere:**

```
p = clamp(base + Σ labeled modifiers, 5, 97)
```

- **This p is the chance of a clean success.** The button shows the chance you make it at all, clean or shaky, which is p plus the shaky band (8.8).
- **Additive percentage points**, so a player can check the arithmetic in the Why sheet ("Base 90, dark -10, tired -10 = 70 clean").
- **Clamped 5 to 97.** Nothing is certain on a mountain, and nothing is hopeless. Cards may narrow the clamp, never widen it.
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
| Skill, per level | +2 | +2 | +2 |
| Each companion helping, cap +10 (M6) | +5 | +5 | +5 |
| Push pace | -5 | — | -5 |
| Fog / whiteout | — | — | -15 / -30 |
| Wet rock (rain in last 3 h) | -5 | — | — |

(Coast, snow and dexterity columns are in `simulation.md` 9.3.)

**Routine checks.** When p ≥ 95 and there's no meaningful alternative, the check is still rolled but narrated, not asked (*"Robin hopped the braided channels"*), and a failure can only be the mildest band. Honest, and it keeps taps down.

### 8.6 Knowledge blurs or sharpens the number

This is what makes **knowing** as important as **carrying**.

- A modifier can be **knowledge-gated**: the tide, the river's mood today, the weather this afternoon, which fork the way trail takes.
- If you lack the knowledge (no tide table, no forecast, no map, didn't watch the dipper, skipped the WIC briefing), the gated modifier is unknown to you. The tag shows the **range of p over that modifier's possible values**, for example `40-80%`.
- **The roll always uses the true value, and the true value always lies inside the range.** Because the range comes from the modifier's real spread, not from a blur around the answer, the middle of the range is not a giveaway.
- If the range is 50 points or wider, the tag reads `??`, which is itself a strong hint.
- The Why sheet shows the gated row honestly: `? Tide (no tide table): -40 to +10`.
- **Ways to sharpen it:** carry the item (tide table, map), get the ranger's briefing at planning, spend time on the page (*Wait and watch the water* for an hour; *Study the map* for 10 minutes), watch an animal helper, have walked this way before, raise the skill.

On the coast this makes a 1-oz tide table an item of real power. On the High Divide in fog, a map and compass turn `??` into `92%`.

### 8.7 What shows a %, and the words option

| Decision kind | Shows |
|---|---|
| Rolled, can reach Serious or worse | ♦ + "made it" % + the fail share in red; the Why sheet adds a three-band bar and an "if it goes badly" line |
| Rolled, smaller stakes (a soak, a lost sandal, a mild sprain) | "made it" % |
| Rolled, tiny stakes (spot the marmot, sketch before the fog) | a small grey % |
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

A range wider than 30 points reads *hard to say*. The prose carries the hunch naturally in every mode: *"It looked likely enough."*

**Each odds form is introduced the first time it appears,** with one line from the narrator or the margin fox. The profile remembers which ones you've seen, so none repeats:
- the first %: *"The little number is how likely it is to go all right. Tap the (i) to see why."*
- the first range: *"A range means you don't know something yet. Find out, and it narrows."*
- the first `??`: *"Two question marks: you really don't know. Look, wait, or ask."*
- the first ♦: *"A red diamond: this one could go badly wrong. The red number says how often."*
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

**The number on the button is "made it": clean plus shaky.** It is the chance of the outcome the player is actually deciding about, so `79%` means about one time in five it goes badly. The fail share is never more than 70% (p is at least 5), and "made it" runs from 30% to 99%. On ♦ choices the fail share sits beside the % in red, and the Why sheet shows all three bands and the fail table:

```
Climb with your pack on
You make it ............ 79%
███████████░░░░░▒▒▒▒▒▒
clean 57 · shaky 22 · fall 21
If you fall: 80% bruised,
18% sprained ankle, 2% badly hurt
```

**The compass roll** plays only on ♦ choices, after the confirming tap: a compass rose fills the picture, its dial painted with the same three bands (green clean, yellow shaky, red fail). The needle spins about 1.2 seconds with PC-speaker ticks and comes to rest **somewhere inside the band it landed in**, not at the exact roll, so a player who turns back a page can't read the number and nudge the odds just past it. Raw rolls appear only in the debug overlay and, from M6, the post-trip Notebook. A tap skips the spin. Ordinary risky choices go straight to the outcome page.

### 8.9 Compound choices: an honest look-ahead

Some choices aren't one roll: *push on to Glacier Meadows in the dark*, *wait for the tide*, *hike out tomorrow with 250 calories*. For these, the game plays the situation forward many times from the current state and shows how it tends to end.

- **No peeking.** Each run resamples everything the player doesn't know, from the player's own information: the weather from the forecast for each lead time (or climatology beyond it), the river's hidden noise from its prior, the tide from its prior when no tide table is carried. The trip's real stored weather, river and tide are never read. The look-ahead is exactly as good as what you know, and it uses its own random stream, so the trip's dice are untouched.
- **Two named policies.** Look-ahead bars and the Trip Outlook use *follow the plan (or this choice), and deviate only at forced crises*, so they tell you what happens if you stick to it. The test bots use their own styles, including *sensible* (F.2).
- **On the button:** one word and a small three-color bar, `Push on · mostly trouble`. The numbers are in the Why sheet:

> **Push on to Glacier Meadows** · Arrive in OK shape **20%** · Arrive in serious trouble **60%** · Need help **20%**

- **Budget:** the runs happen in a Web Worker, up to 400 within about 50 ms for a choice. With 400 runs the results round to 5%; if fewer finish, they round to 10% and read *about*. The Trip Outlook runs whole trips in the same worker in the background while you read the ranger's page, refining for up to about a second, and never blocks a page.

### 8.10 Chains, delays and memory: why things happen *because*

**Delayed consequences** go into one queue. The odds were shown when you chose; the foreshadow line appears on the current page.

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
| Stayed up at a clear high camp with a sketchbook | Blue hour | Snowlamp eligible |
| A bear got your food | **Your next trip to that region** | *The bears here have learned* |

**Chains** are linked cards. The **Soggy Day chain**: showers on the Hoh with no rain pants (keep walking, or wait under a cedar for 45 minutes) → a damp camp (dry camp clothes, a fire if legal, a big hot dinner, or bed early in damp clothes) → *the cold hours* at night (the margin breakdown shows "damp clothes in bag -4 °F") → a grey morning (dry layers in the sun, press on, or turn around). The same first card plays four different ways depending on `rain_bottom`, `camp_clothes_dry`, `stove`, the sleeping bag and the elevation (fire rules).

**Memory** stores small facts (`wet_from = "the Hoh"`), so later pages can echo them: *Her socks were still damp from the Hoh.*

### 8.11 One ford, five ways

The same braided-river card, with the gear and the hour changing everything. Every number comes from the shared tables (7.7, 8.5); the card bench regenerates this table as a golden test (F.4).

| Situation | Clean → shown | If it goes wrong |
|---|---|---|
| Knee-deep (flow 1.25) at 8 am, poles, light pack | 95 → narrated | At worst a cold soak |
| Same river, no poles, tent and pad strapped outside (-6) | 79 → 90% | Mostly a soak; about 1 failure in 5 loses an outside item |
| Thigh-deep (flow 1.85) at 3 pm, no poles, heavy pack (-5), tired (-10) | 45 → ♦ 70% | 30% goes badly: soaked, a lost item, or swept (about 4% overall) |
| Same, but you camped and crossed at 8 am (flow 1.3: base 83; heavy pack -5) | 78 → 89% | It cost the evening; a soak at worst |
| The afternoon again, but a dipper was bobbing on a rock and you watched | +5, and the range narrows | — |

If the soak happens, the damp evening chain is queued **only if you have no dry camp clothes**. The pack decides whether a wet crossing becomes a bad night.

### 8.12 How many outcomes, measured

Raw path counts are effectively infinite (about 10^16 per itinerary) and therefore meaningless. What matters is variety the player can feel, so the harness measures these (`engine.md` 6):

- **Plans alone:** the 15 main Hoh camps give about **140,000 sensible out-and-back itineraries** of 1 to 5 nights. Across the park's loops, traverses and trailheads, millions.
- **Authored content:** about 260 cards and 730 choices in v1.0 (about 600 cards and 1,700 choices at full park; 14.1). Across about 36 context classes (weather x light x gear bucket), that is at most about 26,000 distinguishable moments in v1.0. Not every class fits every card, so the real number is lower; it is measured, not claimed.
- **Story-signature uniqueness** (the ordered notable cards, choices and outcomes, plus the ending): at least **90%** of 2+ night trips on the same template are unique.
- **Ending headlines** ("walked out early, cold night, Glacier Meadows, day 2"): at least **25 per multi-night template**.
- **Repeat rate.** *Notable* cards are the ones the Director draws; forced landmarks and chain steps don't count, because they repeat by design. A 2 to 3 night trip draws about 8. With at least 32 eligible notable cards per coverage cell (14.2) and the novelty weight, two consecutive trips on the same template share **2 or fewer** of them (median).
- **Pack sensitivity:** removing any meaningful tag from a sensible kit changes something measurable somewhere: the ending, the score, spirits, field guide entries or Leave No Trace (F.2).

### 8.13 Field Notes: the cause trace

Every effect records the modifiers and earlier choices that produced it. After the trip, the back cover's **Field Notes** turn the biggest causes into plain words and tips:

> **Why the night at Glacier Meadows was so cold:** no sleeping bag (a 20 °F bag is worth about 35 °F of comfort), no pad (10 °F colder), a cotton hoodie soaked by the evening rain (wet cotton keeps a fifth of its warmth). The kind neighbors' puffy, sit pad, tarp and cocoa (about 22 °F together) kept it from being worse.
> **Next time:** a 20 °F bag, a pad, a tent and a hot dinner would have made you comfortable down to about 24 °F: 10 °F on the warm side of that night.

This is the Oregon Trail learning loop made explicit, and the main tool for checking the game feels fair.

### 8.14 Seeds and save-scumming

- Randomness comes from one seeded generator split into named streams (weather, environment, permits, director, rolls, effects, text, art, store, lookahead). **Weather never shifts because you dawdled**, and editing text never changes an outcome.
- **Rolls are keyed to content, not to page counts:** `hash(trip seed, node, card, choice, trip day, attempts here)`. An optional page inserted before a check (a sketch, a rest, a different chore order) changes nothing. Turn back a page and make the same choice at the same ladder on the same day, and you get the same result, the King's Quest way: a fall is a puzzle you solve by changing your approach (haul the pack up on a rope, wait for morning, take the overland trail), not by reloading. A different choice, a new day, or a genuine second attempt (trying the ford again after failing it) gets a fresh, equally honest roll.
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
| 4a | Trip over | Walk out early | *The End, Sooner Than Planned* |
| 4b | Rescue | Rangers walk you out, a carry-out, a helicopter (Olympus) or Coast Guard (coast) | *The End, With a Little Help* |
| 5 | Death | **Perilous mode only**, at flagged moments | A Sierra death page |

**Escalation rules:**
1. A rung goes up only through a failed check, a crossed threshold, or a delayed payoff the player risked knowingly.
2. Trouble becomes Serious only after a crisis card the player saw.
3. Serious always offers a safe-ish option.
4. In Storybook mode nothing goes above 4b.

### 9.2 Help and rescue

In Storybook mode the worst case is help arriving, and who helps depends on what you packed and planned.

| Way out | Needs | Time to help |
|---|---|---|
| Walk out yourself | Legs | ETA by formula (look-ahead %) |
| Kind strangers | Other hikers nearby (popularity, weekend, month) | Now ("Ask for help": base 70%) |
| Ranger patrol | A ranger in the area (station, season) | 1-6 h |
| Send a companion (M6) | A party, and someone fit to go | Trailhead ETA + 2-4 h |
| Satellite SOS | `messenger` with battery | Helicopter in 3-6 h if it can fly; else ground team 8-16 h |
| Wait | — | 2-25% per hour by trail traffic; once a friend reports you overdue (planned exit + 12 h, 3.7), a search adds its own chance each hour |

Rescue is told gently and is never embarrassing. No bills, no lecture; the lesson goes in the Field Notes.

> *The ranger's name was Ines, and she had a thermos, which is the second-best thing a person can have on a cold mountain. The first-best thing is someone who knows where you are.*

### 9.3 The endings

| Ending | When | Final plate |
|---|---|---|
| **The End** | Trip finished as planned, never reaching Serious | The car at golden hour, boots on the dashboard |
| **The End, the Hard Way** | Finished as planned, but reached Serious on the way | The car in the rain, the hiker asleep in the driver's seat with the heater on |
| **The End, Sooner Than Planned** | You turned back (any reason) | The trailhead sign: *"The mountain will keep."* |
| **The End, With a Little Help** | A rung-4b rescue | The Olympus Guard Station porch, or a helicopter as a dot over the valley |
| **The End of the Blank Page** | You found the Snowlamp (combines with any ending above) | Gold-bordered plate of your sketch |
| **The End (Rather Abruptly)** | Perilous-mode death | The scene in grays |

*The Hard Way* is honest about a trip that technically worked: the finish bonus is halved (9.6), and the Field Notes open by default instead of waiting behind a tap. "Happy" in the targets (F.1) means plain *The End*, never the Hard Way.

Each volume is titled from what happened: *The Hiker Who Forgot the Stove*, *Too Much Cheese on the High Divide*, *The Night of the Raccoons*, *A Soggy Story*.

### 9.4 The two modes

| | **Storybook** (default) | **Perilous** (opt-in, per book) |
|---|---|---|
| Death | Never | Only at flagged Perilous moments, after a failed check and a shown % |
| Worst outcome | A gentle rescue | A Sierra death page with a real Ranger's Note |
| Director | Gentler gap bias (x1.3) | Harsher (x1.8), one more hazard a day |
| Going back | None after Start walking (autosave every page) | Turn Back a Page, Back to Last Camp, Restart Trip |
| Rescue | Free, kind | Possible (strangers, messenger), with a dry joke about the bill |
| Badge | — | A small red diamond ribbon on the book's spine |

Perilous is chosen on the New Book page: *"Perilous: the old rules. Some stories end on the mountain. (You can always turn back a page.)"* The rolls are identical in both modes; only the top rung differs. Because rolls are keyed to content (8.14), turning back a page and making the same ♦ choice gives the same result; the death page says so (12.17).

### 9.5 Perilous moments

Death needs a failed check on a ♦ choice, then a second roll:

| Moment | Death roll after the failure |
|---|---|
| Ladder or exposed washout, worst fall band | 50% of the 2% band |
| Ford at waist depth (flow index 2.5 or more) | 20% |
| Headland attempt more than 1 ft over the limit | 25% |
| Crevasse on the Blue Glacier without a rope team (4.2) | 30% |
| Hypothermia roll failed, night margin below -25 °F, no shelter | 15% |
| Staying on an exposed crest in a thunderstorm (a choice) | 2% |
| Off trail in fog near a cliff | 10% |

**Death page principles:**
1. **Fair:** only after a ♦ choice with shown odds and at least one in-story warning.
2. **Never caused by an animal.** Bears, elk and cougars are neighbors, not monsters. The bear card has no Perilous death by design.
3. **Never gory, never about real tragedies.** The real 2026 cross-country fatality near Mount Appleton in the research is never dramatized; it only justifies the stay-on-trail mechanic.
4. **Always teach:** a Ranger's Note gives one real safety fact.
5. **Always offer** Turn Back a Page (with the line *"The mountain remembers. Try a different way."*), Restart the Trip (keep the plan) or Close the Book.

> **The Pacific Read the Tide Table For You**
> *Robin had a tide table. Robin did not read the tide table. The headland, which has been reading tide tables for ten thousand years, was not surprised.*
> **Ranger's Note:** Some coast headlands can only be rounded at low tide. Know the tide for each point, and use the overland trails (look for the round red-and-black markers).

### 9.6 Scoring

**The status line:** `Score: 22 of 131`. The maximum is computed for your itinerary when the permit is stamped: every landmark, likely sunset, field guide entry still to find, the Snowlamp if the plan visits a Snowlamp place, plus fixed budgets for wise choices and Leave No Trace acts. Bigger trips have bigger maxima, but finishing is worth more than overreaching. Like King's Quest, **the score only goes up**, and it can never pass the maximum.

| Points | For |
|---|---|
| 1 | Looking at something new (tap the picture), first time per thing per book |
| 2 | A sketch (3 if fine), first sketch per subject per book |
| 3 | A wise, safe choice when it mattered (waiting out the river, turning back in a storm), up to the itinerary's budget |
| 2 | A Leave No Trace act (food stored right, trash packed out, durable campsite), up to the budget |
| 3 | A sunset watched on a clear evening |
| 5 | A new field guide entry |
| 5 | A landmark or viewpoint reached (2 on a repeat visit) |
| 10 | Reaching each planned camp |
| 20 | Finishing as planned (10 for the Hard Way or Sooner Than Planned) |
| 25 | The Snowlamp, sketched or just looked at (picked: 10, and no gold page) |

Sketching the same marmot ten times earns its points once. **Replanning** (3.7) recomputes the maximum for the new route without ever lowering the score already earned.

**Leave No Trace** is a separate ledger (starts at 100) shown on the back cover: off-permit camp -5 (-10 on a meadow), food lost to wildlife -15, a fire above 3,500 ft or during a ban -20, shortcutting switchbacks -5, feeding wildlife -10, picking plants -10, packing out someone else's trash +3.

### 9.7 The back cover

```
 THE HIKER WHO FORGOT THE STOVE
 a trip of 2 nights on the High Divide

 [route map, dotted; tents; ★ Snowlamp]

 Miles 19.1      High point 5,474 ft
 Nights 2        Pages 52
 Sketches 4      Close calls 1
 Score 88 of 120 Leave No Trace 100

 WHAT THE PACK TAUGHT
  Every day: wool socks, rain jacket
  Never:     the ukulele
  Wished for: a lighter

 FIELD NOTES
  A cold dinner is still a dinner, but
  a lighter weighs one ounce.

 [Try this trip again]
 [Plan another trip] [Reread] [Share]
```

**Try this trip again** is the Oregon Trail loop made one tap: it keeps the plan and the dates, skips the ranger desk, and goes straight to the store and the pack with your last pack loaded. You choose **same weather** (the same seed: change the pack, see what changes) or **new weather**.

**Share the Cover** renders the cover (title, picture, moral) as a PNG through the iOS share sheet. No server needed.

### 9.8 Across books

- **The bookshelf** keeps every volume to reread, page by page (E.6).
- **The field guide** fills across books (section 10).
- **Skills** grow (7.10).
- **Region memory:** if a bear got your food, the next trip into that region meets a bolder bear.
- **Trip codes:** `HOH4-K7QM-2Q9F` shares a template, a seed and the profile values the engine reads. *Same mountain, same weather, your own pack.* When friends compare the same code, novelty and the Snowlamp's first-book rule are switched off so the trips match.
- **From M6:** badges (Every camp on the Hoh; Seven Lakes, all seven; Royal Basin; Tide Reader, for every South Coast headland rounded with at least 1 ft to spare) and an optional "trail of the day" that gives everyone the same weather.

---

## 10. The Golden Glow homage

### 10.1 What we borrow, and what we don't

**We borrow the shape** of Benjamin Flouw's *The Golden Glow* (Tundra, 2018): a collector, an old botany book with one picture missing, packing a backpack shown as a labeled spread, field-guide spreads of trees and flowers, a mountain climb with animal neighbors who help, a summit with no flowers, a sunset, a golden discovery in the snow, and the choice to draw it rather than take it.

**We do not borrow** its text, illustrations, character designs, names or its plant's name. Our protagonist is the player's own hiker. Our plant is the **Snowlamp**. Every line of prose is original. The colophon acknowledges the book. A lint rule (T04) blocks the book's title, names and phrases anywhere outside the colophon.

### 10.2 The old field guide and its blank page

*A Pocket Flora & Fauna of the Olympic Mountains* is an invented, long-out-of-print field guide. The hiker found it at a library sale in Port Angeles. It has hand-colored plates, pencil notes from a previous owner who signed only **"E.W."**, and a small fox doodled in many margins. Near the back, under *Rare & Uncertain*:

```
  No. 104   THE SNOWLAMP
  (no Latin name given)
  ┌──────────────────────────┐
  │        [ no plate. ]     │
  └──────────────────────────┘
  A small golden flower, reported by
  a very few travelers, growing above
  the last trees where the snow stays
  into summer. All accounts agree it
  is seen only after the sun has gone.
  No specimen has been kept.

  (pencil, E.W.:) "Don't look for it.
   Wait for it."
```

**The prologue** (first book only, about 6 pages): a rainy evening at the kitchen table; the old book falls open; trees, flowers, the marmot, each with a plate except one; the blank page; the margin fox seems to point toward the mountains (*"There are no foxes in the Olympic Mountains," the narrator admits. "This one has always lived on paper."*); the hiker decides to go and look. *"And that, more or less, is how every good trip begins: with a page that is missing something."*

The guide also exists as a pack item, **the old field guide** (20 oz): heavy, but it identifies what you sketch on the spot and nudges the Snowlamp odds.

### 10.3 The field guide is the lasting collection

Entries start as a printed plate, a "plate missing" box, or "seen but not drawn". You fill them by **seeing** (tap the picture) and **sketching**. All entries are real Olympic species and features, with 1-3 sentences of original lore: *"Olympic marmot. Found in these mountains and nowhere else on Earth. Whistles when worried, which is often."*

| Section | Entries | Examples |
|---|---|---|
| Trees | 12 | Sitka spruce, western redcedar, bigleaf maple, subalpine fir, Alaska yellow-cedar |
| Flowers and small plants | 24 | Avalanche lily, glacier lily, Piper's bellflower, Flett's violet, Olympic Mountain groundsel, devil's club |
| Ferns, mosses, lichens, fungi | 12 | Sword fern, licorice fern, step moss, lettuce lungwort, snow algae |
| Birds | 14 | American dipper, Pacific wren, varied thrush, Canada jay, sooty grouse, tufted puffin |
| Mammals | 16 | Olympic marmot, Roosevelt elk, black bear, fisher, mountain beaver, gray wolf (absent) |
| Water and shore | 12 | Coho salmon, Olympic torrent salamander, banana slug, ochre sea star |
| Sky and weather | 6 | Alpenglow, a lenticular cap on Olympus, fogbow, the Milky Way |
| Curiosities | 7 | Nurse log, krummholz, sea stack, glacial erratic, tarn, moraine, cairn |
| Rare and uncertain | 1 | **No. 104, The Snowlamp** |
| **Total** | **104** | |

The counter reads `Field Guide: 23 of 104`, a quiet nod to the repo name that assumes nothing about what "104" means (your call; see [Decisions needed from you](#decisions-needed-from-you)).

### 10.4 Animal helpers (real Olympic wildlife)

Animals help **by behavior**, and the narrator translates. Each gives a concrete benefit when you **pay attention** (look, wait, sketch), which rewards slowing down: the book's real theme.

| Book role | Animal | What it seems to say | What it does in the game |
|---|---|---|---|
| The wise, unhurried elder | Black bear | *There is enough for everyone, if everyone keeps their food to themselves.* | Wait, detour or back away; good food storage means it passes camp "like a large, slow thought" |
| The guide who knows the way | Roosevelt elk | *Not there. Here.* | Watch the herd cross: ford +10. In the rut, give bulls a wide berth |
| The weather prophet | Olympic marmot | *Two whistles: weather coming.* | Sharpens the next weather forecast; hints "pitch the tent before 4" |
| The river reader | American dipper | *Where I walk, the water is honest.* | Next ford +5, and the range narrows |
| The trickster | Canada jay | *Is that for me?* | Steals unattended food; feeding it costs Leave No Trace |
| The coastal trickster | Raccoon | *What's in the bag?* | Night raids on food outside the canister |
| The dusk guide | Black-tailed deer | *This way, before dark.* | Late with no light: following her is a sure way to camp |
| The voice in the fog | Varied thrush | *One long note, then silence.* | In fog, "follow the thrush" hints at a junction |
| The quiet watcher | Cougar | *Nothing; only tracks.* | Tracks for the journal; a rare tense page, always survivable |
| The absent friend | Gray wolf | *...* | Only in a ranger's story and once, the wind in the fog |
| The paper companion | The margin fox | — | The hint system (10.7) |

**The absent wolf.** Wolves were extirpated from the Peninsula early in the 20th century. The wolf's entry has a printed plate and E.W.'s note: *"Not seen here since before my time."* The ranger tells its story at the WIC, and once, in fog high on a pass, *the wind made a sound that was almost, but not quite, a howl.* The entry is completed by hearing the story; the wolf can never be "seen". A respectful nod to the book's Wolf that stays true to the park.

**The fox.** Red foxes never occurred on the Olympic Peninsula (NPS). So our fox lives only on paper: E.W.'s doodle, the hint-giver, asleep on the closed book at The End. It never appears in a park scene. (The catalog's `plush_fox` luxury item is allowed in your pack, of course.)

### 10.5 Sketching: the verb of attention

- **You need** the pocket sketchbook and pencil (`sketchbook_pocket`, 6 oz). Watercolor pencils add color. The old field guide identifies what you drew.
- **When:** any page with a sketchable hotspot shows a pencil in the caption line. On camp pages, *Sketch* is a camp tile.
- **How it feels:** tap Sketch, the picture zooms 2x on the subject, then **press and hold**. While you hold, the subject redraws as line work only, the same vector commands with fills switched off, in pencil gray on paper white, one line at a time with a soft scratch tick. A full hold (about 2.5 s) gives a *fine* sketch; letting go early gives a *quick* one. A marmot may duck into its burrow mid-sketch, and the sketch freezes there, which is charming rather than a failure.
- **It costs game time** (20-40 minutes), so the sky palette moves a notch. On a long day that is a small, real trade-off.
- **It is nearly free to build:** every picture is vector commands, so a sketch is a second render mode with ±1 px jitter. Every place and animal in the game is sketchable with no extra art, and a sketch is stored as about 100 bytes (a recipe reference, not pixels).
- **Camera and binoculars** are honest alternatives: photos fill entries at lower value, binoculars find more wildlife. Sketching is worth the most, which is the book's lesson made mechanical.

### 10.6 The Snowlamp

**Where it can appear.** On an evening at a place with a **snow feature**: a glacier or snowfield within sight and a short walk, in the months that feature lasts. You must be there at sunset: at a camp, or at a viewpoint you stay at past sunset with a headlamp for the way back. Each node carries a `snow_feature` with month windows by snow year, and a `snowlamp_weight`. The melt-out line (7.6) is not used, because a drift-fed snowfield or a glacier outlasts the general melt.

| Place | Snow feature | Normal-year months |
|---|---|---|
| Glacier Meadows and the Blue Glacier moraine | The Blue Glacier (perennial) | Jun-Oct |
| Snow Dome and Caltech Rocks | On the glacier (with a rope team) | Jun-Oct |
| Upper Royal Basin | Remnant snowfields and the small glacier under Mount Deception | Jul-Sep |
| Anderson Pass (M5) | The vanishing Anderson Glacier | Jul-Sep |
| Bogachiel Peak | The north-face snowfield above the Seven Lakes Basin | Jul to about Aug 20 |
| Lunch Lake, Heart Lake, the High Divide crest | Basin and crest snowfields | Jul to about Aug 10 |
| Grand Valley and Grand Pass (M5) | Snowfields | Jul-early Aug |
| Appleton Pass, Oyster Lake (M5) | Snowfields | Jul |
| Lake Constance (M5) | Snowfields under Mount Constance | Jul-Aug |
| Hurricane Hill (M5) | Snow patches; day hike only, if you stay for sunset with a headlamp | Jun-Jul |

Windows shift about two weeks earlier in a low snow year and two to three weeks later in a high one. The Bogachiel and High Divide windows are design estimates to confirm against August trip reports. In season, the planner marks these places with a tiny pencil star (3.1).

**The odds, per eligible evening:**

```
P = sky x ( 0.30
          + 0.15 stayed through the whole sunset
                 (needs a warm layer)
          + 0.10 turned off the headlamp
          + 0.05 the old field guide in the pack
          + 0.05 a second eligible evening
                 at the same place (layover)
          + the place's bonus )  (Snow Dome +0.15)
sky = 1.0 clear, 0.6 partly cloudy,
      0.1 overcast, 0 rain or fog
```

Each eligible evening rolls on its own, and the trip's chance is `1 - (1 - P1)(1 - P2)...`. With August high-country skies (an average sky factor near 0.57), a fully engaged player gets about 31% from one evening and about 55% from a layover's two, which is where the targets sit: **25-40% of sensible trips with one eligible evening, 45-60% with a high layover** (F.1). These constants are a starting point; the harness tunes them until the targets hold in each zone and month.

**The first book.** The first clear evening at a Snowlamp place in a player's first eligible book is **certain**, provided they stay out for the sunset (the fox points at *Watch the sunset*). After that, normal odds apply, and a later sighting adds *"Seen again"* to the entry. This replaces a pity counter: no cross-book counter changes outcomes, trip codes are unaffected (9.8), and a Perilous restore can't re-trigger it, because the guarantee is spent the first time the glow is shown.

**When the trip can't have it.** On a trip with no Snowlamp place, or no clear evening, the thread still continues. A **dusk foreshadow page** appears at the best evening of the trip: a gold glint across the valley that turns out to be someone's headlamp, and E.W.'s pencil note in the margin, *"Higher."*

This ties the homage to planning: **a layover at a high camp is a beautiful reason to plan one**, a warm jacket lets you stay for sunset, and a headlamp is needed afterward, with turning it off a choice. The ranger's first-book suggestions always include one eligible trip, with the hint *"If you're looking for something that only shows at dusk, camp high, near snow, and stay up late."*

**The sequence** (6-8 pages, the emotional peak of the game):
1. **Arrival:** *"There were no flowers here. There was stone, and snow, and a wind that had come a long way to say nothing in particular."*
2. **Camp:** *Make camp*, then the tile *Watch the sunset* (needs a warm layer, or you last 10 minutes).
3. **Sunset:** the palette steps to dusk. The snow goes pink with alpenglow, and the peak burns at its top edge.
4. **Blue hour:** the snow turns pale blue. A choice: *Turn off the headlamp / Keep it on / Go to bed.*
5. **The glow plate** (full-bleed, chrome hidden): one pixel of gold in the blue snow begins to cycle and grows over three seconds into a small 5x5 star, the only warm color left in the picture (its colors are exempt from the night palette, 11.5). *"And there, where the snow was bluest, something small was shining. Not like a lamp. More like a lamp remembering."*
6. **The choice** (no odds, no costs; this is not a test): **Sketch it / Pick it to take home / Just look.** If a camera is in use, *Take a photograph* comes out as a perfectly exposed photo of blue snow and nothing else. *"Some things don't photograph."*
7. **Outcomes:**
   - **Sketch it:** the hold-to-sketch, but the lines are **gold**, the only colored lines the pencil ever makes. No. 104 fills in. Ending: **The End of the Blank Page**, gold-bordered.
   - **Pick it:** no scolding. By the tent it has gone gray; by morning it is a small brown curl. The field guide gets a pressed brown petal and *"Picked, faded."* Some points, no gold page, and Leave No Trace -10 (picking plants is prohibited in the park). You can find it again another time and choose differently.
   - **Just look:** the page stays blank but gets a single gold star and the word *"Seen."* A full, equal success, gold border, for players who understand.
8. **Night page:** *"And far away, the glacier went on being very old."*

**The afterword** on the back cover honors the real endemic flowers (the golden Olympic Mountain groundsel, Piper's bellflower, Flett's violet) and the glacier lily, without claiming the Snowlamp is one of them.

### 10.7 The margin fox: hints without a tutorial

The fox lives in the margins of the planning pages, the field guide and the pack spread, and gives **nonverbal hints** in 2-3 frame doodle animations:
- **points** at the rain jacket when showers are forecast and it isn't packed;
- **shivers** when no warm layer is packed for a high camp in September;
- **taps its wrist** when Day 1 is over 12 miles with 3,000+ ft of gain;
- **holds a tiny tide table** on a coast plan with no tide table packed;
- **sleeps** when everything is fine. The best feedback in the game.

Tap the fox to turn its gesture into one line of narration. Settings: Quiet, Helpful (default), Off. On the very first packing chapter, the fox *is* the tutorial, and the first time each kind of odds appears, the fox or the narrator explains it in one line (8.7).

---

## 11. Art direction and the scene system

### 11.1 The palette: the 16 EGA colors

There are **16 colors on screen at any moment, drawn from the EGA's 64.** Daytime pages use exactly the classic default 16 below, which is the KQ look; dusk, blue hour and night swap a few slots for other EGA colors (11.4), as real EGA hardware could. Paper is EGA white, text is black, and box borders are dark red, like AGI message boxes.

| # | Name | Hex | Typical use |
|---|---|---|---|
| 0 | Black | `#000000` | Outlines, night, text |
| 1 | Blue | `#0000AA` | Deep lakes, upper sky, shadows on snow |
| 2 | Green | `#00AA00` | Conifer forest, moss |
| 3 | Cyan | `#00AAAA` | Glacial rivers (the Hoh's milky teal), ice |
| 4 | Red | `#AA0000` | Box borders, paintbrush, fall huckleberry, the hiker's jacket |
| 5 | Magenta | `#AA00AA` | Heather, dusk sky |
| 6 | Brown | `#AA5500` | Trunks, trail, the bear, the elk, driftwood |
| 7 | Light gray | `#AAAAAA` | Rock, fog, gravel bars, clouds |
| 8 | Dark gray | `#555555` | Far ridges, talus shadow, sketch lines |
| 9 | Light blue | `#5555FF` | Day sky, lupine |
| 10 | Light green | `#55FF55` | Meadows, lit moss |
| 11 | Light cyan | `#55FFFF` | Horizon sky, glacier highlights |
| 12 | Light red | `#FF5555` | Fire, salmon, alpenglow accents |
| 13 | Light magenta | `#FF55FF` | Wildflowers, watermelon snow |
| 14 | Yellow | `#FFFF55` | Sun, glacier lilies, banana slugs, headlamp, **the Snowlamp** |
| 15 | White | `#FFFFFF` | Snow, paper, surf, text boxes |

### 11.2 Resolution: AGI 160x168 with fat pixels

All three proposals agree: **160x168, the KQ1-3 resolution**, with each pixel wider than tall. At 160 columns on a phone, every pixel is a visible, deliberate block, which is the "low-res chunky pixels" look. The picture takes about the top quarter of an iPhone 15, leaving room for the narration below, like a picture book.

**Crisp scaling:** render into a 160x168 index buffer, then draw it once onto a canvas whose backing store is a whole-number multiple in *device* pixels (`sx` across, `sy` down, chosen near the original wide pixel shape), with smoothing off.

| Device (portrait) | Pixel ratio | sx x sy | Picture (pt) |
|---|---|---|---|
| iPhone 15/16 (393 x 852 pt) | 3 | 7 x 4 | 373 x 224 |
| iPhone 16 Pro (402 pt) | 3 | 7 x 4 | 373 x 224 |
| Plus / Pro Max (430-440 pt) | 3 | 8 x 5 | 427 x 280 |
| iPhone 13 mini (375 x 812 pt) | 3 | 6 x 4 | 320 x 224 |
| iPhone SE (375 x 667 pt) | 2 | 4 x 2 | 320 x 168 |

**Short screens** (under about 700 pt tall, such as the SE) use 4x2, AGI's familiar 2:1 pixel, so the picture is 168 pt tall instead of 252 and the text gets the room (12.1).

**Tall plates** (160x320) are for about 8 full-bleed moments: the cover, the first view of Olympus, the Snowlamp, The End. On short screens they also use 4x2 (320x320 pt), which leaves room for three choices below.

### 11.3 Pictures are small programs

Each picture is a text file of drawing commands, like AGI's PICTURE resources: easy to hand-author, easy to generate, and the reason sketch mode and draw-in come for free.

| Command | Meaning |
|---|---|
| `C n` | Pen color (0-15, or pseudo-colors 16-23) |
| `L` / `R` | Absolute or relative polyline (Bresenham) |
| `F x,y` | Flood fill the region under the seed |
| `D a b pattern` | Fill with a two-color dither |
| `B` / `S` | Brush shape and size; stamp the brush (foliage, flowers, snow) |
| `T id x,y` | Place a reusable stamp (a tree, a rock, a log), optionally flipped |
| `Z id x,y,w,h` | A tap hotspot for Look and Sketch |
| `@ layer` | sky, far, mid, near |

```
@ sky
D 1 9 checker25  F 80,2
D 9              F 80,20
D 9 11 checker   F 80,40
@ far
C 8  L 0,62 14,50 27,55 41,38 58,52
     74,44 95,30 108,41 126,36 159,44
     159,63 0,63
D 7 9 checker    F 70,58
@ mid
T subalpine_fir 18,88
T subalpine_fir 131,86 fx
@ near
B splat 1  C 13  S 12,140 19,146 33,152
Z meadow 0,96,160,72
```

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

**Time of day is a palette remap.** Each time of day swaps which of the EGA card's 64 hardware colors sit in the 16 slots, exactly what real EGA could do. Remaps apply at the final blit, so sprites and overlays tint along for free. Key slots:

| Slot | Dusk | Blue hour | Night |
|---|---|---|---|
| 9 sky | `#AA55AA` violet | `#5555AA` | `#000055` |
| 11 horizon | `#FFAA55` orange | `#AA55AA` | `#0055AA` |
| 15 snow | `#FFAAAA` **alpenglow pink** | `#AAAAFF` **blue snow** | `#AAAAFF` |
| 2 forest | `#005500` | `#005555` | `#000055` |

At night, fire (12) and yellow (14: stars, headlamp) stay bright while everything else sinks into blues, so a headlamp beam pops. The glow and fire cycles are resolved after the remap, so they keep their warm colors (11.5). Weather tints stack on top (overcast grays the sky; lightning flashes every slot white for two frames). The full tables are in `storybook.md` 6.6 and appendix B.4.

**Camp pages step through these remaps as chores pass:** arrive in Day, cook in Dusk, watch the sunset into Blue hour, then Night. You watch evening fall while deciding what to do: the most "living book" effect in the game.

### 11.5 Palette cycling: water that moves, a glow that breathes

Pseudo-colors 16-23 resolve each frame to an EGA color from a cycle, phased by pixel position so motion appears. Output stays strictly 16-color.

| Pseudo | Name | Cycle (EGA) | Used for |
|---|---|---|---|
| 16 | lake | 1, 9, 1, 3 | Lake shimmer |
| 17 | falls | 15, 11, 7, 11 | Sol Duc Falls, Marymere, Enchanted Valley |
| 18 | river | 3, 11, 3, 7 | The Hoh, the Elwha |
| 19 | glow | warm fixed: `#FFFF55`, `#FFAA55`, `#FF5555` | **The Snowlamp**: rings radiating out |
| 20 | fire | warm fixed: `#FF5555`, `#FFAA55`, `#FFFF55` | Campfire, stove flame |
| 21 | surf | 15, 7, 1, 9 | Breaking waves, sea stacks |
| 22 | stars | 15, 7, 8, 7 | Twinkle |
| 23 | rain glint | 9, 11 | Puddles in rain |

**Glow and fire are exempt from the time-of-day remap.** They are resolved after it, to fixed warm EGA colors, so at blue hour and night (when slot 15 becomes `#AAAAFF` and slot 6 sinks to blue) the Snowlamp stays the only warm thing in the picture and never flickers blue. The other cycles are remapped with the scene.

Cycling runs at **8 fps** only while a cycling page is visible, pauses when static or hidden, and freezes under iOS Reduce Motion (except the glow, which slows to 2 fps).

### 11.6 Sprites

Small EGA figures placed at anchors each base scene defines (trail spot, far bank, campsite, rock, sky).

- **The hiker** (7x18): idle, sit, wade, shiver, sketch, wave. **The pack sprite shows what you packed**: day pack, mid pack or big pack, with the pad roll, a swinging pot or an ice axe dangling outside. Jacket color is chosen on the New Book page.
- **Companions** (M6), each in a different jacket color.
- **Tent** (pitched, sagging in rain, glowing with a headlamp inside at night).
- **Animals:** black bear, Roosevelt elk (antlers Sept-Oct), black-tailed deer, Olympic marmot, Canada jay (sometimes with a tortilla), American dipper (a two-frame bob), raccoon, a one-pixel-tall yellow banana slug, bald eagle, salmon, harbor seal.
- **People:** a ranger with a flat hat; the car in your chosen color.
- **The margin fox** lives in the UI layer only, drawn in pencil-line style.

### 11.7 The scene composer: hundreds of places, about 24 drawn by hand

The park has 449 places in the research and roughly 500 to 600 once overlay points are compiled in (4.1). Hand-drawing each is impossible, so a place's picture is **composed from layers**, chosen by data and seeded by the place's id. Elk Lake always looks like Elk Lake, and it doesn't look like Lunch Lake.

```
 1 BASE      biome base picture (about 14 kinds)
 2 VARIANT   seeded: flip, horizon ±6 px, ridges
 3 FAR       skyline / landmark (Olympus, Deception)
 4 PROPS     seeded stamps: trees by species and
             elevation, rocks, logs, ferns, flowers
 5 FEATURE   lake, ford, falls, bridge, ladder,
             shelter, sea stack, sign
 6 SEASON    snowline, fall color, flowers, berries
 7 SPRITES   hiker, tent, animals (pose from state)
 8 WEATHER   rain, drizzle, fog bands, snow, stars
 9 PALETTE   time of day + weather tint
10 CYCLE     pseudo-colors each frame
11 HOTSPOTS  merged: Look, Sketch, alt text
```

**Biome bases:** rain forest, montane forest, subalpine meadow, alpine, glacier, lake basin, river valley, waterfall, beach, headland, pass, trailhead, road, store interior, ranger station interior, town, plus a camp overlay. A node's base is inferred from its type and elevation in the region data (trailhead, ford, glacier, lake, pass, coast, then elevation bands at 2,000 / 4,000 / 5,500 ft); a recipe can override anything. Each region node already carries `scene_art_notes` from the research, which become recipes.

**Skylines** are drawn once and reused wherever they're visible: the Olympus massif, the Bailey Range, Mount Deception and the Royal Basin walls, Mount Constance, Mount Anderson, the Enchanted Valley walls, Storm King over Lake Crescent, the Strait and Vancouver Island, the sea stacks of Point of the Arches, Rialto and Toleak, Grand Valley.

**Seasonal and weather overlays:** ground above the snowline switches to snow dithers; fall color swaps vine maple and huckleberry to reds; flowers by month and elevation; fog hides the far layer and lays bands across the middle; stars and the real moon phase for the trip date.

**About 24 hand-drawn signature scenes** get an illustrator's full attention, still accepting palette, weather and sprite layers: the High Divide cover at dusk; the kitchen table and the blank page; the WIC counter; Fernwood Mercantile; the labeled backpack spread; US 101 along Lake Crescent; the Hall of Mosses; the Hoh braids with elk; the Glacier Meadows ladder; the Blue Glacier from the moraine; Snow Dome and the summit block at dawn; Sol Duc Falls; Seven Lakes Basin from the rim; Heart Lake; Royal Lake under Mount Deception; Upper Royal Basin; Hurricane Hill and the Bailey Range; Grand Valley and Moose Lake; the Enchanted Valley chalet; Rialto's Hole-in-the-Wall; Shi Shi and Point of the Arches; the Snowlamp in the blue snow; and The End, the closed book on a car dashboard with the fox asleep on it.

**Respect:** the Ozette petroglyphs are shown at a distance with no Sketch option, and Tskawahyah Island stays off-limits, as the research notes.

### 11.8 Art tooling: Claude can see its own pictures

AI-drawn vector art drawn blind would break. So the same picture VM runs in Node and writes PNGs (4x nearest-neighbor, in any palette) and per-region contact sheets. **Claude opens the PNGs and critiques its own art**, which makes pictures iterable like code. A picture lint catches unknown stamps, out-of-bounds points, fills covering more than 60% of a non-sky layer (usually an unclosed outline), deep stamp recursion and off-canvas hotspots. An in-browser picture editor is a likely later tool for the 24 hand-drawn scenes.

### 11.9 Type and accessibility

Sizes are specified in **device pixels**, because on a 3x phone the crisp unit is a third of a point.

- **Chrome** (status line, chapter titles, choice labels, margin notes): an EGA 8x14 bitmap-style font (for example *Px437 IBM EGA 8x14*, CC BY-SA 4.0, credited in the colophon), drawn at **4 device pixels per font pixel on 3x phones** (10.7 pt per character, glyphs about 19 pt tall) and **3 per font pixel on 2x phones** (12 pt per character). A 343-pt button minus its 44-pt (i) square holds about 28 characters on 3x and 25 on 2x.
- **Choice labels** are capped at **22 characters**. The odds tag (up to 10 characters, such as `♦ 55-75%`) sits on the same line when it fits; otherwise the button grows to two lines with the tag right-aligned on its own line. The ♦ fail share always takes the second line. Lint T02 checks every label at 375 pt.
- **Narration:** a proportional pixel font (an OFL font such as *Pixelify Sans*, or a custom one). Characters per line are **derived from the measured font metrics**, not assumed: about 31 per line at 343 pt for the default size.
- **Book font:** a bundled OFL serif for readability, also used when iOS Larger Text is on.
- **Text is real HTML**, not canvas, so VoiceOver reads it and it scales. Every composed picture generates **alt text** from its layers (*"A meadow under a blue sky. Mount Olympus far away. A marmot on a rock."*).
- Fonts are self-hosted (woff2) so the game works offline. Black on white is about 21:1 contrast; night pages use light gray on black (about 9:1).

---

## 12. iPhone screens

All wireframes use one example book where they can: Robin's four-night Hoh trip (Lewis Meadow, Glacier Meadows twice, Five Mile Island), Jul 14 to 18, 2027, `Score: 0 of 131` at the stamp. Screens from other books say so.

### 12.1 Global rules

- **Viewport:** `width=device-width, initial-scale=1, viewport-fit=cover`. Installed as a Home Screen web app (`display: standalone`, portrait). iOS ignores the manifest's orientation, so in landscape a small plate says *"This book reads best held upright."*
- **Safe areas:** the app pads with `env(safe-area-inset-*)`. The status line sits below the Dynamic Island; the toolbar sits above the home indicator.
- **Height:** `100dvh`, `overscroll-behavior: none` (no rubber band), `touch-action: manipulation` (no double-tap zoom). Only explicit panes scroll (store list, closet list, journal).
- **Targets:** at least 44x44 pt everywhere. The status line is 22 pt tall, so ≡ and Sound get invisible 44x44-pt hit areas that extend below it. Choices are full width, 52 pt tall (64 pt when the odds tag takes a second line), 8 pt apart, in the bottom half (the thumb zone). The **(i) is its own 44x44-pt square** at a choice's right edge, so a slightly-off tap on the odds never commits the choice. Picture hotspots get a hit area of at least 44 pt.
- **♦ choices need a confirming tap.** Tapping one turns it, in place, into `Climb the ladder?  [Yes]  [Not yet]`. Nothing critical happens on a single brush of the thumb.
- **Touch only.** Swipe left on the text to turn the page (always duplicated by a button); swipe right to reread this chapter. **Swipes that start within 24 pt of a screen edge are ignored**, so they never fight Safari's edge-swipe Back. Long-press is an accelerator (the Why sheet, the slot picker), never the only way. Choices and the picture set `-webkit-touch-callout: none` and `user-select: none`, so a long-press never selects text or opens the iOS callout menu. The only typing is the optional hiker name, which offers a suggest button.
- **Browser history:** in-book pages use `history.replaceState`, so the browser's Back button can never rewind a trip. A `popstate` (Back pressed in a Safari tab) opens the ≡ menu instead.
- **No timers, ever.**

**Space check,** at the default text size, with three choices:

| Device | Fixed parts (pt) | Text (pt) | About |
|---|---|---|---|
| iPhone 15/16 (393 x 852) | safe 59, status 22, picture 224, caption 40, choices 172, toolbar 50, safe 34 | ~250 | 9 lines |
| iPhone SE (375 x 667), short-screen layout | safe 20, status with toolbar folded in 22, picture 168, caption 40, choices 172 | ~245 | 9 lines |
| iPhone SE with a 4x3 picture and a toolbar (rejected) | as above, but picture 252 and toolbar 50 | ~111 | 4 lines |

**Short screens** (under about 700 pt tall) therefore use the 4x2 picture (11.2) and fold the toolbar into the status line, with Pack, Map, Guide and Journal behind ≡.

**Page budget.** Lint T02 checks that every page fits at 375 x 667 with three choices and at 393 x 852 with four, using measured font metrics: about **260 characters** per page. A page that doesn't fit (a four-choice page on an SE, or any page at the Large text setting) splits at runtime into a "more ▸" page, never a scroll. The lint also warns about pages that would split at Large text on an SE.

### 12.2 The page frame (every in-book page)

```
┌──────────────────────────────────────┐
│ Score: 22 of 131         ≡  Sound:on │
│ ┌──────────────────────────────────┐ │
│ │   EGA PICTURE 160x168            │ │
│ │   Hoh braids: three milky        │ │
│ │   channels, elk on the far       │ │
│ │   gravel, a dipper on a rock     │ │
│ │   (tap = Look, pencil = Sketch)  │ │
│ └──────────────────────────────────┘ │
│ Day 1 · 3:10 pm · Hoh braids · Jul   │
│ Warm:ok  Legs:tired  Feet:ok  ♥♥♥♥○  │
│ ╔══════════════════════════════════╗ │
│ ║ The bridge was gone, and the     ║ │
│ ║ river had split into three gray  ║ │
│ ║ ropes. The far bank looked       ║ │
│ ║ farther than it had a minute     ║ │
│ ║ ago. Robin...           - 37 -   ║ │
│ ╚══════════════════════════════════╝ │
│ ╔═════════════════════════════╗╔═══╗ │
│ ║ Wade across now  ♦ 82-92%   ║║ i ║ │
│ ║          8-18% goes badly   ║╚═══╝ │
│ ╚═════════════════════════════╝      │
│ ╔═════════════════════════════╗      │
│ ║ Camp, cross at dawn   night ║      │
│ ╚═════════════════════════════╝      │
│ ╔═════════════════════════════╗      │
│ ║ Turn back to the car   sure ║      │
│ ╚═════════════════════════════╝      │
├──────────────────────────────────────┤
│ [Pack]  [Map]  [Guide]  [Journal]    │
└──────────────────────────────────────┘
```

- **The narration box** is the Sierra message box (2.4): white fill, double dark-red border, black text, a small inner margin, drawn in CSS around real HTML text. The page number sits inside it.
- **The choices** are matching boxes. This ford is ♦ because at thigh depth in the afternoon "swept" is in its fail table (8.1); the fail share takes the second line.
- **The toolbar** opens one modal with four tabs: **Pack** (contents with states: wet, used, lost, outside, battery; food left by meal; water; weight; the conditions), **Map** (the endpaper map, your route dotted, "you are here", today's elevation profile), **Guide** (the field guide grid) and **Journal** (the table of contents with retitled chapters, and the diary). On short screens it folds into ≡.

### 12.3 The bookshelf (title)

```
┌──────────────────────────────────────┐
│ ┌──────────────────────────────────┐ │
│ │ TALL PLATE: the High Divide      │ │
│ │ at dusk; Olympus pink across     │ │
│ │ the Hoh valley; a tiny hiker;    │ │
│ │ first stars twinkling            │ │
│ │                                  │ │
│ │     OLYMPIC PENINSULA HIKER      │ │
│ │       ~ a storybook trip ~       │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [ > Begin a new book               ] │
│ [ Continue: Too Much Cheese...     ] │
│ Your bookshelf                       │
│ |█| |█| |▓| |█| |░|    (tap = reread)│
│                                      │
│ Field Guide: 23 of 104               │
│ [Settings]   (stamp) works offline   │
└──────────────────────────────────────┘
```

Up to three books can be in progress, each with its own autosave (E.6). The first time, the title page explains (in one line) why to **Add to Home Screen** before the first save, and shows the "works offline" stamp once everything is cached.

### 12.4 New book

```
┌──────────────────────────────────────┐
│ < Shelf          A NEW BOOK          │
│ ┌──────────────────────────────────┐ │
│ │ [hiker sprite, 4x]    < >        │ │
│ │        jacket color              │ │
│ └──────────────────────────────────┘ │
│ The hiker's name                     │
│ [ Robin                  (suggest) ] │
│ [they]  [she]  [he]                  │
│ Fitness [Easygoing ... Mountain goat]│
│ [ ] has taken a glacier course       │
│                                      │
│ How should this book be?             │
│ (•) Storybook: every story ends      │
│     with you safely home             │
│ ( ) Perilous ♦: the old rules. Some  │
│     stories end on the mountain      │
│                                      │
│ [ Open the book  >                 ] │
└──────────────────────────────────────┘
```

The glacier-course box starts the book with `glacier` skill 1 (4.2). The companion row ("Going with...") stays hidden until companions exist in M6, rather than showing a dead control.

### 12.5 The ranger desk: itinerary builder

The region map fills the picture area; the itinerary is a bottom sheet with three heights (peek, half, full), written like a permit. Here Night 1's camp list is open:

```
┌──────────────────────────────────────┐
│ < Park map    THE HOH & OLYMPUS      │
│ ┌──────────────────────────────────┐ │
│ │ REGION MAP (endpaper art; pinch) │ │
│ │ T Hoh ··5mi▲··OGS▲··Lewis▲··     │ │
│ │     ··Elk Lk▲··Glacier Mdws▲☆    │ │
│ │ (Lewis Meadow glows yellow)      │ │
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

Once chosen, a night collapses to one line (`Night 1  Lewis Meadow  10.4mi +640`), with **Stay again** and **Move on** on the next night's row, and the ranger's line appears under the trip (*"Day 2 is a climb. The ladder is no place to be at dusk."*). Before this screen, the park map page offers *The ranger's favorite trips* (presets, filtered).

### 12.6 The permit

```
┌──────────────────────────────────────┐
│ ┌──────────────────────────────────┐ │
│ │ The WIC counter; the ranger      │ │
│ │ holds a rubber stamp             │ │
│ └──────────────────────────────────┘ │
│ ╔═ WILDERNESS PERMIT ═══════════════╗│
│ ║ Party: Robin            Size: 1   ║│
│ ║ Entry: Hoh TH · Jul 14-18, 2027   ║│
│ ║ Nights: Lewis Mdw · Glacier Mdws  ║│
│ ║   x2 (quota: OK) · Five Mile Is.  ║│
│ ║ Canister: WIC loan (available)    ║│
│ ║ Trip plan left with: [a friend v] ║│
│ ║ Forecast: sun sun cloud 40% sun   ║│
│ ║ Fees: $32 + $6 (shown, not paid)  ║│
│ ╚═══════════════════════════════════╝│
│ [ Stamp it  (thunk!)               ] │
│ [ < Change the plan                ] │
└──────────────────────────────────────┘
```

The forecast covers the trip days within five days of the planning day (Jul 13); later days would show the ranger's climatology. A guided trip adds a line: `Guide: Larkspur Glacier Guides, Jul 14`.

### 12.7 The store

```
┌──────────────────────────────────────┐
│ Score: 0 of 131          ≡  Sound:on │
│ ┌──────────────────────────────────┐ │
│ │ FERNWOOD MERCANTILE: shelves,    │ │
│ │ rainy window, shopkeeper         │ │
│ │ (tap a shelf / the shopkeeper)   │ │
│ └──────────────────────────────────┘ │
│ ┌ SHOPPING LIST ────────────────────┐│
│ │ Breakfast ●●○○  Lunch ●●●○        ││
│ │ Dinner    ●○○○  Snacks ●●●  Fuel ✓││
│ │ Canister: 6.4 of 8.6 L · 3.2 days ││
│ └───────────────────────────────────┘│
│ [ Fill from the list ]               │
│ [Brkfst][Lunch][Dinner][Snack][Fuel]>│
│ Ramen + peas  6oz 640cal $3.49 - 2 + │
│ Instant mash  4oz 440cal $2.00 - 1 + │
│ Freeze-dried  5oz 600cal $12.5 - 0 + │
│ Canned beans 16oz 400cal $2.00 - 0 + │
│ "Those'll be heavy, friend. Beans    │
│  are mostly can."                    │
│ [ Pay and head home  >             ] │
└──────────────────────────────────────┘
```

(Prices here are placeholders; real ones come from `food_catalog.json`.) The canister gauge uses the canister on the permit; when food overflows it, the gauge turns red and the shopkeeper says *"That won't all fit in a can, friend."*

### 12.8 The pack screen

```
┌──────────────────────────────────────┐
│ Score: 0 of 131          ≡  Sound:on │
│ ┌──────────────────────────────────┐ │
│ │ tent ──┐  ╭─────╮  ┌── stove     │ │
│ │ bag ───┼─ │█████│ ─┼── canister  │ │
│ │ puffy ─┘  │▓▓▓▓▓│  └── headlamp  │ │
│ │ outside:  │░░░░░│   scale 31 lb  │ │
│ │ pad (bottom straps)  fox: asleep │ │
│ └──────────────────────────────────┘ │
│ 46 of 50 L Snug · 31 lb · r 0.97     │
│ "a comfortable load"                 │
│ Can: food 7.1 of 8.6 L · 4.1 days    │
│      [ Repack all food ]             │
│ Water  [-] 2.0 L [+]  4.4 lb         │
│ [ Checklist 9 of 10 ▾ ]              │
│ SHELTER                              │
│ ✓ Trekking-pole tent  27oz  in       │
│ SLEEP                                │
│ ✓ Down bag 30°F       32oz  in       │
│ ✓ Foam pad            14oz  bottom   │
│ RAIN                                 │
│ ✓ Rain jacket         10oz  in       │
│ · Rain pants           8oz  home     │
│ ... (the list scrolls)               │
│ ▸ More from the closet               │
│ [Like last time] [Close the pack  >] │
└──────────────────────────────────────┘
```

Only the closet list scrolls; the pack picture, the gauges and the buttons stay put. Tap a row to put the item in or take it out. Drag it onto the picture, or long-press a packed row, for the slot picker (12.9). The last column says where each item is: `in`, `bottom`, `top`, `side`, `mesh`, `loop`, or `home`. Tapping the canister line opens the canister panel.

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

The picker lists only the places this item can legally go on this pack, each with its cost in plain words; places that can't take it (the front mesh for a foam pad, a tool loop for anything but a tool) simply don't appear.

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

### 12.10 The trailhead: last look

```
┌──────────────────────────────────────┐
│ ┌──────────────────────────────────┐ │
│ │ TRAILHEAD: the car, the kiosk,   │ │
│ │ routed sign HOH RIVER TRAIL      │ │
│ │ GLACIER MEADOWS 17.4             │ │
│ └──────────────────────────────────┘ │
│ Hoh River Trailhead · 9:40 am · sun  │
│ ╔══════════════════════════════════╗ │
│ ║ Robin stood by the car and       ║ │
│ ║ looked at the pack, and the pack ║ │
│ ║ looked back.                     ║ │
│ ╚══════════════════════════════════╝ │
│ With this pack: a long, lovely trip. │
│ Lewis Meadow about 2:50 pm.          │
│ Leave anything in the car?           │
│ [ ] Ukulele 2lb   [ ] Watermelon 8lb │
│ [ ] Camp chair 1lb [ ] 2nd book 10oz │
│ Pack: 33 lb -> 23 lb                 │
│ [ Start walking  >                 ] │
└──────────────────────────────────────┘
```

### 12.11 The Why sheet (bottom sheet)

```
┌──────────────────────────────────────┐
│ ─── Why these odds ───────────────── │
│ Wade across the Hoh braids           │
│   River at 3 pm (flow 1.75) ...  64  │
│ + Trekking poles (in pack) ...  +10  │
│ + You watched the dipper .....   +5  │
│ - Heavy pack (r 1.4) .........   -5  │
│ ? River since last night's           │
│   rain (unknown) ........ -10 to +10 │
│ ──────────────────────────────────   │
│   Clean crossing ..........  64-84   │
│   You make it .............  82-92%  │
│ ███████████████░░░░░▒▒▒              │
│ If it goes badly: a cold swim, wet   │
│ gear, and something may float away.  │
│ [ Close                            ] │
└──────────────────────────────────────┘
```

Every line comes from the shared tables (the 64 is the piecewise ford base at flow 1.75, 7.7), and the card bench regenerates this sheet as a golden test (F.4). Pack items in the list show as small icons that light up, so you *see* the pack working. An unused helper on screen appears as a suggestion (*+ watch the dipper: tap the picture*).

### 12.12 The Fork card

From Appendix A's book (Glacier Meadows in one night), at the first real place to stop:

```
┌──────────────────────────────────────┐
│ Score: 9 of 64           ≡  Sound:on │
│ ┌──────────────────────────────────┐ │
│ │ FIVE MILE ISLAND: gravel bars,   │ │
│ │ elk, the sky a flat pewter       │ │
│ └──────────────────────────────────┘ │
│ Day 1 · 12:50 pm · Five Mile Island  │
│ ╔══════════════════════════════════╗ │
│ ║ Glacier Meadows was twelve miles ║ │
│ ║ on and nearly four thousand feet ║ │
│ ║ up. At this pace: a little after ║ │
│ ║ midnight, long after dark.       ║ │
│ ╚══════════════════════════════════╝ │
│ ╔═════════════════════════════╗╔═══╗ │
│ ║ Push on tonight             ║║ i ║ │
│ ║   mostly trouble   ▓▓▓▓▒▒░  ║╚═══╝ │
│ ╚═════════════════════════════╝      │
│ ╔═════════════════════════════╗      │
│ ║ Stop at Happy Four     sure ║      │
│ ╚═════════════════════════════╝      │
│ ╔═════════════════════════════╗      │
│ ║ Turn back to the car   sure ║      │
│ ╚═════════════════════════════╝      │
└──────────────────────────────────────┘
```

A compound choice shows one word and a three-color bar (OK, serious trouble, need help); its (i) opens the look-ahead numbers (8.9). *Stop at Happy Four* is 0.7 mi on; it isn't on the permit, but Happy Four is not a quota camp, so it's a sure, legal change (3.7).

### 12.13 An outcome page

```
┌──────────────────────────────────────┐
│ Score: 22 of 131         ≡  Sound:on │
│ ┌──────────────────────────────────┐ │
│ │ Same braids; the hiker on the    │ │
│ │ far bank, wringing a sock        │ │
│ └──────────────────────────────────┘ │
│ Day 1 · 3:40 pm · Hoh braids         │
│ ╔══════════════════════════════════╗ │
│ ║ The second channel was deeper    ║ │
│ ║ than it looked, which is a thing ║ │
│ ║ second channels are famous for.  ║ │
│ ║ The _poles_ were the reason it   ║ │
│ ║ wasn't worse.                    ║ │
│ ╚══════════════════════════════════╝ │
│ ✎ Socks: wet (1 dry pair left)       │
│ ✎ Time -30m · Feet: ok -> sore       │
│ [ Turn the page  >                 ] │
├──────────────────────────────────────┤
│ [Pack]  [Map]  [Guide]  [Journal]    │
└──────────────────────────────────────┘
```

State changes go in a **pencil strip** under the narration, never in a side column, so the text keeps its full width. The item that mattered is underlined (tap for its card). A small ornament signals severity: a green fern (good), a brown twig (mishap or setback), a red ♦ with a red border (serious or trip-ending), a gold star (the Snowlamp).

### 12.14 Camp: Make camp, then the evening

```
┌──────────────────────────────────────┐
│ Score: 40 of 131         ≡  Sound:on │
│ ┌──────────────────────────────────┐ │
│ │ ELK LAKE camp: lake (cycling),   │ │
│ │ firs; a Canada jay on a branch   │ │
│ └──────────────────────────────────┘ │
│ Day 2 · 5:20 pm · Elk Lake · 2,600ft │
│ ╔══════════════════════════════════╗ │
│ ║ Robin dropped the pack, and the  ║ │
│ ║ pack made the sound of a job     ║ │
│ ║ well done.                       ║ │
│ ╚══════════════════════════════════╝ │
│ ┌──────────────────────────────────┐ │
│ │ Make camp: tent, water, dinner,  │ │
│ │ food in the can          45m  >  │ │
│ └──────────────────────────────────┘ │
│ ┌────────────────┬─────────────────┐ │
│ │ Sketch  20m    │ Watch sunset    │ │
│ ├────────────────┼─────────────────┤ │
│ │ Swim (brr)     │ Side trip  1 h  │ │
│ ├────────────────┼─────────────────┤ │
│ │ My own way...  │ Go to sleep  >  │ │
│ └────────────────┴─────────────────┘ │
├──────────────────────────────────────┤
│ [Pack]  [Map]  [Guide]  [Journal]    │
└──────────────────────────────────────┘
```

- **Make camp** does the sensible routine in one tap: pitch the tent, get water with your treatment, cook the next planned dinner, put the food in the canister. It narrates all of it on one page, with a pencil strip for what changed.
- **My own way...** opens the separate chores for anything different: pitch somewhere else, drink from the creek (with its honest later-days risk), a different dinner, no cooking, food left out.
- **The other tiles are joys and side trips.** Dimmed tiles explain themselves on tap (no warm layer: the sunset lasts 10 minutes).
- **The light keeps moving.** Everything costs time, so the sky palette steps Day, Dusk, Blue hour, Night as you go.
- **Go to sleep** first lists any undone essentials: *"Your food is still out. [Store it] [Leave it out]"*. Leaving food out is a real choice, never a missed tile. Then it shows the night's honest outlook before you commit.

### 12.15 The morning page

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
│ ║ The marmot stood up very         ║ │
│ ║ straight and whistled twice,     ║ │
│ ║ which, as everyone knows, is     ║ │
│ ║ marmot for weather coming.       ║ │
│ ╚══════════════════════════════════╝ │
│ [ Stay: a day at the ice      rest ] │
│ [ Go on to Five Mile Is.    permit ] │
│ [ Head for home               sure ] │
├──────────────────────────────────────┤
│ [Pack]  [Map]  [Guide]  [Journal]    │
└──────────────────────────────────────┘
```

On ground already walked, the morning page also offers **Walk out** (3.4). Changing the plan from here follows 3.7.

### 12.16 The Snowlamp plate

```
┌──────────────────────────────────────┐
│ ┌──────────────────────────────────┐ │
│ │ TALL PLATE 160x320               │ │
│ │ blue-hour sky, first stars       │ │
│ │ the ridge in dark blue           │ │
│ │                                  │ │
│ │ snowfield in pale blue           │ │
│ │                                  │ │
│ │           ·  ✶  ·                │ │
│ │    (gold rings radiate)          │ │
│ │                                  │ │
│ │ tiny hiker kneeling,             │ │
│ │ headlamp OFF                     │ │
│ │ ╔════════════════════════╗       │ │
│ │ ║ And there, where the   ║       │ │
│ │ ║ snow was bluest,       ║       │ │
│ │ ║ something small was    ║       │ │
│ │ ║ shining.               ║       │ │
│ │ ╚════════════════════════╝       │ │
│ └──────────────────────────────────┘ │
│ [ Sketch it                        ] │
│ [ Pick it to take home             ] │
│ [ Just look                        ] │
└──────────────────────────────────────┘
```

The status line and toolbar are **hidden** on full-bleed plates. It's the only time the chrome goes away, which is what makes the moment feel singular. On short screens the tall plate is 320x320 pt (11.2), which leaves room for the three choices.

### 12.17 A Perilous death page

From a coast book:

```
┌──────────────────────────────────────┐
│ Score: 47 of 112         ≡  Sound:on │
│ ┌──────────────────────────────────┐ │
│ │ The scene, remapped to grays     │ │
│ │ ╔════════════════════════╗       │ │
│ │ ║ THE PACIFIC READ THE   ║       │ │
│ │ ║ TIDE TABLE FOR YOU     ║       │ │
│ │ ║ Robin had a tide table.║       │ │
│ │ ║ Robin did not read the ║       │ │
│ │ ║ tide table. The head-  ║       │ │
│ │ ║ land was not surprised.║       │ │
│ │ ╚════════════════════════╝       │ │
│ └──────────────────────────────────┘ │
│ RANGER'S NOTE                        │
│ Some headlands can only be rounded   │
│ at low tide. Know the tide for each  │
│ point, and use the overland trails.  │
│ [ Turn back a page                 ] │
│   The mountain remembers. Try a      │
│   different way.                     │
│ [ Back to last camp                ] │
│ [ Restart the trip (keep the plan) ] │
│ [ Close the book ]                   │
└──────────────────────────────────────┘
```

The line under *Turn back a page* matters: rolls are keyed (8.14), so repeating the same choice repeats the same result, and without the line that would look like a bug.

### 12.18 Settings (the ≡ menu)

```
┌──────────────────────────────────────┐
│ X   THE BOOK                         │
│ Save is automatic (the red ribbon).  │
│ ──────────────────────────────────   │
│ Odds     [Numbers] [Words] [Hidden]  │
│ Text     [Pixel] [Book] [Large]      │
│ Pages    [Short] [Storybook] [Long]  │
│ Sound    [On] [Off]    Read to me [ ]│
│ The fox  [Quiet] [Helpful] [Off]     │
│ Park     [As researched] [Timeless]  │
│ ──────────────────────────────────   │
│ Mode: Storybook (set per book)       │
│ [Export save]  [Import]  [Colophon]  │
└──────────────────────────────────────┘
```

That is the whole v1.0 settings list: Odds, Text, Pages, Sound, the fox and Park (plus Read to me, if you want it built). Pictures (the draw-in style), Money (the Shoestring wallet), Units, Paper, the Notebook of raw numbers, the Tandy sound mode, "trail of the day" and badges wait for M6, so the first release reads as a book and not a control panel. On short screens the ≡ menu also holds Pack, Map, Guide and Journal.

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

A two-week page, like the paper booklet. The trip days carry the player's pencil bracket, and **nothing marks today**, exactly as on paper; reading the wrong row is the player's own mistake (Appendix C). At `coast` skill 2 a small pencil arrow marks today, and the HUD computes the windows (7.10). Opening the booklet costs no game time. The heights shown here are illustrative until the real NOAA tables ship.

---

## 13. Audio

### 13.1 The sound engine: PC-speaker charm

The 1984 PC speaker was one square-wave voice, and we imitate it honestly with Web Audio: a square oscillator, an envelope at low gain (about 0.06), and a gentle low-pass filter (about 3.5 kHz) to take the harsh edge off. A tiny sequencer plays `[note, ms]` lists, one voice at a time.

- **Mostly events and jingles,** like AGI games. No continuous music by default.
- **iOS:** the audio context is created on the first tap. Where Safari supports it, `navigator.audioSession.type = "ambient"` makes the game **respect the ring/silent switch** and mix politely with your own music. The game never depends on sound.
- **The status line** toggle `Sound: on / off` works exactly as in KQ.
- **Later options (M6):** a *Tandy* mode with 3 voices plus noise (an easter egg for those who remember the PCjr), and an ambient bed (rain as filtered noise, surf, a creek), off by default.
- **Read to me:** the browser's on-device speech reads each page aloud. It works offline on iOS and is the most literal way to make playing "feel like reading the book" (lovely for a parent and child). Your call on whether it ships ([Decisions](#decisions-needed-from-you)).

### 13.2 Cue list

| Cue | When | Sound |
|---|---|---|
| Title theme, "The Trail Goes Up" | Bookshelf | 8 bars, C major pentatonic, walking pace: a melody that climbs and comes home |
| Page turn | Every turn | Two clicks: 1,200 Hz then 900 Hz, 12 ms each |
| Chapter fanfare | Chapter title pages | G4 C5 E5 G5, then a held C6 |
| Look box | Picture tap | A5, 30 ms |
| Pack bloop / thunk | Item in / pack full | A rising slide; a low 110 Hz thunk |
| Stamp | Permit stamped | A noise burst and an 80 Hz thump |
| Compass roll | ♦ choices | Ticks that slow, then a landing chord (major, falling or low) |
| Success / mishap / serious | Outcome pages | C-E-G up; G-F slightly flat; a slow four-note descent |
| Sketch | While sketching | Soft 2 kHz ticks, one per line |
| Marmot | Marmot | A high whistle, twice |
| Elk bugle | Sept-Oct | A slide up to 1,800 Hz, then three low grunts |
| Varied thrush | Fog pages | One long vibrato note, then silence |
| Pacific wren | Rain-forest dawn | A trill far too big for its body |
| Jay | A theft | Two quick notes and a flutter |
| Campfire | Where fires are legal | Faint random crackle |
| **The Snowlamp motif** | The glow plate | C5 E5 G5 C6 E6, then C6 held with tremolo. **Played once, nowhere else** |
| The End | The End plate | The theme's first four bars, slower |
| Dirge | Perilous death page | A short minor descent, a nod to Sierra's without quoting any real melody |

---

## 14. Content plan and volume targets

### 14.1 How much content

| Content | M1: the Hoh | v1.0: three must-haves | Full park |
|---|---|---|---|
| Regions | 1 | 3 | 6 |
| Compiled places (research places plus overlay points, 4.1) | ~35 | ~170 | ~500-600 |
| Directed trail segments | ~70 | ~340 | ~1,000 |
| Trailheads | 1 | 5 | ~45 |
| Trip templates (presets) | 8 | 30 | ~120-150 |
| Generic archetype cards | 55 | 140 | 220 |
| Place cards and patches | 25 | 80 | 300 |
| Chain, fork, crisis, finale, epilogue cards | 15 | 40 | 80 |
| **Total cards** | **~95** | **~260** | **~600** |
| Choices (about 2.8 per card) | ~265 | ~730 | ~1,700 |
| Text pools / lines | 60 / 450 | 150 / 1,500 | 300 / 4,000 |
| Place text variants | 35 x 3 | 170 x 3 | 600 x 2-4 |
| Biome base pictures | 6 | 12 | 20 |
| Skylines and landmark overlays | 10 | 35 | 110 |
| Stamps and sprites | 25 | 50 | 80 |
| Tall plates | 3 | 6 | 12 |
| Gear / food items in play | 60 / 35 | 100 / 60 | 218 / 86 |
| Field guide entries | 25 | 60 | 104 |
| Simulation assertions | 15 | 60 | 200 |
| Edition size (gzip) | ~150 KB | ~400 KB | ~1 MB |

### 14.2 Coverage rules

- **Every event tag** (about 40) appears as a modifier or condition in at least **3 cards**, every catalog item maps to at least one event tag, and every segment hazard tag appears in at least 1 card. The linter enforces all three.
- **Every item** gets item "notices" (the narrator noticing it: has, lacks, wet, lost). To keep this sane with 218 items, notices are written per **tag family** (about 40 families x 3-4 states) with a `{gear:tag}` slot for the item's name, plus hand-written lines for the 40 or so most characterful items (the ukulele, the watermelon, the old field guide, the cast-iron skillet).
- **The coverage matrix:** for each region x season (early Jun-Jul, peak Aug-Sep, late Oct) x weather class (fair, wet, cold or snow, fog), at least **32 eligible notable cards** (cards the Director draws, not forced landmarks or chain steps), 24 discovery cards and 6 night cards along the classic routes. Why 32: a 2 to 3 night trip draws about 8 notable cards, and 8 x 8 / 32 = 2 shared on average, before the novelty weight lowers it (8.12). Thin cells become writing assignments.
- **Archetype plus place patch** is preferred over a new card. Generic archetypes fill every cell (fords in every valley, showers wherever it rains); place cards give personality where players will remember it (the ladder, the High Hoh Bridge, Heart Lake, Royal Basin's moraine).

### 14.3 From research to content

| Research field | Becomes |
|---|---|
| `nodes`, `segments` | The compiled park graph (deterministic ingest) |
| `nodes[].description` | Past-tense place text in the book's voice (3 variants: day, dusk, rain or snow) |
| `nodes[].scene_art_notes` | Scene recipes; new pictures only for landmarks |
| `nodes[].camp` | Camp tags, quotas, fire, toilets, water |
| `segments[].hazards`, `notes` | Canonical hazard tags; tide gates parsed from notes and confirmed |
| `segments[].snow_free_typical` | Snow windows for the snow model |
| `classic_trips` | The ranger's presets |
| `classic_trips[].what_goes_wrong_for_underprepared_hikers` | **Simulation assertions** (one per line) |
| `hazards[]` (with `game_event_idea`) | Place-card stubs |
| `wildlife_and_plants[]` | Field guide entries, discovery and sketch cards, sprites |
| `permit_and_rules[]`, `conditions_2026[]` | Permit logic and the dated conditions overlay |
| `uncertain_claims[]` | Never stated as fact; flagged in the review book |

### 14.4 The authoring loop (per batch of about 25 cards)

1. **Ingest** the research and read the ingest report.
2. **Scaffold** card stubs from hazards, recipes from art notes, assertions from "what goes wrong".
3. **Write** one family or one place per file, against the Authoring Brief (`content/AUTHORING.md`: schema, six exemplar cards, voice rules, fairness rules, multiplication rules, originality rules).
4. **Lint** to zero errors.
5. **Bench** each card under six loadouts.
6. **Render** new pictures to PNG and look at them.
7. **Simulate** the region's matrix: targets, coverage, ablations, calibration.
8. **Read** about 20 trip transcripts for voice, pacing and repetition.
9. **Review book:** an HTML book for you, with each card as the player sees it, odds for four loadouts, Storybook and Perilous outcomes side by side, new pictures in every palette, and the facts used with their sources and confidence.
10. **Playtest** on the iPhone preview build; notes come back to step 3.

**Fairness rules for every card:** every bad outcome has a mitigation that exists in the catalog or as a choice; every % comes from a check with labeled modifiers; numbers come from research data or shared constants, never invented per card; Storybook never kills; each choice has a *different kind* of consequence (time vs. risk vs. comfort vs. Leave No Trace); at least one delayed consequence or echo per three cards.

**Rough effort:** about 8 to 12 Claude sessions per region after M1 (ingest, place text, place cards, new archetypes, pictures, templates and assertions, a balance pass). Several sessions can author in parallel, one per region or family, because files and ids are namespaced.

---

## 15. Build roadmap

From the vertical slice to the full park. Each milestone ends with you playing it on your iPhone. A **session** below means one focused Claude Code working session of a few hours. The estimates are rough, and each milestone names what gets cut first if it runs long.

### M0 and M0.5, side by side: foundations and the look

The look-and-feel spike (M0.5) is the biggest risk, and it needs only the picture VM and the page frame, so it runs first or alongside M0, before content piles up.

**M0: Foundations** (3-5 sessions)
- Repo layout, the Pages workflow (one combined deploy for main and preview, E.9), the PWA shell with the offline stamp, the debug overlay and error sheet.
- Engine core: rng, expressions, templates, content loader and index, effects, phases with stub screens, saves.
- Picture VM with 3 test pictures and headless PNG rendering; linter skeleton; harness skeleton with one bot.
- **Exit:** a two-page "hello trailhead" book installs to the Home Screen and works offline; 1,000 trivial simulated trips run.
- **Cut first:** the debug overlay's extras (keep Copy bug report).

**M0.5: Look-and-feel spike** (2-3 sessions)
- One composed scene and one hand-drawn scene; a full page frame with the Sierra narration box and the pixel font; one decision with a Why sheet, a ♦ confirm and the compass roll; draw-in and palette cycling; PC-speaker beeps (page turn, Look, stamp). On a real iPhone SE and a Pro Max, including the SE's short-screen layout.
- **Exit:** you confirm the pixels are chunky but crisp, the text is readable, the narration box makes every page look like a Sierra game, and it feels like a KQ picture book. Fix fonts and scaling now.
- **Cut first:** the hand-drawn scene (keep the composed one).

### M1a: One Hoh book (8-12 sessions)

- **Scope:** the Hoh trailhead to Glacier Meadows and the moraine. Two or three fixed presets (Happy Four; Glacier Meadows in one night; the 3-night classic) on a short list of dates, pack presets plus free packing, the store with Fill from the list, a one-page drive, Storybook only.
- About 40 cards (fords, rain, cold nights, the ladder, the High Hoh Bridge, elk, bear, people, sunsets), 6 scenes, the prologue, the endings including the Hard Way, the back cover and Field Notes.
- **Exit:** the day-gear assertion passes (F.1: trouble or worse at least 80%, rescue 15-35%); the harness finds no crashes, dead ends or stuck states; **you play all the presets on your phone.**
- **Cut first:** the 3-night preset (keep Happy Four and the one-night trip).

### M1b: The full Hoh, and Olympus by guide (10-15 sessions)

- **Scope:** all 15 Hoh camps, day hikes, 1-5 nights with layovers, June to October; the full planner with the calendar rule and the camp list; one scripted quota denial (Glacier Meadows full on a July Saturday).
- **Olympus via a guide:** the guide desk, the glacier kit, glacier school and the `glacier` skill, Snow Dome and the summit, and the forced moraine card for everyone unroped (4.2).
- About 95 cards in total, about 12 scenes and 3 plates; the Snowlamp at Glacier Meadows and the moraine; Perilous with the restore ring; share codes; Walk out; the nightly calibration job; the audio cues (13.2).
- **Why the Hoh first:** it is your own example ("Olympus with day-hike gear in one night") and becomes a CI assertion; it spans every band from rain forest at 578 ft to glacier; it is one trail with about 140,000 possible plans and no loop routing yet; its hazards are the canonical ones; its research is the most complete; and the Hoh Lake trail links it to M2. It doesn't exercise loops, traverses or WIC-only camps; M2 does.
- **Exit:** the Hoh rows in F.1, including day gear, guided Olympus and the literal summit; the guided preset passes the validator and summits in 55-75% of equipped simulations; story uniqueness at least 90% on 3-4 night templates; return days average 3 to 6 pages; the device checklist passes; **you play three different Hoh trips and want a fourth.**
- **Cut first:** the Snow Dome high camp (keep the guided summit day from Glacier Meadows), then share codes.

### M2: Sol Duc, Seven Lakes Basin and the High Divide (8-12 sessions)

- First loop routing (direction and variants), the first traverse (the Hoh to Sol Duc via Hoh Lake) with the car's location and the exit menu (3.7), cross-region routing, WIC-only camp requests.
- Quota-heavy permits ("Lunch Lake is full that night"), way trails and fog navigation, the dry crest, mosquitoes, the High Divide thunderstorm, bears in the huckleberries.
- About +90 cards (mostly place patches) and +10 scenes.
- **Exit:** every coverage cell in the region has at least 32 notable cards; the ablation vector passes for map and compass, water capacity, bug kit and rain pants.
- **Cut first:** Cat Basin and the WIC-only lake camps.

### M3: Royal Basin = v1.0, all three must-haves (8-12 sessions)

- The northeast region: the Upper Dungeness trailhead, Royal Creek, Royal Lake and the upper basin, plus natural neighbors (Marmot Pass, Deer Park, Grand Valley as data allows).
- The rain-shadow weather, different flora, tarns and moraine, the Mount Deception skyline, rodents at Royal Lake, the WIC-arranged upper-basin permit.
- About +60 cards and +8 scenes.
- **v1.0 release:** three must-haves, about 260 cards (730 choices), about 170 places, 5 trailheads, 30 presets, the full lint and simulation gates. **The endpaper map shows the whole park, with every unbuilt region drawn in pencil and unchoosable** (4.1), and the ranger's list holds only playable trips.
- **Cut first:** Marmot Pass and Deer Park.

### M4: The Wilderness Coast (10-14 sessions)

- **New system:** tides (the NOAA table, the tide booklet, the HUD, headland checks, overland rope ladders as alternate segments, river mouths at low tide). Beach camps, raccoons, fog, sneaker waves, the respectful petroglyph and island beats.
- About +80 cards; a new biome set (beach, sea stacks, coast forest); surf cycling.
- **Cut first:** the Shi Shi end of the North Coast.

### M5: The rest of the park (25-40 sessions)

- The Elwha and Hurricane Ridge (including the Madison Falls road walk), Enchanted Valley and the Quinault, the Duckabush and LaCrosse Basin, Staircase (closed through the conditions overlay while that lasts), the Bogachiel and Queets, Grand Valley and the Gray Wolf, the expert routes (Bailey Range, Skyline).
- About +250 cards, mostly place patches; the generic families are stable by now.
- **Exit:** the full-park targets in 14.1 with every region's coverage cells filled, and no pencil regions left on the map.
- **Cut first:** the Bailey Range and Skyline expert routes.

### M6: Companions and polish (8-12 sessions)

- Optional named companions (0 to 3, player-named, never assumed), traits, shared group gear, party UI and companion lines; rope teams without a guide.
- The deferred extras: the Pictures, Money (Shoestring), Units, Paper and Notebook settings; the Tandy sound mode; "trail of the day"; badges.
- Accessibility pass, the full Perilous death set, all 104 field guide entries, Read to me (if you want it).

**In total:** about 40 to 60 sessions to v1.0, and roughly 80 to 125 to the full park.

---

## 16. Risks

| Risk | Mitigation |
|---|---|
| **Writing volume and voice drift.** Hundreds of pages, item notices and look boxes must keep one quality voice. | A strict style guide and Authoring Brief; templates and pools; archetype + place patch; 20 transcripts per batch; your review book; a dedicated writing pass for the 24 signature places |
| **Procedural scenes look samey or muddy** at 160x168. | The M0.5 look-and-feel spike on real iPhones; PNG previews Claude can see; a picture editor for hand-drawn scenes; biome bases reused, only landmarks drawn new |
| **Odds feel unfair** (a 90% that fails; a 74% headland that dunks the pack). | Clear bands and fail tables; kind outcome text; Field Notes showing the causes; calibration gates; bots that only see shown information |
| **Numbers feel like a spreadsheet.** | Odds live in a small pencil tag; the Why sheet is opt-in; Words mode; the compass roll only on ♦ choices; playtest Numbers vs. Words defaults |
| **Too many tuning knobs** (about 60). | One `tuning.json`; the harness built before most content; tune physics against reality first, then event bases |
| **Content is the critical path, not code.** | The coverage matrix assigns writing where players go; parallel authoring by region and family; generic families cover gaps |
| **The expression language grows into a programming language.** | A fixed function whitelist, no loops or assignment or randomness; bigger needs become tested engine features |
| **Research data is inconsistent** (duplicates, one-way segments, null gains, statuses as hazards, conflicting dates). | The ingest step and its report; graph lint rules; overlays; `uncertain_claims` never stated as fact |
| **Real 2026 conditions go stale.** | Overlay entries carry from/until dates and a last-confirmed date, and stale ones are told as "last we heard" (4.7); the overlay is one file to refresh; the Timeless setting |
| **iOS storage eviction** and the Safari/Home Screen split. | Install prompt before the first save; Export/Import codes; `storage.persist()` where available |
| **Pixel-font readability** on small phones. | Device-pixel font sizes (11.9); the Book font; the short-screen layout; a 260-character page budget linted at 375 x 667 (12.1) |
| **Performance and battery** (cycling, draw-in, audio, look-ahead). | 8 fps cycling only when visible; Reduce Motion; one blit per frame; look-ahead in a Web Worker with a 50 ms budget (8.9) |
| **Tone.** Perilous humor about drowning or hypothermia can feel flip to people who know real park accidents; rescue must stay gentle without trivializing SAR. | Jokes aim at the choice, never the loss; never about real incidents (the 2026 Appleton fatality is never dramatized); a real Ranger's Note on every death page; your review of the humor temperature |
| **The homage drifts too close to the book.** | All prose original; lint T04; the Authoring Brief; the colophon acknowledgment; no fox in park scenes |
| **Fictional business names collide with real ones.** | A deny-list check (lint T03) before shipping |
| **Teaching wrong backcountry facts** (the stylized trail-bug timing; design-only odds). | Label stylized numbers in Ranger's Notes; hard facts come from data through slots, so they change in one place |
| **Free Pages needs a public repo.** | Confirm visibility ([Decisions](#decisions-needed-from-you)), or host the site from a public repo |
| **Players misread the %.** | The button shows "made it", ♦ choices add the fail share in red (8.8), each odds form is explained the first time (8.7), and Words use the same number |
| **Scope: M1 holds most of a game.** | M1 split into M1a and M1b, each with a session estimate and a cut list (15) |
| **The preview channel breaks the stable link or its saves.** | One combined deploy; storage and caches namespaced by channel; a CI test for shared names (E.7, E.9) |

---

## Appendix A: Olympus in one night with day gear

> *"Go for Mount Olympus with day hike gear in one night, might have a problem."* This is exactly how the problem happens, and why it is honest. The kit is the catalog's canonical trap kit (6.8), and the formulas are those of sections 7 to 9. The numbers are illustrative until the M1 engine regenerates this appendix from a seeded run (F.4).

### A.1 The plan the player made

| Item | Value |
|---|---|
| Itinerary | Hoh trailhead to Glacier Meadows (17.4 mi, +4,292 / -683 ft), 1 night, out the same way. Sat Sep 25 to Sun Sep 26, 2027 |
| The day before | Friday Sep 24 at the WIC: permit, loaner canister, briefing. Shopping and packing that evening |
| Permit | Glacier Meadows (quota area; available in late September) |
| Hiker | Regular fitness, 165 lb, all skills 1 |
| Drive | Left Port Angeles Saturday at 8:15, Hoh trailhead 10:40, walking at 10:45. Legs: Fresh (92) |
| Pack | `olympus_day_gear_one_night_TRAP` in the Ridge Runner Daypack 28. Worn: canvas sneakers, cotton tee, jeans, cotton socks, a cap. Carried: a cotton hoodie, the park brochure map, a phone at 80%, one 1-L bottle, the WIC loaner canister. **10.4 lb: Light** |
| Food | 1,800 kcal in the canister: a sandwich, three bars, trail mix |
| Missing, vs. the ranger's kit for High, September | Rain jacket and pants, a warm non-cotton layer, sleeping bag, pad, shelter, stove, water treatment, headlamp, a real map, first aid, knife, fire starter |

**The warnings the player got, and walked past:**
- **At the ranger desk,** the Trip Outlook, assuming the ranger's kit: *"If you pack well: a very long day. You'd reach Glacier Meadows tired and around dark, and a cold night up there is normal in late September."*
- **At Close the pack,** the Outlook with this pack: *"With this pack: this trip very likely ends in serious trouble. About one time in four, rangers help you down. Biggest gaps: no sleeping bag, no headlamp, no rain jacket."* The margin fox tapped its wrist the whole time.
- **At the trailhead:** *"Glacier Meadows about 12:30 am: five and a half hours after dark, by phone light."*
- **The forecast,** from Friday (the planning day): Saturday *Cloudy, showers likely after noon, snow level 6,500 ft* (60%); Sunday *Rain* (80%).
- **Actual weather** (seed 4417): Saturday overcast, showers from 2:30 pm, steady rain after 9 pm. Sunday rain.
- **Daylight, September 25:** sunset 7:08 pm, civil dusk 7:38. Under the Hoh canopy trail-dark would be 7:13; under Saturday's heavy overcast it comes 15 minutes earlier, at **6:58**.

### A.2 Saturday

Today's legs: 1.03 (slightly slow).

| Clock | Where | What happens | Legs · Warm · Wet |
|---|---|---|---|
| 10:45 | Hoh trailhead | Pace: Steady | 92 · 75 · 0 |
| 12:50 | Five Mile Island | Joy: an elk bugles across the gravel bars. Then the **first Fork card** (12.12) | 82 · 75 · 0 |

**The first fork, at Five Mile Island, 12:50 pm** (the first landmark where the ETA lands after dark):

| Choice | ETA | Look-ahead (400 runs) |
|---|---|---|
| Push on to Glacier Meadows | ~12:15 am (11:30-1:00), 5 h after dark | *mostly trouble*: OK 5% · serious trouble 70% · rangers help 25% |
| Stop at Happy Four tonight (0.7 mi; not a quota camp) | 1:10 pm | A cold night near the car: Trouble 85% · Serious 12% · help 3% |
| Turn back to the car | 2:55 pm | Sooner Than Planned, safe |

**The player pushes on.**

| Clock | Where | What happens | Legs · Warm · Wet |
|---|---|---|---|
| 2:20 | Hoh braids | Routine ford: late-season low water (flow 0.8, base 97). Narrated | 76 · 74 · 0 |
| 3:20 | Olympus Guard Station | Is a ranger in? 30% on a late-September Saturday. No | 72 · 72 · 6 |
| **4:03** | **Lewis Meadow** | **Second Fork card** (still arriving after dark) | 70 · 72 · 9 |

**The second fork, at Lewis Meadow, 4:03 pm:**

> *The light was going pewter. Glacier Meadows was still seven miles and 3,650 feet above, and the daypack held a cotton hoodie, two bars and a bag of trail mix.*

| Choice | ETA | Look-ahead (400 runs) |
|---|---|---|
| Push on to Glacier Meadows | ~12:25 am (11:40-1:10), 5½ h after dark | Serious trouble 75% · rangers help 25% |
| Hike to Elk Lake instead (off-permit) | 8:20 pm | Own way out 90% · rangers 10% |
| Spend the night here (off-permit) | now | Trouble 85% · Serious 10% · rangers 5% |
| Turn back to the car | 10:40 pm by phone light | Sooner Than Planned, safe |

(ETA for pushing on: 6.31 h of hiking left. 2.92 h fits before trail-dark at 6:58; the other 3.39 h runs at x1.6 by phone light, which is 5.42 h.)

**The player pushes on again.**

| Clock | Where | What happens | Legs · Warm · Wet |
|---|---|---|---|
| 5:30 | High Hoh Bridge | The gorge in amber light. +5 | 60 · 74 · 13 |
| 6:58 | below Martin Creek | Trail-dark (overcast). *Robin thumbed on the phone's light.* | 43 · 76 · 22 |
| 8:20 | Elk Lake | Legs below 30 after the climb: *Eat extra?* Eats the trail mix | 25 → 47 · 77 · 26 |
| 9:05 | above Elk Lake | Steady rain. The cotton hoodie soaks through | 44 · 77 · 40 |
| 10:40 | avalanche chutes | **Footing** (plain %: the worst case is a mild sprain). Base 90, phone light -20, wet rock -5, tired -10, skill +2 = 57 clean, shown **79%**. Roll 41: clean | 28 · 76 · 60 |
| 12:05 | **the ladder** | **♦ Ladder** (a fall can be Serious). The same 57 clean: **♦ 79% · 21% fall**, a confirming tap, the compass. Roll 68: **Shaky**. *A foot slipped; the rope saved Robin.* | 21 · 76 · 74 |
| 12:25 am | Glacier Meadows | Arrival, in the dark and the rain. The phone, which was the light, the clock and the map, is at 11% | 18 · 75 · 75 |

Warmth stays fairly high because climbing makes heat. **The danger starts when the walking stops.**

### A.3 The night

The forecast low at Glacier Meadows is 35 °F. With no bag, no pad and a soaked cotton hoodie, Robin is comfortable down to about **74 °F** (65 with no bag, +10 for no pad, minus a sliver for wet cotton). Bedtime choices:

| Choice | What it does | Shown to the player |
|---|---|---|
| Curl up under the biggest tree | Margin about -39 | *Chance you get through the night without dangerous shivering: 55%* |
| Look for other campers' lights | 55% someone is here on a late-September Saturday | Roll 22: **a tent glows blue through the trees.** Then *Ask for help* (70%): roll 35, yes |
| Walk laps all night | Warm while legs last; bonk around 2:30 am; the phone dies first | *probably worse* |
| Eat both bars now | +25 legs; food gone | (no roll) |

The neighbors lend a spare puffy and a foam sit pad, make room under their tarp, and pour cocoa. Now Robin is comfortable down to about 52 °F (74, minus 12.6 for the puffy worn without a bag, 6 for the sit pad, 2 for the tarp, 1 for the cocoa). The actual low is 34.6 °F: **margin about -18**. Hypothermia roll 12% (*88% you'll be okay*): roll 58, fine. Sleep quality 0.4.

**Dawn:** a calorie deficit of about 2,100 lowers the energy ceiling to 86; a poor night caps the morning at 69. Legs 69, Warm 42 (Cool, barely), Heart 36 (Grumpy).

### A.4 Sunday

Rain all day. Today's legs: 1.05.

| Clock | Where | What happens | Legs · Warm · Wet |
|---|---|---|---|
| 7:30 | Glacier Meadows | The neighbors press oatmeal and jerky on Robin (+500 kcal) | 69 · 42 · 74 |
| 7:40 | | Morning: hike out (ETA 5:20 pm; own way 90%, rangers 10%) or wait for help. Hikes out | 69 · 50 · 74 |
| 8:10 | the ladder, down | Base 90, wet -5, skill +2 = 87 clean: **♦ 94% · 6% fall**. Roll 12: clean | 66 · 70 · 76 |
| 1:00 | Lewis Meadow | Narrated. Eats the gifted food | 45 · 72 · 85 |
| 3:40 | near Five Mile Island | **Crisis: Bonked.** *Robin's legs felt like wet bread.* Ask passing day hikers (someone passes 90% of hours on a Sunday): 70%, roll 51, yes. Two granola bars | 12 → 36 · 66 · 86 |
| 6:05 | Hoh trailhead | Out, about an hour before trail-dark | 14 · 68 · 86 |

### A.5 The ending

Robin reached Serious twice (a bagless cold night; bonked far from the car) but walked out as planned. Ending: **The End, the Hard Way** (9.3), and the volume is titled ***A Soggy Story: Made It Back, Barely***. The plate: the car in the rain, Robin asleep in the driver's seat with the heater on. Score: about 30 of 64, with the finish bonus halved. Leave No Trace: 100 (the food stayed in the canister).

**Field Notes** (open by default after the Hard Way):
> *The night was cold because:* no sleeping bag (a 20 °F bag is worth about 35 °F of comfort), no pad (10 °F colder), a cotton hoodie soaked by the evening rain (wet cotton keeps a fifth of its warmth). Kind neighbors (about 22 °F) made the difference.
> *You ran out of legs because:* 1,800 kcal for two days that burned about 7,400.
> *You arrived after midnight because:* a 10:45 start for 17.4 miles in late September, when the Hoh goes dark before 7 under cloud.
> *The phone was your light, your clock and your map,* and it was at 11% by midnight.
> *A gentler plan:* the classic 3 to 5 nights (Lewis Meadow, Glacier Meadows twice, Five Mile Island), a 20 °F bag, a pad, a tent, rain gear and a headlamp. That plan finishes happily about nine times in ten, even in late September.

### A.6 The same situation, 20,000 times

From `simulation.md` 12.3 (its scratch calculator, day-hike gear, the Lewis Meadow fork). M1 regenerates this table with the canonical kit. Each row reads Happy · Trouble · Serious · Rescue, in percent; "Serious" here means walked out after reaching Serious (the Hard Way).

| Choice at the Lewis Meadow fork | Happy · Trouble · Serious · Rescue |
|---|---|
| Push on (Storybook) | 0 · 0 · 76 · 24 |
| Push on (Perilous) | 0 · 0 · 75 · 21, plus **4% death** |
| Hike to Elk Lake | 0 · 0 · 90 · 10 |
| Bivouac at Lewis Meadow | 0 · 86 · 9 · 5 |
| Turn back to the car | 100% Sooner Than Planned, safe |
| *The same push with real overnight gear* | 50 · 39 · 9 · 2 |

**Trouble or worse 100%, about one in four rescued in Storybook, about 4% death in Perilous.** The same night with a bag, pad, tent, rain gear and headlamp becomes a hard but fair push. The gap between those rows is the whole lesson of the game, and it comes entirely from the pack. (Target: the F.1 assertion, trouble or worse at least 80%, rescue 15-35%.)

**How single items change this book:**
- **Headlamp:** the ladder goes from ♦ 79% to ♦ 84% (headlamp -10 instead of phone -20), the phone keeps its battery for the clock and the map, and "back down to Elk Lake" becomes sure.
- **Puffy and warm hat:** the cold night drops from Serious to Trouble, and spirits recover by morning.
- **Satellite messenger:** a rescue, if needed, is certain and fast, and the waiting page is short.
- **Water filter:** the "drink from the creek" choice disappears into a margin note.
- **The old field guide (20 oz):** spirits +1 from naming the Hall of Mosses' club moss. At 11.7 lb the pack is still Light, so it costs nothing on the ladder: a small, honest trade-off in the guide's favor.

On the next book, the ranger says, *"Back again! This time, maybe take four days."* The margin fox points at the puffy jacket.

### A.7 Literally the summit, day gear, one night

The same kit and dates, but the player taps the summit onto the plan: Glacier Meadows for the night, then up the Blue Glacier to the top and all the way out on Day 2.

- **At the ranger desk** the planner allows it, and the ranger frowns for a long time. Outlook: *"If you pack well: you'd still need a rope team for the ice. Without a guide, you'll most likely turn around at the moraine."*
- **At Close the pack:** *"With this pack: very likely serious trouble. Biggest gaps: no rope team, no sleeping bag, no headlamp."*
- **Day 1** is A.2: two forks, and most players who get this far push on.
- **Day 2, 9:10 am, the edge of the moraine:** the forced ♦ card (4.2). Late-September ice is bare, so the crevasses show, but Robin is in canvas sneakers with no crampons, and tired. Crevasse base 70, no crampons on ice -20, sneakers -10, tired -10 = 30 clean: **♦ 55% · 45% stopped**.

| Choice | What happens |
|---|---|
| Turn back from the ice (sure) | The glacier view (+5), then the long walk out: *Sooner Than Planned* |
| Step onto the ice unroped | Made it (55%): a slow, frightening hour to the first crevasse field and a second card with worse odds; nobody unroped climbs the summit block. Stopped (45%): 70% a crevasse field turns you back, 25% a slide and a cold wait for a ranger (rescue), 5% a fall into a shallow crevasse (rescue; in Perilous the 30% death roll) |

**The assertion** (the F.2 bot mix, all plans of this shape, late season):

| Outcome | Target |
|---|---|
| Summit | ≤ 1% (in practice 0: the summit block needs a belay) |
| Sooner Than Planned | ≥ 60% |
| Rescue (Storybook) | 15-35% |
| Death (Perilous) | 2-8% |

---

## Appendix B: Seven Lakes and the High Divide, planned well

From the research's `high_divide_loop_3n_layover` preset and `simulation.md` section 13. August 2027. The numbers are illustrative until regenerated from the engine (F.4).

### B.1 The plan

| Item | Value |
|---|---|
| Itinerary | Night 1 Sol Duc Park (7.1 mi, +2,470). Night 2 Lunch Lake via Heart Lake and the High Divide (3.8 mi, +1,130 / -870). Night 3 layover at Lunch Lake (evening side trip to Bogachiel Peak, 3.6 mi round trip, +1,030). Day 4 out via Deer Lake (7.8 mi, +830 / -3,300). Thu Aug 12 to Sun Aug 15 |
| Permits | Sol Duc Park 1 night (Thursday); Lunch Lake 2 nights (Friday and Saturday in the Seven Lakes quota area: a tight weekend roll that came up yes) |
| Hiker | Regular fitness, 165 lb, navigation 2 |
| Pack | Lake Basin Weekender 50, close to the catalog's `summer_3_nights_seven_lakes` kit: standard canister, 30 °F down bag, trekking-pole tent, inflatable pad, down puffy, rain jacket and pants, dry camp clothes, stove and 110 g fuel, filter, first aid, blister kit, sun and bug kits, map and compass, headlamp, trowel, pack liner, sketchbook and pencils; plus a camp chair and a small camera |
| Fit | About 40 L inside of 50 (80%, Roomy). The canister holds 3 days of food (6.0 L) plus smellables (0.6 L): 6.6 of 9.8 L usable |
| Weight | About 29 lb on a 32-lb pack rating: pack ratio 0.91, body ratio 0.70, so r = 0.91 (Comfortable). One extra liter for the dry crest on Day 2 |
| Food | 3,000 kcal a day; three different dinners (no food fatigue) |
| Gaps vs. the ranger's kit | None |

**Forecast** on Wednesday, the planning day: Thu morning clouds then sun (10%); Fri sunny, slight chance of afternoon thunderstorms (20%); Sat sunny (5%); Sun increasing clouds, showers possible (40%). **Actual** (seed 77120): Thu fog then partly cloudy; Fri partly cloudy with a thunderstorm 2-3 pm; Sat clear; Sun showers. Sunrise 6:07, sunset 8:34 pm.

### B.2 The trip

| Day, clock | Beat | Roll | Result |
|---|---|---|---|
| D1 8:30 | Departure in fog: wet brush. Rain pants on, because you have them | — | Wet +1 instead of +8 |
| D1 9:00 | Sol Duc Falls, slick rock: routine 97% | 30 | Narrated; +5 |
| D1 10:15 | A dipper bobbing on a rock. Sketch (10 min) or go on? Sketches | — | Field guide +1 |
| D1 2:30 | Sol Duc Park. Mosquitoes, end of season; bug kit packed | — | Spirits unaffected |
| D1 7:30 | Walk up to Heart Lake for golden hour (1 mi) or rest? Walks | — | Back at 9:00 by headlamp |
| D1 night | 43 °F in the cold-pool basin; comfortable down to about 30 °F (23 with the puffy on): margin +13. Bear visit 10% | 63 | Slept like a marmot |
| D2 8:45 | *"Thunder possible this afternoon. Early start to clear the Divide by noon?"* Early start | — | On the crest 9:50-11:10 |
| D2 10:00 | **Mount Olympus across the Hoh valley** (full-bleed plate). Sketch | — | +5, sketch |
| D2 11:10 | Mirror Lake way trail, navigation: 75 + map and compass 15 + skill 4 = 94 clean, shown **97%** | 77 | Clean |
| D2 11:40 | Scree down to Lunch Lake: 88 + poles 5 + skill 2 = 95 clean: routine | 30 | Narrated |
| D2 2:10 | **Thunder walks along the Divide.** In camp: wait it out in the tent with the sketchbook (the safe choice, no roll) | — | +3 for a wise choice |
| D2 night | A 41 °F night: margin +11. Bear visit roll | 07 | **A visitor.** Big paw prints 30 ft from the closed canister. Nothing lost; a story |
| D3 day | Layover: swim in Lunch Lake, sketch, read in the camp chair. Then: **Bogachiel Peak for sunset?** | — | Yes, with the puffy and headlamp |
| D3 8:31 pm | **Sunset on Bogachiel Peak.** The north-face snowfield above the basin is still there in mid-August (10.6), so the evening is eligible. Not Robin's first eligible book, so normal odds: clear sky 1.0 x (0.30 + 0.15 full sunset + 0.10 headlamp off) = **55%** | 14 | **The Snowlamp.** *Sketch it.* Gold lines; No. 104 fills in |
| D3 9:10 | Down in the dark: navigation 75 + 15 + 4 - 10 (headlamp) = 84 clean, shown **92%** | 55 | Clean |
| D3 9:30 | Scree in the dark: 88 + 5 + 2 - 10 = 85 clean, shown **93%** | 88 | **Shaky** (85 to 92): *a boot skated and Robin sat down hard.* Heart -4 |
| D4 8:30 | Showers. Rain gear on: protection 0.85 | — | Barely damp |
| D4 11:30 | Stone staircase below Deer Lake: 88 + 5 + 2 - 5 (wet rock) = 90 clean, shown **95%**. Knee strain check skipped (poles) | 33 | Clean |
| D4 1:30 pm | Sol Duc trailhead. Pie at The Huckleberry Skillet | — | +joy |

### B.3 The ending

**The End** and **The End of the Blank Page**, gold-bordered. Volume title: *The Snowlamp of Bogachiel Peak*. Score: about 165 of 190 (illustrative). Leave No Trace 100. Five new field guide entries: the dipper, Olympus from the Divide, the marmot, the bear's prints, and No. 104. Field Notes are short: *"You were ready for everything the mountain asked."*

### B.4 The same plan, 20,000 times (random August weather)

| Kit | Happy finish | Finished, but grumpy | Serious |
|---|---|---|---|
| Sensible (as above) | **98.3%** | 1.3% | 0.4% |
| Skimpy: no poles, rain pants, map, puffy or sketchbook | 91.8% | 7.3% | 0.9% |

August in the Olympic high country is forgiving, which is right for "as fun and easy as backpacking": the skimpy kit mostly costs **joy**, not safety. In late September (cold nights, more rain) the gap between the kits should open much wider, and the harness checks that it does.

---

## Appendix C: The coast tide mistake

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
| 3:32 | The cove south of Taylor Point (4.5 ft) | 2.9 (3.4) | Margin +1.1: auto-pass, narrated |
| 4:29 | Scott Creek | 3.1, rising | Tide pools: *sketch the anemones (25 min)?* The misread makes it feel like there's time. Sketches |
| 4:54 | Scott Creek mouth | 3.4 | Creek ford, routine |
| **5:24** | **North end of Strawberry Point (4.0 ft)** | **3.91, rising (4.41)** | **The headland card** |

**The tide at 5:24**, by cosine interpolation between the 3:41 pm low (2.9) and the 9:54 pm high (8.6): 103 of 373 minutes in, so h = 2.9 + 5.7 x (1 - cos(π x 0.276)) / 2 = **3.91 ft**; with run-up, **4.41 ft**. Margin m = 4.0 - 4.41 = **-0.41 ft**, rising.

**The odds:** base = 85 + 55 x (-0.41) = 62.5; rising -10 → 52.5. Then poles +3, foam pad outside -3, coast skill +2, wet rock from spray -5: **49 clean**. Shaky is 25, so the button shows **♦ 74%** with **26% knocked down** in red: about one try in four goes badly.

> *The rocks at the point were wet to the knee between the waves, and each set reached a little further. Tide 3.9 ft + waves 0.5 = 4.4 ft, rising. Passable below 4.0 ft.*

| Choice | Outcome | Cost |
|---|---|---|
| **Go now, between waves ♦ 74% · 26% knocked down** | 49 clean · 25 soaked (pack bottom dunked) · 26 knocked down (then: 55% soaked and pack wet, 25% the foam pad swept away, 15% mild sprain, 5% moderate sprain) | About 1.3% Serious; about 0.4% rescue (Coast Guard, in Storybook) |
| Wait for the sea to fall | 100% safe | Camp at Scott Creek (off-permit, a "tidal delay" the rangers understand; Leave No Trace -2). Lose the Toleak sunset, gain Scott Creek's. Passable again 1:10-7:45 am |
| Go back to Scott Creek and decide there | Same as waiting, plus the walk | — |

**In Perilous mode** there is no death roll at m = -0.41. But every 15 minutes of dithering raises the tide, and once m < -1 a failed attempt carries a 25% death roll.

### C.3 What happened

The player chose **Go now**. Roll 63: **Shaky** (49 to 74). *A wave slapped the rock and climbed Robin's legs to the hip; the bottom of the pack went under for a heartbeat.*

- Wet 55, feet wet. With no liner, each inside item has a 60% chance of going damp: the sleeping bag rolls 41, **damp**; the camp clothes roll 77, dry.
- **Evening at Toleak (6:35 pm):** dry camp clothes on; body wet resets to 0; the bag stays damp.
- **Night:** a 51 °F coast low. The damp bag keeps 60% of its warmth, so Robin is comfortable down to about 42 °F (a damp 30 °F bag 50, foam pad 0, dry base layers -2, tent -4, hot dinner -2): a margin of **+9 °F**. A clammy but fine night (*the bag smelled of the sea*).
- **Day 2 (layover):** wet boots double foot wear; a hot spot card on the tide-pool walk; taped with the blister kit. The bag hangs in the sun for two hours and dries.

**Field Notes:**
> *You read Sunday's tide row on Saturday. Tides come about 50 minutes later each day: on Saturday the afternoon low was 3:41, not 4:31.* ***If this had been October*** *(a 40 °F night, rain), the damp bag would have made the night margin about -2 °F, a long and shivery night, and the dunk could have been the start of a real problem. A pack liner (0.2 lb) would have kept the bag dry.*

### C.4 The good version, and the no-tide-table version

- **Reading Saturday's row,** the player leaves at 11:45 am and passes Strawberry Point about 3:20 pm on the falling tide (2.92 ft, 3.42 with run-up, m = +0.58). Base 85 + 5.8 + 5 (falling) caps at 95; then +3 -3 +2 -5: 92 clean, shown **96%**. Roll 35, clean. The Toleak sunset; *Tide Reader* badge progress +1.
- **With no tide table at all,** the tide modifier is unknown, and the tag reads **`??`** (the margin could be anywhere from comfortable to badly over). Choosing *Wait and watch the water* for an hour shows whether the sea is rising or falling, and the range narrows to about **45-75%** (rising) or **80-95%** (falling). Learning by looking is a skill the game rewards.
- **At `coast` skill 2,** the HUD computes it for you: *"You'll reach Strawberry Point about 5:20 pm: 3.9 ft and rising, passable below 4.0."* The WIC briefing flags the same at planning time. Veterans don't get better dice; they get better information.

---

## Appendix D: Sample storybook pages

All original. The hiker is **Robin** (*they*). Picture notes are in brackets; the caption line follows; then the page text and its choices.

**1. The blank page (prologue)**
`[the open field guide: a marmot plate on the left; "No. 104 THE SNOWLAMP" and an empty box on the right; the pencil fox in the corner]` · *Prologue · Kitchen table · Raining*
> Every page in the old book had a picture except one. Under the words THE SNOWLAMP there was only a pale square of paper, waiting, the way a window waits for morning.

`[ Turn the page ▸ ]`

**2. The packing page (end of Chapter Three)**
`[the closed pack standing upright; the margin fox asleep]` · *Robin's apartment · Evening*
> Into the pack went one small green tent, a sleeping bag that still smelled faintly of last summer, a pot that had seen better soups, two pairs of wool socks and one pair of cotton socks (we will speak of these later), the old field guide, and a great deal of cheese. The pack was full. It looked pleased about it.

`[ Turn the page ▸ ]`

**3. Arriving at Glacier Meadows (a composed page)**
`[subalpine meadow, late snow, firs, the moraine above; golden-hour remap]` · *Day 2 · 6:40 pm · Glacier Meadows · 4,300 ft*
> The last switchback gave up at last, and the trail stepped out of the trees. Subalpine firs stood about in little clusters on a meadow of heather and late snow, and the air smelled, finally, of ice. Robin's socks were still damp from the Hoh, and Robin was thinking mostly about dry ones.

*(Four sources: a "long climb" opener, the place's own past-tense text, an echo of the earlier ford, and the night model's foreshadow. Only the second is unique to Glacier Meadows.)*

**4. A lovely moment (Royal Basin)**
`[Royal Lake mid-afternoon; Mount Deception's snowy wall; a marmot on a boulder; lake cycling]` · *Day 1 · 3:30 pm · Royal Lake · 5,100 ft*
> The trail stepped out of the trees and there, all at once, was the lake, holding the whole mountain upside down as if it were no trouble at all. A marmot on a warm rock looked at Robin, decided Robin was not an emergency, and went back to sunbathing.

`[ Sketch the marmot  20 min ]` `[ Find a campsite ]` `[ Sit for a while ]`

**5. First sight of Olympus (full-bleed plate)**
`[tall plate: the Hoh valley in blue haze; Mount Olympus and the Blue Glacier filling the far half; heather; a tiny hiker; chrome hidden]`
> *The ridge ended in sky, and across the whole deep valley of the Hoh stood Mount Olympus, wearing its glaciers the way an old king wears a cloak he has had for a very long time.*

`(tap anywhere)`

**6. An animal helper with odds (the High Divide, September)**
`[subalpine slope, huckleberries in red and green; a black bear downslope, eating; the trail crossing the slope]` · *Day 2 · 11:00 am · High Divide · 5,200 ft*
> Below the trail, a black bear was eating huckleberries with the total concentration of someone who has only six weeks to eat a whole winter's worth. It had not noticed Robin yet. The trail went right past its patch.

`[ Wait for it to wander   ~45 min · sure ]`
`[ Make noise, walk on          95%  (i) ]`
`[ Sketch it from here         20 min ]`

*(Why: base 80; poles +5 (you look bigger, and they click on rock); the bear is downhill and busy +5 = 90 clean, shown 95%. If it goes badly, the bear stands up to look, you back away slowly, and lose 20 minutes and a heartbeat or two. Never more than that, in either mode, so it is a plain %, not a ♦.)*

**7. A small mishap (Lunch Lake)**
`[Lunch Lake shore; a gray jay on a fir branch with something round and pale in its beak; the hiker with empty hands]` · *Day 2 · 12:40 pm · Lunch Lake · 4,450 ft*
> Robin set the tortilla on a rock for one second, which is exactly one second longer than a Canada jay needs. Somewhere in a subalpine fir, a very small bird was now having a very large lunch.

`margin: ✎ Food: -1 lunch (the jay)` · `[ Turn the page ▸ ]`

**8. A critical decision (the ladder at dusk, with day gear)**
`[the Glacier Meadows ladder in the washout; dusk remap; the hiker small at the bottom; a daypack, no tent]` · *Day 1 · 7:50 pm · below Glacier Meadows · 4,100 ft*
> It had been a very long day, and it was turning into a very short evening. Ahead, a ladder climbed the raw gray side of the washout, and above it the light was going pink and then not pink. Robin's daypack held a sandwich, a light jacket, and good intentions.

`[ Climb the ladder        ♦ 70%  (i) ]`
`[                         30% fall   ]`
`[ Hunker down here     cold · sure ]`
`[ Walk back to Elk Lake   ♦ 75%  (i) ]`
`[                         25% hurt   ]`

*(Why for the ladder, all from the shared tables: base 90; no light (the phone died at the bridge) -35; tired after 17 miles -10; wet rock -5; poles +5 = 45 clean: clean 45 · shaky 25 · fall 30. If it goes badly: a slip on the rungs, a hurt ankle, far from help. Back down to Elk Lake is maintained trail, base 95, with the same -35, -10, -5 and +5: 50 clean, shown 75%, and a sprain in the dark can be Serious, so it is ♦ too.)*

**9. A bad night**
`[night page, black paper; the hiker under a tree in a crinkly emergency blanket that glints; stars]` · *Night 1 · below Glacier Meadows · 31°F · clear*
> The night was clear, which is lovely to look at and terrible to sleep in. The emergency blanket crackled every time Robin breathed, so Robin tried breathing less, which did not help. Some time after midnight the stars got very bright and Robin's toes got very quiet.

`margin: ✎ Warm: cold · ✎ Heart: ♥♥○○○ · ✎ Feet: numb` · `[ Turn the page ▸ ]`

**10. With a little help (a Storybook rescue)**
`[the Olympus Guard Station porch; a ranger with a thermos; the hiker in a wool blanket; afternoon light]` · *Day 2 · 4:15 pm · Olympus Guard Station · 950 ft*
> The ranger's name was Ines, and she had a thermos, which is the second-best thing a person can have on a cold mountain. The first-best thing is someone who knows where you are. "You're all right," she said, the way people say it when it has just become true.

`[ Turn the page ▸ ]` → *The End, With a Little Help*

**11. Sooner than planned**
`[the trailhead sign in soft rain; the car; the hiker taking off the pack]` · *Day 2 · 2:00 pm · Hoh River Trailhead · rain*
> Robin had meant to sleep beside a glacier, and instead was going to sleep beside a pizza, and found, on reflection, that this was also a fine place for a story to end. The mountain would keep. Mountains are very good at that.
>
> **THE END,** *sooner than planned*

**12. A tide decision with no tide table**
`[headland base; a cliff; a round red-and-black marker above a rope ladder; surf cycling at the foot]` · *Day 2 · 1:20 pm · south of Third Beach*
> The beach ran out at a wall of rock with the sea folding itself against the bottom. Up the cliff hung a rope ladder and a round red-and-black sign, the coast's way of saying *there is another way.* Robin thought about the tide table, which was at home, on the fridge.

`[ Round the point          ♦ ??  (i) ]`
`[ Go overland, up ladder  +1 hr · sure ]`
`[ Wait and watch the sea      ~1 hr ]`

**13. The Snowlamp: arrival, blue hour, the glow**
`[upper Royal Basin; a tarn; the moraine; a snowfield; Mount Deception; no flowers anywhere]` · *Day 2 · 4:40 pm · Upper Royal Basin · 5,700 ft*
> Up here there were no flowers. There was stone, and snow, and a little round tarn the color of a cold eye, and a wind that had come a long way to say nothing in particular. Robin looked anyway.

`[blue-hour remap: the snow pale blue; the headlamp beam in yellow]`
> The sun went down behind the ridge, and the snow turned blue, the way snow does when it thinks no one is watching. Robin's headlamp made a small yellow room in the dark.

`[ Turn off the headlamp ]` `[ Keep it on ]` `[ Go to bed ]`

`[tall plate; one point of gold cycling outward in the blue snow; chrome hidden]`
> *And there, where the snow was bluest, something small was shining. Not like a lamp. More like a lamp remembering.*

`[ Sketch it ]` `[ Pick it to take home ]` `[ Just look ]`

**14. Sketch it, and The End of the Blank Page**
`[zoom 2x on the glow; lines drawing in gold on white paper, one by one]`
> Robin drew it twice, to be sure. The pencil had never once made a golden line before, and it never would again. By the time the second drawing was finished, the flower had gone back to being a small, ordinary-looking thing in the snow, and that seemed right too.

`[the field guide plate: the gold sketch inside the once-empty box]`
> *Seen at the top of Royal Basin, after sunset. Left where it grows.*

`[The End plate, gold-bordered; the closed book on the dashboard; the fox asleep on it]`
> Robin came down the mountain with a light pack, wet boots, and a page that wasn't blank anymore. The flower stayed up there, in the snow, being exactly where it belonged.
>
> **THE END**

**15. A quiet page (nothing happens, beautifully)**
`[a rain-forest gravel bar at dawn; mist in bands; elk silhouettes across the river; a wren hotspot]` · *Day 3 · 6:20 am · Five Mile Island · 780 ft · fog*
> In the morning the river was wearing the fog like a scarf. Across the gravel, the elk were already at breakfast, and a wren somewhere was singing a song far too big for anyone its size.
>
> *And far away, the river went on talking to itself.*

`[ Turn the page ▸ ]`

---

## Appendix E: Tech architecture and data files

*For the engineering sessions. Players never see any of this.*

### E.1 Principles

1. **Data first, engine small.** Every place, item, card, line and picture is data. The engine is an interpreter of roughly 6 to 8 thousand lines that knows nothing about the Hoh. Growing to the whole park is a content job, not an engine job (tides are the one genuinely new system).
2. **Deterministic.** A trip is a pure function of `(edition, seed, plan, profile snapshot, actions)`. The profile snapshot holds exactly the profile fields the engine reads (skills, region memory, recently seen cards for novelty, the Snowlamp first-book flag, field guide state), and it travels with every save, bug report and trip code. That gives replays, share codes, exact bug reports, and a test harness that runs the real game.
3. **The pack talks through tags; cards listen to tags** (6.5).
4. **Honest odds come from the same code that rolls.**
5. **Validate at the door.** With an AI writing most of the content, the linter and the simulation gates are the main quality tool.
6. **Gentle by default, harsh by data:** death exists only inside Perilous overrides.
7. **The phone is the target; Node is the lab.** Everything that runs on the phone runs headless in Node.

### E.2 The one boundary

```
 engine/ (pure: no DOM, no timers,
          no Math.random)
   rng · expr · content index · plan
   pack · weather · movement · body
   tides · director · cards · effects
   queue · narrator · score · phases
   save
        ▲ Actions         │ Pages
        │                 ▼
 ui/   DOM pages, text, choices, map,
       store, pack spread, settings
 gfx/  picture VM ▸ composer ▸ palette
       remap and cycling ▸ canvas
 platform/ storage, service worker,
       share, audio
```

```
Page   = { scene, caption, paragraphs,
           choices, margin, odds }
Action = choose | turn | plan | buy
       | pack | car | setting ...
step(state, action) -> { state, page }
```

The UI never changes game state; the engine never touches the DOM. Node imports the same engine modules for the simulator, card bench, transcripts and picture previews.

### E.3 Stack

- **Plain ES modules, no bundler, no framework.** What runs on the iPhone is exactly the files in the repo, so a pasted stack trace points at a real line, and Node imports the same files. A 40-line DOM helper is enough for about 14 page types.
- **Types from JSDoc**, checked with `tsc --checkJs` in CI only. Content types are generated from JSON Schema.
- **Zero runtime dependencies.** Dev dependency: TypeScript (type-check only). Everything else uses Node 22 built-ins (`node --test`, `node:zlib` for PNGs, `worker_threads` for the harness).
- **Text is DOM; only the picture is canvas.**
- **The only build step is for data:** `tools/build.mjs` compiles the content into one edition file (E.4). The code ships as written.
- **Escape hatch:** if first load ever gets slow, one `esbuild` step in the deploy job bundles it, with no source changes.

### E.4 The data pipeline

```
design/data/regions/*.json   (research)
design/data/*_catalog.json
design/data/park_rules.json
        │  tools/ingest.mjs
        ▼
content/park/regions/*.json  (normalized)
  + content/park/overlays/   (hand patches)
  + content/park/conditions/2026.json
  + cards, text, scenes, gear, food, stores
        │  tools/build.mjs: validate ▸
        │  compile expressions ▸ index cards ▸
        │  compile pictures ▸ lint ▸ hash
        ▼
dist/data/edition.<hash>.json + precache
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

**Known data fixes for the region files** (found in review; the ingest report will catch them, but they should be fixed at the source):
- `northeast_dose` `dose_to_quinault_traverse`: day 3 miles are null; it ends at `enchanted_valley`, not a trailhead; its total, 15.4, is under the graph's 22.2 at least.
- `northeast_dose` `dose_to_elwha_traverse`: ends at `elkhorn`; total 19.1 against at least 35.3 on the graph.
- `south_quinault_skok` `quinault_to_elwha_traverse`: three null days.
- `elwha_hurricane` `hurricane_ridge_elwha_grand_valley_loop`: a null day and a blank total.
- `elwha_hurricane` `bailey_range_traverse` and `northern_bailey_range_dodger_exit`: null days (off-trail, so expected; they stay hand-checked).
- Small shortfalls: `white_mountain_loop_from_dosewallips` day 3 (12.1 against 12.2) and `quinault_to_dosewallips_traverse` day 3 (6.7 against 6.8).
- `hoh_olympus` still says "WAG bags" at Caltech Rocks and Snow Dome; `park_rules.json` now requires blue bags.
- `FACT_CHECK.md` says the Bailey Range is the only itinerary shorter than the graph allows; the list above shows otherwise. The ingest report, not that note, is the check.

### E.5 Data files

**Inputs that exist now** (fact-checked 2026-10-08; cite, don't copy):

| File | Holds | Feeds |
|---|---|---|
| `regions/*.json` (6) | Places, segments, trailheads, 150 classic trips, hazards, wildlife, rules, 2026 conditions, uncertain claims, sources | The park graph, presets, cards, scenes, assertions |
| `park_rules.json` | Permits, quotas, fees, food storage, fires, LNT, climate, tides, SAR patterns, wildlife, fall 2026 conditions | Planner, weather, tides, rescue, ranger lines |
| `gear_catalog.json` | 8 packs, 218 items, tiers, tag and stat glossaries, sample kits, rentals | Closet, store, pack, tags |
| `food_catalog.json` | 86 foods, daily needs, canister capacities | Store, canister fit, energy, morale |

**New data the game needs** (to be written during M0-M1):

| File / field | Holds |
|---|---|
| `content/park/conditions/2026.json` | Closures, road walks, fire bans, ladder condition; each entry has `from`, `until` or `persists`, and its last-confirmed date (4.7) |
| `data/climate.json` | Zone x month: references, rain chance, thunderstorm chance, weather chain, freezing level (from `park_rules.json`) |
| `data/daylight.json` | Sunrise, sunset, civil twilight for the 1st and 15th of each month |
| `data/tides/la_push_YYYY.json` | NOAA high/low predictions, plus per-place offsets |
| `rules/kits.json` | The ranger's sensible kit by zone x month (for the checklist, gap bias and the item-value audit) |
| `rules/tuning.json`, `rules/mods.json`, `rules/macros.json` | Every tuning knob; shared modifier sets; effect bundles |
| Overlay fields per place | `canopy`, `cold_pool`, `water`, `ranger` presence, `snow_feature` (with month windows by snow year), `snowlamp_weight`, `views`, `map_xy` |
| Overlay fields per crossing | River type, monthly base depth, speed, bridge |
| Overlay fields per beach segment | `tide_max_ft`, overland alternative, impassable |
| Catalog additions | `field_guide_old` (*A Pocket Flora & Fauna of the Olympic Mountains*, 20 oz) |
| `journal/entries.json` | The 104 field guide entries |
| `stores/stores.json`, `drive/routes.json` | Fictional stores and inventories; drive routes from the researched drive times |
| `stores/guides.json` | Larkspur Glacier Guides: departure dates, places per departure, the fee, the guide's lines |

### E.6 Saves, and iOS storage realities

`<channel>` is `main` or `preview` (E.9).

| Key | Holds | Size |
|---|---|---|
| `oph.<channel>.profile` (localStorage) | Settings, field guide and sketches (recipe references), skills, region memory, the bookshelf index, recently seen cards, which odds forms you've seen, the Snowlamp first-book flag | 20-80 KB |
| `oph.<channel>.book.<id>` (localStorage) | One autosave per book in progress, at most 3, rewritten after every page | 15-40 KB each |
| `oph.<channel>.ring.<id>` (localStorage) | Perilous only: the restore ring of 5 snapshots | 15-40 KB each |
| IndexedDB `oph-<channel>-shelf` | Each finished book's rendered page text and scene recipe ids, for rereading | 20-40 KB per book, oldest pruned first |

- A save is a **snapshot plus the action log plus the profile snapshot** (E.1). Loads use the snapshot (migrated if the edition changed); the action log replays only for tests and bug reports.
- **Books in progress:** up to three, each with its own autosave. *Begin a new book* with three open asks which one to put on the shelf unfinished.
- **Going back:** only Perilous has restore points: each morning, each camp, and just before every ♦ card. Storybook has no manual bookmarks, so nothing can quietly undo a Storybook choice; rereading any book is read-only.
- **Rereading survives updates.** An old action log can't replay after a new edition (the old engine and content are gone from the cache), so the shelf keeps each finished book's rendered text and recipe ids instead, and redraws the pictures from recipes (an unknown recipe falls back to its biome base).
- **iOS:** Safari may clear site storage after about 7 days without a visit, and **Home Screen apps keep separate storage from Safari**. So the title page recommends installing *before* the first save, the game calls `navigator.storage.persist()` where available (never depending on it), and **Export / Import** turns a save or profile into a code you can share to yourself.

### E.7 Offline at the trailhead (PWA)

- `manifest.webmanifest`: name "Olympic Peninsula Hiker", short name "Hiker", standalone, portrait, black theme, 192/512/maskable icons; `apple-touch-icon` 180 px. The preview channel has its own manifest, name ("Hiker Preview") and icon.
- **One service worker per channel.** Main's `sw.js` has scope `/104-boyz/`, which would also cover `/104-boyz/preview/`, so it passes every request under `preview/` straight through, and its navigation fallback never serves main's `index.html` for a preview URL. The preview worker is registered from `/104-boyz/preview/` with scope `./`.
- Each worker precaches every file of its current edition (under 5 MB) into `oph-<channel>-<hash>`, fetched with `cache: 'reload'` so GitHub Pages' 10-minute HTTP cache can't slip a stale file in. On activate it deletes only old caches with its own `oph-<channel>-` prefix, never the other channel's.
- **Updates wait.** A new edition installs in the background, and only the bookshelf says *"A new edition of the book has arrived. Open it?"* A trip is never swapped mid-page.
- A **"This book works offline" stamp** appears on the title page once precaching finishes, teaching players to open the game at home before they lose signal on the Upper Hoh Road.
- All URLs are relative (the site lives at `https://fernforager.github.io/104-boyz/`). Top-level screens use `#` routes; in-book pages use `history.replaceState`, so Back never rewinds a trip (12.1).
- **One origin for the whole account.** Every Pages project under `fernforager.github.io` shares this origin, so an unrelated project there would share the same localStorage (about 5 MB) and Cache Storage. The `oph.` prefixes keep the game's keys apart, but the quota is shared.

### E.8 Randomness

A seeded `sfc32` generator, with every draw keyed by `hash(trip seed, stream, key)`. `Math.random` is banned in the engine (a unit test makes it throw). Keys are content (places, cards, days), never running counters, so an optional page never shifts a later roll (8.14).

| Stream | Keyed by | Used for |
|---|---|---|
| weather | day | The park-wide synoptic chain and zone weather, generated at the start |
| env | day, river or tide | River noise, fog persistence |
| permit | calendar date, camp | Quota availability, WIC-only requests, guide places |
| director | node, slot, trip day | Which card fills a slot |
| roll | node, card, choice, trip day, attempts here | Outcome rolls |
| effect | node, card, outcome, op, trip day | Chances inside effects |
| text | node, slot, trip day | Which wording |
| art | scene id | Prop placement (same on every trip) |
| lookahead | its own, per call | Look-ahead and Outlook runs, which resample hidden values (8.9) |

### E.9 Hosting and CI

- **GitHub Pages from Actions.** Free Pages needs a **public** repo (a private repo needs a paid plan); see [Decisions](#decisions-needed-from-you).
- **One deploy, two channels.** Pages publishes one artifact as the whole site, so a single workflow checks out `main` and `preview`, builds both, puts preview under `/preview/`, and uploads one combined artifact. (A job that uploaded only `/preview/` would replace the whole site and break your link.) You can keep a stable icon and a preview icon on your Home Screen.
- **Everything is namespaced by channel:** `oph.main.*` and `oph.preview.*` keys, `oph-main-<hash>` and `oph-preview-<hash>` caches, separate save formats. A preview save migrated to a newer format can never touch the stable save. A CI test fails on any storage key or cache name without a channel prefix.
- **On every push:** build ▸ lint ▸ type-check ▸ unit tests ▸ a 2,000-trip smoke test that checks only crashes, dead ends, stuck states and determinism (the same seed and actions give the same trip twice) ▸ deploy. No statistical gate runs per push, so deploys never fail at random.
- **Unit tests** check the roll-to-band mapping exactly: a seeded generator and a known p give known Great, Clean, Shaky and Fail bands. That is what "the shown % is the real chance" means in code.
- **Nightly,** capped at 60 minutes: the stratified simulation matrix (F.2), statistical calibration (F.1), the coverage report and a balance diff, uploaded as artifacts. Auto-tuning runs only on demand.

### E.10 iPhone performance notes

- Draw at 160x168 and scale with one `drawImage`. At most 3 live canvases; release old ones by setting `width = 0` (iOS caps canvas memory and fails silently).
- Palette cycling at 8 fps touches only cycling pixels: well under a millisecond. Pause on `visibilitychange`, on static pages and under Reduce Motion.
- Startup under 1.5 s from a cached load: one edition JSON (about 1 MB raw at full park), a prebuilt card index, lazy expression compiling, preloaded fonts.
- `localStorage` is synchronous: write right after the page paints, under about 50 KB. Finished books go to IndexedDB (E.6).
- The look-ahead and the Trip Outlook run in a Web Worker (8.9), so a page never waits for them.
- Standalone mode has no back button (every screen has its own) and may be killed in the background (hence autosave every page). No vibration API on iOS, so no haptics.

### E.11 The debugging loop with you

- `?debug=1` (or five taps on the version stamp) opens an overlay: edition, seed, phase, beat, the current card with its full odds breakdown, the last 20 actions, frame time, storage, and **Copy bug report**. Pasted into a Claude session, `tools/play.mjs --replay bug.json` reproduces the trip exactly.
- Any uncaught error shows *"A page got torn"* with *Copy details* and *Go back one page*. The game should never white-screen.
- In debug mode a **Note** button attaches your comment to the current page for triage.

---

## Appendix F: Balancing and testing

### F.1 Targets

From `simulation.md` 15 and `engine.md` 9.5, merged and recalibrated to the shown "made it" number (8.8). **"Happy" means plain *The End*:** finished as planned without reaching Serious. The Hard Way doesn't count.

**The reference population.** Targets are measured over named plan sets and a weighted mix of bot policies (F.2), not over "players" in general: 50% Steady, 25% Cautious, 15% Joy-seeker and 10% Bold, all following the plan unless a card changes it. Each row names its plans.

| Plan type | Happy finish | Rescue (Storybook) | Death (Perilous) |
|---|---|---|---|
| Sensible plan, in season (Seven Lakes 3 nights in Aug; Hoh classic in Aug; Royal Basin 2 nights) | ≥ 95% | ≤ 0.3% | ≤ 0.1% |
| Sensible plan, shoulder season (High Divide late Sep; Hoh early Jul with chute snow) | ≥ 85% | ≤ 0.5% | ≤ 0.2% |
| Guided Olympus, sensible kit, July | ≥ 85%; summit 55-75% | ≤ 1% | ≤ 0.3% |
| Ambitious but equipped (Glacier Meadows in 1 night with real gear; High Divide loop in a day with headlamp and 3 L) | 60-85% | ≤ 3% | ≤ 1% |
| Skimpy kit, benign season | 85-95% (costs joy, not safety) | ≤ 1% | ≤ 0.3% |
| **Under-equipped: day gear (the canonical trap kit) to Glacier Meadows in 1 night, September** | ≤ 5%; trouble or worse ≥ 80% | 15-35% | 2-6% |
| **Literally the summit, day gear, 1 night** (A.7) | Summit ≤ 1%; Sooner Than Planned ≥ 60% | 15-35% | 2-8% |
| Reckless (onto the Blue Glacier unroped; South Coast ignoring tides; the Queets ford in June) | ≤ 2% | 20-40% | 10-25% |
| Bail at the first fork, any plan | ~0%, nearly all Sooner Than Planned | ~0% | ~0% |

**Global health targets:**
- Storybook rescue rate across the reference population: **under 3%**.
- Real decisions per moving day: **3 to 5** (median 4).
- **♦ choices on sensible plans: at most about 1 per moving day** (median).
- **The interesting zone, per plan type.** On sensible plans, at least one optional choice a day (a shortcut, a snowfield, a sunset scramble) shows 60-90% made-it, so careful players still meet real odds. On ambitious and under-equipped plans, at least 35% of rolled choices show 60-90%.
- Trips that show at least one % choice: at least 90%.
- **Knowledge ranges:** the true p lies inside the shown range 100% of the time (a unit test).
- **Odds calibration,** nightly only. The shown % on a single roll is exact by construction and unit-tested (E.9). What needs statistical calibration is what the game *estimates*: the middle of knowledge ranges, Words bands, forecast rain chances and look-ahead bars. The test is a two-sided binomial test per bucket at p < 0.001 after a Bonferroni correction across buckets; a plain |error| < 3 points applies only to buckets with at least 10,000 samples. Look-ahead is tested for mean bias across many states, not bar by bar.
- **Snowlamp:** 25-40% of sensible trips with one eligible evening; 45-60% with a high layover; in each zone and month where it's possible.
- **Where outcomes come from:** about 70% planning, 20% trail choices, 10% luck (±10 each), measured with Sobol indices (first-order and total) over plan, choice policy and seed, since the three interact.
- **Variety:** the measures in 8.12.

### F.2 The harness

- `tools/sim.mjs` runs the **real engine** headless with bots. A trip is about 0.2-0.5 ms of computation, so 100,000 trips take under a minute on 8 workers.
- **Bots only see what a player sees:** the shown %, the words, the ETAs and the look-ahead bars. If a sensible bot using shown information can't hit the targets, the information is insufficient, and that's a UI bug.
  - Cautious (safest option; turns back below 75% made-it), Steady (best expected ending one step ahead), Bold (fastest unless below 50%), Reckless, Random, Joy-seeker (every sunset and side trip), Oracle (sees the rolls; an upper bound).
- **The plan library:** all 150 classic trips (plus variants: ±1 night, an added layover, a reversed loop) x months x loadouts (sensible, ultralight-smart, overpacked, day-hike gear, cotton-and-hope, glacier kit, photographer) x start times. **The trap plans live here only,** never in the ranger's list (4.5): Glacier Meadows in 1 night on day gear, the literal summit on day gear, Enchanted Valley in a day.
- **Stratified runs.** The full library is roughly 63,000 plans, too many to run deeply every night. Rare-event targets (deaths, rescues) run on about 20 representative plan classes at 50,000 runs each, with importance sampling where a rate is under 1%. Everything else runs 1,000 to 2,000 times per plan. The nightly job stops at 60 minutes.
- **"The pack matters"** (ablations): remove each tag from the sensible kit, one at a time, and measure a vector: the ending distribution, score, spirits, field guide entries and Leave No Trace. Each has its own threshold (for example total variation ≥ 0.05 for endings, 3 points of score), a minimum of 2,000 runs per cell and a significance test. Every tag must move something somewhere, or it's decoration. Joy items (sketchbook, camera, binoculars, field guide, camp chair) pass on score, spirits and the field guide. No single non-required tag may drop the happy rate by more than 40 points everywhere, or the game is a checklist.
- **"The choice matters":** every pair of choices on a card must differ in outcome distribution or effect kind somewhere, unless the card marks a deliberate lesson (grabbing food from the bear).
- **Assertions from research:** each `what_goes_wrong_for_underprepared_hikers` line becomes a regression test, using the canonical trap kit (6.8) wherever it says day gear. Examples: *day-hike gear, one night at Glacier Meadows in September: trouble or worse ≥ 80%, rescue between 15% and 35%*; *an under-shopped layover plan produces at least one rationing decision* (5.6); *the guided Olympus preset passes the validator and summits in 55-75% of equipped runs*.
- **Failure reports** name the cards and modifiers that most often appear in bad outcomes ("the ladder produced 41% of Serious outcomes in Hoh / September / sensible"), pointing straight at the knob.

### F.3 The linter (about 45 rules)

Errors block the deploy.
- **References:** no duplicate or unknown ids anywhere.
- **Park graph:** endpoints exist after the merge; every trailhead reaches a camp and every camp is reachable; elevation sanity; every place has a picture recipe; every preset routes and ends at a trailhead (or at its start, for a loop).
- **Cards:** schema-valid; expressions type-check; every card can fire somewhere (reachability); no dead ends (a visible, enabled choice in every context); fuzzed odds stay in range; loops and chains terminate; route effects target reachable places; read flags are set somewhere.
- **Mode safety:** death only inside Perilous overrides; every Perilous override has a Storybook base.
- **Honest odds:** a choice without a roll can't show a %; every roll has labeled modifiers from shared sets where one exists; the ♦ is computed from fail tables per context, never set by hand (8.1).
- **Coverage:** every event tag in at least 3 cards; every catalog item maps to an event tag; every segment hazard tag in at least 1 card (14.2).
- **Text (T02):** fits the page at 375 x 667 with three choices and at 393 x 852 with four, from measured font metrics; choice labels are 22 characters or fewer and fit at 375 pt; no real private businesses or real people; **no *Golden Glow* text, names or phrases** outside the colophon; no death words in Storybook text (except "dead tree"); third person past tense; readability grade 7 or below.
- **Economy:** every item is obtainable; every tag a card rewards is provided by some item; the sensible kit for every zone and month fits in some pack.
- **Storage names:** every storage key and cache name carries a channel prefix (E.9).

### F.4 Other tools

- **The card bench:** one command prints a card's odds, fail shares, text lengths and queued consequences under six loadouts and several river levels. Claude runs it on every new card first.
- **Golden worked examples:** every number in this document's worked examples (8.11, 12.11, Appendices A to D) is generated by the card bench or a seeded run and checked as a golden test, so the document and the engine can't drift apart.
- **Golden replays:** engine goldens on a frozen mini edition (any change is a regression); content goldens on the live edition (expected to drift, reviewed as diffs).
- **Transcripts:** `tools/play.mjs` prints a whole trip as a book (pages, odds, rolls, margin effects, the back cover). About 20 are read per batch, because voice and pacing can't be measured.
- **Auto-tuning suggestions** (on demand, not nightly): coordinate descent over declared tunable ranges toward the target bands, written as a patch for review, never applied silently. Order of tuning: physics against reality first (segment times against trip reports, night temperatures against normals, tides against NOAA), then event bases, then playtests for feel.

### F.5 Device checklist (every milestone)

- iPhone SE (375 x 667, 2x, the short-screen layout) and a Pro Max (3x); Safari tab and Home Screen app; Safari's Back button and edge swipe mid-trip.
- Main and preview installed side by side: updating one never touches the other's saves or offline cache.
- Install, airplane mode, a full trip offline.
- Background the app mid-page (a phone call) and come back to the same page.
- Low Power Mode: cycling and draw-in still pleasant.
- VoiceOver for one full day; the largest text setting.
- An edition update mid-trip: the prompt appears only at the bookshelf; the save migrates.
- Export a save, wipe site data, import it.
- Rotate to landscape and back.

---

## Sources for this document

- **Park data:** `design/data/regions/{coast, elwha_hurricane, hoh_olympus, northeast_dose, sol_duc_high_divide, south_quinault_skok}.json`, `design/data/park_rules.json`, `design/data/gear_catalog.json`, `design/data/food_catalog.json`. Mileages, camps, quotas, conditions and tide gates cited here come from these files. They were fact-checked in parallel (`design/data/FACT_CHECK.md`, 2026-10-08); this document was updated to match, and the data files win any remaining disagreement.
- **Proposals:** `design/proposals/storybook.md` (voice, pages, art, wireframes, audio, the homage), `design/proposals/simulation.md` (state, movement, weather, tides, body models, odds, consequences, worked examples A-C, balancing), `design/proposals/engine.md` (data model, card format, narration, combinatorics, runtime, stack, testing, authoring, milestones).
- **Homage:** *The Golden Glow* by Benjamin Flouw (Tundra Books, 2018), acknowledged in the game's colophon. Nothing in this document or the game reproduces its text or illustrations.

---

## Decisions needed from you

Only you can make these. Each has a recommended default, so a one-word answer ("yes", or the number of a different option) is enough. Everything else in this document is a call you can overrule (1.2), but it doesn't need an answer to start building.

1. **How harsh.** Storybook as the default (every story ends with you safely home; the worst case is a trip that ends early or a gentle ranger rescue, then you plan again), with Perilous (real Sierra-style deaths at flagged moments, with Turn Back a Page) as a per-book option. *Recommended: yes.*
2. **The golden plant's name.** *The Snowlamp*? Or *Ember-in-the-Snow*, *Lanternwort*, *Snowlight*, or let the player name it after sketching it. *Recommended: the Snowlamp.*
3. **Who is in the book.** Solo in v1, with optional player-named companions in M6. If "104-boyz" is a group of friends you'd like in the book, the companion list could come pre-filled with names you give; otherwise it starts blank. *Recommended: blank, you name them.*
4. **The 104 wink.** A field guide of exactly 104 entries, with No. 104 as the blank page. It assumes nothing about what "104" means. *Recommended: keep.*
5. **Mount Olympus in v1.0.** The summit by hiring a fictional guide at the outfitter counter (with glacier school and a "glacier course" box on the New Book page), so v1.0 players can stand on top; companions add guide-free rope teams in M6. The alternative is a v1.0 Olympus that ends at the moraine. *Recommended: the guide.*
6. **First playable.** The Hoh to Glacier Meadows first (M1a, then M1b with Olympus), or Seven Lakes Basin and the High Divide first? *Recommended: the Hoh.*
7. **Read to me.** On-device spoken narration (lovely for playing with kids, and cheap to build), or cut it? *Recommended: build it, in M6.*
8. **Perilous humor.** Are the sample death pages (the tide table; also planned: cotton, the glacier, darkness) the right temperature? *Recommended: as written, with your review of each new one.*
9. **Talking animals.** Animals never talk and the narrator translates (closer to the park), or an optional "fable mode" where they speak (closer to the book)? *Recommended: never talk.*
10. **Session length.** About 8 minutes to the first trail page in a first book, 4 to 6 minutes per trail day, and 20 to 30 minutes for a two-night book. *Recommended: yes.*
11. **Repo visibility.** Free GitHub Pages needs a public repo. Is `fernforager/104-boyz` public, or should it become public (or the site be published from a separate public repo)? *Recommended: make it public; nothing in it is secret.*
12. **Testing on your phone.** Do you have a Mac for Safari's Web Inspector, or should we rely on the in-game debug overlay and its Copy bug report button? *Recommended: the overlay either way; a Mac is a bonus.*
