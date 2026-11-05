"""Render deck slides to PNG and a contact sheet for visual review.

Two modes, because each sees something the other misses:
  --mode pdf (default)  print the deck to PDF with headless Edge/Chrome and render pages with PyMuPDF.
                        Same layout as the screen (print CSS keeps the 1920x1080 slide box; checked by
                        measuring both), and formulas are painted. Use this one by default.
  --mode screen         headless --screenshot of each slide at 1920x1080 (opens deck.html#N).
                        MathML is left unpainted (formulas show as blanks or a lone brace); useful
                        when the print path itself is in doubt.
  PNG size: --dpi 72 gives 1440x810 (the PDF page is 1440x810 pt); --dpi 96 gives 1920x1080.

usage: py render_slides.py http://localhost:8798/deck.html OUTDIR [--mode pdf|screen] [--slides 3,5-9] [--dpi 72] [--cols 2]
needs: pip install pymupdf pillow ; Edge or Chrome installed
writes: OUTDIR/sNN.png for each chosen slide, OUTDIR/sheet-1.png ... (6 slides per sheet)
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image, ImageDraw

BROWSERS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "google-chrome", "chromium", "msedge",
]


def find_browser():
    for b in BROWSERS:
        if os.path.isfile(b) or shutil.which(b):
            return b
    sys.exit("no Edge/Chrome found; pass its path in BROWSERS")


def parse_slides(spec, n):
    if not spec:
        return list(range(1, n + 1))
    out = []
    for part in spec.split(","):
        a, _, b = part.partition("-")
        out += list(range(int(a), int(b or a) + 1))
    return [k for k in out if 1 <= k <= n]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("out")
    ap.add_argument("--slides", default="")
    ap.add_argument("--dpi", type=int, default=72)  # 72 dpi on a 1920x1080 px page = 1920x1080 png
    ap.add_argument("--cols", type=int, default=2)
    ap.add_argument("--mode", choices=["pdf", "screen"], default="pdf")
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    if a.mode == "screen":
        if not a.slides:
            sys.exit("--mode screen needs --slides (one browser launch per slide)")
        files = []
        for k in parse_slides(a.slides, 999):
            f = out / f"s{k:02d}.png"
            prof = tempfile.mkdtemp(prefix="deckshot_")
            subprocess.run([find_browser(), "--headless", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={prof}",
                            "--window-size=1920,1080", "--virtual-time-budget=4000", f"--screenshot={f}",
                            f"{a.url.split('#')[0]}#{k}"], check=True, capture_output=True)
            files.append(f)
        print(f"captured {len(files)} slides (screen layout) to {out}")
        return sheets(files, out, a.cols)
    pdf = out / "_deck.pdf"
    prof = tempfile.mkdtemp(prefix="deckpdf_")
    subprocess.run([find_browser(), "--headless", "--disable-gpu", "--no-pdf-header-footer",
                    f"--user-data-dir={prof}", "--virtual-time-budget=20000",
                    f"--print-to-pdf={pdf}", a.url], check=True, capture_output=True)
    doc = fitz.open(pdf)
    pages = parse_slides(a.slides, doc.page_count)
    files = []
    for k in pages:
        f = out / f"s{k:02d}.png"
        doc[k - 1].get_pixmap(dpi=a.dpi).save(f)
        files.append(f)
    print(f"{doc.page_count} pages in PDF; rendered {len(files)} slides to {out}")
    sheets(files, out, a.cols)


def sheets(files, out, cols):
    W, H = 960, 540
    for si in range(0, len(files), 6):
        group = files[si:si + 6]
        rows = (len(group) + cols - 1) // cols
        sheet = Image.new("RGB", (W * cols, H * rows), "white")
        for j, f in enumerate(group):
            im = Image.open(f).convert("RGB").resize((W, H))
            x, y = (j % cols) * W, (j // cols) * H
            sheet.paste(im, (x, y))
            ImageDraw.Draw(sheet).rectangle([x, y, x + W - 1, y + H - 1], outline="#bbbbbb")
            ImageDraw.Draw(sheet).text((x + 8, y + 6), f.stem, fill="red")
        sheet.save(out / f"sheet-{si // 6 + 1}.png")
    print("contact sheets:", ", ".join(str(p) for p in sorted(out.glob("sheet-*.png"))))


if __name__ == "__main__":
    main()
