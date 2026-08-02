#!/usr/bin/env python3
"""
Build the "AI, Unplugged" deck from src/ into a single self-contained HTML file.

    python3 build.py              -> index.html       (readable, committed)
                                     posters/*.html   (A3 promo posters)
    python3 build.py --release    -> dist/index.html  (smaller, gitignored)
    python3 build.py --pdf        -> posters/*.pdf    (headless Chrome, gitignored)

Stdlib only, on purpose. The deck must build on a laptop with nothing
installed but Python, the same way it must run with no network.

Directives, usable anywhere in any source file:

    <!--#include css/*.css -->     splice in file(s); globs allowed, sorted
    <!--#base64 assets/mlx.png --> splice in a data: URI for a binary asset

Paths are relative to src/, never to the including file — one rule, no
surprises when a partial moves.

Release mode does only provably-safe things: strip comments, collapse CSS
whitespace to single spaces, and remove leading indentation from the JS.
It deliberately does NOT strip JS comments or rewrite JS tokens. Hand-rolling
a minifier without a parser is how you get an ASI bug — or an eaten regex
literal — that appears only in the build you present from. See slim_js for
why de-indenting specifically is safe here, and for the one change to src/js/
that would make it unsafe.
"""

import base64
import mimetypes
import pathlib
import re
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
MAX_DEPTH = 10

INCLUDE = re.compile(r"[ \t]*<!--#include\s+(\S+)\s*-->")
BASE64 = re.compile(r"<!--#base64\s+(\S+)\s*-->")


class BuildError(Exception):
    pass


def resolve(pattern, directive):
    """Glob relative to src/. Empty matches are an error, never a silent no-op."""
    hits = sorted(SRC.glob(pattern))
    if not hits:
        raise BuildError(f"{directive} {pattern!r} matched no files under {SRC}")
    return hits


def expand(text, depth=0):
    if depth > MAX_DEPTH:
        raise BuildError("include nesting too deep — circular #include?")

    def do_base64(m):
        path = resolve(m.group(1), "#base64")[0]
        mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        blob = base64.b64encode(path.read_bytes()).decode("ascii")
        return f"data:{mime};base64,{blob}"

    text = BASE64.sub(do_base64, text)

    def do_include(m):
        parts = [p.read_text().rstrip("\n") for p in resolve(m.group(1), "#include")]
        return expand("\n".join(parts), depth + 1)

    return INCLUDE.sub(do_include, text)


def slim_css(css):
    """Strip comments and collapse whitespace runs to ONE space — outside
    string literals only.

    A single space is legal wherever whitespace was legal, so this cannot
    break `calc(7px * var(--r-scale))` the way punctuation-aware squeezing
    can. Quoted values are copied through untouched, so `content: "  "`, a
    data: URI, or a font name keeps its exact bytes, and a `/*` appearing
    inside a string can no longer be mistaken for a comment.
    """
    out, i, n = [], 0, len(css)

    def space():
        if out and out[-1] != " ":
            out.append(" ")

    while i < n:
        c = css[i]
        if c in "\"'":                                   # string: verbatim
            q, j = c, i + 1
            while j < n:
                if css[j] == "\\":
                    j += 2
                    continue
                if css[j] == q:
                    j += 1
                    break
                j += 1
            out.append(css[i:j])
            i = j
        elif css.startswith("/*", i):                    # comment -> separator
            j = css.find("*/", i + 2)
            i = n if j < 0 else j + 2
            space()
        elif c in " \t\r\n\f":
            while i < n and css[i] in " \t\r\n\f":
                i += 1
            space()
        else:
            out.append(c)
            i += 1
    return "".join(out).strip()


def slim_js(js):
    """Strip leading indentation and blank lines. Nothing else.

    This is the ONLY transform on JavaScript that can be justified without a
    parser, and it is safe for one specific reason: no token in this codebase
    spans a line boundary. There are no template literals (every backtick in
    src/js/ sits inside a comment) and no backslash line-continuations, so
    the only thing at the start of a line is either whitespace or the start
    of a token. Newlines are preserved, so automatic semicolon insertion sees
    exactly the line structure it saw before.

    Comments are deliberately NOT stripped. That needs a lexer that can tell
    a regex literal from a division, and the classic failure — an eaten
    regex — would appear only in the build you present from.

    If a template literal is ever added to src/js/, DELETE THIS FUNCTION.
    A multi-line `...` would have its indentation silently rewritten.
    """
    out = []
    for line in js.split("\n"):
        line = line.lstrip(" \t")
        if line:
            out.append(line)
    return "\n".join(out)


