# Fact check: Olympic National Park dataset

**Checked:** 2026-10-08. **Scope:** `design/data/regions/*.json` (6 files) and `design/data/park_rules.json`. All 7 files parse as valid JSON after the edits.

**Status:** done for the priority list in the brief. The items under "Still uncertain" are open.

## Sources

All were fetched on 2026-10-08 unless noted.

- **NPS area pages** (nps.gov/olym/planyourvisit/…). Last-updated dates in parentheses:
  - Hoh River Trail (2026-01-21), Climbing Mount Olympus (2026-01-21), Hoh Lake Trail
  - Royal Basin (2026-01-28), Grand Valley (2026-01-21), Lake Constance Route (2026-01-29)
  - High Divide Loop (2025-04-11), Appleton Pass
  - East Fork Quinault (2026-05-22), North Fork Quinault, North Fork Skokomish, Duckabush (2026-03-30), West Fork Dosewallips
  - Elwha River Trail
  - South Coast Route (2026-08-19), North Coast Route (2026-08-24)
- **NPS park-wide pages:**
  - Wilderness Reservations (2026-02-12), Food Storage (2026-07-07), Wilderness Regulations (2026-03-30)
  - Wilderness Trail Conditions (2026-09-30), Alerts & Conditions (2026-10-04), Current Road Conditions (2026-08-07)
  - Fire Conditions & Updates (2026-09-18), WIC page (2026-09-29)
  - News releases of 2026-08-11 and 2026-08-26
- **Recreation.gov** permit 4098362. Permitcontent API: text for all 299 camp areas, record modified 2026-09-30. The cached copy was pulled 2026-10-07.
- **USFS** Olympic National Forest alerts page (live, 2026-10-08).
- **WSDOT** US 101 Hoh River Bridge closure notice (Sept 2026).
- **Press:** Peninsula Daily News and Yakima Herald, used only where no official source exists.

---

## 1. Permits, quotas and bear canisters (priority 1)

### Confirmed, no change needed
- **Permit system.** Recreation.gov permit 4098362 is first-come first-served. The Recreation.gov API shows `has_lottery: false`, so park_rules' lottery claim is raised from medium to high confidence. The summer season (May 15 - Oct 15) opens April 15 at 7 AM Pacific.
- **Fees.** $8 per person per night for ages 16 and over; $6 reservation fee; $45 annual wilderness pass. The NPS worked example matches: 2 adults for 4 nights costs $70.
- **Quota areas.** The list in park_rules matches the 10 areas on the NPS reservations page:
  - Ozette coast (Yellow Banks to Point of the Arches)
  - Royal Basin
  - Lake Constance
  - Upper Lena Lake
  - East Fork Quinault / Enchanted Valley (trial)
  - Flapjack Lakes / Gladys Divide
  - Grand and Badger Valleys
  - Sol Duc / Seven Lakes Basin / Mink Lake / Cat Basin / Little Divide
  - Hoh Lake / C.B. Flats
  - Hoh River Trail: Elk Lake, Martin Creek, Glacier Meadows, and all group and stock sites
- **Group size.** 12 people and 8 stock. Designated group sites are required in Sol Duc, Hoh Lake, Hoh River, Grand Valley, Upper Lena and Lake Constance.
- **Canisters are required in every wilderness area**, not just certain zones:
  - The NPS food-storage page (2026-07-07) says "required in all wilderness areas".
  - All **156 of 156** publicly listed Recreation.gov camp areas say canisters are required and that "Hanging food … whether on a bear wire system or self-constructed bear hang, is prohibited."
  - This resolves the "all vs. most" (PNT Association) question. `bear_can_required` is already true at every NPS wilderness camp in all six files. The national-forest camps (Buckhorn and The Brothers Wilderness) are correctly false.
  - The zone-by-zone pages agree: Seven Lakes Basin/High Divide, Royal Basin, the coast ("entire Olympic National Park Wilderness Coast"), Grand Valley, Lake Constance, Hoh River/Glacier Meadows and Enchanted Valley. Enchanted Valley also requires drinks other than water to go in the can.
- **Ozette coast.**
  - Quota zone is Yellow Banks to Point of the Arches; Shi Shi is outside it but still needs a permit and a Makah pass.
  - No fires from the Wedding Rocks headland to the headland north of Yellow Banks, which covers Wedding Rocks, Sand Point and South Sand Point. Yellow Banks itself allows fires. The data matches.
  - Seafield Creek's maximum group is 6.
- **Flapjack Lakes / Gladys Divide.** Quota area, no fires, two vault toilets, closed in 2026. The data matches.
- **Enchanted Valley.**
  - Trial quota of 208 users or 30 permits per night is still described on the NPS page (2026-02-12). 2026 is the third, and probably last, trial season. park_rules notes this now.
  - The 2024 WTA figure of "12 permits/night" has no NPS support.
- **Glacier Meadows / Elk Lake.**
  - Glacier Meadows: 11 sites + 1 group site. Elk Lake: 7 sites + 1 group site; its stock site is 0.5 mi below the lake, at Martin Creek.
  - Pit toilets at Five Mile Island, Olympus Guard Station, Lewis Meadow, Elk Lake and Glacier Meadows.
  - The ladder is 0.25 mi before camp; as of 6/14/26 it had 3 broken rungs and 1 missing.
  - No camping between Glacier Meadows and the Blue Glacier.

### Changed
| File | Item | Was | Now | Source |
|---|---|---|---|---|
| northeast_dose | `royal_creek_camp.camp.fires_allowed` | true | **false** | NPS Royal Basin page (2026-01-28): "No campfires in Royal Basin", and Royal Creek is listed as one of the basin's three camp areas. The camp is also near 3,700 ft. Recreation.gov's Royal Creek text still says fires are permitted; the conflict is noted in the camp notes. |
| south_quinault_skok + elwha_hurricane | `low_divide.camp.fires_allowed` | true / null | **false** (both files) | The NPS North Fork Quinault page puts Low Divide at 3,600-3,602 ft and bans fires above 3,500 ft. Recreation.gov's text says fires are permitted; the conflict is noted. NPS also says Low Divide has 3 + 2 sites and no camping near Lake Margaret or Lake Mary. |
| park_rules | `food_storage.hanging_and_wires` | "not compliant", medium confidence | "PROHIBITED", high confidence | Recreation.gov division text (all 156 public camps) |
| park_rules | `food_storage.rule` | — | Notes that the all-wilderness rule is confirmed | NPS food storage page plus Recreation.gov |
| park_rules | `campfires.named_no_fire_areas` | — | Adds Royal Basin (all camps), Grand Valley, Appleton Pass/Oyster Lake, Hoh Lake and Low Divide. Rewords the Hoh line to cover both NPS wordings ("at or above Elk Lake" and "above Martin Creek"). | NPS area pages and trail conditions |
| park_rules | Upper Lena Lake quota entry | — | Adds the Recreation.gov facts: 7.3 mi, about 3,850 ft, no fires, 6 per site, composting toilets, Lena Creek ford. Also notes that no region file models this trail. | Recreation.gov, NPS trail conditions |
| park_rules | Grand/Badger Valley quota entry | — | Adds the NPS scope: Deer Park to Obstruction Point (Roaring Winds), Obstruction Point to Grand Pass, Badger Valley, Lake Lillian | NPS reservations page |

