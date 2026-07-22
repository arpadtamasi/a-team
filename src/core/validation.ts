import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { PROFILE_REQUIREMENTS } from "./profiles.js";
import { parseMarkdown, sections } from "./markdown.js";

export interface ValidationIssue { code: string; message: string; path?: string }
export interface ValidationReport { valid: boolean; errors: ValidationIssue[] }

const COMMON_SECTIONS = ["Outcome", "Scope", "Non-goals", "Acceptance", "Verification", "Constraints", "Open decisions", "Execution notes"];

function values(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
}

function validateTicket(path: string, expectedState?: string, requireDefinition = false): ValidationReport {
  const errors: ValidationIssue[] = [];
  if (!existsSync(path)) return { valid: false, errors: [{ code: "NOT_FOUND", message: `Ticket not found: ${path}`, path }] };
  let entity;
  try { entity = parseMarkdown(readFileSync(path, "utf8")); }
  catch (error) { return { valid: false, errors: [{ code: "INVALID_FRONTMATTER", message: String(error), path }] }; }
  const id = String(entity.data.id ?? "");
  if (!/^(?:T-\d{3,}|O-\d+(?:\.\d+)?)$/.test(id)) errors.push({ code: "INVALID_ID", message: "Ticket id must match T-001 or preserve an imported O-1 identifier.", path });
  if (!basename(path).startsWith(`${id}-`)) errors.push({ code: "FILENAME_ID_MISMATCH", message: "Filename must start with the ticket id.", path });
  const directoryState = basename(dirname(path));
  const state = String(entity.data.status ?? "");
  if (state !== directoryState) errors.push({ code: "STATE_MISMATCH", message: `status '${state}' does not match directory '${directoryState}'.`, path });
  if (expectedState && state !== expectedState) errors.push({ code: "WRONG_STATE", message: `Expected ticket state '${expectedState}', found '${state}'.`, path });
  const bodySections = sections(entity.content);
  if (state !== "backlog" || requireDefinition) for (const heading of COMMON_SECTIONS) {
      const body = bodySections.get(heading.toLowerCase());
      if (body === undefined || body.trim() === "") errors.push({ code: "MISSING_SECTION", message: `Missing or empty section: ${heading}.`, path });
    }
  for (const profile of values(entity.data.profiles)) {
    const required = PROFILE_REQUIREMENTS[profile];
    if (!required) {
      errors.push({ code: "UNKNOWN_PROFILE", message: `Unknown profile: ${profile}.`, path });
      continue;
    }
    if (state === "backlog" && !requireDefinition) continue;
    for (const heading of required) {
      const body = bodySections.get(heading.toLowerCase());
      if (body === undefined || body.trim() === "") errors.push({ code: "MISSING_PROFILE_SECTION", message: `Profile '${profile}' requires section: ${heading}.`, path });
    }
  }
  if (state === "ready" && bodySections.get("open decisions")?.trim().toLowerCase() !== "none.") {
    errors.push({ code: "OPEN_DECISIONS", message: "A ready ticket must state 'None.' under Open decisions.", path });
  }
  if (["review", "done"].includes(state) && !bodySections.get("review evidence")?.trim()) errors.push({ code: "MISSING_REVIEW_EVIDENCE", message: `${state} ticket requires review evidence.`, path });
  if (state === "done" && !["completed", "cancelled", "duplicate", "obsolete"].includes(String(entity.data.resolution))) errors.push({ code: "MISSING_RESOLUTION", message: "Done ticket requires a final resolution.", path });
  return { valid: errors.length === 0, errors };
}

export function validateTicketFile(path: string, expectedState?: string): ValidationReport {
  return validateTicket(path, expectedState);
}

export function validateTicketDefinitionFile(path: string): ValidationReport {
  return validateTicket(path, "backlog", true);
}

export function assertValid(report: ValidationReport): void {
  if (!report.valid) throw new Error(report.errors.map((error) => `${error.code}: ${error.message}`).join("\n"));
}
