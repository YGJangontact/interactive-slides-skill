# Delivery: local file, verification, PDF, artifact link

## 1. Local file (always)

- Save as `<short-name>.html` in the folder the user named (default: the current working directory),
  with images in `assets/` beside it. One deck = one HTML file + optional `assets/`.
- Presenting: open the file in Chrome/Edge → `F` fullscreen, `S` presenter view (notes, timer, next
  slide), `B` blackout, number + Enter to jump. Clickers send PageUp/PageDown, which always work.
- Presenter view uses a second window plus iframes of the same file. If it shows blank under
  `file://`, serve the folder (`py -m http.server 8000`) and open `http://localhost:8000/<deck>.html`.

## 2. Verify before handing over

The browser pane can't run scripts on `file://` pages outside the project folder, so serve the deck's
folder over localhost first:

1. Add a configuration to `.claude/launch.json` in the working directory (create it if missing) —
   `py -m http.server <port> --bind 127.0.0.1 --directory <deck folder>` on Windows
   (`python3` elsewhere) — then `preview_start` it and navigate to the deck.
2. Copy `scripts/check_deck.js` from this skill into the deck folder and run in the page:
   `await eval(await (await fetch('check_deck.js')).text())`. It walks every slide with all steps
   shown and reports: elements spilling outside 1920×1080; content running out of its card, row or
   demo stage; `overflow: hidden` boxes hiding content; stacked blocks or grid siblings overlapping;
   text under 22px; duplicate ids; a keyboard walk that doesn't reach the end; demo and chart errors;
   unregistered `.demo`s; unpinned CDN URLs; gradient text (`background-clip: text`, breaks in PDF).
   Warnings: bottom gaps over 180 px (measured on text and drawn shapes, so a stretched card whose
   diagram ends high counts), text-heavy slides, overlapping text labels inside an SVG, charts
   or figures without `data-src`, and `--text`/`--muted`/`--accent` under 4.5:1 on a slide's `--bg`. Fix every `problems` entry; act on the warnings unless the slide is meant to be read (a
   table, a formula appendix). Delete the copied `check_deck.js` afterwards.
3. Drive each demo once (set an input + dispatch `input`, read the `<output>`).
4. Look at every changed slide as an image:
   `py scripts/render_slides.py http://localhost:<port>/<deck>.html <outdir> --slides 3,5-9`
   writes `sNN.png` plus contact sheets of 6. `--mode pdf` (default) has the same layout as the screen
   and paints formulas; `--mode screen` (headless screenshots) leaves formulas unpainted and is only
   for when the print path itself is in doubt. Look for what the check can't see: a lone word on a second title line, a chart that misleads, a colour that means
   something else elsewhere in the deck.
5. Browser pane quirks: navigating to the same URL with another `#N` doesn't change the slide (call
   `Deck.go(n - 1)` in the page); pane screenshots time out while the pane is hidden (use the step 4
   images); a dev server started by another session may be unreachable from this one — start your
   own on a free port with `"autoPort": false` so the command's port and the URL stay in sync.
6. Reduced motion: many Windows PCs report `prefers-reduced-motion: reduce` (animation effects off), and the deck then shows only final states. Check motion slides once with `?motion` and once with `?reduced`; tell the user to check the presenting laptop's setting or open the deck with `?motion`.
7. Fonts and KaTeX come from CDNs; if the pane is offline the deck falls back to system fonts —
   that's expected, not a bug.

## 3. PDF (on request)

Print CSS lays out one slide per 1920×1080 page with all steps shown; demos appear in their `mount`
state. On Windows, headless Edge needs no installs:

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu `
  --no-pdf-header-footer --user-data-dir="$env:TEMP\deck-pdf" --virtual-time-budget=5000 `
  --print-to-pdf="<abs path>\deck.pdf" "http://localhost:<port>/<deck>.html"
```
Use the served http URL (not `file://`) so fonts load. Chrome works the same with `chrome.exe`.
Check the page count equals the slide count. Tell the user animations and interaction don't survive
in the PDF.

**Slide images (README, blog, thumbnails):** render the PDF pages to PNG (e.g. PyMuPDF
`page.get_pixmap(dpi=72)` → 1440×810). Don't use headless `--screenshot`: in Edge/Chrome headless it
leaves inline MathML unpainted (space reserved, glyphs missing) even though the DOM is correct.

## 4. Artifact link (on request — "링크로 공유", "공유해줘")

- Content check first: claude.ai artifacts start private, but a link is meant to be shared. Don't
  publish unpublished results, personal or sensitive data, or anything the user marked internal
  without asking.
- The Artifact tool requires loading the `artifact-design` skill before publishing; do that. The
  deck already meets the important parts of its contract (pinned scripts from jsdelivr `/npm/`,
  stylesheets only from Google Fonts, explicit body background). Keep the deck's own fixed preset
  colors — a deck is designed for one look on a projector — and give `<title>` a 2–4 word name.
- Publish with `file_path` = the deck; pass `assets/*` through `files` (e.g.
  `{"assets/fig1.png": "assets/fig1.png"}`), `icon: "slides"`, a one-sentence `description`.
- Presenter view (S) depends on opening the same URL with `?presenter`; inside the artifact viewer
  that may not work — present from the local file and use the link for sharing/reviewing.
- Republishing the same `file_path` updates the same link.
