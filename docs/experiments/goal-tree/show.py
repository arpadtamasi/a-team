#!/usr/bin/env python3
"""Render a goal tree for reading. Zero dependencies.

Usage:
  python3 show.py M-1.tree.json            # whole tree, one line per node
  python3 show.py M-1.tree.json M-1.4      # one subtree, with criteria and checks
"""
import json, sys, pathlib

path = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "M-1.tree.json")
focus = sys.argv[2] if len(sys.argv) > 2 else None
tree = json.loads(path.read_text())
nodes = {n["id"]: n for n in tree["nodes"]}
kids = {}
for n in tree["nodes"]:
    kids.setdefault(n["parent"], []).append(n["id"])
for v in kids.values():
    v.sort(key=lambda i: [int(p) for p in i.split(".")[1:]] or [0])

def subtree_minutes(nid):
    n = nodes[nid]
    if n["leaf"]:
        return n.get("est_minutes", 0)
    return sum(subtree_minutes(c) for c in kids.get(nid, []))

def line(nid, indent):
    n = nodes[nid]
    star = "★" if n["owner"] == "human" else " "
    mins = subtree_minutes(nid)
    time = f"{mins//60}h{mins%60:02d}" if mins >= 60 else (f"{mins}m" if mins else "  -")
    mark = "·" if n["leaf"] else "▾"
    print(f"{star} {time:>6s}  {'  ' * indent}{mark} {nid:<12s} {n['title']}")
    if focus:
        pad = "  " * indent + "               "
        if not n["leaf"] and n.get("why_not_leaf"):
            print(f"{'':>9s}{pad}nem levél: {n['why_not_leaf']}")
        for c in n["criteria"]:
            ck = c["check"]
            print(f"{'':>9s}{pad}[{ck['type']}] {c['statement']}")
            print(f"{'':>9s}{pad}        → {ck['how'][:110]}")
        print()
    for c in kids.get(nid, []):
        line(c, indent + 1)

root = focus or tree["root"]
if root not in nodes:
    sys.exit(f"nincs ilyen node: {root}")
print(f"{'ember':>1s} {'idő':>6s}  fa: {path.name}\n")
line(root, 0)
total = subtree_minutes(root)
human = [i for i in nodes if nodes[i]["owner"] == "human"]
print(f"\n★ = a te döntésed ({len(human)} db)   ▾ = bontva   · = levél")
print(f"összes becsült levélmunka: {total//60}h {total%60}m")
