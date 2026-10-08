# M1a data check: the High Divide loop

**All open items were closed on 2026-10-08: see [Resolution](#resolution).**

Checked 2026-10-08 against `design/GAME_DESIGN.md` (4.3, 3.x, 5 to 9, 10.2, 11.7, 14, 15, Appendices B, E and F, and "Decisions made"). The check was a throwaway Node script, run outside the repo. It parsed every JSON file, merged the seven region graphs, routed the loop both ways, and compared every figure the document quotes for M1a with the data.

## Verdict

**Ready to build M1a.** Nothing blocks the vertical slice:
- Every node, segment and camp the loop needs is in the data.
- All 47 loop segments have miles, gain and loss, so they work in both directions.
- Every mileage in 4.3, B.1, B.2 and B.6 matches the graph to 0.1 mi, once the Bogachiel Peak summit trails are treated as a side trip (issue 1).
- The catalogs have every M1a item except beer and the pre-roll. The document already plans for ingest to add those two.

Two things should be settled early in M1a:
1. **Routing:** treat Bogachiel Peak as a spur, so the router can't take the loop over the summit.
2. **Thunder and fog odds:** the data has no thunderstorm or fog frequencies for the high country. The crest's two ways to die depend on them.

Four trivial problems were fixed in place (listed below). Nothing was committed.

## Fixed in place

| File | Change |
|---|---|
| `regions/sol_duc_high_divide.json` | Six camp notes dated the 2026 Stage 2 fire ban "from Aug 11". Changed to Aug 7, which matches `conditions_2026`, `permit_and_rules` and `park_rules.json`. |
| `regions/sol_duc_high_divide.json` | Hazard `sol_duc_falls_edge` now cites the June 2025 death above the falls (from `park_rules.json` search_and_rescue) and marks the site `real_incident`. Ingest tags hazards that cite a real death (9.5), and this one didn't cite it, though its idea proposed "swept away, game over". |
| `gear_catalog.json` | Added `stats.rent_usd_per_day`: 5 for `canister_standard`, `canister_small` and `canister_classic`, and 7 for the carbon tier. The values come from the catalog's own `rentals` text ($4 to $6 a day, carbon about $7). The permit page offers "rent one" (3.1), and rentals are read from this stat (5.1), which only glacier gear had. |
| `gear_catalog.json` | Removed the book's name (lint T04) from three strings: the `flower_press` note, the `sketchbook` tag gloss and the `journal_points` stat gloss. The two glosses now say the journal system was retired on 2026-10-08. |

## The loop graph

**Nodes.** All 47 nodes that the loop, its side trips and its off-menu lakes use exist:
- the trailhead, Sol Duc Falls and its camp, the Hidden Lake junction, and Canyon Creek #1 to #3;
- Deer Lake, Potholes, and the rim and stone-staircase junction (`seven_lakes_basin`);
- the Round Lake junction, Lunch, Round, Clear and Mirror lakes, and the Mirror Lake way-trail junction;
- Long, Sol Duc, Morgenroth, No Name and Y lakes, and Lake #8;
- both Bogachiel Peak junctions, the peak, and the High Divide / Hoh Lake junction (`high_divide`);
- Hoh Lake, C.B. Flats, Heart Lake Junction camp and Heart Lake;
- Sol Duc Park, Lower Bridge Creek, Sol Duc Crossing, Seven Mile, Horse Head, Rocky Creek and Appleton Junction;
- Sol Duc River #1 to #4;
- Bruce's Roost, the Cat Basin cutoff, the Swimming Bear junction and Cat Basin;
- Hidden Lake.

`heart_lake_junction` and `appleton_junction` are typed `junction` but carry camps, so the engine should find camps by `camp != null`, not by type.

**Segments.** There are 47 loop segments: 31 maintained, 5 primitive, 7 way trail and 4 off trail.
- None has a null mile, gain or loss.
- Every one has `snow_free_typical`, and 36 have hazards.
- Every segment's net gain agrees with its endpoint elevations to within 60 ft.
- Segments are stored one way, as E.4 expects, and ingest synthesizes the reverse.

**Connectivity.** Every loop node is reachable from `sol_duc_trailhead` except `lake_8`, which is correct: no trail reaches it (4.3). The merged park graph connects 374 nodes to the trailhead. The Hoh side, through `hoh_lake_trail_junction` and C.B. Flats, merges cleanly with `hoh_olympus`.

**Figures checked against the document** (with Bogachiel Peak as a spur):

| Route | Graph | Document |
|---|---|---|
| Loop by the crest, either way | 18.4 mi, +4,400 / -4,410 | 18.4 |
| Loop through the basin | 18.7 mi | 18.7 |
| Trailhead to the rim, going ↺ | 6.9 mi, +3,200 | 6.9 mi, about 3,200 ft |
| Rim to the trailhead (7.4 check) | 6.9 mi, +280 / -3,200, 740 ft steep, 3.88 h | 3.9 h, 740 ft steep |
| Trailhead to the crest, going ↻ | 8.5 mi, +3,360 | 8.5 mi, about 3,350 ft |
| Stone staircase, rim to Lunch Lake | 0.9 mi, -550 / +100 | 0.9 mi, 540 ft |
| Mirror Lake way trail to Lunch Lake | 1.1 mi, -530 | 1.1 mi, 530 ft |
| Crest to Hoh Lake | 1.2 mi, -670 | 1.2 mi, 670 ft |
| B.2, day 2: Sol Duc Park to Lunch Lake | 3.8 mi, +1,130 / -870 | identical |
| B.2, day 4: Lunch Lake out by the staircase | 7.8 mi, +830 / -3,300 | identical |
| B.6, day 1: trailhead to Heart Lake by the crest | 10.3 mi, +4,150 | identical |
| The ↻ first day to Lunch Lake | 10.9 mi, +3,600 | about 3,600 ft |
| The 4.3 camp tables (24 camps, both directions) | all match | |
| Side trips (Bogachiel, Hoh Lake, Cat Basin, Heart Lake, Round, Clear, Mirror, Morgenroth) | all match | B.1 |
| The ranger's fills (B.1) | 18.4, 18.7, 20.4 (↺ 2-night basin) | identical |

All four loop presets (`high_divide_loop_1n_heart_lake`, `_1n_lunch_lake`, `_2n_classic` and `_3n_layover`) end at the trailhead and match the graph. The `_2n_classic` preset's day 2 (4.5 mi) is the main trail plus the peak as an out-and-back. No fill day passes the ranger's 9-hour frown. The longest are ↺ to Heart Lake by the crest (8.6 h for a Regular hiker) and ↻ to Lunch Lake (8.5 h).

## Camps

All 21 M1a camps have `sites`, quota text, `bear_can_required: true`, `food_storage: "can"`, `fires_allowed`, `toilet` and `water`. Every `sites` value matches the 4.3 tables:

| Camp | Sites |
|---|---|
| Deer Lake | 10 |
| Lunch Lake | 9 |
| Heart Lake | 5 |
| Sol Duc Park | 4 |
| Hoh Lake | 4 |
| Sol Duc Falls | 3 |
| Potholes | 2 |
| Lower Bridge Creek | 2 |
| Each of the rest | 1 |

Fires follow the 3,500 ft line everywhere: allowed at the river camps, Canyon Creek and the falls, and banned from Deer Lake upward. Hoh Lake is a named no-fire area.

The privies are at Deer Lake, Lunch Lake, Heart Lake, Sol Duc Park and Hoh Lake. The crest camp, Heart Lake Junction, is marked as having no water.

The WIC-only camps can be derived: `sites: null`, plus `permit_and_rules[17]`. They include Long Lake, Sol Duc Lake, Morgenroth, Lake #8, Bruce's Roost, Cat Basin and Hidden Lake.

**WIC phone.** 360-565-3100 appears 23 times in the region file, and `park_rules.json` gives it as (360) 565-3100.

**Morgenroth.** `game_notes` already says the camp is phone-only and off the planner, and its approach is way trail from Long Lake, with the Clear Lake to Long Lake link off trail. E.4's "in person" bullet is out of date.

**`conditions_2026`.** There are 18 entries, each with a date, source and confidence. They have no `from`, `until` or `persists` fields yet: the overlay (4.7) adds those.

## park_rules.json

All of these are present:
- permits: the 2026 summer season, quota areas (the Sol Duc / Seven Lakes area and Hoh Lake with C.B. Flats), group size and fees ($8 a night plus $6);
- food storage: canisters required everywhere, and hanging prohibited;
- the WIC loaner;
- fires: the 3,500 ft rule, named no-fire areas, and the 2026 ban (Aug 7, with the USFS order ending Oct 1);
- subalpine climate from three SNOTEL stations (Buckinghorse, at 4,850 ft, is the closest match to the Divide; it averages 66.6 / 49.4 °F with 4.5 wet days in August, and 58.3 / 43.8 °F with 9.9 in September);
- monthly freezing-level percentiles (medians 12,500 ft in August and 11,600 ft in September);
- melt-out dates.

**Daylight.** `park_rules.json` has the 15th of each month. Computed with the NOAA algorithm at the loop (47.97 N, 123.83 W), it reproduces the 7.2 table to the minute, and B.2's 6:07 am sunrise and 8:34 pm sunset. `data/daylight.json` (the 1st and 15th) can be generated; it is not a research gap.

## Gear and food

**Gear.** The catalog has 8 packs and 218 items with no duplicate ids, and every item tag is in `tag_glossary`. Every item M1a needs exists with weight, volume, carry and price:
- all 8 packs, with ratings and outside slots;
- the canisters (small, WIC loaner and classic at 10.1 L / 8.6 L usable, standard 11.5 / 9.8, carbon 10.6 / 9.0);
- shelters, bags (`comfort_f`, wet retention), pads (R-values) and rain gear;
- the cotton traps (all 18 `trap` items listed in 6.9);
- the headlamp (4 h high, 40 h low), stove (14 g per liter), 110 g fuel (14 boils) and filter (freeze damage);
- `pack_towel` (2 oz, tag `towel`), `trowel` and `earplugs_eyemask` (`sleep_aid`);
- the joy items.

Pack names, liters and ratings match 6.2, and canister sizes match 5.5. The four computed sample kits resolve to real ids, and their base weights recompute from the items (5.6, 18.4, 38.5 and 6.2 lb).

**Food.** There are 86 foods: 47 no-cook, 25 boil, 11 fresh and 3 cold-soak, which matches 5.4. All have calories, weight, liters as sold and repacked, fuel, water, morale and crushability. There are 30 dinners (19 hot), hot drinks, `sandwich_deli` for the grab-lunch stop, and the trap foods. The canister table agrees with the gear catalog.

**Missing:** beer and the pre-roll (issue 6).

## Lore

**Epitaph dice.** 296 quotes; 47 are flagged for epitaphs (`suggested_uses` has `epitaph`). All 47 fit 40 characters, are `page_image_checked`, and have a URL and a public-domain reason. The `drawable` flag agrees with them, and every `chars` field matches the text length. The decks for M1a's causes all clear F.3's minimum of 8:

| Deck | Distinct lines | Preferred |
|---|---|---|
| `cold` | 35 | 4 |
| `fog` | 38 | 4 |
| `lightning` | 37 | 3 |
| `dark` | 42 | 10 |

**Node ids.** Every lore node id exists in the region files.

**History on the loop.** Only six fact cards touch loop nodes:
- `card_sol_duc_name` and `card_hoh_destruction`: both need tribal consultation before use;
- `card_wood_high_divide`: no Look line;
- `card_bailey_range_names`: touches Cat Basin only;
- `card_shelters`: anchored at Canyon Creek #1 (issue 17);
- `card_morgenroth`: for M1b.

The only place names are Sol Duc, Hoh and Morgenroth.

## Bonfire Lily

The places 10.2 lists on the loop are Bogachiel Peak (July to about Aug 20), and Lunch Lake, Heart Lake and the High Divide crest (July to about Aug 10). Lake Morgenroth is correctly excluded. No file has `snow_feature` or `bonfire_lily_weight` yet; these are planned overlay fields (E.5), for M1b. The research supports snow at Bogachiel Peak, the rim and Heart Lake Junction (hazard `snowfield_high_divide`), but not at Lunch Lake or Heart Lake themselves (issue 16).

## Open issues

| # | Sev | Where | Problem | Fix |
|---|---|---|---|---|
| 1 | high | `sol_duc_high_divide` segments `bogachiel_peak_junction`→`bogachiel_peak` and `bogachiel_peak_west_junction`→`bogachiel_peak` | The two summit trails form a shortcut over the peak. They are shorter by miles (0.2 vs 0.3) and by 7.4 hiking time (0.26 vs 0.32 h). So the router takes every crest crossing over the summit: it skips the Hoh Lake junction, adds two way-trail checks, and puts every camp past the crest 0.1 mi off the 4.3 tables. | Make the peak a spur. For example, add `through_route: false` on both segments, in the overlay or at the source, so the peak is reached only as a side trip or a `via`. With that, every 4.3 row matches. |
| 2 | high | `park_rules.json` climate | There are no thunderstorm or fog frequencies for the High zone, only prose. M1a's crest deaths (`lightning` and `fog`), the fork card's forecasts and B.6's 30% / 0.2% depend on them. | Research monthly figures, or set flagged design estimates in `data/climate.json`. Tune them against the F.1 sensible-plan cap. |
| 3 | medium | `park_rules.json` climate | `data/climate.json` lacks inputs: no synoptic chain (fair, unsettled, wet, storm) by month, no ridge wind for wind chill, no Sol Duc valley station (North mid uses Port Angeles and Elwha, which are drier), and subalpine wet days only at 0.10 in or more. | Derive the chain from Quillayute daily data or estimate it. Use Buckinghorse for the High zone. Flag the estimates. |
| 4 | medium | Deer Lake, Sol Duc Park, `seven_mile_group_camp`, `horse_head_stock_camp`, `c_b_flats_group_site` | Group and stock sites exist only in prose. 4.3 and 4.6 say they are never offered to a solo hiker. | Add `group_only` and `stock_only` overlay fields. Keep the individual site counts as they are. |
| 5 | medium | GAME_DESIGN 7.9 and 8.13 vs `gear_catalog` stats | The night model's fixed constants disagree with the item stats. For shelters, the doc has tent -4, bivy -3 and tarp -2; the catalog's `warmth_bonus_f` is 4 to 8 for tents, 6 for the bivy, 10 for the emergency bivy and 2 for the tarp. For wet warmth, the doc has cotton 20%, wool and synthetic 70%, and down 25%; the catalog has cotton 0 to 0.15, synthetic 0.3 to 0.7, wool 0.5 to 0.6 and down 0.25. | Pick one source. I'd use the catalog's per-item stats, with the doc's figures as defaults, and regenerate the 7.9 and 8.13 examples. |
| 6 | medium | `food_catalog.json` | There is no beer or pre-roll, so the `beer` and `pre_roll` event tags have no source. 5.4 and E.4 already plan for ingest to add them. | Either keep the ingest path, or add `beer_hazy_ipa_16oz` (17 oz full, 0.5 oz empty, 0.5 L, 0.05 L crushed, $4, 270 kcal, morale 3, 21+, `larry`) and `pre_roll` (0.1 oz, $10, 0 kcal, 21+, `larry`) at the source and update the 86-food counts. 14.1 already says 88. |
| 7 | medium | `sol_duc_high_divide` `wildlife_and_plants[].game_idea`, `hazards[].game_event_idea` | Research ideas predate the creator's decisions: <ul><li>The bear, deer ("shows the way"), marmot ("warns of weather") and Canada jay are "helpers", against decision 9.</li><li>About a dozen ideas are journal sketches, field-guide pages or collectibles, all retired.</li><li>The glacier lily is offered as "the Golden-Glow homage" (T04).</li><li>Hazards use "Sierra mode" and "gentle mode", and companions ("friends", "kids").</li></ul> | Have the Authoring Brief or ingest treat these ideas as void where they conflict, or rewrite them at the source. 14.3 scaffolds wildlife cards from these fields. |
| 8 | medium | `lore/quotes_public_domain.json` `epitaph_dice.decks.dark` | In M1a, "...of the dark." is the after-dark form of a `fog` cliff death. The dark deck still deals `on_oq088`, `on_oq126` and `pe_q09`, whose `caution_causes` allow only `fall` and `crevasse`. | Filter the dark deck by the base cause's cautions, or split it into `dark_fall` and `dark_fog`. Add the check to the F.3 lint. |
| 9 | medium | `sol_duc_falls_edge` | The 2025 death wasn't cited, so ingest wouldn't have tagged the hazard `real_incident`. | **Fixed in place.** |
| 10 | medium | `gear_catalog.json` canisters | Canisters had no rental price. | **Fixed in place.** |
| 11 | medium | New data E.5 calls for in M1a | No input exists yet for the quota and encounter tuning: trail and camp popularity, weekday and weekend availability per camp (only a hazard's generic 60/20/5% idea), the ranger's permit-check odds, and the future-year fire-ban chance. The overlay fields (`canopy`, `cold_pool`, `water`, `views`, `map_xy`) and `rules/kits.json` don't exist yet. | Author these as M1a tasks, with estimates flagged, and calibrate them against B.1 ("Lunch Lake, often full") and F.1. |
| 12 | low | Six Sol Duc camp notes | The fire ban was dated Aug 11 instead of Aug 7. | **Fixed in place.** |
| 13 | low | `gear_catalog.json` | The book's name appeared in three strings. | **Fixed in place.** Other regions' idea fields still name it; outside M1a, and lint T04 will catch them. |
| 14 | low | GAME_DESIGN 3.1 and 3.3 | The example arrival times (11:40, 2:30 pm and 3:35 pm) were about 10% slower than the 7.4 formula on the graph (11:23, 1:56 and 2:55). B.6's 4:30 pm matches, with its 20-minute lunch. | **Already fixed** in the working copy of GAME_DESIGN.md by a concurrent edit (it now says 11:25, 1:55 and 2:55). Keep the times as F.4 golden examples. |
| 15 | low | GAME_DESIGN E.4 | The "Morgenroth game_notes says in person" bullet is out of date: the data says phone-only. | Delete the bullet. |
| 16 | low | Bonfire Lily data | There is no `snow_feature` or `bonfire_lily_weight` yet; that is M1b overlay work. "The High Divide crest" (10.2) needs named nodes; `heart_lake_junction` is the only camp on the crest, and 4.3 gives the crest no ☆. The research doesn't mention snowfields at Lunch Lake or Heart Lake. | Choose the crest nodes, and confirm the windows against August trip reports and the creator's memory. |
| 17 | low | `lore/history.json` | <ul><li>Nothing for Deer Lake, Lunch Lake, Heart Lake, Potholes, Bogachiel Peak's name, the crest or Seven Lakes Basin.</li><li>The cards that cover Sol Duc and the Hoh need tribal consultation.</li><li>`card_shelters` is anchored at `canyon_creek_1`, but the research puts the Canyon Creek trail shelter at Sol Duc Falls, and Sol Duc Park also has a shelter.</li></ul> | Write a few loop cards and Look lines. Re-anchor `card_shelters` in `history.json`, `other_history.json` and `node_index`. |
| 18 | low | Hoh Lake's `camp.water`, hazard `lunch_lake_landslide` | 2026 news (a dead bear in the lake, a single landslide report) sits in permanent fields, so it would show on 2027 trips. | Move it to the dated conditions overlay, with a last-confirmed date ("last we heard"). |
| 19 | low | Quote `oh_q28` | The drawable line "a shout that died when half uttered" literally breaks F.3's rule against drawable lines that mention a death. | Whitelist it as figurative, or drop it from the decks. |
| 20 | low | `gear_catalog.json` `plush_fox` | A plush fox mascot sits against 10.1's "the margin fox (and any fox)". | Creator's call: rename (a plush marmot?) or drop. |
| 21 | low | The shared Hoh Lake and C.B. Flats segment | The two files disagree: +463 ft in `hoh_olympus`, +410 in `sol_duc`. C.B. Flats' water text differs too. This matters only for M2. | Keep one copy at merge (lint G04 territory). |
| 22 | low | `camera_compact`, `camera_dslr`, `speaker_portable`, `drone_mini` | These are tagged `needs_battery` but have no battery stat. B.2 carries a small camera. | Add `battery_h` or `battery_days`. |
| 23 | low | `gear_catalog` sample kits | F.1's "loop in a day with a headlamp and 3 L" has no kit; `day_hike_sensible` carries 2 L. The canonical trap kit carries the WIC canister, which a day hike doesn't take. The quiz questions also have no sources in the research. | Add a 3-liter day kit and a day version of the trap kit to `rules/kits.json`. Source the twelve quiz questions. |

**Outside M1a (for later).** 93 segment fields in other regions are null: 45 in Elwha, 18 in Hamma Hamma, 14 in the Hoh, 10 in Dosewallips, 4 on the coast and 2 in South Quinault. Ingest derives most of them (E.4). The Aurora Creek segment's net gain is 340 ft off its endpoints.

## Resolution

Closed 2026-10-08 by editing the data files; `GAME_DESIGN.md` was not touched (the doc owner records the lead calls). Every JSON file still parses with Node, and a fresh check script passed: graph endpoints, condition and overlay ids, kit items, tags, epitaph decks and lore node ids all resolve. Routed again with the spur rule, the loop is still 18.4 mi by the crest either way and 18.7 through the basin, and every 4.3 and B.1 figure above still holds. Nothing was committed.

Every new number is either computed (it says how) or marked `estimate: true` with its evidence, so the harness can tune it against F.1.

### Item by item

| # | Status | How it was closed |
|---|---|---|
| 1 | Closed | Both Bogachiel summit segments now carry `through_route: false` and a `spur` block, and `bogachiel_peak` has `routing.spur_only`. The peak is an out-and-back from either junction (0.2 mi round trip), never a shortcut. The `_2n_classic` preset pins it as a `via`. |
| 2 | Closed | `park_rules.json` `climate.m1a_weather_inputs`: High-zone thunder days and fog days by month and by weather state, with sources and anchors (table below). |
| 3 | Closed | Same block: the fair / unsettled / wet / storm chain by month (Quillayute 1991-2020, with next-day odds), High-zone wet odds for each state (Buckinghorse), ridge wind (soundings and Hurricane Ridge gusts), and a Sol Duc valley station (Sappho 8 E). |
| 4 | Closed | Every Sol Duc camp now has `camp.group_site` and `camp.stock_site`. Seven Mile and C.B. Flats are group sites and Horse Head is a stock site. Deer Lake, Sol Duc Park and Cat Basin have `group_sites` or `stock_sites` counts that sit outside `sites`. |
| 5 | Closed (data) | The catalog's per-item stats are the source of truth (`gear_catalog.json` `night_model_stats`), and the doc's numbers are only fallbacks. Seven insulating items gained `wet_warmth_retained`. Regenerating the 7.9 and 8.13 examples is for the doc owner. |
| 6 | Closed | `beer_hazy_ipa_16oz` (Blue Hour Hazy IPA, 17.4 oz full, 0.55 L, 270 kcal, 0.5-oz empty can to pack out) and `pre_roll` (Second Growth, 0.2 oz, scented, M1b) are in the food catalog: 88 foods. |
| 7 | Closed | All 25 Sol Duc wildlife ideas were rewritten as moments, hazards and food thieves, with no helpers, sketches or collectibles. Twelve hazard ideas lost the old modes and companions, and the bear detour no longer goes "via Bogachiel Peak". |
| 8 | Closed | The `dark` deck was split into `dark_fall` and `dark_fog`, each dealing only lines whose cautions allow its base cause. A deck lint rule is in `epitaph_dice.lint`. |
| 9, 10, 12 | Closed earlier | Fixed in place (see above). |
| 11 | Closed | `sol_duc_high_divide.json` `m1a_play_inputs`: quota odds per camp, desk requests, ranger evening visits and on-trail rates, the permit-check rules, trail traffic for kind strangers, the no-canister visitor roll, the E.5 fields for all 47 loop nodes (`map_xy`, canopy, cold pools, water, views) and the crossings. The fire-ban odds for future years and the desk-request odds are in `park_rules.json`. |
| 13 | Closed | The book's name was also removed from nine idea strings in the other six regions. No region file names it now. |
| 14 | Closed earlier | Already fixed in the doc. |
| 15 | Data correct | `morgenroth_lake.game_notes` says phone-only. Deleting the E.4 bullet is a doc edit, handed to the doc owner. |
| 16 | Closed (data) | `m1a_play_inputs.places` gives a `snow_feature` (10.2 windows, snow-year shifts, estimate) to Bogachiel Peak, the rim, Heart Lake Junction (the chosen crest node), Lunch Lake and Heart Lake. The lakes' features are snowfields in sight, not at the shore. `bonfire_lily_weight` is 0 in M1a. The creator should confirm the windows. |
| 17 | Closed | `card_shelters` no longer points at Canyon Creek #1. The NRHP nomination shows that the Canyon Creek Shelter stands above Sol Duc Falls and was built by the CCC in 1939, so it has its own card, `card_ccc_sol_duc_falls_shelter`. A second card, `card_goats_gone`, is on the crest. The cards that need tribal consultation stay held. |
| 18 | Closed | Dated news left the permanent fields: the Hoh Lake dead bear, the Lunch Lake slide (its hazard moved into `conditions_2026` as a `hazard_card`), the 2026 fire-ban notes, blowdown notes, and the "2026 low-snow" text on 34 segments. All 18 conditions have `from`, `until` or `persists`, `last_confirmed` and `applies_to`. |
| 19 | Closed | `oh_q28` can no longer be drawn: 46 lines are dealable, down from 47. |
| 20 | Closed | `plush_fox` was removed, along with its now-unused `mascot` tag. 217 items. |
| 21 | Closed | The Hoh Lake to C.B. Flats segment is identical in both files: 0.5 mi, -430 ft (from the endpoints), the same hazards and notes. C.B. Flats' water text and group flag match too. |
| 22 | Closed | Camera, DSLR, speaker and drone have battery stats (`battery_days`, `battery_shots`, `battery_h`, `flight_min`), with glossary entries. |
| 23 | Closed | The kits `loop_in_a_day_3l` (headlamp, 3 L, 15.3 lb) and `day_gear_TRAP_no_canister` (no headlamp, 1 L) were added. A new file, `quiz_locals.json`, holds twelve quiz questions, each with a source. |

### The new High-zone weather

| Month | Thunder days | Crest in fog | Ridge wind |
|---|---|---|---|
| Jul | 1.3 | 26% of days | 12 mph, gale gusts 0.2 days |
| Aug | 1.5 | 23% of days | 12 mph, gale gusts 0.5 days |
| Sep | 0.9 | 27% of days | 15 mph, gale gusts 1.6 days |

- **Thunder (estimate).** Bracketed by the Blue Glacier station (6,906 ft, 1957-63: 0.3 to 0.5 thunder days a month), Quillayute and Stampede Pass, the NWS figure of 5-10 thunderstorm days a year for western Washington, and the NLDN state flash density. An unsettled August day has a 17% chance, and with the forecast spread a 30% day (B.6) is possible.
- **Fog (computed, with an estimated ridge factor).** From cloud at the 850 hPa level in the Quillayute soundings, 1991-2020, multiplied by 1.25 for the ridges. Afternoon fog is 12-14%.
- **The chain (computed).** In August: fair 72%, unsettled 17%, wet 9%, storm 3%.
- **Fire bans (estimate, from the 2012-2026 record).** The chance of a ban in a future year is 45% on Aug 1, 60% on Aug 15 and 70% on Sep 1.

### Lead calls the data now carries

- **Desk requests (lead call 1).** 70% midweek and 40% on weekends, for Bruce's Roost, Cat Basin and Hidden Lake in M1a. Long Lake, Sol Duc Lake and the Morgenroth call wait for M1b.
- **The no-canister night (lead call 4).** A nightly visitor roll in `food_storage_visitors`. The `bear_in_camp` idea says it is allowed and is not a hard block.
- **The off-permit ranger (lead call 5).** A forced, uncapped nightly roll that plays the permit-check card. The Director's cap covers legal nights only.
- **Seeds (lead call 8).** Quota and desk rolls are keyed by hash(seed, date, camp), and *Try this trip again* copies the stamped permit.

Lead calls 2, 3, 6 and 7 are doc and engine rules. Their numbers belong in `rules/tuning.json` (M1a), not in the research files.

### Left for others

- **The doc owner:**
  - delete the E.4 Morgenroth bullet;
  - refresh E.4's list of known fixes (N17): rentals, the Morgenroth note, the beer and the fox are now fixed at the source, while ingest still drops the journal stats;
  - update the counts in 5.4, 14.1 and E.5 (88 foods, 217 items);
  - regenerate 7.9 and 8.13 from item stats.
- **BUILD_PLAN 3.5.** It still says the beer is added at ingest and the fields are `group_only` and `stock_only`. The data now has the beer at the source and uses `camp.group_site` and `camp.stock_site`.
- **The B.2 golden seed (F.4).** It needs Lunch Lake open on a Friday and a Saturday, about a 4% draw at the new August weekend odds.
- **The creator:**
  - confirm the Bonfire Lily windows;
  - say whether to add their own quiz questions.
- **Outside M1a.**
  - Mixed group and stock camps in other regions (Five Mile Island, Lewis Meadow, Elk Lake and others) get the same flags in their milestones.
  - Other regions' idea fields still mention sketches and the journal. 14.3 treats them as void.

### Release check

Checked again on 2026-10-08, before the build. Items 1 to 23 are all closed. What the list above left for others:

| Left for | Item | Now |
|---|---|---|
| The doc owner | The E.4 Morgenroth bullet; E.4's known fixes (N17); the 5.4, 14.1 and E.5 counts; 7.9 and 8.13 from item stats | Done in `GAME_DESIGN.md`: 217 items and 88 foods wherever the doc counts them, and E.4 lists the fixes now at the source as fixed |
| `BUILD_PLAN.md` | 3.5's beer and `group_only` / `stock_only` | Done: 3.5 now lists every fix where it landed in the data |
| The engine | The B.2 golden seed (Lunch Lake open Friday and Saturday) | Session 9 finds and freezes it. Not a data gap |
| The creator | The Bonfire Lily windows; their own quiz questions | Optional, by M1b. The lily is weight 0 in M1a, and the quiz has twelve sourced questions |
| Later milestones | Mixed group and stock camps, and idea text, in the other regions | Each region's milestone (M2 on); ingest voids conflicting ideas until then |

None of these blocks M1a. Every JSON file under `design/data/` parses with Node.
