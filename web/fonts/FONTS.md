# The fonts, and their licenses

Every font the game ships is under the SIL Open Font License 1.1, each with its license file beside it (BUILD_PLAN 2.2; S5). No CC BY-SA font ships: the doc's *Px437 IBM EGA 8x14* is CC BY-SA 4.0, so the chrome font is our own.

| File | Font | Used for | License | Where it came from |
|---|---|---|---|---|
| `PixelifySans.woff2` | Pixelify Sans | The Sierra box, the title (S1) | OFL 1.1, *Copyright 2021 The Pixelify Sans Project Authors*: `OFL.txt` | S1 (see `design/BUILD_LOG.md`) |
| `OPHChrome.ttf` (built) | OPH Chrome 8x14 | The chrome: the status line, the caption, the strip's mile, the choices, the toolbar (GAME_DESIGN 11.9) | OFL 1.1, *Copyright 2026 The OP Hiker Project Authors*, no Reserved Font Name: `OPHChrome-OFL.txt` | Drawn for OP Hiker in `content/art/fonts/chrome8x14.txt`, built by `tools/fontbuild.mjs` into each channel's `fonts/` (it is not in `web/`) |
| `Literata.woff2`, `Literata-Italic.woff2` | Literata 3.103, regular and italic, the Latin subset, with its optical-size axis (7 to 72) | The Plain font: the box, the choices and the caption when iOS Larger Text is on, or the dev control says *plain* (11.9) | OFL 1.1, *Copyright 2017 The Literata Project Authors*, no Reserved Font Name: `Literata-OFL.txt` (from `googlefonts/literata`, `OFL.txt`) | Google Fonts, 2026-10-09 (below) |

## Literata, as fetched

Requested on 2026-10-09 with a Safari user agent: `https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400;1,7..72,400`, keeping the two `/* latin */` faces.

| File | URL | Version (`name` id 5) | Bytes | SHA-256 |
|---|---|---|---|---|
| `Literata.woff2` | `https://fonts.gstatic.com/s/literata/v40/or38Q6P12-iJxAIgLa78DkTtAoDhk0oVpaLlbJ5W7i5aOg.woff2` | Version 3.103;gftools[0.9.29] | 46,568 | `5b16e2fa223e5b6161bf4934df92bc1ca0b4f7b8f68df791a4d5104e392144d6` |
| `Literata-Italic.woff2` | `https://fonts.gstatic.com/s/literata/v40/or3yQ6P12-iJxAIgLYT1PLs1a-t7PU0AbeE9KK5U5Cl4OOCT.woff2` | Version 3.103;gftools[0.9.29] | 47,872 | `800b84f5801370af4bf15155b952b54964e44863d664c98fc17084d609c888cb` |

The license: `https://raw.githubusercontent.com/googlefonts/literata/main/OFL.txt`, fetched the same day; its copyright line names no Reserved Font Name.

## Fallbacks for the chrome font

If OPH Chrome ever has to be replaced, each fallback replaces only the source file and goes through the same `fontbuild` pipeline: **unscii-16** (public domain in every variant but `unscii-16-full`, which is GPL; check the README in its source archive first), then **Terminus Font 8x14** (`ter-u14n.bdf`, OFL 1.1 with the Reserved Font Name "Terminus Font", so the built font must be renamed, with the OFL and a note of the original name).
