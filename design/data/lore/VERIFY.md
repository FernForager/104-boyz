# Verification of the lore files, 2026-10-08

*A strict check of `quotes_public_domain.json`, `history.json`, `LORE.md` and the four research files (`press_expedition.json`, `oneil_expeditions.json`, `other_history.json`, `wood_bibliography.json`). Fixes were made in place. No game code was written and nothing was committed.*

## Summary

- **Quotes.** All 296 quotes were fetched again from their sources and found word for word: 268 match the fetched text exactly, and 28 differ only by OCR errors, which were checked on the page images. No quote was removed. Every quote comes from a U.S. publication before 1931 or a U.S. government work, and none is Robert L. Wood's.
- **Held-back lines.** Seven held-back lines were removed. We had seen them only in copyrighted modern articles (Peninsula Daily News, 2001 and 2009) or on Wikipedia, not in a public-domain text. One held-back line was kept.
- **Fact cards.** None copies a sentence from Wood or from any other copyrighted source we could fetch. A few close paraphrases were reworded anyway. Every card has a citation and a credit line.
- **Node ids.** All 3,694 node-id references across the six JSON files exist in `regions/*.json` (497 nodes). None needed fixing.
- **Indigenous content.** It follows the respectful-notes rule. Two tribal-website phrases were reworded, a verbatim tribal quote was paraphrased, and one card gained a consult flag. 28 cards now wait on tribal consultation.
- **`LORE.md`.** Its counts and top-10 lists now match the files.

## 1. Quotes (`quotes_public_domain.json`)

### How each quote was checked

Every source was downloaded fresh:

