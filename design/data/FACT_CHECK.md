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
