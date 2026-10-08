# Sound, and every word yours

*A draft for the creator, written 2026-10-08 for the new direction. It follows decisions 21 to 34 in `design/PENDING_DECISIONS.md`, which override `GAME_DESIGN.md` wherever they disagree. Nothing here is decided until you say so. The calls you need to make are collected in [section 26](#26-decisions-for-you).*

*Every piece of in-game English in this file is a placeholder for your words (decision 21). Short lines are marked (DRAFT), and every wireframe and sample batch is a draft as a whole. The Boyz appear only as `{BOY_n}`, and Jon only by his first name. The other drafts own the frame and home (`frame_home.md`) and the modes (`daily_fkt.md`). This one owns what you hear, and how every word reaches you for approval.*

## Contents

**Part one: Sound**

0. [The short version](#0-the-short-version)
1. [What Lonely Mountains: Downhill does](#1-what-lonely-mountains-downhill-does)
2. [Rules for our sound](#2-rules-for-our-sound)
3. [The stack: nine layers](#3-the-stack-nine-layers)
4. [Where you are: zones and places](#4-where-you-are-zones-and-places)
5. [When: hour, season, weather, silence](#5-when-hour-season-weather-silence)
6. [Walking: the walk-on and the footsteps](#6-walking-the-walk-on-and-the-footsteps)
7. [The body and the gear](#7-the-body-and-the-gear)
8. [The minigames](#8-the-minigames)
9. [Music: the few moments](#9-music-the-few-moments)
10. [Where every sound comes from](#10-where-every-sound-comes-from)
11. [The iPhone: Safari's audio realities](#11-the-iphone-safaris-audio-realities)
12. [The mix](#12-the-mix)
13. [The sound credits and license log](#13-the-sound-credits-and-license-log)
14. [What M1a's sound needs](#14-what-m1as-sound-needs)

**Part two: Every word yours**

15. [The promise](#15-the-promise)
16. [What counts as ours](#16-what-counts-as-ours)
17. [Where the words live](#17-where-the-words-live)
18. [Status: draft, approved, changed, cut](#18-status-draft-approved-changed-cut)
19. [No English in code: the lint](#19-no-english-in-code-the-lint)
20. [Builds: main ships approved words only](#20-builds-main-ships-approved-words-only)
21. [Batches](#21-batches)
22. [The review workflow, in three steps](#22-the-review-workflow-in-three-steps)
23. [The count: how much there is to read](#23-the-count-how-much-there-is-to-read)
24. [How this changes the build sessions](#24-how-this-changes-the-build-sessions)
25. [Session 1's live words, and how they move](#25-session-1s-live-words-and-how-they-move)
26. [Decisions for you](#26-decisions-for-you)
27. [Facts checked, and sources](#27-facts-checked-and-sources)

---

## 0. The short version

**Sound**

- **On the trail there is no score.** You hear the place and yourself: the creek, wind on the crest, rain on your hood, a thrush in the fog, your boots on each surface, your poles, your pack, your breath on the climb. Lonely Mountains: Downhill does the same, and so does Leave No Trace's seventh principle: *"Let nature's sounds prevail."*
- **The ground is the instrument.** Each surface in the park data owns its footstep sound: duff, gravel, scree, snow, roots, planks, mud and water. *Walk on* plays a short montage of the segment you just walked, so you hear the bridge, the climb and the snow patch you crossed.
- **Music lives at home, and at a few moments.** Home is the cabin theme. The moments are the soak, the finish, YOU PERISHED and the daily sting, plus the Bonfire Lily's motif, which plays once in a lifetime. All of it is a small "cabin band" of chunky synth voices that runs in code, so there are no music files and nothing borrowed but the Chopin dirge.
- **One exception, and it's yours to allow:** music you carried in. The harmonica and the travel ukulele are already in the gear catalog. Carry one and you can play it at camp.
- **Silence is a sound.** When a red-diamond choice is on screen, the birds fall away and you hear the wind and your breath. It happens every time there's a ♦ and never otherwise, so it stays honest.
- **Sources:** public-domain and CC0 recordings, plus synthesis. The verified libraries are Freesound's CC0 filter and the NPS sound libraries at Rocky Mountain and Yellowstone, which are public domain. BBC Sound Effects and the Sonniss GDC bundles are out. Every file is logged with its license, and a lint enforces the log.
- **The iPhone:** sound starts on the first tap. The game uses Safari's *ambient* session, so it respects Silent Mode and mixes with your own music or podcast. It recovers from calls and the background. Files are AAC, with about 2 MB for M1a, all cached for offline. Nothing depends on a gapless loop.
- **Sound never carries information alone.** Most players will play on silent, so anything that matters is also in the words or the picture. Sound is the reward for turning it on.

**Words**

- **Every original English string in the game has an id and lives in `content/text/`, never in code.** That covers buttons, alt text, aria labels, the manifest's name and share text. A lint fails the build on English in JS, HTML, CSS or the manifest.
- **Status comes from a ledger.** When you approve a line, its exact text is frozen and hashed in `content/text/approved.json`. Edit the line later and it is a draft again automatically, while main keeps shipping the frozen approved words until you approve the new ones.
- **Main ships approved words only. Preview shows drafts,** and its debug mode marks each one, so you can see what's unapproved while you play.
- **Batches come grouped by screen,** with a context note per line and a screenshot numbered to match. They start in chat. Later they move to a private review page where you tap Approve, Edit or Cut on your phone, and your answers flow back into the repo.
- **Not ours:** real place names, species names, verbatim public-domain quotes and Apple's own labels need no approval, but you can veto any of them.
- **Sessions never wait on you.** They write drafts, send a batch and move on. Only a promotion to main needs the words on the promoted screens approved.
- **Session 1's 13 live strings** move into the text system with no visible change. They stay live on main until you answer Batch 1, a sample of which is in 25.3.
- **The honest cost:** M1a has roughly 2,000 lines to read, about 50 batches of ten minutes each across the build.

---

# Part one: Sound

## 1. What Lonely Mountains: Downhill does

You named it: *"I like how lonely mountains downhill did music honestly."* Here is what's known about how Megagon's game handles sound, and what we take.

**What the record says:**

- **No music on the ride.** Megagon, in 2017: *"There will be no background music as you ride down the mountain."* Instead, *"expect to hear the wind rustling in the trees, the chirping of birds and animals grazing in the forests."* (Worthplaying.)
- **The ground carries the sound.** In Megagon's level-production breakdown: *"Individual ground types define the ground color, but also all attached physic and audio properties."* An outside studio, Syndrone, did the sound effects, and placed the sound emitters late, in the visual polish phase. (80.lv.)
- **The bike sound is computed.** Wikipedia describes a dynamic audio system that takes in momentum, the type of bike, the terrain and the player's movement.
- **Reviewers heard it as the point.** *"The only sounds are the chirrups of birdsong and the crunch of knobbly tyres on dirt, gravel, and rock... you can pop in some earbuds and listen to your own soundtrack."* (Thumbsticks.) *"An owl's solitary call echoes across the mountainside in the pre-dusk light."* (Game Informer.)
- **Tracks are timed in segments.** Each track is split into checkpoint segments, with a time for each section (Wikipedia). That is our splits, from the frame draft.
- **Not confirmed:** what plays in its menus. A separate soundtrack is sold on Steam, but no source we found says where in the game it plays. Our plan doesn't depend on it, because decision 32 already says where music goes.

**What we take:**

1. No score while you move.
2. Each surface owns its sound, from the same data that draws it.
3. The body tells the effort: pace, load and tiredness change the steps and the breath.
4. Sparse life. One owl at the right hour beats a wall of birds.
5. Room for the player's own soundtrack. The ambient session mixes with their music.

**What we add:** real places, the real season, the real NWS weather on the daily, real thunder distance, music at the cabin, and music you carried in.

**One more touchstone.** In *Sword & Sworcery*, Jim Guthrie's music is part of the play, and the moon follows the real clock (Wikipedia). The cabin already runs on Lake Quinault's real clock (frame draft 3.4), and its theme changes with that clock.

---

## 2. Rules for our sound

1. **No music on the trail.** That covers the trail, the drive, town and the minigames. Music plays only at the cabin and at the moments in section 9. Music you carried in is the one exception, if you allow it (26, S2).
2. **Let nature's sounds prevail.** That is Leave No Trace's seventh principle in the NPS's own words, and it is LMD's rule too.
3. **Sound never carries information alone.** The thunder's distance, the creek you're near and the shiver that stops are all in the words or the picture as well. Players on silent miss the beauty, not the facts. No captions are needed, because no sound is required.
4. **Honest, like the odds.** The marmot whistles only above 4,000 ft and only while marmots are awake. The elk bugle in September. Thunder arrives 5 seconds per mile after the flash. The hush comes with every ♦ and never without one.
5. **The ground is the instrument.** Surfaces come from the park data, never from a guess.
6. **Real world, toy interface.** The world sounds like recordings, a little band-limited to sit with the chunky pixels. The interface and the music use the chunky synth voice.
7. **Quiet by default.** A phone at half volume should feel like standing there, not like a game shouting.
8. **Audio is decoration in every minigame.** Judging happens against ticks, never against sound, because Bluetooth adds delay (daily draft 6.3).
9. **Only public-domain, CC0 or synthesized sources,** each logged (decision 33). No human voices.
10. **The audio dice are never the game's dice.** Sound picks its variations from its own random stream, so it can never change a daily, a replay or a seed (E.8).

---

## 3. The stack: nine layers

Everything you hear is one of these. Each has its own bus, so the mix can raise or duck it as a whole (section 12).

| Layer | What's in it | Made from |
|---|---|---|
| **Bed** | Air tone, wind, distant valley hush | Synthesis |
| **Water** | Creek, river, falls, lake, surf | Synthesis plus recorded grains |
| **Life** | Birds, marmots, elk, squirrels, insects, frogs | Recordings, some synthesized |
| **Weather** | Rain by surface, gusts, thunder, hail, drip | Synthesis plus recordings |
| **Body** | Footsteps, breath, heartbeat, shiver | Recordings plus synthesis |
| **Gear** | Poles, pack, stove, zipper, can, pad | Recordings plus synthesis |
| **Events** | One-shots from cards: a rockfall, a branch | Recordings |
| **UI** | Ticks, the compass roll, the censor blip | Synthesis (the chunky voice) |
| **Music** | The cabin band | Synthesis (code) |

**Where it lives in the repo** (a proposal; the build plan's revision places it):

| Path | What it is |
|---|---|
| `web/js/audio/engine.js` | The context, unlock, session type, buses, limiter, interruptions |
| `web/js/audio/dsp.js` | Pure synthesis: oscillators, noise, envelopes, filters. The same code runs in Node, like the picture VM |
| `web/js/audio/scape.js` | Turns place, hour, season and weather into layers |
| `web/js/audio/steps.js` | Footsteps and the walk-on |
| `web/js/audio/music.js` | Plays scores through `dsp.js`, a bar ahead |
| `content/audio/sounds.json` | The bank: every cue, its file, its variants and its gain |
| `content/audio/scapes/*.json` | Listening maps: which layers, where and when |
| `content/audio/music/*.json` | The scores, as notes |
| `content/audio/credits.json` | The license log (section 13) |
| `content/audio/masters/` | Trimmed, edited sources (FLAC) |
| `content/audio/enc/` | The encoded files that ship (AAC) |
| `tools/audio.mjs` | Fetch, trim, encode, log |
| `tools/listen.mjs` | Renders a scene to WAV, a spectrogram PNG and a loudness reading |

`dsp.js` and the scores join the pure modules that lint E01 already guards: no `Math.random`, no clock and no DOM.

---

## 4. Where you are: zones and places

### 4.1 How a place gets its sound

Every stop has a **listening map entry**, like a picture recipe but for the ear. For M1a's 35 or so places it is written by hand, in `content/audio/scapes/sol_duc.json`, from the region data. Later regions start from the data's own fields, and get a review pass.

| Field | From the data | Example |
|---|---|---|
| `zone` | The doc's six weather zones (7.5), plus town and cabin | `high` |
| `canopy` | `scene_art_notes`; old growth, parkland or open | `parkland` |
| `water` | Each source and its distance: creek, river, falls, lake, surf | `lake:near, outlet:40m` |
| `exposure` | Hazards `exposure` and `lightning`; node types pass and summit | `crest` |
| `echo` | Hand-tagged rock bowls | `basin` |
| `life` | `wildlife_and_plants[].where` for the node | `marmot, sooty_grouse` |

**Sol Duc Falls, as an example:** zone `north_mid`, canopy old growth, water falls:near plus river, no exposure, echo slot (the rock slot). Life is the dipper on the rocks and the thrushes in season (Section 5.2).

### 4.2 The zones

| Zone | The bed | Water and life |
|---|---|---|
| **Coast** | Surf roar, offshore wind | Surf by tide and swell, gulls, the creek mouth; fog drip in the spruce |
| **West valleys** (Hoh, Quinault) | Deep hush under the canopy | River, drip; Pacific wren, varied thrush; elk in the fall |
| **North mid** (Sol Duc) | Canopy wind high above you | River and falls; thrushes, kinglets, Douglas squirrel |
| **High** (the Divide) | Open air, wind on the crest | Lakes, outlets, snowmelt trickles; marmots, sooty grouse, Canada jay, ravens |
| **East high** (rain shadow) | Drier wind, less drip | Fewer creeks; the same high life |
| **Alpine** | Wind, then nothing | Meltwater under rock, the glacier's creak (M2) |
| **Town** (Port Angeles) | Street hum, harbor wind | Gulls; the store doors (4.5) |
| **The cabin** | Quinault rain forest hush | Rain on the roof, maples dripping, wrens and thrushes; elk in September |

The NPS's own description of the park's soundscape covers the same span: *"the rushing winds of the glacial peaks"*, the coast's *"crashing waves and seabird songs"*, *"the rainfall and vibrant wildlife rustling under the Hoh's forest canopy"*, Roosevelt elk *"bugling in the late-summer mating season"* and *"Pacific wrens exchanging complex calls."*

### 4.3 Water: how far is the creek?

Water is the park's main voice, and it tells you where you are.

- **Distance shapes it.** Near water is loud and bright. Far water is quiet and low-passed, as air soaks up the highs. The walk-on (6.1) brings a creek up as you reach it and lets it fall away after.
- **Flow shapes it.** Rivers follow the doc's monthly flows (7.7): fuller in June, thinner in September. A ford's roar follows the same flow the ford card rolls against, so a louder ford really is a harder one, and the card says so in words too.
- **Kind shapes it.** A falls is a steady roar with a mist hiss. A creek babbles, which synthesis does well. A lake laps only when there's wind. A tarn in still air is silent, which is right.
- **Dry stretches are dry.** Segments tagged `no_water`, like the High Divide crest, have no water layer. Only the wind remains. Players who listen learn where the last water was.

### 4.4 Echo

Two rooms get a touch of echo, because the real places do.

- **Rock bowls,** like the Seven Lakes Basin from the rim: a soft slap off the far wall on marmot whistles, thunder and stones.
- **Slots and canyons,** like Sol Duc Falls: a short, dense reflection under the roar.

The echo is a synthesized impulse response (decaying noise), so it costs no file.

### 4.5 The cabin and town

**The cabin** is home, so it gets music (section 9). Under the music, the place keeps its own sound:

| Place in the scene | Its sound when tapped or live |
|---|---|
| The screen door | Spring creak, then the slap |
| The shed | Latch and hinge; wooden shelves when you browse |
| The car | Door thunk, keys; the engine on the drive |
| The fire bowl | Crackle when lit; nothing when it's ashes |
| The register post | Pencil on paper |
| The mailbox | Hinge squeak; the flag's tick when it goes up |
| The hot tub | Jets hum and bubbles when lit; a lid thump |
| The guest book | A page and a pen |
| The chalkboard | Chalk |
| The map table and printer | Paper; an old printer's clatter for the permit |

**The real weather plays on the roof** (frame draft 3.4): rain on the shingles, the gutter's trickle, the downspout. In snow the world goes quiet, and now and then a load of snow slides off a branch. Fresh, fluffy snow absorbs sound, a hush the NSIDC describes (via WFPL). Wind lives in the spruce behind the roof.

**When the crew is around** (frame draft 3.10), there are no voices: the cooler lid, a dog, tent zippers on the lawn, and a fuller cabin theme (9.2). Recorded voices are out under rule 9, and real people's voices are out on principle.

**The drive** has no music: the engine, the road, rain and wipers, the turn signal at the junction. A radio is your call (26, S3).

**Town** has gulls, street hum, the harbor wind, and each store's own door. The general store has a bell and a creaky floor. The gear shop is a quiet room with a hum. The boutique is softer still.

---

## 5. When: hour, season, weather, silence

### 5.1 The hour

| Time | What changes |
|---|---|
| **Dawn** | The chorus: the most birds of the day, rising as the light comes up |
| **Midday** | A lull in the birds; wind and insects up in summer |
| **Evening** | The thrushes: the one time of day you're likely to hear their songs |
| **Night** | Birds gone; the water seems louder; wind, an owl, the odd branch |

The engine's sun times (7.2) drive this, so dawn at Deer Lake is when the game says it is.

### 5.2 The season

Each species in a listening map carries its months, hours and heights. The ones below are verified. Anything else is marked *to check* in the scape file until a source confirms it.

| Who | Where and when | Source |
|---|---|---|
| **Olympic marmot** whistle | Meadows above 4,000 ft. They hibernate from September or early October, for 7 to 8 months | NPS |
| **Roosevelt elk** bugle | High meadows. Bulls bugle in September | NPS; region data |
| **Sooty grouse** hoot | Mountain meadows; males hoot deeply in early summer | NPS; region data |
| **Varied thrush** | One long buzzy note, then another on a new pitch. Breeds in the Olympics, winters in the lowlands, sings most from late April | Eastside Audubon; region data |
| **Swainson's thrush** | Lowland forest, June to August; a spiraling song | Grays Harbor's *Daily World* |
| **Winter (Pacific) wren** | A long warble hidden in the understory | NPS (which calls it winter wren) |
| **Mosquitoes** | Heavy late June to July, mostly gone by late August | Region data |
| **Pacific chorus frog** (cabin, nights) | Late winter into spring; sources disagree on the span | Wikipedia, with a recording archive's listing (*to check*) |

**At the cabin the year turns too:** wrens in every season, varied thrushes in winter and early spring, Swainson's thrushes on summer evenings, frogs on spring nights, elk in September.

### 5.3 Weather

Weather comes from the doc's zone states (7.5): clear, partly cloudy, fog, drizzle, showers, rain, storm, plus snow and the thunder overlay. On the Hike of the Day those states come from the real NWS forecast (decision 31), so everyone hears the same day.

**Rain depends on what's over your head.** The pack knows, so the rain does too:

| Over you | What rain sounds like |
|---|---|
| The forest | A soft hiss high above, then heavy drips |
| Your hood | Close, crisp ticks right at your ears |
| A hiking umbrella | A drum: louder, rounder, and drier underneath |
| No hood, no umbrella | The forest or open hiss, and the body sounds wetter |
| A tent fly | The camp sound. Silnylon patters softly; a tarp snaps in gusts |

The umbrella and the tarp are real catalog items, and the moss crowd will hear the difference.

**Wind** is synthesized: noise through a moving band-pass filter, with gusts. It grows with exposure. It is a breath in the forest and a roar on the crest. In fog it drops, and the varied thrush's single note carries.

**Thunder** is honest. The picture flashes, and the sound arrives 5 seconds per mile later, as the NWS puts it, up to the roughly 10 miles at which thunder can be heard. A player who counts gets the true distance. The card's words give it too. The NWS: *"If you hear thunder, you are likely within striking distance of the storm."* The game's lightning odds already assume it.

**Fog** brings drip, a low bed and nearer, fewer birds.

**Snow underfoot** changes with the clock. It's a firm crunch in the morning and slush and postholes in the afternoon. The snow model (7.6) knows which.

**Hail** comes from a public-domain NPS thunderstorm-and-hail recording at Rocky Mountain (section 10).

### 5.4 Silence, and the hush

Silence is the strongest sound we have, so it's spent carefully.

- **The hush at the ♦.** When a choice with a red diamond is on screen, the Life layer fades out over two seconds, the bed drops, and your breath comes forward. After you choose, the world comes back over three seconds. It happens with every ♦ and never otherwise, so it never fakes danger.
- **Real quiet places stay quiet.** A still tarn at night, the alpine zone, deep snow. Some screens hold only a low air tone and one creek far off.
- **YOU PERISHED begins in silence:** everything cuts, then 0.8 seconds of nothing, then the dirge (9.5).
- **An easter egg for M2 (your call, 26, S11):** on the Hoh River Trail, about 3.2 miles in, a small red stone on a mossy log. Gordon Hempton placed it in 2005 as *One Square Inch of Silence*, a project against noise in the park. There, the mix drops to its quietest. Only a Look explains, if you write one.

**Real noise is a question for you.** University of Washington researchers recorded nearly 5,800 flight events at the coast and on the Hoh River Trail in 2017-18, 88% of them military, audible at least 20% of weekday hours. A jet now and then would be true to the park, but it may not be what you want the game to say (26, S5).

---

## 6. Walking: the walk-on and the footsteps

### 6.1 The walk-on

The trail screen moves by stops (frame draft 10.2): you tap *Walk on* or swipe, and the next stop appears. That transition is where you hear the walk.

**The walk-on is a sound montage of the segment you just walked,** squeezed into 2 to 6 seconds while the next picture draws in. It plays the segment's surfaces, water and events in order:

```
Walk on: Sol Duc Falls to Deer Lake
(about 3 mi and 1,500 ft)

0.0s  planks on the falls bridge,
      the roar right under you
0.6s  roots and duff; the roar behind
1.2s  breath climbing; Canyon Creek
      rising beside you, then falling
2.4s  mud, two squelches
2.9s  a blowdown: bark scrape, a thump
3.6s  a snow patch crunch (June only)
4.2s  quiet lake air, a mosquito whine
      (late June and July)
```

- **It never blocks.** The next stop is live at once, and a tap on a choice just lets the montage finish under it.
- **It follows the real segment:** surfaces and hazards from the data (6.2), water from the listening map, the season, and the hour moving on, so a long walk can end in evening thrushes.
- **Long segments get a longer montage,** up to 6 seconds. A 0.1-mile hop is a few steps.
- **Reduce Motion doesn't touch it.** Sound off silences it.

**At a stop, the body idles.** Every 8 to 20 seconds, quietly, you hear a shifted foot, a pole tap or breath settling. When you drop the pack at camp: a thump, a buckle, a long breath out.

### 6.2 Surfaces

Each segment's surface comes from its `trail_class`, its hazards and its zone. That is how LMD's ground types work.

| Surface | From the data | What it sounds like |
|---|---|---|
| **Duff** | `maintained` in forest zones | Soft, muffled, a needle crackle |
| **Packed dirt** | `maintained` in the open | A dry pat, a little grit |
| **Gravel** | `road_walk`; washouts | A crunch with a slide |
| **Roots and rock steps** | `primitive`; `steep_steps` | Knocks and hard clacks |
| **Scree and talus** | `steep_scree` | Sliding hiss; talus plates clink |
| **Snow** | `snowfield` | Morning crunch, afternoon slush; microspikes jingle |
| **Planks** | `bridge`; boardwalk | Hollow wood |
| **Mud** | `mud` | Suck and squelch |
| **Water** | `stream_crossing`, `cold_water` | Splash, wade and roar |
| **Brush and heather** | `brush`; `fragile_meadow` | Swishes against your legs |
| **Sand and cobble** | Coast zone (M4) | A squeak, and cobbles that roll |
| **Logs** | `blowdown`; coast driftwood | Bark scrape, a thump down |

**Wet feet keep squelching.** After a ford or wet brush, your steps squelch until the body model says your feet are dry. Hoh Lake's wet brush, which the data warns *"can soak shoes"*, really does.

### 6.3 How a step is made

- **Variants:** 6 to 8 recorded steps per surface, never the same one twice in a row, with small random changes in pitch (±1.5 semitones), gain (±2 dB) and brightness.
- **Load:** a heavier pack makes a lower, heavier step and adds pack creak. The pack's weight is right there in the flat lay.
- **Tiredness:** Tired and Spent loosen the rhythm, and add the odd scuff and stumble.
- **Shoes:** the catalog's footwear sets the step. Boots are heavier, with more low end. Trail runners are lighter and quicker. Sandals slap. Flip-flops are a joke the game lets you hear.
- **Poles:** a tip strikes every other step. That's a tick on rock, a thud on dirt and a muffled push in snow.
- **Pace** sets the cadence where it's heard in real time: running, and the descent minigame.

### 6.4 Running and the descent

FKT runs and the technical descent are where we get closest to LMD.

- **Running:** quicker, lighter steps, breath in a running rhythm, and the pack's bounce if you carry one.
- **The descent minigame:** the footfalls *are* the rhythm you tap to. Each tap plays the step for that stretch's surface: rock, scree, roots, wet rock. A miss is a skid or a stumble. The judging still runs on the visual ticks (rule 8).
- **Splits:** a soft wooden *tok* at each checkpoint. On an FKT, it's a brighter one when you're ahead of the record. It is a click, not music, and the split line shows the same thing.

---

## 7. The body and the gear

### 7.1 The body

| Sound | When | How |
|---|---|---|
| **Breath** | Climbs, by grade and tiredness; running; the ♦ hush | Recorded breaths, phrased in code |
| **Heartbeat** | Self-arrest and the cold ford only | Synthesis, two low thumps |
| **Shiver** | The Cold chain (7.9) | Chattering, from recordings |
| **Stomach** | Food short, now and then | A small growl (Look-level comedy) |
| **Yawn and sleep** | *Go to sleep* | A breath out, the bag's rustle |

**An idea to check before use:** in real hypothermia, shivering can stop as it gets worse, not better. Wilderness first-aid material says so, but we haven't checked it against a medical source yet. If it's confirmed, the chattering stops at the Cold chain's last warning step, and the words say it too.

### 7.2 The gear

The gear catalog has 217 items. Sound attaches to their categories, and a few items get their own.

| Gear | What you hear |
|---|---|
| **Trekking poles** | Tip strikes (6.3); the flick-lock clack when you adjust them |
| **The pack** | Buckles, hip belt, frame creak under load, the thump when dropped |
| **Canister stove** | Valve hiss, the igniter click, the roar |
| **Integrated stove** | The same, with a deeper roar and a rattle as it boils |
| **Alcohol stove** | Almost silent: a soft whump, then a faint purr |
| **White-gas stove** | Pump strokes, a flare, a jet roar |
| **Pots** | Titanium rings; aluminum clanks; the cast-iron skillet thuds |
| **Zippers** | Tent door, bag, jacket, each with its own pitch |
| **Sleeping pad** | Breaths to inflate; an inflatable pad's crinkle every time you turn over |
| **Bear canister** | The lid's twist and click, a hollow knock, a roll if dropped |
| **Water treatment** | Squeeze filter trickle, pump strokes, a tablet's plop |
| **Headlamp** | Click |
| **Lighter, matches** | A strike and a flare |
| **Rain gear** | Hood up: rain at your ears (5.3); rustle while walking |
| **Microspikes, crampons** | Metal jingle and bite |
| **Ice axe** | A spike in snow; a pick scrape |
| **Trowel** | Digging a cathole, as Leave No Trace asks |
| **Cameras** | A shutter (the alpenglow shot, 8) |
| **Fuel canister** | Shake it in the flat lay and the slosh tells how full it is (the gauge shows it too) |

**The portable wireless speaker** is in the catalog. If a hiker plays it at a lake, the sound is a thin, tinny loop from a phone speaker, and Leave No Trace counts it under principle 7. The game can let you, and let the lake judge you.

### 7.3 The flat lay

The flat lay is the signature screen (decision 26). Every item you tap onto the deck boards lands with its material's sound:

| Material | On the boards |
|---|---|
| Nylon, down, fleece | A soft flop |
| Titanium | A bright ring |
| Aluminum, steel | A clank |
| Hard plastic | A hollow knock (the can, bottles) |
| Food bags | A crinkle |
| Paper | A whisper (the map, the permit) |
| Wood, cast iron | A heavy thud |

The **share** is a camera shutter, and the image itself is silent.

---

## 8. The minigames

The minigames draft owns their rules. These are the sounds, all short, tactile and dry, with no music (rule 1). Each is the kind of feedback that makes a one-thumb game feel good.

| Minigame | What you hear |
|---|---|
| **Packing the bear can** | Items knock into the can by material; a squeeze crinkle when something compresses; the lid's twist and the click that seals it |
| **Razor clamming** | Surf wash, the clam gun's suction pull, wet sand; a soft knock for the clam |
| **Huckleberries** | Each berry plinks into the cup, deeper as it fills; a bear's huff in the brush if you push your luck (the words say so too) |
| **The alpenglow shot** | Wind on the Divide, the light changing in silence, then one shutter |
| **The technical descent** | The footfalls are the rhythm (6.4) |
| **Ice-axe self-arrest** | The slide's hiss speeding up, the pick's scrape and bite, the heartbeat; then silence and breath, or the slide going on |
| **The cold creek ford** | The roar by flow; rocks clacking underfoot; the gasp at the cold; the current shoving |
| **Pitching in the rain** | Rain getting heavier on the fly; fabric flap; stakes going in; a zipper; then the rain moves outside and goes soft |

---

## 9. Music: the few moments

### 9.1 The voice: the cabin band

All music is a small band of chunky synth voices, played from note lists by `dsp.js`.

- **Lead:** a pulse wave with a quick pluck decay, like a pixel guitar.
- **Harmony:** a softer square, a little detuned for warmth.
- **Bass:** a triangle.
- **Brush:** filtered noise on the off-beats.
- **Room:** a short synthesized reverb, like the porch.

It grows out of the doc's PC-speaker voice (13.1), warmed up enough to live beside real recordings. It costs no files: a whole score is a few kilobytes of notes. Everything is original except the Chopin dirge (9.5), which is in the public domain.

The other options are in 26, S1: real instrument samples (CC0), or the strict one-voice PC speaker of 13.1.

### 9.2 The cabin theme

**The home theme plays at the cabin,** and only there: at the porch, the map table, the shed and the flat lay.

- **Shape:** a walking-pace tune (about 72 beats a minute) that climbs and comes home. It's 16 bars, with variations, so it can loop for an evening without wearing out.
- **It follows the real clock** (frame draft 3.4):

| When | The band |
|---|---|
| Morning | Lead and bass, brighter |
| Afternoon | The full band |
| Evening | Slower, with the lead an octave down |
| Night | The lead alone, quiet, with the room |
| Winter | Slower still, with a bell-like tone in place of the pluck |
| Rain | The band drops back, so the roof can be heard |

- **When the crew is around, the tune gains a voice for each of them.** On a summer weekend a stranger just hears a fuller tune. An insider hears the crew. It's an easter egg for the ear (decision 34).
- **Under the music,** the cabin's ambience sits 6 dB lower.
- **First launch:** the cabin draws itself in silently. The first tap, which skips the draw-in, opens the sound. The ambience fades in over three seconds, then the theme's first phrase. That is also when iOS allows sound to start (11.1).

### 9.3 The soak

**The hot tub plays only after a big hike** (frame draft 3.7). It is the theme's slow version: half-time, low-passed, the lead an octave down, with the jets bubbling and the night ambience under it. When the crew is there, their voices join the band, as in 9.2.

### 9.4 The finish

**At the car** (frame draft 6.16), a short cadence of 3 to 4 seconds, built from the theme's last phrase:

| Ending | The cadence |
|---|---|
| **Finished** | The phrase resolves home |
| **A big one** (tub-worthy) | The same, with one more voice and a held chord |
| **Turned back, or rescued** | Gentler, ending on an open chord |
| **An FKT record** | Quicker, ending high |

### 9.5 YOU PERISHED, and the death cues

These are your approved death sequence (decision 1, 12.17). The cues keep the doc's design (13.2) in the new voice:

| Screen | Cue |
|---|---|
| **The death box** | Three low notes falling, then silence |
| **YOU PERISHED** | Silence, 0.8 s, then the dirge: our own one-voice arrangement of the opening of Chopin's funeral march (1839, public domain), about 8 seconds |
| **Leave No Trace** | A faint hiss that thins as the dust blows away |
| **The epitaph** | Dice on wood; a pencil, one tick per word |
| **GAME OVER** | The cabin theme's first bar, once, slowly, then silence |

The death cues never play in hidden Storybook (F.3), and a daily DNF plays whichever of these screens the modes draft keeps.

### 9.6 The daily sting

**When today's Hike of the Day is on the chalkboard,** a short motif of about 1.5 seconds plays with the chalk sound. It's the same every day, so it becomes the sound of *today's hike*.

- **The time reveal** at the end of a daily is ticks counting up, then the motif resolved.
- **Streak milestones** (7, 30, 100) add one note.
- **A DNF** is the motif, unresolved.

### 9.7 The Bonfire Lily

**The motif plays once,** on the glow plate (10.2, 13.2), and nowhere else, so no other cue hints at it. It's the one moment the band plays on the trail. It's the rarest sound in the game.

### 9.8 Music you carried in

**The catalog has a harmonica and a travel ukulele** (luxury items, with real weight). Carry one, and camp offers a tile to play it. You'd hear a short tune in a reed or a plucked-string voice, from a small book of public-domain folk tunes we arrange ourselves.

That would be the only music on the trail, and you paid for it in ounces. The ultralight crowd will roll their eyes, and the moss crowd will carry the uke. Your call (26, S2).

### 9.9 The old cue list, reconciled

| From 13.2 | Now |
|---|---|
| Title theme, *The Trail Goes Up* | Becomes the cabin theme (9.2) |
| Page turn | Retired (no book). The walk-on replaces it (6.1) |
| Chapter fanfare, The End | Retired. The finish cadence replaces them (9.4) |
| Look box | A soft wooden tick |
| Pack bloop and thunk | The flat lay's materials (7.3) |
| Stamp | The printer (4.5); the permit stamp at the WIC stays |
| Compass roll | Kept, drier: wooden ticks that slow, then a landing |
| Success, mishap, serious | Kept as two- and three-note ticks, quiet, never a melody |
| Marmot, elk, thrush, wren, jay | Recordings or synthesis now (10.4) |
| Campfire | Kept, synthesized |
| The Bonfire Lily motif | Kept, once (9.7) |
| Death sting, dirge, dust, dice, pencil, GAME OVER | Kept, revoiced (9.5) |
| Locals' quiz | Moves to the lockbox: a combination lock's clicks; it opens either way |
| Censor bar blip, a can opened | Kept, under T05 (13.2) |
| The WIC line's rings | Kept |

---

## 10. Where every sound comes from

### 10.1 The rule

Decision 33: *"I won't have time to record anything anytime soon."* So Claude handles all of it, and only three kinds of source may ship:

1. **CC0** (public domain dedication).
2. **US government public domain** with a written statement on the page, like the NPS libraries below.
3. **Synthesis:** our own code.

Each file is logged with its license (section 13). Your own recordings are welcome later and never needed.

### 10.2 Libraries, checked

| Library | License | Verdict |
|---|---|---|
| **Freesound, CC0 filter** | Each sound's own license. The search filter `license:"Creative Commons 0"` works, and the API lists it as a filter value | **Yes,** per sound. Most of our recordings come from here |
| **NPS, Rocky Mountain sound library** | *"in the public domain and may be downloaded and used without limitation"*; credit the NPS where appropriate | **Yes.** It has thrushes, Steller's jay, raven, kinglets, pine squirrel, elk bugles, wind, thunder, hail, a stream |
| **NPS, Yellowstone sound library** | Public domain; *"please credit the 'National Park Service'"* | **Yes.** It has the American dipper, raven, elk, thunder |
| **NPS sound gallery** | *"The files are in the public domain"*; asks for credit | **Yes,** case by case. It has no Olympic recordings |
| **Kenney** | CC0, attribution not required | **Yes,** if we want stock clicks. Our UI is synthesized, so probably unused |
| **BBC Sound Effects** | Free only for personal and educational projects; anything else needs a paid licence | **No** |
| **Sonniss GDC bundles** | Royalty-free, not CC0. No raw redistribution, and no AI/ML training | **No.** Not CC0, and our public repo would hold raw files |
| **Western Soundscape Archive** (has a Hoh River recording) | CC BY-NC-ND 3.0, per its listing | **No** (non-commercial, no derivatives) |
| **xeno-canto** | Each recordist picks a Creative Commons license. We couldn't open its terms page | Only a CC0 recording could be used, so check each one |

**Getting Freesound files with no homework.** Original downloads need a free account (the API's download needs OAuth2). The high-quality MP3 previews are public. We checked one: 48 kHz stereo at about 190 kbps, plenty for a phone game re-encoded at 64 kbps. So sessions use the HQ previews, and an account is never needed. If you ever make one, originals become an option.

### 10.3 Honest stand-ins

Some park sounds have no free recording. Where a close relative is available, it stands in, and the log says so.

| The park's | Stands in | From |
|---|---|---|
| Olympic marmot whistle | Hoary marmot whistles (Yukon) | Freesound CC0 |
| Roosevelt elk bugle | Elk bugling (Rocky Mountain National Park) | NPS, public domain |
| Douglas squirrel chatter | Pine squirrel | NPS Rocky Mountain, public domain |

Where there's no stand-in, we synthesize (10.4). The Pacific wren is the hardest: Freesound has no CC0 Pacific or winter wren by name, only Eurasian wrens and others. That's in 26, S7.

### 10.4 Synthesis recipes

Synthesis covers everything continuous, so nothing has to loop (11.5), and fills the gaps.

| Sound | Recipe |
|---|---|
| **Wind** | Noise through a band-pass whose center and width wander; gust envelopes; exposure scales it |
| **Rain** | High-passed noise for the hiss, plus scattered droplet clicks; density by intensity. The surface (5.3) sets their brightness and spacing |
| **Creek** | Several narrow noise bands, each with its own random swell: the babble |
| **Falls and surf** | Low-passed noise with slow swells; surf follows the tide's timing |
| **Drip** | Sparse, pitched plinks with random gaps |
| **Fire** | Crackle impulses over a soft low roar |
| **Tub jets** | Low burble: noise into a resonant filter, with bubbles |
| **Thunder** | A crack (noise burst) plus a long rumble; delay and low-pass by distance (5.3) |
| **Varied thrush** | One sustained note with a fast buzzy flutter, about 2 seconds; a new pitch every 10 seconds or so. It is nearly a synthesizer already |
| **Sooty grouse** | A series of very low hoots |
| **Mosquito** | A whine around 500 Hz with wavering pitch and loudness, closer and farther |
| **Pacific wren** (if 26, S7 says synthesize) | A fast cascade of high notes and trills, 5 to 8 seconds, generated by rule |
| **UI ticks, compass, stings** | The chunky voice (9.1) |

The procedural approach is the one Andy Farnell's *Designing Sound* (MIT Press, 2010) teaches: build the sound from its physics, as a process, so it can change in real time.

### 10.5 What a CC0 file must pass

A CC0 label is only as good as the uploader. So every candidate passes these:

- **A field recording, with details:** a recordist with a history, and gear or a place noted. No "sound effect packs" of unknown origin.
- **No voices,** no music in the background and no church bells. (One CC0 "rain on tent" on Freesound has bells; it's out.)
- **No sounds of real brands** you could name by ear.
- **Listened to in full** (as a spectrogram and a loudness trace, 12.5) before it's trimmed, and **never played in the park.** The Rocky Mountain library itself warns that playing its recordings there *"violates park wildlife protection regulations."* That is a reason to keep wildlife calls quiet in the mix (26, S10).

### 10.6 The pipeline

`tools/audio.mjs` runs in a session, where ffmpeg is installed (we checked: AAC, Opus and MP3 encoders are there). CI never needs ffmpeg.

1. **Fetch** the source into the scratchpad: the HQ preview, or the NPS file.
2. **Master:** trim, fade, de-click, high-pass at 60 Hz, sum to mono (unless stereo matters) and level-match. Save a FLAC in `content/audio/masters/`. Masters are short excerpts, never whole downloads.
3. **Encode** to AAC in `.m4a` in `content/audio/enc/` (11.4), with banks packed into sprites (11.5).
4. **Log** the credits entry, with the master's and the encoded file's SHA-256 (section 13).
5. **Lint and build:** the build checks every hash against the log, so nothing ships unlogged.

---

## 11. The iPhone: Safari's audio realities

Your test phone is an iPhone 17 on iOS 26.6.1. It has the Action button, which can switch Silent Mode, in place of the old ring/silent switch (Apple).

### 11.1 Unlock on the first tap

- **iOS needs a user gesture** before Web Audio can make a sound.
- **Use `touchend` or `click`, not `touchstart`.** WebKit's Jer Noble: touchend is the proper event, because a touchstart can be the start of a scroll (WebKit bug 149367). The build plan already says so (2.5).
- **In that handler,** synchronously: set the session type (11.2), create or resume the context, and play one silent frame.
- **The first tap at the cabin is the natural door** (9.2). Until then the draw-in is silent, as a drawing is.

### 11.2 The session type, and Silent Mode

- **By default, Web Audio on iOS is muted in Silent Mode,** while `<audio>` elements play anyway (WebKit bug 251532). That split is why we use Web Audio for everything.
- **Safari supports `navigator.audioSession`** from iOS 16.4 (Can I Use). WebKit maps `"ambient"` to the system's ambient category, `"playback"` to media playback, and `"auto"` to none (WebKit's `DOMAudioSession.cpp`).
- **Apple's ambient category:** *"audio from other apps mixes with your audio. Screen locking and the Silent switch... silence your audio."* That's exactly right for us. Silent Mode is respected, and a player's podcast or playlist keeps playing under the park.
- **So:** `navigator.audioSession.type = "ambient"`, when it exists. We never use `"playback"`, which would ignore Silent Mode and stop the player's music.
- **Most people will play on silent.** Rule 3 is why that's fine.

### 11.3 Interruptions and the background

- **A call, the lock screen, another app** can stop our audio. In iOS Safari the context's state becomes `"interrupted"` and needs a `resume()` (MDN).
- **`navigator.audioSession.state` is not implemented in Safari** (WebKit bug 283417), so we watch the context instead.
- **A context can claim to be `"running"` while its clock has stopped** (WebKit bug 263627). So a watchdog checks that `currentTime` moves. If it doesn't, it calls `suspend()` then `resume()` on the next tap, and as a last resort rebuilds the context. Buffers survive, since an AudioBuffer isn't tied to a context.
- **On `visibilitychange` to hidden,** suspend everything. When visible again, resume, and fade the scene back in over a second.

### 11.4 Formats

| Format | iPhone support | Use |
|---|---|---|
| **AAC-LC in `.m4a`** | Every iOS version we care about | **Everything we ship** |
| MP3 | Universal | Fallback only, if a decode fails |
| Opus or Vorbis in Ogg | Safari on iOS 18.4 and later (Can I Use) | Not yet: the Boyz' phones may be older |
| WAV | Universal, but huge | Masters only, never shipped |

**Encodings (starting points, tuned by ear on your phone):** mono everywhere unless stereo matters. Footsteps, gear and birds at 32 kHz and 64 kbps. Grains for textures at 24 kHz and 48 kbps. A failed decode just means that sound is skipped.

### 11.5 Loops without seams

AAC adds silent "priming" samples at the start of a file (Apple's technote: commonly 2,112), and we found no source on whether Safari's `decodeAudioData` trims them. So **nothing in the game depends on a file looping cleanly:**

- **Continuous sounds are synthesized** (10.4): wind, rain, water, fire. Noise never repeats, so there's no loop.
- **Recorded textures** play through a grain player. It takes random 4- to 8-second slices from inside the buffer, away from either end, and crossfades them over half a second. There's no seam, and no loop length to notice.
- **Music is synthesized** a bar ahead, sample-accurately (9.1).
- **One-shots are packed into sprites:** one file per bank (say, eight gravel steps) with 100 ms gaps. A sprite opens with a one-sample sync click. At load, the engine finds the click and measures every offset from it, so priming can't shift a cut.

### 11.6 Memory

- **Decoded audio is big.** An AudioBuffer holds *"32-bit floating-point linear PCM"* (Web Audio spec), and `decodeAudioData` resamples to the context's rate. At the iPhone's usual 48 kHz, every mono second costs about 192 KB, whatever the file's size.
- **The budget:** no more than about 120 seconds decoded at once, roughly 23 MB. Banks load by region and scene set, and unload when you leave.
- **That's why synthesis carries the long sounds.** A 30-second recorded rain bed would cost 5.8 MB of memory, while synthesized rain costs almost nothing.
- **A lower context rate** (Safari has allowed `sampleRate` in the constructor since iOS 14.5) would halve memory, but there were early reports of glitches. It's a debug-menu experiment, not the default.

### 11.7 Offline and file sizes

- **M1a's audio is about 2 MB** (the estimate below), and the service worker caches all of it with the app. Offline at the trailhead (E.7) includes sound.
- **Storage is generous.** Since Safari 17, a browser app's origin may use up to 60% of the disk, and a Home Screen web app gets the same quotas. WebKit grants `persist()` partly on whether the site is a Home Screen web app (WebKit).
- **Later regions** get their own audio packs, fetched when you plan a trip there, so the first install stays small.

**The M1a estimate:**

| Bank | Seconds | About |
|---|---|---|
| Footsteps (10 surfaces x 8) | 28 | 230 KB |
| Birds and animals of the loop | 110 | 880 KB |
| Gear, flat lay, body | 45 | 360 KB |
| Events and cabin places | 40 | 320 KB |
| Texture grains | 30 | 180 KB |
| **Total** | **about 250** | **about 2.0 MB** |

The build's 5 MB budget holds. An audio budget of 2.5 MB gets its own lint (A05).

### 11.8 Latency and battery

- **Bluetooth adds a delay you can hear.** That's why every minigame judges against the picture (rule 8), and the daily draft's latency setting only shifts its window.
- **Sounds start on the tap,** with `start(0)`, never scheduled for later.
- **Battery:** the context is suspended when Sound is off, when the app is hidden, and after 30 seconds with nothing playing. The beds use a handful of native nodes, and their parameters change a few times a second, not every sample.

---

## 12. The mix

### 12.1 Buses and starting levels

**The idea:** your own footsteps are the loudest steady thing. The world sits under them. Music sits on top, at home only. All levels are starting points, tuned on your phone.

| Bus | Starting gain | Peaks |
|---|---|---|
| Body (steps, breath) | -10 dB | -9 dBFS |
| Weather | -12 dB | Thunder to -3 dBFS |
| Gear, events | -12 dB | -8 dBFS |
| Water | -14 dB | Falls and fords louder |
| Bed (air, wind) | -16 dB | Crest gusts louder |
| Life | -18 dB | Kept low (10.5) |
| UI | -20 dB | Quiet ticks |
| Music | -6 dB | -3 dBFS |

**The master** runs into a limiter (a `DynamicsCompressorNode`) with a ceiling of -1 dBFS, so nothing clips through a phone speaker.

**Loudness targets** (our own, not a standard): a trail scene around -24 LUFS, quiet and spacious; the cabin with music around -20 LUFS; stings no louder than the cabin.

### 12.2 Ducking and priority

| When | What ducks | How |
|---|---|---|
| **A ♦ on screen** | Life out, bed -6 dB, breath +2 dB | 2 s in, 3 s back (5.4) |
| **YOU PERISHED** | Everything stops | 0.3 s fade, 0.8 s silence, then the dirge |
| **Thunder** | Every other layer -3 dB | For 1.5 s |
| **Music at the cabin** | Cabin ambience -6 dB | Steady |
| **A panel opens at the cabin** | Music -4 dB | 0.3 s |
| **The walk-on** | The old stop's scene fades as the montage starts | 0.5 s |

**Voice limits:** at most 6 Life voices, 2 step voices, 4 gear or event voices and 12 sources in all. The quietest and oldest are dropped first.

### 12.3 Speaker or headphones

- **Phone speakers carry little bass.** So every important sound has a mid-range part. Thunder has its crack, steps have their click, and the falls have their hiss. A spectrogram check (12.5) looks for it.
- **Stereo:** in portrait, the two speakers give only a little width, so panning stays modest (±0.4). On headphones the same mix opens up.
- **We can't tell which the player is using,** so the mix works on both.

### 12.4 Settings

- **Sound:** on or off, in the status line, exactly as the doc has it (13.1).
- **Music:** on or off, in ≡ Settings, for players who want their own playlist under the park.
- Nothing else. Silent Mode does the rest.

### 12.5 How Claude checks a mix with no ears

- **`tools/listen.mjs`** renders any scene in Node: a place, an hour, a month, weather, a ♦ on or off. It mixes the decoded masters with the same `dsp.js` the phone runs. Out come a WAV, a **spectrogram PNG**, which Claude can look at, and a loudness and peak reading from ffmpeg.
- **Checks:** no clipping, the targets in 12.1, a mid-range part in every important cue, the hush really hushing, and no two layers fighting in the same band.
- **Goldens:** the dirge and the stings render to the same bytes every time, in Node. That's a test.
- **Listen batches for you,** optional: a few short files sent in chat, like the cabin theme, the soak, a dawn at Deer Lake and rain on the tent. You reply "yes" or "more X, less Y" (26, S8). Sound isn't English, so decision 21 doesn't require this, but the music is a big part of the feel.

---

## 13. The sound credits and license log

### 13.1 The log

Every shipped sound has an entry in `content/audio/credits.json`. Here is an illustrative one; the recordist's handle is the Freesound user found in our search:

```json
{
 "id": "life.marmot.whistle",
 "file": "enc/life_marmot.m4a",
 "source": "freesound",
 "url": "freesound.org/s/<id>",
 "title": "Hoary marmot whistles",
 "by": "SoundsLikeYukon",
 "license": "CC0-1.0",
 "evidence": "the sound's page",
 "checked": "2026-10-08",
 "standin": "olympic_marmot",
 "changes": "trim, highpass, mono",
 "master_sha256": "…",
 "enc_sha256": "…",
 "used_by": [
  "scape:high",
  "card:marmot_bold"
 ]
}
```

Synthesized sounds get an entry too, with `"source": "synth"` and the recipe's name, so the credits are complete.

### 13.2 The lints

| Rule | Catches |
|---|---|
| **A01** | A shipped sound with no log entry, or a license outside CC0, US public domain (NPS) and synth |
| **A02** | An entry missing its URL, author, evidence, check date or hashes |
| **A03** | An encoded file whose hash doesn't match its log entry |
| **A04** | A source from a denied library (10.2) |
| **A05** | Over budget: all audio over 2.5 MB, a file over 200 KB, or a scene set over 120 s decoded |
| **A06** | A cue used in code or content that isn't in the bank; a bank sound nothing uses (a warning) |
| **A07** | T05 for sound: the can, the lighter and the speaker never play at the cabin, the car, the drive or a trailhead |
| **A08** | A death cue reachable in Storybook; the Lily motif used anywhere but its plate |
| **A09** | A score that isn't marked `original`, or `public domain` with the work, composer and year |

### 13.3 In the game

The Credits page (at the mailbox) gets a Sounds part, built from the log. It lists the libraries, the recordists' handles and *National Park Service*, as the NPS asks. CC0 needs no credit, but crediting is kind. The words around the names are yours (DRAFT, in the text system).

---

## 14. What M1a's sound needs

The build plan's revision will place these. This is the work, in order:

| Step | Work |
|---|---|
| **A1** · the core | The engine (11.1-11.3), buses and limiter, the Sound toggle, `dsp.js` with its Node renderer and goldens, the UI ticks |
| **A2** · the trail | Synthesized beds, the scape resolver, listening maps for the loop, footsteps with the ten surfaces, the walk-on |
| **A3** · the sources | `tools/audio.mjs`, the credits log and A-lints, the loop's birds and animals, gear, the flat lay |
| **A4** · danger | Thunder with true distance, fog, the hush at the ♦, the ford's roar |
| **A5** · the end | The death cues and the dirge |
| **A6** · home | The cabin's places and roof weather, the theme, the soak, the finish, the daily sting |
| **A7** · the mix | A pass on your phone, the budgets, a listen batch |

The minigames bring their own sounds when they're built. M1a's three are the bear can, huckleberries and the alpenglow shot.

---

# Part two: Every word yours

## 15. The promise

Decision 21: *"I also want to personally decide on every single bit of English text that appears in the game that is original... including UI menus everything."*

So: **no original English reaches the live game without your approval, and nothing you approved changes without your seeing it.** Claude writes drafts so the work never stops, and every draft reaches you in context. Preview shows drafts so you can play them. Main shows only your words.

---

## 16. What counts as ours

| Class | What | Approval |
|---|---|---|
| **Ours** | Original English: buttons, narration, Looks, alt text, aria labels, share text, the manifest, number formats, credits wording | **Every line, by you** |
| **Yours** | Lines you wrote yourself, like the Boyz' lines and the register entries | Approved when you send them |
| **Place** | Real place names from the NPS, USGS or WTA, each with its source | None needed; vetoable |
| **Term** | Real-world names: species, the NWS, FKT, *Leave No Trace*, Apple's own labels such as *Add to Home Screen* | None needed; vetoable |
| **Quote** | Verbatim public-domain lines (the epitaph dice) | None needed; vetoable. The lint checks exactness |
| **Player** | Whatever a player types: a hiker's name, an epitaph | Never ours |
| **Dev** | The hidden debug menu, the bug report, console messages | Your call (26, T3) |

**Grey areas, decided by default (each overridable):**

- **A sentence that contains a place name is ours.** The name isn't, but the sentence is.
- **A label we made up for a place is ours,** like *the rim* or *Heart Lake Junction camp*. A name counts as *place* only if the gazetteer names its source.
- **Templates are ours, and their fills are whatever they are.** A batch shows each template with three sample fills, so you approve what it actually produces.
- **Your own words from the decisions** are marked *your words* in a batch, like *you perished* and *leave no trace* (decision 1). They still need your tap, because context matters.
- **Docs aren't the game.** The README, the design docs, the build log, commit messages and code comments are outside decision 21.

---

## 17. Where the words live

### 17.1 The files

```
content/text/
  README.md      how it works
  en/
    app.json     name, icon, install
    home.json    the cabin
    plan.json    map table, permit
    town.json    stores, the WIC
    trail.json   trail screen, camp
    report.json  trip report, share
    death.json   the five screens
    alt.json     pictures' alt text
    fmt.json     months, units, am/pm
    cards/       cards' lines
    ...          pools, Looks, places
  names/
    places.json  gazetteer (generated)
    terms.json   species, NWS, labels
  approved.json  the ledger (18)
  legacy.json    session 1's live words
  review/
    B001.md      a batch, as sent
    B001.answers.json
```

**Cards don't hold English.** A card refers to its lines by id, like `@card.fog_waytrail.setup`. The lines live in `content/text/en/cards/*.json`, beside the card's context, so the lint can see every word in one place.

### 17.2 One line

The format, with an example whose words are a draft:

```json
{
 "home.next.plan_first": {
  "text": "Plan your first trip",
  "ctx": "Porch button, 1st launch",
  "screen": "home",
  "max": 26
 }
}
```

- **`text`** is the working words. They can hold variables in braces (`{camp}`) and one bit of markup, `*emphasis*`. No HTML.
- **`ctx`** is the note you see in a batch: where it shows, when, and what it has to do.
- **`max`** is the character limit from the layout. The T02 fit lint measures the real font too.
- **Plural forms** are an object: `{"one": "...", "other": "{n} ..."}`.
- **There's no status field.** Status comes from the ledger (18), so it can never be stale.

### 17.3 In code

- **JS** asks for words by id: `t('home.next.plan_first')`, or `tx(el, id, vars)`, which sets an element's text and marks it for the debug overlay.
- **HTML** carries ids, not words: `<span data-t="title.begin"></span>`, or `data-t-aria-label="alt.cover"`. The build fills them in, so the first paint already has its words, with no flash and nothing for VoiceOver to miss.
- **The manifest** is generated at build from `app.name`, `app.short_name` and `app.description`.
- **Canvas text** (share cards, a chalkboard) goes through `drawText(ctx, id, ...)`.
- **Numbers, times and dates** use our own small formatter, built from approved tokens (`fmt.*`). The engine never reads the phone's locale anyway (build plan 2.8).

---

## 18. Status: draft, approved, changed, cut

### 18.1 The ledger

When you approve a line, the apply tool writes its exact words into `content/text/approved.json` with a hash:

```json
{
  "app.short_name": {
    "text": "Hiker",
    "sha256": "5c1e…",
    "batch": "B001",
    "line": 2,
    "on": "2026-10-12",
    "how": "chat"
  }
}
```

*(Illustrative: nothing is approved yet.)*

The hash is SHA-256 of the line's text after Unicode NFC normalization. Plural forms are hashed as one canonical object.

### 18.2 Four states, computed

| State | Means | Main ships |
|---|---|---|
| **Draft** | No approval on record | Nothing (the build stops) |
| **Approved** | The ledger's hash matches the working text | The approved words |
| **Changed** | Approved once, but the working text has been edited since | The frozen approved words, until you approve the new ones |
| **Cut** | You vetoed these exact words | Nothing, anywhere |

**That's the whole trick.** Edit an approved line and it is no longer approved, with no field to forget. Main keeps your words until you see the change. Preview shows the edit, marked.

**Rules that protect it:**

- **Only `tools/text.mjs apply` writes the ledger.** Every approval points to a batch answer that holds the same id, the same hash and your answer (T12).
- **Claude never approves.** An approval exists only where your words do: a chat reply, a tap on the review page, or a line you wrote yourself.
- **Auto-fixers skip approved lines.** A typography fix like curly quotes or spacing is proposed in the next batch, never applied in silence.
- **A rename keeps its approval** (`text.mjs mv old new`) only when the words and the screen are the same. The same words on a new screen need a new approval, because you approve words in context.

---

## 19. No English in code: the lint

**T10 fails the build** on original English anywhere but `content/text/`. It's the T04 and T06 kind of rule, scanned over `web/`, `content/` and the manifest.

| Where | What T10 flags |
|---|---|
| **JS: sinks** | Any literal with a letter in it that's written to `textContent`, `innerText`, `innerHTML`, `title`, `alt`, `placeholder`, `ariaLabel` or `document.title`; `setAttribute` with an aria, alt, title or placeholder attribute; `fillText`; `navigator.share`; `alert`, `confirm`, `prompt` |
| **JS: shape** | Any other literal with two words, a capitalized word or sentence punctuation. Exempt: console calls, `new Error(...)` messages (developer text that never reaches the screen) and lines tagged `// t-ok: <reason>` |
| **HTML** | Any text node with letters outside `script` and `style`; `alt`, `title`, `aria-*` and `placeholder` with letters; `<title>`; the description, `apple-mobile-web-app-title` and `application-name` metas, unless filled by `data-t` |
| **CSS** | A `content:` value with a letter. Glyphs like `"> "` and `"~ "` pass |
| **Manifest** | `name`, `short_name` or `description` not given as `@id` |
| **SVG, pictures** | Any `<text>` in an SVG; any future text op in a `.pic` that isn't an id |
| **Content JSON** | A field the schema marks as text (`"x-text": true`) that isn't an `@id` |

**The rest of the text rules:**

| Rule | Catches |
|---|---|
| **T11** | An id used but not defined, or defined and never used |
| **T12** | A ledger entry with no matching batch answer, or a hash that doesn't match |
| **T13** | Variables in the text that don't match the call; a placeholder like `{BOY_n}` outside the files allowed to hold one |
| **T14** | The main gate (20.1) |
| **T15** | A line over its `max`, on top of T02's measured fit |
| **T16** | A *place* missing from the gazetteer; a *quote* that doesn't match its source exactly; a name you've cut that still appears |

T03 (no real businesses or people), T04 (*Golden Glow*), T05 (never near a car) and T06 (no phone links) keep running over every line.

**What errors show.** An error's message is developer text. The torn-page sheet shows one fixed line, an id, and keeps the error itself inside the copied bug report.

---

## 20. Builds: main ships approved words only

### 20.1 Main

- **The build collects every id that main's scope can reach** (the scope file, build plan 3.6) and takes each one's approved words from the ledger.
- **If any is a draft or cut, the main build fails** and lists them, grouped by screen. That's T14, the main gate. It can't happen by surprise, because the promotion checklist runs the same report a session ahead.
- **A screen whose words aren't ready stays preview-only,** held back by a scope switch, rather than holding up everything else.
- **Approved-words-only deploys can go to main any time** (26, T10). Your own words going live isn't a feature promotion.
- **The bundle** is `text/en.json`: id to words, nothing else.
- **v1.0 also fails** on any placeholder left in shipped text, as the doc's release rule already says (F.3).

### 20.2 Preview

- **Preview shows the working words,** drafts included, so you play what's coming.
- **The bundle carries each line's status.** A missing id shows as `⟦id⟧` rather than crashing.
- **Debug mode marks them** (five taps on the build stamp, or `?debug=1`, build plan S2):

```
┌──────────────────────────────────────┐
│ words: [marks on] [drafts only] [off]│
│                                      │
│  A draft line looks like this        │
│  ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ draft  │
│  An edited, once-approved line       │
│  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ changed  │
│  A line you cut, until rewritten     │
│  ──────────────────────────── cut    │
│  {BOY_2} placeholder shown in cyan   │
│  ⟦home.look.dog⟧  missing            │
└──────────────────────────────────────┘
```

### 20.3 The line inspector

**In debug mode, a long press on any words opens a card.** It's the quickest way to say "this one":

```
┌──────────────────────────────────────┐
│ home.next.plan_first       draft     │
│ The big button on the porch.         │
│ First launch only. Max 26, now 20.   │
│ Sent in B004, no answer yet.         │
│                                      │
│ [ Copy for chat ]       [ Close ]    │
└──────────────────────────────────────┘
```

*Copy for chat* puts `home.next.plan_first: "…"` on the clipboard. Paste it into a chat with your own words after it, and that's an edit. The apply tool reads it like any batch answer.

---

## 21. Batches

### 21.1 What a batch is

**A batch is every new or changed line from a session, grouped by screen,** with:

- **a screenshot of each screen,** with a numbered badge beside each line, taken on preview with `?textbatch=B004`;
- **for each line:** its number, id, context note, length against its limit, and the words. For changed lines, the old words too;
- **for templates:** three sample fills;
- **for lines no screenshot can reach** (a rare death, a branch): a mock of the line in its own box;
- **a "not ours" tail:** new place names, terms and quotes, listed for a skim, vetoable.

**Size:** 25 to 40 lines, about ten minutes. Bigger sessions send two batches, the next promotion's screens first.

**`tools/text.mjs batch`** builds it. It writes `content/text/review/B004.md`, which is phone-readable and public, like the rest of the repo, and the screenshots. Claude posts it.

### 21.2 How it looks in chat

*(A sample. Every line's words are a draft.)*

> **Batch 4 · The map table · 3 lines** (screenshot attached; the numbers match)
>
> **1** · `plan.ask.direction` · button, asked once before the route draws · max 22
> (DRAFT) Which way round?
>
> **2** · `plan.ask.nights` · button row label · max 18
> (DRAFT) How many nights?
>
> **3** · `plan.fill.pick` · template, under each suggested plan · max 34
> (DRAFT) {nights} nights · {camps}
> e.g. *2 nights · Deer Lake, Lunch Lake*
>
> Reply any way you like, for example: *all ok* · *ok but 2* · *2: your words* · *cut 3* · *later 1*

### 21.3 How answers are read

| You say | What happens |
|---|---|
| **ok** (or *all ok*) | Approved: the words are frozen in the ledger |
| **Your own words** | Replaced and approved in one step: your words are approved words |
| **cut** | Those exact words can never ship. A new draft comes in a later batch |
| **later**, or nothing | Stays a draft. It comes back once, in the next batch's *still open* tail |
| **A note** ("too cute") | Stays a draft, gets rewritten, and comes back with your note quoted |

Claude writes your answers into `B004.answers.json`, each line with its id, the hash you saw and your answer (with your words for that line only, never the whole message). Then `text.mjs apply B004` updates the ledger. If a line changed after the batch went out, it isn't approved: it goes into the next batch instead.

---

## 22. The review workflow, in three steps

### Step 1: chat (now, and through the early sessions)

Batches as in 21.2, at the end of each session. It needs nothing built, and it's how your decisions already work.

### Step 2: a private review page (when batches grow past about 40 lines)

**The content sessions** (cards, Looks, place text) will produce hundreds of lines. Chat gets tiring at that size, so:

- **The page is a private claude.ai artifact.** Artifacts start private. Claude publishes one review page and updates it with each batch.
- **It's a stack of cards, one per line, sized for your phone:**

```
┌──────────────────────────────────────┐
│ B013 · Deer Lake · 32 lines          │
│ 20 to go · 9 ok · 2 edited · 1 cut   │
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │  screenshot, line 4 boxed        │ │
│ └──────────────────────────────────┘ │
│ 4 · look.deer_lake.doe               │
│ A Look, tapping the doe at dusk.     │
│ Max 120 · now 64 · fits at 375 pt    │
│ ╔══════════════════════════════════╗ │
│ ║ (DRAFT) the line's words, as     ║ │
│ ║ they'd appear in the game        ║ │
│ ╚══════════════════════════════════╝ │
│ [ OK ] [ Edit ] [ Cut ] [ Later ]    │
│ Note: ______________________________ │
├──────────────────────────────────────┤
│ ‹ back          4 / 32         next ›│
└──────────────────────────────────────┘
```

- **Edit** opens the words in a box with a live count. The page loads the game's font (Pixelify Sans is on Google Fonts), so *fits at 375 pt* is measured, not guessed.
- **OK the rest of this screen** sits at the end of each screen's group, behind a confirm. It's for when you've read them all.
- **Your taps are saved in the page's own small database.** At the start of the next session, Claude reads them, writes the answers file and runs `apply`. Nothing to copy, nothing to send.
- **A fallback that always works:** *Copy my answers* gives a few lines of text (`B013` / `4 ok` / `5 edit: …`) to paste into chat, in case the page's database isn't available to a session.
- **Nothing private goes on the page.** It shows the same words the public repo already holds, plus your answers.

### Step 3: the inspector, any time

On preview, the long press in 20.3 lets you flag a line mid-play and paste it into chat. It's always on, and needs no batch.

---

## 23. The count: how much there is to read

**`tools/text.mjs count`** prints where things stand:

```
words: 2,147 lines, 18,920 words
  ours     1,902
    approved   412
    draft    1,380
    changed     61
    cut         49
  places     188
  terms       96
  quotes     140 (all exact)
main needs 64: 64 approved
```

*(Illustrative numbers.)*

**An honest estimate for M1a,** from the build plan's word list (5.6) and the frame draft:

| Area | Lines, roughly |
|---|---|
| Screens: cabin, plan, permit, town, flat lay, trail, camp, report, settings | 350 |
| Cards: setups, choices, outcomes (about 58 cards) | 800 |
| Place text, Looks | 225 |
| Pools: sky, quiet stops | 200 |
| Item notices | 160 |
| The WIC, three stores | 120 |
| Death, register, Larry moments, quiz | 140 |
| Alt text, formats, minigames | 160 |
| **Total** | **about 2,150** |

**At ten seconds a line, that's about six hours of reading, or about 55 batches of ten minutes,** spread across the M1a sessions at two or three a session.

**Three ways to lighten it without breaking decision 21:**

1. **Say less.** A quiet stop can have no box at all (frame draft 6.13). Sound carries the moment.
2. **Let sound replace flavor-only lines** (26, T7). The build plan's text pools include "trail sounds": lines that only describe a sound. Where a line carries no information, the sound replaces it, and the pool shrinks.
3. **Read a pool as a set.** Twelve sky lines on one card, read together, then one tap. You still see every line.

---

## 24. How this changes the build sessions

1. **Sessions write words as drafts, with ids and context notes,** as part of each feature. They never wait for an answer.
2. **Step 0 of every session: apply any answers.** Read the chat or the review page, write the answers file, run `apply`, and commit the ledger.
3. **The last step: send the batch,** next to the three-to-five-line *try this* (build plan 8.1). The build log gets one more line: *Batch B00n, n lines*.
4. **Preview always shows drafts.** You play the real game with its draft words, and the debug marks show which.
5. **Promotions to main add a text gate.** A session ahead, the promotion report lists the lines main will need and their state. Screens that aren't ready stay on preview.
6. **Approved lines are left alone.** Claude doesn't polish them. If one must change (a layout change made it too long), the new words go in the next batch, and main keeps yours meanwhile.
7. **The text system comes early.** Proposed: its core (the files, `t()`, the build fill, the ledger, T10 to T14, the debug marks) lands in S2 with the preview channel. The batch and screenshot tool joins in S5, with `shots.mjs`, and the review page at the first big content batch, or at any batch over 40 lines.
8. **The README and the docs stay outside.** A session that changes the game's words updates the README's description to match, but the README isn't game text.

---

## 25. Session 1's live words, and how they move

### 25.1 What's live today

We checked the live site (build `20261008-4afb91b`). It has 13 strings of original English, in `web/index.html` and `web/manifest.webmanifest`. `web/js/ui/shelf.js` holds none.

| # | Proposed id | Where | Live words |
|---|---|---|---|
| 1 | `app.name` | `<title>`, manifest `name` | Olympic Peninsula Hiker |
| 2 | `app.short_name` | Icon label, manifest | Hiker |
| 3 | `app.description` | Meta description, manifest | A picture-book hiking trip on the Olympic Peninsula. |
| 4 | `title.name_small` | Title, small line | Olympic Peninsula |
| 5 | `title.name_big` | Title, big line | Hiker |
| 6 | `title.tagline` | Under the title | a picture-book trip |
| 7 | `alt.cover_high_divide_dusk` | The cover's aria-label | The High Divide at dusk. Across the Hoh valley... (the full description) |
| 8 | `title.start_label` | Section aria-label | Bookshelf |
| 9 | `title.begin` | The button | Begin a new book |
| 10 | `title.begin_note` | Under the button | The trail opens soon. |
| 11 | `app.install` | Install line | Before your first book, tap Share, then **Add to Home Screen**. The Home Screen book keeps its own saves. |
| 12 | `title.build` | The stamp | Edition {build} |
| 13 | `app.upright` | Sideways plate | This book reads best held upright. |

The CSS decorations (`~`, `>`, `-`) are glyphs, not English, and pass T10.

Seven of the 13 carry the book framing that decision 22 removes: 3, 6, 8, 9, 11, 12 (*Edition*) and 13.

### 25.2 The move

1. **No visible change.** The session that builds the text system moves all 13 into `content/text/en/app.json` and `title.json` word for word. It makes the shell and manifest id-driven, and adds a golden test: the built page's words equal today's live words.
2. **Grandfathered, frozen.** `content/text/legacy.json` lists the 13 ids with the hash of today's words. Main may ship a legacy line only while its words are unchanged, and the list can only shrink. No other unapproved line may join main (26, T2).
3. **Batch 1 goes to you** when you say the frame is set (decision 22 put it on hold). A sample is below.
4. **On your answers,** approved lines leave `legacy.json` for the ledger, and the next deploy carries them to main (26, T10).
5. **When the cabin replaces the title page,** the `title.*` ids retire. The ledger keeps their history, and the README's description is updated to match.

### 25.3 Batch 1: the front door (sample)

*(Ready to send when you say so. Each "Draft" is a placeholder for your words. "Now" is what's live.)*

> **Batch 1 · The front door · 13 lines** (screenshot attached; the numbers match 25.1)
>
> **1** · `app.name` · the browser tab, the share sheet · Now: *Olympic Peninsula Hiker* · Draft: keep as the working title until you name the game.
>
> **2** · `app.short_name` · under the Home Screen icon · max 12 · Now: *Hiker* · Draft: keep.
>
> **3** · `app.description` · search results, share previews · Now: *A picture-book hiking trip on the Olympic Peninsula.* · (DRAFT) *A hiking game set in Olympic National Park.*
>
> **4-5** · `title.name_small`, `title.name_big` · the title over the picture · Now: *Olympic Peninsula / Hiker* · Draft: keep until the name.
>
> **6** · `title.tagline` · under the title · Now: *a picture-book trip* · Draft: no tagline.
>
> **7** · `alt.cover_high_divide_dusk` · VoiceOver reads it for the picture · Now: the full description · Draft: keep (no book words).
>
> **8** · `title.start_label` · VoiceOver's name for the button area · Now: *Bookshelf* · (DRAFT) *Start*
>
> **9** · `title.begin` · the button · max 22 · Now: *Begin a new book* · (DRAFT) *Plan a trip*
>
> **10** · `title.begin_note` · under the button, until the trail opens · Now: *The trail opens soon.* · Draft: keep.
>
> **11** · `app.install` · shown in Safari, hidden once installed · Now: *Before your first book... book keeps its own saves.* · (DRAFT) *Before your first trip, tap Share, then* ***Add to Home Screen****. The Home Screen app keeps its own saves.*
>
> **12** · `title.build` · the stamp · Now: *Edition 20261008-4afb91b* · (DRAFT) the code alone, with no word.
>
> **13** · `app.upright` · when the phone is held sideways · Now: *This book reads best held upright.* · (DRAFT) *Best held upright.*
>
> Not ours, for a skim: *Share*, *Add to Home Screen* (Apple's labels), *Olympic National Park*, *Hoh*, *Mount Olympus*, *High Divide*.

---

## 26. Decisions for you

Each has a recommendation. None blocks the next session.

**Sound**

- **S1. The music's voice.** The chunky "cabin band" of synth voices, played from code (recommended, 9.1). Or real instrument samples (CC0), or the strict one-voice PC speaker of 13.1.
- **S2. Music you carried in.** Harmonica and ukulele at camp as the only music on the trail (recommended yes, 9.8).
- **S3. The drive.** Road and rain only (recommended), or a car radio.
- **S4. The hush at the ♦.** The world quiets with every red diamond and never otherwise (recommended yes, 5.4).
- **S5. Real jet noise** over the coast and the Hoh, as the UW study measured. Recommended: not in M1a, and ask again at M2.
- **S6. Honest stand-ins,** logged and credited: the hoary marmot for the Olympic marmot, Rocky Mountain elk for Roosevelt elk, the pine squirrel for the Douglas squirrel (recommended yes, 10.3).
- **S7. The Pacific wren.** Synthesize it (recommended), or allow one CC BY recording with credit, which would bend decision 33's CC0 rule.
- **S8. Listen batches** for the music and the key cues, optional to answer (recommended yes, 12.5).
- **S9. Settings:** a Sound toggle and a Music toggle, nothing more (recommended, 12.4).
- **S10. No human voices,** not even crowd murmur. The crew is heard through the cabin theme and camp sounds (recommended, 4.5). Wildlife calls kept quiet in the mix, so nobody's phone calls a marmot in the park (10.5).
- **S11. One Square Inch of Silence** as an M2 easter egg on the Hoh River Trail, a Look and the quietest mix (recommended yes, 5.4). It's a real project, so the Look's words are yours.

**Words**

- **T1. Status from the ledger,** computed, not stored in the text files (recommended, 18).
- **T2. Grandfather the 13 live lines** on main until you answer Batch 1, with the list frozen and only shrinking (recommended, 25.2).
- **T3. Dev words exempt:** the hidden debug menu and the bug report's labels need no approval, since only you and testers see them (recommended). Or include them.
- **T4. Batch size and timing:** 25 to 40 lines, at the end of each session (recommended, 21.1).
- **T5. The review page** as a private claude.ai artifact, with the copy-my-answers fallback (recommended, 22). Or stay in chat throughout.
- **T6. Reading a pool as a set,** one tap after you've read every line (recommended yes, 23).
- **T7. Sound replaces flavor-only lines** in the text pools, so there's less to read (recommended yes, 23).
- **T8. Our own number and date formats,** approved once as tokens, rather than iOS's (recommended, 17.3).
- **T9. The line inspector** on preview: long press, copy for chat (recommended yes, 20.3).
- **T10. Approved words can go to main** at any deploy, not only at promotions (recommended yes, 20.1).
- **T11. Batch 1** goes out when you say the frame is set (25.3).

---

## 27. Facts checked, and sources

**Lonely Mountains: Downhill and its touchstones**

- No background music on the ride; wind, birds and animals instead (Megagon, 2017): [Worthplaying](https://worthplaying.com/article/2017/11/10/news/106038-lonely-mountains-downhill-reaches-kickstarter-goal-gets-1-minute-demo/)
- Ground types carry audio properties; Syndrone's sound effects; emitters placed in polish: [80.lv](https://80.lv/articles/level-game-production-lonely-mountains-downhill)
- Dynamic bike audio; checkpoint segments with times; Eurogamer on the lack of music: [Wikipedia](https://en.wikipedia.org/wiki/Lonely_Mountains:_Downhill)
- "The only sounds are the chirrups of birdsong and the crunch of knobbly tyres": [Thumbsticks](https://www.thumbsticks.com/lonely-mountains-downhill-nintendo-switch-review/)
- "Quiet, ambient nature sounds"; the owl at dusk: [Game Informer](https://www.gameinformer.com/index.php/review/lonely-mountains-downhill/lonely-mountains-downhill-review-serene-velocity)
- A separate soundtrack is sold: [Steam](https://store.steampowered.com/app/711540/)
- *Sword & Sworcery*: music by Jim Guthrie; the moon on the real clock: [Wikipedia](https://en.wikipedia.org/wiki/Superbrothers:_Sword_%26_Sworcery_EP)

**The park, its sounds and its rules**

- Principle 7, *"Let nature's sounds prevail. Avoid loud voices and noises."*: [NPS, Leave No Trace Seven Principles](https://home.nps.gov/articles/leave-no-trace-seven-principles.htm)
- Olympic's soundscape (glacial winds, surf, the Hoh, elk bugling, Pacific wrens; overflight monitoring): [NPS Olympic, Soundscapes](https://www.nps.gov/olym/learn/nature/soundscapes.htm)
- Winter wren, sooty grouse in mountain meadows: [NPS Olympic, Birds](https://www.nps.gov/olym/learn/nature/birds.htm)
- Marmot whistle, above 4,000 ft, hibernation from September or early October: [NPS Olympic, Olympic marmot](https://www.nps.gov/olym/learn/nature/olympic-marmot.htm)
- Varied thrush song, breeding in the Olympics, wintering in the lowlands: [Eastside Audubon](https://www.eastsideaudubon.org/corvid-crier/2019/5/1/horned-lark-la3ez)
- Swainson's thrush heard June to August: [The Daily World](https://thedailyworld.com/sports/grays-harbor-birds-swainsons-thrush-catharus-ustulatus)
- Pacific chorus frog season (to check): [Wikipedia, Pacific tree frog](https://en.wikipedia.org/wiki/Pacific_tree_frog)
- Elk bugling in September, mosquitoes, sooty grouse, Hoh Lake's wet brush: `design/data/regions/sol_duc_high_divide.json`
- Thunder about 5 seconds per mile, heard about 10 miles: [NWS, Thunder](https://www.weather.gov/safety/lightning-science-thunder); *"If you hear thunder, you are likely within striking distance"*: [NWS, Lightning safety](https://www.weather.gov/safety/lightning-safety)
- Fresh snow absorbs sound (University of Kentucky engineer, via AccuWeather; NSIDC via WFPL): [AccuWeather](https://accuweather.com/en/weather-news/why-does-it-become-so-quiet-after-a-fresh-snowfall/352439), [WFPL](https://wfpl.org/why-is-it-so-quiet-after-it-snows/)
- One Square Inch of Silence, the red stone in the Hoh, 2005: [Wikipedia](https://en.wikipedia.org/wiki/One_Square_Inch_of_Silence)
- Aircraft noise study (about 5,800 flight events, 88% military, at least 20% of weekday hours): [University of Washington](https://www.washington.edu/news/2020/12/07/noise-pollution/)
- Shivering may stop as hypothermia worsens (secondary; to check against a medical source): [Medical News Today](https://www.medicalnewstoday.com/articles/182197.php)

**Libraries and licenses**

- Freesound's licenses and the CC0 filter: [Freesound FAQ](https://freesound.org/help/faq/), [Freesound API](https://freesound.org/docs/api/resources_apiv2.html); the filter checked live on [a search](https://freesound.org/search/?q=rain+tent&f=license%3A%22Creative+Commons+0%22)
- NPS Rocky Mountain sound library (public domain; do not play in the park): [NPS](https://nps.gov/romo/learn/photosmultimedia/soundlibrary.htm)
- NPS Yellowstone sound library (public domain; credit the NPS): [NPS](https://www.nps.gov/yell/learn/photosmultimedia/soundlibrary.htm)
- NPS sound gallery (public domain; credit): [NPS](https://www.nps.gov/subjects/sound/gallery.htm)
- Kenney (CC0): [Kenney support](https://kenney.nl/support)
- BBC Sound Effects (personal and educational use, or a paid licence): [BBC Sound Effects](https://sound-effects.bbcrewind.co.uk/licensing), and press coverage at [Mixmag](https://mixmag.net/read/bbc-sound-effect-archive-free-audio-samples-news)
- Sonniss GDC bundle (royalty-free; no raw redistribution; no AI/ML training): [Sonniss](https://sonniss.com/gameaudiogdc); the 2023 licence text, via a [third-party mirror](https://scrubby.duckdns.org/Sonniss.com%20-%20GDC%202023%20-%20Game%20Audio%20Bundle/License.pdf)
- Western Soundscape Archive's Hoh River recording (CC BY-NC-ND 3.0, per search listing): [University of Utah](https://collections.lib.utah.edu/details?id=1119324)
- Andy Farnell, *Designing Sound*: [MIT Press Bookstore](https://mitpressbookstore.mit.edu/book/9780262014410)

**The iPhone and Web Audio**

- iPhone 17's Action button and Silent Mode: [Apple, iPhone 17 specs](https://www.apple.com/iphone-17/specs/)
- Unlock on `touchend`: [WebKit bug 149367](https://bugs.webkit.org/show_bug.cgi?id=149367)
- Web Audio muted in Silent Mode; `"playback"` overrides it: [WebKit bug 251532](https://bugs.webkit.org/show_bug.cgi?id=251532)
- `transient` uses the ambient category, silenced by the switch: [WebKit bug 264473](https://bugs.webkit.org/show_bug.cgi?id=264473)
- WebKit's type-to-category mapping: [`DOMAudioSession.cpp`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/audiosession/DOMAudioSession.cpp)
- Apple's ambient category (mixes; silenced by the switch and the lock): [Apple Developer](https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/ambient)
- `navigator.audioSession` from Safari 16.4: [Can I Use](https://caniuse.com/mdn-api_navigator_audiosession); the API: [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Audio_Session_API)
- `audioSession.state` undefined in Safari: [WebKit bug 283417](https://bugs.webkit.org/show_bug.cgi?id=283417)
- The `"interrupted"` state in iOS Safari: [MDN](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state); "running" with a stopped clock: [WebKit bug 263627](https://bugs.webkit.org/show_bug.cgi?id=263627)
- Opus and Vorbis in Safari on iOS from 18.4: [Can I Use, Opus](https://caniuse.com/opus), [Can I Use, Vorbis](https://caniuse.com/ogg-vorbis)
- AAC priming (commonly 2,112 samples): [Apple TN2258](https://developer.apple.com/library/archive/technotes/tn2258/_index.html)
- AudioBuffer as 32-bit float PCM; decoding resamples to the context's rate: [Web Audio API](https://www.w3.org/TR/webaudio/)
- AudioContext `sampleRate` option from iOS 14.5: [Can I Use](https://caniuse.com/mdn-api_audiocontext_audiocontext_options_samplerate_parameter)
- Safari 17 storage quotas; Home Screen apps; `persist()`: [WebKit, Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/)

**Checked in this repo and on the live site**

- The 13 live strings: `web/index.html`, `web/manifest.webmanifest`, and fernforager.github.io/104-boyz (build `20261008-4afb91b`, fetched 2026-10-08)
- The gear catalog's 217 items, including the harmonica, travel ukulele, wireless speaker, stoves and pads: `design/data/gear_catalog.json`
- Segment classes and hazards for the surfaces: `design/data/regions/sol_duc_high_divide.json`
- ffmpeg with AAC, Opus and MP3 encoders, in the session container
- Freesound's HQ previews are public (one probed: 48 kHz stereo, about 190 kbps)
