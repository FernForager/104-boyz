# Storybook Proposal: *The Golden Glow* meets *King's Quest* on an iPhone

**Angle:** how the game *feels*: voice, pages, odds, art, screens, sound.
**Author role:** one of three parallel design proposals; written 2026-10-08 for the `fernforager/104-boyz` project.
**Status:** complete first draft. All prose samples are original. Nothing here reproduces text or pictures from *The Golden Glow* (Benjamin Flouw, Tundra 2018). It is an homage in structure and spirit only.

---

## Summary (read this first)

1. **The whole game is a book.** Each trip is a new *volume* on a bookshelf. Planning, shopping, packing and driving are its first chapters, and every trail day after that is a chapter too. You play by turning pages. A **page** is one EGA picture, a caption line, 1 to 4 sentences of narration (300 characters at most), and either *Turn the page* or 2 to 4 choices. A 2-night trip runs about 40 to 60 pages, or 15 to 25 minutes.
2. **Voice.** A warm read-aloud narrator in the third person and past tense ("Robin looked at the river for a long time."). It sometimes speaks to the reader directly. The hiker's own first-person *field journal* is a second voice, terse and funny. Animals never talk. The narrator translates what they *seem* to say, in italics.
3. **Decisions live in the prose.** The page sets up the dilemma and the buttons finish the sentence. Risky choices carry an **odds tag**, a small pencil-margin note such as `70%`. Tapping the tag opens a **"Why these odds"** note that lists the pack items and conditions behind the number. If your knowledge is missing (no tide table, no forecast, no map), the tag shows a **range** like `40-80%` instead of a number, so the things you know matter as much as the things you carry. Critical choices get a red diamond and a short **compass-needle roll**. Players can switch to words-only or hidden odds.
4. **Consequences are told kindly and specifically.** Every outcome page puts **margin notes** beside the text (wet socks, minus one dinner, minus one hour), with the pack item that mattered underlined. Endings come in four kinds: **The End** (the trip was finished), **The End, Sooner Than Planned** (you turned back wisely), **The End, With a Little Help** (a ranger rescue, told gently), and a gold-bordered **The End of the Blank Page** (you found the glow). The **Perilous Mode** option brings back Sierra-style death pages: humorous, never gory, always fair, never caused by an animal, and each followed by a real Ranger's Note. *Turn Back a Page* plays the part of Sierra's Restore.
5. **The homage.** An old, invented field guide, *A Pocket Flora & Fauna of the Olympic Mountains*, has one entry with no picture: the **Snowlamp**, a small golden flower said to grow "above the last trees, where the snow stays, and to show itself only after the sun has gone." Someone once drew a little **fox in its margins**. Red foxes are essentially absent from the Olympic Mountains, so the fox lives only on paper. It is our cameo and the hint-giver. Real Olympic animals take the helper roles: **black bear** (the patient elder), **Roosevelt elk** (knows the crossings), **Olympic marmot** (whistles weather), **American dipper** (shows where to ford), **Canada jay** (the trickster), **raccoon** (coastal trickster), **black-tailed deer** (dusk guide), and the absent **wolf**, which appears only as a story. A **sketch mechanic** redraws the scene's vector picture with no fills, as pencil lines, into your journal. The summit-sunset-snow moment is a full-screen plate where the snow turns blue and one point of palette-cycled gold appears. Then you choose: **Sketch it, Pick it, or Just look.**
6. **Art.** The 16 standard EGA colors. AGI-style **160x168 picture with fat (wide) pixels**, scaled by whole numbers to about 373x224 pt on a portrait iPhone, with the narration underneath like a picture book. Pictures are **vector command lists plus flood fills plus dither pairs**, and they draw themselves in on screen the way AGI did. Hundreds of park places come from a **layered composer**: biome base, seeded props, landmark overlay, sprites, weather, a time-of-day palette remap within the EGA 64-color gamut, and **phased pseudo-colors** that palette-cycle water, waterfalls, surf, fire, stars and the glow. About **24 signature scenes** are drawn by hand.
7. **Phone UI.** A Sierra **status line** at the top (`Score: 31 of 120   Sound: on`), the picture, a place, time and weather caption, the narration, choices (52 pt tall, full width) and a 4-icon toolbar (Pack, Map, Guide, Book menu). Everything respects safe areas. **Tapping the picture is the KQ "look" verb.** Hotspots open Sierra-style pop-up boxes and reveal things you can sketch. Section 8 has a wireframe for every screen.
8. **Sound.** Optional PC-speaker square-wave jingles through Web Audio: page-turn tick, chapter fanfare, compass roll, a pack "bloop", animal motifs, the glow arpeggio and a Sierra-style death dirge. A KQ-style `Sound: on/off` toggle sits in the status line.
9. **Recommended defaults:** Storybook Mode (nobody dies), odds shown as numbers, pixel font with a "Book" font for accessibility, solo hiker with an optional named party of up to 3 companions.

---

## Table of contents

1. The Book Metaphor: anatomy of a volume
2. Narrative Voice and Page Structure
3. Decisions Inside the Prose, and How Odds Are Shown
4. Outcomes, Consequence Pages, The End, and Perilous (Sierra) Mode
5. The Golden Glow Homage: field guide, blank page, sketching, animal helpers, the glow
6. Art Direction: palette, resolution, vector pictures, dithers, palettes over time, cycling
7. The Scene Composition System (hundreds of places, ~24 hand-drawn)
8. iPhone Portrait Wireframes (every screen)
9. Audio
10. Tone Guide and Sample Pages
11. Appendix A: A Trip in Pages (the "Olympus with day-hike gear" storyboard)
12. Appendix B: Data shapes (page, event, scene JSON)
13. Open Questions

---

## 1. The Book Metaphor: anatomy of a volume

The user asked that playing "should feel like reading the book" and that starting a trip should "feel the same as planning a real backpacking trip." Both wishes are met with one move: **every part of the game is a page in a book, including the planning.** No screen sits outside the book. The planner is a map spread, the store is an illustrated shop page with a shopping list, and the pack is a labeled backpack spread.

### 1.1 One trip = one volume

