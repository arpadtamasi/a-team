#!/usr/bin/env node
import { Command } from "commander";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { initCommand } from "../commands/init.js";
import { briefTicket, cancelTicket, closeTicket, defineTicket, newTicket, readyTicket, reopenTicket, reviewTicket, startTicket, validateTicket } from "../commands/ticket.js";
import { executeTicket, formatExecution } from "../commands/execute.js";
import { statusCommand } from "../commands/status.js";
import { newFinding, resolveFinding, validateFinding } from "../commands/finding.js";
import { closePackage, finalizePackage, newPackage, packageStatus, readyPackage, startPackage, updatePackageTickets, validatePackage } from "../commands/package.js";
import { validateWorkspace } from "../commands/validate.js";
import { listClaims, releaseClaim } from "../commands/claim.js";
import { uiCommand } from "../commands/ui.js";
import { createDecision } from "../commands/decision.js";
import { dedupeEntity, describeDedupe, type DedupeResult } from "../commands/dedupe.js";

const program = new Command();
const packagePath = fileURLToPath(new URL("../../package.json", import.meta.url));
const packageVersion = String((JSON.parse(readFileSync(packagePath, "utf8")) as { version: unknown }).version);
program.name("kotta").description("Repository-native human-AI development workflow").version(packageVersion);

function print(result: unknown, json: boolean): void {
  process.stdout.write(json ? `${JSON.stringify(result)}\n` : `${humanize(result)}\n`);
  if (typeof result === "object" && result && "ok" in result && (result as { ok: unknown }).ok === false) process.exitCode = 1;
}

function humanize(result: unknown): string {
  if (typeof result === "object" && result && "command" in result) {
    const command = String((result as { command: unknown }).command);
    if ((command === "ticket dedupe" || command === "package dedupe") && "data" in result) {
      return describeDedupe((result as DedupeResult).data);
    }
    if (command === "ticket start" && "data" in result) {
      const data = (result as { data: { id: unknown; branch: unknown; worktree: unknown; nextStep: unknown } }).data;
      return [
        `Started ${String(data.id)}: branch ${String(data.branch)}, worktree ${String(data.worktree)}.`,
        `Next: run the ticket in a fresh agent context (D-009) — ${String(data.nextStep)}.`,
        `'kotta ticket execute <id> --agent <agent>' does start, brief and agent launch in one command.`,
      ].join("\n");
    }
    if ((result as { command: unknown }).command === "decision create" && "data" in result) {
      const data = (result as { data: { id: unknown; path: unknown } }).data;
      return `Recorded decision ${String(data.id)} at ${String(data.path)}.`;
    }
    return `kotta ${String((result as { command: unknown }).command)} completed.`;
  }
  return String(result);
}

program
  .command("init")
  .description("Create a .kotta workspace")
  .option("--project-name <name>")
  .option("--json")
  .action((options: { projectName?: string; json?: boolean }) => print(initCommand(options.projectName), Boolean(options.json)));

program
  .command("validate")
  .description("Validate the Kotta workspace")
  .option("--json")
  .action((options: { json?: boolean }) => print(validateWorkspace(), Boolean(options.json)));

program
  .command("status")
  .description("Show canonical workspace status")
  .option("--json")
  .action((options: { json?: boolean }) => print(statusCommand(), Boolean(options.json)));

const ticket = program.command("ticket").description("Create and transition tickets");
ticket
  .command("new")
  .requiredOption("--title <title>")
  .requiredOption("--type <type>")
  .option("--profile <profile...>", "Requirement profiles", [])
  .option("--json")
  .action((options: { title: string; type: string; profile: string[]; json?: boolean }) => print(newTicket({ title: options.title, type: options.type, profiles: options.profile }), Boolean(options.json)));
ticket
  .command("validate <id>")
  .option("--json")
  .action((id: string, options: { json?: boolean }) => print(validateTicket(id), Boolean(options.json)));
ticket
  .command("define <id>")
  .requiredOption("--from <path>", "Markdown definition file")
  .option("--json")
  .action((id: string, options: { from: string; json?: boolean }) => print(defineTicket(id, options.from), Boolean(options.json)));
ticket
  .command("ready <id>")
  .option("--approve")
  .option("--json")
  .action((id: string, options: { approve?: boolean; json?: boolean }) => print(readyTicket(id, Boolean(options.approve)), Boolean(options.json)));
ticket
  .command("start <id>")
  .requiredOption("--agent <agent>")
  .option("--json")
  .action((id: string, options: { agent: string; json?: boolean }) => print(startTicket(id, options.agent), Boolean(options.json)));
