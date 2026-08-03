#!/usr/bin/env python3
"""
Run the deck's glossary audit and print it.

    python3 tools/glossary-audit.py            # audit ./index.html
    python3 tools/glossary-audit.py --strict   # ...and exit 1 on issues
    python3 tools/glossary-audit.py path.html

The audit itself lives in src/js/21-glossary-audit.js and runs in the
page, against the real DOM, using the real selectors and the real
regexes from the marking pass. That is the whole point of doing it this
way rather than parsing src/slides/*.html here: a Python re-implementation
of "which containers count as prose" would agree with the deck on the day
it was written and quietly stop agreeing a month later, which is the
failure mode the audit exists to catch.

So this script is a thin wrapper — open the built deck at ?audit in
headless Chrome, let it write its report into the page, and read it back
out of the dumped DOM. Chrome is already the dependency build.py --pdf
has; nothing new is required, and nothing is required at all if you would
rather just open index.html?audit in a browser and read the console.

Stdlib only, same rule as build.py.
"""

import html
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from build import BuildError, find_chrome  # noqa: E402  (same-repo helper)

PRE = re.compile(
    r'<pre[^>]*\bid="gloss-audit"[^>]*>(.*?)</pre>', re.S | re.I
)


def audit(page: pathlib.Path) -> str:
    chrome = find_chrome()
    url = page.resolve().as_uri() + "?audit"
    try:
        proc = subprocess.run(
            [
                chrome,
                "--headless",
                "--disable-gpu",
                # The marking pass runs at parse time and the audit right after
                # it, but the deck's own modules paint canvases on load; give
                # the page a moment rather than racing it.
                "--virtual-time-budget=4000",
                "--dump-dom",
                url,
            ],
            capture_output=True,
            text=True,
            # --virtual-time-budget bounds the page's clock, not the process:
            # a Chrome held up by a locked profile or a dead GPU process waits
            # for a human. Turn that into a failure that says so.
            timeout=120,
        )
    except subprocess.TimeoutExpired:
        raise BuildError(
            "chrome did not finish within 120s — another instance may be "
            "holding the profile. Open index.html?audit in a browser instead."
        )
    if proc.returncode != 0:
        raise BuildError(f"chrome exited {proc.returncode}: {proc.stderr.strip()[:400]}")
    found = PRE.search(proc.stdout)
    if not found:
        raise BuildError(
            "no audit block in the dumped DOM — is this a deck built from a "
            "src/ that includes js/21-glossary-audit.js?"
        )
    return html.unescape(found.group(1)).strip()


def main() -> None:
    args = [a for a in sys.argv[1:] if a != "--strict"]
    page = pathlib.Path(args[0]) if args else ROOT / "index.html"
    if not page.exists():
        raise BuildError(f"missing {page} — run python3 build.py first")

    report = audit(page)
    print(report)

    if "--strict" in sys.argv[1:]:
        tail = re.search(r"^AUDIT: (\d+) issue", report, re.M)
        # No summary line means the report format moved and this script can no
        # longer read the verdict. Passing would be worse than failing: a check
        # that cannot fail is a check nobody notices has stopped working.
        if not tail:
            raise BuildError(
                "no 'AUDIT: N issue' line in the report — the audit module's "
                "format changed and --strict cannot judge it"
            )
        if int(tail.group(1)):
            sys.exit(f"\nglossary audit: {tail.group(1)} issue(s) — see A and D above")


if __name__ == "__main__":
    try:
        main()
    except BuildError as e:
        sys.exit(f"audit failed: {e}")
