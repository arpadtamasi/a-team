import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseMarkdown } from "../core/markdown.js";
import { CONTRACT_ID, filenameMatchesId } from "../core/identity.js";
import { workspacePath } from "./workspace.js";

export const CONTRACT_STATES = ["backlog", "defined", "active", "review", "done"] as const;
export const BATCH_STATES = ["backlog", "defined", "active", "done"] as const;

export type EntityKind = "contract" | "batch";

export interface EntityCopy {
  state: string;
  path: string;
  filename: string;
}

/** State directories of an entity kind, in lifecycle order — the later entry is the further-advanced state. */
export function stateDirectories(kind: EntityKind): Array<{ state: string; directory: string }> {
  return kind === "contract"
    ? CONTRACT_STATES.map((state) => ({ state, directory: state }))
    : BATCH_STATES.map((state) => ({ state, directory: `batches/${state}` }));
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

export interface ContractLocation {
  path: string;
  state: string;
  filename: string;
}

export interface EffectiveContract<T> {
  value: T;
  location: ContractLocation;
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

export function findContract(root: string, id: string): ContractLocation {
  for (const state of CONTRACT_STATES) {
    const directory = workspacePath(root, state);
    if (!existsSync(directory)) continue;
    const filename = readdirSync(directory).find((name) => name.endsWith(".md") && filenameMatchesId(name, id));
    if (filename) return { path: join(directory, filename), state, filename };
  }
  throw new Error(`Contract ${id} was not found.`);
}

export function resolveEffectiveContract<T>(root: string, id: string, read: (contract: ContractLocation) => T): EffectiveContract<T> {
  if (!CONTRACT_ID.test(id)) throw new Error(`Invalid contract id: ${id}`);
  const coordinator = findContract(root, id);
  const worktree = join(root, ".worktrees", id);
  if (existsSync(worktree)) {
    try {
      const location = findContract(worktree, id);
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

export function listIds(root: string, entity: "contract" | "observation" | "batch"): string[] {
  const workspace = workspacePath(root);
  const directories = entity === "contract"
    ? CONTRACT_STATES.map(String)
    : entity === "observation" ? ["observations/new", "observations/resolved"] : ["batches/backlog", "batches/defined", "batches/active", "batches/done"];
  return directories.flatMap((directory) => {
    const path = join(workspace, directory);
    if (!existsSync(path)) return [];
    return readdirSync(path)
      .filter((name) => name.endsWith(".md"))
      .map((name) => idFromEntityFile(join(path, name), name))
      .filter((id): id is string => id !== null);
  });
}
