import { spawn, spawnSync } from "node:child_process";
import { accessSync, constants, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { findRepositoryRoot } from "../filesystem/workspace.js";
import { findTicket } from "../filesystem/entities.js";
import { assertClean, git } from "../git/git.js";
import { briefTicket, startTicket } from "./ticket.js";

/**
 * Arguments a named agent expects around a prompt that arrives on stdin.
 * Unknown agents are invoked bare: the prompt is still the whole stdin.
 */
const AGENT_ARGUMENTS: Record<string, string[]> = {
  claude: ["-p"],
  codex: ["exec", "-"],
};

/** The launch seam: tests substitute a deterministic script double for a real agent binary. */
export const AGENT_COMMAND_ENV = "A_TEAM_AGENT_COMMAND";

export interface AgentInvocation {
  command: string;
  args: string[];
  cwd: string;
  prompt: string;
}

export interface AgentRun {
  status: number | null;
  signal: string | null;
  cancelled: boolean;
  stdout: string;
  stderr: string;
  error: string | null;
}

export type AgentLauncher = (invocation: AgentInvocation) => Promise<AgentRun>;

export function resolveAgentCommand(agent: string): { command: string; args: string[] } {
  const override = process.env[AGENT_COMMAND_ENV]?.trim();
  return { command: override || agent, args: AGENT_ARGUMENTS[agent] ?? [] };
}

export function agentCommandAvailable(command: string): boolean {
  if (command.includes("/") || command.includes("\\")) {
    try {
      accessSync(command, constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }
  return spawnSync(command, ["--version"], { stdio: "ignore" }).status === 0;
}

/**
 * Run the agent with the brief on stdin. Its stderr is forwarded live so a long
 * run is observable; its stdout is captured because an empty result is a failure.
 * An interrupt terminates the agent and returns `cancelled` instead of killing
 * this process, so the caller can report what the operator must now decide.
 */
const spawnAgent: AgentLauncher = (invocation) =>
  new Promise<AgentRun>((settle) => {
    const child = spawn(invocation.command, invocation.args, { cwd: invocation.cwd, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let cancelled = false;
    const cancel = (): void => {
      cancelled = true;
      child.kill("SIGTERM");
    };
    const done = (run: AgentRun): void => {
      process.off("SIGINT", cancel);
      process.off("SIGTERM", cancel);
      settle(run);
    };
    process.on("SIGINT", cancel);
    process.on("SIGTERM", cancel);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => { stdout += chunk; });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
      process.stderr.write(chunk);
    });
    child.on("error", (error) => done({ status: null, signal: null, cancelled, stdout, stderr, error: error.message }));
    child.on("close", (status, signal) => done({ status, signal, cancelled, stdout, stderr, error: null }));
    child.stdin.on("error", () => { /* the agent may exit before reading the prompt */ });
    child.stdin.end(invocation.prompt);
  });

export interface ExecutionContext {
  worktree: string;
  branch: string;
  agent: string;
}

/** An execution context exists when a claim for the ticket lives in its worktree. */
export function locateExecutionContext(root: string, id: string): ExecutionContext | null {
  const worktree = join(root, ".worktrees", id);
  const claimPath = join(worktree, ".a-team/claims", `${id}.yaml`);
  if (!existsSync(claimPath)) return null;
  const claim = parseYaml(readFileSync(claimPath, "utf8")) as Record<string, unknown>;
  return { worktree, branch: String(claim.branch ?? ""), agent: String(claim.agent ?? "") };
}

export type ExecutionState = "implemented" | "agent-failed" | "cancelled";

export interface ExecuteResult {
  ok: boolean;
  command: "ticket execute";
  data: {
    id: string;
    state: ExecutionState;
    ticketState: string;
    agent: string;
    agentCommand: string;
    branch: string;
    worktree: string;
    briefTokens: number;
    briefSections: number;
    briefWarning: string | null;
    context: "fresh" | "inherited";
    inheritContext: string | null;
    resumed: boolean;
    exitCode: number | null;
    uncommittedChanges: boolean;
    reason: string | null;
  };
  errors?: { code: string; message: string }[];
}

export interface ExecuteOptions {
  agent?: string;
  inheritContext?: string;
  resume?: boolean;
}

const INHERITANCE_HEADING = "## Context inheritance (explicit exception to D-009)";

function promptFor(brief: string, inheritContext: string | null): string {
  if (!inheritContext) return brief;
  return `${brief}\n${INHERITANCE_HEADING}\n\nThe caller declared context inheritance for this run.\n\nReason: ${inheritContext}\n`;
}

/**
 * Run one ready ticket in a fresh agent context (D-009): start, brief, launch —
 * one command, so the fresh-context model is the default path and not discipline.
 * The coordinator's context never reaches the agent: its only input is the brief.
 */
export async function executeTicket(id: string, options: ExecuteOptions, launch: AgentLauncher = spawnAgent): Promise<ExecuteResult> {
  const root = findRepositoryRoot();
  if (options.inheritContext !== undefined && !options.inheritContext.trim()) {
    throw new Error("--inherit-context requires a reason. Context carry-over is an explicit, logged exception (D-009); state why this ticket needs it.");
  }
  const inheritContext = options.inheritContext?.trim() ?? null;
  const existing = locateExecutionContext(root, id);

  if (options.resume) {
    if (!existing) throw new Error(`Ticket ${id} has no execution context to resume. Run 'a-team ticket execute ${id} --agent <agent>' to create one.`);
    const agent = options.agent?.trim() || existing.agent;
    if (!agent) throw new Error(`Claim for ${id} names no agent; pass --agent <agent> to resume.`);
    const ticket = findTicket(existing.worktree, id);
    if (ticket.state !== "active") throw new Error(`Ticket ${id} must be active in its worktree to resume; it is ${ticket.state}.`);
    const { command, args } = resolveAgentCommand(agent);
    if (!agentCommandAvailable(command)) throw new Error(agentMissingMessage(command));
    return await runAgent({ id, root, agent, command, args, context: existing, inheritContext, resumed: true, launch });
  }

  const ticket = findTicket(root, id);
  if (ticket.state !== "ready") throw new Error(`Ticket ${id} must be ready before execute; it is ${ticket.state}. Nothing was created.`);
  if (existing) {
    throw new Error(`Ticket ${id} already has an execution context (branch ${existing.branch}, worktree ${existing.worktree}). Execute refuses to start a second agent: retry inside it with '--resume', or release it with 'a-team claim release ${id} --force'.`);
  }
  if (existsSync(join(root, ".a-team/claims", `${id}.yaml`))) throw new Error(`Ticket ${id} already has a claim. Execute refuses to start a second agent.`);
  const agent = options.agent?.trim();
  if (!agent) throw new Error("--agent <agent> is required to create an execution context.");
  assertClean(root);
  const { command, args } = resolveAgentCommand(agent);
  // The agent is resolved before any mutation: a missing binary must not leave a half-built context.
  if (!agentCommandAvailable(command)) throw new Error(agentMissingMessage(command));

  const started = startTicket(id, agent);
  const context: ExecutionContext = { worktree: String(started.data.worktree), branch: String(started.data.branch), agent };
  return await runAgent({ id, root, agent, command, args, context, inheritContext, resumed: false, launch });
}

function agentMissingMessage(command: string): string {
  return `Agent command not found: '${command}'. Install it, pass a different --agent, or set ${AGENT_COMMAND_ENV}. No execution context was created.`;
}

async function runAgent(input: {
  id: string;
  root: string;
  agent: string;
  command: string;
  args: string[];
  context: ExecutionContext;
  inheritContext: string | null;
  resumed: boolean;
  launch: AgentLauncher;
}): Promise<ExecuteResult> {
  const { id, agent, command, args, context, inheritContext, resumed, launch } = input;
  const contextNote = `Execution context exists: branch ${context.branch}, worktree ${context.worktree}. Inspect it, then retry with '--resume' or release it with 'a-team claim release ${id} --force'.`;

  let brief;
  try {
    brief = briefTicket(id, {}, context.worktree);
  } catch (error) {
    throw new Error(`Brief assembly failed for ${id}: ${error instanceof Error ? error.message : String(error)}. ${contextNote}`);
  }

  const run = await launch({ command, args, cwd: context.worktree, prompt: promptFor(brief.data.brief, inheritContext) });

  const failure = run.cancelled
    ? { state: "cancelled" as const, reason: `Execution was interrupted; the agent was terminated with ${run.signal ?? "SIGTERM"}.` }
    : run.error
      ? { state: "agent-failed" as const, reason: `Agent could not be launched: ${run.error}.` }
      : run.status !== 0
        ? { state: "agent-failed" as const, reason: run.signal ? `Agent was terminated by ${run.signal}.` : `Agent exited with code ${String(run.status)}.` }
        : !run.stdout.trim()
          ? { state: "agent-failed" as const, reason: "Agent produced no output; the result is empty and cannot be treated as an implementation." }
          : null;

  const ticketState = safeTicketState(context.worktree, id);
  const uncommittedChanges = Boolean(git(context.worktree, ["status", "--porcelain"]));
  const data: ExecuteResult["data"] = {
    id,
    state: failure?.state ?? "implemented",
    ticketState,
    agent,
    agentCommand: command,
    branch: context.branch,
    worktree: context.worktree,
    briefTokens: brief.data.tokens,
    briefSections: brief.data.sections.length,
    briefWarning: brief.data.warning,
    context: inheritContext ? "inherited" : "fresh",
    inheritContext,
    resumed,
    exitCode: run.status,
    uncommittedChanges,
    reason: failure?.reason ?? null,
  };
  if (!failure) return { ok: true, command: "ticket execute", data };
  return {
    ok: false,
    command: "ticket execute",
    data,
    errors: [{ code: failure.state === "cancelled" ? "EXECUTION_CANCELLED" : "AGENT_FAILED", message: `${failure.reason} ${contextNote}` }],
  };
}

function safeTicketState(worktree: string, id: string): string {
  try {
    return findTicket(worktree, id).state;
  } catch {
    return "unknown";
  }
}

export function formatExecution(result: ExecuteResult): string {
  const data = result.data;
  const lines = [
    `a-team ticket execute ${data.id}: ${data.state}`,
    `  agent:    ${data.agent} (command: ${data.agentCommand})`,
    `  brief:    ~${data.briefTokens} tokens, ${data.briefSections} sections — the agent's only input`,
    `  branch:   ${data.branch}`,
    `  worktree: ${data.worktree}`,
    `  context:  ${data.context === "fresh" ? "fresh (D-009 default)" : `INHERITED — ${String(data.inheritContext)}`}`,
    `  ticket:   ${data.ticketState}${data.uncommittedChanges ? " (worktree has uncommitted changes)" : ""}`,
  ];
  if (data.briefWarning) lines.push(`  WARNING:  ${data.briefWarning}`);
  if (result.ok) lines.push(`Next: verify the work, then 'a-team ticket review ${data.id} --evidence "..."'. Review stays a separate gate.`);
  else lines.push(`  reason:   ${String(data.reason)}`, `The claim and worktree are preserved. Retry with 'a-team ticket execute ${data.id} --resume' or release with 'a-team claim release ${data.id} --force'.`);
  return lines.join("\n");
}