def release(html):
    html = re.sub(
        r"<style>(.*?)</style>",
        lambda m: "<style>" + slim_css(m.group(1)) + "</style>",
        html,
        flags=re.S,
    )
    # Comments only outside <script>; a "-->" inside a JS string would
    # otherwise make the regex eat live code.
    head, sep, tail = html.partition("<script>")
    head = re.sub(r"<!--.*?-->", "", head, flags=re.S)
    if sep:
        js, close, rest = tail.rpartition("</script>")
        tail = slim_js(js) + close + rest
    return head + sep + tail


def build_posters():
    """src/posters/*.html -> posters/*.html

    Promo posters for the workshop. They are separate documents, not deck
    slides — dropping them in src/slides/ would splice them straight into
    the deck, since that include is a glob. They share the deck's tokens
    and its inlined logos through the same #include directives, so a theme
    change lands on the posters too.

    Partials (_poster.css and friends) start with an underscore and so are
    skipped by the *.html glob, the same way the leading _ keeps them out
    of any future poster glob.
    """
    out_dir = ROOT / "posters"
    built = []
    for src in sorted((SRC / "posters").glob("*.html")):
        if src.name.startswith("_"):
            continue
        out = out_dir / src.name
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(
            expand(src.read_text()).replace(
                "<!DOCTYPE html>\n",
                "<!DOCTYPE html>\n<!-- GENERATED by build.py from src/posters/"
                f"{src.name} — do not edit this file by hand. -->\n",
                1,
            )
        )
        built.append(out)
    return built


CHROMES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
]


def find_chrome():
    for name in ("google-chrome", "chromium", "chromium-browser", "microsoft-edge"):
        hit = shutil.which(name)
        if hit:
            return hit
    for path in CHROMES:
        if pathlib.Path(path).exists():
            return path
    raise BuildError(
        "no Chrome/Chromium found for --pdf. Open the poster in a browser and "
        "print to PDF instead — the page box is set in CSS, so the dialog only "
        "needs 'Background graphics' on."
    )


def posters_to_pdf(pages):
    """Render each built poster with headless Chrome.

    Chrome is the renderer either way — this only saves a trip through the
    print dialog. The page size comes from the CSS @page box, so there is no
    paper-size flag to keep in sync with the stylesheet. The virtual time
    budget exists for poster A, whose weight grid is generated on load.
    """
    chrome = find_chrome()
    for page in pages:
        pdf = page.with_suffix(".pdf")
        subprocess.run(
            [
                chrome,
                "--headless",
                "--disable-gpu",
                "--no-pdf-header-footer",
                "--virtual-time-budget=4000",
                f"--print-to-pdf={pdf}",
                page.resolve().as_uri(),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if not pdf.exists():
            raise BuildError(f"chrome produced no PDF for {page.name}")
        print(f"  pdf -> {pdf.relative_to(ROOT)}  {pdf.stat().st_size / 1024:.1f} KB")


def main():
    mode_release = "--release" in sys.argv[1:]
    out = ROOT / ("dist/index.html" if mode_release else "index.html")

    src = SRC / "index.html"
    if not src.exists():
        raise BuildError(f"missing {src}")

    html = expand(src.read_text())
    if mode_release:
        html = release(html)

    banner = (
        "<!-- GENERATED by build.py from src/ — do not edit this file by hand. -->\n"
    )
    html = html.replace("<!DOCTYPE html>\n", "<!DOCTYPE html>\n" + banner, 1)

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html)

    kb = len(html.encode()) / 1024
    print(f"{'release' if mode_release else 'debug'} -> {out.relative_to(ROOT)}  "
          f"{kb:.1f} KB  {len(html.splitlines())} lines")

    pages = build_posters()
    for page in pages:
        print(f"poster  -> {page.relative_to(ROOT)}  "
              f"{page.stat().st_size / 1024:.1f} KB")
    if "--pdf" in sys.argv[1:]:
        posters_to_pdf(pages)


if __name__ == "__main__":
    try:
        main()
    except BuildError as e:
        sys.exit(f"build failed: {e}")
