// @vitest-environment jsdom
//
// Passive board navigation only reads. Scoped chat and approval writes appear after an
// entity is opened; merely browsing views never mutates canonical state.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { App } from "../../ui/src/App";
import { decision, observation, batch, contract, workspace } from "./fixtures";

const WRITE_PATHS = ["/api/chat", "/api/contract/sign", "/api/batch", "/api/batch/contracts", "/api/observation", "/api/observation/resolve"];

const data = workspace({
  contracts: [
    contract("T-012", "Make the UI workspace argument explicit", { status: "active", batch: "P-003", assigned_agent: "codex", source_observation: "F-001" }),
    contract("T-013", "Add a discoverable bug-reporting path", { status: "review", batch: "P-003" }),
    contract("T-014", "Port collision returns raw EADDRINUSE", { status: "defined" }),
    contract("T-029", "Reading the board makes no per-file git call", { status: "done" }),
  ],
  batches: [batch("P-003", "Trustworthy daily use", { status: "active", contracts: ["T-012", "T-013"] })],
  observations: [observation("F-001", "CLI help contradicts the --workspace default"), observation("F-002", "The board hides worktree state", { status: "resolved", became: "T-029" })],
  decisions: [decision("D-001", "The directory is the state")],
});

let calls: Array<{ url: string; method: string }>;

beforeEach(() => {
  calls = [];
  vi.stubGlobal("fetch", (input: unknown, init?: { method?: string }) => {
    calls.push({ url: String(input), method: init?.method ?? "GET" });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) } as Response);
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function boot() {
  render(<App />);
  await screen.findByRole("heading", { name: "Waiting on you" });
}
/** The rail is the only thing that navigates, so views are switched through it. */
function go(view: string) {
  const rail = screen.getByRole("navigation", { name: "Board sections" });
  fireEvent.click(within(rail).getByRole("button", { name: new RegExp(view) }));
}

describe("Passive board navigation", () => {
  it("loads the workspace through one GET and nothing else", async () => {
    await boot();
    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(new Set(calls.map((call) => call.url))).toEqual(new Set(["/api/workspace"]));
    expect(new Set(calls.map((call) => call.method))).toEqual(new Set(["GET"]));
  });

  it("keeps mutation controls inside entity drawers", async () => {
    await boot();
    const views = ["Observations", "Contracts", "Batches", "Decisions", "Home"];
    let rendered = document.body.innerHTML;
    for (const view of views) {
      go(view);
      rendered += document.body.innerHTML;
    }
    // both overlays too
    fireEvent.keyDown(window, { key: "w" });
    rendered += document.body.innerHTML;
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.keyDown(window, { key: "?" });
    rendered += document.body.innerHTML;
    fireEvent.keyDown(window, { key: "Escape" });

    for (const path of WRITE_PATHS) expect(rendered).not.toContain(`"${path}"`);
    expect(rendered).not.toMatch(/<form\b/);
    expect(rendered).not.toMatch(/type="submit"/);
    // What it does offer instead: the command, spelled out.
    expect(rendered).toContain("kotta contract execute T-014 --agent codex");
  });

  it("clicking every control on every view still issues no write", async () => {
    await boot();
    for (const view of ["Home", "Observations", "Contracts", "Batches", "Decisions"]) {
      go(view);
      // Click everything that is currently on screen, then close whatever it opened.
      const controls = screen.getAllByRole("button");
      for (const control of controls) {
        await act(async () => { fireEvent.click(control); });
        fireEvent.keyDown(window, { key: "Escape" });
      }
    }
    await waitFor(() => expect(calls.every((call) => call.method === "GET" && call.url === "/api/workspace")).toBe(true));
  });

  it("presents the CLI as a fallback to chat-first approvals", async () => {
    await boot();
    fireEvent.click(screen.getByRole("button", { name: /CLI/ }));
    const sheet = await screen.findByRole("dialog", { name: "CLI fallback" });
    expect(sheet.textContent).toContain("Chat is the primary approval surface.");
    expect(sheet.textContent).toContain("kotta contract close <id> --approve");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the last good read on screen and offers a retry when a refresh fails", async () => {
    await boot();
    vi.stubGlobal("fetch", () => Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) } as Response));
    fireEvent.click(screen.getByRole("button", { name: /Refresh/ }));
    const banner = await screen.findByRole("alert");
    expect(banner.textContent).toContain("Last read failed.");
    expect(banner.textContent).toContain("GET /api/workspace");
    expect(banner.textContent).toContain("HTTP 500");
    // The bands are still there — one failing read does not blank the board.
    expect(screen.getByRole("heading", { name: "What runs next?" })).toBeDefined();
  });
});
