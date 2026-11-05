"""Keep a large deck as parts and build the single deck file from them.

  py build_parts.py split deck.html PARTS_DIR [--per 12]
      deck.html (built from the template, with the SLIDES START / SLIDES END markers) ->
      PARTS_DIR/_head.html      everything up to and including the SLIDES START line
      PARTS_DIR/_slides01.html  ... sections, --per slides per file
      PARTS_DIR/_tail.html      the SLIDES END line and everything after (demos, viz, runtime)
  py build_parts.py build PARTS_DIR OUT.html
      concatenates _head + _slides* (numeric order) + _tail into OUT.html and reports the slide
      count, duplicate ids and parts that hold no <section>.

Edit the parts, never the built file; rebuild after every edit. split followed by build
reproduces the original file byte for byte.
"""
import re
import sys
from pathlib import Path


def rd(f):
    with open(f, encoding="utf-8", newline="") as h:  # keep CRLF/LF exactly as written
        return h.read()


def wr(f, s):
    with open(f, "w", encoding="utf-8", newline="") as h:
        h.write(s)

MARK = r"<!--\s*=+\s*SLIDES %s"  # the marker comment lines, not the words in the template header


def split(deck, parts, per):
    s = rd(deck)
    ms, me = re.search(MARK % "START", s), re.search(MARK % "END", s)
    if not (ms and me):
        sys.exit("SLIDES START / SLIDES END marker comments not found")
    a = s.index("\n", ms.start()) + 1             # head keeps the START marker line
    b = s.rindex("\n", 0, me.start()) + 1         # tail starts at the END marker line
    head, body, tail = s[:a], s[a:b], s[b:]
    # cut the body before each <section, keeping any text before the first one with it
    cuts = [m.start() for m in re.finditer(r"(?m)^[ \t]*<section\b", body)]
    if not cuts:
        sys.exit("no <section> found between the markers")
    chunks, starts = [], [0] + cuts[per::per]
    for i, st in enumerate(starts):
        chunks.append(body[st:starts[i + 1]] if i + 1 < len(starts) else body[st:])
    out = Path(parts)
    out.mkdir(parents=True, exist_ok=True)
    wr(out / "_head.html", head)
    wr(out / "_tail.html", tail)
    for i, c in enumerate(chunks, 1):
        wr(out / f"_slides{i:02d}.html", c)
    print(f"{len(cuts)} slides -> {len(chunks)} slide parts in {out}")


def build(parts, out):
    p = Path(parts)
    files = sorted(p.glob("_slides*.html"), key=lambda f: int(re.sub(r"\D", "", f.stem) or 0))
    if not files:
        sys.exit(f"no _slides*.html in {p}")
    body = [rd(f) for f in files]
    s = rd(p / "_head.html") + "".join(body) + rd(p / "_tail.html")
    wr(out, s)
    ids = re.findall(r'<section\b[^>]*\bid="([^"]+)"', "".join(body))
    dup = sorted({i for i in ids if ids.count(i) > 1})
    empty = [f.name for f, b in zip(files, body) if "<section" not in b]
    n = len(re.findall(r"<section\b", "".join(body)))
    print(f"built {out}: {n} slides from {len(files)} parts"
          + (f"; DUPLICATE ids {dup}" if dup else "") + (f"; parts without slides {empty}" if empty else ""))


if __name__ == "__main__":
    if len(sys.argv) >= 4 and sys.argv[1] == "split":
        per = int(sys.argv[sys.argv.index("--per") + 1]) if "--per" in sys.argv else 12
        split(sys.argv[2], sys.argv[3], per)
    elif len(sys.argv) == 4 and sys.argv[1] == "build":
        build(sys.argv[2], sys.argv[3])
    else:
        sys.exit(__doc__)