## 2. Roads, trails, bridges and facilities, 2025-2026 (priority 2)

### Confirmed against NPS pages
| Item | Status | NPS date |
|---|---|---|
| Hurricane Ridge Road | Open | 5/4/26 |
| Hurricane Ridge day lodge | Burned May 2023. Still in pre-design (Anderson Hallas Architects); design and RFP planned for 2027, construction from 2028 at the earliest (May 2026 reporting). No potable water on the ridge in 2026; portable toilets. | |
| Olympic Hot Springs Road (Elwha) and Whiskey Bend Road | Closed to vehicles at Madison Falls. Open to walkers, bikes and leashed dogs. | Road page entry 5/7/21, still listed |
| Dosewallips Road | Closed to vehicles at a washout outside the park, 6.5 mi from the old campground. The dataset puts parking at the road end 1.3 mi below the NPS washout point; parking to the ranger station totals 6.5 mi, matching NPS. | Road page entry 8/25/17 (old but still current) |
| Graves Creek Road | Open via North Shore Road only. RVs and trailers prohibited. | 5/28/26 |
| South Shore Road | Washed out at about mile 8 (Jefferson County). | 11/13/25, reconfirmed 10/4/26 |
| North Fork Quinault Road | Open. | 5/5/26 |
| Upper Hoh Road | Open. | 5/5/26 |
| Staircase | Road (FS-24) and developed area reopened 7/8/26: campground, ranger station, Rapids Loop. **All other Staircase wilderness trails and camps remain closed** after the 2025 Bear Gulch Fire. | Fire page 9/18/26, trail conditions 9/30/26, alerts 10/4/26 |
| Deer Park Road | Open. | 6/9/26 |
| Obstruction Point Road | Open; 7.8 mi from Hurricane Ridge. | 6/17/26 |
| Mora Road | Closed beyond Mora Campground through Oct 15, 2026. | |
| Quinault WIC | Closed for 2026. The WIC page (9/29/26) shows "Current Hours: Closed"; the "Memorial Day-Sept" text is only its normal season. Conflict resolved in park_rules. | 9/29/26 |
| (360) 565-3131 road and weather line | Confirmed on the NPS road page; raised from "2024" to high confidence. | 8/7/26 |

Closed Staircase trails and camps, as listed by NPS:
- **Trails:** North Fork Skokomish (Rapids Loop to Home Sweet Home), Shady Lane, Four Stream, Flapjack Lakes, Gladys Divide, Black & White Lakes, Wagonwheel Lake, Home Sweet Home, and Six Ridge from Belview / Mt. Olson junction to the North Fork.
- **Camps:** Beaver Flats, Slide Camp, Spike Camp, Big Log, Camp Pleasant, Nine Stream, Two Bear, First Divide, Smith Lake, Donahue Creek, Black and White Lakes, Flapjack Lakes, Madeline Creek and Wagonwheel Lake.

The SQ file already tagged these as `trail_closed_2026`.

### Changed
| File | Item | Change | Source |
|---|---|---|---|
| park_rules `current_conditions.roads.items` | **New entry: US 101 Hoh River Bridge** | One lane with signals at 25 mph since 2026-07-14. Full closures Sept 24-29, Oct 1-6, and **5 am Oct 8 - noon Oct 13, 2026**. The detour is 4+ hours around Hood Canal. During closures, the Kalaloch, Ruby, Queets and Quinault side is cut off from Forks. | WSDOT; NPS "Highway 101 Closure at Hoh River Bridge" |
| park_rules Upper Hoh Road history | Added the **2025-12-10** atmospheric-river flood near MP 10, which closed the road for about 4 weeks. This is separate from the Dec 2024 washout. | Yakima Herald/AP quoting NPS |
| south_quinault_skok `conditions_2026` | Added the Hoh River Bridge closure note: west-side access to Quinault from Forks crosses it. | WSDOT |
| south_quinault_skok segments `graves_creek_primitive_trail_junction`-`success_creek_camp`-`wynoochee_pass_trail_junction`-`sundown_lake_trail_junction` | Tagged `trail_closed_2026`. The NPS conditions row "Six Ridge Primitive Route, Graves Creek Trailhead to Lake Sundown, 7.3 mi" (updated 9/29/26) still says "Trail closed as of 8/1/25 due to Bear Gulch Fire". The row may be stale, but it is the official listing. The 0.3-mi Lake Sundown spur stays open so the reopened Lake Sundown-Belview section can be reached over Sundown Pass. The trip `graves_creek_lake_sundown` now says CLOSED. | NPS trail conditions |
| park_rules `campfire_ban_2026`, plus the Elwha and Sol Duc files | Stage 2 start date unified to **Aug 7, 2026**; the Elwha and Sol Duc files said Aug 11, which is only a news-release date. Added that the USFS order ran Aug 7 - Oct 1 and is no longer listed on the Olympic NF alerts page (fire danger "Moderate", checked 2026-10-08). No NPS rescission was found; the NPS fire page (9/18) and alerts page (10/4) list no ban. | USFS alerts; NPS releases of 8/11 and 8/26 |

## 3. Mileages and camp lists for the signature trips (priority 3)

Shortest-path distances were computed over the merged graph after the edits.