ticket
  .command("execute <id>")
  .description("Run a ready ticket in a fresh agent context: start, brief and agent launch in one command (D-009)")
  .option("--agent <agent>", "Agent to launch; required unless --resume reuses the claim's agent")
  .option("--resume", "Reuse the existing execution context instead of creating a second one")
  .option("--inherit-context <reason>", "Explicit, logged exception to the fresh-context default; a reason is required")
  .option("--json")
  .action(async (id: string, options: { agent?: string; resume?: boolean; inheritContext?: string; json?: boolean }) => {
    const result = await executeTicket(id, { agent: options.agent, resume: options.resume, inheritContext: options.inheritContext });
    process.stdout.write(options.json ? `${JSON.stringify(result)}\n` : `${formatExecution(result)}\n`);
    if (!result.ok) process.exitCode = 1;
  });
ticket
  .command("review <id>")
  .requiredOption("--evidence <evidence>")
  .option("--pull-request <identifier>")
  .option("--deviations <text>", "Declared deviations from the ticket contract; omitted means 'Not declared.'")
  .option("--findings-created <text>", "Findings created during execution; omitted means 'Not declared.'")
  .option("--known-concerns <text>", "Known concerns left open; omitted means 'Not declared.'")
  .option("--json")
  .action((id: string, options: { evidence: string; pullRequest?: string; deviations?: string; findingsCreated?: string; knownConcerns?: string; json?: boolean }) => print(reviewTicket(id, options.evidence, options.pullRequest, { deviations: options.deviations, findingsCreated: options.findingsCreated, knownConcerns: options.knownConcerns }), Boolean(options.json)));
ticket
  .command("close <id>")
  .option("--approve")
  .option("--json")
  .action((id: string, options: { approve?: boolean; json?: boolean }) => print(closeTicket(id, Boolean(options.approve)), Boolean(options.json)));
ticket
  .command("cancel <id>")
  .description("Retire a backlog or ready ticket into done with a non-completed resolution")
  .requiredOption("--resolution <resolution>", "duplicate | obsolete | cancelled")
  .option("--approve")
  .option("--json")
  .action((id: string, options: { resolution: string; approve?: boolean; json?: boolean }) => print(cancelTicket(id, options.resolution, Boolean(options.approve)), Boolean(options.json)));
ticket
  .command("brief <id>")
  .description("Assemble the minimal execution context for a ticket (D-009)")
  .option("--out <path>", "Write the brief to a file instead of stdout")
  .option("--warn-tokens <count>", "Warn above this approximate token count", (value) => Number(value), 12000)
  .option("--json")
  .action((id: string, options: { out?: string; warnTokens: number; json?: boolean }) => {
    const result = briefTicket(id, { out: options.out, warnTokens: options.warnTokens });
    if (options.json) {
      console.log(JSON.stringify(result));
      return;
    }
    if (!options.out) process.stdout.write(result.data.brief);
    const summary = `brief ${id}: ~${result.data.tokens} tokens (${result.data.sections.length} sections)${result.data.path ? ` → ${result.data.path}` : ""}`;
    console.error(result.data.warning ? `${summary}\nWARNING: ${result.data.warning}` : summary);
  });
ticket
  .command("dedupe <id>")
  .description("Resolve a ticket a merge left in two state directories: keep the furthest-advanced copy")
  .option("--approve")
  .option("--json")
  .action((id: string, options: { approve?: boolean; json?: boolean }) => print(dedupeEntity("ticket", id, Boolean(options.approve)), Boolean(options.json)));
ticket
  .command("reopen <id>")
  .option("--approve")
  .option("--json")
  .action((id: string, options: { approve?: boolean; json?: boolean }) => print(reopenTicket(id, Boolean(options.approve)), Boolean(options.json)));

const finding = program.command("finding").description("Capture and disposition findings");
finding
  .command("new")
  .requiredOption("--title <title>")
  .requiredOption("--type <type>")
  .requiredOption("--evidence <evidence>")
  .option("--discovered-during <ticket>")
  .option("--json")
  .action((options: { title: string; type: string; evidence: string; discoveredDuring?: string; json?: boolean }) => print(newFinding(options), Boolean(options.json)));
finding
  .command("validate <id>")
  .option("--json")
  .action((id: string, options: { json?: boolean }) => print(validateFinding(id), Boolean(options.json)));
finding
  .command("resolve <id>")
  .requiredOption("--disposition <disposition>")
  .option("--approve")
  .option("--json")
  .action((id: string, options: { disposition: string; approve?: boolean; json?: boolean }) => print(resolveFinding(id, options.disposition, Boolean(options.approve)), Boolean(options.json)));

