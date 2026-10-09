# The new frame, home and screens

> **Superseded where `GAME_DESIGN.md` differs** (2026-10-08). This draft keeps its reasoning and tables for reference; the design doc wins every disagreement, and decisions 21 to 35 now live in its *Decisions made* (`PENDING_DECISIONS.md` is retired). Retired terms here: *Storybook* is now the hidden `gentle` mode; *Begin a new book* is now *Plan a trip*, and the trip seed is drawn at a plan's first save; the clipboard and the shed's chalkboard are now the chalkboard by the steps (the Hike of the Day) and the peak (FKTs); the pacer is out of v1 (decision 7); the cover is loading art only; and Batch 1 is replaced by B001 to B003 (doc 18.11).

*A draft for the creator, written 2026-10-08, for the new direction (decisions 21 to 34 in `design/PENDING_DECISIONS.md`, which override `GAME_DESIGN.md` wherever they disagree). Nothing here is decided until you say so.*

*All the words in this draft are placeholders for yours (decision 21). That covers every word inside a wireframe, and every line marked (DRAFT). Real Port Angeles stores inspire the three shops. Their in-game names stay `{STORE_GENERAL}`, `{STORE_GEAR}` and `{STORE_BOUTIQUE}` until you name them. Jon appears by first name only, and the other Boyz as `{BOY_n}`. Numbers in the wireframes are illustrative unless a section of the design doc is cited.*

## Contents

