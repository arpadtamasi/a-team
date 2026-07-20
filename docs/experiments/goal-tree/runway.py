#!/usr/bin/env python3
"""Runway: how long can the machine run before it needs you?

Splits the leaves of a goal tree into the two complementary piles the PO/PM and the
agent are each asking about:

  YOURS   - decisions only you may make, plus what each one unblocks
  MACHINE - leaves the agent can run now, self-verifying ones first

Usage: python3 runway.py M-1.tree.json
"""
import json, sys, pathlib

path = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "M-1.tree.json")
tree = json.loads(path.read_text())
N = {n["id"]: n for n in tree["nodes"]}
kids = {}
for n in tree["nodes"]:
    kids.setdefault(n["parent"], []).append(n["id"])

def ancestors(nid):
    out, cur = [], N[nid]["parent"]
    while cur:
        out.append(cur); cur = N[cur]["parent"]
    return out

def subtree(nid):
    yield nid
    for c in kids.get(nid, []):
        yield from subtree(c)

def hm(m):
    return f"{m//60}h{m%60:02d}m" if m >= 60 else f"{m}m"

SELF = {"command", "process", "measurement"}   # the machine can check itself
open_decisions = [i for i, n in N.items() if n["owner"] == "human"]

def blocked_by(nid):
    """which human decisions gate this leaf: an ancestor, or a dependency's ancestor"""
    gates = {a for a in ancestors(nid) if N[a]["owner"] == "human"}
    if N[nid]["owner"] == "human":
        gates.add(nid)
    for d in N[nid].get("depends_on", []):
        if d in N:
            gates |= {d} if N[d]["owner"] == "human" else set()
            gates |= {a for a in ancestors(d) if N[a]["owner"] == "human"}
    return gates

leaves = [i for i, n in N.items() if n["leaf"]]
free, gated, yours = [], [], []
for i in leaves:
    n = N[i]
    if n["owner"] == "human":
        yours.append(i); continue
    g = blocked_by(i)
    (gated if g else free).append(i)

def mins(ids): return sum(N[i].get("est_minutes", 0) for i in ids)

unattended = [i for i in free if all(c["check"]["type"] in SELF for c in N[i]["criteria"])]
needs_eyes = [i for i in free if i not in unattended]

print(f"CÉLFA: {path.name}  ({len(leaves)} levél)\n")
print("=" * 62)
print(f"A GÉPNEK — most indítható, kérdés nélkül")
print("=" * 62)
print(f"  önellenőrző (tényleg felügyelet nélkül): {hm(mins(unattended))}  [{len(unattended)} levél]")
print(f"  megcsinálja, de a végén rá kell nézned: {hm(mins(needs_eyes))}  [{len(needs_eyes)} levél]")
print(f"  ---")
print(f"  RUNWAY: {hm(mins(free))}")
for i in sorted(unattended):
    print(f"    · {i:<12s} {N[i]['title'][:56]}")
for i in sorted(needs_eyes):
    types = ",".join(sorted({c['check']['type'] for c in N[i]['criteria']}))
    print(f"    ◐ {i:<12s} {N[i]['title'][:48]} [{types}]")

print()
print("=" * 62)
print(f"NEKED — ezt kell tisztáznod, hogy tovább mehessen")
print("=" * 62)
rows = []
for d in sorted(yours):
    unlocks = [i for i in gated if d in blocked_by(i)]
    rows.append((mins(unlocks), d, unlocks))
rows.sort(reverse=True)
for m, d, unlocks in rows:
    own = N[d].get("est_minutes", 0)
    print(f"  ★ {d:<12s} {N[d]['title'][:48]}")
    print(f"       {own}m döntés  →  felszabadít {hm(m)} gépi munkát ({len(unlocks)} levél)")

total_gated = mins(gated)
print()
print("=" * 62)
print(f"  ma indítható:        {hm(mins(free))}")
print(f"  döntéseid mögött:    {hm(total_gated)}  ({len(gated)} levél)")
print(f"  a döntések ára:      {hm(mins([i for i in yours]))}")
print("=" * 62)
if mins(free) < 8 * 60:
    need = [f"{d}" for _, d, _ in rows[:3]]
    print(f"\n  Egy napra ({hm(8*60)}) nem elég. A három legnagyobb kaput nyisd ki:")
    print(f"  {', '.join(need)}")
