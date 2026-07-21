import { findRepositoryRoot } from "../filesystem/workspace.js";
import { idFromFilename, listIds } from "../filesystem/entities.js";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export function statusCommand() {
  const root = findRepositoryRoot();
  const byDirectory = (state: string) => {
    const path = join(root, ".a-team", state);
    return existsSync(path) ? readdirSync(path).map(idFromFilename).filter((id): id is string => id !== null) : [];
  };
  return { ok: true, command: "status", data: { readyTickets: byDirectory("ready"), activeTickets: byDirectory("active"), reviewTickets: byDirectory("review"), newFindings: byDirectory("findings/new"), allTickets: listIds(root, "ticket") } };
}
