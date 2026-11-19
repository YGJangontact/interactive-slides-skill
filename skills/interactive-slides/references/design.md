# Design

## Presets

One attribute switches the look. Put `data-preset` on `<body>` for the whole deck; a
`<section class="slide" data-preset="…">` overrides it for that slide only (nearest wins). Every
preset sets the full token set, so text, charts (`figure.viz`) and demos on that slide follow its
colours. The two defaults stay the default; the three style presets are opt-in.

| Preset | `data-preset` | When to use | Look | Avoid when |
|---|---|---|---|---|
| Academic (default) | `academic` | lab meeting, conference, thesis defense | warm off-white, Noto Serif KR headings, blue accent, cards | — |
| Lecture | `lecture` | blog lecture, public talk, workshop | dark, larger type, amber accent | — |
| Editorial-light | `paper` | lab meeting or defense that is read afterwards; figure-led talks | warm paper, Source Serif 4 + Noto Serif KR titles, rules instead of boxes, mono labels, vermilion accent | very bright rooms with weak projectors (thin serif strokes) |
| Cinematic-dark | `stage` | conference oral, invited talk, demo-heavy talk in a dim room | near-black with one static corner glow, Inter 800 titles, dark panels, cool-blue accent, amber for feedback/warnings only | bright rooms (dark decks wash out) — switch the body to `paper`, content unchanged |
| Swiss-grid | `grid` | method-heavy talk, defense, poster-style summary | white, IBM Plex Sans KR, black rules, 16 px top band, radius 0, one red | charts where red would read as "bad": in this preset bad/good are black (`--viz-bad`), not red |

Contrast (WCAG, each token on its own `--bg`; AA needs 4.5:1 for body text, 3:1 for large text and
chart marks):

| Preset | text | muted | accent | accent-2 | `--viz-grey` bars | `--on-accent` on accent |
|---|---|---|---|---|---|---|
| academic | 15.6 | 5.8 | 5.6 | 3.8 (large text/marks only) | — | 5.6 |
| lecture | 15.7 | 7.5 | 10.2 | 9.4 | — | 10.2 |
| paper | 15.6 | 5.8 | 5.4 | 6.4 | 3.3 | 5.4 |
| stage | 17.1 | 8.2 | 9.7 | 10.5 | 4.1 | 9.7 |
| grid | 18.9 | 7.3 | 4.9 | 5.3 | 3.4 | 4.9 |

On `--bg-alt` (cover/divider backgrounds) the lowest pair is grid accent 4.6 and paper accent 4.9.
`check_deck.js` warns when `--text`, `--muted` or `--accent` falls under 4.5:1 on a slide's own
`--bg`, so a hand-tuned accent is caught.

Rules for all presets:
- Start from the preset that matches the audience, then commit to small changes in the token block
  (`--accent`, `--accent-2`, `--bg`). Don't restyle components one by one — change tokens so every
  slide moves together. Mixing presets in one deck is for previews and rare contrast slides (a dark
  demo slide in a light deck), not for decoration.
- Component tokens (`--panel-*` cards, `--kpi-*` number cards, `--take-*` takeaway line,
  `--kicker-*` labels, `--slide-bg`, `--cover-bg`, `--divider-bg`, `--conclusion-bg`, `--num-ink`
  numbered-column digits, `--viz-*` chart greys) live in the `[data-preset]` block; a new preset sets
  the ones it changes.
- No gradient text (`background-clip: text`): it prints as a filled box in the PDF. The check reports
  it as a problem. Colour one word with `.accent` instead.
- Fonts are Google Fonts with fixed families (Source Serif 4, Inter, IBM Plex Sans KR, IBM Plex Mono,
  Noto Sans/Serif KR, JetBrains Mono); delete the second font link's families the deck doesn't use.
- If the user wants a strongly custom visual identity instead (pitch, branding), that is what the
  `frontend-slides` skill's style discovery is for; this skill's job is clarity and working demos.

## Korean typography

- Body stack: Pretendard (if installed locally) → Noto Sans KR (Google Fonts) → system Korean fonts.
  Google Fonts only, so the file also publishes as a claude.ai artifact.
- `word-break: keep-all` is on for headings, `p` and `li`: Korean wraps at word boundaries instead of
  mid-word. Keep it.
- Korean needs more line-height than Latin: body 1.5, headings 1.15. Don't set negative tracking on
  Korean body text.
- Mixed Korean/English titles: keep technical terms in English where the audience uses them
  ("Attention", "loss") — don't force translations.
- Mono uppercase labels (the `.kicker` in paper/stage/grid): Latin mono fonts have no Hangul. The
  label stack `--font-label` lists a Korean sans before any generic family, and the template's LABELS
  script wraps Hangul runs in `.kicker` as `span.ko` (body font, tracking .02em), so "01 · 방법" never
  renders Korean in a wide-tracked fallback face. Labels in other elements: use the body font, or wrap
  the Korean part in `<span class="ko">` yourself.

## Type scale (1920×1080 stage)

