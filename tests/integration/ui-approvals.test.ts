import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { readEvents } from "../../src/core/events.js";
import { uiCommand } from "../../src/commands/ui.js";

const cli = resolve("dist/cli/index.js");
const servers: Server[] = [];

async function stop(server: Server): Promise<void> {
  await new Promise<void>((done, fail) => {
    server.close((error) => error ? fail(error) : done());
    server.closeAllConnections();
  });
}
afterEach(async () => { await Promise.all(servers.splice(0).map(stop)); });

function fixture(): { root: string; id: string } {
  const root = mkdtempSync(join(tmpdir(), "kotta-ui-approval-"));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  writeFileSync(join(root, "README.md"), "fixture\n");
  execFileSync("node", [cli, "init", "--json"], { cwd: root });
  const created = JSON.parse(execFileSync("node", [cli, "contract", "new", "--title", "Chat approval", "--type", "feature", "--json"], { cwd: root, encoding: "utf8" })) as { data: { id: string; path: string } };
  writeFileSync(created.data.path, readFileSync(created.data.path, "utf8")
    .replace("Describe the observable outcome.", "The approval is durable.")
    .replace("- Define an observable condition.", "- Approval moves the contract to defined.")
    .replace("- Explain how acceptance will be checked.", "- Read the canonical event history."));
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-m", "backlog contract"], { cwd: root });
  return { root, id: created.data.id };
}

async function start(root: string): Promise<{ server: Server; base: string } | null> {
  let server: Server;
  try { server = await uiCommand({ workspace: root, port: 0, host: "127.0.0.1", open: false }, async () => undefined); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EPERM") return null;
    throw error;
  }
  servers.push(server);
  const address = server.address() as { port: number };
  return { server, base: `http://127.0.0.1:${address.port}` };
}

async function post(base: string, path: string, body: Record<string, unknown>) {
  const response = await fetch(`${base}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() as Record<string, unknown> };
}

describe("chat-first approval API", () => {
  test("persists a scoped approval, applies it once and reconstructs it after restart", async () => {
    const { root, id } = fixture();
    const first = await start(root);
    if (!first) return; // Restricted sandboxes cannot bind localhost; CI exercises the HTTP path.
    const proposed = await post(first.base, "/api/approval/propose", { entity: id, contract: id, action: "contract.sign", payload: {} });
    expect(proposed.status).toBe(201);
    const approvalId = (proposed.body.event as { approval_id: string }).approval_id;

    const duplicatePending = await post(first.base, "/api/approval/propose", { entity: id, contract: id, action: "contract.sign", payload: {} });
    expect(duplicatePending.status).toBe(400);
    expect(String(duplicatePending.body.error)).toContain("already has a pending approval");

    const applied = await post(first.base, "/api/approval/decide", { approvalId, decision: "approve" });
    expect(applied).toMatchObject({ status: 200, body: { ok: true, repeated: false } });
    const repeated = await post(first.base, "/api/approval/decide", { approvalId, decision: "approve" });
    expect(repeated).toMatchObject({ status: 200, body: { ok: true, repeated: true } });

    const events = readEvents(root, id);
    expect(events.filter((event) => event.kind === "approval").map((event) => event.phase)).toEqual(["proposed", "approved", "applied"]);
    expect(events.find((event) => event.phase === "approved")?.source_message).toMatch(/^E-/);
    expect(execFileSync("node", [cli, "contract", "validate", id, "--json"], { cwd: root, encoding: "utf8" })).toContain('"state":"defined"');

    await stop(first.server);
    servers.splice(servers.indexOf(first.server), 1);
    const restarted = await start(root);
    if (!restarted) throw new Error("The restarted server could not bind after the first one succeeded.");
    const workspace = await fetch(`${restarted.base}/api/workspace`).then((response) => response.json()) as { events: Array<{ approval_id?: string; phase?: string }> };
    expect(workspace.events.filter((event) => event.approval_id === approvalId).map((event) => event.phase)).toEqual(["proposed", "approved", "applied"]);
  });

  test("ambiguous or unknown input cannot approve anything", async () => {
    const { root, id } = fixture();
    const started = await start(root);
    if (!started) return;
    const { base } = started;
    const result = await post(base, "/api/approval/decide", { approvalId: "ok", decision: "approve" });
    expect(result.status).toBe(409);
    const overbroad = await post(base, "/api/approval/propose", { entity: id, action: "contract.sign", payload: { disposition: "reject" } });
    expect(overbroad.status).toBe(400);
    expect(String(overbroad.body.error)).toContain("does not accept an approval payload");
    expect(execFileSync("node", [cli, "contract", "validate", id, "--json"], { cwd: root, encoding: "utf8" })).toContain('"state":"backlog"');
    expect(readEvents(root, id)).toEqual([]);
  });

  test("a failed application is durable and leaves lifecycle state unchanged", async () => {
    const { root, id } = fixture();
    const started = await start(root);
    if (!started) return;
    const proposed = await post(started.base, "/api/approval/propose", { entity: id, action: "contract.sign", payload: {} });
    const approvalId = (proposed.body.event as { approval_id: string }).approval_id;

    const filename = readdirSync(join(root, ".kotta/backlog")).find((name) => name.endsWith(".md"))!;
    const path = join(root, ".kotta/backlog", filename);
    writeFileSync(path, readFileSync(path, "utf8").replace("- Read the canonical event history.", ""));
    execFileSync("git", ["add", path], { cwd: root });
    execFileSync("git", ["commit", "-m", "make contract invalid after proposal"], { cwd: root });

    const failed = await post(started.base, "/api/approval/decide", { approvalId, decision: "approve" });
    expect(failed.status).toBe(409);
    expect(readEvents(root, id).filter((event) => event.kind === "approval").map((event) => event.phase)).toEqual(["proposed", "approved", "failed"]);
    expect(execFileSync("node", [cli, "contract", "validate", id, "--json"], { cwd: root, encoding: "utf8" })).toContain('"state":"backlog"');
  });
});
