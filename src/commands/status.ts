import { findRepositoryRoot, workspacePath } from "../filesystem/workspace.js";
import { idFromEntityFile, listIds } from "../filesystem/entities.js";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export function statusCommand() {
  const root = findRepositoryRoot();
  const byDirectory = (state: string) => {
    const path = workspacePath(root, state);
    if (!existsSync(path)) return [];
    return readdirSync(path).filter((name) => name.endsWith(".md")).map((name) => idFromEntityFile(join(path, name), name)).filter((id): id is string => id !== null);
  };
  return { ok: true, command: "status", data: { readyTickets: byDirectory("ready"), activeTickets: byDirectory("active"), reviewTickets: byDirectory("review"), newFindings: byDirectory("findings/new"), allTickets: listIds(root, "ticket") } };
}
