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
Give each line a layout note too: the slide's job → its arrangement → where the eye should land, e.g.
`7 [비교] 2열: 왼쪽 수식, 오른쪽 곡선 — 초점은 최적점`. It forces a layout decision per slide
before any HTML exists.
A demo is worth it only where seeing a value change explains more than a figure; typically one demo
per 4–6 slides, never two in a row. Pick a pattern from `references/demos.md` for each. For entrance, transition or emphasis motion (not interactive demos), pick from `references/motion.md` — at most one motion pattern per slide, final state readable without it.

Put a short **deck spec** above the outline: preset, color tokens (accent and any overrides), fonts,
slide count, density. Once the user OKs it, copy it into a `<!-- DECK SPEC ... -->` comment at the
top of the deck file. Treat it as fixed: later slides and later edit rounds follow it rather than
re-deciding colors or type per slide. Change it only when the user asks, and then update the
comment first.

Show the outline and the spec and get a quick OK. Restructuring an outline is cheap; restructuring
a built deck is not. (If the user said "just make it", proceed and note your assumptions.)

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

**Write slides by hand, one at a time, in one context.** Don't generate slides from a script loop,
and don't split slides across parallel subagents. Both lose the cross-slide judgment and the deck
drifts visually. Subagents may compute demo data or prepare figure assets, but slide markup stays
with the one agent that holds the deck spec.

**Early gate for decks over ~15 slides.** Build the cover plus the first 4–5 content slides, run the
check (step 4) and show screenshots. Build the rest only after the user OKs the look. A wrong
direction caught at slide 5 costs minutes; at slide 30 it costs a rebuild. Shorter decks skip this
gate.

Read `references/design.md` for layout/typography, results slides and layout pitfalls,
`references/math-code.md` when the deck has equations or code.

**Decks over ~30 slides:** keep the source in parts and build the one deck file from them —
`py scripts/build_parts.py split deck.html parts/` once (head, `_slidesNN.html` of 12 slides,
tail), then `py scripts/build_parts.py build parts/ deck.html` after every edit; split → build
reproduces the file byte for byte, and build reports the slide count and duplicate ids. Edits stay
local, diffs stay readable, and the shipped deck is still a single HTML file. Edit the parts, never
the built file.

### 4. Verify (don't skip)

Follow `references/delivery.md` §2: serve the folder over localhost, run `scripts/check_deck.js` in
the browser pane until `problems` is empty, drive each demo once, then **look at an image of every
slide you changed** (`scripts/render_slides.py` makes slide PNGs and contact sheets). The check
catches overflow, clipped boxes, overlapping blocks and chart labels, bottom gaps and tiny text that
look fine in the code but break on the projector; it does not see a lone word on a second title
line, a chart that misleads, or a colour that means something else elsewhere. A deck isn't done until the
check passes and the images look right.

The checker reports and you fix by hand: don't write mechanical patches (global font shrinking,
blanket overflow hiding) that silence a warning and override the design. If the same warning keeps
coming back across decks, fix its cause in this skill's guidance or template rather than patching
each deck.

### 5. Deliver

Tell the user: file path, slide count, demo slides, placeholders left to fill, and the keys
(→/Space next, ← back, F fullscreen, S presenter view, B blackout, Esc to leave a demo control).
Then offer — don't do unasked — the two follow-ups in `references/delivery.md`:
**PDF** (headless Edge, §3) and **artifact link** for sharing (§4).

## Editing an existing deck

Edit the slide sections and demo registrations in place; keep ids stable (URLs like `#5.2` and the
presenter view rely on order, not ids, but stable ids keep diffs readable). Re-run the check after
every round of edits — adding one bullet is the classic way to push a slide past 1080px.

**Density pass ("텍스트 줄이고 시각화", "공간 잘 써").** Measure first: the check's warnings list
slides with too much text or a large bottom gap. Then per slide:
1. Keep kicker, title (one line) and flow line; move tables, formula detail and long reasoning into
   the speaker notes word for word, so no number or source is lost.
2. Rebuild the body as a results layout (`design.md` "Results slides"): a chart card drawn from the
   numbers already on the slide, two or three number cards, and one `.take` line.
3. Fill the leftover height with the chart, not with bigger type.
4. Work in batches of 5–8 slides: build, check, render images, fix, then continue.
Before labelling a number in a new way (e.g. "retention measured on L"), confirm the definition in
the source file — re-labelling is where silent errors creep in.

## Files

| File | Read when |
|---|---|
| `assets/deck-template.html` | Step 3 — starting point for every deck |
| `references/demos.md` | Planning and writing demos |
| `references/motion.md` | Entrance/transition/emphasis motion patterns by slide role, sources and licenses, what to avoid in research talks |
| `references/design.md` | Presets, Korean typography, type scale, slide types, notes |
| `references/math-code.md` | Deck has equations or code |
| `references/delivery.md` | Verify, PDF, artifact link, presenting |
| `scripts/check_deck.js` | Step 4 — run in the browser pane |
| `scripts/render_slides.py` | Step 4 — slide PNGs + contact sheets (default `--mode pdf`; same layout as the screen, formulas painted) |
| `scripts/build_parts.py` | Decks over ~30 slides — split into parts / build the deck file |

The stage/navigation core is adapted from frontend-slides (MIT, © 2025 Zara Zhang).
Four workflow ideas come from PPT Master (https://github.com/hugohe3/ppt-master, MIT), rewritten
here rather than copied:
- the locked deck spec;
- per-slide layout lines;
- hand-authoring one slide at a time with an early gate;
- report-only checks.
