# Build plan: Olympic Peninsula Hiker

*Written 2026-10-08. Revised the same day, after Session 1 shipped, for the new direction: decisions 21 to 35 (no book frame; home is Ranger Jon's old ranger cabin at Lake Quinault; three ways to play; eight minigames; sound like* Lonely Mountains: Downhill*; every word yours). Revised again on 2026-10-09 for your rapid-fire answers, decisions 41 to 65, and Lead calls 29 to 43: money and three town jobs, an empty shed, the daily at sunrise with the world board and server-held dice, and your calls on the minigames, the sound and the words; and for how we work, decision 66 (1); and after Session 4, for decision 67 (a new hiker arrives in town clothes), Lead calls 44 to 46 and the ingest's doc corrections; and on 2026-10-10, after Session 5, for decisions 68 (a lighter palette) and 69 (art that scales to the whole park). It builds on `GAME_DESIGN.md`, mainly 2.2, 3, 5, 6, 9.7 to 9.12, 11.11, 12, 13, 15, 17, 18 and Appendices E and F, and on the four drafts in `design/drafts/`.*

*Sections 1 to 9 keep their old numbers, so older links still land (the doc points at 6.1, 6.6 and S3; the README at 4.2). The new direction's own parts are 10 to 14: the text system, home and the frame, the minigames, the sound and the timed modes. Risks moved to 15.*

*Order of authority: "Decisions made" in the design doc wins, then the rest of the design doc (its lead calls included), then this plan. "Doc 7.4" means section 7.4 of `GAME_DESIGN.md`. Every line of in-game English here is a draft for you (decision 21): new ones are marked (DRAFT), and the rest are quoted from the doc, where they are drafts too.*

---

## 1. The short version (for you)

**Where it stands.** Session 1 shipped on 2026-10-08. `ophiker.com` draws the High Divide in at dusk, and it installs to your Home Screen as OP Hiker. Its picture engine, palette and cover carry straight over. Its title page doesn't: the cabin replaces it (1.1).

**What you get first (M1a): the High Divide and Seven Lakes Basin loop, played from home.**
- **Home is the cabin at Lake Quinault,** on the lake's real clock. Its places are the menus: the screen door to plan, the shed for your gear, the car to drive, the fire bowl for trip reports, the register post, the mailbox for settings.
- **The trip, backpacking's own way.** Plan at the map table. Make the town run to Port Angeles: the ranger desk at the WIC, where Ranger Jon issues the permit, the general store, the gear shop. Lay it all out on the deck (the flat lay) and share it. Drive out through Forks.
- **An empty shed, and money for the nice stuff** (decisions 41 and 42). A new hiker arrives in town clothes (jeans, a cotton tee and canvas sneakers, decision 67), the shed is otherwise empty and the wallet holds $0, so the first trip is the first shopping and every item in the first flat lay is your own choice. The basics are free; nicer gear costs money; the ranger desk lends the bear can. You earn at the burger drive-in, a quick flipping minigame, one shift a trip.
- **Two of the three stores, plainly.** The boutique, the moss crowd's store, arrives in M1b (S35a), as you chose (decision 48), with the other two jobs, the dish pit and the bookstore counter (S35b). So the first flat lay you play and share shows the Swain's-style and Brown's-style crowds, without the style side or the boutique's patterned outline.
- **The loop,** either way round, as a day or 1 to 3 nights or more, at any permitted camp, plus three camps you ask for at the WIC. The basin-or-crest fork with honest numbers, splits on the trail, and changing the plan.
- **Coming home:** the stamp at the car, the trip report, and the hot tub after a big hike.
- **Three minigames, and a job:** packing the bear can (Suika in a cutaway can), the alpenglow shot from the Divide, and huckleberries on the trail; flipping burgers at the drive-in in town, the takoyaki-style one.
- **Sound:** no music on the trail, only the place, your footsteps and any instrument you carried in to play at camp; a small synth band at home.
- **Old School:** the five death screens, the wipe at the cabin at dusk, and the Trail Register.
- **The first Larry moments:** the lockbox's locals' quiz, Heart Lake, the IPA, the permit check.

**Right after M1a: the High Divide Loop FKT** (T1), both ways round, against the clock, with a ghost of your best. **Then M1b, with the Hike of the Day** (T2): the rest of the Sol Duc side, Lake Morgenroth by phone, Lake Crescent's low trails, and a daily one-shot on today's real National Weather Service forecast, opening at sunrise over the Olympics (decision 49), on preview. **Right after M1b: the world board** (T4), with server-held dice, and the Hike of the Day goes public on main with it, never without it (decision 53).

**When.** Counted in build sessions of a few hours each, not in dates.

| After session | On your phone |
|---|---|
| 1 | The High Divide drawing itself in (shipped) |
| 2 | Two icons, offline, a bug-report button; every word gets an id |
| 6 | Sample trail stops to judge the look, with the first sounds |
| 7 | The cabin at Lake Quinault, on preview |
| 15a | A whole rough trip, from the cabin to the trip report |
| 20 | The checkpoint: a full trip with the can, end to end, or the cut ladder starts (8.3) |
| 28 | M1a, for your playtest (the 32nd session counted) |
| 31 | The High Divide Loop FKT (the 35th counted) |
| about 46 | M1b, Lake Morgenroth and the Hike of the Day on preview (about the 51st counted) |
| about 48 | The world board, and the Hike of the Day on main (about the 53rd counted) |

**Honest about the count.** Session numbers are labels. Four of M1a's sessions are split in two (S12, S14, S15 and S24 each have an a and a b; S14b is the burger drive-in), so the M1a playtest after S28 is **the 32nd session counted. That is the target; about 32 to 37 is likely,** and every later number moves with it. Every session has a floor, what ships even if the rest slips, and a pre-agreed cut ladder moves things to M1b rather than letting M1a sprawl (8.3). That is about thirteen more than the old plan's 19 to M1a: the cabin and the flat lay, the three minigames and the first job, the sound and the text system are new work, and doc 15 now counts them inside M1a, the same way.

**How we work.** You said it on 2026-10-09 (decision 66): *"I don't want to cut any corners this is my great American novel so to speak. OURS MY FRIEND! But i also do want you to be able to just churn and chain and do your thang"*. So:
- **Sessions run back to back,** without waiting for a go.
- **No session counts as done until its *Done when* passes in full:** tests, lints and goldens green (a failing check is fixed, never skipped); screenshots at the iPhone SE, 17 and Pro Max sizes looked at; independent reviewer agents over the session's diff, with their fixes in; committed, pushed to preview and logged in `BUILD_LOG.md`. A part that needs your phone is logged as owed until you've checked it, and the work goes on (8.1).
- **After each session you get a short note:** what changed, a screenshot and something to try, with any new batch on the review page, to answer whenever suits you (10.7).
- **Work stops and waits only for** a milestone playtest, a design call that is yours (building continues around it), anything outward-facing (money, accounts, sharing) or your "hold" (8.1). Main shows only approved words.

**Your words decide what reaches the main icon** (decision 21). Every line of English is a draft with an id until you approve it. Preview shows drafts, marked; main shows only your words. Sessions never wait for you: each one sends its new lines as a batch and moves on (10.7). So you can play M1a on preview the day it's ready, and it reaches main as fast as its words become yours.

**How you'll play it.**
1. In Safari, open **ophiker.com**.
2. Tap Share, then **Add to Home Screen**, before your first trip. Home Screen apps keep their own saves, separate from Safari.
3. Play from the **OP Hiker** icon. Once it shows its *Works offline* stamp (your words, B001), it runs with no signal. Open play always does; the Hike of the Day, once it's public, needs a signal while you play it (decision 53).
4. Work in progress lives at **ophiker.com/preview/**. Add it too: it becomes a second icon, *OP Preview* (your words, B001), and its saves never touch the main one.
5. A new build installs itself in the background. Before the cabin exists, the title page shows your update note, *A new version is ready.*, with its *Restart* button (B001); from S7 the note lives in the mailbox, whose flag goes up. iOS doesn't look for updates while an installed app sits paused, so swipe it closed and reopen it if you're waiting for one.

**When something's wrong.** Five quick taps on the small build stamp (on the title page now, in the mailbox's settings once the cabin arrives) open a hidden menu. Tap **Copy bug report** and paste it into a GitHub issue or a Claude chat. The error sheet has the same button. No Mac is ever needed. Issues on this repo are public, so keep your friends' names and your GPX out of them, and send those in a chat.

**What we need from you now: nothing blocks session 2.** You said the frame is set (decision 65), B001 went out on the review page before S2 and you've answered it, so S2 applies your answers. Helpful whenever you're ready:
- **Your verdict on the look** at sessions 5 and 6.
- **The rest, any time** (9.1): the three stores' and the three jobs' names, the Boyz, Jon's quirk and his OK (by S28), your Morgenroth track.
- **When the world board's session comes** (S47): a Cloudflare account on Workers Paid (about $5 a month) and the GitHub secrets, about ten minutes, and which PG-13 words handles may use (decision 53, Lead call 36).

### 1.1 Session 1, as shipped: what carries over and what changes

Session 1 shipped the repo skeleton, the picture VM, the palette, crisp scaling, the draw-in, the cover plate, the title page, the build tools and 41 tests (`design/BUILD_LOG.md`). `npm run ci` passes from a clean checkout. It also showed that a session can push a workflow file: Session 1 pushed `pages.yml` itself (commit `73929d4`), so the paste-it-yourself fallback (6.1) may never be needed.

**What carries over, unchanged in spirit:**

| Piece | Files | From now on |
|---|---|---|
| Picture VM v0 | `web/js/gfx/picvm.js` | Draws the cabin, the flat lay and every scene |
| Palette and remaps | `palette.js`, `palette.json`, `tokens.css` | Gains pseudo-colors 26 `steam` and 27 `alpen` (4.7) |
| Crisp scaling | `gfx/display.js` | As is, whole-CSS-pixel fix included |
| Draw-in | `gfx/drawin.js` | The cabin draws itself in at first launch |
| The cover | `cover_high_divide_dusk.pic`, the fir stamps | The loading art only; the daily's picture stays the trailhead under the day's sky (doc 9.9, 11.7) |
| Font | Pixelify Sans (OFL) | As is |
| Tools | `build`, `lint`, `pics`, `png`, `render-pics`, `serve` | Grow: the text fill, the text and sound lints (10.5, 13.4) |
| Tests | 41 unit tests, a reproducible build | As is, and the suite grows (6.6) |
| Deploy | `.github/workflows/pages.yml` | Gains preview (S2) and the data branch (T1) |
| The build id | Commit date and short SHA | The rules hash joins it in `version.json` (S3) |

**What changes:**

| Piece | Now | Becomes |
|---|---|---|
| The title page | `index.html`, `ui/shelf.js` | The cabin home (S7), in `ui/home.js` (lead call 11) |
| Its words | 13 strings typed into HTML and the manifest | Ids in `content/text/` (S2); main keeps only the two approved, plus B001's answered lines (1.2) |
| Flags | `storybook: false` | `gentle: false` (lead call 11) |
| README, `package.json` | "picture-book" | De-booked in S2; they are docs, not game text (doc 18.2) |
| The update notice | "a new edition" (planned) | Your update note and its *Restart* on the title page (S2, B001), then the mailbox's flag (S7) |

BUILD_LOG's open question 2, *keep "a picture-book trip" under the title?*, is answered by decision 22: it goes.

### 1.2 Session 1's words, and the batches that replace Batch 1

The live site carries 13 strings of original English (doc 18.11). Two are yours already (decision 35). **None of the rest stays on main past S2,** as you agreed (decision 64): taking a line off asks nothing of you, so main never carries words you haven't approved, and the book words go with them (decisions 21 and 22). Preview keeps them all, marked as drafts, until they are answered or retired. B001, answered before S2, fills the places main still needs with your own words.

| Id | Now | From S2 |
|---|---|---|
| `app.name` | Olympic Peninsula Hiker | Approved (decision 35) |
| `app.short_name` | OP Hiker | Approved (decision 35) |
| `app.description` | A picture-book hiking trip... | B001's approved line, applied in S2 |
| `title.name_small`, `_big` | The name over two lines | Stays: your approved name; retires with the title page |
| `title.tagline` | a picture-book trip | Off main |
| `alt.cover_high_divide_dusk` | The cover's description | Off main (empty alt: the cover is decoration beside the name); B002, as the loading art's |
| `title.start_label` | Bookshelf | Off main: the section's label is `app.name`; retires |
| `title.begin` | Begin a new book | Hidden on main (it does nothing yet); retires |
| `title.begin_note` | The trail opens soon. | Hidden with the button; retires |
| `app.install` | Before your first book... | B001's approved line, applied in S2 |
| `title.build`, now `app.build` | Edition {build} | The bare build code, no word (B001: looks fine) |
| `app.upright` | This book reads best held upright. | A turn-the-phone glyph, with B001's line in your own words, applied in S2 |

**So main, from S2, shows your approved name, the cover, glyphs and B001's lines, and no other English.** Install works the iPhone's own way (Share, then *Add to Home Screen*, Apple's labels), and B001's install line says so in Safari; this page's *How you'll play it* says how.

**Why the old Batch 1 goes.** The doc's first plan asked you to reword the title page. The title page is going, so wording it would spend your time on a screen nobody will see. Instead:

- **B000** records decision 35's two lines and decision 47's two Credits lines, each with its decision as your answer.
- **B001 · The app's frame** (10 lines): the description, the install line, the upright line, the *works offline* stamp, the update note, the error sheet's line and buttons, the preview icon's name, and the bare build code for a look. It went to the review page on 2026-10-09, before S2, once you said the frame was set (decision 65), and you answered it the same day, then revisited it that evening: the description, the install line and the upright line in your own words, the update note as *A new version is ready.* with a new *Restart* button, *Restart* for the error sheet's button too (the last two settled in chat), and the rest as drafted (`content/text/review/B001.answers.json`, doc 18.11). S2 applies the answers.
- **B002 · The cabin** (about 30 lines, from S7): the places' names, the porch rail, the next-step button, the cabin's alt text, the name over the cabin, the cover's alt text as the loading art.
- **B003 · The lockbox and the guest book** (about 53 lines, from S7): the locals' questions and answers, read as a set, and the one-life line. Over decision 64's 25 to 40 by the creator's OK: one pool, one batch (doc decision 64); and over the 45 first OK'd, sent as one set all the same, by the creator's OK to let it run long (doc Lead call 46).

You chose this (decision 64): Session 1's unapproved lines leave main in S2, rather than staying up until they're answered.

---

## 2. The repo, file by file

One rule shapes it all: `web/js/engine/` is pure (no DOM, no timers, no `Math.random`, no clock), so Node runs the same files the phone runs (doc E.1, E.2). Code ships exactly as written. Only the data and the words are compiled.

E.5 names some files `data/`, `rules/`, `stores/`, `drive/` and `people/`. Here they all live under `content/`, so there's one content root.

### 2.1 Root and GitHub

| File | What it is |
|---|---|
| `README.md` | How to play and install; how to develop. Docs, not game text (doc 18.2) |
| `package.json` | `"type": "module"`; the scripts in 6.5 |
| `package-lock.json` | Pins TypeScript, the one dev dependency (S3) |
| `jsconfig.json` | `checkJs`, `strict`, `noEmit` for `tsc`, over the page code with the DOM lib |
| `jsconfig.worker.json` | The same for `sw.js` and `worker.js` with the WebWorker lib, since the two libs conflict in one project |
| `.gitignore` | `dist/`, `site/`, `out/`, `node_modules/`, and track files: `*.gpx`, `*.fit`, `*.tcx`, `*.kml`, `*.kmz` |
| `config/flags.json` | `gentle: false`, `larry: true`; the channel is stamped in at build |
| `design/BUILD_LOG.md` | Five lines a session, plus the batch line (8.1) |
| `.github/workflows/pages.yml` | Builds both channels, checks them, adds the data branch and `/e/`, deploys, and keeps the assembled site on the `site` branch (6.3) |
| `.github/workflows/preview-push.yml` | A push to `preview` asks `pages.yml` to run (6.4) |
| `.github/workflows/checks.yml` | The same checks on PRs and other branches; no deploy |
| `.github/workflows/nightly.yml` | The sim matrix, calibration, coverage, balance diff |
| `.github/workflows/shots.yml` | iPhone-size WebKit screenshots: for the sizes you don't own, and for every batch of words (10.7). Playwright WebKit is pinned inside the workflow, never in `package.json` |
| `.github/workflows/daily.yml` | T1 in shadow mode, T2 for real: the morning job, with a data-only deploy (6.8) |
| `.github/workflows/board.yml` | T4 (S47-S48): the nightly static top 100; the Worker checks results itself (14.4) |
| `.github/ISSUE_TEMPLATE/bug.md` | "Paste your bug report here" |

### 2.2 `web/`: what the phone loads

| File | What it is |
|---|---|
| `index.html` | App shell: `viewport-fit=cover`, `format-detection telephone=no`, `black-translucent` status bar, font preloads with `crossorigin`. It carries ids, not words: `data-t` attributes the build fills in (10.3) |
| `manifest.webmanifest` | Generated at build from the `app.*` ids, one per channel, each with its own `id`, `start_url: "./"` and `scope: "./"` |
| `sw.js` | Per-channel service worker, its first line stamped with the build id and channel (3.3). Precaches with `cache: 'reload'`, audio included (13); updates wait for the cabin. Main's worker passes `preview/` through, and preview's passes `review/`. Neither caches a redirect |
| `icons/` | 180 px touch icon (opaque), 192, 512 and maskable; a preview set |
| `fonts/` | Pixelify Sans (shipped), an EGA 8x14 font (CC BY-SA) for the chrome, and a plain OFL serif for the Plain font, each with its license. Source TTFs in `tools/fonts/` for T02's metrics |
| `css/tokens.css` | The 16 colors as custom properties; sizes in device pixels |
| `css/game.css` | The stop frame, Sierra box, choices, sheets, the cabin's rail, the short-screen layout |
| `js/main.js` | Boot: register the worker, load the build's data, restore the autosave, open the cabin or the trail |
| `js/text.js` | `t()`, `tx()` and `drawText()`; preview's draft marks and the line inspector (10.3) |
| `js/fmt.js` | Numbers, times and dates from the approved `fmt.*` tokens, never the phone's locale |
| `js/worker.js` | Web Worker for the look-ahead and the Trip Outlook |

### 2.3 `web/js/engine/` (pure)

| File | What it is |
|---|---|
| `rng.js` | sfc32; `hash(seed, stream, key)`; the streams of E.8, `mini` included |
| `math.js` | Deterministic exp, log, pow and trig as build-time tables, so Node and Safari roll alike |
| `expr.js` | The card expression language: parse, type-check, compile, fixed whitelist |
| `template.js` | Templates and slots (`{name}`, `{gear:tag}`, *they*); lines by id, never words |
| `content.js` | Loads the build's data; id lookups |
| `index.js` | Card facet index (built at compile time) |
| `graph.js` | Directed park graph; router by hiking time, with `via` pins and spurs |
| `calendar.js` | The calendar rule from the conditions date, seasons, weekdays, dated conditions |
| `clock.js` | One integer-second clock in every mode; the 15-minute tick runs pro rata (T0, doc E.12) |
| `log.js` | The complete action log and its canonical form: varint-packed, hashable, compressible (T0) |
| `standard.js` | The timed modes' standard hiker, runner, shed and pantry. Reads nothing from the Open hiker |
| `plan.js` | Itinerary model, the twelve fills, the 4.6 validator, the plan's notes, desk requests |
| `permit.js` | Quota and desk rolls, the WIC's loaner can, the 104 counter, fees, the day-use line; a daily's permit by day number |
| `stores.js` | The three stores' shelves, Fill from the list per store, the receipt; basic and nice, and the wallet (11.7) |
| `jobs.js` | The town jobs: one shift per job per trip, pay from a shift's result into the wallet (11.7) |
| `pack.js` | The four limits, slots, hard blocks, pack tags (6.5), load ratio, the worn place; the can's fit from the bear can |
| `food.js` | Menus, rationing, the canister's food liters |
| `weather.js` | Synoptic chain, zone weather, thunder and fog, forecast against actual; from T2, read from the day's file |
| `daylight.js` | Sun and twilight times from the precomputed table |
| `movement.js` | The 7.4 pace formula, way-trail and steep-descent terms, ETAs against dark; running from T1 |
| `body.js` | The meters and the night model (7.9); the runner's fuel and water from T1 |
| `knowledge.js` | Ranges that blur and sharpen (8.6) |
| `odds.js` | Base plus labeled modifiers, bands, ♦, fatal shares rounded up, two-band night rolls; hands ranges and the worst-hands fatal share (doc 17.2) |
| `lookahead.js` | Compound-choice bars and the Trip Outlook |
| `director.js` | Fills beat slots: forced first, weighted draw, novelty, budgets, Larry caps, minigame budgets |
| `cards.js` | Evaluates a card: eligibility, choices, rolls, outcomes |
| `effects.js` | The effect vocabulary: meters, time, gear, flags, route, score, Leave No Trace |
| `queue.js` | Delayed consequences, chains, foreshadow flags |
| `trace.js` | The cause trace behind Field Notes and GAME OVER (8.13) |
| `people.js` | Strangers, rangers, and at most one Boy a trip |
| `voice.js` | Stop text from cards and pools, by id; quiet stops; the hiker's log for the trip report (was `narrator.js`, lead call 11) |
| `score.js` | Score, the itinerary maximum, the Leave No Trace ledger; trail hours and the tub's "big" rule (doc 2.2) |
| `report.js` | The trip report's facts: stats, splits, headlines, gear notes, conditions |
| `death.js` | `hiker_dies` (was `book_ends`): cause key and variant, the register write, the wipe |
| `register.js` | Best trips, *Remembered* (timed deaths tagged), the Boyz' lines, dead ids, the counter |
| `timed.js` | From T1: one shot, the clocks, par, splits, streaks, DQ, styles, stashes |
| `save.js` | Snapshot plus action log plus profile snapshot; the timed and attempt keys (doc E.6) |
| `migrate.js` | Save-format migrations between builds |
| `step.js` | `step(state, action) -> { state, screen }`, the one entry point |
| `phases/*.js` | One per phase: lockbox, guestbook, home, plan, permit, town, flatlay, drive, trailhead, day, camp, night, finish, report, soak, death; `fkt` from T1, `daily` from T2 |

**`engine/mini/`** (pure; doc 17.15):

| File | What it is |
|---|---|
| `mini/core.js` | The 120 Hz tick, integer helpers, the input format, `run()` |
| `mini/can.js`, `alpen.js`, `berries.js`, `burgers.js` | M1a's four cores, six functions each: the three trail minigames and the burger drive-in (12.1) |
| `mini/tables.js` | Build-time integer tables: light curves, slope sines, surges |
| Later | `descent.js` (T1), `arrest.js`, `tent.js`, `dishes.js` and `books.js` (M1b), `ford.js` (M2), `clams.js` (your call) |

### 2.4 `web/js/gfx/`

| File | What it is |
|---|---|
| `picvm.js` | Runs compiled picture ops into per-layer index buffers (shipped) |
| `compose.js` | The scene composer: layers 1-11 from a recipe and the place's seed; the cabin's states as overlays |
| `palette.js` | Time-of-day, weather and drained remaps; cycles; lights (shipped, grows) |
| `display.js` | Whole-number device-pixel scaling, one `drawImage`, at most 3 canvases (shipped) |
| `drawin.js` | The 800 ms draw-in; a tap finishes it (shipped) |
| `sprites.js` | Sprites at scene anchors, poses from state, the censor bar |
| `type.js` | Bitmap letters into the picture buffer (YOU PERISHED) |
| `dissolve.js` | The Leave No Trace dust, and the wipe at the cabin (doc 11.10) |
| `round.js` | Round sprites pre-rasterized for the fat pixel (the bear can) |
| `flatlay.js` | The flat lay's layout: zones, right angles, gutters; the same kit always draws the same picture |
| `shareimg.js` | The 1080 x 1350 share images: the flat lay, the trip report, the timed cards |
| `png.js` | A browser twin of `tools/png.mjs`, writing indexed PNGs with `CompressionStream` |
| `alt.js` | Alt text built from the layers, by id |

### 2.5 `web/js/ui/`, `audio/` and `platform/`

| File | What it is |
|---|---|
| `ui/app.js` | Screen router (`#` routes); `replaceState` on a trip; Back opens ≡ |
| `ui/h.js` | The 40-line DOM helper |
| `ui/frame.js` | The trail stop: status line, picture, caption, strip, box, choices, toolbar |
| `ui/textbox.js` | The Sierra message box; the ▾ continuation |
| `ui/choices.js` | Choice buttons, odds tags, the (i) square, ♦ confirm, the hand glyph |
| `ui/sheet.js` | Bottom sheets: Why, Ranger's Note, look-ahead numbers |
| `ui/compass.js` | The compass roll |
| `ui/look.js` | Hotspot taps and Look boxes |
| `ui/strip.js` | The pencil strip and the splits |
| `ui/home.js` | The cabin: hotspots, the rail, the next-step button, states, the live clock (was `ui/shelf.js`) |
| `ui/lockbox.js`, `guestbook.js` | First launch: the locals' quiz, then a name |
| `ui/maptable.js`, `map.js` | The map table: three questions, presets, the itinerary sheet; the park map |
| `ui/permit.js` | The permit form, *Take it to the desk*, and the desk's *Issue it* |
| `ui/town.js` | The town street, the WIC counter and the job doors |
| `ui/store.js` | One store screen, three skins |
| `ui/flatlay.js`, `slots.js` | The flat lay; the slot picker and the canister panel |
| `ui/tailgate.js` | The last look at the trailhead |
| `ui/camp.js`, `fork.js` | *Make camp* and the evening tiles; the fork card |
| `ui/finish.js`, `report.js`, `soak.js` | The stamp at the car; the trip report and its share card; the soak |
| `ui/death.js`, `register.js` | The five death screens and the wipe at the cabin; the Trail Register |
| `ui/toolbar.js` | Pack, Map and Log |
| `ui/mailbox.js`, `credits.js` | Settings; Credits, the ranger's reading (doc 12.20), the sounds' credits |
| `ui/debug.js`, `errors.js` | The hidden debug menu, Copy bug report, the replay self-check; the error sheet |
| `ui/mini/host.js`, `card.js` | The 120 Hz loop and input capture; the card, the live odds line and the result line |
| `ui/mini/can.js`, `alpen.js`, `berries.js`, `burgers.js` | One renderer each |
| `ui/peak.js`, `handle.js` | From T1: the FKT boards; your handle |
| `ui/chalkboard.js`, `crew.js` | From T2: the Hike of the Day; crew boards |
| `audio/engine.js` | The context, unlock, session type, buses, limiter, interruptions (13.3) |
| `audio/dsp.js` | Pure synthesis, which runs in Node too, like the picture VM |
| `audio/scape.js`, `steps.js`, `music.js` | Place, hour and weather into layers; footsteps and the walk-on; the cabin band, a bar ahead |
| `platform/storage.js` | localStorage and IndexedDB under `oph.<channel>.`; `persist()` |
| `platform/sw-client.js` | Worker registration; `registration.update()` at launch and on every return to the foreground; the update note (on the title page until S7, then the mailbox's flag); the offline stamp |
| `platform/share.js` | Clipboard, the share sheet with files, the press-and-hold fallback, Export and Import |
| `platform/now.js` | The real Pacific clock for the cabin. UI only: the engine never reads it |
| `platform/net.js` | From T1: the data branch's files, fetched past the cache and checked by hash; from T4, the daily's rolls from the Worker (14.4) |

Session 1's planned `platform/audio.js` square-wave sequencer is replaced by `audio/`.

### 2.6 `content/`: everything authored

| File | What it is |
|---|---|
| `AUTHORING.md` | The Authoring Brief: schema, six exemplar cards, the voice rules (doc 2.3), lines by id, fairness |
| `scope/m1a.json` | What this milestone ships, the shows-and-hides switches (3.6), and a `main` block: the screens main carries (10.6) |
| `park/regions/*.json` | Normalized graph from ingest (generated; never hand-edited) |
| `park/overlays/sol_duc_high_divide.json` | Hand patches only where the research is silent |
| `park/conditions/2026.json` | Dated closures and news, told as "last we heard" |
| `park/vocab/hazards.json`, `zones.json` | About 30 canonical hazard tags; zone and elevation-band rules |
| `park/permits.json` | Quotas, windows, desk requests (70% midweek, 40% weekends), ranger visits, the permit check |
| `trips/sol_duc.json` | The twelve fills and the day loop, with `via` pins |
| `gear/items.json` | The catalog's items with night-model stats, the new store items, and the four new fields: `origin`, `look`, `bombproof`, `style` (doc 5.7); and each item's basic-or-nice flag (Lead call 29) |
| `gear/tag_rules.json` | Items to event tags |
| `food/items.json` | The food catalog, the beer and the new store foods, each basic or nice |
| `stores/stores.json` | The three stores' placeholders, shelves by catalog id, the cooler; Second Growth from M1b; the three jobs' placeholders, `{JOB_DRIVEIN}` in M1a and `{JOB_GASTROPUB}` and `{JOB_BOOKSTORE}` from M1b, with their doors |
| `drive/routes.json` | The cabin to Port Angeles (about 3 h) and to the Sol Duc trailhead through Forks (about 2 h 10); from M2, the Hoh by the Upper Hoh Road, which leaves US 101 south of Forks (about 1 h 30, an estimate to measure, doc 3.3) |
| `home/cabin.json` | The cabin's places, hotspots, states, props and the next-step rules (11.2) |
| `rules/tuning.json` | Every knob: score budgets, skills 0-5, the Leave No Trace cap, the tub's 8 trail hours, the worn switch |
| `rules/mods.json`, `macros.json` | Shared modifier sets; shared effect bundles |
| `rules/kits.json` | The ranger's sensible kit by zone and month; the two presets; the town clothes a new hiker arrives in (decision 67); the test kits |
| `rules/standard.json` | The timed modes' standard hiker, runner, shed and pantry (T0 stub, filled in T1) |
| `data/climate.json`, `daylight.json` | Zone x month weather; sun and twilight times |
| `data/quinault_sun.json` | The cabin's sun and twilight for every day, for the lake's center (11.2) |
| `cards/**` | Cards by family and place; they hold ids, never English (10.2) |
| `death/causes.json` | Cause keys, variant order and dice tags; the lines themselves are ids |
| `lore/quotes.json`, `credits.json` | Drawable epitaph lines with credits; Credits data and Wood's book list |
| `quiz/locals.json` | The lockbox's twelve sourced questions |
| `people/boyz.json` | `{BOY_n}` placeholders, quirks, register entries, tub lines, guest-book signatures |
| `people/rangers.json` | The WIC ranger and the patrol ranger |
| `text/**` | Every line of English, the ledger and the batches (10.2) |
| `audio/**` | The cue bank, listening maps, scores, the license log, masters and encoded files (13.2) |
| `mini/*.json` | Each minigame's tuning values (12) |
| `fkt/routes.json` | From T1: each route's waypoints, splits, support points, `stash_ok` places |
| `daily/library.json` | From T2: the Hike of the Day's routes, slots, seasons and weather anchors |
| `art/palette.json`, `recipes.json`, `pics/**` | 16 colors, remaps, cycles, lights; place to recipe; the `.pic` files |

### 2.7 `schemas/`, `tools/`, `sims/`, `test/`

| File | What it is |
|---|---|
| `schemas/*.schema.json`, `vars.json`, `tags.json` | One schema per content file; expression variables; the one event-tag list |
| `tools/ingest.mjs` | `design/data` to `content/park`, the gazetteer, and the ingest report |
| `tools/build.mjs` | Validate, compile, index, fill the words, check the sounds, lint, scope, hash (shipped, grows) |
| `tools/lint.mjs` | The F.3 rules; `--fix` for safe mechanical fixes, never on approved lines |
| `tools/schema.mjs`, `fontmetrics.mjs` | A small JSON Schema validator; advance widths for T02 |
| `tools/png.mjs`, `render-pics.mjs`, `pics.mjs` | PNG encoder; `.pic` to PNG at the phones' pixel shapes and contact sheets (shipped) |
| `tools/text.mjs` | `count`, `check`, `batch` and `apply` (10.4, 10.7) |
| `tools/shots.mjs` | WebKit screenshots at iPhone sizes, with numbered badges for batches |
| `tools/audio.mjs`, `listen.mjs` | Fetch, master, encode and log sounds; render a scene to WAV, a spectrogram PNG and a loudness reading (13) |
| `tools/bench.mjs`, `play.mjs` | The card bench; a trip as text or HTML, and `--replay bug.json` from the report's own commit |
| `tools/sim.mjs`, `tune.mjs`, `coverage.mjs` | The harness on worker threads; tuning suggestions; coverage |
| `tools/review-site.mjs` | The review site for you (was the review book) |
| `tools/new-card.mjs`, `preview.mjs`, `assemble-site.mjs`, `serve.mjs` | Card scaffolds; the preview build; main at `/`, preview at `/preview/`, the data branch's files; a local server |
| `tools/daily.mjs`, `daily-push.mjs` | From T1 (shadow) and T2: the morning job, the standby calendar (14.3) |
| `tools/site-overlay.mjs`, `daily-live.mjs`, `keep-awake.mjs` | From T2: the data-only deploy, *live* as the commit point, the schedule's enable call (6.8) |
| `tools/verify.mjs` | From T2: replays a crew result or, in the Worker from T4, a board result |
| `sims/bots.mjs`, `bots/mini/*.mjs` | The seven trip bots, the runner bots from T1; careless, par and careful minigame bots |
| `sims/matrix.m1a.json`, `loadouts/`, `assertions/sol_duc.json` | The plan library; kits; research lines as tests |
| `test/unit/*.test.mjs` | `node --test` unit tests (6.6) |
| `test/golden/**` | The doc's numbers, frozen replays, timed runs, minigame streams, synthesized cues |
| `test/fixtures/` | A tiny frozen build for engine goldens; from T2, a recorded NWS response |

`dist/`, `site/` and `out/` are build output and never committed to `main`; the assembled site is kept only as the single force-pushed commit of the orphan `site` branch (6.1).

### 2.8 iPhone Safari rules the shell follows

Most are in doc 12.1, E.7 and E.10. They're collected here because each one, missed, is a bug the agent can't see without your phone.

| Rule | Why |
|---|---|
| Pad with `env(safe-area-inset-*)`; size with `100dvh`; `overscroll-behavior: none`; `touch-action: manipulation`; `-webkit-text-size-adjust: 100%` | The notch and home bar, the moving toolbar, the rubber band, double-tap zoom, text that grows on rotation |
| In landscape, the upright plate (its words are in B001) | iOS ignores the manifest's `orientation` |
| Text inputs (the guest book, the epitaph, your handle, the bug-report note) at 16 CSS px or more; keep the field in view with `visualViewport` | Smaller inputs zoom the page; the keyboard covers a fixed layout |
| `font-kerning: none`, no hyphenation, `letter-spacing: 0` | So Safari wraps lines as T02 measured; the ▾ continuation is the backstop |
| Copy bug report builds its JSON synchronously inside the tap | iOS refuses a clipboard write after an `await` |
| A share image is rendered when its screen opens, so the tap calls `navigator.share` at once | The same rule as the clipboard: no slow work between the tap and the call |
| Sound unlocks on `touchend` or `click`, never `touchstart`; `navigator.audioSession.type = "ambient"` where it exists | `touchstart` can be a scroll; ambient respects Silent Mode and mixes with the player's own music (13.3) |
| A bug report stays under 60,000 characters | GitHub's issue body limit is 65,536 |
| The report records the raw user agent, screen size and pixel ratio | Installed apps omit the Safari token |
| The engine never reads the device clock or locale; the cabin's real clock lives in `platform/now.js` | The calendar runs from the conditions date, and CI runs in UTC |
| Minigame canvases set `touch-action: none` and stamp touches by `event.timeStamp` | No scroll or zoom mid-play; ticks, not frames, decide (12.1) |
| Hide the *Add to Home Screen* line when `navigator.standalone` is true | It's already installed |

---

## 3. The data build

### 3.1 The pipeline

```
design/data/   research, read-only
  regions/*.json  park_rules.json
  gear + food catalogs  lore/
        │ tools/ingest.mjs
        ▼
content/park/regions/*.json
  + gazetteer + overlays
  + conditions
  + everything authored
  + content/text, audio, mini
        │ tools/build.mjs
        │ validate ▸ compile exprs
        │ ▸ index cards ▸ compile
        │ pics ▸ fill the words ▸
        │ check the sounds ▸ lint
        │ ▸ scope ▸ hash
        ▼
dist/data/build.<hash>.json
dist/text/en.json  dist/audio/
dist/precache.json  version.json
dist/** = web/ copied as is
```

### 3.2 Ingest

`tools/ingest.mjs` reads all seven region files, `park_rules.json`, both catalogs and the lore files, and applies every rule in the doc's E.4 table: merge shared ids, synthesize reverse segments, derive null gains, map 65+ hazard words to about 30 tags, move statuses into the dated overlay, recompute itinerary miles from the graph, and let `park_rules.json` win over stale region text.

- **Its output is committed,** so every change shows up as a reviewable diff. CI re-runs ingest and **fails if the output differs**, so the output is byte-stable: sorted keys, fixed number formatting, no timestamps.
- **It writes the gazetteer,** `content/text/names/places.json`: every real place name a screen may show, with its source. Lint T16 checks screens against it (10.5).
- **Your Strava link is gone from the source already** (2026-10-08: the region file now says *firsthand: game creator*), and ingest strips any that come back, unless you say it may stay (9.1).
- The ingest report lists every fix and every doubt, in CI and in the session.
- Lore: only lines marked `page_image_checked`, with a public-domain reason and a URL, reach `content/lore/quotes.json`. Any Robert L. Wood line fails the build.
- Research ideas that still conflict with your decisions are dropped and reported; the catalog's retired `journal_points` stat is dropped.

### 3.3 Build

`tools/build.mjs` does, in order:
1. **Validate** every content file against its schema.
2. **Compile** card expressions to checked syntax trees; the phone turns each into a closure the first time it's used.
3. **Index** cards by facet (node, hazard, zone, band, month, hour, weather).
4. **Compile pictures** from `.pic` text to compact op arrays.
5. **Fill the words** for the channel being built (10.6). Main takes each line's words from the ledger, and an element whose line main's scope doesn't carry is left out of main's page (Session 1's button and its note, the tagline and the old *Bookshelf* label, 1.2; the description, the install line and the upright line carry B001's words); preview takes the working words. It writes `text/en.json` (id to words, nothing else), fills `index.html`'s `data-t` ids and generates the manifest.
6. **Check the sounds:** every shipped audio file's hash against the license log (lint A03, 13.4).
7. **Lint** (the F.3 rules, the text rules and the sound rules; 6.7).
8. **Scope:** keep only what `content/scope/m1a.json` names, and on main only the screens its `main` block carries. The whole park graph is still linted.
9. **Hash.** The **rules hash** covers the engine's code and the data it runs (doc E.12). The **build id** covers every file in `dist/`, code included, and is stamped on `sw.js`'s first line, so any change to what ships reaches an installed app. `version.json` carries both, with the commit SHA (recorded, not hashed).
10. **Copy** `web/` into `dist/` unchanged, except for the channel stamp.

M1a's data is about 100 KB gzipped (doc 14.1 gives about 150 KB for all of M1). Its audio is about 2 MB, cached for offline with everything else, inside the 5 MB precache limit.

### 3.4 What M1a ships

| Source | M1a ships | Waits |
|---|---|---|
| `sol_duc_high_divide.json` | The loop's 47 nodes and 49 segments (98 directed), two of them, the Hoh Lake Trail's from Hoh Lake past C.B. Flats, shared with `hoh_olympus` (S4's ingest; first counted here as 47); its 21 camps; the trailhead; Hoh Lake down its side trail; the desk-request camps Bruce's Roost, Cat Basin and Hidden Lake; the off-menu lakes as map Looks only; hazards, wildlife, dated conditions and `m1a_play_inputs`. Five segments are map-only and unroutable: the four off-trail links and the Long Lake to Morgenroth way trail | Mink Lake, Little Divide, Appleton Pass, Long Lake and Sol Duc Lake, Morgenroth, Lake Crescent's trails (M1b) |
| `south_quinault_skok.json` | Nothing to play. The cabin uses only the lake's center, for its sun and weather | Its four low trails (T3) |
| The other five regions | Ingested and linted only | M2 on |
| `park_rules.json` | Summer permits and desk requests; quotas; canister rules and the WIC loan; fires; LNT; the M1a weather inputs; overdue and rescue patterns | Tides, winter rules |
| `gear_catalog.json` | About 60 items: the packs, the kits, the 18 traps, joy items, towel, trowel, earplugs, canister rentals and the WIC's loaner can; the general store's and gear shop's new items (S4, 11.3); each item basic or nice (Lead call 29) | Glacier gear; the boutique's items (M1b); the running kit (T1) |
| `food_catalog.json` | About 37 foods, the beer, the general store's new foods, each basic or nice | The pre-roll and the boutique's treats (M1b) |
| `lore/` | Drawable lines for the cold, fog, lightning and `dark_fog` decks, and the general pool; Wood's book list; a few cleared facts about the loop | Most history |
| `quiz_locals.json` | All twelve questions, for the lockbox | Your own, if you send some |

### 3.5 Data fixes: done at the source

Every fix the data check asked for has landed in `design/data/`, each estimate flagged `estimate: true` with its evidence (`data/M1A_DATA_CHECK.md`, Resolution). S4 ingests them as they stand.

| Fix | Where it is now |
|---|---|
| Bogachiel Peak shortcut | `through_route: false` and a `spur` block on both summit segments |
| Thunder and fog odds | `park_rules.json` `climate.m1a_weather_inputs`, tuned against the death caps in S27 |
| Thin weather inputs | The same block: Quillayute's chain, Buckinghorse, ridge wind, Sappho 8 E, 2027 daylight |
| Group and stock sites | `camp.group_site` and `camp.stock_site` on every Sol Duc camp |
| Night-model numbers | `gear_catalog.json` `night_model_stats` |
| The beer | `beer_hazy_ipa_16oz`, with the M1b pre-roll: 88 foods |
| The dark deck | Split into `dark_fall` and `dark_fog` |
| Popularity and odds | `m1a_play_inputs`: quotas, desk requests, rangers, the permit check, traffic, the no-canister visitor |
| Place fields | `m1a_play_inputs.places` for all 47 loop nodes |
| Kits | `loop_in_a_day_3l` and `day_gear_TRAP_no_canister` |
| Dated news | `conditions_2026`, with `from`, `until` or `persists`, and `last_confirmed` |
| The quiz | `quiz_locals.json`: twelve questions, each with a source |

**New data tasks, from the new direction** (each in the session that needs it):
- **The stores' new items** (doc 5.7): the general store's and gear shop's go into the catalogs at the source in S4, flagged as estimates; the boutique's in S35a. Calories for the new foods come from real labels before ingest.
- **Basic or nice** (Lead call 29): every item in both catalogs gets the flag at the source in S4. Basic is the plain, serviceable version of each essential, mostly on the general store's shelves, and free; nice is everything else, at its `price_usd`. The boutique's items get theirs in S35a.
- **The camp instruments** (decision 62): `melodica` and `guitar_dreadnought`, a full-size dreadnought from a fictional maker, joined `gear_catalog.json` on 2026-10-09 beside the harmonica and the ukulele, with weights and sizes from `FACT_CHECK.md`. Which shelves sell them is the doc's (5.7).
- **The WIC's loaner can** (Lead call 33): the doc settles it: the desk always has one to lend, so a hiker with no can and $0 is never stranded (doc 3.1, 5.1, 5.8). On 2026-10-09 the catalog's `canister_wic_loaner` availability stats became 1.0 and its `rentals` note says so, with the WIC's own *"occasionally run out over exceptionally busy weekends"* as the real-world note (`FACT_CHECK.md`, 2026-10-09). The desk's can is never rolled at planning (doc E.8).
- **The running kit** (doc 9.11): a 12 L vest, 500 mL soft flasks and folding poles, in S29.
- **The cabin's sun table** for the lake's center, computed in S4 the way `daylight.json` is, to the second, since the daily opens at that day's sunrise (Lead call 34). From T2 the morning job publishes each date's opening instant (14.3); before that, T1's FKT week opens at Monday's sunrise from this same table, so no phone computes a sunrise.
- **The B.2 golden seed,** with Lunch Lake open on both nights (about a 4% draw), found and frozen in S10.

### 3.6 What M1a shows and hides (lead call 3)

The scope file holds each switch, and the lint checks it. This is doc 15's table, plus the plan's own rows.

| Thing | In M1a |
|---|---|
| The WIC's phone number and its hotspot | Hidden until the call (M1b); the cabin's wall phone is only a Look |
| Month chips | August and September only (June to October from M1b) |
| *Ask at the desk* rows | Bruce's Roost, Cat Basin and Hidden Lake, taken to the WIC on the town run; Long Lake and Sol Duc Lake as pencil rows |
| Drive chips: The Huckleberry Skillet, The Steaming Fern Lodge | Hidden until M1b |
| Second Growth's door; the boutique; the dish pit's and the bookstore's doors | Hidden until M1b; the general store's beer cooler and the burger drive-in's door are in |
| The Bonfire Lily | Weight 0 everywhere until M1b |
| Walk out (the known-ground summary, 3.4), trip codes, the gear-list CSV | M1b |
| The cabin's spring, autumn and winter; the real moon; the crew; the wool blanket | M1b (S37). The easter eggs decision 54 names wait for the Boyz' yes |
| The chalkboard and the peak | Looks only; the peak opens with T1, the chalkboard with T2 on preview, and on main with T4 |
| Hike it again | Shown; it copies the permit. First on the cut ladder (8.3), so it may move to M1b |
| The WIC on the town run | Every overnight Open trip stops at the desk (decision 40, doc Lead call 12): Jon issues the permit, the briefing, the loaner can for a hiker without one (Lead call 33) and the three desk camps |
| Money | The wallet and the basic-or-nice split; one job, the burger drive-in (Lead call 32) |
| The gentle mode | No screen at all; every `hiker_dies` carries its `modes.gentle` override, linted |
| Minigames | The bear can, the alpenglow shot, huckleberries, and the burger drive-in in town; the clam shovel on the shed is a Look (decision 61: a shovel, never a clam gun) |
| Settings (the mailbox) | Odds, Text, Trail stops, Sound, Music, Minigames, Park; Export, Import, Credits, the ranger's reading |
| Sound | The trail's places and footsteps, the loop's animals, gear and the flat lay, thunder and the hush, the death cues, the cabin band, the camp tunes of the instruments you carry in, the three minigames and the burger drive-in |

---

## 4. The art for M1a

### 4.1 The palette (option B, from the mockup)

Fixed at every hour. Dusk, blue hour and night are remaps inside these sixteen (doc 11.1, 11.4). Shipped in Session 1, and lifted a few shades lighter in S6 (doc decision 68): each color's OKLab lightness L becomes L + 0.18 × (1 − L)², hue and chroma kept, so the darks lift most and snow and paper cream barely move. The table shows the lifted sixteen; option B's first hexes are in doc 11.1, as first recorded.

| # | Name | Hex | Use |
|---|---|---|---|
| 0 | Ink | `#343945` | Outlines, text, night |
| 1 | Night navy | `#394862` | Dusk sky, deep water |
| 2 | Slate | `#4d698a` | Day sky top, far ridges |
| 3 | Glacier blue | `#93b7cd` | Sky, lakes, the cabin's chairs |
| 4 | Snow | `#f2efe6` | Snow, message box |
| 5 | Paper cream | `#e9dab6` | Paper, trails, stars, chalk |
| 6 | Alpenglow pink | `#e49d8d` | Dusk sky, heather, the peak at dawn |
| 7 | Bonfire gold | `#ebb53d` | The lily only |
| 8 | Rust | `#ce6937` | Hiker's jacket, the fire bowl |
| 9 | Brick | `#9b4a39` | Box border, pack, ♦, cedar siding |
| 10 | Bark | `#6d4f3d` | Trunks, logs, bear, siding |
| 11 | Spruce | `#345148` | Conifer shadow sides, the roof |
| 12 | Forest | `#3f6c55` | Conifers, the tub's shade |
| 13 | Moss | `#749353` | Meadow, moss, the tub |
| 14 | Sage | `#aabb8d` | Sunlit meadow, gravel, autumn maples |
| 15 | Teal | `#4a8a85` | Rivers, hazy mid ridges, tub water |

M1a uses no gold at all: the lily and its gable-window sketch arrive in M1b. The picture lint fails color 7 anywhere but the lily's own files.

### 4.2 The picture format

Pictures are small text programs, AGI-style (doc 11.3), at 160x168 (tall plates 160x320; the flat lay 160x240). Each layer draws into its own buffer, so a fill can't leak between layers. Shipped in Session 1.

| Command | Meaning |
|---|---|
| `C n` | Pen color (0-15, or a pseudo-color 16-27) |
| `L` / `R` | Absolute or relative polyline |
| `F x,y` | Flood fill |
| `D a b pat` | Two-color dither fill (checker, checker25, checker12, hlines, vlines, diag, brick) |
| `B` / `S` | Brush shape and size; stamp the brush |
| `T id x,y` | Place a stamp, optionally flipped (depth 4 at most) |
| `Z id x,y,w,h` | A Look hotspot, or one of the cabin's places |
| `@ layer` | sky, far, mid, near |

```
@ far
C 2  L 0,62 14,50 41,38 58,52
     95,30 126,36 159,44 159,63
     0,63
D 3 15 checker  F 70,58
@ mid
T subalpine_fir 18,88
Z meadow 0,96,160,72
```

Composed scenes are recipes in `art/recipes.json`: a base, a skyline, seeded props, a feature, season and weather overlays, sprites at anchors, and hotspots with alt text (by id).

### 4.3 Hand-drawn scenes and plates

Fourteen hand-drawn scenes and plates for M1a, plus the shipped cover. The Lake Crescent road is first to fall back to a composed scene if time runs short.

| Scene | Size | Shows on | Session |
|---|---|---|---|
| Cover: the High Divide at dusk | Plate | Loading art | 1 (shipped) |
| The basin from the rim | 160x168 | The rim, the fork | 5 |
| The cabin at Lake Quinault, August | Plate | Home, at every hour | 7 |
| The town street | 160x168 | Town | 11 |
| The WIC counter | 160x168 | The briefing, desk camps | 11 |
| A store interior, two skins | 160x168 | The general store, the gear shop | 11 |
| US 101 along Lake Crescent | 160x168 | The town run | 11 |
| The deck boards | 160x240 | The flat lay | 12 |
| The bear can, cut away | 160x168 | The can minigame | 13 |
| The drive-in's grill, from above | 160x168 | The burger job | 14b |
| The car at the trailhead | 160x168 | The tailgate, the finish stamp | 15 |
| Olympus across the Hoh | Plate | First view from the Divide; the alpenglow shot | 16 |
| Sol Duc Falls | 160x168 | Landmark, stay on trail | 18 |
| Heart Lake | 160x168 | Camp, the swim | 23 |
| The soak | Plate | The tub, after a big hike, with a can on its edge (decision 46) | 25 |

Gone with the book: *The End: a book on a dashboard*, the pack spread (the flat lay replaces it) and the single store. M1b adds Lake Morgenroth, the Bonfire Lily plate, the boutique's skin, the dish pit and the bookstore counter, and the cabin's other seasons.

### 4.4 Composed scenes

| Part | M1a set |
|---|---|
| Biome bases (7) | Trailhead, montane old growth, river valley, subalpine meadow, lake basin, crest, road |
| Skylines and landmarks (10) | Olympus from the Divide; the Bailey Range; the Hoh valley; Bogachiel Peak; the Divide wall from the basin; Sol Duc valley ridges; Deer Lake's ridge; the stone staircase; Mirror Lake's shelf; Heart Lake Junction |
| Features | Lake (cycling), creek and small falls, river (cycling), footbridge, privy, shelter, trail sign, cairn, snowfield patch, camp overlay |
| Weather | Rain, drizzle, fog bands, cloud on the crest, thunderhead and flash, stars and the moon's phase |

The drive from the cabin is one composed road screen on a route already driven, and two to five composed road scenes the first time (doc 3.3).

**The art scales to the whole park** (doc decision 69): the composer has to reach every place at the hand-drawn plates' quality, not just the loop. A separate prototype is exploring real skylines from public-domain USGS elevation data, real water shapes from USGS hydrography, kits for each vegetation zone and the hand-drawn hero plates as style anchors. The composer's design (doc 11.7) and this section are updated once the prototype is judged; until then the M1a set above stands.

### 4.5 Every loop place, and its recipe

| Place | Base | Far and features |
|---|---|---|
| Sol Duc trailhead | Trailhead | Old-growth wall, sign, car, kiosk; register box on the death screens |
| Sol Duc Falls Camp, Canyon Creek #1-#3 | Montane | Creek, footbridge, camp |
| Deer Lake | Lake basin | Forest edge, Deer Lake's ridge |
| Potholes | Meadow | Ponds on a heather bench |
| Lunch, Round, Clear lakes | Lake basin | The Divide wall; Lunch's privy |
| Mirror Lake, way-trail junctions | Lake basin, crest | Mirror Lake's shelf, cairn |
| Bogachiel Peak and its junctions | Crest | Olympus, Bailey Range, Hoh valley |
| High Divide, Heart Lake Junction | Crest | Olympus, Hoh valley, sign |
| Hoh Lake | Lake basin | The Hoh valley falling away |
| Bruce's Roost, Cat Basin, Hidden Lake | Crest, meadow, lake | Bailey Range; forest rim |
| Sol Duc Park | Meadow | Shelter, privy, valley ridges |
| Lower Bridge Creek | Montane | Bridge, cold pools |
| Sol Duc Crossing to River #1-#4 | River valley | Bridges, river cycle |
| Trail segments | By zone | Seeded props, the place's own seed |

### 4.6 Stamps and sprites

- **Trail stamps (about 30):** subalpine fir, mountain hemlock, western hemlock, Douglas-fir trunk, western redcedar, snag, krummholz, three boulders, talus, nurse log, sword fern, heather, lupine, huckleberry (with ripe and unripe berries for MG3), avalanche lily (never gold), the register box (lid open and closed), the ranger's flat hat.
- **The cabin's stamps** (doc 11.11): the cabin, the shed, the tub with and without its cover, the fire bowl cold and lit, an Adirondack chair, the chalkboard, the register post, the mailbox (flag up and down), mole hills, a bigleaf maple, a Sitka spruce, route signs, the race bib (T1), the clam shovel (decision 61). The tents, cooler, dog, Jon's hat and badge on the hook (decision 46) and the lily sketch wait for M1b.
- **The flat lay's stamps:** about 80 top-down ones (doc 6.1): about 60 items, 8 packs and 12 food groups, style twins by palette swap. S12 draws the sensible kit's, and S26 finishes the rest.
- **The hiker** (7x18): idle, sit, shiver, kneel, wave, swim; sitting in a chair and soaking in the tub at the cabin. The rust jacket for everyone.
- **The pack:** day, mid, big; pad roll and pot outside.
- **The tent:** pitched, sagging in rain, glowing at night.
- **Animals:** black bear, black-tailed deer, Olympic marmot, Canada jay (with a tortilla, or with shorts), American dipper (two frames).
- **People:** a ranger in a flat hat; other hikers in teal, slate and moss (a Boy is one of these until you name him); trail runners; the shopkeepers; the car.
- **The censor bar** and **the remains**, as before (doc 11.6).

### 4.7 Palette tables and cycles

- **Remaps** in `art/palette.json`: day, dusk (also dawn, at the cabin), blue hour, night, overcast, storm, a two-frame lightning flash, and the drained death-box table. S6 re-tunes dusk, blue hour and night by eye on the renders for decision 68's lighter sixteen, so night stays clearly night, never grey, while the trees, the lake, the trail and the ridges read (doc 11.4).
- **Cycles in M1a:** lake (16), falls (17), river (18), fire (20: the stove and the fire bowl), stars (22), rain glint (23), lamp (24: windows, lanterns, the antenna light), dust (25, renderer only), **steam (26)** off the lit tub, and **alpen (27)** for the alpenglow shot's light.
- **Lights** (lamp, stars, fire, steam, dust) resolve after the remap, so they stay bright at night.

### 4.8 How art gets made and checked

1. Write the `.pic`. For the cabin, from doc 11.11's written brief only: no photo is traced, copied or committed. Public-domain photos of the park (NPS, USGS, CC0) may be used as reference for the trail's scenes, kept private and never committed (doc decision 69).
2. `npm run render` draws it to PNGs in every palette and a contact sheet, at the phones' own pixel shapes (7x4 on 3x phones, 4x2 on the SE) and at square 4x.
3. The agent opens the PNGs and critiques them beside panel B of `design/art/style_options.png`.
4. The picture lint runs: unknown stamps, out-of-bounds points, a fill over 60% of a non-sky layer, deep stamps, hotspots off the canvas, gold, and on the cabin, any hit area under 44 x 44 pt on any device row of doc 11.2's table (the SE's 4x2 is the worst: 22 columns by 44 rows).
5. You judge the look on your phone at S5 and S6. Nothing past the first two scenes is drawn in volume until you have; the cabin (S7) is the first scene after your verdict.

---

## 5. The content for M1a

### 5.1 Cards: about 58, about 160 choices

The doc says about 50; the extra cards are the chains the fair death paths need. **Cards hold ids, never English** (10.2): each card's lines live beside it in `content/text/en/cards/`.

| Kind | Cards | M1a examples |
|---|---|---|
| Landmark | 7 | Sol Duc Falls (stay on trail), Deer Lake, the rim, the stone staircase, Bogachiel Peak, Olympus from the Divide, Heart Lake |
| Fork | 3 | The basin or the crest (one card, three place patches); the light going amber; the day-hike turnaround |
| Hazard | 9 | Showers; fog on the crest; fog on the Mirror Lake way trail; thunder on the crest (♦); off trail in fog near a cliff (♦); footing; the dry crest; bugs; blowdown |
| Encounter | 7 | Bear in the huckleberries; deer after salt; a Canada jay; cougar sign at Deer Lake; kind strangers; a Boy's tip; a Boy's trade or warning |
| Discovery, joy | 6 | Dipper; marmot on a rock; meadow flowers; huckleberries (opens MG3); alpenglow (opens MG2); a quiet old-growth stop |
| Camp | 5 | Pick a site; Make camp; the evening tiles; food away at bedtime; a full camp |
| Night | 4 | A cold night (a ♦ when bagless); a visitor; rain on the tent; a still night |
| Chains, crisis | 5 | The Cold chain; a damp evening; dark coming, no headlamp; thirst on the crest; food running short |
| Delayed, aftermath | 3 | Hot spots to blisters; the bear that learned; creek water to a bad stomach |
| Larry | 3 | Heart Lake and *Crack the IPA* (tiles); the permit check (dealt) |
| Town, drive, trailhead | 3 | Lake Crescent on the town run; the general store's ID check; the register kiosk |
| Endings | 3 | Finished; Sooner Than Planned; the Hard Way |

Every card is linted, benched under six loadouts and read in transcripts before it ships (5.8).

### 5.2 The Larry moments (doc 2.6, decision 18)

| Moment | What gets built |
|---|---|
| The lockbox | The locals' quiz moved to the cabin's key lockbox: three questions from twelve sourced ones, once per phone, before the guest book (S7) |
| Heart Lake | *Swim (brr)*: feet, shorts, or all the way; the censor bar; the jay (about 1 in 4, food in a pocket); a Boy on cue; the towel; at dusk with no towel, the Cold chain (S23) |
| The IPA | The general store's cooler (21+, the ID check), canister liters, *Crack the IPA* at camp: spirits, buzzed -5, dehydration, -2 °F, the empty as trash (S11, S23) |
| The permit check | A dealt Larry card on legal nights (capped); the forced, uncapped off-permit ranger uses the same card (lead call 5) (S23) |

All of them: overnight trips only, never the walk-out day, nothing near the car and nothing anywhere in the cabin scene, where the car is in frame (lint T05, and A07 for sound). The one drink at home is a can on the tub's edge in the soak, a plate of its own with no car in it (decision 46). `flags.larry` is on in every build.

### 5.3 The death sequence pieces

| Piece | M1a content |
|---|---|
| Death boxes (4) | Lightning on the Divide (Appendix D 18b); fog near a cliff; a cold night and the Cold chain; the skinny dip (doc 2.6) |
| Ranger's Notes | One per box, naming the prevention |
| The drained picture | One more lookup table |
| YOU PERISHED | Bitmap EGA letters at double size, snow on ink |
| The dissolve | Remains sprite, dust stream, about 7 s, tap to skip, a cross-fade under Reduce Motion |
| The epitaph screen | Register box (lid open); a 40-character field; the dice with credits; *Leave it blank* |
| GAME OVER | The card, with a black register mark (▌), the Ranger's Note and the route map |
| The wipe | *Back to the cabin* (DRAFT), one confirm, then the cabin at dusk: the trip reports and route signs go to dust, and the guest book opens (doc 12.25) |
| Sound | The sting, the dirge (Chopin, our own arrangement), the dust's hiss, the dice, the pencil, the cabin theme's first bar for GAME OVER (A5) |

### 5.4 Cause lines

All DRAFT. *YOU PERISHED* and *Leave No Trace* are your own words, and still get your tap in context (doc 18.2).

| Key | Line (DRAFT) | When |
|---|---|---|
| `lightning` | *You have died of a thunderstorm.* | Stayed on the crest in a storm |
| `fog` | *You have died of the fog.* | Off trail in fog near a cliff |
| `fog`, after dark | *You have died of the dark.* | The same, after dark with no headlamp |
| `cold` | *...of skinny dipping.* | Skinny dip at dusk, no towel |
| `cold` | *...of cotton.* | Else, wet cotton in the trace |
| `cold` | *...of a long, wet night.* | Else, rain |
| `cold` | *...of a cold, clear night.* | Else, a clear sky |
| `cold` | *...of the cold.* | Otherwise |

The first match wins, in that order (doc 9.5). Every line starts *You have died of* and fits 40 characters. `causes.json` holds keys, variants and ids; the words are in `content/text/en/death.json`, and a register entry keeps the words it showed.

### 5.5 Epitaph sources

- **From** `lore/quotes_public_domain.json`, verbatim, `page_image_checked`, with a public-domain reason, source and URL. No Wood line, ever. They are *quotes*: no approval needed, still yours to veto, and T16 checks exactness.
- **Decks:** cold 35, fog 37, lightning 37, and `dark_fog` 37 for *...of the dark.* Every key is well over the minimum of 8. M1b adds a deck for `fall`'s snow variant with self-arrest (S38).
- **Order:** the death's own tags first, then the general pool; shuffled on the trip's text stream, so the same death deals the same lines.
- **Rules:** at most 40 characters as printed; no death, injury or named person; a line with a caution is dealt only for the causes it names.

### 5.6 The words

About **2,200 lines for M1a** (doc 18.9), every one drafted with an id and a context note in the session that builds its screen, and sent to you in that session's batch (10.7).

| Area | Lines, roughly | Drafted in |
|---|---|---|
| The app's frame, the cabin, first launch | 90 | S2, S7 |
| Screens: plan, permit, town, flat lay, trail, camp, report, settings | 260 | S5-S15, S25, S28 |
| Cards: setups, choices, outcomes | 800 | S9, S16, S18, S19, S23, S24 |
| Place text, Looks | 225 | S18, S19 |
| Pools: sky, quiet stops | 200 | S18, S19 |
| Item notices | 160 | S18, S19 |
| The WIC, the two stores, the wallet | 120 | S11 |
| Death, the register, Larry moments | 110 | S23, S24 |
| Alt text, formats, the minigames and the burger drive-in | 210 | Throughout; the minigames' words as a batch of their own (decision 64) |

### 5.7 The Boyz, placeholders only

- `people/boyz.json` holds `{BOY_1}` to `{BOY_4}` (four until you tell us), `{BOY_n_QUIRK}`, `{BOY_n_TUB}` and `{BOY_n_GUESTBOOK}`, a jacket color each, and their lines.
- Each has one *Remembered* register entry: a fictional place, a date before 2026, a score, a *died of* line and a funny epitaph, both at most 40 characters.
- Cards name a Boy by id, so your real names drop in without touching a card.
- A lint fails any Boy name that isn't a placeholder until you send real ones. No session may invent or guess a name.
- Credits carry your two approved lines, *"A work of fiction. Real people appear with permission."* and *"Not affiliated with the National Park Service."* (decision 47). The first is true only once every Boy, Jon among them, has agreed, so a release build refuses it until then, and it reaches main only once everyone who appears there by name has agreed; that is the job `{BOYZ_CONSENT}` used to do, and the placeholder retires. The crew's dates at the cabin are `{BOYZ_DATES}` (M1b; decision 46).
- **Near-universal** (decision 34): every Boyz or 104 egg is a Look or a cosmetic, never a function, and a stranger never meets the word Boyz or an explanation of 104 (doc 2.2).

### 5.8 The authoring loop (doc 14.4)

Per batch of about 25 cards: ingest, scaffold stubs, write against `content/AUTHORING.md`, lint to zero, bench each card, render new pictures, simulate and read the targets report, read about 20 transcripts, then build the **review site** at `/preview/review/` (ophiker.com/preview/review/). Every line on it is marked draft or approved, and the words go to you in the session's batch.

---

## 6. GitHub Actions and CI

### 6.1 Branches and channels

| Branch | Channel | Address |
|---|---|---|
| `main` | Stable | `/` (https://ophiker.com/) |
| `preview` | Preview | `/preview/` |
| `sNN-topic` | Session work | Checks only, no deploy |
| `daily` | Data, from T1 | `/daily/` and `/fkt/` |
| `site` | The last good assembled site, one commit, force-pushed | Not served itself; the morning job deploys from it |

- **The addresses are at the root of `ophiker.com`** since decision 36. Session 1 shipped under the old `/104-boyz/` project path on github.io, which now forwards to `ophiker.com`.
- **Session branches merge into `preview`** by PR, once green.
- **`main` moves at promotions:** S2 (the machinery, and B001's lines), S6 (the look), the cabin (once B002 and B003 are answered), S28 (M1a), S31 (T1), the end of M1b, and S48 (the Hike of the Day, only with the world board, Lead call 36). You can say "hold" at any of them. Between promotions, a PR that touches only `content/text/` may carry newly approved words to main at any time (10.6).
- **The main branch is not the main channel.** The one deploy runs on `main`, so S2's code lands there; but the main channel's build carries only the screens whose words are yours (10.6).
- **The `daily` branch** holds data, never code, and is never merged: the FKT week files from T1, the day files and `standby.json` from T2 (14.2, 14.3). The rules archive is not in git: `/e/` is carried forward from the live site, and each version is kept for good as a Release asset on its `rules-<hash>` tag (14.2).
- **The `site` branch** is an orphan holding one commit, the last good assembled site, force-pushed by every full deploy, so it never grows. The morning job overlays the day's data on it and deploys that, with no app build (6.8).
- **Workflow files need their own permission.** GitHub refuses a push that adds or changes a file under `.github/workflows/` unless the pusher may change workflows. Session 1's push of `pages.yml` went through, so this is likely fine; if a later push is refused, the session hands you the file to add from the GitHub website on your phone, about two minutes.
- Storage, caches and service workers are namespaced by channel (`oph.main.*`, `oph.preview.*`), so the two icons never share saves.

### 6.2 The workflows

| Workflow | When | Does |
|---|---|---|
| `pages.yml` | Push to `main`; on request | Build and check both channels, add the data branch and `/e/`, assemble, deploy, and keep the assembled site on `site` |
| `preview-push.yml` | Push to `preview` | Asks `pages.yml` to run on `main` |
| `checks.yml` | PRs; other branches | `npm run ci`, no deploy |
| `nightly.yml` | On request in M1a; nightly from M1b | Sim matrix, calibration, coverage, minigame targets, balance diff |
| `shots.yml` | On request; every batch; S5, S6, S28 | WebKit screenshots at iPhone SE, 17 and Pro Max sizes |
| `daily.yml` | From T1 in shadow mode; from T2 for real: every 10 minutes, 3:03 to 4:23 am Pacific | The morning job, with a data-only deploy (6.8) |
| `board.yml` | From T4 (S47): nightly | Writes the static top 100 to `daily`; the Worker checks results itself (14.4) |

**Why the dispatch.** GitHub Pages publishes one artifact as the whole site, and its `github-pages` environment deploys from the default branch. So the deploy always runs on `main` and checks out `preview` itself. A push made with the workflow's own `GITHUB_TOKEN` starts no new workflow run, but `workflow_dispatch` is the documented exception ([GitHub Docs, GITHUB_TOKEN](https://docs.github.com/en/actions/concepts/security/github_token)). That is how a preview push, and later the morning job, gets the site rebuilt.

**When something is red:**
- If main fails, nothing deploys, and the live site stays as it was. The morning's data-only deploy still runs: it never builds the app.
- If preview fails, main still deploys, and preview is rebuilt from the `last-good-preview` tag.
- If the text gate fails on main (T14), the promotion's report names the lines; main stays as it was.
- With no preview build yet, `/preview/` gets a one-line placeholder page.

### 6.3 `pages.yml` (sketch)

Session 1's file builds main only. S2 grows its build steps to this; the upload (`actions/upload-pages-artifact`, `path: site`) and the `deploy` job (`actions/deploy-pages`) stay as Session 1 wrote them.

```yaml
name: pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: write  # tags
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v5
        with:
          path: main
          fetch-depth: 1
      - uses: actions/setup-node@v5
        with:
          node-version: 22
      - name: Main channel
        working-directory: main
        env:
          CHANNEL: main
        run: npm ci && npm run ci
      - name: Preview channel
        run: node main/tools/preview.mjs
      - name: Assemble
        run: >
          node
          main/tools/assemble-site.mjs
      # upload site, as in Session 1
```

- `tools/preview.mjs` fetches only `preview` and the `last-good-preview` tag, shallowly (`git fetch --depth=1`), adds `preview` as a git worktree, runs `npm ci && npm run ci` there with `CHANNEL=preview`, and on success moves the tag; on failure it builds that tag; with no tag, the placeholder. No workflow fetches full history.
- `tools/assemble-site.mjs` puts main at `/`, preview at `/preview/`, and from T1 the `daily` branch's files under `/daily/` and `/fkt/` (a shallow fetch of that branch alone). It carries `/e/` forward from the `site` branch, adds main's current rules version if it is new, prunes versions past 45 days that nothing open names, and attaches a new version to a GitHub Release on its `rules-<hash>` tag. Then it force-pushes the assembled site to `site`.
- **Rules releases are held, from T2** (14.2): if main's rules hash would change, the deploy builds and tests, then waits for the morning job to release it before it bakes, so a day's players never meet a newer UI over an older engine. A word-only or UI-only deploy goes at once, and CI fails it if the rules hash moved. Before T2 a rules change deploys at once, and an FKT week keeps Monday's engine from the archive.
- The action versions are the floor as of this writing; the session that edits the file checks each one's current major and pins it.

### 6.4 `preview-push.yml` (sketch)

```yaml
name: preview-push
on:
  push:
    branches: [preview]
permissions:
  actions: write
jobs:
  kick:
    runs-on: ubuntu-latest
    steps:
      - run: >
          gh workflow run pages.yml
          --ref main -R "$REPO"
        env:
          GH_TOKEN: ${{ github.token }}
          REPO: ${{ github.repository }}
```

### 6.5 The checks

| Script | Runs | Blocks a deploy |
|---|---|---|
| `build` | Ingest check, data, pictures, the word fill, the sound hashes, precache (under 5 MB) | Yes |
| `lint` | The F.3 rules active now (6.7), the text rules and the sound rules | Yes |
| `typecheck` | `tsc --noEmit` over JSDoc types, once per jsconfig | Yes |
| `test` | Unit tests and goldens (6.6) | Yes |
| `sim:smoke` | 2,000 trips: crashes, dead ends, stuck states, determinism, every death fair; each minigame's par bot | Yes |
| `ci` | All five, in that order; on main, T14 too | Yes |
| `sim` | The full matrix (section 7) | No: reports |
| `shots` | iPhone-size screenshots | No: artifacts |
| `text:count`, `text:batch`, `text:apply` | The words' sessions tools (10) | No |
| `audio`, `listen` | Fetch, master, log; render a scene (13) | No; run in sessions only |
| `bench`, `play`, `render`, `review`, `serve` | Session tools | No |

No statistical gate runs per push, so a deploy never fails at random (doc E.9).

### 6.6 Unit tests

- **rng:** known sfc32 vectors; independent streams, `mini` included; `Math.random` throws inside the engine.
- **math:** deterministic functions match reference values. In `engine/`, the lint bans every `Math` function the spec lets engines approximate (`exp`, `expm1`, `log`, `log1p`, `log2`, `log10`, `pow`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`, `sinh`, `cosh`, `tanh`, `cbrt`, `hypot`) and the `**` operator. `sqrt`, `floor`, `round` and the like are exact and stay allowed. It also bans what differs between Node in CI and your phone: `Date`, `Intl` (`Intl.Segmenter` included), `toLocaleString` and its kin, `localeCompare`, and whatever leans on Unicode tables that can differ between Node's ICU and iOS: `String.prototype.normalize`, `toLowerCase` and `toUpperCase` (an ASCII-only helper does ids), and RegExp `\p{…}` property escapes. Everything the engine keys or hashes is an ASCII id; a handle is normalized in the UI and the Worker only, never in anything that feeds a seed or the rules hash. The calendar is whole-day integer math from the conditions date, **the clock is whole seconds** (T0; this replaces the old plan's whole minutes), and sorts compare code points.
- **clock and log:** movement, waits and minigame results add whole seconds at defined points; the canonical log round-trips byte for byte; the same log replays to the same final-state hash, in Node and, through the self-check (S3), in Safari.
- **fixtures:** a bug report becomes a frozen replay only after a scrub that swaps the hiker's name for `{HIKER}` and drops the note. Your hiker might share a friend's name, and the repo is public.
- **expr:** parsing, types, the whitelist; no loops, assignment or randomness.
- **odds:** exact bands for a seeded roll and a known p; fatal shares exact and rounded up; a blurred worst case never below the truth; the night roll's two bands; **hands ranges:** the worst-hands fatal share is never below any hand's true share.
- **graph:** shortest by time; `via` pins; spurs; doc 4.3's 24 M1a camps both ways; loops of 18.4 and 18.7 mi.
- **movement and daylight:** the 3.1 arrival times; Back to the car in about 3.9 h (B.6); the daylight table; the cabin's sun table for the lake's center.
- **pack:** B.2's kit; the three hard blocks; legal slots; the worn place on and off.
- **permit:** quota and desk rolls keyed by `hash(seed, date, camp)`; `104-` plus four digits; the counter survives a wipe; day hikes take no number; *Hike it again* copies the permit; a daily's permit is 104 plus its day number and never moves the counter (T2).
- **score:** 9.6's worked maximum (96); a day hike's maximum at *Start walking*; the Leave No Trace ledger stops at 100; **trail hours:** the High Divide loop 11.1 h (a tub), the Deer Lake overnight 4.6 h (no tub).
- **home:** the next-step button for every state in doc 2.2's table; a trip in progress opens on the trail; labels fade after first use.
- **save:** round trips; replay matches snapshot; every storage key and cache name has a channel prefix; the timed record survives an Open wipe.
- **wipe and import:** of the hiker, only the register entry survives a death, so the shed empties and the wallet goes back to $0, while the player's things stay (the tally marks, the race bibs, the 104 counter and, from M1b, the lily's sketch; decision 2); a half-done wipe finishes at launch; import refuses older saves and dead hikers; register merges never remove a line.
- **money:** a new hiker starts in town clothes (`kits.json` `presets.new_hiker`), worn and counted apart from the pack, with the shed otherwise empty and $0; every checklist row, the outfit and footwear rows among them, has a free basic at an open counter; changing into hiking clothes at a store replaces the town clothes, which go to the shed (decision 67); a basic item costs nothing and a nice one its `price_usd`; *Fill from the list* never spends past the wallet; a shift pays its base wage plus its skill bonus, once per job per trip, and *Auto* pays par; the timed modes have no wallet and no job door; a hiker with no can and $0 always leaves the WIC with one (Lead calls 29 to 33).
- **death:** cause-variant order; deck order fixed per trip; the caution filter; 40 characters; a timed death leaves the Open hiker's save untouched (T1).
- **gentle:** with the flag off, no trip can write to the register; every `hiker_dies` has its override.
- **words:** preview's built page carries Session 1's words; main's carries only the approved name and B001's answered lines; T10 catches a planted English string in JS, HTML, CSS and the manifest; the ledger round-trips and its hashes hold; no `tel:`; the `format-detection` meta in the shell.
- **minigames:** golden input streams replay to the same result in Node and Safari, at 60 and 120 Hz; a recorded session played live with injected 100 to 300 ms frame stalls replays to the same final-state hash; drags are sampled at one position every 4 ticks; each minigame's log stays under its budget (about 400 bytes compressed), and every library route's crew link under 2 KB; a pause is logged; no bot beats `best` or falls below `worst`.
- **timed modes:** a phone with no live file at the day's opening, sunrise over the Olympics as the index publishes it, plays the date's standby entry and computes nothing (Lead calls 20 and 34); *today* comes from the index's `Date` header, so a phone clock set a day ahead finds no day to pin; an attempt resumes on its pinned engine after an update; the previous rules version's engine runs under the new UI (14.2).
- **share images:** the flat lay's PNG is a golden built in Node from the font's bitmap atlas, with no canvas, and only palette colors; it carries the hiker's name (and leaves it off when the switch is off), *OP Hiker* and *ophiker.com* (decision 44).
- **sound:** `dsp.js` renders the dirge and the stings to the same bytes every time; the hush state follows the ♦ exactly.

### 6.7 Lint rules active in M1a

All of F.3 that touches M1a: references; the park graph; cards (schema, types, reachability, no dead ends, fuzzed odds, chains end, flags set); fair deaths; the death sequence; the epitaph dice; one death rule, one hiker, the people; Boyz placeholders; Larry caps; honest odds; coverage for the tags in play; economy; storage names; the picture lint.

**Text:** T02 fit at 375 x 667 and 393 x 852 with measured fonts; T03 the deny-list of real businesses, with Swain's, Brown's Outdoor and MOSS on it, and the three real places behind the jobs, Next Door Gastropub, Port Book and News, and Frugals (Lead call 30), matched as whole names in every spelling seen in print (*Next Door Gastro Pub*, *Port Book & News*, *Frugal's*) and as their web addresses, never as the bare words *next door* or *frugal*, which are ordinary English (`FACT_CHECK.md`, 2026-10-09); T04 no *Golden Glow*; T05 never near a car, and nowhere in the cabin scene but the soak's can (decision 46); T06 no phone links; **T07 no book words** in player-facing text, whole words, with only its allowlist of real things (doc F.3), which gains the bookstore job's stock and lines in S35b (Lead call 41); **T10 to T16**, the text system (10.5).

**Sound:** A01 to A09 (13.4). **Minigames:** a minigame's choice is ♦ if any branch can reach Serious anywhere in its hands range; no `hiker_dies` inside a minigame; no ♦ anywhere in a job's shift; the banned functions throw in `engine/mini/`. **Timed modes, from T1:** every disqualifying choice says so on its button; no real FKT athlete's name or time; the handle filter's reserved list.

The release-only rules (no placeholders, every line approved, and every Boy, Jon included, recorded as agreed, decision 47) apply to a tagged v1.0 build. T14 already holds main to approved words from S2, and main carries Credits' People line only once everyone named on main has agreed (5.7).

### 6.8 `daily.yml` (T2, sketch)

The morning job (doc 9.10). Its shadow version (fetch and convert only, publishing nothing) is written in S29, and the real one in S42.

```yaml
name: daily
on:
  schedule:
    - cron: '3-53/10 3 * * *'
      timezone: America/Los_Angeles
    - cron: '3-23/10 4 * * *'
      timezone: America/Los_Angeles
  workflow_dispatch:
permissions:
  contents: write
  actions: write
  issues: write
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  bake:
    runs-on: ubuntu-latest
    timeout-minutes: 25
    environment: github-pages
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 1
      - uses: actions/setup-node@v5
        with:
          node-version: 22
      - run: node tools/daily.mjs
      - run: node tools/daily-push.mjs
      - run: node tools/site-overlay.mjs
      # upload and deploy, as pages
      - run: node tools/daily-live.mjs
      - run: node tools/keep-awake.mjs
```

- **Nine runs a morning,** 3:03 to 4:23 Pacific, each idempotent: if today is live, it exits at once. The day opens at sunrise over the Olympics (decision 49, Lead call 34), never earlier than 5:17 am Pacific (12:17 UTC, in mid-June) and a little after 8:00 in winter, so the job and its 4:45 cutoff always come first, by half an hour at the least. A schedule can name an IANA time zone, so the times stay Pacific all year; they avoid the top of the hour, when GitHub says runs may be delayed or, under load, dropped; and **in a public repo, schedules stop after 60 days with no repository activity** ([GitHub Docs, events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)).
- **`daily.mjs` bakes on what's live:** it reads the live `version.json`, checks out `rules-<hash>`, and refuses unless `/e/<hash>/` answers. It first releases any held rules change (6.3). Then it picks, fetches, converts, smoke-tests and draws (14.3), writes the day's opening instant, and bakes one standby day 45 days ahead, with its own.
- **`site-overlay.mjs` deploys data only:** the `site` branch plus `daily/`, `fkt/` and `e/`. No `npm ci`, no tests: about a minute. It refuses to upload an NWS-sourced file for a day whose open has passed and that isn't live yet.
- **`daily-live.mjs` makes *live* the commit point:** it polls `daily/index.json?cb=…` until today's hash is listed. Not live by 4:45, `daily-push.mjs` deletes the unpublished NWS file and publishes today's standby day instead; the job's 25-minute timeout keeps the 4:23 run alive past 4:45 to do it.
- **`keep-awake.mjs`** calls `PUT /repos/{owner}/{repo}/actions/workflows/{id}/enable` for each scheduled workflow ([GitHub Docs](https://docs.github.com/en/rest/actions/workflows)), as [gh-workflow-immortality](https://github.com/PhrozenByte/gh-workflow-immortality) does. Unconfirmed, so tested first in S42: whether it resets the 60-day clock, and whether `GITHUB_TOKEN` with `actions: write` may call it (that tool asks for a personal token; if one is needed, it is a third secret for you, and the standby calendar covers the gap meanwhile).
- The data-only deploy shares the `pages` concurrency group with `pages.yml`, so the two never race, and a push by `GITHUB_TOKEN` starts no other workflow (6.2).

---

## 7. The harness and the balancing targets

### 7.1 How it runs

`tools/sim.mjs` runs the real engine headless on worker threads, about 0.2-0.5 ms a trip (doc F.2's estimate), not counting the look-ahead. Bots see only what you see: the shown %, the words, the ETAs and the look-ahead bars. If a sensible bot can't hit the targets from the screen, the screen is missing information, and that counts as a UI bug.

**The look-ahead is the cost.** One bar is up to 400 runs (doc 8.9), so a trip whose bot reads two bars costs a few hundred times a plain trip. So, in the harness:
- Bars are memoized by everything a bar depends on: the plan, the place, the day, the hour (to 15 minutes), what the hiker knows of the weather, and the body meters in bands.
- Bots read bars at 100 runs, not 400; a nightly check compares them with 400-run bars and reports any fork where a bot's choice would flip.
- Bots never open the Trip Outlook. The plan library fixes the plans.
- A real trip's cost is measured in S15b, and the matrix is sized from it.

**Bots:** Cautious, Steady, Bold, Reckless, Random, Joy-seeker and Oracle; the reference mix is 50% Steady, 25% Cautious, 15% Joy-seeker and 10% Bold. **Minigame bots** (careless, par, careful) play each minigame inside the trip; trip bots use Auto unless a test says otherwise. **The bear can's Auto is memoized** by a hash of the can and the queue (doc 17.7), since it is a physics search (about 20 positions per item, a second each, about 22 items): the matrix packs each menu once, not once per overnight, and the shopping gauge's careless and careful lines are precomputed per can and menu class at build time. **Runner bots** (Pacer, Racer) arrive with T1.

### 7.2 The M1a plan library

- The twelve fills, both ways round, the basin and the crest, each also run with the fork's other answer taken on the trail.
- Kits: sensible, skimpy, overpacked, cotton-and-hope, the day kit with 3 L and a headlamp, and the trap kit.
- Early and late August and September; weekdays and weekends; starts at 7, 8:30, 10 and noon (the drive from the cabin sets the start).
- Player-built variants: ±1 night, a layover, Potholes, Heart Lake Junction camp, Hoh Lake, the desk-request camps.
- About 3,500 plans x 1,000 runs. Hosted runners for a public repo have 4 cores, so at 1 ms a trip the matrix takes about 15 minutes, and at 2 ms about 30; if the measured cost is higher, it drops to 500 runs a plan or splits across two nights, inside the doc's 60-minute cap. Rare events run on about 12 plan classes at 50,000 runs each, with importance sampling under 1%.

### 7.3 Targets M1a must hit before you play it

From doc F.1, for the loop only:

| Plan | Happy finish | Rescue | Death |
|---|---|---|---|
| Sensible, August: all twelve fills, bot mix | ≥ 95% | ≤ 0.3% | ≤ 0.5% |
| Skimpy kit, August | 85-95% | ≤ 1% | ≤ 0.5% |
| Loop in a day, headlamp and 3 L | 60-85% | ≤ 3% | ≤ 3% |
| The trap: a day on day gear, noon, late Sept, Bold | ≤ 10%; trouble ≥ 80% | 10-35% | 2-10% |
| The trap, Cautious (turns back) | About 0%; nearly all Sooner Than Planned | ≤ 1% | ≤ 0.1% |
| Bail at the first fork | About 0% | About 0% | About 0% |
| Joy-seeker taking every Larry tile, sensible plans | Reported | ≤ 0.3% | ≤ 0.5% |
| Sensible, late September (shoulder) | ≥ 85% | ≤ 0.5% | ≤ 0.5% |

The shoulder-season row is reported in M1a and gates in M1b.

**Also required:**
- Zero unfair deaths: every death follows a confirmed ♦ with a shown fatal share, or a chain's end after two matching warnings, and a sure choice was on the screen.
- Zero deaths from a choice shown as `sure`.
- Zero crashes, dead ends and stuck states in 100,000 trips; the same seed and actions give the same trip twice.
- Rescues under 3% across the mix; deaths on the ranger's fills under 0.3%.
- 3 to 5 real decisions per moving day (median 4); at most about one ♦ per moving day on sensible plans.
- At least 90% of trips show a % choice; on sensible plans, at least one optional 60-90% choice a day.
- Stops per trip inside doc 3.5: a day 12-18, one night 25-35, two nights 45-60, three nights 60-75.
- A first trip from *Sign* in the guest book to *Start walking* in about 7 minutes, the can on Auto, from a scripted first trip (doc 3.6's one definition).
- The fork fires at the first way into the basin in each direction, and its ETAs equal the engine's.
- Every screen fits at 375 x 667 (T02).
- A moving day meets at most two minigames besides the evening shot (doc 17.5).

### 7.4 Golden numbers from the doc

Each becomes a test, so the doc and the engine can't drift apart (doc F.4):
- The 3.1 night list: River #4 11:25 am, Sol Duc Park 1:55 pm, Heart Lake 2:55 pm.
- 3.3: Sol Duc Park "about 1:55 pm, seven hours before dark".
- B.1's loop and fill miles: 18.4, 18.7, 20.4, 20.2, 20.6.
- B.2's pack: about 40 of 50 L, 29 lb, r 0.91, canister 6.6 of 9.8 L. The doc computed it with the worn place off; you chose worn clothes apart (decision 44), so the doc's B.2 is recomputed with the worn place on, and the golden with it.
- B.3's shown checks: 97%, 92%, 93%, 95%.
- B.6's fork: Heart Lake 4:30 by the crest, 5:00 through the basin, Back to the car in about 3.9 h.
- 12.21: `Score: 50 of 96`. 9.6's worked maximum: 96.
- Trail hours (doc 2.2): the loop 11.1, Lunch Lake and back 9.7, the Deer Lake overnight 4.6.
- The 7.9 and 8.13 night examples, from the catalog's stats.
- B.5's 98.3% and 91.8%, B.6's 0.2% crest share and the trap rows: regenerated, recorded and shown to you on the review site.

### 7.5 Reports

Every run writes a short summary the agent reads and the review site shows you: the targets table with intervals; failure reports naming the cards and modifiers behind bad outcomes; the ablation vector for map and compass, water capacity, bug kit, rain pants and the towel (it gates in M1b); and every flagged estimate the numbers rest on.

### 7.6 Minigame and timed-mode targets

Reported nightly, not gated (doc F.1):
- **The bear can:** the par bot at 85% ± 2 in all four cans; careless about 75%, careful about 92%.
- **The alpenglow shot:** Auto about 68, never ★★★.
- **Huckleberries:** Auto picks about half a quart at 85% ripe.
- **The burger drive-in:** the par bot earns the base wage plus the median bonus, *Auto* the same; a careful shift earns visibly more, and every shift pays at least the base wage. The pay is reported against the nice items' prices, so earning stays a small ritual, not a grind (Lead call 30; 11.7).
- **Every minigame:** no bot beats `best` or falls below `worst`, so the hands range on the button is never wrong.
- **From T1, the FKT:** a well-paced standard runner 5 to 5½ hours on the loop ↺ in fair weather; sensible runner bots finish at least 95%; Race-everywhere bots bonk or roll an ankle in more than half their runs; sloppy and perfect runs about an hour apart.
- **From T2, the daily:** the morning job's whole run fits its runtime budget well inside the 25-minute timeout (a test in S42; if it doesn't, route choice and the smoke test move to the evening before, on climatology, and the morning keeps only the forecast conversion and a smaller par run); the day's route passes the 2,000-run smoke test under the sensible-plan death cap; the gap between the worst and best minigame hands is at most about 10% of a typical daily's time; the forecast stays honest in the nightly binomial check.

---

## 8. The build sessions

### 8.1 Every session

0. **Apply your answers** from chat or the review page (`tools/text.mjs apply`), and commit the ledger (10.4).
1. Read `design/BUILD_LOG.md` and this session's entry.
2. Work on a branch; run `npm run ci` locally, fixing any failing check, never skipping it; look at the PNGs, transcripts, screenshots (iPhone SE, 17 and Pro Max sizes) and spectrograms; then have independent reviewer agents read the session's diff, and put their fixes in (decision 66; 1).
3. PR into `preview`; merge when green; confirm the live `preview/version.json` shows the new build id.
4. Append five lines to the build log (shipped, try this, next, questions, notes), plus one more: *Batch B00n, n lines*.
5. Tell you, in three to five lines, what changed, with a screenshot and something to try on your phone, and **send the batch** of the session's new words, 25 to 40 lines on the review page (decision 64; 10.7).

**Nothing waits on you, except four things.** A *Done when* that needs your phone never holds up the next session: your check is logged as owed, and the work goes on.
- **Your look verdict** (S5-S6) gates the cabin plate and drawing art in volume. If it's late, S8 and S9 go before S7, since they need no new art.
- **Your answers** decide what reaches main (10.6), never what gets built.
- **Your playtests** (S28, S31, S46, S48) gate the milestone exits.
- **Your Cloudflare account and the GitHub secrets** (about ten minutes) gate S47's start, and with it the world board and the Hike of the Day on main (8.6, 9.1).

### 8.2 Foundations and the look (M0, M0.5)

**S1 · First light** (shipped 2026-10-08)
- **Shipped:** the repo skeleton; `pages.yml`; the app shell, following 2.8; the picture VM v0; the palette with day and dusk remaps and the cycles; crisp scaling; the draw-in; the cover plate; the title page with the build stamp and the install line; Pixelify Sans; the manifest and icons; the PNG encoder, `render-pics`, `build`, `serve` and `lint`; 41 unit tests.
- **Carries over:** everything but the title page and its words (1.1).

**S2 · Two icons, offline, and every word an id**
- **Build:** the `preview` branch, the dispatch and the `last-good-preview` fallback; `checks.yml`; per-channel manifests, icons and service workers; offline caching and the *works offline* stamp; the update note and its *Restart* on the title page (B001); channel-prefixed storage and its CI test; the ≡ stub; the hidden debug menu (five taps on the build stamp, or `?debug=1`); Copy bug report with a share-sheet fallback; the error sheet; `persist()`; `tools/serve.mjs` serves at the root, as ophiker.com does, with its test, lint U01's message and the README updated (6.1, `BUILD_LOG.md`).
- **Build, the words:** the text system's core (10.1 to 10.6): `content/text/`, `t()`, `tx()`, the build's word fill and the generated manifest; the ledger with decision 35's two lines and decision 47's two Credits lines (recorded as B000); `tools/text.mjs` (`check`, `count`, `apply`); lints T07 and T10 to T14; preview's debug marks. Session 1's lines move in word for word, and **every unapproved one leaves main** (1.2, decision 64): the section labeled `app.name`, the cover's alt empty, the bare build code, and the button hidden. **B001's answers are applied** (`B001.answers.json`, through `apply`, never by hand): your description, install line and upright line (beside its glyph) take the old ones' places, and the offline stamp, the update note, the error sheet and the preview icon's name get your words too. `title.build` becomes `app.build`.
- **Build, the renames:** `flags.storybook` to `flags.gentle`; `ui/shelf.js` to `ui/home.js` (still the title page until S7); the README and `package.json` lose the book words and gain the OP Hiker icon.
- **You see:** two icons on your Home Screen; airplane mode still opens the game; a bug report pasted into a GitHub issue; on main, only the name, the cover and B001's lines; on preview with `?debug=1`, Session 1's lines underlined as drafts.
- **Done when:** the F.5 install, offline, side-by-side and bug-report checks pass on your phone; a planted English string in JS fails CI (T10); main's build passes T14 with only approved lines, and its page carries no English but `app.name` and B001's lines.
- **Words:** B001, the app's frame, went out before this session and is answered (decision 65), so main gets its lines with the worker, the cache and the dev-only debug menu. This session's own new lines, if any, are its batch.
- **The floor:** the preview channel, offline and Copy bug report. If the text lints don't fit, T12 to T14 move to S3; main can't change words before then anyway.

**S3 · The engine core, with T0's log**
- **Build:** rng and its streams, deterministic math and its bans (6.6), the expression language, templates by id, the content loader, `step()` and the phase skeleton; saves as a snapshot plus the **complete action log** in its canonical form plus the profile snapshot; the **standard profile** stub; the **rules hash** in `version.json`; `play.mjs --replay`, rebuilding the report's own commit; unit tests; TypeScript and `tsc`; the lint and harness skeletons; a 1,000-trip smoke run in CI. Also the debug menu's **replay self-check**, which replays the frozen golden trips in Safari and shows whether their hashes match Node's. Its result rides in every bug report, so every build is checked on a real iPhone's JavaScript engine, with no Mac.
- **You see:** on preview, a plain guest book (a name), then two stops at the Sol Duc trailhead. Close the app mid-stop, and it comes back to the same stop.
- **Done when:** a bug report copied on your phone replays identically in Node; the self-check reads *match* on your phone; the same seed and log give the same final-state hash twice.
- **The floor:** the rng and its streams, `step()`, the snapshot-plus-log save and the Safari self-check; TypeScript and the lint skeleton can slip to S4.

**S4 · The data build**
- **Build:** ingest of all seven regions with its report; the thin M1a overlay; `conditions/2026.json`; daylight and climate files; the cabin's sun table; `permits.json`; `kits.json`; the lockbox's quiz file; schemas and the canonical tag list; the scope file with 3.6's switches and its `main` block; the graph lints. **The gazetteer** (`names/places.json`, `terms.json`) and T16. **The stores' data:** `stores/stores.json` with the general store's and gear shop's shelves by catalog id, their new items added at the source with flagged estimates, the four new item fields (11.3), and every catalog item's basic-or-nice flag, set at the source (Lead call 29; 3.5). **The drives** from the cabin.
- **You see:** a pencil map of the loop at `#map` on preview, every camp in place.
- **Done when:** the 24 M1a camps, both loops and B.1's miles pass as goldens; the ingest report has no unexplained errors; every place name a screen can show is in the gazetteer; every row of the ranger's checklist, a pack and the basic stove's fuel have a free basic, and ingest fails a catalog where one doesn't (doc 5.8, E.4).
- **The floor:** the loop's graph, its 24 camps and the scope file; the stores' data can slip to S11, and the drives to S15a.

**S5 · The look, part 1, with the first sound**
- **Build:** the trail stop (status line, picture, caption, strip, Sierra box, choices, (i), toolbar, short-screen fold); the EGA chrome font and the Plain serif; the composer v0; the meadow and lake-basin bases; the Olympus skyline; the first stamps and the hiker; Deer Lake composed; the basin from the rim hand-drawn; time-of-day remaps; lake and star cycling.
- **Build, sound A1** (13.6): `audio/engine.js` (unlock on `touchend`, the ambient session, the watchdog, buses, the limiter), `dsp.js` with `tools/listen.mjs` and its goldens, the UI's ticks, the Sound toggle in the status line.
- **Build, the words:** T15; `tools/text.mjs batch` with numbered screenshots from `tools/shots.mjs`; the line inspector on preview (long press, *Copy for chat*).
- **You see:** sample stops at Deer Lake and the rim, by day, at dusk and at night. The first tap opens the sound, and Silent Mode mutes it. Screenshots for the sizes you don't own are on the review site.
- **Done when:** you say "chunky but crisp", indoors and out, or tell us what to fix; the sound starts on the first tap and stops with Silent Mode on your iPhone 17; a batch builds with its screenshots.
- **The floor:** the trail stop with one composed scene and the hand-drawn rim, and A1's unlock in the ambient session; the line inspector can slip to S6.

**S6 · The look, part 2**
- **Build:** one decision end to end (odds tag, Why sheet, ♦ confirm, compass roll, outcome, strip); Look boxes and hotspots; the ▾ continuation; the T02 fit lint with measured fonts; Reduce Motion; VoiceOver labels and alt text by id.
- **Build, the palette** (doc decision 68): the lifted sixteen in `palette.json`, `palette.js` and `tokens.css`, kept equal by test; the dusk, blue-hour and night tables re-tuned by eye on the renders, so night stays night; bonfire gold still for the lily only; S1's cover, the title page and the icons checked in the new colors, and text contrast WCAG AA wherever it was. Deer Lake and the rim are not redrawn beyond what the palette needs, while the skyline prototype runs (doc decision 69; 4.4).
- **You see:** a sample fork at the rim with a % and a ♦ to tap through, and every picture a few shades lighter, with night still night.
- **Done when:** you confirm it feels like a Sierra game (the M0.5 exit). **Main is promoted** with what its words allow: the machinery, with B001's lines, there since S2. The sample stops stay on preview, and their words join the batches after the cabin's, so the first thing you read is the front door.
- **The floor:** one decision end to end, with its Why sheet and the compass roll; T02's measured fonts can slip to S8.

### 8.3 The first playable (M1a)

**S7 · Home: the cabin at Lake Quinault**
- **Build:** the cabin plate (160x320, August) from doc 11.11's written brief, at day, dusk and dawn, blue hour and night, with rain and fog; the hotspot map and hit areas; the porch rail and the next-step button; labels that fade after first use; the live scene on Lake Quinault's clock, with the month's climatology sky (11.2); **first launch:** the cabin draws itself in, the lockbox's three locals' questions, then the guest book on the porch table; the mailbox (Sound and Text for now, and the build stamp that hides the debug menu); the register post as a Look until S24; the cover as the loading art. On preview the title page retires.
- **You see:** open preview at dawn, noon, dusk and night and see the lake's own hour; the lockbox, then the guest book; tap every place.
- **Done when:** every place and rail button works with VoiceOver; the scene matches Pacific time on your phone; the PNG holds up beside panel B; no photo is in the repo.
- **Words:** B002, the cabin, and B003, the lockbox and the guest book. **Once both are answered, the cabin replaces the title page on main** as its front door, with the next step disabled until trips reach main, as Session 1's button was.
- **The floor:** the plate by day and at dusk, the hotspots, the rail and the guest book. The lockbox and blue hour can slip to S10.

**S8 · Trail physics, in whole seconds**
- **Build:** movement; **the integer-second clock** (T0); daylight; the weather generator with flagged thunder and fog odds; the body meters and the night model from each item's catalog stats; pack tags; energy from food.
- **You see:** walk the loop with no cards. The clock and the sky change at the right times.
- **Done when:** the 3.1, 3.3 and B.6 times and the night examples pass as goldens, in seconds.
- **The floor:** movement, the whole-second clock and daylight; the night model can slip to S9.

**S9 · Odds, cards and the Director**
- **Build:** odds, knowledge ranges, **hands ranges** (doc 17.2), cards holding ids, effects, chains and foreshadow flags, the Director with its Larry and minigame budgets, the cause trace, the score; `mods.json`, `macros.json` and `tuning.json`; two-band night rolls; the card bench; the card and fair-death lints; six exemplar cards in the Authoring Brief.
- **You see:** walking the loop meets a few real cards: fog on the way trail, a sunset, a cold night.
- **Done when:** the band, fatal-share and score tests pass; the worked maximum comes out at 96; the bench reproduces B.3's 97, 92, 93 and 95.
- **The floor:** odds, cards holding ids, the Director and the score; the card bench can slip to S16.

**S10 · The map table and the permit**
- **Build:** the park map on the cabin's table (the whole park, unbuilt regions in pencil); the ranger's binder of favorite trips; the three questions and the twelve fills; the itinerary sheet (the way round, ETAs against dark, difficulty words, *Stay again* and *Move on*, side trips, the basin-or-crest chips); seeded quota rolls from the trip seed and full-camp moves; *ask at the desk* rows that send the plan to the WIC; the validator and the plan's notes; the Trip Outlook's place (live from S16); **the permit form and *Take it to the desk***, since Jon issues every overnight permit at the desk (decision 40, doc 3.1), with the 104 counter and the screen door coming in S11; the day-hike path (no permit); the B.2 golden seed (3.5). The next-step button now runs *Plan a trip*, *Drive to town* (DRAFT).
- **You see:** plan the loop either way, and the filled-in permit form ready for the desk.
- **Done when:** all twelve fills match B.1; a full Lunch Lake moves to Round Lake with an honest note; a plan with a desk request carries it to the desk with the form.
- **The floor:** the three questions, the twelve fills and *Take it to the desk*; the full itinerary sheet can slip to S16.

**S11 · Town: the WIC and two stores**
- **Build:** the town street; US 101 along Lake Crescent on the way; the WIC counter, where every overnight Open trip stops (decision 40): Jon issues the permit (*Issue it*, DRAFT, with the stamp's thunk), the 104 counter moves and the permit comes home to the screen door; the briefing picked from the plan, **the loaner can** for a hiker who arrives without one (Lead call 33; the desk always has one, doc 3.1, so a hiker with an empty shed and $0 is never stranded), desk camps granted or refused there with alternatives, and no number card until M1b; one store interior in two skins: **the general store** (the beer cooler, its ID check, overnight trips only) and **the gear shop** (rentals, the scale); the notepad, with the ranger's checklist on a first trip at both counters, the free map, compass and trowel being the gear shop's (doc Lead call 44), and the outfit and footwear rows among its rows: picking hiking clothes or boots changes the hiker out of the town clothes, which go to the shed, and no line names the clothes (decision 67); the canister gauge, *Fill from the list* per store with two or three swaps, the receipt; **the wallet and basic or nice** (11.7): a new hiker's $0, every row showing *free* or its price, the receipt against the wallet, and *Fill from the list* never spending past it; *Head home*, and the grocery bags on the porch steps; T03 with the real stores and the jobs' real places on its deny-list (6.7); T05.
- **You see:** the town run for B.2's trip, from an empty shed and in town clothes: permit `104-0001` from Jon, the free basics, the nice things you can't afford yet, and the can from the desk; then the permit on the screen door.
- **Done when:** B.2's food fits the canister by the gauge; T03 and T05 pass; *Fill from the list* never buys beer; the money tests pass (6.6).
- **The floor:** the general store's counter with *Fill from the list*, the wallet and the basic-or-nice split, and the loaner can; the gear shop's rentals and the WIC's desk camps can slip to S16.

**S12a · The flat lay**
- **Build:** the deck boards; the layout engine (11.4); the sensible kit's stamps (the rest in S26); the drawer as the shed, empty for a new hiker until the town run fills it (decision 42), grouped by the checklist's rows; the worn row holding the town clothes, or what the hiker changed into, and never chalked (decision 67); two taps; the item card; the slot picker; the canister panel with *Repack all food*; the water stepper; the checklist chip that reads the forecast; *Pack it* with the Outlook's place; the live numbers, with the worn place on (decision 44), since the pack's numbers depend on it; a tiny flat lay on the deck at the cabin. The next step reads *Leave in the morning* (DRAFT).
- **You see:** lay out B.2's kit and pack it.
- **Done when:** B.2's pack golden passes, recomputed with the worn place on (decision 44; 7.4); the same kit draws the same picture twice (a hashed golden).
- **The floor:** the layout, the drawer, the worn place and *Pack it*.

**S12b · Sharing the flat lay**
- **Build:** **the share image**, 1080 x 1350, through the share sheet (11.4), with the stores' outline marks, never letters (doc 12.8), and along its foot the hiker's name (it can be switched off), *OP Hiker* and *ophiker.com*: the default you'll judge on a real one (decision 44); chalk outlines on a first trip; *Like last time*.
- **You see:** save the picture of B.2's flat lay to your camera roll.
- **Done when:** the share image is a hashed golden in Node; the share sheet works on your phone, and so does the press-and-hold fallback.
- **The floor:** the share image; *Like last time* can slip to S26.

**S13 · The minigame host and the bear can (MG0)**
- **Build:** `engine/mini/core.js` and its contract; the 120 Hz host; touches stamped in ticks and written into the action log as they happen; pause and resume with a count-in; the card with *Play* and *Auto*; the hand glyph on choice buttons; the `mini` stream; the Minigames row in the mailbox (*Ask*, *Play*, *Auto*, *Left-handed*); the minigame lints. **The bear can's core:** the four cans' cutaways from their makers' sizes, round squishy items from `gfx/round.js`, drop, settle, merge and the lid press, and its result feeding the pack's fit.
- **You see:** tap the can on the deck, and pack it by hand or with *Auto*.
- **Done when:** a recorded packing replays to the same fit in Node and Safari and at 60 and 120 Hz; *Auto*'s fit shows in the canister panel.
- **The floor:** the host, the can's drop, merge and lid, and a replay that matches in Node and Safari; *Auto*'s bot can slip to S14a.

**S14a · The bear can, pitch-perfect (MG1)**
- **Build:** the tortilla liner, the queue's fixed order, with no *Set aside* (decision 56), the ghost thumb, the sounds within a frame (synthesized until S22's sources), the careless, par and careful bots, tuning in all four cans; Reduce Motion and VoiceOver paths; repacking free until *Start walking*; leftovers lying on the deck in the share image.
- **Done when:** the par bot sits at 85% ± 2 in every can; the bar's first ten points pass on your phone (the eleventh, five new players, is at your playtest).
- **The floor:** the par bot at 85% in the two commonest cans; the other two cans and the leftovers in the share image can slip to S27.

**S14b · The burger drive-in, the first town job** (decision 41; Lead calls 30 to 32)
- **Build:** the job's door on the town street, `{JOB_DRIVEIN}` until you name it; `engine/jobs.js`: one shift per job per trip, its door shut until that trip passes *Start walking* (doc 5.8), pay into the wallet as a base wage plus a skill bonus, town only, never in the timed modes; **the grill**, the takoyaki-style game you named in decision 29 (Lead call 31): `mini/burgers.js` on the shared host, one thumb, under a minute, many small well-timed touches, each with its own sound, a result line that is the pay, *Auto* at par pay, and the careless, par and careful bots; no ♦ anywhere in a shift; the drive-in's grill hand-drawn (4.3). Its words go by id, like every minigame's, in the minigames' own batch on the review page (5.6, decision 64, Lead call 43).
- **You see:** work a shift on the town run, then buy one nice thing with the pay.
- **Done when:** a recorded shift replays to the same pay in Node and Safari and at 60 and 120 Hz; *Auto* pays what the par bot pays; a second shift before the trip passes *Start walking* is refused, and a re-planned trip that hasn't started walking doesn't reopen the doors, in a test; the bar's first ten points pass on your phone.
- **The floor:** the grill with *Auto* and the pay into the wallet; the careful bot can slip to S27, and a store skin stands in for the drive-in's own art until S26.

**S15a · The road, the days, and the way home**
- **Build:** the drive from the cabin through Forks, with time chips that show the arrival; the tailgate (the flat lay on its backdrop, the can drawn closed, beer never listed, the Outlook, the day-use line for day hikes); the register kiosk; *Start walking*; the day loop (morning, pace, legs and slots, arrival, *Make camp* and tiles with the light stepping down, night, morning) with **splits against the plan** on the strip; *Change the plan* with off-permit nights and the overdue clock; **the stamp at the car** (Finished, Sooner Than Planned, the Hard Way) on the car scene; the drive home; a plain **trip report**; *Hike it again*; the Pack, Map and Log tabs; the car pulling in at the cabin.
- **You see:** a whole rough trip, from the cabin to the trip report.
- **Done when:** 2,000 smoke trips have no crash, dead end or stuck state; a scripted trip reaches every next-step state.
- **The floor:** the day loop, the stamp at the car and a plain report; *Hike it again* is first on the cut ladder (below).

**S15b · The harness grows up**
- **Build:** all seven bots, the plan library (7.2), the look-ahead memo, and the 7.3 targets as a report, so every session from S16 on is tuned against numbers.
- **Done when:** a real trip's cost is measured and the matrix sized from it; the targets report runs on the twelve fills and prints every row of 7.3.
- **The floor:** the Steady and Cautious bots, the twelve fills and the report; the other bots can slip to S27.

**S16 · The fork and the crest**
- **Build:** the basin-or-crest fork at the rim going ↺, at the Mirror Lake junction going ↻, and at the rim again if you stayed high; look-ahead bars with the black tip; the Trip Outlook's numbers at the map table and at *Pack it*; thunder and fog with their foreshadowing; *Off the crest, now*; fog near a cliff; the Olympus plate. **Sound A4:** thunder at its true distance, five seconds a mile, synthesized; fog; and **the hush** with every ♦. Until S24, a death ends on a plain stub.
- **You see:** the fork from 12.12, with honest bars, both ways round.
- **Done when:** B.6's ETAs pass and its shares are regenerated and recorded; the hush follows the ♦ exactly, in a test.
- **The floor:** the fork at the rim, both ways round, with honest bars; the hush can slip to S21.

**S17 · The alpenglow shot (MG2)**
- **Build:** the light curve as a build-time table, from 15 minutes before sunset to civil dusk, by date; the lull before the pink; framing, holding still, exposure; the phone and a camera, with no preview after a shot: the photos wait for the trip report, like film (decision 57; the disposable film camera's own 27-shot counter is cut-first); photos earn no trip score (decision 57); a photo kept as about 10 bytes and redrawn exactly; pseudo-color 27 `alpen`; the shot on the crest, at Heart Lake Junction and on Bogachiel Peak; the best photo as the trip report's cover; practice on the cabin's porch only at the lake's real dusk.
- **Done when:** *Auto* scores about 68 and never ★★★; a photo redraws identically from its bytes; the bar passes on your phone.
- **The floor:** the shot on the crest with its light curve and *Auto*; Heart Lake Junction, Bogachiel Peak and porch practice can slip to S26.

**S18 · Content batch 1: the trail**
- **Build:** about 25 cards (landmarks, hazards, footing, way trails, Sol Duc Falls' stay-on-trail); place text; Look lines; quiet stops; half the item notices; recipes for every loop place; the remaining bases, skylines and stamps; Sol Duc Falls hand-drawn.
- **Done when:** the lint is at zero, every card is benched, 20 transcripts are read, the targets report is read and any row moving the wrong way is logged, and the review site is on preview.
- **The floor:** 20 cards, benched and linted, and Sol Duc Falls' stay-on-trail.

**S19 · Content batch 2: camp, night, animals, people**
- **Build:** about 25 cards: camp, night, wildlife, strangers, the Boyz cards (placeholders), the five chains, delayed payoffs, aftermath cards; the animal and tent sprites; the other half of the item notices.
- **Done when:** as S18, plus every event tag in play appears in at least 3 cards.
- **The floor:** 20 cards with the five chains.

**S20 · Huckleberries (MG3)**
- **Build:** combing with a cursor drawn above the thumb; the cup as the park's real quart, its limit per person per day (decision 58); ripeness from the season table; the bear's tell with the existing bear card (cut-first); Leave No Trace −2 for stepping off the trail; berries dealt as a real decision, at most once a day.
- **Done when:** *Auto* picks about half a quart at 85% ripe; the bar passes on your phone.
- **The floor:** combing and the quart, with *Auto*; the bear's tell is cut-first.

**The checkpoint after S20.** Before S21 starts, one question: **does a full trip with the can play end to end** (the cabin, the plan and permit, town, the flat lay, the can, the drive, the loop, the car and the report)? If not, the cut ladder below starts at once, rung by rung, until it does, instead of the spare sessions being spent. Each rung moves to M1b, and the session tells you which in its *try this* note.

**S21 · Sound on the trail (A2)**
- **Build:** synthesized beds (air, wind, creek, falls, rain shaped by canopy, hood and tent fly); the scape resolver (place, hour, season and weather into layers); the loop's listening maps from the region data; footsteps on ten surfaces from trail class and hazards; the walk-on montage; each night's end on its own sound, the river, wind or rain, with no closing line (decision 63); **the camp tunes** of the instruments you carry in, the harmonica, the travel ukulele, the melodica and the full-size guitar, synthesized like the band, the guitar's the best of them (decision 62, Lead call 38), each ready before its shelf opens.
- **Done when:** `listen.mjs` renders of dawn at Deer Lake, rain on the crest and the walk-on at the stone staircase meet the loudness targets with no clipping; your check, sound on and on silent, is owed.
- **The floor:** beds, footsteps and the walk-on on the loop; the finer listening zones can slip to S28.

**S22 · The sources and the license log (A3)**
- **Build:** `tools/audio.mjs`; `content/audio/credits.json`; lints A01 to A09; the loop's birds and animals from CC0 and NPS sources, with stand-ins logged as such; gear and body; the flat lay's materials; the minigames' recordings; the Sounds part of Credits, built from the log.
- **Done when:** A01 to A09 pass; every shipped file's hash matches its entry; M1a's audio is under 2.5 MB.
- **The floor:** the license log, A01 to A09 and the loop's birds; the flat lay's material sounds can slip to S28.

**S23 · Larry moments**
- **Build:** Heart Lake hand-drawn; the swim tile, the censor bar and its blip, the jay, the Boy, the towel and the Cold chain; *Crack the IPA*; the permit check (capped, legal nights) and the off-permit ranger (forced, uncapped); A07, the sound side of T05.
- **You see:** the 12.21 screen.
- **Done when:** the Larry lints pass, and early Joy-seeker runs stay inside the sensible caps.
- **The floor:** Heart Lake, the swim, the censor bar and the Cold chain; the IPA and the permit check are cut-first.

**S24a · The death sequence**
- **Build:** `causes.json` and the four death boxes; the drained picture; YOU PERISHED; **sound A5**, the sting and the dirge; the remains, the dust and the Reduce Motion fade; the register box; the epitaph screen with the dice; the GAME OVER card.
- **You see:** lose a hiker on purpose and watch the five screens.
- **Done when:** the death lints pass; every smoke death is fair.
- **The floor:** the five screens, plain; the dust can be a cross-fade until S26.

**S24b · The register, the wipe and import**
- **Build:** *Back to the cabin* (DRAFT); **the cabin at dusk** with the wipe, drawn by the same dust renderer on the cabin plate, and its crash recovery; the Trail Register at the register post, with the Boyz' placeholder lines; a new hiker from the guest book; Export and Import with their refusals.
- **You see:** a dead hiker all the way to a new name in the guest book.
- **Done when:** the wipe tests and import tests pass; the cabin shows none of the dead hiker's marks.
- **The floor:** the wipe and the register; Export and Import can slip to S28.

**S25 · Coming home: the trip report, the soak and the cabin band**
- **Build:** the full trip report (title from three, photos with the alpenglow cover, conditions, the elevation profile, gear notes, Field Notes) and **its 1080 x 1350 share card**, with the hiker's name (switchable), *OP Hiker* and *ophiker.com*, like the flat lay's (decision 44); reports kept by the fire bowl; route signs on the shed wall; the homecoming (the trip's own arrival time first, the fire bowl lit in the evening, then the slow fade to now); the tub's rule (trail hours standing in for decision 39's meters, 11.5); **the soak** plate (night, stars, steam, the thermometer at 104°F, a can on the tub's edge, decision 46). **Sound A6:** the cabin's places and the rain on its roof, the cabin band's theme on the real clock, the soak's version and the finish cadences (the daily's sting waits for T2).
- **You see:** finish the loop, read the report, and get in the tub.
- **Done when:** the trail-hours goldens pass (the loop lights the tub, the Deer Lake overnight doesn't); the cabin band's scores render to the same bytes every time; the share card reaches your camera roll.
- **The floor:** the full report and the soak; its share card and the band's time-of-day variations are on the cut ladder.

**S26 · Art pass**
- **Build:** the rest of the flat lay's stamps; the cabin's states polished (trip props, homecoming, the tub, after a death); every M1a stop checked at every time of day; contact sheets; the picture lint; alt text.
- **You see:** every stop has its own picture, and dusk and night look right, at the cabin too.
- **The floor:** every M1a stop has its picture by day and at dusk; contact sheets can slip.

**S27 · Harness and balance**
- **Build:** stratified runs for the rare events, failure and ablation reports, the research assertions (about 15), `nightly.yml` on request, tuning of `tuning.json` and the climate estimates, the burger drive-in's wage and bonus among them, against the nice items' prices; the minigames' targets report (7.6). The bots and the plan library have run since S15b, so this session tunes rather than meets the numbers for the first time.
- **Done when:** every row and gate in 7.3 passes, and the report is on the review site.
- **The floor:** every gating row of 7.3 passes; the failure and ablation reports can slip to M1b.

**S28 · Polish and hand-off (M1a)**
- **Build:** a pacing pass; the first trip's timing (about 7 minutes from *Sign* to *Start walking*, the can on Auto, doc 3.6); **sound A7**, the mix pass on your phone and a listen batch; a VoiceOver day; the mailbox's settings complete; Credits, with decision 47's two approved lines (the People line on main only once everyone named there has agreed, 5.7), and the ranger's reading; the final review site; the F.5 checklist by screenshots, then on your phone; **the promotion report**, a session ahead: every M1a screen whose words are yours goes to main, and the rest wait on preview.
- **You see:** M1a, all of it on preview, and on main as far as your words have reached.
- **Done when, the M1a exit (doc 15):** the 7.3 targets pass; the fork fires at the first way into the basin both ways; every simulated death is fair; the death lints pass; no crashes, dead ends or stuck states; each minigame meets its bar and its targets; every shipped sound passes A01 to A09; and **you play the loop on your phone both ways round, drop into the basin once and stay high once, change the plan once on the trail, start from an empty shed, work a shift at the drive-in and buy something nice, pack the can, shoot the alpenglow from the crest, pick berries, share one flat lay, soak once, play once with the sound on and once on silent, and lose one hiker on purpose, all the way through the wipe at the cabin to a new name in the guest book.**
- **The floor:** the promotion report, the VoiceOver day and your playtest; nothing here slips.

**The count.** Session numbers are labels, so later links still land: S12, S14, S15 and S24 are each split in two, which makes M1a 26 sessions (S7 to S28) and the playtest the 32nd session counted. **That is the target. About 32 to 37 is likely,** with up to three spare sessions after S28 and some overrun; every later number moves with it (1). The doc's M1a estimate counts the same way: about 26, likely 26 to 31, with the frame, the minigames, the sound and the burger drive-in (S14b, Lead call 32) inside it (doc 15).

**The cut ladder,** pre-agreed, in order. It starts at the checkpoint after S20 if a full trip isn't playable, or whenever M1a runs past its spare sessions; each rung moves to M1b, and the 3.6 table changes with it (a plan call, yours to reorder, 9.2):
1. *Hike it again*.
2. The trip report's share card (keep the flat lay's).
3. Blue hour, rain and fog on the cabin plate (keep day, dusk and night).
4. The lockbox's locals' quiz (the guest book alone opens the cabin).
5. The cabin band down to one theme, with no time-of-day versions.
6. The desk requests (Bruce's Roost, Cat Basin, Hidden Lake: lead call 1 moves with them).

**Cut first, beside the ladder** (as doc 15 lists them): the Hoh Lake and Cat Basin side trips as day trips (their camps stay); plans of four nights or more; the hand-drawn Lake Crescent (a composed road instead); the IPA and the permit check; among the minigames, the bear's tell, the disposable film camera's counter (never decision 57's prints in the trip report) and the photo gifts, and the can's special items except the tortilla liner.

**Never cut:** a permitted camp (decision 17), a direction, the basin or the crest, the fork, the three-night fills, the death sequence and the wipe, Copy bug report, the flat lay's share image, a minigame's *Auto*, its hands range, its determinism or its result line, T0's clock and log, and the text gate.

### 8.4 Right after M1a: the High Divide Loop FKT (T1)

**S29 · The runner and the board**
- **Build:** the standard runner (Strong fitness); Run and Race paces; the fuel store, the eat-back cap and the bonk; water at speed and the 2% line; ankle checks on technical segments; headlamp starts; the running kit's new items; `fkt/routes.json` for the High Divide Loop ↺ and ↻ (waypoints in order, splits, support points, `stash_ok`), a board for each way round, and a small badge for tagging Bogachiel Peak, never required (decision 52); **the week's window**, with fixed conditions and unlimited tries, opening at Monday's sunrise (decision 52, Lead call 34; 14.2); **the peak opens** on the FKT board; the timed and attempt keys (doc E.6); your handle, asked once; **the `daily` data branch**, and the rules archive at `/e/<hash>/`, carried forward by `assemble-site.mjs`, with each version also a Release asset (14.2); the attempt's pin in IndexedDB and the worker's pin cache (14.2); **the morning job's shadow run,** fetching and converting NWS every morning and publishing nothing, so its reliability from GitHub's runners is known long before S42 (6.8).
- **You see:** run the loop ↺ against the clock, from the peak.
- **The floor:** the runner, fuel and water on ↺, with the week's window and the peak; ↻ can slip to S30.

**S30 · Styles, splits and ghosts**
- **Build:** unsupported, self-supported and supported as rule sets, and the crown rule: a self-supported time is *the* record only if it also beats the best unsupported one (decision 52); the stash your Open hiker places, at the car and trailheads only until Olympic's Compendium is checked, then at designated backcountry camps for up to 24 hours (decision 52); Jon crewing at trailheads only, with no backcountry crew box (decision 52; no pacer in v1, so decision 7 stands, doc 9.11); the disqualifying choices, each saying so on its button (decision 50); splits and a ghost of your best on the strip; Step 1's boards on your phone; the share card, text and picture; race bibs on the porch post; a new personal best on a route of at least 8 trail hours lights the tub (the loop's do); a death plays the five screens with a DNF stamp, signs a tagged line in *Remembered*, epitaph and all, and wipes nothing (lead call 17, decision 43).
- **You see:** race your ghost, both ways round, and share the card.
- **The floor:** unsupported runs, splits and a ghost of your best; the stash and Jon's crewing can slip to S31.

**S31 · The technical descent**
- **Build:** the descent minigame (doc 17.10): rhythm taps on roots and rocks, segment time ×0.92 to ×1.10, feeding the footing check, *Auto* at the median, a recorded latency setting; the Pacer and Racer bots; calibration; golden timed runs in the Safari self-check; the verifier's human limits.
- **Done when, the T1 exit:** the FKT targets in 7.6 pass; the descent meets its bar; golden timed runs replay identically on your phone; and **you run one attempt each way round, race your ghost and share the card** (F.5).
- **The floor:** the descent with *Auto* and the human limits; calibration can use M1b's buffer.

### 8.5 M1b, with the Hike of the Day (T2)

| Session | Work |
|---|---|
| S32 | The rest of the Sol Duc graph: out-and-backs, Mink Lake, Little Divide, Appleton Pass; June to October with the shoulder season (snow on the Divide, mosquitoes); the scripted Lunch Lake denial |
| S33 | Lake Crescent's low trails as day hikes (Marymere Falls, the Spruce Railroad, Storm King to the end of the maintained trail, Pyramid Peak); off-trail navigation; Long Lake and Sol Duc Lake as desk requests |
| S34 | The WIC call: the number hotspot (T06), the cabin's wall phone, *Ask about a lake*, Morgenroth's way trail (your GPX if it's here), the hand-drawn scene, the IPA there, the Boyz' rumor |
| S35a | The other Larry moments (the bold marmot, the thin tent wall, the Lodge, Second Growth's pre-roll, and its munchies in the berry patch: every berry in your mouth, the cup never filling, decision 58); the boutique, its third skin and its items (decision 48); the Huckleberry Skillet |
| S35b | The other two jobs (Lead calls 30 to 32): the dish pit at `{JOB_GASTROPUB}` and the bookstore counter at `{JOB_BOOKSTORE}`, lighter than the grill; their doors on the town street, `dishes.js` and `books.js` on the shared host, *Auto* at par pay, one shift per job per trip, never lethal; T07's allowlist gains the bookstore's stock and its lines about selling books, each with a reason, shown in this session's batch (Lead call 41) |
| S36 | The Bonfire Lily, in Open only (decision 50): weights on the snow features (after you confirm the windows), the glow plate, the motif (five rising notes, once in a hiker's lifetime, decision 62), the gold sketch in the cabin's gable window (decision 46) |
| S37 | The cabin's year: spring, autumn and winter, the real moon; the crew on summer Friday and Saturday evenings, after your big homecomings and on your dates (`{BOYZ_DATES}`), with Jon usually away, his hat and badge #104 on the hook, and sometimes there with them (decision 46; the details from the photos only once you confirm them); the tub's lines, the guest book's old signatures, the crew's voices in the cabin band, the wool blanket, the gear-list CSV. The easter eggs decision 54 names wait for the Boyz' yes |
| S38 | Snow: self-arrest (doc 17.11), with no practice anywhere: you learn it on the mountain (decision 59, Lead call 39); the ice axe's self-belay +10 and the arrest, in place of a flat bonus; its 20% death roll behind a ♦, the `fall` key's snow line (yours to write) and its epitaph deck; doc 9.5's new row |
| S39 | The tent in the rain (17.13); the can that remembers, eaten from each night and repacked in camp (decision 56; 17.7) |
| S40-S41 | Content to about 105 cards; at least 32 notable cards per coverage cell; story uniqueness |
| S42 | **The morning job** (T2, part 1, 14.3), with each day's opening instant, sunrise over the Olympics (Lead call 34) |
| S43 | **The Hike of the Day** (T2, part 2, 14.3), on preview until the world board ships with it (S47-S48) |
| S44 | **Crew links and pinning** (T2, part 3, 14.3) |
| S45 | The gentle mode's overrides simulated headless; share codes; *Walk out*; the remaining audio; the nightly job on a schedule |
| S46 | Balance (in season and shoulder), ablations, the device checklist, and your playtest |

**Razor clams,** if you choose M1b for them: one or two sessions after S39 (doc 17.14). They are built as you called them (decision 61): a shovel only, never a clam gun, a broken shell still counting toward the 15; Mocrocks the regular beach and Kalaloch the rare special dig; the dig's result screen your photo's composition redrawn in pixels, from its description alone (15 clams in a ring around the shovel, a rain hat on the handle, a lantern glowing on wet sand); the tub lit after a winter night dig. A *Dig of the Day* waits until clamming plays well in Open. **T2 is 4 to 6 sessions** in the doc; S42 to S44 are its core, and any overflow uses M1b's buffer.

**M1b exit (doc 15):** the Seven Lakes rows in F.1, in season and in the shoulder season, and the loop in a day with real gear; story uniqueness at least 90% on 2-3 night templates; at least 32 notable cards in every coverage cell; the ablation vector passes; return days average 3 to 6 stops; the device checklist passes; **you find the number, call the WIC, camp at Lake Morgenroth in the game and tell us what we got wrong, and you play three different Sol Duc trips and want a fourth.**

**T2 exit (F.5):** the morning job has published three mornings running on its own, live before 4:45 each time; a forced failed morning plays the same standby day on two phones, and a phone whose clock is set a day ahead plays today, not tomorrow; **you play one Hike of the Day start to finish and share its text and picture, send a crew link through Messages, copy it from Safari's landing card and paste it into the app's crew board, where on preview it replays as practice, never crew-verified (14.2); and in airplane mode, before today's index is fetched, see the chalkboard wait for it while Open still plays.**

**Cut first in M1b:** Long Lake and Sol Duc Lake as camps (never Morgenroth or the call), then share codes, then Mink Lake and Appleton Pass; the crew links before the daily itself.

### 8.6 After M1b

**S47-S48 · The world board, and the Hike of the Day on main (T4)** (decision 53; Lead calls 35 and 36; 14.4)
- **Before it starts, from you:** a Cloudflare account on the Workers Paid plan (about $5 a month) and the GitHub secrets it needs, about ten minutes; and which PG-13 words handles may use (beer, IPA, *420*?), from a recommended default the session brings.
- **Build:** the Worker and D1, deployed from CI with those secrets; **server-held dice:** the morning job hands each day's seed and drawn truth, standby days included, to the Worker, and the day's file and `standby.json` carry only their hash commitment; **fresh standby days:** at launch the job re-bakes all 45 entries in `standby.json` with new seeds and truths held only by the Worker, because T2's entries carried their seeds in the clear on the `daily` branch; the Worker deals each stop's roll and weather as you play, records one attempt per device key, and publishes the seed and truth two hours after the day closes, when no attempt pinned to it can still be running (doc 9.9, 9.12); the dealt rolls enter the engine as logged inputs, so `step()` stays pure; one attempt per device key and the minimum elapsed time (doc 9.12, *Cheating*, its two light checks); results checked by replay in the Worker; the daily's board's top 100 (the FKT boards join the world board only once doc 9.12's question on keeping them honest is settled, doc *Still to come*), your rank from the histograms, and the static boards on Pages when a limit trips; handles and the PG-13 filter; opt-in, *Erase me* and the privacy note (your words); `board.yml`. **The connection rules** (Lead call 35): the public daily needs a signal while it's played; offline, the chalkboard says so (DRAFT words, in the batch); a run that loses its signal waits and picks up again when it's back, up to two hours past the day's close (doc 9.9); Open and FKT practice play offline as ever. **Crew links** keep working as doc 9.12 Step 3 sets out: while the day's seed is held, a result replays on the rolls its own log carries and shows grey *checking*, and it turns verified once the seed is published against the commitment. **A day the Worker can't deal at all:** what the chalkboard and the streak do is settled here (proposed: the chalkboard says so, as offline, and such a day never breaks a streak, since nobody could play it; doc 9.12, Step 4).
- **You see:** today's hike on main, your time on the world board, and in airplane mode the chalkboard saying the hike needs a signal while Open still plays.
- **Done when, the T4 exit:** no day's seed or drawn truth reaches a phone or the repo before the last attempt on its day can finish, two hours after the close; no standby entry in play has a seed anywhere in the repo's history; a crew link pasted on main is verified by replay once the day's seed is published; a second attempt from the same device key is refused; a run whose signal drops mid-stop resumes on the same roll when it returns, and not after its two hours past the close (doc 9.9); the Worker's replay agrees with Node's on the golden timed runs; the static fallback serves when the Worker is down; and **you play one Hike of the Day on main, see your time on the world board, and lose your signal once mid-run to watch it wait and resume.**
- **The floor:** server-held dice, one attempt per device, verified results, the top 100 and your rank, opt-in and *Erase me*; reports and the histogram tuning can follow in a third session, if T4 needs its third.
- **Main gets the Hike of the Day only with these two sessions** (Lead call 36). Until then the daily lives on preview, practice only, never posted.

- **T3, Lake Quinault's four low trails,** for winter dailies: 2 to 3 sessions, before the first winter of dailies (the High Divide is snowed in from about November), wherever that falls. You said yes (decision 51; 14.4).
- **M2 to M6,** the Hoh and Olympus with Ranger Jon, Royal Basin (v1.0), the coast, the rest of the park and polish, as doc 15 sets them out, each with its own minigames, listening maps, words and FKT boards (T5). M2 brings the ford, which can kill at waist depth (decision 60), and One Square Inch of Silence on the Hoh, and asks you again about jet noise (decision 63).

---

## 9. What's left

### 9.1 Things only you can give us

| Item | Needed by | Blocks |
|---|---|---|
| Your answers to each batch | Each promotion | What reaches main; nothing that gets built |
| Your verdict on the look | S5-S6 | The cabin plate and art in volume |
| Your verdict on the skyline prototype (doc decision 69) | When it's ready | Nothing built: the composer's design (doc 11.7; 4.4) is updated once it's judged |
| Your own quiz questions (optional) | S7 | Nothing: the lockbox has twelve |
| The three stores' names | S11 | Nothing: `{STORE_GENERAL}` and the others until then |
| Your verdict on the share images' default: the hiker's name, *OP Hiker* and *ophiker.com* (decision 44) | S12b, on a real one | Nothing: the default until then |
| The three jobs' names (decision 41, Lead call 30) | S14b for the drive-in; S35b for the other two | Nothing: `{JOB_DRIVEIN}`, `{JOB_GASTROPUB}` and `{JOB_BOOKSTORE}` until then |
| Clams in M1b or M4 | S38 | Nothing |
| The Boyz: names or nicknames, quirks, register and tub lines, each one's OK | Before v1.0 | Nothing in M1a or M1b; a release build ships Credits' approved line about real people only once every Boy, Jon among them, has agreed (decision 47) |
| Morgenroth: your GPX and stories; whether the route may be published; whether the Strava link stays | S34 | Nothing: straight-line estimates and placeholders until then |
| Whether the lily's snow windows match your memory (optional) | S36 | Nothing: flagged estimates |
| The crew's dates at the cabin (`{BOYZ_DATES}`), and the crew evenings' details from the photos, confirmed | S37 | Nothing: nothing new from the photos goes in until then (decision 46) |
| A Cloudflare account on Workers Paid (about $5 a month) and the GitHub secrets; which PG-13 words handles may use | The start of S47 | The world board, and with it the Hike of the Day on main (decision 53, Lead call 36) |
| Ranger Jon's quirk; his OK on appearing in the game and on its tying him to his old ranger cabin | The quirk by M2; the OK by S28's promotion | Credits' People line on main until then (5.7) |
| Your playtests | S28, S31, S46, S48 | The milestone exits |

The GPX never enters the repo. A session reads it outside the repo and commits only a simplified line, its distance, gain and trail class (doc E.5). Send it in a Claude chat, never attached to a GitHub issue: issues on a public repo are public. The same goes for the cabin's reference photos: they stay out of the repo, and the art comes from the written brief (doc 11.11). Public-domain photos of the park used as art reference (NPS, USGS, CC0) stay private too, and are never committed (doc decision 69).

The clam photo is the same: the dig's result screen is drawn from a description of its composition, and the photo stays private (decision 61).

You answered the open calls from the frame, the ways to play, the minigames, the sound and the words on 2026-10-09 (doc decisions 41 to 65), and the lead filled in what they left open (Lead calls 29 to 43), so the sessions build on your answers. What's left is in the doc's *Still to come*: the rows above, a few small calls to judge when they're in front of you, and the later calls already on the schedule (jet noise at M2, a *Dig of the Day*, the easter eggs once the Boyz say yes, a pacer, career FKTs, a photo-of-the-day board, and how the FKT world boards stay honest, which comes before any FKT board joins the world board).

### 9.2 Calls already made

The design doc's [Lead calls](GAME_DESIGN.md#lead-calls), one line each and yours to overrule, and where each gets built:

| Lead call | Built in |
|---|---|
| 1 · Desk requests: three in M1a; Long Lake, Sol Duc Lake and the call in M1b | S10-S11; S33-S34 |
| 2 · Day hikes: no permit, the maximum at *Start walking*, the day-use line | S10, S15, S24 |
| 3 · What M1a shows and hides | 3.6, in S4's scope file |
| 4 · No canister is allowed, at a cost | S10, S19 |
| 5 · The off-permit ranger | S15, S23 |
| 6 · Night rolls | S9 |
| 7 · Score budgets and the 96 | S9 |
| 8 · The seed at the plan's first save | S3, S10, S15 |
| 9 · The smaller calls | S4-S16 |
| 10 · The night model reads the catalog | S8 |
| 11 · The words that replace the book; `hiker_dies`, `gentle`, `voice.js`, `ui/home.js` | S2, S7, S24 |
| 12 · Planning moves home; the WIC desk, required since decision 40 | S10-S11 |
| 13 · The cabin's live scene | S7, S37 |
| 14 · The recommended voice in the drafts | Every batch |
| 15 · T07, no book words | S2 |
| 16 · Timed modes: the standard hiker, no shopping | S29, S43 |
| 17 · Every death plays five screens | S24; the DNF in S30, S43 |
| 18 · Timed results belong to the player | S29 |
| 19 · Whole seconds and the full log from M1a | S3, S8 |
| 20 · The daily never depends on the job | S42 |
| 21 · No real FKT names or times | S29 |
| 22 · Your handle | S29 |
| 23 · The doc's numbering | (the doc only) |
| 24 · The minigames' engine | S13 |
| 25 · The sound engine | S5 |
| 26 · Every sound logged | S22 |
| 27 · Claude never approves | S2 |
| 28 · Recommendations written in, and answered | Throughout |
| 29 · Money: basic and nice; the wallet, Open only, wiped at a death | S4 (the flag), S11, S24b |
| 30 · Three town jobs: a shift is one short minigame, pay a base wage plus a skill bonus, one shift per job per trip | S14b; S35b |
| 31 · Burger flipping is the takoyaki game | S14b |
| 32 · The jobs in two steps | S14b; S35b |
| 33 · The empty shed; the desk lends the bear can | S11, S12a |
| 34 · The daily opens at sunrise over the Olympics | S4 (the sun table), S29, S42, S44 |
| 35 · Server-held dice; the daily needs a connection | S47-S48 |
| 36 · The world board comes with the daily | S47-S48 |
| 37 · Clamming: Mocrocks and Kalaloch, a shovel only, the result screen | With clams, M1b or M4 |
| 38 · Four instruments, carried in | S4 (the catalog), S21 |
| 39 · No self-arrest practice | S38 |
| 40 · The share images' default | S12b, S25 |
| 41 · T07 and the bookstore | S35b |
| 42 · No haptics | S13 |
| 43 · Settled by default; their words in batches | Every batch |
| 44 · The free map, compass and trowel at the gear shop: two counters on a first town run | S4 (the shelves), S11 |
| 45 · The hiker's own phone, outside the shed and the wipe | S4 (the catalog), S11, S12a |
| 46 · B003 as one set, about 53 lines | S7 |

**The plan's own build calls,** also yours to overrule:

| Call | Default |
|---|---|
| Batch 1 | Replaced by B001, the app's frame, and B002 and B003, the cabin's front door; the title page's own lines retire unanswered (1.2) |
| Session 1's unapproved lines | Off main in S2, all of them, as you agreed (decision 64): decision 21 says main ships approved words only, decision 22 names "picture-book" and the bookshelf, and a deletion adds no words. Nothing is grandfathered, so there is no `legacy.json` and T07 has no exception for them (1.2) |
| B000 | Holds decision 35's two lines and decision 47's two, each with its decision as your answer (1.2) |
| Where the jobs go | S14b, the burger drive-in, right after the minigame host and the can; S35b, the dish pit and the bookstore counter, beside the boutique (Lead call 32) |
| The world board's sessions | S47 and S48, right after M1b's playtest, so the daily is played on preview first (Lead call 36) |
| The count and the cut ladder | The 32nd session counted is the M1a target and 32 to 37 likely; S12, S14, S15 and S24 are split; a checkpoint after S20 starts a pre-agreed ladder that moves *Hike it again*, the report's share card, the cabin's blue hour, rain and fog, the lockbox quiz, the band's versions and the desk requests to M1b, in that order (1, 8.3) |
| Rules releases | From T2, a deploy that changes main's rules hash waits for the morning job; word-only and UI-only deploys go any time, and CI checks they leave the hash alone (6.3) |
| The morning deploy | Data only, from the `site` branch, with *live* as the commit point and the standby day at 4:45 (6.8) |
| The clock | Whole seconds in every mode, shown as minutes in Open; this supersedes the old plan's whole minutes (6.6) |
| Main and its words | Main's build carries only screens whose words are yours; the cabin replaces the title page on main once B002 and B003 are answered (10.6) |
| The cabin's real clock | Read in the UI only; the sun from a build-time table; the sky from the month's climatology, the same for everyone that date, until T2's forecast (11.2) |
| FKT weeks before the morning job | Worked out on the phone from the week's id, so T1 needs no server, with the week opening at Monday's sunrise from the build's sun table; from T2, the job publishes random week seeds and the opening instants (14.2) |
| The rules archive | Arrives with T1, on the `daily` branch, which holds data only: main's versions 45 days, preview's 2 (14.2) |
| The worn place | On, as you chose (decision 44), with its switch kept in `tuning.json`; B.2's golden is recomputed with it on (7.4) |
| The review page | Every batch goes out on it, as B001 did (decision 64; 10.7) |
| Placeholders on the live site | Allowed inside approved lines until the tagged v1.0 build, which refuses them (F.3) |
| Your Strava link | Removed from the region file and the doc on 2026-10-08 (*firsthand: game creator*); ingest still strips any that come back, until you say it may stay |
| Saves across preview builds | The device record and the timed record always migrate; on preview, a trip from a build whose save format changed closes with a note; on main, everything migrates |
| Bug reports in the repo | Only scrubbed: the hiker's name becomes `{HIKER}`, the note is dropped |
| Sound files | Short excerpts only as masters; `tools/audio.mjs` runs in sessions, never in CI, and CI checks hashes (13.4) |

---

## 10. The text system: every word an id, from S2

*Decision 21: every line of original English is yours. The design is doc 18; this is how it gets built, and when.*

### 10.1 The promise, in code

- **No original English in code.** Every line lives in `content/text/`, by id: buttons, boxes, Looks, alt text, aria labels, the manifest, the share images' text and the number formats. A lint fails the build on English anywhere else (T10).
- **Status is computed, never stored.** A ledger freezes the exact words you approved; edit them and the line is a draft again by itself (10.4).
- **Main ships your words only** (T14); preview ships the working words, with drafts marked in debug mode (10.6).
- **Claude never approves.** Only `tools/text.mjs apply` writes the ledger, and only from an answer of yours that names the line and the hash you saw (lead call 27).
- **Not ours, but yours to veto:** real place names, real terms, verbatim public-domain quotes and NWS forecast text need no approval, and each new one shows in a batch's *not ours* tail (doc 18.2). Dev words (the debug menu and the bug report) are exempt. The game's own number and date formats are approved once, as tokens. All as you agreed (decision 64).

### 10.2 Files and ids

```
content/text/
  README.md      how it works
  en/
    app.json     name, install, frame
    home.json    the cabin
    first.json   lockbox, guest book
    plan.json    map table, permit
    town.json    WIC, stores, jobs
    flatlay.json the flat lay, shares
    trail.json   stops, camp, fork
    report.json  trip report, soak
    death.json   the five screens
    alt.json     pictures' alt text
    fmt.json     months, units, am/pm
    mini.json    the minigames
    cards/       each card's lines
    pools/ look/ places/ items/
    timed.json   from T1
  names/
    places.json  gazetteer (generated)
    terms.json   species, NWS, labels
  approved.json  the ledger
  review/        batches, answers
```

One line, as in doc 18.3: an id, its `text`, a `ctx` note (where it shows and what it has to do), its `screen` and its `max`. Variables in braces, one bit of markup (`*emphasis*`), plurals as `one` and `other`. Cards refer to their lines as `@card.<id>.<part>`, so the lint sees every word in one place. Ids are `<area>.<thing>.<detail>`, and an area is a file.

### 10.3 In code

- **`t(id, vars)`** returns words; **`tx(el, id, vars)`** sets them and tags the element for the debug marks; **`drawText(buf, id, ...)`** blits them from the pixel font's build-time bitmap atlas into a picture's index buffer (share images, the chalkboard), never canvas `fillText`, so a share image is a pure function a Node golden can check (doc 6.10).
- **HTML carries ids** (`data-t`), and the build fills them in for each channel, so the first paint has its words and VoiceOver misses nothing.
- **The manifest is generated** from `app.name`, `app.short_name` and `app.description`.
- **Numbers, times and dates** go through `fmt.js`, built from `fmt.*` tokens, never the phone's locale.
- **A missing id** shows as `⟦id⟧` on preview, and fails main's build (T11).
- **The line inspector** (S5): in debug mode on preview, a long press on any words shows the id, its state, the context note, the length against its limit and its batch, with *Copy for chat*.

### 10.4 The ledger, and the four states

`approved.json` holds, for each approved line: its words, a SHA-256 of the words after Unicode normalization, the batch and line it came from, the date and how you answered. The state is computed by comparing the ledger with the working text:

| State | Means | Main ships |
|---|---|---|
| Draft | No approval on record | Nothing: the build stops |
| Approved | The ledger's hash matches | Your words |
| Changed | Approved once, edited since | Your frozen words |
| Cut | You vetoed these words | Nothing, anywhere |

**Nothing is grandfathered.** Session 1's unapproved lines leave main in S2 (1.2, decision 64), so main's gate has no exceptions from the first day.

**The first entries,** in S2: decision 35's two lines and decision 47's two Credits lines, recorded as batch B000, each with its decision as your answer; then B001's answers, through `apply`.

### 10.5 The lints, and when each lands

| Rule | Catches | Lands |
|---|---|---|
| T07 | Book words in player-facing text, as whole words, outside its allowlist of real things (doc F.3); the bookstore job's entries join it in S35b, each with a reason (Lead call 41) | S2 |
| T10 | Original English outside `content/text/`: JS sinks and shapes, HTML, CSS `content:`, the manifest, SVG | S2 |
| T11 | An id used but not defined, or defined and never used | S2 |
| T12 | A ledger entry with no matching answer, or a bad hash | S2 |
| T13 | Variables that don't match; a placeholder where none may be | S2 |
| T14 | The main gate (10.6) | S2 |
| T16 | A place missing from the gazetteer; an inexact quote; cut words | S4 |
| T15 | A line over its `max` | S5 |
| T02 | Measured fit at 375 x 667 and 393 x 852 | S6 |
| T03 | Real businesses and people, the three real stores and the three places behind the jobs included (6.7) | S11 |
| T05 | A drink or a joint near a car, or anywhere in the cabin scene; the soak's can on the tub's edge is the one exception (decision 46) | S11 |

T04 (no *Golden Glow*) and T06 (no phone links) shipped in Session 1.

### 10.6 The release gate: main ships approved words only

- **The gate.** Main's build collects every id main's scope can reach and takes its words from the ledger. If any is a draft or cut, the build fails and lists them by screen: T14.
- **Scope per channel.** `content/scope/m1a.json` has a `main` block naming the screens main carries. A screen whose words aren't all yours stays preview-only. A session reports what a promotion needs one session ahead, so nothing surprises anyone.
- **The branch and the channel.** The one deploy runs on the `main` branch (6.1), so S2's code lands there; the gate decides what the main channel shows.
- **Your words go live any time.** A PR that touches only `content/text/` may carry newly approved words to main between promotions (decision 64; doc 18.6).
- **v1.0** also refuses any placeholder left in shipped text.

**What main shows, step by step:** your approved name over the cover, with B001's lines and no other English (S2); the cabin as the front door, with its next step disabled, once B002 and B003 are answered; then each M1a screen as its words become yours, at S28's promotion and after.

### 10.7 Batches and the review page

**A batch** is every new or changed line from a session, grouped by screen: a screenshot of each screen with numbered badges (from `tools/shots.mjs`, at the iPhone 17's size first), then for each line its number, id, context note, length against its limit and the words. Changed lines show the old words too; templates show three sample fills; a line no screenshot can reach gets a mock of its box; and a short "not ours" tail lists new place names, terms and quotes for a skim. `tools/text.mjs batch` writes it to `content/text/review/` as a phone-readable file. **Size:** 25 to 40 lines, about ten minutes, at the end of each session (decision 64).

**Answers** (doc 18.7): *ok*, your own words, *cut*, *later* or a note. The next session writes them to the batch's answers file, each with its id and the hash you saw, and runs `apply`. A line that changed after the batch went out isn't approved; it comes back in the next batch.

**The review page** (decision 64). Every batch goes out on a private claude.ai page, as B001 did: a card per line, sized for your phone, with its screenshot, context and length in the game's own font, and *Approve*, *Edit*, *Cut* and *Later*. Your taps are saved in the page's own small database, and the next session reads them, writes the answers file and runs `apply`. A *Copy my answers* button always works as a fallback. The page shows only what the public repo already holds, plus your answers.

**The batches, by plan** (numbered as they go out):

| Batch | Session | Lines | What |
|---|---|---|---|
| B000 | S2 | 4 | Decisions 35 and 47, recorded |
| B001 | Before S2: sent and answered 2026-10-09 | 11 | The app's frame (1.2): 10 sent, and the update note's *Restart* button added in chat; S2 applies it |
| B002 | S7 | ~30 | The cabin |
| B003 | S7 | ~53 | The lockbox and the guest book, as one set (doc Lead call 46) |
| B004 on | S8 on | 25-40 each | Each session's screens; S5 and S6's sample stops join them; the ways to play's and the minigames' words come the same way (Lead call 43) |

### 10.8 How much reading, and what main waits for

About 2,200 lines for M1a (5.6): about six hours at ten seconds a line, or about 55 to 88 batches of 25 to 40 lines, one at the end of each session (decision 64). So M1a's words keep reaching main screen by screen after S28, while everything plays on preview (10.6); if you'd rather read two or three a session to keep main closer, say so. Three things keep it lighter without breaking decision 21 (doc 18.9): many quiet stops have no box at all; sound replaces lines that only describe a sound; and a pool is read as a set, one tap after you've read every line, flagging any you dislike. You agreed to the last two (decision 64).

`tools/text.mjs count` prints where things stand by class and state, and how many main needs. **M1a's promotion carries every screen whose words are yours;** anything not yet answered waits on preview, playable, with its drafts marked.

---

## 11. Home and the frame: the screens, and how they're built

*Decisions 22, 26, 27 and 34, and 41 to 48 from the rapid-fire round. The design is doc 2.2, 3, 5, 6, 9.7, 11.11 and 12; the reasoning is in `design/drafts/frame_home.md`.*

### 11.1 Every screen, and where it's built

| Screen | Doc | Built in |
|---|---|---|
| First launch: the lockbox | 12.3 | S7 |
| The guest book | 12.4 | S3 (plain), S7 |
| Home: the cabin | 2.2, 12.3 | S7; its states in S15, S24, S25; its year in S37 |
| The Trail Register | 12.3 | S24b |
| The map table | 12.5 | S10 |
| The permit | 12.6 | S10 |
| Town, the WIC and the stores; the wallet | 12.7 | S11; the boutique in S35a |
| The town jobs | Lead calls 30 to 32 | The burger drive-in in S14b; the dish pit and the bookstore counter in S35b |
| The flat lay | 12.8 | S12a; its share image S12b |
| The slot picker and the can panel | 12.9 | S12a |
| The bear can | 17.7 | S13-S14a |
| The tailgate | 12.10 | S15 |
| The trail stop | 12.2 | S5-S6 |
| The Why sheet; an outcome | 12.11, 12.13 | S6 |
| The fork card | 12.12 | S16 |
| Camp; the morning | 12.14, 12.15 | S15 |
| A Larry moment | 12.21 | S23 |
| The death sequence | 12.17 | S24a |
| Finish, at the car | 12.22 | S15 |
| The trip report and its share card | 12.23 | S15 (plain), S25 |
| The soak | 12.24 | S25 |
| After a death: the cabin at dusk | 12.25 | S24b |
| Settings, the mailbox | 12.18 | S7 (a stub), S13, S28 |
| Credits and the ranger's reading | 12.20 | S22, S28 |
| The peak: FKT boards and a run | 12.27 | S29-S30 |
| The chalkboard: the Hike of the Day | 12.26 | S43, on preview; on main with the world board, S47-S48 |
| The Bonfire Lily plate | 12.16 | S36 |

### 11.2 The cabin as the hub

- **One tall plate** (160 x 320), drawn from doc 11.11's written brief only. No sign, address, road name or shoreline places it, and no photo enters the repo.
- **The places are data.** `content/home/cabin.json` holds doc 11.11's hotspot map: each place's art box and its larger hit area (at least 44 x 44 pt on every device, so at least 22 columns by 44 rows on the plate, doc 11.11), its label id, its rail button and its states. Where two hit areas overlap, the nearest center wins.
- **Everything is also a button.** The rail and the next-step button are plain HTML, so VoiceOver reads them and nobody has to hunt.
- **The next-step button is a pure function of the save,** in `engine/phases/home.js`: no hiker, no plan, a plan drafted, a plan ready for the desk (*Take it to the desk*, DRAFT), back from town with the permit issued, packed, a trip in progress (the app opens on the trail), just home. It is unit-tested state by state, a day hike's plan and a desk request included (6.6).
- **States are overlays** on the plate's recipe: the trip's props (the permit on the door, the grocery bags, the tiny flat lay, the pack at the car), the homecoming, the lit tub, after a death, first launch. The crew and the seasons arrive in S37; the easter eggs decision 54 names wait for the Boyz' yes. Career marks belong to the hiker and go in the wipe; the tally marks, the race bibs and, from M1b, the lily's gold sketch in the gable window belong to you and stay (decisions 2 and 46).
- **The live scene** runs on Lake Quinault's clock, in the UI only (`platform/now.js`):
  - **The hour:** the Pacific date and time, read with `Intl`'s `America/Los_Angeles` time zone for numbers only; the words come from `fmt.*`.
  - **The sun:** a build-time table for the lake's center, like `daylight.json`, so Node and the phone agree; it picks Day, Dusk (and dawn), Blue hour or Night.
  - **The sky:** until T2, the month's climatology drawn from a hash of the real date, so every phone shows the same sky that day; from T2, the morning job's forecast for the lake; offline, or more than two days stale, climatology again.
  - **The moon:** its phase from the date, by arithmetic (S37).
  - **The homecoming** shows the trip's own arrival time first, then fades to now.
- **No drink anywhere in the cabin scene,** because the car is in it (T05, A07). The soak is a plate of its own, and it has a can on the tub's edge (decision 46).
- **The cover lives on** as the loading art while the cabin's data loads, and nowhere else: a mid-route plate at a fixed dusk would break the daily card's rule (the trailhead, under the day's real sky, spoiling nothing, doc 9.9).

### 11.3 The three stores

- **One store screen, three skins:** an interior drawn once and recolored per store (doc 11.7). `stores/stores.json` lists each shelf by catalog id (doc 5.7), with each item's `origin` and `look`.
- **M1a has two:** `{STORE_GENERAL}`, with the cooler and its ID check, and `{STORE_GEAR}`, with the rentals and the scale. `{STORE_BOUTIQUE}` and its items arrive in S35a. The names are yours to write; until then the placeholders show on preview.
- **They differ in kind:** `bombproof` for the general store, fragile and light at the gear shop, `style` at the boutique (doc 5.2).
- **One notepad, one gauge,** across every counter; *Fill from the list* fills from that store's own shelves, never past what the wallet holds; the receipt shows prices against the wallet (11.7).
- **Real stores inspire, never appear:** T03's deny-list holds Swain's, Brown's Outdoor and MOSS, and the three places behind the jobs (6.7), and the storefronts are drawn as types.
- **Timed modes have no shopping** (lead call 16): the standard shed and pantry, and no wallet (Lead call 29).

### 11.4 The flat lay and its share image

- **The layout is code, not art:** `gfx/flatlay.js` places every item at right angles in fixed zones (shelter, pack, sleep; clothes, kitchen, the worn row; the can and its food; the fun row) with two-pixel gutters, in a few milliseconds. The same kit always draws the same picture, which a hashed golden checks.
- **About 80 stamps,** drawn top-down and lit from the upper left; style twins are palette swaps; outlines show where you shopped (doc 6.1).
- **It is the packing screen:** the drawer below is the shed; two taps move things; a long press opens an item's card; the slot picker, the can panel, the water stepper, the checklist chip, *Like last time* and *Pack it*.
- **The numbers** are live: base weight, pack weight, worn, liters, the can and its days, and where things came from.
- **The share image:** 1080 x 1350, the 160 x 240 lay at 6 x 4 device pixels, with a permit strip on top and the numbers below, the stores shown by their outline marks, and along its foot the hiker's name (it can be switched off), *OP Hiker* and *ophiker.com*, for now (decision 44, Lead call 40). Its text is blitted from the pixel font's bitmap atlas by `drawText` (10.3), so the whole image is indexed, palette-only and golden-tested in Node; `gfx/png.js` writes the PNG using `CompressionStream` (in Safari since 16.4, [Can I use](https://caniuse.com/mdn-api_compressionstream)), with a plain JS deflate as the fallback, never a canvas. It is re-rendered on every flat-lay change (debounced), so the file is ready when the button is tapped; then `navigator.canShare({ files })` and `navigator.share` with **the file alone** (the text is a separate action); Safari has shared files since iOS 15 ([Adactio](https://adactio.com/journal/15972)). The button is never held disabled waiting on the share's promise ([WebKit bug 234187](https://bugs.webkit.org/show_bug.cgi?id=234187)). Otherwise a sheet shows the image to press and hold.
- **Beer may show on the deck,** never on the tailgate (T05).
- **Backdrops:** the deck (S12), the tailgate (S15), the wool blanket (S37). The gear-list CSV waits for M1b, after a real LighterPack export confirms its header.

### 11.5 The trip report, and coming home

- **S15a** builds the plain report: the ending's stamp, the title (picked from three), the route and permit, the stats, the splits, each day's headline with the hiker's log lines, the gear notes, Field Notes, and *Share*, *Hike it again* and *Back to the cabin* (DRAFT).
- **S25** finishes it: photos (the alpenglow shot's best as the cover), conditions, the elevation profile, and its own 1080 x 1350 share card; reports by the fire bowl; the drive home; the homecoming; the soak.
- **The voice** is your call (decision 37): you, now, in the moment, and the hiker's terse first-person log for the record (doc 2.3). Every line is an id, so any later change of voice is a rewrite of words, not of code.
- **The tub** lights when the hiker comes home spent, read from the meters (decision 39), with the thresholds set from your playtests; until then `score.js`'s trail hours stand in (8, in `tuning.json`; doc 2.2, proposed). An Olympus summit always lights it, and so does a new FKT personal best on a route of at least 8 trail hours (a plain finish isn't enough, since tries are unlimited; doc 2.2); and, once clams ship, a winter night dig (decision 61). Reports keep their rendered log, so they survive updates (doc E.6).

### 11.6 After a death

- **The five screens** (S24a), then *Back to the cabin* (DRAFT, S24b): the cabin at dusk, the porch light on, one chair empty. The wipe runs the dust renderer over the trip reports and the route signs; the shed empties and the wallet goes back to $0 (Lead call 29); the register post gets a fresh mark; the guest book opens. Reduce Motion gets a cross-fade.
- **A timed-mode death** (from T1) plays the same five screens with a DNF stamp and signs its tagged line in *Remembered* at the trailhead's register box, then comes home on the real clock with nothing wiped (lead call 17, decision 43).

### 11.7 Money: the wallet and the town jobs

*Decisions 41 and 42; Lead calls 29 to 33. The jobs are the doc's minigames 9 to 11 (Lead call 31).*

- **Basic and nice.** Every item in both catalogs carries a flag, set at the source (S4): **basic** is the plain, serviceable version of each essential, mostly on the general store's shelves, and free; **nice** is everything else, at its catalog `price_usd`. Rows say *free* or show the price (DRAFT words, in S11's batch).
- **The wallet** starts at $0, belongs to the hiker, lives in the hiker's save, and goes in the wipe at a death (decision 2). It is Open only: the timed modes keep the standard shed and pantry, with no shopping and no wallet (lead call 16).
- **The empty shed** (decision 42): a new hiker owns nothing but the town clothes they arrive in (decision 67), so the first town run is the first shopping and the first flat lay is all the player's own choices. The traps stay on the stores' shelves, so the flat lay still teaches, and the town clothes are four of them: nothing warns about them before the trail does. The desk lends a bear can to a hiker without one (Lead call 33).
- **The jobs** are doors on the town street: `{JOB_DRIVEIN}` in M1a (S14b), `{JOB_GASTROPUB}`'s dish pit and `{JOB_BOOKSTORE}`'s counter in M1b (S35b), each name yours to write. A shift is one minigame on the shared host (12.1), under a minute, one thumb, with its card, *Auto* and a result line that is the pay. Pay is a base wage plus a skill bonus, from `rules/tuning.json`, and *Auto* earns par pay. One shift per job per trip, the doors shut until that trip passes *Start walking* so re-planning never reopens them (doc 5.8), so earning is a small ritual, not a grind. No ♦ anywhere in a shift; town only; never in the timed modes.
- **Burger flipping is the takoyaki game** (Lead call 31): many small, well-timed touches, each with its own sound, the tactile, rhythmic one. The dish pit and the bookstore counter are lighter.
- **Seeds and replay** work as for every minigame: the `mini` stream, keyed to the job and the town visit, and the shift's inputs in the action log, so a bug report replays a shift to the same pay.
- **Real places inspire, never appear:** the jobs' real places are on T03's deny-list (6.7). A bookstore really sells books, so T07's allowlist gains its stock and its lines about selling books, each with a reason, in S35b's batch (Lead call 41).

---

## 12. The minigames in M1a

*Decisions 29 and 30, and 55 to 61 from the rapid-fire round; the jobs are Lead calls 30 to 32. The design is doc 17; the tuning tables are in `design/drafts/minigames.md`.*

### 12.1 The shared host (MG0, S13)

- **The contract** (doc 17.15): each core in `engine/mini/` has `init`, `step`, `done`, `result`, `par` and `bounds`; `run()` replays an input stream to a result, for tests, bug reports and the timed modes' verifier.
- **The tick:** 120 a second, whatever the screen does; at most 8 caught up a frame; drawing interpolates and never feeds back.
- **Inputs** are `[tick, kind, a, b]` integers, logged at the tick they are applied: `max(tickOf(event.timeStamp − epoch), lastSimulatedTick + 1)`, with the epoch re-anchored whenever the 8-tick cap drops ticks and after every resume, and `performance.now()` in the handler if `event.timeStamp` disagrees with it by more than a second at the start (doc E.12). Drags are sampled into the simulation every 4 ticks, delta- and varint-encoded, under a per-minigame log budget. The log lives in memory; discrete actions go to IndexedDB at once and move samples in batches about every 250 ms, flushed on `visibilitychange` and `pagehide`; `localStorage` only at stop boundaries (doc 17.4). Closing the app pauses; it resumes from the last tick with a one-second count-in, and in the timed modes the pause is logged, the track ahead hidden, and the view rewound a second on resume.
- **Integer world units** (1/16 of a picture pixel); `Math.sqrt` is the only math function; everything else is a build-time table. The banned functions throw inside `engine/mini/`.
- **Seeds** from the `mini` stream: `hash(seed, "mini", game, place, day, attempt)`.
- **The card:** the place's picture, the verb in one line, the hands range with the hand glyph, and *Play* and *Auto* (doc 17.6). A ghost thumb shows the gesture once in a career.
- **Settings:** a row per minigame (*Ask*, *Play*, *Auto*), *Left-handed*, and the Open-only assists.
- **Access:** one thumb in the lower 45%; 44 pt targets; nothing by color or sound alone; Reduce Motion, VoiceOver (*Auto* is the playable path), a tap skips anything that isn't play, and no haptics: no vibration API and no iOS switch trick, so sound carries the feel (decision 55, Lead call 42).
- **Budget:** under 2 ms a frame on an iPhone 12; at most one extra canvas; paused when hidden.

### 12.2 The three, and the first job

| Minigame | Opens from | Feeds | Target (7.6) |
|---|---|---|---|
| The bear can (S13-S14a) | The flat lay's can, before overnights | How much food fits | Par 85% ± 2 |
| The alpenglow shot (S17) | Sunsets on the crest, Heart Lake Junction, Bogachiel Peak | Spirits, the report's cover | Auto about 68 |
| Huckleberries (S20) | Ripe patches, August and September | Food, spirits, time, the bear | Auto half a quart |
| The burger drive-in (S14b) | Its door on the town street, one shift a trip | The wallet | Auto at par pay |

- **The bear can:** the four catalog cans (7.2, 10.1, 10.6 and 11.5 L) cut away from their makers' sizes; items round and squishy; two of the same zip into one bag 10% smaller; tortillas line the wall; the lid presses shut; what won't fit lies on the deck, and in the share image. Free repacks until *Start walking*. `pack.js` takes the fit from the result instead of the flat 85%. In M1a you pack once; the can that remembers is M1b's.
- **The alpenglow shot:** about 49 seconds of real light in mid-August (doc 17.8), from the light-curve table by date; the lull before the pink comes back; framing, holding still, exposure; a photo kept as about 10 bytes and redrawn exactly; pseudo-color 27. It feeds spirits and the report's cover, and from M1b the Bonfire Lily's whole-sunset term.
- **Huckleberries:** combing with a cursor drawn above the thumb; the cup is the park's real quart; ripeness by the season table; a bear's tell in the patch (dice, with the existing bear card); Leave No Trace −2 for stepping off the trail. The munchies, where every berry goes in your mouth, arrive with the pre-roll in M1b (decision 58).
- **The burger drive-in:** the takoyaki-style job (Lead call 31), many small, well-timed touches on the grill, each with its own sound; the result line is the pay; no ♦ (11.7).

### 12.3 Tests, the bar, and the cuts

- **Tests:** golden input streams replay identically in Node and Safari and at 60 and 120 Hz; no bot beats `best` or falls below `worst`; par stays put; the verifier rejects inhuman input; the ♦ lint runs across hands ranges.
- **The pitch-perfect bar** (doc 17.6) is each minigame's exit, on your phone: feedback within a frame, learnable in three seconds, under a minute, a result line in numbers, no hidden dice, identical at 60 and 120 Hz, skippable, *Auto* on the card, access paths, 2 ms a frame, and five new players who get it and want another go.
- **Cut first:** the bear's tell (keep the patch), the disposable film camera's counter and the photo gifts, the can's special items except the tortilla liner. **Never cut:** *Auto*, the hands range, determinism, the result line.

### 12.4 Later

| Minigame | When | Session |
|---|---|---|
| The technical descent | T1 | S31 |
| The dish pit and the bookstore counter, the other two jobs | M1b | S35b |
| Self-arrest, with no practice anywhere (decision 59) | M1b | S38 |
| The tent in the rain; the can that remembers | M1b | S39 |
| The ford, which can kill at waist depth (decision 60) | M2 | With the Hoh's braids |
| Razor clams, a shovel only (decision 61) | M1b or M4, your call | One or two, after S39 if M1b |

---

## 13. The sound

*Decisions 32 and 33, and 62 and 63 from the rapid-fire round. The design is doc 13; the research and every table are part one of `design/drafts/audio_text.md`.*

### 13.1 The rules that shape the code

- **No music on the trail,** the drive or in town: the place and your own sounds. Music at the cabin and a few key moments only. The trail's two exceptions (decision 62): the instruments you carry in, played at camp (the harmonica, the travel ukulele, the melodica and the full-size guitar, Lead call 38), and the Bonfire Lily's five rising notes, once in a hiker's lifetime. The drive is road hum, rain and wipers, with no radio; no human voices anywhere, not even murmur; no jet noise in the first release (decision 63).
- **Sound never carries information alone,** so the game is complete on Silent. Most players will play that way.
- **Sound has its own random stream,** so it can never change a roll, a daily or a replay.
- **Web Audio for everything,** in the ambient session; AAC in `.m4a`; nothing depends on a gapless loop (lead call 25).
- **The ground is the instrument:** each surface in the park data owns its footstep.

### 13.2 Files

| Path | What it is |
|---|---|
| `web/js/audio/engine.js` | Context, unlock, session type, buses, interruptions; runs `dsp.js`'s limiter in an AudioWorklet |
| `web/js/audio/dsp.js` | Pure synthesis and the limiter: renders every synthesized sound into buffers on the phone, and the same samples in Node |
| `web/js/audio/scape.js`, `steps.js`, `music.js` | Layers from place, hour, season and weather; footsteps and the walk-on; the cabin band |
| `content/audio/sounds.json`, `scapes/`, `music/` | The cue bank; the listening maps; the scores, as notes |
| `content/audio/credits.json` | The license log |
| `content/audio/masters/`, `enc/` | Short trimmed FLAC excerpts; the AAC files that ship |
| `tools/audio.mjs`, `tools/listen.mjs` | Fetch, master, encode, log; render a scene to WAV, a spectrogram PNG and a loudness reading |

### 13.3 The iPhone checklist

All from doc 13.10, each with its source there:
- **Unlock on the first `touchend` or `click`,** never `touchstart`. In the handler, synchronously: set the session type, create or resume the context, play one silent frame.
- **`navigator.audioSession.type = "ambient"`** where it exists (iOS 16.4 on), never `"playback"`, so Silent Mode mutes the game and your own music plays on under it.
- **A watchdog,** because Safari has no `audioSession.state` and a context can claim to run while its clock has stopped: if `currentTime` doesn't move, suspend and resume on the next tap, and rebuild as a last resort. Hidden page: suspend; back: fade in over a second.
- **AAC only:** Opus works in Safari only from iOS 18.4. Mono unless stereo matters.
- **No gapless loops:** continuous sounds are synthesized; recordings play through a grain player of 4 to 8 second slices; one-shots ride in sprites that open with a sync click.
- **Memory:** about 120 seconds decoded at once (about 23 MB), loaded by region.
- **Size:** about 2 MB for M1a, precached for offline.

### 13.4 Sources, the pipeline and the license log

- **Three kinds of source may ship:** CC0 (Freesound's CC0 filter, Kenney), US government public domain with a written statement (the NPS Rocky Mountain and Yellowstone libraries, the NPS sound gallery), and synthesis. **Out:** BBC Sound Effects, the Sonniss GDC bundles, the Western Soundscape Archive (doc 13.9).
- **The pipeline runs in sessions only.** `tools/audio.mjs` fetches a source into the scratchpad, masters it to a short FLAC excerpt (trim, fade, de-click, high-pass, level-match), encodes AAC and logs both files' SHA-256. The session container's ffmpeg has the AAC, FLAC and Opus encoders (checked 2026-10-08). CI never needs ffmpeg: the build only checks hashes.
- **Every file is logged** in `credits.json`: id, file, source, URL, title, author, license, the evidence and the date checked, any stand-in and for what, what was changed, both hashes, and what uses it. The Credits screen's Sounds part is built from it, with *National Park Service* as the NPS asks.
- **Stand-ins are honest** and logged as such: the hoary marmot for the Olympic marmot, Rocky Mountain elk for Roosevelt elk, the pine squirrel for the Douglas squirrel. The Pacific wren is synthesized, since no usable CC0 recording of it exists (doc 13.9; `FACT_CHECK.md`, 2026-10-09). Both as you chose (decision 63).
- **A CC0 file must pass** a listen in full (as a spectrogram and a loudness trace): a real field recording, no voices, no music, no bells, no brand you could name by ear.

| Rule | Catches |
|---|---|
| A01 | A shipped sound with no log entry, or a license outside the three |
| A02 | An entry missing its URL, author, evidence, date or hashes |
| A03 | A file whose hash doesn't match its entry |
| A04 | A source from a denied library |
| A05 | Over budget: all audio over 2.5 MB, a file over 200 KB, a scene over 120 s decoded |
| A06 | A cue used but not in the bank; a bank sound nothing uses (a warning) |
| A07 | The can or the lighter at the cabin, the car, the drive or a trailhead; the soak's can on the tub's edge is the one exception (decision 46) |
| A08 | A death cue in the gentle mode; the lily's motif off its plate |
| A09 | A score not marked original, or public domain with its work, composer and year |

### 13.5 Checking a mix with no ears

`tools/listen.mjs` renders any scene in Node with the same `dsp.js` the phone runs, and writes a WAV, a **spectrogram PNG** the agent looks at, and a loudness and peak reading. **That render is what the phone plays,** because the phone shapes nothing outside `dsp.js`: beds are rendered into 15 to 20 second buffers and looped with a crossfaded seam (counted in the decoded budget), music a bar ahead, cues as buffers, and the native nodes only play and apply gains and pans; the master limiter is `dsp.js`'s own in an AudioWorklet (iOS 14.5 on, [Can I use](https://caniuse.com/mdn-api_audioworklet)), never a `DynamicsCompressorNode`. As a check on the real output, the debug menu's *Render 10 s of this scene* runs the graph in an `OfflineAudioContext` on the phone and puts its peak, loudness and a small spectrogram in the bug report (S5). The checks: no clipping; a trail scene around −24 LUFS and the cabin with music around −20; a mid-range part in every important cue, for phone speakers; the hush really hushing. The dirge and the stings render to the same bytes every time, as goldens. **Listen batches** (decision 63: yes, and optional to answer) are a few short files in chat (the cabin theme, the soak, dawn at Deer Lake, rain on the tent); reply "yes" or "more X, less Y", and silence means keep going.

### 13.6 A1 to A7, and where they land

| Step | Work | Session |
|---|---|---|
| A1 · the core | The engine, buses and limiter, the Sound toggle, `dsp.js` and its goldens, the UI ticks | S5 |
| A4 · danger | Thunder at its true distance, fog, the hush at the ♦ | S16 |
| A2 · the trail | Beds, the scape resolver, the loop's listening maps, footsteps, the walk-on, the camp instruments' tunes | S21 |
| A3 · the sources | `audio.mjs`, the log and its lints, the loop's animals, gear, the flat lay | S22 |
| A5 · the end | The death cues and the dirge | S24a |
| A6 · home | The cabin's places, the roof's weather, the cabin band on the real clock, the soak, the finish | S25 |
| A7 · the mix | A pass on your phone, the budgets, a listen batch | S28 |

The minigames and the burger drive-in bring their own sounds in their sessions, and the camp instruments' tunes come with A2 (S21); the daily's sting comes with T2 (S43). That is about two sessions of sound alone plus parts of five others, against the doc's estimate of 3 to 4.

---

## 14. The timed modes: T0 to T5

*Decisions 23, 24, 25 and 31, and 49 to 53 from the rapid-fire round. The design is doc 1.3, 9.9 to 9.12 and E.12; the reasoning is in `design/drafts/daily_fkt.md`.*

### 14.1 T0, inside M1a: cheap now, a rewrite later

- **S3: the complete action log.** Everything that can change a result is an action: the start time, what goes in the pack and on the straps, every choice, pace change, wait, *eat now*, and every minigame's input stream. One canonical form, varint-packed, hashed with no-op actions stripped, compressible with `CompressionStream`. The same form serves bug reports, crew links and the world board.
- **S3: the rules hash** over the engine's code and data, in `version.json`, and the **standard profile** stub in `rules/standard.json`.
- **S8: one integer-second clock** in every mode, rounded once at defined points; Open shows minutes. It replaces the old plan's whole minutes.
- **S13: minigame inputs in the log,** at the tick each is applied, drags sampled at a fixed rate, under a byte budget (12.1).
- **The test that holds it:** the same log replays to the same final-state hash in Node and, through the self-check, in Safari.

### 14.2 T1: the High Divide Loop FKT (S29 to S31)

- **What ships:** the loop's two boards, ↺ and ↻; the three styles; the runner, fuel, water, ankles and headlamp starts; splits and ghosts; Step 1's boards on your phone and Step 2's share card; the technical descent; the peak at the cabin; race bibs on the porch post.
- **The week's window,** before any morning job exists: each route's window (a date in its season, and that date's conditions) is worked out on the phone from the week's id, with the climatology chain and a seed hashed from the route and the week. So T1 needs no server, and every phone gets the same week. The cost: anyone who reads the code could work out next week's dice, which matters little when tries are unlimited. From T2, the morning job publishes each Monday's window with a random seed (`fkt/YYYY-Www.json`), and the phone prefers the file. Before then, the job's shadow run (6.8) writes that file on Mondays with only the rules hash live at Monday's opening, so the week's rules are pinned from T1 (doc E.12). A week opens at Monday's sunrise over the Olympics (Lead call 34): from the build's sun table in T1 (3.5), and from the published file once the job publishes.
- **The `daily` data branch and the rules archive.** A week's ghosts must replay on the rules they ran on, so T1 brings the archive (doc E.12). The rules hash covers outcomes only (the engine and the outcome data timed routes can reach, never words), and a timed route reaches main only when everything it can deal is approved, so approval batches never move it. Each deploy that changes main's rules hash publishes the engine and its data at `/e/<hash>/` (about 1.3 MB), carried forward from the live `site` branch, not stored in git, for 45 days or while any open day, week, standby day or pin names it; and it attaches the same copy as a **Release asset** on its permanent `rules-<hash>` tag, so the repo never grows by a megabyte a version and the verifier can always fetch it. The `daily` branch holds only day and week files. **One small engine API** (`init`, `step`, `replay`, versioned) lets a newer UI drive an archived engine, and every deploy tests the new UI against the previous rules version. **On preview,** the FKT boards and the daily are practice only: never posted, never crew-verified.
- **Stashes** from your Open hiker go at the car or a trailhead only, until Olympic's Superintendent's Compendium is checked for caches by private visitors (doc 9.11); then, as you chose, a bear-can stash may wait at a designated backcountry camp for up to 24 hours (decision 52). The 24-hour rule is real law, 36 CFR 2.22.
- **Storage:** your handle, bests and week's bests in `oph.<channel>.timed`; the attempt in progress in `.attempt`, written at stop boundaries; **its pin** (rules hash and week file) and its input log in IndexedDB `oph-<channel>-attempt`, where the service worker reads the pin: a new worker fetches `/e/<pinned hash>/` into `oph-<channel>-pin-<hash>` and never deletes it while the pin stands, and a resumed attempt loads the pinned engine, never the current one (doc 9.10). Ghosts' logs in IndexedDB. An Open death never touches them (lead call 18).
- **The week's rules:** a week runs on the rules live at Monday's sunrise opening; a mid-week hotfix is explicit and starts a new board segment (doc E.12).
- **Lints:** every disqualifying choice says so on its button; no real FKT athlete's name or time; the handle filter's reserved list (Jon, Ranger, the Boyz' names, 104, NPS, and every real business on T03's list, the jobs' places included).
- **Exit:** 8.4.

### 14.3 T2: the Hike of the Day (S42 to S44)

**S42 · The morning job** (doc 9.10):
- `tools/daily.mjs`: read the live `version.json`, check out `rules-<hash>` and refuse unless `/e/<hash>/` is live, releasing any held rules change first; pick today's slot and candidates from `content/daily/library.json` (season, snow and road; the cooldown; the ranger's veto on NWS warnings only); fetch each candidate's weather anchors, Quillayute's cell and Lake Quinault's from api.weather.gov, always with a User-Agent; convert each forecast to game weather and draw the actual weather once; smoke-test each candidate 2,000 times (F.1's sensible death cap); take par from the Steady bot's median at each split; draw a **128-bit random seed**. Then bake one more **standby day**, 45 days ahead, on climatology, through the same steps; the first 45 are baked once by the nightly job when T2 launches, and all 45 are baked afresh when T4 launches, with their seeds held by the Worker (8.6).
- **A runtime budget test:** the whole run, with the can's Auto memoized (7.1), fits well inside the 25-minute timeout and the 4:23 last slot; if not, route choice and the smoke test move to the evening before, on climatology (7.6).
- **The day's file,** written once: number, date, the opening instant (that date's sunrise over Lake Quinault's center, so no phone computes it, Lead call 34), route, start window, seed and drawn truth (from T4, only their hash commitment, both held by the Worker, 8.6), rules hash, the NWS board, par. A golden holds the sunrise instants to the second: in 2026 the earliest opening is 12:17:42 UTC (5:17 am PDT) on June 15 and 16, and the latest 16:03:07 UTC (8:03 am PST) on January 1 (`FACT_CHECK.md`, 2026-10-09). `daily/index.json` lists each day with its SHA-256, and `daily/standby.json` the next 45 standby days. `daily-push.mjs` pushes them to the `daily` branch and refuses to overwrite a published day; `site-overlay.mjs` deploys data only; `daily-live.mjs` waits until the live index lists today (6.8).
- **When it fails:** the next of nine runs retries; if the day isn't live by 4:45, today's standby day is published instead and archived as the day, and no NWS-sourced file for an opened day is ever uploaded; an issue after two failed mornings, which emails you. **No phone ever computes a day:** it plays the standby entry for the date. A recorded NWS response is a test fixture that converts to a known day file byte for byte, and each row of doc 9.10's failure table has a test, the slow deploy and the red main included.
- `daily.yml` (6.8), nine runs a morning, with the data-only deploy and `keep-awake.mjs`, whose two open questions are tested here (does the enable call reset the 60-day clock; may `GITHUB_TOKEN` make it).

**S43 · The Hike of the Day:**
- **The chalkboard** at the cabin (12.26): today's route in chalk, the weather in chalk marks, par, the streak in tally marks, the antenna's light for a new day, and the daily's sting (A6's last piece).
- **One shot:** the shot is spent at *Start walking*, when the clock starts (packing before it is free, as doc 17.7 has it); after that the attempt resumes, never restarts, and it belongs to the day it started on. Day hikes score elapsed time; overnights score trail time with the clock paused in camp. Splits against par on the strip.
- **Seeding:** the day's 128-bit seed takes the trip seed's place in every stream (doc E.8), so every phone draws the same cards, rolls and minigame bushes (the weather's truth is in the file itself until T4; from then the Worker deals it a stop at a time with the rolls, doc 9.10); the standard profile's empty memory keeps the Director's novelty the same for everyone.
- **The standard hiker** packs from the standard shed in the flat lay; the overnight permit is `104-` plus the day's number and never moves the Open counter.
- **Streaks** count days you came home: a finish, turning back, a rescue or a DQ keeps it; a death or a missed day resets it (decision 50). A rule break disqualifies the run; Saturday and Sunday each get their own one-night trip; only an NWS warning swaps the route (decision 50).
- **A death** plays the five screens with a DNF stamp and a tagged line in *Remembered*, epitaph and all (decision 43); no wipe.
- **The share card:** text that spoils nothing, and the trailhead's picture under today's real sky.
- **The cabin's real weather** switches from climatology to the lake's forecast in the day's file.

**S44 · Crew links and pinning:**
- **Pinning:** the phone fetches the index past its cache once a day, takes *today* from that response's `Date` header (never its own clock), then the day's file, and refuses a file whose hash doesn't match; with no live file at the day's opening it plays the date's entry in `standby.json`, which the worker keeps in its data cache. The attempt's pin goes to IndexedDB, the worker keeps its engine in a pin cache, and a resumed attempt loads that engine (14.2). **Offline, the daily waits:** on preview, for one fetch of the day's index (lead call 20 and doc 9.10); once it's public, with server-held dice, for a signal throughout, and a dropped run resumes up to two hours past the day's close (doc 9.9; Lead call 35, 8.6). Open and FKT practice play offline as ever.
- **Crew results** (Step 3): a self-contained text block carrying the day or week, the rules version, a handle and the packed log, under 2 KB; `#r=` is the same block in a link. **On iOS a link opens in Safari, not the installed app** (doc 9.12), so Safari shows a spoiler-guarded landing card with the replayed time, *Open OP Hiker to compare* (DRAFT) and one-tap *Copy*; in the app, the chalkboard and the peak have *Paste crew results* (DRAFT), reading the clipboard behind a tap, with a paste field as the fallback. The app replays each result and shows the time, or *unverified* in grey; sealed until you've played; pins and local nicknames; one block to catch up a latecomer. Crew ghosts on the daily's strip are off by default, with a switch (decision 50). Share codes work the same way.
- **The Safari self-check** gains the timed corpus.

**The library:** the loop's nine routes (doc 9.9) carry a summer; M1b's Sol Duc and Lake Crescent routes carry the shoulder and a thin winter; T3 makes winter good.

### 14.4 T3, T4 and T5

- **T3 · Lake Quinault's four low trails** (the Quinault Rain Forest loop, Kestner Homestead and Maple Glade, Pony Bridge, Irely Lake), already in `south_quinault_skok.json`: ingest, composed scenes, library entries. Two to three sessions, before the first winter of dailies; you said yes (decision 51).
- **T4 · The world board, with the daily's public launch** (doc 9.12, Step 4; S47-S48, 8.6): a Cloudflare Worker and D1 **on Workers Paid, $5 a month**, which checks results itself (30 s of CPU per request by default, up to 5 minutes; a Cron Trigger up to 15 minutes, [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)). Actions never checks results, because GitHub's terms rule out Actions as part of a serverless application ([GitHub additional product terms](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features)); `board.yml` only writes the nightly static top 100 to the `daily` branch. Board JSON cached at the edge for 30 to 60 seconds; ranks from per-board time histograms updated on each verified result, never `COUNT` scans, since D1 bills rows scanned ([D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)); when a limit trips, the static boards on Pages. **The honesty choice is made: server-held dice** (decision 53, Lead call 35). The day's file and `standby.json` carry only a hash commitment of each seed and its drawn truth; the Worker holds both, deals each stop's roll as you play, and records one attempt per device key; first-attempt-only and a minimum elapsed time hold too. So the public daily needs a signal while it's played; offline, the chalkboard says so (DRAFT words); a run that loses its signal waits and resumes when it's back, up to two hours past the day's close (doc 9.9); Open and FKT practice stay offline. Handles with the PG-13 filter, whose allowed words (beer, IPA, *420*?) you pick from a recommended default; opt-in privacy and *Erase me*. Two to three sessions, S47 and S48 right after M1b, with a Cloudflare account on Workers Paid and two GitHub secrets, which you set up at the start of S47: a Cloudflare API token, and the board's admin token, which the morning job also uses to hand the Worker each day's seed and truth (doc 9.10, 9.12). **The Hike of the Day goes public on main only with the world board** (Lead call 36); preview may test the daily before that, as practice. The FKT boards join the world board later, once doc 9.12's question on keeping a week's board honest is settled.
- **T5 · More FKT routes** as regions land, about one session a region, and the Press Expedition crossing to Lake Quinault in M5.

---

## 15. Risks

| Risk | Mitigation |
|---|---|
| **The agent can't see your phone** (no Mac, no Web Inspector) | Copy bug report replays exactly, from its own commit; the replay self-check runs on the phone (S3); `?debug=1`; PNG renders at the phone's pixel shapes; WebKit screenshots for the sizes you don't own; spectrograms for sound; the 2.8 rules; you only check the short F.5 list |
| **Approving every line becomes the bottleneck,** or main falls far behind preview | Sessions never wait; batches of 25 to 40 by screen with screenshots; the review page; fewer, shorter lines (quiet stops, sound for flavor, pools as sets); main carries each screen as its words arrive, and you can play everything on preview meanwhile (10) |
| **An approved line changes without your seeing it** | The ledger's hash; a changed line falls back to draft and main keeps your frozen words; auto-fixers skip approved lines; only `apply` writes the ledger (10.4) |
| **Node and Safari roll or replay differently** | `math.js` only, the rest banned and linted; whole-second clock; fixed-tick minigames with integer units; daylight and sun tables precomputed; goldens compare state hashes; the self-check runs them in your phone's Safari every build (6.6, 14.1) |
| **Pages deploy pitfalls:** one artifact is the whole site; the environment deploys from `main`; a broken preview; the archive bloating the artifact | One workflow on `main`; preview pushes and the morning job dispatch it; the `last-good-preview` fallback; a red build deploys nothing; the archive keeps preview's versions only 2 days (14.2) |
| **Stale files on iOS,** or updates that cost players' data and Pages' 100 GB soft monthly bandwidth ([GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)) | A build id over code and content, stamped into `sw.js`; `cache: 'reload'`; the worker checks `version.json` before caching; `registration.update()` on every return to the foreground; updates wait for the cabin. Content-hashed file names, so a new worker copies unchanged files and fetches only what changed, with the audio as its own pack: about half a megabyte a typical update, not 5 MB. Rough numbers: 5,000 installed phones updating weekly is about 10 GB a month that way, about 100 GB without; the daily's files add about 3 GB. CI checks that a data-only deploy leaves the build id and `sw.js` byte for byte |
| **iOS clears storage, or Safari and the Home Screen split it** | Install before the first save; `persist()`; Export and Import, the timed record included |
| **The cabin gives away a private place,** or the reference photos leak | Drawn from the written brief only; no photo committed; no sign, address, road name or shoreline; sun and weather for the lake's center; Jon by first name only, and nothing about where he lives. The clam photo the same way: the dig's result screen is drawn from a description of its composition, and the photo stays private (decision 61) |
| **The real clock makes home feel wrong** for a player far away, or the forecast is missing | Pacific time, said once in a Look; the homecoming shows the trip's own time first; climatology whenever the forecast is stale |
| **The Boyz or 104 shut strangers out** | Every egg is a Look or a cosmetic, never a function; first launch is shown to someone who has never heard of the Boyz (F.5) |
| **The minigames feel fiddly or tip the odds** | Eight on the trail and three short jobs in town; a minigame never kills on its own, only through a ♦'s shown death roll (self-arrest and the waist-deep ford, decisions 59 and 60), and a job never can; one rule for hands and dice with the range on the button; *Auto* at par; the pitch-perfect bar on your phone; about a 10% cap on a daily's time between worst and best hands |
| **Money turns into a grind,** or a new hiker can't afford to go | The basics are always free and the desk lends the can, so a hiker with $0 can always go; one shift per job per trip; the pay tuned against the nice items' prices in S27; money is Open only (11.7) |
| **Sound misbehaves on iOS, or a recording isn't really free** | The ambient session, unlock on `touchend`, a watchdog, no gapless loops; only CC0, NPS public domain or synthesis, logged with hashes and checked by A01 to A09; the game is complete on Silent |
| **The morning job fails,** NWS changes its API or blocks GitHub's runners, a red or slow build holds up the deploy, or GitHub puts the schedule to sleep after 60 quiet days | The game never depends on it, and no phone computes a day: the standby calendar, 45 days ahead; a data-only deploy no build can block; *live* as the commit point, the standby day swapped in at 4:45; nine runs a morning; shadow runs from T1; the enable call after every run; an issue that emails you after two failed mornings; a recorded NWS fixture in the tests (6.8, 14.3) |
| **Timed modes teach the wrong lessons** | Turning back and rescue keep the streak; a death is a DNF on a fresh hiker; honest ankle and bonk odds; rule breaks disqualify, as on the real FKT site; no real athlete's name or time |
| **Cheating and scouting** | Only replayed times count; a modified game can't fake one; crews run on the honor system, as in Wordle; the public board launches with server-held dice (decision 53): no seed reaches a phone before the last attempt on its day can finish, two hours after the close, and the Worker records one attempt per device, so a script has no day to search (14.4) |
| **The public daily needs a signal,** and the Worker can fail | A run that loses its signal waits and resumes up to two hours past the day's close (doc 9.9, Lead call 35); offline, the chalkboard says so; Open and FKT practice stay offline; Workers Paid's limits and the static fallback boards; what the chalkboard and the streak do on a day the Worker can't deal is settled in S47 (8.6, 14.4) |
| **A timed run and its rules come apart** (a deploy mid-day, an app killed mid-attempt, a phone clock set wrong) | Outcome-only rules hashes, released in the morning window; FKT weeks pinned at Monday's sunrise opening; pins in IndexedDB and a pin cache the worker keeps; *today* from the index's `Date` header; a versioned engine API tested against the previous version on every deploy; preview's timed modes are practice only (14.2, 14.3) |
| **Crew links open in Safari,** not the installed app | Results are plain text blocks; Safari shows a landing card with *Copy*; the app has *Paste crew results*; a device check through Messages (14.3) |
| **The world board breaks GitHub's terms or a free plan's limits** | The Worker checks results on Workers Paid; Actions only publishes the nightly static top 100; histogram ranks and edge caching; static boards when a limit trips (14.4) |
| **The repo grows with every rules version** | The archive is carried forward on the site and kept as Release assets, not in git; workflows fetch only the refs they need, shallowly (6.3, 14.2) |
| **Thunder and fog odds are estimates,** and the crest's deaths depend on them | Flagged in the data with their evidence; tuned to the caps in S27; listed on the review site |
| **Permadeath feels unfair** | The fairness invariant on every simulated death; lints for sure choices and foreshadowing; every target met before you play |
| **Content volume and voice drift** (about 58 cards, about 2,200 lines) | The Authoring Brief and the voice rules; batches of 25 cards; the bench; 20 transcripts a batch; your batches and the review site |
| **AI-drawn art looks muddy** | The PNG loop; option B side by side; your sign-off at S6 before the cabin and anything in volume; bases reused |
| **M1a scope creeps,** or sessions run long (the plan's target is the 32nd session counted; 32 to 37 is likely) | The shows-and-hides list; a floor for every session; the S12, S14, S15 and S24 splits; the checkpoint after S20 and its pre-agreed cut ladder to M1b; the spare sessions; M1b holds the rest (1, 8.3) |
| **Privacy: friends' names, your Morgenroth track** | Placeholders only, enforced by a lint; track files ignored by git; only a simplified line committed; the Strava link stripped; bug reports scrubbed; you're told issues are public |
| **The real WIC number on screen** | Hidden in M1a; the `format-detection` meta from Session 1; T06; a device check from M1b |
| **Lost context between sessions** | `BUILD_LOG.md`; small PRs; one plan entry per session; CI as the contract; the ledger and batch files as the words' record |
| **The doc and the engine drift apart** | The doc's numbers are golden tests; when one must change, the doc changes with it, and you hear about any number you'd care about |
| **The harness is too slow to balance with** | The look-ahead memo and 100-run bot bars; trip cost measured in S15b and the matrix sized from it; the harness running from S15b; the checkpoint after S20 and the cut ladder (8.3) |
| **GitHub won't take a session's workflow file** | Session 1's went through; if a later one is refused, you paste one file from your phone (6.1) |
| **PG-13 tips into crude, or ends up near driving** | T05 and A07, the cabin scene included; the censor bar does the work; `flags.larry`; your review of each moment |

---

## Sources for this plan

The design doc's sources stand for every fact taken from it. Checked again for this revision, on 2026-10-08:

- **`GITHUB_TOKEN` and new runs:** events triggered by the `GITHUB_TOKEN` create no new workflow run, except `workflow_dispatch` and `repository_dispatch` ([GitHub Docs](https://docs.github.com/en/actions/concepts/security/github_token)). That is why preview pushes and the morning job dispatch the deploy.
- **Schedules:** an optional IANA `timezone`; high load at the start of every hour; in a public repository, scheduled workflows are disabled after 60 days with no repository activity ([GitHub Docs](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)).
- **ffmpeg in the session container:** `ffmpeg -encoders` lists `aac`, `flac`, `libopus` and `libmp3lame` (run in this session).
- **`CompressionStream`** in Safari and iOS Safari from 16.4 ([Can I use](https://caniuse.com/mdn-api_compressionstream)); **file sharing** through the share sheet in Safari since iOS 15 ([Adactio](https://adactio.com/journal/15972)): both as cited in doc 6.10 and E.12.
- **Checked again on 2026-10-09 for the review fixes** (each also cited in the doc's sources): GitHub's terms rule out Actions *"as part of a serverless application"* ([GitHub additional product terms](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features)); Workers' CPU limits, 10 ms free and 30 s to 5 minutes paid ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/)); D1 bills rows scanned and resets free limits at 00:00 UTC ([D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)); Pages' 100 GB soft monthly bandwidth ([GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)); schedules at most every 5 minutes, default branch only, sometimes dropped ([GitHub Docs](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)); the enable endpoint ([GitHub REST](https://docs.github.com/en/rest/actions/workflows)) and [gh-workflow-immortality](https://github.com/PhrozenByte/gh-workflow-immortality); NWS's firewall ([weather-gov/api #435](https://github.com/weather-gov/api/discussions/435)); links opening in Safari, not the installed app ([Glide community](https://community.glideapps.com/t/open-url-from-other-app-in-pwa/59048)); AudioWorklet from iOS 14.5 ([Can I use](https://caniuse.com/mdn-api_audioworklet)); the iOS 15 share bug ([WebKit 234187](https://bugs.webkit.org/show_bug.cgi?id=234187)); the Upper Hoh Road 13 miles south of Forks ([WTA](https://www.wta.org/go-hiking/hikes/hoh-river)).
- **Checked on 2026-10-09 for the rapid-fire round,** each with its sources in `design/data/FACT_CHECK.md` (*2026-10-09: the rapid-fire round*): sunrise at Lake Quinault's center by NOAA's equations, matching the US Naval Observatory to the minute; the WIC's free canister loans; Washington's razor clam rules (keep the first 15, a shovel is legal) and the Mocrocks and Kalaloch beaches; the three Port Angeles places behind the jobs, for T03; the park's one-quart berry limit; a dreadnought's and a melodica's weights and sizes; and no usable CC0 Pacific wren.
- **Session 1's facts** are from the repo itself: `design/BUILD_LOG.md`, the shipped files, and commit `73929d4`, which pushed `pages.yml`.
