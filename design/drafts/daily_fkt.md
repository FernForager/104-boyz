# Modes, Hike of the Day, FKTs and leaderboards

*Draft for the creator, written 2026-10-08 for the new direction. It follows decisions 21 to 34 in `design/PENDING_DECISIONS.md`, which override `GAME_DESIGN.md` wherever they disagree. Nothing here is decided until you say so. The calls you need to make are collected in [section 8](#8-decisions-for-you).*

*Every in-game word in this file (button labels, share text, ranger lines, wireframe text) is a **draft placeholder** for you to rewrite (decision 21). Short ones are marked [draft]; every wireframe and mockup is a draft as a whole. The Boyz appear only as `{BOY_n}`, and Jon only by his first name.*

---

## The short version

- **Three ways to play, one cabin.** **Open** is your career hiker: plan any hike, Old School, full wipe. **Hike of the Day** and **FKTs** each use a fresh standard hiker, so they are fair, and a death there never touches your Open hiker (decision 25).
- **Hike of the Day.** One route, one date, one real forecast and one set of dice for everyone. One shot. The score is your time, alive (decision 24). It opens at 5:00 am Pacific and runs 24 hours.
- **Today's real weather.** At 3:23 am Pacific a GitHub Actions job reads the National Weather Service gridpoint forecast for that day's route, turns it into game weather, test-plays the day with bots, and publishes one file that never changes. If NWS or GitHub fails, everyone gets the same climatology day instead.
- **The route library** grows with the build. M1a has only the loop. M1b adds the Sol Duc side and Lake Crescent. Winter needs low trails: Lake Crescent now, Lake Quinault's own backyard trails next (the cabin's neighborhood), the coast in M4.
- **FKTs.** Each big route, each direction, in the three real styles (unsupported, self-supported, supported). A weekly window with fixed conditions, as many tries as you like, ghosts of your best. Running is a pace choice, with fuel, water, bonks, rolled ankles and headlamp starts. Your Open hiker can place a stash for a self-supported run, within 24 hours, which is the real rule.
- **Leaderboards in four steps.** Your phone, then a share card, then crew links that the receiving phone checks by replaying them (no server), then a world board on Cloudflare's free tier, with every time re-run by the engine in GitHub Actions before it counts.
- **What it asks of the engine:** an integer-second clock, a complete action log, fixed-tick minigames, and every result pinned to the exact rules that made it.

---

## Contents

