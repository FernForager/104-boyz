# Build plan: Olympic Peninsula Hiker

*Written 2026-10-08. No game code exists yet. This plan takes the repo from zero code to the first playable (M1a) on your iPhone, then to M1b. It builds on `GAME_DESIGN.md` (Appendices E and F, sections 11, 12, 14 and 15), the doc audit (`AUDIT_DOC.md`) and the data check (`data/M1A_DATA_CHECK.md`).*

*Order of authority: "Decisions made" in the design doc wins, then the rest of the design doc, then this plan. "Doc 7.4" below means section 7.4 of `GAME_DESIGN.md`.*

---

## 1. The short version (for you)

**What you get first (M1a).** The High Divide and Seven Lakes Basin loop from the Sol Duc trailhead, playable on your iPhone:
- either way round, as a day or 1 to 3 nights or more;
- any permitted camp, with real quotas;
- the basin-or-crest fork with honest numbers, the side trips, and changing the plan on the trail;
- Old School death, with the whole five-page sequence and the Trail Register;
- the first Larry moments: the locals' quiz, Heart Lake, the IPA and the permit check.

**Then M1b:** the rest of the Sol Duc side, and the phone call for Lake Morgenroth.

**When.** The work is counted in build sessions of a few hours each, not in dates. You'll see something new on your phone after almost every session.

| After session | On your phone |
|---|---|
| 1 | The title page, with the High Divide drawing itself in at dusk |
| 2 | It installs, works offline, and has the bug-report button |
| 6 | Sample pages to judge the look: the pixels, colors and text |
| 11 | A whole rough book, from the ranger desk to the back cover |
| 19 | M1a, ready for your playtest (could be 16 to 22) |
| about 28 | M1b, with Morgenroth |