| Route | Dataset | Official | Verdict |
|---|---|---|---|
| Hoh trailhead to Glacier Meadows | 17.4 | 17.4 (NPS trail page) | ✓ |
| Hoh trailhead to Hoh Lake | **14.7** (was 14.4) | 14.7 (NPS) | fixed |
| Hoh Lake Trail, junction to Bogachiel Peak junction | **6.4** (was 6.1) | 6.4 (NPS) | fixed |
| High Divide loop | 18.4 | 18.2 (NPS), 19 (WTA) | ✓ within tolerance |
| Sol Duc trailhead to Appleton Pass | 7.4 | 7.4 (NPS) | ✓ |
| Upper Dungeness trailhead to Royal Lake | 7.2 | 7.2 (NPS) | ✓ |
| Graves Creek to Enchanted Valley | 13.1 (camps at 2.5 / 3.25 / 6.9 / 9.9) | 13 (NPS; trail guide 2.5 / +0.75 / +3.65 / +3 / +3.2) | ✓ |
| Enchanted Valley to Anderson Pass | 5.2 | 5.2 (NPS) | ✓ |
| Dose Forks to Anderson Pass | 9.1 | 9.1 (NPS) | ✓ |
| Obstruction Point to Grand Lake | 3.7 | 3.7 (NPS) | ✓ |
| Grand Lake to Moose Lake | **0.5** (was 0.8) | 0.5 (NPS) | fixed. The Obstruction Point to Cameron junction chain now equals NPS's 7.7 mi. |
| Lake Constance route | **1.8** (was 2.0) | 1.8 (NPS route page and Recreation.gov); the conditions table rounds to "2 mi" | fixed. The lake is now 6.8 mi from parking, matching Recreation.gov. |
| Deer Park to Obstruction Point (Grand Ridge) | 7.4 | 7.4 (NPS) | ✓ |
| Whiskey Bend to Low Divide | 28.4 | 28.4 (NPS) | ✓ |
| North Fork Quinault to Low Divide | 15.7 | 16 (NPS headline); the trail guide's splits sum to 15.7 | ✓ |
| Staircase to First Divide | 12.7 | 12.7 (NPS trail page); 12.5 (conditions table) | ✓ |
| Duckabush park boundary to O'Neil Pass | 16.1 | 16.1 (NPS page) | ✓. The conditions table's "10.3 mi boundary to Home Sweet Home junction" conflicts and is still listed below. |
| South Coast, Third Beach trailhead to Oil City | 17.3 | 17 (NPS); legs 1.4 / 2.6 / 2.4 / 4.6 / 6.1 | ✓ |
| North Coast, Ozette to Rialto | 19.7 | 20 (NPS) | ✓ |
| Shi Shi to Ozette | 15.5 | 15 (NPS) | ✓ |

**Hoh River Trail camps.** The camps are One Mile (0.9), 1.4 Mile, Mount Tom Creek (2.9), 3.3 Mile, Five Mile Island (5.0), Happy Four (5.7), the braid fords near mile 8, Olympus Guard Station (9.1), the Hoh Lake junction (9.7), Lewis Meadow (10.4), 12.4 Mile, the 13.1/13.2/13.3 Mile sites with the High Hoh Bridge, Martin Creek (15.0), Elk Lake (15.3), the ladder (17.15), Glacier Meadows (17.4), and the Blue Glacier lateral moraine (18.5). Site counts and toilets match the NPS Hoh River Trail page.

**Tide gates.** All of the NPS-published restrictions are carried in segment notes at the right places:
- South Coast: Diamond Rock 2 ft with no overland route; Scott Creek to Strawberry Point 4 ft; the cove 3.0 mi south of the Third Beach trailhead 4.5 ft.
- North Coast: 2.4 mi north of Rialto 5 ft; Cape Johnson 4 ft with no overland; 5.1 mi north of Rialto 5.5 ft; 7.9 mi south of Ozette 6 ft; north of Yellow Banks 5 ft; 0.7 mi south of the Ozette River 5 ft and 4 ft; Point of the Arches to Seafield 4-6 ft.

### Changed
| File | Item | Was | Now | Source |
|---|---|---|---|---|
| sol_duc_high_divide | segment `c_b_flats_group_site`→`hoh_lake_trail_junction` | 4.2 mi | **4.5 mi** | NPS Hoh Lake Trail page (Hoh Lake is 14.7 mi from the Hoh trailhead) |
| hoh_olympus | the same segment, gain/loss | +3,484 / -406 | **+3,160 / -90**, matching the Sol Duc copy | consistency (DEM) |
| sol_duc_high_divide | trip `sol_duc_to_hoh_traverse` day 3 | 5.3 mi (total 25.2) | **5.6 mi (25.5)** | follows from the above |
| elwha_hurricane | segment `grand_lake`→`moose_lake` | 0.8 mi | **0.5 mi** | NPS Grand Valley page; NPS 7.7-mi trail total |
| elwha_hurricane | trip `grand_valley_backpack` | 4.5 / 3.8 / 5.4 (13.7) | **4.2 / 3.8 / 5.1 (13.1)** | follows from the above |
| northeast_dose | segments to Half Acre Rock and on to Lake Constance | 0.8 + 1.2 | **0.7 + 1.1** | NPS route page and Recreation.gov |
| northeast_dose | trip `lake_constance_overnight` | 7.0 + 7.0 (14.0) | **6.8 + 6.8 (13.6)** | follows from the above |
| coast | `scott_creek.camp.toilet` | true | **false** | NPS South Coast page (2026-08-19): "No privy is currently available at Scott Creek". A Sept 2026 trip report saw a usable privy; noted. |
| coast | `cedar_creek_camp.camp.toilet` | false | **true** | NPS North Coast page (2026-08-24) privy list |
| elwha_hurricane | `camp_wilder.camp.toilet` | null | **true** | NPS Elwha River Trail page privy list |
| park_rules | `leave_no_trace_and_waste` | — | Cathole depth is 6-8 in, not 8. Blue bags are **required** on Mount Olympus (available at the Hoh VC and the Port Angeles WIC). Climber camps only at Caltech Rocks and Snow Dome. Adds the 2026 coast privy list. | NPS Climbing Mount Olympus page, coast route pages |

## 4. Graph and id checks (priority 4)

| Id | Finding | Fix |
|---|---|---|
| `slide_camp` | **Collision.** Two different places shared one id: a national-forest camp on the upper Gray Wolf (about 2.3 mi past the Camp Tony junction, about 0.8 mi before the park boundary; confirmed by USFS and Mountaineers) and the NPS camp 1.5 mi up the North Fork Skokomish (Recreation.gov; closed in 2026). | Renamed `slide_camp_gray_wolf` (northeast_dose) and `slide_camp_skokomish` (south_quinault_skok) in nodes, segments, itineraries, hazards and rules. |
| `elk_mountain_trail_junction` | **Second collision, not in the original graph check.** In elwha_hurricane it is the junction on the Badger Valley floor (5,350 ft). In northeast_dose it is the Grand Ridge high point (6,625 ft). NPS: "Elk Mountain Primitive Trail, Elk Mountain to jct. Badger Valley Trail, 1.3 miles, 6650'-5600'". The shared id let routes jump 1,275 ft between the two ends for free. | Renamed `badger_valley_elk_mountain_junction` (Elwha) and `elk_mountain_grand_ridge_junction` (NE), and **added the 1.3-mi Elk Mountain Primitive Trail segment** in elwha_hurricane. |
| `honeymoon_meadows` | Resolves to the northeast_dose node. However, the SQ segment from LaCrosse Pass ended at the camp, skipping the 0.5 mi from the camp up to the junction. | The segment now ends at NE `lacrosse_pass_junction` with the same values as NE's copy (3.1 mi). SQ trip `white_mountain_loop_from_dosewallips` day 5 goes from 11.7 to **12.2** mi; the total from 58.6 to **59.1**. |
| `obstruction_point_trailhead`, `grand_pass`, `hayden_pass`, `anderson_pass`, `low_divide`, `happy_lake_ridge_junction` | Same places, but coordinates differed slightly. | Aligned. The non-owning file now uses the owner's values. |
| `happy_lake_ridge_junction`, `c_b_flats_group_site` | Elevations differed (4,970/4,960 and 4,091/4,080). | Aligned to 4,970 and 4,091. |
| `low_divide` (sites, fires, toilet), `appleton_pass` (toilet), `cat_basin` (toilet) | Camp fields differed. | Aligned: low_divide has 5 sites, no fires and a toilet. Appleton has no toilet, per NPS "Toilet Facilities: None". |
| `lake_margaret`, `cat_basin`, `c_b_flats_group_site`, `lacrosse_pass`, `hoh_lake_trail_junction`, `appleton_pass`, `anderson_pass`, `hayden_pass`, `grand_pass`, `low_divide`, `happy_lake_ridge_junction`, `obstruction_point_trailhead` | Confirmed each is one real place shared between two files. | Only the field alignment above. |