1. [Three ways to play](#1-three-ways-to-play)
2. [Hike of the Day](#2-hike-of-the-day)
3. [Today's real weather](#3-todays-real-weather)
4. [FKTs](#4-fkts)
5. [Leaderboards, in steps](#5-leaderboards-in-steps)
6. [Determinism: what this asks of the engine](#6-determinism-what-this-asks-of-the-engine)
7. [What ships when](#7-what-ships-when)
8. [Decisions for you](#8-decisions-for-you)
9. [Facts checked](#9-facts-checked)

---

## 1. Three ways to play

### 1.1 How they relate

| | **Open** | **Hike of the Day** | **FKT** |
|---|---|---|---|
| Hiker | Your career hiker | A fresh standard hiker | A fresh standard runner |
| A death | Full wipe | DNF; resets the streak | DNF; the attempt ends |
| Tries | One trip at a time | One shot a day | Unlimited in the week's window |
| Weather | Seeded per trip | Today's real NWS forecast | The window's, fixed for the week |
| Score | The trip report | Your time, alive | Elapsed time, by style |
| Board | Trail Register | The day's board | The route's board |

**Open is the heart of the game.** It is everything `GAME_DESIGN.md` describes, minus the book frame (decision 22): plan any hike, shop, pack, drive, hike, and live with what happens. Its hiker grows skills from trip to trip and dies for good.

**Hike of the Day is the habit.** Ten to twenty minutes, once a day, the same for everyone. It is the thing a hiker opens on the bus, compares in the group chat, and plays again tomorrow.

**FKTs are the obsession.** A trail runner's game inside the hiker's game: one route, a stopwatch, the best line, the best fuel plan, the best gamble on the descent, then again.

### 1.2 What "standard" means

A timed mode is fair only if every player starts from the same place. So in Hike of the Day and in an FKT attempt, everything but your choices is fixed:

- **The hiker:** beginner's skills (level 1 in each, glacier 0), 165 lb, a fixed fitness (Regular for the daily; see 4.11 for the runner), and an empty profile, so no card is skipped for novelty and everyone's Director deals from the same deck.
- **The closet:** a standard closet, the same for everyone, plus whatever you buy at the three stores today. If the stores draft gives Open a wallet, the daily gets one fixed wallet too.
- **The route, the date and the permit:** set by the day (or the window).
- **The weather, the dice and "today's legs":** keyed to the day's seed, so the same choice in the same place gives everyone the same result.
- **The rules:** every attempt records the exact engine and data it ran on (6.4).

Your Open hiker's skills, region memory and *Like last time* never reach a timed mode, and a timed mode never writes to your Open hiker. The only bridge is one you build on purpose: a stash for a self-supported FKT (4.5).

### 1.3 What carries over, and what never does

| From | To | What |
|---|---|---|
| Open | FKT | A stash your Open hiker placed in the last 24 game hours (4.5) |
| Daily or FKT | Open | *Plan this in Open* [draft]: the route, prefilled |
| Any mode | The device | Settings, the Trail Register, your handle, your records |
| Daily or FKT | Open hiker | Nothing, ever (decision 25) |

### 1.4 Where they live at the cabin

The cabin draft owns the hub. These are hooks it can use, nothing more:

- **Hike of the Day:** a clipboard on the screen door, with today's route card pinned to it, and the weather radio on the counter reading the real forecast. The result goes back on the clipboard when you return.
- **FKTs:** a chalkboard on the shed wall, a row per route, your best times chalked in.
- **Open:** the porch and the door, as the hub draft has it.
- **The reward:** the hub draft decides when the tub is lit. This draft only raises the flag: `result.bigHike` is true after any overnight, any daily of 12 miles or 3,000 ft or more, and any finished FKT.
- **A free extra:** the same morning job can fetch the real forecast for Lake Quinault, so the cabin's weather matches the real sky over the lake (3.1).

---

## 2. Hike of the Day

### 2.1 The rules

1. **One route, one date, one set of dice.** The route, the direction, the camp, the start window, the forecast, the actual weather, every roll and today's legs are the same for every player (6.1).
2. **One shot** (decision 24). Starting the daily commits you to it. Closing the app mid-trail resumes the same attempt, never a fresh one; the save written at each confirming tap already holds its outcome, exactly as in Open.
3. **The score is the time, alive.** A finish posts a time. A death is a DNF.
4. **A death never touches your Open hiker** (decision 25). It plays the death sequence, then you are back at the cabin with your career exactly as you left it.
5. **Coming home is never punished.** Turning back or being rescued posts no time, but it keeps your streak (2.8). The game must never teach anyone to hesitate before turning around or calling for help (`GAME_DESIGN.md` 9.2).

### 2.2 When a day opens and closes

A daily opens at **5:00 am Pacific** and closes 24 hours later. The Pacific date names it, everywhere in the world.

- **Why 5:00 am, not midnight.** NWS Seattle issued its routine forecast package at 2:37 am Pacific on every day we checked (Oct 4-8, 2026); the job reads whatever is newest. The job reads it at 3:23 am, has two retries before 4:30, and the file is live well before 5:00. Night owls who play before 5:00 am are still on yesterday's hike.
- **Started is pinned.** An attempt belongs to the day it started on. Start at 4:55 am, finish at 5:20, and it counts for the day you started, up to two hours past close.
- **Missed days** can be played afterward as practice: no streak, no board.
- **Time zones.** A player in London sees the day open at 1:00 pm, in New York at 8:00 am. That is the price of one world board on one real forecast. (Section 8 offers midnight Pacific instead.)

### 2.3 The flow

```
 THE CABIN · the clipboard
  Hike of the Day #212
  Thu May 6, 2027
  Deer Lake · out and back
  7.4 mi · +1,950 ft
  NWS: showers, 41-55 °F
  One shot.          [Go]
    ▼
 THE TRIP CARD
  day hike: a day-use line
  overnight: today's permit,
  stamped, same for everyone
  start between 6:00 and 10:00
    ▼
 PORT ANGELES · three stores
  the standard closet + today
    ▼
 THE FLAT LAY        [share]
    ▼
 THE DRIVE · one page
    ▼
 TRAILHEAD · last look
  Start walking ▶ clock starts
    ▼
 THE TRAIL · splits at named
  junctions · par shown
    ▼
 THE CAR ▶ clock stops
  or the death sequence: DNF
    ▼
 TRIP REPORT · share card
    ▼
 BACK AT THE CABIN
```

*(Every label above is a draft.)*

**The flat lay is part of the daily.** It is the same signature screen as in Open (decision 26), and it can be shared before you start. After you finish, your crew's flat lays for the day are one tap away, which is half the fun: who packed the cheese.

**The drive is one page** in the daily. The clock does not run until *Start walking*, so the drive costs nothing but a page; its job is the mood.

**Overnight permits** carry the day's number after the 104, so everyone's permit reads the same, like a race bib: `Permit No. 104-0212` [draft]. Daily permits never move the Open counter.

### 2.4 What the clock counts

- **Day hikes:** elapsed time from *Start walking* to the car, to the second. Breaks, waits and side trips all count. A sure choice that costs time (waiting out the fog) costs time, which is exactly the trade the daily is about.
- **Overnights: trail time.** The clock runs on the trail and stops in camp, from *Make camp* until you start walking in the morning. You must spend the night at the permitted camp, and the morning's *Start walking* opens one hour before first light. So the night is off the clock, but what you did with it is not: a cold, ultralight night slows tomorrow's legs, and a hot dinner and a warm bag pay you back in the morning.
- **The start window.** Each daily gives a window (6:00 to 10:00 am on a day hike, say). Choosing the hour is a real decision: early to beat the afternoon thunder on the crest, later to let the frost come off the stone staircase.
- **Seconds, honestly.** The engine keeps an integer-second clock in timed modes (6.1), so two players a minute apart are a minute apart.

### 2.5 The route library

**What a daily route needs:** a trailhead the drive can reach on that date, a route on the graph, season and snow windows, an overnight camp if it is a weekend, and weather anchors (3.3). The library is data: `content/daily/library.json`, built from each region's `classic_trips` plus a few graph routes, each tagged with its slot.

**M1a: the loop only.** The slice has the High Divide loop and its stem, so the first library is:

| Route | Mi · gain ft | Kind | Season |
|---|---|---|---|
| Sol Duc Falls | 1.6 · 260 | Day | Road open |
| Deer Lake | 7.4 · 1,950 | Day | Jul-Oct |
| Lunch Lake and back | 15.6 · 4,130 | Day | Mid-Jul-Sep |
| Bogachiel Peak via Deer Lake | 16.2 · 4,320 | Day | Late Jul-Sep |
| The loop in a day, ↺ or ↻, crest | 18.4 · 4,400 | Day | Late Jul-late Sep |
| The loop in a day, basin | 18.7 · 4,420 | Day | Late Jul-late Sep |
| Deer Lake overnight | 7.4 · 1,950 | 1 night | Jul-early Oct |
| Lunch Lake overnight | 15.6 · 4,130 | 1 night | Mid-Jul-Sep |
| The loop, 1 night (the ranger's fills, B.1) | 18.4-18.7 | 1 night | Late Jul-Sep |

That carries a summer, but not a winter: the High Divide is snowbound from about November into June, and `park_rules.json` says v1 plans no trips in the High zone outside June to October. **So the daily cannot launch with M1a alone outside the summer.** If M1a lands in winter, the daily waits for the low trails below.

**M1b: the whole Sol Duc side and Lake Crescent.** Every trip here is a `classic_trips` entry in `sol_duc_high_divide.json` (miles and gain from the file; round-trip gain added from the itinerary where the file gives one way):

| Route | Mi · gain ft | Slot | Season (data) |
|---|---|---|---|
| Marymere Falls | 1.8 · 330 | Short | Year-round |
| Lover's Lane loop | 5.3 · 380 | Short | Road open |
| Mink Lake | 5.2 · 1,520 | Medium | Mid-Jun-Sep |
| Spruce Railroad Trail | 8.0 · 140 | Flat | Year-round |
| Mount Storm King, to the end of the maintained trail | 4.4 · 2,100 | Vertical | May-Oct |
| Pyramid Peak | 7.0 · 2,770 | Vertical | Apr-Nov |
| Aurora Creek to Aurora Ridge | 6.8 · 3,220 | Vertical | Jun-Oct |
| Little Divide loop | 13.6 · 2,920 | Long | Mid-Jul-Sep |
| Appleton Pass | 14.8 · 3,660 | Long | Jul-early Oct |
| Barnes Creek to Aurora Divide | 15.0 · 4,260 | Long | Jul-Oct |
| Hoh Lake from Sol Duc, 1 night | 18.0 · 4,760 | 1 night | Late Jul-Sep |
| Little Divide loop, 1 night at Deer Lake | 13.6 · 2,920 | 1 night | Mid-Jul-Sep |
| Mink Lake overnight | 5.2 · 1,520 | 1 night | Mid-Jun-Sep |

Two notes from the data. **Mount Storm King** stops at the end of the maintained trail: the rope section above it is hazard `storm_king_ropes`, and the daily never sends anyone there. **The Sol Duc Road** is often closed by snow and ice in winter (it reopened about 2026-03-24), so every Sol Duc route leaves the library whenever the conditions overlay or the winter rule says the road is closed.

**Winter, honestly.** With the Sol Duc Road closed, M1's winter library is Lake Crescent's low trails: Marymere Falls, the Spruce Railroad Trail (and its shorter graph route to the Devil's Punchbowl, 2.2 mi), Pyramid Peak and Storm King when the snow level allows. Five routes with variants repeat every week or so. Two fixes:

- **Lake Quinault's backyard (recommended).** The cabin sits at Lake Quinault, and `south_quinault_skok.json` already has four low trips there, three of them year-round: the Quinault Rain Forest loop (4.2 mi), the Kestner Homestead and Maple Glade (1.3), Pony Bridge (5.0, road permitting) and Irely Lake (2.2, spring to fall). Pulling just these four forward is a small content job, and it makes winter dailies happen in the home base's own rain forest, which is the right feeling for a rainy January.
- **The coast (M4)** brings winter weekend overnights and the tides.

Until the coast arrives, **winter weekends are day hikes**: there is no sensible low overnight in the M1 data.

### 2.6 How the day's route is chosen

The job picks the route; the rules are data, so they can be tuned without code:

1. **The slot.** Monday short, Tuesday medium, Wednesday vertical, Thursday medium or long, Friday the big one (the loop in a day, in season), Saturday and Sunday one-night overnights. Each weekend day is its own daily, so one calendar day is always one daily and one streak step.
2. **The season.** Only routes whose season, snow window (the melt-out line in `GAME_DESIGN.md` 7.6 against the route's high point) and road status allow that date.
3. **The cooldown.** No route repeats within 10 days in summer. Direction and camp variants count as the same route for this. Winter's small library relaxes it to 4 days.
4. **The ranger's veto.** If NWS has a warning in force for the route's zone that day (the `hazards` layer: a winter storm, high wind or flood warning), the job moves to the next candidate down the slot. Ordinary bad weather is not vetoed: rain on Deer Lake is the day's puzzle, not a reason to skip it.
5. **The smoke test.** The job plays the chosen daily 2,000 times with the harness bots before publishing (2.7). If the sensible bots die more often than `GAME_DESIGN.md` F.1 allows (0.5% per trip for sensible plans), it moves to the next candidate.
6. **The draw.** Among the candidates left, the job draws with the day's random seed, so nobody can predict next week's routes.

### 2.7 Par, splits and the smoke test

**Splits** fall at named places: trailheads, junctions, camps and landmarks along the route, about one every 1 to 3 miles. Each route lists its splits in the library.

**Par** is the median time of the harness's sensible bot (*Steady* in F.2) on today's daily, split by split. The job computes it during the smoke test and publishes only the split times, never what happened on the way. On the trail each split page shows your time against par; on the share card each split is a block (2.9). The name on the page is yours to write; *Jon's pace* would be one insider wink [draft].

**The smoke test** checks what the per-push CI already checks (no crash, no dead end, no stuck state, determinism) on today's real conditions, plus the F.1 death cap for sensible bots. It costs a second or two: the harness runs a plain trip in well under a millisecond.

### 2.8 Streaks

The streak counts **days in a row you played and came home**.

| Outcome | Board | Streak |
|---|---|---|
| Finished | Your time | +1 |
| Turned back, or walked out early | *Home safe*, no time | +1 |
| Rescued | *Home safe*, no time | +1 |
| Disqualified (2.10) | No time | +1 |
| Died | DNF | Back to 0 |
| Didn't play | Nothing | Back to 0 |

A death resets it, as decision 25 says. Turning back keeps it, because the honest odds offer a sure way out at every moment that can end a hike, and the streak should reward taking it. The phone also keeps your best streak, finishes, DNFs and a calendar of every day you played.

### 2.9 The share card

Two things share, both through the iOS share sheet, with no server:

**The text** (Wordle's trick: a grid that says how it went and nothing about what happened). It never names a hazard, a choice, a place mid-route or the weather that bit you.

```
[GAME] · Hike of the Day #212
Deer Lake · out and back
2:41:07 · home
▲▲▼▲  ♦1  streak 12
```

```
[GAME] · Hike of the Day #212
Deer Lake · out and back
DNF · 2 of 4 splits
▲▼✕   streak 0
```

*(Draft. `[GAME]` waits for the real name.)* Each block is a split: ahead of par, behind par, or where it ended. In the real share text the blocks are colored square emoji, which read well in any group chat; the mockup uses plain glyphs. `♦1` counts the red-diamond choices you took and survived, without saying which. A crew link can ride along (5.3).

**The picture:** a chunky-pixel card at 160x168, the trailhead (never a mid-route scene) under today's real sky at the hour you finished, your time in the pixel font, the daily's number and the split strip. It is the game's version of the summit photo, and it shows no spoilers by construction.

**Easter eggs, if you want them:** daily #104 could be the day every Boy is on the trail, and a finish time ending in 1:04 could make the tub's thermometer on the card wink. Insiders notice; nobody else needs to (decision 34).

### 2.10 Deaths, disqualifications and the register

**A daily death plays the whole death sequence** (YOU PERISHED, Leave No Trace, the epitaph, GAME OVER), then returns you to the cabin. The register is the one place deaths are remembered, so a daily death goes into the Trail Register like any other, tagged with the day's number. Your crew's boards show typed epitaphs; the world board shows only a dealt public-domain line or nothing, because typed text there needs moderation.

**Disqualified** means the time breaks a rule the game told you about before you chose. In the daily: cutting a switchback, camping off the stamped permit on an overnight, or skipping a required split. You still come home, the streak still counts, and the trip report says why there is no time.

**The Bonfire Lily stays out of timed modes** (recommended). Same dice for everyone would make it the same for everyone that day, and *"the lily is out today"* would be all over the group chat. It is a rare find for Open hikers who are out on the snow after dark, which is where it belongs.

---

## 3. Today's real weather

### 3.1 What the job does

Every morning, `daily.yml` runs `tools/daily.mjs` in GitHub Actions:

1. **Pick the slot and the candidates** for today (2.6).
2. **Fetch the forecast** for each candidate's weather anchors, plus the Quillayute cell for the park-wide weather state, plus Lake Quinault for the cabin.
3. **Convert** each candidate's forecast into game weather (3.4) and draw the actual weather once (3.5).
4. **Smoke-test** the candidate with bots (2.7), and pick.
5. **Write the day's file** with a fresh random seed (3.6), and add it to the index.
6. **Push** it to the `daily` data branch, and ask `pages.yml` to deploy.
7. **On failure,** retry, and at the deadline publish the climatology fallback instead (3.8).

About ten requests to NWS a day, a few seconds of compute, and no secret anywhere: the NWS API needs no key.

### 3.2 The NWS API, checked

Checked against the NWS documentation and by calling the API on 2026-10-08:

- **A User-Agent is required.** The docs ask for one that identifies the application, with contact details optional (*"This will be replaced with an API key in the future"*). A request with no User-Agent got **403** in our test. The job sends `(104-boyz daily, github.com/FernForager/104-boyz)` and no email address, since the repo is public.
- **Two calls per place.** `GET /points/{lat},{lon}` returns the forecast office and grid cell (`SEW` for everything in the M1 library) and three URLs: `forecast` (12-hour periods), `forecastHourly`, and `forecastGridData`, the raw grid. The grid is about 2.5 km, and NWS says a point's cell can occasionally change, so the job re-checks `/points` weekly and caches the mapping in between (`/points` answers with `max-age=86400`; gridpoints with `max-age=3600`).
- **The raw grid has what the game needs.** `GET /gridpoints/SEW/{x},{y}` returned time series for temperature, dewpoint, sky cover, wind speed and gusts, probability of precipitation, precipitation amount (mm), snowfall, **snow level**, **probability of thunder**, the `weather` layer (coverage and type: rain, showers, fog, snow), visibility and `hazards` (watches and warnings), plus `updateTime` and the cell's own elevation. Values come in SI units with ISO 8601 time ranges such as `2026-10-08T13:00:00+00:00/PT2H`.
- **Errors come as `application/problem+json`.** An impossible point returned 404 with the title *Data Unavailable For Requested Point*. A May 2025 service change made invalid grid cells return 404 rather than 500, and missing data return nulls rather than 503.
- **Rate limits are not public,** *"but allow a generous amount for typical use"*; over the limit, a request errors and *"may be retried after the limit clears (typically within 5 seconds)."* Ten requests a day is nothing.
- **Forecast timing.** SEW's routine zone forecasts came out at 2:37 am and 2:37 pm PDT on each day we checked, and the grid itself updated at other hours too (12:25 pm on Oct 8). The job records the grid's `updateTime` in the file.
- **Public domain, with conditions.** NWS information is public domain, but reusers may not imply NWS endorsement, and may not edit it and present it as official. So the game shows NWS's own words only unaltered and credited, and labels everything derived from them as the game's own estimate (3.9).

### 3.3 Weather anchors

Each route has two to four **anchors**: the trailhead, the high point, and any place where the weather changes the play (the crest, a lake camp). The 2.5 km grid smooths the mountains, so a cell's elevation can be far from the place's. Checked on 2026-10-08:

| Place (ft) | NWS cell | Cell ft | Use |
|---|---|---|---|
| Sol Duc trailhead (1,980) | SEW 81,94 | 2,100 | Good match |
| Deer Lake (3,530) | SEW 81,93 | 3,458 | Good match |
| Lunch Lake (4,450) | SEW 82,92 | 4,787 | Good match |
| High Divide (5,180) | SEW 82,91 | 4,685 | Lapse +500 ft |
| Heart Lake Junction (5,080) | SEW 83,91 | 3,330 | Use 82,91 instead |
| Appleton Pass (5,140) | SEW 84,93 | 5,443 | Good match |
| Mink Lake trailhead (1,650) | SEW 80,95 | 1,624 | Good match |
| Aurora Divide (4,770) | SEW 84,96 | 3,406 | Lapse +1,360 ft |
| Marymere Falls trailhead (600) | SEW 83,99 | 577 | Good match |
| Storm King, end of trail (2,700) | SEW 84,98 | 1,713 | Lapse +990 ft |
| Pyramid Peak (3,100) | SEW 83,100 | 2,385 | Shares a cell with... |
| Spruce RR, Lyre River (600) | SEW 83,100 | 2,385 | ...a trailhead 2,500 ft lower |
| Quillayute (the state) | SEW 58,98 | 98 | The chain's own station |
| Quinault ranger station (220) | SEW 77,73 | 387 | The cabin's sky |

So ingest does two things once, and stores the result in the route library:

- **Nearest-elevation neighbor.** For each anchor, look at the 3x3 block of cells around it and take the one whose elevation is closest to the place's (that is how Heart Lake Junction gets 82,91).
- **Lapse the rest.** Shift temperature from the cell's elevation to the place's with the doc's own rates (`GAME_DESIGN.md` 7.5: -3.3 °F per 1,000 ft in cloud, -4.5 on a clear afternoon), and nothing else: rain chance, wind and thunder come straight from the cell, with the ridge factors below.

### 3.4 From forecast to game weather

The game's weather model (`GAME_DESIGN.md` 7.5) runs on a daily **park-wide state** (fair, unsettled, wet, storm), zone weather derived from it, overlays for High-zone thunder, fog and wind, and temperatures by lapse rate. The job maps the forecast onto exactly those inputs, so the engine runs the same code on a daily as on any trip:

| Game input | From the NWS grid | Rule |
|---|---|---|
| The day's state | Quillayute's 24-h precipitation | The chain's own cut-offs |
| Rain by hour | PoP and amount per block | Drawn once (3.5) |
| Thunder (High zone) | `probabilityOfThunder` | Drawn once per block |
| Fog on the crest | `weather` fog, visibility | Else the data's climatology |
| Crest wind | `windSpeed`, `windGust` | x1.1 ridge factor (estimate) |
| Temperatures | `temperature` | Lapsed to each place |
| Snow on the trail | `snowLevel`, `snowfallAmount` | Into the 7.6 snow model |
| Warnings | `hazards` | The ranger's veto (2.6) |
| Daylight | Computed for the date | The 7.2 rules |

The state is the neatest part. The data team built the weather chain from **Quillayute's daily precipitation** (`park_rules.json`, `m1a_weather_inputs.weather_chain`: fair under 0.01 in, unsettled 0.01 to 0.09, wet 0.10 to 0.99, storm 1.00 or more). So the job reads the NWS precipitation forecast for Quillayute's own grid cell and applies the same cut-offs, and the forecast lands in the same four states the climatology speaks.

**Fog** comes from the `weather` layer where NWS forecasts it (*patchy*, *areas of*, *widespread* fog map to 0.3, 0.5 and 0.8, estimates) and from the data's `fog_high_zone` shares by state where it doesn't, since ridge fog is often below what a 2.5 km grid resolves.

**Days two and beyond** of an overnight use the same grid; the forecast covers seven days, so a Saturday overnight's Sunday is a day-ahead forecast.

### 3.5 The forecast and the truth

The game keeps the difference it always had between the forecast and what actually happens (`GAME_DESIGN.md` 7.5), now with a real forecast:

- **The forecast** on the ranger's board is NWS's, unaltered and credited. That is the real thing hikers read before a real trip.
- **The truth** is drawn once by the job, from that forecast, with the day's seed: does it rain in each six-hour block (with the forecast's own probability), how hard (the forecast amount, scaled), is there thunder on the crest this afternoon, does fog sit on the rim at 2 pm, is it two degrees colder than forecast at dawn. Then it is frozen into the file, the same for everyone.
- **The odds stay honest.** A 40% chance of rain on the board means a day like it rains 40% of the time in the game. A nightly check keeps score over the archive: across all dailies, it should rain in about 40% of the blocks forecast at 40%, thunder should come in about the shares forecast, and so on. If NWS is well calibrated, so is the game.
- **No peeking.** The truth is in the file, so a player with the developer tools open could read it. That is the same as reading the dice: the honor system covers it (5.5), and the file stores the truth in the engine's internal form, not as a weather report.

### 3.6 The day's file

One small JSON file per day, written once:

```json
{
 "v": 1,
 "n": 212,
 "date": "2027-05-06",
 "opens": "05:00 PT",
 "route": "deer_lake_day",
 "kind": "day",
 "start": ["06:00", "10:00"],
 "seed": "9f2c…",
 "rules": "r7c41e0",
 "wx": {
  "src": "nws",
  "office": "SEW",
  "grid": "2027-05-06T09:41Z",
  "fetched": "2027-05-06T10:24Z",
  "board": "…NWS periods…",
  "truth": "…engine form…"
 },
 "par": [762, 5544, 8312, 9160]
}
```

- `seed` is 128 random bits from the job, so nobody can compute a future day's dice.
- `rules` names the exact engine and data that play this day (6.4).
- `par` is the sensible bot's median at each split, in seconds.
- `src` is `nws` or `climatology`, and the forecast board says which [draft wording].

The files live at `daily/2027/2027-05-06.json` on a `daily` data branch, with `daily/index.json` listing each day's number, date, source and SHA-256. Pages serves them under `/104-boyz/daily/`. They are small (well under 20 KB with the hourly series), so a year of dailies is a few MB against the 1 GB Pages limit.

### 3.7 Pinning: why a late player gets the same day

- **Written once.** The job refuses to overwrite a published day. A fix to a bad day ships as a new rules version for tomorrow, never as an edit to today.
- **Checked by hash.** The phone fetches `index.json` (bypassing its cache, as the service worker already does for editions), then the day's file, and refuses a file whose hash doesn't match the index. Every attempt's action log records that hash.
- **Never late.** The job never publishes a real-weather file after 4:30 am, half an hour before the day opens, which is more than Pages' 10-minute cache. After 4:30 it publishes the climatology fallback instead (3.8).
- **The fallback is the same everywhere.** If a phone finds no file for today at 5:00 am, it computes the climatology day itself, from the date alone, with the same code the job uses. The next job run writes that same fallback into the archive, so the record is complete and every result can be checked.
- **Kept while you play.** A phone keeps the day's file, and the rules it names, cached until the attempt is over, even across an update.

### 3.8 When things fail

| What fails | What happens |
|---|---|
| No User-Agent (403) | A unit test makes sure the job always sends one |
| NWS 5xx or a timeout | Retry after 5, 15 and 45 s; then the next scheduled run |
| Over the rate limit | Wait 5 s and retry, per the docs |
| A cell moved (404) | Re-resolve with `/points`; else use the next anchor |
| A null layer | Fill from the next hour, then from climatology; logged |
| Stale grid (over 12 h) | Use it, flagged; over 24 h, fall back |
| The cron runs late | Three runs: 3:23, 3:53, 4:17 am |
| The cron never runs | Phones compute the fallback at 5:00 |
| Pages fails to deploy | The 4:17 run retries the dispatch |
| The schedule goes dormant | See below |

**The sleeping schedule.** In a public repository, GitHub disables scheduled workflows after 60 days with no repository activity. The job pushes to the `daily` branch every day, but whether a push by the workflow's own token counts as activity isn't documented. So three guards: the game never depends on the job (the fallback is always there); the job opens a GitHub issue after two failed mornings, which emails you; and a session can re-enable the workflow in one command. If it ever sleeps, the forecast board simply says climatology until it wakes.

### 3.9 The workflow (sketch)

```yaml
name: daily
on:
  schedule:
    - cron: '23 3 * * *'
      timezone: America/Los_Angeles
    - cron: '53 3 * * *'
      timezone: America/Los_Angeles
    - cron: '17 4 * * *'
      timezone: America/Los_Angeles
  workflow_dispatch:
permissions:
  contents: write
  actions: write
  issues: write
concurrency:
  group: daily
  cancel-in-progress: false
jobs:
  bake:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
      - run: node tools/daily.mjs
      - run: node tools/daily-push.mjs
      - run: >
          gh workflow run pages.yml
          --ref main
        env:
          GH_TOKEN: ${{ github.token }}
```

- **Times avoid the top of the hour,** which GitHub names as its busiest, when scheduled runs can be delayed or dropped. They also avoid 2:00 to 3:00 am, the hour that vanishes in spring.
- **Each run is idempotent.** If today is already published, it exits at once.
- **`pages.yml` gains one step:** check out the `daily` branch into `site/daily/`. Nothing else in the deploy changes.
- **A dispatch from the workflow token** is the same mechanism `BUILD_PLAN.md` 6.2 already uses for preview pushes.
- **Workflow files need your permission to push** (`BUILD_PLAN.md` 6.1). If the session's push is refused, it hands you the file to paste on GitHub, as before.
- **Actions minutes are free** for a public repository on standard runners.

### 3.10 What the forecast board may say

- **NWS's own words, unaltered,** with a credit line: the period names, the short forecasts and the numbers, exactly as the Seattle office wrote them. They are not original English, so decision 21 doesn't make them yours to write, but you can veto showing them.
- **Everything the game derives** (the crest at 5,180 ft is 6 °F colder than the cell, the thunder chance for the afternoon) is labeled as the game's estimate *from* the NWS forecast, in your words. Nothing the game computes is ever presented as an NWS forecast, and nothing suggests NWS endorses the game.
- **On a fallback day** the board says so plainly [draft wording yours].

---

## 4. FKTs

### 4.1 What an FKT is in the game

A Fastest Known Time is the trail runners' record for a route: elapsed time, in one of three styles, with the route followed continuously and in order, and the clock never stopping. In the game, an FKT attempt is a timed run of one route by a fresh standard runner, in the style you choose, scored by elapsed time and checked by replaying it.

The game's times are the game's: the engine's own trail graph and runner, never comparable with a real person's watch. So **the game never shows real athletes' names or times.** The real High Divide Loop route page on fastestknowntime.com is a reference for what the route is, nothing more.

### 4.2 Which routes get FKTs

A route gets an FKT board if it is fully on trail and either long (12 miles or more) or steep (2,000 ft or more on the way up), and it is a loop, a peak or an end-to-end that runners would recognize. One flat route earns a board too, for winter. From the region data:

**M1: the Sol Duc side and Lake Crescent**

| Route | Shape | Mi · gain ft | Directions |
|---|---|---|---|
| High Divide Loop | Loop | 18.4 · 4,400 | ↺ and ↻ |
| Little Divide loop | Loop | 13.6 · 2,920 | Both ways |
| Appleton-Cat Basin grand loop | Loop | about 23 · 5,920 | Both ways |
| Mount Storm King | Up and back | 4.4 · 2,100 | One |
| Pyramid Peak | Up and back | 7.0 · 2,770 | One |
| Aurora Ridge traverse | End to end | about 22 · 5,800 | Both ways |
| Spruce Railroad and the Discovery Trail | End to end | 10.5 · 560 westbound | Both ways |

The High Divide Loop is the flagship and should be the first board. Storm King and Pyramid are short "vertical" boards for the week when the high country is out. The grand loop uses the primitive Cat Basin trail and the Spread Eagle way trail (the data marks it expert). Mount Storm King ends at the end of the maintained trail, as the daily does. The Spruce Railroad route is the flat winter board, with its graph segment on to the Fairholme trailhead.

**Later, as regions land:** Hoh to Glacier Meadows and back (M2), the Hoh to Sol Duc traverse by Hoh Lake (M2, 24.4 mi), Royal Lake (M3), the South Coast traverse with its tide gates (M4), Enchanted Valley in a day (26.2) and Lake Constance (M5). Real FKT routes exist for some of these (the park's Grand Loop from Deer Park, the Constance Pass Loop, Shi Shi to Oil City, the Olympic segment of the Pacific Northwest Trail), which shows that the community runs them.

**The finale:** the **Press Expedition crossing**, Elwha to the North Fork Quinault over Low Divide, the route of the 1889-90 *Seattle Press* expedition (`elwha_to_north_fork_quinault`, 34.9 mi to Low Divide plus about 16.5 down the North Fork). It ends at Lake Quinault, a short drive from the cabin, where the tub is waiting. M5 at the earliest, since it needs the Elwha and the Quinault.

### 4.3 Direction and variations

- **Each direction is its own board.** The real FKT guidelines let loops run either way on one board, but the game's two directions play very differently: ↺ climbs 3,200 ft to the rim in 6.9 miles and crosses the dry crest at midday; ↻ climbs more gently and finishes with 3,200 ft of steep, rooty descent on tired legs (`GAME_DESIGN.md` 4.3). Two boards keep that choice worth making.
- **The route is defined in data:** an ordered list of required waypoints, so "continuously and in order" is a check, not a judgment.
- **Bogachiel Peak is not required** (recommended). The real route page describes the loop climbing *toward* the peak, and a real record was flagged for staying on the High Divide trail instead of tagging it. The game's data makes the peak a spur, so the standard line is the crest. Tagging the summit could earn a small mark on your time, if you like (section 8).

### 4.4 The three styles, as rule sets

The real definitions (fastestknowntime.com guidelines), and what each becomes in the game:

| Style | The real rule | In the game |
|---|---|---|
| **Unsupported** | No external support of any kind; carry everything; water from natural sources, and public taps | Only what you start with; streams, lakes and public taps |
| **Self-supported** | Any support that is equally available to anyone; caches you placed are fine | Plus your own stash (4.5), stores and public taps on the route |
| **Supported** | As much support as you can enlist, entirely self-powered | Plus crew at support points and a pacer (4.6) |

Three rules carry straight over from the real guidelines:

- **Pre-arranged spectating is support,** except at the start and finish. Jon cheering at the Sol Duc Falls bridge mid-route makes a run supported.
- **A chance meeting is not support,** but taking something from it is. When a Boy offers a trade on an unsupported run, the choice says before you take it that the run becomes supported [draft]. Taking it reclassifies the run; it never disqualifies it.
- **The crown follows the real rule, if you want it:** a self-supported best counts as *the* self-supported FKT only if it also beats the best unsupported time (section 8).

There are no gender categories: every runner is the same simulated athlete.

### 4.5 Stashes: your Open hiker, and the 24-hour rule

A self-supported runner may use a stash they placed themselves. In the game, the one who places it is **your Open hiker**, on an Open trip, which is the bridge between the career and the stopwatch:

1. Buy a canister and what goes in it at the stores, in Open.
2. Plan an Open trip on the FKT route that passes the stash point, dated the day before the window's date or that morning.
3. At the stash point, *Stash the can* [draft]: in a bear canister, out of sight of the trail.
4. Within 24 game hours, the FKT runner finds it, eats, refills, and **carries the empty can out**. Even the small canister in the catalog weighs about 2 lb empty (`canister_small`, 33 oz), carried for the rest of the run, which is the trade.

**The 24 hours is real law.** 36 CFR 2.22(a)(2) forbids leaving property unattended for longer than 24 hours in a national park, and Olympic requires all food to be secured from wildlife 24 hours a day, in an approved canister. Olympic's conditions for commercial guides spell it out as *caches prohibited* beyond 24 hours. So a stash that isn't used in time is gone: a ranger hauled it out, your Open hiker's region memory gets the same note a citation leaves, and the run is unsupported whether you meant it or not.

**Where a stash may go** is data (`stash_ok`): trailheads (your car, which is always fine), designated camps, and nowhere off trail. Whether Olympic's own compendium adds anything for private visitors still needs checking (section 9), so backcountry stashes sit behind a flag until it is. Car and store stashes work either way.

**Stakes:** the stash run is an Open trip, Old School. Your hiker can die placing a can for a run that hasn't started. That is not a bug.

### 4.6 Support: Jon and the Boyz

**Support points** are listed per route: every trailhead the route touches, and on routes with no road mid-way, one or two places a crew can hike in to (Deer Lake or Sol Duc Park on the High Divide Loop). A support point offers water, food from your crew box, a dry layer and a battery swap, at a time cost you choose.

- **Ranger Jon** crews at the trailheads, with his truck and his badge #104, on his days off: a seeded calendar per window, like his guiding days on Olympus. On the Aurora Ridge traverse he drives the shuttle and waits at the far trailhead.
- **A pacer** is a Boy (`{BOY_n}`) who runs one section with you and carries your water and food, so your vest is lighter. That is exactly what the real guidelines allow and what makes supported runs fastest. The Boyz never carry you, never get hurt, and say a line or two (yours to write).
- **Never physical help.** The runner is self-powered in every style.

### 4.7 The window: conditions and attempts

**Each week, each route gets one window:** a date in the route's season and that date's conditions, fixed from Monday 5:00 am Pacific to the next Monday. Every attempt that week runs on the same weather and the same dice, so you can try as often as you like, and your best counts.

- **Why fixed, not a new roll each time:** fairness and ghosts. With one set of conditions, a faster time is a better run, not better luck, and your ghost is directly comparable. It is the King's Quest rule the game already has: the same choice at the same place gives the same result, so a rolled ankle on the Deer Lake descent at Race pace is a puzzle you solve by running it differently, never by trying again with the same pace.
- **Why not today's NWS weather:** the daily already is that. A window's date is a summer date even in January, so the High Divide board stays open all year. Its weather is drawn from the climatology chain with the window's random seed, published Monday morning by the daily job (`fkt/2027-W33.json`).
- **A later upgrade:** windows on **real past days**, with the weather Quillayute and the SNOTEL stations actually recorded on, say, August 14, 2025. The data team already works from those records.
- **All-time boards** mix windows, each time tagged with its window's conditions. Luck with the weather is part of real FKT culture; the weekly board is the fair one.

### 4.8 Running: pace, fuel, water, ankles, dark

**Pace** is a choice at the start and at every split, as in Open's morning pace (`GAME_DESIGN.md` 7.4), with two new steps:

| Pace | Flat · climb (Strong) | Burns kcal/h | Water L/h |
|---|---|---|---|
| Hike | 2.7 mph · 1,600 ft/h | about 350 | 0.4-0.6 |
| Push | x0.88 time | about 450 | 0.5-0.7 |
| Run | 5.4 mph · 2,160 ft/h | about 700 | 0.6-0.9 |
| Race | 6.2 mph · 2,400 ft/h | about 850 | 0.7-1.0 |

*(Design estimates for the harness to tune. Running uses about 1 kcal per kg per km on the flat, roughly independent of speed, which is about 120 kcal a mile for a 165 lb runner; climbs add to it. Water rises by 0.2 L/h above 75 °F.)*

On the movement formula, Run and Race replace the flat speed and climb rate, cut the steep-descent cost (runners descend faster, on the same knees), and shrink the break factor from 1.12 to 1.03 (Run) or 1.00 (Race). Trail class still multiplies distance, and way trail costs a runner more than a hiker.

**Fuel and the bonk.** The runner starts with a carbohydrate store of about 1,800 kcal (estimate) and burns it at a share of the pace's rate: half at Hike, 70% at Run, 80% at Race. Eating puts it back, but only so fast: about 60 g of carbohydrate an hour (240 kcal), the top of the classic 30 to 60 g guidance. When the store runs out, the runner bonks: the existing Bonked state, slow, clumsy and cold.

So Race all the way round the High Divide Loop bonks somewhere on the river trail, even eating at the cap, and Run with a gel every 30 minutes doesn't. Pacing is the puzzle, and it is a real one. A fuel plan is set at the trailhead (every 30, 45 or 60 minutes, or at splits) and can be broken by hand.

**Water.** The crest is dry (`dry_crest`): Deer Lake going ↺, Heart Lake going ↻, are the last sure water. Soft flasks are light and small; carrying more is slower. Dehydration past about 2% of body weight (about 1.5 L for the standard runner) costs speed and warmth, the threshold sports medicine aims to stay under.

**Rolled ankles.** On segments tagged technical, Run and Race add a footing check per mile. Its chance rises at Race, after dark, on wet rock and when Tired or Spent, and falls with poles. A mild sprain slows the rest of the run (x1.15); a moderate one is Serious (x1.6), which usually means walking out. The pace chip's (i) shows the honest chance before you pick it: about 1 in 14 on the way down to Deer Lake at Race pace, say [draft]. Safe paces show costs, never a %, as everywhere in the game.

**The technical descent** (the minigame, decision 30) fires on those same segments at Run or Race: rhythm taps on roots and rocks. It sets that segment's time between x0.92 and x1.10 and feeds its stumbles into the footing check. Its *Auto* option (6.3) gives the median result.

**Headlamp starts.** Start before first light to cross the crest before the afternoon thunder, at the cost the doc already sets (`GAME_DESIGN.md` 7.2: headlamp travel x1.35), double the footing chance while running in the dark, and a battery to watch.

**The kit.** A runner's flat lay is its own small art form: a vest, two soft flasks, gels in a row, a shell, a headlamp, a phone. The catalog needs a few new generic items for it: a 12 L running vest, 500 mL soft flasks, folding poles. Everything else is already in `gear_catalog.json` (trail runners, the headlamp, the watch) and `food_catalog.json` (gels, chews, electrolyte sticks).

### 4.9 Splits and ghosts

Splits fall at the route's named junctions. The High Divide Loop ↺, with the harness's first rough estimate for the standard runner at Run pace with no stops:

```
HIGH DIVIDE LOOP ↺ · UNSUPPORTED
Window 2027-W33 · Aug 14 · fair
                 time     vs PB
Sol Duc Falls    0:12:36  -0:08
Deer Lake        1:32:24  +0:51
The rim          2:50:24  +1:02
Hoh Lake jct     3:14:24  +0:40
Heart Lake jct   3:57:00  -0:22
Sol Duc Park     4:19:12  -0:35
Appleton jct     4:51:00  -1:10
Sol Duc Falls    5:44:24  -2:03
Trailhead        5:57:36  -2:31
```

*(Times computed from the movement formula for these splits; the deltas are illustrative. Every label is a draft.)*

**Ghosts.** A ghost is a pale runner on the route strip at the top of each trail page, where a past run was at this same elapsed time:

```
 ▁▂▄▆█▇▆▅▃▂▁▁▁▁▁▁▁
 ·····●··◌··········
      you ghost +2:14
```

- **Your best in this window:** exact, since it ran in the same conditions.
- **Your all-time best:** for reference, in other weather.
- **A crew member's or a board leader's,** from their result link or the world board.

The ghost is drawn from the split times, so it needs no extra data. Opening the full replay of a run (watching every page it chose) is a later extra; the action log already has everything it would need.

**In the daily, ghosts are off by default** (recommended), because a friend who lost forty minutes between the rim and Heart Lake tells you something. Once you've finished, *Watch the crew* [draft] plays everyone's dots along the route at sixty times speed, which is all of the fun with none of the spoiler.

### 4.10 Ethics: what disqualifies a run

The real guidelines say runs must follow the route, keep to existing trails, decline submissions that cut switchbacks, and accept nothing that breaks a law, rule or policy. In the game:

| You chose to | Result |
|---|---|
| Cut a switchback | DQ (and Leave No Trace -5) |
| Leave the route and not come back to the same point | DQ |
| Skip a required waypoint | DQ |
| Take support your style doesn't allow | Reclassified, not DQ (4.4) |
| Drop a wrapper, feed a jay, any LNT rule break | DQ |
| Let a stash sit past 24 hours | The stash is gone (4.5) |

Every one of these is a choice the page offers, with the consequence on the button before you tap it. The game never disqualifies anyone for something it didn't say. Your **action log is your GPS track**: the board's verification (5.4) is the game's version of the FKT site's.

### 4.11 The runner, and calibration

**The standard runner** has the standard skills and **Strong** fitness (recommended): a trail runner should feel faster than the daily's Regular hiker. Everyone gets the same runner, so this only sets how fast the game feels.

From the movement formula, for the High Divide Loop ↺:

| Who | Pace | Time |
|---|---|---|
| Regular hiker, with breaks | Steady | about 13 h |
| Strong runner | Run | about 6 h |
| Strong runner | Race | about 5 h, if it didn't bonk (it does) |
| A well-paced Strong runner | Mixed | 5 to 5½ h (target) |

A fast run should feel like a strong amateur's day, five-ish hours, with a few great windows bringing it under five. The real-world record on the real route page is far faster than any of these, and the game never mentions it. The harness tunes the speeds, burns and footing chances so that: bots running sensibly finish 95% of the time in fair weather; Race-everywhere bots bonk or roll an ankle more often than not; and the spread between a sloppy and a perfect run is about an hour.

**Easter egg, with consent:** the Boyz could set the first ghosts on each board (`{BOY_n}`'s ghost), playing the real game before launch. Only with each Boy's OK, like their register lines.

---

## 5. Leaderboards, in steps

Each step works without the next.

### 5.1 Step 1: on your phone

- **Dailies:** a calendar of every day you played, with your time or *home safe* or DNF, your streak and best streak, finishes, DNFs, and your average place against par.
- **FKTs:** for each route, direction and style, your best time with its splits and its ghost, your best in the current window, and your last ten attempts.
- **Where it lives:** a new device-level key, `oph.<channel>.timed`, which outlives Open hikers and is never wiped by an Open death (timed modes don't touch the Open hiker, so a wipe doesn't touch them either). The action logs behind your ghosts go in IndexedDB. A year of daily results is about 20 KB.
- **Export and Import** (`GAME_DESIGN.md` E.6) carry it too.

### 5.2 Step 2: the share card

The text and the picture (2.9), plus the same pair for an FKT: route, direction, style, time, the split strip, *PB* or *window best* [draft]. No server, nothing to sign up for.

### 5.3 Step 3: crew boards, with no server

**A result link carries the whole run.** `fernforager.github.io/104-boyz/#r=…` holds the day (or the window), the rules version, a handle, and the run's action log, packed small. A daily day hike's log is a few hundred decisions and taps (under 1 KB packed, under 2 KB in the link), small enough for any group chat. Everything after `#` stays on the phone: the link is never sent to any server.

**The phone that opens it checks it.** It replays the log with the same engine and the same day's file, and gets the time itself. A link that doesn't replay to its claimed time is shown as unverified, in grey. So a crew board is trustworthy with no server at all, because the engine is deterministic (section 6).

**Your crew is whoever's links you've opened.** Pin them, give them local nicknames, unpin them. The crew board for a daily shows only after you've played it yourself; links that arrive earlier wait, sealed [draft: *Play first*].

**Catching up:** any phone can export the crew results it holds as one link, so someone who joins the chat late gets the whole board in one tap.

**Old links:** a link names its rules version. If your phone has moved on, it fetches that version's engine from the archive on Pages (6.4) to replay it, and after 45 days it shows the time as unverified.

### 5.4 Step 4: the world board

A tiny server, only when you say so. Recommended: **Cloudflare Workers with D1** (its SQLite database), on the free tier.

**What it does:**
- Accepts a result (the same packed log a crew link carries) and stores it as *checking*.
- Serves boards: today's daily, each FKT board for this window and all time, and your own ranks.
- Lets you claim a handle, and erase yourself.

**What it doesn't do: it doesn't check times itself.** The free tier allows 10 ms of CPU per request, too little to replay a run safely. So checking happens in GitHub Actions, where the engine already runs:

1. Every 20 minutes, `verify.yml` asks the Worker for results that are *checking* (with a token kept in GitHub's and Cloudflare's secrets, never in the repo).
2. It replays each with `tools/verify.mjs` against the exact rules version and day file the log names.
3. It posts back *verified* with the true time, or *rejected*.
4. The board shows *checking* times in grey with a small clock, then real.
5. Each morning after a day closes, it writes the final top 100 to the `daily` branch as static JSON, so the history survives even if the Worker doesn't.

(The alternative is Cloudflare's $5-a-month plan, which allows 30 s of CPU per request by default and up to 5 minutes, so the Worker could replay on the spot. Not needed at the start.)

**The data:**

| Table | Holds |
|---|---|
| `handles` | Name, its normalized form, a hash of your device key, hidden flag |
| `results` | Board, handle, time, status, log hash, the log, rules version |
| `reports` | A handle someone reported, for you to look at |
| `limits` | Request counts by a salted, daily-rotated hash of the address |

**Handles.** Three to sixteen letters, digits, `_` or `-`. The first submission claims one. Your phone makes a random device key, keeps it, and the server stores only its hash; Export carries it to a new phone. No email, no password, no account.

**The PG-13 filter,** one shared module (`handle_filter.js`) on the phone (instant feedback) and in the Worker (the real check):
- Normalize: lowercase, strip accents, undo leetspeak (`0`→o, `1`→i, `3`→e, `4`→a, `5`→s, `7`→t, `@`→a, `$`→s), collapse repeated letters.
- Deny: the LDNOOBW word lists (CC BY 4.0, credited in the colophon), whole-word for short words and substring for long ones, so *Scunthorpe* and *assassin* get through.
- Allow: the game's own PG-13 vocabulary, which is yours to set (beer and IPA, surely; *420*, your call).
- Reserve: Jon, Ranger, the Boyz' names, 104, NPS, the stores' real names (lint T03's list), admin and moderator, and *official*.
- Moderate: a *Report* tap on any board line; the verify job opens a GitHub issue for each new report, so you hear about it by email; one admin call hides a handle.

**Privacy, plainly:**
- The world board is **opt-in.** The first time you finish, the game asks once [draft]; the setting is in ≡.
- It stores a handle, results and their logs. No email, no name, no location, no analytics, no addresses (rate limits use a salted hash that is thrown away daily).
- Logs are kept for 90 days, except the top 100 of each board and each handle's FKT bests, which ghosts need.
- *Erase me* [draft] deletes everything tied to your device key.
- It is the first time the game talks to any server besides GitHub Pages, and the privacy note (your words) says so.

**Cost.** The free tier allows 100,000 Worker requests a day, and D1 allows 5 million row reads and 100,000 row writes a day, with 5 GB of storage. A thousand daily players make roughly 5,000 requests and 2,000 writes a day: about 5% and 2% of the limits. Logs at about 1 KB each come to well under half a GB a year. Around 20,000 daily players, the request limit would bite, and the $5 plan covers ten million requests a month. The address is a free `workers.dev` subdomain.

**What you would do,** once: make a free Cloudflare account, create an API token, and add it and the board's admin token as two GitHub secrets. About ten minutes. Claude writes, deploys and maintains the rest from CI.

### 5.5 Cheating: what's stopped, and what isn't

| Trick | Stopped? |
|---|---|
| Typing in a fake time | Yes: only replayed times count |
| A modified game | Yes: the canonical engine replays it |
| Posting someone else's run as yours | Mostly: the second copy of an identical run is hidden |
| Scouting the daily on a second phone | No: one shot is the honor system, as in Wordle |
| A bot playing the minigames | Partly: inputs faster than a human are rejected |
| Reading the dice in the day's file | No: the honor system again |

That's the right size for a game among hikers. A determined cheater can scout a daily; they can't fake a time.

### 5.6 Where the boards live

On the cabin's walls, if the hub draft likes it: the daily's result on the clipboard, the FKT chalkboard in the shed, and the crew's and the world's boards one tap behind each. The Trail Register stays what it is, the book of the dead and the best trips.

---

## 6. Determinism: what this asks of the engine

The engine is already built to be deterministic (`GAME_DESIGN.md` E.1, E.8; `BUILD_PLAN.md` 6.6): a pure `step(state, action)`, a seeded `sfc32` split into keyed streams, `Math.random` banned, the transcendental math functions and `**` banned, and `Date`, `Intl` and locale compares banned. Timed modes and crew verification lean on that harder, and add these requirements.

### 6.1 The engine

1. **One run is a pure function** of `(rules version, day file or window file, standard profile, action log)`. Nothing else may reach it: not the phone's clock, not the Open profile, not novelty.
2. **The clock is integer seconds** in timed modes. Movement, waits and minigame results add whole seconds, rounded once, at defined points, with the same rounding everywhere. The 15-minute tick stays for the body and the weather, applied pro rata over exact durations.
3. **Plain arithmetic only.** Addition, subtraction, multiplication, division and `Math.sqrt` are exactly rounded IEEE 754 operations, and JavaScript never fuses a multiply-add, so V8 (Node, in CI and the verifier) and JavaScriptCore (Safari, your phone) agree bit for bit. Anything that needs `exp`, `log`, `pow` or trig, such as the Poisson "met at least one party" chance in the traffic data, is a table built at build time.
4. **The daily's seed comes from the file;** a window's from its file; Open's from *Begin a new book*. Rolls keep their content keys (`hash(seed, stream, place, card, choice, day, attempts here)`), so an extra Look never changes a later roll.
5. **The look-ahead never touches outcomes.** The Trip Outlook and the honest-odds bars use their own stream, in a worker, and produce only numbers to show.
6. **The text stream never touches outcomes,** so rewording a line (decision 21) never changes anybody's time.
7. **Sorting** uses the standard stable sort (required since ES2019) with code-point comparisons, never locale order.

### 6.2 The action log

Everything that can change a result is an action, and nothing else is:

- the start time, the store purchases, what goes in the pack and on the outside straps;
- every choice, pace change, fuel-plan change, *eat now*, refill and wait (with its length);
- every minigame's input stream (6.3);
- for an FKT: the style, and the stash it uses (by the Open trip's id).

The log's header names the mode, the day or window, the rules version and the day file's hash. A **canonical form** (varint-packed, then compressed with the browser's `CompressionStream`, in Safari since 16.4) is what crew links, the world board and bug reports all carry, and its hash with no-op actions stripped is how identical copies are caught.

### 6.3 The minigames

The eight minigames are where a real-time game meets a deterministic engine. The rules:

1. **A fixed tick.** Each minigame simulates at a fixed rate (120 per second), independent of the screen's frame rate (60 or 120 Hz), and draws by interpolating between ticks. Drawing never feeds back into the simulation.
2. **Inputs are stamped in ticks.** A touch is placed at the tick its `event.timeStamp` falls in, counted from the minigame's start, and recorded as an integer. Replay feeds the same integers at the same ticks. The wall clock lives in the UI layer only; the minigame's simulation core lives in `engine/`.
3. **Physics without trig.** The bear can (Suika-style, the signature) packs round-ish items: circles collide with `sqrt` only, in a fixed order, with a fixed number of solver iterations. If an item must rotate, its angles step through a precomputed sine table.
4. **Their own seeds.** Any randomness inside a minigame comes from a keyed stream, `hash(seed, minigame, place, attempt)`.
5. **Audio is decoration.** The descent's rhythm is judged against ticks, never against sound. A latency setting may shift the judging window by up to 150 ms; it is recorded in the log.
6. **Bounded effect.** In timed modes, a minigame's result converts to seconds or to a modifier on an honest roll, capped: on a typical daily, the gap between the worst and the best minigame play should be no more than about 10% of the total time. Planning and choices decide the board; hands decide the margins.
7. **Auto, for everyone.** Every minigame has an *Auto* button [draft] that plays the median result, for VoiceOver users, for anyone who can't do rhythm taps, and for anyone in a hurry. It is never the best result, so it needs no mark on any board.
8. **Human limits.** The verifier rejects input streams no hand could make (taps closer than about 40 ms, perfect frame-exact patterns through a whole descent).

### 6.4 Pinning the rules

- **A rules version is a hash** of the engine's code and the edition data it runs. Every timed result, crew link and world-board entry names one.
- **Pages keeps old versions** for 45 days, content-addressed, at `/104-boyz/e/<hash>/` (a copy of `js/engine/` and the edition file). At about 1.3 MB each, that's well inside the 1 GB limit. Relative imports keep working in the copy, so the UI can load an older engine for a pinned day or an old link.
- **A day's file names the rules it plays on.** A deploy at noon changes what Open plays at once, but today's daily keeps today's rules until it closes. Rules changes reach the daily the next morning.
- **Git keeps every version forever** (a `rules-<hash>` tag at each deploy that changes the hash), so `verify.mjs` can always check any result.

### 6.5 Tests

- **Golden runs:** a corpus of daily and FKT logs (bots, plus your own runs once you play) replays to the same time and the same final state on every push.
- **Both engines:** the replay self-check `BUILD_PLAN.md` S3 already plans, which replays golden runs in Safari and compares hashes with Node, gains the timed corpus. Any V8-versus-JavaScriptCore difference shows up on your phone, in a bug report, before it shows up on a board.
- **Minigames:** recorded input streams replay to identical results; a test runs each one at 60 and 120 Hz frame rates and compares.
- **The job:** a canned NWS response (recorded today, kept as a fixture) converts to a known day file, byte for byte; each failure in 3.8 has a test.
- **Calibration** (nightly, over the archive): forecast rain and thunder against what the truth draws produced (3.5).

---

## 7. What ships when

| Step | What | With | Needs from you |
|---|---|---|---|
| T0 | Timed-mode foundations: second clock, complete log, standard profile, rules hash | M1a's engine sessions | Nothing |
| T1 | High Divide Loop FKT, ↺ and ↻, three styles; running; splits; ghosts; Step 1 boards; share card | Right after M1a | The words, the go |
| T2 | Hike of the Day, the morning job, the M1 library; crew links | M1b, with Lake Crescent's trails | The go; the daily's name |
| T3 | Lake Quinault's four low trails, for winter | Before the first winter of dailies | A yes |
| T4 | The world board | When you say go | A Cloudflare account; two secrets; the privacy words |
| T5 | More FKT routes as regions land; the Press Expedition crossing to finish at Lake Quinault | M2 onward; M5 | Nothing new |

**T0 is cheap now and expensive later.** The integer clock and the complete action log cost almost nothing if the engine is written that way from session 3, and a rewrite if added after.

**The FKT can come first** because it needs no new places: it is the slice's own loop, run fast. The daily needs a library that covers the season it launches in, and the morning job.

---

## 8. Decisions for you

Each has a recommendation; any can be overruled.

1. **When a daily opens:** 5:00 am Pacific (recommended), or midnight Pacific (baked the evening before from the 2:37 pm forecast), or each player's local midnight (breaks one world board).
2. **The streak:** days you came home (recommended: turning back and rescue keep it; a death or a missed day resets it), or days you finished.
3. **Overnight dailies score trail time,** with the clock paused in camp (recommended), or full elapsed time.
4. **Weekends:** each weekend day its own one-night daily (recommended), or one overnight for the whole weekend.
5. **Rule breaks** (a cut switchback, an off-permit camp): disqualified in both timed modes (recommended), or a time penalty.
6. **The winter library:** pull Lake Quinault's four low trails forward (recommended), and add Lake Crescent's trails to M1b.
7. **The ranger's veto:** only NWS warnings swap the day's route (recommended), or ordinary bad weather too.
8. **The FKT runner:** Strong fitness (recommended), or the same Regular as the daily hiker.
9. **FKT attempts:** a weekly window with fixed conditions and unlimited tries (recommended), or one shot per date.
10. **Career FKTs, later:** should your Open hiker also be able to go for FKTs for keeps, with permadeath, on a separate board?
11. **Directions and the peak:** separate boards for ↺ and ↻ (recommended), and Bogachiel Peak not required, with or without a mark for tagging it.
12. **The real crown rule:** a self-supported FKT must also beat the best unsupported time to wear the crown. Yes or no.
13. **Backcountry stashes:** allow canister stashes at designated camps for up to 24 hours once Olympic's compendium is checked (recommended), or keep stashes to trailheads and stores.
14. **The world board:** go or not yet; and which PG-13 words handles may use.
15. **The Bonfire Lily:** Open only (recommended), or in timed modes too.
16. **Easter eggs:** daily #104, par named for Jon, the Boyz' first ghosts (with consent), the 1:04 wink. Any, all or none.
17. **Crew ghosts in the daily:** off by default (recommended), or on.
18. **Minigame Auto:** available to everyone and unmarked on boards (recommended).
19. **Daily deaths in the Trail Register,** tagged with the day (recommended), with typed epitaphs on crew boards only.
20. **Real FKT records** never shown in the game (recommended).
21. **The words:** the daily's name (*Hike of the Day* is yours already), the share card, the par's name, every label marked [draft], and what the forecast board says on a fallback day.

---

## 9. Facts checked

Checked on 2026-10-08. Live API behavior was observed by calling `api.weather.gov` from this session that day.

**The National Weather Service API**
- [API documentation](https://www.weather.gov/documentation/services-web-api): User-Agent required, to be replaced by an API key in future; rate limit not public, retry after it clears (typically within 5 s); `/points` returns `forecast`, `forecastHourly` and `forecastGridData`; grids about 2.5 km; a point's grid cell may occasionally change.
- Observed: no User-Agent gave 403; `/points/0,0` gave 404 `application/problem+json`; `/points` `max-age=86400`, gridpoints `max-age=3600`; the gridpoint layers listed in 3.2, including `probabilityOfThunder`, `snowLevel` and `hazards`; the cells and elevations in 3.3.
- Observed: SEW zone forecast issuance at 09:37 and 21:37 UTC (2:37 am and pm PDT) on Oct 4-8, 2026, from `/products/types/ZFP/locations/SEW`.
- [Service change notice 25-44](https://www.weather.gov/media/notification/pdf_2025/scn25-44_API_latest_changesmay22_2025.pdf) (May 2025): invalid gridpoints return 404, not 500; missing data return nulls, not 503 (as summarized in search results).
- [NWS disclaimer](https://www.weather.gov/disclaimer): public domain unless noted; no implied endorsement; edited content may not be presented as official.
- [NPS Data API](https://www.nps.gov/subjects/developer/get-started.htm) needs a free key, so live park alerts are a later option, not part of the job.

**GitHub**
- [Events that trigger workflows](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows) and [workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax): schedules run in UTC unless a `timezone` (IANA) is set; skipped DST hours advance; shortest interval 5 minutes; delays at high load, especially the start of every hour, and possible dropped jobs; in a public repository, schedules are disabled after 60 days without repository activity.
- [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions): free for public repositories on standard runners.
- [Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits): 1 GB published site, 100 GB a month soft bandwidth, 10-minute deploy timeout; the 10-builds-an-hour limit doesn't apply to Actions workflows.
- Whether a push by the workflow's own token counts as activity for the 60-day rule: **not documented** (3.8 doesn't depend on it).

**FKTs**
- [FKT guidelines](https://fastestknowntime.com/guidelines): the three styles as quoted in 4.4; caches allowed in self-supported; self-supported must beat the fastest unsupported; pre-arranged spectating is support except at start and finish; chance company is not support; follow the route continuously and in order; switchback cutting likely declined; no law, rule or policy broken; elapsed time; loops either direction; gender categories.
- [High Divide Loop (ONP, WA)](https://fastestknowntime.com/route/high-divide-loop-onp-wa): a real route, 17.6 mi and 5,300 ft from the Sol Duc Falls trailhead, all recorded times unsupported; one flagged for not tagging Bogachiel Peak ([that entry](https://fastestknowntime.com/fkt/becca-windell-high-divide-loop-onp-wa-2020-09-19)). The game's own graph says 18.4 mi and 4,400 ft.
- Other real ONP routes: [Olympic National Park Grand Loop](https://fastestknowntime.com/route/olympic-national-park-grand-loop-wa), [Constance Pass Loop](https://fastestknowntime.com/route/constance-pass-loop-olympic-national-park-wa), [Shi Shi Beach to Oil City Road](https://fastestknowntime.com/route/shi-shi-beach-oil-city-road-wa), [PNT Olympic segment](https://fastestknowntime.com/route/pacific-northwest-trail-olympic-segment-cape-alava-highway-101boulton-farms-road).

**Park rules for stashes**
- [36 CFR 2.22](https://www.law.cornell.edu/cfr/text/36/2.22) (a)(2): leaving property unattended for longer than 24 hours is prohibited, except where longer periods are designated.
- [Olympic's wilderness regulations](https://www.nps.gov/olym/planyourvisit/wilderness-regulations.htm): food, garbage and scented items secured from wildlife 24 hours a day, in approved canisters.
- [Olympic's conditions for mountaineering guides](https://www.nps.gov/olym/getinvolved/conditions-for-mountaineering-climbing.htm): caches (items left unattended over 24 hours) prohibited for commercial operators. **Not yet checked:** Olympic's Superintendent's Compendium on caches by private visitors (4.5).

**Running and fuel**
- [Cost of transport](https://en.wikipedia.org/wiki/Cost_of_transport) and [Mayhew, BJSM](https://bjsm.bmj.com/content/11/3/116): running costs about 1 kcal per kg per km, roughly independent of speed.
- [GSSI, SSE 108](https://www.gssiweb.org/en/sports-science-exchange/article/sse-108-multiple-transportable-carbohydrates-and-their-benefits): the classic 30 to 60 g of carbohydrate an hour, and 90 g an hour of mixed carbohydrates for events of 2.5 h or more.
- [ACSM position stand, Exercise and Fluid Replacement (2007)](https://pubmed.ncbi.nlm.nih.gov/17277604/): drink to limit water loss to under 2% of body weight; sweat rates vary widely, so plans should be individual.
- The 1,800 kcal store, the pace speeds, burns, water rates and footing chances in 4.8 are **design estimates** for the harness to tune.

**The world board**
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) and [pricing](https://developers.cloudflare.com/workers/platform/pricing/): free plan 100,000 requests a day and 10 ms CPU per request; paid plan $5 a month with 10 million requests a month and 30 s CPU per request by default (5 min at most); KV free 100,000 reads and 1,000 writes a day; Queues free 10,000 operations a day.
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/): free plan 5 million rows read and 100,000 rows written a day, 5 GB storage.
- [LDNOOBW word lists](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words): CC BY 4.0, 28 languages.
- [CompressionStream](https://caniuse.com/mdn-api_compressionstream): Safari and iOS Safari 16.4 and later.

**From the repo's own data**
- Routes, miles, gain, seasons, hazards, crossings ("the loop has no fords") and trailhead road notes: `design/data/regions/sol_duc_high_divide.json`; the Quinault trips: `south_quinault_skok.json`; the Press Expedition route: `elwha_hurricane.json`.
- The weather chain's Quillayute cut-offs, the High-zone fog, thunder and ridge-wind inputs: `design/data/park_rules.json`, `climate.m1a_weather_inputs`.
- Split times and the time table in 4.11: computed from the segments with the `GAME_DESIGN.md` 7.4 formula (the running speeds are this draft's estimates).
