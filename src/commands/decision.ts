import { existsSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { decisionDraftFromSource, nextDecisionId, renderDecision, validateDecision, validateDecisionFile } from "../core/decision.js";
import { findRepositoryRoot } from "../filesystem/workspace.js";
import { slugify } from "./ticket.js";

export interface CreateDecisionOptions {
  from: string;
  id?: string;
  approved: boolean;
}

export function createDecision(options: CreateDecisionOptions, repositoryRoot?: string) {
  if (!options.approved) {
    throw new Error("Human approval is required to record a durable decision. Re-run with --approve after confirming the decision and consequences.");
  }
  const root = repositoryRoot ?? findRepositoryRoot();
  const workspace = join(root, ".a-team");
  if (!existsSync(workspace)) throw new Error(`No .a-team workspace exists at ${root}. Run a-team init first.`);
  const sourcePath = resolve(options.from);
  if (!existsSync(sourcePath)) throw new Error(`Decision source was not found: ${sourcePath}`);
  const id = options.id ?? nextDecisionId(root);
  const draft = decisionDraftFromSource(readFileSync(sourcePath, "utf8"), id, new Date().toISOString().slice(0, 10));
  const errors = validateDecision(draft);
  if (errors.length) throw new Error(errors.map((error) => error.message).join("\n"));

  const directory = join(workspace, "decisions");
  const duplicate = readdirSync(directory).find((name) => name.startsWith(`${id}-`) && name.endsWith(".md"));
  if (duplicate) throw new Error(`Decision ${id} already exists at ${join(directory, duplicate)}. Choose a different id or inspect the existing record.`);
  const path = join(directory, `${id}-${slugify(draft.title) || "decision"}.md`);
  const candidate = join(directory, `.${id}-${process.pid}-${Date.now()}.tmp`);
  try {
    writeFileSync(candidate, renderDecision(draft), { flag: "wx" });
    const candidateErrors = validateDecisionFile(candidate).filter((error) => error.code !== "DECISION_FILENAME_MISMATCH");
    if (candidateErrors.length) throw new Error(candidateErrors.map((error) => error.message).join("\n"));
    if (process.env.A_TEAM_TEST_FAIL_DECISION_BEFORE_RENAME === "1") {
      throw new Error("Injected decision write failure before atomic publication.");
    }
    if (existsSync(path)) throw new Error(`Decision ${id} already exists at ${path}.`);
    renameSync(candidate, path);
  } catch (error) {
    if (existsSync(candidate)) unlinkSync(candidate);
    throw error;
  }
  return { ok: true, command: "decision create", data: { id, path } };
}
