# content/text: every word an id

Every line of original English a player can see lives here, by id, and nowhere else (decision 21; GAME_DESIGN 18, BUILD_PLAN 10). Code and pages carry ids; the build fills in the words for each channel. This README is docs, not game text.

## Layout

```
content/text/
  README.md          this file
  en/
    app.json         the frame: name, manifest, install, upright, update, error sheet, stamps
    title.json       Session 1's title page (retires in S7)
    alt.json         pictures' alt text
    credits.json     decision 47's two lines (no screen yet)
    dev.json         the debug menu's labels (class dev, exempt)
  t07_allow.json     T07's allowlist of real things that are books (empty)
  approved.json      the ledger: written only by tools/text.mjs apply
  review/
    B000.md, B000.answers.json   approved in conversation (decisions 35 and 47)
    B001.md, B001.answers.json   the app's frame, as sent and answered
```

What each channel ships is set in `content/scope/m1a.json`.

## One line

```json
{
 "app.offline": {
  "text": "Works offline",
  "ctx": "A small stamp, once the game is saved on the phone",
  "screen": "app",
  "max": 24
 }
}
```

- **id:** `<area>.<thing>[.<detail>]`, lowercase letters, digits and underscores, joined by dots. The area is the file: `app.*` lives only in `en/app.json`.
- **`text`:** the working words. `{var}` for a variable, `{UPPER}` for a placeholder (T13), `*emphasis*` as the one markup, `\n` for a line break, never HTML. A plural is `{"one": "...", "other": "..."}`, picked by the `n` variable.
- **`ctx`:** the note a batch shows: where, when, what it has to do.
- **`screen`:** the screen it shows on (`app`, `title`, `credits`, `debug` so far).
- **`max`:** the character limit, required for class `ours` (T15 enforces it from S5).
- **`class`:** `ours` (the default: the creator approves every line) or `dev` (the debug menu and the bug report: exempt, decision 64). Later: `yours`, `term`, `place`, `quote`.

There is no status field.

## The four states

Status is worked out by comparing the working words with the ledger, never typed (18.4). The hash is SHA-256 of the words after Unicode NFC (a plural: canonical JSON with sorted keys).

| State | Means | Main ships |
|---|---|---|
| draft | No approval on record | Nothing: the main build stops |
| approved | The ledger's hash matches the working words | The words |
| changed | Approved once, edited since | The ledger's frozen words, until the new ones are approved |
| cut | These exact words were vetoed | Nothing, anywhere (preview shows them empty) |

Two more fall outside approval: a `dev` line, and a line with no letters once its `{vars}` are gone (`app.build`, the bare build code), which has no words to approve.

## Adding a line (any session)

1. Write it in its area's file as a draft: `text`, `ctx`, `screen` and `max`.
2. Use it: `data-t="id"` (or `data-t-attr`, `data-t-img`) in a page, `t('id')` or `tx(el, 'id')` in code.
3. If it lands on a screen main carries, add it to `main.off` in `content/scope/m1a.json` with a reason, until it is approved. Otherwise the main build fails (T14).
4. List it for the session's batch. Keep new lines to the minimum.

Approved lines are left alone: a change goes in the next batch, and main keeps the approved words meanwhile.

## Answers and `apply`

A batch goes out as `review/B00n.md`. The creator's answers become `review/B00n.answers.json`: each line's id, the FNV-1a hash of the words they saw, and the verdict (`approve`, `rewrite` with their words, `cut`, `later`, `note`, or `looks_fine` for a line with no words). Then:

```
npm run text:apply -- B00n
```

**Only `apply` writes `approved.json`,** and only for a line whose working words still hash to what the creator saw. A line edited after its batch went out stays a draft and goes in the next batch. A rewrite replaces the working words and is approved in one step. `apply` reads no clock (the dates come from the answers) and is safe to re-run. Answers files and the B00n.md records are never edited afterwards.

## The main gate

Main ships approved words only. The build fills the shell with the ledger's words, removes every `main.off` line (or its `data-t-unit`), makes the manifest from `app.name`, `app.short_name` and `app.description`, and writes `text/en.json` with the words of every id main reaches and nothing else. It fails if anything main reaches is a draft or cut, or if the built page shows any string that isn't approved words. Preview ships the working words, drafts included, and marks them in debug mode.

## The lints

- **T07:** no book words (F.3), whole words, outside `t07_allow.json`; a warning on a draft only preview shows.
- **T10:** no original English outside `content/text/`: JS sinks and English-shaped literals (developer text ends `// t-ok: <reason>`), HTML text and attributes, CSS `content:`, the manifest, SVG text.
- **T11:** every id used is defined; every line on a screen the build has is used (others wait for their screen).
- **T12:** every ledger entry matches its batch answer: same id, same hash, same words.
- **T13:** `{vars}` match the call's; `{PLACEHOLDERS}` are known and only in files allowed one.
- **T14:** the main gate, as above.

`npm run text:check` runs them (`--main` also checks main's built words in memory); `npm run lint` runs them with everything else. `npm run text:count` prints where things stand: lines, and their words, by class and state.