After the edits:
- 12 ids are intentionally shared, and all of them agree on elevation, coordinates and camp fields.
- No segment, itinerary, hazard, wildlife or trailhead references an undefined node.
- No itinerary day is shorter than the shortest graph path. The only exception is the off-trail Bailey Range, whose legs have null mileage on purpose.

## Still uncertain

1. **2026 campfire ban inside the park.** The USFS order expired Oct 1 and is no longer posted, but no NPS rescission was found. Default to the normal rules and treat it as unconfirmed.
2. **Mora Road reopening date.** NPS says Oct 15, 2026. Recreation.gov camp names say "no access via Rialto 7/8-11/9", and Chilean Memorial and Hole-in-the-Wall show zero availability until Nov 10. Not resolvable today.
3. **Fires: Recreation.gov vs NPS.** Recreation.gov division text allows fires at Royal Creek, Low Divide, Falls Camp, Lower Cameron and Martin Creek. NPS area pages or the 3,500-ft rule say otherwise for Royal Creek and Low Divide, and the data now follows NPS for those two. Falls Camp (about 3,900 ft) and Lower Cameron (about 3,630 ft) were already set to no fires. Martin Creek stays fires-allowed: Recreation.gov says permitted, NPS conditions say "at or above Elk Lake", but the Hoh page and the 2024 notice say "above Martin Creek".
4. **Graves Creek to Lake Sundown closure.** The NPS row may be stale. The fire page doesn't list this section, and the same page reopened Lake Sundown to Belview. It is marked closed here until NPS changes it.
5. **Duckabush:** NPS gives 16.1 mi from the boundary to O'Neil Pass (used here), while the conditions table gives 10.3 mi from the boundary to the Home Sweet Home junction (the data has 11.3). **North Fork Quinault:** 15.7 vs the 16-mi headline. **High Divide loop:** 18.4 vs 18.2.
6. **Enchanted Valley.** No final decision on the trial quota, which ends after 2026. No chalet decision has been published (the NPS planning page shows nothing after 2021). Existing medium-confidence text was kept.
7. **Gaps in coverage.**
   - **Upper Lena Lake** (an NPS quota area) is not modeled in any region file.
   - Closed or hidden Staircase camps (Beaver Flats/Four Stream, Donahue Creek, Madeline Creek), Lake of the Angels (Putvin), Hoh Camp Pan, and Elwha Chateau Camp, Upper Lake Mills, Blue Lake and Three Horse Lakes are hidden on Recreation.gov and have no nodes.
   - No mileages were invented for any of them.
8. **Toilets.** Field reports and NPS disagree at Scott Creek and Cedar Creek; the data follows NPS. Humes Ranch, Lake Angeles, Heather Park and Big Log are still null.
9. **Six Ridge Pass and Promise Creek Pass** are still unlocated. **Twelve Mile camp** on the North Fork Quinault is a hidden Recreation.gov division with no node.
10. **Elk Lake and Glacier Meadows season.** The "June 15 - Oct 15, 2026" reservation season comes from the researchers' Recreation.gov availability snapshot and was not re-verified. NPS says only that high camps are usually reservable mid-July to mid-October.
11. **Lake Constance elevation:** 4,700 ft (conditions table) vs 4,800 ft (route page high point).
12. **Hurricane Ridge winter 2026-27 schedule** is not yet published.
13. **Old pre-2025 context** remains flagged in the files: the 2015 Enchanted Valley bear closure, the 2014 chalet move, the 2009 hanging standard, the 2017 Dosewallips road entry, and the 2021 Olympic Hot Springs Road entry, which is old but still current.
14. **Gear catalog** (out of scope, for the gear agent): NPS now says blue bags are *required* on Mount Olympus, which resolves that catalog's "wag bags are common practice" uncertainty.

---

## 2026-10-09: the rapid-fire round

**Checked:** 2026-10-09, for decisions 41 to 65 and Lead calls 29 to 43 in `GAME_DESIGN.md`. All sources were fetched that day. **Changed in the data:** `gear_catalog.json` gains two instruments (R9); both catalogs still parse as valid JSON.

### R1. Razor clams: Washington's rules (Lead call 37)

