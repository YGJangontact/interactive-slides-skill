// check_deck.js — paste the whole file into the browser pane's javascript tool
// (mcp__Claude_Browser__javascript_tool) on a deck served over http://localhost.
// Returns a JSON report; "problems" empty means the deck passed.
(async () => {
  const problems = [];
  const warn = [];
  if (!window.Deck) return { problems: ['window.Deck missing — runtime script not loaded or crashed'], warn };
  await document.fonts.ready;
  // A hidden/background tab doesn't advance CSS transitions; disable them while measuring.
  const noAnim = document.createElement('style');
  noAnim.textContent = '*,*::before,*::after{transition:none!important;animation-duration:0s!important}';
  document.head.appendChild(noAnim);
  const slides = Deck.slides;
  const ids = new Set();
  const per = [];
  const startIndex = Deck.index, startStep = Deck.step;

  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    if (!s.id) warn.push(`slide ${i + 1}: no id`);
    else if (ids.has(s.id)) problems.push(`slide ${i + 1}: duplicate id "${s.id}"`);
    ids.add(s.id);

    Deck.go(i, -1); // all steps shown
    await new Promise(r => setTimeout(r, 60));
    const sr = s.getBoundingClientRect();
    const k = sr.width / 1920; // stage scale
    const issues = [];

    for (const el of s.querySelectorAll('*')) {
      if (el.closest('aside.notes, .demo-stage, svg, .katex')) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const out = Math.max(sr.left - r.left, r.right - sr.right, sr.top - r.top, r.bottom - sr.bottom) / k;
      if (out > 2) issues.push(`<${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}> spills ${Math.round(out)}px outside the slide`);
      if (/(hidden|clip|auto|scroll)/.test(cs.overflow + cs.overflowY) && el.scrollHeight > el.clientHeight + 2 && el.tagName !== 'HTML')
        issues.push(`<${el.tagName.toLowerCase()}> content is clipped (${el.scrollHeight - el.clientHeight}px hidden)`);
      const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      if (hasText && parseFloat(cs.fontSize) < 22) issues.push(`text "${el.textContent.trim().slice(0, 30)}" is ${cs.fontSize} (< 22px)`);
    }
    // slide-level vertical overflow (flex column pushing content down)
    if (s.scrollHeight > 1080 + 2) issues.push(`slide content is ${s.scrollHeight - 1080}px taller than 1080`);
    // content running out of its box: catches a table taller than its .demo-stage and SVG labels past
    // their card. The loop above skips .demo-stage and svg, so neither was reported before.
    const label = e => `<${e.tagName.toLowerCase()}${e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : ''}>`;
    for (const box of s.querySelectorAll('.demo, .demo-stage, .cols, .vrow, .card, .vcard, .vstrip, .kpis, .kpi, .eqbox, .fx')) {
      if (box.closest('aside.notes')) continue;
      const br = box.getBoundingClientRect();
      if (!br.width || !br.height) continue;
      let worst = 0, who = null;
      for (const d of box.querySelectorAll('*')) {
        // inside a formula only its <semantics> box counts: the outer <math> block is held at the card's width
        // while the formula itself runs past it; deeper MathML boxes report loose extents
        if (d.closest('.katex') && d.tagName.toLowerCase() !== 'semantics') continue;
        const dcs = getComputedStyle(d);
        if (dcs.display === 'none' || dcs.visibility === 'hidden' || dcs.position === 'fixed') continue;
        const r = d.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const out = Math.max(br.left - r.left, r.right - br.right, br.top - r.top, r.bottom - br.bottom) / k;
        if (out > worst) { worst = out; who = d; }
      }
      if (worst > 4) issues.push(`${label(who)} runs ${Math.round(worst)}px out of its ${label(box)} (clipped or drawn over the border)`);
      // overflow:hidden boxes hide the excess instead (e.g. a table centred in .demo-stage loses its
      // first and last rows): compare the scrollable size with the visible size
      const bcs = getComputedStyle(box);
      if (/(hidden|clip)/.test(bcs.overflow + bcs.overflowX + bcs.overflowY)) {
        const hid = Math.max(box.scrollHeight - box.clientHeight, box.scrollWidth - box.clientWidth);
        if (hid > 2) issues.push(`${label(box)} hides ${hid}px of its content (overflow hidden)`);
      }
    }
    // grid/flex siblings covering each other (a wide table under the chart beside it)
    for (const g of s.querySelectorAll('.cols, .vrow, .kpis, .vstrip')) {
      const kids = [...g.children].filter(e => e.getBoundingClientRect().width);
      for (let x = 0; x < kids.length; x++) for (let y = x + 1; y < kids.length; y++) {
        const a = kids[x].getBoundingClientRect(), b = kids[y].getBoundingClientRect();
        const w = (Math.min(a.right, b.right) - Math.max(a.left, b.left)) / k, h = (Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) / k;
        if (w > 3 && h > 3) issues.push(`${label(kids[x])} and ${label(kids[y])} overlap (${Math.round(w)}×${Math.round(h)}px) inside ${label(g)}`);
      }
    }
    // every data chart names the file its numbers came from (data-src="results/dose_sweep.md, table 2")
    const noSrc = [...s.querySelectorAll('figure.viz, figure img')].filter(f => !(f.closest('figure').dataset.src || '').trim()).length;
    if (noSrc) warn.push(`slide ${i + 1} (${s.id}): ${noSrc} chart/figure(s) without data-src (where the numbers come from)`);
    // chart labels colliding inside one SVG (end labels, value labels, tick labels)
    for (const svg of s.querySelectorAll('svg')) {
      const ts = [...svg.querySelectorAll('text')].map(t => t.getBoundingClientRect()).filter(r => r.width);
      let hits = 0;
      for (let x = 0; x < ts.length; x++) for (let y = x + 1; y < ts.length; y++) {
        const w = (Math.min(ts[x].right, ts[y].right) - Math.max(ts[x].left, ts[y].left)) / k;
        const h = (Math.min(ts[x].bottom, ts[y].bottom) - Math.max(ts[x].top, ts[y].top)) / k;
        if (w > 4 && h > 6) hits++;
      }
      if (hits) warn.push(`slide ${i + 1} (${s.id}): ${hits} overlapping text label pair(s) in an <svg>`);
    }
    // stacked blocks overlapping: a flex child squeezed by min-height:0 lets the next block cover it
    const flow = [...s.children].filter(e => !e.matches('aside.notes') && getComputedStyle(e).position !== 'absolute' && e.getBoundingClientRect().height);
    for (let j = 1; j < flow.length; j++) {
      const a = flow[j - 1].getBoundingClientRect(), b = flow[j].getBoundingClientRect();
      const ov = (a.bottom - b.top) / k;
      if (ov > 3) issues.push(`${label(flow[j])} overlaps the block above it by ${Math.round(ov)}px`);
    }
    // always-on rules: no large empty band at the bottom, not too much text
    if (!s.classList.contains('cover') && !s.classList.contains('statement')) {
      let bottom = 0;
      for (const el of s.children) {
        if (el.matches('aside.notes')) continue;
        const r = el.getBoundingClientRect();
        if (r.height) bottom = Math.max(bottom, (r.bottom - sr.top) / k);
      }
      if (bottom && 1080 - bottom > 180) warn.push(`slide ${i + 1} (${s.id}): content ends ${Math.round(1080 - bottom)}px above the bottom (${Math.round(1080 - bottom - parseFloat(getComputedStyle(s).paddingBottom))}px usable above the bottom padding)`);
      const chars = [...s.querySelectorAll('p, li, td, th, .card, figcaption')]
        .filter(e => !e.closest('aside.notes') && !e.querySelector('p, li, td'))
        .reduce((a, e) => a + e.textContent.replace(/\s+/g, '').length, 0);
      if (chars > 420) warn.push(`slide ${i + 1} (${s.id}): ${chars} characters of text`);
    }
    const nSteps = s.querySelectorAll('.step').length;
    const demoCount = Deck.demos.filter(d => d.slide === s).length;
    const hasNotes = !!s.querySelector('aside.notes');
    if (issues.length) problems.push(...issues.map(m => `slide ${i + 1} (${s.id}): ${m}`));
    per.push({ n: i + 1, id: s.id, steps: nSteps, demos: demoCount, notes: hasNotes });
  }

  // keyboard walk: → from the start must reach the last slide with every step
  Deck.go(0, 0);
  let guard = 0;
  while (!(Deck.index === slides.length - 1 && Deck.step === slides[slides.length - 1].querySelectorAll('.step').length) && guard < 1000) {
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    guard++;
  }
  if (guard >= 1000) problems.push('keyboard walk with → never reached the last slide');

  // demos: mounted without errors, inputs present on demo slides
  document.querySelectorAll('[data-demo-error]').forEach(el => problems.push(`demo ${el.id || el.className}: ${el.getAttribute('data-demo-error')}`));
  Deck.errors.forEach(e => problems.push(`runtime error: ${e}`));
  const demoEls = document.querySelectorAll('.demo');
  demoEls.forEach(el => { if (!Deck.demos.some(d => d.el === el)) warn.push(`.demo#${el.id} has no Deck.demo(...) registration`); });

  // external resources must be version-pinned
  document.querySelectorAll('script[src], link[rel=stylesheet][href]').forEach(n => {
    const u = n.src || n.href;
    if (/cdn\.jsdelivr\.net\/npm\/|unpkg\.com\//.test(u) && !/@\d+\.\d+/.test(u)) problems.push(`unpinned CDN url: ${u}`);
  });

  Deck.go(startIndex, startStep);
  noAnim.remove();
  return {
    pass: problems.length === 0,
    slides: slides.length,
    stepsTotal: per.reduce((a, p) => a + p.steps, 0),
    demos: Deck.demos.length,
    slidesWithoutNotes: per.filter(p => !p.notes).map(p => p.n),
    problems,
    warn,
    perSlide: per
  };
})()
