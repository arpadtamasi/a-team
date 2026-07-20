#!/usr/bin/env python3
"""a-team prime — compact workflow context for agents (~60 lines instead of ~800).

Usage: python3 prime.py [workspace-dir]     (default: ./a-team, fallback ./scrum)
Read-only. Prints current state + operating rules an agent needs for one session.
"""
import json, pathlib, re, sys, datetime, collections

ws = None
for cand in ([sys.argv[1]] if len(sys.argv) > 1 else []) + ["a-team", "scrum"]:
    p = pathlib.Path(cand)
    if (p / "backlog.md").exists():
        ws = p; break
if not ws:
    sys.exit("no a-team/ or scrum/ workspace here")

def fm(path):
    m = re.match(r"^---\n(.*?)\n---", path.read_text(), re.S)
    return dict(re.findall(r"^([a-z_]+):[ \t]*(.*)$", m.group(1), re.M)) if m else {}

tickets = [fm(f) for f in sorted((ws / "tickets").glob("*.md"))]
tickets = [t for t in tickets if t.get("id")]
by = collections.defaultdict(list)
for t in tickets: by[t.get("status", "backlog")].append(t)

events = []
ev_path = ws / "metrics" / "events.jsonl"
if ev_path.exists():
    for line in ev_path.read_text().splitlines():
        try: events.append(json.loads(line))
        except ValueError: pass

# age-in-state comes from the last lifecycle event, exactly as skills/board/serve.mjs
# derives it. Never from ready_at/started_at, which measure time since an earlier
# transition, not time in the current state.
STATUS_EV = {
    "ticket_created", "ticket_ready", "ticket_started", "ticket_submitted_for_review",
    "rework_started", "ticket_blocked", "ticket_unblocked", "ticket_done",
    "ticket_parked", "ticket_rejected",
}
status_since = {}
for e in events:
    tid = e.get("ticket_id")
    if tid and e.get("event") in STATUS_EV and e.get("timestamp"):
        status_since[tid] = e["timestamp"]

now = datetime.datetime.now(datetime.timezone.utc)
def age(iso):
    if not iso: return "?"
    try: d = now - datetime.datetime.fromisoformat(iso).astimezone(datetime.timezone.utc)
    except ValueError: return "?"
    h = d.total_seconds() / 3600
    return f"{d.days}d" if h >= 24 else f"{h:.0f}h"

def state_age(t):
    """Time in the CURRENT state. Falls back to created_at only when the ticket has no
    lifecycle event at all, and that fallback is disclosed by the '?' age."""
    return age(status_since.get(t["id"]) or t.get("created_at"))

print(f"# A-Team prime — {ws.name}/ workspace, {now.strftime('%Y-%m-%d %H:%M')}Z")
print()
counts = " · ".join(f"{s}:{len(by[s])}" for s in
    ("backlog", "ready", "in_progress", "review", "blocked", "done", "parked", "rejected") if by[s])
print(f"STATE: {len(tickets)} tickets — {counts}")

sprint = ws / "sprint.md"
if sprint.exists():
    txt = sprint.read_text()
    g = re.search(r"## Sprint goal\n+(.+)", txt)
    st = re.search(r"Status:\s*`?(\w+)`?", txt)
    print(f"SPRINT: {st.group(1) if st else '?'} — {g.group(1).strip() if g else '?'}")
mdir = ws / "milestones"
if mdir.exists():
    for f in sorted(mdir.glob("*.md")):
        m = fm(f)
        if m.get("status") == "active":
            print(f"MILESTONE {m['id']}: {m.get('goal', m.get('title', ''))}")

for label, key in (("IN PROGRESS", "in_progress"), ("IN REVIEW (needs verdict)", "review"),
                   ("BLOCKED", "blocked"), ("READY (next up, in order)", "ready")):
    if by[key]:
        print(f"\n{label}:")
        for t in by[key][:6]:
            sp = f" [{t['story_points']} SP]" if t.get("story_points") else ""
            ctr = t.get("milestone") or t.get("sprint") or ""
            print(f"  {t['id']}{sp} {t.get('title','')[:70]}"
                  f"  ({ctr + ', ' if ctr else ''}{state_age(t)} in state)")

if events:
    print("\nLAST EVENTS:")
    for e in events[-4:]:
        print(f"  {e.get('timestamp','')[:16]} {e.get('event','')} {e.get('ticket_id', e.get('sprint', e.get('milestone','')))}")

print("""
RULES (non-negotiable, full text: METHOD.md + PROCESSES.md):
- One operation owns each transition. Never edit status/backlog/sprint files directly.
- done requires: submit-review -> review-ticket verdict -> close-ticket. Never self-close.
- HUMAN GATES (never auto-decide): sprint/milestone commitment; scope change after ready;
  accepting open findings; undecidable product/architecture calls; disposition + history
  correction; method/skill changes; branch/push/PR/deploy/destructive/external actions.
- New work -> capture-work (backlog), never straight to implementation.
- Events are append-only; metrics derive from events, never hand-set.
OPS: init-workspace capture-work refine-ticket plan-sprint start-ticket block-ticket
     submit-review review-ticket close-ticket disposition-ticket close-sprint retro
     reconcile-history report-status report-metrics board prime howto report-issue""")