**How you'll play it.**
1. In Safari, open **fernforager.github.io/104-boyz**.
2. Tap Share, then **Add to Home Screen**, *before* you start a book. Home Screen apps keep their own saves, separate from Safari.
3. Play from the icon. Once the title page shows the *works offline* stamp, it runs with no signal.
4. The newest work in progress lives at **fernforager.github.io/104-boyz/preview/**. Add it too: it becomes a second icon, *Hiker Preview*, and its saves never touch the main one.
5. A new build shows up on the bookshelf as *A new edition*, usually within a minute of opening the app. If it doesn't, swipe the app closed and open it again: iOS doesn't look for updates while an app sits paused in the background.

**When something's wrong.** Open the ≡ menu, tap the small version stamp five times, then tap **Copy bug report**. Paste it into a new GitHub issue (or straight into a Claude chat). If a page ever tears, the error sheet has the same button. No Mac is needed, ever. Issues on this repo are public, so keep your friends' names and your GPX out of them. Send those in a Claude chat instead.

**What we need from you now:** a "go". You may also need to do one two-minute paste in session 1, but only if GitHub won't let the session add the deploy workflow itself (9.1). The Boyz' names, Jon's quirk and your Morgenroth track can come whenever you like. M1a doesn't wait for any of them (section 9).

---

## 2. The repo, file by file

One rule shapes it all: `web/js/engine/` is pure (no DOM, no timers, no `Math.random`), so Node runs the same files the phone runs (doc E.1, E.2). Code ships exactly as written. Only the data is compiled.

E.5 names some files `data/`, `rules/`, `stores/`, `drive/` and `people/`. Here they all live under `content/`, so there's one content root.

### 2.1 Root and GitHub

| File | What it is |
|---|---|
| `README.md` | How to play and install; how to develop |
| `package.json` | `"type": "module"`; the scripts in 6.5 |
| `package-lock.json` | Pins TypeScript, the one dev dependency |
| `jsconfig.json` | `checkJs`, `strict`, `noEmit` for `tsc`, over the page code (`web/js/**` except the two workers) with the DOM lib |
| `jsconfig.worker.json` | The same for `sw.js` and `worker.js` with the WebWorker lib, since the DOM and WebWorker libs conflict in one project. `tools/` and `sims/` stay out of `tsc` unless `@types/node` is added as a second type-only dev dependency |
| `.gitignore` | `dist/`, `site/`, `out/`, `node_modules/`, and track files: `*.gpx`, `*.fit`, `*.tcx`, `*.kml`, `*.kmz` |
| `config/flags.json` | `storybook: false`, `larry: true`; the channel is stamped in at build |
| `design/BUILD_LOG.md` | Five lines per session: shipped, try this, next, questions |
| `.github/workflows/pages.yml` | Builds both channels, checks them, deploys (6.3) |
| `.github/workflows/preview-push.yml` | A push to `preview` asks `pages.yml` to run (6.4) |
| `.github/workflows/checks.yml` | The same checks on PRs and on pushes to any branch except `main` and `preview`; no deploy |
| `.github/workflows/nightly.yml` | The sim matrix, calibration, coverage, balance diff |
| `.github/workflows/shots.yml` | iPhone-size WebKit screenshots as artifacts, on request. It must run at S5, S6 and S19 for the sizes you don't own (9.1). It installs a pinned Playwright WebKit inside the workflow only, never in `package.json` |
| `.github/ISSUE_TEMPLATE/bug.md` | "Paste your bug report here" |

### 2.2 `web/`: what the phone loads

| File | What it is |
|---|---|
| `index.html` | App shell: `viewport-fit=cover`, `format-detection telephone=no`, `apple-mobile-web-app-status-bar-style` `black-translucent`, font preloads (with `crossorigin`, or Safari fetches them twice) |
| `manifest.webmanifest` | Main manifest. The preview one is generated at build. Each has its own `id`, `start_url: "./"` and `scope: "./"` |
| `sw.js` | Per-channel service worker. Its first line carries the build id and channel, stamped at build (3.3), so any deploy that changes what ships changes its bytes. It precaches with `cache: 'reload'`, and updates wait. Main's worker passes everything under `preview/` straight through, and preview's passes `review/`, so neither one's navigation fallback ever serves the game in their place. Neither caches a redirected response, which Safari refuses to load from a worker |
| `icons/` | 180 px touch icon (opaque, or iOS fills it with black), 192, 512 and maskable; a preview set |
| `fonts/` | EGA 8x14 (CC BY-SA), Pixelify Sans and a book serif (OFL), each with its license file, as woff2 (or woff/TTF where the source has no woff2, since pixel fonts are small). The source TTFs stay in `tools/fonts/` for T02's metrics |
| `css/tokens.css` | The 16 colors as custom properties; sizes in device pixels |
| `css/game.css` | Page frame, Sierra box, choices, sheets, short-screen layout |
| `js/main.js` | Boot: register the worker, load the edition, restore the autosave |
| `js/worker.js` | Web Worker entry for the look-ahead and Trip Outlook |

### 2.3 `web/js/engine/` (pure)

| File | What it is |
|---|---|
| `rng.js` | sfc32; `hash(seed, stream, key)`; the streams of E.8 |
| `math.js` | Deterministic exp, log, pow and trig, so Node and Safari roll alike |
| `expr.js` | The card expression language: parse, type-check, compile, fixed whitelist |
| `template.js` | Text templates and slots (`{name}`, `{gear:tag}`, *they*) |
| `content.js` | Loads the edition; id lookups |
| `index.js` | Card facet index (built at compile time) |
| `graph.js` | Directed park graph; router by hiking time, with `via` pins and spurs |
| `calendar.js` | The calendar rule, seasons, weekdays, dated conditions |
| `plan.js` | Itinerary model, the twelve fills, the 4.6 validator, ranger review lines |
| `permit.js` | Quota and desk-request rolls, canister loan, the 104 counter, fees |
| `pack.js` | The four limits, slots, hard blocks, pack tags (6.5), load ratio |
| `food.js` | Menus, Fill from the list, canister fit, rationing |
| `weather.js` | Synoptic chain, zone weather, thunder and fog, forecast vs actual |
| `daylight.js` | Sun and twilight times from the precomputed table |
| `movement.js` | The 7.4 pace formula, way-trail and steep-descent terms, ETAs against dark |
| `body.js` | The meters and the night model (7.9) |
| `knowledge.js` | Ranges that blur and sharpen (8.6): briefing, tips, forecast |
| `odds.js` | Base plus labeled modifiers, bands, ♦, fatal share rounded up (8.5-8.8) |
| `lookahead.js` | Compound-choice bars and the Trip Outlook |
| `director.js` | Fills beat slots: forced first, weighted draw, gap bias, novelty, budgets, Larry caps |
| `cards.js` | Evaluates a card: eligibility, choices, rolls, outcomes |
| `effects.js` | The effect vocabulary: meters, time, gear, flags, route, score, LNT |
| `queue.js` | Delayed consequences, chains, foreshadow flags |
| `trace.js` | The cause trace behind Field Notes and GAME OVER (8.13) |
| `people.js` | Strangers, rangers, and at most one Boy a book |
| `narrator.js` | Page text from cards and pools; quiet pages; the refrain |
| `score.js` | Score, the itinerary maximum, the Leave No Trace ledger |
| `death.js` | `book_ends`: cause key and variant, the register write, the wipe |
| `register.js` | Trail Register: best books, Remembered, the Boyz' lines, dead ids, the counter |
| `save.js` | Snapshot plus action log plus profile snapshot; channel-prefixed keys |
| `migrate.js` | Save-format migrations between editions |
| `step.js` | `step(state, action) -> { state, page }`, the one entry point |
| `phases/*.js` | One per phase: quiz, shelf, hiker, desk, store, pack, drive, trailhead, day, camp, night, ending, death |

### 2.4 `web/js/gfx/`

| File | What it is |
|---|---|
| `picvm.js` | Runs compiled picture ops into per-layer index buffers |
| `compose.js` | The scene composer: layers 1-11 from a recipe and the place's seed |
| `palette.js` | Time-of-day, weather and drained remaps; cycles; lights |
| `display.js` | Whole-number device-pixel scaling, one `drawImage`, at most 3 canvases |
| `drawin.js` | The 800 ms draw-in; a tap finishes it |
| `sprites.js` | Sprites at scene anchors, poses from state, the censor bar |
| `type.js` | Bitmap letters into the picture buffer (YOU PERISHED) |
| `dissolve.js` | The Leave No Trace dust (11.10) |
| `alt.js` | Alt text built from the layers |

### 2.5 `web/js/ui/` and `web/js/platform/`

| File | What it is |
|---|---|
| `ui/app.js` | Screen router (`#` routes); `replaceState` in a book; Back opens ≡ |
| `ui/h.js` | The 40-line DOM helper |
| `ui/frame.js` | Page frame: status line, picture, caption, conditions, toolbar |
| `ui/textbox.js` | The Sierra message box; "more ▸" splits |
| `ui/choices.js` | Choice buttons, odds tags, the (i) square, ♦ confirm |
| `ui/sheet.js` | Bottom sheets: Why, Ranger's Note, look-ahead numbers |
| `ui/compass.js` | The compass roll |
| `ui/look.js` | Hotspot taps and Look boxes |
| `ui/strip.js` | The pencil strip |
| `ui/shelf.js` | Title page, bookshelf, Trail Register page |
| `ui/quiz.js` | The locals' quiz |
| `ui/hiker.js` | The New Hiker page |
| `ui/desk.js` | Ranger desk, itinerary sheet, the three questions |
| `ui/map.js` | Region map: pinch, clusters, route dots, you-are-here |
| `ui/permit.js` | The permit form and *Stamp it* |
| `ui/store.js` | Fernwood: the list, the gauge, the cooler, grab-lunch |
| `ui/pack.js` | Pack spread, closet list, slot picker, canister panel |
| `ui/trailhead.js` | Last look and the register kiosk |
| `ui/camp.js` | *Make camp* and the evening tiles |
| `ui/fork.js` | Fork card with look-ahead bars |
| `ui/endings.js` | The End, back cover, Field Notes |
| `ui/death.js` | The five death pages and the shelf fading |
| `ui/toolbar.js` | Pack, Map and Journal tabs |
| `ui/settings.js` | The ≡ menu |
| `ui/credits.js` | Colophon and the Ranger's Bookshelf |
| `ui/debug.js` | Hidden debug menu, Copy bug report, Note, the replay self-check (S3), *Clear this channel's caches* |
| `ui/errors.js` | The "A page got torn" sheet |
| `platform/storage.js` | localStorage and IndexedDB under `oph.<channel>.`; `persist()` |
| `platform/sw-client.js` | Worker registration; `registration.update()` at launch and whenever the app comes back to the foreground (iOS doesn't check on its own while an installed app is only paused); "a new edition" at the shelf; the offline stamp, rechecked against the cache at every launch |
| `platform/audio.js` | Square-wave sequencer, ambient session, unlock on the first `touchend` or `click` (not `touchstart`), and a resume on the next tap after iOS interrupts the context (a call, the background) |
| `platform/share.js` | Clipboard, share sheet, Export/Import codes |

### 2.6 `content/`: everything authored

| File | What it is |
|---|---|
| `AUTHORING.md` | The Authoring Brief: schema, six exemplar cards, voice, fairness |
| `scope/m1a.json` | What this milestone ships: node ids, items, foods, months |
| `park/regions/*.json` | Normalized graph from ingest (generated; never hand-edited) |
| `park/overlays/sol_duc_high_divide.json` | Hand patches: spur, group flags, `map_xy`, canopy, cold pools, water, views, popularity |
| `park/conditions/2026.json` | Dated closures, the fire ban, dated news told as "last we heard" |
| `park/vocab/hazards.json` | About 30 canonical hazard tags and their aliases |
| `park/vocab/zones.json` | Zone and elevation-band rules |
| `park/permits.json` | Quota areas, windows, sites, desk-request odds |
| `trips/sol_duc.json` | The twelve fills and the day loop, with `via` pins |
| `gear/items.json` | From the gear catalog |
| `gear/tag_rules.json` | Items to event tags |
| `food/items.json` | From the food catalog, plus the beer |
| `stores/stores.json` | Fernwood, its cooler, grab-lunch, shopkeeper lines |
| `drive/routes.json` | Port Angeles to the Sol Duc trailhead (about 82 minutes) |
| `rules/tuning.json` | Every knob, score budgets, skill thresholds |
| `rules/mods.json` | Shared modifier sets (`mods.dark`, `mods.fatigue` ...) |
| `rules/macros.json` | Shared effect bundles |
| `rules/kits.json` | The ranger's sensible kit by zone and month; test kits |
| `data/climate.json` | Zone x month weather, with flagged estimates |
| `data/daylight.json` | Sun and twilight times, precomputed |
| `cards/generic/*.json` | Archetypes by family: weather, footing, nav, cold, water, wildlife, camp, night, joy, people |
| `cards/places/sol_duc/*.json` | Place cards and place patches |
| `cards/chains/*.json` | The Cold chain, damp evening, dark coming, thirst, food short |
| `cards/larry/*.json` | Heart Lake, the IPA, the permit check |
| `cards/finale/*.json` | Endings and epilogues |
| `text/ui.json` | Every UI string |
| `text/pools/*.json` | Variant pools: sky, sounds, refrains, quiet pages, item notices |
| `text/nodes/sol_duc.json` | Place text, three variants each |
| `text/look/*.json` | Look lines in Sierra's second person |
| `text/ranger.json` | The WIC ranger: questions, fills, checks, briefings |
| `death/causes.json` | Cause keys, YOU PERISHED lines, variant order, dice tags |
| `lore/quotes.json` | Drawable epitaph lines, built from the verified file |
| `lore/credits.json` | Colophon text and Wood's book list |
| `quiz/locals.json` | Twelve sourced questions |
| `people/boyz.json` | `{BOY_n}` placeholders, register entries, lines |
| `people/rangers.json` | The WIC ranger and the patrol ranger |
| `art/palette.json` | 16 colors, remap tables, cycles, lights |
| `art/recipes.json` | Place to scene recipe |
| `art/pics/**/*.pic` | Bases, skylines, landmarks, stamps, sprites, scenes, plates |

### 2.7 `schemas/`, `tools/`, `sims/`, `test/`

| File | What it is |
|---|---|
| `schemas/*.schema.json` | One JSON Schema per content file |
| `schemas/vars.json` | Expression variables, types, ranges |
| `schemas/tags.json` | The one canonical event-tag list (audit N13) |
| `tools/ingest.mjs` | `design/data` to `content/park`, plus the ingest report |
| `tools/build.mjs` | Validate, compile, index, lint, scope, hash, into `dist/` |
| `tools/lint.mjs` | The F.3 rules; `--fix` for safe mechanical fixes |
| `tools/schema.mjs` | A small in-repo JSON Schema validator |
| `tools/fontmetrics.mjs` | Advance widths from the fonts, for T02 |
| `tools/png.mjs` | A 60-line PNG encoder on `node:zlib` |
| `tools/render-pics.mjs` | `.pic` to PNG at the phones' own pixel shapes (7x4 and 4x2, doc 11.2) and at square 4x, plus contact sheets, any palette |
| `tools/bench.mjs` | Card bench: odds and shares under six loadouts |
| `tools/play.mjs` | A trip as text or HTML. `--replay bug.json` rebuilds the report's own commit in a git worktree when it differs from the checkout, since Pages keeps only the current edition |
| `tools/sim.mjs` | The Monte Carlo harness, on worker threads |
| `tools/tune.mjs` | Tuning suggestions, on demand, never applied silently |
| `tools/coverage.mjs` | Coverage matrix and pool-fallback report |
| `tools/review-book.mjs` | The HTML review book for you |
| `tools/new-card.mjs` | Scaffolds a card from a hazard id or a family |
| `tools/preview.mjs` | Builds the preview branch, or its last good commit |
| `tools/assemble-site.mjs` | Main at `/`, preview at `/preview/` |
| `tools/serve.mjs` | Local static server for sessions |
| `tools/shots.mjs` | WebKit screenshots at iPhone sizes (run by `shots.yml`) |
| `sims/bots.mjs` | The seven bot policies (F.2) |
| `sims/matrix.m1a.json` | M1a plans x months x kits x policies |
| `sims/loadouts/*.json` | Sensible, skimpy, day 3 L, trap and ablation kits |
| `sims/assertions/sol_duc.json` | Research "what goes wrong" lines as tests |
| `test/unit/*.test.mjs` | `node --test` unit tests (6.6) |
| `test/golden/*.json` | The doc's numbers and frozen replays |
| `test/fixtures/edition-mini/` | A tiny frozen edition for engine goldens |
| `test/ui/strings.test.mjs` | Static scans: no Storybook text, no `tel:`, the meta tag |

`dist/` and `site/` are build output and never committed.

### 2.8 iPhone Safari rules the shell follows from session 1

Most of these are in doc 12.1, E.7 and E.10. They're collected here because each one, missed, is a bug the agent can't see without your phone.

| Rule | Why |
|---|---|
| Pad with `env(safe-area-inset-*)`; size with `100dvh`; `overscroll-behavior: none`; `touch-action: manipulation`; `-webkit-text-size-adjust: 100%` | The notch, Dynamic Island and home bar; Safari's moving toolbar; the rubber band; double-tap zoom (which five quick taps on the version stamp would otherwise trigger); text that grows on rotation |
| In landscape, the *"This book reads best held upright."* plate | iOS ignores the manifest's `orientation` |
| Text inputs (hiker name, epitaph, bug-report note) at 16 CSS px or more; keep the field in view with `visualViewport` | Smaller inputs make Safari zoom the page on focus, and the keyboard covers a fixed layout |
| `font-kerning: none`, no hyphenation, `letter-spacing: 0` on page text | So Safari wraps lines the way T02's measured widths say it will. The runtime "more ▸" split is the backstop |
| Copy bug report builds its JSON synchronously, from memory, inside the tap, then calls `navigator.clipboard.writeText` | iOS refuses a clipboard write that comes after an `await`. The share sheet is the fallback |
| A bug report stays under 60,000 characters (it drops page text first, never the replay inputs) | GitHub's issue body limit is 65,536 |
| The report records the raw user agent, screen size, pixel ratio and a few feature checks, not just a parsed iOS version | Safari's user agent may not report the true OS version, and installed apps omit the Safari token |
| Never read the device clock or locale in `engine/` (see 6.6) | The calendar runs from the edition date, and Node in CI runs in UTC while your phone doesn't |
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
  + overlays + conditions
  + everything authored
        │ tools/build.mjs
        │ validate ▸ compile exprs
        │ ▸ index cards ▸ compile
        │ pics ▸ lint ▸ scope ▸ hash
        ▼
dist/data/edition.<hash>.json
dist/precache.json  version.json
dist/** = web/ copied as is
```

### 3.2 Ingest

`tools/ingest.mjs` reads all seven region files, `park_rules.json`, both catalogs and the lore files. It applies every rule in the E.4 table: merge shared ids, synthesize reverse segments, derive null gains, map 65+ hazard words to about 30 tags, move statuses into the dated overlay, recompute itinerary miles from the graph, and let `park_rules.json` win over stale region text.

- **Its output is committed** (`content/park/regions/*.json`), so every change shows up as a reviewable diff.
- CI re-runs ingest and **fails if the output differs**, so stale data can't ship. So the output must be byte-stable: sorted keys, fixed number formatting, no timestamps, no absolute paths.
- **Your Strava link is stripped.** The Morgenroth segment's source names your Strava activity. Ingest writes it as *firsthand: game creator* and reports the change, so the link never reaches `content/` or the published edition unless you say it may stay (9.2).
- The ingest report lists every fix and every doubt. It prints in CI and in the session.
- Lore: only lines marked `page_image_checked`, with a public-domain reason and a URL, reach `content/lore/quotes.json`. Any line from a Robert L. Wood work fails the build.
- Research `game_idea` and `game_event_idea` text that conflicts with your decisions (helper animals, journal sketches, the homage, "Sierra mode", companions) is dropped and reported (data check 7).

### 3.3 Build

`tools/build.mjs` does, in order:
1. **Validate** every content file against its schema.
2. **Compile** card expressions: parse, type-check against the whitelist, and emit checked syntax trees. Closures can't be stored in JSON, so the phone turns each tree into a closure the first time it's used (E.10's lazy compiling).
3. **Index** cards by facet (node, hazard, zone, band, month, hour, weather).
4. **Compile pictures** from `.pic` text to compact op arrays (1-2 KB each).
5. **Lint** (the F.3 rules; 6.7).
6. **Scope**: keep only what `content/scope/m1a.json` names. The whole park graph is still linted, so merges stay honest.
7. **Hash** the edition, and write `edition.<hash>.json` and `precache.json`.
8. **Copy** `web/` into `dist/` unchanged, except for the channel stamp (manifest, flags, storage prefix).
9. **Build id:** a hash over every file now in `dist/`, code included. Then it's stamped on `sw.js`'s first line (the one file touched after hashing). It names the caches (`oph-<channel>-<build id>`), it's the version stamp, and it goes in `version.json` with the edition hash and the git commit SHA. The SHA is recorded but not hashed, so a commit that changes nothing shipped doesn't offer you a new edition. The id has to cover the code, not just the edition: an installed app fetches a new version only when `sw.js`'s bytes change, so with an edition-only hash, a code-only fix would never reach your phone. The new worker checks that the `version.json` it fetches carries its own build id before it caches anything, so a half-updated CDN can't mix two builds.

The edition holds the graph, camps and quotas, trip templates, items, foods, stores, the drive, compiled cards, text pools, scenes, palette, causes, quotes, quiz, people, tuning, mods, kits, climate, daylight, conditions and flags. M1a's target is about 100 KB gzipped (14.1 gives about 150 KB for all of M1).

### 3.4 What M1a ships

| Source | M1a ships | Waits |
|---|---|---|
| `sol_duc_high_divide.json` | The loop's 47 nodes and 47 segments (94 directed); its 21 camps; the trailhead; Hoh Lake down its side trail; the desk-request camps Bruce's Roost, Cat Basin and Hidden Lake; the off-menu lakes as map Looks only; loop hazards, wildlife and dated conditions. Five of the 47 segments are map-only in M1a, and the scope file marks them unroutable: the four off-trail links (Clear to Long Lake, Long to Sol Duc Lake, Morgenroth to Y and No Name lakes) and the Long Lake to Morgenroth way trail. The router, the planner and *Change the plan* never use them | Mink Lake, Little Divide, Appleton Pass, nights at Long Lake and Sol Duc Lake, Morgenroth (M1b); the Lake Crescent trails (M5) |
| The other six regions | Nothing. Ingested and linted only | M2 on |
| `park_rules.json` | Summer permits; Seven Lakes and Hoh Lake quotas; canister rules and the WIC loan; fires (the 3,500 ft line, the dated 2026 ban); LNT; North-side climate for Aug-Sep; overdue and rescue patterns | Tides, winter rules, other zones |
| `gear_catalog.json` | About 60 items: the packs, the kits, the 18 traps, joy items, towel, trowel, earplugs, canister rentals | Glacier gear. The plush fox is dropped by ingest, since your homage decision says no fox (a renamed plush marmot is yours to ask for) |
| `food_catalog.json` | About 37 foods, plus the beer | The pre-roll (M1b) |
| `lore/` | Drawable lines for the cold, fog, lightning and dark decks, plus the general pool; Wood's book list; a few cleared facts about the loop | Cards that need tribal consultation; most history |

### 3.5 Data fixes made in the build (session 4)

From the data check, made in overlays or in ingest, with every estimate flagged:

| Fix | How |
|---|---|
| Bogachiel Peak shortcut | `through_route: false` on both summit segments, so the peak is a spur |
| No thunder or fog odds | Flagged monthly estimates in `climate.json`, tuned against the death caps in session 18 |
| Thin weather inputs | Weather chain estimated from Quillayute; Buckinghorse SNOTEL for the High zone |
| Group and stock sites | `group_only` and `stock_only` overlay fields |
| Night-model numbers disagree | The catalog's per-item stats win; the doc's numbers are defaults; 7.9 and 8.13 regenerated as goldens |
| No beer item | Ingest adds `beer_hazy_ipa_16oz` (doc 5.4), flagged |
| The dark deck | Split by base cause, so a fog death after dark deals no fall-only lines |
| No popularity data | Popularity, weekday and weekend availability, permit-check odds, fire-ban chance: flagged estimates |
| Overlay fields | `canopy`, `cold_pool`, `water`, `views`, `map_xy` for every loop node |
| Kits | A 3-liter day kit, and a day trap kit with no canister, in `rules/kits.json` |
| Dated news in permanent fields | Hoh Lake's dead bear and the Lunch Lake slide move to the conditions overlay |
| `oh_q28` | Dropped from the drawable decks |
| Camera battery | Flagged `battery_h` estimates |

### 3.6 What M1a shows and hides (audit N2)

| Thing | In M1a |
|---|---|
| The WIC phone number and counter card | Hidden until the call exists (M1b) |
| Month chips | August and September only |
| Desk requests | Bruce's Roost, Cat Basin, Hidden Lake; Long Lake and Sol Duc Lake as pencil rows |
| Lodge, Second Growth, Skillet chips | Hidden until M1b |
| The Bonfire Lily | Weight 0 everywhere until M1b |
| Walk out, share codes, Share the Cover | M1b |
| Try this trip again | Shown; it copies the stamped permit |
| Print the permit at home | Shown (on the cut list) |
| Storybook | No UI at all; every `book_ends` still carries its override, linted |
| Settings | Odds, Text, Pages, Sound, Park, Export/Import, Colophon, Bookshelf |
| Audio | Page turn, Look, stamp, compass, outcomes, title theme, the death cues, quiz, censor blip, can, marmot, jay |

---

## 4. The art for M1a

### 4.1 The palette (option B, from the mockup)

Fixed at every hour. Dusk, blue hour and night are remaps inside these sixteen (doc 11.1, 11.4).

| # | Name | Hex | Use |
|---|---|---|---|
| 0 | Ink | `#1b1f2a` | Outlines, text, night |
| 1 | Night navy | `#24324a` | Dusk sky, deep water |
| 2 | Slate | `#3f5a7a` | Day sky top, far ridges |
| 3 | Glacier blue | `#8fb3c9` | Sky, lakes, snow shadow |
| 4 | Snow | `#f2efe6` | Snow, message box |
| 5 | Paper cream | `#e8d9b5` | Paper, trails, stars |
| 6 | Alpenglow pink | `#e09a8a` | Dusk sky, heather |
| 7 | Bonfire gold | `#e8b33a` | The lily only |
| 8 | Rust | `#c4602d` | Hiker's jacket, fall color |
| 9 | Brick | `#8a3b2a` | Box border, pack, ♦ |
| 10 | Bark | `#5a3d2b` | Trunks, logs, bear |
| 11 | Spruce | `#1f3b33` | Conifer shadow sides |
| 12 | Forest | `#2f5b45` | Conifers |
| 13 | Moss | `#6b8a4a` | Meadow, moss |
| 14 | Sage | `#a7b88a` | Sunlit meadow, gravel |
| 15 | Teal | `#3f7f7a` | Rivers, hazy mid ridges |

M1a uses no gold at all: the lily arrives in M1b. The picture lint fails color 7 anywhere but the lily's own files. That includes the cover, which redraws the option-B mockup without its lily pixel.

### 4.2 The picture format

Pictures are small text programs, AGI-style (doc 11.3), at 160x168 (tall plates 160x320). Each layer draws into its own buffer, so a fill can't leak between layers.

| Command | Meaning |
|---|---|
| `C n` | Pen color (0-15, or a cycling pseudo-color 16-25) |
| `L` / `R` | Absolute or relative polyline |
| `F x,y` | Flood fill |
| `D a b pat` | Two-color dither fill (checker, checker25, checker12, hlines, vlines, diag, brick) |
| `B` / `S` | Brush shape and size; stamp the brush |
| `T id x,y` | Place a stamp, optionally flipped (depth 4 at most) |
| `Z id x,y,w,h` | A Look hotspot |
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

Composed scenes are recipes in `art/recipes.json`: a base, a skyline, seeded props, a feature, season and weather overlays, sprites at anchors, and hotspots with alt text.

### 4.3 Hand-drawn scenes and plates

Seven hand-drawn scenes and three tall plates. The doc's "6 scenes" for M1a counted trail scenes only. The Lake Crescent drive is first to fall back to a composed scene if time runs short.

| Scene | Size | Shows on | Session |
|---|---|---|---|
| Cover: the High Divide at dusk | Plate | Title page | 1 |
| The basin from the rim | 160x168 | The rim, the fork | 5 |
| The WIC counter | 160x168 | New hiker, desk, permit | 9 |
| Fernwood Mercantile | 160x168 | The store | 10 |
| The pack spread | 160x168 | The pack screen | 10 |
| US 101 along Lake Crescent | 160x168 | The drive | 11 |
| Olympus across the Hoh | Plate | First view from the Divide | 12 |
| Sol Duc Falls | 160x168 | Landmark, stay on trail | 13 |
| Heart Lake | 160x168 | Camp, the swim | 15 |
| The End: a book on a dashboard | Plate | The End | 17 |

M1b adds Lake Morgenroth and the Bonfire Lily plate.

### 4.4 Composed scenes

| Part | M1a set |
|---|---|
| Biome bases (6) | Trailhead, montane old growth, river valley, subalpine meadow, lake basin, crest |
| Skylines and landmarks (10) | Olympus massif from the Divide; Bailey Range; Hoh valley depth band; Bogachiel Peak; the Divide wall from the basin; Sol Duc valley ridges; Deer Lake's ridge; the stone staircase; Mirror Lake's shelf; Heart Lake Junction's sign and view |
| Features | Lake (cycling), creek and small falls, river (cycling), footbridge, privy, trail shelter, trail sign, cairn, snowfield patch, camp overlay |
| Weather | Rain, drizzle, fog bands, cloud on the crest, thunderhead and lightning flash, stars and the moon's phase |

### 4.5 Every loop place, and its recipe

| Place | Base | Far and features |
|---|---|---|
| Sol Duc trailhead | Trailhead | Old-growth wall, sign, car, kiosk; register box on death pages |
| Sol Duc Falls Camp, Canyon Creek #1-#3 | Montane | Creek, footbridge, camp |
| Deer Lake | Lake basin | Forest edge, Deer Lake's ridge |
| Potholes | Meadow | Ponds on a heather bench |
| Lunch, Round, Clear lakes | Lake basin | The Divide wall; Lunch's privy |
| Mirror Lake, way-trail junctions | Lake basin, crest | Mirror Lake's shelf, cairn |
| Bogachiel Peak and its junctions | Crest | Olympus, Bailey Range, Hoh valley |
| High Divide (Hoh Lake jct), Heart Lake Junction | Crest | Olympus, Hoh valley, sign |
| Hoh Lake | Lake basin | The Hoh valley falling away |
| Bruce's Roost, Cat Basin, Hidden Lake | Crest, meadow, lake | Bailey Range; forest rim |
| Sol Duc Park | Meadow | Shelter, privy, valley ridges |
| Lower Bridge Creek | Montane | Bridge, cold pools |
| Sol Duc Crossing to River #1-#4 | River valley | Bridges, river cycle |
| Trail segments | By zone | Seeded props, the place's own seed |

### 4.6 Stamps and sprites (about 30)

- **Stamps:** subalpine fir, mountain hemlock, western hemlock, Douglas-fir trunk, western redcedar, snag, krummholz, three boulders, talus, nurse log, sword fern, heather, lupine, huckleberry (rust in fall), avalanche lily (snow and cream, never gold), the register box (lid open and closed), the ranger's flat hat, a bookshelf.
- **The hiker** (7x18): idle, sit, shiver, kneel, wave, swim. The rust jacket for everyone.
- **The pack:** day, mid, big; pad roll and pot outside.
- **The tent:** pitched, sagging in rain, glowing at night.
- **Animals:** black bear, black-tailed deer, Olympic marmot, Canada jay (with a tortilla, or with shorts), American dipper (two frames).
- **People:** the ranger in a flat hat; other hikers in teal, slate and moss (a Boy is one of these until you name him); trail runners; the shopkeeper; the car.
- **The censor bar** (about 40x7, CENSORED in a 4x5 pixel font).
- **The remains** (16x6 skeleton, beside the pack sprite of the pack carried).

### 4.7 Palette tables and cycles

- **Remaps** in `art/palette.json`: day, dusk, blue hour, night, overcast, storm, a two-frame lightning flash, and the drained death-box table.
- **Cycles used in M1a:** lake (16), falls (17), river (18), fire (20, the stove only), stars (22), rain glint (23), lamp (24), dust (25, renderer only).
- **Lights** (lamp, stars, fire, dust) resolve after the remap, so they stay bright at night.

### 4.8 How art gets made and checked

1. Write the `.pic`.
2. `npm run render` draws it to PNGs in every palette, plus a contact sheet. It renders at the pixel shapes the phones really show, 7x4 on 3x phones and 4x2 on the SE (doc 11.2), and also at square 4x. Panel B was drawn with square pixels, so only the square render is a fair side-by-side. The 7x4 and 4x2 renders are what you'll see.
3. The agent opens the PNGs and critiques them beside panel B of `design/art/style_options.png`.
4. The picture lint runs: unknown stamps, out-of-bounds points, a fill over 60% of a non-sky layer, deep stamps, hotspots off the canvas, and gold.
5. You judge the look on your phone at session 6. Nothing past the first two scenes gets drawn in volume until you have.

---

## 5. The content for M1a

### 5.1 Cards: about 58, about 160 choices

The doc says about 50. The extra cards are the chains the fair death paths need.

| Kind | Cards | M1a examples |
|---|---|---|
| Landmark | 7 | Sol Duc Falls (stay on trail), Deer Lake, the rim, the stone staircase, Bogachiel Peak, Olympus from the Divide, Heart Lake |
| Fork | 3 | The basin or the crest (one card, three place patches); the light going amber; the day-hike turnaround |
| Hazard | 9 | Showers; fog on the crest; fog on the Mirror Lake way trail; thunder on the crest (♦); off trail in fog near a cliff (♦); footing (slick rock, scree, roots: one archetype with patches); the dry crest; bugs; blowdown |
| Encounter | 7 | Bear in the huckleberries; deer after salt; a Canada jay; cougar sign at Deer Lake; kind strangers; a Boy's tip; a Boy's trade or warning |
| Discovery, joy | 6 | Dipper; marmot on a rock; meadow flowers; huckleberries; alpenglow and stars; a quiet old-growth page |
| Camp | 5 | Pick a site; Make camp; the evening tiles; food away at bedtime; a full camp |
| Night | 4 | A cold night (a ♦ when bagless); a visitor; rain on the tent; a still night |
| Chains, crisis | 5 | The Cold chain; a damp evening; dark coming, no headlamp; thirst on the crest; food running short |
| Delayed, epilogue | 3 | Hot spots to blisters; the bear that learned; creek water to a bad stomach |
| Larry | 3 | Heart Lake and Crack the IPA (tiles); the permit check (dealt) |
| Drive, store, trailhead | 3 | Lake Crescent; Fernwood's ID check; the register kiosk |
| Endings | 3 | The End; Sooner Than Planned; the Hard Way |

Every card is linted, benched under six loadouts and read in transcripts before it ships (5.8).

### 5.2 The Larry moments (doc 2.6, decision 18)

| Moment | What gets built |
|---|---|
| The locals' quiz | Three questions from twelve sourced ones, once per phone, before the shelf |
| Heart Lake | *Swim (brr)*: feet, shorts, or all the way; the censor bar; the jay (about 1 in 4, food in a pocket); a Boy on cue; the towel; at dusk with no towel, the Cold chain |
| The IPA | Fernwood's cooler (21+, *"Humor me."*), canister liters, *Crack the IPA* at camp: spirits, buzzed -5, dehydration, -2 °F, the empty as trash |
| The permit check | A dealt Larry card on legal nights (capped); the forced off-permit ranger roll uses the same card (audit N5) |

All of them: overnight trips only, never the walk-out day, nothing near the car (lint T05), and `flags.larry` on in every build.

### 5.3 The death sequence pieces

| Piece | M1a content |
|---|---|
| Death boxes (4) | *The Divide Was the Tallest Thing Around* (lightning, Appendix D 18b); fog near a cliff (new); a cold night on the loop and the Cold chain (new); *The Lake Was Fed by Snow* (skinny dip, doc 2.6) |
| Ranger's Notes | One per box, naming the prevention |
| The drained picture | One more lookup table |
| YOU PERISHED | Bitmap EGA letters at double size, snow on ink |
| The dissolve | Remains sprite, dust stream, about 7 s, tap to skip, a cross-fade under Reduce Motion |
| The epitaph page | Register box (lid open); 40-character field; the dice with credits; *Leave it blank* |
| GAME OVER | Memorial page; what would have kept this book open; Route map; Field Notes |
| The wipe | *To the shelf*, one confirm, books fade, *Name a hiker* |
| Audio | Sting, dirge, dust hiss, dice, pencil, GAME OVER bar |

### 5.4 Cause lines

| Key | Line | When |
|---|---|---|
| `lightning` | *You have died of a thunderstorm.* | Stayed on the crest in a storm |
| `fog` | *You have died of the fog.* | Off trail in fog near a cliff |
| `fog`, after dark | *You have died of the dark.* | The same, after dark with no headlamp |
| `cold` | *...of skinny dipping.* | Skinny dip at dusk, no towel |
| `cold` | *...of cotton.* | Else, wet cotton in the trace |
| `cold` | *...of a long, wet night.* | Else, rain |
| `cold` | *...of a cold, clear night.* | Else, a clear sky |
| `cold` | *...of the cold.* | Otherwise |

The first match wins, in that order (doc 9.5). Every line starts *You have died of* and fits 40 characters.

### 5.5 Epitaph sources

- **From** `lore/quotes_public_domain.json`, verbatim, `page_image_checked`, with a public-domain reason, source and URL. No Wood line, ever.
- **Decks** (distinct lines today): cold 35, fog 38, lightning 37, dark 42. After the dark-deck split, every key still has well over the minimum of 8.
- **Order:** the death's own tags first, then the general pool; explorers' own words before newspaper summaries; shuffled on the book's text stream, so the same death deals the same lines.
- **Rules:** at most 40 characters as printed; no death, injury or named person; a line with a caution is dealt only for the causes it names.

### 5.6 The words

| Text | M1a amount |
|---|---|
| Place text | About 35 places x 3 variants (day, dusk, rain or fog) |
| Look lines | About 120: scene hotspots, features, six animals, gear |
| Text pools | About 35 pools, 300 lines: sky, trail sounds, refrains, quiet pages |
| Item notices | About 40 tag families x 3-4 states, plus 15 hand-written |
| The WIC ranger | Three questions, the fill lines, full-camp moves, about 25 plan checks, about 10 briefings, the off-permit talking-to |
| Fernwood | About 20 shopkeeper lines, the ID check, the canister warnings |
| Ranger's Notes | One per death box and per rescue |
| Book furniture | Chapter titles and retitles, the trip log, volume titles, morals, *What the pack taught* |
| Colophon | The 12.20 text and the font credits |

### 5.7 The Boyz, placeholders only

- `people/boyz.json` holds `{BOY_1}` to `{BOY_4}` (four until you tell us how many), `{BOY_n_QUIRK}`, a jacket color each, and their lines.
- Each has one *Remembered* register entry: a fictional place, a date before 2026, a score, a *died of* line and a funny epitaph, both 40 characters at most. The doc's two examples are `{BOY_1}`'s and `{BOY_2}`'s.
- Cards name a Boy by id, so your real names drop in without touching a card.
- A lint fails any Boy name that isn't a `{BOY_n}` placeholder until you send real ones. No session may invent or guess a name.
- The colophon line carries `{BOYZ_CONSENT}` until every Boy has agreed.

### 5.8 The authoring loop (doc 14.4)

Per batch of about 25 cards: ingest, scaffold stubs, write against `content/AUTHORING.md`, lint to zero, bench each card, render new pictures, simulate (with the bots and plan library, running since S11) and read the targets report, read about 20 transcripts, then build the review book for you. The review book is deployed with the preview, at `/104-boyz/preview/review/`.

---

## 6. GitHub Actions and CI

### 6.1 Branches and channels

| Branch | Channel | Address |
|---|---|---|
| `main` | Stable | `/104-boyz/` |
| `preview` | Preview | `/104-boyz/preview/` |
| `sNN-topic` (or whatever branch name the session's GitHub access requires) | Session work | Checks only, no deploy |

- Session branches merge into `preview` by PR, once green.
- `main` moves at session 1 by a PR from the session branch, before `preview` exists. A session may not be allowed to push to `main` directly, and the PR works either way. After that, `main` moves by merging `preview` at sessions 2, 6 and 19 and at the end of M1b. You can say "hold" at any of them.
- **Workflow files need their own permission.** GitHub refuses a push that adds or changes a file under `.github/workflows/` unless the pusher's access includes workflows. Session 1 tries this first. If it's refused, the session hands you the file, and you add it from the GitHub website on your phone (*Add file*, paste, *Commit*), which takes about two minutes. The same applies at S2 and whenever a workflow changes. Nothing else waits on it.
- Storage, caches and service workers are namespaced by channel (`oph.main.*`, `oph.preview.*`), so the two icons never share saves.

### 6.2 The workflows

| Workflow | When | Does |
|---|---|---|
| `pages.yml` | Push to `main`; on request | Build and check both channels, assemble, deploy |
| `preview-push.yml` | Push to `preview` | Asks `pages.yml` to run on `main` |
| `checks.yml` | PRs; pushes to any branch but `main` and `preview` | `npm run ci`, no deploy |
| `nightly.yml` | On request in M1a; nightly from M1b | Sim matrix, calibration, coverage, balance diff |
| `shots.yml` | On request; always at S5, S6 and S19 | WebKit screenshots at iPhone SE, 15 and Pro Max sizes |

**Why the dispatch.** GitHub Pages publishes one artifact as the whole site, and its `github-pages` environment normally deploys only from the default branch. So the deploy always runs on `main`, and it checks out `preview` itself. A preview push triggers it with `workflow_dispatch`, which `GITHUB_TOKEN` is allowed to do. No settings change is needed on your side.

**When something is red:**
- If main fails, nothing deploys, and the live site stays as it was.
- If preview fails, main still deploys, and preview is rebuilt from the `last-good-preview` tag.
- If there's no preview branch yet, or no preview build has ever passed (no tag), `/preview/` gets a one-line placeholder page.

### 6.3 `pages.yml` (sketch)

```yaml
name: pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: write  # last-good tag
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
          fetch-depth: 0  # preview + tags
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
        run: node main/tools/assemble-site.mjs
      - uses: actions/upload-pages-artifact@v4
        with:
          path: site
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

`tools/preview.mjs` adds `preview` as a git worktree of the `main` checkout, so it can use the token that checkout persisted to move the tag. It runs `npm ci && npm run ci` there with `CHANNEL=preview`, and on success it force-pushes the `last-good-preview` tag. On failure it builds that tag instead. If there's no tag, it writes the placeholder. The versions above (checkout v5, setup-node v5, upload-pages-artifact v4, deploy-pages v4) are the floor as of this writing. The session that writes the file checks each action's current major and pins it. The v4 checkout and setup-node run on the Node 20 runtime that GitHub is retiring, and upload-pages-artifact v4 leaves out dotfiles, which this site doesn't need.

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
| `build` | Ingest check, edition, pictures, precache (under 5 MB) | Yes |
| `lint` | The F.3 rules active in M1a (6.7) | Yes |
| `typecheck` | `tsc --noEmit` over JSDoc types, once per jsconfig (page code, then the two workers) | Yes |
| `test` | Unit tests and goldens (6.6) | Yes |
| `sim:smoke` | 2,000 trips: crashes, dead ends, stuck states, determinism, and every death fair | Yes |
| `ci` | All five, in that order | Yes |
| `sim` | The full matrix (section 7) | No: reports |
| `shots` | iPhone-size screenshots | No: artifacts |
| `bench`, `play`, `render`, `review`, `serve` | Session tools | No |

No statistical gate runs per push, so a deploy never fails at random (doc E.9).

### 6.6 Unit tests

- **rng:** known sfc32 vectors; independent streams; `Math.random` throws inside the engine.
- **math:** deterministic functions match reference values. In `engine/`, the lint bans every `Math` function the spec lets engines approximate (`exp`, `expm1`, `log`, `log1p`, `log2`, `log10`, `pow`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`, `sinh`, `cosh`, `tanh`, `cbrt`, `hypot`) and the `**` operator. `sqrt`, `floor`, `round` and the like are exact and stay allowed. It also bans the things that differ between Node in CI and your phone: `Date`, `Intl`, `toLocaleString` and its kin, and `localeCompare`. The calendar is whole-day integer math from the edition date, and sorts compare code points.
- **fixtures:** a bug report becomes a frozen replay only after a scrub that swaps the hiker's name for `{HIKER}` and drops the note field, and a test fails any fixture that still has either. You might name a hiker after a friend, and the repo is public.
- **expr:** parsing, types, the whitelist; no loops, assignment or randomness.
- **odds:** a seeded roll and a known p give exact bands; fatal shares are exact and rounded up; a blurred worst case is never below the truth; the true p lies inside every shown range.
- **graph:** shortest by time; `via` pins; spurs; all 24 camp rows of doc 4.3 both ways; loops of 18.4 and 18.7 mi.
- **movement and daylight:** the 3.1 arrival times; Back to the car in about 3.9 h (B.6); the 7.2 daylight table.
- **pack:** B.2's kit; the hard blocks; legal slots only.
- **permit:** seeded quota rolls; `104-` plus four digits; the counter survives a wipe; day hikes take no number.
- **save:** round trips; replay matches snapshot; every storage key and cache name has a channel prefix.
- **wipe and import:** only the register entry survives a death; a half-done wipe finishes at launch; import refuses older saves and dead hikers; register merges never remove a line.
- **death:** cause-variant order; deck order fixed per book; the caution filter; 40 characters.
- **Storybook:** with the flag off, no book can write the register.
- **strings:** no "Storybook" anywhere in UI text; no `tel:`; the `format-detection` meta in the shell.

### 6.7 Lint rules active in M1a

All of F.3 that touches M1a: references; the park graph (endpoints, reachability, elevations, G04 merges, a picture for every place, every fill routes); cards (schema, types, reachability, no dead ends, fuzzed odds, chains end, flags set somewhere); fair deaths; the death sequence; the epitaph dice; one mode and one hiker; Boyz placeholders; T02 text fit at 375 x 667 and 393 x 852 with measured fonts; T03 the deny-list of real businesses; T04 no *Golden Glow*; T05 never near a car; T06 no phone links; Larry caps; honest odds; coverage for the tags in play; economy; storage names; the picture lint.

The release-only rule (no placeholders left) applies to a tagged v1.0 build, not to main or preview (section 9.2).

---

## 7. The harness and the balancing targets

### 7.1 How it runs

`tools/sim.mjs` runs the real engine headless on worker threads, about 0.2-0.5 ms a trip (doc F.2's estimate), but that figure leaves out the look-ahead. Bots see only what you see: the shown %, the words, the ETAs and the look-ahead bars (doc F.2). If a sensible bot can't hit the targets from the page, the page is missing information, and that counts as a UI bug.

**The look-ahead is the cost.** One bar is up to 400 runs (doc 8.9), so a trip whose bot reads two bars costs a few hundred times a plain trip. That would turn the M1a matrix from minutes into days. So, in the harness:
- Bars are memoized by everything a bar depends on: the plan, the place, the day, the hour (to 15 minutes), what the hiker knows of the weather, and the body meters (in bands). Most bot trips at a fork share a handful of keys.
- Bots read bars at 100 runs, not 400. Each bar still averages exact fatal shares rather than counting deaths (doc 8.9), so the smaller count blurs the numbers a little without zeroing small fatal shares. A nightly check compares the 100-run bars with 400-run bars and reports any fork where a bot's choice would flip.
- Bots never open the Trip Outlook. The plan library fixes the plans.
- Measure a real trip's cost in S11 and size the matrix from that number, not from the estimate.

**Bots:** Cautious, Steady, Bold, Reckless, Random, Joy-seeker and Oracle. The reference mix is 50% Steady, 25% Cautious, 15% Joy-seeker and 10% Bold.

### 7.2 The M1a plan library

- The twelve fills, both ways round, the basin and the crest, each also run with the fork's other answer taken on the trail.
- Kits: sensible, skimpy, overpacked, cotton-and-hope, the day kit with 3 L and a headlamp, and the trap kit.
- Early August, late August, early September, late September; weekdays and weekends; starts at 7, 8:30, 10 and noon.
- Player-built variants: ±1 night, a layover, Potholes, Heart Lake Junction camp, Hoh Lake, the desk-request camps.
- About 3,500 plans x 1,000 runs. GitHub's hosted runners for a public repo have 4 cores, not 8, so at 1 ms a trip the matrix takes about 15 minutes, and at 2 ms about 30. If the measured cost is higher, the matrix drops to 500 runs a plan, or splits across two nights, so it stays inside the doc's 60-minute nightly cap (E.9). Rare events run on about 12 plan classes at 50,000 runs each, with importance sampling where a rate is under 1%.

### 7.3 Targets M1a must hit before you play it

From doc F.1, for the loop only:

| Plan | Happy finish | Rescue | Death |
|---|---|---|---|
| Sensible, August: all twelve fills, bot mix | ≥ 95% | ≤ 0.3% | ≤ 0.5% |
| Skimpy kit, August | 85-95% | ≤ 1% | ≤ 0.5% |
| Loop in a day, headlamp and 3 L | 60-85% | ≤ 3% | ≤ 3% |
| The trap: a day on day gear, noon, late Sept, Bold | ≤ 10%; trouble ≥ 80% | 10-35% | 2-10% |
| The trap, Cautious (turns back) | About 0%, nearly all Sooner Than Planned | ≤ 1% | ≤ 0.1% |
| Bail at the first fork | About 0% | About 0% | About 0% |
| Joy-seeker taking every Larry tile, sensible plans | Reported, not gated (doc F.1 holds the Joy-seeker only to the caps) | ≤ 0.3% | ≤ 0.5% |
| Sensible, late September (shoulder) | ≥ 85% | ≤ 0.5% | ≤ 0.5% |

The shoulder-season row is reported in M1a and gates in M1b.

**Also required:**
- Zero unfair deaths: every death follows a confirmed ♦ with a shown fatal share, or a chain's end after two matching warnings, and a sure choice was on the page.
- Zero deaths from a choice shown as `sure`.
- Zero crashes, dead ends and stuck states in 100,000 trips; the same seed and actions give the same book twice.
- Rescues under 3% across the mix; deaths on the ranger's fills under 0.3%.
- 3 to 5 real decisions per moving day (median 4); at most about one ♦ per moving day on sensible plans.
- At least 90% of trips show a % choice; on sensible plans, at least one optional 60-90% choice a day.
- Pages per book inside doc 3.5: a day 12-18, one night 25-35, two nights 45-60, three nights 60-75.
- A first book's first trail page in about 7 minutes, estimated from a scripted first book.
- The fork fires at the first way into the basin in each direction, and its ETAs equal the engine's.
- Every page fits at 375 x 667 (T02).

### 7.4 Golden numbers from the doc

Each becomes a test, so the doc and the engine can't drift apart (doc F.4):
- The 3.1 night list: River #4 11:25 am, Sol Duc Park 1:55 pm, Heart Lake 2:55 pm.
- 3.3: Sol Duc Park "about 1:55 pm, seven hours before dark".
- B.1's loop and fill miles: 18.4, 18.7, 20.4, 20.2, 20.6.
- B.2's pack: about 40 of 50 L, 29 lb, r 0.91, canister 6.6 of 9.8 L.
- B.3's shown checks: 97%, 92%, 93%, 95%.
- B.6's fork: Heart Lake 4:30 by the crest, 5:00 through the basin, Back to the car in about 3.9 h.
- 12.21: `Score: 50 of 96`.
- Doc 7.2's daylight table.
- The 7.9 and 8.13 night examples, regenerated from catalog stats.
- B.5's 98.3% and 91.8%, B.6's 0.2% crest share and the trap rows: regenerated, recorded, and shown to you in the review book.

### 7.5 Reports

Every run writes a short summary the agent reads and the review book shows you:
- the targets table, pass or fail, with intervals;
- failure reports naming the cards and modifiers behind bad outcomes;
- the ablation vector for map and compass, water capacity, bug kit, rain pants and the towel (it gates in M1b);
- a list of every flagged estimate the numbers rest on.

---

## 8. The build sessions

### 8.1 Every session

1. Read `design/BUILD_LOG.md` and this session's entry.
2. Work on a branch; run `npm run ci` locally; look at the PNGs, transcripts and screenshots.
3. PR into `preview`; merge when green; confirm the live `preview/version.json` shows the new build id.
4. Append five lines to the build log.
5. Tell you, in three to five lines, what to try on your phone.

A *Done when* that needs your phone never holds up the next session. Your check is logged as owed, and the work goes on. Only two of your answers gate anything. The look verdict (S5-S6) gates the S6 promotion of main and drawing art in volume (S13 on); if it's late, S7 to S12 go first, since they need no new art. Your playtest (S19) gates the M1a promotion.

**Before session 1:** your "go"; the audit and data-check edits, and this plan, committed (all three are sitting uncommitted); and the design branch merged into `main`, which today holds only a README.

### 8.2 Foundations and the look (M0, M0.5)

**S1 · First light**
- **Build:** repo skeleton; `pages.yml` (main only for now), pushed first so a refused workflow push (6.1) surfaces in the first minutes; the app shell, following 2.8 from the start; `tokens.css`; picture VM v0 (lines, fills, dithers, stamps, layers); dusk and day palettes; crisp scaling; draw-in; the PNG renderer; the cover plate from the option-B mockup; a title page with the version stamp (the build id, 3.3) and the Add to Home Screen line; a README for you.
- **You see:** fernforager.github.io/104-boyz, the High Divide drawing itself in at dusk, with stars.
- **Done when:** the deploy is green, the cover PNG holds up beside panel B, and it looks crisp on your phone.
- **The floor:** the deploy and an installable title page are what S1 can't miss. If the picture VM isn't solid by mid-session, the title page ships the cover as a static PNG from `render-pics.mjs`, and the live draw-in moves to S2.

**S2 · Two icons, offline, bug reports**
- **Build:** the `preview` branch, dispatch and fallback; `checks.yml`; per-channel manifests, icons and service workers; the offline stamp; "a new edition" at the shelf; channel-prefixed storage and its CI test; the ≡ stub; the hidden debug menu (five taps, or `?debug=1`); Copy bug report with a share-sheet fallback; the torn-page sheet; `persist()`.
- **You see:** two icons on your Home Screen. Airplane mode still opens the game. A bug report pasted into a GitHub issue.
- **Done when:** the F.5 install, offline, side-by-side and bug-report checks pass on your phone.

**S3 · The engine core**
- **Build:** rng, deterministic math and its bans (6.6), the expression language, templates, the content loader, `step()` and the phase skeleton, saves with snapshot and action log, `play.mjs --replay` (which rebuilds the report's own commit), unit tests, `tsc`, the lint and harness skeletons, a 1,000-trip smoke run in CI. Also the debug menu's **replay self-check**, which replays the frozen golden books in Safari and shows whether their page hashes match Node's. Its result rides in every bug report, so every edition is checked on a real iPhone's JavaScript engine, with no Mac.
- **You see:** on preview, *Name a hiker*, then a two-page "hello trailhead" at the Sol Duc trailhead. Close the app mid-page, and it comes back to the same page.
- **Done when:** a bug report copied on your phone replays identically in Node, and the self-check reads *match* on your phone.

**S4 · The data build**
- **Build:** ingest of all seven regions with its report; the M1a overlays and every fix in 3.5; `conditions/2026.json`; daylight and climate files; the beer; `kits.json`; schemas and the canonical tag list; `build.mjs` and the scope file; the graph lints.
- **You see:** a pencil map of the loop at `#map` on preview, every camp in place.
- **Done when:** the 24 camp rows, both loops and B.1's miles pass as goldens, and the ingest report has no unexplained errors.

**S5 · The look, part 1**
- **Build:** the page frame (status line, picture, caption, conditions, Sierra box, choices, (i), toolbar, short-screen fold); fonts; composer v0; the meadow and lake-basin bases; the Olympus skyline; first stamps and the hiker; Deer Lake composed; the basin from the rim hand-drawn; time-of-day remaps; lake and star cycling; page-turn, Look and stamp sounds.
- **You see:** sample pages at Deer Lake and the rim, by day, at dusk and at night. For the iPhone sizes you don't own (doc M0.5 asks for an SE and a Pro Max), `shots.yml` screenshots go in the review book.
- **Done when:** you say "chunky but crisp", indoors and out, or tell us what to fix.

**S6 · The look, part 2**
- **Build:** one decision end to end (odds tag, Why sheet, ♦ confirm, compass roll, outcome page and pencil strip); Look boxes and hotspots; "more ▸" splits; the T02 fit lint with measured fonts; Reduce Motion; VoiceOver labels and alt text.
- **You see:** a sample fork at the rim with a % and a ♦ to tap through.
- **Done when:** you confirm it feels like a Sierra game (the M0.5 exit). Main is promoted.

### 8.3 The first playable (M1a)

**S7 · Trail physics**
- **Build:** movement, the clock and daylight, the weather generator with flagged thunder and fog odds, the body and night models, pack tags, energy from food.
- **You see:** walk the loop with no cards. The clock and the sky change at the right times.
- **Done when:** the 3.1, 3.3 and B.6 times and the night examples pass as goldens.

**S8 · Odds, cards and the Director**
- **Build:** odds, knowledge ranges, cards, effects, chains and foreshadow flags, the Director, the cause trace, the score; `mods.json`, `macros.json` and `tuning.json` (score budgets, skill levels); the card bench; the card and fair-death lints; six exemplar cards in the Authoring Brief.
- **You see:** walking the loop now meets a few real cards: fog on the way trail, a sunset, a cold night.
- **Done when:** the band and fatal-share unit tests pass, and the bench reproduces B.3's 97, 92, 93 and 95.

**S9 · The ranger desk**
- **Build:** the WIC counter scene; the region map; the three questions and twelve fills; the itinerary sheet (ETAs against dark, difficulty words, *Stay again* and *Move on*, side trips, the basin-or-crest chip); quota rolls and full-camp moves; the three desk-request camps; the validator, review and briefing; the Trip Outlook's place on the page (it can't run whole trips until S11 builds the days, so its numbers go live in S12, in the same worker as the look-ahead); the permit with its 104 counter; the day-hike path.
- **You see:** plan the loop either way and stamp permit `104-0001`.
- **Done when:** all twelve fills match B.1, and a full Lunch Lake moves to Round Lake with the ranger's line.

**S10 · Store and pack**
- **Build:** Fernwood and the pack spread (hand-drawn); the shopping list, Fill from the list, the canister gauge, the cooler with its ID check, grab-lunch for day hikes, rentals; the pack screen with about 60 items, the four limits, slot picker, canister panel, checklist, the two kits, *Like last time*, the packing page, the Outlook's slot at *Close the pack* (live from S12).
- **You see:** shop for and pack B.2's trip.
- **Done when:** B.2's pack golden passes.

**S11 · The road and the days**
- **Build:** the Lake Crescent drive; the trailhead last look (beer never listed) and register kiosk; *Start walking*; the day loop (morning, pace, legs and slots, arrival, *Make camp* and tiles with the light stepping down, night, morning); *Change the plan* with off-permit nights and the overdue clock; the three endings, back cover, Field Notes, *Try this trip again*; the Pack, Map and Journal tabs. **The harness grows up here, not in S18:** all seven bots, the M1a plan library (7.2), the look-ahead memo (7.1), and the 7.3 targets table printed as a report, not yet a gate. Doc 16 asks for the harness to be built before most content, and the authoring loop (5.8) needs it to simulate each batch.
- **You see:** a whole rough book, from the desk to the back cover.
- **Done when:** 2,000 smoke trips have no crash, dead end or stuck state, and a real trip's cost is measured and the matrix sized from it (7.2).

**S12 · The fork and the crest**
- **Build:** the basin-or-crest fork at the rim going ↺, at the Mirror Lake junction going ↻, and at the rim again if you stayed high; look-ahead bars with the black tip; the Trip Outlook's numbers at the desk and at *Close the pack*; thunder and fog with their foreshadowing; *Off the crest, now*; fog near a cliff; the Olympus plate. Until S16, a death ends on a plain stub page.
- **You see:** the fork from 12.12, with honest bars, both ways round.
- **Done when:** B.6's ETAs pass, and its shares are regenerated and recorded.

**S13 · Content batch 1: the trail**
- **Build:** about 25 cards (landmarks, hazards, footing, way trails, Sol Duc Falls' stay-on-trail); place text; Look lines; quiet pages; half the item notices; recipes for every loop place; the remaining bases, skylines and stamps; Sol Duc Falls hand-drawn.
- **Done when:** the lint is at zero, every card is benched, 20 transcripts are read, the targets report has been read and any row moving the wrong way is noted in the build log, and review book 1 is on preview.

**S14 · Content batch 2: camp, night, animals, people**
- **Build:** about 25 cards: camp, night, wildlife, strangers, the Boyz cards (placeholders), the five chains, delayed payoffs, epilogues; the animal and tent sprites; the other half of the item notices.
- **Done when:** as S13, plus every event tag in play appears in at least 3 cards.

**S15 · Larry moments**
- **Build:** the quiz (twelve sourced questions); Heart Lake hand-drawn; the swim tile, censor bar and blip, the jay, the Boy, the towel and the Cold chain; *Crack the IPA*; the permit check and the off-permit ranger; the T05 lint.
- **You see:** the 12.21 page.
- **Done when:** the Larry lints pass, and early Joy-seeker runs stay inside the sensible caps.

**S16 · The death sequence and the register**
- **Build:** `causes.json` and the four death boxes; the drained picture; YOU PERISHED; dirge and sting; remains, dust and the Reduce Motion fade; the register box; the epitaph page with the dice; GAME OVER; the wipe and its crash recovery; the Trail Register page with the Boyz' placeholder lines; a new hiker after a death; Export and Import with their refusals.
- **You see:** lose a book on purpose and watch it all the way to a new name.
- **Done when:** the death lints, wipe tests and import tests pass, and every smoke death is fair.

**S17 · Art pass**
- **Build:** The End plate; the Lake Crescent drive, if still composed; every M1a page checked at every time of day; contact sheets; the picture lint; alt text.
- **You see:** every page has its own picture, and dusk and night look right.

**S18 · Harness and balance**
- **Build:** stratified runs for the rare events, failure and ablation reports, the research assertions (about 15), `nightly.yml` on request; tuning of `tuning.json` and the climate estimates. The bots and the plan library have been running since S11, so this session tunes rather than meets the numbers for the first time.
- **Done when:** every row and gate in 7.3 passes, and the report is in the review book.

**S19 · Polish and hand-off**
- **Build:** a pacing pass; the first-book timing; the M1a audio set; a VoiceOver day; the settings; the credits pages; the final review book; the F.5 checklist via screenshots, then on your phone; promotion to main.
- **You see:** M1a on the main icon.
- **Done when:** the M1a exit (doc 15): you play the loop both ways, drop into the basin once and stay high once, change the plan once, and lose one book on purpose.

**Up to three spare sessions** sit here as buffer, inside the doc's estimate of 15 to 22 sessions to this point. If they get used, M1b's session numbers shift by the same amount.

**Cut first, if M1a runs long:** *Print the permit at home*; *Try this trip again*; the hand-drawn Lake Crescent (a composed road instead). Then the doc's own list: the Hoh Lake and Cat Basin side trips; plans of four nights or more; the IPA and the permit check. **Never cut:** a direction, the basin or the crest, the fork, the three-night fills, the death sequence, or Copy bug report.

### 8.4 M1b: the Sol Duc side and the call (about 9 sessions)

| Session | Work |
|---|---|
| S20 | The rest of the Sol Duc graph: out-and-backs, Mink Lake, Little Divide, Appleton Pass; June to October with the shoulder season (snow on the Divide, mosquitoes); the scripted Lunch Lake denial |
| S21 | Off-trail navigation; Long Lake and Sol Duc Lake as desk requests |
| S22 | The WIC call: the number hotspot (T06), *Ask about a lake*, Morgenroth's way trail (your GPX if it's here), the hand-drawn scene, the IPA there, the Boyz' rumor |
| S23 | The other Larry moments: the bold marmot, the thin tent wall, the Lodge, Second Growth's pre-roll with its odds and citation |
| S24 | The Bonfire Lily: snow features, weights, the glow plate, sketch or pick, the motif |
| S25-S26 | Content to about 105 cards; at least 32 notable cards per coverage cell; story uniqueness |
| S27 | Storybook's hidden overrides simulated; share codes; *Walk out*; the remaining audio; the nightly job on a schedule |
| S28 | Balance (in season and shoulder), ablations, the device checklist, and your playtest |

**M1b exit (doc 15):** you find the number, call the WIC, camp at Morgenroth in the game and tell us what we got wrong, and you play three different Sol Duc trips and want a fourth.

---

## 9. Open items

### 9.1 Things only you can give us

| Item | Needed by | Blocks |
|---|---|---|
| Your "go", and OK to merge the design branch into `main` | S1 | S1 |
| Only if GitHub refuses the session's workflow push (6.1): paste the file the session gives you into GitHub on your phone | S1 (and S2, or whenever a workflow changes) | The first deploy |
| Your verdict on the look | S5-S6 | Drawing art in volume (S13 on) |
| Which iPhone you have (optional; bug reports carry it anyway) | S5 | Nothing. It tells us which sizes the screenshots must cover, since F.5's SE and Pro Max checks can only be done on-device for the phone you have |
| The Boyz: how many, first names or nicknames, quirks, register lines, consent | Before the v1.0 release | Nothing in M1a or M1b |
| Ranger Jon's quirk | M2 | Nothing |
| Morgenroth: GPX, stories, photos; whether the route may be published; whether the Strava link stays | S22 | Nothing: straight-line estimates and art notes until then |
| Your own quiz questions (optional) | S15 | Nothing |
| Asking about Robert Wood's sentences (optional) | Never | Nothing |
| Your playtests | S19, S28 | The milestone exits |

The GPX never enters the repo. A session reads it outside the repo and commits only a simplified line, its distance, gain and trail class (doc E.5). Send it in a Claude chat, never attached to a GitHub issue: issues on a public repo are public.

The plush fox isn't a question any more. Your homage decision rules out any fox, so ingest drops it (3.4).

### 9.2 Calls we'll make unless you say otherwise

These are the audit's open questions (N1 to N20) and the data check's, each with the default we'll build:

| Question | Default |
|---|---|
| N1 · WIC-only camps in M1a | Bruce's Roost, Cat Basin and Hidden Lake at the desk now; Long Lake and Sol Duc Lake in M1b |
| N3 · Day hikes have no permit | Score maximum set at *Start walking*; trip plan left at the trailhead; register says "day hike"; no 104 number |
| N4 · An overnight with no canister | Allowed: food doesn't fit, a visitor roll every night, a ranger card, LNT costs. Still only three hard blocks |
| N5 · The off-permit ranger | A forced, uncapped roll that plays the permit-check card; the cap covers legal nights only |
| N6 · Night rolls under 30% | They skip the bands; a Words row under 30%; a two-band compass |
| N7 · The score maximum | Budgets in `tuning.json`; a worked maximum for one fill as a golden |
| N8 · When the seed is drawn | At *Begin a new book*; *Try this trip again* copies the stamped permit |
| N9 · Skill levels | 0 to 5, thresholds in `tuning.json` |
| N10 · Day-hike turnaround on a loop | The shortest way to the car |
| N11 · The fork when climbing out of the basin | Fires only when the next segment leads in |
| N12 · Skinny dipping on a day hike | No: overnight trips only, never the walk-out day, as decision 18 reads |
| N13, N14 · Tag names, "pack presets" | One canonical tag list; presets are the sensible and skimpy kits |
| N16 · Edition date | The calendar runs from the research date (2026-10-07), never from the phone's clock, as doc 4.7 says. So every M1a trip (August or September) falls in 2027. Under *As researched*, dated 2026 entries don't apply to it, open-ended ones persist, entries past their last confirmation are told as *"last we heard"*, and the fire ban is drawn from climatology (*"we'll know closer to the date"*). *Timeless* stays one tap away. It is never the fallback, since decision 15 makes the real conditions the default |
| N20 · Leave No Trace over 100 | Capped at 100 |
| Placeholders on the live site | Allowed until the tagged v1.0 release build, which refuses them (F.3) |
| Night-model numbers | The catalog's per-item stats; the doc's as defaults |
| `oh_q28` | Dropped from the dice |
| Your Strava link | Stripped by ingest, so it's in no committed content and no published edition, until you say it may stay (doc 16, Still to come). It's already in the research file, which is public today |
| Saves across preview editions | The device record (the register and the permit counter) always migrates. On preview, a book from an edition whose save format changed closes with a note instead of being migrated, so sessions don't write a migration every day. On main, everything migrates, as F.5 checks |
| Bug reports in the repo | Only scrubbed (6.6): the hiker's name becomes `{HIKER}`, and the note is dropped |

N2 is the shows-and-hides list in 3.6. N15, N17 and N19 are doc fixes that wait for their milestones, and N18 comes with the lily in M1b.

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| **The agent can't see your phone** (no Mac, no Web Inspector) | Copy bug report replays exactly, from its own commit; the replay self-check runs on the phone (S3); `?debug=1`; PNG renders of every picture at the phone's pixel shapes; WebKit screenshots at the iPhone sizes you don't own; the 2.8 rules from session 1; you only check the short F.5 list |
| **Node and Safari roll differently.** `Math.exp`, `pow`, `**` and the trig functions can differ in the last bit between engines, and `Date`, `Intl` and `localeCompare` differ by time zone and locale, which would break replays | The engine uses `math.js` only, and the rest is banned (6.6, linted); daylight is precomputed; the clock runs in whole minutes from the edition date; goldens compare page hashes; the replay self-check runs them in your phone's Safari every edition; the screenshot job also replays one book in WebKit |
| **Pages deploy pitfalls:** one artifact is the whole site, the environment allows `main` only, a broken preview | One workflow on `main`; preview pushes dispatch it; the `last-good-preview` fallback; a red build deploys nothing |
| **Stale files on iOS** (Pages caches for 10 minutes; service workers; code that ships unhashed; an installed app that only checks for updates when it's launched) | A build id over code and content, stamped into `sw.js` so any change to what ships changes it (3.3); `cache: 'reload'`; the worker checks `version.json` before caching; `registration.update()` on every return to the foreground; updates wait for the bookshelf; a debug button that clears only this channel's caches, never a save |
| **iOS clears storage, or Safari and the Home Screen split it** | Install before the first save; `persist()`; Export and Import |
| **No thunder or fog data**, and the crest's two deaths depend on it | Flagged estimates tuned to the caps; listed in the review book; replaced if research lands |
| **Permadeath feels unfair** | The fairness invariant on every simulated death; lints for sure choices and foreshadowing; every target met before you play |
| **Content volume and voice drift** (about 58 cards, about 600 lines) | The Authoring Brief; batches of 25; the bench; 20 transcripts a batch; your review book |
| **AI-drawn art looks muddy** | The PNG loop; option B side by side; your sign-off at session 6 before volume; bases reused; only 10 drawn by hand |
| **M1a scope creeps** | The shows-and-hides list; the cut list; M1b holds the rest |
| **Privacy: friends' names, your Morgenroth track** | Placeholders only, enforced by a lint; track files ignored by git; only a simplified line is ever committed; the Strava link stripped by ingest; bug reports scrubbed of hiker names and notes before they become fixtures; you're told that GitHub issues are public |
| **The real WIC number on screen** | Hidden in M1a; the `format-detection` meta in the shell from session 1; T06 |
| **Lost context between sessions** | `BUILD_LOG.md`; small PRs; one plan entry per session; CI as the contract |
| **The doc and the engine drift apart** | The doc's numbers are golden tests; when one has to change, the doc is updated with it, and you hear about any number you'd care about |
| **Uncommitted data edits** | Commit them, with the audit and this plan, before session 1; ingest output committed and checked in CI |
| **Older or slower iPhones** | E.10 budgets; frame time in the debug menu; a Low Power Mode check |
| **The harness is too slow to balance with** (the look-ahead costs hundreds of plain trips; hosted runners have 4 cores) | The look-ahead memo and 100-run bot bars (7.1); trip cost measured in S11 and the matrix sized from it (7.2); the harness running from S11, not S18 |
| **GitHub won't take the session's workflow files, or its push to `main`** | Session 1 lands by PR and pushes the workflow first; if refused, you paste one file from your phone (6.1, 9.1) |
| **PG-13 tips into crude, or ends up near driving** | T05; the censor bar does the work; `flags.larry`; your review of each moment |
