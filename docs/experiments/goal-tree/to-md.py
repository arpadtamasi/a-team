#!/usr/bin/env python3
"""Render a goal tree as readable Markdown. Zero dependencies.

Usage: python3 to-md.py M-1.tree.json > M-1.tree.md
"""
import json, sys, pathlib

path = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "M-1.tree.json")
tree = json.loads(path.read_text())
nodes = {n["id"]: n for n in tree["nodes"]}
kids = {}
for n in tree["nodes"]:
    kids.setdefault(n["parent"], []).append(n["id"])
for v in kids.values():
    v.sort(key=lambda i: [int(p) for p in i.split(".")[1:]] or [0])

def mins(nid):
    n = nodes[nid]
    return n.get("est_minutes", 0) if n["leaf"] else sum(mins(c) for c in kids.get(nid, []))

def hm(m):
    return f"{m//60}h {m%60:02d}m" if m >= 60 else (f"{m}m" if m else "—")

TYPE_HU = {"command": "parancs", "ui": "UI", "process": "folyamat",
           "measurement": "mérés", "undecidable": "eldönthetetlen"}

root = tree["root"]
out = []
out.append(f"# Célfa — {root}\n")
out.append(f"> {nodes[root]['outcome']}\n")
human = [i for i in nodes if nodes[i]["owner"] == "human"]
leaves = [i for i in nodes if nodes[i]["leaf"]]
out.append(f"**{len(nodes)} cél · {len(leaves)} levél · {hm(mins(root))} becsült munka · "
           f"{len(human)} emberi döntés**\n")
out.append(f"Forrás: `{path.name}` · generálva: {tree['generated_at']}\n")

# --- decisions first: this is the control surface ---
out.append("## A te döntéseid\n")
out.append("Ezek nélkül az ügynök vagy áll, vagy kitalálja őket.\n")
out.append("| # | cél | idő | mit kell eldöntened |")
out.append("|---|---|---|---|")
for i in human:
    n = nodes[i]
    out.append(f"| `{i}` | {n['title']} | {hm(mins(i))} | {n['outcome']} |")
out.append("")

# --- overview ---
out.append("## Áttekintés\n")
out.append("`★` a te döntésed · `▾` bontva · `·` levél\n")
out.append("```")
def line(nid, depth):
    n = nodes[nid]
    star = "★" if n["owner"] == "human" else " "
    mark = "·" if n["leaf"] else "▾"
    out.append(f"{star} {hm(mins(nid)):>7s}  {'  ' * depth}{mark} {nid:<12s} {n['title']}")
    for c in kids.get(nid, []):
        line(c, depth + 1)
line(root, 0)
out.append("```\n")

# --- full detail ---
out.append("## Részletek\n")
def detail(nid, depth):
    n = nodes[nid]
    h = "#" * min(depth + 3, 6)
    star = " ★" if n["owner"] == "human" else ""
    out.append(f"{h} {nid} · {n['title']}{star}\n")
    out.append(f"{n['outcome']}\n")
    meta = [f"**{hm(mins(nid))}**", "levél" if n["leaf"] else f"{len(kids.get(nid,[]))} gyerek",
            f"gazda: {'ember' if n['owner']=='human' else 'ügynök'}"]
    if n.get("depends_on"):
        meta.append("függ: " + ", ".join(f"`{d}`" for d in n["depends_on"]))
    out.append(" · ".join(meta) + "\n")
    if not n["leaf"] and n.get("why_not_leaf"):
        out.append(f"*Miért nem levél:* {n['why_not_leaf']}\n")
    out.append("| # | állítás | ellenőrzés |")
    out.append("|---|---|---|")
    for c in n["criteria"]:
        ck = c["check"]
        how = ck["how"].replace("|", "\\|").replace("\n", " ")
        exp = ck.get("expect", "")
        exp = f"<br>→ {exp}" if exp else ""
        out.append(f"| {c['id']} | {c['statement']} | *{TYPE_HU.get(ck['type'], ck['type'])}* · `{how}`{exp} |")
    out.append("")
    if n.get("notes"):
        out.append(f"{n['notes']}\n")
    for c in kids.get(nid, []):
        detail(c, depth + 1)
detail(root, 0)

print("\n".join(out))
