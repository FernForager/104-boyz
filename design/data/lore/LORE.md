# Lore: the park's history in the game

*Compiled 2026-10-08. Short version for reading on a phone. The details are in the JSON files listed at the end.*

## What you asked for

You asked that all of Robert L. Wood's work on the Olympics be part of the game's knowledge base. You also asked that after a death the player can "write your own or tap random Robert Wood sentence."

- **Wood's work is the backbone.** Every book, article and unpublished paper of his about the Olympics is catalogued. His facts are retold in our words and credited to the book (with a page when known).
- **His sentences are not used.** His books are still in copyright. The dice deal lines from the explorers he wrote about, in their own 1890s words, which are free to use. Wood is credited in the colophon and on the Ranger's Bookshelf. If you want his actual sentences, see "Asking for Wood's words" below.

## What's in the knowledge base

**history.json** is the file the game loads. It has:

- **129 fact cards**, 40 to 90 words each, written in the game's dry, kind narrator voice. Each card is tied to park places (274 nodes in all). 82 cards also have a one-line Look box ("You see...") and 14 have a line a ranger can say.
- A credit line on every card. 65 cards cite a Wood book or article (68 counting his papers).
- 121 people, 15 expeditions and parties, and a 164-entry timeline from 1774 to 2014.
- 135 place-name origins, 30 of them with Meany's full 1923 entry, which is public domain.
- Notes on the tribes whose homeland this is, and which nation to ask before a card ships (28 cards are flagged).
- An index from each park node to its cards, names, events and quotes.

Cards are tagged for where they appear: Look pop-ups, camp readings, night pages, quiet pages, trailhead kiosks, ranger remarks, summit pages, hazard warnings and the Ranger's Bookshelf. Five cards are about Wood himself:

- the man and his books, at the Port Angeles visitor center;
- his 1948 school paper on the rain forest, at the Hall of Mosses;
- his 1961 Bailey Range first ascents, at Stephen Lake;
- his High Divide trip;
- his beach logs, at the coast trailheads.

**quotes_public_domain.json** holds 296 exact lines from public-domain sources:

- the Press Expedition (1890 newspapers and *The Mountaineer*, 1907);
- Lt. O'Neil's 1890 report (Senate Doc. 59, 1896) and his men's accounts;
- *The Mountaineer*, 1907-1920;
- Gilman in *National Geographic*, 1896;
- the USGS survey, 1902;
- Meany, 1923;
- Roosevelt's 1909 proclamation.

Every line has its source, page, link and why it's public domain. On 2026-10-08 every line was fetched again and found word for word in its source (see `VERIFY.md`); 288 were also read on the page images. 46 are approved for the epitaph dice now (40 characters or fewer, kind, naming nobody, no death or injury; the 47th, "a shout that died when half uttered", was dropped on 2026-10-08 because it says "died"). 52 more would work if the field grew to 60 characters. Every cause of death has a deck of 35 or more lines, with lines that suit the cause first and explorers' own words before newspaper summaries. A death after dark deals from its base cause's dark deck, `dark_fall` or `dark_fog`.

## How Wood is credited

**Colophon** (wording from the design doc): "The history in this game draws on the work of Robert L. Wood (1925-2003), historian of the exploration of the Olympic Mountains. No text from his books appears in this game; facts are retold in our own words."

**The Ranger's Bookshelf** lists his six books:

- *Across the Olympic Mountains: The Press Expedition, 1889-90* (1967)
- *Trail Country: Olympic National Park* (1968)
- *Wilderness Trails of Olympic National Park* (1970)
- *Men, Mules, and Mountains* (1976)
- *Olympic Mountains Trail Guide* (1984; 4th edition 2020)
- *The Land That Slept Late* (1995)

**Each card** carries a line like: *After Robert L. Wood, Men, Mules, and Mountains (1976), pp. 84-85.*

## Why his sentences aren't quoted

