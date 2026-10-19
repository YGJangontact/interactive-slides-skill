# Interactive demos

A demo earns its slide when the audience understands something by watching a value change that a
static figure could not show as well: a parameter's effect, an algorithm's progress, a before/after.
If a still image says it equally well, use the image.

## Rules every demo follows (and why)

- **Register with `Deck.demo('#id', { mount, enter, leave })`** inside the `DOMContentLoaded`
  handler of the demos script. The runtime calls `enter`/`leave` as the slide is shown/hidden, runs
  `api.raf` callbacks only while the slide is active, and catches errors so one broken demo shows a
  red "데모 오류" badge instead of killing navigation.
- **`mount` must draw a meaningful default state.** That frame is what the PDF/print shows and what
  people see if they skip the interaction. Pick defaults that already make the point.
- **Keyboard stays with the deck.** The runtime ignores arrow/space when focus is inside a
  control; Esc returns focus to the deck; PageUp/PageDown (presentation clickers) always navigate.
  Don't add your own document-level key handlers. If a demo truly needs keys, put
  `data-capture-keys` on its container and handle keys there.
- **At most three controls**, each labelled with a live value (`<output data-out="name">`).
  Controls live in `.demo-controls` at ≥26px; sliders are 36px tall so they're hittable on a
  projector laptop trackpad.
- **Deterministic.** Seed any randomness (`mulberry32` below) so rehearsal and the live talk match.
- **Offline-safe core.** Core demos are plain canvas/SVG with no network. Anything loaded from a CDN
  must be version-pinned and have a visible fallback if it fails.
- **Colors from tokens.** Read `getComputedStyle(document.body).getPropertyValue('--accent')` etc.,
  so the demo follows the preset.
- **Motion respects `Deck.reducedMotion`**: draw the end state instead of animating.

Canvas vs SVG: canvas (`api.fitCanvas`) for plots with many points or per-frame animation; SVG for
diagrams with hover/click targets and crisp labels.

## Demo API

```js
Deck.demo('#myDemo', {
  mount(el, api) { /* build, bind, draw default */ },
  enter(el) { /* slide shown: resume, reset if the story needs a fresh start */ },
  leave(el) { /* slide hidden: pause, stop timers */ }
});
api.fitCanvas(canvas)          // → 2D ctx, HiDPI-correct, auto-resized
api.size(canvas)               // → { w, h } in CSS px
api.bindRange(name, fn, fmt)   // <input type=range name=…> → fn(value); fmt for the <output>
api.raf(dt => …)               // per-frame while the slide is active (dt in seconds)
api.onResize(fn)               // redraw after stage/window resize
```

Shared helper worth pasting when needed:

```js
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
```

## Pattern 1 — Parameter explorer (slider → plot)

The template's `#waveDemo` is the reference implementation. Use for: learning rate vs loss curve,
temperature vs softmax distribution, threshold vs precision/recall, kernel size vs blur.
Keep one curve per idea; if comparing, draw the reference curve faded (`globalAlpha = .3`).

## Pattern 2 — Step-through (algorithm progress)

Precompute every frame of the algorithm once in `mount`, then the buttons only move an index. This
keeps prev/next exact and makes the PDF frame trivial (frame 0 or the most telling frame).

```html
<div class="demo" id="stepDemo">
  <div class="demo-stage"><svg viewBox="0 0 1000 600"></svg></div>
  <div class="demo-controls">
    <div style="display:flex;gap:12px"><button data-act="prev">◀</button><button class="primary" data-act="next">다음 단계 ▶</button><button data-act="reset">↺</button></div>
    <p class="demo-readout" data-out="caption"></p>
  </div>
</div>
```
```js
Deck.demo('#stepDemo', {
  mount(el) {
    const frames = computeFrames();          // [{state..., caption: '…'}]
    let k = 0;
    const render = () => { drawFrame(el.querySelector('svg'), frames[k]);
      el.querySelector('[data-out=caption]').textContent = `${k + 1}/${frames.length} · ${frames[k].caption}`; };
    el.addEventListener('click', e => { const a = e.target.dataset.act; if (!a) return;
      k = a === 'reset' ? 0 : Math.max(0, Math.min(frames.length - 1, k + (a === 'next' ? 1 : -1))); render(); });
    this.reset = () => { k = 0; render(); };
    render();
  },
  enter() { this.reset(); }                  // fresh start each time the slide is entered
});
```
Good for: sorting, convolution sliding window, attention weights per token, gradient descent steps,
beam search, graph traversal.

## Pattern 3 — Explain-on-hover diagram

SVG regions with `data-tip`; a caption box shows the explanation. Hover works with a mouse and click
works on touch/projector setups, so handle both.

```js
mount(el) {
  const cap = el.querySelector('[data-out=tip]');
  el.querySelectorAll('[data-tip]').forEach(r => {
    const on = () => { el.querySelectorAll('[data-tip]').forEach(x => x.classList.toggle('hot', x === r)); cap.textContent = r.dataset.tip; };
    r.addEventListener('mouseenter', on); r.addEventListener('click', on);
  });
  cap.textContent = '블록에 마우스를 올려 보세요';
}
```
Style `.hot` with the accent stroke. Good for: architecture diagrams, pipelines, anatomy of a formula.

## Pattern 4 — Live compute (type/choose → result)

A small input (text, select, 2–3 sliders) feeding a pure function whose result is shown as bars or a
table. Debounce typing (150 ms). Good for: toy tokenizer, softmax/temperature, convolution of a
small matrix, unit conversions, cost calculators.

## Pattern 5 — Before/after wipe

Two images or canvases stacked; a range input sets `clip-path: inset(0 ${100 - v}% 0 0)` on the top
one. Default at 50% so the PDF frame shows both. Good for: denoising, segmentation overlays,
super-resolution, style changes.

## Pattern 6 — Heavy demos (in-browser models, big libraries)

Only when the live run is the point (e.g., transformers.js classifying the audience's sentence).
- Load the library in `mount` (`import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2')`),
  show "모델 불러오는 중…" and disable the run button until ready.
- Always include a **recorded fallback** (a precomputed result) shown if loading fails or takes >10 s —
  conference Wi-Fi is the usual failure.
- Warn the user about download size in your reply.
- For the transformers.js API itself, load the `huggingface-skills:transformers-js` skill.

## Libraries (only when hand-written canvas/SVG would be much worse)

All from `cdn.jsdelivr.net/npm/` with exact versions (artifact-safe):
`d3@7.9.0/dist/d3.min.js`, `chart.js@4.4.4/dist/chart.umd.min.js`,
`plotly.js-dist-min@2.35.2/plotly.min.js` (heavy, ~3.5 MB — avoid unless 3D/plot interactivity is
needed). For chart design choices load the `dataviz` skill.

## Testing a demo in the browser pane

After `check_deck.js` passes, drive each demo once:
```js
const i = document.querySelector('#waveDemo input[name=f]');
i.value = 4; i.dispatchEvent(new Event('input', { bubbles: true }));
document.querySelector('#waveDemo [data-out=f]').textContent   // → "4.0 Hz"
```
Then screenshot the slide to confirm the drawing changed.
