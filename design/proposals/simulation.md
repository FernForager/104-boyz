# Proposal: The Oregon Trail Engine
### Simulation, odds and consequences for "Olympic Peninsula Hiker"

Angle: the systems under the storybook. How planning and packing turn into honest odds, and how odds turn into gentle (or, optionally, Sierra-harsh) consequences. Other proposals cover presentation, story voice and the planning UI; this one is the math they sit on.

Status: design proposal, 2026-10-07. No game code. The numbers below come from a scratch tuning calculator. They are first-pass values meant to be tuned with the Monte Carlo harness described in section 15.

---

## Summary

- **One sim, many pages.** A trip runs Plan, Shop, Pack, Drive, then Trail, then Epilogue. Underneath, one deterministic, seeded simulation advances in 15-minute ticks. The player only sees storybook **beats**: about 3 to 5 decisions per hiking day, 2 to 3 per layover day, 1 per evening, and sometimes one at night.
- **Small, legible hiker state.** Seven meters: Energy, Warmth, Wetness, Hydration, Feet, Spirits, and a calorie ledger. There is also an injury/illness list, fitness (chosen, 1 to 5) and skills (earned, 0 to 5). Pack, food, fuel, light (phone or headlamp battery) and time sit beside them. The environment covers weather (forecast vs. actual), temperature by elevation (lapse rate), wind, snowline by month, rivers by time of day and rain, and real tide tables on the coast.
- **Movement** uses backpacker's Naismith: `miles x class / flat-speed + gain / climb-rate`. That is multiplied by pack-load ratio, darkness, energy, injury, weather and pace choice. Example: Hoh trailhead to Glacier Meadows (17.4 mi, +4,292 ft) takes about 11.3 h for an average hiker, before darkness slows them down.
- **Packing is liters and pounds.** Packs have a capacity, a load rating and a few outside strap slots, and outside items carry real penalties (wet, snagged, top-heavy). A rigid **bear canister is required for every overnight in Olympic wilderness** (2026 rules in `design/data/regions/*`). It takes up volume and caps your food days. Most of the "lots and lots of outcomes" come from the roughly 40 **gear tags** your pack produces.
- **Event cards** have preconditions on place, terrain, elevation, month, weather, time, state thresholds and gear tags present or absent. A **Trail Director** handles pacing and leans gently toward testing the gaps in your pack. Cards chain into multi-step stories, and a **delayed-consequence queue** pays off earlier choices: untreated water makes you sick 36 to 96 hours later, and no rain pants leads to wet legs and then a cold night.
- **Honest odds.** Every roll uses one formula: `p = clamp(base + sum of labeled modifiers, 5, 97)`. The % shown on the button is the real chance, and you can tap it to see the reasons. Compound choices ("push on 7 miles in the dark") get their % from a 200-run look-ahead of the same sim. **Recommendation: show the % on every rolled choice; never put a % on unrolled or narrative choices.** Critical choices also get a three-band outcome bar. A "words only" setting maps the % to storybook phrases.
- **Consequence ladder:** Fine, then Uncomfortable, then Trouble, then Serious, then Trip Over (walk out) or Rescue (rangers). In the default **Storybook mode nobody dies**. Optional **Sierra mode** adds death at flagged "Sierra moments" (ladders, headlands, fords, crevasses, hypothermia) with a Restore-from-last-camp, in the spirit of King's Quest.
- **Scoring:** a Sierra-style score line, `Joy 87 of 250`, plus Journal sketches (the Golden Glow homage: sketch, don't pick), Leave No Trace, miles, gain, camps and summits/viewpoints.
- **Worked examples** (numbers come from the formulas below; A and B were also run 20,000 times each in a scratch tuning calculator):
  - (A) Day-hike gear, one night at Glacier Meadows, late September. 0% happy, about 76% serious trouble but you walk out, about 24% ranger rescue, and about 4% death in Sierra mode.
  - (B) A planned 3-night Seven Lakes Basin/High Divide trip in August. About 98% happy finish; a skimpy kit still gets about 92%, because August costs joy, not safety.
  - (C) South Coast, misread tide (Sunday's row read on Saturday). The hiker reaches Strawberry Point (passable below 4.0 ft) at 5:24 PM: 3.9 ft and rising, effective 4.4 ft with wave run-up. Honest choices: go now (49% clean, 25% soaked, 26% knocked down), or wait and camp at Scott Creek for the 5 AM low.
- **Balancing targets:** sensible plans finish happily at least 95% of the time. Ambitious but well-equipped plans: 60 to 85%. Day-gear Olympus overnight: trouble or worse at least 80%. Storybook rescue rate across all plays: under 3%. A headless Monte Carlo harness with bot policies checks this in CI.

---

## Contents

1. Design pillars for the simulation
2. Clock, beats and the shape of a trip day
3. State model
4. Environment model
5. Movement and time model
6. Packing model
7. Body models: energy, food, water, warmth, wetness, sleep, feet, injuries, spirits
8. Decision and event engine
9. Probability model (honest odds)
10. Consequence ladder, modes and rescue
11. Scoring
12. Worked example A: Glacier Meadows in one night with day-hike gear, late September
13. Worked example B: Seven Lakes Basin / High Divide, 3 nights, August
14. Worked example C: South Coast, misread tide
15. Balancing targets and Monte Carlo tuning
16. Data contracts (what the sim needs from `design/data/`)
17. Companions (optional named party)
18. Open questions and recommendations

---

## 1. Design pillars for the simulation

1. **Planning is the game; the trail is the reveal.** We aim for about 70% of outcome variance to come from choices made before the trailhead (destination vs. month, number of nights, camps, start time, pack, food), about 20% from trail decisions and about 10% from luck. Section 15 measures this with a variance decomposition over Monte Carlo runs.
2. **Honest odds.** There is one probability formula, and it is shown with its reasons. No hidden rubber-banding, no fudged rolls, no streak-breaker. The RNG is seeded per trip, so a trip can be replayed or shared.
3. **No ambushes.** Anything that can end a trip is foreshadowed at least one beat earlier: a forecast, a ranger's remark, a hot spot before a blister, "the light is going amber" before dark, the river "talking louder". It also routes through a player choice. The one exception is Sierra mode, where flagged *Sierra moments* can kill on a single failed roll, and even those show their odds.
4. **Plan well and it's easy.** "To survive isn't hard if you plan well, pack well." For a well-packed hiker on a sensible itinerary, most cards are joy cards, and hazard rolls sit at 85 to 97%.
5. **Every item matters somewhere, every gap gets tested somewhere.** Each catalog item must appear as a modifier or precondition in at least three event cards, and the build-time lint enforces this (section 16).
6. **Words first, numbers on request.** Meters show as storybook words and small EGA icons ("Damp", "Tired", "Hot spot"). The *Ranger's Notebook* toggle shows exact values and roll math.
7. **Small, integer state.** About a dozen core numbers, all integers, so a save state is about 2 KB of JSON and the whole sim fits comfortably in a phone browser.

---

## 2. Clock, beats and the shape of a trip day

### 2.1 Ticks and beats

- **Tick** = 15 minutes of game time. Each tick runs movement, weather, body meters and the delayed-consequence queue. A 10-hour hiking day is 40 ticks, which is trivial for a phone.
- **Beat** = a moment the player sees: a scene picture, narrator text, and either "Continue" or a choice. Beats are placed at **landmark nodes** from the region data (camps, junctions, bridges, fords, passes, headlands) and at forced moments (thresholds crossed, delayed consequences coming due, darkness).

### 2.2 Shape of a day

| Phase | Typical clock | Beats | Notes |
|---|---|---|---|
| Dawn camp | sunrise to +1.5 h | 0 to 1 | Breakfast choice (hot/cold), pack up, weather reveal |
| Departure | player-set start (default sunrise + 1.5 h) | 1 | Pace choice: Easy / Steady / Push |
| Trail | moving | 1 to 3 | Landmarks, hazards, discoveries; lunch is a beat if it is a choice |
| Arrival | at camp | 1 | Pick site, pitch, water, canister placement |
| Evening | arrival to trail-dark + 1 h | 1 | Dinner, sunset, sketch, stay up or sleep |
| Night | resolved in one step | 0 to 1 | Night card only if a precondition fires (cold, visitor, storm, river) |

**Decision budget** (enforced by the Trail Director, section 8.5):

| Day type | Meaningful decisions | One-tap narrative beats | Play time target |
|---|---|---|---|
| Moving day (5 to 12 mi) | 3 to 5 | 3 to 6 | 4 to 6 min |
| Layover day | 2 to 3 (what to do, where to go) | 2 to 4 | 3 to 4 min |
| Day hike (0 nights) | 3 to 4 | 3 to 5 | 4 to 5 min |
| Evening + night | 1 to 2 | 1 to 2 | 1 to 2 min |

A 3-night trip is about 20 to 25 minutes of trail play, plus 10 to 15 minutes of planning and packing.

### 2.3 Daylight (computed for 47.9°N, 123.9°W, local clock time)

| Date | Civil dawn | Sunrise | Sunset | Civil dusk | Usable light |
|---|---|---|---|---|---|
| Jun 15 | 4:35 | 5:16 | 21:16 | 21:57 | 17.4 h |
| Jul 1 | 4:40 | 5:21 | 21:18 | 21:59 | 17.3 h |
| Jul 15 | 4:53 | 5:32 | 21:11 | 21:50 | 16.9 h |
| Aug 1 | 5:16 | 5:52 | 20:51 | 21:27 | 16.2 h |
| Aug 15 | 5:37 | 6:11 | 20:29 | 21:03 | 15.4 h |
| Sep 1 | 6:02 | 6:34 | 19:57 | 20:29 | 14.5 h |
| Sep 15 | 6:22 | 6:53 | 19:28 | 19:59 | 13.6 h |
| Oct 1 | 6:44 | 7:15 | 18:55 | 19:26 | 12.7 h |
| Oct 15 | 7:03 | 7:35 | 18:28 | 18:59 | 11.9 h |
| Nov 15 | 6:48 | 7:22 | 16:39 | 17:12 | 10.4 h |
| Dec 15 | 7:22 | 7:58 | 16:23 | 17:00 | 9.6 h |

The full table (1st and 15th of each month) goes in `data/daylight.json`, computed with the NOAA sunrise equation.

**Trail-dark** is when headlamp rules start:
- `civil_dusk - 25 min` under dense canopy (west-side rain forest valleys, tag `canopy:dense`)
- `civil_dusk - 10 min` in mixed forest
- `civil_dusk` on open meadow, crest, beach or snow
- Heavy overcast (RAIN/STORM) moves it 15 minutes earlier everywhere.
- Full moon on open terrain gives a small bonus (night multiplier 1.25 instead of 1.35 with a headlamp).

---

## 3. State model

All values are small numbers (integers, or tenths where precision matters) in one `TripState` object, saved at every beat (localStorage, wrapped in try/catch), so a phone that sleeps mid-trip loses nothing.

### 3.1 Hiker

| Variable | Range | Start | Words shown | Changed by | Affects |
|---|---|---|---|---|---|
| `energy` E | 0 to `energyMax` | 90 to 100 (drive length) | Fresh 80+, Steady 55+, Tired 30+, Spent 15+, Bonked below 15 | hiking drain, snacks, meals, sleep | pace (below 30), footing checks, heat production |
| `energyMax` | 40 to 100 | 100 | (hidden; shown as "running on empty") | calorie deficit, illness, dehydration | caps E |
| `warmth` C (core-temp proxy) | 0 to 100 | 75 | Toasty 80+, Comfortable 60+, Cool 40+, Cold 25+, Shivering 12+, Hypothermic below 12 | heat balance each tick (7.4) | dexterity checks, spirits, crisis cards |
| `wet` | 0 to 100 | 0 | Dry below 15, Damp below 40, Wet below 70, Soaked 70+ | rain x (1 - protection), wet brush, sweat, fords, waves; drying | insulation loss, feet, spirits |
| `feetWet` | boolean + hours | false | "squelching" | rain, fords, dew, waves | blister rate |
| `hydration` (liters behind) | 0 to 5.0 | 0 | Fine, Thirsty 0.75+, Parched 1.75+, Dehydrated 3+ | sweat, drinking | pace, energyMax, heat illness |
| `kcalDeficit` | 0 to 15,000 | 0 | "hungry" hints | burn minus eaten | energyMax, night warmth |
| `feet` | 0 to 100 | 100 | Happy, Hot spot below 70, Blister below 50, Shredded below 25 | miles, wet, boots, load | pace, spirits |
| `spirits` | 0 to 100 | 70 | Joyful 85+, Content 60+, Grumpy 40+, Miserable 20+, Done below 20 | joy events, misery | joy multiplier, "go home" prompts |
| `injuries[]` | list | [] | per injury | failed checks | pace multiplier, check mods |
| `illness[]` | list (incubating/active) | [] | hidden while incubating | water, food, cold | energyMax, pace |
| `fitness` | 1 to 5 | chosen at plan | Easygoing, Casual, Regular, Strong, Mountain goat | (fixed per trip) | flat speed, climb rate, energy cost |
| `skills{}` | each 0 to 5 | 1 (2 in what the player says they know) | stars | experience across trips | +2 per level on matching checks |
| `bodyLb` | 90 to 280 | 165 | (setting) | | load ratio, kcal |

Skills: `footing` (ladders, scree, slick rock), `navigation`, `river`, `snow`, `coast` (tides and headlands), `campcraft` (pitching, stoves, food storage), `firstAid`.

### 3.2 Time

```json
"time": { "day": 2, "minute": 1035, "date": "2027-08-13", "phase": "trail",
          "trailDark": 1250, "sunset": 1229, "sunrise": 367, "itineraryIndex": 3 }
```

### 3.3 Pack

```json
"pack": {
  "model": "trekker_65", "capacityL": 65, "loadRatingLb": 42, "frame": "internal",
  "slots": { "side": 2, "frontMeshL": 6, "bottomStraps": 2, "topStrap": 1, "toolLoops": 2 },
  "waterproofing": "liner",
  "items": [
    { "id": "tent_2p_dome", "where": "bottomStrap", "cond": "dry", "state": "ok" },
    { "id": "bag_down_30", "where": "inside", "cond": "dry", "state": "ok" },
    { "id": "canister_standard", "where": "inside", "contentsL": 8.9 },
    { "id": "headlamp", "where": "lid", "battery": 100 },
    { "id": "phone", "where": "hipbelt", "battery": 85 }
  ],
  "derived": { "weightLb": 31.4, "insideL": 61.8, "fillPct": 95, "outsideBulky": 1,
               "loadRatio": 0.95, "feel": "Comfortable", "tags": ["rain_top","rain_bottom","..."] }
}
```

Item `cond`: `dry` / `damp` / `wet`. Item `state`: `ok` / `damaged` / `lost`. Consumables track `kcal`, `fuelG`, `waterL` and `battery`.

### 3.4 Food and fuel

```json
"food": { "inCanister": [ {"id":"pasta_side","qty":2}, ... ],
          "outside": [ {"id":"bar_choc","qty":3} ],
          "kcalCarried": 8400, "volumeL": 7.6, "yumHistory": ["pasta_side"] },
"fuel": { "canisterG": 110, "boilsLeft": 13 }
```

### 3.5 Environment (per trip, generated at trip start from seed + month + zones)

```json
"env": { "seed": 918273, "month": 9, "snowYear": "low",
         "weatherActual": [ {"day":1,"state":"OVC","shift":[{"from":900,"to":"SHW"}],"freezingLevelFt":6500} ],
         "weatherForecast": [ {"day":1,"text":"Mostly cloudy, showers late","pop":40} ],
         "fireBan": "stage2", "quotaFull": ["glacier_meadows"],
         "tides": "la_push_2027.json", "rivers": { "hoh_braids": {"baseFt":0.9} } }
```

---

## 4. Environment model

### 4.1 Weather zones

| Zone | Examples | Reference station (for tuning) |
|---|---|---|
| `COAST` | Rialto, Shi Shi, Ozette, Third Beach, Toleak, Oil City, Kalaloch | La Push / Quillayute |
| `WEST_VALLEY` (300 to 2,500 ft) | Hoh, Queets, Bogachiel, Quinault, North Fork | Forks / Hoh RS |
| `NORTH_MID` (1,500 to 4,000 ft) | Sol Duc, Elwha, Lake Crescent, Deer Lake | Elwha RS |
| `HIGH` (4,000 to 6,000 ft) | High Divide, Seven Lakes, Hoh Lake, Glacier Meadows, Appleton Pass, Hurricane Ridge, Grand Valley | Hurricane Ridge |
| `EAST_HIGH` (rain shadow) | Royal Basin, Dosewallips/Hayden Pass, Gray Wolf, Deer Park | Hurricane Ridge x drier factor |
| `ALPINE` (above 6,000 ft, glaciers) | Blue Glacier, Snow Dome, Mount Olympus | lapse from HIGH |

### 4.2 Climatology (first-pass; full monthly table in `data/climate.json`)

Highs and lows are at the zone's reference elevation, in °F. P(wet) is the chance of measurable rain on a given day. P(TSTM) is the chance of afternoon thunderstorm conditions.

| Zone | Month | High / Low | P(wet) | P(TSTM) | Notes |
|---|---|---|---|---|---|
| WEST_VALLEY (600 ft) | Jul | 72 / 50 | 0.25 | 0.01 | wet brush mornings |
| | Aug | 73 / 50 | 0.25 | 0.01 | |
| | Sep | 67 / 46 | 0.38 | 0.01 | first fall storms late month; elk rut |
| | Oct | 58 / 42 | 0.60 | 0 | atmospheric rivers; rivers rise |
| COAST (50 ft) | Jul | 63 / 51 | 0.28 | 0 | marine fog 40% of mornings |
| | Aug | 64 / 52 | 0.28 | 0 | fog 45% |
| | Sep | 64 / 49 | 0.38 | 0 | |
| HIGH (5,000 ft) | Jul | 61 / 45 | 0.25 | 0.06 | snowfields early month |
| | Aug | 62 / 46 | 0.22 | 0.07 | huckleberries, bears, dry crest |
| | Sep | 55 / 40 | 0.35 | 0.03 | first snow possible after the 20th |
| | Oct | 45 / 33 | 0.55 | 0 | snow above 4,500 ft common |
| EAST_HIGH | any | HIGH + 2 / HIGH - 1 | HIGH x 0.6 | HIGH x 1.2 | rain shadow |

### 4.3 Weather states and the daily Markov chain

States, ordered by "wetness rank":

| Rank | State | Wetting per hour (7.5) | Wind base (mph) | Highs / lows shift | Notes |
|---|---|---|---|---|---|
| 0 | `CLR` clear | 0 | 5 | +4 / -5 | radiational cooling, frost in meadows |
| 1 | `PCL` partly cloudy | 0 | 8 | +2 / -2 | |
| 2 | `FOG` marine layer | 0 (wet brush yes) | 6 | -6 / +2 | coast and west valleys; burns off 10:00 to 13:00 in 60% of cases |
| 3 | `OVC` overcast/drizzle | 5 for 30% of hours | 8 | -3 / +2 | |
| 4 | `SHW` showers | 12 for 40% of hours | 12 | -5 / +2 | afternoon-weighted |
| 5 | `RAIN` steady rain | 22 for 85% of hours | 12 | -7 / +3 | |
| 6 | `STORM` wind and heavy rain | 35 for all hours | 30 | -9 / +3 | rivers rise; coast surge +1 ft |
| x | `TSTM` thunderstorm | 35 for 1 to 3 h after 13:00 | gusts 35 | -6 / 0 | HIGH zones only, lightning on crests |

The daily state is a Markov chain per zone and month: `P(next | today) = persistence x [stay] + (1 - persistence) x climatology`. The persistence is 0.55 in summer and 0.65 in fall, and climatology is the zone-month stationary distribution, tuned so the long-run P(wet) matches 4.2. Example, HIGH in August: climatology `{CLR .40, PCL .26, FOG .05, OVC .10, SHW .12, RAIN .06, STORM .01}`. Wet days come out as SHW + RAIN + STORM + the drizzly part of OVC, about 0.22, matching 4.2. TSTM is not a chain state. It is drawn on top of CLR/PCL days as an afternoon overlay with P(TSTM).

**Freezing level** (snow falls above it) is drawn per day: summer `N(10,500 ft, 1,500)`, Sep `N(8,000, 1,800)`, Oct `N(5,500, 1,500)`, minus 2,500 ft on a STORM day in Sep and Oct.

### 4.4 Forecast vs. actual (honest forecasts)

1. Generate the **actual** weather for the whole trip from the seed when the trip is created. It is fixed and never changes after you see the forecast.
2. Generate the **forecast** from the actual one. For lead time L days (L = 1 at the trailhead): with accuracy `a(L) = [0.85, 0.75, 0.65, 0.55, 0.45]`, show the actual state. Otherwise show a neighbor one rank wetter or drier (50/50). Thunderstorms are forecast as "chance of afternoon thunderstorms" whenever P(TSTM) for that day is at least 0.04.
3. The **PoP %** printed on the ranger station board is computed at build time by Monte Carlo as `P(actual wet | forecast state, lead, zone, month)`. So "40% chance of rain" really rains 40% of the time in the game. Honesty extends to the forecast.
4. The forecast is shown three times: at planning (5-day), at the trailhead (refreshed, if the phone has signal at the trailhead) and on the ranger's board (if you stop at a WIC).

### 4.5 Temperature by elevation and time

```
T(z, t) = T_ref(zone, month) + stateShift + LAPSE x (z - z_ref)/1000 + diurnal(t) + local(z)

LAPSE        = -3.3 °F/1000 ft in cloud/rain (moist), -4.5 °F/1000 ft on clear afternoons
diurnal(t)   : low at sunrise+0.5 h, high at 15:00, sine rise / exponential fall
local(z)     : cold pool (basin, meadow, lake, tag "cold_pool") -4 °F on CLR/PCL nights
               dense canopy +2 °F at night, -3 °F by day
               glacier-adjacent (tag "glacier") -3 °F
```

Example: Glacier Meadows (4,300 ft), late September, RAIN night. The Hoh reference low is 46 + 3 (rain) = 49 °F at 600 ft. Then 49 - 3.3 x 3.7 = 36.8, and glacier-adjacent -3 gives about **34 °F**, drawn as N(35, 3) in the sim. That matches real late-September nights there.

**Wind** = state base x exposure (`forest 0.3`, `meadow 0.8`, `crest 1.4`, `beach 1.2`, `glacier 1.2`). **Wind chill** uses the NWS formula when T ≤ 50 °F and V ≥ 3 mph: `WC = 35.74 + 0.6215T - 35.75V^0.16 + 0.4275TV^0.16`.

### 4.6 Snowline and snow on trail

Normal-year melt-out elevation. Below this line the trail is mostly snow-free on that date; above it, expect snow:

| Date | Open / south aspect | Shaded / north aspect | Late-season new snow |
|---|---|---|---|
| May 15 | 3,000 ft | 2,500 ft | |
| Jun 15 | 4,200 | 3,600 | |
| Jul 1 | 4,800 | 4,200 | |
| Jul 15 | 5,300 | 4,700 | |
| Aug 1 | 5,800 | 5,200 | |
| Aug 15 | 6,500 (patches only) | 5,800 | |
| Sep 1 to Sep 20 | permanent snow only | permanent snow only | rare |
| Sep 21 to Oct 15 | | | if freezing level < segment z on a wet day: fresh snow, s = 0.3 to 1.0 |

**Snow year** is drawn per trip and shown on the ranger board: `low` (-600 ft, about 2 weeks early; 2026 was low per region data), `normal`, `high` (+700 ft, about 2 to 3 weeks late).

**Snow cover fraction** on a segment: `s = clamp(0.5 + (z_seg - z_meltout)/800, 0, 1)`. Effects:
- s below 0.1: clear.
- 0.1 to 0.4: patches. Time x(1 + 0.3s); a footing check on steep patches (tag `snowfield`).
- 0.4 to 0.8: snowfields. Time x(1 + 0.8s); navigation check in fog. Traverse checks on `avalanche_path` or `steep` tags need traction or an ice axe.
- 0.8 and up: snow-covered. Time x1.8; navigation check each segment.

Hardness by hour: before 10:00 the snow is firm or icy (slide risk -10 without traction). After 13:00 it is soft (postholing, time x1.15, energy x1.15).

### 4.7 Rivers and creeks

Each crossing node carries `{type: glacial | snowmelt | rain | tidal_mouth, baseFt[12], velocity: low|mod|high, bridge: bool}`.

```
depth(t) = baseFt[month] x (1 + a x cos(2π (hour - hPeak)/24)) x (1 + k x rain24_in) + tideBackwater
  glacial:  a = 0.30, hPeak = 18:00 (lowest about 08:00), k = 0.25
  snowmelt: a = 0.15, hPeak = 17:00, k = 0.30
  rain-fed: a = 0,    k = 0.50 (lagged 6 to 18 h)
  tidal mouth (Goodman, Mosquito, Cedar creeks): + 0.25 x max(0, tideHeight - 3 ft)
flowIndex FI = depth x {low 0.8, mod 1.0, high 1.3}
```

| FI | Feels like | Ford base % | Label |
|---|---|---|---|
| below 1.0 | ankle/shin | 97 | (auto-pass, narrated) |
| 1.0 to 1.5 | knee | 85 | |
| 1.5 to 2.2 | thigh | 60 | "Risky" |
| above 2.2 | waist | 25 | "Not recommended": the ranger advice text appears |

Modifiers: trekking poles +10, unbuckle hip belt (choice) +3, partner linking arms +5, scout upstream (+20 min) +5, cold and tired -5/-10, -3 per bulky outside item (cap -10), canister on top -4. Bands follow 9.2. The ford fail table: 85% swept off your feet and soaked (pack contents wet unless lined), 12% an outside item lost downstream, 3% injury (mild sprain 2.5%, moderate 0.5%). Rain-swollen gravel-bar camps (Hoh) get a night card, "the river talks louder", when the depth at the camp node rises more than 0.8 ft overnight.

### 4.8 Tides (coast)

- Ship **real NOAA high/low predictions** for La Push (station 9442396) for the next several years as compact JSON (`data/tides/la_push_YYYY.json`, about 1,410 events/yr, about 30 KB). Each coast node has a time offset in minutes (Ozette coast about +5, Kalaloch about -10).
- **Interpolate** between consecutive extremes with the standard cosine rule: `h(t) = h1 + (h2 - h1) x (1 - cos(π (t - t1)/(t2 - t1)))/2`.
- **Effective height** adds swell run-up: `h_eff = h + runup`, where runup = 0.5 ft (calm), 1.5 ft (SHW/RAIN), 3.0 ft (STORM, big swell).
- **Headlands** carry `passableBelowFt`. From the NPS South Coast Route page: the beach about 3 mi south of Third Beach trailhead (Taylor Point to Scotts Bluff) is 4.5 ft, Scott Creek to Strawberry Point is 4.0 ft, Diamond Rock is 2.0 ft. Some have `overland` alternatives (rope ladders) and some are `impassable` (Point of the Arches). The coast data file should confirm every threshold.
- **Headland check:** margin `m = passableBelowFt - h_eff`.
  - m ≥ 1: auto-pass (narrated).
  - m < 1: a check with `base(m) = 85 + 10m` (m ≥ 0, cap 95), `85 + 55m` (-1 ≤ m < 0), or `30 + 20(m + 1)` (m < -1, floor 5). Then rising -10, falling +5, plus the global coast modifiers (9.3).
  - The card always offers **Wait**, showing the next passable window computed from the tide curve, and **Overland** where it exists.
  - m < -1 is a Sierra moment.
- **The tide table is an item** (1 oz, $2 at any store). With it, the coast HUD shows the tide curve and "Now: 5.6 ft rising". Without it you only get the narrator ("the sea looks close to the rocks"). You also need a time source (phone with battery, or a watch). **Misreading the tide is a player mistake, not a die roll.** The game never misreads for you, but it does model the consequences honestly (worked example C).

### 4.9 Living things and other people

Each region data file's `wildlife_and_plants` and `hazards` arrays feed event cards. The engine needs a few seasonal curves:

| Thing | Curve | Engine effect |
|---|---|---|
| Mosquitoes | HIGH: late Jun to early Aug peak; coast low | spirits -2/h at camp without `bug_net`/`repellent` |
| Yellowjackets | Aug to Sep, low-mid elevation | sting card (allergy flag, first aid) |
| Black bear activity | late Jul to Sep (berries) | sighting/joy card; camp visitor card if food outside canister |
| Raccoons, mice, jays | coast raccoons all season; mice at popular camps | food theft if not in canister (night roll) |
| Elk rut | mid-Sep to Oct, Hoh/Queets | bugling joy card; "bull on the trail" caution card |
| Olympic marmot | Jun to Sep, meadows | joy card; journal sketch |
| Other hikers | trail popularity x weekend x month | quota full, help availability, "kind strangers" cards, ranger patrols |

---

## 5. Movement and time model

### 5.1 Base time for a segment (backpacker's Naismith)

```
movingHours = (miles x CLASS[trailClass]) / vFlat + gain / climbRate + steepLoss / 2000
steepLoss   = max(0, loss - 400 x miles)        // only descents steeper than 400 ft/mi slow you
hours       = movingHours x M_load x M_dark x M_energy x M_injury x M_weather x M_snow x M_pace x BREAKS x dayPace
BREAKS      = 1.12                              // about 7 min of rest per moving hour
dayPace     ~ Normal(1.00, 0.07), clamped to 0.85 to 1.20, drawn each morning ("your legs feel springy today")
```

| Fitness | Name | vFlat (mph at comfort load) | climbRate (ft/h) | Energy cost multiplier |
|---|---|---|---|---|
| 1 | Easygoing | 1.8 | 900 | 1.35 |
| 2 | Casual | 2.1 | 1,100 | 1.15 |
| 3 | Regular | 2.4 | 1,300 | 1.00 |
| 4 | Strong | 2.7 | 1,600 | 0.88 |
| 5 | Mountain goat | 3.0 | 1,900 | 0.78 |

| Trail class (from region data) | CLASS | Notes |
|---|---|---|
| `road_walk` | 0.85 | |
| `maintained` | 1.00 | |
| `primitive` | 1.25 | brush, blowdown, washouts |
| `way_trail` | 1.40 | navigation check in fog |
| `off_trail` | 1.90 | navigation + footing checks |
| `snow_or_glacier` | 1.80 | needs `traction`/`ice_axe`; glacier needs `rope` + skill (Sierra-moment crevasse card) |
| `beach_sand` | 1.30 | coast |
| `beach_cobble` | 1.70 | coast; ankle checks |
| `overland_coast` | 1.80 | rope ladders, mud; footing checks |
| fixed obstacles | +10 to 20 min each | ladders, rope ladders, log crossings |

### 5.2 Multipliers

**Load.** `r = packWeightLb / comfortLb`, where `comfortLb = min(pack.loadRatingLb, 0.25 x bodyLb)`.

```
M_load = 0.85 + 0.15 r                         if r ≤ 1   (a light pack is faster, but not dramatically)
       = 1 + 0.45 (r - 1) + 0.6 max(0, r - 1.4)^2   if r > 1
```

| r | Feel | M_load | Energy load multiplier (7.1) |
|---|---|---|---|
| 0.30 | Light (day pack) | 0.90 | 0.86 |
| 0.67 | Light | 0.95 | 0.93 |
| 1.00 | Comfortable | 1.00 | 1.00 |
| 1.30 | Heavy | 1.14 | 1.15 |
| 1.60 | Very heavy | 1.29 | 1.32 |
| 2.00 | Brutal | 1.67 | 1.72 |

Above r = 2.0 the hiker refuses to leave the car: "You can't lift it onto your shoulders."

**Darkness** (after trail-dark): headlamp x1.35 (x1.5 on primitive/way trail; x1.25 on open terrain with a full moon). Phone flashlight x1.6, and it drains about 12% battery per hour. No light x2.5, allowed only on `maintained` or `beach`; everything else forces a stop.

**Energy:** `M_energy = 1 + max(0, 30 - E)/60` (E = 0 gives x1.5).

**Injury:** the product of active injury multipliers (7.8).

**Weather:** RAIN x1.05, STORM x1.15, heat above 80 °F on exposed climbs x1.10, mud (rain in last 24 h on `mud` tag) x1.10.

**Snow:** from 4.6.

**Pace choice:**

| Pace | Time | Energy | Effects |
|---|---|---|---|
| Easy | x1.15 | x0.85 | +1 discovery card weight, +spirits |
| Steady | x1.00 | x1.00 | |
| Push | x0.88 | x1.25 | footing -5, feet wear x1.3 |

### 5.3 Worked times (Regular fitness, from the Hoh and Sol Duc region data)

| Segment | mi | gain / loss | r | Hours | Effort-miles (7.1) | Energy drain |
|---|---|---|---|---|---|---|
| Hoh TH to Lewis Meadow | 10.4 | +640 / -249 | 0.67 day pack | 5.1 | 11.5 | 64 |
| Hoh TH to Lewis Meadow | 10.4 | +640 / -249 | 1.05 full pack | 5.5 | 11.5 | 71 |
| Lewis Meadow to Elk Lake | 4.9 | +1,860 / -295 | 0.67 | 3.7 | 8.0 | 45 |
| Elk Lake to Glacier Meadows (incl. ladder washout) | 2.1 | +1,792 / -139 | 0.67 | 2.4 | 5.1 | 29 |
| **Hoh TH to Glacier Meadows (17.4 mi)** | 17.4 | +4,292 / -683 | 0.67 | **11.3** | 24.6 | **138** |
| Sol Duc TH to Sol Duc Park | 7.1 | +2,470 / -250 | 0.98 | 5.4 | 11.2 | 67 |
| Sol Duc Park to Lunch Lake (via Heart Lake, High Divide, Mirror Lake way trail) | 3.8 | +1,130 / -870 | 0.95 | 3.0 | 6.2 | 37 |
| Lunch Lake to Bogachiel Peak and back (day pack) | 3.6 | +1,030 / -1,030 | 0.30 | 2.8 | 6.4 | 32 |
| Lunch Lake to Sol Duc TH via Deer Lake | 7.8 | +830 / -3,300 | 0.85 | 4.5 | 9.4 | 55 |

These pass a sanity check against trip reports. Regular backpackers report 4.5 to 6 h to Lewis Meadow and 9 to 12 h to Glacier Meadows in one push.

### 5.4 Honest ETAs

Whenever the player chooses where to go next, the card shows the ETA from the same formula with the current state. It also shows a 10th to 90th percentile band from `dayPace` and weather variance: "About 6 h. You'd arrive between 9:40 and 10:50 PM, about 2½ hours after dark."

### 5.5 Arriving after dark, or not reaching your permitted camp

1. **Foreshadow.** When `projectedArrival > trailDark - 60 min` at a landmark, the narrator says so ("The light is going amber; Glacier Meadows is still 7 miles and 3,600 feet above you") and a **Fork card** fires, a forced decision:

| Option | Availability | What happens |
|---|---|---|
| Push on | always | night travel multipliers; footing checks at -10 (headlamp) or -20 (phone); navigation checks on way trails; energy and warmth keep ticking |
| Camp here (not your permit) | at any camp node or flat spot | legal at a camp only with "ranger discretion": 15% chance a ranger notices in quota areas, which gives a kind but firm talk, LNT -5, no fine shown. On a non-camp spot, LNT -10 and fragile-meadow damage if tagged `meadow` |
| Turn back | always | recompute ETA to the car |
| Lighter alternative | if the region graph has a nearer legal camp | shown with its own ETA |

2. **Benighted mid-segment** (trail-dark arrives between landmarks) forces a stop card: *continue by light*, or *bivouac where you are*. A bivouac without a shelter or sleeping bag runs the full cold-night model (7.6).
3. **No light, non-maintained trail:** you must stop. In Storybook mode the narrator turns it into a "night under the stars/rain" chapter. In Sierra mode, walking on without light is offered at a shown 15 to 30% and can be a Sierra moment near cliffs or ladders.
4. **Permit logic.** The itinerary is the permit. Arriving at a different camp (earlier or later) sets `offPermit`, which costs Leave No Trace points and can trigger a ranger-chat card. It never hurts the hiker's body. Quota-full camps in the planner mirror the real quota areas in the region data.

---

## 6. Packing model

The user wants outcomes driven by "the various combinations of things you can and can't fit in pack". Packing therefore has three hard limits and one soft one:

1. **Volume (liters)** inside the pack. A hard limit, with a little "stuffed" overflow allowed.
2. **Outside slots.** A small, hard number of strap points, each with a real penalty.
3. **The bear canister.** Rigid, required for every overnight, and the only legal place for food and smellables at night. It is the hard cap on food days.
4. **Weight (soft).** No hard limit below r = 2.0, but it makes you slower, hungrier, wobblier and harder on your knees.

### 6.1 Packs (generic names; the store proposal names the fictional outfitter)

| Pack | Capacity (L) | Load rating (lb) | Weight (lb) | Outside slots |
|---|---|---|---|---|
| Day pack 22 | 22 | 15 | 1.2 | 2 side pockets (1 L bottle each) |
| Fastpack 35 | 35 | 22 | 1.8 | 2 side, front mesh 4 L, 1 bottom strap |
| Weekender 50 | 50 | 32 | 2.6 | 2 side, front mesh 6 L, 2 bottom straps, 1 tool loop |
| Trekker 65 | 65 | 42 | 4.4 | 2 side, front mesh 6 L, 2 bottom straps, 1 top strap, 2 tool loops |
| Expedition 80 | 80 | 55 | 5.5 | 2 side, front mesh 8 L, 2 bottom, 1 top, 2 tool loops, 2 side compression straps |

`comfortLb = min(loadRatingLb, 0.25 x bodyLb)`. A 165-lb hiker in a Weekender 50: min(32, 41) = 32 lb.

### 6.2 Volume

```
insideL = Σ item.volumeL (compressed volume if the item is compressible and has a stuff sack)
        + Σ rigid items x 0.08 x volumeL        // round canisters and pots leave dead space
fill    = insideL / capacityL
  ≤ 0.85  "Roomy"
  ≤ 1.00  "Snug"
  ≤ 1.10  "Stuffed"   (packing up each morning +10 min; outside items more likely, since the lid won't close)
  > 1.10  "Won't close": the Pack screen won't let you leave until something comes out or goes outside
```

Representative item volumes and weights. These are illustrative; `gear_catalog.json` is authoritative.

| Item | L | lb | Notes and tags |
|---|---|---|---|
| Standard bear canister (BV500-class) | 11.5 | 2.6 | rigid; `canister`; usable volume 85% |
| Small bear canister (BV450-class) | 7.2 | 2.1 | rigid; about 3 food days |
| 2-person dome tent | 4.5 | 4.2 | `shelter:tent`; poles can ride in a side pocket |
| Trekking-pole tent (1p) | 2.5 | 1.6 | `shelter:tent`, needs `poles` |
| Tarp / bivy / space blanket | 1.0 / 1.5 / 0.1 | 0.8 / 1.0 / 0.1 | `shelter:tarp` / `shelter:bivy` / `emergency_blanket` |
| Down bag 30 °F / 20 °F | 7 / 9 | 2.0 / 2.6 | compresses; `sleep:30`; wet-sensitive |
| Synthetic bag 30 °F | 12 | 3.0 | bulky; keeps 60% warmth wet |
| Foam pad R2 / inflatable pad R4 | 12 (outside only) / 1.2 | 0.9 / 1.0 | foam can't puncture; inflatable punctures if outside in brush |
| Down / synthetic puffy | 2.5 / 3.5 | 0.7 / 0.9 | `insulation` 18 / 15 |
| Fleece | 2.5 | 0.8 | `insulation` 10 |
| Rain jacket / rain pants / poncho / windbreaker | 1.0 / 0.8 / 1.0 / 0.4 | 0.6 / 0.5 / 0.7 / 0.25 | `rain_top`, `rain_bottom`, `poncho`, `wind_top` |
| Dry camp clothes + socks | 2.0 | 0.9 | `camp_clothes` |
| Camp shoes | 2.0 | 0.8 | outside-able; `camp_shoes` |
| Stove + pot + lighter | 1.5 | 0.9 | rigid pot; `stove` |
| Fuel 100 g / 230 g | 0.5 / 1.0 | 0.45 / 0.8 | about 14 / 32 half-liter boils (fewer in cold and wind) |
| Filter / chemical tabs | 0.4 / 0.05 | 0.3 / 0.05 | `water_treat:filter` / `:chem` (30 min wait) |
| 1 L bottle (side pocket) / 2 L bladder (inside) | 0 / 2.0 full | 0.1 + 2.2 per L | water capacity |
| Headlamp | 0.1 | 0.2 | `light:headlamp`, about 40 h battery |
| Map + compass | 0.2 | 0.2 | `nav:map` |
| Tide table | 0.02 | 0.05 | `tide_table` |
| First aid basic / good | 0.5 / 1.0 | 0.4 / 0.8 | `first_aid:1` / `:2` |
| Blister kit | 0.1 | 0.1 | `blister_kit` |
| Sun kit (hat, glasses, screen) | 0.5 | 0.4 | `sun` |
| Bug net + repellent | 0.3 | 0.2 | `bug` |
| Trekking poles | tool loop / side | 1.0 | `poles` |
| Ice axe / microspikes | tool loop / 0.6 | 1.1 / 0.8 | `ice_axe` / `traction` |
| Satellite messenger | 0.1 | 0.25 | `messenger` (SOS: section 10) |
| Trowel + TP kit | 0.3 | 0.2 | `trowel` (LNT) |
| Sketchbook + pencils | 0.6 | 0.6 | `sketchbook` (Journal: the Golden Glow) |
| Camera / binoculars / field guide | 1.0 / 0.8 / 0.8 | 1.2 / 0.8 / 1.0 | joy multipliers |
| Camp chair / book / fishing kit | 2.5 / 0.6 / 1.5 | 1.0 / 0.6 / 0.6 | luxury joy; no license needed in the park |
| Pack liner / pack cover | 0 / 0.3 | 0.2 / 0.3 | `waterproofing` |
| Food | about 2.0 per person-day | about 1.7 per day | dense plans about 1.6 L/day; bulky about 2.6 L/day |

### 6.3 Outside carry: the trade-off valve

| Slot | Accepts | Penalties |
|---|---|---|
| Side pockets | bottles, poles, tent poles, umbrella | none |
| Front mesh (L limit) | soft items: rain gear, wet fly, sandals, sit pad | items get wet in rain; snag 0.2%/mi on brush |
| Bottom straps | pad, tent, bag in a dry bag | `outsideBulky` +1 each; wet unless waterproof; snag 0.4%/mi on `primitive`/`brush`/`blowdown`/`overland_coast` |
| Top strap | canister, pad, rope | canister on top: top-heavy (footing -4 on its own) |
| Tool loops | ice axe, poles | none |

- **Balance:** each `outsideBulky` item gives -3 on footing, ladder, ford and headland checks (cap -10). With 3 or more bulky items the narrator calls you a "Christmas tree".
- **Wet exposure:** a sleeping bag outside without a dry bag has an 8% chance per rain-hour of becoming `wet`, and a wet down bag loses 75% of its warmth.
- **Snag:** on brushy or blowdown trail, outside items can be dragged off ("your mug is gone") or damaged (an inflatable pad punctures at 1%/mi if strapped outside in brush, and it can be patched only with a `repair` kit).

### 6.4 The bear canister and food days

All food, trash and scented items must be in an approved canister for any overnight in Olympic wilderness (2026 rules, both region data files). Canisters are **loaned free at the Port Angeles WIC** (first come, first served). The planner rolls availability honestly: 70% available on summer weekends and 95% midweek. If none is left, you borrow or buy one at the store.

```
usableL     = 0.85 x canister.volumeL
smellablesL = 0.3 + 0.1 x nights                     // toothpaste, sunscreen, lip balm, trash
foodDays    = (usableL - smellablesL) / foodLPerDay
```

| Canister | Usable L | Food-days at 2.0 L/day (3 nights) | Food-days at 1.6 L/day (dense) |
|---|---|---|---|
| Small (7.2 L) | 6.1 | 2.8 | 3.4 |
| Standard (11.5 L) | 9.8 | 4.6 | 5.7 |
| Two standard (2 people, smellables doubled) | 19.6 | 9.2 person-days | 11.5 |

Only night matters for the canister. Day 1 lunch and snacks can ride outside it. **Night overflow** (food or smellables that don't fit) triggers the night visitor roll: coast raccoons 40%, mice at popular camps 30%, bears 5% (Aug to Sep in berry zones: 10%). A visitor eats the overflow, LNT -15, and a ranger card follows if a bear got food ("a fed bear is a dead bear" note, told gently). The odds are shown on the evening card: "Food that doesn't fit the canister: 1 bag of chips. Odds something gets it tonight: 30%."

### 6.5 Weight feel

`r = packWeightLb / comfortLb`: Light (r ≤ 0.6), Comfortable (≤ 1.0), Heavy (≤ 1.3), Very heavy (≤ 1.6), Brutal (≤ 2.0). Above 2.0 you can't leave the car. Pack weight includes water at 2.2 lb/L, so "carry 3 L for the dry crest" is a real weight decision.

### 6.6 Gear tags: how the pack talks to the event engine

Packing produces a tag set. Event preconditions and check modifiers read only tags, never item ids, so new gear only needs tags.

| Tag | Derived from | Example uses |
|---|---|---|
| `rain_top`, `rain_bottom`, `poncho`, `wind_top` | shell items | wetness protection; "Showers on the Divide" card |
| `insulation:N` | sum of carried insulating layers | evening warmth; cold-night bedtime card |
| `sleep:T`, `padR:x`, `shelter:tent/tarp/bivy/none` | sleep system | night model; storm-night cards |
| `light:headlamp/phone/none` | light sources | night travel; benighted cards |
| `water_treat:filter/chem/boil/none` | treatment | untreated-water card; sickness queue |
| `water_capL:x` | bottles and bladders | dry-crest card (Hoh Lake Trail, High Divide) |
| `nav:map/map_compass/gps/none` | map, compass, phone GPS | fog on way trails; snow-covered trail |
| `traction`, `ice_axe`, `rope`, `glacier_skill` | snow gear + skills | avalanche chutes; Blue Glacier; early-season Divide |
| `tide_table`, `time_source` | coast | headland HUD |
| `first_aid:1/2`, `blister_kit` | kits | injury severity step-down; hot spots |
| `sun`, `bug` | kits | sunburn, mosquito cards |
| `stove`, `fuel:N` | stove + fuel | hot drink in crisis; boiling water; dinner joy |
| `canister:LL`, `foodOverflow` | canister fit | night visitor |
| `camp_clothes_dry`, `camp_shoes` | | evening warmth; feet recovery |
| `messenger` | satellite messenger | SOS options (section 10) |
| `poles` | trekking poles | fords +10, descents (knee), footing +5 |
| `outsideBulky:N`, `topHeavy` | strap usage | ladders, fords, headlands |
| `sketchbook`, `camera`, `binoculars`, `field_guide` | joy items | Journal, wildlife, Golden Glow |
| `luxury:chair/book/fishing` | luxuries | layover joy |
| `waterproofing:liner/cover/none` | | gear-wetting rolls |

### 6.7 The trade-offs that actually bite

Eight packing dilemmas the content should keep testing:

| Dilemma | Typical case | If you choose A | If you choose B |
|---|---|---|---|
| Canister vs. a warm bulky bag | 50 L pack, synthetic 20 °F bag (15 L) + standard canister + tent = 3 L over | strap the tent outside: snag + wet fly, ladder -3 | leave the puffy: evening warmth -15, cold-camp spirits -; or buy a down bag ($$) |
| Rain pants vs. a 4th food day | 3-night canister nearly full | no rain pants: wet legs in showers and wet brush, cold night margin -4 to -8 °F | short on food: energyMax -10 on the last day |
| Ice axe on the outside in July (Glacier Meadows chutes) | Weekender 50 tool loop | traverse checks +25 | leave it: traverse checks at base, turn-back card likely |
| Day pack for "one night" | 22 L: no room for bag, tent or canister | — | the night model runs with clothes only (worked example A) |
| Extra water vs. weight on a dry crest | Hoh Lake Trail switchbacks, High Divide in August | 3 L: +6.6 lb, r +0.2 | 1 L: Parched by the crest, heat card |
| Camp chair vs. camp clothes | 65 L nearly full | layover joy +6/day | dry clothes: warmth reset at camp, feet recovery |
| Foam pad (unbreakable, outside) vs. inflatable (inside, warmer) | brushy coast overland trails | snag and wet, but never fails | puncture risk only if strapped outside |
| Sketchbook vs. camera vs. binoculars | Golden Glow finale and Journal | sketch = full Journal points (the book's lesson) | camera = 60%; binoculars = more wildlife cards |

### 6.8 The car is a stash (last chance at the trailhead)

At the trailhead the car is open for one beat. Players can swap anything between pack and car, and the Pack screen re-validates. After "Start hiking" the car is locked until you return (cars at the trailhead also carry a "dinner at the diner" joy card on return). **The game never makes you forget items at random.** Every gap is a choice, which keeps the post-trip "why did this happen" trace honest.

---

## 7. Body models

### 7.1 Energy

```
EM (effort-miles) = miles x CLASS + gain/600 + steepLoss/2000
drain             = 6 x EM x fitnessCost x loadE x weatherE x paceE
loadE             = 0.8 + 0.2 r  (r ≤ 1),   1 + 0.5 (r - 1) + 0.6 max(0, r - 1.4)^2  (r > 1)
weatherE          = 1.15 heat above 80 °F exposed, 1.10 cold rain while Cold, 1.15 postholing
energyMax         = 100 - kcalDeficit/150 - 15 (illness) - 10 (Dehydrated) - 5 x (moderate injuries), floor 40
```

- **Auto-snacking** (not a decision, to avoid micromanagement): the hiker eats trail food at up to 300 kcal per moving hour while E < 85, within a **daily allowance** = remaining trail food ÷ remaining trip days. `E += kcal/20`, so a 250-kcal bar gives +12. An "Eat extra" one-tap override appears whenever E < 30.
- **Lunch** (a 30-min beat, optional): up to 600 kcal, so +30.
- **Overnight:** `E = min(energyMax - 30 x (1 - Q), E_bed + 20 + 60 x Q + (dinner ≥ 600 kcal ? 10 : 0))`. Q is sleep quality (7.6). A bad night lowers tomorrow's ceiling as well as the refill.
- **Bonk** (E < 15): M_energy at least x1.25, heat production x0.6, footing -20, spirits -5/h. Bonk is the classic way day-gear trips go wrong: food ran out before the miles did.

### 7.2 Calories and food

```
burn/day = BMR + hike + camp
BMR      = 10.6 x bodyLb                 (about 1,750 kcal for 165 lb)
hike     = 0.5 x (bodyLb + packLb) x EM  (about 1,130 kcal for Sol Duc TH to Sol Duc Park with 32 lb)
camp     = 300; +10% total if Cold for more than 2 h
kcalDeficit += burn - eaten   (floor 0; a surplus does not bank)
```

Food items carry `{kcal, oz, L, yum 0..3, prep: none|cold|boil, waterL}`. Planning targets are about 2,500 to 3,500 kcal/day, about 1.7 lb/day and about 2.0 L/day. Dinner joy = `2 + 2 x yum (+2 if hot)`. **Food fatigue:** the same dinner on consecutive nights gives yum -1 per repeat, which rewards the "shopping" phase.

### 7.3 Hydration and water

```
loss per moving hour = 0.45 L x (1 + max(0, T - 65)/20) x (1.3 if climbing > 800 ft/h) x (0.8 if T < 50)
loss at rest 0.08 L/h, night 0.3 L total
```

The hiker auto-drinks carried water to keep the deficit at or below 0.5 L. Refills happen at nodes or segments tagged `water`; segments tagged `no_water` (Hoh Lake Trail, the High Divide crest) need `hours x loss` liters carried.

**Treatment** is automatic if you have it (filter: 2 min/L; chemical: 30 min wait). A choice card fires only when it is interesting: you're out of water at a creek and the chemical wait is long, or you have no treatment at all.

**Untreated water risk** per liter, by source tag (stylized, and labeled so in a Ranger's note):

| Source | Risk per liter |
|---|---|
| glacial or snowmelt high source | 1% |
| lake near a camp | 3% |
| lowland creek | 3% |
| coastal creek | 4% |

The trip cap is 25%. Outcomes:
- **Trail bug** (in-trip): incubation 36 to 96 h, then energyMax -25, pace x1.2 and spirits -20 for 24 to 48 h.
- **Giardia epilogue** (30% of infections): revealed 7 to 14 days after the trip as an Epilogue card. Joy -20, no gameplay. This keeps the real-world lesson ("treat all water") honest about real incubation times.

| Hydration | Liters behind | Effects |
|---|---|---|
| Thirsty | 0.75+ | spirits -1/h |
| Parched | 1.75+ | pace x1.05, footing -3, energyMax -5 |
| Dehydrated | 3+ | pace x1.15, energyMax -15; heat exhaustion card possible above 80 °F on exposed terrain |

### 7.4 Warmth (heat balance, core-temperature proxy)

Every tick:

```
M       = T_eff + insulation + activity - 65                      (°F-equivalents)
T_eff   = T_air - windChillDrop x (wind_top or rain_top worn ? 0.5 : 1) - (raining ? 4 : 0)
insulation = Σ worn layer.warmth x (1 - layer.wetSens x wet/100)
activity   = climbing 30, flat/descending 25, camp chores 10, sitting 0; x0.6 when E < 15
target  = clamp(65 + 1.5 M, 0, 100)
C      += (target - C) x (cooling ? 0.0875 : 0.125)   per 15-min tick (35%/h cooling, 50%/h warming)
hot drink: C += 8 at once (needs stove + fuel + water)
```

| Layer | Warmth | wetSens |
|---|---|---|
| Cotton T-shirt | 2 | 0.9 |
| Synthetic or wool base | 3 | 0.3 |
| Long underwear bottoms | 4 | 0.3 |
| Fleece | 10 | 0.4 |
| Down puffy | 18 | 0.75 |
| Synthetic puffy | 15 | 0.3 |
| Rain jacket (worn) | 4, halves wind chill | 0 |
| Windbreaker | 3, halves wind chill | 0 |
| Hat + gloves | 5 | 0.4 |
| Space blanket (stationary) | 6 | 0 |

Sanity checks:
- Hiking uphill at 40 °F in rain, wearing a cotton tee, a wet fleece (wet 70) and a windbreaker: insulation = 2 x 0.37 + 10 x 0.72 + 3, which is about 11. M = 36 + 11 + 30 - 65 = 12, so target 83. Moving keeps you warm.
- **Stop at camp** in the same clothes, doing chores: M = 36 + 11 + 10 - 65 = -8, so target 53, and falling.
- Sitting still: target 38, which is Cold.
- Change into dry camp clothes and a puffy: M = 36 + 21 + 10 - 65 = 2, so target 68, which is Comfortable.

| Warmth | Effects |
|---|---|
| Cool (40 to 59) | none |
| Cold (25 to 39) | dexterity checks -10 (stove, ladder, knots), spirits -3/h |
| Shivering (12 to 24) | forced crisis card; E -5/h |
| Hypothermic (below 12) | Serious rung: a forced crisis card with only warming, shelter or help options |

### 7.5 Wetness

```
Δwet/h = R x (1 - P) + brush + sweat - drying           (clamped 0 to 100)
P      = 0.65 x P_torso + 0.35 x P_legs
```

- **P_torso:** none 0, windbreaker 0.45, poncho 0.70 (0.45 when wind is above 15 mph), rain jacket 0.85, rain jacket + umbrella 0.92 (no wind).
- **P_legs:** none 0, poncho 0.40, rain skirt 0.60, rain pants 0.85.
- **brush:** wet vegetation (rain in the last 12 h, FOG, or dew before 10:00) on `primitive`, `meadow` or `brush` adds +8/h x (1 - P_legs). This is the Olympic special: soaked by huckleberry brush on a sunny morning.
- **sweat:** climbing in a shell +2/h (breathable) or +4/h (poncho or non-breathable); climbing in heat above 70 °F without a shell +3/h.
- **drying:** while not precipitating, hiking: -(6 + 0.3 x max(0, T - 40))/h. Camp swap into dry clothes: body wet resets to 0 (needs `camp_clothes_dry`). Sun at camp -10/h. Campfire -30/h, only below 3,500 ft and only when there is no fire ban (the 2026 Stage 2 ban was in effect from Aug 11).
- **Feet:** trail runners are wet within 1 h of rain or wet brush. Waterproof boots stay dry until 3 h of steady rain or any ford above the ankle, and then they stay wet overnight.
- **Gear inside the pack:** chance per rain-hour that an inside item becomes damp is 6% with no protection, 2% with a pack cover and 0.2% with a liner. After a failed ford: 60% / 5%.

### 7.6 Sleep and the night

```
T_sys  = 65 - bonus            (lowest air temperature you'd sleep comfortably at with this setup)
bonus  = bagWarmth x (1 - bagWetSens x bagWet)
       + padTerm
       + 0.7 x Σ dry clothes worn in the bag
       + shelter + food + extras
  bagWarmth: none 0, 40 °F bag 25, 30 °F 35, 20 °F 45
  padTerm:   R < 2: -6 x (2 - R)   (no pad = -12);   R ≥ 2: +2 x (min(R,5) - 2)
  shelter:   tent +5, bivy +4, tarp +2, under trees with nothing +2, open 0
             (rain with no shelter: bagWet +0.4 per wet hour)
  food:      dinner ≥ 600 kcal +2, hot drink +2, kcalDeficit > 2,000: -3
  extras:    space blanket +6 (no bag), companion huddle +4, hot-water bottle +3, borrowed puffy +12
margin = T_night(camp node) - T_sys
Q      = margin ≥ 0 ? 1 : clamp(1 + margin/25, 0, 1)
energy = min(energyMax - 30(1 - Q), E_bed + 20 + 60 Q (+10 for a good dinner))
dawn warmth = margin ≥ 0 ? 75 : clamp(70 + 2 x margin, 5, 85)
spirits: +5 (slept like a marmot) / -5 (margin -1 to -8) / -12 (-8 to -15) / -20 (below -15)
```

**Night hypothermia roll** if margin < -12: `p = clamp(1.5 x (-margin - 12), 0, 90)%`. It is shown on the bedtime card as its complement: "Chance you get through the night without dangerous shivering: 61%". Bedtime choices change it: eat everything, hot drink, walk around to warm up, ask the neighbors, or keep moving all night by headlamp.

**Sierra mode only:** a failed hypothermia roll with margin < -25 rolls again at 15% for death.

Reference cases:

| Setup | T_night | T_sys | Margin | Night |
|---|---|---|---|---|
| Lunch Lake, Aug: 30 °F down bag, R3.5 pad, tent, puffy in bag, hot dinner | 42 °F | 65 - (35 + 3 + 12.6 + 5 + 4) = 5 °F | +37 | Q = 1 |
| Glacier Meadows, late Sep: no bag, no pad, wet fleece, windbreaker, space blanket, under trees | 35 °F | 65 - (0 - 12 + 4 + 6 + 2) = 65 °F | about -30 | Q = 0, hypothermia 27% |
| Same, but kind neighbors lend a puffy and cocoa | 35 °F | 51 °F | about -16 | Q = 0.36, hypothermia 6% |

### 7.7 Feet

```
wear per mile = 0.6 x (feetWet ? 2.0 : 1) x (newBoots ? 1.8 : 1) x (r > 1.3 ? 1.3 : 1)
              x (Push ? 1.3 : 1) x (beach_cobble or beach_sand ? 1.5 : 1)
```

- **Hot spot** (below 70) always gets a card: tape it now (with `blister_kit`: +15, and a blister can't form today) or keep going.
- **Blister** (below 50): pace x1.08, spirits -8.
- **Shredded** (below 25): pace x1.25.
- **Overnight:** +12, plus 8 more with dry socks or camp shoes.

### 7.8 Injuries

| Injury | Typical source | Pace | Check mods | Lasts | Treatment | Trip? |
|---|---|---|---|---|---|---|
| Scrape / bruise | slip bands | 1.00 | — | trip | first aid: spirits back | no |
| Mild sprain | slips, ladders, cobbles | 1.15 | footing -10 | 3 days | tape: 1.10 (first aid), poles -0.03 | Trouble |
| Moderate sprain | bad slip band | 1.60 | footing -25 | trip | splint: 1.45 (`first_aid:2`) | Serious: walk out if on easy trail, otherwise rescue |
| Knee strain | heavy pack + steep descent, no poles | 1.20 downhill | — | 2 days | poles | Trouble |
| Cut | rocks, knife | 1.00 | — | | first aid prevents infection (otherwise 3%/day, a delayed card) | no |
| Sunburn | snow or beach without `sun` | 1.00 | spirits -10 next day | 2 days | | no |
| Sting | yellowjackets Aug to Sep | 1.00 | — | | allergy flag (companions) | rare |
| Trail bug | untreated water | 1.20 | energyMax -25 | 1 to 2 days | | maybe |
| Heat exhaustion | heat + Dehydrated | 1.30 | — | hours | shade, water | rarely |
| Hypothermia | cold | — | — | | warmth | Serious; Rescue if severe |

`first_aid:1` gives a 30% chance to step an injury down one severity. `first_aid:2` gives 50%, plus the `firstAid` skill x 5%.

### 7.9 Spirits

| Up | Down |
|---|---|
| sunset +8 | rain day -8 |
| marmot, elk or bear (safe) sighting +5 | Cold -3/h |
| good dinner +2 to +8 | mosquitoes without `bug` -2/h at camp |
| swim in a lake +6 | blister -8 |
| sketch +4 | arriving after dark -6 |
| layover morning +5 | food theft -10 |
| companion banter +3 | wet bag -15 |

Joy earned is multiplied by `0.5 + spirits/100`, so a miserable hiker enjoys the view half as much. When spirits drop below 20 at a camp beat, the hiker (or a companion) asks to go home. That is a real choice: "Head out tomorrow" or "One more day", and the second option carries a spirits recovery check that shows its %. This is the Oregon Trail "the party wants to turn back" moment.

### 7.10 Experience: better information, not just better odds

Each completed trip grants skill XP in the skills you used. Each skill level gives +2 on matching checks, **and it unlocks better foreshadowing**:
- `coast` 2: the HUD auto-computes "you'll reach Strawberry Point about 4:10 PM, tide 3.2 ft and falling".
- `navigation` 2: way-trail forks are flagged.
- `campcraft` 2: the evening card shows the night margin as words ("you'll sleep warm").

Veterans make better plans because they read the world better. This is the long-term "plan again" loop.

---

## 8. Decision and event engine

### 8.1 Card types

| Type | Fires when | Counts toward decision budget | Example |
|---|---|---|---|
| **Landmark** | arriving at a tagged node (once per visit) | only if it has a real choice | High Hoh Bridge; the ladder washout; Heart Lake; Taylor Point rope ladders |
| **Hazard** | preconditions + weighted draw | yes | showers on the Divide, blowdown, snowfield traverse, ford |
| **Encounter** | weighted draw | yes | bear on trail, elk bull, kind strangers, ranger patrol |
| **Discovery / Joy** | weighted draw (quiet slots) | usually no (one-tap); yes if a choice ("sketch it or keep moving") | avalanche lilies, marmot, Piper's bellflower, sea stacks at sunset |
| **Camp** | arrival and evening | yes (1) | pick a site, dinner, stay up for sunset |
| **Night** | night preconditions only | no (forced) | cold night, visitor, storm, river rising |
| **Crisis** | a state threshold is crossed (Shivering, Bonked, Hypothermic, lost light) | no (forced) | "Your fingers won't work the zipper" |
| **Fork** | ETA vs. dark, can't reach camp, closed trail | no (forced) | "The light is going amber" |
| **Chain step** | the previous step set a flag and the conditions hold | depends | wet legs, then cold camp, then cold night, then a morning choice |
| **Delayed payoff** | queue item comes due | no (forced) | the trail bug arrives |
| **Epilogue** | after the trip | no | giardia, sketches framed, "the bears here have learned" |

### 8.2 Card anatomy (JSON)

```json
{
  "id": "hoh_ladder_washout",
  "type": "landmark",
  "where": { "at": ["glacier_meadows_ladder_washout"] },
  "when":  { "months": [6,7,8,9,10] },
  "once": "per_visit",
  "scene": "hoh_ladder",
  "text": "Where the hillside slid away, a ladder is bolted to the raw rock. A rope hangs beside it, wet and cold.",
  "textIf": [ { "if": { "dark": true }, "text": "Your light makes a small, shaking circle on the rungs." } ],
  "choices": [
    {
      "id": "climb",
      "label": "Climb with your pack on",
      "check": {
        "domain": "footing", "base": 90,
        "mods": [
          { "if": { "tag": "poles" }, "add": 0, "label": "Poles (no help on a ladder)" },
          { "if": { "state": "wetRock" }, "add": -5, "label": "Wet rungs" },
          { "per": "outsideBulky", "add": -3, "cap": -10, "label": "Gear strapped outside" },
          { "if": { "tag": "topHeavy" }, "add": -4, "label": "Canister on top" }
        ],
        "useGlobalMods": ["dark", "energy", "warmthDexterity", "injury", "skill:footing", "party"]
      },
      "bands": {
        "success": { "text": "Rung, rung, rung, and the meadow opens above you.", "joy": 3 },
        "shaky":   { "text": "A foot slips; the rope saves you.", "effects": { "spirits": -4, "time": 10 } },
        "fail":    { "table": "fall_ladder" }
      },
      "sierraMoment": true
    },
    {
      "id": "haul",
      "label": "Haul the pack up on the rope, then climb",
      "requires": { "any": [ { "tag": "rope" }, { "partyAtLeast": 2 } ] },
      "time": 20,
      "check": { "domain": "footing", "base": 96, "useGlobalMods": ["dark", "energy", "warmthDexterity"] },
      "bands": { "fail": { "table": "fall_ladder_light" } }
    },
    {
      "id": "retreat",
      "label": "Go back down to Elk Lake for the night",
      "effects": { "route": "elk_lake", "offPermit": true }
    }
  ],
  "tables": {
    "fall_ladder":       [ { "w": 80, "injury": "bruise" }, { "w": 18, "injury": "sprain_mild" }, { "w": 2, "injury": "sprain_moderate", "sierraDeath": 0.5 } ],
    "fall_ladder_light": [ { "w": 95, "injury": "bruise" }, { "w": 5, "injury": "sprain_mild" } ]
  }
}
```

### 8.3 Precondition vocabulary (compiled to functions at load)

- `at` (node ids), `atTag` (node tags: `camp`, `lake`, `pass`, `ford`, `headland`, `meadow`, `cold_pool`), `segmentTags` (from the region data `hazards`: `blowdown`, `river_ford`, `snowfield`, `avalanche_path`, `ladder`, `no_water`, `exposure`, `lightning`, `fog`, `route_finding`, `mosquitoes`, `steep_steps`).
- `zone`, `elev: [min, max]`, `months`, `days` (trip day index), `layover: bool`.
- `weather` (states), `weatherWithin: {hours, states}`, `freezingLevelBelow`, `snowCoverAtLeast`, `tide: {below|above, ft}`, `riverFI: {node, above}`.
- `hours: [from, to]`, `dark`, `minutesToDark: {below}`.
- `state`: comparisons on any meter (`"warmth<": 40`, `"energy<": 30`, `"wet>=": 40`, `"feet<": 70`, `"spirits<": 20`).
- `tagsAll`, `tagsAny`, `tagsNone` (gear tags from 6.6), `flags`, `notFlags`, `partyAtLeast`, `mode` (storybook/sierra), `skillAtLeast`.

### 8.4 Selection algorithm at each beat

```
function nextCard(ctx):
  forced = dueQueueItems(ctx) + crisisCards(ctx) + forkCards(ctx) + landmarkCards(ctx.node) + chainSteps(ctx)
  if forced not empty: return highestPriority(forced)        // crisis > fork > delayed > chain > landmark

  if ctx.decisionsToday >= budget(ctx.dayType): return narrativeCard(ctx)

  pool  = deck.filter(c => c.pre(ctx) && !onCooldown(c) && !seenThisTrip(c))
  quiet = rng.events() < quietRatio(ctx)
  if quiet: pool = pool.filter(c => c.tone in ["joy", "scenery"])
  weight(c) = c.w
            x Π c.weightMods(ctx)            // e.g. x3 if weather matches the card's weather
            x gapBias(c, ctx)                // see 8.5
            x novelty(c)                     // x0.3 if seen in either of the last two trips
            x pace(c, ctx)                   // Easy pace: discovery x1.5
  return weightedPick(pool, rng.events())
```

**Beat slots per segment:** every landmark node gets a slot. A segment longer than 2 hours of hiking gets one mid-segment slot, and a segment longer than 4 hours gets two. The daily budget then trims slots, cutting the lowest-priority ones first.

### 8.5 The Trail Director (pacing)

| Knob | Storybook (default) | Sierra |
|---|---|---|
| Tension T after a negative outcome | +10 / +20 / +40 (Uncomfortable / Trouble / Serious) | same |
| Tension decay per beat | x0.8 | x0.85 |
| `quietRatio` (chance an open slot is joy/scenery) | 0.55 + T/200 | 0.40 + T/250 |
| `gapBias`: weight multiplier on hazard cards whose `tagsNone` matches a real gap in your pack | x1.3 | x1.8 |
| Decisions per moving day (max) | 5 | 6 |
| Hazard cards per day (max, excluding forced) | 2 | 3 |

A **gap** is a tag that `sensibleKit[zone][month]` (data, 16) expects and the pack lacks: `rain_bottom` on the west side in September, `traction` on the High Divide in early July, `tide_table` on the coast. This is the "dungeon crawler" heart: **the mountain asks the questions your pack can't answer**, but the Director keeps it from asking all of them at once.

### 8.6 Multi-step chains

Chains are cards that set and read flags. Example, **the Soggy Day chain** (no rain pants, west side, SHW/RAIN):

```
[Trail] "Showers on the Hoh"     pre: weather SHW|RAIN, tagsNone rain_bottom
   choice: keep walking (wet +) | wait under a cedar 45 min (time -, wet less)
        sets flag wetLegs when wet ≥ 40
[Camp]  "A damp camp"            pre: flag wetLegs
   choice: change into camp clothes (if camp_clothes_dry: wet := 0)
         | fire to dry out (only below 3,500 ft, no ban: wet -30/h, LNT ok in ring)
         | eat a big hot dinner (+2 night bonus)
         | bed early in damp clothes (bag wet +0.2)
[Night] "The cold hours"         pre: night margin < -4, auto
   shows: margin breakdown ("damp clothes in bag -4 °F")
[Dawn]  "Grey morning"           pre: spirits < 40
   choice: dry layers in the sun 1 h (if CLR/PCL) | press on | turn around
```

Chains are where the **combinatorics** come from: the same Showers card plays four different ways depending on `rain_bottom`, `camp_clothes_dry`, `stove`, `sleep:T` and the elevation (fire rules).

### 8.7 Delayed consequences

All delays go into one priority queue. Rolls happen when an item comes due, using the trip's seeded stream. The % was shown when the player made the choice.

```json
{ "id": "q17", "due": { "atMinute": 5460 }, "chance": 0.03,
  "effect": { "illness": "trail_bug" }, "cause": ["drank_untreated@lewis_meadow_camp"],
  "foreshadow": "The water tasted faintly of iron." }
```

| Cause (a choice) | Delay | Payoff | Foreshadow |
|---|---|---|---|
| Untreated water | 36 to 96 h; 7 to 14 days (epilogue) | trail bug; giardia epilogue | "tasted of iron" |
| No rain pants + rain or wet brush | same evening | wet camp, night margin -4 to -8 °F | "pant legs dark to the knee" |
| No sun kit on snow or beach | next morning | sunburn, spirits -10 | "your nose feels hot" |
| New boots | about mile 6 | hot spot card | "a seam rubs" |
| Heavy pack + long descent without poles | next day | knee strain | "your knees grumble on the stairs" |
| Food overflow | that night | visitor roll | evening card shows the odds |
| Skipped breakfast | about 3 h into the day | bonk sooner | "your stomach growls at the switchbacks" |
| Gravel-bar camp + rain forecast | that night | "the river talks louder" card | at the arrival card |
| Ignored hot spot | 2 to 4 mi | blister | — |
| Stayed up past sunset at a clear high camp with a sketchbook | that evening | Golden Glow card eligible | "the snow is turning gold at the edges" |
| Food left out, bear got it | **next trip** to that region | "the bears here have learned" card | epilogue line |

### 8.8 Field Notes: the causality trace

Every effect stores the list of causes that produced it, as modifier labels and earlier choice ids. The trip Epilogue renders this as a gentle, illustrated **Field Notes** page:

> **Why the night at Glacier Meadows was so cold:** no sleeping bag (-35 °F of comfort), no pad (-12 °F), fleece soaked by the afternoon showers (-3 °F). The kind neighbors' puffy and cocoa (+14 °F) probably kept it from being worse.
> **Next time:** a 30 °F bag and a pad would have put you 25 °F on the warm side.

This is the Oregon Trail learning loop made explicit. Field Notes are also the main tool for testing that the model reads as fair.

---

## 9. Probability model (honest odds)

### 9.1 One formula

```
p = clamp( base + Σ cardMods + Σ globalMods(domain) , 5 , 97 )      (percentage points)
roll = rng.rolls() → integer 0..99
```

- **Additive percentage points**, not log-odds. Players can check the arithmetic ("Base 90, Dark -10, Tired -10 = 70"), and that legibility is the point. To keep additive math sane, card bases sit between 25 and 95 and any one modifier is at most ±35.
- **Clamp 5 to 97.** Nothing is certain on a mountain, and nothing is hopeless.
- **Routine checks:** when p ≥ 95 and the card has no meaningful alternative, the check is still rolled but **narrated, not asked** ("You hop the braided channels"). On a failure it can only produce its mildest band (Shaky). Honest, and it keeps taps down.

### 9.2 Outcome bands (what the % means)

```
roll < p - 30           → Great   (only if the card defines it)
roll < p                → Success
roll < p + (100 - p)/2  → Shaky   (made it, at a small cost)
otherwise               → Fail    (then the card's severity table)
```

**The number on the button is P(Success or better).** Critical choices show the three-band bar and, on tap, the fail table:

```
┌──────────────────────────────────────────┐
│  Climb with your pack on          57%  ▸ │
│  ████████████████░░░░░░░▒▒▒▒▒▒▒▒▒        │
│  57% clean · 22% shaky · 21% fall        │
│  If you fall: 80% bruised, 18% sprained  │
│  ankle, 2% badly hurt                    │
└──────────────────────────────────────────┘
```

### 9.3 Global modifier library (applies by domain; cards add their own)

| Modifier | footing | ford | navigation | coast (headland) | snow | dexterity (stove, knots) |
|---|---|---|---|---|---|---|
| Dark: headlamp / phone / none | -10 / -20 / -35 | -15 / -25 / -40 | -10 / -20 / -35 | -15 / -25 / -40 | -10 / -20 / -35 | -5 / -10 / -20 |
| Energy below 30 / below 15 | -10 / -20 | -10 / -20 | -5 / -10 | -10 / -20 | -10 / -20 | — |
| Warmth below 40 / below 25 | -5 / -10 | -5 / -15 | -5 / -10 | -5 / -10 | -5 / -10 | -10 / -25 |
| Outside bulky items (each, cap -10) | -3 | -3 | — | -3 | -3 | — |
| Canister on top | -4 | -4 | — | -4 | -4 | — |
| Trekking poles | +5 | +10 | — | +3 | +5 | — |
| Traction / ice axe | — | — | — | — | +15 / +25 | — |
| Map / map+compass / phone GPS | — | — | +10 / +15 / +10 (until battery runs out) | — | +5 | — |
| Mild / moderate sprain | -10 / -25 | -10 / -25 | — | -10 / -25 | -10 / -25 | — |
| Skill (per level, 0 to 5) | +2 | +2 | +2 | +2 | +2 | +2 |
| Companion helping (per person, cap +10) | +5 | +5 | +5 | +3 | +5 | +3 |
| Push pace | -5 | — | -5 | — | -5 | — |
| Fog / whiteout | — | — | -15 / -30 | -5 | -10 | — |
| Wet rock (rain in last 3 h) | -5 | — | — | -5 | — | -5 |

### 9.4 Compound choices: honest % by look-ahead

Some choices aren't one roll: "push on 7 miles in the dark", "stay out and wait for the tide", "hike out tomorrow with 250 kcal". For these the game **runs the same sim forward 200 times** from the current state on a separate RNG stream (`rng.lookahead`), so the trip's own randomness is untouched. It follows the chosen option and then a default "sensible" policy until the next camp or the car, then tallies the outcome rungs. Cost is about 200 runs x 40 ticks, a few milliseconds on a phone. Results are rounded to the nearest 5%:

> **Push on to Glacier Meadows** · Arrive in OK shape **20%** · Arrive in serious trouble **60%** · Need help **20%**

### 9.5 Which decisions show a % (recommendation)

| Decision kind | Show | Why |
|---|---|---|
| Rolled choice that can injure, lose gear or end the trip | **% + three-band bar + fail table** | the user asked for odds on critical decisions; these are the ones players argue about |
| Rolled choice with small stakes (spot the marmot, catch a trout, sketch before the fog) | **% only** (small, grey) | the user asked about odds on "all decisions" too; it's cheap and consistent |
| Compound choice | **look-ahead outcome bar** | honest without fake precision |
| Unrolled choice (camp here vs. there, eat now, take the photo) | **no %**; show deterministic effects (ETA, kcal, liters, LNT) | there's no chance involved, so a % would be a lie |
| Planning | forecast PoP; the **ranger's look-ahead** on the whole plan (200 runs, default policy) in words, with the % in the Ranger's Notebook | "Ranger Ines frowns: three things worry her" |

**Recommendation: show the % on every rolled choice (default ON).** This literally answers "all decisions also or critical ones": all rolled decisions get a number, and critical ones get more detail. A **Words only** setting replaces numbers with phrases from the same thresholds, for a purer storybook feel or for kids:

| p | Words |
|---|---|
| 90 to 97 | Almost certainly |
| 70 to 89 | Likely |
| 50 to 69 | A fair chance |
| 30 to 49 | Risky |
| 10 to 29 | A long shot |
| 5 to 9 | Foolhardy |

### 9.6 Randomness, seeds and save-scumming

- One seeded PRNG (sfc32 or mulberry32) with **independent streams**: `weather`, `events`, `rolls`, `lookahead`, `pace`. Weather never shifts because you dawdled.
- `rolls` is indexed by **(check id, visit count)**, not by a global counter. Restoring a save and repeating the same choice at the same ladder produces the same roll, the King's Quest way: deaths and falls are puzzles to solve by changing your approach (haul the pack, wait for morning, take the overland trail), not by reload-spamming. A different choice uses a different check id, so it gets a fresh roll.
- "Replay this trip" reuses the seed: same weather, same world, a new attempt. This also makes a shareable "challenge seed" possible later.

---

## 10. Consequence ladder, modes and rescue

### 10.1 The ladder

| Rung | Name | Examples | Typical exits |
|---|---|---|---|
| 0 | Fine | — | — |
| 1 | Uncomfortable | damp, tired, hungry, bitten, sore feet, chilly night (margin -1 to -8) | resolves with camp, food, sleep |
| 2 | Trouble | Cold, blister, mild sprain, food lost to mice, behind schedule, off-permit camp, cold night (margin below -8), trail bug | choices that cost time or joy; may shorten the trip |
| 3 | Serious | Shivering or Hypothermic, moderate sprain, Bonked far from the car, out of light on bad trail, stranded by tide, lost in fog off-trail | forced crisis card: always at least one bail option and one help option |
| 4a | Trip Over | walk out early by choice or necessity | gentle Home Early ending, Field Notes, plan again |
| 4b | Rescue | rangers walk you out, ground team carries you, or a helicopter on Olympus / Coast Guard on the coast | gentle Rescued ending, Field Notes, plan again |
| 5 | Death (**Sierra mode only**) | failed Sierra moment | Sierra death screen, Restore / Restart / Plan Again |

**Escalation rules.**
1. A rung goes up only through a failed check, a crossed threshold, or a delayed payoff the player risked knowingly.
2. Trouble can only become Serious after a crisis card the player saw.
3. Serious always offers a safe-ish option.
4. In Storybook mode nothing goes above 4b.

### 10.2 Help and rescue

| Way out | Needs | Time to help | Shown odds |
|---|---|---|---|
| Walk out (self) | legs | ETA by formula | look-ahead % |
| Kind strangers (camp or trail) | other hikers present (popularity x weekend x month) | immediate | "Ask for help" check: base 70 |
| Ranger patrol | ranger presence by station and season (e.g. Olympus Guard Station in summer) | 1 to 6 h | per-hour chance shown in words |
| Send a companion | party ≥ 2, companion fit to travel | ETA to the trailhead + 2 to 4 h | look-ahead |
| Satellite SOS | `messenger` + battery | helicopter 3 to 6 h if weather allows flying (not STORM, not dense fog), else ground team 8 to 16 h | exact |
| Wait | — | per-hour chance someone passes: 2 to 25% by popularity and daylight | exact |

In Storybook mode a rescue is kind and unembarrassing: a ranger with a thermos, a scene at the Hoh Ranger Station, and the trip ends with a Field Notes page and a "Plan again" button. No bills and no lecture. The lesson is in Field Notes.

### 10.3 Modes

| | **Storybook (recommended default)** | **Sierra (optional)** |
|---|---|---|
| Death | never | at flagged Sierra moments only |
| Worst outcome | Rescue (4b), told gently | Death, with the classic text-box screen |
| Director | gentler (8.5) | harsher |
| Saves | auto at every camp | auto at every camp plus a manual "Save your game" at camp, in the spirit of "save early, save often" |
| Rescue | free, gentle | possible (messenger, strangers) but score -100 and a dry SAR-bill joke |
| Odds display | numbers (or words) | numbers (or words); Sierra moments flagged with a skull-free "this could end badly" icon |

**Sierra moments** (each needs a failed check, then a death roll, and every one shows its odds):

| Moment | Death roll after failure |
|---|---|
| Ladder or exposed washout, worst fall band | 50% of the 2% band |
| Ford at FI > 2.2 | 20% |
| Headland attempt with h_eff more than 1 ft over the limit | 25% |
| Crevasse on the Blue Glacier without `rope` + `glacier_skill` | 30% |
| Hypothermia roll failed with night margin below -25 | 15% |
| Staying on an exposed crest during TSTM (choice) | 2% |
| Off-trail in fog near a `cliff` tag | 10% |

The death screen keeps the respectful Sierra tone: the joke is aimed at the choice, not the loss. "The Blue Glacier has a long memory, and now you are part of it. Perhaps a sleeping bag next time? [Restore] [Restart] [Plan Again]"

**Recommendation:** ship Storybook as the default. Offer Sierra on the title screen as "Sierra Mode (you can perish)", unlocked from the start. Many Sierra fans will want it, and it costs little: the rolls are the same, and only the top rung differs.

---

## 11. Scoring

### 11.1 The score line (King's Quest homage)

The top bar reads `Joy 87 of 250` beside the trip day and clock. **The maximum is computed for the itinerary at planning time.** It sums landmark joy, potential discovery cards, sunsets on clear-sky odds, layover activities and the Golden Glow if the plan includes a qualifying high camp. Bigger, longer and better-timed trips have bigger maxima, but finishing is worth more than overreaching.

| Joy source | Points |
|---|---|
| Landmark (first visit ever / repeat) | 5 / 2 |
| Viewpoint or summit (Bogachiel Peak, Blue Glacier moraine, High Divide, Toleak Point) | 8 to 15 |
| Sunset watched (clear / partly) | 6 / 3 |
| Wildlife (marmot, elk, bear at a safe distance, otters, eagles) | 3 to 8 |
| Plant or species for the Journal (sketch / photo / just looked) | 4 / 3 / 1 |
| Good dinner / hot drink in the rain | 2 to 8 / 3 |
| Swim, fishing, reading in the camp chair (layover) | 3 to 6 |
| **The Golden Glow** (sketched, not picked) | 30 |
| Finishing the planned trip | +20 |
| Home Early / Rescued | joy kept, then x0.75 / x0.5 |

The spirits multiplier (7.9) applies to all positive joy.

### 11.2 Other tallies

- **Journal:** sketches and field-guide entries across trips (a collection, like the book's field-guide spreads). **Picking** a flower is always offered; picking gives the Journal a "wilted in a jar" entry and LNT -10. **Sketching** gives the full page. This is the Golden Glow's lesson, made mechanical.
- **Leave No Trace** (starts at 100): off-permit camp -5 (on meadow -10), food lost to wildlife -15, campfire above 3,500 ft or during a ban -20, shortcutting switchbacks or meadows -5, feeding wildlife -10, picking plants -10, packing out someone else's trash +3, blue-bagging on the moraine +2.
- **Trail stats:** miles, gain, camps visited, summits and viewpoints, species seen.
- **Trip title:** A Golden Trip (Golden Glow + no Trouble), A Good Trip, A Soggy Story (finished with Trouble), Home Early, Rescued by Rangers, or (Sierra) Perished.
- **Cross-trip badges:** "Every camp on the Hoh", "Seven Lakes, all seven", "Royal Basin", "Tide Reader" (rounded every South Coast headland with at least 1 ft of margin).

---

## 12. Worked example A: Glacier Meadows in one night with day-hike gear, late September

> "Go for Mount Olympus with day hike gear in one night, might have a problem." This example shows exactly how that problem happens, and that it is honest.

### 12.1 The plan the player made

| Item | Value |
|---|---|
| Itinerary | Hoh Rain Forest TH to Glacier Meadows (17.4 mi, +4,292 / -683 ft), 1 night, out the same way. Sat Sep 25 to Sun Sep 26 |
| Permit | Glacier Meadows, quota area (available in late September) |
| Hiker | Regular fitness (3), 165 lb, skills all 1 |
| Drive | leave Seattle 6:00 AM, ferry, Hoh TH 10:30; start 10:45 AM. Energy 92 |
| Pack | Day pack 22: 2 x 1 L bottles, cotton tee (worn), fleece, windbreaker, phone (80%), small first aid kit with space blanket, sun kit, keys and wallet. **10.1 lb, r = 0.67 (Light)** |
| Food | 1,800 kcal: sandwich 600, 3 bars x 250, trail mix 450 |
| Tags present | `wind_top`, `insulation:10`, `light:phone`, `water_capL:2`, `first_aid:1`, `emergency_blanket`, `sun`, `nav:gps` (phone) |
| Gaps vs. `sensibleKit[HIGH][Sep]` | `rain_top`, `rain_bottom`, `sleep`, `pad`, `shelter`, `stove`, `water_treat`, `canister`, `light:headlamp`, `nav:map` |

**Foreshadowing the player got (and ignored):**
- The Pack screen flagged "No bear canister: required for every overnight" in red, but still let them leave. Rules can be broken; the ranger and LNT notice.
- The Plan screen's **Trip Outlook** (a 200-run look-ahead with a default policy) said: *"This plan very likely ends in serious trouble. About 1 in 4 times, rangers help you down."*
- **Forecast** (Wednesday, for Saturday): "Cloudy, showers likely after noon, snow level 6,500 ft" (PoP 60%). Sunday: "Rain, snow level 5,500 ft" (PoP 80%).
- **Actual weather** (seed 4417): Saturday OVC, SHW from 2:30 PM, steady RAIN after 9 PM. Sunday RAIN.
- Daylight Sep 25: sunset 7:08 PM, civil dusk 7:38 PM. Trail-dark under the Hoh canopy is **7:13 PM**.

### 12.2 The trip, beat by beat (all numbers from sections 4 to 9)

`dayPace` (Saturday) = 1.03

| Clock | Where | Beat / roll | E | Warmth | Wet | Phone | Food left |
|---|---|---|---|---|---|---|---|
| 10:45 | Hoh TH | Departure: pace Steady | 92 | 75 | 0 | 80% | 1,800 |
| 12:50 | Five Mile Island | Joy: "Elk bugle across the gravel bars." Watch 15 min or keep moving? Keeps moving | 82 | 75 | 0 | 78% | 1,550 |
| 2:20 | Hoh braids ford | Routine check 97% (FI 0.6, late-season low water), d100 = 40, narrated | 76 | 74 | 0 | 77% | 1,200 |
| 3:20 | Olympus Guard Station | Ranger present? (30% late-Sept Saturday), d100 = 77: no | 72 | 72 | 6 | 76% | 950 |
| **4:03** | **Lewis Meadow** | **Fork card (below)** | 70 | 72 | 9 | 76% | 950 |

Leg TH to Lewis Meadow: 5.14 h x 1.03 = 5.29 h. Energy: 92 - 64 drain + 42 (850 kcal of auto-snacks, within the day-1 allowance of 900) = 70.

**The Fork card at Lewis Meadow, 4:03 PM** (forced: projected arrival is past trail-dark minus 60 min):

```
╔══════════════════════════════════════════════════════╗
║ [EGA scene: Lewis Meadow, grey sky, the trail rising] ║
╠══════════════════════════════════════════════════════╣
║ The light is going pewter. Glacier Meadows is still  ║
║ 7 miles and 3,650 feet above you, and your pack holds ║
║ a fleece, two bars and a bag of trail mix.           ║
║                                                      ║
║ ▸ Push on to Glacier Meadows                         ║
║   ETA about 12:15 AM (11:30-1:00), 5 h after dark    ║
║   Back to the car on your own 75% (nearly all in     ║
║   serious trouble) · Rangers help you 25%            ║
║ ▸ Hike to Elk Lake instead (not your permit)         ║
║   ETA 8:15 PM · Own way out 90% · Rangers 10%        ║
║ ▸ Spend the night here (not your permit)             ║
║   Trouble 85% · Serious 10% · Rangers 5%             ║
║ ▸ Turn back to the car                               ║
║   ETA 10:05 PM by phone light · Home Early, safe     ║
╠══════════════════════════════════════════════════════╣
║ Joy 23 of 160          Day 1  4:03 PM       Ranger ▸ ║
╚══════════════════════════════════════════════════════╝
```

The ETA math for "Push on": the remaining base is 6.13 h x 1.03 = 6.31 h. 3.17 h of it fits before trail-dark; the other 3.14 h runs at x1.6 (phone light), which is 5.02 h. 4:03 + 3.17 + 5.02 is about **12:15 AM**. The outcome bars come from the 200-run look-ahead (9.4), rounded to 5%.

**The player pushes on:**

| Clock | Where | Beat / roll | E | Warmth | Wet | Phone | Food |
|---|---|---|---|---|---|---|---|
| 5:30 | High Hoh Bridge | Landmark (one tap): the gorge in amber light, joy +5 | 60 | 74 | 13 | 75% | 950 |
| 7:13 | below Martin Creek | Trail-dark. Narrated: "You thumb on the phone's light." | 41 | 76 | 22 | 75% | 950 |
| 8:15 | Elk Lake | Crisis-lite card (E < 30 after the climb): "Eat extra?" Eats trail mix (450 kcal, +22) | 25 then 47 | 77 | 26 | 63% | 500 |
| 9:00 | above Elk Lake | Steady rain begins: wet +22/h x (1 - 0.29) | 44 | 79 | 26 | 54% | 500 |
| 10:40 | the avalanche chutes | **Footing check**: base 90, phone light -20, wet rock -5, tired (E 28) -10, skill +2 = **57%**. d100 = 41: Success | 28 | 78 | 58 | 34% | 500 |
| 12:05 | the ladder washout | **Ladder** (8.2): base 90, phone light -20, wet rungs -5, tired (E 21) -10, skill +2 = **57%** (57 clean / 22 shaky / 21 fall). d100 = 68: **Shaky**: "a foot slips; the rope saves you." Spirits -4, +10 min | 21 | 78 | 73 | 17% | 500 |
| 12:25 AM | Glacier Meadows | Arrival in the dark and rain | 18 | 77 | 74 | 15% | 500 |

Warmth stays high because climbing produces heat. With an insulation of 2 x 0.33 + 10 x 0.70 + 3, about 10.7, in 40 °F rain: M = 36 + 10.7 + 30 - 65 = 11.7, so the target is 82. **The danger starts when the walking stops.**

**Night card at Glacier Meadows, 12:25 AM.** The night forecast low for the camp node is 35 °F.

| Choice | Effect on the night (7.6) | Shown to the player |
|---|---|---|
| Wrap in the space blanket under the biggest tree | T_sys = 65 - (0 - 12 + 4.5 + 2.1 + 6 + 2) = 62.4. Margin about -27. Hypothermia 23% | "Get through the night without dangerous shivering: 77%" |
| Look for other campers' lights | presence 55% (late-Sept Saturday), d100 = 22: **a tent glows blue through the trees** | then "Ask for help": base 70, d100 = 35: **Success**. They lend a spare puffy and make cocoa: +14 |
| Walk laps all night | warmth holds while E > 15, then a bonk around 2:30 AM | look-ahead: "probably worse" |
| Eat both bars now | E +25; food 0 | deterministic |

With the borrowed puffy and cocoa: T_sys = 65 - 16.6 = 48.4. The actual low (drawn) is 34.6 °F, so **margin = -13.8**. Hypothermia roll p = 1.5 x 1.8 = 3% (shown as "97% you'll be okay"), d100 = 58: no hypothermia. Sleep quality Q = 1 - 13.8/25 = 0.45.

Dawn state:
- kcalDeficit about 2,100, so energyMax = 86.
- Morning ceiling = 86 - 30 x (1 - 0.45) = 69.
- E = min(69, 43 + 20 + 27) = **69**.
- Dawn warmth = 70 + 2 x (-13.8) = **42** (Cool, barely).
- Spirits **36** (Grumpy).

**Sunday.** RAIN. `dayPace` = 1.05.

| Clock | Where | Beat / roll | E | Warmth | Wet |
|---|---|---|---|---|---|
| 7:30 | Glacier Meadows | Chain step from the strangers (80%, d100 = 15): "They press oatmeal and a bag of jerky on you." +500 kcal of trail food | 69 | 42 | 74 |
| 7:40 | | Morning card: hike out (ETA 5:20 PM; look-ahead: own way out 90%, rangers 10%) or wait for help. Hikes out | 69 | 50 | 74 |
| 8:10 | the ladder, descending | Ladder down: base 90, wet -5, cold hands (warmth below 40? no, 52) 0, skill +2 = **87%**. d100 = 12: Success | 66 | 70 | 76 |
| 1:00 | Lewis Meadow | Narrated. Auto-snacks the gifted food | 45 | 72 | 85 |
| 3:40 | near Five Mile Island | **Crisis: Bonked** (E below 15): "Your legs feel like wet bread." Ask passing day hikers (Sunday, lower Hoh: someone passes 90%/h): base 70, d100 = 51: Success. Two granola bars, +24 | 12 then 36 | 66 | 86 |
| 6:05 | Hoh TH | Out, 1 h 05 min before trail-dark | 14 | 68 | 86 |

**Ending:** rung 3 (Serious: bonked far from the car, after a cold night) but out on their own legs. The title is *"A Soggy Story: Made It Back, Barely"*. Joy 41 of 160 (the low spirits multiplier hurts), LNT 90 (no canister, -10).

**Field Notes** (excerpt):

> *The night was cold because:* no sleeping bag (-35 °F of comfort), no pad (-12 °F), a fleece soaked by the evening rain (-3 °F). Kind neighbors (+14 °F) made the difference.
> *You ran out of legs because:* 1,800 kcal for two days that burned about 7,400.
> *You arrived after midnight because:* a 10:45 start for 17.4 miles in late September, when the Hoh goes dark by 7:15.
> *A gentler plan:* the classic 3 to 5 nights (Lewis Meadow, Glacier Meadows, Five Mile Island), a 30 °F bag, a pad, a canister and rain pants. The engine estimates that plan finishes happily about 95% of the time.

### 12.3 Monte Carlo of the same situation (scratch tuning calculator, 20,000 runs per row)

| Policy at the Lewis Meadow fork (day-hike gear) | Happy | Uncomfortable / Trouble | Serious, walked out | Rescue | Death (Sierra mode) |
|---|---|---|---|---|---|
| Push on to Glacier Meadows (Storybook) | 0% | 0% | 76% | 24% | — |
| Push on to Glacier Meadows (Sierra) | 0% | 0% | 75% | 21% | **4%** |
| Hike to Elk Lake (off-permit) | 0% | 0% | 90% | 10% | — |
| Bivouac at Lewis Meadow (off-permit) | 0% | 87% | 9% | 5% | — |
| Turn back to the car | 100% Home Early (safe) | | | | |
| *Same 1-night push with real overnight gear* (30 °F bag, pad, tent, rain gear, headlamp, 5,200 kcal) | 50% | 30% / 9% | 9% | 2% | — |

So the design target "day-hike gear to Olympus in one night ends in trouble most of the time" holds: **100% trouble or worse, about 1 in 4 rescued in Storybook, about 4% death in Sierra mode**. The same overnight with proper gear becomes a hard but fair push. The gap between those two rows is the whole lesson of the game, and it comes entirely from the pack.

---

## 13. Worked example B: Seven Lakes Basin / High Divide, 3 nights, August (well planned)

### 13.1 The plan

| Item | Value |
|---|---|
| Itinerary | Night 1 Sol Duc Park (7.1 mi, +2,470). Night 2 Lunch Lake via Heart Lake and the High Divide (3.8 mi, +1,130 / -870). Night 3 layover at Lunch Lake (day hike to Bogachiel Peak, 3.6 mi round trip, +1,030). Day 4 out via Deer Lake (7.8 mi, +830 / -3,300). Thu Aug 12 to Sun Aug 15 |
| Permits | Sol Duc Park 1 night, Lunch Lake 2 nights (Seven Lakes quota area; reserved in the planner) |
| Hiker | Regular fitness, 165 lb, skills all 1 (navigation 2) |
| Pack | Weekender 50: borrowed standard canister (WIC loan roll, midweek 95%, d100 = 12: available), 30 °F down bag, trekking-pole tent, R3.5 inflatable pad, down puffy, rain jacket + rain pants, dry camp clothes, stove + 100 g fuel, filter, first aid, blister kit, sun kit, bug kit, map + compass, headlamp, trowel, sketchbook, camp chair, camera, 2 x 1 L bottles, a stuff-sack summit pack |
| Fit | inside 39.8 L of 50 (80%, Roomy). Canister holds 3 days of food (6.0 L) + smellables (0.6 L) = 6.6 of 9.8 L usable. Day-1 lunch rides outside it |
| Weight | 29.4 lb; comfortLb = min(32, 41) = 32, so r = 0.92 (Comfortable). Day 2 with 1 extra liter for the dry crest: r = 0.93 |
| Food | 3,000 kcal/day, three different dinners (no food fatigue) |
| Gaps vs. `sensibleKit[HIGH][Aug]` | none |

Forecast at planning: Thu "Morning clouds, then sun" (PoP 10). Fri "Sunny, slight chance of afternoon thunderstorms" (20). Sat "Sunny" (5). Sun "Increasing clouds, showers possible" (40). Actual (seed 77120): Thu FOG then PCL; Fri PCL with TSTM 2 to 3 PM; Sat CLR; Sun SHW. Daylight Aug 12: sunrise 6:07, sunset 8:34 PM, civil dusk 9:08.

### 13.2 Beats and rolls

| Day / clock | Beat | Roll | Result |
|---|---|---|---|
| D1 8:30 | Departure (FOG: wet brush). Rain pants on by default, since you have them | — | wet +1 instead of +8 |
| D1 9:00 | Sol Duc Falls (landmark): slick rock, routine 97% | d100 = 30 | narrated, joy +5 |
| D1 10:15 | Discovery: an American dipper bobbing on a rock. Sketch (10 min) or go on? Sketch | — | Journal +1, joy +4 |
| D1 11:45 | Lunch at Appleton junction (one tap) | — | E +30 |
| D1 2:30 | Arrive Sol Duc Park (5.38 h + stops). Camp card: mosquitoes (tail of the season), `bug` present | — | spirits unaffected |
| D1 7:30 | Evening: walk up to Heart Lake for golden hour (1 mi, day pack) or rest? Walk | — | joy +6, back 9:00 PM by headlamp on maintained trail |
| D1 night | T_night 43 °F (cold-pool basin). T_sys = 65 - (35 + 3 + 12.6 + 5 + 4) = 5 °F. Margin +38. Bear visit roll 10% | d100 = 63 | Q = 1; slept like a marmot (+5) |
| D2 8:45 | Departure card: "Thunder possible this afternoon. Early start to clear the Divide by noon?" Early start | — | on the crest 9:50 to 11:10 |
| D2 10:00 | Landmark: Mount Olympus across the Hoh from the High Divide. Sketch? | — | joy +10, sketch +4 |
| D2 10:20 | Joy: a marmot whistles from a boulder | — | joy +5 |
| D2 11:10 | Mirror Lake way trail (`route_finding`): **navigation** base 75, map + compass +15, skill +4 = **94%** | d100 = 77 | success |
| D2 11:40 | Scree down to Lunch Lake: footing base 88, poles +5, skill +2 = **95%** (routine, narrated) | d100 = 30 | success |
| D2 2:10 | **Thunder walks along the Divide** (TSTM overlay). In camp: "Wait it out in the tent with your sketchbook" (no roll needed; it's the safe choice) | — | joy +3, rain 1 h, no wetting (in tent) |
| D2 night | Margin +33. Bear visit roll | d100 = 07 | **Visitor!** Morning: big paw prints 30 ft from the canister, lid shut. Joy +5 (story), no loss |
| D3 (layover) 9:00 | Layover card: swim in Lunch Lake (+6), sketch (+4), read in the camp chair (+6). Then: **Bogachiel Peak for sunset?** | — | yes |
| D3 6:00 PM | Up the way trail with the summit pack (r 0.3): 1.7 h | — | summit 7:45 PM |
| D3 8:31 | **Sunset on Bogachiel Peak.** Snow patches linger on the north side (s = 0.09). Golden Glow eligibility: high point, clear evening, stayed past sunset, sketchbook | discovery roll 25%: d100 = 14 | **The Golden Glow** card: *Sketch it* (+30, Journal page) / *Pick it to take home* (LNT -10, "wilted in a jar") / *Photograph it* (+18). Sketches it |
| D3 9:10 | Down in the dark (headlamp): navigation 75 + 15 + 4 - 10 = **84%** | d100 = 55 | success |
| D3 9:30 | Scree in the dark: footing 88 + 5 + 2 - 10 = **85%** (85 / 7.5 / 7.5) | d100 = 88 | **Shaky**: "your boot skates; you sit down hard." Spirits -4 |
| D4 8:30 | SHW. Rain gear on: P = 0.85, wet +2/h only | — | |
| D4 11:30 | Stone staircase below Deer Lake: footing 88 + 5 + 2 - 5 (wet rock) = **90%**. Knee strain check skipped (`poles`) | d100 = 33 | success |
| D4 1:30 PM | Sol Duc TH. The fictional diner on US-101: pie, joy +4 | — | |

**Ending:** *"A Golden Trip"*. Joy **171 of 230**, LNT 100, Journal +5 pages (dipper, Olympus from the Divide, marmot, bear prints, the Golden Glow). Field Notes are short: "You were ready for everything the mountain asked."

### 13.3 Monte Carlo (scratch calculator, 20,000 runs, random August weather from the HIGH-zone chain)

| Kit | Happy finish | Finished but grumpy | Serious | Mean joy (calculator scale) |
|---|---|---|---|---|
| Sensible (as above) | **98.3%** | 1.3% | 0.4% | 39 |
| Skimpy (no poles, no rain pants, no map, no puffy, no sketchbook) | 91.8% | 7.3% | 0.9% | 33 |

August in the Olympic high country is forgiving. That's right for the user's "as fun and easy as backpacking", and it means the skimpy kit mostly costs **joy**, not safety. The same comparison in late September (cold nights, more rain) should open a much bigger gap, and the harness (15) will check it.

---

## 14. Worked example C: South Coast, misread tide

### 14.1 The plan and the misread

| Item | Value |
|---|---|
| Itinerary | Third Beach TH to Toleak Point, 2 nights (layover at Toleak), out the same way. Sat Jul 17 to Mon Jul 19 |
| Restricted stretches (from the NPS South Coast Route page) | Taylor Point to Scotts Bluff beach: passable below **4.5 ft**. Scott Creek to Strawberry Point: passable below **4.0 ft**. (Diamond Rock, 2.0 ft, is further south and not on this trip) |
| Overland trails | Taylor Point (rope ladders), Scotts Bluff (short). No overland route on the Scott Creek to Strawberry Point stretch (`overland: null`, to confirm in the coast data file) |
| Hiker | Regular, `coast` skill 1 (novice: the HUD shows raw tide heights but **does not** compute windows) |
| Pack | Weekender 50, standard canister (raccoons!), down bag inside **with a pack cover but no liner**, foam pad strapped on the bottom (`outsideBulky:1`), poles, tide table, phone |
| WIC | skipped (they own a canister and printed their own permit), so no ranger plan review |

**The tide table (La Push, the player's printed booklet):**

| Day | Low | High | Low | High |
|---|---|---|---|---|
| **Sat Jul 17** | 3:20 AM -0.7 ft | 9:30 AM 6.0 ft | **3:41 PM 2.9 ft** | 9:54 PM 8.6 ft |
| Sun Jul 18 | 4:05 AM -0.9 ft | 10:15 AM 5.9 ft | **4:31 PM 3.0 ft** | 10:40 PM 8.5 ft |

**The misread:** planning on Saturday, the player read Sunday's row. They planned to "round Strawberry Point around 5:00 to 5:30 PM, an hour after the 4:31 low". The game did not stop them. **Misreading is a player action, not a die roll.** The look-ahead Trip Outlook said *"Tide timing is tight on day 1"*, but in words only, because a novice planner doesn't get the computed windows.

### 14.2 The day

Start 1:30 PM after lunch in Forks. Segment times use the 5.1 formulas with r = 1.0.

| Clock | Where | Tide h (h_eff = h + 0.5 calm run-up) | Beat / roll |
|---|---|---|---|
| 1:30 | Third Beach TH | 3.8 falling | Departure |
| 2:09 | Third Beach | 3.3 falling | Joy: sea stacks in haze |
| 2:30 to 3:32 | Taylor Point overland | — | Rope ladders: footing base 90, foam pad outside -3, skill +2 = **89%**, d100 = 23: Success |
| 3:32 | Taylor Point to Scotts Bluff beach (needs h_eff < 4.5) | 2.90 (h_eff 3.4) | margin m = +1.1, **auto-pass** (narrated) |
| 4:29 | Scott Creek | 3.1, rising | Discovery: tide pools. "Sketch the anemones (25 min)?" The misread makes it feel like there's time. Sketches: joy +4 |
| 4:54 | Scott Creek mouth | 3.4 | Creek ford: FI = 0.8 + 0.25 x (3.4 - 3) = 0.9, routine, narrated |
| **5:24** | **north end of Strawberry Point** | **3.91 rising (h_eff 4.41)** | **Headland card (below)** |

Tide at 5:24 PM by cosine interpolation between the 3:41 PM low (2.9) and the 9:54 PM high (8.6): f = 103/373 = 0.276, h = 2.9 + 5.7 x (1 - cos(π x 0.276))/2 = **3.91 ft**, and h_eff = 4.41. The margin is **m = 4.0 - 4.41 = -0.41 ft**, rising.

The HUD always shows the run-up next to the table height, so the player isn't fooled by "3.9 is below 4.0".

**Headland check formula** (the function behind section 4.8's headland rule):

```
base(m) = 85 + 10m            if m ≥ 0      (cap 95; m ≥ 1 auto-pass)
        = 85 + 55m            if -1 ≤ m < 0
        = 30 + 20(m + 1)      if m < -1     (floor 5)
rising tide -10, falling tide +5
```

So base = 85 + 55 x (-0.41) = 62.5, and rising -10 gives 52.5. Mods: poles +3, foam pad outside -3, coast skill +2, wet rock (spray) -5. **p = 49%.**

```
╔══════════════════════════════════════════════════════╗
║ [EGA scene: Strawberry Point, surf foaming at its     ║
║  toe, the sun low over the sea stacks]                ║
╠══════════════════════════════════════════════════════╣
║ The rocks at the point are wet to your knees between  ║
║ the waves, and each set reaches a little further.     ║
║ Tide 3.9 ft + waves 0.5 = 4.4 ft, rising.             ║
║ Passable below 4.0 ft.                                ║
║                                                       ║
║ ▸ Go now, between the waves                    49% ▸ ║
║   ██████████▒▒▒▒▒░░░░░                                ║
║   49 clean · 25 soaked · 26 knocked down              ║
║ ▸ Wait for the sea to fall                            ║
║   Passable again 1:10-7:45 AM (daylight from 5:00)    ║
║   Camp at Scott Creek tonight (not your permit)       ║
║ ▸ Go back to Scott Creek and decide there             ║
╠══════════════════════════════════════════════════════╣
║ Joy 38 of 120        Day 1  5:24 PM       Tide ▸      ║
╚══════════════════════════════════════════════════════╝
```

**Every option, honestly:**

| Option | Outcome distribution | What it costs |
|---|---|---|
| Go now | **49%** clean. **25%** shaky: soaked to the thighs, pack bottom dunked; with no liner, each inside item has a 60% chance of going damp. **26%** knocked down, then the fail table: 55% soaked + pack wet; 25% an outside item swept away (the foam pad); 15% mild sprain; 5% moderate sprain (Serious: injured between headlands on a rising tide, so a crisis card offers "climb above the drift logs and wait" or SOS) | about 1.3% Serious, about 0.4% rescue (Coast Guard helicopter in Storybook). **Sierra:** no death roll at m = -0.41; but every 15 minutes of dithering raises h, and once m < -1 a failed attempt carries a 25% death roll |
| Wait (camp at Scott Creek) | 100% safe | off-permit with a "tidal delay": LNT -2, and the narrator notes rangers understand. You lose the Toleak sunset, but Scott Creek has its own (+6). Strawberry Point at 5:30 AM tomorrow (h about -0.4) |
| Go back and decide | same as Wait, plus the walk | — |

**What the player did:** "Go now". d100 = 63, **Shaky**: "A wave slaps the rock and climbs your legs to the hip; the bottom of your pack goes under for a heartbeat."

Effects: wet = 55, feet wet. The dunk rolls for each inside item (60%, no liner): sleeping bag d100 = 41, **damp** (bagWet 0.3); camp clothes d100 = 77, dry; puffy not carried (July).

**The chain plays out:**
- **Evening at Toleak (6:35 PM).** Dry camp clothes on. Body wet resets to 0; the bag stays damp.
- **Night.** Coast low 51 °F. T_sys = 65 - (35 x (1 - 0.75 x 0.3) + 0 + 7 + 5 + 4) = 65 - 43.1 = 21.9 °F. Margin **+29**. A clammy but fine night: spirits -3 ("the bag smells of the sea").
- **Day 2 (layover).** Wet boots: feet wear x2. Hot spot card at mile 2 of the tide-pool walk; tapes it with the blister kit. Hangs the bag in the sun 2 h (CLR): dry.
- **Field Notes:** "You read Sunday's tide row on Saturday. Tides come about 50 minutes later each day. On Saturday the afternoon low was 3:41, not 4:31. **If this had been October** (night 40 °F, rain), the damp bag would have made the night margin about -6 °F, and the dunk could have been the start of a real problem. A pack liner (0.2 lb) would have kept the bag dry."

**The good version, for contrast:** reading Saturday's row, the player leaves at 11:45 AM and passes Strawberry Point at about 3:20 PM on the falling tide (h 2.92, h_eff 3.42, m = +0.58). That gives base 85 + 5.8 + 5 (falling), capped at 95, then mods (+3 -3 +2 -5): **93%**. d100 = 35, clean. They get the Toleak sunset. **Tide Reader** badge progress +1.

**What experience changes:** at `coast` skill 2 the HUD auto-computes "You'll reach Strawberry Point about 5:20 PM: 3.9 ft and rising, passable below 4.0". A WIC plan review flags the same thing at planning time. Veterans don't get better dice; they get better information.

---

## 15. Balancing targets and Monte Carlo tuning

### 15.1 Targets

| Archetype | Example | Happy finish | Serious | Rescue | Death (Sierra) |
|---|---|---|---|---|---|
| Sensible plan, in season | Example B; Deer Lake overnight in Aug; Hoh to Glacier Meadows classic (3 to 5 nights) in Aug; Royal Basin 2 nights in Aug | **≥ 95%** | ≤ 1% | ≤ 0.3% | ≤ 0.1% |
| Sensible plan, shoulder season | High Divide in late Sep; Hoh in early Jul (chute snow) | ≥ 85% | ≤ 3% | ≤ 0.5% | ≤ 0.2% |
| Ambitious and equipped | Glacier Meadows in 1 night with real gear; the 18.4-mi High Divide loop as a day hike with headlamp and 3 L | 60 to 85% | ≤ 10% | ≤ 3% | ≤ 1% |
| Skimpy kit, benign season | Example B skimpy | 85 to 95% (costs joy, not safety) | ≤ 2% | ≤ 1% | ≤ 0.3% |
| Under-equipped for the conditions | Example A | ≤ 5% | **trouble or worse ≥ 80%** | 10 to 25% | 2 to 6% |
| Reckless | Blue Glacier without rope or skill; South Coast ignoring tides; fording the Queets in June | ≤ 2% | ≥ 50% | 20 to 40% | 10 to 25% |
| Bail-early policy on any plan | turn back at the first Fork card | 0% happy, about 100% Home Early | ≈ 0% | ≈ 0% | ≈ 0% |

**Global health targets** (across the canonical plan library, played by the Typical bot):

| Metric | Target |
|---|---|
| Storybook rescue rate, all plays | < 3% |
| Meaningful decisions per moving day | 3 to 5 (mean 4) |
| Rolled choices with p between 40 and 85% (the "interesting zone") | ≥ 35% of rolled choices |
| Trips where the player sees at least one "% shown" choice | ≥ 90% |
| Golden Glow eligibility on sensible plans with a high camp and a clear evening | 25 to 40% per trip (rare but findable) |
| Variance in outcome rung explained by plan / trail choices / luck | 70 / 20 / 10 (±10 each), pillar 1 |
| Look-ahead calibration: shown % vs. realized frequency | within ±5 points in every decile |
| Forecast calibration: PoP vs. realized wet days | within ±5 points |

### 15.2 The harness

- **One sim module, two hosts.** The game runs the same pure ES module that Node runs headless: `runTrip(plan, policy, seed) → {rung, joy, lnt, trace}`. There is no DOM in the sim. This also keeps the game easy to test.
- **Bot policies see only what a player sees**: shown %, words, ETAs and look-ahead bars. If bots that use shown information can't hit the targets, the information is insufficient, and that is a UI bug.
  - `Cautious`: always picks the safest option; bails at Trouble.
  - `Typical`: maximizes expected joy minus 3 x P(Serious or worse) from the shown numbers.
  - `Bold`: picks the highest-joy option unless p < 40%.
  - `Random`: a uniform pick.
  - `Daredevil`: always picks the riskiest option (for the Sierra-mode death budget).
- **Plan library:** every `classic_trips` entry in `data/regions/*.json` (48 so far in the Hoh and Sol Duc files) x relevant months x 4 kits (sensible, skimpy, day-gear, overpacked at r ≈ 1.5) x 3 start times. That is about 2,000 cells.
- **Sample sizes:** 10,000 runs per cell gives a standard error of 0.2 points at p = 95%, which is plenty. Full run nightly (about 20 M trips; at about 0.2 ms each, about an hour on a laptop). Each content PR runs a fast subset (1,000 per cell, about 300 key cells).
- **Failure reports** show, for any violated cell, the cards and modifiers that most often appear in the Field Notes of bad outcomes. "Ladder washout produced 41% of Serious outcomes in Hoh/Sep/sensible" points straight at the knob.
- **Item value audit:** for every gear tag, remove it from the sensible kit and measure ΔP(happy) and Δjoy per zone and month. Every item must matter (≥ 1 point of safety or ≥ 3 joy) somewhere. Nothing except the legally required canister should be mandatory everywhere. This is the data that backs "lots of potential outcomes".
- **Variance decomposition** (pillar 1): nested runs (plans → policies → seeds), then a standard random-effects decomposition of the outcome rung and joy.

### 15.3 Tuning knobs (all in one `tuning.json`)

| Group | Knobs (current values) |
|---|---|
| Movement | `vFlat[1..5]` (1.8 to 3.0), `climbRate[1..5]` (900 to 1,900), `BREAKS` 1.12, `CLASS{}`, `M_dark{headlamp 1.35, phone 1.6, none 2.5}`, `dayPace σ` 0.07 |
| Energy and food | drain coefficient 6.0, `kcalPerE` 20, snack cap 300 kcal/h, overnight `20 + 60Q`, morning ceiling `-30(1-Q)`, `energyMax` deficit divisor 150 |
| Warmth and night | activity heat {30, 25, 10, 0}, approach rates 0.35/0.50 per h, bag warmth table, pad term, hypothermia slope 1.5 and threshold -12 |
| Checks | footing base 88 to 92, ford table, headland function, global modifier table (9.3) |
| Director | `quietRatio`, `gapBias`, budgets, tension increments and decay |
| World | stranger presence by popularity, ranger presence by station and month, visitor odds, canister-loan availability |
| Sierra | death rolls per moment (10.3) |

**Order of tuning:**
1. **Physics against reality.** Segment times against trip reports; night temperatures against station normals and lapse rates; tide timing against NOAA.
2. **Event bases against targets.** Automated coordinate descent over a few knobs, with the objective being the squared distance to the target bands. Physics knobs stay locked.
3. **Human playtests for feel.** Does the % feel honest? Do the Field Notes feel fair?
4. **Lock and regress** in CI.

---

## 16. Data contracts (what the sim needs from `design/data/`)

The region files (`hoh_olympus.json`, `sol_duc_high_divide.json`) already give nodes (elevation, type, camp), segments (miles, gain, loss, `trail_class`, `hazards`, `snow_free_typical`), classic trips, hazards with game ideas, wildlife and plants, and rules. The sim additionally needs the following:

| File / field | Shape | Used by |
|---|---|---|
| node `tags` | `canopy:dense/mixed/open`, `cold_pool`, `glacier_adjacent`, `water`, `exposure`, `fire_ok` (below 3,500 ft) | trail-dark, night temps, water, fires |
| node `ranger` | `{months:[], pDay: 0..1}` (e.g. Olympus Guard Station) | help options |
| segment `snowFreeDOY` | `[start, end]` day-of-year (normalized from `snow_free_typical` text), `aspect: N/S/mixed` | snow model |
| segment `brushy`, `waterAlong`, `popularity` | booleans and 0 to 1 | wet brush, water, strangers |
| crossings | `{node, type, baseFt[12], velocity, bridge}` | fords (4.7) |
| coast headlands | `{id, passableBelowFt, overland, impassable, source}` | tides (4.8) |
| `climate.json` | zone x month: refs, P(wet), P(TSTM), state climatology, persistence, freezing level | weather (4.2 to 4.5) |
| `daylight.json` | 1st/15th of each month: dawn, rise, set, dusk | clock |
| `tides/la_push_YYYY.json` | NOAA CO-OPS 9442396 high/low predictions; per-node offsets | tides |
| `gear_catalog.json` | `{id, lb, L, compressible, rigid, slots[], tags[], warmth, wetSens, pTorso, pLegs, sleepF, padR, batteryH, price}` | packing, tags, body models |
| `food_catalog.json` | `{id, kcal, oz, L, yum, prep, waterL, smellable, crushable}` | canister, energy, joy |
| `park_rules.json` | canister rule, fire elevation and bans, quotas, group size | planner, LNT |
| `sensibleKit.json` | zone x month → expected tags | gapBias, the planner checklist, item value audit |
| `events/*.json` | cards (8.2) | engine |

**Build-time lint** (fails the build):
- every gear tag is used by at least 3 cards
- every segment hazard tag has at least 1 card
- every landmark node has a scene
- every rolled choice has bands and a fail table
- every path to rung 3 or higher passes through a foreshadow card or a shown % (static check over card effects)
- every quota camp in the rules exists as a node

---

## 17. Companions (optional named party)

The user mentioned Oregon Trail's named party, and the repo is named "104-boyz". We don't assume who that is, so a party is **an option, not a requirement**.

- **Default: solo**, with the Fox appearing as a storybook cameo (homage, not a party member).
- **Optional party of 1 to 3 companions**, named by the player. Each has `fitness`, `bodyLb`, one **trait**, and the same meters as the hiker (the model already stores meters as arrays). The HUD shows the worst member's word ("Kai: Cold").
- **Shared gear** splits weight: one 3-person tent, one stove, one filter, one first aid kit. **Canisters:** one standard canister per 2 people for 3 nights. Packing shows each person's pack; trade-offs become negotiations ("who carries the chair?").
- **Pace = the slowest member.** Each member rolls their own feet, illness and checks. More people means more help (+5 per helper on checks, huddle +4 at night, send for help) but also more things that can go wrong.

| Trait | Effect |
|---|---|
| Botanist | +50% discovery cards; Journal entries +1 |
| Strong legs | carries +5 lb of shared gear without a load penalty |
| Camp cook | dinner joy +3; hot drinks cost less fuel |
| Navigator | navigation +5 |
| Worrier | foreshadowing arrives one beat earlier; spirits -2/h in storms |
| Night owl | night multiplier x0.9 |
| Early bird | default departure 1 h earlier |

- **Party decisions:** when a member's spirits drop below 20, they ask to turn back. This is the Oregon Trail moment, and it is a real choice with a shown %.

**Recommendation:** build the sim for N hikers from day one (it costs little in a data-driven engine). Ship v1 solo, and add companions in v1.1 once the event text supports names and variants.

---

## 18. Open questions and recommendations

| Question | Recommendation |
|---|---|
| How harsh is the worst case? | **Storybook (no deaths) as default**; Sierra mode (deaths at flagged moments, Restore from the last camp) as a title-screen option |
| % on all decisions or only critical ones? | **All rolled decisions show a %**; critical ones add the three-band bar and fail table; no % on unrolled choices; optional Words-only mode |
| Realistic or stylized illness timing? | Both: an in-trip "trail bug" (36 to 96 h) and a realistic giardia **epilogue** (7 to 14 days), each labeled honestly |
| Allow rule-breaking (no canister, off-permit, fires)? | Allow it, with gentle ranger cards, LNT costs and wildlife consequences. It's a sim that teaches; blocking would hide the lesson |
| Fire bans | Per-trip draw with P(ban) by month (for example Aug 0.6, Sep 0.5), shown on the ranger board; fires above 3,500 ft are always illegal |
| Tides | Ship real NOAA predictions for the current year plus 2; fall back to a harmonic approximation for other years |
| Determinism across devices | Integer state; precomputed cosine and daylight tables; a seeded PRNG with no `Math.random`, so shared seeds replay identically on any iPhone |
| Look-ahead cost on old phones | 200 runs within 30 ms on an iPhone 11-class device; fall back to 100 runs and coarser rounding (10%) |
| Telemetry | None (offline, private). Tuning relies on the harness and playtests |
| Real-park accuracy vs. fun | Physics calibrated to reality first; fun tuned only in event bases and the Director, so the park stays honest |

**What I'd ask the user to decide:**
1. Confirm Storybook (no deaths) as the default, with Sierra mode optional.
2. Numbers or words by default on the % display (recommendation: numbers).
3. Solo v1 with companions later, or a named party from the start?
4. Should breaking park rules (no canister, off-permit camping) be allowed with consequences, or blocked at the planner?
5. How long a trip session should be on the phone (the target here is 4 to 6 minutes per trail day).

---

## References used in this proposal

- Region data in this repo: `design/data/regions/hoh_olympus.json` and `sol_duc_high_divide.json` (segment miles, gain and loss, trail classes, hazards, quota camps, the canister rule for every overnight, fires above 3,500 ft, the 2026 Stage 2 ban). `coast.json` was still being written when this proposal was finished; its headland thresholds should replace the values in 4.8 and example C.
- South Coast tide limits (Taylor Point to Scotts Bluff 4.5 ft, Scott Creek to Strawberry Point 4.0 ft, Diamond Rock 2.0 ft): [NPS, South Coast Route](https://www.nps.gov/olym/planyourvisit/south-coast-route.htm).
- Daylight: the NOAA sunrise equation, computed for 47.9°N, 123.9°W with Pacific time and DST.
- Wind chill: the NWS 2001 wind chill formula.
- Tide predictions: NOAA CO-OPS station 9442396 (La Push) high/low predictions, to be pulled into `data/tides/` at build time.
- Movement: Naismith's rule, adapted to backpacking (2.4 mph + 1,300 ft/h for a Regular hiker at comfort load), with Langmuir-style descent handling.
