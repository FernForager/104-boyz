# The eight minigames

*Draft for the creator, written 2026-10-08 for the new direction. It follows decisions 21 to 34 in `design/PENDING_DECISIONS.md`, which override `GAME_DESIGN.md` (called "the doc" here) wherever they disagree. It builds on the two sibling drafts: `drafts/daily_fkt.md` (the modes; its section 6.3 already sets the minigames' engine rules) and `drafts/frame_home.md` (the cabin, the flat lay and the camp tiles). Nothing here is decided until you say so. The calls you need to make are in [section 12](#12-decisions-for-you).*

*Every in-game word in this file (names, button labels, hints, result lines, wireframe text) is a **draft placeholder** for you to rewrite (decision 21). Short ones are marked [draft]; every wireframe is a draft as a whole. The minigames' names are working titles. The Boyz appear only as `{BOY_n}`, and Jon only by his first name. Numbers marked (design) are starting values for the harness to tune, not facts.*

---

## The short version

- **Eight, and no more.** Each is under a minute, played with one thumb, native to the park, and changes the trip. The first playable gets three: **the bear can**, **the alpenglow shot** and **huckleberries** (decision 30).
- **One rule for skill and odds: your hands decide what hands control, the dice decide what nobody controls, and the button shows the whole range before you play.** Five minigames are pure inputs with no dice at all (the can, the shot, the berries, the tent, the clams). Three move an honest roll (the ford, the descent, self-arrest), inside a range the button showed first. With *Auto*, the button shows one exact number.
- **The bear can is Suika in a cutaway can.** Drop your food in from the can's mouth. Two of the same item zip into one bag. Tortillas line the wall. Press the lid shut. Sloppy hands fit about 75% of the can and good hands about 92%; *Auto* fits 85%, which is exactly the doc's "usable" figure (5.5). What doesn't fit lies on the deck in your flat lay.
- **The alpenglow shot is fifty seconds of real light.** Olympus, 7.8 miles across the Hoh from the High Divide, from the last sun through the true alpenglow to blue hour. Frame it, hold still, shoot. The photo is a 160-pixel picture that becomes the trip report's cover and the share card, and it goes to the fire bowl with your stories.
- **Huckleberries: comb ripe berries with your thumb.** The park allows a quart a person a day, picked by hand (the 2026 compendium), so the cup *is* the quart. It costs time and pays food and spirits, and sometimes the next bush has a bear in it.
- **The other five:** the ford (step in the lulls before your feet go numb), the descent (rhythm taps, flow and footsteps, Lonely Mountains style), self-arrest (three seconds to roll toward the pick, and the only one that can end a hiker, always behind a ♦), the tent in the rain (stake the windward corner, fling the fly in a lull) and razor clams (a lantern, the shows, and keep the first fifteen).
- **Clams are real and rare in the park.** Kalaloch, the park's one razor clam beach, has been closed or limited in almost every season since 2006. I recommend Kalaloch as a rare in-park dig and Mocrocks, the WDFW beach south of the Quinault reservation, as the regular dig, reached from the clam gun on the cabin's shed.
- **Deterministic everywhere.** 120 ticks a second, integer world units, no `Math.random`, no trig at run time, every touch stamped in ticks and kept in the action log. The daily and the FKT boards get identical minigames for everyone.
- **Auto everywhere,** at par: the same for every player in a timed mode, unmarked on boards, never the best.
- **What it costs:** about four sessions in M1a for the shared host and the first three. The rest arrive with their milestones.
- **Twenty-two decisions** for you are in section 12.

---

## Contents

1. [What all eight share](#1-what-all-eight-share)
2. [Packing the bear can](#2-packing-the-bear-can)
3. [The alpenglow shot](#3-the-alpenglow-shot)
4. [Huckleberries](#4-huckleberries)
5. [The technical descent](#5-the-technical-descent)
6. [Ice-axe self-arrest](#6-ice-axe-self-arrest)
7. [The cold creek ford](#7-the-cold-creek-ford)
8. [Pitching a tent in the rain](#8-pitching-a-tent-in-the-rain)
9. [Razor clamming](#9-razor-clamming)
10. [Engine, files and tests](#10-engine-files-and-tests)
11. [What ships when](#11-what-ships-when)
12. [Decisions for you](#12-decisions-for-you)
13. [Facts checked](#13-facts-checked)

---

## 1. What all eight share

### 1.1 The brief

Your words set it (decisions 29 and 30): few, under a minute, one thumb, real stakes, native to the park, "addictive and pitch perfectly dialed in." The touchstone was a takoyaki game: short, tactile and moreish. These rules follow from that:

- **Each one is a real thing people do in Olympic.** Nothing is a puzzle invented for the screen.
- **Each one changes the trip,** in the simulation's own currencies: food days, wet gear, warmth, time, injury, and once, death.
- **Each one has a single verb you learn in three seconds.** Drop. Shoot. Comb. Step. Tap. Roll. Fling. Pull.
- **None is ever required.** *Auto* plays every one at par.
- **They are rare.** A sensible three-night trip meets the can once, a sunset or two, and one berry patch.

| Minigame | Where | Your hands decide | It feeds |
|---|---|---|---|
| **The bear can** | The flat lay, before overnights | How much food fits | Food days, what stays behind |
| **The alpenglow shot** | High camps and viewpoints at sunset | The photo | Spirits, the cover photo, the whole-sunset term |
| **Huckleberries** | Ripe patches, Aug to Sep | How much, how ripe | Food, spirits, time, the bear |
| **The descent** | Technical downhills at speed | Flow and stumbles | Segment time, the ankle roll |
| **Self-arrest** | Steep snow, after a slip | Where you stop | Injury, and on a ♦, death |
| **The ford** | Knee-deep and deeper | Footwork and line | The ford roll, cold, time |
| **The tent in the rain** | Rainy camp arrivals | How wet the inside gets | The night, tomorrow's legs |
| **Razor clams** | Night digs from the cabin | Clams and wet boots | The dig's 15, warmth, the tide |

### 1.2 Touchstones

You named six games and a takoyaki game. Each gives one thing:

| Touchstone | What we take | Where |
|---|---|---|
| *Suika Game* | The drop, the jiggle, merges, the line at the top | The bear can |
| *The Oregon Trail* | The hunt that feeds you, and a carry limit you can't argue with | Berries (the quart), clams (the first 15) |
| *Lonely Mountains: Downhill* | Lines, flow, falls that teach; footsteps instead of music | The descent; all trail sound |
| *Sword & Sworcery EP* | Quiet, light-and-sound moments tied to the real sky | The alpenglow shot |
| *King's Quest* | A death you walked into knowingly, told deadpan | Self-arrest, the deep ford |
| *1000 Heroz* | Short daily trials everyone plays identically | Identical minigames in the daily |
| A takoyaki game | Many small, well-timed touches, each with its own sound | Berries, clams |

The Oregon Trail line is real: the game told hunters *"You collected 4,000 pounds of food, but you could only bring 100 pounds back"* (quoted by explain xkcd; early versions capped the haul at 100 lb). The park's quart and the state's first fifteen are the same lesson, and they are true.

### 1.3 The one rule: hands and dice

**Your hands decide what hands control. The dice decide what nobody controls. The button shows the whole range before you play.**

That is the whole rule. Each minigame names its two halves, the way the real activity does:

| Minigame | Hands | Dice |
|---|---|---|
| The ford | Your line and your footwork | A rock rolling under a boot |
| The descent | Flow, timing, braking | Whether a stumble turns an ankle |
| Self-arrest | How fast you roll and dig in | The slip itself; the rocks below |
| The other five | Everything | Nothing inside the minigame |

**Three kinds of result.** A minigame turns its inputs into exactly one of these:

1. **An input** to the simulation: liters packed, quarts picked, minutes spent, how damp the tent got. Five minigames work this way and roll no dice of their own. Their inputs flow into later honest rolls (the night roll, the visitor roll), which show their numbers exactly as they do now.
2. **A modifier** on an honest roll, labeled in the Why sheet like any other row: `Your footwork +4` [draft]. It is capped (the ford −8 to +6, the descent −10 to +6), about the size of a pair of trekking poles.
3. **A band** in a fail table the button already showed (self-arrest only): where you stop decides the rung, and a death still needs the shown death roll.

**What the button shows.** A choice that opens a minigame carries a small pixel hand glyph, written `{hand}` in this file, and a **hands range**: the % at your worst hands to the % at your best.

```
[ Wade across  {hand}87-94%    (i) ]
```

- **The glyph tells it apart from a knowledge range** (8.6), which means "you don't know yet." The hand means "it's up to you."
- **A ♦ shows its fatal share at the worst-hands end,** marked *up to*, as a blurred ♦ already does (8.6). Playing badly can never be worse than the button said.
- **With Auto on,** the button shows one exact number: the % at par hands.
- **While you play, the number moves.** The modifier minigames show a live line under the picture: `made it 91% ▸ 93%` [draft]. You watch your own hands move the odds. It is the clearest way to show that skill shifts the dice and doesn't replace them.
- **Then the roll.** On a ♦ the compass spins (8.8). On a plain % the outcome shows at once.

**The roll is fixed at the confirming tap.** Its key is the content key the doc already uses (8.14), so quitting mid-minigame changes nothing, and a second try at the same place on the same day is the same roll. The minigame's own seed is separate, so playing well never peeks at the roll.

**Why this rule and not the other two:**

- **Skill replacing the dice** would leave no honest % to show. The button would have to guess how good you are.
- **Skill only setting inputs** is right for five of the eight, and the rule keeps it there. But a river or a snow slope really does hold luck that no footwork removes, and pretending otherwise would teach the wrong lesson about the outdoors.
- **Hidden skill effects** would break the one promise the game makes: the shown % is the real chance.

**What the linter adds.** A choice is ♦ when any branch can reach Serious (8.1). The linter now checks that across the whole hands range, so a minigame that could reach Serious at its worst hands is always behind a ♦. A minigame never kills on its own: death is always a shown death roll on a ♦, so the two fair paths of 9.5 hold unchanged.

**Worked example: the doc's own ford (8.11, row 2).** Knee-deep, no poles, tent and pad strapped outside, a beginner's river skill: 85 − 6 + 2 = 81 clean. Footwork moves it 73 to 87.

| Hands | Clean | Shaky | Made it |
|---|---|---|---|
| Worst (−8) | 73 | 14 | 87% |
| Auto (0) | 81 | 10 | 91% (the doc's number) |
| Best (+6) | 87 | 7 | 94% |

The button reads `{hand}87-94%`. With Auto on, it reads `91%`, which is the doc's figure to the point.

**Words mode** gets its own phrases for a hands range, built on the same numbers (8.7). They are yours to write.

### 1.4 Auto, assists and access

**Auto is par.** Each minigame has one fixed *Auto* result, set near the median of first-week players in playtests and then frozen. It is never the best result, so it needs no mark on any board (the modes draft's 6.3, rule 7).

- **In Open, Auto grows with the hiker** where a skill exists: self-arrest's Auto reacts faster at higher snow skill, the ford's Auto steps better at higher river skill. That is the doc's "experience: better information, not better dice" (7.10), applied to hands.
- **In the daily and FKTs,** every hiker has the standard skills, so Auto is the same for everyone.
- **Settings:** *Minigames: Ask / Play / Auto*, for each minigame [draft]. *Ask* (the default) shows the minigame's card with both buttons.

**Assists, in Open only.** *Steady hands* (no camera blur), *Wide windows* (rhythm windows 50% wider) and *Slow water* (ford surges 30% slower) [draft names]. They are off in the daily and FKTs, where Auto is the accessible path, so a board can never be won with an assist.

**Rules every minigame keeps:**

- **One thumb, in the lower half of the screen.** Everything is reachable within the bottom 45% of an iPhone 15. A *Left-handed* setting mirrors the HUD.
- **Every touch target is at least 44 pt**, as everywhere (12.1). Picking a berry uses a fingertip cursor drawn above the thumb, so small targets never hide under it.
- **Nothing depends on color alone.** Ripe berries are darker *and* carry a highlight pixel. A rough patch of trail looks different, not just tinted.
- **Nothing depends on sound alone.** Every audio tell (the sneaker wave, the bear's woof) has a picture tell.
- **Reduce Motion:** no screen shake, no parallax, no particle bursts (a 1-frame palette flash instead), and falling things vanish instead of falling where the fall isn't the game. The motion that *is* the game (a dropping can item, the slide) stays, slowed by nothing, and *Auto* is offered on the card.
- **VoiceOver:** the card's buttons are real HTML; *Auto* is the playable path; the picture has alt text built from its layers (11.9), and a live region reads key moments [draft lines].
- **A tap skips** every animation that isn't play (the doc's rule, 12.1).
- **No haptics.** The doc says iOS has no vibration API, which is still true. An undocumented trick (a hidden `<input type="checkbox" switch>` clicked from script) can make Safari tick, but reports say it is fragile and may already be patched. I recommend we don't depend on it (decision 22).

### 1.5 Determinism and seeding

The modes draft (6.3) already sets the frame: a fixed 120 Hz tick, inputs stamped in ticks, physics without trig, keyed seeds, audio as decoration, a cap on how much a minigame can move a timed result, and human-limit checks. This section adds what the eight need on top.

**The simulation core is integer.**

- **World units are square and integer.** Positions, velocities and radii are whole numbers of 1/16 of a picture pixel. JavaScript numbers hold integers exactly up to 2^53, so plain `+ - *` stay exact, and every division is a `Math.trunc` at a fixed point in the code.
- **`Math.sqrt` is allowed.** IEEE 754 requires it to be correctly rounded, so V8 and JavaScriptCore agree bit for bit. Everything else (sines for a tilted slope, the light curve, the surge pattern) is a table built at build time and shipped as integers.
- **No `Math.random`, no `Date`, no `performance.now()` inside the core.** The UI reads the clock; the core only sees tick numbers.
- **A fixed order for everything.** Bodies are updated in id order, collision pairs in (lower id, higher id) order, and a merge takes the lower id.

**The host loop** (in the UI) runs the core at exactly 120 ticks a second whatever the screen does, catches up at most 8 ticks a frame, and draws by interpolating between the last two ticks. Drawing never feeds back. The same input stream gives the same result at 60 Hz, at 120 Hz and in Node.

**Inputs** are `[tick, kind, a, b]` integers: a press, a move (x, y in world units, quantized to one picture pixel), a release, or a button. A touch's tick comes from its `event.timeStamp` against the minigame's start. Each input is written to storage the moment it happens (a few bytes), and the current tick every quarter second.

**Closing the app mid-minigame** pauses it. It resumes from the last saved tick with a one-second count-in, and no touch is ever undone. A force-quit can buy at most a quarter second of thinking time, which is harmless.

**Seeds.** Anything random inside a minigame comes from the doc's generator (E.8) on a new `mini` stream: `hash(seed, "mini", game, place, day, attempt)`.

| Minigame | Seeded inside it | Key |
|---|---|---|
| The bear can | Nothing at all | — |
| The alpenglow shot | The light curve, clouds, the gift | place, date |
| Huckleberries | The bushes, ripeness, the bear | segment, day, patch |
| The descent | The obstacle track | segment, direction, conditions |
| Self-arrest | The slide's start (from the roll's effect stream) | the ♦'s roll key |
| The ford | Surges, the spots' depths | ford, day, attempt |
| The tent | Gusts, the pads' features | camp, day |
| Razor clams | Shows, clams, waves | beach, date |

**The daily and FKT windows** use the day's or window's seed, so everyone meets the same bushes, light, surges, roots and waves. Only the hands differ.

**The result is pinned to its rules** like everything else in a timed run (the modes draft's 6.4).

### 1.6 Where they appear

| Minigame | Open | Hike of the Day | FKT |
|---|---|---|---|
| The bear can | Every overnight | Overnight dailies | Multi-day routes |
| The alpenglow shot | Sunsets, with a camera | Overnights, off the clock | No |
| Huckleberries | In season | Yes, on the clock | Yes, as fuel |
| The descent | At Push pace | At Push pace | At Run and Race |
| Self-arrest | Snow ♦s | Snow ♦s | Snow ♦s |
| The ford | Knee-deep or more | Yes | Yes |
| The tent in the rain | Rainy camps | Overnights, off the clock | Multi-day routes |
| Razor clams | Dig nights | A winter variant (decision 19) | No |

**Budgets.** The Director keeps the doc's budgets (8.4). Minigames it deals (berries) count as a real decision and come at most once a day. Forced ones (the ford at a ford, self-arrest after a slip, the can before leaving) don't count, like forced cards. A moving day should meet at most two minigames besides the evening shot.

**Practice lives at the cabin** (the hub draft's places), never touches a hiker and never posts anything:

| Minigame | Where you practice |
|---|---|
| The bear can | The shed: any can, any menu, as often as you like |
| The alpenglow shot | The porch, at the real dusk at Lake Quinault, on the peak above the trees |
| The tent in the rain | The lawn, when it really rains at the lake |
| Self-arrest | Snow school with Jon (and the doc's glacier school, 4.2) |
| Razor clams | It is its own outing, from the clam gun on the shed |
| The others | No practice: the descent's FKT window is practice, a ford is never something to practice for fun, and berries need none |

### 1.7 The shape of every minigame

Every one has the same three beats, so learning one teaches the rest.

1. **The card.** The place's picture, the verb in one line, the hands range, and two buttons, *Play* and *Auto* (Auto shows its exact result). The first time in a career a small ghost thumb loops the gesture once, with no words.
2. **The play.** Under a minute, one thumb, no text needed. The HUD is one or two lines in the chrome font.
3. **The result line.** One line of numbers that says what changed in the trip, then back to the trail. No score screen, no stars except the photo's.

```
┌──────────────────────────────────────┐
│ Day 3 · 2:40 pm · Hoh braids       ≡ │
│ ┌──────────────────────────────────┐ │
│ │ THE FORD: three gray channels,   │ │
│ │ a gravel bar, the far bank       │ │
│ └──────────────────────────────────┘ │
│ (DRAFT) Knee-deep, fast, cold.       │
│ [ Play          {hand}87-94%   (i) ] │
│ [ Auto                         91% ] │
│ [ Camp, cross at dawn        night ] │
│ [ Turn back                   sure ] │
└──────────────────────────────────────┘
```

*(The sure choices stay on the card. Choosing to play never takes them away.)*

### 1.8 Art and sound, shared

**Art.**

- **Two canvases.** A minigame draws into the standard 160x168 picture or the tall 160x320 plate (11.2), in the sixteen colors, with the same whole-pixel scaling. The thumb zone sits under the picture.
- **Physics in square units, sprites in fat pixels.** The world is square; picture pixels are wider than tall (7x4 device pixels on an iPhone 15). Round sprites are pre-rasterized for that shape at every radius, so a round bag looks round.
- **Motion in whole pixels.** A sprite moves only when its body has moved at least three quarters of a pixel, so nothing shimmers at rest.
- **Juice without sub-pixels.** A 1-pixel overshoot on a pop, a 1-frame palette flash, at most 1 pixel of shake, and only for big moments (none under Reduce Motion).
- **No gold, ever.** Not the cheese, not the sun, not the huckleberry candy. Gold stays the Bonfire Lily's (11.1).
- **New stamps reuse what exists:** the flat lay's food and gear stamps (the hub draft's 8.2), the composed scenes and skylines (11.7), the hiker sprite (11.6).

**Sound.**

- **On the trail, no music** (decision 32). A minigame on the trail is the place and your own sounds: footsteps by surface, the creek, rain on nylon, the plink of a berry in a cup.
- **At the cabin, the cabin's music keeps playing** under the bear can in the shed and under practice.
- **Every action has a sound,** and every sound is synthesized or CC0, logged with its license (decision 33). Most are short square-wave or filtered-noise recipes in the doc's engine (13.1); the beds (surf, rain, creek, wind) come from the sound draft's CC0 library.
- **Sounds are pre-rendered at startup** into buffers and scheduled at the tick they belong to, so a tap sounds within a frame.
- **Never louder than the place,** and never more than one copy of the same sound in 4 ticks.

### 1.9 The pitch-perfect bar

Every minigame ships only when all of these are true on your phone:

1. **Feedback within one frame** of the touch: a pixel and a sound.
2. **Learnable in three seconds** from the ghost thumb, with no text.
3. **Under a minute** at the median, never over 75 seconds.
4. **The result line names the trip's change** in numbers.
5. **No hidden dice.** Anything random is visible or on the button.
6. **Identical at 60 and 120 Hz,** and identical in Node (a golden test).
7. **A tap skips anything that isn't play.**
8. **Auto is on the card, never shamed.**
9. **Reduce Motion, VoiceOver, one hand and sound-off all work.**
10. **Under 2 ms a frame** on an iPhone 12, and paused when hidden.
11. **Five people who never saw it** get it on the first try, and want a second.

