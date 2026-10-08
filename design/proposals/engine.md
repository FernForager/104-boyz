# Proposal: The Content Engine
### Architecture for "lots and lots of outcomes" across the entire park

Angle: the content engine and the architecture under "Olympic Peninsula Hiker". This proposal covers four things:
- how the park, trips, gear, food, event cards, narration and EGA scenes are stored as data;
- how a small, generic engine composes that data into tens of thousands of distinct trips;
- how Claude authors, lints, simulates and balances that content at scale;
- how it ships to an iPhone from GitHub Pages and works offline at the trailhead.

The two sibling proposals cover the body, weather and odds math (`simulation.md`) and the book's voice, art and screens (`storybook.md`). This document describes the machine that runs both. Where they already define something (meters, picture commands, the Snowlamp), this proposal adopts their names so the three can merge cleanly.

Status: design proposal, 2026-10-08. No game code. All prose samples are original.

---

## Summary

- **The engine is a small interpreter and the game is data.** The runtime knows nothing about the Hoh or the High Divide. It reads a compiled **edition**: one JSON bundle that holds the park graph, trip templates, gear, food, stores, cards, text pools and scene programs. Growing to the entire park is a content job, not an engine job.
- **One deterministic core.** `engine/` is pure ES modules with no DOM. It takes `(edition, seed, plan, actions)` and produces the same trip every time. The phone runs this core behind a thin UI. Node runs the same core headless for simulation, linting and transcripts.
- **The park graph is compiled from the researchers' region JSON.** An ingest step merges regions and dedupes shared nodes (`c_b_flats_group_site` appears in two regions). It also synthesizes missing reverse segments, estimates null gain or loss from elevations, maps the 65 hazard words the research uses onto about 30 canonical tags (moving statuses like `trail_closed_2026` into conditions), and derives zone, elevation-band and terrain tags. Dated **conditions overlays** (2026 closures, fire bans, bridges) sit on top.
- **Event cards are JSON with three layers of conditions.** (1) Indexable facets (`where`, `when`) are precomputed at build time into a per-node and per-segment candidate index. (2) A small, safe expression language (`if`, `weight`, odds, effects) reads state, gear tags, weather, tide, time and flags. (3) Outcome tables are either a check (`base + labeled mods`, clamped) or weighted tables whose weights are formulas. Each roll's labeled modifiers drive the honest "why this %" sheet.
- **Effects are typed ops.** Supported ops: meter deltas, time, food, fuel and water, gear wet, damage or loss, injuries, flags at five scopes (day, night, trip, region, meta), delayed queue items with foreshadowing, route changes (turn back, take an alternate route, bivouac, end trip, rescue), journal, score, Leave No Trace, and `represent` (show the card again with used options hidden). Sierra deaths live only in a `modes.sierra` override, so Storybook mode can never kill anyone by accident.
- **Narration is composed, not just written.** A template mini-language has slots, pronoun and verb agreement, random alternatives, conditionals, pool includes, and **echoes** of remembered causes ("still damp from the Hoh crossing"). Page composers assemble arrival, camp and night pages from pools. An anti-repetition memory spans the current trip and the last three trips.
- **Combinatorics.** On the Hoh valley alone, the real camp list gives about **140,000** sensible out-and-back itineraries of 1 to 5 nights (computed from `hoh_olympus.json`). A v1.0 library of about 260 cards resolves into roughly 1,700 card-choice-outcome resolutions. Applied across about 500 v1.0 places with beat slots and the weather and gear contexts, that makes hundreds of thousands of distinct moments. **Raw paths are effectively infinite, so we measure what players feel instead:** story-signature uniqueness at or above 90% per itinerary, at least 25 distinct ending headlines per classic trip, and at least 32 eligible notable cards per (region x season x weather) cell, so two trips in the same place share no more than about 2 cards.
- **Systems:**
  - **RNG:** a seeded `sfc32` with named, counter-keyed streams. Weather, events, rolls, text and art each draw from their own stream, so a text edit never changes an outcome, and reloading and choosing the same option gives the same result.
  - **Phases:** an explicit state machine: Title, Plan, Permit, Store, Pack, Drive, Trailhead, then the Trail and Camp loop, then Epilogue.
  - **Saves:** event-sourced. Each save holds a snapshot plus the action log. There are three slots plus an autosave every page, and an export code.
  - **PWA:** a precache service worker versioned by edition hash, so the whole book works offline at the trailhead.
  - **Pictures:** an AGI-style picture VM (160x168 index buffer, Bresenham, scanline fill, dithers, stamps, palette remaps and cycling) that also runs in Node, so Claude can render scenes to PNG and look at them.
  - **UI:** text and buttons are DOM; only the picture is canvas.
- **Stack: plain ES modules, no bundler.** Types come from JSDoc and `tsc --checkJs` in CI. Node 22 tools need zero runtime dependencies. A GitHub Actions workflow compiles content, lints, runs tests and a simulation smoke run, then deploys to Pages. The code on the phone is the code in the repo, line for line. That is the fastest loop when Claude writes the code and the user tests on an iPhone.
- **Testing and balancing:**
  - A **linter** with about 45 rules checks ids, reachability, dead ends, loop termination, formula ranges, text length, banned names and mode safety.
  - A **card bench** renders every card under every gear profile.
  - A **Monte Carlo harness** runs about 100,000 trips per minute across itineraries, loadouts and bot policies. It checks success-rate targets, "the pack matters" ablations, "the choice matters" checks and per-card fire rates, and it proposes tuning patches.
  - **Golden replays** and readable trip **transcripts** catch regressions and let Claude read whole trips as stories.
- **Authoring pipeline:** research JSON goes to generated scaffolds: card stubs from `hazards[]`, journal entries from `wildlife_and_plants[]`, trip templates from `classic_trips[]`, scene recipes from `scene_art_notes`, and simulation assertions from `what_goes_wrong_for_underprepared_hikers[]`. Claude then writes batches against a fixed brief, and each batch passes lint, bench and sim before it reaches a human-readable review book.
- **Milestones:**
  - M0 is the foundation.
  - **M1 is the vertical slice, the Hoh River to Glacier Meadows and the Blue Glacier.** It is the user's own failure example, it climbs from rain forest at 578 ft to the moraine at 5,100 ft with the glacier and summit beyond, and its research data is the most complete. It runs about 95 cards.
  - M2 is Sol Duc, Seven Lakes Basin and the High Divide, joined to the Hoh by the Hoh Lake trail.
  - M3 is Royal Basin, which completes all three must-haves and is the v1.0 release.
  - M4 is the coast (tides).
  - M5 is the south and east, completing the entire park.
  - M6 is companions and polish.

---

## Contents

1. Engine principles
2. Architecture at a glance
3. Data model
4. The event card format (with six complete example cards)
5. Narration composition
6. Combinatorics: how a modest library makes "lots and lots"
7. Runtime systems: phases, RNG, saves, PWA, pictures, text, touch
8. Tech stack and repo layout
9. Testing and balancing
10. Authoring pipeline: Claude at scale
11. iPhone Safari performance notes
12. Milestones
13. Risks
14. Open questions for the user

---

## 1. Engine principles

1. **Data first, engine small.** Every place, item, card, line of text and picture is data. The engine is an interpreter of about 6 to 8 thousand lines. Adding the coast or the Enchanted Valley should never require touching engine code, except once per genuinely new *system* (tides are one).
2. **Deterministic by construction.** A trip is a pure function of `(edition, seed, plan, actions)`. That gives us shareable trips, exact bug reproduction ("send me the trip code"), golden tests, and a simulation harness that is the real game, not a model of it.
3. **The pack talks through tags, cards listen to tags.** Cards never name item ids. They read tags (`poles`, `rain_bottom`, `tide_table`) and numeric stats (`gear.water_cap_l`). New gear needs no card edits, and every card automatically responds to every loadout. That is the main multiplier behind "lots and lots of outcomes".
4. **Compose, don't enumerate.** We never write "the Hoh ford in the rain without poles in September". We write one ford archetype plus labeled modifiers, plus place text where it matters. The outcome space is the product of archetypes, places, weather, tags and history.
5. **Honest odds come from the same function that rolls.** The % on a button is computed by the code that resolves it, and the "why" sheet lists the same labeled modifiers. If we cannot compute a % honestly, the choice shows words instead (see `odds`).
6. **Validate at the door.** Content that fails the schema, the linter or the simulation gates never deploys. With an AI writing most of the content, this is the main quality tool, not a nice-to-have.
7. **Gentle by default, harsh by data.** Storybook mode cannot reach a death because deaths exist only inside `modes.sierra` overrides, and the linter enforces this.
8. **The phone is the target, Node is the lab.** Everything that runs on the phone also runs headless in Node, so balance, transcripts and picture previews all come from the same code.

---

## 2. Architecture at a glance

```
 design/data/regions/*.json  (research agents)          content/  (authored, source of truth)
 design/data/*_catalog.json                             ├─ park/overlays, conditions, zones
           │                                            ├─ trips/, gear/, food/, stores/, drive/
           ▼                                            ├─ cards/{generic,places,chains,camp,night,drive,store}
   tools/ingest.mjs ──► content/park/regions/*.json ──► ├─ text/{pools,nodes,ui}
   (normalize, merge,     (generated, committed,        └─ scenes/{pics,recipes,palettes}
    canonicalize)          hand-patched by overlays)               │
                                                                    ▼
                                 tools/build.mjs: schema-validate ▸ compile expressions ▸ index cards
                                                  ▸ compile .pic ▸ lint ▸ hash ▸ write edition
                                                                    │
                                                 dist/data/edition.<hash>.json  (+ precache list)
                                                                    │
     ┌──────────────────────────────────────────────────────────────┴───────────────────────┐
     │  web/js/engine/   (pure: no DOM, no timers, no Math.random)                          │
     │    rng · expr · content(index) · plan(routing, permits) · pack(tags, stats)          │
     │    weather · movement · body   (simulation.md models)                                │
     │    director · cards · effects · queue · narrator · score · phases · save             │
     │         ▲ actions                         │ pages {scene, caption, text, choices}    │
     ├─────────┼─────────────────────────────────▼──────────────────────────────────────────┤
     │  web/js/ui/  DOM pages, text box, choice buttons, map, store, pack spread, settings   │
     │  web/js/gfx/ picture VM ▸ compositor ▸ palette remap/cycle ▸ integer-scaled canvas    │
     │  web/js/platform/  storage, service-worker client, share/export                      │
     └──────────────────────────────────────────────────────────────────────────────────────┘
                 ▲ same engine modules imported by
     tools/sim.mjs (Monte Carlo) · tools/bench.mjs (card bench) · tools/play.mjs (transcripts)
     tools/render-pics.mjs (PNG previews) · test/*.test.mjs (node --test)
```

**The one boundary that matters:** the engine emits **Pages** and consumes **Actions**. The UI never mutates game state, and the engine never touches the DOM.

```
Page   = { id, phase, scene: SceneSpec, caption, paragraphs[], choices[], margin[], odds[] }
Action = { t: "choose", page, choice } | { t: "turn" } | { t: "plan", ... } | { t: "buy", item, qty }
       | { t: "pack", item, slot } | { t: "car", item } | { t: "setting", k, v } ...
step(state, action) -> { state', page }
```

This boundary is what makes the Node harness, golden replays and event-sourced saves almost free.

---

## 3. Data model

### 3.1 Content layout

All authored content is small JSON files. Pictures use a small text format (`.pic`). Files are split by **family** and by **place**, so parallel authoring sessions rarely touch the same file.

```
content/
  park/
    regions/<region_id>.json       generated by tools/ingest from design/data/regions (do not hand-edit)
    overlays/<region_id>.json      hand patches: corrections, oneway, alt routes, map_xy, zone overrides,
                                   tide_max_ft, snowlamp_weight, view tags
    conditions/2026.json           dated closures, fire restrictions, road/bridge status (from conditions_2026)
    vocab/hazards.json             canonical hazard tags + alias table
    vocab/zones.json               zone rules (see 3.3)
    permits.json                   quota camps, group-size rules, reservation windows (from permit_and_rules)
  trips/templates/<region>.json    ranger-suggested trips (from classic_trips)
  gear/items.json                  gear catalog
  gear/tag_rules.json              how a packed set becomes tags and stats
  food/items.json                  food catalog
  stores/stores.json               fictional stores, inventories, price multipliers, shopkeeper lines
  drive/routes.json                town -> trailhead routes, minutes, road events
  rules/mods.json                  shared modifier sets (mods.dark, mods.fatigue, mods.skill_ford ...)
  rules/macros.json                shared effect bundles (@soaked_unprotected ...)
  rules/kits.json                  "sensible kit" expectations per zone x month (for gap detection)
  cards/generic/<family>.json      archetypes: ford, weather, cold, heat, water, nav, snow, wildlife,
                                   body, feet, gear, people, camp, night, joy, drive, store ...
  cards/places/<region>/*.json     place cards and place patches (extends: generic)
  cards/chains/*.json              multi-step chains (damp evening, food short, light going ...)
  cards/finale/*.json              the Snowlamp sequence, endings, epilogue cards
  text/pools/*.json                variant pools (sky by weather, sounds by terrain, refrains ...)
  text/nodes/<region>.json         per-node description variants by time of day, weather and season
  text/ui.json                     every UI string (one place, easy to proof)
  scenes/pics/{base,skylines,landmarks,stamps,sprites,plates}/*.pic
  scenes/recipes.json              node and segment -> scene recipe
  scenes/palettes.json             time-of-day and weather remaps, cycle tables (storybook.md 6.6-6.7)
  journal/entries.json             the field guide (104 entries; storybook.md 5.2)
schemas/                           JSON Schema for every file above + vars.json (expression variables)
```

### 3.2 The park graph: from research JSON to a playable graph

The research agents write `design/data/regions/<id>.json` in the shared schema. `tools/ingest.mjs` turns those files into `content/park/regions/*.json` (normalized, committed, regenerated whenever research changes). It also writes an **ingest report** listing every fix and every doubt. The region files written so far already show why this step must exist:

| Problem in raw data (seen in the region files so far) | Ingest rule |
|---|---|
| Same node in two regions (`c_b_flats_group_site` at 4,091 ft and 4,080 ft; `hoh_lake_trail_junction` in both) | Merge by id. Prefer non-null fields, using region priority = the region whose trailhead owns the node. Warn if elevations differ by more than 100 ft. Record `regions: [...]`. |
| Segment points at a node defined in another region (`c_b_flats_group_site -> hoh_lake` in the Hoh file; `hoh_lake` lives in Sol Duc) | Resolve after all regions merge. Unresolved ids are an **error**. |
| Segments listed in one direction only | Synthesize the reverse with `gain` and `loss` swapped, unless the overlay says `oneway`. If both directions exist explicitly (loop trails such as Hall of Mosses), keep both and synthesize nothing. |
| `loss_ft` or `gain_ft` null | Net change = `elev(to) - elev(from)`. If only one of gain or loss is known, derive the other. If both are null, `gain = max(0, net) * 1.15` and `loss = gain - net`, flagged `estimated`. |
| Node elevation null (`caltech_rocks`, `mount_olympus_false_summit`, `lake_8`) | Interpolate along segments from known neighbors, flagged `elev_estimated`. Overlays can pin a value. |
| Ad-hoc hazard words: 65 distinct words across the four files so far (`stream_crossing`, `heat_exposure`, `steep`, `mosquitoes`, `bridge`, `bergschrund`, `ledges` ...), plus statuses written as hazards (`trail_closed_2026`, `road_closure`) | Map through `vocab/hazards.json` aliases to about 30 canonical tags (Appendix A). Statuses move to the conditions overlay. Unknown words become `x_<word>`, get a lint warning, and are still usable by cards. |
| Tide thresholds live in free-text notes ("needs about 6 ft or lower", "best below about +1 ft" in `coast.json`) | A regex proposes `tide_max_ft` per beach segment. Claude confirms each one in `overlays/coast.json`, and the ingest report lists every value and its source sentence. |
| Hazard `where` mixes node ids and `a>b` segment ids | Keep the convention: **segment id = `from>to`**. Every hazard `where` entry must resolve to a node or segment. |
| `lat`/`lon` null | Not needed for play. The map view uses `map_xy` from the overlay, or a force layout that pins known neighbors. A warning is logged. |
| `snow_free_typical` is free text ("mid-Jul to early Oct") | Parse into `{melt_doy, snow_doy}` day-of-year ranges for the snow model. If parsing fails, the overlay must provide it (lint error). |

**Compiled node** (what the engine sees; derived fields marked `*`):

```json
{
  "id": "glacier_meadows", "name": "Glacier Meadows Camp", "type": "camp", "region": "hoh_olympus",
  "elev_ft": 4300, "lat": 47.8323, "lon": -123.6915, "map_xy": [612, 388],
  "camp": { "sites": 11, "quota": true, "bear_can_required": true, "food_storage": "can",
            "fires_allowed": false, "toilet": true, "water": "small creek, can shrink to pools by September" },
  "band*": "subalpine", "zone*": "subalpine_meadow", "side*": "west",
  "tags*": ["camp", "quota_area", "view", "near_glacier", "no_fires", "toilet", "water_seasonal"],
  "snowlamp_weight": 0.2,
  "scene": "glacier_meadows",
  "text": "text.nodes.hoh_olympus.glacier_meadows",
  "src": ["https://www.nps.gov/olym/planyourvisit/hoh-river-trail.htm"]
}
```

**Compiled segment:**

```json
{
  "id": "elk_lake>glacier_meadows_ladder_washout", "from": "elk_lake", "to": "glacier_meadows_ladder_washout",
  "miles": 1.85, "gain_ft": 1625, "loss_ft": 75, "class": "maintained",
  "hazards": ["snowfield", "avalanche_path", "exposure"],
  "snow": { "melt_doy": [196, 210], "snow_doy": [280, 300] },
  "terrain*": "subalpine_forest_steep", "band*": "subalpine", "zone*": "subalpine_forest",
  "slots*": 1, "dry*": false, "reverse_of": null, "estimated": [],
  "alt": null, "tide_max_ft": null
}
```

`slots` (beat slots on this segment) is derived from the estimated hiking time (simulation.md 5.1): 0 slots under 45 minutes, 1 slot up to 2.5 hours, 2 slots beyond that. Landmark nodes always get their own arrival slot.

### 3.3 Derived tags: bands, zones, terrain

Cards target **kinds of places**, not lists of places. That is what lets a few hundred cards cover about 600 nodes. Three derived dimensions do most of the work:

| Dimension | Values | Rule (data in `vocab/zones.json`, overridable per node) |
|---|---|---|
| `band` | `lowland` (< 1,500 ft), `montane` (1,500-3,500), `subalpine` (3,500-5,500), `alpine` (> 5,500) | From elevation. 3,500 ft is also the park's campfire line, so `montane`/`subalpine` doubles as fire-allowed/not. |
| `zone` | `rainforest_valley`, `river_bottom`, `lowland_forest`, `montane_forest`, `subalpine_forest`, `subalpine_meadow`, `lake_basin`, `ridge_crest`, `glacier`, `summit`, `coast_beach`, `coast_headland`, `coast_forest`, `lakeshore`, `road`, `town` | Rules evaluated in order. Example: west-side region + `lowland` + river nearby = `rainforest_valley`. Type `lake` or camp within 0.3 mi of a lake + `subalpine` = `lake_basin`. Hazard `exposure` + `subalpine`/`alpine` + type `junction`/`pass` = `ridge_crest`. |
| `side` | `west`, `north`, `east`, `south`, `coast` | From region. Drives the weather zone (simulation.md 4.1): the wet west, the rain-shadowed northeast. |
| `terrain` (segments) | `forest_flat`, `forest_climb`, `meadow`, `talus`, `snow`, `moraine`, `beach_sand`, `beach_cobble`, `headland_rope`, `road` | From class + band + hazards. Picks scene recipes and movement multipliers. |

Node **feature tags** (`view`, `near_glacier`, `waterfall`, `lake`, `big_trees`, `elk_meadow`, `hot_springs`, `tide_pool`, `sea_stack`) come from overlays and from simple text cues in `description`/`scene_art_notes`. Claude proposes them at ingest, and a human checks them in the ingest report.

### 3.4 Conditions overlays (the 2026 park, and a timeless park)

The research includes real, dated 2026 conditions:
- Staircase wilderness trails closed after the 2025 Bear Gulch Fire;
- Stage 2 fire restrictions parkwide since August 11, 2026;
- US 101 Hoh River Bridge closures in late September and October;
- the broken-runged Glacier Meadows ladder.

These become a **conditions overlay** keyed to in-game dates:

```json
{
  "edition_note": "Park conditions as researched 2026-10-07",
  "items": [
    { "id": "staircase_fire_closure", "kind": "closure", "applies": ["region:south_quinault_skok/staircase_wilderness"],
      "from": "2025-08-01", "until": null, "ranger_line": "text.conditions.staircase_closed",
      "src": "https://www.nps.gov/olym/planyourvisit/fire-conditions-and-updates.htm", "confidence": "high" },
    { "id": "stage2_fire_ban_2026", "kind": "fire_ban", "applies": ["park"], "from": "2026-08-11", "until": null,
      "typical_months": [8, 9], "confidence": "medium" },
    { "id": "glacier_meadows_ladder_2026", "kind": "hazard_mod", "applies": ["elk_lake>glacier_meadows_ladder_washout", "glacier_meadows_ladder_washout>glacier_meadows"],
      "card_vars": { "ladder.condition": "poor" }, "from": "2026-06-01", "until": null, "confidence": "medium" }
  ]
}
```

