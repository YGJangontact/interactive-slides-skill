# Design

The template ships two presets, switched with one attribute on `<body>`:

| Preset | `data-preset` | For | Look |
|---|---|---|---|
| Academic | `academic` | lab meeting, conference, thesis defense | warm off-white, Noto Serif KR headings, blue accent, calm |
| Lecture | `lecture` | blog lecture, public talk, workshop | dark, larger type, amber accent, high contrast for projectors |

Start from the preset that matches the audience, then commit to small changes in the token block
(`--accent`, `--accent-2`, `--bg`). Don't restyle components one by one — change tokens so every
slide moves together. If the user wants a strongly custom visual identity instead (pitch, branding),
that is what the `frontend-slides` skill's style discovery is for; this skill's job is clarity and
working demos.

## Korean typography

- Body stack: Pretendard (if installed locally) → Noto Sans KR (Google Fonts) → system Korean fonts.
  Google Fonts only, so the file also publishes as a claude.ai artifact.
- `word-break: keep-all` is on for headings, `p` and `li`: Korean wraps at word boundaries instead of
  mid-word. Keep it.
- Korean needs more line-height than Latin: body 1.5, headings 1.15. Don't set negative tracking on
  Korean body text.
- Mixed Korean/English titles: keep technical terms in English where the audience uses them
  ("Attention", "loss") — don't force translations.

## Type scale (1920×1080 stage)

| Token | Size | Use |
|---|---|---|
| `--size-h1` | 96 (lecture 112) | cover title only |
| `--size-h2` | 64 (lecture 72) | slide titles |
| `--size-h3` | 40 | card / block titles |
| `--size-body` | 34 (lecture 36) | body |
| `--size-small` | 26 | captions, kicker, readouts |

Nothing under 22px on a slide (`check_deck.js` flags it). If text doesn't fit, split the slide —
shrinking type is the failure mode that makes decks unreadable from the back row.

## Density

Ask (or infer) whether the deck is **speaker-led** (live talk: one idea per slide, ≤4 bullets, more
slides) or **reading-first** (sent around afterwards: self-contained slides, tables, captions,
≤6 bullets). Lab meetings are usually reading-first; blog lectures and conference talks speaker-led.

## Slide types in the template

- `.slide.cover` — kicker (event · date), h1, `.lead`.
- default `.slide` — kicker + h2 + content. Content options: `ul.points` (add `.step` to `li` for
  builds), `.cols` / `.cols.c3` / `.cols.wide-left` with `.card`s, `figure`, `pre.code`,
  `.big-number`.
- `.slide.statement` — accent background, one sentence. Use for section breaks and the takeaway.
- demo slide — kicker + h2 + `.demo` (stage + controls). See `demos.md`.

Cards in `.cols` size to their content (no tall empty boxes). Add `.fill` (`<div class="cols fill">`)
only when the cards should stretch to the bottom, e.g. image-heavy comparisons. A card with one
short line is a sign the slide wants a statement or a table instead of cards.

Rhythm: the kicker and title sit at the same place on every content slide so nothing jumps between
slides; vary the content block, not the frame. Use `.step` builds sparingly — for the 2–3 places where
revealing one point at a time actually helps the story.

## Figures and images

- Put image files in `assets/` next to the deck and reference them relatively (`assets/fig1.png`).
  For artifact publishing they're uploaded alongside (see `delivery.md`).
- Screenshots/plots: `object-fit: contain` on a `--surface` background; photos: `cover`.
- Charts that are data, not demos: prefer a static SVG/PNG from the user's own plotting code over
  re-drawing; if drawn in the deck, follow the `dataviz` skill.
- Concept diagrams: inline SVG, colors from tokens; for diagram technique see the
  `artifact-diagramming` skill.

## Speaker notes

Every content slide gets `<aside class="notes">` with what to say — 2–5 short lines, in the
presenter's language. They show in the presenter view (S) and never on the slide.