| Token | Size | Use |
|---|---|---|
| `--size-h1` | 96 (lecture, paper 112; stage, grid 120) | cover title only |
| `--size-h2` | 64 (lecture 72, stage 68, grid 60) | slide titles |
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
  `check_deck.js` warns when the content ends more than 180 px above the bottom. It measures what is
  drawn (text, images, SVG shapes), not boxes, so a stretched card (`.cols.fill`, `.vrow`) whose
  diagram ends high is caught too. For an inline SVG diagram, draw it on a viewBox with the card's
  aspect ratio (about 1000 × 560 for a `wide-left` card) and use the whole viewBox — an empty margin
  inside the viewBox is empty space on the slide.
- **Never fill space with bigger type.** Keep the type scale above; inflating fonts to fill a slide
  is as wrong as shrinking them to fit.
- **Nothing may be clipped.** After every edit, run the check and look at a screenshot of each
  changed slide; figures and labels must be fully visible.

## Slide types in the template

- `.slide.cover` — kicker (event · date), h1, `.lead`.
- default `.slide` — kicker + h2 + content. Content options: `ul.points` (add `.step` to `li` for
  builds), `.cols` / `.cols.c3` / `.cols.wide-left` with `.card`s, `figure`, `pre.code`,
  `.big-number`.
- `.cols.c3.numbered` (or `.cols.numbered`) — **numbered columns** for steps, stages or an agenda.
  Each child (usually a `.card`) gets 01, 02, … on top from CSS counters, so a column reads
  number → title → text from the top (Swiss-poster style); never park the number at the bottom with
  `margin-top: auto`, which leaves a dead band between text and number. Markup is just
  `<div class="card"><h3>…</h3><p>…</p></div>`; the number colour is `--num-ink` (accent; black in
  `grid`), the size `--num-size` (default 240 px; set it on the `.cols`, e.g. 280 px for a poster
  look). Don't add `.fill`: three short columns end high, so finish the slide with a `.take` line, a
  small muted detail line per column ("측정 · …") or a figure rather than stretching empty cards.
  Works with `.step` + `.m-dim` builds (one column per press).
- `.slide.divider` — **section break**, neutral (`--divider-bg`, not the accent): big section number
  from `data-num="02"`, optional kicker, h2 section title, one `.lead` line with the next question.
  The number's box is trimmed to the digit height (`text-box: trim-both cap alphabetic`), so it never
  runs past 1080 and Korean fonts don't lose the bottom of the digits.
- `.slide.conclusion` — **takeaway**, one sentence (2–3 per deck at most): neutral `--conclusion-bg`
  (the preset's `--bg-alt`; the glow background in `stage`), a thick accent rule above the kicker, and
  one key word in `<span class="accent">`. Light on purpose — a full accent page is heavy for
  academic talks and prints as a block of ink.
- `.slide.conclusion.solid` — opt-in full-bleed accent background (text in `--on-accent`, `.accent`
  becomes an underline). For the closing line of a lecture or keynote, at most once per deck; don't
  spend it on section breaks.
- `.slide.statement` — old name, kept so existing decks render unchanged (full accent background, no
  rule — the same as `.conclusion.solid`). New decks use `.divider` for section breaks and
  `.conclusion` for takeaways.
- demo slide — kicker + h2 + `.demo` (stage + controls). See `demos.md`.

## Section progress strip

Opt-in per deck: `<body data-progress="sections">`, then `data-section="방법"` on the **first** slide
of each section (later slides inherit it until the next `data-section`). Every slide then shows a
thin strip in its top padding: all section names, one dot per slide, the current section bold and
the current slide's dot in the accent. It is part of the slide, so it prints in the PDF and the
presenter previews. Not drawn on `.cover`, `.conclusion`/`.statement`, slides before the first
section, or a slide with `data-progress="off"`.

- Use it for talks over ~12 slides with 3–6 sections (defense, conference); skip it for short lab
  updates. Keep section names to one or two words — the strip is one line (`check_deck` reports a
  spill if it runs past the slide).
- Name sections as the kickers do ("방법", "결과"), so strip and kicker say the same thing.
- It sits at 26–66 px from the top (below the grid band), above the 104 px content padding; don't
  move content into the top padding on decks that use it.

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
  `bad`/`mute` follow the tokens of the chart's own slide (`--accent`, `--accent-2`, `--viz-grey`,
  `--viz-ok`, `--viz-bad`), so one meaning keeps one colour across the deck and a slide with its own
  `data-preset` gets its own palette. Use the letters, not hex codes, in the JSON.
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
- **Decorative giant numbers** (section numbers, outline numbers in a corner): a 300 px glyph's line
  box is taller than the glyph and spills past 1080 even when the digits look inside. Trim the box to
  the digits (`line-height: 1; text-box: trim-both cap alphabetic`) as `.divider` and `.numbered` do,
  and keep it in the flow or inside the padding, not absolutely positioned at the bottom edge. Don't
  clip it with `height: .8em; overflow: hidden`: Korean fonts (Noto Serif KR) sit the baseline lower
  and lose the bottom of the digits.
- **JSON numbers lose trailing zeros** (`41.0` becomes `41`). Format in code (`toFixed`), not in the
  data.
- **Chart end labels** collide with the last value label or with each other. Put them right of the
  end point with room reserved (`pr`), offset two labels that end at the same value, and drop
  per-point values when the caption can carry them.

## Speaker notes

Every content slide gets `<aside class="notes">` with what to say — 2–5 short lines, in the
presenter's language. They show in the presenter view (S) and never on the slide.
