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

---

## 2. Packing the bear can

*The signature. Suika's drop and merge, inside the thing every Olympic backpacker fights with the night before.*

### 2.1 What it is

Every overnight in the park needs a hard-sided bear canister for all food, trash and scented items (the park's food-storage page). The doc already makes the can a real limit (5.5): rigid walls leave gaps, so only about 85% of it is usable. **This minigame is where that 85% comes from.** Pack carelessly and you get about 75%. Pack well and you get about 92%. *Auto* gets 85%, the doc's number.

You see the can side-on, cut away like a diagram. Your food waits on the deck. One item at a time hangs over the rim under your thumb. Let go and it drops, rolls, settles and squishes. Two of the same item that touch zip into one bag, which takes less room than two wrappers. Tortillas dropped against the wall line it. At the end you press the lid shut, or you pull out what won't fit.

### 2.2 When and where

- **The flat lay, before every overnight.** The hub draft lays the open can on the deck with the food around it (its 8.3). Tap the can and the deck tilts into the cutaway. Close the lid and you are back on the deck with the can shut and anything that didn't fit lying beside it, which is exactly what the share image shows.
- **Repack freely until *Start walking*.** It is still the night before, and going back is free until then (the hub draft's 3.3). So the can is the one minigame you can try again and again, like Suika. Only the last pack counts.
- **Open:** every overnight. **Hike of the Day:** overnight dailies, before the clock starts. **FKTs:** multi-day routes only.
- **Not on day hikes** (no can needed, 3 in the doc).
- **Practice:** the shed, any can and any menu, any time.
- **Later (M1b): the can remembers.** The pile is saved through the trip. Each evening the food you ate leaves holes and the pile settles. The camp tile *Pack the can* (the hub draft's 6.15) appears when something is outside it: overflow you carried, berries you saved, a Boy's trade, a crushed empty can. You drop those in on top. M1a packs once.

### 2.3 The screen

```
┌──────────────────────────────────────┐
│ < Flat lay    THE CAN · WIC 10.1 L   │
│ ┌──────────────────────────────────┐ │
│ │ next ◉ chili mac 0.6 L    D3     │ │
│ │ then ● oats  ● oats  ○ bars      │ │
│ │               ◉                  │ │
│ │               ┊                  │ │
│ │      ╔════════┊═══════╗ rim      │ │
│ │      ║        ┊       ║          │ │
│ │      ║    ●   ┊  ◉    ║          │ │
│ │      ║ ◉◉  ●●   ●  ●● ║          │ │
│ │      ║▌◉ ●◉ ◉◉◉ ● ◉◉  ║          │ │
│ │      ╚════════════════╝          │ │
│ └──────────────────────────────────┘ │
│ In 4.1 L · packed 86%                │
│ To go 4.6 L · 13 items               │
│ [ Auto the rest ]  [ Close the lid ] │
└──────────────────────────────────────┘
```

*(The ▌ on the left wall is a tortilla liner. D3 is the item's day. The picture is the tall plate, 160x320.)*

### 2.4 Controls

- **Touch anywhere in the lower half and slide.** The hanging item follows your thumb's x, one to one, snapped to whole pixels and kept inside the walls. A dotted line drops from it to where it will first touch.
- **Lift to drop.** The next item appears at once, so a quick player can drop while the pile is still moving, as in Suika.
- **Close the lid** (button): the lid slides on. If something sticks up, **hold the lid** to press it down for up to a second and a half.
- **Tap an item above the rim** to pull it out. It goes back to the deck.
- **Auto the rest** (button): the remaining items drop where par would put them.

That is the whole vocabulary: slide, lift, hold, tap.

### 2.5 The loop, second by second

The doc's own trip (B.2): three nights clockwise, the standard 11.5 L can, a typical menu of about 6.0 L plus 0.6 L of smellables, about 22 drops.

| Time | What happens |
|---|---|
| 0.0 s | Tap the can on the deck. The deck tips away and the can turns side-on, cut away. The food lines up as the queue: the last day first |
| 0.6 s | Thumb down. Day 3's chili mac hangs over the rim. The dotted line shows where it lands |
| 1.2 s | Lift. It drops, lands with a soft thump and settles in a third of a second. The next item is already under your thumb |
| 2-9 s | Day 3: two oatmeal packets that touch zip into one bag (x2), then bars and trail mix into the gaps |
| 9-20 s | Day 2. The tortillas go against the left wall and unroll into a liner |
| 20-30 s | Day 1 and the small bags. A bar bag x2 meets another x2: zip, x4 |
| 30-34 s | The smellables bag, last, so it's on top for tonight's toothbrush. It sits three pixels over the rim |
| 34-37 s | *Close the lid.* Hold: the pouches crinkle down, and the lid clicks three times |
| 37 s | The result line, then back to the deck with the can shut |

Result line: `Fits: all 6.6 L · packed 88% · room for 1.9 L` [draft].

### 2.6 The can's rules

**The cans.** Each in-game can has the shape of the real kind it stands for, from the makers' outside dimensions, at one scale: about 1,170 square world pixels a liter (design).

| In-game can (catalog) | Liters | Height : width | Shaped like |
|---|---|---|---|
| Small | 7.2 | 0.95 | BearVault BV450: 8.7 x 8.3 in |
| Classic, and the WIC loaner | 10.1 | 1.36 | Garcia: about 8.8 x 12 in |
| Carbon (premium) | 10.6 | 1.11 | Bearikade Weekender: about 9 x 10 in |
| Standard | 11.5 | 1.46 | BearVault BV500: 8.7 x 12.7 in |

So the standard can is about 96 pixels wide and fills three quarters of the tall plate, and the small one is nearly square. Each packs differently: the narrow classic punishes a big pouch, the wide carbon forgives it. (The real makers' names never appear in the game; the catalog names are generic, 5.2.)

**Items are round.** Real food goes in as soft bags, and a circle is honest about that. Each item's area is its catalog liters at the can's scale, so a 0.6 L repacked dinner has a radius of about 15 pixels and a 0.06 L granola bar pouch about 5.

**The queue** is your food in the order the catalog's tip gives (`food_catalog.json`): the last day at the bottom, tonight's dinner on top. Within a day, the biggest goes first. Items of 0.05 L or less (coffee, cocoa, drink mixes, gels, peanut butter packets) arrive pre-bagged by kind in small bags of up to 0.25 L, because nobody drops thirty coffee sticks one by one. The smellables bag (0.3 L plus 0.1 a night, 5.5) is always last.

**Physics** (design values, all integer):

- Gravity, then position-based collision: six solver passes a tick, bodies pushed apart along their centers in proportion to their areas, then clamped inside the walls. The bottom corners are rounded.
- Velocity is the change in position, damped by 248/256 a tick, with a cap of 4 pixels a tick, so nothing tunnels and everything settles in under half a second.
- **Squish.** A soft body's radius shrinks under the weight on it, down to a floor:

| Kind | Shrinks to | Crushed? |
|---|---|---|
| Rigid: cans, the IPA, fruit, the egg box | 100% | Never |
| Zip bags and pouches | 85% of its area | Never |
| Crushable as sold: chips, crackers, cookies, bagels | 60% | Below 80%: morale −1 |

**Merges.** Two bodies of the **same item** (the same food id, or the same kind of small bag) that touch for a quarter second while both are slow become one zip bag:

- **its area is 90% of the two together** (design): one bag instead of two wrappers, which is why real hikers repack;
- it shows a count (x2, x4) on the item's icon;
- it can merge again with another bag of the same item, up to **1.0 L**, a quart bag;
- it keeps the lower id and sits where the two were, weighted by area.

Merges chain, as in Suika: a bag that grows can touch the next one.

**Special items:**

- **Tortillas line the wall.** A tortilla pack that lands touching a side wall unrolls into a strip down that wall, with no gaps. It is the catalog's own tip ("tortillas curl around the inside wall") and the hardcore crowd's favorite.
- **The IPA** (0.55 L) is rigid and clanks.
- **Chips as sold** (3.5 L) are huge and squish a long way, and squishing past the line crushes them.
- **The watermelon** (the catalog's 3.5 L personal melon, a trap) is rigid and as big as Suika's biggest fruit. It never fits the small can.

**The lid.** The rim is the line. *Close the lid* closes it when every body is below the rim, with one world pixel of grace. If not, holding the lid presses on the bodies above the rim and lets soft things squish 1.5 times further (crushables crush). If it still won't close, you pull something out.

**What stays behind.** Anything pulled out or never dropped goes back to the deck, and a sheet asks what to do with it, three sure choices for each item or for all:

- **Leave it in the car.** Less food on the trail.
- **Carry it outside the can.** Each night it is food that doesn't fit (6.3).
- **Eat it now** [draft], at the trailhead.

### 2.7 What skill is

- **Reading the roll.** Suika's whole skill: where will a round thing come to rest?
- **Big first, small into gaps.** Pouches against the walls and into the corners; bars and small bags into the holes.
- **Setting up merges.** Drop the second oatmeal packet onto the first.
- **The liner.** Get the tortillas against a wall before the pile does.
- **Knowing what to crush.** Squashed chips still fit; they just make a sadder lunch.
- **The press.** Pull out the right thing instead of crushing the wrong one.

Order is not a skill in v1. The queue always comes in the right order, so tonight's dinner is always on top, which is how the game teaches the real tip without making it a chore. A *Set aside* button that breaks the order for a better fit is a later option (decision 5).

### 2.8 What it feeds

| Result | Goes into | Where it bites |
|---|---|---|
| Food in the can | Days of food (5.5) | Nowhere: that's the point |
| Left in the car | Fewer calories on the trail | The energy ceiling; the running-short card (5.6) |
| Carried outside | Food that doesn't fit, each night | The visitor roll (6.3), Leave No Trace −5 a night |
| Eaten now | Today's calories | More than 800 kcal extra: heavy legs for the first hour, x1.03 (design) |
| Crushed food | Morale −1 for that item | Dinner and snack joy (5.6) |
| The packed can | The flat lay's share image | Bragging |

**Worked example: four nights, the WIC loaner, a typical menu.** That is 8.0 L of food and 0.7 L of smellables, 8.7 L, in a 10.1 L can.

| Hands | Packed | Fits | Stays behind |
|---|---|---|---|
| Careless | 75% | 7.6 L | 1.1 L, about half a day's food |
| Auto | 85% | 8.6 L | 0.1 L, one granola bar pouch |
| Careful | 92% | 9.3 L | Nothing, and room for 0.6 L: about the IPA |

**Checked against the makers.** BearVault says its 11.5 L BV500 "fits up to 7 days of food for one person," and its 7.2 L BV450 "about 3-4 days." With the game's dense day (1.6 L) and near-best hands, the standard can holds about 6 days after a week's smellables, and the small can at par holds 3 to 3.5 dense days. Both sit just under the makers' claims, as a careful hiker's real pack does.

**Why 85% is honest in two dimensions.** Random close packing of equal discs is about 0.84 to 0.86, and the densest possible (hexagonal) is about 0.907 (arXiv 2404.02316). Things dropped under gravity into a narrow can with walls land below random close packing. So 85% at par needs a little squish, and 92% needs the soft bags to give, which real zip bags do.

### 2.9 Odds

There are no dice in the can. It is pure input.

- **The shopping gauge** (5.3) keeps showing the can at par (85%, the catalog's `usable_l`). Its (i) adds one line: *careful packers fit about 0.7 L more; careless ones 1.0 L less* [draft], computed for that can.
- **Downstream rolls show their numbers as always.** Food carried outside the can brings the evening's honest visitor roll (coast raccoons 40%, mice at busy camps 30%, bears 5%, or 10% in August and September berry country, 6.3).

### 2.10 Determinism

The can has no randomness at all: no seed, no stream. A pack is a pure function of the can model, the queue and the input stream. The same drops give the same pack on every phone and in Node, which is what makes a shared flat lay reproducible.

**Par is a bot, not a number.** *Auto* runs the par bot: for each item it tries x positions 8 pixels apart, simulates one second of each, and takes the lowest resting point (the leftmost on a tie). It is deterministic, so Auto's pack of a given menu is the same for everyone. The bot is tuned so its average over the reference menus is 85% (2.14).

**In the action log,** only the last pack before *Start walking* is kept.

### 2.11 Access

- **Auto** packs the whole can at par. **Drop where it fits** [draft] does it for one item.
- **VoiceOver:** the live region reads the next item, its liters and its day; three buttons drop it *left*, *middle* or *right* [draft]; *Close the lid* is a button. Auto is always there.
- **Reduce Motion:** the deck-to-can tilt becomes a cut; merges flash for one frame instead of popping. The drops stay, because the drop is the game.
- **Color:** day marks are colored dots *and* positions in the queue; the HUD names the day.

### 2.12 Art

- **Four can cutaways** (walls 2 to 3 pixels): the standard can as a smoky translucent wall (a `checker` of slate and night navy), the classic and the loaner in ink with a slate rim, the carbon can in ink with a `diag` weave, the small can squat. The back wall is night navy.
- **The lid** with its tabs, as its own stamp, and a 1-pixel flash at each click.
- **Food sprites:** reuse the flat lay's food stamps where they read as round. New round bags at nine sizes (radius 4 to 36): a snow-white zip outline holding the item's icon, and a count digit for merged bags.
- **The tortilla liner** in four unroll frames.
- **Day dots,** 1 pixel: Day 1 sage, Day 2 paper cream, Day 3 alpenglow pink, Day 4 glacier blue, Day 5 rust.
- **The drop line** in dotted paper cream.
- **No gold:** the cheese is paper cream with a rust rind.

### 2.13 Sound

| Moment | Sound (synthesized) |
|---|---|
| An item lands | A soft thump, pitched by size (about 90 Hz for a big pouch, 300 Hz for a bar); a clank for the IPA; a thud for an apple |
| A merge | A zip: noise swept up from 0.4 to 1.6 kHz in 80 ms. In a chain, each link a step higher |
| Squish | A crinkle: three short noise ticks |
| Crush | A crunch: low noise, quick decay |
| The liner | A soft paper slide |
| The lid | A plastic slide, then three ratchet clicks |
| Won't close | The doc's pack-full thunk (110 Hz, 13.2) |
| Music | The cabin's, softly, ducking 3 dB during the press |

### 2.14 Tuning targets

| Target | Value | Measured by |
|---|---|---|
| Par (the Auto bot) | 85% ± 2 on the dense, typical and bulky days, in all four cans | The harness, 12 cases |
| Careless bot (random x) | 75% ± 3 | The harness |
| Careful bot (best of 13 x, one look ahead) | 92% ± 2 | The harness |
| Ceiling | 97%, never more | A search bot with the press |
| First-time players | 80-86% | Five playtests |
| After ten packs | 88-92% | Your own packs |
| Drops, 1 to 3 nights | 15 to 28 | Fill from the list's menus |
| Time, 3 nights | Median 35 s; 90th percentile under 60 s | Playtests |
| Merges a pack | 2 to 6; a chain of three in about one pack in three | The harness |
| The press | Needed in about 70% of full cans; it closes about 85% of those | The harness |
| The doc's B.2 plan | Fits at every skill | A golden test |
| 4 nights, the loaner | Careless 1.1 L out; par 0.1 L; careful none | A golden test |
| The makers' check | Standard can, dense food, best hands: about 6 days | A golden test |
| The watermelon | Never fits the small can | A golden test |
| Speed | Under 1 ms a tick with 40 bodies on an iPhone 12 | Device |

### 2.15 The polish list

1. The item tracks the thumb with no lag and never leaves the walls.
2. The dotted line always shows the first contact point, recomputed every tick, like Suika's guide.
3. Drop to rest in under half a second; nothing bounces more than a pixel.
4. Nothing at rest ever shimmers.
5. Merges overshoot by one pixel for three frames, with one zip; chains climb in pitch.
6. The lid press feels heavy: a pixel per 6 ticks and a click per 2 pixels.
7. What didn't fit flies back to the deck and lies beside the shut can in the flat lay, a small truthful joke in the share image.
8. The HUD always names the next item, its liters and its day.
9. Repack is one tap and instant.
10. The three cans feel different in the hand.
11. The result line is one line.
12. The first pack ever shows the ghost thumb twice: once for the drop, once for the press.

---

## 3. The alpenglow shot

*Fifty seconds of real light on Mount Olympus, and one photo to keep.*

### 3.1 What it is

On a clear evening at a high camp or a viewpoint, if you carry a camera or a phone, the sunset becomes a shot. The light runs from the last sun on the peak, through the true alpenglow, to blue hour, about one game minute to each real second. You frame it, hold still and shoot. Your best photo becomes the trip's picture.

**The light is real light.** The American Meteorological Society's glossary describes alpenglow in three phases: the peak's color in the low evening sun; then, a few minutes after the sun has gone below the horizon, the true alpenglow, purer and pinker; then a more diffuse afterglow, with purples. Strictly, alpenglow is indirect light, seen only after sunset or before sunrise (Wikipedia). The minigame plays those phases in order, and its one trick is learning their tell.

**The geometry is real too.** From the High Divide, Mount Olympus is 7.8 miles away across the Hoh, bearing about 156° (south-southeast), computed from the region data's coordinates. In mid-August the sun sets at about 292° (west-northwest), behind your right shoulder as you face the peak. So the last light falls across Olympus's western and northern faces, which are the ones you're looking at.

### 3.2 Where and when

| Place | Subject | Notes |
|---|---|---|
| The High Divide crest | Mount Olympus across the Hoh | The first playable's great view; the doc's Olympus plate (B.3) |
| Bogachiel Peak | Olympus, the basin's lakes below | B.3's sunset; its north-face snowfield is a lily place (10.2) |
| Heart Lake Junction camp | Olympus | The crest's one camp; carry water |
| Hoh Lake | Olympus across the valley | The region data's scene notes |
| Heart Lake | The ridge above the lake | The region data asks for a pink sky variant |
| Lunch Lake | The Bogachiel ridge and its snowfield | Only while the snow lasts (July into August) |
| The cabin's porch | The peak above the trees | Practice, at the real dusk at Lake Quinault |
| Later | Glacier Meadows, Royal Basin, Hurricane Ridge, Lake Morgenroth | With their milestones |

- **How it starts:** the evening's sunset choice, *Watch sunset* in the hub draft's camp grid or B.3's *Bogachiel Peak for sunset?*, with a camera or a phone in the kit. Without one, the sunset plays as it does now: one screen and the lift in spirits.
- **Weather decides if there is a shot.** Clear and partly cloudy evenings play it. Overcast plays a gray, quiet version with no pink. Rain and fog skip it.
- **Open:** every such evening. **Hike of the Day:** overnight dailies, in camp, off the clock. **FKTs:** never.
- **Practice at the cabin** happens only at the real dusk at Lake Quinault, when the cabin's own peak goes pink (the hub draft's 3.4). That is *Sword & Sworcery*'s spirit, and it makes the porch worth opening at sunset (decision 9).

### 3.3 The light, phase by phase

Mid-August on Bogachiel Peak: sunset 8:29 pm and civil dusk 9:03 (the doc's daylight table, 7.2). The minigame runs from 15 minutes before sunset to civil dusk, about 49 seconds.

| Real s | Clock | The light on Olympus | Exposure |
|---|---|---|---|
| 0-15 | 8:14-8:29 | Low warm sun on the west faces | Instant |
| 15-21 | 8:29-8:35 | Sunset where you stand. Olympus is 2,500 ft higher, so the shadow climbs it from the valley up | Instant |
| 21-26 | about 8:35-8:40 | The summit goes cold and flat: the lull, and the tell | 0.25 s |
| 3 to 5 s, inside 23-32 | about 8:38-8:47 | **True alpenglow:** the pink comes back, purer | 0.25 s |
| 32-40 | 8:47-8:55 | Afterglow: softer, toward purple | 0.5-1 s |
| 40-49 | 8:55-9:03 | Blue hour: the snow goes glacier blue (11.4) | 2 s |

**Five light levels** on the subject's snow, drawn with the doc's ordered dithers: shadow (glacier blue), a speckle of pink (`checker25`), half pink (`checker`), mostly pink, and full alpenglow pink with a snow highlight on the ridges. The low warm sun before sunset uses paper cream on snow, never gold (11.1).

**The tell** is the skill: the summit's last warm pixel goes out, the whole peak sits flat and cold for a few seconds, and then the pink comes back. Players who learn the lull stop shooting the sunset and wait.

### 3.4 Controls

- **Drag on the picture** to pan. The scene is twice as wide as the frame, so you choose what's in it. Panning has no inertia.
- **Press and hold the shutter** (lower right, in the thumb zone). A small meter fills for the exposure; lift when it's full. Moving your thumb while it fills blurs the photo. Lifting early underexposes it.
- **Tap the lens chip** to switch wide and 2x (the compact camera and the DSLR).
- **Done** ends it. Waiting to the end of blue hour ends it too.
- **Up to twelve shots** a session with a digital camera or phone (design). With the film camera, as many as are left on the roll.

### 3.5 The screen

```
┌──────────────────────────────────────┐
│ Bogachiel Peak · 8:41 pm   shots 4   │
│ ┌──────────────────────────────────┐ │
│ │ ┌                              ┐ │ │
│ │    OLYMPUS, its snow going pink  │ │
│ │    above the shadowed Hoh        │ │
│ │                                  │ │
│ │  a subalpine fir, lower left     │ │
│ │ └                              ┘ │ │
│ └──────────────────────────────────┘ │
│ ◀ drag to frame ▶       [ wide | 2x ]│
│ light ▂▄▆                            │
│                                      │
│ [ Done ]                  ( ◉ hold ) │
└──────────────────────────────────────┘
```

*(The light meter shows only the light now, never what's coming.)*

### 3.6 The loop, second by second

Bogachiel Peak, August 14, clear, with a phone and trekking poles:

| Time | What happens |
|---|---|
| 0 s | The card: *Play* or *Auto*. Play. The frame opens on Olympus, warm in the low sun |
| 3 s | You pan left until the summit sits on the right third line and a fir fills the lower left |
| 8 s | A shot of the golden peak, instant. Fine, not great |
| 16 s | The sun sets behind you. The shadow line starts up from the Hoh |
| 21 s | The last warm pixel leaves the summit. Everything goes flat. You wait |
| 26 s | Pink speckles the snow, then half, then full. Hold the shutter: a quarter second, thumb still |
| 27 s | The print slides up: ★★★ |
| 35 s | One more in the afterglow for the purple. Your thumb drifts: one pixel of blur |
| 44 s | Blue hour. You tap *Done*, or stay to the end with the headlamp off |

Result line: `★★★ Olympus at alpenglow · spirits ♥ · back by headlamp` [draft].

### 3.7 The photo's score

| Part | Points | How |
|---|---|---|
| Light | 0-50 | The level at mid-exposure: shadow 0, speckle 20, half 30, mostly 40, full 50. Golden sun 25, the climbing shadow line 30, afterglow 30, blue hour 20 |
| Frame | 0-30 | The summit near a thirds point: 20 within 4 px, 14 within 10, 8 within 20, else 3. Something in the lower third (a fir, the tent, a lake): +5. The summit not cut by the edge: +5 |
| Sharp | 0-20 | Blur 0 px: 20; 1: 12; 2: 5; 3 or more: 0 |
| Gift | 0-10 | A seeded moment in frame: a marmot on the near rock, a raven, a bear on a far meadow, clouds lit pink |

- **Exposure:** lifting early scales the light points by how much of the meter filled.
- **Blur** is the thumb's travel during the exposure, one pixel per 6 pt. Trekking poles, or a rock at the spot, halve it (a monopod, or a brace).
- **Stars:** 80 or more ★★★, 60 or more ★★, 35 or more ★. A lower one is still kept.
- **The best shot** of the session becomes its photo. A tap in the album can swap it.

### 3.8 Cameras

Every camera is already in `gear_catalog.json`:

| Camera | Frame | In low light | Notes |
|---|---|---|---|
| Phone (`phone`) | Wide | Exposure x1 | About 2% of the battery a session (design) |
| Compact (`camera_compact`) | Wide or 2x | x1 | 350 shots a charge |
| DSLR (`camera_dslr`) | Wide or 2x | x0.5: steadier at blue hour | Heavy |
| Disposable film (`camera_disposable_film`) | Wide | x1 | 27 shots for the whole trip, and no preview |

**Film is the purist's choice.** You see only the counter click down. The prints arrive in the trip report like an envelope from the drugstore, and you find out then whether you caught it.

### 3.9 What skill is

- **Waiting for the lull.** The great shot is after sunset, not at it.
- **Framing before the light.** The peak is brief, so the frame has to be ready.
- **A still thumb** at a quarter second, and a braced one at blue hour.
- **Knowing when to stop,** and when to stay for the blue.

### 3.10 What it feeds

| Result | Goes into | Notes |
|---|---|---|
| ★, ★★ or ★★★ | Spirits +1, +1 or +2 (design) | On top of the sunset's own lift (7.9) |
| The photo | The trip report's cover, the share card, the fire bowl's album | The hub draft's 6.18 and 3.2 |
| Staying to the end | The Bonfire Lily's whole-sunset term, +0.03 (10.2) | *Done* before blue hour ends drops it |
| Standing still at dusk | Warmth, through the heat balance (7.9) | A warm layer covers it |
| A viewpoint away from camp | The walk back by headlamp, with its honest checks | As in B.3 |
| The phone or camera | Battery | A dead phone takes the light and the time source with it (7.9) |
| Score | Nothing | The sunset's points come from being there, so a bad photo never costs any |

**The lily never appears in a photo,** and nothing in the minigame hints at it. It comes, when it comes, at the end of blue hour, after the shot is over (10.2). Gold never appears in the viewfinder.

### 3.11 Odds

None inside the shot. It is pure input. The sunset choice that leads here shows its costs as it does now (time, cold, dark), and the walk back in the dark shows its % as it does now.

### 3.12 Determinism

- **The light curve** comes from the date's sunset and dusk (the daylight table), the zone's weather that evening, and `hash(seed, "mini", "alpenglow", place, date)`, which sets the peak's timing inside its window, its strength, the clouds and the gift. Everything is integer tables.
- **A photo is about ten bytes:** the place, the date, the tick, the frame's x, the lens, the blur, how full the meter was and the gift. The share PNG renders from those on any phone, identically, and a crew link can carry a photo without an image.
- **On an overnight daily** everyone at the same camp gets the same light, so a photo-of-the-day board is possible (decision 8).

### 3.13 Access

- **Auto** [draft: *One good photo*] shoots once in the mostly-pink moment, centered, sharp: about 68, ★★. Auto never makes ★★★.
- **Steady hands** (Open): no blur.
- **VoiceOver:** a live region reads the light (*Sun on the summit. The shadow reaches the top. Pink comes back. Blue hour.* [draft]); the shutter is a button; the photo gets alt text from its layers.
- **Reduce Motion:** the light already changes in still steps; the shutter's flash becomes a 1-frame ink border.
- **Color:** the light meter shows the level as bars, not only as pink.

### 3.14 Art

- **Panoramas** for each spot, 320 pixels wide: the composed scene with the Olympus skyline (11.7), drawn twice the frame's width.
- **A new pseudo-color, `alpen`,** for the subject's snow: it resolves by level through snow, paper cream, alpenglow pink and glacier blue with the ordered dithers. A per-row mask moves the shadow line up the peak one row at a time.
- **The rest of the scene** steps through the doc's Day, Dusk and Blue hour tables at set ticks (11.4).
- **Lit clouds:** the cloud stamps take `alpen` too.
- **Gifts:** the marmot and the bear exist; a raven (5x3) is new.
- **The viewfinder:** ink corner marks, the light bars, the shot counter, the film counter.
- **The print:** a paper-cream border and a date line, for the album, the fire bowl and the share card.

### 3.15 Sound

No music. The trail's evening is the sound:

- **The wind eases** as the air goes still: the bed thins over the minute.
- **The place's evening birds,** as the sound draft picks them, and a far creek where there is one.
- **The marmot's whistle** when the gift is a marmot (the doc's cue, 13.2).
- **The shutter:** two soft clicks, 2 kHz then 1.2 kHz, 8 ms each. **The film advance:** a ratchet of eight clicks.
- **No jingle for ★★★.** I recommend the quiet as the reward (decision 32 keeps music for a few key moments, and this is the place's own).

### 3.16 Tuning targets

| Target | Value | Measured by |
|---|---|---|
| Session | 45 to 55 s: sunset −15 min to civil dusk | The daylight table |
| The peak (full pink) | 3 to 5 s, starting 3 to 10 s after the summit goes cold | The seed's range |
| Clear evenings | Always reach full pink | A golden test |
| Partly cloudy | Lit clouds 40% (gift +10), plain 30%, blocked 30% (half pink at most) | The harness |
| Overcast | A speckle at most | A golden test |
| Auto | About 68, ★★; never ★★★ | A golden test |
| First tries | Median about 55 (★); ★★★ about 1 in 10 | Five playtests |
| After five evenings | Median about 75 (★★); ★★★ about 4 in 10 | Your own evenings |
| Blur | 1 pixel per 6 pt of thumb travel | Device |
| Gifts | About 1 evening in 4, clear or partly cloudy | The harness |

### 3.17 The polish list

1. The light is the star: every spot is checked at every level side by side with the mockup.
2. The shadow line climbs a row at a time and never jumps.
3. The tell reads: the last warm pixel, a beat of flat cold, then pink.
4. The shutter clicks on touch-down; the meter fills after.
5. Panning stops dead when the thumb lifts.
6. The print slides up in six frames.
7. Film shows only the counter, and the trip report deals the prints one by one.
8. The best shot is picked for you, and is easy to swap.
9. No text in the viewfinder but the counter.
10. The photo is pixel-for-pixel the scene, because it is the scene's own render.

---

## 4. Huckleberries

*Comb a ripe bush with your thumb. The cup is the park's quart.*

### 4.1 What it is

In late summer the High Divide and the Seven Lakes Basin are full of huckleberries and blueberries. Trip reports call the bushes waist-high and say the berries slowed them down, which is the whole game. You stop at a patch, comb ripe berries into your cup with your thumb, eat some, save some, and go on, a little later and a little happier.

**The rule is real.** Olympic's Superintendent's Compendium (updated January 2026) lets visitors collect edible fruits and berries **by hand, for personal consumption, up to 1 quart per person per day**, but not within 200 feet of nature trails, special trails and natural study areas. Everything else growing in the park stays put (the doc's flower press is a trap for that reason, 6.9). So the berries are the one thing you may pick, and the cup in the minigame *is* the quart: when it's full, you're done for the day.

**And respectfully.** Big huckleberry is a sacred first food for many Northwest tribes (USFS). The game picks berries the way the park allows: by hand, a quart, for yourself.

### 4.2 Where and when

**Places** (the region data's `wildlife_and_plants` and recent trip reports):

- the High Divide crest, and the stretch from past Deer Lake along the basin until the trail re-enters the trees after Heart Lake (a September 15, 2025 report);
- between Heart Lake and Sol Duc Park, where the bushes are waist-high (August 14, 2021);
- Sol Duc Park, Lunch Lake and Hoh Lake;
- later, Lake of the Angels (its region notes mention ripe blueberries) and other high meadows.

**Never within 200 feet of a nature trail or special trail.** The compendium's section 1.4 lists those trails; that list still has to go into `park_rules.json` before berries can be dealt anywhere near one.

**The season** (normal snow year; the doc's snow year shifts it, 7.6):

| Dates | Ripe share | What the reports say |
|---|---|---|
| Before Aug 1 | Under 10% | A few early bushes |
| Aug 1-10 | 10-40% | Can look ripe and taste sour (August 15, 2020) |
| Aug 10-Sep 15 | 50-75% | The peak (2021, 2025 reports) |
| Sep 15-30 | About 60%, some shriveled | Leaves turn rust |
| Oct 1-15 | 30-50%, then frost | "Tons of ripe huckleberries" on October 11, 2024 |

A low snow year moves it about two weeks earlier, a high one two to three weeks later. The USFS puts big huckleberry's ripening at "generally... late July to late September." The shares are design values.

**How it starts.** A trail moment the Director deals on a segment with a berry tag, in season, at most once a day: *the bushes here are heavy with berries* [draft], with *Stop and pick* and *Keep walking*. A camp tile at Lunch Lake and Heart Lake offers it too.

**Modes.** **Open:** in season. **Hike of the Day:** yes, and the clock runs, so it is a real trade. **FKTs:** yes, as fuel.

### 4.3 Controls

- **Drag your thumb through the bush.** A small fingertip cursor floats about 36 pt above your thumb, so you can see what you're touching. Berries under the fingertip are picked.
- **Slow and steady picks.** Strokes faster than about 1.5 pixels a tick knock berries off instead; they drop to the ground and are gone (design).
- **Dragging through leaves** parts them and shows the berries behind, but knocks off about one berry cluster in four under them (design).
- **Tap the cup** to stop.

### 4.4 The screen

```
┌──────────────────────────────────────┐
│ Above Sol Duc Park · Aug 22 · 1:10   │
│ ┌──────────────────────────────────┐ │
│ │  BUSHES: dark berries with a     │ │
│ │  pale bloom, green ones, leaves  │ │
│ │            ◇ fingertip           │ │
│ │                                  │ │
│ │        (your thumb, below)       │ │
│ └──────────────────────────────────┘ │
│ Cup ▓▓▓▓▓▓░░░░ 0.6 qt · +21 min      │
│ ripe 92%                             │
│                       [ That's it ]  │
└──────────────────────────────────────┘
```

### 4.5 The loop, second by second

August 22, a sunny morning between Heart Lake and Sol Duc Park, with a pot in the pack:

| Time | What happens |
|---|---|
| 0 s | *Stop and pick.* Three bushes fill the picture, heavy with dark berries |
| 1-6 s | A slow stroke along a branch: plink, plink, plink, each one a note higher. Five ripe clusters |
| 7 s | Too fast across the next branch: three clusters drop and bounce once. A dull tick |
| 8-20 s | Through the leaves at the bottom, which hide a lot of fruit. A green cluster gets picked by mistake: a dry click |
| 21 s | A bush at the edge shakes. A dark shape, gone. A low woof |
| 22 s | You tap the cup. *Back away* [draft]. A bear in the berries, far off, which is the best kind |
| 23 s | Result: 0.6 quart, 92% ripe, 17 game minutes |

Result line: `0.6 qt · about 220 kcal · half saved for breakfast · ♥` [draft].

### 4.6 The bush

- **Clusters, not berries.** A quart of wild berries is many hundreds of berries. Each target is a cluster, 1/48 of a quart (design), about 3x3 pixels.
- **About 70 clusters** a screen across two or three bushes; the date sets the share that's ripe (4.2), and leaves hide about 30%.
- **Ripe** clusters are dark with a one-pixel pale bloom. **Unripe** ones are pale and smaller, with no bloom. **Shriveled** ones are small and brown, late in the season.
- **What you pick counts toward the quart,** ripe or not. Unripe picks are sour.
- **Next bush** [draft] moves along the trail for two game minutes when one's picked out.
- **Eaten or saved.** With a pot or a zip bag in the pack, half of what you pick is saved for the next breakfast or dinner. Without one, you eat it all now.

### 4.7 What skill is

- **Planning a stroke** that runs through ripe clusters and misses the green ones.
- **Speed control:** fast enough to fill the cup, slow enough to keep the berries.
- **Working the leaves:** where the hidden fruit is, and what parting them costs.
- **Knowing when to stop:** the clock in a timed mode; the bear.

### 4.8 The bear

Bears love these slopes in berry season: the region data logs 4 to 11 bears a trip in August 2026, and huckleberries are a major part of a bear's summer diet (USFS).

- **Dice:** whether a bear is in this patch. It is drawn when the patch opens: about 3% of patches in July and 8% in August and September (design).
- **Hands:** what you do about it. The tell comes at a seeded moment: a bush at the edge shakes, a dark shape shows for three frames, and there's a low woof. Stop within about three seconds (tap the cup, *Back away* [draft]) and it's a quiet Look at a bear in the berries, a lift in spirits. Keep picking and the region's **bear-in-the-berries** card fires, with its own honest odds.
- **No harm by design.** No wildlife card has a fatal branch (9.5, principle 2). The worst the bear card does is cost time, or, if food is outside a can, take it.
- **The tell is never a jump scare.** It is seen and heard, and it is never only a sound.

### 4.9 What it feeds

| Result | Goes into | Notes |
|---|---|---|
| Berries eaten now | Calories | About 340-380 kcal a quart (USDA blueberry figures, design for huckleberries) |
| Berries saved | +1 morale at the next breakfast or dinner [draft: huckleberry oatmeal] | Spoils in 2 days |
| The trip's first berries | Spirits +1 | Sour early berries give none |
| A full quart | Spirits +1 | — |
| Unripe picks | Count toward the quart; spirits −1 past a quarter of the cup | — |
| Time | 1 real second = 45 game seconds (design) | On the clock in timed modes |
| The patch off the trail | Leave No Trace −2 | The trail-side patch is sure (below) |
| The bear | A quiet Look, or the bear card | 4.8 |
| FKT fuel | The runner's carbohydrate store, at the modes draft's cap (its 4.8) | Grazing costs seconds |

**On the trail or into the meadow.** Some patches offer a choice first: *Pick along the trail* (sure) or *Step into the meadow* (better bushes, Leave No Trace −2) [draft]. The meadows on the Divide are fragile, and the choice teaches it.

**In the daily,** a full quart costs about 25 game minutes and pays about 360 kcal. That is rarely worth it for the time, and sometimes worth it for the legs. Exactly the kind of choice the board should reward thinking about.

### 4.10 Odds

None in the picking. It is pure input. The bear's presence is a seeded fact you can read in time; the bear card, if you walk into it, shows its own %.

### 4.11 Determinism

`hash(seed, "mini", "berries", segment, day, patch)` lays out the bushes, the ripeness, the hidden fruit and the bear. On a daily, everyone combs the same bushes. Picking is judged in ticks and world pixels, so a stroke is the same stroke on every phone.

### 4.12 Access

- **Auto** [draft: *Graze a while*]: half a quart, 85% ripe, 15 game minutes, and it always backs away from a bear.
- **VoiceOver:** three buttons, *Pick 10 minutes*, *Pick 20 minutes* and *Fill the quart* [draft], at Auto's rate.
- **Tap to pick** (Open assist): a tap picks the nearest ripe cluster within 20 pixels.
- **Reduce Motion:** bushes don't sway; knocked-off berries vanish instead of falling.
- **Color:** ripe means darker *and* a bloom pixel; unripe means paler *and* smaller.

### 4.13 Art

- **Bushes** as stamps in forest and moss, with rust and brick leaves from mid-September (the palette's own note for fall huckleberry, 11.1).
- **Clusters:** ripe in night navy with a glacier-blue bloom (huckleberry) or slate with a bloom (blueberry); unripe in sage or alpenglow pink; shriveled in bark.
- **The cup:** your pot, mug or a zip bag from the kit, filling a pixel at a time. Bare hands if you have neither.
- **The fingertip:** a small ink-outlined diamond.
- **The bear's tell:** a 3-frame dark shape in a far bush.

### 4.14 Sound

- **The plink.** Each ripe cluster lands in the cup with its own note, and the pitch climbs one step of a pentatonic scale every eighth of a quart, so a full cup plays a little tune. This is the takoyaki feel: many small touches, each with its sound.
- **A dry click** for an unripe pick, **a dull tick** for a dropped cluster, **a rustle** (filtered noise) through leaves.
- **The bear:** a low woof, and the bush's shake.
- **The place underneath:** wind in the heather, a far marmot.

### 4.15 Tuning targets

| Target | Value | Measured by |
|---|---|---|
| Session | 25 to 40 s; the player stops | Playtests |
| A full quart | 48 clusters; an expert in about 30 s (about 22 game minutes) | Bots, playtests |
| A first-timer | About half a quart in 40 s, 75% ripe | Five playtests |
| An expert | A quart in 30 s, 95% ripe, under 5% knocked off | Your own picking |
| Auto | Half a quart, 85% ripe, 15 game minutes | A golden test |
| The bush | About 70 clusters a screen; ripe share by date | A golden test per date |
| The bear | 3% of patches in July, 8% in Aug-Sep (design) | The harness |
| The daily's trade | A quart: about 25 game minutes for about 360 kcal | The harness |

### 4.16 The polish list

1. Every ripe cluster plinks into the cup, and a full cup plays its tune.
2. The fingertip is always visible above the thumb.
3. A knocked-off cluster bounces once and is gone.
4. The bush sways a pixel where you comb.
5. The cup rises a pixel per cluster.
6. Unripe picks look and sound wrong at once.
7. The bear's tell is unmistakable and never a jump scare.
8. The cup is the stop button.
9. No text while picking.
10. The trip's first ripe berry gets a one-frame snow sparkle.

---

## 5. The technical descent

*Roots and rocks coming at you, a tap for each, and the footsteps are the music.*

### 5.1 What it is

Going downhill fast on technical trail is a rhythm: roots, rocks, steps, a gravel patch, a wet slab. The modes draft already places this minigame (its 4.8): it fires on technical segments at Run or Race, sets the segment's time between x0.92 and x1.10, and feeds its stumbles into the footing check. This section fills it in, in the spirit of *Lonely Mountains: Downhill*: lines, flow, falls that teach, and no music.

### 5.2 Where and when

- **Segments tagged technical** with a steep descent (the doc's steep-descent term, 7.4), in your direction of travel. On the first playable: Deer Lake down past Canyon Creek to Sol Duc Falls, the stone staircase out of the basin, and the Bogachiel Peak spur. Later: the Hoh Lake trail's long drop to the Hoh, Appleton Pass, Hurricane Hill.
- **FKTs:** at Run and Race. **Open and the daily:** at Push pace, which is already "worse footing, x0.88 time" (7.4).
- **At most three a run,** the steepest. The rest resolve at Auto, so a long route doesn't become a rhythm marathon.
- **Practice** is the FKT window itself: unlimited tries in fixed conditions (the modes draft's 4.7).

### 5.3 Controls

- **Tap** as each obstacle reaches the feet line: a foot over a root, onto a rock, down a step.
- **Hold** to brake: the trail slows, the timing windows widen, and the clock runs.
- **Release** to let it run.

### 5.4 The loop

About 35 seconds for a segment, whatever its real length. The trail scrolls down toward the hiker, seen from above, like a map unrolling.

| Time | What happens |
|---|---|
| 0-5 s | Tread and a few roots. Each perfect tap adds a little speed: flow builds |
| 5-15 s | A cluster of rock steps you can see coming. Brake through it, or trust your timing |
| 15-25 s | Switchbacks with wet slabs: hold through the slab, tap the step after it |
| 25-35 s | The creek gets louder, the trees open, Sol Duc Falls. The split |

**Judging** (design): *perfect* within 5 ticks (about 42 ms), *good* within 11, otherwise a stumble. At Race the windows shrink 15%. After dark the headlamp's pool shows only about 1.2 seconds ahead instead of 2.

**Flow:** each perfect tap adds 2% speed, up to +12%; a stumble takes away 8% and makes a scuff; braking takes 25% while held.

### 5.5 What skill is

Timing, reading the cluster ahead, braking *before* the rough bit instead of in it, and the nerve to let it run.

### 5.6 What it feeds

| Result | Goes into | Range |
|---|---|---|
| Flow and braking | The segment's time | x0.92 to x1.10; Auto x1.00 |
| Stumbles | Your hands on the segment's footing check | 0 stumbles +6; 1 +3; 2 0; 3 −3; 4 −6; 5 or more −10 |
| The footing check | Rolled ankle: mild (x1.15) or moderate (x1.6, Serious) | The modes draft's 4.8 |

### 5.7 Odds

**Hands decide the flow and the stumbles. The dice decide whether a stumble turns an ankle.** The pace chip shows the range before you choose it. On the Deer Lake descent at Race (design numbers, matched to the modes draft's "about 1 in 14" at par):

| Hands | Clean | Made it | Rolls an ankle |
|---|---|---|---|
| Worst (−10) | 76 | 88% | 12% |
| Auto (0) | 86 | 93% | 7%, about 1 in 14 |
| Best (+6) | 92 | 96% | 4% |

A moderate sprain is Serious, so the linter makes this a ♦ and the chip shows it so (8.1). The chip reads `Race ♦ {hand}88-96%` [draft], and the roll lands at the bottom of the segment, after the minigame, with the compass.

### 5.8 Determinism

The obstacle track comes from the segment's own profile (its steep feet, its class, the surface), the direction, wet or dry, light or dark, and the window's seed. Everyone in a window runs the same roots. Taps are judged in ticks, never against the sound. A latency setting of up to 150 ms is allowed and recorded in the log, and the verifier rejects inputs no hand could make (the modes draft's 6.3).

### 5.9 Access

**Auto** gives x1.00 and par hands. **Wide windows** (Open) makes them 50% wider. **Reduce Motion:** the scroll is the game, so it stays, but with no parallax or shake, and Auto is offered first on the card. **VoiceOver:** Auto. **Sound off:** every obstacle is visible ahead, and the feet line flashes on a perfect.

### 5.10 Art and sound

- **Art:** the trail from above as a ribbon of bark-brown tread through forest; roots as bark lines, rocks in slate with a glacier-blue edge, gravel as a `diag` dither, wet slabs as `hlines`; a new top-down hiker (7x7, the rust jacket); the headlamp's pool after dark (the doc's lamp pseudo-color).
- **Sound, Lonely Mountains style:** footsteps by surface (a dirt thud, a rock clack, a root knock, a gravel scuff, a wet-slab slap), poles clicking, breath that quickens with speed, the creek rising as you near it. A stumble is a scuff and a skitter of pebbles. When the flow is perfect, the footsteps fall into an even rhythm: that is the music.

### 5.11 Tuning targets

| Target | Value | Measured by |
|---|---|---|
| Length | 30 to 40 s a segment | Playtests |
| Obstacles | About 1.6 a second at Run, 2.2 at Race | The track builder |
| Auto | x1.00, 2 stumbles | A golden test |
| A clean expert | x0.93, 0 stumbles | Bots |
| A first try | x1.04, 3 to 4 stumbles | Playtests |
| The cap | Best to worst under 10% of a typical run (the modes draft's 6.3) | The harness |

### 5.12 The polish list

1. Every tap has its footstep, by surface, within a frame.
2. You can always see the next rough patch before it matters.
3. Flow feels like speed: the scroll and the footsteps quicken together.
4. A stumble never feels random: the obstacle was there.
5. The headlamp's pool makes night runs different, not unfair.
6. The split appears the moment the segment ends.

---

## 6. Ice-axe self-arrest

*Three seconds on hard snow. The one minigame that can be the last thing a hiker does.*

### 6.1 What it is

You slipped on steep snow. You are sliding, faster every tenth of a second, toward the rocks at the bottom. Roll toward the pick, drive it in, put your weight on it, and stop.

**The technique is real.** Ortovox's safety academy teaches it this way: hold the axe diagonally across your body, one hand over the head and one on the shaft; roll onto your stomach; press the pick in and push your weight onto it; without crampons, dig in your toes; with crampons, bend your knees so the points stay off the snow, because a caught point "can result in a somersault and injury." It warns that falls happen on 30 to 35° slopes, that speeds can approach free fall, and that you should get into position "as quickly as possible." Wikipedia's account calls for an "instinctive and instantaneous movement," before speed builds.

### 6.2 Where and when

- **Only after a slip on a ♦.** Crossing steep snow is a choice with a sure way around (turn back, wait for softer afternoon snow, take another way). If its roll comes up *slide*, the minigame plays.
- **Places:** the High Divide's early-season snowfields (the region's `snowfield_high_divide` hazard: the rim, Bogachiel Peak, Heart Lake Junction) in the shoulder season (M1b); later Royal Basin, Grand Pass, Anderson Pass and Appleton Pass.
- **Never a fatal band at a `real_incident` site** (9.5, principle 3): not on the Olympus climbing route, and not on the shortcuts toward Boulder Lake near Mount Appleton. There, the worst is a rescue.
- **On Jon's rope** (Olympus with Jon, 4.2) a fall is held. No minigame.
- **Practice:** snow school with Jon, and once, the first time a hiker with an axe stands on safe snow, a flavor choice, *Try a slide* [draft] (15 minutes, Wet +1), on a slope with a clean runout.
- **Modes:** Open, and the daily and FKTs in early season. The same rule everywhere.

### 6.3 Controls

The slide starts in one of four positions, drawn from the roll's effect stream (design: 40%, 30%, 20%, 10%):

| Start | What you do | The real move |
|---|---|---|
| Feet first, on your front | Hold: dig in | The push-up position; brake with the axe |
| Feet first, on your back | Swipe toward the pick, then hold | Roll onto your stomach, toward the axe's head |
| Head first, on your front | Tap the snow beside you, then hold | Plant the pick to the side; your feet swing downhill |
| Head first, on your back | Tap beside you, swipe, hold | Elbows in, knees up, roll onto your stomach |

- **Hold** presses the pick in and puts weight on it. The braking builds over a third of a second.
- **With crampons,** a roll started above 5 m/s catches a point one time in two (design) and flips you head first. A clean, early roll keeps your knees bent for you.
- **Without crampons,** your toes dig in on your front: a little more braking.

### 6.4 The physics

Design values on a 30° slope. Snow is hard and icy before 10 am and soft after 1 pm (7.6).

| Snow | After 1 s | After 2 s | After 3 s |
|---|---|---|---|
| Hard, no arrest | 4 m/s · 2 m | 8 m/s · 8 m | 12 m/s · 18 m |
| Soft, no arrest | 2 m/s · 1 m | 4 m/s · 4 m | 6 m/s · 9 m |

With the axe in, braking beats gravity by about 3 m/s² on hard snow and 6 on soft (design). Trekking poles brake at 40% of that; hands and boots alone, a little on hard snow and some on soft.

| You're braking by | Hard snow, you stop at | Soft snow |
|---|---|---|
| 1.2 s (Auto at snow 1, a back start) | 7 m | 2 m |
| 2.4 s (you froze) | 28 m | 7 m |

So on hard morning snow with rocks 25 m below, a two-second freeze reaches the rocks, and the same freeze on soft afternoon snow is a scare. That is the lesson the slopes teach: the hour matters as much as the axe.

### 6.5 Where you stop

| Stopped within | Rung | What happens |
|---|---|---|
| 8 m | 1, Uncomfortable | A scare and snow up the sleeves: Wet +1 |
| The runout's first two thirds | 2, Trouble | Scrapes; a lost pole or glove |
| The last third | 2, Trouble | And a mild sprain |
| The runout: the rocks | 3, Serious | Badly hurt, then the death roll |

**The death roll** after a slide into rocks is 20% (design), a new row for the doc's table (9.5). Its cause key is `fall`, with a snow line under *YOU PERISHED* that is yours to write. Then the five death screens, unchanged.

**Where the runout is clean** (a flat bench, a lake), the worst is Trouble, the crossing is a plain %, and the minigame is just a scare.

### 6.6 Odds

**Hands decide how fast you roll and dig in. The dice decide the slip, the way you land, and what the rocks do.** The ♦ button shows the slip as exact, and the fatal share at the worst hands, which means no arrest at all.

Worked example (design numbers): early July, 8 am, the steep snow below the rim, no traction, an ice axe and poles, snow skill 1.

| Part | Value |
|---|---|
| Base for this snow (hard, steep) | 80 |
| No traction | −10 |
| Ice axe, self-belay | +10 |
| Trekking poles (8.5) | +5 |
| Snow skill 1 | +2 |
| Clean · shaky · made it | 87 · 7 · **94%** |
| Slide | 6% |
| Worst hands: all slides reach the rocks | 6% x 100% x 20% = **1.2%** |
| Auto: 1 in 8 slides reach the rocks | 6% x 12.5% x 20% = 0.15%, shown 0.2% |

```
[ Cross the snow ♦ 94%         (i) ]
  6% slide · up to 1.2% fatal
[ Wait for softer snow    3 h  sure ]
[ Go around by the trail  +1.4 mi   ]
```

With Auto on, the second line reads `6% slide · 0.2% fatal`. The Why sheet says it in a sentence: *If you slide, how you arrest decides how far. No arrest: the rocks. A quick one: a scare.* [draft]

**The ice axe's old +25** (the doc's 6.7) becomes the self-belay's +10 on the slip plus the arrest after it. At Auto the two together are worth about what the +25 was (a tuning target).

### 6.7 Determinism

The slip is the ♦'s roll, keyed at the confirming tap. The start position and speed come from that roll's effect stream. The slope (angle, hardness by the hour, the runout) comes from the place's data. So everyone who slips in the same place on the same daily slides the same way, and only the hands differ. Auto's chance of reaching the rocks is computed exactly by running Auto's script on every possible start.

### 6.8 Access

**Auto** reacts in 0.8 s at snow 1, 0.1 s faster each level, down to 0.4 s. In a timed mode everyone's Auto is the same. **VoiceOver:** Auto. **Reduce Motion:** the slope scrolls, but the camera never shakes or tilts, and Auto is offered first. **Sound off:** the rocks and the speed bar are always on screen.

### 6.9 Art and sound

- **Art:** the tall plate as a slope scrolling past; the hiker sprite sliding in four poses, the axe drawn large enough to read which side the pick is on; the rocks waiting at the bottom; a pick-scrape trail in the snow as you brake; a speed bar.
- **Sound:** the hiss of the slide, rising with speed; the pick's scrape, a harsh noise band that falls in pitch as you slow; your breath; then nothing but the wind. No music, and no sting unless it's the death sequence's own (13.2).

### 6.10 Tuning targets

| Target | Value | Measured by |
|---|---|---|
| Length | 2 to 6 s of sliding | The physics |
| Reference slope (30°, hard, rocks at 25 m) | Novices stop short 70%; regulars 95%; Auto 87.5% | Playtests, a golden test |
| Soft snow, same slope | Nearly everyone stops short | A golden test |
| Snow school | 3 or 4 practice slides teach it | Playtests |
| Axe value | Self-belay plus arrest at Auto ≈ the old +25 | The harness |

### 6.11 The polish list

1. The first tenth of a second makes the danger obvious: the tilt, the hiss, the rocks.
2. The axe's pick is unmistakable, so the right swipe is never a guess.
3. The bite builds over a third of a second and you feel it: the scrape deepens, the speed bar falls.
4. Stopping is sudden and silent.
5. Nothing in the slide is text.
6. Snow school's first slide is in slow motion.

---

## 7. The cold creek ford

*Step in the lulls between surges, before your feet go numb.*

### 7.1 What it is

A knee-deep or deeper river, glacial gray or snowmelt clear, and cold. You pick your spot, unbuckle your hip belt, and cross: one step at a time, each in the lull between surges, facing upstream with your poles. Wait too long for a lull and your feet go numb, and numb feet step badly.

**The technique is real.** The Park Service's stream-crossing advice (Katahdin Woods and Waters) says to release the waist and sternum belts; face upstream and cross at a slight angle downstream in faster water; look for the widest or most braided part of the channel, usually the shallowest; move one foot at a time, sliding it along the bottom; hold a pole upstream for a three-point stance; and turn around or wait if the water is too high, too cold or too swift.

### 7.2 Where and when

- **The fords in the region data:** the Hoh's braids before Olympus Guard Station; the Queets at its trailhead (NPS: "commonly waist deep in summer," and it can be fordable on the way in and not on the way out); the Enchanted Valley washout and White Creek on the Quinault side; the Elwha just past Chicago Camp; Goodman Creek and Falls Creek on the coast, where high tide backs the sea up the channel; the Ozette River mouth; Lena Creek; the West Fork Dosewallips; the Upper Duckabush.
- **Knee-deep or more.** Shallower fords stay narrated, as now (7.7).
- **The High Divide loop has no fords** (its region data), so the ford arrives with the Hoh in M2.
- **Modes:** Open, the daily (on the clock), FKTs. **No practice.** Fords aren't something to do for fun, and the first one a career meets is shallow.

### 7.3 Before you step in

One screen, three optional taps:

- **Shoes:** boots, sandals or bare feet, from your kit. Sandals keep the boots dry for after. Flip-flops can wash away (the catalog's `loss_in_current`: 0.6 for flip-flops, 0.3 for foam camp shoes).
- **Unbuckle the hip belt:** tap the buckle. It's the doc's +3 (7.7), and the click is satisfying.
- **The spot,** where a ford has more than one: a riffle over gravel (shallow, fast), a smooth glide (deep, slow) or a braid (shallow and spread out). Each spot is the ford's flow index ± 0.1 (seeded, design), about ±4 points. You see how the water looks, not the number. *Scout upstream* (20 minutes, +5, 7.7) shows the numbers.

### 7.4 Controls and the loop

- **Tap to take a step,** best in a lull. Surges come every 1.2 to 2.0 s (seeded), as white bands sliding downstream; the lulls last 0.5 to 0.9 s.
- **Hold to brace** through a surge: no wobble, but the cold keeps counting.
- **8 to 12 steps** cross the river; 15 to 30 seconds.
- **Footwork** starts at 0: each clean step +1 (up to +6), each step into a surge −2 (down to −8).
- **Numb feet:** after 10 s in glacial water (15 s in rain-fed or snowmelt creeks), the lulls you can use shrink 10% a second (design). Bare feet go numb twice as fast.
- **Poles** make the lulls feel 30% longer: the three-point stance.
- **The live line** under the picture shows the made-it % moving with every step.
- **At the far bank,** the roll: the compass on a ♦, straight to the outcome otherwise.

```
┌──────────────────────────────────────┐
│ Hoh braids · knee-deep · glacial     │
│ ┌──────────────────────────────────┐ │
│ │ far bank ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │ │
│ │ ≈≈≈ surge ≈≈≈▶       ≈≈≈≈▶       │ │
│ │          o/  you, facing up      │ │
│ │ ≈≈▶        ≈≈≈≈≈▶       ≈≈≈▶     │ │
│ │ near bank ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │ │
│ └──────────────────────────────────┘ │
│ feet ▓▓▓▓▓░   step 4 of 9            │
│ made it 91% ▸ 93%                    │
│ tap: step · hold: brace              │
└──────────────────────────────────────┘
```

### 7.5 Odds

**Hands decide your spot and your steps. The dice decide the rock that rolls under a boot.** The ranges, worked from the doc's own ford (8.11) with footwork from −8 to +6 and one spot:

| The ford | Clean at Auto | The button |
|---|---|---|
| Knee, no poles, two things strapped outside | 81 | `{hand}87-94%`, Auto 91% |
| Thigh, 3 pm, no poles, heavy, tired | 47 | `♦ {hand}64-77%`, up to 36% goes badly (swept is a rescue) |
| Waist, the same hiker | 12 | `♦ {hand}30-43%`, up to 2.1% fatal; Auto 1.9% |

The waist row's fatal share at the worst hands: 70% fail x 15% swept x the doc's 20% death roll = 2.1%. At Auto it is the doc's own 1.9%. *Camp, cross at dawn* sits under it, sure, as it always has.

### 7.6 What it feeds

| Result | Goes into |
|---|---|
| The roll's outcome | The doc's fail table: soaked 70, a dropped item 15, swept 15 when the flow index is over 1.5 (8.3) |
| Wet feet | Feet wear doubles while wet (7.9), unless sandals and dry socks after |
| Minutes in the water | Warmth, through the heat balance (7.9) |
| Lost footwear | On a fail, `loss_in_current` decides it |
| Time | 1 real second = 20 game seconds (design); on the clock in timed modes |

### 7.7 Determinism, access, art and sound

- **Determinism:** `hash(seed, "mini", "ford", ford, day, attempt)` sets the surges and the spots' offsets; the river's true flow index comes from the depth model (7.7) at that hour. A second try after a failure is a new attempt, as the doc already rules (8.14).
- **Access:** **Auto** steps at par (river skill raises it in Open). **Slow water** (Open) slows surges 30%. **Reduce Motion:** the water's bands move in whole-pixel steps with no shimmer. **Sound off:** surges are visible before they arrive.
- **Art:** the river from above, in teal and glacier blue with the doc's river cycle (11.5), surges as white `hlines` bands; the hiker facing upstream with poles; cobbles under the water.
- **Sound:** the river's roar, louder with the flow index; muffled clacks of cobbles underfoot; a sharp breath at the first step in; the surge as a rising rush. No music.

### 7.8 Tuning and polish

| Target | Value |
|---|---|
| Length | 15 to 30 s |
| Auto | Footwork 0 |
| A clean expert | +5 to +6 |
| A first try | −2 to 0 |
| Numbness | Bites after about 10 s in glacial water |

**Polish:** the step lands on touch-down with a splash; a surge is always readable a second ahead; numbness shows in the feet bar *and* in the hiker's smaller steps; the far bank's first dry step has its own crunch; the outcome never contradicts what you just played (a fail shows as a slip on the last step, never as a sudden teleport).

