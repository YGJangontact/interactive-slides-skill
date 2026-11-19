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

## Text, emphasis and space (always apply)

The user has asked for these on every deck, not only when they mention them:

- **Text down, visuals up.** If a slide reads like a paragraph, cut it to labels plus one takeaway
  and move the content into a chart, real figure or diagram built from the actual numbers. Long
  explanations go to the speaker notes.
- **Emphasise what matters, once per slide.** Highlight the one sentence or number the slide exists
  for (accent colour, weight or a marked box). Emphasising many things emphasises nothing.
- **Use the space.** A short slide must not leave a large empty band at the bottom. Fill it by
  enlarging the figure or chart, or by changing the arrangement (side-by-side, a full-width figure).
  `check_deck.js` warns when the content ends more than 180 px above the bottom.
- **Never fill space with bigger type.** Keep the type scale above; inflating fonts to fill a slide
  is as wrong as shrinking them to fit.
- **Nothing may be clipped.** After every edit, run the check and look at a screenshot of each
  changed slide; figures and labels must be fully visible.

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
- Charts that are data, not demos: use the user's own figure if one exists; otherwise draw it with
  the template's `figure.viz` component (next section) from the numbers on the slide, following the
  `dataviz` skill. English paper figures on a Korean deck read as pasted in; redraw them in the
  deck's language rather than screenshotting.
- Concept diagrams: inline SVG, colors from tokens; for diagram technique see the
  `artifact-diagramming` skill.

## Results slides

The template's result layout (sample slide `#result`):

```
kicker · flow line (앞 결과 → 질문 → 이 실험) · h2 on ONE line
.vrow  [ .vcard: h3 + figure.viz + .cap ]  [ .kpis: 2–3 .kpi number cards ]
.take  one sentence with one .hl phrase
```

- `figure.viz` kinds: `hbars` (comparisons; bars start at 0), `groups` (2–3 models × conditions),
  `lines` (dose or curve), `forest` (effect ± interval, or a dot plot on a zoomed axis). The data is
  a JSON script inside the figure; `data-h` sets the height in stage px. Colours `a`/`b`/`g`/`ok`/
  `bad`/`mute` follow the tokens, so one meaning keeps one colour across the deck.
- Every chart and figure carries `data-src`: the file (and table or section) its numbers were copied
  from, e.g. `data-src="results/dose_sweep.md 표 1"`; for a rule-derived or example chart say so
  (`data-src="묶음 규칙에서 계산"`). The check warns when it is missing. It keeps each number
  traceable after the slide text that used to cite it has moved into the notes.
- Pick heights so the row ends just above the `.take` line. When the check reports a card running out
  of `.vrow` (it then covers the next block), lower `data-h`; never shrink the font.
- Number cards hold the 2–3 numbers someone would quote, with the interval in the label. Text-only
  cards ("판정 보류") use the body font, not mono.
- Thin leftover bands under formula cards take a `.vstrip`: a bold label on the left, a small chart
  or a row of number cards on the right. Measure the usable height, not the gap to 1080: the bottom
  padding (104 px) is not free, so a "content ends 208 px above the bottom" warning leaves only
  ~100 px — enough for a one-line strip, not for a chart (a chart strip needs ~140 px plus the gap).
  The check's warning prints the usable figure.
- Mark values that are worked examples or computed from a rule rather than measured, in the label
  ("계산 예시", `해석`). A chart looks like data either way.
- Emphasis budget: one `.hl` in the `.take` line; inside the chart the bold row is the highlight.
- Optional motion (one pattern per slide, final state is the static slide): `figure.viz.m-grow` grows the
  bars from 0 and `.kpi b.m-count` counts the number up, as on the sample `#result`; `figure.viz.m-spot`
  dims the `fade` rows after a beat. Classes and markup: `references/motion.md` "템플릿 클래스".

## Layout pitfalls (each cost a round of fixes once)

- **Grid columns don't shrink below their content.** `1fr` keeps a wide formula or table at full
  width and pushes the next column off the slide. The template sets `min-width: 0` on children of
  `.cols`, `.vrow` and `.kpis`; keep it, and give wide tables `table-layout: fixed`.
- **Flex rows squeeze silently.** `.vrow` has `min-height: 0`, so an overfull row keeps its stated
  height while its cards spill over the takeaway below. `scrollHeight` doesn't show it; the check's
  box and overlap tests do.
- **Long display formulas in half-width cards** run past the card edge while the outer `math` box
  stays at the card width, so it looks fine in the DOM. Break them onto two lines at a natural
  comma (`\begin{gathered} … \\[6pt] … \end{gathered}`, or `aligned` with `&` for a long
  right-hand side) rather than shrinking the font. The check measures the formula's own extent.
- **Two-line titles.** A wrapped h2 plus a flow line costs about 90 px and is the usual reason a chart
  row overflows. Shorten the title instead of shrinking the chart.
- **Class-name collisions.** A colour class named like a layout modifier (`.c3 { background }` next
  to `.cols.c3`) paints whole slides. Scope colour classes to the element they are for (`i.c3`).
- **Fixed-size stages.** A table or canvas inside `.demo-stage` (overflow hidden) loses its first and
  last rows when it is taller than the stage. Size the rows to the stage.
- **A closing script tag inside a script** (in a comment or a JSON block too) ends the element there;
  the rest is parsed as HTML and every chart after it disappears.
- **JSON numbers lose trailing zeros** (`41.0` becomes `41`). Format in code (`toFixed`), not in the
  data.
- **Chart end labels** collide with the last value label or with each other. Put them right of the
  end point with room reserved (`pr`), offset two labels that end at the same value, and drop
  per-point values when the caption can carry them.

## Speaker notes

Every content slide gets `<aside class="notes">` with what to say — 2–5 short lines, in the
presenter's language. They show in the presenter view (S) and never on the slide.
