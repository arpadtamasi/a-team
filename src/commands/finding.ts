import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { findRepositoryRoot, regenerateIndex } from "../filesystem/workspace.js";
import { findTicket, nextId } from "../filesystem/entities.js";
import { parseMarkdown, renderMarkdown, sections } from "../core/markdown.js";
import { newTicket } from "./ticket.js";

function slugify(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

function findFinding(root: string, id: string) {
  for (const state of ["new", "resolved"]) {
    const directory = join(root, ".a-team/findings", state);
    if (!existsSync(directory)) continue;
    const filename = readdirSync(directory).find((name) => name.startsWith(`${id}-`));
    if (filename) return { state, filename, path: join(directory, filename) };
  }
  throw new Error(`Finding ${id} was not found.`);
}

export function newFinding(options: { title: string; type: string; evidence: string; discoveredDuring?: string }) {
  const root = findRepositoryRoot();
  const id = nextId(root, "finding");
  const filename = `${id}-${slugify(options.title)}.md`;
  const directory = join(root, ".a-team/findings/new");
  mkdirSync(directory, { recursive: true });
  const data = { id, title: options.title, status: "new", origin: "agent", finding_type: options.type, confidence: "high", severity: "medium", discovered_during: options.discoveredDuring ?? null, created_at: new Date().toISOString().slice(0, 10) };
  const content = `# ${id} — ${options.title}\n\n## Observation\n\n${options.title}.\n\n## Evidence\n\n${options.evidence}\n\n## Impact hypothesis\n\nThis may cause incorrect or inconsistent behaviour.\n\n## Confidence\n\nHigh: the evidence is directly observable.\n\n## Suggested disposition\n\nInvestigate and create the smallest appropriate ticket after human approval.\n`;
  const path = join(directory, filename);
  writeFileSync(path, renderMarkdown(data, content));
  regenerateIndex(root);
  return { ok: true, command: "finding new", data: { id, path } };
}

export function validateFinding(id: string) {
  const root = findRepositoryRoot();
  const finding = findFinding(root, id);
  const entity = parseMarkdown(readFileSync(finding.path, "utf8"));
  const body = sections(entity.content);
  const required = ["Observation", "Evidence", "Impact hypothesis", "Confidence", "Suggested disposition"];
  const errors = required.filter((heading) => !body.get(heading.toLowerCase())?.trim()).map((heading) => ({ code: "MISSING_SECTION", message: `Missing or empty section: ${heading}.` }));
  const title = String(entity.data.title ?? "").trim().toLowerCase();
  const duplicates: string[] = [];
  for (const state of ["new", "resolved"]) {
    const directory = join(root, ".a-team/findings", state);
    if (!existsSync(directory)) continue;
    for (const filename of readdirSync(directory).filter((name) => name.endsWith(".md") && !name.startsWith(`${id}-`))) {
      const candidate = parseMarkdown(readFileSync(join(directory, filename), "utf8"));
      if (String(candidate.data.title ?? "").trim().toLowerCase() === title) duplicates.push(String(candidate.data.id));
    }
  }
  for (const state of ["backlog", "ready", "active", "review", "done"]) {
    const directory = join(root, ".a-team", state);
    if (!existsSync(directory)) continue;
    for (const filename of readdirSync(directory).filter((name) => name.startsWith("T-") && name.endsWith(".md"))) {
      const candidate = parseMarkdown(readFileSync(join(directory, filename), "utf8"));
      if (String(candidate.data.title ?? "").trim().toLowerCase() === title) duplicates.push(String(candidate.data.id));
    }
  }
  return { ok: errors.length === 0, command: "finding validate", data: { id, state: finding.state, duplicates }, errors };
}

export function resolveFinding(id: string, disposition: string, approved: boolean) {
  const allowed = ["create-ticket", "attach-existing", "investigate", "accept-risk", "reject", "merge-duplicate"];
  if (!allowed.includes(disposition)) throw new Error(`Unknown disposition '${disposition}'.`);
  if (!approved) throw new Error("Human approval is required to resolve a finding.");
  const root = findRepositoryRoot();
  const finding = findFinding(root, id);
  if (finding.state !== "new") throw new Error(`Finding ${id} is already resolved.`);
  const validation = validateFinding(id);
  if (!validation.ok) throw new Error((validation.errors ?? []).map((error) => error.message).join("\n"));
  const entity = parseMarkdown(readFileSync(finding.path, "utf8"));
  let ticketId: string | undefined;
  if (disposition === "create-ticket") {
    const created = newTicket({ title: String(entity.data.title), type: "feature", profiles: [] });
    ticketId = created.data.id;
    const ticket = findTicket(root, ticketId);
    const ticketEntity = parseMarkdown(readFileSync(ticket.path, "utf8"));
    ticketEntity.data.origin = "finding";
    ticketEntity.data.source_finding = id;
    writeFileSync(ticket.path, renderMarkdown(ticketEntity.data, ticketEntity.content));
  }
  entity.data.status = "resolved";
  entity.data.disposition = disposition;
  entity.data.resolved_at = new Date().toISOString();
  if (ticketId) entity.data.ticket = ticketId;
  const directory = join(root, ".a-team/findings/resolved");
  mkdirSync(directory, { recursive: true });
  const destination = join(directory, finding.filename);
  writeFileSync(destination, renderMarkdown(entity.data, entity.content));
  unlinkSync(finding.path);
  regenerateIndex(root);
  return { ok: true, command: "finding resolve", data: { id, disposition, ticketId } };
}
