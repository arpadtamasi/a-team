import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const TICKET_STATES = ["backlog", "ready", "active", "review", "done"] as const;

export interface TicketLocation {
  path: string;
  state: string;
  filename: string;
}

export interface EffectiveTicket<T> {
  value: T;
  location: TicketLocation;
  worktree?: string;
  fallback?: { worktree: string; reason: string };
}

export function idFromFilename(filename: string): string | null {
  return /^(?:[TFP]-\d{3,}|O-\d+(?:\.\d+)?)(?=-)/.exec(filename)?.[0] ?? null;
}

export function findTicket(root: string, id: string): TicketLocation {
  for (const state of TICKET_STATES) {
    const directory = join(root, ".a-team", state);
    if (!existsSync(directory)) continue;
    const filename = readdirSync(directory).find((name) => name.startsWith(`${id}-`) && name.endsWith(".md"));
    if (filename) return { path: join(directory, filename), state, filename };
  }
  throw new Error(`Ticket ${id} was not found.`);
}

export function resolveEffectiveTicket<T>(root: string, id: string, read: (ticket: TicketLocation) => T): EffectiveTicket<T> {
  if (!/^(?:T-\d{3,}|O-\d+(?:\.\d+)?)$/.test(id)) throw new Error(`Invalid ticket id: ${id}`);
  const coordinator = findTicket(root, id);
  const worktree = join(root, ".worktrees", id);
  if (existsSync(worktree)) {
    try {
      const location = findTicket(worktree, id);
      return { value: read(location), location, worktree };
    } catch (error) {
      return {
        value: read(coordinator),
        location: coordinator,
        fallback: { worktree, reason: error instanceof Error ? error.message : String(error) },
      };
    }
  }
  return { value: read(coordinator), location: coordinator };
}

export function listIds(root: string, entity: "ticket" | "finding" | "package"): string[] {
  const workspace = join(root, ".a-team");
  const directories = entity === "ticket"
    ? TICKET_STATES.map(String)
    : entity === "finding" ? ["findings/new", "findings/resolved"] : ["packages/backlog", "packages/ready", "packages/active", "packages/done"];
  return directories.flatMap((directory) => {
    const path = join(workspace, directory);
    return existsSync(path) ? readdirSync(path).map(idFromFilename).filter((id): id is string => id !== null) : [];
  });
}

export function nextId(root: string, entity: "ticket" | "finding" | "package"): string {
  const prefix = entity === "ticket" ? "T" : entity === "finding" ? "F" : "P";
  const max = listIds(root, entity).filter((id) => id.startsWith(`${prefix}-`)).reduce((current, id) => Math.max(current, Number(id.split("-")[1])), 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}