A **Park conditions** setting chooses between two modes. **"This season"** (real 2026 overlays: the ranger tells you Staircase is closed and suggests alternatives, just as real planning does). **"Timeless park"** (closures off; seasonal patterns such as late-summer fire bans and snowpack by month stay on, since those are climate rather than news). See Open Question 2 for the default.

### 3.5 Trips and itineraries

A **plan** is what the planning chapters produce. It is small, serializable, and part of every share code.

```json
{
  "v": 1,
  "trailhead": "hoh_rain_forest_trailhead",
  "exit": "hoh_rain_forest_trailhead",
  "start": "2026-08-18",
  "party": [{ "id": "h", "name": "Mo", "pron": "they", "fitness": 3 }],
  "pace": "steady",
  "days": [
    { "d": 1, "camp": "lewis_meadow_camp", "via": [] },
    { "d": 2, "camp": "glacier_meadows", "via": [] },
    { "d": 3, "camp": "glacier_meadows", "layover": true, "side_trip": "blue_glacier_lateral_moraine_viewpoint" },
    { "d": 4, "camp": "five_mile_island_camp", "via": [] },
    { "d": 5, "camp": null, "via": [] }
  ],
  "permit": { "status": "reserved", "camps": ["lewis_meadow_camp", "glacier_meadows", "glacier_meadows", "five_mile_island_camp"] },
  "template": "hoh_blue_glacier_classic_4_nights",
  "from_town": "port_angeles",
  "store": "store.fernwood_mercantile"
}
```

- **Routing.** Between consecutive camps the engine finds the route by Dijkstra over estimated hiking minutes, avoiding closed segments. For loops (the High Divide), the planner offers the direction and the variant ("via Heart Lake" vs. "via Seven Lakes Basin"); `via` pins waypoints. Day hikes are plans with zero nights and a `turnaround` node.
- **Validation** (shown as friendly ranger lines, never as errors):
  - camp exists and is a legal camp;
  - quota and permit availability for that night (seeded per trip, peak-season weighted; "permit_quota_full" is a planning event, not a failure);
  - group size against site limits;
  - estimated hiking hours per day (warn above 9 hours for the chosen fitness);
  - bear canister required;
  - fires allowed;
  - seasonal snow on route (warn and recommend `traction`/`ice_axe`);
  - closures from conditions;
  - for Mount Olympus: glacier gear and the `glacier_skill` party trait.
- **Templates** are classic trips from the research, imported as plan presets ("The ranger suggests..."). `what_goes_wrong_for_underprepared_hikers` from the same record becomes simulation assertions (section 10.1).

### 3.6 Gear catalog and pack tags

Each item has physical stats, tags it grants, and fragility. A tag-rules file turns the packed set into the **tag set** and **stats** that cards read. Names of real gear brands are never used.

```json
{
  "id": "poles_alu",
  "name": "aluminum trekking poles (pair)",
  "cat": "travel",
  "weight_oz": 18, "volume_l": 0, "slot": "outside_ok",
  "price": 6500, "owned_by_default": false,
  "tags": ["poles"],
  "stats": {},
  "states": { "ok": {}, "bent": { "tags_remove": ["poles"], "tags_add": ["pole_single"] }, "lost": {} },
  "fragile": { "fall": "bent:0.15" },
  "store_lines": ["text.store.poles_pitch"],
  "journal_label": "two poles, for leaning on rivers"
}
```

```json
{
  "id": "bag_synth_40",
  "name": "40-degree synthetic sleeping bag",
  "cat": "sleep", "weight_oz": 38, "volume_l": 11, "slot": "inside",
  "price": 8900,
  "tags": ["sleep_bag"],
  "stats": { "sleep_rating_f": 40, "wet_loft_keep": 0.8 },
  "states": { "ok": {}, "wet": { "stats_mul": { "sleep_rating_f_warmth": 0.8 } }, "lost": {} }
}
```

**Tag rules** (`gear/tag_rules.json`) cover what items alone cannot express:

| Rule | Example output |
|---|---|
| Sum | `gear.insulation = sum(stats.clo)`; `gear.water_cap_l = sum(stats.capacity_l)` |
| Best-of | `gear.sleep_rating_f = min over sleep_bag items`; `gear.light = best(headlamp > phone > none)` |
| Combination | `has('map') && has('compass')` produces `nav_kit`; `has('tent') or has('tarp') or has('bivy')` produces `shelter` |
| Placement | items in `outside` slots produce `gear.outside_count`, `gear.outside_bulky`, `gear.top_heavy` |
| Fit | `gear.over_volume_l`, `gear.can_free_l`, `food.fits_can` |
| Load | `gear.pack_lb`, `gear.base_lb`, `gear.pack_ratio = pack_lb / body_lb` |
| Condition | an item in state `wet` contributes `<tag>_wet` and its state multipliers |

The tag vocabulary is shared with simulation.md 6.6 (about 40 tags). Cards may only reference tags declared in `schemas/vars.json`, and the linter enforces it.

### 3.7 Food catalog

```json
{
  "id": "ramen_peanut_dinner",
  "name": "ramen with peanuts and dried peas",
  "meal": ["dinner"],
  "kcal": 640, "weight_oz": 6.0, "volume_l": 0.55,
  "cook": "boil", "water_l": 0.5, "fuel_g": 8,
  "scent": 2, "morale": 3, "spoils_days": null,
  "tags": ["hot_meal", "salty"],
  "price": 349,
  "stores": ["store.fernwood_mercantile", "store.hoh_road_grocery"]
}
```

Derived stats such as `food.days_full`, `food.kcal_per_day`, `food.hot_meals`, `food.snacks`, `food.fits_can` and `food.scent_total` feed the body model and the cards. A store "shopping list" UI (storybook.md 2.5) reads the same stats.

### 3.8 Stores, towns and the drive

- `stores.json` lists **fictional** businesses in real towns (Port Angeles, Sequim, Forks, Quilcene, Hoodsport). Each has an inventory subset, a price multiplier, opening hours and shopkeeper remark pools. Example names: *Fernwood Mercantile* (Port Angeles), *Calawah Grocery & Tackle* (Forks), *Spit and Sound Outfitters* (Sequim). The linter checks store names against a deny-list of real local business names that the research step collects.
- `drive/routes.json` gives town-to-trailhead routes with the researched `drive_minutes_from` values. Each route carries road-event card hooks (elk on the Upper Hoh Road, the entrance-station line, the 2026 Hoh River Bridge closure detour) and an optional diner stop (fictional name).

### 3.9 Scenes and pictures

The picture format and art direction come from storybook.md 6.2-6.8: 160x168, `.pic` command programs (C, L, R, F, D, B, S, T, Z, @), dithers, palette remaps and pseudo-color cycling. This proposal adds the **recipe** layer that decides *which* picture a page shows, so about 600 nodes do not need about 600 hand-drawn pictures.

```json
{
  "glacier_meadows": {
    "base": "base.subalpine_meadow",
    "skyline": "skyline.olympus_from_hoh_head",
    "landmark": "landmark.lateral_moraine_crest",
    "props": { "set": "stamps.subalpine_fir", "count": [3, 6], "layer": "mid", "anchors": "base" },
    "overlays_if": [
      { "if": "snow.on_ground", "use": "overlay.snow_patches" },
      { "if": "camp.tent_up", "use": "sprite.tent@campsite" }
    ],
    "hotspots": ["moraine", "far_peak", "creek"],
    "alt": "A meadow of heather and late snow among pointed firs, with a ridge of grey stones hiding the glacier above."
  },
  "@default:subalpine_meadow": { "base": "base.subalpine_meadow", "props": { "set": "stamps.subalpine_fir", "count": [2, 5] } },
  "@default:segment:forest_climb:west": { "base": "base.rainforest_trail", "props": { "set": "stamps.moss_maple", "count": [2, 4] } }
}
```

- **Resolution order:** node or segment recipe, then `@default:<zone>`, then `@default:<band>`. The linter proves every node and segment resolves to a picture.
- **Props** are placed by the `art` RNG stream keyed by node id, so a place looks the same on every visit and every trip.
- **Alt text** for VoiceOver comes from the recipe, which falls back to the research `description`.

### 3.10 Runtime state

```json
{
  "v": 3, "edition": "e2026.10-7f3a9c", "seed": "K7QM2Q9F", "mode": "storybook",
  "phase": "trail", "sub": "segment",
  "clock": { "day": 2, "min": 812, "date": "2026-08-19" },
  "pos": { "node": "elk_lake", "seg": "elk_lake>glacier_meadows_ladder_washout", "progress": 0.4, "dir": 1 },
  "route": { "today": ["elk_lake", "glacier_meadows_ladder_washout", "glacier_meadows"], "plan_day": 2, "off_plan": false },
  "party": [{ "id": "h", "meters": { "energy": 61, "warmth": 74, "wet": 20, "hydration": 70, "feet": 88, "spirits": 77 },
              "conditions": [], "injuries": [] }],
  "pack": { "items": [["poles_alu", "ok", "outside"], ["bag_synth_40", "ok", "inside"]], "food": [["ramen_peanut_dinner", 3]],
            "water_l": 1.2, "fuel_g": 140, "phone_battery_pct": 71 },
  "wx": { "seq": ["clear", "partly", "showers", "clear", "clear"], "today": "partly", "now": { "temp_f": 61, "visibility": "good" } },
  "rivers": { "hoh_river_braid_crossings": 1 },
  "flags": { "trip": ["blank_page_quest"], "day": [], "night": [] },
  "queue": [{ "id": "q4", "card": "chain.damp_evening", "at": "camp_evening", "if": "state.wet >= 40", "cause": "a3" }],
  "memory": [{ "key": "wet_from", "value": "the Hoh", "beat": 9 }],
  "seen": { "ford.braided_river": [9] },
  "beat": 14,
  "score": { "joy": 21, "wisdom": 4, "lnt": 0 },
  "journal": ["nurse_log_bridge"],
  "log_ref": "actions[0..37]"
}
```

Region-scoped flags (`bears_learned`) and meta progress (journal entries, skills, past trips) live in a separate **profile** record, not in the trip.

---

## 4. The event card format

### 4.1 Card anatomy

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Stable forever, namespaced `family.name` (`ford.braided_river`) or `place.region.name` (`place.hoh.ladder_washout`). Renames go through `aliases.json`. |
| `kind` | yes | `hazard`, `encounter`, `discovery`, `landmark`, `camp`, `night`, `morning`, `crisis`, `fork`, `chain`, `drive`, `store`, `finale`, `epilogue` (the same types as simulation.md 8.1) |
| `trigger` | yes | When the scheduler may ask this card: `on_segment` (mid-segment slot), `on_arrive` (node arrival), `camp_evening`, `camp_night`, `morning`, `layover`, `side_trip`, `drive`, `store`, `trailhead`, `queue_only` (reachable only from a queue, page or chain), `threshold` (a crisis watcher) |
| `where` | no | **Indexable** place facets: `node`, `node_type`, `node_tag`, `segment`, `segment_hazard`, `trail_class`, `terrain`, `zone`, `band`, `side`, `region`. AND across keys, OR within a list. |
| `when` | no | **Indexable** time facets: `month`, `tod`, `weather`, `trip_day_min`, `layover`, `mode` |
| `if` | no | Expression over full state (4.3). Evaluated only after the facets pass. |
| `priority` | no | `forced`, `high`, `normal` (default), `ambient`, or `forced_if:<expr>` |
| `weight` | no | Number or expression (default 10). The director multiplies it (simulation.md 8.4-8.5). |
| `limit` | no | `per_trip`, `per_day`, `per_night`, `per_node`, `per_segment`, `cooldown_beats`, `min_trips_between` |
| `extends` | no | Inherit from another card. This card's top-level fields replace the parent's, and `patch` (dotted paths to values) edits inside it (4.10). |
| `scene` | no | Which picture (`use`: `node`, `segment_mid`, `segment_end`, `camp`), extra overlays and sprites, palette steps. An overlay entry is `name` or `name?expr` (drawn only when the expression holds). A sprite entry is `{id, at, chance}`, with the chance rolled on the `art` stream. |
| `text` | yes | `intro[]` variants, `by_place{}`, `by_weather{}`, `lean` (the line that sets up the choice), extra named lines |
| `choices` | yes, except for pure narrative pages | 1 to 4 choices (4.5) |
| `tables` | no | Named outcome tables shared by several choices |
| `outcomes` | yes | Outcome id, then `{ tier, text[], effects[], modes{} }` |
| `meta` | yes | `src` (research hazard ids and URLs), `tunable` (parameter ranges the auto-tuner may move), `status` (`draft`, `linted`, `benched`, `reviewed`, `final`), `notes` |

