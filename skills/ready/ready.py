#!/usr/bin/env python3
"""Ticket readiness: does each ticket carry enough requirement to be executed?

One line per ticket file. ⛔ lines first, ✅ lines last, nothing else.
The requirement list below is data on purpose — a new requirement is a new
list entry, not a new branch in the code.
"""

import pathlib
import sys

# --- the requirement list (data, not code) ---------------------------------
REQUIRED_SECTIONS = [
    "Outcome",
    "Scope",
    "Out of scope",
    "Acceptance criteria",
    "Verification",
    "Dependencies",
]
REQUIRED_FIELDS = ["story_points"]

TICKETS_DIR = pathlib.Path("a-team/tickets")


def parse(text):
    """Return (frontmatter dict, set of '## ' section titles), or (None, None)."""
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return None, None
    try:
        end = lines.index("---", 1)
    except ValueError:
        return None, None

    front = {}
    for line in lines[1:end]:
        if line.startswith((" ", "\t", "-")) or ":" not in line:
            continue  # nested value or list item — not a top-level field
        key, _, value = line.partition(":")
        front[key.strip()] = value.strip()

    sections = {
        line[3:].strip() for line in lines[end + 1 :] if line.startswith("## ")
    }
    return front, sections


def judge(path):
    """Return (id, missing list) or (id, None) when the file is not a ticket."""
    front, sections = parse(path.read_text(encoding="utf-8", errors="replace"))
    if front is None or not front.get("id"):
        return path.stem, None

    missing = [s for s in REQUIRED_SECTIONS if s not in sections]
    missing += [f for f in REQUIRED_FIELDS if not front.get(f)]
    return front["id"], missing


def main():
    paths = sorted(TICKETS_DIR.glob("*.md"))
    if not paths:
        print(f"nincs ticketfájl itt: {TICKETS_DIR}", file=sys.stderr)
        return 1

    rows = [judge(p) for p in paths]
    width = max(len(ident) for ident, _ in rows)

    broken = [(i, m) for i, m in rows if m is None]
    incomplete = [(i, m) for i, m in rows if m]
    complete = [(i, m) for i, m in rows if m == []]

    for ident, _ in broken:
        print(f"{ident:<{width}} ⛔ nem ticket (hiányzó frontmatter)")
    for ident, missing in incomplete:
        print(f"{ident:<{width}} ⛔ {', '.join(missing)}")
    for ident, _ in complete:
        print(f"{ident:<{width}} ✅")

    print(
        f"— {len(complete)} kész, {len(incomplete)} hiányos"
        + (f", {len(broken)} nem ticket" if broken else "")
        + f" ({len(rows)} fájl)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