Wood died in 2003. His copyrights passed by inheritance and written agreement to Tom and Jessica Tonne. The Mountaineers holds the older book registrations. Using his sentences as game text is not fair use. Facts can't be copyrighted, so the game uses his facts in our own words. Only one Wood text can be read in full online (his 1990 *Columbia* article); his books on archive.org are lending copies whose text can't be fetched. On 2026-10-08 a script compared every line in the lore files with that article and with the copyrighted modern sources we used (HistoryLink, Peninsula Daily News, Seattle Times, Wikipedia, the tribes' websites). No sentence of theirs is in the cards; a few close paraphrases were reworded anyway (see `VERIFY.md`).

## Asking for Wood's words

If you want real Wood lines on the dice, ask in writing. Write to:

- **Mountaineers Books**, 1001 SW Klickitat Way, Suite 201, Seattle, WA 98134. The heirs' address of record is in care of the publisher.
- Phone (206) 223-6303 (from an old library record).
- Email mbooks@mountaineersbooks.org (seen only in search results; confirm it first).

Say:

- which book, edition and page each line comes from, with its exact words and word count;
- how it would appear: a short epitaph line with a credit, in a browser game for iPhone;
- where (worldwide, on the web), for how long, and the credit wording you propose.

Ask who controls each title, since it differs by edition. *The O'Neil Expeditions* article (1990) belongs to the Washington State Historical Society. His unpublished papers belong to UW Special Collections (speccoll@uw.edu, 206-543-1929).

Licensed lines would go in their own file, `lore/wood_licensed_lines.json`, with the permission's terms.

## The 10 best epitaph lines (all fit 40 characters)

1. "It was terribly cold." *C. A. Barnes, Press Expedition, Jan. 14, 1890* (cold)
2. "The snow is our greatest difficulty" *C. A. Barnes, Jan. 14, 1890* (cold, snow)
3. "a man will frequently sink out of sight." *C. A. Barnes, Jan. 14, 1890* (fall, crevasse only)
4. "Each ford is prominently marked." *Lt. J. P. O'Neil, report of 1890* (river only)
5. "We had several narrow escapes." *Lt. J. P. O'Neil, report of 1890* (fall)
6. "a place where the world stands edgewise" *Collier's, April 1909* (fall, crevasse or fog only)
7. "refused even to bid them farewell" *Asahel Curtis, The Mountaineer, 1907* (fog: Olympus hid in cloud)
8. "all but one sad day" *Winona Bailey, The Mountaineer, 1920* (lightning)
9. "Many other days were full of trials" *Sacramento Daily Record-Union, Aug. 14, 1890* (any)
10. "It is also a great country for moss" *S. C. Gilman, National Geographic, 1896* (any)

Close behind:

- "alone and with no lunch in my pocket" (L. F. Henderson, 1890)
- "Gracious, how good those potatoes were" (R. Jones, 1890)
- "September 17 dawned fine and clear" (B. J. Bretherton, 1890)
- "the mere bauble of a mountain summit" (Curtis, 1907)

No line yet mentions the tide; the tide deck uses the general pool.

## The 10 best history moments for play

1. **A quarter of a mile.** On Jan. 14, 1890 the Press party dragged a boat up the icy Elwha. *Fires at* `madison_falls_trailhead`, on a cold lower-Elwha night.
2. **The Goblin Gates.** Barnes saw faces in the rock. *Fires at* `goblins_gate`, as a Look at the gorge.
3. **The geysers that weren't.** The 1890 party heard drumming and blamed geysers; it was probably a grouse. *Fires at* `humes_ranch`, on the night page.
4. **Water running south.** Water under the snow, flowing south, told the Press party it was over the divide. *Fires at* `low_divide`, when the hiker tops the pass.
5. **The first sign of people.** An empty trapper's cabin after 80 days, and the last of the flour. *Fires at* `north_fork_quinault_trailhead`, at the end of the Elwha-to-Quinault traverse.
6. **A ledge for mules / Why Staircase.** Soldiers built a log ledge over a bluff in 1890. *Fires at* `staircase_rapids_bridge_junction`, as a Look at the bluff.
7. **Back to the axe.** The Army walked its mules up the riverbed and nearly drowned two. *Fires at* `slide_camp_skokomish`, as river foreshadowing (with a ranger line).
8. **Like flies coming down a wall.** The 3,000-foot zigzag descent of 1890. *Fires at* `o_neil_pass`, before the descent: O'Neil said downhill was the dangerous part.
9. **Which summit was which.** In 1908 climbers topped the wrong peak in cloud. *Fires at* `mount_olympus_false_summit`, as fog foreshadowing.
10. **The baking-powder can.** Notes from 1894 were found on a pass in 1907. *Fires at* `dodwell_rixon_pass`. It is a cousin of the game's own Trail Register.

Also good:

- the chalet bathtub skidded up on a sled (`enchanted_valley_chalet`);
- the Iron Man of the Hoh (`hoh_rain_forest_trailhead`);
- the ice tunnel (`elwha_snowfinger`);
- the Elwha dams coming down (`glines_canyon_overlook`);
- Wood's own 1961 climbs (`stephen_lake`).

## Open questions for you

1. **Real names in cards.** The design doc's text check allows real people only in the colophon, the Bookshelf and epitaph credits. History cards name historical figures (Christie, O'Neil and others). I suggest an exception for history cards. Your call.
2. **Ask for Wood's words?** See above.
3. **Epitaph length.** Keep 40 characters (46 lines) or allow 60 (98 lines)?
4. **The tribes.** 28 cards should not ship until the tribe named on each has been asked: Makah, Quileute, Hoh, Quinault, Lower Elwha Klallam, Jamestown S'Klallam and Skokomish. Contacts are in history.json. (The Norwegian Memorial card was added to this list on 2026-10-08: it mentions the Native people who helped the 1903 survivors.)
5. **Shipwreck memorials.** The Norwegian and Chilean memorials are real graves. I suggest making those places where no book can end.
6. **Still to check:**
   - the original July 16, 1890 *Seattle Press* (a copy is at UW). It is still not online. Seven Press lines that we had seen only in modern articles or Wikipedia were taken out on 2026-10-08; with the Press in hand they could come back;
   - Wood's page numbers, most of which come from a 1983 park study;
   - where "Staircase" and "Geyser Valley" got their names (the sources disagree);
   - whether a few buildings in Look lines still stand.

## Files

- `history.json`: the knowledge base the game loads.
- `quotes_public_domain.json`: the verbatim lines and the epitaph decks.
- `wood_bibliography.json`: Wood's works, his rights holders and how to ask permission.
- `press_expedition.json`, `oneil_expeditions.json`, `other_history.json`: the full research drafts.
- `VERIFY.md`: the 2026-10-08 check of every quote, card and node id, and what it changed.