0. [The short version](#0-the-short-version)
1. [Ground rules](#1-ground-rules)
2. [Out with the book: the replacement table](#2-out-with-the-book-the-replacement-table)
3. [Home: the old ranger cabin at Lake Quinault](#3-home-the-old-ranger-cabin-at-lake-quinault)
4. [Art brief: the cabin](#4-art-brief-the-cabin)
5. [Screen flows](#5-screen-flows)
6. [Wireframes](#6-wireframes)
7. [The three stores](#7-the-three-stores)
8. [The flat lay](#8-the-flat-lay)
9. [Who speaks?](#9-who-speaks)
10. [Splits, the trail screen and the trip report](#10-splits-the-trail-screen-and-the-trip-report)
11. [What M1a needs](#11-what-m1a-needs)
12. [Decisions for you](#12-decisions-for-you)
13. [Sources](#13-sources)

---

## 0. The short version

- **The frame is the trip's own stuff.** The map, the permit, the town run, the flat lay, the trailhead, splits on the trail and a trip report at the end. There is no book anywhere: no shelf, chapters, pages or back cover.
- **Home is the old ranger cabin at Lake Quinault, and its places are the menus.** The door plans a trip. The chalkboard is the Hike of the Day, and the peak above the trees is the FKTs. The shed holds your gear and the flat lay, and the car drives. The fire bowl keeps your stories, the register post holds the Trail Register, and the mailbox holds the settings.
- **The cabin lives on Lake Quinault's real clock.** It shows the real season, light, weather and moon, the way *Sword & Sworcery* follows the real moon.
- **You plan at the cabin and print your own permit,** as real Olympic hikers do. The WIC in Port Angeles becomes an optional stop on the town run. It gives the ranger's briefing, the free loaner can and the camps you can only ask for at the desk. The three stores are on the same run.
- **The flat lay is the packing screen and the signature share image.** Everything is laid out top-down on the deck boards. Tap a thing to add it or put it back. The weight, the volume and the bear can count live. One tap exports a 1080 x 1350 picture with the permit number on it.
- **The hot tub is lit only after a big hike.** That means at least 8 trail hours walked, an Olympus summit or a finished FKT. Every finished High Divide loop counts.
- **The Boyz and 104 are easter eggs only.** There's a thermometer at 104°F, a badge on a nail, the permit numbers, the crew on summer weekends and their lines in the tub. A stranger never needs any of it.
- **Who speaks:** I recommend terse second person, present tense, in the Sierra box. The hiker's own first-person log is the record, and it becomes the trip report.
- **Eighteen decisions** for you are in section 12.

---

## 1. Ground rules

- **The pending decisions win.** Decision 34 revises 28: the tub is a reward after a big hike, and the cabin is home.
- **Every string is yours.** Each new string in the home gets an id in the one text system, marked draft until you approve it (decision 21). A sample of ids is in 3.12.
- **The cabin is described, never copied.** The art brief in section 4 uses only the written description of your photos. No photo enters the repo.
- **The cabin stays generic.** It reads as any old ranger cabin, with no address, no shore and no sign.
- **The sun and weather use a lake point.** They are computed for the center of Lake Quinault, never for a real cabin's position.
- **Real stores inspire, fictional names ship.** The linter's deny-list of real business names (T03) gains the three real stores.
- **Phone-first.** Wireframes are 40 characters wide, and tables have four columns at most.

---

## 2. Out with the book: the replacement table

Each row names the old element, where the design doc has it, and what replaces it.

**The frame and getting around**

| Old (GAME_DESIGN) | New | Here |
|---|---|---|
| The bookshelf title page (12.3) and Session 1's title page | The cabin. Home is also the title screen | 3, 6.1 |
| The title and its tagline, *a picture-book trip* (`web/index.html`) | `{GAME_NAME}` over the cabin. No tagline unless you write one | 3.12 |
| The cover plate, the High Divide at dusk (Session 1) | Kept as the loop's picture on the FKT board and on the loop's share card | 6.20 |
| *Begin a new book* | Three places: the door (plan), the chalkboard (Hike of the Day) and the peak (FKT) | 3.2 |
| *Continue:* and the book's title | A trip in progress opens straight onto the trail | 3.3 |
| The living hiker's shelf of finished volumes (9.8) | Stories, at the fire bowl: the hiker's trip reports | 3.2 |
| Reread, page by page (9.8) | Read the trip report and its log. The route replays on the map with its splits | 10.3 |
| *Name a hiker* and the New Hiker page (12.4) | Sign the guest book on the porch table | 3.11 |
| *To the shelf*, and the books fading from it (12.17) | Back to the cabin. The trip reports at the fire bowl go to dust | 3.8 |
| The endpaper map (3.1, 12.5) | The park map on the cabin's map table. Unbuilt valleys stay pencil sketches | 6.4 |
| The ranger desk at the WIC as Chapter One (3.1) | Plan at the map table and print the permit at the cabin. The WIC is a stop in town | 5.1, 7.6 |
| *This book reads best held upright.* | A line asking you to hold the phone upright (DRAFT) | 3.12 |
| *The Home Screen book keeps its own saves.* | The same idea without "book" (DRAFT) | 3.12 |
| *A new edition*, shown on the shelf (BUILD_PLAN) | The mailbox flag goes up | 3.2 |

**A trip, not a book**

| Old (GAME_DESIGN) | New | Here |
|---|---|---|
| A book: one trip is one volume (2.2) | A trip: an Open trip, a Hike of the Day or an FKT attempt | 5 |
| Chapters One to Four (*In Which...*), then one chapter a day | Phases with backpacking's own names, shown as a small label in the status line, with no title pages: Plan, Permit, Town, Flat lay, Drive, Trailhead, Day 1 and on, Out, Trip report | 5.1 |
| Chapters retitled after they happen | Each day gets a headline in the log, picked from that day's biggest event | 10.3 |
| The volume's title at The End | The trip report's title. Pick one of three, or keep the route's name | 6.17 |
| A page | A stop: one moment on the trail or in camp. The pacing targets (3.5) count stops | 10.2 |
| Page numbers, `- 37 -` | The mile and the clock in the status line, and the split | 10.1 |
| The red ribbon bookmark (the autosave) | No mark. Every stop saves itself, and Settings says so once | — |
| *Turn the page* (button and swipe left) | *Walk on* on the trail and *Next* elsewhere (DRAFT). The same swipe | 6.13 |
| Swipe right to reread the chapter | Swipe right opens today's log | 10.2 |
| The *more ▸* page split (12.1) | A continuation box: the Sierra box shows ▾, and the next box draws in, the way King's Quest showed a long message | 9 |
| Page density: Short, Usual, Long (3.5) | Trail stops: Few, Usual, Many (DRAFT) | — |
| The packing page, where the narrator describes the pack (3.2) | The flat lay is that page | 8 |
| *Begin a new book* draws the seed (8.14) | The trip seed is drawn when a plan is first saved, or when the daily opens | 5 |
| One hiker, one book at a time (9.8) | One hiker, one trip at a time. The daily's fresh hiker never touches it (decision 25) | 5.2 |
| *Try this trip again* (9.7) | *Hike it again* (DRAFT), with the same rules | 6.17 |

**The voice**

| Old (GAME_DESIGN) | New | Here |
|---|---|---|
| The storybook narrator, in the third person and past tense (2.3) | No narrator character. Terse second person, present tense (recommended) | 9 |
| The narrator turning to the reader about once a book | Gone | 9 |
| The trip log, flavor only (2.3) | Promoted: the log is the record and the trip report's body | 9, 10.3 |
| The refrain at the end of each night | Your call: one closing line in the new voice, or let the river be heard instead | 12 |
| "Picture book", "picture-book" and "living book" (1, 2.1, 11.2, 11.4) | "The scene" or "the picture" | — |

**Endings and records**

| Old (GAME_DESIGN) | New | Here |
|---|---|---|
| The back cover (9.7) | The trip report and its share card | 6.17, 6.18 |
| *Share the Cover* | Share the trip report, or share the flat lay | 8.6 |
| *The End*, *the Hard Way*, *Sooner Than Planned*, *With a Little Help* (9.3) | The same four endings, each named on a stamp at the car (DRAFT: FINISHED, THE HARD WAY, TURNED BACK, WALKED OUT WITH HELP) | 6.16 |
| The End plate: a closed book on a dashboard (11.7) | The car at the trailhead: boots on the dash, the permit in the visor | 6.16 |
| The memorial page and its black ribbon (9.3, 12.17) | The GAME OVER card, with a black register mark (▌) by the trip's name. Its contents are unchanged | 3.8 |
| *Here ends the book of Robin* | A line about Robin's trail ending (DRAFT) | — |
| *Close Robin's book for good?* | The same confirm without "book" (DRAFT) | 3.8 |
| Best books (9.8) | Best trips | 3.9 |

**Modes, settings and credits**

| Old (GAME_DESIGN) | New | Here |
|---|---|---|
| *Storybook*, the hidden no-death mode, key `storybook` (9.4) | Internal key `gentle` and flag `flags.gentle`. It gets a public name only if you ship it. The UI test fails on either word | 12 |
| That mode's separate shelf | A separate hiker, and a page of its own in the register | — |
| Settings titled THE BOOK (12.18) | Settings, in the mailbox | 3.2 |
| Text: Pixel, Book, Large | Pixel, Plain, Large | — |
| The colophon (12.20) | Credits, in the mailbox | 3.2 |
| The Ranger's Bookshelf (12.20) | Kept: a real shelf of Robert L. Wood's books inside the cabin door, reached from Credits. A shelf of real books is a place, not a frame | — |

**Code and plan names**

| Old | New |
|---|---|
| `book_ends` | `trip_ends` |
| `phases/shelf`, `ui/shelf.js` | `phases/home`, `ui/home.js` |
| `narrator.js` | `voice.js` |
| Book furniture (BUILD_PLAN): chapter titles, volume titles, morals | Trip furniture: day headlines, report titles, gear notes |
| Appendix D, *Sample storybook pages* | *Sample screens* |
| The review book (14.4) | The review site. It's for you, not players; renamed only for consistency |
| `proposals/storybook.md` | Kept as a historical file. Nothing new cites it |

**What stays, because it is not a book.** The Sierra message box, Look, the King's Quest score line, the Ranger's Note, the pencil strip and Field Notes stay. So do the whole death sequence and the Trail Register (which now lives at the cabin). The catalog item *Town Book Bag 20* is a school bag, so it can keep its name unless you'd rather rename it.

---

## 3. Home: the old ranger cabin at Lake Quinault

### 3.1 What it is

You have the keys to an old ranger cabin at Lake Quinault, on the wet southwest side of the park. Every trip starts and ends there. You plan at its table, keep your gear in its shed, drive out from its lawn and come home to its porch.

The game never tells a backstory. The place does it instead: a flat hat on a peg, a badge on a nail, a guest book with older handwriting than yours. Everyone understands a cabin, so a stranger is at home in the first second. An insider sees whose cabin it was.

**The geography is honest.** Port Angeles, with the WIC and the three stores, is about three hours north by road (NPS). Forks is about an hour away (NPS), and the Sol Duc trailhead is 69 minutes past Forks in the region data. So the first playable's drive is about 2 hours 10 minutes from the cabin.

- **The town run is the whole day before.** It costs no trip time.
- **The departure-morning drive sets Day 1's start,** as 3.3 of the design doc already does. Leave at 6:15 and you are at the Sol Duc trailhead about 8:25.
- **The Quinault WIC is closed for 2026** (`south_quinault_skok.json`). The game's WIC stays the one in Port Angeles.

### 3.2 The places in the scene

| Place | What a tap opens | What changes it |
|---|---|---|
| **The screen door** | Plan a trip (Open): the map table and the permit | The printed permit is pinned to the door |
| **The chalkboard** by the steps | The Hike of the Day | Today's route in chalk, the weather in chalk marks, your time once you've hiked it, the streak in tally marks, a smudge after a DNF |
| **The peak** above the trees | FKT attempts on the big routes | The snow line follows the season. Alpenglow at dusk |
| **The shed** | Gear: your shelves, then the flat lay | The door stands open after a town run. A plank sign goes on its wall for each route you finish |
| **The car** | Drive: to town, or to the trailhead once you're packed | Grocery bags on the seat after town. The pack in the back once packed |
| **The fire bowl** | Stories: your trip reports, your alpenglow shots and the hiker's card | Lit on homecoming evenings. Ashes otherwise, and a cap of snow in winter |
| **The register post** at the lawn's edge | The Trail Register | A fresh pencil mark when a line is added |
| **The mailbox** | Settings, Credits, the Ranger's Bookshelf, Export and Import | The flag goes up for a new edition |
| **The hot tub** | The soak, only after a big hike (3.7) | Covered and cold otherwise. Then it only answers with a Look |
| **The guest book** on the porch table | Sign in a new hiker. The hiker's card | Open on the first launch and after a death |

**How the places behave:**

- **One tap goes there.** A long-press shows the place's name.
- **Labels fade as you learn.** Each place shows its name until you've used it once, then shows a small dot.
- **Everything is also a button.** The next-step button and the porch rail under the picture repeat every place. VoiceOver reads those buttons, and the canvas has its alt text, as every picture does (11.9).
- **Hit areas are at least 44 pt** (12.1), wider than the art where they need to be. When two overlap, the nearest center wins.
- **Things that do nothing only answer a Look.** That covers the badge, the mole hills, the chairs, the maples and the dog. No function hides in a Look.

### 3.3 The porch rail and the next step

Under the picture are one big next-step button and a porch rail of eight buttons. The rail is the same as the places, so nobody has to hunt.

The next-step button always names the next thing the current trip needs:

| Where you are | The next-step button (DRAFT) |
|---|---|
| First launch | None: the lockbox, then the guest book (3.11) |
| A hiker with no plan | Plan a trip (the first time: plan your first trip) |
| A plan drafted | Print the permit |
| Permit printed, overnight | Drive to town |
| A day hike planned | Lay out your gear. Lunch is grabbed on the drive (3 in the design doc) |
| Back from town | Lay out your gear |
| Packed | Leave in the morning. Time chips show the arrival: 5:30 gets you there at 7:40 |
| A trip in progress | No home. The app opens on the trail |
| Just home | Read the trip report. Then, after a big hike, the tub glows |

When the next-step button is idle and today's hike is unplayed, a second line offers the Hike of the Day.

Going back is free until *Start walking*, as now (3 in the design doc). After that, nothing goes back.

### 3.4 A live scene

The cabin runs on Lake Quinault's own clock, the way *Sword & Sworcery* syncs its moon to the real one. Open the app at six in the morning and it's dawn at the cabin. On a rainy Quinault night, it rains on the roof.

- **Pacific time, always.** A player in New York at 10 pm sees the cabin at 7 pm. The sun's times come from a small sunrise function for the lake's center point.
- **The time of day uses the existing remaps** (11.4): Day, Dusk, Blue hour and Night. Dawn borrows the Dusk table, so the peak goes pink in the morning too.
- **The season follows the phenology table in 4.4.**
- **The weather comes from the daily build.** The scheduled build that bakes the Hike of the Day's forecast (decision 31) also bakes one for the lake. It uses api.weather.gov: `/points` for the lake, then the forecast URL it returns. NWS asks every app for a User-Agent, and the build sends one. The words of the current 12-hour period pick an overlay: clear, cloudy, rain, fog or snow. Offline, or with a forecast more than two days old, the cabin falls back on the month's climatology.
- **The moon is the real phase,** worked out from the date.
- **One exception: coming home.** The homecoming shows the trip's own return time and season. Then the cabin fades back to now (3.6).

**Why do it:** opening the app becomes a small ritual. It also keeps the daily honest: today at the cabin is today's Hike of the Day.

**The cost** is one sun function, one table and one JSON file that the daily build already writes.

### 3.5 What you've done shows

The scene shows two kinds of progress: how far the current trip has got, and the hiker's career so far.

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

**The lily's sketch is allowed to be gold.** It is the lily's own mark, the one place outside the lily where gold may appear (11.1). Nobody who hasn't found the lily ever sees it, so the cabin never advertises the flower.

**The full wipe takes every career mark,** as it takes everything else that was the hiker's (9.8).

### 3.6 Coming home

1. **The car at the trailhead.** The stamp names the ending, with the last split and the trail hours (6.16).
2. **The drive home.** One screen, with an optional stop for pie at *The Huckleberry Skillet* (3.3 in the design doc).
3. **The cabin at the trip's own arrival time and season.** The car pulls in. The fire bowl is lit if it's evening.
4. **The trip report opens** (6.17). Share it or don't.
5. **The porch.** After a big hike, the tub's cover is off and steam rises, and the next-step button says so. Tap the tub for the soak (6.21). It waits for you until your next trip leaves.
6. **Then the cabin catches up to the real now** with a slow cross-fade.

Nothing on the way home asks you to type. The report's title is picked from three, not written.

### 3.7 The hot tub, and what "big" means

**The rule (proposed).** A trip is big when the hiker comes home alive having done one of these:

- walked at least **8 trail hours**,
- summited Mount Olympus, or
- finished an FKT attempt.

**Trail hours = miles / 2.4 + feet climbed / 1,300.** That is the base of the design doc's movement formula (7.4) at Regular pace, without its load, pace or weather terms. It is summed over what was actually walked: side trips count, and so does a walk that turned back.

So the number measures the hike, not the hiker, and it is the same for everyone. The trip report shows it, so the hardcore crowd can see how close they came.

**Trail hours on real trips** (miles and climb from the region data):

| Trip | Miles · climb | Trail hours | Big? |
|---|---|---|---|
| Sol Duc Falls | 1.6 · 260 ft | 0.9 | No |
| Deer Lake overnight | 7.4 · 1,950 ft | 4.6 | No |
| Mink Lake and the Little Divide | 13.6 · 2,920 ft | 7.9 | Just no |
| Lunch Lake, out and back | 15.6 · 4,130 ft | 9.7 | Yes |
| The High Divide loop, either way | 18.4 · 4,400 ft | 11.1 | Yes |
| Olympus Guard Station and back | 18.2 · 813 ft | 8.2 | Yes |
| The Blue Glacier classic | 37.8 · 5,906 ft | 20.3 | Yes |

- **Every finished High Divide loop gets the tub,** so the first playable's reward is there for anyone who finishes it.
- **A rescue or a turnaround counts what you actually walked.**
- **A death gets no tub.** The after-death cabin shows it covered (3.8).
- **The Hike of the Day uses the same rule.**
- **Why 8 hours:** it splits the Sol Duc side's classic trips cleanly into walks and real days out. The number lives in `rules/tuning.json`.

**The soak** (wireframe 6.21) is a full scene with no chrome: night, stars, the real moon and steam off the tub. The floating thermometer reads 104°F. The cabin's music plays, since music belongs at home and at key moments (decision 32).

- **The trip's best moments come back one at a time,** three to five of them from the log. They are picked by the same weights that pick the day headlines.
- **When the crew is around** (3.10), the crew is in the tub too, and each of them gets one line (`{BOY_n_TUB}`, yours to write).
- **You can get out any time.** The share card is offered once, at the end.

**No drink in the tub by default.** The car is out of frame in the soak, so a can on the edge would pass lint T05. But no drink ever shows in the cabin scene, because the car is in it. Your call (section 12).

### 3.8 After a death

- **The five death screens stay exactly as approved** (12.17): the death box, YOU PERISHED, Leave No Trace, the epitaph and GAME OVER. Only their book words change (section 2).
- **Back to the cabin, at dusk.** The porch light is on and one Adirondack chair is empty. The tub is covered and the fire bowl is cold.
- **The full wipe plays here.** The trip reports by the fire bowl and the route signs on the shed wall crumble to dust, with the same renderer as the bones (11.10). The shed door swings shut, back to its starting shelves. With Reduce Motion it is a cross-fade.
- **The register post gets a fresh mark.** Two buttons follow: *Read the register* and *Sign the guest book* (wireframe 6.22).

**Only the Open hiker dies this way.** A death on the Hike of the Day is a DNF: the chalkboard says DNF, the tally is wiped, and the Open hiker is untouched (decision 25). How much of the death sequence a daily death plays is for the modes draft to settle. I would keep the first three screens and replace the epitaph and GAME OVER with a DNF card.

### 3.9 The Trail Register lives at the cabin

- **The register box stands on a post at the edge of the lawn,** where an old trail leaves into the maples. Old ranger stations often sit at a trailhead.
- **Its contents are unchanged.** Best trips (the top ten by share of their own maximum) and Remembered (every GAME OVER, with the Boyz pre-filled) stay as they are, along with the 104 permit counter.
- **The epitaph is still signed at the trailhead** where the trip began, on screen 4 of the death sequence, as approved. It is the same register that you read at the cabin's post.
- **The alternative:** draw screen 4 at the cabin's post at dusk, so the name goes home. That is your call (section 12).
- **Daily DNFs stay on the chalkboard,** not in Remembered (proposed).

### 3.10 The Boyz and 104, as easter eggs

| The egg | What a stranger sees | What an insider gets |
|---|---|---|
| The tub's thermometer at 104°F | A hot tub at the usual maximum (CPSC's 104°F limit) | The crew's name |
| Badge #104 on a nail by the door | An old ranger's badge (a Look) | Jon's badge |
| Permit numbers 104-0001 and up | A permit number | The wink (decision 14) |
| A flat hat on a peg. "J." in the guest book's first pages | Whoever had the cabin before | Jon |
| The crew on summer weekends: tents on the lawn, camp chairs, a cooler, a dog | Friends visiting | The Boyz, by their quirks (`{BOY_n_QUIRK}`) |
| The crew's lines in the tub | Friends joking | Inside jokes (`{BOY_n_TUB}`) |
| Signatures on the guest book's first pages | Old signatures | The Boyz' entries (`{BOY_n_GUESTBOOK}`) |
| The Boyz in Remembered | Old register lines | Their fictional deaths (decision 19) |
| A clam gun leaning on the shed | A tool | Jon's razor clamming, and maybe the door to that minigame, if the minigames draft wants it |

**Rules for every egg:**

- **It is a Look or a cosmetic,** never a function. Nothing is required, nothing is explained, and nothing is private.
- **You write every word.**
- **The consent gate stays.** The `{BOYZ_CONSENT}` placeholder in Credits still blocks a release build (12.20).

**When the crew is around (proposed):**

- real summer weekends, from 5 pm Pacific on Fridays and Saturdays, June to September;
- the evening of any big homecoming;
- any dates you pick (`{BOYZ_DATES}`).

### 3.11 First launch, for someone who has never heard of the Boyz

| Step | What happens | About |
|---|---|---|
| 1 | The cabin draws itself in, at the real time of day | 10 s |
| 2 | The lockbox on the porch post asks three locals' questions (the opener from 2.6, moved). Wrong answers open it too (6.2) | 30 s |
| 3 | The guest book: type a name, or tap suggest (6.3) | 20 s |
| 4 | The porch, with labels on. The next-step button says to plan your first trip | — |
| 5 | The first trip, the way 3.6 of the design doc lays it out (below) | about 7 min |

**The first trip:**

- the loop's three questions at the map table;
- *Print it*;
- the town run, with *Fill from the list* at the general store and the WIC's loaner can;
- home;
- the flat lay, already laid out with the ranger's checklist. Design-doc 3.6's "the pack starts on the floor" is now literally on the deck;
- leave in the morning;
- the tailgate, and *Start walking*.

**What a stranger never meets** is the word Boyz, an explanation of 104 or a name they're supposed to know. The Hike of the Day is on the chalkboard from the first minute, and nothing gates it.

Teaching new players is still open (PENDING_DECISIONS), so this is only the minimum.

### 3.12 Text ids for the home (a sample)

Every string starts as a draft in the text system (decision 21).

| Id | What it is |
|---|---|
| `home.title` | `{GAME_NAME}` over the cabin |
| `home.place.door` ... `home.place.guestbook` | The ten places' names (3.2) |
| `home.next.plan_first`, `.plan`, `.print`, `.town`, `.layout`, `.leave`, `.report`, `.soak` | The next-step button (3.3) |
| `home.rail.*` | The eight rail buttons |
| `home.look.badge`, `.hat`, `.tub_cold`, `.molehill`, `.dog`, `.clamgun` | Looks |
| `home.first.lockbox`, `.guestbook`, `.one_life` | First launch |
| `home.death.dusk` | The one line after a death |
| `app.upright`, `app.install` | Session 1's two book lines, rewritten |

### 3.13 Sound at the cabin

Details belong to the sound draft (decisions 32 and 33). For this draft:

- **The cabin is home, so it gets music.**
- **The real weather plays on the roof:** rain when it rains.
- **The birds change with the season.**
- **Each place has its sound:** the screen door's creak, the printer's clatter, the car door, and the tub's hum when it's lit.

---

## 4. Art brief: the cabin

*Based only on the written description of the creator's photos. Chunky AGI pixels in the 16-color palette (11.1), drawn as one hand-made signature scene that replaces the cover as scene number one (11.7).*

### 4.1 Canvas and composition

**A 160 x 320 tall plate,** the cover's size and slot in Session 1's title page. It is 373 x 427 pt on an iPhone 17 at 7x4 device pixels.

**The steep gable suits portrait:** the peak, the spruce and the roof stack up the screen. Rows run top to bottom, and the positions are approximate:

| Rows | Band | What's there |
|---|---|---|
| 0-70 | Sky | Dithered bands by time of day; stars and the moon at night; weather |
| 30-95 | Far | A snow-dusted rocky peak, left of center, so the spruce doesn't hide it |
| 15-150 | Mid | A towering Sitka spruce behind the roof, its crown above the ridge. Bigleaf maples left and right, their limbs heavy with moss |
| 95-215 | The cabin | A steep, nearly A-frame gable; the antenna at the apex; a tall arched window high in the gable; deep eaves with the framing and a king post showing; two banks of three tall windows around a wood-framed screen door; small lanterns by the door |
| 212-232 | The porch | A raised deck across the front, with wide steps in the middle. Four pale blue-gray Adirondack chairs with little side tables. The chalkboard leans by the steps |
| 165-232 | Right | A small matching gabled shed with one small window. The green inflatable tub on its own low deck at the porch's right corner |
| 232-320 | The lawn | A wide meadow dotted with mole hills; the rust iron fire bowl in the center foreground; the register post at the left edge, where a path enters the maples; the car at bottom left; the mailbox at bottom right |

### 4.2 Layers

The picture VM's four layers (11.3) plus the scene composer's overlays (11.7):

1. **sky:** dithers, plus stars and the moon (only on clear nights)
2. **far:** the peak, with its snow line by season
3. **mid:** the spruce, the maples and the forest band
4. **near:** the cabin, porch, shed, tub, lawn, fire bowl, post, car and mailbox
5. **season:** leaves or bare limbs, moss, fallen leaves, snow on the roof and lawn, icicles
6. **props:** the trip-progress and career marks of 3.5
7. **sprites:** the hiker; the crew, tents and dog; steam; smoke from the fire bowl
8. **weather:** rain, fog bands across the maples, falling snow
9. **palette:** time of day plus the weather tint (11.4)
10. **cycle:** water in the tub, steam, fire, stars, lamps (11.5)
11. **hotspots:** the places, merged with their alt text

### 4.3 The palette, object by object

| Object | Slots (11.1) | Notes |
|---|---|---|
| Siding, board and batten | 9 brick, 10 bark (vertical lines) | Weathering to silver toward the base and on the weather side: a 2 slate or 3 glacier-blue dither |
| The roof | 11 spruce, 0 ink shade, 13 moss dither | In winter, 4 snow with skylights in 2 slate |
| Gable framing, king post | 10 bark, 0 ink | |
| Windows, the arched window | 3 glacier blue panes, 0 ink frames | Lit at night by the lamp pseudo-color (24) |
| Lanterns, porch light | 5 paper cream, lamp (24) | Exempt from the night remap |
| Deck and steps | 3 glacier blue + 2 slate (silvered) | 0 ink seams |
| Adirondack chairs | 3 glacier blue, 2 slate shade | Pale blue-gray, as described |
| Antenna | 0 ink | A 1-pixel lamp light blinks when today's hike is new |
| The shed | Like the cabin | One small window |
| The hot tub | 13 moss, 12 forest shade, 15 teal water | A 12 forest cover when cold. Steam from a new pseudo-color (4.8) |
| The fire bowl | 8 rust, 9 brick | Fire pseudo-color (20) when lit; 2 slate ash |
| The Sitka spruce | 11 spruce, 12 forest | Stacked tiers with drooping tips, taller than everything |
| The bigleaf maples | 10 bark trunks; 13 moss, 14 sage dither on the limbs | Licorice-fern stamps in 12 forest |
| The peak | 2 slate rock, 4 snow, 3 glacier-blue shadow | 6 alpenglow pink at dusk and dawn |
| The lawn, mole hills | 13 moss, 14 sage; 10 bark mounds | |
| Chalkboard, mailbox | 0 ink with 5 paper chalk; 2 slate with an 8 rust flag | |
| Tents | 15 teal, 2 slate, 13 moss | The Boyz' jacket colors (11.6) |

**Never gold (7).** Bigleaf maple leaves turn yellow in autumn (WSU Extension), so here they are 14 sage over 5 paper cream. Warm window light is paper cream, and the fire bowl's flame uses the fire cycle. The one exception is the Bonfire Lily's sketch (3.5).

### 4.4 Seasons

| Season | The maples | Ground and roof | Extras |
|---|---|---|---|
| Spring, March to May | Bare, with bright moss; new leaves in May | A bright lawn, fresh mole hills | Sun breaks |
| Summer, June to September | Full leaf (12 and 13) | A lawn going sage by August | Long dusks. The crew on weekends: tents, camp chairs, a cooler, a dog |
| Autumn, October and November | Sage and paper-cream leaves, falling | Leaves on the lawn | Fog, rain, low cloud |
| Winter, December to February | Bare and mossy | Snow only when the forecast says snow: a white roof with skylights showing, a deep lawn, a buried deck, icicles. Otherwise rain | The fire bowl gets a cap of snow |

### 4.5 Time of day and weather

**Time of day** uses the existing remaps (11.4): Day, Dusk, Blue hour and Night, with Dawn on the Dusk table. The lights are exempt and resolve after the remap: the windows, lanterns, antenna light, fire, steam, stars and moon.

**Weather** uses the shared overlays: rain curtains (`vlines`), fog bands that hide the far layer and cross the maples, and falling snow. A thunderstorm flash is two frames with every slot sent to snow, as on the trail.

### 4.6 States, props and sprites

**States:**

- **Normal.**
- **A trip in preparation,** with the four props of 3.5.
- **Homecoming:** the car pulls in, and the fire bowl is lit in the evening.
- **Tub lit:** cover off, steam, the 104°F thermometer.
- **The crew around:** tents, camp chairs, a cooler (closed), the dog, figures on the porch.
- **After a death:** dusk, one chair empty, the tub covered, the bowl cold.
- **First launch:** the lockbox lit by one lantern, and the guest book open.

**Sprites:** the hiker is the usual rust jacket and brick pack (11.6), sitting in a chair or in the tub. The crew are hikers in teal, slate and moss. There's a dog, steam and fire-bowl smoke.

### 4.7 The hotspot map

Picture pixels on the 160 x 320 plate. A 44-pt target is about 19 x 33 pixels at 7x4 on a 3x phone, so the hit areas are drawn bigger than the art.

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

### 4.8 New stamps, sprites and a pseudo-color

- **Stamps:** the cabin as one stamp per season; the shed; the tub, with and without its cover; the fire bowl, cold and lit; an Adirondack chair; the chalkboard; the register post; the mailbox with its flag up and down; mole hills; a bigleaf maple, bare and in leaf; a Sitka spruce; a tent; a cooler; the clam gun; route signs; the race bib; the lily sketch (gold, the lily's own mark).
- **Sprites:** the hiker sitting and soaking; three crew figures; the dog.
- **Pseudo-color 26, `steam`:** a light cycling 4, 3, 5, phased by row so it rises. Lit by the tub, it is exempt from the night remap, like the lamp.
- **Cost:** about 2 to 3 sessions for the plate and its overlays, judged against the PNG renders (11.8). That is close to what the cover took in Session 1, plus the seasons.

### 4.9 Rules

- **Draw from the words, never from the photos.** No photo is traced or copied, and none enters the repo.
- **No sign, number, road name or shoreline** that would place the cabin.
- **Gold appears only in the lily's own sketch.**
- **The shape language of 11.1 applies:** flat layered bands, stacked-tier conifers and dithers only where they belong.

---

## 5. Screen flows

### 5.1 An Open trip

```
 CABIN (live time)
   │ the door
   ▼
 MAP TABLE: where · which way round
   │ · nights · camps · basin or
   │ crest · date
   ▼
 PERMIT: print it (No. 104-xxxx)
   │ the car
   ▼
 TOWN, the day before
   │ the WIC: briefing · loaner
   │   can · desk camps (optional)
   │ three stores (any, all, none)
   ▼
 CABIN, evening ─ shed ─▶ FLAT LAY
   │ pack it · share it
   │ the car, at a time you pick
   ▼
 DRIVE (Forks: a last-chance shelf)
   ▼
 TRAILHEAD: the tailgate
   │ Start walking: no going back
   ▼
 DAYS: stops · splits · forks ·
   │ camp · night · morning
   ▼
 THE CAR: the stamp · last split
   ▼
 DRIVE HOME ▸ CABIN (arrival time)
   ▼
 TRIP REPORT ▸ share ▸ (big) SOAK
   │
   └ or: death box ▸ YOU PERISHED
     ▸ Leave No Trace ▸ epitaph ▸
     GAME OVER ▸ the cabin at dusk
     ▸ register ▸ guest book
```

### 5.2 The Hike of the Day

```
 CABIN ─ chalkboard ─▶ TODAY
   │ route · real NWS forecast ·
   │ daylight · your streak
   ▼
 a day-use line, or a filled-in
   │ permit for an overnight daily
   ▼
 FLAT LAY: the standard shed, the
   │ same for everyone; no town
   ▼
 TRAILHEAD ▸ Start walking: the
   │ one shot begins here
   ▼
 THE TRAIL: splits vs. your plan
   ▼
 FINISH: your time ▸ today's board
   │ ▸ the share text
   └ or a death: DNF, the streak
     resets, the Open hiker is
     untouched
   ▼
 CABIN: your time in chalk
```

The one shot starts at *Start walking*. Leaving before that doesn't spend the day's attempt. Whether the daily allows any shopping is for the modes draft. I propose none: everyone packs from the same standard shed, so the skill on display is choosing what to leave behind (7.5).

### 5.3 An FKT attempt

```
 CABIN ─ the peak ─▶ BIG ROUTES
   │ record · yours · style (open)
   ▼
 the route fixed ▸ FLAT LAY
   │ (a fast kit)
   ▼
 TRAILHEAD ▸ the clock starts
   ▼
 THE TRAIL: splits vs. the record
   │ (the technical descent)
   ▼
 FINISH ▸ the board ▸ share
   ▼
 CABIN: a bib on the porch post
```

The FKT styles, running and fuel, ghosts and the boards are still open (PENDING_DECISIONS). This flow only gives them their places.

### 5.4 The status line in each mode

| Mode | Status line (DRAFT) |
|---|---|
| Open | `12/170 · mi 3.1 · 10:12 am` and ≡ |
| Hike of the Day | `Day 37 · 0:42:10 · mi 2.1` and ≡ |
| FKT | `1:12:40 · +0:03 · mi 5.0` and ≡ |

---

## 6. Wireframes

All 40 characters wide. The Open trip is Robin's from Appendix B.2 (↻ river first, three nights, Thursday to Sunday, August 12 to 15, 2027) unless a note says otherwise. Every word inside a box is a draft.

### 6.1 Home: the cabin

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

- **The picture is the menu.** Its places carry small labels until each has been used once.
- **The rail repeats the places.** The next-step button names the next thing this trip needs (3.3).
- **This is the evening after the town run:** groceries on the steps, the tub covered, the antenna light blinking for a new daily.

### 6.2 First launch: the lockbox

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
│ Right or wrong, the box opens        │
│ after the third. No timer.           │
└──────────────────────────────────────┘
```

- **The questions are the existing locals' quiz** (2.6, `content/quiz/locals.json`), now asked by the cabin's key lockbox instead of a book.
- **It plays once per phone,** as before.

### 6.3 First launch: the guest book

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

- **Name only, as decided (decision 6).** The one-life line has to be reworded, because the approved one says "book" (12.4).

### 6.4 The map table

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

- **This is the first trip's three questions** (3.6, 12.5), moved from the WIC counter to the cabin's table.
- **Later trips get the full planner** (12.5) on the same map.

### 6.5 The permit

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

- **You print your own permit,** as Olympic's real permits are printed (NPS). The rubber stamp's thunk becomes an old printer's clatter.
- **The notes are the plan's own checks** (4.6), written as plain facts, with no ranger voice. The ranger reads them back in her own words only if you visit the WIC.
- **The fine print** is still the hidden way to Lake Morgenroth (12.5). It is hidden in M1a.

### 6.6 Town: Port Angeles

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

- **A stylized street, not real storefronts.** You can visit any of the four doors, or none.
- **The WIC gives the briefing** (knowledge, 8.6), the loaner can and the desk-only camps (7.6).

### 6.7 The general store

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

- **Its *Fill from the list* buys cans and cheap staples** (7.4).
- **The beer cooler is here** (21+). Second Growth is next door (2.6).

### 6.8 The gear shop

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

- **Tap the scale to weigh any item, in ounces and grams.** Rentals live behind the counter.
- **Fragile premium items say so on their row.**

### 6.9 The boutique

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

- **Style and morale.** Each row says what it does on the trail (morale, or nothing but looks) and that it shows in your flat lay.

### 6.10 The flat lay

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

- **The picture is the deck, seen from above** (section 8). Tap an item there to put it back in the shed. Tap a row in the drawer to lay it out.
- **Long-press an item for its card.** The card shows where the item rides, picked as in the slot picker (12.9), and its store, weight and state.
- **The weights are computed from the catalog** for a kit like B.2's.

### 6.11 The flat lay's share image

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
│ {GAME_NAME}                          │
│ fernforager.github.io/104-boyz       │
└──────────────────────────────────────┘
```

- **A 1080 x 1350 PNG** (8.6). The picture uses the same pixels as the screen.

### 6.12 The trailhead: the tailgate

```
┌──────────────────────────────────────┐
│ Sol Duc TH · Thu 8:25 am · fog       │
│ ┌──────────────────────────────────┐ │
│ │ THE TAILGATE: the hatch up, the  │ │
│ │ same flat lay on the bed; the    │ │
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

- **The last look (12.10) becomes the flat lay's second backdrop:** the open tailgate.
- **The outlook line is the design doc's own** (3.3). Beer and the pre-roll still never appear here (T05).

### 6.13 The trail, with splits

```
┌──────────────────────────────────────┐
│ 12/170 · mi 3.1 · 10:12 am         ≡ │
│ ┌──────────────────────────────────┐ │
│ │ SCENE: the Sol Duc River trail   │ │
│ │ in old growth; a dipper bobbing  │ │
│ │ on a rock (tap = Look)           │ │
│ └──────────────────────────────────┘ │
│ Day 1 · the river trail · drizzle    │
│ ▁▁▂▂▃▃▄▄▅▅▆▆▇▇██▇▇▆                  │
│ T━F━━━━━━●────R4─────────P           │
│ SPLIT Falls 0:31 · -0:04 vs plan     │
│ Next: Sol Duc Park 4.0 mi · 2:00     │
│ ╔══════════════════════════════════╗ │
│ ║ (DRAFT) One or two short lines   ║ │
│ ║ for this moment, if any.         ║ │
│ ╚══════════════════════════════════╝ │
│ [ Walk on  >                       ] │
│ [   Pack   ][   Map    ][   Log    ] │
└──────────────────────────────────────┘
```

- **The profile and the split strip** sit between the picture and the box (10.1).
- **A quiet stop may have no box at all.** The scene and the sound carry it (decision 32).

### 6.14 A decision with odds

```
┌──────────────────────────────────────┐
│ 31/96 · mi 6.9 · 1:50 pm           ≡ │
│ ┌──────────────────────────────────┐ │
│ │ THE RIM: the basin below, blue   │ │
│ │ lakes in pale rock; clouds over  │ │
│ │ Olympus (tap = Look)             │ │
│ └──────────────────────────────────┘ │
│ Day 1 · the rim · 4,900 ft           │
│ SPLIT the rim 5:20 · +0:15 plan      │
│ Water 0.5 L · Lunch Lake 0.9 mi      │
│ ╔══════════════════════════════════╗ │
│ ║ (DRAFT) The fork, in a line or   ║ │
│ ║ two: thunder likely after 3.     ║ │
│ ╚══════════════════════════════════╝ │
│ ╔═════════════════════════════╗╔═══╗ │
│ ║ Stay high to Heart Lk 4:30  ║║ i ║ │
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

- **From Appendix B.6's trip** (counterclockwise, one night at Heart Lake). The odds, bars and fatal shares are the design doc's (12.12).
- **What's new is the split and water line** above the box.

### 6.15 Camp

```
┌──────────────────────────────────────┐
│ 40/170 · Sol Duc Park · 2 pm       ≡ │
│ ┌──────────────────────────────────┐ │
│ │ CAMP: a meadow, the creek        │ │
│ │ (cycling), a marmot on a rock    │ │
│ └──────────────────────────────────┘ │
│ Day 1 · sun · 61°F · dark 9:05       │
│ SPLIT camp 5:30 · plan 5:25          │
│ ╔══════════════════════════════════╗ │
│ ║ (DRAFT) An arrival line.         ║ │
│ ╚══════════════════════════════════╝ │
│ [ Make camp: tent, water,      45m ] │
│   dinner, food in the can            │
│ [ Pack the can*  ][ Rain pitch*    ] │
│ [ Wander  30m    ][ Watch sunset   ] │
│ [ Swim (brr)     ][ Side trip  1 h ] │
│ [ My own way...  ][ Go to sleep  > ] │
│ * the minigames, when they apply     │
│ [   Pack   ][   Map    ][   Log    ] │
└──────────────────────────────────────┘
```

- **Two tiles open minigames** when they apply: packing the can, and pitching in the rain. Their rules belong to the minigames draft.
- **The rest is the existing camp grid** (12.14).

### 6.16 Finish, at the car

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

- **The ending's stamp replaces The End's plate.**
- **The trail hours decide the tub** (3.7). B.2's trip walked 22.3 miles and climbed 5,480 ft, side trip included.

### 6.17 The trip report

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

- **The report replaces the back cover.** It scrolls, because it's a report.
- **The conditions fields borrow the shape** that Washington hikers know from published trip reports (10.3).

### 6.18 The share card

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
│ {GAME_NAME}                          │
│ fernforager.github.io/104-boyz       │
└──────────────────────────────────────┘
```

### 6.19 Hike of the Day

```
┌──────────────────────────────────────┐
│ < Cabin              HIKE OF THE DAY │
│ ┌──────────────────────────────────┐ │
│ │ THE CHALKBOARD by the steps:     │ │
│ │ the route in chalk, the weather  │ │
│ │ in chalk marks, and the streak   │ │
│ │ in tally marks: |||| |           │ │
│ └──────────────────────────────────┘ │
│ Fri Oct 9, 2026 · day 37             │
│ Deer Lake from the Sol Duc TH        │
│ 7.4 mi · +1,950 ft · out and back    │
│ NWS: showers, 52°F (example)         │
│ Light 7:26 am to 6:44 pm (ex.)       │
│ A fresh hiker, the standard kit      │
│ One shot, from Start walking         │
│ Streak 6 · best 11                   │
│ [ Take today's hike  >             ] │
│ [ Today's board                    ] │
└──────────────────────────────────────┘
```

- **An invented example for October 9, 2026.** The forecast and the daylight are marked as examples, not real data. In the game they come from the scheduled build (decision 31).

### 6.20 Big routes: FKT

```
┌──────────────────────────────────────┐
│ < Cabin             BIG ROUTES · FKT │
│ ┌──────────────────────────────────┐ │
│ │ THE PEAK, close: snow on dark    │ │
│ │ rock; S1's High Divide cover is  │ │
│ │ the loop's own picture here      │ │
│ └──────────────────────────────────┘ │
│ High Divide Loop · 18.4 mi           │
│ +4,400 ft · ↺ or ↻                   │
│ Record: {FKT_LOOP} (the game's)      │
│ Yours: none yet                      │
│ Style: still open (see 12)           │
│ [ Go for it  >                     ] │
│ More routes arrive with the park.    │
└──────────────────────────────────────┘
```

- **Session 1's High Divide cover gets a new job here.** The record and the styles wait on the modes draft.

### 6.21 The soak

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

- **Shown only after a big hike** (3.7). The cabin's music plays (decision 32).

### 6.22 After a death

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

- **This follows GAME OVER** (3.8). The wipe plays in this scene.

---

## 7. The three stores

### 7.1 Who they are

| Store | In the spirit of | Behind the counter | In your flat lay |
|---|---|---|---|
| `{STORE_GENERAL}` | Swain's General Store: since 1957, from hardware to clothing, hunting and fishing (PDN) | Plainspoken and proud of things that last. Talks price and durability | Plaid, canvas and olive. Chunky 2-pixel outlines. Heavy shapes |
| `{STORE_GEAR}` | Brown's Outdoor: a family outfitter, named the town's best by *Outside* in 2015 (PDN) | Knows the park and weighs things in grams. Honest about what's fragile | Slate, teal and titanium. Crisp 1-pixel outlines. Small, minimal shapes |
| `{STORE_BOUTIQUE}` | MOSS: a downtown boutique of Pacific Northwest clothes and goods (Wanderlog) | Warm and style-forward. Cares how the trip feels and looks | Moss, sage and alpenglow pink. Patterned dithers and a tiny fern motif |

**The shopkeepers are fictional,** unnamed until you name them. Their lines are yours to write. "Fernwood Mercantile," the doc's old store name, could live on as the general store, if you like it.

### 7.2 What each one sells

The ids are from `gear_catalog.json` and `food_catalog.json`. A tier is the catalog's cheap or premium version of an item. Prices are the catalogs' own.

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

### 7.3 New items the catalogs need

The weights and prices are proposals. Calories for the new foods are still to research from real labels before ingest.

| Id | Store | Weight · price | Why |
|---|---|---|---|
| `tarp_canvas` | General | 64 oz · $49 | Bombproof shelter: heavy, never tears |
| `flannel_cotton` | General | 12 oz · $29 | The flannel look, cotton inside: a soft trap |
| `wool_pants_surplus` | General | 24 oz · $35 | Surplus wool: heavy, warm when wet |
| `blanket_wool` | General, Boutique | 64 oz · $59 or $189 | Warmth at camp, heavy. Also a flat-lay backdrop |
| `flannel_wool` | Boutique | 14 oz · $79 | The same look in wool: warm when wet, a little morale |
| `beanie_moss` | Boutique | 2 oz · $38 | A style twin of `beanie_wool` |
| `trucker_cap` | Boutique | 2.5 oz · $34 | A style twin of `ball_cap` |
| `socks_wool_pattern` | Boutique | 6 oz · $36 | A style twin of `socks_wool_hiking` |
| `bandana_print` | Boutique | 1 oz · $18 | A printed bandana: morale and style |
| `enamel_mug` | Boutique | 6 oz · $28 | Heavier than the insulated mug, but the hot drink lifts morale |
| `cards_pnw` | Boutique | 3 oz · $15 | A style twin of `playing_cards` |
| `sticker_sheet` | Boutique | 0.2 oz · $8 | Decorates the can, the bottles and the pack in the flat lay. Never left behind |
| `pack_patch` | Boutique | 0.3 oz · $12 | Shows on the pack sprite on the trail |
| `rucksack_waxed_25` | Boutique | 40 oz · $189 | A beautiful day pack with no hip belt: it carries like a trap |
| `chocolate_fancy` | Boutique | 3 oz · $6 | A treat, morale +3 |
| `coffee_local` | Boutique | 0.7 oz a day · $2 | A morale twin of `coffee_ground` |
| `smoked_salmon` | Boutique, General | 3 oz · $9 | Smelly, morale +3 |
| `huckleberry_candy` | Boutique | 3 oz · $7 | A treat |
| `dog_bandana` | Boutique | — · $16 | Cabin only: the dog wears it |

**Four new fields on every item:**

- **`origin`:** the shed or one of the three stores.
- **`look`:** a palette pair, a dither pattern and an outline weight, for the flat lay.
- **`bombproof`:** a new tag. The item never fails from wear.
- **`style`:** a new tag. The look, with little or no effect on the trail.

### 7.4 Food: one list, three ways to fill it

**The shopping list and the canister gauge (5.3) are the same at every counter.** *Fill from the list* fills it from that store's own shelves:

- cans and ramen at the general store;
- freeze-dried meals and bars at the gear shop;
- treats on top at the boutique.

It shows in the flat lay. A row of cans looks nothing like a row of pouches.

### 7.5 Money, and why the cheap store still matters

Today the game shows prices and has no budget (1.2, a lead call); the Shoestring wallet waits for M6. With no budget, a cheap tier that is simply worse would never be bought. So the stores must differ in kind, not only in price:

- **The general store is heavy and bombproof.** The new `bombproof` tag means the item never fails from wear. The canvas tarp shrugs off wind that tears a fragile tent, and the foam pad never punctures.
- **The gear shop is light and technical, and some of it is fragile.** That covers the composite-fabric tent, the 900-fill bag and the carbon poles. The simulation already has their failure chances (the `fragile` and `puncture_risk` tags).
- **The boutique is morale and style:** a small lift at camp each evening, and the look.

**The starting shed is smaller (proposed).** It holds the ranger's sensible kit for the loop, at the standard tier, plus the 18 traps. Everything else is bought, so the flat lay shows where you shop. Without a budget, buying is choosing whose version you carry. The receipt still shows the money.

**Gear lasts as long as the hiker.** It stays in the shed while the hiker lives, and the full wipe resets the shed. A later option (M6): damage comes home, and a repair kit fixes it overnight.

**My recommendation:**

- **Open trips:** no budget, as now.
- **Hike of the Day:** no shopping. Everyone packs from the same standard shed.

Both are for you to decide (section 12).

### 7.6 Also in town, and on the way

- **The WIC** (Port Angeles, open all year in `park_rules.json`):
  - the ranger reads your plan back and gives the briefing (knowledge, 8.6);
  - the free loaner can, available about 70% of the time on summer weekends and 95% midweek;
  - the camps you can only ask for at the desk.

  Skipping the WIC means no briefing, and buying or renting a can.
- **Second Growth,** next door to the general store, sells the pre-roll (21+), unchanged (2.6).
- **On the drive:** the last-chance shelf in Forks and *The Huckleberry Skillet* (both fictional, 5.2) are on the cabin's way to the Sol Duc, through Forks. Day hikes grab lunch there.
- **The beer cooler** is at the general store, with the ID check.
- **Lint T03** adds the three real store names to its deny-list.

---

## 8. The flat lay

### 8.1 What it is

The night before a trip, backpackers lay everything out and photograph it from above. You asked for that ethos, and it has a name and a history. "Knolling," arranging things at right angles in a grid, was named in 1987 by a janitor in Frank Gehry's furniture shop, after the Knoll furniture the shop was building (Kinfolk).

In this game the flat lay is the packing screen itself, not a picture of it. It is the screen players will share.

**The default backdrop is the cabin's deck boards.** Two others:

- **the tailgate,** at the trailhead's last look (6.12);
- **the patterned wool blanket,** once you own it (`blanket_wool`).

### 8.2 Art direction

- **Straight down, lit from the upper left.** A 1-pixel shadow falls lower right, in the backdrop's shadow color.
- **Deck boards:** weathered silver (3 glacier blue and 2 slate dither), with 0 ink seams and the odd 10 bark knot.
- **Tailgate:** 2 slate with a ribbed liner (`hlines`).
- **Blanket:** 9 brick and 5 paper-cream stripes. It makes no attempt to copy any real blanket's pattern.
- **Items:** flat fills, one highlight band on the lit side, and a dither for texture:
  - `checker` for fleece;
  - `hlines` for ripstop;
  - `brick` for wool knit;
  - `diag` for canvas.
- **Outlines show where you shopped:** 2-pixel bark for the general store, 1-pixel ink for the gear shop, and 1-pixel with a pattern fill for the boutique (7.1).
- **The rain jacket is rust (8):** the same jacket the hiker wears on the trail (11.6).
- **Gold never appears.**
- **The scale.** One picture pixel across is about half an inch, and one row is about 2/7 of an inch (the wide AGI pixel). The 160 x 240 lay is about 80 by 69 inches, a section of deck. Things are drawn at their true relative size, with a 3 x 6 pixel minimum.

### 8.3 Layout rules

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

### 8.4 It is the packing screen

- **Two taps move things.** A tap on an item in the drawer lays it out with a *bloop*. A tap on an item on the deck puts it back in the shed.
- **A long-press opens the item's card:** its weight and volume, its store, its state (wet, patched, used up) and where it rides. Changing where it rides is the slot picker of 12.9.
- **The gauges are always live:** base weight, pack weight with the felt-load word from 6.4, liters and the bear can.
- **The ranger's checklist is a corner chip.** The forecast-aware nudges of 6.1 stay, one dry line each.
- **Tap the bear can** for the canister panel (12.9), or for the can-packing minigame when the minigames draft adds it (decision 30).
- **Like last time** reloads the hiker's last kit, as before.
- **Pack it** flies everything into the pack, checks the volume ("won't close" is still one of the three hard blocks) and runs the Trip Outlook with this pack (3.2). Then the pack goes by the car at the cabin.
- **The same screen at the trailhead** (on the tailgate) only moves things between the pack and the car (12.10).

### 8.5 The numbers

| Number | What it counts | Why |
|---|---|---|
| Base weight | Everything packed, minus food, water and fuel, and minus worn items | The hardcore crowd's number. The usual marks are under 20 lb (lightweight), under 10 (ultralight) and under 5 (super ultralight): conventions, not rules (REI) |
| Pack weight | Base plus food, water and fuel | What the simulation's felt load reads (6.3) |
| Worn | Shoes and the outfit you start in | Counted apart, as gear lists do |
| Liters, can | Inside liters of the pack; can liters and days of food | The two hard fits (6.3) |
| From | Items from the shed and from each store | The style read, and the share image's store marks |

**Worn items need a lead call.** Today every item counts toward the pack. I propose a `worn` place for footwear and one outfit. Worn things leave the pack's weight and liters, and footwear keeps its own effect on pace. It is a small change in the simulation, and every serious backpacker will expect it.

### 8.6 The share image

**Size:** 1080 x 1350, Instagram's usual portrait size (4:5).

**The picture uses whole pixels.** The 160 x 240 flat lay at 6 x 4 device pixels per picture pixel is 960 x 960, close to the 7 x 4 shape the phone shows.

**The bands:**

| Band | Height | Contents |
|---|---|---|
| Top | 150 px | A paper-cream permit strip: permit number, route, dates, nights, direction. A day hike shows *day hike* and no number |
| Picture | 960 px | The flat lay, with 60 px of deck boards either side |
| Bottom | 240 px | Base weight, pack weight, can and days, liters; the store marks; the hiker's name (optional); `{GAME_NAME}` and `fernforager.github.io/104-boyz` in small type |

- **The text is drawn into the PNG** with the pixel fonts at whole-number scales.
- **The file is small.** The palette is the 16 colors, and the repo's own PNG encoder (`tools/png.mjs`) can write an indexed file in the browser.
- **The daily version** heads its strip with *Hike of the Day* and the date. The trip report's card is in 6.18.
- **How it reaches the share sheet:** `navigator.canShare({ files })`, then `navigator.share`. Safari has supported sharing files since iOS 15.
- **The fallback** is the image on a sheet with "press and hold to save." The usual no-callout rule is lifted on that one image.
- **Test both paths** on your phone before relying on them (F.5).
- **Privacy.** No location and no real names. The hiker's name is an in-game name and can be switched off.

### 8.7 A gear list for the spreadsheet crowd

*Copy gear list* puts the kit on the clipboard as CSV, in LighterPack's columns, so gram-counters can paste it into the tools they already use. Those columns are item, category, description, quantity, weight, unit, worn and consumable. I could not confirm LighterPack's exact header row, so the first step is to export a real list and copy its header. It is cheap, and it can wait for M1b.

### 8.8 Building it

- **About 80 top-down stamps for M1a:** the roughly 60 gear items in play (14.1), the 8 packs and about 12 food groups. Style twins reuse a stamp with a palette swap.
- **They are drawn in the picture VM like any stamp,** and judged as PNGs (11.8).
- **The layout** is a shelf-packing pass per zone, in a few milliseconds.
- **The drawer is the closet list of 6.1,** grouped by the ranger's checklist rows.
- **The gauges are the same numbers the pack screen computed.** Nothing in the simulation changes except the worn place (8.5).

---

## 9. Who speaks?

With the storybook narrator gone, something still has to say what is happening. Here are three ways to do it, shown on the same moment: the fork at the rim (12.12). The lines are DRAFT, there only to show the shape.

**A. You, now.** Terse second person, present tense, in the Sierra box. It is King's Quest's own voice: its message boxes spoke to "you."

> (DRAFT) The basin lies below. Clouds are stacking up over Olympus. You have half a liter of water.

- **For:** it talks to the player, not about a character. It already matches the Look boxes and the YOU PERISHED lines (*You have died of...*). It needs no name, which suits the daily's fresh hiker. The deadpan survives intact.
- **Against:** it can sound like an old text adventure if the writing slips.

**B. The log.** The hiker's own trail log, in the first person, terse, in the past tense.

> (DRAFT) 1:50 pm. The rim. Clouds over Olympus. Half a liter left.

- **For:** it is entirely backpacking's own stuff, and it becomes the trip report word for word.
- **Against:** a log can't hand you a decision in the moment without sounding odd. It also clashes with the second-person death lines.

**C. No narrator.** The world speaks for itself: a caption, signs, the map, the permit, the ranger and other hikers in quotes. The picture and the sound do the rest, as in *Lonely Mountains: Downhill*.

> `The rim · 1:50 pm · 4,900 ft` · `Thunder after 3 (40%)` · `Water 0.5 L`

- **For:** the fewest words for you to approve, and it travels well.
- **Against:** it loses the dry humor that the Larry moments and the death boxes are built on.

**Recommended: A for the moment, B for the record.** The live screens speak in short second-person lines, and only when they add something the picture and the sound can't. That is C's discipline as a rule. Every day also writes the hiker's first-person log, which becomes the trip report's body. The Boyz' voices are heard only in the tub, and only when the crew is around.

**What changes for writing** (an update to the ten voice rules in 2.3):

- **Second person, present tense.** The hiker's name never appears in the narration. It is on the permit, the log, the register and the report.
- **At most two short sentences at a stop:** about 140 characters, half the old 260 budget. Many stops have none.
- **The deadpan stays.** The death box moves to the present tense. The YOU PERISHED lines and Look boxes need no change.
- **Fewer characters for you to approve,** though about as many strings.

---

## 10. Splits, the trail screen and the trip report

### 10.1 Splits

**The checkpoints** are the route's named places from the region data: the trailhead, falls, junctions, lakes and camps. On Day 1 of B.2 they are the trailhead, Sol Duc Falls, Sol Duc River #4 and Sol Duc Park.

**A split** is the time since *Start walking*, or since that morning's start on later days, at each checkpoint. It is shown against:

- **the plan,** the itinerary's ETA by the movement formula (7.4), on Open trips and the daily;
- **the record,** on FKT attempts. The styles and ghosts are still open (PENDING_DECISIONS).

**The strip** is today's elevation profile with a tick for each checkpoint and a dot for you. A split line sits under it (6.13).

### 10.2 The trail screen

From the top:

1. The status line (5.4).
2. The picture.
3. A day line: day, place, weather.
4. The profile and the split.
5. The Sierra box, only when there's something to say.
6. *Walk on*.
7. The toolbar: Pack, Map and Log. The Journal tab becomes Log.

**Swipe left to walk on. Swipe right for today's log.**

The pacing targets of 3.5 count stops instead of pages. The Trail stops setting (Few, Usual, Many) replaces Page density.

### 10.3 The trip report

**It replaces the back cover** (wireframe 6.17). From the top:

- **Ending and title.** The ending's stamp, and the title, picked from three suggestions built from templates you write (the route plus the trip's biggest event).
- **Route and permit.** Dates and the permit number, then the route map with the camps and split ticks.
- **Stats:** miles, climb, nights, moving time, trail hours (and whether the trip was big), base weight, the score and Leave No Trace.
- **Splits:** one line per day.
- **The days.** Each day's headline, and the log lines under it.
- **Gear notes:** used every day, never used, wished for. This is *What the pack taught* (6.6), which never lists beer or the pre-roll (T05).
- **Conditions:** trail, road, bugs, snow. Published Washington Trails Association reports carry the same fields (Type of Hike, Trail Conditions, Road, Bugs, Snow), so local hikers will recognize the shape. The name stays generic.
- **Field Notes:** the cause trace, one tap away.
- **Buttons:** Share, *Hike it again* and Back to the cabin.

**The daily's share is text**, so it pastes anywhere and gives nothing away. The format is yours to write. A sketch:

```
(DRAFT)
Hike of the Day 37 · Oct 9
Deer Lake · 2:14:05 · streak 6
```

A DNF could share its YOU PERISHED line instead: Oregon Trail deaths have always been worth sharing. Comparing your splits with the day's field needs the board, which is still open.

---

## 11. What M1a needs

**In M1a, the first playable:**

- **The cabin plate** in late summer (August, the loop's month), with all four times of day, rain and fog, and the live clock. Until the daily's build exists, the weather comes from climatology.
- **The home's places:** the door, shed, car, fire bowl, register post, mailbox, the tub with its soak, the guest book and the lockbox. Then the next-step button and the rail.
- **The map table and *Print it*.**
- **Town,** with the WIC, the general store and the gear shop.
- **The flat lay,** with its share image.
- **On the trail:** the tailgate, the trail screen with splits against the plan, and camp.
- **Coming home:** the stamp at the car, the drive home, the trip report and its share card.
- **After a death:** the cabin at dusk, and the wipe.

**In M1b:** the boutique; spring, autumn and winter; the moon; the crew and the easter eggs; the other backdrops; the gear-list CSV.

**With the modes draft's milestones:** the chalkboard (Hike of the Day), whose NWS bake also feeds the cabin's weather, and the peak (FKT).

**Cut first:** the winter snow overlay, the crew, the moon, the boutique, the trip report's share card (keep the flat lay's) and the CSV.

**Rough cost.** Most of this replaces M1a work that was already planned: the title page, the store, the pack screen and the back cover. What it adds is about 4 to 6 sessions, mostly the flat lay's stamps and the cabin's overlays. That is an estimate, not a measurement.

---

## 12. Decisions for you

1. **The frame.** Approve the replacement table in section 2, or mark the rows you'd change.
2. **Home on the real clock.** The cabin shows Lake Quinault's real season, light, weather and moon, except at the homecoming (3.4). Or should it follow the game's own calendar?
3. **What "big" means for the tub:** 8 trail hours walked, or an Olympus summit, or a finished FKT (3.7). Or a different bar?
4. **Who speaks.** A (you, now) for the moment, B (the log) for the record, and the Boyz only in the tub (section 9). Or A, B or C alone?
5. **Planning at the cabin.** You print your own permit, and the WIC becomes an optional town stop with the briefing, loaner can and desk camps (6.5, 7.6). Or keep the WIC visit mandatory?
6. **Where the epitaph is signed:** at the trailhead box, as approved, or at the cabin's register post (3.9)?
7. **The stores' names:** three of yours. Should Fernwood Mercantile live on as the general store? Should Second Growth stay next to it?
8. **Money.** Open trips with no budget, and a Hike of the Day with no shopping (7.5)? Or a wallet?
9. **A smaller starting shed** (the ranger's kit plus the traps), so the flat lay shows where you shop (7.5)?
10. **Worn items** count apart from the pack (8.5): yes or no?
11. **The share image** carries the hiker's name and the game's URL by default (8.6)?
12. **The locals' quiz becomes the cabin's key lockbox** (6.2)?
13. **The night refrain:** keep one closing line in the new voice, or let the river be heard instead?
14. **The hidden mode's new name:** `gentle` for now (section 2)?
15. **When the crew is around:** summer Friday and Saturday evenings, the evening of a big homecoming, and the dates you choose (`{BOYZ_DATES}`)?
16. **The Bonfire Lily's gold sketch** in the cabin's gable window, after a find (3.5)?
17. **Drinks:** none anywhere at the cabin. In the soak, a can on the tub's edge, or nothing (3.7)?
18. **Jon at the cabin:** always absent (the hat, the badge, the initials), or sometimes in the crew?

Still open from this round and not settled here: the FKT styles, running and fuel, splits against ghosts, the crew boards, teaching new players, and the game's real name (`{GAME_NAME}`).

---

## 13. Sources

**Real-world facts used here:**

- **Swain's General Store** opened in Port Angeles in 1957 and sells "home improvement to clothing and shoes, from hunting and fishing supplies to toys": [Peninsula Daily News, Apr 27, 2014](https://peninsuladailynews.com/news/more-of-swains-port-angeles-store-expanding-into-space-left-by-neighbor).
- **Brown's Outdoor** is a four-generation family business that *Outside* named the town's best outfitter, "a well-curated selection of hiking and backpacking gear": [Peninsula Daily News, Aug 20, 2015](https://www.peninsuladailynews.com/?p=48639).
- **MOSS** is a downtown boutique of "PNW-themed clothes and goods" at 104 W 1st St: [Wanderlog](https://wanderlog.com/place/details/2251622), [Coho Ferry](https://cohoferry.com/articles/op-winter-itinerary-sip-and-shop).
- **Olympic's wilderness permits are printed by the hiker:** "you will be able to log in to your account and print the permit yourself": [NPS, Wilderness Reservations](https://www.nps.gov/olym/planyourvisit/wilderness-reservations.htm).
- **Quinault is about three hours from Port Angeles and one hour from Forks:** [NPS, Visiting Quinault](https://www.nps.gov/olym/planyourvisit/visiting-quinault.htm).
- **104°F is the CPSC's maximum for hot tub water:** [CPSC](https://www.cpsc.gov/content/cpsc-warns-of-hot-tub-temperatures).
- **NWS API:** `/points` returns the forecast URLs, and a User-Agent is required: [weather.gov, API documentation](https://www.weather.gov/documentation/services-web-api).
- **Bigleaf maples** turn yellow in autumn and carry heavy epiphyte loads on the Olympic Peninsula: [WSU Extension](https://extension.wsu.edu/maplesyrup/bigleafmaple/), [Washington Native Plant Society](https://www.wnps.org/native-plant-directory/226-acer-macrophyllum).
- ***Sword & Sworcery*** syncs its moon phase with the real one by the system clock: [Wikipedia](https://en.wikipedia.org/wiki/Superbrothers:_Sword_%26_Sworcery_EP). Its button for posting the on-screen line to Twitter: [Inverse](https://inverse.com/gaming/superbrothers-sword-sworcery-cult-classic-update-steam-deck).
- ***1000 Heroz*** (RedLynx, 2011) added a level a day, with leaderboards open for 24 hours: [Wikipedia](https://en.wikipedia.org/wiki/1000_Heroz).
- ***Suika Game*** (Aladdin X, 2021) is the fruit-merging drop game behind the can-packing minigame: [Wikipedia](https://en.wikipedia.org/wiki/Suika_Game).
- **Knolling** was named in 1987 in Frank Gehry's furniture shop: [Kinfolk](https://www.kinfolk.com/stories/word-knolling/).
- **Base-weight conventions** (under 10 lb is ultralight): [REI Expert Advice](https://www.rei.com/learn/expert-advice/ultralight-backpacking-gear-essentials.html), [Outdoor Empire](https://outdoorempire.com/what-is-ultralight-backpacking/).
- **LighterPack imports and exports CSV,** with worn and consumable flags; its exact header is not confirmed: [Backpackers.com](https://backpackers.com/how-to/calculate-backpack-weight/).
- **Instagram's portrait feed size** is 1080 x 1350 at 4:5 (third-party guide): [Dimensions](https://dimensions.com/element/instagram-feed-images-portrait).
- **Web Share Level 2 file sharing** became usable in Safari with iOS 15: [Adactio](https://adactio.com/journal/15972), [WebKit bug 198606](https://bugs.webkit.org/show_bug.cgi?id=198606).
- **The trip-report fields** (Type of Hike, Trail Conditions, Road, Bugs, Snow) appear in published reports such as [this one](https://www.wta.org/go-hiking/trip-reports/trip_report-2024-06-21.151916120349). They were seen in search results; wta.org refused a direct fetch.

**Repo data:**

- `sol_duc_high_divide.json`: the trips' miles and climb, the drive minutes from Forks (69), and the trailheads.
- `south_quinault_skok.json`: the Quinault WIC closed for 2026.
- `park_rules.json`: the WIC's loaner cans and dogs on trails.
- `gear_catalog.json`, `food_catalog.json`: every id, weight and price in section 7, and the kit weights in 6.10.
