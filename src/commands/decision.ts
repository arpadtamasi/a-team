import { existsSync, linkSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { decisionDraftFromSource, nextDecisionId, renderDecision, validateDecision, validateDecisionFile } from "../core/decision.js";
import { findRepositoryRoot } from "../filesystem/workspace.js";

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
  const duplicate = readdirSync(directory).find((name) => name === `${id}.md` || (name.startsWith(`${id}-`) && name.endsWith(".md")));
  if (duplicate) throw new Error(`Decision ${id} already exists at ${join(directory, duplicate)}. Choose a different id or inspect the existing record.`);
  const path = join(directory, `${id}.md`);
  const candidate = join(directory, `.${id}-${process.pid}-${Date.now()}.tmp`);
  try {
    writeFileSync(candidate, renderDecision(draft), { flag: "wx" });
    const candidateErrors = validateDecisionFile(candidate).filter((error) => error.code !== "DECISION_FILENAME_MISMATCH");
    if (candidateErrors.length) throw new Error(candidateErrors.map((error) => error.message).join("\n"));
    const publishDelay = Number(process.env.A_TEAM_TEST_DECISION_PUBLISH_DELAY_MS ?? 0);
    if (publishDelay > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, publishDelay);
    if (process.env.A_TEAM_TEST_FAIL_DECISION_BEFORE_PUBLISH === "1") {
      throw new Error("Injected decision write failure before atomic publication.");
    }
    try {
      linkSync(candidate, path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") {
        throw new Error(`Decision ${id} already exists at ${path}. Choose a different id or inspect the existing record.`);
      }
      throw error;
    }
    unlinkSync(candidate);
  } catch (error) {
    if (existsSync(candidate)) unlinkSync(candidate);
    throw error;
  }
  return { ok: true, command: "decision create", data: { id, path } };
}
