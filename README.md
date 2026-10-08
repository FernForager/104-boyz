# Olympic Peninsula Hiker

*A working title.* A picture-book hiking game of the Olympic Peninsula, drawn in chunky Sierra-style pixels and played on your iPhone. The first trip is the High Divide and Seven Lakes Basin loop from the Sol Duc trailhead.

## Play it

1. On your iPhone, open **Safari** and go to **[fernforager.github.io/104-boyz](https://fernforager.github.io/104-boyz/)**.
2. Tap **Share** (on iOS 26 it's inside the **•••** button at the bottom). Then tap **Add to Home Screen**; if you don't see it, tap **View More** or scroll down. If there's an **Open as Web App** switch, leave it on. Tap **Add**.
3. From then on, open it from the new **Hiker** icon. Do the install *before* you start a book: the Home Screen app keeps its own saves, separate from Safari's.

If the page says *404*, the first edition hasn't gone up yet; give it a few minutes and reload. After that, a failed update never takes the game down: the last good edition stays up.

**What's there now (session 1):** the title page. The High Divide draws itself in at dusk, Mount Olympus glowing pink across the Hoh valley, and then the stars twinkle. Tap anywhere to skip the drawing. Turn the phone sideways and the book asks to be held upright. *Begin a new book* says the trail opens soon, and it will. The small stamp at the bottom is the edition: the date and code of the build you're looking at.

If iOS Reduce Motion is on (Settings, Accessibility, Motion), the picture appears finished, and the stars hold still.

## What's coming

Work is counted in build sessions of a few hours each, not in dates. Something new shows up on your phone after almost every session.

| After session | On your phone |
|---|---|
| 1 | The title page, with the High Divide drawing itself in at dusk |
| 2 | It installs properly, works offline, and has a bug-report button; a second *Hiker Preview* icon for work in progress |
| 6 | Sample pages to judge the look: the pixels, colors and text |
| 11 | A whole rough book, from the ranger desk to the back cover |
| 19 | The loop (M1a), ready for your playtest (could be 16 to 22) |
| about 28 | The rest of the Sol Duc side, and the call for Lake Morgenroth (M1b) |

The full plan is in [`design/BUILD_PLAN.md`](design/BUILD_PLAN.md), and the game itself in [`design/GAME_DESIGN.md`](design/GAME_DESIGN.md). What each session shipped is in [`design/BUILD_LOG.md`](design/BUILD_LOG.md).

## When something's wrong

From session 2, the menu has a **Copy bug report** button; paste what it copies into a new GitHub issue, or straight into a Claude chat. Until then, a screenshot and a sentence in a chat is perfect. Issues on this repo are public, so keep your friends' names and your GPS tracks out of them, and send those in a chat instead.

---

## For developers

Plain ES modules, no framework, no bundler, and no dependencies yet. Node 22 runs the same picture code the phone runs. (TypeScript, used only to type-check JSDoc, arrives in session 3 with the engine.)

Node 22 or newer. No `npm install` is needed: there is nothing to install yet.

```sh
npm run build    # web/ + the art -> dist/, then site/ (what Pages deploys)
npm run lint     # picture and palette lint, T04, T06, relative URLs, pure gfx modules
npm test         # node --test test/unit/*.test.mjs
npm run ci       # build, lint, test: exactly what the deploy runs
npm run render   # every picture to PNG in out/pics/ (add -- --drawin for draw-in frames)
npm run serve    # site/ at http://127.0.0.1:8104/104-boyz/
```

**The build** (`tools/build.mjs`) copies `web/` as written, compiles the pictures, draws the icons from the cover, writes `version.json` and `flags.json` (with the channel from `CHANNEL`, default `main`), refuses anything over 5 MB, and copies the result to `site/`. The build id on the title page and in `version.json` is the commit's UTC date and short SHA from git (for example `20261008-73929d4`), so the same commit always builds the same bytes; outside git it reads `dev`. `version.json` also carries `files`, a hash of everything shipped, for the service worker in session 2.

| Folder | What it holds |
|---|---|
| `web/` | What the phone loads, shipped as written: `index.html`, `css/`, `js/`, `fonts/`, the manifest |
| `web/js/gfx/` | The picture VM (`picvm.js`), palette and cycles (`palette.js`), crisp scaling (`display.js`), the draw-in (`drawin.js`) |
| `content/art/` | `palette.json`, and the pictures as `.pic` text programs: `pics/plates/` (160x320), `pics/scenes/` (160x168), `pics/stamps/` |
| `config/flags.json` | Build flags; the build stamps the channel in |
| `tools/` | `build`, `lint`, `render-pics`, `serve`, and the PNG encoder |
| `test/unit/` | Unit tests |
| `design/` | The design doc, the build plan, the research data, the build log |

**Pictures** are small AGI-style programs (BUILD_PLAN 4.2): `C` pen color, `L`/`R` lines, `F` flood fill, `D` dithers, `B`/`S` brushes, `T` stamps, `Z` Look hotspots, `@` layers. The header of `web/js/gfx/picvm.js` documents the format. The build compiles every `.pic` into `dist/art/art.json`, which the phone fetches and runs through the same VM. Render a picture after any change and look at it beside panel B of `design/art/style_options.png`. Bonfire gold (color 7, and the glow cycle 19) belongs to the Bonfire Lily alone, and the lint fails it anywhere else, including a palette remap or cycle that would make it.

**Deploys:** `.github/workflows/pages.yml` runs `npm run ci` on every push to `main` (or on request, from the Actions tab) and publishes `site/` to GitHub Pages; if any check fails, nothing deploys and the live site stays as it was. All URLs are relative, so the site works under `/104-boyz/`, and `npm run serve` serves it under the same path to prove it. Other branches get no deploy yet; the `preview` channel and the checks on pull requests arrive in session 2.
