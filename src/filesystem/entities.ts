import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const TICKET_STATES = ["backlog", "ready", "active", "review", "done"] as const;

export function findTicket(root: string, id: string): { path: string; state: string; filename: string } {
  for (const state of TICKET_STATES) {
    const directory = join(root, ".a-team", state);
    if (!existsSync(directory)) continue;
    const filename = readdirSync(directory).find((name) => name.startsWith(`${id}-`) && name.endsWith(".md"));
    if (filename) return { path: join(directory, filename), state, filename };
  }
  throw new Error(`Ticket ${id} was not found.`);
}

export function listIds(root: string, entity: "ticket" | "finding" | "package"): string[] {
  const workspace = join(root, ".a-team");
  const directories = entity === "ticket"
    ? TICKET_STATES.map(String)
    : entity === "finding" ? ["findings/new", "findings/resolved"] : ["packages/backlog", "packages/ready", "packages/active", "packages/done"];
  const prefix = entity === "ticket" ? "T-" : entity === "finding" ? "F-" : "P-";
  return directories.flatMap((directory) => {
    const path = join(workspace, directory);
    return existsSync(path) ? readdirSync(path).filter((name) => name.startsWith(prefix)).map((name) => name.split("-").slice(0, 2).join("-")) : [];
  });
}

export function nextId(root: string, entity: "ticket" | "finding" | "package"): string {
  const prefix = entity === "ticket" ? "T" : entity === "finding" ? "F" : "P";
  const max = listIds(root, entity).reduce((current, id) => Math.max(current, Number(id.split("-")[1])), 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}