const decision = program.command("decision").description("Record durable human decisions");
decision
  .command("create")
  .description("Validate and atomically record a durable decision")
  .requiredOption("--from <path>", "Markdown decision source")
  .option("--id <id>", "Stable decision identifier (for example D-001)")
  .option("--approve", "Confirm the human-owned decision and consequences")
  .option("--json")
  .action((options: { from: string; id?: string; approve?: boolean; json?: boolean }) =>
    print(createDecision({ from: options.from, id: options.id, approved: Boolean(options.approve) }), Boolean(options.json)));

const packageCommand = program.command("package").description("Validate and execute coordinated packages");
packageCommand
  .command("new")
  .requiredOption("--title <title>")
  .option("--kind <kind>", "Package kind", "batch")
  .option("--goal <goal>")
  .option("--parallelism <count>", "Maximum concurrent tickets", (value) => Number(value), 2)
  .option("--json")
  .action((options: { title: string; kind: string; goal?: string; parallelism: number; json?: boolean }) => print(newPackage(options), Boolean(options.json)));
packageCommand
  .command("add <package-id> <ticket-id>")
  .option("--json")
  .action((packageId: string, ticketId: string, options: { json?: boolean }) => print(updatePackageTickets(packageId, ticketId, "add"), Boolean(options.json)));
packageCommand
  .command("remove <package-id> <ticket-id>")
  .option("--json")
  .action((packageId: string, ticketId: string, options: { json?: boolean }) => print(updatePackageTickets(packageId, ticketId, "remove"), Boolean(options.json)));
packageCommand
  .command("validate <id>")
  .option("--json")
  .action((id: string, options: { json?: boolean }) => print(validatePackage(id), Boolean(options.json)));
packageCommand
  .command("ready <id>")
  .option("--approve")
  .option("--json")
  .action((id: string, options: { approve?: boolean; json?: boolean }) => print(readyPackage(id, Boolean(options.approve)), Boolean(options.json)));
packageCommand
  .command("start <id>")
  .requiredOption("--agent <agent>")
  .option("--json")
  .action((id: string, options: { agent: string; json?: boolean }) => print(startPackage(id, options.agent), Boolean(options.json)));
packageCommand
  .command("status <id>")
  .option("--json")
  .action((id: string, options: { json?: boolean }) => print(packageStatus(id), Boolean(options.json)));
packageCommand
  .command("close <id>")
  .description("Complete a package whose member tickets have all reached done, from any package state")
  .option("--approve")
  .option("--json")
  .action((id: string, options: { approve?: boolean; json?: boolean }) => print(closePackage(id, Boolean(options.approve)), Boolean(options.json)));
packageCommand
  .command("dedupe <id>")
  .description("Resolve a package a merge left in two state directories: keep the furthest-advanced copy")
  .option("--approve")
  .option("--json")
  .action((id: string, options: { approve?: boolean; json?: boolean }) => print(dedupeEntity("package", id, Boolean(options.approve)), Boolean(options.json)));
packageCommand
  .command("finalize <id>")
  .description("Clean up the coordinator branch of a done package after its integration is proven")
  .option("--json")
  .action((id: string, options: { json?: boolean }) => print(finalizePackage(id), Boolean(options.json)));

const claim = program.command("claim").description("Inspect and recover execution claims");
claim
  .command("list")
  .option("--json")
  .action((options: { json?: boolean }) => print(listClaims(), Boolean(options.json)));
claim
  .command("release <id>")
  .option("--force")
  .option("--json")
  .action((id: string, options: { force?: boolean; json?: boolean }) => print(releaseClaim(id, Boolean(options.force)), Boolean(options.json)));

program
  .command("ui")
  .description("Serve the local filesystem-backed Kotta board")
  .option("--workspace <path>", "Repository root or workspace directory", ".")
  .option("--port <port>", "Local port; omitted starts at 4311 and advances to the next free port")
  .option("--host <host>", "Bind host", "127.0.0.1")
  .option("--no-open", "Print the URL without opening it in the default browser")
  .option("--json")
  .action(async (options: { workspace: string; port?: string; host: string; open: boolean; json?: boolean }) => {
    await uiCommand({ workspace: options.workspace, port: options.port === undefined ? undefined : Number(options.port), host: options.host, json: options.json, open: options.open });
  });

program.configureOutput({ outputError: (message) => process.stderr.write(message) });

try {
  await program.parseAsync();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const json = process.argv.includes("--json");
  if (json) process.stdout.write(`${JSON.stringify({ ok: false, errors: [{ code: "COMMAND_FAILED", message }] })}\n`);
  else process.stderr.write(`Error: ${message}\n`);
  process.exitCode = 1;
}