| Book part | Game part | Notes |
|---|---|---|
| **Bookshelf** | Title screen / save slots | Each finished or in-progress trip is a spine with an auto-generated title, e.g. *The Hiker Who Forgot the Stove*. Tap a spine to reread it. |
| **Cover** | New trip start | An EGA plate of the chosen destination plus the title. The title is retitled at The End from what actually happened. |
| **Endpapers** | Park map | The illustrated park map (as in a children's book) used by the planner and the Map tab. |
| **Prologue: The Blank Page** | First book only | The old field guide and the entry with no picture (Section 5). Later volumes get a one-page "The hiker took down the old field guide again..." |
| **Chapter One: In Which a Trip Is Planned** | Ranger station planner | The Wilderness Information Center in Port Angeles: wall map, ranger, forecast board, permit. |
| **Chapter Two: In Which We Go to the Store** | Food shopping | A fictional grocery and outfitter in Port Angeles (e.g. *Mossback Mercantile*), with a shopping-list notepad. |
| **Chapter Three: In Which Everything Must Fit** | Packing | The labeled backpack spread. Ends with a *packing page*: the narrator reads the pack's contents aloud as prose. |
| **Chapter Four: In Which We Drive to the Trailhead** | Drive + trailhead | US 101, Lake Crescent, Forks or Sequim, gravel roads, a fictional diner. The last page is the trailhead's "Last look: leave anything in the car?" |
| **Chapters Five+: Day One, Day Two...** | The trip | One chapter per day. A layover day is its own chapter (*A Day of Rest*). |
| **The End** | Trip ending | Four ending kinds (Section 4). |
| **Back cover** | Trip summary | Route map, stats, "What the pack taught", score, the moral, Share. |
| **Colophon** | Credits | Includes the homage acknowledgment to Benjamin Flouw's *The Golden Glow*. |

### 1.2 Chapter titles

Chapters use the old "In Which..." style and are **retitled after they happen**. At dawn the title page offers a teaser from the plan (*Day Two: In Which the Trail Goes Up*). When the day ends, the Table of Contents (in the Journal tab) rewrites it from the day's most notable event (*Day Two: In Which a Jay Steals Lunch*). Volumes get a cover title the same way when The End arrives.

Title templates, picked by the most notable event of the day or trip:

```
In Which {Subject} {Verb-past} {Object}       -> In Which a Jay Steals Lunch
In Which the {Weather} Comes                  -> In Which the Fog Comes
In Which We Wait for the River                -> (event: waited to ford)
In Which Nothing Much Happens, Beautifully    -> (no events, good weather)
The Hiker Who {Did/Forgot X}                  -> The Hiker Who Forgot the Stove   (volume title)
{Too Much X} on the {Place}                   -> Too Much Cheese on the High Divide (volume title)
The Night of the {Animal}                     -> The Night of the Raccoons (volume title)
```

### 1.3 Pacing targets

| Trip | Pages | Minutes | Decision pages | Critical (red diamond) |
|---|---|---|---|---|
| Day hike | 12-18 | 5-8 | 3-5 | 0-1 |
| 1 night | 25-35 | 10-14 | 6-10 | 1-2 |
| 2-3 nights | 40-70 | 15-30 | 10-18 | 2-4 |
| 4-6 nights (Olympus, traverses) | 70-120 | 30-50 | 18-30 | 4-8 |

The pre-trip chapters (plan, store, pack, drive) should take **4-8 minutes** for a returning player. Presets ("the ranger's favorite trips") and "Pack like last time" keep them quick. A newcomer will happily spend longer.

### 1.4 Page numbers and the bookmark

Every page has a small centered page number in the margin, like `- 37 -`, so the trip literally reads as a book. The game **autosaves on every page turn**: a red ribbon bookmark sits on the current page. Before every critical decision, a hidden "bookmark" snapshot is kept so Perilous Mode can offer *Turn Back a Page*.

---

## 2. Narrative Voice and Page Structure

### 2.1 Voice

- **Narrator:** third person, past tense, warm, and lightly wry. Think of a grown-up reading aloud at bedtime who also knows how to read a tide table. The hiker is named by the player, with *they / she / he* pronouns (default *they*). The default name is a gentle placeholder, "the hiker", until the player picks one.
- **The narrator may speak to the reader** once or twice a chapter, and never more: *"And what do you suppose was at the very bottom of the pack?"* It is a picture-book device that also points at decisions without breaking the fourth wall too hard.
- **The field journal** is the hiker's own first-person notes, terse and funny. It appears in the Journal tab and on camp pages: *"Day 2. Elk Lake. Feet: damp. Spirits: high. Slugs counted: 9."* Two voices, one book.
- **Animals do not talk.** The narrator reports what they *seem* to say, in italics: *Not that way,* the elk seemed to say, and walked off downstream. That keeps the storybook animals of the homage while staying honest about real wildlife.
- **People do talk:** rangers, the shopkeeper, a climbing party coming down from Snow Dome, a family at Lake Crescent. All have fictional names.
- **Refrains:** each chapter closes its night page with a variation on one refrain, a classic picture-book rhythm:
  > *And far away, the river went on talking to itself.*
  >
  > *And far away, the sea went on folding and unfolding.* (coast)
  >
  > *And far away, the glacier went on being very old.* (Olympus)

### 2.2 What a page is

A **page** is the smallest unit of play:

```
PAGE = picture   (one EGA scene, composed or hand-drawn; may animate via palette cycling)
     + caption   (place, time of day, weather, elevation; one line)
     + text      (1-4 sentences; <= 300 characters target, 420 hard max with scroll)
     + margin    (0-4 margin notes: state changes, item callouts; only on outcome/camp pages)
     + action    (either "Turn the page", or 2-4 choices; choices may carry odds tags)
```

Rules of thumb:

- **One idea per page.** If a moment needs two ideas (arriving at a lake, then noticing the bear), it gets two pages. Page turns are cheap and they are the rhythm of the game.
- **The first sentence is the picture's sentence.** It names what you are looking at, so the picture and the prose agree immediately.
- **The last sentence leans toward the action.** On a decision page the last sentence sets up the choice, and the buttons finish it.
- **No walls of text.** If the text needs scrolling on an iPhone 15 (about 10 lines), it is too long.

### 2.3 Page types (templates)

| Type | Picture | Text | Action | Where |
|---|---|---|---|---|
| **Cover** | Tall plate 160x320 | Title + subtitle | Open | Start of a volume |
| **Chapter title** | Small vignette (the day's first scene) + drop cap | Chapter name + 1 line | Turn | Each day, each pre-trip chapter |
| **Trail page** | Composed scene | Narration | Turn | Segments, landmarks |
| **Decision page** | Composed scene | Setup | 2-4 choices, odds tags | Forks, fords, weather, animals, health |
| **Outcome page** | Same scene, changed (sprite pose, overlay) | Result | Turn or follow-up choices | After a choice |
| **Encounter page** | Scene + animal sprite | Meeting | Look / Sketch / Wait / Go around | Animal helpers |
| **Camp page** | Camp at current time; sky darkens as chores pass | Arrival line | **Chore grid** (2x3 tiles) | Every night |
| **Night page** | Night palette, tent, stars or rain | Night event + refrain | Turn | Every night |
| **Morning page** | Dawn palette | Weather now | Move on / Layover / Side trip / Turn back | Every morning |
| **Field guide page** | Plate area: sketch or blank | Entry text | Close | From Guide tab or after a sketch |
| **Full-bleed plate** | Tall plate 160x320, text in a Sierra pop-up box | 1-2 sentences | Tap | ~8 signature moments (summit, glow, first view of Olympus) |
| **The End** | Closing plate | Ending line | Back cover | End of trip |
| **Back cover** | Map with dotted route | Summary | Plan Another / Reread / Share | After The End |
| **Perilous death page** | Scene grayed by palette remap | Gentle-humor epitaph + Ranger's Note | Turn Back a Page / Restart / Quit | Perilous Mode only |

### 2.4 Page turns

- **Tap "Turn the page ▸"** (a 52 pt button) or **swipe left** anywhere on the text. **Swipe right** rereads earlier pages of the current chapter. These are read-only: choices on past pages show which one you made, with a pencil tick.
- **Transition:** the text column slides 12 pt and fades (120 ms). A new place's picture **draws itself in** by replaying its vector commands over about 0.8 s: outlines first, then fills flooding in, just as AGI pictures drew on a slow PC. The same place or an outcome page uses an instant swap or an SCI-style horizontal wipe. Settings: *Draw-in / Wipe / Instant*. A tap skips the draw-in.
- **Sound:** a two-note square-wave tick on each turn (Section 9).
- **No timers, ever.** The book waits for the reader.

### 2.5 The pre-trip chapters feel like a book too

- **Planning** happens at the **Wilderness Information Center (WIC)** in Port Angeles. The first page is a picture of the counter, the big wall map and a ranger (fictional name, e.g. Ranger Ines Calder). The planner itself is the **endpaper map spread**. Your itinerary is written onto a **permit page** that looks like a real form with handwriting-style pixel fields. A tap stamps the permit (a rubber-stamp *thunk* sound). The forecast is read aloud by the ranger: *"Partly sunny. A forty percent chance of showers Thursday. Thursday is always the one with showers."*
- **Shopping** is an illustrated shop page. A **shopping list on a notepad** checks itself off as meals are covered (Breakfast 2/2, Lunch 3/3, Dinner 1/2...). The shopkeeper makes Sierra-style remarks about silly purchases (canned beans: *"Those'll be heavy, friend. Beans are mostly can."*).
- **Packing** is the **labeled backpack spread** (homage to the book's labeled backpack-contents spread, drawn our own way). Items lie around the open pack with leader-line labels. As items go in, the pack's silhouette **floods with color** using the same flood-fill routine as the scenes, so the volume meter is literally a fill. A hanging spring scale shows weight with a storybook adjective (*light as a jay / like carrying a sleepy cub / like carrying a whole elk calf*). When you finish, the narrator reads the pack aloud:
  > *Into the pack went: one small green tent, a sleeping bag that still smelled faintly of last summer, a pot that had seen better days and better soups, two pairs of wool socks, one pair of cotton socks (we will speak of these later), and a great deal of cheese.*
- **Driving** is a short chapter of road pages: the car sprite on US 101 with Lake Crescent's palette-cycled water, an optional diner stop, a last-chance store in Forks or Sequim, a gravel road. The final page is the **trailhead**: a sign, a kiosk and a *Last look* list where you can leave items in the car, which is exactly what real backpackers do.

### 2.6 Typography as book design

- **Drop cap** at the start of each chapter: the first letter drawn 3x in an EGA color (green in forest, blue at lakes, white on snow, gold on the glow chapter).
- **Ornaments:** a small pixel fleuron between scenes, and a different one per biome (fern, fir, wave, snowflake).
- **Dotted-underlined words** (*krummholz, tarn, scree, nurse log, alpenglow, cairn*) open a small field-guide glossary card when tapped. Real vocabulary, gently taught.
- **Page color follows the clock:** white paper by day, dark pages (black with light-gray text, as in KQ's night screens) for night pages. A setting can lock the paper to light or dark.


---

## 3. Decisions Inside the Prose, and How Odds Are Shown

### 3.1 Decisions are sentences the player finishes

The narration builds toward the dilemma, and the choice labels read as the end of the sentence. Labels are verbs, 28 characters or fewer, with no question marks.

> *The trail went down to the gravel and simply stopped. Beyond it the Hoh had split into three gray ropes of meltwater, and the far bank looked farther than it had a minute ago. Robin...*
>
> `[ Wade across now           65% ]`
> `[ Camp here, cross at dawn  sure ]`
> `[ Turn back toward the car  sure ]`

Choices come in four flavors, and each is shown differently:

| Flavor | Shown as | Example |
|---|---|---|
| **Sure** (no risk, maybe a cost) | `sure` tag, plus cost icons (clock, food, morale) | *Camp here, cross at dawn* · clock: overnight |
| **Risky** | `%` odds tag | *Wade across now* · 65% |
| **Critical** (can end the trip, or kill in Perilous Mode) | `%` tag plus a **red diamond ♦** and the compass roll | *Cross the Blue Glacier unroped* ♦ 30% |
| **Flavor** (no mechanical stakes) | No tag | *Count the banana slugs* |

The rule is: **every risky choice shows odds, and only critical ones get the diamond and the roll.** That answers the user's "maybe we put a % chance on all decisions or critical ones" with *both, presented differently*.

### 3.2 Three ways to present odds (and the recommendation)

**Option A: "Pencil in the margin" (numbers).**
Each risky choice has a small tag at its right edge, styled as a penciled note on the paper: `65%`. Tapping the tag (or long-pressing the button) opens the **Why these odds** note, a field-guide-style card that lists the factors:

```
┌─ Why these odds ─────────────────────────┐
│ Wade across the Hoh braids               │
│                                          │
│   River at this hour ............  70%   │
│ + Trekking poles (in pack) ......  +10   │
│ + You watched where the dipper           │
│   crossed .......................   +5   │
│ - Afternoon snowmelt (July) .....  -15   │
│ - Pack is heavy (49 lb) .........   -5   │
│ ───────────────────────────────────────  │
│   Chance of crossing cleanly ....  65%   │
│                                          │
│ If it goes badly: a cold swim, wet gear, │
│ and something might float away.          │
│                  [ Close ]               │
└──────────────────────────────────────────┘
```
*Pros:* honest, educational, and it makes the pack-combination system **legible**. You can see that the trekking poles mattered. *Cons:* numbers on every button can make it feel like a spreadsheet.

**Option B: "The hiker's hunch" (words).**
No numbers. The choice carries a hunch phrase drawn from fixed bands, and the narrator echoes it in the prose:

| Probability | Hunch phrase |
|---|---|
| 95%+ | *easy* |
| 80-94% | *very likely* |
| 60-79% | *likely* |
| 40-59% | *a coin toss* |
| 20-39% | *unlikely* |
| < 20% | *foolish* |

*Pros:* the purest book feel. *Cons:* players can't feel the difference a +10 makes, so packing loses its teeth.

**Option C: "The compass roll" (shown roll).**
After a risky choice, a compass rose fills the picture area. Its dial is painted with a green arc (success, sized to *p*), a yellow arc (mishap) and a red arc (serious). The needle spins for about 1.2 s with PC-speaker ticks and lands. It is transparent like Oregon Trail or a tabletop roll, and it builds great tension. *Cons:* tiresome if it happens on every choice.

**Recommendation: A + C-lite, with B as a setting.**
- Numbers are shown on every risky choice (A), rounded to 5%.
- The **compass roll plays only on critical (♦) choices** (C). Ordinary risky choices resolve straight to the outcome page.
- The prose carries the hunch naturally (B) whether or not numbers are shown: *"It looked likely enough."*
- Setting **Odds: Numbers (default) / Words / Hidden.** Words mode replaces `%` with the hunch phrase. Hidden mode is for purists who want KQ-style uncertainty.

### 3.3 Fuzzy odds: knowledge narrows the range

This is the most distinctive idea in this proposal. **The less the hiker knows, the wider the odds tag.**

- Each risky event lists the **knowledge sources** that sharpen it: a map, a tide table, the ranger's forecast, the field guide, having watched the dipper, asking a hiker coming the other way, or having done this trip before.
- Every missing source adds uncertainty *u*. The tag then shows a range: `40-80%` instead of `60%`.
- The roll always uses the **true** probability, so the display is honest. It is just blurry when you are ignorant.
- With no knowledge at all, the tag reads `??`, which is itself a strong hint.

```
p_true  = clamp(base + Σ modifiers, 0.03, 0.97)       // never 0, never 100 on risky choices
u       = Σ missing_knowledge_weights                  // e.g. no tide table: 0.25; no forecast: 0.15
shown   = (u < 0.05) ? round5(p_true)
        : round5(max(0,p_true-u)) + "-" + round5(min(1,p_true+u)) + "%"
        // if u >= 0.40 -> "??"
```

On the coast this makes the **tide table** an item of real power, and nicely, it weighs almost nothing. It also makes asking the ranger at the WIC (a planning action) visibly pay off on Day 3. This is the "dungeon crawler" feeling the user wants: scouting reduces the fog of war.

### 3.4 Outcome tiers per roll

Each risky choice resolves to one of four tiers:

```
r = random()
if      r < p                           -> SUCCESS   (the choice goes as hoped)
else if r < p + (1-p) * mishapShare     -> MISHAP    (wet, slow, lost a small thing)     mishapShare ≈ 0.7
else                                    -> SERIOUS   (injury, soaked + cold, lost food, forced retreat)
   SERIOUS + event.lethal + PerilousMode + second roll < lethalShare(≈0.35) -> DEATH PAGE
```

Before choosing, players can see what failure means. The **"If it goes badly:"** line sits in the Why note, and a short version appears under the button when a choice is pressed and held. **No surprise catastrophes:** a choice that can end the trip is always marked ♦.

### 3.5 The pack is the main source of modifiers

The user wants "lots and lots of potential outcomes" driven by "the various combinations of things you can and can't fit in pack." In feel terms, three rules make this satisfying instead of random:

1. **Chekhov's pack.** Every item in the gear catalog has at least **two story moments** where having it, lacking it, or its *state* (wet, lost, strapped outside, used up) changes a page. The narrator *notices*: *"The rain came sideways. It was a very good moment to own a rain jacket, and Robin did."* or *"...and Robin did not."*
2. **Combinations, not singletons.** Many modifiers check pairs or sets. *Stove + fuel + lighter* means hot dinner. *Stove + fuel* without a lighter gives a funny page and maybe a kind neighbor. *Rope + crampons + ice axe + helmet + partner* is glacier-ready. *Camp sandals + trekking poles* ford well. *Food left out + Canada jay* is a theft. *Cotton socks + ford + cold night* means blisters and misery.
3. **The back cover's "What the pack taught" list** names what you used every day, what you never used, and what you wished you had. That lesson flows straight into the next volume's packing chapter, and the ranger and the margin fox remember it.

Modifier factors are shown in the Why note as **pack-item icons** that light up, so the player *sees* the pack working.

---

## 4. Outcomes, Consequence Pages, The End, and Perilous (Sierra) Mode

### 4.1 How outcomes are told

**Good outcomes** are told briefly and specifically, with a small sensory reward. The picture changes too: the hiker sprite is now on the far bank. Sometimes a good outcome unlocks a sketch opportunity or a Score point. Success should feel *earned by the plan* where it was: *"The poles found the bottom, and the bottom held."*

**Mishaps** are told warmly, with a concrete cost and no scolding. The cause is named gently, so the lesson lands, and a little humor softens it:
> *The jay was gone before Robin turned around, and so was the tortilla. Somewhere in a hemlock, a very small bird was having a very large lunch.*

**Serious outcomes** are told plainly and kindly. Then the player always gets **agency**: a follow-up decision page (push on, rest, turn back, signal for help), never a dead end.

**Six rules for bad news:**
1. Tie it to a cause the player can change next time (*"If only there had been something warm in the pack."*).
2. Never mock the player. Gentle humor is aimed at the situation, the weather or the jay.
3. Show it in the picture: a rain overlay, the hiker sitting, a wet-sock sprite pose, a missing pot.
4. Write the state changes in the **margin**, not the prose (see below).
5. Follow serious news with a choice.
6. Turning back is **never** framed as failure. It is wisdom, and it has its own honorable ending.

### 4.2 Consequence pages and margin notes

Outcome pages carry **margin notes**, little penciled annotations in the page margin with pixel icons. They keep the prose clean while staying Oregon-Trail-clear:

```
  ✎ Socks: wet (2 of 3 pairs)
  ✎ Food: -1 dinner (the jay)
  ✎ Time: -1 hr
  ✎ Morale: ♥♥♥♡♡
```

An **ornament color** on the outcome page signals severity at a glance:

| Severity | Ornament | Border | Example |
|---|---|---|---|
| 0 Good | green fern | none | Clean ford; elk sighting |
| 1 Mishap | brown twig | none | Wet socks; lost spoon; jay theft |
| 2 Setback | brown twig | thin brown | Blister; cold night; late arrival; minus 2 hours |
| 3 Serious | red diamond ♦ | thin red | Sprained ankle; soaked and shivering; bear got the food |
| 4 Trip-ending | red diamond ♦ | double red | Must turn back / ranger help |
| ★ Glow | gold star | gold, palette-cycled | The Snowlamp |

### 4.3 Health and morale shown the storybook way

Instead of a numeric HP bar, the hiker has **four simple conditions**, shown as small pixel icons on the caption line and in the Pack tab. Each has three states:

| Condition | Icons (good → bad) | Fed by |
|---|---|---|
| **Warm** | ☀ → ~ → ❄ | Layers, rain gear, wet socks, sleeping bag rating, weather |
| **Fed** | ●●● → ●○○ | Meals eaten, calories, stove working |
| **Feet** | 👣 → blister → limp | Socks, shoes, miles, fords, pack weight |
| **Spirits** | ♥♥♥♥♥ | Views, sketches, good dinners, rain, mishaps, companions |

(The emoji above are placeholders in this document. In game, all icons are 8x8 EGA pixel glyphs.)

Two "bad" conditions at once trigger a **ranger-voice nudge** page, *"It might be time to think about the way home,"* which offers **Turn back** as a sure choice. Three trigger the trip-ending sequence in Storybook Mode.

### 4.4 The four (plus one) endings

| Ending | Trigger | Final plate | Tone |
|---|---|---|---|
| **The End** | Trip completed as planned (or better) | The car at the trailhead at golden hour, boots on the dashboard | Content, a little tired |
| **The End, Sooner Than Planned** | Player chose to turn back (any reason) | The trailhead sign, rain or shine | Proud, honest, *"The mountain will keep."* |
| **The End, With a Little Help** | Severity-4 event (injury, hypothermia, lost) in Storybook Mode | The Olympus Guard Station porch, or a helicopter as a small dot over the valley | Gentle, grateful, a little funny, never frightening |
| **The End of the Blank Page** | Found the Snowlamp (any ending above may combine with it) | Gold-bordered plate of the sketch | Quiet wonder |
| **The End (Rather Abruptly)** | Perilous Mode death | Grayed scene | Sierra deadpan, kind |

**Ranger rescue, told gently.** In Storybook Mode the worst case is help arriving. Who helps depends on what you packed:
- **Satellite messenger in pack:** you send the message yourself, and help is certain. *"Robin pressed the button, and somewhere very far away a satellite thought about it, and then said yes."*
- **No messenger, on a busy trail:** another hiker or a backcountry ranger comes along (chance by trail traffic, season and time).
- **No messenger, remote trail:** you wait out the night in the best shelter your pack allows. A search ranger finds you the next day (the margin fox gives a quiet hint that a *trip plan left with someone* matters, which is a planning option on the permit page).

A rescue page sample:
> *The ranger's name was Ines, and she had a thermos, which is the second-best thing a person can have on a cold mountain. The first-best thing is someone who knows where you are.*

### 4.5 The back cover (trip summary)

After The End plate, swipe to the **back cover**:

```
  THE HIKER WHO FORGOT THE STOVE
  a trip of 2 nights on the High Divide

  [ map with the route as a dotted line, camps as tiny tents ]

  Miles walked ........ 19.1     Highest point ... 5,474 ft
  Nights out .......... 2        Pages ........... 52
  Sketches made ....... 4        Close calls ..... 1
  Score ............... 88 of 120

  WHAT THE PACK TAUGHT
   Used every day:  wool socks, rain jacket, the old field guide
   Never used:      the ukulele (the marmots were not impressed anyway)
   Wished for:      a lighter

  AND SO THE HIKER LEARNED
   "that a cold dinner is still a dinner, but a lighter weighs one ounce."

  [ Plan Another Trip ]   [ Reread ]   [ Share the Cover ]
```

**Share the Cover** renders the cover (auto title plus a 160x168 EGA picture plus the moral) as a PNG through the Web Share API, so friends can trade covers. This is a lightweight social hook that needs no server.

### 4.6 Perilous Mode (optional Sierra deaths)

**Recommendation:** default to **Storybook Mode** (nobody dies). Offer **Perilous Mode** on the New Book page as a checkbox with a small red diamond: *"Perilous: the old Sierra rules. Mistakes can end the story for good. (You can always turn back a page.)"*

**Principles for death pages:**
1. **Fair:** a death can only follow a ♦ choice whose odds were shown (or whose hunch was *unlikely* or *foolish* in Words mode), and only after at least one in-story warning.
2. **Never caused by an animal.** Bears, elk and cougars in this book are neighbors, not monsters. Deaths come from the hiker's own hubris against weather, water, ice, tide and gravity.
3. **Never gory, never about real tragedies.** The camera cuts away. Humor is aimed at the hiker's choice (often at a specific item they skipped), in the classic Sierra deadpan.
4. **Always teach.** Under the epitaph, a **Ranger's Note** gives one real safety fact in plain words.
5. **Always offer Turn Back a Page** (restore to the bookmark before the ♦ choice), **Restart the Trip** (back to the packing chapter, keeping your plan), or **Close the Book**.

**Death page layout:** the scene picture remapped to grays (all 16 slots mapped to 0/8/7/15), a Sierra pop-up box over it, and the dirge (Section 9).

**Sample death pages (original):**

> **The River Was in a Hurry**
> *The Hoh was on its way to the Pacific, and it took Robin along for company. Rivers in July are fullest in the afternoon, when the sun has spent all day melting the mountain. Thank you for hiking with us. Better luck on the next trip.*
> **Ranger's Note:** Snowmelt rivers run highest in the late afternoon. Cross early in the morning, unbuckle your hip belt, face upstream, and if it looks too deep, it is.

> **The Pacific Read the Tide Table For You**
> *Robin had a tide table. Robin did not read the tide table. The headland, which has been reading tide tables for ten thousand years, was not surprised.*
> **Ranger's Note:** Some Olympic coast headlands can only be rounded at low tide. Carry a tide table, know your tide height for each point, and use the overland trails (look for the round red-and-black markers).

> **Cotton Kills (Pajamas Excepted)**
> *Cotton is a lovely fabric for pajamas and a terrible one for an October night on the High Divide. The marmots held a short and respectful whistle.*
> **Ranger's Note:** Wet cotton stops keeping you warm. Wool or synthetic layers, a warm hat and a dry set of sleep clothes make cold nights safe.

> **The Glacier Keeps Things**
> *The Blue Glacier keeps all sorts of things: ice older than anyone's grandmother, a surprising number of sunglasses, and, as of this afternoon, one hiker without a rope.*
> **Ranger's Note:** Glaciers hide crevasses under snow. Travel on them roped to a team, with crampons, an ice axe and the training to use them, or enjoy them from the moraine.

> **Darkness Arrived on Schedule**
> *The sun set at 6:41, exactly as the almanac had promised. Robin, who had no headlamp and three more miles, found this very unfair of the sun.*
> **Ranger's Note:** Days get short fast in fall. A headlamp with fresh batteries is one of the Ten Essentials for a reason.

The Perilous Mode book cover gets a small red diamond ribbon. Deaths still produce a back cover (*"The Hiker Who Did Not Read the Tide Table"*), because Sierra fans want to share those too.

### 4.7 Score line

The KQ status line reads `Score: 31 of 120     Sound: on`. The maximum is **computed per trip** from its itinerary (more days and more possibilities make a higher max), so the player sees the potential. Points are for **good practice and curiosity**, never for speed:

| Points | For |
|---|---|
| +1 | Each new thing *looked at* (picture hotspot) |
| +2 | Each sketch |
| +3 | Each wise "sure" choice in a dangerous moment (waiting out the river, turning back in a storm) |
| +2 | Leave No Trace acts (packing out trash, camping on durable surfaces, storing food) |
| +5 | Each new Field Guide entry |
| +10 | Reaching a planned destination |
| +20 | The Snowlamp (sketched or seen; picking it gives the points but not the gold page) |

**Optional wink:** the Field Guide has exactly **104 entries** (Section 5), with *No. 104* being the blank page, and its counter reads `Field Guide: 23 of 104`. That is a quiet nod to the repo name that assumes nothing about what "104" means. Drop it if the creator prefers.

---

## 5. The Golden Glow Homage

### 5.0 What we borrow, and what we don't

We borrow the *shape* of the book: a collector, an old botany book with one picture missing, packing a backpack (shown as a labeled spread), a mountain climb with animal neighbors, a summit with no flowers, a sunset, a golden discovery in the snow, and the choice to draw it rather than take it. We do **not** borrow its text, its illustrations, its character designs or its plant's name. Our protagonist is the player's own hiker. Our plant is the **Snowlamp**. All prose in this document is original.

### 5.1 The old field guide, and its blank page

**The object.** *A Pocket Flora & Fauna of the Olympic Mountains*, an invented, long-out-of-print field guide. The hiker found it in a box at a library sale in Port Angeles. It has hand-colored plates, pencil notes in the margins from a previous owner who signed only with the initials **"E.W."**, and a small **fox doodled in the corner of many pages**.

**The blank page.** Near the back, in the "Rare & Uncertain" section:

```
  No. 104   THE SNOWLAMP
  (no Latin name given)

  ┌──────────────────────────────┐
  │                              │
  │      [ no plate. ]           │
  │                              │
  └──────────────────────────────┘

  A small golden flower, reported by a very few
  travelers, growing above the last trees where the
  snow stays into summer. All accounts agree it is
  seen only after the sun has gone.

  No specimen has been kept.

  (margin, pencil, E.W.:)  "Don't look for it. Wait for it."
```

**The prologue (first volume only), about 6 pages:**
1. A rainy evening and the hiker's kitchen table. The old book falls open.
2. The hiker leafs through trees, flowers, birds and the marmot. Each entry has a plate, *except one*.
3. The blank page, shown full-screen.
4. The fox in the margin (a two-frame doodle animation) seems to point at the window, toward the mountains. *"There are no foxes in the Olympic Mountains,"* the narrator admits. *"This one has always lived on paper."*
5. The hiker decides to go and look. The narrator: *"And that, more or less, is how every good trip begins: with a page that is missing something."*
6. Turn the page: *Chapter One: In Which a Trip Is Planned.*

### 5.2 The Field Guide as the game's lasting collection (104 entries)

The field guide is the **meta-progression across volumes**. Entries begin with a printed plate, a printed **"plate missing"** box, or a *"seen but not drawn"* state. Players fill them by **seeing** (looking at a hotspot) and **sketching**.

| Section | Entries | Examples (all real Olympic species/features) |
|---|---|---|
| Trees | 12 | Sitka spruce, western redcedar, western hemlock, Douglas-fir, bigleaf maple (with club moss), vine maple, red alder, Pacific silver fir, subalpine fir, mountain hemlock, Alaska yellow-cedar, Pacific yew |
| Flowers & small plants | 24 | Avalanche lily, glacier lily, Piper's bellflower (endemic), Flett's violet (endemic), magenta paintbrush, broadleaf lupine, pink mountain heather, white heather, spreading phlox, Sitka valerian, shooting star, columbine, tiger lily, bunchberry, queen's cup, trillium, vanilla leaf, Oregon oxalis, twinflower, skunk cabbage, devil's club, salmonberry, red huckleberry, Olympic Mountain groundsel (endemic) |
| Ferns, mosses, lichens, fungi | 12 | Sword fern, licorice fern, deer fern, maidenhair fern, step moss, club moss, lettuce lungwort, old man's beard, chanterelle, coral fungus, dog vomit slime mold, snow algae ("watermelon snow") |
| Birds | 14 | American dipper, Pacific wren, varied thrush, Canada jay, Steller's jay, common raven, bald eagle, sooty grouse, gray-crowned rosy-finch, belted kingfisher, marbled murrelet, tufted puffin, pileated woodpecker, northern spotted owl (heard only) |
| Mammals | 16 | Olympic marmot (endemic), Roosevelt elk, American black bear, black-tailed deer, cougar (tracks only), Douglas squirrel, Olympic chipmunk, mountain beaver, raccoon, river otter, fisher (reintroduced), snowshoe hare, bobcat, harbor seal, sea otter, gray wolf (*absent, see below*) |
| Water & shore creatures | 12 | Coho salmon, steelhead, rough-skinned newt, Olympic torrent salamander (endemic), banana slug, ochre sea star, giant green anemone, gooseneck barnacle, purple sea urchin, gray whale (spout), hermit crab, bull kelp |
| Sky & weather | 6 | Alpenglow, a lenticular cloud on Olympus, fogbow, the Milky Way, a meteor, rain shadow |
| Curiosities | 7 | Nurse log, krummholz, sea stack, glacial erratic, tarn, moraine, cairn |
| **Rare & Uncertain** | **1** | **No. 104, The Snowlamp** |
| **Total** | **104** | |

Entry text is original, 1-3 sentences of lore, gentle and true: *"Olympic marmot. Found in these mountains and nowhere else on Earth. Whistles when worried, which is often."*

**The absent wolf.** The Gray wolf entry has a printed plate but a pencil note from E.W.: *"Not seen here since before my time."* Wolves were extirpated from the Olympic Peninsula in the early 20th century. In-game the wolf appears **only as a story**: the ranger tells it at the WIC, and once, in fog high on a pass, the narrator says *"the wind made a sound that was almost, but not quite, a howl."* It can never be "seen". The entry is completed by *hearing the story*. This is a respectful nod to the homage's Wolf that stays true to the park.

**The fox in the margin.** The NPS notes that red foxes never occurred on the Olympic Peninsula, which is part of its "island" mammal story. So our fox lives **only on paper**: as E.W.'s doodle, as the **hint-giver**, and on The End plate, where it sits on the closed book. It never appears in a park scene. That is the cameo, and it's quietly educational.

### 5.3 The sketching mechanic

Sketching is the game's **verb of attention**. It is the heart of the homage, and it should be the most pleasurable small interaction in the game.

**What you need:** the **journal and pencil** in your pack (6 oz). **Colored pencils** (+3 oz) make color sketches. The **old field guide** itself (1 lb 4 oz, heavy!) lets you *identify* what you draw on the spot. Leave it home and your sketches are filed as "unidentified" until you get home, where they're matched on the back cover. So the homage itself becomes a packing trade-off.

**When:** any page with a sketchable hotspot (an animal sprite, a flower in the meadow layer, a landmark) shows a pencil icon in the caption line. On camp pages, *Sketch* is one of the chores.

**How it feels (touch only):**
1. Tap **Sketch** (or tap the pencil icon on a hotspot). The picture **zooms 2x** on the subject. The zoom is a crop of the same 160x168 buffer, so the pixels get chunkier.
2. **Press and hold** on the picture. While you hold, the subject redraws **as line work only**: the same vector commands with fills switched off, in dark gray (8) on white (15) paper. Lines appear one by one with a soft scratch tick.
3. Release when you like. **A full hold (about 2.5 s) gives a "fine" sketch. Releasing early gives a "quick" sketch** with fewer lines. Animals may move if you're slow (a marmot ducks into its burrow, and its sketch freezes at that moment, which is charming rather than a failure).
4. The sketch slides into the journal with a page-flap sound and a margin note: `✎ Sketched: Olympic marmot (fine). Field Guide +1`.
5. It costs **game time** (about 20-40 minutes, so the sky palette moves a notch). On a long day that is a small, real trade-off.

**Why this is cheap to build:** because every picture is vector commands plus fills, a "sketch" is just a second render mode, *lines only, one color, with a slight random jitter per line endpoint (±1 px)* so it looks hand-drawn. Every place and every animal in the game is automatically sketchable with no extra art.

**Sketch quality** shows on the field guide plate (quick, fair or fine). Fine sketches of all 12 trees earns a small bonus page: *"A Forest, Drawn."*

### 5.4 Animal helpers mapped to real Olympic wildlife

Animals advise **by behavior**, and the narrator translates. Each helper gives a concrete mechanical benefit when the player *pays attention* (looks, waits, sketches), which rewards slowing down, the book's real theme.

| Book role (homage) | Olympic animal | Where | What it "says" | Mechanic |
|---|---|---|---|---|
| The wise, unhurried Bear | **American black bear** | Huckleberry slopes: High Divide, Seven Lakes, Hoh Lake, Royal Basin; Aug-Sept peak | *There is enough for everyone, if everyone keeps their food to themselves.* | Choice: wait / detour / back away. Waiting costs time and gives a sketch. Good food storage means the bear passes camp at night "like a large, slow thought" and nothing is lost. |
| The guide who knows the way | **Roosevelt elk** (an old cow elk) | River meadows: Hoh, Queets, Quinault, Elwha | *Not there. Here.* | Watch where the herd crosses: ford odds +10%. September-October rut: bulls bugle, and the choice is to give them a wide berth (time) or push past (risk). |
| The weather prophet | **Olympic marmot** (endemic) | Meadows and talus: High Divide, Appleton Pass, Hurricane Ridge, Royal Basin | *Two whistles: weather coming.* | Looking at the marmot sharpens the forecast (narrows fuzzy odds for the next weather event) and hints *pitch the tent before 4.* |
| The river reader | **American dipper** | Fast creeks and fords | *Where I walk, the water is honest.* | Watching it: +5% at the next ford, plus knowledge (narrows the range). |
| The trickster | **Canada jay** ("camp robber") | Subalpine camps | *Is that for me?* | Tests whether you feed wildlife. Choice: shoo / feed (a Leave No Trace penalty and the jays follow you) / ignore. Steals unattended food. |
| The coastal trickster | **Raccoon** | Coast camps: Shi Shi, Rialto, Third Beach, Ozette | *What's in the bag?* | Without a canister on the coast, a night raid is likely: food lost, plus a comic page. |
| The dusk guide | **Black-tailed deer** (a doe) | Camps at dusk | *This way, before dark.* | If you're late and have no headlamp, following the doe's trail is a sure choice back to camp. |
| The town crier | **Douglas squirrel** | Forest | *Someone's coming!* | A scold announces a ranger or hiker before they arrive. Flavor and foreshadowing. |
| The voice in the fog | **Varied thrush** | Fog, forest | *One long note, then silence.* | Sound-only. In fog, "follow the thrush" at a junction gives a riddle-like correct hint. |
| The early bell | **Pacific wren** | Rain forest dawns | A song far too big for its body | An early start: +1 hr of daylight on day pages. |
| The quiet watcher | **Cougar** | Anywhere, almost never seen | *Nothing; only tracks.* | Tracks in mud become a journal entry. A rare tense page: stand tall and back away (always survivable; never a death, even in Perilous Mode). |
| The comeback story | **Fisher** (reintroduced) | Forest | *I'm back.* | A rare sighting. The ranger tells its return story. A Field Guide rarity. |
| The absent friend | **Gray wolf** | Only in story | *...* | See 5.2. |
| The paper companion | **The margin fox** | Only in the field guide | Points, shrugs, naps | The hint system (5.6). |

### 5.5 The summit, the sunset, and the Snowlamp

**Where it can appear.** Any night spent at a **high camp near lingering snow**. Each node in the region data gets a `snowlamp` weight. Candidates:

| Place | Notes |
|---|---|
| Glacier Meadows / Blue Glacier lateral moraine (Hoh) | The Olympus approach. The classic. A walk up the moraine at sunset to look at the Blue Glacier. |
| Snow Dome / Caltech Rocks (climbers) | Requires glacier gear and a roped party. The "true summit" version: the highest odds, the most beautiful plate. |
| High Divide, Bogachiel Peak, Heart Lake (Sol Duc) | Early-season snowfields, with Olympus across the Hoh valley. |
| Seven Lakes Basin (Lunch Lake snowfields) | Early season. |
| Royal Basin upper basin (tarn and moraine below Mount Deception) | The user's must-have. Snow lingers late here. |
| Grand Valley / Grand Pass | Snowfields into summer. |
| Appleton Pass / Oyster Lake | |
| Lake Constance / Avalanche Canyon | Steep, hard to reach. |
| Anderson Pass area | The vanishing Anderson Glacier, a poignant note. |
| Hurricane Hill (day hike only) | Only if you stay for sunset with a headlamp for the walk down. Small odds. |

**Conditions and odds** (this is a storybook, so anyone who plans for it should be able to find it):

```
qualifies = night at a snowlamp node AND snow present (month, elevation, snow year)
P_glow    = W_clear × ( 0.55
                       + 0.15 [stayed out through the whole sunset; needs a warm layer]
                       + 0.10 [chose "turn off your headlamp" in the blue hour]
                       + 0.10 [this is your 2nd+ night at this place: a layover!]
                       + 0.05 [old field guide in pack]
                       + node.snowlamp_bonus )            // Snow Dome +0.15, Royal Basin +0.05, ...
W_clear   = 1.0 clear, 0.6 partly cloudy, 0.1 overcast, 0 rain/fog
Pity rule: after 3 qualifying evenings without seeing it (across volumes), the next qualifying clear evening is certain.
```

This ties the homage to the user's planning ideas. **A layover day at a high camp doubles your chances**, which is a beautiful reason to plan one. **A warm jacket** lets you stay out for sunset. **A headlamp** is needed afterward, *and* turning it off is a choice. The ranger at the WIC hints at it if you ask about snowfields: *"If you're looking for something that only shows at dusk, camp high and stay up late."*

**The sequence (6-8 pages, the emotional peak of the game):**

1. **Arrival page** (afternoon, high camp). Echoing the book's structure in our own words: *"There were no flowers here. There was stone, and snow, and a wind that had come a long way to say nothing in particular."*
2. **Camp chores** as usual. A new tile appears: **Watch the sunset** (it needs a warm layer, or you last only 10 minutes and the odds drop).
3. **Sunset page.** The palette steps through *dusk*: the sky goes violet and orange, and the snow goes pink (alpenglow). Mount Olympus, Mount Deception or the Bailey Range, whichever applies, burns at its top edge.
4. **Blue hour page.** The palette moves to *blue hour*: the snow turns light blue (slot 15 → #AAAAFF), and the sky deepens. A choice: **Turn off the headlamp** / Keep it on / Go to bed.
5. **The glow plate** (full-bleed, 160x320). One pixel cluster of pseudo-color 19 in the snow begins to cycle: brown → orange → yellow → white → yellow... radiating outward in phased rings. Over three seconds the glow grows from 1 pixel to a 5x5 star of gold, the only warm color left in the picture. A Sierra pop-up box:
   > *And there, where the snow was bluest, something small was shining. Not like a lamp. More like a lamp remembering.*
6. **The choice page** (three choices, no odds; this is not a test):
   - `[ Sketch it ]`
   - `[ Pick it to take home ]`
   - `[ Just look ]`
   - (If a camera or phone-camera item is "in use": `[ Take a photograph ]`, which comes out as a perfectly exposed photo of blue snow and nothing else. *"Some things don't photograph. The camera did its best."* Then the three choices return.)
7. **Outcome pages:**
   - **Sketch it.** The hold-to-sketch interaction, but the lines are drawn in **gold (14)**, the only colored lines the pencil ever makes, even without colored pencils. Field Guide No. 104 fills in. *"Robin drew it twice, to be sure. By the time the second drawing was finished, the flower had gone back to being a small, ordinary-looking thing in the snow, and that seemed right too."* Ending: **The End of the Blank Page** (gold border).
   - **Pick it.** No scolding. The flower goes gray in the hiker's hand by the time they reach the tent. *"By morning it was a small brown curl, like a page that had been left in the rain. Some things only shine where they grow."* The Field Guide gets a pressed brown petal taped where the plate should be, plus the note *"Picked, faded."* Score points are given, but not the gold page. You can find it again on another trip and choose differently.
   - **Just look.** *"Robin did not draw it, and did not take it. Robin only looked, until it was entirely dark and the stars came out to look too."* The Field Guide page stays blank but gets a single gold star and the word *"Seen."* This is treated as a full, equal success (gold border), for players who understand.
8. **Night page** with the refrain: *"And far away, the glacier went on being very old."*

**The afterword** (on the back cover after finding it):
> *The high Olympics really do hold flowers found nowhere else on Earth: a golden groundsel among the stones, a blue bellflower tucked into cracks in the rock, a violet that grows in the talus. Whether the snowlamp is one of these, or something else, the old book does not say.*

The researchers flagged the real endemic **Olympic Mountain groundsel** (*Senecio neowebsteri*) and the **glacier lily** as golden analogs. This afterword honors them without claiming the Snowlamp *is* one of them.

### 5.6 The margin fox: hints without a tutorial

The fox doodle lives in the page margin of planning screens, the field guide and the pack spread. It gives **nonverbal hints** through 2-3 frame doodle animations:
- **Points** at the rain jacket in the pack spread when the forecast says showers and the jacket isn't packed.
- **Shivers** when no warm layer is packed for a high camp in September.
- **Taps its wrist** when the planned Day 1 is longer than 12 miles with 3,000+ ft of gain.
- **Holds a tiny tide table** on the coast planner when no tide table is packed.
- **Sleeps** (Zzz) when everything is fine. This is the best feedback in the game.

Tapping the fox turns its gesture into one line of narrator text. A setting turns the fox off (purist mode) or makes it *louder* (beginner mode). On the very first packing chapter, the fox is the whole tutorial.

---

## 6. Art Direction

### 6.1 The palette: the 16 EGA colors

All pictures, sprites and UI chrome use exactly these 16 colors. The UI paper is EGA white (15), text is black (0), and borders are dark red (4) like AGI message boxes.

| # | Name | Hex | Typical use in the park |
|---|---|---|---|
| 0 | Black | `#000000` | Outlines, night, text |
| 1 | Blue | `#0000AA` | Deep lakes, upper sky, shadows on snow |
| 2 | Green | `#00AA00` | Conifer forest, moss |
| 3 | Cyan | `#00AAAA` | Glacial rivers (the Hoh's milky teal), ice |
| 4 | Red | `#AA0000` | Box borders, paintbrush flowers, fall huckleberry leaves, the hiker's jacket (default) |
| 5 | Magenta | `#AA00AA` | Heather, dusk sky, lupine shadows |
| 6 | Brown | `#AA5500` | Trunks, trail, cedar bark, the bear, the elk, driftwood |
| 7 | Light gray | `#AAAAAA` | Rock, fog, gravel bars, clouds |
| 8 | Dark gray | `#555555` | Distant ridges, talus shadows, sketch lines |
| 9 | Light blue | `#5555FF` | Day sky, lupine |
| 10 | Light green | `#55FF55` | Meadows, lit moss, new leaves |
| 11 | Light cyan | `#55FFFF` | Horizon sky, glacier ice highlights, water sparkle |
| 12 | Light red | `#FF5555` | Fire, salmon, alpenglow accents |
| 13 | Light magenta | `#FF55FF` | Wildflowers, watermelon snow |
| 14 | Yellow | `#FFFF55` | Sun, glacier lilies, banana slugs, headlamp, **the Snowlamp** |
| 15 | White | `#FFFFFF` | Snow, paper, surf, clouds, text boxes |

Time-of-day remaps (6.6) only **swap which of the EGA card's 64 hardware colors** sit in each of the 16 slots. Real EGA hardware could do exactly this, so the look stays authentic.

### 6.2 Resolution: AGI-style 160x168 with fat pixels (recommended)

| Option | Canvas | Pixel shape | On a 393 pt iPhone | Verdict |
|---|---|---|---|---|
| **AGI** (KQ1-3) | **160x168** | 2:1.2 (wide) | Each pixel about 2.3 x 1.4 pt. Picture about 373x224 pt | **Recommended** |
| SCI0 (KQ4) | 320x190 | 1:1.2 | Each pixel about 1.2 x 1.4 pt. Picture about 373x266 pt | Too fine: reads as "smooth" at arm's length and loses the chunky charm the user asked for |
| Custom portrait | 160x240 | 2:1.2 | About 373x320 pt | Too tall to leave room for the narration on smaller phones |

**Why AGI 160x168:**
1. **Chunky is the point.** The user said "low-res chunky pixels". At 160 columns on a phone, each pixel is a visible, deliberate block, which is exactly the KQ1-3 look. 320 columns read as merely retro.
2. **The picture-book layout works.** A 160x168 picture at its authentic CRT aspect (about 1.59:1) takes the **top ~28%** of an iPhone 15 screen. That leaves room underneath for 10 lines of narration plus 3 choices, exactly like a picture book with a picture over text.
3. **Procedural composition is forgiving at low res.** Seeded props, overlays and flood fills look intentional at 160 wide. Mistakes vanish in the chunk.
4. **Flood fill and per-frame palette cycling are trivial at 26,880 pixels**, which helps battery life on iPhone.
5. **Sketch mode and zoom** (2x crop) still read well.

**Scaling rule (crisp pixels):** render into a 160x168 index buffer, then blit to a display canvas at **integer device-pixel scales** `sx` (horizontal) and `sy` (vertical), chosen to approximate the authentic 5:3 pixel shape:

```
dpr        = window.devicePixelRatio            // 3 on most iPhones, 2 on SE
availW_px  = (CSS width - 2*10pt margin) * dpr
sx         = floor(availW_px / 160)
sy         = max(2, round(sx * 0.6))            // target aspect 1.667 (accept 1.33-2.0)
picture    = 160*sx  x  168*sy device px, centered, with a 1-2 pt black frame
```

| Device (portrait) | dpr | sx x sy | Picture (pt) |
|---|---|---|---|
| iPhone 15/16 (393 pt) | 3 | 7 x 4 | 373 x 224 |
| iPhone 16 Pro (402 pt) | 3 | 7 x 4 | 373 x 224 |
| iPhone 15/16 Plus & Pro Max (430/440 pt) | 3 | 8 x 5 | 427 x 280 (no side margin) or 7x4 with margins |
| iPhone 13 mini (375 pt) | 3 | 6 x 4 | 320 x 224 (aspect 1.5, fine) |
| iPhone SE 2/3 (375 pt) | 2 | 4 x 3 (or 4 x 2) | 320 x 252 (or 320 x 168) |

**Tall plates** are used for full-bleed signature moments (cover, first view of Olympus, the glow, The End). They are **160x320**, displayed about 373x427 pt with the narration in a Sierra pop-up box over the lower third. About 8 exist in total.

### 6.3 Pictures are vector commands plus flood fill

Every picture is a small text program, like AGI's PICTURE resources. A compact DSL (one command per line) is easy to hand-author and easy to generate:

```
# file: scenes/base/subalpine_meadow.pic     canvas 160x168
# Commands:
#  C n            set pen color (0-15, or pseudo 16-23)
#  L x,y x,y ...  absolute polyline
#  R x,y dx,dy .. relative polyline (AGI-style short moves)
#  F x,y ...      flood fill: fill the contiguous region of the seed pixel's color
#  D a b pat      set fill to a dither of colors a and b (pattern below); "D a" = solid
#  B shape size   set brush (dot|plus|square|splat), size 0-7  (AGI pen patterns)
#  S x,y ...      stamp brush at points (splatter: foliage, flowers, snow)
#  T id x,y [fx]  place a stamp (a reusable vector sub-picture: tree, rock, log), fx = flip-x
#  Z id x,y,w,h   tap hotspot (for "look" and "sketch")
#  @ sky|far|mid|near   layer marker (for draw-in order and fog)

@ sky
D 1 9 checker25   F 80,2          # top of sky: blue with sparse light blue
D 9               F 80,20         # mid sky: light blue
D 9 11 checker    F 80,40         # near horizon: light blue/light cyan
@ far
C 8  L 0,62 14,50 27,55 41,38 58,52 74,44 95,30 108,41 126,36 143,49 159,44 159,63 0,63
D 7 9 checker     F 70,58         # hazy far ridge
C 15 L 90,33 95,30 101,35         # snow on the far peak
D 15              F 95,32
@ mid
C 2  L 0,90 30,84 64,92 100,86 136,93 159,88
D 2 10 checker    F 80,100        # meadow, mid
T subalpine_fir 18,88  T subalpine_fir 26,90  T subalpine_fir 131,86 fx
@ near
D 10              F 80,150        # foreground meadow
B splat 1  C 13  S 12,140 19,146 33,152 41,139   # paintbrush flowers
B dot 0    C 9   S 70,150 74,147 81,153          # lupine
Z meadow 0,96,160,72
Z far_peak 80,28,30,20
```

The renderer is a straight port of the AGI idea: Bresenham lines, a scanline flood fill, and a brush stamper. Painter's order goes **sky, far, mid, near, sprites, weather**.

**Layers are rendered into separate buffers** (index 255 means transparent) and then composited. A fill in an overlay therefore can't leak into a base region of the same color, which is a classic AGI headache we can simply avoid.

### 6.4 Dither patterns

SCI0's two-color dithers give us the "dithered skies" the user remembers. Each dithered fill is a pair `(a, b)` and a pattern keyed by `(x, y)`:

| Pattern | Rule (b where true, else a) | Use |
|---|---|---|
| `solid` | never | Everything flat |
| `checker` | `(x + y) % 2 == 0` | 50% blends: sky bands, haze, moss |
| `checker25` | `x % 2 == 0 && y % 2 == 0` | Light speckle: thin sky gradient, frost |
| `checker12` | `x % 4 == 0 && y % 2 == 0` | Very light speckle: starfields, mist edges |
| `hlines` | `y % 2 == 0` | Water, distant lake surfaces, fog bands |
| `vlines` | `x % 2 == 0` | Rain curtains, tree-trunk texture |
| `diag` | `(x + y) % 4 == 0` | Glacier striations, sand |
| `brick` | `(y % 2 == 0) ? x % 4 == 0 : x % 4 == 2` | Talus, shingles, cedar bark |

Sky gradients are built from 3-5 dithered bands (`1/9 checker25 → 9 → 9/11 checker → 11/15 checker25`). This is the look of a KQ4 sky at AGI resolution, and on wide pixels it reads beautifully.

### 6.5 Draw-in animation

Since pictures are programs, **the draw-in is free**: replay the command list over about 800 ms, running outlines, then fills, layer by layer, so the scene appears as if a 1984 PC were drawing it. Fills appear instantly per command (as they did on real hardware), which gives the famous "pop" of color flooding a shape. Tap skips. Revisited scenes are cached as rendered index buffers and appear instantly.

### 6.6 Time of day: palette remaps

Each time of day is a **slot remap** inside the EGA 64-color gamut (every channel is one of 00, 55, AA, FF). Remaps apply at final composite, so sprites and overlays tint along with the scene for free.

| Slot | Day | Dawn | Dusk (golden/sunset) | Blue hour | Night |
|---|---|---|---|---|---|
| 0 | 000000 | 000000 | 000000 | 000000 | 000000 |
| 1 blue | 0000AA | 5555AA | 0000AA | 000055 | 000055 |
| 2 green | 00AA00 | 005500 | 005500 | 005555 | 000055 |
| 3 cyan | 00AAAA | 55AAAA | 005555 | 0055AA | 005555 |
| 4 red | AA0000 | AA0000 | AA0000 | 550055 | 550000 |
| 5 magenta | AA00AA | AA55AA | AA00AA | 550055 | 000055 |
| 6 brown | AA5500 | AA5500 | AA5500 | 555555 | 000000 |
| 7 lt gray | AAAAAA | AAAAAA | AA5555 | 5555AA | 5555AA |
| 8 dk gray | 555555 | 555555 | 550000 | 000055 | 000055 |
| 9 lt blue (sky) | 5555FF | AAAAFF | AA55AA | 5555AA | 000055 |
| 10 lt green | 55FF55 | 55AA55 | 55AA00 | 005555 | 005555 |
| 11 lt cyan (horizon) | 55FFFF | FFAAAA | FFAA55 | AA55AA | 0055AA |
| 12 lt red | FF5555 | FF5555 | FF5500 | FF5555 | FF5555 |
| 13 lt magenta | FF55FF | FFAAFF | FF55AA | AA55FF | AA55AA |
| 14 yellow | FFFF55 | FFFFAA | FFAA00 | FFFF55 | FFFF55 |
| 15 white (snow) | FFFFFF | FFFFAA | FFAAAA *(alpenglow)* | AAAAFF *(blue snow)* | AAAAFF |

At night, 12 (fire) and 14 (stars, headlamp, glow) stay bright. Everything else sinks into blues, so a campfire or a headlamp beam *pops*.

**Weather tints** stack on top: *overcast* maps 9 to AAAAAA and 11 to FFFFFF and dims 14. *Storm* maps 9 and 11 to 555555 and 7 to 555555. *Lightning* flashes all slots to FFFFFF for 2 frames.

**Camp pages step through these remaps as chores pass:** arrive in Day, cook dinner in Dusk, watch the sunset into Blue hour, then Night. The player watches evening fall while choosing what to do, which is the most "living book" effect in the game.

### 6.7 Palette cycling: phased pseudo-colors

AGI had no palette cycling, and the EGA SCI0 games barely used it. So we keep the output strictly EGA but add **pseudo-color indices 16-23**. Each one resolves every frame to one of the 16 EGA colors from a cycle table, **phased by pixel position** so motion appears:

```
color(px) = cycle[(frame + phase(x, y)) mod cycle.length]
```

| Pseudo | Name | Cycle (EGA slots) | Phase | Effect |
|---|---|---|---|---|
| 16 | lake | 1, 9, 1, 3 | `x/3 + y` | Lake shimmer (painted as a dither of 16 and 1, so only some pixels move) |
| 17 | falls | 15, 11, 7, 11 | `y` (downward) | Falling water: Sol Duc Falls, Marymere, Enchanted Valley's waterfalls |
| 18 | river | 3, 11, 3, 7 | `y - x/2` | Glacial river flow (Hoh, Elwha) |
| 19 | glow | 6, 12, 14, 15, 14, 12 | distance from center | **The Snowlamp**: rings radiating outward |
| 20 | fire | 4, 12, 14, 12 | random per 2 frames | Campfire, stove flame |
| 21 | surf | 15, 7, 1, 9 | `y` (toward shore) | Breaking waves on beaches and sea stacks |
| 22 | stars | 15, 7, 8, 7 | hash(x, y) | Twinkle |
| 23 | rain-glint | 9, 11 | `y + x` | Puddles in rain |

Cycling runs at **8 fps** (period-appropriate, and gentle on the battery) only while a page with cycling regions is visible, and it pauses when the page is static or the tab is hidden. *Reduce Motion* (the iOS setting, via `prefers-reduced-motion`) freezes cycles at frame 0, except for the glow, which slows to 2 fps.

### 6.8 Sprites

Sprites are small vector or bitmap figures in the same EGA palette, placed at layer **anchors** each base scene defines (trail spot, far bank, campsite, rock perch, sky).

| Sprite | Size (px) | Frames | Notes |
|---|---|---|---|
| **Hiker** | 7 x 18 | idle 2, sit, wade, shiver, sketch, wave | **The pack sprite reflects what you packed**: daypack, mid pack or big pack; and with items strapped outside (pad roll, swinging pot, ice axe), the extras dangle. Jacket color is chosen on the New Book page. |
| Companions | 7 x 18 | same | A different jacket color each (4, 1, 2, 5, 6) |
| Tent | 14 x 8 | pitched, sagging (rain), glowing (headlamp inside at night) | Tent color by item |
| Black bear | 14 x 9 | eat, look up, walk | |
| Roosevelt elk | 16 x 14 | graze, head up, bugle | Bull has antlers (Sept-Oct) |
| Black-tailed deer | 11 x 11 | graze, look | |
| Olympic marmot | 5 x 4 | sit up, whistle, duck | |
| Canada jay | 4 x 3 | perch, hop, fly (with tortilla) | |
| American dipper | 3 x 2 | bob (2-frame "dip") | |
| Raccoon | 7 x 4 | sneak, hold bag | |
| Banana slug | 4 x 1 | none (it's a slug) | Yellow (14), a perfect one-pixel joke |
| Bald eagle | 9 x 3 | soar | |
| Salmon | 5 x 2 | leap | |
| Harbor seal | 6 x 3 | head bob | |
| Ranger | 7 x 18 | idle, point | Flat hat |
| Car | 18 x 8 | idle, drive (wheel flicker) | Color chosen by player |
| Margin fox | 12 x 10 (UI layer, not in scenes) | point, shiver, tap wrist, sleep, sit on book | Drawn in sketch-line style (8 on 15), like a pencil doodle |

### 6.9 Type

| Role | Font | Notes |
|---|---|---|
| Status line, chapter titles, choice labels, margin notes | **IBM EGA 8x14** bitmap (e.g. *Px437 IBM EGA 8x14* from the Ultimate Oldschool PC Font Pack, CC BY-SA 4.0; credit it in the colophon) | The authentic EGA text-mode font |
| Narration body | A **proportional Sierra-style pixel font**, about 5-6 px average advance, 11 px cell (author a custom one, or use an OFL font such as *Pixelify Sans*) | Proportional text fits about 34-38 characters per line at 2 CSS px per font pixel, which is readable at arm's length |
| Accessibility "Book" font | A bundled OFL serif (e.g. *Literata*) or the system serif | Toggle in settings. Also used when iOS Larger Text is detected |

Text is **real HTML** (not canvas), so VoiceOver reads it and it scales. Fonts are bundled locally (woff2) so the game works offline. Body text is sized so one font pixel equals a whole number of CSS pixels (2 by default, 3 for Large), which keeps it crisp. Line height is 1.35. Black on white is about 21:1 contrast. Night pages use light gray (7) on black for about 9:1.

**Accessible pictures:** every composed scene generates **alt text** from its layers (*"A meadow under a blue sky. Mount Olympus far away. A marmot on a rock."*), which VoiceOver reads before the narration.

---

## 7. The Scene Composition System

The park has hundreds of camps, junctions, fords, lakes and landmarks (the Hoh and Sol Duc region files alone list 146 nodes). Hand-drawing each is impossible. Instead, **a place's picture is composed from layers**, chosen by data and seeded by the place's id, so it is **stable** (Elk Lake always looks like Elk Lake) and **varied** (Elk Lake doesn't look like Lunch Lake). About 24 signature places and story moments are drawn by hand on top of the same system.

### 7.1 The pipeline

```
scene(node, clock, weather, month, party, flags) =
   1. BASE      biome base picture           (one of ~14; parameterized by horizon height, slope, water)
   2. VARIANT   seeded parameters            (seed = hash(node.id); flip-x, horizon ±6px, ridge profile)
   3. FAR       skyline / landmark overlay   (named peaks seen from here, e.g. olympus_massif, deception)
   4. PROPS     seeded stamps                (trees by species & elevation, rocks, logs, ferns, flowers by month)
   5. FEATURE   node feature overlay         (lake, ford, falls, bridge, shelter, ladder, sign, sea stack)
   6. SEASON    seasonal swaps               (snow line by month & elevation, fall color, flowers, berries)
   7. SPRITES   hiker/party/tent/animals     (anchored to base anchors; pose from state)
   8. WEATHER   overlay                      (rain, drizzle, fog bands, snow fall, wind, clouds, stars, moon)
   9. PALETTE   time-of-day remap + weather tint
  10. CYCLE     pseudo-color resolution per frame
  11. HOTSPOTS  merged from layers -> tap-to-look, sketchable flags, alt text
```

Layers are rendered once and cached by the key `(node, month, timeOfDay, weather, spriteState)`. Palette remap and cycling are per-frame, which is cheap.

### 7.2 Biome base layers

| Base | Picks it | Signature traits (what the vector program draws) | Anchors |
|---|---|---|---|
| `rain_forest` | West-side valleys below ~2,000 ft (Hoh, Queets, Quinault, Bogachiel, lower Sol Duc) | Giant trunks bleeding off the top edge, moss drapes (dithers of 2/10 in `vlines`), sword-fern clumps, a nurse log, green-dithered light shafts | trail, log, canopy |
| `montane_forest` | 2,000-4,000 ft, east-side valleys | Straight Douglas-fir and hemlock columns, switchback trail line, filtered light, vine maple (red in Sept-Oct) | trail, switchback, creek |
| `subalpine_meadow` | 4,000-5,500 ft open | Rolling meadow, subalpine-fir spires, flower splatter by month, far ridges | trail, rock perch, camp |
| `alpine` | > 5,500 ft, or rock and snow nodes | Talus (`brick` dithers), snowfields, krummholz, big sky | ridge, rock, snowfield |
| `glacier` | Blue Glacier, Snow Dome, Royal Glacier | Ice with `diag` striations, crevasse lines, moraine ridges, seracs | ice edge, moraine crest, camp |
| `lake_basin` | Any lake or tarn node | A bowl: lake in the mid layer (pseudo 16), talus slopes, reflection band, firs | shore, camp, rock |
| `river_valley` | Fords, gravel bars, bridges | Braided river (pseudo 18), gravel (7/8), cottonwood or alder, far valley walls | near bank, far bank, ford line, bridge |
| `waterfall` | Falls nodes | Rock cleft, falling water (pseudo 17), spray dither, ferns | viewpoint, bridge |
| `beach` | Coast beaches | Sea stacks on the horizon, surf lines (pseudo 21), driftwood logs, sand (`diag` 6/14) | sand, log, tide line |
| `headland` | Coast headlands and overland trails | Cliff, rope ladder, round red-and-black trail target sign, rocks at the tide line | ladder, cliff top, rocks |
| `pass` | Passes and divides | Saddle with drop-offs both ways, a cairn, two skylines | saddle, cairn |
| `trailhead` | Trailheads | Parking lot, the car, kiosk, wooden sign with the routed trail name | car, sign, kiosk |
| `road` | Drive pages | Road ribbon in perspective, car, the lake or forest edge | car |
| `interior_store` | Store | Shelves (stamps of cans and bags), counter, shopkeeper, window with rain | counter, shelf |
| `interior_ranger` | WIC | Counter, the big wall map, forecast board, bear canister shelf, ranger | counter, map |
| `town` | Port Angeles, Forks, Sequim | Low storefronts, a ferry or log truck in the distance, the Strait or forest behind | street |
| `camp_overlay` | Applied to any base when it's a camp | Tent pad, fire ring (only where fires are allowed), bear wire or canister, privy sign | tent, kitchen, water |

**Inference** (when a node has no explicit `biome` field in the region data):

```
if node.type in [trailhead]                  -> trailhead
elif node.type == "river_ford"               -> river_valley (variant: ford)
elif node.type == "glacier"                  -> glacier
elif node.type in [lake] or name has "Lake"  -> lake_basin
elif node.type == "pass"                     -> pass
elif region.coast                            -> beach | headland (by node tag)
elif elev < 2000 and region.westside         -> rain_forest
elif elev < 4000                             -> montane_forest
elif elev < 5500                             -> subalpine_meadow
else                                         -> alpine
```

The region JSON files the researchers are writing (`nodes[].type`, `elevation_ft`) are enough to feed this directly. A per-node `scene` block can override anything.

### 7.3 Landmark and skyline overlays

Skylines are the **far** layer. Each is drawn once and reused wherever it is visible. Visibility is listed per node (`views: ["olympus_massif"]`).

| Overlay | Seen from |
|---|---|
| `olympus_massif` (Mount Olympus, Blue Glacier, Snow Dome) | High Divide, Bogachiel Peak, Hoh Lake, Glacier Meadows, Blue Glacier moraine, Appleton Pass, Hurricane Ridge (distant) |
| `bailey_range` | High Divide, Hurricane Ridge, Appleton Pass, Elwha |
| `mount_deception` + `royal_basin_walls` | Royal Lake, upper Royal Basin |
| `mount_constance` | Lake Constance, Dosewallips, Hood Canal side |
| `mount_anderson` | Anderson Pass, Enchanted Valley head, Dosewallips |
| `enchanted_valley_walls` (cascades as pseudo 17) | Enchanted Valley |
| `storm_king_crescent` | Lake Crescent, Marymere Falls, US 101 drive |
| `strait_and_vancouver_island` | Hurricane Ridge, Deer Park, Port Angeles |
| `sea_stacks_north` (Point of Arches) | Shi Shi |
| `sea_stacks_rialto` (Hole-in-the-Wall, James Island) | Rialto Beach, La Push |
| `sea_stacks_south` (Toleak, Giants Graveyard) | Third Beach to Toleak |
| `grand_valley` | Grand Pass, Moose Lake, Obstruction Point |

**Feature overlays** (mid and near layers): lake (round, long, heart-shaped for Heart Lake, Y-shaped for Y Lake), ford, footbridge, the High Hoh Bridge, log bridge, the Glacier Meadows ladder, shelter, guard station cabin, chalet, ranger tent, privy, bear wire, rope ladder, sand ladder, boardwalk (Ozette), petroglyph rocks (shown respectfully at a distance, as the Makah-related site they are, with no "sketch" option), hot spring pools (*The Steaming Fern Lodge*, using the researchers' fictional name), and falls.

### 7.4 Props (seeded stamps)

Stamps are tiny vector sub-pictures: `sitka_spruce`, `redcedar`, `hemlock`, `doug_fir`, `bigleaf_maple_mossy`, `vine_maple`, `red_alder`, `subalpine_fir`, `mountain_hemlock_krummholz`, `yellow_cedar`, `snag`, `nurse_log`, `boulder_s/m/l`, `talus_patch`, `fern_clump`, `devils_club`, `skunk_cabbage`, `huckleberry_bush` (green, or red in fall), `heather_mat`, `flower_splat_{lupine,paintbrush,avalanche_lily,glacier_lily,aster}`, `driftwood_log`, `kelp_wrack`, `tidepool`, `cairn`, `trail_sign`.

**Seeded scatter:** each base declares prop *slots* (x-range, y-baseline, scale by depth). The seed picks species by elevation band, count by a density parameter, and flip-x per stamp. Depth order comes from the y-baseline. Ten lines of code give endless, believable variety.

### 7.5 Seasonal and weather overlays

| Overlay | Rule | Draw |
|---|---|---|
| Snow on ground | `elev > snowline(month, snowYear)` | Ground fills switch to 15/7 dithers above the snowline; flowers removed |
| Snow patches | Within 800 ft below the snowline | `splat` brush of 15 in hollows |
| Fall color | Sept-Oct | Vine maple and huckleberry stamps swap 2→4/12, maples 2→14/6 |
| Flowers | By month and elevation band | Avalanche lily (June-July, at the melt edge), lupine and paintbrush (July-Aug), asters (Aug-Sept) |
| Berries | Aug-Sept | Red and blue dots on huckleberry; this also raises bear-encounter odds |
| Rain | weather = rain | Diagonal 1-px streaks of 9/7, re-seeded every 2 frames; picture slightly darkened through the overcast tint |
| Drizzle | weather = drizzle | Sparse `checker12` dots of 7 |
| Fog | weather = fog | **Hides the far layer** (not drawn), then 2-3 `hlines` bands of 7/15 across the mid layer |
| Snowfall | weather = snow | White dots drifting (wraps) |
| Wind | weather = wind | Tree-stamp tips offset ±1 px on alternate frames |
| Clouds | partly cloudy | Cumulus stamps in the sky layer; lenticular cap on Olympus (rare: Field Guide entry) |
| Stars and moon | night and clear | `checker12` of pseudo 22, plus a moon stamp by phase (the real phase for the trip date) |

### 7.6 A composed scene in data

```json
{
  "node": "heart_lake",
  "scene": {
    "base": "lake_basin",
    "seed": "auto",
    "params": { "horizon": 58, "lakeShape": "heart", "lakeY": 104 },
    "far": ["bailey_range"],
    "props": { "trees": ["subalpine_fir", "mountain_hemlock_krummholz"], "density": 0.6, "rocks": 4 },
    "features": ["camp_overlay"],
    "views": [],
    "hotspots": [
      { "id": "lake",  "look": "look.heart_lake.lake",  "sketch": true },
      { "id": "ridge", "look": "look.high_divide.ridge" }
    ]
  }
}
```

A page then only says `"scene": "@node"` plus overrides (`"sprites": ["bear@shore_far:eat"]`, `"weather": "fog"`).

### 7.7 Hand-authored signature scenes (24)

These are the places and moments that deserve an illustrator's full attention. Each is a complete picture program (and some are tall plates) that still accepts palette, weather and sprite layers.

| # | Scene | Kind | Why it's special |
|---|---|---|---|
| 1 | **Cover: the High Divide at dusk**, Olympus across the Hoh valley, a tiny hiker | Tall plate | The title screen. Uses the dusk remap and alpenglow |
| 2 | **The kitchen table and the old field guide** (rain on the window) | Plate | Prologue |
| 3 | **The blank page** (No. 104) and the margin fox | Plate | Prologue; the central mystery |
| 4 | **Wilderness Information Center, Port Angeles** (counter, wall map, forecast board, ranger) | Scene | Chapter One |
| 5 | **Mossback Mercantile** (fictional), shelves and a rainy window | Scene | Chapter Two |
| 6 | **The labeled backpack spread** | UI art | Chapter Three, the book's backpack spread in our own drawing |
| 7 | **US 101 along Lake Crescent**, Mount Storm King, the car | Scene | Chapter Four; palette-cycled lake |
| 8 | **Hall of Mosses** (bigleaf maples in moss) | Scene | The rain-forest "wow" |
| 9 | **The Hoh braids with the elk herd** (gravel bar, milky river) | Scene | The ford set-piece |
| 10 | **The Glacier Meadows ladder** in the washed-out avalanche chute | Scene | The Olympus approach's crux |
| 11 | **Blue Glacier from the lateral moraine**, Olympus above | Tall plate | First close view of Olympus |
| 12 | **Snow Dome and the Olympus summit block at dawn** | Tall plate | The climbers' summit |
| 13 | **Sol Duc Falls** (three-way cascade, footbridge) | Scene | Palette-cycled falls |
| 14 | **Seven Lakes Basin from the High Divide rim** | Scene | Must-have region |
| 15 | **Heart Lake** | Scene | Its namesake shape |
| 16 | **Royal Lake and Mount Deception** | Scene | Must-have region |
| 17 | **Upper Royal Basin**: tarn, moraine, Royal Glacier | Scene | A snowlamp place |
| 18 | **Hurricane Hill / the Bailey Range** from the ridge | Scene | Day-hike centerpiece |
| 19 | **Grand Valley and Moose Lake** | Scene | Classic east-side high country |
| 20 | **Enchanted Valley** (cliffs of waterfalls, the chalet) | Scene | The Quinault set-piece |
| 21 | **Rialto Beach, Hole-in-the-Wall**, sea stacks, surf | Scene | The coast |
| 22 | **Shi Shi Beach and Point of Arches** at sunset | Scene | The coast's grand finale |
| 23 | **The Snowlamp in the blue snow** | Tall plate | The emotional peak |
| 24 | **The End**: the closed book on a car dashboard at a trailhead, the margin fox asleep on top | Plate | Every ending |

Optional extras if time allows: Ozette boardwalk and Cape Alava, Lake Constance, Olympus Guard Station (the rescue porch), Elwha valley and Humes Ranch, Staircase rapids, Deer Lake, Hoh Lake with Olympus.

---

## 8. iPhone Portrait Wireframes

### 8.0 Global rules

- **Viewport:** `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`. Installed as a home-screen web app (`display: standalone` in the manifest, `apple-mobile-web-app-capable`), with portrait orientation in the manifest. If the phone is rotated to landscape, show a little EGA plate saying *"This book reads best held upright."*
- **Safe areas:** the app shell pads with `env(safe-area-inset-top/bottom/left/right)`. The status line sits **below** the Dynamic Island inset, and the toolbar sits **above** the home-indicator inset.
- **Height:** use `100dvh`, plus `overscroll-behavior: none` (no rubber-band), `touch-action: manipulation` (no double-tap zoom) and `-webkit-user-select: none` on chrome (narration stays selectable for accessibility).
- **Tap targets:** at least **44x44 pt**. Choice buttons are **full width x 52 pt** with 8 pt gaps. Toolbar icons are 44 pt within a 50 pt bar. Picture hotspots get a hit area of **max(hotspot, 44 pt)** around their center.
- **Thumb zone:** every action lives in the bottom half. The picture (top) is for looking.
- **Reference sizes:** iPhone 15/16 is 393 x 852 pt, safe area top 59 and bottom 34. iPhone SE is 375 x 667, top 20 and bottom 0.

### 8.1 The page frame (every in-book screen)

```
 393pt
┌─────────────────────────────────────────┐ ─┐
│░░░░░░░░░░░░░ Dynamic Island ░░░░░░░░░░░░│  │ safe top 59
├─────────────────────────────────────────┤ ─┤
│ Score: 31 of 120          ≡  Sound: on  │  │ STATUS LINE 22  (KQ style; tap ≡ = menu)
├─────────────────────────────────────────┤ ─┤
│ ┌─────────────────────────────────────┐ │  │
│ │                                     │ │  │
│ │      EGA PICTURE 160x168            │ │  │ PICTURE 224 (sx=7, sy=4)
│ │      (tap = look; pencil = sketch)  │ │  │
│ │                                     │ │  │
│ └─────────────────────────────────────┘ │  │
│ Day 2 · Afternoon · Elk Lake · 2,600 ft │  │ CAPTION 20  (+ weather + condition glyphs)
│  ☁  ☀warm ●●○fed  feet ok  ♥♥♥♥○   ✎  │  │ (optional 2nd caption row when relevant)
├─────────────────────────────────────────┤ ─┤
│                                         │  │
│ Narration in the pixel font, 34-38      │  │
│ characters per line, up to ~10 lines.   │  │ TEXT (flex; scrolls if long, with "more ▾")
│                              ✎ margin   │  │ margin notes float right on outcome pages
│                 - 37 -                  │  │ page number
├─────────────────────────────────────────┤ ─┤
│ ┌─────────────────────────────────────┐ │  │
│ │ Wade across now               65%  │ │  │ CHOICES 52 each, 8 gap (2-4 of them)
│ └─────────────────────────────────────┘ │  │ or a single "Turn the page ▸"
│ ┌─────────────────────────────────────┐ │  │
│ │ Camp here, cross at dawn     sure  │ │  │
│ └─────────────────────────────────────┘ │  │
├─────────────────────────────────────────┤ ─┤
│   [Pack]     [Map]    [Guide]   [Book]  │  │ TOOLBAR 50 (icons 44)
├─────────────────────────────────────────┤ ─┤
│░░░░░░░░░░░ home indicator ░░░░░░░░░░░░░░│  │ safe bottom 34
└─────────────────────────────────────────┘ ─┘
```

Space check (iPhone 15): 59 + 22 + 224 + 20 + text + 2×52+8 + 50 + 34 leaves **about 330 pt for text with 2 choices** and **about 270 pt with 3**. On an SE it is about 190 pt with 3 choices (6-7 lines), and the text scrolls with a "more ▾" cue.

### 8.2 Title: the Bookshelf

```
┌─────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ╔═════════════════════════════════════╗ │
│ ║  TALL PLATE: High Divide at dusk,   ║ │
│ ║  Olympus burning pink across the    ║ │
│ ║  Hoh valley; a tiny hiker on the    ║ │
│ ║  ridge; stars beginning (cycling)   ║ │
│ ║                                     ║ │
│ ║      OLYMPIC PENINSULA HIKER        ║ │  title in 8x14 EGA font, 3x, yellow
│ ║        ~ a storybook trip ~         ║ │
│ ╚═════════════════════════════════════╝ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ▶  Begin a New Book                 │ │ 52
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ ❐  Continue: "Too Much Cheese..."   │ │ 52 (only if a book is open)
│ └─────────────────────────────────────┘ │
│  Your bookshelf                         │
│ ┌─────────────────────────────────────┐ │
│ │▐█▌▐█▌▐▓▌▐█▌▐░▌                      │ │ spines: 44pt wide, tap = reread; long-press = share/delete
│ └─────────────────────────────────────┘ │
│  Field Guide: 23 of 104     ⚙  Sound:on │ 44
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────────────┘
```

### 8.3 New Book (who is going?)

```
┌─────────────────────────────────────────┐
│ ‹ Shelf          A NEW BOOK             │
│ ┌─────────────────────────────────────┐ │
│ │ [hiker sprite, big, 4x zoom]  ◀ ▶   │ │ ◀ ▶ = jacket color (EGA)
│ └─────────────────────────────────────┘ │
│ The hiker's name                        │
│ ┌─────────────────────────────────────┐ │
│ │ Robin                          ⟳    │ │ ⟳ = suggest a name (no typing needed)
│ └─────────────────────────────────────┘ │
│ [ they ] [ she ] [ he ]                 │ 44 chips
│                                         │
│ Going with (optional, up to 3)          │
│ [ + add a companion ]                   │ 44 → name chip + trait chip
│  Sam · "always hungry"     ✕            │
│                                         │
│ How should this book be?                │
│ (•) Storybook - nobody comes to harm    │ 44 rows
│ ( ) Perilous ♦ - the old Sierra rules   │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │      Open the book  ▸               │ │ 52
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Companions** are optional. Solo is the default and the purest homage, a lone collector. A party of 1-3 named companions (Oregon Trail style) adds shared gear (one tent, stove and filter for everyone, which saves weight), more food to buy, a **trait** per companion that adds odds modifiers and lines of dialogue (*always hungry, strong swimmer, knows knots, early riser, sings when nervous, hates mosquitoes, great at fires*), and companion-specific events. Names are free text **or** tap-to-suggest, so no keyboard is required. We assume nothing about who "the 104 boyz" are. If the creator wants a pre-filled party, it's a single config list.

### 8.4 Prologue page (the blank page)

```
┌─────────────────────────────────────────┐
│ Score: 0 of 120             ≡ Sound:on  │
│ ┌─────────────────────────────────────┐ │
│ │ PLATE: the open field guide. Left:  │ │
│ │ a marmot plate. Right: "No. 104     │ │
│ │ THE SNOWLAMP" and an empty box.     │ │
│ │ Corner: the pencil fox (animates)   │ │
│ └─────────────────────────────────────┘ │
│ Prologue · Kitchen table · Raining      │
│                                         │
│ Every page in the old book had a        │
│ picture except one. Under the words     │
│ THE SNOWLAMP there was only a pale      │
│ square of paper, waiting, the way a     │
│ window waits for morning.               │
│                 - 3 -                   │
│ ┌─────────────────────────────────────┐ │
│ │        Turn the page  ▸             │ │
│ └─────────────────────────────────────┘ │
│   [Pack]     [Map]    [Guide]   [Book]  │ (Pack/Map dimmed until Chapter 3/1)
└─────────────────────────────────────────┘
```

### 8.5 Ranger station: the park map (Chapter One)

```
┌─────────────────────────────────────────┐
│ Score: 0 of —               ≡ Sound:on  │
│ ┌─────────────────────────────────────┐ │
│ │ ENDPAPER MAP of the whole park      │ │
│ │ (EGA, 160x168, can pan): coast on   │ │
│ │ the left, Olympus in the middle,    │ │
│ │ Hood Canal on the right. Regions    │ │
│ │ outlined; tap one to zoom.          │ │
│ │  [Coast] [Sol Duc] [Hoh] [Elwha]    │ │ ← tap regions directly on the map,
│ │  [Royal/Dungeness] [Quinault] ...   │ │   44pt hit areas on the labels
│ └─────────────────────────────────────┘ │
│ Chapter One · Port Angeles · WIC        │
│                                         │
│ Ranger Calder spread the big map on     │
│ the counter. "Where to?" she asked,     │
│ as if every answer were a good one.     │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ★ The ranger's favorite trips       │ │ presets (classic_trips from data)
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ ? Ask about weather / snow / bears  │ │ knowledge: narrows later odds
│ └─────────────────────────────────────┘ │
│   [Pack]     [Map]    [Guide]   [Book]  │
└─────────────────────────────────────────┘
```

### 8.6 Ranger station: region map plus itinerary builder

The region map fills the picture area. The itinerary is a **bottom sheet** with three heights: peek (one line), half and full. It is written like a permit.

```
┌─────────────────────────────────────────┐
│ ‹ Park map    THE HOH & OLYMPUS         │
│ ┌─────────────────────────────────────┐ │
│ │  REGION MAP (zoomed endpaper art)   │ │
│ │  T = trailhead   ▲ = camp (tap)     │ │
│ │  ~ trails as dotted lines           │ │
│ │                                     │ │
│ │   T Hoh RF ··▲5mi··▲Olympus GS··    │ │
│ │        ··▲Lewis Mdw··▲Elk Lk··      │ │
│ │              ··▲Glacier Mdws ▲      │ │
│ │      (selected route glows yellow)  │ │
│ └─────────────────────────────────────┘ │
│ ┌──── YOUR TRIP (drag up) ────────────┐ │
│ │ Start: Hoh Rain Forest TH  [change] │ │
│ │ [Day hike][1][2][3][4][5][6+] nights│ │ 44pt segmented
│ │ Month: [Jun][Jul][Aug][Sep][Oct]    │ │
│ │ ────────────────────────────────    │ │
│ │ Night 1  Lewis Meadow   10.5mi ↗400 │ │ tap a night: change camp /
│ │ Night 2  Glacier Mdws    7.0mi ↗3300│ │ "stay again" (layover) /
│ │ Night 3  Glacier Mdws  layover ☾    │ │ remove
│ │ Night 4  Olympus GS      8.5mi ↘    │ │
│ │ Out      Trailhead       9.0mi      │ │
│ │ ────────────────────────────────    │ │
│ │ Ranger: "Day 2 is a climb. The      │ │ ranger's opinion, in voice
│ │ ladder is no place to be at dusk."  │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │   Write it on the permit ▸      │ │ │ 52
│ │ └─────────────────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

Tapping a camp ▲ adds it as the next night. The route between nights auto-follows trails, and the miles and gain per day appear with **storybook difficulty words** (*an easy stroll / a good day / a long day / a very long day / the ranger raises an eyebrow*). Day hikes skip nights and pick a turnaround point instead.

### 8.7 The permit page

```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ PICTURE: the WIC counter, the       │ │
│ │ ranger holding a rubber stamp       │ │
│ └─────────────────────────────────────┘ │
│ ╔═ WILDERNESS PERMIT ═════════════════╗ │  paper form, pixel "handwriting" fields
│ ║ Party: Robin (+ Sam)    Size: 2     ║ │
│ ║ Entry: Hoh River TH     Jul 14 2026 ║ │
│ ║ Nights: Lewis Mdw · Glacier Mdws ×2 ║ │
│ ║         · Olympus Guard Station     ║ │
│ ║ Food storage: bear canister  [✓]    ║ │
│ ║ Trip plan left with: [ a friend ▾]  ║ │ affects rescue speed
│ ║ Forecast: ☀ ☀ ⛅ ☂40% ☀            ║ │ knowledge item (Ask the ranger)
│ ╚═════════════════════════════════════╝ │
│ ┌─────────────────────────────────────┐ │
│ │      ▣ Stamp it  (thunk!)           │ │ 52
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │      ‹ Change the plan              │ │ 52
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 8.8 The store (Chapter Two)

```
┌─────────────────────────────────────────┐
│ Score: 4 of 120     $ 64.20  ≡ Sound:on │ wallet optional (setting)
│ ┌─────────────────────────────────────┐ │
│ │ MOSSBACK MERCANTILE interior:       │ │
│ │ shelves, rainy window, shopkeeper   │ │ tap shelves = jump to a category
│ │ (tap the shopkeeper for advice)     │ │
│ └─────────────────────────────────────┘ │
│ ┌ SHOPPING LIST (notepad) ────────────┐ │
│ │ Breakfasts ●●○   Lunches ●●●        │ │ fills as you buy, per day of the plan
│ │ Dinners   ●○○   Snacks ●●●  Fuel ✓  │ │
│ └─────────────────────────────────────┘ │
│ [Brkfst][Lunch][Dinner][Snack][Drink][Fuel]│ 44 tabs (scroll horizontally)
│ ┌─────────────────────────────────────┐ │
│ │ ▣ Ramen (2)    6oz 380cal  $1  − 2 +│ │ 52 rows: icon, name, weight,
│ │ ▣ Instant mash 4oz 440cal  $2  − 1 +│ │ calories, price, stepper (44pt)
│ │ ▣ Freeze-dried 5oz 600cal $12  − 0 +│ │
│ │ ▣ Canned beans 16oz 400cal $2  − 0 +│ │ ← shopkeeper quip on tap
│ └─────────────────────────────────────┘ │
│ "Those'll be heavy, friend. Beans are   │ shopkeeper line (Sierra pop-up box style)
│  mostly can."                           │
│ ┌─────────────────────────────────────┐ │
│ │      Pay and head home ▸            │ │ 52
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

Joke items with real consequences: a whole watermelon (8 lb; morale bonus at the first camp, *"the happiest camp on the High Divide"*), freeze-dried ice cream, a pound of cheese (morale, then thirst), and a jar of pickles.

### 8.9 The pack spread (Chapter Three)

The book's labeled backpack spread, in our own drawing. Items lie on the floor around the open pack with **leader lines and labels**. Tapping an item moves it into the pack (it hops in with a "bloop"). Long-press shows its card.

```
┌─────────────────────────────────────────┐
│ Score: 6 of 120             ≡ Sound:on  │
│ ┌─────────────────────────────────────┐ │
│ │ tent ─┐            ┌─ stove          │ │
│ │  [▲]  │   ╭─────╮  │  [♨]  ← fox    │ │ margin fox points at the rain jacket
│ │ bag ──┼── │█████│ ─┼── rain jacket   │ │ when showers are forecast
│ │  [≈]  │   │█████│  │  [☂] (on floor) │ │
│ │ pad ──┘   │▓▓▓▓▓│  └─ field guide    │ │ pack silhouette FLOOD-FILLS as volume
│ │  [=]      │░░░░░│      [▤] 1lb4oz    │ │ fills: ░ empty ▓ nearly ▉ full
│ │ socks ─── ╰─────╯ ─── headlamp [☼]   │ │
│ │  [⌒⌒]   strapped outside: pad, pot   │ │
│ │                    ⚖ 31 lb           │ │ spring scale, needle swings
│ └─────────────────────────────────────┘ │
│ Volume 48 of 55 L  ·  31 lb  "like      │
│ carrying a sleepy cub"                  │ storybook weight adjective
│ [Big 3][Kitchen][Clothes][Ten Ess.][Food][Extras]│ 44 tabs
│ ┌─────────────────────────────────────┐ │
│ │ ☑ Rain jacket    11oz  ·  ☐ Puffy   │ │ 2-column toggle grid, 52pt cells;
│ │ ☑ Wool socks ×2   6oz  ·  ☐ Cotton  │ │ ☑ in pack, ☐ on floor, ⇧ outside
│ │ ☑ Headlamp        3oz  ·  ⇧ Ukulele │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │  [Like last time]   Close the pack ▸│ │ 52
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

- **Over capacity:** extra items can be **strapped outside** (up to 3). They show on the hiker sprite, and they risk snagging in brush or getting soaked in rain. A margin note says so.
- **Weight words:** < 15 lb *light as a jay*; 15-25 *a comfortable load*; 25-35 *like carrying a sleepy cub*; 35-45 *like carrying a grumpy cub*; 45+ *like carrying a whole elk calf, and the elk calf has opinions*.
- **Close the pack** leads to the **packing page**, the narrator reading the contents as prose (Section 2.5).

### 8.10 The drive (Chapter Four)

```
┌─────────────────────────────────────────┐
│ Score: 9 of 120             ≡ Sound:on  │
│ ┌─────────────────────────────────────┐ │
│ │ US 101 curving along Lake Crescent; │ │
│ │ Storm King above; lake cycles; the  │ │
│ │ little car (player's color) moves   │ │
│ │ 1px per frame along the road        │ │
│ └─────────────────────────────────────┘ │
│ Chapter Four · US 101 · Morning · ⛅    │
│                                         │
│ The lake was the color of a cold       │
│ spoon. At the far end there was a diner │
│ with a sign that said PIE, which is     │
│ the most persuasive word in English.    │
│ ┌─────────────────────────────────────┐ │
│ │ Stop for pie           ⏱ +45 min ♥ │ │ cost icons instead of odds
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Keep driving                  sure  │ │
│ └─────────────────────────────────────┘ │
│   [Pack]     [Map]    [Guide]   [Book]  │
└─────────────────────────────────────────┘
```

Drive pages (2-5 per trip, depending on destination) use the `road` and `town` bases: Port Angeles, Lake Crescent, Forks, Sequim, the Upper Hoh Road with elk on it, and Forest Service gravel to the Upper Dungeness. Optional stops include a fictional diner (*The Huckleberry Skillet*), a fictional last-chance store in Forks (*Twisted Spruce Trading Post*) where forgotten items can be bought at higher prices, and gas. **Start time matters**, since a late start shortens Day 1.

### 8.11 The trailhead: "Last look"

```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ TRAILHEAD: the car, the kiosk, the  │ │
│ │ routed wooden sign HOH RIVER TRAIL  │ │
│ │ GLACIER MEADOWS 17.4                │ │
│ └─────────────────────────────────────┘ │
│ Hoh River Trailhead · 9:40 am · ☀       │
│                                         │
│ Robin stood by the car and looked at    │
│ the pack, and the pack looked back.     │
│ Was there anything to leave behind?     │
│ ┌─────────────────────────────────────┐ │
│ │ ☐ Ukulele 2lb   ☐ Watermelon 8lb    │ │ tap to leave in the car
│ │ ☐ Camp chair 1lb ☐ 2nd book 10oz    │ │
│ └─────────────────────────────────────┘ │
│ Pack: 33 lb → 23 lb                     │
│ ┌─────────────────────────────────────┐ │
│ │      Start walking  ▸               │ │ 52 → Chapter Five: Day One
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 8.12 Trail page (narration only)

```
┌─────────────────────────────────────────┐
│ Score: 14 of 120            ≡ Sound:on  │
│ ┌─────────────────────────────────────┐ │
│ │ HALL OF MOSSES: maples in moss,     │ │
│ │ light shafts (dither), hiker small  │ │
│ │ at lower left; a slug, 1px yellow   │ │ ← hidden hotspot (tap: look → +1)
│ └─────────────────────────────────────┘ │
│ Day 1 · Morning · Hoh valley · 600 ft ✎ │ ✎ = something here is sketchable
│                                         │
│ The maples here wore so much moss that  │
│ they looked like they were dressed for  │
│ a much colder party. Everything was     │
│ green, and the green was dripping.      │
│                                         │
│                 - 18 -                  │
│ ┌─────────────────────────────────────┐ │
│ │        Turn the page  ▸             │ │
│ └─────────────────────────────────────┘ │
│   [Pack]     [Map]    [Guide]   [Book]  │
└─────────────────────────────────────────┘
```

**Tap the picture = KQ's LOOK.** A Sierra pop-up box appears over the picture (white, double dark-red border, black text). It is dismissed with a tap, costs no game time, and gives +1 score the first time:

```
 ┌───────────────────────────────────┐
 │╔═════════════════════════════════╗│
 │║ A banana slug, yellow as a      ║│
 │║ dropped crayon, was making its  ║│
 │║ way across the trail at the     ║│
 │║ speed of a very slow idea.      ║│
 │║        [ Sketch ]  [ OK ]       ║│ 44pt buttons
 │╚═════════════════════════════════╝│
 └───────────────────────────────────┘
```

### 8.13 Decision page, Why note, and compass roll

```
┌─────────────────────────────────────────┐
│ Score: 22 of 120            ≡ Sound:on  │
│ ┌─────────────────────────────────────┐ │
│ │ HOH BRAIDS: three milky channels,   │ │
│ │ elk on the far gravel, a dipper on  │ │
│ │ a rock mid-stream (hotspot)         │ │
│ └─────────────────────────────────────┘ │
│ Day 1 · 3:10 pm · Hoh braids · ☀ July  │
│                                         │
│ The bridge was gone, and the river had  │
│ split into three gray ropes. The far    │
│ bank looked farther than it had a       │
│ minute ago. Robin...                    │
│ ┌─────────────────────────────────────┐ │
│ │ Wade across now          ♦ 55-75% ⓘ│ │ odds tag; ⓘ / long-press = Why
│ └─────────────────────────────────────┘ │ range = missing knowledge
│ ┌─────────────────────────────────────┐ │
│ │ Camp here, cross at dawn  ⏱ night ✓│ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Turn back toward the car       sure │ │
│ └─────────────────────────────────────┘ │
│   [Pack]     [Map]    [Guide]   [Book]  │
└─────────────────────────────────────────┘
```

The **Why note** opens as a bottom sheet (Section 3.2). The factors are rows with item icons, and "+ watch the dipper (tap the picture)" appears as a *suggestion* when an unexploited helper is on screen. **Critical (♦) choices** play the compass roll in the picture area:

```
 ┌─────────────────────────────────────┐
 │              N                      │
 │        ╭───────────╮                │  green arc = p (success)
 │      ╱  ████████    ╲               │  yellow = mishap
 │  W  │ ███   ↗    ░░ │  E            │  red = serious
 │      ╲  ░░░▒▒▒      ╱               │  needle spins ~1.2 s, ticks,
 │        ╰───────────╯                │  lands; tap to skip
 │              S                      │
 └─────────────────────────────────────┘
```

### 8.14 Outcome page with margin notes

```
┌─────────────────────────────────────────┐
│ Score: 22 of 120            ≡ Sound:on  │
│ ┌─────────────────────────────────────┐ │
│ │ Same braids; hiker on the far bank, │ │
│ │ sitting, wringing a sock (pose)     │ │
│ └─────────────────────────────────────┘ │
│ Day 1 · 3:40 pm · Hoh braids · ☀       │
│                       ┊ ✎ Socks: wet    │ margin notes (right 30%),
│ The second channel    ┊   (1 dry pair   │ 8x14 font in dark gray,
│ was deeper than it    ┊   left)         │ pencil icon bullets
│ looked, which is a    ┊ ✎ Time: -30 min │
│ thing second channels ┊ ✎ Feet: ok→sore │
│ are famous for. Robin ┊                 │
│ reached the far bank  ┊                 │
│ wet to the knees, and │                 │
│ the poles were the    │                 │ item that mattered is underlined
│ reason it wasn't worse.                 │ (tap: shows its pack card)
│ ┌─────────────────────────────────────┐ │
│ │        Turn the page  ▸             │ │
│ └─────────────────────────────────────┘ │
│   [Pack]     [Map]    [Guide]   [Book]  │
└─────────────────────────────────────────┘
```

### 8.15 Camp page: the chore grid

```
┌─────────────────────────────────────────┐
│ Score: 40 of 120            ≡ Sound:on  │
│ ┌─────────────────────────────────────┐ │
│ │ ELK LAKE camp: tent (if pitched),   │ │ sky palette steps Day → Dusk →
│ │ lake (cycling), firs; Canada jay    │ │ Blue hour → Night as chores pass
│ │ on a branch (hotspot)               │ │
│ └─────────────────────────────────────┘ │
│ Day 2 · 5:20 pm · Elk Lake · ☀ · 2,600ft│
│ Robin dropped the pack, and the pack    │
│ made the sound of a job well done.      │
│ ┌──────────────────┬──────────────────┐ │
│ │ ▲ Pitch tent  ✓  │ ≈ Get water 30m  │ │ 2×4 tiles, 60pt tall
│ ├──────────────────┼──────────────────┤ │ ✓ done; dim = can't (missing item,
│ │ ♨ Cook dinner    │ ▣ Store food     │ │   shows why on tap)
│ ├──────────────────┼──────────────────┤ │ time cost shown per tile
│ │ ✎ Sketch  20m    │ ☼ Watch sunset   │ │ "Watch sunset" needs a warm layer
│ ├──────────────────┼──────────────────┤ │
│ │ ✉ Write journal  │ ☾ Go to sleep ▸  │ │ Sleep → Night page
│ └──────────────────┴──────────────────┘ │
│   [Pack]     [Map]    [Guide]   [Book]  │
└─────────────────────────────────────────┘
```

**Cook dinner** opens the **food bag** sheet. Remaining meals are shown as pixel icons, you tap one to eat it, and there is an optional *"add a treat"*. If the stove is missing or out of fuel, or there's no lighter, the tile reads *"Cold dinner"*, with a funny line. **Get water** requires a filter, tablets or boiling, and drinking untreated water (the "just drink from the creek" choice) carries a hidden later-days risk. **Store food:** a canister, a bear wire where one exists, or nothing (which feeds the night-event roll). The order of chores is free, but **the light keeps moving**: cook after dark without a headlamp and it's a funny, slower page.

### 8.16 Night page and morning page

```
┌─────────────────────────────────────────┐        ┌─────────────────────────────────────────┐
│ (dark page: black paper, gray text)     │        │ (dawn remap; white paper)               │
│ ┌─────────────────────────────────────┐ │        │ ┌─────────────────────────────────────┐ │
│ │ NIGHT: tent glowing faintly (head-  │ │        │ │ DAWN at Glacier Meadows; mist bands │ │
│ │ lamp), stars cycling, a bear-shaped │ │        │ │ in the valley; marmot on a rock     │ │
│ │ shadow passing at the edge          │ │        │ └─────────────────────────────────────┘ │
│ └─────────────────────────────────────┘ │        │ Day 3 · 6:10 am · ☀ · cold              │
│ Night 2 · Elk Lake · clear · 38°F       │        │ The marmot stood up very straight and   │
│ Something large walked past the tent    │        │ whistled twice, which, as everyone      │
│ in the dark, considered the canister,   │        │ knows, is marmot for weather coming.    │
│ found it entirely unreasonable, and     │        │ ┌─────────────────────────────────────┐ │
│ went on to more reasonable things.      │        │ │ Go on to Glacier Meadows  ✓ permit  │ │
│                                         │        │ └─────────────────────────────────────┘ │
│ And far away, the river went on         │        │ ┌─────────────────────────────────────┐ │
│ talking to itself.                      │        │ │ Stay another day here  ☾  (permit?) │ │
│ ┌─────────────────────────────────────┐ │        │ └─────────────────────────────────────┘ │
│ │        Turn the page  ▸             │ │        │ ┌─────────────────────────────────────┐ │
│ └─────────────────────────────────────┘ │        │ │ Day trip: Blue Glacier moraine   ⓘ  │ │
└─────────────────────────────────────────┘        │ └─────────────────────────────────────┘ │
                                                   │ ┌─────────────────────────────────────┐ │
                                                   │ │ Head for home                 sure  │ │
                                                   │ └─────────────────────────────────────┘ │
                                                   └─────────────────────────────────────────┘
```

Changing the plan mid-trip (staying an extra night, or skipping ahead to a camp you didn't reserve) is allowed, but it is noted on the permit. A backcountry ranger may check permits (*"It's all right this once. The camp was half empty, and you looked honest."*), and in quota areas like Seven Lakes Basin it costs a polite talking-to and a Score point. It never becomes a punishment spiral.

### 8.17 Map / Guide / Journal / Pack tabs (one modal, four tabs)

```
┌─────────────────────────────────────────┐
│ ✕ Close    [Map][Guide][Journal][Pack]  │ 44 tabs
│ ┌─────────────────────────────────────┐ │
│ │ MAP: endpaper art; the route as a   │ │  Map: dotted route (done = solid),
│ │ dotted line; done = solid; camps as │ │  hiker icon "you are here",
│ │ tents; tiny hiker = you; tap a camp │ │  tap a camp: miles/gain/its page
│ │ for its distance and elevation      │ │
│ └─────────────────────────────────────┘ │
│ Today: Elk Lake → Glacier Meadows       │
│ 2.4 mi · ↗ 1,700 ft · "a short, steep   │
│ day, with a ladder in it"               │
│ Elevation profile (pixel line):         │
│   ___/‾‾‾                               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ✕ Close    [Map][Guide][Journal][Pack]  │
│ ┌──────── FIELD GUIDE ────────────────┐ │
│ │ [Trees][Flowers][Ferns][Birds]      │ │ 44 tabs (scroll)
│ │ [Mammals][Water][Sky][Curio][Rare]  │ │
│ │ ┌───────┐ ┌───────┐ ┌───────┐       │ │ grid of plates, 3 across
│ │ │sketch │ │ ????  │ │printed│       │ │ sketch = your line drawing
│ │ │marmot │ │       │ │ elk   │       │ │ ???? = not yet seen
│ │ └───────┘ └───────┘ └───────┘       │ │ printed = book plate (seen)
│ │ Olympic marmot    ✓seen ✎fine       │ │
│ │ "Found in these mountains and       │ │
│ │ nowhere else on Earth. Whistles     │ │
│ │ when worried, which is often."      │ │
│ │                         (fox doodle)│ │
│ └─────────────────────────────────────┘ │
│ Field Guide: 23 of 104                  │
└─────────────────────────────────────────┘
```

**Journal tab:** the **Table of Contents** (chapters with their retitled names, tap to reread) and the hiker's **diary** lines per day (*"Day 2. Elk Lake. Feet: damp. Spirits: high. Slugs: 9."*). **Pack tab:** current contents with states (wet, used, lost, outside), food left by meal, water carried, weight now, and the four conditions.

### 8.18 The Snowlamp plate

```
┌─────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ┌─────────────────────────────────────┐ │
│ │ TALL PLATE 160x320                  │ │
│ │ blue-hour sky, first stars (22)     │ │
│ │ the summit ridge in dark blue       │ │
│ │                                     │ │
│ │ snow field in pale blue (15→AAAAFF) │ │
│ │                                     │ │
│ │            ·  ✶  ·                  │ │ pseudo 19 glow: 1px → 5x5 star,
│ │                                     │ │ rings radiate (phased cycle)
│ │  tiny hiker kneeling, headlamp OFF  │ │
│ │ ╔═════════════════════════════════╗ │ │
│ │ ║ And there, where the snow was   ║ │ │ Sierra pop-up box over the plate
│ │ ║ bluest, something small was     ║ │ │
│ │ ║ shining.                        ║ │ │
│ │ ╚═════════════════════════════════╝ │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Sketch it                           │ │ no odds; no diamonds; no costs
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Pick it to take home                │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Just look                           │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

The toolbar and status line are **hidden** on full-bleed plates. It is the only time the chrome goes away, and that's what makes the moment feel singular.

### 8.19 The End and the back cover

```
┌─────────────────────────────────────────┐        ┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │        │       THE HIKER WHO FORGOT              │
│ │ PLATE: the closed book on the car   │ │        │            THE STOVE                    │
│ │ dashboard at golden hour; trailhead │ │        │  ┌───────────────────────────────────┐  │
│ │ sign; the margin fox asleep on the  │ │        │  │ route map, dotted; tents; ★ where │  │
│ │ cover                               │ │        │  │ the Snowlamp was                  │  │
│ └─────────────────────────────────────┘ │        │  └───────────────────────────────────┘  │
│                                         │        │  Miles 19.1   High pt 5,474 ft          │
│               T H E   E N D             │        │  Nights 2     Pages 52   Sketches 4     │
│        (decorated EGA letters; for the  │        │  Score 88 of 120  Field Guide 31/104    │
│         Snowlamp ending: gold border,   │        │  WHAT THE PACK TAUGHT                   │
│         cycling)                        │        │   Every day: wool socks, rain jacket    │
│                                         │        │   Never:     ukulele                    │
│ Robin drove home with the windows down, │        │   Wished:    a lighter                  │
│ smelling of woodsmoke and wet cedar,    │        │  AND SO THE HIKER LEARNED               │
│ which is the correct smell for a person │        │   that a lighter weighs one ounce.      │
│ who has been somewhere.                 │        │ ┌─────────────────────────────────────┐ │
│ ┌─────────────────────────────────────┐ │        │ │       Plan another trip  ▸          │ │
│ │       Turn to the back cover ▸      │ │        │ └─────────────────────────────────────┘ │
│ └─────────────────────────────────────┘ │        │ [ Reread ]          [ Share the cover ] │
└─────────────────────────────────────────┘        └─────────────────────────────────────────┘
```

### 8.20 Perilous death page

```
┌─────────────────────────────────────────┐
│ Score: 61 of 120            ≡ Sound:on  │
│ ┌─────────────────────────────────────┐ │
│ │ The scene, remapped to grays        │ │ (0/8/7/15 only)
│ │ ╔═════════════════════════════════╗ │ │
│ │ ║ THE PACIFIC READ THE TIDE TABLE ║ │ │ Sierra box, red border
│ │ ║ FOR YOU                         ║ │ │
│ │ ║ Robin had a tide table. Robin   ║ │ │
│ │ ║ did not read the tide table.    ║ │ │
│ │ ║ The headland was not surprised. ║ │ │
│ │ ╚═════════════════════════════════╝ │ │
│ └─────────────────────────────────────┘ │
│ RANGER'S NOTE                           │
│ Some headlands can only be rounded at   │
│ low tide. Know the tide for each point, │
│ and use the overland trails.            │
│ ┌─────────────────────────────────────┐ │
│ │  ↶ Turn back a page                 │ │ 52: restore before the ♦ choice
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │  ⟲ Restart the trip (keep the plan) │ │ 52
│ └─────────────────────────────────────┘ │
│ [ Close the book ]                      │ 44
└─────────────────────────────────────────┘
```

### 8.21 Settings (the "≡ / Book" menu)

```
┌─────────────────────────────────────────┐
│ ✕   THE BOOK                            │
│ Save is automatic. (bookmark ribbon)    │
│ ──────────────────────────────────────  │
│ Odds        [Numbers] [Words] [Hidden]  │ 44 segmented
│ Text        [Pixel] [Book] [Large]      │
│ Pictures    [Draw-in] [Wipe] [Instant]  │
│ Sound       [On] [Off]   Volume ─●──    │
│ Read to me  [Off] [On]                  │ speechSynthesis narration (offline voices)
│ The fox     [Quiet] [Helpful] [Off]     │
│ Units       [mi/ft] [km/m]              │
│ Paper       [Follows the day] [Light]   │
│              [Dark]                     │
│ ──────────────────────────────────────  │
│ Mode: Storybook (set when the book      │
│ began; Perilous is chosen per book)     │
│ [ Close this book and go to the shelf ] │
│ [ About / Colophon / Credits ]          │
└─────────────────────────────────────────┘
```

**Read to me** uses the browser's `speechSynthesis` with an on-device voice, so it works offline on iOS. It reads each page aloud, which is the most literal way to make playing "feel like reading the book" (and lovely for a parent and a child playing together).

---

## 9. Audio: PC-speaker charm, optional

### 9.1 The sound engine

The 1984 IBM PC speaker was a **single square-wave voice**. We imitate it honestly with Web Audio:

```
OscillatorNode(type "square") → GainNode (envelope, master ≈ 0.06) → BiquadFilter(lowpass ~3.5 kHz, takes the harsh edge off) → destination
sequencer: [[note, ms], ...], monophonic, 1 voice; rests = gain 0
```

- **Monophonic by default.** A setting enables a *Tandy* mode with 3 voices plus noise (the PCjr/Tandy versions of KQ had 3-voice sound). It's an easter egg for people who remember.
- **iOS unlocking:** the AudioContext is created or resumed on the first tap (Begin / Continue). When supported (Safari 16.4+), `navigator.audioSession.type = "ambient"` makes the game **respect the ring/silent switch** and mix politely with the player's own music.
- **Status line:** `Sound: on` / `Sound: off` is tappable, exactly as in KQ.
- **No continuous music by default.** Like AGI games, sound is mostly *events and jingles*. An optional **ambient bed** (rain as filtered noise, surf, a creek) can be turned on, which is not period-correct but is cozy.

### 9.2 Cue list

| Cue | When | Notes (square wave; ms) |
|---|---|---|
| **Title theme** "The Trail Goes Up" | Bookshelf | 8 bars, pentatonic, see 9.3 |
| Page turn | Every turn | Two clicks: 1200 Hz 12 ms, 900 Hz 12 ms |
| Chapter fanfare | Chapter title pages | G4 C5 E5 G5 (90 ms each), held C6 (300 ms) |
| Look box | Picture tap | A5 30 ms |
| Pack bloop | Item into pack | Pitch slide 300 → 600 Hz over 60 ms |
| Pack thunk | Pack full / item refused | 110 Hz 120 ms |
| Stamp | Permit stamped | Noise burst 40 ms + 80 Hz 60 ms |
| Compass roll | ♦ choices | Ticks every 40 ms that slow to every 160 ms, then a landing chord: success C5-E5-G5, mishap E5-D5, serious C5-G4-C4 |
| Success | Good outcome | C5 E5 G5 (60 ms each) |
| Mishap | Severity 1-2 | G4 F4 (100 ms each), slightly flat |
| Serious | Severity 3-4 | C4 B3 A#3 A3 (140 ms each) |
| Sketch | While sketching | Soft 2 kHz ticks at 30 ms, one per drawn line, at gain 0.02 |
| Marmot whistle | Marmot | 2,800 Hz sine-ish (square through a heavy lowpass), 180 ms, twice |
| Elk bugle | Elk in Sept-Oct | Slide 400 → 1,800 Hz over 900 ms, then three grunts at 120 Hz |
| Varied thrush | Fog pages | One long tone of 3,200 Hz with 6 Hz vibrato, 1,200 ms, then silence |
| Pacific wren | Rain-forest dawn | 30 random notes between 4 and 6 kHz at 25 ms: a "too big" trill |
| Raven | Ridges | Two croaks: 220 Hz with pitch drop, 150 ms |
| Jay | Theft | B5 G5 (60 ms) and a flutter |
| Campfire | Camp at night (if allowed) | Random 1-2 ms clicks (crackle) at gain 0.015 |
| **The Snowlamp motif** | The glow plate | C5 E5 G5 C6 E6 (220 ms each), then C6 held 1,600 ms with a 4 Hz tremolo. Played **once**, never anywhere else |
| The End | The End plate | The theme's first 4 bars, slower, ending on a held tonic |
| Death dirge (Perilous) | Death page | A short minor descent: E4 D4 C4 B3 A3 (250 ms each), a mischievous nod to the Sierra funeral dirge without quoting any real melody |

### 9.3 Title theme (original, in the spirit of PC-speaker tunes)

```
tempo 132 bpm, square, C major pentatonic, ♩ = quarter note
| E4♩  G4♩  A4♩  C5♩  | A4♩  G4♩  E4♪ D4♪ E4♩ |
| G4♩  A4♩  C5♩  D5♩  | E5𝅗𝅥       D5♩  C5♩  |
| A4♩  C5♩  D5♩  E5♩  | D5♩  C5♩  A4♪ G4♪ A4♩ |
| G4♩  E4♩  D4♩  E4♩  | C4𝅗𝅥.             rest |
```

It is simple, rising and walking-paced: a melody that "climbs" and comes home. The day's chapter fanfare reuses bar 2.

---

## 10. Tone Guide and Sample Pages

### 10.1 The voice in ten rules

1. **Read it aloud.** If a sentence doesn't sound good spoken to a seven-year-old *and* their parent, rewrite it.
2. **Short sentences, concrete nouns.** Cedar, gravel, wool, steam, a cold spoon. Few adjectives, all of them earned.
3. **One small surprise per page.** A comparison, a joke, or a true fact said sideways (*"the speed of a very slow idea"*).
4. **The narrator is kind, not cute.** Gentle humor aims at weather, jays, rivers, gear and the hiker's optimism. Never at the player's intelligence.
5. **Real places, real names, real nature.** Olympic's actual trails, peaks, rivers, plants and animals, used correctly. Private businesses always get fictional names (*Mossback Mercantile, The Huckleberry Skillet, Twisted Spruce Trading Post, The Steaming Fern Lodge, Stillwater Lodge*). Before shipping, check that none of these matches a real business on the Peninsula.
6. **Safety is told as story, not lecture.** Rangers and outcomes carry the lessons. Only the Ranger's Note (on Perilous pages) and the field guide speak plainly.
7. **Animals don't talk.** The narrator translates in italics: *Not that way,* the elk seemed to say.
8. **Items are characters.** The pack, the stove, the socks and the old book all get small personalities. The narrator notices what you brought, and what you didn't.
9. **Turning back is brave.** Every retreat is narrated with respect.
10. **Leave room for quiet.** At least once per chapter, a page where nothing happens but beauty. *Turn the page* is the only choice.

**Words to love:** cedar, scree, tarn, krummholz, alpenglow, cairn, moraine, gravel bar, nurse log, switchback, saddle, braid (of a river), blue hour, huckleberry.
**Words to avoid:** epic, crush (as in "crush miles"), insane, loot, grind, any brand name, and any gamer jargon (HP, XP, DPS) in the prose.

### 10.2 Sample pages

All samples below are original. The hiker is called **Robin** (*they*). Picture specs are in brackets.

---

**Sample 1: The packing page (Chapter Three, last page)**
`[pack spread, closed pack standing upright; margin fox asleep]` · *Robin's apartment · Evening*

> Into the pack went one small green tent, a sleeping bag that still smelled faintly of last summer, a pot that had seen better soups, two pairs of wool socks and one pair of cotton socks (we will speak of these later), the old field guide, and a great deal of cheese. The pack was full. It looked pleased about it.

`[ Turn the page ▸ ]`

---

**Sample 2: A lovely moment (Royal Basin)**
`[Royal Lake, mid-afternoon; Mount Deception's snowy wall behind; a marmot on a boulder; lake cycling]` · *Day 1 · 3:30 pm · Royal Lake · 5,100 ft · ☀*

> The trail stepped out of the trees and there, all at once, was the lake, holding the whole mountain upside down as if it were no trouble at all. A marmot on a warm rock looked at Robin, decided Robin was not an emergency, and went back to sunbathing.

`[ Sketch the marmot  ✎ 20 min ]`
`[ Find a campsite ]`
`[ Sit for a while ]`

---

**Sample 3: A full-bleed plate (first sight of Olympus from the High Divide)**
`[tall plate: Hoh valley in blue haze; Mount Olympus and the Blue Glacier filling the far half; heather foreground; tiny hiker; toolbar hidden]`

> *The ridge ended in sky, and across the whole deep valley of the Hoh stood Mount Olympus, wearing its glaciers the way an old king wears a cloak he has had for a very long time.*

`(tap anywhere)`

---

**Sample 4: An animal helper (bear on the High Divide)**
`[subalpine slope, huckleberry bushes in red-and-green fall color; black bear 40 px down-slope eating; trail crossing the slope]` · *Day 2 · 11:00 am · High Divide · 5,200 ft · ☀ · September*

> Below the trail, a black bear was eating huckleberries with the total concentration of someone who has only six weeks to eat a whole winter's worth. It had not noticed Robin yet. The trail went right past its patch.

`[ Wait for it to wander off   ⏱ ~45 min   sure ]`
`[ Make some noise and walk on              85% ⓘ ]`
`[ Sketch it from here   ✎ 20 min ]`

*(Why for "Make some noise...": base 80; +5 for trekking poles (you look bigger, and they click on rock); +5 because the bear is downhill and busy; −5 because a companion is "afraid of bears" and makes the bear curious. If it goes badly, the bear stands up to look and you back away slowly, losing 20 minutes and a heartbeat or two. It is never more than that.)*

---

**Sample 5: A mild mishap (Canada jay)**
`[Lunch Lake shore; a gray jay on a fir branch with something round and pale in its beak; hiker sprite with empty hands raised]` · *Day 2 · 12:40 pm · Lunch Lake · 4,450 ft · ⛅*

> Robin set the tortilla on a rock for one second, which is exactly one second longer than a Canada jay needs. Somewhere in a subalpine fir, a very small bird was now having a very large lunch.

`margin:` ✎ Food: −1 lunch (the jay) · ✎ Lesson: noted
`[ Turn the page ▸ ]`

---

**Sample 6: A critical decision with odds (the user's own example: Olympus as one night, with day-hike gear)**
`[the Glacier Meadows ladder in the washed-out avalanche chute; dusk remap; sky violet; hiker small at the bottom; no tent on the pack sprite, just a daypack]` · *Day 1 · 7:50 pm · below Glacier Meadows · 4,100 ft · ☀ · September*

> It had been a very long day, and it was turning into a very short evening. Ahead, a ladder climbed the raw gray side of the washout, and above it the light was going pink and then not pink. Robin's daypack held a sandwich, a light jacket, and good intentions.

`[ Climb the ladder before dark       ♦ 55% ⓘ ]`
`[ Hunker down here for the night     ⏱ cold   sure ]`
`[ Walk back down toward Elk Lake            70% ⓘ ]`

*(Why for "Climb the ladder": base 75; −10 no headlamp; −10 tired after 17 miles; −5 dusk light on wet rock; +5 trekking poles. "If it goes badly: a slip on the rungs; a hurt ankle, far from help." The Why for "Walk back down" lists −20 no headlamp and +10 the trail is easy, with a doe on the trail (if seen, +5).)*

---

**Sample 7: A bad outcome (the cold night)**
`[night page; black paper; a hiker sitting under a tree wrapped in a crinkly emergency blanket that glints (pseudo 22); stars]` · *Night 1 · below Glacier Meadows · 31°F · clear*

> The night was clear, which is lovely to look at and terrible to sleep in. The emergency blanket crackled every time Robin breathed, so Robin tried breathing less, which did not help. Some time after midnight the stars got very bright and Robin's toes got very quiet.

`margin:` ✎ Warm: ❄ cold · ✎ Spirits: ♥♥○○○ · ✎ Feet: numb
`[ Turn the page ▸ ]` *(→ a dawn decision page: "Head down to the river" (sure) / "Push on to the glacier" (♦ 20%, the narrator gently notes "The mountain will keep.")*

---

**Sample 8: With a Little Help (Storybook-mode rescue)**
`[Olympus Guard Station porch; a ranger with a thermos; hiker wrapped in a wool blanket; afternoon light]` · *Day 2 · 4:15 pm · Olympus Guard Station · 950 ft · ☀*

> The ranger's name was Ines, and she had a thermos, which is the second-best thing a person can have on a cold mountain. The first-best thing is someone who knows where you are. "You're all right," she said, the way people say it when it has just become true.

`[ Turn the page ▸ ]` → *The End, With a Little Help*

---

**Sample 9: The End, Sooner Than Planned**
`[trailhead sign in soft rain; car; hiker sprite taking off the pack]` · *Day 2 · 2:00 pm · Hoh River Trailhead · ☂*

> Robin had meant to sleep beside a glacier, and instead was going to sleep beside a pizza, and found, on reflection, that this was also a fine place for a story to end. The mountain would keep. Mountains are very good at that.
>
> **THE END,** *sooner than planned*

`[ Turn to the back cover ▸ ]`

---

**Sample 10: A fuzzy-odds tide decision (coast)**
`[headland base; cliff; a round red-and-black trail target sign on a tree above a rope ladder; surf cycling at the rocks' foot]` · *Day 2 · 1:20 pm · south of Third Beach · ⛅*

> The beach ran out at a wall of rock with the sea folding itself against the bottom. Up the cliff hung a rope ladder and a round red-and-black sign, the coast's way of saying *there is another way.* Robin thought about the tide table, which was at home, on the fridge.

`[ Round the point on the rocks       ♦ ?? ⓘ ]`  *(no tide table: knowledge too thin to show a number)*
`[ Climb the ladder and go overland    ⏱ +1 hr   sure ]`
`[ Wait and watch the water           ⏱ ~1 hr   ]`

*(Choosing "Wait and watch" for an hour adds knowledge, and the tag on "Round the point" sharpens to `20-50%` or `60-90%` depending on whether the tide is rising or falling. Learning by looking is a real skill, and the game rewards it.)*

---

**Sample 11: The Snowlamp (the glow sequence, pages 1, 4 and 6)**

Page 1, arrival:
`[upper Royal Basin; tarn; moraine; snowfield; Mount Deception; no flowers anywhere in the picture]` · *Day 2 · 4:40 pm · upper Royal Basin · 6,000 ft · ☀*

> Up here there were no flowers. There was stone, and snow, and a little round tarn the color of a cold eye, and a wind that had come a long way to say nothing in particular. Robin looked anyway. That is what the old book had said to do. Or rather, not to do.

Page 4, blue hour (palette: snow → AAAAFF, sky → deep blue; headlamp beam drawn in 14):
> The sun went down behind the ridge, and the snow turned blue, the way snow does when it thinks no one is watching. Robin's headlamp made a small yellow room in the dark.

`[ Turn off the headlamp ]`
`[ Keep it on ]`
`[ Go to bed ]`

Page 6, the glow (tall plate, pseudo-color 19 radiating; chrome hidden):
> *And there, where the snow was bluest, something small was shining. Not like a lamp. More like a lamp remembering.*

`[ Sketch it ]` `[ Pick it to take home ]` `[ Just look ]`

---

**Sample 12: Sketch it (outcome) and The End of the Blank Page**
`[zoom 2x on the glow; lines drawing in GOLD on white paper, one by one]`

> Robin drew it twice, to be sure. The pencil had never once made a golden line before, and it never would again. By the time the second drawing was finished, the flower had gone back to being a small, ordinary-looking thing in the snow, and that seemed right too.

`margin:` ✎ Field Guide No. 104: *The Snowlamp* · ✎ sketched (fine)

Then the field guide page (plate): the gold sketch inside the once-empty box, and beneath it in the hiker's own hand:
> *Seen at the top of Royal Basin, after sunset. Left where it grows.*

And The End plate, gold-bordered:
> Robin came down the mountain with a light pack, wet boots, and a page that wasn't blank anymore. The flower stayed up there, in the snow, being exactly where it belonged.
>
> **THE END**

---

**Sample 13: A quiet page (nothing happens, beautifully)**
`[rain forest gravel bar at dawn; mist in hlines bands; elk silhouettes on the far side; wren hotspot]` · *Day 3 · 6:20 am · Five Mile Island · 780 ft · fog*

> In the morning the river was wearing the fog like a scarf. Across the gravel, the elk were already at breakfast, and a wren somewhere was singing a song far too big for anyone its size.

`[ Turn the page ▸ ]`

---

## 11. Appendix A: A Trip in Pages

This appendix storyboards the user's own example, *"go for Mount Olympus with day-hike gear in one night,"* next to the same destination planned well. It shows how the pack, the plan and the odds turn into different books.

### A.1 Volume: "The Hiker Who Packed a Sandwich" (badly planned)

**Plan:** Hoh River Trailhead to Glacier Meadows and back, **1 night**, September. **Pack:** daypack (20 L, 9 lb): sandwich ×2, bars, 1 L water and no filter, light fleece, cotton hoodie, emergency blanket, phone, no headlamp, trekking poles. The ranger raised an eyebrow on the permit page (*"Seventeen miles and three thousand feet before dinner? That's a long day, even for an elk."*). The margin fox tapped its wrist the entire time.

| Pg | Type | What happens | Choice / odds |
|---|---|---|---|
| 31 | Chapter title | *Day One: In Which the Trail Goes On and On* (later retitled *In Which the Ladder Was Too Far*) | Turn |
| 32 | Trail | Hall of Mosses, glorious. A slug hotspot. | Turn |
| 33-36 | Trail | Five Mile Island, elk, Olympus Guard Station (a ranger: *"Glacier Meadows tonight? Hm."*) | Turn |
| 37 | Decision | Water's gone at mile 10. *Drink from the creek* (untreated, 85% no trouble later) / *Ask the ranger for advice* (knowledge) | |
| 38-40 | Trail | High Hoh Bridge, then the climb. Late afternoon. Feet: sore. | Turn |
| 41 | Decision ♦ | Sample 6: the ladder at dusk, **55%** / hunker down (sure, cold) / back down toward Elk Lake (70%) | |
| 42a | Outcome (success, 55%) | Up the ladder by the last light. Glacier Meadows in the dark, with no tent and no stove. | → Night (cold) |
| 42b | Outcome (mishap) | A slip on a rung; scraped shin; minus 30 min. Up in full dark. | → Night (colder) |
| 42c | Outcome (serious) | An ankle rolled at the top. **Trip-ending track begins.** | → Rescue track |
| 43 | Night | Sample 7, the cold night. Warm: ❄. Spirits ♥♥. | Turn |
| 44 | Morning decision | *Head down* (sure) / *Push on to the glacier* (♦ **20%**; no crampons, ice axe, rope or partner; in Perilous Mode this is "The Glacier Keeps Things") | |
| 45-50 | Trail (down) | A long walk out, beautiful in the way things are when you're sad and tired. A dipper. Tokens of grace. | Turn |
| 51 | The End | *THE END, sooner than planned* (Sample 9) | Back cover |
| — | Back cover | *What the pack taught:* Wished for: a headlamp, a warm jacket, a stove, a tent, a water filter, and one more day. *And so the hiker learned that mountains do not count miles the way maps do.* | Plan again |

**On the next volume** the ranger says, *"Back again! This time, maybe take four days."* The margin fox points at the puffy jacket.

**How the pack changes this book (a sample of the combinations):**
- **Headlamp packed:** the ladder becomes 70%, and "back down to Elk Lake" becomes sure.
- **Puffy + warm hat:** the cold night drops from Severity 2 to Severity 1, and Spirits recover by morning.
- **Satellite messenger:** the 42c rescue becomes certain and fast (*With a Little Help*), and the waiting page is shorter.
- **Water filter:** page 37 disappears (it becomes a "Fill bottles at the creek" margin note).
- **A companion "who knows knots" plus a rope:** opens a different 44, a safer look at the glacier edge (still not a summit).
- **The old field guide (1 lb 4 oz) in a 9 lb daypack:** Spirits +1 from identifying the Hall of Mosses' club moss, but −5% on the ladder for weight and fatigue. It's a funny, real trade-off.

### A.2 Volume: "The Snowlamp of Glacier Meadows" (planned well)

**Plan:** Hoh River Trailhead, **4 nights**, late July: Lewis Meadow → Glacier Meadows ×2 (layover) → Olympus Guard Station → out. **Pack:** 55 L, 31 lb with food: tent, 20°F bag, puffy, rain shell, wool socks ×3, stove + fuel + lighter, filter, bear canister, headlamp, poles, map, field guide, journal + colored pencils, first aid, satellite messenger. A watermelon was left in the car at the trailhead.

| Day | Chapter (retitled at day's end) | Highlights | Key decisions |
|---|---|---|---|
| 1 | *In Which the Moss Was Green* | Hall of Mosses, 5 Mile Island, elk on the gravel; camp at Lewis Meadow; first sketch (elk) | A slug-counting flavor choice; dinner: ramen + cheese |
| 2 | *In Which We Wait for the River* | The High Hoh Bridge; the climb; a dipper at a side-creek ford | **Ford** (85% with poles and dipper) or wait (sure); **ladder** in afternoon light: 90% |
| 3 | *A Day of Rest* (layover) | Blue Glacier lateral moraine walk; climbers coming down from Snow Dome tell of crevasses (knowledge); marmot whistles weather for tomorrow | Sketch the glacier (fine); **watch the sunset**; **turn off the headlamp** → the glow (P ≈ 0.95 clear-sky × 0.95). **The Snowlamp: Just look** |
| 4 | *In Which a Jay Steals Lunch* | Down to Olympus Guard Station; Canada jay mishap; rain arrives as the marmot promised | Rain jacket: the narrator notices, approvingly |
| 5 | *In Which the River Goes On* | The walk out; the refrain; The End | — |

**The End of the Blank Page**, gold border. Field Guide: +9 entries. Score: 108 of 124.

---

## 12. Appendix B: Data shapes (for the merge step)

### B.1 A page

```json
{
  "id": "hoh.braids.ford",
  "type": "decision",
  "scene": "@node:hoh_river_braid_crossings",
  "sprites": ["hiker@near_bank:look", "dipper@rock_mid:bob?unseen(dipper)"],
  "caption": "auto",
  "text": "The bridge was gone, and the river had split into three gray ropes. The far bank looked farther than it had a minute ago. {hiker}...",
  "choices": [
    { "label": "Wade across now", "event": "ford.braided_river", "critical": true },
    { "label": "Camp here, cross at dawn", "sure": true, "cost": { "time": "until:06:30" }, "goto": "camp.makeshift" },
    { "label": "Turn back toward the car", "sure": true, "goto": "retreat.begin" }
  ]
}
```

### B.2 An event with odds, knowledge and outcomes

```json
{
  "id": "ford.braided_river",
  "base": 0.70,
  "mods": [
    { "if": "has:trekking_poles",                 "add": 0.10, "why": "Trekking poles",                     "icon": "poles" },
    { "if": "has:camp_sandals",                   "add": 0.05, "why": "Sandals for wading",                 "icon": "sandals" },
    { "if": "flag:watched_dipper",                "add": 0.05, "why": "You watched where the dipper crossed","icon": "dipper" },
    { "if": "flag:watched_elk_cross",             "add": 0.10, "why": "You saw where the elk crossed",       "icon": "elk" },
    { "if": "clock>=13:00 && month in [6,7,8]",   "add": -0.15,"why": "Afternoon snowmelt",                 "icon": "sun" },
    { "if": "weather.rain_last_24h",              "add": -0.10,"why": "Rain upstream",                      "icon": "rain" },
    { "if": "packWeightLb>40",                    "add": -0.05,"why": "Heavy pack",                         "icon": "scale" },
    { "if": "party.trait:strong_swimmer",         "add": 0.05, "why": "{name} is a strong swimmer",         "icon": "party" }
  ],
  "knowledge": [
    { "source": "ranger_asked:rivers",  "u": 0.10 },
    { "source": "has:map",              "u": 0.05 },
    { "source": "flag:scouted_ford",    "u": 0.10 }
  ],
  "ifBad": "A cold swim, wet gear, and something might float away.",
  "outcomes": {
    "success": { "page": "ford.success", "effects": ["socks.wet:1", "time:-20m"] },
    "mishap":  { "page": "ford.soaked",  "effects": ["socks.wet:all", "warm:-1", "time:-40m", "lose:random_outside_item:0.5"] },
    "serious": { "page": "ford.swept",   "effects": ["warm:-2", "lose:random_item", "injury:minor:0.5"], "lethal": true }
  }
}
```

### B.3 Item notices (Chekhov's pack)

Each gear item carries short narrator lines for when it matters, both when present and when absent. The writer authors 2-4 per item.

```json
{
  "item": "rain_jacket",
  "storyName": "a rain jacket the color of a ripe plum",
  "notice": {
    "has":  ["The rain came sideways. It was a very good moment to own a rain jacket, and {hiker} did."],
    "lacks":["The rain came sideways. It was a very good moment to own a rain jacket, and {hiker} did not."],
    "wet":  ["The rain jacket had done its best, and its best was finished."]
  }
}
```

### B.4 Scene and palette config

```json
{
  "palettes": {
    "day":      ["000000","0000AA","00AA00","00AAAA","AA0000","AA00AA","AA5500","AAAAAA","555555","5555FF","55FF55","55FFFF","FF5555","FF55FF","FFFF55","FFFFFF"],
    "dusk":     ["000000","0000AA","005500","005555","AA0000","AA00AA","AA5500","AA5555","550000","AA55AA","55AA00","FFAA55","FF5500","FF55AA","FFAA00","FFAAAA"],
    "bluehour": ["000000","000055","005555","0055AA","550055","550055","555555","5555AA","000055","5555AA","005555","AA55AA","FF5555","AA55FF","FFFF55","AAAAFF"],
    "night":    ["000000","000055","000055","005555","550000","000055","000000","5555AA","000055","000055","005555","0055AA","FF5555","AA55AA","FFFF55","AAAAFF"]
  },
  "cycles": {
    "16": { "name": "lake",  "seq": [1, 9, 1, 3],          "phase": "x/3+y" },
    "17": { "name": "falls", "seq": [15, 11, 7, 11],       "phase": "y" },
    "19": { "name": "glow",  "seq": [6, 12, 14, 15, 14, 12],"phase": "dist" },
    "20": { "name": "fire",  "seq": [4, 12, 14, 12],       "phase": "rand2" },
    "21": { "name": "surf",  "seq": [15, 7, 1, 9],         "phase": "y" }
  }
}
```

---

## 13. Open Questions for the Creator

1. **Perilous Mode default.** This proposal recommends Storybook (nobody dies) as the default, with Perilous as an opt-in per book. Agree?
2. **The plant's name.** *Snowlamp* is my suggestion. Alternatives: *Ember-in-the-Snow*, *Lanternwort*, *Snowlight*. Or should the player name it after sketching it?
3. **The "104" wink.** Should the field guide have exactly 104 entries, with No. 104 as the blank page? It's harmless and assumes nothing, but you'd know whether it lands.
4. **Companions.** Solo by default with an optional party of up to 3. Should there be a pre-made party (friends' names), or should it stay blank?
5. **Odds display default.** Numbers (recommended), Words or Hidden?
6. **Animals talking.** I propose that animals never talk and the narrator translates in italics. Would you like an optional "fable mode" where they do speak, closer to the book?
7. **Wallet.** Should the store have a budget (Oregon Trail flavor), or is money an unnecessary chore?
8. **Read to me.** On-device speech narration: is it a feature you'd use (e.g. with kids), or cut it?
9. **Season realism.** Should the trip date default to a month the player picks, or to *today's real date* (October 7, 2026, with early snow and short days)? October as a default would make the game much harder.
10. **Perilous humor line.** Are the sample death pages' jokes (Section 4.6) the right temperature?

---

*End of proposal. Sources for park facts are the researchers' region files in `design/data/regions/` (Hoh/Olympus and Sol Duc/High Divide were available at writing). The absence of red fox and the extirpation of wolves on the Olympic Peninsula were checked against the NPS Olympic "Animals" page (https://www.nps.gov/olym/learn/nature/animals.htm) and the NPS history handbook (https://www.nps.gov/parkhistory/online_books/natural/1b/nh1bi.htm).*
