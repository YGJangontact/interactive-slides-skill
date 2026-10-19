---
name: interactive-slides
description: Build presentation decks as a single HTML file with live interactive demos (sliders that redraw plots, step-through algorithms, hover-to-explain diagrams, in-browser model runs), KaTeX math, Korean typography, speaker notes and a presenter view, verified in the browser and optionally exported to PDF or shared as a claude.ai artifact link. Use this whenever the user wants slides/발표자료/PPT/덱 for a lab meeting, conference talk, thesis defense, lecture, blog lecture or workshop — especially when a concept would be clearer if the audience could see it change, when the deck has equations or code, or when they say "HTML로", "인터랙티브", "데모 넣어서". Prefer it over Marp/reveal.js/pptx unless the user explicitly needs an editable PowerPoint file (then use pptx) or a purely visual style-driven deck with no demos (then frontend-slides).
---

# Interactive HTML slides

One self-contained HTML file per deck: a fixed 1920×1080 stage that scales to any screen, keyboard
and clicker navigation, step builds, speaker notes with a presenter view, print-to-PDF, and demos
that keep working mid-talk. The runtime is in `assets/deck-template.html`; you write content and
demos, not navigation code.

## Workflow

### 1. Brief

Get what you can't infer, in one message (skip whatever the user already said or attached):

- **Purpose** → preset: lab meeting / conference / defense → `academic`; blog lecture / public talk /
  workshop → `lecture`.
- **Time or slide count** (rule of thumb: ~1 slide per minute, demo slides count double).
- **Density**: speaker-led vs reading-first (see `references/design.md`).
- **Material**: notes, paper, figures, code. Use the user's own figures and numbers; never invent a
  statistic, citation or result — leave `[__]` placeholders and list them in your reply.
- **Language**: the deck's language follows the user's (the template is tuned for Korean), technical
  terms as the field uses them.

If the deck is for a public audience, keep examples generic — no unpublished results, private data
or details of the user's internal projects unless they say so.

### 2. Outline with demo plan (confirm before building)

Write one line per slide, and mark demo slides with the question each demo answers, e.g.
`5 [DEMO] 학습률을 키우면 왜 발산하는가 — slider lr → loss curve`.
A demo is worth it only where seeing a value change explains more than a figure; typically one demo
per 4–6 slides, never two in a row. Pick a pattern from `references/demos.md` for each.
Show the outline and get a quick OK — restructuring an outline is cheap, restructuring a built deck
is not. (If the user said "just make it", proceed and note your assumptions.)

### 3. Build

1. Copy `assets/deck-template.html` to `<folder>/<short-name>.html`. Read it first — the comments
   explain the structure.
2. Set `<title>`, `<html lang>`, `data-preset` on `<body>`, and adjust tokens if needed.
3. Replace everything between `SLIDES START` and `SLIDES END` with the deck's slides; give each
   `<section class="slide">` a unique `id` and an `<aside class="notes">`.
4. Replace the sample `#waveDemo` registration with the deck's demos (`Deck.demo(...)` inside the
   existing `DOMContentLoaded` handler), following the rules in `references/demos.md`. Delete the
   sample demo if unused.
5. Leave the `DECK RUNTIME` script untouched; if something seems to need a runtime change, it is
   usually solvable in the demo instead. Remove the KaTeX scripts if there's no math.

Read `references/design.md` for layout/typography, `references/math-code.md` when the deck has
equations or code.

### 4. Verify (don't skip)

Follow `references/delivery.md` §2: serve the folder over localhost, run `scripts/check_deck.js` in
the browser pane until `problems` is empty, drive each demo once, and screenshot the cover, a content
slide and every demo slide. The check catches overflow and tiny text that look fine in the code but
break on the projector. A deck isn't done until this passes.

### 5. Deliver

Tell the user: file path, slide count, demo slides, placeholders left to fill, and the keys
(→/Space next, ← back, F fullscreen, S presenter view, B blackout, Esc to leave a demo control).
Then offer — don't do unasked — the two follow-ups in `references/delivery.md`:
**PDF** (headless Edge, §3) and **artifact link** for sharing (§4).

## Editing an existing deck

Edit the slide sections and demo registrations in place; keep ids stable (URLs like `#5.2` and the
presenter view rely on order, not ids, but stable ids keep diffs readable). Re-run the check after
every round of edits — adding one bullet is the classic way to push a slide past 1080px.

## Files

| File | Read when |
|---|---|
| `assets/deck-template.html` | Step 3 — starting point for every deck |
| `references/demos.md` | Planning and writing demos |
| `references/design.md` | Presets, Korean typography, type scale, slide types, notes |
| `references/math-code.md` | Deck has equations or code |
| `references/delivery.md` | Verify, PDF, artifact link, presenting |
| `scripts/check_deck.js` | Step 4 — run in the browser pane |

The stage/navigation core is adapted from frontend-slides (MIT, © 2025 Zara Zhang).
