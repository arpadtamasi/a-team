import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseMarkdown } from "../core/markdown.js";
import { TICKET_ID, filenameMatchesId } from "../core/identity.js";
import { workspacePath } from "./workspace.js";

export const TICKET_STATES = ["backlog", "ready", "active", "review", "done"] as const;
export const PACKAGE_STATES = ["backlog", "ready", "active", "done"] as const;

export type EntityKind = "ticket" | "package";

export interface EntityCopy {
  state: string;
  path: string;
  filename: string;
}

/** State directories of an entity kind, in lifecycle order — the later entry is the further-advanced state. */
export function stateDirectories(kind: EntityKind): Array<{ state: string; directory: string }> {
  return kind === "ticket"
    ? TICKET_STATES.map((state) => ({ state, directory: state }))
    : PACKAGE_STATES.map((state) => ({ state, directory: `packages/${state}` }));
}

/**
 * Every file claiming `id`, in lifecycle order. State is encoded by the directory, and Git does not
 * pair a cross-directory move as delete+add, so a merge can leave one entity in several of them (T-036).
 */
export function entityCopies(root: string, kind: EntityKind, id: string): EntityCopy[] {
  const copies: EntityCopy[] = [];
  for (const { state, directory } of stateDirectories(kind)) {
    const path = workspacePath(root, directory);
    if (!existsSync(path)) continue;
    for (const filename of readdirSync(path).filter((name) => name.endsWith(".md")).sort()) {
      const file = join(path, filename);
      if (idFromEntityFile(file, filename) === id) copies.push({ state, path: file, filename });
    }
  }
  return copies;
}

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
    const directory = workspacePath(root, state);
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
  const workspace = workspacePath(root);
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