**Choice fields:** `id`, `label`, `label_if[]`, `show_if` (hidden when false), `enable_if` + `disabled_reason` (shown greyed with a reason, since the pack's gaps should be visible), `cost` (time, energy, fuel, battery), `let` (local variables), `effects_before`, `odds` (`show`, `words`, `hidden`, or an expression returning one of those), `preview` (a small hint line under the button, such as the wait time), then either `roll` or `then` (a fixed outcome id), plus `effects_after` and `max_uses`.

### 4.2 Facets and the card index

The build step evaluates every card's `where` against every compiled node and segment. It writes an index:

```
index[trigger][placeId] = [cardIdx, ...]      // e.g. index.on_segment["elk_lake>glacier_meadows_ladder_washout"]
```

At runtime the scheduler looks up a slot's candidates in O(1). It filters them by `when` (cheap enum checks), then `if` (compiled closures), then `limit` and cooldowns, and weights the survivors. For a full-park edition of about 600 cards, a typical slot has 15 to 60 candidates before `when`, so selection costs microseconds.

The same index gives the **coverage report**: for every place x month x weather cell, how many cards can fire. That is how we find thin spots (section 6.5) and dead cards (section 9.2).

### 4.3 The expression language

All dynamic parts of a card (`if`, `weight`, odds `base` and `add`, outcome weights, effect amounts, `show_if`, template conditionals) are short expression strings. A hand-written Pratt parser (about 300 lines) compiles them to closures at load time. There is **no `eval`/`new Function`**: it is safe, CSP-friendly, and statically checkable.

```
expr    := cond
cond    := or ( "?" expr ":" expr )?
or      := and ( "||" and )*
and     := not ( "&&" not )*
not     := "!" not | cmp
cmp     := sum ( ( "<" | "<=" | ">" | ">=" | "==" | "!=" ) sum | "in" "[" list "]" )?
sum     := prod ( ( "+" | "-" ) prod )*
prod    := unary ( ( "*" | "/" | "%" ) unary )*
unary   := "-" unary | atom
atom    := number | 'string' | true | false | null | path | call | "(" expr ")"
path    := ident ( "." ident )*            e.g. state.warmth, gear.pack_ratio, wx.visibility, card.known
call    := ident "(" args? ")"             whitelisted pure functions only
```

**Functions:**
- Tags: `has(tag)`, `lacks(tag)`, `count(tagPrefix)`, `cond(tag)`.
- Flags and history: `flag(id)`, `flag_region(id)`, `seen(cardId)`, `since(cardId)` (beats since last seen), `echo(key)` (memory exists).
- Segment: `seg_has(hazard)`, `route.alt(kind)`, `route.alt_minutes(kind)`.
- Math: `min`, `max`, `abs`, `clamp`, `round`, `lerp`, `step`.
- Time: `dark()`, `month_in(...)`.

**There is no `rand()`.** Every random event is an outcome roll, so every displayed % is a pure function of state.

**Static checks** use `schemas/vars.json`, which declares every variable's type and range:
- unknown identifiers are errors;
- a bool used as a number is an error;
- a division that can reach zero within the declared ranges is a warning;
- every `p` or weight expression is fuzzed (section 9.2).

### 4.4 Variables available to cards (`schemas/vars.json`, abridged)

| Namespace | Examples | Source |
|---|---|---|
| `state.*` | `energy`, `warmth`, `wet`, `hydration`, `feet`, `spirits` (0-100), `kcal_debt`, `lowest` and `lowest_meter` (the weakest meter, for composers) | body model (simulation.md 7) |
| `gear.*` | `pack_lb`, `pack_ratio`, `outside_count`, `outside_bulky`, `top_heavy`, `sleep_rating_f`, `insulation`, `spare_layers`, `water_cap_l`, `fuel_g`, `phone_battery_pct`, `light_hours` | pack model + tag rules |
| `has()` / `lacks()` | about 40 tags: `poles`, `rain_top`, `rain_bottom`, `map`, `compass`, `gps`, `tide_table`, `traction`, `ice_axe`, `rope`, `stove`, `sketchbook`, `puffy`, `ford_shoes`, `pack_liner`, `dry_bag`, `bear_can` ... | tag rules |
| `food.*` | `days_left`, `snacks`, `hot_meals`, `fits_can`, `scent_total` | food model |
| `wx.*` | `today`, `sky`, `temp_f`, `low_f`, `wind_mph`, `precip_now`, `precip_24h_in`, `visibility`, `freezing_level_ft`, `swell_ft`, `fog_lift_p_hour` | weather model (simulation.md 4) |
| `river.*` | `level` (0 low, 1 normal, 2 high, 3 flood), `glacial`, `words` | rivers (simulation.md 4.7), on the current ford segment |
| `tide.*` | `ft`, `trend`, `min_to_safe`, `next_low_min` | tide tables (simulation.md 4.8) |
| `snow.*` | `on_ground`, `on_trail`, `depth_class` | snowline model |
| `time.*` | `hour`, `tod`, `min_to_dark`, `day`, `month` | clock |
| `here.*`, `seg.*` | `here.id`, `here.type`, `here.band`, `here.zone`, `here.is_trip_high_point`, `here.snowlamp_weight`, `seg.class`, `seg.miles`, `seg.tide_max_ft` | park graph |
| `camp.*` | `food_secured`, `scented_in_tent`, `food_out_now`, `tent_up`, `site_quality` | camp sub-state |
| `night.*` | `margin_f`, `margin_terms` | night model (simulation.md 7.6) |
| `party.*` | `size`, `any_trait(t)` | party |
| `skill.*` | `nav`, `ford`, `snow`, `coast`, `camp` (0-5, earned across trips) | profile |
| `trip.*` | `days_left`, `nights_left`, `off_plan`, `template` | plan |
| `card.*` | the card's own scratch variables (`card.known`, `card.bearing`) | `card_var` effects |
| `mode` | `'storybook'` or `'sierra'` | settings |

### 4.5 Rolls, outcome tables and honest odds

A choice resolves in one of three ways:

1. **Fixed** (`"then": "outcome_id"`): no roll and no odds shown. Used for safe and narrative choices. The recommendation shared with simulation.md 9.5 is to never put a % on these.
2. **Check** (`"roll": { "base", "mods", "use_mods", "clamp", "pass", "fail" }`):
   - `p = clamp(base + sum(applicable mods.add) + sum(shared mod sets), lo, hi)`.
   - With probability `p` the outcome is `pass`. Otherwise the **fail table** picks among bad outcomes by weight.
   - The button shows `p` (or words). The "why" sheet lists every applicable mod's `why` with its signed value, and a "what can go wrong" line lists the fail outcomes with their conditional shares.
3. **Table** (`"roll": { "table": [ { "to", "w" } ] }` or `"table_ref"`): each weight is an expression, and probabilities are the normalized weights. The button shows the chance of the **best tier** or the **worst tier** (the author picks with `odds_focus`), or words.

**Odds words** (Storybook text for `"odds": "words"`), shared by all cards:

| p | Words |
|---|---|
| >= 95 | "almost surely" |
| 80-94 | "very likely" |
| 60-79 | "probably" |
| 40-59 | "a coin toss" |
| 20-39 | "unlikely" |
| 5-19 | "a long shot" |
| < 5 | "hardly a chance" |

**Shared modifier sets** (`rules/mods.json`) keep common physics in one place, so balance changes propagate to every card that uses them:

```json
{
  "mods.dark":       [ { "if": "dark() && lacks('light')", "add": -30, "why": "Darkness, and no light" },
                       { "if": "dark() && has('light')", "add": -10, "why": "Working by headlamp" } ],
  "mods.fatigue":    [ { "if": "state.energy < 30", "add": "-(30 - state.energy) / 2", "why": "Tired legs" } ],
  "mods.cold_hands": [ { "if": "state.warmth < 35", "add": -8, "why": "Cold, clumsy hands" } ],
  "mods.skill_ford": [ { "if": "skill.ford > 0", "add": "3 * skill.ford", "why": "Experience with fords" } ],
  "mods.skill_nav":  [ { "if": "skill.nav > 0", "add": "3 * skill.nav", "why": "Experience finding the way" } ]
}
```

**Knowledge changes the display, not the dice.** A choice's `odds` may be an expression such as `"has('tide_table') && card.known ? 'show' : 'words'"`. With the tide table read, you see "71%". Without it, you see "probably". This is storybook.md 3.3's "fuzzy odds" expressed in data.

### 4.6 Effects vocabulary

Effects are an ordered array of typed ops. Each op has an optional `if` and `chance` (rolled on the `effect` stream, 7.3), and amounts may be expressions. Every op carries the cause chain forward for the Field Notes (simulation.md 8.8).

| Op | Fields | Notes |
|---|---|---|
| `meter` | `energy`, `warmth`, `wet`, `hydration`, `feet`, `spirits` (deltas), `who` | Clamped 0-100. Crossing a threshold arms crisis watchers. |
| `time` | `min` | Advances the clock; the movement model recomputes ETA and dark |
| `food`, `water`, `fuel`, `battery` | `kcal` / `l` / `g` / `pct` or `hours` | |
| `food_lose` | `scope`: `not_in_can`, `all`, `one_day` | |
| `gear_wet` | `scope`: `unprotected`, `all`, `outside`, `tag:<t>`; `unless` | Moves item instances to state `wet` unless protected by `pack_liner`/`dry_bag` |
| `gear_damage` | `tag` or `item`, `to` (state) | e.g. `rain_top` to `torn`, `poles` to `bent` |
| `gear_lose` | `pick`: `outside_first`, `random_loose`, `tag:<t>`; `fallback` | |
| `injury` / `condition` | `id`, `sev` | Catalog in simulation.md 7.8 |
| `flag` / `unflag` | `set` / `id`, `scope`: `day`, `night`, `trip`, `region`, `meta` | `region` and `meta` persist in the profile across trips |
| `card_var` | `{ name: value }` | Scratch state for `represent` loops |
| `remember` | `key`, `value` | Memory for echoes (5.4) |
| `queue` | `card`, `at` (`now_if:<expr>`, `camp_evening`, `night`, `morning`, `blue_hour`, `+<n>m`, `day+<n>`, `next_trip_region`), `if`, `chance`, `foreshadow`, `why` | Delayed consequence (4.7) |
| `page` | `card`, `if` | Immediately chains into another card as the next page |
| `represent` | `hide[]` | Shows this card again with the listed choices hidden; bounded by `max_uses` |
| `route` | `do`, plus fields (4.8) | |
| `weather` / `river` / `tide` | adjustments (`set_visibility`, `delta`, `advance`) | Local overrides of the environment |
| `journal` | `entry`, `kind` (`sketch`, `photo`, `note`), `art` | Field guide and sketches (storybook.md 5.2-5.3) |
| `score` | `joy`, `wisdom` | The score line |
| `lnt` | `delta`, `why` | Leave No Trace ledger |
| `skill_xp` | `skill`, `xp` | Earned experience (simulation.md 7.10) |
| `companion` | `who`, `bond`, `mood` | Optional party (section 7.2) |
| `epilogue` | `line` | Adds a line to the back cover |
| `death` | `cause`, `restore` (`before_card`, `last_camp`, `last_morning`) | **Only legal inside `modes.sierra`** (linter rule C13) |
| `end_trip` | `how`: `walk_out`, `ranger_assist`, `rescue` | The Storybook-mode floor of the consequence ladder |

**Macros** (`rules/macros.json`) bundle frequent effect lists. For example, `"@soaked_unprotected"` expands to a `meter` op, a `gear_wet` op and a `remember` op. Card authors write `"effects": ["@soaked_unprotected", {"op": "time", "min": 20}]`.

### 4.7 Delayed consequences, chains and memory

Three mechanisms make early choices echo later. Together they produce most of the "that happened *because*..." feeling.

1. **Queue items** are scheduled consequences with a due point and an optional condition, re-checked when they come due:
   ```
   at  "camp_evening"  -> fires on the next camp_evening slot if `if` still holds
   at  "morning"       -> next morning page
   at  "+90m"          -> the first slot at or after 90 minutes from now
   at  "day+2"         -> the first slot two days later
   at  "next_trip_region" -> stored in the profile; fires on the next trip into the same region
   ```
   The `foreshadow` text is appended to the *current* outcome page, so the player is told something is coming ("Water squelched in her boots with every step."). This is fair warning, the Sierra way.
2. **Chains** are `queue_only` cards linked by `page` and `queue` effects and by flags. The linter builds the chain graph and proves it terminates (section 9.2).
3. **Memory** (`remember`) stores small facts such as `wet_from = "the Hoh"`, `lost_at = "Mirror Lake"` and `bear_at = "Lunch Lake"`. Narration can quote them, and epilogues use them.

### 4.8 Route changes

Route effects ask the movement and plan modules to rewrite the rest of the trip. The plan module then re-validates permits and camps and tells the player in ranger-friendly words.

| `do` | Meaning |
|---|---|
| `turn_back` + `replan: nearest_permitted_camp` / `beach_camp_behind` / `trailhead` | Reverse direction. Re-plan remaining nights toward the exit. Being off-permit is noted, and the ranger is lenient in Storybook mode. |
| `stay_this_side` | Cannot cross this segment now. The player gets the fork card (wait, camp here, or turn back). |
| `take_alt` + `alt` | Switch to an alternate segment (headland overland trail, high route vs. valley route) |
| `back_to_last_junction` (+ `offer`) | Retrace to the last junction node and offer the main-trail alternative |
| `camp_here` / `bivouac` | Unplanned night at the current node or segment point (a bivouac uses the night model with shelter penalties) |
| `wait` + `until` | Advance time to a condition (tide below X, morning, rain stops) |
| `goto` + `node` | Detour (side trip, water source, ranger station) |
| `end_trip` + `how` | Walk out early, ranger assist or rescue, followed by the Epilogue |

### 4.9 Modes in data: Storybook and Sierra

Every outcome is written for **Storybook** (the default: nobody dies). Sierra mode is the same thing storybook.md calls Perilous Mode; the data key is `sierra`, and the UI can use either name. An outcome may carry `"modes": { "sierra": { "if": "...", "text": [...], "effects": [...] } }`. When the mode is Sierra **and** the override's `if` holds, the override replaces the text and effects.

Rules the linter enforces:
- `death` appears only inside `modes.sierra`.
- Every Sierra override has a non-Sierra base outcome.
- Every `death` names a `restore` point.
- Outcomes with a Sierra override set `sierra_moment: true`, so the UI can show the classic warning cue on those choices only.

Some cards declare **no Sierra death at all** on purpose (the black bear card: Olympic black bears are not that story).

### 4.10 Inheritance and place patches

A generic archetype plus a few lines of place patch is the main way to cover the whole park with personality:

```json
{
  "id": "place.hoh.braid_crossings",
  "extends": "ford.braided_river",
  "where": { "segment": ["happy_four_camp>hoh_river_braid_crossings", "hoh_river_braid_crossings>olympus_guard_station"] },
  "priority": "high",
  "patch": {
    "choices.wade.roll.base": 78,
    "text.lean": "Two side channels, both milky, both cold. The ranger at the Hoh had said they were 'low' last week. Last week was a long time ago."
  },
  "meta": { "src": ["hazard:hoh_olympus/hoh_side_channel_fords"], "status": "example" }
}
```

The build resolves `extends` into a flat card, so the runtime never sees inheritance. When a place card and its archetype both match a slot, the generic one is suppressed for that slot (`supersedes` is implicit through `extends`).

### 4.11 Six complete example cards

These are complete under the format above. Notes follow each one. The voice follows storybook.md 2.1 (third person, past tense). `{^they}` is the capitalized party pronoun, and `{v:was|were}` agrees with it (section 5.1).

#### Card 1: a river ford (`ford.braided_river`)

A generic archetype for any braided river ford in the valleys. It is place-flavored for the Hoh's side channels near mile 8 through `by_place`, and `place.hoh.braid_crossings` (4.10) patches it further.

```json
{
  "id": "ford.braided_river",
  "kind": "hazard",
  "family": "ford",
  "title": "The braided river",
  "trigger": "on_segment",
  "where": {
    "segment_hazard": ["river_ford"],
    "zone": ["rainforest_valley", "river_bottom", "lowland_forest"],
    "band": ["lowland", "montane"]
  },
  "when": {"month": [5, 6, 7, 8, 9, 10], "tod": ["morning", "midday", "afternoon", "golden"]},
  "if": "river.level >= 1",
  "weight": "6 + 8 * river.level",
  "limit": {"per_trip": 2, "per_segment": 1, "cooldown_beats": 2},
  "scene": {
    "use": "segment_end",
    "overlays": ["river_braids", "river_high?river.level>=2"],
    "sprites": [{"id": "american_dipper", "at": "water", "chance": 0.3}]
  },
  "text": {
    "intro": [
      "The trail ran out onto a wide bed of grey stones. Ahead, the {river} had split itself into channels, and one of them lay right across the way. It was {river.words}, and the color of {~weak tea|wet slate|milk in coffee}.",
      "{?echo('rain_last_night'): After the night's rain, the | The} {river} had spread across the gravel bar. The far bank was only a stone's throw away, but the water between was {river.words}."
    ],
    "by_place": {
      "hoh_river_braid_crossings": [
        "Near the eighth mile, the Hoh had wandered off its old bed and laid two milky side channels across the trail. Somewhere far upstream a glacier was melting, and here it was, swirling around {their} boots."
      ]
    },
    "lean": "{^H} looked at the water, and the water looked back."
  },
  "choices": [
    {
      "id": "wade",
      "label": "Unbuckle the hip belt and wade, facing upstream",
      "label_if": [{"if": "has('poles')", "label": "Plant the poles upstream and wade across"}],
      "cost": {"time_min": 15},
      "odds": "show",
      "roll": {
        "base": 80,
        "mods": [
          {"if": "has('poles')", "add": 10, "why": "Trekking poles to lean on"},
          {"if": "has('ford_shoes')", "add": 4, "why": "Camp shoes for the crossing"},
          {"if": "river.level >= 2", "add": "-12 * (river.level - 1)", "why": "The river is running high"},
          {"if": "river.glacial && time.hour >= 14", "add": -6, "why": "Afternoon snowmelt"},
          {
            "if": "gear.outside_bulky > 0",
            "add": "-3 * gear.outside_bulky",
            "why": "Gear strapped outside the pack"
          },
          {"if": "gear.pack_ratio > 0.25", "add": -6, "why": "A heavy pack"},
          {"if": "party.size >= 2", "add": 5, "why": "Crossing arm in arm"}
        ],
        "use_mods": ["mods.fatigue", "mods.dark", "mods.cold_hands", "mods.skill_ford"],
        "clamp": [8, 97],
        "pass": "across",
        "fail": [
          {"to": "soaked", "w": 70},
          {"to": "dropped_item", "w": "gear.outside_count > 0 ? 25 : 5"},
          {"to": "swept", "w": "4 + 6 * river.level"}
        ]
      }
    },
    {
      "id": "wait",
      "label": "Make tea on the gravel bar and wait for the water to drop",
      "show_if": "time.min_to_dark > 150",
      "max_uses": 1,
      "odds": "show",
      "roll": {
        "base": "river.glacial ? (time.hour < 11 ? 25 : 45) : 55",
        "mods": [
          {"if": "wx.precip_now", "add": -25, "why": "It is still raining"},
          {"if": "river.level >= 3", "add": -20, "why": "The river is in flood"}
        ],
        "clamp": [5, 90],
        "pass": "dropped",
        "fail": [{"to": "still_high", "w": 1}]
      }
    },
    {
      "id": "log",
      "label": "Scout upstream for a log to cross on",
      "cost": {"time_min": 40, "energy": -4},
      "odds": "show",
      "roll": {
        "table": [
          {"to": "log_found", "w": "45 + (has('poles') ? 10 : 0)"},
          {"to": "log_slip", "w": "has('grippy_boots') ? 10 : 20"},
          {"to": "no_log", "w": 30}
        ]
      }
    },
    {"id": "turn_back", "label": "Turn around and make it a shorter trip", "then": "turned_back"}
  ],
  "outcomes": {
    "across": {
      "tier": "good",
      "text": [
        "The cold grabbed {their} shins and let go. On the far bank {they} wrung out {their} socks and laughed at nothing in particular.",
        "Step, feel, step. The stones knocked against each other underfoot like marbles in a bag, and then the far bank came up to meet {them}."
      ],
      "effects": [
        {"op": "meter", "wet": 15, "warmth": -4, "spirits": 3},
        {"op": "skill_xp", "skill": "ford", "xp": 1},
        {"op": "flag", "set": "forded_today", "scope": "day"}
      ]
    },
    "soaked": {
      "tier": "bad",
      "text": [
        "A stone rolled under {their} boot, and down {they} went: one knee, then all the rest. {^they} came up gasping, soaked to the waist, on the right side of the river at least."
      ],
      "effects": [
        {"op": "meter", "wet": 55, "warmth": -15, "spirits": -6},
        {"op": "gear_wet", "scope": "unprotected"},
        {"op": "remember", "key": "wet_from", "value": "{river}"},
        {
          "op": "queue",
          "card": "chain.damp_evening",
          "at": "camp_evening",
          "if": "state.wet >= 40 && lacks('camp_clothes_dry')",
          "foreshadow": "Water squelched in {their} boots with every step.",
          "why": "Soaked at the {river} crossing"
        }
      ]
    },
    "dropped_item": {
      "tier": "bad",
      "text": [
        "{^they} made it across, but something strapped to the outside of the pack did not. It bobbed away downstream toward the sea, and {they} watched it go."
      ],
      "effects": [
        {"op": "meter", "wet": 30, "warmth": -8, "spirits": -8},
        {"op": "gear_lose", "pick": "outside_first", "fallback": "random_loose"}
      ]
    },
    "swept": {
      "tier": "worse",
      "sierra_moment": true,
      "text": [
        "The current took {their} legs. For a long moment there was only roaring and cold, and then a gravel bar caught {them}. {^they} crawled out, shaking, on the same side {they} had started from."
      ],
      "effects": [
        {"op": "meter", "wet": 90, "warmth": -30, "spirits": -20, "energy": -15},
        {"op": "injury", "id": "bruised_knee", "sev": 1, "chance": 0.5},
        {"op": "gear_wet", "scope": "all", "unless": "has('pack_liner')"},
        {"op": "route", "do": "stay_this_side"},
        {"op": "page", "card": "crisis.warm_up_now"}
      ],
      "modes": {
        "sierra": {
          "if": "river.level >= 3 && lacks('poles')",
          "text": [
            "The current took {their} legs, and this time no gravel bar was waiting. The {river} carried the rest of the story down to the Pacific."
          ],
          "effects": [{"op": "death", "cause": "swept_away", "restore": "before_card"}]
        }
      }
    },
    "dropped": {
      "tier": "ok",
      "text": [
        "By the second cup of tea the channel had shrunk. Stones that had been underwater now stood dry and pale in the sun."
      ],
      "effects": [{"op": "time", "min": 120}, {"op": "river", "delta": -1}, {"op": "represent", "hide": ["wait"]}]
    },
    "still_high": {
      "tier": "ok",
      "text": ["Two hours went by. The river did not seem to notice."],
      "effects": [{"op": "time", "min": 120}, {"op": "represent", "hide": ["wait"]}]
    },
    "log_found": {
      "tier": "good",
      "text": [
        "A quarter mile upstream, a fallen spruce lay across the channel like a bridge someone had forgotten to finish. {^they} shuffled across it, arms out, and only wobbled once."
      ],
      "effects": [{"op": "meter", "spirits": 4}, {"op": "journal", "entry": "nurse_log_bridge"}]
    },
    "log_slip": {
      "tier": "bad",
      "text": [
        "The log was slick with moss. Halfway over, one foot went one way and the rest of {them} went the other. {^they} landed in knee-deep water, which was, all things considered, the lucky half."
      ],
      "effects": [
        {"op": "meter", "wet": 40, "warmth": -8, "spirits": -5},
        {"op": "injury", "id": "scraped_shin", "sev": 1}
      ]
    },
    "no_log": {
      "tier": "ok",
      "text": [
        "There were logs, but none in the right place. {^they} came back to the crossing a little more tired and no closer to the other side."
      ],
      "effects": [{"op": "represent", "hide": ["log"]}]
    },
    "turned_back": {
      "tier": "ok",
      "text": [
        "Some rivers are for another day. {^they} turned back toward {nearest_camp_name}, and the trip quietly became a different, shorter trip."
      ],
      "effects": [{"op": "route", "do": "turn_back", "replan": "nearest_permitted_camp"}, {"op": "score", "wisdom": 2}]
    }
  },
  "meta": {
    "src": [
      "hazard:hoh_olympus/hoh_side_channel_fords",
      "hazard:hoh_olympus/queets_ford",
      "hazard:hoh_olympus/snider_jackson_fords"
    ],
    "tunable": {"choices.wade.roll.base": [70, 88], "choices.wait.roll.base": [20, 60]},
    "status": "example"
  }
}
```

**What makes it multiply:**
- `river.level` (0-3) comes from the rain of the last 48 hours, snowmelt and the hour of day. It changes the card's weight, the wade odds, the share of severe failures, and whether `wait` is likely to help.
- Glacial rivers run lowest in the early morning and rise with afternoon melt, so `wait` honestly works *worse* for a glacial river before 11 am. A player learns this, and it is true.
- Gear tags change the odds: `poles` +10, `ford_shoes` +4, strapped-on gear -3 each, heavy pack -6, a partner +5.
- The `soaked` outcome queues `chain.damp_evening` **only if** the player has no dry camp clothes. The pack decides whether a wet crossing becomes a bad night.
- `represent` loops (`wait`, `log`) are bounded by `max_uses` and `hide`, so the linter can prove the card ends.
- Sierra override: drowning is possible only in flood with no poles. Everywhere else the worst case is a cold, scary swim and a forced fork.

**Odds for `wade` (illustrative):**

| Situation | p(across) | If it goes wrong: soaked / item lost / swept |
|---|---|---|
| level 1, poles, light pack, nothing outside, solo, morning | 90% | 82% / 6% / 12% (swept about 1% overall) |
| level 1, no poles, tent and pad strapped outside, solo | 74% | 67% / 24% / 10% |
| level 2, no poles, heavy pack, 3 pm glacial melt, tired (energy 20) | 51% | 77% / 5% / 18% (about 9% swept overall) |


#### Card 2: a cold night (`night.cold_hours`)

A night card that fires whenever the night model's margin is negative, and is forced at -6 F or worse. One shared table, `tables.night_sleep`, is driven by a local variable `m` that each choice adjusts with `let`. That is the idiom for "different preparations, same physics".

```json
{
  "id": "night.cold_hours",
  "kind": "night",
  "family": "cold",
  "title": "The cold hours",
  "trigger": "camp_night",
  "where": {},
  "when": {},
  "if": "night.margin_f < 0",
  "priority": "forced_if:night.margin_f <= -6",
  "weight": "10 - night.margin_f",
  "limit": {"per_night": 1},
  "scene": {"use": "camp", "tod": "night", "overlays": ["frost?wx.low_f<=32", "stars?wx.sky=='clear'"]},
  "text": {
    "intro": [
      "Sometime after midnight the cold found {them}. It came up from the ground first, then in through every gap in {their} {?has('sleep_bag'): {gear:sleep_bag} | jacket}, and it settled in like it meant to stay.",
      "The stars over {place} were sharp as needles, and the air was sharper. {^H} lay awake, counting {their} own shivers."
    ],
    "why_line": "{^they} {v:was|were} about {words:abs(night.margin_f)} degrees short of a warm night: {list:night.margin_terms}."
  },
  "choices": [
    {
      "id": "layers_snack",
      "label": "Pull on every layer and eat something",
      "show_if": "gear.spare_layers > 0 || food.snacks > 0",
      "let": {"m": "night.margin_f + 2 * gear.spare_layers + (food.snacks > 0 ? 3 : 0)"},
      "effects_before": [{"op": "food", "kcal": -250, "if": "food.snacks > 0"}],
      "odds": "words",
      "roll": {"table_ref": "tables.night_sleep"}
    },
    {
      "id": "hot_bottle",
      "label": "Boil water and hug a hot bottle inside the bag",
      "show_if": "has('stove') && gear.fuel_g >= 15 && has('hard_bottle')",
      "enable_if": "lacks('stove_wet_matches')",
      "disabled_reason": "The matches are damp.",
      "let": {"m": "night.margin_f + 8"},
      "effects_before": [{"op": "fuel", "g": -15}, {"op": "time", "min": 20}],
      "odds": "words",
      "roll": {"table_ref": "tables.night_sleep"}
    },
    {
      "id": "huddle",
      "label": "Scoot over close to {c1}",
      "show_if": "party.size >= 2",
      "let": {"m": "night.margin_f + 5"},
      "odds": "words",
      "roll": {"table_ref": "tables.night_sleep"},
      "effects_after": [{"op": "companion", "who": "c1", "bond": 1}]
    },
    {
      "id": "walk",
      "label": "Get up and walk circles by headlamp until dawn",
      "show_if": "has('light')",
      "then": "walked_till_dawn"
    },
    {
      "id": "endure",
      "label": "Curl up tight and wait for morning",
      "let": {"m": "night.margin_f"},
      "odds": "words",
      "roll": {"table_ref": "tables.night_sleep"}
    }
  ],
  "tables": {
    "night_sleep": [
      {"to": "slept", "w": "max(0, 30 + 3 * m)"},
      {"to": "fitful", "w": "max(5, 40 - 2 * abs(m + 5))"},
      {"to": "shivering", "w": "max(0, 10 - 3 * m)"},
      {"to": "hypothermic", "w": "max(0, -12 - 2 * m)"}
    ]
  },
  "outcomes": {
    "slept": {
      "tier": "ok",
      "text": ["Little by little the warmth crept back, and {they} fell asleep before {they} noticed it happening."],
      "effects": [{"op": "meter", "energy": -5, "warmth": 5}]
    },
    "fitful": {
      "tier": "bad",
      "text": [
        "{^they} dozed and woke, dozed and woke. Each time the tent was a little greyer, until at last it was morning."
      ],
      "effects": [{"op": "meter", "energy": -20, "spirits": -6}, {"op": "flag", "set": "poor_sleep", "scope": "day"}]
    },
    "shivering": {
      "tier": "bad",
      "text": [
        "The shivering came in waves, each one bigger than the last. By dawn {their} jaw ached from clenching."
      ],
      "effects": [
        {"op": "meter", "energy": -35, "warmth": -20, "spirits": -15},
        {"op": "queue", "card": "morning.after_cold_night", "at": "morning", "why": "A very cold night"}
      ]
    },
    "hypothermic": {
      "tier": "worse",
      "sierra_moment": true,
      "text": [
        "Somewhere in the dark the shivering stopped, which is not the good news it sounds like. {^their} thoughts went slow and simple. When grey light came, {they} could barely work the zipper."
      ],
      "effects": [
        {"op": "meter", "energy": -50, "warmth": -40, "spirits": -25},
        {"op": "condition", "id": "hypothermia", "sev": 2},
        {
          "op": "page",
          "card": "crisis.morning_help",
          "why": "Hypothermia after a night without enough insulation"
        }
      ],
      "modes": {
        "sierra": {
          "if": "m <= -20 && lacks('shelter')",
          "text": [
            "The cold was patient, and the night was long. In the morning a marmot whistled from the rocks, but nobody in the hollow by the snowfield whistled back."
          ],
          "effects": [{"op": "death", "cause": "hypothermia", "restore": "last_morning"}]
        }
      }
    },
    "walked_till_dawn": {
      "tier": "bad",
      "text": [
        "Round and round the little camp {they} went, a small moving star, until the real stars faded. Warm enough. Not one wink of sleep."
      ],
      "effects": [
        {"op": "meter", "energy": -40, "warmth": 5, "spirits": -5},
        {"op": "battery", "hours": -4},
        {"op": "flag", "set": "no_sleep", "scope": "day"}
      ]
    }
  },
  "meta": {
    "src": [
      "hazard:hoh_olympus/rain_and_hypothermia",
      "hazard:hoh_olympus/underprepared_day_hike_to_glacier",
      "hazard:sol_duc_high_divide/cold_wet_night"
    ],
    "notes": "night.margin_f is produced by the body model (simulation.md 7.4/7.6): sleep-system rating plus worn insulation minus forecast low minus wetness and wind penalties. night.margin_terms carries the labeled terms for the why line.",
    "status": "example"
  }
}
```

**Distribution of `tables.night_sleep` by margin `m`:**

| m (F) | slept | fitful | shivering | hypothermic | Typical cause |
|---|---|---|---|---|---|
| +5 | 69% | 31% | 0% | 0% | A -3 night rescued by a hot bottle (+8) |
| 0 | 43% | 43% | 14% | 0% | Borderline 40 F bag on a 38 F night |
| -3 | 28% | 47% | 25% | 0% | Damp clothes in the bag |
| -10 | 0% | 38% | 51% | 10% | Summer bag at Glacier Meadows in late September |
| -25 | 0% | 4% | 66% | 30% | **Day-hike gear, one night at Glacier Meadows** (the user's example): no bag, no pad |

**What makes it multiply:**
- The choice list *is* the pack: `hot_bottle` needs a stove, fuel and a hard bottle, `huddle` needs a companion, and `walk` needs a light.
- `why_line` prints the margin terms, which teaches the player what went wrong.
- The Storybook floor is `crisis.morning_help`: kind neighbors, then a ranger, then the trip ends early.
- In Sierra mode, death requires `m <= -20` **and** no shelter.


#### Card 3: the tide headland (`coast.headland_tide`)

For any beach segment tagged `tide_dependent`. It needs one coast overlay field per segment, `tide_max_ft` ("passable below 4 ft"), and an `alt` link to the overland trail where one exists. It is forced: the coast does not let you ignore the tide.

```json
{
  "id": "coast.headland_tide",
  "kind": "hazard",
  "family": "tide",
  "title": "The point and the tide",
  "trigger": "on_segment",
  "where": {"segment_hazard": ["tide_dependent"], "trail_class": ["beach"], "zone": ["coast_beach"]},
  "when": {"tod": ["dawn", "morning", "midday", "afternoon", "golden", "dusk"]},
  "if": "seg.tide_max_ft != null",
  "priority": "forced",
  "limit": {"per_segment": 1},
  "scene": {"use": "segment_end", "overlays": ["surf_on_point?tide.ft > seg.tide_max_ft - 1", "wet_sand"]},
  "text": {
    "intro": [
      "The beach narrowed to a strip of cobbles, and then to nothing at all. Ahead, {headland} pushed its dark shoulder into the sea, and the waves were {?tide.ft > seg.tide_max_ft: breaking right against its foot | sliding back from its foot, leaving the rocks shining}.",
      "Around the point lay the rest of the coast. Between here and there stood {headland}, wet with spray. {^H} tried to remember what the tide was doing, and {?has('tide_table'): then remembered the little booklet in {their} hip pocket | wished very much that {they} knew}."
    ],
    "known": "The tide table said {n:tide.ft} feet and {?tide.trend < 0: falling | rising}. The point was passable below {n:seg.tide_max_ft} feet."
  },
  "choices": [
    {
      "id": "check_table",
      "label": "Check the tide table and the watch",
      "show_if": "has('tide_table') && !card.known",
      "then": "read_table"
    },
    {
      "id": "round_now",
      "label": "Time the waves and round the point now",
      "odds": "has('tide_table') && card.known ? 'show' : 'words'",
      "roll": {
        "base": "60 + 15 * (seg.tide_max_ft - tide.ft)",
        "mods": [
          {"if": "tide.trend > 0", "add": -15, "why": "The tide is rising"},
          {"if": "wx.swell_ft >= 8", "add": -10, "why": "Big swell running"},
          {"if": "has('poles')", "add": 4, "why": "Poles on slick rock"},
          {"if": "gear.pack_ratio > 0.25", "add": -5, "why": "A heavy pack"},
          {"if": "gear.top_heavy", "add": -4, "why": "Canister riding high"}
        ],
        "use_mods": ["mods.dark", "mods.fatigue"],
        "clamp": [5, 97],
        "pass": "rounded",
        "fail": [
          {"to": "wave_soak", "w": 60},
          {"to": "pinned", "w": 30},
          {"to": "knocked_down", "w": "10 + 10 * max(0, tide.ft - seg.tide_max_ft)"}
        ]
      }
    },
    {
      "id": "wait",
      "label": "Sit on a drift log and wait for the water to go out",
      "show_if": "tide.trend < 0 || tide.min_to_safe <= 360",
      "then": "waited",
      "preview": "About {words_minutes:tide.min_to_safe} of waiting."
    },
    {
      "id": "overland",
      "label": "Climb the overland trail over the headland",
      "show_if": "route.alt('headland_overland') != null",
      "cost": {"time_min": "route.alt_minutes('headland_overland')", "energy": -8},
      "odds": "show",
      "roll": {
        "base": 92,
        "mods": [
          {"if": "wx.precip_24h_in > 0.25", "add": -8, "why": "Mud on the rope ladders"},
          {"if": "gear.outside_bulky > 0", "add": "-3 * gear.outside_bulky", "why": "Gear snagging on salal"},
          {"if": "gear.pack_ratio > 0.25", "add": -5, "why": "A heavy pack on a ladder"}
        ],
        "use_mods": ["mods.dark", "mods.fatigue", "mods.skill_scramble"],
        "clamp": [40, 98],
        "pass": "over_the_top",
        "fail": [{"to": "muddy_slide", "w": 1}]
      }
    },
    {"id": "retreat", "label": "Go back and camp on the last good beach", "then": "retreated"}
  ],
  "outcomes": {
    "read_table": {
      "tier": "ok",
      "text": [
        "{^they} sat down, unfolded the little booklet, and did arithmetic with a wet finger. {@text.coast.tide_known}"
      ],
      "effects": [{"op": "card_var", "known": true}, {"op": "represent"}]
    },
    "rounded": {
      "tier": "good",
      "text": [
        "{^they} waited for a wave to pull back, then went: over the bull kelp, around the barnacles, up onto dry sand on the far side. Behind {them} the next wave filled the place where {they} had been."
      ],
      "effects": [{"op": "meter", "spirits": 5}, {"op": "skill_xp", "skill": "coast", "xp": 1}]
    },
    "wave_soak": {
      "tier": "bad",
      "text": [
        "The seventh wave was bigger than the other six. It came around the rock knee-high and cold as January, and it soaked {them} to the hips before letting go."
      ],
      "effects": [
        {"op": "meter", "wet": 50, "warmth": -10, "spirits": -6},
        {"op": "gear_wet", "scope": "unprotected"},
        {"op": "remember", "key": "wet_from", "value": "the sea at {headland}"}
      ]
    },
    "pinned": {
      "tier": "bad",
      "text": [
        "Halfway around, the water came in faster than {they} could go on, and there was no going back either. {^they} climbed onto a barnacled shelf and waited there, wet and very small, while the Pacific made up its mind."
      ],
      "effects": [
        {"op": "time", "min": "max(60, tide.min_to_safe)"},
        {"op": "meter", "wet": 35, "warmth": -18, "spirits": -12},
        {"op": "queue", "card": "fork.light_going", "at": "now_if:time.min_to_dark < 90"}
      ]
    },
    "knocked_down": {
      "tier": "worse",
      "sierra_moment": true,
      "text": [
        "A wave knocked {them} flat against the rocks and dragged at the pack. When it let go, {they} scrambled back the way {they} had come, scraped and soaked and very glad of the sand."
      ],
      "effects": [
        {"op": "meter", "wet": 80, "warmth": -25, "spirits": -20},
        {"op": "injury", "id": "barnacle_cuts", "sev": 1},
        {"op": "gear_lose", "pick": "outside_first", "chance": 0.5},
        {"op": "route", "do": "stay_this_side"}
      ],
      "modes": {
        "sierra": {
          "if": "tide.ft - seg.tide_max_ft >= 1.5",
          "text": [
            "The sea does not read tide tables, but it keeps them very strictly. The wave took {them} off the rocks, and the coast went on without {them}."
          ],
          "effects": [{"op": "death", "cause": "swept_off_headland", "restore": "before_card"}]
        }
      }
    },
    "waited": {
      "tier": "ok",
      "text": [
        "{^they} watched the sea slowly back away from the point, one wave at a time, like someone easing out of a crowded room."
      ],
      "effects": [
        {"op": "time", "min": "tide.min_to_safe"},
        {"op": "tide", "advance": true},
        {"op": "represent", "hide": ["wait"]}
      ]
    },
    "over_the_top": {
      "tier": "ok",
      "text": [
        "Up a rope, up a ladder of split logs, through salal taller than {their} head, and down the other side, muddy to the elbows."
      ],
      "effects": [{"op": "route", "do": "take_alt", "alt": "headland_overland"}, {"op": "meter", "spirits": 2}]
    },
    "muddy_slide": {
      "tier": "bad",
      "text": [
        "The rope was slick and the mud was slicker. {^they} slid the last ten feet on {their} seat and arrived, as people say, all in one piece but not all one color."
      ],
      "effects": [
        {"op": "route", "do": "take_alt", "alt": "headland_overland"},
        {"op": "meter", "spirits": -4, "wet": 15},
        {"op": "injury", "id": "twisted_wrist", "sev": 1, "chance": 0.3}
      ]
    },
    "retreated": {
      "tier": "ok",
      "text": [
        "The point would still be here tomorrow, and so would the tide table. {^they} turned back toward the last wide beach."
      ],
      "effects": [{"op": "route", "do": "turn_back", "replan": "beach_camp_behind"}, {"op": "score", "wisdom": 2}]
    }
  },
  "meta": {
    "src": ["region:coast/hazards (pending research)", "simulation.md 4.8 tides"],
    "requires_data": ["segments[].tide_max_ft (coast overlay field)", "route alt link to the headland_overland segment"],
    "status": "example"
  }
}
```

**What makes it multiply:**
- The base odds come straight from the gap between the tide and the point's threshold: `60 + 15 x (tide_max_ft - tide.ft)`. At 1.5 ft under the threshold the base is 82%; at 0.5 ft over it is 52%.
- Rising water costs -15 and big swell -10.
- **The tide table changes what you know, not the sea.** Without it, the odds read "probably" or "unlikely". With it, you can spend a page reading it, and the card re-presents with exact numbers and the `known` line.
- `wait` costs real minutes from the tide model, which can push arrival past dark. That is a natural hand-off to `fork.light_going`.
- `overland` uses its own footing check (mud, a heavy pack, gear snagging in salal).


#### Card 4: a bear in camp (`camp.bear_visit`)

An encounter at dusk. The weight rises sharply when food is not secured, when scented items are in the tent, in late summer (berry season), and when a **region flag** `bears_learned` was set by a previous trip.

```json
{
  "id": "camp.bear_visit",
  "kind": "encounter",
  "family": "bear",
  "title": "A visitor at dusk",
  "trigger": "camp_evening",
  "where": {"band": ["lowland", "montane", "subalpine"], "node_type": ["camp"]},
  "when": {"month": [5, 6, 7, 8, 9, 10], "tod": ["golden", "dusk", "night"]},
  "if": "!flag('bear_visit_this_trip')",
  "weight": "2 + 6 * (camp.food_secured ? 0 : 1) + 3 * (camp.scented_in_tent ? 1 : 0) + 4 * (flag_region('bears_learned') ? 1 : 0) + (time.month >= 8 ? 2 : 0)",
  "limit": {"per_trip": 1},
  "scene": {"use": "camp", "sprites": ["black_bear@camp_edge"]},
  "text": {
    "intro": [
      "Just as the pot began to hum, {H} looked up. At the edge of camp, where the {~huckleberries|salmonberries|ferns} grew thick, a black bear was standing perfectly still, nose working, looking at the dinner.",
      "Something large moved in the {~brush|alders|young firs}. A black bear stepped into the clearing, round and shining and in no hurry at all, and turned its nose toward {?camp.food_secured: the bear canister sitting by itself on a flat rock | the food bag lying open by the tent}."
    ],
    "lean": "It seemed to be making up its mind about something."
  },
  "choices": [
    {
      "id": "big_and_calm",
      "label": "Stand up tall together and talk to it in a big, calm voice",
      "odds": "show",
      "roll": {
        "base": "camp.food_secured ? 92 : 70",
        "mods": [
          {"if": "party.size >= 2", "add": 5, "why": "More of you to look big"},
          {"if": "flag_region('bears_learned')", "add": -15, "why": "Bears here have learned about food"},
          {"if": "camp.food_out_now", "add": -10, "why": "Dinner is out in the open"}
        ],
        "clamp": [10, 98],
        "pass": "bear_leaves",
        "fail": [
          {"to": "bear_tests_can", "w": "camp.food_secured ? 1 : 0"},
          {"to": "bear_gets_food", "w": "camp.food_secured ? 0 : 1"}
        ]
      }
    },
    {
      "id": "bang_pot",
      "label": "Bang the pot with a spoon and shout",
      "show_if": "has('pot')",
      "odds": "show",
      "roll": {
        "base": "camp.food_secured ? 90 : 72",
        "mods": [{"if": "flag_region('bears_learned')", "add": -10, "why": "Bears here have heard pots before"}],
        "clamp": [10, 98],
        "pass": "bear_leaves_noisy",
        "fail": [
          {"to": "bear_tests_can", "w": "camp.food_secured ? 1 : 0"},
          {"to": "bear_gets_food", "w": "camp.food_secured ? 0 : 1"}
        ]
      }
    },
    {
      "id": "grab_food",
      "label": "Run and grab the food before it does",
      "odds": "show",
      "roll": {
        "base": 35,
        "use_mods": ["mods.dark"],
        "clamp": [5, 60],
        "pass": "grabbed",
        "fail": [{"to": "bear_bluff", "w": 70}, {"to": "bear_gets_food", "w": 30}]
      }
    },
    {
      "id": "hide",
      "label": "Get in the tent and keep very quiet",
      "roll": {
        "table": [
          {"to": "bear_tests_can", "w": "camp.food_secured ? 60 : 0"},
          {"to": "bear_leaves", "w": "camp.food_secured ? 40 : 20"},
          {"to": "bear_gets_food", "w": "camp.food_secured ? 0 : 80"}
        ]
      },
      "odds": "words"
    }
  ],
  "outcomes": {
    "bear_leaves": {
      "tier": "good",
      "text": [
        "The bear listened to all of this with polite interest. Then it swung its big head away and ambled off into the trees, as if it had only stopped by to see who had moved in."
      ],
      "effects": [
        {"op": "meter", "spirits": 6},
        {"op": "journal", "entry": "black_bear"},
        {"op": "flag", "set": "bear_visit_this_trip", "scope": "trip"},
        {"op": "score", "wisdom": 3}
      ]
    },
    "bear_leaves_noisy": {
      "tier": "good",
      "text": [
        "CLANG, went the pot, and CLANG again. The bear flinched, decided this camp was far too loud for supper, and crashed away downhill. Somewhere across the {?here.type == 'camp': camp | meadow} a neighbor's voice said, \"Was that you?\""
      ],
      "effects": [
        {"op": "meter", "spirits": 4},
        {"op": "journal", "entry": "black_bear"},
        {"op": "flag", "set": "bear_visit_this_trip", "scope": "trip"}
      ]
    },
    "bear_tests_can": {
      "tier": "ok",
      "text": [
        "The bear walked straight to the canister, sniffed it, pawed it, and rolled it over twice like a toy. The lid held. After a while the bear gave up and wandered off, a little offended."
      ],
      "effects": [
        {"op": "flag", "set": "bear_visit_this_trip", "scope": "trip"},
        {"op": "journal", "entry": "black_bear"},
        {
          "op": "queue",
          "card": "chain.find_canister",
          "at": "morning",
          "chance": 0.5,
          "why": "The bear rolled the canister away",
          "foreshadow": "In the dark, something plastic went bump, bump, bump, down the slope."
        }
      ]
    },
    "grabbed": {
      "tier": "ok",
      "text": [
        "{^they} snatched the food and backed away, heart going like a woodpecker. The bear watched, considered, and decided it was not worth the fuss. This time."
      ],
      "effects": [
        {"op": "meter", "spirits": -4},
        {"op": "flag", "set": "bear_visit_this_trip", "scope": "trip"},
        {"op": "score", "wisdom": -2}
      ]
    },
    "bear_bluff": {
      "tier": "bad",
      "text": [
        "The bear huffed, slapped the ground, and took two quick steps forward. {^they} froze, then backed away slowly, talking the whole time, until the bear went back to its business."
      ],
      "effects": [
        {"op": "meter", "spirits": -15},
        {"op": "flag", "set": "bear_visit_this_trip", "scope": "trip"},
        {"op": "page", "card": "camp.bear_visit_aftermath"}
      ]
    },
    "bear_gets_food": {
      "tier": "worse",
      "text": [
        "The bear found the food the way a bear always finds food: thoroughly. When it was done there was nothing left but torn wrappers and a lesson nobody wanted."
      ],
      "effects": [
        {"op": "food_lose", "scope": "not_in_can"},
        {"op": "meter", "spirits": -20},
        {"op": "lnt", "delta": -10, "why": "A bear got human food"},
        {"op": "flag", "set": "bears_learned", "scope": "region", "why": "Bears remember where the food was"},
        {"op": "flag", "set": "bear_visit_this_trip", "scope": "trip"},
        {"op": "page", "card": "fork.food_short", "if": "food.days_left < trip.days_left"},
        {"op": "epilogue", "line": "ranger.bear_conditioned"}
      ]
    }
  },
  "meta": {
    "src": [
      "hazard:sol_duc_high_divide/bear_in_camp",
      "hazard:hoh_olympus/bears_and_food_storage",
      "rule:park_rules/bear_canister_required"
    ],
    "notes": "No Sierra death on this card in any mode. Olympic has black bears, not grizzlies, and the honest consequence of bad food storage is lost food, a short trip and a conditioned bear. camp.food_secured is computed by the pack model: all food and scented items in an approved canister placed away from the tent.",
    "status": "example"
  }
}
```

**What makes it multiply:**
- `camp.food_secured` (all food and scented items in a canister, away from the tent) flips every choice's odds and every failure branch. In 2026 a canister is required for every overnight in Olympic wilderness, so a correctly packed hiker meets the gentle version of this card. A hiker who skipped the canister or left dinner out meets the hard version.
- `bear_gets_food` sets `bears_learned` at **region** scope, so the *next* trip into that region is more likely to meet a bolder bear. The epilogue includes a ranger's note. This is a cross-trip delayed consequence.
- Choice odds honestly reward the right behavior (big, calm, together) and punish grabbing the food.
- **No Sierra death on this card**, by design and stated in `meta.notes`.


#### Card 5: a sunset and the sketch (`joy.alpenglow_sketch`)

A discovery card at a high camp with a view on a clear evening. It is the gentle center of the homage. Sketching is drawn from the scene's own vector lines without fills (section 7.6), and staying up for the light can queue the Snowlamp finale at blue hour (storybook.md 5.5).

```json
{
  "id": "joy.alpenglow_sketch",
  "kind": "discovery",
  "family": "sunset",
  "title": "The last light",
  "trigger": "camp_evening",
  "where": {"band": ["subalpine", "alpine"], "node_tag": ["view"]},
  "when": {"weather": ["clear", "partly"], "tod": ["golden"]},
  "if": "time.min_to_dark >= 20 && time.min_to_dark <= 100 && !flag('watched_sunset_tonight')",
  "weight": "10 + 20 * (has('sketchbook') ? 1 : 0) + 10 * (here.is_trip_high_point ? 1 : 0)",
  "limit": {"per_night": 1, "cooldown_beats": 0},
  "scene": {
    "use": "camp",
    "tod": "golden",
    "palette_steps": ["golden", "dusk", "blue_hour"],
    "sprites": [{"id": "olympic_marmot", "at": "rock_perch", "chance": 0.5}]
  },
  "text": {
    "intro": [
      "The sun slid down behind {skyline}, and everything it had touched all day began to glow: first the snow, then the rock, then the very tips of the firs. {^H} stopped what {they} {v:was|were} doing.",
      "Down in the valley it was already evening, but up here the light had not finished. {skyline} turned the color of {~apricots|embers|a peach left in the sun}."
    ],
    "by_place": {
      "glacier_meadows": [
        "Above the moraine, the Blue Glacier caught the last light and held it, white going to gold going to rose. Mount Olympus stood at the top of it all, very old and very calm."
      ],
      "lunch_lake": [
        "Above Seven Lakes Basin, Bogachiel Peak glowed like a coal, and every little lake below held a second, upside-down sunset."
      ],
      "royal_lake": [
        "Mount Deception and the Needles caught fire one after another, and Royal Lake held all of it, perfectly still."
      ]
    }
  },
  "choices": [
    {
      "id": "sketch",
      "label": "Sit on a warm rock with the sketchbook until the light is gone",
      "show_if": "has('sketchbook')",
      "odds": "words",
      "roll": {
        "table": [
          {"to": "lovely_sketch", "w": "60 + (has('puffy') ? 25 : 0) + (state.warmth >= 50 ? 10 : 0)"},
          {"to": "cold_fingers", "w": "(has('puffy') ? 5 : 25) + (wx.wind_mph >= 15 ? 15 : 0)"}
        ]
      }
    },
    {"id": "watch", "label": "Just sit and watch", "then": "watched"},
    {
      "id": "photo",
      "label": "Take a picture with the phone",
      "show_if": "gear.phone_battery_pct >= 5",
      "then": "photo"
    },
    {"id": "bed", "label": "Crawl into the sleeping bag early", "then": "early_bed"}
  ],
  "outcomes": {
    "lovely_sketch": {
      "tier": "good",
      "text": [
        "{^they} drew fast while the colors changed: a line for the ridge, a smudge for the snow, a tiny tent for scale. It was not a perfect drawing. It was a true one."
      ],
      "effects": [
        {"op": "journal", "entry": "sunset:{here.id}", "kind": "sketch", "art": "scene_lines"},
        {"op": "meter", "spirits": 12, "warmth": -4},
        {"op": "score", "joy": 8},
        {"op": "flag", "set": "watched_sunset_tonight", "scope": "night"},
        {"op": "flag", "set": "watched_sunset_high", "scope": "trip"},
        {
          "op": "queue",
          "card": "finale.snowlamp",
          "at": "blue_hour",
          "if": "here.snowlamp_weight > 0 && flag('blank_page_quest') && !flag('snowlamp_found')",
          "chance": "clamp(here.snowlamp_weight + (snow.on_ground ? 0.25 : 0), 0, 0.9)",
          "foreshadow": "As the color drained from the snow, one small spot of gold seemed to stay behind.",
          "why": "Stayed up for the sunset at a high camp near snow"
        }
      ]
    },
    "cold_fingers": {
      "tier": "ok",
      "text": [
        "The wind found {their} fingers before the drawing was done. The sketch was mostly wobbles, but the wobbles were in the right places."
      ],
      "effects": [
        {"op": "journal", "entry": "sunset:{here.id}", "kind": "sketch", "art": "scene_lines_wobbly"},
        {"op": "meter", "spirits": 6, "warmth": -12},
        {"op": "score", "joy": 5},
        {"op": "flag", "set": "watched_sunset_tonight", "scope": "night"},
        {"op": "flag", "set": "watched_sunset_high", "scope": "trip"},
        {
          "op": "queue",
          "card": "finale.snowlamp",
          "at": "blue_hour",
          "if": "here.snowlamp_weight > 0 && flag('blank_page_quest') && !flag('snowlamp_found')",
          "chance": "clamp(here.snowlamp_weight + (snow.on_ground ? 0.25 : 0), 0, 0.9)"
        }
      ]
    },
    "watched": {
      "tier": "good",
      "text": [
        "{^they} watched until the last pink left the snow and the first star came out right where the sun had been. {?party.size >= 2: Nobody said anything. Nobody needed to. | It was the kind of quiet that does not need anyone else in it.}"
      ],
      "effects": [
        {"op": "meter", "spirits": 8, "warmth": -4},
        {"op": "score", "joy": 5},
        {"op": "flag", "set": "watched_sunset_tonight", "scope": "night"},
        {"op": "flag", "set": "watched_sunset_high", "scope": "trip"},
        {
          "op": "queue",
          "card": "finale.snowlamp",
          "at": "blue_hour",
          "if": "here.snowlamp_weight > 0 && flag('blank_page_quest') && !flag('snowlamp_found')",
          "chance": "clamp(here.snowlamp_weight + (snow.on_ground ? 0.25 : 0), 0, 0.9)"
        }
      ]
    },
    "photo": {
      "tier": "ok",
      "text": [
        "Click. The picture on the little screen was orange and grey and not quite it. {^they} put the phone away and looked at the real thing for the last few minutes."
      ],
      "effects": [
        {"op": "battery", "pct": -3},
        {"op": "journal", "entry": "sunset:{here.id}", "kind": "photo"},
        {"op": "meter", "spirits": 5},
        {"op": "score", "joy": 3},
        {"op": "flag", "set": "watched_sunset_tonight", "scope": "night"}
      ]
    },
    "early_bed": {
      "tier": "ok",
      "text": [
        "{^they} zipped the bag up to {their} nose. Through the tent wall the light went gold, then pink, then blue, and {they} missed most of it, warm and sleepy and not sorry."
      ],
      "effects": [{"op": "meter", "warmth": 8, "energy": 6}]
    }
  },
  "meta": {
    "src": ["storybook.md 5.3 sketching, 5.5 the Snowlamp"],
    "notes": "The sketch art is produced by the picture interpreter re-running the current scene's line commands without fills (section 9.6). here.snowlamp_weight is a per-node data field (storybook.md 5.5).",
    "status": "example"
  }
}
```

**What makes it multiply:**
- It only exists if the player packed the `sketchbook` (or chooses to just watch). A `puffy` and the hiker's warmth decide whether the drawing comes out lovely or wobbly.
- `by_place` gives the three must-have places their own sunset lines (Glacier Meadows, Lunch Lake, Royal Lake). Everywhere else gets the generic intros with slot fills (`{skyline}` is resolved from the scene recipe's skyline name).
- The finale queue is gated by data (`here.snowlamp_weight`, `snow.on_ground`, the `blank_page_quest` flag), so the Snowlamp can only appear where storybook.md says it can.
- `royal_lake` is a placeholder id until the northeast region data lands. The linter would flag it, which is the point of the linter.


#### Card 6: navigation in fog (`nav.fog_way_trail`)

For way trails and off-trail travel in the subalpine and alpine bands when visibility drops: the Seven Lakes Basin way trails, Mirror Lake, the Bogachiel Peak spur, Cat Basin, and later Royal Basin's upper meadows.

```json
{
  "id": "nav.fog_way_trail",
  "kind": "hazard",
  "family": "navigation",
  "title": "Into the cloud",
  "trigger": "on_segment",
  "where": {
    "segment_hazard": ["route_finding", "fog"],
    "trail_class": ["way_trail", "primitive", "off_trail"],
    "band": ["subalpine", "alpine"]
  },
  "when": {"weather": ["fog", "overcast_low", "showers", "snow"]},
  "if": "wx.visibility != 'good'",
  "weight": "8 + (seg.class == 'off_trail' ? 6 : 0) + (snow.on_trail ? 6 : 0)",
  "limit": {"per_trip": 2, "per_segment": 1},
  "scene": {"use": "segment_mid", "overlays": ["fog_bands_heavy", "cairn_near"]},
  "text": {
    "intro": [
      "The cloud came up out of the basin like milk poured into a bowl. In a few minutes the lakes were gone, then the far ridge, then the near one. The boot path ahead faded into white after a dozen steps.",
      "{^H} could see one cairn, then nothing, then, if {they} squinted, maybe another. Everything beyond that was grey, and quiet, and very much the same in every direction."
    ],
    "by_place": {
      "mirror_lake_way_trail_junction": [
        "Somewhere below was Mirror Lake, though nothing in the cloud would admit it. The way trail split and split again into little goat paths, all of them sure of themselves, none of them agreeing."
      ]
    }
  },
  "choices": [
    {
      "id": "map_compass",
      "label": "Stop, take out the map and compass, and take a bearing",
      "show_if": "has('map') && has('compass') && !card.bearing",
      "cost": {"time_min": 10},
      "then": "took_bearing"
    },
    {
      "id": "follow",
      "label": "Go carefully, cairn to cairn",
      "odds": "show",
      "roll": {
        "base": 66,
        "mods": [
          {"if": "card.bearing", "add": "8 + 4 * skill.nav", "why": "A compass bearing"},
          {
            "if": "has('gps') && gear.phone_battery_pct >= 10",
            "add": 10,
            "why": "Phone GPS with a downloaded map"
          },
          {"if": "has('map') && !card.bearing", "add": 4, "why": "A paper map"},
          {"if": "seg.class == 'off_trail'", "add": -15, "why": "No real trail here"},
          {"if": "snow.on_trail", "add": -12, "why": "Snow is hiding the path"},
          {"if": "flag('walked_this_way')", "add": 12, "why": "You came this way before"}
        ],
        "use_mods": ["mods.fatigue", "mods.dark", "mods.skill_nav"],
        "clamp": [10, 97],
        "pass": "on_track",
        "fail": [
          {"to": "off_route_short", "w": 55},
          {"to": "off_route_long", "w": "25 + (time.min_to_dark < 180 ? 10 : 0)"},
          {"to": "meadow_trampled", "w": 15},
          {"to": "cliff_band", "w": "seg_has('steep_scree') || seg_has('cliff') ? 12 : 3"}
        ]
      }
    },
    {
      "id": "wait",
      "label": "Sit on the pack and wait for the cloud to lift",
      "max_uses": 2,
      "odds": "show",
      "roll": {
        "base": "100 * wx.fog_lift_p_hour",
        "clamp": [5, 85],
        "pass": "cloud_lifts",
        "fail": [{"to": "still_grey", "w": 1}]
      },
      "cost": {"time_min": 60}
    },
    {"id": "back", "label": "Retrace your steps to the last junction you were sure of", "then": "went_back"}
  ],
  "outcomes": {
    "took_bearing": {
      "tier": "ok",
      "text": [
        "{^they} turned the map until the lakes on paper lined up with the lakes in memory, then turned the compass dial. The needle pointed at grey, which was fine. Now the grey had a direction."
      ],
      "effects": [
        {"op": "card_var", "bearing": true},
        {"op": "skill_xp", "skill": "nav", "xp": 1},
        {"op": "represent", "hide": ["map_compass"]}
      ]
    },
    "on_track": {
      "tier": "good",
      "text": [
        "One cairn led to the next, and the next, like a sentence spelled out in stones. When the trail finally firmed underfoot, {they} let out a breath {they} had not noticed holding."
      ],
      "effects": [{"op": "meter", "spirits": 4}, {"op": "skill_xp", "skill": "nav", "xp": 1}]
    },
    "off_route_short": {
      "tier": "bad",
      "text": [
        "The boot path turned out to be a marmot path, and the marmot path turned out to be nothing. {^they} backtracked, found the cairn again, and started over, wiser and later."
      ],
      "effects": [{"op": "time", "min": 45}, {"op": "meter", "energy": -6, "spirits": -4}]
    },
    "off_route_long": {
      "tier": "bad",
      "text": [
        "By the time {they} admitted it, {they} had been lost for a while. The slope was wrong, the creek was on the wrong side, and the cloud would not say anything helpful at all."
      ],
      "effects": [
        {"op": "time", "min": 120},
        {"op": "meter", "energy": -15, "spirits": -10, "wet": 10},
        {"op": "page", "card": "fork.light_going", "if": "time.min_to_dark < 150"},
        {"op": "remember", "key": "lost_at", "value": "{place}"}
      ]
    },
    "meadow_trampled": {
      "tier": "bad",
      "text": [
        "{^they} found the way again, but only after wandering across a soft heather meadow that had taken a hundred years to grow. Behind {them}, a line of footprints stood in it like a scar."
      ],
      "effects": [
        {"op": "time", "min": 30},
        {"op": "lnt", "delta": -3, "why": "Walked across a fragile meadow"},
        {"op": "meter", "spirits": -3}
      ]
    },
    "cliff_band": {
      "tier": "worse",
      "sierra_moment": true,
      "text": [
        "The ground ahead simply stopped. Pebbles rattled away over an edge {they} could not see the bottom of. {^they} backed up very slowly, on hands and knees, until the heather was under {their} palms again."
      ],
      "effects": [
        {"op": "time", "min": 60},
        {"op": "meter", "spirits": -18, "energy": -8},
        {"op": "route", "do": "back_to_last_junction"}
      ],
      "modes": {
        "sierra": {
          "if": "lacks('map') && skill.nav == 0",
          "text": [
            "The ground ahead simply stopped, and so, in a way, did the story. The cloud kept the rest of it to itself."
          ],
          "effects": [{"op": "death", "cause": "fall_in_fog", "restore": "before_card"}]
        }
      }
    },
    "cloud_lifts": {
      "tier": "good",
      "text": [
        "The cloud thinned, tore, and slid off the ridge all at once like a sheet pulled from a bed. There was the trail, right where it had always been, and every lake in the basin shining."
      ],
      "effects": [
        {"op": "time", "min": 60},
        {"op": "weather", "set_visibility": "good"},
        {"op": "meter", "spirits": 10},
        {"op": "score", "joy": 4},
        {"op": "represent", "hide": ["wait"]}
      ]
    },
    "still_grey": {
      "tier": "ok",
      "text": ["An hour passed. The cloud breathed in and out, and the cold began to creep through {their} jacket."],
      "effects": [{"op": "time", "min": 60}, {"op": "meter", "warmth": "has('puffy') ? -3 : -10"}, {"op": "represent"}]
    },
    "went_back": {
      "tier": "ok",
      "text": [
        "{^they} turned around and followed {their} own footprints back to the last signpost, which had never looked so friendly."
      ],
      "effects": [
        {"op": "route", "do": "back_to_last_junction", "offer": "main_trail_alternative"},
        {"op": "score", "wisdom": 2}
      ]
    }
  },
  "meta": {
    "src": [
      "hazard:sol_duc_high_divide/fog_navigation",
      "hazard:sol_duc_high_divide/primitive_way_trails",
      "hazard:hoh_olympus/olympus_weather_whiteout"
    ],
    "notes": "wx.fog_lift_p_hour comes from the weather model's hourly fog persistence. The 'represent' effect shows the card again with used choices hidden; max_uses bounds the loop so the linter can prove it ends.",
    "status": "example"
  }
}
```

**What makes it multiply:**
- **Spend time to improve odds:** `map_compass` costs 10 minutes and re-presents the card with `card.bearing = true`, worth +8 plus 4 per nav skill level. This "prepare" pattern recurs across families: scout the ford, read the tide table, look at the map.
- Fail outcomes are spread by place data: `cliff_band` is weighted 12 where the segment has `steep_scree`/`cliff`, 3 elsewhere.
- `off_route_long` hands off to `fork.light_going` when dark is close, which chains into the bivouac family.
- `meadow_trampled` costs Leave No Trace points, because the meadows on the Divide really are that fragile.
- `wait` uses the weather model's hourly fog-lift probability, so its % is honest and changes by month and time of day.
- `walked_this_way` is a **system flag**: the movement module sets it when the segment was walked earlier in this trip, or in any past trip recorded in the profile. Experience pays off in the fog.


---

## 5. Narration composition

The research gives every node one vivid description. Cards give every moment two or three intros. That alone would repeat within a few trips. Composition turns a few thousand authored lines into text that rarely repeats and that remembers what happened.

### 5.1 Template syntax

Templates appear in every `text` field, pool line and choice label. A compiled template is an array of literal strings and slot closures.

| Syntax | Meaning | Example result |
|---|---|---|
| `{H}`, `{^H}` | Hiker's name, or "the hiker"; `^` capitalizes | "Mo" |
| `{they}` `{them}` `{their}` `{themself}`, `{^they}` | Party pronoun: solo uses the hiker's chosen pronoun, a party uses "they" | "she", "they" |
| `{v:was\|were}`, `{v:has\|have}` | Verb agreement with the party pronoun (singular, plural) | "was" |
| `{party}`, `{c1}`, `{c2}` | "Mo", "Mo and Sam"; companion names | "Mo and Sam" |
| `{place}`, `{river}`, `{headland}`, `{skyline}`, `{camp_name}`, `{nearest_camp_name}` | Names from the graph and scene recipe for the current context | "the Hoh", "Mount Olympus" |
| `{gear:tag}` | The display name of the item providing that tag | "the old green poncho" |
| `{n:expr}`, `{words:expr}`, `{words_minutes:expr}`, `{list:expr}` | Numbers as digits, as storybook words, as durations; a list of labels joined in prose | "4.5", "about four", "about two hours", "no pad, damp socks and a 40-degree bag" |
| `{path.words}` | Computed word fields | `{river.words}` gives "running high and loud" |
| `{~a\|b\|c}` | Random alternative (text RNG stream) | "wet slate" |
| `{?expr: A \| B}` | Conditional (no ternaries inside; the expression ends at the first `:`) | |
| `{@pool.id}` | One line from a pool (5.2), recursively composed | |
| `{echo:key}` | The latest remembered value for a memory key (5.4) | "the Hoh" |

The research descriptions are in present tense. The ingest step asks Claude to produce past-tense node text variants in `text/nodes/<region>.json` and keeps the original research prose as the source. The linter flags present-tense verbs in narration fields with a simple heuristic list.

### 5.2 Text pools with fallback

```json
{
  "id": "sky.dusk.clear.subalpine",
  "lines": [
    { "t": "The sky went from blue to the color of a robin's egg, and then to no color at all.", "w": 2 },
    { "t": "One star came out over {skyline}, then three, then too many to count." },
    { "t": "The snowfields kept a little light after the sky had let it go.", "if": "snow.on_ground" }
  ]
}
```

**Lookup falls back by dropping qualifiers from the right.** `sky.dusk.clear.subalpine`, then `sky.dusk.clear`, then `sky.dusk`, then `sky`. Authors write the general pool first and refine the places players visit most. The coverage report lists the pool keys that most often resolve to a fallback, and that list is the to-do list for writers.

### 5.3 Page composers

Composers are data recipes that assemble a page from slots, in priority order, under a character budget (storybook.md 2.2: 300 target, 420 hard maximum). `prio` 1 is the most important; when the budget is tight, the highest numbers drop first.

```json
{
  "compose.arrive_camp": [
    { "slot": "opener", "pool": "travel.opener.{leg.feel}",              "prio": 2 },
    { "slot": "place",  "src": "node_text",                              "prio": 1 },
    { "slot": "sky",    "pool": "sky.{time.tod}.{wx.sky}.{here.band}",    "prio": 4 },
    { "slot": "body",   "pool": "body.low.{state.lowest_meter}",          "prio": 2, "if": "state.lowest < 35" },
    { "slot": "echo",   "pool": "echo.wet",                               "prio": 3, "if": "echo('wet_from') && state.wet >= 30" },
    { "slot": "friend", "pool": "companion.arrive.{c1.trait}",           "prio": 5, "if": "party.size >= 2" },
    { "slot": "fore",   "src": "queued_foreshadow",                       "prio": 1 }
  ]
}
```

| Composer | Used for |
|---|---|
| `compose.depart` | Morning departures: weather now, the day's plan in one line, how the body feels |
| `compose.leg` | Trail pages without a card: terrain, sounds, small discoveries (ambient one-tap cards) |
| `compose.arrive_node` / `compose.arrive_camp` | Arrivals |
| `compose.camp_chores` | Chore-grid results (water, dinner, tent, hang out the wet socks) |
| `compose.night` | Night page, ending with the region's refrain (storybook.md 2.1) |
| `compose.epilogue` | The back cover: highlights, troubles, Field Notes ("next time"), journal additions |

`leg.feel` is a summary of how the leg went (`easy_stroll`, `long_climb`, `wet_slog`, `late_and_tired`, `hot_and_dry`), computed from the movement model. It is what makes an arrival line follow from the walk before it.

### 5.4 Echoes and the causality log

Every effect records its cause chain (`cause: [choice a3 at beat 9, card ford.braided_river]`). Two things read it:
- **Echo pools** quote it in passing: *"Her socks were still damp from {echo:wet_from}."*
- **The epilogue's Field Notes** (simulation.md 8.8) aggregate it. They sum the signed `why` labels that hurt across the trip ("Without trekking poles, two fords were harder: -10% each") and turn the top three into "next time" tips.

The tips are generated, not authored per trip, so they are always about *this* trip.

### 5.5 Anti-repetition

- **Within a trip,** a pool line or card intro is not reused until its pool is exhausted (per-pool LRU).
- **Across trips,** the profile keeps the ids of lines and cards seen in the last three trips. Their weights are multiplied by 0.3 (cards) and 0.2 (lines).
- **Determinism is kept.** The text stream is keyed by `(beat, slot)` (7.3), so reloading a save shows the same words.

### 5.6 Worked example: arriving at Glacier Meadows

Inputs: `leg.feel = long_climb`, `time.tod = golden`, `wx.sky = partly`, `here.band = subalpine`, memory `wet_from = "the Hoh"` with `state.wet = 45`, hiker "Mo" (they), solo, a queued foreshadow from the cold-night model.

> The last switchback gave up at last, and the trail stepped out of the trees. Subalpine firs stood about in little clusters on a meadow of heather and late snow, and the air smelled, finally, of ice. Mo's socks were still damp from the Hoh, and they were thinking mostly about dry ones. Above the moraine the sky was already going thin and cold.

The four sentences come from four sources: `travel.opener.long_climb`, the node's past-tense text variant, `echo.wet`, and the night model's foreshadow pool `fore.cold_night.clear`. The `sky` slot was dropped to stay under 420 characters. None of the four is unique to Glacier Meadows except the second, yet the paragraph reads as written for this moment.

---

## 6. Combinatorics: how a modest library makes "lots and lots"

### 6.1 The multipliers

| Layer | v1.0 size | What it multiplies |
|---|---|---|
| Places with beat slots (nodes + directed segments) | about 500 | Where cards can fire; place text; scenes |
| Months | 5 playable (June to October), plus shoulder months with warnings | Snow on trail, river levels, daylight, bugs, berries, bears, quotas |
| Weather | 8 daily states; about 4,000 four-day sequences, about 300 common | Card eligibility, odds, night margins, fog, the forecast-vs-actual gap |
| Time of day | 7 bands | Card eligibility, palettes, dark modifiers |
| Loadouts | about 40 tags plus continuous stats; the harness sees **200-400 behaviorally distinct tag profiles** | Odds on every roll, which choices exist at all, which chains trigger |
| Party | solo, or 1-3 companions (optional, M6) | Huddle and crossing bonuses, companion lines |
| Cards | about 260 | Moments |
| Choices x outcomes | about 2.8 x 2.4 | About 1,700 card-level resolutions in v1.0 |
| Text | 2-3 intros per card, pools with fallback, slot fills, echoes | Surface variety |
| History | flags (5 scopes), queue, memory, region flags, skills | Correlation across a trip and across trips |

### 6.2 The plan space (computed from real data)

Planning is itself a source of variety. Counting only **out-and-back itineraries on the main Hoh River Trail** from the 15 real camps in `hoh_olympus.json` (trailhead mileages 0.9 to 17.4), with layovers allowed and no day over the stated limit:

| Nights | Sensible itineraries (<= 16 mi/day) | Gentle itineraries (<= 12 mi/day) |
|---|---|---|
| 1 | 14 | 8 |
| 2 | 196 | 64 |
| 3 | 2,094 | 642 |
| 4 | 17,538 | 6,252 |
| 5 | 120,511 | 51,981 |
| **1-5 total** | **about 140,000** | **about 59,000** |

Many of these are near-twins (the 13.1, 13.2 and 13.3 mile sites). Even collapsed to distinct camp *areas*, thousands remain, before adding Hoh Lake, side trips, months, pace and party. With the loops, traverses and 45 trailheads of the full park, the plan space alone is in the millions.

### 6.3 Per-beat branching and "distinct moments"

A 3-night trip has about 22 pages with a choice, about 12 of them **notable** (hazard, encounter, crisis, chain). At a notable slot the director picks one card from the eligible pool, the player picks one of about 2.8 choices, and the dice pick one of about 2.4 outcomes. Even with uneven weights, the effective branching (the exponential of the per-beat entropy) is around 25. Over 12 notable beats that gives about 25^12, or 6 x 10^16 raw paths per itinerary. **Raw path counts are effectively infinite and therefore meaningless as a goal.**

A more useful count is **distinct moments**: card x place x choice x outcome x context class.
- About 1,700 resolutions.
- Generic cards are eligible at about 40 places on average.
- About 36 context classes: 3 weather classes x 3 light classes x 4 gear buckets that change the odds.

That gives about 2.4 million combinations on paper. If only about 10% are reachable in practice, that is still about **250,000 distinct moments** in v1.0. "Tens of thousands of paths" is comfortably met by a library of about 100 cards. The real design problem is **perceived** variety.

### 6.4 What "distinct" should mean: four measured targets

The simulation harness (section 9.4) measures these per edition. They are CI gates from v1.0 on.

| Metric | Definition | Target |
|---|---|---|
| **Story-signature uniqueness** | Signature = ordered `(card, choice, outcome)` for notable cards, plus the ending. Measured over 10,000 runs of a classic template with the standard loadout and policy mix. | >= 90% unique for 2+ nights; >= 50% for day hikes |
| **Ending headlines** | `(ending type, proximate cause, place bucket, day)` such as "walked out early, cold night, Glacier Meadows, day 2" | >= 25 headlines at >= 0.5% frequency per multi-night template; >= 1,500 park-wide |
| **Repeat rate** | Expected notable cards shared by two consecutive trips on the same template and loadout | <= 2 of about 12 |
| **Pack sensitivity** | Change in the ending distribution (total variation distance) when one meaningful tag is removed from a sensible loadout | >= 0.05 on at least one template for every tag (section 9.4) |

### 6.5 The coverage matrix

The **coverage matrix** turns "lots of outcomes" into a writing assignment. Cells are region x season bucket (early: June-July, peak: August-September, late: October) x weather class (fair, wet, cold or snow, fog). For v1.0 that is 3 x 3 x 4 = 36 cells.

**Each cell needs at least 32 eligible notable cards**, plus 24 discovery or joy cards and 6 night cards, along the region's classic routes.

Why 32: if a trip draws k = 8 non-forced notable cards from n eligible, the expected overlap between two trips is about k^2/n. At n = 32 that is 2 cards, and novelty weighting (x0.3 for recently seen cards) brings it to about 1.

Generic archetypes fill most of every cell (fords in every valley, showers wherever it rains). Place cards supply personality where the player will remember it (the ladder, the High Hoh Bridge, Heart Lake, Royal Basin's moraine).

```
coverage  hoh_olympus      fair  wet  cold  fog
  early (Jun-Jul)            41   38    22*  19*      * = under 32: writing assignment
  peak  (Aug-Sep)            47   36    17*  21*
  late  (Oct)                29*  35    26*  14*
```

(Illustrative output of `tools/coverage.mjs`.)

### 6.6 Content volume targets

| Content | M1 slice (Hoh) | v1.0 (three must-haves) | Full park |
|---|---|---|---|
| Regions | 1 (Hoh valley to Blue Glacier) | 3 (Hoh, Sol Duc/High Divide, Royal Basin and its neighbors) | 6 |
| Compiled nodes | about 35 | about 170 | about 600 |
| Directed segments | about 70 | about 340 | about 1,400 |
| Trailheads | 1 | 5 | about 45 |
| Trip templates | 8 | 30 | about 120 |
| Generic archetype cards | 55 | 140 | 220 |
| Place cards and patches | 25 | 80 | 300 |
| Chain, fork, crisis, finale and epilogue cards | 15 | 40 | 80 |
| **Total cards** | **about 95** | **about 260** | **about 600** |
| Choices (about 2.8 per card) | about 265 | about 730 | about 1,700 |
| Text pools / lines | 60 / 450 | 150 / 1,500 | 300 / 4,000 |
| Node text variants | 35 x 3 | 170 x 3 | 600 x 2-4 |
| Base biome pictures | 6 | 12 | 20 |
| Skylines and landmark overlays | 10 | 35 | 110 |
| Stamps and sprites | 25 | 50 | 80 |
| Tall plates | 3 | 6 | 12 |
| Gear / food items | 60 / 35 | 100 / 60 | 130 / 80 |
| Field guide entries | 25 | 60 | 104 |
| Stores / drive routes | 1 / 2 | 3 / 8 | 6 / about 45 |
| Simulation assertions | 15 | 60 | 200 |
| Edition size (gzip) | about 150 KB | about 400 KB | about 1 MB |

---

## 7. Runtime systems

### 7.1 The phase state machine

```
            ┌───────────┐  new book   ┌──────────────────────── PLAN ─────────────────────────┐
  TITLE ───►│ BOOKSHELF ├────────────►│ park map ▸ trailhead ▸ day/overnight, nights, layovers │
            └─────┬─────┘             │ ▸ itinerary (camps, loop direction) ▸ PERMIT           │
                  │ continue          │   (quota roll, ranger advice, forecast)                │
                  ▼                   └───────────────────────────┬────────────────────────────┘
            (load save ▸ resume)                                  ▼
                                          STORE (town, list, cart, budget)  ◄──┐ "back to the store"
                                                                  ▼            │
                                          PACK (spread, fit, weight) ──────────┘
                                                                  ▼
                                          DRIVE (road pages, road cards, diner, last-chance store)
                                                                  ▼
                                          TRAILHEAD (last look: car stash, permit check, start)
                                                                  ▼
                    ┌────────────────────────── TRAIL LOOP ───────────────────────────┐
                    │  MORNING ▸ DEPART ▸ LEG (slots) ▸ ARRIVE ▸ (next leg ...)         │
                    │     ▲                                     │                       │
                    │   NIGHT ◄──── CAMP (evening, chores, sunset) ◄──┘                 │
                    │  LAYOVER days replace DEPART/LEG with side-trip and camp slots   │
                    └────────┬──────────────────┬──────────────────────┬───────────────┘
                     reached exit         end_trip                 death (Sierra only)
                             │         (walk out / ranger / rescue)   ▸ RESTORE point or restart
                             ▼                  ▼
                       EPILOGUE: The End ▸ Field Notes ▸ back cover ▸ journal ▸ BOOKSHELF
```

- Each phase module exports `enter(state) -> page`, `accepts` (action types), `step(state, action) -> {state, page}` and `exits` (guarded transitions).
- Phases are data-light code. What happens *inside* a phase comes from content (cards with `trigger: drive`, `store`, `trailhead`).
- **Back navigation** is free during planning, store and pack (it is planning, after all). It ends at "Start hiking". After that, only Sierra `restore` goes back.
- The **car stash** at the trailhead and the **last-chance store** on the drive are the only post-planning chances to change the pack, which matches real trips (simulation.md 6.8).

### 7.2 The trail loop and the beat scheduler

At DEPART the movement model (simulation.md 5) computes the day's legs, times and ETA against dark. The scheduler then lays out the day's **slots**:

```
for each segment on today's route:
    slots = seg.slots (0-2 mid-segment, by hiking time)
    for each node reached:  arrival slot if the node has feature tags or on_arrive cards
camp:      arrive_camp ▸ chores (1-2 choices) ▸ evening (sunset/encounters) ▸ night ▸ morning
```

Each slot is filled in this order:
1. Forced items: due queue items, crisis watchers (a meter crossed a threshold), forks (ETA after dark, closed trail, no permitted camp reachable), `priority: forced` cards.
2. Otherwise the **director** (simulation.md 8.4-8.5) draws from `index[trigger][place]` under the day's decision budget, quiet ratio, gap bias and novelty.
3. Otherwise an **ambient page** from a composer, or the slot is skipped. The *Page density* setting (Short, Storybook, Long) decides how many ambient pages appear, from about 8 to about 20 per day.

**Party.** State holds `party[]` from day one, each member with their own meters, but M1 ships solo. Companions (M6) add `{c1}` text, traits that act as tags (`party.any_trait('cook')`), shared group gear, and huddle and crossing bonuses. Because the engine is party-ready, companions are a content and UI milestone, not a rewrite.

### 7.3 Seeded RNG, streams and trip codes

**Generator.** `sfc32` (128-bit state, 32-bit integer operations, fast in JS, a well-tested small PRNG), seeded through `cyrb128` string hashing. `Math.random` is banned in `engine/`. A unit test replaces it with a function that throws.

**Keyed draws.** Instead of one long sequence, every draw comes from a short generator seeded by `hash(tripSeed, stream, ...key)`:

| Stream | Key | Used for |
|---|---|---|
| `weather` | day | Daily weather sequence, generated at trip start for every day, so forecast vs. actual is fixed |
| `env` | day, river or tide id | River noise, fog persistence |
| `permit` | night, camp | Quota availability during planning |
| `director` | beat | Which card fills a slot, quiet vs. eventful |
| `roll` | beat, card, choice, k | Outcome rolls |
| `effect` | beat, card, outcome, op index | `chance` on effect ops |
| `text` | beat, slot | Variant picks |
| `art` | scene id (not the trip seed) | Prop placement: a place looks the same on every trip |
| `store` | trip | Daily specials, shopkeeper quips |

This buys four things:
- (a) Editing text or art never changes outcomes.
- (b) Adding a card changes only the slots where it is eligible.
- (c) **Reloading and making the same choice gives the same result**, which defeats save-scumming without locking saves. Making a different choice gives a different, equally honest roll.
- (d) Bugs reproduce exactly from `(edition, seed, plan, actions)`.

**Trip codes and sharing.**
- **Short code:** `HOH4-K7QM-2Q9F` = a trip template plus 40 bits of seed, in Crockford base32. Easy to read aloud.
- **Share link:** `.../104-boyz/#trip=<base64url({seed, plan, edition})>`. A plan is about 300 bytes.
- **What sharing means:** "Same mountain, same weather, your own pack." The receiver plans nothing, shops and packs for themselves, and gets the same weather, permit luck and director seed. Their trip diverges as their pack and choices diverge, which is the interesting comparison.
- **Optional "trail of the day":** the seed comes from the date, so everyone who plays it that day gets the same weather. It suits a group of friends comparing endings, if that is what "104-boyz" is.

### 7.4 Save and load

| Key (localStorage) | Holds | Size |
|---|---|---|
| `oph.profile` | settings, journal and sketches (as picture-op references, not pixels), skills, region flags, bookshelf of finished-trip summaries, recently seen cards and lines | 20-80 KB |
| `oph.slot.auto` | the trip in progress, rewritten after every page | 15-40 KB |
| `oph.slot.1` to `oph.slot.3` | manual slots ("bookmarks") | 15-40 KB each |

```json
{
  "format": 3, "edition": "e2026.10-7f3a9c", "savedAt": "2026-10-08T19:22:05Z",
  "summary": { "title": "Mo's Hoh book", "place": "Elk Lake", "day": 2, "picture": "elk_lake" },
  "seed": "K7QM2Q9F", "plan": { "...": "..." },
  "actions": [["plan", "..."], ["buy", "poles_alu", 1], ["choose", "p118", "wade"]],
  "snapshot": { "...": "TripState at the last page" },
  "restore_points": [{ "kind": "last_camp", "beat": 31, "snapshot": "..." }]
}
```

- **Writes** happen after every page turn (one synchronous `setItem` of about 30 KB, a few milliseconds), inside `try/catch`. On a quota error, old bookshelf thumbnails are pruned and a gentle note appears.
- **Loads** hydrate the snapshot directly when the edition matches. Otherwise `migrate(snapshot, format)` runs, queue items or cards that no longer exist are dropped and logged, and the trip continues **from the snapshot**. Action-log replay is only used where the edition is exact: golden tests and bug repro.
- **Restore points** for Sierra mode are a ring buffer of 5 snapshots: each morning, each camp, and just before every `sierra_moment` card.
- **iOS realities** (they shape the UI):
  - Safari may clear a website's script-writable storage (localStorage, IndexedDB, service-worker caches) after about 7 days of browser use without visiting the site. Home Screen web apps keep their own storage, tied to their own use. **Recommend installing to the Home Screen**, and say why on the first title page.
  - Home Screen app storage is **separate from Safari's**. A trip started in a Safari tab will not appear in the installed app. Prompt for installation *before* the first save.
  - **Export and Import:** a save or profile becomes a code (base64url, compressed with `CompressionStream` where supported) shared through `navigator.share` as a small file or copied to the clipboard. Import accepts a paste or a file. This also moves a journal between phones.
  - Call `navigator.storage.persist()` where it exists, and never depend on it.

### 7.5 PWA and offline at the trailhead

- **`manifest.webmanifest`:** `name` "Olympic Peninsula Hiker", `short_name` "Hiker", `start_url` "./?pwa=1", `scope` "./", `display` "standalone", `orientation` "portrait", black `background_color` and `theme_color`, and icons 192, 512 and 512 maskable.
- **`index.html` head:**
  - `viewport` with `width=device-width, initial-scale=1, viewport-fit=cover`;
  - `apple-touch-icon` (180 px);
  - `apple-mobile-web-app-status-bar-style` = `black-translucent`;
  - `theme-color`.
  - iOS ignores manifest `orientation`, so landscape shows the portrait column centered, with a "turn me upright" hint on very short screens.
- **`sw.js`** sits in the site root, so its scope is the whole project site (`/104-boyz/`):
  - **install:** fetch `precache.json`, generated at deploy with every URL and its content hash (budget under 5 MB). Then `cache.addAll` into `oph-<editionHash>`, using `new Request(url, {cache: 'reload'})` so GitHub Pages' 10-minute HTTP cache cannot slip a stale file into a new edition.
  - **activate:** delete other `oph-*` caches, then `clients.claim()`.
  - **fetch:** same-origin GETs are cache-first. Navigations fall back to the cached `index.html`. `version.json` is network-first with a 3-second timeout, which is how updates are noticed.
  - **update:** the new worker installs in the background and **waits**. Only the title or bookshelf page says "A new edition of the book has arrived. Open it?" Accepting posts `skipWaiting` and reloads. A trip is never swapped mid-page, and saves migrate (7.4).
- **"This book works offline" stamp.** The title page asks the worker whether precaching finished and shows a small stamp when it has. It teaches players to open the game once at home, before they lose signal on the Upper Hoh Road.
- **CI check.** A static test confirms that `precache.json` covers every URL referenced from `index.html`, the module graph, the edition, fonts and icons. iOS cannot run in CI, so this is the next best thing.
- **GitHub Pages specifics:**
  - The project site lives at `https://fernforager.github.io/104-boyz/`, so every URL is relative.
  - Routing uses only `#`, so no 404 tricks are needed.
  - HTTPS is automatic, and service workers require it.
  - Pages from Actions on a **private** repo needs a paid plan (Open Question 1).

### 7.6 The canvas vector-picture interpreter

This implements storybook.md's art direction. That document defines the look and the command set; this section defines the machine.

- **Authoring format:** `.pic` text (commands C, L, R, F, D, B, S, T, Z, @). The build compiles it to compact numeric op arrays (about 1-2 KB per picture), so the runtime does no parsing.
- **Buffers:** one `Uint8Array(160*168)` per layer (sky, far, mid, near, sprites, weather), with 255 meaning transparent. Values 0-15 are EGA colors and 16-23 are the pseudo-colors that cycle.
- **Ops:**
  - set color;
  - absolute and relative polylines (Bresenham, AGI-style endpoints);
  - **scanline flood fill** with an explicit stack, replacing the contiguous region of the seed's value *within the current layer*, writing a solid color or a dither `pattern(x, y)`;
  - brush plot (shapes and sizes from AGI pen patterns);
  - stamp call (sub-picture with offset and flip, recursion depth at most 4);
  - hotspot record;
  - layer select.
  - Fills cannot leak across layers by construction, which removes the classic AGI headache.
- **Composite and present:**
  - Layers composite in painter's order into an index buffer.
  - At blit time a **palette remap** (time of day, weather; storybook.md 6.6) plus the cycle tables map indices to RGBA through a `Uint32Array` lookup into a 160x168 `ImageData` on a small offscreen canvas.
  - One `drawImage` call scales it onto the visible canvas with `imageSmoothingEnabled = false` at integer device-pixel scales `sx` x `sy` (storybook.md 6.2).
  - The visible canvas's backing store is exactly `160*sx` x `168*sy` device pixels, and its CSS size is that divided by `devicePixelRatio`, so every fat pixel lands on device-pixel boundaries without relying on CSS `image-rendering`.
- **Palette cycling.** At composite time, record the indices of pixels holding pseudo-colors. Each 8 fps tick rewrites only those entries in the `Uint32Array` view, then does one `putImageData` and one `drawImage`. That is well under a millisecond, and cycling stops when the page is static, hidden, or Reduce Motion is on.
- **Draw-in.** Ops run in time slices (outlines first, then fills, layer by layer) over about 800 ms, blitting each frame. A tap finishes instantly.
- **Sketch mode (the homage).** Re-run only the scene's line ops, skipping fills and dithers, in pencil gray on paper white, with plus or minus 1 px jitter from the `art` stream so it looks hand-drawn. The journal stores the recipe reference and parameters, not pixels, so a sketch costs about 100 bytes.
- **Cache.** An LRU of composited index buffers keyed by recipe and overlay hash (27 KB each, 24 entries, about 650 KB). Palette changes do not invalidate it because remaps apply at blit.
- **Hotspots.** Tap coordinates map to picture coordinates through `sx`, `sy` and the canvas rect, then to a hotspot id, then to a "look" line from `look.<scene>.<hotspot>`. Hotspots are optional extras, never required to progress.
- **Headless rendering.** The same `picvm.js` and `compose.js` run in Node:
  - `tools/render-pics.mjs` writes PNGs (a 60-line encoder on `node:zlib`) at 4x nearest-neighbor, in any palette.
  - It also writes contact sheets per region and per time of day.
  - **Claude can open the PNGs with its image-reading tool and critique its own pictures.** Without this loop, AI-authored vector art is drawn blind. With it, art is iterable like code.
- **Picture lint.** Unknown stamps; coordinates out of bounds; a fill covering more than 60% of a non-sky layer (usually an unclosed outline); stamps recursing too deep; hotspots off the canvas; pictures over the op budget.

### 7.7 Text layout

- **Text is DOM; only the picture is canvas.** This gives VoiceOver narration and real `<button>` choices, crisp type at any pixel ratio, native line breaking and a text-size setting (S, M, L). The Sierra box is CSS: white panel, EGA-colored double border.
- **Font.** An open-licensed (OFL) pixel-style font, self-hosted as woff2 (20-40 KB) and preloaded. Body text is at least 16 CSS px. The one text input, the hiker's name, uses 16 px so iOS does not zoom.
- **Fit.**
  - The composer budgets characters (5.3).
  - The UI then measures the real height. If text would overflow, it splits at a sentence boundary into a "more ▸" continuation rather than scrolling.
  - The linter checks every text variant against a metrics model: the font's advance widths extracted at build, at the narrowest supported width (375 pt) and size M.
- **Odds on buttons.** `[ Wade across · 74% ]`, with a small "why" affordance that opens a bottom sheet listing the labeled modifiers and the "if it goes wrong" shares.
- **Optional typewriter reveal.** A tap completes it. No timers ever gate a decision.

### 7.8 Touch input

- **Pointer events everywhere.**
  - The app root uses `touch-action: manipulation` (no double-tap zoom delay).
  - Game chrome uses `user-select: none` and `-webkit-touch-callout: none`, except Field Notes, which can be copied.
- **Targets:**
  - at least 44 x 44 pt everywhere;
  - choices are full-width, 52 pt tall, stacked in the thumb zone above the bottom safe area.
- **Swipe to turn the page** works on the text area with a 40 px threshold. It ignores touches that start within 24 px of the screen edge (Safari's back gesture in browser mode). It is always duplicated by a button.
- **No rubber-banding:**
  - `html, body { height: 100%; overflow: hidden; overscroll-behavior: none }`;
  - only explicit panes scroll (store list, pack list, journal).
- **Layout:** `100dvh` plus `env(safe-area-inset-*)` padding. Long-press is an accelerator (the "why" sheet), never the only path. There are no hover states, and `:active` feedback appears within 50 ms.
- **No keyboard.** The only typing is the optional hiker name, which defaults to "the hiker".

### 7.9 Sound

Optional square-wave beeps and the page-turn tick (storybook.md section 9) use Web Audio. The context is created and resumed on the first tap, as iOS requires. Sound is off until enabled, and the game is fully playable silent.

### 7.10 Debug overlay and error reporting

The user tests on an iPhone and reports to Claude. That loop needs to be short.

- **`?debug=1`** (or five taps on the version stamp) opens an overlay with: edition, seed, phase, beat, the current card id with its full odds breakdown, the last 20 actions, frame time, storage use, and a **"Copy bug report"** button. The button copies JSON with edition, seed, plan, actions, user agent and any error stacks. Pasted into a Claude session, `tools/play.mjs --replay bug.json` reproduces the trip exactly.
- **Global `error` and `unhandledrejection` handlers** show a friendly "A page got torn" sheet with "Copy details" and "Go back one page" (restore the last snapshot). The game should never white-screen.
- **Playtest notes.** In debug mode a "Note" button attaches a comment to the current page id. Notes export as JSON for Claude to triage.

---

## 8. Tech stack and repo layout

### 8.1 Decision: plain ES modules, no bundler, JSDoc types checked in CI

| Criterion | **Plain ES modules + JSDoc + `tsc --checkJs`** (chosen) | Vite + TypeScript |
|---|---|---|
| What runs on the phone | Exactly the files in the repo | A transpiled bundle (with source maps) |
| Reuse in the Node harness | `import` the same files directly | Needs `tsx` or a second build for Node. Node 23's type stripping helps Node, but the browser still needs a build. |
| Things that can break | Nothing at runtime. `tsc` runs only in CI. | `node_modules`, Vite config, plugins, version drift |
| Claude's loop | Edit, push, Pages (about 1-2 minutes), or a local static server | The same, plus build errors to debug |
| Type safety | Good: strict `checkJs` with JSDoc typedefs; content types generated from JSON Schema | Best |
| Hot reload | No. A page-based game reloads in under a second, and saves restore the page. | Yes |
| Requests on first load | About 50 modules over HTTP/2, with a generated `modulepreload` list; service-worker cached afterwards | 1-3 bundles |
| Debugging on iPhone | Safari Web Inspector and the in-game error sheet show real `file:line` | Through source maps |

**Why this fits this project:**
- **Claude writes the code.** Every extra toolchain layer is a new way for a session to fail on something other than the game.
- **The user tests on an iPhone.** What they run should be what is in the repo, and a pasted stack trace should point at a real line.
- **Determinism and the harness both depend on Node importing the exact browser modules.**
- **The escape hatch is cheap.** If first-load time ever matters, add one `esbuild` bundling command to the deploy job. No source changes are needed.

**Other choices:**
- **No UI framework.** About 14 screen types, page-based, with no complex reactive state. A 40-line `h()` DOM helper and per-screen render functions are enough.
- **Zero runtime dependencies**, so nothing to update, audit or lose offline.
- **Dev dependencies:** `typescript` (type-check only). Everything else uses Node 22 built-ins: `node --test`, `node:zlib` for PNG, `worker_threads` for the harness, `fetch`.
- **JSON Schema validation** uses a small in-repo validator for the subset we use (about 250 lines), avoiding a dependency. Adding `ajv` as a dev dependency is acceptable if the subset grows.

### 8.2 Repo layout

```
104-boyz/
  README.md                      how to play, how to install to the Home Screen, how to develop
  package.json                   "type": "module"; scripts: build, lint, typecheck, test, sim, bench, play, render, serve
  jsconfig.json                  checkJs, strict, noEmit
  .github/workflows/
    pages.yml                    build ▸ lint ▸ typecheck ▸ test ▸ sim:smoke ▸ deploy (main + /preview/)
    nightly.yml                  sim:full + coverage + balance report artifacts
  design/                        research and proposals (not deployed)
    data/regions/*.json, park_rules.json, gear_catalog.json, food_catalog.json
    proposals/*.md
  schemas/                       JSON Schemas + vars.json (expression variables, types, ranges)
  content/                       the game's content (section 3.1)
  web/                           deployable runtime, served as-is in dev
    index.html
    manifest.webmanifest
    sw.js
    version.json                 (written at deploy)
    icons/  fonts/  css/game.css
    js/
      main.js                    boot: register SW, load edition, restore autosave, start UI
      engine/                    PURE (no DOM). Imported by tools/ and test/ as-is.
        rng.js  expr.js  template.js  content.js  index.js
        plan.js  permit.js  pack.js  weather.js  movement.js  body.js  tides.js
        director.js  cards.js  effects.js  queue.js  memory.js
        narrator.js  compose.js  score.js  phases/*.js  save.js  migrate.js
      gfx/       picvm.js  compose.js  palette.js  display.js  sketch.js
      ui/        app.js  h.js  page.js  textbox.js  choices.js  oddsheet.js  mapview.js
                 store.js  packspread.js  journal.js  settings.js  debug.js  errors.js
      platform/  storage.js  sw-client.js  share.js  audio.js
  tools/
    ingest.mjs                   design/data/regions ▸ content/park/regions + ingest report
    build.mjs                    content ▸ dist/data/edition.<hash>.json; pics; precache.json; copy web/
    lint.mjs                     section 9.2 rules; --fix for safe mechanical fixes
    coverage.mjs                 coverage matrix and pool-fallback report
    bench.mjs                    card bench (9.3)
    sim.mjs  tune.mjs            Monte Carlo harness and auto-tuner (9.4, 9.6)
    play.mjs                     scripted or bot playthrough ▸ text/HTML transcript; --replay bug.json
    render-pics.mjs              .pic ▸ PNG and contact sheets
    review-book.mjs              HTML review book for a content batch (10.6)
    new-card.mjs                 scaffold a card from a hazard id or family
    serve.mjs                    static dev server; compiles the edition on request
  sims/
    matrix.v1.json               templates x months x loadouts x policies
    loadouts/*.json              archetype and ablation loadouts
    assertions/*.json            scenario expectations (many generated from research)
  test/
    unit/*.test.mjs              rng, expr, template, picvm, routing, effects, save/migrate
    fixtures/edition-mini/       a tiny frozen edition for engine golden tests
    golden/*.json                replays: (fixture or live edition, seed, plan, actions) ▸ expected hash + transcript
  dist/                          build output (git-ignored); what Pages serves
```

### 8.3 Deploy pipeline (GitHub Actions to Pages)

```
on: push to main or preview; workflow_dispatch
build (ubuntu, node 22):
  npm ci                     # typescript only
  npm run build              # ingest check ▸ edition ▸ pics ▸ precache ▸ dist/
  npm run lint               # any error fails the deploy
  npm run typecheck          # tsc --noEmit
  npm test                   # node --test (unit + engine goldens)
  npm run sim:smoke          # 2,000 trips across all templates: zero crashes, zero dead ends,
                             # zero stuck states, odds calibration within ±3 points
  assemble site: main build at /, latest preview-branch build at /preview/
  upload-pages-artifact
deploy: actions/deploy-pages
nightly: sim:full (100k+ trips), coverage, balance diff vs. last edition, uploaded as artifacts
```

The `/preview/` folder has its own service-worker scope and cache, so the user can keep a "stable" and a "preview" icon on the Home Screen.

### 8.4 The dev loop

1. Claude edits content or code, runs `npm run lint && npm test && npm run sim:smoke` locally, reads the reports, and renders and reads PNGs and transcripts.
2. Push to `preview`. About 1-2 minutes later the preview icon on the iPhone shows "A new edition has arrived". The user plays and copies bug reports or notes from the debug overlay.
3. Merge to `main` when it feels right.

A local server (`node tools/serve.mjs`) also works from an iPhone on the same Wi-Fi. Service workers do not register over plain `http://`, but everything else runs, which is fine for layout checks.

---

## 9. Testing and balancing

Five layers, from cheapest to richest: unit tests, the content linter, the card bench, the simulation harness, and golden replays with readable transcripts. Then a short device checklist, because no harness runs Safari on an iPhone.

### 9.1 Unit tests (`node --test`)

- `rng`: known-answer vectors; stream independence; keyed draws stable across runs.
- `expr`: parser round-trips, precedence, type errors, every whitelisted function, no access outside declared vars.
- `template`: slots, agreement, conditionals, nesting, pool fallback.
- `picvm`: golden pixel hashes for a dozen test pictures (fills, dithers, stamps, flips, layers).
- `plan`: routing on fixture graphs (loops, one-way segments, closures), permit validation.
- `effects` and `queue`: every op type, due-time semantics, `represent` bounds.
- `save`: write, read and migrate from every past format. Fixtures of old saves are kept forever.
- An engine-purity test: importing `engine/` in Node with `document`, `window` and `Math.random` replaced by throwing stubs must succeed, and running a trip must not touch them.

### 9.2 The content linter

Run on every build. **Errors** block the deploy, **warnings** go in the report. The rules:

| Code | Rule |
|---|---|
| **References** | |
| R01 | Duplicate ids (cards, outcomes, pools, items, nodes, scenes) |
| R02 | Unknown node or segment id anywhere (cards, recipes, templates, conditions, hazards) |
| R03 | Unknown card id in `page`, `queue`, `extends`, `table_ref` |
| R04 | Unknown pool id or composer |
| R05 | Unknown variable, tag or function in an expression (checked against `schemas/vars.json`) |
| R06 | Unknown item or food id in stores, loadouts or effects |
| R07 | Unknown picture, stamp, sprite or overlay |
| **Park graph** | |
| G01 | Segment endpoints exist after the cross-region merge |
| G02 | Every trailhead reaches at least one legal camp, and every camp is reachable from some trailhead |
| G03 | Miles > 0; gain and loss >= 0; the elevation check `|elev(to) - elev(from) - (gain - loss)| <= 100 ft + 10%` (warning) |
| G04 | Cross-region duplicate nodes agree within tolerance (warning with both values) |
| G05 | Every node and segment resolves to a scene recipe |
| G06 | Every trip template routes, and its nights match its itinerary |
| G07 | Snow windows parsed for every segment above 3,500 ft |
| G08 | Conditions items reference valid ids and dates |
| **Cards** | |
| C01 | Schema-valid |
| C02 | Expressions parse and type-check |
| C03 | Facets satisfiable: the card has at least one place in the index for its trigger (**reachability**) |
| C04 | `if` satisfiable: sampled states x tag profiles x months find at least one context where the card can fire. Otherwise the error is "never fires". |
| C05 | **No dead ends:** in every sampled context where the card can fire, at least one choice is visible and enabled |
| C06 | Every choice resolves to existing outcomes, and every outcome is reachable from some choice |
| C07 | **Ranges:** fuzzed `p` stays within `[0, 100]` after clamp, and raw values outside `[-100, 200]` warn. Table weights are >= 0 with a positive sum in every sample. A clamp active in more than 90% of samples warns ("this roll is not really a roll"). |
| C08 | `represent` loops are bounded: every re-presented choice has `max_uses` or is in `hide`, and some exit choice is always available |
| C09 | The chain graph (page, queue, flags) terminates: no cycle without a bounded guard, and queue depth stays at 3 or less |
| C10 | `queue.at` is meaningful for the target card's trigger (no `camp_evening` queue into a `drive` card) |
| C11 | Route effects target nodes reachable from the card's possible places |
| C12 | Flags that are read are set somewhere (error); flags set but never read (warning). Region and meta flags must be declared in `flags.json`. |
| C13 | **Mode safety:** `death` only inside `modes.sierra`; every Sierra override has a base outcome; `sierra_moment` is set exactly on outcomes with a death override |
| C14 | **Honest odds:** a choice with `then` (no roll) cannot declare `odds: show`; every check has at least one `why` label or is marked `odds: words` |
| C15 | `meta.src` is present on hazard and place cards and points at research ids or URLs |
| C16 | `extends` targets exist and patch paths are valid; `tunable` paths exist |
| **Text** | |
| T01 | Slots resolvable in the card's trigger context (`{river}` needs a ford segment; `{c1}` needs a `party.size >= 2` guard; `{headland}` needs a coast segment) |
| T02 | Length: every variant fits its page budget at 375 pt width, size M, using font metrics |
| T03 | Names: no real private businesses (deny-list from research), no real people, fictional names only for stores, outfitters and diners |
| T04 | Homage guard: no title, character names or phrases from *The Golden Glow* outside the colophon (a short deny-list), and no "Fox the collector" protagonist |
| T05 | Storybook-mode text (outside `modes.sierra`) contains no death words (die, dead, drowned, killed ...) except allow-listed uses ("dead tree", "dead and down wood") |
| T06 | Tense and person heuristics: narration in past tense, third person; the hiker referred to through slots, never a hard-coded "he" or "she" |
| T07 | Readability: Flesch-Kincaid grade 7 or below for narration (warning); a sentence over 35 words (warning) |
| T08 | Duplicate or near-duplicate lines across pools (warning) |
| **Pictures and economy** | |
| S01-S04 | Pictures compile; fill-leak heuristic; stamp recursion bounded; hotspots on canvas; palette indices 0-23 |
| E01 | Every item is buyable somewhere or owned by default |
| E02 | **No impossible mitigation:** every tag a card rewards is provided by at least one buyable item |
| E03 | No useless gear: every item tag is read by at least one card or rule (warning) |
| E04 | The sensible kit for every zone and month fits in at least one pack and the default budget |

**How "every card reachable" and "no dead ends" are proven.** C03 is exact, through the facet index. C04 and C05 are sampled: 2,000 random states within the declared variable ranges, crossed with about 60 representative tag profiles and all months. The simulation harness then confirms *dynamic* reachability: a card that never fires across the nightly full matrix is listed in the report, and becomes an error for `status: final` cards. **Forced coverage mode** in the bench (9.3) builds a synthetic context that satisfies each card's preconditions, so even rare cards have their every outcome exercised in CI.

### 9.3 The card bench

`node tools/bench.mjs ford.braided_river` builds synthetic contexts that satisfy the card and prints a matrix:

```
ford.braided_river @ hoh_river_braid_crossings  (6 loadouts x river 1-3 x morning/afternoon)
                       wade                     wait          log                 turn_back
sensible, L1, 09:00    90%  (poles +10)         25% "dropped" across 55% slip 10%  always
day_hike_gear, L1      80%                      25%           across 45% slip 20%  always
overpacked, L2, 15:00  45%  (river -12, heavy -6, outside -6, melt -6)  ...
...
fail shares (wade):    soaked 70 | dropped 5-25 | swept 10-22
text: intro[0] 247 ch (4 lines @M) OK   intro[1] 233 ch OK   by_place.hoh 281 ch OK
      outcomes.swept 268 ch OK          sierra override 186 ch OK
queues: chain.damp_evening if wet>=40 && lacks(camp_clothes_dry): sensible 0% | day_hike_gear 61%
```

Claude runs the bench on every new or edited card before anything else. It is the fastest way to see whether a card is fair, whether the pack matters, and whether the text fits.

### 9.4 The simulation harness

`node tools/sim.mjs --matrix sims/matrix.v1.json --runs 100000 --workers 8` runs the **real engine** headless, with bots making choices. A trip is about 25-60 pages of pure computation, roughly 0.2-0.5 ms in Node, so 100,000 trips take well under a minute on 8 workers.

**Matrix dimensions:**

| Dimension | Values |
|---|---|
| Trip templates | Every classic trip in the edition, plus generated variants (+-1 night, a layover added, reversed loop) |
| Months | June to October (plus shoulder months for warning paths) |
| Loadouts | `sensible` (the ranger's kit for zone x month), `ultralight_smart`, `overpacked`, `day_hike_gear` (22 L pack, no bag, tent, canister or stove), `cotton_and_hope`, `glacier_kit`, `photographer` (camera, no sketchbook), plus **ablations**: `sensible` minus each one of the 40 tags |
| Policies (bots) | `cautious` (highest-p option; turns back below 60%), `steady` (maximizes expected ending value one step ahead), `bold` (fastest progress unless p < 30%), `reckless` (always pushes on), `random`, `joy_seeker` (takes every sunset and side trip), `oracle` (sees rolls; an upper bound) |
| Party | solo (M1-M5); 2 and 4 (M6) |
| Mode | Storybook, Sierra |

**What it measures** for every cell:
- Ending distribution: happy finish, finished with trouble, walked out early, ranger assist, rescue, Sierra death.
- Joy, wisdom, Leave No Trace; nights completed vs. planned; pages and decisions per day.
- Proximate-cause histogram; card fire rates; choice pick rates by policy.
- Text repetition; story-signature uniqueness and ending headlines (6.4).
- **Odds calibration:** realized success per displayed-% bucket. This is the empirical proof that the % on the buttons is honest, and the CI gate is plus or minus 3 points.

**"The pack matters"** (ablations). For each tag, compare `sensible` with `sensible - tag` on every template where the tag is relevant. Every tag must move the ending distribution by at least 0.05 total variation somewhere (otherwise the item is decoration). No single non-required tag should collapse the happy-finish rate by more than 40 points everywhere (otherwise the game is a checklist).

**"The choice matters".** For each card, every pair of choices must differ in outcome distribution (total variation >= 0.15) or in effect *kinds* in at least one context. A choice that is worse for every policy in every context is flagged as "fake", unless the card marks it `teaching: true` (grabbing food from the bear is a deliberate lesson).

### 9.5 Balance targets and CI gates

These align with simulation.md's targets and add engine-level gates:

| Scenario class | Target |
|---|---|
| Sensible plan + sensible kit, `steady` bot | Happy finish >= 95% |
| Ambitious plan (long days, high camps, shoulder month) + good kit | Happy finish 60-85% |
| **Day-hike gear, one night at Glacier Meadows, September** (the user's example) | Trouble or worse >= 80%; Storybook rescue 15-35%; Sierra death 2-6% |
| Coast traverse without a tide table | At least one tide card with p < 60% in >= 70% of trips |
| Storybook rescues across the whole matrix, weighted by expected player plans | < 3% |
| Odds calibration | Within ±3 points in every bucket with n >= 500 |
| Story-signature uniqueness, ending headlines, repeat rate | See 6.4 |
| Decisions per moving day (median) | 3-5 |
| Crashes, stuck states, dead ends, unresolved slots in text | 0 |

**Assertions from research.** `what_goes_wrong_for_underprepared_hikers` in each classic trip becomes an assertion file. Claude writes these at ingest, and they stay as regression tests:

```json
{
  "id": "assert.hoh.day_gear_one_night_glacier_meadows",
  "plan": { "trailhead": "hoh_rain_forest_trailhead", "nights": 1, "camps": ["glacier_meadows"], "start_month": 9 },
  "loadout": "day_hike_gear", "policy": "steady", "mode": "storybook",
  "expect": { "p_trouble_or_worse": [">=", 0.80], "p_rescue": ["between", 0.15, 0.35] },
  "src": "design/data/regions/hoh_olympus.json#classic_trips/hoh_blue_glacier_fast_2_nights"
}
```

### 9.6 Auto-tuning (suggestions, never silent)

- Cards list `meta.tunable` parameters with ranges. Global knobs live in `rules/tuning.json` (director ratios, shared mod values).
- `tools/tune.mjs --target <scenario class>` runs coordinate descent over the tunables that touch failing targets. Its loss is the squared distance to target bands, summed over scenario classes, plus a penalty for moving parameters (to avoid churn).
- It writes a **patch file** and a before/after report. Claude reviews the patch for story sense (wading must stay safer than log-walking, poles must never *hurt* a ford) and applies it in a normal commit.
- Targets are per scenario class, never per trip, to avoid overfitting.

### 9.7 Golden replays and transcripts

- **Engine goldens** run against the frozen fixture edition in `test/fixtures/edition-mini/`. Any change to their state hash is an engine regression.
- **Content goldens** run against the live edition and are *expected* to drift. `npm run golden -- --update` rewrites them, and the diff is part of the review.
- **Transcripts.** `node tools/play.mjs --template hoh_blue_glacier_classic_4_nights --loadout sensible --policy steady --seed K7QM2Q9F` prints the whole trip as a book: page by page, with odds, rolls, effects in the margin, and the epilogue. Claude reads about 20 transcripts per content batch to judge pacing, voice and repetition, which no metric captures. `--html` adds rendered pictures for the human reviewer.

### 9.8 Device checklist (per milestone)

- iPhone SE (375 pt, 2x) and a Pro Max (440 pt, 3x); Safari tab and Home Screen app.
- Install, then airplane mode, then a full trip offline.
- Background the app mid-page (a phone call), come back, and the same page is there.
- Low Power Mode (30 fps cap): cycling and draw-in still pleasant.
- VoiceOver pass on one full day; largest text setting.
- Update flow: publish an edition mid-trip; the prompt appears only at the bookshelf; the save migrates.
- Export a save, wipe site data, import it.
- Rotate to landscape and back.

---

## 10. Authoring pipeline: Claude at scale

### 10.1 From research to content: what each research field becomes

| Research field (region schema) | Becomes | How |
|---|---|---|
| `nodes[]`, `segments[]` | the compiled park graph (3.2) | `tools/ingest.mjs`, deterministic |
| `nodes[].description` | the past-tense node text variants (`text/nodes/<region>.json`): day, dusk, rain, snow | Claude rewrites in the book's voice; the research prose is kept as `src` |
| `nodes[].scene_art_notes` | the scene recipe (base, skyline, landmark, props) and, for landmarks, a new `.pic` | Claude picks from the existing biome bases first, then draws only what is new |
| `nodes[].camp` | camp tags, quota, fire, toilet, water source and canister flags for camp cards and permit checks | ingest |
| `segments[].hazards`, `notes` | canonical hazard tags; overlay fields like `tide_max_ft` extracted from notes ("needs about 6 ft or lower") with confirmation | ingest regex plus Claude, reviewed in the ingest report |
| `segments[].snow_free_typical` | parsed snow windows for the snow model | ingest parser; the overlay where parsing fails |
| `trailheads[]` | drive routes, road status, trailhead page text | ingest plus Claude |
| `classic_trips[]` | ranger-suggested plan presets | ingest |
| `classic_trips[].what_goes_wrong_for_underprepared_hikers` | **simulation assertions** (9.5) | Claude writes one assertion per line item |
| `hazards[]` (with `game_event_idea`, `mitigations`) | **place-card stubs**: `where` from `where`, choices from the idea, gear tags from `mitigations`, `meta.src` back-links | `tools/new-card.mjs --from-hazard`, then Claude completes |
| `wildlife_and_plants[]` | field-guide entries, discovery and sketch cards, animal-helper sprites | Claude |
| `permit_and_rules[]` | `permits.json` (quotas, group sizes, canister rule, fire line), plan validation, ranger lines | Claude, with `confidence` carried through |
| `conditions_2026[]` | the conditions overlay (3.4). Hazard words that are really statuses (`trail_closed_2026`, `possibly_closed_2026`, `road_closure`, `no_camping_zone`) move here too. | ingest plus Claude |
| `uncertain_claims[]` | never used as facts in text; listed in the ingest report | lint (T03-style check against claim keywords) |

### 10.2 The loop for every batch

```
 1. INGEST     tools/ingest  ─► ingest report (merges, estimates, unknown hazards, doubts)
 2. SCAFFOLD   tools/new-card --from-hazard … ; recipes from scene_art_notes; assertions from what_goes_wrong
 3. WRITE      Claude fills one family or one place per file, following the Authoring Brief (10.3)
 4. LINT       npm run lint            ─► fix until 0 errors
 5. BENCH      tools/bench <each new card>  ─► fix odds, availability, text length
 6. RENDER     tools/render-pics <new scenes> ─► Claude looks at the PNGs, revises
 7. SIMULATE   npm run sim:smoke, then the region's matrix ─► targets, coverage, ablations, calibration
 8. READ       tools/play × 20 transcripts ─► voice, pacing, repetition
 9. REVIEW     tools/review-book ─► an HTML "review book" for the human (10.6)
10. PLAYTEST   push to preview ─► iPhone ─► notes and bug reports back to step 3
11. ACCEPT     status: final; merge to main
```

Every step except 10 runs headless. A batch of about 25 cards plus their text and two new pictures is a comfortable single-session unit for Claude.

### 10.3 The Card Authoring Brief (a file in the repo: `content/AUTHORING.md`)

The brief is short, stable and always loaded into an authoring session. It contains:
1. **The schema and the vocabulary**: card fields, effect ops, variables, tags, families. It links `schemas/` and `vars.json`, which are the truth.
2. **Six exemplar cards** (the ones in 4.11), one per family style.
3. **Voice rules** (from storybook.md 2.1): third person, past tense; one idea per page; first sentence names the picture; last sentence leans toward the choice; animals do not talk; gentle, wry; 300 characters target, 420 maximum.
4. **Fairness rules:**
   - every bad outcome has at least one mitigation that exists in the gear catalog or as a choice;
   - every `%` comes from a check with labeled mods;
   - numbers must be grounded in research data (river behavior, tide thresholds, distances) or in `rules/` constants, never invented per card;
   - Storybook mode never kills;
   - Sierra deaths only at true "Sierra moments" (fords, headlands, ladders, crevasses, hypothermia, falls), each with a restore point.
5. **Multiplication rules:**
   - prefer an archetype with a place patch over a new card;
   - always read at least two gear tags and one environmental variable;
   - give each choice a *different kind* of consequence (time vs. risk vs. comfort vs. Leave No Trace);
   - plant at least one delayed consequence or echo per three cards.
6. **Originality and naming:**
   - never quote or paraphrase *The Golden Glow*;
   - the protagonist is the player's hiker;
   - fictional names for private businesses; real names for public places;
   - no real people.
7. **Definition of done:** lint clean, bench reviewed, sim targets met, transcripts read, `status: benched`.

### 10.4 Parallel authoring rules

Several Claude sessions can author at once (one per region or per family) without stepping on each other because:
- Files are split by family and place, and each session owns its files.
- Ids are namespaced (`ford.*`, `place.sol_duc.*`). The linter rejects ids outside the session's declared namespace when a `--namespace` flag is passed.
- Shared vocabularies (`vars.json`, `flags.json`, `hazards.json`, `mods.json`, `macros.json`) change only through small, separate PRs, so the shared surface stays small and reviewable.
- `tools/coverage.mjs` assigns the thin cells (6.5) as a work queue: each session claims cells, and the report shows who filled what.

### 10.5 Provenance and fact hygiene

- Every place card and node text carries `meta.src` back to research ids and URLs. The ingest report and review book show the research `confidence` next to the content that uses it.
- Text that states a hard fact (a distance, a rule, a closure) must take the number from data through a slot (`{n:seg.miles}`, `{conditions.ranger_line}`), so a fact changes in one place when research changes.
- `uncertain_claims` from the research are listed in the ingest report, and the review book highlights any content near them.
- **Editions are dated.** The colophon says "Park conditions as researched on 2026-10-07". Re-running research produces a new conditions overlay and edition, and old saves migrate.

### 10.6 What the human reviews

Reading JSON is not a reasonable review surface for the game's creator. `tools/review-book.mjs` writes an HTML **review book** per batch (it can be published as a private artifact link):
- each new card as the player will see it, with its picture, text variants, choices and a small table of odds for four loadouts (sensible, ultralight, day-hike gear, overpacked);
- the outcome pages, Storybook and Sierra side by side;
- new pictures in all palettes (day, dusk, night, fog);
- two transcripts from the batch's region;
- the batch's sim deltas (targets, coverage, calibration) in plain words;
- a "facts used" list with sources and confidence.

The user's notes come back as plain text or as debug-overlay notes, and they go into step 3 of the next batch.

### 10.7 Per-region recipe and rough effort

For each new region after M1 (the engine and generic families already exist):

| Task | Typical volume | Claude sessions (about) |
|---|---|---|
| Ingest, overlays, zone and feature tags, ingest-report fixes | 60-120 nodes | 1 |
| Node text variants (past tense, 3 per node) | 60-120 nodes | 1-2 |
| Place cards from hazards, plus place patches of archetypes | 25-50 | 2 |
| New archetypes the region needs (tides for the coast, burn snags for the Elwha) | 0-25 | 0-2 |
| Scene recipes, plus new landmark and skyline pictures | 8-20 pictures | 2-3 |
| Trip templates and assertions | 15-30 | 1 |
| Balance pass (sim, tune, transcripts, review book) | | 1-2 |
| **Total per region** | | **about 8-12 sessions** |

---

## 11. iPhone Safari performance notes

- **Canvas.** Draw at 160x168 and scale with one `drawImage` and smoothing off. Keep at most 3 live canvases (display, offscreen, sketch). Release discarded canvases by setting `width = 0`, because iOS caps total canvas memory and fails silently when it is exceeded.
- **Pixel-perfect scaling.** Set the canvas backing store to integer multiples of 160x168 in *device* pixels and its CSS size to backing / `devicePixelRatio`. Do not depend on `image-rendering: pixelated` alone.
- **Animation budget.** Palette cycling runs at 8 fps and draw-in at frame rate for about 0.8 s. Pause everything on `visibilitychange` and when the page is static. Low Power Mode caps `requestAnimationFrame` at 30 fps, which is irrelevant at our rates. Respect `prefers-reduced-motion`.
- **Startup.** Target under 1.5 s from tap to title on a cached load:
  - the edition is one JSON (about 1 MB raw at full park, a few tens of milliseconds to parse on an A15 or later);
  - the facet index is prebuilt at build time;
  - expression compilation is lazy (on first use per card);
  - fonts are preloaded.
- **Don't rely on `requestIdleCallback`.** Safari support is uncertain. Use `setTimeout(fn, 0)` after a page renders for saves and precomputation.
- **localStorage is synchronous.** Keep each write under about 50 KB and do it right after the page paints, never in the middle of an animation.
- **Layout.** Use `100dvh` (not `100vh`) and `env(safe-area-inset-*)`. Put `contain: layout paint` on the text box and the picture frame. Batch DOM reads (measuring text) before writes.
- **Standalone mode quirks:**
  - there is no browser back button (every screen has its own back);
  - external links (NPS pages in the colophon) open in an in-app browser;
  - iOS may kill a backgrounded app, so autosave every page;
  - the status bar overlaps unless padded by `safe-area-inset-top`.
- **Audio.** Create and resume the `AudioContext` on a tap. The ring/silent switch may mute Web Audio, so the game never depends on sound.
- **No vibration API** on iOS Safari; don't design haptic feedback.
- **Memory.** About 1 MB of edition JSON becomes about 10-20 MB of heap. The picture cache is about 650 KB. Well within budget, even on an iPhone SE.
- **Service-worker cache.** Home Screen apps get a generous quota, and we use under 5 MB. Precache with `cache: 'reload'` (7.5) to avoid stale files from the HTTP cache.

---

## 12. Milestones

### M0: Foundations (engine skeleton, no real content)

- Repo layout, the Pages workflow (main and preview), the PWA shell with the offline stamp, the debug overlay and error sheet.
- `rng`, `expr`, `template`, `content` loader and index, the effects interpreter, `phases` with stub screens, `save`.
- The picture VM with 3 test pictures, headless PNG rendering, the linter skeleton (R, C01-C02, T02), the harness skeleton with one bot.
- **Exit:** a two-page "hello trailhead" book installs to the Home Screen and works offline, and `sim:smoke` runs 1,000 trivial trips.

### M1: The vertical slice, "The Hoh River to Glacier Meadows"

**Scope:**
- Hoh Rain Forest trailhead to Glacier Meadows and the Blue Glacier moraine viewpoints, about 35 nodes and all 15 Hoh camps.
- Day hikes (Hall of Mosses, Five Mile Island) and 1-5 nights with layovers, June to October.
- **Mount Olympus present as the expert branch:** past Glacier Meadows the story requires the glacier kit and the `glacier_skill` trait. Without them, the ranger, the plan validator and the cards all steer you to the moraine, the honest outcome.
- One store (fictional, Forks), one drive (Port Angeles or Forks to the Hoh, with elk on the road and the entrance line), the pack spread.
- About 95 cards: archetype families ford, rain, cold night, blowdown, snow chutes, elk, black bear, water, feet, people, sunset; place cards for the High Hoh Bridge, the Glacier Meadows ladder, Elk Lake, Olympus Guard Station, the braid crossings and the lateral moraine.
- About 12 scenes and 3 plates; the Snowlamp finale at the moraine; endings and epilogue with Field Notes; Storybook and Sierra modes; save and load; share codes.

**Why the Hoh rather than the High Divide for the slice:**
1. **It is the user's own example.** "Go for Mount Olympus with day hike gear in one night, might have a problem" is a Hoh trip. The slice can prove the core promise with the exact scenario the user named, as a CI assertion.
2. **It spans everything.** From 578 ft of rain forest to the 4,300 ft subalpine meadow, the 5,100 ft moraine, and a glacier and summit beyond. Every elevation band, weather lapse, biome base picture and night-margin regime gets exercised in one trip.
3. **Its graph is simple but its plans are rich.** It is a single trail with 15 camps: about 140,000 out-and-back itineraries (6.2) without needing loop-routing UI yet. Planning, store, pack and drive all get built against a forgiving map.
4. **Its hazards are the canonical ones:** fords that rise with rain and melt, the broken ladder, snow-filled avalanche chutes, rain and hypothermia, elk, bears, blowdown and quota permits. Proving these proves most of the archetype families the rest of the park reuses.
5. **Its research is the most complete:** 62 nodes, 65 segments, 21 classic trips and 23 hazards already in `hoh_olympus.json`.
6. **The homage fits:** a long climb to snow and ice, a sunset on the Blue Glacier, and the gold in the snow.
7. **It connects:** the Hoh Lake trail junction is the bridge to M2.

**Known weakness and mitigation.** Out-and-back trips repeat places on the way home. Return-leg cards, `leg.feel` variants such as "the valley looked different going home", time-of-day palettes and fatigue-driven content make the descent its own chapter.

**Exit criteria:**
- the targets in 9.5 for the Hoh templates, including the day-gear Olympus assertion;
- calibration within ±3 points;
- story-signature uniqueness >= 90% on the 3-4 night templates;
- the device checklist (9.8) passes;
- the user plays three different Hoh trips and wants a fourth.

### M2: Sol Duc, Seven Lakes Basin and the High Divide (+ the Hoh Lake link)

- First loop routing (direction and variants), first traverse (Hoh to Sol Duc via Hoh Lake), cross-region routing.
- Quota-heavy permits ("Lunch Lake is full that night"), way trails and fog navigation, dry crests, mosquitoes, the High Divide thunderstorm.
- About +90 cards (mostly place patches) and +10 scenes.
- **Exit:** the region's coverage cells are at least 32; ablations pass for `map`/`compass`, `water_cap`, `bug` and `rain_bottom`.

### M3: Royal Basin (v1.0: all three must-haves)

- Northeast region ingest when its research lands: the Dungeness trailhead, Royal Creek, Royal Lake and the upper basin, plus whatever neighbors the research covers (Deer Park and Grand Valley are natural).
- Rain-shadow weather zone (drier, sunnier), different flora, the moraine and tarns, the Needles skyline.
- About +60 cards and +8 scenes.
- **v1.0 release:** three must-haves, about 260 cards, about 170 nodes, 5 trailheads, 30 templates, the full lint and sim gates.

### M4: The Wilderness Coast

- **New systems:** tide tables generated from harmonic constants or a precomputed table per month (simulation.md 4.8); headland thresholds (`tide_max_ft`) extracted from research notes; rope ladders and overland trails as `alt` segments; river-mouth fords at low tide; beach camps; raccoons; fog.
- About +80 cards. A new biome set: beach, sea stacks, coast forest. Surf palette cycling.

### M5: The rest of the park

- Elwha and Hurricane Ridge, the Enchanted Valley and Quinault, the Duckabush and LaCrosse, Staircase (with 2026 closures through the conditions overlay), the Bogachiel and Queets.
- About +250 cards, mostly place patches; generic families stable.
- **Exit:** the full-park targets in 6.6, with every region's coverage cells filled.

### M6: Companions and polish

- Named companions (optional, 0-3, player-named; never assumed), party UI, companion lines and traits, group gear.
- Accessibility pass, "trail of the day", the full Sierra death set with restore points, journal completion (104 entries).

---

## 13. Risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| Content quality drops as volume grows | "Lots of outcomes" that all feel generic | Archetype + place-patch structure; the coverage matrix points writers at the cells players actually visit; 20 transcripts per batch; the human review book; anti-repetition |
| The expression language grows into a programming language | Unlintable cards, subtle bugs | Fixed function whitelist; no loops, no assignment, no `rand`; anything bigger becomes an engine feature with tests |
| Odds look dishonest | Breaks the core promise | Calibration gate in CI (±3 points); odds computed by the same code that rolls; words instead of % when a compound choice can't be computed exactly (simulation.md 9.4 covers look-ahead) |
| Research data inconsistencies (duplicate nodes, one-way segments, null gains, ad-hoc hazard words, statuses as hazards) | Broken routes, wrong times, cards that never match | The ingest step and its report (3.2); lint G01-G08; Appendix A vocabulary |
| Edition changes break saves mid-trip | Lost trips | Snapshot saves with migrations; updates offered only at the bookshelf; old-save fixtures in tests |
| iOS storage eviction and the Safari/Home Screen split | Lost journals | Install prompt before the first save; export and import codes; `storage.persist()` where supported |
| GitHub Pages on a private repo needs a paid plan | No free hosting | Confirm repo visibility (Open Question 1); alternatively keep content in a public repo |
| Real 2026 conditions go stale | The game says a trail is closed after it reopens | Dated editions; the "Timeless park" setting; the conditions overlay is one file to refresh |
| AI-drawn vector art is drawn blind | Ugly or broken scenes | Headless PNG rendering that Claude looks at; picture lint (leaks); biome bases reused everywhere; only landmarks drawn new |
| The homage drifts too close to the book | Legal and ethical | Lint T04, the authoring brief, all prose original, the colophon acknowledgment |
| The no-build stack hits a scaling wall (too many modules on first load) | Slow first launch | `modulepreload` list; service worker after the first load; a one-command `esbuild` escape hatch in the deploy job |

---

## 14. Open questions for the user

1. **Is `fernforager/104-boyz` public?** Free GitHub Pages from Actions needs a public repo, or a paid plan for a private one.
2. **Real 2026 conditions by default, or a timeless park?** Recommendation: "This season" on by default, because checking closures is part of planning a real trip, with "Timeless park" one tap away in settings.
3. **Confirm the default mode:** Storybook (nobody dies; the worst case is walking out or a ranger assist, then plan again), with Sierra deaths as an opt-in mode.
4. **The vertical slice:** the Hoh River to Glacier Meadows, with Mount Olympus as the expert branch. Is that the right first trip, or would you rather start with Seven Lakes Basin and the High Divide?
5. **Companions:** solo first, with optional player-named companions later (M6). Is "104-boyz" a group you'd like to be able to name as companions, or should the game stay solo?
6. **Testing setup:** do you have a Mac for Safari Web Inspector, or should we rely on the in-game debug overlay and its "Copy bug report" button?
7. **Odds display:** the engine supports %, words or hidden per choice. Recommendation (shared with simulation.md): % on every risky choice and none on safe ones. Do you agree?

---

## Appendix A: Hazard vocabulary canonicalization

The four region files written so far use **65 distinct hazard words**. Ingest maps them onto about 30 canonical tags that cards target. Statuses that are not physical hazards move to the conditions overlay.

| Canonical tag | Aliases seen in research data |
|---|---|
| `river_ford` | `river_ford`, `creek_crossing`, `stream_crossing`, `rapid_river_rise` (also sets the segment `flashy` flag), `undercut_bank` |
| `bridge_or_log` | `bridge`, `footlog`, `bridge_out` (`bridge_out` also creates a conditions item) |
| `snowfield` | `snowfield`, `avalanche_path` (kept as its own tag too) |
| `glacier` | `glacier`, `crevasse`, `bergschrund` |
| `exposure` | `exposure`, `ledges`, `cliff` (kept), `steep_descent` |
| `steep_scree` | `steep_scree`, `boulder_field`, `rockfall` (kept), `landslide` |
| `steep_grade` | `steep`, `steep_steps`, `stairs` |
| `rope_or_ladder` | `rope`, `ladder` |
| `slippery` | `slippery_rock`, `slippery_boardwalk`, `mud`, `kelp` |
| `blowdown` | `blowdown`, `drift_logs`, `drift_log_jam`, `overgrown`, `brush` (kept for snag and wet-brush cards) |
| `route_finding` | `route_finding`, `fog` (kept) |
| `no_water` | `no_water`, `limited_water` |
| `heat` | `heat`, `heat_exposure` |
| `cold_exposure` | `cold_exposure`, `cold_water` |
| `lightning` | `lightning` |
| `tide_dependent` | `tide_dependent`, `sneaker_waves` (kept), `headland_overland` (also becomes an `alt` link), `barnacles` |
| `washout` | `washout`, `flooding` |
| `burn_snags` | `burn_scar`, `burn_snags`, `snag_fall` |
| `bugs` | `mosquitoes`, `yellow_jackets`, `stinging_plants` |
| `wildlife` | `bears` |
| `fragile_meadow` | `fragile_meadow` |
| `crowds_traffic` | `crowds`, `traffic` |
| `hardware` | `protruding_nails` |
| **moved to conditions, not hazards** | `trail_closed_2026`, `possibly_closed_2026`, `road_closure`, `no_camping_zone` |

New words in later research files produce a lint warning and an `x_<word>` tag until someone adds an alias.
