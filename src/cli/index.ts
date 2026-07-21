#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "../commands/init.js";
import { closeTicket, newTicket, readyTicket, reopenTicket, reviewTicket, startTicket, validateTicket } from "../commands/ticket.js";
import { statusCommand } from "../commands/status.js";
import { newFinding, resolveFinding, validateFinding } from "../commands/finding.js";
import { newPackage, packageStatus, startPackage, updatePackageTickets, validatePackage } from "../commands/package.js";
import { validateWorkspace } from "../commands/validate.js";
import { listClaims, releaseClaim } from "../commands/claim.js";
import { uiCommand } from "../commands/ui.js";

const program = new Command();
program.name("a-team").description("Repository-native human-AI development workflow").version("0.1.0");

function print(result: unknown, json: boolean): void {
  process.stdout.write(json ? `${JSON.stringify(result)}\n` : `${humanize(result)}\n`);
  if (typeof result === "object" && result && "ok" in result && (result as { ok: unknown }).ok === false) process.exitCode = 1;
}

function humanize(result: unknown): string {
  if (typeof result === "object" && result && "command" in result) {
    return `a-team ${String((result as { command: unknown }).command)} completed.`;
  }
  return String(result);
}

program
  .command("init")
  .description("Create a .a-team workspace")
  .option("--project-name <name>")
  .option("--json")
  .action((options: { projectName?: string; json?: boolean }) => print(initCommand(options.projectName), Boolean(options.json)));

program
  .command("validate")
  .description("Validate the A-Team workspace")
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
  .command("review <id>")
  .requiredOption("--evidence <evidence>")
  .option("--pull-request <identifier>")
  .option("--json")
  .action((id: string, options: { evidence: string; pullRequest?: string; json?: boolean }) => print(reviewTicket(id, options.evidence, options.pullRequest), Boolean(options.json)));
ticket
  .command("close <id>")
  .option("--approve")
  .option("--json")
  .action((id: string, options: { approve?: boolean; json?: boolean }) => print(closeTicket(id, Boolean(options.approve)), Boolean(options.json)));
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

const packageCommand = program.command("package").description("Validate and execute coordinated packages");
packageCommand
  .command("new")
  .requiredOption("--title <title>")
  .option("--kind <kind>", "Package kind", "batch")
  .option("--goal <goal>")
  .option("--json")
  .action((options: { title: string; kind: string; goal?: string; json?: boolean }) => print(newPackage(options), Boolean(options.json)));
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
  .command("start <id>")
  .requiredOption("--agent <agent>")
  .option("--json")
  .action((id: string, options: { agent: string; json?: boolean }) => print(startPackage(id, options.agent), Boolean(options.json)));
packageCommand
  .command("status <id>")
  .option("--json")
  .action((id: string, options: { json?: boolean }) => print(packageStatus(id), Boolean(options.json)));

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
  .description("Serve the local filesystem-backed A-Team board")
  .requiredOption("--workspace <path>", "Repository root or .a-team directory")
  .option("--port <port>", "Local port", "4311")
  .option("--host <host>", "Bind host", "127.0.0.1")
  .option("--json")
  .action(async (options: { workspace: string; port: string; host: string; json?: boolean }) => uiCommand({ workspace: options.workspace, port: Number(options.port), host: options.host, json: options.json }));

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
