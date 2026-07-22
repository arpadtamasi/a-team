import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";

const target = process.argv[2];
if (!target) throw new Error("Usage: node scripts/clean-install-canary.mjs <package-or-tarball>");
const installationTarget = existsSync(resolve(target)) ? resolve(target) : target;
const expectedVersion = String(JSON.parse(readFileSync(resolve("package.json"), "utf8")).version);
const root = mkdtempSync(join(tmpdir(), "a-team-canary-"));
const prefix = join(root, "prefix");
const repository = join(root, "repository");
mkdirSync(repository, { recursive: true });

const run = (command, args, cwd = repository, environment = process.env) => execFileSync(command, args, {
  cwd,
  env: environment,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
}).trim();

run("npm", ["install", "--global", "--prefix", prefix, installationTarget], root);
const environment = { ...process.env, PATH: `${join(prefix, "bin")}${delimiter}${process.env.PATH ?? ""}` };
const actualVersion = run("a-team", ["--version"], repository, environment);
if (actualVersion !== expectedVersion) throw new Error(`Expected a-team ${expectedVersion}, received ${actualVersion}.`);
run("git", ["init", "-b", "main"]);
writeFileSync(join(repository, "README.md"), "# Canary repository\n");
run("a-team", ["init"], repository, environment);
run("a-team", ["validate"], repository, environment);
process.stdout.write(`${JSON.stringify({ target, version: actualVersion, repository })}\n`);
