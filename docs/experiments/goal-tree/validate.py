#!/usr/bin/env python3
"""Validate an A-Team goal tree. Zero dependencies.

Usage: python3 validate.py M-1.tree.json

Checks the structural rules the model depends on. It cannot judge whether a check
is a GOOD check — only that one was named. Reading the leaves is still your job.
"""
import json, sys, pathlib, collections

path = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "M-1.tree.json")
if not path.exists():
    sys.exit(f"not found: {path}")
tree = json.loads(path.read_text())
nodes = {n["id"]: n for n in tree["nodes"]}
errors, warnings = [], []

def err(nid, msg): errors.append(f"  {nid}: {msg}")
def warn(nid, msg): warnings.append(f"  {nid}: {msg}")

if len(nodes) != len(tree["nodes"]):
    dupes = [i for i, c in collections.Counter(n["id"] for n in tree["nodes"]).items() if c > 1]
    err("tree", f"duplicate ids: {dupes}")
if tree["root"] not in nodes:
    err("tree", f"root {tree['root']} is not among the nodes")

children = collections.defaultdict(list)
for n in tree["nodes"]:
    p = n["parent"]
    if p is None:
        if n["id"] != tree["root"]:
            err(n["id"], "parent is null but this is not the root")
    elif p not in nodes:
        err(n["id"], f"parent {p} does not exist")
    else:
        children[p].append(n["id"])
    if p and not n["id"].startswith(p + "."):
        warn(n["id"], f"id does not extend its parent {p}; the tree is unreadable from ids alone")

for n in tree["nodes"]:
    nid, kids = n["id"], children[n["id"]]

    # rule 1: a leaf has no children; a non-leaf has at least two
    if n["leaf"] and kids:
        err(nid, f"marked leaf but has children {kids}")
    if not n["leaf"]:
        if not kids:
            err(nid, "marked non-leaf but has no children — the tree stops without saying who does the work")
        elif len(kids) == 1:
            warn(nid, "a single child is not a decomposition; either merge it up or find its siblings")
        if not n.get("why_not_leaf"):
            err(nid, "non-leaf must state why_not_leaf: which criterion cannot be checked yet")

    # rule 2: every criterion carries a check; a leaf's checks are all decidable
    for c in n["criteria"]:
        t = c["check"]["type"]
        how = c["check"].get("how", "")
        if n["leaf"] and t == "undecidable":
            err(nid, f"criterion {c['id']} is undecidable, so this cannot be a leaf")
        if len(how) < 12:
            warn(nid, f"criterion {c['id']} check.how is too vague to run: {how!r}")
        for weasel in ("works", "correct", "properly", "as expected", "megfelelő", "működik"):
            if weasel in how.lower():
                warn(nid, f"criterion {c['id']} check.how contains '{weasel}' — name the observation, not the judgement")

    # rule 3: dependencies exist and do not point into your own subtree
    for d in n.get("depends_on", []):
        if d not in nodes:
            err(nid, f"depends_on unknown node {d}")
        elif d.startswith(nid + ".") or nid.startswith(d + "."):
            err(nid, f"depends_on {d} is an ancestor/descendant — that is decomposition, not ordering")

leaves = [n for n in tree["nodes"] if n["leaf"]]
human = [n["id"] for n in tree["nodes"] if n["owner"] == "human"]
depth = max((n["id"].count(".") for n in tree["nodes"]), default=0) + 1

print(f"{path.name}: {len(tree['nodes'])} node, {len(leaves)} leaf, depth {depth}")
print(f"  checks: " + ", ".join(f"{t}={sum(1 for n in tree['nodes'] for c in n['criteria'] if c['check']['type']==t)}"
      for t in ("command", "ui", "process", "measurement", "undecidable")))
print(f"  human-owned: {len(human)}" + (f" -> {', '.join(human)}" if human else ""))
if est := [n.get("est_minutes") for n in leaves if n.get("est_minutes")]:
    print(f"  leaf effort: {sum(est)} min across {len(est)} estimated leaves")

if warnings:
    print(f"\nWARN ({len(warnings)}):"); print("\n".join(warnings))
if errors:
    print(f"\nFAIL ({len(errors)}):"); print("\n".join(errors)); sys.exit(1)
print("\nOK — structurally valid. Whether the checks are good checks is still a human read.")