- **Keep the first 15.** WDFW: *"Diggers must retain the first 15 razor clams harvested regardless of clam size or condition."* WAC 220-330-170(1) makes it unlawful to return any razor clam to the beach or water *"regardless of size or condition"*, and every clam taken counts toward the digger's limit. So a broken clam counts toward the 15.
- **Daily limit:** 15, with no minimum size (WAC 220-330-010(1)(d)). Digging is legal only when an emergency rule opens a beach (WAC 220-330-160), and such a rule can set another limit; some 2022 digs allowed 20. A person may hold only one daily limit.
- **Gear:** by hand, shovels, or cylindrical cans, tubes or hinged digging devices (WAC 220-330-120(2)); a round tube at least 4 in across, an oval one at least 4 by 3 in. Shovels and clam guns are both legal, so the game's shovel only is a design choice, not the law.
- **Your own limit, your own container:** no digger may take part of another's limit, except a helper holding a Designated Harvester card for a digger with a disability (WAC 220-305-120). In the field each limit goes in a separate container (WAC 220-330-120(8)); diggers may share equipment.
- **License:** from age 16 (WDFW's 2025 releases).

Sources: [WDFW razor clam species page](https://wdfw.wa.gov/species-habitats/species/siliqua-patula); [WAC 220-330-170](https://app.leg.wa.gov/wac/default.aspx?cite=220-330-170), [-010](https://app.leg.wa.gov/wac/default.aspx?cite=220-330-010), [-120](https://app.leg.wa.gov/wac/default.aspx?cite=220-330-120), [-160](https://app.leg.wa.gov/wac/default.aspx?cite=220-330-160); [WAC 220-305-120 (2023)](https://lawfilesext.leg.wa.gov/law/WACArchive/2023/htm/WAC%20220%20%20TITLE/WAC%20220%20-305%20%20CHAPTER/WAC%20220%20-305%20-120.htm); [WDFW razor clam regulations](https://wdfw.wa.gov/fishing/shellfishing-regulations/razor-clams); [WDFW, a 20-clam dig](https://wdfw.wa.gov/news/wdfw-approves-9-days-razor-clam-digs-beginning-april-29-daily-limit-20-clams). Confidence: high.

### R2. Kalaloch and Mocrocks (Lead call 37)

- **Kalaloch is inside the park:** NPS calls it *"located within Olympic National Park."* The dig beach runs from South Beach Campground north to Brown's Point, just south of Beach Trail 3 (WDFW: *"from the South Beach campground north to ONP Beach Trail 3"*); it is Area 6 in the WAC. NPS says razor clam harvest on the rest of the park's coast *"is always closed."*
- **Who decides:** the park opens or closes Kalaloch. In 2006 NPS approved the Kalaloch digs while WDFW approved the other four beaches; NPS itself closed Kalaloch in 2011 and cancelled the 2022-23 season. Park, Quinault Indian Nation, Hoh Tribe and WDFW biologists survey the beach together, and WDFW lists it among its five management beaches, co-managed with the tribes. State rules (license, limit, gear) still apply.
- **How rarely it opens:** NPS (Oct 12, 2022): *"The last full harvest season was in 2009,"* with *"either full or partial harvest closures occurring in 16 of the last 17 years."* Since then: a dig in January 2017, the first since 2012; one set for January 19-21, 2019 and cancelled by the federal shutdown; and the last dig held there, in February 2019. None in 2021-22, 2022-23 (small clams, linked to the NIX gill pathogen) or 2024-25; not on the 2025-26 schedules, and the tentative 2026-27 schedule (Oct 9 to Dec 27) lists only the four southern beaches. As of 2026-10-09 it has gone about seven and a half years without a dig, so a rare special dig is accurate.
- **Mocrocks** is WDFW razor clam Area 5, in Grays Harbor County: *"from the Copalis River to the south boundary of the Quinault Indian Reservation,"* taking in Iron Springs, Roosevelt Beach, Seabrook, Pacific Beach and Moclips. It is well outside the park: the reservation's whole coastline lies between it and Kalaloch. It is one of WDFW's four regularly opened beaches (with Long Beach, Twin Harbors and Copalis) and the nearest regular beach south of Lake Quinault. WDFW: *"Razor clam digging in 2021-2022, 2024-2025, and 2025-2026 was open the entire season."*
- **This week:** on Oct 6, 2026 WDFW postponed the season's first digs (Oct 9-14) on all four beaches, over rising domoic acid.

Sources: [NPS, 2022](https://www.nps.gov/olym/learn/news/razorclam2022.htm); [NPS, an October dig](https://www.nps.gov/olym/learn/news/october-razor-clam-dig.htm); [NPS, 2011](https://www.nps.gov/olym/learn/news/2011-razor-clam-harvest-suspended.htm); [WDFW razor clam regulations](https://wdfw.wa.gov/fishing/shellfishing-regulations/razor-clams); [WDFW, the January 2019 closure](https://wdfw.wa.gov/newsroom/news-release/wdfw-closes-kalaloch-beach-razor-clamming-jan-19-21-digs-proceed-twin-harbors-mocrocks-and-copalis); [WDFW emergency rule, Dec 2019](https://wdfw.wa.gov/fishing/regulations/emergency-rules/razor-clam-digs-approved-dec-23-26-27-28-and-29-2019-12); [Northwest Sportsman, 2017](https://nwsportsmanmag.com/first-razor-clam-dig-since-2012-set-for-kalaloch-jan-8-9/); Peninsula Daily News ([1](https://www.peninsuladailynews.com/?p=191257), [2](https://www.peninsuladailynews.com/?p=210815)). Confidence: high.

### R3. Sunrise over the Olympics (decision 49, Lead call 34)

**Method:** NOAA's solar position equations, with sunrise when the true solar zenith reaches 90.833° (the sun's upper edge on a sea-level horizon, with standard refraction), for 2026. The US Naval Observatory's API agrees to the minute on every date tested (Lake Quinault: Jun 15, Jun 21, Oct 31, Dec 21, Dec 31, Jan 1; Mount Olympus: Jun 21, Dec 21).

**Lake Quinault's center** (47.47 N, 123.86 W), the point the cabin's sky and the daily's opening use:

| Date, 2026 | Sunrise, Pacific | UTC |
|---|---|---|
| Jan 1 (the latest) | 8:03:07 am PST | 16:03:07 |
| Mar 7, the day before DST | 6:43:50 am PST | 14:43:50 |
| Mar 8, DST begins | 7:41:53 am PDT | 14:41:53 |
| Mar 20 | 7:17:56 am PDT | 14:17:56 |
| Jun 15 and 16 (the earliest) | 5:17:42 am PDT | 12:17:42 |
| Jun 21 | 5:18:18 am PDT | 12:18:18 |
| Sep 23 | 7:03:51 am PDT | 14:03:51 |
| Oct 9 | 7:25:50 am PDT | 14:25:50 |
| Oct 31 (the latest PDT) | 7:57:58 am PDT | 14:57:58 |
| Nov 1, DST ends | 6:59:28 am PST | 14:59:28 |
| Dec 21 | 8:00:21 am PST | 16:00:21 |

- Every day from June 11 to June 20 is within 30 seconds of the earliest. Sunrise is 8:00 am PST or later on Jan 1-12 and Dec 21-31; Dec 31 is 8:03:06 and Jan 2 is 8:03:05.
- **So the daily opens** between 12:17:42 UTC (June 15-16) and 16:03:07 UTC (Jan 1). A forecast bake finished before about 12:00 UTC always comes first; the morning job's 4:45 am Pacific cutoff is 11:45 UTC in summer.
- **Mount Olympus** (47.80 N, 123.71 W), for comparison: earliest 5:15:37 am PDT (Jun 15-16), Jun 21 5:16:12, Dec 21 8:01:08 PST, latest 8:03:51 PST (Jan 1, Dec 31 the same). About 2 minutes earlier than the lake in June, and under a minute later in deep winter.
- **A correction:** the chat's "about 5:15 am in June and 7:55 am in December" is slightly off for the lake's center. Use about 5:17 am in mid-June and a little after 8:00 in winter.

Sources: [NOAA solar calculation details](https://gml.noaa.gov/grad/solcalc/calcdetails.html); US Naval Observatory one-day API for [Jun 21](https://aa.usno.navy.mil/api/rstt/oneday?date=2026-06-21&coords=47.47,-123.86&tz=-8&dst=true), [Dec 21](https://aa.usno.navy.mil/api/rstt/oneday?date=2026-12-21&coords=47.47,-123.86&tz=-8&dst=true), [Jan 1](https://aa.usno.navy.mil/api/rstt/oneday?date=2026-01-01&coords=47.47,-123.86&tz=-8&dst=true) and [Olympus, Jun 21](https://aa.usno.navy.mil/api/rstt/oneday?date=2026-06-21&coords=47.80,-123.71&tz=-8&dst=true). Confidence: high.

### R4. The WIC's bear canister loans (Lead call 33)

- **Confirmed** on the NPS WIC page (updated 2026-09-29) and food-storage page (2026): canisters are required for any overnight stay in the park's wilderness; they *"are available for loan from Wilderness Information Centers during business hours"*; *"While we do have a large supply of canisters, we occasionally run out over exceptionally busy weekends"*; and *"We do not reserve canisters in advance."* Neither 2026 page names a fee, donation or deposit.
- **The Port Angeles WIC** is at the Olympic National Park Visitor Center, open daily all year except Thanksgiving and Christmas; the WIC page shows 9 AM to 5 PM (one search snippet said 9 to 4).
- **Quinault:** the WIC page shows the Quinault Rainforest Ranger Station as *"Closed"*, with a canister return bin open all year. The food-storage page still lists it as a loan location, the conflict section 2 already resolved as closed for 2026.
- **A donation, long ago:** a June 15, 2015 NPS release said *"A suggested $3 donation per canister helps sustain the canister loan program."* Nothing newer mentions one.
- **The catalog matches:** the `rentals` note and `canister_wic_loaner` say the WIC lends canisters free, first come, first served, and that the Quinault station was closed in 2026. Their *"available about 70% of the time on summer weekends"* was gloomier than *"occasionally run out over exceptionally busy weekends"*, and Lead call 33 makes the desk's can the one an empty shed relies on, so the doc settles it: the game's desk always has one to lend (GAME_DESIGN 3.1, 5.1, Lead call 33). **Changed** (R9): the availability stats are 1.0, and the `rentals` note and the item's real-world note say the real WIC occasionally runs out. Outfitter rental prices were not rechecked.

Sources: [NPS WIC page](https://www.nps.gov/olym/planyourvisit/wic.htm); [NPS food storage](https://www.nps.gov/olym/planyourvisit/wilderness-food-storage.htm); [NPS, 2015 release](https://www.nps.gov/olym/learn/news/enchanted-valley-reopens-to-camping-bear-canisters-required.htm). Confidence: high.

### R5. The three places behind the jobs (Lead call 30, lint T03)

All three are real businesses in Port Angeles. The game uses fictional names for them, so this table exists only for T03's deny-list.

| The job | The place's own spelling | Also seen in print | Web |
|---|---|---|---|
| Dishwashing at a gastropub | Next Door Gastropub | Next Door Gastro Pub | nextdoorgastropub.com |
| Selling books | Port Book & News (logo, address, copyright) and Port Book and News (page title) | | portbooknews.com |
| Flipping burgers | Frugals, no apostrophe | Frugal's | frugalburger.com |

- The bookstore is an independent general bookstore, founded in 1986, selling new and used books, magazines and maps; it changed owners in early 2025.
- The burger stand is the chain's first location, opened in Port Angeles in 1988; the chain is now small, in Washington and Montana. It is a double drive-thru with no dining room or carhops, so *drive-thru* is more exact than *drive-in*; either works for a fictional stand.
- **For T03's deny-list:** Next Door Gastropub, Next Door Gastro Pub, nextdoorgastropub, Port Book and News, Port Book & News, portbooknews, Frugals, Frugal's, frugalburger. **Never** the bare words *next door* or *frugal*, which are ordinary English (*the cabin next door*, *a frugal meal*): match the full names or exact case-sensitive tokens.

Sources: [nextdoorgastropub.com](https://www.nextdoorgastropub.com/); [portbooknews.com](https://www.portbooknews.com/); [frugalburger.com](https://www.frugalburger.com/) and [its locations](https://www.frugalburger.com/locations); [WTA, Will Hike for Food](https://www.wta.org/news/magazine/northwest-weekends/will-hike-for-food); [Missoula Current](https://missoulacurrent.com/burger-stand-missoula); [Flathead Beacon, 2011](https://flatheadbeacon.com/2011/12/08/frugals-celebrates-with-feeding-frenzy/). Confidence: high.

### R6. The park's berry limit (decision 58)

The Superintendent's Compendium (36 CFR 2.1(c); the amended page, updated Jan 21, 2026):
- *"Edible fruits, berries, nuts, and the fruiting bodies of mushrooms may be collected by hand for personal consumption, except within 200 feet of nature trails, special trails, and natural study areas."*
- *"The total quantity of edible fruits, berries, mushrooms, or nuts that may be possessed is limited to 1 quart per person per day."*
- Cranberries and native blackberries: 3½ gallons, once in two weeks. Exotic species (apples, pears, non-native blackberries) are exempt.

So the cup is exactly one quart per person per day, shared across all fruit, berries, nuts and mushrooms, huckleberries included: by hand, for personal use, and not within 200 ft of nature trails. The doc's "about a quart" can be exact. For contrast, Olympic National Forest, outside the park, allows 1 gallon a day and 3 gallons a year.

Sources: [NPS Superintendent's Compendium](https://www.nps.gov/olym/learn/management/superintendent-s-compendium.htm); [NPS laws and policies](https://www.nps.gov/olym/learn/management/lawsandpolicies.htm); [USFS, wild berries](https://www.fs.usda.gov/r06/olympic/forest-products/wild-berries). Confidence: high.

### R7. Two instruments: a full-size dreadnought and a melodica (decision 62, Lead call 38)

- **A full-size dreadnought, alone:** about 4 to 5 lb (owner-weighed ones about 4.0 to 4.5 lb; guides say 4 to 6). Body about 20 in long, 15⅝ to 15¾ in across the lower bout, 11½ to 12 in across the upper, about 4 in deep at the heel to 4⅞ to 5 in at the tail; about 41 in overall, with a 25.4 to 25.5 in scale. Bounding box about 41 x 15.75 x 5 in, roughly 53 L.
- **In a gig bag:** typical padded bags weigh 1.8 to 3.4 lb (hybrids 8 to 9), so about 6.5 to 8 lb with the guitar; outside about 43 x 17 x 6 in, roughly 70 to 72 L, bigger than a whole 50 to 65 L pack. It has to ride strapped outside.
- **In a hard case:** the case alone weighs 8.5 to 14 lb, about 13 to 18.5 lb with the guitar, and takes about 94 to 99 L.
- **A melodica:** a 32-key student model is about 580 g (20 oz) and 42 cm long; 37-key models are 542 to 720 g (19 to 25 oz) and 47 to 56 cm long, some sold with a soft bag or zip case. With a soft case, about 32 to 36 oz and about 5 to 6 L (around 50 x 14 x 8 cm).
- **Prices, for the catalog:** a 32-key student melodica runs about $48 to $73 new in the US in 2026; a mid-range all-solid-wood dreadnought about $1,000 to $2,000 (one specialist listing at $1,365).

Sources: [UMGF, owner weights](https://umgf.com/viewtopic.php?p=2698785); [Music Industry How To](https://www.musicindustryhowto.com/acoustic-guitar-weight/); [Retrofret](https://retrofret.com/products/c-f-martin-d-28-flat-top-acoustic-guitar-1975-4503); [Dream Guitars](https://www.dreamguitars.com/shop/instruments/guitars/steel-string-guitars/flattop/martin-d-28-5/); gig bags at [zZounds](https://www.zzounds.com/item--GATGBEDREAD), [Full Compass](https://www.fullcompass.com/prod/631124-gator-gssl-dread-lux-series-dreadnaught-guitar-gig-bag) and [Reverb](https://www.reverb.com/item/29356778-access-stage-one-dreadnought-acoustic-guitar-gig-bag-ab1da1); hard cases at [zZounds](https://zzounds.com/item--GATGCDREAD), [zZounds](https://www.zzounds.com/adid--lp_563_sku_7/item--MRT12C345) and [Cream City Music](https://www.creamcitymusic.com/tkl-triumph-series-hardshell-case-for-dreadnought-acoustic-guitar/); melodicas at [Bax Music](https://bax-shop.co.uk/melodica/hohner-melodica-student-32-black), [Thomann](https://thomann.co.uk/suzuki_m_37c_melodica.htm), [zZounds](https://www.zzounds.com/item--HOHS37) and [Thomann](https://www.thomannmusic.com/hohner_performer_melodica_37_set.htm); prices at [Equipboard](https://equipboard.com/items/hohner-student-32-melodica) and [Elderly Instruments](https://www.elderly.com/products/blueridge-br-160a-dreadnought). Confidence: medium; weights vary by model.

### R8. A CC0 Pacific wren (decision 63)

Almost none, and no good one. Xeno-canto holds 361 Pacific wren recordings: 304 are CC BY-NC-SA, one is CC BY (XC819593, a Colorado song), one is CC BY-SA (XC120847, a call), and exactly one is public domain (XC915129): a 5 min 15 s song from the Black Hills of South Dakota, recorded on an iPhone, of the interior race, with seven background species. It is not an Olympic or coastal-race wren, and not clean. Freesound has nothing for "pacific wren" or "troglodytes pacificus"; "winter wren" has 6 sounds, none CC0; the only CC0 "troglodytes" hits are Eurasian wrens in mixed soundscapes from Brittany. So "no usable CC0 recording" is accurate, the doc's "a CC0 search finds none" (13.9) is very slightly too strong, and synthesizing the wren stands.

Sources: [xeno-canto search](https://xeno-canto.org/explore?query=troglodytes+pacificus), [public domain only](https://xeno-canto.org/explore?query=troglodytes+pacificus+lic:pd), [XC915129](https://xeno-canto.org/915129), [search help](https://xeno-canto.org/help/search); Freesound searches for ["pacific wren"](https://freesound.org/search/?q=%22pacific+wren%22) and ["winter wren"](https://freesound.org/search/?q=%22winter+wren%22). Confidence: high.

### R9. Changed

| File | Item | Change | Source |
|---|---|---|---|
| gear_catalog | new `melodica` | Beside the harmonica and the ukulele, in their schema: 32 oz in its soft case, 5.5 L, `outside_strappable`, $59; tags luxury, music, heavy, bulky, fragile; joy 2, joy_camp 4, neighbors_annoyed 0.4 | R7 |
| gear_catalog | new `guitar_dreadnought`, named *Bigleaf Dreadnought Guitar* (the maker is fictional, and the name a draft for you, decision 21) | 120 oz with a padded gig bag, 70 L, `outside_strappable`, $1,399; the same tags; joy 4 and joy_camp 6, the highest of any item, neighbors_annoyed 0.4. By far the heaviest and bulkiest instrument, on purpose | R7 |
| gear_catalog | `canister_wic_loaner` and the `rentals` note | `availability_summer_weekend` 0.7 and `availability_midweek` 0.95 become 1.0: the game's desk always has a can to lend (GAME_DESIGN Lead call 33). The notes keep the real WIC's *"occasionally run out over exceptionally busy weekends"* | R4 |
| gear_catalog, food_catalog | a clam gun | Nothing to remove: neither catalog has a clam gun or any clam gear. Clamming is a shovel only (Lead call 37) | — |

The catalog now holds 219 items, up from 217.

### Still uncertain (this round)

1. **The loaner can's weekend availability** (R4): settled. The game's desk always has one (Lead call 33); the real WIC occasionally runs out over exceptionally busy weekends, and how often is not published.
2. **Instrument weights** (R7) are typical values, not one model's.
3. **Kalaloch's next dig** (R2): none is scheduled; the tentative 2026-27 schedule lists only the four southern beaches.

---

## 2026-10-09: the data build (BUILD_PLAN S4)

**Changed:** 2026-10-09, in the build session that ingests the data (S4). Every change below is at the source (BUILD_PLAN 3.5): the research stays the truth, and `tools/ingest.mjs` only checks it. All three files still parse as valid JSON, and every number this section adds is either sourced or `estimate: true` with its evidence beside it. Nothing here edits GAME_DESIGN.

### S4-1. The 2026 conditions gain `effect`

Each of the 18 entries of `sol_duc_high_divide.json` `conditions_2026` gains `effect`, the game's one-word reading of its `game_effect` (which stays, as the research's note); `conditions_2026_fields` gains `effect`'s definition. `content/park/conditions/2026.json` carries them.

| # | Entry (`applies_to`, from) | `effect` |
|---|---|---|
| 1 | Sol Duc area open (`sol_duc_trailhead`..., 2026-03-24) | `open` |
| 2 | Lake Crescent area open (`marymere_falls_trailhead`..., 2026-10-04) | `open` |
| 3 | Spruce Railroad Trail open (2026-10-04) | `open` |
| 4 | Stage 2 fire restrictions (`all_wilderness_camps`, 2026-08-07 to 10-01) | `fire_ban` |
| 5 | Sourdough Mountain Fire, extinguished (2026-08-10) | `history` |
| 6 | US 101 Hoh River Bridge closures (`hoh_lake_trail_junction`, its three windows) | `news` (a Hoh-side exit takes the detour on those dates; the closure itself is structured once, from `park_rules.json`, on `us101_hoh_river_bridge` with its hours) |
| 7 | Seven Lakes Basin reservations snapshot (Lunch Lake, Heart Lake, 2026-10-07) | `full_snapshot` |
| 8 | Loop in excellent condition, low-snow year (`sol_duc_high_divide`) | `snow_year` |
| 9 | Sol Duc River and Deer Lake trails' downed trees | `blowdown` |
| 10 | Landslide above Lunch Lake (`seven_lakes_basin->round_lake_junction`, its hazard card) | `hazard` |
| 11 | Dead bear in Hoh Lake (before Oct 15, 2026) | `news` |
| 12 | Cold snap at Appleton Pass, Sept 25-26 | `history` |
| 13 | Rangers checking permits and canisters on the loop | `staffing` |
| 14 | Bogachiel River Trail overgrown, new blowdown (`little_divide`) | `blowdown` |
| 15 | Olympic Hot Springs Road washed out, the bridge passable (`appleton_pass`) | `news` (the road walk itself is structured from `park_rules.json`) |
| 16 | Port Angeles WIC hours | `staffing` |
| 17 | Eagle Ranger Station not regularly staffed (stale) | `staffing` |
| 18 | Spruce Railroad Trail rockfall, 2023 | `superseded` |

### S4-2. Basic or nice, on every catalog item (Lead call 29; GAME_DESIGN 5.8)

Every item, pack and tier in `gear_catalog.json` and every food in `food_catalog.json` gains `basic: true` (free) or `false` (nice, at its `price_usd`), and each catalog's `notes` gains the rule. Set by hand, item by item: an item-tier is basic when it is the plain, serviceable version of an essential (it meets a row of the ranger's checklist or the worn outfit in `content/rules/kits.json`, is a pack, or is the basic stove's fuel) and the plainest version of that thing on an M1a shelf; every trap the general store sells is basic too; everything else is nice. Foods: everything sold at the grocery is basic except the beer.

- **Basic, at the general store (59):** packs `external_frame_70`, `daypack_20`; `tent_2p_dome` (cheap tier), `tarp_canvas`, `space_blanket`, `tube_tent_plastic`; `bag_synth_45`, `_30`, `_20`, `pad_foam_ccf`, `pad_foam_torso`, `bag_flannel_rectangle`; `socks_wool_hiking`, `sweater_wool_vintage`, `fleece_jacket`, `base_top_synthetic`, `base_bottom_synthetic`, `pants_convertible`, `wool_pants_surplus`, `beanie_wool`, `ball_cap`, `tee_cotton`, `jeans_denim`, `hoodie_cotton`, `socks_cotton`; the cheap tiers of `rain_jacket`, `rain_pants` and `poncho`, `pack_liner_compactor`; `boots_leather`, `sneakers_canvas`; `stove_canister` (cheap tier), the three fuel canisters, `pot_aluminum_1_3l`, `lighter_mini`, `matches_storm`, `firestarter_cubes`, `skillet_cast_iron`; `bottle_disposable_1l`, `bottle_hard_1l`, `water_bag_3l`, `tablets_chlorine_dioxide`; `knife_folding`, `whistle`, `hatchet`, `duct_tape_roll`; `headlamp` (cheap tier), `flashlight_big`, `map_park_brochure`; `first_aid_basic`, `sunscreen`, `lip_balm_spf`, `bug_repellent`, `toilet_paper_kit`, `deodorant`; `speaker_portable` and `camp_chair_ultralight`'s cheap car chair.
- **Basic, at the gear shop:** `map_topo_park`, `compass_baseplate`, `trowel` (GAME_DESIGN 5.7 puts no full map, real compass or trowel at the general store).
- **Basic, at the desk:** `canister_wic_loaner` (Lead call 33), `permit_wilderness` (its fees shown, not paid). **Basic, the hiker's own:** `phone`.
- **Basic foods:** the 73 grocery foods but the beer.
- **Nice:** everything else, among them `weekender_50`, every standard and premium tier above a sold cheap one, the instruments, the freeze-dried meals, the beer, the pre-roll and `smoked_salmon`.

### S4-3. The general store's new items (GAME_DESIGN 5.7)

Each is `estimate: true` with `evidence` for every number; its `name` is a draft for S11's batch, never shipped from here; no `flavor` until S12a.

| Item | Weight · price (5.7) | The rest, and where it comes from | Basic |
|---|---|---|---|
| `tarp_canvas` | 64 oz · $49 | 4.8 L (scaled by weight from `tarp_flat`); `tarp_flat`'s stats with `wind_rating` 2 (5.2: it shrugs off wind); tags `shelter_tarp`, `needs_poles`, `heavy`, `bulky`, `bombproof` | yes |
| `flannel_cotton` | 12 oz · $29 | 2.1 L and its cotton stats from `hoodie_cotton`, scaled by weight; insulating, cotton, not tagged `trap` (6.9's eighteen stay eighteen) | no: cotton meets no need |
| `wool_pants_surplus` | 24 oz · $35 | 1.8 L (`jeans_denim`); insulation from `base_bottom_merino`, wet warmth and drying from `sweater_wool_vintage`; covers legs | yes |
| `blanket_wool` (plain) | 64 oz · $59 | 11.4 L (scaled from `sweater_wool_vintage`); warmth bonus from `liner_fleece`; off the shelf until the `wool_blanket` switch (M1b) | no |
| `smoked_salmon` (food) | 3 oz · $9 | **100 kcal from USDA FoodData Central** [173687](https://fdc.nal.usda.gov/food-details/173687/nutrients), *Fish, salmon, chinook, smoked* (SR Legacy 15077): 117 kcal per 100 g, and 3 oz is 85 g; 0.14 L (scaled from `tuna_pouch`); morale 3 and smelly (5.7); `sold_at` `boutique`, and the general store's shelf adds it as a treat | no |

`shellfish_license` waits for clams (M1b or M4): its fee is unresearched. The gear catalog holds 223 items and the food catalog 89.

### S4-4. Tags and stats

- **`bombproof` and `style`** join `tag_glossary` (GAME_DESIGN 5.2, 5.7). `bombproof` replaces `unbreakable` (same meaning) on `pad_foam_ccf` and `pad_foam_torso`, and is on `tarp_canvas`; `style` has no M1a item yet (the boutique's, S35a).
- **The four socks** (`socks_wool_hiking`, `socks_liner`, `socks_waterproof`, `socks_cotton`) gain `stats.covers: ["feet"]`, a completeness fix the checklist's worn socks need reads.

### S4-5. Read, not changed

Ingest reads and reports, without editing: the retired `journal_points` (5 items) and `journal_points_bonus` (7 items) are dropped from the generated catalog; `field_guide` reads as `id_book` and `sketchbook` as `luxury` (E.4); stat values that are words stay here. The sun tables reproduce R3's fourteen sunrises to the second and all 96 of `daylight_loop_2027`'s values to the minute. The ingest report (`content/park/ingest_report.md`) lists every fix, estimate and doubt.
