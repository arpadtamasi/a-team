import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { findRepositoryRoot } from "../filesystem/workspace.js";
import { TICKET_STATES } from "../filesystem/entities.js";
import { validateTicketFile } from "../core/validation.js";
import { validatePackage } from "./package.js";
import { validateClaim } from "../core/claim.js";
import { parseMarkdown } from "../core/markdown.js";

export function validateWorkspace() {
  const root = findRepositoryRoot();
  const errors: Array<{ code: string; message: string; path?: string }> = [];
  if (!existsSync(join(root, ".a-team"))) {
    return { ok: false, command: "validate", data: { tickets: 0 }, errors: [{ code: "WORKSPACE_NOT_FOUND", message: `No .a-team workspace exists at ${root}. Run a-team init first.`, path: root }] };
  }
  const seen = new Map<string, string>();
  const references: Array<{ id: string; field: "depends_on" | "blocks"; reference: string; path: string }> = [];
  for (const state of TICKET_STATES) {
    const directory = join(root, ".a-team", state);
    if (!existsSync(directory)) continue;
    for (const filename of readdirSync(directory).filter((name) => name.endsWith(".md"))) {
      const path = join(directory, filename);
      const report = validateTicketFile(path);
      errors.push(...report.errors);
      const id = filename.split("-").slice(0, 2).join("-");
      const previous = seen.get(id);
      if (previous) errors.push({ code: "DUPLICATE_ID", message: `${id} appears in both ${previous} and ${path}.`, path });
      else seen.set(id, path);
      try {
        const entity = parseMarkdown(readFileSync(path, "utf8"));
        for (const field of ["depends_on", "blocks"] as const) {
          const values = Array.isArray(entity.data[field]) ? entity.data[field].map(String) : [];
          for (const reference of values) references.push({ id, field, reference, path });
        }
      } catch {
        // validateTicketFile already reports malformed frontmatter for this path.
      }
      if (state === "active") {
        const claimPath = join(root, ".a-team/claims", `${id}.yaml`);
        if (!existsSync(claimPath)) errors.push({ code: "MISSING_CLAIM", message: `Active ticket ${id} has no claim.`, path });
        else {
          const claimErrors = validateClaim(parse(readFileSync(claimPath, "utf8")) as Record<string, unknown>);
          for (const message of claimErrors) errors.push({ code: "INVALID_CLAIM", message: `Claim ${id}: ${message}.`, path: claimPath });
        }
      }
    }
  }
  for (const reference of references) {
    if (!seen.has(reference.reference)) {
      errors.push({
        code: "DANGLING_REFERENCE",
        message: `${reference.id} ${reference.field} references missing ticket ${reference.reference}.`,
        path: reference.path,
      });
    }
  }
  for (const state of ["backlog", "ready", "active", "done"]) {
    const directory = join(root, ".a-team/packages", state);
    if (!existsSync(directory)) continue;
    for (const filename of readdirSync(directory).filter((name) => name.startsWith("P-") && name.endsWith(".md"))) {
      const id = filename.split("-").slice(0, 2).join("-");
      const report = validatePackage(id);
      if (!report.ok) errors.push(...report.errors.map((error) => ({ ...error, path: join(directory, filename) })));
    }
  }
  return { ok: errors.length === 0, command: "validate", data: { tickets: seen.size }, errors };
}