- the 13 npshistory.com PDFs (*The Mountaineer* 1907-1920, *Steel Points* 1907, *Collier's* 1909);
- Senate Doc. 59 and the Statutes at Large page, from govinfo.gov;
- USGS Professional Paper 7, from pubs.usgs.gov;
- the archive.org scans of Meany (1923) and Gilman (*National Geographic*, 1896);
- the eight Chronicling America newspaper pages, as LOC ALTO OCR plus IIIF page images;
- Evans's NPS Historic Resource Study, ch. 1.

A script looked for each quote in its source, comparing letters and digits in order and ignoring spacing, line-end hyphens and curly quotes. Each quote now has a `verify_2026_10_08` field saying what was fetched, the result and any notes.

- **268 quotes match the fetched text exactly.**
- **28 quotes differ only by OCR errors**, and each was read on the page image:
  - O'Neil's report (on_oq007, 049, 054, 074, 101, 102);
  - *Steel Points* (on_oq115, 122, 126, 127, 134, 148, 158, 160);
  - the *Sacramento Daily Record-Union* (pe_q02, 06, 07, 08, 12, 14);
  - other 1890 papers (pe_q41, 43, 44, 46, 47, 49, 51);
  - Proclamation 869, where a margin note breaks the PDF text (oh_q75).

  Typical errors: "Bach" for "Each", "lue" for "The", "bear" for "hear". In on_oq160 the print's "be" has a faint "b" (read at 400 dpi).
- **More lines were read on the page images** where the punctuation or case was in doubt:
  - pe_q11, q17, q24, q42, q52, q53 and q54;
  - on_oq082 (the print has em dashes), on_oq110 (a comma, as quoted), on_oq124 and on_oq128.
- **pe_q53 and pe_q54** (Mason County Journal, 1890) had been marked "OCR with partial image check". The full IIIF page shows every word, so both are now `page_image_checked`. That makes 288 lines checked on page images, up from 286. Both lines are longer than 60 characters, so the epitaph dice don't change.
- **The six 1885 O'Neil lines** (on_oq162-167) appear word for word inside quotation marks attributed to O'Neil in Evans's 1983 NPS study. They are O'Neil's words, not Evans's. O'Neil's manuscript itself is not online, so the lines stay undealt.

### Why each source is public domain

| Source | Lines | Why it's public domain |
|---|---|---|
| O'Neil's 1890 report (Senate Doc. 59) | 107 | U.S. government work by an Army officer, printed by the Senate in 1896 |
| O'Neil's 1885 report (via Evans) | 6 | U.S. government work by an Army officer |
| Proclamation 869 | 2 | U.S. government work, 1909 |
| USGS Professional Paper 7 | 5 | U.S. government work, 1902 |
| *Steel Points* (Bretherton, Henderson) | 53 | Published in the U.S., 1907 |
| *The Mountaineer* | 52 | Published in the U.S., 1907-1920 |
| Newspapers | 38 | Published in the U.S., 1889-1890 |
| Meany | 15 | Published in the U.S., 1923 |
| Gilman, *National Geographic* | 9 | Published in the U.S., 1896 |
| *Collier's* | 1 | Published in the U.S., 1909 |

No quote is by Robert L. Wood. No quote is by any other author published after 1930, except government works.

### The held-back pool: 8 lines down to 1

Seven lines were removed: pe_s01-s06 (Peninsula Daily News) and pe_s08 (Wikipedia). They had been copied from copyrighted modern articles or from Wikipedia, not from a public-domain text, and the 1890 *Seattle Press* they come from is still not online. A search of Chronicling America found none of them.

The facts they carried are still in the timelines and cards. The two source entries used only by those lines (PDN2001 and PDN2009c) were dropped from the quotes file. In `press_expedition.json` the same seven lines and their references in three events were removed, and a note was added.

**pe_s07 was kept as held back** ("abundance of grit and manly vim"). It is word for word in the fetched NPS study (a U.S. government publication), which quotes the *Seattle Press* of July 16, 1890. It is still never dealt.

### Other quote checks

- Recomputed `chars`, `fits_epitaph_40` and `drawable` for every line; all were correct.
- All eight epitaph decks list only dealable lines, and every dealable line is in a deck. There are still 47 dealable lines, or 99 if the field grew to 60 characters.
- The 66 verbatim Meany 1923 entries in `history.json` (30) and `other_history.json` (36) were checked against the archive.org scan text:
  - 33 match exactly;
  - 33 differ only by OCR errors or a running head that interrupts the text;
  - four were read on the page images. "Anthropoligist" (Quilcene) and "Authopologist" (Sequim) are misprints in the 1923 book, kept as printed.
- Short quoted phrases elsewhere in the files were also traced:
  - the 1904 Elk National Park bill wording was found in the fetched House report;
  - the Fairhaven Herald context line was read on the page image;
  - two phrases taken from a 2009 Peninsula Daily News article were paraphrased (see section 2).

## 2. Fact cards and other text in `history.json`

### Node ids

Every `node_ids`, `primary_node` and `node_index` key was checked against the 497 nodes in the seven region files:

- 1,909 references in `history.json`;
- 1,785 more in the other five JSON files;
- the backticked ids in `LORE.md`.

All exist, so nothing needed fixing. `hamma_hamma.json` changed at 07:54 today, and the check ran after that.

### Citations

All 129 cards have at least one citation and a `credit_line`. Every cited source id is in `sources`. 68 cards cite Wood (65 cite a book or article). Word counts were recomputed after the edits: every card is still 50 to 83 words.

### Copying check

All of Wood's books are on archive.org only as lending copies whose text cannot be fetched, and the Google Books API refused queries (quota exhausted). The one Wood text online in full is his article "The O'Neil Expeditions" (*Columbia*, 1990, on npshistory.com).

Every string in all six JSON files was compared with:

- that Wood article;
- 59 fetched copyrighted or secondary pages:
  - HistoryLink essays 5434, 7473, 7480, 8397, 8998 and 11011;
  - eight Peninsula Daily News articles;
  - the 1997 Seattle Times article;
  - American Alpine Journal 1962, 1968 and 1969;
  - ASDSO, Revisit Washington, UW CMP, Willhite, lastwilderness.net, Sequim Gazette and two WTA pages;
  - 22 Wikipedia articles;
  - the Makah, Quileute, Hoh, Jamestown S'Klallam, Lower Elwha Klallam, Skokomish and Quinault websites;
  - a retailer page carrying the trail guide's publisher blurb;
- the NPS pages and Evans's chapters 1-5, as government sources.

The comparison looked for shared runs of six or more words and for sentences that share most of their content words.

No card copies a sentence. The longest shared runs are names, titles, dates and stock phrases ("the Treaty of Neah Bay on January 31, 1855", "on the National Register of Historic Places"). Three web searches for distinctive card sentences found no matches.

### What was reworded (facts and credits kept)

- **`card_quileute_country` and the Quileute notes** (in `history.json` and `other_history.json`): two eight-word runs from the Quileute Tribe's history page ("…the rain forest rivers to the glaciers of…" and "not known to be related to any other"). An eight-word run in `other_history.json` ("a settler who had wrongly claimed the land") was also reworded.
- **`card_low_divide_crossing` and two Low Divide events**: "a hole in the snow showed water" matched a 2009 Peninsula Daily News article.
- **`card_first_sign_of_people` and four other raft-wreck entries**: close paraphrases of a Peninsula Daily News sentence.
- **Events `ev_oneil_t1890_04` and O'Neil timeline `t1890_04`**: "ashore in small boats and the mules" matched HistoryLink 7473.
- **The Goldie climb event** (in `history.json` and `press_expedition.json`): the quoted "one pack to a man" came from Peninsula Daily News, not a public-domain text, so it was paraphrased.
- **Following Wood's 1990 article too closely:**
  - `card_jumbos_leap` ("rather than be left behind");
  - two O'Neil draft entries;
  - two `wood_bibliography.json` facts;
  - two epitaph seeds ("Jumbo…" and "trout…twilight").
- **The Huelsdonk diet joke** in `other_history.json`: verbatim words from Fletcher's 1966 family history (copyrighted, quoted by Evans) were paraphrased and attributed.
- **The Skokomish notes** (in `history.json` and `other_history.json`): a verbatim quotation of the Tribe's mission statement from its website was paraphrased.
- **An open question in each of `history.json` and `press_expedition.json`**: each quoted the removed Wikipedia line, and was reworded to say it was removed.

The full list (33 edits, with old and new text) was kept as a working log. The `copyright` and `status` fields of `history.json` now record this check.

## 3. Indigenous content

All Indigenous notes, cards, place-name cautions and quotes were reviewed.

- No sacred or traditional story is retold. The rules forbid adapting the legend chapters of Wood's *The Land That Slept Late*.
- No names, speech or scenes are invented. Unnamed Native helpers are flagged as unnamed.
- Native-language meanings from Meany or Eells are marked as outsiders' readings, never stated as fact.
- No quote contains a period remark about Native people.

What changed:

- **`card_norwegian_memorial`** now carries `consult_before_use: ["Makah Tribe"]`. The card says local Native people helped the 1903 survivors, and the wreck lies in Makah (Ozette) country. With this, 28 cards are flagged, up from 27. The counts and the open question were updated.
- **The Quileute and Skokomish wording** was changed as described above.
- **Kept as they are, because they come from the tribes themselves:** the Makah meaning of "Makah" ("people generous with food"), the Hoh Tribe's own name ("Chalá·at, People of the Hoh River") and the Jamestown S'Klallam "Strong People". The notes already say to ask each tribe before use.

## 4. `LORE.md`

What changed:

- The quote paragraph now reports the re-fetch and 288 page-image checks.
- The tribes count is now 28, in "What's in the knowledge base" and in Open question 4.
- The "Why his sentences aren't quoted" paragraph now describes this check.
- Two epitaph cause notes were corrected: Collier's line is for fall, crevasse or fog only, and Bailey's line is tagged lightning.
- Moment 1 now says "icy Elwha", not "frozen" (the card says floating ice).
- Moment 4 was reworded.
- The *Seattle Press* item in "Still to check" now mentions the seven removed lines.
- `VERIFY.md` was added to the file list.

Every line and node in both top-10 lists was confirmed against the files. All 10 epitaph lines and 4 runners-up are dealable, 40 characters or fewer, with the stated limits on causes. All 15 moment nodes exist, and each is the primary node of its card.

## What could not be checked

- **Wood's books.** We couldn't compare the card text with the books themselves, which can't be read online. Wood's 1990 article is the only Wood text checked word for word.
- **The July 16, 1890 *Seattle Press*** is not online (there is a copy at UW Special Collections).
- **Some pages would not load.** Atlas Obscura (the Chilean Memorial card's source) and mountaineers.org returned HTTP 403; a retailer page carrying the same publisher blurb was used in place of mountaineers.org. The NPS Staircase audio-tour page returned 404 (the files already call it offline).

## Files changed

`quotes_public_domain.json`, `history.json`, `press_expedition.json`, `oneil_expeditions.json`, `other_history.json`, `wood_bibliography.json`, `LORE.md`; new: `VERIFY.md`. Backups of the pre-check files and all fetched sources are in the session scratchpad.
