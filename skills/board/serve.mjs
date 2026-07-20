#!/usr/bin/env node
// A-Team board server. Read-only PM view over the workspace.
// - binds 127.0.0.1 only
// - serves ONLY: this skill dir (board assets) + /api/state (parsed workspace JSON)
// - never serves the repo root, .git, or raw workspace files
// Usage: node serve.mjs [--port 4400] [--workspace <dir>]   (cwd = consuming repo root)
import { createServer } from 'node:http';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = resolve(fileURLToPath(new URL('.', import.meta.url)));
const args = process.argv.slice(2);
const argOf = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const repo = process.cwd();
// workspace autodetect: a-team/ (canonical) or scrum/ (legacy consumers)
const wsName = argOf('--workspace',
  existsSync(join(repo, 'a-team', 'backlog.md')) ? 'a-team' :
  existsSync(join(repo, 'scrum', 'backlog.md')) ? 'scrum' : null);
if (!wsName) { console.error('No a-team/ or scrum/ workspace here.'); process.exit(1); }
const ws = join(repo, wsName);

const LIFECYCLE = ['backlog', 'ready', 'in_progress', 'review', 'blocked', 'done', 'parked', 'rejected'];

function frontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  if (!m) return [{}, text];
  const fm = {};
  for (const line of m[1].split('\n')) {
    const mm = /^([a-z_]+):[ \t]*(.*)$/.exec(line);
    if (mm) fm[mm[1]] = mm[2].trim();
  }
  return [fm, m[2]];
}

function state() {
  const tickets = {};
  const tdir = join(ws, 'tickets');
  if (existsSync(tdir)) for (const f of readdirSync(tdir)) {
    if (!f.endsWith('.md')) continue;
    const [fm, body] = frontmatter(readFileSync(join(tdir, f), 'utf8'));
    if (!fm.id) continue;
    tickets[fm.id] = {
      id: fm.id, title: fm.title || fm.id, file: f,
      lane: fm.lane && fm.lane !== 'null' ? fm.lane : '',
      type: fm.type || '', status: fm.status || 'backlog',
      sp: fm.story_points || '', sprint: fm.sprint || '',
      milestone: fm.milestone || '', branch: fm.branch || '',
      created_at: fm.created_at || '',
      summary: (body.replace(/^#+ .*$/gm, '').trim().split('\n').find(l => l.trim()) || '').slice(0, 200),
      status_since: null, history: [],
    };
  }
  // events: status truth + age-in-state
  const evPath = join(ws, 'metrics', 'events.jsonl');
  const STATUS_EV = {
    ticket_created: 'backlog', ticket_ready: 'ready', ticket_started: 'in_progress',
    ticket_submitted_for_review: 'review', rework_started: 'in_progress',
    ticket_blocked: 'blocked', ticket_done: 'done', ticket_parked: 'parked',
    ticket_rejected: 'rejected',
  };
  const milestones = {}; const sprints = {};
  if (existsSync(evPath)) for (const line of readFileSync(evPath, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let e; try { e = JSON.parse(line); } catch { continue; }
    const t = e.ticket_id && tickets[e.ticket_id];
    if (t && STATUS_EV[e.event]) {
      t.history.push({ ts: e.timestamp, event: e.event });
      t.status_since = e.timestamp; // last transition wins
    }
    if (e.event === 'ticket_unblocked' && t) { t.status_since = e.timestamp; }
    if (e.event === 'milestone_started') milestones[e.milestone] = { id: e.milestone, goal: e.goal || '', status: 'active', since: e.timestamp };
    if (e.event === 'milestone_closed' && milestones[e.milestone]) { milestones[e.milestone].status = 'closed'; }
    if (e.event === 'sprint_started') sprints[e.sprint] = { id: e.sprint, goal: e.goal || '', status: 'active', since: e.timestamp };
    if (e.event === 'sprint_closed' && sprints[e.sprint]) sprints[e.sprint].status = 'closed';
  }
  // milestone files override/extend event-derived list
  const mdir = join(ws, 'milestones');
  if (existsSync(mdir)) for (const f of readdirSync(mdir)) {
    if (!f.endsWith('.md')) continue;
    const [fm] = frontmatter(readFileSync(join(mdir, f), 'utf8'));
    if (fm.id) milestones[fm.id] = { id: fm.id, goal: fm.goal || '', status: fm.status || 'active', since: fm.created_at || '' };
  }
  for (const t of Object.values(tickets)) if (!t.status_since) t.status_since = t.created_at || null;
  return {
    workspace: wsName, generated_at: new Date().toISOString(),
    lifecycle: LIFECYCLE,
    tickets: Object.values(tickets),
    milestones: Object.values(milestones),
    sprints: Object.values(sprints).filter(s => s.status === 'active'),
  };
}

// Only board assets are servable. The server source and any future sibling file are not.
const ASSETS = new Map([
  ['board.html', 'text/html; charset=utf-8'],
]);
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/api/state') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(state()));
      return;
    }
    const name = url.pathname === '/' ? 'board.html' : url.pathname.slice(1);
    const mime = ASSETS.get(name);
    // allowlist first, then containment with a trailing separator so a sibling
    // directory (skills/board-x/) can never satisfy a prefix match
    const target = resolve(here, name);
    if (!mime || !target.startsWith(here + sep) || !existsSync(target)) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(readFileSync(target));
  } catch (err) { res.writeHead(500); res.end(String(err)); }
});

let port = Number(argOf('--port', 4400));
function listen(p, left) {
  server.once('error', (e) => {
    if (e.code === 'EADDRINUSE' && left > 0) listen(p + 1, left - 1);
    else { console.error(e.message); process.exit(1); }
  });
  server.listen(p, '127.0.0.1', () => console.log(`A-Team board: http://127.0.0.1:${p}/  (workspace: ${wsName}, read-only)`));
}
listen(port, 20);
