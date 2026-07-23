import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { parseMarkdown, renderMarkdown, sections } from "./markdown.js";

export interface DecisionDraft {
  id: string;
  title: string;
  date: string;
  decision: string;
  context: string;
  consequences: string;
}

export interface DecisionValidationIssue {
  code: string;
  message: string;
  path?: string;
}

const DECISION_ID = /^D-\d{3,}$/;
const DECISION_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DECISION_FIELDS = new Set(["id", "title", "date"]);
const DECISION_SECTIONS = ["Decision", "Context", "Consequences"] as const;

function isValidDate(value: string): boolean {
  if (!DECISION_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function sourceDate(value: unknown, fallback: string): string {
  if (value === undefined) return fallback;
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
  return String(value);
}

export function nextDecisionId(root: string): string {
  const directory = join(root, ".a-team/decisions");
  if (!existsSync(directory)) return "D-001";
  const maximum = readdirSync(directory)
    .map((name) => /^D-(\d+)(?:-|\.md$)/.exec(name)?.[1])
    .filter((value): value is string => value !== undefined)
    .reduce((current, value) => Math.max(current, Number(value)), 0);
  return `D-${String(maximum + 1).padStart(3, "0")}`;
}

export function decisionDraftFromSource(source: string, id: string, date: string): DecisionDraft {
  const entity = parseMarkdown(source);
  const unknown = Object.keys(entity.data).filter((field) => !DECISION_FIELDS.has(field));
  if (unknown.length) throw new Error(`Unsupported decision fields: ${unknown.join(", ")}.`);
  if (entity.data.id !== undefined && String(entity.data.id) !== id) {
    throw new Error(`Decision source id '${String(entity.data.id)}' does not match ${id}.`);
  }
  const body = sections(entity.content);
  return {
    id,
    title: String(entity.data.title ?? "").trim(),
    date: sourceDate(entity.data.date, date),
    decision: body.get("decision")?.trim() ?? "",
    context: body.get("context")?.trim() ?? "",
    consequences: body.get("consequences")?.trim() ?? "",
  };
}

export function validateDecision(draft: DecisionDraft, path?: string): DecisionValidationIssue[] {
  const errors: DecisionValidationIssue[] = [];
  if (!DECISION_ID.test(draft.id)) errors.push({ code: "INVALID_DECISION_ID", message: "Decision id must match D-001.", path });
  if (!draft.title) errors.push({ code: "MISSING_DECISION_TITLE", message: "Decision title is required.", path });
  if (!isValidDate(draft.date)) {
    errors.push({ code: "INVALID_DECISION_DATE", message: "Decision date must be a valid YYYY-MM-DD date.", path });
  }
  for (const section of DECISION_SECTIONS) {
    const value = draft[section.toLowerCase() as "decision" | "context" | "consequences"];
    if (!value) errors.push({ code: "MISSING_DECISION_SECTION", message: `Missing or empty section: ${section}.`, path });
  }
  return errors;
}

export function renderDecision(draft: DecisionDraft): string {
  return renderMarkdown(
    { id: draft.id, title: draft.title, date: draft.date },
    `# ${draft.id} — ${draft.title}\n\n## Decision\n\n${draft.decision}\n\n## Context\n\n${draft.context}\n\n## Consequences\n\n${draft.consequences}\n`,
  );
}

export function validateDecisionFile(path: string): DecisionValidationIssue[] {
  try {
    const entity = parseMarkdown(readFileSync(path, "utf8"));
    const body = sections(entity.content);
    const draft: DecisionDraft = {
      id: String(entity.data.id ?? ""),
      title: String(entity.data.title ?? "").trim(),
      date: sourceDate(entity.data.date, ""),
      decision: body.get("decision")?.trim() ?? "",
      context: body.get("context")?.trim() ?? "",
      consequences: body.get("consequences")?.trim() ?? "",
    };
    const errors = validateDecision(draft, path);
    const unknown = Object.keys(entity.data).filter((field) => !DECISION_FIELDS.has(field));
    if (unknown.length) errors.push({ code: "UNKNOWN_DECISION_FIELD", message: `Unsupported decision fields: ${unknown.join(", ")}.`, path });
    if (basename(path) !== `${draft.id}.md`) {
      errors.push({ code: "DECISION_FILENAME_MISMATCH", message: `Decision filename must be ${draft.id}.md.`, path });
    }
    return errors;
  } catch (error) {
    return [{ code: "MALFORMED_DECISION", message: `Malformed decision record: ${error instanceof Error ? error.message : String(error)}`, path }];
  }
}
