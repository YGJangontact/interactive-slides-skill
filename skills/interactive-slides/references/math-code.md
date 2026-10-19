# Math and code

## Math (KaTeX → MathML)

The template loads KaTeX (`katex@0.16.11` + auto-render from jsdelivr, pinned) and renders on `load`
with `output: 'mathml'`, so no KaTeX stylesheet or font files are needed (and the deck stays
artifact-safe). Delete the KaTeX `<script>` tags if the deck has no math.

- Inline: `\( y = A\sin(2\pi f t) \)` · Display: `$$ \mathcal{L} = -\sum_i y_i \log \hat y_i $$`
  or `\[ … \]`.
- Single `$…$` is deliberately **not** a delimiter — prices and shell snippets would turn into math.
- In HTML, write `<` and `&` inside math as `\lt` and `\&` (or `&lt;`), or the parser eats them.
- One key equation per slide, large: wrap it in `<p style="font-size:56px">$$…$$</p>`. Annotate
  terms with colored text below rather than cramming explanations into the formula.
- Math inside a demo readout: call `katex.render(tex, el, { output: 'mathml', throwOnError: false })`
  when the value changes.

## Code

Use `pre.code` (monospace, 26px, surface background). Keep ≤ 14 lines per slide — show the 5 lines
that matter and say "…" for the rest. Highlight by hand with spans; it's more readable on a slide than
full syntax coloring because you choose what to emphasize:

```html
<pre class="code"><span class="c">// 핵심은 이 한 줄</span>
logits = q @ k.T <span class="hl">/ math.sqrt(d_k)</span>
attn = softmax(logits, dim=-1)</pre>
```
```css
pre.code .c  { color: var(--muted); }                       /* comment */
pre.code .k  { color: var(--accent-2); }                    /* keyword */
pre.code .hl { background: color-mix(in srgb, var(--accent) 22%, transparent); border-radius: 6px; padding: 0 6px; }
```
Add these three rules to the deck's `<style>` when a slide uses them.

Step-revealed code: put each line in its own `<span class="step">` inside the `pre` (with explicit
`\n` between spans) to walk through it line by line.

Live code demos (run user-editable code) are rarely worth it on stage; prefer Pattern 2 (step-through)
from `demos.md` with precomputed outputs.
