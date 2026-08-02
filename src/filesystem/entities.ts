import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseMarkdown } from "../core/markdown.js";
import { TICKET_ID, filenameMatchesId } from "../core/identity.js";

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

/** Sequential filenames carry their id up front; a minted entity's id lives only in the frontmatter. */
export function idFromFilename(filename: string): string | null {
  return /^(?:[TFP]-\d{3,}|O-\d+(?:\.\d+)?)(?=-)/.exec(filename)?.[0] ?? null;
}

/** Canonical id of an entity file: the frontmatter is the truth, the filename only a fallback. */
export function idFromEntityFile(path: string, filename: string): string | null {
  try {
    const id = String(parseMarkdown(readFileSync(path, "utf8")).data.id ?? "").trim();
    if (id) return id;
  } catch {
    // Malformed frontmatter is reported by validation; fall back to whatever the filename says.
  }
  return idFromFilename(filename);
}

export function findTicket(root: string, id: string): TicketLocation {
  for (const state of TICKET_STATES) {
    const directory = join(root, ".a-team", state);
    if (!existsSync(directory)) continue;
    const filename = readdirSync(directory).find((name) => name.endsWith(".md") && filenameMatchesId(name, id));
    if (filename) return { path: join(directory, filename), state, filename };
  }
  throw new Error(`Ticket ${id} was not found.`);
}

export function resolveEffectiveTicket<T>(root: string, id: string, read: (ticket: TicketLocation) => T): EffectiveTicket<T> {
  if (!TICKET_ID.test(id)) throw new Error(`Invalid ticket id: ${id}`);
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
    if (!existsSync(path)) return [];
    return readdirSync(path)
      .filter((name) => name.endsWith(".md"))
      .map((name) => idFromEntityFile(join(path, name), name))
      .filter((id): id is string => id !== null);
  });
}
