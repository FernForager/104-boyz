<img src="https://ophiker.com/icons/icon-192.png" width="96" alt="The OP Hiker icon">

# Olympic Peninsula Hiker

**Olympic Peninsula Hiker** (*OP Hiker* on your Home Screen): a backpacking adventure on the Olympic Peninsula, drawn in chunky Sierra-style pixels, played on your iPhone. The first trip is the High Divide and Seven Lakes Basin loop from the Sol Duc trailhead, planned and packed from a ranger cabin at Lake Quinault.

## Play it

1. On your iPhone, open **Safari** and go to **[ophiker.com](https://ophiker.com/)**.
2. Tap **Share** (on iOS 26 it's inside the **•••** button at the bottom). Then tap **Add to Home Screen**; if you don't see it, tap **View More** or scroll down. If there's an **Open as Web App** switch, leave it on. Tap **Add**.
3. From then on, open it from the **OP Hiker** icon. Install it *before* your first trip: the Home Screen app keeps its own saves, separate from Safari's.

Once the title page shows its *Works offline* stamp, the game is saved on the phone and opens with no signal, airplane mode included.

**Preview.** Work in progress lives at **[ophiker.com/preview/](https://ophiker.com/preview/)**. Add it to your Home Screen the same way: it becomes a second icon, **OP Preview** (the same view at a later hour, with a teal band), and its saves never touch the main one. Preview shows lines you haven't approved yet; the main icon shows only words you have.

**Updates.** A new build downloads itself in the background. Then the title page says *A new version is ready.*, and its *Restart* button opens the new one. iOS looks for updates only when the app is opened, so if you're waiting for one, swipe the app closed and open it again. A failed update never takes the game down: if any check fails, nothing deploys and the last good build stays up. If preview's newest work fails its checks, `/preview/` keeps the last preview build that passed.

**What's there now (session 4):** on the main icon, the title page, unchanged. The High Divide draws itself in at dusk, Mount Olympus glowing pink across the Hoh valley, and then the stars twinkle. Tap anywhere to skip the drawing. Turn the phone sideways and a turn-the-phone glyph says *Best held upright*. Under the cover: the install line (gone once you open it from the Home Screen), the update note when there is one, the *Works offline* stamp, and a small build code, the date and commit of the build you're looking at. If something breaks, a sheet says *Something snagged.*, with *Copy bug report* and *Restart*.

On **OP Preview**, the cover is now the loading art: once it has drawn in, a plain guest book asks you to *Sign the guest book.* Sign any name, and two stops at the Sol Duc trailhead follow, each with *Walk on*. The game saves at every tap, so if you swipe the app closed on a stop and open it again, you're back on the same stop. After the second stop, a new trip starts at the first stop again: the trail beyond the trailhead arrives in session 15a. These words are drafts, waiting for their batches, so they show only on preview. In OP Preview's debug menu, a line above the report says whether this phone's engine replayed the test trips exactly as the build machine did: *Self-check: match*. The main icon gets that line at its next promotion, after session 6.

New in session 4, on OP Preview: the menu's *Map* button (in Safari, `#map` at the end of the address) opens a pencil map of the High Divide loop, drawn from the park's data: the trailhead and all 24 camps, numbered, and below them each camp's miles both ways round, worked out on the phone by the game's own route finder. It's a check view for the data, not the game's map table, which comes later; × or Back closes it.

New in session 7, on OP Preview: **the cabin at Lake Quinault** is home. The cover draws in as the loading art, then the cabin, at the lake's own hour right now (dawn, day, dusk, blue hour or night, Pacific time), under the date's sky (clear, cloudy, rain or morning fog) and the real moon, with warm windows, smoke and embers at night. The status line shows the lake's time, ≡ and *Sound*. Every place is a button, with its word on the picture until you've used it, then a dot, and the same places on the rail under the next step, *Plan your first trip* (until session 10 it walks S6's sample trip, and every trip comes home to the cabin). The shed, the car and the fire bowl say *Not open yet.*; the tub and the register post answer a Look; a long press names a place. The mailbox (on the picture, the rail or ≡) holds *Sound* and *Text*, the update note and *Restart* when one waits (its flag goes up on the picture), *Works offline*, and the build code, whose five taps open the debug menu. **First launch** is the key lockbox: the cabin draws itself in with the lockbox lit by one lantern, *Open the lockbox* asks three locals' questions (a wrong answer still opens it), *Take the key*, and the guest book on the porch, with *Suggest*. A phone that already has a hiker meets the lockbox once, at its next return home; it never comes back after that. In debug mode, `#home&hour=night&sky=rain` opens the cabin at any hour and sky, and `#first` a fresh first launch, both without touching your saves. The main icon is unchanged: the cabin replaces its title page only after you've answered B002 and B003.

If iOS Reduce Motion is on (Settings, Accessibility, Motion), the picture appears finished, and the stars hold still.

## What's coming

Work is counted in build sessions of a few hours each, not in dates. Something new shows up on your phone after almost every session.

| After session | On your phone |
|---|---|
| 1 | The High Divide drawing itself in (shipped) |
| 2 | Two icons, offline, a bug-report button; every word gets an id (shipped) |
| 3 | On preview, a guest book and two trailhead stops that survive a closed app; the engine's self-check in the debug menu (shipped) |
| 4 | On preview, a pencil map of the loop from the park's data, every camp in place, with its miles both ways round (shipped) |
| 6 | Sample trail stops to judge the look, with the first sounds |
| 7 | The cabin at Lake Quinault, on preview, with the lockbox and the guest book (shipped) |
| 15a | A whole rough trip, from the cabin to the trip report |
| 20 | The checkpoint: a full trip with the bear can, end to end |
| 28 | M1a, the High Divide loop played from home, for your playtest |
| 31 | The High Divide Loop FKT |
| about 46 | M1b: Lake Morgenroth and the Hike of the Day, on preview |
| about 48 | The world board, and the Hike of the Day on main |

Session numbers are labels: four of M1a's sessions are split in two, so the playtest after session 28 is the 32nd session counted. The full plan is in [`design/BUILD_PLAN.md`](design/BUILD_PLAN.md), and the game itself in [`design/GAME_DESIGN.md`](design/GAME_DESIGN.md). What each session shipped is in [`design/BUILD_LOG.md`](design/BUILD_LOG.md).

## When something's wrong

Five quick taps on the small build code at the bottom of the screen open a hidden menu (in Safari, adding `?debug=1` to the address does the same). Tap **Copy bug report**, then paste it into a [new GitHub issue](https://github.com/FernForager/104-boyz/issues/new) or a chat. You can type a note in the menu first; it rides in the report. If the phone won't copy, the report appears selected: tap the button again for the share sheet, whose first row is Copy. The error sheet has the same button.

The report holds only the game's state and facts about the device: the build, which screen you were on, the browser string, the screen size and Reduce Motion, whether the game is installed and saved for offline, how much storage it uses, the self-check's result, recent errors, and on preview the trip so far (its seed and every tap, so it can be replayed exactly). Your hiker's name is never in it: it says `{HIKER}` and how many letters. Never your location, your contacts or anything you've typed elsewhere. Issues on this repo are public, so keep your friends' names and your GPS tracks out of them, and send those in a chat instead.

---

## For developers

Plain ES modules, no framework, no bundler, and nothing the page loads from anyone else. The engine is pure: Node runs the same files the phone runs (no DOM, no clock, no `Math.random`), for the tests, the smoke run and every replay, and the picture code the same way.

Node 22 or newer. The one dev dependency is TypeScript, pinned exactly in `package-lock.json` and used only to type-check the JSDoc (`npm run typecheck`); run `npm ci --ignore-scripts` once to install it (the type check also installs it itself when it's missing). Everything else needs nothing installed.

```sh
npm run build              # both channels: dist/main/ and dist/preview/, then site/ (what Pages deploys)
npm run ingest             # design/data/ to content/park/ and the rest that's generated, with its report and lock (add -- --check to compare)
npm run lint               # the active rules (add -- --rules for the registry: every rule, and the session each lands in)
npm run typecheck          # tsc over the page, the engine, the worker and the sound's limiter worklet (jsconfig*.json)
npm test                   # node --test test/unit/*.test.mjs, the goldens included
npm run sim:smoke          # 1,000 trips through the engine: crashes, dead ends, stuck states, determinism
npm run ci                 # build, lint, typecheck, test, sim:smoke: exactly what every deploy and every check runs
npm run play               # a sample trip as text (add -- --replay report.json to replay a bug report on its own commit)
npm run render             # every picture to PNG in out/pics/ (add -- --drawin for draw-in frames)
npm run listen             # a cue or a scene to WAV, a spectrogram PNG and a loudness reading in out/listen/ (-- ui_demo; -- --check for the sound's goldens)
npm run serve              # site/ at http://127.0.0.1:8104/, preview at /preview/
npm run shots              # screenshots at the SE, 17 and Pro Max sizes in out/shots/ (needs Playwright, below; -- --set s5, -- --batch B004)
npm run text:check         # the text lints alone (add -- --main to check main's built words too)
npm run text:count         # every line, and its words, by state, screen and channel
npm run text:apply -- B00n # a batch's answers into the ledger
npm run text:batch -- B00n # a batch for review in out/review/B00n/ (add --shots for its numbered screenshots; --file [id ...] files drafts into it)
```

**Screenshots** (`tools/shots.mjs`) drive a real browser engine through Playwright, which is never a dependency: put it beside the repo for a run (`npm install --no-save --ignore-scripts playwright@1.56.1`, then `npx -y playwright@1.56.1 install webkit chromium`), or point `NODE_PATH` at a `node_modules` that has it; without it the tool says so and exits 2. It tries WebKit (Safari's engine) first and falls back to Chromium where WebKit isn't installed, with the engine in every file's name, so a Chromium picture is never mistaken for Safari's; `.github/workflows/shots.yml` (run by hand) takes the WebKit set. Each picture is a phone in portrait with its safe areas, touch and Reduce Motion, opened on preview's dev routes in debug mode (`#stop=<set>.<stop>&hour=<h>`, `#frame`; from session 7 `#home&hour=<h>&sky=<s>&moon=<0-7>` for the cabin, `#first` for a fresh first launch, `#lockbox&q=<1-3>`, `#lockbox&ask=<question>` and `#lockbox&open=<0|3>` for the lockbox's steps, and `#guestbook`, each kept in memory, never in your saves). `--set s7` shoots the cabin at every hour, clear, in rain and in fog, first launch, each lockbox step, the guest book with a stand-in for the keyboard, the mailbox, a Look, a long press and the loading art, at a fixed time at the lake so the clock reads the same every run.

**The fonts** ship in `web/fonts/`, each with its license beside it, and only under the SIL Open Font License, CC0 or the public domain: Pixelify Sans (the box; `OFL.txt`), Literata (the Plain serif for iOS Larger Text; `Literata-OFL.txt`, with each file's source and hash in `FONTS.md`) and OPH Chrome 8x14, our own EGA-style chrome font (`OPHChrome-OFL.txt`), drawn in `content/art/fonts/chrome8x14.txt` and built into `fonts/OPHChrome.ttf` by `tools/fontbuild.mjs`; `node tools/fontbuild.mjs --specimen` draws every glyph to `out/fonts/specimen.png`.

**The engine** (`web/js/engine/`) is deterministic by construction: all randomness comes from its seeded streams, the math it needs is its own (exact IEEE operations only), the clock is whole seconds, and lint E02 bans the rest. A trip is a pure function of the rules, the seed, the plan, the profile snapshot and the action log, so a save is a snapshot plus the complete log, and `node tools/play.mjs --replay report.json` replays a pasted bug report exactly: it rebuilds the report's own commit (in a git worktree unless it is HEAD and the tree is clean), checks the rules hash matches, and replays with that commit's engine. `--freeze <name>` keeps a matched replay in `test/golden/replays/`. The rules hash (`version.json`'s `rules`, and `<html data-rules>`) covers the engine's files and `data/rules.json`, never the words.

**The goldens.** `test/fixtures/engine/` is a tiny frozen build (one stop set with a roll), and `test/golden/trips/` holds nine trips on it with their frozen final hashes; `test/golden/selfcheck.json` holds Node's hashes for the self-check's groups. `node tools/goldens.mjs --check` checks them all, and `--update` rewrites them, for review, when the engine changes on purpose. Every build ships `selfcheck.json`, the same corpus with Node's answers, so the debug menu can replay the goldens on the phone and say whether Safari agrees.

**Two channels.** The same code builds two apps. **Main** is `https://ophiker.com/`, the **OP Hiker** icon; **preview** is `https://ophiker.com/preview/`, the **OP Preview** icon. Each has its own manifest, icons, service worker, cache and storage names (`oph.main.*` and `oph.preview.*`; lint S01 keeps every one in `web/js/platform/storage.js` and `web/sw.js`), so the two never share a save. All URLs are relative, because the same build is served at `/` and at `/preview/` (lint U01). `npm run serve` serves `site/` at the root, as ophiker.com does, so both channels and both worker scopes work locally.

**The words.** Every line of English a player sees lives in `content/text/en/` by id, and nowhere else (lint T10). The HTML carries `data-t="id"`; code calls `t('id')` or `tx(el, 'id')` (`web/js/text.js`). The ledger, `content/text/approved.json`, holds the exact words the creator approved, and only `npm run text:apply` writes it, from a batch's answers file in `content/text/review/`. **Main ships approved words only:** its build fills each id with the ledger's words, and its gate (T14) fails the build on any draft a main screen would show. `content/scope/m1a.json` names the screens each channel carries, and in `main.off` each line main leaves out, with its reason. Preview ships the working words, with each draft's state for the debug menu's marks. How to add a line is in [`content/text/README.md`](content/text/README.md).

**The data** (BUILD_PLAN 3.2). The research in `design/data/` is the source of truth: seven regions of trails and camps, the park's rules and climate, the gear and food catalogs. `npm run ingest` (`tools/ingest.mjs`, `tools/ingest/`, `tools/sun.mjs`) turns it into the generated files under `content/` (the normalized regions, the conditions, permits, daylight, climate and the cabin's sun table, the catalogs, the gazetteer), checks it on the way (codes IG01 to IG22, with the basics guarantee and E.4's proposed tide limits), and writes `content/park/ingest_report.md` and a lock, `content/park/ingest_lock.json`. Generated files are never edited by hand: fix the source, or a hand file (the overlays, the vocab, `ingest_known.json`, the scope), and run it again. The build refuses a tree whose lock doesn't match, and the tests re-run ingest and compare every byte. Lint G01 to G08 checks the park graph; the router (`web/js/engine/graph.js`) is pure and integer-only like the rest of the engine, and `test/golden/park/m1a.json` holds the design doc's miles.

**The build** (`tools/build.mjs`) makes each channel into `dist/<channel>/`: it first checks the ingest lock, then copies `web/` as written, compiles the pictures, compiles the content for the channel's screens into `data/rules.json` and `data/voice.json` (a data section joins `rules.json` only when one of its screens is in the channel: preview's map brings the park, and `data/map.json`, its display data) and hashes the rules, writes the self-check's `selfcheck.json`, draws the channel's icons from the cover, writes `flags.json` (`config/flags.json` plus the channel), fills the words into `index.html`, makes the manifest and `text/en.json`, lists for the worker every file the channel's page can load (`precache.json`, read from the built page by `tools/reach.mjs`, so main's worker never downloads the preview-only files main ships for parity) and stamps `sw.js` and `version.json`, then refuses anything over 5 MB. `tools/assemble-site.mjs` puts main at the root of `site/` and preview under `site/preview/`. `--channel main` (or `CHANNEL=main`) builds one channel. The build id on the title page and in `version.json` is the commit's UTC date and short SHA from git (for example `20261008-73929d4`), so the same commit always builds the same bytes; outside git it reads `dev`.

**Deploys.** GitHub Pages publishes one artifact, the whole site, so `.github/workflows/pages.yml` always runs on `main`. It runs `npm run ci` for main's channel, builds the `preview` branch's head (`tools/preview.mjs`) in a job of its own, and assembles both in a third job that never runs preview's code. A push to `main` runs it; a push to `preview` dispatches it (`preview-push.yml`), and main rebuilds byte for byte the same, so installed main apps see no update. If main's checks fail, nothing deploys. If preview's head fails, the `last-good-preview` tag goes up instead (or a one-line placeholder), and main deploys anyway. `checks.yml` runs `npm run ci` on every pull request and every other branch. Each job runs `npm ci --ignore-scripts --no-audit --no-fund` first, for TypeScript. Node is pinned to one exact version, so the same commit always builds the same bytes.

**Promotions** (BUILD_PLAN 6.1). Main moves only when the lead fast-forwards the `main` branch to preview's commit, after the creator's OK; nothing in this repo does it. `node tools/promote.mjs --dry-run` shows first what main's channel would gain: it builds main from the working tree into `out/promotion/next/`, builds `origin/main` (what ophiker.com serves) from `git archive` outside git into `out/promotion/live/`, and reports main's every word with its state, its screens, the files added, changed and removed (split into what main's page loads and what ships only for file parity), the theme and manifest colors, the precache and the rules hash, with the cover and icons side by side in `out/promotion/cover_icons.png`. It exits 1 if main would show a word that isn't approved or gain a screen. `--check-live` compares the live build with the live site byte for byte (the build stamp aside), and `--browser` runs the update itself in headless Chromium (Playwright, as for screenshots): the live build installed, the new one served, the update note, *Restart*, and the app opening again offline.

| Folder | What it holds |
|---|---|
| `web/` | What the phone loads, shipped as written: `index.html` (ids, not words), `css/`, `js/`, `fonts/`, the manifest (ids too), `sw.js` |
| `web/js/boot.js` | The boot guard: loads before `main.js` and imports nothing, so a module that fails on the phone still opens the error sheet; both Restarts |
| `web/js/engine/` | The pure engine: the seeded streams, its own math, SHA-256, the expressions, the content loader, `step()` and the phases, the action log, saves and replay, the self-check, the park graph and its router (`graph.js`, `movement.js`) |
| `web/js/gfx/` | The picture VM (`picvm.js`), palette and cycles (`palette.js`), crisp scaling (`display.js`), the draw-in (`drawin.js`), the composer that builds a place's picture from its recipe (`compose.js`), the compass rose a roll spins on, round at every pixel shape (`compass.js`), a picture's alt text composed from its parts' line ids (`alt.js`), and the cabin composed at the lake's hour, sky and moon (`cabin.js`, S7) |
| `web/js/ui/` | The title page and, on preview, the loading art (`home.js`), the game on preview (`app.js`: the saves at every tap; the cabin, `cabin.js`, with its status line, `status.js`, and the mailbox, `mailbox.js`; first launch's porch, `porch.js`, with the lockbox, `lockbox.js`, and the guest book, `guestbook.js`; `stop.js`), the debug menu and bug report (`debug.js`), the pencil map at `#map` on preview (`map.js`), the line inspector on preview in debug mode (`inspect.js`: a long press on any words), the replay self-check (`selfcheck.js`), the error sheet (`errors.js`), the ≡ menu stub (`menu.js`); on preview, the trail stop (`frame.js`, laid out by 12.1's space check; `textbox.js`, the Sierra box and its ▾ continuation; `choices.js`, the choices, their odds tags, the ♦ confirm and the odds intros; `strip.js`, the profile strip), the Why sheet (`sheet.js`), the compass roll (`compass.js`), an outcome's ornament and pencil rows (`outcome.js`), the Looks (`look.js`), the long press (`press.js`) and Reduce Motion in one place (`motion.js`) |
| `web/js/platform/` | Storage under the channel's names and `persist()` (`storage.js`), the worker's registration, updates and the offline stamp (`sw-client.js`), the clipboard and the share sheet (`share.js`), a trip's seed and a hiker's id (`rand.js`, the one draw outside the engine), the cabin's clock, sky and moon (`now.js`, the one clock read) |
| `web/sw.js` | The service worker, one per channel: it saves every file its channel's page can load (`precache.json`, from `tools/reach.mjs`), and serves them offline |
| `content/text/` | Every word, by id; the ledger; the batches and their answers |
| `content/scope/` | What this milestone ships, and what main leaves out |
| `content/rules/`, `content/trips/`, `content/stops/` | The engine's content: the profile rules, the standard profile, the movement rules and the kits, the odds' shared constants and bases (`odds.json`, S6), plans and stop sets, compiled into `data/rules.json` (rules-hashed) and `data/voice.json` (the line ids) |
| `content/park/` | The park, from ingest: the normalized regions, the conditions and permits (generated); the thin overlays, the hazard and zone vocab, the acknowledged warnings (by hand); the ingest report and its lock |
| `content/data/` | Daylight on the loop, the cabin's sun table and the climate (generated) |
| `content/gear/`, `content/food/` | The catalogs as the game reads them (generated), and each item's look (`look_rules.json`, by hand) |
| `content/stores/`, `content/drive/`, `content/quiz/` | The stores' shelves, the drives from the cabin, the lockbox's quiz (by hand) |
| `content/home/` | The cabin: its places and hit areas, the rail, the next-step table, its palette tables, skies, lights, moon and first-launch window (`cabin.json`) |
| `content/text/names/` | The gazetteer: every real place name a screen may show, with its source (`places.json`, generated; `places_extra.json`), and real terms (`terms.json`); not ours, so no approval needed |
| `schemas/` | A JSON Schema for each content folder, `vars.json`, every variable an expression may read, and `tags.json`, the one list of event tags |
| `content/art/` | `palette.json`, the pictures as `.pic` text programs (`pics/plates/` (160x320), `pics/scenes/` (160x168), `pics/stamps/`), every loop place's recipe for the composer (`recipes.json`), and every Look hotspot's kind, looked or silent (`hotspots.json`) |
| `config/flags.json` | Build flags; the build stamps the channel in |
| `tools/` | `build`, `assemble-site`, `preview`, `ingest` and `ingest/`, `sun`, `lint`, `textlint` and `graphlint`, `text`, `content`, `sections`, `park`, `scope`, `schema` and `rules` (the data build and its hash), `goldens`, `play`, `sim`, `typecheck`, `render-pics` (and its light report: night is night at every place), `color` (contrast, OKLab and decision 68's lift), `reach` (what a built page can load), `fontbuild` and `fontmetrics` (the chrome font, and every face's advances read from the shipped bytes for T02, `t02`), `looks` (the hotspots), `listen` (the sound's renders and goldens), `shots` (screenshots), `promote` (the promotion's dry run), `serve`, the PNG encoder and a small HTML parser |
| `sims/` | The harness's bots: they see only the screen |
| `test/unit/` | Unit tests |
| `test/golden/`, `test/fixtures/` | The engine goldens and their frozen fixture build; the park's goldens (the design doc's miles); frozen bug-report replays |
| `.github/workflows/` | `pages.yml` (the deploy), `preview-push.yml`, `checks.yml` |
| `design/` | The design doc, the build plan, the research data (`design/data/`, ingest's source), the build log |

**Pictures** are small AGI-style programs (BUILD_PLAN 4.2): `C` pen color, `L`/`R` lines, `F` flood fill, `D` dithers, `B`/`S` brushes, `T` stamps, `Z` Look hotspots, `@` layers. The header of `web/js/gfx/picvm.js` documents the format. The build compiles every `.pic` into `dist/<channel>/art/art.json`, which the phone fetches and runs through the same VM. Render a picture after any change and look at it beside panel B of `design/art/style_options.png`. Bonfire gold (color 7, and the glow cycle 19) belongs to the Bonfire Lily alone, and the lint fails it anywhere else, including a palette remap or cycle that would make it.

**The cabin's photos stay private.** The cabin's plate (`content/art/pics/home/`) is drawn from GAME_DESIGN 11.11's written brief: the creator's own photos were looked at for the architecture and the setting only, and no photo, and no file derived from one, is ever copied into the repo or committed. `.gitignore` keeps the photo formats out, and a test (`test/unit/photos.test.mjs`) fails on any photo or image file but the art direction's one style sheet among the files a commit could carry, whatever its name.
