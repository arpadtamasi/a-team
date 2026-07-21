import { findRepositoryRoot } from "../filesystem/workspace.js";
import { listIds } from "../filesystem/entities.js";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export function statusCommand() {
  const root = findRepositoryRoot();
  const byDirectory = (state: string, prefix: string) => {
    const path = join(root, ".a-team", state);
    return existsSync(path) ? readdirSync(path).filter((name) => name.startsWith(prefix)).map((name) => name.split("-").slice(0, 2).join("-")) : [];
  };
  return { ok: true, command: "status", data: { readyTickets: byDirectory("ready", "T-"), activeTickets: byDirectory("active", "T-"), reviewTickets: byDirectory("review", "T-"), newFindings: byDirectory("findings/new", "F-"), allTickets: listIds(root, "ticket") } };
}
